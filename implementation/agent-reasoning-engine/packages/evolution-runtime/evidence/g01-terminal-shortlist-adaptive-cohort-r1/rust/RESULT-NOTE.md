# Adaptive shortlist Rust pair — four gates pass

The first task in the [predeclared cohort](../COHORT-FREEZE.json),
`Multi-SWE-Bench__rust__maintenance__bugfix__3be02163`, ran on pinned clap
commit `135b15467eda2394b017f2a7d25cda1417c0feec`. One frozen
[pair plan](PAIR-PLAN.json) drove ordered GLM dispatch, sealed
[both predictions](PREDICTION-SEAL.json) before pinned native scoring, and
wrote the [decision receipt](PAIR-RESULT.json).

| Metric | Control | Adaptive shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0 | 0.228338 |
| Native File-F1 | 0 | 0.250000 |
| Known model tokens | 82,239 | 47,966 |
| Run duration | 210.968 s | 121.017 s |
| Model calls | 25 | 15 |

All four gates pass on this task: 41.67% fewer known tokens and 42.64% less
time accompany improved native accuracy. Receipt stop checks show two
distinct delivered wide ranges at call 12, three at call 13, and four at
call 14. The adaptive candidate therefore continued beyond the fixed
12-call cap and then stopped before the baseline's 25th call. This task is
now exposed and cannot be reused for a prospective claim.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json). Full receipts remain at
`/opt/are/evolution-runtime/g01-adaptive-rust-r1/`.

## Open Questions

- Will the same fixed rule save cost on tasks where control finishes before
  12 calls? The predeclared Go pair addresses that question.
