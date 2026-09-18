# Representation preference results

Status: bounded construction passed, 2026-09-18. Authority effect none.

## What works

Three completed, distinct recognized requests produce one preference offer.
Exact confirmation saves a scoped lesson in the existing ledger. A later matching
task selects it after restart. Explicit format overrides, unrelated tasks, decline,
learning modes, and revocation suppress reuse as specified. A different format
can replace a revoked preference without reviving the old one.

The [scripted demonstration](evidence/demo.json) shows one lesson selected after
restart, zero with a plain-text override and zero for an unrelated comparison.
Run [demo.mjs](demo.mjs) from the repository root. [USAGE.md](USAGE.md) describes
the host contract and the bounded English grammar.

## Validation

- 14/14 new preference cases passed: [test output](evidence/preference-tests.txt).
- 91/91 existing learning, host and intent cases passed: [regression output](evidence/regression-tests.txt).
- The actual pre-change ledger restores the same state digest.
- The independent reviewer has no outstanding blockers: [review](REVIEW.md).
- Exact tested source hashes: [result record](evidence/result.json).

Initial failed runs are retained. They exposed an undefined optional inspection
field and a scripted objective provider that assumed an active objective on the
first request. Another test used the word release, which the existing repository
router treated as multiple capabilities. Neutral picnic tasks isolate this feature;
the routing ambiguity was not changed or counted as fixed. Independent review
also caught replacement, scope overlap and compound-request detection defects.
Those defects were corrected before the final run.

## Decision and limits

Retain as a candidate host mechanism. Do not claim improved task quality, general
language understanding, model transfer or token savings. External model calls in
these tests: zero. PrefEval, BenchPreS and LongMemEval were researched, not run.
The existing default repository/gateway learning setting remains unchanged.
Before-lesson failure is covered by a synthetic journal projection case; complete
crash-point fault injection remains outside this evidence.

The earlier frozen release candidate now fails source-closure matching because
its implementation changed. Its evidence files were not rewritten. The
[candidate inspection](evidence/candidate-inspection.json) records this condition.
A new candidate freeze and full release qualification are required before release.

## Open Questions

The next research question is whether users accept these offers and whether the
saved preference improves outputs at equal total model-token budgets. Follow the
external-study prerequisites in [PLAN.md](PLAN.md); keep the larger-window
ContextBench milestone separate. See [RESEARCH.md](RESEARCH.md) for alternatives.
