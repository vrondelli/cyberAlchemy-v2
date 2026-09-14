# Orchestrator Runtime API

Status: implementation candidate  
Authority effect: none

- `RunBundle::new/validate` binds graph bytes, engine version, deadline, and authority references.
- `DurableRunController::register/open` creates or recovers one durable run.
- `accept_event` calls the stateless RWO transition API and commits through `FileAcceptedHistory`.
- `acquire/begin/complete` enforce command, worker, lease, fence, receipt, event, and effect boundaries.
- `recovery/resolve_unknown/accept_recorded_event` expose explicit restart and uncertainty handling.
- `cancel/expire_if_due` persist terminal control transitions.
- `OrchestratorRuntime::poll` selects compatible pending commands under a global bound.
- `WorkerApi` exposes typed poll, begin, and complete requests without direct history access.

The standalone HTTP adapter exposes that same boundary at `POST /api/v1/workers`.
Its run read model projects durable leases, receipts, accepted event bodies, and
bounded digest-verified previews of JSON output artifacts owned by the run.

The filesystem implementation assumes one logical runtime writer. Cross-process
locking, remote authentication, and power-loss durability measurements remain
operational work.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
