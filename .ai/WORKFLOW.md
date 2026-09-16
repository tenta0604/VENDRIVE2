# VENDRIVE2 AI Phase Workflow

## Recovery / new-chat bootstrap

When a new chat starts with a short instruction such as `VENDRIVE続き`, do not ask for a handoff prompt. Recover from GitHub first:

1. Fetch latest `main` and verify its current HEAD.
2. Read `AGENTS.md` completely, including `Autonomous continuation / hard terminal-state rule`, before taking or reporting any development action.
3. Read `.ai/STATE.json` completely and validate it as JSON.
4. Read `AI_ROADMAP.md` completely.
5. Read `.ai/LAST_RUN.json` completely and validate it as JSON.
6. Read `.ai/DECISIONS.md` completely.
7. Read this `.ai/WORKFLOW.md` completely.
8. Verify that STATE completed/next phase agrees with ROADMAP and that LAST_RUN/DECISIONS do not contradict STATE.
9. Use STATE current work, required user input, unresolved items, and LAST_RUN next action to resume from the previous work boundary.
10. Only ask the user for missing context when it cannot be recovered safely from repository evidence or connected tools.

The conversation transcript is not authoritative project memory. GitHub `main` plus the canonical files above is. The terminal-state rule in `AGENTS.md` is mandatory in every chat, including a freshly migrated chat.

## Continuation-command control loop

For `進めて`, `続けて`, `やって`, `次進めて`, and equivalent execution instructions, wrap the selected phase/scope in this control loop:

`RECOVER -> PREFLIGHT -> SAFETY -> IMPLEMENT -> VERIFY -> COMMIT/MERGE -> DEPLOY -> LIVE_VERIFY -> BOOKKEEP/CLEANUP -> TERMINAL_CHECK`

At `TERMINAL_CHECK`, return to the user only if one of these is true:
- `COMPLETE`
- `HUMAN_REQUIRED`
- `TECHNICAL_BLOCKER`
- `IRREVERSIBLE_APPROVAL_REQUIRED`

Otherwise select the next safe action and continue the loop in the same assistant turn. Intermediate tool states are not response states.

Mandatory handling of asynchronous work:
- `queued`, `pending`, and `in_progress` remain inside the loop.
- Poll only the specific finite job/status needed for the scope; do not create an unbounded verification loop.
- A workflow marked `skipped` is terminal only for that workflow, not for the overall phase; if required work remains, continue through another safe action.
- A deployment is complete only after the required terminal deployment conclusion is obtained and any required live-version/content evidence is verified.
- If the tool/runtime makes further waiting impossible, try available alternate connected routes before declaring `TECHNICAL_BLOCKER`.
- Never produce an empty response to an execution instruction.

Mandatory handling of bookkeeping:
- Prefer including STATE/LAST_RUN/ROADMAP/DECISIONS updates in the same safe phase change when possible, instead of generating a chain of post-merge production commits and repeated deployments.
- Post-deployment evidence that does not need to alter the deployed app should be stored in non-production evidence surfaces when practical rather than triggering another Pages deployment solely for bookkeeping.
- If canonical files do require a follow-up commit, that follow-up deployment becomes part of the same non-terminal control loop until its required terminal evidence is reached.

## Proactive chat migration

When the current chat becomes long enough that context loss or migration risk is increasing:

1. Do not wait for the user to request a migration prompt.
2. Finish or safely stop the current atomic work item at one of the four hard terminal states.
3. Update `.ai/STATE.json` with current implementation state, active phase, progress, required user input, and unresolved items.
4. Update `.ai/LAST_RUN.json` with the most recent completed operation and exact next action.
5. Update `AI_ROADMAP.md` only when development order/status actually changed.
6. Update `.ai/DECISIONS.md` when a confirmed decision from the chat is not yet durable in GitHub.
7. Verify all canonical files are internally consistent and on `main`.
8. Proactively tell the user a new chat is recommended. The user should only need a short resume instruction such as `VENDRIVE続き`.

Do not make the user manually summarize progress or maintain a long migration prompt. The next chat must reload the terminal-state rule from `AGENTS.md`, so continuity does not depend on conversational memory alone.

## Product phase execution

When the user says 「次進めて」, execute this workflow for exactly one product phase:

1. Perform the Recovery / new-chat bootstrap checks above.
2. Fetch origin, then run Git and state preflight:
   - verify the repository root and require branch `main`;
   - require a clean working tree;
   - require `HEAD` to equal `origin/main` and `main...origin/main` = `0 0`;
   - require STATE `appVersion`, `engineVersion`, `dbVersion`, and `schemaVersion` to match the production code;
   - require ROADMAP completed/next phase to match STATE `completedPhase` / `nextPhase`.
   Before editing a phase that changes production code, create an immutable annotated safety tag at the verified pre-edit `HEAD`. If the selected name already exists, continue only when its dereferenced target is that exact SHA; otherwise `SAFE STOP`. Never move, delete, recreate over, or force-update an existing tag.
   On any mismatch, do not repair automatically; `SAFE STOP`.
3. Identify `STATE.nextPhase`.
4. Read that phase's purpose and boundary from the roadmap plus any locked constraints in DECISIONS, inspect the current code, and turn the boundary into a necessary and sufficient implementation specification. Do not implement later phases.
5. Resolve ambiguity autonomously when existing design and safety principles determine a reasonable answer.
6. Stop for user confirmation only when required by one of these conditions:
   - destructive action;
   - production or user-data risk;
   - materially different UX/product choices;
   - a change to roadmap priority;
   - security or credential action;
   - factual input that cannot be derived safely.
7. Implement the selected phase with minimal scoped changes.
8. Run every required gate, including syntax, diff-check, build, functional tests, and real Edge verification when browser/IndexedDB behavior requires it.
9. Before a successful commit, update `.ai/LAST_RUN.json` with actual evidence from this run:
   - phase and `PASS` status;
   - pre-edit base SHA and immutable safety tag plus its dereferenced target;
   - application, engine, database, and schema versions;
   - each gate result, using `NOT_REQUIRED` only with a reason;
   - exact changed files and unresolved issues;
   - exact next action after the run.
   Do not write planned or assumed checks as `PASS`, and do not store the current commit SHA in this file.
10. In the same successful phase commit whenever practical:
    - update `.ai/STATE.json` fields `completedPhase`, `nextPhase`, versions, status, current work, and unresolved items to the new state;
    - move the completed roadmap phase into the completed section and identify the next phase;
    - update `.ai/DECISIONS.md` if the phase established or superseded any locked product/architecture decision.
11. Commit and push only if all gates pass and the canonical state set is valid and consistent.
12. If production deployment is part of the phase, continue through terminal deployment and required live verification. Do not return merely because merge/push succeeded.
13. Complete planned bookkeeping/cleanup, then run the hard terminal-state self-check from `AGENTS.md`.
14. On `SAFE STOP`, do not advance state, mark the phase completed, or commit failure evidence merely to make progress appear complete. Map the stop to the applicable hard terminal state and report the exact durable resume point.
15. Return a concise PASS/required-action/blocker report only after the terminal-state check passes.

## Continuity-only maintenance

Repository-state maintenance and chat-recovery documentation may be committed without advancing a product phase when production code is untouched. For such a run:

- verify synchronized `main` before editing;
- do not change application/engine/database/schema versions;
- do not require a new production safety tag;
- update LAST_RUN with the operational run, consistency checks, open items, and next action when appropriate;
- preserve STATE `completedPhase` / `nextPhase` unless actual product progress changed;
- verify JSON syntax and cross-file consistency before considering the maintenance complete;
- if the maintenance commit triggers deployment, do not treat the commit itself as completion when deployment evidence is part of the current scope.

The workflow exists so phase execution and chat recovery are reproducible from repository evidence. GitHub history, diffs, tags, workflow runs, and canonical state files—not a copied chat transcript—are the durable record.

## Finite verification contract

Before implementation verification begins, write down the finite checklist that is necessary and sufficient for the current scope.

Rules:
1. Do not add new "just in case" gates after all required gates have passed unless new contradictory evidence appears.
2. Re-run a gate only if code, the test harness/methodology, deployment state, test data, or another relevant precondition changed after the previous run.
3. If a failure is caused by the test harness rather than the product, fix only that harness issue and re-run the affected finite checklist; do not multiply unrelated checks.
4. Deployment polling ends as soon as the required terminal deployment evidence and live-version evidence are obtained.
5. After all required evidence passes, finalize canonical evidence, perform only the planned cleanup if any, and stop.
6. A later real-device issue is a new maintenance scope with its own safety tag/gates when production code changes are required.
