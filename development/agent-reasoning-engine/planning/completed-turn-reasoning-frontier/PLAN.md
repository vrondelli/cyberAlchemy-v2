# ARE completed-turn reasoning frontier vertical

Status: implemented candidate plan
Authority effect: none

## Objective

Make the explicit reasoning result that closes a Codex turn recoverable, not
merely its inbound context or outbound request:

```text
turn/completed
  -> semantic result
  -> continuation result
  -> append exact completion frontier
  -> seal one Reasoning State epoch
  -> fsync after-turn-completion checkpoint
  -> allow automatic continuation
  -> replay after restart with zero external calls
```

## Runtime contract

- `are.reasoning-state-frontier/v1` binds a stable frontier key, completion
  subject digest, consumer and request references, relevant context and prior
  reasoning epoch identities, explicit state, and canonical digest.
- `sealReasoningStateFrontier` appends the frontier event, seals its exact epoch,
  and checkpoints it as one fail-closed operation.
- Recovery indexes only frontiers with exactly one matching epoch and
  `after-turn-completion` checkpoint.
- Derived frontier indexes are disposable; the append-only record stream remains
  the source.

## Codex integration

The wrapper persists the completion message digest, explicit semantic lifecycle
result, continuation result, selected proposal identity, and non-authorizing
posture before forwarding an automatic successor. On restart, an identical
completion replays the prior notification and directive without calling a
semantic input provider, evaluator, continuation provider, effect boundary, or
successor. Different bytes under the same thread and turn identity block.

## Failure and delivery boundary

Any frontier append, epoch seal, or checkpoint failure blocks automatic
continuation. The vertical deliberately chooses at-most-once recovery behavior:
if the process stops after the completion checkpoint but before successor
forwarding, recovery does not guess whether downstream delivery occurred and
does not send the successor again. A future delivery-acknowledgement or outbox
protocol must reconcile that residue explicitly.

## Verification obligations

- frontier identities and bytes are deterministic;
- duplicate equal frontiers reuse identity and changed content conflicts;
- incomplete or mismatched frontier event/epoch/checkpoint chains block;
- file recovery reconstructs exact frontier state;
- duplicate Codex completion after restart performs zero semantic, continuation,
  effect, and successor calls;
- same turn identity with changed completion bytes blocks;
- existing routing, context, semantic, recovery, gateway, and integration suites
  remain green.

## Deliberate residue

- Successor delivery acknowledgement and retry reconciliation are absent.
- The diagnostic runtime journal remains bounded in-memory state.
- Cross-process locking, multi-writer coordination, compaction, branching, and
  distributed durability remain absent.
- A recovered frontier is process continuity, not a durable CyberAlchemy
  Session and not effect authority.
