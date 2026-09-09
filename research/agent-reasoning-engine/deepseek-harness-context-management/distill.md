# Distilled reusable pattern

```text
live selected sources
        |
        v
append immutable Context Events
        |  canonical truth for reconstruction
        v
exact prefix cut (seq + head digest)
        |
        +--> projection checkpoint cache (behind, never ahead)
        |
        v
pure fold --> frozen Context Envelope
        |
        v
stable renderer --> Codex context fragment
        |
        +--> request-affinity header
        |      (provider/model/system/tools/config/renderer)
        |
        v
provider request --> observed cache-read telemetry
```

## Minimal event envelope

Each event should include:

- `stream_id`, monotonically increasing `sequence`, `predecessor_digest`;
- event type and schema version;
- canonical content and content digest;
- selected source identities and digests;
- consumer/thread/turn scope where applicable;
- temporal and authority posture;
- idempotency key and `authority_effect: none`.

Candidate context event types include request observed, route selected,
definition selected, ontology node/edge locked, item added, exclusion recorded,
contradiction recorded, gap recorded, refresh assessed, envelope sealed,
dependency invalidated, checkpoint created, and context range shadowed.

Every actual model dispatch must be reconstructable from the context prefix
plus its request-affinity header. This is a stronger condition than Context
Envelope digest equality.

## Two caches, never one

1. **ARE projection cache** — controlled locally. Key it by stream, exact prefix
   watermark/head digest, projection-policy digest, selected-dependency digest,
   and renderer version. It accelerates folding.
2. **Provider prefix cache** — controlled externally. Preserve affinity through
   exact request bytes and observe it through provider usage fields. Never use
   it as context truth or currentness evidence.

## Corrections and compaction

Never edit an earlier event. Append a typed successor that supersedes or
invalidates a named predecessor. When the inline projection grows too large,
append a checkpoint/summary that shadows a typed range in the model surface;
retain exact raw events for replay and retrieval. A summary is a derived claim
with its own provenance, not a replacement authority record.

## Context pressure ladder

Apply the cheapest semantics-preserving operation first:

```text
exclude optional diagnostics
→ content-address/spill exact large payloads
→ deterministic structural pruning
→ remeasure
→ bounded summary shadowing only if still necessary
→ block when mandatory meaning still cannot fit
```
