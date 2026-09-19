# Research — Holistic DomainSpec Definition Atlas

These explorer returns are preserved verbatim. They are research evidence, not repository authority.

## Peirce, Charles Sanders — semantic authority

## Lane 1 return: current semantic authority and Atlas boundary

### Source-family census

I enumerated before sampling. The live relevant corpus divides into these families:

| Family | Primary owner / role | Current state | Load-bearing selectors |
|---|---|---|---|
| Repository-local governance | `projects/domainspec-v2/authority/` | Active local authority; external L2 signature still pending | `authority/AUTHORITY-MODEL.md:14-17`, `:47-64`; `authority/constitutions/domainspec-v2-CONSTITUTION.md:42-53`, `:55-94`, `:136-169` |
| Source posture | `authority/source-spine.md` | Active | `:11-18`, `:22-27`, `:47-53` |
| Canonical method vocabulary | `definitions/DEFINITIONS.md` | Active, with some explicitly interim terms | D4 `:144-181`; D5 `:183-218`; D6-D9 `:220-379`; D19 `:1003-1055` |
| Meta-type authority | `definitions/meta-types/meta-types.yml`; human companion `meta-types.md` | 13 active backend; 9 UI candidate; 2 UI deferred; Saga superseded | `meta-types.md:6-32`, `:36-52`; machine state `meta-types.yml:8-41`, active rows `:45-278` |
| Relationship authority | `definitions/relationships/relationships.yml`; human companion `relationships.md` | 31 active signatures plus generated/deferred/deprecated policies | `relationships.md:1-35`, `:39-52`, `:54-98`, `:125-157`; YAML generated/deferred/deprecated sections `relationships.yml:517-546` |
| Structural formation criteria | `impl/spec/meta-types/<category>/*.{md,schema.yml}` | Active backend criteria; UI schemas are development evidence, not active DS-D1 authority | `definitions/DEFINITIONS.md:301-337`; per-type cards, e.g. Entity `meta-types.md:56-95`, Workflow `:626-662`, State Machine `:798-834` |
| Minted source/graph contract | `impl/spec/minted-project/` | One experimental source-layout/profile; release not admitted | `minted-project/INDEX.md:1-28`, `:30-56`; `supported-profiles.yml:1-67` |
| Development profiles | `impl/spec/ui-profile/`, `impl/spec/sfol-profile/` | Development-only; authority effect none; release admission not granted | `ui-profile/profile.yml:1-6`, `:15-132`; `ui-profile/minted-project-profile.json:1-25`; `sfol-profile/profile.yml:1-12`; `sfol-profile/minted-project-profile.json:21-74` |
| Consumer-authored feature sources | `impl/spec/features/*/{project,feature,nodes}.*` | Current source examples, profile-bound | Financial Settlement `project.json:1-16`, `feature.json:1-10`; UI Create Player `project.json:1-16`, `feature.json:1-23` |
| Generated semantic/provenance views | `impl/spec/features/*/generated/` | Generated read models only | Financial graph `generated/graph.json:1-16`; source manifest `:1-30`, `:32-75`; UI graph `generated/graph.json:1-20`; UI manifest `:1-83`, `:84-180` |
| Latest software-factory review | `development/refinement-runs/20260807T140026Z-meta-type-software-factory/` | Validated planning package only; no implementation selected | `RESULT.md:3-32`; `DISTILL.md:3-24`, `:26-59`; `DESIGN-VERDICT.md:1-9`; `FINAL-CRITIQUE.md:11-17` |
| Inventory/research precedents | named strategy-packet entries | Discovery/provenance, not authority | Atlas packet `strategy-inventory-packet.md:24-35`, `:40-57`, `:63-71` |

### What DomainSpec currently says it is

The strongest current formulation is:

> A repository-local language for authoring consumer-owned, typed domain concepts and source-owned directed relationships, validating their finite formation and endpoint laws, normalizing them into a provenance-bound semantic read model, and deriving/checking implementation obligations under separate layering, validation, and drift governance.

This is grounded in:

- “Executable typed graph”: nodes are taxonomy meta-types, edges are typed relationship law, realization is composability; “executable” means derivable/checkable, not self-running (`definitions/DEFINITIONS.md:144-170`).
- Current mathematical ceiling: a **typed composable graph fragment**, with no general identity, closure, associativity, path-equation, or functorial-preservation proof (`definitions/DEFINITIONS.md:1013-1043`).
- Authoring/contract split: ontology framing may help on the authoring plane, but strict engine-facing contract authority flows contract → authoring, never reverse (`definitions/DEFINITIONS.md:183-207`). This remains explicitly “active (interim)” (`:214-218`).
- Local ownership: root `authority/` governs; root `definitions/` owns canonical language and relationship authority; per-feature packs own concrete domain meaning. Implementation projections do not become root authority (`authority/constitutions/domainspec-v2-CONSTITUTION.md:44-53`; `minted-project/INDEX.md:7-12`).

### Exact-bound definition matrix

| Atlas concept / connection | Owner; state | Plain meaning; typed I/O | What it proves / does not prove | Placement |
|---|---|---|---|---|
| **DomainSpec language boundary** | Root authority + definitions; current | Inputs: consumer domain intent, admitted kinds, formations, relationships, selected profile. Outputs: validated source pack and derived views. | Proves local language/source posture. Does not prove implementation correctness, deployment, or external authority. `source-spine.md:11-18`; constitution `:44-53`. | Overview |
| **Meta-type / DS-D1** | `definitions/meta-types/meta-types.yml`; mixed current states | Concept → exactly one kind; kind fixes structural criterion, edge participation, code-pattern mapping. | Proves staged node alphabet and maturity. Does not make candidates active merely because schemas or DS-D8 endpoints exist. `DEFINITIONS.md:229-264`. | Overview + detail |
| **Active backend alphabet** | DS-D1 owner; active | 13 non-contiguous kinds: DS-D1.1..9 and .11..14. | Proves currently admitted backend names/formations. Does not prove all are supported by one implementation profile or software factory. `meta-types.md:18-25`, `:48-52`. | Detail |
| **UI alphabet** | DS-D1 owner; nine candidate, two deferred | Page…Binding are candidate nodes; Adapter is merge-candidate to Mapping; State Indicator is split-candidate. | Proves differentiated design evidence/status. Does not prove active language authority or release admission. `meta-types.md:20-26`, UI cards `:102-319`; `ui-profile/profile.yml:15-132`. | Detail with visible candidate/deferred styling |
| **Saga** | DS-D1 owner; superseded | Historical orchestration kind replaced by Workflow; stable ID never reused. | Proves tombstone/replacement. Must not appear as selectable current type. `meta-types.md:36-52`. | Explicit omission/tombstone |
| **Category** | definitions-governance; current method vocabulary | Meta-type → one of Structural, Behavioral, Connective, Lifecycle, UI. | Proves organizational grouping, not category theory. `DEFINITIONS.md:266-299`. | Overview grouping |
| **Formal criterion / formation** | Root definitions + `impl/spec/meta-types`; current for active kinds, developmental for UI | Concept structure → accept/reject without running private engine derivation. | Proves shape, not meaning or runtime behavior. `DEFINITIONS.md:301-337`. | Detail |
| **Relationship verb / DS-D2** | Root relationship authority; active/deferred/deprecated/generated differentiated | Authored edge names semantic relation. | Proves canonical vocabulary only when machine registry admits it. Display arrows are non-authoritative. `relationships.md:1-15`. | Overview |
| **Endpoint signature / DS-D8** | `relationships.yml`; 31 active | `(verb, source kind, target kind, scope, multiplicity)` → allowed/rejected. | Proves endpoint admissibility and finite obligations; not edge usefulness, code realization, or full category law. `DEFINITIONS.md:339-379`; `relationships.md:25-35`. | Overview + inspectable detail |
| **Relationship non-collapse** | definitions-governance; active method | Candidate edge → first-class only if removal changes reject/allow, derivation, projection, composition path, owner route, or generated artifact. | Proves why an edge deserves authorship. Mere prose/diagram/reverse-navigation change is insufficient. `relationships.md:39-52`. | Detail / guided decision route |
| **Scope** | Relationship authority; active | Edge placement → `same-feature` or `cross-feature`; `ui` and `ui-backend` remain same-feature lanes. | Proves location admissibility. Does not justify a second semantic verb such as `enforces-cross`. `relationships.md:17-23`, `:125-138`. | Detail |
| **Canonical creation** | Relationship + owner decision; active | `Operation --creates--> Entity`; outgoing source edge generates `creation_targets`. | Proves one source of creation responsibility and partial 1:1 concept participation. Does not mean one runtime entity instance. `relationships.md:100-123`. | Guided route |
| **Authored node source** | Consumer project; current source record | Inputs: node ID, feature, kind, intent, typed body, outgoing connections. Output: canonical consumer node source. | Proves authored record shape under selected profile. Does not prove domain truth or runtime behavior. `node.schema.json:1-36`. | Guided route |
| **Authored connection** | Source node; current source record | Inputs: `edge_id`, `type`, `to`; compiler derives `from`. | Proves source ownership and stable edge identity. Does not give edge an independent lifecycle. `connection.schema.json:1-15`. | Guided route |
| **Selected profile** | Definitions profile owner or implementation-owned development profile; experimental/development-only | Global kind/relation registries + narrowed formations/layout → admissible source language for a run. | Proves a bounded contract surface only. Profile membership is separate from kind existence and relation status; release not granted. `minted-project/INDEX.md:14-28`, `:47-54`; `supported-profiles.yml:18-67`. | Overview bridge + detail |
| **Normalized semantic graph** | Generated read model; generated | Authored project/feature/nodes + registry/profile digests → layout-neutral nodes and first-class edges. | Proves deterministic normalized representation tied to exact source/language digests. It is not parallel semantic authority. `graph.schema.json:1-54`. | Overview center |
| **Provenance manifest** | Generated read model; generated | Source files/digests → source-set digest and graph-record→source binding. | Proves byte-level origin traceability; not source correctness, authority promotion, or runtime evidence. Financial manifest `:1-75`. | Detail |
| **Learner/navigation views** | Projection owner; candidate/unwitnessed generic contract | Normalized graph → hash-bound view. | Research supports one authored source set → one normalized graph → projections, but generic projection contracts and semantic-hash invariance remain unwitnessed. Layering synthesis `:59-86`, `:119-128`. | Guided routes only, never authority nodes |
| **Governance axes** | Authority model; three ratified local kinds | Structure → layering governance; spec→obligations → validation governance; temporal divergence → drift governance. | Proves separate decision owners and default-deny boundaries. Does not prove external policy/implementation authority. `AUTHORITY-MODEL.md:47-64`; constitution `:74-94`. | Overview side rail |
| **Lifecycle/status axes** | Constitution; active | Source posture, evidence, confidence, authority effect, policy effect, implementation status, lifecycle stage remain separate. | Prevents candidate, generated, validated, or ratified-on-another-axis from becoming “shipped.” `domainspec-v2-CONSTITUTION.md:136-152`. | Persistent legend/filter |
| **Software factory** | Refinement package; planned, non-executed | Meta-type family provider + target adapter + realization plugin → evidence handled by generic proof kernel. | Proves a coherent 29-SWU plan only. Enum trust denominator currently has reproduced false greens; Rule and language parity are not implemented. `RESULT.md:3-32`; `DISTILL.md:26-50`; `FINAL-CRITIQUE.md:15-17`. | Future frontier, not current overview capability |

### Candidate Atlas zones and bridges

1. **Language authority zone**  
   Root governance, definition cards, DS-D1 kinds, DS-D2 verbs, DS-D8 signatures. This is the semantic owner zone.

2. **Authoring zone**  
   Project → feature → consumer-owned node sources → source-owned outgoing connections. Concrete business meaning stays here, not in the generic ontology.

3. **Formation and admission zone**  
   Meta-type criterion + selected profile + source layout. Bridge label should read: “kind existence ≠ profile membership ≠ formation support.”

4. **Semantic graph zone**  
   Normalizer consumes exact sources plus profile/kind/relation digests and emits one generated layout-neutral graph. Bridge: “compiled read model, not new authority.”

5. **Projection zone**  
   Markdown, learner, navigation, traversal, provenance. All arrows originate at the normalized graph and carry source/hash bindings; none point back as authority writers.

6. **Derivation/realization zone**  
   Finite obligations, validators, code-pattern realization, language-specific adapters. Bridge must separate semantic edges from code edges and build-time checking from runtime evidence.

7. **Governance/lifecycle zone**  
   Layering, validation, drift; independent status axes; explicit owner gates. This should overlay every other zone rather than become another semantic graph node family.

8. **Production frontier route**  
   Business ontology/knowledge/provenance/authority → Spec → semantic graph → architecture/formal/obligation/generation/structural evidence → directional conformance → candidate/pilot/external authorization. It is a guided future route, not a current-capabilities summary. The inventory synthesis explicitly says all production/conformance/release claims remain unestablished (`expanded-production-frontiers…md:152-161`).

### Contradictions and stale surfaces

- The 2026-07-01 composability synthesis says **25 types / 29 edges**, includes Saga, and calls for creating `impl/spec/DEFINITIONS.md` (`composability-edges-taxonomy-synthesis.md:36-53`, `:55-76`, `:137-142`). Live authority is now **24 staged labels, 13 active backend types, Saga superseded, 31 active signatures**, with root definitions already established. Treat the synthesis as historical reasoning, not current counts.
- `impl/spec/TAXONOMY.md:3-38` correctly gives 24 staged labels and 13 active backend types, but its long UI prose can look normative. Root DS-D1 says UI is candidate/deferred; Atlas must source maturity from root definitions, not descriptive taxonomy.
- The UI generated graph contains Page, Action, Binding, etc. (`ui-profile-create-player/generated/graph.json:34-169`), but its profile is explicitly development-only with authority effect none (`ui-profile/profile.yml:1-6`). A graph node’s existence is not DS-D1 activation.
- Adapter is authored/projected as canonical `Mapping` plus UI metadata (`ui-profile-create-player/generated/graph.json:48-62`), consistent with the deferred merge decision. Atlas should not draw Adapter as a peer active kind.
- The generic experimental minted profile supports only Entity/Event/Operation/Rule and three relations (`supported-profiles.yml:18-60`), while SFOL/UI development profiles support other bounded subsets. No “universal current DomainSpec profile” exists.
- `impl/spec/CONSTITUTION.md:12-24` is an implementation contract projection and much thinner than root governance. It must not be displayed as the semantic constitution owner.
- The software-factory result’s phrase “remaining meta-types” is roadmap language, not proof that those families can currently be generated or verified. The same result explicitly denies implementation (`RESULT.md:22-32`).

### Explicit exclusions

Do not admit into the Atlas as current DomainSpec semantics:

- Inventory cards or research syntheses as authority.
- DomainSpec v1 or CyberAlchemy-v2 as resolution paths; both are provenance-only (`source-spine.md:15-18`, `:47-53`).
- Generated graph, Markdown, reverse navigation, source manifests, receipts, learner views, or `creation_targets` as authored authority.
- UI candidates as active DS-D1 types.
- Saga as current.
- `owned-by` as authored; it is generated reverse navigation. `depends-on` remains deferred; `enforces-cross` is deprecated (`relationships.md:140-149`, `:125-138`).
- Full category theory, universal equivalence, executable runtime, arbitrary application generation, production readiness, release, deployment, or external authorization.
- Software-factory architecture as implemented capability.

### Unresolved gaps

1. No single owner artifact defines the complete end-to-end language/compiler/proof/runtime/release story; the Atlas must remain a composed read model with visible owner seams.
2. The two-plane boundary is still interim; the fuse-vs-generate decision is deferred (`DEFINITIONS.md:183-218`).
3. Generic learner/navigation projection contracts and semantic-hash invariance are not yet witnessed.
4. The first generic experimental profile covers only four kinds; UI and SFOL profiles are development-only and independently owned.
5. UI DS-D1 formation authority remains absent despite schemas, endpoints, and a working feature graph.
6. Full category laws remain deferred until finite validator obligations exist.
7. Software-factory implementation is blocked behind Enum trust repair; current green evidence admits catalogue, parser, and corrupted-evidence false greens (`RESULT.md:5-18`; `DESIGN-VERDICT.md:3-9`).
8. Cross-language semantic parity, Rule→Operation realization, remaining family support, and production evidence remain unproved.
9. The normalized graph proves source-bound representation, not semantic correctness, runtime conformance, or authority promotion.
10. The Atlas needs an explicit legend for at least: `active`, `candidate`, `deferred`, `superseded`, `generated`, `development-only`, `experimental`, and `release-not-granted`; collapsing these would directly violate the local constitution.

## van Lamsweerde, Axel — executable lifecycle

# Lane 2 report — executable lifecycle

## Executive finding

There is no single current, governed end-to-end DomainSpec execution chain from business meaning to production decision.

The repository contains three materially different levels:

1. Mature executable mechanisms in local code and tests:
   deterministic structural derivation, BTE development fixtures, architecture projection/evaluation primitives, mutation, separate-process replay, and atomic proof-run writing.
2. Bounded passing receipts:
   the general derivation engine, BTE L0A contract publication, Body War’s candidate bridge, and `SWU-ARE-001..003`.
3. Candidate or unjoined evidence:
   the Financial Settlement lifecycle model, hand-authored architecture fact graph, and a new untracked `order-status-v1` proof-complete run whose governing Work Pack still names `SWU-ARE-004` as unselected and lacks the expected `SWU-ARE-004.json` receipt.

Therefore the highest defensible holistic claim is:

> DomainSpec has executable, independently testable pieces for structural derivation and one candidate-local direct TypeScript Enum proof shape, but not a receipt-closed business-to-release lifecycle, not a general ontology-to-code compiler, and not production authorization.

All inspection was read-only. I did not rerun validators because that would generate or potentially overwrite artifacts in some of these workflows.

## Source-family census

| Source family and exact selector | Current versus target | Evidence class | Plain-language role | Candidate Atlas node/edge | Claim ceiling |
|---|---|---|---|---|---|
| `projects/domainspec-v2/impl/tools/validate-content.ts`, `validate-relationships.ts`, `validate-meta-types-noncollapse.ts`, `lib/meta-type-criteria.ts`, plus `tools/tests/*.test.ts` | Current executable validators; broader semantic/language judgment remains target | executable behavior + unit-test witnesses | Checks document/content shape, relationship rules, and meta-type non-collapse | `Validator` nodes; `validates-shape-of` edges to authored sources | Validates named structural rules only; not semantic satisfiability, code conformance, or authority |
| `projects/domainspec-v2/impl/test-derivation-engine/README.md` — Pipeline and Status; `src/README.md` — reader/rules/residue/provenance/emitter | Current active engine | executable behavior/documented contract | Reads legacy aspects or normalized `SPEC.md`, builds graph `G`, derives stable structural obligations, emits specs/tests | `SpecParser → SemanticGraph → StructuralObligation → GeneratedTestProgram` | Structural accounting only; does not infer behavioral meaning or generate an application |
| `impl/test-derivation-engine/src/grammar/`, `src/rules/`, `src/keys/`, `src/residue/receipt.ts`, `src/provenance/`, `src/emit/` | Current implementation | code + tests | Concrete parse/derive/key/receipt/provenance/emission mechanism | typed lifecycle subgraph | Stable obligation identity does not prove obligation satisfaction |
| `impl/test-derivation-engine/src/README.md` — normalized AEO example | Current passing bounded fixture: 39 obligations = 13 concepts + 9 relationships + 6 fields + 11 attributes | candidate fixture/test witness | Shows additive structural refinement without losing previous keys | `RefinementExample adds Obligation` | Not semantic refinement or valid-implementation proof |
| `impl/test-derivation-engine/src/bte/contract-publication.ts`; `.../runs/20260723T020759Z/l0a/contract-publication-receipt.json`; `backend-type-test-engine-completeness/WORK-PACK.md` lines/sections “Current State”, “L0 Output Contract” | L0A current and receipt-synchronized; L0B and L1–L8 owner/predecessor gated | passing receipt + planned target | Freezes schemas, diagnostic registry, and publication bytes before semantic validation | `ContractPublicationReceipt`; `precedes` `ValidationReceipt` | L0A proves exact contract bytes, not semantic validation or admission |
| `backend-type-test-engine-completeness/WORK-PACK.md` — layer table and gate table; `EXECUTION-PACK.md` — W1/W1B–W9 | Governed current frontier is `waiting-validation-owner-freeze`; L0B onward not selected | validated design/work-pack contract | Defines intended route: formation → sources → graph → catalogues → proof unit → core → consumers → aggregate | `BTE-L0A..L8` ordered nodes; owner-gate edges | Planned topology is not execution; tests in source do not close the governed lifecycle |
| `impl/test-derivation-engine/src/bte/development-engine.ts`, `proof-engine.ts`, `consumer-engine.ts`, `development-pipeline.ts` and sibling tests | Executable development mechanisms exist beyond governed L0A frontier | executable behavior + development fixtures, but receipt-chain mismatch | Can build a deterministic fixture graph, emit/run proof cases, aggregate core, and replay consumers | `DevelopmentBuild`, `TestCase`, `Execution`, `Mutation`, `CoreAggregate`, `ConsumerReplay` | Code/test existence does not promote L1–L8 or satisfy independent freezes/admissions |
| `impl/test-derivation-engine/src/bte/financial-settlement-verify.ts` | Current bounded expected-red verifier: demands 52 total, 51 pass, exactly one declared red, zero skipped/todo | executable negative witness | Proves a known Financial Settlement gap remains visible instead of false-green | `ExpectedRedVerification`; `detects-gap` | Passing verifier proves exact expected red, not Financial Settlement correctness |
| `development/implementation-conformance/ontology-experiment/README.md` — Execution Model and Demonstrated Result; `VALIDATION-REPORT.md` — Claim Ceiling | Current corrected candidate experiment; supplied fact graph is hand-authored | candidate ontology + passing validation report | Loads ontology/profile and explains expected-versus-observed properties | `ArchitectureOntology → Profile → ObservationProjection → Finding` | Generic evaluation over supplied facts; no real TS/Python/Rust source adapter in that report |
| `ontology-experiment/TRACEABILITY-AND-DRIFT.md` items 1–16 | Explicit target/gap registry | validated design residue | Names missing realization types, provenance, conflicts, graph algorithms, adapters, exceptions, schema evolution, project-level architecture, performance | `Gap` nodes with `blocks`/`requires-owner` edges | No silent inference from an unimplemented item |
| `ontology-experiment/examples/financial-settlement-business-to-obligation.scene.json` — `obligation_read_model`, `full_obligation_status`, `receipt_status`, `proof_boundary` | Current candidate read model; full FS-POST-001 proof absent | candidate fixture/read model | Explains 79-obligation constellation and the one highlighted obligation | `BusinessPromise → SemanticGraph → ObligationReadModel → FS-POST-001` | No direct P4→FS-POST-001 identity; no issued receipt |
| `ontology-experiment/examples/financial-settlement-proof-lifecycle.ontology.json` — `promise-to-proof` view, terminal `receipt.FS-POST-001` | Target proof design with current code/evidence fragments and explicit gaps | candidate ontology | Composes business, bridge, implementation, evidence, receipt, and drift without inventing missing edges | Atlas scene candidate with typed supported/missing links | Candidate evidence read model; no generated TS, proof receipt, or promotion |
| `ontology-experiment/examples/body-war-suggested-track-lifecycle.scene.json` — twelve mechanisms | Hybrid current/proposed scene | bounded application witness + target design | Shows actual `SuggestedTrackStatus`/Rule and where Enum realization is blocked | `BodyWarStatus → missing EnumDefinition → target ArchitectureRealizationSpec` | Current source evidence is not one ontology-to-code pipeline |
| `projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/{domainspec,ontology,integration}-receipt.json` and `bridge/receipts/bridge-admission-receipt.json` | Current passing bounded receipts | passing receipt | Binds one Body War proof package and bridge | `BodyWarProofReceipt`/`BridgeAdmissionReceipt` | Every receipt says `authority_effect: none`, `release_admission: not-granted` |
| `impl/architecture-conformance/realization/spec/derive-enum-realization-spec.ts`; `contracts/architecture-realization-spec.ts` | Current working-tree implementation | executable behavior, untracked | Projects candidate Enum definition/profile/binding into exact realization spec | `EnumDefinitionSnapshot → ArchitectureRealizationSpec` | One direct TS Enum shape only |
| `.../evaluator/evaluate-enum-bijection.ts` | Current working-tree implementation | executable behavior, untracked | Independently compares observation to one `enum.member-bijection@1` obligation and fail-closes on stale handles | `ObservationProjection → ArchitectureEvaluation` | Exact one-obligation structural/semantic-value bijection, not business behavior |
| `.../mutation/remove-enum-member.ts`; `.../replay/replay-enum-proof.ts` | Current working-tree implementation | executable behavior, untracked | Removes selected member and recomputes from raw inputs in a child process | `Mutation → killed-by Finding`; `RawIndex → ReplayResult` | One causal mutant/replay path |
| `.../evidence/proof-state.ts`; `write-proof-run.ts` | Current working-tree implementation | executable behavior, untracked | Enforces state order and atomic no-overwrite proof-run publication | `prepared→generated→compiled→observed→evaluated→mutation-killed→replayed→proof-complete` | Local proof-state discipline, no promotion authority |
| `development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json` | Current expected-red receipt | passing receipt | Freezes missing-property rejection before implementation | `ExpectedRedContract` | No projector, generation, conformance, or release proof |
| `.../receipts/SWU-ARE-002.json` | Current green projector receipt | passing receipt | Proves Enum ontology-to-realization-spec projector and two mutants | `ProjectionReceipt` | Projector only |
| `.../receipts/SWU-ARE-003.json` | Current green catalogue receipt | passing receipt | Proves independent member-bijection catalogue and same-key semantic drift kill | `ObligationCatalogueReceipt` | Catalogue only; explicitly says SWU-ARE-004 onward unexecuted |
| `.../runs/order-status-v1/proof-receipt.json`; `replay.json`; positive/mutant evaluations | Working-tree run says `proof-complete`, 1/1 positive, 1/1 mutation killed, replay pass | candidate-local run artifact, not joined receipt | Demonstrates the complete technical shape for one generated OrderStatus Enum | `ArchitectureProofReceipt`; `replays-from RawIndex` | “one candidate-local direct TypeScript Enum proof”; `authority_effect: none` |
| `development/refinement-runs/20260806T031658Z-enum-ontology-codegen-roundtrip/.../EXECUTION-ENTRY.json`; readiness report `20260807T053822Z-swu-are-004-readiness-audit/.../work-pack-readiness-report-v2.json` | Governed frontier remains `SWU-ARE-004`, expected receipt absent | current lifecycle control evidence | Says which work is actually selected/admitted | `ExecutionFrontier`; `requires TerminalReceipt` | The untracked proof-complete run cannot be represented as lifecycle-complete |
| `development/first-production-release/ROADMAP.md` — Ordered route | Current FPR state: FPR-00/01 and lane split closed; FPR-02B in progress; 03/04 blocked; 05/07/08 partial; 09/12/13 absent; 15 unauthorized | authoritative operational projection | Shows the required business-to-release joins and gates | `FPR-00..15` chain | Explicitly production unauthorized |
| `first-production-release/ROADMAP.md` — Release rule | Target only | external owner decision | Requires claim acceptance, independent reproduction, exact-bit authorization, and immutable private release record | `ProofBundle → ClaimAcceptance → ExternalAuthorization → ReleaseRecord` | No component green, receipt, pilot, or digest independently establishes production |

## Mechanism map

```text
Authored business/spec sources
  ├─ current: validate content/relationships/meta-types
  ├─ current: parse to structural graph G
  ├─ current: derive stable structural obligations
  ├─ current: emit test programs / residue receipt
  └─ MISSING: generally admitted business meaning → canonical semantic graph identity

Semantic graph / definition snapshot
  ├─ current bounded: Enum realization-spec projector
  ├─ current bounded: member-bijection catalogue
  └─ MISSING: general, admitted architecture-realization compiler

ArchitectureRealizationSpec
  ├─ current bounded: TS Enum IR/emitter/compiler/observer
  ├─ current bounded: independent evaluation
  ├─ current bounded: causal member-removal mutant
  ├─ current bounded: raw-input child-process replay
  └─ candidate run: proof-complete local receipt

Proof receipt
  ├─ current technical boundary: authority_effect none
  ├─ MISSING: exact Work Pack terminal/closeout receipt for SWU-ARE-004+
  ├─ MISSING: cross-graph FPR-09 conformance join
  ├─ MISSING: controlled 14/14 Body War pilot
  └─ external: claim acceptance and release authorization
```

## End-to-end trace: Financial Settlement P4

This is the best holistic trace because it exposes each absent connection rather than pretending the path is closed.

| Stage | Exact evidence | State / connection |
|---|---|---|
| Business meaning | `financial-settlement-proof-lifecycle.ontology.json`, node `financial-settlement.promise.settle-eligible-payout-once` | Candidate plain-language synthesis; source-bound but non-authoritative |
| Semantic graph | same file, node `domainspec.financial-settlement.semantic-graph`; scene `semantic_graph_projection` | Current generated read model; materially distinct from authored graph |
| Formal/business clause | node `financial-settlement.P4` | Current candidate clause |
| Obligation universe | scene `obligation_read_model`, count `79`; highlighted `FS-POST-001` | Derived structural/read-model identity |
| P4 → FS-POST-001 | ontology view deliberately has no such edge; `gap.FS-POST-001-ontology-origin` | **Absent**. No machine proof that P4 is the semantic origin of FS-POST-001 |
| Architecture realization | nodes `financial-settlement.RuleImplementationContract` and `OperationImplementationContract` | Candidate architecture contracts |
| Architecture → concrete code | handwritten TS nodes for decision/use case | **Indirect**. Description/interpretation exists; exact admitted realization binding is missing |
| Generated verification | derived tests include pure checks; scene says full FS-POST-001 is skipped | Current partial executable evidence |
| Runtime observation | separate handwritten write/event checks exist | **Indirect/unbound**. They are not bound into one obligation harness |
| Evaluation | expected-red verifier enforces 52 generated / 51 pass / one exact red | Current negative evidence; honest partial verdict |
| Mutation/replay | strategies exist in lifecycle ontology; general BTE/Enum mechanisms exist elsewhere | **Absent for FS-POST-001**. No per-key FS mutation and raw-input replay receipt |
| Proof receipt | `receipt.FS-POST-001`, `receipt_status: not-issued` | **Absent** |
| Drift | `drift.P4-optional-event-handler`; optional handler weakens unconditional P4 guarantee | Current observed drift finding |
| Decision | receipt owner / conformance owner / release owner | **External owner decision**, impossible until gaps close |

The Enum `order-status-v1` run is the inverse pattern: it has a complete local technical proof sequence through replay, but no business-plane meaning path and no governed SWU closeout. Neither witness alone closes the holistic lifecycle.

## Proof/gap matrix

| Claim | Current proof | Missing proof | Ceiling |
|---|---|---|---|
| Deterministic structural obligation derivation | Engine code/tests, stable keys, normalized-spec refinement fixture | Behavioral semantics and valid-implementation definition | Structural derivation only |
| Executable generated checks | emitted Vitest and Financial Settlement expected-red verifier | Complete per-obligation harness/oracle/execution | Programs and exact expected-red evidence |
| Generic architecture conformance | Candidate ontology evaluator reproduces expected findings over supplied facts | Real AST/module adapters, relation cardinality/existence, graph algorithms | Hand-authored fact evaluation |
| Ontology-to-code realization | Enum projector/emitter/compile/observe/evaluate/mutate/replay files and local run | Governed receipt join; more types/languages; admitted definition/profile | One candidate-local direct TS Enum |
| Mutation proves causality | `status.paid` removal yields exactly `ARCH_ENUM_MEMBER_MISSING`; replay pass | Broader mutation denominator; per-obligation coverage | One declared mutant killed |
| Replay proves reproducibility | raw handles recomputed in different PID | Clean committed candidate, environment/toolchain release proof | Candidate-local deterministic replay |
| Body War proves applicability | four passing proof/bridge receipts | Complete Enum definition; architecture pipeline; FPR pilot 14/14 | Bounded application evidence, no admission |
| FPR proves production | FPR-01 ratified; lane split established | FPR-02B through 14 and FPR-15 authorization | Production unauthorized |

## Candidate Atlas connections

Add these only with explicit lifecycle/status fields:

1. `BusinessPromise --represented-in--> SemanticGraph`
   - Status: candidate/current read model depending witness.
2. `SemanticGraph --derives-structural--> ObligationUniverse`
   - Do not use `proves` or `implements`.
3. `FormalClause --semantic-origin-of?--> Obligation`
   - Render as missing/contested when the identity map is absent, as for P4/FS-POST-001.
4. `DefinitionSnapshot --projects-to--> ArchitectureRealizationSpec`
   - Bounded implementation: Enum only.
5. `ArchitectureProfile --constrains--> ArchitectureRealizationSpec`.
6. `ArchitectureRealizationSpec --lowers-to--> LanguageIR --emits--> GeneratedSource`.
7. `GeneratedSource --compiled-as--> CompileResult`.
8. `IndependentAdapter --observes--> ObservationProjection`.
9. `ObligationCatalogue + ObservationProjection --evaluated-by--> ArchitectureEvaluation`.
10. `Mutation --causes--> ExpectedFinding`; never merely “test failed.”
11. `RawInputIndex --replayed-in-separate-process--> ReplayResult`.
12. `Evaluation + killed mutation + replay --bound-into--> ProofReceipt`.
13. `ProofReceipt --has-authority-effect--> none`.
14. `DriftFinding --routes-to--> Definition/Profile/Binding owner`.
15. `ProofReceipt --requires-separate--> ClaimAcceptance`.
16. `ClaimAcceptance --requires-external--> ReleaseAuthorization`.
17. `ReleaseAuthorization --records--> ImmutablePrivateRelease`.
18. `ExecutionFrontier --requires--> SWUTerminalReceipt`; use this to expose the current unjoined `order-status-v1` run.

Every node should carry:

- `artifact_status`: executable-current / passing-receipt / candidate-fixture / validated-design / unimplemented-target / missing-link / external-decision
- source path and selector
- owner
- exact digest/receipt ID where available
- authority effect
- release admission
- claim ceiling

## Blind spots and tensions

1. **Working-tree provenance tension:** `architecture-realization-compiler/` and `impl/architecture-conformance/realization/` are untracked; `typescript/adapter/enum/index.ts` is modified. Their proof artifacts are current bytes but not a committed or lifecycle-closed baseline.
2. **Receipt contradiction:** `SWU-ARE-003.json` says ARE-004 and later phases remain unexecuted, while `runs/order-status-v1/proof-receipt.json` says `proof-complete`. The missing expected `receipts/SWU-ARE-004.json` and closeout receipt prevent promotion of the run to governed completion.
3. **BTE code/frontier divergence:** source contains complete development/core/consumer mechanisms and tests, but the governed Work Pack is still at the L0B independent-freeze gate. The Atlas must show “mechanism implemented” separately from “lifecycle admitted.”
4. **Observation provenance:** the older ontology experiment’s passing TypeScript findings are over hand-authored facts. The new Enum adapter is working-tree evidence and narrower than the general adapter promised by the experiment.
5. **No common proof receipt algebra:** BTE receipts, architecture proof receipts, Body War bridge receipts, and FPR receipts have different schemas and admission semantics; the join is conceptual, not implemented.
6. **No general TestCase-to-receipt closure:** Financial Settlement exposes 79 obligations but the highlighted full postcondition remains skipped/unbound.
7. **Structural versus behavioral:** the derivation engine can account for declarations; architecture conformance can inspect code shape; neither proves runtime business behavior.
8. **Generated tests are not execution:** keep `TestProgram`, `Execution`, `Observation`, and `Evaluation` separate.
9. **Generated code is not an application:** one Enum source artifact does not establish arbitrary application generation.
10. **Drift routing is modeled more strongly than automated:** owner routes and fail-closed concepts exist, but general automatic drift-to-refresh orchestration is absent.
11. **Cross-language parity absent:** Python/Rust are profile contracts, not source adapters or execution witnesses.
12. **Graph conformance remains incomplete:** relation existence/cardinality, reachability, cycles, layer direction, public-index proof, and cross-package policy are unimplemented.
13. **Exceptions and unsupported algebra incomplete:** real language cases such as macros, decorators, generated code, and dynamic imports lack fully typed handling.
14. **Financial Settlement business identity gap:** P4 and FS-POST-001 are deliberately not linked; the Atlas must preserve that missing edge.
15. **Body War definition gap:** current union/PostgreSQL enum does not substitute for a complete DomainSpec Enum definition.
16. **No FPR technical join:** `FPR-09` is absent, so component receipts cannot be interpreted as release conformance.
17. **No pilot or production proof:** `FPR-13` absent, `FPR-15` unauthorized; all current evidence stops before external decision.
18. **UI/comprehension evidence:** browser operability exists for candidate canvases, but representative reader comprehension remains flagged, not passed.

## Recommended Atlas visual convention

Use edge line style to prevent claim inflation:

- Solid: current executable connection with source-backed proof.
- Solid + receipt badge: passing, lifecycle-joined receipt.
- Dashed: validated design contract or proposed connection.
- Dotted: indirect correspondence/interpretation.
- Red broken line: explicitly missing binding.
- Gate diamond: independent or external owner decision.
- Grey projection halo: candidate/read-model identity with `authority_effect: none`.

This lane’s decisive design requirement is that “proof-complete” must always be qualified by scope and lifecycle. The `order-status-v1` artifact may be proof-complete inside its one candidate-local technical state machine while still being unjoined, uncommitted, non-authoritative, unreleased, and not production evidence.

<oai-mem-citation>
<citation_entries>
MEMORY.md:955-966|note=[prior structural enforcement and Enum proof boundaries used as search leads and checked against live sources]
MEMORY.md:929-937|note=[prior planning-only Enum realization context used to identify the live receipt tension]
</citation_entries>
<rollout_ids>
019fd22b-ba90-7e73-973d-fba6aee65b66
</rollout_ids>
</oai-mem-citation>

## Ashby, W. Ross — formal and explanatory precedents

## Lane 3 report — formal, historical, explanatory, and interaction enrichments

No files changed.

### 1. Corpus census

The named families are not one coherent authority surface. They are five distinct corpora with different epistemic roles.

| Source family | Census / inspected core | Classification | Atlas use |
|---|---:|---|---|
| `implementation/domainspec/` | 2,601 files in its nested repository; targeted `README.md`, vault ontology conventions, lifecycle/confidence material | Historical implementation precedent and consumer-local meaning; not current v2 definition authority | Mine lifecycle/feedback metaphors only, visibly tagged “legacy implementation precedent” |
| `research/projects/domainspec/` | 134 tracked files; inspected `definitions/DEFINITIONS.md`, claims, paper/evidence structure | Research-definition authority within the evidence program, with an explicit open-core split | Use as provenance/history; route wedge terms to current public authority |
| `domainspec-formalization/` | 47 tracked files; inspected glossary, two-layer framework, paper, Lean counterexamples/theorems | Formal theorem/counterexample authority for the exact mechanized propositions; broader prose is formal-project interpretation | A “formal depth” route with theorem-status badges and counterexample-first explanations |
| `domainspec-lean-formalization/` | 4,255 tracked files; targeted epistemic-position, contradiction/remediation/status and bridge documents | Mixed theorem corpus, explicit philosophical position, later contradiction audit, and speculative extensions | Residue/iteration learning route, but only after claim demotion labels are preserved |
| `projects/framework-unification/layers/domainspec-language/` | 95 tracked files; inspected design package and explainers | Candidate language design plus explanatory projection, not current DomainSpec v2 semantics | Plain-language contract/schema/iteration route and assurance ladder, labeled “candidate language model” |
| Current v2 canvas/scene/X-ray | `unified-canvas-model.mjs`, Financial Settlement scene, BTE X-ray/Whisper result | Candidate explanatory projections over source-bound read models | Interaction and lifecycle-state patterns; never definition authority |
| Body War UI review | Review-only `findings.md` and synthesis | Consumer-local black-box evidence | Navigation/accessibility requirements transferable as UI patterns, not semantic definitions |
| Inventory cards / EvidenceSets | Category-theory cards and simple-ontology set | Candidate discovery read models | Good routing summaries only; all load-bearing claims must resolve to owner sources |

Important census caveat: raw filesystem counts are massively inflated by generated/cache content; the numbers above use repository-tracked files where available. The inventory packet itself states that the overlapping families are not fully indexed and that no single artifact supplies a complete current definition across semantics, language, proof, realization, and lifecycle (`strategy-inventory-packet.md:53-59`).

### 2. Candidate-enrichment matrix

| Candidate enrichment | Authority classification and exact source | Atlas placement / improvement | Required ceiling |
|---|---|---|---|
| **“Map of boxes and arrows” opening** | Explanatory projection: `projects/domainspec-v2/research/evolvable-validation-framework/whisper/plain-language-guide.md:1-5` | Overview zone: begin with nodes, arrows, and inspectable evidence before introducing IDs or formalism | Must not define DomainSpec canonically; source calls itself a candidate teaching artifact at `:154-156` |
| **Small operational glossary: node, edge, signature, obligation, binding, evaluator, receipt, composability** | Explanatory projection, `plain-language-guide.md:7-27` | Glossary and hover cards; supplies a coherent learner vocabulary from authored meaning through executable evidence | “Receipt is evidence, not a new source of truth” must remain explicit (`:25`) |
| **One complete semantic route: source → graph → shape → obligation → binding → test → evaluator → receipt** | Explanatory projection with current/missing split, `plain-language-guide.md:39-109`, condensed route `:136-152` | Primary guided route; makes the Atlas a causal learning journey rather than a static node cloud | Do not depict all steps as implemented; current gaps are enumerated at `:125-134` |
| **Authored source vs normalized read model** | Explanatory projection, `plain-language-guide.md:41-49` | Evidence boundary: visually separate “person-authored claim” from “generated working copy” | Generated graph is not editable authority |
| **Legal-on-paper vs code-behaves-so** | Explanatory projection, `plain-language-guide.md:51-79` | Feedback loop breakpoint: shape pass followed by a separate code-binding gate | A valid signature does not prove behavior (`:61`) |
| **Cross-graph witness/counterexample node** | Candidate design, `plain-language-guide.md:87-95` | Semantic route branch for cycles, reachability, and contradiction queries | Runnable cross-graph evaluator is missing; current cycle is only a design example |
| **Evidence receipt with an explicit `claim limit` field** | Candidate explanatory model, `plain-language-guide.md:97-109` | Evidence boundary / node detail | Receipt records a bounded result, never authority or universal correctness |
| **Contract / schema / iteration as three separable agreements** | Candidate language design: `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:15-35`; plain explanation `EXPLAINER-INDEPTH.md:47-68` | Overview zone with three tabs: meaning, shape, change | This is a candidate language model, not current v2 canonical definition |
| **Anti-collapse relation between contract and schema** | Candidate design, `DESIGN-PACKAGE.md:102-132` | Node explanation: same rule can appear as semantic obligation and structural check; both remain distinct and cross-referenced | Contract invariants lack addressable obligation IDs, so enforcement is blocked (`:130-132`) |
| **Partial implementation as first-class gap** | Candidate design, `DESIGN-PACKAGE.md:117-128` | Feedback/gap route; render uncovered obligations, never omit them | Do not turn estimated “~3 of ~17” coverage into current universal fact |
| **Iteration as replayable delta** | Candidate design, `DESIGN-PACKAGE.md:136-163` | Feedback loop: `prev_state → next_state`, changes, decisions, blockers, validations, residue | Proposed model; no current universal DomainSpec iteration runtime |
| **Maturity and authority as orthogonal axes** | Candidate design, `DESIGN-PACKAGE.md:214-250` | Node status UI: separate lifecycle from promotion | Validation is necessary, not sufficient; only owner approval promotes (`:242-250`) |
| **Two locks and one human key** | Explanatory projection, `EXPLAINER-INDEPTH.md:115-140` | Assurance overview: structure check, code comparison, human intent approval | The explanatory artifact later says full code→blueprint coupling is not running (`:212-225`, `:268-270`) |
| **Three-rung assurance ladder** | Explanatory projection, `EXPLAINER-INDEPTH.md:144-177` | Evidence legend: theorem / deterministic check / human judgment | “Green” means structurally consistent, not correct (`:158-166`); machine can block, not authorize (`:168-173`) |
| **L1/L2 and compiler-as-functor** | Formal-project terminology, `domainspec-formalization/GLOSSARY.md:18-38` | Optional formal route: domain concepts → artifact types via `Δ` | This formalization is not identical to current v2 operational vocabulary |
| **Concept understood through relationships, not only fields** | Math-backed Yoneda interpretation, with design synthesis explicitly separated: category evidence cards `:48-67`, backed by `GLOSSARY.md:42` and formal paper refs listed there | Node explanation: “What points to/from this concept?” panel | “Concept = its arrows” is a teaching/design interpretation, not a current hard v2 invariant |
| **Representability / non-representability** | Formal counterexample: `domainspec-formalization/lean-formalization/M2Counter.lean:1-12,49-74` | Formal route: show a concrete structure that is well-typed yet has no representing L1 object | Exact theorem refutes unrestricted M2 only; it is not an LLM hallucination theorem |
| **Schema residue and instance residue** | Formal-project definitions, conditional and prospective where stated: `domainspec-formalization/GLOSSARY.md:66-72` | Feedback loop: two visible loss meters, one for concept/schema translation and one for populated-instance round trip | Schema residue requires an exhibited right adjoint; unrestricted M2 is refuted |
| **Two-layer non-collapse via counterexample** | Formal theorem/counterexample: `M6Counter.lean:103-108,143-200`; glossary status `GLOSSARY.md:108-120` | Formal route: schema discipline does not automatically imply instance fidelity | Do not summarize as “formal schemas always lose reality”; the proved proposition is the failure of a specific universal implication |
| **Restricted recovery zone** | Formal theorem: `M6Restricted.lean:65-88,90-107,109-134` | Residue route: show where round-trip fidelity can be recovered—essential image under stated reflectivity assumptions | “If and only if” is conditional on the named adjunction/reflectivity hypotheses |
| **Proof and counterexample as learning lifecycle** | Historical/philosophical position: `domainspec-lean-formalization/EPISTEMIC-POSITION.md:32-48`; claim ≤ proof rule `:20-28` | Learner structure: conjecture → counterexample → restriction → theorem → residue | Position is not theorem; later demotions must be displayed |
| **Presentation is created; structure is discovered** | Philosophical position, `EPISTEMIC-POSITION.md:181-196` | Explanation of why multiple views can share one semantic source | Explicitly label as philosophical claim, not formal result |
| **Contradiction/demotion annotations** | Corrective audit embedded in position paper, `EPISTEMIC-POSITION.md:68-98,115-131` | Evidence boundary: visibly show a crossed-out overclaim and corrected narrower statement | Particularly valuable pedagogically: theorem-to-metaphor seams must remain visible |
| **“Ontology as map with receipts; map is not government”** | Candidate simple-presentation EvidenceSet, `.arcanum/inventory/entries/evidence-sets/2026-06-22-simple-ontology-presentation-sets.md:22-52` | Overview zone metaphor and authority warning | Inventory/EvidenceSet is non-authority (`:17-20`); resolve canonical ontology terminology elsewhere |
| **One source set → one semantic graph → multiple learner views** | Candidate layering synthesis from the selected inventory entry; live implementation reinforces source binding: `unified-canvas-model.mjs:35-80,98-148` | Canvas architecture: overview, lifecycle, proof, and consumer scenes as projections over one model | Presentation bridges declare `authority_effect:none`; layout must not imply semantic authority |
| **Digest-bound scene artifacts** | Candidate executable projection: `unified-canvas-model.mjs:216-249` | Node explanation and provenance drawer | Source binding proves provenance/shape, not semantic correctness |
| **Financial Settlement business-to-proof journey** | Consumer-local candidate read model: `financial-settlement-business-to-obligation.scene.json:1-82,84-125,188-266,315-358` | Concrete example route: business promise → authored ontology → minted graph → obligation → architecture → code → evidence | Scene is `candidate-read-model`, `authority_effect:none` (`:1-6`); current verdict is partial/unbound (`:223-265,350-358`) |
| **Separate graph planes** | Consumer-local explanatory projection, Financial Settlement scene `:84-125` | Canvas lanes: business map vs semantic read model vs proof/code planes | Business meaning must not become generic DomainSpec semantics |
| **Four lifecycle-state language** | BTE explanatory projection, `.../WHISPER-RESULT.md:25-28,94-96` | Status chips: Runs now / Design contract / Build next / Owner gate | These are explanatory lifecycle states for BTE, not universal DomainSpec states |
| **Deterministic focus scenes and directed portals** | Consumer-local UI review, `projects/body-war/.../findings.md:21-29` | Canvas navigation: bounded local scene, one-hop fallback, labeled boundary crossings | Focus scene is UI behavior, never ontology truth; exact projection does not prove comprehension |
| **Persistent relation tuple and atomic pivot** | Consumer-local UI evidence, Body War findings `:41-49` | Semantic route interaction: keep source, predicate, type, description, direction, destination, provenance, status, authority visible | Stable selection does not prove correct interpretation |
| **Keyboard/pointer/reduced-motion parity** | Consumer-local UI evidence, Body War findings `:31-39` | Accessibility contract for every node/relation/portal | Proves reachability/state parity only, not workload, comprehension, or contrast |
| **Tour state is presentation state** | Consumer-local UI evidence, Body War findings `:51-59` | Learner route: suspend current trace, enter scene, step atomically, restore trace | Tour order cannot imply workflow, causality, or semantic branch |
| **Vocabulary consistency across search/card/detail/pivot** | Consumer-local UI evidence, Body War findings `:61-69` | Glossary and interaction integrity | Source consistency does not establish semantic correctness |

### 3. Conflicts with current v2

1. **Four formal carrier meta-types vs current staged DS-D1.**  
   The formalization glossary says the canonical carrier set is `entity`, `operation`, `constraint`, `relationship` (`domainspec-formalization/GLOSSARY.md:92-98`). Current v2 instead exposes a 24-member staged alphabet with 13 active backend types, nine candidate UI types, and two deferred labels (`projects/domainspec-v2/definitions/meta-types/meta-types.md:12-26`; index `DEFINITIONS-INDEX.md:45-70`). The formal four may be shown as a historical abstraction or candidate categorical carrier—not as the current v2 type list.

2. **Formal “edge law on meta-type pairs” is much coarser than current DS-D8.**  
   `GLOSSARY.md:94-96` gives a project-defined decidable relation. Current v2 has explicit directional relationship signatures and multiplicities, e.g. `Rule --enforces--> Operation`, `Operation --produces--> Event`, and distinct invalid reversals (`projects/domainspec-v2/definitions/relationships/relationships.md:58-74,127-157`). The Atlas may connect the abstraction to DS-D8, but must not replace the current registry with the four-type law.

3. **Historical research authority now defers for wedge terms.**  
   `research/projects/domainspec/definitions/DEFINITIONS.md:1-13` calls itself canonical for its evidence program, but `:15-22` explicitly transfers DS-D1/D2/D3/D7/D8/D10 and DS-P1/P2/P3 authority to public Arcanum and retains only private/ambiguous clusters locally. Atlas provenance must reflect that split rather than treating the entire research file as current authority.

4. **Contract/schema/iteration is not current v2’s universal definition of DomainSpec.**  
   It is a candidate framework-unification language design (`DESIGN-PACKAGE.md:15-40`) with unresolved obligation IDs and syntax decisions (`:130-132,268+`). It is excellent explanatory structure, but should remain a lens.

5. **Category-theory `Δ` and v2 compiler are not established as the same machine.**  
   The formal glossary calls `Δ` “the compiler” (`GLOSSARY.md:22-24`), while current v2 has concrete normalization/derivation tools. No inspected source proves equivalence between the categorical functor and the TypeScript compiler. Use “formal analogy/model” unless an owner source establishes the binding.

6. **Two residue axes do not equal three language layers by theorem.**  
   The evidence card itself says the mapping from schema/instance axes to contract/schema/iteration is synthesis and omits the temporal dimension (`category-theory...cards.md:94-116`).

7. **BTE’s four status labels conflict with the candidate language’s two-axis state machine if collapsed.**  
   BTE separates Runs now / Design contract / Build next / Owner gate; framework-unification proposes maturity plus promotion axes. Atlas should treat BTE labels as one scene’s status language and use general axes only when authority supports them.

8. **Legacy ontology orthogonality is a strategic bet, not a measured property.**  
   `implementation/domainspec/vault/ontology-conventions.md:18-28,330-361,405-461` explicitly says orthogonality is review-enforced and future-measured. It cannot substantiate current categorical independence or geometric orthogonality.

### 4. Attractive concepts that should stay excluded

- **“Non-representable presheaf = LLM hallucination detector.”** The mathematical non-representability result is real, but the LLM mapping is expressly interpretive and unformalized (`category-theory...cards.md:69-92`).
- **Vect/metric-enriched latent-space DomainSpec.** No Vect-valued Lean formalization exists; categorical and geometric orthogonality are not unified (`category-theory...cards.md:118-138`).
- **CyberAlchemy stages as a functor chain.** Attractive system metaphor, but stages are not declared categories and intermediate categories are not enumerated (`category-theory...cards.md:140-159`).
- **“Reality has surplus over any schema.”** This is philosophical interpretation, not the literal M6 theorem. The formal result refutes a universal implication for a stated construction.
- **“Every presentation leaves residue” / “colimit is strictly less than structure.”** The latter was explicitly demoted as claim > proof (`EPISTEMIC-POSITION.md:100-131`).
- **A focus scene as ontology branch, layer, or sufficient meaning unit.** Explicitly rejected by the Body War review (`findings.md:73-80`).
- **Spatial rotation as causality, time, execution, or authority.** Projection geometry is forbidden from carrying those meanings (`findings.md:23-29`).
- **A successful tour or exact navigation as comprehension evidence.** All inspected UI sources preserve the human-study ceiling.
- **The Financial Settlement scene as generic DomainSpec meaning.** It is one consumer route with `authority_effect:none`; its business semantics must stay local.
- **The simple-ontology “map is not government” phrase as a canonical definition.** Useful metaphor, non-authoritative source.
- **“Lean proves the software is correct/bug-free.”** Even the optimistic explainer bounds theorem scope to structural well-formedness and human intent (`EXPLAINER-INDEPTH.md:149-177,229-266`).
- **Current runtime two-way language↔validator coupling.** The same explainer says it is designed, not running (`:212-225,268-270`).

### 5. Learner outcomes the Atlas can legitimately target

After a guided pass, a learner should be able to:

1. Retell DomainSpec as an authored meaning graph whose typed relationships can generate bounded validation obligations—not merely as a diagram.
2. Distinguish authored source, normalized semantic read model, derived obligation, code binding, test execution, evaluator output, receipt, and owner decision.
3. Explain why a structurally legal edge is not yet behavioral proof.
4. Read every status on two questions: “What exists or ran?” and “Who, if anyone, admitted/promoted it?”
5. Follow one exact consumer example from business promise to current proof gap without generalizing its business semantics.
6. Understand the category-theoretic route as an optional formal model: L1 concepts, L2 artifacts, translation by `Δ`, representability, and residue.
7. State the exact negative lessons of M2 and M6: unrestricted representability fails; schema discipline alone does not guarantee universal instance fidelity.
8. Recognize the restricted positive result: fidelity is recoverable on a specifically characterized essential image under named assumptions.
9. Inspect theorem, check, human judgment, candidate interpretation, and unsupported aspiration as distinct claim classes.
10. Navigate a large graph through bounded focus scenes and directed portals while preserving provenance, relation direction, authority status, and return history.
11. Explain that accessible deterministic interaction is evidence of reachability/state consistency, not comprehension.
12. Identify residue as named missing preservation/evidence rather than as a decorative “unknown.”

### 6. Claim ceilings

- **Overview ceiling:** may synthesize a navigable read model; may not become a new canonical definition of DomainSpec.
- **Formal ceiling:** theorem labels must quote the exact proposition status—proved, refuted, conditional, assumed, open, or contains `sorry`. Formal-project metaphors do not inherit theorem status.
- **Semantic ceiling:** a projection edge or layout cannot add meaning beyond its source relation and must preserve source, selector, status, and authority.
- **Lifecycle ceiling:** implementation, validation, evidence, admission, promotion, release, and deployment remain separate axes/acts.
- **Receipt ceiling:** a receipt reports a bounded evaluation against named inputs; it neither becomes source authority nor authorizes promotion.
- **Consumer ceiling:** Financial Settlement and Body War are explanatory routes over a composed model, not generic DomainSpec definitions.
- **UI ceiling:** exact arrays, keyboard parity, focus visibility, and serialized state support structural browser claims only; no human-comprehension claim survives without a study.
- **Category-theory ceiling:** do not equate current v2 meta-types, compiler behavior, LLM latent spaces, or language layers with categorical constructs unless a current owner artifact establishes the binding.
- **Ontology ceiling:** “map of meaning” and “map with receipts” are useful non-normative intuitions; ontology does not govern, promote, release, or prove code.
- **Assurance ceiling:** theorem > deterministic check > human judgment is a useful legend, but each displayed claim must bind to its actual mechanism and scope. A validated blueprint may still encode the wrong intent.
- **Holism ceiling:** “holistic” can mean bounded coverage of the enumerated source families and explicit gaps. It cannot mean the repository has one settled definition spanning all those families.

The strongest Atlas design is therefore a single source-addressable semantic model with multiple explicitly non-authoritative routes: newcomer map, source-to-receipt lifecycle, formal counterexample route, and consumer scenes. The design becomes misleading the moment those routes are flattened into one ontology truth or one “proved system” story.


