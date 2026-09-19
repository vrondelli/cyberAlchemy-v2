# Finding-reference R2 live result

All four tasks completed and received valid native scores. The independent
[result audit](RESULT-REVIEW.md) verified1,302bindings,207,204known/conservative
tokens,97model calls,zero unknown usage and maximum request window7,868.
All twelve findings passed validation on the first attempt. There were no
corrective model requests in this live run. Generation settled cleanly.

| Task | Span-F1 | File-F1 | Model tokens |
| --- | ---: | ---: | ---: |
| 1 | 0.00% | 22.22% | 49,545 |
| 2 | 50.82% | 57.14% | 54,787 |
| 3 | 46.73% | 85.71% | 54,084 |
| 4 | 7.64% | 42.86% | 48,788 |

Mean span-F1 is26.30%; mean file-F1 is51.98%. Zero tasks are perfect.
All reported gates except perfect quality passed. Source: [native results](score/RESULTS.json).

The native cumulative exported span coverage is0%,50.91%,34.86%,4.29%, versus
final coverage0%,46.12%,33.32%,4.29%. Final selection alone cannot reach perfect
quality from the exported union. A current-run observation-to-export census
is still required before assigning the remaining gap specifically to acquisition
or delivery. Valid citation identifiers do not establish semantic claim correctness.

This run supports the narrow completion-feasibility hypothesis on these four
exposed tasks; it does not prove a causal improvement from any one component.
Fresh controls remain suspended. Historical runs are descriptive references;
no matched token savings or untouched generalization is claimed.

## Next work and Open Questions

Register this result against the prospective finding-interface hypothesis and
its quality counterhypothesis. Verify the current-run evidence census, then
advance the separate radical acquisition/retention hypothesis with a concrete
mechanism and falsifier. Keep two workers,8Krequests and full failed-run costs.
Can better query-driven evidence recall close missing reference coverage without
spending more model tokens? Does latest-exchange-only history lose useful search
state? The overall perfect-quality and15%token goals remain unproven.
