# Formal-Clause Branch Ownership Decision

Status: option selected; branch migration and owner admission pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Formal-claims home: `A-role-under-primary-source-authority`
Decision ID: `DEC-DSV2-FORMAL-CLAUSE-BRANCH-001`

## Recorded selection

- Selected option: `A-formal-claims-specification-branch`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:18:35+01:00`
- Rationale: align branch membership with the explicit formal-claims owner and
  preserve business meaning separately from its formal representation.
- Decision effect: target branch placement selected only.
- Migration effect: required in a later authorized route; the current
  `business.FormalClause` prototype remains unchanged.
- Authority effect: none until the named business, formal-claims,
  specification-composition, and ontology-protocol owners accept the exact
  branch contract.

## Decision question

Which ontology branch owns formal-clause nodes?

## Why this blocks the branch contract

The current Financial Settlement prototype types `P4` as
`business.FormalClause`, places it in the business lane, and lets the DomainSpec
model contain it through a cross-branch read-model edge. The selected
architecture now distinguishes business meaning from the formal-claims/
specification branch. Continuing without deciding whether the prototype's
placement survives would make ownership implicit.

This decision chooses branch ownership only. The exact correspondence relation
and acceptance handshake between business meaning and formal claims remain a
separate next gate.

## Options

### A — Formal-claims/specification branch (recommended)

Keep business promises and domain concepts in the business branch. Place the
exact formal clause in the formal-claims/specification branch under its explicit
formal-claims owner. A separately selected cross-branch relation will connect
the formal clause to its source business meaning.

Benefit: branch placement matches semantic ownership and prevents business
intent from being confused with one formal encoding. Cost/risk: the current
prototype must migrate `business.FormalClause` and its affected relation
signatures, views, fixtures, and validators. Choose it when the formal statement
has an independently challengeable lifecycle.

### B — Business branch with formal-claims owner role

Keep `business.FormalClause` in the business branch, matching the current
prototype. Attach the explicit formal-claims owner to the node while the
DomainSpec branch continues to contain or classify it through cross-branch
read-model edges.

Benefit: smallest migration and closest to existing witnessed bytes. Cost/risk:
branch membership says “business” while semantic ownership says “formal claim,”
so non-collapse rules and presentation conventions must prevent the formal
encoding from masquerading as raw business intent. Choose it when formal clauses
are considered part of the business source rather than a distinct specification
representation.

### C — Defer

Keep the two prior selections recorded, but hold branch-contract design.

### D — Stop

Preserve the two prior selections as non-executed decisions and stop this design
route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for branch selection; parent design gate remains `BLOCK`
- Selected option: `A-formal-claims-specification-branch`
- Remaining local blocker: exact branch contract, migration, and protected owner admission
- Protected owner admission: pending
- Consequential product bytes changed: 0
- Decision source: direct user selection recorded above
- Override: not requested
