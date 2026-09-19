---
artifact_id: CDSC3-SWU005-CONTEXT-v1
artifact_role: session-evidence
task: SWU-CDSC3-005
mode: lean
strict_coverage: pass
created_at: 2026-07-12T18:54:00Z
---

# SWU-CDSC3-005 Context Pack

## Summary

- Files selected: 8.
- Obligation coverage: 100 percent.
- Decisions/blockers: none.
- Representation bridge: guard-selected destination is the baseline committed
  step; it is recorded separately from the mutant committed step in a
  target-comparison sidecar.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Bind exact runtime/source/target/baseline/permitted handles. | SWU001-004 receipts | covered |
| O2 | Change only cloned commit selection from guard result to requested step. | App `go` adapter; edit-diff contract | covered |
| O3 | Run inactive and premature blocked vectors. | V4/V5 baseline vectors | covered |
| O4 | Keep guard result distinct from mutant committed destination. | baseline committed step plus target-comparison sidecar | covered |
| O5 | Produce total T-B-01/T-B-02 structured observations and screenshots. | observation contract | covered |
| O6 | Replay identically and preserve protected/baseline/permitted bytes. | task done criteria | covered |
| O7 | Emit no adjudication state. | observation owner boundary | covered |

## Constraints

- Baseline and mutant frames are generated clones.
- The only byte change is `setStep(result.step)` to `setStep(requested)` in the
  cloned commit adapter.
- `guard_allowed`, notice, and requested step remain directly observed in both
  frames.
- `guard_result_step` is recorded as the baseline guard-selected committed step;
  mutant committed step is recorded separately. This bridge is valid only
  because the accepted baseline proves commit-from-guard-result behavior.
- Only V4 inactive and V5 premature vectors run.
- Target states remain observation states, never explanation coverage.

## Validation Surface

`node --test .../tests/m3-breaking-commit.test.mjs`, plus two fresh browser
processes, aggregate tests, exact edit diff, protected-byte replay, and scoped
diff checks.
