# Comparison arm review — R2

Approved as an offline dispatcher component. All six tests passed independently. The initial rejection remains preserved.

The plain-exception gap is resolved: both client receipt families survive, known and unknown spend remains available for reconciliation, infrastructure failure is explicit, and the original exception is rethrown. The new regression covers both cost cases. No remaining blocking defect found in this scoped dispatcher.

Exact source bindings are in the companion JSON. Injected-executor tests do not establish a complete native campaign. Explicit result arrays still require durable/client reconciliation; twelve-slot scheduling, sealing, scoring and the prospective common comparison freeze remain pending. No live execution admission follows.

## Open Questions

Owned by [COMPARISON-ARM.md](COMPARISON-ARM.md).
