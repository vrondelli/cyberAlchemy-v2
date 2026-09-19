# Proof-Obligation Branch Home Decision

Status: proof-bridge home selected; exact branch contract pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Formal-claims home: `A-role-under-primary-source-authority`
Formal-clause branch: `A-formal-claims-specification-branch`
Correspondence shape: `A-formal-claim-formalizes-business-meaning`
Correspondence acceptance: `A-exact-two-key-endpoint-owner-acceptance`
Decision ID: `DEC-DSV2-PROOF-OBLIGATION-HOME-001`

## Recorded selection

- Selected option: `A-separately-owned-proof-bridge-node`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:35:38+01:00`
- Node contract: every derived proof obligation has stable identity in the
  separately owned proof-bridge branch.
- Ownership boundary: validation-governance owns deterministic derivation and
  obligation identity; the formal-claims owner retains the source claim;
  proof/evidence ownership covers evidence and discharge posture.
- Non-collapse: an obligation is neither authored claim meaning nor proof that
  the claim holds. A passing check does not promote either conclusion.
- Decision effect: node home and ownership shape selected only. No node,
  derivation, discharge, authority admission, or migration is created here.

## Decision question

Where should a proof obligation derived from an accepted formal claim live in
the connected ontology?

## Evidence boundary

The current authority contract says validation-governance owns the deterministic
mapping from a typed specification to required obligations. A derived obligation
is not the source specification and a passing check is not correctness. The
current financial-settlement prototype represents `bridge.ProofObligation` as a
separately owned bridge node and labels it a derived testing artifact, not a
DomainSpec meta-type or a passing proof. That prototype is evidence, not an
architecture decision.

This gate chooses node and branch ownership only. The exact provenance edge,
direction, fields, and derivation algorithm remain the next decision.

## Options

### A — Separately owned proof-bridge node (recommended)

Represent each derived proof obligation as a stable node in the proof-bridge
branch. Validation-governance owns deterministic derivation and obligation
identity; the formal-claims owner continues to own the source claim; the
proof/evidence owner owns evidence and discharge posture. A later gate defines
the exact provenance relation between the obligation and claim.

Benefit: preserves the source-versus-derivative distinction and matches the
current authority contract and witnessed prototype. Cost/risk: navigation from
specification to obligations depends on a cross-branch provenance relation and
currency checks. Choose it when obligations must connect specification to
evidence without becoming part of either authority surface.

### B — Child node inside the formal-claims/specification branch

Represent each proof obligation as a child of its specification or formal claim
inside the formal-claims branch. Validation-governance still derives it, but the
specification composition owns its inclusion and versioning; proof/evidence
remains separate.

Benefit: simple containment and packaging from claim to obligation. Cost/risk:
derived validation artifacts can be mistaken for authored claim meaning, and
composition ownership can become de facto derivation authority. Choose it only
if the branch contract mechanically separates derived children from normative
formal claims.

### C — Authored verification requirement plus derived bridge obligation

Create two distinct node kinds: an optional normative verification requirement
owned by the formal-claims branch, and a derived proof obligation owned by the
proof bridge. A required typed relation connects them without sharing identity.

Benefit: distinguishes what the specification explicitly asks to verify from
what the derivation engine generates. Cost/risk: adds a type, identity mapping,
and synchronization surface that is unnecessary when every obligation can be
derived directly from a formal claim. Choose it when authors must express
verification intent that cannot be recovered from claim semantics alone.

### D — Defer

Keep the five prior selections recorded and leave proof-obligation ownership
unchanged and unpromoted.

### E — Stop

Preserve the selected architecture and correspondence decisions as
non-executed records and stop this design route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for branch-home selection; parent route remains `BLOCK`
- Selected option: `A-separately-owned-proof-bridge-node`
- Remaining local blocker: exact node contract and protected owner admission
- Next parent blocker: canonical claim-to-obligation provenance direction
- Protected owner admission: formal-claims, validation-governance,
  proof/evidence, ontology-protocol, and relationship owners must accept the
  exact contract
- Consequential product bytes changed: 0
- Override: not requested
