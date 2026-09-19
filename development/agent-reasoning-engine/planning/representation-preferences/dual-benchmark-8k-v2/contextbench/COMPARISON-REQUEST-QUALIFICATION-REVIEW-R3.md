# Initial request qualification R3 and process review

Approved for the offline implementation scope; live execution is not admitted. All 14 tests independently pass, including real local subprocess exit/cancellation and actual prepared runners with scripted tokenizers. No provider or evaluator calls occurred.

R3 resolves the remaining model-evidence contradiction: all four client/result receipt families reject model attempts and survive in failed rows. The maximum family count is a documented lower bound, not billing reconciliation. Both R1 infrastructure and final-write fixes remain covered.

The worker preserves incomplete reports and disables model dispatch. The wrapper caps execution at ten minutes plus bounded cancellation/local-settlement time, attempts settlement after returned or failed execution, and rejects cancellation, forced cleanup, nonzero exit or incomplete reports. Failure reports and settlement remain attached for the caller to persist.

All 94 prior review bindings remain unchanged. The companion JSON binds 103 files, including the explicitly selected dynamic worker. Actual source freeze, live tokenizer invocation and post-run evidence audit remain separate gates; initial qualification proves neither task quality nor savings.

## Open Questions

[The process contract](COMPARISON-QUALIFICATION-PROCESS.md) owns exact freeze/invocation, durable outer failure retention, post-run audit and source cleanup.
