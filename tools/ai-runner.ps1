[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$SmokeTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = 'E:\VENDRIVE2'
$ExpectedRoot = 'E:/VENDRIVE2'
$RunnerHome = Join-Path $env:LOCALAPPDATA 'VENDRIVE2-AI'
$LogDirectory = Join-Path $RunnerHome 'logs'
$LockPath = Join-Path $RunnerHome 'runner.lock'
$StartedAt = [DateTime]::UtcNow.ToString('o')
$RunId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$StdoutPath = Join-Path $LogDirectory ($RunId + '.stdout.log')
$StderrPath = Join-Path $LogDirectory ($RunId + '.stderr.log')
$MetadataPath = Join-Path $LogDirectory ($RunId + '.metadata.json')
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$LockStream = $null
$ExitCode = 1
$RunMode = 'Phase'
if ($DryRun) { $RunMode = 'DryRun' }
if ($SmokeTest) { $RunMode = 'SmokeTest' }
$Metadata = [ordered]@{
    evidenceVersion = 1
    runId = $RunId
    dryRun = [bool]$DryRun
    smokeTest = [bool]$SmokeTest
    runMode = $RunMode
    repository = $RepoRoot
    startedAt = $StartedAt
    finishedAt = $null
    status = 'STARTING'
    exitCode = $null
    phaseBefore = $null
    phaseAfter = $null
    headBefore = $null
    headAfter = $null
    codexVersion = $null
    codexExitCode = $null
    stdout = $StdoutPath
    stderr = $StderrPath
    error = $null
}

function Write-Utf8File {
    param([string]$Path, [AllowEmptyString()][string]$Content)
    [IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

function Write-Metadata {
    Write-Utf8File -Path $MetadataPath -Content ($Metadata | ConvertTo-Json -Depth 10)
}

function Invoke-GitText {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    $Output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ('git ' + ($Arguments -join ' ') + ' failed: ' + (($Output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine))
    }
    return (($Output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine).Trim()
}

function Read-State {
    $Path = Join-Path $RepoRoot '.ai\STATE.json'
    try {
        return (Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json)
    }
    catch {
        throw ('STATE JSON is invalid: ' + $_.Exception.Message)
    }
}

function Assert-VersionConsistency {
    param($State)
    $Index = Get-Content -LiteralPath (Join-Path $RepoRoot 'index.html') -Raw
    $Analytics = Get-Content -LiteralPath (Join-Path $RepoRoot 'analytics.js') -Raw
    $VersionJson = Get-Content -LiteralPath (Join-Path $RepoRoot 'version.json') -Raw | ConvertFrom-Json
    $AppMatch = [regex]::Match($Index, "APP_VERSION='([^']+)'")
    $EngineMatch = [regex]::Match($Analytics, 'ENGINE_VERSION="([^"]+)"')
    $DbMatch = [regex]::Match($Analytics, 'DB_VERSION=(\d+)')
    $SchemaMatch = [regex]::Match($Analytics, 'SCHEMA_VERSION=(\d+)')
    if (-not ($AppMatch.Success -and $EngineMatch.Success -and $DbMatch.Success -and $SchemaMatch.Success)) {
        throw 'Production version constants could not be read.'
    }
    $Actual = [ordered]@{
        app = $AppMatch.Groups[1].Value
        engine = $EngineMatch.Groups[1].Value
        db = [int]$DbMatch.Groups[1].Value
        schema = [int]$SchemaMatch.Groups[1].Value
    }
    if ($VersionJson.version -ne $Actual.app -or $State.appVersion -ne $Actual.app -or $State.engineVersion -ne $Actual.engine -or [int]$State.dbVersion -ne $Actual.db -or [int]$State.schemaVersion -ne $Actual.schema) {
        throw 'STATE and production versions are inconsistent.'
    }
    return $Actual
}

function Assert-RoadmapConsistency {
    param($State)
    $Roadmap = Get-Content -LiteralPath (Join-Path $RepoRoot 'AI_ROADMAP.md') -Raw
    $CompletedPattern = 'Latest completed phase:\s*\*\*' + [regex]::Escape([string]$State.completedPhase) + '\s'
    $NextPattern = 'Next phase:\s*\*\*' + [regex]::Escape([string]$State.nextPhase) + '\s'
    if ($Roadmap -notmatch $CompletedPattern -or $Roadmap -notmatch $NextPattern) {
        throw 'ROADMAP completed/next phase does not match STATE.'
    }
}

function Invoke-Preflight {
    Invoke-GitText fetch origin | Out-Null
    $Root = Invoke-GitText rev-parse --show-toplevel
    $Branch = Invoke-GitText branch --show-current
    $Head = Invoke-GitText rev-parse HEAD
    $OriginHead = Invoke-GitText rev-parse origin/main
    $AheadBehind = Invoke-GitText rev-list --left-right --count main...origin/main
    $Working = Invoke-GitText status --porcelain
    if ($Root.Replace('\', '/').TrimEnd('/') -ne $ExpectedRoot -or $Branch -ne 'main' -or $Working -ne '' -or $Head -ne $OriginHead -or $AheadBehind -ne "0`t0") {
        throw "Git preflight failed: root=$Root branch=$Branch clean=$($Working -eq '') head=$Head origin=$OriginHead aheadBehind=$AheadBehind"
    }
    $State = Read-State
    if ($State.status -ne 'ready' -or [string]::IsNullOrWhiteSpace([string]$State.completedPhase) -or [string]::IsNullOrWhiteSpace([string]$State.nextPhase)) {
        throw 'STATE is not ready for one-phase execution.'
    }
    $Versions = Assert-VersionConsistency -State $State
    Assert-RoadmapConsistency -State $State
    return [ordered]@{ root = $Root; branch = $Branch; head = $Head; origin = $OriginHead; aheadBehind = $AheadBehind; state = $State; versions = $Versions }
}

function Get-CodexDiscovery {
    $Command = Get-Command codex.cmd -CommandType Application -ErrorAction Stop
    if ([IO.Path]::GetExtension($Command.Source) -ne '.cmd') {
        throw 'Codex discovery did not resolve codex.cmd.'
    }
    $VersionOutput = & $Command.Source --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'codex.cmd --version failed.' }
    $HelpOutput = & $Command.Source exec --help 2>&1
    $HelpText = $HelpOutput | Out-String
    if ($LASTEXITCODE -ne 0 -or $HelpText -notmatch 'Run Codex non-interactively' -or $HelpText -notmatch '--sandbox' -or $HelpText -notmatch '--ephemeral' -or $HelpText -notmatch '--cd') {
        throw 'codex.cmd exec is unavailable or incompatible.'
    }
    return [ordered]@{ path = $Command.Source; version = (($VersionOutput | ForEach-Object { [string]$_ }) -join ' ').Trim() }
}

function Invoke-CodexProcess {
    param([string]$CodexPath, [string]$Prompt)
    $StartInfo = New-Object Diagnostics.ProcessStartInfo
    $StartInfo.FileName = $env:ComSpec
    $StartInfo.Arguments = '/d /s /c ""' + $CodexPath + '" exec --sandbox workspace-write --ephemeral -C "' + $RepoRoot + '" --color never -"'
    $StartInfo.WorkingDirectory = $RepoRoot
    $StartInfo.UseShellExecute = $false
    $StartInfo.CreateNoWindow = $true
    $StartInfo.RedirectStandardInput = $true
    $StartInfo.RedirectStandardOutput = $true
    $StartInfo.RedirectStandardError = $true
    $Process = New-Object Diagnostics.Process
    $Process.StartInfo = $StartInfo
    if (-not $Process.Start()) { throw 'Codex process failed to start.' }
    $StdoutTask = $Process.StandardOutput.ReadToEndAsync()
    $StderrTask = $Process.StandardError.ReadToEndAsync()
    $Process.StandardInput.WriteLine($Prompt)
    $Process.StandardInput.Close()
    $Process.WaitForExit()
    $Stdout = $StdoutTask.GetAwaiter().GetResult()
    $Stderr = $StderrTask.GetAwaiter().GetResult()
    Write-Utf8File -Path $StdoutPath -Content $Stdout
    Write-Utf8File -Path $StderrPath -Content $Stderr
    return [ordered]@{ exitCode = $Process.ExitCode; stdout = $Stdout; stderr = $Stderr }
}

function Get-SmokeProtectedHashes {
    $Paths = @('analytics.js', 'analytics.css', 'index.html', 'version.json', 'manifest.webmanifest', '.ai\STATE.json', '.ai\LAST_RUN.json')
    $Hashes = [ordered]@{}
    foreach ($Path in $Paths) {
        $Hashes[$Path] = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $RepoRoot $Path)).Hash
    }
    return $Hashes
}

function Assert-LastRunEvidence {
    param($Before, $After, $Versions)
    $Path = Join-Path $RepoRoot '.ai\LAST_RUN.json'
    try { $Evidence = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json }
    catch { throw ('LAST_RUN evidence is missing or invalid: ' + $_.Exception.Message) }
    if ($Evidence.status -ne 'PASS' -or $Evidence.phase -ne $Before.state.nextPhase -or $Evidence.base.head -ne $Before.head -or [string]::IsNullOrWhiteSpace([string]$Evidence.base.safetyTag) -or $Evidence.base.safetyTagTarget -ne $Before.head) {
        throw 'LAST_RUN phase/base evidence is inconsistent.'
    }
    if ($Evidence.versions.app -ne $Versions.app -or $Evidence.versions.engine -ne $Versions.engine -or [int]$Evidence.versions.db -ne $Versions.db -or [int]$Evidence.versions.schema -ne $Versions.schema) {
        throw 'LAST_RUN version evidence is inconsistent.'
    }
    if ($null -eq $Evidence.gates -or $null -eq $Evidence.changedFiles -or $null -eq $Evidence.unresolved -or @($Evidence.unresolved).Count -ne 0) {
        throw 'LAST_RUN gate or unresolved evidence is incomplete.'
    }
    $ForbiddenNames = @('stableCommit', 'currentCommit', 'commitSha')
    foreach ($Name in $ForbiddenNames) {
        if ($Evidence.PSObject.Properties.Name -contains $Name) { throw ('LAST_RUN contains self-referential field: ' + $Name) }
    }
}

function Invoke-PostRunVerification {
    param($Before)
    Invoke-GitText fetch origin | Out-Null
    $Working = Invoke-GitText status --porcelain
    $Head = Invoke-GitText rev-parse HEAD
    $OriginHead = Invoke-GitText rev-parse origin/main
    $AheadBehind = Invoke-GitText rev-list --left-right --count main...origin/main
    if ($Working -ne '' -or $Head -ne $OriginHead -or $AheadBehind -ne "0`t0") {
        throw "Post-run Git verification failed: clean=$($Working -eq '') head=$Head origin=$OriginHead aheadBehind=$AheadBehind"
    }
    $State = Read-State
    if ($State.completedPhase -ne $Before.state.nextPhase -or $State.nextPhase -eq $Before.state.nextPhase -or [string]::IsNullOrWhiteSpace([string]$State.nextPhase) -or $State.status -ne 'ready') {
        throw 'Post-run STATE did not advance exactly one phase.'
    }
    $Versions = Assert-VersionConsistency -State $State
    Assert-RoadmapConsistency -State $State
    Assert-LastRunEvidence -Before $Before -After $State -Versions $Versions
    return [ordered]@{ head = $Head; state = $State; versions = $Versions }
}

try {
    if ($DryRun -and $SmokeTest) {
        throw 'DryRun and SmokeTest cannot be used together.'
    }
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    try {
        $LockStream = [IO.File]::Open($LockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    }
    catch {
        throw 'Another VENDRIVE2 AI runner is active, or the concurrency lock cannot be acquired.'
    }
    $LockPayload = [Text.Encoding]::UTF8.GetBytes((@{ pid = $PID; runId = $RunId; startedAt = $StartedAt } | ConvertTo-Json -Compress))
    $LockStream.SetLength(0)
    $LockStream.Write($LockPayload, 0, $LockPayload.Length)
    $LockStream.Flush()
    Write-Utf8File -Path $StdoutPath -Content ''
    Write-Utf8File -Path $StderrPath -Content ''
    Write-Metadata

    Set-Location -LiteralPath $RepoRoot
    $Before = Invoke-Preflight
    $Metadata.phaseBefore = [string]$Before.state.nextPhase
    $Metadata.headBefore = [string]$Before.head
    $Discovery = Get-CodexDiscovery
    $Metadata.codexVersion = [string]$Discovery.version

    if ($DryRun) {
        Write-Utf8File -Path $StdoutPath -Content ("DRY_RUN PASS`r`nHEAD: $($Before.head)`r`nNext phase: $($Before.state.nextPhase)`r`nCodex: $($Discovery.version)`r`n")
        $Metadata.status = 'PASS'
        $Metadata.phaseAfter = [string]$Before.state.nextPhase
        $Metadata.headAfter = [string]$Before.head
        $ExitCode = 0
        Write-Output "DRY_RUN PASS: preflight, STATE, versions, ROADMAP, lock, logs, and Codex CLI discovery are valid."
    }
    elseif ($SmokeTest) {
        $ProtectedBefore = Get-SmokeProtectedHashes
        $SmokePrompt = 'Return exactly WORKSPACE_WRITE_SMOKE_OK. Do not modify files, repository state, STATE, or LAST_RUN. Do not run Git commands, commit, push, or implement AN8B.'
        $CodexResult = Invoke-CodexProcess -CodexPath ([string]$Discovery.path) -Prompt $SmokePrompt
        $Metadata.codexExitCode = [int]$CodexResult.exitCode
        if ([int]$CodexResult.exitCode -ne 0) { throw "Codex smoke test exited with code $($CodexResult.exitCode). No retry was attempted." }
        if ([string]$CodexResult.stdout -notmatch 'WORKSPACE_WRITE_SMOKE_OK') { throw 'Codex smoke test response token was not found.' }
        $AfterSmoke = Invoke-Preflight
        if ($AfterSmoke.head -ne $Before.head) { throw 'Smoke test changed Git HEAD.' }
        $ProtectedAfter = Get-SmokeProtectedHashes
        foreach ($Path in $ProtectedBefore.Keys) {
            if ($ProtectedAfter[$Path] -ne $ProtectedBefore[$Path]) { throw ('Smoke test changed protected file: ' + $Path) }
        }
        $Metadata.status = 'PASS'
        $Metadata.phaseAfter = [string]$Before.state.nextPhase
        $Metadata.headAfter = [string]$Before.head
        $ExitCode = 0
        Write-Output 'SMOKE_TEST PASS: codex.cmd completed in workspace-write without repository or protected-file changes.'
    }
    else {
        $PhasePrompt = 'Advance exactly one phase. Follow AGENTS.md, AI_ROADMAP.md, .ai/STATE.json, and .ai/WORKFLOW.md strictly. Before a successful commit, write actual gate evidence to .ai/LAST_RUN.json. Do not output credentials or secrets.'
        $CodexResult = Invoke-CodexProcess -CodexPath ([string]$Discovery.path) -Prompt $PhasePrompt
        $Metadata.codexExitCode = [int]$CodexResult.exitCode
        if ([int]$CodexResult.exitCode -ne 0) { throw "Codex exited with code $($CodexResult.exitCode). No retry was attempted." }
        $After = Invoke-PostRunVerification -Before $Before
        $Metadata.status = 'PASS'
        $Metadata.phaseAfter = [string]$After.state.completedPhase
        $Metadata.headAfter = [string]$After.head
        $ExitCode = 0
        Write-Output "PASS: phase $($After.state.completedPhase) completed at $($After.head). Runner stopped after one phase."
    }
}
catch {
    $Metadata.status = 'FAIL'
    $Metadata.error = $_.Exception.Message
    try { [IO.File]::AppendAllText($StderrPath, ($_.Exception.ToString() + [Environment]::NewLine), $Utf8NoBom) } catch {}
    [Console]::Error.WriteLine('AI runner FAIL: ' + $_.Exception.Message)
    $ExitCode = 1
}
finally {
    $Metadata.finishedAt = [DateTime]::UtcNow.ToString('o')
    $Metadata.exitCode = $ExitCode
    try { if (Test-Path -LiteralPath $LogDirectory) { Write-Metadata } } catch {}
    if ($null -ne $LockStream) {
        $LockStream.Dispose()
        try { Remove-Item -LiteralPath $LockPath -Force -ErrorAction Stop } catch {}
    }
}

exit $ExitCode
