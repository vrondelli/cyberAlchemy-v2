# Specification-Ontology Branch Architecture — Proposer Candidate

## Candidate status

- Dispatch: `invoke-design-dsv2-spec-ontology-20260823T182917Z`
- Invoke phase: `design`
- Role: `Proposer`
- Evidence posture: `design-candidate`
- Authority, implementation, migration, promotion, publication, release, and deployment effect: `none`
- Protected gate: exact owner admission remains pending.

This design makes a specification a first-class branch of one connected logical
ontology without turning that ontology into one shared authority file. The
smallest coherent design unit is an **owner-qualified specification-ontology
package**: four canonical branch catalogs, two canonical forward cross-branch
relations, exact acceptance and provenance records, owner-local validators, a
fail-closed aggregate, and non-authoritative projections.

Splitting that unit would break at least one required recomposition:

- removing branch ownership would collapse semantic authority;
- separating `FormalClaim` from `formalizes` and its two receipts would break
  correspondence identity;
- separating `ProofObligation` from `derived_from` and its context manifest
  would break derivation provenance and currentness;
- treating projections or the aggregate as standalone truth would break
  canonicality and validation ownership.

## View 1 — Context and authority boundary

```text
business source owner                         primary-source authority
        | owns meaning                               |
        v                                             v
  BusinessMeaning <---formalizes--- FormalClaim <-- composed by -- Specification
   business branch       two exact keys       formal-claims/specification branch
                               |
                               | accepted/current claim binding
                               v
                        ProofObligation
                         proof-bridge branch
                               |
                               | references, never equates
                               v
                         SystemEvidence
                      system-evidence branch

        exact owner-local catalogs -> deterministic integrated projections
                                          authority_effect: none
```

Actors and their non-collapsing responsibilities:

| Actor/route | Owns | Must not own by implication |
| --- | --- | --- |
| Business/domain source owner | Intended business meaning and fidelity acceptance for one exact `formalizes` assertion | Formal statement, proof derivation, test result, or projection |
| Formal-claims owner role | One exact formal statement, its formalization assertion, version, challenge response, and semantic supersession | Business meaning or a new authority kind |
| Specification-composition owner | Inclusion, ordering, and versioning of exact claim references in a specification | Unilateral edits to claim meaning |
| Ontology-protocol and relationship owners | Node/edge/address grammar and admissible signatures | Endpoint truth or semantic acceptance |
| `validation-governance` | Deterministic derivation of obligations and build-time fidelity checks | Claim meaning, runtime correctness, or obligation discharge |
| Proof/evidence owner | Evidence records and discharge posture | Business or formal-claim meaning |
| Projection owner | Deterministic generation and freshness of read models | Canonical semantic authorship, promotion, or publication authorization |
| Promotion/publication owner | Its own distinct admission or publication decision | Inferred consent from validation or freshness |

The four branches are connected by owner-qualified references. Connectivity is
a property of the logical model; canonical authorship remains distributed.

## View 2 — High-level structure and capabilities

```text
Candidate structural address profile (shape only)
                  |
  +---------------+----------------+----------------+----------------+
  |                                |                |                |
Business catalog        Formal/spec catalog   Proof catalog   System catalog
  |                                |                |                |
  +-- owner validator  +-- owner validator  +-- owner validator  +-- owner validator
                  \             |             /               /
                   +---- relation/provenance validators ------+
                                      |
                         ordered fail-closed aggregate
                                      |
                      admitted exact catalog manifest set
                                      |
                  deterministic projection compiler
                         /                         \
             integrated machine graph        human/query views
                 authority_effect: none      authority_effect: none
```

High-level capabilities:

1. **Owner-local canonical authoring.** Each proposition is authored once in
   the catalog of the narrowest owner making it.
2. **Specification composition.** A `Specification` contains ordered,
   version-exact `FormalClaim` references; membership cannot rewrite a claim.
3. **Formal correspondence.** One forward `FormalClaim --formalizes-->
   BusinessMeaning` assertion becomes admissible only when its formal owner and
   business fidelity owner accept the same exact bytes.
4. **Obligation derivation.** One forward `ProofObligation --derived_from-->
   FormalClaim` assertion binds current endpoints and an immutable derivation
   context.
5. **Typed validation.** Semantic validators stay with owners; integration
   validators check shape, exact binding, currentness, non-collapse, and
   projection determinism.
6. **Read-model generation.** Integrated graph, index, crosswalk, and human
   pages are reproducible projections, never semantic inputs.

The structural address dependency is candidate-only for DomainSpec. CAV2 has
accepted exact schema version `1.0.0` at SHA-256
`a3363314bc5c51a4ef5db559393553e41a9d43b43e3037442267fd9da7e3a078`
for CAV2-local syntax. DomainSpec has not adopted it, so TOP-03 is unavailable
until an independent exact DomainSpec adoption act. The architecture therefore
requires the shape but does not claim the shared protocol is admitted.

## View 3 — Low-level concepts and records

| Record | Canonical home | Narrowest semantic owner | Identity-critical bindings |
| --- | --- | --- | --- |
| `BusinessMeaning` | business branch catalog | business/domain source owner | owner namespace, logical ID, version, payload digest, source selector/digest, lifecycle |
| `FormalClaim` | formal-claims/specification catalog | per-claim formal-claims owner role under primary-source authority | exact statement bytes/digest, formal language/profile, claim ceiling, version, challenge/supersession |
| `Specification` | formal-claims/specification catalog | specification-composition owner | specification version/digest, ordered exact claim references, composition policy |
| `SpecificationMembership` | formal-claims/specification catalog | specification-composition owner | exact specification and claim versions/digests, position, inclusion scope |
| `formalizes` | formal-claims/specification catalog | formal-claims owner of the source claim | exact endpoints, relation digest, declared loss, claim ceiling, two current acceptance receipts |
| `FormalAssertionAcceptance` | formal-claims/specification catalog | formal-claims owner role | exact relation and endpoint bindings, decision, authority route, receipt digest |
| `BusinessFidelityAcceptance` | business catalog | business/domain source owner | same exact relation/endpoints, fidelity-only scope, decision, receipt digest |
| `ProofObligation` | proof-bridge catalog | `validation-governance` for derivation semantics | predicate/expected-value binding, owner route, lifecycle, exact derived relation |
| `derived_from` | proof-bridge catalog | `validation-governance` | exact endpoints/currentness, accepted correspondence, owner route, lifecycle, context manifest ref |
| `DerivationContextManifest` | proof-bridge catalog | derivation-rule/policy owner through validation governance | source, signature, predicate, rule, policy/profile, run/attempt, receipt; immutable content digest |
| `SystemEvidence` | system-evidence catalog | producer/checker/evaluator owner | subject, runtime/configuration, result type, evidence bytes/digest, receipt refs |
| `CatalogManifest` | each branch | that catalog's owner | schema and record digests, ordering, revision, predecessor/currentness |
| `ProjectionManifest` | projection output | projection owner | generator, exact input/adapters/policies, output digest, freshness, `authority_effect: none` |
| `ValidationReceipt` | producing validator route | validator owner | validator identity/version/digest, exact inputs, typed result, first-failure position |

Only `formalizes` and `derived_from` are authored semantic forward edges in
this design. Reverse navigation is generated from those records and is never a
second canonical edge.

## View 4 — Workflow and process

```text
1 Capture exact BusinessMeaning
  -> business owner admits or rejects its own bytes
2 Author exact FormalClaim
  -> formal-claims owner accepts or rejects its own statement
3 Author formalizes assertion
  -> formal owner accepts exact assertion
  -> business owner accepts fidelity of those same bytes only
  -> relation becomes dual-key-admissible or remains blocked
4 Compose Specification
  -> composition owner orders exact claim refs without changing claim bytes
5 Derive ProofObligation
  -> validation-governance binds accepted claim/correspondence and context manifest
  -> changed binding creates a new version; no in-place repair
6 Produce SystemEvidence
  -> producer/checker/evaluator owns exact result and receipt
  -> lifecycle owner separately decides discharge posture
7 Validate catalogs and integration
  -> each owner-local validator runs under its owner
  -> aggregate preserves first fail/block/indeterminate
8 Generate projections
  -> exact admitted inputs + generator + policies -> digest-bound output
  -> views remain non-authoritative
9 Promote or publish only through separately authorized owner decisions
```

There is no automatic arrow from source to claim, claim to correspondence,
correspondence to obligation, passing evidence to discharge, validation to
promotion, or projection freshness to publication.

## View 5 — Decision flow and state

### Formalization relation

```text
candidate
  | formal owner accepts exact bytes
  v
formal-key-only -----------------------+
  | business owner accepts fidelity    | any bound byte changes
  v                                    v
dual-key-admissible --------------> non-current
  | owner lifecycle admits exact bytes | new immutable version only
  v                                    |
admitted-current ----------------------+

rejection by either owner -> rejected (new proposal required)
```

The business receipt is never an acceptance of the formal statement's truth.
The formal receipt is never an acceptance of business meaning. Both keys bind
the same relation bytes and endpoint versions/digests.

### Derived obligation provenance

```text
candidate obligation + candidate derived_from + context manifest
  -> shape valid?
  -> exact claim/correspondence current and dual-key-admissible?
  -> context manifest present and digest-matched?
  -> owner-local derivation validator passes?
  -> lifecycle owner admits exact immutable version?
       yes: current-open
       no/reject: blocked or rejected

any source, endpoint, correspondence, signature, predicate, rule, policy,
profile, or receipt change -> prior version non-current -> new version/event

evaluator pass -> evidence available, not discharged
discharge/reopen/kill/refuse -> separate owner-local lifecycle decision
```

### Aggregate result

`pass`, `fail`, `block`, and `indeterminate/error` remain typed. The aggregate
stops at the expected first non-pass and cannot normalize a later success over
it.

## View 6 — Dependencies and interfaces

| Producer | Consumer | Interface contract | Prohibited coupling |
| --- | --- | --- | --- |
| Structural address owner | all branch catalogs | owner-qualified ID, version, digest, exact typed references | syntax deciding record or relation meaning |
| Business catalog | formal/spec catalog | exact `BusinessMeaning` reference plus business fidelity receipt | formal branch rewriting business bytes |
| Formal/spec catalog | proof catalog | exact current `FormalClaim`, `formalizes`, and two receipt refs | proof branch owning claim meaning |
| Proof catalog | system catalog | obligation and predicate references | evidence treating a pass as discharge |
| Four catalogs | owner-local validators | owner schema + exact catalog manifest | aggregate reinterpreting owner semantics |
| Owner validators | aggregate | ordered typed receipts with exact input digests | result normalization or failure masking |
| Catalogs + validation receipts | projection compiler | admitted manifest set, generator/policy bindings | projection used as canonical input |
| Projection compiler | machine/human consumers | output digest, freshness, limitations, `authority_effect: none` | view granting promotion or publication |

Dependency rules:

- canonical dependencies point from an owner-authored record to exact immutable
  owner-qualified references;
- semantic payloads are not copied into another branch as competing authority;
- every cross-branch relation names source, target, direction, owner route,
  evidence, authority effect, and forbidden collapse;
- `formalizes` and `derived_from` each have one canonical direction; inverses
  are generated reads;
- generated bytes may depend on canonical catalogs, but canonical catalogs must
  never depend on generated bytes;
- owner-local validators may be orchestrated centrally, but their result types
  and semantic interpretations remain owner-owned;
- no public projection is a dependency of this candidate.

## Deterministic artifact/evidence scenario

Illustrative identities below are placeholders for future exact bytes, not
admitted records:

```text
business:meaning/settlement-guarantee@v1#<B>
  <- formalizes -
formal:claim/settle-eligible-order-once@v1#<F>
  <- member of - formal:spec/settlement@v1#<S>

proof:obligation/settle-once@v1#<O>
  -- derived_from --> formal:claim/settle-eligible-order-once@v1#<F>
  -- context --> urn:sha256:<D>

system:evidence/settle-once-check/attempt-1#<E>
  -- evidence for --> proof:obligation/settle-once@v1#<O>
```

The `formalizes` payload is accepted only if both exact receipt digests bind
`<B>`, `<F>`, its relation digest, scope, declared loss, and claim ceiling. The
context manifest `<D>` binds the source selector/digest, relationship signature,
predicate, derivation rule, policy/profile, run/attempt, and derivation receipt.
Given a lexically sorted set of the four exact catalog manifests, the exact
projection compiler digest, and exact projection policy digest, two builds must
produce byte-identical integrated graph output `<P>`. A checker result `<E>`
may support a later lifecycle decision but cannot itself set the obligation to
discharged.

## Concern-to-view trace candidate

| Concern | Primary view(s) | Contract witness |
| --- | --- | --- |
| `O-ARCH` connected model, separate authority | 1, 2 | four catalogs plus generated integration |
| `O-CLAIM-OWNER` per-claim role | 1, 3 | `FormalClaim` owner-role contract |
| `O-CORRESPONDENCE` exact two-key acceptance | 3, 4, 5 | `formalizes` plus two receipts |
| `O-PROVENANCE` exact current derivation | 3, 4, 5 | `derived_from` plus context manifest |
| `O-CANONICALITY` owner bytes vs views | 2, 6 | catalog and projection manifests |
| `O-VALIDATION` owner semantics and aggregate | 2, 5, 6 | typed owner receipts and ordered aggregate |
| `O-AUTHORITY` no automatic authority movement | 1, 4 | explicit owner gates and claim ceilings |
| `O-RELATION` directional owner-qualified edges | 3, 6 | one authored direction per relation |
| `O-SUBSTRATE` shape-only common layer | 2, 6 | address profile with semantic exclusions |
| `O-MIGRATION` prototype is evidence only | 3, downstream | frozen pre/postimage gate, not mutation |
| `O-SYNTAX` exact CAV2 ceiling | 2, 6 | independent DomainSpec adoption blocker |
| `O-GLOSSARY` no silent definitions | 3, companion report | definitions owner routing |

## Ten accepted architecture decisions

1. One connected logical ontology with separately owned branches.
2. `formal-claims-owner` is a per-claim role under existing primary-source
   authority, not a new authority kind.
3. `FormalClaim` and specification composition live in the formal-claims/
   specification branch, not the business branch.
4. The authored correspondence direction is `FormalClaim --formalizes-->
   BusinessMeaning`.
5. That correspondence requires the formal assertion key and an independent
   business fidelity key over identical bytes.
6. `ProofObligation` is a separately owned proof-bridge node.
7. The authored provenance direction is `ProofObligation --derived_from-->
   FormalClaim`; inverse navigation is generated only.
8. Provenance is hybrid: identity/currentness on the edge and derivation detail
   in an immutable content-addressed manifest.
9. Owner-local catalogs are canonical; integrated machine and human views are
   digest-bound generated projections with `authority_effect: none`.
10. Owner-local semantic validators feed a fail-closed cross-branch aggregate
    that preserves typed results and exercises twelve fixed negative classes.

These selections are a stable design baseline. They are not the protected
owners' acceptance of the exact contract bytes proposed here.

## Constraints and non-goals

- No standalone formal-claims authority kind is minted.
- No shared semantic registry or one-file ontology is introduced.
- No projection, receipt, fixture, or validator self-promotes.
- No obligation is discharged from a passing evaluator result.
- No CAV2 syntax acceptance is stretched into DomainSpec adoption.
- No current `business.FormalClause` prototype byte is changed or treated as
  target authority.
- No validator or fixture is claimed implemented or executed.
- No migration, implementation plan, task/SWU, publication, or release is in
  scope.

## Risks and downstream notes

The highest risks are definition collision for the two candidate relationship
verbs, owner ambiguity inside the formal/specification branch, projection
laundering, stale provenance, aggregate result masking, and accidental
promotion of the current three-branch prototype. Exact mitigations and closure
owners are in `RISKS-AND-GAPS.md`.

A future migration must freeze the prototype's preimage and target postimage,
bind exact digests, move `business.FormalClause` only through owner-approved
semantics, and preserve all unaffected identities. This design neither selects
the migration bytes nor authorizes them.

## Design transport

The parent Balancer receives this candidate with `OWNER-CONTRACTS.md`,
`PLANNED-WITNESSES.json`, `GLOSSARY-CONSISTENCY.md`,
`IMPLEMENTATION-LAYERING-SEED.md`, `DESIGN-TRANSPORT.md`, and
`RISKS-AND-GAPS.md`. The next consequential route may consume them only after
deterministic Design validation and fresh authorization. Exact owner admission
must precede canonical application; implementation planning cannot stand in
for that admission.

## Proposer gate result

- Candidate authorship: `complete`
- Six-view coverage: `complete-candidate`
- Distill Proposer result: `pass` — the package is the smallest unit that can
  preserve identity, authority, provenance, and validation recomposition.
- Deterministic execution evidence: `not-run-by-design`
- Protected owner-admission gate: `blocked-pending-exact-owner-acceptance`
