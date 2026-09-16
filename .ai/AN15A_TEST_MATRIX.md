# AN15A forecast scoring verification matrix

Runtime module: `an15a-forecast-scoring.js` v1. This phase is additive and does not change AN14B3B2 forecast/recommendation calculations.

| Case | Expected |
|---|---|
| perfect forecast 10 vs 10 | signed=0, absolute=0, MAE=0 |
| over forecast 12 vs 10 | signed=+2, absolute=2 |
| under forecast 8 vs 10 | signed=-2, absolute=2 |
| actual zero | APE/WAPE denominator excluded, no divide-by-zero |
| censored outcome | score retained as censored evidence but excluded from exact MAE/bias/WAPE |
| duplicate snapshot ID | idempotent; original snapshot returned |
| duplicate score | idempotent; first scored record returned |
| outcome before targetAt | rejected |
| targetAt <= asOf | rejected (look-ahead/invalid horizon guard) |
| sparse history | metrics return null rather than fabricated accuracy |

AN15B must not consume a learned correction until it can compare baseline and calibrated walk-forward errors using this ledger.
