# G02 NodeBB maintenance-mode pair: four-gate pass

The first predeclared NodeBB task,
`SWE-Bench-Pro__javascript__maintenance__bugfix__0155d9d9`, ran on pinned
commit `b94bb1bf93390e5204551bfc647049c6f8c5a60d`. Both arms settled
cleanly, predictions and cost receipts were [sealed](PAIR-PRE-SCORE-SEAL.json)
before native scoring, and the [pair decision](verified-pair-r1/PAIR-DECISION.json)
passed all four strict gates.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE GLM treatment | 0.30977 | 0.83333 | 273,582 | 231.47 |
| DSH control | 0.27071 | 0.57143 | 621,433 | 302.32 |

ARE improved Span-F1 by `0.03906` and File-F1 by `0.26190`, with 55.98%
fewer known model tokens and 23.44% less wall time. The fixed selector added
no reads and dropped none; the [raw model score](model-native-score.json)
equals the selected score, so this task's improvement cannot be attributed to
post-run selector expansion. It is one task in the frozen
[multi-repository cohort](../g02-fixed-candidate-multirepo-r1/COHORT-FREEZE.json),
not a full ContextBench result. The second NodeBB task must be reported
regardless of this pass.

The inherited ARE runner initially checked the Flipt cache for this NodeBB
commit and exited before model dispatch. The
[operational correction](../g02-fixed-candidate-multirepo-r1/OPERATIONAL-CORRECTION-01.json)
redirected that preflight to the binding's pinned NodeBB cache. The task,
candidate ranker, episode overlay, selector, model cap, and DSH arm were
unchanged. This correction occurred after DSH had begun; it is disclosed and
not represented as a fully frozen operational launch from the original runner
hash.

The [source-only task](source-only-task.json), [binding](binding.json),
[freeze](FRESH-PAIR-FREEZE.json), [ARE result](RESULTS.json),
[DSH export](dsh-EXPORT.json), [raw prediction](model-prediction.json),
[selected prediction](candidate-prediction.json), and
[selector receipt](selector-receipt.json) are retained. The
[ARE receipt archive](are-receipts.tar.gz) has SHA-256
`98622130708f4160b8c405961fd26139eab61fa8210971cd6f09ea69fdfc8cf7`;
the [DSH receipt archive](dsh-receipts.tar.gz) has SHA-256
`90b2e88441a9df545f09500aff2b600656d18c16c43e00ea95352d094db4e26f`.
They exclude source checkouts and secret files; the DSH archive also excludes
session state.

## Open Questions

- Will the second frozen NodeBB task pass, and will its control remain scoreable?
- How stable are the gains outside Flipt across further repositories?
