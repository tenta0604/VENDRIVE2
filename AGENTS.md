# VENDRIVE2 AI Development Rules

## Repository and architecture

- Repository: `tenta0604/VENDRIVE2`
- Local root: `E:\VENDRIVE2`
- Production branch: `main`
- Preserve the current direct HTML/JavaScript architecture. Do not rewrite it in React.
- Do not add unnecessary dependencies, packages, CDNs, or external scripts.
- Avoid large refactors unless a phase explicitly requires one.
- Never modify the old `tenta0604/VENDRIVE` repository.

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

## Preflight for every phase

Before editing, verify the repository root, `main` branch, `HEAD`, `origin/main`, working tree, and ahead/behind counts. Fetch origin first when network access is available. If the tree is dirty, history diverges, or the baseline is unexpected, do not repair it automatically; report `SAFE STOP`.

## Git safety and commit policy

- Before editing production code in any phase, create an immutable annotated safety tag at the verified pre-edit `HEAD`.
- If the chosen tag name already exists, dereference it and continue only when it points to that exact `HEAD`; a same-name tag at another SHA requires `SAFE STOP`.
- Never move, delete, recreate over, or force-update an existing safety tag.
- Never use `git reset --hard`, destructive `git restore`, `git checkout -- .`, `git clean`, stash to hide changes, rebase, force push, history rewriting, or moving/deleting an existing safety tag.
- Preserve unrelated user changes.
- Commit and push only when every required gate passes.
- If any required gate fails or remains unresolved: `NO COMMIT`, `NO PUSH`.

## Verification

- Select gates appropriate to the change: syntax checks, `git diff --check`, build, functional tests, and real-browser tests.
- Browser/IndexedDB phases that require real Edge evidence cannot pass on mocks alone.
- Reuse the proven Microsoft Edge + localhost + dedicated TEMP profile + CDP approach.
- Never perform test database operations in a normal Edge profile.

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

Do not rely on the user copying a long report elsewhere. Leave independently reviewable evidence in GitHub commit history, diffs, tags, and workflow runs.
