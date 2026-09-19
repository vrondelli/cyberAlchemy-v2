# Invoke Define — Lean Functor Validation For DomainSpec

Stage: s2 · Capability: invoke (define) · Owner-of-record: refine parent coordinator

## Objective (named)

Define the **DomainSpec Categorical Verification Pipeline**: a system in which the
DomainSpec language is the representation a Lean validator reasons over, used to
mathematically establish two things in sequence:

1. **Stage A — Spec correctness.** A DomainSpec spec (contract + schema, per the
   prior DESIGN-PACKAGE) is _well-formed and internally correct_ — decidably,
   in Lean.
2. **Stage B — Code-as-functor.** LLM-produced code is the _data_ side of Craft's
   schema→data translation. A **deterministic translator** lifts the code into
   the DomainSpec language; Lean then checks that this lift is a
   **structure-preserving functor** from the implementation back onto the spec,
   reporting the non-preserved part as **governed residue** (PCRA), not as a
   silent failure.

## What is being built, why, for whom

- **What:** a design (not code) for the pipeline, its categorical model, the
  deterministic translator's input contracts, the Lean proof obligations, the
  residue/honesty boundary, and one implementation work pack.
- **Why:** to move DomainSpec from "validateable structure" (the prior package)
  to "mathematically checkable agreement + mechanically checkable implementation
  fidelity," reusing the σ-signature machinery the validator already ships.
- **For whom:** DomainSpec/Arcanum maintainers building the verification layer;
  the existing lean-code-validator is the seed implementation.

## Initial definitions (candidate)

- **Spec category `S`.** Objects = DomainSpec concepts (the validator's `Meta`
  values: Entity, Operation, Rule, Workflow, …); morphisms = typed edges whose
  legality is `sigmaValid : Profile → EdgeType → Meta → Meta → Bool`. The
  validator already builds this as `EdgeRow` carrying a compile-time
  `wellTyped` proof — so "the spec is a well-typed quiver/category" is _already
  free by construction_ (Theorem 1, `all_edges_well_typed`).
- **Spec correctness (Stage A).** Beyond well-typedness: P1 schema closure (no
  unresolved refs), P5 acyclicity of the codegen-dependency subgraph (both
  _real_ today), plus the deferred P3 (per-meta obligations) and P4 (M6
  ambiguity / provenance). Stage A = these predicates discharged.
- **Implementation category `C`.** Objects = code units (modules, types,
  functions) recovered from produced code; morphisms = code dependencies/calls.
- **Deterministic translator `T : C → DomainSpec`.** A non-LLM, reproducible map
  that lifts code into DomainSpec-language artifacts using: architecture
  patterns (`ARCHITECTURE-PATTERN-LIBRARY.md`), DomainSpec source tags
  (`domainspec-tag-code`), composability/relationship rules (`RELATIONSHIPS.md`,
  `TAXONOMY.md`), and code-graph data (GitNexus). Determinism is the load-bearing
  property: the _translator_ must not be PCRA even though the _code generator_
  is.
- **Code-as-functor `F`.** The composite `T` then classification yields a functor
  candidate `F : C → S`. Validation = does `F` preserve composition and identities
  (commute with spec structure)? Non-commuting image = residue.
- **Residue (PCRA).** Per Craft: the target is _acceptable, named, governed
  residue_, never zero. Stage B reports residue classes, it does not claim
  `Functor.Full` (the validator README is explicit: "Lan-faithful, not full").

## Scope boundary

- IN: design + decision + plan; reuse/extension map for the existing validator.
- OUT: writing Lean/parser/translator code; mutating the validator or Craft;
  asserting the categorical claim is _proven_ (it is staged, per Craft).

## Candidate domain map (to be tested by research + x-ray)

```
Intent
  -> DomainSpec spec (contract+schema)            [Stage A: prove correct in Lean]
  -> LLM codegen (PCRA functor, lossy)            [Craft schema->data]
  -> produced code  C
  -> deterministic translator T (patterns/tags/composability/graph)
  -> recovered DomainSpec artifacts
  -> functor check F: C -> S in Lean              [Stage B: structure preservation]
  -> residue ledger (named, governed)             [PCRA honesty boundary]
```

## Unknowns (seed the research + tournament)

- U1: Which categorical framing best fits the existing σ-model — functorial data
  migration, functorial semantics, presheaf+Lan, or an abstraction/refinement
  functor? (route_menu decision)
- U2: What exactly does "spec is correct" require beyond P1/P5 — and can P3/P4 be
  made decidable without Mathlib (the validator's constraint)?
- U3: Can the translator `T` be made deterministic enough that residue is
  attributable to the _codegen_, not to `T`?
- U4: What is the minimal provable Stage-B surface (the toy-game target)?

## Residue ledger (seeded)

- R-honesty: no full-faithfulness claim; stage the categorical claim.
- R-stub: P3/P4 are stubs today — Stage A is partial until they land.
- R-determinism: translator determinism is asserted, not yet proven.
