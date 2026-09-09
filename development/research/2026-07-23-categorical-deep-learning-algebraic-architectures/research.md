# Raw Explorer Research

Dispatch: `2026-07-23-categorical-deep-learning-cav2-lean-tower`

The text under each agent heading is the explorer's verbatim return. It is raw
research evidence, not the governed synthesis or final finding.

## Agent 1 — formal-source explorer

## Explorer report — formal spine of arXiv:2402.15332v2

**Primary source:** Bruno Gavranović et al., *Position: Categorical Deep Learning is an Algebraic Theory of All Architectures*, official arXiv v2 abstract: https://arxiv.org/abs/2402.15332 ; PDF: https://arxiv.org/pdf/2402.15332v2 . All `PDF p.` selectors below refer to the PDF’s printed/extracted page number (32-page file), not a browser’s inferred HTML section. The root Inventory’s lack of an exact paper/monad/parametric-map match is a **search gap only**, not evidence of novelty.

### 1. Formal spine in one chain

The paper’s bridge is:

`structural theory T` → `T-(co)algebras as semantic carriers` → `(co)algebra homomorphisms as constraints` → `Para(C) makes implementations explicitly parametric` → `strong T lifts to Para(T)` → `lax Para(T)-algebras force a comonoid on parameters` → `copy/delete maps express weight tying` → `free-monad/unrolling constructions recover whole recursive/recurrent architectures from cells`.

This chain combines established categorical definitions, examples, one central proved theorem, one unproved corollary, a conjectural equivalence, and broad position claims. It is not a proof of the title’s literal “all architectures.”

### 2. Notation and definitions

- `C`: category; `M` (sometimes bold/implicit in prose): monoidal category of parameters with tensor `⊗` and unit `I`; `◮ : M × C → C`: actegory action. Appendix E, PDF pp.19–20.
- Monad `T=(T,η,μ)` on `C`: endofunctor plus unit and multiplication satisfying monad laws. Definition 2.1, PDF p.3; diagrams in Definition B.1, PDF p.13.
- `T`-algebra `(A,a)` has `a:T(A)→A` compatible with `η,μ`; homomorphism `f:(A,a)→(B,b)` satisfies `f∘a=b∘T(f)`. Definitions 2.3, 2.5, PDF p.4.
- Endofunctor algebra `(A,a:F(A)→A)` has no monad equations; coalgebra reverses the structure map, `a:A→F(A)`. Definition 2.8, PDF p.5; Definition B.2, PDF p.13.
- `Para_◮(C)` (Definition G.1, PDF pp.21–22): objects are objects of `C`; 1-cells `X→Y` are `(P,f)` with `P∈M`, `f:P◮X→Y`; a 2-cell `(P,f)⇒(P',f')` is a reparameterisation `r:P'→P` satisfying `f' = f∘(r◮X)` (orientation is contravariant in parameter objects); composite of `(P,f):X→Y` and `(Q,g):Y→Z` has parameter `Q⊗P` and implementation `(Q⊗P)◮X → Q◮(P◮X) → Q◮Y → Z`. Identity is `(I, unitor^{-1})`.
- For cartesian `M`, the diagonal `Δ_P:P→P×P` copies one parameter into two uses; `!_P:P→1` deletes it. These are the formal face of tying/unused weights (Sec.3.1, PDF pp.7–8; Theorem G.10, p.24).
- A strong actegorical monad has strength `σ_{P,X}:P◮T(X)→T(P◮X)` coherent with the action and monad structure. Definitions E.6/E.9, PDF pp.19–20. It lifts to a 2-monad `Para(T)` by sending `(P,f)` to `(P,T(f)∘σ_{P,X})`; Example G.8, PDF pp.23–24.
- A lax `T`-algebra for a 2-monad adds 2-cells witnessing unit and multiplication compatibility rather than equations; Definition F.2, PDF p.21. Lax algebra morphisms add a comparison 2-cell; Definition F.3, p.21.

### 3. Constraints versus implementations

**Constraint side.** For the group-action monad `G×−`, its algebras are `G`-actions and algebra homomorphisms are equivariant maps: `f(g◮x)=g◮f(x)` (Examples 2.2–2.6, PDF pp.3–4). Invariance is the trivial action on the codomain (Example H.3, p.25). Thus GDL is recovered as a special case of monad-algebra homomorphisms. Appendix C gives graph permutation equivariance, spherical CNN and G-CNN sketches (PDF pp.15–17).

The generalisation uses arbitrary endofunctors:

- `F(X)=1+A×X`: lists are an initial `F`-algebra; homomorphisms out are folds (Examples 2.9, 2.12; pp.5–6).
- `F(X)=A+X²`: binary trees and tree folds (Examples 2.10, 2.14; pp.5–6).
- `F(X)=I→O×X`: Mealy machines are coalgebras; coalgebra homomorphisms are unfolds (Examples 2.11, 2.15; pp.5–7).
- Streams and Moore machines similarly arise as terminal coalgebras/unfolds (H.4–H.8, pp.26–27).

These homomorphism equations constrain control flow/recursion, not merely matrix entries. Initiality/terminality yields uniqueness of fold/unfold where the claimed universal objects exist.

**Implementation side.** `Para(C)` replaces an ordinary map by a parameter object plus implementation. Reparameterisations compare implementations and express sharing. The paper’s concrete neural cells are algebras/coalgebras of lifted parametric endofunctors (Appendix I, pp.28–29):

| Endofunctor | Parametric structure map | Recovered cell |
|---|---|---|
| `1+A×−` | `P×(1+A×S)→S` | folding RNN, incl. parameter-dependent initial state (I.1) |
| `A+(−)²` | `P×(A+S²)→S` | recursive NN (I.2) |
| `O×−` | `P×S→O×S` | unfolding RNN (I.3) |
| `I→O×−` | `P×S×I→O×S` | full RNN / learnable Mealy cell (I.4) |
| `O×(I→−)` | `P×S→O×(I→S)` | Moore cell, output independent of current input (I.5) |

### 4. Architecture recovery/unrolling

The free-monad idea is that an endofunctor’s one-step syntax is iterated to a monad whose algebras match the original endofunctor algebras under hypotheses. The formal transfinite construction and hypotheses are Appendix B.2: algebraically free monad Definition B.8 (p.14), Lemma B.15 and Theorem B.16 (p.15); explicit formula Proposition B.18 (p.15). Main-text Sec.3.2 (pp.8–9) uses this to motivate whole architectures.

Appendix J (pp.29–32) actually writes unrollings as parametric (co)algebra homomorphisms, with `Δ_P` tying the same `p` at every recursive use:

- J.1 folding RNN over lists, Eq.17, pp.29–30;
- J.2 unfolding RNN to streams, Eq.18, p.30;
- J.3 recursive NN over trees, Eq.19, p.31;
- J.4 recurrent/Mealy machine, Eq.20, pp.31–32;
- J.5 Moore machine, Eq.21, p.32.

This is the paper’s strongest operational meaning of “architecture recovery”: select a datatype/automaton functor, specify a parametric cell, and obtain a structurally recursive/corecursive network whose repeated calls share `p`. It does **not** infer an unknown architecture from trained weights or observational evidence.

### 5. Proof-status / claim ledger

| ID | Claim | Status | Selector |
|---|---|---|---|
| C1 | Group equivariance equals homomorphism of `G×−`-algebras. | Definition-level derivation / standard fact; shown elementwise. | Ex.2.6, PDF p.4 |
| C2 | Lists/trees/Mealy systems are endofunctor (co)algebras; folds/unfolds are homomorphisms. | Examples grounded in standard initial-algebra/final-coalgebra semantics. | Ex.2.9–2.15, pp.5–7 |
| C3 | `Para_◮(C)` is the 2-category of parametric maps and reparameterisations. | Definition, attributed to Cruttwell et al. 2022 and Capucci et al. 2022. | Def.G.1, pp.21–22 |
| C4 | Ordinary `C` embeds identity-on-objects into `Para(C)`. | Lemma G.4. | p.23 |
| C5 | This embedding preserves connected colimits under stated strictness/preservation hypotheses. | Proved theorem, but proof is compressed and notation has rough edges. | Thm.G.6, p.23 |
| C6 | A strong actegorical monad induces a 2-monad `Para(T)`. | Construction with coherence check sketched. | Ex.G.8, pp.23–24 |
| C7 | A lax algebra for induced `Para(T)` gives its parameter `P` a comonoid; lax cells supply counit/comultiplication. | Central proved theorem; proof says remaining coherence unpacking is tedious/straightforward. | Thm.G.10, p.24 |
| C8 | A stated functor from lax algebras is full and faithful. | **Corollary asserted; proof left to reader.** Also printed codomain `CoMon(C)` appears type-suspicious because `P∈M`; likely should involve `CoMon(M)`—do not silently correct. | Cor.G.11, p.25 |
| C9 | Lax algebras of parametric endofunctors are equivalent to lax algebras of their algebraically free monads. | **Conjecture, not theorem**, with hypotheses. | Conj.G.12, p.25 |
| C10 | RNN/recursive cells unroll with correct repeated weight sharing via `Δ_P`. | Worked examples; J says for space/clarity it uses lax homomorphisms for 2-endofunctors rather than completing the 2-monad account. | Appendix J, pp.29–32 |
| C11 | Para + 2-categorical algebra is a formal theory of neural architectures and can inform new designs. | Explicit **position/hypothesis**. | Sec.3.1, p.8 |
| C12 | The framework is an algebraic theory of “all architectures,” enables well-typed/verifiable reasoning, safety/compliance, and better nonlinearity theory. | Aspirational position/future-work claims, not established propositions. | Abstract p.1; Sec.4 pp.9–10 |

### 6. Concrete examples and what each establishes

- Two-pixel translation equivariance forces matrix `[[w1,w2],[w2,w1]]`; a genuine derivation of tying from equivariance (H.1, Eq.11, p.25). The CNN/circulant extension is stated as known (Remark H.2).
- Invariance with trivial codomain action forces shared rows in the two-pixel matrix (H.3, Eq.12, pp.25–26).
- Linear stream unfold is entirely determined by two scalars, yielding `[w_o,w_n w_o,w_n² w_o,…]` (H.5 discussion, p.27).
- Graph, spherical, and G-CNN examples show the algebra-homomorphism template accommodates different carriers/actions, but are schematic recoveries, not full implementation derivations (Appendix C, pp.15–17).
- Appendices I/J are implementation-shaped pseudocode and diagrams, not an executable library or empirical validation.

### 7. Primary-source dependencies worth retaining

The paper itself attributes `Para` to prior work: Cruttwell et al. (2022), *Categorical foundations of gradient-based learning*, arXiv: https://arxiv.org/abs/2103.01931 ; and Capucci et al. (2022), *Towards foundations of categorical cybernetics*, arXiv: https://arxiv.org/abs/2105.06332 . For GDL’s symmetry framing: Bronstein et al. (2021), *Geometric Deep Learning*, arXiv: https://arxiv.org/abs/2104.13478 . For universal coalgebra: Rutten (2000), DOI landing page: https://doi.org/10.1016/S0304-0208(99)00056-6 . These establish ancestry; the report should not imply the paper originated parametric maps, equivariance, initial algebra/final coalgebra semantics, or free-monad theory.

### 8. Open residue / cautions

1. General lax-endofunctor → free-parametric-monad equivalence is conjectural (G.12); the examples precede a completed theorem.
2. G.10 establishes comonoid structure on parameter objects, but “formal criteria for weight tying correctness” beyond the exhibited recursive schemes remain a research program.
3. The construction depends on choosing `C`, `M`, action, functor/monad, strengths, and universal objects; the paper does not supply a general architecture-discovery algorithm.
4. Strictness and connected-colimit hypotheses matter. Do not quote the lifting/unrolling story without them.
5. The paper alternates Set, Vect, Smooth and general actegories. A concrete application must state which category supports nonlinear/differentiable implementations and which limits/colimits exist.
6. Some source text has probable type/notation defects (notably Cor.G.11’s `CoMon(C)` and occasional algebra/coalgebra caption slips). Preserve as source issues, not repaired facts.
7. No empirical comparison demonstrates predictive, design, or verification superiority.

### 9. Explicit CyberAlchemy-v2 mapping warning

Do **not** map the paper’s words `architecture`, `implementation`, `constraint`, `algebra`, `monad`, `parameter`, `recovery`, `universal`, `syntax`, or `semantics` directly onto CyberAlchemy-v2 authority kinds or lifecycle vocabulary. Here they are category-theoretic terms with typed data and laws: an “implementation” is typically a morphism `P◮X→Y`; “architecture recovery” is constructive unrolling from a selected functor/cell; “constraint” is a commuting/lax-commuting diagram; “universal” means an initial/final/free property. Any CAv2 correspondence would require a separately governed bridge with explicit source/target definitions, variance, proof obligations, and non-equivalences. At most, this paper is a candidate formal substrate or analogy; it does not validate CAv2 concepts, and CAv2 must not be used to inflate the paper’s position claims.

## Agent 2 — Lean-feasibility explorer

Feasibility verdict: the paper’s ordinary categorical core is reusable, but its central `Para` / 2-monadic claim is not presently represented in the research-local Lean surface. The honest first witness is a local `ParametricMap` + reparameterisation relation; claiming recovery of constraints, weight tying, or RNN architecture semantics would be premature.

| Paper requirement | Live support | Feasibility |
|---|---|---|
| Categories, functors, schema/instance migration | `SchemaInstance.lean:57-103` | Ready |
| Ordinary monads and Eilenberg–Moore algebras | `SchemaInstance.lean:105-145`; Mathlib `Monad.Algebra` | Ready, semantic/algebra level only |
| Parametric maps `(P, P ⊙ X ⟶ Y)` | Mathlib has `MonoidalLeftAction` | Small local definition needed |
| Reparameterisation 2-cells | No `Para` definition found in either installed tree | Small local definition needed |
| Horizontal composition/coherence of `Para` | Action associator/unitor exist; no `Para` implementation | Medium, prove from action coherence |
| 2-monad / lax algebra | Mathlib has bicategories, but installed `Bicategory/Monad/Basic.lean` explicitly says monads in a bicategory are not yet implemented; it implements comonads | Exact upstream/local blocker |
| Paper’s parameter-comonoid / weight-tying theorem | Depends on lax `Para(T)`-algebra coherence | Blocked by previous row |
| Constraint recovery (geometric equivariance) | Ordinary `Monad.Algebra` can state algebra-hom commutation | Requires a concrete action monad, carrier action, and an actual constraint theorem |
| RNN / architecture examples | No architecture semantics or neural/tensor carrier found | New modeling project; not a consequence of existing residues |
| Link to functor-stack tower | Existing theorem only composes fully faithful functors | Reusable only for a losslessness condition, not neural architecture recovery |

Direct paper reading: arXiv:2402.15332v2 §§2–4 defines ordinary monads/algebras, then §2-Categorical Algebra defines 2-monads/lax algebras; §“The 2-category `Para(C)`” defines parameterised 1-cells and reparameterisation 2-cells; its weight-tying theorem uses lax-algebra coherence to derive a parameter comonoid. The paper presents these as a position/framework, not a Lean artifact.

Existing reuse anchors:

- `lean-formalization/SchemaInstance.lean:67-103` provides `Instance`, schema morphisms, and compositional pullback.
- `SchemaInstance.lean:112-137` explicitly adopts the semantic monad/algebra route and states that syntactic multi-sorted Lawvere theories are absent.
- `lean-formalization/files/new/LanUnitIsoComp.lean:53-91` proves the fully-faithful composition condition relevant to a staged translation chain.
- `FParameterizedResidue.lean:63-87` says its two refinement views are the same content under different parameterisation and explicitly disclaims a functor-of-functors / 2-categorical lift.
- Installed Mathlib does contain `CategoryTheory.MonoidalCategory.MonoidalLeftAction` and bicategory infrastructure. A read-only stdin compilation in `lean-engineer/` confirmed that the following low-level shapes typecheck:

```lean
structure ParametricMap (X Y : C) where
  P : M
  run : P ⊙ₗ X ⟶ Y

structure Reparam {X Y : C} (f g : ParametricMap (M := M) X Y) where
  map : g.P ⟶ f.P
  comm : (map ⊵ₗ X) ≫ f.run = g.run
```

Proposed smallest discriminating witness:

```lean
/-- A parametrised implementation and its semantics-preserving reparameterisation. -/
theorem reparam_preserves_run
  {f g : ParametricMap X Y} (r : Reparam f g) :
  (r.map ⊵ₗ X) ≫ f.run = g.run := r.comm
```

Then add vertical identity/composition of `Reparam`. This is intentionally modest: it proves that the paper’s parameter/reparameterisation layer can be carried as typed data in Lean, rather than merely named. It does not prove a 2-category, a 2-monad, constraint recovery, or architecture equivalence.

Suggested build command once placed in the healthy research-local Lake project:

```bash
cd domainspec-lean-formalization/lean-engineer
lake env lean ParametricMapWitness.lean
```

Current direct build blocker: `domainspec-lean-formalization/lean-formalization/files` uses Lean `4.30.0-rc2`, but its checked-out Mathlib `.olean` cache has an incompatible header. Even an import-only `lake env lean /dev/stdin` fails before elaboration. Do not treat that project as build-verified until its dependency artifacts are rebuilt; rebuilding would mutate the checkout and was outside this read-only dispatch. The separate `lean-engineer/` Lake project did compile the low-level witness imports.

Supplied card inventory:

- `schema-loss`
- `instance-loss`
- source-grounded run: no cards in the finite fixture

These are synthetic classification cards only; their collapse status is locked at `not-tested` (`experiment-package/evidence/turns/synthetic-finite-turn.md:28-53`). They are not categorical constraints or formal semantic levels.

Non-collapse boundary: a deterministic richer representation of the same raw register is not additional information. The audited semantic-hierarchy boundary says `B2 = f(D,x)` remains available to a capacity-matched baseline observing `(D,x)`; any gain is representation/inductive bias, not transported information. A valid stronger witness needs an independently acquired second register and an equal-baseline/separated pair (`theorem/sessions/2026-07-18-1349-empirical-unification-collapse.md:27-60`). This prevents rebranding the paper’s categorical architecture language as evidence that the tower has recovered new semantics.

## Agent 3 — CyberAlchemy-v2 delta explorer

Read-only delta: arXiv:2402.15332v2 is a real external formal framework, but it changes no CAV2 authority or implementation obligation today.

| Question / candidate | Before | After comparison | Disposition |
|---|---|---|---|
| Architecture-specification language | CAV2 already has a governed architecture-view interface: pattern candidate, evidence, validation, challenge, owner route, and promotion path. | The paper contributes a much narrower and stronger *ML-architecture* specification language: monads/2-monads and their algebras distinguish constraint/theory from executable realization; algebra homomorphisms express constraint-respecting maps. | **Clearer external formal owner.** CAV2 should cite/stage it as research if needed, not redefine its mathematics. |
| Constraint → implementation bridge | CAV2 already requires schema/machine view or typed residue (D21), and a change witness for authority-affecting shapes (D25). | This is precisely the paper’s stated gap: top-down model constraints vs bottom-up tensor-program implementations. But it bridges neural-architecture constraints to neural implementations, not CAV2 governance claims to repository mutations. | **Analogy-only for CAV2.** A future CAV2 adaptation would need a declared mapping from CAV2 constraint, artifact, implementation, and preservation witness—none exists. |
| Compositional architecture algebra | CAV2 supports pattern composition only as governed architecture knowledge; its current architecture interface is explicitly not a live schema. | The paper supplies actual compositional algebra for a different domain: monad algebra homomorphisms, parametric maps, and 2-categorical lax algebra data; it demonstrates recovery of equivariance constraints and RNN-style implementations. | **Promotion-candidate requiring a separate owner route**, only if the project wants a formal “architecture constraint profile / implementation witness” object. |
| Residue / preservation | CAV2-D18 already covers typed transformation remainder; D21 requires a declared machine view or typed residue. The Lean functor stack already separates schema and instance residue, and rejects pure-Markov cascade “improvement” absent source re-injection. | The paper’s preservation is algebra-law/commuting-diagram satisfaction, not CAV2 residue, and it supplies no evidence for the stack’s FF, dual-residue, or DPI claims. | **Already owned, non-collapsible.** Do not equate algebra-law violation with CAV2 residue without a typed coupling. |
| “All architectures” / universal language | CAV2 has claim-proof bound and owner-routed promotion. | The paper is a Position paper presenting a program and worked recoveries, not a universal proof that every architecture is captured, nor a repository-system specification. | **Blocked** from any “universal architecture language” or CAV2-wide formalization claim by D38. |
| Category vocabulary | Existing Morrow tower already rejects operative category/functor/naturality/adjunction language without typed objects, arrows, laws, and witnesses. | The paper makes these terms lawful inside its own formal setting, which is useful contrast but does not retroactively lawify Morrow’s JGS wiring/backbone/minting proposal. | **Clearer external formal owner; no local vocabulary promotion.** |

The decisive distinction is:

```text
Paper:  constraint theory  --(algebra homomorphism / semantics)--> ML implementation
CAV2:   governed claim/artifact --(owner + evidence + gate)--> allowed authority or work
```

They are not the same bridge. CAV2’s bridge is epistemic/governance-sensitive; the paper’s is mathematical/architectural. Treating the latter as the former would collapse authority decisions into model laws.

Selector-backed consequences:

- The paper explicitly frames its contribution as bridging constraints and implementations through monads valued in a 2-category of parametric maps, recovering geometric constraints and implementations including RNNs ([arXiv abstract and source](https://arxiv.org/abs/2402.15332)).
- CAV2’s current architecture surface already carries `owner_route`, evidence, promotion path, validation, challenge and blocked-use fields, but says the shape is not machine-enforced pending a schema-amendment witness: `cyberAlchemy-v2/architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md:81-125`.
- D21 requires classification/schema/human/machine facets or explicitly typed absence; it permits exploration but forbids silent absence: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1111-1167`.
- D25 is the exact guard if a proposed bridge adds a new machine-view or validation shape: `.../DEFINITIONS.md:1485-1508`.
- The Morrow tower independently concludes its categorical terms are not lawful: a free category on typed wiring is syntax only, while backbone/functor/naturality/adjunction claims lack their requisite structures and laws: `cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/research.md:34-43`; `.../towers/categorical-learning-system/README.md:17-26`.
- The functor-stack tower’s category theory is conditional and has distinct residue: schema and instance units, FF-chain preservation, source-grounding condition, plus unresolved P3/empirical/Markov/citation residue: `domainspec-lean-formalization/research/cyberalchemy-functor-stack-bet/definitions.md:6-30`; `.../residue/open-residue.md:1-22`.

Non-collapse warnings:

1. **Paper algebra law ≠ CAV2 authority rule.** A commuting diagram could be a validation witness for a narrowly declared architecture constraint, but cannot decide promotion, canonicality, or public safety.
2. **Morrow wiring category ≠ paper’s architecture algebra.** The Morrow source remains proposal-level wiring syntax; importing a mature external formalism does not fill its missing hom-sets, typed arrows, closure, identities, or execution semantics.
3. **Functor-stack residue ≠ paper constraint satisfaction.** The tower’s `η^sch` / `η^ins`, FF, and DPI claims retain their own evidence obligations. Do not rename them monad-algebra constraints.
4. **Architecture interface ≠ architecture specification language.** CAV2’s interface is governance metadata around architecture knowledge, whereas the paper offers semantics for neural architectures. A local bridge would be new design work, not a wording clarification.
5. **No public-shipment implication.** DomainSpec and Saturn remain private; nothing here establishes a public framework extension.

Minimum CAV2 consequence: **none beyond research posture.** Keep the paper as externally owned source evidence / possible import candidate. No CAV2 definition, ontology kind, schema, implementation task, or Morrow-tower mutation is justified.

If a later owner wants to pursue it, the smallest safe proposal is not “adopt categorical deep learning”; it is an architecture-route candidate for a scoped `constraint_profile -> implementation_witness` relation, with:

- an explicit target domain;
- a formal preservation condition;
- an implementation mapping;
- a finite law/fixture witness;
- counterexample and residue behavior;
- D21 facets and a D25 amendment witness if it changes machine shape;
- architecture owner + definitions-governance only if the terms become load-bearing.

Until then, status should remain **research / analogy-informed design**, not local authority.
