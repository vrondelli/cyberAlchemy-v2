# G01 terminal shortlist: fresh matched four-gate pass

On the untouched, source-only GitHub CLI release-list task
`Multi-SWE-Bench__go__maintenance__bugfix__03f04397`, the opt-in
`intent-anchor-terminal-shortlist-r1` candidate beat the fixed
`intent-anchor-convergence-r3` control on **both native quality metrics and
both measured cost metrics**. The [pair decision](PAIR-DECISION.json) binds
the result to the [pre-score prediction seal](PREDICTION-SEAL.json),
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json) freezes,
and pinned native score files. Both arms used GLM-5.3-Flash, the same source
task and commit `f015020bcd61caf00d41d4c2dae014be2fb2fc29`, and an 8K
context limit. Full VPS receipts remain under
`/opt/are/evolution-runtime/g01-terminal-shortlist-fresh-r1/`.

| Metric | Control | Terminal shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0.323182 | **1.000000** |
| Native File-F1 | 0.666667 | **1.000000** |
| Native Line-F1 | 0.304183 | 0.990950 |
| Known model input + output tokens | 83,985 | **82,624** |
| Run duration (started/completed timestamps) | 303.073 s | **241.577 s** |
| Model calls | 24 | 23 |

The candidate gained about `+0.676818` Span-F1 and `+0.333333` File-F1,
used 1.62% fewer known model tokens, and finished 20.29% faster. Its
terminal packet offered eight receipt-bound source ranges from 18 eligible
wide source observations, excluding test/fixture paths. GLM selected ranges
from both `pkg/cmd/release/list/http.go` and `list.go`; control's terminal
packet offered only `http.go` ranges. Native scoring shows the two selected
files covered both gold files and all gold span extent. The
[control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json) are mirrored locally.

Decision: this is a **one-task G01 qualification**, not the complete
ContextBench campaign or the requested cross-benchmark proof. The quality
gain is large; the token gain is small and may not generalize. Keep the
candidate fixed and replicate on untouched tasks, including another
repository, with the same pre-score sealing and strict four-gate comparison.
Do not reuse this now-exposed release-list task for a prospective claim.

## Open Questions

- Does the fixed shortlist preserve or improve quality on a predeclared
  multi-task, multi-repository cohort without erasing token/time gains?
- Can the selector avoid redundant overlapping ranges when the first eight
  eligible observations cluster in two files?
- How should this bounded G01 gain combine with G02 and G03 evidence before
  any claim that ARE improves accuracy, token use, and efficiency overall?
