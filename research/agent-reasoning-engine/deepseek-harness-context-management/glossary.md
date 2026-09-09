# Glossary

| Term | Source kind | Local meaning | ARE reading | Promotion status | Misuse warning |
|---|---|---|---|---|---|
| Canonical context event stream | analogy | Immutable ordered input for reconstructing context state | Dedicated ARE context record, separate from runtime diagnostics | promotion-candidate | It does not itself authorize or prove source truth |
| Event prefix | primary-source | Events through an exact sequence watermark | Local deterministic-reuse unit bound by head digest | borrow-carefully | A stable log prefix is not automatically the provider's request prefix |
| Projection fold | primary-source | Pure reduction of events into current state | Produces Context Envelope and auxiliary read models | borrow-carefully | Must not read ambient mutable state while folding |
| Projection checkpoint | primary-source | Versioned shortcut at an exact event watermark | Disposable cached Context Envelope state | borrow-carefully | May lag the log but must never lead it or become truth |
| Request prefix | primary-source | Ordered provider request bytes before new suffix content | System, tools, rendered context, and earlier messages | borrow-carefully | Object-digest equality does not prove final serialized-byte equality |
| Cache affinity | operator-reading | Conditions under which a provider could recognize the prefix | Request-affinity header plus exact route/renderer identity | research-only | It is not evidence that the provider retained or used a cache entry |
| Shadowing | primary-source | Derived-surface replacement that retains raw events | Bounded Context Envelope may hide a named raw range | borrow-carefully | A shadow or summary must not erase provenance or authority records |
| Successor event | analogy | Appended correction, invalidation, or epoch replacement | Never mutate a predecessor context event | promotion-candidate | Latest-wins is unsafe without typed supersession semantics |
| Selected-dependency drift | local-inference | Change to bytes selected for the current context | Requires a successor projection epoch | existing ARE concept | Unrelated repository drift must not be promoted into a blocker |
| Request series | primary-source | Requests inheriting one canonical header until change or rewrite | Cache-affinity epoch across Codex turns | promotion-candidate | Ordinary turn identity alone does not prove header equality |
| Complete-value event | primary-source | Event carrying a complete new projection state | Prefer complete reference sets over fragile deltas | borrow-carefully | Large immutable payloads should be content-addressed, not duplicated |
| Semantic durability barrier | primary-source | Flush before replay-sensitive request or effect dispatch | Makes recovery distinguish proposed, dispatched, and unknown | promotion-candidate | Do not flush indiscriminately or confuse durability with permission |
| Generation-bound cursor | primary-source | Retrieval continuation tied to an exact source generation | Fail stale when context-search sources change | borrow-carefully | Never return mixed-generation pages because they look mostly current |
| Untrusted context snapshot | primary-source | Immutable bounded import that carries no source instructions or authority | Cross-stream ARE background context | promotion-candidate | Never admit permissions, observations, or tool requests from imported prose |
| Spill | primary-source | Exact large payload retained outside inline context with bounded locator preview | Pressure-reduction option before summarization | promotion-candidate | The spill locator needs independent access control and retention policy |
