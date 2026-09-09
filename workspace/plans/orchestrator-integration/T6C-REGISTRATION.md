# T6C — Reviewed native registration

Candidate construction, 2026-09-08. Authority effect: none. Owner-directed scope:
user “next”, under the [D65 boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Construction steps

| Step | State | Result |
| --- | --- | --- |
| T6C1 | Complete; 54 selected Rust tests passed | Immutable reviewed registration in the existing transaction owner |
| T6C2 | Complete; 61 selected Rust tests passed | Restore unresolved capacity and reconcile attempts before startup dispatch |
| T6C3 | Complete; see T6C3 evidence | Operator host map, bounded tick/control loop and shared web projection |

The sibling runtime adds `RegisterReviewedNative` to OrchestratorService. Its
closed registration envelope binds a task, reviewed task digest, review times,
execution deadline, candidate/profile and opaque operator host handle. The handle
contains no socket path or credential. Review fields are caller evidence; this
library API does not authenticate a human review or provision a host. The [T6C3 web registration API](T6C3-INTEGRATION.md) now connects this operation
to an operator-selected immutable host map.

The existing journal persists the request before execution. Execution persists an
immutable intent under the owner's `native-registrations/` directory before run
registration. Temporary-file persistence, file sync and directory sync prevent a
partial JSON file from becoming the accepted intent. One host handle cannot be
rebound to another task, deadline or review. Identity is deterministic from task
and host handle, with one fixed attempt. Identical retries reuse the same run,
including retries after review expiry; fresh expired or future reviews fail.
Prepared transactions recover at their original observation time. A persisted
intent is not permission to dispatch after the execution deadline.

The owner can read and cross-check registration metadata against its run manifest.
`NativeCoordinator::start_registered` passes only the persisted opaque handle to
an operator resolver, then uses the existing coordinator and owner controls.
No second run registry or execution journal is introduced. Existing console
histories are not imported. No service activation or installed budget use occurs.

Startup recovery is implemented in [T6C2](T6C2-RECOVERY.md); web startup and dashboard wiring are completed in [T6C3](T6C3-INTEGRATION.md).

## Validation

[T6C1 evidence](T6C1-EVIDENCE.json) records isolated Rust tests. Registration tests
cover crashes after journal prepare and execution, identical retries after expiry,
changed reviewed text, invalid host paths, expired/future review, live-mode
rejection, conflicting host reuse, and cancellation through the same owner.
Host doubles establish API behavior; real native acceptance remains T6D.

## Open Questions

T6C2 implements reservation recovery and T6C3 invokes it before any
scheduler dispatch. T6D owns real native acceptance. T6C3 must bind the provisioned host map and authenticated
review endpoint, persist provisioning failure/recovery status, drive bounded
ticks alongside controls, and expose shared-owner run views. A supplied review
digest or opaque host handle alone is not authenticated launch authority.
Uncertain receipt/event completion still requires reconciliation without inference
retry. T8 owns live identity, release and budget; MCP remains last.
