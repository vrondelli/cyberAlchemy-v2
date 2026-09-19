# Reference generation seal review

Approved as an offline helper; all three independent test groups pass. Exact source hashes are recorded in [the review receipt](REFERENCED-GENERATION-SEAL-REVIEW.json). The actual stage-guard test persists sixteen large results, writes a compact final reference record below 8 KiB and hydrates all payloads without loss.

Source confinement, exact external slot bindings, file hashes, JSON roundtrip and recomputed summaries reject the tested corruption and identity failures. Canonical serialization matches the existing stage writer.

The wrapper still owns complete fixed-slot persistence, domain accounting, deterministic validation and transport settlement. The serialized-size check does not guarantee physical allocation or reserve admission; the shared final-write guard remains mandatory. Source records must remain available and immutable. No live integration is approved.

## Open Questions

Wrapper failure/placeholder semantics and scorer hydration remain under [the helper contract](REFERENCED-GENERATION-SEAL.md).
