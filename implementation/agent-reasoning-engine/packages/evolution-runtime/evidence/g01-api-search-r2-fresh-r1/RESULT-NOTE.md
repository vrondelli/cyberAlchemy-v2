# G01 API-search r2 fresh matched pair — efficiency gain, accuracy failure

The source-only GitHub CLI task
`Multi-SWE-Bench__go__maintenance__bugfix__2b83a112` was checked for prior
local exposure before dispatch. The control and r2 candidate used the same
8K GLM-5.3-Flash configuration and repository commit
`7d317a81bea0bf6770f9572909ea1c9d5f3f0907`. Their exact
[control](CONTROL-FREEZE-r2.json) and [candidate](CANDIDATE-FREEZE.json)
freezes preceded model dispatch. Both [predictions](PREDICTION-SEAL.json)
were sealed before pinned native scoring. The initial control setup attempt
stopped before any model call because its repository cache was a symlink; a
real cache copy and new output root produced the scored control. No task or
candidate source was changed after that setup failure.

| Native final metric / cost | Control | Candidate r2 |
| --- | ---: | ---: |
| Span-F1 | 0 | 0 |
| File-F1 | 0 | 0 |
| Symbol-F1 / Line-F1 | 0 / 0 | 0 / 0 |
| Known model input + output tokens | 81,317 | 64,442 |
| Model calls | 26 | 23 |
| Run duration (started/completed file timestamps) | 215.220 s | 179.444 s |
| Maximum reserved input tokens | 5,338 | 4,657 |

Candidate token use fell 20.75% and run duration 16.62%, but **native
accuracy did not improve**. Both final predictions selected only
`pkg/cmd/config/config.go:41-80`; the three gold files are `git/git_test.go`,
`internal/authflow/flow.go`, and `internal/config/config_type.go`.
The control trajectory reached peak gold-file coverage `1/3` and peak
gold-span coverage `0.563299`; the candidate trajectory reached `0` on
both. Thus the shorter candidate run also lost relevant exploration,
even though both terminal selections were wrong.
See the mirrored [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json).

The candidate's mechanism did activate: one `git_protocol` search under
`internal/config` caused one bounded base read, delivered to the model and
offered as terminal handle `h1`. But the read was
`internal/config/config_file_test.go:59-91`, selected from test-file search
hits because the r2 path filter excluded test directories but not Go's
`_test.go` suffix. GLM selected the unchanged `h0` config-command handle at
terminal, leaving both arms at zero. Later searches were against the current
revision and were correctly ineligible for base-source follow-through. This
is an exposed-task diagnostic, not a prospective claim for another arm.

Decision: reject r2 as an accuracy improvement. Do not repeat this task for a
prospective gain claim. The next hypothesis first needs cross-layer evidence
acquisition without losing the control's relevant reads, then terminal
selection on an untouched task; simply admitting the first exact search hit,
especially a test file, is insufficient. G02's
cross-repository frontier is another option, but no broad ARE advantage is
proved by this pair.

Remote full receipts remain at
`/opt/are/evolution-runtime/g01-api-search-r2-fresh-r1/`.

## Open Questions

- What gold-blind search diversification can retrieve implementation and
  cross-layer paths without reading benchmark labels or spending the six-read
  cap on redundant tests?
- Why did the model terminally choose the unchanged config-command handle
  after a new read was delivered, and can a bounded relevance check improve
  selection without forcing an unsupported handle?
- Which untouched task and fixed comparator best test the next mechanism
  against all three quality, token, and duration objectives?
