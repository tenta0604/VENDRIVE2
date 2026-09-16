# AN15D machine-profile verification matrix

AN15D is descriptive/evaluation-only. It must not change live forecasts, recommendations, tasks, inventory, or RAW records.

| Case | Expected |
|---|---|
| machine has < 8 exact outcomes | confidence `insufficient`; no stability/bias signal |
| 8-15 exact outcomes | confidence `emerging` |
| >=16 exact outcomes | confidence `established` |
| censored outcome | excluded from profile evidence |
| summer/winter each <3 | no seasonal contrast signal |
| summer/winter sufficient and >=15% normalized difference | auditable season_response signal |
| weekday/weekend each >=3 and >=15% normalized difference | weekpart_response signal |
| CV <= .25 | stable demand signal |
| CV >= .55 | volatile demand signal |
| actual/forecast bias <10% | no forecast-bias label |
| actual/forecast bias >=10% | under/over forecast tendency with evidence |
| compare two machines | common signals returned, but usableForPooling remains false |
| asOf supplied | only targetAt strictly before asOf is used |
| LLM | never used for numeric classification |
| downstream behavior | autoApply false; descriptiveOnly true |

Cross-machine pooling is explicitly blocked until a later walk-forward test proves that borrowing evidence from similar machines improves held-out forecast error.
