---
artifact: invoke-design
status: candidate-complete-plan-ready
updatedAt: 2026-07-22
docType: design
owner: DomainSpec-v2 backend-type-test-engine-completeness
invokeMode: design
semanticAuthority: none
sourceDefine: DEFINE.md
sourceRequirements: REQUIREMENTS.md
dispatchId: 20260721-bte-contract-completeness-rebase
dispatchStep: s04-design
---

# Design: Backend Graph Composability And Test Derivation

## Start Here

This design turns the accepted BTE definition into one implementable
architecture. The core result is a graph-to-proof bridge inside DomainSpec v2:
it accepts an exact canonical minted-graph build, derives obligations, compares
them with an independently owned catalogue, constructs runnable test bundles,
executes them through exact bindings, kills clean mutations, and emits evidence
that a separate replayer can recompute.

This file is an architecture contract, not DomainSpec language authority. The
machine sources and owner decisions cited below continue to own semantics and
admission. The generated graph, tests, results, receipts, this Markdown, and the
two consumers cannot promote or redefine them.

Read with:

1. [DEFINE.md](DEFINE.md) for the bounded claim;
2. [REQUIREMENTS.md](REQUIREMENTS.md) for acceptance requirements;
3. [GLOSSARY-CONSISTENCY.md](GLOSSARY-CONSISTENCY.md) for terms refined here;
4. [DESIGN-LAYERING-SEED.md](DESIGN-LAYERING-SEED.md) for the dependency order
   that the later Plan must expand without inventing tasks here;
5. [DESIGN-DISTILL-VALIDATION.md](DESIGN-DISTILL-VALIDATION.md) for the smallest
   coherent unit and adversarial review.

## Design Verdict And Boundary

The design is complete enough to enter Invoke Plan. It does **not** admit the
successor profile, the 16 relationship families, a release, or a production
claim. Those are explicit owner gates. Plan may schedule the machine contracts,
implementations, fixtures, validators, and admission packages; implementation
must fail closed while any required admission is absent.

The smallest coherent design unit is an `AdmittedStructuralObligationProof`:

```text
governing source + independently frozen catalogue entry
  -> generated obligation with the same coverage key
  -> one pre-run TestCase bundle
  -> one exact role-typed binding set
  -> compiler-under-test observation
  -> independent bounded evaluation
  -> one clean primary mutation in a child lineage
  -> one independently replayed proof receipt
```

Exact-set aggregates recompose many such units. The versioned formation/source
migration is a prerequisite. Consumer checks are downstream and never part of
the unit's authority.

## Frozen Architecture Decisions

1. Reuse the accepted successor profile identity
   `feature-with-independent-node-and-edge-files@1`; do not create a third
   profile to solve formation authority.
2. Keep current v1 unchanged. The successor uses a versioned YAML-owned
   formation contract plus a complete, machine-checked retirement map for the
   old per-kind JSON formation constraints.
3. The successor is not a profile-row-only change. It requires versioned
   project, feature, node, edge, graph, and source-manifest contracts and a
   resolver that reads independent same-feature and cross-feature edge files.
4. `MintedGraph` plus `MintedSourceManifest` remains the one semantic graph
   projection consumed by BTE. A proof input envelope may point to them; it may
   not become a second authored graph.
5. `O_spec` is authored and frozen by the validation owner, independently of
   obligation generation. It may cite the same governing machine sources but
   cannot be emitted by, or import the algorithm of, the generator.
6. Exact equality is evaluated per named proof catalogue over
   `coverage_key = catalogue_id + obligation_id`. Unlike records retain their
   own IDs and are compared through this projection, never through counts.
7. One required obligation produces one `TestCase` bundle, one
   `ExecutionResult` bundle, and one primary `MutationResult`. Positive,
   negative, and mutation observations are roles inside the bundle. Additional
   diagnostic cases live in a separately named diagnostic namespace. Any extra
   TestCase, execution, or mutation record inside a required catalogue fails
   exact equality; it cannot be hidden by projection.
8. Test construction happens only after `O_spec = O_gen`. The generated
   obligation supplies the subject; the validation-owned entry supplies the
   expected verdict, diagnostic class, or observable delta.
9. The proof evaluator cannot import the compiler, body adapter, criterion
   kernel, obligation generator, or their result-building helpers. It compares
   raw observations with independent expectations; it does not rerun the
   implementation-under-test as its oracle.
10. Mutation is a fresh child lineage with recomputed source, graph, and
    receipt digests. A mutant is killed only by its expected failing phase/code
    or missing causal output, never merely by stale-digest rejection.
11. Receipts are causal indexes. Only an independent `ReplayResult` may enter a
    passing aggregate, and neither object performs admission.
12. DomainSpec core owns core proof. IOLM and Body War own their runners and raw
    consumer evidence. Consumer success cannot define core truth, and core
    completion is not blocked by consumer implementation work.
13. Backend and UI remain independent execution lanes. This design has no UI
    source, test, receipt, or scheduling dependency.
14. V1 evaluator scope is deliberately bounded to formation-structural,
    source-graph-provenance, node-pattern-causal, and
    relationship-graph-causal proof. These cover the accepted structural BTE
    decisions only. Semantic, temporal, SMT, FOL, Datalog, Cedar, and a general
    plugin host are typed unsupported residue.

## Authority Model

`authority` is not one boolean. Every artifact declares one of these roles and
an owner; validators reject role substitution.

| Authority class | What it can establish | Examples | What it cannot establish |
| --- | --- | --- | --- |
| semantic contract | the shape and meaning of an admitted source or rule | kind, relationship, formation, profile, node and edge contracts | admission or successful execution |
| admission decision | that an exact versioned contract/set may govern a lane | profile, relationship-family, evaluator-scope decisions | source content or proof success |
| derived read model | a deterministic projection of admitted sources | minted graph, source manifest, optional lossless proof rows | new semantics or owner approval |
| proof evidence | what ran, what was observed, and whether bounded expectations matched | execution, mutation, receipt, replay | admission, release, or production approval |
| aggregate gate result | whether exact required replay evidence is present and green | core, consumer, terminal BTE aggregates | semantic truth beyond the declared proof scope |
| lifecycle decision | promotion or release action by its external owner | FPR/release record | retroactive proof or source mutation |

Status and ownership are independent axes. A generated artifact can be valid
and green while remaining non-authoritative and non-admitting.

## View 1 — System Context

```text
semantic owners                         validation owner
  | profile/registries/contracts          | frozen O_spec + expectations
  v                                       v
DomainSpec successor sources -> compiler -> canonical graph build
                                      |          |
                                      |          v
                                      +----> BTE graph-to-proof bridge
                                                   |
                                                   v
                                         raw artifacts + receipts
                                                   |
                                           independent replayer
                                                   |
                                  +----------------+----------------+
                                  |                                 |
                             core aggregate                 consumer handshakes
                                                                    |
                                                               IOLM / Body War
```

### Actors and trust boundaries

| Actor | Owns | Must be independent from |
| --- | --- | --- |
| profile/formation/relationship owners | semantic contracts and admission records | proof receipts and consumer assertions |
| source author | node and edge source records | generated graph rows |
| compiler owner | resolution, validation, graph and manifest construction | validation-owned expected outcomes |
| validation owner | proof catalogue, expected predicates/deltas, exact-set policy | obligation generator and compiler-under-test |
| BTE engine owner | obligation derivation, test materialization, binding resolution, execution orchestration | semantic admission |
| evaluator owner | bounded comparison of observation to independent expectation | compiler/kernel/generator implementation path |
| replay owner | handle resolution, digest/set/join recomputation | receipt producer summaries |
| consumer owner | fresh runner and raw consumer evidence | DomainSpec core truth and admission |
| lifecycle owner | release/promotion decision | self-asserted `pass` fields |

### Boundary inputs and outputs

Required core inputs are an admitted profile handle, exact semantic-contract
handles, exact authored source roots, and a validation-owned proof-catalogue
handle. Core outputs are raw build/proof artifacts, proof receipts, independent
replay results, and a core aggregate. Consumers accept only an exact successful
core aggregate handle and return raw consumer evidence for BTE-owned replay.

## View 2 — High-Level Structure

The architecture has four planes with one-way authority flow.

| Plane | Responsibilities | Principal outputs |
| --- | --- | --- |
| A. contract and admission | version profile/source/formation contracts; record exact memberships; prove v1 retirement/migration; resolve owner gates | admitted handles, contract digests, migration and compatibility results |
| B. source and graph | resolve independent node/edge sources; validate formation and relationships; build the only canonical normalized graph and manifest | `MintedGraph`, `MintedSourceManifest`, build receipt |
| C. proof and evidence | load independent catalogues; derive/compare obligations; materialize tests; bind, execute, evaluate, mutate, receipt, replay, aggregate | obligations, test/result bundles, mutation results, proof receipts, replay results, core aggregate |
| D. consumers and lifecycle | run IOLM and Body War after core; replay consumer evidence; compose terminal gate; leave promotion external | consumer replay results, consumer aggregate, terminal BTE gate result |

Dependency direction is A -> B -> C -> D. Evidence may point backward to exact
handles, but it cannot mutate or admit an upstream plane.

## View 3 — Low-Level Components And Contracts

These are logical boundaries. Invoke Plan may select filenames and internal data
structures, but it must preserve the interfaces and forbidden dependencies.

### A. Contract and admission components

#### Successor profile package

The accepted profile ID is
`feature-with-independent-node-and-edge-files@1`. Its machine record declares:

- profile ID/version/status and owning admission handle;
- exact kind, relationship-family, formation-catalogue, and source-layout IDs;
- project/feature/node/edge/graph/manifest contract handles and digests;
- kind, relationship, formation, kernel, and adapter registry handles/digests;
- `formation_authority: yaml-formation-v2`;
- separate same-feature and cross-feature edge roots;
- current-v1 predecessor and migration-package handles.

The existing `supported-profiles.yml` is JSON text consumed with `JSON.parse`.
The design does not silently change its serialization or promise a general YAML
profile loader.

#### YAML formation v2 contract

The successor owns a distinct versioned formation-v2 source root,
`impl/spec/meta-types/formation-v2/`, with a catalogue manifest and one machine
handle per backend kind. Its 13 YAML contracts bind one kind to:

- a versioned `required_structure` tree using a closed structural vocabulary:
  object/array/scalar type, required members, closed/open object disposition,
  minimum cardinality, nonempty string, unique items, closed value sets, and
  referenced-field existence;
- zero or more kind-scoped criterion records with stable IDs, rule IDs,
  normalized parameters, and diagnostic codes;
- an exact contract digest and compatibility predecessor.

The structural tree is schema-validated before evaluation. Unsupported
keywords block admission rather than being ignored. This is a bounded
formation language, not a general validation or theorem-proving framework.

The current YAML contract files outside `formation-v2/`, their paths, bytes,
and digests remain frozen
as current implementation and compatibility-replay evidence; this does not
upgrade their authority over current-v1 JSON formation declarations. The
successor catalogue uses new versioned handles and cannot overwrite or
reinterpret those bytes in place.

Design selects the following candidate successor contracts. They remain
non-admitted until the formation owner accepts their exact machine handles:

- Entity field name/type as nonempty strings, identity as boolean, at least one
  field, at least one identity field, and closed item shape;
- Interface `interface_kind` as exactly the owner-admitted
  `external | internal` domain;
- Mapping `direction` as exactly the owner-admitted
  `inbound | outbound | bidirectional` domain;
- Value Object equality as a structural declaration; v1 uses
  `equality: { strategy: field-tuple, fields: [<field-name>...] }`, with a
  nonempty unique list whose entries resolve to declared fields. Substring
  search for `equal` is forbidden.

The Entity body `{"fields":[{"type":7,"identity":"yes"}]}` must fail with
the expected formation-structure type diagnostic. A profile or digest error is
not the required kill reason.

#### JSON-retirement map and compatibility corpus

The retirement map has one record per normalized assertion extracted from every
current-v1 per-kind JSON formation schema:

- predecessor schema ID/version/digest, JSON pointer, keyword, normalized
  constraint fingerprint;
- successor structure path or criterion ID/version/digest;
- disposition: `preserved`, `transformed`, `successor-rejects`, or
  `owner-retired`;
- transformation note or exact owner-decision handle;
- compatibility fixture IDs and expected successor diagnostic when relevant.

An independent validator extracts predecessor assertions and requires an exact
bijection with map records. Missing, duplicate, unsupported, or unapproved
retirement records block successor admission. The corpus records current-v1
expectation, successor expectation, transformation/disposition, diagnostic, and
all governing digests. It includes the mandatory Entity false green.

The node-source migration map separately accounts for removal of embedded
`connections` and creation of independent edge sources. There is no fallback
that tries current and successor contracts until one passes; the explicit
profile selects exactly one path.

### B. Source and graph components

#### Successor resolver and source contracts

The source envelope is the previously accepted layout:

```text
project.json
specs/<feature-id>/feature.json
specs/<feature-id>/nodes/<node-id>.json
specs/<feature-id>/edges/<same-feature-edge-id>.json
specs/edges/<cross-feature-edge-id>.json
generated/...
```

The successor has versioned project, feature, node, and edge schemas. A node no
longer owns authoritative `connections`. Each edge owns stable ID, relationship
family/signature, from/to IDs, scope, direction data where applicable, source
anchor/digest, and ordinal where the admitted relationship is ordered.
`orchestrates` requires and preserves ordinal.

The resolver rejects path/ID mismatch, missing or extra source records,
duplicate IDs, root/scope mismatch, absent endpoints, wrong endpoint kinds,
unadmitted signature/scope/direction, ambiguous ordering, and path escape.

#### Formation and relationship validation

The compiler-under-test continues to use the shared criterion kernel and minted
body adapter where their contracts fit. It adds independent evaluation of the
v2 structural tree and makes profile-selected formation contracts executable;
it may not ignore `formation_schemas`, filter away governing body failures, or
accept an unsupported structural keyword.

Profile-version dispatch is explicit: current v1 continues resolving its
existing files and behavior without byte changes; only
`feature-with-independent-node-and-edge-files@1` resolves the new
`formation-v2/` catalogue and successor evaluator. There is no shared fallback
or path probe that can reinterpret one profile through the other's contracts.

Relationship validation consumes only admitted signatures and performs exact
endpoint, scope, direction, multiplicity, and ordering checks. The accepted
16-family planning set remains admission-blocked until its owner handle exists.

#### Canonical graph build

Graph v2 carries profile/source-set and governing contract digests, normalized
nodes, and normalized edges including scope, provenance, and ordinal. Manifest
v2 points every node and edge directly to its authored source; an independent
edge may not inherit a node-file provenance row.

The proof input is a typed handle envelope over the graph, manifest, build
receipt, profile, registries, formation catalogue, and source-set digest. Any
materialized proof rows are lossless derived projections with an exact
ID/digest bijection to graph/manifest rows. They are neither authored nor a
second semantic graph.

#### ProofContext propagation envelope

One immutable `ProofContext` handle binds the profile, kind registry,
relationship registry, formation schema/criterion catalogue, kernel, body
adapter, compiler, source set, graph, manifest, and build identities, versions,
and content digests. Graph, obligation, TestCase, binding, ExecutionResult,
MutationResult, ProofReceipt, and ReplayResult records carry that exact context
handle plus their relevant local handles. Validators reject missing or
incompatible context at every join; no downstream record can partially restate
or silently update the context.

### C. Proof and evidence components

#### Proof catalogues and denominators

The earlier three source inventories remain distinct: `D_kind=13`,
`D_form=16`, and candidate `D_rel=16`. Design adds proof catalogues so dynamic
graph instances are never confused with those inventories.

| Catalogue ID | Exact membership | Required primary proof | Core status |
| --- | --- | --- | --- |
| `formation-criterion@1` | 16 kind/schema/criterion identities | positive plus discriminating-negative roles and one clean criterion mutant per member | required after successor formation admission |
| `formation-structure@1` | 13 kind/schema structure identities (`D_structure=13`, derived from `D_kind`) | valid body plus missing/wrong-structure roles and one clean structure mutant per member | required after successor formation admission |
| `node-kind-causality@1` | 13 kind identities with owner-selected canonical witnesses/effects | admitted formation, graph preservation, binding, and removal changing the declared observable effect | required by FPR-02 Resolved Decision 9 after successor profile/pattern admission |
| `node-instance-conformance@1` | exact node IDs in the graph build | full formation, exact graph/provenance preservation, and one declared primary source mutation per node | dynamic and required for every core build |
| `relationship-family-causality@1` | exact 16 admitted family identities, never endpoint/scope expansions | one selected witness/effect, positive composition, clean removal or typed negative, and expected observable delta | admission-blocked; mandatory for final all-backend core |
| `edge-instance-conformance@1` | exact edge IDs in the graph build | signature/endpoint/scope/order/provenance preservation and one primary edge mutation per edge | dynamic after relationship admission |

Each catalogue has its own owner, version, admission handle, membership digest,
expected-case catalogue, and receipt. A catalogue is nonempty when required.
`D_structure` is not added to `D_form`; it names the 13 structure obligations
already required by `FORM-004`. Endpoint-pair, scope, multiplicity, inverse, and
extra diagnostic mutants cannot silently enlarge any denominator.

Terminal `verify:bte:core` requires all six catalogues for the admitted
all-backend successor. Before relationship admission, catalogue-local work may
run and emit explicitly incomplete evidence, but the terminal core command
must fail with admission residue.

#### Validation-owned obligation catalogue (`O_spec`)

Each entry carries:

- catalogue ID/version/digest and stable logical obligation ID;
- profile/kind/schema/criterion or relationship-family logical handles;
- governing source IDs/digests and source anchors;
- subject-selector contract;
- required case roles;
- expected verdict plus diagnostic class or observable ID/delta;
- primary mutation declaration and expected failing stage/code;
- evaluator interface ID/version/scope;
- lifecycle status and validation-owner freeze receipt.

Logical IDs use a versioned, domain-separated canonical tuple such as
`catalogue/profile/kind-or-family/criterion-or-instance`. Content digests are
not part of logical identity. A content change therefore keeps the logical
member recognizable but makes its old binding/evidence stale and reopens it.

The validation owner may generate mechanical IDs from its independently
authored catalogue, but it may not invoke the BTE obligation derivation
algorithm. Review/freeze is performed before the corresponding graph run.

#### Causal proof selections

Two bounded, owner-gated machine catalogues supply the effects referenced by
`O_spec`; they are not a universal pattern or rule framework. The node
catalogue implements FPR-02 Resolved Decision 9, and the relationship catalogue
implements Resolved Decision 8:

- the node-pattern selection has exactly one row per admitted backend kind and
  names the active node-to-pattern binding, canonical witness selector,
  implementation-obligation or output-contract identity, and expected effect
  removed when the node or binding is removed;
- the relationship-composition selection has exactly one row per admitted
  relationship family and names the selected endpoint/scope witness, active
  edge-to-composition binding, ordered traversal expectation where applicable,
  generated implementation-obligation identity, and expected removal delta.

These selections are semantic/admission inputs owned outside the generator.
The generator may consume them only through exact admitted handles. They do not
authorize endpoint/scope expansion beyond the exact 13/16 catalogues.

The current BTE `REQUIREMENTS.md` does not give Resolved Decision 9 its own
node-pattern requirement row. That is a traceability omission, not permission
to drop an accepted FPR-02 decision. Invoke Plan must repair the requirement
trace while regenerating the stale package; it does not need a new human choice
unless the owner proposes changing Decision 9.

#### Generated obligation and exact comparator

The derivation engine consumes only the proof input envelope and emits `O_gen`
with source/graph anchors. It does not read Markdown or manufacture expected
outcomes. Before tests exist, the comparator checks:

```text
Set(O_spec.coverage_key) == Set(O_gen.coverage_key)
and every joined governing identity/version/digest is compatible
```

It reports missing, extra, duplicate, stale, or mismatched members
deterministically. The old round-trip comparator's subset/extra-tolerant
behavior is not reused for completeness.

#### TestCase

A `TestCase` is a pre-run instruction. It has its own stable ID and exactly one
target `coverage_key`. It joins the generated subject with the independently
specified expectations and contains:

- required case roles, normally `positive`, `discriminating-negative`, and
  `primary-mutant` as selected by the catalogue;
- fixture and adapter handles/digests;
- expected verdict, diagnostic class, or observable delta per role;
- required evaluator and runtime interface handles;
- typed residue if materialization is impossible.

There is exactly one required TestCase bundle per obligation. A `todo`, `skip`,
empty role, unsupported scope, or missing expectation is blocking residue.

#### Binding and exact resolver

Bindings are explicit records, not predicates. For every
`(test_id, case_role)` the resolver requires exactly one record binding exact
fixture, adapter, compiler/runtime, and evaluator IDs/versions/digests. Zero,
two, wildcard, subset, first-match, stale, or incompatible bindings fail before
execution. Bindings do not contain expected truth.

#### Compiler under test, runner, and evaluator

The runner invokes the exact compiler/runtime handle from the binding and
captures raw exit state, diagnostics, produced artifact handles, and observable
IDs/deltas. It does not write `pass` as proof.

The v1 evaluator supports only four interfaces:

- `formation-structural`: compare observed acceptance/rejection and normalized
  diagnostic class with the validation-owned expectation;
- `source-graph-provenance`: compare exact source IDs/digests with normalized
  graph/manifest IDs, provenance, scope, and ordering without deriving semantic
  expectations;
- `node-pattern-causal`: compare before/after implementation-obligation or
  output-contract IDs with the validation-owned node-pattern expectation;
- `relationship-graph-causal`: compare before/after normalized observable IDs,
  order, and declared delta with the validation-owned expectation.

The evaluator has no dependency on compiler, resolver, formation adapter,
criterion kernel, graph builder, or obligation/test generator code. Unsupported
scope returns typed residue and blocks a claim that requires it.

#### ExecutionResult and MutationResult

An `ExecutionResult` is a post-run observation-and-verdict bundle. It has its
own ID, targets one `coverage_key`, preserves per-role raw observations, binds
all exact inputs/runtime/evaluator digests, and records evaluator verdict and
residue separately. It is not a TestCase and cannot rewrite expectations.

A `MutationDeclaration` identifies one semantic edit, base lineage, expected
failing phase/code or removed observable, and invariants that must stay fixed.
The mutation runner creates a fresh child source build with recomputed graph
and manifest digests, runs the same profile/contract/evaluator versions, and
emits one `MutationResult` per required obligation. Normal replay rejects base
receipts against child bytes; mutation proof accepts only the fresh child
receipt with the expected causal kill. Digest mismatch alone is not a kill.

#### Receipt, replay, and aggregates

A compiler-owned `BuildReceipt` ends at exact contracts, sources, compiler,
graph, and manifest handles. It cannot mention or judge downstream obligations,
tests, executions, or mutations. A BTE-owned `ProofReceipt` starts from the
immutable build handle and indexes the proof chain. A replay-owned
`ReplayResult` judges independently resolved raw artifacts. An integration-owned
aggregate consumes successful replay handles. No altitude may fill a missing
fact owned by another altitude.

A `ProofReceipt` is an append-only causal index over raw artifact handles. Each
handle contains an allowlisted project-relative path, schema ID, SHA-256,
byte-size, logical ID, and producer identity/version. The receipt records scope,
joins, bounded verdict, and residue, but not authority or admission.

The independent replayer:

1. resolves only allowlisted handles and validates every schema;
2. recomputes bytes, digests, canonical identities, graph/manifest bijections,
   exact joins, and catalogue projections;
3. verifies runtime/evaluator compatibility and deterministic raw observations,
   either by rerun for the supported interfaces or by a specifically declared
   bounded structural replay;
4. rejects receipt-authored counts/status as evidence;
5. emits a separate `ReplayResult` with its own producer and residue.

Required-check manifests name exact catalogue/receipt/replay handles. Core and
consumer aggregates reject empty, missing, extra, duplicate, stale, skipped,
todo, unrunnable, unsupported, self-asserted, surviving-mutant, or unreplayed
evidence.

### D. Consumer and lifecycle components

`verify:bte:core` has no dependency on IOLM, Body War, CyberAlchemy lifecycle,
or UI. After a green exact core handle:

1. each consumer-owned runner resolves that handle and its own versioned
   machine contract;
2. it emits raw observations and a non-authoritative consumer receipt;
3. the BTE-owned consumer replayer recomputes required checks and emits a
   `ReplayResult`;
4. `verify:bte:consumers` checks exact fresh IOLM and Body War replay handles;
5. terminal `verify:bte` composes the exact core and consumer aggregates.

IOLM must include graph/hierarchy/table GET parity among its schema-required
checks. Body War must supply a machine contract, schema, runner, raw evidence,
receipt, and replay path; Markdown cannot fill those roles. Consumer aggregates
never upgrade profile, relationship, FPR, release, or production status.

## View 4 — Workflow Process

### Normal all-backend proof run

```text
1 resolve admissions and exact contract handles
2 resolve and schema-check project/feature/node/edge sources
3 evaluate required structure and kind-scoped formation criteria
4 validate relationship endpoint/scope/direction/order contracts
5 build graph v2 + manifest v2 + build receipt
6 load and freeze-check each admitted O_spec catalogue
7 derive O_gen from the graph handle envelope
8 exact-compare O_spec and O_gen
9 materialize one TestCase bundle per joined obligation
10 resolve exactly one binding for every required case role
11 execute compiler/runtime and capture raw observations
12 evaluate observations against independent expected predicates/deltas
13 build and execute one fresh child-lineage primary mutant per obligation
14 emit proof receipts over raw artifacts
15 independently replay and emit ReplayResults
16 fail-closed compose verify:bte:core
17 run and replay IOLM and Body War independently
18 compose verify:bte:consumers and terminal verify:bte
```

Stages validate all deterministic errors within their boundary, sort them by
stable error key, emit typed residue, and stop downstream construction. No
downstream receipt or consumer pass can mask an upstream failure.

### Daily use, in plain language

A developer authors or changes one node or edge in the admitted source layout.
The compiler first says whether that source is well formed and rebuilds the
canonical graph. BTE then asks, “What exact checks does this graph require?”
and compares its answer with the validation owner's prior list. Only after both
lists match does it create runnable instructions. The runner records what
happened; the evaluator compares that observation with the prior expectation;
the mutation run proves the check notices a deliberate defect; replay verifies
the entire chain. The developer reads one stable diagnostic at the first failed
stage rather than interpreting a green count with missing work.

## View 5 — Decision And Failure Flow

```text
requested claim has exact green admission handles?
  no -> BTE_PROFILE_* residue; candidate validation may continue but no
        artifact is core-eligible and the core proof path stops
  yes
source envelope exact and valid?
  no -> BTE_SOURCE_* residue; no formation/graph build
  yes
formation valid under successor contract?
  no -> BTE_FORMATION_* residue; no relationship/graph proof
  yes
relationships admitted and valid?
  no -> BTE_RELATION_* residue; no graph proof
  yes
graph/manifest exact and provenance-complete?
  no -> BTE_GRAPH_* residue; no obligation derivation
  yes
catalogue frozen and O_spec == O_gen?
  no -> BTE_CATALOGUE_* / BTE_DERIVATION_* residue; no TestCase
  yes
all role bindings exact?
  no -> BTE_BINDING_* residue; no execution
  yes
execution/evaluation complete?
  no -> BTE_EXECUTION_* / BTE_EVALUATION_* residue; no passing receipt
  yes
clean primary mutants causally killed?
  no -> BTE_MUTATION_* residue; no passing receipt
  yes
independent replay exact?
  no -> BTE_REPLAY_* residue; no aggregate inclusion
  yes -> catalogue result eligible for core aggregate
```

Consumer failures use `BTE_CONSUMER_*` and fail consumer/terminal aggregates,
not the already established core result. Lifecycle admission/promotion failures
use owner-native codes outside the BTE proof result.

### Failure precedence

| Precedence | Stage | Examples |
| ---: | --- | --- |
| 1 | profile/contracts | absent admission, stale registry, unsupported contract version |
| 2 | source envelope | schema/path/ID mismatch, duplicate, escape, missing source |
| 3 | formation | structure type/cardinality/domain/reference, criterion failure |
| 4 | relationship | endpoint, scope, direction, multiplicity, ordinal |
| 5 | graph/manifest | source loss, duplicate projection, digest or provenance mismatch |
| 6 | catalogue | missing freeze, empty/duplicate member, stale expected case |
| 7 | derivation/comparison | missing/extra/mismatched coverage key |
| 8 | test/binding | missing expectation, skip/todo, zero/multiple/stale binding |
| 9 | execution/evaluation | unrunnable, observation mismatch, unsupported scope |
| 10 | mutation | stale-edit shortcut, wrong failure, survivor, missing child lineage |
| 11 | receipt/replay | unresolved/tampered handle, bad join, nondeterminism |
| 12 | aggregate/consumer | missing/extra child, self-asserted consumer, stale core handle |

## View 6 — Dependency Interfaces

| Interface | Provider -> consumer | Required input/output contract | Forbidden coupling |
| --- | --- | --- | --- |
| admission resolution | semantic owner -> compiler/BTE | exact typed handle with version, digest, status, owner | receipt or generated graph changing admission |
| source resolution | resolver -> compiler | schema-bound source set with direct anchors/digests | Markdown, inferred edges, current/successor fallback |
| formation evaluation | successor formation evaluator -> compiler | typed structural/criterion observations and diagnostics | ignored keywords or filtered body failures |
| graph build | compiler -> BTE adapter | graph/manifest/build handles with exact bijection | second authored graph or lossy proof IR |
| catalogue load | validation owner -> comparator/materializer | frozen O_spec and expectations | generator-produced catalogue/expected answer |
| obligation derivation | BTE generator -> comparator | O_gen with graph/source anchors | test/result generation before exact compare |
| test materialization | exact join -> runner | one TestCase bundle per coverage key | expected truth copied from O_gen |
| binding resolution | binding registry -> runner | exactly one binding per test role | predicates, subset matching, first-match |
| raw execution | compiler/runtime -> evaluator | immutable observation handles | implementation-authored pass as proof |
| bounded evaluation | evaluator -> result builder | expected predicate/delta + raw observation | imports from compiler/kernel/adapter/generator |
| mutation | mutation runner -> evaluator/receipt | fresh child lineage plus declared semantic edit | killing only because base digests became stale |
| replay | proof artifacts -> independent replayer | allowlisted raw handles and schemas | trusting receipt status/counts |
| consumer handshake | core aggregate -> consumer runner -> BTE replayer | exact core handle, consumer contract, raw evidence, ReplayResult | consumer redefining core truth |

### Reuse, extend, replace, isolate

| Current capability | Design disposition | Reason |
| --- | --- | --- |
| shared meta-type criterion kernel | reuse for compiler-under-test behavior; extend only by versioned rule contract | proven narrow deterministic behavior; not an independent oracle |
| minted body adapter | reuse/extend for successor source normalization | already binds real YAML schema rows; structure is currently unevaluated |
| minted resolver/compiler/graph-manifest path | version and extend | it is the canonical source-to-graph path, but current v1 embeds connections and rejects cross-feature edges |
| current per-kind formation JSON schemas | freeze as v1 predecessor; replace only through retirement map | accepted Option 2 requires explicit compatibility proof |
| legacy test-engine IR/rules/binding/emitter | isolate as compatibility-only | Markdown input, content-addressed obligation identity, first-match binding, and todo/skip emission cannot prove BTE completeness |
| formal AST/evaluation machinery | optional future evaluator adapters only | useful implementation substrate, outside v1 structural scope |
| existing receipt hashing/replay utilities | reuse only after contract review | deterministic primitives are useful; authored pass fields and non-rerunning replay are insufficient |

All new DomainSpec core contracts and implementation remain under
`projects/domainspec-v2/` and its `impl` package boundary. The BTE bridge extends
the existing test-derivation engine rather than creating a third engine. Plan
chooses concrete modules and filenames. Consumer-owned adapters remain with
their applications and communicate only through the versioned handshake.

## Required Machine Contract Families

Plan must materialize validators for these families before implementation can
claim them:

1. successor profile and admission handle;
2. formation v2 structural grammar and criterion records;
3. JSON-retirement map, source migration map, and compatibility corpus;
4. successor project/feature/node/edge schemas and source-set manifest;
5. graph v2, source-manifest v2, build receipt, and proof-input envelope;
6. proof-catalogue, obligation, TestCase, Binding, evaluator registry,
   ExecutionResult, MutationDeclaration/Result, ProofReceipt, ReplayResult;
7. bounded node-pattern and relationship-composition proof selections;
8. required-check manifests and core/consumer/terminal aggregate results;
9. IOLM and Body War handshake contracts and raw-evidence schemas.

For every family, structural schema validation is paired with semantic
validation for exact sets, digests, source containment, uniqueness, joins,
ordering, forbidden fields, and failure precedence. The current small internal
JSON-Schema subset cannot silently validate contracts containing unsupported
keywords; Plan must either extend it explicitly or pair a supported shape
schema with a deterministic semantic validator.

## External Command Semantics

| Command contract | Meaning |
| --- | --- |
| `verify:bte:catalogue <catalogue-id>` | diagnostic/progress run for one exact catalogue; may emit incomplete/admission residue and never implies core completeness |
| `verify:bte:core` | fail-closed proof of all six exact core catalogues for the admitted all-backend successor, using successful independent ReplayResults |
| `verify:bte:consumers` | fail-closed proof of exact fresh IOLM and Body War ReplayResults against one accepted core handle |
| `verify:bte` | fail-closed composition of the exact core and consumer aggregate handles; still non-admitting |

Commands write machine artifacts to declared output roots, return nonzero on
residue, and never edit source/admission records.

## Risks, Resolutions, And Remaining Gates

| Risk | Design resolution | Remaining owner/implementation gate |
| --- | --- | --- |
| JSON/YAML false green | versioned replacement, exact retirement-map bijection, mandatory reason-specific negative | machine contracts, implementation, formation/profile admission |
| hidden denominator inflation | six named catalogues and one coverage-key projection per catalogue | catalogue materialization/freeze |
| generator grades itself | independent O_spec expectations and forbidden evaluator imports | validation/evaluator owner separation in Plan |
| second semantic graph | handle envelope over canonical graph/manifest; lossless projections only | graph v2 and bijection validator |
| relation passes by traversal only | selected witness/effect and before/after causal delta | exact 16 relationship admission |
| mutation dies from staleness | fresh child lineage and expected phase/code/delta | mutation runner/replay implementation |
| ambiguous binding | one explicit record per test role; reject 0 or >1 | registry/schema/resolver implementation |
| receipt asserts its own truth | raw handles plus separate independent ReplayResult | replay implementation and owner identity |
| consumers collapse into authority | consumer-owned raw run, BTE-owned replay, separate aggregates | IOLM/Body War machine packages |
| universal evaluator overbuild | only the four named structural/provenance/causal v1 interfaces | unsupported scopes remain blocking residue |

Open gates are not unanswered design choices:

- formation/profile owners must admit the implemented successor package;
- relationship/profile owners must admit the exact selected 16-family set;
- validation owner must freeze each machine `O_spec` catalogue;
- consumer owners must implement and run their machine handshakes;
- lifecycle owners alone may promote FPR/release/production state.

`DEC-GCP-001` remains a blocker only for the optional Rule semantic fixture. It
does not block this structural design, formation work, graph work, or Plan.

## Design Acceptance

This design passes when read as architecture, not implementation evidence:

- all six required views are present;
- authority, owner, trust, and dependency directions are explicit;
- the accepted formation choice and successor profile are preserved;
- current v1 retirement and independent-edge migration are machine-checkable;
- every graph/node/edge/obligation/test/binding/evaluator/result/mutation/receipt
  role has an exact boundary;
- exact equality is per named catalogue and no count can substitute for IDs;
- TestCase and ExecutionResult are separate pre-run/post-run objects;
- mutation, replay, aggregates, consumers, and failure precedence fail closed;
- the architecture has one smallest coherent proof unit and no universal
  framework or second graph;
- the next route is Invoke Plan, not Task Session or implementation.

## Next Route

Run Invoke Plan against this design, [REQUIREMENTS.md](REQUIREMENTS.md), the
accepted formation decision, and [DESIGN-LAYERING-SEED.md](DESIGN-LAYERING-SEED.md).
Plan must regenerate the stale implementation layering and work pack. It must
not select an SWU until its own validation and user handoff are complete.
