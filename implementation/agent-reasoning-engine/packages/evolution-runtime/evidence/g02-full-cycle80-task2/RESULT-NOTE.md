# G02 max-capacity ContextBench task-2 result

Status: two existing live treatment runs from 2026-09-19 were natively scored
and reconciled on 2026-09-26. This is one exposed task against a frozen
historical DSH baseline, not a prospective multi-task campaign or proof of
deep-window use.

| Arm | Span-F1 | File-F1 | Model tokens | Calls | Tokens vs DSH |
| --- | ---: | ---: | ---: | ---: | ---: |
| Frozen DSH round-78 baseline | 0.7869999050 | 0.5714285714 | 587,645 | 22 | — |
| ARE incremental batch recovery | 0.77503222 | 0.40000000 | 324,155 | 95 | 44.84% fewer |
| ARE radical ranked acquisition | **1.00000000** | **1.00000000** | **461,176** | **94** | **21.52% fewer** |

The radical arm passes the frozen task-2 Pareto score rule: neither native F1
metric falls below DSH, both rise, and total model tokens fall by more than the
15% target. The incremental arm fails the quality rule despite lower token use.
Neither treatment is a call-count improvement. The radical run took about 814
seconds of harness wall time; a comparable DSH wall-time receipt was not checked
here, so no latency win is claimed. Although the harness configured a 1,000,000
token context capacity, the largest measured radical input was only 8,598
tokens (incremental: 12,053). This result does **not** establish behavior at a
large occupied context window.

## Reconciliation and receipts

Both Docker workers exited zero without timeout or OOM. The remote frozen
generation package has 636 bindings, all matching; its freeze SHA-256 is
`4f17e37c3a1acc79d09e37c8cd84006297e417eb323c1a424d72ac4cd0840417`.
The frozen native scorer and source manifest both match their declared hashes.
Each scored prediction is exactly equal to the sealed `native_export.prediction`.
The native scorer reported no error. Ledger digests recompute correctly, all
95/94 dispatched model calls have known usage, and their sums exactly equal the
sealed 324,155/461,176 totals. Gold/reference data were not mounted into the
generation containers; only the evaluator opened gold after generation.

The [generation receipts archive](generation-receipts-v1.tar.gz) retains the
freeze, review, source package, both full run evidence trees, model ledgers,
predictions, commands, and per-arm settlements (264 entries, SHA-256
`33eda380b9ffb64045ad0584aaaf35ad001a9fe4a3299794bcb19753643fb377`).
The evaluator outputs are [incremental](incremental-native-score.json) and
[radical](radical-native-score.json). The same evidence is retained on the VPS
under `/opt/are/evolution-runtime/evidence/g02-full-cycle80-task2/`, while the
original generation trees remain under
`/opt/are-harness-benchmark/full-cycle-80/runs/`. The original campaign root
has `CAMPAIGN-STARTED.json` and both per-arm settlements but no aggregate
`CAMPAIGN-SETTLEMENT.json`; this report reconciles the two arm receipts without
inventing that missing original artifact.

## Decision and next work

Retain ranked acquisition as the leading G02 candidate for task 2. Run a
source-only prospective multi-task cohort under the same native scorer, with
matched quality and total-token metrics, before claiming a general ARE×DSH
advantage. To test the large-window proposition, include tasks whose observed
request occupancy actually exceeds the small-window regime. G01 still needs a
materially different candidate after HEN-11 failed; G03 has a separate bounded
sixteen-question win.

## Open Questions

Will ranked acquisition transfer beyond this exposed task without task-specific
overfitting? Can a treatment preserve the quality gain while reducing its high
model-call count? Does it remain useful when requests actually occupy a large
fraction of the configured context window?
