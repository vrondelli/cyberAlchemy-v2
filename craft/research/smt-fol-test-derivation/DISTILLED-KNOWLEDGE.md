# Distilled Knowledge — SMT/FOL for Deterministic Test Derivation

Status: starter synthesis (source-backed; local-research-only)
Date: 2026-06-21

## The convergent finding

Across the three tensioned research lanes (local-precedent, solver/tooling, decidability-limits), one result holds:

> **The engine's four `Formal`-cell classes all live in *decidable, quantifier-free* fragments — so they are formalizable by construction. Determinism (not solver power) is the binding constraint, which is exactly why the `needs_formal` escape hatch is mandatory, not optional.**

The DomainSpec paper (§9.3) already *states* the ambition (Rule→predicate, taxonomy→model checking, translate to FOL, use SMT to find failure states) but never built it. This tower supplies the missing decidability analysis and a crisp boundary.

## Decidability map (the load-bearing artifact)

| Formal class | SMT theory it maps to | Decidable (QF)? | Engine verdict |
| --- | --- | --- | --- |
| EXISTENCE | EUF + finite-domain membership | yes | fully formalizable |
| PRESENCE | EUF / datatype discrimination (non-null) | yes | fully formalizable |
| RANGE | LIA / LRA (linear arithmetic) | yes (linear); **no** if nonlinear/transcendental | formalizable; nonlinear → `needs_formal` |
| COUNT_CAP | bounded-integer cardinality in LIA | yes (finite/enumerable set); **no** if unbounded/runtime-aggregate | formalizable; runtime-aggregate → `needs_formal` |

**Outside the decidable fence (→ `needs_formal` or implementation oracle):** quantifier alternation; uninterpreted predicate ∩ arithmetic (undecidable with even one unary predicate — arXiv 1703.01212); nonlinear integer arithmetic; any property whose truth is defined by the *running implementation's* behavior rather than a closed decidable formula.

## The needs_formal rule (crisp)

> A `Formal`-cell class is fully formalizable (engine derives/verifies by construction) **iff** its checking obligation is expressible in a **quantifier-free decidable theory** (Boolean + linear arithmetic + EUF/arrays over finite/bounded data) **and** evaluable on data the engine already holds. Otherwise → `needs_formal`.

This is the theoretical justification for the engine's existing `needs_formal` hatch (previously a pragmatic choice; now grounded in decidability theory).

## Bridge decisions (for the engine δ)

| Decision | Verdict | Rationale |
| --- | --- | --- |
| Add an **optional SMT-backed verify/witness mode** (Z3/cvc5) behind a stable interface | **promotion-candidate (defer)** | Buys feasibility checking, boundary/negation witnesses, and cross-cell consistency that pure-syntactic δ cannot — but it is an *optimization inside the decidable fence*, not a δ rewrite. Opt-in only. |
| Widen the spec language to full FOL because "SMT can check it" | **block** | Full FOL validity is undecidable; a deterministic engine cannot terminate on it. The spec language must stay inside the decidable QF fragment. |
| Treat solver `unknown`/timeout as a verdict | **block** | `unknown` is nondeterministic (flips with seed/timeout/version) — it breaks the engine's reproducibility contract. Must fall back to `needs_formal` / syntactic δ, with pinned solver version + seed. |
| Keep `needs_formal` as mandatory escape hatch | **borrow-from-owned (confirm)** | Now theory-backed: it catches exactly the undecidable/oracle cases. |
| Supply the missing `DecidableRel EdgeLaw` (Lean) | **net-new (future)** | GLOSSARY claims EdgeLaw decidable; the Lean instance was removed as circular — a real decision procedure over the finite MetaType set would close it. |

## One-line recommendation for the engine

Keep δ pure-syntactic and deterministic as the default; treat SMT as a **deferred, opt-in verification/witness pass** scoped strictly to the decidable quantifier-free fragment; let the decidability map above *define* the `needs_formal` boundary. Do **not** let "we can call a solver" widen the spec language.

## First-class property: derivation gaps are a spec-formalization metric (2026-06-21)

The decidability boundary above has a corollary that is arguably the engine's headline property — the **dual of its soundness + honesty**:

> The engine derives a test only from a closed, decidable spec expression, and otherwise refuses (`needs_formal` / `coverage_gap`) rather than guessing. Therefore **everything it cannot derive is a precise, mechanical signal that the spec is not formal enough there.**

A sound deterministic deriver that will not fabricate *is, by construction, a spec-completeness analyzer.* The `coverage_gap` count is a **spec-quality metric**. Two lenses:
- **`needs_formal`** = *un-formalized* spec (named, no closed formula) — sits outside the decidable fragment until authored.
- **mutation survivors** (E3) = *under-formalized* spec (formula present but incomplete, e.g. an under-model closed form).

An LLM generator lacks this property: it fabricates a plausible test for the opaque case, **hiding** the gap. The deterministic engine converts spec incompleteness into a visible, counted, actionable signal, and a feedback loop (more formal spec → more derived tests → fewer gaps).

**Empirical witness (2026-06-21):** authoring C4 `applyMakeupPolicy` closed-form (from documented semantics) moved the E3 derived arm 38.75% → 54.37% (makeup-policy 17.2% → 36.56%), derived assertions passing against real code — confirming the gap was *unwritten spec*, not impl divergence. See [E3 results](../../implementation/domainspec/docs/research/results/E3-results.md) and the [computational-obligation track](tracks/computational-obligation-derivation/findings.md).

Honest scope: measures **formalization** completeness (where the spec is formal enough to derive), distinct from coverage-vs-ground-truth recall against an independent gold set — different axes, both needed.
