# VENDRIVE2 AI Development Roadmap

## Current state

- Latest completed product phase: **OPS-REAL-WORKFLOW — OCR confirmation + Today operational safeguards**
- Active product phase: **None**
- Next product phase: **OPS10A — Vehicle Inventory Initial Stocktake / Baseline UI**
- Release app version: **2026.09.16-FINAL.9**
- Git revision authority: synchronized `HEAD` / `origin/main`
- Current release evidence: full legacy, Analytics, OCR/review, backup/restore, data-safety, and exact 320px/390px Microsoft Edge regression passed.

## Completed

- AN1
- AN1.1
- AN2
- AN3
- AN4
- AN4.1
- AN4.2
- AN5
- AN5.1
- AN6
- AN6.1
- AN6.2
- AN7A1
- AN7A2a
- AN7A2b1
- AN7A2b2
- AN7B1
- AN7B2
- AN7 browser verification
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

## Release baseline

VENDRIVE2 production baseline is **2026.09.16-FINAL.9**.

The post-FINAL real-workflow layer is also complete:
- reviewed OCR candidates create drafts only after explicit paper approval;
- draft creation shows an explicit success state;
- a second explicit confirmation changes the report to `confirmed`;
- confirmed sales reports become analysis inputs;
- confirmed input/recovery reports become inventory/planning inputs;
- report capture sits directly below the Today work-progress hero;
- visit completion warns about unfinished tasks on that machine;
- end-of-day warns about unfinished orders/tasks only for today's active route machines.

No product phase is currently active. The next scoped work is below.

## Planned post-FINAL operations phases

### OPS10A — Vehicle Inventory Initial Stocktake / Baseline UI

Purpose: bootstrap real current vehicle stock without fabricating historical movements.

Scope:
- add a dedicated vehicle-stock initial stocktake screen backed by existing Analytics `baseline` semantics;
- product search should behave like the vending-machine list search and support product name, product code, and maker;
- support case count + loose units; convert to unit-equivalent total only when known case size exists;
- never invent an unknown case size;
- make zero versus not-counted explicit; do not silently turn unentered products into zero;
- preview/confirm the full stocktake before writing the baseline;
- record the stocktake timestamp as the inventory starting point;
- after bootstrap, confirmed movements drive stock and later physical stocktakes use reconciliation/correction rather than history rewriting.

### OPS10B1 — Multi-axis Product Intelligence / First-seen Classification

Purpose: create classification data that is useful for revenue movement and replacement analysis, not just display labels.

Scope:
- evolve product intelligence beyond the existing single `category` field while preserving backward compatibility;
- model a broad product family plus multiple structured attributes/tags;
- support category-specific optional attributes and unknown values without fabricating facts;
- examples for coffee include black/milked, sugar level, milk presence, volume band, container, hot/cold compatibility, price band, brand/maker;
- examples for carbonated beverages include unsweetened sparkling water, cola, fruit soda, energy-style carbonation, lactic carbonation, flavor/sugar/volume/container/price/brand where applicable;
- on the first appearance of a new product, propose classification automatically from available evidence;
- require one human confirmation or correction, then reuse the confirmed classification instead of asking repeatedly.

### OPS10B2 — Classification-aware Demand Transfer / Replacement Analysis

Purpose: distinguish real demand decline from sales moving to a close substitute, and improve product-change recommendations.

Scope:
- compare product-level movement with aggregate movement across progressively similar product groups;
- identify signals such as one unsweetened black coffee declining while another unsweetened black coffee at the same machine rises;
- avoid concluding that a category is shrinking when demand is merely moving within a close substitute group;
- use similarity attributes as evidence for replacement candidates rather than treating every item in a broad category as interchangeable;
- preserve RAW → COMPUTED → RECOMMENDATION separation and avoid inventing causal certainty.

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
- Introduce recent history, YoY, weather, sold-out evidence, actual fill, and prediction error incrementally in future forecasting phases.
- Do not treat far-future weather as a confirmed value.
- Prioritize backend correctness and data safety before UI.
- Real-paper OCR/review layouts must be calibrated from evidence rather than invented from assumptions.

## Recovery note

Phase order lives in this roadmap. Current work detail, blockers, and required user input live in `.ai/STATE.json`; the most recent completed operation and exact next action live in `.ai/LAST_RUN.json`; locked decisions live in `.ai/DECISIONS.md`.
