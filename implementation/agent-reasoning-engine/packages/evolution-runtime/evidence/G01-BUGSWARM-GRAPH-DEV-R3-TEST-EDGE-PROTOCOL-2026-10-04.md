# G01 graph development r3 — test-to-code edge protocol

Status: **fixed before r3 source-only execution and evaluator read** on the
same exposed 24-case BugSwarm development cohort. This is not independent
confirmation, ContextBench, live ARE, or a superiority claim. The reserved
24-repository confirmation partition remains unopened.

The exact [r3 source-only ranker](../research/arb-trace2code-r1/rank-bugswarm-graph-dev-r3-test-edges.py)
is SHA-256 `ae5af4bfc07bb61c0a86eedf9f0e670a078f77e5eb1417ed3227bfecdedbf32e`.
It consumes the sealed [r2 graph rankings](G01-BUGSWARM-GRAPH-DEV-R2-RESULT-2026-10-04.md),
the same 24 pre-fix source projections and queries, and the same job-matched
original logs. It does not consume patch paths, evaluator receipts, or model
outputs. The code reuses r2 source parsing pinned at SHA-256
`e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0`.

Unlike r2, filename/query-matched **test files are navigation seeds only**.
For up to eight such seeds per case, r3 adds bounded non-test targets from
direct imports, one additional import hop, and `TestFoo`/`FooTest` class-stem
relationships. It can promote at most twenty targets with fixed source-only
weights; it never removes a candidate. The complete ranking, per-case source
tree hashes, and input hashes must be sealed before evaluator-only scoring.

The 24-case advancement gate requires: 24 valid rankings; top-30 gold reach
at least **20/24**; MRR@8 at least **0.43234** (no material regression from
r2 and above the original +0.10-vs-ARE threshold); at least **16/24** case
wins versus unchanged ARE; a positive paired repository-unit 20,000-draw
bootstrap 95% lower bound; and summed **incremental r3 ranking time at most
30 seconds** on this local development run. The incremental time is not an
end-to-end efficiency claim. Each component must pass; failed components
remain failed. Report r3-minus-r2 separately, including lost cases and reach.

Even a pass would only justify a separately frozen GLM/cost experiment or
later independent confirmation with authenticated/reproduced source evidence.
Do not open the reserved confirmation set on an r3 failure.

## Open Questions

- Do failing-test imports add genuinely missing implementation files within
  the top-30 cap?
- Can the rule improve the number of winning cases rather than only a few
  large reciprocal-rank jumps?
- What source authentication path can remove the HTTP provenance caveat?
