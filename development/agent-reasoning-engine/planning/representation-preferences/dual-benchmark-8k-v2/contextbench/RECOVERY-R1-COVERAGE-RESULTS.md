# Latest R1 coverage result

The separately admitted, evaluator-only diagnostic completed all four available arms and retained all eight assigned outcomes. No model or tokenizer calls occurred. [Machine result](recovery-r1-coverage-r1/RESULTS.json) records successful post-input integrity checks, 98 snapshot/source bindings and unchanged original inconclusive classification. Independent result review is complete: [review](RECOVERY-R1-COVERAGE-RESULT-REVIEW.md). Native post-hoc records are saved in RECOVERY-R1-COVERAGE-POSTRUN.json; original H1 remains inconclusive.

| Task / arm | Required evidence present in archive | Offered for selection | Finally selected |
|---|---:|---:|---:|
| 1 control | 2.67% | 2.67% | 0% |
| 1 treatment | 3.78% | 3.78% | 0% |
| 2 control | 48.91% | 48.60% | 48.60% |
| 2 treatment | 17.12% | 17.12% | 17.12% |

These percentages are native gold-span byte recall, not F1 or task success. Archive recall is the exact maximum recall reachable from the delivered source spans. None of these archives permits perfect arbitrary-subspan selection, and none permits perfect whole-read selection. Selected recall and F1 reproduce all four independently reviewed native scores. The remaining four failed/not-started arms are unscored, not removed.

Missing discovery is the dominant attainable-quality ceiling in these completed arms. Task 1 also loses the small discovered relevant set at selection; task 2 loses little or no recall between archive and selection. This distinguishes missing evidence from a packet-only or terminal-selection-only explanation. It does not prove why the model searched poorly, establish a causal eager-versus-demand effect, or measure task 3/4 coverage. Completion-selected evidence cannot establish accepted savings.

Next: independently review and register this post-hoc observation and decision; preregister the independent-investigation branch against current exploration and null explanations. Preserve whole-trajectory accounting, original GLM 8K admission, perfect quality and at least 15% savings. No gold terms or source identities may be used to tune generation. The existing R1 experiment remains inconclusive.

## Open questions

Can task-derived independent investigations discover missing evidence within the same cumulative token ceiling? Does current exploration get trapped in one interpretation? Does independent exploration duplicate cost or lose dependencies? These hypotheses and exact experiment choices belong to [the alternative branch plan](RADICAL-BRANCH-PLAN.md).
