# Distill — Smallest Coherent Unit + Model Tournament (s5)

Owner: distill (parent), pareto join over lanes: lean-validator-xray,
categorical-formalizer, spec-correctness-prover. Skeptic constraints applied.

## Tournament result (pareto over route_menu)

| Framing            | Provability (no Mathlib)                   | PCRA-residue fidelity             | Fit w/ existing σ-model                                                | Impl cost | Honesty                               | Verdict                           |
| ------------------ | ------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------- | --------- | ------------------------------------- | --------------------------------- |
| **presheaf-lan**   | medium (Lan layer heavy; M6 witness cheap) | **high** (names irreducible loss) | **highest** (reuses Meta/EdgeType/sigmaValid/EdgeRow/Thm1/m6Witnesses) | medium    | **highest** ("Lan-faithful not full") | **WINNER (target framing)**       |
| fdm (Spivak)       | **high** (spans/path-equations decidable)  | medium                            | high (migration = σ edges)                                             | low       | high                                  | **operational core (adopt now)**  |
| func-sem (Lawvere) | low (needs products; σ-category is thin)   | low                               | low (fights model)                                                     | high      | medium                                | discard                           |
| refinement-functor | medium                                     | high (abstraction squares)        | medium (adds code category C)                                          | high      | high (honest form is oplax)           | **graft residue language onto T** |

## Distilled decision

The winner and runner-up are not rivals: **fdm is the operational core of
presheaf-lan** (Spivak migration spans realize the functor obligations; the Lan
layer is the long-horizon theorem). So the smallest coherent unit is:

> **SCU:** the deterministic translator `T` plus an `fdm`-style **functor-obligation
> check** over the existing σ-quiver, with residue **named** (not eliminated) and
> the `Lan`/M6-graph theorem held as an **explicitly open conjecture**.

This SCU is small enough to prove incrementally (`#eval`-checkable migration
laws), large enough to recompose into the full presheaf-lan roadmap, and reuses
every existing piece (`metaOf`, `EdgeRow`, `gradeFor`, `m6Witnesses`).

## Skeptic constraints folded in (must hold downstream)

- F1: "Stage A correct" = **internal** correctness only; intent capture sits
  above an **Intent Wall**, owned by humans, never Lean.
- F2: `F` is a **partial, lax** map, not a strict functor. Two residue directions:
  unspecified behavior (code ∉ spec) and unimplemented obligations (spec ∉ code).
- F3: a deterministic `T` can **launder** codegen residue into its own mapping
  table; split the two via per-artifact `EdgeProvenance`.
- Honesty ladder: only **operational + formal** claims are assertable; no
  `Functor.Full`, no isomorphism, no "proves fidelity/agreement", no zero-residue.

## Recomposition proof (SCU → full pipeline)

fdm functor-obligation check (now) → add provenance-split residue (P4 real) →
add per-meta obligations (P3 real, gated on DESIGN-PACKAGE B-1) → presheaf lift +
Lan unit η (residue = η not iso, witnessed by `m6Witnesses`) → open M6-graph
theorem. Each step is a strict superset of the prior; none invalidates Theorem 1.
