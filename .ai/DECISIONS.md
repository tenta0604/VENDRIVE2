# VENDRIVE2 Canonical Decisions

This file records confirmed project decisions that must survive chat migration. Treat it as durable project memory, not as a scratchpad. Do not silently change a locked decision; change it only when the user explicitly changes product direction or when a later reviewed phase intentionally supersedes it.

## Source of truth and recovery

- `main` is the production and recovery authority.
- A chat transcript is temporary working context. Durable project state must be recoverable from GitHub without requiring a copied handoff prompt.
- Canonical recovery files are:
  1. `AGENTS.md` — operating and safety rules.
  2. `.ai/STATE.json` — current implementation state, active work, progress, blockers, and required user input.
  3. `AI_ROADMAP.md` — phase order and future development sequence.
  4. `.ai/LAST_RUN.json` — most recent completed operation, evidence, and next action.
  5. `.ai/DECISIONS.md` — locked product/architecture decisions.
  6. `.ai/WORKFLOW.md` — repeatable execution and recovery procedure.
- On a new chat, a short instruction such as `VENDRIVE続き` is sufficient. ChatGPT must fetch the latest `main`, read the canonical files above, verify consistency, and continue from repository state.
- When the current chat becomes long enough that continuity risk is increasing, ChatGPT must propose migration proactively. Before migration, update the canonical files so the next chat does not depend on the old transcript.
- Do not ask the user to write or manually maintain long handoff prompts, progress summaries, or Codex relay messages when connected tools can preserve the state directly.

## Repository and architecture

- Repository: `tenta0604/VENDRIVE2`.
- Production branch: `main`.
- The old `tenta0604/VENDRIVE` repository is historical reference only and must never be modified.
- Preserve the current direct HTML/JavaScript application architecture. Do not rewrite the app in React or add dependencies merely for convenience.
- Prefer minimal, phase-scoped changes over broad refactors.

## Execution ownership

- ChatGPT is the default lead and executor.
- Prefer ChatGPT + connected GitHub/Vercel/GitHub Actions/tools over asking the user to perform mechanical development work.
- Ask the user to act only for consent, credentials/security, production or user-data risk, factual real-world input unavailable to tools, physical/local interaction, or materially different UX/product judgment.
- Codex is an escalation path for work that genuinely benefits from its environment/capabilities, not a mandatory relay step.

## Git safety

- Before production-code edits for a phase, create an immutable annotated safety tag at the verified pre-edit `HEAD`.
- Never move/delete/overwrite an existing safety tag.
- No force push, rebase, history rewrite, destructive reset/restore/clean, or stash-based replacement workflow.
- Required gates must pass before production phase commit/push.
- Git `HEAD` / `origin/main` is the authority for revision identity; do not store the current commit SHA as self-referential state inside the same commit.

## Data and analytics safety

- Analytics layers remain separated as `RAW` → `COMPUTED` → `RECOMMENDATION`.
- Do not overwrite raw observations with computed values.
- Do not invent unknown values as zero or present estimates as measurements.
- Analytics/recommendations must not silently modify legacy schedules, visit cycles, weekdays, Today plan, or other operational state.
- Legacy write flow remains: proposal → user adoption → final confirmation → legacy write.
- Legacy storage (`vendrive2_v7_data`, `vendrive2_last_day`, legacy `VENDRIVE2_DB`) remains separate from Analytics storage.
- Current Analytics DB/schema version is 4 unless a later explicit migration phase changes it.

## OCR and report capture

- Supported report families are `sales`, `input`, `recovery`, and `input_recovery`.
- OCR is an input layer, not an automatic authority.
- Production OCR uses the Vercel relay and Google Gemini; provider credentials remain server-side and must never be embedded in GitHub Pages/client code.
- OCR output must remain structured. Do not retain or return raw OCR text, image bytes, base64/Data URLs, or credentials.
- Selecting an image does not upload it. Upload begins only from the explicit user OCR action.
- OCR candidates require human review. No automatic report confirmation, Analytics write, inventory movement, or legacy write may be introduced unless a later explicit phase authorizes it.
- Field-level review UI must be calibrated against real paper samples rather than guessed layouts.

## AN14B3B real-paper decisions

- The current phase is `AN14B3B — Real-paper Review UI Calibration`.
- A real sales-journal sample has been inspected and is sufficient to begin sales-side calibration.
- Confirmed sales-journal concepts visible in the sample include report identity/header data, vendor/machine context, product code/name, price, sales quantity, total quantity, total amount, previous-clear/elapsed-period information, and sold-out information.
- Sales review should support human comparison/correction and existing quantity/amount consistency checks before any draft/report confirmation path.
- Do not guess the field layout for `input`, `recovery`, or joined `input_recovery` papers. Real samples are still required for those layouts.
- The user expects to provide the input-confirmation and recovery paper photos when available during work.
- The immutable annotated pre-edit safety tag for AN14B3B is `backup-pre-AN14B3B-AN14B3A-20260914`, targeting the AN14B3A main baseline.

## Current release boundary

- Latest completed product phase: `AN14B3A — Production OCR Provider Connection`.
- Production OCR connectivity and real-image structured response were already validated before AN14B3B.
- AN14B3B production implementation has not yet been committed to `main` at the time this canonical-state system is established.
- After AN14B3B, the roadmap proceeds to `FINAL — Full Regression / Mobile / Backup / Release Gate` unless the user explicitly changes the roadmap.
