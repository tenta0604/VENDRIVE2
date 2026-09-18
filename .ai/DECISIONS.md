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
- Legacy backup storage remains separate from Analytics. The internal IndexedDB database `VENDRIVE2_DB` is version 2 as of FINAL only to guarantee the `snapshots` object store and repair previously created empty version-1 databases; `STORAGE_VERSION` and `BACKUP_FORMAT_VERSION` remain 1, and this does not change Analytics DB/schema version 4.

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

- Latest completed product phase: `FINAL — Full Regression / Mobile / Backup / Release Gate`.
- Release app version is `2026.09.15-FINAL`; Analytics engine remains `AN14B3B2` with DB/schema version 4.
- The immutable annotated FINAL pre-edit Safety Tag is `backup-pre-FINAL-20260915`, targeting `1f0189c859c489355b5d0dc852fc470f56f5148f`.
- FINAL fixed two release blockers without expanding product scope: stale client APP_VERSION metadata and the legacy `VENDRIVE2_DB` snapshot-store initialization path that could prevent safe restore checkpoints.
- Full legacy, Analytics, OCR/review, schema 2/3/4 backup/restore, data-safety, and exact 320px/390px real Microsoft Edge regression passed.
- VENDRIVE2 is release-ready. No next product phase is active; any future product work must be explicitly scoped and safety-tagged before production edits.


## Post-FINAL.9 operational decisions

- Production app baseline is `2026.09.16-FINAL.9`; Analytics engine remains `AN14B3B2`, DB/schema remain 4.
- OCR review is no longer "draft-only forever": reviewed content still creates a draft first, but a second explicit user action may confirm it. Confirmed sales reports feed Analytics; confirmed input/recovery reports feed inventory/planning. There is still no automatic confirmation.
- Report capture is positioned directly below Today work progress.
- Visit completion warns when that vending machine has unfinished tasks. The warning is advisory and the user can explicitly continue.
- End-of-day warning is scoped to vending machines in today's active route target set and covers unfinished orders and task assignments; out-of-route machines do not count.
- Input-confirmation OCR prioritizes analysis-relevant product/quantity fields. Counter/payment detail is not required for the primary OCR extraction path.

## Vehicle inventory bootstrap decision

- Do not reconstruct past vehicle inventory history merely to initialize current stock.
- The preferred bootstrap is one physical stocktake of the vehicle, saved as an Analytics inventory baseline at that timestamp.
- Provide a dedicated stocktake UI with vending-machine-list-style product search by product name, product code, and maker.
- Case + loose-unit entry is allowed only with known case size for automatic conversion; unknown case size must not be invented.
- Unentered is not silently equivalent to zero. The UI must make "counted as zero" versus "not counted" explicit before final baseline confirmation.
- After baseline, confirmed inventory movements determine current stock. Future physical stocktakes correct drift through reconciliation/correction rather than rewriting raw movement history.

## Product intelligence decision for revenue analysis

- A single product category is insufficient for VENDRIVE2's revenue-growth objective.
- Product intelligence must support a broad family plus multiple structured attributes/tags so similarity can be evaluated at several levels.
- Coffee must be distinguishable beyond "coffee", including dimensions such as black/milked, sugar level, milk presence, volume band, container, temperature compatibility, price band, and brand/maker where known.
- Carbonated products must be distinguishable beyond "carbonated", including classes such as unsweetened sparkling water, cola, fruit soda, energy-style carbonation, and lactic carbonation, plus other relevant attributes such as flavor, sugar, volume, container, price band, and brand/maker.
- Attributes are family-specific and may be unknown. Do not invent missing product facts just to fill the taxonomy.
- When a product first appears, AI may propose a classification. The user should only need to confirm once or correct the wrong fields. Confirmed product intelligence becomes reusable master data.
- Classification exists to improve analysis: when one product falls, the engine should check whether sales rose in sufficiently similar products before treating the movement as true demand decline.
- Replacement recommendations should use similarity evidence rather than assuming all products within a broad family are interchangeable.

## Active visit / nearby decision direction

- GPS distance must never automatically set the currently visited vending machine.
- 100m proximity is only a candidate-discovery signal because adjacent vending machines can be very close and are serviced sequentially.
- The workflow should support one explicit active-work machine at a time.
- Switching active work to another machine requires confirmation while an existing machine is active.
- Active work should survive app reopen and clear automatically on visit completion.
- Preferred Today hierarchy is: WORK PROGRESS → report capture → compact active-work / nearby area → normal Today list.
- When no machine is active, nearby machines should be presented as compact distinct candidates; do not silently pick the nearest one as active.
- When a machine is active, keep a compact active-work card pinned near the top and avoid unnecessary duplicate presentation in the normal list.
- OCR identity should be cross-checked against the active machine. Matching identity is positive evidence; mismatch must warn before association.
- This is the current agreed design direction for the next implementation phase; do not regress to the earlier idea of treating the nearest ≤100m machine as automatically visiting.


## OCR reviewed-field correction decision

- A human correction made in OCR review is the authoritative value for that reviewed candidate; the stale OCR-read value must not silently replace it before draft creation.
- Vendor number, maker, report time, and other review identity fields must remain directly correctable even when OCR returned a non-empty value.
- Changing vendor number or maker must re-run vending-machine candidate matching before draft creation.
- A corrected identity may surface a vending-machine candidate, but it must never auto-link the machine. The existing explicit user linkage action remains required.
- For sales reports, malformed or missing required period data such as `previousClearAt`, report time, or elapsed hours must block draft creation in the review UI rather than failing only inside Analytics persistence.
- Full-editor changes must have an explicit apply/revalidation path back to the compact review, and draft creation must perform a final blocking-field revalidation.
- Re-rendering after a material correction may require the user to re-approve the paper comparison; preserving explicit human approval is more important than preserving a stale checked state.


## Finite verification decision

- Verification must be finite and declared before execution.
- Once every required gate for the current scope passes, stop. Do not create an additional reassurance loop.
- Re-run only gates affected by a real change to code, test methodology, deployment state, or another relevant precondition.
- A later real-device problem opens a new scoped maintenance phase; it does not justify extending a completed verification loop indefinitely.

## Sales-period continuity and visit closeout decision

- A sales journal is a period observation, not evidence that product was physically input or recovered. Only confirmed input/recovery paper may create those inventory movements.
- Before an OCR sales draft is created, and again before a sales report is confirmed, compare its `previousClearAt → occurredAt` interval with prior confirmed sales for the same maker/vendor. A materially overlapping interval must fail closed because it can represent a cumulative/reprinted journal and would otherwise double-count demand.
- Adjacent sales periods are valid. A small boundary tolerance may absorb minor clock/print noise, but it must not turn materially overlapping periods into valid independent observations.
- After a report is confirmed, the capture UI should explicitly ask whether to continue with related paper or end the visit instead of leaving the operator on a dead-end confirmed screen.
- “No input” and “no recovery” are explicit visit facts, not synthetic zero-quantity reports. Do not invent an input/recovery report merely to make visit completeness pass.
- A sales-only visit can be complete when the operator explicitly confirms both no input and no recovery. A visit with confirmed input can be complete when the operator explicitly confirms no recovery, and vice versa.
- Closing the capture UI without making those explicit choices may leave the Analytics visit incomplete; safety is preferred over silently assuming no work occurred.
- A later actual input/recovery report conflicts with an already confirmed corresponding “none” resolution until that resolution is explicitly cleared.

## OCR visit-flow continuity decision

- Compact OCR review rerenders must preserve the active mount callbacks/options. A human correction that causes rerender must not detach the reviewed candidate from its Analytics visit or remove the post-confirm continuation/closeout actions.
- Explicit OCR visit closeout may mark the corresponding legacy Today machine visited only when the Analytics/OCR visit has a trusted machine association and that machine is in Today's target set.
- OCR visit closeout must reuse the existing normal visit-completion workflow rather than bypassing it: unresolved tasks still get the standard task checklist, and an existing order still gets the standard order confirmation.
- Merely closing the OCR modal is not equivalent to completing the Today visit.
- If the linked machine cannot be trusted/resolved or is not a Today target, do not silently mark a legacy machine visited.

## Per-machine vehicle bring recommendation opt-in decision

- “車から持っていく本数の提案” is a per-machine explicit opt-in setting.
- The default is OFF. Existing/legacy machine records with no setting are OFF, and newly created machines start OFF.
- Only a machine whose setting is explicitly ON may produce machine bring-from-vehicle recommendations or contribute demand to the end-of-day next-workday vehicle-loading proposal.
- OFF affects only these vehicle bring/loading proposals. It must not suppress raw sales observations, demand forecasting, generic sales recommendations, visit planning, tasks, orders, OCR capture, or normal visit completion.
- Disabled machines are intentionally out of scope for the end-of-day loading proposal and must not be reported as missing/uncovered loading evidence.
- The setting remains proposal-only. Turning it ON never authorizes automatic inventory movement, route/schedule mutation, report confirmation, or machine linkage.

## Same-visit OCR identity continuity and automatic-read decision

- A confirmed/explicitly established visit machine identity is the continuity anchor for related sales, input, and recovery papers captured through “次の帳票を撮影”.
- Different paper types may retain different maker/vendor identities. A differing report `vendorKey` must not by itself split or reject the visit when report and visit resolve to the same trusted `machineId`.
- If a continued report has no machineId but the open visit already has a trusted machineId, persistence may inherit that machineId for the report. This is visit continuity, not creation of a new durable vendor→machine mapping.
- Vendor mismatch remains fail-closed when no trusted same-machine context exists. Machine mismatch remains fail-closed whenever report and visit identify different machines.
- Human corrections to report maker/vendor remain authoritative for that report and must not be overwritten merely to make visit continuity pass.
- Selecting/capturing a valid report image should immediately start OCR when the secure adapter is available. Do not require a separate initial “読み取る” tap.
- The OCR action button is retry-only on the normal workflow: hide it while automatic OCR is available/running/successful, and expose “もう一度読み取る” only after OCR failure or when the adapter is unavailable.
- Automatic OCR start does not change the human-review boundary: draft creation still requires explicit paper approval, and formal report confirmation remains explicit.

