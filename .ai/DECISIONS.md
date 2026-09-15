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

## AN14B3B real-paper decisions and split

- `AN14B3B` is split at the real-world evidence boundary: `AN14B3B1` covers the sales journal; `AN14B3B2` covers input/recovery papers.
- Real samples have now confirmed four relevant physical forms: sales journal, standalone **投入確認**, standalone **回収品確認**, and a joined paper containing both input and recovery sections.
- Confirmed sales-journal concepts include report identity/header data, vendor/machine context, product code/name, price, sales quantity, total quantity, total amount, previous-clear/elapsed-period information, and sold-out information.
- Sales review supports human comparison/correction, visible quantity/amount consistency checks, and explicit paper approval before creating an Analytics draft.
- Input review follows the printed structure: header, counter rows (**売価・枝番・前回・今回・売上数**), card/cash/sales amounts, product input rows, and printed **投入合計**.
- Input review must check `今回 - 前回 = 売上数`, counter-derived sales amount, `カード + 現金 = 売上金額`, and product-row quantity total before approval.
- Recovery review preserves the printed **ケース** and **バラ** counts separately. Existing inventory/report movement continues to use the unit-equivalent `quantity` field.
- When recovery **ケース = 0**, unit-equivalent `quantity` must equal printed **バラ**. When **ケース > 0** and case size is not certain, VENDRIVE2 must not invent a conversion; human-reviewed unit-equivalent quantity is required before the report can become valid.
- Joined `input_recovery` uses the same calibrated input and recovery sections rather than a separate persistence path.
- All real-paper review remains draft-only after explicit paper comparison: no automatic report confirmation, inventory movement, image/raw-OCR retention, or legacy write.
- The immutable annotated pre-edit safety tag used for `AN14B3B1` is `backup-pre-AN14B3B-canonical-main-20260914`, targeting `c107298c3f08196de2ac97bc51d596aea403f310`.
- The immutable annotated pre-edit safety tag used for `AN14B3B2` is `backup-pre-AN14B3B2-20260915`, targeting `4b60c23d618c7995fcd7cb25bc0dbed20b0f35e2`.

## Current release boundary

- Latest completed product phase: `AN14B3B2 — Input / Recovery Real-paper Review UI Calibration`.
- Production OCR connectivity and real-image structured response were validated before AN14B3B; the provider schema is now calibrated for the confirmed input/recovery paper structures.
- Sales, input, recovery, and joined input/recovery field-level review are all implemented under the same explicit-review and draft-only boundary.
- The next phase is `FINAL — Full Regression / Mobile / Backup / Release Gate` unless the user explicitly changes the roadmap.
