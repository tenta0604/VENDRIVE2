# VENDRIVE2 AI Development Roadmap

## Current state

- Visible app baseline: **2026.10.07-FINAL.32** (distance-aware natural expressway preference, travelled-route line trimming, and sustained off-route automatic rerouting; prior highway toggle/classification/fullscreen behavior preserved; Analytics engine **AN14B3B5**, DB/schema remain 4).
- Latest intelligence milestone: **AN15G2 production transport closeout + AN15 lifecycle hardening**.
- Active engineering phase: **AN15 real evidence accumulation and promotion gate**. FINAL.32 navigation/highway maintenance is released and production-verified; no additional maintenance phase is active without new field evidence.
- Production forecast values remain on the established AN9/AN14B3B2 deterministic baseline. AN15 learned corrections remain evaluation-only.
- AN15G2 `/api/explain` Vercel runtime blocker is resolved: the production adapter mismatch was fixed, PR #100 merged, and the matching production deployment is READY. The prior `FUNCTION_INVOCATION_FAILED` / `request.headers.get` crash no longer blocks the route.
- OPS10C remains withdrawn. Preserve existing Today nearest-machine ordering.

## Completed production foundations

AN1-AN14, FINAL, OPS-REAL-WORKFLOW, OPS10A, OPS10B1 and OPS10B2 remain the established production foundations.

## AN15 Intelligence v2

- **AN15A — Forecast ledger/scoring:** deterministic snapshot and exact/censored scoring API.
- **AN15B — Bounded self-calibration:** hierarchical shrinkage and walk-forward evaluation; production promotion disabled.
- **AN15C — Weather/calendar context response:** explicit context only; unknown weather stays unknown; evaluation is incremental over AN15B.
- **AN15D — Explainable machine profiles:** descriptive signals with sample confidence.
- **AN15D2 — Cross-machine pooling backtest:** no-lookahead evaluation; live pooling disabled.
- **AN15E — Substitution/cannibalization v2:** confirmed-event, censored-aware, non-causal evidence.
- **AN15F — Joint optimizer foundation:** proposal-only multi-objective scoring; no downstream writes.
- **AN15G/G2 — Grounded AI explanation:** no numeric authority; dedicated `/api/explain` Gemini transport with deterministic fallback. Production Vercel runtime adapter issue is resolved.
- **AN15 hardening — lifecycle integration:** production `listForecasts()` creates idempotent evaluation snapshots only for complete, non-lower-bound machine/product forecasts. The adapter deliberately uses a narrow exact 24-hour target. Later confirmed sales score only on exact interval identity; sold-out outcomes are censored and excluded from exact learning. Executable Node CI verifies A-C lifecycle, censoring, sparse fallback, bounds, no-lookahead, unknown weather, and AN15C-over-AN15B evaluation.

## Operational evidence phase

Do not invent another development phase merely because implementation capacity exists. The system now needs real use more than more features.

Real field use on 2026-09-18 produced bounded maintenance corrections rather than a new speculative feature phase. FINAL.16 hardened OCR period/identity correction. The FINAL.17 maintenance release added explicit post-confirm visit closeout and sales-period overlap protection. Real-device use then exposed a narrower FINAL.18 issue: a compact-review rerender could drop visit callbacks, especially after correcting a sales-journal field, which removed the post-confirm continuation/end choices. FINAL.18 preserves those callbacks and connects explicit OCR visit closeout to the existing Today completion flow, including the existing task and order confirmations. PR #108 is merged and production/live browser verification passed, so focused real-device confirmation is the remaining operational check before normal evidence accumulation continues. FINAL.19 restores the missing per-machine vehicle-bring proposal control as strict opt-in: legacy/unset and new machines default OFF, and only explicitly ON machines feed bring-from-vehicle or end-of-day loading proposals. PR #111 is merged and production/live verification passed, so normal evidence accumulation has resumed. Real-device continuation then exposed a FINAL.20 maintenance defect: the same visit could reject a later input/recovery paper with `Visit vendor mismatch` because visit continuity was keyed too strictly to the first paper's vendor identity. FINAL.20 uses an already trusted same-machine identity as the visit anchor while preserving each paper's own maker/vendor identity, and starts OCR automatically immediately after image capture. PR #114 is merged and production/live verification passed. Later product-master maintenance connected confirmed OCR products into searchable master/stocktake flows, repaired the Product Master controls and Analysis inventory ordering, and HF2D now standardizes product presentation as maker group → smaller detected container size → younger natural product number, with the maker-group order itself based on each maker's youngest product number. PR #130 is merged and both PR/main browser regression plus production deployment checks passed.

FINAL.21 intentionally withdraws the user-facing report-photo/OCR and Analysis surfaces because the operator does not have time for photo capture in normal field work. Historical Analytics data/code remains preserved rather than destructively deleted. The same maintenance release also fixes manual next-workday plan carryover: saved additions/exclusions are applied to the actual workday through existing force/skip semantics, with urgent orders remaining visible as a safety override. PR #136 and both PR/main browser gates passed, along with GitHub Pages and Vercel production deployment.

FINAL.22 adds task targeting and partial-rollout completion without reopening Analytics. The five-tab navigation now explicitly fills the full row. Task creation can target one vending machine directly as well as the existing all/manufacturer scope. Each task can use a 1–100% auto-completion threshold (legacy/default 100%), and existing active tasks can edit that threshold. Completion triggers on the exact completed/target ratio reaching the threshold. PR #139 and both PR/main browser gates passed, along with GitHub Pages and Vercel production deployment.

FINAL.23 replaces the fixed one-machine task mode from FINAL.22 with a true selection-type workflow. Operators can choose any number of arbitrary vending machines via search, see/remove the selected set before save, or continue to use all/manufacturer-wide targeting. Existing single-machine/custom target sets migrate to selection semantics. Percentage auto-completion is unchanged. PR #142 and both PR/main browser gates passed, along with GitHub Pages and Vercel production deployment.

During normal field use, treat these as evidence that can reopen engineering:

1. Repeated operator friction or avoidable manual work.
2. Incorrect, misleading, or poorly grounded proposals/explanations.
3. Information that is repeatedly needed but unavailable at the decision point.
4. Failure of eligible exact forecast/outcome pairs to accumulate as intended.
5. Measured forecast errors or patterns that real held-out evidence shows can be improved safely.

Absent such evidence, keep the current system stable.

## Remaining promotion gates

Before any learned numeric correction may influence production forecasts:

1. Accumulate enough **real exact** 24-hour scored pairs. Do not weaken interval matching merely to increase sample count.
2. Demonstrate held-out/no-lookahead improvement for AN15B versus deterministic baseline.
3. Demonstrate incremental held-out improvement for AN15C versus AN15B before context adjustment can be promoted.
4. Evaluate AN15D2 pooling only after local AN15B/C baselines have enough evidence; pooling remains disabled unless it improves held-out error without unstable donor dependence.
5. Any promotion must be bounded, versioned, reversible, auditable, sample/confidence gated, and fall back to the deterministic baseline when evidence is sparse.

## Withdrawn

### OPS10C — Explicit Active Visit / Nearby Candidate Workflow

Field verification rejected the install-spot workflow. It was removed from production and must not be treated as pending.

## Permanent analysis principles

- Normalize sales over `previousClearAt` → `observedAt`.
- Treat sold-out information as censored-demand evidence; never invent lost demand.
- Keep RAW observations, COMPUTED evidence, and RECOMMENDATION proposals separate.
- Do not claim causality from correlation or substitution signals.
- Unknown product/weather/context facts remain unknown.
- Gemini/LLM explains grounded results; deterministic/statistical code owns numeric forecasting and optimization.
- Learned corrections require no-lookahead evidence, bounded effects, reversibility, and auditability before production promotion.
- Prefer field evidence over speculative feature expansion.

## Recovery note

Current work and blockers live in `.ai/STATE.json`; the most recent completed operation and next gate live in `.ai/LAST_RUN.json`; locked decisions live in `.ai/DECISIONS.md`.

## FINAL.24 truck-route release (2026-10-06)

FINAL.24 released user-configurable HGV routing. PR #145 merged, final real Edge and regression gates passed, a real HeiGIT/openrouteservice `driving-hgv` Preview route passed, Vercel production is READY, and live GitHub Pages reports `2026.10.06-FINAL.24`. The 5.57m / 1.88m / 2.38m / 6.095t values remain validation-only evidence and are not hard-coded defaults; every user supplies their own actual vehicle profile. Resume AN15 real-evidence work unless field use produces a new concrete routing defect or friction.

## FINAL.25 route-guidance display release (2026-10-06)

FINAL.25 improves the released HGV route display without changing routing authority or vehicle-profile semantics. ORS `waycategory` bit 1 (`motorway` / `motorway_link`) is rendered orange and ordinary road sections remain blue. The current-position marker becomes a direction arrow when heading is known, preferring browser Geolocation heading and falling back to bearing from meaningful movement. Visual GPS movement is eased between fixes and clearly poor fixes over 100m accuracy do not visually jump an existing marker; raw runtime GPS state remains available to the existing route-position logic. PR #147 merged after 13/13 Node tests, real Microsoft Edge at 320/390, all five existing regressions, and a real ORS `waycategory` Preview call passed. Vercel production and GitHub Pages FINAL.25 were verified. The one-phase pre-edit safety exception used an untouched backup branch at `398d1d9bd93b37092c6e780a0d0fe2445d8168b2`, explicitly approved by the user because annotated-tag creation was unavailable through the active write path.

## FINAL.26 route-mode/orientation validation (2026-10-06)

Field feedback reported that motorway coloring appeared unchanged and requested portrait-only non-MAP screens plus a landscape/fullscreen MAP. Real ORS `driving-hgv` verification between Nagoya IC and Komaki IC returned `waycategory` values `3 / 1 / 3 / 0 / 3`, confirming the motorway bit is supplied and the FINAL.25 bit test is correct. An all-blue route is valid when the chosen route contains no motorway, especially when the saved `有料道路を避ける` option is ON. FINAL.26 therefore keeps the deterministic classifier, adds explicit `高速区間あり/なし` and `有料道路回避中/使用可` status, and clarifies the toll setting instead of silently changing it. Non-MAP mobile screens attempt portrait lock with a landscape guard fallback. MAP remains rotatable and adds app-managed fullscreen, with native Fullscreen/landscape lock used when supported. PR #150 final validation head `9ee560e71f986cb7ab1275b46e9760a4d88d77be` passed 13/13 Node tests, real Edge 320/390, the orientation/fullscreen gates, and all five existing browser regressions. Production remains FINAL.25 pending explicit release approval.

## FINAL.26 route-mode/orientation production release (2026-10-06)

FINAL.26 is released and production-verified. A real ORS HGV route from Nagoya IC to Komaki IC confirmed motorway-bit data is present; the product keeps the existing bit classifier and now makes `高速区間あり/なし` plus `有料道路回避中/使用可` explicit so an all-blue route is understandable. Non-MAP mobile screens are portrait-first with a guard fallback, while MAP can remain landscape and enter an app-managed full-viewport mode, optionally using native fullscreen/orientation lock where supported. PR #150 merged after final Edge/regression gates, Vercel production is READY, GitHub Pages run 37487664235 succeeded, and the live site reports `2026.10.06-FINAL.26` with the new UI visible. Resume AN15 real-evidence accumulation unless field use reveals another concrete issue.

## FINAL.27 route-color/fullscreen-PIN production release (2026-10-07)

Repeated field feedback showed two concrete presentation defects. First, FINAL.25/26 used orange for motorway spans even though the desired operational distinction was red; it also highlighted only ORS Highway bit 1. FINAL.27 renders ordinary route spans blue and any Highway-bit or Tollways-bit span red, with legend/footnote text matching that meaning. Second, fullscreen MAP elevated the map above normal modal z-order and could use map-element native Fullscreen, which made PIN-opened machine details inaccessible. FINAL.27 uses app-managed full-viewport MAP as the authoritative fullscreen mode, places open modals above it, and keeps machine PIN wrappers pointer-interactive. Real Edge at 320/390 now explicitly taps a machine PIN during fullscreen and requires the machine detail modal to be visible. PR #152, Vercel production, main push regression and GitHub Pages all passed; live version is `2026.10.07-FINAL.27`.

## FINAL.28 routing-asset cache production release (2026-10-07)

The repeated all-blue field symptom exposed an asset-version defect rather than a new ORS classification defect. The app HTML had advanced through FINAL.27 while the external routing script URL remained fixed at `truck-routing.js?v=2026.10.06-TRUCK-ROUTE`. A client could therefore reuse an older routing module whose `routeSections` output lacked `highlight`, while FINAL.27's drawing code checked only `highlight`; that mixed-version state paints every span blue. FINAL.28 requests `truck-routing.js?v=2026.10.07-FINAL.28`, exports the same runtime `assetVersion`, verifies HTML/runtime/version.json agreement in real Edge, and falls back to `motorway || tollway` for legacy section objects. 15/15 Node tests, Edge 320/390, existing five regressions, Vercel production, main push regression and GitHub Pages all passed. Live version is `2026.10.07-FINAL.28`.

## FINAL.29 dedicated tollways-extra validation (2026-10-07)

FINAL.28 field evidence showed the route summary itself reported `高速・有料区間なし`, so the remaining all-blue symptom was no longer a draw/cache defect. The relay had requested only ORS `waycategory`, even though ORS exposes dedicated `tollways` extra information separately. FINAL.29 requests and sanitizes both sources, then marks a geometry span red when either waycategory Highway/Tollways evidence or dedicated `tollways=1` evidence exists. It intentionally does not use `waytype=1` as a red fallback because that bucket also includes primary/trunk roads. The browser fixture reproduces the field-shaped case `waycategory=0` plus `tollways=1` and requires a red span and `有料区間あり`. Final clean Edge 320/390 and all five existing browser regressions pass. A real Vercel Preview provider probe confirmed dedicated tollways values `[1,0]` and three tollway spans on Nagoya IC → Komaki IC. PR #156 is merged and FINAL.29 is production/live verified: Vercel production is READY, main browser regression passed, GitHub Pages deployed successfully, and the public app/routing asset report FINAL.29.

## FINAL.29 dedicated tollways-extra production release (2026-10-07)

FINAL.29 is released and production-verified. The HGV relay requests both ORS `waycategory` and dedicated `tollways` extras, sanitizes each independently, and merges their classifications edge-by-edge so differing span boundaries are safe. A span is red when either source provides motorway/toll evidence; ordinary spans remain blue. The field-shaped fixture `waycategory=0` + `tollways=1` passes in real Edge, and a real Preview provider probe confirmed dedicated tollway spans. PR #156 merged, Vercel production is READY, main regression and GitHub Pages passed, and the live app/routing asset report `2026.10.07-FINAL.29`. Resume AN15 evidence accumulation unless the exact same field route still reports no classification; if it does, capture its endpoints for upstream OSM/ORS investigation.

## FINAL.30 MAP highway-toggle validation (2026-10-07)

Field use showed the practical issue was route choice: the displayed route was not entering an expressway. FINAL.30 adds a compact `高速 ON/OFF` control to the MAP tool stack and synchronizes it with the existing persisted truck preference. ON means highways/tollways are allowed and the HGV request uses `preference=fastest`; OFF explicitly avoids `highways`, `tollways`, and ferries. Toggling an active route immediately recalculates it. Vehicle settings use the same preference with positive wording `高速道路を使う`. Real Edge at 320/390 and all existing regressions pass. A real Preview provider comparison on the same origin/destination returned motorway+tollway with four red sections for ON, and no motorway/tollway/red sections for OFF. PR #158 is merged and FINAL.30 is production/live verified: Vercel production is READY, main browser regression passed, GitHub Pages deployed successfully, and the live app/routing asset report FINAL.30.

## FINAL.30 MAP highway-toggle production release (2026-10-07)

FINAL.30 is released and production-verified. The MAP now has a compact `高速 ON/OFF` control sharing the same persisted preference as truck settings. ON requests fastest HGV routing with highways/tollways allowed; OFF explicitly avoids highways/tollways. Active routes recalculate immediately on toggle. Real provider comparison confirmed ON used motorway+tollway/red sections while OFF used no motorway/tollway/red sections. PR #158 merged, Vercel production is READY, main regression and GitHub Pages passed, and the live version/routing asset report `2026.10.07-FINAL.30`.

## FINAL.31 highway-candidate preference validation (2026-10-07)

FINAL.30 exposed the remaining semantic gap: highway ON only allowed expressways; ORS could still return an all-surface fastest route and VENDRIVE accepted it. FINAL.31 requests up to three HGV alternative routes when highway mode is ON, then selects motorway candidates first, tollway-only candidates second, and the normal optimal route only when no highway/toll candidate exists. Same-priority candidates are ordered by duration then distance. OFF remains strict and requests no alternatives while avoiding highways/tollways/ferries. 19/19 Node tests, real Edge 320/390, and all five existing browser regressions pass. A real Preview ORS probe returned three alternative HGV features for Nagoya IC → Komaki IC and all three contained motorway/tollway evidence. PR #160 is merged and FINAL.31 is production/live verified: Vercel production is READY, main browser regression passed, GitHub Pages deployed successfully, and the live app/routing asset report FINAL.31.

## FINAL.31 highway-candidate preference production release (2026-10-07)

FINAL.31 is released and production-verified. Highway ON now requests up to three ORS HGV alternatives and actively prefers motorway evidence, then tollway-only evidence, before using the ordinary optimal fallback. This closes the FINAL.30 semantic gap where highways were merely allowed. Real ORS Preview confirmed alternative-route support, 19/19 Node tests and real Edge 320/390 passed, all existing regressions passed, PR #160 merged, Vercel production is READY, GitHub Pages succeeded, and the live app/routing asset report `2026.10.07-FINAL.31`. If the operator's exact route still stays off expressways, exact endpoints are the next required evidence because the provider did not return a usable highway candidate under the registered HGV restrictions.

## FINAL.32 natural highway + live navigation validation (2026-10-07)

FINAL.31 still treated any motorway-bearing candidate as equivalent, so a short expressway segment could win even when another reasonable candidate used substantially more expressway. FINAL.32 measures actual motorway/toll distance and selects the longest eligible priority-road usage while bounding detours to +35% time (max +15 min) and +50% distance (max +20 km) versus the provider primary route. It also converts route display into live navigation behavior: accurate GPS progress clips already-travelled geometry from the visible line, and three sustained off-route fixes beyond an adaptive 60–100m threshold trigger automatic recalculation with a 30-second cooldown. Poor GPS (>50m accuracy) cannot advance or reroute. 22/22 Node tests, real Edge 320/390 and all five existing regressions pass. A real Preview call through the production route handler selected about 16.8 km of motorway on Nagoya IC → Komaki IC. PR #162 is merged and FINAL.32 is production/live verified: Vercel production is READY, main browser regression passed, GitHub Pages deployed successfully, and the live app/routing asset report FINAL.32.

## FINAL.32 natural highway + live navigation production release (2026-10-07)

FINAL.32 is released and production-verified. Highway ON now measures real motorway/toll distance across ORS HGV alternatives and prefers the longest reasonable expressway usage while rejecting excessive detours. Real provider validation selected about 16.8 km of motorway for Nagoya IC → Komaki IC. Navigation display now removes already-travelled geometry as accurate GPS progress advances, and three sustained accurate off-route fixes automatically recalculate from the current position with a 30-second cooldown; failed automatic reroutes retain the previous route. 22/22 Node tests, real Edge 320/390, all existing regressions, Vercel production, main regression and GitHub Pages passed. Live version is `2026.10.07-FINAL.32`.
