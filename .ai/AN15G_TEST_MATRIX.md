# AN15G AI explanation verification

AN15G makes analytics understandable; it is never a numeric decision authority.

| Case | Expected |
|---|---|
| supplied facts | grounding preserves only explicit values and source refs |
| missing fact value | remains null/unknown |
| proposal | autoApply is always false |
| request payload | instructs model to explain only, never recalculate |
| AI response absent/invalid | deterministic fallback |
| AI response valid | presentation text accepted but original grounding remains attached |
| forecast/score/rank/quantity | AI has no authority to change them |
| causal language | prohibited without evidence |
| provider outage | deterministic explanation remains available |
| downstream state | no RAW/inventory/task/route writes |

Provider integration is intentionally separated from numeric analytics. A future server endpoint may call Gemini only with the grounded payload and must validate its response before display.
