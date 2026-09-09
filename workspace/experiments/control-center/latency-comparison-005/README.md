# WLC-005: IPC semantics and overhead control

Product construction continues the WLC-004 native probe without altering either
frozen executable. Selected meanings remain the owned research ontology's
D01/D03/D08 scaffolds bound by WLH-001. No ontology or operational admission occurs.

## Completed construction

Four tests exercise the installed Tauri 2.11.5 ipc-protocol.js source in a VM
with synthetic transport responses: successful false values, native error callback
selection, message preservation on fallback, and persistent fallback after the
first transport failure. This establishes bounded source behavior, not complete
transport equivalence, exactly-once effects or the cause of the observed fallback.
Concurrent failures, retries after a response was lost, and event-channel ordering
are not proven by these tests.

semantics.mjs adds live checks for eight concurrent status calls, false from
disconnecting inactive connection zero, and the exact inactive replay error.
These issue no turn, approval or live-model requests. run.mjs reuses the isolated
launch and before/after process-identity checks from WLC-004.

The uninstrumented WDIO frontend control builds successfully. It uses the original
hash-bound app, bridge and recorder, retaining speculative warmup and aggregate
metrics while omitting both the probe and receipt export. Output inspection confirms
WDIO code is present and the probe/export/barrier are absent. Its build output
hashes are retained in EVIDENCE.json. Other frontend dependencies remain workspace
resolved: this is not a hermetic build.

## Native attempt: blocked

The baseline run in runs/baseline-Y1fp5P timed out in the WebDriver phase-receipt
collection request before semantic checks ran. Failure and closeout are retained;
the owned process group was stopped and the subsequent group audit was empty.
Treatment was not launched. The source fixture PASS must not substitute for these
unevaluated native checks. No timeout budget was raised or failure suppressed.

## Remaining construction

1. Diagnose the intermittent WebDriver collection timeout with bounded readiness
   and transport observations; preserve the failed attempt.
2. Run the added native semantic checks on exact binaries after that diagnostic.
3. Build an isolated native executable embedding the uninstrumented frontend.
4. Register an exact overhead comparison against WLC-003 baseline: both retain
   original warmup; only instrumentation differs. The proposed overhead threshold
   remains 1 ms, separate from unchanged product budgets.
5. Collect qualified populations before making overhead or treatment claims.

Native control identity, qualified overhead samples and equivalence results are
not_evaluable. Existing 40-qualified-session and 60-attempt limits are unchanged.
Do not use the instrumented treatment arm as the overhead control: it also changes
warmup scheduling and would confound the comparison.

## Commands

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-005/semantics.test.mjs
node cyberAlchemy-v2/workspace/runtime/node_modules/vite/bin/vite.js build --config cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-005/overhead-control.config.mjs
```

run.mjs launches local GUI apps with a mock backend and retained isolated state;
it is not a read-only validator. No automatic retry follows a failed attempt.
The research-evidence harness keeps synthetic tests, native probes and future
qualified performance measurements distinct.

## Operational support and open questions

Workspace test operator owns host qualification for the future campaign; this
does not block readiness diagnostics or native-control construction. Product
approval, activation, lab reconciliation and publication remain deferred.

- What caused the WebDriver execute timeout after prior successful native probes?
- Why does custom-protocol IPC fail in this environment?
- Does fallback preserve event delivery and ordering under concurrency?
- Is qualified instrumentation overhead below the unchanged research threshold?
