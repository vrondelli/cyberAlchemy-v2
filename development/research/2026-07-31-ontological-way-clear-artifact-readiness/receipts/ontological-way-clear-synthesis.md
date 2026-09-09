# Ontological Way Clear synthesis candidate

## 1. Action receipt

```yaml
schema_version: ontological-way-clear.synthesis-receipt.v0.1
action_id: spawn-0004
dispatch_id: 2026-07-31-ontological-way-clear-artifact-readiness-route
run_id: ontological-way-clear-20260731T153840
wave: synthesizer
step: s2
identity: Noether, Emmy
role: ontological-way-clear-synthesizer
capability: research
mode: synthesize
status: completed-read-only
source_set:
  - dispatch-sheet.json
  - receipts/explorer-formal-ontology.json
  - receipts/explorer-lifecycle-acceptance.json
  - receipts/explorer-architecture-design-ux.json
  - research.md#agent-1--formal-ontology-and-closure-semantics
  - research.md#agent-2--lifecycle-and-acceptance-semantics
  - research.md#agent-3--architecture-design-and-ux-evidence
mutations: none
delegation: none
new_external_evidence: none
proof_ceiling: exact-bound candidate synthesis from three admitted explorer returns
join_close_status: parent-owned
```

Status: `pass-with-typed-residue`. The candidate is complete enough for skeptic review, but no fixture was executed and no vocabulary, profile, evaluator split, or owner policy has been approved.

## 2. Bottom line and candidate name

The idea survives only as **Evidence-Bound Closure Query (`EBCQ`)**, with `Ontological Way Clear` retained, if desired, as a compatibility label for its overall receipt verdict.

It does not survive as:

- a canonical `Artifact` primitive;
- one universal meaning of “clear”;
- an artifact-wide Boolean;
- a checklist whose checked state confers readiness;
- an authority, promotion, completion, release, or production gate.

`EBCQ` is a pure, bounded query over an exact artifact selector, versioned `ClosureProfile`, finite semantic scope, evidence baseline, evaluator, and named transition. It returns a reason-complete `WayClearReceipt` with `authorityEffect: none`.

The shared ontology is deliberately thin. Meaning remains in seven artifact-kind profiles. This reconciles the formal explorer’s query-and-receipt model, the lifecycle explorer’s seven-component vector, and the architecture/design/UX explorer’s human-evidence ceiling. [A1 §2–§6](research.md#agent-1--formal-ontology-and-closure-semantics), [A2 §2, §8](research.md#agent-2--lifecycle-and-acceptance-semantics), [A3 §2, §4–§6](research.md#agent-3--architecture-design-and-ux-evidence).

The canonical base term `Artifact` remains deferred. The query may use `EvaluatedResource` as an implementation-local carrier label, but that label must not be promoted as a CAV2 or Arcanum ontology primitive.

## 3. Agreements and preserved disagreements

| Question | Reconciled agreement | Preserved disagreement or limit |
|---|---|---|
| Universal closure | All explorers reject a universal completion checklist. Closure is profile-, scope-, baseline-, and transition-bound. | No owner has accepted the term, carrier, seven profiles, or evaluator composition. [A1 §2, §8](research.md#agent-1--formal-ontology-and-closure-semantics); [A2 §2, §9](research.md#agent-2--lifecycle-and-acceptance-semantics); [A3 §2, §9](research.md#agent-3--architecture-design-and-ux-evidence). |
| Shared artifact abstraction | Immutable identity/version/digest, typed statements, obligations, evidence, owners, scopes, dependencies, and receipts can be shared. | Prior research rejected “governed artifact” as a canonical primitive; `Artifact` remains unresolved. The substrate is query-local only. [A1 §3, governed-artifact row; §4; §8](research.md#agent-1--formal-ontology-and-closure-semantics). |
| Kind versus role | `ArtifactKind` selects the owner-governed semantic profile for an exact selector. `ArtifactRole` records how that selector participates in a query or relation. | One file may contain multiple selector-bound roles only when explicitly declared. Architecture-like views inside a Design file do not silently change its declared kind; filename, grouping, color, route, or icon never establishes kind. [A1 §4, `ArtifactRole`](research.md#agent-1--formal-ontology-and-closure-semantics); [A3 §2, §8](research.md#agent-3--architecture-design-and-ux-evidence). |
| “Clear” | Artifact coherence and transition admission must both be reported and must remain distinct. | Lifecycle evidence requires a larger component vector. The synthesis therefore reports seven components, not merely the formal explorer’s two. [A1 §2, §5](research.md#agent-1--formal-ontology-and-closure-semantics); [A2 §2](research.md#agent-2--lifecycle-and-acceptance-semantics). |
| Unknown as blocker | Missing critical knowledge must deny the named transition. | Its epistemic result remains `INDETERMINATE`, not `BLOCKED`. `mayProceed: false` is a policy consequence; it does not turn unknown into a proven violation. This preserves A1’s algebra while satisfying A2’s fail-closed admission rule. [A1 §5](research.md#agent-1--formal-ontology-and-closure-semantics); [A2 §2](research.md#agent-2--lifecycle-and-acceptance-semantics). |
| Open world | Missing RDF facts do not normally establish failure. | Absence may become a violation only under an exact, current local `CompletenessDeclaration`. No global closed-world assertion survives. [A1 §3, RDF/OWL/SHACL/completeness rows; §5–§6](research.md#agent-1--formal-ontology-and-closure-semantics); [A2 §8](research.md#agent-2--lifecycle-and-acceptance-semantics). |
| Human evidence | Machines can verify that the required scoped review/study/decision receipt exists and is current. | They cannot manufacture concern completeness, trade-off acceptability, comprehension, usability, preference, risk acceptance, or generalizability. [A2 §4–§5](research.md#agent-2--lifecycle-and-acceptance-semantics); [A3 §2, §4, §6](research.md#agent-3--architecture-design-and-ux-evidence). |
| Evidence ordering | Evidence must be typed and profile-compatible. | No universal evidence-class ranking exists. Compatibility, independence, multiplicity, alternatives, and expiry remain profile-local. [A2 §4, §8](research.md#agent-2--lifecycle-and-acceptance-semantics); [A3 §6](research.md#agent-3--architecture-design-and-ux-evidence). |
| Architecture/design/UX | Structure, links, declared coverage, executable rules, pinned behavior, and receipt presence are machine-closeable. | Adequacy and human outcomes remain owner- or study-bound. ISO clause-level obligations remain unverified where licensed text was inaccessible. [A3 §3–§4, §9](research.md#agent-3--architecture-design-and-ux-evidence). |
| Lifecycle movement | A query may compute or validate a projection for a named transition. | It cannot approve, execute, promote, publish, deploy, or release anything. [A1 §6 invariants 15–16](research.md#agent-1--formal-ontology-and-closure-semantics); [A2 §5](research.md#agent-2--lifecycle-and-acceptance-semantics). |

## 4. Candidate ontology and ownership

| Candidate | Candidate semantics | Owner/proof status | Disposition |
|---|---|---|---|
| `Artifact` | Proposed common superclass for all governed objects. | No selected owner; prior local research rejected “governed artifact” as a primitive and left the base term unresolved. | **Deferred** as ontology; **killed** as a prerequisite for EBCQ. |
| `EvaluatedResource` | Query-local neutral carrier for an exact document, dataset, selector, or other versioned input. Carries no authority by type. | EBCQ evaluator owner, presently unselected. Proposed synthesis only. | **Proposed** replacement for runtime use. |
| `ArtifactVersion` | Immutable resource identity, selector, semantic version or revision, canonical digest, media type, supersession/currentness links. | Builds from local digest-bound receipts plus PROV/RDFC/JCS precedents. | **Build-from-owned**. |
| `ArtifactKind` | Owner-declared semantic family selecting one of the seven profile families. Not inferred from layout or filename. | Kind/profile owner; no common canonical registry exists. | **Proposed**. |
| `ArtifactRole` | Query- or relation-specific participation of an exact selector. Independent from physical-file identity and `StatementKind`. | Profile owner; explicit binding required. | **Proposed**. |
| `StatementKind` | Meaning assignment, normative obligation, criterion predicate, completion clause, concern, decision, rationale, research question, claim, and similar typed propositions. | Artifact-kind owner. Local ontology requires typed objects/relations but not this registry. | **Build-from-owned**, registry **proposed**. |
| `Obligation` | Profile-evaluable condition with subject, scope, clause ID, criticality, evaluator, accepted evidence classes, and disposition law. | Profile owner. | **Proposed**. |
| `Decision` | Baseline-specific owner judgment with decision scope, authority basis, expiry/revisit condition, and challenge route. | Existing narrow decision/authority owner. | **Build-from-owned**. |
| `Claim` | Proposition whose support and refutation are independently recordable. | Assurance/evidence model owner unselected; SACM supplies precedent. | **Build-from-owned**. |
| `Evidence` | Immutable support, challenge, review, test, study, waiver, or decision record bound to method, inputs, scope, provenance, and time. | Existing producing owner; evaluation does not take ownership. | **Build-from-owned**. |
| `EvidenceClass` | Compatibility type, not ordinal strength: provenance, structural, semantic/expert, trace, executable, screenshot, human study, standards conformance, waiver/risk, or owner decision. | Profile owner selects allowed classes. | **Proposed** taxonomy built from A2/A3. |
| `Owner` | Accountable actor or governed role for meaning, evidence, approval, execution, promotion, or release. | Existing local Authority model. | **Build-from-owned**. |
| `AuthorityEffect` | Explicit effect of an owner decision. Every EBCQ receipt fixes this to `none`. | Existing authority owner. | **Build-from-owned**; receipt-carried non-`none` effect **killed**. |
| `LifecycleState` | External workflow/maturity/promotion/release state bound to an authoritative record. | Existing owner, but local lifecycle schema and edge law remain deferred. | **Build-from-owned**, executable validation **deferred**. |
| `ScopeDeclaration` | Exact roots/selectors, graphs/datasets, allowed relations and directions, as-of time, semantic bounds, boundary policy, and exclusions. | Query/profile owner. | **Proposed**. |
| `CompletenessDeclaration` | Issuer-bound declaration that an exact graph/query pattern is complete under named time, evidence, and invalidation conditions. | Issuer/authority policy unselected. Formal precedent observed. | **Proposed**, policy **deferred**. |
| `Dependency` | Directed applicability relation whose traversal direction and cycle law are profile-local. | Source artifact owner authors; profile owner interprets. | **Proposed**. |
| `Refines` | Adds precision while preserving intended scope; never implies satisfaction. | Source/target meaning owners. | **Build-from-owned**. |
| `Satisfies` | Reified `SatisfactionClaim` binding subject, obligation, method, evidence, profile, and baseline. A bare truth-valued edge is forbidden. | Verification/evidence owner. | Reified form **proposed**; bare edge **killed**. |
| `Covers` | Declares that scope is addressed. Does not imply adequacy, satisfaction, or completion. | Artifact owner. | **Proposed**. |
| `ConflictsWith` | Symmetric, irreflexive, non-transitive challenge relation, filtered for scope/currentness/resolution. | Claim/artifact owners plus resolution owner. | **Build-from-owned**. |
| `BlockedBy` | Derived relation in a receipt from a failed or indeterminate critical dependency. Never authored authority. | EBCQ evaluator. | **Proposed**. |
| `VerifiedBy` | Evidence supports an exact assertion under a named method and baseline; does not imply truth, approval, or release. | Verification owner. | **Build-from-owned**. |
| `InvalidatedBy` | Records source, context, owner, evidence, evaluator, profile, or baseline drift that removes current admissibility without rewriting history. | Existing provenance/currentness owner. | **Build-from-owned**. |
| `ClosureProfile` | Immutable contract for one `ArtifactKind`, query purpose or transition, clause set, evidence policy, criticality, scope law, owners, and invalidation rules. | Seven narrow profile owners. | **Proposed**; universal profile **killed**. |
| `ClosureQuery` | Pure bounded invocation binding exact root, baseline, scope, profile, evaluator, evidence, owners, time, and resource limits. | EBCQ evaluator owner. | **Proposed**. |
| `ReasonCode` | Stable typed failure/uncertainty/error classification attached to component, clause, subject, evidence, and repair owner. | Profile plus evaluator owners. | **Proposed**. |
| `WayClearReceipt` | Append-only deterministic result containing all bindings, component verdicts, obligation results, complete reasons, traversal manifest, currentness, and `authorityEffect: none`. | EBCQ evaluator emits; source owners retain meaning. | **Build-from-owned** receipt shape, EBCQ schema **proposed**. |

Killed collapses are: `ArtifactKind == StatementKind`, `Refines == Satisfies`, `Covers == Satisfies`, evidence == approval, PROV attribution == authority, DoD satisfaction == release, transition admission == execution, and a clear receipt == lifecycle movement.

## 5. Seven concrete `ClosureProfile` candidates

Each profile below is a distinct immutable profile instance for one named purpose. Different transition purposes require a different profile version or profile ID.

| Profile and purpose | Required obligations | Evidence and owner boundary | Result ceiling |
|---|---|---|---|
| `DefinitionUsabilityProfile/v0` — candidate definition usable by named consumers | Stable ID/term/status; normative meaning; noncontradictory plain/domain voices where required; notation semantics; scope; boundaries and non-equivalences; provenance; consumers; index/drift/challenge route; grounded, noncircular definition graph. | Structural/index checks plus semantic review. Definitions Governance is required only for a separate `candidate -> canonical` profile. | Candidate definition is coherent and usable for the named scope; not canonical. |
| `CriterionExecutabilityProfile/v0` — criterion ready to evaluate | Subject, scope, observable or judgment question, predicate, method, threshold/interpretation, verdict domain, evidence class, baseline/time, criticality, owner, alternative method, and explicit N/A rule. | Deterministic criteria require pinned evaluation evidence. Human criteria require a named reviewer/study; the evaluator only validates its receipt. | Criterion is decidable/executable for the exact subject; no result about the subject unless separately evaluated. |
| `RequirementAcceptanceProfile/v0` — requirement artifact ready for owner acceptance | Unique identity; scoped normative statement; source/rationale; feasibility posture; verification method; validation intent; typed forward/backward traces; dependencies/conflicts; version; change owner. | Artifact review and trace evidence. Implementation satisfaction is outside this pre-implementation profile. Requirement owner approval is an input to transition admission. | Requirement artifact accepted for its baseline; not proof of system satisfaction or release. |
| `DefinitionOfDoneSatisfactionProfile/v0` — bounded increment satisfies current DoD | Exact increment/product applicability; current DoD version; explicit nonrecursive quality measures; organizational minimum where applicable; shared multi-team form; compatible terminal evidence per measure; anomaly/waiver disposition; accountable owner. | Tests, analysis, inspection, demonstration, review, or allowed waiver must terminate outside the DoD assertion cycle. Meeting DoD creates a Done Increment in the Scrum-scoped meaning. | Done Increment for the exact DoD and evidence baseline; not release approval. |
| `ArchitectureAdmissionProfile/v0` — architecture description ready for the named review/admission | Entity/environment/scope/version/owner/state; stakeholders and declared material concerns; concern-to-viewpoint/view coverage; viewpoint conventions/model kinds; correspondence rules; dependencies/constraints/conflicts; decisions, alternatives, rationale, risks, requirement traces; typed unresolved tensions and residue. | Machines close identity, referential integrity, declared coverage, executable correspondence rules, digests, and freshness. Owners judge materiality, viewpoint suitability, rationale, exceptions, and residual risk. | Architecture description internally closed and accepted for the transition; not “architecture is correct” and not entity conformance. |
| `DesignSelectionProfile/v0` — design reasoning package ready for selection | Bounded design question; intent/consumers/constraints; alternatives or justified constrained choice; selection criteria and evidence; chosen/rejected/deferred rationale; requirement/architecture/interface/risk traces; prototype fidelity/version/digest; invariants; visual-review obligations; open decisions; owner scope. | Machines close graph integrity, trace coverage, deterministic behavior, and pinned artifacts. Design/Decision Gate owners judge trade-offs, rationale, visual quality, and risk. | Design selected for a named next transition; not implementation completion or usability truth. |
| `UXPlanRunAdmissionProfile/v0` — prospective UX plan approved and executable | Populations, context, tasks, inclusion/exclusion and accessibility characteristics; research questions/hypotheses linked to claims/risks; pinned prototype/scenario; method, recruitment/sample rationale, assistive technology, language/environment, ethics/privacy/data handling; measures and interpretation; WCAG target/scope/technology assumptions; automated/manual/user split; human-evidence ceiling; owners; rerun/invalidation policy. | Machines close plan schema, trace links, instrumentation, identities, and receipt presence. UX/research owners approve the plan. Human study findings are future evidence and must not be required for this prospective profile. | Plan is executable and evidence-bounded; not usability, comprehension, preference, accessibility-in-use, or generalizability truth. |

Profile-local fields include exact obligations, criticality, allowed evidence classes and substitutes, expiry, owner sequence, waiver law, risk tolerance, scope/closure boundary, transition names, and human-study requirements. There is no universal evidence rank or universal “all residue blocks” rule.

## 6. Cross-artifact dependency DAG and relation law

Candidate seven-family DAG:

```text
Definition
   │ defines terms used by
   ▼
Requirement ───────► Criterion
   │                   │ operationalizes / verifies
   │ addressed by      │
   ▼                   │
Architecture           │
   │ constrained/refined by
   ▼                   │
Design ────────────────┼────────► DefinitionOfDone
   │ evaluated by      │           covers exact measures;
   ▼                   │           must terminate in external evidence
UXPlan ────────────────┘
```

This is a dependency ordering, not an implication chain. A valid positive fixture also has terminal evidence and decision nodes outside the seven artifact families.

Relation rules:

- `Definition definesTerm Requirement|Criterion|Architecture|Design|UXPlan|DoD`.
- `Criterion operationalizes Requirement` and may support a reified `SatisfactionClaim`; it does not rewrite the requirement.
- `Architecture addresses Requirement|Concern`.
- `Design constrainedBy Requirement|ArchitectureDecision`; `Design refines ArchitectureElement`.
- `UXPlan evaluates Design|Prototype` and `ResearchQuestion operationalizedBy Measure`.
- `DefinitionOfDone covers Criterion|Requirement|DesignDisposition|EvidenceObligation`, but coverage does not establish completion.
- `Dependency` traversal direction is profile-declared. Reverse traceability may be queried without turning the dependency graph into a semantic cycle.
- `ConflictsWith` never composes transitively.
- `BlockedBy` is derived from an applicable, current, critical dependency result.
- A cycle in authored support closes nothing unless at least one allowed, independent terminal evidence node exits the cycle.
- Out-of-scope edges must be expressly ignored, summarized, or returned as residue. Silent denominator removal is forbidden.

## 7. Query, component, and receipt contract

### `ClosureQuery`

```yaml
query_id: stable identifier
purpose:
  profile_id: exact profile identity
  transition: {from, to}        # required for transition admission
root:
  resource_id:
  selector:
  artifact_kind:
  artifact_role:
  version:
  digest:
baseline:
  dataset_id:
  dataset_digest:
  dependency_versions: []
profile:
  version:
  digest:
  clause_set_digest:
evaluator:
  id:
  version:
  digest:
scope:
  declaration_id:
  declaration_digest:
  roots: []
  graphs_or_datasets: []
  allowed_relations: []
  traversal_directions: {}
  maximum_semantic_depth:
  maximum_nodes:
  as_of:
  boundary_policy:
completeness_declarations:
  - id:
    digest:
evidence_baseline:
  evidence_ids_and_digests: []
  allowed_classes_by_clause: {}
owner_policy:
  required_owner_roles: []
  approval_bindings: []
canonicalization:
  carrier:
  algorithm:
  algorithm_version:
hash:
  algorithm:
resource_budget:
  timeout:
  memory_or_result_limit:
```

A declared semantic bound defines query scope. A runtime cutoff is not scope; it yields incomplete reasons and never `CLEAR`.

### Seven component verdicts

| Component | EBCQ treatment | Input/output rule |
|---|---|---|
| `artifact_coherence` | Whether all applicable structure, semantic identity, trace, conflict, and profile-quality obligations are discharged. | **Computed output**. |
| `evidence_sufficiency` | Whether every applicable claim has current, compatible, scoped, noncircular evidence of the required class. | **Computed output** from evidence inputs. |
| `owner_approval` | Whether a current baseline-specific decision from the required authority owner exists. | Approval is an **external input**; EBCQ outputs only `present/valid`, `missing`, `unknown`, or `not-required`. It cannot create approval. |
| `transition_admission` | Whether the named transition’s profile requires and receives coherent artifact, sufficient evidence, required approval, current dependencies, and acceptable residue. | **Computed projection output**, never state movement. |
| `execution_completion` | Task/execution owner’s current completion receipt, when the profile needs it. | **External input state**; EBCQ validates binding/currentness only. |
| `promotion` | Narrow authority owner’s recorded promotion state. | **External input state** only. |
| `release` | Product/release/deployment authority’s recorded state. | **External input state** only. |

Every component has:

```text
SATISFIED | UNSATISFIED | UNKNOWN | NOT_APPLICABLE | STALE | SUPERSEDED | ERROR
```

No component implies another. In particular:

```text
artifact_coherence  -/-> evidence_sufficiency
evidence_sufficiency -/-> owner_approval
owner_approval       -/-> transition_admission
transition_admission -/-> execution_completion
execution_completion -/-> promotion
promotion            -/-> release
DefinitionOfDone satisfaction -/-> release
```

Transition admission may conjunctively depend on earlier components because a profile says so; that dependency does not collapse their meanings or mutate their states.

### Overall algebra

```text
ERROR
  if parsing, canonicalization, evaluator, or resource failure occurs

BLOCKED
  else if an applicable acceptance-critical obligation is definitively UNSATISFIED

INDETERMINATE
  else if an applicable critical obligation is UNKNOWN, STALE, conflicted,
  owner-unbound, outside an unapproved boundary, or incompletely traversed

CLEAR
  else only if every applicable obligation was evaluated,
  every required component is SATISFIED,
  every excluded obligation is explicitly NOT_APPLICABLE,
  and reasons_complete == true
```

For admission policy:

```text
mayProceed = (overall == CLEAR)
```

Thus `INDETERMINATE` denies admission without falsely asserting a violation.

### `WayClearReceipt`

The receipt contains:

- query, artifact, selector, dataset, profile, evaluator, scope, completeness, evidence, dependency, owner, canonicalization, and digest bindings;
- all seven component results;
- every clause result and evidence reference;
- stable-sorted complete reasons;
- visited node/edge manifest and explicit boundary residue;
- prior receipt/supersession references;
- historical verdict plus currentness state;
- `reasons_complete`;
- `mayProceed`;
- `authorityEffect: none`;
- evaluation time and deterministic receipt digest.

Evaluation is pure, append-only, and does not repair, approve, move, or publish its inputs.

## 8. State and reason algebra

Claim evidence remains paraconsistent:

```text
K(c) = (support(c), refute(c))

(0,0) unknown
(1,0) supported
(0,1) refuted
(1,1) conflict
```

Applicability and currentness are orthogonal:

```text
applicability = applicable | not_applicable | scope_unknown
currentness   = current | stale | superseded | invalidated
```

Term reconciliation:

- `open`: a known applicable obligation not discharged. If a failing witness or valid completeness declaration proves absence, it is `UNSATISFIED`; otherwise it remains `UNKNOWN`. Either denies admission when critical.
- `fog`: `(0,0)` plus an explicit ambiguity or unresolved-discrimination record; result `UNKNOWN` with `UNRESOLVED_FOG`.
- ordinary `unknown`: `(0,0)` without the explicit ambiguity record.
- `conflict`: `(1,1)`; remains `INDETERMINATE` until a profile-authorized resolution, defeating condition, or owner disposition applies.
- `stale`: not a truth value. Historical evidence/verdict remains recorded, but it is excluded from current support.
- `superseded`: version relation. Superseded evidence/artifacts are historical and excluded from the current baseline unless the query explicitly targets history.
- `out-of-scope`: `NOT_APPLICABLE` only through an exact scope rule. Omission alone is not out-of-scope.
- `closed`: not accepted as positive evidence in the new algebra; it must be re-established as `SATISFIED` under a profile and evidence baseline.
- `blocked`: derived overall result, not an authored lifecycle or truth state.

Minimum reason families:

```text
scope:
  SCOPE_UNDECLARED
  SCOPE_UNKNOWN
  OUT_OF_SCOPE
  OUT_OF_SCOPE_DEPENDENCY
  COMPLETENESS_DECLARATION_MISSING
  COMPLETENESS_DECLARATION_STALE

typing/profile:
  ARTIFACT_KIND_UNKNOWN
  ARTIFACT_ROLE_UNKNOWN
  STATEMENT_KIND_UNKNOWN
  PROFILE_UNBOUND
  PROFILE_UNKNOWN
  PROFILE_VERSION_MISMATCH
  POLICY_OWNER_UNBOUND

obligation/evidence:
  MISSING_OBLIGATION
  OPEN_OBLIGATION
  UNRESOLVED_FOG
  UNDECIDABLE_CRITERION
  EVIDENCE_MISSING
  EVIDENCE_CLASS_MISMATCH
  EVIDENCE_INCOMPATIBLE
  EVIDENCE_INVALID
  EVIDENCE_STALE
  HUMAN_JUDGMENT_REQUIRED
  HUMAN_EVIDENCE_REQUIRED
  VALIDATION_NOT_RUN
  WAIVER_UNDISPOSITIONED

semantic/graph:
  TRACE_BROKEN
  CONFLICT_OPEN
  CONFLICT_UNRESOLVED
  ONTOLOGY_INCONSISTENT
  DEPENDENCY_NOT_READY
  DEPENDENCY_BLOCKED
  DEPENDENCY_CYCLE
  RELATION_NOT_ALLOWED
  REFINEMENT_SATISFACTION_COLLAPSE
  CIRCULAR_SUPPORT

authority/lifecycle:
  OWNER_MISSING
  OWNER_UNBOUND
  APPROVAL_MISSING
  AUTHORITY_EFFECT_FORBIDDEN
  BASELINE_DRIFT
  INPUT_SUPERSEDED
  SUPERSEDED

binding/evaluation:
  SOURCE_DIGEST_MISMATCH
  PROFILE_DIGEST_MISMATCH
  EVALUATOR_DIGEST_MISMATCH
  SEMANTIC_BOUND_EXCEEDED
  RESOURCE_LIMIT_EXCEEDED
  EVALUATION_ERROR
  REASONS_INCOMPLETE

migration:
  LEGACY_CAUSE_UNTYPED
  LEGACY_CLOSED_UNVERIFIED
```

Each reason binds `component`, `clause_id`, `subject`, `selector`, `evidence_refs`, `currentness`, `criticality`, `repair_owner`, and `next_action`.

```text
reasons = stable-sort(unique(all unsatisfied ∪ all unknown/error reasons))
```

`reasons_complete: true` requires evaluation of every applicable profile clause and every permitted node/edge in the declared scope. Early exit and result truncation are forbidden for a clear result.

## 9. Exact-binding candidate matrix

| Candidate claim | Immutable source identity and exact selector | Explorer anchor / evidence scope | Proof status | Disposition |
|---|---|---|---|---|
| Current Way Clear is only an `open|fog` frontier predicate | `arcanum/.../runtime/way_clear.py:10-27`; schema `.../way-clear.schema.json:1-34`. No source digest was supplied in the admitted return, so exact immutable rebinding remains a defect. | [A1 §3, runtime/schema rows; §7](research.md#agent-1--formal-ontology-and-closure-semantics). Current implementation text only; not executed. | **Observed**, not executed; immutable digest **unverified**. | **Build-from-owned** migration source; semantic sufficiency **killed**. |
| Thin typed/provenanced substrate is locally compatible | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1315-1404,2100-2161,2171-2226,2300-2482,2553-2698`; SHA-256 `b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c`. | [A2 §3 local evidence](research.md#agent-2--lifecycle-and-acceptance-semantics). Orthogonal kind/lifecycle/evidence/authority/owner axes. | **Observed active private canonical definitions**; not EBCQ approval. | **Build-from-owned**. |
| Receipts cannot carry authority | `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72,74-103,122-159`; SHA-256 `8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407`. | [A2 §3, §5](research.md#agent-2--lifecycle-and-acceptance-semantics). Owner movement and default-deny authority. | **Observed**; authority-chain drift elsewhere remains unresolved. | **Build-from-owned**; `authorityEffect != none` **killed**. |
| Lifecycle axes must not collapse | `cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md:8-62`; SHA-256 `00636be3a4919b82ec3904d96de1084c7219d710eb9d29d9acd192e78d59b476`. | [A2 §3, §9](research.md#agent-2--lifecycle-and-acceptance-semantics). Workflow/maturity/promotion/projection split. | **Observed candidate model**; schema/validator **unverified/deferred**. | **Build-from-owned**, execution **deferred**. |
| Immutable-frontier readiness does not select or execute | `arcanum/spells/work-pack-readiness-audit/README.md:10-19,56-82,98-214`; SHA-256 `8fb4a8cef0ebbd628ae2004deb85ed21cedcbc66db22452ad4e3c7647f8d7561`. | [A2 §3, §5](research.md#agent-2--lifecycle-and-acceptance-semantics). Admission/readiness projection. | **Observed canonical public contract**; runner not executed. | **Build-from-owned**. |
| Execution completion remains separately owned | `arcanum/arcana/task-session/SKILL.md:60-98,113-155,220-360`; SHA-256 `45c7d994ad180c958c353b2f4d3ad41caa1554870d23acd12534bac61cbe2734`. | [A2 §3, §5](research.md#agent-2--lifecycle-and-acceptance-semantics). Admission, evidence, done, stale binding, closeout. | **Observed canonical public contract**. | **Build-from-owned**; EBCQ ownership **killed**. |
| OEW proves kind is not inferred from views/grouping | `.../ontology-evidence-workbench-focus-scene/design/ARCHITECTURE.md:3-28,102-159`; SHA-256 `e1140e33c6cc1919d3b02d36ec5975046db020004cd2ab9b698c3e0f7c5d1b1e`. | [A3 §3 local evidence; §8](research.md#agent-3--architecture-design-and-ux-evidence). Discovery-mode Design containing architectural views; no authority effect. | **Observed live candidate artifact**; still blocked before Plan. | **Build-from-owned** non-collapse rule. |
| Open-world entailment cannot treat missing facts as false | RDF 1.1 Semantics §§3, 5.3, 10; OWL 2 Primer Introduction and Direct Semantics §2.5. Versioned W3C Recommendations. | [A1 §3 external rows; §5–§7](research.md#agent-1--formal-ontology-and-closure-semantics). RDF/OWL semantic scope. | **Observed primary standards**. | **Build-from-owned**. |
| Local closed-world validation is narrow | SHACL Recommendation §3.6 and §4.8.1; Darari/Razniewski/Nutt §3 Definitions 1–2. | [A1 §3 external rows; §5](research.md#agent-1--formal-ontology-and-closure-semantics). Focus-node closure and completeness statements. | SHACL **observed**; completeness paper **observed**, not reproduced. | `CompletenessDeclaration` **proposed**; global closed world **killed**. |
| Provenance and invalidation are not approval | PROV-DM §5.1.8 and §5.3.2. W3C Recommendation. | [A1 §3 PROV row; §4–§6](research.md#agent-1--formal-ontology-and-closure-semantics). Invalidation/attribution only. | **Observed primary standard**; authority limitation is explorer inference. | **Build-from-owned**. |
| Requirements/DoD need separate traces, measures, and release gate | Scrum Guide 2020, Developers/Increment/DoD; NASA SE Handbook Rev.2 pp.107–108 and V&V appendix §§4–7; Gotel/Finkelstein §§5.1–8. | [A2 §3 external evidence; §4](research.md#agent-2--lifecycle-and-acceptance-semantics). DoD, verification, traceability. | Full sources **observed**; ISO 29148 clause list **unverified**. | Profiles **build-from-owned/proposed**; ISO-specific clauses **deferred**. |
| Architecture description differs from entity/system adequacy | ISO/IEC/IEEE 42010:2022 official abstract; conceptual model sections “AD Elements and Correspondences” and “Architecture Decisions and Rationale.” | [A3 §3 external evidence; §4](research.md#agent-3--architecture-design-and-ux-evidence). AD structure and rationale. | Official abstract/support material **observed**; licensed normative clauses **unverified**. | **Build-from-owned** minimums; clause-level conformance **deferred**. |
| Automated accessibility evidence cannot establish all UX claims | WCAG 2.2 Introduction and §5.2; WAI evaluation and user-evaluation guidance; Vigo/Brown/Conway 2013. | [A3 §3 external evidence; §4, §6](research.md#agent-3--architecture-design-and-ux-evidence). Accessibility, manual review, human-study scope. | W3C materials **observed**; historical tool figures not generalized. | Evidence boundary **build-from-owned**; universal UX score **killed**. |
| Exact deterministic digests need named canonicalization | RDFC-1.0 §§1.1, 4; RFC 8785 §§1, 3. | [A1 §3, §6 invariant 12; §8](research.md#agent-1--formal-ontology-and-closure-semantics). RDF and JSON canonical forms. | **Observed** Recommendation/RFC. Cross-carrier equivalence **unverified**. | Same-carrier binding **build-from-owned**; cross-carrier equivalence **deferred**. |
| Numeric semantic bounds require an application contract | SPARQL 1.2 §9 property paths. | [A1 §3 SPARQL row; §8](research.md#agent-1--formal-ontology-and-closure-semantics). Path syntax versus depth/node budget. | **Observed current draft**, not stable Recommendation. | Custom bounded evaluator **proposed**; SPARQL-only bound **killed**. |

## 10. Finite seven-family fixture matrix

These are paper-executable proposed fixtures. None was run.

### Positive graph `G+`

```text
DEF-1 defines terms used by REQ-1
REQ-1 is operationalized by CRIT-1
ARCH-1 addresses REQ-1 and its declared concerns
DES-1 is constrained by REQ-1 and ARCH-1, with alternatives and rationale
UXP-1 evaluates DES-1 under a prospective human-evidence-bounded plan
DOD-1 covers CRIT-1 and exact completion obligations for INC-1
terminal evidence nodes independently support each applicable obligation
owner decisions are exact, current, scope-bound inputs where profiles require them
execution/promotion/release are NOT_APPLICABLE unless the named profile requires them
```

Expected: all seven artifact queries `CLEAR`, `reasons_complete: true`, `authorityEffect: none`. This establishes only the seven named candidate profile purposes.

| Kind | Positive witness | False-clear mutant and expected reason | False-block mutant and expected result |
|---|---|---|---|
| Definition | Grounded meaning, boundaries, voices, provenance, consumers, index/drift route, semantic review. | Replace grounding with `DEF-1 -> DEF-2 -> DEF-1`. Expect `CIRCULAR_SUPPORT`, `BLOCKED` or `INDETERMINATE` according to completeness of the cycle evidence. | Remove canonical approval while querying candidate usability, not canonicalization. It must remain `CLEAR`; otherwise `APPROVAL_MISSING` is incorrectly imported. |
| Criterion | Exact observable, method, threshold, verdict domain, evidence class, baseline, owner, N/A law. | Replace with “acceptable” and no observable/method/threshold. Expect `UNDECIDABLE_CRITERION`, `MISSING_OBLIGATION`, `BLOCKED`. | Supply a profile-authorized signed human-review receipt but evaluator accepts only executable-test evidence. Correct result `CLEAR`; hard-coded method would create `EVIDENCE_CLASS_MISMATCH` falsely. |
| Requirement | Unique normative statement, rationale/source, feasibility, verification/validation routes, bidirectional traces, dependencies, owner. | Remove verification path and forward trace. Expect `TRACE_BROKEN`, `MISSING_OBLIGATION`, `BLOCKED`. | Query pre-implementation artifact acceptance but demand implementation test evidence. Correct result remains `CLEAR` if artifact obligations and approval are satisfied. |
| DefinitionOfDone | Current bounded DoD; each measure terminates in independent current test/review/waiver evidence. | Replace terminal evidence with “DoD satisfied because all DoD items are satisfied.” Expect `CIRCULAR_SUPPORT`, `EVIDENCE_INVALID`, `BLOCKED`. | Remove release approval while all DoD measures pass. Correct DoD result `CLEAR`, release component `NOT_APPLICABLE`; otherwise false block. |
| Architecture | Exact AD identity; concerns/views/viewpoints/correspondence rules; decisions/alternatives/rationale; traces; explicit accepted residue with owner/expiry. | Keep syntactic concern edges but hide an unresolved material tension or stale view. Expect `CONFLICT_UNRESOLVED` or `EVIDENCE_STALE`, not clear. | Add an explicitly bounded, profile-permitted residual risk accepted by competent owner with expiry. It must not block solely because any conflict exists. |
| Design | Upstream bindings, alternatives or constrained-choice rationale, selection criteria, selected/deferred rationale, prototype digest, invariants and review receipts. | Retain selected screen and browser pass but remove alternatives/rationale/upstream trace. Expect `MISSING_OBLIGATION`, `TRACE_BROKEN`, `BLOCKED`. | Supply one physically possible option plus explicit proof/rationale that constraints eliminate alternatives. It must not be blocked merely by option count. |
| UXPlan | Population/context/tasks/questions/measures, pinned prototype, method/sample rationale, accessibility split, ethics/privacy, human ceiling, owners and rerun policy. | Remove research questions and evidence boundary while retaining automated browser checks. Expect `MISSING_OBLIGATION`, `HUMAN_EVIDENCE_REQUIRED`, `BLOCKED`. | Leave the planned study unexecuted under the prospective run-admission profile. Correct result can be `CLEAR`; demanding findings before plan execution is a false block. |

Cross-cutting mutants:

- stale profile/evaluator/evidence digest → `*_DIGEST_MISMATCH` or `EVIDENCE_STALE`;
- owner conflict → `CONFLICT_UNRESOLVED` or `APPROVAL_MISSING`;
- undeclared out-of-scope dependency → `OUT_OF_SCOPE_DEPENDENCY`;
- missing fact without completeness declaration → `INDETERMINATE`, not violation;
- arbitrary traversal cutoff → `REASONS_INCOMPLETE`, never clear;
- benign out-of-scope node → no block when exact exclusion is declared;
- superseded non-baseline requirement → excluded, not blocking.

## 11. Migration from current `open|fog` Way Clear

1. Freeze the current behavior as `LegacyDecisionFrontierProfile/v0`. Do not reinterpret its `clear` as evidence-bound closure.
2. Adapt every legacy node into an `Obligation` candidate while preserving source ID, scope, state, and legacy source digest.
3. Translate:
   - `open` → known applicable/not discharged plus `OPEN_OBLIGATION`. Because legacy state lacks a typed cause, also emit `LEGACY_CAUSE_UNTYPED`. A failing witness or matching completeness declaration makes it `UNSATISFIED`; otherwise it is `UNKNOWN`.
   - `fog` → `UNKNOWN` plus explicit ambiguity record and `UNRESOLVED_FOG`.
   - `closed` → no positive conclusion; emit `LEGACY_CLOSED_UNVERIFIED` until the obligation is re-evaluated under a profile and evidence baseline.
   - unrecognized `unknown|conflict|stale|superseded` → their new typed semantics rather than silent omission.
   - `scope != in_scope` → `NOT_APPLICABLE` only if an exact `ScopeDeclaration` reproduces the exclusion; otherwise `SCOPE_UNDECLARED`.
4. Preserve the existing source digest, but add artifact, dataset, profile, evaluator, evidence, completeness, owner, canonicalization, and semantic-bound digests.
5. Add `BLOCKED|INDETERMINATE|ERROR`, typed per-obligation results, full reason objects, traversal manifest, `reasons_complete`, component vector, and `authorityEffect: none`.
6. Run legacy and EBCQ evaluations in shadow against `G+` and every mutant. A legacy `clear` that EBCQ blocks or marks indeterminate is expected evidence of the current predicate ceiling, not automatically a regression.
7. Do not replace the public runtime until the private candidate has owner approval, executed fixtures, selected evaluator split, exact schema, and an explicitly approved public/private extraction boundary.
8. Migration itself changes no lifecycle state. Old receipts remain historical and never acquire new evidentiary meaning retroactively.

## 12. Typed residue and repair owners

| Residue | Type / impact | Required repair owner |
|---|---|---|
| Canonical `Artifact` primitive unresolved | Ontology/definition ambiguity; bars promotion of the shared carrier. | Private ontology owner plus Definitions Governance. |
| No approved EBCQ name, vocabulary, or profiles | Authority/ownership gap. | Narrow candidate ontology owner, then each artifact-kind owner. |
| No finite fixture executed | Validation gap; all expected receipts remain proposed. | Research/fixture owner and later bounded implementation validator. |
| OWL/SHACL/JSON Schema/custom evaluator split unselected | Implementation architecture gap. | Candidate evaluator architecture owner. |
| Completeness declarations lack issuer, trust, query-pattern, expiry, and invalidation policy | Could create false absence-as-failure. | Authority model owner plus profile owners. |
| Exact lifecycle schema and movement-edge law absent | EBCQ must not validate or mutate lifecycle movement. | Lifecycle-model owner. |
| Local authority-chain citation/order drift | Unsafe to encode chain as closure invariant. | Definitions Governance. |
| ISO 29148, 42010, and 9241 clause-level duties inaccessible | External evidence gap; clause-level claims remain unverified. | Research/source-access owner; do not fill from memory. |
| Human evidence, concern materiality, trade-off quality, and risk tolerance remain contextual | Irreducible owner/human boundary. | Architecture, Design, UX/research, risk, and product owners respectively. |
| Evidence expiry, substitution, multiplicity, and independence unselected | Profile-local false-clear/false-block risk. | Each `ClosureProfile` owner. |
| Multi-role selector stability across versions unspecified | Identity and digest ambiguity. | Artifact identity/profile owner. |
| Cross-carrier RDF/JSON-LD/JSON digest equivalence unspecified | Receipt comparison ambiguity. | Serialization/evaluator contract owner. |
| Reason-completeness theorem absent | A `CLEAR` result cannot claim more than finite declared evaluation. | Evaluator specification owner; retain explicit finite-scope ceiling. |
| Current Way Clear schema lacks typed states, bindings, evidence, reasons, and authority posture | Migration gap. | Existing Way Clear capability owner only after private candidate approval and public-boundary review. |
| OEW remains discovery-mode Design blocked before Plan | Live local lifecycle residue, not repairable by EBCQ. | OEW’s already named Design/Define/selection owners. |
| Public generic extraction unapproved | Privacy and authority boundary. | Separate owner-routed public/private decision. |

Final candidate verdict: **KEEP, RENAME, AND BOUND**. Keep the relation/query idea as `Evidence-Bound Closure Query`; defer the shared ontology carrier; build from owned identity, provenance, evidence, authority, readiness, and artifact-specific precedents; propose seven versioned profiles and a reason-complete receipt; kill every implication from a clear receipt to approval, execution, promotion, publication, release, deployment, or production readiness.
