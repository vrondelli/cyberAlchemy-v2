# TASK-RMT-SM — State Machine

Semantic epoch: `WP-RMT-002/S1/2026-08-16`.<br>
Contract digest:
`75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.<br>

## Contract

Implement DS-D1.14 as a lifecycle transition model with explicit states,
initial/terminal states, triggers, guards, legal transitions,
invalid-transition policy, and deterministic returned effect intents. The
machine owns neither the Operation transaction nor Event publication. It does
not execute effects, publish occurrences, compensate, or mutate hidden state.

Its exact versioned transition/effect-intent handle contains transition
identity, from/to state, and declared effect intents. Workflow may reference
that handle but cannot reinterpret it.

## Units

`RMT-SM-001..010` follow the common ten-unit cycle. Admission binds the S1
epoch and no-execution boundary; family adds closed-decode control; native
providers return the same normalized transition/effect-intent shape; parity
and replay prove deterministic behavior; the candidate receipt repeats the
epoch/digest.

## Hostile floor

Reject illegal transition, initial/terminal drift, guard bypass, undeclared
nondeterminism, effect execution, hidden state mutation, cycle-policy mismatch,
unstable transition identity, invalid-transition success, and unknown members
in a supposedly closed transition/effect-intent result.

## Minimum acceptance

The same current state and trigger yield the same normalized next-state and
effect-intent outcome in all targets. No target performs publication or
compensation. Existing W4 State Machine bytes are read-only precedent until
rebound by the admission and native provider receipts.
