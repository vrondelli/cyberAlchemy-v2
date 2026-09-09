# Shared Context: Artifact Admission Validator

## Authority Sources

- [CAV2-C18 Artifact Admission Before Mutation](../../../../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c18-artifact-admission-before-mutation)
- [CAV2-C7 Navigable Work Surface](../../../../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c7-navigable-work-surface)
- [CAV2-C14 Governed Artifact Tree Interface](../../../../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c14-governed-artifact-tree-interface)
- [Artifact Tree Admission discipline](../../../../../disciplines/cards/artifact-tree-admission.md)
- [CAV2-D42 Governed Artifact Tree](../../../../../authority/definitions/DEFINITIONS.md#cav2-d42-governed-artifact-tree)
- [CAV2-D51 Canonical Artifact](../../../../../authority/definitions/DEFINITIONS.md#cav2-d51-canonical-artifact)
- [CAV2-D52 Artifact Durability](../../../../../authority/definitions/DEFINITIONS.md#cav2-d52-artifact-durability)
- [Canonical Kinds](../../../../../ontology/canonical-kinds/CANONICAL-KINDS.md)

## Implementation Posture

- Python 3 standard library; JSON records and receipts.
- One strict Markdown table reader isolates the current Canonical Kinds source shape.
- No generated projection becomes authority.
- Pre phase validates a planned path without requiring it to exist.
- Post phase validates target existence, parent entrypoint linkage, and selected C7/C14 obligations.
- Verdict precedence: tool/input error is separate; policy verdicts order `block > defer > flag > pass`.
- Exit codes: `0 pass`, `1 block`, `2 tool/input error`, `3 flag`, `4 defer`.

## Runtime Boundary

Task Session selects one SWU. Context Builder may excerpt these anchors at runtime,
but Invoke does not pre-generate a context pack.
