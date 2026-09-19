# Recovery pair review R2

Approved as an offline runner candidate. All eleven independent tests pass, including local Git, bounded native recycler and both-arm export. R1 remains preserved; exact transitive bindings are in [the review receipt](RECOVERY-PAIR-REVIEW-R2.json).

Known-cost infrastructure failures now stop subsequent arms and retain usage. Explicit infrastructure/persistence flags also prevent false completion on the final arm. Shared admission callbacks, unknown-cost propagation and successful result-reference reuse remain intact.

No live execution is approved. Global source budgets, transport settlement, fixed campaign slots and independent request/admission reconstruction remain necessary. Pair numerical window metadata alone does not prove exact request identity or benchmark success.

## Open Questions

Remaining orchestration/scorer joins are owned by [the orchestration contract](discovery-v1/ORCHESTRATE-RECOVERY.md).
