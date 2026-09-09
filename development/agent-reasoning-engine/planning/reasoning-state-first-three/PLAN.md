# ARE reusable reasoning-state first three

Status: implemented candidate plan
Authority effect: none

## Objective

Implement the minimum product vertical needed to reuse the explicit reasoning
state that produced context:

```text
append explicit reasoning events
  -> seal an exact Reasoning State epoch
  -> reconstruct and verify the outbound model request
  -> checkpoint before the request crosses the boundary
```

## Capability 1: Reasoning State Ledger

The canonical runtime record is an append-only, hash-chained event. Event
content and provenance are canonicalized, digested, immutable, and idempotent.
A Reasoning State epoch selects exact event digests and binds selected
dependencies, a Context Envelope digest, consumer, request, and continuation
frontier. Epoch identity is content-addressed and replay performs no external
calls.

The bounded implementation is
`implementation/agent-reasoning-engine/packages/reasoning-state-runtime`.

## Capability 2: Risk-aligned checkpoints

Required barriers exist at:

- `before-model-request`;
- `before-effect`; and
- `before-continuation`.

The process-memory sink gives deterministic process-local behavior. The
append-only file sink writes canonical JSONL and calls `fsync` at a barrier.
Append, epoch verification, or flush failure blocks forwarding. Checkpoints do
not authorize the operation they precede.

## Capability 3: Exact dispatch reconstruction

Each outbound model request binds:

- the complete canonical JSON-RPC message;
- its exact byte count and SHA-256 digest;
- the Reasoning State epoch;
- provider and model references;
- system, tool, and remaining configuration digests; and
- a deterministic request-header digest.

The wrapper parses the stored request, recreates canonical bytes, and compares
the message, epoch, header, byte count, and digests before forwarding.

## Integration sequence

1. Context preflight completes.
2. Request and context reasoning events append.
3. The exact state epoch seals.
4. The outbound request and request-series header materialize.
5. Reconstruction verification passes.
6. The verified dispatch appends as an immutable reasoning event.
7. The `before-model-request` checkpoint flushes.
8. Only then may the wrapper return the request in `to_server`.

Effect approval and automatic continuation use separate append, seal, and
checkpoint sequences before their boundary can advance.

## Verification obligations

- deterministic and immutable append/idempotency behavior;
- exact epoch selection and tamper detection;
- actual append-only file bytes and `fsync` invocation;
- exact request reconstruction and mismatch rejection;
- model request checkpoint ordered before `turn-start-forwarded`;
- effect checkpoint ordered before approval forwarding;
- continuation checkpoint ordered before successor start;
- failed required checkpoint forwards nothing;
- existing Context Envelope, semantic evaluation, consequence, gateway, and
  app-server tests remain green.

## Deliberate residue

- The repository default remains process-memory until an operator supplies an
  explicit append-only log path.
- File-log recovery into a new process and disposable derived indexes are not
  implemented in this vertical.
- Cross-stream import, reduction, request-affinity measurement, branching, and
  log-derived model fixtures remain successor capabilities.
- No exact implementation binding, conformance assessment, admission,
  publication, deployment, or durable CyberAlchemy Session is created here.
