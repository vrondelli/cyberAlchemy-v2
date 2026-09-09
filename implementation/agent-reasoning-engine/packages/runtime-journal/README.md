# ARE bounded in-memory runtime journal

This candidate package records immutable, canonical, hash-chained ARE runtime
events in one process. It supports idempotent append, immutable selector cuts,
external-call-free deterministic replay, and explicit eviction of complete
closed-turn segments.

It does not persist to disk, reconstruct evicted contents, authorize an effect,
establish a durable repository session, or provide cross-process or
cross-session recovery. Callers supply observation times; ambient clock state
does not participate in canonical identities.

The Codex wrapper may project its completed semantic and continuation result
into a separately owned checkpointed Reasoning State Frontier. That durable
idempotency boundary does not turn this diagnostic journal into a persistent
source and does not reconstruct its evicted event stream.

Public operations are `createInMemoryRuntimeJournal`, `appendRuntimeEvent`,
`cutRuntimeJournal`, `verifyRuntimeJournalCut`, `replayRuntimeJournal`, and
`evictClosedJournalSegments`.
