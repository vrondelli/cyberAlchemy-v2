# Query-archive R1 completed run

The four-task GLM campaign finished with two valid final context selections and
two `query-archive.latest-exchange-over-budget` failures. All 276,040 model tokens
and 62 calls are accounted. Session 62345 exited 0; the generation child settled
cleanly with no remaining process group. Exit success describes orchestration,
not benchmark success. Result integrity review is pending.

| Task | Outcome | Model calls | Model tokens |
| --- | --- | ---: | ---: |
| contextbench-1 | Final context selected | 19 | 82,191 |
| contextbench-2 | Mandatory latest exchange overflow | 14 | 62,088 |
| contextbench-3 | Final context selected | 18 | 81,982 |
| contextbench-4 | Mandatory latest exchange overflow | 11 | 49,779 |

The failed latest-only request measurements are 8,079 and 8,034 tokens, including
retained reasoning reservations, 512-token margin, 2,048-token output reservation
and the two-token envelope allowance. They were rejected before model dispatch.
All actually dispatched request windows passed the measured 8K gate. Do not treat
these small overages as permission to relax the window or bypass measurement.

The scorer's all-or-none prediction preflight rejected the two invalid results.
It therefore made no native evaluator calls, including for the two completed
outputs. Its zero mean F1 values are placeholders; native quality remains unknown.
Sources: [score result](score/RESULTS.json), [supervision result](supervision/RESULTS.json),
[task evidence](runs_root/). The original campaign denominator and all failed
costs remain four assignments even if survivors are later scored descriptively.

Next: audit source/receipt/export integrity, separately score the two completed
outputs descriptively, then register the result and competing sizing hypotheses
in the native research DAG before implementing a successor. A bounded working
view or adaptive request allocation must preserve raw evidence and honest delivery
accounting; neither is selected or proven yet. No fresh control, matched savings,
generalization or perfect-score claim follows.

## Open Questions

How good are the completed outputs? Can request sizing prevent mandatory-exchange
overflow without losing useful evidence or clipping model reasoning? Does archive
recall improve context acquisition compared with historical candidates, and does
any improvement survive untouched confirmation? See [the prospective protocol](../QUERY-ARCHIVE-CANDIDATE-R1.md).
