# Independent review record

Date: 2026-09-18. Reviewer: preference_review subagent. Authority effect none.

## Design and plan review

Design review required six corrections: lesson-bound activation rather than
request-journal activation, typed conflict handling, verbatim consent, successful
observation eligibility and an exact twenty-request window, persistent offer
lifecycle, and replay of a real pre-change ledger. These were incorporated before
the reviewer approved the DAG for bounded implementation.

## Implementation review

The reviewer found that revocation prevented learning a different format, product
scope could overlap another thread's preference, and mixed directives could be
misclassified. Scope overlap checks and distinct suppression rules now handle
replacement and duplicate prompts. Compound instructions and comma-separated
clauses abstain. Regression cases cover the reported examples.

Final reviewer verdict: no outstanding blockers, subject to the final test run.
This is a bounded construction review, not product approval or release authority.

## Evidence limits

Actual host tests cover storage, restart, post-lesson provider failure, overrides,
revocation, and scope. The before-lesson pending decision case uses a synthetic
journal projection fixture; it is not a process-kill test at every storage boundary.
The compressed legacy fixture was captured with pre-change code. Its state digest
is unchanged when replayed by the modified implementation. Tests use scripted
providers and cannot establish semantic task quality or preference acceptance.

## Open Questions

[RESEARCH.md](RESEARCH.md) owns human usefulness, generalization and token-cost
questions. A successor release freeze is still needed before release qualification.
