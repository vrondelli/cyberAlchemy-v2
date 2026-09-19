# DomainSpec Atlas synthesis

## 1. Exact-bound answer

The repository does not support one universal, authority-complete definition of DomainSpec spanning semantics, compilation, proof, runtime, and release.

The smallest defensible synthesis is:

> DomainSpec is a repository-local language for authoring consumer-owned, typed domain concepts and source-owned directed relationships; validating their finite formation and endpoint laws; normalizing them into a provenance-bound semantic read model; and deriving or checking bounded implementation obligations under separate layering, validation, drift, admission, and release owners.

That definition is current only within its exact authority boundary:

- “Executable typed graph” means derivable and checkable, not a self-running application (`research.md`, Peirce, “What DomainSpec currently says it is”; live `projects/domainspec-v2/definitions/DEFINITIONS.md:144-170`).
- The strongest current mathematical characterization is a typed composable graph fragment, not a proved category or universal compiler (`research.md`, Peirce; live `projects/domainspec-v2/definitions/DEFINITIONS.md:1003-1055`).
- Authored sources and generated read models are distinct: implementation projections do not become root semantic authority (`research.md`, Peirce definition matrix; live `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:42-53`; `projects/domainspec-v2/impl/spec/minted-project/INDEX.md:7-12`).
- Current executable evidence establishes structural derivation and one candidate-local direct TypeScript Enum proof shape, not a governed business-to-release chain, general ontology-to-code compiler, production readiness, or release authorization (`research.md`, van Lamsweerde, “Executive finding”; live `projects/domainspec-v2/impl/test-derivation-engine/README.md`, “Pipeline” and “Status”; `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/proof-receipt.json`; `projects/domainspec-v2/development/first-production-release/ROADMAP.md`, “Ordered route” and “Release rule”).
- Historical, formal, candidate-language, explanatory, and consumer corpora enrich interpretation but do not silently override current v2 (`research.md`, Ashby, “Corpus census” and “Conflicts with current v2”).

The Atlas therefore must be a composed, source-addressable read model with visible owner seams—not a new canonical ontology and not a claim that the repository already has one closed lifecycle.

## 2. Source-family coverage census

| Source family | Role in synthesis | Atlas admission | Claim ceiling and exact binding |
|---|---|---|---|
| Repository-local authority | Current ownership, default-deny governance, local/external authority boundary | Overview authority rail | Local governance only; external L2 signature remains pending. Peirce census; `projects/domainspec-v2/authority/AUTHORITY-MODEL.md:14-17,47-64`; constitution `:42-53,55-94,136-169` |
| Current definitions | Canonical method vocabulary, graph model, authoring/contract split, formation, relationship signatures | Language Authority zone | Current semantics, including explicitly interim terms; not runtime or production proof. Peirce census; `projects/domainspec-v2/definitions/DEFINITIONS.md:144-218,220-379,1003-1055` |
| Meta-type registry | DS-D1 identities, categories, active/candidate/deferred/superseded states | Language Authority detail | Thirteen active backend kinds; UI candidates/deferred remain non-active; Saga is superseded. Peirce census/matrix; `definitions/meta-types/meta-types.md:6-52`; `meta-types.yml:8-41,45-278` |
| Relationship registry | DS-D2 verbs and DS-D8 directional endpoint signatures | Language Authority detail | Thirty-one active signatures; generated/deferred/deprecated policies remain distinct. Peirce census; `definitions/relationships/relationships.md:1-98,125-157`; `relationships.yml:517-546` |
| Formation and profiles | Per-kind criteria and bounded admitted source subsets | Admission zone | Active backend formation is not universal profile support; UI/SFOL are development-only. Peirce census; `impl/spec/meta-types/`; `impl/spec/minted-project/INDEX.md:1-56`; `supported-profiles.yml:1-67`; `ui-profile/profile.yml:1-6,15-132`; `sfol-profile/profile.yml:1-12` |
| Consumer-authored source packs | Concrete business meaning owned by projects/features | Authoring zone and consumer routes | Source shape and selected-profile conformance, not business truth or generic DomainSpec meaning. Peirce census/matrix; Financial Settlement and UI Create Player `project.json`/`feature.json` selectors cited there |
| Generated graph/provenance | Normalized layout-neutral semantic read model plus exact source bindings | Semantic Graph zone | Deterministic representation and provenance only; never parallel semantic authority. Peirce matrix; `impl/spec/minted-project/graph.schema.json:1-54`; Financial Settlement source manifest `:1-75` |
| Validators and structural derivation | Content/relationship/meta-type checks, stable structural obligations, test-program emission | Derivation zone | Structural accounting and named rules only; not behavioral correctness. van Lamsweerde census; `impl/tools/validate-content.ts`, `validate-relationships.ts`, `validate-meta-types-noncollapse.ts`; `impl/test-derivation-engine/src/README.md`, reader/rules/residue/provenance/emitter |
| BTE lifecycle | Contract publication, development mechanisms, proof cases, mutation/replay, consumer aggregation | Proof route and lifecycle detail | L0A is receipt-synchronized; later executable code does not close owner-gated L0B–L8. van Lamsweerde census; BTE `WORK-PACK.md`, “Current State”, “L0 Output Contract”, layer/gate tables; `EXECUTION-PACK.md`, W1–W9 |
| Architecture conformance experiment | Profile-driven evaluation over expected and observed facts | Realization/evaluation detail | Candidate evaluator over supplied facts; no generic live-source adapters in its validation report. van Lamsweerde census; `development/implementation-conformance/ontology-experiment/README.md`, “Execution Model” and “Demonstrated Result”; `VALIDATION-REPORT.md`, “Claim Ceiling” |
| Enum realization/compiler evidence | Projection, generation, compile, observation, evaluation, mutation, replay, atomic receipt mechanics | Realization and proof route | One candidate-local direct TypeScript Enum shape; current working-tree/unjoined evidence, not a general compiler. van Lamsweerde census/blind spots; `impl/architecture-conformance/realization/`; `development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json`, `SWU-ARE-002.json`, `SWU-ARE-003.json`; `runs/order-status-v1/proof-receipt.json` |
| Financial Settlement | Consumer-local business-to-proof route with an honest expected-red gap | Reused guided route | No direct P4→FS-POST-001 identity, full proof receipt, bound mutation/replay, or promotion. van Lamsweerde “End-to-end trace”; `ontology-experiment/examples/financial-settlement-business-to-obligation.scene.json`, selectors `obligation_read_model`, `full_obligation_status`, `receipt_status`, `proof_boundary`; `financial-settlement-proof-lifecycle.ontology.json`, view `promise-to-proof` |
| Body War | Bounded application witness and reusable semantic navigation pattern | Reused guided route | Passing package/bridge receipts have `authority_effect:none` and `release_admission:not-granted`; complete Enum realization remains absent. van Lamsweerde census; `projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/`; `body-war-suggested-track-lifecycle.scene.json`, twelve mechanisms |
| First Production Release | Ordered gates from component evidence to external authorization | Owner Decision frontier | Explicitly production unauthorized; component receipts cannot substitute for FPR joins or FPR-15. van Lamsweerde census; `development/first-production-release/ROADMAP.md`, “Ordered route” and “Release rule” |
| Historical implementation/research | Earlier lifecycle, ontology, confidence, and research-definition precedents | Optional provenance/history detail | Historical or program-local authority only. Ashby census; `implementation/domainspec/`; `research/projects/domainspec/definitions/DEFINITIONS.md:1-22` |
| Formalization and Lean | Exact theorem/counterexample status, representability, residue, restricted recovery | Optional Formal Depth route | Authority only for exact mechanized propositions; metaphors do not inherit theorem status. Ashby enrichment matrix; `domainspec-formalization/GLOSSARY.md:18-42,66-72,92-120`; `M2Counter.lean:1-12,49-74`; `M6Counter.lean:103-108,143-200`; `M6Restricted.lean:65-134` |
| Candidate language design | Contract/schema/iteration and maturity/promotion distinctions | Explanatory lens, not canonical zone | Candidate language model with unresolved obligation identity and syntax. Ashby matrix/conflicts; `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:15-40,102-163,214-250`; `EXPLAINER-INDEPTH.md:47-68,115-177,212-225,268-270` |
| Existing canvas/scenes/UI review | One graph, multiple routes; navigation, provenance, accessibility patterns | Presentation contract | Projection behavior and reachability, not semantic authority or comprehension proof. Ashby matrix; `unified-canvas-model.mjs:35-80,98-148,216-249`; Body War review `findings.md:21-80` |
| Inventory | Discovery and routing | Excluded from load-bearing authority | Non-authoritative by dispatch packet. `strategy-inventory-packet.md`, “Non-Authority Notice” |

Coverage is bounded to these enumerated families. “Holistic” means that their distinctions and gaps are visible, not that they resolve into one settled definition.

## 3. Definition and claim matrix

| Atlas claim | Class | Exact meaning | Must not be read as |
|---|---|---|---|
| DomainSpec language boundary | Current semantic authority | Consumer intent is authored through admitted kinds, formations, relationships, and profiles | Runtime, deployment, or external authority |
| Meta-type | Current/mixed authority | A concept has one staged kind with structural criterion and edge participation | All staged kinds active or implemented |
| Relationship signature | Current semantic authority | A directional `(verb, source kind, target kind, scope, multiplicity)` is admitted or rejected | Behavioral usefulness or code conformance |
| Authored source | Consumer-local authority | The project/feature/node record owns concrete meaning and outgoing edge declaration | Universal domain truth |
| Selected profile | Experimental/development contract | Narrows the available source language for one run | Universal current DomainSpec profile |
| Normalized semantic graph | Generated projection | Layout-neutral representation bound to exact source and registry digests | Editable or parallel semantic authority |
| Structural obligation | Implemented derivation | Stable checkable responsibility derived from declarations | Behavioral meaning or satisfaction |
| Architecture realization | Bounded implementation/candidate | Enum definition/profile/binding projects to one exact TS Enum realization specification | General ontology-to-application compiler |
| Execution/observation/evaluation | Implemented bounded mechanism | Generated or existing code is compiled, observed, and compared to a named obligation | Business promise proven |
| Mutation/replay | Implemented bounded mechanism | A declared mutant causes an expected finding and raw inputs reproduce in a separate process | Broad causal coverage or release reproducibility |
| Receipt | Passing or candidate evidence | Binds bounded inputs, procedure, outputs, verdict, and claim ceiling | Authority, promotion, or release |
| Drift finding | Current evidence/gap | Observed implementation or evidence diverges from a named source/profile/binding | Automatic correction or owner decision |
| Claim acceptance | Owner decision | A separate owner admits what the evidence may support | Implied by green checks |
| Release authorization | External decision | Exact-bit release is explicitly authorized and recorded | Implied by any local receipt |
| Formal theorem/counterexample | Formal authority | Exact proposition has proved/refuted/conditional/open status | Current runtime semantics or software correctness |
| Consumer scene | Explanatory/consumer-local | A route through shared source-addressable nodes for one bounded application | Generic DomainSpec definition |
| Candidate design | Validated design | A coherent intended contract or plan exists | Implemented mechanism |
| Missing link | Gap | Required identity or transition has no exact source-backed edge | Permission to infer a likely connection |

## 4. Smallest complete Atlas zone set

The eight explorer-proposed zones can be reduced to seven without collapsing owners:

1. **Language Authority**  
   Governance, definitions, DS-D1 kinds, categories, DS-D2 verbs, DS-D8 signatures, formation laws. It answers “what may be authored and who owns the vocabulary?”

2. **Consumer Authoring**  
   Project → feature → node source → outgoing connection. It answers “where does concrete business meaning live?”

3. **Admission and Normalization**  
   Selected profile + source layout + validators → normalized semantic graph + provenance. This merges formation/admission and semantic-graph production into one stage while keeping source and generated output visually separate.

4. **Derivation and Realization**  
   Structural obligations, architecture profiles, realization specifications, language IR, generated source, and explicit missing bindings. It answers “what responsibilities or code shapes can be derived?”

5. **Observation and Evidence**  
   Execution, observation, evaluation, mutation, replay, residue, and receipts. It answers “what ran, what was observed, and how narrowly may the result be claimed?”

6. **Drift and Owner Decisions**  
   Drift routing, lifecycle frontier, claim acceptance, conformance joins, pilot, external authorization, release record. It answers “what remains divergent, admitted, blocked, or externally decided?”

7. **Projection and Guided Learning**  
   Overview, source/provenance drawers, Financial Settlement, Body War, BTE, and optional formal route. It is a non-authoritative presentation layer over zones 1–6, never a second graph.

The candidate framework’s contract/schema/iteration model should not become an eighth canonical zone. Use it as an optional explanatory lens across Language Authority, Admission/Normalization, and Drift/Decisions (`research.md`, Ashby matrix; live `DESIGN-PACKAGE.md:15-40,136-163`).

## 5. Typed bridges and feedback loops

Every bridge needs `source`, `selector`, `owner`, `artifact_status`, `authority_effect`, `release_admission`, and `claim_ceiling`.

| Bridge | Type/status | Exact-bound interpretation |
|---|---|---|
| `ConsumerIntent --authored-as--> NodeSource` | Current, consumer-owned | Source record, not truth proof |
| `NodeSource --declares-outgoing--> Connection` | Current, source-owned | Compiler derives `from`; reverse navigation is generated |
| `MetaType + Formation + Profile --admits/rejects--> NodeSource` | Current or profile-bounded | Kind existence, profile membership, and formation support remain distinct |
| `RelationshipSignature --admits/rejects--> Connection` | Current semantic law | Legal structure, not behavioral proof |
| `SourceSet + RegistryDigests + Profile --normalizes-to--> SemanticGraph` | Generated | Compiled read model, not new authority |
| `SemanticGraph --derives-structural--> ObligationUniverse` | Implemented bounded mechanism | Never label `proves` or `implements` |
| `FormalClause --semantic-origin-of?--> Obligation` | Missing/contested when unbound | Financial Settlement P4→FS-POST-001 must be a red broken edge |
| `DefinitionSnapshot --projects-to--> ArchitectureRealizationSpec` | Bounded Enum implementation | One family only |
| `ArchitectureProfile --constrains--> ArchitectureRealizationSpec` | Profile-local | Do not generalize TS/Python/Rust policies into semantic meaning |
| `ArchitectureRealizationSpec --lowers-to--> LanguageIR --emits--> GeneratedSource` | Bounded implementation | Generated code is not an application |
| `GeneratedSource --compiled-as--> CompileResult` | Executable | Compilation is not observation |
| `IndependentAdapter --observes--> ObservationProjection` | Executable bounded | Older generic experiment uses supplied facts; current Enum adapter is narrower working-tree evidence |
| `ObligationCatalogue + ObservationProjection --evaluated-by--> ArchitectureEvaluation` | Executable bounded | Exact obligation verdict only |
| `Mutation --causes--> ExpectedFinding` | Executable causal witness | Require named mutant and expected diagnostic |
| `RawInputIndex --replayed-in-separate-process--> ReplayResult` | Executable reproducibility witness | Local replay, not release reproducibility |
| `Evaluation + KilledMutation + Replay --bound-into--> ProofReceipt` | Candidate-local/current depending joined receipt | Scope and lifecycle join must be visible |
| `ExecutionFrontier --requires--> SWUTerminalReceipt` | Governance gate | Exposes the unjoined `order-status-v1` contradiction |
| `DriftFinding --routes-to--> Definition/Profile/BindingOwner` | Partly modeled, generally unautomated | Route is not automatic remediation |
| `ProofReceipt --requires-separate--> ClaimAcceptance` | Owner gate | Evidence cannot self-promote |
| `ClaimAcceptance --requires-external--> ReleaseAuthorization` | External gate | No implicit release |
| `ReleaseAuthorization --records--> ImmutablePrivateRelease` | Target/external | Production remains unauthorized |

Feedback loops:

- **Source correction:** validation failure → owning node/relationship/profile source → renormalize.
- **Implementation drift:** evaluation or conformance finding → binding/profile/definition owner → revise source or implementation → regenerate → reobserve.
- **Causal proof:** positive evaluation → declared mutation → expected finding → raw-input replay → scoped receipt.
- **Evidence staleness:** changed source/profile/tool digest → invalidate stale handles/receipts → rerun from raw inputs.
- **Lifecycle closure:** technical receipt → terminal SWU receipt → claim acceptance → conformance join → pilot → external authorization.
- **Formal learning:** conjecture → counterexample → restricted hypothesis → theorem → named residue; never feed a formal analogy back into current semantic authority without an owner decision.
- **Presentation:** selection/route state → source-addressed projection → return to same canonical node; presentation never writes semantic authority.

## 6. Status and authority legend

Use independent fields rather than one overloaded color:

- `semantic_state`: active | candidate | deferred | superseded | deprecated | generated
- `artifact_status`: executable-current | passing-receipt | candidate-fixture | validated-design | development-only | experimental | unimplemented-target | missing-link | external-decision
- `evidence_class`: authored-source | generated-read-model | deterministic-check | execution-observation | evaluation | mutation-witness | replay-witness | receipt | theorem | counterexample | human-judgment
- `authority_class`: current-semantic | implementation-local | consumer-local | historical | formal | explanatory | none
- `authority_effect`: none | local-ratification | external-required
- `release_admission`: not-granted | owner-gated | authorized
- `confidence`: source-bound | indirect | contested | stale
- `claim_ceiling`: one plain-language sentence.

Visual line grammar:

- solid: current source-backed or executable connection;
- solid plus receipt badge: passing and lifecycle-joined receipt;
- dashed: validated design or proposed connection;
- dotted: interpretation or indirect correspondence;
- red broken: required but missing exact binding;
- gate diamond: independent/external owner decision;
- grey halo: generated/candidate read model with `authority_effect:none`.

Do not use “green” as shorthand for correct, admitted, released, or understood.

## 7. Node-detail contract

Every inspectable node must show:

1. Stable node ID and ordinary-language label.
2. Node class and owning source family.
3. Exact live path, selector, optional digest/receipt ID.
4. Owner and consumer/project scope.
5. Semantic state.
6. Artifact status.
7. Evidence class and evidence mechanism.
8. Authority class/effect.
9. Release admission.
10. Typed inputs and outputs.
11. Incoming/outgoing typed relations with direction and multiplicity.
12. “What this establishes.”
13. “What this does not establish.”
14. Missing, indirect, contested, or stale bindings.
15. Drift target and next owner, when applicable.
16. Available detail view and guided routes.
17. Historical/formal aliases, explicitly non-canonical.
18. Claim ceiling.

For formal nodes additionally show proposition text/selector and status: proved, refuted, conditional, assumed, open, or contains `sorry`. For receipts, show exact inputs, procedure, outputs, verdict, lifecycle join, `authority_effect`, and `release_admission`. For generated nodes, show source-set and registry/profile digests and prohibit editing.

## 8. Placement table

| Content | Overview | Detail | Guided route |
|---|---:|---:|---:|
| Current DomainSpec bounded definition | Yes | Source drawer | Newcomer route |
| Seven zones and owner seams | Yes | — | Lifecycle route |
| DS-D1 categories/status totals | Summary | Full cards/register | Type exploration |
| DS-D2/DS-D8 meaning | Summary | Full signatures | Rule→Operation or creation route |
| Source vs generated graph | Yes | Digest/provenance | Both consumer scenes |
| Profiles | Boundary warning | Supported subsets/status | Admission route |
| Obligation derivation | Summary | Key/provenance/residue | Source-to-receipt |
| Architecture realization | “bounded” marker | Family/language detail | Body War/Enum route |
| Execution/evaluation/mutation/replay | Evidence lane | Artifact/receipt detail | Proof route |
| Drift and owner gates | Persistent side rail | Owner/action detail | Release frontier |
| Financial Settlement | Entry portal only | Local node details | Existing tour, reused |
| Body War | Entry portal only | Local node details | Existing tour, reused |
| Formalization | Optional portal | Theorem/counterexample cards | Counterexample/restriction route |
| Historical/candidate language models | Optional provenance badges | Comparison view | Optional explanatory route |
| Raw source-family census | No | Coverage drawer | Audit route |
| Comprehension/accessibility obligations | Interaction metadata | Validation panel | All guided routes |

## 9. Semantic-route contract

All routes operate over one canonical source-addressable read model and may add only presentation state.

Required route state:

- `route_id`, `route_version`;
- ordered `step_ids`;
- canonical node/edge IDs;
- source path/selector binding;
- expected semantic status and evidence class;
- highlighted relation tuple: source, predicate, target type, direction, destination, provenance, status, authority;
- entry trace and return trace;
- explicit negative control at each claim boundary;
- `authority_effect:none`.

Interaction obligations, from Ashby’s Body War UI evidence (`research.md`, enrichment matrix; live review `findings.md:21-69`):

- bounded focus scene;
- deterministic one-hop fallback;
- labeled portals across zone boundaries;
- pointer, keyboard, and reduced-motion parity;
- persistent relation tuple;
- atomic pivot;
- suspend/restore prior trace;
- vocabulary consistency across search, card, detail, and pivot.

### Financial Settlement reuse

Keep the existing route and add zone/claim overlays; do not rewrite its business meaning into generic ontology:

1. consumer business promise;
2. authored source;
3. generated semantic graph;
4. P4 formal/business clause;
5. obligation universe;
6. red broken missing edge P4→FS-POST-001;
7. candidate architecture contracts;
8. partial generated verification;
9. indirect runtime checks;
10. exact expected-red evaluation;
11. missing per-key mutation/replay;
12. not-issued receipt;
13. drift finding;
14. blocked owner decisions.

The route’s decisive lesson is that a rich chain can still be incomplete because the identity and evidence joins are absent.

### Body War reuse

Retain the existing SuggestedTrack route and overlay:

1. consumer-local Rule/status meaning;
2. passing DomainSpec/ontology/integration/bridge receipts;
3. missing complete Enum definition;
4. target architecture realization specification;
5. bounded direct TS Enum proof mechanics where comparable;
6. `authority_effect:none`;
7. `release_admission:not-granted`;
8. missing controlled pilot/FPR joins.

The route’s decisive lesson is that passing bounded receipts and concrete application code do not create a universal ontology-to-code pipeline.

Neither route order may imply workflow, causality, authority, or ontology branching unless the displayed typed edge explicitly says so.

## 10. Candidate additions, merges, exclusions, and gaps

### Add

- Persistent multi-axis status/authority legend.
- Explicit missing/indirect/contested/stale edges.
- Source/provenance drawer.
- Obligation identity and claim-limit fields.
- Receipt-to-owner-decision separation.
- Drift routing and lifecycle frontier.
- Optional formal counterexample route.
- Existing consumer-route portals.
- Claim ceiling on every node.
- Negative controls: legal edge ≠ behavior; generated test ≠ execution; receipt ≠ promotion; route completion ≠ comprehension.

### Merge

- Formation and profile admission into one zone, while retaining separate fields.
- Normalization and provenance into the same zone, with authored/generated split.
- Execution, observation, evaluation, mutation, replay, residue, and receipts into one Evidence zone.
- Layering, validation, drift, and owner decisions into a cross-cutting rail plus terminal zone.
- Contract/schema/iteration into an optional explanatory lens, not canonical ontology branches.
- Category-theory carriers into formal-route aliases, never DS-D1 replacements.

### Exclude or demote

- Inventory/research summaries as authority.
- DomainSpec v1 or CyberAlchemy-v2 as current resolution sources.
- Saga as current; UI candidates as active.
- `owned-by` as authored; `depends-on` as active; `enforces-cross` as current.
- Generated graph, Markdown, reverse navigation, manifests, learner views, or receipts as authored truth.
- A universal current profile.
- Full category laws or `Δ` equivalence with the v2 compiler.
- “Non-representable = LLM hallucination.”
- Vect/metric latent-space formalization.
- CyberAlchemy stages as functor chain.
- “Reality always exceeds schema” as theorem.
- Formal four-carrier vocabulary as current DS-D1.
- Contract/schema/iteration as canonical current v2.
- Focus scenes as ontology branches.
- Canvas geometry as causality/time/authority.
- Tour completion as comprehension.
- Financial Settlement or Body War as generic DomainSpec meaning.
- General application generation, cross-language parity, production readiness, deployment, or release.

### Open gaps

1. No owner artifact closes the full business-to-release story.
2. Authoring-plane/contract-plane fuse-versus-generate decision remains interim.
3. No generic learner/navigation projection contract or witnessed semantic-hash invariance.
4. No universal profile; UI DS-D1 formation authority remains absent.
5. No finite proof of full category laws.
6. Software-factory Enum trust denominator has known false-green residue.
7. No general architecture-realization compiler.
8. No cross-language semantic parity or Rule→Operation realization.
9. No common proof-receipt algebra across BTE, architecture proof, Body War, and FPR.
10. No general TestCase-to-receipt closure.
11. No exact P4→FS-POST-001 identity.
12. No complete Body War Enum definition or governed pipeline.
13. `order-status-v1` is proof-complete only inside a candidate-local technical state machine; it lacks the expected governed SWU terminal join.
14. Generic drift-to-refresh automation is absent.
15. Graph conformance, exception algebra, and unsupported language cases remain incomplete.
16. FPR-09 technical join and FPR-13 controlled pilot are absent; FPR-15 is unauthorized.
17. No representative-reader comprehension study.
18. Current working-tree provenance for architecture-realization evidence is not a committed/lifecycle-closed baseline.

## 11. Bounded enrichment blueprint

This is a no-code, owner-preserving blueprint for the existing canvas:

1. **Extend the composed view model, not the ontology authority.**  
   Add projection-only records for zone, owner, semantic state, artifact status, evidence class, authority effect, release admission, claim ceiling, source binding, and gap state. Do not create a second semantic graph.

2. **Lay out the seven zones as a left-to-right lifecycle with a persistent owner/status rail.**  
   Use topology and typed edge styles, not spatial rotation, to express sequence or gaps.

3. **Map existing nodes before proposing new semantic nodes.**  
   Current definitions, authored sources, normalized graph records, obligations, receipts, and consumer artifacts should retain their existing IDs and owners. Presentation-only group nodes must carry `authority_effect:none`.

4. **Add only typed bridges backed by current source identities.**  
   Unsupported joins become explicit red broken edges with a missing-binding record, never inferred relationships.

5. **Reuse Financial Settlement and Body War as route manifests.**  
   They select and order canonical nodes; they do not clone semantic content. Preserve entry/return state and consumer-local labeling.

6. **Add a formal-depth portal.**  
   It exposes M2 counterexample, M6 counterexample, and restricted recovery with theorem-status badges and no edge claiming equivalence to the current compiler.

7. **Add evidence and authority drawers.**  
   The evidence drawer separates generated program, execution, observation, evaluation, mutation, replay, and receipt. The authority drawer separates local semantic ownership, lifecycle admission, external authorization, and release.

8. **Add route-level negative controls.**  
   Financial Settlement must visibly fail closure at P4→FS-POST-001 and receipt issuance. Body War must visibly stop before complete Enum realization and release. The Enum route must show “proof-complete locally / lifecycle unjoined.”

9. **Validate structurally before any comprehension claim.**  
   Required future checks: exact source/selector resolution; stable IDs; no duplicate semantic owners; all projections `authority_effect:none`; every edge typed; every missing binding explicit; route entry/return determinism; keyboard/pointer/reduced-motion parity; digest freshness; and negative-control visibility. Browser success can establish reachability and state consistency only. Human comprehension requires a separate study.

This blueprint authorizes no canvas mutation, definition change, ontology admission, implementation, publication, promotion, release, or deployment.

## 12. Exact-binding closure and recommendation

### Unresolved evidence bindings requiring explorer feedback

No additional explorer feedback is required to begin reviewer tensioning: all load-bearing synthesis rows above bind to an explorer return and an exact live path/selector.

The following are intentionally unresolved repository bindings, not synthesis citation failures:

- Financial Settlement P4 → FS-POST-001 semantic identity.
- A generally admitted business meaning → canonical semantic graph identity.
- Generic learner/navigation projection contract and semantic-hash invariance.
- Current v2 compiler ↔ categorical `Δ` equivalence.
- UI candidate formation authority.
- Complete Body War Enum definition → realization pipeline.
- `order-status-v1` proof run → governed `SWU-ARE-004` terminal/closeout receipt.
- BTE/architecture/Body War/FPR common receipt algebra.
- General TestCase → execution → receipt closure.
- Real source adapters for the broad architecture-conformance ontology.
- Cross-language TypeScript/Python/Rust semantic parity.
- Rule→Operation and remaining meta-type realization support.
- General automated drift → refresh routing.
- FPR-09 component-evidence join, FPR-13 pilot, and FPR-15 authorization.
- Representative-reader comprehension evidence.

If reviewers require any of these to be displayed as a solid current connection, the declared synthesizer→explorers feedback route must be used. Without new exact evidence, each remains missing, indirect, candidate, or externally owner-gated.

**Recommendation: ready for reviewer tensioning, with unresolved bindings rendered explicitly as gaps.** It is not ready for writer treatment as a closed end-to-end lifecycle, and it grants no implementation or authority effect.

Claim ceiling: this synthesis is a private, repository-local research read model over enumerated source families. It may guide an exact-bound canvas enrichment plan. It does not redefine DomainSpec, admit ontology elements, prove a general compiler or runtime, validate human comprehension, authorize implementation, or establish publication, promotion, release, deployment, or production readiness.
