# VENDRIVE2 AI Development Roadmap

## Current state

- Visible app candidate: **2026.09.18-FINAL.17** (bounded field-maintenance release; Analytics engine **AN14B3B3**, DB/schema remain 4).
- Latest intelligence milestone: **AN15G2 production transport closeout + AN15 lifecycle hardening**.
- Active engineering phase: **None**. VENDRIVE is intentionally in an operational evidence phase rather than a feature-building phase.
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

Real field use on 2026-09-18 produced bounded maintenance corrections rather than a new speculative feature phase. FINAL.16 hardened OCR period/identity correction. The FINAL.17 maintenance candidate adds explicit post-confirm visit closeout (including no-input/no-recovery facts without fabricated reports) and blocks materially overlapping sales periods that could double-count cumulative journals. Preview browser/IndexedDB/mobile gates pass; production merge/live verification is the remaining release gate.

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
