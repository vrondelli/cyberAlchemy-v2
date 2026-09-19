# Refine Seed Proposal — Clarity Gaps + DomainSpec Language Fit

- Run id: `2026-06-08-clarity-language-fit`
- Owner: refine
- Preset: `standard`
- Research mode: `research-if-gap-appears` (no online research requested)
- Status: seed (pre-permission)

## Target

The **prior refine run** `2026-06-08-lean-functor-validation/` (the two-stage
categorical verification design) examined through two operator questions:

1. **"What is not clear in the refining?"** — surface, structure, and refine the
   parts of that design that remain ambiguous, unresolved, or under-specified.
2. **"If our DomainSpec language helps in this."** — assess whether the DomainSpec
   *language* (the contract/schema/iteration language from
   `research/DESIGN-PACKAGE.md`: 5 doc kinds, canonical envelope, anti-collapse
   rules, lifecycle) is actually **load-bearing** for the categorical pipeline,
   or whether the existing Lean validator's σ-model already carries the weight
   and the language is incidental / parallel.

This is a clarity-and-fit refinement over existing evidence — not a new build.

## Operator Intent (raw)

> what is not clear in the refining, if our domainspec language helps in this

## Refinement Objective

Produce a refined, non-executed clarity package that:
- enumerates the **clarity gaps** of the prior run, each typed (definition gap /
  decision gap / decidability gap / scope gap / evidence gap) and assigned an
  owner (Lean-provable / human-only / deferred / blocked-on-B1);
- answers the **language-fit question** with a recorded position (load-bearing /
  incidental / partial) backed by concrete evidence from both the DESIGN-PACKAGE
  and the validator;
- names what would have to be true for the DomainSpec language to be load-bearing
  (the bridge between the language's `Meta`/`EdgeType`/obligation model and the
  validator's σ-quiver), and whether that bridge exists today;
- updates the residue ledger and recommends next routes.

## Source Context (evidence baseline — all local)

- `development/refinement-runs/2026-06-08-lean-functor-validation/RESULT.md` and
  its stage artifacts (DEFINE unknowns U1–U4; DEC-CAT-01; STAGE-A-CORRECTNESS;
  TRANSLATOR-DESIGN; REVIEW; DESIGN-REVIEW; TOYGAME; REPAIR; PLAN).
- `projects/domainspec-language/research/DESIGN-PACKAGE.md` + `research/lanes/*`
  (the DomainSpec language: doc kinds, envelope, contract↔schema, iteration,
  lifecycle, blocker B-1 `obligation_id`s).
- `implementation/domainspec/internal_tools/lean-code-validator/` (σ-model:
  `Meta`, `EdgeType`, `sigmaValid`, `EdgeRow`, P1–P5).
- `arcanum/.agents/skills/craft/CRAFT-INITIAL-DEFINITION.md` (schema/data/functor/
  residue — the language is the "schema" side).

## Write Scope
Run folder only; plus, on synthesis, an optional clarity/fit section appended to
`research/DESIGN-PACKAGE.md`. No mutation of the validator, Craft, the prior run,
or implementation source.

## Done Criteria
1. A structured **clarity-gap register** (typed + owned) for the prior design.
2. A recorded **language-fit verdict** with evidence and the bridge condition.
3. Updated residue ledger + recommended next routes. No code written.

## Validation Surface
- Dispatch validates against `dispatch.schema.yml`.
- Dialectic stages carry roles + convergence criteria.
- Final synthesis built from stage artifacts.

## Planned Stage Configuration
Canonical ten-stage refine loop at `standard` depth. A dialectic overlay
(advocate vs skeptic on language-fit) is layered on the interrogation/distill
stages; a memory overlay recovers the prior run's residue.
