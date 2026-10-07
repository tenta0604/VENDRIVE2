# VENDRIVE2 Chat Handoff

Updated for the current migration boundary on 2026-10-07.

## Authority

- The only authoritative development baseline is the latest synchronized GitHub `main` plus the canonical recovery files.
- Do **not** resume work from old validation branches simply because they still exist.
- Do **not** infer the current revision from this file; fetch latest `main` first.
- Current visible production app version: `2026.10.07-FINAL.37`.
- Engine: `AN14B3B5`.
- DB/schema: `4 / 4`.

## Exact durable resume boundary

FINAL.37 is **complete, merged, deployed, and live-verified**. There is no unfinished FINAL.37 implementation task.

Historical PR #172 is closed and merged. Its validation branch `chatgpt/final37-active-highway-ic-search-20261007` is history only and must not be used as a resume source. PR #170 / #168 / #166 remain earlier completed history. FINAL.33/PR #164 and earlier releases remain completed history; latest synchronized `main` is authoritative.

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
