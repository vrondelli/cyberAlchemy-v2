# Transport diagnostics review R2

Approved as an offline operational component. No live execution admission. Rejected R1 artifacts remain preserved.

The revoked-aggregate defect is fixed: array classification is guarded, valid root codes survive, and uninspectable children produce a bounded unknown count/flag. The regression settles request-construction, request-event and response-event failures without allowing the diagnostic exception to escape.

All ten fault/privacy/native-ledger and compact-runtime tests pass independently. V4 transport bytes are unchanged from R1; only sanitizer, test and documentation changed. All 773 prior composition bindings remain unchanged. The fixed allowlist retains no messages, stacks, paths, addresses or arbitrary error codes; direct children are capped at eight. Existing ledger tests retain diagnostics in tokenizer/model failure receipts, and successful full-runtime regression preserves wire/accounting behavior.

No provider calls, retries, budget changes or historical cause inference. Index-tokenizer transport remains outside scope. Exact bindings are in the companion JSON.

## Open Questions

Owned by [TRANSPORT-DIAGNOSTICS.md](TRANSPORT-DIAGNOSTICS.md): exact live integration and future observed local failures, not reconstruction of lost historical causes.
