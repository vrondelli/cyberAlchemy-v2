# Observability Result

- Distill child signal: `distill-ape-plan-20260804`, recorded at central ledger line 530.
- Invoke signal: `invoke-ape-ontology-guided-20260804`, recorded at central ledger line 531.
- Caller link: Distill `lineage.parent_run_id` is the Invoke run ID.
- Evidence references: request, runtime events, execution receipt, and validation result are exact digest/size bindings.
- Quality bar: pass.
- Reflection trigger: gap threshold; recommendation: reflect now.
- Anti-pattern hits: 0.

Observability residue: `.agents/skills/invoke/scripts/observe-distill-invocation.sh` resolved the observer under missing `.agents/framework/` and exited 1. The canonical `arcanum/framework/observability/scripts/observe-invocation.sh` recorded the same validated child envelope exactly once. This adapter defect does not change the Distill verdict or authorize mutation.
