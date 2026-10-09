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

## FINAL.21 field-workflow simplification decision

- The field workflow no longer exposes report-photo/OCR capture. The Today screen must not show a 帳票撮影 button or report-capture entry point.
- The field workflow no longer exposes the Analysis tab/page. This supersedes earlier user-facing analysis/OCR workflow decisions, but does not require destructive deletion of historical Analytics data or code.
- Preserve historical Analytics storage and DB/schema compatibility so existing data is not silently destroyed and rollback remains possible.
- A manually saved next-workday plan is operational intent, not a preview-only list. When its date becomes Today, its additions and exclusions must be materialized into the existing daily force/skip mechanism.
- Apply that saved plan once per target date, including when FINAL.21 first loads after an older build already wrote the current-day marker.
- Urgent orders remain an operational safety override and must still appear in Today even if they were not included in the saved manual next-workday plan.
- The simplification does not otherwise change task, order, visit-completion, route, inventory, Analytics engine, DB, schema, or learned-numeric promotion behavior.

## FINAL.22 task targeting and percentage-completion decision

- The five remaining top navigation tabs must consume the full row; do not leave an unused Analysis-sized slot after the Analysis tab was withdrawn.
- Task creation must preserve the existing all-manufacturer / one-manufacturer targeting flow and additionally support direct selection of exactly one vending machine.
- Single-machine task selection must be searchable by the same practical machine identity fields used elsewhere (name, address, management code/id, maker).
- Every task has an automatic-completion threshold from 1% through 100%.
- New tasks default to 100%. Legacy tasks with no threshold also default to 100% so previous "all targeted machines must complete" behavior is preserved.
- Existing active tasks must allow threshold changes from Task Detail.
- A task auto-completes when completed target count / current target count is greater than or equal to the configured threshold. Use exact ratio comparison rather than rounded display percentage.
- Task cards/details/history should show completion progress and the configured threshold so partial rollout tasks such as 70% deployments remain understandable.
- Changing task targeting continues to use the existing explicit add/remove flow. Single-machine tasks that are later expanded may become custom individual-target tasks.
- This feature does not change visit completion, order handling, Analytics engine, DB/schema, inventory semantics, or numeric learning behavior.

## FINAL.23 arbitrary task-selection decision

- The task target mode must not constrain explicit machine targeting to exactly one vending machine.
- The two creation modes are manufacturer-based targeting and 選択型 targeting.
- 選択型 allows any non-zero number of arbitrary vending machines to be chosen individually by search, regardless of maker.
- The creation UI must show the current number/list of selected machines and allow a machine to be removed before the task is saved.
- Existing all-manufacturer and one-manufacturer targeting remains available and unchanged.
- FINAL.22 single-machine tasks and other custom individual target sets migrate to 選択型 while preserving their existing targetMachineIds.
- If a manufacturer-based task's target set is manually changed in Task Detail, the resulting task becomes 選択型 because its actual scope is now an explicit machine set.
- The 1–100% automatic completion threshold remains independent of target mode and continues to use exact completed-target / total-target ratio.
- This change does not alter visit completion, order handling, task-per-machine completion facts, Analytics engine, DB/schema, inventory semantics, or numeric learning behavior.


## 2026-10-06 approved truck-route display decision (unreleased)

- Provide road-following internal route geometry using explicit 2t vehicle conditions from the first release. Do not ship a car-only first version.
- Require confirmed actual height/width/length and gross vehicle weight; 2t denotes payload class rather than the routing weight. Optional axle load remains unset when unknown.
- Preserve external Google navigation as a separate action. It does not inherit the truck profile.
- Scope is route geometry, existing GPS tracking, distance/estimated time and manual recalculation/end. No voice guidance, speculative multi-stop optimization or visit/schedule mutation.
- Use the free Standard ORS key through a server relay; no paid-plan purchase/upgrade is authorized. Candidate routes cannot guarantee all local restrictions.
- This work is not a released FINAL.24. Validation draft PR #145 has passed real Edge 320px/390px and existing browser regression gates; all production versions and the completed intelligence phase remain unchanged. Activation still requires the ORS key, actual vehicle facts, an actual provider-route preview test, and explicit production merge/release approval. See .ai/pending/TRUCK_ROUTING.md and .ai/pending/TRUCK_ROUTE_EVIDENCE.json for exact evidence and the resume point.

- The user prefers resuming this work in ordinary GPT. The archived patch/evidence on main remains the continuity source, while draft PR #145 holds the browser-verified implementation. Passing validation is not permission to merge or release production code.

## 2026-10-06 — Truck route live-provider validation
- Final clean validation head: `61e801185fe0d1bc2a60a4b4f157d3e274e713af`; draft PR #145 remains unmerged.
- Preview routing must use same-deployment `/api/route`; GitHub Pages production continues to use `https://vendrive2-ocr-relay.vercel.app/api/route`.
- The API may accept the existing explicit allowed origins plus an exact same-origin request; do not broaden this to arbitrary Vercel origins.
- Real provider gate passed through the Vercel Preview secret with validation-only vehicle values: length 5.57m, width 1.88m, height 2.38m, gross weight 6.095t, axle load unset, avoid tolls true. Returned driving-hgv LineString: 2133m, 181.4s, 46 coordinates.
- These vehicle values are test evidence only. Never hard-code them as product defaults; each user must enter their own actual vehicle profile.
- The temporary smoke probe was removed; final clean Preview is READY and the probe path returns 404.
- Production ORS secret targeting, merge, deployment and live verification require explicit production release approval.

## 2026-10-06 — FINAL.24 truck-route production release
- User explicitly approved production release after the live-provider gate passed.
- Release app version is `2026.10.06-FINAL.24`; Analytics engine remains `AN14B3B5`, DB/schema remain 4.
- PR #145 merged to main at `e8ca88c9ebdea05ffa464ad22fd986a0172cb395` after final release-head gates passed (browser run 37471603824; truck-route run 37471603821).
- `ORS_API_KEY` remains a Vercel sensitive secret targeted to Preview + Production. Its value was never decrypted, copied into Git, or exposed to the client.
- Vercel production deployment `dpl_H7tAaYtGc5uLahaaRK7yhN37CYdq` is READY. Live GitHub Pages reports FINAL.24 and contains the truck vehicle/routing UI.
- Vehicle dimensions/weight are user-specific configuration. The validation values 5.57m length / 1.88m width / 2.38m height / 6.095t gross weight must never become application defaults.
- Existing external Google navigation remains separate and does not inherit HGV profile. Road signs and local restrictions remain authoritative over route candidates.

## 2026-10-06 — FINAL.25 route guidance display
- Release version is `2026.10.06-FINAL.25`; Analytics engine remains `AN14B3B5`, DB/schema remain 4.
- User-requested road styling is deterministic from ORS extra info: `waycategory` bit 1 means `highway=motorway` or `highway=motorway_link` and is drawn orange (`#f97316`); other route sections are blue (`#2563eb`). This is road class, not a guess from geometry or speed.
- Current-position direction uses a finite browser Geolocation `heading` first. When unavailable, a bearing is inferred only after at least 4m of meaningful movement. If neither yields a new direction, the last reliable heading may remain visible.
- Current-position display motion is visual interpolation only. It does not rewrite stored route geometry or invent GPS measurements. When an existing display position is available, fixes with accuracy worse than 100m do not move the visual marker; the raw runtime GPS fix is still retained for existing position handling.
- The route-follow map pan is animated together with the marker when follow mode is ON.
- Vehicle dimensions/weight remain user-specific. No validation vehicle dimensions are product defaults.
- PR #147 merged at `c8c5908a576c449b2832f226c622534a0a08ddc1`. Final validation head `f3f78564bd985ab264cd9d04b8e868c650ed190a` passed truck-route run 37478095863 and browser regression run 37478095852; main push regression 37478367744 and Pages deployment 37478364850 also passed.
- Real ORS Preview verification confirmed `extra_info: ["waycategory"]` is accepted and returned sanitized category spans. The known-good validation route returned 2133m / 181.4s / 46 coordinates / category value 0. Motorway bit-1 rendering was separately exercised in real Edge with a controlled fixture.
- Pre-edit safety used the explicit user-approved one-phase exception: never-modified backup branch `backup-pre-FINAL25-route-heading-20261006` at `398d1d9bd93b37092c6e780a0d0fe2445d8168b2`. Do not move or repurpose that branch.

## 2026-10-06 — FINAL.26 validated route-mode and orientation decisions
- The reported all-blue route did not reveal a broken motorway bit classifier. Real ORS `driving-hgv` verification from Nagoya IC to Komaki IC returned category spans containing values 1 and 3; both include `waycategory` motorway bit 1. Keep `(category & 1) === 1` as the motorway classifier.
- Preserve the user's saved `avoidTolls` preference. Do not silently disable `有料道路を避ける` merely to produce orange sections. When avoidance is ON, an all-blue route may be the correct result.
- Route UI must state both whether the returned route actually contains a motorway section (`高速区間あり/なし`) and whether toll avoidance is active (`有料道路回避中/使用可`). Vehicle settings must explicitly explain that toll avoidance can prevent expressway use.
- Non-MAP mobile UI is portrait-first. Use Screen Orientation portrait lock when the browser permits it, but do not rely on that API alone; when a touch device is physically landscape and MAP is not active, show an in-app portrait guard with a direct MAP action.
- MAP is the sole landscape-capable operational page. It has an app-managed full-viewport mode that works without native Fullscreen API support. When native fullscreen and Screen Orientation landscape lock are available, use them opportunistically; failure must not break the fallback.
- Annotated safety tag: `backup-pre-FINAL26-MAP-ORIENTATION-20261006` -> `b51ffe064e22e7096e74324578ff0f88ff9d300d`.
- PR #150 validation head `9ee560e71f986cb7ab1275b46e9760a4d88d77be` passed truck-route run 37483742121 and browser regression run 37483742234. Vercel Preview `dpl_8KbaaM2BWvSGUMqE6MUsZKyf3AHg` is READY. Production release requires explicit approval.

## 2026-10-06 — FINAL.26 production merge, Pages pending
- User explicitly approved production release.
- PR #150 merged to main at `efd6ab30c6ac4937ff2cec482cbac450127ee75f` after the latest-main integration head `991957c85f63948ae3a1ca4bb8975419bce0126a` passed truck-route run 37486967621 and browser regression run 37486967417.
- Main push browser regression run 37487130052 passed.
- Vercel production deployment `dpl_Ctz1iykQeqkf7idiDF9rCFQuBV4N` is READY for the merge SHA.
- Live GitHub Pages still returned FINAL.25 at the first post-merge check, so FINAL.26 is not considered fully closed until Pages reports FINAL.26 and the new UI is visible.

## 2026-10-06 — FINAL.26 production release complete
- User explicitly approved production release.
- PR #150 merged at `efd6ab30c6ac4937ff2cec482cbac450127ee75f` after latest-main integration head `991957c85f63948ae3a1ca4bb8975419bce0126a` passed truck-route run 37486967621 and browser regression run 37486967417.
- Main push browser regression run 37487130052 passed.
- Vercel production deployment `dpl_Ctz1iykQeqkf7idiDF9rCFQuBV4N` is READY. The later documentation deployment `dpl_3fEQkdY4Hacr6LKzeDk4ypv7UV3z` is also READY with unchanged runtime code.
- GitHub Pages run 37487664235 completed successfully and the live version endpoint reports `2026.10.06-FINAL.26`.
- Live page verification confirms the portrait guard, MAP-only landscape guidance, ⛶ full-screen control, general/highway color legend, route footnote and toll-avoidance explanation are present.
- FINAL.26 closes the current routing/orientation maintenance phase. Return to AN15 real-evidence accumulation unless new field evidence opens another bounded maintenance scope.

## 2026-10-07 — FINAL.27 route red color and fullscreen PIN fix
- Operational route colors are now explicit: ordinary road spans are blue `#2563eb`; spans whose ORS `waycategory` contains Highway bit 1 or Tollways bit 2 are red `#dc2626`.
- This supersedes the earlier orange motorway-only presentation. The prior orange implementation was a direct mismatch with the requested red distinction.
- Tollway-only spans are highlighted red as well because ORS represents Highway and Tollways as independent bit fields and Japanese toll/high-speed routing can contain either or both. The UI labels the red class `高速・有料道路` rather than pretending every red span is strictly an OSM motorway.
- Fullscreen MAP is app-managed full-viewport mode. Do not rely on putting only `#map` into native Fullscreen, because PIN-triggered modal UI lives outside the map element.
- While MAP fullscreen is active, open modals must remain above the map (modal z-index 25000 vs map 15000) and machine PIN wrappers remain pointer-interactive.
- Real Edge validation must include fullscreen -> actual machine PIN click -> visible machine detail modal; a synthetic event dispatch is not sufficient.
- Safety tag `backup-pre-FINAL27-ROUTE-COLOR-FULLSCREEN-PINS-20261006` points to pre-edit main `fb57b9bf4c58f825af83c6417f67521f28e262db`.
- PR #152 merged at `db781de00bf684e4fab0f4ba0aea7efbb9d67b1c`; final validation head `dba1dac3c888c9acae074d0932d69bb47d5d7b1e` passed 14/14 Node tests, real Edge 320/390 and all existing regressions. Production Vercel `dpl_AxpA47bQjVqAk5K38ipVL8p6aVAy` and Pages run 37492638028 passed; live version is FINAL.27.

## 2026-10-07 — FINAL.28 routing asset cache fix
- Root cause of the repeated all-blue symptom: the app release changed but the external `truck-routing.js` URL kept the old fixed query `?v=2026.10.06-TRUCK-ROUTE`. This allowed a newer HTML draw implementation to run with an older cached routeSections implementation.
- In the failing mixed-version combination, the HTML expects `section.highlight` while the older routing module does not provide it; all spans therefore fall through to blue. This failure mode is deterministic and is now covered by regression evidence.
- `truck-routing.js` must use the same release version as `version.json`/APP_VERSION whenever its semantics change. FINAL.28 uses `?v=2026.10.07-FINAL.28` and exports `assetVersion='2026.10.07-FINAL.28'`.
- Real Edge route gates must assert that the HTML script query, runtime routing `assetVersion`, and `version.json` all match.
- Route rendering remains defensive: red priority is true when `highlight === true || motorway === true || tollway === true`. This preserves known motorway/tollway coloring if a legacy section object is ever encountered.
- Safety tag `backup-pre-FINAL28-ROUTING-ASSET-CACHE-20261006` -> `3a510603de037c09dba04ae36c93d6c8a5938a7d`.
- PR #154 merged at `676e2e12debe529f620895b3c5911d855ef14768`; validation head `5726577560c1eec81d5cb1de2639d1aff8295bbe` passed 15/15 Node tests, Edge 320/390 and all existing regressions. Production Vercel `dpl_F1zukXiJkKwxfKDgwjUBRqzusFAy`, main regression 37495337396 and Pages 37495335651 passed; live version is FINAL.28.

## 2026-10-07 — FINAL.29 dedicated ORS tollways classification
- FINAL.28 field evidence `高速・有料区間なし` means the remaining all-blue report is not explained by route paint or asset cache alone; the client received no priority classification from the data it was given.
- The production relay must request both ORS `waycategory` and dedicated `tollways` extra information for HGV routes.
- Red priority is true when waycategory contains Highway bit 1, waycategory contains Tollways bit 2, or dedicated tollways extra is 1. Ordinary spans remain blue.
- Dedicated extras may have different span boundaries. Merge classification edge-by-edge across the route geometry rather than assuming the two span arrays align.
- Do not use ORS `waytype=1` as a red fallback: the official bucket includes primary, primary_link, motorway, motorway_link, trunk and trunk_link, so using it would incorrectly color many ordinary major roads red.
- Real provider evidence in Preview confirmed dedicated `tollways` is returned for `driving-hgv`: Nagoya IC → Komaki IC returned `[1,0]` values and three tollway spans.
- Safety tag `backup-pre-FINAL29-TOLLWAYS-EXTRA-20261006` -> `99c49c38ff6f37d7e95d3353d52e3ea489daa6de`.
- PR #156 final clean head `90c4a487a6d68b418029e4e9377e0bea177e1de3` passed 16/16 Node tests, Edge 320/390 run 37499628848 and browser regression run 37499628758. Clean Preview `dpl_2rKPYSXETn64FteYT8hM85rUsoUL` is READY; temporary provider probe is removed.

## 2026-10-07 — FINAL.29 production release complete
- PR #156 merged at `e24d82fc10a53614493e041cdba29715b303963e` after clean validation head `90c4a487a6d68b418029e4e9377e0bea177e1de3` passed 16/16 Node tests, Edge 320/390 run 37499628848, and browser regression run 37499628758.
- Vercel production deployment `dpl_6PyUsLB4QQEnyfjWkWG5kRu3VTqv` is READY. Main push browser regression run 37500262557 passed and GitHub Pages run 37500261666 completed successfully.
- Live version is `2026.10.07-FINAL.29`; the public routing asset also reports FINAL.29 and contains dedicated tollways classification logic.
- The production relay remains server-side and secure; unsupported GET returns 405. Real provider POST behavior was already verified in Preview with the exact same route code and Preview secret.
- If the operator's exact field route still reports `高速・有料区間なし`, do not add broader guesses such as `waytype=1`; obtain exact route endpoints and inspect upstream OSM/ORS data for that route.
- FINAL.29 closes the current routing-color maintenance scope and returns to AN15 real-evidence accumulation.

## 2026-10-07 — FINAL.30 MAP highway mode
- Highway use is an operator route-mode preference, not a vehicle dimension. The existing persisted `routeVehicle.avoidTolls` field remains the compatibility storage, but both UI surfaces present the mode positively as highway ON/OFF.
- MAP contains a compact `高速 ON/OFF` control in the existing tool stack. It must not create a separate conflicting preference.
- ON means `avoidTolls=false`: ORS HGV requests use `preference='fastest'`, allow highways/tollways, and still avoid ferries.
- OFF means `avoidTolls=true`: ORS explicitly avoids `highways`, `tollways`, and ferries.
- Changing the MAP toggle while a destination route exists must persist first, cancel stale in-flight/geometry state, and immediately recalculate using the new mode.
- Vehicle settings use the same mode with positive wording `高速道路を使う`; checked=ON. Existing stored values remain compatible by inversion of `avoidTolls` only at presentation.
- Real provider evidence for the same test route: ON returned motorway+tollway and four red sections; OFF returned neither motorway nor tollway and zero red sections.
- Safety tag `backup-pre-FINAL30-HIGHWAY-MAP-TOGGLE-20261006` -> `5d1727f653c5b5d3b41e547654ea5cc95fa247d8`.
- PR #158 clean validation head `180ddcf056fd1ce44f2ef32fb93ee86b8e282076` passed 17/17 Node tests, Edge 320/390 run 37502908710 and browser regression run 37502908758. Clean Preview `dpl_DSXZYZZW5PV6wcWHTd2oXYT5WL5B` is READY and the temporary probe is removed.

## 2026-10-07 — FINAL.30 production release complete
- PR #158 merged at `5ba067cac0bd660d5908a5848716d591190453a8` after clean validation head `180ddcf056fd1ce44f2ef32fb93ee86b8e282076` passed 17/17 Node tests, Edge 320/390 run 37502908710, and browser regression run 37502908758.
- Real ORS Preview comparison on the same route verified the routing control itself: ON returned motorway+tollway with four red sections; OFF returned neither motorway nor tollway and zero red sections.
- Vercel production `dpl_4EUA1J2Qp8ZsderuHTYoodSzNSN7` is READY. Main browser regression run 37503368121 and Pages run 37503366758 passed. Live version and routing asset are FINAL.30.
- FINAL.30 closes the highway-mode maintenance scope and returns to AN15 real-evidence accumulation.

## 2026-10-07 — FINAL.31 highway candidate preference
- Highway ON means prefer a route that actually contains expressway evidence, not merely permit expressways.
- The public ORS API has no direct driving-hgv prefer-highway weighting, so ON requests `alternative_routes={target_count:3,share_factor:0.85,weight_factor:1.8}` on the fastest HGV calculation.
- Candidate selection order is: motorway evidence first, then tollway-only evidence, then the normal optimal route only when no highway/toll candidate exists. Within the same class, choose lower duration then lower distance.
- Highway OFF does not request alternatives and continues to avoid highways, tollways and ferries.
- Invalid optional alternatives may be ignored, but the primary provider route must validate fail-closed; never fall back to car routing or straight-line geometry.
- The existing compact MAP toggle remains the operator control and keeps the same persisted preference. Vehicle dimensions/weight restrictions remain applied to every candidate by ORS.
- Safety tag `backup-pre-FINAL31-HIGHWAY-CANDIDATE-PREFERENCE-20261006` -> `7620d348633f0de547110facc8c1de5073af4a6a`.
- PR #160 clean validation head `9b9341deb58241ce79b698c9e5ea6cb98a9e4224` passed 19/19 Node tests, Edge 320/390 run 37536273305 and browser regression run 37536273218. Real Preview deployment `dpl_9F5T9oumpJUfdeELGW39bdKRRe3B` confirmed three ORS HGV alternatives; clean Preview `dpl_6v1R5UBYRSuxw5utwiSDX6vXswaL` is READY and the temporary probe is removed.

## 2026-10-07 — FINAL.31 production release complete
- PR #160 merged at `00d8f0398680af4411a59fe393ceb43b5671a766` after clean validation head `9b9341deb58241ce79b698c9e5ea6cb98a9e4224` passed 19/19 Node tests, Edge 320/390 run 37536273305, and browser regression run 37536273218.
- Real ORS Preview confirmed `alternative_routes` on `driving-hgv`: Nagoya IC → Komaki IC returned three candidate features, all carrying motorway+tollway evidence.
- Vercel production `dpl_2N4u6GfxFjYzg8ewB5zFLRgDvTJm` is READY. Main browser regression run 37536656828 and Pages run 37536654747 passed. Live version and routing asset are FINAL.31.
- Highway ON now means actual candidate preference: motorway > tollway-only > ordinary optimal fallback. If no motorway/toll candidate is returned, do not fabricate a highway route or bypass HGV restrictions.
- FINAL.31 closes the current highway-selection maintenance scope and returns to AN15 real-evidence accumulation.

## 2026-10-07 — FINAL.32 natural expressway preference and live route progress
- Highway ON should prefer meaningful expressway usage, not merely the presence of any motorway/toll segment.
- Rank eligible ORS HGV alternatives by actual priority-road distance first, then motorway distance, then duration/distance. The alternative search uses `target_count=3`, `share_factor=0.95`, `weight_factor=2.0`.
- Do not select an expressway route just to maximize red line. A candidate is eligible only within +35% travel time capped at +15 minutes and +50% route distance capped at +20 km versus ORS primary.
- Route progress is display-only state: raw route geometry remains intact internally while the rendered line starts at the nearest accepted progress point. Already-travelled line disappears progressively.
- Navigation progress must be monotonic; do not jump backwards because of a later GPS fix.
- GPS fixes worse than 50m accuracy do not change route progress or off-route counters.
- Auto reroute requires three consecutive accurate fixes beyond the adaptive 60–100m remaining-route threshold, excludes positions within 100m of destination, and has a 30-second cooldown. Recalculation uses the current GPS position and the same HGV/highway setting.
- If auto reroute fails, keep the previous route visible; never replace it with car routing or straight-line fallback.
- Real provider evidence through FINAL.32 route handler: Nagoya IC → Komaki IC selected `expressway-distance-preferred` with motorway 16,818m / tollway 16,654m / route 27,027.6m.
- Safety tag `backup-pre-FINAL32-NAV-PROGRESS-REROUTE-20261006` -> `d059ed2740ead98bd315e7fe7ad41ceb8bc04b17`.
- PR #162 clean validation head `75832390bfd0d4c2c5995121dc11597d35e4d524` passed 22/22 Node tests, Edge 320/390 run 37539563883 and browser regression run 37539563945. Clean Preview `dpl_9wcgk6rMFy8NL1QKRxEXGZBFs6Kw` is READY; temporary smoke endpoint is removed.

## 2026-10-07 — FINAL.32 production release complete
- PR #162 merged at `2188bee148f3c6e93b817dd0fe1b5acccb366f2f` after clean validation head `75832390bfd0d4c2c5995121dc11597d35e4d524` passed 22/22 Node tests, Edge 320/390 run 37539563883, and browser regression run 37539563945.
- Real ORS through the production route handler selected `expressway-distance-preferred` for Nagoya IC → Komaki IC with motorway 16,818m, tollway 16,654m, route 27,027.6m and duration 1,669.1s. Additional invalid HGV validation routes failed closed with 422.
- Vercel production `dpl_AprtKGD6qT8f573vrGTYwhXGtfx1` is READY. Main browser regression run 37539937999 and Pages run 37539936859 passed. Live version and routing asset are FINAL.32.
- Travelled route geometry is display-clipped only; raw route geometry remains intact for route matching and safety. Sustained off-route rerouting never falls back to car/straight-line guidance.
- FINAL.32 closes the current navigation/highway maintenance scope and returns to AN15 real-evidence accumulation.

## 2026-10-07 — FINAL.33 arrival visit and MAP rotation decisions
- Arrival authority is an accurate GPS fix: accuracy must be <=50m and straight-line distance to the active destination must be <=100m. Arrival ends the active in-app route before any further progress/reroute logic.
- Arrival visit handling is one card at a time. Show the unvisited destination first, then other unvisited machines on today's active plan within 100m of the arrival position.
- Arrival card left swipe means visit complete and MUST use the existing task-confirmation and order-confirmation flow. Do not create an arrival-only bypass.
- Arrival card right swipe means today's visit skip. The standard Today list uses the same right-swipe skip; left swipe remains visit complete.
- Already visited machines are not included in the arrival deck. Nearby non-destination machines are eligible only when they are on today's current visit plan and within 100m.
- The old blocking landscape portrait guard is withdrawn. Normal pages and normal MAP remain portrait-width, the app requests portrait orientation when the platform supports it, and the manifest declares portrait preference.
- Fullscreen MAP is the only surface with a manual orientation-view control. The fullscreen-only 🔄 button software-rotates the MAP 90 degrees; this is specifically the fallback for iPhone/other rotation-lock cases where Web APIs cannot override OS orientation lock.
- Software rotation must keep the full MAP viewport filled and preserve machine PIN interaction plus modal visibility above the MAP.
- Safety tag: `backup-pre-FINAL33-ARRIVAL-CARDS-MAP-ROTATION-20261007` -> `42e9d4565e64a90abec6933d5b8d958e2e461983`.

## 2026-10-07 — FINAL.33 production release complete
- PR #164 merged to `main` at `1e0c68b2829349a2d30ba93e0414b6194ceedc0b`.
- Final PR Truck route / Edge run `37610172801` and Browser regression run `37610172731` passed.
- Main Browser regression run `37610334284` and GitHub Pages run `37610333585` passed.
- Vercel production deployment `dpl_B7PYTGPGRCNHE56dG68uPtx8voPq` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.33`; public UI exposes `🔄` plus left-complete/right-skip Today guidance.
- FINAL.33 is closed. Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a new bounded maintenance scope.

## 2026-10-07 — FINAL.34 rotated gesture decisions
- CSS software rotation alone is not sufficient for interactive MAP dragging. While `mapFullscreen + mapSoftRotated` is active, native Leaflet dragging must be disabled and pointer deltas remapped by 90 degrees before pan.
- Normal/unrotated MAP keeps native Leaflet dragging.
- Interactive MAP controls, machine PINs and form controls must remain outside the custom rotated-drag capture path.
- Arrival visit UI follows the MAP software orientation only while `mapFullscreen + mapSoftRotated` is active. It remains normal portrait orientation otherwise.
- In rotated arrival mode, visible left/right swipe semantics remain unchanged: left = complete, right = skip. The pointer axis is remapped rather than changing product semantics.
- Task and order confirmation logic remains the existing authority after an arrival-card complete gesture.
- Safety tag: `backup-pre-FINAL34-ROTATED-MAP-GESTURE-ARRIVAL-CARD-20261007` -> `aa23bca23109dfb549dd7d84fe14c912e26b6c51`.

## 2026-10-07 — FINAL.34 production release complete
- PR #166 merged to `main` at `4914b905a02b74969ce5d7a199fa68424fe5d6cb`.
- Final PR Truck route / Edge run `37612820361` and Browser regression run `37612820358` passed.
- Main Browser regression run `37612956449` and GitHub Pages run `37612955809` passed.
- Vercel production deployment `dpl_ETa4iD6suyBsosBnaXJRXb2BkxLp` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.34`.
- FINAL.34 is closed. Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a new bounded maintenance scope.

## 2026-10-07 — FINAL.35 rotated machine-detail decision
- A machine detail opened from a MAP PIN follows the MAP software orientation only while `mapFullscreen + mapSoftRotated` is active.
- Outside that exact mode, machine detail remains portrait.
- Use the same centered 90-degree sheet presentation established for the rotated arrival sheet; do not rotate every modal globally.
- Existing machine-detail actions, route controls, task/order flows, PIN interaction and FINAL.34 rotated drag/swipe behavior must remain unchanged.
- Safety tag: `backup-pre-FINAL35-ROTATED-MACHINE-CARD-20261007` -> `f5294949edca2783f45e7abbe3232b8249d70ced`.

## 2026-10-07 — FINAL.35 production release complete
- PR #168 merged to `main` at `0be90de6a25b779819a14ccf09b03718a9c44490`.
- Final PR Truck route / Edge run `37614817452` and Browser regression run `37614817466` passed.
- Main Browser regression run `37614981166` and GitHub Pages run `37614979975` passed.
- Vercel production deployment `dpl_9Zp3oos5JnPKHxvabRnubrhThjcU` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.35`.
- FINAL.35 is closed. Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a new bounded maintenance scope.

## 2026-10-07 — FINAL.36 route sanity decisions
- Non-highway route detours are treated independently from expressway preference; do not assume every detour is caused by highway ranking.
- Initial routing must not use a cached GPS position older than 5 seconds or worse than 50m accuracy. If the cache is not good enough, request a fresh high-accuracy fix with `maximumAge=0`; reject >50m for route origin.
- Sustained off-route automatic rerouting keeps the existing three-fix trigger but uses the median of the three accurate fixes as the recalculation origin rather than trusting the final single sample.
- If an automatic replacement route is an extreme distance detour relative to the remaining existing route plus reconnect distance, keep the old route and tell the operator rather than silently replacing it.
- Routing stays `driving-hgv`; registered height/width/length/weight/axleload restrictions remain authoritative. Never fix detours by falling back to car routing or straight-line guidance.
- ORS base weighting changes from `fastest` to `recommended` to reduce pure travel-time detours while retaining HGV restrictions.
- Highway ON alternative generation uses `target_count=3, share_factor=0.85, weight_factor=1.6` to seek more distinct alternatives without permitting the broad FINAL.32 detour envelope.
- Highway ON candidate admissibility is tightened to +20% travel time capped at +8 minutes and +30% distance capped at +10km versus ORS primary. Expressway distance is maximized only inside a near-fast subset (within +10% / +2min and +15% / +3km of the fastest eligible highway candidate).
- Ordinary route geometry is fluorescent cyan `#00e5ff` over a dark `#0b132b` casing; motorway/toll remains red over the same casing.
- Safety tag: `backup-pre-FINAL36-ROUTE-SANITY-VISIBILITY-20261007` -> `beb9325938954a7fa8afec8a559d4b58ee5b44d6`.

## 2026-10-07 — FINAL.36 production release complete
- PR #170 merged to `main` at `c68a6a283cac5074916bd40a9ae0fb814d1eb9cb`.
- Final PR Truck route / API / Edge run `37630470134` and Browser regression run `37630470259` passed.
- Main Browser regression run `37630690705` and GitHub Pages run `37630688603` passed.
- Vercel production deployment `dpl_9q64prYCtNWhUysBRtRs5hGy2gzr` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.36`.
- FINAL.36 is closed. Remaining route-quality anomalies require exact field-route evidence; do not weaken HGV safety globally.
- Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a bounded maintenance scope.

## 2026-10-07 — FINAL.37 active highway search decisions
- Highway ON must not rely solely on ORS alternative-route generation when field evidence shows a usable motorway route can be omitted entirely.
- Normal ORS driving-hgv alternatives remain the first pass. Active IC discovery is triggered only when route distance is meaningful and the best normal candidate's motorway use is below the bounded target.
- Active discovery uses OpenStreetMap `highway=motorway_junction` nodes via a bounded Overpass request around origin/destination.
- Build at most two plausible entry/exit IC pairs. Extra routes use ordered ORS waypoints origin -> entry IC -> exit IC -> destination.
- Every extra route MUST stay `driving-hgv` and carry the same registered vehicle height/width/length/weight/axleload restrictions. Ferries remain avoided.
- Active IC routes are candidates, never mandatory. FINAL.36 maximum time/distance detour bounds and near-fast expressway ranking remain authoritative.
- If Overpass is unavailable, no plausible IC pair exists, an extra ORS request fails, or the via route lacks meaningful motorway use, keep the normal HGV route.
- Overpass discovery is deferred until normal alternatives are known to be insufficient and cached only briefly per warm instance.
- At most two extra ORS route calls are allowed per route request; baseline and extra route calls share the 30/minute warm-instance upstream route-call guard.
- No car or straight-line fallback is permitted.
- Safety tag: `backup-pre-FINAL37-ACTIVE-HIGHWAY-IC-SEARCH-20261007` -> `77b7b437469e8100f94661fb4f5707acd1320e13`.

## 2026-10-07 — FINAL.37 production release complete
- PR #172 merged to `main` at `04ce9033731bb52a49c9d0dc636b46e7826f3a82`.
- Final PR Truck route / API / Edge run `37636733086` and Browser regression run `37636733333` passed.
- Main Browser regression run `37636924246` and GitHub Pages run `37636923395` passed.
- Vercel production deployment `dpl_58RHPeSbzBG3urLD54WrMYsCtCTo` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.37`; public UI describes active nearby-IC HGV highway search.
- FINAL.37 is closed. The next evidence is real-device retest of the previously failing highway case; do not weaken HGV safety globally without an exact failing route.
- Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a bounded maintenance scope.

## 2026-10-07 — FINAL.38 highway adoption/fullscreen decisions
- FINAL.37 field evidence proved that generating via-IC HGV candidates is insufficient if final ranking filters them through the old near-fast +2 minute window.
- When highway ON active-IC candidates pass the existing global detour caps (+20% duration capped at +8min; +30% distance capped at +10km), prefer the active IC candidate with the strongest meaningful motorway use. Do not reapply the old near-fast +2min filter to those active candidates.
- Normal/non-active ORS alternatives continue using the near-fast ranking rule.
- Active IC search should continue until normal motorway usage is materially sufficient: target 55% of primary route distance, capped at 18km.
- A generated via-IC candidate must have at least 1.5km motorway and at least 15% of the primary route distance as motorway.
- Fullscreen and software-rotation viewport changes must preserve the active route. After Leaflet `invalidateSize`, explicitly redraw the route after both early and late viewport-settle delays.
- Browser/Edge regression must directly assert route visibility before fullscreen, after fullscreen, and after software rotation.
- HGV restrictions, provider caps, global detour caps, and the no-car/no-straight-line policy remain unchanged.
- Safety tag: `backup-pre-FINAL38-HIGHWAY-ADOPTION-FULLSCREEN-ROUTE-20261007` -> `84effdd4fc616f8c4c8e9b508cd5c673d5e92dfd`.

## 2026-10-07 — FINAL.38 production release complete
- PR #174 merged to `main` at `f1987f5f2c73c0c642d36ce72959836233c885e1`.
- Final PR Truck route / API / Edge run `37640151684` and Browser regression run `37640151587` passed.
- Main Browser regression run `37640387020` and GitHub Pages run `37640385887` passed.
- Vercel production deployment `dpl_6j227M7n3db77s3hfFACap9M7XyM` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.07-FINAL.38`.
- FINAL.38 is closed. The next evidence is real-device retest of the previously failing highway route and fullscreen route persistence.
- Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a bounded maintenance scope.

## 2026-10-08 — FINAL.39 route robustness decisions
- Fullscreen route correctness means visible geometry, not merely DOM path persistence. After fullscreen/software-rotation viewport settle, refit the remaining active route into the visible MAP unless follow-current-position mode is active.
- Route client timeout must exceed the bounded server critical path. Use a 20s client route budget; run OSM junction discovery in parallel with baseline ORS; cap Overpass at 2.8s and via-IC ORS at 5.5s.
- Long-distance highway discovery must not stop after a fixed 18km motorway amount. Scale target to 55% of primary route up to 45km.
- Long-distance endpoint IC discovery may use radius up to 25km, per-end access up to 25km, and combined prefilter up to 35km.
- These are candidate-discovery bounds only. FINAL.36 final route safety caps remain authoritative: +20% duration capped at +8min and +30% distance capped at +10km.
- Preserve exact registered HGV restrictions, maximum two active via-route candidates, 30 route-call/min warm guard, and no car/straight-line fallback.
- Browser/Edge regression must assert active route overlap with the visible MAP rectangle before fullscreen, after fullscreen, and after software rotation.
- Safety tag: `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`.

## 2026-10-08 — FINAL.39 production release complete
- PR #177 merged to `main` at `6b843d988fddba509cedcd590c6fe71ba1afd6db`.
- Final PR Truck route/API/Edge run `37643816604` and Browser regression run `37643816472` passed.
- Main Browser regression run `37644030491` and GitHub Pages run `37644029832` passed.
- Vercel production deployment `dpl_7Brq9TY4PciGB65jAQoLWi1rNwm4` is READY for the exact merge SHA.
- Live public version and routing asset report `2026.10.08-FINAL.39`.
- FINAL.39 is closed. Next evidence is the same real-device long-route/highway, timeout, and iPhone fullscreen cases.
- Return to the intentionally paused AN15 evidence/promotion gate unless new field evidence opens a bounded maintenance scope.


## 2026-10-08 — FINAL.40 fullscreen routing and highway-corridor decisions

- Treat the new iPhone evidence as fullscreen-specific when the same long route succeeds in normal MAP but times out when started from fullscreen MAP. Do not explain it away as generic long-distance latency.
- Starting a route while MAP is already active must not re-click the MAP tab or trigger an unnecessary full `renderMap()`.
- While route acquisition is busy, fullscreen viewport-settle work may invalidate Leaflet size but must not redraw/refit the active route until the request has completed.
- The 20-second client timeout is a route network/body-acquisition budget. Once the response body has been received, local parsing/drawing/fitting must not be able to trip that network timeout.
- Highway ON may use JCT transitions chosen naturally by ORS between the selected entry and exit ICs. VENDRIVE should improve which bounded IC corridors are probed rather than attempting to hard-code JCT sequences.
- Keep the maximum of two active via-IC ORS candidates. When possible, use one balanced access pair plus one geographically distinct corridor so both probes are not spent on the same nearby motorway cluster.
- For long routes, the motorway-sufficiency discovery target may scale to 80km. This changes only whether active highway discovery continues; it does not loosen final route acceptance.
- FINAL.36 final caps remain authoritative: duration primary + min(20%, 8 minutes), distance primary + min(30%, 10km).
- Keep `driving-hgv`, exact registered vehicle height/width/length/weight/optional axleload, ferry avoidance, the warm 30 route-call/minute guard, and no car/straight-line fallback.
- Safety tag: `backup-pre-FINAL40-IOS-FULLSCREEN-HIGHWAY-JCT-20261007` -> `9541bd9d1d8242ec880f87315ae4fcf05052b006`.


## 2026-10-08 — FINAL.40 production release complete

- FINAL.40 product PR #180 merged to `main` at `7f58726df3ed7a69820013f94f78e80d914f32f6`.
- PR #180 Truck route readiness / API / real Edge run `37699925874` and Browser regression run `37699925873` passed.
- Follow-up PR #179 merged at `1aefd847ffc38945d305e80c560fe1e9f8b2a714`; compared with the product merge, the effective delta is test-only (`tests/run-truck-route-gates.mjs`).
- The final follow-up Truck route readiness run `37709837666` passed.
- Main Browser regression `37700422796` passed on the identical FINAL.40 product tree.
- Current-main GitHub Pages run `37709999513` passed.
- Vercel production deployment `dpl_H6MTgzUTv4z72HQSERcJcgBdRY8H` is READY for Git SHA `1aefd847ffc38945d305e80c560fe1e9f8b2a714`.
- Public `version.json` and public routing asset report `2026.10.08-FINAL.40`.
- FINAL.40 implementation/release is closed. The remaining evidence is the exact iPhone field retest of fullscreen route acquisition and the long-distance highway/JCT route.
- Automated PASS must not be treated as real-device confirmation.
- If the field issue persists, instrument the exact failing case before changing route thresholds or iOS viewport behavior again.
- AN15 learned numeric promotion remains intentionally paused; OCR/Analysis remains withdrawn.


## 2026-10-08 — FINAL.41 directional reroute and turn zoom decisions

- Direction must affect only sustained off-route automatic rerouting. Initial search and manual recalculation remain direction-agnostic.
- Use a start-bearing constraint only when travel direction evidence is reliable. Accurate raw GPS heading while moving is preferred; otherwise use an accurate movement vector; otherwise omit the bearing and reroute normally.
- ORS bearing requests must set `optimized=false`; routing remains `driving-hgv` with exact registered vehicle restrictions.
- Use a 60-degree start-bearing deviation so the reroute favors the current travel direction without over-constraining road snapping.
- Turn-aware zoom is active only while MAP current-position follow is ON.
- Detect significant upcoming bends from existing route geometry; do not increase ORS response size or add a turn-instruction dependency just for zoom.
- Zoom target is cruise 16, then 17/18/19 as the next significant bend enters 260m/120m/50m, moving by at most one zoom level per GPS update.
- Keep FINAL.40 highway/JCT discovery, FINAL.36 detour limits, upstream-call guards, and no-car/no-straight-line fallback unchanged.
- Safety tag: `backup-pre-FINAL41-DIRECTIONAL-REROUTE-TURN-ZOOM-20261008` -> `695eaa74716446f3e1f147be226d46521b7747a8`.


## 2026-10-08 — FINAL.41 production release complete

- PR #183 merged to `main` at `b8427d859afe0c9cc05d26f55859022c41c11037`.
- Final PR Truck route readiness / API / real Edge run `37720662646` and Browser regression run `37720662617` passed.
- Main Browser regression `37720926478` and GitHub Pages `37720925836` passed.
- Vercel production deployment `dpl_7sUicoU7Pbk1TtejLZWBKGwefmNa` is READY for the exact merge SHA.
- Public `version.json` and routing asset report `2026.10.08-FINAL.41`.
- FINAL.41 implementation/release is closed. The remaining evidence is real-device confirmation of direction-aware automatic reroute and turn-aware MAP follow zoom.
- Automated PASS must not be treated as real-device confirmation.
- AN15 learned numeric promotion remains intentionally paused and OCR/Analysis remains withdrawn.


## 2026-10-08 — FINAL.42 arrival-card work-detail decisions

- Arrival cards must render work details independently from Today-list card decoration.
- “All tasks” on the live arrival card means every active incomplete task currently assigned to that arriving machine; completed task history is not mixed into the visit-action card.
- Pending order display on the arrival card includes type, subtype, full detail text, and current remaining/deadline state.
- Visit completion semantics are unchanged: only tasks explicitly checked in the confirmation modal are marked complete.
- FINAL.42 makes no routing/HGV/highway/JCT/directional-reroute/turn-zoom behavior changes.
- Safety tag: `backup-pre-FINAL42-ARRIVAL-WORK-DETAILS-20261008` -> `1a84a1c5830d39b715990753fc327a059eaa7f1f`.

## 2026-10-08 — FINAL.42 production release complete

- PR #186 merged to `main` at `55f304892fcb626a73a755c4a8e0129272da91c7`.
- PR Truck route readiness `37723986337` and Browser regression `37723986287` passed.
- Main Browser regression `37724083359` and GitHub Pages `37724082816` passed.
- Vercel production deployment `dpl_8RTReXLPWn2fLGWLCAQhNNM25xCR` is READY for the exact merge SHA.
- Public `version.json` and routing asset report `2026.10.08-FINAL.42`.
- FINAL.42 implementation/release is closed. Remaining evidence is real-device confirmation of arrival-card order/task display.
- AN15 learned numeric promotion remains intentionally paused and OCR/Analysis remains withdrawn.


## 2026-10-08 — FINAL.43 office internal-route decisions

- Office navigation is an internal VENDRIVE HGV destination, not a vending-machine visit target.
- Office list row/button and office MAP pin both start the internal `driving-hgv` route.
- Office destination validity must resolve against `state.offices`; vending-machine destinations continue resolving against `state.machines`.
- Office arrival ends the route but must not open machine visit/task/order arrival workflows.
- Keep the explicit external-navigation action in the active route panel as an optional secondary path.
- Do not alter registered HGV restrictions, highway/JCT selection, direction-aware reroute, turn-aware zoom, provider-call guards, or FINAL.36 final detour caps.
- Safety tag: `backup-pre-FINAL43-OFFICE-INTERNAL-HGV-ROUTE-20261008` -> `af8f34f363b25ea1885df22adc35dc6b01ac3ec0`.

## 2026-10-08 — FINAL.43 production release complete

- PR #189 merged to `main` at `e648323947019745e507015f61ddb0b464163f43`.
- PR Truck route readiness `37730660379` and Browser regression `37730661344` passed.
- Main Browser regression `37730783341` and GitHub Pages `37730782368` passed.
- Vercel production deployment `dpl_9HEPeoR4Cd8QLSb5GuA1FuHn7HWM` is READY for the exact merge SHA.
- Public Pages and Vercel version endpoints report `2026.10.08-FINAL.43`.
- FINAL.42 arrival-card task display is now user-confirmed OK; FINAL.42 order-detail display plus FINAL.40/41 field checks remain pending.
- FINAL.43 implementation/release is closed. Remaining evidence is real-device confirmation of office internal routing and office-arrival behavior.
- AN15 learned numeric promotion remains intentionally paused and OCR/Analysis remains withdrawn.


## 2026-10-08 — FINAL.44 task-gauge decisions

- Task progress gauges scale against each task's configured auto-completion threshold instead of always using 100% actual completion as the visual full-scale target.
- The displayed numeric completion percentage remains the actual completion percentage.
- Task auto-completion threshold semantics and persistence remain unchanged.
- The same threshold-relative gauge scale is used on the task card and task detail.
- FINAL.44 does not change routing, HGV, highway/JCT, direction-aware reroute, or turn-aware zoom behavior.
- Safety tag: `backup-pre-FINAL44-TASK-THRESHOLD-GAUGE-20261008` -> `712f89119ce14ed62cb028cbaafdb46e2c730f64`.

## 2026-10-08 — FINAL.44 production release complete

- PR #192 merged to `main` at `afcbf0b639959fa6c3d80bf202021f060d487593`.
- PR Truck route readiness `37733253158` and Browser regression `37733253132` passed.
- Main Browser regression `37733379642` and GitHub Pages `37733378870` passed.
- Vercel production deployment `dpl_6aoh9uco7ahAzzr53MtxV6Y9Egqw` is READY for the exact merge SHA.
- Public Pages and Vercel version endpoints report `2026.10.08-FINAL.44`.
- FINAL.44 implementation/release is closed. Remaining evidence is real-device visual confirmation of threshold-relative task gauges.
- AN15 learned numeric promotion remains intentionally paused and OCR/Analysis remains withdrawn.


## 2026-10-08 — FINAL.45 highway diagnosis decisions and release

- The user's confirmed remaining navigation defect is highway ON selecting surface roads on a route where Google Maps selects expressway; recent other features are basically OK.
- Do not presume the cause is ORS, Overpass IC discovery, pair selection, or FINAL.36 final rejection before a field diagnostic.
- Expose copyable, privacy-safe diagnostics only; no raw coordinates, destinations, truck parameters or provider secrets.
- Expand existing IC search diagnostic counters without increasing any provider request counts or changing how routes are selected.
- Preserve `driving-hgv`, registered restrictions, the maximum of two via-IC active candidates, warm 30/min guard, FINAL.36 time and distance detour limits, highway OFF avoidance, and no car/straight-line fallback.
- Safety tag: `backup-pre-FINAL45-HIGHWAY-DIAGNOSTICS-20261008` -> `f6c5052d0def10a5f64ab842395bcbab04f5a7ec`.
- PR #196 product merge: `da376f589387144774c7d7e8dc6eb6f024a919b9`; Truck route/real Edge `37751032915` PASS; PR Browser `37751032983` PASS; main Browser `37751257933` PASS; Pages `37751256803` PASS; Vercel `dpl_Dhk2ZmXDw748B9UfdcxvREmKuf8M` READY for merge SHA.
- Public Pages and Vercel versions: `2026.10.08-FINAL.45`.
- Release is complete; exact next evidence is one copied real-device highway diagnosis. Do not mark the expressway-selection mismatch resolved.


## 2026-10-08 — FINAL.46 timeout and deployment-blocker decisions

User corrected the highway issue: route request times out before anything renders. Prioritize getting a safe HGV base route rendered before evaluating motorway preference or requesting FINAL.45 route diagnostics.

Limit upstream timeout to fetch headers AND full JSON body. Cap optional IC searches to remaining server budget; return valid base route if optional IC exploration is too slow.

Preserve driving-hgv, registered vehicle dimensions, max two via-IC ORS requests, 30/minute warm-call guard, FINAL.36 detour caps and no car/straight-line fallback.

Safety tag backup-pre-FINAL46-HGV-TIMEOUT-BOUNDS-20261008 -> be83e6c8aee36caa114dc8926425bff81555d305. Product PR #199 merged c2307edf38c1e1256c3eaa125e86d8e9fd461edc; PR route 37754575289 PASS, PR Browser 37754575245 PASS, main Browser 37754745261 PASS, Pages 37754744610 PASS.

Vercel production API cannot deploy right now: HTTP 402 api-deployments-free-per-day (>100/day), retryAfter 86400. Current Pages FINAL.46 / Vercel API FINAL.45. Treat as TECHNICAL_BLOCKER and do NOT claim the timeout fix is live. No billing/plan changes without user approval.

After quota resets, make one exact-main Vercel production deploy and verify live backend FINAL.46; only then request iPhone retest. AN15 paused.


## 2026-10-09 — FINAL.46 API deployment complete, field retest outstanding

The prior Vercel HTTP 402 api-deployments-free-per-day blocker has been resolved: exact-main deployment dpl_4hqEhQPKHQJUHgY3io8XCKj4Bpum became READY for main SHA 8155695040e877614081a927aa39d7cfe534da35. No upgrade/billing change occurred.

Public GitHub Pages and Vercel version.json both show FINAL.46. Mark only deployment/release as complete; do NOT claim the user’s route no longer times out until the exact iPhone route has been retested.

Maintain exact driving-hgv restrictions, registered dimensions, 2 extra via-IC probes maximum, warm 30/min guard, FINAL.36 detour limits, and AN15 pause. If the route now renders but avoids motorways, use the sanitized FINAL.45 highway diagnostic before any further code changes.
