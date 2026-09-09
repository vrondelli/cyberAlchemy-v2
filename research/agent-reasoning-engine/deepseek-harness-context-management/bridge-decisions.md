# Reuse decisions

These are research recommendations, not adopted architecture decisions.

## Borrow carefully

- Canonical append-only events with strict sequence and predecessor integrity.
- Pure event-prefix projection into the model-visible surface.
- Disposable projection checkpoints that may lag but never lead the log.
- Durable flush/commit boundaries aligned with completed turn boundaries.
- Append corrections, invalidations, new context epochs, and policy changes
  rather than rewriting earlier bytes.
- Shadowing compaction that preserves raw history.
- Explicit documentation of each feature's token and KV-cache effect.
- A real provider test based on provider-reported cache-read tokens.
- Complete current dynamic-context snapshots appended only on change.
- A canonical request-affinity header and dispatch reconstruction invariant.
- Semantic durability barriers before model dispatch and effectful operations.
- Exact-history retrieval independent of compacted model context.
- Caller-derived authorization for context imports and retrieval.
- Deterministic pruning and spill before generative summarization.

## Use only as analogy

- DeepSeek Harness package/plugin composition.
- Its exact session event names and TypeScript types.
- Its surface replacement protocol.
- Its JSONL/Zstandard physical representation.
- Completed-turn subagent fork semantics; ARE context forks need different
  ownership and authority bindings.

## Reject

- “Append-only means the provider cache will hit.”
- A derived cache as source of truth.
- Rewriting or deleting old context events to make the current view smaller.
- Treating a generated summary as an admitted observation or authority record.
- Sending all diagnostic or telemetry events to the model.
- Copying full context payloads into telemetry by default.
- Allowing route, model, system prompt, tool-schema, or renderer changes to pass
  as the same cache-affinity epoch.
- Importing another stream's instructions, permissions, or semantic conclusions
  as current authority.
- Exposing backend cursors, storage locators, or retrieval scope as unrestricted
  model-controlled authority.

## Proposed implementation boundary

The smallest coherent next vertical is an `ARE context-event-store` plus a
pure `context-event-projection` adapter. It should initially remain in-memory
but expose the same append/read-prefix/flush interface a durable backend would
use. Codex integration and persistent JSONL storage should follow only after
deterministic replay and cache-key tests pass.
