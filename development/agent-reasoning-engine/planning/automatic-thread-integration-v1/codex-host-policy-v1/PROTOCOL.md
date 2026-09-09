# Offline host decision protocol v1

This protocol is private construction evidence, with no activation or approval effect.

The Rust host sends one POST to the random loopback route returned by `startDecisionService`. The request contains `version`, `scope`, a fresh `request_id`, SHA-256 `request_digest`, `kind`, and UTF-8 `body`. Provider bodies are complete uncompressed JSON including an explicit `max_output_tokens` cap and `store: false`. Incremental response references, background mode, non-loopback providers and auxiliary endpoint paths are unsupported.

The service validates identity, payload digest, model profile and cap. It invokes the predecessor `budgetDecision` using the complete-body measurement as next input, zero additional retained server history, and the output cap as growth reservation. This is valid only for the bounded offline full-request path. The externally supplied meter must include provider framing. The fixture meter counts bytes; it is not a live tokenizer or provider conformance proof.

The session ModelClient owns the gate for both requests and compaction; a reloadable turn configuration does not own the compaction guard. Automatic compaction denial emits the normal error event before returning, because the surrounding lifecycle handler expects that event to have been emitted.

Replies echo the version, scope, request identity and payload digest. Only `continue` releases a provider attempt. A recycle/block decision, altered binding, peer error, timeout, oversized reply or invalid JSON stops the request. There are no automatic retries or redirects in the policy HTTP client or dedicated provider HTTP client. Outer endpoint retries return through the gate; gate Build errors are mapped to non-retryable InvalidRequest errors by the host.

A `native_compaction` request has an empty body. The service returns `recycle`. The Rust guard stops compaction even if a peer returns `continue`; no protocol action authorizes native compaction in this prototype.

The service snapshots profile fields, caps envelopes, bounds the request-identity ledger to 10,000 entries, and records decision hashes rather than prompt bodies. Its endpoint and ledger are ephemeral. The provided state digest/checkpoint reference are explicit prototype bindings, not proof that the host has checkpointed or reached tool quiescence.

## Open Questions

- How should native task identity, generation, effective model limits and durable checkpoints be bound when enabling a live host?
- Which tokenizer and provider output contract can establish verified bounds, including images and server framing?
- How should outstanding tools and uncertain provider outcomes be reconciled before a fresh-context handover?
- How should production proxy, TLS, credentials and every auxiliary inference client retain their existing policy?

- How should typed recycle and reconciliation reasons survive the current generic host error mapping before automatic handover is added?
