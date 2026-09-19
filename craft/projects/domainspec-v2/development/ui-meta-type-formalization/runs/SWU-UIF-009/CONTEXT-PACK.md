---
task_reference: SWU-UIF-009
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-009

## Scope

Prove total rule classification and generated-instance/mutation agreement for
the nine UIF candidate schemas without mutating canonical validators.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Candidate task](../../work-pack/tasks/TASK-UIF-CANDIDATES.md) | SWU-UIF-009 | Inventory rule kinds, reuse existing support, generate/validate/mutate every survivor. |
| [UIF-008 receipt](../SWU-UIF-008/TASK-SESSION-RESULT.md) | nine complete twins | Consume the frozen candidate source and schemas. |
| [Candidate source](../../candidate-meta-types/ui/candidates.json) | criteria and positive attributes | Generate one conforming and one targeted mutated instance per candidate. |
| [Instance tooling](../../../impl/tools/instances.ts) | generate/validate behavior | Reuse the canonical public structural instance path. |
| [Content validator](../../../impl/tools/validate-content.ts) | matching rule semantics | Keep instance and Markdown criteria aligned. |
| [Total rule map](../../../impl/tools/lib/meta-type-noncollapse.ts) | seven rule classes | Confirm all on-disk keywords classify as structure-reading or attestation. |
| [Rule-map tests](../../../impl/tools/tests/validate-meta-types-noncollapse.test.ts) | anti-tautology/totality | Run focused existing tests; do not duplicate shared logic. |
| [Experiment plan](../../EXPERIMENTS.md) | E5 | Generated instance accepts; separating-field mutation rejects. |
| [Formalism findings](../../../meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md) | shape boundary | No semantic inference or private derivation. |

## Coverage

- Sources: 9.
- Selector groups: 17.
- Dependency, rule vocabulary, generator, validator, mutation, test, write
  scope, moat boundary, and synchronization: covered.
- Runtime: local fallback.
- Strict delegated coverage: n/a.

## Decisions And Assumptions

- No new rule kind is required: UI candidates use only existing
  `attribute-present` and `attribute-equals`.
- The existing seven-keyword map is the classification authority; this SWU
  records a projection rather than creating a competing classifier.
- The first criterion key in each candidate source is the targeted separating
  mutation; deleting it must reject.

## Write Scope

- candidate experiment validation/instance paths under `candidate-meta-types/ui/`
- UIF-009 receipt and required status synchronization

## Gate Result

- Dependencies and current rule support: pass.
- Shared validator mutation need: none.
- Instance and validation surfaces: available.
- Consequential harness mutation: permitted.
