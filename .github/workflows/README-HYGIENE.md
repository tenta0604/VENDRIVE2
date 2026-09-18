# Workflow hygiene

Canonical reusable workflows after the 2026-09-18 cleanup are `create-safety-tag.yml`, `an15-hardening-tests.yml`, `browser-regression-gates.yml`, and `maintenance-executor.yml`.

`browser-regression-gates.yml` is the standard no-TinyFish browser regression path for self-contained VENDRIVE gate pages. It runs the local repository through Playwright/Chromium on GitHub Actions for relevant pull requests and `main` pushes. Add new deterministic browser gate pages to `tests/run-browser-gates.mjs`; do not create one-off browser workflows unless a later phase truly needs different infrastructure.

Historical `ops10a-*` and `ops10b2-exec.yml` files are retired one-off executors and must not be restored unless their original phase is deliberately reopened.
