# Shared provider-attempt health repair

The first complete-trajectory attempt ended inconclusively. A request-tokenizer attempt timed out with a durable failed receipt. Model-only usage/rate-limit health checks did not mark that result as infrastructure failure, so another arm started. The coordinator stopped the run; all381,518known model tokens and16,000unknown reservations remain in RECOVERY-TRAJECTORY-R1-STOP-AUDIT.json and its independent terminal review. There is no scored quality or efficiency claim.

The additive provider-attempt-health.mjs validates all three provider receipt families: model, request tokenizer and index tokenizer. At an arm's terminal boundary, every receipt must represent a successful dispatched single attempt with its required usage/measurement fields. Explicit failure, missing dispatch/terminal state, unknown usage, failed index transport, unexpected retry or unknown receipt kind produces a structured failure by receipt index. It does not mistake an unfinished index receipt for success.

run-recovery-pair-provider-health.mjs wraps the unchanged historical runner/orchestrator. It marks failed provider-attempt evidence as infrastructure failure before the runner's existing shared-health report. This prevents that task's next arm and queued tasks from starting. An already in-flight request may finish and have its usage recorded; the shared admission checks stop later dispatches. No request is retried, and no failed receipt or cost is removed. Model token and8K admission policies are unchanged.

Three test groups exercise healthy and failed receipt families and actual campaign stop propagation, including the observed request-tokenizer timeout pattern. The successful synthetic eight-arm case preserves all assigned outcomes and costs. Frozen live R1 sources remain byte-identical; no automatic successor run is launched by this wrapper.

## Open questions

Independently review the repair, preserve native inconclusive observation/decision, and bind the wrapper into a separately reviewed successor worker. A30-second tokenizer deadline failed once in181request attempts; that observation alone does not establish whether remote latency, transport or local scheduling caused the delay. Decide a prospective bounded timeout policy equally for both arms before any fresh run. Keep single-attempt accounting and all failed research costs. Perfect quality,15%token savings and broader confirmation remain open.
