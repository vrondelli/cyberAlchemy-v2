## Non-vacuity review — `spawn-0006`

**Status:** `completed-read-only / paper-executable-review / fail-with-survivors`

No runtime, schema, or fixture executor was run. I paper-executed the synthesis’s finite graph and mutants against its stated algebra. No repository state was mutated.

The result is not a rejection of EBCQ as a bounded query. It is a rejection of the current candidate ontology as fully non-vacuous: the query/receipt algebra and several bindings survive, but multiple proposed nouns and relations have no independently computable effect in the declared suite. Those candidates must be removed, reduced to receipt fields, or given an explicit clause whose perturbation changes a component verdict.

### Fixture graph used

Smallest finite graph preserving all seven required kinds and the terminal owner/evidence boundary:

```text
DEF-1  --definesTerm--> REQ-1
REQ-1  --operationalizedBy--> CRIT-1
ARCH-1 --addresses--> REQ-1
DES-1  --constrainedBy--> REQ-1
DES-1  --refines--> ARCH-1
UXP-1  --evaluates--> DES-1
DOD-1  --covers--> CRIT-1

EV-DEF  --verifiedBy--> DEF-1 obligations
EV-CRIT --verifiedBy--> CRIT-1 obligations
EV-REQ  --verifiedBy--> REQ-1 obligations
EV-ARCH --verifiedBy--> ARCH-1 obligations
EV-DES  --verifiedBy--> DES-1 obligations
EV-UXP  --verifiedBy--> UXP-1 obligations
EV-DOD  --verifiedBy--> DOD-1 obligations

DEC-REQ, DEC-ARCH, DEC-DES, DEC-UXP:
  exact, current, scope-bound owner-decision inputs
```

All nodes and edges are inside exact scope `S0`, use current digests/profile/evaluator/baseline, and every terminal evidence node is independent of the proposition it supports. Execution, promotion, and release are not required by the seven selected purposes. This follows the dependency law and its prohibition on implication/circular closure (§6, lines 118–153), the component contract (§7, lines 216–246), and `G+` (§10, lines 428–442).

Notation below:

```text
components = [AC, ES, OA, TA, EC, P, R]
AC artifact_coherence; ES evidence_sufficiency; OA owner_approval;
TA transition_admission; EC execution_completion; P promotion; R release.

S = SATISFIED; U = UNSATISFIED; ? = UNKNOWN;
N = NOT_APPLICABLE; T = STALE; E = ERROR.
```

### Deterministic paper replay

| Case | Components `[AC,ES,OA,TA,EC,P,R]` | Overall / mayProceed | Complete? | Stable reasons | Mutated state? |
|---|---|---|---|---|---|
| `G+` | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Definition false-clear: circular grounding | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `CIRCULAR_SUPPORT`, `EVIDENCE_INVALID` | no |
| Definition false-block: canonical approval absent from usability profile | `[S,S,N,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Criterion false-clear: “acceptable,” no method/threshold | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `MISSING_OBLIGATION`, `UNDECIDABLE_CRITERION` | no |
| Criterion false-block: allowed signed human-review evidence | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Requirement false-clear: verification path and forward trace removed | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `MISSING_OBLIGATION`, `TRACE_BROKEN` | no |
| Requirement false-block: implementation evidence absent from pre-implementation profile | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| DoD false-clear: self-asserted completion | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `CIRCULAR_SUPPORT`, `EVIDENCE_INVALID` | no |
| DoD false-block: release approval absent | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Architecture false-clear A: unresolved material tension | `[U,S,S,U,N,N,N]` | `BLOCKED / false` | true | `CONFLICT_UNRESOLVED` | no |
| Architecture false-clear B: stale view evidence | `[?,T,S,?,N,N,N]` | `INDETERMINATE / false` | true | `EVIDENCE_STALE` | no |
| Architecture false-block: bounded owner-accepted residual risk | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Design false-clear: rationale/alternatives/upstream trace removed | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `MISSING_OBLIGATION`, `TRACE_BROKEN` | no |
| Design false-block: one feasible option with constraint proof | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| UXPlan false-clear: no questions/evidence ceiling; browser checks only | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `HUMAN_EVIDENCE_REQUIRED`, `MISSING_OBLIGATION` | no |
| UXPlan false-block: prospective study not yet executed | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | `[]` | no |
| Stale evidence receipt | `[S,T,S,?,N,N,N]` | `INDETERMINATE / false` | true | `EVIDENCE_STALE` | no |
| Stale profile digest | `[?, ?,S,?,N,N,N]` | `INDETERMINATE / false` | true | `PROFILE_DIGEST_MISMATCH` | no |
| Stale evaluator digest | `[E,E,S,E,N,N,N]` | `ERROR / false` | true | `EVALUATOR_DIGEST_MISMATCH` | no |
| Conflicting required-owner decisions | `[S,S,?, ?,N,N,N]` | `INDETERMINATE / false` | true | `CONFLICT_UNRESOLVED` | no |
| Missing required approval, with complete owner baseline | `[S,S,U,U,N,N,N]` | `BLOCKED / false` | true | `APPROVAL_MISSING` | no |
| Undeclared out-of-scope dependency | `[?,S,S,?,N,N,N]` | `INDETERMINATE / false` | true | `OUT_OF_SCOPE_DEPENDENCY` | no |
| Benign node exactly excluded by `S0` | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | boundary residue only; no blocking reason | no |
| Open-world missing fact, no completeness declaration | `[?, ?,S,?,N,N,N]` | `INDETERMINATE / false` | true | `COMPLETENESS_DECLARATION_MISSING`, `EVIDENCE_MISSING` | no |
| Same absence under valid complete local declaration | `[U,U,S,U,N,N,N]` | `BLOCKED / false` | true | `MISSING_OBLIGATION`, `EVIDENCE_MISSING` | no |
| Arbitrary runtime traversal cutoff | `[?, ?,S,?,N,N,N]` | `INDETERMINATE / false` | **false** | `REASONS_INCOMPLETE`, `RESOURCE_LIMIT_EXCEEDED` | no |
| Superseded non-baseline requirement | `[S,S,S,S,N,N,N]` | `CLEAR / true` | true | historical `SUPERSEDED`; excluded from current denominator | no |
| Legacy `closed`, no profile/evidence re-evaluation | `[?, ?,?, ?,N,N,N]` | `INDETERMINATE / false` | true | `LEGACY_CLOSED_UNVERIFIED` | no |

The false-clear/false-block expectations come directly from §10, lines 444–462. Overall classification and `mayProceed` follow §7, lines 248–274. Legacy treatment follows §11, lines 464–478.

Two deterministic corrections are necessary:

1. A cycle with completely known circular support is definitively invalid and therefore `BLOCKED`; §10’s “`BLOCKED` or `INDETERMINATE`” is under-specified. `INDETERMINATE` is appropriate only when cycle membership or completeness is unknown.
2. Owner conflict and owner absence are different mutants. Conflict yields `INDETERMINATE`; absence can yield `BLOCKED` only when the required-owner baseline is itself complete. Otherwise it remains `INDETERMINATE`.

### Candidate observable-effect test

| Candidate | Smallest perturbation and observable effect | Verdict |
|---|---|---|
| `ArtifactVersion` | digest/version mismatch changes AC/ES/TA and emits `SOURCE_DIGEST_MISMATCH` or `INPUT_SUPERSEDED` | KEEP |
| `ArtifactKind` | unknown kind prevents profile selection: `ARTIFACT_KIND_UNKNOWN`, indeterminate | KEEP |
| `ArtifactRole` | no declared fixture or mutant makes role change a clause, profile, component, or overall result independently of kind | **KILL as independent primitive** |
| `StatementKind` | no declared mutant distinguishes changing statement-kind from simply removing a profile obligation | **KILL pending discriminator** |
| `Obligation` | remove/undischarge one critical clause: AC/ES/TA change, stable clause reason | KEEP |
| `Decision` | remove, stale, or conflict required decision: OA/TA change | KEEP |
| `Claim` | support/refutation pair distinguishes supported/refuted/conflict/unknown and changes ES/TA | KEEP |
| `Evidence` | absent/stale/invalid evidence changes ES/TA | KEEP |
| `EvidenceClass` | authorized human receipt versus forbidden hard-coded method distinguishes false block | KEEP |
| `Owner` | missing/conflicting current owner input changes OA/TA | KEEP |
| `AuthorityEffect` | EBCQ always fixes it to `none`; no lawful input perturbation exists | **KILL as evaluable ontology primitive; retain constant receipt field** |
| `LifecycleState` | execution/promotion/release components validate external current state when applicable | KEEP, profile-bound |
| `ScopeDeclaration` | exact exclusion clears benign node; undeclared boundary makes result indeterminate | KEEP |
| `CompletenessDeclaration` | same missing fact changes from `UNKNOWN` to `UNSATISFIED` | KEEP |
| `Dependency` | undeclared/non-ready critical dependency changes AC/TA | KEEP |
| `Refines` | synthesis says it never implies satisfaction, but no fixture mutation assigns it an independent acceptance clause | **KILL as closure-bearing relation**; retain descriptive edge only if owned elsewhere |
| `Satisfies` / `SatisfactionClaim` | bare edge cannot affect result; reified binding with evidence/profile/baseline changes ES/TA | KILL bare edge; KEEP reified claim |
| `Covers` | DoD coverage omission changes AC; terminal evidence remains independently required | KEEP |
| `ConflictsWith` | unresolved versus owner-dispositioned conflict distinguishes false-clear and false-block | KEEP |
| `BlockedBy` | it is wholly derived from dependency verdict and adds no independent computable information | **KILL as ontology relation; retain receipt projection** |
| `VerifiedBy` | removing exact evidence-to-assertion binding changes ES | KEEP |
| `InvalidatedBy` | invalidation excludes prior evidence from current support and changes ES/TA | KEEP |
| `ClosureProfile` | swapping purpose/profile changes applicability and correctly prevents all seven false blocks | KEEP |
| `ClosureQuery` | binding/scope/budget changes can change clear to indeterminate/error | KEEP |
| `ReasonCode` | stable reason set distinguishes failure modes and supports reason completeness | KEEP |
| `WayClearReceipt` | exposes component vector, completeness, currentness, manifest, `mayProceed`; does not confer authority | KEEP |
| `EvaluatedResource` | neutral carrier label itself changes no clause or verdict; exact selector/version/digest already do the work | **KILL as primitive; use a structural input record** |
| `Artifact` | no owner and no required computational role; EBCQ runs without it | **KILL as EBCQ prerequisite**, as synthesis already proposes |
| `ClosureProfile` universalization | collapses purpose-specific false-block cases | **KILL universal profile** |
| `ArtifactKind == StatementKind` | cannot represent Design artifact containing architectural statements without changing profile | **KILL collapse** |
| `Refines == Satisfies` | makes descriptive precision falsely discharge evidence | **KILL collapse** |
| `Covers == Satisfies` | makes DoD coverage falsely prove completion | **KILL collapse** |
| evidence == approval | makes evidence receipt mutate OA semantics | **KILL collapse** |
| clear == lifecycle movement | violates state-purity and component independence | **KILL collapse** |

These judgments apply the synthesis’s candidate table (§4), relation law (§6, lines 141–153), and no-component-implication law (§7, lines 234–246). An existing external owner is not a reason for any KILL.

### Exact KILLs and zeroing facts

- `Artifact` as prerequisite: zeroed because `G+` evaluates solely from selector/version/profile bindings; the synthesis itself defers the term.
- `EvaluatedResource` as ontology primitive: zeroed because renaming the carrier changes no component, reason, or `mayProceed`.
- Independent `ArtifactRole`: zeroed because the declared suite contains no role-sensitive profile rule or mutant.
- Independent `StatementKind`: zeroed because its effect is observationally identical to the profile’s obligation inventory.
- `AuthorityEffect` as variable primitive: zeroed because every legal receipt fixes it to `none`; a non-`none` value is an evaluation error, not an ontology state.
- `Refines` as closure-bearing relation: zeroed because neither presence nor absence discharges a named obligation independently of trace/rationale.
- Authored `BlockedBy`: zeroed because it merely restates the already computed dependency result.
- Bare `Satisfies`: zeroed because only the reified, evidence/profile/baseline-bound claim has computable value.
- Universal `ClosureProfile`, all named semantic collapses, and any implication from receipt to approval/execution/promotion/release: killed because they turn at least one declared false-block or false-clear mutant into the wrong verdict.

### Survivors

The non-vacuous core is:

```text
exact selector + ArtifactVersion + ArtifactKind
ClosureProfile + Obligation
Evidence + EvidenceClass + VerifiedBy + InvalidatedBy
Claim/SatisfactionClaim + Decision + Owner
ScopeDeclaration + CompletenessDeclaration + Dependency
Covers + ConflictsWith
ClosureQuery + component algebra + ReasonCode + WayClearReceipt
```

`LifecycleState` survives only as validated external input for profiles that require EC/P/R. It is not moved by EBCQ.

### Reason completeness and state purity

**Reason completeness: conditional PASS.** The declared algebra is sufficient to enumerate all evaluated failures/unknowns in this finite fixture, provided:

- every profile clause has an immutable ID;
- every allowed in-scope node and edge appears in the traversal manifest;
- exact exclusions appear as boundary residue;
- runtime cutoff forces `reasons_complete: false`;
- `CLEAR` is forbidden unless reasons are complete.

This is paper evidence only, not a theorem or implementation result. The synthesis itself records the absent theorem (§12, line 496).

**State purity: PASS on the paper contract.** Every replay leaves source artifacts, approvals, execution, promotion, and release unchanged. The only permissible product is a new append-only receipt with `authorityEffect: none` (§7, lines 276–292). A future implementation still needs mutation tests or a capability boundary proving that no writer is reachable.

### Gaps, blockers, and residue

- The candidate does not yet define component aggregation precisely enough for mixed cases, especially whether a stale evidence input makes AC `SATISFIED` or `UNKNOWN`; the table above keeps AC independent where possible.
- `PROFILE_DIGEST_MISMATCH` is classified under binding/evaluation but the overall algebra does not say whether it is `ERROR` or `INDETERMINATE`. This must be fixed before executable fixtures.
- `APPROVAL_MISSING` needs completeness semantics: proven absence is `UNSATISFIED`; mere non-observation is `UNKNOWN`.
- `OUT_OF_SCOPE` is listed as a reason even though exact benign exclusion should not be a blocking reason. It should be boundary residue or an informational reason class excluded from the failure union.
- The reason equation includes only unsatisfied and unknown/error reasons, but the schema also lists `OUT_OF_SCOPE`, `SUPERSEDED`, and other nonblocking historical conditions. Blocking reasons and informational residue need separate collections.
- Candidate-local IDs, schemas, evaluator split, completeness-declaration authority, evidence substitution/expiry rules, and reason-completeness proof remain unselected (§12, lines 480–499).
- No fixture has been executed; therefore the strongest justified verdict is: **the EBCQ core is paper-non-vacuous after the KILLs above, but artifact readiness is not yet demonstrated.**
