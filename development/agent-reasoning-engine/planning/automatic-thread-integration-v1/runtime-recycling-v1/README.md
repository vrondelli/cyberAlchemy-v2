# Recycling integrated into the existing ARE loop

Status: local implementation candidate. Authority effect: none.

The existing `runIterativeCodingAgent` now accepts an opt-in `context_recycling`
configuration. It measures the actual rendered prompt before each registered
stateless transport invocation, reserves output capacity, and replaces accumulated
prompt history when the projection reaches the recycling boundary. The new prompt
retains the exact supplied task state and a reference to the full archived history.
The model can retrieve that history through `read-context-evidence`, limited to
1024 UTF-16 code units per call. The explicit tool policy must allow this tool.

Archives and checkpoints live outside the immutable coding fixture. Checkpoints
bind task, fixture, tool policy, prompt context, adapter identity, state, and
budget policy. A request reservation is persisted before invocation and consumed
once in memory. Idle checkpoints resume; uncertain model/tool outcomes and terminal
checkpoints block. Concurrent writers and stale crash locks also block. No retry
or automatic stale-lock removal is implemented.

The transport factory is a trusted integration boundary, not a capability proof.
Its callback must make exactly one stateless request with no internal tools or
retries, enforce the output cap, and measure all provider framing. The tested
adapter is a deterministic byte-counted fake provider. Native SDK and Codex
transports are deliberately unsupported for this option until their actual
request boundaries and token bounds are validated. Ordinary non-opted-in calls
retain their previous behavior; this is not an active default or a live guarantee.

The candidate is proposal-only: `approve: true` is rejected when recycling is
enabled. Exact patch application remains a separate runtime operation. This keeps
uncertain execution from being replayed as a side effect during context recovery.

## Integration surface

Import `createStatelessRecyclingTransport` and `runIterativeCodingAgent` from the
existing coding-agent-runtime index. Supply a stable `run_id`, a registered
transport, and:

```js
context_recycling: {
  directory: "/absolute/private/task-state-outside-fixture",
  context_limit, recycle_at, safety_margin,
  state: {
    objective: request,
    constraints: [], completed: [], pending: [], facts: [], lessons: [],
    evidence_refs: ["exact-source-reference"]
  }
}
```

Limits must be established for the selected adapter; the local fixture values
are synthetic and must not be reused as Luna defaults. A fresh prompt that cannot
fit, missing measurement, denied evidence retrieval, or unknown transport stops
before a model request.

## Evidence

TEST-OUTPUT.tap records the full runtime regression suite. The integration case
runs ten fake-provider steps, recycles eight times, reads earlier archived evidence,
retains supplied constraints and lessons, and produces an awaiting-approval patch
candidate. Additional tests cover independent-process idle resume, a hard process
exit, unknown request/tool outcomes, archive corruption, scope drift, duplicate
event IDs, concurrent writers, cancellation, and exact budget equality.

Run from the implementation's `packages/coding-agent-runtime` directory:

```bash
node --test test/context-recycling.test.mjs
node --test test/*.test.mjs
```

Node 26.8.1 was used. Tests spend no live model credits. The fixture proves exact
supplied-state retention and one successful retrieval behavior, not general
semantic completeness, automatic learning, real model task quality, cost savings,
full power-loss recovery, or production filesystem hardening.

## Open questions

PLAN.md owns the remaining product and operational DAG. HOST-FEASIBILITY.md records
the pinned upstream boundary inspection. Source-matched host integration, live
adapter conformance, dynamic learning-state updates, operator reconciliation,
baseline comparisons, product approval, and activation remain open.
