---
decision_id: DEC-SGRM-REL-VALIDATION-CYCLE
status: accepted
created: 2026-07-11
target: SWU-SGRM-002
selected_option: minimal-schema-edge-bridge
decision_source: apply-approved-invoke-refresh-instruction
---

# DEC-SGRM-REL-VALIDATION-CYCLE

## Decision Question

How should the removal work-pack break the validation dependency cycle between
root DS-D8 authority and the still-active implementation schema?

## Blocking Evidence

The exact SGRM-002 authority transformation was applied provisionally and
`npm --prefix projects/domainspec-v2/impl run validate:rels` failed:

```text
spec/meta-types/behavioral/saga.schema.yml:21
Saga.source_of does not match root relationship signatures;
expected=[] actual=[orchestrates]
```

SGRM-002 requires that validator to pass but its write scope excludes the
schema. SGRM-004 owns schema deletion but depends on SGRM-002. The authority
edit was rolled back as one unit, and the same validator then returned PASS
with 31 canonical signatures.

## Options

### 1. Minimal schema-edge bridge (recommended)

Amend SGRM-002 to include only
`impl/spec/meta-types/behavioral/saga.schema.yml` and clear its obsolete
`edge_participation.source_of` declaration alongside the root authority change.
SGRM-004 still deletes the schema/card/fixtures after SGRM-003.

- Benefit: smallest reversible repair; existing dependency graph remains.
- Cost/risk: creates a short-lived implementation schema with no root edge
  participation before its planned deletion.
- Choose when: staged migration is acceptable and minimal churn matters.
- Downstream impact: SGRM-002 can satisfy `validate:rels`; no other SWU needs
  resequencing.

### 2. Re-sequence an atomic boundary migration

Run SGRM-003 first, then amend dependencies and combine the authority transition
with the SGRM-004 schema/card/fixture migration so root and implementation
surfaces change together.

- Benefit: avoids a transient orphan schema and gives the cleanest consistency
  boundary.
- Cost/risk: rewrites the work-pack dependency graph and substantially enlarges
  one mutation unit.
- Choose when: atomic cross-layer consistency is more important than keeping the
  current SWU decomposition.
- Downstream impact: SGRM-002 and SGRM-004 contracts, waves, and receipts must be
  revised before execution.

### 3. Permit a staged validation exception

Keep SGRM-002's write scope unchanged, replace its `validate:rels` acceptance
with focused root assertions, and defer the validator pass to SGRM-004.

- Benefit: no scope or dependency changes.
- Cost/risk: knowingly promotes a state that violates the repository's
  root-to-schema consistency validator.
- Choose when: the owner explicitly accepts temporary validator failure.
- Downstream impact: SGRM-002 must be marked FLAG rather than clean PASS, and
  SGRM-004 becomes the mandatory repair gate.

## Recommendation

Select option 1. It fixes the actual contract edge with one narrowly scoped,
reversible edit and retains the existing migration choreography. Option 2 is
cleaner in theory but costs more plan mutation; option 3 weakens the gate that
exposed the problem.

## Selected Option

Option 1, minimal schema-edge bridge.

The owner's chained instruction to refresh the tasks and then run Task Session
is recorded as approval to apply the recommended task repair. This approves one
field-level scope addition to SGRM-002; it does not approve broader schema
mutation or move deletion ownership out of SGRM-004.

## Standing Context Option

`Explain / more context` does not select an option. It requests a deeper account
of the transient states, reversibility, and downstream verification impact.

## Decision State

- selected option: minimal schema-edge bridge
- blocker count: 0
- consequential mutation: may resume through refreshed SGRM-002
- rollback: complete
- remaining active authority: unchanged from the pre-session state
