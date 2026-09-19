# Specification-Ontology Owner Contracts — Unaccepted Candidate

## Contract posture

These contracts are acceptance-ready proposals, not accepted schemas. Their
`authority_effect`, implementation effect, migration effect, promotion effect,
and publication effect are `none`. Every later acceptance must bind the exact
candidate package digest and the accepting owner's existing authority route.

## Shared structural envelope

Every canonical record and reference MUST carry:

```yaml
owner_namespace: string
record_kind: owner-local-enum
logical_id: string
schema_version: semver-or-owner-version
record_version: immutable-owner-version
payload_digest: {algorithm: sha256, value: 64-lowercase-hex}
owner_route_ref: {namespace: string, id: string, version: string, digest: sha256}
lifecycle: {state: owner-local-enum, event_id: string, event_digest: sha256}
supersedes_ref: null-or-exact-owner-qualified-ref
claim_ceiling_ref: exact-owner-qualified-ref
```

The envelope owns structure only. Record kinds, relationship meanings,
lifecycle meanings, discharge, authority kinds, promotion, attestation,
classification, audience, and publication stay owner-local.

Candidate compatibility target: CAV2 structural address schema `1.0.0`, digest
`a3363314bc5c51a4ef5db559393553e41a9d43b43e3037442267fd9da7e3a078`.
DomainSpec adoption of those exact bytes is a separate blocked owner decision.

## Four branch contracts

| Branch | Canonical inputs | Narrowest owners | Required local validation | Forbidden authority expansion |
| --- | --- | --- | --- | --- |
| `business` | `BusinessMeaning`, business-source bindings, `BusinessFidelityAcceptance` | each business/domain source owner | source resolution, payload/currentness, fidelity receipt scope | owning formal claim, obligation, evidence, or projection meaning |
| `formal-claims-specification` | `FormalClaim`, `Specification`, `SpecificationMembership`, `formalizes`, formal assertion receipt | per-claim formal owner plus composition owner for composition-only records | formal statement/schema, exact composition refs, relation and receipt consistency | composition owner editing claim meaning; formal owner editing business meaning |
| `proof-bridge` | `ProofObligation`, `derived_from`, `DerivationContextManifest`, obligation lifecycle refs | validation governance for derivation; named proof/evidence lifecycle owner for discharge posture | derivation, currentness, manifest integrity, lifecycle-input checks | treating an obligation as claim meaning or a test pass as discharge |
| `system-evidence` | producer-owned system artifacts, executions, observations, checker/evaluator receipts | artifact producer, runtime, checker, and evaluator owners | subject/runtime/config/result and receipt integrity | redefining spec meaning, obligation semantics, or lifecycle decision |

A branch is an ownership partition, not an umbrella authority kind. Where two
owners contribute records inside one branch, each record retains its narrowest
owner-qualified identity.

Each branch catalog MUST contain:

- branch ID and catalog owner route;
- catalog schema version/digest;
- lexically ordered exact record refs and canonical relation refs;
- catalog revision, immutable payload digest, predecessor/currentness;
- privacy/classification and allowed consumer scopes;
- a visible statement that generated views are not canonical input.

## Formal-claims owner role

`formal-claims-owner` is an explicit role assignment under existing
primary-source authority, evaluated per claim. It is not a new authority kind.

Required role-assignment bindings:

```yaml
claim_ref: exact FormalClaim owner-qualified ref
primary_source_authority_ref: exact authority route and digest
principal_ref: exact owner identity
role: formal-claims-owner
scope:
  - exact-formal-statement
  - formalization-assertion-authorship
  - claim-versioning
  - challenge-response
  - semantic-supersession
effective_from: timestamp
assignment_digest: sha256
supersedes_assignment_ref: null-or-exact-ref
```

The role MUST NOT own business meaning, specification membership, ontology
protocol, obligation discharge, proof truth, promotion, or publication unless
that same principal separately acts through the corresponding authority route.

## FormalClaim contract

Required fields:

- structural envelope;
- exact formal statement bytes and digest;
- formal language and semantics-profile refs with versions/digests;
- bound business-source selector/ref without copying it as formal authority;
- formal-claims role-assignment ref/digest;
- scope, assumptions, declared loss, and claim ceiling;
- challenge state and exact supersession link;
- creation timestamp and immutable payload digest.

A changed statement, profile, assumption, loss declaration, or bound source
creates a new immutable claim version. Composition never edits these bytes.

## Specification composition contract

A `Specification` is a canonical ontology node in the formal-claims/
specification branch. It MUST bind:

```yaml
specification_ref: exact owner-qualified identity/version/digest
composition_owner_ref: exact owner route/version/digest
composition_policy_ref: exact version/digest
members:
  - membership_id: stable owner-qualified id
    formal_claim_ref: exact version/digest
    position: nonnegative-integer
    inclusion_scope: string
    membership_digest: sha256
catalog_manifest_ref: exact branch catalog revision/digest
claim_ceiling_ref: exact ref
lifecycle_and_supersession: exact versioned event refs
```

Membership ordering MUST be deterministic and positions unique. A membership
may reference only one immutable claim version. Adding, removing, or reordering
a member creates a new specification version. The composition owner can accept
composition only; it cannot rewrite or supersede claim meaning.

## `formalizes` relation contract

Canonical direction:

```text
FormalClaim --formalizes--> BusinessMeaning
```

The formal-claims owner owns and authors the relation. Required fields:

```yaml
relation_id: stable owner-qualified id
relation_kind: formalizes
schema_version: exact
record_revision: immutable
payload_digest: sha256
source_formal_claim_ref: {owner_namespace, logical_id, version, payload_digest}
target_business_meaning_ref: {owner_namespace, logical_id, version, payload_digest}
direction: directed
owner_route_ref: exact formal-claims role assignment
scope: exact assertion scope
declared_loss: explicit string-or-structured-ref
claim_ceiling_ref: exact ref
evidence_refs: exact source and review refs
formal_assertion_acceptance_ref: exact receipt ref/digest
business_fidelity_acceptance_ref: exact receipt ref/digest
currentness: current-or-non-current with checked-at and binding digest
authority_effect: none-until-owner-admitted
lifecycle_and_supersession: exact event and predecessor refs
forbidden_collapse: correspondence-is-not-endpoint-truth-or-authority-transfer
```

No canonical inverse edge may be authored. A reverse read such as “is
formalized by” is generated from this record.

## Exact two-key receipt contracts

Both receipt types MUST bind these identical fields:

- relation ID, schema version, record revision, and payload digest;
- source and target owner namespaces, logical IDs, versions, and payload
  digests;
- exact assertion scope, declared loss, and claim ceiling;
- receipt schema version and immutable receipt digest;
- accepting owner namespace, principal, authority route version/digest;
- decision (`accepted` or `rejected`), decision timestamp, and exact decision
  evidence ref/digest;
- supersession/currentness and invalidation condition.

The `FormalAssertionAcceptance` receipt additionally states:

```yaml
accepted_scope: authorship-and-meaning-of-exact-formalization-assertion
forbidden_scope: business-meaning-ownership-or-proof
```

The `BusinessFidelityAcceptance` receipt additionally states:

```yaml
accepted_scope: fidelity-of-exact-assertion-to-bound-business-meaning
forbidden_scope: formal-statement-authorship-or-proof
```

`formalizes` is dual-key-admissible iff both receipts are current, both say
`accepted`, both bind identical relation and endpoint bytes, and their scopes
remain non-collapsing. Relationship governance validates this condition but
cannot produce either acceptance. Promotion may admit only the exact covered
bytes and cannot infer broader consent.

## ProofObligation contract

A `ProofObligation` is a separately owned node in the proof-bridge branch. It
is neither formal-claim meaning nor proof that its predicate succeeds.

Required fields:

- structural envelope and proof-bridge branch ID;
- obligation kind and exact predicate ref/version/digest;
- expected value derived from the specification, never from implementation;
- exact `derived_from` relation ref/digest;
- derivation-context manifest ref/digest;
- validation-governance owner route ref/digest;
- lifecycle state and immutable lifecycle event refs;
- evidence/discharge-posture ref owned by the proof/evidence lifecycle owner;
- assumptions, applicability scope, claim ceiling, supersession/currentness.

A passing checker or evaluator receipt may become exact evidence input. It MUST
NOT mutate the obligation to discharged. Discharge, reopen, kill, or refusal is
a separate owner-local lifecycle decision.

## `derived_from` relation contract

Canonical direction:

```text
ProofObligation --derived_from--> FormalClaim
```

The relation is owned by `validation-governance`. Required directly
inspectable fields:

```yaml
relation_id: stable owner-qualified id
relation_kind: derived_from
schema_version: exact
record_revision: immutable
payload_digest: sha256
source_obligation_ref: exact owner namespace/id/version/digest
target_formal_claim_ref: exact owner namespace/id/version/digest
accepted_formalizes_ref: exact relation version/digest
formal_assertion_acceptance_ref: exact receipt version/digest
business_fidelity_acceptance_ref: exact receipt version/digest
owner_route_ref: exact validation-governance route
authority_effect: none-until-owner-admitted
claim_ceiling_ref: exact ref
lifecycle_and_supersession: exact event and predecessor refs
derivation_context_ref: immutable content-addressed ref/digest
currentness: current-or-non-current plus complete binding digest
forbidden_collapse: derivation-is-not-claim-meaning-proof-or-discharge
```

Inverse navigation is generated only. No second semantic edge may be authored.

## DerivationContextManifest contract

The manifest is immutable and addressed by its payload digest. It MUST bind:

- exact business source locator/selector, revision, and digest;
- exact formal claim, accepted `formalizes`, and both acceptance receipts;
- relationship-signature owner, version, and digest;
- predicate owner, version, and digest;
- derivation-rule owner, identity, version, and digest;
- derivation policy/profile owner, version, and digest;
- run and attempt identities;
- immutable derivation receipt schema/ref/digest;
- creation time, manifest schema version, payload digest, and claim ceiling.

The edge and manifest are admitted atomically. Missing or digest-mismatched
context fails closed. Any bound source, endpoint, correspondence, signature,
predicate, rule, policy/profile, or receipt change makes the prior relation and
obligation provenance non-current; replacement requires a new immutable
version and lifecycle event.

## Projection contracts

The integrated machine graph, indexes, crosswalks, query views, and human pages
are deterministic projections over exact admitted catalog manifests. Every
`ProjectionManifest` MUST bind:

- projection kind and output schema;
- generator identity, version, executable digest, and deterministic settings;
- exact input catalog, schema, adapter, and mapping digests;
- validation receipt set and ordering policy digest;
- projection, privacy, and filtering policy versions/digests;
- publication authorization ref/digest when a public output is requested;
- output path/identity, output digest, generation time, and freshness result;
- `authority_effect: none` and visible assertion-limit text.

Regeneration from the same ordered inputs MUST be byte-identical. A projection
cannot be supplied as a canonical semantic input, mutate Inventory, accept
meaning, discharge an obligation, promote a record, or authorize publication.

## Validator and aggregate contracts

Owner-local validators return this sealed result shape:

```yaml
validator_id: owner-qualified
validator_version_and_digest: exact
owner_route_ref: exact
input_manifest_refs_and_digests: exact-ordered-list
result: pass | fail | block | indeterminate/error
reason_code: owner-local-enum
subject_ref: exact
receipt_digest: sha256
claim_ceiling_ref: exact
```

Required semantic validators:

1. business source resolution, meaning record, and fidelity-receipt scope;
2. formal claim, formalization assertion, two-key equality, and specification
   composition without meaning rewrite;
3. proof obligation, derivation, context manifest, currentness, and lifecycle
   inputs;
4. system evidence subject/runtime/config/result and producer receipts.

Required integration validators:

5. structural syntax and owner/namespace/kind resolution;
6. relationship endpoint, direction, owner, inverse prohibition, and branch
   non-collapse;
7. provenance completeness, digest equality, and staleness;
8. deterministic projection regeneration, freshness, and non-authority.

The aggregate orchestrator MUST execute the owner-approved order, run the fixed
twelve-class negative corpus, stop at the expected first `fail`, `block`, or
`indeterminate/error`, preserve the complete typed child receipt, and propagate
a non-success aggregate status. It MUST NOT reinterpret owner semantics, grant
authority, discharge, promote, publish, or allow later success to mask earlier
non-pass.

## Lifecycle, promotion, and publication boundaries

Adoption, successful evaluation, discharge, promotion, and publication are
five separate acts. Each MUST have its own owner, exact subject digest,
authority route, scope, decision, timestamp, receipt, claim ceiling, and
supersession/currentness rule.

- A schema pass admits structure only.
- An owner receipt accepts only its declared scope.
- An evaluator pass records evidence only.
- A discharge decision changes only obligation lifecycle posture.
- A promotion decision admits only exact bytes to its named authority surface.
- A publication decision authorizes only its named audience, channel, and
  filtered output.

No transition is inferred from the previous one.

## Prototype migration boundary

The current `business.FormalClause` and three-branch financial-settlement
ontology are migration evidence only. Any later migration MUST bind an exact
inventory, preimage paths/digests, target schema and postimage digests, identity
mapping, rollback/compatibility rule, affected owners, negative controls, and
fresh acceptance. This contract neither freezes nor mutates those bytes.

## Exact owner-acceptance request matrix

Before canonical application, the final candidate package manifest and every
referenced schema digest MUST be presented independently to:

| Acceptance owner | Exact requested scope | Explicit non-scope |
| --- | --- | --- |
| DomainSpec authority-model and primary-source owner | admit the per-claim formal-owner role under existing primary-source authority | new authority kind or unrelated primary-source meaning |
| Business/domain source owner(s) | business catalog contract and fidelity-only receipt schema for exact assertions | formal statement authorship or proof |
| Formal-claims owner route | `FormalClaim`, `formalizes`, and formal assertion receipt contracts | business meaning, discharge, promotion |
| Specification-composition owner | `Specification` and membership contracts | changing claim meaning |
| Definitions/relationship owner | candidate record names, `formalizes`, `derived_from`, endpoint signatures, canonical directions | endpoint truth or lifecycle decisions |
| Ontology-protocol owner | four-branch node/edge/reference/projection grammar | semantic acceptance |
| DomainSpec structural-syntax adoption owner | exact version/digest of the candidate shape-only envelope | CAV2-local acceptance standing in for DomainSpec adoption |
| `validation-governance` | `ProofObligation`, `derived_from`, manifest, derivation, and owner-local validator contracts | proof truth, runtime correctness, discharge |
| Proof/evidence lifecycle owner | evidence and discharge-posture interfaces | business/formal meaning or derivation authority |
| System artifact/checker/evaluator owners | system-evidence record and receipt interfaces | spec meaning or discharge |
| Projection owner | compiler and projection manifest/non-authority contracts | source promotion or publication grant |
| Aggregate command owner | ordered typed orchestration and failure propagation | owner-result reinterpretation |
| Promotion lifecycle owner | exact-byte admission process and invalidation | semantic acceptance beyond bound receipts |
| Publishing principal plus source owners | only an exact filtered output, audience, and channel | private-source disclosure or semantic promotion |

Each request MUST say: “Accept or reject only the exact package manifest digest
and the scope in this row. Acceptance has no unstated authority effect. Any byte,
schema, owner route, claim ceiling, or scope change requires a new request.”

## Candidate gate

- Contract coverage: `complete-candidate`
- Exact schema bytes: `not-materialized`
- Owner receipts: `not-requested-or-accepted`
- Canonical effect: `none`
- Next protected event: parent Balancer validation, followed only with fresh
  authorization by digest-exact owner-admission requests.
