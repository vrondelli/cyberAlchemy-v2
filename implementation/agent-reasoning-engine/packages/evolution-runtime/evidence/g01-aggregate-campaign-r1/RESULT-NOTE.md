# G01 four-language aggregate campaign r1

Status: completed, **predeclared campaign pass rejected**. The fixed adaptive
shortlist was run against native convergence on four previously unexposed,
source-only ContextBench tasks (zstd C, GitHub CLI Go, Svelte JavaScript, clap
Rust). The [definition](DEFINITION.json) and
[campaign freeze](CAMPAIGN-FREEZE.json) fixed the task order, arm code,
scorer, and aggregate rule before dispatch. No gold labels were inspected
before the freeze. The [machine result](CAMPAIGN-RESULT.json) verifies the
scored prediction seals and native-score hashes.

| Task | Control Span/File-F1 | Candidate Span/File-F1 | Known model tokens, control → candidate | Duration seconds, control → candidate | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| zstd C `0f495035` | 0 / 0.666667 | 0.079031 / 0.500000 | 80,925 → 41,459 | 256.024 → 133.950 | Span and cost gain; File-F1 regression |
| GitHub CLI Go `03b66e26` | scored | unscored | — | — | Candidate `instrument.no-final-context` after five model calls |
| Svelte JavaScript `000d0675` | 0 / 0 | 0.687041 / 0.500000 | 80,721 → 44,187 | 308.034 → 277.343 | All four per-task gates pass |
| clap Rust `0b593a28` | 0 / 0 | 0 / 0.666667 | 84,370 → 43,024 | 262.901 → 178.207 | File and cost gain; Span-F1 tied at zero |

Only three of four pairs scored. On those three, descriptive macro Span-F1
rose `0 → 0.255357` and File-F1 `0.222222 → 0.555556`, while summed known
model tokens fell `246,016 → 128,670` (47.70%) and summed measured duration
fell `826.959 → 589.499` seconds (28.71%). These pooled values **do not**
override the frozen all-four-scoreable rule. The result is neither a full
ContextBench campaign nor proof of ARE's cross-benchmark advantage.

The Go terminal receipt explains the unscored result: the candidate was
offered one delivered source range from `gpg-key add`, unrelated to the
`gh codespace rebuild` task. Its convergence query was the broad
`add rebuild command`, which admitted unrelated `add` paths; only the
`gpg-key add` range became a confirmed base read. GLM submitted an empty
context-handle list.
The exporter then returned `instrument.no-final-context`. This is an
evidence-acquisition/early-resolution failure, not a scorer or credential
failure. Forcing the unrelated handle would make the run scoreable but would
mask the failure.

The compact local receipts include each pair plan, arm freeze, pair result,
and scored prediction/score hashes. Full run trajectories, model receipts,
and source snapshots remain under
`/opt/are/evolution-runtime/g01-aggregate-campaign-r1` on the GLM VPS. The
unscored Go pair has control and candidate run results locally for diagnosis.

Next hypothesis: keep the receipt-delivered shortlist, but gate early
resolution on task-relevant delivered source evidence and add a bounded,
gold-blind acquisition step when the shortlist contains only unrelated
ranges. Preserve legitimate abstention if acquisition still fails. Diagnose
the exposed Go run only; any gain claim needs a new source freeze and
untouched tasks. The aggregate decision rule should continue to measure
validity explicitly and report per-task regressions.

## Open Questions

- Why did the Go candidate's discovery path stop after five model calls with
  only an unrelated `gpg-key add` source range?
- Can a bounded task-grounded acquisition step find relevant delivered base
  evidence without expanding the token budget excessively?
- Does the File-F1 regression on C persist on a larger untouched cohort?
