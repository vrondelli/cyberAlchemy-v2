# C2 automatic-successor gateway intent

Status: bounded local implementation, 2026-09-26. This is not activated
desktop-task control or complete wrapper recovery. The
[work-pack](../INTEGRATION-WORK-PACK.md) owns C2 scope.

## Boundary implemented

In an acknowledged gateway session, a wrapper-generated automatic
`turn/start` now receives a gateway-owned upstream ID and deterministic
internal request key. The gateway appends a durable `dispatch-intent` for the
exact method, parameters and backend thread before writing to the host. A
successful Codex response records the existing content-free host acceptance
receipt before wrapper processing, then records the generated request's
`dispatch-outcome` before releasing wrapper output. A missing intent or outcome
receipt stops the session without reporting success. External clients cannot
submit or alias the internal key namespace.

After restart, any unresolved durable backend mutation blocks both
client-originated writes and wrapper-generated mutations. A read-only history
check remains available. Other server-generated backend mutations are rejected
in acknowledged sessions until they have an explicit durable dispatch contract.
The legacy non-acknowledged transport retains its separate compatibility
ceiling and does not gain this recovery claim.

This closes a gateway writer bypass. The later
[semantic turn recovery slice](C2-SEMANTIC-TURN-RECOVERY.md) separately restores
explicit per-turn state for a local file-backed wrapper restart; neither slice
proves host exclusivity, establishes App Server request idempotency, or
authorizes automatic retry of an unknown outcome.

## Validation

- Gateway suite: 45/45 passed. A recovered unknown accepted turn cannot cause
  an automatic successor; a new successor has a durable unknown intent before
  host dispatch and a completed outcome after a bound host response; an intent
  append failure withholds dispatch. Reserved internal keys are rejected from
  client requests. A real-wrapper-through-gateway fixture confirms the
  completion frontier and automatic successor use this path together.
- Full wrapper suite: 288 passed, one platform skip, zero failures.
- ARE `doctor --json` and scoped `git diff --check`: passed.
- The pinned native `--gateway-wrapper` loopback canary passed with one
  dispatch and replay without redispatch, zero external model calls and no
  active hook-configuration change. None of these checks is a live task
  handover or installed-Companion test.

## Open Questions

- Which interaction-learning state and additional runtime-journal history must
  be restored before a post-restart host completion can make all learning and
  continuation decisions rather than only the bounded semantic decision?
- How will the host and gateway prove one writer for this exact desktop task,
  including direct-client quiescence and rollback?
- Which additional server-generated backend mutations, if any, need a durable
  request contract rather than fail-closed rejection?
