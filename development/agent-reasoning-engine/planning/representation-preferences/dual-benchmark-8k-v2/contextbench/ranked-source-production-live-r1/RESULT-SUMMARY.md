# Ranked-source candidate: scored result

All four tasks produced valid native predictions. Accounting and request windows
verified; generation exited cleanly. No task reached perfect quality. Independent
result-integrity review is pending.

| Task | Span-F1 | File-F1 | Model tokens | Calls |
| --- | ---: | ---: | ---: | ---: |
| 1 | 0.00% | 0.00% | 83,597 | 27 |
| 2 | 98.53% | 66.67% | 81,541 | 20 |
| 3 | 46.51% | 80.00% | 19,115 | 7 |
| 4 | 6.55% | 30.77% | 86,396 | 24 |

Total:270,649 model tokens and78 model calls. Mean Span-F1:37.90%; mean
File-F1:44.36%. All four satisfy the recorded long-trajectory criterion.

Against the previous receipt-budget candidate, this run used60,827 fewer tokens
(18.35% lower), with mean Span-F1 rising from37.45% to37.90%. This is a
descriptive historical comparison, not matched-control savings or a causal claim.
Quality is uneven: task2 improved strongly, tasks1 and4 regressed, and task3
retained its earlier score while stopping much sooner. The original token
target and generalization claim remain unproven.

The pinned native cumulative source coverage is7.86% /98.50% /30.30% /30.47%.
Final coverage is0% /97.41% /30.30% /3.86%. This suggests both acquisition
gaps and selection losses; confirm the source census before choosing a successor.

Twelve read attempts were rejected for line_count>100 (1/9/1/1 per task).
Ranked hint calls were5/2/1/1. These counts describe tool behavior, not causal
token cost or proof that hints improved quality.

Evidence: [native score](score/RESULTS.json),
[generation settlement](supervision/PROCESS-SETTLEMENT.json),
[live review](LIVE-REVIEW.json).

## Open Questions

Independent result review; exact confirmed-evidence census; hint use and later
native reads; next registered hypothesis; untouched confirmation. Controls stay
suspended. The perfect-score goal remains open.
