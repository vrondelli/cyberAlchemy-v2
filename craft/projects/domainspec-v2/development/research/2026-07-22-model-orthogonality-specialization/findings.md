# DomainSpec model orthogonality specialization findings

## Goal

Determine whether the existing CAV2 and DomainSpec definitions already prevent unnecessary concepts, relationship types, and duplicate graph facts, and identify the narrowest owner-gated DomainSpec additions where they do not.

## TL;DR

Do not add a new CAV2 primitive and do not reinterpret orthogonality as cardinality. `CAV2-D16`, `CAV2-D22`, and `CAV2-D29` are the cited basis; DomainSpec D6 already governs DS-D1 meta-type-kind non-collapse, while D3/D18 govern relationship-type eligibility. The remaining gaps are narrower: independently grounded non-collapse for authored Concept Registry declarations, one canonical authored representation for equivalent facts within a declared authority boundary, an anti-self-witness condition for D18, and a general generated-view procedure. These are **PROPOSED—OWNER-GATED**, not current authority.

`creates` plus `creation_targets` is the strongest stress case: current authority deliberately requires two extensionally equivalent authored encodings and current validators enforce their parity. That is not a present violation, but it is a redundancy candidate under the proposed rule. Its canonical direction, creator uniqueness, Operation target arity, and graph multiplicity are separate owner decisions; runtime instance cardinality is another axis again.

## Context

The investigation began from concern that permissive `many_to_many` edges can encourage duplicated domain concepts or creation behavior. The three lanes showed that the general quality issue is not multiplicity itself. It is whether each canonical model element contributes an independently grounded semantic consequence and whether one proposition is authored in more than one form. Formal entailment, executable corpus evidence, and authority routing had to be reconciled because paper admissibility, generated projections, and implemented validators currently cover different portions of that problem ([Agent 1](./research.md#agent-1--formal-entailment-and-countermodels), [Agent 2](./research.md#agent-2--computational-corpus-normalization), [Agent 3](./research.md#agent-3--ontology-and-governance-specialization)). Their robot-talks converged on a DomainSpec-local specialization while preserving disputes that require owner decisions.

## Connections

- derives-from: `./research.md`

## Status vocabulary

- **CURRENTLY EXECUTABLE** — discriminating validation or generation exists now.
- **AUTHORITY-ONLY** — canonical text owns the claim, but execution was not found.
- **AUTHORITY-BACKED PRECEDENT** — a narrower current pattern supports the proposal without generalizing it into law.
- **RESEARCH-PROVEN INSUFFICIENCY** — the reviewed authority or implementation does not close the stated obligation.
- **PROPOSED—OWNER-GATED** — a converged candidate that is not authority until its named owner approves it.
- **DOWNSTREAM IMPLEMENTATION** — schema, validator, compiler, generator, or fixtures that must follow an approved semantic gate.

## Build-from-owned verdict

The three explorers agree that CAV2 should remain unchanged. `CAV2-D29` separates independently variable axes; `CAV2-D16` requires an explicit typed coupling when they cannot vary independently; `CAV2-D22` admits non-redundant classifiers. Their scope does not directly govern every DomainSpec concept instance, relationship instance, attribute, or serialized fact. `CAV2-D31` permits a lower layer to specialize owned primitives but forbids silent redefinition ([CAV2 definitions](../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md)).

DomainSpec already specializes part of this basis. D6 owns DS-D1 **meta-type-kind** formation and non-collapse, not the identity of two differently named declarations carrying the same meta-type. D3 and D18 own **relationship-type** eligibility through observable validation, derivation, projection, composition, owner-route, or generation consequences ([DomainSpec definitions](../../../definitions/DEFINITIONS.md)). All three robot-talks narrowed the initial stronger claim: D18 is necessary, but not a closed sufficient test, because a candidate relationship can create its own projection or generated echo and then cite that downstream echo as its witness.

### Entailment and specialization matrix

| Obligation | Existing owner | Status | Narrowest treatment | Owner route |
|---|---|---|---|---|
| Independent axes and explicit coupling | CAV2-D29 / CAV2-D16 | **AUTHORITY-ONLY** cited basis | Reference without widening | No CAV2 change |
| Non-redundant classifications | CAV2-D22 | **AUTHORITY-ONLY** cited basis | Reference; do not apply directly to every graph element | No CAV2 change |
| DS-D1 meta-type-kind non-collapse | DomainSpec D6 | **AUTHORITY-ONLY** | Keep its existing scope | DomainSpec definitions governance |
| Authored Concept Registry declaration non-collapse | None identified | **RESEARCH-PROVEN INSUFFICIENCY** | Add a finite, independently grounded witness procedure | DomainSpec definitions governance |
| Relationship-type admission | DomainSpec D3/D18 and D20–D25 | **AUTHORITY-ONLY** and **RESEARCH-PROVEN INSUFFICIENCY** | Add cross-card sufficiency and anti-self-witness conditions | DomainSpec definitions governance |
| One canonical authored form per equivalent fact | None identified | **RESEARCH-PROVEN INSUFFICIENCY** | Define boundary-scoped normalization/equivalence and single authorship | DomainSpec definitions governance |
| Generated inverse behavior | `owns` → `owned-by` | **CURRENTLY EXECUTABLE**, **AUTHORITY-BACKED PRECEDENT** | Generalize only after owner approval | Relationship authority, then implementation |
| General generated-view procedure | Relationship-only precedents | **PROPOSED—OWNER-GATED** | Cover inverse, alias, projection, composition, and derived attribute with provenance | DomainSpec definitions governance |
| Individual edge duplicate identity | DS-D8 identity fields not closed | **RESEARCH-PROVEN INSUFFICIENCY** | First approve a finite identity key; duplicate detection is then mechanical | DS-D8 relationship authority |
| Graph multiplicity | DS-D8 signature tuple | **AUTHORITY-ONLY** | Define enum degree semantics and executable obligations separately | DS-D8 relationship authority |
| Runtime instance cardinality | No owner identified | **RESEARCH-PROVEN INSUFFICIENCY** | Keep separate; establish an owner only if required | DomainSpec architecture/definitions governance |

## Core rule in plain language

A concept or relationship deserves separate canonical authority only when removing or identifying it changes a named consequence that did not arise merely because that candidate was added. Similar structure does not imply duplication: two concepts may remain distinct through identity, lifecycle, behavior, ownership, validation, composition, or generated-code consequences. Conversely, different syntax does not imply different meaning: if an edge and an attribute normalize to the same proposition, only one should be authored canonically and the other should be derived with provenance.

Orthogonality here means enough independently grounded variation to justify separate authority. It does not mean isolation. Two distinct elements may be explicitly coupled, and a legitimate relation may be many-to-many. The rule targets redundant authority, not useful derived navigation or genuinely plural domain structure.

## Candidate predicates

The following are **PROPOSED—OWNER-GATED** and intentionally finite rather than open-ended semantic similarity tests.

```text
ConceptAdmissible_B(c, M)
⇔ AuthoredConcept_B(c)
 ∧ ∃ w ∈ W_concept(B):
      IndependentlyGrounded(w, c)
  ∧   w(M) ≠ w(remove_or_identify(M, c))

CanonicalFact_B(f, M)
⇔ Authored_B(f)
 ∧ ¬∃ g ≠ f:
      Authored_B(g) ∧ Normalize_B(f) = Normalize_B(g)

RelationshipAdmissible_B(r, M)
⇔ D3_D18_candidate(r)
 ∧ ∃ w ∈ W_relation(B):
      PreExistingOrOwnerApproved(w)
  ∧   w(M) ≠ w(remove(M, r))
  ∧ ¬SolelyGeneratedFrom(w, r)

GeneratedView_B(v, f)
⇔ CanonicalFact_B(f)
 ∧ DeterministicFrom(v, f)
 ∧ NonAuthoritative(v)
 ∧ ProvenanceTo(v, f)
 ∧ ParityValidated(v, f)
```

`B` is a declared authority boundary; `Normalize_B` and each finite witness vocabulary must be owner approved. Without that boundary and vocabulary, “semantic equivalence” would become an unbounded heuristic. Individual edge identity is not itself an orthogonality predicate: after DS-D8 approves the finite identity fields, two equal edge keys can be rejected mechanically under canonical fact authorship.

## Cardinality remains a separate axis

DS-D8 currently carries `multiplicity`, but the reviewed executable relationship representations omit it and no graph-degree validator was found. The enum meanings are therefore **AUTHORITY-ONLY**, and current changes affect receipts/digests rather than a discriminating semantic verdict.

A conventional interpretation can be proposed using source outdegree and target indegree, but it remains **PROPOSED—OWNER-GATED**: `one_to_one` bounds both by one; `one_to_many` leaves source outdegree plural and bounds target indegree; `many_to_one` bounds source outdegree and leaves target indegree plural; `many_to_many` leaves both plural. Ordered variants additionally require stored and validated order. These semantics must not be inferred from their labels.

Runtime count is different: one Operation concept may execute repeatedly and create many Entity instances even when the concept graph has a single creator edge. No runtime-cardinality owner was identified.

## Stress cases and precedents

### Current authority-backed behavior

- `owns` is canonical while `owned-by` is a generated inverse; authored `owned-by` is rejected. This is **CURRENTLY EXECUTABLE** and the strongest **AUTHORITY-BACKED PRECEDENT** for one authority plus derived navigation ([relationship authority](../../../definitions/relationships/relationships.yml), [validator](../../../impl/tools/lib/relationship-signatures.ts)).
- `enforces-cross` has been collapsed into `enforces` plus scope because no distinct consequence survives. This is an **AUTHORITY-BACKED PRECEDENT** for avoiding redundant relationship types.
- `produces` and `emits`, and separately `creates` and `produces-for`, remain distinct because endpoints, scope, effect, validation, or traversal change. Shared endpoints do not collapse meaning.
- Generated graphs and manifests declare generated authority and source provenance. Repeated serialization is therefore not competing authorship.

### Provisional corpus evidence

Form `submission_action`/`target_interface`, Guard `source_rule`, and Binding `target_ref` each appear alongside corresponding edges. They are useful stress fixtures, but no general parity rule was found. Adapter and State Indicator normalization likewise comes from a synthetic UI profile. These are **RESEARCH-PROVEN INSUFFICIENCY** or provisional evidence, not authority.

### `creates` and `creation_targets`

D26 and the active decision currently authorize both:

```text
O --creates--> E  ⇔  E ∈ O.creation_targets
```

Current Markdown and minted validators enforce exact target-set parity, so matching and mismatching cases are **CURRENTLY EXECUTABLE** ([D26](../../../definitions/DEFINITIONS.md), [`creates` decision](../../../authority/decisions/2026-07-22-operation-creates-entity.md), [validator](../../../impl/tools/lib/relationship-signatures.ts)). Because both sides express one extensional proposition, this is a redundancy candidate under the proposed single-authorship rule—but not a current violation.

The declared `many_to_many` value is **AUTHORITY-ONLY**. Current witnesses are only `CreatePlayer → Player` and `GenerateSettlement → SettlementTransaction`; neither plural direction is witnessed, and no degree constraint is enforced. Evidence does not choose between edge-canonical and attribute-canonical representation, does not derive unique creator indegree, and does not decide whether one Operation may target several Entity types.

## Executable fixture matrix

The current fixture and validator evidence establishes only the rows labeled **CURRENTLY EXECUTABLE**; every proposed row remains unvalidated.

| Fixture | Expected result | Status / purpose |
|---|---|---|
| Matching and mismatching `creates`/`creation_targets` target sets | Match passes; omission or mismatch rejects | **CURRENTLY EXECUTABLE** parity |
| Authored `owned-by` | Reject; generate inverse from `owns` | **CURRENTLY EXECUTABLE** precedent |
| Same DS-D1 meta-type, distinct grounded identity/lifecycle | Accept both | **PROPOSED—OWNER-GATED** concept witness |
| Differently named declarations with no separating witness | Reject or require alias/merge decision | **PROPOSED—OWNER-GATED** concept non-collapse |
| Relationship changes only an echo generated from itself | Reject as self-witness | **PROPOSED—OWNER-GATED** anti-laundering |
| Relationship changes a pre-existing validator or owner-approved transform | Eligible for D18 evaluation | **PROPOSED—OWNER-GATED** positive witness |
| Two canonical encodings normalize to one fact | Reject second authored authority | **PROPOSED—OWNER-GATED** fact authorship |
| Explicitly coupled representations with independent consequences | Accept both and record coupling | **PROPOSED—OWNER-GATED** coupled-but-distinct case |
| `RuleA→OpA`, `RuleA→OpB`, `RuleB→OpA` via `enforces` | Accept if DS-D8 degree semantics approve M:N | Proposed positive graph-degree witness |
| Canonical-only `creates` input | Blocked until canonical direction is chosen | Owner decision, then **DOWNSTREAM IMPLEMENTATION** |
| Two creators for one Entity; one creator for two Entity types | Separate accept/reject decisions | Owner-gated target indegree and source outdegree |
| Canonical input generates immutable view with provenance and parity | Accept; reject authored/generated drift | Proposed full generated-view behavior |

## Ordered next work

These gates must remain sequential because later validators depend on earlier semantic choices:

1. Approve a finite Concept Registry declaration non-collapse procedure.
2. Approve authority-bound normalization/equivalence vocabularies.
3. Approve canonical fact single authorship.
4. Clarify D18 sufficiency and prohibit self-created witnesses.
5. Approve the general generated-view classification and provenance procedure.
6. Choose the canonical direction for `creates` versus `creation_targets`.
7. Define DS-D8 identity fields and conventional degree semantics.
8. Decide whether Entity types have at most one creator Operation.
9. Decide whether one Operation may create more than one Entity type.
10. Only then change schemas, validators, compilers, generators, fixtures, and generated artifacts.
11. Optionally establish an owner and vocabulary for runtime instance cardinality if a use case requires it.

This dispatch proves neither global model minimality nor the existence of differently named duplicate concepts in the live corpus. It does not establish a current `creates` violation, select a canonical representation, derive a cardinality, or make multiplicity executable. UI cases are stress evidence only, and every proposed procedure remains a candidate until its owner gate closes.

## Open Questions

- **OQ-1 (BLOCKER)** — What finite witness vocabulary admits or collapses authored Concept Registry declarations? Recommendation: start with identity, lifecycle, validation, behavior, composition, ownership, and generation; require at least one independently grounded witness. Owner: DomainSpec `definitions-governance`.
- **OQ-2 (BLOCKER)** — What normalization rules establish fact equivalence within each authority boundary? Recommendation: approve typed, boundary-local normalizers before enforcing single authorship; do not use heuristic semantic similarity. Owner: DomainSpec `definitions-governance`.
- **OQ-3 (BLOCKER)** — Which D20–D25 consequences are sufficient for authored relationship eligibility? Recommendation: require a pre-existing or owner-approved witness and forbid a candidate’s own generated echo from satisfying D18. Owner: DomainSpec relationship definitions owner.
- **OQ-4 (BLOCKER)** — Is `creates` or `creation_targets` the canonical authored representation? Recommendation: choose one, generate the other with provenance, and retain parity validation at the boundary. Owner: DomainSpec `definitions-governance` and DS-D8 relationship authority owner.
- **OQ-5** — Must each Entity type have at most one creator Operation, and may one Operation create several Entity types? Recommendation: decide target indegree and source outdegree independently with positive and negative fixtures. Owner: DS-D8 relationship authority owner.
- **OQ-6** — What do DS-D8 multiplicity enum values mean operationally? Recommendation: approve source-outdegree/target-indegree semantics, include ordering data where claimed, and make each value executable. Owner: DS-D8 relationship authority owner.
- **OQ-7** — Does DomainSpec require runtime instance cardinality? Recommendation: keep it outside DS-D8 graph multiplicity until a concrete runtime use case and owner exist. Owner: DomainSpec architecture owner.
