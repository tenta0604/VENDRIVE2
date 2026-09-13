@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ai-runner.ps1" %*
set "RUNNER_EXIT=%ERRORLEVEL%"
if not "%RUNNER_EXIT%"=="0" (
  echo.
  echo VENDRIVE2 AI runner failed. See logs under %%LOCALAPPDATA%%\VENDRIVE2-AI\logs.
  pause
)
exit /b %RUNNER_EXIT%
