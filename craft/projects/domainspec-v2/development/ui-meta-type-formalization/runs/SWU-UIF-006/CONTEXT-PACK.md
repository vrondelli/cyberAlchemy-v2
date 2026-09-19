---
task_reference: SWU-UIF-006
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-006

## Scope

Run the Hook/Guard/Binding/Adapter integration-control lane, preserving E0's
Adapter/Mapping collapse and keeping DS-D8 gaps owner-routed.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Work pack](../../WORK-PACK.md) | SWU-UIF-006 row | Emit four deterministic records in assigned paths. |
| [Lane task](../../work-pack/tasks/TASK-UIF-LANES.md) | integration/control acceptance | Make Hook portability, Binding node/relation, and Adapter/Mapping outcomes adjudicable. |
| [W1 protocol](../../experiments/w1/protocol.yml) | run/freeze policy | Freeze, run twice, compare, and keep promotion false. |
| [W1 schema](../../experiments/w1/result.schema.yml) | output contract | Validate all four records in one shared shape. |
| [Hypothesis matrix](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) | DS-D1.19/.22/.23/.24 | Use frozen criteria pressure, neighbors, and correction routes. |
| [E0 Adapter result](../../experiments/results/e0/final/adapter-mapping.result.yml) | calibrated collapse | W1 Adapter must not manufacture a separator forbidden by E0. |
| [Experiment plan](../../EXPERIMENTS.md) | E1-E4 thresholds | Test constructibility, discrimination, graph support, and portability. |
| [UI11 findings](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md) | formation-deferred status | Keep candidate evidence non-authoritative. |
| [UI11 attacks](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md) | framework/relation/collapse attacks | Neutralize Hook, require explicit Guard/Binding records, preserve Adapter collapse. |
| [DS-D8 relationships](../../../../definitions/relationships/relationships.yml) | consumes/protects/mirrors/fetches/mutates/shapes | Exercise signatures as supporting-only and retain missing-signature requests. |
| [SPEC](../../SPEC.md) | outcomes and boundary | No outcome is active or promoted. |

## Coverage

- Sources: 11.
- Selector groups: 20.
- Dependency, E0 calibration, hypotheses, attacks, graph signatures, write
  scope, acceptance, schema, validation, authority, and synchronization: covered.
- Runtime: local fallback; no subagent dispatch requested.
- Strict delegated coverage: n/a.

## Decisions And Assumptions

- Hook: test a framework-neutral reactive contract; framework names cannot be
  formation witnesses.
- Guard: test a durable non-authoritative gate record; component-target scope
  remains an explicit relationship gap.
- Binding: test an explicit durable endpoint/mapping/cache record against a
  pure edge; a mere connection must reroute to relation-not-node.
- Adapter: preregister structural collapse and `merge-candidate` when Mapping
  satisfies the same transform law.

## Write Scope

- `experiments/w1/lanes/integration-control/`
- `experiments/w1/results/integration-control/`
- UIF-006 receipt and required status synchronization

## Gate Result

- Dependencies, E0 calibration, shared contract, and disjoint scope: pass.
- Consequential lane mutation: permitted.
