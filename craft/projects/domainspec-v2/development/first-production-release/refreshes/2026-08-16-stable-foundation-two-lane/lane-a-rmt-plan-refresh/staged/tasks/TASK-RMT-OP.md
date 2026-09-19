# TASK-RMT-OP — Operation

Semantic epoch: `WP-RMT-002/S1/2026-08-16`.<br>
Contract digest:
`75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.<br>

## Contract

Implement DS-D1.4 as a state-changing action with explicit inputs, read/write
sets, guards, external-effect policy, typed outcome, and one versioned
transaction/effect-group observation. The observer must distinguish
transaction ID, effect-group ID, state-write attempt and outcome, durable
outbox checkpoint, stable occurrence identity, commit outcome, and provider
evidence.

State and the durable outbox occurrence commit atomically. Before commit,
failure leaves neither durable state nor a durable occurrence. After commit,
both remain; publication or acknowledgement failure cannot roll them back.
Compensation is forward recovery. No implementation may claim distributed
exactly-once delivery.

## Units

| SWU | Outcome |
| --- | --- |
| RMT-OP-001 | Bind the live active row, Operation schema, S1 decision/epoch, existing Operation/W3 precedent, transaction/effect-group observations, provider-proof separation, target forms, and exact proof denominator |
| RMT-OP-002 | Kill undeclared write/effect, guard/order/atomicity faults, before-state-write and between-state/outbox faults, missing member, mixed commit, rollback after commit, and the shared REL-A controls |
| RMT-OP-003 | TypeScript target/direct provider/native S1 observation proof |
| RMT-OP-004 | Python target/direct provider/native S1 observation proof |
| RMT-OP-005 | Rust target/direct provider/native S1 observation proof |
| RMT-OP-006 | Three-target normalized S1 parity, including transaction, commit, and occurrence semantics |
| RMT-OP-007 | Fresh-process replay and deterministic recovery verification |
| RMT-OP-008 | `enforced_by`, `emits`, exposure, workflow relation evidence, and exact semantic handles or blueprints |
| RMT-OP-009 | Canonical registry non-membership proof for all direct providers |
| RMT-OP-010 | Candidate projection and receipt repeating the S1 epoch and contract digest only |

## Required observations

1. declared inputs plus read/write/effect sets;
2. guard observations;
3. transaction and effect-group identity;
4. state-write attempt and outcome;
5. durable-outbox checkpoint and occurrence identity;
6. commit outcome; and
7. later provider/database/restart evidence kept separate from
   fixture/evaluator representability.

## Minimum acceptance

A failed guard forms no successful state transition. Failure before atomic
commit leaves no state/outbox half-result. A committed state and occurrence are
never erased because publish, acknowledgement, delivery, or consumption later
fails. Retry reuses the same occurrence identity, and the Operation receipt
does not inflate at-least-once publication into distributed exactly-once.
