# T6B — Native execution coordinator

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [D65 boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Implemented boundary

The sibling runtime now exposes NativeCoordinator around the existing
NativeExecution adapter. The caller supplies the selected run, expected immutable
FixtureBinding, host transport, shared CapacityTracker and owner clock. Start
compares the expected native graph with the registered manifest before dispatch.
The adapter independently checks registered identity, graph, deadline and command
bindings. Task input cannot supply host paths or credentials; real transport uses
the existing private UnixHost opened by the operator integration.

CapacityTracker is extracted from orchestrator_web into a shared library module.
Clones share the same atomic counters, and permits own their counter reference so
they can survive across scheduler ticks. Existing web planner/research dispatch
uses this same implementation. A coordinator keeps its permit through Pending
ticks while NativeExecution renews the original lease and submits fenced receipts
through the existing OrchestratorService writer. The coordinator creates no second
run journal. Supplying another owner directory to tick is rejected.

## Outcomes and capacity

| Outcome | Behavior |
| --- | --- |
| Capacity unavailable or wrong expected binding | No native start; no native lease acquired |
| Owner rejects before dispatch | Unused capacity released; no start counted |
| Pending | Capacity held; owner lease renewed by the existing adapter |
| Verified completion | Existing owner accepts receipt/event; capacity released once |
| Owner cancellation with bound stop acknowledgement | Cancelled, no late result accepted; capacity released |
| Lost start/status response or unconfirmed cancellation | Uncertain; potentially active remote work retains capacity |
| Explicit reconcile_stop receives bound cancellation acknowledgement | Capacity released; an uncertain output remains unresolved |
| Coordinator dropped while remote work may remain active | Capacity quarantined in the current shared tracker, never silently refunded |

Start intent is marked before transport delivery, so a lost acknowledgement returns
an Uncertain coordinator with its permit rather than losing ownership through an
error return. A stopped but unverified outcome never becomes Complete. Repeated
ticks of a terminal coordinator do not dispatch again. Existing attempt guards
prevent fresh starts for interrupted or accepted work; accepted results use the
existing offline owner replay path.

Quarantined counters are deliberately process-local. There is no automatic release
API after dropping an unresolved coordinator. This is conservative resource
accounting, not durable recovery or proof of remote termination.

## Validation and scope

[T6B evidence](T6B-EVIDENCE.json) records 50 passing Rust tests: nine coordinator
cases, five existing native adapter tests, eight supervisor tests, eight owner
transaction/replay tests and twenty web scheduler/capacity regressions. Coordinator
cases cover shared capacity through lease renewal, completion replay, binding and
capacity rejection, cancellation winning over late completion, bad stop bindings,
lost start acknowledgements, quarantine on drop, owner mismatch, lease/deadline
expiry and pre-dispatch rejection. Native host responses are test doubles.

No actual model/fixture provider is dispatched in this stage. The installed native
console, frontend, histories and fixture budget remain unchanged. Public native
web dispatch remains disabled; this stage supplies the coordinator API, not a
new frontend or active dispatch connection.

## Open Questions

T6C must provision and persist the operator-selected host binding for each reviewed
task, register it in one chosen owner, schedule its coordinator, and project state
through the existing service. Before enabling any dispatch after process restart,
it must reconcile existing native attempts and restore reservations for potentially
active remote work. Constructing a fresh empty tracker is not proof that capacity
is free. Dropped-coordinator quarantine has no automatic recovery implementation.

The future tick loop must preserve the adapter's lease interval while allowing
control requests between bounded socket calls. T6D owns real native fixture,
cancellation/uncertainty and restart acceptance through that integrated loop.
T7 retains whole-product acceptance; T8 retains operator identity, release and
live-budget decisions. MCP remains last.
