# G01 adaptive shortlist two-task cohort — strict replication rejected

The [predeclared cohort](COHORT-FREEZE.json) kept the same adaptive
candidate and native convergence control across fresh clap Rust and GitHub
CLI Go tasks. Both pairs completed, sealed predictions before pinned native
scoring, and have verified local score hashes.

| Task | Span-F1, control → candidate | File-F1, control → candidate | Known tokens, control → candidate | Duration, control → candidate | Four gates |
| --- | ---: | ---: | ---: | ---: | --- |
| [clap Rust](rust/RESULT-NOTE.md) | 0 → 0.228338 | 0 → 0.250000 | 82,239 → 47,966 | 210.968 → 121.017 s | Pass |
| [GitHub CLI Go](cli/RESULT-NOTE.md) | 0.153039 → 0.271963 | 0.666667 → 1.000000 | 21,956 → 27,423 | 82.893 → 105.424 s | Fail: cost |

The candidate improved both native quality metrics on both tasks. Pooled
descriptive totals are 104,195 → 75,389 known model tokens (27.65% less)
and 293.861 → 226.441 seconds (22.94% less), but the cohort's predeclared
rule required **each** task to pass all four gates. The early-finishing Go
control violated both cost gates, so replicated four-gate success is
**rejected**. These pooled totals are not a replacement decision rule.

The Rust task confirms that waiting for four delivered wide ranges can
recover quality without spending all 24 calls. The Go task shows that a
minimum 12-call check does not guarantee efficiency relative to a control
that finishes before twelve. Both exact tasks are now exposed.

## Open Questions

- Should the next prospective campaign use a predeclared aggregate estimand
  with repeated tasks and provider-latency uncertainty, rather than a strict
  per-task wall-time win, while still reporting every task-level regression?
- How can a gold-blind stopping policy respond to early task resolution and
  sparse evidence without overfitting the exposed traces?
