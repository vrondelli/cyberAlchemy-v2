# RUN-MANIFEST — 20260629-cav2-row2-solver-trust-base

- **target:** `cyberAlchemy-v2` — Row-2 constitution-validation engine / trust-base decision
- **preset:** standard · **research:** research-if-gap-appears (no external pass)
- **status:** pass
- **dispatch validation:** `REFINE-DISPATCH.json` → `VALIDATION=pass` (repo-local dispatch-spec validator)
- **anti-bias gate:** check-tension checker PASS + reviewer PASS (re-run; first run reproved an axis-label slip, fixed to canonical `methodology`)
- **subagent dispatch:** `20260629-cav2-row2-solver-engine-dialectic` (ledger: `telemetry/agents/subagents-dispatch.yaml`) — 3 agents (Avigad ⟂ Jackson dialectic + de Moura neutral falsifier)

## Verdict (STAGED)

| Horizon | Engine | Trust base |
|---|---|---|
| Now — §5a bounded acyclicity witness check | **Lean-native** | single (kernel) |
| At scale — whole-ruleset Row-2 | **Datalog (FORGE/PCAS)** | second (CI gate) |
| Row-2b satisfiability (reserve) | Alloy/Kodkod or Z3 | second |
| acyclicity | Cedar — **disqualified** (no recursion) | — |

New correction to the accepted findings: the "Cedar + Datalog" bundling hides a real expressive split — recursion is entirely Datalog's.

## Stage ledger

| # | Stage | Capability | Artifact | Status |
|---|---|---|---|---|
| s01 | Context baseline | context-builder | [stages/S01-CONTEXT-BUILDER.md](stages/S01-CONTEXT-BUILDER.md) | pass |
| s02 | Invoke Define | invoke | [stages/S02-INVOKE-DEFINE.md](stages/S02-INVOKE-DEFINE.md) | pass |
| s03 | Interrogation refine-review | interrogation | [stages/S03-INTERROGATION-REFINE-REVIEW.md](stages/S03-INTERROGATION-REFINE-REVIEW.md) | pass (1 flag) |
| s04 | Research decision | refine | [stages/S04-RESEARCH-DECISION.md](stages/S04-RESEARCH-DECISION.md) | pass |
| s05 | Distill decision unit | distill | [stages/S05-DISTILL-DECISION-UNIT.md](stages/S05-DISTILL-DECISION-UNIT.md) | pass |
| s06 | Invoke Design (dialectic+tournament) | invoke | [stages/S06-INVOKE-DESIGN.md](stages/S06-INVOKE-DESIGN.md) | pass |
| · | ↳ Lean-native advocate (subagent) | — | [stages/S06-A-LEAN-NATIVE-ADVOCATE.md](stages/S06-A-LEAN-NATIVE-ADVOCATE.md) | pass |
| · | ↳ External-solver advocate (subagent) | — | [stages/S06-B-EXTERNAL-SOLVER-ADVOCATE.md](stages/S06-B-EXTERNAL-SOLVER-ADVOCATE.md) | pass |
| s07 | Interrogation design-review | interrogation | [stages/S07-INTERROGATION-DESIGN-REVIEW.md](stages/S07-INTERROGATION-DESIGN-REVIEW.md) | pass (2 caveats) |
| s08 | Distill Repair (toy-game validated) | distill | [stages/S08-DISTILL-REPAIR.md](stages/S08-DISTILL-REPAIR.md) | pass |
| · | ↳ Toy-game capability matrix (subagent) | — | [stages/S08-TOY-GAME-CAPABILITY-MATRIX.md](stages/S08-TOY-GAME-CAPABILITY-MATRIX.md) | pass |
| s09 | Invoke Plan (non-executed) | invoke | [stages/S09-INVOKE-PLAN.md](stages/S09-INVOKE-PLAN.md) | pass |
| s10 | Final interrogation + synthesis | interrogation | [stages/S10-FINAL-INTERROGATION-SYNTHESIS.md](stages/S10-FINAL-INTERROGATION-SYNTHESIS.md) · [RESULT.md](RESULT.md) | pass |

## Residue (carried)

- R1 — **RESOLVED 2026-06-29** (see [stages/S11](stages/S11-VERIFICATION-R1-LEAN-FILES.md)): files found in `domainspec-lean-formalization/` (`main`), verified present, cited symbols at cited lines, `sorry`=0/`admit`=0, buildable lake project. Phase 0 satisfied.
- R2 — PCAS recursive reachability surface unconfirmed; Phase 3 precondition.
- R3 — "now" verdict proven on the bounded witness; "scale" verdict is a reasoned extrapolation.

## Recommended next route

Task Session on Plan Phase 1 (Lean-native §5a witness check), gated on Phase 0. Defer the Datalog scale path.
