# View 05 — Reflection / measurement

> Parent: [`../MAP.md`](../MAP.md). Axis: does the system *measure* whether it
> improves, or only describe that it should?

## EVIDENCE (owned, anchored)

- **"Documentary, not measured" — owned by TO-VLAD.** `Arcanum/TO-VLAD/TO-VLAD.md`
  finding #3: `tier` is recorded but no telemetry answers *"does climbing tier
  reduce `workflow_gaps` per intent?"*; **reflection fires on activity count, not
  residue.** `TO-VLAD4.md` finding #2 raises it to method altitude: 52 docs
  describing a 6-phase method with **zero clean engine-validated loops** (the one
  full pass was a false pass, retracted via `CRAFT-RECEIPT-001`).
- **The grading-oracle disconnect — owned by TO-VLAD3.** `benchmark/` is a working
  scalar oracle (`speedupVsBaseline`, numeric thresholds) but grades *external*
  coding agents and is sigil-blind; the sigil reflection loop emits only categorical
  signals + human-read proposals. **The gap is the wire between them, not a missing
  layer.** The hard part is the reward surface (external-grader vs self-defined
  denominator); the one genuine residue: *a sigil must not author the surface it is
  graded on* (TO-VLAD3 finding #3).
- **domainspec owns a quantitative spine.** The `predict` skill (Brier-scored wager
  journal) + the typed-residue program give a measurement substrate Arcanum's
  activity-count reflection lacks.

## INFERENCE / SEAM (partly owned)

- **Claim:** Brier-scored forecasts ("will this sigil survive validation?") + a
  residue-keyed reflection counter give the reflection loop a measured spine instead
  of an activity count.
- **Seam:** the wire from oracle → loop (TO-VLAD3) and the shift of the reflection
  trigger from activity-count → residue (TO-VLAD1) are both **open work**. Measuring
  on residue depends on **View 01** (residue must be typed before you can count it).
- **Collapse-test:** if the only available grader is self-authored by the sigil, the
  measurement is circular (TO-VLAD3 finding #3) — the loop must route to an external
  grader (held-out fixture or the `benchmark/` oracle) or it contributes nothing.

## STATUS

**PARTLY OWNED.** Diagnosis owned by TO-VLAD1/3/4; the quantitative substrate
(`predict`, typed residue) exists in domainspec; the wire is unbuilt and is
**downstream of View 01**.

## ROUTE

Blocked on View 01 (cannot reflect-on-residue before residue is typed). Independent
sub-step available now: wire one sigil with an *external* grader (TO-VLAD3's
`context-builder` + held-out fixture) to prove the oracle→loop wire.
