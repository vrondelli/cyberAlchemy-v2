# Canonical comparison outcome repair

Status: implementation design, not a new live-run contract.

The original slots08/10 have identical raw receipts but differ between saved
result.json and the sealed dispatcher result because comparison-compact-arm.mjs
adds provider_attempt_failure/attempt_health after persistence. This is a
representation defect independent of unknown usage, which remains unresolved.

Preserve a complete executor result as the canonical value. Derive provider
health from its receipts for queue control, never by decorating that value after
it was persisted. comparison-queue.mjs already checks providerAttemptHealth over
both receipt families and stops on failure; comparison-accounting.mjs independently
derives health and reserves unknown usage. No annotation field is needed to
preserve either behavior.

Missing or incomplete executor summaries are a different case. Retain available
client receipts in an explicitly synthetic, unreconciled failure outcome; do not
pretend it matches a durable canonical result, and do not turn missing evidence
into zero cost. Preserve the original exception and stop the queue. Durable
reconciliation must still reject every actual source/result/receipt mismatch.

The successor should be additive. Required integration evidence includes a real
prepared runner with a controlled provider failure, saved result, dispatcher,
queue outcome seal and reconciliation. Verify raw result equality through the
pipeline; both model and index-tokenizer failure; shared cancellation and unstarted
slots; retained unknown reservations; persistence failure; unchanged healthy
success. Mocking only the queue or stripping a named field during reconciliation
would not establish the repair.

## Open Questions

Exact additive dispatcher and integration-fixture boundary; canonical treatment
of incomplete summaries; successor composition with structural planner and
aggregate-delivery repairs. Original research scope remains in
[RESEARCH-RESULT-R3.json](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
