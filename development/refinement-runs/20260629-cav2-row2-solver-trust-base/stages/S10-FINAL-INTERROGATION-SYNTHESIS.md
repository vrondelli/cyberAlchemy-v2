# S10 — Final Interrogation and Refine Synthesis

**Stage:** Interrogation refine-final + Refine-owned synthesis · **status:** pass

## Gate sweep

- **g01 strategy confirmation** — operator confirmed the standard route + tensioned subagents. PASS.
- **g02 dispatch validation** — `REFINE-DISPATCH.json` `VALIDATION=pass`. PASS.
- **g03 anti-bias tension** — check-tension checker PASS + reviewer PASS on re-run (first run reproved an
  axis-label slip; fixed to canonical `methodology`). PASS.
- **g04 toy-game evidence** — Cedar disqualification + staged verdict backed by `S08-TOY-GAME-CAPABILITY-MATRIX.md`. PASS.
- **g05 claim ≤ proof** — no engine KILLed (Cedar disqualified-for-this-check, still a Row-1 helper); two
  caveats carried as residue (R1 Lean files unverified here; R2 PCAS recursive surface); the "now" verdict is
  proven on the bounded witness, the "scale" verdict labeled an extrapolation. PASS.
- **g06 no build in refine** — S09 is a non-executed plan; build is a Task Session next-route. PASS.

## Synthesis (Refine-owned)

The open findings §5d question — "weigh Lean-native first before an external solver" — resolves to a **staged
verdict**, reached by a tensioned dialectic that converged from opposite poles and was adjudicated by a neutral
capability matrix:

- **Now (the §5a witness check): Lean-native.** Single kernel-checked trust base; `reach` decidable on the
  bounded graph; co-located with the lints it must out-decide. Both poles agree.
- **At scale (whole-ruleset Row-2): Datalog (FORGE/PCAS)**, with Alloy/Z3 reserved for Row-2b; second trust base
  acceptable as a differential-tested CI gate.
- **Cedar: disqualified** for acyclicity — it cannot express transitive closure; the "Cedar+Datalog" row survives
  on its Datalog half only.

The load-bearing new finding beyond §5d: the common **"Cedar + Datalog" bundling hides a real expressive split** —
the recursion lives entirely on the Datalog side. That is the one correction this run adds to the accepted findings.

## Recommended next route

**Task Session** on Phase 1 (the Lean-native §5a witness check), gated on Phase 0 (confirm the Lean kernel files
are present + sorry-free). Phase 3 (Datalog scale path) stays deferred until whole-ruleset Row-2 model-finding is
actually needed.
