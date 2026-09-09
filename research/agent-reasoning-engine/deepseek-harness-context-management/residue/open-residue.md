# Open residue

1. Codex app-server's final provider request bytes are not visible at the ARE
   wrapper boundary; `additionalContext` placement and serialization need an
   empirical seam or usage telemetry.
2. The current runtime journal intentionally evicts complete closed-turn
   segments and cannot reconstruct evicted content. It therefore cannot be the
   durable context source without a changed contract.
3. The event vocabulary needs an ownership decision: extend `runtime-journal`
   or create a separate context-event stream. This research recommends the
   latter to avoid mixing diagnostic events with model context.
4. Context correction/supersession semantics are not defined.
5. Compaction must reconcile exact provenance with bounded inline bytes without
   generative summaries becoming facts.
6. Persistence format, encryption, access, retention, and deletion policy are
   unresolved.
7. Provider cache reporting may be absent or aggregated; a negative observable
   is not automatically proof of byte instability.
8. No performance or cost improvement has yet been measured for ARE.
9. ARE has no complete request-affinity identity covering system prompt, ordered
   tool schemas, provider/model, call configuration, and renderer.
10. The Codex app-server seam does not yet expose a reconstruction invariant or
    provider usage record bound to the exact request.
11. Context-import authorization, framing, recursion prevention, and untrusted
    posture are undefined.
12. Exact retrieval over compacted or spilled context has no service contract.
13. Durability checkpoints before model dispatch and external effects have not
    been designed for the app-server proxy.
