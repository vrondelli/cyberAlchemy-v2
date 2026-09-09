# S02 — Invoke Define

**Stage:** Invoke Define · **capability:** invoke · **mode:** define · **status:** pass

## Definition of the decision

**Decide:** which engine runs the bounded Row-2 search (cross-rule consistency + whole-constitution
satisfiability), expressed first on the Gödel-witness acyclicity check, and name its trust base.

## Decision criteria (the tournament scorecard)

1. **Trust base** — does it add a second foundation, or reuse the Lean kernel's? (single is better, all else equal)
2. **Transitive-closure expressiveness** — can it state+decide `reach(X,X)` acyclicity? (hard gate)
3. **Decidability / soundness** — is the check decidable with a sound/complete result on the bounded domain?
4. **Build cost** — effort to stand up the first witness check.
5. **Maintenance** — ongoing cost as constitutions grow (new rules, new edge types).
6. **Whole-ruleset performance** — search behavior as the constitution set scales.

## Non-goals (explicit)

- Not building the solver (non-executed plan only).
- Not the A1–A6 axiom-encoding seam (deferred per findings §5a).
- Not Row 1 (owned in Lean, a solver here is a relabel) or Row 3 (categorical-only, solver-blind).

## Owned vocabulary

Row-2 obligation, `∃state.⋀ᵢ` non-distributivity, `reach`/transitive closure, trust base, build-from-owned,
toy-game falsification, claim ≤ proof.
