# Glossary — BMC-REL-001 Constraint Completion Define

Glossary links are candidate-local projections over exact sources. `linked` means the term is governed directly by the cited source; `partial` means this package uses an evidence-bounded working label whose remaining representation or implementation is unresolved; `no-match` means no governed term is claimed.

| Term | Meaning in this candidate | Link status | Evidence or rationale |
| --- | --- | --- | --- |
| Relationship Signature Authority | The active typed endpoint, scope, multiplicity-token, lifecycle, and optional generated-projection tuple. | `linked` | `projects/domainspec-v2/definitions/DEFINITIONS.md#ds-d8` and `relationships.yml` |
| Canonical Single Responsibility | One responsibility has one canonical owner and one proposition is authored once; generated projections retain provenance. | `linked` | `projects/domainspec-v2/definitions/DEFINITIONS.md#domainspec-v2-d27` |
| Ownership Dimension | One exact active ID in the D29 registry: `lifecycle`, `custody`, or `write-responsibility`. | `linked` | D29 and exact ownership-dimensions registry |
| Membership Kind | One exact active ID in the D30 registry: `classification` or `home-assignment`. | `linked` | D30 and exact membership-kinds registry |
| Constraint profile | A future machine-readable bundle of independently owned relationship-constraint axes under D01. | `partial` | D01 fixes architecture; remaining axis values and representation are not all resolved |
| Concept degree | Count of distinct canonical adjacent concepts on a relationship axis. | `partial` | D03-D05 fix specific count distinctions, not all bounds or evaluator representation |
| Declared step count | Count of distinct Operation-bound Workflow `step_id` declarations, independent from concept degree and runtime retries. | `partial` | D04 fixed source contract |
| Declared role count | Count of distinct Mapping-role assignment identities, independent from endpoint concept degree. | `partial` | D05 fixed source contract; identity, vocabulary, and storage remain unresolved |
| Typed fact qualifier | Candidate label for the future per-fact binding to one admitted ownership dimension or membership kind. | `partial` | D06/D07 typed packet objects bind policy and registry only; per-fact representation is unresolved |
| Runtime cardinality | Relationship occurrence or multiplicity measured in runtime behavior rather than the concept graph. | `no-match` | exact semantics remain unresolved and no new definition is claimed |
| Partial-view behavior | Evaluator behavior when the observed relationship graph lacks sufficient closure evidence. | `partial` | D02 fixes directional minimum-evaluation rules; remaining per-facet behavior is unresolved |
| Approval closure | Exact artifact paths and SHA-256 values presented for owner approval before Design. | `partial` | local candidate governance record, not canonical vocabulary |

## Non-Collapse Rules

- Compatibility multiplicity tokens do not supply numeric bounds.
- Canonical concept degree, declared step count, declared role count, and runtime cardinality are separate axes.
- `belongs-to` is independent from `owns` and is not `owns^-1`.
- `owned-by` remains a generated view.
- `Operation --[produces]--> Event` and `Entity --[emits]--> Event` retain distinct endpoint provenance; D08 adds no cross-row constraint.
- Candidate glossary terms do not self-promote into Definitions or another registry.
