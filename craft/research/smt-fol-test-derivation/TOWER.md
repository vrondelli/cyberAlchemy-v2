# SMT / FOL for Deterministic Test Derivation — Tower

Status: active starter tower
Depth: scaffold + bounded local/external population (in progress)
Promotion boundary: local-research-only

## One-Sentence Model

The engine's `Formal` cells are a small fragment of first-order logic; SMT solvers decide satisfiability over such fragments modulo background theories (arithmetic, equality, arrays), which tells us exactly which obligations a deterministic engine can derive/verify by construction and which fall outside a decidable fragment (→ `needs_formal`).

## Layer Model

| Layer | Role | Closure |
| --- | --- | --- |
| L0 corpus | Source inventory (local + bounded external) with evidence labels | in progress |
| L1 residue | Open research questions + tension lanes | seeded |
| L2 closure plan | Bridge decisions back to the engine δ / Formal classifier | pending |
| definitions | Local concepts (FOL fragment, theory, decision procedure, model) | seeded |
| bridge decisions | Borrow / block / promotion candidates for the engine | pending |
| learning pack | Operator-facing summary | pending |

## Main Research Lanes

1. **Local-formalization lane** — what does `domainspec-formalization/` (Lean) + `framework-unification` already establish about the formal semantics of DomainSpec rules/obligations? (local-precedent)
2. **Solver/tooling lane** — how do SMT solvers (Z3, cvc5) and spec→SMT pipelines generate/check tests from FOL-ish specs? (practitioner)
3. **Decidability-limits lane** — which FOL fragments are decidable; where does the engine's classifier hit undecidability and must defer to `needs_formal`? (theory/adversarial)
4. **Bridge lane** — concrete decisions: should the engine gain an optional SMT-backed verification mode, or stay pure-syntactic δ? what does each obligation class map to?

## Governed Dispatch State

A bounded research dispatch (3 tensioned agents: local-harvest + solver/tooling-web + decidability-limits-web) is recorded under [_dispatch/](_dispatch/). Anti-bias axis: local-precedent vs practitioner-optimism vs theory-limits. The operator authorized a limited bounded web pass; the dispatch is registered in the umbrella subagent ledger.

## Closure State

Started and usable for orientation. Not closed for empirical claims or canonical promotion. Feeds the engine's δ design (esp. the `needs_formal` boundary), not the engine code directly.
