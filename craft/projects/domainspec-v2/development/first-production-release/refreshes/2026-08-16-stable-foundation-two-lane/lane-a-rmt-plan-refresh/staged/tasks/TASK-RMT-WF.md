# TASK-RMT-WF — Workflow

Semantic epoch: `WP-RMT-002/S1/2026-08-16`.<br>
Contract digest:
`75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.<br>

## Contract

Implement DS-D1.9 as ordered multi-step orchestration across an explicit
intra- or cross-feature scope. Bind step order, preconditions,
failure/continuation policy, forward-compensation intent, and exact versioned
references to Operation transaction/effect-group and State Machine
transition/effect-intent handles without absorbing their authority.

Before commit, a failed Operation may leave no durable mixed result. After
commit, Workflow preserves state and the durable occurrence; publication,
acknowledgement, delivery, or later-step failure routes to retry,
reconciliation, quarantine, or forward compensation. Workflow never expresses
compensation as rollback of committed history.

## Units

`RMT-WF-001..010` follow the common ten-unit cycle after `RMT-SM-010`.
Admission locks exact semantic handles; family owns stale-binding and
rollback-overclaim controls; native providers emit normalized traces and
forward-compensation intents; parity and replay preserve durable-fact behavior;
the candidate receipt repeats the S1 epoch/digest.

## Hostile floor

Reject step reorder/skip/duplication, scope drift, guard bypass,
failure-continuation mismatch, compensation-as-rollback overclaim, direct
effect execution, stale Operation or State Machine binding, lifecycle
transition bypass, and any path that erases committed state or occurrence.

## Minimum acceptance

All three targets agree on normalized orchestration trace, structured outcome,
exact semantic handles, and forward-compensation intent. Workflow proof does
not grant authority to referenced Operations, State Machines, Events, or
relations, and it does not claim distributed exactly-once delivery.
