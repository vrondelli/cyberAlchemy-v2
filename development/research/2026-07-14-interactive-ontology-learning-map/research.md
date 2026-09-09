## Agent 1 — formal governed graph analysis

# E1 — Formal governed graph analysis

## Key Findings

1. **[Observation] One flattened graph is invalid.** The corpus requires at least five orthogonal planes: source artifacts, semantic concepts, epistemic claims, governance/authority, and learner projections. Craft adds an operational plane for contexts, conditions, gates, residue, and recomposition. CyberAlchemy itself distinguishes artifact creation, navigation, observability, and lifecycle authority (`arcanum/framework/CYBERALCHEMY-METHOD.md`, “Core Thesis,” lines 27–43).

2. **[Observation] The CyberAlchemy v2 ontology package is candidate modeling, not authority.** It may create candidate concepts and read-model rows, but owner routes decide promotion; ontology appears before a gate as candidate meaning and after it only as an allowed projection (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`, “Purpose,” lines 7–19; “Authority Law,” lines 56–88).

3. **[Observation] A read model is safe now; a live ontology schema is not.** Live node types, vault edges, schema amendments, movement edges, promotion verdicts, and generated-mirror authority are explicitly out of scope (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`, “Package Boundary,” lines 32–54). Candidate node concepts are not live `node_type` values (`cyberAlchemy-v2/ontology/NODE-MODEL.md`, “Purpose,” lines 6–10).

4. **[Observation] The categorical core is unfinished.** Grounding and succession edges are proposed morphisms; conflict and navigational edges are annotations. But morphism classes, path equations/free-category posture, and endpoint tables remain open, blocking a machine-readable edge schema (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, “Edges,” lines 99–120; “Hom-Sets,” lines 134–170).

5. **[Observation] Craft’s formal support has a strict scope boundary.** The cited cousins reportedly prove categorical/probabilistic results, but the mapping from those results to PCRA/LLM behavior remains analogy (`arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`, “How To Read This,” lines 21–35; “Honesty Boundary,” lines 133–150).

6. **[Candidate design] Use a typed multi-plane property graph with prohibited cross-plane casts.** The learner site should query a denormalized read model built from this graph, never use the projection itself as the authority store.

## Candidate Layer Model

| Plane | Governed contents | May assert | Must not assert |
|---|---|---|---|
| L0 Source | `ArtifactInstance`, `SourceAnchor`, source revision/posture | “This artifact says X at anchor Y.” | That X is a canonical concept or true claim. |
| L1 Semantic | `Concept`, `ConceptKind`, local definition, DomainSpec feature concept | Meaning, local type, vocabulary relations | Proof, promotion, or artifact identity. |
| L2 Epistemic | `Claim`, `FormalResultClaim`, `AnalogyBridge`, `InterpretiveClaim`, `UnresolvedQuestion` | Claim scope and proof/analogy posture | Authority or runtime conformance. |
| L3 Governance | `AuthorityEnvelope`, `OwnerRoute`, `DecisionRecord`, `PromotionRecord`, `AuthorityKind`, `PromotionGate` | Who may decide and what decision was recorded | Meaning merely by adjacency. |
| L4 Operational | `CraftContext`, `ArtifactOwnership`, `LedgerCondition`, `Gate`, `Residue`, `RecompositionObligation` | Current workflow state and next responsible move | Semantic or authority identity. |
| L5 Projection | `Projection`, `LearnerView`, `ViewAnnotation`, navigation sequence | What a learner sees, hides, or is warned about | Promotion, proof, or source replacement. |

**[Observation]** Craft’s recursive ledger already separates contexts, artifacts, relations, typed items, and decisions (`arcanum/development/craft/CRAFT-RECURSIVE-LEDGER-DESIGN.md`, “Core Row Families,” lines 28–38). The UX example independently demonstrates four distinct surfaces—artifact instances, artifact links, ontology candidates, and fixtures—and denies authority by proximity (`cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/README.md`, lines 3–22).

**[Candidate design]** Philosophical material belongs in L2 as staged claims, not in L1 as settled ontology. Craft explicitly stages operational, formal, philosophical, and universal-physics claims, with the deepest claim unproven (`arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`, “Philosophical Horizon,” lines 600–631).

## Node/Edge Contract

### Candidate node classes

- `ArtifactInstance`: a file/record with path, canonical-kind reference, durability, and source posture.
- `SemanticConcept`: a meaning-bearing object independent of any one file.
- `Claim`: typed by `claim_scope` and `epistemic_status`.
- `EvidenceRecord`: evidence about a claim, never the source authority itself.
- `GovernanceObject`: envelope, gate, owner decision, promotion record, or owner route.
- `OperationalContext`: recursive Craft context.
- `LedgerCondition`: blocker, gate, or enabler.
- `Residue`: unresolved remainder with owner/next route.
- `Projection`: a derived view with no authority effect by default.

The CAV2 candidate contract already requires stable concept ID, role, source refs, owner route, candidate status, split confidence, challenge contract, residue, and forbidden-collapse declaration (`cyberAlchemy-v2/ontology/NODE-MODEL.md`, “Node Concept Contract,” lines 12–34).

### Properties versus nodes

**Properties/value objects**

- `label`, `path`, `section_anchor`, `line_span`
- `canonical_kind` as a reference to a governed kind
- `concept_role`
- `authority_state` on an eligible artifact instance
- `candidate_status`
- `evidence_confidence`, `commitment_confidence`
- `durability`
- `gate_result`
- `projection_effect`

A source anchor remains an embedded value object unless it acquires independent review/provenance, in which case it becomes an `EvidenceExcerpt` node.

**Nodes**

- Anything with independent identity, provenance, lifecycle, owner, challengeability, or reuse: artifact, concept, claim, decision, promotion record, residue, projection, context.

**[Observation]** Canonical kind is a document schema type, not a role; role and kind are orthogonal (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, lines 67–74). Likewise, a Craft lane names responsibility, while a role names a local handler and remains advisory without owner evidence (`arcanum/development/craft/CRAFT-LEDGER-TYPE-SYSTEM.md`, “Operational Lanes,” lines 109–136; “Role Schema Anatomy,” lines 273–299).

### Candidate edge classes

1. **Compositional morphisms:** candidate grounding edges (`derives-from`, `implements`, `validates`, `depends-on`, `rollup`, `consumed-by`) and succession endomorphisms (`supersedes`, `updates`, `deprecates`). Require endpoint typing and acyclicity.
2. **Governance transitions:** `decides_transition`. Active only when backed by the actual owner decision; do not compose it into semantic implication.
3. **Staging/projection edges:** `supports_candidate`, `requests_promotion_gate`, `emits_projection_when_allowed`, `records_residue`, `routes_drift_to`. Their `authority_effect` is explicit and never inferred.
4. **Operational ledger edges:** `contains`, `blocks`, `enables`, `depends_on`, `informs`, `supersedes`. These are Craft-state relations, not automatically CAV2 categorical morphisms (`arcanum/development/craft/CRAFT-RECURSIVE-LEDGER-DESIGN.md`, “Relation Rows,” lines 93–120).
5. **Annotations/navigation:** `contradicts`, `alternative-to`, `questions`, `refines`, `exemplifies`, `contextualizes`, `flags`. Never compose as authority-bearing paths.

Every candidate CAV2 relation needs explicit endpoints, direction, owner, evidence, authority effect, and forbidden collapse (`cyberAlchemy-v2/ontology/RELATION-MODEL.md`, “Relation Contract,” lines 13–26).

### Minimum record contract

```yaml
record_id: stable-local-id
record_class: artifact|concept|claim|governance|context|condition|residue|projection
label:
source_refs:
  - artifact_id:
    path:
    heading:
    line_span:
    source_posture: primary|supporting|witness|interpretation
local_status:
  namespace: document|candidate_workflow|gate|ledger
  value:
epistemic:
  status: observed|asserted|reported-proven|analogy|interpretation|unresolved
  claim_scope:
  verification_scope:
authority:
  canonical_kind:
  concept_role:
  authority_kind:
  authority_posture:
  authority_state: candidate|promoted|demoted|null
  owner_route:
confidence:
  evidence_confidence:
  commitment_confidence:
challenge_contract:
residue:
forbidden_collapse:
projection_effect:
  mode: none|staging|projection|owner-decision|blocked
  allowed_uses: []
  blocked_uses: []
```

**[Candidate design]** `local_status` is namespaced because CAV2 package workflow status must not collapse into vault maturity (`cyberAlchemy-v2/ontology/NODE-MODEL.md`, “Node Status Axis,” lines 78–89). `authority_posture` remains nullable/open because its enum is not defined in the bounded corpus, though it is required by the package candidate shape (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`, lines 90–123).

## Crosswalk

| Required object | Source artifact | Graph representation | Proof/authority posture |
|---|---|---|---|
| DomainSpec feature SPEC | `projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/SPEC.md` | One `ArtifactInstance`; thirteen `SemanticConcept` nodes; nine DomainSpec-local edges; three `Residue` records for omitted invalid rows | Build-from-owned projection; the file says Root DS-D8 remains authoritative. Chosen because it contains mixed concept types, admitted edges, and explicit rejected endpoint rows (`SPEC.md`, lines 1–7, 14–44, 157–166). |
| Craft definition | “Residue” in `CRAFT-GLOSSARY.md` | Artifact anchor → `concept.craft.residue`; definition text/property; `candidate_status=candidate` | Local candidate only; glossary terms stay local until promotion (`CRAFT-GLOSSARY.md`, lines 3–15, 19–36). |
| Craft operational/formal construct | Reflection Tower | `OperationalConstruct` plus `residue-seeds-next-layer` operational edge; separate `Claim` nodes for reported formal-cousin results and analogy bridge | Operational definition: residue becomes the next layer’s seed and stopping is contextual (`CRAFT-INITIAL-DEFINITION.md`, lines 250–262). Reported cousin theorem must not certify Craft/LLM behavior (`CRAFT-FORMAL-FOUNDATIONS.md`, lines 85–96, 133–150). |
| Philosophical thesis | Staged “universal physics of craft” | Four `Claim` nodes—operational, formal, philosophical, universal—joined by `interpretive_extension_of` annotations | The universal claim is a research horizon, not proof; each local use must still name schema, artifact, residue, validation, and route (`CRAFT-INITIAL-DEFINITION.md`, lines 624–631, 660–672). |
| CAV2 authority object | `concept.authority_envelope` | `GovernanceObject` linked to owner route, candidate meaning, evidence, decision, and optional projection | Candidate workflow object, not a new harness object; ontology models but does not decide authority (`cyberAlchemy-v2/ontology/NODE-MODEL.md`, lines 61–76; `PACKAGE-MODEL.md`, lines 70–88). |

## Non-Collapse Laws

1. `ArtifactInstance != SemanticConcept`.
2. `SourceAnchor != EvidenceRecord != source authority`.
3. `canonical_kind != concept_role != authority_kind != authority_state`.
4. `durability != authority_kind != maturity/workflow status` (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, lines 76–97).
5. `candidate_status != promoted`.
6. `local validation != promotion`; Craft defines promotion as a later authority decision (`arcanum/development/craft/CRAFT-GLOSSARY.md`, lines 35–38).
7. `owner route suggestion != owner decision`.
8. `lane != role != person/agent != delegation authority`.
9. `projection != promotion`; no arrow in the DomainSpec local promotion path is automatic (`projects/domainspec-v2/ontology/README.md`, lines 93–116).
10. `formal-cousin theorem != proof of Craft run != proof of LLM behavior`.
11. `schema fidelity != instance fidelity`; they require independent gates (`arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`, lines 98–104).
12. `philosophical interpretation != formal claim != universal proof`.
13. `conflict/navigation annotation != categorical morphism`.
14. `records_residue != automatic reflection-tower climb` (`cyberAlchemy-v2/ontology/RELATION-MODEL.md`, lines 45–58).
15. `read-model completeness != authority by completeness`.

**Forbidden inferences:** adjacency implies endorsement; evidence count implies truth; candidate concept implies canonical definition; an emitted projection implies owner approval; an accessible browser result implies comprehension/trust; a route-shape validation implies executed closure; a valid DomainSpec schema edge implies runtime correctness.

## Witness

### Formal half of the smallest DomainSpec-plus-Craft witness

Use one bounded SCU from the selected SPEC:

- `ArtifactInstance`: Agent Execution Orchestrator SPEC.
- `SemanticConcept`: `PipelineRouteTemplate : Entity`.
- `SemanticConcept`: `StageContract : Value Object`.
- DomainSpec-local edge: `PipelineRouteTemplate --contains--> StageContract`.
- `AttemptedRelation` residue: `AssemblePipelineRoute --enforces--> StageContract`, explicitly absent because endpoint types are inadmissible (`SPEC.md`, lines 14–20, 32–44, 157–166).
- `SchemaGate`: checks registry membership and endpoint admissibility.
- `InstanceGate`: `not_run`; no code/runtime artifact is in this witness.
- `Projection`: learner view showing the admitted relation and rejected attempt, marked derived/non-authoritative.

Map it to Craft’s formal tuple:

```text
I = explain one admissible DomainSpec feature relation without overclaim
S = feature concept registry + endpoint rule
F = bounded source-to-read-model translation
D = two concept records + one admitted relation
R = rejected attempted relation + missing instance evidence
G = DomainSpec local owner/source boundary
V = schema gate PASS; instance gate NOT_RUN
```

This is the smallest witness that demonstrates artifact/concept separation, typed endpoints, residue, split schema/instance validation, and non-authoritative projection. It must return `flag`, not `pass`, for any runtime-correctness claim.

## Open Questions

### Blocking a live ontology

- Which edge classes are morphisms?
- Is the category free, or what path equations hold?
- What is the endpoint-type table for every grounding relation?
- How are instance-level authority monotonicity checks encoded separately from type-level endpoint rules? (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, lines 134–170).
- How are `value_effect` and `cycle_policy` validated, including contextuality-obstruction exceptions? Unknown is residue, not permission (`cyberAlchemy-v2/ontology/RELATION-MODEL.md`, lines 28–43).
- Is Tier-1 canonical-kind enumeration closed?
- What are the authority-kind rollups for axiom, invariant, and premise?
- Are projection and residue authority-reachable?
- Where does per-instance durability override live? (`cyberAlchemy-v2/ontology/CANONICAL-KINDS.md`, lines 171–222).
- What live concept represents runtime contracts? The non-authority example records this as unmapped residue (`cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/ontology/nodes.json`, lines 183–190).

### Safe in an application read model now

- Artifact catalog and exact source anchors.
- Candidate semantic concepts and local DomainSpec feature graphs.
- Namespaced statuses.
- Reported proof/analogy labels with explicit verification scope.
- Owner routes and challenge contracts.
- Split evidence/commitment confidence.
- Residue and forbidden-collapse fields.
- Navigation, annotations, and filtered learner projections.
- Inactive governance-transition previews, provided their conditions and lack of authority effect remain visible.

## Evidence Boundary

**[Observation]** This analysis used only the dispatched local corpus. It did not read linked canonical CAV2 definitions, authority-model files, DomainSpec relationship schemas, sibling `domainspec-theorem`, or external papers. Therefore:

- CAV2 governed-term semantics are reported only as referenced by the bounded ontology documents.
- Lean/AutoBayes results are “reported proven by `CRAFT-FORMAL-FOUNDATIONS.md`,” not independently verified here.
- The UX rule package is treated strictly as a non-authority witness; it says no browser observation or owner promotion exists (`cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/README.md`, lines 19–22, 62–86).
- Any claim requiring private sibling repositories is unverified here.

## Questions for Synthesis

1. Will the first release explicitly be a **read model**, with live ontology promotion deferred until hom-sets and endpoint typing close?
2. Should philosophical stages be exposed as separate claim cards, or should the universal stage remain hidden until a learner explicitly opens the interpretation layer?
3. Can synthesis obtain the governed DomainSpec relationship-signature schema next, so the witness’s endpoint gate is executable rather than documentary?
4. Who owns the combined cross-project read-model contract? It must not make CAV2 the DomainSpec decision owner; DomainSpec local candidates retain their owner route (`projects/domainspec-v2/ontology/README.md`, lines 7–25).
5. Should “reported-proven” claims be shown at all before the cited Lean artifacts are independently ingested and revision-pinned?

## Agent 2 — Craft philosophy and formal-operational model

# E2 — Craft philosophy and formal-operational model

## Key Findings

Craft is best represented as a governed philosophy of making with five distinct epistemic altitudes—not as a completed ontology of reality.

1. Its strongest current claim is operational: recursively turn intention into artifacts while keeping schema, translation, validation, residue, governance, and recomposition visible.
2. Its ledger is a concrete operational projection of this philosophy, validated only at MVP representation level.
3. Category theory, Bayesian composition, cybernetics, model theory, and weak emergence provide precise cousins or interpretive lenses. They do not validate LLM behavior or Craft as a whole.
4. “Building models reality” is defensible when it means that building uses representations to alter bounded material or sociotechnical conditions. “Reality itself is Craft” remains a research-horizon speculation.
5. A learner view must preserve six separate labels: source artifact, concept, authority state, proof status, interpretive tier, and learner projection. Flattening these would turn analogy into false proof.

Local citation keys:

- `ID` = `arcanum/development/craft/CRAFT-INITIAL-DEFINITION.md`
- `FF` = `arcanum/development/craft/CRAFT-FORMAL-FOUNDATIONS.md`
- `GL` = `arcanum/development/craft/CRAFT-GLOSSARY.md`
- `TS` = `arcanum/development/craft/CRAFT-LEDGER-TYPE-SYSTEM.md`
- `RL` = `arcanum/development/craft/CRAFT-RECURSIVE-LEDGER-DESIGN.md`
- `AR` = `arcanum/development/craft/CRAFT-ARCHITECTURE.md`
- `CA` = `arcanum/framework/CYBERALCHEMY-METHOD.md`

Evidence labels: **[VFR]** verified formal result; **[LAV]** local assertion awaiting independent verification; **[AN]** structural analogy; **[INT]** interpretation; **[SPEC]** speculation.

## Concept Genealogy

1. **CyberAlchemy baseline:** governed synthesis begins with intent, bounds context, discovers unknowns, creates and tensions an artifact, records trace, routes authority, and reflects after use (`CA:27-55`, `CA:57-95`). Its closure is contextual rather than final (`CA:81-94`).
2. **Craft reframing:** the same work becomes a schema/data translation cycle whose output is evaluated for residue and recomposed (`ID:8-19`). This is a candidate method primitive, not a universal theory (`ID:67-117`).
3. **Vocabulary stabilization:** Craft, schema, data, PCRA translation, residue, SCU, reflection tower, and recomposition remain candidate terms; only selected ledger-facing terms have MVP-validation status (`GL:9-38`, `GL:40-72`).
4. **Governance operationalization:** blockers, gates, enablers, lanes, role hints, closure conditions, and waivers convert “reflection” into inspectable responsibility state (`TS:41-61`, `TS:63-124`, `TS:196-244`).
5. **Recursive memory:** contexts contain child contexts while cross-branch relations preserve dependencies, evidence, and decisions. The ledger’s five row families are contexts, artifacts, relations, typed items, and decisions (`RL:28-38`, `RL:40-181`).
6. **Architecture integration:** Craft becomes a candidate orchestrating method with seven parts, while existing Arcanum capabilities retain execution authority (`AR:19-23`, `AR:61-87`, `AR:155-167`).
7. **Formal-foundations pass:** mathematical cousins are mapped without promotion and with an explicit analogy/proof boundary (`FF:8-19`, `FF:21-35`). The document’s sibling-repository Lean claims are not independently verified inside this assignment’s evidence boundary.

The operational lifecycle is:

```text
intention
  -> chosen schema
  -> PCRA translation under context/tools
  -> artifact/data
  -> validation under governance
  -> classified residue
  -> accept | repair locally | route | open a new layer
  -> recompose into parent context
  -> stop by bounded decision
```

This combines `ID:531-598`, `ID:264-373`, and `AR:103-125`.

## Claim Ladder

| Level | Claim | Current status |
|---|---|---|
| 1. Operational method | Craft makes agentic building more inspectable by requiring bounded units, artifacts, validation, residue, and recomposition. | **[LAV]** Candidate architecture; ledger representation has MVP support, but the architecture still requires an example suite before promotion (`AR:169-209`, `AR:244-264`). |
| 2. Formal correspondence | Particular schema/data migrations, Bayesian inversions, and losses have compositional categorical structures. | **[VFR]** Within their own mathematical domains: [Spivak](https://arxiv.org/abs/1009.1166), [Lawvere](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/lawvere.pdf), and [AutoBayes](https://arxiv.org/abs/2503.18608). |
| 3. Structural analogy | Craft’s schema–translator–artifact–residue cycle resembles those formal systems. | **[AN]** Useful correspondence, not an identification. Craft itself says PCRA is not a clean functor/kernel (`FF:21-35`, `FF:133-150`). |
| 4. Philosophy of making | Making can be interpreted as constrained movement from possible form through representation into manifested artifact, followed by reflective repair. | **[INT]** A coherent reading of the operational pattern (`ID:600-631`), not a consequence of category theory. |
| 5. Universal/reality horizon | Reality itself may be a recursive process of schema, manifestation, residue, and stabilization. | **[SPEC]** Explicit research horizon, not established fact (`ID:622-631`, `ID:660-672`). |

The ladder must be traversable upward, but no UI gesture should visually imply that Level 2 proves Levels 3–5.

## Formal Spine

### What the notation adds

`C = (I,S,F,E,D,R,G,V)` (`ID:531-548`) turns a prose workflow into a **coverage contract**. It forces a run to expose intention, representation, translator, uncertainty pressure, produced object, remainder, governing authority, and validation. It also reveals omissions: a run with an artifact but no `V`, `R`, or `G` is incomplete in Craft terms.

`V(S,D,G) -> R` (`ID:550-556`) makes three important commitments:

- validation compares an artifact against a selected schema;
- that comparison is governance-conditioned;
- its output is not simply “true/false” but an actionable remainder.

Structural `R_n -> I_{n+1}` (`ID:558-568`) explains reflection without mysticism: unresolved residue becomes the next layer’s problem statement. It gives recursion a typed handoff rather than treating reflection as commentary.

### What it does not prove

These expressions are currently **pseudoformal method notation**, not a mathematical theory. They provide no types for the tuple components, no axioms establishing that `V` is a function, no metric for `E` or `R`, and no theorem that the next intention improves fidelity. They do not prove convergence, termination, optimal SCU selection, or that LLM translation preserves categorical structure.

The current primary AutoBayes paper verifies a chain rule for exact inversions as Theorem 3.5 and generalized free energy as Theorem 4.7; the local document cites “Theorem 23” (`FF:65`, `FF:157`). That numbering or source-version discrepancy must be repaired before presentation as precise proof. More importantly, AutoBayes proves composition for defined probabilistic objects, not arbitrary artifact correctness. The broad statement at `FF:49` should therefore be presented as a Craft extrapolation, not a theorem.

The claimed Lean results—typed residue, independent schema/instance loss, reflection-tower colimit, persistent obstruction, and finite residue plateau (`FF:53-66`, `FF:79-125`)—are **[LAV]** here because their source files reside in the excluded sibling repository. They may be displayed as “locally reported formal result,” not “independently verified formal result.”

## Major Concepts

| Concept | Local definition/status and operational function | Formal/philosophical reading | Strength and honesty boundary |
|---|---|---|---|
| Intention | Desired possibility and input to definition; candidate primitive (`ID:272-300`, `ID:539-548`). | Direction for construction; not evidence of cosmic teleology. | **[LAV]/[INT]** Human intention is observable in runs; “attractor” outside intentional systems is analogy. |
| Schema/data | Chosen observer-conditioned representation and its produced/observed counterpart (`ID:134-142`; `GL:23-24`). | [Spivak](https://arxiv.org/abs/1009.1166) verifies schema-as-category and instance-as-functor for databases; [Lawvere](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/lawvere.pdf) verifies functorial semantics for algebraic theories. | **[VFR]** in those domains; **[AN]** for specs, plans, and LLM artifacts. |
| PCRA translator | Composite of human, LLM, harness, context, tools, vocabulary, and feedback; probabilistic/contextual/relational/attentive (`ID:144-165`). | A process lens on situated translation. | **[LAV]** No formalization establishes that PCRA is a kernel or functor. |
| Entropy | Practical uncertainty pressure before/during translation; residue is its observable post-translation trace (`ID:187-244`). | Information-loss or variety analogy. | **[AN]** Do not equate it without qualification to thermodynamic or Shannon entropy. |
| SCU/SWU | Smallest unit retaining meaning, responsibility, IO, validation, failure behavior, and recomposition (`ID:173-185`, `ID:246-248`). | Balance between fragmentation and relation overload. | **[LAV]** Candidate heuristic; no metric or optimality proof exists. |
| Artifact | Durable produced object owned by a context (`GL:44-52`). | Materialized local state, not reality in total. | **[LAV]** Ledger representation is MVP-validated, not metaphysically privileged. |
| Validation | Evidence comparison producing pass/flag/block and residue (`GL:35`; `ID:346-365`). | Model-to-instance adequacy test. [Suppes](https://web.stanford.edu/group/csli-suppes/techreports/IMSSS_33.pdf) distinguishes theory, model, and empirical data, showing why these cannot be collapsed. | **[LAV]/[INT]** Valid “enough for this layer,” not universal truth. |
| Residue | Meaningful mismatch, ambiguity, missing structure, scope pressure, or validation gap (`ID:167-171`, `ID:419-431`). | Difference made actionable; possible learning signal. | **[LAV]** Seven local types are not proven reducible to formal categorical/KL residue (`FF:152-157`). |
| Reflection tower | New schema/data layer created when residue cannot close locally (`ID:250-262`, `ID:433-463`). | Recursive inquiry and model revision. | **[LAV]/[INT]** Coherence and non-closure theorems are sibling-only claims in this boundary. |
| Recomposition | Reattach a lower unit to its parent without losing responsibility/evidence (`GL:34`; `AR:93-125`). | Whole/part integration; antidote to reductive decomposition. | **[LAV]** Must be evidenced per run; task completion alone does not establish it. |
| Governance | Constitutions constrain form; axioms constrain behavior; typed blockers/gates assign responsibility (`ID:465-492`; `TS:196-225`). | Cybernetic regulation of acceptable outcomes. [Ashby](https://ashby.info/Ashby-Introduction-to-Cybernetics.pdf) formally relates regulation to reduction of outcome variety, but does not prove Craft’s governance design. | **[AN]** Governance can also encode poor goals; regulation is not goodness. |
| Stopping | Stop at acceptable residue, lost meaning, human decision, other owner, stability evidence, or unfavorable value/cost (`ID:511-529`). | Responsible incompleteness rather than final closure. | **[LAV]/[INT]** Cost/value and “acceptable” remain domain-governed judgments. |

## Philosophy of Making

The learning application should teach three progressively stronger meanings of “building models reality”:

1. **Building through models:** builders select representations, act through them, and compare results against them. This is the operationally supported reading.
2. **Building transforms bounded reality:** artifacts alter codebases, institutions, practices, interfaces, and future choices. The model participates causally in changing a sociotechnical world, but remains partial and observer-conditioned.
3. **Reality as building:** all stable forms are closure points in recursive schema/data/residue dynamics. This is philosophically generative but **[SPEC]**.

[Suppes](https://web.stanford.edu/group/csli-suppes/techreports/IMSSS_33.pdf) is especially important pedagogically: a theory, a model satisfying it, and experimental data are different objects. Craft’s schema, artifact, and validation evidence should likewise remain distinct.

[Bedau’s weak emergence](https://people.reed.edu/~mab/publications/papers/weak-emergence.pdf) supports a bounded claim: some macrostates are derivable from underlying dynamics only through simulation. It licenses teaching “execution can reveal system-level behavior unavailable from component inspection.” It does not establish that Craft’s artifacts are emergent, that all making is simulation, or that a mathematical cousin predicts LLM behavior.

Connections:

- **CyberAlchemy Method—operational:** objective/artifact pair, discovery, structured tension, trace, lifecycle routing, and reflection (`CA:96-123`, `CA:234-270`).
- **CyberAlchemy Method—structural:** recursive return to earlier phases and contextual closure (`CA:45-55`, `CA:81-94`).
- **Craft addition—operational/structural:** explicit schema/data translation, SCU control, residue classification, reflection-tower escalation, and recomposition.
- **Recursive ledger—structural:** nested contexts plus cross-context relations (`RL:28-38`, `RL:93-120`).
- **Recursive ledger—operational:** blocker refinement, evidence, decisions, gates, next moves, and waivers (`RL:163-234`).
- **Ledger as “memory of becoming”—philosophical:** **[INT]**, useful but not a local formal claim.
- **Universal making/reality connection—philosophical/speculative only:** `ID:600-672`.

## Objections/Honesty Boundary

- **Instrumentalist objection:** Craft may be a good workflow without being an ontology. Answer: accept this as the Level-1 baseline; higher interpretations must earn predictive or explanatory value.
- **Category-error objection:** database functors and Bayesian lenses are not plans, prompts, or artifacts. Answer: present them as formal cousins with explicit domain assumptions.
- **Entropy objection:** Craft risks borrowing scientific prestige for ordinary ambiguity. Answer: call it “translation uncertainty pressure” unless a defined information measure is actually computed.
- **Teleology objection:** artifacts can embody intention; natural processes need not. Answer: never silently replace physical dynamics with purpose or “attractor.”
- **Regress objection:** every residue can generate another layer forever. Answer: Craft explicitly stops by objective, ownership, value/cost, and meaningful recomposition—not completeness (`ID:511-529`).
- **Governance objection:** validation can stabilize the wrong schema. Answer: retain source contracts, independent review, human gates, and authority provenance; a pass is always relative to `S` and `G`.
- **Constructionist objection:** models can shape social reality, but that does not mean all reality is modeled into existence. Answer: distinguish causal participation from ontological identity.

## Learner Traversal

1. Begin with: **“When something is built, what moves from possible to actual—and what gets lost?”**
2. Show the five-level claim ladder before introducing formal language.
3. Enter a hypothetical concrete run: intent “produce an API contract”; schema = approved requirements/interface model; translator = human+LLM+tools; artifact = contract; validation = schema/tests/review; residue = ambiguous error semantics.
4. Zoom into SCU: isolate one operation only if it retains inputs, outputs, failure behavior, validation, and parent recomposition.
5. Show the ledger snapshot: context, owned artifact, validation gate, typed residue/blocker, evidence, next move.
6. Branch visibly: repair locally, create a child context, request a human decision, or accept named residue.
7. Recompose: demonstrate exactly how the validated operation returns to the API parent.
8. Stop: record why further decomposition would cost more, lose meaning, or belong elsewhere.
9. Ascend again: operational lesson → structural analogy → philosophical interpretation → universal question. Require the learner to name the evidence transition at each ascent.

## Open Questions

1. Can SCU, entropy, residue reduction, and recomposition fitness gain computable measures without false precision?
2. What empirical example suite would justify promotion beyond candidate status?
3. Do the seven residue types map to schema/instance loss, or represent additional operational axes (`FF:152-157`)?
4. Which exact Lean commits substantiate the sibling-only proof claims?
5. Why does `FF` cite AutoBayes Theorem 23 when the current primary paper uses Theorems 3.5 and 4.7?
6. What cross-domain evidence would discriminate a useful philosophy of making from a universally reusable metaphor?
7. What objective function governs stopping when value and residue are incomparable?
8. CyberAlchemy v2 and DomainSpec v2 SPECs were outside this bounded evidence set. Their mappings to Craft must remain unverified until source-level crosswalks are supplied.

## Evidence Boundary

Read-only local evidence was restricted to the seven assigned files. No sibling repository theorem source was inspected; therefore every `domainspec-theorem` proof claim remains **[LAV]** despite `FF` describing it as machine-checked.

Primary external verification covered:

- [Spivak, Functorial Data Migration](https://arxiv.org/abs/1009.1166)
- [Lawvere, Functorial Semantics of Algebraic Theories](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/lawvere.pdf)
- [Smithe and Perin, AutoBayes](https://arxiv.org/abs/2503.18608)
- [Bedau, Weak Emergence](https://people.reed.edu/~mab/publications/papers/weak-emergence.pdf)
- [Suppes, A Comparison of the Meaning and Uses of Models](https://web.stanford.edu/group/csli-suppes/techreports/IMSSS_33.pdf)
- [Ashby, An Introduction to Cybernetics](https://ashby.info/Ashby-Introduction-to-Cybernetics.pdf)

These sources constrain classification; none proves Craft or LLM behavior.

## Questions for Synthesis

1. Will the final ontology keep authority state and proof status as independent dimensions?
2. Should the universal-physics thesis live in an explicitly isolated “research horizon” learner layer?
3. Which concrete, validated Craft run should anchor the downward-and-upward learner traversal?
4. Can the synthesis verify the sibling Lean sources and correct the AutoBayes theorem numbering before presenting a “formal foundations” path?
5. What explicit source bridges connect Craft to CyberAlchemy v2 and DomainSpec v2 without importing private claims into Arcanum’s public surface?

## Agent 3 — learning application and web graph system

# E3 — Learning application and web graph system

## Key Findings

1. **The website needs three non-collapsible graph layers.**

   - A **governed semantic projection** represents source-backed entities, claims, relations, authority state, proof state, and residue.
   - A **learner concept map** answers one focus question through curated, labeled propositions.
   - A **navigation graph** contains “learn next,” prerequisite, and journey edges that have no ontology or authority effect.

   Treating these as one graph would create authority by proximity—the exact failure CyberAlchemy v2 forbids. Its ontology package “models authority” but does not decide it, and projections are optional read models (`cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:7-19,70-88`). DomainSpec v2 likewise says local ontology candidates can aid navigation while having no authority effect (`projects/domainspec-v2/ontology/README.md:93-116`).

2. **A graph renderer is not automatically a concept-map learning experience.** A concept map answers a focus question using explicit linking phrases, propositions, hierarchy, and meaningful cross-links—not an unlabeled “hairball.” This follows the IHMC account of concept maps and focus questions ([Novak and Cañas](https://cmap.ihmc.us/publications/researchpapers/theorycmaps/TheoryUnderlyingConceptMaps.bck-11-01-06.htm), [IHMC concept-map theory](https://cmap.ihmc.us/docs/theory-of-concept-maps.php)). Empirical reviews find learning benefits but substantial heterogeneity by how maps are used, so the interface should not claim that visualization alone causes learning ([Nesbit and Adesope meta-analysis](https://doi.org/10.3102/00346543076003413)).

3. **Progressive disclosure is governance, not decoration.** CyberAlchemy requires navigable artifacts to expose entrypoint, current versus historical state, decided versus unresolved state, evidence, change, and next owner (`arcanum/framework/CYBERALCHEMY-METHOD.md:273-289`). W3C cognitive-accessibility guidance independently recommends clear hierarchy, short critical paths, search, chunking, and alternative representations ([W3C supplemental cognitive guidance](https://www.w3.org/WAI/WCAG2/supplemental/), [alternative content for complex information](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o7p02-alternative-content/)).

4. **Recommendation:** build the first witness with **React Flow 12 + precomputed ELK layered layouts**, paired with a first-class list/tree/table representation. React Flow currently has built-in keyboard/screen-reader support and SSR, while ELK supports labeled, compound, cross-hierarchy layered graphs. Canvas/WebGL options remain scale fallbacks, not the first accessibility baseline.

5. **Publication is separate from deployability.** The supplied repository boundary says only Arcanum is public. A technically deployable site containing DomainSpec, CyberAlchemy v2, or Saturn material is not thereby authorized for public release.

## Learner Journeys

### Personas and tasks

| Persona | Primary task | Needed protection |
|---|---|---|
| New contributor | Understand how vague intent becomes a governed artifact. | Avoid mistaking philosophical interpretation for proven method law. |
| Domain implementer | Read one DomainSpec feature SPEC as a typed concept-and-relation graph. | Avoid mistaking spec/validator evidence for runtime correctness. |
| Governance reviewer | Trace a concept to sources, challenges, owner route, and promotion status. | Avoid promotion or authority by visual proximity. |

### Journey 1: philosophical thesis to operational Craft

Focus question: **“How does intention become an artifact, and what happens when translation leaves residue?”**

1. Overview shows the proposition chain: intention → schema → translator → artifact → validation → residue → reflection/recomposition.
2. Learner opens **Translator** and sees PCRA as an operational candidate model, with the warning that perfect faithfulness/isomorphism is not assumed (`CRAFT-INITIAL-DEFINITION.md:85-100,144-166`).
3. Learner follows **Residue** to the reflection tower and sees the stop rule: climb only when local repair cannot close the mismatch (`CRAFT-INITIAL-DEFINITION.md:250-262,433-463`).
4. The claim view stages four distinct levels: operational, formal, philosophical, and universal-physics claim (`CRAFT-INITIAL-DEFINITION.md:600-631`).
5. A challenge asks: “What evidence would move this claim one stage?” The honesty boundary requires schema, artifact, residue, validation, and next route (`CRAFT-INITIAL-DEFINITION.md:660-672`).
6. Completion check asks the learner to reconstruct the cycle and identify which claims remain candidate.

### Journey 2: DomainSpec SPEC exploration

Focus question: **“How does a feature SPEC express a domain as typed concepts and relations?”**

1. Enter DomainSpec v2 through its implementation/research boundary; towers do not become canonical automatically (`projects/domainspec-v2/README.md:22-36,76-80`).
2. Open the Financial Settlement feature pack and inspect its concept registry: Entity, Value Object, Enum, Operation, Query, Calculation, Rule (`projects/domainspec-v2/impl/spec/features/financial-settlement/SPEC.md:17-28`).
3. Follow the labeled proposition `NoDuplicateMakeupRule —enforces→ GenerateSettlement`, then `GenerateSettlement —produces-for→ SettlementTransaction` (`SPEC.md:29-38`).
4. Open source evidence for the rule and operation (`SPEC.md:72-79,97-103`).
5. Switch to the challenge view: the SPEC and relationship validators can establish document/graph conditions, but not business-runtime conformance.
6. Compare semantic relations with learner-only “next” links; hiding learner links must not change the semantic relation table.

### Journey 3: governance review

Focus question: **“Why may this concept be shown without being authoritative?”**

1. Filter for `candidate`, `reviewed-candidate`, `deferred`, `blocked`, and `projected`.
2. Inspect source references, evidence/commitment confidence, challenge contract, forbidden collapse, and owner route (`cyberAlchemy-v2/ontology/NODE-MODEL.md:12-34,78-89`).
3. Open “Why linked?” for a relation and verify endpoints, direction, evidence, authority effect, and owner (`RELATION-MODEL.md:13-26,73-77`).
4. Follow promotion-request staging to the owner route; no UI control directly changes authority.

## Information Architecture

| View | Initial disclosure | On demand |
|---|---|---|
| Overview | Focus question, 5–9 clusters, staged claim ladder, legend, recommended entrypoint. | Package expansion, alternate journeys, unresolved clusters. |
| Concept | Plain definition, proposition sentence, type, local/canonical scope. | Incoming/outgoing relations, prerequisites, examples, forbidden collapses. |
| Evidence/provenance | Evidence count and strongest source anchor. | Path, heading/line, revision, evidence role, extraction trace, conflicting sources. |
| Formal/claim status | `operational`, `formal`, `analogy`, `philosophical`, or `universal-horizon`; proof status. | Assumptions, validation method, counterevidence, promotion requirements. |
| Artifact/source | Artifact kind, owner, status, source posture. | Source excerpt, concepts derived from it, historical revisions, downstream projections. |
| Challenge/residue | Open-question count and pass/flag/block state. | Contradictions, validation edges, challenge contract, residue type/route, owner decision. |

Each view preserves the same deep-linkable selection:

`/map/{snapshot}/{focus-question}?view=claim&entity={stable-id}&depth=1`

Disclosures should use actual buttons with `aria-expanded`, following the [WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

## Visual/Interaction Grammar

| Meaning | Shape/text treatment | Edge treatment |
|---|---|---|
| Source artifact | Rectangle with file-tab corner; explicit `SOURCE` header. | Solid thin line labeled `extracted from`, `cites`, or `owns`. |
| Concept | Rounded rectangle; explicit `CONCEPT` header. | Solid labeled proposition. |
| Formal correspondence | Hexagonal claim card labeled `FORMAL MODEL`; proof-status badge. | Double line labeled `modeled as`; never an unlabeled equality symbol. |
| Analogy | Slanted-side card labeled `ANALOGY`. | Long-dash line labeled `analogous to`; authority effect `none`. |
| Philosophical thesis | Bracketed card labeled `PHILOSOPHICAL THESIS`, plus stage number. | Dot-dash line with full linking phrase. |
| Authority state | Text badge such as `CANDIDATE`, `PROJECTED`, `BLOCKED`, owner-route line, and patterned border. | Authority-effect text appears in edge detail. |
| Residue/challenge | Notched card labeled `RESIDUE` or `CHALLENGE`; hatch pattern. | Labeled `contradicts`, `validates`, `flags`, or `routes to`. |
| Learner-only edge | Compass icon and `LEARN NEXT` label. | Dotted line; stored outside semantic relations and removable as a layer. |

Color may reinforce these distinctions but cannot carry them alone; WCAG requires shape or text in addition to color ([WCAG use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)). Every edge should expose a “Why is this linked?” action.

Core interactions: select, expand one hop, collapse, follow source, switch lens, compare claims, search, copy deep link, and return through breadcrumbs. Dragging is optional presentation, never required operation.

## Accessibility

- **Keyboard:** skip links to search, journey, graph, and equivalent table. Within the spatial region: arrows move by semantic neighbor, Enter opens detail, Space expands, Escape returns, Home returns to journey root, and `?` opens help. Avoid forcing users to Tab through hundreds of edges.
- **Screen reader:** announce label, object kind, authority state, proof status, relation counts, and current focus question—not coordinates. Expose relations in a native table with source, predicate, target, claim class, status, and evidence.
- **Equivalent non-spatial mode:** an authored hierarchy/tree supplies sequence; a relation table preserves cross-links that a tree cannot. Search results and challenge lists use ordinary headings, links, lists, and tables. It consumes the same projection/filter state as the graph.
- **Reduced motion:** precompute coordinates, disable force animation, honor `prefers-reduced-motion`, and provide a persistent “no motion” setting. W3C recommends eliminating unnecessary interaction animation ([WCAG animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions), [CSS media query](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion)).
- **Touch/pointer:** visible zoom and pan controls, “expand” buttons, and direct selection alternatives to pinch/drag. Use 44×44 CSS-pixel targets as the product target; WCAG 2.2 AA’s floor is 24×24 with defined exceptions ([target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)). All dragging functionality needs a click/tap alternative ([dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)).
- Do not apply ARIA `tree` to a general graph. Use it only for the actual hierarchy and implement the [WAI treeview keyboard contract](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

## Data/API Boundary

```text
governed files + owner records
  -> read-only extractor
  -> validation and unresolved-reference report
  -> immutable projection snapshot
  -> query API
  -> graph, list/tree/table, source, claim, and challenge views
```

Recommended contract:

```text
ProjectionSnapshot
  schemaVersion, projectionId, generatedAt, sourceRevision, contentHash
  focusQuestions[], sources[], entities[], claims[], relations[], journeys[], layouts[]

Entity
  id, label, objectKind, summary, aliases[]
  sourceRefs[{sourceId, path, heading, lineStart, lineEnd, revision, role}]
  authority{scope, state, ownerRoute, effect}
  challengeRef, learner{level, prerequisites[], tags[]}

Claim
  id, subjectIds[], claimClass
  proofStatus, assumptions[], evidenceRefs[], counterEvidenceRefs[]
  authorityEffect, ownerRoute, residueRefs[]

Relation
  id, sourceId, predicate, targetId, direction
  semanticClass, claimId, evidenceRefs[], authorityEffect

JourneyEdge
  id, sourceId, targetId, reason, focusQuestion
  semantic:false
```

Read-only endpoints:

- `GET /v1/snapshots/{id}`
- `GET /v1/entities/{id}`
- `GET /v1/entities/{id}/neighborhood?depth=1&facets=...`
- `GET /v1/claims/{id}`
- `GET /v1/search?q=...`
- `GET /v1/journeys/{id}`
- `GET /v1/sources/{id}/anchors/{anchor}`

Use immutable IDs, ETags/content hashes, explicit schema versioning, and no authority-mutation endpoint. Learner progress, bookmarks, and layout preferences belong in a separate user-state store keyed by projection ID.

JSON-LD 1.1 is a suitable optional interchange envelope, not a reason to recast candidate concepts as canonical RDF semantics ([W3C JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)).

## Technology Matrix

Registry versions checked 2026-07-14: React Flow 12.11.2, Cytoscape.js 3.34.0, Sigma 3.0.3, D3 7.9.0, ELK.js 0.11.1. Pin exact versions; Sigma v4 is currently alpha.

| Approach | Accessibility | Layout/control and scale | SSR/build | Maintenance and provenance |
|---|---|---|---|---|
| **React Flow + ELK.js — recommended witness** | Built-in keyboard, focus, ARIA text/live support; still requires equivalent table. | Rich DOM nodes; ELK supports layered, labeled, compound/cross-hierarchy graphs. Keep visible subgraph bounded. | React Flow 12 supports SSR/SSG when dimensions/handles are supplied. | Active project; custom source links and status badges are straightforward. [Accessibility](https://reactflow.dev/learn/advanced-use/accessibility), [SSR](https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration), [performance](https://reactflow.dev/learn/advanced-use/performance), [ELK Layered](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html). |
| **Cytoscape.js** | Canvas has weak intrinsic semantics; parallel DOM representation is mandatory. | Strong graph API, layouts/extensions, headless layout; medium/high scale with style tuning. | Headless Node processing works; visual canvas is client-side. | Mature and flexible, but deep links/ARIA semantics are application work. [Official docs](https://js.cytoscape.org/). |
| **Sigma 3 + Graphology** | WebGL/canvas layers do not provide equivalent document semantics; parallel DOM is mandatory. | Best candidate for thousands of visible nodes; layout coordinates are external. | Precompute data/layout and SSR the shell; meaningful graph rendering is client-side. | Use stable v3; v4 is alpha. Provenance UI is manual. [Official docs](https://www.sigmajs.org/docs/), [renderers](https://www.sigmajs.org/docs/advanced/renderers/). |
| **Custom D3 + SVG + ELK/offline force** | Highest semantic potential through authored SVG/DOM, but all keyboard/ARIA behavior is custom. | Maximum control; good for small/medium curated maps, not dense all-corpus views. | Strong if coordinates are precomputed; otherwise simulation is client-side. | Highest implementation/maintenance cost; excellent deterministic linking. [d3-force](https://d3js.org/d3-force). |

### Data/query/storage options

| Option | Fit | Decision |
|---|---|---|
| Immutable JSON/JSON-LD + generated search index | Static deployment, reproducible snapshots, first witness. | **Recommended first.** |
| SQLite + FTS5 + normalized entity/relation tables | Local/single-service deployment with full-text search and bounded recursive queries. | Next step if static indices become limiting. [SQLite JSON](https://www.sqlite.org/json1.html), [FTS5](https://www.sqlite.org/fts5.html). |
| PostgreSQL 18 + relational edges + `jsonb` facets | Multi-user service, indexed facets, recursive traversal, audit/user state. | Use when server-side collaboration/query load is real. [JSONB](https://www.postgresql.org/docs/current/datatype-json.html), [recursive queries](https://www.postgresql.org/docs/current/queries-with.html). |
| RDF store + SPARQL 1.1 | Standards-based semantic exchange/federation after relation law stabilizes. | Defer; premature RDF modeling could cosmetically harden candidate semantics. [SPARQL 1.1](https://www.w3.org/TR/sparql11-query/). |

## Performance

These are initial engineering guardrails, not claimed library limits:

- Up to **250 visible nodes / 500 visible edges**: DOM graph allowed.
- Above that: default to package/focus-question clusters and lazy one-hop expansion; keep the active induced subgraph under the DOM budget.
- Above **1,500 total projected nodes** or highly dense relations: compute overview clusters offline; evaluate Sigma only for the spatial overview while retaining the same DOM table/detail views.
- Sort inputs by stable ID; use fixed ELK seed/options; store coordinates in the snapshot. Do not rerun force layout on every visit.
- Search indexes label, alias, definition, path, source heading, authority state, claim class, and owner route.
- Load overview, focused neighborhood, and detail independently. Prefetch only the next guided step.
- Snapshot identity is the hash of source revision + extractor version + projection schema + layout options.
- Deep links include snapshot, focus question, entity, view, filters, and depth; old snapshots remain addressable or return an explicit supersession record.

## Witness/Acceptance Criteria

### Smallest DomainSpec-plus-Craft interaction witness

Use the Financial Settlement SPEC as the schema source and the Craft cycle as the interpretive lens:

- learner starts at `GenerateSettlement`;
- traverses `NoDuplicateMakeupRule —enforces→ GenerateSettlement —produces-for→ SettlementTransaction`;
- opens each source anchor;
- switches to Craft view showing `schema`, `artifact/evidence`, `validation`, `residue`, and `recomposition` fields;
- absent runtime or validation evidence remains visibly `unknown`, never inferred.

Acceptance criteria:

1. Every visible node states object kind, authority scope/state, proof/claim status, and source count.
2. Every semantic edge has named endpoints, direction, linking phrase, evidence, and authority effect.
3. Learner-only edges can be disabled and never appear in semantic exports.
4. Source anchors and deep links survive reload and browser history.
5. Keyboard-only and touch-only users can complete both journeys without dragging.
6. Screen-reader users receive the same entities, relations, claim statuses, sources, challenges, and next actions through list/tree/table views.
7. Reduced-motion mode produces no animated relayout.
8. Rebuilding from identical inputs yields byte-stable semantic output and stable coordinates.
9. Automated checks reject missing endpoints, missing source refs, unknown statuses, and semantic relations without evidence/claim classification.
10. The witness labels the DomainSpec ontology surface candidate/local and never lets CAV2 become DomainSpec’s decision owner (`projects/domainspec-v2/ontology/README.md:7-15,27-43`).

Browser evidence can prove that a particular build rendered, linked, focused, expanded, announced, and navigated as observed in tested browser/AT combinations. It cannot prove:

- source interpretation or ontology completeness;
- canonical authority or promotion;
- philosophical/universal truth;
- business-runtime correctness;
- correctness across every browser/assistive-technology combination;
- learner comprehension, trust, preference, retention, or success;
- complete accessibility conformance.

The local UX witness explicitly keeps comprehension, trust, preference, and complete-accessibility claims in residue and currently has no real browser evidence (`cyberAlchemy-v2/development/examples/ux-rule-governed-artifact-tree/README.md:62-86`; `tree.json:65-76,190-194`).

## Open Questions

1. Who owns the learning projection schema and publication verdict?
2. Which focus questions are canonical enough to ship, and which remain learner-authored?
3. What precisely distinguishes “formal correspondence” from analogy in governed vocabulary?
4. Should source anchors use revision + heading + line span, since line-only anchors drift?
5. What corpus size and edge-density distribution should set measured renderer thresholds?
6. Is learner progress local-only, account-backed, or exportable?
7. Craft’s initial definition calls SWU “Single Work Unit” (`CRAFT-INITIAL-DEFINITION.md:246-249`), while the glossary calls it “Smallest Working Unit” (`CRAFT-GLOSSARY.md:29-34`). This must be resolved or explicitly shown as vocabulary conflict before learner publication.
8. Is the first witness strictly read-only? Authoring/challenge submission would require a separate governed write path.

## Evidence Boundary

- **Local evidence:** only the dispatch-bounded files were read. The UX tree is treated as example-only, not authority; its own status says authority effect `none` (`ux-rule-governed-artifact-tree/README.md:1-22`).
- **External evidence:** concept-map structure comes from IHMC; accessibility from W3C/WAI; interchange from W3C; library claims from official project documentation.
- **Inference:** personas, journeys, graph thresholds, data contract, API endpoints, and renderer choice are design inferences from those constraints.
- **Recommendation:** React Flow + ELK + immutable JSON/JSON-LD projection is the smallest responsible witness, not a final platform verdict.
- **Non-claim:** neither a rendered ontology nor successful browser tests establish formal truth, promotion, runtime correctness, or learning efficacy.

## Questions for Synthesis

1. Will the integrated architecture preserve semantic, learner, and navigation graphs as separate projections?
2. Will the synthesis adopt “projection snapshot is read-only and authority-neutral” as a hard renderer boundary?
3. Does the first witness optimize for a curated 50–150-node learning surface, or must it immediately support the full corpus?
4. Who resolves the SWU naming conflict and formal-versus-analogy vocabulary before learner-facing labels freeze?
5. Is the intended deployment private, or must the public site be reduced to Arcanum-safe material only?

## Connections

| Target | Relation | Description |
|---|---|---|
| [findings.md](./findings.md) | `derives` | The findings file derives its synthesis from the three verbatim explorer returns in this research artifact. |
