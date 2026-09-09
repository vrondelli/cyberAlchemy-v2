# S08 — Distill Repair (toy-game-validated)

**Stage:** Distill Repair · **capability:** distill · **mode:** validate · **status:** pass
**Evidence artifact:** `S08-TOY-GAME-CAPABILITY-MATRIX.md` (de Moura, neutral falsifier)

## What the toy game validated

The Gödel-witness fixture (3-node `governs` cycle, each node lint-clean) tested the hard gate — can the engine
EXPRESS + DECIDE `reach(X,X)`. Result: **Cedar ruled out** (no recursion); **Lean-native, Datalog, Alloy, Z3
eligible**. The design's disqualification of Cedar and its staged Lean-then-Datalog verdict are **backed by the
matrix**, not asserted. Gate g04 (toy-game evidence) satisfied.

## Repaired decision unit

> **Now:** Lean-native runs the bounded §5a `governs`-acyclicity + CAV2-C13 witness check (single trust base).
> **At scale:** Datalog (FORGE/PCAS) runs whole-ruleset Row-2 cross-rule analysis; Alloy/Z3 reserved for Row-2b.
> **Cedar:** disqualified for acyclicity; redundant Row-1 helper only.

## Residue ledger (carried, not dropped)

1. **R1 — owned-Lean-template not verified in this tree.** `decidePolicy_flatten_meet` / `AgentPermissionKernel*.lean`
   are cited from the accepted findings + Bourbaki audit, not re-run here (files not checked out). The Lean-native
   plan must FIRST confirm the kernel files are present and sorry-free before reusing them as a template.
2. **R2 — PCAS recursive surface unconfirmed.** Recursive Datalog trivially does `reach`; whether PCAS-as-shipped
   exposes a recursive reachability predicate (vs only non-recursive Datalog⁻ analyses) is a tool-surface question
   for the scale phase, not the first step.
3. **R3 — fixture-scale caveat.** The verdict for "now" is proven on the bounded witness; the "scale" recommendation
   is a reasoned extrapolation, to be re-tested when whole-ruleset model-finding is actually built.

These are preconditions/notes for S09, not blockers of the decision.
