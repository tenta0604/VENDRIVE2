# VENDRIVE2 AI Development Roadmap

## Current state

- Latest completed phase: **AN11B — Machine Bring-from-vehicle Recommendation Foundation**
- Git revision authority: synchronized `HEAD` / `origin/main`
- Next phase: **AN12 — Vehicle Inventory / End-of-day Loading Proposal**

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

## Next roadmap

### Next major phase

- **AN12 — Vehicle Inventory / End-of-day Loading Proposal**

### Later major phases
- **AN13 — Analysis UI**
- **AN14 — Report Capture / OCR Integration**
- **FINAL — Full Regression / Mobile / Backup / Release Gate**

Phase numbers may be split further when safety or implementation size requires it, but do not skip the major-category order without an explicit roadmap decision.

## Permanent analysis principles

- Normalize sales over `previousClearAt` → `observedAt`, producing observed units/day and yen/day.
- Treat sold-out information as censored-demand evidence.
- Do not infer lost units without evidence such as capacity.
- Introduce recent history, YoY, weather, sold-out evidence, actual fill, and prediction error incrementally in future forecasting phases.
- Do not treat far-future weather as a confirmed value.
- Prioritize backend correctness and data safety before UI.
