# View 01 — Residue type (the load-bearing seam)

> Parent: [`../MAP.md`](../MAP.md). Axis: does an artifact-level residue carry a
> **type** that mechanically fires a gate, or is it prose?

## EVIDENCE (owned, anchored)

- **The gap is diagnosed and owned by TO-VLAD.** `Arcanum/TO-VLAD/TO-VLAD.md`
  finding #1: *"Residue has no type at any layer"* — the framework's central unit
  (what an artifact cannot carry across its boundary) has no first-class
  representation; the sigil template ships without a `<source-schema>`/residue field.
  Reinforced: `TO-VLAD2.md` (the type substrate underneath — sigils are untyped),
  `TO-VLAD4.md` (Craft reproduces the same defect: `CRAFT-LEDGER-SCHEMA.yml` types
  only governance; residue has **no field, enum, row-family, or id-prefix**; a
  phantom `RESIDUE-TAXONOMY.md`).
- **A candidate type exists on the Lean side.** `domainspec-lean-formalization/
  lean-formalization/FunctorialResidueStructure.lean`: `noise_anti` (line 121) makes
  monotonicity the functor's *action on a morphism*, not an axiom;
  `functorial_strictly_dominates_count` (line 286) proves a morphism-sensitive
  residue separates inputs a `Set`-cardinality residue cannot. This is a residue
  *with a type* (a functor-action / morphism shape).

## INFERENCE / SEAM (open)

- **Claim:** the Lean morphism-action type can fill the artifact-level residue gap,
  giving the residue-ledger a signature that fires Pass/Flag/Block automatically.
- **Collapse-test:** if an artifact-level residue cannot be expressed as a morphism
  (only as free-text "what we dropped"), the type does not transfer — the ledger
  collapses to Arcanum's `residuality-spec` prose, **contribution zero**. The Lean
  object is about presheaf-Lan residue, *not* LLM synthesis; the transfer is a
  conjecture, not a theorem (subset rule: the Lean proof certifies nothing at the
  agent layer).

## STATUS

**OPEN.** This is the one un-owned, load-bearing seam of the whole integration.
Owner of the *gap*: TO-VLAD1/2/4. Owner of the *candidate type*: the Lean repo.
Owner of the *transfer*: nobody yet.

## ROUTE

Resolve via a `research` dispatch in the theorem repo: *does an artifact-level
residue type exist and is it un-owned?* (candidates to mine: MI/resource theories,
codensity/nucleus, Grothendieck Σ-fibre, refinement types, Galois connections,
residuality theory — Hopkins/Cook). Verdict-per-candidate, collapse-tested. Do not
write the ledger before this returns a type-driven verdict.
