# Refine Result

- **Target:** `cyberAlchemy-v2` — the Row-2 constitution-validation engine / trust-base decision
- **Status:** pass
- **Preset:** standard
- **Research:** research-if-gap-appears (no external pass; expressiveness gap resolved locally by the toy-game falsifier)
- **Run manifest:** [RUN-MANIFEST.md](RUN-MANIFEST.md)
- **Evidence index:** [evidence-index.json](evidence-index.json)
- **Seed proposal:** [REFINE-SEED-PROPOSAL.md](REFINE-SEED-PROPOSAL.md)
- **Dispatch route:** [REFINE-DISPATCH.json](REFINE-DISPATCH.json) — `VALIDATION=pass`
- **Dispatch strategy:** overlays `baseline_sequence` + `route_menu_for_engine_choice` + `dialectic_for_trust_base_tension` + `tournament_for_engine_alternatives` + `toy_game_for_acyclicity_falsification`; subagent_strategy `recommended`, authorization `approved`; roles lean-native-advocate ⟂ external-solver-advocate (+ neutral toy-game-falsifier); join policy `parent_synthesis`; anti-bias gate check-tension PASS×2 (axis: methodology)
- **Runtime handoff:** [RUNTIME-HANDOFF.md](RUNTIME-HANDOFF.md)
- **Stage evidence:**
  - Context Builder evidence baseline: pass
  - Invoke Define: pass
  - Interrogation refine-review: pass (1 flag → research decision)
  - Research decision: pass (no external; toy-game resolves the gap)
  - Distill: pass
  - Invoke Redefine / Design: pass (dialectic converged; tournament + Pareto)
  - Interrogation refine-design-review: pass (2 caveats → repair)
  - Distill Repair: pass (toy-game validated; residue carried)
  - Invoke Plan: pass (non-executed, 3 phases)
  - Final Interrogation and Synthesis: pass

## Final synthesis — the verdict

The open question from the accepted FOL dispatch (findings §5d, "weigh Lean-native first before an external
solver") resolves to a **STAGED verdict**, reached by a tensioned dialectic that **converged from opposite poles**
and was adjudicated by a neutral capability matrix on the Gödel-witness acyclicity fixture:

| Horizon | Engine | Trust base | Why |
|---|---|---|---|
| **Now** — the §5a bounded `governs`-acyclicity + CAV2-C13 witness check | **Lean-native** | single (kernel) | `reach` decidable on the bounded graph; kernel-checked; co-located with the C-1..C-3 lints it must out-decide; both poles agree |
| **At scale** — whole-ruleset Row-2 cross-rule analysis | **Datalog (FORGE/PCAS)** | second (CI gate, differential-tested) | recursion/reachability native; already owns contradiction/subsumption/redundancy |
| Row-2b whole-constitution satisfiability (reserve) | **Alloy/Kodkod** or Z3 | second | native `^r` / bounded SAT; held in reserve |
| acyclicity | **Cedar — DISQUALIFIED** | (Lean core, moot) | cannot express transitive closure; "Cedar+Datalog" row survives on its Datalog half only |

**The one correction this run adds to the accepted findings:** the common **"Cedar + Datalog" bundling hides a
real expressive split** — recursion lives entirely on the Datalog side; crediting Cedar with `reach` is an error.

**Carried caveats (claim ≤ proof):** R1 — **RESOLVED 2026-06-29** (see [stages/S11](stages/S11-VERIFICATION-R1-LEAN-FILES.md)):
the owned Lean files live in the separate repo `domainspec-lean-formalization/` (branch `main`, under
`lean-engineer/`/`lean-formalization/`), not under `implementation/domainspec/` where the agents looked. Verified
first-hand: cited symbols at cited lines (incl. Row-2 template `decidePolicy_flatten_meet`@98), `sorry`=0/`admit`=0,
buildable lake project — so the Lean-native verdict is now first-hand grounded (no existing TC code in-kernel, so
`reach` is still authored, Mathlib `Relation.ReflTransGen` off-the-shelf). R2 — recursive Datalog does `reach` trivially, but whether PCAS-as-shipped exposes a recursive
reachability surface is unconfirmed (Phase 3 precondition).

## Recommended next routes

- **Task Session** on Plan Phase 1 (the Lean-native §5a witness check), gated on Phase 0 (confirm Lean kernel
  files present + sorry-free). — *the one buildable, value-before-theory move; enforces CAV2-C13's own acyclicity.*
- Defer Phase 3 (Datalog scale path) until whole-ruleset Row-2 model-finding is actually needed.
- Deferred (separate): the A1–A6 axiom-encoding seam (findings §5a "then…").
