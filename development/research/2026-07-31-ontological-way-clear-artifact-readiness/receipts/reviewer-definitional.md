## Action / status

`spawn-0007` completed read-only. I reviewed the full admitted synthesis artifact and used `research.md` only to verify its cited evidence. No mutation, browsing, delegation, promotion, or authority action occurred.

## Bottom-line soundness verdict

**PASS-WITH-DEFINITIONAL-REPAIR.**

EBCQ is more than a renamed readiness checklist because it binds an exact selector, profile, evidence baseline, scope, relation directions, evaluator, semantic bounds, completeness declarations, and transition; traverses typed relations; evaluates each applicable clause; and emits a reason-complete immutable receipt. These have observable query behavior, including false-clear/false-block mutants and traversal/currentness failures. [synthesis lines 155–214, 248–292, 424–462]

It nevertheless remains checklist-like at the seven profile leaves: most profile clauses are obligation lists, and none has been executed. That is acceptable only if the ontology calls the kernel a **bounded evidence/admission evaluation**, not “closure” in a way that suggests completeness, readiness, or lifecycle movement. “Closure” is especially hazardous because `CLEAR` requires complete evaluation only over a declared finite scope, not ontological completeness. [synthesis lines 102–116, 214, 261–274, 402, 426]

Recommended name: **Evidence-Bound Admission Query (`EBAQ`)**. If the query has no named transition, use **Evidence-Bound Conformance Query** as its purpose, not “admission.” Retain `Ontological Way Clear` only as a legacy UI/result label.

## Disposition table

| Candidate | Disposition | Definitional finding |
|---|---|---|
| `Evidence-Bound Closure Query` | **RENAME** | Real bounded query, but “closure” overclaims finite profile evaluation. Its bindings and traversal distinguish it from a checklist. [46, 155–214, 248–292] |
| `Ontological Way Clear` | **RENAME** | Compatibility label only; cannot name the ontology or imply ontological completeness. [36–50] |
| `Artifact` | **DEFER** | No selected owner and prior research rejected the universal governed-artifact primitive. Correctly unnecessary to the query. [50, 57, 71] |
| `EvaluatedResource` + `ArtifactVersion` | **MERGE/RENAME** | Two universal-carrier candidates recreate `Artifact` indirectly. Use one query-local `ResourceSnapshot` record, not an ontology superclass. [72–73] |
| `ArtifactKind` | **RENAME** | `ResourceKind` avoids presupposing `Artifact`. It selects profile semantics; it is not inferred from presentation. [74, 100] |
| `ArtifactRole` | **RENAME** | `EvaluationRole`; selector/query-relative, not intrinsic kind or statement type. [75, 58] |
| `StatementKind` | **KEEP** | Proposition-level semantic typing, owned by the source/profile domain. It is orthogonal to resource kind and evaluation role. [76, 100] |
| `Obligation` | **KEEP** | Profile-evaluable normative condition. Not every statement or claim is an obligation. [77] |
| `Claim` | **KEEP** | Truth-apt proposition with independently recordable support/refutation. [79, 296–305] |
| `Evidence` | **KEEP** | Immutable scoped support/challenge record; neither claim, approval, nor authority. [80, 221–226] |
| `Decision` | **KEEP** | Owner judgment with scope, authority basis, expiry, and challenge route. Approval is one qualified decision effect, not evidence sufficiency. [78, 222] |
| `EvidenceClass` | **DEFER** | Compatibility taxonomy is useful, but classes, substitutions, independence, and expiry need profile owners. [81, 116, 493] |
| `LifecycleState` | **DEFER** | External authoritative state; executable schema and movement-edge laws are absent. [84, 223–226, 489] |
| `ClosureProfile` | **RENAME/DEFER** | `EvaluationProfile`; immutable purpose-specific contract. Seven proposed instances survive only as candidates pending owners and fixtures. Universal profile is definitionally collapsed and correctly killed. [95, 102–116] |
| `ClosureQuery` | **RENAME** | `EvidenceBoundQuery`; pure evaluation invocation. [96, 155–214] |
| `WayClearReceipt` | **RENAME** | `EvaluationReceipt`; `CLEAR` may remain a verdict value. Receipt carries no authority or movement. [98, 276–292] |
| Bare `Satisfies` edge | **KILL** | Definitionally collapses assertion, method, evidence, profile, and baseline. Keep only reified `SatisfactionClaim`. [89] |
| `Refines == Satisfies`; `Covers == Satisfies` | **KILL** | Tautological/collapsed candidates; synthesis correctly rejects them. [88–90, 100] |
| Receipt → approval/completion/promotion/release | **KILL** | Collapses computed evaluation with separately owned decisions and states. [220–246, 289–292] |
| `CompletenessDeclaration` | **DEFER** | Real local relation, but issuer trust, query pattern, expiry, and invalidation law remain unowned. [86, 488] |

## Smallest repaired vocabulary

Use only:

- `ResourceSnapshot`: exact resource ID, selector, version/revision, digest, media type, currentness links. Query-local record, never a universal ontology class.
- `ResourceKind`: owner-declared family that selects an `EvaluationProfile`.
- `EvaluationRole`: participation of a selector in this query/relation.
- `Statement` + `StatementKind`.
- `Obligation`: profile clause applicable to a subject.
- `Claim`: proposition evaluated paraconsistently.
- `EvidenceRecord`: scoped, typed, current support or challenge.
- `OwnerDecision`: scoped judgment; `ApprovalDecision` is a qualified subtype/effect.
- `ScopeDeclaration`; optional `CompletenessDeclaration`.
- `EvaluationProfile`.
- `EvidenceBoundQuery`.
- `ComponentVerdict`, `Reason`, `EvaluationReceipt`.
- External references only: `LifecycleState`, execution receipt, promotion record, release record.

No `Artifact`, `EvaluatedResource`, `ArtifactVersion`, `AuthorityEffect` entity, or freestanding universal “readiness” type is required. `authorityEffect: none` should remain a receipt invariant field, not invite a receipt-owned authority taxonomy.

## Relation laws

1. `hasKind(ResourceSnapshot, ResourceKind)` selects applicable profile semantics; it does not confer authority.
2. `playsRole(selector, EvaluationRole, query)` is query-relative and never implies kind.
3. `expresses(resource, Statement)` and `classifies(Statement, StatementKind)` do not imply obligation.
4. `imposes(profile, Obligation)` plus `appliesTo(obligation, subject, scope)` creates evaluability; it does not assert satisfaction.
5. `supports/challenges(EvidenceRecord, Claim)` changes evidence state only.
6. `satisfactionClaim(subject, obligation, method, evidence, profile, baseline)` is reified; no bare truth edge.
7. `covers` means addressed scope only; `refines` means added precision only.
8. `conflictsWith` is symmetric, irreflexive, non-transitive.
9. `blockedBy` is derived from an applicable critical component result; it is not authored state or authority.
10. `invalidatedBy` changes current admissibility, not historical truth.
11. `admits(query, transition)` is a computed projection only; `moves(ownerDecision, lifecycleState)` belongs to the lifecycle owner and is outside EBAQ.
12. Every surviving type/relation must name: semantic owner, invariant, characteristic failure, required evidence artifact, and observable receipt consequence. Until profiles instantiate those five fields, they remain proposed.

## Seven-profile non-collapse audit

| Profile | Distinct invariant / failure / evidence / consequence |
|---|---|
| Definition usability | Grounded, bounded meaning; circular/ambiguous definition; semantic/index review; candidate usable, not canonical. |
| Criterion executability | Observable or judgment method and interpretation; undecidable criterion; pinned test or qualified review; criterion executable, not subject satisfied. |
| Requirement acceptance | Scoped normative statement and traces; broken verification/trace; owner review/trace receipt; baseline accepted, not implemented. |
| DoD satisfaction | Independent terminal evidence for a bounded increment; circular self-certification; tests/reviews/waivers; Done under exact DoD, not released. |
| Architecture admission | Concern/view/correspondence/decision integrity; hidden tension or stale view; structural checks plus owner risk judgment; description admitted, not architecture/entity correctness. |
| Design selection | Alternatives or constrained-choice rationale and upstream trace; selected output without rationale; design review/prototype bindings; choice selected, not implemented or usable. |
| UX-plan run admission | Executable scoped study plan and human-evidence ceiling; automated evidence substituted for human claims; protocol/approval/instrumentation receipts; plan runnable, not findings or usability truth. |

These profiles do not collapse, but their candidate names inconsistently mix usability, executability, acceptance, satisfaction, selection, and admission. That inconsistency is healthy evidence that no universal “clear” predicate exists. [108–116, 444–452]

## State/reason non-collapse audit

- `unknown`: no qualifying support or refutation.
- `fog`: unknown plus an explicit unresolved-discrimination record.
- `open`: known applicable obligation not discharged; may remain unknown absent a failing witness/completeness declaration.
- `invalid`: currently ambiguous and therefore a blocker in the synthesis. Repair into:
  - `invalid_evidence`: evidence fails its method/schema/binding invariant;
  - `invalidated`: historical item removed from current admissibility by a typed invalidation event.
- `stale`: age or binding drift makes an otherwise historical record non-current.
- `superseded`: a version relation selecting a successor; not age, falsity, or invalidity.
- `blocked`: derived overall policy verdict caused only by definitive critical unsatisfaction.
- `out_of_scope`: applicability result licensed by an exact scope rule; never omission.
- `error`: evaluator/parser/canonicalization/resource failure; no semantic verdict.

The synthesis distinguishes all except `invalid`, which appears as `EVIDENCE_INVALID` and currentness `invalidated` but lacks an explicit component-state law. Add `INVALID` only at evidence/binding level, or map it deterministically to `ERROR` when evaluator-owned and `UNSATISFIED` when a profile-required evidence artifact is proven invalid. Do not leave both interpretations implicit. [231–266, 296–324, 346–389]

## Authority and claim ceiling

Maximum defensible claim:

> For the exact resource selector, snapshot, profile, evidence baseline, evaluator, declared finite scope, and named purpose/transition, every applicable clause was evaluated and the returned component/reason set is complete under that declaration.

It does **not** establish canonical vocabulary, truth outside scope, concern completeness, implementation completion, owner approval unless supplied as an external valid decision, lifecycle movement, promotion, publication, deployment, release, production readiness, or cross-carrier semantic identity. [32, 222–246, 276–292, 496–501]

## Blockers / residue

- Rename and carrier merge are required before vocabulary review.
- Define `invalid` versus `invalidated` and its aggregation law.
- Select owners for the kernel, each profile, completeness policy, and evidence compatibility rules.
- Execute the positive and discriminating mutant fixtures; current fixtures are paper expectations only. [426, 486]
- Specify lifecycle movement-edge law externally; do not import it into the evaluator. [489]
- Establish a reason-completeness argument for finite declared scope. [496]
- Licensed ISO clause-level claims remain unverified and must stay out of normative profiles. [491]
- No public extraction, canonicalization, implementation, promotion, or readiness claim is supported.

Final disposition: **KEEP the bounded relational evaluator; RENAME it; MERGE away universal carrier leakage; DEFER unowned registries and policies; KILL only genuine semantic collapses.**
