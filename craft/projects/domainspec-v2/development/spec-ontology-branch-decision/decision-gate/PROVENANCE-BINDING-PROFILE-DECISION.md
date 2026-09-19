# Obligation Provenance Binding Profile Decision

Status: hybrid binding profile selected; exact schemas pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Parent architecture: `A-one-semantic-graph-owned-branches`
Proof-obligation home: `A-separately-owned-proof-bridge-node`
Provenance direction: `A-obligation-derived-from-formal-claim`
Decision ID: `DEC-DSV2-PROVENANCE-BINDING-PROFILE-001`

## Recorded selection

- Selected option: `A-hybrid-exact-edge-and-context-manifest`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T18:59:50+01:00`
- Edge bindings: relation identity and digest, exact obligation and claim
  endpoints, accepted formalization correspondence and its two owner receipts,
  owner route, authority effect, claim ceiling, lifecycle, supersession, and an
  exact `derivation_context_ref` remain directly inspectable on the edge.
- Manifest bindings: source selector/digest, relationship signature,
  predicate, derivation rule, policy/profile, run/attempt, and immutable
  derivation receipt live in one content-addressed derivation-context manifest.
- Matching rule: the edge and manifest are admitted and checked atomically; a
  missing or mismatched manifest fails closed.
- Currency rule: any bound endpoint, source, correspondence, signature,
  predicate, rule, policy/profile, or receipt change makes the prior provenance
  non-current and requires a new immutable version plus lifecycle event.
- Decision effect: representation and invalidation design selected only. No
  schema, edge, manifest, lifecycle event, or owner admission is created here.

## Decision question

Where should the exact provenance and currentness bindings for
`ProofObligation --derived_from--> FormalClaim` be stored?

## Required information in every admissible option

Every option preserves the same information and fail-closed rule:

- stable owner-qualified relation ID, schema version, record revision, and
  immutable payload digest;
- exact obligation and formal-claim owner namespaces, logical IDs, versions,
  and payload digests;
- exact accepted formalization-correspondence version/digest and both endpoint
  owner-acceptance receipt references/digests;
- exact source locator/selector and source revision/digest;
- relationship-signature revision/digest, predicate revision/digest, and
  derivation-rule identity/version/digest;
- derivation policy/profile version/digest and immutable derivation receipt,
  run, and attempt identity;
- owner route, authority effect, claim ceiling, creation time, and version-exact
  supersession links.

If any bound source, endpoint, correspondence, rule, predicate, policy, or
receipt digest changes, the prior provenance becomes non-current. It is never
edited in place: a new version and lifecycle event are required.

## Options

### A — Hybrid exact edge plus derivation-context manifest (recommended)

Keep relation identity, both exact endpoint bindings, accepted-correspondence
binding, owner route, authority effect, claim ceiling, lifecycle, and an exact
`derivation_context_ref` directly on the edge. Put detailed source selector,
signature, predicate, rule, policy/profile, run/attempt, and derivation-receipt
bindings in one immutable content-addressed context manifest.

Benefit: the edge can establish identity, endpoint currency, and authority
without a second lookup, while repetitive derivation detail remains in one
exact reusable envelope. Cost/risk: validation must check both artifacts and
their matching digest. Choose it when direct semantic auditability and compact
derivation evidence both matter.

### B — Fully inline exact provenance envelope

Store every required field directly on every `derived_from` relation record.

Benefit: one self-contained record can be validated without resolving a
manifest. Cost/risk: repeated rule, predicate, and policy bindings enlarge every
edge; a shared rule change creates wide but legitimate relation-version churn.
Choose it when standalone offline verification matters more than compactness.

### C — Thin edge plus complete content-addressed manifest

Keep only relation identity, endpoint references, and the exact provenance-
manifest reference on the edge. Store all versions, digests, owner routes,
acceptance receipts, lifecycle data, and derivation bindings in the immutable
manifest.

Benefit: smallest edge representation and one reusable proof of context.
Cost/risk: even basic authority and currency inspection requires manifest
resolution; a missing manifest makes the edge uninterpretable. Choose it when
the runtime guarantees local manifest availability and atomic validation.

### D — Defer

Keep the seven prior selections recorded and leave provenance bindings
unmaterialized.

### E — Stop

Preserve the selected ontology branches and relation directions as non-executed
decisions and stop this design route.

## Standing context option

`Explain / more context` does not select an option. It requests aligned low-,
medium-, and complex-example comparisons, after which this same decision will
be presented again.

## Current gate state

- Result: `PASS` for binding-profile selection; parent route remains `BLOCK`
- Selected option: `A-hybrid-exact-edge-and-context-manifest`
- Remaining local blocker: exact edge/manifest schemas and protected admission
- Next parent blocker: canonical semantic inputs versus generated projections
- Protected owner admission: formal-claims, validation-governance,
  proof/evidence, ontology-protocol, relationship, and lifecycle owners must
  accept the exact contract
- Consequential product bytes changed: 0
- Override: not requested
