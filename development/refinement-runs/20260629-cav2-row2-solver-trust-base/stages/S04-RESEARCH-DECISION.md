# S04 — Research decision

**Stage:** Research decision · **owner:** refine · **mode:** research-if-gap-appears · **status:** pass

## Named gap (from S03 flag)

Criterion 2 (transitive-closure expressiveness per engine) is unverified: does Cedar lack recursion? are
Lean's bounded-`decide` ergonomics acceptable? are Datalog/Alloy's native closures a clean fit?

## Decision: NO external research; resolve locally via the toy-game falsifier

Rationale:
- The external precedent is **already owned and auditor-verified** in the accepted FOL findings: Cedar
  (arXiv 2403.04651, Lean-verified, decidable SMT fragment), FORGE/PCAS Datalog⁻ (arXiv 2602.16708,
  recursion/reachability), Alloy/Kodkod + Z3 (findings Row-2b). No new external sweep is warranted.
- The remaining gap is an **expressiveness capability question**, not a literature question — best settled by
  the neutral toy-game falsifier (de Moura) reasoning over the Gödel-witness fixture using owned knowledge.

External research cannot override local repository evidence; none is invoked. Confirmation status: not
required (default mode, no external pass).
