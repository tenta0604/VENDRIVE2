# 2t truck route display — pending verification

The user approved internal road-route display with 2t vehicle conditions from the start on 2026-10-06. The verified production baseline is FINAL.23 at `7e59bae140629fefe1ba96319b8bae169b41d95f`. This working change is not a released FINAL.24 and keeps the production application/engine/database/schema versions unchanged.

## Implemented scope

- Machine detail: 経路を表示 opens the existing map. 外部ナビ retains Google Maps separately.
- Vehicle settings: height, width, length in cm; gross vehicle weight in kg; optional maximum axle load in kg. Convert only explicitly entered values to metres/tonnes. No assumed "typical 2t" profile. Empty required dimensions/weight block route calculation.
- Vehicle profile is stored in `state.routeVehicle`, preserving the existing JSON backup/restore path and schema. Restoring a backup ends any current route; old backups remain valid with an unset vehicle profile.
- `api/route.mjs` is a POST/OPTIONS Web Request Vercel Function using `ORS_API_KEY` exclusively on the server. It returns sanitized road geometry plus distance/time, rather than credentials or provider errors.
- New HeiGIT endpoint: `https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson`. The conservative `hgv` vehicle type is fixed; no assumed delivery-access exceptions. Vehicle dimensions and weight are applied with `options.profile_params.restrictions`.
- Avoid ferries. Avoid tollways by default, with an explicit setting to include them.
- Road route geometry and destination marker use the existing `routeLayer`. Map rerenders preserve them. GPS updates move the existing current-position marker and do not request a new route.
- Manual recalculation, route overview, vehicle settings, external navigation and end controls. No voice/turn/lane instructions, automatic recalculation, multi-stop optimization or automatic visit changes.
- Missing coordinates/profile, low GPS accuracy, provider timeout, quota exhaustion and unavailable configuration fail closed. No ordinary-car or straight-line fallback. End/switch/profile edit invalidates in-flight requests; late responses cannot resurrect cleared geometry. Destination coordinate changes/delete invalidate the current route.
- Candidate-route notice: unrecorded restrictions and local conditions are not guaranteed; road signs take priority. External Google navigation does not receive the truck profile.

## Finite gate checklist

1. JS/module and inline HTML script syntax; diff whitespace checks.
2. Node API/client tests: units, validation, CORS/body limits, unavailable key, request shape, provider failures, quota guard, save failure, destination invalidation, redraw and late-response cancellation.
3. Real Edge with a dedicated temporary profile at 320px and 390px: settings, road geometry, GPS-only movement, rerender persistence, recalculation/errors/end, persistence and external navigation; no overflow or page errors.
4. Existing five browser regressions (task selection/thresholds, tomorrow-plan/UI simplification, product master/maker/size sorting).
5. Before activation/release only: configured free Standard ORS key, an explicitly confirmed real vehicle profile, actual provider route test, deployment terminal evidence, and live app/API verification.

Local gates 1–2 passed. Gates 3–4 are blocked because both Edge binaries exit with SIGSEGV in the current execution environment, while agent-browser cannot bind its daemon socket (`Operation not permitted`). `.github/workflows/truck-route-gates.yml` is prepared to run these checks in GitHub Actions once an explicit exception permits saving unverified changes to a non-production validation branch. This does not authorize merge or production deployment.

## Activation inputs and cost boundary

- Create/use a free Standard key at https://account.heigit.org/ and configure `ORS_API_KEY` as a sensitive Vercel environment variable. Do not place it in client files, Git history, issues or chat.
- Confirm real vehicle height/width/length and gross weight; optional axle load remains unknown if unavailable.
- This change does not purchase a plan, create paid resources, or silently upgrade an account. ORS imposes its free provider quota; the extra warm-instance 30/minute limiter is not a global distributed abuse limiter. Origin allowlisting is CORS/origin checking, not user authentication.
- Existing Vercel hosting terms/plan suitability still require assessment before business deployment; no claim of unconditional free business hosting is made.

## Primary references checked

- https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options
- https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912
- https://account.heigit.org/info/plans
