# Comparison accounting review — R1

Not approved yet. All seven existing tests passed independently; two extra probes reproduced blocking gaps.

Partial or malformed usage summaries discard safe positive token witnesses. A summary with 120,000 known prompt tokens and null completion/total yields a zero known lower bound and only 96,000 conservative tokens. Preserve safe partial witnesses without double counting.

Malformed falsy accounting fields bypass uncertainty checks: unknown_usage=0, accounting_requires_reconciliation as an empty string, and phase_state=0 yield raw_accounting_complete=true. Validate present flags and phase/pending shapes explicitly.

Exact source bindings are in the companion JSON. Neither raw accounting nor this review grants durable reconciliation, scoring or live admission.

## Open Questions

Owned by [COMPARISON-ACCOUNTING.md](COMPARISON-ACCOUNTING.md).
