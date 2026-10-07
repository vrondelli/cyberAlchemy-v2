# G01 cap-12 GitHub CLI pair — four gates pass on one task

The first task in the [predeclared cohort](../COHORT-FREEZE.json) ran on
source-only `Multi-SWE-Bench__go__maintenance__bugfix__2ffecd23`, pinned to
GitHub CLI commit `115b4b5ee9c0eb1598c23842f6fd2def124ec421`.
The [control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json)
were bound to the task; [both predictions](PREDICTION-SEAL.json) were sealed
before pinned native scoring. The [decision](PAIR-DECISION.json) applies the
cohort's four strict gates.

| Metric | Control | Cap-12 shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0.138594 | 0.234498 |
| Native File-F1 | 0.666667 | 1.000000 |
| Known model tokens | 76,285 | 33,781 |
| Run duration | 233.140 s | 108.509 s |
| Model calls | 28 | 13 |

The candidate used 55.72% fewer known model tokens and finished 53.46%
faster while improving both native quality metrics. Its final selection
included `api/queries_repo.go` and `command/repo.go`; control selected only
`command/repo.go`. These are one-task results, not evidence that the same
balance holds across repositories.

The first candidate process stopped before a model request due to a missing
new-arm whitelist entry. [The infrastructure retry](../INFRASTRUCTURE-RETRY.md)
records the repair; the scored candidate is `candidate-attempt-02`. The cap,
task, baseline, and decision rule did not change. Full run receipts remain
under `/opt/are/evolution-runtime/g01-shortlist-cap12-cli-r1/`.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control native score](control-native-score.json), and
[candidate native score](candidate-native-score.json).

## Open Questions

- Does the cap preserve accuracy on the predeclared zstd C task?
- How stable is the time gain once source indexing and provider latency vary?
