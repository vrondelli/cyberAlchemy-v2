---
task_reference: SWU-UIF-005
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-005

## Scope

Run the View Model/Form/Action/State Indicator data-interaction lane under the
shared W1 contract, preserving relationship and promotion boundaries.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Work pack](../../WORK-PACK.md) | SWU-UIF-005 row | Emit four complete, deterministic records in the assigned lane paths. |
| [Lane task](../../work-pack/tasks/TASK-UIF-LANES.md) | data/interaction acceptance | Keep Form and Action distinct from shared handler prose; record State Indicator split pressure. |
| [W1 protocol](../../experiments/w1/protocol.yml) | run and freeze policy | Freeze before run, repeat twice, compare, promotion false. |
| [W1 schema](../../experiments/w1/result.schema.yml) | machine contract | Validate all four normalized records. |
| [Hypothesis matrix](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) | DS-D1.18/.20/.21/.25 | Use frozen hypotheses, neighbors, shortcuts, and correction routes. |
| [Experiment plan](../../EXPERIMENTS.md) | E1-E4 thresholds | Test structure, malformed/neighbor discrimination, graph support, and portability. |
| [UI11 findings](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md) | formation-deferred status | Treat candidate notes as non-authoritative pressure only. |
| [UI11 attacks](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md) | collapse attacks/final positions | Preserve Form strength, Action signature gap, and State Indicator meaning conflict. |
| [DS-D8 relationships](../../../../definitions/relationships/relationships.yml) | derives/displays/shapes/submits/contracts/reflects | Exercise active signatures and seeded reversals as supporting-only evidence. |
| [SPEC](../../SPEC.md) | outcomes and artifact contract | Keep outcomes provisional and authority unchanged. |
| [UIF-004 receipt](../SWU-UIF-004/TASK-SESSION-RESULT-COMPLETE.md) | W1 harness proof | Reuse the validated sibling contract without shared edits. |

## Coverage

- Sources: 11.
- Selector groups: 19.
- Dependency, criteria, attacks, graph signatures, write scope, acceptance,
  schema, validation, authority, and synchronization: covered.
- Runtime: local fallback; no subagent dispatch requested.
- Strict delegated coverage: n/a.

## Decisions And Assumptions

- View Model and Form: preregister schema-ready pressure if their narrowed
  structural laws survive neighbors.
- Action: preregister schema-ready pressure from intent/target/outcome
  structure, but keep the absent Action-source DS-D8 signature as residue.
- State Indicator: test the domain-state visual mapping branch and preregister
  `split-candidate` because async request state is a different structure.
- Adapted two-style fixtures are method evidence, not independent replication.

## Write Scope

- `experiments/w1/lanes/data-interaction/`
- `experiments/w1/results/data-interaction/`
- UIF-005 receipt and required status synchronization

## Gate Result

- Dependencies, shared contract, source coverage, and disjoint scope: pass.
- Consequential lane mutation: permitted.
