# Adaptive shortlist GitHub CLI pair — quality gain, cost gates fail

The second task in the [predeclared cohort](../COHORT-FREEZE.json),
`Multi-SWE-Bench__go__maintenance__bugfix__4d9664f3`, ran on pinned GitHub
CLI commit `583af3e54c506fa1c0e6bc673c2c62a7e6303660`. One frozen
[pair plan](PAIR-PLAN.json) drove both arms. Their
[predictions](PREDICTION-SEAL.json) were sealed before native scoring; the
[decision receipt](PAIR-RESULT.json) applies the same four strict gates.

| Metric | Control | Adaptive shortlist |
| --- | ---: | ---: |
| Native Span-F1 | 0.153039 | 0.271963 |
| Native File-F1 | 0.666667 | 1.000000 |
| Known model tokens | 21,956 | 27,423 |
| Run duration | 82.893 s | 105.424 s |
| Model calls | 8 | 11 |

Quality improved, but candidate used 24.90% more known tokens and took
27.18% longer. Control finished unusually early at eight calls; candidate
finished at eleven, before its adaptive stop check would begin at twelve.
Thus the cost regression is not caused by the rule extending exploration
from twelve to twenty-four, but the single pair cannot separate model
trajectory variance from other causes. The strict four-gate decision fails.
This task is now exposed.

Local artifacts: [control prediction](control-prediction.json),
[candidate prediction](candidate-prediction.json),
[control score](control-native-score.json), and
[candidate score](candidate-native-score.json). Full receipts remain at
`/opt/are/evolution-runtime/g01-adaptive-cli-r1/`.

## Open Questions

- What stopping signal can avoid excess work when a task is already resolved
  early, without suppressing necessary evidence acquisition on sparse tasks?
- How stable are token and wall-time comparisons across repeated provider
  trajectories for the same task class?
