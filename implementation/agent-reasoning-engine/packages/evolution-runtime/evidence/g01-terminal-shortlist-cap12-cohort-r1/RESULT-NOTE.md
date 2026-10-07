# G01 cap-12 terminal-shortlist cohort — one pass, one unscored task

The [predeclared cohort](COHORT-FREEZE.json) held the 12-call shortlist
candidate and native convergence baseline fixed across GitHub CLI Go and
zstd C source-only tasks. The [GitHub CLI pair](cli/RESULT-NOTE.md) produced
sealed, pinned native scores and passed all four gates: Span-F1
`0.138594 → 0.234498`, File-F1 `0.666667 → 1.000000`, 55.72% fewer known
model tokens, and 53.46% less elapsed time. This is a substantial one-task
gain.

The [zstd pair](zstd/RESULT-NOTE.md) was unscored: control stopped at
`bounded-view-not-admitted` and candidate at `unbound-retained-reasoning`.
Under the frozen rule, an unscored arm is **inconclusive**, not a win.
Therefore this cohort does **not** prove replicated quality-and-efficiency
improvement, and it does not close the ContextBench campaign or the broader
ARE-vs-control objective. Both exact tasks are exposed.

The GitHub CLI candidate required one [pre-model whitelist repair](INFRASTRUCTURE-RETRY.md).
That repair did not change the candidate algorithm, task, baseline, scorer,
or decision rule. The original control freeze was preserved.

## Open Questions

- Can the same fixed cap-12 candidate pass a second untouched,
  cross-repository matched pair without runtime errors?
- Which bounded-view and retained-reasoning runtime paths caused the zstd
  failures, and can they be made reliable without changing the measured
  candidate mechanism?
