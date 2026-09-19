---
task_reference: SWU-UIF-003A
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-003A

## Scope

Implement the resolved W1 result-contract bridge as a sibling of the immutable
E0 contract, then restore UIF-004..006 readiness.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Decision](../SWU-UIF-004/DECISION-W1-RESULT-CONTRACT.md) | selected option 1 | Add a shared, versioned W1 contract without rewriting E0. |
| [Blocked context](../SWU-UIF-004/CONTEXT-PACK.md) | contract contradiction | Represent every W1 label and provisional outcome machine-validly. |
| [E0 protocol](../../experiments/protocol.yml) | witness classes; run policy | Reuse method version `ui-formalization.v0.1`; do not mutate E0. |
| [E0 result schema](../../experiments/result.schema.yml) | stable base fields | Preserve E0 schema and results as immutable evidence. |
| [E0 runner](../../experiments/e0_runner.py) | parsing; repeatability | Reuse deterministic structural-probe semantics in a sibling W1 harness. |
| [Experiment plan](../../EXPERIMENTS.md) | E1-E4; result contract | Support constructibility, malformed/neighbor discrimination, graph evidence, and portability. |
| [W1](../../work-pack/waves/W1.md) | three lanes | One shared contract; disjoint lane preregistration, fixtures, and results. |
| [Lane task](../../work-pack/tasks/TASK-UIF-LANES.md) | done criteria | Enable three, four, and four complete result records. |
| [Layering](../../IMPLEMENTATION-LAYERING.md) | non-regression guardrail | Add sibling artifacts; do not invalidate E0. |

## Coverage

- Sources: 9.
- Selector groups: 14.
- Decision, architecture, method, write scope, contract shape, validation,
  non-regression, and synchronization obligations: covered.
- Runtime handoff: none; local execution.
- Strict delegated coverage: n/a.

## Write Scope

- `experiments/w1/protocol.yml`
- `experiments/w1/result.schema.yml`
- `experiments/w1/runner.py`
- this run's receipt and required work-pack status synchronization

## Hard Constraints

1. Do not modify any existing E0 protocol, schema, runner, fixture, or result.
2. Keep `protocol_version: ui-formalization.v0.1` as the proven method identity.
3. Give W1 a separate machine result-contract version.
4. Require lane preregistration before execution and two deterministic runs.
5. Keep DS-D8 evidence supporting-only and promotion eligibility false.
6. Do not select candidate outcomes in the shared bridge.

## Gate Result

- Decision gate: pass; option 1 selected by user.
- Dependency/context gates: pass.
- Write-scope and validation surfaces: complete.
- Consequential mutation: permitted within the listed scope.
