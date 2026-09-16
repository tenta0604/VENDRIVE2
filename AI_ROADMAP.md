# VENDRIVE2 AI Development Roadmap

## Current state

- Visible app baseline: **2026.09.16-FINAL.15**.
- Latest merged intelligence code: **AN15G2 — grounded Gemini explanation transport**.
- Active engineering phase: **AN15 hardening — production lifecycle integration + executable verification**.
- AN15G2 `/api/explain` is merged, but Vercel production deployment is externally rate-limited; GitHub Pages build/report/deploy passed for the same main head.
- No AN15 numeric-learning layer is allowed to change live forecasts automatically yet.
- OPS10C remains withdrawn. Preserve existing Today nearest-machine ordering and do not reintroduce CURRENT INSTALL SPOT / explicit visit-start behavior without a new product decision.

## Completed production foundations

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
- AN13A/B — Analysis UI Foundation / mobile hardening
- AN14A — Report Capture / Review Pipeline Foundation
- AN14B1/B2/B3A/B3B1/B3B2 — Secure OCR through real-paper review calibration
- FINAL — Full Regression / Mobile / Backup / Release Gate
- OPS-REAL-WORKFLOW — OCR confirmation / Today workflow hardening
- OPS10A — Vehicle Inventory Initial Stocktake / Baseline UI
- OPS10B1 — Multi-axis Product Intelligence / First-seen Classification
- OPS10B2 — Classification-aware Demand Transfer / Replacement Analysis

## AN15 Intelligence v2 foundations merged

- **AN15A — Forecast ledger/scoring:** deterministic forecast snapshots and exact/censored outcome scoring API. **Hardening gap:** not yet automatically wired into real production forecast creation and later confirmed outcome matching.
- **AN15B — Bounded self-calibration:** hierarchical shrinkage with bounded factors and walk-forward evaluation. Evaluation-only; no production promotion.
- **AN15C — Weather/calendar context response:** explicit context only; unknown weather stays unknown. **Hardening gap:** incremental promotion evaluation must compare against the AN15B-calibrated baseline, not merely the raw forecast baseline.
- **AN15D — Explainable machine profiles:** descriptive demand/volatility/weekpart/season signals with sample confidence.
- **AN15D2 — Cross-machine pooling backtest:** no-lookahead evaluation with bounded donor influence; live pooling disabled.
- **AN15E — Substitution/cannibalization v2:** confirmed assortment-change event windows, censored-aware and explicitly non-causal.
- **AN15F — Joint optimizer foundation:** proposal-only multi-objective priority scoring; no downstream writes or fabricated monetary costs.
- **AN15G — AI explanation boundary:** grounded explanation only; no numeric authority; deterministic fallback.
- **AN15G2 — Gemini explanation API:** separate `/api/explain` transport with server-side key and grounding validation. Code merged; production Vercel verification pending external rate-limit clearance.

## Active hardening gates

Before any learned numeric correction may influence production forecasts:

1. Wire AN15A snapshots into the actual production forecast lifecycle without changing forecast values.
2. Score only safely matched later **confirmed** sales outcomes; preserve sold-out/censored semantics and never invent actual demand.
3. Make AN15C context evaluation incremental against the AN15B-calibrated baseline.
4. Add executable tests for AN15A-C covering idempotency, exact-vs-censored scoring, sparse fallback, bounds, hierarchy, no-lookahead, explicit context, unknown weather, and incremental comparison.
5. Require enough real exact samples and held-out improvement before any promotion; promotion must remain versioned, bounded, reversible, and auditable.
6. Verify `/api/explain` against Gemini after Vercel deployment is available. This gate is independent from numeric learning promotion.

## Withdrawn

### OPS10C — Explicit Active Visit / Nearby Candidate Workflow

Field verification showed that the install-spot workflow did not provide reliable enough value for its operational cost and complexity. It was removed from production. Do not treat OPS10C as pending and do not request its old smartphone checks.

## Permanent analysis principles

- Normalize sales over `previousClearAt` → `observedAt`, producing observed units/day and yen/day.
- Treat sold-out information as censored-demand evidence.
- Do not infer lost units without evidence such as capacity.
- Keep RAW observations, COMPUTED evidence, and RECOMMENDATION proposals explicitly separated.
- Do not claim causality from correlation or substitution signals.
- Do not treat unknown product attributes as known similarity evidence.
- Do not treat weather as observed unless it comes from a reliable explicit source.
- LLM/Gemini explains grounded results; it is not the numeric forecaster or optimizer.
- Learned corrections require no-lookahead backtests, sample/confidence reporting, bounded effects, reversibility, and auditability before production promotion.
- Prioritize backend correctness and data safety before UI.

## Recovery note

Current work detail and blockers live in `.ai/STATE.json`; the most recent operation and exact next action live in `.ai/LAST_RUN.json`; locked decisions live in `.ai/DECISIONS.md`.
