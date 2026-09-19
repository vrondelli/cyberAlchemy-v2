# Measured terminal catalog: completed candidate run

All four fixed tasks produced valid native scores; none was perfect. All window, long-trajectory, accounting, settlement, and post-score integrity gates passed. The perfect-score objective is not achieved.

| Task | Span-F1 | File-F1 | Model tokens | Calls |
|---|---:|---:|---:|---:|
| contextbench-1 | 4.77% | 25.00% | 84,866 | 21 |
| contextbench-2 | 99.59% | 57.14% | 82,747 | 21 |
| contextbench-3 | 47.44% | 100.00% | 81,982 | 22 |
| contextbench-4 | 6.92% | 40.00% | 84,031 | 21 |

Mean span-F1: 39.68%. Mean file-F1: 55.54%. Total: 333,626 model tokens, 85 calls. No fresh control runs.

Compared descriptively with the prior ranked-source radical, mean span-F1 rose from 37.90% to 39.68% (+1.78 percentage points), while tokens increased by 62,977 (+23.27%). Task 3 accounts for 62,867 of that increase. This is not a matched or causal comparison; no token savings claim is supported.

Task 2 covers all reference spans but includes extra source; task 3 finds the correct files but only 31.10% of reference span coverage. Tasks 1 and 4 have low final span coverage. A source-bound postrun census is required to distinguish acquisition gaps from catalog omission and selection losses.

Evidence: [native scores](score/RESULTS.json), [supervision](supervision/RESULTS.json), [generation settlement](supervision/PROCESS-SETTLEMENT.json). Exec session6337 exited0; generationchild3615090 settled without forced termination. Independent result review is pending.

## Open Questions

Does the wider catalog reduce final selection losses? Are remaining gaps caused by acquisition, representation, or selection? Original token efficiency, reusable benefits and untouched confirmation remain unproven. See the [protocol](../MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md).
