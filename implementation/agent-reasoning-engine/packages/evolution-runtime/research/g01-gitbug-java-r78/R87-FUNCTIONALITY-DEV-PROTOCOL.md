# G01 r87 — exposed functionality-channel development rank

Bind r83 failed-source projection, r81 sealed queries, r84 source-only
rankings, and the cold-verified r86 provider result. Run the same pinned
120-line chunk BM25 over the full Java source universe using each valid
functionality summary as a separate query. Rank with four-channel
RRF(k=60): ARE, raw BM25, positive symbol, functionality BM25. Also report
a consensus-protected version that restores baseline A's position for files
in both ARE and raw-BM25 top three when the new rank demotes them. No
evaluator path, patch, fix, or score is read by this source-side script.

The 12-case evaluation is exposed development. Count provider tokens and
latency; a gain over an unfiltered or weak comparator alone is not a
superiority claim. Before confirmation, compare to the strongest available
matched comparator, including a production-role filter if this source-only
population makes test-file exclusion a legitimate common rule.

## Open questions

- Does the GLM summary resolve hard failures beyond symbols at acceptable
token cost, or only add redundant rank signals?
- Does the consensus safeguard eliminate r77-style harm without relying
on gold-path feedback?
