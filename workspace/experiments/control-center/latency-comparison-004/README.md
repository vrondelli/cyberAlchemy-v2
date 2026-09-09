# WLC-004: native receipt collection

Runs the exact WLC-003 baseline and treatment executables with an isolated
SQLite database, data/cache/config directories, local mock Codex backend and
loopback WebDriver endpoint. No model request, approval resolution, or protocol
drift bypass is enabled. Original app state and production builds are untouched.

## Product construction

The prototype meaning and ontology dependencies remain the WLC-003/WLH-001
bindings to owned are.research-learning D01/D03/D08. This slice adds Linux process
identity evidence around the existing phase-export contract, not new semantics.

Sequence: verify exact native artifacts → launch baseline → verify process →
collect native receipt → verify same process again → close owned process group →
repeat for treatment. Failure preserves artifacts and stops before the successor.

process-identity.mjs records PID, process start ticks, boot ID, executable path
and SHA-256 of /proc/PID/exe. run.mjs compares these before/after collection with
the bound native artifact. This is local kernel-observed identity evidence, not
remote attestation. It does not qualify host load or establish causal performance.

The collector reads one live receipt snapshot through the embedded W3C WebDriver
execute endpoint. Positive and negative identity fixtures use the research-evidence
harness. Two actual native runs are separate from those fixture tests.

## Results and limitations

Both initial native receipt probes passed. Their logs, phase receipts, isolated
state and process closeouts are retained under runs/. These are one session per
arm on an unqualified host with a synthetic upstream: do not report population
p95, benefit, full ARE protocol conformance or campaign success from them.

The native logs report custom-protocol IPC falling back to postMessage. Receipt
collection succeeded, but that fallback remains a diagnostic for the next semantic
and overhead checks. No repair or suppression of this warning was applied.

run.mjs preserves successful and failed attempts in unique directories. It starts
one new process group and stops only that group. There is no broad process cleanup
or automatic deletion of retained evidence. The group audit after the initial
two runs found no remaining group members.

## Commands

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-004/identity.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-004/run.mjs
```

The second command launches two local GUI sessions with the local mock backend;
it is not a read-only verification command. Requires a working display and Linux
/proc. It never implicitly runs the 40-session benchmark campaign.

## Next construction and operational support

Next construction: explicit semantic checks for event ordering and transport
fallback, plus an instrumented/uninstrumented overhead comparison. The current
two variants both contain instrumentation, so they cannot estimate its overhead.
Only then can exact experiment registration and campaign prerequisites be closed.

Workspace test operator owns qualified-host preparation for the future campaign.
This does not block semantic-test implementation. Existing budgets, 40 qualified
sessions per arm and 60-attempt limit remain unchanged. Product approval, activation,
lab reconciliation and publication remain separate deferred decisions.

## Open questions

- Why does this environment take the postMessage fallback, and is it equivalent?
- Does instrumentation stay within the proposed overhead allowance?
- Do all existing semantic and performance contracts pass on a qualified host?
