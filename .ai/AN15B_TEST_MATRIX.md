# AN15B self-calibration verification matrix

AN15B is candidate/evaluation-only. It MUST NOT alter AN14B3B2 production recommendations yet.

| Case | Expected |
|---|---|
| no exact scored history | factor 1.0 / baseline |
| censored-only history | ignored for calibration |
| pair < 4 exact samples | pair correction not used |
| pair >= 4 exact samples | pair is preferred hierarchy |
| pair insufficient, machine >= 6 | machine fallback |
| machine insufficient, product >= 6 | product fallback |
| all specific sparse, global >= 6 | global fallback |
| low sample factor | shrunk toward 1.0 with prior strength 8 |
| extreme historical ratio | final factor clamped to 0.70..1.30 |
| walk-forward | each test forecast uses only rows with targetAt earlier than forecast asOf |
| baseline beats calibration | promotionEligible false |
| calibration beats baseline with >=6 evaluated rows | promotionEligible true, but productionPromotion remains false |
| numeric forecast calculation | deterministic; no LLM involvement |

Promotion into live recommendations requires a later explicit gate after enough real scored observations exist.
