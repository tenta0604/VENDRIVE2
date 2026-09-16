# REPO-HYGIENE scope lock

Production baseline: `7610ceeff1c57516b1967c31bf686ead4558ac5c`.

Allowed changes: remove completed one-off OPS10A/OPS10B2 GitHub Actions workflows; add hygiene documentation.

Forbidden changes: app runtime, analytics runtime, OCR, IndexedDB, Today behavior, route logic, UI, product intelligence, user data, Vercel API behavior.

Required before merge: annotated safety tag `backup-pre-REPO-HYGIENE-20260916` targeting the exact production baseline.
