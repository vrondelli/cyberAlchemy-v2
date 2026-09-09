# WLC-006: collection-timeout diagnosis

One isolated baseline diagnostic run reused the exact WLC-003 binary, mock
backend and before/after process identity checks. No candidate bytes, product
budgets, client timeout or driver timeout were changed. WLC-005's failed attempt
is retained unchanged.

## Findings

- Driver timeout settings were read from the live session: script 30000 ms,
  compared with the runner's existing 10000 ms HTTP abort.
- A constant JavaScript expression returned successfully.
- The next snapshot reported document.readyState interactive, visible window,
  Tauri core present, but receipt export absent. Session availability therefore
  does not imply application/export readiness.
- Subsequent polling obtained a valid receipt. All eight concurrent status
  calls returned true, inactive disconnect returned false, and replay for
  connection zero rejected with the exact expected inactive-connection error.
- Before/after kernel-observed process identities matched the exact binary.
  The owned process group was stopped; the subsequent group audit was empty.

The historical timeout was NOT reproduced. Readiness timing and mismatched
timeouts are diagnostic gaps, not proof of its root cause. No causal performance
claim or general transport-equivalence claim follows from this passing probe.
Treatment semantic checks remain unrun in this slice.

## Artifacts

run.mjs records every HTTP request's start, duration, completion or error in
trace.json. It stores driver-timeouts.json, readiness.json, semantics.json,
receipt.json and closeout.json in a unique run directory. Native logs and
isolated state are retained. No failed request is silently retried as a pass.
Receipt-not-yet-present polling remains distinct from a failed HTTP request.

Run from the repository root with a display available:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-006/run.mjs
```

This launches one mock-backed native session; it is not a read-only checker.
The selected ontology/semantic dependencies remain WLC-005's inherited owned
research scaffolds and exact WLC-003 implementation bindings.

## Construction frontier

Diagnosis has identified missing readiness observations and timeout attribution.
Next proposed implementation: make export readiness an explicit bounded state,
use one total collection deadline, and choose a driver script timeout below the
unchanged HTTP deadline so driver errors can be recorded. Preserve every failed
attempt and test timeout, not-ready, script-error and ready transitions before
rerunning baseline/treatment. This proposal has not been implemented here.

Operational support: Workspace test operator owns host qualification for a future
performance campaign. It does not block harness construction. Instrumentation
overhead, qualified populations, exact experiment registration, product approval,
activation and publication remain pending separate work.

## Open questions

- Was the original request delayed in native evaluation, polling, or UI scheduling?
- Does an explicit readiness state eliminate missing diagnostics without masking failures?
- Do repeated bounded native runs reproduce the timeout?
