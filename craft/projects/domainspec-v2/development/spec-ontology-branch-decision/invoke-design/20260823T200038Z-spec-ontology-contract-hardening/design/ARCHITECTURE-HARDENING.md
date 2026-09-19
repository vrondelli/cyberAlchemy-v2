# Specification-Ontology Contract Hardening

Status: `design-candidate-authored`; protected owner and verifier admission pending

Authority, implementation, migration, promotion, publication, release, and
deployment effect: `none`

## Intent

Keep the prior architecture unchanged: Specification remains a first-class
branch of one connected logical ontology, with business meaning, formal claims
and composition, proof obligations, and system evidence in separately owned
catalogs. This hardening adds an exact admission envelope around that design:
separate role assignments for Rondelli, an independent structural-verifier role
for Victor Boscaro, per-package verification levels, non-bypassable risk floors,
and exact future response and receipt schemas.

The same person may hold many primary roles, but the roles do not merge. A
formal-claims decision cannot stand in for a business-fidelity decision, a
projection decision cannot promote source meaning, and a promotion decision
cannot rewrite the ontology protocol. Victor is a different principal and may
block structurally inadmissible evidence only; he has no semantic veto.

## View 1 — Context and actors

```text
Rondelli, through separately admitted exact roles
  |-- business meaning
  |-- formal claim meaning and specification composition
  |-- proof/validation, lifecycle, projection, privacy/publication
  `-- aggregate, promotion, and authority-model decisions

Victor Boscaro, through one separately admitted verifier role
  |-- V1: owns exact policy; future checker applies it
  `-- V2: directly verifies exact high-impact packages

Neither principal is admitted by this Design candidate.
```

Repository-local L1 receipts are the selected candidate assurance posture.
External L2 identity and `V3-externally-attested` remain unavailable until a
separate gate admits them.

## View 2 — High-level structure

```text
prior four owner-local ontology catalogs
                  |
          exact Design contract bytes
                  |
       frozen owner-admission package
          /                       \
11 Rondelli role-scoped requests   verification-level assignments
          \                       /
        owner responses over identical frozen bytes
                  |
      V1 policy checker OR V2 direct Victor receipt
                  |
    structural join (future; currently blocked)
                  |
  later lifecycle admission by its separate owner
```

The package manifest is the boundary object. It lists exact artifact bytes,
source decisions, scopes, non-scopes, required verification levels, and the
invalidation rule. It does not grant authority.

### Three-layer digest contract

Every future manifest, owner response, and verification receipt repeats the
same three required method identifiers; an absent, unknown, or mismatched
method is structurally inadmissible.

1. `sha256-raw-file-bytes-v1` hashes the exact regular-file byte sequence at
   each bound path relative to the package root. Symlinks are forbidden and
   the result is lowercase 64-character hexadecimal.
2. `sha256-rfc8785-acceptance-artifact-path-digest-set-v1` sorts
   `acceptance_bound_artifacts` ascending by Unicode code-point path, projects
   only `{path, sha256}`, RFC 8785 JCS serializes the array as UTF-8 with no
   trailing line feed, then applies SHA-256 with lowercase hexadecimal output.
3. `sha256-rfc8785-manifest-without-manifest-digest-v1` removes only the
   top-level `manifest_digest`, RFC 8785 JCS serializes the entire remaining
   manifest object—including the method field itself—as UTF-8 with no trailing
   line feed, then applies SHA-256 with lowercase hexadecimal output.

These methods identify evidence bytes only. They add no semantic or lifecycle
authority.

## View 3 — Low-level components

| Component | Exact responsibility | Current state |
| --- | --- | --- |
| Role-assignment contract | Binds one principal, one role, exact scope/non-scope, assurance posture, and supersession | candidate, unadmitted |
| Verification-level contract | Binds each OAR slice to owner-selected level at or above its floor | candidate, unadmitted |
| V1 verifier policy | Limits checker evaluation to identity, roles, hashes, scope, currentness, and ceilings | candidate, Victor acceptance pending |
| V1 checker contract | Requires deterministic, fail-closed, first-failure-preserving execution | planned, unimplemented, unexecuted |
| V1/V2 receipt contract | Binds exact identity, role, package, scope, ceiling, producer, and result | candidate schema; no receipt issued |
| Owner-response contract | Binds Rondelli's exact role-scoped decision and authentication evidence | candidate schema; no response issued |
| Package manifest | Freezes all acceptance-bound bytes and OAR slices | created only after all bound hashes are computed |

The role topology contains sixteen distinct primary roles proposed for Rondelli
and one verifier role proposed for Victor. Distinct records preserve meaning
and authority even when the same principal appears repeatedly.

## View 4 — Workflow process

1. Author Design candidate contracts and planned witnesses.
2. Validate their JSON shape, closed scope, deterministic selection, digests,
   path boundary, symlink safety, and whitespace.
3. Freeze the exact package manifest. Any later bound-byte, role, scope,
   verification-level, policy, or ceiling change creates a superseding package.
4. Present each OAR slice to Rondelli acting through that exact proposed role.
5. Obtain Victor's direct authentication and acceptance of the verifier role,
   the V1 policy, and the V2 receipt contract.
6. For ordinary protected slices, a future implemented checker applies the
   accepted Victor-owned policy and issues V1 receipts.
7. For high-impact slices, Victor directly verifies the exact package and
   issues V2 receipts.
8. Join exact current owner responses and required verification receipts.
9. Only the separately governed lifecycle owner may decide later admission.

Steps 4–9 have not occurred.

## View 5 — Decision and state flow

```text
draft candidate --Design validation--> frozen candidate
       |                                  |
       | any bound change                 | exact owner response missing
       v                                  v
superseding package                 blocked-owner-response
                                          |
                         required V1/V2 verification missing
                                          v
                                  blocked-verification
                                          |
                     all exact current receipts structurally pass
                                          v
                           eligible-for-separate-admission-decision
```

`V0-draft-precheck` never creates admission eligibility. OAR-02–06 and OAR-10
have a V1 floor. OAR-01, OAR-07–09, and OAR-11 have a V2 floor. Rondelli may
raise a level before freeze but may not lower it below the floor. Any post-freeze
change restarts response and verification over a new package.

## View 6 — Dependencies and interfaces

| Producer | Consumer | Interface | Forbidden coupling |
| --- | --- | --- | --- |
| Prior Design | hardening package | exact prior architecture/contract digests | reopening selected semantics by implication |
| Rondelli role assignment | OAR request/response | exact role, scope, non-scope, package digest | one role accepting another role's meaning |
| Victor policy | future V1 checker | exact policy and checker digests | checker inventing policy or semantic judgment |
| Victor direct response | V2 receipt | exact package, identity, role, hashes, scope, currentness, ceiling | semantic approval or veto |
| Package manifest | every response/receipt | identical package content and manifest digests | stretching receipts over changed bytes |
| Structural verifier result | lifecycle owner | `pass` or `block` with exact diagnostics | verification becoming admission, discharge, promotion, or publication |

Canonical ontology catalogs and semantic contracts never depend on generated
projections or verification receipts for their meaning. Receipts establish only
their declared evidence or decision scope.

## Deterministic example

Suppose OAR-03 covers an exact `FormalClaim` contract slice. Rondelli assigns
`V1-policy-verified`, the hazard floor. Rondelli's future owner response must
bind the frozen package digest, the formal-claims role assignment, exact JSON
pointers, and the formal-claims non-scope. A future checker may pass only after
the accepted Victor-owned policy confirms those structural bindings. That pass
does not say the formal claim is true; it only says the response is structurally
admissible.

For OAR-07, the floor is V2. Victor must directly inspect and bind the exact
ontology-protocol/relationship package. A structurally clean V2 receipt still
does not accept the relationship meanings; Rondelli's separate role-scoped
response is the semantic decision.

## Architecture continuity and evidence ceiling

The prior six-view architecture, four branches, two semantic forward
relationships, two-key correspondence, derivation manifest, owner-local
validators, fail-closed aggregate, and non-authoritative projections remain
unchanged. This hardening does not materialize canonical ontology schemas or
modify any owner catalog.

The Design evidence ceiling is contract shape, scope closure, deterministic
selection, and locally validated candidate consistency. It does not establish
principal admission, owner acceptance, Victor acceptance, checker existence,
checker execution, V1/V2 receipt issuance, semantic truth, Plan readiness,
migration safety, promotion, or publication.
