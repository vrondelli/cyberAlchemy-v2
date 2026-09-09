# T6D — Real native acceptance through the shared scheduler

Candidate acceptance, 2026-09-08. Authority effect: none. Owner authorization:
user “next”, under [D65](../../../agent-routing/ROUTER.md#d65-construction).

## Result

T6D passed all four scenarios. T6 is complete within the isolated native-fixture
construction boundary. T7 whole-Workspace acceptance is the next product task.
The candidate uses real `orchestrator_web`, its NativeScheduler/coordinator and
recovery, the private Unix host, pinned ARE/Codex App Server transport, and a
loopback Responses fixture. There were four fixture provider calls, one per
scenario, and zero paid/external model calls. Tools remained disabled and output
was bounded to 512 tokens on the configured `gpt-5.6-luna` fixture path.

| Scenario | Observed acceptance |
| --- | --- |
| Delayed completion | A 6.5-second fixture delay crosses the native lease interval; the accepted result verifies against owner history. A competing demo stays at zero progress while the native attempt holds the sole slot, then completes after release. |
| Cancellation | The existing owner records cancellation; the real native host stops, capacity releases, and no successful output is projected. |
| Owner restart | Killing the web process while the host is running restores a reservation before dispatch. Explicit stop persists its acknowledgement; another restart restores zero active slots, with no repeated inference. |
| Host disconnect | Hiding the Unix endpoint produces uncertainty with capacity retained. Restoring the endpoint permits explicit stop. Restart conservatively reserves the prior live-coordinator uncertainty again; durable recovery stop reconciliation resolves it without another inference. |

Each scenario registers the exact reviewed task twice through the web API and
gets the same run key. Exactly one provider fixture request occurs per scenario.
The completed case closes its native host, restarts the owner, verifies offline
replay, and projects the actual result through the Workspace gateway with its
text-task icon. Workspace preserves `source-reported` HTTP provenance rather than
claiming independent verification. All owner and host state is temporary.

## Evidence and reproduction

[T6D evidence](T6D-EVIDENCE.json) links the aggregate receipt, four projections,
source hashes, binary hash, candidate manifest hash and test log.
[The harness](test-shared-native-acceptance.mjs) takes:

```text
node test-shared-native-acceptance.mjs CONSOLE_CONFIG SHARED_WEB_BINARY FRONTEND OUTPUT_DIR
```

Run from the Workspace checkout with the repository's existing ICU library path.
Build the sibling `orchestrator_web` through `tools/toolchain/run` first. The
console config selects the pinned candidate and supplies the installed ledger
path for a before/after hash check. It is not used to launch installed tasks.
The harness creates isolated hosts and web owners, kills only its own child web
processes for recovery tests, and removes its temporary state in cleanup.

The installed native task ledger is byte-identical before and after. Installed
services, frontend, configuration and launch budget were not changed. No VPS
operation was performed.

## Initial startup diagnostic

The first fresh attempt timed out waiting for App Server `initialize` before any
fixture request. It was cleaned up and its diagnostic is retained as
[t6d-evidence/startup-first-attempt.json](t6d-evidence/startup-first-attempt.json).
A minimal initialize probe against the same pinned executable succeeded. The
normal initialization contract was checked against the
[official App Server documentation](https://learn.chatgpt.com/docs/app-server).
No host implementation or pinned candidate was changed to obtain the successful
run. A subsequent fresh harness execution passed all four scenarios. The cause
of the initial transient timeout is not established; the harness now captures a
bounded initialization-only diagnostic if this pre-dispatch failure recurs.

## Open Questions

T7 retains complete browser/Tauri journeys, real assistive-technology acceptance,
performance/load checks, and the existing catalog snapshot and older browser
suite residue. The T6C3 browser control journey uses an HTTP host double; this T6D
journey exercises real native transport and Workspace projection programmatically.
Neither alone claims the entire product acceptance campaign is complete.

Selecting an installed shared-scheduler connection, automatic host provisioning,
live credentials/budget and VPS release remain outside this isolated fixture
acceptance. The source-task composer retains its existing selected console.
Uncertain output is never accepted by stop reconciliation. The initial startup
timeout remains a startup reliability observation, not an authorization to retry
an already-dispatched task. MCP remains last.
