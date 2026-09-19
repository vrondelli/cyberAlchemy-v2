# EVF L1 Shared Context

## Read First

1. `PLAN.md`: current evidence ceiling, exact P4/R4 semantics, and lifecycle gate.
2. `IMPLEMENTATION-LAYERING.md`: L1 boundary and blocked L2 successor.
3. `development/planning-runs/20260820T173249Z-post-l0-l1-plan/decision/DEC-GCP-004-l1-repeatability-slice.md`.
4. `development/planning-runs/20260820T173249Z-post-l0-l1-plan/decision/DEC-GCP-005-r4-proof-contract.md`.
5. `evidence/SWU-GCP-001/attempt-001/validation-receipt.json`.
6. `impl/spec/features/financial-settlement/SPEC.md`, `feature.json`, node
   sources, generated graph/source manifest, and SFOL source/adoption evidence.
7. This Work Pack's task, inventory, validation, execution-entry, and closeout
   contracts.

## Causal Spine

```text
source-owned Rule and edge
  -> regenerated graph/source handle
  -> independently authored O_spec
  -> generated O_gen
  -> exact binding
  -> real or pure runtime observation
  -> mutation-sensitive evaluator
  -> typed non-admitting receipt
```

Every arrow must retain exact identity and digest lineage. Structural graph
presence, prior experimental evidence, or a plan is not a substitute for the
fresh execution receipt.

## Unit Boundaries

- P4 owns the only source/graph regeneration and proves one ordered effect.
- R4 consumes the frozen handle and proves one pure Boolean truth table.
- The composite verifier joins receipts but cannot repair or reinterpret them.

## Claim Ceiling

Candidate-local L1 repeatability only. No lifecycle admission, P4 converse,
P3, R5, full Financial Settlement correctness, graph-law proof, provider
readiness, release, publication, deployment, or production claim.
