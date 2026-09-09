# Goal

Define a concrete, non-collapsing ontology/knowledge-graph and interactive mental-map package that can teach the CyberAlchemy Method, the full Craft operational/formal/philosophical model, CyberAlchemy v2 governance, and DomainSpec v2 feature SPECs without silently turning a learning projection into source authority, proof, or promotion.

# TL;DR

Build a **private, read-only projection compiler and learning application**, not a live canonical ontology. The compiler reads independently owned Arcanum/Craft, CyberAlchemy v2, and DomainSpec sources into six internal classification planes, then emits three separately stored views over stable shared identities: a governed semantic view, an authored learner concept map, and a navigation view. Removing learner or navigation material must leave the semantic bytes unchanged. This is the smallest architecture that can connect definitions, claims, evidence, governance, Craft workflow state, and learning sequence without collapsing them into one kind of node or edge ([research.md, Agent 1](./research.md#agent-1--formal-governed-graph-analysis); [research.md, Agent 3](./research.md#agent-3--learning-application-and-web-graph-system)).

The first witness should use immutable JSON, a deterministic extractor, a GET-only API, React Flow 12 with precomputed ELK layouts, and an equivalent DOM hierarchy and relation table. The Agent Execution Orchestrator SPEC supplies the primary typed-negative ontology witness; Financial Settlement supplies a positive document/schema learning fixture. These are research witnesses only: endpoint, runtime, browser, assistive-technology, performance, publication, and reproducibility acceptance tests are all **`NOT_RUN`**. The integrated application is private. A public Arcanum-only derivative is a separately built candidate with its own fail-closed source manifest and publication verdict; no public-safe build or publication proof exists yet ([research.md, Agent 1, “Witness”](./research.md#formal-half-of-the-smallest-domainspec-plus-craft-witness); [research.md, Agent 3, “Witness/Acceptance Criteria”](./research.md#witnessacceptance-criteria)).

# Context

The requested “mental map” spans objects that look connected but do not have the same status. A source file can define a concept; a claim can interpret it; evidence can support the claim; an owner can approve a transition; a Craft ledger can record operational residue; and a learner view can place the objects next to each other. None of those relations makes the objects identical. CyberAlchemy v2 explicitly treats its ontology package as candidate modeling and an optional projection rather than an authority engine, while DomainSpec v2 keeps its feature ontology local and non-promoting (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`, “Purpose” and “Authority Law”; `projects/domainspec-v2/ontology/README.md`, local-candidate and promotion-path sections; [research.md, Agent 1, findings 1–4](./research.md#key-findings); [research.md, Agent 3, finding 1](./research.md#key-findings-2)).

Craft widens the problem further. It is simultaneously an operational method, a pseudoformal coverage model, a family of structural analogies, a philosophy of making, and a speculative universal/reality horizon. The formal cousins do not prove Craft, LLM behavior, or the philosophical ascent. The learning system therefore needs explicit epistemic staging as well as ontology and governance staging (`arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`, “Philosophical Horizon” and formal tuple; `arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`, “How To Read This” and “Honesty Boundary”; [research.md, Agent 2, “Claim Ladder”](./research.md#claim-ladder)).

The research was intentionally broader than a renderer choice. Agent 1 established the formal non-collapse boundary and typed witness. Agent 2 reconstructed the full Craft genealogy and honesty boundary. Agent 3 translated both into a learner journey, interaction grammar, accessible dual representation, data/API boundary, and candidate technology stack. The synthesis and three independent review gates found no definitional or non-vacuity `KILL`, but required repairs to determinism, scale triggers, publication testing, and disposition labels before convergence.

# Decision

The bounded recommendation is:

```text
independently owned governed sources
  -> deterministic read-only extraction
  -> source and candidate-record validation
  -> immutable projection snapshot
       |- semanticView     authority-neutral, source-backed relations
       |- learnerView      focus questions and authored propositions
       `- navigationView   learn-next, prerequisite, and journey order
  -> GET-only query API
  -> spatial graph + equivalent DOM hierarchy/table + source/claim/challenge views
```

This is a **build-from-owned projection**. It does not centralize the authority of Arcanum/Craft, CyberAlchemy v2, or DomainSpec. It does not create canonical CAV2 node kinds. It does not decide a promotion. It does not prove the correctness of the extracted source. It is a private candidate package until its owners and executable gates close (`cyberAlchemy-v2/ontology/NODE-MODEL.md`, “Purpose” and “Node Concept Contract”; `cyberAlchemy-v2/ontology/RELATION-MODEL.md`, “Relation Contract”; [research.md, Agent 1, “Node/Edge Contract”](./research.md#nodeedge-contract)).

# The non-collapse model

## Six internal planes

The six planes are **internal classification planes for the projection compiler**, not canonical CyberAlchemy v2 node kinds.

| Plane | Carries | Example | Forbidden inference |
|---|---|---|---|
| L0 Source | Artifacts, revisions, exact anchors, source posture | `CRAFT-INITIAL-DEFINITION.md` at “Philosophical Horizon” | “The file contains this text, therefore the concept is promoted or true.” |
| L1 Semantic | Local concepts, concept roles, definitions, typed local relations | `PipelineRouteTemplate : Entity` | “A candidate/local concept is a canonical CAV2 kind.” |
| L2 Epistemic | Claims, evidence, proof scope, analogy, interpretation, unknowns | “Craft resembles categorical migration” as analogy | “A formal cousin proves the analogy, philosophy, or runtime.” |
| L3 Governance | Owner routes, gates, decisions, authority envelopes, promotion records | DomainSpec source ownership | “Adjacency to an authority object grants authority.” |
| L4 Operational | Craft contexts, conditions, artifacts, residue, gates, recomposition obligations | A rejected relation recorded as residue | “Ledger closure promotes semantics or proves correctness.” |
| L5 Projection | Focus questions, learning sequences, layouts, annotations, view policy | “Learn next: StageContract” | “A visible or central node is endorsed.” |

This extends the five obvious ontology/governance planes with the operational plane that Craft needs for contexts, blockers, gates, artifacts, residue, and recomposition. It is grounded in the recursive ledger’s separation of contexts, artifacts, relations, typed items, and decisions (`arcanum/development/craft/CRAFT-RECURSIVE-LEDGER-DESIGN.md`, “Core Row Families”; [research.md, Agent 1, “Candidate Layer Model”](./research.md#candidate-layer-model)).

## Three derived views over shared identities

The views are materializations, not more authority levels:

- `semanticView` contains source-backed records and relations with their claim, evidence, and authority metadata.
- `learnerView` answers a focus question with curated concepts and explicit linking phrases.
- `navigationView` carries prerequisites, “learn next,” breadcrumbs, and journey ordering with `semantic: false`.

All three may refer to the same stable record IDs. They must be serialized separately. A build-time invariant must prove that removing `learnerView` and `navigationView` does not change the canonical `semanticView` bytes or `semanticHash`. Hiding a learner edge must not change the semantic relation table. This implements the concept-map requirement for focus questions and labeled propositions without turning instructional sequencing into ontology ([IHMC concept-map theory](https://cmap.ihmc.us/docs/theory-of-concept-maps.php); [research.md, Agent 3, “Key Findings” and “Data/API Boundary”](./research.md#dataapi-boundary)).

## Core non-collapse laws

The compiler and UI must make these laws testable:

1. `ArtifactInstance != SemanticConcept`.
2. `SourceAnchor != EvidenceRecord != source authority`.
3. `canonicalKind != conceptRole != authorityKind != authorityState`.
4. `candidateStatus != promoted`.
5. `ownerRoute != ownerDecision`.
6. `verificationStatus != proofStatus != authorityState`.
7. `evidenceConfidence != commitmentConfidence`.
8. `schemaFidelity != instanceFidelity`.
9. `formalCorrespondence != structuralAnalogy != philosophicalInterpretation != universalProof`.
10. `CraftLedgerRelation != CAV2CategoricalMorphism` unless a source-owned mapping and gate establish it.
11. `learnerEdge != semanticRelation`.
12. `projection != promotion != publication`.
13. `rendererSuccess != comprehension != accessibilityConformance`.
14. `routeShapeValidation != executedClosure != runtimeCorrectness`.

These laws consolidate the ontology package’s separation of kind, role, authority, durability, status, and projection with Craft’s proof/analogy boundary (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, “Kinds and Roles,” “Edges,” and “Hom-Sets”; `arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`, “Honesty Boundary”; [research.md, Agent 1, “Non-Collapse Laws”](./research.md#non-collapse-laws)).

# Craft as the learning spine

Craft should be taught as a ladder with five separately typed claim classes. The interface may let a learner ascend the ladder, but no edge or animation may imply that a lower level proves the next one.

| Level | What the application teaches | Posture |
|---|---|---|
| Operational method | Intention is translated under a chosen schema into an artifact; validation exposes residue; the work is repaired, routed, reflected, recomposed, and stopped contextually. | Candidate operational model with bounded local evidence. |
| Formal correspondence | Particular database migrations, algebraic semantics, Bayesian inversions, and losses have compositional formal structures in their own mathematical domains. | Domain-scoped formal result, where independently verified. |
| Structural analogy | Craft’s schema–translator–artifact–residue cycle resembles those structures. | Analogy only; PCRA is not established as a clean functor or kernel. |
| Philosophy of making | Making can be interpreted as constrained movement from possible form, through representation, into a bounded artifact and reflective repair. | Interpretation, not a theorem. |
| Universal/reality horizon | Reality itself may be recursively organized through schema, manifestation, residue, and stabilization. | Explicit speculation/research horizon. |

The local Craft notation `C = (I,S,F,E,D,R,G,V)`, `V(S,D,G) -> R`, and `R_n -> I_{n+1}` is useful as a **coverage contract**: it asks whether intention, schema, translator, uncertainty pressure, artifact/data, residue, governance, and validation are visible, and whether unresolved residue becomes a new bounded problem. It currently supplies no typed mathematical theory, convergence result, optimal decomposition theorem, or guarantee of improved fidelity (`arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`, formal spine; [research.md, Agent 2, “Formal Spine”](./research.md#formal-spine)).

The philosophical statement “building models reality” should therefore unfold into three increasingly strong cards:

1. **Building through models** — builders select partial representations, act through them, and compare results against them. This is the operationally supported reading.
2. **Building transforms bounded reality** — artifacts change codebases, interfaces, organizations, practices, and future choices; the model participates causally without exhausting the world it changes.
3. **Reality as building** — all stable form is a closure point in recursive schema/data/residue dynamics. This is a generative but speculative horizon.

Suppes’s distinction between theory, model, and empirical data is a useful precedent for keeping schema, artifact, and validation evidence separate. Spivak, Lawvere, AutoBayes, Ashby, and Bedau constrain narrower formal or interpretive correspondences; none proves Craft or LLM behavior ([Suppes](https://web.stanford.edu/group/csli-suppes/techreports/IMSSS_33.pdf); [Spivak](https://arxiv.org/abs/1009.1166); [Lawvere](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/lawvere.pdf); [AutoBayes](https://arxiv.org/abs/2503.18608); [Ashby](https://ashby.info/Ashby-Introduction-to-Cybernetics.pdf); [Bedau](https://people.reed.edu/~mab/publications/papers/weak-emergence.pdf); [research.md, Agent 2, “Philosophy of Making”](./research.md#philosophy-of-making)).

# Candidate projection contract

## Vocabulary posture

The following is a minimal **candidate application vocabulary**, not an approved cross-project ontology. No combined projection owner has been identified, and exact enums remain unowned. The implementation must label the contract `candidate`, version it independently, and keep source-local fields alongside any normalized field.

Candidate independent axes:

- `objectKind`
- `claimClass`
- `verificationStatus`
- `verificationScope`
- nullable, domain-scoped `proofStatus`
- `evidenceConfidence`
- `commitmentConfidence`
- namespaced `authorityState`
- namespaced `localStatus`
- `ownerRoute`
- `authorityEffect`
- `forbiddenCollapses[]`

There is deliberately no generic `evidenceStatus`: that name would collapse the existence, strength, verification, and scope of evidence. `proofStatus` must be nullable because most records are not proof-bearing. Authority and workflow statuses must be namespaced because a DomainSpec local candidate, a CAV2 package candidate, and a Craft ledger condition do not share one lifecycle ([research.md, Agent 1, “Minimum record contract”](./research.md#minimum-record-contract); `cyberAlchemy-v2/ontology/NODE-MODEL.md`, “Node Status Axis”).

## Minimal records

```json
{
  "projectionContractVersion": "0.1.0-candidate",
  "projectionId": "sha256:<canonical-snapshot-input>",
  "sourceRevisions": [{"sourceId": "src.aeo-spec", "revision": "git:<sha>"}],
  "extractorVersion": "git:<sha>",
  "layoutPolicyVersion": "elk-layered-v1",
  "semanticHash": "sha256:<canonical-semantic-view>",
  "sources": [],
  "records": [],
  "relations": [],
  "semanticView": {"recordIds": [], "relationIds": []},
  "learnerView": {"focusQuestions": [], "propositions": []},
  "navigationView": {"journeys": []},
  "layouts": [],
  "unresolvedReferences": [],
  "validationSummary": {"projection": "NOT_RUN", "endpoint": "NOT_RUN"}
}
```

`generatedAt` may appear in an external build envelope or log, but it must be excluded from canonical bytes. Identical identity-bearing inputs must produce byte-identical semantic output, stable indexes and coordinates, the same content hash, and the same ETag. Changing a source revision, extractor version, projection contract version, or layout policy must change the corresponding snapshot identity. `semanticHash` covers only canonical semantic material, so learner/navigation changes cannot masquerade as semantic change ([research.md, Agent 3, “Performance”](./research.md#performance)).

A candidate record can remain compact:

```json
{
  "id": "concept.domainspec.aeo.pipeline-route-template",
  "objectKind": {"namespace": "domainspec.feature", "value": "Entity"},
  "label": "PipelineRouteTemplate",
  "sourceRefs": [{"sourceId": "src.aeo-spec", "heading": "Concept Registry", "role": "defines"}],
  "claimClass": null,
  "verificationStatus": "source-observed",
  "verificationScope": "document",
  "proofStatus": null,
  "evidenceConfidence": "high",
  "commitmentConfidence": "source-local",
  "authorityState": {"namespace": "domainspec.local", "value": "candidate"},
  "localStatus": {"namespace": "projection", "value": "extracted"},
  "ownerRoute": "domainspec-v2/source-owner",
  "authorityEffect": "none",
  "forbiddenCollapses": ["projection-is-promotion", "document-valid-is-runtime-correct"]
}
```

## Independent gates

| Gate | Discriminating question | Current result |
|---|---|---|
| Projection-contract gate | Is the candidate schema versioned, owner-routed, and non-collapsing? | `NOT_RUN`; owner unresolved. |
| Source gate | Do all records resolve to revision-pinned, allowed source anchors? | `NOT_RUN`. |
| Semantic gate | Are object kinds and relation classes source-local or explicitly candidate? | `NOT_RUN`. |
| Endpoint gate | Are both endpoints admissible for the source-owned relation signature? | `NOT_RUN`; documentary witness exists. |
| Proof gate | Are claim class, proof domain, verification scope, assumptions, and counterevidence separated? | `NOT_RUN`. |
| Runtime/instance gate | Is implementation behavior evidenced independently of document/schema validity? | `NOT_RUN`; no runtime witness is claimed. |
| Determinism gate | Do repeated builds produce the same canonical bytes, coordinates, hashes, indexes, and ETags? | `NOT_RUN`. |
| Accessibility gate | Can keyboard, touch, reduced-motion, and tested screen-reader users complete the journeys through equivalent information? | `NOT_RUN`. |
| Performance gate | Do measured corpus distributions and interaction traces stay inside accepted budgets? | `NOT_RUN`. |
| Publication gate | Does a separately owned build contain only allowed public material across every output channel? | `NOT_RUN`; no successful public proof exists. |

Passing one gate never closes another. In particular, a schema/endpoint pass cannot stand in for runtime correctness, and a private build pass cannot stand in for publication authority.

# Concrete ontology witness

## Primary: Agent Execution Orchestrator typed-negative case

The Agent Execution Orchestrator SPEC is the primary formal witness because it contains both an admitted source-local relation and an explicitly rejected attempted relation:

```text
PipelineRouteTemplate : Entity
StageContract         : Value Object

PipelineRouteTemplate --contains--> StageContract
  classification: DomainSpecLocalRelation
  endpoint gate: documentary PASS candidate; executable test NOT_RUN

AssemblePipelineRoute --enforces--> StageContract
  classification: AttemptedRelation + residue
  reason: inadmissible endpoint types in the source-local model
  semantic export: forbidden
  CAV2 morphism: never inferred
```

The rejected row must not enter `semanticView`. It lives as an attempted relation plus residue so the learner can see why typing matters. The projection labels the admitted relation `DomainSpecLocalRelation`, not a CAV2 morphism. This witnesses artifact/concept separation, typed endpoints, negative evidence, residue, and independent schema/instance gates without claiming an executed validator or runtime (`projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/SPEC.md`, concept registry and rejected rows; [research.md, Agent 1, “Witness”](./research.md#formal-half-of-the-smallest-domainspec-plus-craft-witness)).

Mapped to Craft, the same bounded unit is a coverage exercise rather than a proof:

```yaml
intention: explain one admissible DomainSpec feature relation without overclaim
schema: feature concept registry plus source-local endpoint rule
translator: bounded source-to-candidate-record extraction
artifact: two concept records plus one admitted relation
residue:
  - rejected attempted relation
  - missing executable endpoint evidence
  - missing runtime evidence
governance: DomainSpec local source and owner route
validation:
  schema: documentary-witness-only
  endpoint: NOT_RUN
  runtime: NOT_RUN
```

## Secondary: Financial Settlement positive document fixture

Financial Settlement is the positive learner fixture, not the primary formal witness:

```text
NoDuplicateMakeupRule
  --enforces--> GenerateSettlement
  --produces-for--> SettlementTransaction
```

The learner can traverse the concept registry, open exact source evidence, compare the semantic relations with learner-only sequence edges, and see that document/schema evidence does not establish business-runtime conformance (`projects/domainspec-v2/impl/spec/features/financial-settlement/SPEC.md`, concept registry, relationships, rule and operation sections; [research.md, Agent 3, “Journey 2”](./research.md#journey-2-domainspec-spec-exploration)).

# Worked learning journey

The first complete journey should answer: **“How does intention become an artifact, and what happens when translation leaves residue?”**

```yaml
journeyId: journey.craft.intention-to-residue
focusQuestion: How does intention become an artifact, and what happens when translation leaves residue?
entry: concept.craft.intention
steps:
  - show: concept.craft.intention
    proposition: intention is represented through a chosen schema
  - show: concept.craft.pcra-translator
    proposition: a situated translator produces an artifact under context and tools
    warning: perfect faithfulness or isomorphism is not assumed
  - show: concept.craft.validation
    proposition: governance-conditioned validation exposes actionable residue
  - show: concept.craft.residue
    choices: [repair-locally, route-to-owner, open-child-context, accept-named-residue]
  - show: concept.craft.recomposition
    proposition: validated work returns to its parent without losing evidence or responsibility
  - show: claim.craft.universal-horizon
    lens: research-horizon
    warning: speculation; no upward proof cast
completion:
  learnerMustIdentify:
    - source artifact versus concept
    - schema validation versus runtime evidence
    - analogy versus formal result
    - projection versus promotion
```

The spatial view shows only the focused neighborhood. Selecting a card opens plain definition, object kind, source count, authority state, claim/proof posture, owner route, and “Why is this linked?”. Switching lenses preserves the same selected stable ID. A learner can disable every `LEARN NEXT` edge and obtain an unchanged semantic relation table. The challenge view asks what evidence could move a claim and makes unresolved residue visible rather than hiding it (`arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`, translator, reflection tower, philosophical horizon, and honesty-boundary sections; [research.md, Agent 2, “Learner Traversal”](./research.md#learner-traversal); [research.md, Agent 3, “Information Architecture”](./research.md#information-architecture)).

# Application architecture

## Deterministic read path

1. Pin source revisions and enumerate explicitly allowed artifacts.
2. Extract source records and anchors without rewriting source-owned meaning.
3. Normalize only into versioned candidate fields; retain source-local namespace/value pairs.
4. Report unresolved references and rejected attempted relations.
5. Run the independent validation gates and persist their exact results.
6. Canonically sort records and relations by stable ID.
7. Build `semanticView`, then separately build `learnerView` and `navigationView`.
8. Precompute deterministic ELK coordinates under a versioned layout policy.
9. Emit immutable JSON and search indexes plus their hashes and ETags.
10. Serve the snapshot through a GET-only API; keep learner state separate.

Recommended endpoints:

```text
GET /v1/snapshots/{id}
GET /v1/entities/{id}
GET /v1/entities/{id}/neighborhood?depth=1&facets=...
GET /v1/claims/{id}
GET /v1/search?q=...
GET /v1/journeys/{id}
GET /v1/sources/{id}/anchors/{anchor}
```

No authority mutation, source editing, challenge adjudication, promotion, or publication endpoint belongs in this package. Learner progress, bookmarks, and layout preferences use a separate user-state store keyed by projection ID, if and when account-backed state enters scope ([research.md, Agent 3, “Data/API Boundary”](./research.md#dataapi-boundary)).

## Interface contract

The application has four equal surfaces:

- a focus-question overview and guided journey;
- a bounded spatial graph;
- an authored DOM hierarchy for sequence;
- a native relation table for cross-links, evidence, claim class, status, and authority effect.

Do not label a general graph as an ARIA tree. The actual hierarchy may implement the [WAI treeview pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/); disclosures should use buttons and `aria-expanded` ([WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)). Every spatial action needs a non-drag alternative. Keyboard, screen-reader, touch, and reduced-motion users must be able to reach the same entities, relations, source anchors, claim statuses, challenges, and next actions. Color may reinforce state but cannot be the only differentiator ([WCAG use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color); [research.md, Agent 3, “Accessibility”](./research.md#accessibility)).

The visual grammar should label meaning directly:

| Object | Visible label/treatment | Edge rule |
|---|---|---|
| Source artifact | `SOURCE`, file-tab rectangle | `defines`, `cites`, `extracted from` |
| Semantic concept | `CONCEPT`, rounded rectangle | source-local labeled proposition |
| Formal correspondence | `FORMAL MODEL`, hexagonal claim card, domain proof badge | `modeled as`; never unlabeled equality |
| Structural analogy | `ANALOGY`, slanted card | `analogous to`, authority effect `none` |
| Philosophical thesis | `PHILOSOPHICAL THESIS`, stage label | full interpretive linking phrase |
| Universal horizon | `SPECULATIVE HORIZON` plus warning | no proof-bearing inbound edge |
| Governance object | authority state and owner route in text | authority effect visible in detail |
| Residue/challenge | `RESIDUE` or `CHALLENGE`, patterned card | `flags`, `contradicts`, `routes to` |
| Learner edge | `LEARN NEXT`, compass/dotted treatment | stored outside semantic relations |

# Technology and scale posture

For the first private witness, use **React Flow 12 + precomputed ELK layered layouts + immutable JSON/search index + first-class DOM hierarchy/table**. This choice fits rich DOM nodes, source/proof/authority badges, deterministic server-built layouts, and a small curated graph. React Flow’s accessibility and SSR features and ELK’s layered/compound graph support are upstream precedent, not proof that this application is accessible or performant ([React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility); [React Flow SSR](https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration); [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html); [research.md, Agent 3, “Technology Matrix”](./research.md#technology-matrix)).

The registry versions recorded in the research—React Flow 12.11.2, ELK.js 0.11.1, Cytoscape.js 3.34.0, Sigma 3.0.3, and D3 7.9.0—are observations dated 2026-07-14. Recheck and pin exact versions at implementation time. Do not represent those observations as a timeless compatibility verdict.

Start with a curated 50–150-node learning surface. The candidate thresholds below are **unmeasured review triggers**, not library limits and not automatic renderer switches:

- more than 250 visible nodes;
- more than 500 visible edges;
- more than 1,500 total projected nodes or unexpectedly dense relations.

Crossing a trigger opens a measured renderer/interaction review. It does not automatically select Sigma, Cytoscape, canvas, or WebGL. Optional scale dependencies stay absent while their gate is false. Any later spatial renderer must retain semantic byte stability and DOM hierarchy/table parity. Corpus distributions, render timings, interaction latency, browser behavior, and assistive-technology behavior are all `NOT_RUN` ([research.md, Agent 3, “Performance”](./research.md#performance)).

# Private/public contract

The integrated application is private because it combines Arcanum/Craft with private CyberAlchemy v2 and DomainSpec material. A public surface is **not a redacted build of that application**. It is a separately built candidate Arcanum-only derivative with a distinct `projectionOwnerRoute`, distinct `publicationOwnerRoute`, explicit allowlist, full manifest, channel scans, and a separate human publication verdict. Build success never approves publication.

Candidate public build policy:

```yaml
publicationCandidate: arcanum-learning-map
defaultSourceDecision: deny
allowedSourcePrefixes:
  - arcanum/
projectionOwnerRoute: UNRESOLVED
publicationOwnerRoute: UNRESOLVED
channels:
  html: enabled
  json: enabled
  searchIndex: enabled
  sourceExcerpts: disabled
  sourceMaps: disabled
requiredManifestCoverage:
  - toolVersions
  - sourceRevisionsAndHashes
  - everyInputSource
  - everyEmittedRecord
  - everyOutputFile
  - everyEnabledOrDisabledChannel
  - everyPrivateSentinelScan
publicationVerdict: NOT_RUN
```

The public candidate needs both a positive and a negative proof fixture:

- **Positive, anti-vacuity fixture:** allow `arcanum/framework/CYBERALCHEMY-METHOD.md`, “Core Thesis” lines 27–43. A successful build must emit a non-empty source record, an operational claim, an `extracted_from` provenance relation, a learner entry, and an addressable source link. An always-reject compiler fails this fixture.
- **Negative, fail-closed fixtures:** inject a private path sentinel and private content sentinel into every supported output channel, one channel at a time. Each run must fail before output is published. Disabled channels must still be accounted for in the manifest. An allowlisted source path does not make injected private content safe.

Even if both fixtures pass, the result is only a technically bounded publication candidate. A separately owned publication verdict must still approve the exact manifest. No public derivative has been successfully built, scanned, reviewed, or approved in this dispatch ([research.md, Agent 3, finding 5 and “Evidence Boundary”](./research.md#evidence-boundary-2); repository `AGENTS.md`, public/private boundary).

# Dispositions

## Blocked by missing source-owned definition or evidence

- A live CAV2 ontology schema is blocked on morphism classes/hom-sets, endpoint tables, path laws or free-category posture, cycle/value-effect rules, and related authority reachability questions (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, “Hom-Sets” and open questions; `cyberAlchemy-v2/ontology/RELATION-MODEL.md`; [research.md, Agent 1, “Blocking a live ontology”](./research.md#blocking-a-live-ontology)).
- Exact cross-project projection vocabulary and enums are blocked on an owner route; the candidate fields in this document must not be frozen as canonical.
- Independently verified display of the sibling Lean results is blocked because the cited proof sources were outside the bounded evidence set (`arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`; [research.md, Agent 2, “Evidence Boundary”](./research.md#evidence-boundary-1)).
- Precise AutoBayes theorem labeling is blocked by the local “Theorem 23” versus current-paper Theorems 3.5 and 4.7 discrepancy ([research.md, Agent 2, “Formal Spine”](./research.md#what-it-does-not-prove)).
- Learner-facing expansion of SWU is blocked by “Single Work Unit” in the initial definition versus “Smallest Working Unit” in the glossary (`arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`, SWU section; `arcanum/development/craft/CRAFT-GLOSSARY.md`, SWU entry; [research.md, Agent 3, “Open Questions”](./research.md#open-questions-2)).

## Excluded from the current MVP

- source or ontology mutation;
- owner decisions, authority transitions, promotion, or demotion;
- source editing or challenge adjudication;
- invented canonical node or edge kinds;
- account-backed learner state;
- automatic renderer switching;
- claims of runtime correctness, learning efficacy, complete accessibility, or philosophical truth.

## Deferred pending a named gate

- RDF/JSON-LD semantic recasting, SPARQL, inference, and federation wait for relation-law and vocabulary gates. JSON-LD may later be an interchange envelope only ([W3C JSON-LD 1.1](https://www.w3.org/TR/json-ld11/); [research.md, Agent 3, “Data/API Boundary”](./research.md#dataapi-boundary)).
- Canvas/WebGL or other scale renderers wait for measured performance and accessibility review.
- The Arcanum-only derivative waits for projection ownership, public build tests, full manifest review, and publication authority.
- Any write path waits for a separately governed mutation design; a GET-only read model does not grow mutation authority by convenience.

Closing a deferred gate opens a review. It does not automatically activate the deferred feature.

# Phased implementation sequence

## Phase 0 — candidate contract and fixture lock

- Record the projection contract as candidate and `ownerRoute: UNRESOLVED`.
- Pin the exact source revisions for Craft, CAV2, and the two DomainSpec feature SPECs.
- Encode the non-collapse laws and independent gate names as executable schema constraints where possible.
- Freeze the Agent Execution Orchestrator positive/negative documentary fixture and Financial Settlement learner fixture.

Exit: source manifest is complete; candidate vocabulary is explicitly non-canonical; no owner or proof state is inferred.

## Phase 1 — deterministic semantic compiler

- Implement source adapters, source anchors, candidate records, attempted-relation residue, unresolved-reference reporting, canonical sorting, and `semanticHash`.
- Run repeat-build determinism tests and the learner/navigation-removal invariant.
- Emit immutable JSON and a generated search index.

Exit: identical inputs produce identical canonical semantic bytes, index, hash, and ETag; tests recorded rather than presumed.

## Phase 2 — private learning read model

- Author the Craft journey and Financial Settlement journey over shared identities.
- Precompute ELK coordinates under a versioned layout policy.
- Implement the GET-only endpoints, graph, source/claim/challenge detail, hierarchy, and relation table.
- Keep learner state local and separate from snapshot identity.

Exit: spatial and non-spatial views agree on records/relations while preserving their different purposes.

## Phase 3 — evidence and accessibility pass

- Run source, semantic, endpoint, proof, runtime-negative, determinism, keyboard, touch, reduced-motion, screen-reader, browser-history, and deep-link tests.
- Measure the actual corpus and interaction budgets before considering a scale renderer.
- Record what each test can and cannot establish.

Exit: all required gates have explicit pass/flag/block evidence; no browser result is generalized to comprehension or total accessibility.

## Phase 4 — private pilot and learning evaluation

- Pilot the curated 50–150-node map with new contributors, implementers, and governance reviewers.
- Measure task completion and error patterns separately from preference, trust, retention, and conceptual transfer.
- Route learner confusion into projection residue, not source mutation.

Exit: pilot evidence supports or rejects the learning design without changing source authority.

## Phase 5 — optional public derivative

- Build the Arcanum-only package from the default-deny manifest.
- Run the non-empty positive fixture and every per-channel path/content negative fixture.
- Review the complete manifest under a separately named publication owner.

Exit: a publication verdict applies to one exact manifest. Until then, the derivative is not public-ready.

# Review verdict matrix

Only the non-vacuity and definitional gates were empowered to `KILL` a candidate. Neither did. Precedent review could identify ownership conflicts but never `KILL`. “Witnessed” below means the research contains a finite documentary or design witness; it does **not** mean the executable acceptance tests ran.

| Candidate | Owner/precedent | Witnessed? | Definitionally sound? | Verdict |
|---|---|---|---|---|
| C1 — six planes plus three separately stored views | Build-from-owned precedent: CAV2 authority constraints, Craft ledger rows, DomainSpec local semantics, IHMC focus-question maps. Combined projection owner unknown. | Yes, documentary/design; tests `NOT_RUN`. | Yes after stating that L0–L5 are internal classifications, not CAV2 kinds. | **UPHOLD / CLEAR** |
| C2 — independent claim, verification, confidence, status, authority, and owner axes | Source-local terms plus candidate unowned normalization vocabulary. Exact enum owner unknown. | Yes, candidate record and non-collapse laws; tests `NOT_RUN`. | Yes after removing generic `evidenceStatus` and making proof nullable/domain-scoped. | **UPHOLD / CLEAR** |
| C3 — deterministic immutable snapshot and GET-only API | Projection compiler owns no source authority; projection owner unknown. | Yes, canonical-byte and identity-changing tests are finite; all `NOT_RUN`. | Yes after excluding `generatedAt` from canonical bytes and separating semantic/view/layout material. | **REPAIR -> CLEAR** |
| C4 — AEO typed-negative primary witness; Financial Settlement positive fixture | DomainSpec SPEC owns its local registry and relation posture; Craft tuple is coverage only. | Yes, admitted and rejected rows exist; executable endpoint/runtime tests `NOT_RUN`. | Yes; `AttemptedRelation` never becomes semantic relation or CAV2 morphism. | **UPHOLD / CLEAR** |
| C5 — React Flow + ELK + immutable JSON + equivalent DOM views | Upstream renderer/layout precedent; application behavior remains locally unproved. | Yes, bounded 50–150-node witness design; performance/browser/AT tests `NOT_RUN`. | Yes after converting thresholds to unmeasured review triggers and forbidding auto-switch. | **REPAIR -> CLEAR** |
| C6 — private integrated app and separately built Arcanum-only public candidate | Repository public/private authority; projection and publication owners remain distinct and unresolved. | Yes, positive non-empty and negative per-channel fixtures are finite; all `NOT_RUN`. | Yes after replacing “redaction” with default-deny independent build and separate verdict. | **REPAIR -> CLEAR** |
| C7 — blocked, excluded, and deferred dispositions | Existing fail-closed source boundaries; standard RDF interchange precedent. | Yes, every deferred item has a gate condition; gates `NOT_RUN`. | Yes after reserving “blocked” for missing source-owned definition/evidence. | **REPAIR -> CLEAR** |

The converged result is therefore decision-usable as a candidate architecture, not implementation proof or publication approval.

# Dispatch integrity

The three review roles remained distinct: precedent/ownership, non-vacuity/witnessability, and definitional soundness. Runtime thread capacity allowed two initial reviewers concurrently; the third began when a slot cleared. The cross-review turns were likewise serialized for one turn by the runtime limit. This was a scheduling deviation from physical parallelism, not a merge of review roles or gate powers.

```yaml
exit_reason: resolved
exit_context: Final approver accepted; no contradiction remains.
agents_spawned:
  total: 9
  tree:
    explorer: 3
    synthesizer: 1
    skeptic: 3
    writer: 1
    auditor: 1
    helpers: 0
  loops_used: 1
```

# Connections

| Target | Relation | Description |
|---|---|---|
| [research.md](./research.md) | `derives-from` | This findings artifact derives its source-grounded synthesis from the three verbatim explorer returns in the sibling research transcript, then incorporates the dispatch synthesizer and converged reviewer dispositions. |

# Open Questions

- **OQ-1 (BLOCKER)** — Who owns the combined projection contract and may approve its exact field vocabulary? Recommendation: keep `projectionOwnerRoute: UNRESOLVED`, preserve source-local namespaces, and route an owner-selection decision before freezing `0.1.0`. Owner: CyberAlchemy v2 authority owner-selection route.
- **OQ-2 (BLOCKER)** — Who owns the publication verdict for an Arcanum-only derivative? Recommendation: keep `publicationOwnerRoute: UNRESOLVED` and prohibit public release until an owner approves one exact manifest after positive and per-channel negative tests. Owner: repository public/private publication authority route.
- **OQ-3 (BLOCKER)** — Which values for `objectKind`, `claimClass`, `verificationStatus`, `proofStatus`, authority state, and local status are governed rather than merely useful? Recommendation: run definitions governance with the source owners; do not promote the candidate enums from this findings file. Owner: `definitions-governance`, with Arcanum, CAV2, and DomainSpec definition owners.
- **OQ-4 (BLOCKER)** — Which CAV2 edge classes are morphisms, what are their endpoint tables/hom-sets, and which path laws, cycle policies, and authority monotonicity rules hold? Recommendation: close the canonical relation model before any live ontology, RDF, SPARQL, or inference design. Owner: CyberAlchemy v2 ontology authority route for `CANONICAL-KINDS.md` and `RELATION-MODEL.md`.
- **OQ-5 (BLOCKER)** — Does SWU mean “Single Work Unit” or “Smallest Working Unit”? Recommendation: resolve one canonical expansion or intentionally define two distinct terms before learner labels freeze. Owner: Arcanum Craft definitions owner via `definitions-governance`.
- **OQ-6 (BLOCKER)** — Which exact sibling Lean revisions support the locally reported typed-residue, loss, colimit, obstruction, and plateau results? Recommendation: ingest and revision-pin the proof sources before labeling them independently verified. Owner: Craft formal-foundations evidence owner / sibling theorem repository owner.
- **OQ-7 (BLOCKER)** — Why does the local formal-foundations document cite AutoBayes “Theorem 23” while the current paper presents the relevant results as Theorems 3.5 and 4.7? Recommendation: reconcile source version and statement before precise theorem labeling. Owner: Craft formal-foundations evidence owner.
- **OQ-8** — Do the candidate snapshot, endpoint, proof, runtime, determinism, accessibility, performance, and publication gates actually pass? Recommendation: implement Phase 1–3 fixtures and record independent results; they are all currently `NOT_RUN`. Owner: private learning-map implementation and evidence owner.
- **OQ-9** — What measured node/edge distributions and interaction budgets should govern scale review? Recommendation: instrument the private 50–150-node witness; treat 250 visible nodes, 500 visible edges, and 1,500 total nodes only as candidate review triggers. Owner: learning-map performance evidence owner.
- **OQ-10** — Which focus questions and learner journeys may be treated as maintained product content? Recommendation: pilot authored questions, preserve learner edges outside semantic export, and give each maintained journey an editorial owner. Owner: learning-content owner route, currently unassigned.
- **OQ-11** — Should learner progress remain local, become account-backed, or be exportable? Recommendation: leave account state outside the current MVP and require a separate privacy/data-governance design before persistence. Owner: website product and data-governance owner.
- **OQ-12 (BLOCKER)** — Can the Arcanum-only derivative produce a non-empty allowed result while rejecting private path and content injection in every channel? Recommendation: do not claim public safety until the positive fixture, per-channel negative fixtures, manifest review, and publication verdict all succeed; no successful public proof exists. Owner: unresolved publication owner route plus public-build evidence owner.
