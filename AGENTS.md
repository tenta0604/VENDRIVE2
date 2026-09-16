# VENDRIVE2 AI Development Rules

## Repository and architecture

- Repository: `tenta0604/VENDRIVE2`
- Local root: `E:\VENDRIVE2`
- Production branch: `main`
- Preserve the current direct HTML/JavaScript architecture. Do not rewrite it in React.
- Do not add unnecessary dependencies, packages, CDNs, or external scripts.
- Avoid large refactors unless a phase explicitly requires one.
- Never modify the old `tenta0604/VENDRIVE` repository.

## Canonical project state and chat recovery

- GitHub `main`, not the chat transcript, is the durable source of truth for project continuity.
- The canonical recovery set is `AGENTS.md`, `.ai/STATE.json`, `AI_ROADMAP.md`, `.ai/LAST_RUN.json`, `.ai/DECISIONS.md`, and `.ai/WORKFLOW.md`.
- At the start of a new VENDRIVE2 chat, or whenever the user gives a short resume instruction such as `VENDRIVE続き`, fetch the latest `main` first and read the canonical recovery set before deciding what to do next.
- Do not require the user to paste a long migration prompt, reconstruct progress manually, or summarize the previous chat when repository state can be recovered directly.
- If the current chat becomes long enough that context loss or migration risk is increasing, proactively recommend moving to a new chat instead of waiting for the user to ask.
- Before recommending migration, update the canonical state files so the next chat can recover the current phase, progress, unresolved items, required user input, and next action from GitHub alone.
- When new confirmed product decisions are made, update `.ai/DECISIONS.md` during the same safe work cycle rather than leaving them only in conversation history.
- If chat context and canonical files disagree, do not silently guess. Prefer the latest verified `main` state, then reconcile only with explicit newer user instructions or independently verifiable repository evidence.

## Execution ownership and tool routing

- ChatGPT is the default lead and executor for VENDRIVE2 development. Prefer direct execution through ChatGPT's connected GitHub capabilities, GitHub Actions, and other available tools when they can complete the work safely at comparable or better quality.
- Do not ask the user to copy prompts, patches, logs, or handoff messages to Codex as the normal development workflow. Human relay between ChatGPT and Codex is not a standard step.
- Before assigning any development step to the user, first determine whether ChatGPT, GitHub, GitHub Actions, another connected tool, or an available automation can perform it directly.
- Ask the user to act only when explicit consent, credentials/security action, production or user-data risk, materially different product/UX judgment, factual input that cannot be derived safely, or genuinely local/physical interaction is required.
- Escalate to Codex only when the selected phase materially benefits from capabilities unavailable or impractical in the direct ChatGPT workflow, such as substantial local-only execution, very large multi-file migration, or a difficult local build/debug loop.
- If Codex is needed, explain the specific reason first and minimize the scope of the handoff. Do not silently revert to the old `ChatGPT -> user copy/paste -> Codex -> user copy/paste -> ChatGPT` workflow.
- Codex availability or usage limits must not block work that ChatGPT and connected tools can safely complete themselves.

## Autonomous continuation / hard terminal-state rule

A user instruction such as `進めて`, `続けて`, `やって`, or an equivalent continuation instruction is an execution command, not a request for a progress message.

After accepting such an instruction, do not end the assistant turn merely because a tool returned an intermediate state. Continue selecting and executing the next available safe action until exactly one terminal state is reached:

1. `COMPLETE` — the selected phase/scope is implemented, all finite required gates passed, deployment/live evidence required by the scope is terminal and verified, canonical bookkeeping is consistent, and planned cleanup is complete.
2. `HUMAN_REQUIRED` — the next necessary action genuinely requires local/physical interaction, factual input unavailable to tools, credentials/security action, or a materially different UX/product decision from the user.
3. `TECHNICAL_BLOCKER` — a real tool/platform/access/runtime limit prevents further execution in this turn and no available connected tool or safe alternate route can continue.
4. `IRREVERSIBLE_APPROVAL_REQUIRED` — the next necessary action is destructive, irreversible, or carries production/user-data risk requiring explicit approval.

The following are explicitly NON-TERMINAL states and must never by themselves cause a reply or empty turn ending: `queued`, `pending`, `in_progress`, `waiting`, `deployment running`, `workflow running`, `tag pending`, `branch created`, `PR opened`, `merge pending`, `skipped` when another required action remains, partial verification, partial bookkeeping, or a tool result that merely says the work has started.

For every non-terminal result, immediately determine the next safe action. This may be another tool call, checking the relevant terminal status, using a different connected tool, completing bookkeeping, cleanup, verification, or advancing within the already-selected phase.

Never send an empty assistant response after an execution command. Never send `進めてる`, `このまま進める`, `待っている`, or another progress-only response as a substitute for continued execution. Progress narration is not a terminal state.

If an external asynchronous job is still running, treat it as `WAITING_EXTERNAL` internally, which is non-terminal. Continue checking only the finite status needed for the current scope. If the current tool/runtime cannot wait or poll further, use another available safe route; only if no route exists may this become `TECHNICAL_BLOCKER`, and the response must identify the exact blocker and durable resume point.

Before any final response after a continuation command, perform a terminal-state self-check: `Which of COMPLETE / HUMAN_REQUIRED / TECHNICAL_BLOCKER / IRREVERSIBLE_APPROVAL_REQUIRED is true?` If none is true, do not respond yet; continue execution.

This terminal-state rule applies across new chats. New-chat recovery must reload it from `AGENTS.md` before resuming work. Chat memory or personalization is supplementary, not the enforcement source.

## Development philosophy

- Keep Analytics layers separate: `RAW` → `COMPUTED` → `RECOMMENDATION`.
- Never overwrite raw data with computed results.
- Analytics must not automatically change legacy schedules or the Today plan.
- Recommendations must follow: proposal → user adoption → final confirmation → legacy write.

## One phase per run

- A request such as 「次進めて」 advances exactly one development phase by default.
- Do not implement later phases speculatively.
- Within the selected phase, complete necessary implementation, fixes, and verification before stopping.
- After the phase completes, stop and wait for the next instruction.
- Repository-state maintenance, chat-recovery updates, and documentation-only continuity work are operational maintenance rather than a product phase; they must not advance `completedPhase` or `nextPhase` by themselves.

## Preflight for every phase

Before editing, verify the repository root, `main` branch, `HEAD`, `origin/main`, working tree, and ahead/behind counts. Fetch origin first when network access is available. If the tree is dirty, history diverges, or the baseline is unexpected, do not repair it automatically; report `SAFE STOP`.

Also verify the canonical state set is internally consistent: STATE completed/next phase must agree with ROADMAP, LAST_RUN must identify the latest completed operation and next action, and DECISIONS must not conflict with the intended change.

## Git safety and commit policy

- Before editing production code in any phase, create an immutable annotated safety tag at the verified pre-edit `HEAD`.
- If the chosen tag name already exists, dereference it and continue only when it points to that exact `HEAD`; a same-name tag at another SHA requires `SAFE STOP`.
- Never move, delete, recreate over, or force-update an existing safety tag.
- Never use `git reset --hard`, destructive `git restore`, `git checkout -- .`, `git clean`, stash to hide changes, rebase, force push, history rewriting, or moving/deleting an existing safety tag.
- Preserve unrelated user changes.
- Commit and push only when every required gate passes.
- If any required gate fails or remains unresolved: `NO COMMIT`, `NO PUSH`.
- Documentation-only canonical-state maintenance that does not change production code does not require a new production safety tag, but still requires a verified synchronized main baseline and consistency checks.

## Verification

- Select gates appropriate to the change: syntax checks, `git diff --check`, build, functional tests, and real-browser tests.
- Browser/IndexedDB phases that require real Edge evidence cannot pass on mocks alone.
- Reuse the proven Microsoft Edge + localhost + dedicated TEMP profile + CDP approach.
- Never perform test database operations in a normal Edge profile.
- Before every successful phase commit, write actual machine-readable gate evidence to `.ai/LAST_RUN.json`.
- Evidence must identify the phase, pre-edit base SHA and immutable safety tag, versions, gate results, changed files, and unresolved issues.
- Mark a gate `NOT_REQUIRED` only with a reason. Never record planned, assumed, or unexecuted checks as `PASS`.
- `.ai/LAST_RUN.json` must not store the current commit SHA; Git `HEAD` / `origin/main` remains authoritative.
- For continuity-only maintenance, LAST_RUN may use an operational run name instead of a product phase, but it must still record the baseline, checks, changed files, open items, and exact next action.

## Data and operational safety

- Destructive actions or operations that may affect production data, normal browser profiles, or existing user data require explicit user approval.
- Dedicated TEMP fixtures may be used only within the phase's authorized scope.
- Do not initialize, erase, or silently migrate user data unless the phase explicitly requires and safely validates it.

## Versioning and compatibility

- Change `APP_VERSION` or `ENGINE_VERSION` only when the phase explicitly requires it.
- Change `DB_VERSION` or `SCHEMA_VERSION` only for a phase that requires a schema migration.
- Do not rename or remove existing public APIs without an explicit breaking-change specification.
- Do not store the current commit SHA inside `.ai/STATE.json` or another state file contained by that commit.
- The current synchronized `HEAD` / `origin/main` pair is authoritative for Git revision identity.
- Track phase state with `completedPhase`, `nextPhase`, application/engine/database/schema versions, and status.

## Result reporting

On success, report concisely:

- `PHASE: PASS`
- commit SHA, parent SHA, and commit message
- changed files and versions
- major gates
- `unresolved: none`

On failure, report:

- `PHASE: SAFE STOP`
- failing gate
- `HEAD`, `origin/main`, changed files, and unresolved issue

Do not rely on the user copying a long report elsewhere. Leave independently reviewable evidence in GitHub commit history, diffs, tags, workflow runs, and the canonical state files.

## Finite verification / anti-loop rule

- Before starting verification, define the finite gate checklist required to call the current scope complete.
- Once every required gate has passed, stop verification and report completion. Do not add another "just in case" gate or repeat the same check merely for reassurance.
- Re-run a gate only when code, test methodology, deployment state, or another relevant precondition actually changed after that gate ran.
- Distinguish product defects from test-harness/test-data problems. A harness failure may justify fixing the harness and re-running the affected finite checklist, but it must not trigger unrelated new verification loops.
- For deployment waits, check only until the required terminal evidence is available; after the deployment and live-version evidence pass, stop polling.
- If new contradictory evidence appears later (for example a real-device bug report), open a new scoped maintenance phase instead of retroactively extending a completed gate loop.
