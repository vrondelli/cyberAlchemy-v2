---
task_reference: SWU-UIF-004
mode: standard
status: complete
result: ready-after-contract-bridge
created: 2026-07-11
---

# Context Pack: SWU-UIF-004 Resume

## Scope

Run the Page/Layout/Component composition lane under the resolved sibling W1
contract, without changing shared contracts or authority surfaces.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Resolved decision](DECISION-W1-RESULT-CONTRACT.md) | option 1 | Consume the sibling W1 contract and preserve E0. |
| [Bridge receipt](../SWU-UIF-003A/TASK-SESSION-RESULT.md) | contract validation | Freeze lane preregistration before execution. |
| [W1 protocol](../../experiments/w1/protocol.yml) | run policy; lane contract | Run twice, compare configured fields, keep promotion false. |
| [W1 result schema](../../experiments/w1/result.schema.yml) | machine output contract | Emit Page, Layout, and Component records in one normalized shape. |
| [Lane task](../../work-pack/tasks/TASK-UIF-LANES.md) | UIF-004 contract | Produce three results with malformed, neighbor, graph, portability, and correction evidence. |
| [Hypothesis matrix](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) | DS-D1.15..17 | Use the frozen Page/Layout/Component formation hypotheses and routes. |
| [Experiment plan](../../EXPERIMENTS.md) | E1-E4 thresholds | Require constructibility, discrimination, graph support, and two styles. |
| [UI11 findings](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md) | per-type status | Keep every label formation-deferred and treat notes as attacker input. |
| [UI11 attacks](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md) | final positions | Page/Layout survive conditionally; narrow Component with negative fixtures. |
| [DS-D8 relationships](../../../../definitions/relationships/relationships.yml) | renders/wraps/composes/consumes/displays | Exercise active signatures and seeded reversals as supporting-only evidence. |
| [SPEC](../../SPEC.md) | candidate set; artifact contract | No experiment outcome is active or promoted. |

## Coverage

- Sources: 11.
- Selector groups: 18.
- Dependency, hypotheses, attacks, graph signatures, write scope, done criteria,
  machine contract, validation, authority, and synchronization: covered.
- Runtime handoff: none; local fallback because no subagent dispatch was requested.
- Strict delegated coverage: n/a.

## Decisions And Assumptions

- Page: preregister structural separation and `candidate-schema-ready` pressure
  when terminal route/content ownership survives Component/Layout neighbors.
- Layout: preregister structural separation and `candidate-schema-ready`
  pressure when finite slots/shared chrome survive Page/Component neighbors.
- Component: test only the narrow fallback law, not the broad umbrella term;
  preregister `candidate-schema-ready` only if specialized neighbors reroute.
- These are reversible experiment expectations, not authority decisions.
- Corpus is adapted/source-backed, not independent real-world replication.

## Write Scope

- `experiments/w1/lanes/composition/`
- `experiments/w1/results/composition/`
- UIF-004 receipt and required status/traceability synchronization

## Gate Result

- Dependencies and decision: pass.
- Lane manifest/schema coverage: pass.
- Authority and disjoint-write boundaries: pass.
- Consequential lane mutation: permitted.
