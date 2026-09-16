# AN15D2 cross-machine pooling gate

Purpose: test whether evidence from descriptively similar machines can improve a target machine forecast without look-ahead. This phase is evaluation-only.

## Guardrails
- exact scored outcomes only; censored observations are excluded
- every evaluation point uses history strictly before that point
- target requires at least 4 prior exact observations
- each donor requires at least 8 prior exact observations
- donor must share at least one non-bias machine-profile signal with the target
- at most 3 donors are used
- donor influence is capped at 25%
- at least 8 held-out evaluation points are required
- relative MAE must improve by at least 3% to pass the evidence gate
- passing the gate does **not** alter the live forecast; `autoApply:false`

A later production-promotion phase must separately prove that the gate is stable, does not materially worsen stockout-risk behavior, and remains reversible/versioned before any live forecast can consume pooled evidence.
