# Definitions — SMT/FOL for Deterministic Test Derivation

Local working definitions (candidate; local-research-only).

- **First-order logic (FOL)** — predicates + quantifiers over a domain. Full FOL validity is undecidable (semi-decidable); the engine only needs a small *fragment* of it.
- **FOL fragment (engine-relevant)** — equality + uninterpreted predicates over a *finite* sort of states/events/concepts (closed-world), plus linear arithmetic for numeric bounds. EXISTENCE/PRESENCE need EUF + finite domain; RANGE/COUNT_CAP pull in linear arithmetic.
- **Theory (SMT-LIB sense)** — a fixed interpretation of symbols. Here: EUF (meta-types/entities as uninterpreted sorts, `EdgeLaw` as an uninterpreted predicate) + LIA/LRA (RANGE/COUNT_CAP numeric bounds).
- **Decision procedure** — an algorithm that decides satisfiability in a theory and terminates. The engine's deterministic δ already *is* a bespoke decision procedure over a finite ConceptGraph ("which obligations hold").
- **Model / satisfiability** — a model is a populated instance (copresheaf over 𝓛₁, paper's 𝓜); satisfiability = an instance witnessing a Formal-cell predicate. SMT goal: is the "failure-state" set empty (UNSAT ⇒ taxonomy complete vs Γ).
- **Decidable (quantifier-free) fragment** — the region where a solver/δ is guaranteed to terminate with sat/unsat: Boolean SAT, QF-LIA (Presburger), QF-LRA, EUF, arrays, bitvectors, datatypes, bounded/finite quantification.
- **needs_formal** — the engine's escape hatch: a Formal cell whose obligation falls OUTSIDE the decidable QF fragment (quantifier alternation, nonlinear arithmetic, uninterpreted-predicate ∩ arithmetic, or implementation-defined truth) — flagged, counted, never guessed.
- **Determinism constraint** — the engine must terminate with a definite verdict on every input; therefore it may only rely on decidable fragments, and solver `unknown` is not a verdict.
