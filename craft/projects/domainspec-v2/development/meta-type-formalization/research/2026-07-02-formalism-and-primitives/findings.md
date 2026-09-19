---
node_type: research
is_session: false
status: candidate
created: 2026-07-02
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-02-metatype-formalism-primitives)
final_approver: parent
note: Paths repo-root-relative from domainspec-core/. Freezes the formalism + primitives-first recommendation for meta-type validation.
---

# Meta-type validation: formalism + formal primitives (FROZEN findings)

**Questions.** (1) Should we build a DSL? (2) Define primitives (identity, …) formally first and use the
formal definition to validate field-existence? (3) How — Lean / FOL / SMT?

**Dispatch.** research, 5 agents / 2 tensioned groups, check-tension PASS (first pass).
Returns: [research.md](./research.md). Explorers: [formalism-solver.md](./formalism-solver.md) (Tarski) ·
[formalism-lean.md](./formalism-lean.md) (Curry) · [formalism-minimal.md](./formalism-minimal.md) (Simon).
Verifiers: [verify-decidability.md](./verify-decidability.md) (Gödel) ·
[verify-precedent-moat.md](./verify-precedent-moat.md) (Quine).

## One-line answer
**No DSL, no FOL/SMT/Lean-proof for per-instance meta-type validation.** Validate the criteria with a
**structural `.schema.yml` + a decidable table-walk validator** (build-from-owned: `validate-relationships.ts`).
Define the primitives (identity, …) **as structural schema predicates** — that IS the "formal definition of
identity" ("≥1 field flagged identity", checked by bounded ∃ over the field table). A solver earns its keep
in **exactly one** place — the cross-graph/cross-rule layer — and that is the owned FOL/Cedar Row-2
complement. Anything needing a solver/proof for **meaning** (satisfiability, semantic purity) has left the
public contract and hit the engine moat.

## The layered decision (all 5 agents converged)
| Layer | What | Formalism | Owned provider (build-from-owned) |
|---|---|---|---|
| **Per-concept + per-edge** (identity, field-existence, typedness, edge-signature) | is this a well-formed T? does this edge match its endpoint signature? | **structural `.schema.yml` + table-walk** — decidable bounded ∀/∃, no solver, no proof | `projects/domainspec-v2/impl/tools/validate-relationships.ts` (already does the hardest edge check with parse + `Set.has()`) |
| **P5 boolean-predicate** (Rule Formal → boolean) | is the Formal cell a boolean predicate (Rule) not a strategy (Policy)? | a **return-sort check** — prefer a **declarative `formal_return_type: boolean` key** in the schema over a public inference parser (moat); minimal internal parser only if needed | idiom; Lean soundness proof **deferred** (see below) |
| **Cross-graph / cross-rule** (edge cycles, reachability, cross-rule) | properties a node-local check *provably* can't state | **Datalog / Cedar** (the ONE surviving solver) — quarantined, separate validator, **NOT SMT** | owned FOL/Cedar Row-2 complement + `AgentPermissionKernel.lean` pattern + `governs`/`acyclicity_not_unary` (the owned proof that node-local ≠ cross-edge) |
| **P6 purity / any "meaning" check** | no-effect / valid-non-vacuous predicate | **NOT public-validatable** — sound-not-complete syntactic proxy, or engine / DEFINE-FALSIFIED boundary | boundary discipline only (no positive owner) |

## Direct verdict on DSL / FOL / SMT / Lean
- **DSL — NO.** Over-engineering. The `.schema.yml` + a `formal_return_type` key (+ a minimal internal
  parser if P5 needs one) *is* the minimal criterion language. A full bespoke criterion-DSL is demoted.
- **FOL / Datalog / Cedar — YES, but only the cross-graph/cross-rule layer** (owned Row-2 complement).
  Not for per-instance validation (expressible-but-unnecessary — a table walk dominates).
- **SMT (Z3/cvc5) — NO.** Its natural use is satisfiability/meaning, which approaches the δ-rule moat.
- **Lean — NOT for per-instance validation** (overkill). Its real value: the `deriving DecidableEq` /
  `Decidable`-instance idiom (optional), the owned `acyclicity_not_unary` cross-edge boundary proof, and a
  **deferred** soundness proof for the P5 parser *if* P5 ever becomes a published public-contract artifact
  (build-from-owned head-start via `matchesGlob_iff`, ~1–2 days — but **not proportionate now**: it changes
  zero accept/reject verdicts).

## Primitives-first? (the user's core idea) — YES, lightly
Define identity / field-existence / typedness / edge-signature **as structural predicates in the schema**,
and compose criteria as conjunctions (`isEntity := type==entity ∧ hasIdentity ∧ allTyped`). This *is* using
a formal definition of identity to validate field existence — just at the decidable structural weight, not a
heavyweight dependent-typed formal-primitives program (that's demoted as overkill). Optional Lean `Decidable`
twins only where a soundness bridge later pays.

## Build-from-owned map (Quine verified on disk, sorry=0)
- table-walk floor → `impl/tools/validate-relationships.ts` (verified).
- P5 parser soundness template → `domainspec-lean-formalization/lean-engineer/AgentPermissionKernelGlobSpec.lean` `matchesGlob_iff` (verified).
- cross-graph decidable-relation + boundary proof → `.../cav2-governance/GovernsAcyclicity.lean` `governs` / `acyclicity_not_unary` (verified).
- edge-admissibility / cross-rule pattern → `.../AgentPermissionKernel.lean` `applies:Req→Bool` + `decidePolicy` + deny-precedence.
- **Kernel path (corrected):** the Lean asset is `domainspec-core/domainspec-lean-formalization/` (repo-root-relative `domainspec-lean-formalization/`), NOT a sibling `../` checkout.

## Moat boundary (unanimous, load-bearing)
The public contract validates **shape**, never **meaning**. The moment a criterion needs a solver/proof for
satisfiability, semantic purity, or derivation, it has crossed into the private δ-engine — record it as a
DEFINE-FALSIFIED boundary, do not build a public checker. P5 stays public only while it proves
*parses-to-Bool*, never *predicate-satisfiability*. `formal_return_type` as a declarative key (vs shipping
inference code) is the moat-safest form.

## Residue
- No FOL/SMT/Datalog engine is wired into domainspec-v2 today — the cross-graph layer is a *net-new engine
  binding on an owned pattern*, not a running import (a task-session, when cross-graph checks enter scope).
- Lean cites are read + `sorry`=0 grep, not `lake build`-verified (Gödel/Quine residue).
- The P5 `BoolExpr`/`parseFormal` grammar does not yet exist — the soundness proof is a from-owned *shape*,
  written over a new grammar, deferred until P5 is a published artifact.
- MT0 (Entity) is entirely in the KEEP layer — the recommendation does not change the resolved package plan
  (`.schema.yml` + md + table-walk validator); it *confirms* it and adds the `formal_return_type` key for P5.
