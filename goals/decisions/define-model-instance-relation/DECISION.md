# Define Model-Instance Relation Decision

Decision ID: `CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-001`

Status: `SELECTED CANDIDATE — relation admission and adoption remain open`

Selected option: `REL-INSTANCE-OF`

Selected relation kind: `instance_of`

Selection source: explicit user choice (`1`) on 2026-08-30

Authority effect: `none`

## Decision Question

Which directed semantic relation should connect
`cav2.define.system-runtime.v1` to the exact `cav2.define` parent-model state
for the first candidate `CAV2-D64` binding?

Package topology is already known: the system ontology is a `child-package`.
That topology is evidence, but it is not the `CAV2-D16` semantic relation and
cannot be promoted into one by proximity.

## Admissible Action Options

### REL-INSTANCE-OF — `instance_of` (recommended)

Benefit: states the minimum model-instance identity directly and leaves
specialization behavior in the separately declared inherited contract and
`extension_scope`.

Cost or risk: it does not by itself say that the instance narrows the parent
contract; that remains a separately checked property.

Choose it when: the primary invariant is that the local ontology is one owned
instance of the exact parent model, while specialization and realization are
additional evidence-bearing relations rather than identity synonyms.

Downstream impact: the candidate relation registry and adoption-decision
envelope can use `instance_of`; no adoption, conformance, or binding follows
until their separate owner records exist.

### REL-SPECIALIZES — `specializes`

Benefit: directly expresses that the local model narrows the shared parent
contract inside the declared extension scope, matching D64's operational
language.

Cost or risk: the repository has no generally admitted `specializes` policy,
and using it as the identity relation may conflate “is an instance” with “has
proved a valid specialization.”

Choose it when: the parent-instance identity should be defined specifically by
contract narrowing, and the product and runtime owners accept the narrower
semantic commitment.

Downstream impact: this slice must define a package-local candidate relation
contract and keep it policy-indeterminate until its owner decision and exact
adoption evidence exist.

## Structurally Rejected Options

- `REL-REALIZES`: rejected for this state because the system profile says
  `implementation_status: not-implemented` and no conformance evidence exists.
- `REL-CHILD-PACKAGE`: rejected as the semantic relation because it describes
  package topology only.

## Non-Action Options

- `DEFER-RELATION`: retain the current open residue and create no semantic
  relation or adoption envelope.
- `STOP-RELATION-WORK`: terminate this line of work without changing the
  current package or binding state.

## Source Basis

- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D16`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D34`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D48`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64`
- `cyberAlchemy-v2/define/profile.json`
- `cyberAlchemy-v2/define/system-ontology/PROFILE.json`
- `cyberAlchemy-v2/goals/bindings/inherited-contracts.json`
- `cyberAlchemy-v2/goals/ontology/goal-view.json`

## Decision Result

`REL-INSTANCE-OF` is selected. This is the narrowest semantic claim: the
system-runtime ontology is a candidate instance of the exact Define parent
state, while specialization, realization, conformance, and adoption remain
separate relations or owner decisions.

The machine-readable decision is [selection.json](selection.json).

## Remaining Blocked Consequential Work

The selection permits one Project-owned `instance_of` relation candidate and an
updated no-effect adoption-decision candidate envelope. It does not permit
relation admission, an owner adoption decision, product-ontology registration
as adopted, conformance, or a concrete RecursiveInstanceBinding.

Selection, whenever made, remains a semantic candidate decision. It does not
adopt the exact parent contract, prove conformance, satisfy D64, authorize a
runtime, or grant any authority or effect.
