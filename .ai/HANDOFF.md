# VENDRIVE2 Chat Handoff

Updated for the current migration boundary on 2026-10-07.

## Authority

- The only authoritative development baseline is the latest synchronized GitHub `main` plus the canonical recovery files.
- Do **not** resume work from old validation branches simply because they still exist.
- Do **not** infer the current revision from this file; fetch latest `main` first.
- Current visible production app version: `2026.10.08-FINAL.40`.
- Engine: `AN14B3B5`.
- DB/schema: `4 / 4`.

## Exact durable resume boundary

FINAL.40 is **complete, merged, deployed, and live-verified**. There is no unfinished FINAL.40 implementation task. Automated verification does not count as the user's iPhone field confirmation.

Historical PR #174 is closed and merged. Its validation branch for FINAL.38 is history only and must not be used as a resume source. PR #172 / #170 / #168 / #166 remain earlier completed history. FINAL.33/PR #164 and earlier releases remain completed history; latest synchronized `main` is authoritative.

After recovery, the normal next project phase is:

`AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`

If the user reports a new real-device navigation defect, treat that as **new field evidence and a new bounded maintenance scope**. Do not reopen or extend FINAL.32 retroactively.

## What FINAL.32 shipped

FINAL.32 closes the highway-selection and live-navigation maintenance sequence that began after the user reported that highway coloring/routing did not behave naturally.

The production behavior now includes:

- MAP highway ON/OFF control synchronized with the truck-routing preference.
- Highway OFF explicitly avoids highways, tollways, and ferries.
- Highway ON requests ORS HGV alternative routes.
- Candidate selection measures **actual motorway/toll distance**, rather than only checking whether a route contains any highway segment.
- Candidate selection prefers the longest reasonable motorway/toll usage while rejecting excessive detours.
- Alternative-route search parameters:
  - `target_count=3`
  - `share_factor=0.95`
  - `weight_factor=2.0`
- Expressway detour guard versus provider primary route:
  - time: at most +35%, capped at +15 minutes;
  - distance: at most +50%, capped at +20 km.
- Route summary exposes approximate motorway/toll distance.
- Ordinary road route line is blue; motorway/toll evidence is red.
- Dedicated ORS `tollways` extra and `waycategory` are both used.
- Already-travelled route geometry disappears progressively from the displayed line as accurate GPS progress advances.
- The original full route remains intact internally for matching/safety; only display geometry is clipped.
- GPS accuracy worse than 50 m cannot advance route progress or trigger rerouting.
- Sustained route deviation requires three consecutive accurate off-route fixes beyond the adaptive 60–100 m threshold.
- Automatic rerouting has a 30-second cooldown.
- Automatic rerouting recalculates the same HGV/highway policy from current GPS.
- Failed automatic rerouting retains the existing route.
- No car-routing fallback and no straight-line fallback are permitted.
- MAP fullscreen PIN interaction from FINAL.27 remains preserved.
- HGV vehicle dimensions/weight remain per-user/per-vehicle, never globally hard-coded.

## FINAL.32 verification evidence

Production evidence already recorded in STATE/LAST_RUN and must not be repeated unless new relevant preconditions change.

Key evidence:

- Safety tag: `backup-pre-FINAL32-NAV-PROGRESS-REROUTE-20261006`.
- Pre-edit tag target: `d059ed2740ead98bd315e7fe7ad41ceb8bc04b17`.
- Final product validation: 22/22 Node tests PASS.
- Real Edge 320 px / 390 px: PASS.
- Final truck-route gate run: `37539563883`.
- Existing browser regression run: `37539563945`.
- Travelled-line clipping: PASS in real Edge.
- Sustained off-route automatic reroute: PASS in real Edge.
- Poor-accuracy navigation guard: PASS.
- Excessive expressway-detour guard: PASS.
- Real ORS validation through the FINAL.32 handler selected `expressway-distance-preferred` on the validation route with approximately:
  - motorway: 16,818 m;
  - tollway: 16,654 m;
  - total route: 27,027.6 m;
  - duration: 1,669.1 s.
- Invalid/no-safe-HGV validation cases fail closed instead of unsafe fallback.
- PR #162 merged with product merge commit `2188bee148f3c6e93b817dd0fe1b5acccb366f2f`.
- Production Vercel deployment: `dpl_AprtKGD6qT8f573vrGTYwhXGtfx1`, READY.
- Main browser regression after merge: `37539937999`, PASS.
- GitHub Pages deployment: `37539936859`, PASS.
- Live production version verified as `2026.10.07-FINAL.32`.

## Earlier routing decisions that still matter

- The product uses `driving-hgv`, not passenger-car routing.
- “2t truck” is a payload class, **not** a routing gross-weight constant.
- Each vehicle profile stores actual height, width, length, and gross vehicle weight; axle load is optional.
- Historical test profile values are validation-only and must never become global product defaults.
- ORS route output is advisory; real signs/restrictions remain authoritative.
- User data, tasks, orders, visits, DB/schema, and Analytics must remain preserved through routing maintenance.
- User-facing Analysis/OCR remains withdrawn; historical Analytics remains preserved.

## New-chat behavior

On a fresh chat:

1. Fetch latest `main`.
2. Read the canonical recovery set in STATE.recovery.readOrder.
3. Confirm live/code versions and phase consistency only as needed; do not rerun already-passed FINAL.33 gates without a changed precondition or contradictory new evidence.
4. Ignore old PR #164 / PR #162 branch state as an execution source.
5. If the user says only `VENDRIVE続き`, resume from `STATE.nextPhase`.
6. If the user instead reports a fresh field issue, open a new bounded maintenance scope with a new immutable pre-edit safety tag before production-code edits.
7. Continue under the hard terminal-state rule from `AGENTS.md`.

## 2026-10-07 AN15 evidence-gate audit

After recovering latest main and entering `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`, a repository-only reachability audit found a post-FINAL.21 continuity problem:

- `ocr-config.js` still loads AN15A-G and `an15-lifecycle-integration.js`.
- The lifecycle snapshot hook wraps the public `VENDRIVE2Analytics.analysis.sales.listForecasts()` call.
- The shipped `index.html` no longer contains an `analysisPage` element or the `帳票撮影` entry point, so the former user-facing trigger is unreachable.
- Normal recommendation/planning functions call the closure-level `listSalesForecasts()` inside `analytics.js`, bypassing the lifecycle wrapper.
- Confirmed-sales scoring also depends on the withdrawn report-confirmation path.
- The normal JSON backup contains core state and `vendrive2_last_day`, not the AN15 forecast/context localStorage ledgers.

Therefore FINAL.32 remains complete, but AN15 promotion is now **HUMAN_REQUIRED** rather than something that will progress merely by normal use. Do not silently restore OCR/Analysis and do not weaken exact/no-lookahead interval matching just to manufacture samples.

The required product decision is one of:

1. keep AN15 learned numeric promotion paused for now; or
2. authorize a bounded design/implementation for a lower-friction real sales-outcome/evidence capture path.

Any production-code implementation after that decision must start from latest main and create a new immutable annotated safety tag.

## User-facing migration note

A long migration prompt is optional. The repository is prepared so the shortest safe resume instruction is:

`VENDRIVE続き`

If a longer prompt is supplied, it should still instruct the new chat to recover from latest `main` first rather than trusting the pasted prompt over GitHub.

## 2026-10-07 AN15 product decision — promotion paused

The user chose option A: keep AN15 learned numeric promotion paused for now.

This resolves the prior HUMAN_REQUIRED decision without changing production behavior:

- FINAL.32 remains complete and production-verified.
- No new sales-outcome entry flow is authorized at this time.
- Do not restore the withdrawn OCR/Analysis UI by assumption.
- Do not weaken exact interval, no-lookahead, or censored-outcome safeguards to manufacture samples.
- Keep the deterministic production forecast baseline unchanged.
- Preserve AN15 code and historical Analytics for future use.
- Reopen AN15 evidence-capture design only when the user explicitly authorizes it or a genuinely usable authorized real outcome source becomes available.

This is an intentional product pause, not a FINAL.32 defect and not an unfinished implementation task.

## 2026-10-07 FINAL.33 arrival cards and MAP rotation

FINAL.33 is validated on PR #164 and is pending production release.

Locked scope:
- Accurate GPS (<=50m accuracy) within 100m of the active destination ends the in-app route.
- Arrival shows exactly one visit card at a time: the unvisited destination first, then other unvisited machines on today's plan within 100m.
- Left swipe = visit complete through the existing task/order confirmations. Right swipe = today's visit skip.
- The standard Today list uses the same bidirectional swipe behavior.
- The blocking non-MAP landscape portrait guard is withdrawn. Portrait orientation is requested where supported and the manifest prefers portrait.
- Fullscreen MAP alone exposes a 🔄 control that software-rotates the MAP 90 degrees. This is the iPhone/rotation-lock fallback and does not attempt to bypass the OS rotation lock.
- Fullscreen PIN -> machine modal interaction remains required.

Safety tag: `backup-pre-FINAL33-ARRIVAL-CARDS-MAP-ROTATION-20261007` -> `42e9d4565e64a90abec6933d5b8d958e2e461983`.

Validation evidence before final bookkeeping:
- Truck route readiness / real Edge 320/390: run `37609873036`, PASS.
- Browser regression: run `37609873072`, PASS.
- The earlier run `37609644215` failed only because the test fixture stayed in held-response mode before the new arrival gate; resetting the fixture fixed the harness with no product-code change.

Do not call FINAL.33 production-complete until PR #164 is merged and Vercel, main browser regression, GitHub Pages, and live version/asset checks are terminal PASS.

## 2026-10-07 FINAL.33 production release complete

FINAL.33 is released and production-verified.

- PR #164 merged to `main` at `1e0c68b2829349a2d30ba93e0414b6194ceedc0b`.
- Immutable safety tag: `backup-pre-FINAL33-ARRIVAL-CARDS-MAP-ROTATION-20261007` -> `42e9d4565e64a90abec6933d5b8d958e2e461983`.
- Final PR Truck route readiness / real Edge run `37610172801`: PASS.
- Final PR Browser regression run `37610172731`: PASS.
- Main Browser regression run `37610334284`: PASS.
- GitHub Pages deployment run `37610333585`: PASS.
- Vercel production deployment `dpl_B7PYTGPGRCNHE56dG68uPtx8voPq`: READY for the exact merge commit.
- Public `version.json` and public routing asset report `2026.10.07-FINAL.33`.
- Public UI contains the fullscreen `🔄` control and the Today hint `左：訪問完了 / 右：訪問スキップ`.
- Public routing asset contains the accurate-GPS <=100m arrival end/callback behavior.

FINAL.33 behavior:
- Accurate GPS (<=50m accuracy) within 100m of the destination ends navigation.
- Arrival shows one unvisited visit card at a time: destination first, then other today's-plan machines within 100m.
- Left swipe completes through existing task/order confirmations; right swipe skips today's visit.
- Today cards use the same left-complete/right-skip behavior.
- Normal UI no longer blocks landscape with the old portrait guard; normal app/MAP stay portrait-width and portrait is requested where supported.
- Fullscreen MAP alone exposes software `🔄` rotation for rotation-locked devices while preserving PIN/modal interaction.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`. Do not reopen AN15 evidence capture unless explicitly authorized or a genuinely usable authorized real outcome source becomes available.

## 2026-10-07 FINAL.34 rotated MAP gesture and arrival-card fix

New real-device evidence after FINAL.33 opened a bounded maintenance scope. FINAL.33 remains completed history; this is not a retroactive reopening.

Field evidence:
- software-rotated fullscreen MAP visually rotated 90 degrees, but drag input still followed the portrait coordinate axes;
- arrival visit cards stayed portrait-oriented while the fullscreen MAP was software-rotated.

FINAL.34 validated behavior:
- native Leaflet dragging is disabled only while software-rotated fullscreen MAP is active;
- pointer drag deltas are rotated before calling Leaflet pan, so visible gesture and visible MAP movement use the same axes;
- normal/unrotated MAP dragging is unchanged;
- the arrival visit sheet rotates 90 degrees only in software-rotated fullscreen MAP mode;
- arrival-card swipe detection uses the rotated pointer axis in that mode, preserving visible left = visit complete and visible right = visit skip;
- existing task/order confirmations and fullscreen PIN/modal behavior remain preserved.

Safety tag: `backup-pre-FINAL34-ROTATED-MAP-GESTURE-ARRIVAL-CARD-20261007` -> `aa23bca23109dfb549dd7d84fe14c912e26b6c51`.

PR #166 final product validation before canonical bookkeeping:
- Truck route readiness / real Edge 320/390: `37612564670`, PASS.
- Browser regression: `37612564593`, PASS.
- Earlier failures `37612339313` and `37612497681` were test-harness-only defects (closure-local map reference and regex escaping). Product behavior was not rolled back.

Do not call FINAL.34 production-complete until PR #166 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.34 evidence are terminal PASS.

## 2026-10-07 FINAL.34 production release complete

FINAL.34 is released and production-verified.

- PR #166 merged to `main` at `4914b905a02b74969ce5d7a199fa68424fe5d6cb`.
- Immutable safety tag: `backup-pre-FINAL34-ROTATED-MAP-GESTURE-ARRIVAL-CARD-20261007` -> `aa23bca23109dfb549dd7d84fe14c912e26b6c51`.
- Final PR Truck route readiness / real Edge run `37612820361`: PASS.
- Final PR Browser regression run `37612820358`: PASS.
- Main Browser regression run `37612956449`: PASS.
- GitHub Pages deployment run `37612955809`: PASS.
- Vercel production deployment `dpl_ETa4iD6suyBsosBnaXJRXb2BkxLp`: READY for the exact merge commit.
- Public `version.json` and public routing asset report `2026.10.07-FINAL.34`.

FINAL.34 behavior:
- software-rotated fullscreen MAP drag follows the visible rotated axes rather than the underlying portrait axes;
- normal/unrotated MAP dragging remains native;
- arrival visit sheet rotates only in software-rotated fullscreen MAP;
- rotated arrival-card visible left/right swipes still mean complete/skip and use the correct rotated pointer axis;
- task/order confirmations and fullscreen PIN interaction remain preserved.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-07 FINAL.35 rotated machine-detail card

New real-device evidence after FINAL.34 opened a bounded maintenance scope. FINAL.34 remains completed history.

Field evidence:
- in software-rotated fullscreen MAP, the arrival visit sheet was correctly landscape but a machine detail opened from a vending-machine PIN still appeared portrait-oriented.

FINAL.35 validated behavior:
- the PIN-opened machine detail sheet rotates 90 degrees only while `mapFullscreen + mapSoftRotated` is active;
- machine detail stays portrait in normal MAP and unrotated fullscreen MAP;
- close and the existing machine-detail controls remain operational;
- FINAL.34 rotated MAP dragging, arrival-card orientation/swipe behavior, task/order confirmations and PIN interaction remain preserved.

Safety tag: `backup-pre-FINAL35-ROTATED-MACHINE-CARD-20261007` -> `f5294949edca2783f45e7abbe3232b8249d70ced`.

PR #168 validation before canonical bookkeeping:
- Truck route readiness / real Edge 320/390: `37614566359`, PASS.
- Browser regression: `37614566431`, PASS.

Do not call FINAL.35 production-complete until PR #168 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.35 evidence are terminal PASS.

## 2026-10-07 FINAL.35 production release complete

FINAL.35 is released and production-verified.

- PR #168 merged to `main` at `0be90de6a25b779819a14ccf09b03718a9c44490`.
- Immutable safety tag: `backup-pre-FINAL35-ROTATED-MACHINE-CARD-20261007` -> `f5294949edca2783f45e7abbe3232b8249d70ced`.
- Final PR Truck route readiness / real Edge run `37614817452`: PASS.
- Final PR Browser regression run `37614817466`: PASS.
- Main Browser regression run `37614981166`: PASS.
- GitHub Pages deployment run `37614979975`: PASS.
- Vercel production deployment `dpl_9Zp3oos5JnPKHxvabRnubrhThjcU`: READY for the exact merge commit.
- Public `version.json` and routing asset report `2026.10.07-FINAL.35`.

FINAL.35 behavior:
- PIN-opened machine detail rotates with the software-rotated fullscreen MAP;
- it remains portrait when MAP software rotation is off;
- existing machine actions, rotated MAP dragging, rotated arrival-card handling, task/order checks and fullscreen PIN interaction remain preserved.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-07 FINAL.36 route sanity and visibility

New real-device evidence after FINAL.35 opened a bounded routing maintenance scope. FINAL.35 remains completed history.

Field evidence:
- some HGV routes make unnecessary-looking detours even when the symptom is not related to highway selection;
- highway ON can still miss plausible expressway candidates;
- ordinary blue route geometry is visually weak on the base map.

FINAL.36 validated behavior:
- initial route calculation uses cached GPS only at <=5 seconds and <=50m accuracy; otherwise a new maximumAge=0 high-accuracy fix is required and >50m fixes are rejected;
- automatic reroute uses the median of three consecutive accurate off-route fixes;
- an extreme-distance automatic replacement route is rejected and the prior route stays visible;
- the server remains `driving-hgv` with the exact registered restrictions, but uses ORS `recommended` rather than pure `fastest`;
- highway ON requests more diverse alternatives (`share_factor=0.85`, `weight_factor=1.6`), uses tighter detour bounds, and only maximizes expressway distance among near-fast alternatives;
- ordinary route geometry is fluorescent cyan `#00e5ff` over a dark `#0b132b` casing; motorway/toll remains red over the same casing;
- no car/straight-line fallback was added.

Safety tag: `backup-pre-FINAL36-ROUTE-SANITY-VISIBILITY-20261007` -> `beb9325938954a7fa8afec8a559d4b58ee5b44d6`.

Validation evidence before canonical bookkeeping:
- Truck route readiness / Node / API / real Edge 320/390 final test head: `37629834281`, PASS.
- Browser regression on identical app/runtime product code: `37629618914`, PASS.
- Earlier route run `37629619016` failed only because the browser gate still searched for legacy `#2563eb` after the intentional fluorescent-cyan change; only the test selector was changed.

Do not call FINAL.36 production-complete until PR #170 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.36 evidence are terminal PASS.

## 2026-10-07 FINAL.36 production release complete

FINAL.36 is released and production-verified.

- PR #170 merged to `main` at `c68a6a283cac5074916bd40a9ae0fb814d1eb9cb`.
- Immutable safety tag: `backup-pre-FINAL36-ROUTE-SANITY-VISIBILITY-20261007` -> `beb9325938954a7fa8afec8a559d4b58ee5b44d6`.
- Final PR Truck route readiness / API / real Edge run `37630470134`: PASS.
- Final PR Browser regression run `37630470259`: PASS.
- Main Browser regression run `37630690705`: PASS.
- GitHub Pages deployment run `37630688603`: PASS.
- Vercel production deployment `dpl_9q64prYCtNWhUysBRtRs5hGy2gzr`: READY for the exact merge commit.
- Public `version.json` and routing asset report `2026.10.07-FINAL.36`.

FINAL.36 behavior:
- cached route-origin GPS is accepted only at <=5 seconds and <=50m accuracy; otherwise a new high-accuracy fix is required;
- automatic reroute origin is the median of three sustained accurate off-route fixes;
- extreme-distance reroute replacements are rejected while the old route remains visible;
- ORS remains driving-hgv with exact vehicle restrictions and uses recommended weighting;
- highway ON requests more distinct alternatives with tighter detour bounds and near-fast expressway preference;
- ordinary route geometry is fluorescent cyan over a dark casing, while motorway/toll stays red over the same casing;
- no car/straight-line fallback exists.

If future field use still shows an implausible route, collect that exact origin/destination and treat it as a new bounded routing evidence case rather than weakening HGV safety globally.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-07 FINAL.37 active highway IC search

New real-device evidence after FINAL.36 showed that a practically usable highway route can still be absent because ORS's limited alternative set never returns that motorway path. Ranking cannot select a route that the provider never generated.

FINAL.37 validated behavior:
- highway ON first evaluates normal ORS driving-hgv alternatives;
- only when motorway use is still insufficient does the server query nearby OpenStreetMap `highway=motorway_junction` nodes via Overpass;
- it builds at most two plausible entry/exit IC pairs and requests additional four-point ORS driving-hgv routes: origin -> entry IC -> exit IC -> destination;
- every extra request preserves registered height/width/length/weight/axleload restrictions and ferry avoidance;
- added IC routes remain subject to FINAL.36 time/distance detour bounds and near-fast selection; they are not forced;
- IC discovery or extra-route failure returns the normal baseline HGV route;
- IC discovery is briefly cached per warm server instance and is deferred until normal alternatives prove insufficient;
- baseline and extra ORS route requests all count toward the per-warm 30 route-call/minute guard;
- no car/straight-line fallback exists.

Safety tag: `backup-pre-FINAL37-ACTIVE-HIGHWAY-IC-SEARCH-20261007` -> `77b7b437469e8100f94661fb4f5707acd1320e13`.

PR #172 validation before canonical bookkeeping:
- Truck route readiness / API / real Edge 320/390: `37636311481`, PASS.
- Browser regression: `37636311451`, PASS.
- API tests explicitly prove active IC discovery + four-coordinate HGV routing and safe fallback when IC discovery is unavailable.
- Earlier failures were test isolation only: quota state ordering, then warm IC-cache contamination.

Do not call FINAL.37 production-complete until PR #172 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.37 evidence are terminal PASS.

## 2026-10-07 FINAL.37 production release complete

FINAL.37 is released and production-verified.

- PR #172 merged to `main` at `04ce9033731bb52a49c9d0dc636b46e7826f3a82`.
- Immutable safety tag: `backup-pre-FINAL37-ACTIVE-HIGHWAY-IC-SEARCH-20261007` -> `77b7b437469e8100f94661fb4f5707acd1320e13`.
- Final PR Truck route readiness / API / real Edge run `37636733086`: PASS.
- Final PR Browser regression run `37636733333`: PASS.
- Main Browser regression run `37636924246`: PASS.
- GitHub Pages deployment run `37636923395`: PASS.
- Vercel production deployment `dpl_58RHPeSbzBG3urLD54WrMYsCtCTo`: READY for the exact merge commit.
- Public `version.json` and routing asset report `2026.10.07-FINAL.37`.
- Public route help states that highway ON now searches nearby ICs and compares bounded HGV highway routes.

FINAL.37 behavior:
- normal ORS HGV alternatives remain first-pass;
- if their motorway usage is insufficient, nearby OSM motorway junctions are discovered through a bounded Overpass query;
- up to two plausible entry/exit pairs are evaluated as origin -> entry IC -> exit IC -> destination driving-hgv routes;
- exact vehicle restrictions are preserved for every extra route;
- FINAL.36 detour bounds remain authoritative and extra routes are never forced;
- IC discovery failure safely falls back to the normal HGV route;
- no car/straight-line fallback exists.

The next route-quality evidence should come from retesting the previously failing field route. If it still fails, capture that exact origin/destination rather than weakening HGV safety globally.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-07 FINAL.38 bounded highway adoption + fullscreen route persistence

New real-device evidence after FINAL.37 showed two issues:
- highway selection still appeared unchanged;
- active route geometry could disappear after entering fullscreen MAP.

Root cause and correction:
- FINAL.37 could generate active via-IC HGV candidates but final selection still re-applied the old near-fast +2 minute band. FINAL.38 lets active IC candidates win when they stay inside the existing global detour envelope, while normal provider alternatives keep near-fast ranking.
- active IC search continues until normal motorway use is materially sufficient, and via-IC candidates must contain meaningful motorway distance.
- fullscreen/software-rotation viewport refresh now invalidates Leaflet size and explicitly redraws the active route at two settle points to cover iOS viewport settling.
- no HGV restriction is weakened and no car/straight-line fallback is added.

Safety tag: `backup-pre-FINAL38-HIGHWAY-ADOPTION-FULLSCREEN-ROUTE-20261007` -> `84effdd4fc616f8c4c8e9b508cd5c673d5e92dfd`.

PR #174 validation before canonical bookkeeping:
- Truck route readiness / API / real Edge 320/390: `37639777479`, PASS.
- Browser regression: `37639777130`, PASS.
- Edge explicitly asserts the active route remains visible before fullscreen, after fullscreen viewport resize, and after software rotation.

Do not call FINAL.38 production-complete until PR #174 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.38 evidence are terminal PASS.

## 2026-10-07 FINAL.38 production release complete

FINAL.38 is released and production-verified.

- PR #174 merged to `main` at `f1987f5f2c73c0c642d36ce72959836233c885e1`.
- Immutable safety tag: `backup-pre-FINAL38-HIGHWAY-ADOPTION-FULLSCREEN-ROUTE-20261007` -> `84effdd4fc616f8c4c8e9b508cd5c673d5e92dfd`.
- Final PR Truck route readiness / API / real Edge run `37640151684`: PASS.
- Final PR Browser regression run `37640151587`: PASS.
- Main Browser regression run `37640387020`: PASS.
- GitHub Pages deployment run `37640385887`: PASS.
- Vercel production deployment `dpl_6j227M7n3db77s3hfFACap9M7XyM`: READY for the exact merge commit.
- Public `version.json` and routing asset report `2026.10.07-FINAL.38`.

FINAL.38 closes the two field regressions reported after FINAL.37:
- a bounded active-IC HGV motorway candidate can now win without being pushed back through the old near-fast +2min band;
- active route geometry is explicitly redrawn after fullscreen and software-rotation Leaflet viewport changes.

The next evidence step is real-device retest of the same highway case and fullscreen route visibility. If the exact highway still does not appear, capture the concrete origin/destination and investigate provider/OSM IC data rather than weakening HGV safety globally.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-08 FINAL.39 route robustness

New field evidence after FINAL.38 showed:
- active route geometry could still be invisible in fullscreen MAP even though SVG path elements existed;
- route acquisition sometimes timed out;
- longer destinations were less likely to use a practical highway.

Root causes and corrections:
- regression had asserted DOM path persistence, not visible viewport overlap. FINAL.39 exposes `fitActive()` and refits the remaining active route after fullscreen/software-rotation viewport settle.
- client timeout was 15s while server work could exceed that. FINAL.39 uses a 20s client route budget, starts bounded junction discovery in parallel with baseline ORS, caps Overpass at 2.8s, and caps via-IC ORS at 5.5s.
- long-route discovery stopped too early because motorway sufficiency was capped at 18km and combined IC access at 18km. FINAL.39 lets motorway target scale to 45km, junction radius to 25km, per-end access to 25km, and combined prefilter to 35km.
- FINAL.36 final detour safety caps remain unchanged; exact HGV restrictions and no-car fallback remain intact.

Safety tag: `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`.

PR #177 validation before canonical bookkeeping:
- Truck route readiness / API / real Edge 320/390: `37643412185`, PASS.
- Browser regression: `37643412287`, PASS.
- Browser now asserts route geometry is actually inside the visible MAP before fullscreen, after fullscreen, and after software rotation.
- API test proves a long route still performs active IC search when normal motorway usage already exceeds the old 18km cap and the useful IC pair exceeds the old combined 18km access prefilter.

Do not call FINAL.39 production-complete until PR #177 is merged and main regression, Vercel production, GitHub Pages, and live FINAL.39 evidence are terminal PASS.

## 2026-10-08 FINAL.39 production release complete

FINAL.39 is released and production-verified.

- PR #177 merged to `main` at `6b843d988fddba509cedcd590c6fe71ba1afd6db`.
- Immutable safety tag: `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`.
- Final PR Truck route/API/real Edge run `37643816604`: PASS.
- Final PR Browser regression run `37643816472`: PASS.
- Main Browser regression run `37644030491`: PASS.
- GitHub Pages run `37644029832`: PASS.
- Vercel production `dpl_7Brq9TY4PciGB65jAQoLWi1rNwm4`: READY for the exact merge commit.
- Public `version.json` and routing asset report `2026.10.08-FINAL.39`.

FINAL.39 behavior:
- fullscreen/software rotation refits the remaining active route into the visible MAP after viewport settle;
- client route timeout is 20s and bounded junction discovery starts in parallel with baseline ORS;
- Overpass is capped at 2.8s and via-IC ORS at 5.5s;
- long-distance motorway target can scale to 45km, junction radius to 25km, per-end IC access to 25km, combined prefilter to 35km;
- FINAL.36 final detour caps remain unchanged;
- exact HGV restrictions and no-car/no-straight-line fallback remain preserved.

Next evidence: retest the same long-route/highway, timeout, and iPhone fullscreen cases.

After this release, return to the intentionally paused `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`.

## 2026-10-08 NEW CHAT HANDOFF CHECKPOINT — resume from here

This checkpoint exists specifically so a fresh ChatGPT conversation can continue VENDRIVE without relying on chat history.

### Authority and exact recovery order
The authoritative source is **latest synchronized `main` plus canonical repository files**, not prior chat messages, old PR branches, or remembered version numbers.

At the start of a new chat:
1. fetch latest `main`;
2. read `AGENTS.md`;
3. read `.ai/STATE.json`;
4. read `.ai/HANDOFF.md`;
5. read `AI_ROADMAP.md`;
6. read `.ai/LAST_RUN.json`;
7. read `.ai/DECISIONS.md`;
8. read `.ai/WORKFLOW.md`;
9. only then decide whether any implementation work is actually open.

Do not resume from historical PRs or branches. FINAL.37 PR #172, FINAL.38 PR #174, and FINAL.39 PR #177 are completed history.

### Current production baseline
- Public app: **2026.10.08-FINAL.39**.
- Analytics engine: **AN14B3B5**.
- DB/schema: **4 / 4**.
- FINAL.39 product merge: `6b843d988fddba509cedcd590c6fe71ba1afd6db`.
- FINAL.39 closeout commit before this continuity checkpoint: `d0d9f6668043793a50f0a1225dd5726e8da137af`.
- PR #177: merged.
- Vercel production: `dpl_7Brq9TY4PciGB65jAQoLWi1rNwm4`, READY for the exact product merge SHA.
- GitHub Pages: run `37644029832`, PASS.
- Main Browser regression: run `37644030491`, PASS.
- Final PR Truck route/API/real Edge: `37643816604`, PASS.
- Final PR Browser regression: `37643816472`, PASS.
- Immutable pre-edit tag: `backup-pre-FINAL39-ROUTE-ROBUSTNESS-20261007` -> `170289c08866bf6120df46d5c9545ed22e3a9b35`.
- Public `version.json` and `truck-routing.js` were live-verified as `2026.10.08-FINAL.39`.

### Why FINAL.39 exists
The user real-device-tested FINAL.38 and reported three concrete field failures:
1. the route line still was not visible after entering fullscreen MAP;
2. route acquisition sometimes timed out;
3. longer-distance destinations appeared **more likely** to avoid usable highways.

These observations superseded the earlier assumption that FINAL.38 had solved the field problem.

### FINAL.39 root causes and implemented corrections
**Fullscreen route**
- Previous regression only proved that route SVG paths still existed in the DOM.
- That did not prove the route was actually inside the visible MAP viewport.
- FINAL.39 exposes route-client `fitActive()`.
- Fullscreen and software-rotation viewport settling now:
  - invalidates Leaflet size,
  - redraws the active route,
  - then refits the **remaining active route** into the visible MAP unless follow-current-position mode is active.
- The browser regression now checks actual geometric overlap between route path bounds and the visible MAP rectangle before fullscreen, after fullscreen, and after software rotation.

**Timeout**
- FINAL.38 client timeout was 15 seconds.
- Server-side bounded work could legitimately take longer: baseline ORS plus junction discovery plus via-IC ORS.
- FINAL.39 client route request budget is **20 seconds**.
- OSM motorway-junction discovery starts in parallel with the baseline ORS request.
- Overpass wall timeout is **2.8 seconds**.
- Via-IC ORS timeout is **5.5 seconds**.
- This removes the known client-before-server timeout mismatch without making requests unbounded.

**Long-distance highway bias**
- FINAL.38 motorway sufficiency stopped active discovery once normal candidates contained up to 18km motorway.
- Entry/exit IC access filtering also had an 18km combined cap.
- These fixed limits disproportionately hurt long routes.
- FINAL.39 changes candidate discovery bounds:
  - motorway sufficiency target: 55% of primary distance, capped at **45km**;
  - junction search radius: up to **25km**;
  - per-end IC access: up to **25km**;
  - combined entry+exit access prefilter: up to **35km**.
- These are only discovery/candidate-generation bounds.

### Safety constraints that were NOT weakened
Keep all of these unless the user explicitly authorizes a new design and it is proven safe:
- routing profile stays `driving-hgv`;
- preserve registered height / width / length / gross weight / optional axleload;
- ferries avoided;
- highway OFF avoids highways/tollways;
- no car fallback;
- no straight-line fallback;
- at most two active via-IC route candidates;
- all ORS route calls share the warm-instance 30 route-call/minute guard;
- FINAL.36 final detour envelope remains authoritative:
  - max duration = primary + min(20%, 8 minutes);
  - max distance = primary + min(30%, 10km);
- do not globally loosen HGV safety merely to force highway use.

### What automated verification currently proves
FINAL.39 automated tests prove:
- long routes can still trigger active IC discovery even when normal motorway usage already exceeds the old 18km cap;
- useful IC pairs beyond the old combined 18km access filter can be evaluated;
- active via-IC routes still carry exact HGV restrictions;
- final global detour caps remain;
- route acquisition/client logic passes Node/API tests;
- real Edge 320/390 regressions pass;
- route geometry is inside the visible MAP viewport after fullscreen and software rotation in the automated browser fixture.

Automated PASS does **not** replace real iPhone field confirmation.

### Exact next user-facing evidence required
The user has **not yet re-tested FINAL.39 on the real iPhone after production release**.

The next step is therefore NOT more speculative code changes. Ask the user to re-test the same field cases and report:
1. on the same long-distance destination, does highway ON now use the expected highway more often / correctly?
2. does route acquisition still time out?
3. after route is visible in normal MAP, does entering fullscreen immediately show the route?
4. if fullscreen is software-rotated with the 🔄 button, does the route remain visible?

If all four are good, no routing maintenance is open.

If any one still fails, treat it as **new real-device evidence** and open a new bounded maintenance phase. Before production edits:
- fetch latest main again;
- create a new immutable annotated `backup-pre-...` safety tag at the exact current main;
- reproduce/instrument the exact failing condition;
- do not rerun unrelated FINAL.39 gates unless a prerequisite changed;
- do not blindly widen route constraints.

### If highway still fails after FINAL.39
Do not keep adjusting generic thresholds first.
Prefer evidence from the **exact failing origin/destination** and inspect:
- whether active highway search actually attempted;
- junction count / evaluated pair count / accepted pair count;
- selection value;
- motorway meters in normal and active candidates;
- whether a via-IC route was rejected by the unchanged final time/distance safety envelope;
- whether OSM motorway_junction data around origin/destination is incomplete;
- whether ORS rejects or reshapes the via-IC HGV route because of vehicle restrictions.

If necessary, add bounded diagnostic telemetry that exposes non-sensitive routing decision metadata. Never fabricate or infer a safe HGV route that the provider did not return.

### Fullscreen failure if it persists on iPhone
If real iPhone still shows no route in fullscreen despite FINAL.39 browser overlap PASS, treat this as an iOS/Safari rendering/viewport-specific issue rather than assuming route data is absent.
Investigate, in this order:
1. actual route layer/path computed bounds after fullscreen settle;
2. Leaflet map container size and map pane transform;
3. software-rotation CSS transform and transform-origin;
4. clipping/overflow of SVG/overlay panes;
5. whether refit occurs while viewport dimensions are transient;
6. whether a later iOS visual-viewport resize moves the map after the 260ms settle pass.

A future fix may need listening to `visualViewport.resize` / `orientationchange` or a longer event-driven settle, but do **not** implement that by assumption without reproducing the field behavior.

### AN15 status
Normal project phase is still `AN15_REAL_EVIDENCE_ACCUMULATION_AND_PROMOTION_GATE`, but it is **intentionally paused by product decision**.
Do not reopen AN15 just because a new chat starts.
Do not restore the withdrawn OCR/Analysis UI.
Do not add a manual sales-outcome capture workflow unless the user explicitly reopens that scope.
Do not weaken exact interval / no-lookahead evidence rules.

### User continuation behavior
If the user says `進めて`, `続けて`, `やって`, or equivalent after reporting a concrete FINAL.39 field failure:
- treat it as permission to continue all safe reversible work in that turn;
- investigate first, then implement if evidence supports it;
- continue through finite relevant verification, merge, deploy, live verification, and canonical bookkeeping;
- stop only at COMPLETE / HUMAN_REQUIRED / TECHNICAL_BLOCKER / IRREVERSIBLE_APPROVAL_REQUIRED.

### Short resume sentence
A fresh chat can start with: **「VENDRIVE続き。GitHubの最新mainとcanonical filesを正として、FINAL.40本番完了後のiPhone実機確認から再開して。」**


## 2026-10-08 FINAL.40 iPhone fullscreen + JCT corridor validation

New real-device evidence after FINAL.39 opened a bounded maintenance scope:
- long-distance route acquisition succeeds in normal MAP but can time out when started from fullscreen MAP on iPhone;
- highway ON can still use materially less motorway than expected on longer trips where a farther/JCT-connected corridor is plausible.

FINAL.40 validated changes on PR #180:
- starting a route while MAP is already active/fullscreen no longer re-clicks the MAP tab and trigger a redundant full `renderMap()`;
- fullscreen viewport settle keeps Leaflet size invalidation but skips active-route redraw/refit while a route request is busy;
- the 20s client route timer is cleared as soon as the response body is received, before local route parsing/drawing/fitting;
- the existing maximum-two via-IC budget now evaluates one balanced pair and, when available, one geographically distinct bounded corridor so ORS `driving-hgv` can traverse farther motorway/JCT networks;
- long-route motorway discovery target may scale to 80km, while the FINAL.36 final time/distance detour caps remain unchanged;
- exact vehicle restrictions, max-two extra routes, warm 30 route-call/min guard, and no car/straight-line fallback remain unchanged.

Safety tag: `backup-pre-FINAL40-IOS-FULLSCREEN-HIGHWAY-JCT-20261007` -> `9541bd9d1d8242ec880f87315ae4fcf05052b006`.

Validation:
- PR #180 Truck route readiness / API / real Edge: `37699925874`, PASS.
- PR #180 Browser regression: `37699925873`, PASS.

Do not call FINAL.40 production-complete until PR #180 is merged and main regression, GitHub Pages, Vercel production, and live FINAL.40 evidence are terminal PASS. After release, the next evidence is the exact iPhone fullscreen timeout case and the same long-distance highway/JCT case. AN15 remains intentionally paused.


## 2026-10-08 FINAL.40 production release complete

FINAL.40 is released and production-verified.

Release evidence:
- immutable safety tag: `backup-pre-FINAL40-IOS-FULLSCREEN-HIGHWAY-JCT-20261007` -> `9541bd9d1d8242ec880f87315ae4fcf05052b006`;
- product PR #180 merged at `7f58726df3ed7a69820013f94f78e80d914f32f6`;
- PR #180 Truck route readiness / API / real Edge run `37699925874`: PASS;
- PR #180 Browser regression run `37699925873`: PASS;
- follow-up PR #179 merged at `1aefd847ffc38945d305e80c560fe1e9f8b2a714`; relative to the product merge, its effective delta is test-only (`tests/run-truck-route-gates.mjs`);
- final Truck route readiness run on that follow-up: `37709837666`, PASS;
- main Browser regression on the identical FINAL.40 product tree: `37700422796`, PASS;
- current-main GitHub Pages deployment: `37709999513`, PASS;
- Vercel production deployment `dpl_H6MTgzUTv4z72HQSERcJcgBdRY8H`: READY for Git SHA `1aefd847ffc38945d305e80c560fe1e9f8b2a714`;
- public `version.json`: `2026.10.08-FINAL.40`;
- public `truck-routing.js`: `assetVersion = 2026.10.08-FINAL.40`.

The safety contract remains unchanged:
- routing profile is `driving-hgv`;
- registered height / width / length / gross weight / optional axle load remain authoritative;
- no passenger-car fallback;
- no straight-line fallback;
- highway OFF avoids highways/tollways/ferries;
- highway ON still uses at most two extra via-IC ORS candidates;
- the warm-instance route-call guard remains;
- FINAL.36 final detour envelope remains authoritative: duration primary + min(20%, 8 minutes), distance primary + min(30%, 10km).

### Exact resume point after FINAL.40

The implementation/release task is complete. The next step is **real iPhone confirmation**, not more speculative threshold changes.

Retest the same field cases:
1. Start the same long route while already in fullscreen MAP. Confirm whether route acquisition still times out.
2. On the same long-distance destination with highway ON, confirm whether the selected route uses the expected longer motorway/JCT-connected path.
3. Confirm the route line is visible in fullscreen.
4. Confirm the route remains visible after the software `🔄` rotation.

If any item still fails:
- treat the exact result as new real-device evidence;
- inspect the exact origin/destination and the returned routing metadata before changing thresholds;
- for highway failure inspect `highwaySearch.attempted`, junction/evaluated/accepted/finalEligible counts, `selection`, motorway meters, via timeout count, and whether the final detour envelope rejected a candidate;
- for fullscreen failure prioritize iPhone/Safari viewport/render timing, Leaflet pane/SVG state, and orientation/visual-viewport behavior;
- do not weaken HGV restrictions or restore any unsafe fallback.

AN15 remains intentionally paused. Do not restore OCR/Analysis or reopen learned numeric promotion unless explicitly authorized.
