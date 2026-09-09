# CAV2 TOP-03 Shared-Syntax Owner Acceptance Receipt

Status: accepted
Decision timestamp: 2026-08-22T13:11:19Z
Owner: repository owner (Boscaro), acting as CyberAlchemy v2 authority owner
Owner namespace: `cyberalchemy-v2`
Owner ID: `authority-spine`
Route: `decision-gate`
Proposed decision ID: `CAV2-TOP03-OWNER-ADOPTION-001`
Selected option: `CAV2-ACCEPT-TOP03`

## Decision

The CAV2 authority owner accepts ownership and maintenance of the exact
versioned structural address syntax identified below and adopts that version
for CAV2-local proof and obligation addresses.

This acceptance is syntax-only. It does not accept or control DomainSpec
meaning, either owner's record kinds or relations, lifecycle or currentness,
obligation state or discharge, proof truth, evaluation semantics, authority
kinds, promotion, attestation, classification, audience, publication, or
another owner's adoption.

## Exact Bindings

```yaml
decision_status: accepted
decision_timestamp: 2026-08-22T13:11:19Z
decision_owner_namespace: cyberalchemy-v2
decision_owner_id: authority-spine
candidate_binding:
  path: cyberAlchemy-v2/authority/decisions/2026-08-22-top03-shared-syntax-owner-adoption.md
  digest:
    algorithm: sha256
    value: a541c2a4f3a48f70f1da9f270ba8d6dc9eb9fd9d8b60d15d0ec7206171712f5b
owner_route_binding:
  owner_namespace: cyberalchemy-v2
  id: authority-promotion-lifecycle
  version: CAV2-D48-active-2026-08-22
  source_path: cyberAlchemy-v2/authority/definitions/DEFINITIONS.md
  selector: "## CAV2-D48: Authority Promotion Lifecycle"
  digest_scope: selector-scoped-raw-bytes
  digest:
    algorithm: sha256
    value: 9f506f056ea7f13f7d1d11898596ac52dcadafa2afb35e5c8dde394d3e860f36
syntax_binding:
  owner_namespace: cyberalchemy-v2
  id: proof-obligation-address-envelope
  version: 1.0.0
  source_path: cyberAlchemy-v2/authority/schemas/proof-obligation-address-envelope.v1.schema.json
  schema_uri: urn:cav2:proof-obligation-address-envelope:1.0.0
  digest:
    algorithm: sha256
    value: a3363314bc5c51a4ef5db559393553e41a9d43b43e3037442267fd9da7e3a078
accepted_owner_scope: syntax-only-structural-address-envelope
accepted_consumer_scope: cav2-local-addressing-only
authority_effect: accepted-for-exact-syntax-version
adoption_effect: accepted-for-cav2-local-addressing
publication_effect: none
```

## Exact Claim Ceiling

CAV2 syntax ownership covers only schema identity and version, owner-scoped
identity, digest syntax, owner-qualified references, source bindings, typed
references, and the structural presence of an owner-local assertion-limit
reference.

It does not own or decide DomainSpec meaning; either owner's record kinds or
relations; lifecycle or currentness; obligation state or discharge; proof
truth; evaluation semantics; authority kinds; promotion; attestation;
classification; audience; publication; or another owner's adoption.

Schema conformance establishes structural conformance only.

## Decision Evidence

- Owner source: direct user selection `1` in the CAV2 authority-owner gate.
- Admissibility receipt:
  `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/development/refinement-runs/20260821T145409Z-proof-substrate-next-steps/stages/10-gate-01-top03-refresh/apply-corrected/owner-decisions/cav2-option-admissibility-receipt.json`
  at SHA-256
  `cc9f4a476d140e4ea398e41b60c8e907c425bad86828ff6bf99a6faa8a7a8b4e`.
- Independent audit:
  `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/development/refinement-runs/20260821T145409Z-proof-substrate-next-steps/stages/10-gate-01-top03-refresh/apply-corrected/independent-audit/AUDIT-RECEIPT.md`
  at SHA-256
  `c2bac876e1c0a13784eba3facf40579e2062982d2dc4fb6ac64d98b1053c5217`.
- Rationale: the owner selected the audited exact-byte acceptance option; no
  additional rationale was supplied.

## Residue And Expiration

- DomainSpec has not accepted or adopted this syntax.
- GATE-01 has not ratified TOP-03.
- TOP-03 remains unavailable unless DomainSpec independently accepts the same
  syntax version and digest.
- Rejection or non-adoption by DomainSpec activates the TOP-02 fallback.
- This receipt has no scheduled expiration. It becomes invalid for routing if
  the candidate, schema version, schema bytes, schema digest, owner-route
  selector, claim ceiling, or accepted scope changes.
- This receipt does not authorize publication, Git staging, commit, push,
  promotion, release, deployment, or production use.

## Remaining Decision

The DomainSpec owner must independently accept, reject, or defer
`DOMAINSPEC-TOP03-ADOPTION-001`. This CAV2 decision does not imply that result.
