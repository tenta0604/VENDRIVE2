# OPS10B2 finite verification contract

Production-code scope only:
1. Add classification-aware demand-transfer computation as a sidecar module.
2. Consume existing RAW sales observations; do not mutate RAW records.
3. Use only OPS10B1 records with `status: confirmed` for similarity evidence.
4. Unknown attributes remain unknown; no inferred product facts.
5. Compute same-machine decline/rise pairs and progressively similar groups (`close`, then broad `family`).
6. Emit evidence with explicit non-causal interpretation and censoring/confidence flags.
7. Emit replacement-review proposals only; `autoApply: false`, no state writes.
8. Wire the module into production and advance app version to FINAL.16.

Required gates: immutable annotated safety tag at exact pre-edit main HEAD; JS syntax; diff check; confirmed-only guard; causalClaim=false/autoApply=false guard; module load/version binding; existing analytics and visit/task behavior untouched; Pages deployment success; live FINAL.16 evidence. Browser/IndexedDB real-device check is required only if the new analysis is surfaced through device UI in this phase; this foundation has no new interactive UI.
