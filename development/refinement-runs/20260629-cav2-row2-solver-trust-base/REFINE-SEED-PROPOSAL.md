# Refine Seed Proposal — Row-2 solver trust-base decision

- **run_id:** 20260629-cav2-row2-solver-trust-base
- **target:** `cyberAlchemy-v2` authority spine — the Row-2 constitution-validation engine choice
- **operator_sentence:** "refine: Lean-native finite-model search (single trust base) vs Cedar/Datalog (SMT, Lean-verified core) vs Alloy/Z3 (separate trust base)"
- **preset:** standard
- **research_mode:** research-if-gap-appears

## Source context (owned, cited)

The decision sits on top of the already-accepted dispatch
[2026-06-28-constitution-fol-validation-path/findings.md](../../research/2026-06-28-constitution-fol-validation-path/findings.md)
(final_approver Bourbaki, accepted 2026-06-28). That dispatch resolved that formal validation of cav2
constitutions is a **build-from-owned COMPLEMENT bounded to Row 2** (cross-rule consistency /
whole-constitution satisfiability), and §5(b)/§5(d) left exactly one decision open:

> "Even Row 2 should first be weighed against doing the finite-model search **in Lean** (single trust
> base) before reaching for an external solver."

This refine run resolves that open decision and produces a non-executed build plan for the §5(a)
first step (the Gödel-witness `governs`-acyclicity + CAV2-C13 cross-rule check).

## The three options under refinement

| Option | Engine | Trust base | Headline tradeoff |
|---|---|---|---|
| A | **Lean-native** finite-model / bounded `decide` | single (the kernel already in Lean) | no second foundation; you hand-build `reach`/bounded search |
| B | **Cedar + Datalog** (FORGE/PCAS) | Cedar's verified core is itself Lean → shares trust base | Datalog gives recursion/reachability; Cedar gives decidable policy-comparison |
| C | **Alloy/Kodkod or Z3** | separate (SAT/SMT) | native transitive closure (`^r`), mature bounded model-finding; second foundation |

## The decisive discriminator (to be tested, not assumed)

Acyclicity is a **transitive-closure / recursive** predicate (`reach(X,X)`). The candidate engines differ
on whether they can even *express* it: Cedar policies generally cannot (no recursion); Datalog and Alloy
can natively; Lean can define it inductively and `decide` on a bounded graph. The toy-game falsification
(the Gödel witness, a 3-node `C2→C13→C4→C2` cycle each individually lint-clean) is the empirical test that
adjudicates A vs B vs C — claim ≤ proof, do not pre-decide.

## Write scope

- Owned: this run folder only (`cyberAlchemy-v2/development/refinement-runs/20260629-cav2-row2-solver-trust-base/`).
- Read-only authority inputs: the FOL findings, the per-rule validator SPEC, CAV2-C13, the cited Lean kernel files.
- NOT in scope: building the solver (a Task Session next-route); the A1–A6 axiom-encoding seam (deferred per findings §5a).

## Done criteria

1. A single owning verdict: which engine (or staged combination) runs the Row-2 search, with explicit criteria.
2. The transitive-closure discriminator tested against the Gödel witness fixture (capability matrix).
3. A non-executed build plan for the §5(a) first step in the chosen engine.
4. Claim ≤ proof throughout; the recommendation does not exceed what the toy-game evidence sustains.

## Validation surface

- `REFINE-DISPATCH.json` validates against the repo-local dispatch-spec validator before any stage runs.
- Tensioned subagent decision work passes the subagents-strategy discipline (anti-bias axis + predicted disagreement recorded; operator confirmed the tensioned shape at the strategy gate).
- Every stage records an artifact path or a blocked reason.
