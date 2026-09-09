## Agent 1 — Formal ontology and closure semantics

## 1. Action identity and status

- `action_id`: `spawn-0001`
- `dispatch_id`: `2026-07-31-ontological-way-clear-artifact-readiness`
- `run_id`: `ontological-way-clear-20260731T153840`
- `wave/step`: `explorers/s1`
- `identity`: `Tarski, Alfred`
- `role`: `formal-ontology-explorer / explorer`
- `capability`: `research`
- `status`: `completed-read-only`
- Mutations, delegation, and external-state changes: none.

## 2. Concise answer

A generic Ontological Way Clear survives only as a candidate, non-authoritative query-and-receipt model over a thin shared substrate plus seven distinct, versioned `ClosureProfile`s. It does not survive as one universal artifact type, one checklist, or one meaning of “clear.”

Use RDF/OWL for typed identity, positive entailment, and consistency questions; SHACL or an equivalent finite validator for declared structural constraints; PROV for generation, derivation, attribution, and invalidation; explicit local completeness declarations for the narrow places where absence may count; and a custom bounded evaluator for dependency closure, currentness, owner/authority separation, reason completeness, and deterministic receipts.

“Clear” must separate at least:

1. `artifact_coherence`: the artifact’s applicable kind-profile obligations are satisfied.
2. `transition_admission`: the named lifecycle transition’s evidence, owner, scope, and approval obligations are satisfied.

A receipt is `clear` only when both are clear under immutable input, profile, evaluator, and closure-scope bindings. `indeterminate` must remain distinct from `blocked`; conservative admission may deny both without erasing the epistemic difference. No clear receipt can imply semantic truth, owner approval, authority, promotion, implementation completion, publication, release, or production readiness.

The current Way Clear runtime does not implement this model. It is a deterministic narrow predicate over `open|fog` decision nodes, not an evidence-bound cross-artifact closure evaluator.

## 3. Source/evidence table

| Source and exact binding | What it establishes | Proof status |
|---|---|---|
| `cyberAlchemy-v2/development/research/2026-07-31-ontological-way-clear-artifact-readiness/dispatch-sheet.json:5-9,33-38` | Frozen goal, current runtime ceiling, formal-semantic explorer scope. | **Observed** local bytes. Dispatch goal, not proof of candidate semantics. |
| `cyberAlchemy-v2/development/research/2026-07-31-ontological-way-clear-artifact-readiness/strategy-inventory-packet.json:160-172,174-181` | No indexed seven-family closure ontology or finite witness; open/closed-world boundary unresolved; Inventory is non-authority. | **Observed discovery evidence**, explicitly non-proof. |
| `arcanum/spells/goal/development/decision-frontier-experiment/runtime/way_clear.py:10-27` | Sorts nodes by ID; considers only `scope == in_scope` and `state ∈ {open,fog}`; emits `open_decision|unresolved_fog`, source digest, and `clear|blocked`. | **Observed implementation text**; not executed in this action. |
| `arcanum/spells/goal/development/decision-frontier-experiment/schemas/way-clear.schema.json:1-34` | Output has only version, kind, 64-hex source digest, binary status, and an unconstrained array; no typed remaining-item contract. | **Observed schema text**; validation not rerun. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:881-919` | Local ontology requires typed objects/relations, evidence/provenance, confidence, promotion posture, invalidation, and use guidance. | **Observed local canonical definition**, but it does not define Ontological Way Clear. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1323-1377` | Kind, lifecycle status, evidence, commitment, provenance, owner, and residue are orthogonal axes; documentary machine validator remains deferred. | **Observed local canonical definition**. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2180-2200,2221-2226` | Authority needs explicit scope, owner, surface, operation, basis, effect, and challenge route; authority is not truth, evidence, or implementation success. | **Observed local canonical definition**. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2241-2264,2285-2290` | Provenance is a typed origin/transformation path; provenance alone is neither proof nor authority. | **Observed local canonical definition**. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2434-2455` | Claim strength cannot exceed its support package. | **Observed local canonical invariant**. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2561-2588,2613-2618` | Contradiction, validation, challenge, owner route, and residue are distinct; a challenge contract is not a verdict or promotion decision. | **Observed local canonical definition**. |
| `cyberAlchemy-v2/development/research/2026-07-26-ontology-working-prototype-gap/findings.md:25-41,43-71` | Closest local candidate precedent: finite closed-world validator; pass/fail/indeterminate; immutable receipts; tested write isolation; authority excluded. | **Observed prior accepted research result**, proposed composition not executed here. |
| Same file `:73-130,178-188,212-227` | Finite positive/negative/indeterminate witness shape, `POLICY_OWNER_UNBOUND`, digest bindings, deterministic-byte and authority-boundary expectations. | **Observed proposal/prior result**, not current executable proof. |
| `cyberAlchemy-v2/development/research/2026-06-23-governed-artifact-primitive-formalization/findings.md:12-21,33-60` | “Governed artifact” failed as a primitive because lifecycle, evidence, authority, and challenge obligations already have distinct owners; base `artifact` remains unresolved. | **Observed resolved candidate-only research**; bars claiming a canonical shared `Artifact` primitive. |
| `ops/development/2026-07-30-invoke-one-shot-workflow-research/findings.md:154-194,715-725` | Readiness projection, question closure, approval, invalidation, execution, and authority remain separate; proof ceiling is frozen-input contractual readiness. | **Observed prior research**, not executed here. |
| [RDF 1.1 Semantics §§3, 5.3, 10](https://www.w3.org/TR/rdf11-mt/) | RDF entailment extensions are monotonic; graph names do not intrinsically denote their paired graphs; RDF datasets do not supply the required closure policy. | **Observed W3C Recommendation**. |
| [OWL 2 Primer, Introduction](https://www.w3.org/TR/owl-primer/#introduction) and [Direct Semantics §2.5](https://www.w3.org/TR/owl2-direct-semantics/#Inference_Problems) | Missing facts remain possibly true under OWA; consistency means existence of a model; entailment quantifies over every model. | **Observed W3C Recommendations**. |
| [OWL 2 Conformance §2.2.1](https://www.w3.org/TR/owl2-conformance/#Entailment_Checker) | Entailment checker precedents distinguish `True`, `False`, `Unknown`, and `Error`; completeness excludes `Unknown` given sufficient resources. | **Observed W3C Recommendation**. |
| [SHACL §3.6](https://www.w3.org/TR/shacl/#validation-report) and [§4.8.1](https://www.w3.org/TR/shacl/#ClosedConstraintComponent) | Validation reports carry conformance and required results; `sh:closed` rejects unenumerated predicates for selected focus nodes. It does not assert global dataset completeness. | **Observed W3C Recommendation**; last sentence is an inference from the specified scope. |
| [PROV-DM §5.1.8](https://www.w3.org/TR/prov-dm/#concept-invalidation) and [§5.3.2](https://www.w3.org/TR/prov-dm/#concept-attribution) | Invalidation marks cessation/expiry; attribution ascribes an entity to an agent. Neither defines normative approval or authority. | **Observed W3C Recommendation**; authority limitation is an inference from PROV’s stated semantics. |
| [Darari, Razniewski, Nutt, §3 Definitions 1–2](https://arxiv.org/pdf/1408.6395) | Completeness statements restrict valid interpretations and permit certain/possible-answer reasoning without globally closing RDF. | **Observed primary preprint/paper**; not reproduced experimentally. |
| [SPARQL 1.2 §9](https://www.w3.org/TR/sparql12-query/#propertypaths) | `*` and `+` express arbitrary-length paths; numeric depth/node budgets are not supplied by this path syntax and need an application contract. | **Observed current W3C draft**, not a stable Recommendation. |
| [RDF Dataset Canonicalization 1.0 §§1.1, 4](https://www.w3.org/TR/rdf-canon/) | Current standard algorithm for canonical RDF dataset serialization, including blank nodes, before comparison/signing/hashing. | **Observed W3C Recommendation**. |
| [RFC 8785 §§1, 3](https://www.rfc-editor.org/rfc/rfc8785.html) | Deterministic JSON canonicalization produces a hashable representation. | **Observed RFC**, informational rather than IETF Standards Track. |

## 4. Candidate type/relation table

“Candidate” below means proposed technical vocabulary only.

| Candidate | Semantics and invariant | Non-collapse consequence |
|---|---|---|
| `ArtifactVersion` | Thin immutable carrier: ID, content digest, media type, version/supersession. | Must not be promoted as a canonical CAV2 `Artifact` primitive; carries no authority by type. |
| `ArtifactRole` | One of `Definition`, `Criterion`, `Requirement`, `DefinitionOfDone`, `Architecture`, `Design`, `UXPlan`, attached at document or selector level. | Roles are distinct but need not be globally disjoint: one physical document may expose multiple selector-bound roles. |
| `Statement` / `StatementKind` | Typed proposition: meaning assignment, decision predicate, normative obligation, completion clause, concern, decision, rationale, research question, etc. | Artifact role and statement kind are independent axes. |
| `Obligation` | A profile-evaluable must-satisfy condition with subject, scope, evaluator, evidence class, and disposition rule. | Not every statement is an obligation; a definition or rationale is not silently a requirement. |
| `Claim` | Proposition whose evidence state may be supported, refuted, both, or neither. | Evidence and authority remain separate. |
| `Evidence` / `EvidenceClass` | Immutable evidence object plus class, provenance, bindings, validity conditions, and currentness. | A screenshot, validator run, owner decision, and human study are not substitutable evidence classes. |
| `Decision` / `Owner` / `AuthorityClaim` | Decision made by a named owner; authority claim has explicit scope, surface, operation, basis, effect, and challenge route. | PROV attribution is not approval; validator conformance is not authority. |
| `ScopeDeclaration` | Declares root selectors, graphs/datasets, edge allow-list, direction, time/as-of, and semantic bounds. | Out-of-scope is valid only through an exact declaration, never by omission. |
| `CompletenessDeclaration` | Declares a dataset/graph complete for an exact subject-predicate/query pattern under issuer, time, and evidence conditions. | Enables local absence-as-failure; never establishes a global closed world. |
| `ClosureProfile` | Immutable, versioned contract for one artifact role and one query purpose/transition. | Seven profiles share machinery, not meaning or obligations. |
| `ClosureQuery` | Root, dataset digest, profile digest, evaluator digest, relation directions, semantic depth/node bounds, as-of time. | “Closure” is a bounded query, not all semantic consequences. |
| `WayClearReceipt` | Immutable record binding input, profile, evaluator, result, complete reasons, canonicalization/hash algorithms, and `authorityEffect: none`. | Records evaluation only; cannot promote or mutate its inputs. |

Shared relations:

| Relation | Formal boundary |
|---|---|
| `hasRole`, `containsStatement`, `expressesObligation` | Structural typing only. |
| `dependsOn` | Directed; cycle policy is profile-local. |
| `refines` | Adds precision while preserving intended scope; does not imply `satisfies`. |
| `satisfies` | Must be represented as a satisfaction claim bound to evidence/profile, not a bare edge treated as truth. |
| `covers` | Declares addressed scope; does not imply satisfaction or completion. |
| `conflictsWith` | Symmetric, irreflexive, non-transitive, non-composing. |
| `blockedBy` | Derived receipt relation, not authored authority. |
| `verifiedBy` | Evidence supports a claim under a named method; does not imply approval. |
| `invalidatedBy`, `supersedes` | Currentness/version relations; historical receipts remain immutable. |
| `wasDerivedFrom`, `wasAttributedTo` | Reuse PROV semantics; neither relation conveys authority. |
| `declaresCompleteFor` | Connects a local completeness declaration to its exact query pattern. |
| `governedByProfile`, `evaluatedBy` | Bind profile and evaluator versions. |
| `approvedBy` / `hasAuthorityEffect` | Only owner decisions may carry the declared effect; receipts must default to `none`. |

Kind-specific profile signatures:

| Role | Distinct closure obligations and relations |
|---|---|
| `Definition` | Definiendum, intended scope, meaning, boundaries/non-equivalences, owner/provenance, conflict and circularity checks; `definesTerm`, `disambiguatesFrom`. |
| `Criterion` | Subject, observable, decision rule/threshold, evaluator, evidence class; `evaluates`, `operationalizes`. |
| `Requirement` | Normative subject, condition, required outcome, source/owner, verification method, trace; `obligates`, `verifiedBy`. |
| `DefinitionOfDone` | Applies to a bounded increment/work unit, enumerates non-self-certifying completion clauses and evidence; `appliesTo`, `completionEvidenceFor`. |
| `Architecture` | Concerns, viewpoints, decisions, interfaces/constraints, unresolved tensions and rationale; `addressesConcern`, `describedByViewpoint`. |
| `Design` | Realizes requirements/architecture decisions through selected alternatives and rationale; `realizes`, `choosesAlternative`, `hasRationale`. |
| `UXPlan` | Target users/tasks, research questions, measures, accessibility assertions, evidence-class ceilings, human-study residue; `asksResearchQuestion`, `specifiesMeasure`, `requiresHumanEvidence`. |

## 5. State and reason-code algebra

For claim `c`, use a two-bit evidence state:

```text
K(c) = (support(c), refute(c)) ∈ {0,1}²

(0,0) = unknown
(1,0) = supported
(0,1) = refuted
(1,1) = conflict
```

This is a candidate paraconsistent evidence ledger, not an OWL entailment extension. It prevents one explicit conflict from causing classical explosion. `fog` is `(0,0)` plus an explicit ambiguity or unresolved-discrimination record; ordinary `unknown` has no such record. `stale` is not a truth value: the evidence is historically present but excluded from current support because time, source, artifact, dependency, profile, or evaluator bindings no longer match.

Per obligation:

```text
discharged     = qualifying current support and no active defeating condition
violated       = explicit failing witness, or absence under a matching valid completeness declaration
open           = known applicable obligation not discharged
indeterminate  = OWA unknown, fog, stale-only support, unbound owner/policy,
                 unresolved conflict, or incomplete traversal
```

Evaluation joins:

```text
ERROR         if parsing/evaluator/canonicalization/resource failure occurred
BLOCKED       else if any definitive violation exists
INDETERMINATE else if any uncertainty reason exists
CLEAR         else, only if every applicable obligation was evaluated and discharged
```

`artifact_coherence` and `transition_admission` are evaluated separately. Overall Way Clear is `CLEAR` only for `(CLEAR, CLEAR)`. A transition policy may deny `INDETERMINATE`, but must not relabel it `BLOCKED`.

Core reason-code families:

```text
scope:
  SCOPE_UNDECLARED
  OUT_OF_SCOPE_DEPENDENCY
  COMPLETENESS_DECLARATION_MISSING
  COMPLETENESS_DECLARATION_STALE

typing/profile:
  ARTIFACT_ROLE_UNKNOWN
  STATEMENT_KIND_UNKNOWN
  PROFILE_UNBOUND
  PROFILE_VERSION_MISMATCH
  POLICY_OWNER_UNBOUND

obligation/evidence:
  OPEN_OBLIGATION
  UNRESOLVED_FOG
  EVIDENCE_MISSING
  EVIDENCE_CLASS_MISMATCH
  EVIDENCE_INVALID
  EVIDENCE_STALE
  HUMAN_EVIDENCE_REQUIRED

semantic/graph:
  CONFLICT_UNRESOLVED
  ONTOLOGY_INCONSISTENT
  DEPENDENCY_BLOCKED
  DEPENDENCY_CYCLE
  RELATION_NOT_ALLOWED
  REFINEMENT_SATISFACTION_COLLAPSE

authority/lifecycle:
  OWNER_UNBOUND
  APPROVAL_MISSING
  AUTHORITY_EFFECT_FORBIDDEN
  INPUT_SUPERSEDED

binding/evaluation:
  SOURCE_DIGEST_MISMATCH
  PROFILE_DIGEST_MISMATCH
  EVALUATOR_DIGEST_MISMATCH
  SEMANTIC_BOUND_EXCEEDED
  RESOURCE_LIMIT_EXCEEDED
  EVALUATION_ERROR
  REASONS_INCOMPLETE
```

Reason completeness:

```text
reasons = stable-sort(unique(all violated clauses ∪ all indeterminate clauses))
```

`reasons_complete: true` only if every applicable profile clause and every node/edge inside the declared semantic scope was evaluated. SHACL permits result limiting, so a reason-complete use must forbid truncation. Resource cutoff, parser failure, or unexplored reachable scope yields `reasons_complete: false` and never `CLEAR`. A declared semantic maximum depth may define scope; an accidental runtime cutoff may not.

## 6. Invariants

1. Every evaluation binds immutable artifact, dataset, profile, evaluator, completeness-declaration, and canonicalization identities.
2. A physical document may have multiple selector-bound roles; each applicable role keeps its own profile and result.
3. `defines`, `covers`, `refines`, `realizes`, `satisfies`, and `verifiedBy` are never inferred as synonyms.
4. Missing information is unknown unless an exact, current local completeness declaration licenses absence-as-failure.
5. OWL consistency is checked before using OWL entailments for readiness; an inconsistent ontology cannot be allowed to pass via vacuous entailment.
6. SHACL conformance is conformance of selected focus nodes to a shapes graph, not global knowledge completeness or semantic truth.
7. Evidence, provenance, confidence, owner commitment, approval, lifecycle state, and authority effect remain separate axes.
8. `conflictsWith` is symmetric but neither transitive nor part of grounding composition.
9. Staleness never rewrites a historical receipt; a new evaluation emits a new receipt and may reference the prior one as superseded.
10. Out-of-scope dependencies must be explicitly permitted, summarized, or returned as residue; silently ignoring them is forbidden.
11. Query traversal is pure and deterministic; stable ordering and duplicate elimination are part of the contract.
12. RDF inputs use named RDFC-1.0 canonicalization; JSON inputs use a named canonicalization such as RFC 8785. Hash algorithm and version are explicit.
13. A digest proves byte/canonical-form binding, not correctness, truth, currentness, approval, or authority.
14. `CLEAR` requires complete reasons and complete evaluation over the declared semantic scope.
15. A receipt has `authorityEffect: none`; any lifecycle or promotion movement requires a separate owner decision.
16. The maximum claim is bounded artifact coherence and/or transition admission for the named snapshot—never implementation, completion beyond the profile, promotion, publication, release, deployment, or production readiness.

## 7. Countermodels and risks

| Case | Failure |
|---|---|
| Empty graph or no selected SHACL targets conforms | False-clear unless target/scope completeness is itself established. |
| Requirement evidence absent under OWA | False-clear if absence is treated as satisfaction; false-block if absence is treated as violation without local completeness. |
| `sh:closed true` on a node | False claim of dataset completeness; it only constrains enumerated predicates for that focus node. |
| Inconsistent OWL ontology | Classical entailment becomes vacuous because there is no model; a consistency-first gate is required. |
| Current runtime receives only `closed` decision nodes while requirements/evidence are absent | Returns `clear`; false-clear for cross-artifact readiness. |
| Current runtime sees `stale`, `unknown`, `conflict`, or `superseded` states | They are ignored because only `open|fog` are considered; false-clear. |
| In-scope node depends on an out-of-scope open node | Current runtime ignores the dependency; false-clear. |
| Receipt’s source digest matches but profile/evaluator changed | False-clear from stale semantic bindings. |
| PROV attribution interpreted as approval | False authority and false-clear. |
| DoD cites itself as completion evidence | Structural pass but self-certifying false-clear. |
| `refines` treated as `satisfies` | Design or criterion refinement falsely closes a requirement. |
| Automated browser pass substitutes for comprehension/usability study | UXPlan false-clear across evidence classes. |
| Every `fog` mapped to definitive violation | False-block where the honest result is indeterminate or owner judgment required. |
| Extra benign RDF property under an overbroad closed shape | False-block caused by shape closure rather than obligation failure. |
| Arbitrary resource/depth limit mapped to `blocked` | False-block; correct result is error or indeterminate with incomplete reasons. |
| Artifact roles made globally disjoint | False-block for documents that legitimately contain distinct architecture and design selector projections. |
| Historical superseded conflict treated as current | False-block from failed version/currentness filtering. |
| Any `conflictsWith` edge globally blocks | False-block where the conflict is outside the profile, resolved, or explicitly accepted as bounded residue. |

## 8. Unresolved formal limits

- No owner has selected or approved a canonical Ontological Way Clear term, ontology, carrier, relation vocabulary, or seven profiles.
- Local research explicitly leaves the base `artifact` term unresolved; the shared carrier must remain technical/candidate-only.
- No seven-family finite witness exists, and no reason-completeness theorem or executable fixture bank has been observed.
- The exact division between OWL axioms, SHACL shapes, JSON Schema, and custom evaluator rules remains unselected.
- Local completeness declarations need an issuer/authority model, query-pattern language, invalidation semantics, and trust boundary.
- The two-bit conflict-preserving evidence algebra is proposed; it is not supplied by OWL/SHACL/PROV and has no local canonical owner.
- Multi-role document identity and selector stability across versions remain unspecified.
- Staleness windows, semantic invalidation triggers, and admissible evidence substitution are profile-local and owner-dependent.
- Human evidence classes, especially UX comprehension and preference, cannot be reduced to deterministic graph closure.
- Full reason completeness is only meaningful relative to an immutable finite profile clause set and semantic scope.
- Bounded property-path semantics, cycle handling, and node/depth budgets remain application contracts; SPARQL `*`/`+` alone do not provide the needed bound.
- RDF 1.2 and SPARQL 1.2 are current evolving specifications; stable load-bearing semantics should remain pinned to named versions.
- Cross-carrier digest equivalence between RDF, JSON-LD, and JSON projections needs an explicit normative source form.
- Authority conflict resolution and approval remain social/governance decisions, not logical consequences.

## 9. Blockers and residue

- The current Way Clear output schema lacks typed remaining items, `indeterminate|error`, reason completeness, scope/profile/evaluator bindings, evidence/provenance/currentness, authority posture, and closure limits.
- The `canonical_digest` implementation was outside the admitted inputs and was not inspected; only its invocation and the output’s 64-hex pattern were observed.
- No runtime tests, schema validation, countermodel execution, or deterministic replay was performed in this read-only explorer action.
- Inventory coverage is partial with 125 warnings and is discovery-only.
- The closest finite ontology validator and readiness-projection compositions remain proposed/build-from-owned rather than implemented.
- The selected UX audit precedent is confirmation-pending and unrun; its human-evidence ceiling is informative but not acceptance proof.
- External standards establish component semantics, not this candidate composition.
- No implementation, canonical ontology, approval, promotion, publication, or production-readiness claim is supported.

## Agent 2 — Lifecycle and acceptance semantics

## 1. Action status

- `action_id`: `spawn-0002`
- `role`: `lifecycle-acceptance-explorer / explorer`
- `identity`: `Simon, Herbert`
- `status`: `complete`
- `mode`: read-only research
- `mutation`: none

## 2. Concise answer

A generic Ontological Way Clear survives only as a non-authoritative, transition-scoped query over a named `ClosureProfile`; it is unsound as a single artifact-wide “clear” Boolean.

The minimum result is a component vector:

```text
artifact_quality
evidence_sufficiency
owner_approval
transition_admission
execution_completion
promotion_state
release_state
```

No component implies another. In particular:

- good structure is not sufficient evidence;
- sufficient evidence is not approval;
- approval does not repair stale evidence;
- admission is not execution;
- execution completion is not promotion;
- Definition-of-Done satisfaction is not release;
- a clear projection cannot change authority or lifecycle state.

For a named transition `T`, candidate semantics are:

```text
Ready(a, T, profile, baseline) =
  profile_is_bound
  AND artifact_identity_and_baseline_are_exact
  AND every applicable acceptance-critical obligation is satisfied
      by current evidence of an allowed class
  AND every required dependency is current
  AND no unresolved blocking contradiction, waiver, or residue exists
  AND every approval required by T is a current decision
      from the authority owner named by the profile
```

Evaluation should return `satisfied | unsatisfied | unknown | not-applicable` per obligation. `unknown` blocks an acceptance-critical transition; `not-applicable` is legal only through an explicit scope rule. The evaluator must enumerate every unmet or unknown critical obligation rather than stop after the first.

A self-asserting clause cannot close itself. The support graph is circular when a claim, requirement, criterion, or DoD measure is supported only by assertions within the same cycle and has no terminal evidence node of an allowed class. An approval record can satisfy an approval obligation, but cannot substitute for semantic, verification, usability, or operational evidence.

Derived artifact meanings:

- A **usable definition** has semantic identity, normative meaning, boundaries, the required explanatory voices, provenance, consumers, index presence, and a drift route. Canonicality additionally requires the Definitions Governance owner and canonical source.
- A **decidable criterion** binds subject, scope, observable/predicate, evaluation method, threshold, verdict domain, evidence class, time/version, criticality, owner, and permitted alternative. For human judgment, the machine can decide whether the required review exists; it cannot manufacture the human verdict.
- An **acceptable requirement artifact** has a unique identity, scoped normative statement, source/rationale, feasibility posture, verification and validation route, typed forward/backward traces, dependencies/conflicts, version, and change owner. This is artifact acceptability, not proof that the implemented system satisfies it.
- A **satisfiable DoD** is a current, product/increment-scoped set of nonrecursive quality measures with evidence requirements and an accountable owner. Satisfaction yields the Scrum meaning of a Done Increment; it does not prove release approval.
- A **ready named transition** binds exact `from` and `to` states, artifact/profile/evaluator versions, evidence baselines, required approval authority, criticality rules, and invalidation behavior. “Ready” without a named transition is under-specified.

## 3. Evidence table

### Local evidence

| Source and exact selector | SHA-256 | What it proves | Proof status |
|---|---|---|---|
| `arcanum/arcana/definitions-governance/SKILL.md:22-38,40-63,65-109,111-140` | `000480cbe3f1a6e1ec0c05395a09af2c4809ef4d396ea78055c46fee4220b2cd` | Three colocated voices; maintainer/canonical-source separation; stable IDs, index, drift and validation obligations. | Observed canonical Arcanum capability contract. |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1315-1404` (`CAV2-D23`); `:2100-2161` (`D33`); `:2171-2226` (`D34`); `:2300-2355` (`D36`); `:2364-2419` (`D37`); `:2428-2482` (`D38`); `:2553-2618` (`D40`); `:2629-2698` (`D41`); `:3184-3238` (`D48`); `:3247-3304` (`D49`) | `b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c` | Definition shape; lifecycle-axis non-collapse; authority, traceability, gates, evidence bounds, challenge paths, owner-routed promotion and closed authority kinds. | Observed active private canonical definitions; citation drift noted below. |
| `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-72,74-103,122-159` | `8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407` | Authority moves through owners; evidence, ontology, validation and projections do not promote; authority kinds are default-deny; validation is review-first. | Observed active local authority model. |
| `cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md:8-20,22-49,51-62` | `00636be3a4919b82ec3904d96de1084c7219d710eb9d29d9acd192e78d59b476` | Workflow, maturity, promotion verdict and projection state are distinct; owner profile fills the verdict hole; schema and validator remain deferred. | Observed candidate model, not binding schema. |
| `arcanum/spells/work-pack-readiness-audit/README.md:10-19,56-82,98-177,179-214,194-203` | `8fb4a8cef0ebbd628ae2004deb85ed21cedcbc66db22452ad4e3c7647f8d7561` | Immutable-frontier admission proof; adversarial receipt checks; snapshot drift invalidation; pass selects/executes/promotes/releases nothing. | Observed canonical public spell contract; runner not executed here. |
| `arcanum/arcana/task-session/SKILL.md:60-98,113-155,220-259,268-289,291-340,358-360` | `45c7d994ad180c958c353b2f4d3ad41caa1554870d23acd12534bac61cbe2734` | Live scope recheck, fail-closed criticality, admission/evidence separation, done-criterion validation, stale binding rejection and owner-routed closeout. | Observed canonical Arcanum execution contract. |
| `ops/development/2026-07-30-invoke-one-shot-workflow-research/findings.md:47-70,74-150,154-194,205-244,689-725` | `ba739376af94416d3c880bece01fe6698d60c615a4caf0ae64b0d1b4668617ce` | Closest accepted readiness precedent: authored/audited/approved/executed/closed statuses stay separate; exact owner map and semantic invalidation rules. | Accepted research evidence only, ceiling `frozen-input-contractual-readiness`; proposed fixtures remain unexecuted. |
| `strategy-inventory-packet.json` and its selected `.arcanum/inventory/entries/*` leads | n/a | Located owner precedents and known gaps. | Discovery only; not proof or authority. |

### External primary sources

| Source and selector | Verified content | Proof status |
|---|---|---|
| [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html), official abstract/status | Requirements engineering processes and required information items across the lifecycle; the 2018 edition remains published, was confirmed in 2024, and is now marked to be revised. | Official current landing-page content verified. Exact clause-level “good requirement” characteristic list was paywalled and is **unverified here**. |
| [IEEE SA 29148-2018](https://standards.ieee.org/ieee/802.1Q/6937/) | Confirms that the standard defines a good-requirement construct, attributes/characteristics, and iterative/recursive lifecycle application. | Official abstract verified; individual normative characteristics inaccessible. |
| [ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html), abstract | Separates an entity’s architecture from the architecture description; specifies AD/ADF/ADL/viewpoint/model-kind conformance, not system requirements or an architecting method. | Official current abstract verified. |
| [Official 2020 Scrum Guide](https://scrumguides.org/scrum-guide.html), §§ Developers, Increment, Commitment: Definition of Done | DoD is the formal state description for an Increment meeting product quality measures; Developers conform; organizational DoD is a minimum; multiple teams share one; Sprint Review is not the release gate. | Full official source verified; current official version per [download page](https://scrumguides.org/download.html). |
| [ISO/IEC/IEEE 15026-2:2022](https://www.iso.org/standard/80625.html) and [15026-1:2025](https://www.iso.org/standard/89808.html), abstracts | Assurance cases have governed structure/terminology; the vocabulary standard explicitly does not prescribe how to measure, demonstrate, or analyze particular properties. | Official current abstracts verified; detailed clauses paywalled. |
| [OMG SACM 2.3](https://www.omg.org/spec/SACM/2.3/PDF), §§11.8-11.16, pp.48-51; §12.7-12.9, pp.57-58 | Separates claims, assertion state, evidence artifacts, context and asserted support relations; `needsSupport` and `defeated` are explicit; evidence-support linkage is itself an assertion; artifacts carry version/date and may have objective or judgment-based properties. | Full normative OMG specification verified. |
| Gotel & Finkelstein, [An Analysis of the Requirements Traceability Problem](https://discovery.ucl.ac.uk/id/eprint/749/1/2.2_rtprob.pdf), §§5.1-5.4 and 6-8 | Traceability follows a requirement forward and backward through origin, production, specification, deployment and change; pre-RS and post-RS traces have different needs; documentation does not guarantee currency; ownership/context drift matters. | Full primary empirical paper verified. |
| [NASA Systems Engineering Handbook Rev.2](https://www.nasa.gov/wp-content/uploads/2018/09/nasa_systems_engineering_handbook_0.pdf), pp.107-108; [V&V appendix](https://www.nasa.gov/reference/system-engineering-handbook-appendix/) §§4-7 | Verification records bind requirement/version, product/tool/environment versions, method, results and discrepancies; completion requires objective compliance evidence or waiver plus discrepancy closure; verification, validation, certification and acceptance testing are distinct. | Full official primary handbook verified. |

## 4. Artifact-kind `ClosureProfile` obligations

| Artifact kind | Artifact-quality obligations | Evidence/satisfaction obligations | Transition and authority ceiling |
|---|---|---|---|
| `Definition` | Stable ID/term/status; one normative voice plus noncontradictory plain/domain voices; notation meanings; boundaries/exclusions; provenance; consumers; index; drift/challenge route; no circular definition chain without a grounded term. | Structure/link audit, semantic review, index/drift evidence, unresolved-term and conflict report. | `candidate -> canonical` requires Definitions Governance. A usable candidate is not canonical. |
| `Criterion` | Named subject and scope; observable or judgment question; predicate; method; threshold; verdict domain; timing/version; criticality; evidence class; owner; accepted alternative and N/A rule. | Evaluation record bound to the exact subject/baseline. Human criteria require a named reviewer/study, not a proxy pass. | Evaluator decides the predicate only within the profile; criterion author/decision owner changes its meaning. |
| `Requirement` | Unique identity; normative statement; source/rationale; scope; feasibility posture; verification method; validation intent; dependencies/conflicts; bidirectional pre/post traces; version/change owner. | Later satisfaction requires test, analysis, inspection, demonstration, human validation, or an expressly allowed method, plus anomaly/waiver disposition. | Requirements/spec owner accepts the artifact; verification owner records satisfaction; customer/product authority accepts deviations. Neither implies release. |
| `DefinitionOfDone` | Product/increment applicability; current version; explicit quality measures; nonrecursive measures; organizational minimum where applicable; shared multi-team form; evidence per measure; owner. | Every current measure has compatible evidence; Increment is usable; unsupported “all checks passed” or self-attestation fails. | Developers conform and Scrum Team/organization owns the DoD. Meeting it creates a Done Increment, not a release decision. |
| `Architecture` | Exact AD identity distinct from entity; scope; stakeholders/concerns; viewpoints/model kinds; decisions/rationale; requirement traces; conformance rules; unresolved tensions. | Structural conformance plus concern-specific analysis/review evidence. System adequacy needs separate evaluation. | Architecture owner/review gate accepts the AD. ISO 42010 conformance cannot certify the entity or release it. |
| `Design` | Bound requirements/architecture; alternatives and rationale; interfaces; constraints; risks; assumptions; validation plan; implementation mapping; open decisions. | Review, prototype, analysis or test evidence appropriate to the design claim; unresolved consequential alternatives block selection. | Design owner/Decision Gate selects. Selection is not implementation; implementation success does not rewrite rationale. |
| `UXPlan` | Users/context; research questions/hypotheses; measures and thresholds; participant/sample plan; accessibility duties; deterministic versus human evidence boundary; ethics/privacy; stop criteria; owner. | Deterministic inspection/browser evidence only for deterministic claims; comprehension, preference and usability need human evidence where claimed. | UX/research owner approves the plan; findings owner accepts study evidence; product owner decides product consequence. Plan closure is not usability truth. |

Compatible evidence classes should be explicit:

```text
E0 provenance/source
E1 schema/structure
E2 semantic consistency or expert review
E3 traceability/coverage
E4 executable verification: test, analysis, inspection, demonstration
E5 human review/judgment
E6 empirical human or field study
E7 waiver/risk/anomaly disposition
A0 authority decision/approval   # separate from truth evidence
```

There is no universal evidence-class ranking. Compatibility, independence, freshness, required multiplicity and accepted alternatives belong to the artifact/transition profile.

## 5. Lifecycle, owner and authority mapping

| Concern | Computed or recorded by | What it may establish | What it cannot establish |
|---|---|---|---|
| Artifact authoring quality | Artifact-kind owner plus validators/reviewers | Conformance, coherence, trace completeness | Satisfaction, approval, execution |
| Evidence production | Test/analysis/review/study/source owner | A result under named method, inputs and conditions | Authority or transition by itself |
| Evidence sufficiency | Named `ClosureProfile` evaluator or assurance reviewer | Whether allowed evidence covers the scoped claim | Truth outside scope; owner approval |
| Readiness projection | WPRA-like read-only evaluator | Frozen-input contractual admission with complete reasons | Selection, mutation, repair, promotion |
| Consequential approval | Decision Gate/human or domain authority owner | Permission for the named transition and exact baseline | Repair stale/missing evidence |
| Execution completion | Task Session / execution owner | Bounded work executed and validated | Promotion, publication, release |
| Closeout synchronization | Continuation Router + Invoke Refresh owner | Receipt-backed evidence/status/route bookkeeping | New work or authority movement |
| Semantic/authority promotion | Definitions, constitution, spec, pattern or other narrow owner | Local authority effect in its declared surface | Production deployment or release |
| Release/deployment | Product/release/deployment authority | Delivery or exposure under release policy | Retroactive artifact quality or proof |

A `WayClearReceipt` should therefore contain exact artifact/profile/evaluator versions and digests, closure scope, obligation results, evidence references/classes/digests, contradictions, owner requirements, component verdicts, every reason code, evaluation time, and `authority_effect: none`.

Minimum reason families:

```text
PROFILE_UNKNOWN
SCOPE_UNKNOWN
MISSING_OBLIGATION
UNDECIDABLE_CRITERION
EVIDENCE_MISSING
EVIDENCE_INCOMPATIBLE
EVIDENCE_STALE
TRACE_BROKEN
CONFLICT_OPEN
HUMAN_JUDGMENT_REQUIRED
VALIDATION_NOT_RUN
WAIVER_UNDISPOSITIONED
OWNER_MISSING
APPROVAL_MISSING
DEPENDENCY_NOT_READY
BASELINE_DRIFT
SUPERSEDED
OUT_OF_SCOPE
```

## 6. Staleness and invalidation

- Bind every receipt to artifact digest/version, profile version, evaluator version, source baseline, evidence digests, dependency versions, owner/authority identity, scope, and evaluation time.
- Semantic changes to objective, criterion, requirement, DoD, architecture/design disposition, owner, dependency, evidence method, threshold, validator, runtime/environment, risk, budget, authority class or release boundary invalidate only the affected component first; the transition becomes blocked if that component is critical.
- Evidence expiry, source retraction, counterevidence, an unresolved anomaly, changed operating context, changed human population, or superseding authority changes `satisfied -> stale/unknown`, never silently to pass.
- Approval is baseline-specific. It cannot repair an invalidated binding; re-evaluation and, where required, re-approval are separate.
- Equivalent regeneration may preserve a component only when canonical semantic inputs and evaluator version are pinned and an equivalence receipt proves preservation.
- Superseded artifacts and old receipts remain append-only historical evidence but do not guide new work unless a profile explicitly evaluates the historical baseline.
- `out-of-scope` must carry the explicit scope rule that excludes the item. Missing unrelated knowledge must not block.
- A stale result should retain its prior observed verdict plus `current_verdict: stale`, the invalidating change, affected obligations, and next owner. Do not rewrite history.

## 7. False-clear and false-block cases

| Case | Failure |
|---|---|
| Definition has three headings but no normative boundary, canonical owner, index or drift route. | False clear |
| Criterion says “tested” or “acceptable” without observable, method, threshold or evidence class. | False clear |
| Requirement has `shall` wording but no source, verification path, trace or change baseline. | False clear |
| DoD includes “meets the DoD,” “all work complete,” or an unspecified/stale test suite as its own proof. | False clear |
| AD contains diagrams but omits concern/viewpoint/decision coverage; ISO 42010 structural conformance is treated as system adequacy. | False clear |
| Design is implemented, so rationale and requirement binding are assumed satisfied. | False clear |
| UX browser checks are used to claim comprehension, preference or usability. | False clear |
| Inventory/index row or previous clear receipt is treated as current source evidence or promotion. | False clear |
| Empty obligation set, unknown-as-pass, missing criticality, or approval-as-evidence causes clear. | False clear |
| A missing ontology node outside the declared closure scope blocks a transition. | False block |
| A profile-authorized equivalent evidence method passes but the evaluator accepts only one hard-coded method. | False block |
| Named noncritical residue incapable of falsifying a criterion blocks completion. | False block |
| Semantically equivalent regeneration with a valid equivalence receipt is rejected only because bytes changed. | False block |
| A superseded requirement outside the current baseline blocks satisfaction. | False block |
| A requirement artifact is blocked for lacking implementation evidence during a pre-implementation quality review. | False block |
| A Done Increment is blocked because release approval is absent, although release is not part of the DoD transition. | False block |

## 8. Universal versus profile-local split

Universal substrate:

- typed artifact and statement kinds;
- immutable identity/version/digest;
- named transition and closure scope;
- explicit obligations and criticality;
- typed evidence and support relation;
- owner and authority-effect separation;
- dependency, trace, contradiction and invalidation relations;
- `satisfied/unsatisfied/unknown/not-applicable/stale/superseded`;
- reason-complete, no-early-exit receipt;
- append-only historical results;
- query purity and `authority_effect: none`;
- non-collapse among quality, evidence, approval, execution, promotion and release;
- anti-circular support rule.

Profile-local semantics:

- exact quality attributes and required fields;
- observables, thresholds and verdict algorithms;
- acceptable evidence classes, independence and alternatives;
- human-review/study requirements;
- expiry windows and invalidation triggers;
- critical versus noncritical classification;
- required owner roles and approval sequence;
- open-world versus declared-closed-world boundary;
- waiver/risk policy;
- lifecycle state names;
- whether a particular transition requires artifact quality, satisfaction, approval, execution, promotion or release components;
- product, organization, domain, safety, accessibility and regulatory rules.

Thus the universal relation is not “artifact is clear.” It is “this exact query has a complete, evidence-bound result under this named profile.” The transition profile determines whether that result is sufficient to proceed.

## 9. Blockers and residue

- ISO/IEC/IEEE 29148:2018’s exact normative characteristics and acceptance clauses were not accessible without purchase. Only official abstract-level claims are verified; do not import a remembered characteristic list as standard proof.
- The current local authority material has live semantic drift: `AUTHORITY-MODEL.md:105-120` presents `invariant -> axiom -> constitution`, while active `CAV2-D54` presents `axiom -> invariant -> constitution -> validator`. `CAV2-D54` also cites `CAV2-D34` as constitution although current `CAV2-D34` is Authority. Definitions Governance must resolve this before that chain becomes a closure invariant.
- `ontology/LIFECYCLE-MODEL.md` is explicitly candidate-only; no live lifecycle schema, movement-edge law or authority-ledger validator exists.
- The WPRA objective-execution extension and its adversarial fixtures are precedent/design evidence, not evidence of this seven-kind closure model being implemented or executed.
- No current canonical term, ontology, validator, finite seven-kind witness or owner approval exists for `Ontological Way Clear`.
- Architecture, design and UX obligation details above are lifecycle-facing minimums; the dedicated architecture/design/UX explorer should supply their stronger evidence-specific profiles.
- Scrum’s DoD semantics are profile-local to Scrum product increments and must not be universalized to all artifacts.
- Gotel/Finkelstein is primary empirical traceability evidence, but from 1994; it supports the pre/post trace and social-ownership distinctions, not a current normative standard.
- No implementation, canonical ontology, definition promotion, approval, publication, release, deployment or production-readiness claim is made.

## Agent 3 — Architecture, design, and UX evidence

## 1. Action receipt

- `action_id`: `spawn-0003`
- `dispatch_id`: `2026-07-31-ontological-way-clear-artifact-readiness`
- `run_id`: `ontological-way-clear-20260731T153840`
- `wave` / `step`: `explorers` / `s1`
- `identity`: Alexander, Christopher
- `role`: `architecture-design-ux-explorer / explorer`
- `capability`: `research`
- `status`: `completed-read-only`
- Mutation: none
- Delegation: none

## 2. Concise answer

A generic Ontological Way Clear model is defensible in this lane only as a bounded, reason-complete query over three distinct, named ClosureProfiles: `Architecture`, `Design`, and `UXPlan`. It must not be a universal completion checklist.

The machine can close syntax, identity, traceability, declared coverage, executable correspondence rules, digests, freshness, deterministic prototype behavior, and the presence and scope of owner/human receipts. It cannot independently close:

- whether all material stakeholder concerns were found;
- whether a decision or trade-off is acceptable;
- whether residual risk is tolerable;
- whether a visual composition communicates effectively;
- whether intended users comprehend a design;
- whether an interface is usable in its context of use;
- or whether a limited study generalizes.

Those require named architecture/design/UX owners, expert or screenshot review, representative human study, or typed residue. The evaluator may verify that a signed, scope-bound judgment exists; it must not reinterpret that judgment as machine-derived truth.

“Clear” therefore needs a query scope:

```text
artifact-internal closure
  != evidence-supported claim
  != owner acceptance
  != transition admission
  != implementation completion
  != promotion or release
```

The live OEW file is especially instructive: despite its filename, it declares itself “discovery-mode Design; not normal Design admitted,” blocks before Plan, and has no authority effect. Its architectural views do not change the declared artifact kind. Its presentation groupings do not establish ontology membership.

## 3. Evidence table

### Local evidence

| Source and exact selector | Digest | Observed evidence | Proof status |
|---|---|---|---|
| `cyberAlchemy-v2/development/research/2026-07-31-ontological-way-clear-artifact-readiness/dispatch-sheet.json`; `/goal`, `/context`, `/groups/0/agents/2`, `/connections` | `b5e49e809567b30f9072948b872dc56329d76622b5ea3dc2507e7b357ac5cc83` | Requires artifact-kind distinctions, evidence classes, human-evidence ceilings, portability limits, and no promotion claims. | Observed; authority for this research action, not ontology meaning. |
| Adjacent `strategy-inventory-packet.json`; `/selected_entries/6`, `/unresolved_gaps`, `/design_consequences`, `/residue`, `/non_authority_notice` | `7463fef195d05d9efec34faba1d8bf0f0d46284c1479501cdaf3712cf1542b74` | Selects explicit browser/screenshot/human/owner evidence separation; recommends kind-specific profiles and flags missing cross-family witness and approval. | Observed discovery lead only; explicitly non-authoritative. |
| `cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/design/ARCHITECTURE.md:3-28` | `e1140e33c6cc1919d3b02d36ec5975046db020004cd2ab9b698c3e0f7c5d1b1e` | Declared discovery-mode Design, blocked before Plan; bounded first proof; Path is a dependent second unit. | Observed live artifact; candidate/discovery evidence, not admitted Design or Plan. |
| Same file, lines 56-66 and 91-98 | same | Source owners retain meaning; projections are read-only; states bind snapshot, filter, rule/version, digests, and completeness qualifier; navigation must be reversible. | Observed candidate obligations; several are deterministically checkable. |
| Same file, lines 102-159 | same | Explicit owner split; source and graph identities remain separate; projection authority is always `none`; icon/grouping must not encode ontology state or authority. | Observed candidate architecture/design contract. |
| Same file, lines 212-240 and 267-314 | same | Traversal prerequisites, declared projection scope, stale-on-filter-change behavior, canonical navigation-frame serialization, and no-write promotion boundary. | Observed candidate deterministic closure surface. |
| Same file, lines 316-335 | same | Concerns map to accountable, contributing, and validator owners; missing successor Define, manifest, denominator receipt, and selection block Plan. | Observed lifecycle boundary; concern table is expressly not a selection result. |
| Same file, lines 409-437 and 455-470 | same | Deterministic scenario and recovery expectations coexist with a separate later browser validator and human-study owner; no Work Pack, task, implementation, or Plan handoff is authorized. | Observed evidence-class and authority separation. |
| `.arcanum/inventory/entries/body-war-oew-ux-ui-quality-loop-review-strategy-result-synthesis.md:54-59,96-127,129-143` | `a20ad3e96aee86a40d4c6563a32b3efd772a3cddcdfc9d6cd7c5dc4228e47494` | Separates hard browser gates, soft flags, screenshots, human-study residue, and owner judgments; rejects a universal UX score; reuse remains uncalibrated. | Observed Inventory projection only; proposal not confirmed or executed. |

### External primary or official evidence

| Primary source and selector | Evidence | Proof status |
|---|---|---|
| [ISO/IEC/IEEE 42010:2022 official record, Abstract](https://www.iso.org/standard/74393.html) | Distinguishes the architecture of an entity from an architecture description; specifies structure/expression and conformance for descriptions, viewpoints, and model kinds; does not specify the entity, architecting process, methods, tools, or recording format. | Current official abstract observed. Full normative clauses were not accessible, so clause-level conformance is unverified. |
| [ISO/IEC/IEEE 42010 conceptual model, “AD Elements and Correspondences” and “Architecture Decisions and Rationale”](https://www.iso-architecture.org/ieee-1471/cm/) | Stakeholders, concerns, viewpoints, views, model kinds, correspondences/rules, decisions, alternatives, and rationale are distinct related elements. Correspondence rules can express consistency, traceability, dependency, constraint, and obligation. | Current supporting material observed through indexed primary standard-site content; not substituted for the licensed normative text. |
| [ISO 9241-210:2019 official record, Abstract](https://www.iso.org/standard/77520.html) | Human-centred design supplies principles and activities throughout the interactive-system lifecycle and supports conformance claims, while not prescribing detailed methods or all project management. | Official abstract observed; version confirmed current in 2025. Detailed requirements unverified. |
| [ISO 9241-11:2018 official record, Abstract](https://www.iso.org/standard/63500.html) | Usability is an outcome of use, not a property established merely by document or code structure. | Official abstract observed; version current. Exact contextual measures require the licensed text or a declared project method. |
| [W3C WCAG 2.2 Recommendation, Introduction and §5.2](https://www.w3.org/TR/WCAG22/) | WCAG is testable through a combination of automated testing and human evaluation. Conformance applies to full pages and complete processes; levels must be met in full and supported technology use matters. WCAG also states that not all user needs are covered. | Normative Recommendation observed. Supports scoped accessibility assertions, not universal usability/comprehension claims. |
| [W3C WAI, Evaluating Web Accessibility, Introduction](https://www.w3.org/WAI/test-evaluate/) | No tool alone determines accessibility; knowledgeable human evaluation is required. | Current official W3C guidance observed. |
| [W3C WAI, Involving Users in Evaluating Web Accessibility, “Combine User Evaluation with Standards” and “Drawing Conclusions and Reporting”](https://www.w3.org/WAI/test-evaluate/involving-users/) | User evaluation finds issues missed by conformance review, but user testing alone does not establish WCAG conformance. Reports must state method, participant characteristics, and scope; small samples must not be generalized. | Current official W3C guidance observed. |
| [MacLean et al., “Questions, Options, and Criteria,” DOI 10.1080/07370024.1991.9667168](https://doi.org/10.1080/07370024.1991.9667168), Abstract | QOC records design questions, options, assessment criteria, justifications, and possible alternatives as a design coproduct. The authors explicitly characterize reuse/redesign benefits as goals rather than fully achieved empirical results. | Primary design-rationale paper observed through author-uploaded full text/metadata. Supports representation obligations, not proof that a chosen design is correct. |
| [Vigo, Brown, Conway 2013, DOI 10.1145/2461121.2461124](https://doi.org/10.1145/2461121.2461124), Abstract, study results, limitations, conclusion | Empirical comparison of six WCAG 2.0-era tools found narrow coverage, missed violations, and false-positive trade-offs; automated tests could not replace expert/user evaluation. | Primary empirical study observed. Historical and fixture/tool-specific; it proves an automation ceiling, not current tool accuracy. |

## 4. Kind-specific ClosureProfiles

### `ArchitectureClosureProfile`

Artifact meaning: a description of an entity’s architecture organized to address stakeholder concerns through declared viewpoints/views and relations. It is not the entity, its implementation, or an arbitrary collection of design screens.

Required closure obligations:

- entity of interest, environment, scope, version, owner, and lifecycle state identified;
- stakeholders or stakeholder classes and material concerns identified;
- every in-scope concern covered by at least one declared viewpoint/view or explicitly typed as unresolved, deferred, accepted risk, or out of scope;
- viewpoints identify their conventions/model kinds and the concerns they frame;
- views/models conform structurally to their viewpoints;
- correspondences, dependencies, constraints, conflicts, and traceability are explicit;
- key architecture decisions link affected elements, alternatives, rationale, risks, and decision owner;
- relevant requirements and quality concerns trace to architectural dispositions;
- unresolved contradictions and risk acceptance have named owners and expiry/revisit conditions;
- exact source identity, version/digest, evidence scope, freshness, and authority effect are present.

Machine-closeable: required-field presence; unique/referential identities; concern-to-view coverage under declared scope; executable correspondence rules; dependency cycles where prohibited; digest/freshness checks; decision-to-element and requirement-to-disposition trace presence.

Review/owner closure: materiality of concerns; suitability of viewpoints; adequacy of rationale; acceptable consistency exceptions and residual risk; whether the description is sufficient for the named transition.

Result ceiling: “architecture description internally closed for profile X” or “transition evidence assembled.” Never “the architecture is correct.”

### `DesignClosureProfile`

Artifact meaning: the structured selection and elaboration of solution choices under requirements, architecture constraints, context, and trade-offs. It can refine architecture but is not interchangeable with it.

Required closure obligations:

- design intent, bounded problem/question, users or consumers, and constraints identified;
- alternatives/options recorded or a reason supplied for why the decision is constrained to one option;
- selection criteria and evidence linked to each material option;
- chosen option and rejected/deferred alternatives carry rationale;
- requirements, architecture decisions, concerns, interfaces, and risks trace to design dispositions;
- prototypes/representations have exact version/digest and declared fidelity;
- invariants and expected behavior are testable where appropriate;
- visual/perceptual claims identify screenshot or expert-review obligations;
- open decisions, trade-offs, and downstream validation obligations are typed;
- accountable design owner and approval scope are explicit.

Machine-closeable: graph/link integrity; missing option/criterion/rationale detection; requirement and architecture trace coverage; prototype digest; executable invariants; deterministic unit/browser behavior; stale-evidence invalidation.

Review/owner closure: trade-off adequacy; visual hierarchy/coherence; whether alternatives were sufficiently explored; acceptability of known risks. Screenshot review can support visual claims but cannot establish comprehension or usability.

Result ceiling: “design reasoning package complete for transition/profile X.” Not “users will understand it” and not implementation completion.

### `UXPlanClosureProfile`

Artifact meaning: a prospective, scoped plan for obtaining human-centred, usability, and accessibility evidence about a design/prototype. It is not the findings and does not itself prove usability.

Required closure obligations:

- target populations, context of use, representative tasks, inclusion/exclusion boundaries, and accessibility-relevant characteristics declared;
- research questions or hypotheses linked to design claims/risks;
- prototype/build and scenario versions pinned;
- method, recruitment, sample rationale, assistive technologies, languages, environments, ethics/privacy, and data handling declared;
- measures identify construct, collection method, unit, analysis, and decision threshold or qualitative interpretation;
- accessibility target identifies WCAG version/level, full-page/process scope, relied-on technologies, and automated/manual/user evaluation split;
- human-evidence ceilings and non-generalization statements explicit;
- findings owner, analysis owner, decision owner, and rerun/invalidation policy named;
- open human-study work is represented as a future evidence obligation, not silently marked satisfied.

Machine-closeable: plan-schema completeness; question-to-measure and scenario-to-task links; pinned artifact identity; instrumentation integrity; WCAG rules that are deterministically testable; recruitment/consent artifact presence; report scope and digest.

Human closure: comprehension, information scent, task strategy, mental model, satisfaction, preference, perceived trust, and accessibility-in-use. Expert accessibility review and participant evidence are complementary; neither alone proves the other.

Result ceiling: before execution, “UX plan executable and evidence-bounded.” After execution, a separate findings/evidence query may judge whether scoped claims are supported. Blocking a plan merely because its future study has not yet run is a false block.

## 5. Cross-artifact relation candidates

| Candidate relation | Domain → range | Closure effect |
|---|---|---|
| `addresses` | ArchitectureView → Concern | Required coverage edge; presence machine-checkable, adequacy reviewed. |
| `governedByViewpoint` | ArchitectureView → ArchitectureViewpoint | Enables structural conformance checks. |
| `frames` | Viewpoint → Concern | Keeps viewpoint conventions distinct from concern content. |
| `correspondsWith` / `governedByCorrespondenceRule` | AD element ↔ AD element / rule | Supports executable consistency and traceability checks. |
| `decisionAffects` | ArchitectureDecision → AD element | Connects decisions to described structure/behavior. |
| `consideredAlternative` / `selectedAlternative` | Decision → Alternative | Detects unreasoned single-solution declarations. |
| `rationaleFor` | Rationale/Evidence → Decision | Presence is machine-checkable; persuasiveness is not. |
| `constrainedBy` | Design → Requirement or ArchitectureDecision | Prevents Design from silently redefining upstream intent. |
| `refines` | Design → Architecture element | Refinement, not identity or authority inheritance. |
| `realizedBy` | Design → Prototype | Pins the object tested or reviewed. |
| `evaluates` | UXPlan → Design/Prototype | Separates planned evidence collection from the design itself. |
| `asksAbout` | ResearchQuestion → Claim/Risk | Prevents generic, untargeted studies. |
| `operationalizedBy` | ResearchQuestion → Measure | Machine-checkable trace; construct validity remains reviewed. |
| `observedIn` | HumanFinding → StudyRun/Population/Context | Enforces evidence scope and non-generalization. |
| `supports` / `challenges` | Evidence → Claim | Does not mean proves, approves, promotes, or satisfies. |
| `verifiedBy` | Assertion → Test/Review/Study receipt | Evidence-class and freshness must be explicit. |
| `acceptedBy` | Residue/Risk/Decision → OwnerDecision | Machine verifies receipt; owner supplies judgment. |
| `invalidatedBy` | Evidence/Receipt → source or scope drift | Prevents stale clear results. |

No relation should copy source authority into a presentation or closure projection.

## 6. Evidence classes

| Class | Examples | Machine role | Claim ceiling |
|---|---|---|---|
| `deterministic-structural` | schema, identity, links, coverage matrices, digests, scope fingerprints | Execute and close | Structure/trace exists and is current. |
| `deterministic-behavioral` | unit tests, route derivation, Back/focus restoration, browser selectors, contrast calculation | Execute and close exact assertion | Observed behavior in pinned environment. |
| `expert-review` | architecture adequacy, rationale quality, accessibility manual review | Validate signed scope/receipt only | Named reviewer judgment. |
| `screenshot-review` | hierarchy, clipping, density, visual ambiguity across pinned viewports/themes | Bind images and review findings | Visual evidence only; no interaction or comprehension proof. |
| `standards-conformance` | WCAG scoped evaluation combining applicable automated/manual evidence | Aggregate exact criteria and scope | Conformance only for named pages/processes/version/level. |
| `human-study` | task completion, comprehension, mental models, qualitative findings, satisfaction | Validate protocol/run/report binding | Findings for declared participants, tasks, context, and method. |
| `owner-decision` | alternative selection, risk acceptance, stage admission | Verify identity, authority, scope, expiry | Authorized judgment, not empirical truth. |
| `explicit-residue` | deferred study, unresolved concern, accepted limitation | Enforce reason code, owner, next action, expiry | Honest non-closure or profile-local deferral. |

Residue is non-blocking only when the named profile explicitly permits deferral and a competent owner accepts it with scope, next owner, and expiry. Otherwise it blocks.

## 7. Negative examples and error cases

| Artifact | False clear | False block |
|---|---|---|
| Architecture | Every concern has a syntactic view edge, but the view does not materially address it; an unresolved tension is hidden; a route projection is treated as an ontology branch; stale views retain a clear receipt. | Requiring every conceivable concern to be resolved; blocking an accepted, explicitly bounded residual risk; requiring implementation/human-study results when the query is only architecture-description completeness. |
| Design | A selected screen exists with no alternatives, criteria, rationale, or upstream trace; compilation/browser pass is treated as design validity; a screenshot is treated as comprehension evidence. | Requiring an exhaustive design space; rejecting a genuinely constrained single option despite recorded justification; requiring a user study for an internal lossless adapter mapping with no human-facing claim. |
| UXPlan | Questions exist but have no target population, tasks, measures, analysis, accessibility scope, or evidence ceiling; automated checks are called full accessibility; two participants are generalized to all users. | Marking a complete prospective plan blocked because the planned study has not occurred; demanding statistical significance for an explicitly formative qualitative study; treating every deferred human question as blocking even when outside the transition profile. |

A further cross-kind false clear is treating a `clear` receipt as owner approval, promotion, release, or production readiness. A cross-kind false block is propagating an out-of-scope or superseded node into the current closure denominator.

## 8. Portability and boundary limits

- The OEW architecture/design evidence and Body War identifiers are private under `cyberAlchemy-v2`. They must not be copied into public Arcanum.
- A future public candidate could contain only separately approved, scrubbed generic contracts such as evidence-class names, profile interfaces, reason codes, and receipt shape. This research does not authorize that extraction.
- ISO/IEC/IEEE 42010 provides a portable architecture-description vocabulary, not a portable concern set, view set, risk threshold, or acceptance decision.
- QOC provides a reusable rationale representation, not proof that alternatives are exhaustive or a choice is sound.
- ISO 9241 and WCAG provide reusable human-centred/accessibility frames, but populations, languages, assistive technologies, tasks, measures, environments, and policy targets remain profile-local.
- Vigo et al.’s 2013 figures must not be projected onto current tools; only the demonstrated automation ceiling is safely reusable.
- Presentation groupings, colors, icons, portal cards, routes, and file names never establish ontology membership or artifact kind.
- The OEW projection remains read-only with `projectionAuthorityEffect: "none"`.

## 9. Blockers and residue

- The full licensed ISO/IEC/IEEE 42010:2022 and ISO 9241 normative clauses were not accessible; clause-level conformance obligations remain unverified.
- No admitted `UX-PLAN.md` or `VALIDATION-CONTRACTS.md` contents were inspected; the architecture references them but does not prove their completeness.
- The OEW artifact remains discovery-mode Design, blocked before Plan by the missing approved successor Define, exact manifest, denominator receipt, and fixed-point selection.
- The selected UX audit is still a proposal: confirmation, registration, execution, post-update rerun, calibration, and human comprehension evidence are absent.
- Inventory coverage is partial, carries 125 uncontrolled-tag warnings, and does not index the completed Way Clear experiment.
- No finite witness currently spans Architecture, Design, UXPlan, and the other four artifact families with discriminating false-clear/false-block mutations.
- No owner has approved `Ontological Way Clear`, these ClosureProfiles, or the relation set as canonical ontology or vocabulary.
- Current WCAG target, evaluator competence, study population, measures, risk tolerances, and residue-acceptance owners remain profile-local decisions.
- No implementation, validation execution, canonical ontology, promotion, public extraction, release, or production readiness is established by this return.

## Connections

- `derives` → `./findings.md`
