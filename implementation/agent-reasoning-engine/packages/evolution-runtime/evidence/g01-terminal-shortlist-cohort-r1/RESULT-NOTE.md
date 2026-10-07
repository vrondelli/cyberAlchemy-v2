# G01 fixed terminal-shortlist replication cohort — rejected on duration

This [predeclared two-task cohort](COHORT-FREEZE.json) kept the same candidate
source hashes and baseline across zstd C and NodeBB JavaScript tasks. Each
pair used an untouched source-only task, sealed predictions before native
scoring, and measured the same four strict gates.

| Task | Span-F1, control → candidate | File-F1, control → candidate | Known tokens, control → candidate | Duration, control → candidate | Four gates |
| --- | ---: | ---: | ---: | ---: | --- |
| [zstd C](zstd/RESULT-NOTE.md) | 0 → 0.112236 | 0 → 0.666667 | 57,170 → 54,614 | 187.141 → 202.523 s | Fail: slower |
| [NodeBB JavaScript](nodebb/RESULT-NOTE.md) | 0 → 0.224439 | 0 → 0.307692 | 83,834 → 82,731 | 290.698 → 286.541 s | Pass |

Quality improved on both tasks, and known model tokens fell on both. Duration
improved only on NodeBB; zstd was 8.22% slower. Therefore the predeclared
rule **rejects the replicated four-gate claim**. The prior GitHub CLI
qualification remains a one-task result, not a campaign-wide or
cross-benchmark product proof. Both cohort tasks are now exposed and may be
used for diagnosis, not a fresh prospective win.

The NodeBB pair had one infrastructure retry before any model dispatch:
a partial clone could not be copied by the runner, so both scored arms used
a full clone pinned to the same commit. The scored candidate and task were
unchanged. Its [prediction seal](nodebb/PREDICTION-SEAL.json) identifies the
scored attempts.

Receipt timing breakdown (summing reported provider request latencies, then
subtracting them from file-timestamp wall time) gives a diagnostic, not a
causal attribution:

| Task and arm | Model latency | Tokenizer latency | Non-provider residual |
| --- | ---: | ---: | ---: |
| zstd control | 134.311 s | 14.941 s | 37.889 s |
| zstd candidate | 154.220 s | 15.940 s | 32.363 s |
| NodeBB control | 134.486 s | 22.257 s | 133.955 s |
| NodeBB candidate | 136.089 s | 22.690 s | 127.762 s |

On zstd, the candidate's model-request latency rose 19.909 seconds while its
non-provider residual fell 5.526 seconds. This is consistent with provider
latency contributing to the wall-time miss, but the single pair cannot prove
the cause. The predeclared duration gate remains failed.

## Open Questions

- Is the zstd time regression model-latency variance, changed request shape,
  or another confound? The receipt split cannot distinguish them.
- What new fixed candidate could preserve the quality gain while making the
  time gate robust on untouched tasks across repositories and languages?
