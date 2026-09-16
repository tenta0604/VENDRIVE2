# AN15C context-response verification matrix

AN15C remains evaluation-only and does not alter live AN14B3B2/AN15B recommendations.

| Case | Expected |
|---|---|
| context missing weather values | no weather value fabricated; only known calendar fields considered |
| explicit temperature | deterministic band: <10 / 10-19 / 20-24 / 25-29 / 30+ |
| explicit precipitation | deterministic none / light / wet band |
| weekday/month/season | derived only from targetAt; holiday remains unknown unless explicitly supplied |
| weather source | optional source ref retained with context |
| censored scored outcome | excluded from learned context effects |
| feature bucket < 6 exact paired samples | no learned factor |
| feature bucket >= 6 | shrink observed actual/predicted ratio toward 1.0 |
| extreme response | combined factor capped 0.80..1.20 |
| duplicate context attach | idempotent, original context retained |
| walk-forward evaluation | profile sees only outcomes whose targetAt precedes forecast asOf |
| no measured improvement | promotionEligible false |
| measured improvement | candidate only; productionPromotion remains false |
| generic claim e.g. hot=+X% | forbidden; factor must come from paired VENDRIVE observations |
| LLM | not involved in numeric calculation |

Before production promotion, AN15C must be compared incrementally against the AN15B-calibrated baseline, not merely the original raw forecast.
