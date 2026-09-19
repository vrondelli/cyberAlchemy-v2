# DomainSpec v2 Specification-Ontology Architecture Decision

Status: architecture option set complete; protected owner admissions pending
Authority effect: none
Implementation effect: none
Promotion effect: none
Source decision: `DEC-DSV2-LANE-ZA`
Decision ID: `DEC-DSV2-SPEC-ONTOLOGY-ARCHITECTURE-001`

## Recorded selection

- Selected option: `A-one-semantic-graph-owned-branches`
- Selected by: direct user selection (`A`)
- Selected at: `2026-08-23T17:03:47+01:00`
- Rationale: choose one connected semantic ontology while preserving distinct
  business, formal-claims/specification, proof-bridge, and system ownership and
  authority boundaries.
- Decision effect: architecture preference recorded only.
- Owner admission: pending exact multi-owner contracts and acceptance receipts;
  no authority, implementation, promotion, or publication effect follows from
  this selection record.

## Decision question

What top-level architecture should connect domain meaning, the DomainSpec
specification, proof obligations, and system evidence?

## Why this blocks design

The repository now contains evidence for three materially different source-of-
truth arrangements. Choosing branch ownership, obligation provenance, projection
direction, schemas, validators, and migration targets before selecting one
arrangement would encode the architecture decision indirectly.

## Options

### A — One semantic graph with separately owned branches (recommended)

Use one governed semantic ontology containing business,
formal-claims/DomainSpec-specification, proof-bridge, and system branches. Each
branch keeps its own owner, authority posture, and admissible edge types. Every
formal claim has an explicit formal-claims owner; the specification-composition
owner may include and version that claim but cannot rewrite its meaning.
Generated views may combine the branches but cannot create semantic links or
transfer authority.

Benefit: matches the witnessed four-lane prototype, avoids duplicate semantic
identity, preserves formal-claim ownership, and makes gaps and drift
traversable. Cost/risk: requires a precise branch contract and ontology-native
provenance from specification clauses to derived obligations. Choose it when
shared identity and navigability matter while claim, graph-protocol, derivation,
and evidence authority must remain separated. Downstream impact: the next gates
decide claim-owner representation, branch ownership, provenance edge shape,
projection direction, and validation.

### B — Separate canonical models with generated mappings

Keep the formal-claims/specification model and ontology as independent canonical
models. The formal-claims owner owns claim meaning in the specification model;
the ontology-protocol owner owns the mapped ontology representation. Generate
versioned mappings and drift checks between them.

Benefit: preserves the current crisp contract boundary and isolates changes.
Cost/risk: duplicates identity and makes mapping currency a permanent
coordination problem. Choose it when authority isolation matters more than one
connected semantic substrate. Downstream impact: requires mapping ownership,
bidirectional consistency rules, conflict resolution, and drift repair.

### C — Full specification/ontology fusion

Make the specification contract and ontology one canonical source model. The
formal-claims owner still owns claim meaning within that model; shared storage
does not grant the ontology-protocol owner authority to rewrite a claim.

Benefit: one authoring and execution source with no mapping seam. Cost/risk:
largest migration and authority-collapse risk; ontology metadata could affect
engine-facing semantics, and current evidence does not establish the claimed
agent-cost advantage. Choose it only if all affected owners accept one authority
surface and the migration is separately witnessed. Downstream impact: rewrites
specification schemas, derivation readers, validators, and governance ownership.

### D — Defer

Retain the current two-plane boundary. Existing prototypes and research remain
non-promoting evidence; no architecture or implementation design proceeds.

### E — Stop

Stop the spec-ontology design direction. Preserve the research as historical
evidence and do not create a successor architecture route.

## Standing context option

`Explain / more context` does not select an option. It requests an aligned
low-, medium-, and complex-example comparison, after which this same decision
will be presented again.

## Formal-claims ownership invariant

This invariant applies to A, B, and C; it is not an optional fourth architecture:

- The business/domain source owner owns the intended business meaning.
- The formal-claims owner owns the exact formal statement and the accepted
  correspondence between that statement and its source meaning.
- The specification-composition owner owns inclusion, ordering, and versioning
  of claims in a specification, not unilateral changes to claim meaning.
- The ontology-protocol owner owns node, edge, identity, and projection grammar,
  not the truth or meaning of a formal claim.
- `validation-governance` owns deterministic derivation of obligations from an
  accepted claim, not the claim itself and not whether evidence discharges it.
- The proof/evidence owner owns evidence and discharge posture, not business or
  formal-claim meaning.

The current authority model does not yet name a standalone formal-claims
authority kind. Selecting an architecture does not silently mint one. A
dependent owner decision must choose whether this is an explicit role under the
existing primary-source authority or a separately ratified local authority kind.

## Dependent decisions held behind this gate

1. **Selected:** formal-claims ownership is an explicit per-claim role under
   existing primary-source authority; exact role contract and protected owner
   admission remain pending.
2. **Selected:** formal clauses are owned by the formal-claims/specification
   branch; migrating the current `business.FormalClause` prototype requires a
   later authorized route.
3. **Selected:** one canonical `FormalClaim --formalizes--> BusinessMeaning`
   relation; inverse wording is a generated read-model view, not another edge.
4. **Selected:** exact two-key acceptance: the formal-claims owner accepts the
   assertion and the business source owner independently accepts only source
   fidelity; both receipts bind the same exact relation and endpoint bytes.
5. **Selected:** every derived proof obligation is a separately owned stable
   proof-bridge node; it is neither authored claim meaning nor proof of success.
6. **Selected:** one canonical
   `ProofObligation --derived_from--> FormalClaim` relation; its inverse is a
   generated read direction, not another semantic edge.
7. **Selected:** a hybrid exact provenance contract keeps semantic/currentness
   bindings on the edge and detailed derivation bindings in one immutable
   content-addressed context manifest; any bound change fails currentness and
   requires a new version plus lifecycle event.
8. **Selected:** owner-local branch catalogs and their owner-adopted relation
   records are canonical inputs; the integrated graph, indexes, crosswalks,
   query views, and human pages are digest-bound generated projections with
   `authority_effect: none`.
9. **Selected:** each branch owner executes its own semantic validator; an
   ordered cross-branch aggregate gate checks relationship/provenance
   integration, projection reproducibility, typed result propagation, and a
   fixed twelve-class negative corpus without reinterpreting owner meaning.

## Selected architecture contract

```text
ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning
       proof bridge                formal claims                   business
```

- The three nodes have stable owner-qualified identities in separately owned
  branches of one connected logical ontology.
- `formalizes` becomes accepted only through exact formal-claims-owner assertion
  acceptance plus independent business-owner fidelity acceptance.
- A proof obligation is a derived bridge node, not claim meaning and not proof
  of success.
- `derived_from` carries exact endpoint/currentness bindings and points to one
  immutable derivation-context manifest for rule, predicate, policy, and receipt
  detail.
- Owner-local catalogs and owner-owned cross-branch assertions are canonical.
  The integrated machine graph and human views are digest-bound projections
  with `authority_effect: none`.
- Owner-local validators interpret owner meaning. The aggregate gate checks
  integration and preserves typed verdicts; it cannot accept meaning, discharge
  an obligation, promote a record, or authorize publication.

## Remaining protected admissions

The option set is complete, but the selected protected choices remain proposals
until the exact candidate package is accepted by its named owners. That package
must bind:

1. formal-claims role, formal-clause branch, and specification-composition contracts;
2. `formalizes` relation schema and its two exact owner-acceptance receipt schemas;
3. proof-obligation node and `derived_from` relation schemas;
4. hybrid provenance edge and derivation-context manifest schemas;
5. owner-local catalog, projection manifest, compiler, and non-authority contracts;
6. owner-local validator interfaces, ordered aggregate contract, twelve exact
   negative fixtures, and executed validation receipts; and
7. migration inventories and exact pre/postimage digests for any later change
   to the current `business.FormalClause` prototype or other canonical bytes.

The recommended next route is a separately authorized `invoke:design` over this
decision packet to materialize one exact candidate contract package and its
owner-acceptance requests. This decision record does not authorize that route,
implementation, migration, promotion, publication, Git operations, release,
deployment, or production use.

## Current gate state

- Result: `PASS` for architecture option selection
- Consequential continuation: `BLOCK` pending exact contracts and protected
  owner admissions
- Architecture decisions resolved: 10
- Selected architecture: `A-one-semantic-graph-owned-branches`
- Selected formal-claims home: `A-role-under-primary-source-authority`
- Selected formal-clause branch: `A-formal-claims-specification-branch`
- Selected correspondence: `A-formal-claim-formalizes-business-meaning`
- Selected correspondence acceptance: `A-exact-two-key-endpoint-owner-acceptance`
- Selected proof-obligation home: `A-separately-owned-proof-bridge-node`
- Selected obligation provenance: `A-obligation-derived-from-formal-claim`
- Selected provenance binding: `A-hybrid-exact-edge-and-context-manifest`
- Selected canonical bytes: `A-branch-canonical-catalogs-generated-integrated-graph`
- Selected validation: `A-owner-local-validators-cross-branch-aggregate`
- Remaining blocker-level architecture choices: 0
- Remaining protected gates: exact candidate materialization and named owner admissions
- Consequential product bytes changed: 0
- Decision source: direct user selection recorded above
- Protected owner admission: pending
- Override: not requested
