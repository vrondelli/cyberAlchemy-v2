# Append-only synthesis repair addendum

This addendum does not rewrite or supersede the frozen synthesis. It records the single admitted zig-zag repair for downstream writer/auditor use.

## 1. Action and feedback receipt

```yaml
schema_version: evidence-bound-evaluation.feedback-receipt.v0.1
action_id: spawn-0004
feedback_iteration: 1
feedback_limit: 1
dispatch_id: 2026-07-31-ontological-way-clear-artifact-readiness-route
run_id: ontological-way-clear-20260731T153840
wave: synthesizer
step: s2-feedback
identity: Noether, Emmy
mode: synthesize-repair
status: completed-read-only
inputs:
  - receipts/ontological-way-clear-synthesis.md
  - receipts/reviewer-precedent.md
  - receipts/reviewer-non-vacuity.md
  - receipts/reviewer-definitional.md
mutations: none
delegation: none
browsing: none
new_evidence: none
output_kind: append-only-repair-addendum
proof_ceiling: paper-evaluated candidate research
implementation_status: not_implemented
fixture_execution_status: not_executed
authority_effect: none
```

Feedback verdict: `pass-with-repair-and-typed-residue`.

## 2. Repaired bottom line and final name

The final candidate name is **Evidence-Bound Evaluation Query (`EBEQ`)**.

This name is narrower and safer than both `Ontological Way Clear` and `Evidence-Bound Closure Query`:

- “Ontological” incorrectly suggests a canonical ontology or ontological completeness.
- “Closure” overstates completeness beyond the declared finite query scope.
- “Admission” in the kernel name risks implying readiness authority.
- “Evaluation” accurately names a pure computation whose purpose may be conformance evaluation or a non-authoritative admission projection.

`Ontological Way Clear`, `Way Clear`, and `EBCQ` are legacy research labels only. They are not alternate canonical terms or receipt verdict names.

EBEQ survives as a private, candidate-local, exact-bound evaluation composition. It does not survive as a general ontology, readiness gate, lifecycle owner, authority kind, or public Arcanum capability. This accepts the definitional rename and the precedent reviewer’s duplicate-gate warning. [Definitional review, “Bottom-line soundness verdict”](receipts/reviewer-definitional.md#bottom-line-soundness-verdict); [Precedent review, “Bottom line” and “Duplicate-gate and seam findings”](receipts/reviewer-precedent.md#bottom-line).

Maximum claim:

> For one exact resource snapshot, evaluation profile, evidence baseline, evaluator, declared finite scope, and named purpose, EBEQ evaluated every applicable clause and returned the complete component and reason set permitted by those exact bindings.

It does not establish truth outside scope, canonical vocabulary, concern completeness, owner approval unless supplied as an external decision, lifecycle movement, implementation completion, promotion, publication, deployment, release, or production readiness.

## 3. Smallest repaired vocabulary

### Query-local records

| Record | Required fields | Status |
|---|---|---|
| `ResourceSnapshot` | `resource_id`, `selector`, `resource_kind`, `version_or_revision`, `content_digest`, `media_type`, `baseline_id`, `currentness`, optional `supersedes_ref` | Merges and retires independent `EvaluatedResource` and `ArtifactVersion` types. Query-local structural record only. |
| `EvaluationProfile` | `profile_id`, `version`, `digest`, `purpose`, applicable `resource_kind`, immutable clause set, component targets, criticality, evidence compatibility, owner requirements, applicability law, invalidation law | Renamed from `ClosureProfile`; seven profile families remain proposed and owner-local. |
| `Obligation` | `clause_id`, `subject_selector`, `predicate_or_rule`, `component_targets`, `criticality`, `applicability`, accepted evidence classes, disposition rule | Non-vacuous core primitive. |
| `Claim` | `claim_id`, exact proposition/selector, support and refutation state | Survives because support/refutation changes evidence and admission components. |
| `EvidenceRecord` | `evidence_id`, class reference, method, digest, scope, baseline, provenance, currentness, validity result | Evidence is neither approval nor authority. |
| `OwnerDecision` | decision ID, owner identity, authority scope, operation, baseline, decision, expiry/revisit condition, challenge route | External input. EBEQ never creates or changes it. |
| `ScopeDeclaration` | exact roots, datasets, allowed relations/directions, exclusions, as-of time, semantic bounds, boundary law | Non-vacuous because declared exclusion differs from undeclared omission. |
| `CompletenessDeclaration` | exact subject/query pattern, dataset, issuer, baseline, evidence, expiry and invalidation bindings | Optional and deferred until an owner/trust policy exists. |
| `Dependency` | source, target, owner-defined type, direction, applicability, criticality | Kernel traversal relation; owner-defined domain relations remain profile-local. |
| `SatisfactionClaim` | subject, obligation, method, evidence references, profile, baseline, currentness | Only surviving satisfaction representation. |
| `EvaluationQuery` | exact resource, profile, evaluator, scope, completeness, evidence, owner, canonicalization, hash, time, and resource-budget bindings | Concrete invocation record for EBEQ. |
| `ComponentVerdict` | component, state, evaluated clauses, reason references | Computed result or validated external-state projection. |
| `Reason` | class, code, component, clause, subject, evidence, criticality, repair owner, next action | Partitioned as described below. |
| `EvaluationReceipt` | query digest, all component verdicts, clause results, reason partitions, traversal manifest, binding identities, history, `authority_effect: none` | Renamed from `WayClearReceipt`; append-only evaluation evidence only. |

### `ResourceKind`

`ResourceKind` replaces `ArtifactKind` and selects one of the seven profile families:

```text
Definition
Criterion
Requirement
DefinitionOfDone
Architecture
Design
UXPlan
```

Kind is owner-declared for the exact selector and is not inferred from filenames, diagrams, icons, presentation groups, or routes.

### Removed from the computable kernel

- `Artifact` is not deferred as an EBEQ dependency; it is simply **not required**.
- `EvaluatedResource` and `ArtifactVersion` are retired as independent types and merged into `ResourceSnapshot`.
- `ArtifactRole`/`EvaluationRole` is removed from the core. No admitted fixture gave it an independent verdict effect.
- `StatementKind` is demoted to optional source-domain annotation. It has no EBEQ closure effect until an owner supplies a discriminating profile clause and fixture.
- `AuthorityEffect` is not an entity or variable evaluation primitive. `authority_effect: none` is a literal receipt invariant.
- `LifecycleState` remains an external reference, not kernel-owned vocabulary.

These resolutions accept the non-vacuity zeroing results instead of inventing unsupported discriminators. [Non-vacuity review, “Candidate observable-effect test” and “Exact KILLs”](receipts/reviewer-non-vacuity.md#candidate-observable-effect-test); [Definitional review, “Smallest repaired vocabulary”](receipts/reviewer-definitional.md#smallest-repaired-vocabulary).

## 4. Final core relation laws

| Relation | Final law |
|---|---|
| `hasKind(ResourceSnapshot, ResourceKind)` | Selects profile semantics; confers no authority. |
| `imposes(EvaluationProfile, Obligation)` | Makes a clause evaluable; does not assert satisfaction. |
| `appliesTo(Obligation, selector, scope)` | Establishes declared applicability. |
| `supports(EvidenceRecord, Claim)` | Sets the support bit only. |
| `challenges(EvidenceRecord, Claim)` | Sets the refutation bit only. |
| `verifiedBy(Claim|Obligation, EvidenceRecord)` | Binds exact evidence and method; does not imply approval. |
| `invalidatedBy(EvidenceRecord, event)` | Removes historical evidence from current admissibility without rewriting its historical result. |
| `dependsOn(source, target)` | Traversed only under the profile’s direction, scope, criticality, and cycle law. |
| `covers(source, target)` | Means addressed scope only; terminal evidence remains independently required. |
| `conflictsWith(a, b)` | Symmetric, irreflexive, non-transitive; closure effect depends on currentness, scope, and disposition. |
| `SatisfactionClaim(...)` | Reified evidence/profile/baseline-bound assertion; the only satisfaction form. |

Demoted or killed relations:

- Bare `Satisfies` is **killed**.
- `Refines` may remain an externally owned descriptive trace, but is **killed as an EBEQ closure-bearing relation**.
- Authored `BlockedBy` is **killed**. A receipt may contain `derived_blockers[]`, computed entirely from dependency/component results.
- Profile-local relations such as `definesTerm`, `addresses`, `constrainedBy`, `operationalizedBy`, and `evaluates` are not promoted into the kernel. A profile may bind an externally owned relation type through `Dependency`.
- `Refines == Satisfies`, `Covers == Satisfies`, evidence == approval, and receipt verdict == lifecycle movement remain killed collapses.

## 5. Repaired component algebra

The component vector remains:

```text
[AC, ES, OA, TA, EC, P, R]

AC artifact_coherence
ES evidence_sufficiency
OA owner_approval
TA transition_admission
EC execution_completion
P  promotion
R  release
```

States:

```text
SATISFIED
UNSATISFIED
UNKNOWN
NOT_APPLICABLE
STALE
SUPERSEDED
ERROR
```

Ownership and propagation laws:

- `AC` and `ES` are computed outputs from profile clauses.
- `OA` validates an external owner decision; it never manufactures approval.
- `TA` is a computed, non-authoritative projection under the selected profile.
- `EC`, `P`, and `R` validate external owner records only when the profile requires them.
- Every obligation declares which component or components it affects. No implicit cross-component propagation is permitted.
- `TA` may be a profile-defined conjunction over required components, but it neither changes them nor moves lifecycle state.
- `may_proceed` is not a universal gate field. A transition-owning consumer may interpret `TA`, but EBEQ itself neither selects work nor authorizes mutation.

### Aggregation

```text
ERROR
  if the query/evaluator cannot establish a valid evaluation contract,
  including malformed input, canonicalization failure, evaluator-owned
  binding mismatch, or untrusted profile identity

BLOCKED
  else if any applicable acceptance-critical clause is definitively
  UNSATISFIED

INDETERMINATE
  else if any applicable critical clause is UNKNOWN, STALE, conflicted,
  owner-unbound, incompletely traversed, or dependent on incomplete scope

CLEAR
  else only if:
    every applicable clause was evaluated;
    every required component is SATISFIED;
    every exclusion is explicitly NOT_APPLICABLE;
    no blocking, uncertainty, or error reason exists; and
    reasons_complete == true
```

`ERROR` has precedence over semantic aggregation because no trustworthy total evaluation exists. A declared resource budget being exhausted without evaluator corruption yields `INDETERMINATE`, `reasons_complete: false`, and `RESOURCE_LIMIT_EXCEEDED`. A failure to report known evaluated reasons is an evaluator defect and yields `ERROR`.

### Exact binding classifications

| Condition | Component/result law |
|---|---|
| `PROFILE_DIGEST_MISMATCH` | `ERROR`. The evaluator cannot know which immutable clause set it evaluated. |
| `EVALUATOR_DIGEST_MISMATCH` | `ERROR`. |
| Canonicalization/parser/schema failure in evaluator-owned input | `ERROR`. |
| Proven profile-required `invalid_evidence` | Affected evidence clause and `ES` become `UNSATISFIED`; critical use yields `BLOCKED`. |
| Evidence cannot be checked because evaluator/method binding is broken | `ERROR`, not `invalid_evidence`. |
| Evidence `invalidated` by a typed event | Historical record remains; it is excluded from current support. Remaining clause is `UNKNOWN`/`STALE`, unless a valid completeness declaration proves no current admissible replacement, in which case it is `UNSATISFIED`. |
| Stale evidence | Only components targeted by clauses using that evidence become `STALE` or `UNKNOWN`; unrelated `AC` clauses remain unchanged. |
| Superseded non-baseline resource | Historical residue only; excluded from the denominator. |
| Proven absent required approval under a complete owner baseline | `OA=UNSATISFIED`, `TA=UNSATISFIED`, overall `BLOCKED`. |
| Approval not observed under an incomplete or unbound owner baseline | `OA=UNKNOWN`, `TA=UNKNOWN`, overall `INDETERMINATE`. |
| Conflicting required-owner decisions | `OA=UNKNOWN`, `TA=UNKNOWN`, `INDETERMINATE`. |
| Approval not required by the selected purpose | `OA=NOT_APPLICABLE`. |

### Circular support

- If cycle membership and the relevant support subgraph are complete, and the cycle has no independent terminal evidence of an accepted class, the affected clauses are `UNSATISFIED`; result `BLOCKED` with `CIRCULAR_SUPPORT`.
- If cycle membership, traversal, or support completeness is unknown, the clauses are `UNKNOWN`; result `INDETERMINATE` with `DEPENDENCY_CYCLE` plus the relevant completeness reason.
- A cycle is never cleared merely because every member supports another member.

This resolves the original fixture’s ambiguous `BLOCKED or INDETERMINATE` expectation. [Non-vacuity review, “Deterministic corrections”](receipts/reviewer-non-vacuity.md#deterministic-paper-replay).

## 6. Reason and residue partitions

`reasons` is replaced by five non-overlapping collections:

```yaml
blocking_reasons:      # proven critical unsatisfaction
uncertainty_reasons:   # unknown, stale, conflict, incomplete baseline/scope
error_reasons:         # evaluator/query contract failures
boundary_residue:      # exact nonblocking exclusions and permitted boundary edges
history_residue:       # superseded inputs, prior verdicts, invalidation history
```

Optional noncritical warnings may be carried separately.

Rules:

- `OUT_OF_SCOPE` under an exact scope rule belongs in `boundary_residue`, not blocking or uncertainty reasons.
- An undeclared boundary dependency remains `OUT_OF_SCOPE_DEPENDENCY` in `uncertainty_reasons`.
- `SUPERSEDED` belongs in `history_residue` when excluded from the current baseline.
- An `invalidated` historical record belongs in `history_residue`; the resulting current evidence gap separately produces a blocking or uncertainty reason.
- `reasons_complete` covers all applicable evaluated clauses, visited allowed nodes/edges, and all blocking/uncertainty/error reasons.
- Boundary and history residue have their own complete manifests but do not enter the failure union.
- Stable sorting and deduplication apply independently to each collection.
- `CLEAR` is forbidden when `reasons_complete: false`.

This accepts the non-vacuity reviewer’s distinction between semantic reasons and nonblocking boundary/history information. [Non-vacuity review, “Gaps, blockers, and residue”](receipts/reviewer-non-vacuity.md#gaps-blockers-and-residue).

## 7. Accepted disposition matrix

| Candidate | Final disposition | Consequence |
|---|---|---|
| `Ontological Way Clear` / `Way Clear` | **KILL as candidate name** | Legacy research/UI label only. |
| `Evidence-Bound Closure Query` | **KILL as final name** | Replaced by EBEQ because “closure” overclaims. |
| `Evidence-Bound Evaluation Query` | **PROPOSED** | Final private candidate name; no canonical status. |
| `Artifact` prerequisite | **KILL** | EBEQ does not require or define it. |
| `EvaluatedResource` and `ArtifactVersion` types | **MERGE/RETIRE** | One query-local `ResourceSnapshot` record. |
| `ArtifactKind` | **RENAME/PROPOSED** | `ResourceKind`. |
| Independent `ArtifactRole`/`EvaluationRole` | **KILL** | No observable discriminator in admitted fixtures. |
| Independent `StatementKind` | **DEMOTE** | Optional source annotation; no kernel closure effect. |
| `Obligation`, `Claim`, `EvidenceRecord`, `OwnerDecision` | **BUILD-FROM-OWNED** | Reuse profile, assurance/evidence, and authority owners. |
| `EvidenceClass` taxonomy | **DEFER registry; KEEP field** | Profile-local class reference survives because allowed human evidence changes a verdict; taxonomy ownership remains unselected. |
| `AuthorityEffect` entity | **KILL** | Retain literal `authority_effect: none` receipt invariant. |
| `LifecycleState` schema | **DEFER/external** | EBEQ may bind external records but cannot own movement law. |
| `ScopeDeclaration` | **PROPOSED** | Non-vacuous query-local contract. |
| `CompletenessDeclaration` | **DEFER policy; KEEP optional record** | No absence-as-failure until issuer/trust/expiry law is owned. |
| `Dependency`, `Covers`, `ConflictsWith` | **PROPOSED/BUILD-FROM-OWNED** | Each has observable fixture consequences. |
| `Refines` as closure-bearing | **KILL** | Descriptive external trace only. |
| Bare `Satisfies` | **KILL** | Use only `SatisfactionClaim`. |
| Authored `BlockedBy` | **KILL** | Derived receipt projection only. |
| `VerifiedBy`, `InvalidatedBy` | **BUILD-FROM-OWNED** | Typed evidence/provenance behavior retained. |
| Universal evaluation profile | **KILL** | Seven purpose-specific families remain separate. |
| Seven profile instances | **DEFER/PROPOSED** | Need named owners, exact clauses, and executed fixtures. |
| `EvaluationReceipt` | **BUILD-FROM-OWNED/PROPOSED schema** | Append-only evaluation artifact; no authority. |
| Receipt-to-approval/execution/promotion/release implication | **KILL** | Components remain separately owned. |
| Public Arcanum extraction | **DEFER** | Requires a separate scrubbed owner decision; current candidate remains private. |
| ISO clause-level profile claims | **DEFER** | Licensed clauses remain unverified. |

## 8. Corrected paper-witness expectations

No fixture was executed. These are repaired paper expectations only.

### Base graph

`G+` remains:

```text
DEF-1 -> REQ-1 -> CRIT-1
REQ-1 -> ARCH-1 -> DES-1 -> UXP-1
CRIT-1 and other exact obligations -> DOD-1
independent terminal evidence for every applicable obligation
exact current owner decisions where required
EC/P/R not applicable to the selected seven purposes
```

Expected vector:

```text
[SATISFIED, SATISFIED, SATISFIED, SATISFIED,
 NOT_APPLICABLE, NOT_APPLICABLE, NOT_APPLICABLE]
overall: CLEAR
reasons_complete: true
authority_effect: none
```

### Seven-family mutants

| Family | False-clear mutant | Correct result | False-block mutant | Correct result |
|---|---|---|---|---|
| Definition | Complete circular grounding without terminal evidence | `BLOCKED`; `CIRCULAR_SUPPORT` | Canonical approval absent from candidate-usability purpose | `CLEAR`; OA `NOT_APPLICABLE` |
| Criterion | No method or threshold | `BLOCKED`; `MISSING_OBLIGATION`, `UNDECIDABLE_CRITERION` | Profile-authorized signed human review supplied | `CLEAR` |
| Requirement | Verification path and trace absent | `BLOCKED`; `MISSING_OBLIGATION`, `TRACE_BROKEN` | No implementation evidence in pre-implementation profile | `CLEAR` |
| DoD | Self-asserted completion | `BLOCKED`; `CIRCULAR_SUPPORT`, `INVALID_EVIDENCE` | Release approval absent | `CLEAR`; release `NOT_APPLICABLE` |
| Architecture | Unresolved material tension | `BLOCKED`; `CONFLICT_UNRESOLVED` | Bounded competent-owner accepted residue | `CLEAR` |
| Design | Alternatives/rationale/upstream trace absent | `BLOCKED`; `MISSING_OBLIGATION`, `TRACE_BROKEN` | Single feasible option with constraint proof | `CLEAR` |
| UXPlan | No research questions/evidence ceiling; browser checks substituted | `BLOCKED`; `HUMAN_EVIDENCE_REQUIRED`, `MISSING_OBLIGATION` | Prospective study not yet executed | `CLEAR` for run-admission purpose |

### Cross-cutting corrections

| Mutant | Repaired expectation |
|---|---|
| Cycle membership incomplete | `INDETERMINATE`, not blocked; `DEPENDENCY_CYCLE` plus completeness reason. |
| Stale evidence | Affected ES/TA `STALE` or `UNKNOWN`; `INDETERMINATE`. |
| `PROFILE_DIGEST_MISMATCH` | `ERROR`, not the reviewer’s provisional `INDETERMINATE`. |
| `EVALUATOR_DIGEST_MISMATCH` | `ERROR`. |
| Proven invalid required evidence | ES `UNSATISFIED`; `BLOCKED` when critical. |
| Typed evidence invalidation, replacement baseline incomplete | ES/TA `UNKNOWN` or `STALE`; `INDETERMINATE`. |
| Missing required approval, complete owner baseline | OA/TA `UNSATISFIED`; `BLOCKED`. |
| Missing approval, incomplete owner baseline | OA/TA `UNKNOWN`; `INDETERMINATE`. |
| Conflicting owner decisions | OA/TA `UNKNOWN`; `INDETERMINATE`. |
| Benign exact exclusion | `CLEAR`; record only in `boundary_residue`. |
| Open-world missing fact without completeness declaration | `INDETERMINATE`. |
| Same absence under valid complete local declaration | `BLOCKED`. |
| Runtime traversal cutoff | `INDETERMINATE`, `reasons_complete: false`. |
| Superseded non-baseline resource | No block; `history_residue`. |
| Legacy `closed` without re-evaluation | `INDETERMINATE`; `LEGACY_CLOSED_UNVERIFIED`. |
| `ArtifactRole`, `StatementKind`, or `Refines`-only perturbation | No EBEQ verdict effect; they are not kernel closure primitives. |

## 9. Exact-binding reviewer closure delta

| Reviewer issue | Evidence reference | Resolution |
|---|---|---|
| “Closure” overclaims finite evaluation | [Definitional: bottom-line verdict](receipts/reviewer-definitional.md#bottom-line-soundness-verdict) | **Resolved:** final name EBEQ. |
| “Ontological Way Clear” suggests ontology/authority | [Definitional: disposition table](receipts/reviewer-definitional.md#disposition-table) | **Killed** as candidate name; legacy label only. |
| Duplicate universal carriers recreate `Artifact` | [Definitional: disposition table](receipts/reviewer-definitional.md#disposition-table); [Non-vacuity: exact KILLs](receipts/reviewer-non-vacuity.md#exact-kills-and-zeroing-facts) | **Resolved:** `ResourceSnapshot` structural record. |
| `Artifact` has no required computational role | [Non-vacuity: observable-effect test](receipts/reviewer-non-vacuity.md#candidate-observable-effect-test) | **Killed** as prerequisite. |
| Independent role has no discriminator | Same | **Killed:** no `EvaluationRole` in core. |
| `StatementKind` has no independent fixture effect | Same | **Demoted:** optional source annotation only. |
| `AuthorityEffect` cannot legally vary | Same | **Killed** as entity; literal receipt invariant retained. |
| `Refines` does not independently discharge a clause | Same | **Killed** as closure-bearing; descriptive external trace only. |
| `BlockedBy` restates dependency computation | Same | **Killed** as authored relation; derived receipt projection only. |
| Bare `Satisfies` collapses method/evidence/profile/baseline | [Definitional: relation laws](receipts/reviewer-definitional.md#relation-laws); [Non-vacuity: exact KILLs](receipts/reviewer-non-vacuity.md#exact-kills-and-zeroing-facts) | **Killed:** only `SatisfactionClaim` retained. |
| Resource kind should not presuppose Artifact | [Definitional: disposition table](receipts/reviewer-definitional.md#disposition-table) | **Resolved:** `ResourceKind`. |
| Profile/query/receipt names imply closure or movement | Same | **Resolved:** `EvaluationProfile`, `EvaluationQuery`, `EvaluationReceipt`. |
| Invalid evidence versus invalidated history ambiguous | [Definitional: state/reason audit](receipts/reviewer-definitional.md#statereason-non-collapse-audit) | **Resolved:** proven invalid evidence → `UNSATISFIED`; evaluator binding failure → `ERROR`; invalidation removes current admissibility without rewriting history. |
| Complete circular support under-specified | [Non-vacuity: deterministic corrections](receipts/reviewer-non-vacuity.md#deterministic-paper-replay) | **Resolved:** complete cycle blocked; unknown cycle membership indeterminate. |
| Approval absence lacks completeness law | Same | **Resolved:** complete owner baseline → blocked; incomplete baseline → indeterminate. |
| `PROFILE_DIGEST_MISMATCH` unclassified | [Non-vacuity: gaps](receipts/reviewer-non-vacuity.md#gaps-blockers-and-residue) | **Resolved:** `ERROR`. |
| Mixed stale evidence propagation unclear | Same | **Resolved:** clauses declare component targets; no implicit propagation. |
| `OUT_OF_SCOPE` incorrectly appears as failure reason | Same | **Resolved:** exact exclusions move to `boundary_residue`. |
| Superseded/history conditions mixed with blockers | Same | **Resolved:** separate `history_residue`. |
| Reason completeness is conditional only | [Non-vacuity: reason completeness](receipts/reviewer-non-vacuity.md#reason-completeness-and-state-purity) | **Deferred:** contract repaired; proof and implementation remain absent. |
| EBEQ may duplicate WPRA/Task Session admission | [Precedent: duplicate-gate findings](receipts/reviewer-precedent.md#duplicate-gate-and-seam-findings) | **Resolved by boundary:** EBEQ computes a subordinate projection only; it selects and executes nothing. |
| Receipt may duplicate authority or terminal receipts | Same | **Resolved by boundary:** evaluation-local append-only evidence; not an authority, successor, closeout, or approval receipt. |
| Lifecycle/approval/promotion/release already have owners | [Precedent: owner map](receipts/reviewer-precedent.md#exact-owner-map) | **Build-from-owned/external:** EBEQ validates bindings only. |
| Evidence taxonomy and conflict algebra are not standards-derived | [Precedent: duplicate-gate finding 4](receipts/reviewer-precedent.md#duplicate-gate-and-seam-findings) | **Deferred/proposed:** profile-local candidate semantics, never presented as deployed standards. |
| Completeness issuer/trust policy absent | [Precedent: missing-source defects](receipts/reviewer-precedent.md#missing-source-defects-and-residue) | **Deferred** to authority/profile owners. |
| No evaluator split or canonical schema | Same | **Deferred** to evaluator architecture owner. |
| No selector-stability or cross-carrier identity law | Same | **Deferred** to resource identity/serialization owners. |
| ISO 29148/42010/9241 clauses unverified | [Precedent: missing-source defects](receipts/reviewer-precedent.md#missing-source-defects-and-residue); [Definitional: blockers](receipts/reviewer-definitional.md#blockers--residue) | **Deferred:** excluded from normative profile claims. |
| Fixtures were paper-evaluated only | [Non-vacuity: status and gaps](receipts/reviewer-non-vacuity.md#gaps-blockers-and-residue) | **Unresolved validation residue:** no implementation/readiness claim. |
| Public/private extraction unapproved | [Precedent: missing-source defects](receipts/reviewer-precedent.md#missing-source-defects-and-residue) | **Deferred:** candidate remains private; no Arcanum write or public claim. |
| Existing Way Clear inspection/validation incomplete | Same | **Deferred:** migration remains design only. |
| Human evidence and owner judgment ceilings | [Precedent: owner map](receipts/reviewer-precedent.md#exact-owner-map) | **Preserved:** machines validate scoped receipts, not adequacy, comprehension, preference, or risk acceptability. |

## 10. Remaining residue and repair owners

| Residue | Repair owner |
|---|---|
| EBEQ kernel/profile vocabulary has no canonical owner | Private ontology candidate owner, then Definitions Governance if definition work is proposed. |
| Seven profile clause sets, criticality, evidence compatibility, expiry, and substitution remain unapproved | Definition, Criterion, Requirement, DoD, Architecture, Design, and UX owners separately. |
| No fixture executor or executed witness corpus | Bounded research/fixture implementation owner. |
| No reason-completeness proof | Evaluator specification owner. |
| OWL/SHACL/schema/custom evaluator split unselected | Evaluator architecture owner. |
| Completeness declaration trust and issuer law absent | Authority-model owner plus each consuming profile owner. |
| Lifecycle schema and movement-edge law absent | Existing lifecycle owner; never EBEQ. |
| Authority-chain drift remains | Definitions Governance. |
| ISO clause-level requirements remain unverified | Research/source-access owner; no reconstruction from memory. |
| Human evidence, material-concern completeness, trade-off adequacy, risk acceptance, and generalizability remain contextual | Architecture, Design, UX/research, risk, and product owners. |
| Selector stability and cross-carrier identity unresolved | Resource identity and serialization/evaluator owners. |
| Current public Way Clear migration unimplemented and incompletely validated | Existing Way Clear capability owner only after private candidate acceptance and boundary review. |
| Public extraction unapproved | Separate public/private boundary decision owner. |
| OEW remains discovery-mode Design blocked before Plan | Existing OEW Define/Design/selection owners; EBEQ cannot repair it. |

Final repaired verdict: **KEEP the private bounded evaluator composition as EBEQ; MERGE the carrier into `ResourceSnapshot`; KILL zero-effect or collapsed primitives; DEFER unowned policies and unverified claims; preserve all authority, lifecycle, human-evidence, and public/private ceilings.**
