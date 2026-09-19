# Independent candidate descriptive results

The isolated native scorer completed and its child exited cleanly. Post-score
input and prediction verification passed. The [independent result audit](RESULT-REVIEW.md) passed with 839 exact bindings.

| Task | Span-F1 | File-F1 | Cumulative exported span coverage | Final span coverage |
| --- | ---: | ---: | ---: | ---: |
| contextbench-2 | 64.36% | 44.44% | 57.14% | 54.12% |
| contextbench-3 | 46.51% | 80.00% | 30.30% | 30.30% |

Source: [native results](score/RESULTS.json).
F1 is twice precision times coverage divided by their sum. Cumulative coverage
is the native trajectory's last step; final coverage is the native final field.
These values describe the two completed outputs only. Slots 00 and 03 failed
finding validation and remain explicitly excluded from descriptive scoring.
All four assignments and their full 200,173 tokens remain in reconciliation.
No new model calls were made for this evaluation.

Neither completed output is perfect. Both lack reference spans in cumulative
exported evidence; final selection alone cannot close that gap. Task 2 also
loses approximately 3.03 percentage points of span coverage at final selection.
A separate observation-to-export census is still needed to distinguish missing
acquisition from export loss. These measurements support investigating both
alongside the finding-interface hypothesis. They do not isolate a causal architecture effect.

For historical context, the earlier current-ARE candidate scored 65.24% and
30.80% span-F1 on these same two exposed tasks. The independent candidate is
slightly lower on task 2 and higher on task 3, but its campaign completed only
two of four tasks. This is not a matched control experiment or a savings claim.

Product frontier: register these results and finding failures in the native
research DAG, then test a provenance-preserving finding interface candidate
and a separate radical acquisition candidate. Operational owner: research
operator, responsible for result audit, exact freeze and disk/process checks.
Fresh controls, increased workers and release remain deferred.

## Open Questions

Which missing spans reflect search strategy versus tool delivery limits?
Will short confirmed references plus bounded correction improve completion?
Can query-driven retrieval increase relevant evidence per model token?
Perfect quality, untouched confirmation and the 15% token target remain unproven.
