---
decision_id: DEC-FPR02-SUPPORTED-PROFILE
task_id: SWU-FPR02-001
status: accepted
gate_result: PASS
decision_date: 2026-07-17
decision_authority: claim-and-semantic-owners
production_authorized: false
decisions_resolved: 16
blockers_remaining: 0
backend_lane: FPR-02B
ui_lane: FPR-02U
---

# Decision Gate: FPR-02 Supported Profile

## Scope

Freeze the exact admitted/exercised backend release profile and the bounded Body War
pilot contract before any `FPR-02B` schema or validator is authored. UI development
continues independently in `FPR-02U`; neither lane waits for the other lane to close.

The user explicitly selected the next ready Task Session by asking it to start the
next tasks until a blocker. `SWU-FPR02-001` is therefore selected for this Decision
Gate entry only. No implementation, successor, or release authority follows from
that selection.

## Controlling Evidence

- FPR-01 exact baseline ratification is verified and synchronized.
- Ratified language denominator: 13 active backend types and 30 active relationship
  signatures; nine UI types are candidate and two are deferred.
- `EGI-003` permits a backend-only profile while UI formation remains deferred; it
  forbids calling that profile full-language support.
- Body War’s owned feature contract covers SuggestedTrack creation and consented,
  redacted ActivityEvidenceCandidate attachment. Its application UI is not a
  DomainSpec UI product or UI-meta-type authority.
- The accepted product contract excludes a DomainSpec graphical UI from the first
  release and requires claims to remain exact-profile bounded.
- The 2026-07-17 UI direction makes all eleven UI concepts required-by-design
  for the DomainSpec UI development profile. Synthetic evidence may establish
  mechanical coherence; real-corpus evidence measures confidence and no longer
  gates implementation. Canonical DS-D1/DS-D8 placement and inclusion in this
  first supported release profile remain separate owner decisions.
- The operator decision on 2026-07-17 separates backend and UI work into two
  non-blocking lanes. `FPR-02B` excludes UI from the first backend release profile;
  `FPR-02U` continues the required UI development profile and later owner handoff.
  The machine projection is `profile-lanes/fpr02-lanes.yml`.

Context pack:
`foundation-execution/runs/SWU-FPR02-001/context/CONTEXT-PACK.md`.

## Resolved Decision 1: Backend/UI Lane Separation

### Question

Should UI formation and backend first-release work share one completion gate?

### Selected option — Two independent lanes

- `FPR-02B`: backend first-release profile. It consumes the 13 active backend IDs,
  keeps UI outside its admitted/exercised set, and owns the Body War pilot, claim,
  origin, redaction, rollback, and stable-digest decisions.
- `FPR-02U`: required UI development profile. It continues through the existing
  `development/ui-profile-implementation/` work-pack and later routes exact
  DS-D1/DS-D8/profile deltas to their owners.
- There is no cross-lane completion dependency and no implicit future join.
- UI incompleteness cannot block backend work; backend provider/pilot decisions
  cannot block UI development.
- A later UI-inclusive release requires a new explicit owner admission decision.

### Rejected alternative — Couple UI admission to the backend release profile

This would make UI representation and authority residue block the backend release
even though the accepted product boundary does not require DomainSpec UI in that
release. The operator explicitly rejected that coupling.

### Rejected alternative — Stop backend work until UI completion

This would preserve the exact blocking behavior the lane decision is intended to
remove. Future UI release admission remains possible through a new owner decision.

### Selection

Selected by the operator on 2026-07-17: two independent lanes. The lane split is
resolved; it does not resolve the remaining backend profile and Body War choices.

## Resolved Decision 2: Backend Type Breadth

### Question

Which backend type set must `FPR-02B` admit and positively exercise?

### Selected option — All 13 admitted and exercised

The profile must admit and positively exercise exactly the ratified backend IDs:

`DS-D1.1..9`, `DS-D1.11..14`.

`DS-D1.10` remains superseded and `DS-D1.15..25` remain outside this backend lane.
For this dimension, the release evidence target is therefore:

```text
Kinds_admitted = Kinds_exercised = 13
```

This requires positive formation evidence for Mapping and State Machine in addition
to the eleven backend kinds already observed in current feature packs. Registry
loading, schema existence, or a candidate label does not count as positive exercise.

### Rejected option — Admit 13 and initially exercise 11

This could shorten the first evidence pass, but it would leave two admitted kinds
unproven and forbid the requested `13/13` backend-type completeness claim.

### Rejected option — Preserve the existing four-type experimental profile

This would preserve the current `feature-with-independent-node-files@1` evidence at
the cost of materially narrowing the requested all-backend-type release scope.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. The choice aligns the
release profile with the previously requested all-backend-types test-engine plan and
keeps the claim exact: backend node-formation breadth only, not relationship,
semantic, UI, or full-language completeness.

### Downstream impact

- `SWU-FPR02-002` must bind all 13 IDs to exact formation-schema paths and digests.
- Backend fixtures must positively exercise every kind; Mapping and State Machine
  cannot remain registry-only.
- The existing four-type profile remains historical/experimental evidence and must
  not be silently widened in place.
- No schema, profile, fixture, or implementation mutation is authorized by this
  decision alone.

## Resolved Decision 3: Backend Relationship Breadth

### Question

Which ratified backend relationship signatures must `FPR-02B` admit and positively
exercise?

### Selected option — All 16 backend signatures admitted and exercised

The profile must admit and positively exercise these exact non-UI signatures:

1. `performs`
2. `produces`
3. `produces-for`
4. `triggers-cross`
5. `enforces`
6. `calculates`
7. `transitions`
8. `exposes`
9. `orchestrates`
10. `applies`
11. `maps`
12. `contains`
13. `queries`
14. `emits`
15. `owns`
16. `belongs-to`

For this dimension, the release evidence target is:

```text
Backend_signatures_admitted = Backend_signatures_exercised = 16
```

The fourteen UI/cross-layer signatures `renders`, `wraps`, `composes`, `consumes`,
`submits`, `shapes`, `protects`, `displays`, `fetches`, `mutates`, `reflects`,
`derives`, `contracts`, and `mirrors` remain outside `FPR-02B` and continue under
the independent UI/owner routes.

### Rejected option — Admit and exercise the nine currently witnessed signatures

This would have produced the smallest evidence-backed release subset, but it would
leave seven active backend signatures explicitly outside the supported profile.

### Rejected option — Admit 16 and exercise only nine

This would expose seven relationship signatures without positive release evidence
and prohibit a backend-relationship completeness claim.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `3`. The choice establishes
backend relationship breadth as a release requirement rather than deferred FPR-05
residue. It does not establish full-language coverage because all UI/cross-layer
signatures remain excluded from this lane.

### Downstream impact

- The seven backend signatures absent from current positive packs—`performs`,
  `triggers-cross`, `transitions`, `maps`, `emits`, `owns`, and `belongs-to`—need
  new positive witnesses.
- Each signature needs direction, endpoint, multiplicity/scope, negative, execution,
  and composition evidence appropriate to its governed contract.
- The backend test-engine plan must eventually be refreshed: relationship breadth is
  no longer deferred, and its denominator must remain independent from generated
  engine output.
- FPR-05 composition work becomes part of the backend release critical path.
- No relationship registry, fixture, engine, profile, or plan mutation is authorized
  by this decision alone.

## Resolved Decision 4: Canonical Authoring And Projection Model

### Question

Which source model owns the new backend profile?

### Selected option — Node source with YAML rule authority

The backend profile uses the selected layout-A authority split:

- consumer node meaning is authored as one canonical JSON file per node;
- connection ownership was initially included in the node-source option and is
  explicitly superseded by Decision 5 after the `16/16` relationship choice
  triggered the selected design's edge-lifecycle expiry condition;
- the 13 `impl/spec/meta-types/**/*.schema.yml` files own formation criteria;
- `definitions/meta-types/meta-types.yml` and
  `definitions/relationships/relationships.yml` own the governed type and
  relationship registries;
- `definitions/minted-project/supported-profiles.yml` owns profile admission;
- normalized graph, source manifest, Markdown, derived obligations, generated tests,
  and receipts are generated read/evidence models only.

Generated artifacts must never be repaired by hand or used to reverse-author
consumer meaning. Markdown parsing may remain a compatibility/parity adapter, but
Markdown is not a second writable semantic source for this profile.

### Rejected option — Markdown source with generated nodes

This would preserve the current documentation-first workflow, but it would make the
new node-package style secondary and retain known optional-file and empty-success
parser weaknesses at the canonical authoring boundary.

### Rejected option — Dual canonical Markdown and JSON sources

This would support both editing styles but create two writable truths, require
bidirectional equality, increase migration and review cost, and make drift failures
part of every release build.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. The choice matches the
previously selected layout-A node design and the operator's request to use the new
YAML files with the node style under development. It preserves edit locality without
moving formation authority into duplicated JSON body schemas or generated outputs.

### Downstream impact

- The compiler must consume node JSON plus the selected profile and adapt node bodies
  into one shared YAML-backed criterion evaluator.
- The build receipt must bind the exact source set, profile/registry/schema digests,
  graph, source manifest, generated Markdown, obligations, and tests.
- Generated-view drift is a validation failure, never a reason to edit the generated
  files directly.
- The exact successor profile identity/version remains unresolved.
- No source, schema, registry, compiler, or generated artifact mutation is authorized
  by this decision alone.

## Resolved Decision 5: Relationship Instance Ownership

### Question

Under the selected `16/16` backend relationship requirement, where does each concrete
relationship instance live and who owns its lifecycle?

### Selected option — Independent edge records

The successor profile uses separate canonical source records for nodes and edges:

- one JSON source file owns each node's concrete meaning;
- one JSON source file owns each concrete relationship instance;
- an edge record carries its stable identity, governed signature, `from` and `to`
  endpoints, scope, and lifecycle metadata required by the eventual contract;
- `definitions/relationships/relationships.yml` continues to own signature meaning;
- consumer edge records own concrete domain relationship meaning;
- the compiler joins node and edge sources into generated graph, provenance,
  Markdown, obligation, test, and receipt projections.

Node files must not duplicate authoritative outgoing connections. Any convenient
node-local edge view is generated and drift-checked only.

### Rejected option — Keep every connection source-node-owned

This would preserve layout A and minimize source files, but the all-signature,
cross-feature release requirement has triggered that design's documented expiry
condition. Per-edge ownership, evidence, version, and review would remain indirect.

### Rejected option — Hybrid same-feature and cross-feature ownership

This would put same-feature connections in nodes and cross-feature connections in
edge files. It models an ownership distinction, but creates two authoring and compiler
paths for the same relationship abstraction.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `2`. The choice accepts the
cost of more source files in exchange for one uniform relationship lifecycle that can
support exact `16/16` evidence, cross-feature review, and per-edge provenance.

### Downstream impact

- The earlier layout-A selection is superseded only for connection ownership; JSON
  node source and YAML formation authority remain selected.
- The successor compiler/profile needs an independent edge-source schema, discovery
  root, validation route, provenance mapping, negative fixtures, and digest binding.
- The prior `feature-with-independent-node-files@1` profile and its per-node
  connections remain unchanged historical experimental evidence.
- The successor profile identity/version must make the source-layout change explicit.
- No source schema, registry, profile, compiler, fixture, or plan mutation is
  authorized by this decision alone.

## Resolved Decision 6: Successor Profile Identity

### Question

How should the materially different independent-node-and-edge source layout be
identified without invalidating existing experimental evidence?

### Selected option — New profile family

The successor profile identity is:

```text
feature-with-independent-node-and-edge-files@1
```

Its initial status is `candidate`. It has no release-admission or production effect
until the selected machine contract, negative controls, resolver, source digest,
compilation, traversal, implementation-binding, and independent verification gates
pass and the owning profile/release decision explicitly promotes it.

The existing `feature-with-independent-node-files@1` profile remains unchanged,
experimental, reproducible evidence for its four kinds, three relationships, and
per-node connection layout.

### Rejected option — Version 2 of the existing node-only family

`feature-with-independent-node-files@2` would preserve family continuity but
under-describe a source model in which relationship instances have independent
canonical files and lifecycle.

### Rejected option — Widen the existing version 1 in place

This would change the meaning and digest inputs of historical experimental evidence,
making prior receipts irreproducible and erasing the boundary between witnessed and
candidate mechanisms.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1` after reviewing the
spec-ontology node-layering findings. A separate profile family matches the findings'
rule that independent connection files are optional until fully schema-bound,
digested, compiled, and receipt-bound, while still preserving one semantic graph from
one selected source set.

### Downstream impact

- The new profile needs an explicit node root, edge root, profile registry row,
  schemas, resolver, source manifest, digest algorithm, compiler route, and receipt.
- Same-feature edge proof precedes cross-feature proof; `produces-for` and
  `triggers-cross` cannot count as exercised until endpoint ownership and digest
  coverage pass.
- The candidate ontology-envelope work does not gain a kind or relation from this
  profile decision; `Authority Envelope`, `Concept`, and `instantiates` remain
  provisional and outside the exact 13/16 set.
- No registry, schema, resolver, source, graph, or plan mutation is authorized by
  this decision alone.

## Resolved Decision 7: Node And Edge Source-Root Topology

### Question

Where do independent same-feature and cross-feature edge records live, and which
owner boundary controls them?

### Selected option — Feature-local same-feature edges and project-level cross-feature edges

The candidate consumer source topology is:

```text
project.json
specs/
  <feature-id>/
    feature.json
    nodes/
      <node-id>.json
    edges/
      <same-feature-edge-id>.json
  edges/
    <cross-feature-edge-id>.json
generated/
  graph.json
  source-manifest.json
  SPEC.md
  obligations/
  tests/
  build-receipt.json
```

One edge-record schema governs both roots. The distinction is ownership and resolver
scope, not relationship semantics:

- a same-feature edge is owned within the source feature;
- a cross-feature edge is project-level source and requires explicit approval from
  both endpoint feature owners;
- both roots join the same selected profile source set and compile into one semantic
  graph;
- source records, generated projections, and release receipts remain separate
  authority namespaces.

### Rejected option — Store every edge with its source feature

This would extend current feature locality most directly, but cross-feature target
ownership and conflict review would remain indirect inside a source-owned record.

### Rejected option — Put all nodes and edges at project level

This would simplify discovery and digest construction, but flatten feature ownership,
weaken edit locality, and require the largest migration from the current project and
feature manifest structure.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `2`. It preserves current
feature-local node ownership, gives same-feature edges the same locality, and gives
cross-feature edges the two-owner project boundary required by the node-layering
findings, while retaining one schema, profile, source set, and semantic graph.

### Downstream impact

- `feature.json` must enumerate its node and same-feature edge sources.
- `project.json` must enumerate project-level cross-feature edge sources in addition
  to feature manifests and the contained generated root.
- The resolver and source manifest must reject duplicate IDs, wrong-root scope,
  missing endpoint ownership, path escape, stale digest, and an edge declared in both
  roots.
- Same-feature formation/compilation/traversal evidence must pass before the
  project-level cross-feature root can contribute release evidence.
- No manifest schema, resolver, source tree, generated tree, or plan mutation is
  authorized by this decision alone.

## Resolved Decision 8: Positive Relationship Exercise Standard

### Question

What evidence is required before one of the 16 backend signatures counts as
positively exercised?

### Selected option — Causal composition proof

Each signature must pass all of these layers:

1. an admitted edge record validates against the selected schema and exact signature,
   endpoint, scope, and ownership contract;
2. clean compilation emits deterministic semantic edge bytes and source provenance;
3. bounded traversal returns the expected ordered IDs and digest;
4. an explicit active edge-to-composition binding derives a deterministic
   implementation obligation;
5. removing the active edge or its binding removes the composed obligation;
6. mutating its signature, direction, endpoint kind, scope, ownership, or digest is
   rejected or changes the exact governed obligation as specified.

A signature is not exercised merely because its registry row loads, an edge compiles,
or a traversal reaches its target. Runtime/pilot occurrence is also not required for
every signature; that is a separate product-witness claim.

### Rejected option — Compile and bounded traversal only

This would prove graph mechanics but not that the relation affects implementation.
The node-layering findings explicitly separate compilation, traversal, and causal
implementation binding.

### Rejected option — End-to-end runtime occurrence for all 16

This would provide stronger behavioral evidence but force every backend relationship
into deployed or pilot scenarios even when the Body War witness does not require it.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `2`. It matches the
node-layering findings' Phase 3 standard and the system-builder goal: a relationship
must make a falsifiable difference to generated implementation obligations without
inflating structural evidence into runtime or business correctness.

### Downstream impact

- The exact `16/16` denominator needs one active composition binding, positive edge,
  bounded traversal, causal removal test, and typed negative/mutation evidence per
  signature.
- The independent obligation catalogue must specify expected composition effects
  before the engine derives them.
- Edge compilation and traversal receipts cannot close the relationship claim by
  themselves.
- Body War runtime evidence may cover only its relevant subset and must not be used as
  a substitute for the remaining composition proofs.
- No binding vocabulary, engine rule, fixture, generated obligation, test, or plan
  mutation is authorized by this decision alone.

## Resolved Decision 9: Positive Node-Type Exercise Standard

### Question

What evidence is required before one of the 13 backend types counts as positively
exercised?

### Selected option — Causal node-to-pattern proof

Each backend type must pass all of these layers:

1. a positive node source validates against the admitted node envelope and its
   YAML-owned formation criteria;
2. meaningful empty, malformed, discriminator, and nearest-neighbour mutants fail;
3. clean compilation emits deterministic semantic node bytes and source provenance;
4. an explicit active node-to-pattern binding derives a deterministic implementation
   obligation or output contract appropriate to the type;
5. removing the active node or its binding removes that implementation effect;
6. changing formation-significant content changes or invalidates the exact governed
   effect as specified.

A type is not exercised merely because its registry row, schema, or node parses and
compiles. Runtime/pilot occurrence is not required for every type; that remains a
separate product-witness claim.

### Rejected option — Formation and compilation only

This would prove structural representation and formation discrimination, but not that
the node kind changes what an implementer must build or verify.

### Rejected option — End-to-end runtime occurrence for all 13

This would conflate language/system-builder breadth with the bounded concepts needed
by the Body War pilot and make unrelated runtime behavior a profile-admission gate.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `2`. It applies the same
non-collapse rule selected for relationships: compilation is mechanism evidence;
causal binding/removal is implementation evidence. This supports the system-builder
goal without inflating it into deployed product correctness.

### Downstream impact

- The exact `13/13` denominator needs one positive node, YAML formation proof, active
  pattern binding, deterministic implementation effect, causal removal test, and
  typed negative/mutation evidence per kind.
- Pattern admissibility and implementation-effect contracts become owner-gated inputs
  on the backend release path rather than optional APE residue.
- Mapping and State Machine require new positive and causal witnesses; current registry
  or schema presence remains insufficient.
- Body War may exercise only its relevant node subset at runtime and cannot substitute
  for the remaining pattern proofs.
- No pattern registry, node source, schema, compiler, generator, fixture, test, or plan
  mutation is authorized by this decision alone.

## Resolved Decision 10: Completeness Denominator Ownership

### Question

Who defines the expected completeness obligations, and how are they compared with
the obligations the engine generates?

### Selected option — Independent validation-owned `O_spec` catalogue

The completeness denominator is owned by an independent validation catalogue,
`O_spec`, which is frozen and digest-bound before the engine derives `O_gen`.
The catalogue must enumerate the exact expected obligations for node and edge
formation, schema and source resolution, compilation, bounded traversal, causal
composition, causal removal, provenance, and required negative controls for the
selected FPR-02B profile.

The release comparator must prove exact set equality across the governed surfaces:

```text
O_spec = O_gen = T_gen = E_run
```

where `O_gen` is the engine-derived obligation set, `T_gen` is the generated test
set, and `E_run` is the executed evidence set. The validation owner—not the engine
under test—freezes the expected catalogue, its source inputs, and its digest. Any
catalogue, profile, schema, source, or rule mutation invalidates the receipt until
the independent expected set is regenerated, reviewed, and re-bound.

### Rejected option — Derive expectations from the selected profile

This would make the engine define the same expectations against which it is judged,
creating a circular false-green path in which omitted or skipped obligations could
disappear from both the generated set and the expected set.

### Rejected option — Human-reviewed receipt checklist

This would preserve review visibility but leave the denominator non-deterministic,
make exact completeness difficult to compare across runs, and permit checklist
drift without a machine-detectable set mismatch.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. This preserves an
independent oracle for the exact `13/13` node-type and `16/16` relationship claims,
while allowing the engine to generate obligations and tests from the selected
node/edge/YAML source model. It directly addresses the node-layering finding that
compilation, traversal, and causal implementation evidence must remain distinct and
receipt-bound.

### Downstream impact

- `SWU-FPR02-002` must define the `O_spec` schema, owner, canonical source inputs,
  stable obligation IDs, digest algorithm, and exact-set comparator before engine
  implementation is admitted.
- The catalogue must include positive, causal-removal, provenance, and required
  negative obligations for every admitted backend kind and relationship signature;
  registry presence or generated-test presence alone cannot satisfy completeness.
- A build receipt must bind `O_spec`, `O_gen`, `T_gen`, `E_run`, and all source/profile
  digests, and must fail closed on missing, duplicate, stale, skipped, or extra
  obligations.
- No catalogue, schema, profile, engine, fixture, generated output, or plan mutation
  is authorized by this decision alone.

## Resolved Decision 11: Required FPR-02B Evidence Surface

### Question

Which documents, commands, source roots, languages, obligation categories, writes,
generated outputs, and negative controls are mandatory for the backend release gate?

### Selected option — Full fail-closed release surface

FPR-02B requires one exact, machine-checkable evidence surface covering:

- the required context, contract, and decision documents;
- the exact validation and execution commands;
- the selected node and edge source roots, generated root, and language/profile
  denominators;
- all 13 backend node kinds and all 16 backend relationship signatures;
- YAML formation, node/edge schema validation, source resolution, compilation,
  bounded traversal, causal node/edge composition, causal removal, provenance, and
  independent `O_spec` equality;
- generated tests, executed evidence, build receipts, and only the declared writes;
  and
- stable fail-closed negatives for missing, empty, malformed, unknown,
  discriminator/nearest-neighbour mismatch, duplicate, orphan, wrong-root or
  wrong-scope, stale-digest, skipped/todo, and surviving-mutation cases.

Every required command and obligation must be present, execute, and bind to the
source/profile/schema/registry digests named by the receipt. Any omitted, extra,
duplicate, stale, skipped, or surviving obligation fails the release gate. The
Body War runtime subset may provide product evidence for its relevant concepts, but
cannot discharge the remaining backend breadth obligations.

### Rejected option — Engine-core surface

This would preserve the 13/16 causal proofs and `O_spec` while deferring provenance,
receipt, source-root, and broad negative coverage. It would make the selected
completeness claim non-fail-closed at the exact boundaries where missing or stale
evidence can otherwise survive.

### Rejected option — Pilot-minimal surface

This would gate only Body War-relevant concepts and turn the already selected
13/13 and 16/16 backend breadth into catalogue targets rather than release claims.
It is incompatible with the resolved backend completeness denominator.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. This makes the
backend lane's completeness claim auditable at the source, compiler, evidence, and
negative-control boundaries, and preserves the independent UI lane without treating
UI evidence as a backend prerequisite.

### Downstream impact

- `SWU-FPR02-002` must freeze the required artifact manifest, command manifest,
  source-root/language manifest, obligation taxonomy, declared-write policy,
  generated-output manifest, and stable-negative catalogue.
- The resolver, compiler, test generator, runner, and receipt validator must fail
  closed on every listed absence, mismatch, mutation survivor, or digest drift.
- The release claim remains exact-profile bounded: backend 13/13 node types and
  16/16 backend signatures, not UI or full-language completeness.
- No manifest, schema, profile, engine, fixture, generated output, or plan mutation
  is authorized by this decision alone.

## Resolved Decision 12: Interactive Ontology Learning Map As Consumer Proof

### Question

Can `cyberAlchemy-v2/development/interactive-ontology-learning-map` serve as an
independent proof surface for the backend test engine, and what authority does that
proof carry?

### Selected option — Independent read-only consumer-proof lane

The interactive ontology learning map is adopted as the downstream consumer-proof
lane for BTE outputs. It must consume an explicit candidate or owner-issued graph
handle through its DomainSpec `Sg`/projection adapter and independently verify:

- source, profile, graph, obligation, and receipt identity/provenance bindings;
- unchanged imported node and relationship identities;
- deterministic semantic bytes, `semanticHash`, projections, layouts, indexes, and
  ETags across clean repeated builds;
- learner/navigation mutation isolation from semantic bytes;
- graph, hierarchy, table, and GET-only read-surface parity; and
- fail-closed missing, empty, mismatched, unapproved-mapping, and retraction-mutant
  behavior with explicit residue.

The proof artifact must carry the BTE/profile posture, source-manifest digest,
`O_spec`/`O_gen`/`T_gen`/`E_run` references, projection hashes, negative results, and
whether the input is `candidate` or `authoritative`. Craft may index and route that
receipt as continuation evidence; it does not become semantic authority.

### Rejected option — Treat the learning map as the BTE oracle or release authority

This would collapse the independent denominator, projection, and release
boundaries. The learning map cannot define `O_spec`, admit a profile, mint
relationships, close FPR gates, or authorize production.

### Rejected option — Rebuild DomainSpec semantics inside the learning map

This would duplicate the graph and make feature tables or learner fixtures a
parallel semantic source. The IOLM contract explicitly requires unchanged import of
owner-produced `Sg` and retains incompatible local mappings as residue.

### Selection and rationale

Selected by the operator on 2026-07-17 by directing that the interactive ontology
learning-map package be used as proof. This is the narrowest useful interpretation:
it gives the BTE an independent downstream consumer witness while preserving the
DomainSpec, Craft, and CyberAlchemy authority boundaries.

### Downstream impact

- BTE must emit a stable consumer-proof handoff containing graph/source-manifest
  identity, obligation/receipt digests, and explicit candidate/authoritative posture.
- IOLM `G-DSV2-SG` readiness remains a prerequisite for authoritative FPR graph use;
  a candidate minted-project input may be used only with candidate labeling and
  non-admission language.
- The IOLM prototype/compiler remains a future Task Session under its existing
  write scope (`prototype/src/**` and `prototype/tests/**`); no implementation is
  authorized by this decision alone.
- Craft integration is a receipt/index synchronization step, not a semantic graph
  write or a replacement for the live DomainSpec Craft ledger.
- This decision does not resolve Body War provider posture, callback/origin
  security, or final claim/owner decisions.

## Resolved Decision 13: Body War Consumer Boundary And Integration Home

### Question

Should Body War provide external provider evidence to the backend release gate, or
consume the DomainSpec engine/profile outputs alongside the interactive ontology
learning map?

### Selected option — Consumer-only Body War under the DomainSpec v2 working home

Body War is a downstream consumer of the DomainSpec v2 engine/profile contract. It
does not provide an external provider, callback, or live-service posture required to
admit the backend profile. Its consumer fixture, adapter, proof handoff, and any
later product-witness receipts are staged under:

```text
cyberAlchemy-v2/development/domainspec-v2/
```

The consumer topology is:

```text
projects/domainspec-v2/                 # private engine/profile authority
  -> graph/source/obligation/receipt handoff
cyberAlchemy-v2/development/domainspec-v2/  # consumer integration home
  |- interactive ontology learning-map consumer proof
  |- Body War consumer fixture/adapter
  `- Craft-linked proof and continuation receipts
```

Body War may consume candidate or owner-issued outputs only with an explicit
`candidate` or `authoritative` posture, stable source/profile/graph/receipt
identities, and the same fail-closed provenance and negative-control rules as the
IOLM consumer. A live Body War runtime or pilot can strengthen a downstream product
witness, but it cannot define `O_spec`, admit a backend kind or relationship, close
an FPR gate, or authorize production.

The target directory is a working integration home, not a replacement authority:
its current README identifies it as candidate/working material governed by the
CyberAlchemy Craft context. DomainSpec source/profile/engine authority remains in
the private `projects/domainspec-v2` owner route until a separate migration decision
is made.

### Rejected option — Body War as a provider-gated backend dependency

This would make an application consumer's external integration posture a prerequisite
for proving the reusable backend engine and would couple FPR-02B to a product/runtime
surface outside the engine's exact profile claim.

### Rejected option — Duplicate the engine and profile inside the consumer home

This would create two semantic authorities, split digests and receipts, and make the
IOLM and Body War consumers capable of drifting from the DomainSpec owner route.

### Selection and rationale

Selected by the operator on 2026-07-17 by directing that Body War be a consumer and
that everything consumer-facing live inside the `cyberAlchemy-v2/development/domainspec-v2/`
working home. This aligns Body War with the IOLM proof posture and preserves the
private/public and source/consumer boundaries.

### Downstream impact

- The Body War provider-posture blocker is removed; no dual-fixture, fake-only, or
  real-provider choice is required for FPR-02B admission.
- The next refresh must create or register consumer-facing contracts under the
  target working home, including a Body War fixture/adapter and shared proof-handoff
  shape with IOLM.
- Craft should index consumer proof receipts and owner routes; it must not absorb
  engine semantics or become a second graph authority.
- The target package remains private and candidate/working until its own gates pass;
  no public `arcanum/` output follows.
- No consumer code, profile, schema, manifest, Craft ledger, or generated artifact
  is authorized by this decision alone.

## Resolved Decision 14: Body War Consumer Security Boundary

### Question

What callback, deployment, origin, consent, CSRF, and redaction posture is required
for the Body War consumer surface?

### Selected option — Private read-only consumer

Body War consumes immutable DomainSpec graph, obligation, projection, and receipt
artifacts inside the private
`cyberAlchemy-v2/development/domainspec-v2/` working home. FPR-02B does not expose an
inbound Body War callback, deployed consumer endpoint, or external origin as a
profile-admission dependency.

The consumer contract is therefore:

- no callback route or network provider integration is required for backend-profile
  admission;
- no deployment-origin allowlist is active for the private read-only consumer;
- any future interactive UI must add explicit consent and CSRF controls before it
  accepts mutation-capable input; and
- any Body War evidence projection must use an exact redacted-field allowlist and
  fail closed on undeclared fields, private-path leakage, or unapproved source
  material.

Body War remains a consumer proof/product-witness surface. Its read-only use can
verify input identity, provenance, projection behavior, and declared redaction, but
it cannot close the engine's profile, obligation, semantic, or release gates.

### Rejected option — Signed local callback

This would introduce callback signatures, development-origin policy, consent/CSRF
handling, and a network boundary that the consumer proof does not need.

### Rejected option — Hosted callback

This would expand FPR-02B into deployment, origin, service security, and operational
support work, exceeding the private consumer scope and the exact backend profile claim.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. This keeps Body War
inside the same private, read-only consumer boundary as IOLM and avoids turning a
downstream product surface into a provider or callback authority for the reusable
DomainSpec engine.

### Downstream impact

- The callback/deployment/origin blocker is closed for FPR-02B admission.
- Any future Body War UI or mutation route requires a new explicit security decision;
  it is not implied by this private read-only posture.
- The next consumer contract must enumerate the redacted-field allowlist and private
  output channels even though no network endpoint is present.
- No callback, deployment, origin, consent, CSRF, redaction policy file, consumer
  code, or generated artifact is authorized by this decision alone.

## Resolved Decision 15: Required Integrated Evidence Manifest

### Question

Should the release evidence manifest require the backend engine and both consumer
proof surfaces together, or can the consumer proof remain optional or deferred?

### Selected option — Full integrated manifest

The FPR-02B evidence manifest must require one exact, digest-bound package spanning:

1. the BTE source/profile/schema/registry inputs, node and edge roots, generated
   root, required commands, `O_spec`, `O_gen`, `T_gen`, `E_run`, receipts, and all
   declared writes;
2. the IOLM consumer-proof handoff under
   `cyberAlchemy-v2/development/domainspec-v2/`, including imported graph identity,
   semantic/projection hashes, view parity, deterministic rebuild, and negative
   results; and
3. the Body War consumer fixture/adapter handoff under the same working home,
   including consumer posture, source/profile/graph/receipt identity, redaction
   allowlist result, and private read-only proof.

The manifest must also enumerate the exact generated outputs, Craft-linked receipt
or continuation pointer, and stable fail-closed negative classes. Missing, extra,
stale, duplicate, skipped, unrunnable, or surviving-mutant evidence fails the
integrated gate. The FPR-02U development lane remains separate; this manifest does
not admit UI concepts or create a backend/UI completion join.

### Rejected option — Backend-only manifest

This would make the IOLM and Body War proof surfaces optional and would permit a
backend completeness claim without demonstrating that the selected consumers can
read and preserve the resulting graph and receipts.

### Rejected option — Two-stage manifest

This would allow backend admission before the required integrated consumer proof,
creating a window in which the engine claim could be promoted without its selected
downstream proof contract. It is incompatible with the operator's direction that
the consumers and their evidence live together under the DomainSpec v2 working home.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. This makes the
engine-to-consumer path one auditable release surface while preserving the
source/consumer, Craft/read-model, and backend/UI lane boundaries.

### Downstream impact

- `SWU-FPR02-002` must freeze the integrated manifest schema, exact path/command
  lists, digest bindings, declared-write policy, generated-output set, and
  consumer-proof receipt shape before implementation is admitted.
- BTE, IOLM, and Body War cannot independently claim the integrated proof; the
  manifest comparator must bind all required handoffs and negative results.
- The consumer home remains candidate/working until its own IOLM and Body War gates
  pass; no production or public Arcanum claim follows.
- No manifest, schema, profile, consumer adapter, Craft pointer, generated output,
  or implementation file is authorized by this decision alone.

## Resolved Decision 16: Claims, Rollback, And Accountable Owners

### Question

What exact claims may the FPR-02B package make, what happens when its evidence is
invalidated, and which governed roles are accountable for the result?

### Selected option — Conservative exact-profile contract

The FPR-02B package may claim only:

- exact backend node breadth: `13/13` admitted and positively exercised kinds;
- exact backend relationship breadth: `16/16` admitted and positively exercised
  signatures;
- YAML formation, node/edge resolution, deterministic compilation, bounded
  traversal, causal node/edge composition and removal, provenance, and fail-closed
  negative evidence; and
- the integrated BTE + IOLM + Body War consumer-proof manifest passing its exact
  digest and execution comparisons.

The package must explicitly exclude semantic satisfiability, business correctness,
universal code/spec equivalence, UI or full-language completeness, production
readiness, public release, hosted-service behavior, and any claim that a Body War or
IOLM consumer proves the upstream DomainSpec authority by itself.

Rollback and revocation are fail-closed evidence operations:

1. any source, profile, registry, schema, edge/node, manifest, rule, consumer
   posture, or receipt-input change invalidates the affected digest-bound receipt;
2. the integrated package and its consumers move to `blocked`/`revoked` posture and
   must stop treating stale outputs as valid; and
3. recovery requires a corrected source set, regenerated independent `O_spec`, a
   new deterministic run, killed-negative replay, and a new owner-reviewed receipt.

No silent in-place repair or automatic production rollback is implied because
production is not authorized by this gate.

Accountability is role-bound and must be named in the integrated manifest and
receipt:

- claim and semantic owners: admit the exact profile, relationship, and claims;
- validation owner: freezes and verifies `O_spec` and the exact-set comparison;
- engine owner: maintains BTE derivation, tests, and source/provenance bindings;
- IOLM consumer owner: accepts only the declared candidate/authoritative posture and
  verifies projection invariants;
- Body War consumer owner: maintains the read-only fixture/adapter and redaction
  proof; and
- Craft continuation/release authority: indexes receipts and controls continuation
  or release decisions without becoming semantic authority.

### Rejected option — Broader product claim

This would include Body War behavior or application correctness without the required
runtime, operational, or product evidence and would exceed the exact backend profile
boundary.

### Rejected option — Minimal structural claim

This would omit the already selected integrated consumer-proof manifest and weaken
the claim below the evidence surface the operator required.

### Selection and rationale

Selected by the operator on 2026-07-17 by choosing option `1`. The conservative
contract keeps every claim no broader than the independent engine, consumer, and
receipt evidence, while making invalidation and owner accountability explicit.

### Downstream impact

- The FPR-02B Decision Gate has no remaining blocker-level decisions.
- Implementation may proceed only through a separate authorized Invoke/Task Session
  route that consumes this record; this PASS does not itself mutate schemas, profiles,
  consumers, Craft, or generated artifacts.
- Production authorization remains `false`; public Arcanum output remains out of
  scope.

## Remaining Sequential Blockers

No blocker decisions remain. Deferred future work remains explicitly outside this
gate: UI-inclusive profile admission, hosted callbacks, public Arcanum derivatives,
semantic satisfiability, broader product correctness, and any production release act.

## Gate State

- Result: `PASS`.
- Decisions resolved: 16.
- Blockers remaining: 0.
- UI lane state: independent and in progress; `SWU-UIP-001..004` are complete and `SWU-UIP-005` is next.
- Backend lane state: Decision Gate complete; resume the next authorized Invoke/Task Session route from `SWU-FPR02-001`.
- Consequential mutation authorized: only through a separate authorized Invoke/Task Session route; no implicit writes follow from PASS.
- `FPR-02B` implementation authorized: no.
- `FPR-02U` execution authority: its existing work-pack and selected-SWU rules;
  no release admission follows.
- Production authorized: no.
