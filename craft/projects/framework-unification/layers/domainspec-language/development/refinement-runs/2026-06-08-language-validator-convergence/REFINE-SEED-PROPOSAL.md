# Refine Seed Proposal — Language ↔ Lean Validator Convergence

- Run id: `2026-06-08-language-validator-convergence`
- Owner: refine
- Preset: `full`
- Research mode: `research-if-gap-appears`
- Status: seed (pre-permission)

## Target

A **convergence architecture** in which the DomainSpec language
(`research/DESIGN-PACKAGE.md`) and the Lean validator
(`implementation/domainspec/internal_tools/lean-code-validator/`) become
**mutually dependent** — each one depends on the other, by design, so they
evolve as one coupled system rather than two parallel efforts.

This directly extends the two prior runs:
- `2026-06-08-lean-functor-validation` (the two-stage categorical pipeline), and
- `2026-06-08-clarity-language-fit` (verdict DEC-FIT-01: the language is
  *incidental today, load-bearing on P3/P4 once a bridge is built* — a
  **one-directional** dependency). The operator now wants **bidirectional**
  convergence.

## Operator Intent (raw)
> i want to make language and lean validator to converge and be dependent one of another

## Refinement Objective
Design (not implement) the **mutual-dependency model**:
- **Direction 1 — validator depends on language:** the validator's obligation /
  vocabulary surface (P3 per-meta obligations, the `Meta`/`EdgeType` set) is
  *derived from* DomainSpec language artifacts (contract `obligation_id`s,
  schema/taxonomy), not hand-maintained. (The DEC-FIT-01 bridge.)
- **Direction 2 — language depends on validator:** the language's *validation
  authority* and lifecycle promotion (`draft→…→validated→promoted`) are bound to
  the Lean validator's verdict — a DomainSpec doc is not `validated`/promotable
  until Lean grades it `pass`. The validator becomes the language's machine
  checker.
- The **shared spine** that makes both true without vicious circularity: a single
  source-of-truth vocabulary and a meta-level acyclic bootstrap.

## The central risk (named by the prior run)
**R-circularity**: if the language defines what the validator checks AND the
validator decides whether the language's specs are valid, naive coupling is a
chicken-and-egg deadlock. The design must keep the *dependency healthy*
(bidirectional but acyclic at the meta level: content authority vs well-formedness
authority stay separate) — exactly the prior run's R-circularity repair.

## Source Context (local)
- `research/DESIGN-PACKAGE.md` (language: doc kinds, envelope, obligations,
  anti-collapse, lifecycle, validation authority §7/§8).
- Prior runs' RESULT + DEC-FIT-01 (`LANGUAGE-FIT-VERDICT.md`), DEC-CAT-01,
  CLARITY-GAP-REGISTER, the R-circularity/R-bridge-feasibility residues.
- `lean-code-validator/` (σ-model, P1–P5, `gradeFor`, vocabulary source =
  `domainspec-core` + paper tables), `VALIDATOR-XRAY.md`.
- `arcanum/.agents/skills/craft/CRAFT-INITIAL-DEFINITION.md` (schema/data/functor;
  the language is the schema side, the validator is part of the functor/validation).

## Write Scope
Run folder only; plus, on synthesis, an optional convergence section appended to
`research/DESIGN-PACKAGE.md`. No mutation of the validator, Craft, prior runs, or
implementation source.

## Done Criteria
1. A recorded **convergence model decision** (how the two couple) from a bounded
   option set.
2. A **dependency map**: every dependency edge in each direction, the
   artifact/interface that realizes it, and its status (exists / designed / missing).
3. A **circularity / bootstrap resolution**: how the coupled system comes up
   without deadlock (meta-level acyclicity; separated authorities).
4. One **non-executed work pack** sequencing the convergence (what wires first).
5. Updated residue ledger; recommended next routes. No code.

## Validation Surface
- Dispatch validates against `dispatch.schema.yml`.
- Dialectic + toy-game stages carry roles / evidence.
- A toy-game **bootstrap scenario** falsifies the convergence (can a first valid
  spec + first validator run exist without circular dependency?).
- Final synthesis from stage artifacts.

## Planned Stage Configuration
Canonical ten-stage loop at `full` depth; dialectic (circularity skeptic) +
x-ray (dependency mapping) + toy-game (bootstrap falsification) overlays on the
review/distill/repair stages; memory overlay recovers prior decisions.
