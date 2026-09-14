# VENDRIVE2 AI Phase Workflow

## Recovery / new-chat bootstrap

When a new chat starts with a short instruction such as `VENDRIVE続き`, do not ask for a handoff prompt. Recover from GitHub first:

1. Fetch latest `main` and verify its current HEAD.
2. Read `AGENTS.md` completely.
3. Read `.ai/STATE.json` completely and validate it as JSON.
4. Read `AI_ROADMAP.md` completely.
5. Read `.ai/LAST_RUN.json` completely and validate it as JSON.
6. Read `.ai/DECISIONS.md` completely.
7. Read this `.ai/WORKFLOW.md` completely.
8. Verify that STATE completed/next phase agrees with ROADMAP and that LAST_RUN/DECISIONS do not contradict STATE.
9. Use STATE current work, required user input, unresolved items, and LAST_RUN next action to resume from the previous work boundary.
10. Only ask the user for missing context when it cannot be recovered safely from repository evidence or connected tools.

The conversation transcript is not authoritative project memory. GitHub `main` plus the canonical files above is.

## Proactive chat migration

When the current chat becomes long enough that context loss or migration risk is increasing:

1. Do not wait for the user to request a migration prompt.
2. Finish or safely stop the current atomic work item.
3. Update `.ai/STATE.json` with current implementation state, active phase, progress, required user input, and unresolved items.
4. Update `.ai/LAST_RUN.json` with the most recent completed operation and exact next action.
5. Update `AI_ROADMAP.md` only when development order/status actually changed.
6. Update `.ai/DECISIONS.md` when a confirmed decision from the chat is not yet durable in GitHub.
7. Verify all canonical files are internally consistent and on `main`.
8. Proactively tell the user a new chat is recommended. The user should only need a short resume instruction such as `VENDRIVE続き`.

Do not make the user manually summarize progress or maintain a long migration prompt.

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
10. In the same successful phase commit:
    - update `.ai/STATE.json` fields `completedPhase`, `nextPhase`, versions, status, current work, and unresolved items to the new state;
    - move the completed roadmap phase into the completed section and identify the next phase;
    - update `.ai/DECISIONS.md` if the phase established or superseded any locked product/architecture decision.
11. Commit and push only if all gates pass and the canonical state set is valid and consistent.
12. On `SAFE STOP`, do not advance state, mark the phase completed, or commit failure evidence merely to make progress appear complete.
13. Return a concise PASS or SAFE STOP report and stop. Wait for the next user instruction.

## Continuity-only maintenance

Repository-state maintenance and chat-recovery documentation may be committed without advancing a product phase when production code is untouched. For such a run:

- verify synchronized `main` before editing;
- do not change application/engine/database/schema versions;
- do not require a new production safety tag;
- update LAST_RUN with the operational run, consistency checks, open items, and next action;
- preserve STATE `completedPhase` / `nextPhase` unless actual product progress changed;
- verify JSON syntax and cross-file consistency before fast-forwarding `main`.

The workflow exists so phase execution and chat recovery are reproducible from repository evidence. GitHub history, diffs, tags, workflow runs, and canonical state files—not a copied chat transcript—are the durable record.
