---
task_reference: SWU-UIF-008
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-008

## Scope

Generate complete candidate card/schema/fixture/test twins for exactly the nine
UIF-007 schema-ready labels, using only existing bounded validator rules.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Candidate task](../../work-pack/tasks/TASK-UIF-CANDIDATES.md) | SWU-UIF-008 | Author nine complete twins; no placeholder schemas or shared validator edits. |
| [Machine verdicts](../../adjudication/verdicts.yml) | survivor list | Include exactly nine `candidate-schema-ready` labels; exclude Adapter and State Indicator. |
| [Verdict matrix](../../adjudication/VERDICT-MATRIX.md) | limitations | Preserve narrow laws and all candidate-specific residue. |
| [SPEC](../../SPEC.md) | artifact contract | Card, schema, positive, malformed, neighbor, correction, and black-box test per survivor. |
| [Entity card/schema](../../../impl/spec/meta-types/structural/entity.md) | local twin pattern | Match companion frontmatter, criterion, fixture, distinguisher, edge, and boundary sections. |
| [Mapping card/schema](../../../impl/spec/meta-types/connective/mapping.md) | attribute criterion pattern | Reuse `Attribute | Value` with `attribute-present`/`attribute-equals`. |
| [Content validator](../../../impl/tools/validate-content.ts) | supported rules | Use only existing bounded rules; defer shared changes to UIF-009. |
| [Validator tests](../../../impl/tools/tests/validate-content.test.ts) | black-box behavior | Positive must pass; malformed and neighbor fixtures must reject. |
| [Formalism findings](../../../meta-type-formalization/research/2026-07-02-formalism-and-primitives/findings.md) | structural table walk | Validate shape only; no solver, semantic inference, or private derivation. |
| [Non-collapse findings](../../../meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md) | separating witness | Rule presence alone is insufficient; paired neighbor rejection is mandatory. |
| [Lane fixtures](../../experiments/w1/lanes/) | proven candidate structures | Normalize the preregistered separating fields into candidate attributes. |

## Coverage

- Sources: 11.
- Selector groups: 22.
- Survivor census, artifact contract, card/schema conventions, validator rules,
  fixtures, non-collapse, moat boundary, write scope, and validation: covered.
- Runtime: local fallback; no subagent dispatch requested.
- Strict delegated coverage: n/a.

## Design Decisions

- `candidates.json` is the candidate-package generation source; generated cards,
  schemas, fixtures, and index are deterministic projections.
- Every schema uses the existing `attributes_table_columns` substrate and only
  `attribute-present` / `attribute-equals` rules.
- Positive fixtures satisfy all rules. Malformed fixtures omit a load-bearing
  attribute. Neighbor fixtures declare the candidate type but carry a named
  neighbor's shape and must reject.
- These are candidate artifacts under development, never canonical `impl/spec`
  or DS-D1 definitions.

## Write Scope

- `candidate-meta-types/ui/`
- UIF-008 receipt and required work-pack synchronization

## Gate Result

- Dependency and survivor census: pass.
- Existing-rule coverage: pass; no shared validator mutation required.
- Boundary and disjoint candidate paths: pass.
- Consequential candidate mutation: permitted.
