# Learning Graph And Next-Route Guide — Explorer Returns

This file is the strategist-owned explorer transcript for dispatch
`2026-08-01-learning-graph-next-route-guide`. Host receipt metadata is
normalized separately under `orchestration/run-001/receipts/`.

## Agent 1 — Hewitt, Carl

Research payload — pass

Frozen source identities matched:

- `ontology.json` SHA-256
  `4b67ba1d631b11a09ab073a1e8003ccc0367a3c49e625693c54b2a7ddf3bbcd3`;
  `architecture-ontology-view.html` SHA-256
  `601ab580789b3aa82e97a7b5d2d1b93749fce21b4a5585486f3863bb5ddbead9`.
- `node --check` and `node validate-ontology.mjs` passed. The ontology
  verdict is `pass`; four profiles were loaded; the supplied TypeScript
  fixture correctly remains `fail` with 30 assertions and eight findings.
  This is executable validation of candidate data, not real-source inspection.

Exact-binding anatomy:

- Candidate, non-authoritative ontology: `ontology.json#/`
  (`ontology_id=implementation-conformance.architecture-properties`,
  `status=candidate`, `authority_effect=none`).
- Twelve concept types: `#/concept_types/0`–`/11`. The core realization
  chain is `/0 ArchitectureElement` → `/1 DomainConceptImplementation` →
  `/2 RuleImplementation` (candidate alignment `DS-D1.7`) and
  `/3 OperationImplementation`. Workflow/projection objects are `/8`–`/11`.
- Seventeen property definitions: `#/property_definitions/0`–`/16`.
  Rule-relevant binding/evaluation properties are `/3 source.primary_concept_count`,
  `/4 binding.concept_id`, `/5 binding.current`,
  `/6 symbol.primary_callable_count`, `/7 symbol.public_callable_count`,
  `/8 callable.form`, `/9 callable.return_semantics`, and
  `/10 callable.helper_policy`.
- Four directed, value-constraining, acyclic relations:
  `#/relation_definitions/0`–`/3`: `depends_on`, `guards`,
  `exposes`, and `implements_interface`; all have
  `authority_effect=none`.
- Generic operators: `#/constraint_operators/0`–`/3`: `required`,
  `equals`, `matches`, and `one_of`.
- Candidate language projections: `#/language_projections/0`–`/2`; all
  block using source shape to define portable semantic identity.
- Profiles are candidate/non-authoritative. Base expectations:
  `profiles/base-domain.profile.json#/constraints/0`–`/5`; TypeScript
  additions: `profiles/typescript-strict.profile.json#/constraints/0`–`/5`.
- Supplied, not real-adapter, facts:
  `examples/typescript-observed-facts.json#/elements/0`–`/2` and
  `#/relations/0`–`/1`; expected evaluator output:
  `typescript-evaluation.expected.json#/findings/0`–`/7`.
- The HTML fetches ontology, meta-type projection, four profiles, facts, and
  evaluation together at `architecture-ontology-view.html:618-679`. Its five
  lenses use
  `[data-view="metaTypes"|"types"|"profiles"|"facts"|"findings"]` at
  lines 499–523. Search is `#search-input`; navigator `#node-list`;
  profile selector `#profile-select`; detail inspector `#inspector`; help
  `#help-modal`; and the guide link is
  `.guide-link[href="BEGINNER-GUIDE.html"]` at lines 584–607.
- Existing learning support includes plain-language type/property/fact copy at
  HTML lines 700–737; exact-contract and boundary inspection at lines
  1200–1299; and guide sections “What ‘Ontology’ Means Here”, “The Five
  Layers”, and “One Rule, End to End” at `BEGINNER-GUIDE.md:56-209`.
  Its human-comprehension claim remains `flag`, per
  `VALIDATION-REPORT.md` “Beginner Explanation Addendum.”

Candidate reuse handles:

1. `architecture.RuleImplementation` plus inherited-property contract,
   immutable identity
   `ontology.json@4b67ba1d...#/concept_types/2`; observed file binding and
   executed evaluator evidence.
2. Profile → supplied fact → finding explanation path:
   `base-domain.profile.json#/constraints/0-5`,
   `typescript-strict.profile.json#/constraints/0-5`, facts
   `/elements/0`, and evaluation `/findings`; observed and
   executable-fixture validated.
3. Existing read-model canvas,
   `architecture-ontology-view.html@601ab580...:618-679` and the DOM
   selectors above; prior browser validation exists, but no human-learning
   evidence.
4. Projection boundary:
   `cyberAlchemy-v2/ontology/projections/README.md` “Projection Record Shape”
   and “Emission Rule”; a learner view could be a `downstream-guide` or
   candidate map only, never authority, promotion, or execution.
5. Residue is an available CAV2 role, not a semantic conclusion, per
   `NODE-MODEL.md` “Node Concept Contract” and `RELATION-MODEL.md`
   “Endpoint Rule.”

`architecture.RuleImplementation` trace:

`ontology.json#/concept_types/2` candidate Rule realization
→ base expected `callable.return_semantics=boolean` at
`base-domain.profile.json#/constraints/5`, plus TypeScript arrow/path/export
expectations at `typescript-strict.profile.json#/constraints/0,3,5`
→ supplied fact `examples/typescript-observed-facts.json#/elements/0`
(`implementation.payment.MaxAmountRule`, current binding, arrow function,
boolean)
→ zero findings for that element in `typescript-evaluation.expected.json`
→ mismatch explanation means profile-versus-supplied-fact disagreement, not a
semantic/runtime/authority verdict (`PROPERTY-EVALUATION-MODEL.md`
“Evaluation Contract”; `BEGINNER-GUIDE.md:201-209`)
→ owner route `Rule realization profile owner`
(`ontology.json#/concept_types/2/owner_route`)
→ unresolved learner question: “What owner-resolved evidence establishes
`payment.MaxAmountRule` as `DS-D1.7`, rather than merely a boolean-looking
callable?” The primary package names binding as required but supplies no
owner-decision receipt.

Absent from this primary contract:

- No ontology concept/property/relation, fixture field, HTML lens, or
  interaction captures learner confusion, learner question, unknown/residue
  linked to a learner, comprehension state, or candidate next governed route.
  `unknown` occurs only as a property enum value, not an Unknown node.
- Search, lenses, plain-language inspection, and guide navigation support
  orientation and inspection; they do not evidence confusion capture, question
  improvement, comprehension, route recommendation, confirmation, or execution.
- Real language adapters, real-source projection, runtime correctness,
  accessibility acceptance, release/deployment, and human comprehension remain
  unproven.

## Agent 2 — Spivak, David

Experiment-root manifest and owner/proof map — pass

### Interactive Ontology Learning Map

- Root: `cyberAlchemy-v2/development/interactive-ontology-learning-map/`.
- Candidate learning-map product; owner
  `private-learning-map-product-owner`. Core candidate contract passed, but
  the compiled cross-feature substrate and current workable-example chain
  remain incomplete.
- Owned primitives: question-local slicing, immutable source binding, shared
  `Graph | Outline | Table` projections, stable-ID selection, and provenance
  inspection. Exact selectors:
  `WORK-PACK.md#Task-status-board`, rows `SWU-IOLM-00C-A`,
  `SWU-IOLM-00C-UI-A1`–`A4`, and `SWU-IOLM-00C-B`;
  `research/2026-07-22-iolm-workable-example/findings.md#Recommended-architecture`
  and `#Data-flow-and-observable-default`.
- `00C-A` passed; current-generation A1 rebind passed. A2 is selected but not
  regenerated; A3/A4 are gated; no `iolm-browser-acceptance/v1`; manual
  comprehension is `NOT_RUN`.
- Reuse the question slices, source-binding guard, normalized snapshot,
  synchronized projections, and provenance inspection. Do not call the whole
  IOLM deployed or human-validated. It already owns learner-question projection,
  so a second generic learning-map UI would duplicate it.

### Ontology Candidate Graph Prototype

- Root:
  `cyberAlchemy-v2/development/ontology-candidate-graph-prototype/`.
- Executed candidate graph runtime; all nine mutation SWUs passed and
  owner-closeout completed; read-only closure verification remains eligible.
- Owned primitives: candidate-v1 carrier, typed endpoints/inverses, grounding
  closure/cycle rejection, finite policy disposition, lineage projection,
  canonical run bundles, and protected-input/write-denial attestation.
  Selectors: `planning/WORK-PACK.md#Atomic-SWU-Board`,
  `#Current-State`, and
  `planning/work-pack/session-evidence/SWU-OCGP-001..009/INVOKE-REFRESH-RECEIPT.json`.
- Runtime receipts pass for SWU 001–009. The ceiling is candidate
  graph/projection behavior, not ontology authority or promotion.
- Reuse carrier validation, typed endpoint law, closure/cycle guards, and
  deterministic verification. Do not reinterpret graph records as learner
  state, comprehension, route authority, or live-vault schema.

### Ontology Evidence Workbench

- Root: `cyberAlchemy-v2/development/ontology-evidence-workbench/`.
- Mixed status: L0 completed; the L1 first-working-version path is partly
  complete; typed-overlay repair `007T` is pending and final validation is
  blocked.
- Owned primitives: source admission, loss-aware projection, immutable upstream
  lock, native viewer, isolated build materializer, evidence review UI, and
  trust rail. Selectors: `planning/WORK-PACK.md#Task-Board`,
  `#Recommended-First-Unit`, and `#Blockers-and-Residue`.
- L0 tasks plus `006P`, `007`, and `008F` passed;
  `013B/014/014V` remain blocked pending strict typing repair.
- Reuse evidence/provenance inspection, trust rail, view parity, and immutable
  build handles. Do not call the parent OEW complete or turn presentation edges
  into semantic ontology relations.

### OEW Focus Scene

- Root:
  `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/`.
- Executed bounded extension: FOCUS-001, FOCUS-002, and automated A/B
  FOCUS-TEST-001 passed.
- Owned primitives: deterministic focus scenes, exact internal relations,
  labeled crossing portals, and persistent source relation, presentation
  relation, direction, evidence refs, and `authority_effect=none`.
  Selectors: `planning/WORK-PACK.md#Evidence-baseline`,
  `#SWU-OEW-FOCUS-001`, `#SWU-OEW-FOCUS-002`,
  `#SWU-OEW-FOCUS-TEST-001`, and terminal receipt
  `planning/work-pack/session-evidence/SWU-OEW-FOCUS-TEST-001/20260730T203656Z/receipt.json`.
- Automated browser A/B passed against the 237-node/231-edge baseline and exact
  four-node scene. Novice protocol remains pending; exact projection does not
  prove comprehension.
- Reuse bounded scenes and directed portals. Focus membership, portals, and
  visual geometry remain view semantics, not ontology meaning.

### OEW Semantic Navigation

- Root:
  `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/`.
- Authored and structurally validated, but blocked on owner decisions with
  `selected_swu: none`.
- Proposed primitives: lossless relation record, selected-edge scene, keyboard
  parity, Home/context navigation, Path explanation, filters/export, and
  restoration. Selectors: `planning/WORK-PACK.md#Control-Fields`,
  `#Task-Board`, `planning/SWU-MANIFEST.json#/selected_swu`, and each
  `handoff_status`.
- No mutation/runtime receipt exists. Reuse only after owner decisions. Do not
  describe semantic navigation or Path as deployed or as proof of a route
  recommendation.

### OEW Thin Prototype

- Root:
  `cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/`.
- Complete candidate prototype; four SWUs plus read-only recomposition audit
  passed.
- Owned primitives: typed loader/admission, immutable build producer, exact
  evidence gateway, browser journey, trust rail, grounding trace, conflict
  residue, and view parity. Selectors:
  `planning/WORK-PACK.md#Task-Board`, `#Atomic-SWU-Board`,
  `planning/SWU-MANIFEST.json#/status`, and
  `#/swus/*/terminal_result`.
- SWUs 001–004 passed; browser journey 13/13, zero outbound/error,
  fail-closed negatives, and teardown passed. The result is candidate runtime
  only with authority effect none.

### Governed Artifact Tree Example

- Root:
  `cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/`.
- Example-only candidate package with seven candidate nodes and nine candidate
  relations linking evidence, owner routing, decision, residue, and projection.
- Selectors: `README.md#Package-Map`, `#Model-Sources`,
  `ontology/nodes.json`, `ontology/relations.json`, and
  `VALIDATION.md#Verified-Structure`.
- Package-link integrity passed; lifecycle evidence is `FLAG`. There is no
  browser, accessibility, comprehension, or live-vault proof.
- Reuse the package-level record shapes and endpoint validation. Do not create a
  runtime-contract node, live vault types, or lifecycle transitions from these
  candidate links.

### Body War Atlas

- Root `projects/body-war/ontology/business/BUSINESS-VIEW-ATLAS.html` with
  `projects/body-war/development/reviews/20260730-ontology-ui-black-box/findings.md`.
- Bounded read-only projection with browser-pretest evidence, not ontology-owner
  authority.
- Owned presentation patterns: directed portals, persistent selected-relation
  tuple, deterministic focus scenes, atomic tour state, and non-color semantics.
  Selectors: findings `#CR-1--Deterministic-focus-scenes`,
  `#CR-2--Keyboard-reachable-semantic-navigation`,
  `#CR-3--Persistent-selected-relation-and-atomic-pivot`, and
  `#Smallest-coherent-implementation-slice`.
- The review observed 237 nodes and 231 edges; later focus-scene automation
  passed. No human comprehension evidence exists.
- Reuse UI interaction and acceptance patterns only. Never import Body War
  domain ontology into the learning ontology; geometry and `related` portals
  are not semantic, causal, or authority edges.

### Cross-cutting owners

- `cyberAlchemy-v2/ontology/NODE-MODEL.md#Node-Concept-Contract` owns candidate
  record requirements: role, sources, owner, candidate status, split confidence,
  challenge contract, residue, and forbidden collapse. Its gate is `flag`;
  these are not live vault types.
- `cyberAlchemy-v2/ontology/RELATION-MODEL.md#Relation-Contract` owns endpoint,
  direction, owner, evidence, and effect discipline. `#Endpoint-Rule` requires
  both endpoints, direction, owner, evidence, and effect, otherwise the relation
  is residue. `#Schema-Evolution-Only-Relations` forbids movement-edge
  shortcuts.
- The projection owner is
  `cyberAlchemy-v2/ontology/projections/README.md`, not the absent
  `cyberAlchemy-v2/projections/README.md`. Its `#Projection-Kinds` permits
  candidate maps, review indexes, authority-state read models, drift watch, and
  downstream guides. `#Emission-Rule` keeps owner-unapproved state blocked,
  deferred, or unknown.
- Verified Inventory-to-ontology ladder:
  `source selector -> evidence card/EvidenceSet -> ontology candidate -> PromotionRecord -> governed ontology node or projection -> generated read models`.
  Inventory rows are never ontology proof.

### Learning-concept placement

| Candidate concept | Correct owner/layer | Disposition |
| --- | --- | --- |
| Source concept, property/profile expectation, observed fact, finding, provenance link | Subject ontology or evidence graph | Build from owned |
| `OntologyCandidate`, `EvidenceRecord`, source residue, PromotionRecord-compatible record | Candidate ontology/evidence workflow | Build from owned |
| Learning graph as selected subgraph/read model | Learner-only projection | Build from owned |
| Learner question | Session-scoped learner projection/state by default | Build from owned; proposed record shape |
| Confusion / `confused_about` | User/session state | Proposed, human-supplied, unverified |
| Positive comprehension state | User/session state plus qualified human receipt | Deferred/blocked |
| Unknown | Typed split: source residue, learner uncertainty, or workflow blocker | Build from owned with split |
| Focus, selection, breadcrumb, lens, question progression | User/session UI state | Already deployed in parts/build from owned |
| `asks_next` | Learner/session progression edge | Proposed projection relation |
| `explains` | Exact-bound evidence/projection relation | Build from owned |
| `evidenced_by`, `supports_candidate`, `records_residue` | Evidence/candidate ontology | Already owned/build from owned |
| `routes_to` suggestion | Workflow-derived suggestion rendered in learner projection | Build from owned, non-executing |
| Confirmation, selection, dispatch, execution, promotion | Existing workflow/authority owners | Forbidden in learning graph |

The smallest non-duplicative composition is:

`source ontology + evidence/finding graph -> exact-bound learner projection -> session-supplied confusion/question state -> typed unknown/residue split -> workflow-derived candidate route suggestion`.

Do not introduce a universal `LearningGraph` ontology, canonical
`QuestionNode`, canonical `UnknownNode`, `understands` semantic edge, or
generic executable `routes_to`. Existing owners support a projection
composition, not those authority collapses.

Explicit residue:

- The supplied projection path was wrong; the correct owner path was verified.
- IOLM current-generation A2–A4 chain is incomplete.
- Parent OEW final L1 acceptance is blocked.
- Semantic navigation is blocked before implementation.
- OCGP has nine passing SWUs but still has an eligible closure task.
- Browser receipts do not prove learner comprehension.
- No source admits learner confusion or personal unknowns into canonical
  ontology.
- No source authorizes route suggestions to confirm, select, dispatch, execute,
  promote, publish, release, or deploy.

## Agent 3 — Halford, Graeme

Learner-journey model — pass

Smallest loop, kept projection-only:

1. Concrete confusion: “Does this ontology itself enforce a TypeScript Rule?”
   Guide anchors:
   `BEGINNER-GUIDE.md#does-the-ontology-enforce-folder-structure` and
   `#does-the-ontology-force-typescript-arrow-functions-everywhere`.
2. Bounded inspection: open the guide/canvas details for the architecture type,
   selected profile, supplied fact, and finding. Canvas selectors:
   `#open-navigation`, `.view-button[data-view="types"]`,
   `.view-button[data-view="profiles"]`,
   `.view-button[data-view="facts"]`,
   `.view-button[data-view="findings"]`, and `#inspector`.
3. Better question: “Which owner-supplied observation would distinguish a
   candidate `architecture.RuleImplementation` from a real TypeScript
   realization, and what exactly remains fixture-only?”
4. Explicit unknown: no native TypeScript AST/module-resolution adapter has
   emitted the observation; the supplied observation is hand-authored fixture
   evidence.
5. Candidate route suggestion, non-executing:
   `implementation-conformance TypeScript language-adapter owner` → a later,
   separately admitted Task Session for a real fixture → AST/module resolution
   → typed observation projection → existing evaluator. This candidate handoff
   does not select, confirm, register, or execute a route.

| Proposed item | Exact binding | Evidence class | Owner/status |
| --- | --- | --- | --- |
| `learner_confusion_text` | `BEGINNER-GUIDE.md#does-the-ontology-enforce-folder-structure` | Authored explanatory candidate | Learner projection; net-new field, unverified |
| `selected_concept_id` | `ontology.json#/concept_types/2/concept_id` = `architecture.RuleImplementation` | Candidate ontology record | Rule realization profile owner |
| `selected_profile_id` | `profiles/typescript-strict.profile.json#/profile_id` | Candidate profile | Implementation-conformance profile owner |
| `observed_subject_id` | `examples/typescript-observed-facts.json#/elements/2/element_id` = `implementation.payment.LegacyLimitRule` | Fixture observation | Language adapter + source owner; not real-source evidence |
| `question_text` | `BEGINNER-GUIDE.md#current-boundary-and-best-next-step` | Authored next-step proposal | Learner projection; net-new/unverified |
| `unknown_id` / residue | `BEGINNER-GUIDE.md#one-rule-end-to-end` step 4; `#current-boundary-and-best-next-step` | Explicit absence/candidate residue | Learner-only epistemic projection; not canonical ontology |
| question `--inspects-->` source anchor | IOLM `SPEC.md#derived-views` (`learnerView`) and `#non-collapse-invariants` | Owned candidate projection precedent | `private-learning-map-product-owner`; no semantic effect |
| question `--surfaces-->` unknown | IOLM `SPEC.md#core-domain-model` L2 epistemic and L5 projection | Owned candidate projection precedent | Learner-only; no canonical vocabulary admission |
| unknown `--suggests-->` candidate route | Whisper preset `preset.yaml#verification_plan`; `BEGINNER-GUIDE.md#current-boundary-and-best-next-step` | Proposal pattern plus authored next step | Workflow/owner handoff; net-new relation; authority none |
| Focus-scene affordance | OEW focus-scene `design/ARCHITECTURE.md#view-1--context` | Design-only, authority none | Focus-scene projection owner |
| Bounded navigation | Semantic-navigation `define/SPEC.md#normative-boundaries` items 4–7 | Candidate design contract | Semantic-navigation presentation owner |
| Guide learning path | `BEGINNER-GUIDE.md#a-ten-minute-learning-path` | Browser-validated explanatory candidate | Experiment author; human comprehension unproven |
| Comprehension ceiling | Body War novice findings `#evidence-and-authority-ceiling`; UI black-box `#three-black-box-lenses` | Verified boundary evidence | Separately authorized human-study owner |

### Hand-executable witness

- Inspect `architecture.RuleImplementation`
  (`ontology.json#/concept_types/2`): candidate alignment, owner
  `Rule realization profile owner`, and explicit forbidden collapse.
- Select `architecture.typescript-strict`
  (`profiles/typescript-strict.profile.json#/constraints/0` and
  `/constraints/4`): it expects the Rules path and arrow-function form; the
  profile has `authority_effect: none`.
- Inspect `implementation.payment.LegacyLimitRule`
  (`typescript-observed-facts.json#/elements/2`): the fixture supplies
  `src/shared/rules.ts`, empty binding, two primary concepts, and
  `function-declaration`.
- Inspect expected findings
  (`typescript-evaluation.expected.json#/findings/0` through `/findings/6`):
  the evaluator reports specific mismatches including
  `typescript.rule-location` and `typescript.rule-arrow-only`.
- Better question: “Can a real TypeScript adapter reproduce this same typed
  fact shape and discriminating failures against a frozen source fixture?”
- The candidate language-adapter handoff is not execution, semantic admission,
  runtime proof, or human-comprehension evidence.

### Required abstention

If the learner asks, “Is `LegacyLimitRule` really a DomainSpec Rule in a live
repository?”, the graph must abstain. Its binding is empty and non-current at
`typescript-observed-facts.json#/elements/2/properties`; the source digest is
`example-only-not-a-product-receipt`; and the guide says source shape cannot
mint semantic identity. Show the unknown and owner route. Do not emit a
question-to-semantic-node assertion or a route recommendation beyond obtaining
owner-resolved binding and real-adapter evidence.

Body War precedents support bounded scenes, portals, persistent relation state,
and browser-mechanics assertions but not learner comprehension. IOLM supports
separate `semanticView`, `learnerView`, and `navigationView` projections
and forbids learner edges from becoming semantic relations. Whisper's
product-research blueprint supports proof-honest “verification question →
witness → pass/fail → next route” framing, not an authority grant.

Explicit residue:

- No human-comprehension witness exists.
- No real-source TypeScript adapter evidence exists.
- No owner has admitted learner-question, unknown, or next-route vocabulary
  into canonical ontology.
- Keep learner state, question, unknown, and route suggestion in a
  non-authoritative learner/workflow projection.
- Do not infer semantic identity from source shape or fixture data.
- Do not treat browser/rendering evidence as comprehension evidence.
