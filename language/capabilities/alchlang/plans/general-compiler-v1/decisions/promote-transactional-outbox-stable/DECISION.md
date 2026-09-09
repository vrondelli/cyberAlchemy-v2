# Transactional Outbox SQLite Stability

Status: blocked pending owner decision

Target: `transactional-outbox` with binding `sqlite-transactional-outbox`

## Decision

Should the exact source-local conformant Transactional Outbox SQLite pattern be
promoted from `candidate` to `stable` architecture-pattern status?

### PROMOTE-TRANSACTIONAL-OUTBOX-SQLITE-STABLE

Promote the exact pattern and evidence envelope to stable. This records it as a
reusable CyberAlchemy architecture pattern for the proven SQLite boundary. It
does not generalize the evidence to PostgreSQL, brokers, exactly-once delivery,
external publication, deployment or production operation.

### DEFER-TRANSACTIONAL-OUTBOX-STABILITY

Keep the pattern candidate and generatable while more provider, restart or
consumer-idempotency evidence is collected.

### STOP-TRANSACTIONAL-OUTBOX-STABILITY

Stop the promotion effort while preserving the implementation and current
conformance evidence.

“Explain / more context” is available and does not resolve the gate.

## Selection

No option selected.

## Current evidence

- Registry status: available, candidate.
- Exact implementation binding: valid candidate.
- Independent conformance: PASS, 22 checks.
- Generated SQLite tests: atomic commit, rollback and at-least-once retry PASS.

## Authority ceiling

This review artifact performs no promotion. Only an explicit selection by the
CyberAlchemy v2 product owner can authorize updating the owner-controlled
stability record and regenerating its projections. Publication, release,
deployment, credentials and external effects remain outside this decision.
