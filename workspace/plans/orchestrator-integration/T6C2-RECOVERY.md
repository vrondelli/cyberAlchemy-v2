# T6C2 — Native startup capacity recovery

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”, under [D65](../../../agent-routing/ROUTER.md#d65-construction).

## Implementation

The sibling runtime `native_recovery.rs` adds `NativeRecovery::open`, called under
the existing owner lock before exposing any shared capacity to executors. It scans
all registered runs for native attempt evidence, including pre-registration-API
histories in that owner. It does not import another console's history. Every
present attempt must parse and bind to the registered identity, graph, task,
command, fence and execution deadline. Invalid evidence returns an error without
exposing a tracker. The scan makes no host calls and acquires no leases.

Accepted attempts require existing offline receipt/event replay verification.
All other attempts reserve capacity unless they contain a correctly bound durable
recovery stop acknowledgement. Prepared intents, expired leases, host-completed
but unaccepted output and legacy `cancel_acknowledged` booleans remain unresolved.
Reservations include every unresolved attempt even when the operator lowers the
configured limit below their count. Restored reservations do not count as new
starts. Available capacity is clamped to zero when over limit.

`reconcile_stop` checks the original owner and unchanged attempt evidence, sends
only a digest-bound cancel request to the operator-selected host, validates the
acknowledgement, and atomically persists it before releasing the permit. Errors
retain the reservation. It never accepts uncertain output, clears a dispatch guard,
restarts inference or claims completion. Dropping unresolved recovery state
quarantines its slots in any remaining tracker clones. A later startup validates
persisted stop evidence and does not reserve those stopped attempts again.

The existing shared CapacityTracker gains a crate-private restoration method.
The native adapter's existing durable save helper is reused. Execution ownership,
leases, controls and receipt/event writes remain with their existing owners.

## Validation

[T6C2 evidence](T6C2-EVIDENCE.json) records the selected Rust regression suite and
source hashes. New host-double tests cover restart reservation, unavailable host,
wrong stop binding, durable stop replay, accepted history without host calls,
corrupt or mismatched attempts, lower capacity limits, dropped recovery state,
wrong owner, changed attempt evidence, prepared/legacy stop markers, and a
filesystem failure after host acknowledgement that must retain capacity. Real native fixture acceptance remains
T6D. Installed services and budgets are not changed by this library construction.

## Open Questions

T6C3 must call this factory before sharing capacity with the web scheduler, own
exactly one recovery instance for the selected owner, bind the operator host map,
and process stop reconciliation alongside bounded coordinator ticks and controls.
`CapacityTracker::new` remains available to existing callers; this task does not
claim the web startup path already invokes recovery. Research executor recovery
continues to follow its existing owner semantics. No uncertain native completion
is reconstructed or accepted here; receipt/event handoff recovery remains explicit
future work. T6D owns actual native acceptance and T8 owns live deployment/budget.
