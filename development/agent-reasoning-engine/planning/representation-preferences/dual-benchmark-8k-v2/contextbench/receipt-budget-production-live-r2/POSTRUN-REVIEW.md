# Receipt-budget R2 census review

Approved for census integrity. Independent read-only recomputation exactly reproduces POSTRUN-ANALYSIS.json, including all prediction/capture/receipt/projection joins and existing native cumulative coverage. No model or evaluator calls were made.

| Task | Confirmed / exported observations | Union span coverage | Final span coverage | Selection loss |
|---|---:|---:|---:|---:|
| 1 | 95 / 95 | 6.5628% | 2.7809% | 3.7820 pp |
| 2 | 60 / 60 | 69.7407% | 55.7723% | 13.9684 pp |
| 3 | 29 / 29 | 30.3035% | 30.3035% | 0 pp |
| 4 | 68 / 68 | 22.0340% | 22.0340% | 0 pp |

Every confirmed observation and delivered projected event is accounted for, with zero unmapped changed-line occurrences. Thus final selection alone cannot attain perfect coverage from any recorded delivered union. This locates a confirmed acquisition/delivery shortfall, not proof about all raw acquisitions or semantic understanding. Tasks 1 and 2 also have measurable selection loss.

Exploration ended with 81,878 / 83,376 / 80,280 / 81,328 known tokens before final selection, beyond the episode's 80K loop guard. Last discovery calls were list_files/read_file, not finish_issue_attempt. Request-tokenizer receipts were 49 / 43 / 43 / 43, with separate index counts 16 / 22 / 9 / 37 and no poison. The guard explains this control-flow termination; it does not establish the quality effect of a different budget. Nine oversized read_file requests occurred across tasks 2–4; their isolated token cost is not inferred.

All four assignments and 331,476 tokens / 92 model calls remain retained. Exact source bindings are in POSTRUN-REVIEW.json. No cleanup, further evaluation or generation is admitted.

## Open Questions

Which changes improve useful acquisition/delivery and selection within the unchanged limits? Did failed reads materially affect outcomes? These need prospective evidence. No causal architecture, matched 15% savings, patch correctness or untouched-confirmation conclusion follows from this census.
