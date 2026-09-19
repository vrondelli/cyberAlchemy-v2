# ContextBench discovery/retention result

The fixed four-pair development experiment completed all eight assigned trajectories. It did not meet the acceptance rule: token reduction was 12.64%, below 15%, and no treatment task achieved perfect native quality. All eight exports were valid, every dispatched request stayed within the 8,000-token input-plus-reserved-output limit, and all model costs were known.

| Measure | Control | Treatment |
| --- | ---: | ---: |
| Total model input + output | 323,196 | 282,354 |
| Mean Span-F1 | 38.28% | 44.03% |
| Mean file F1 | 65.97% | 53.19% |
| Valid exports | 4/4 | 4/4 |
| Perfect native outcomes | 0/4 | 0/4 |

The treatment saved 40,842 tokens and improved average Span-F1 by 5.75 percentage points, but lowered average file F1 by 12.78 points. A further 7,638-token reduction would reach the cost threshold at this observed control total; this arithmetic is not a proposal to cut work, because evidence quality also needs improvement.

| Fixed task | Control tokens | Treatment tokens | Control Span-F1 | Treatment Span-F1 |
| --- | ---: | ---: | ---: | ---: |
| contextbench-1 | 81,619 | 83,788 | 0.00% | 0.00% |
| contextbench-2 | 81,634 | 80,560 | 99.28% | 97.40% |
| contextbench-3 | 79,893 | 37,092 | 46.67% | 51.54% |
| contextbench-4 | 80,050 | 80,914 | 7.17% | 27.19% |

Cost accounting totals 605,550 model tokens across 218 requests, including full provider input and output; native scoring used no model judge. There are no unknown reservations. The maximum recorded request reservation was 6,990 tokens. All eight trajectories exceeded 8K cumulatively. The timing report observed two overlapping local model requests with complete receipt coverage; it does not measure backend instances or prove four-worker successor capacity.

This is one repetition on four previously exposed development tasks. The compact control and common terminal review differ from the earlier v1 comparison, so their savings percentages cannot be pooled. The combined treatment cannot identify separate effects of recent-history retention, archived recovery and discovery reminders. LongMemEval remains a separate benchmark with separate acceptance and full-history confirmation requirements.

Evidence: [native results](LIVE-RESULTS.json), [capacity report](LIVE-CAPACITY.json), [frozen protocol](LIVE-PROTOCOL.md), [post-run checklist](POSTRUN-CHECKLIST.md). Independent result-integrity audit passed; native registration records counterevidence. See [completion audit](LIVE-COMPLETION-AUDIT.md).

## Open questions

Which quality losses come from never discovering relevant evidence versus omitting delivered evidence at final selection? Are the savings stable beyond the third pair and one repetition? Can a reusable evidence policy improve both precision and coverage while reaching 15%? Record the failure analysis and reviewed successor hypothesis before further generation.
