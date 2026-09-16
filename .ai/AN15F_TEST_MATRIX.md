# AN15F joint optimizer verification

AN15F is a proposal-only multi-objective prioritizer. It does not execute replenishment, route, task, or inventory actions.

| Case | Expected |
|---|---|
| no candidates | insufficient / no proposals |
| unknown objective input | remains unknown and lowers confidence |
| stockout/waste/visit/vehicle/capacity values | normalized independently, no fabricated values |
| custom nonnegative weights | normalized before scoring |
| all weights zero | fall back to documented defaults |
| capacityOk=false | candidate excluded |
| vehicleStockOk=false | candidate excluded |
| unknown constraint | not silently treated as confirmed true |
| high combined risk | ranked earlier for human review |
| monetary cost absent | no invented yen/cost model |
| proposal output | requiresUserConfirmation=true and autoApply=false |
| downstream state | no RAW, inventory, task, or route writes |

Production promotion of optimizer proposals requires a later explicit gate with observed backtest evidence. AN15F itself is not that gate.
