# Refine Seed Proposal — Plain-Language Business Explanation (Buyer-Facing)

- Run id: `2026-06-08-business-explanation`
- Owner: refine
- Preset: `standard`
- Research mode: `research-if-gap-appears` (local only)
- Status: seed (pre-permission)

## Target
A **plain-language explainer** that lets a non-technical business person — a
prospective **buyer/acquirer** of the system — understand:
1. what the **DomainSpec language** is and why it matters,
2. what the **Lean validator** is and why it matters,
3. how the two **work together**, and
4. how they **ensure and prove** the system works — what the buyer is actually
   getting, in business terms (risk reduction, trust, defensibility).

The explainer must be honest: compelling but not overclaiming, because a buyer's
technical advisor will do due diligence.

## Operator Intent (raw)
> do a local refine so we can explain in plain language to a business person that
> will buy our system how the language and lean validator works, and how they
> ensure and prove the systems works

## Refinement Objective
Translate the accumulated technical design into a buyer-facing narrative + an
assurance story, with a clear separation between **what is proven today**, **what
is designed**, and **what remains human judgment** — so the pitch survives due
diligence.

Deliverables (non-executed; documentation):
- a one-paragraph "what this is" for an executive,
- a plain-language explanation of the language (the "agreement/spec"),
- a plain-language explanation of the Lean validator (the "machine proof-checker"),
- how they converge and depend on each other (the buyer's "two locks" story),
- the **assurance ladder**: what is mathematically proven vs machine-checked vs
  human-judged (honest claims a buyer can rely on),
- an analogy set a non-technical buyer will remember,
- a short FAQ answering a skeptical buyer's hardest questions,
- the value proposition in business terms (what risk this removes).

## Source Context (local, from prior runs)
- `research/DESIGN-PACKAGE.md` (the language).
- Prior runs' decisions: DEC-CAT-01 (categorical model), DEC-FIT-01 (language-fit:
  partial-bridge), DEC-CONV-01 (compiler-pair convergence, acyclic, bootstrap).
- `lean-code-validator/README.md` (σ-model, P1–P5, `gradeFor`, "Lan-faithful not
  full", below-the-wall assumptions).
- CRAFT-INITIAL-DEFINITION (schema/data/functor/residue — the honest "no zero
  residue" stance).

## Write Scope
Run folder only; plus, on synthesis, an optional `EXPLAINER.md` may be offered for
`research/`. No mutation of validator, Craft, prior runs, or source.

## Done Criteria
1. A plain-language EXPLAINER a non-technical buyer can read in 5 minutes.
2. An honest **assurance ladder** (proven / machine-checked / human-judged).
3. A skeptical-buyer FAQ.
4. No overclaim (passes the honesty boundary from prior runs).

## Validation Surface
- Dispatch validates against `dispatch.schema.yml`.
- Dialectic stage (value-advocate vs due-diligence-skeptic) carries roles +
  convergence criteria.
- Final synthesis from stage artifacts; every business claim traceable to a prior
  decision/evidence.

## Planned Stage Configuration
Canonical ten-stage loop at `standard` depth. Dialectic overlay (sell vs honest)
on review/design-review; memory overlay recovers prior decisions to translate.
