# TOP-03 Shared-Syntax Ownership And Adoption Candidate

Status: unexecuted candidate template
Decision status: pending CAV2 authority-owner decision
Authority effect: none
Adoption effect: none
Publication effect: none

## Candidate Decision

The proposed decision is for the CAV2 authority spine to own and maintain only
the versioned structural address syntax below, and for CAV2 to adopt that exact
version for CAV2-local proof and obligation addresses. This file records a
candidate decision for owner review; its presence or validation is not an
approval.

```yaml
proposed_decision_id: CAV2-TOP03-OWNER-ADOPTION-001
decision_status: pending-owner-decision
decision_owner_namespace: cyberalchemy-v2
decision_owner_id: authority-spine
owner_route_binding:
  owner_namespace: cyberalchemy-v2
  id: authority-promotion-lifecycle
  version: CAV2-D48-active-2026-08-22
  digest:
    algorithm: sha256
    value: 9f506f056ea7f13f7d1d11898596ac52dcadafa2afb35e5c8dde394d3e860f36
  source_path: cyberAlchemy-v2/authority/definitions/DEFINITIONS.md
  selector: "## CAV2-D48: Authority Promotion Lifecycle"
syntax_binding:
  owner_namespace: cyberalchemy-v2
  id: proof-obligation-address-envelope
  version: 1.0.0
  digest:
    algorithm: sha256
    value: a3363314bc5c51a4ef5db559393553e41a9d43b43e3037442267fd9da7e3a078
  source_path: cyberAlchemy-v2/authority/schemas/proof-obligation-address-envelope.v1.schema.json
  schema_uri: urn:cav2:proof-obligation-address-envelope:1.0.0
proposed_owner_scope: syntax-only-structural-address-envelope
proposed_consumer_scope: cav2-local-addressing-only
authority_effect: none
adoption_effect: none
```

## Exact Claim Ceiling

If accepted through a separate CAV2 owner receipt, CAV2 syntax ownership would
cover only schema identity and version, owner-scoped identity, digest syntax,
owner-qualified references, source bindings, typed references, and the
structural presence of an owner-local assertion-limit reference.

It would not own or decide DomainSpec meaning; either owner's record kinds or
relations; lifecycle or currentness; obligation state or discharge; proof
truth; evaluation semantics; authority kinds; promotion; attestation;
classification; audience; publication; or another owner's adoption.

Schema conformance would establish structural conformance only.

## Required Owner Act

The CAV2 authority owner must issue a separate acceptance or rejection receipt
that names:

- `proposed_decision_id`;
- the exact syntax owner, version, source path, schema URI, and SHA256 above;
- this exact claim ceiling;
- acceptance or rejection;
- the decision timestamp and owner identity; and
- any residue or expiration condition.

Until that receipt exists, this candidate has no authority or adoption effect.
Any changed syntax byte requires a new digest, version review, and fresh owner
acts.

## TOP-02 Fallback

GATE-01 must activate TOP-02—two owner-local catalogs with a derived
cross-reference—if the CAV2 owner rejects or does not accept these exact bytes,
if DomainSpec rejects or does not adopt the same version, if either binding
cannot be made exact, or if either accepted binding later mismatches the bytes.
