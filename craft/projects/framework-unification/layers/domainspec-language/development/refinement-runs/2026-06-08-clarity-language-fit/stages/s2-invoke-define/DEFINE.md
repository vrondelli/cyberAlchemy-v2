# Invoke Define — Clarity + Language Fit (s2)

Two questions, framed precisely so the loop can answer them.

## Q1 — "What is not clear in the refining?"
Not "what is wrong" but "what remains under-determined" in the prior
lean-functor-validation design. A clarity gap is a place where the design has a
name but not yet a decidable definition, a decision but not a ratification, a
claim but not a proof, or a scope edge that was deferred. Each gap must be typed
and owned, not just listed:
- **type** ∈ {definition-gap, decision-gap, decidability-gap, scope-gap, evidence-gap}
- **owner** ∈ {Lean-provable, human-only (above Intent Wall), deferred, blocked-on-B1}

## Q2 — "If our DomainSpec language helps in this."
The sharp version: **is the DomainSpec language (DESIGN-PACKAGE: contract/schema/
iteration, 5 doc kinds, canonical envelope, obligations, anti-collapse, lifecycle)
load-bearing for the categorical verification pipeline, or is the validator's
σ-model (`Meta`/`EdgeType`/`sigmaValid`/`EdgeRow`) already carrying the weight
on its own?**

Three candidate answers (route menu): load-bearing / incidental / partial-bridge.
The verdict must name the **bridge condition**: what must be true for the language
to be load-bearing, and whether it holds today.

## Why this matters
If the language is incidental, the categorical effort can proceed on the σ-model
alone and the DESIGN-PACKAGE is a separate doc project. If it is load-bearing or
partial, then resolving the language (esp. blocker B-1 `obligation_id`s) is on
the critical path for Stage A/B — which changes the prior run's PLAN ordering.

## Inputs
Prior run RESULT + stages (U1–U4, DEC-CAT-01, P3/P4 stubs, B-1, R-determinism,
undecidability line, Intent Wall); DESIGN-PACKAGE; the σ-model.
