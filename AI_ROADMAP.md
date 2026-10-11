# VENDRIVE2 AI Development Roadmap

## Current state

- Visible app baseline: **2026.10.09-FINAL.50** (destination-anchored nearby arrival cards, compact landscape overlays, per-machine task history, fullscreen guidance and smoother zoom; engine **AN14B3B5**, DB/schema remain 4).
- Latest intelligence milestone: **AN15G2 production transport closeout + AN15 lifecycle hardening**.
- Active engineering phase: **AN15 real evidence accumulation and promotion gate — intentionally paused by product decision**. FINAL.50 is released and production-verified. Reopen AN15 evidence capture only with explicit authorization or a genuinely usable authorized outcome source.
- 2026-10-07 evidence-gate decision: after confirming that the current field workflow has no authorized low-friction real sales-outcome source, the user chose to **pause AN15 learned numeric promotion for now**. This is an intentional product pause, not an active defect. Do not add a new manual outcome-capture flow, silently restore OCR/Analysis, or weaken exact/no-lookahead matching. Keep the deterministic production baseline unchanged and reopen AN15 evidence capture only with explicit authorization or a genuinely usable authorized outcome source.
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

## FINAL.33 arrival visit cards + fullscreen MAP software rotation validation (2026-10-07)

A new bounded field-work maintenance scope adds automatic arrival closeout and faster visit handling without reopening the withdrawn OCR/Analysis workflow. Accurate GPS fixes (<=50m accuracy) within 100m of the active destination end the in-app route and open one nearby visit card at a time. The destination is first when unvisited, followed by other unvisited machines on today's plan within 100m. Left swipe completes through the existing task/order confirmation flow; right swipe skips today's visit. The standard Today list gains the same right-swipe skip.

The prior landscape blocking guard is withdrawn. Normal app/MAP remain portrait-width and portrait orientation is requested where supported. Fullscreen MAP adds a software 90-degree 🔄 rotation mode so rotation-locked iPhone users can change MAP viewing direction without bypassing the OS orientation lock. Fullscreen PIN/modal behavior is preserved.

Safety tag `backup-pre-FINAL33-ARRIVAL-CARDS-MAP-ROTATION-20261007` points to `42e9d4565e64a90abec6933d5b8d958e2e461983`. PR #164 validation passed Truck route readiness / real Edge 320/390 run `37609873036` and Browser regression run `37609873072`. Production release evidence is still pending.

## FINAL.33 arrival visit cards + fullscreen MAP software rotation production release (2026-10-07)

FINAL.33 is released and production-verified. Accurate <=50m GPS within 100m of the active destination ends the in-app route, then presents one unvisited visit card at a time: destination first and other today's-plan machines within 100m after it. Left swipe uses the existing task/order confirmation path before visit completion; right swipe skips today's visit. Standard Today cards use the same bidirectional swipe behavior.

The old landscape-blocking portrait guard is withdrawn. Normal app/MAP remain portrait-width and request portrait orientation where supported. Fullscreen MAP alone exposes a `🔄` software-rotation control so rotation-locked devices can rotate the MAP view without bypassing OS orientation lock. Fullscreen PIN/modal interaction remains preserved.

Safety tag `backup-pre-FINAL33-ARRIVAL-CARDS-MAP-ROTATION-20261007` -> `42e9d4565e64a90abec6933d5b8d958e2e461983`. PR #164 merged at `1e0c68b2829349a2d30ba93e0414b6194ceedc0b`. Final PR runs `37610172801` and `37610172731`, main Browser regression `37610334284`, and Pages `37610333585` passed. Vercel production `dpl_B7PYTGPGRCNHE56dG68uPtx8voPq` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.33`.

FINAL.33 closes this maintenance scope. Normal project state returns to the intentionally paused AN15 real-evidence/promotion gate.

## FINAL.34 rotated fullscreen MAP gesture + arrival-card orientation validation (2026-10-07)

Real-device evidence showed that FINAL.33's software-rotated MAP transformed pixels but not the Leaflet drag coordinate system, and its arrival visit sheet did not rotate with the MAP. FINAL.34 remaps fullscreen software-rotated pointer deltas by 90 degrees before Leaflet pan, while leaving normal MAP dragging untouched. The arrival visit sheet rotates only in this fullscreen software-rotated mode and its visible left/right swipes are interpreted on the rotated axis.

Safety tag `backup-pre-FINAL34-ROTATED-MAP-GESTURE-ARRIVAL-CARD-20261007` -> `aa23bca23109dfb549dd7d84fe14c912e26b6c51`. PR #166 final product validation passed Truck route readiness / real Edge 320/390 run `37612564670` and Browser regression run `37612564593`. Production release evidence is pending.

## FINAL.34 rotated fullscreen MAP gesture + arrival-card orientation production release (2026-10-07)

FINAL.34 is released and production-verified. Software-rotated fullscreen MAP now remaps drag input into the rotated Leaflet axes, while normal MAP dragging remains native. Arrival visit UI rotates only in that software-rotated fullscreen mode, and its visible left/right gestures are interpreted on the rotated pointer axis so complete/skip semantics stay unchanged.

Safety tag `backup-pre-FINAL34-ROTATED-MAP-GESTURE-ARRIVAL-CARD-20261007` -> `aa23bca23109dfb549dd7d84fe14c912e26b6c51`. PR #166 merged at `4914b905a02b74969ce5d7a199fa68424fe5d6cb`. Final PR runs `37612820361` and `37612820358`, main Browser regression `37612956449`, and Pages `37612955809` passed. Vercel production `dpl_ETa4iD6suyBsosBnaXJRXb2BkxLp` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.34`.

FINAL.34 closes this maintenance scope. Normal project state returns to the intentionally paused AN15 real-evidence/promotion gate.

## FINAL.35 rotated machine-detail card validation (2026-10-07)

A new bounded field-work maintenance scope aligns PIN-opened machine details with the existing software-rotated fullscreen MAP experience. The machine detail sheet rotates 90 degrees only while fullscreen MAP software rotation is active, and stays portrait in normal or unrotated MAP modes. Existing machine controls and FINAL.34 interactions remain preserved.

Safety tag `backup-pre-FINAL35-ROTATED-MACHINE-CARD-20261007` -> `f5294949edca2783f45e7abbe3232b8249d70ced`. PR #168 validation passed Truck route readiness / real Edge 320/390 run `37614566359` and Browser regression run `37614566431`. Production release evidence is pending.

## FINAL.35 rotated machine-detail card production release (2026-10-07)

FINAL.35 is released and production-verified. A machine detail opened from a MAP PIN rotates 90 degrees only while fullscreen MAP software rotation is active and remains portrait otherwise. Existing machine controls and FINAL.34 rotated MAP/arrival behavior remain preserved.

Safety tag `backup-pre-FINAL35-ROTATED-MACHINE-CARD-20261007` -> `f5294949edca2783f45e7abbe3232b8249d70ced`. PR #168 merged at `0be90de6a25b779819a14ccf09b03718a9c44490`. Final PR runs `37614817452` and `37614817466`, main Browser regression `37614981166`, and Pages `37614979975` passed. Vercel production `dpl_9Zp3oos5JnPKHxvabRnubrhThjcU` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.35`.

FINAL.35 closes this maintenance scope. Normal project state returns to the intentionally paused AN15 real-evidence/promotion gate.

## FINAL.36 route sanity + visibility validation (2026-10-07)

A bounded routing maintenance scope addresses non-highway detours, inconsistent reroute origins, highway candidate diversity, and weak ordinary-route visibility while preserving HGV safety constraints. Initial route GPS is now fresher/stricter, automatic reroute uses the median of three sustained accurate fixes, and extreme replacement detours are rejected. ORS remains driving-hgv with registered vehicle restrictions and uses recommended weighting. Highway alternatives are more diverse but tighter-bounded, with expressway distance preference limited to near-fast candidates. Ordinary route geometry is fluorescent cyan with a dark casing; priority sections remain red.

Safety tag `backup-pre-FINAL36-ROUTE-SANITY-VISIBILITY-20261007` -> `beb9325938954a7fa8afec8a559d4b58ee5b44d6`. PR #170 validation passed Truck route readiness / real Edge run `37629834281`; browser regression on identical product code passed run `37629618914`. Production release evidence is pending.

## FINAL.36 route sanity + visibility production release (2026-10-07)

FINAL.36 is released and production-verified. It reduces non-highway detour risk with fresher route-origin GPS, median sustained-off-route recalculation origin, an extreme replacement-detour guard, and ORS recommended HGV weighting while retaining exact vehicle restrictions. Highway ON alternatives are more diverse but tighter-bounded and expressway distance is only maximized among near-fast candidates. Ordinary route geometry is fluorescent cyan over a dark casing; priority sections remain red.

Safety tag `backup-pre-FINAL36-ROUTE-SANITY-VISIBILITY-20261007` -> `beb9325938954a7fa8afec8a559d4b58ee5b44d6`. PR #170 merged at `c68a6a283cac5074916bd40a9ae0fb814d1eb9cb`. Final PR runs `37630470134` and `37630470259`, main Browser regression `37630690705`, and Pages `37630688603` passed. Vercel production `dpl_9q64prYCtNWhUysBRtRs5hGy2gzr` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.36`.

FINAL.36 closes this maintenance scope. Any still-bad route should be investigated from an exact field origin/destination pair rather than globally weakening HGV routing. Normal project state returns to the intentionally paused AN15 evidence/promotion gate.

## FINAL.37 active highway IC search validation (2026-10-07)

FINAL.37 changes highway ON from passive ranking to bounded active discovery when normal ORS alternatives contain insufficient motorway use. The server queries nearby OSM motorway junctions, creates at most two plausible entry/exit pairs, and evaluates driving-hgv routes through those ICs while preserving all vehicle restrictions. IC candidates remain subject to FINAL.36 detour limits and near-fast ranking; failures fall back to the normal HGV route. Extra route calls share the warm-instance quota guard and no car fallback is introduced.

Safety tag `backup-pre-FINAL37-ACTIVE-HIGHWAY-IC-SEARCH-20261007` -> `77b7b437469e8100f94661fb4f5707acd1320e13`. PR #172 validation passed Truck route/API/Edge run `37636311481` and Browser regression run `37636311451`. Production release evidence is pending.

## FINAL.37 active highway IC search production release (2026-10-07)

FINAL.37 is released and production-verified. Highway ON now goes beyond passive ranking: when normal ORS HGV alternatives contain too little motorway use, the server discovers nearby OSM motorway junctions and evaluates at most two plausible entry/exit IC pairs as additional driving-hgv waypoint routes. Every extra route preserves registered vehicle restrictions and remains subject to FINAL.36 detour limits and near-fast ranking. Discovery failures fall back safely to the normal HGV route and no car fallback exists.

Safety tag `backup-pre-FINAL37-ACTIVE-HIGHWAY-IC-SEARCH-20261007` -> `77b7b437469e8100f94661fb4f5707acd1320e13`. PR #172 merged at `04ce9033731bb52a49c9d0dc636b46e7826f3a82`. Final PR runs `37636733086` and `37636733333`, main Browser regression `37636924246`, and Pages `37636923395` passed. Vercel production `dpl_58RHPeSbzBG3urLD54WrMYsCtCTo` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.37`.

FINAL.37 closes this maintenance scope. Retest the previously failing field route; any remaining issue should become a new exact origin/destination evidence case. Normal project state returns to the intentionally paused AN15 evidence/promotion gate.

## FINAL.38 highway adoption + fullscreen route persistence validation (2026-10-07)

FINAL.38 addresses field evidence that FINAL.37 still looked unchanged and fullscreen MAP could lose active route geometry. Active via-IC driving-hgv candidates now bypass the old near-fast +2 minute filter once they pass the stricter global detour caps, while normal provider alternatives retain near-fast ranking. Active IC search remains bounded, requires meaningful motorway use, and preserves exact vehicle restrictions. Fullscreen/rotation viewport refresh explicitly redraws the active route after size invalidation.

Safety tag `backup-pre-FINAL38-HIGHWAY-ADOPTION-FULLSCREEN-ROUTE-20261007` -> `84effdd4fc616f8c4c8e9b508cd5c673d5e92dfd`. PR #174 validation passed Truck route/API/Edge run `37639777479` and Browser regression run `37639777130`. Production release evidence is pending.

## FINAL.38 highway adoption + fullscreen route production release (2026-10-07)

FINAL.38 is released and production-verified. Active via-IC HGV motorway candidates that pass the established global detour envelope can now win highway-ON selection without the old near-fast +2 minute band forcing the route back to a surface-road candidate. Normal provider alternatives still use near-fast ranking. Fullscreen and software-rotation viewport refresh explicitly redraws the active route after Leaflet size invalidation at two settle points so iOS viewport changes do not drop route geometry.

Safety tag `backup-pre-FINAL38-HIGHWAY-ADOPTION-FULLSCREEN-ROUTE-20261007` -> `84effdd4fc616f8c4c8e9b508cd5c673d5e92dfd`. PR #174 merged at `f1987f5f2c73c0c642d36ce72959836233c885e1`. Final PR runs `37640151684` and `37640151587`, main Browser regression `37640387020`, and Pages `37640385887` passed. Vercel production `dpl_6j227M7n3db77s3hfFACap9M7XyM` is READY for the exact merge SHA. Public version and routing asset report `2026.10.07-FINAL.38`.

FINAL.38 closes this maintenance scope. Real-device retest should now focus on the previously failing highway route and fullscreen route persistence.

## FINAL.39 route robustness validation (2026-10-08)

FINAL.39 addresses three field failures together: fullscreen route not visibly in frame, occasional route timeout, and decreasing highway use on longer destinations. Remaining active route geometry is explicitly fit after fullscreen/rotation settle; client route budget is 20s while junction discovery is parallelized and bounded; long-distance IC radius/access/motorway-sufficiency thresholds scale beyond the old 18km limits. Final route detour caps and HGV restrictions remain unchanged.

Safety tag `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`. PR #177 validation passed Truck route/API/Edge run `37643412185` and Browser regression run `37643412287`. Production release evidence is pending.

## FINAL.39 route robustness production release (2026-10-08)

FINAL.39 is released and production-verified. The active remaining route is refit into the visible fullscreen/software-rotated MAP after viewport settle. Client/server route timing is aligned with a 20s client budget, parallel bounded junction discovery, 2.8s Overpass, and 5.5s via-IC ORS. Long-distance highway discovery scales beyond the old 18km motorway and IC-access caps while FINAL.36 final detour safety caps remain unchanged.

Safety tag `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`. PR #177 merged at `6b843d988fddba509cedcd590c6fe71ba1afd6db`. Final PR runs `37643816604` and `37643816472`, main Browser regression `37644030491`, and Pages `37644029832` passed. Vercel production `dpl_7Brq9TY4PciGB65jAQoLWi1rNwm4` is READY for the exact merge SHA. Public version and routing asset report `2026.10.08-FINAL.39`.

FINAL.39 closes this maintenance scope. Retest the same field long-route/highway, timeout, and iPhone fullscreen cases; any remaining exact failure becomes a new bounded evidence case. Normal project state returns to the intentionally paused AN15 evidence/promotion gate.


## FINAL.40 iPhone fullscreen routing + diversified highway corridor validation (2026-10-08)

Real-device evidence after FINAL.39 showed a fullscreen-specific iPhone route-acquisition timeout that did not reproduce in normal MAP, plus insufficient motorway use on longer routes that may require a different IC corridor and JCT transitions. FINAL.40 removes the redundant MAP-tab rerender on fullscreen route start, prevents fullscreen viewport-settle route redraw/refit from competing with an in-flight route request, and ends the client network timer once the response body arrives. Highway discovery keeps the maximum-two via-IC budget but uses one balanced probe plus one geographically distinct bounded corridor where available, allowing ORS driving-hgv to choose farther JCT-connected motorway paths. The long-route motorway search target may scale to 80km; FINAL.36 final detour caps and exact HGV restrictions remain unchanged.

Safety tag `backup-pre-FINAL40-IOS-FULLSCREEN-HIGHWAY-JCT-20261007` -> `9541bd9d1d8242ec880f87315ae4fcf05052b006`. PR #180 validation passed Truck route readiness / API / real Edge run `37699925874` and Browser regression run `37699925873`. Production release evidence is pending.


## FINAL.40 iPhone fullscreen routing + diversified highway corridor production release (2026-10-08)

FINAL.40 is released and production-verified. Fullscreen route start no longer re-clicks the already-active MAP tab, in-flight route acquisition is isolated from fullscreen redraw/refit work, and the client network timeout is cleared after the response body arrives before local route rendering. Highway discovery still uses at most two extra via-IC ORS calls but reserves a bounded geographically distinct corridor when available, allowing `driving-hgv` to traverse farther JCT-connected motorway networks. The long-route motorway discovery target may scale to 80km while the FINAL.36 final detour envelope and exact vehicle restrictions remain unchanged.

Safety tag `backup-pre-FINAL40-IOS-FULLSCREEN-HIGHWAY-JCT-20261007` -> `9541bd9d1d8242ec880f87315ae4fcf05052b006`. Product PR #180 merged at `7f58726df3ed7a69820013f94f78e80d914f32f6`; validation runs `37699925874` and `37699925873` passed. Follow-up PR #179 merged at `1aefd847ffc38945d305e80c560fe1e9f8b2a714` with a test-only effective delta relative to the product merge, and final Truck route readiness run `37709837666` passed. Main Browser regression `37700422796` passed on the identical product tree, GitHub Pages `37709999513` passed, Vercel production `dpl_H6MTgzUTv4z72HQSERcJcgBdRY8H` is READY for current main, and the public app/routing asset report `2026.10.08-FINAL.40`.

FINAL.40 closes this maintenance scope. The next step is the same real-device iPhone retest: fullscreen route start timeout, long-distance highway/JCT usage, fullscreen route visibility, and software-rotated fullscreen visibility. Any remaining failure becomes new bounded field evidence; do not globally weaken HGV safety. AN15 remains intentionally paused.


## FINAL.41 direction-aware reroute + turn-aware follow zoom validation (2026-10-08)

FINAL.41 improves live navigation without changing initial route semantics. Initial and manual searches remain direction-agnostic, while a sustained off-route automatic reroute may constrain only the starting road direction when accurate movement evidence is available. MAP current-position follow now gradually zooms toward significant upcoming route bends one level per GPS update and relaxes again afterward. HGV restrictions, highway/JCT logic, FINAL.36 detour limits, and fallback prohibitions remain unchanged.

Safety tag `backup-pre-FINAL41-DIRECTIONAL-REROUTE-TURN-ZOOM-20261008` -> `695eaa74716446f3e1f147be226d46521b7747a8`. PR #183 validation passed Truck route readiness / API / real Edge run `37720662646` and Browser regression run `37720662617`. Production release evidence is pending.


## FINAL.41 direction-aware reroute + turn-aware follow zoom production release (2026-10-08)

FINAL.41 is released and production-verified. Initial and manual routing remain direction-agnostic. Sustained off-route automatic rerouting may constrain only the starting road direction when reliable movement evidence is available; otherwise it reroutes normally without a bearing. MAP current-position follow detects significant upcoming bends from existing route geometry and adjusts zoom gradually one level per GPS update toward zoom 16/17/18/19 as the turn approaches, then relaxes afterward. No new turn-instruction dependency was added.

Safety tag `backup-pre-FINAL41-DIRECTIONAL-REROUTE-TURN-ZOOM-20261008` -> `695eaa74716446f3e1f147be226d46521b7747a8`. PR #183 merged at `b8427d859afe0c9cc05d26f55859022c41c11037`. PR runs `37720662646` and `37720662617`, main Browser regression `37720926478`, and Pages `37720925836` passed. Vercel production `dpl_7sUicoU7Pbk1TtejLZWBKGwefmNa` is READY for the exact merge SHA. Public version and routing asset report `2026.10.08-FINAL.41`.

FINAL.41 closes this implementation/release scope. The next evidence is real-device iPhone confirmation of direction-aware off-route rerouting and turn-aware follow zoom. AN15 remains intentionally paused.


## FINAL.42 arrival-card order + task detail production release (2026-10-08)

FINAL.42 is released and production-verified. The arrival visit card now has its own work-detail rendering: it shows pending order type/subtype/full detail/deadline state and every active incomplete task assigned to the arriving machine. This is independent from the Today-list task decoration, so arrival information does not depend on how the Today list is rendered. Unchecked tasks remain incomplete during visit completion.

Safety tag `backup-pre-FINAL42-ARRIVAL-WORK-DETAILS-20261008` -> `1a84a1c5830d39b715990753fc327a059eaa7f1f`. PR #186 merged at `55f304892fcb626a73a755c4a8e0129272da91c7`. PR runs `37723986337` and `37723986287`, main Browser regression `37724083359`, and Pages `37724082816` passed. Vercel production `dpl_8RTReXLPWn2fLGWLCAQhNNM25xCR` is READY for the exact merge SHA. Public version and routing asset report `2026.10.08-FINAL.42`.

FINAL.42 closes this implementation/release scope. The next evidence is real-device iPhone confirmation of the arrival-card display. FINAL.41 and FINAL.40 field checks remain pending. AN15 remains intentionally paused.


## FINAL.43 office internal HGV route production release (2026-10-08)

FINAL.43 is released and production-verified. Office navigation now uses the same internal VENDRIVE `driving-hgv` route flow from both the office list and office MAP pin. Office destinations are typed separately from vending-machine visit destinations, so arriving at an office ends routing without opening machine visit/task/order actions. The explicit external-navigation action remains available from the active route panel.

Safety tag `backup-pre-FINAL43-OFFICE-INTERNAL-HGV-ROUTE-20261008` -> `af8f34f363b25ea1885df22adc35dc6b01ac3ec0`. PR #189 merged at `e648323947019745e507015f61ddb0b464163f43`. PR runs `37730660379` and `37730661344`, main Browser regression `37730783341`, and Pages `37730782368` passed. Vercel production `dpl_9HEPeoR4Cd8QLSb5GuA1FuHn7HWM` is READY for the exact merge SHA. Pages and Vercel version endpoints report `2026.10.08-FINAL.43`.

No routing safety policy changed. FINAL.42 arrival-card task display has now been user-confirmed OK; the other previously pending field checks remain pending. AN15 remains intentionally paused.


## FINAL.44 task threshold-relative gauge production release (2026-10-08)

FINAL.44 is released and production-verified. Task-tab progress gauges now use each task's configured auto-completion percentage as the full-scale target. For example, with a 70% completion threshold, 35% actual completion fills half the gauge and 50% actual completion fills about 71.4%. The task detail progress bar uses the same scale. The displayed numeric percentage remains the true actual completion rate, and task auto-completion logic is unchanged.

Safety tag `backup-pre-FINAL44-TASK-THRESHOLD-GAUGE-20261008` -> `712f89119ce14ed62cb028cbaafdb46e2c730f64`. PR #192 merged at `afcbf0b639959fa6c3d80bf202021f060d487593`. PR runs `37733253158` and `37733253132`, main Browser regression `37733379642`, and Pages `37733378870` passed. Vercel production `dpl_6aoh9uco7ahAzzr53MtxV6Y9Egqw` is READY for the exact merge SHA. Pages and Vercel version endpoints report `2026.10.08-FINAL.44`.

No routing, HGV, task-target, persistence, arrival, or order semantics changed. FINAL.44 closes this implementation/release scope; only real-device visual confirmation remains.


## FINAL.45 privacy-safe highway diagnostics release (2026-10-08)

FINAL.45 is production-complete, **not** an expressway-selection fix. The MAP route panel can reveal and copy location-free highway-search diagnostics for one real-world route that still differs from Google Maps. The existing ORS/Overpass pipeline now distinguishes IC lookup failure/empty sets, evaluated pairs, provider rejection, no geometry, too little motorway, timeout and other candidate errors, plus final adoption status, without extra provider calls.

Tag `backup-pre-FINAL45-HIGHWAY-DIAGNOSTICS-20261008` points to `f6c5052d0def10a5f64ab842395bcbab04f5a7ec`. Product PR #196 merged at `da376f589387144774c7d7e8dc6eb6f024a919b9`. Final Truck route readiness `37751032915`, PR Browser `37751032983`, main Browser `37751257933`, and Pages `37751256803` passed. Vercel `dpl_Dhk2ZmXDw748B9UfdcxvREmKuf8M` READY for the exact SHA. Public versions are `2026.10.08-FINAL.45`.

Next step: the user shares one copied/screenshot diagnosis from the affected route; determine whether the problem is missing provider/IC candidates or final acceptance and only then choose the next limited route-quality fix. No HGV/FINAL.36 safety-policy changes; AN15 remains paused.


## FINAL.46 HGV timeout bounds — backend quota blocked (2026-10-08)

User reported that a route cannot appear because search itself times out. FINAL.46 addresses upstream response-body hangs (instead of only header fetch deadlines) and prevents optional via-IC motorway probes from delaying an already validated HGV baseline beyond a 14.5-second server budget. No HGV safety or final detour policy changed.

Safety tag backup-pre-FINAL46-HGV-TIMEOUT-BOUNDS-20261008 targets be83e6c8aee36caa114dc8926425bff81555d305. PR #199 merged at c2307edf38c1e1256c3eaa125e86d8e9fd461edc. PR Truck route 37754575289 and PR Browser 37754575245 PASS; main Browser 37754745261 and Pages 37754744610 PASS.

NOT COMPLETE: Pages serves FINAL.46, Vercel route backend FINAL.45. Explicit production deploy was refused 402 payment_required api-deployments-free-per-day, retryAfter 86400. After quota reset, deploy exact latest main once, live verify correct backend, then request affected-route iPhone retest. AN15 paused.


## FINAL.46 Vercel quota recovery and production release — 2026-10-09

The former Vercel free daily deployment quota block was cleared without billing changes. Production deployment dpl_4hqEhQPKHQJUHgY3io8XCKj4Bpum is READY for git SHA 8155695040e877614081a927aa39d7cfe534da35, containing the already tested FINAL.46 timeout bounds. Both GitHub Pages and Vercel public version endpoints report 2026.10.08-FINAL.46.

FINAL.46 release is verified, but the original iPhone route timeout and highway selection remain pending real-world retest. Next ask for the same route to be retried. If successful, collect location-free highway diagnostics to classify remaining expressway routing quality before further modifications. No HGV/FINAL.36 safety changes; AN15 remains paused.


## 2026-10-09 FINAL.46 owner-requested pause and complete handoff

No new feature phase was started. The owner explicitly requested a deliberate work pause plus a complete recoverable snapshot of progress and the current stopping point.

FINAL.46 production release has been verified: GitHub Pages version.json and Vercel route API version.json both return 2026.10.08-FINAL.46; Vercel latest known main-aligned deployment dpl_EKLbpJ4rgm7mDenWcxZ4KidAqcqU is READY for source SHA cadfc1ca5e5f65998dc5e5a54371ef7cdc9f7d20. Prior Vercel free daily quota blocker is cleared without billing changes.

Primary outstanding user-evidence checkpoint, not an assigned execution task: user previously experienced timeout before any route geometry could appear on the same highway-ON iPhone route, and has not yet confirmed whether FINAL.46 resolves it. Secondary motorway preference question (why Google Maps chooses highway where VENDRIVE may not) can be investigated only after a route is returned; FINAL.45 privacy-safe diagnostics are available for a successful route.

Earlier FINAL.40–44 improvements received broad "基本全部OK" feedback; FINAL.42 arrival-card task display received explicit OK. Do not falsely mark all individual device scenarios validated.

Full reproduction and safety policy are documented in the newest section of .ai/HANDOFF.md; .ai/STATE.json and .ai/LAST_RUN.json align. AN15 remains intentionally paused, no autonomous next phase or code work. The next action depends entirely on a new explicit owner instruction.


## FINAL.47 field UX PR validation — 2026-10-09

The owner confirmed FINAL.46's previously reported timeout resolved in real use and authorized focused operational improvements. Draft PR #204 implements destination-anchored unvisited nearby planned arrival cards, compact landscape sheets for all software-rotated fullscreen MAP dialogs, task-history per-machine completion drilldown, fullscreen-only numeric-ORS-step/verified motorway-transition cues, and fractional eased turn zoom. Existing HGV restrictions/FINAL.36 detour caps/max two IC attempts/warm 30 calls-min guard remain. No new navigation service calls; DB/schema and AN15 unchanged. Pre-edit immutable annotated safety tag backup-pre-FINAL47-FIELD-UX-20261009 -> e1ce4b4091a799629d563669c659d4d6eb6757a5. PR #204 tests: Truck/API/real Edge run 37909127571 PASS; Browser regression 37909127498 PASS. **Production merge, deployment and live checks pending; do not label FINAL.47 shipped until terminal.** After completion, remain stopped at AN15 intentional pause awaiting explicit owner instruction.


## FINAL.47 production release and owner stop — 2026-10-09

PR #204 merged `5e67667a3d85c83f11aea43605226f84ce6a5b44` after product gates `37909127571` (Truck route / API / real Edge 320/390 PASS) and `37909127498` (Browser regression PASS). Post-merge Browser regression `37909629725` PASS; Pages `37909629247` PASS; Vercel `dpl_Hjzu9pLUYeERc1Z7NFyDuHdLxMgD` READY at exact source SHA. Both public GitHub Pages and Vercel versions = `2026.10.09-FINAL.47`. Scope and invariants are recorded at end of HANDOFF.md. User confirmed FINAL.46 timeout OK; FINAL.47 real-device UI checks remain future evidence. Highway-ON route-choice accuracy independently outstanding. No further product work or AN15 progression is authorized without a new explicit owner instruction.


## FINAL.48 nav cue landscape adjustment and zoom preservation — 2026-10-09

Scoped owner maintenance: portrait HUD top-center stays; native/software-rotated fullscreen landscape HUD moves upper-left and shows a large maneuver arrow beside supported ORS-based text and distance. Preserved unmodified `navigationZoomTarget` and fractional zoom easing; tests explicitly verify zoom-in on approach and zoom-out after the last significant corner. No added route requests or HGV/FINAL.36/AN15 changes. Immutable safety tag `backup-pre-FINAL48-NAV-CUE-20261009-20261009` -> `23f59b5a2c4e28934eaef9c0a2519d492d675a13`. PR #207 product/test head `fd6d0fda80944518e6826f9242db5ee43af6bdd3` CI: Truck/Node/real Edge `37913947231` PASS; Browser `37913947189` PASS. Merge/live Pages/Vercel status **pending**, do not claim FINAL.48 in production yet.


## FINAL.48 verified production closeout and owner stop — 2026-10-09

PR #207 merged at `6a84a0139f74cee5c2118ad4c3eaaad996d4256b`, after final PR route/Node/Edge `37914210715` PASS and final PR browser `37914210633` PASS. Main browser `37914366529` PASS and GitHub Pages `37914365913` PASS. Vercel production `dpl_oapZwu7kCr8JQBBPVQaaHqvWisd1` READY at product SHA; both public version.json endpoints FINAL.48. Existing turn zoom-in and zoom-out was preserved and verified. Historical FINAL.48 PR-pending documentation is superseded by this checkpoint. Owner field visual validation is future evidence; no automatic AN15 restart or new development without a new owner instruction.


## FINAL.49 compact landscape HUD maintenance — 2026-10-09 (PR verified, production pending)

Owner screenshot shows FINAL.48 software-rotated navigation overlay extends too far into central map. Bound the landscape-only cue width to 224 CSS px and safe upper-left 8px, hide MAP・本日 in fullscreen landscape, preserve portrait and big maneuver arrow. Pre-edit annotated safety tag `backup-pre-FINAL49-COMPACT-CUE-20261009` at `5c2b3b26f625bc5b0912cf8b3704176a8182bd75`. PR #210 product/test `ba2a317fc31c838db138e8b2105397ddadb8daa0`: Truck/real Edge `37917405398` PASS and Browser `37917405381` PASS. **Production release pending**; AN15 intentionally paused.


## FINAL.49 production release / field handoff — 2026-10-09

PR #210 merged at `bc83dda66c4f0676872006aa356dd0fba5e25ce5`; final PR Truck/Node/Edge `37917628703` and Browser `37917628558` PASS; main Browser `37917777126` and Pages `37917776644` PASS. Vercel `dpl_37PEBYHwQKMzf5YkrsdjdQNS4WvZ` READY for exact main; public Pages/Vercel versions FINAL.49. Compact 224px landscape HUD and hidden landscape MAP label published; portrait and zoom/HGV unchanged. Owner field visual confirmation pending. No AN15 restart or speculative new phase.


## FINAL.50 HGV long-distance reliability and highway use — owner-directed maintenance (2026-10-09)

Owner's real-device field complaint on FINAL.49: long route API timeouts and prematurely exiting/not entering expressways. Code/root references documented at end of HANDOFF.md. Public ORS alternatives are restricted to 100km and `avoid_features:ferries` may cause dynamic routing limits; code previously requested 3 alternatives unconditionally. FINAL.50 limits alternative requests to under 55km direct, uses safe bounded HGV retries and proven non-ferry `waytype` for long/2004 fallback. Increases primary HGV provider allowance to 12s within server budget, avoids optional two IC probes when only <3s remains, raises motorway coverage target 55% -> 85%, expands OSM IC query count 80 -> 200, broadens bounded near-fast motorway selection while preserving global 8min/10km guard, HGV dimensions, 30/min warm quota and AN15 intentional pause. Pre-edit immutable safety tag `backup-pre-FINAL50-HGV-ROUTING-ROOT-CAUSE-20261009` -> `59662534ff65b49cab69ada64c99557e24736054`. PR #213 `233c775e6dc9383b40fbc00021d6c7a161a638ee`: Truck Node/API/real Edge `37920551366` PASS; Browser `37920551383` PASS. **Production pending; real owner route quality not yet evidenced**, needs exact failing pair and diagnostics.


## FINAL.50 production verification and field boundary — 2026-10-09

PR #213 merged `1eb762dc1ed4cc5f573f07a6894b77bd02296deb`; final PR Truck/Node/real Edge `37920822527` PASS, Browser `37920822721` PASS, main Browser `37920983030` PASS, Pages `37920982456` PASS. Vercel `dpl_4pQfJK7u7oGeLufkLikZ45k7Egwe` READY exact main; public frontend/backend FINAL.50 verified. Code mitigating ORS alternatives/dynamic distance caps and limited expressway search is deployed. **Real owner's long trip/IC quality is still unverified**, not equivalent to CI. Owner should supply approximate failed route start/destination and safe MAP 高速診断 if ongoing. AN15 pause and HGV/cost constraints unchanged. No further phase on its own.


## 2026-10-11 migration / next evidence intake (no new product phase)

FINAL.50 is already merged and live-verified, but not route-specific iPhone-confirmed. Owner has copied the private-safe `VENDRIVE 高速診断` and will PASTE IT at the START of a new chat; it has not been provided yet. First analyze that exact report, including its app version, routing decision, motorway usage and IC search counters, before seeking approximate route/IC location or considering further code changes. Historical PR #213 is merged/closed; do not treat it as pending work. This is a docs-only cross-chat handoff and does not change product priority, engine, DB/schema, costs, or the intentionally paused AN15 phase.

## FINAL.51 (2026-10-11) — HGV IC search after alternative timeout (release pending)

FINAL.50 received field report near DCM尾西店 → 飛島コンテナ confirmed alternative-timeout fallback with highway 0.0km and no IC exploration. Code `!baselineRetried` guard suppressed search. PR #217 fixes bounded retry gate and prioritizes simple HGV for medium direct trips >=25km; two synthetic regressions passed. Annotated safety tag `backup-pre-FINAL51-IC-RETRY-GATE-20261011` at old main; PR Node/API/real Edge `38104318588` PASS, Browser `38104318680` PASS at product head `ea92f3a9...`. Still awaiting merge/public FINAL.51 verification. Correct entry/exit IC and truck feasibility unverified in real ORS. AN15 intentionally paused.

## 2026-10-11 FINAL.51 release verified; user field boundary

PR #217 merged `5cc7c0b258af705c6996d6018e669a722b45a100`; final PR HGV Node/API/real Edge `38104482648` PASS and Browser `38104482589` PASS; postmerge Browser `38104563171` PASS, Pages `38104563073` PASS; Vercel production `dpl_Adv5Pnp5Q5b1K5bbBp1jF5eV6vrV` READY. Both live version endpoints reported `2026.10.11-FINAL.51`. Above release-pending note superseded. Real operator DCM尾西店→飛島コンテナ IC/motorway quality still requires new FINAL.51 field report; do not confuse mocked tests with real route success. AN15 remains intentionally paused.

## 2026-10-11 FINAL.52 public Overpass IC reliability — PR release pending

Owner's FINAL.51 field data for DCM尾西店→飛島コンテナ shows safe basic HGV selected but `provider-error` while loading IC nodes; no highway and zero candidate evaluation. FINAL.52 PR #220 addresses the IC data provider single point of failure with bounded and independent free backup, faster bbox query and original local radial filtering, plus source/HTTP/timeout sanitized diagnostics; HGV safety/quota/policy, AN15 pause unchanged. Safety tag `backup-pre-FINAL52-OVERPASS-RESILIENCE-20261011` at c6869522; code/test PR HGV Node/API/real Edge `38105181217` PASS, Browser `38105181191` PASS at dfa4806. Pending final PR doc-aligned gates/merge/public FINAL.52 verification. No real IC outcome verified; request a NEW owner diagnostic only after live release.

## FINAL.52 2026-10-11 released; field evidence pending

PR #220 merged `f6290b52858f5c41c33076ae0d6b78430d730358`, HGV/Node/API/real Edge `38105299934` PASS, PR Browser `38105299950` PASS, postmerge main Browser `38105375746` PASS and Pages `38105375057` PASS; Vercel dpl_6ZUy9Cu4U55nueU3AsG7GwaoZFKC READY exact main. Public frontend/backend both `2026.10.11-FINAL.52`. Prior PR pending state superseded. True motorway IC outcomes for DCM尾西店→飛島コンテナ require new safe parked/passenger operator diagnostic; no conclusion from synthetic provider tests. AN15 intentionally paused, no further product work without evidence.
