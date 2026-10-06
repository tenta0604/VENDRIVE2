# VENDRIVE2 Chat Handoff

Updated for the current migration boundary on 2026-10-07.

## Authority

- The only authoritative development baseline is the latest synchronized GitHub `main` plus the canonical recovery files.
- Do **not** resume work from old validation branches simply because they still exist.
- Do **not** infer the current revision from this file; fetch latest `main` first.
- Current visible production app version: `2026.10.07-FINAL.32`.
- Engine: `AN14B3B5`.
- DB/schema: `4 / 4`.

## Exact durable resume boundary

FINAL.32 is **complete, merged, deployed, and live-verified**. There is no unfinished FINAL.32 implementation task.

Historical PR #162 is closed and merged. Its old branch `chatgpt/final32-nav-progress-reroute-20261007` may remain available for history/tests, but it is **not** a resume branch and must not be treated as newer authority than `main`.

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
3. Confirm live/code versions and phase consistency only as needed; do not rerun already-passed FINAL.32 gates without a changed precondition or contradictory new evidence.
4. Ignore old PR #162 branch state as an execution source.
5. If the user says only `VENDRIVE続き`, resume from `STATE.nextPhase`.
6. If the user instead reports a fresh field issue, open a new bounded maintenance scope with a new immutable pre-edit safety tag before production-code edits.
7. Continue under the hard terminal-state rule from `AGENTS.md`.

## User-facing migration note

A long migration prompt is optional. The repository is prepared so the shortest safe resume instruction is:

`VENDRIVE続き`

If a longer prompt is supplied, it should still instruct the new chat to recover from latest `main` first rather than trusting the pasted prompt over GitHub.
