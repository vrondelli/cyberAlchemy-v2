# DomainSpec v2 Specification-Ontology Architecture

Status: `design-validator-pass`; exact protected owner admission pending

Candidate: `dsv2-spec-ontology-owned-branches@1`

Authority, implementation, migration, promotion, and publication effect: `none`

## Architecture intent

Make the specification a first-class branch of one connected logical ontology while keeping business meaning, formal claims, proof obligations, and system evidence under distinct owners. “One ontology” means shared typed identity and traversal, not one canonical file or one central semantic owner.

The machine-readable contract is `CANDIDATE-CONTRACTS.json`. If prose and that candidate contract differ, the owner-admission route must block and request a new reconciled candidate; neither artifact is canonical today.

## Source contracts and closed scope

- Approved architecture baseline: the completed ten-decision packet at `decision-gate/DECISION.md`.
- Closed scope: `scope/DESIGN-SCOPE-MANIFEST.json`, digest `5ad9c2877d32ac772031bdef9daf13bdfae30b37a30b020cbd7356237fa91a0a`.
- Denominator receipt: `scope/DESIGN-DENOMINATOR-RECEIPT.json`, verdict `pass`.
- Two-pass selection: `selection/DESIGN-SELECTION-RESULT.json`, fixed point `true`, result digest `16c064174affaf0d5345f3ff532b04aea79223c5727874d0aaedbe54b924352b`.

## View 1 — Context and ownership

```text
BusinessMeaning  <--- formalizes ---  FormalClaim  <-- ordered reference --  Specification
 business owner       two exact keys    formal owner                         composition owner
                                             ^
                                             |
                                        derived_from
                                             |
                                      ProofObligation
                                   validation governance
                                             ^
                                             |
                                  exact subject reference
                                             |
                                       EvidenceArtifact
                                   producer/evidence owner
```

The four branches are:

1. `business-meaning`: owns intended domain meaning.
2. `formal-claims-specification`: owns exact formal statements and specification composition, with separate claim and composition roles.
3. `proof-bridge`: owns deterministic obligation identity and derivation provenance.
4. `system-evidence`: owns producer-scoped evidence and execution/checker receipts.

Only `formalizes` and `derived_from` are selected candidate semantic relation verbs. System evidence connects through an exact owner-local `subject_ref` field; this Design does not silently promote a third relationship verb. A later relationship proposal may replace that field only through a fresh owner decision.

## View 2 — High-level structure

```text
owner authority and definitions
              |
      shape-only identity syntax
              |
   +----------+----------+----------+----------+
   |                     |          |          |
business catalog   formal/spec   proof bridge   system evidence
   |                     |          |          |
owner validator    owner validator  ...        owner validator
   +---------------------+----------+----------+
                         |
          relation, receipt, provenance checks
                         |
          ordered fail-closed aggregate
                         |
          deterministic integrated projection
                    authority_effect: none
```

Canonical propositions stay in owner-local catalogs. Each cross-branch assertion is stored with the narrowest owner making it. The integrated graph, indexes, query views, and human pages are regenerated from exact admitted inputs and cannot become semantic sources.

## View 3 — Low-level concepts and contracts

The smallest coherent unit contains:

- owner-qualified identity: namespace, logical ID, immutable version, payload digest, owner route, currentness, supersession, and claim ceiling;
- `BusinessMeaning`, `FormalClaim`, `SpecificationComposition`, `ProofObligation`, and `EvidenceArtifact` records;
- `formal-claims-owner` as a per-claim role under existing primary-source authority;
- `FormalClaim --formalizes--> BusinessMeaning` plus two current exact receipts;
- `ProofObligation --derived_from--> FormalClaim` plus one immutable content-addressed derivation-context manifest;
- four catalog manifests, one projection manifest, owner-local validator results, an ordered aggregate, and twelve negative witness classes.

Receipt decisions are intentionally asymmetric:

- formal owner: `accept`, `reject`, or `supersede` the exact assertion;
- business owner: `accept-fidelity`, `reject-fidelity`, or `supersede` only the exact fidelity claim.

Both receipts bind the same relation digest, endpoint versions/digests, scope, declared loss, and claim ceiling. They also bind a current owner-role proof. This Design requires that proof but does not invent a signing, key-custody, or external-attestation mechanism.

## View 4 — Workflow

1. The business owner admits exact `BusinessMeaning` bytes through its existing route.
2. A current per-claim formal owner authors an immutable `FormalClaim` version.
3. That owner authors `formalizes` and decides the exact assertion.
4. The business owner independently decides fidelity only.
5. The relation is eligible for admission only when both current receipts cover identical bytes.
6. The composition owner creates a specification version containing ordered exact claim references without rewriting claim bytes.
7. Validation governance derives a stable `ProofObligation` and `derived_from` record from the admitted claim and immutable context.
8. Evidence producers create artifacts and receipts that reference the obligation exactly; those results do not self-discharge it.
9. Owner-local and integration validators execute in declared order; the aggregate preserves the first non-pass.
10. Exact admitted catalogs generate non-authoritative integrated views.
11. Discharge, promotion, and publication remain separate owner decisions.

## View 5 — Decision and state flow

`formalizes` progresses from candidate to dual-key-eligible only after the two independent receipt decisions. An existing promotion lifecycle may then admit those exact bytes. Any relation, endpoint, scope, loss, claim-ceiling, owner-role, or receipt change makes the prior acceptance non-current and requires a new immutable version.

`derived_from` is current only while its obligation, formal claim, accepted correspondence, both receipts, relationship signature, source, predicate, rule, policy/profile, run/attempt, and derivation receipt remain exactly bound. Any change creates a new version and lifecycle event; no in-place repair is current.

Validator results remain `pass`, `fail`, `block`, or `indeterminate-error`. A later success never masks an earlier non-pass. A passing evaluator receipt is evidence, not discharge.

## View 6 — Dependencies and interfaces

| Producer | Consumer | Required interface | Forbidden coupling |
| --- | --- | --- | --- |
| Business owner | formal branch | exact business node and fidelity receipt | formal owner rewriting business meaning |
| Formal owner | composition and proof bridge | exact claim, `formalizes`, and formal receipt | composition or validation owning claim meaning |
| Validation governance | system evidence | exact obligation and derivation bindings | evidence result setting discharge |
| Evidence producer | proof/evidence lifecycle owner | exact subject reference and typed receipt | receipt self-promoting |
| Four catalog owners | aggregate | sealed owner-local validator results | central semantic reinterpretation |
| Catalogs and validation results | projection owner | exact ordered inputs, generator, policies, output digest | projection used as canonical input |

Canonical catalogs never depend on generated views. Public output additionally requires exact classification, audience, filtering, publishing-principal, and source-owner authorization.

## Deterministic evidence scenario

For one settlement rule:

- `business:meaning/settle-once@v1#B` is the business meaning.
- `formal:claim/settle-once@v1#F` is an immutable formal claim.
- `formalizes@v1#R` binds `F`, `B`, scope, loss, and ceiling.
- the formal receipt accepts `R`; the business receipt accepts fidelity of `R`.
- `proof:obligation/settle-once@v1#O --derived_from--> F` binds manifest `D`.
- evidence `E` references `O` as its exact subject.
- projection build `P` binds four catalog manifests and generator/policy digests.

Two builds over identical ordered inputs must yield the same `P` digest. That establishes reproducible navigation only. It says nothing about the truth of `F`, discharge of `O`, or authorization to publish `P`.

## Selected concerns and extensions

The fixed-point selector requires authority/trust, security/owner authenticity, lifecycle/currentness, persistence/concurrency, projection reliability, integration/versioning, migration, private-data lifecycle, and validation contracts. It does not select UX, runtime failure compensation, independent deployment/rollout, or performance concerns.

## Dependency and interface rules

- One semantic proposition has one narrowest canonical author; equivalent views are generated.
- Specification membership changes composition version, not claim meaning.
- Inverses of `formalizes` and `derived_from` are read directions only.
- Missing or mismatched receipt or provenance bindings fail closed.
- DomainSpec must independently adopt exact structural syntax or use an owner-local equivalent; CAV2-local acceptance cannot stand in for it.
- Receipt authentication must resolve to a current owner binding; the mechanism remains a protected owner input.
- A projection never accepts meaning, discharges, promotes, or authorizes publication.

## Decision log

The ten accepted decisions are preserved without alteration: one logical ontology with owned branches; formal owner role under primary-source authority; formal/spec branch; forward `formalizes`; exact two-key acceptance; separate proof-bridge node; forward `derived_from`; hybrid edge/manifest provenance; owner-local canonical catalogs with generated integrated views; and owner-local validation with a fail-closed aggregate and twelve negative classes.

## Risks and migration boundary

The important unresolved risks are exact term/signature admission, owner-role authenticity, DomainSpec syntax adoption, schema serialization, physical catalog paths, prototype migration pre/postimages, validator implementation, and public/private filtering. None changes the selected architecture; each blocks its own downstream edge.

The current `business.FormalClause` prototype is evidence only. A migration requires a frozen target inventory, exact pre/postimages, identity map, compatibility and rollback rules, negative fixtures, affected-owner acceptances, and separate implementation authorization.

## Design transport and gate

The Design package may be used to request exact scoped owner review. It may not proceed automatically to Plan because physical target surfaces and canonical schemas depend on owner admission.

- Six views: complete.
- Closed denominator: pass.
- Two-pass selection: fixed-point pass.
- Distill: pass with bounded tensions.
- Design evidence state: `design-validator-pass`.
- Protected owner admission: `block`.
- Recommended next route: fresh authorization for a digest-exact owner-admission/design-hardening package, not Plan or implementation.
