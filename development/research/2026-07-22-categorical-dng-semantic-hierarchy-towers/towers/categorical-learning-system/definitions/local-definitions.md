# Governed Local Definitions

Scope: this tower only. Status: unpromoted.

## CLS-LD1 — Wiring category

**Formal expression.** Given a small typed directed multigraph `G`, the free
category `Path(G)` has graph vertices as objects, finite composable paths as
morphisms, empty paths as identities, and path concatenation as composition.

**Notation meaning.** A generating edge `f:A→B` is one declared connector.
`g∘f` is the two-edge path `A→B→C`.

**Intuition.** This is the smallest lawful categorical shell recoverable from
the proposal’s node/edge language (PDF pp. 1, 11–12).

**Anti-misuse.** `Path(G)` proves only that paths form a category. It does not
prove that executing two neural components is total, deterministic,
semantics-preserving, or equivalent under reassociation. Those claims need a
separate semantics functor and runtime laws.

## CLS-LD2 — Execution semantics candidate

**Formal expression.** A possible semantics is a functor
`E : Path(G) → Proc`, where `Proc` is a defined category of typed processes,
`E(A)` is the interface/state space of specialist `A`, and `E(g∘f)=E(g)∘E(f)`.

**Intuition.** Wiring syntax and executable behavior are separate layers.

**Anti-misuse.** The proposal does not define `Proc`, `E`, equality of
stateful/effectful processes, or preservation witnesses. Therefore `E` is a
test obligation, not an extracted source construction.

## CLS-LD3 — Functor audit

For `F:C→D`, require:

1. source and target categories `C,D`;
2. an object map `A ↦ F(A)`;
3. an arrow map `f:A→B ↦ F(f):F(A)→F(B)`;
4. `F(id_A)=id_{F(A)}`;
5. `F(g∘f)=F(g)∘F(f)`.

The proposal’s backbone map provides at most part of an object/representation
map (PDF pp. 1, 5, 10–11). A common 384-dimensional space does not provide the
arrow map or laws.

## CLS-LD4 — Natural replacement audit

For functors `F,G:C→D`, a natural transformation `η:F⇒G` supplies
`η_A:F(A)→G(A)` for every object and satisfies
`G(f)∘η_A = η_B∘F(f)` for every `f:A→B`.

The source’s “swap pen0 ↔ pen2 while preserving wiring” (PDF p. 1) is a useful
replacement requirement. It becomes naturality only after the two whole-system
interpretation functors, every component map, and commuting squares are defined
and tested.

## CLS-LD5 — Adjunction audit

For `F:A→B` and `G:B→A`, `F⊣G` requires a bijection

`Hom_B(Fa,b) ≅ Hom_A(a,Gb)`

natural in `a` and `b`. Equivalently, typed unit `η:Id_A⇒GF` and counit
`ε:FG⇒Id_B` must satisfy both triangle identities.

The proposal names three adjunctions (PDF p. 2) and sketches LLM/JGS unit/counit
components (PDF p. 3), but it does not define the categories/functors or laws.
Each remains analogy-only.

## CLS-LD6 — Coverage gap

A coverage gap is a provenance-bound observation that a pinned router, encoder,
metric, or gate lacks sufficient support or confidence for an input.

It may trigger evidence gathering. It is not a categorical morphism gap: absence
from a stored graph may mean missing discovery, missing implementation, forbidden
composition, type mismatch, or genuinely no relation.

## CLS-LD7 — Semantic-hierarchy contribution

A contribution is an operation that produces or tests evidence for the bridge
without creating semantic authority. Here that includes pinned ANN neighborhood
generation, stable graph records, provenance links, candidate composition
directions, retained gaps/examples, and active acquisition strategies (PDF
pp. 8, 11–14, 17–20, 27–31).

It excludes inferred semantic relation, order, facet, hierarchy, or alignment.

## CLS-LD8 — Minting evidence threshold

A model-minting claim is adjudicable only when a versioned source category,
encoder/decoder checkpoints, train/validation split, comparator semantics,
task-distribution coverage, tolerances, negative controls, compression accounting,
and reproducible run records exist.

Held-out output similarity (proposed on PDF p. 25) may support bounded behavioral
fidelity; it cannot establish equality of the minted model and the live category.
