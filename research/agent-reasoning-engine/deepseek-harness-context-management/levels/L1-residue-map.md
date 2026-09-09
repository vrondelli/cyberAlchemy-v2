# L1 — ARE comparison and residue map

## Existing fit

| DeepSeek mechanism | Current ARE analogue | Assessment |
|---|---|---|
| Immutable typed event append | `runtime-journal` canonical/hash-chained events | Strong primitive, but in-memory and diagnostic |
| Deterministic projection | Context Basis and Context Envelope canonicalization | Strong primitive |
| Currentness boundary | selected dependencies plus source snapshot | Strong ARE-specific extension |
| Per-consumer surface | plan-bound and interaction-bound Context Window Views | Strong primitive |
| Derived cache | object reuse and in-memory maps | Partial; no explicit prefix checkpoint contract |
| Durable canonical log | none | Missing |
| Exact request reconstruction | `are.codex-context-fragment/v2` in `additionalContext` | Partial; exact final provider bytes are not observable here |
| Cache-hit telemetry | none in current wrapper evidence | Missing |
| Compaction without deletion | 32 KiB block; no context-stream shadow/checkpoint policy | Missing |
| Complete dynamic snapshots | Whole Context Envelope regenerated per preflight | Partial; no append-on-change surface |
| Request-affinity header | Envelope and route digests only | Missing system/tool/provider/model equality record |
| Dispatch reconstruction invariant | Wrapper tests inspect transformed JSON-RPC | Missing final app-server/provider-byte assertion |
| Exact-history retrieval | No durable context-event corpus | Missing |
| Risk-aligned durability | In-memory journal only | Missing across process failures |
| Replay fixture | Mock app-server tests and canaries | Partial; no event-derived Codex transcript replay |

## Critical gap

ARE has two separate immutable products:

1. a bounded runtime journal used for turn and semantic evidence; and
2. a frozen Context Envelope assembled from live selected sources.

The Context Envelope is not currently a projection of the journal. The wrapper
rebuilds a complete envelope on every preflight and serializes the complete
fragment into `additionalContext`. Stable inputs may produce stable content,
but ARE has no first-class event-prefix/checkpoint identity that makes reuse
explicit, durable, or independently testable.

The second critical gap is request identity. Even a byte-identical Context
Envelope does not prove cache affinity when the system prompt, ordered tool
schemas, provider/model route, call configuration, or Codex serialization
changed. ARE needs a separate request-affinity header and reconstruction check.

## Required ARE-specific extensions

- Event payloads must retain source identity, source digest, relevance basis,
  temporal scope, authority posture, and transformation identity.
- Definitions and ontology text remain evidence inputs, never inferred facts.
- Selected dependency drift appends an invalidation/successor event; unrelated
  source drift stays diagnostic.
- Context contradictions, exclusions, gaps, and residue remain projected but
  never silently promoted into facts.
- Context currentness and provider cache state remain separate decisions.
- `authority_effect` remains `none` throughout storage, projection, and cache.

## Risks if copied literally

- A conversation-session schema does not express ARE semantic ownership.
- A “latest event wins” fold can hide contradiction unless supersession rules
  are typed and retained.
- Sending the entire append-only stream grows without bound and defeats the
  current 32 KiB inline limit.
- Persistence can expose request, source, tool, or model content; telemetry and
  at-rest access need their own privacy boundary.
- A cache checkpoint can become phantom truth if it is allowed ahead of the
  canonical log or cannot be reproduced.
