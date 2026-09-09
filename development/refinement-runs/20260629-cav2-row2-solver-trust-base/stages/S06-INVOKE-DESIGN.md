# S06 — Invoke Design (dialectic + tournament over the three engines)

**Stage:** Invoke Design · **capability:** invoke · **mode:** design · **pattern:** tournament · **status:** pass

Synthesizes the tensioned pair — `S06-A-LEAN-NATIVE-ADVOCATE.md` (Avigad) ⟂
`S06-B-EXTERNAL-SOLVER-ADVOCATE.md` (Jackson) — adjudicated by the neutral capability matrix
`S08-TOY-GAME-CAPABILITY-MATRIX.md` (de Moura). Anti-bias axis: **methodology** (hand-built-in-Lean vs
pre-built-external-solver), check-tension PASS×2.

## Dialectic outcome — the poles CONVERGED (not a collapse)

Arguing from opposite methodologies, both advocates independently reached the same staged split, each
conceding the other's domain:
- **Avigad (Lean):** Lean-native wins for the *bounded check that must be a first-class theorem*; loses the
  moment Row 2 becomes *finding* a model at whole-ruleset scale → SAT/SMT or Datalog.
- **Jackson (external):** champions **Datalog** (not Alloy/Cedar); concedes Lean-native wins for the isolated
  bounded witness check; external wins for large/unbounded search or a CI-gate dischargeable by differential testing.

Convergence from opposed priors is a *strength* signal: the verdict does not depend on which methodology you favor.

## Tournament scorecard

Legend: ✓ strong · ~ middling · ✗ weak/disqualifying. "Now" = the bounded §5a Gödel-witness check; "Scale" = whole-ruleset Row-2 model-finding.

| Criterion | Lean-native | Cedar (policy) | Datalog (FORGE/PCAS) | Alloy/Kodkod | Z3 |
|---|---|---|---|---|---|
| Transitive-closure expressiveness (hard gate) | ✓ inductive `Reach` | ✗ **no recursion** | ✓ `reach:-` native | ✓ `^r` native | ~ finite/`fp` only |
| Trust base | ✓ single (Lean kernel) | (✓ Lean core, but disqualified) | ✗ second | ✗ second (SAT) | ✗ second (SMT) |
| Decidability/soundness on bounded fixture | ✓ kernel-checked | n/a | ✓ PTIME fixpoint | ✓ complete-in-bound | ✓ finite-model |
| Build cost (first witness) | ~ author `Decidable`/fixpoint | — | ✓ ~free idiom | ✓ ~free `^` | ~ encode finite |
| Maintenance as constitutions grow | ~ hand-built scales awkwardly | — | ✓ already owns Row-2a analyses | ~ | ~ |
| Whole-ruleset model-finding at scale | ✗ `decide` slow/witness-less | ✗ | ✓ tuned fixpoint | ✓ tuned SAT | ✓ tuned SMT |

## Pareto gate

- **Cedar (policy language) — DOMINATED / disqualified.** Fails the hard gate: it cannot *express* `reach`
  (decidability bought by excluding recursion). The "Cedar + Datalog" findings row survives **entirely on its
  Datalog half**. Cedar's only fit is the non-recursive Row-1 policy-comparison, which already collapses to the
  owned Lean decider → no role in this decision.
- **Alloy / Z3 — eligible but dominated for this use.** Both express+decide acyclicity, but they add a SAT/SMT
  trust base *without* owning the surrounding Row-2 analysis surface that Datalog already has. Keep **Alloy in
  reserve** for Row-2b whole-constitution satisfiability if Datalog's recursive surface proves awkward.
- **Non-dominated set: {Lean-native, Datalog}** — split by use, not by preference.

## Design verdict (recomposition) — STAGED

1. **Now — the bounded §5a witness check: Lean-native.** Single, terminal, kernel-checked trust base;
   `reach` is an inductive predicate decidable over `Fin 3`; co-locates the cycle-finding with the C-1..C-3
   lints it must out-decide. The "hand-build the decision procedure" cost is trivial at fixture scale. Both
   poles agree Lean wins here.
2. **At scale — whole-ruleset Row-2 cross-rule analysis: Datalog (FORGE/PCAS).** Recursion/reachability native;
   it already owns contradiction/subsumption/redundancy; the second trust base is acceptable for a CI-gate role
   dischargeable by differential testing. **Alloy/Z3** reserved for Row-2b satisfiability search.
3. **Cedar: not the acyclicity engine.** Drop from this decision except as redundant Row-1 policy-comparison.

This recomposes the open findings §5d question: "weigh Lean-native first" is **confirmed for the first step**,
and the external solver earns its place **only at scale**, where the second trust base is justified — and there
it is **Datalog, not Cedar**.
