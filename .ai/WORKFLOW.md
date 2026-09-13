# VENDRIVE2 AI Phase Workflow

When the user says 「次進めて」, execute this workflow for exactly one phase:

1. Read `AGENTS.md` completely.
2. Read `AI_ROADMAP.md` completely.
3. Read `.ai/STATE.json` completely and validate it as JSON.
4. Fetch origin, then run Git and state preflight:
   - verify the repository root and require branch `main`;
   - require a clean working tree;
   - require `HEAD` to equal `origin/main` and `main...origin/main` = `0 0`;
   - require STATE `appVersion`, `engineVersion`, `dbVersion`, and `schemaVersion` to match the production code;
   - require ROADMAP completed/next phase to match STATE `completedPhase` / `nextPhase`.
   Before editing a phase that changes production code, create an immutable annotated safety tag at the verified pre-edit `HEAD`. If the selected name already exists, continue only when its dereferenced target is that exact SHA; otherwise `SAFE STOP`. Never move, delete, recreate over, or force-update an existing tag.
   On any mismatch, do not repair automatically; `SAFE STOP`.
5. Identify `STATE.nextPhase`.
6. Read that phase's purpose and boundary from the roadmap, inspect the current code, and turn the boundary into a necessary and sufficient implementation specification. Do not implement later phases.
7. Resolve ambiguity autonomously when existing design and safety principles determine a reasonable answer.
8. Stop for user confirmation only when required by one of these conditions:
   - destructive action;
   - production or user-data risk;
   - materially different UX/product choices;
   - a change to roadmap priority;
   - security or credential action;
   - factual input that cannot be derived safely.
9. Implement the selected phase with minimal scoped changes.
10. Run every required gate, including syntax, diff-check, build, functional tests, and real Edge verification when browser/IndexedDB behavior requires it.
11. Commit and push only if all gates pass. Never commit a failing or unresolved phase.
12. In the same successful phase commit:
    - update `.ai/STATE.json` fields `completedPhase`, `nextPhase`, versions, and `status` to the new state;
    - move the completed roadmap phase into the completed section and identify the next phase.
13. On `SAFE STOP`, do not advance state or mark the phase completed. Do not commit failure state to make progress appear complete.
14. Return a concise PASS or SAFE STOP report and stop. Wait for the next user instruction.

The workflow exists so phase execution is reproducible from repository evidence. GitHub history, diffs, tags, and workflow runs—not a copied chat transcript—are the durable review record.
