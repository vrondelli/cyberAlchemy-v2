# DomainSpec Lean corpus: bounded research findings

Dispatch: `2026-09-01-domainspec-lean-corpus-ontology`

## Finding ceiling

The defensible result is **exact frozen-tree enumeration plus source-level candidate semantics only**.

At explorer execution time on 2026-09-01, remote `HEAD` and `refs/heads/main` both resolved to Git commit `169d4a46aeaafba62c8bad127fc0522c3223e962`; no `master` ref was returned. That observation binds this report to the frozen commit but is not a continuing remote-freshness guarantee.

The frozen Git tree was enumerated with:

```text
git -C domainspec-lean-formalization ls-tree -r --full-tree 169d4a46aeaafba62c8bad127fc0522c3223e962
```

filtered to tracked paths ending in `.lean`. It yielded 3,600 path occurrences and 887 unique Git blobs. The complete 3,600-row occurrence ledger was **not materialized**. Therefore this document is not a reproducible per-path role inventory, exhaustive semantic inventory, build receipt, ontology record set, owner decision, or admission record.

```yaml
ResearchCorpusSummary:
  bound_commit: 169d4a46aeaafba62c8bad127fc0522c3223e962
  enumeration_method: git ls-tree -r --full-tree filtered to tracked .lean paths
  tracked_path_occurrences: 3600
  unique_source_blobs: 887
  duplicate_blob_groups: 96
  duplicated_path_occurrences: 2809
  excess_duplicate_occurrences: 2713
  row_artifact_status: absent
  heuristic_role_assignment_status: unverified_aggregate
  semantic_completeness: not_evaluable
  build_status: not_evaluable
  ontology_utility: not_evaluable
  owner_status: unselected
  authority_effect: none
```

The writer handoff was allowed to proceed because each load-bearing claim was explicitly bound, deferred, or killed. That is a workflow readiness condition, **not** evidence-closure PASS.

## Frozen-tree count reconciliation

| Top-level path | Tracked `.lean` occurrences |
|---|---:|
| `research-engineering` | 2,933 |
| `lean-formalization` | 554 |
| `lean-engineer` | 53 |
| `theorem` | 45 |
| `research` | 12 |
| `lean-scratch` | 2 |
| `internal-tools` | 1 |
| **Total** | **3,600** |

Duplicate conservation also closes at the aggregate level: 96 duplicated blob groups cover 2,809 occurrences, and 2,713 are excess occurrences beyond one occurrence per blob; `887 + 2,713 = 3,600`. Thus 791 blobs occur once and 96 occur more than once.

The largest copied-fixture pattern is concrete: six blobs each occur 237 times (`bd053bf7ad54cd7088724ee199a135ffe369842c`, `b79b634befa48e9651242107117af4a70e99dfc9`, `b23e6ee6983d77340ffa38b10c3d5e21d8a1e210`, `6fcfc2706ddb82d0e8677fe3d440821d719d733e`, `22bc635fbac3a75fa4186f43d47b30894716dc91`, and `192d82cb3f481c4ea13421bdebb179ad81915875`); `f060b7e05d087d7308e1ebd7dc182401e4ff9b46` occurs 236 times. Byte identity preserves provenance multiplicity but does not create independent semantic evidence, shared ownership, or shared authority.

Generated, sandbox, attack, grading, render, and verification copies must therefore remain separate `PathOccurrence` values pointing to shared `SourceBlob` values. They must not be collapsed away as provenance, nor counted as independent theorem families or proof witnesses.

### Heuristic path roles

The reported lexical partition was:

| `heuristic_path_role` | Aggregate count |
|---|---:|
| `canonical_source` | 569 |
| `generated_copy` | 39 |
| `scratch` | 27 |
| `sandbox` | 1,828 |
| `verification_fixture` | 751 |
| `attack` | 355 |
| `unknown` | 31 |
| **Total** | **3,600** |

The precedence was `scratch > sandbox > verification fixture > attack > generated copy > canonical-source root > unknown`. These are unverified aggregate lexical labels: no executable predicates, classifier version, or one-row-per-occurrence assignment artifact exists. The universal role-classification claim is killed. In particular, `canonical_source` is neither source authority nor an ontology type, and no role establishes semantic completeness, ownership, build success, or ontology placement.

## Historical map: mismatch is not omission

The v0.2 historical projection contains 633 mapped paths. All mapped paths remain present in the frozen tree, but only 277 recorded source SHA-256 values match the frozen bytes; 356 differ. A further 2,967 frozen-tree paths have no v0.2 row. The arithmetic is `633 + 2,967 = 3,600`.

Exact map selectors:

- `169d4a46aeaafba62c8bad127fc0522c3223e962:experiments/research-state-schema-bootstrap/lean-file-map/README.md:91bc4a8677d3a2b045c085ec28b673a2397df7bf:<map-contract-prose>`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:experiments/research-state-schema-bootstrap/lean-file-map/manifest-v0.2.json:226ee46405c94a557e643644f9dbfba8a1f77448:/by_source_path`

These failure modes are distinct:

- `sha_mismatch`: a historical mapping exists, but it does not bind the frozen bytes; dependent semantic interpretation is `not_evaluable` until rebound and reviewed.
- `omission`: no mapping row exists; this is coverage residue, not evidence that the source lacks semantic relevance.

The v0.2 map remains useful historical and navigational precedent, but its completeness and current-byte-binding claims are killed for this commit.

## Package, import, and build topology

This is a multi-root corpus, not one Lake package:

- 243 `lakefile.lean` or `lakefile.toml` files, 244 `lean-toolchain` files, and 243 directories containing both were observed.
- 3,013 Lean paths are beneath a paired Lake/toolchain root; 587 are outside one.
- The largest nearest paired roots include `lean-engineer` with 53 paths, `lean-formalization/files/new` with 31, a `powmod-right-reduction` diagnostic sandbox with 25, and `theorem/agents-strategy/lean-scratch` with 25. Many remaining roots are isolated attack/evaluation sandboxes.
- The historical v0.2 map declares only six projects, so it does not describe all 243 paired roots.
- `lean-engineer/lakefile.toml` at blob `f34d12d54ad308fd94262c5332f457ab75134a0a` owns only its declared `leanEngineer` surface.
- `lean-formalization/files/lakefile.toml` at blob `77ac1d92c142ace87cc739d1265e988fa533519a` owns only its declared `domainspec` mathematical surface.
- `lean-engineer/DomainSpecOntology.lean` at blob `bcdf09ff98d646b6972ae855d40d2b24a14cd546` exposes a bounded specification module root, not universal ontology, lifecycle, product-correspondence, or admission authority.

An import-line scan found imports in 3,335 of 3,600 path occurrences and 7,732 module-token edges. Against only the six historical map project roots, 915 edges resolved internally and 6,817 were external or unresolved; that resolution is heuristic because the 243 roots were not reconstructed package by package. Dominant copied-harness imports—`Galoistools.Harness` 1,189, `Impl.Ring` 948, `Spec.Ring` 946, `Impl.Division` 722, `Spec.Division` 716, `Bundle` 474, and `Test` 237—corroborate fixture repetition rather than 3,600 independent modules.

No live elaboration, evaluator, direct target, or `lake build` ran at the bound commit. Package declarations and `defaultTargets` describe intended build surfaces only. Current compilation and proof status remain `not_evaluable`.

## Retained source-level semantic families

The following families survive only as exact source-presence findings. Every selector is `commit:path:blob:declaration`.

| Family | Exact `LeanDeclarationSource` | Bounded source-level claim |
|---|---|---|
| Typed specification edges | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:Edge.WellTyped` | Defines a typed-edge predicate |
| Formalization eligibility | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:FormalizesAssertion.Eligible` | Defines eligibility requiring bounded formal and fidelity evidence |
| Verification currentness | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:VerificationReceipt.CurrentFor` | Defines request-, digest-, and supersession-sensitive currentness |
| Evidence/decision separation | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:evidence_does_not_determine_discharge` | Contains a theorem declaration inside its local formal model |
| Projection disclaimer | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:IntegratedProjection.DisclaimsAuthority` | Defines a negative authority guard, not admissibility |
| Reversed-edge falsifier | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:reversed_formalizes_edge_not_well_typed` | Source-level negative fixture; execution not evaluated |
| Same-evidence decision distinction | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:same_evidence_allows_distinct_discharge_decisions` | Source-level finite-model witness |
| Permission policy soundness | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538:decidePolicy_sound` | Local-model theorem source; no mediation or deployment claim |
| Entropy monotonicity | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/SecondLawDiscrete.lean:a43c5fcb79c53ef05c66054d445e0c4bf131e23e:entropy_nondecreasing_under_temporal_coarsening` | Theorem source under its exact definitions and assumptions |
| Counterexample family | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/M6Counter.lean:1a54f58e817387bb5cb2276abbda6ff3a1167212:m6_strong_refuted_poly` | Negative theorem source, not failed proof work |
| Lifecycle residue | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` | Source-local lifecycle model only |
| Edge grammar discrimination | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:87bf76ce70185c7d569c0994afd37c9139cb61ff:edgeGrammar_beatsCount` | Source fixture distinguishes structure from counts |
| Compositional negative fixture | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2EdgeGrammarComposition.lean:e0ab974e84e480b243fcd40636fc66b3f2363ba6:wrongDirection_rejected_of_final_batch` | Source-level falsifier; execution not evaluated |
| Semantic/provenance envelope | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:1b6e118cc001e4da952d8a221fe2f8a9495a51f0:contractDecision_resolvedBy_evidenceEnvelope` | Provisional schema-pattern source, not canonical receipt infrastructure |

“Governed context and dispatch” is excluded because no full representative selector was supplied. These retained rows do not establish exhaustive declaration extraction, assumption closure, theorem-family closure, semantic completeness, or current Lean acceptance.

## Assumption dependencies

The observable declaration-level axioms remain assumptions:

- `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/DomainSpec.lean:bd53d70d9d65175fb4cfd8bae80358e055db390c:EdgeLaw`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_relations`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_morphisms`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_weak`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_medium`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_strong`

A future matching build could establish a checked derivation relative to its exact assumption set. It could not upgrade that derivation to unconditional product truth, ontology meaning, implementation conformance, or admission.

## Stored 48/48 receipt ceiling

Exact stored locator:

`169d4a46aeaafba62c8bad127fc0522c3223e962:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/gcdex-bezout/author-from-47/verification-independent/report/report.json:f6c33dbaccc49de94833dd9ce57f670c6e161bc1:/passed_specs`

The stored, commit-contained report records `passed_specs: 48`: a historical 48/48 result for its selected benchmark specifications under its bounded evaluator context. It is not a current rerun, clean Lake build, proof of all copied occurrences, proof that every alternative stub is sorry-free, whole-corpus correctness result, consumer-utility result, acceptance, or admission.

## Typed research findings for possible review

The following are `ResearchFinding` records, not `OntologyCandidate` or `PromotionRecord` records. Each has `authority_effect=none`; each review route is a non-authoritative proposal, not an owner selection.

| Research finding | Proposed `record_kind` | Exact support | Proposed review route | `promotion_prerequisite_gap` |
|---|---|---|---|---|
| Typed direction matters | `relation` plus `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:Edge.WellTyped`; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:reversed_formalizes_edge_not_well_typed` | DomainSpec package review plus business-meaning review | Exact definitions, mapping bytes, build receipt, fidelity decision, owner selection |
| Dual-owner formalization eligibility | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:FormalizesAssertion.Eligible` | Formal-claim and business-meaning review | Assertion digest, role definitions, decisions, declared loss |
| Request-indexed currentness | `predicate` plus `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:VerificationReceipt.CurrentFor` | Subject-verification and governance review | Supersession authority, exact request schema, build/fixture receipt |
| Evidence does not determine discharge | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:evidence_does_not_determine_discharge` | Governance-model and obligation review | Canonical discharge definition, owner decision model, executed fixtures |
| Projection disclaimer | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:IntegratedProjection.DisclaimsAuthority` | Projection/compiler and governance-meaning review | Exact projection contract, input/output digests, declared loss, adoption decision |
| Edge grammar discriminates equal counts | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:87bf76ce70185c7d569c0994afd37c9139cb61ff:edgeGrammar_beatsCount`; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2EdgeGrammarComposition.lean:e0ab974e84e480b243fcd40636fc66b3f2363ba6:wrongDirection_rejected_of_final_batch` | CAV2 governance semantic review only | Canonical endpoint kinds, relation registry, build receipt, consumer test, owner decision |
| Lifecycle residue mapping | `mapping` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` | Definitions-governance and governance-model review | Mapping from source-local `projected`; canonical promotion/admission definitions; owner selection |
| Semantic/provenance joint envelope | `schema` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:1b6e118cc001e4da952d8a221fe2f8a9495a51f0:contractDecision_resolvedBy_evidenceEnvelope` | Governance-model review | Canonical evidence schema, positive/negative execution receipts, identified consumer, owner decision |

Existing precedent supports split review responsibilities for package-local formal claims, business fidelity, governance meaning, definitions, and receipt supersession. It selects no ambient owner for the 3,600-row occurrence ledger, cross-corpus semantic taxonomy, whole-corpus projection, consumer-utility claim, or promotion lifecycle. Their status remains `owner_status=unselected`.

Forbidden inferences include path occurrence to independent concept; shared blob to shared owner; heuristic role to canonical authority; declaration source to current compiled proof; axiom to proved claim; stored pass to current pass; Lean theorem to product truth; research finding to ontology record; projection to authority; evidence to discharge; source-local `projected` to promoted/admitted; and nearby `cav2.governance-model` to whole-corpus ownership.

## D65 predecessor gaps

| CAV2-D65 stage | Current state for this projection |
|---|---|
| Canonical definitions | Missing for load-bearing cross-package terms |
| Adopted Product Capability | Absent |
| Capability-local business ontology | Absent for the whole corpus |
| DomainSpec v2 authored source | Absent or unadmitted for this projection |
| Deterministic compiled graph and system ontology | Absent |
| Exact implementation binding | Absent |
| Conformance evidence | Absent |
| Owner admission | Unselected and unauthorized |

This research dispatch advances none of these stages.

## Research verdict matrix

| Claim | Verdict | Surviving scope or blocker |
|---|---|---|
| Remote binding at explorer execution time | `BOUND` | `HEAD` and `main` observed at the frozen commit; not continuing freshness |
| Frozen-tree path enumeration | `BOUND` | 3,600 tracked Lean occurrences with top-level conservation |
| Blob duplication aggregates | `BOUND` | 887 unique blobs; 96 duplicate groups; 2,809 duplicated occurrences; 2,713 excess |
| Complete 3,600-row occurrence ledger | `DEFERRED` | No materialized row artifact, executable classifier, or per-row conservation validation |
| Exclusive semantic path-role partition | `KILLED` | Only an unverified aggregate lexical heuristic exists |
| Historical v0.2 map current and complete | `KILLED` | 356 SHA mismatches and 2,967 omissions are distinct failures |
| Retained declaration source presence | `BOUND` | Exact frozen source selectors only |
| Semantic completeness | `KILLED` | No exhaustive declaration, assumption, family, or meaning closure |
| Current representative or whole-corpus build/proof | `KILLED` | No commit-bound build or elaboration receipts |
| Stored selected-scope 48/48 report | `BOUND` | Historical exact-scope report only |
| Source-level positive and negative fixtures | `BOUND` | Declaration source presence; execution status remains `not_evaluable` |
| Ontology-consumer utility | `KILLED` | No identified consumer, measurable criterion, or executed consumer test |
| Whole-corpus ownership or promotion route | `BOUND` as negative finding | Proposed split reviews exist; owner remains unselected |
| D65 completion, ontology authoring, or admission | `BOUND` as absent | All predecessors remain absent, unresolved, or unauthorized |

Overall verdict: the research taxonomy is usable as a bounded review aid. It is not semantically complete, ontology-authoring-ready, admitted, implementation-conformant, or effect-authorized.

## Separate deferred successor routes

### 1. Local `main` fast-forward

This requires a separate Git-mutation authorization. Re-check remote `HEAD` and `refs/heads/main`; stop if either drifts from `169d4a46aeaafba62c8bad127fc0522c3223e962`. If repository state still permits, fast-forward local `main` from `2534328b188ce554d6dc4cab88a969f5dbfd4c83`. This would be local branch movement only—not publication, ontology mutation, acceptance, or admission.

### 2. Research closure, then possible ontology authoring and admission

This requires separately authorized future work in sequence:

1. Materialize and validate the 3,600-row occurrence ledger with executable role predicates and count-conservation gates.
2. Extract exact declaration and assumption closure for every retained family.
3. If authorized, run commit-, toolchain-, command-, and result-bound representative positive and negative builds.
4. If an owner requests utility evaluation, identify a concrete consumer, measurable criterion, and positive/negative consumer test.
5. Obtain explicit owner selection and canonical definitions.
6. Only then consider digest-bound ontology authoring under a separately admitted mutation route.
7. Keep ontology admission as a later immutable owner decision over exact candidate bytes.

Neither successor route was executed here. This file changes no Lean source, ontology source, branch, publication surface, or external system.
