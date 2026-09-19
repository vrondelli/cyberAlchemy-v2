# TASK-RMT-EVENT — Event

Semantic epoch: `WP-RMT-002/S1/2026-08-16`.<br>
Contract digest:
`75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.<br>

## Contract

Implement DS-D1.12 as a past-tense immutable fact with typed payload, closed
schema version, stable occurrence identity, durable persistence checkpoint,
and explicit consumer contract. Persistence, publication attempt,
acknowledgement, delivery, and consumption are separate observations.

Publication occurs only after the state-plus-outbox atomic commit, is
at-least-once, and retries idempotently with the same occurrence identity.
Send failure or ambiguous acknowledgement preserves the durable fact.
Duplicate, reordered, poison, and recovery/replay paths must not rewrite
history or manufacture a distributed exactly-once claim.

## Units

`RMT-EVENT-001..010` follow the common ten-unit cycle. Admission binds the
S1 epoch and separate observation denominator; family owns exact S1 controls;
native provider units expose the observation model; parity compares normalized
semantics; replay owns restart/recovery and acknowledgement ambiguity; the
candidate receipt repeats the epoch/digest.

## Hostile floor

Reject command/future-tense substitution, mutable payload, unstable or reused
occurrence identity, missing/multiple checkpoint, publish-before-commit,
consumer overclaim, schema drift, and distributed exactly-once inflation.

Additionally reject with stable codes: after-outbox/before-publish failure that
erases durable facts; send failure rollback; success/ack timeout collapse;
duplicate or reordered non-idempotent handling; poison occurrence history
rewrite; recovery/replay identity drift; future version; occurrence reuse; and
non-idempotent retry.

## Minimum acceptance

All three targets agree on event identity, payload semantics, closed decode,
checkpoint ordering, publication policy, acknowledgement ambiguity, and
recovery behavior. Retry retains one occurrence identity. Native serialization
bytes need not match unless an exact wire catalogue is separately bound.
Fixture/evaluator representability does not satisfy independent provider,
database, restart, delivery, or consumer proof.
