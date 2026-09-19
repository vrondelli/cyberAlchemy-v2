---
lane: import-advocate (explorer)
anti_bias_axis: import optimism vs transfer skepticism
dispatch_scope: survey c:/Users/victo/domainspec-lean-formalization for non-trivial imports into domainspec-core
date: 2026-07-14
status: complete
---

# Lane Report — Import Advocate

Bar applied: an artifact counts only if it plausibly changes a validation, composition,
derivation, projection, promotion, or owner decision in domainspec-core. Proof-status
discipline: "no `sorry` token" means grep-clean in the file; the sibling README itself warns
(README.md:55) that any sorry-free assertion must be re-verified against the build gate
(`verifying-lean-build` skill). Nothing below is presented past that bar.

## C1. `DomainSpecEdgeSignature.lean` — a mechanized DS-D8 checker, and a live drift finding

**Path:** `domainspec-lean-formalization/lean-formalization/DomainSpecEdgeSignature.lean`
(σ table :150-185; residue/escapes :222-246; fidelity theorems :251-318; extensions :320-339).

**Establishes (proved; `decide`-based, 0 `sorry` tokens; build-gate check pending):**
- A **decidable, executable type-checker** for the DS-D8 concept graph: `WellTyped` is a
  `Decidable` instance (:219), i.e. the "Morphism typing" law compiles to a runnable check.
- Fidelity theorems over the transcribed spec: `dsP2_disjoint`/`dsP2_cover` (backend/UI
  partition, :251-256), `sig_family_scoped` (:270-278) proving every backend edge is
  backend↔backend, intra-UI is UI↔UI, and **DS-P3 cross-layer edges are UI→backend**
  (`dsP3_crosslayer_direction`, :280-282), plus count theorems (25 meta-types, 29 edges).
- A **two-object output split**: `residue` (mis-typed between known meta-types — modeling
  error) vs `escapes` (unclassifiable via `opaque`/`other` — adequacy gap, accepted but
  counted), with `wellTyped_iff_residue_empty` (:234-246).
- Extension candidates explicitly marked non-spec: `aggregate`, `boundedContext`, and
  `associates` (entity↔entity/aggregate) carrying `Cardinality` (one/optional/many)
  (:320-339).

**Changes in domainspec-core:**

1. **Category-law route, "Morphism typing" row**
   (`projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:30`).
   The row's "Needed proof or experiment" — *consolidate the finite rule as a candidate law* —
   already has a mechanized formal statement and proof pattern sitting in the sibling repo.
   The research-tower deliverable 2 (notation bridge DS-D1/DS-D8 → objects/morphisms) can
   start from this file rather than from scratch.

2. **Drift: the Lean σ table certifies a stale DS-D8 spec.** The Lean has `enforcesCross`
   as an active spec edge (:120,157) and counts 29 signatures; core's root authority
   (`projects/domainspec-v2/definitions/relationships/relationships.yml`) has
   `signature_count: 30`, **deprecates `enforces-cross`** ("Cross-feature enforcement is
   feature-scope metadata on enforces, not a distinct verb", deprecated block at file end),
   adds `owns` (active), `owned-by` (generated-view), and defers `depends-on` and two others.
   Concrete implication (derivation obligation): if the Lean checker is ever cited as
   evidence for core, the σ table must be **generated from root `relationships.yml`**
   (root = authority, Lean = projection), turning the count/fidelity theorems into a
   drift gate. As it stands the Lean file is an unsynced projection.

3. **The escape hatch operationalizes promotion-rubric criterion 8.** The rubric
   (`projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:35`)
   requires "witnessed decision pressure." `escapes` concentration is exactly that witness,
   made measurable: run the checker on real packs; where escapes concentrate is which
   meta-type/signature the vocabulary is missing. This is the novice-stall evidence pattern
   (findings.md:13) as an instrument instead of an anecdote.

4. **Independent corroboration of the Entity-to-Entity family promotion.** The Lean file
   names the same ER/UML gap core found via the novice test — no entity↔entity structural
   edge — and proposes `associates` + `Cardinality` (:124,:320-339). Core already promoted
   `owns`/generated `owned-by`; the Lean's multiplicity treatment matches the yml's
   `multiplicity` field. Convergent evidence, from an independent route, that the promotion
   was correct.

## C2. `DomainSpec.lean` — formal statements for three category-law rows

**Path:** `domainspec-lean-formalization/lean-formalization/DomainSpec.lean`
(typing functor :86; T0'_C1 :159-161; T0'_C2 :175-181; T0'_C3 :261-265; `GeneralSchema`
:286-310; M5 triple :134-146). No `sorry` token; header (:12-17) claims all proofs complete.

**Establishes:** schema-as-category with a typing functor `τ : L1 ⥤ Discrete MetaType`;
determinism of compilation (T0'_C1, proved), image validity (T0'_C2, proved **at L1 level
only** — the L2-side variant needs a typing coherence `τ' = Δ ⋙ τ`, explicitly deferred at
:169-171), per-step entropy bound (T0'_C3, proved), and the **parametric `GeneralSchema`
substitution theorem** (:286-310): the C1/C2/C3 law package transfers verbatim to any
`(G, Artifacts, τ_G, Δ_G, N_plus_G)`.

**Changes in domainspec-core (category-law route rows):**
- **Object closure** (route :29): "profile-relative object universe" has a formal statement —
  the typing functor into `Discrete MetaType`; profile-relativity is exactly `GeneralSchema`
  parametricity.
- **Identity** (route :31): the route asks whether identities are meta-level operators,
  generated views, or authored data. The Spivak formalization answers: once the graph is
  presented as a category, identity is `𝟭` of the presentation — **meta-level, never an
  authored edge**. This resolves the row's open storage question in the direction the route
  already leaned (its falsifier: "adding a canonical identity edge merely to satisfy category
  terminology").
- **New named gap the route table misses:** T0'_C2's deferral shows "morphism typing on the
  image side" requires a typing-coherence condition (`τ' = Δ ⋙ τ`) between spec-level and
  artifact-level typing. That is an extra candidate obligation belonging under "Obligation
  preservation" — currently absent from the route matrix.

## C3. `ResidueCompositionLaw.lean` — a proved criterion for projection/obligation preservation

**Path:** `domainspec-lean-formalization/lean-formalization/ResidueCompositionLaw.lean`
(:67-97 `lanIsoSchema_comp_iff`; :101-110 `lanIsoSchema_comp_of`; :115+ `lanIsoSchema_comp_ff`).
0 `sorry` tokens; engine is owned Mathlib machinery (`Adjunction.comp`, `leftAdjointUniq`),
cited not claimed novel (:38-41).

**Establishes:** the unit-defect residue of a composite `Δ ⋙ g` equals `Δ`'s residue whenever
`g`'s unit is iso at `Lan_Δ X`; and **the FF-collapse**: if `g` is fully faithful,
post-composition does not move the residue at all — new residue requires `g` not-FF.

**Changes in domainspec-core (category-law route rows :34-36):**
- **Projection preservation / Obligation preservation** get a proved *sufficient condition*:
  a generated view or projection functor that is fully faithful preserves the residue
  predicate exactly — it can neither create nor destroy obligations. Contrapositively, any
  projection that adds or drops obligations is not-FF, and that non-FF-ness should be
  declared residue. Concrete: the "projection functor / read-model contract" the route asks
  for (row :35) should include an FF test as its preservation criterion.
- **Typed composition** (row :32): the composition operator the tower must define now has a
  companion law — how residue/obligations distribute over `g∘f` — with one regime already
  closed (FF post-composition inert).

## C4. FF threshold + two-layer independence — promotion rubric and test-derivation-engine

**Paths:** `FRAMEWORK-IMPLICATIONS.md:31-47` (vertical axis), `Bicyclic.lean` (0 `sorry`
tokens), `M6Counter.lean` (0), `F11.lean` family.

**Establishes (proved per FRAMEWORK-IMPLICATIONS, subject to build-gate):**
- `Bicyclic.lean`: a translation can be **fully faithful at schema level while fusing states
  at instance level** — schema audit passes, behavior wrong, no logical connection (:31).
- `M6Counter`: faithful + injective-on-objects still yields Skolem-null instance data (:35).
- F11: the obstruction is **empty exactly at full faithfulness, inhabited below** — a binary
  two-pole indicator; there is **no continuous residue magnitude** below the threshold
  (:33,:45 — explicitly disclaimed, with the scaling structure owned by Sachdev/Kong).

**Changes in domainspec-core:**
1. **Promotion rubric** (`2026-07-02-first-class-category-boundary/findings.md:26-35`):
   criterion 5 (concrete downstream obligation) has a formal reading — promotion to
   first-class typed status is crossing the FF threshold for that concept
   (FRAMEWORK-IMPLICATIONS:47: "the output schema determines whether residue exists").
   And a **closed-negative guardrail**: do not build a scalar "promotion score" or
   degree-of-first-classness dial — the math supplies a binary indicator plus
   *which-witness* identification, nothing continuous. Any future rubric revision proposing
   a numeric promotion metric is contradicted by this result.
2. **test-derivation-engine** (`projects/domainspec-v2/impl/test-derivation-engine/`): its
   normalized adapter "derives structural conformance obligations… does not infer behavioral
   semantics" (README). Bicyclic/M6 prove the two audit families **cannot substitute for
   each other and must not be aggregated into one score** (FRAMEWORK-IMPLICATIONS:43). So
   (a) the behavioral-obligation gap is a proved-necessary second lane, not a nice-to-have;
   (b) any receipt/verdict that merges schema-conformance and behavior obligations into a
   single pass/fail discards information — check `RESIDUE-RECEIPT` semantics against this.

## C5. `DatabaseLosslessJoinResidue/Witness.lean` — a losslessness obligation for DCB decompositions

**Paths:** `lean-formalization/DatabaseLosslessJoinResidue.lean` (headline equivalence;
`sorry` matches are docstrings only, axiom audit asserts no `sorryAx` :170-172),
`DatabaseLosslessJoinWitness.lean` (lossy spurious-tuple witness, 0 `sorry` tokens).

**Establishes (owned math — Lee 1987, Arenas–Libkin 2005; the file itself declares
`closed-borrowing`, no novelty):** decomposition of a relation into projections is a
lossless join **iff** mutual information is zero; plus a concrete lossy witness (perfectly
correlated Boolean relation whose projection-join manufactures spurious tuples).

**Import-advocate point:** the sibling's own transfer dispatch KILLed this as a *novelty*
claim (`research/cross-domain-transfer-reach/research/findings.md`, F2). Novelty-kill is not
engineering-kill: for domainspec-core the use is a **derivation/test obligation**, cited to
its owners.

**Changes in domainspec-core:** the dcb-correctness / dcb-saga-correctness towers
(`projects/domainspec-v2/research/dcb-saga-correctness/PROOF-OBLIGATIONS.md`) catalog
cross-context write/projection edges (`produces-for`). A DCB decomposition of state into
per-feature projections carries a formal candidate obligation: **losslessness of the
projection decomposition**, with a known falsifier shape (spurious tuples) that can be
turned into a fixture. This is a new obligation class candidate for the catalog, not a
theorem about DCB.

**Bonus drift finding inside core:** `PROOF-OBLIGATIONS.md:25` still lists `enforces-cross`
as a relevant DomainSpec edge; root authority deprecated it (relationships.yml, deprecated
block). The dcb-saga catalog is stale on that edge.

## C6. V/H/D inter-axis independence — three audits, never one score

**Paths:** `InterAxisIndependence.lean`, `MarkovHGadget.lean` (0 `sorry` tokens),
`DomainSpecSystem.lean` (bundling, `sorry` matches are docstrings), FRAMEWORK-IMPLICATIONS:117-123.

**Establishes (proved):** all eight clean/not-clean combinations across the vertical
(schema/instance), horizontal (temporal/derivation), and diagonal (self-description) axes
are realizable with substantive witnesses — the axes are independent failure modes.
FRAMEWORK-IMPLICATIONS maps them onto DomainSpec directly: taxonomy + relationship typing
(V), derivation rules + test obligations (H), governance PASS/FLAG/BLOCK (D).

**Honest cap (from the sibling itself):** `DomainSpecSystem` is an axes-bundle, **not** a
`GeneralSchema` — the gap is a named non-`sorry` placeholder (`gap_to_GeneralSchema`,
DomainSpecSystem.lean:242-253); and the sibling's transfer audit called
`strong_product_gadgets` "deliberately only the combinatorial reduction" (F4 KILL). Import
the **audit-separation discipline**, not a structural theorem about DomainSpec systems.

**Changes in domainspec-core:** validation governance / promotion-policy: any gate that
aggregates relationship-typing validation, derivation/test-obligation validation, and
governance verdicts into a single score discards proved-independent information. Worth an
explicit check across `authority/promotion-policy.md` and the constitutions for any such
collapse.

## C7. Transfinite persistence — a stopping-criterion clause for the promotion lifecycle

**Path:** `F11TransfinitePersistence.lean` (0 `sorry` tokens); FRAMEWORK-IMPLICATIONS:95-113.

**Establishes (proved, with a caveat):** the obstruction between the two witness sources
persists under every finite Σ-promotion — no finite stack of meta/review layers closes a
structural self-description problem; the tower colimit exists but absorption is refuted.
**Caveat from the sibling's own audit** (cross-domain-transfer-reach BN-F1): the `∀n`
quantifier in `CardinalResolution` is vacuous (n unused in the proof body) — the result is
real but weaker than its "transfinite" branding; treat it as finite-rung persistence.

**Changes in domainspec-core:** promotion-policy / review constitutions: a self-auditing
pipeline (reviews of reviews, meta-governance) terminates at some rung **by decision, not
convergence**. Concrete clause candidate: every recurring review/meta-review loop must
declare its stopping rung and forward unresolved items as typed residue (BLOCK-as-data),
because "iterate until it's right" is a proved non-terminator for this failure class.

## C8. Already routed — do not double-import

- **Value-constraining cycle guard**: the orthogonality-cav2-transfer dispatch's surviving
  invariant already landed as CAV2-D28 + CAV2-C13
  (`cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md:47`,
  `DEFINITIONS-INDEX.md:265`). Closed; no action.
- **Representability Witness / Representability-Grounded Promotion Gate**: routed as
  PROMOTE-CANDIDATEs from the presheaf-vect-yoneda findings
  (`cyberAlchemy-v2/development/research/2026-06-21-presheaf-vect-yoneda-residue-implications/findings.md:38-39`)
  but **not yet in CAV2 DEFINITIONS.md** (grep negative). Status: pending promotion, not a
  new import — but C4's FF-threshold results are the same mathematical object, so the
  category-law tower and the CAV2 candidate should cite one shared source, not fork.

## Ranked import list (advocate's ordering)

1. **C1** — mechanized DS-D8 checker + drift gate + escape-hatch adequacy meter (highest
   concreteness; changes validator design, derivation obligations, and rubric instrumentation).
2. **C3** — FF-preservation criterion for projections (directly fills two open route rows).
3. **C4** — binary FF threshold + two-audit separation (changes promotion rubric guardrails
   and test-derivation-engine scope).
4. **C2** — identity/object-closure formal statements + the τ-coherence gap (feeds the
   research-tower the route already selected).
5. **C5** — losslessness obligation for DCB decompositions (owned math, engineering import).
6. **C6/C7** — governance-level discipline clauses (real but prose-level changes).

Nothing here amends R3A completion or makes any law canonical; every item routes through
the owners the route packet names (research-tower → definitions-governance / validator
owner / constitution-governance).
