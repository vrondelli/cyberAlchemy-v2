# Distill Repair — Toy-Game Outcome + Honesty Repairs (s8)

Stage: s8 · Capability: distill (validate/repair). Input: the round-2 toy-game
(`TOYGAME-FALSIFICATION.md`, same folder) and design-review
(`../s7-interrogation/DESIGN-REVIEW.md`). Verdict: **flag → repaired to pass**
with guardrails that the work pack must honor.

## Toy-game result (against FaultInject.lean template)
| Fault | Injected | Expected verdict TODAY | Proves |
|---|---|---|---|
| A | σ-violating edge (bad Meta×EdgeType×Meta) | **does not compile** (`EdgeRow.wellTyped` cannot be constructed) | typing is real/proved |
| B | cycle in codegen-dependency subgraph | **P5 fail** | acyclicity check is real |
| C | unresolved reference | **P1 fail** | closure check is real |
| D | M6 ambiguity (two declared edges, same role) | **witness non-empty BUT grade = pass** (P4 stub) | **the gap** — residue detected, not governed |

Faults A–C demonstrate the validator **rejects** non-functorial lifts today.
Fault D is the load-bearing negative result: the abstraction's residue story is
**not yet operational** because P4 is a stub and provenance is hardcoded.

## The falsifier (must be designed around)
> Shipping the "governed residue" / "fidelity established" claim **ahead of P4 +
> per-edge provenance landing** IS the falsifier. A `pass` narrated as
> "functorial" while an M6 witness / cycle / unresolved ref exists kills the
> Stage-B claim.

## Repairs adopted (carry into PLAN)
- **G1.** Never write "residue = η-not-iso, witnessed today" as one claim. Split
  witness (real) / grade (stubbed) / characterization (conjectural) everywhere.
- **G2.** Tag every residue statement three ways: witness-real, grade-stubbed,
  attribution-absent. Keep **R-determinism OPEN** until provenance is populated.
- **G3.** Hold the decidability line (proved theorem vs `#eval` vs undecidable);
  do not call commutativity a "functor obligation" until path equations exist in
  the `Spec` record.
- **Sequencing repair.** The smallest *honest* provable surface is **P4 + per-edge
  provenance first** — only then does any residue/governance claim become true.
  T's mapping and Stage-B narrative come after the witness can govern.

## Residue ledger (updated)
- R-honesty (open): claims stay operational+formal; Lan/M6-graph theorem is conjecture.
- R-stub (open): P3, P4 stubbed; Stage A floor = P1∧P5 only.
- R-determinism (open): T determinism asserted; not provable as codegen-attributable
  until provenance split is real.
- R-undecidable (named): general path-equation commutativity is out of scope; only
  finite-confluent relation sets are decidable.
- R-translator-absent (named): no code→Spec translator exists in-repo today; T is
  net-new (the `audit_richness.py` dual is absent from this tree).
