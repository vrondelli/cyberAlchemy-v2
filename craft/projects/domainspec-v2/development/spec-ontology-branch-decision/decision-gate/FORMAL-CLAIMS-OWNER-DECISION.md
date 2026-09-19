# Formal-Claims Authority Home Decision

Status: option selected; exact role contract and owner admission pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent selection: `A-one-semantic-graph-owned-branches`
Decision ID: `DEC-DSV2-FORMAL-CLAIMS-AUTHORITY-001`

## Recorded selection

- Selected option: `A-role-under-primary-source-authority`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T17:42:11+01:00`
- Rationale: preserve formal-claim meaning under existing primary-source
  authority through an explicit per-claim owner role instead of adding a new
  governance kind without evidence that independent promotion or veto powers
  are required.
- Decision effect: owner-home design selected only.
- Authority effect: none until the DomainSpec v2 authority-model owner and
  primary-source route accept an exact role contract.

## Decision question

Where should the authority to own exact formal-claim meaning live?

## Why this blocks branch design

The selected architecture requires every formal claim to have an owner, but the
current authority model names primary-source authority and validation,
layering, and drift governance without naming a standalone formal-claims kind.
Assigning claim semantics to validation or ontology protocol by convenience
would collapse distinct authority.

## Options

### A — Explicit role under primary-source authority (recommended)

Define `formal-claims-owner` as an owner role carried by each formal claim under
the existing primary-source authority. The role owns the exact formal statement,
its source-meaning correspondence, version, challenge response, and semantic
supersession. The specification-composition owner, ontology-protocol owner,
validation-governance, and proof/evidence owner remain separately bounded.

Benefit: smallest authority change and consistent with the current rule that
the primary source owns what the domain/spec says about itself. Cost/risk: the
role contract must be explicit enough that composition or validation owners
cannot act as de facto claim owners. Choose it unless evidence shows that formal
claims need a repository-wide promotion or veto function independent of their
primary sources.

### B — New standalone formal-claims authority kind

Add and ratify a new local authority kind with its own owner route, source
posture, promotion movement, default-deny rules, integrity evidence, and
cross-governance boundaries.

Benefit: gives formal claims an unmistakable independent authority and lifecycle.
Cost/risk: adds a new governance surface and migration burden before evidence
shows that an owner role is insufficient. Choose it only if formal claims need
independent promotion, veto, or cross-source arbitration that primary-source
authority cannot safely express.

### C — Defer

Keep architecture A as a recorded preference, but hold all branch-contract and
implementation design until the authority home is decided.

### D — Stop

Preserve architecture A as a non-executed decision record and stop this design
route without creating a formal-claims authority home.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for owner-home selection; parent design gate remains `BLOCK`
- Selected option: `A-role-under-primary-source-authority`
- Remaining local blocker: exact role contract and protected owner admission
- Protected owner admission: pending
- Consequential product bytes changed: 0
- Decision source: direct user selection recorded above
- Override: not requested
