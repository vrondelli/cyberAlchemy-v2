# Formalization Correspondence Acceptance Decision

Status: acceptance model selected; exact owner receipts pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Formal-claims home: `A-role-under-primary-source-authority`
Formal-clause branch: `A-formal-claims-specification-branch`
Correspondence shape: `A-formal-claim-formalizes-business-meaning`
Decision ID: `DEC-DSV2-CORRESPONDENCE-ACCEPTANCE-001`

## Recorded selection

- Selected option: `A-exact-two-key-endpoint-owner-acceptance`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:30:30+01:00`
- Formal-claims key: the formal-claims owner authors and accepts the exact
  formalization assertion and remains owner of that assertion.
- Business key: the business source owner independently accepts only the
  fidelity of the exact assertion to the bound business meaning.
- Exact binding: both receipts must identify the same relation bytes, endpoint
  IDs, endpoint versions/digests, scope, declared loss, and claim ceiling.
- Structural and promotion boundary: relationship governance may validate
  record shape; the existing promotion lifecycle may admit only exact bytes
  covered by both current receipts. Neither route decides endpoint meaning.
- Decision effect: acceptance-model design selected only. No relation instance,
  owner receipt, authority admission, or promotion is created by this record.

## Decision question

How should one exact `FormalClaim --formalizes--> BusinessMeaning` relation
become accepted and eligible for promotion without collapsing the formal-claim
owner into the business-meaning owner?

## Invariant already fixed

The formal-claims owner owns and authors the exact formal claim and its
formalization assertion. The business source owner owns the referenced business
meaning. The ontology-protocol and relationship owners may validate record and
edge shape but cannot decide either endpoint's meaning. Acceptance of a
correspondence does not prove the formal claim, discharge an obligation, or
transfer authority between endpoints.

## Options

### A — Exact two-key endpoint-owner acceptance (recommended)

The formal-claims owner authors and accepts the exact relation assertion. The
business source owner independently accepts only that this exact claim is a
faithful formalization of the bound business meaning. Both receipts bind the
same relation bytes, endpoint IDs, endpoint versions/digests, scope, known loss,
and claim ceiling. The relationship owner validates structural conformance, and
the existing promotion lifecycle admits only the exact jointly accepted record.

Benefit: preserves the formal-claims owner while giving the business owner a
narrow fidelity key; neither owner gains the other's authority. Cost/risk:
requires coordination and can deadlock when the owners disagree. Choose it when
cross-branch `accepted` must mean explicit assent from both semantic endpoints.

### B — Formal-owner scoped assertion; no cross-branch accepted state

The formal-claims owner may accept and publish the relation only as a
formal-branch assertion. The business owner may accept, reject, or leave it
unreviewed, but until an explicit business-owner receipt exists the relation is
never described as an accepted cross-branch correspondence and cannot be used
as business-authoritative input.

Benefit: lets formal work proceed without treating business-owner silence as
assent. Cost/risk: downstream consumers must understand qualified assertion
states, and a globally accepted correspondence may never exist. Choose it when
independent progress matters more than a shared acceptance state.

### C — Exact endpoint acceptance plus independent validation key

Use the same two semantic owner keys as A, then require validation-governance
to verify the bound evidence, endpoint currency, declared loss, and receipt
consistency before promotion. Validation may reject malformed or stale evidence
but cannot decide either endpoint's meaning or rewrite the relation.

Benefit: adds independent evidence assurance without creating another semantic
owner. Cost/risk: a third key increases latency and may duplicate deterministic
checks already owned by the relationship and promotion routes. Choose it when
correspondence failure is costly enough to justify a mandatory independent
validation receipt.

### D — Defer

Keep the four prior selections recorded and leave every correspondence record
candidate-only.

### E — Stop

Preserve the selected architecture and relation shape as non-executed decisions
and stop this design route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for acceptance-model selection; parent route remains `BLOCK`
- Selected option: `A-exact-two-key-endpoint-owner-acceptance`
- Remaining local blocker: exact owner receipt schemas and protected admission
- Next parent blocker: proof-obligation branch home
- Protected owner admission: formal-claims, business source, relationship, and
  promotion-lifecycle owners must accept the exact contract
- Consequential product bytes changed: 0
- Override: not requested
