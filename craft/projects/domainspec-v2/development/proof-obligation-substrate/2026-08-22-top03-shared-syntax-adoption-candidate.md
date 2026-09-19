# DomainSpec v2 TOP-03 Shared-Syntax Adoption Candidate

Status: unexecuted replacement candidate
Decision status: pending DomainSpec v2 owner decision
Authority effect: none
Adoption effect: none
Publication effect: none

## Candidate Decision

The proposed decision is for DomainSpec v2 to adopt the exact CAV2-owned
structural address syntax below for references that cross the DomainSpec/CAV2
boundary. This file is a candidate for owner review, not an approval. DomainSpec
v2 keeps all DomainSpec meanings, record kinds, relations, evaluation inputs,
obligation lifecycle, and discharge decisions.

The stable cross-project owner namespace remains `domainspec`. The authoritative
DomainSpec source and all future proof-substrate work move to
`projects/domainspec-v2/`; frozen v1 material under `implementation/domainspec/`
may be cited only as historical evidence.

```yaml
proposed_decision_id: DOMAINSPEC-V2-TOP03-ADOPTION-002
decision_status: pending-owner-decision
decision_owner_namespace: domainspec
decision_owner_id: domainspec-v2-owner
owner_route_binding:
  owner_namespace: domainspec
  id: domainspec-v2-authority-model
  version: worktree-2026-08-22
  digest_scope: full-file-raw-bytes
  digest:
    algorithm: sha256
    value: a6080927d265c2064792acca788548dbdea2497e767d822730b7d616e663f073
  source_path: projects/domainspec-v2/authority/AUTHORITY-MODEL.md
  selector: "# Authority Model"
syntax_binding:
  owner_namespace: cyberalchemy-v2
  id: proof-obligation-address-envelope
  version: 1.0.0
  digest:
    algorithm: sha256
    value: a3363314bc5c51a4ef5db559393553e41a9d43b43e3037442267fd9da7e3a078
  source_path: cyberAlchemy-v2/authority/schemas/proof-obligation-address-envelope.v1.schema.json
  schema_uri: urn:cav2:proof-obligation-address-envelope:1.0.0
proposed_adoption_scope: cross-project-structural-addressing-only
authority_effect: none
adoption_effect: none
```

## Exact Claim Ceiling

If accepted through a separate DomainSpec v2 owner receipt, DomainSpec v2
adoption would accept only the exact syntax version and structural checks named
above. It would not transfer DomainSpec meaning or lifecycle authority to CAV2;
grant CAV2 ownership of DomainSpec records; resolve an obligation; establish
proof truth; validate an evaluator; promote authority; attest identity or truth;
classify material; choose an audience; authorize publication; or imply CAV2's
separate adoption.

Schema conformance would establish structural conformance only.

## Source-Of-Truth Migration

This candidate replaces the misplaced v1 candidate at
`implementation/domainspec/development/proof-obligation-substrate/2026-08-22-top03-shared-syntax-adoption-candidate.md`
only after a fresh DomainSpec v2 owner receipt accepts these exact bytes and a
new GATE-01 decision binds that receipt.

The old v1 candidate and acceptance receipt remain historical evidence until
that replacement completes. They must not be consulted as current DomainSpec
authority. Their previous exact acceptance cannot be transferred to this file
because its path, owner route, and bytes changed.

## Required Owner Act

The DomainSpec v2 owner must issue a separate acceptance or rejection receipt
that names:

- `proposed_decision_id`;
- this candidate's exact path and SHA-256;
- the exact DomainSpec v2 owner-route path and SHA-256;
- the exact syntax owner, version, source path, schema URI, and SHA-256 above;
- this exact claim ceiling;
- acceptance or rejection;
- the decision timestamp and owner identity; and
- any residue or expiration condition.

Until that receipt exists, this candidate has no adoption effect. Any changed
candidate, authority-model, or syntax byte requires a new digest, version
review, and fresh owner acts.

## TOP-02 Fail-Closed State

The previous GATE-01 TOP-03 ratification bound the frozen v1 candidate and
acceptance paths. Because DomainSpec v2 is now the required source of truth,
TOP-03 routing must be treated as stale and fail closed to TOP-02 until a fresh
DomainSpec v2 acceptance and GATE-01 ratification bind this replacement.
