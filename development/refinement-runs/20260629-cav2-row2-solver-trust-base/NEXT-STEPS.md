# NEXT-STEPS — Row-2 Lean witness + the ladder beyond it

Tracks the build off the Row-2 decision (Lean-native for the §5a witness). Updated 2026-06-29.

## Status ladder (Lean lane)

- **DONE — real-instance witness written + placed.**
  `domainspec-lean-formalization/lean-engineer/cav2-governance/GovernsAcyclicity.lean`
  (separate `[[lean_lib]] GovernsAcyclicity`, OUT of the agentguard kernel `defaultTargets`).
  Non-vacuous unary lints over per-node `(kindInHome, locEnumerated)` data; the witness theorem
  `governs_acyclicity_witness : (∀ n, perRuleLintsPass n) ∧ HasCycle` — a real configuration where
  per-rule-clean ≠ acyclic.
- **DONE — build-verified (2026-06-29).** `lake build GovernsAcyclicity` → `Build completed
  successfully`; `#print axioms governs_acyclicity_witness` = `[propext]` (no `sorryAx`) → genuinely
  sorry-free. One fix on the way: dropped a `deriving Fintype` (no handler in this toolchain; unused).
  Files in the working tree, **uncommitted** (submodule discipline — commit on request).

## NEXT (marked, in order)

1. **DONE — inexpressibility separation (2026-06-29).** `acyclicity_not_unary` in
   `GovernsAcyclicity.lean`: no predicate of the node-data assignment alone can equal acyclicity
   for every `governs` relation, because the cyclic witness and `governsAcyclic` share identical
   `data`. `lake build` ✓; `#print axioms` = `[propext]` (sorry-free). The witness is now backed by
   the universal half, not just the existence half.
2. **Residue-typing (repo discipline).** Escalate from a free-standing graph lemma to an invariant
   typed against `FunctorialResidueStructure` (`lean-formalization/FunctorialResidueStructure.lean`)
   — the repo's "real instance, else metaphor" bar applied to the typed-residue object.
3. **Phase 2 — generalize the fixture.** Replace the 3-node witness with the real `governs` /
   authority edges of the promoted CAV2 set; decide acyclicity over the live constitution graph.
4. **Phase 3 — scale (deferred).** Datalog (FORGE/PCAS) for whole-ruleset Row-2; resolve residue **R2**
   (does PCAS-as-shipped expose a recursive surface). Alloy/Z3 reserved for Row-2b satisfiability.
5. **Deferred — A1–A6 axiom-encoding seam** (FOL findings §5a "then…").

## Parallel lane (assimilation; independent of the above)

- [20260629-assimilation-a1-a2-build](../../../../projects/domainspec-v2/development/refinement-runs/20260629-assimilation-a1-a2-build/RESULT.md):
  build-ready. **SWU-A1** (wire owned validators into a fail-closed PostToolUse hook) then **SWU-A2**
  (concrete-syntax front-end over the owned `formal/` grammar). Both edit the private
  `implementation/domainspec/` submodule (submodule-first commit).
