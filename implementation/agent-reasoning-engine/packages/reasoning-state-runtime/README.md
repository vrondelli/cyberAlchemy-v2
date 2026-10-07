# ARE reasoning-state runtime

This candidate package implements the first reusable-reasoning-state vertical:

1. a canonical append-only ledger of explicit reasoning products;
2. immutable, content-addressed Reasoning State epochs and risk-aligned
   checkpoint barriers; and
3. exact reconstruction and verification of an outbound model request.

The ledger records inspectable system state, not hidden model chain-of-thought.
Its events retain their original evidence and authority posture. Sealing or
reusing an epoch does not admit evidence, authorize an effect, or promote a
claim.

The optional `are.reasoning-plan-context/v1` record preserves a bounded parent
plan reference and content digest, feature obligations, active slice, unresolved
decisions, and source digests for one backend thread. Construction requires an
exact trusted source-digest map and matching thread identity. Append rejects a
stale predecessor; log recovery verifies the per-thread plan chain. The record
can be sealed and checkpointed like other explicit events. It does not derive
scope from a transcript or identify a desktop-host task.

A Reasoning State Frontier is an explicit, content-addressed state record for a
completed reasoning boundary. `sealReasoningStateFrontier` appends that record,
seals its single-event epoch, and flushes an `after-turn-completion` checkpoint
as one fail-closed operation. Recovery admits a frontier into its disposable
index only when the event, epoch, subject digest, and matching completion
checkpoint all verify. The frontier contains inspectable semantic and
continuation products; it is not hidden model chain-of-thought.

Two sinks are included. The memory sink is deterministic and useful for tests
or explicitly process-local operation. The append-only file sink writes one
canonical JSON record per line and calls `fsync` at a checkpoint. Existing
bytes are never rewritten. A required checkpoint failure is fail-closed.

File recovery is checkpoint-bounded and performs no external calls. It verifies
UTF-8 and canonical JSONL bytes, record wrappers, ledger identity, event
sequence and predecessor chains, idempotency identities, epoch selections, and
checkpoint bindings before rebuilding disposable indexes. A non-empty log is
recoverable only when its final record is a valid checkpoint. Torn, malformed,
tampered, mixed-ledger, unknown, or uncheckpointed tails block without changing
the source file.

`materializeCacheAffinityProjection` places a canonical stable request header
and reusable explicit Reasoning State before the volatile current-turn suffix.
Its assessment reports exact/common prefix bytes, estimated reusable tokens,
projection time, and deterministic invalidation reasons.
`materializeContextBoundCacheAffinityProjection` is the fail-closed composition
surface used before reuse. It verifies the exact Context Refresh Assessment and
prior projection bytes, requires the reusable state to bind the current
selected-dependency digest, and emits an immutable receipt for `cold-start`,
`reuse-current`, or `successor-created`. Selected dependency drift can never
remain eligible for exact-prefix reuse through this operation.
`bindCacheTelemetryObservation` can bind explicit provider-reported input and
cached-input tokens plus optional measured/baseline latency to that exact
projection. Missing provider telemetry remains `unobserved`; the runtime never
guesses a cache hit or savings. Cache eligibility and an observed hit prove
neither freshness, provenance, correctness, nor authority.

`acquireReasoningStateWriterLock` provides an adjacent atomic file lock for a
selected append-only log. It prevents a second live writer, is released after a
clean close, and never steals or repairs a lock left by a crashed writer.

The advanced reusable-state surface adds seven bounded mechanisms:

- content-addressed branches append a branch record and seal a successor epoch
  while leaving the base epoch unchanged;
- verified replay-derived fixtures bind exact events and expected replay bytes
  with zero external calls;
- reductions are new append-only events naming retained and omitted source
  events, never destructive summaries;
- risk-scaled checkpoint policy distinguishes observation, model-request,
  continuation, and effect boundaries and blocks insufficient durability;
- counterevidence is reusable only while its exact selected source remains
  current;
- portable epoch bundles require an exact compatibility profile and import as
  a provenance-bearing local event rather than rewriting source identities;
- provenance comparison names every context, dependency, frontier, event,
  consumer, and request difference that prevents exact reuse.

Public operations include:

- `createReasoningStateLedger`
- `materializeReasoningPlanContext`, `verifyReasoningPlanContext`, `appendReasoningPlanContext`, and `getLatestReasoningPlanContext`
- `acquireReasoningStateWriterLock`
- `appendReasoningStateEvent`
- `sealReasoningStateEpoch`
- `verifyReasoningStateEpoch`
- `replayReasoningStateEpoch`
- `checkpointReasoningState`
- `createMemoryReasoningStateSink`
- `createAppendOnlyFileReasoningStateSink`
- `verifyReasoningStateLog`
- `rebuildReasoningStateIndexes`
- `selectRecoverableCheckpoint`
- `recoverReasoningStateLedger`
- `sealReasoningStateFrontier`
- `verifyReasoningStateFrontier`
- `getReasoningStateFrontier`
- `listReasoningStateFrontiers`
- `createRequestSeriesHeader`
- `materializeCacheAffinityProjection`
- `materializeContextBoundCacheAffinityProjection`
- `createReasoningStateBranch`
- `deriveReasoningReplayFixture`
- `verifyReasoningReplayFixture`
- `appendReasoningStateReduction`
- `selectReasoningCheckpointPolicy`
- `checkpointReasoningStateByRisk`
- `appendReasoningCounterevidence`
- `selectReusableCounterevidence`
- `exportPortableReasoningEpoch`
- `verifyPortableReasoningEpoch`
- `importPortableReasoningEpoch`
- `compareReasoningProvenance`
- `assessReasoningStateTransition`
- `planReasoningStateTransition`
- `verifyReasoningStateTransitionPlan`
- `executeReasoningStateTransition`
- `verifyReasoningStateTransitionReceipt`
- `materializeReasoningDispatch`
- `verifyReasoningDispatch`
- `reconstructReasoningDispatch`

The package is a bounded implementation candidate. It provides local
single-writer locking and can reclaim a digest-verified v2 lock left by a
confirmed terminated process on the same host under an exclusive recovery
marker. A live, legacy, foreign-host, invalid, or interrupted-recovery lock
remains fail-closed; inspection alone never removes it. This is not general
stale-lock adjudication, multi-writer coordination, log repair, compaction, or
distributed replication. It does not establish a durable
CyberAlchemy Session, admission, conformance, publication, deployment, or
authority.

The ledger's read-only `checkpoints()` listing returns immutable checkpoint
records. A live entry appears only after `checkpoint()` successfully flushes;
a failed flush is not a retained checkpoint even if its record was appended.
After file recovery, the listing represents exact checkpoints retained in the
verified log. That is not evidence that the previous caller received an ACK,
and it cannot reconstruct a historical fsync failure from surviving bytes.
Consumers must still match the checkpoint's kind, subject, epoch and event head
to the operation they are validating. `inspect().checkpoint_count` counts
recorded checkpoint attempts; it is not a success or operation-completion count.

## Open Questions

Compact full-plan replacement accounting and its Host integration are tracked
in the [DSH continuity analysis](../../apps/desktop-companion/docs/DSH-OBJECTIVE-CONTINUITY-IMPLEMENTATION-ANALYSIS-2026-10-06.md).
General stale-lock adjudication, compaction and distributed replication remain
outside this package's current qualification.
