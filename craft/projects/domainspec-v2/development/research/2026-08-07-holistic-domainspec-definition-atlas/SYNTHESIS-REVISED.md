# DomainSpec Atlas synthesis

## 1. Exact-bound definition

The repository does not establish one universal DomainSpec definition spanning semantic authority, compilation, implementation, proof, runtime behavior, admission, and release.

The strongest current synthesis is:

> DomainSpec is a repository-local language for authoring consumer-owned typed domain concepts and source-owned directed relationships, checking their finite formation and endpoint rules, and producing bounded generated representations and implementation checks whose evidence remains subject to separate governance and release decisions.

This statement is bounded as follows:

- Current definitions describe an “executable typed graph,” where executable means derivable and checkable—not a self-running application (`research.md`, Peirce, “What DomainSpec currently says it is”; live `projects/domainspec-v2/definitions/DEFINITIONS.md:144-170`).
- Its present mathematical ceiling is a typed composable graph fragment, not a proved category, universal compiler, or functorial equivalence (`research.md`, Peirce; `projects/domainspec-v2/definitions/DEFINITIONS.md:1003-1055`).
- Root definitions own canonical DomainSpec language; consumer projects own concrete domain meaning; generated projections, implementation artifacts, receipts, and visualizations do not become semantic authority (`research.md`, Peirce definition matrix; `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md:42-53`; `projects/domainspec-v2/impl/spec/minted-project/INDEX.md:7-12`).
- Current executable evidence includes structural derivation and one candidate-local direct TypeScript Enum proof shape. It does not establish a general ontology-to-code compiler, a governed business-to-release chain, or production authorization (`research.md`, van Lamsweerde, “Executive finding”; `projects/domainspec-v2/impl/test-derivation-engine/README.md`, “Pipeline” and “Status”; `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/proof-receipt.json`; `projects/domainspec-v2/development/first-production-release/ROADMAP.md`, “Ordered route” and “Release rule”).
- Historical, formal, candidate-language, explanatory, and consumer materials may clarify or challenge current meaning, but they cannot override current v2 authority (`research.md`, Ashby, “Corpus census” and “Conflicts with current v2”).

The Atlas is therefore a candidate composed presentation view. It references owner-issued identities and source selectors, derives collision-safe presentation IDs, and adds `authority_effect:none`. It is not a canonical cross-family read model, identity registry, ontology, lifecycle owner, or authority surface (`REVIEW-PRECEDENT.md`, rows challenging “canonical read model” and “retain existing IDs”; live `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs:35-49,70-80,98-148,216-249`).

## 2. Source-family coverage census

| Family | Owner role and Atlas use | Exact binding and ceiling |
|---|---|---|
| Repository-local authority | Governs local structure, validation, drift, lifecycle axes, and default-deny boundaries | Peirce census; `projects/domainspec-v2/authority/AUTHORITY-MODEL.md:14-17,47-64`; constitution `:42-94,136-169`. Local authority only; external admission remains separate. |
| Current definitions | Own canonical graph, formation, meta-type, relationship, and composability vocabulary | Peirce census; `projects/domainspec-v2/definitions/DEFINITIONS.md:144-218,220-379,1003-1055`. Current meaning, not runtime or release proof. |
| Meta-type registry | Owns DS-D1 identities and active/candidate/deferred/superseded status | Peirce census; `definitions/meta-types/meta-types.md:6-52`; `meta-types.yml:8-41,45-278`. Thirteen active backend kinds; UI labels remain candidate/deferred; Saga is superseded. |
| Relationship registry | Owns DS-D2 verbs and DS-D8 endpoint signatures | Peirce census; `definitions/relationships/relationships.md:1-98,125-157`; `relationships.yml:517-546`. Thirty-one active signatures; generated, deferred, and deprecated policies remain distinct. |
| Formation specifications | Own per-kind shape criteria | Peirce matrix; `definitions/DEFINITIONS.md:301-337`; `impl/spec/meta-types/`. Formation validity proves shape only. |
| Profiles | Own bounded kind/layout/relation support for named runs | Peirce census; `impl/spec/minted-project/INDEX.md:14-28,47-54`; `supported-profiles.yml:1-67`; `ui-profile/profile.yml:1-6,15-132`; `sfol-profile/profile.yml:1-12`. Profile support is independent of kind status and formation validity. |
| Consumer source packs | Own concrete project/feature/node meaning and outgoing connections | Peirce matrix; `impl/spec/minted-project/node.schema.json:4-16,36`; `connection.schema.json:4-14`. Source ownership and record shape, not universal truth. |
| Generated graph and provenance | Provide profile-scoped graph read models and exact source bindings | Peirce matrix; `impl/spec/minted-project/graph.schema.json:4-23,39-54`; `INDEX.md:14-28,47-54`; Financial Settlement manifest selectors cited in Peirce’s census. Generated representation, never editable semantic authority. |
| Validators and derivation engine | Check named structural rules and derive stable structural checks | van Lamsweerde census; `impl/tools/validate-content.ts`, `validate-relationships.ts`, `validate-meta-types-noncollapse.ts`; `impl/test-derivation-engine/src/README.md`, reader/rules/residue/provenance/emitter. Structural accounting only. |
| BTE | Supplies contract publication, development fixtures, proof cases, replay, and receipts with an owner-gated frontier | van Lamsweerde census; BTE `WORK-PACK.md`, “Current State,” “L0 Output Contract,” layer/gate tables; `EXECUTION-PACK.md`, W1–W9. L0A is joined; later mechanisms do not promote L0B–L8. |
| Architecture-conformance experiment | Evaluates expected versus observed properties over supplied facts | van Lamsweerde census; `development/implementation-conformance/ontology-experiment/README.md`, “Execution Model” and “Demonstrated Result”; `VALIDATION-REPORT.md`, “Claim Ceiling.” Candidate evaluation over hand-authored facts, not general live-source conformance. |
| Enum realization evidence | Supplies exact candidate-local projection, compile, observation, evaluation, mutation, replay, and receipt mechanics | van Lamsweerde census/blind spots; `impl/architecture-conformance/realization/`; `development/architecture-realization-compiler/receipts/SWU-ARE-001.red.json`, `SWU-ARE-002.json`, `SWU-ARE-003.json`; `runs/order-status-v1/proof-receipt.json`. One direct TS Enum shape; unjoined working-tree evidence. |
| Financial Settlement | Consumer-local witness of authored meaning, generated graph, obligations, partial checks, drift, and absent receipt | van Lamsweerde “End-to-end trace”; `ontology-experiment/examples/financial-settlement-business-to-obligation.scene.json`, `obligation_read_model`, `full_obligation_status`, `receipt_status`, `proof_boundary`; `financial-settlement-proof-lifecycle.ontology.json`, `promise-to-proof`. No P4→FS-POST-001 identity or complete causal proof. |
| Body War | Consumer-local witness of hidden meta-type, profile-local realization intent, passing receipts, stale-digest rejection, and non-promotion | van Lamsweerde census and Popper review; `projects/body-war/proofs/suggested-track-ontology-domainspec/receipts/`; `body-war-suggested-track-lifecycle.scene.json`, BW-01–BW-12. Receipts retain `authority_effect:none` and `release_admission:not-granted`. |
| First Production Release | Owns later claim, reproduction, pilot, authorization, and release gates | van Lamsweerde census; `development/first-production-release/ROADMAP.md:25,49,54-75,100,159-161`. Production remains unauthorized. |
| Historical implementation/research | Supplies precedent and provenance | Ashby census; `implementation/domainspec/`; `research/projects/domainspec/definitions/DEFINITIONS.md:1-22`. Historical or evidence-program-local only. |
| Formalization and Lean | Own exact theorem/counterexample claims | Ashby matrix; `domainspec-formalization/GLOSSARY.md:18-42,66-72,92-120`; `M2Counter.lean:1-12,49-74`; `M6Counter.lean:103-108,143-200`; `M6Restricted.lean:65-134`. Optional formal evidence only; not current v2 compiler semantics. |
| Candidate language design | Supplies contract/schema/iteration and maturity/promotion lenses | Ashby matrix; `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:15-40,102-163,214-250`. Candidate interpretation, not current vocabulary. |
| Canvas/scenes/UI review | Supplies candidate presentation mechanics and consumer-local interaction precedent | Ashby matrix; `unified-canvas-model.mjs:35-80,98-148,216-249`; Body War review `findings.md:21-80`. Projection and reachability evidence only. |
| Inventory | Discovery and routing | `strategy-inventory-packet.md`, “Non-Authority Notice.” Excluded from load-bearing authority. |

“Holistic” means bounded coverage of these enumerated families and their gaps. It does not mean they form one settled ontology or lifecycle.

## 3. Definition and claim matrix

| Display concept | Evidence class | What it means | Claim ceiling |
|---|---|---|---|
| What authors may write | Explanatory projection over current definitions | Current kinds, relationship rules, formation requirements, and owner boundaries | Summary only; not a new canonical “language boundary” term (`DEFINITIONS.md:144-170`; constitution `:47-53`). |
| Kind status | Current definition authority | Whether a DS-D1 kind is active, candidate, deferred, superseded, or deprecated | Does not establish formation validity, profile support, implementation, or release (`DEFINITIONS.md:229-264`). |
| Formation result | Current/profile-scoped validation | Whether one record satisfies its kind’s structural criterion | Shape only; not semantic truth or profile support (`DEFINITIONS.md:301-337`). |
| Profile support | Experimental/development contract | Whether a named profile permits that kind, layout, or relationship in one run | Does not activate a kind or define generic architecture (`minted-project/INDEX.md:47-54`). |
| Endpoint check | Current relationship authority | Whether a relationship signature accepts the source-kind/target-kind pair | Legal endpoints only; not usefulness, behavior, or code conformance (`DEFINITIONS.md:339-379`). |
| Authored node source | Consumer-local source | A project-owned record containing an intent statement and outgoing connections | No separate `ConsumerIntent` entity or `authored-as` predicate (`node.schema.json:4-16,36`). |
| Generated graph read model | Generated projection | A named minted source pack compiled into a layout-neutral graph with source/profile digests | Profile-scoped deterministic representation only (`graph.schema.json:4-23,39-54`). |
| Catalogue of structural checks | Implemented bounded derivation | Stable checks produced by the named derivation engine | Not an `ObligationUniverse`, behavioral interpretation, or proof of satisfaction. |
| Enum realization specification | Candidate-local implementation artifact | Exact pinned Enum definition/profile/binding inputs produce one direct TS Enum specification | Not a general architecture-realization compiler. |
| Compile result | Execution output | Named generated source compiled successfully or failed | Syntax/type acceptance only. |
| Observation and evaluation | Bounded executable evidence | A named adapter observes a named artifact and an evaluator compares it to a named obligation | Exact run only; not business correctness. |
| Mutation and replay | Bounded executable evidence | A named mutant causes the expected finding and raw inputs reproduce in a separate process | One causal/reproducibility witness, not general coverage. |
| Technical receipt | Receipt evidence | Named bounded results are recorded with exact inputs and scope | “Proof-complete” only inside the named technical state machine; never self-promoting. |
| Drift finding | Evidence/gap | A named mismatch is observed and may be handed to a named owner for investigation | No automatic repair or generic drift router. |
| Claim decision | Independent owner decision | A claim owner decides what bounded evidence may support | Not implied by a passing receipt (`ROADMAP.md:25,75,159-161`). |
| Release authorization and record | External decision plus operator act | External owners authorize exact bits/boundaries; the release operator separately records them | Neither act exists merely because local evidence is green. |
| Missing binding | Presentation gap record | An enumerated source set contains no exact binding required for closure | It is not a question-mark semantic predicate or permission to infer one. |
| Consumer scene | Consumer-local explanatory route | A bounded walk through owner-issued artifacts and gaps | Never generic DomainSpec meaning. |

## 4. Minimum Atlas structure: six view groupings plus one presentation layer

The six lifecycle groupings are presentation-only. They must not be serialized as DomainSpec meta-types, relationship owners, lifecycle states, or registries.

1. **Rules for what can be authored**  
   Displays root governance, definitions, kind status, relationship verbs, endpoint signatures, and formation rules. It answers which owner-issued rules apply.

2. **Where a project writes its domain meaning**  
   Displays project, feature, node source, intent field, and source-owned outgoing connections. It keeps Financial Settlement and Body War meaning consumer-local.

3. **Checks before and during graph generation**  
   Visually co-locates but does not merge:

   - kind status;
   - formation validity;
   - selected-profile support;
   - source validation;
   - generated graph read model;
   - provenance/digest binding.

4. **Checks derived and code shapes attempted**  
   Visually co-locates but preserves separate owners for structural-check derivation, architecture profile selection, exact Enum realization inputs, generated code, and known missing bindings.

5. **What ran and what evidence exists**  
   Keeps generation, compilation, execution, observation, evaluation, mutation, replay, and receipt individually inspectable.

6. **Problems found and decisions still required**  
   Displays drift, missing task closeout, claim acceptance, conformance joins, pilot gates, external authorization, and release recording without inventing one lifecycle controller.

The separate **Views and guided examples** layer has `authority_effect:none`. It supplies the overview, source/provenance detail, Financial Settlement route, Body War route, filters, and presentation-only gap annotations. It references owner-issued identities through collision-safe presentation IDs. It neither owns nor rewrites source status.

The formal M2/M6 route, contract/schema/iteration lens, general formal-learning loop, entry/return restoration, and accessibility acceptance claims are deferred from the minimum Atlas. They may be separately added only after exact route or validation witnesses exist.

## 5. Candidate projection legend

This is a display mapping, not a universal repository schema. Source-native statuses remain visible verbatim. The Atlas must not copy mapped values back into an owner source or new registry.

Minimum display dimensions:

| Dimension | Use |
|---|---|
| `artifact_kind` | Source record, generated graph, generated check, observation, evaluation, receipt, decision, or other exact source-native kind |
| `owner_native_status` | Verbatim status from the owning artifact |
| `source_posture` | Constitutional/source-owned posture where present |
| `definition_status` | Projection of active/candidate/deferred/superseded/deprecated; never `generated` |
| `formation_validity` | Separate pass/fail/not-run/not-applicable result for the relevant shape rule |
| `profile_support` | Separate supported/unsupported/not-evaluated result for the exact selected profile |
| `implementation_status` | Constitutional or owner-native implementation state |
| `execution_verdict` | Not-run/pass/fail/skipped or exact owner-native verdict |
| `evidence_status` and `evidence_class` | Whether evidence exists and what mechanism produced it |
| `confidence_status` | Preserved constitutional axis when owner-issued |
| `authority_effect` | Preserved owner-issued value; `none` forbids automatic promotion |
| `policy_effect` | Preserved constitutional axis where applicable |
| `lifecycle_stage` | Preserved owner-native or constitutional stage |
| `release_admission` | Preserved source-native release status; never inferred |
| `binding_status` | Presentation relation condition: direct, indirect, missing, contested, or stale |
| `binding_confidence` | Optional presentation assessment with explicit rationale; never substituted for constitutional `confidence_status` |
| `claim_ceiling` | One testable sentence stating the maximum supported claim |

The presentation must encode relation basis separately from execution status. A solid semantic source relation cannot also mean “executed,” and a receipt badge cannot mean “lifecycle joined” unless a joined terminal receipt exists.

Recommended visual distinctions:

- owner-issued source relation;
- source-record containment;
- generated/provenance link;
- observed execution;
- candidate presentation correspondence;
- red broken missing binding;
- stale binding;
- independent/external gate.

No color or “green” state may collapse definition status, execution verdict, evidence, authority, release, or comprehension.

## 6. Owner-preserving displayed connections

These are ordinary-language annotations over exact owner mechanisms. They are not new DS-D2 verbs.

| Display annotation | Basis and status | Ceiling |
|---|---|---|
| “A consumer writes a node source containing an intent statement.” | Projection-only prose over `node.schema.json:4-16,36` | No `ConsumerIntent` node or `authored-as` predicate. |
| “The source node declares this outgoing connection; normalization derives `from`.” | Source-record containment; `connection.schema.json:4-14`; `minted-project/INDEX.md:47-54` | Source ownership and direction only; not a new semantic verb. |
| “This kind is currently admitted.” | DS-D1 owner; `DEFINITIONS.md:229-264` | Independent of record validity and profile support. |
| “This record satisfies or fails the kind’s shape rule.” | Formation owner; `DEFINITIONS.md:301-337` | Shape only. |
| “This selected profile supports or rejects the kind/layout.” | Named profile; `minted-project/INDEX.md:47-54` | Profile-local only. |
| “This endpoint signature accepts or rejects the source-kind and target-kind pair.” | DS-D8 owner; `DEFINITIONS.md:339-379` | Endpoint legality only. |
| “This minted source pack compiles to this generated graph read model.” | Experimental minted mechanism; `graph.schema.json:4-23,39-54`; `INDEX.md:14-28` | Deterministic representation, not semantic correctness. |
| “This named derivation run produces this catalogue of structural checks.” | Derivation engine; `impl/test-derivation-engine/src/README.md` | Bounded structural checks, not behavioral proof. |
| “No source-backed identity links P4 to FS-POST-001.” | Consumer-local gap; Financial Settlement `formal_clause` and `proof_boundary`; `research.md:212-233` | Absence record, not `semantic-origin-of?`. |
| “Pinned Enum definition/profile/binding inputs produce this TS Enum realization specification.” | Candidate-local Enum implementation files and receipts | One family/language only. |
| “The generated source compiled successfully/failed.” | Exact compiler-run output | Compile acceptance only. |
| “This adapter observed this artifact; this evaluator compared it with this obligation key.” | Exact-run observation/evaluation artifacts | One named run only. |
| “This named mutant caused the expected diagnostic.” | Exact mutation evidence | One causal witness. |
| “Raw inputs reproduced this result in a separate process.” | Exact replay artifact | Candidate-local reproducibility only. |
| “These bounded results are recorded in this technical receipt.” | Exact receipt and joined/not-joined state | No self-acceptance or promotion. |
| “Governed task closeout is missing.” | Gate annotation from missing `SWU-ARE-004.json`/closeout evidence | No `ExecutionFrontier` or `SWUTerminalReceipt` ontology nodes. |
| “Suggested owner for investigation.” | Candidate handoff annotation tied to a named drift finding and named next owner | Routing suggestion, not automated transition. |
| “A technical receipt does not accept its own claims.” | FPR gate; `ROADMAP.md:25,75,159-161` | Separate claim-owner decision required. |
| “External owners authorize exact bits and boundaries.” | FPR external gate | Authorization remains absent until explicitly issued. |
| “The release operator records the immutable private release.” | Separate FPR operator act; `ROADMAP.md:159-161` | Must not be collapsed with authorization. |

## 7. Feedback overlays

These are route overlays assembled from separately owned transitions, not one implemented feedback controller.

- **Source correction:** a named validation failure points back to the exact owning source, relationship, formation, or profile. It does not mutate that source.
- **Implementation drift:** Financial Settlement’s optional event-handler drift points to the relevant definition, binding, or implementation owner for investigation; existing evidence remains inspectable (`financial-settlement-proof-lifecycle.ontology.json`, `drift.P4-optional-event-handler`).
- **Causal proof:** partial/planned for Financial Settlement. The missing-event negative control and FS-POST-001 receipt remain unexecuted/not-issued. Body War has bounded rejected mutations, but not the missing general architecture evaluator.
- **Evidence staleness:** Body War’s stale ontology digest must produce `BRIDGE_STALE_ONTOLOGY_DIGEST`, remove current-validity styling, and preserve the stale evidence for inspection.
- **Lifecycle closure:** technical receipt → separate claim decision → independent reproduction/conformance/pilot where required → external authorization → release-operator record. These are independent gates, not automatic forward edges.
- **Presentation interaction:** selection and route state are presentation invariants, not lifecycle feedback.

## 8. Minimum node/detail contract

Every displayed item needs only:

1. Collision-safe presentation ID and ordinary label.
2. Owner-issued identity, artifact kind, and exact path/selector.
3. Owner and project/profile scope.
4. Relevant source-native status fields.
5. Separate definition status, formation validity, and profile support where applicable.
6. Relevant implementation, execution, evidence, authority, lifecycle, and release values.
7. Typed owner-issued incoming/outgoing relations or clearly labeled presentation annotations.
8. Binding status and any explicit binding gap.
9. One claim ceiling.

Conditional fields:

- **Receipt:** exact inputs, procedure, verdict, receipt scope, lifecycle join, `authority_effect`, `release_admission`.
- **Generated artifact:** source/profile/registry digests and generation identity.
- **Formal artifact:** exact proposition and status—proved, refuted, conditional, assumed, open, or contains `sorry`.
- **Drift:** observed mismatch, preserved prior evidence, finding owner, and suggested next owner.
- **Mutation/replay:** named mutant/raw input, expected diagnostic, process boundary, and exact result.

Do not require empty universal fields, duplicate the claim ceiling with a second “does not prove” essay, or normalize away owner-specific distinctions.

## 9. Overview, detail, and route placement

| Content | Overview | Detail | Guided route |
|---|---|---|---|
| Exact-bound DomainSpec summary | Yes, marked explanatory | Source citations | Newcomer orientation |
| Six lifecycle groupings | Yes, marked view-only | Group contents | FS/BW lifecycle routes |
| DS-D1 kinds and status | Summary | Registry cards | Body War hidden-meta-type step |
| Formation validity | Separate badge | Exact criterion/result | Admission step |
| Profile support | Separate badge | Exact profile subset | Body War TS-local step |
| DS-D2/DS-D8 | Summary | Exact signatures | Concrete source relation |
| Authored versus generated | Yes | Digests/provenance | Financial Settlement graph-plane step |
| Structural derivation | Summary | Keys/provenance | Financial Settlement obligation step |
| Architecture realization | “bounded/candidate” only | Exact Enum files | Body War stops before generation |
| Generated/run/observed/evaluated/receipt | Separate overview states | Exact artifacts | Both evidence routes |
| Drift and owner gates | Persistent boundary rail | Exact finding/owner | FS drift and BW non-promotion |
| Financial Settlement | Portal only | Consumer-local detail | Existing route, reused by reference |
| Body War | Portal only | Consumer-local detail | Existing route, reused by reference |
| Formalization | Omitted from minimum | Optional provenance only | Deferred |
| Contract/schema/iteration | Omitted from minimum | Optional candidate lens | Deferred |
| Accessibility and entry/return invariants | Not lifecycle evidence | Separate validation contract | Deferred pending direct fixtures |

## 10. Minimum route contract

A route is a candidate presentation manifest, not a semantic graph or authority record. It should contain:

- projection-local `route_id` and `step_id`;
- owner-issued source identity or exact artifact path/selector for every step;
- collision-safe presentation IDs;
- `edge_id` only where an owner-issued edge exists;
- asserted predicate/direction for that edge;
- otherwise an ordinary-language presentation annotation;
- expected source-native status;
- expected definition, formation, profile, execution, evidence, authority, and release distinctions relevant to the step;
- binding status;
- one claim ceiling;
- named negative control with expected diagnostic or failed assertion;
- expected unchanged `authority_effect` and release status after completing the route.

Route completion must never change semantic, evidence, authority, or release state.

### Financial Settlement route

Reuse the existing scene by reference:

1. Consumer-local “pay once, never twice” business promise.
2. Authored project/feature sources.
3. Generated graph plane, visibly distinct from authored source.
4. Candidate P4 clause.
5. Derived catalogue including FS-POST-001.
6. Red broken presentation gap: no source-backed P4→FS-POST-001 identity.
7. Candidate architecture contracts and handwritten implementation.
8. Generated pure checks.
9. Full FS-POST-001 check skipped/unbound.
10. Exact expected-red verifier: 52 total, 51 pass, one declared red, zero skipped/todo in that bounded verifier.
11. Planned missing-event negative control.
12. No FS-specific complete mutation/replay proof.
13. `receipt_status:not-issued`.
14. `drift.P4-optional-event-handler`.
15. Blocked independent owner decisions.

The causal-proof overlay is explicitly **partial/planned**. Completing the tour leaves proof and release state incomplete.

### Body War route

Reuse BW-01–BW-12 by reference:

1. Feature-owned five-value `SuggestedTrackStatus` meaning.
2. Hidden DS-D1.3 Enum meta-type.
3. Missing complete admitted DomainSpec Enum definition.
4. TypeScript-specific profile selection.
5. Proposed realization specification.
6. Illustrative/target code that was not generated by the absent Body War pipeline.
7. Existing consumer-local checks and receipts.
8. Existing rejected stronger-claim and stale-digest cases.
9. No complete Body War architecture evaluator/generator chain.
10. Every receipt retains `authority_effect:none`.
11. `release_admission:not-granted`.
12. Stop at the owner/release gates.

The external `order-status-v1` direct TypeScript Enum mechanics are **comparable candidate-local evidence only**. They may appear in a side-by-side detail card, never as a Body War execution step or proof that Body War has the same pipeline.

### Required negative controls

1. Hide DS-D1.3 in Body War BW-01: reject the route because local vocabulary can no longer be distinguished from an admitted DomainSpec Enum definition.
2. Relabel proposed Body War generation/evaluation as current: reject because the definition and applied pipeline are absent.
3. Relabel a generated check as executed/passed: reject without exact execution observation and verdict.
4. Connect the Financial Settlement business promise directly to `receipt.FS-POST-001`: reject because identity, full evaluation, and receipt issuance are missing.
5. Remove the TypeScript profile qualifier from Body War: reject generic architecture claims.
6. Add P4→FS-POST-001 based on similar wording: reject without an owner-issued identity binding.
7. Substitute a stale Body War ontology digest: expect `BRIDGE_STALE_ONTOLOGY_DIGEST`; evidence loses current-validity styling but remains inspectable.
8. Promote or release Body War solely because receipts pass: reject; `authority_effect:none` and `release_admission:not-granted` remain unchanged.
9. Permit payout while removing the Financial Settlement event handler: expect failure of the full P4 claim and prohibit receipt issuance.
10. Complete either guided tour: assert that definition, evidence, authority, lifecycle, and release status are unchanged.

## 11. Presentation additions, visual co-location, exclusions, and gaps

### Add to the presentation view

- Six lifecycle groupings plus one non-authoritative presentation layer.
- Owner-issued identity references and collision-safe presentation IDs.
- Separate kind status, formation validity, and profile support.
- Source/provenance drawer with digest mismatch handling.
- Explicit direct, indirect, missing, contested, and stale binding annotations only where witnessed.
- Separate generated, executed, observed, evaluated, and receipt-issued states.
- One-sentence claim ceilings.
- Receipt-to-owner-decision separation.
- Named negative controls.
- Financial Settlement and Body War portals reused by reference.
- Evidence and authority drawers that aggregate references only and never compute promotion.

### Visually co-locate without merging owners

- Formation/profile/source checks and graph generation.
- Structural-check derivation and code-shape realization.
- Execution, observation, evaluation, mutation, replay, and receipts.
- Drift findings and later owner gates.
- Candidate contract/schema/iteration material only in optional detail.
- Formal carrier aliases only in an optional formal projection.

### Exclude from the minimum Atlas

- New ontology types for zones.
- A canonical cross-family Atlas graph or ID namespace.
- Universal bridge/status/node schemas.
- `ConsumerIntent`, `ExecutionFrontier`, `SWUTerminalReceipt`, generic `ImmutablePrivateRelease`, `ObligationUniverse`, or slash-owner node types.
- New semantic verbs such as `authored-as`, `semantic-origin-of?`, or generic Atlas lifecycle predicates.
- Generated graph, projections, manifests, reverse navigation, receipts, or routes as semantic authority.
- UI candidates as active kinds; Saga as current; `owned-by` as authored; `depends-on` as active; `enforces-cross` as current.
- Formal carrier types as current DS-D1.
- Categorical `Δ` as the current v2 compiler.
- Contract/schema/iteration as canonical v2 vocabulary.
- A universal profile or general realization compiler.
- Financial Settlement or Body War meaning as generic DomainSpec meaning.
- Tour completion as proof or comprehension.
- General application generation, cross-language parity, production readiness, deployment, or release.

### Open gaps

1. No current owner defines a repository-wide Atlas/read-model schema or cross-family ID namespace.
2. No owner artifact closes the full business-to-release chain.
3. Authoring-plane versus contract-plane fuse/generate remains interim.
4. No generic learner/navigation projection contract or witnessed semantic-hash invariance.
5. No universal profile; UI formation authority remains incomplete.
6. No finite proof of full category laws.
7. No general ontology-to-code or architecture-realization compiler.
8. No Rule→Operation realization or cross-language parity.
9. No common receipt algebra across BTE, architecture proof, Body War, and FPR.
10. No general TestCase→execution→receipt closure.
11. No P4→FS-POST-001 identity.
12. Financial Settlement lacks complete causal proof and issued receipt.
13. Body War lacks a complete admitted Enum definition and applied realization/evaluation pipeline.
14. `order-status-v1` lacks the expected governed SWU terminal/closeout join.
15. Generic drift-to-owner automation is absent.
16. FPR-09 conformance join and FPR-13 pilot are absent; FPR-15 remains unauthorized.
17. No representative-reader comprehension evidence.
18. Entry/return restoration and accessibility parity remain separate unvalidated presentation requirements for this Atlas.

## 12. Bounded enrichment blueprint

1. Extend only the existing candidate presentation model.
2. Reference every owner-issued identity by exact path/selector and derive collision-safe presentation IDs.
3. Add the six view groupings as layout metadata with `authority_effect:none`.
4. Preserve source-native statuses verbatim and map them into the candidate display dimensions without writing back.
5. Implement separate displays for kind status, formation result, and selected-profile support.
6. Add only owner-issued relations as typed edges; use ordinary-language presentation annotations for cross-family comparisons.
7. Record absent bindings as gap records rather than question-mark relationships.
8. Reuse Financial Settlement and Body War route manifests without cloning their nodes, statuses, or receipt semantics.
9. Make all ten negative controls route-validation fixtures.
10. Add reference-only evidence and authority drawers; neither may compute admission or promotion.
11. Keep formal, historical-language, accessibility, and restoration material outside the minimum evidence-backed Atlas until separately witnessed.
12. Validate exact source resolution, presentation-ID collision safety, owner/status preservation, gap visibility, stale-digest behavior, negative controls, and unchanged authority/release state after route completion.

This blueprint authorizes no mutation, ontology admission, definition change, implementation, publication, promotion, release, or deployment.

## 13. Exact-binding closure

The reviewer repair loop is complete. All evidence-backed repairs have been incorporated:

- six lifecycle view groupings plus one non-authoritative presentation layer;
- owner-issued identities plus collision-safe presentation IDs;
- candidate rather than universal projection contracts;
- source-native and constitutional status preservation;
- separate kind, formation, and profile judgments;
- removal of invented semantic nodes and predicates;
- minimum typed detail fields;
- explicit route-level negative controls;
- Financial Settlement causal proof marked partial/planned;
- external Enum mechanics marked comparable candidate-local evidence for Body War;
- formal, candidate-language, entry/return, and accessibility routes deferred from the minimum Atlas.

No further explorer feedback is required for the bounded minimum Atlas because missing cross-family identities are retained as explicit gaps.

Explorer feedback or a new owner decision would be required before asserting any of the following as current:

- a canonical repository-wide Atlas schema or ID namespace;
- P4→FS-POST-001 semantic identity;
- a complete Body War realization pipeline;
- current v2 compiler equivalence with categorical `Δ`;
- generic route/restoration/accessibility contracts;
- a general architecture-realization compiler;
- lifecycle-joined completion of `order-status-v1`;
- production conformance, pilot completion, or authorization.

**Recommendation: writer-ready under exact-binding closure.** The writer may present this as an owner-preserving, candidate presentation blueprint with explicit consumer-local witnesses and gaps. The writer must not describe it as a new canonical DomainSpec vocabulary, ontology, universal lifecycle, implementation plan, proof of comprehension, or production evidence.

Final claim ceiling: this synthesis establishes a bounded research design for presenting current semantic authority, executable mechanisms, consumer-local evidence, gaps, and owner decisions without collapsing them. It grants no authority or implementation effect.
