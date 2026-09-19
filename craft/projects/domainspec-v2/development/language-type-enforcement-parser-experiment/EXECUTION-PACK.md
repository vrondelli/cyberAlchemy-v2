---
module: language-type-enforcement-parser-experiment
feature_code: LTE
status: planned
updatedAt: 2026-07-17
docType: execution-pack
authority: non-authority execution choreography
---

# Execution Pack: Language Type-Enforcement Parser Experiment

## Planning Control Fields

| Field | Value |
| --- | --- |
| planningGateStatus | `pass` — plan Distill reconciled |
| complexity | `medium` |
| baselineWave | [W0](work-pack/waves/W0-L0-FOUNDATION.md) |
| activePlanRef | [WORK-PACK.md](WORK-PACK.md) |
| workPackManifest | [WORK-PACK.md](WORK-PACK.md) |
| layeringArtifact | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| specRef | `n/a` — the approved experiment architecture is the execution contract |
| activeLayerWindow | `L0` |
| lastPlannedAt | `2026-07-17` |
| readinessProfile | `pilot` |

## Wave Board

| Wave | Layer | Goal | Tasks/SWUs | Entry gate | Exit evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0-L0-FOUNDATION.md) | L0 | Establish pure, buildable discriminator contract. | TASK-LTE-01 / SWU-LTE-001 | design Distill pass; dirty-overlap preflight | focused grammar tests, typechecks, build | selected; not-started |
| [W1](work-pack/waves/W1-L0-CONSUMER-PARITY.md) | L0 | Integrate both consumers and close exact-cause parity. | TASK-LTE-02/03, VERIFY / SWU-LTE-002/003 | W0 receipt pass | eight-case consumer parity, three-pack equality, full validation receipt | blocked by W0 |

## Choreography

Only one SWU runs at a time. The coordinator updates Work Pack/task state after
each receipt, rechecks overlapping dirty files, and selects the next SWU only
when its dependencies pass. W1 tasks are serial because SWU-LTE-003 tests the
content adapter produced by SWU-LTE-002. TASK-LTE-VERIFY is closure-only and
cannot repair implementation failures.

Coordinator state and receipt writes are limited to the boundary in
[WORK-PACK.md](WORK-PACK.md#coordinator-synchronization-boundary); they are not
part of a worker's source write scope.

## Layer Coverage

Both waves remain inside L0. L1-L3 are explicitly decision-gated in
[IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md); this execution pack
must not schedule them from preference.

## Closure Obligation

L0 closes only when the final receipt records:

- the eight mutation-to-code/subject/detail rows for both consumer surfaces;
- positive declaration/count/downstream equality for sample,
  financial-settlement, and agent-execution-orchestrator;
- the accounting invariant;
- root/engine typecheck and engine build;
- focused and relevant full-suite results; and
- all remaining residue with owners.

The current `tools:test` 99/101 baseline is LTE-G6. W0 may proceed because its
focused scope is independent, but W1 closure cannot report L0 pass until the
separate guard owner restores or explicitly adjudicates that baseline.
