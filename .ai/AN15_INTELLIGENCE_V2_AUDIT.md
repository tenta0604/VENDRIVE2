# AN15 — Analytics Intelligence v2 audit and implementation contract

Baseline: main `227bfea1b843a6353569d93a5a3c3fc4f30020f0`, engine `AN14B3B2`, DB/schema v4.
Safety tag: `backup-pre-AN15-INTELLIGENCE-V2-AUDIT-20260916`.

## Audit conclusion

The current engine is a strong deterministic analytics/decision foundation, but not yet a closed-loop learning system. Existing code already provides durable RAW observations, censored-demand handling, period/YoY analysis, forecast/recommendation/planning layers, product intelligence, and confirmed-classification demand-transfer evidence. The next intelligence gain should come from measuring prediction error and learning bounded corrections from observed outcomes rather than adding more UI rules.

## Capability matrix

| Capability | Current state | AN15 action |
|---|---|---|
| RAW/result/recommendation separation | strong | preserve invariant |
| Sold-out/censored demand treatment | implemented | preserve and expose in scoring |
| Period + YoY comparison | implemented | use as baseline features |
| Demand forecast | implemented deterministic baseline | add forecast snapshot + outcome scoring |
| Recommendation/visit/load proposals | implemented proposal-only | consume calibrated forecasts later |
| Product classification | confirmed-only foundation | preserve unknown-as-unknown |
| Similar-product demand transfer | OPS10B2 foundation | later expand from pair movement to measured substitution response |
| Forecast accuracy measurement | missing/weak | AN15A |
| Per-machine/product self-calibration | missing | AN15B |
| Weather as demand feature | display/context exists; learning link not established | AN15C |
| Calendar/weekday/season effects | partial historical context, no explicit learned profile | AN15C |
| Machine behavioral profile | missing as first-class learned artifact | AN15D |
| Cannibalization/net portfolio effect | initial evidence only | AN15E |
| Joint inventory/route/service optimization | planning exists; not a unified objective optimizer | AN15F |
| Natural-language AI explanation | OCR uses external AI; analytics explanation is deterministic | AN15G, explanation only |

## Non-negotiable invariants

1. Observed facts remain immutable RAW evidence; learned/calculated artifacts never rewrite observations.
2. No fabricated demand, weather, calendar, product attributes, stockouts, or causal claims.
3. Censored observations remain marked and are never silently treated as exact demand.
4. Learned corrections must be bounded, versioned, reversible, and carry sample size/confidence/source refs.
5. Sparse data falls back to the current deterministic forecast rather than inventing a personalized model.
6. Recommendations remain proposals (`autoApply:false`) unless a later explicitly approved product phase changes that policy.
7. LLMs do not calculate the numeric forecast. Numeric forecasting/scoring remains deterministic/reproducible; an LLM may explain already-computed evidence later.
8. Each intelligence increment must be backtestable against historical observations before it can influence production recommendations.

## Finite phase plan

### AN15A — Forecast ledger + scoring foundation
Persist/version forecast snapshots without mutating RAW. When the corresponding future observation exists, score prediction error. Required metrics: absolute error, signed error/bias, MAE; WAPE only where denominator is valid. Split exact vs censored outcomes. Store model/version/horizon/source refs. No recommendation behavior change yet.

### AN15B — Bounded self-calibration
Derive machine × product correction only after sufficient scored history. Hierarchical fallback: machine-product -> machine/category or product cohort -> global deterministic baseline. Shrink low-sample corrections toward 1.0; hard cap correction magnitude. Compare calibrated vs baseline error by walk-forward backtest. Promote only if it improves error without materially worsening stockout-risk behavior.

### AN15C — Weather + calendar response
Capture historical context linked by date/area and learn only from observed paired data. Candidate features: temperature band, precipitation, weekday, month/season, holiday flag. No generic assumptions such as 'hot = +X%'. Require enough samples per feature bucket and backtest incremental value over AN15B.

### AN15D — Machine profiles
Create derived, explainable profiles from history: demand level, volatility, weekday concentration, seasonality strength, censored/stockout exposure, forecastability, service sensitivity. Profiles are descriptive features, not opaque labels, and retain source metrics/confidence.

### AN15E — Substitution/cannibalization v2
Extend OPS10B2 from two-period movement evidence to event-window analysis around confirmed assortment changes. Estimate group net change and substitution offset with pre/post windows, censoring guards, and non-causal wording unless a stronger design is introduced.

### AN15F — Decision optimizer
Optimize proposals jointly across forecast demand, stockout risk, waste/expiry risk, vehicle capacity, visit/service cost and route constraints. Objective weights must be explicit and user-adjustable later; no hidden LLM optimization.

### AN15G — AI explanation layer
Give an LLM only structured computed evidence and ask it to explain changes/recommendations in plain Japanese, identify uncertainty, and answer 'why?'. It cannot modify numeric forecasts or write operational state.

## AN15A acceptance gate

- Exact immutable safety tag at pre-edit main HEAD.
- Additive schema/storage only; backup/restore remains valid.
- Forecast snapshots have deterministic IDs/version/horizon/as-of/source refs.
- Scoring never uses information newer than forecast as-of to generate that forecast (no leakage).
- Exact outcomes and censored outcomes are separated.
- Unit tests/fixtures cover perfect forecast, over/under forecast, zero denominator, censored outcome, duplicate scoring, sparse history.
- Existing AN14B3B2 forecast/recommendation output is unchanged during AN15A.
- Production Pages deployment success; no smartphone gate if AN15A remains analysis-only/no interactive UI.

## Product decision

Proceed with AN15A first. It is the prerequisite for safely judging every later 'smarter' model. Without an accuracy ledger, adding weather/ML/AI would make the system more complicated without proving it became more accurate.
