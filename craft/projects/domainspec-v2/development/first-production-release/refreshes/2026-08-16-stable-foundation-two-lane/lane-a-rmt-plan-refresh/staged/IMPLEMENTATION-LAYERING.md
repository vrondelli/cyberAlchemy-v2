# Implementation layering

Semantic plan epoch: `WP-RMT-002/S1/2026-08-16`<br>
S1 contract digest: `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`<br>
Topology change: none; seven types, 70 SWUs, and 189 owned paths remain fixed.<br>

## Decision layers

### L0 — atomic state-changing action

Operation remains first because every later behavioral or orchestration proof
depends on an honest state-mutation boundary. Its S1 denominator observes the
versioned transaction/effect group, state-write attempt and outcome, durable
outbox checkpoint, stable occurrence identity, and commit outcome. State and
the outbox occurrence either commit together or neither commits.

### L1 — guard and boundary

Rule and Interface may run in parallel after `RMT-OP-010`. Their owned paths
do not overlap: Rule establishes pure boolean enforcement; Interface
establishes versioned exposure and compatibility boundaries. Neither gains
publication, compensation, or transaction ownership through S1.

### L2 — transformation and durable fact

Mapping and Event run after both L1 candidates. Event binds persistence,
publication attempt, acknowledgement, delivery, and consumption as separate
observations. Publication is post-commit, at-least-once, and idempotent with
the same occurrence identity. Mapping and Event re-observe the shared W3
effects/connections substrate without treating fixture/evaluator
representability as independent provider, database, restart, or recovery
proof.

### L3 — lifecycle and orchestration

State Machine runs after L2 and returns deterministic next-state plus effect
intents without publishing or compensating. Workflow follows State Machine,
binds exact versioned Operation transaction/effect-group and State Machine
transition/effect-intent handles, preserves durable facts after commit, and
emits forward-compensation intent only. Compensation never erases committed
history.

## Cross-layer fault closure

The eight ordered boundaries are: before state write; between state and
outbox; after outbox and before publish; send failure; success with
acknowledgement timeout; duplicate or reordered delivery; poison occurrence;
and recovery/replay. Closed decode, future version, missing member, mixed
commit, stale binding, occurrence reuse, rollback after commit, and
non-idempotent retry are additional exact hostile controls. No layer may
collapse these into a distributed exactly-once claim.

## Write-ownership strategy

Each type owns the same new admission, family, realization, target,
acceptance, run, and candidate paths as the prior plan. Existing W3/W4
families, targets, validators, factory registry, ontology-v2 live targets, and
prior candidate receipts remain read-only inputs. Direct providers remain
unregistered; canonical registry integration is a later owner decision.

## Failure policy

Before atomic commit, failure leaves neither durable state nor a durable
occurrence. After commit, failure preserves both and routes to idempotent retry,
quarantine, reconciliation, or forward compensation. A semantic ambiguity,
mixed commit, stale handle, non-idempotent retry, shared-source edit, authority
change, external/network effect, destructive action, or failed
acceptance-critical check stops the selected SWU. Repairs that change accepted
bytes require a refreshed inventory, validation, and owner acceptance.
