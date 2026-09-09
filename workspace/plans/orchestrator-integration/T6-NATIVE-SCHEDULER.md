# T6 — Native executor in the main scheduler

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [D65 boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Construction DAG

| Task | Depends on | State | Deliverable |
| --- | --- | --- | --- |
| T6A | T5 | Complete | Select executor contracts before acquiring scheduler leases |
| T6B | T6A | Complete | Native execution coordinator with bounded host binding, ticks and shared capacity |
| T6C | T6B | Complete (C1/C2/C3) | Explicit reviewed-task registration and shared run/control projection |
| T6D | T6B, T6C | Complete | Real isolated native fixture acceptance, cancellation, uncertainty and restart |

T6 is complete within [isolated fixture acceptance](T6D-ACCEPTANCE.md). T7 whole-product acceptance is next; the T8 operator
identity, release/rollback and live-budget gates remain deferred operational work.
These gates do not block local construction. MCP remains last.

## Findings and T6A implementation

The sibling already has NativeExecution start/tick, fenced receipts, offline owner
replay and a private host protocol. The standalone fixture driver exercises that
adapter, but the web scheduler still runs its research/demo executor path. Native
execution cannot simply be placed after web polling: NativeExecution owns its own
lease acquisition, whereas the web dispatcher previously leased a command under
the research worker identity before checking its contract.

T6A adds contract-filtered PollNextForContracts and PollRunForContracts requests
through the existing OrchestratorService transaction owner. The supervisor checks
the pending command before lease acquisition. Untargeted selection skips unsupported
contracts without consuming their lease or advancing the fairness cursor for them.
Targeted unsupported selection returns a diagnostic. Recovered leases must match
the selected contract set; a mismatched owned lease requires attention instead of
silently assigning that worker another run. Empty filters acquire nothing.

Global active-run capacity still counts all executors. Existing unfiltered APIs
remain compatible. Automatic selection also excludes paused records in the final
dispatch loop. The web scheduler supplies its exact research, closeout and demo
contracts and ignores native/unknown commands during its executable-work scan.
Native tasks remain available to their separate owner; public web native dispatch
is still disabled. A filter is a scheduling selector, not permission to execute.

[T6A evidence](T6A-EVIDENCE.json) covers rejection before leasing, mixed queues,
shared capacity, recovery/fencing, empty filters, pause/resume, web continuation
past unsupported work, native adapter regressions and transactional replay.
These Rust tests use temporary state and native host doubles. They do not prove
new real App Server dispatch through the main scheduler; T6D owns that proof.

## Next integration boundaries

[T6C registration](T6C-REGISTRATION.md) implements the immutable owner handoff.
[Startup capacity recovery](T6C2-RECOVERY.md) is complete as an API.
The [T6C3 integration](T6C3-INTEGRATION.md) connects recovered capacity, native ticks,
operator host bindings and Workspace controls. T6D passes real native acceptance; T7 remains whole-product acceptance.

[T6B](T6B-COORDINATOR.md) supplies the native coordinator and shared owned
capacity permits. It retains uncertain reservations, supports explicit stop
reconciliation, and never retries start. Host socket/token selection remains an
operator binding. T6C must wire the tick/control loop and restore unresolved
reservations before dispatch can resume after a process restart.

T6C must register each new task once in the chosen main owner and project its
receipt from there. Existing console histories must not be copied into a second
writer or replayed as new work. Exact task review, host provisioning and scheduler
registration need a recoverable handoff before any UI connection changes.

T6D must cover a real native fixture through this coordinator, cancellation and
lost-status cases, restart replay, mixed executor capacity and unchanged installed
history/budget. T5's three-source tests remain relationship evidence, not proof of
this later scheduler path.

## Open Questions

Which host provisioning handle binds one immutable reviewed task to the shared
scheduler? How is registration reconciled if the host is prepared but dispatch
ownership is not committed? What exact recovery may finish a receipt/event handoff
without repeating inference? T6B/C must resolve these construction questions before
public native dispatch is enabled.

Live-provider authority, VPS socket mounts/identity, release selection and budget
remain operator-owned T8 residue. T7 retains Tauri/manual/performance acceptance.
The installed frontend and native console are unchanged by T6A.
