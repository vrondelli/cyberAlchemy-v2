# G02 Go four-task development cohort r1

## Result

Four valid, sealed Flipt ARE/DSH source-selection pairs were run with the stable 50-line Go candidate: bootstrap configuration, namespace/ETag, caching middleware, and OTLP tracing exporter. The namespace pair additionally used a one-line own-property guard in the pinned ranker to prevent a pre-model crash on the task word `constructor`; the other behavior was unchanged. Two tasks passed all four strict per-task gates and two failed. No failed task was removed from these aggregates.

| Metric | ARE | DSH |
| --- | ---: | ---: |
| Mean native Span-F1 | 0.34628 | 0.31363 |
| Mean native File-F1 | 0.45037 | 0.42803 |
| Sum of known model tokens | 618,659 | 1,571,735 |
| Sum of arm seconds | 636.310 | 999.159 |

Across these four development tasks, ARE's mean Span-F1 was higher by **0.03265**, mean File-F1 by **0.02234**, with **60.64% fewer known model tokens** and **36.32% less summed arm time**. These are descriptive development-cohort aggregates, not a predeclared independent holdout or a full ContextBench campaign. They do not erase the namespace quality loss, bootstrap efficiency loss, low absolute caching scores, or the invalid Flipt validation-command pair caused by repeated DSH transport failures.

Source decisions and pre-score seals are retained in these separate VPS roots:

- `/opt/are-benchmark-runs/g02-cross-layer-flipt-bootstrap-gofunc-pair-r1/`
- `/opt/are-benchmark-runs/g02-cross-layer-flipt-namespace-ownfix-pair-r1/`
- `/opt/are-benchmark-runs/g02-cross-layer-flipt-cache-gofunc-pair-r1/`
- `/opt/are-benchmark-runs/g02-cross-layer-flipt-otlp-gofunc-pair-r1/`

The separate exposed ARE-only diagnostics and invalid runs remain documented in their own evidence notes; none are included in the four-task aggregate.

## Open Questions

- Does the aggregate advantage persist on a predeclared untouched multi-repository holdout?
- How should the G02 selector be revised to reduce irrelevant Go import/export hints and namespace object-layer misses without overfitting exposed tasks?
- Should operational DSH transport-failure overhead be reported alongside valid matched-arm costs in a broader reliability analysis?
