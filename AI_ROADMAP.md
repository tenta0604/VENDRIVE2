# VENDRIVE2 AI Development Roadmap

## Current state

- Latest completed product phase: **OPS10B2 — Classification-aware Demand Transfer / Replacement Analysis**
- Active product phase: **None**
- Next product phase: **OPS10C — Explicit Active Visit / Nearby Candidate Workflow**
- Release app version: **2026.09.16-FINAL.15**
- Git revision authority: synchronized `HEAD` / `origin/main`
- FINAL.15 Today task visibility is production-deployed and iPhone-confirmed; previously passed visit-completion behavior is not to be redundantly re-tested unless relevant code changes.
- OPS10B2 analysis runtime is production-deployed; it adds no new interactive device UI, so no additional smartphone gate is required for that phase.

## Completed

- AN1 through AN7 browser verification
- AN8A1 — Sales Observation Analysis Foundation
- AN8A2 — Observation Window Aggregation Foundation
- AN8A3 — Previous-period Comparison Foundation
- AN8B — YoY / Historical Comparison Foundation
- AN8C — Sold-out-aware Demand Evidence / Confidence Layer
- AN9 — Demand Forecast Foundation
- AN10 — Recommendation Engine Foundation
- AN11A — Visit Planning / Route Constraint Foundation
- AN11B — Machine Bring-from-vehicle Recommendation Foundation
- AN12 — Vehicle Inventory / End-of-day Loading Proposal
- AN13A — Analysis UI Foundation
- AN13B — Analysis UI Polish / Mobile / Empty-state Hardening
- AN14A — Report Capture / Review Pipeline Foundation
- AN14B1 — Secure OCR Adapter / Classification Review
- AN14B2 — Reviewed OCR Candidate → Draft Report
- AN14B3A — Production OCR Provider Connection
- AN14B3B1 — Sales-journal Real-paper Review UI Calibration
- AN14B3B2 — Input / Recovery Real-paper Review UI Calibration
- FINAL — Full Regression / Mobile / Backup / Release Gate
- OPS-REAL-WORKFLOW — OCR confirmation / Today workflow hardening
- OPS10A — Vehicle Inventory Initial Stocktake / Baseline UI
- OPS10B1 — Multi-axis Product Intelligence / First-seen Classification
- OPS10B2 — Classification-aware Demand Transfer / Replacement Analysis

## Release baseline

VENDRIVE2 production baseline remains **2026.09.16-FINAL.15** for the visible app shell. OPS10B2 is a production analysis sidecar and does not change the visible shell version.

OPS10A provides real vehicle-stock baseline entry without fabricating historical movements. OPS10B1 adds confirmed multi-axis product intelligence with broad family plus optional structured attributes and preserves unknown values instead of inventing facts. OPS10B2 compares same-machine product movement using confirmed similarity evidence, carries censoring limitations forward, and emits non-causal proposal-only replacement review signals. Today operational safeguards show relevant unfinished task names on visit cards and use per-task completion confirmation; FINAL.15 preserves that task display across delayed current-position rerenders.

No product phase is currently active. The next scoped work is OPS10C.

## Planned post-FINAL operations phases

### OPS10C — Explicit Active Visit / Nearby Candidate Workflow

Purpose: reduce Today-tab scrolling without misidentifying adjacent vending machines.

Scope:
- GPS proximity is candidate discovery only; being within 100m must never automatically mean "currently visiting";
- show nearby candidates compactly when no active machine is selected, keeping adjacent machines individually distinguishable;
- let the user explicitly start exactly one machine as active work;
- starting another while one is active requires a switch confirmation;
- persist active work across app reopen and clear it automatically on visit completion;
- preferred Today order: WORK PROGRESS → report capture → active-work / nearby compact area → normal Today list;
- when active, pin the machine in the compact active-work area and avoid unnecessary duplicate display in the normal list;
- compare OCR machine identity with the active machine; show positive match when aligned and warn on mismatch before association.

## Permanent analysis principles

- Normalize sales over `previousClearAt` → `observedAt`, producing observed units/day and yen/day.
- Treat sold-out information as censored-demand evidence.
- Do not infer lost units without evidence such as capacity.
- Keep RAW observations, COMPUTED evidence, and RECOMMENDATION proposals explicitly separated.
- Do not claim causality from correlation or substitution signals.
- Do not treat unknown product attributes as known similarity evidence.
- Do not treat far-future weather as a confirmed value.
- Prioritize backend correctness and data safety before UI.
- Real-paper OCR/review layouts must be calibrated from evidence rather than invented from assumptions.

## Recovery note

Phase order lives in this roadmap. Current work detail, blockers, and required user input live in `.ai/STATE.json`; the most recent completed operation and exact next action live in `.ai/LAST_RUN.json`; locked decisions live in `.ai/DECISIONS.md`.
