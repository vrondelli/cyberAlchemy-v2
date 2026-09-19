# Comparison queue review — R1

Not approved yet. All seven tests passed independently.

The stop classifier misses native_export_error, which the actual unchanged current-ARE orchestrator returns after native export failure with healthy known-cost receipts. The dispatcher does not add an infrastructure flag for this status, so new slots continue. Recognize this returned infrastructure status, orchestration_error and explicit persistence failure indicators; add regression coverage while retaining continuation for ordinary semantic run_error.

All twelve outcomes and cooperative settlement are covered by existing tests. Durable accounting, sealing and process deadlines remain later responsibilities. Exact bindings are in the companion JSON.

## Open Questions

Owned by [COMPARISON-QUEUE.md](COMPARISON-QUEUE.md).
