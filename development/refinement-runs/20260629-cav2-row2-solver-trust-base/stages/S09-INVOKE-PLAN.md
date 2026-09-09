# S09 — Invoke Plan (NON-EXECUTED)

**Stage:** Invoke Plan · **capability:** invoke · **mode:** plan · **status:** pass
**Scope:** a non-executed build plan for the §5a first step in the selected engine (Lean-native), plus the
deferred scale path (Datalog). Building is a **Task Session next-route**, not part of this refine run (gate g06).

## Phase 0 — Precondition — SATISFIED 2026-06-29 (closes residue R1; see stages/S11)

- The owned Lean files are present + verified in `domainspec-lean-formalization/` (branch `main`), under
  `lean-engineer/` (`AgentPermissionKernel.lean`, `AgentPermissionKernelAlgebra.lean` — `decidePolicy_sound`@162,
  `decidePolicy_flatten_meet`@98, `deny_precedence`@170, `layered_not_flattenable`) and `lean-formalization/`
  (`count_blind_agrees`@258). **`sorry`=0, `admit`=0**; `#print axioms` self-audits present. `lean-engineer/` is a
  buildable lake project (`lean-toolchain` + `lakefile.toml`).
- **Build target:** Phase 1 lands in `domainspec-lean-formalization/lean-engineer/` and is `lake build`-checked there
  (NOT under `implementation/domainspec/`). Note: no existing TC code in-kernel — author `reach` via Mathlib
  `Relation.ReflTransGen` (off-the-shelf, not from scratch).

## Phase 1 — The §5a witness check, Lean-native (the deliverable)

1. Model the fixture: `Node := Fin 3` (`C2, C13, C4`), `governs : Node → Node → Prop` with the 3 cyclic edges.
2. Define `inductive Reach : Node → Node → Prop` (base + step) — transitive closure of `governs`.
3. Provide `Decidable (Reach a b)` via a bounded fixpoint (fuel = |Node|) or reduce `∃ x, Reach x x` to
   `Finset.decidableExists` over `Finset.univ`.
4. Encode CAV2-C13's reviewed-exception guard (acyclicity REQUIRED unless a contextuality-obstruction review
   records an explicit exception) as a side condition on the edge predicate.
5. **Theorem (the witness):** `∃ x, Reach x x` holds on the fixture (cycle caught) AND the per-rule lints
   C-1..C-3 all pass on the same nodes — i.e. the Lean check BLOCKS exactly the cycle the per-rule validator
   passes. Close by `decide` (kernel-checked).
- **Acceptance:** the theorem type-checks sorry-free; `#print axioms` shows no new axioms; the check is a
  first-class Lean theorem in the same trust base as `decidePolicy_sound`.

## Phase 2 — Generalize from fixture to the real `governs` edges

- Extract the actual `governs` / authority-transition edges from the promoted CAV2 constitution set into the
  Lean model (bounded: the constitution graph is finite and small).
- Run the acyclicity decision over the real graph; surface any real cycle CAV2-C13 mandates against.
- **Acceptance:** a deterministic, kernel-checked acyclicity verdict over the live constitution edges.

## Phase 3 — Scale path, DEFERRED (Datalog; closes residue R2 when taken)

- When whole-ruleset Row-2 model-finding (beyond acyclicity) is needed, stand up Datalog (FORGE/PCAS) recursive
  `reach(X,Y) :- governs(X,Y); reach(X,Y) :- governs(X,Z), reach(Z,Y)`.
- **Precondition:** confirm the PCAS-as-shipped surface exposes *recursive* reachability (vs only non-recursive
  Datalog⁻ analyses); if not, invoke recursive Datalog evaluation directly.
- **Trust-base discipline:** the second (SAT/SMT/Datalog) trust base is a CI gate, anchored by differential
  testing against the Lean result on overlapping fixtures. Alloy/Z3 are the reserve for Row-2b satisfiability.

## Explicitly out of scope

- Building any of the above (non-executed plan only).
- The A1–A6 axiom-encoding seam (separate, deferred per findings §5a "then…").
- Row 1 (owned Lean decider) and Row 3 (categorical-only, solver-blind).
