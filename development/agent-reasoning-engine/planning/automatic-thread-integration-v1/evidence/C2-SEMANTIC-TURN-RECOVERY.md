# C2 checkpointed semantic turn recovery

Status: bounded local implementation, 2026-09-26. The
[work-pack](../INTEGRATION-WORK-PACK.md) owns the C2 gate. No current desktop
task, installed gateway, or operator storage path was activated.

## Boundary implemented

Before forwarding `turn/start`, the wrapper checkpoints the complete explicit
semantic turn state, including the selected request/context, route decision,
Reasoning State epoch and optional intent contract. This is private Reasoning
State, not a dashboard or diagnostic projection. On an accepted host response,
the wrapper checkpoints the exact RPC-to-turn binding before delivering the
response. A rejected host response checkpoints rejection and clears the pending
state. A successful response without a turn identity is withheld. Recovery
verifies the Reasoning State log and state digests, replays
pending and bound turns, and removes completed turns using their persisted
completion frontiers.

The runtime journal remains process-local. For each recovered active bound turn,
the wrapper emits a new `turn-state-bound` journal event marked
`reasoning-state-recovery` and anchored by the verified binding event digest.
This is a reconstruction of context-binding evidence, not a new host
observation or recovery of the old journal's full history. It supplies the
verified per-turn cut required for semantic completion after restart. Invalid
or undurable bindings fail closed. Gateway and legacy stdio wrapper-path
exceptions stop the affected backend session rather than leaving it able to
accept further writes after a withheld response.

## Validation

- A file-backed wrapper restarts with a bound active turn and evaluates its
  completion from recovered explicit state and reconstructed binding evidence.
- A rejected start is not recovered as pending. Closing the Reasoning State
  ledger before binding causes the wrapper to withhold the accepted response.
- A gateway fixture and a legacy stdio-proxy fixture stop the backend after a
  wrapper binding failure and return only a failure diagnostic. A response
  missing the host turn identity is also withheld.
- A combined acknowledged-gateway and file-backed-wrapper fixture restarts
  both processes, authenticates the resume token, restores the bound turn,
  and checkpoints its completion without redispatch. This fixture does not
  exercise opt-in semantic evaluation; the separate file-backed wrapper
  fixture covers that behavior.
- `npm test` in `packages/codex-app-server-wrapper`: 295 passed, one platform
  skip, zero failures. This is local evidence, not installed-host proof.

## Open Questions

- Reconcile accepted-but-unknown host turns before retry or handover. A bound
  wrapper turn does not make an unknown gateway outcome safe to redispatch.
- Prove the exact desktop task has one writer, complete event ingress and
  effect enforcement. The current task is not ARE-controlled.
- Decide the private storage root, access policy and retention before live
  durable operation. This prototype does not prove physical erasure.
- Verify full interaction-learning and runtime-journal history behavior after
  restart; this slice restores only explicit semantic turn state and its
  context-binding evidence.
