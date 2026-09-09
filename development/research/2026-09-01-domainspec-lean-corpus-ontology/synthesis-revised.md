# Revised exact-binding research synthesis

## Defensible ceiling

**Exact frozen-tree enumeration plus source-level candidate semantics only.**

The prior headline `Evidence-closure gate: PASS` is **KILLED**. No materialized 3,600-row ledger, reproducible role classifier, commit-bound build run, semantic-completeness proof, ontology consumer test, owner selection, or ontology artifact exists.

```yaml
ResearchCorpusSummary:
  bound_commit: 169d4a46aeaafba62c8bad127fc0522c3223e962
  enumeration_method: git ls-tree -r --full-tree, filtered to tracked .lean paths
  aggregate_counts:
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

This is a research summary, not a corpus ledger, build receipt, ontology candidate set, PromotionRecord, admission decision, implementation binding, or publication authorization.

## Exact research-handoff record definitions

- `GitCommit`: one Git commit object identified by its full object ID. Here: `169d4a46aeaafba62c8bad127fc0522c3223e962`.

- `PathOccurrence`: tuple `(commit_oid, repository_relative_path, blob_oid)` established by the commit tree. It records provenance only; it does not establish semantic independence, ownership, canonicality, compilation, or authority.

- `SourceBlob`: immutable bytes identified by a full Git blob ID. Equal blobs establish byte identity only; they do not imply equal role, package ownership, evidence independence, or authority.

- `LeanDeclarationSource`: tuple `(commit_oid, path, blob_oid, namespace_qualified_declaration_name, declaration_kind, exact_source_selector)`. It claims only that the named declaration source exists in the frozen Git object.

- `AssumptionDependency`: named axiom or hypothesis dependency associated with a declaration or research finding. It must remain an assumption and cannot be represented as a proved proposition.

- `IntendedBuildSurface`: exact package-root declaration, target declaration where known, toolchain declaration, and intended source scope. It describes build intent only; it is not a compiled target or successful execution.

- `StoredBuildReceipt`: immutable stored result binding its own source/render/sandbox bytes, command or evaluator where recorded, toolchain or environment where recorded, result, and claim boundary. It supports only that exact historical scope.

- `ResearchFinding`: analyst-authored bounded claim containing full supporting selectors, method, uncertainty, claim ceiling, optional `proposed_record_kind`, non-authoritative `proposed_review_route`, `promotion_prerequisite_gap`, and `authority_effect=none`.

No `OntologyCandidate`, `CandidateSemantics`, `CandidateOwnerRoute`, `PossiblePromotionRecord`, `AdmittedMeaning`, `ProvedProposition`, or `ImplementationConformance` record is emitted.

## Frozen-tree coverage

The explorer’s exact Git-tree enumeration reports:

- 3,600 tracked `.lean` `PathOccurrence` values.
- Top-level conservation: `2,933 + 554 + 53 + 45 + 12 + 2 + 1 = 3,600` across `research-engineering`, `lean-formalization`, `lean-engineer`, `theorem`, `research`, `lean-scratch`, and `internal-tools`.
- 887 unique `SourceBlob` values.
- 96 duplicated blob groups covering 2,809 path occurrences.
- 2,713 excess occurrences, satisfying `887 + 2,713 = 3,600`.
- Therefore 791 blobs are singleton occurrences and 96 blobs have multiple occurrences.

Evidence: `research.md`, Agent 1 §Coverage Result and Agent 2 §Corpus shape. The aggregate source is the complete tree command over Git commit `169d4a46aeaafba62c8bad127fc0522c3223e962`; declaration identity is not applicable to a tree enumeration.

The complete row artifact is **absent**. The dispatch did not materialize a ledger containing all 3,600 full `(commit,path,blob)` tuples, duplicate-group IDs, package attribution, uncertainty, and executable classifier output.

### Heuristic role counts

The reported partition is:

- `canonical_source=569`
- `generated_copy=39`
- `scratch=27`
- `sandbox=1828`
- `verification_fixture=751`
- `attack=355`
- `unknown=31`

These values sum to 3,600 but remain an **unverified aggregate lexical heuristic**. No exact predicates, classifier version, or 3,600-row one-and-only-one assignment artifact was produced. Consequently:

- exclusivity is not independently reproducible;
- `canonical_source` is not a source-authority or ontology type;
- no role supports ownership, semantic completeness, build status, or ontology placement.

The universal exclusive-role classification claim is KILLED; the reported counts survive only as uncertain research metadata.

## Historical map reconciliation

The existing v0.2 map is a historical partial projection:

- 633 mapped paths;
- 2,967 omitted current paths;
- 356 of the 633 mapped records have a source-SHA mismatch;
- 277 mapped records match;
- `633 + 2,967 = 3,600`.

Exact historical-map selectors:

- `169d4a46aeaafba62c8bad127fc0522c3223e962:experiments/research-state-schema-bootstrap/lean-file-map/README.md:91bc4a8677d3a2b045c085ec28b673a2397df7bf:<map-contract-prose>`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:experiments/research-state-schema-bootstrap/lean-file-map/manifest-v0.2.json:226ee46405c94a557e643644f9dbfba8a1f77448:/by_source_path`

The two failure kinds remain distinct:

- `sha_mismatch`: a mapped identity exists but does not bind the frozen source bytes. Any dependent semantic interpretation is `not_evaluable` until rebound and reviewed.
- `omission`: no map record exists for the path. It is coverage residue, not evidence that the path lacks semantic relevance.

The claim that v0.2 is a complete or current corpus map is KILLED.

## Package and build precedents

There is no umbrella whole-corpus package or build owner.

| Intended surface | Exact precedent | Bounded finding |
|---|---|---|
| `leanEngineer` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/lakefile.toml:f34d12d54ad308fd94262c5332f457ab75134a0a:<package-declarations>` | Owns its declared build surface only |
| `domainspec` mathematical package | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/files/lakefile.toml:77ac1d92c142ace87cc739d1265e988fa533519a:<package-declarations>` | Owns its declared build surface only |
| Bounded specification-ontology root | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/DomainSpecOntology.lean:bcdf09ff98d646b6972ae855d40d2b24a14cd546:<module-root>` | Exposes the bounded specification package; does not claim universal ontology, lifecycle, product correspondence, or admission |
| Other paired roots | 243 paired Lake/toolchain directories reported by Agent 1 | Separately scoped intended surfaces; not 243 verified packages or owners |

The explorer also reports 3,013 Lean paths beneath a paired root and 587 outside. Because the row ledger is absent, this remains an aggregate package-attribution result, not independently validated per occurrence.

No live elaboration, evaluator, or `lake build` ran. `build_status=not_evaluable`.

## Retained source-level semantic families

Only families with exact frozen selectors survive.

| Family | Exact `LeanDeclarationSource` | Claim ceiling |
|---|---|---|
| Typed specification edges | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:Edge.WellTyped` | Source defines a typed-edge predicate |
| Formalization eligibility | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:FormalizesAssertion.Eligible` | Source defines eligibility requiring bounded formal/fidelity evidence |
| Verification currentness | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:VerificationReceipt.CurrentFor` | Source defines request/digest/supersession-sensitive currentness |
| Evidence/decision separation | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:evidence_does_not_determine_discharge` | Source contains a theorem declaration within its formal model |
| Projection disclaimer | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:IntegratedProjection.DisclaimsAuthority` | Source defines a negative authority guard, not admissibility |
| Reversed-edge falsifier | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:reversed_formalizes_edge_not_well_typed` | Source-level negative fixture; build status not evaluated |
| Same-evidence decision distinction | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:same_evidence_allows_distinct_discharge_decisions` | Source-level finite-model witness |
| Permission policy soundness | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538:decidePolicy_sound` | Local model theorem source; no mediation or deployment claim |
| Entropy monotonicity | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/SecondLawDiscrete.lean:a43c5fcb79c53ef05c66054d445e0c4bf131e23e:entropy_nondecreasing_under_temporal_coarsening` | Theorem source under its exact definitions and assumptions |
| Counterexample family | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/M6Counter.lean:1a54f58e817387bb5cb2276abbda6ff3a1167212:m6_strong_refuted_poly` | Negative theorem source, not failed proof work |
| Lifecycle residue | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` | Source-local lifecycle model only |
| Edge grammar discrimination | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:87bf76ce70185c7d569c0994afd37c9139cb61ff:edgeGrammar_beatsCount` | Source fixture distinguishes structure from counts |
| Compositional negative fixture | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2EdgeGrammarComposition.lean:e0ab974e84e480b243fcd40636fc66b3f2363ba6:wrongDirection_rejected_of_final_batch` | Source-level falsifier; execution not evaluated |
| Semantic/provenance envelope | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:1b6e118cc001e4da952d8a221fe2f8a9495a51f0:contractDecision_resolvedBy_evidenceEnvelope` | Provisional schema-pattern source, not canonical receipt infrastructure |

“Governed context and dispatch” is removed from the family map because the explorer supplied no exact representative selector.

Semantic completeness remains `not_evaluable`: representative declarations do not establish exhaustive declaration extraction, assumption closure, theorem-family closure, or meaning coverage.

## Assumption dependencies

The observed declaration-level axioms must remain assumptions:

- `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/DomainSpec.lean:bd53d70d9d65175fb4cfd8bae80358e055db390c:EdgeLaw`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_relations`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_morphisms`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_weak`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_medium`
- `169d4a46aeaafba62c8bad127fc0522c3223e962:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_strong`

A theorem transitively depending on an axiom could only become a checked derivation relative to that assumption after matching build evidence. It cannot become unconditional product or ontology truth.

## Stored 48/48 ceiling

Exact stored receipt locator:

`169d4a46aeaafba62c8bad127fc0522c3223e962:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/gcdex-bezout/author-from-47/verification-independent/report/report.json:f6c33dbaccc49de94833dd9ce57f670c6e161bc1:/passed_specs`

The commit-contained report records `passed_specs: 48`. The permitted claim is:

> A stored exact-scope historical report records 48/48 selected benchmark specifications under its bounded evaluator context.

It does not establish a current rerun, all copied occurrences, a complete clean Lake build, all alternative stubs being sorry-free, whole-corpus correctness, ontology utility, acceptance, or admission.

## Research findings with ontology-shaped review proposals

These remain `ResearchFinding` records only.

| Finding | Proposed `record_kind` | Exact support | Proposed review route | `promotion_prerequisite_gap` |
|---|---|---|---|---|
| Typed direction matters | `relation` plus `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:Edge.WellTyped`; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:reversed_formalizes_edge_not_well_typed` | DomainSpec package owner; business-meaning owner for cross-domain fidelity | Exact definitions, mapping bytes, build receipt, fidelity decision, owner selection |
| Dual-owner formalization eligibility | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:FormalizesAssertion.Eligible` | Formal-claim and business-meaning owners | Assertion digest, role definitions, decisions, declared loss |
| Request-indexed currentness | `predicate` plus `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:VerificationReceipt.CurrentFor` | Subject verification owner and governance review | Supersession authority, exact request schema, build/fixture receipt |
| Evidence does not determine discharge | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:evidence_does_not_determine_discharge` | Governance-model reviewer plus obligation owner | Canonical discharge definition, owner decision model, executed fixtures |
| Projection disclaimer | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:IntegratedProjection.DisclaimsAuthority` | Projection/compiler reviewer plus governance meaning owner | Exact projection contract, input/output digests, declared loss, adoption decision |
| Edge grammar discriminates equal counts | `invariant` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:87bf76ce70185c7d569c0994afd37c9139cb61ff:edgeGrammar_beatsCount`; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/CAV2EdgeGrammarComposition.lean:e0ab974e84e480b243fcd40636fc66b3f2363ba6:wrongDirection_rejected_of_final_batch` | CAV2 governance semantic review, not ambient ownership | Canonical endpoint kinds, relation registry, build receipt, consumer test, owner decision |
| Lifecycle residue mapping | `mapping` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` | Definitions-governance and governance-model review | Mapping from source-local `projected`; canonical promotion/admission definitions; owner selection |
| Semantic/provenance joint envelope | `schema` | `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:1b6e118cc001e4da952d8a221fe2f8a9495a51f0:contractDecision_resolvedBy_evidenceEnvelope` | Governance-model review | Canonical evidence schema, positive/negative execution receipts, identified consumer, owner decision |

Every row has `authority_effect=none`. None is an authored ontology record.

## Provenance relations and forbidden inferences

Permitted research relations:

- `PathOccurrence.commit_oid` identifies its `GitCommit`.
- `PathOccurrence.blob_oid` identifies its `SourceBlob`.
- `LeanDeclarationSource` binds one exact declaration name to one `PathOccurrence` and source selector.
- `ResearchFinding.supported_by` references one or more exact source selectors.
- `ResearchFinding.proposed_review_route` suggests review responsibility without selecting an owner.
- `ResearchFinding.promotion_prerequisite_gap` records missing predecessor evidence.

These relations do not imply derivation, authority transfer, compilation, proof, product meaning, or admission.

Killed inferences include:

- path occurrence → independent concept;
- heuristic path role → canonical source authority;
- shared blob → shared owner or independent evidence;
- declaration source → compiled or proved-current proposition;
- axiom → proved claim;
- stored pass → current pass;
- Lean theorem → product truth;
- Inventory entry → ontology record;
- projection → authority;
- evidence receipt → discharge;
- source-local `projected` → promoted or admitted;
- nearby `cav2.governance-model` → whole-corpus ownership.

## Ownership result

Existing precedent supports split review responsibilities:

- DomainSpec package owner: bounded formal structures and package-local build/proof claims.
- Business-meaning owner: fidelity of cross-domain formalization mappings.
- Governance-model owner: review of lifecycle, evidence, and authority-shaped findings.
- Definitions-governance: `projected`, `promotion`, `admission`, `current`, and `discharge`.
- Subject verification owner: receipt scope and supersession.

This is a proposed review split, not ownership assignment. The complete occurrence ledger, cross-corpus semantic taxonomy, whole-corpus projection, consumer utility claim, and promotion lifecycle remain `owner_status=unselected`.

## D65 predecessor gaps

| D65 stage | Current research state |
|---|---|
| Canonical definitions | Missing for load-bearing cross-package terms |
| Adopted Product Capability | Absent |
| Capability-local business ontology | Absent for the whole corpus |
| DomainSpec v2 authored source | Absent/unadmitted for this projection |
| Deterministic compiled graph/system ontology | Absent |
| Exact implementation binding | Absent |
| Conformance evidence | Absent |
| Owner admission | Unselected and unauthorized |

Research findings and Lean source selectors do not advance any D65 predecessor.

## Separately authorized deferred successor routes

1. **Local `main` fast-forward**

   Under a separate Git-mutation authorization, re-check remote `HEAD` and `refs/heads/main`; stop on drift from `169d4a46aeaafba62c8bad127fc0522c3223e962`; then, if repository state permits, fast-forward the local `main` from `2534328b188ce554d6dc4cab88a969f5dbfd4c83`. This is `LocalBranchMovement`, not publication, ontology mutation, or admission.

2. **Research closure, then possible ontology work**

   Under separately authorized future work:

   - materialize and validate the 3,600-row occurrence ledger with executable role predicates and conservation checks;
   - extract exact declaration and assumption closure for every retained family;
   - run commit/toolchain/command-bound representative positive and negative builds if authorized;
   - identify a concrete ontology consumer, measurable criterion, and positive/negative consumer test if an owner requests utility evaluation;
   - obtain an explicit owner selection and canonical definitions;
   - only then consider authoring digest-bound ontology records under a separately admitted mutation route;
   - keep ontology admission as a further immutable owner decision.

None of these deferred requirements is imposed on or performed by the current read-only dispatch.
