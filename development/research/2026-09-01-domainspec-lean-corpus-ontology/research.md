# Explorer transcripts

Dispatch: `2026-09-01-domainspec-lean-corpus-ontology`

The following explorer returns and robot-talk addenda are transcribed verbatim.

## Agent 1 — Hewitt, Carl

Explorer 0 (`Hewitt, Carl`) complete; read-only, no files created or worktree state changed.

REMOTE BINDING: PASS. Exact first command:
`git -C domainspec-lean-formalization ls-remote origin HEAD refs/heads/main refs/heads/master`
returned HEAD and `refs/heads/main` both `169d4a46aeaafba62c8bad127fc0522c3223e962`; no master row. Thus no `REMOTE_HEAD_DRIFT`.

COVERAGE RESULT (commit-pinned Git objects, not worktree):
- Exact enumeration command: `git -C domainspec-lean-formalization ls-tree -r --full-tree 169d4a46aeaafba62c8bad127fc0522c3223e962`, retain rows whose path ends `.lean`; tuple is `(commit,path,blob)`.
- 3,600 tracked `.lean` paths; 887 unique Git blobs.
- Top-level path counts (reconciles packet exactly): `research-engineering=2933`, `lean-formalization=554`, `lean-engineer=53`, `theorem=45`, `research=12`, `lean-scratch=2`, `internal-tools=1`.
- Exact-blob duplication: 96 blob groups have >1 path; 2,809 paths participate; 2,713 are excess occurrences beyond one per blob. Largest six identical blobs each occur 237 times: `bd053bf7ad54cd7088724ee199a135ffe369842c` (Galoistools/Test), `b79b634befa48e9651242107117af4a70e99dfc9` (Spec/Division), `b23e6ee6983d77340ffa38b10c3d5e21d8a1e210` (Spec/Ring), `6fcfc2706ddb82d0e8677fe3d440821d719d733e` (Bundle), `22bc635fbac3a75fa4186f43d47b30894716dc91` (Harness), `192d82cb3f481c4ea13421bdebb179ad81915875` (Galoistools root). A seventh, Proof/Joint blob `f060b7e05d087d7308e1ebd7dc182401e4ff9b46`, occurs 236 times.

PATH-ROLE CLASSIFICATION (exclusive lexical heuristic; metadata does not assert complete semantic roles): precedence scratch > sandbox > verification fixture > attack > generated copy > canonical-source root > unknown. Counts: `canonical_source=569`, `generated_copy=39`, `scratch=27`, `sandbox=1828`, `verification_fixture=751`, `attack=355`, `unknown=31`. Because precedence is exclusive, e.g. an attack tree’s `sandbox/` file is sandbox, not double-counted attack. “Canonical source” only means direct location below `lean-formalization/`, `lean-engineer/`, or `internal-tools/` after excluding copy/scratch/etc; it is not authority/admission.
Representative exact selectors:
- canonical: `169d...:internal-tools/lean-richness-proof/ZagrMarketplace.lean:b136aa3fb6b0300e4674fb9d65ef0b06db7f8266`
- generated copy: `169d...:lean-formalization/files/new/Bicyclic.lean:179447a84a2207434a6c70db0fc7a16e7a0a9b88`
- scratch: `169d...:lean-scratch/F9.lean:e90a987b702f27150d61da7c6c6057200f04769d`
- sandbox: `169d...:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/add-assoc-eval/candidate/validation/sandbox/Galoistools.lean:192d82cb3f481c4ea13421bdebb179ad81915875`
- verification fixture: same blob at `.../attacks/add-assoc-eval/verification/runs/a/source/Galoistools.lean`
- attack: same blob at `.../attacks/div-eval-reconstruction/candidate/_author-run/base/Galoistools.lean`
- unknown: `169d...:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93`

BUILD/PACKAGE ROOTS:
- Tree contains 243 `lakefile.lean|lakefile.toml`, 244 `lean-toolchain`, and 243 directories containing both. 3,013 Lean paths are beneath a paired root; 587 are not.
- Largest nearest paired roots: `lean-engineer` 53; `lean-formalization/files/new` 31; `.../powmod-right-reduction/diagnostic/sandbox` 25; `theorem/agents-strategy/lean-scratch` 25; then many ephemeral attack/eval roots (22,20,16,15...). This proves a multi-root corpus, not one package.
- The pinned `lean-file-map/manifest-v0.2.json` declares only six projects: leanEngineer, domainspec, domainspec_mathlib_pr, keystone_blueprint, keystone_counter, agents_scratch. It does not represent the 243 paired roots now present.

IMPORT TOPOLOGY:
- Parsed exact blob text for lines beginning `import`: 3,335/3,600 files contain imports; 7,732 module-token edges. Using the six map-declared project source roots as internal module roots, only 915 edges resolve internally and 6,817 are external-or-unresolved (heuristic; chiefly Mathlib and Galoistools modules in undeclared ephemeral package roots).
- Dominant imports show copied harness topology: Galoistools.Harness 1,189; Impl.Ring 948; Spec.Ring 946; Impl.Division 722; Spec.Division 716; Bundle 474; Test 237. This aligns with exact-blob duplication rather than 3,600 independent semantic modules.

LEAN-FILE-MAP RECONCILIATION:
- `manifest-v0.2.json`: 633 `by_source_path` rows and 633 record JSONs; all indexed paths still exist at the pinned commit; 2,967 current Lean paths are absent. `inputs/selected-files.json` has 20 unique selected source paths; all exist.
- Manifest index-to-record IDs are internally consistent (0 mismatches), and no record source is missing.
- Crucially, recomputing SHA-256 of exact commit blobs against each record’s `source.sha256` gives 356/633 mismatches. The map is commit-pinned stale as a content binding, despite path presence. Its own inventory says `tracked_count=633` and command `git ls-files -z -- *.lean`, reflecting an earlier working snapshot, whereas the selected commit contains 3,600. Its snapshot also reports five historical workspace-untracked paths and orphan targets; those are not commit evidence.
- Therefore: map artifacts are useful historical/selected metadata only, not a complete or fresh manifest for commit 169d...; presence is not proof.

FULL-COVERAGE ARTIFACT/COMMAND SPEC (successor may materialize; I did not):
1. Re-run remote binding and fail closed unless HEAD/main exactly equal the commit.
2. Generate canonical TSV/JSONL directly from `git ls-tree -r --full-tree <commit>` with one row per `.lean`: `commit,path,blob,top_level,role,role_rule,duplicate_group_size,nearest_package_root,imports[]`.
3. Read every blob with `git cat-file --batch`; compute SHA-256, import tokens, and exact duplicate groups by Git blob ID.
4. Enumerate `lakefile.lean|lakefile.toml` and `lean-toolchain`; define a paired package root only when both exist at the same directory; attribute each Lean path to deepest containing root, retaining `none`.
5. Emit reconciliation rows for every legacy map record: `record_id,source_path,record_sha256,current_blob,current_sha256,path_present,sha_match,index_match`; also emit all 2,967 unindexed paths.
6. Assert coverage gates: 3,600 rows; unique `(commit,path)`; all path/blob tuples equal `ls-tree`; role counts sum 3,600; duplicate sizes reconstruct 887 unique blobs and 2,713 excess; package/no-package sum 3,600; map reconciliation covers 633 records plus 2,967 additions. Preserve role uncertainty and never infer proof/admission from file presence.

Uncertainties: lexical path roles are candidate classifications; generated-vs-canonical cannot be established from paths alone; import resolution needs per-lakefile source-root/dependency semantics for all 243 roots; no builds/proof checks were run; map SHA mismatches may reflect expected historical snapshot drift but make it non-current for this commit.

ROBOT-TALK ADDENDUM — MATERIAL CONFIRMATIONS/CORRECTIONS

1. CONFIRM peer A’s four exact selectors. `git ls-tree -r --full-tree 169d...` yields exactly one occurrence of each blob/path:
- `169d...:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748`
- `169d...:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8`
- `169d...:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538`
- `169d...:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc`
Their exact blob SHA-256 values are respectively `ff639008ad5089696bf04c713188bc99212357730523c82212f5894825b13a47`, `b9d321090794419759f4018b61c7c09c5271f7e3e5f71591d27da348dd06da1c`, `c1b6778af256e39c8cfe0b5758b3418f033ad66ea8fa30004f8088ec71150182`, and `bb1da50d7e92885faf8009fa32c6c97e385808d388d48a563bbca3a23af5650e`.

2. CONFIRM peer B’s non-collapse model. The enumeration proves path identity and blob identity are separate axes: 3,600 paths collapse to 887 unique blobs, with 2,713 excess identical occurrences. Therefore identical paths/occurrences cannot be counted as independent evidence. The four focal blobs happen to be singleton occurrences, but singleton occurrence still establishes neither conceptual independence nor proof/authority; it only removes exact-blob copy multiplicity for those four.

3. REQUIRED WEAKENING: any synthesis phrase “canonical Lean source” for these four must become “singleton tracked occurrence at the pinned commit, located in a path heuristically classified canonical-source.” Path location and `docs/decisions/lean-ontology-location.md` describe intended ownership/location, but neither confers ontology admission, authority, or current build success.

4. REQUIRED WEAKENING: “SpecificationOntologyIndependence proves independence” must name the exact declaration/witness and state the formal assumptions. Filename/blob identity is not proof of a semantic independence claim. No Lean elaboration/build was run in this dispatch.

5. CONFIRM/strengthen the 48/48 ceiling. Stored exact-commit records include `.../author-from-47/report/report.json` with `passed_specs: 48` and an independent receipt whose `claim_boundary` says 48/48 selected benchmark specifications under the pinned Vero evaluator; `verification-report.json` explicitly says this is not a claim every unselected alternative stub is sorry-free. `research.md:103-104` distinguishes evaluator 48/48 from a “complete verified solve,” which additionally needs all 11 code slots concrete/untainted, full clean `lake build` including Test, and anti-cheat checks. Since this dispatch ran neither evaluator nor build, synthesis must say “stored, commit-contained bounded receipt reports 48/48,” not “current corpus/build passes 48/48.”

6. CONFIRM D65/authority warning. Neither the exact selectors nor stored Lean artifacts fill or admit canonical definitions, Product Capability, capability-local business ontology, DomainSpec v2 authored source, deterministic compiled graph/system ontology, exact implementation binding, or conformance evidence. The candidate graph can propose mappings only. `PROJECT-HISTORY.md:1745` itself caps AuthorityLifecycleResidue as “a mechanism typed, not a system certified,” consistent with this boundary.

7. ADDITIONAL CORRECTION: do not use the stale 633-record lean-file-map as fresh declaration/import authority for the four clusters without per-record byte reconciliation. Across the pinned commit, 356/633 record SHA-256 values mismatch current blob bytes and 2,967 Lean paths are absent from the map. Direct commit:path:blob selectors remain the correct source identity surface.

## Agent 2 — Grothendieck, Alexander

## Commit-pinned corpus analysis

Scope remained read-only at commit `169d4a46aeaafba62c8bad127fc0522c3223e962`. I inspected Git objects directly; no checkout, fetch, build, or worktree mutation occurred.

### Corpus shape and duplication

The commit contains 3,600 tracked `.lean` paths:

- `research-engineering`: 2,933
- `lean-formalization`: 554
- `lean-engineer`: 53
- `theorem`: 45
- `research`: 12
- `lean-scratch`: 2
- `internal-tools`: 1

Those 3,600 paths resolve to only 887 unique blobs. Ninety-six blobs are duplicated, accounting for 2,809 paths; individual shared blobs occur up to 237 times. Thus path count is primarily evidence-history and fixture multiplicity, not 3,600 independent formal concepts.

The dominant duplication is `research-engineering/vero-galoistools-codeproof-2026-08-22`: repeated Galoistools source trees appear under attack candidates, diagnostics, baseline sandboxes, author runs, official renders, grading sandboxes, and independent verification runs. These should be modeled as occurrences of a smaller source/fixture vocabulary with provenance roles, not separate theorem families.

A lexical declaration scan over every path—therefore intentionally duplication-inflated—found approximately:

- 85,239 `theorem`
- 24,514 `def`
- 3,018 `abbrev`
- 873 `structure`
- 427 `lemma`
- 227 `inductive`
- 141 `example`
- 28 `class`
- 10 lines beginning with `axiom`, several of which are prose comments

These counts are useful only as corpus-shape evidence. They are not unique-declaration counts.

### Semantic clusters

1. **Typed specification and ontology semantics**

   The most directly relevant formal kernel is:

   `169d4a46…:lean-engineer/SpecificationOntologyKernel.lean:f14321f9916c8aa755cef14b7705aeffbe9a8748`

   It separates:

   - `BusinessMeaning`, `FormalClaim`, `SpecificationComposition`, `ProofObligation`, and `EvidenceArtifact`
   - owner-local catalogs collected into `Ontology`
   - typed `NodeRef`, `RelationKind`, `Edge`, and `Edge.WellTyped`
   - formal and fidelity decisions/receipts
   - `FormalizesAssertion.Eligible`
   - request-bound `VerificationReceipt.Matches` and `.CurrentFor`
   - supersession
   - evidence receipts from `DischargeDecision`
   - non-authoritative integrated projections

   Load-bearing selectors include:

   - `…:SpecificationOntologyKernel.lean:f14321…:Edge.WellTyped`
   - `…:SpecificationOntologyKernel.lean:f14321…:FormalizesAssertion.Eligible`
   - `…:SpecificationOntologyKernel.lean:f14321…:VerificationReceipt.CurrentFor`
   - `…:SpecificationOntologyKernel.lean:f14321…:VerificationReceipt.not_supersedes_two_cycle`
   - `…:SpecificationOntologyKernel.lean:f14321…:evidence_does_not_determine_discharge`
   - `…:SpecificationOntologyKernel.lean:f14321…:IntegratedProjection.DisclaimsAuthority`

   Its paired negative-fixture module is:

   `169d4a46…:lean-engineer/SpecificationOntologyIndependence.lean:f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8`

   It explicitly distinguishes well-typed from reversed edges, digest identity from obligation coverage, current from mismatched/superseded receipts, lookup from strict supersession, evidence from discharge, and navigation from authority. Representative selectors:

   - `reversed_formalizes_edge_not_well_typed`
   - `package_digest_does_not_determine_coverage`
   - `superseded_receipt_not_current_for_request`
   - `lookup_only_admits_rootless_cycle`
   - `strict_version_supersession_rejects_cycle`
   - `same_evidence_allows_distinct_discharge_decisions`
   - `navigation_projection_disclaims_authority`

   This is candidate formal meaning, not an admitted CyberAlchemy ontology or runtime enforcement proof.

2. **Permission/reference-monitor engineering**

   `169d4a46…:lean-engineer/AgentPermissionKernel.lean:46baa081557e6e4c2462807212becb33434f6538`

   provides executable policy decision semantics plus local soundness:

   - `decidePolicy`
   - `decidePolicy_allow_iff`
   - `decidePolicy_sound`

   Sibling targets cover structured arguments, parser boundaries, checked traces, enforcement semantics, requirements, path/write confinement, layer composition, algebra, bash/glob matching, taint, egress, session vetoes, an explicit egress-bypass witness, and refinement-fibre structure.

   The meaning is a proved model of selected decision functions and invariants. It does not prove mediation, non-bypassability, authentic history, deployed policy identity, parser fidelity, or product integration.

3. **Governed context and dispatch semantics**

   `lean-engineer` also contains:

   - typed graph/direct-witness replay
   - manifest integrity and gluing
   - task-relative context augmentation safety
   - policy-scoped causal-access decisions
   - Arcanum output-ownership projections
   - native-dispatch reducer/correspondence/sufficient-state models
   - duplicate-key admission
   - question-formation and Agent Reasoning boundary models
   - continuation lifecycle semantics

   These largely use finite executable models, factorization criteria, positive witnesses, and countermodels. Their comments repeatedly disclaim parser/runtime/product correspondence.

4. **Residue, categorical, and thermodynamic formalization**

   `lean-formalization` is the broad mathematical corpus. Major families include:

   - categorical residue from failures of full faithfulness or essential surjectivity
   - adjunction, Kan-extension, reflection-tower, and fibre/presheaf constructions
   - finite residue cardinality and entropy
   - coarse-graining and second-law monotonicity
   - stochastic/generator dynamics
   - symmetry, independence, and non-collapse witnesses
   - observation/probe expressivity and factorization
   - causal/passive/interventional access
   - continuation/history residual languages
   - authority-lifecycle residue
   - DomainSpec graph/schema signatures

   Representative exact selectors:

   - `169d4a46…:lean-formalization/SecondLawDiscrete.lean:a43c5fcb79c53ef05c66054d445e0c4bf131e23e:entropy_nondecreasing_under_temporal_coarsening`
   - `…:SecondLawDiscrete.lean:a43c5f…:entropyProfile_plateau`
   - `169d4a46…:lean-formalization/M6Counter.lean:1a54f58e817387bb5cb2276abbda6ff3a1167212:m6_strong_refuted_poly`
   - `169d4a46…:lean-formalization/AuthorityLifecycleResidue.lean:08ed4a8c584186b86991a0ebc48016306d693cdc:residue_nonempty_not_promoted`
   - `169d4a46…:lean-formalization/PerspectiveMark.lean:bdecf747b46ffd013d934d0e3da469f0981d33be:mark_sound_not_automatic`
   - `…:PerspectiveMark.lean:bdecf7…:mark_complete_not_automatic`

   The corpus contains both positive constructions and deliberate refutations/collapse results. Names such as `Counter`, `Refutation`, `Independence`, `Collapse`, `Failure`, and `not_automatic` are semantically important; they cannot be counted as failed proof work.

5. **Explicit hypotheses and axioms**

   Actual load-bearing axioms include:

   - `169d4a46…:lean-formalization/DomainSpec.lean:bd53d70d9d65175fb4cfd8bae80358e055db390c:EdgeLaw`
   - `169d4a46…:research/R1-laws-as-residue/waves/wave-1/outputs/03-r1-weak-statement.lean:435d60f4df4b37b5f9074a16e74c445c15952a93:R1_weak_relations`
   - same blob: `R1_weak_morphisms`
   - `169d4a46…:research/strange-loop/waves/wave-1/outputs/03-formal-statement.lean:b35606f40cfa223c4bfc9937aff156ec9dccc368:strangeLoop_weak`
   - same blob: `strangeLoop_medium`
   - same blob: `strangeLoop_strong`

   These are assumptions/hypothesis surfaces, not proved theorem conclusions. A raw `sorry`/`admit` token scan touches 1,055 files, but comments and copied fixtures make that an overestimate; it should trigger declaration-aware classification, not a blanket “unfinished” verdict.

6. **Generated checks and copied fixtures**

   The Vero/Galoistools corpus distinguishes:

   - `Spec/*`: theorem/spec interfaces
   - `Impl/*`: executable definitions
   - `Proof/*`: theorem fills
   - `Test.lean`: `#guard`-based executable checks
   - `eval/AxiomCheck_*`: generated axiom inspection
   - candidate/diagnostic/source/render/grade trees: provenance-specific copies

   Report JSON at:

   `169d4a46…:research-engineering/vero-galoistools-codeproof-2026-08-22/attacks/gcdex-bezout/author-from-47/verification-independent/report/report.json:f6c33dbaccc49de94833dd9ce57f670c6e161bc1`

   records `passed_specs: 48`. This is a stored verification witness for that bounded artifact, not a fresh build result and not whole-corpus proof.

### Lake/build surfaces

There is no single root Lake project. The meaningful package surfaces are:

- `lean-engineer/lakefile.toml`, Lean `v4.30.0-rc2`, Mathlib `388f44f…`
  - default targets are mainly AgentPermissionKernel modules plus `permguard`
  - many context, dispatch, ontology, question-boundary, and agent-language libraries are declared but explicitly outside `defaultTargets`
  - `GovernsAcyclicity` uses separate `srcDir = "cav2-governance"`
  - agent-language and continuation modules use separate source roots

- `lean-formalization/files/lakefile.toml`
  - a very large explicit default-target list over residue/category/entropy/tower modules
  - same Mathlib revision
  - many tracked `.lean` files remain non-default, experimental, old, scratch, or direct-build-only

- `lean-formalization/files/new/lakefile.toml`
  - isolated `domainspec_mathlib_pr` staging surface, not equivalent to the main formalization package

- isolated projects under theorem research/scratch and hundreds of Vero attack sandboxes

The checked-in `lean-file-map/manifest-v0.2.json` is stale relative to this commit: it inventories 633 files and omits the 2,933-file `research-engineering` corpus. Its Lake analysis records several then-orphaned targets and workspace-only files. It is useful as an older classification artifact, not as the complete commit manifest.

### Build witnesses and claim ceiling

No live build was run because full-corpus build and mutation were forbidden, and the local checkout is not at the bound commit. Therefore current compilation of the main/default or isolated packages is unverified in this dispatch.

Observable stored witnesses include the Vero independent `48/48` report above and prose claims for individual direct targets, but prose instructions saying “run `lake build`” are not receipts. Stored build/report evidence must remain attached to its exact sandbox, source/render bytes, toolchain, and result.

Bottom line: this corpus is best represented as a typed graph of unique source blobs, declaration roles, theorem polarity, assumption dependencies, package/build surfaces, and occurrence provenance. It contains substantial machine-checked candidate mathematics and bounded executable verification, but neither path count nor Lean success establishes implementation conformance, product truth, ontology admission, or universal correctness.

Material confirmation/corrections:

- Enumerator’s `3,600 paths / 887 blobs / 96 duplicate groups / 2,809 duplicated paths` matches my independent Git-tree analysis. The Vero/Galoistools fixture tree is the principal inflation source; some identical blobs occur 237 times across candidate, diagnostic, source, render, grading, and independent-verification locations.

- The “243 paired Lake roots” result is consistent with the tree shape: the manifest/toolchain scan produced 487 Lake/toolchain entries, with `internal-tools/lean-richness-proof/lean-toolchain` apparently the unmatched extra. These are isolated package/sandbox surfaces, not one composite build graph.

- Raw declaration counts must not enter the ontology as semantic cardinalities. My path-level lexical scan reported 85,239 `theorem`, 24,514 `def`, 3,018 `abbrev`, etc., but those numbers count every copied occurrence. They substantially overstate unique definitions and theorem families.

- The lexical `axiom` count is also inflated by prose. Of ten lines beginning with `axiom`, four are documentation text in `NavInfoGain`, `NonTrivialResidueStructure`, and `OmegaSelfSimilarSingletonGate`. The observable declaration-level axioms are six: `DomainSpec.EdgeLaw`, `R1_weak_relations`, `R1_weak_morphisms`, and `strangeLoop_weak/medium/strong`.

- Likewise, the raw `sorry|admit` scan touching 1,055 files is not a proof-status result: it includes comments, documentation, and hundreds of copied fixtures. Proof status requires comment-aware parsing, unique-blob normalization, and ideally elaboration evidence per exact package target.

- Declaration presence is not compilation evidence. A syntactically visible `theorem ... := by` at a Git selector supports classification as a theorem declaration candidate, but not a claim that Lean accepted it at this commit. `defaultTargets` proves intended build surface only; non-default `lean_lib` declarations prove isolated availability only. Neither is a build receipt.

- Stored Vero `passed_specs: 48` reports are bounded historical witnesses for their exact source/render/sandbox bytes. They do not establish that all copied fixture occurrences build, that the enclosing 3,600-file corpus builds, or that a current rerun would pass.

- The legacy map’s 633-record surface is materially stale against this commit. Peer evidence of 356 SHA mismatches plus 2,967 omissions strengthens the conclusion that it cannot serve as the exact corpus manifest. Its semantic classifications may remain leads only after rebinding to current `commit:path:blob:declaration` selectors.

- The ontology mapper’s non-collapse posture is correct. Especially important distinctions are theorem versus axiom, positive theorem versus refutation/counterexample, canonical source versus copied fixture, default target versus isolated target, and evidence receipt versus discharge/admission. All D65 successor stages remain unresolved; Lean proofs cannot fill those governance gaps.

## Agent 3 — Spivak, David

## Candidate ontology handoff — frozen Lean corpus

Scope is bound to Git commit `169d4a46aeaafba62c8bad127fc0522c3223e962`. This is a research-only handoff for `ontology_id=cav2.governance-model`; it neither authors an ontology nor selects, accepts, promotes, admits, or publishes one.

Corpus inspection found 3,600 tracked `.lean` paths but only 887 unique Lean blobs. Ninety-six duplicated blobs account for 2,809 paths, principally under `research-engineering/vero-galoistools-codeproof-2026-08-22`. Therefore path count is not a semantic concept count. The specific candidate-bearing blobs below are unique at this commit. Their declarations and theorem bodies are present in Git objects; this explorer did not build them, so “Lean source witness” must not be upgraded to “currently compiled proof.”

### Candidate record matrix

| Candidate ID / semantics | Exact Lean selector and frozen blob | Evidence status / provenance | Candidate relations | Owner resolution and possible PromotionRecord |
|---|---|---|---|---|
| `candidate.typed-immutable-reference` — identity is logical ID + version + payload digest, typed by a phantom branch | `lean-engineer/SpecificationOntologyKernel.lean:40-64`, blob `f14321f9916c8aa755cef14b7705aeffbe9a8748` | Lean source witness; unique blob; not independently built here | `identifies_version_of`, `digest_binds`, `typed_as` | Existing code owner: `lean-engineer` `DomainSpecOntology` package. Meaning owner for cross-domain use unresolved. Possible PromotionRecord only after the narrow business/ontology owner decides which identity semantics are adopted. |
| `candidate.separately-owned-catalogs` — business meaning, formal specification, proof obligations, and evidence are separate catalogs, not one ambient owner | kernel `:66-123`, same blob | Lean source witness | `formalizes`, `derivedFrom`, `evidences`; `ownedBy` must remain per catalog | Strong match to a DomainSpec specification-ontology owner, not automatic ownership by `cav2.governance-model`. Governance ontology can consume a reviewed mapping, not absorb the catalogs by assumption. |
| `candidate.typed-directional-edge-grammar` — only formal claim → business meaning and proof obligation → formal claim are accepted in the selected grammar | kernel `:124-148`; positive/negative fixtures in `lean-engineer/SpecificationOntologyIndependence.lean:50-81`, blob `f0d9c0af2d309b5ef0cfbe4cb7f1bcff76c4c3e8` | Kernel definition plus finite positive/negative theorem source; not build-verified here | `.formalizes(formalClaim,businessMeaning)`; `.derivedFrom(proofObligation,formalClaim)` | DomainSpec ontology/package owner is the direct owner match. Any CAV2 reuse needs an explicit mapping and fidelity decision, not relation-name coincidence. |
| `candidate.dual-owner-formalization-eligibility` — exact same assertion bytes plus separated formal and fidelity owner roles | kernel `:152-205`; independence fixture `:100-132` | Lean source witness with positive and mismatched-receipt negative fixture | `formalReceipt binds FormalizesAssertion`; `fidelityReceipt binds same`; `ownerRole ≠` | Formal-claims owner and business-meaning owner are explicitly distinct. A future PromotionRecord should bind the assertion digest, both decisions, scope, declared loss, and claim ceiling. |
| `candidate.ordered-specification-composition` — equal members in different order are different compositions | kernel `:76-80`; independence `:83-98` | Finite theorem source | `composition_contains_ordered` | DomainSpec specification owner. No governance promotion is implied by the mathematical distinction. |
| `candidate.request-indexed-currentness` — verification is exact-scope/digest/request bound and externally supersession-sensitive | kernel `:240-305`; independence `:161-198` | Lean source witness; positive current receipt and negative wrong-package/superseded fixtures | `receipt_matches_request`; `supersedes`; `currentFor` | Verification/evidence owner plus subject owner. A possible PromotionRecord must name the supersession authority; receipt bytes alone do not determine currentness. |
| `candidate.evidence-decision-separation` — evidence attaches to one obligation, while discharge remains an owner decision | kernel `:309-342`; independence theorem `same_evidence_allows_distinct_discharge_decisions` at `:234` | Lean source theorem establishing non-determination in this model | `evidence_supports`; never `evidence_implies_discharge` | Direct conceptual match to `cav2.governance-model`, whose profile blocks owner decisions and authority effects. Candidate owner route: governance-model owner plus the obligation’s owner; possible PromotionRecord remains decision-gated. |
| `candidate.projection-disclaims-authority` — generated integrated projection records input/output digests and whether it claims authority; disclaimer is not complete admissibility | kernel `:344-358`; independence `navigation_projection_disclaims_authority` / negative authority-claiming fixture at `:246-250` | Lean source witness | `generatedFrom`; `disclaimsAuthority`; never `projection_is_authority` | Projection/compiler owner can validate generation; governance/meaning owner alone can decide adoption. Good fit for a future governance PromotionRecord guard, not a promoted fact. |
| `candidate.edge-grammar-beats-count` — typed incidence and direction distinguish equal-cardinality graphs | `lean-formalization/CAV2OntologyEdgeGrammarFixture.lean:34-231`, blob `87bf76ce70185c7d569c0994afd37c9139cb61ff`; compositional extension `CAV2EdgeGrammarComposition.lean:27-107`, blob `e0ab974e84e480b243fcd40636fc66b3f2363ba6` | Executable finite fixture/theorem source; unique blobs; build status not checked | `creates`, `derivesFrom`, direction-sensitive `allowedTriple` | Closest direct CAV2 semantic candidate. Still only a fixture: carrier and reversed-E4 negative control do not establish the canonical governance relation registry or package admission. |
| `candidate.authority-lifecycle-residue` — candidate → reviewedCandidate → projected discharges obligations; blocked/deferred are isolated sinks | `lean-formalization/AuthorityLifecycleResidue.lean:99-265`, blob `08ed4a8c584186b86991a0ebc48016306d693cdc` | Lean model/theorem source; status names are source-local | `refinesTo`; `hasOpenObligation`; `blockedRequiresOwnerEscalation` | Strong semantic match to governance-model owner, but terminology conflicts with the broader lifecycle envelope: `projected` must not silently mean promoted/admitted. Needs definitions-governance review before any PromotionRecord. |
| `candidate.semantic-provenance-joint-envelope` — neither semantic validity nor provenance validity alone resolves the bounded decision; the pair does | `lean-formalization/EvidenceEnvelopeDecisionBoundary.lean:40-133`, blob `1b6e118cc001e4da952d8a221fe2f8a9495a51f0` | Positive and two negative finite theorem fixtures; source calls carrier provisional and not an imported receipt schema | `semanticEvidenceFor`; `provenanceEvidenceFor`; `jointlyResolves` | Governance-model owner may review the pattern. It is not a canonical evidence schema and cannot replace a human decision or PromotionRecord. |

The root modules reinforce the owner boundary: `lean-engineer/DomainSpecOntology.lean` imports only the bounded specification ontology and explicitly disclaims universal ontology, lifecycle, product correspondence, and admission; `DomainSpecOntology/Specification.lean` adds no duplicate owner; `Specification/Fixtures.lean` keeps negative fixtures outside the production root.

### Explicit non-collapse rules

1. Inventory evidence locates candidates; it is not Lean proof, ontology meaning, or authority.
2. A theorem declaration/body in a frozen Git blob is source evidence. Without a build receipt for this exact commit/package/scope, call it neither compiled nor proved-current.
3. Multiple file paths sharing a blob are occurrences, not independent concepts or independent proof evidence.
4. Lean inhabitation or a theorem about a model does not prove product semantics, runtime behavior, implementation conformance, or adoption.
5. `BusinessMeaning`, `FormalClaim`, `ProofObligation`, and `EvidenceArtifact` remain separately owned; an integrated `Ontology` value does not create an ambient owner.
6. Evidence does not determine discharge; validation does not determine acceptance; projection does not determine authority.
7. `DisclaimsAuthority=true` is only a negative claim guard, not an admissibility judgment.
8. A relation label shared between a Lean fixture and a CAV2 registry is not an exact binding. Endpoint kinds, direction, version, digest, scope, and declared loss must match.
9. `projected` in `AuthorityLifecycleResidue` must not be equated with `promoted`, `admitted`, `released`, or `production`.
10. A passing positive fixture establishes only the bounded predicate tested. A failing negative fixture demonstrates discrimination, not completeness.
11. Evidence confidence and commitment confidence remain separate fields.
12. A PromotionRecord is a review/decision carrier; its existence alone does not mutate canonical ontology bytes or confer authority.

### Owner-resolution result

- `lean-engineer/DomainSpecOntology` is the existing package owner match for the specification-ontology kernel and its fixtures.
- `CyberAlchemy v2 governance-model owner` is the registered owner for `cav2.governance-model`, but the profile remains `candidate`, with `authority_effect=none` and explicit blocked outputs including owner decision, policy adoption, runtime conformance, product proof, and execution authority.
- The best owner-safe split is therefore:
  - DomainSpec ontology/package owner reviews formal structures and proof/build claims.
  - Business-meaning owner reviews fidelity of each `formalizes` assertion.
  - Governance-model owner reviews lifecycle/evidence/authority semantics.
  - Definitions-governance resolves load-bearing terms such as `projected`, `promotion`, `admission`, and `current`.
  - A subject-specific evidence/verification owner reviews receipts and supersession.
- No selected source establishes one owner for a complete Lean-corpus research projection. That remains a typed blocker, not permission to assign `cav2.governance-model` by default.

### Positive handoff fixture

```yaml
candidate_id: candidate.evidence-decision-separation
source:
  commit: 169d4a46aeaafba62c8bad127fc0522c3223e962
  path: lean-engineer/SpecificationOntologyKernel.lean
  blob: f14321f9916c8aa755cef14b7705aeffbe9a8748
  selectors:
    - "315-330 EvidenceReceipt and ObligationLifecycle"
    - "334-342 evidence_does_not_determine_discharge"
source_status: lean_source_witness_not_build_verified
candidate_semantics:
  statement: matching evidence can coexist with keepOpen or discharge
  forbidden_inference: evidence_implies_discharge
owner_route:
  candidate_owner: CyberAlchemy v2 governance-model owner
  required_co_owner: referenced proof-obligation owner
promotion_record:
  status: possible_only
  required_inputs:
    - exact source digest and selector
    - contradiction review
    - owner decisions
    - scope and claim ceiling
    - retirement path
authority_effect: none
```

### Negative handoff fixtures

- Reject a row that says `3600 Lean files => 3600 ontology concepts`; corpus blob analysis disproves the counting premise.
- Reject reversed `.formalizes(businessMeaning, formalClaim)` and reversed `.derivedFrom(formalClaim, proofObligation)`; exact negative fixtures show them not well typed.
- Reject a fidelity receipt bound to a different assertion, even if both owners separately return accept-like decisions.
- Reject a verification receipt with a wrong package digest or one marked superseded.
- Reject promotion from semantic validity alone, provenance validity alone, passing Lean source, passing fixture validation, or an authority-disclaiming projection.
- Reject any mapping that makes `projected` equal to owner-admitted ontology without an explicit definitions and owner decision record.

### D65 predecessor gaps and successor decisions

Every proposed canonicalization remains blocked before implementation:

1. Canonical definitions: decide exact meanings of `formalizes`, `derivedFrom`, `projection`, `promotion`, `admission`, `current`, and `discharge`.
2. Product Capability: no adopted capability states why the product needs this Lean-corpus ontology projection.
3. Capability-local business ontology: absent for the complete corpus.
4. DomainSpec v2 authored source: no selected admitted source expresses this handoff.
5. Deterministic compiled graph/system ontology: absent for these candidate rows.
6. Exact implementation binding: absent.
7. Conformance evidence: absent; this run did not build the frozen Lean commit.
8. Owner admission: explicitly unauthorized.

The next decision should be an owner selection over an immutable candidate set: either (a) keep the records split between the existing DomainSpec specification ontology and `cav2.governance-model`, with explicit bridge candidates; (b) select another existing ontology/package owner after evidence; or (c) record `ontology_owner_unselected` and stop. Only after that choice should a separately routed successor author candidate ontology bytes or PromotionRecords.

Robot-talk ontology/D65/authority addendum:

### Confirmations

- The enumerator’s `3,600 paths / 887 blobs` agrees exactly with my Git-object inspection. Ontology synthesis must deduplicate by blob plus declaration selector, while retaining path occurrences as provenance. It must not infer concepts from path count.
- The `633-record map / 356 SHA mismatches / 2,967 omissions` establishes that the map is not a current complete projection of commit `169d4a46…`. It may remain historical/discovery evidence, but it cannot support exact source binding, deterministic compilation, currentness, completeness, or admission.
- The 243 paired Lake roots are build surfaces, not 243 independently verified packages or ontology owners. No live build means no current proof receipt.
- Stored `48/48` evidence is bounded evidence for its exact historical package, inputs, and obligations. It does not repair map drift, cover omitted files, establish the whole corpus, or confer owner acceptance.
- Kernel/policy/residue clustering is a useful candidate semantic partition, but remains research taxonomy until an owner selects definitions and a deterministic projection rule.

### Material correction

A SHA mismatch and an omission are distinct typed failures:

- `sha_mismatch`: a mapped identity exists but does not bind the frozen blob; any semantics depending on that record are `not_evaluable` pending rebinding and review.
- `omission`: no mapped record exists; it is coverage residue, not evidence that the file has no semantic relevance.

Neither should be flattened into “stale map,” because successor remediation and authority consequences differ.

Likewise, Lean axioms/hypotheses must not be represented as proved theorem nodes. They belong in assumption/dependency nodes with explicit proof posture. A theorem transitively depending on an axiom may be a checked derivation relative to assumptions, but not an unconditional product or ontology truth claim.

### Candidate graph actions

Defer:

- `CorpusOntologyProjection` — owner unselected; map incomplete and stale.
- `LeanBuildReceipt` / `ProofCurrentness` — no exact live build for the frozen commit.
- `PromotionRecord` — no immutable owner decision.
- `ProductCapabilityCorrespondence` — no adopted Product Capability or fidelity decision.
- `ImplementationBinding` and `ConformanceEvidence` — D65 predecessors absent.
- Any edge from stored `48/48` evidence to corpus-wide completeness, admission, or current proof.
- Any cross-package equivalence inferred only from paired Lake roots or matching filenames.

Kill:

- `LeanPath isIndependentConcept`.
- `MapRecordCompleteness` for the 633-record map.
- `StoredPass impliesCurrentPass`.
- `LeanTheorem impliesProductTruth`.
- `InventoryEntry impliesOntologyNode`.
- `GeneratedProjection isAuthority`.
- `EvidenceReceipt impliesDischarge`.
- `Axiom isProvedClaim`.
- `projected impliesPromotedOrAdmitted`.
- Ambient `OntologyOwner=cav2.governance-model` for the whole corpus.

Rename:

- `proof` → `lean_declaration_source` unless an exact build receipt exists.
- `verified theorem` → `stored_build_evidence_for_exact_scope` for the bounded 48/48 set.
- `ontology map` → `historical_partial_projection` for the 633-record artifact.
- `duplicate file` → `path_occurrence_of_shared_blob`.
- `Lake package` → `candidate_build_root` until exact toolchain/build evidence exists.
- `axiom` as a graph status → `assumption_dependency`; retain the source declaration kind separately.
- `projected` from `AuthorityLifecycleResidue` → `source_local_projected_status` until definitions-governance resolves its relation to canonical promotion/admission vocabulary.
- `formalizes` across package boundaries → `candidate_formalizes_mapping` until exact assertion bytes, scope, declared loss, formal-owner receipt, and business-fidelity receipt are present.

### Required successor graph shape

The safe edge chain is:

`GitCommit -> PathOccurrence -> Blob -> DeclarationSelector -> CandidateSemantics -> CandidateOwnerRoute -> PossiblePromotionRecord`

with separate side edges:

- `DeclarationSelector -> dependsOn -> AssumptionDependency`
- `BuildReceipt -> verifiesExactScope -> {commit, toolchain, package, selectors}`
- `EvidenceArtifact -> supports -> ProofObligation`
- `OwnerDecision -> mayDischarge -> ProofObligation`
- `GeneratedProjection -> derivedFrom -> accepted canonical source`

Forbidden shortcuts are `EvidenceArtifact -> discharges`, `GeneratedProjection -> authority`, and `LeanDeclaration -> product capability`.

D65 remains blocked before canonical definitions, adopted Product Capability, capability-local business ontology, DomainSpec v2 authored source, deterministic compilation, exact implementation binding, and conformance. The peer results strengthen the research handoff but do not advance any D65 predecessor state.
