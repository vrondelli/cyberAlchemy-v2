# Decision — Categorical Formalization (gate g-categorical-decision)

- Decision id: DEC-CAT-01
- Status: **decided (provisional, owner-ratifiable)** — satisfies gate
  `g-categorical-decision` required before Invoke Plan (s9).
- Owner: refine (with operator promotion authority).

## Question

Which categorical framing formalizes "validate LLM-produced code as a functor onto
a DomainSpec spec" for the Lean validator?

## Options considered

fdm (Spivak functorial data migration) · func-sem (Lawvere) · presheaf-lan
(validator's own roadmap) · refinement-functor (abstraction).

## Decision

**Target framing = `presheaf-lan`; implemented core = `fdm`.**

- Build now on **`fdm`**: the spec σ-quiver as the schema category; the
  deterministic translator's output as the instance; functor obligations =
  decidable, `#eval`-checkable migration/path laws. Lowest cost, highest
  provability without Mathlib, reuses `sigmaValid`/`EdgeRow`/`gradeFor`.
- Frame toward **`presheaf-lan`**: it is the validator's named roadmap and the
  most PCRA-honest ("Lan-faithful, not full"). Residue is defined as the **Lan
  unit `η` failing to be iso**, witnessed computably **today** by `m6Witnesses`.
- **Graft** the refinement-functor's **abstraction-square** vocabulary onto the
  translator `T` design (non-commuting square = residue), without adopting a
  separate code category as a proof object.
- **Discard** func-sem (the σ-category is thin / productless; it fights the model).

## Hard constraints attached (from residue-skeptic)

1. The Kan/`Lan`/M6-graph theorem is an **OPEN CONJECTURE** — never asserted
   proven (dispatch promotion_guardrail + Craft R-honesty).
2. `F` is **partial + lax**, reported via non-commuting squares; not a strict
   functor and never `Full`.
3. Residue is split by `EdgeProvenance` into translator-mapping vs codegen
   residue before any "codegen-attributable" claim.
4. Only operational + formal claims assertable.

## Why not defer

The framing gates the whole design (translator output target, proof obligations,
residue definition). The evidence (existing σ-model + roadmap) makes the choice
low-risk and reversible toward fdm-only if the Lan layer proves too costly.
