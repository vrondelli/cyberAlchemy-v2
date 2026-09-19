---
context_pack: SWU-CDSC-006
coverage: strict-local
source_count: 9
gate: PASS
---

# Context Pack: SWU-CDSC-006

## Objective

Evaluate generation 1 from exactly three accepted frozen receipts, persist the
fixture and suite envelopes, and append one generation entry.

## Selected Inputs

- `work-pack/tasks/TASK-CDSC-EVALUATION.md`
- `work-pack/waves/W2.md`
- accepted evaluator modules under `evaluation/`
- frozen contracts under `contracts/`
- F1 receipt handle `record:sha256:3d9cc04497d676bd4fb3e1c9a8c0d61f1f1f7016d41fa73f835d17a3d849edc0`
- F2 receipt handle `record:sha256:590f688562398cf845bffe882e21922b6b62dca59cda3cfc7c6a9994ba6e1c1f`
- F3 receipt handle `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a`

## Boundaries

- Do not reread or mutate fixture repositories.
- Do not revise evidence to improve an outcome.
- Write only generation-1 results, generation index, integration test, Task
  Session evidence, and evidence-backed status synchronization.
- Same-process replay may establish deterministic treatment only.

## Gate

All three receipts are total, frozen, manifest-bound, schema-vocabulary valid,
and accepted. The preflight vocabulary correction changed only F2/F3 envelope
handles and preserved their evidence conclusions.
