# Residue — Open Research Questions

Status: seeded 2026-06-21 (local-research-only)

## Open questions (named gaps)

- **OQ-1 SMT-LIB logic choice** — which named logic for the four classes? Candidate: `QF_UFLIA` (EUF + linear int arith) covers EXISTENCE/PRESENCE/RANGE/COUNT_CAP. Confirm against cvc5/Z3 support. (gap: paper says "such as FOL" and stops.)
- **OQ-2 Denotational semantics not written** — Entity→LTS, Rule→predicate, Calculation→pure function are *named* in paper §9.3, never defined. Writing them is the prerequisite for any real compile-to-SMT.
- **OQ-3 Encoding pattern** — how does a ConceptGraph + Δ compile to SMT assertions concretely? No local precedent; design needed before an opt-in solver mode.
- **OQ-4 `DecidableRel EdgeLaw`** — GLOSSARY claims EdgeLaw decidable; the Lean instance was removed as circular. Can a real decision procedure over the finite MetaType set be supplied? (net-new)
- **OQ-5 Spivak migration ↔ SMT** — the Lean has Σ⊣Δ*⊣Π functorial migration; nobody bridges it to solver-based model finding. Is there a useful connection or is it orthogonal?
- **OQ-6 Determinism under solvers** — empirically, do pinned Z3/cvc5 (fixed version+seed) give byte-stable witnesses across machines? Required before any SMT mode could feed the deterministic engine.

## Tension lanes (anti-bias residue from the dispatch)

- **practitioner-optimism (A2)** "add an SMT verify/witness mode — it buys feasibility + boundary witnesses" **vs theory-limits (A3)** "determinism, not solver power, is binding; unknown breaks reproducibility; don't widen the spec language." → resolved in DISTILLED-KNOWLEDGE as: opt-in mode strictly inside the decidable QF fence.
- **local-precedent (A1)** "the ambition is stated but unbuilt; δ is already a finite decision procedure" — keeps the work grounded: this is hardening an existing deterministic δ, not importing a solver wholesale.
