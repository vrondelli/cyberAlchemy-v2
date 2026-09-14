# Orchestrator Runtime

Status: implementation candidate  
Authority effect: none

The local runtime registers immutable Run Bundles, persists one accepted-history
state per run, applies accepted events through `rwo-core`, atomically stores the
next cursor and complete command batch, leases commands with fencing tokens,
records receipts and effect disposition, blocks unknown effects, recovers after
restart, enforces deadlines and cancellation, and schedules across runs under a
global capacity bound.

The runtime contains no second graph reducer. `rwo-core` is its only normal
structural dependency.

See `API.md` for the current Rust boundary.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
