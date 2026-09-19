# Categorical Formalizations — Code-as-Functor Validation

Stage: s4 (research) · Role: `categorical-formalizer` · Dispatch: `refine-2026-06-08-lean-functor-validation`
Pattern: tournament / pareto · Mode: bounded online research (one comparison pass) + local reading

> **Boundary (Craft honesty / `b-external-noncanonical`).** Every external source below is
> tagged **NON-CANONICAL ANALOGY** with a URL. External categorical literature is used only to
> _name and shape_ candidate framings. It does **not** override local repository evidence
> (`Sigma.lean`, `Richness.lean`, the categorical roadmap, `CRAFT-INITIAL-DEFINITION.md`). Where
> a framing disagrees with the local σ-model, the local model wins and the disagreement is logged
> as residue. No framing is claimed _proven_; per Craft and the dispatch promotion guardrails the
> claim is staged operational → formal → philosophical, and **no `Functor.Full` claim is made**.

## Local evidence this stage is anchored to

- **σ-model is already a thin category in disguise.** `sigmaValid : Profile → EdgeType → Meta → Meta → Bool`
  (`Sigma.lean`) enumerates valid `(edge, srcMeta, tgtMeta)` triples. Objects = 25 `Meta`; morphism-
  generators = the valid triples. The roadmap (`toward-categorical-spec-semantics.md`, Step 1) notes
  **no two generators compose into a third valid edge** → the category is _thin_, all composites trivial.
  Lifting to a `SmallCategory Σ` is "~20 lines, purely mechanical," no Mathlib needed.
- **A spec is NOT yet a `Σ ⥤ Type` functor.** Edges are a _relation_, not a function: e.g. `User`
  has 14 outgoing `performs` edges, so `F(performs)` is not single-valued (roadmap Step 2). Three
  exits: **Path A** presheaf/span (Spivak-style), **Path B** free category, **Path C** restrict to
  functional specs. Roadmap recommends **Path A**.
- **`EdgeRow.wellTyped` makes σ-typing free by construction.** `all_edges_well_typed` (Theorem 1)
  is `rfl`/induction, no `native_decide`, no Mathlib. This is the structural backbone any framing
  must reuse, not refight.
- **"Lan-faithful, not full."** README and roadmap deliberately refuse a fullness claim. The open
  **M6-graph theorem** conjectures: spec instances with M6 patterns induce a compilation functor `Δ`
  that is **not full**. `m6Witnesses` (`Richness.lean`) is the computable witness today (heuristic;
  its tie to fullness is asserted, not proved).
- **PCRA residue target.** Craft (`CRAFT-INITIAL-DEFINITION.md`): the LLM translator is Probabilistic-
  Contextual-Relational-Attentive; the goal is _acceptable, named, governed residue_, never zero. The
  **translator `T` must be deterministic** even though the codegen is PCRA (DEFINE.md, U3).

External anchors (all NON-CANONICAL ANALOGY):

- Spivak, _Functorial Data Migration_, arXiv:1009.1166 — https://arxiv.org/abs/1009.1166 ; relational
  foundations / FQL, arXiv:1212.5303 — https://arxiv.org/pdf/1212.5303 ; theory-to-practice arXiv:1502.05947 — https://arxiv.org/pdf/1502.05947
- Lawvere, _Functorial Semantics of Algebraic Theories_ (1963), TAC reprint — http://www.tac.mta.ca/tac/reprints/articles/5/tr5abs.html ;
  nLab _Lawvere theory_ — https://ncatlab.org/nlab/show/Lawvere+theory
- Kan extensions: nLab — https://ncatlab.org/nlab/show/Kan+extension ; 1Lab left Kan extensions — https://1lab.dev/Cat.Functor.Kan.Base.html (η iso when the functor extended along is fully faithful)
- Refinement / abstract interpretation as functor: "Abstract interpretation as anti-refinement," arXiv:1310.4283 — https://arxiv.org/pdf/1310.4283 ;
  "A Categorical Framework for Program Semantics" (oplax functors + Galois connections), arXiv:2309.08822 — https://arxiv.org/pdf/2309.08822

---

## Framing 1 — `fdm` · Functorial Data Migration (Spivak)

**Source (NON-CANONICAL ANALOGY):** Spivak, arXiv:1009.1166 (https://arxiv.org/abs/1009.1166);
relational foundations arXiv:1212.5303 (https://arxiv.org/pdf/1212.5303).

### 1. Precise statement

- **Objects/morphisms.** A _schema_ is a finitely-presented small category `Σ` (objects + generating
  arrows + **path equations**). Here `Σ` = the σ-category: objects = `Meta`, generators = valid σ-triples.
- **The functor.** A _spec instance_ is a Set-valued functor `I : Σ ⥤ Set` — each `Meta` gets a set of
  concepts, each edge a function. Because real specs are many-to-many, the honest encoding (roadmap
  Path A) is the **span/presheaf form**: each edge type `e : m₁→m₂` is a set `E_e` with projections
  `src : E_e → I(m₁)`, `tgt : E_e → I(m₂)`. The deterministic translator `T` produces this instance
  from code. A schema functor `Δ : Σ_code → Σ_spec` then induces the migration trio
  `Δ* (pullback), Σ_Δ (left adjoint), Π_Δ (right adjoint)`.
- **"Validation passes."** (a) The instance satisfies all **path equations** (data integrity
  constraints); (b) every edge respects σ (already free via `EdgeRow.wellTyped`); (c) code→spec
  migration `Δ*` lands the code instance inside the spec instance with no unresolved targets (P1).

### 2. Fit with existing `sigmaValid` model

**Highest fit.** `sigmaValid` _is_ the schema's arrow table; `Meta` _is_ the object set; `EdgeRow` _is_
a presheaf row (`src`/`edge`/`tgt`). FDM does not fight the model — it is the literature name for what
the validator already half-built. Path A (span) matches `EdgeRow`'s shape exactly. Reuses Theorem 1.

### 3. Residue meaning

Residue = **failed path equation** (a commuting-square / integrity constraint the migrated instance
violates) and **unresolved migration targets** (P1 fails). M6-style convergence appears as two spans
landing on the same non-Entity target with no disambiguator — a place where `Δ*` cannot be inverted.

### 4. Provability in self-contained Lean 4 (no Mathlib)

**Good.** Thin `Σ` as `SmallCategory` is ~20 lines. Instances as records of lists + decidable
projections; path-equation checks are decidable `Bool` enumerations (specs are finite). No need for
Mathlib's `CategoryTheory` unless one wants the _named_ `Σ_Δ ⊣ Δ* ⊣ Π_Δ` adjunctions — and those
adjunctions are **not needed** for the validation predicate; only `Δ*`-image-checking is. Cost: low–moderate.

### 5. Pros / cons / risk

- **Pros:** closest to existing code; literature-backed; path equations give a precise, decidable
  residue notion; reuses Theorem 1; system-agnostic (schema is just a category).
- **Cons:** full migration trio is heavier than needed; "code as a _single_ functor" gets replaced by
  "code as an _instance_," which is a slight reframing of the operator's "code-as-functor" phrasing.
- **Risk:** low. Main risk is over-building the Σ/Π adjoints that the MVP does not require.

---

## Framing 2 — `func-sem` · Functorial Semantics (Lawvere)

**Source (NON-CANONICAL ANALOGY):** Lawvere 1963, TAC reprint
(http://www.tac.mta.ca/tac/reprints/articles/5/tr5abs.html); nLab Lawvere theory
(https://ncatlab.org/nlab/show/Lawvere+theory).

### 1. Precise statement

- **Objects/morphisms.** A _theory_ `T` is a small category **with finite products** and a generic
  algebra; objects are powers of one generic sort.
- **The functor.** A _model_ is a **finite-product-preserving functor** `M : T ⥤ Set`; model
  homomorphisms are natural transformations.
- **"Validation passes."** Code, lifted by `T`, is a product-preserving functor that preserves each
  declared operation/relation of the spec-as-theory: every operation signature in the spec has a
  corresponding code realization that respects arity (products) and composition.

### 2. Fit with existing `sigmaValid` model

**Low–moderate fit / partly fights the model.** The σ-category is **thin with no nontrivial composites
and no products** (roadmap Step 1). Lawvere theories are _built on_ finite products and a generic sort;
forcing the σ-category into a product theory means inventing product structure that the σ-table does
not provide. It re-describes `Operation`/`Calculation` as algebraic operations, which is suggestive for
the _behavioral_ layer but orthogonal to the _structural_ edge-typing the validator owns.

### 3. Residue meaning

Residue = **non-preservation of products / operation structure** (the model functor drops or merges an
operation, or fails arity). Useful intuition for "does the code implement every operation," but the σ-model
has no product objects to witness this, so the residue would live in a _new_ layer, not the current one.

### 4. Provability in self-contained Lean 4 (no Mathlib)

**Moderate–hard.** Encoding "finite-product-preserving functor" decidably without Mathlib means
hand-rolling product objects and preservation checks — more machinery than the thin-category route, for
structure the spec does not currently carry. Cost: moderate-high relative to value.

### 5. Pros / cons / risk

- **Pros:** the canonical, oldest, most respected "structure = structure-preserving functor" template;
  excellent for an eventual _operation-semantics_ layer (Stage B behavioral fidelity).
- **Cons:** demands product structure absent from the σ-model; reframes the validator's structural job
  as an algebraic one; weakest reuse of `EdgeRow`.
- **Risk:** moderate — scope creep into inventing a theory layer that the MVP does not need.

---

## Framing 3 — `presheaf-lan` · Spec-as-presheaf + Kan extension (Lan)

**Source (NON-CANONICAL ANALOGY):** nLab Kan extension (https://ncatlab.org/nlab/show/Kan+extension);
1Lab left Kan extensions (https://1lab.dev/Cat.Functor.Kan.Base.html) — the unit η of `Lan_p F` is an
**isomorphism when `p` is fully faithful**. **This framing is the validator's OWN local roadmap**
(`toward-categorical-spec-semantics.md`), so it is the least "external."

### 1. Precise statement

- **Objects/morphisms.** Spec = a **presheaf** on the σ-category: instance as `Σ^op ⥤ Set` (Path A spans).
- **The functor.** A code-side schema map `J : Σ_code → Σ_spec`; the spec instance is recovered by a
  **left Kan extension** `Lan_J (code-instance)`, with **unit** `η : H ⇒ (Lan_J H)∘J`.
- **"Validation passes."** Two graded levels: **Lan-faithful** (the weaker, _honest_ claim the README
  commits to) = the recovered instance faithfully embeds the code's typed graph; **NOT full** = η is
  _not_ asserted to be an isomorphism. Validation = `J` exists, the instance is a well-typed presheaf
  (free via Theorem 1), and the M6 obstruction is absent where fullness would be required.

### 2. Fit with existing `sigmaValid` model

**Highest fit — it IS the local model's stated next step.** Reuses `Meta`/`EdgeType`/`sigmaValid`,
`EdgeRow` (presheaf row), Theorem 1, and `m6Witnesses` _unchanged_. The roadmap explicitly recommends
"formalize `Σ` as `SmallCategory`, then spec-to-presheaf (Path A), then the M6-graph theorem."

### 3. Residue meaning

Residue = **the Lan unit `η` failing to be iso** (precisely the "faithful but not full" gap), witnessed
operationally by **M6 patterns** (`m6Witnesses`): two distinct sources converge on the same non-Entity
target with no disambiguating relation — the categorical signature of lost information that `Lan` cannot
recover. This is the **single most PCRA-faithful residue notion** of the four: it _names_ the
irreducible loss instead of demanding zero residue.

### 4. Provability in self-contained Lean 4 (no Mathlib)

**Mixed.** The _operational_ surface (thin `SmallCategory Σ`, presheaf-as-records, `m6Witnesses`
enumeration, Theorem 1) is decidable and **already Mathlib-free today**. The _formal_ surface (a real
`CategoryTheory.Functor`, a genuine `Lan`, proving `η` iso/non-iso) is exactly where Mathlib's
`CategoryTheory.Limits`/`Kan` would normally be pulled in — **the expensive, deferred part**. The honest
MVP proves the operational layer and leaves the Lan-unit theorem as a _named open conjecture_
(the M6-graph theorem), matching the dispatch's "stage the claim" guardrail. Cost: low for MVP, high if
the full Lan theorem is in-scope.

### 5. Pros / cons / risk

- **Pros:** zero divergence from local roadmap; reuses _everything_; residue notion is the most honest
  (faithful-not-full is built in); the one framing whose honesty boundary is already written down.
- **Cons:** the headline categorical content (Lan, η-iso) is the _deferred_ part; MVP delivers the
  graph-level witness, not the proved theorem — risk of over-claiming if not carefully staged.
- **Risk:** moderate, and it is a _claim-discipline_ risk (claim > proof), already flagged as R-honesty.

---

## Framing 4 — `refinement-functor` · Abstraction / refinement functor

**Source (NON-CANONICAL ANALOGY):** "Abstract interpretation as anti-refinement," arXiv:1310.4283
(https://arxiv.org/pdf/1310.4283); "A Categorical Framework for Program Semantics" (oplax functors +
Galois connections), arXiv:2309.08822 (https://arxiv.org/pdf/2309.08822).

### 1. Precise statement

- **Objects/morphisms.** Concrete code category `C` (objects = code units, morphisms = calls/deps);
  abstract spec category `S` (= σ-category). The deterministic translator `T` is the **abstraction
  functor `α : C → S`** (concretization `γ` going back, forming a Galois connection `α ⊣ γ` /
  oplax pair).
- **The functor.** `α` (i.e. `T`) abstracts code upward to the spec; validation = `α` **commutes with
  spec structure** (sends code dependencies to σ-legal edges) and the abstraction is _sound_
  (`α` ∘ `γ` ≤ id in the refinement order).
- **"Validation passes."** Every code morphism abstracts to a σ-valid spec morphism, and the abstraction
  square commutes; the **non-commuting part is residue**.

### 2. Fit with existing `sigmaValid` model

**Moderate fit.** It cleanly models the _translator_ `T` (the DEFINE.md "deterministic abstraction")
and gives a principled account of _soundness vs completeness_ (a Galois connection separates "α is
sound" from "α is complete," matching faithful-vs-full). But the σ-category supplies the _target_ `S`
only; the framing's heavy machinery lives in `C` and `α`, which the validator does **not** yet encode
(no `C` category exists in `Sigma.lean`). So it reuses `S` but adds a whole new concrete side.

### 3. Residue meaning

Residue = **the non-commuting part of the abstraction square** (code morphisms whose `α`-image is not a
σ-valid edge, or where `α∘γ ≠ id`). This is the most _operationally intuitive_ residue ("what didn't
abstract cleanly"), and lines up with Craft's residue classes (translation/structural). Notably, the
literature framing here is **anti-refinement / oplax** — ordinary functors are _not_ closed under
Galois-induced abstraction (arXiv:2309.08822), which is itself an honesty signal that strict
functoriality of `T` is the thing at risk (supports the residue-skeptic lane).

### 4. Provability in self-contained Lean 4 (no Mathlib)

**Moderate.** Commuting-square / soundness checks over finite code graphs are decidable `Bool` checks,
Mathlib-free. But you must first _encode the code category `C`_ (objects, morphisms) deterministically —
that is the translator-designer's burden, not a category-library burden. The Galois-connection law as a
_proved_ property needs an order structure; as a _checked_ property it is decidable. Cost: moderate
(dominated by modeling `C`, not by category theory).

### 5. Pros / cons / risk

- **Pros:** best _story_ for the deterministic translator and for "code abstracted upward"; cleanly
  separates sound (faithful) from complete (full); residue = non-commuting square is intuitive and
  toy-game-friendly (FaultInject style).
- **Cons:** introduces a concrete code category `C` the validator has not built; literature says the
  honest form is _oplax/anti-refinement_, not a strict functor — mild tension with the "is it a functor"
  framing; weaker direct reuse of `EdgeRow` on the code side.
- **Risk:** moderate–high — most new surface area; risk of asserting strict functoriality where only
  an oplax/sound abstraction holds (a real PCRA honesty trap).

---

## Score table (provisional, pending refine decision gate)

Scale: 5 = best on that criterion, 1 = worst. Higher total = better, but the gate must weight by goal.

| Criterion                          | `fdm`  | `func-sem` | `presheaf-lan`         | `refinement-functor` |
| ---------------------------------- | ------ | ---------- | ---------------------- | -------------------- |
| Provability without Mathlib        | 4      | 2          | 4 (MVP) / 2 (full Lan) | 3                    |
| Fidelity to PCRA residue           | 3      | 2          | **5**                  | 4                    |
| Fit with existing σ-model          | **5**  | 2          | **5**                  | 3                    |
| Implementation cost (5 = cheapest) | 4      | 2          | 4                      | 3                    |
| Theoretical honesty                | 4      | 3          | **5**                  | 4                    |
| **Provisional total**              | **20** | 11         | **23 / 21**            | 17                   |

Notes: `presheaf-lan` scores the dual provability/total because the MVP (operational presheaf + M6
witness) is cheap and Mathlib-free, while the headline Lan-unit theorem is the expensive deferred part.
`fdm` is the strongest _non-deferred_ alternative and is essentially the operational core of
`presheaf-lan` minus the Kan vocabulary.

## Provisional recommendation (marked PROVISIONAL — decision belongs to the s5 distill/pareto gate)

**Recommend `presheaf-lan` as the spine, with `fdm` as its operational core.** They are not really
rivals: Spivak-style functorial data migration _is_ the spec-as-presheaf construction (Path A spans),
and the Kan-extension/`Lan` layer sits on top of it to name the faithful-not-full residue. Adopting
`presheaf-lan` means:

- **MVP (provable now, no Mathlib):** thin `SmallCategory Σ` (~20 lines), spec-as-presheaf via the
  existing `EdgeRow` spans, `all_edges_well_typed` (free), and `m6Witnesses` as the computable residue.
  This is exactly `fdm`'s decidable core — so the recommendation banks `fdm`'s cheapness.
- **Deferred / staged formal layer:** the genuine `Lan`, the unit `η`, and the **M6-graph theorem**
  (M6 ⇒ `Δ` not full) stay an explicitly-open conjecture — never asserted proven (Craft R-honesty;
  dispatch guardrail "never asserting proven full faithfulness").

**Why `presheaf-lan` over `fdm` outright:** identical operational cost, but `presheaf-lan` already
carries the _honesty boundary_ in its name ("Lan-faithful, not full") and is the validator's own
recorded roadmap, so it minimizes divergence and maximizes reuse. **Why not `func-sem`:** it demands
product structure the σ-model lacks (fights the model). **Why keep `refinement-functor` alive:** it is
the best _design vocabulary for the deterministic translator `T`_ (abstraction functor / sound-not-
complete = faithful-not-full); recommend **grafting** its abstraction-square residue language onto the
`T` design in s6 even though `presheaf-lan` wins the formalization slot.

**Runner-up:** `fdm` (the operational core; pick it if the gate decides the Kan/Lan layer is out of
scope entirely and wants zero deferred theorems).

---

## Residue ledger contributions (this stage)

- **R-honesty (reinforced):** the headline categorical content of the winner (`Lan` unit iso) is
  precisely the part that must stay _open_; the MVP proves only the operational presheaf + M6 witness.
- **R-determinism:** `refinement-functor` literature (oplax/anti-refinement, arXiv:2309.08822) warns
  that the honest abstraction `T` may be _oplax_, not a strict functor — a concrete PCRA trap for the
  determinism claim about `T`, to be stress-tested by the residue-skeptic (s7/s8).
- **R-meta (external boundary honored):** the precedent search (`L1-i-categorical-lit.md`) found **no**
  canonical source identifying "fractal/eigenform/self-similar" with fully-faithful / unit-iso. The
  faithful-not-full residue notion here is therefore presented as the validator's own construction
  named via standard Kan-extension theory — **not** as a discovered literature bridge.
