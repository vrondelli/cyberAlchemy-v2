# Exact-binding synthesis

**Evidence-closure gate: PASS for a research-only candidate handoff.** The explorer-observed remote `HEAD` and `main` matched commit `169d4a46aeaafba62c8bad127fc0522c3223e962`, and all three explorers independently reconciled the corpus totals. This is not a live freshness check, build receipt, proof-currentness claim, ontology admission, owner acceptance, or execution authority.

Evidence abbreviations below: **H1** = `research.md` Agent 1, **G2** = Agent 2, **S3** = Agent 3, including their robot-talk addenda.

## Corpus coverage and count conservation

| Surface | Conserved result | Evidence / selector |
|---|---:|---|
| Tracked Lean occurrences | **3,600 paths** | H1 §Coverage; exact enumeration `git ls-tree -r --full-tree 169d4a46aeaafba62c8bad127fc0522c3223e962`, filtered to `.lean`; declaration selector N/A because this is the complete tree tuple set |
| Top-level partition | `2933 + 554 + 53 + 45 + 12 + 2 + 1 = 3600` | H1 §Coverage; `research-engineering`, `lean-formalization`, `lean-engineer`, `theorem`, `research`, `lean-scratch`, `internal-tools` |
| Exclusive heuristic roles | `569 canonical_source + 39 generated_copy + 27 scratch + 1828 sandbox + 751 verification_fixture + 355 attack + 31 unknown = 3600` | H1 §Path-role classification; roles are lexical provenance candidates, not authority. Representative exact occurrence: `169d4a46aeaafba62c8bad127fc0522c3223e962:internal-tools/lean-richness-proof/ZagrMarketplace.lean:b136aa3fb6b0300e4674fb9d65ef0b06db7f8266:<path-role-only>` |
| Unique blobs | **887** | H1 §Coverage; G2 §Corpus shape |
| Duplicate conservation | `791 singleton blobs + 96 duplicated blob groups = 887`; duplicated groups cover `2,809` paths; `887 + 2,713 excess occurrences = 3,600` | H1 §Exact-blob duplication; representative shared blob `169d4a46aeaafba62c8bad127fc0522c3223e962:…/sandbox/Galoistools.lean:192d82cb3f481c4ea13421bdebb179ad81915875:<path-occurrence>` |
| Build-root attribution | `3,013 beneath paired roots + 587 outside = 3,600` | H1 §Build/package roots; 243 paired `lakefile`/`lean-toolchain` directories and 244 toolchains |
| Import scan | `3,335 with imports + 265 without = 3,600`; `915 internal + 6,817 external-or-unresolved = 7,732` token edges | H1 §Import topology; resolution is a six-project heuristic, not full package semantics |
| Historical map reconciliation | `633 mapped + 2,967 omitted = 3,600`; among the 633 mapped records, **356 are `sha_mismatch`** and 277 match | H1 §Lean-file-map reconciliation; S3 robot-talk correction |
| Exhaustive row artifact | **Deferred** | The Git-object enumeration established closure, but no new 3,600-row TSV/JSONL was materialized in this read-only synthesis. A successor must emit and validate it from the exact tree, not from the stale map. |

`sha_mismatch` and `omission` are distinct:

- `sha_mismatch`: a historical mapped identity exists but does not bind the frozen blob; dependent semantics are `not_evaluable` pending rebinding.
- `omission`: no record exists for a current path; this is coverage residue, not evidence of semantic irrelevance.

## Package and build topology

| Surface | Synthesis | Evidence / selector |
|---|---|---|
| `lean-engineer` | Candidate build root using Lean `v4.30.0-rc2`; default targets focus on permission modules and `permguard`; specification ontology and several context/dispatch libraries are declared but non-default | G2 §Lake/build surfaces; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538:decidePolicy_sound` |
| Main mathematical package | `lean-formalization/files/lakefile.toml` has a large explicit default-target set, but many tracked sources remain experimental, old, scratch, or direct-build-only | G2 §Lake/build surfaces; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/SecondLawDiscrete.lean:a43c5fcb79c53ef05c66054d445e0c4bf131e23e:entropy_nondecreasing_under_temporal_coarsening` |
| Staging surface | `lean-formalization/files/new` is an isolated candidate root, not equivalent to the main package | H1/G2 §Build surfaces; exact semantic ownership deferred |
| Vero and theorem roots | Hundreds of attack/evaluation sandboxes plus isolated theorem/research roots are provenance-specific build surfaces, not one corpus build graph or 243 verified packages | H1/G2 robot-talk; representative `169d4a46aeaafba62c8bad127fc0522c3223e962:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/add-assoc-eval/candidate/validation/sandbox/Galoistools.lean:192d82cb3f481c4ea13421bdebb179ad81915875:<fixture-root>` |
| Current build state | **Deferred / not_evaluable** | No live evaluator, elaboration, or `lake build` ran at the frozen commit. Candidate build roots are intended surfaces, not receipts. |

## Semantic theorem-family map

| Family | Bounded meaning | Exact source selector |
|---|---|---|
| Typed specification ontology | Separates business meanings, formal claims, obligations, evidence, owner-local catalogs, typed edges, request-bound receipts, discharge decisions, and authority-disclaiming projections | G2 §Typed specification; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748:Edge.WellTyped`; also `FormalizesAssertion.Eligible`, `VerificationReceipt.CurrentFor`, `evidence_does_not_determine_discharge`, `IntegratedProjection.DisclaimsAuthority` |
| Negative specification fixtures | Demonstrate direction, digest/coverage, supersession, evidence/discharge, and navigation/authority separations inside the finite model | G2/S3; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8:reversed_formalizes_edge_not_well_typed`; also `same_evidence_allows_distinct_discharge_decisions`, `navigation_projection_disclaims_authority` |
| Permission/reference monitor | Executable policy decision semantics and local soundness; no claim of mediation, non-bypassability, parser fidelity, or deployed identity | G2 §Permission; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538:decidePolicy_sound` |
| Governed context and dispatch | Candidate cluster identified, but a representative exact selector was not supplied in the explorer return | G2 §Governed context; **deferred** rather than promoted into the ontology synthesis |
| Residue/entropy/categorical models | Positive, negative, collapse, counterexample, and “not automatic” results must retain theorem polarity | G2 §Residue; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/SecondLawDiscrete.lean:a43c5fcb79c53ef05c66054d445e0c4bf131e23e:entropyProfile_plateau`; `…:M6Counter.lean:1a54f58e817387bb5cb2276abbda6ff3a1167212:m6_strong_refuted_poly`; `…:PerspectiveMark.lean:bdecf747b46ffd013d934d0e3da469f0981d33be:mark_sound_not_automatic` |
| Authority-lifecycle residue | Source-local statuses and residue behavior; `projected` is not canonical promotion or admission | G2/S3; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` |
| Assumption surfaces | Six observed declaration-level axioms are typed assumptions, not proved claims | G2 robot-talk; `169d4a46aeaafba62c8bad127fc0522c3223e962:lean-formalization/DomainSpec.lean:bd53d70d9d65175fb4cfd8bae80358e055db390c:EdgeLaw`; `…:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_relations`; `…:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_strong` |

## Proof and claim-status matrix

| Evidence | Allowed claim | Forbidden upgrade |
|---|---|---|
| Frozen theorem/declaration body | `lean_declaration_source` at exact selector | compiled, proved-current, product truth, conformance |
| Positive/negative finite fixtures | Source contains discriminating witnesses relative to its definitions and assumptions | completeness or production correspondence |
| Axiom declarations | `assumption_dependency` with declaration kind retained | proved theorem or unconditional ontology truth |
| Raw lexical counts | Corpus-shape diagnostics only; path-level and duplication-inflated | unique theorem/concept cardinality |
| Stored Vero report | A commit-contained bounded report records `passed_specs: 48` for its exact evaluator scope | current rerun, whole-corpus build, all alternatives sorry-free, admission |
| Whole corpus | Exact path/blob enumeration is closed | semantic exhaustiveness or universal correctness |

The bounded receipt selector is H1/G2 robot-talk: `169d4a46aeaafba62c8bad127fc0522c3223e962:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/gcdex-bezout/author-from-47/verification-independent/report/report.json:f6c33dbaccc49de94833dd9ce57f670c6e161bc1:passed_specs`. Its ceiling is **stored 48/48 for the selected benchmark scope**, with no live build or evaluator run here.

## Duplicate/provenance graph

Required candidate graph:

`GitCommit → PathOccurrence → Blob → DeclarationSelector → CandidateSemantics → CandidateOwnerRoute → PossiblePromotionRecord`

Side relations:

- `DeclarationSelector → dependsOn → AssumptionDependency`
- `BuildReceipt → verifiesExactScope → {commit, toolchain, candidate_build_root, selectors}`
- `EvidenceArtifact → supports → ProofObligation`
- `OwnerDecision → mayDischarge → ProofObligation`
- `GeneratedProjection → derivedFrom → accepted canonical source`

Killed shortcuts: `LeanPath isIndependentConcept`, `EvidenceArtifact discharges`, `GeneratedProjection isAuthority`, `LeanDeclaration impliesProductCapability`, `StoredPass impliesCurrentPass`, `Axiom isProvedClaim`, and `projected impliesPromotedOrAdmitted`.

## Candidate ontology rows

All rows are candidate-only under `cav2.governance-model`, whose profile remains `candidate`, `authority_effect=none`, `enforcement_effect=none`.

| Candidate | Relations / provenance | Owner route and residue |
|---|---|---|
| Typed immutable reference | `identifies_version_of`, `digest_binds`, `typed_as`; S3 §Matrix; `169d…:lean-engineer/SpecificationOntologyKernel.lean:f14321…:ImmutableRef` | DomainSpec ontology/package owner reviews structure; cross-domain meaning owner unresolved |
| Typed directional grammar | `formalizes`, `derivedFrom`; S3 §Matrix; `169d…:lean-engineer/SpecificationOntologyKernel.lean:f14321…:Edge.WellTyped` plus `169d…:SpecificationOntologyIndependence.lean:f0d9…:reversed_formalizes_edge_not_well_typed` | DomainSpec owner; CAV2 reuse requires exact mapped endpoints, direction, digest, loss, and fidelity decision |
| Dual-owner eligibility | formal and fidelity receipts bind the same assertion; S3 §Matrix; `169d…:SpecificationOntologyKernel.lean:f14321…:FormalizesAssertion.Eligible` | Formal-claim owner and business-meaning owner remain distinct |
| Request-indexed currentness | `matches_request`, `supersedes`, `currentFor`; `169d…:SpecificationOntologyKernel.lean:f14321…:VerificationReceipt.CurrentFor` | Verification owner plus subject owner; supersession authority required |
| Evidence/decision separation | `evidence_supports`, never `evidence_implies_discharge`; `169d…:SpecificationOntologyKernel.lean:f14321…:evidence_does_not_determine_discharge` | Governance-model owner plus obligation owner; PromotionRecord deferred |
| Projection authority guard | `generatedFrom`, `disclaimsAuthority`; `169d…:SpecificationOntologyKernel.lean:f14321…:IntegratedProjection.DisclaimsAuthority` | Compiler validates derivation; meaning/governance owner decides adoption |
| Edge grammar beats count | Direction-sensitive `allowedTriple`; `169d…:lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:87bf76ce70185c7d569c0994afd37c9139cb61ff:edgeGrammar_beatsCount`; composition `…:CAV2EdgeGrammarComposition.lean:e0ab974e84e480b243fcd40636fc66b3f2363ba6:wrongDirection_rejected_of_final_batch` | Governance semantic candidate only; relation-name similarity is not binding |
| Source-local lifecycle residue | `refinesTo`, open-obligation residue; `169d…:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted` | Governance-model review plus definitions-governance; rename to `source_local_projected_status` pending decision |
| Joint semantic/provenance envelope | neither component alone resolves the model decision; `169d…:lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:1b6e118cc001e4da952d8a221fe2f8a9495a51f0:contractDecision_resolvedBy_evidenceEnvelope` | Governance-model owner may review; not a canonical receipt schema |

**Whole-corpus owner route: blocked/unselected.** `lean-engineer/DomainSpecOntology` owns the bounded specification package; `cav2.governance-model` may review lifecycle/evidence/authority candidates; no evidence selects either as ambient owner of the complete corpus projection.

## D65 predecessor gaps

| Stage | State |
|---|---|
| Canonical definitions | Blocked: `formalizes`, `derivedFrom`, `projection`, `promotion`, `admission`, `current`, `discharge`, and source-local `projected` unresolved |
| Product Capability | Absent |
| Capability-local business ontology | Absent for the corpus |
| DomainSpec v2 authored source | Absent/unadmitted |
| Deterministic compiled graph/system ontology | Absent; stale map cannot fill it |
| Exact implementation binding | Absent |
| Conformance evidence | Absent; no live build |
| Owner admission | Unauthorized |

## Separate successor routes

1. **Local `main` fast-forward:** separately authorize Git mutation; re-run remote binding and stop on drift; confirm clean target state; fast-forward local `main` from `2534328b188ce554d6dc4cab88a969f5dbfd4c83` only to the still-matching bound commit. This neither authors nor admits ontology content.

2. **Candidate ontology authoring:** first select an immutable owner disposition: split between DomainSpec specification ownership and `cav2.governance-model` with explicit bridges, select another evidenced owner, or preserve `ontology_owner_unselected`. Then resolve definitions and D65 predecessors, materialize the exact 3,600-row path/blob/provenance artifact, and author candidate bytes under a separately admitted mutation route.

3. **Ontology admission:** remains a later, distinct owner decision bound to immutable candidate and evidence digests. Candidate validation or a possible PromotionRecord cannot grant admission, implementation, publication, release, deployment, or external effect.
