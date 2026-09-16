# AN15E substitution/cannibalization v2 verification

AN15E is evidence-only. It must not change RAW records, live forecasts, tasks, inventory, or recommendations automatically.

| Case | Expected |
|---|---|
| event status not confirmed | reject evaluation |
| missing machine/product/effective date | reject evaluation |
| same incoming/outgoing product | reject evaluation |
| censored observation | excluded from rate window |
| observation outside event window | excluded |
| fewer than 2 pre-outgoing or 2 post-incoming exact samples | confidence insufficient |
| outgoing falls and incoming rises | report opposing movement; never causal claim |
| confirmed classifications are similar | label pattern consistent with substitution, explicitly non-causal |
| classifications unknown | keep similarity insufficient; do not infer attributes |
| both products decline | report group decline pattern |
| no clear opposing movement | report no clear substitution pattern |
| downstream behavior | descriptiveOnly true; autoApply false; changesLiveForecast false |

The API requires an explicit confirmed assortment event object. AN15E does not invent replacement events from coincident sales movement.
