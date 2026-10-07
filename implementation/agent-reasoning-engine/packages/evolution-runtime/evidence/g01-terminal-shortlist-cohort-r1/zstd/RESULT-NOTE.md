# G01 fixed-shortlist zstd replication — quality gain, duration gate failed

The first task in the [predeclared cohort](../COHORT-FREEZE.json) ran on
source-only `Multi-SWE-Bench__c__maintenance__bugfix__2687f1e4`, pinned to
zstd commit `517d8c984ce9b30792fe5b6c8c79547d3748f34d`. The fixed
[control](CONTROL-FREEZE.json) and [candidate](CANDIDATE-FREEZE.json)
preceded GLM dispatch; [both predictions](PREDICTION-SEAL.json) were sealed
before pinned native scoring. The [decision](PAIR-DECISION.json) applies the
cohort's four strict gates.

| Metric | Control | Fixed shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0 | 0.112236 |
| Native File-F1 | 0 | 0.666667 |
| Known model tokens | 57,170 | 54,614 |
| Run duration | 187.141 s | 202.523 s |
| Model calls | 15 | 15 |

The candidate improved quality and used 4.47% fewer tokens, but took about
8.22% longer. Its terminal packet offered six receipt-bound source ranges
from `lib/compress/zstd_compress.c`; the control offered only
`tests/regression/levels.h`. The candidate selected the implementation file
and control selected the test header. This is a real quality gain, yet the
strict replication gate **fails** on duration. The task is now exposed; do
not tune and rerun it for a prospective win.

Receipt timing separates reported model-request latency (`134.311` control,
`154.220` candidate seconds), tokenizer latency (`14.941`, `15.940`), and
non-provider residual (`37.889`, `32.363`). The candidate's 19.909-second
model-latency increase more than accounts for the 15.382-second wall-time
increase, while residual time fell. That is diagnostic only, not grounds to
override the predeclared wall-time gate or claim latency causality.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json). Full remote receipts remain
under `/opt/are/evolution-runtime/g01-terminal-shortlist-zstd-r1/`.

## Open Questions

- Is the 15.382-second duration increase caused by model latency variance
  or by the terminal shortlist step? The current single pair cannot tell.
- Will the fixed mechanism also improve quality on the predeclared NodeBB
  JavaScript task, and what will its token and duration costs be?
