# Business Meaning to Formal Claim Correspondence Decision

Status: graph shape selected; owner admission and acceptance policy pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Formal-claims home: `A-role-under-primary-source-authority`
Formal-clause branch: `A-formal-claims-specification-branch`
Decision ID: `DEC-DSV2-BUSINESS-FORMAL-CORRESPONDENCE-001`

## Recorded selection

- Selected option: `A-formal-claim-formalizes-business-meaning`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:21:30+01:00`
- Canonical direction:

  ```text
  FormalClaim --formalizes--> BusinessMeaning
  ```

- Relation contract: one first-class directed record with a stable relation ID,
  exact endpoint IDs and versions/digests, an owner route, evidence,
  `authority_effect`, and a forbidden-collapse rule.
- Inverse wording: a generated read-model view only; it is not a second
  semantic edge.
- Rationale: the formal-claims side makes the formalization assertion and
  carries its evidence burden. Edge existence does not make the business node
  imply acceptance.
- Decision effect: graph shape and canonical direction selected only. No
  relation instance is admitted, accepted, promoted, or migrated by this
  record.

## Decision question

What is the canonical graph shape and direction connecting a business meaning
to the formal claim that represents it?

## Why this blocks the branch contract

After moving formal clauses to the formal-claims/specification branch, the
current same-branch `business.refines_to` relationship can no longer carry the
boundary honestly. The replacement must name both endpoints, one canonical
direction, an owner route, evidence, authority effect, and a forbidden-collapse
rule. This gate chooses the graph shape only. Acceptance and promotion of a
specific correspondence remain a separate next decision.

## Options

### A — Formal claim `formalizes` business meaning (recommended)

Use one first-class, directed relation record:

```text
FormalClaim --formalizes--> BusinessMeaning
```

The formal claim points to the source meaning it claims to formalize. The edge
records its own stable ID, endpoint versions/digests, owner route, evidence,
`authority_effect`, and forbidden collapse. Read models may generate the inverse
phrase “business meaning is formalized by claim,” but that inverse is not a
second semantic edge.

Benefit: the formal-claims side makes the assertion and carries the burden of
evidence; the business node is not made to imply acceptance merely because an
outgoing edge exists. Cost/risk: the canonical edge direction runs opposite the
left-to-right authoring pipeline and needs clear UI phrasing. Choose it when
semantic dependency and challengeability matter most.

### B — Business meaning `formalized_as` formal claim

Use one first-class, directed relation record:

```text
BusinessMeaning --formalized_as--> FormalClaim
```

Benefit: follows the intuitive authoring pipeline and is easy to traverse from
intent to specification. Cost/risk: an outgoing edge from the business source
can be misread as business-owner acceptance before the acceptance gate passes.
Choose it when forward pipeline navigation is more important and that inference
is mechanically forbidden.

### C — First-class correspondence node

Create one separately owned `ClaimCorrespondence` node connected to both the
business meaning and formal claim.

Benefit: provides a natural home for lifecycle, comparison, loss, challenge,
and acceptance state. Cost/risk: adds a node type and two relations before the
evidence shows that a metadata-bearing relation record is insufficient. Choose
it only if correspondence has an independent lifecycle that cannot be safely
carried by an edge plus owner receipts.

### D — Defer

Keep the three prior selections recorded and hold the branch contract.

### E — Stop

Preserve the three selections as non-executed decisions and stop this route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for graph-shape selection; parent route remains `BLOCK`
- Selected option: `A-formal-claim-formalizes-business-meaning`
- Remaining blocker: correspondence acceptance and promotion policy
- Acceptance policy: active in `CORRESPONDENCE-ACCEPTANCE-DECISION.md`
- Protected owner admission: pending
- Consequential product bytes changed: 0
- Override: not requested
