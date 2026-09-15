# VENDRIVE2 AI Development Roadmap

## Current state

- Latest completed phase: **FINAL — Full Regression / Mobile / Backup / Release Gate**
- Active / next product phase: **None — current build is release-ready**
- Release app version: **2026.09.15-FINAL**
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

## Release baseline

VENDRIVE2 is release-ready at **2026.09.15-FINAL**. There is no automatically scheduled next product phase.

Future product work must be explicitly scoped before implementation, preserve the existing safety/architecture decisions, and create a fresh immutable Safety Tag before production-code edits. Maintenance fixes should remain minimal and regression-tested rather than silently expanding the roadmap.

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
