# Fixed G02 candidate: multi-repository breadth gate rejected

The predeclared [cohort](COHORT-FREEZE.json) contains two untouched Flipt Go
pairs and two untouched NodeBB JavaScript pairs. Both NodeBB tasks were fixed
before either launched and both were reported. The first passed all four
strict native gates; the second failed both quality gates. Therefore the
cohort's broad fixed-candidate gate is **rejected**, notwithstanding strong
token/time savings. There is no full ContextBench generalization claim.

| Task | Repository | ARE Span/File-F1 | DSH Span/File-F1 | ARE/DSH tokens | ARE/DSH seconds | Four gates |
| --- | --- | --- | --- | --- | --- | --- |
| `40a717e5` | Flipt Go | 0.64081 / 0.72727 | 0.55148 / 0.55556 | 173,361 / 940,674 | 183.94 / 485.71 | Pass |
| `43d6d59b` | Flipt Go | 0.26500 / 0.54545 | 0.25045 / 0.53333 | 339,633 / 447,753 | 326.39 / 332.99 | Pass, narrow |
| `0155d9d9` | NodeBB JS | 0.30977 / 0.83333 | 0.27071 / 0.57143 | 273,582 / 621,433 | 231.47 / 302.32 | Pass |
| `09eb0d6d` | NodeBB JS | 0.35624 / 0.25000 | 0.43701 / 0.33333 | 62,202 / 947,218 | 151.38 / 377.69 | Fail quality |

Across these four tasks, known model tokens totaled `848,778` for ARE versus
`2,957,078` for DSH, and wall seconds `893.17` versus `1,498.71`. These are
descriptive totals, not a replacement for the failed per-task quality gate.
The NodeBB chat-permission loss identifies a missing cross-layer evidence
and final-selection mechanism; its gold labels are now exposed and may be
used only for diagnosis. Preserve the fixed candidate and these comparisons
as development evidence, then test a materially new mechanism on a future
untouched task. Do not repeat this cohort to seek a favorable draw.

Evidence: [Flipt ui.enabled](../g02-fresh-ui-enabled-r1/RESULT-NOTE.md),
[Flipt webhook](../g02-fresh-webhook-r1/RESULT-NOTE.md),
[NodeBB maintenance](../g02-nodebb-0155-r1/RESULT-NOTE.md), and
[NodeBB chat permissions](../g02-nodebb-09eb-r1/RESULT-NOTE.md). An
[operational preflight correction](OPERATIONAL-CORRECTION-01.json) was
recorded when the generic ARE runner inherited a Flipt cache check on the
first NodeBB pair. It was fixed before that ARE arm dispatched; the candidate
mechanism and task set did not change.

## Open Questions

- Which gold-blind cross-layer source mechanism can raise quality on
  settings/UI/API tasks without erasing efficiency gains?
- Does G01 offer a larger accuracy-improvement opportunity than further G02
  selector work, given this failed breadth gate?
