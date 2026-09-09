# ARE reasoning-state recovery vertical

Status: implemented candidate plan
Authority effect: none

## Objective

Turn a checkpointed append-only Reasoning State log into reusable process state
without rewriting history or calling a model, provider, network service, effect,
or authority owner:

```text
exact JSONL bytes
  -> verify complete record stream
  -> rebuild disposable indexes
  -> require a final valid checkpoint
  -> hydrate the exact ledger state
  -> append a successor event
```

## Public operations

- `verifyReasoningStateLog(path)` verifies UTF-8, canonical JSONL, record shape,
  one ledger identity, event sequence and predecessor chain, idempotency keys,
  epoch selections, checkpoint bindings, and exact digests.
- `rebuildReasoningStateIndexes(log)` derives event, epoch, and checkpoint
  identities solely from verified canonical records.
- `selectRecoverableCheckpoint(log)` returns an empty disposition for a new log,
  the final valid checkpoint for a complete log, or a typed block for an
  uncheckpointed tail.
- `recoverReasoningStateLedger(input)` rechecks the source after opening its
  append sink, hydrates the verified state, and continues the existing hash
  chain.

## Failure boundary

Recovery blocks on missing required identity, invalid UTF-8, torn final bytes,
blank or malformed records, noncanonical JSON, unknown record kinds, mixed
ledger identities, invalid or duplicate event identities, broken predecessor
chains, invalid epoch selections, invalid checkpoints, source drift during
startup, and any non-empty tail after the last checkpoint.

No failure path truncates, repairs, replaces, or rewrites the source. The last
verified checkpoint may be reported as diagnostic evidence, but an operator
must choose any future repair or successor-log procedure separately.

## Codex integration

File-backed wrapper construction recovers before processing the first app-server
message. It records only the recovery digest, record count, and selected
checkpoint in the diagnostic evidence ledger. The CLI's
`--reasoning-state-log` option uses the same recovery path. Process-memory mode
remains the repository default.

## Verification obligations

- clean checkpointed logs recover byte-identically;
- derived indexes are deterministic and perform zero external calls;
- recovered epochs replay identically;
- the next event continues sequence and predecessor identity;
- empty explicit logs initialize safely;
- malformed, torn, tampered, mixed, unknown, and uncheckpointed logs block;
- source bytes remain unchanged on every blocked recovery;
- Codex startup recovers before accepting a turn;
- wrapper startup blocks an uncheckpointed tail;
- existing routing, context, semantic, consequence, gateway, and regression
  suites remain green.

## Deliberate residue

- A log has one assumed process owner; cross-process locking is not implemented.
- Recovery does not repair or truncate a corrupt or uncheckpointed log.
- Reduction, compaction, branching, cross-stream import, and cache-affinity
  measurement remain successor capabilities.
- Recovery is runtime continuity, not a durable CyberAlchemy Session.
- Admission, acceptance, publication, deployment, and effect authority remain
  separate.
