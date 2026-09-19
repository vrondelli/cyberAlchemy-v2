# Native driver review R2

Approved as an offline adapter. All five test groups pass independently; initial rejection remains preserved.

Both lifecycle races are resolved: dispatch claims its prepared request before awaiting health, and concurrent close callers share the same drain promise. Held-promise tests confirm one dispatch and lock retention until in-flight completion.

The new no-socket test exercises the actual GLM adapter, native measured callback and guarded durable ledger. Its synthetic 100-token tokenizer response plus native 512 margin produces a 612-token bound; exactly one tokenizer and one model receipt persist in an idle ledger. These are fixture values, not provider measurements.

No live admission follows. Matching client profile/output cap, shared cancellation and dispatch health, full multi-phase wire integration and failure coverage remain required. Close waits for in-flight completion; cancellation depends on the client’s same signal. Exact transitive bindings include dynamic test imports.

## Open Questions

INDEPENDENT-NATIVE-DRIVER.md owns full episode integration, tokenizer/in-flight failure tests, bounded histories, common baseline, source/supervision setup and real tokenizer qualification before exact freeze.
