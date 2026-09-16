# Repository Hygiene Audit — 2026-09-16

## Scope

Remove only one-off execution workflows from completed OPS10A/OPS10B2 repair phases. Preserve production runtime code and all current reusable safety/test infrastructure.

## Keep

- `.github/workflows/create-safety-tag.yml` — canonical immutable safety checkpoint workflow.
- `.github/workflows/an15-hardening-tests.yml` — current executable AN15 hardening CI.
- `.github/workflows/maintenance-executor.yml` — reusable guarded maintenance path; retained pending a separate design review.

## Retire

The `ops10a-*` workflow family and `ops10b2-exec.yml` were temporary implementation/repair executors for phases already completed and verified. Their triggering issues are closed. Keeping them registered increases accidental-trigger and maintenance surface without adding production capability.

Retirement is repository hygiene only: no app runtime, IndexedDB schema, analytics logic, UI, OCR, route behavior, Today ordering, or production data is changed.

## Follow-up

After cleanup merge and CI/deploy verification, re-audit current runtime/product gaps. Do not revive withdrawn OPS10C behavior.
