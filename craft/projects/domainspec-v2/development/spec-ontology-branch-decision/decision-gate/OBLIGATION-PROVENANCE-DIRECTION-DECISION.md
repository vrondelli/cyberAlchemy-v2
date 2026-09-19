# Obligation Provenance Direction Decision

Status: canonical direction selected; exact provenance bindings pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Formal-claims home: `A-role-under-primary-source-authority`
Proof-obligation home: `A-separately-owned-proof-bridge-node`
Decision ID: `DEC-DSV2-OBLIGATION-PROVENANCE-DIRECTION-001`

## Recorded selection

- Selected option: `A-obligation-derived-from-formal-claim`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:42:43+01:00`
- Canonical direction:

  ```text
  ProofObligation --derived_from--> FormalClaim
  ```

- Inverse rule: “FormalClaim derives ProofObligation” is a generated read
  direction only and cannot be declared as another semantic edge.
- Ownership boundary: the proof obligation carries its lineage assertion;
  neither the edge nor the obligation changes the formal claim or transfers its
  ownership to validation-governance.
- Decision effect: provenance topology and direction selected only. No edge,
  derivation, owner admission, or migration is created by this record.

## Decision question

What canonical graph direction should connect a derived proof obligation to the
formal claim from which it was derived?

## Why this is separate from the field contract

Direction determines which node makes the lineage assertion and prevents two
inverse spellings from becoming duplicate semantic edges. After direction is
selected, a separate gate will choose the mandatory source, rule, digest,
receipt, and currency bindings carried by that relation.

## Options

### A — Proof obligation `derived_from` formal claim (recommended)

Use one canonical directed relation:

```text
ProofObligation --derived_from--> FormalClaim
```

The derived node points back to its semantic source. “Formal claim derives
proof obligation” is a generated inverse read direction, not a second edge.

Benefit: the derivative carries its own lineage burden, matching the established
`derives-from` ontology convention and preventing an outgoing claim edge from
looking like formal-claims-owner authorship of validation artifacts. Cost/risk:
the canonical direction runs opposite the authoring pipeline and requires a
clear forward read-model projection. Choose it when semantic dependency and
source traceability are primary.

### B — Formal claim `derives` proof obligation

Use one canonical directed relation:

```text
FormalClaim --derives--> ProofObligation
```

Benefit: follows the natural specification-to-validation pipeline and makes
forward navigation simple. Cost/risk: the source claim appears to assert or own
the derived artifact, and `derives` conflicts with the existing convention that
inverse wording is a read direction rather than a declarable edge. Choose it
only with mechanical non-collapse and inverse-edge rejection.

### C — First-class derivation event node

Create a stable `ObligationDerivation` event or record node that references the
formal claim as input and the proof obligation as output.

Benefit: provides a natural home for multi-input derivations, rule versions,
replay identity, and failed attempts. Cost/risk: adds another node type and two
relations before evidence shows that a metadata-bearing provenance relation
plus immutable derivation receipt is insufficient. Choose it when derivation
runs need an independent graph lifecycle.

### D — Defer

Keep the six prior selections recorded and leave provenance unmaterialized.

### E — Stop

Preserve the selected architecture and branch homes as non-executed decisions
and stop this design route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for direction selection; parent route remains `BLOCK`
- Selected option: `A-obligation-derived-from-formal-claim`
- Remaining local blocker: exact directed relation contract and owner admission
- Next parent blocker: provenance binding profile and currency invalidation
- Protected owner admission: formal-claims, validation-governance,
  proof/evidence, ontology-protocol, and relationship owners must accept the
  exact contract
- Consequential product bytes changed: 0
- Override: not requested
