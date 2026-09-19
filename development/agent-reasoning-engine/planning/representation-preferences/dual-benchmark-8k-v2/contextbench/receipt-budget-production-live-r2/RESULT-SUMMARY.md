# Receipt-budget R2 result

All four fixed tasks completed and passed native validity/accounting checks. None reached perfect quality. Independent result audit is pending.

| Task | Span-F1 | File-F1 | Model tokens | Calls |
| --- | ---: | ---: | ---: | ---: |
| contextbench-1 | 2.85% | 28.57% | 83,084 | 24 |
| contextbench-2 | 71.39% | 57.14% | 84,424 | 23 |
| contextbench-3 | 46.51% | 80.00% | 81,142 | 23 |
| contextbench-4 | 29.06% | 13.33% | 82,826 | 22 |

Total: 331,476 model tokens and 92 calls. Mean span-F1 37.45%; mean file-F1 44.76%. All requests/accounting passed; post-score integrity verified. No unknown model usage is reported.

Compared descriptively with the prior frontier candidate, completion is 4/4 rather than 3/4. Task2 span-F1 is lower, task3 is unchanged and task4 is higher. This is not a matched causal comparison or savings result; all-four spend increased from 226,272 to 331,476 tokens.

The strong H-A hypothesis (all-task perfection after correcting receipt accounting) failed. Corrected accounting permits valid longer work, but does not establish that the extra work is useful on every task. Census and independent audit precede the next registered decision.

Sources: [native scores](score/RESULTS.json), [settlement](supervision/PROCESS-SETTLEMENT.json), [launch review](REVIEW.json).

## Open Questions

Where does relevant evidence fail to be acquired, delivered, mapped or selected? Can the separately specified radical source-hint candidate improve acquisition without wasting context? Perfect quality, untouched confirmation and the original15% savings target remain unresolved.
