# C2 read-only host-history verification

Status: bounded local implementation, 2026-09-26. This is diagnostic
reconciliation evidence, not unknown-delivery resolution or same-task cutover.
The [work-pack](../INTEGRATION-WORK-PACK.md) owns C2 scope.

## Boundary implemented

After recovery, an accepted `turn/start` with an unknown gateway delivery
outcome continues to block backend mutations. A Codex App Server
`thread/read` with `includeTurns: true` can now inspect the matching backend
thread. The gateway verifies exactly one history turn matching the durable
acceptance receipt's thread, request and turn hashes. It records a bounded
`turn-history-verified` observation with the host turn status and a response
digest, without storing the host transcript, request key, or raw IDs in that
observation. Missing, ambiguous, mismatched or unrecognized history does not
prove non-delivery and creates no positive receipt. Repeated reads at the same
status do not grow the receipt set. The generic backend adapter does not use
this Codex-specific interpretation.

The store requires both an unresolved durable `turn/start` intent and a prior
matching `turn-start-accepted` receipt before admitting the history fact. It
preserves that fact through file compaction and reopen. An append failure
withholds the diagnostic response and stops the gateway session. History
verification does **not** mark the request complete, restore the wrapper's
in-memory turn state, permit redispatch, or establish an exclusive desktop
writer. The unknown-outcome block stays in force even when the host reports a
terminal turn.

## Validation

- Focused verifier, store, gateway and Threads projection tests: 70/70 passed.
- The restart fixture verifies no receipt for missing history, one receipt for
  an exact completed turn, no duplicate receipt on repeated reads, redaction
  of private prompt and IDs, and continued rejection of a new mutation.
- The file-store fixture rejects a history fact without prior acceptance and
  retains the unknown dispatch and verified history after compaction/reopen.
- Full wrapper package suite: 285 passed, one platform skip, zero failures.
- Desktop bridge now accepts retained accepted-turn and verified-history
  counts for existing Reasoning State rows. `cargo check --offline` through the
  repository toolchain and nine dashboard source tests passed. The dashboard
  has not been relaunched or repackaged for this change.
- ARE `doctor --json` and scoped `git diff --check`: passed.
- The pinned native `--gateway-wrapper` loopback canary passed with one turn
  dispatch and replay without redispatch. It made zero external model calls,
  did not change active hook configuration, and did not activate this task.

## Open Questions

- Which supported host contract can prove exclusive ownership of this exact
  desktop task, including a quiesced direct client and a rollback path?
- How can the wrapper reconstruct its full active or terminal turn state from
  a host-history fact and Reasoning State without replaying private history or
  incorrectly crediting work it did not observe?
- What authoritative acknowledgement, if any, can distinguish wrapper
  delivery from host completion and safely release an unknown gateway outcome?
