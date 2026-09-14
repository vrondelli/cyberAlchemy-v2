# Orchestrator API

Status: implementation candidate  
Authority effect: none

The API exposes health and adapter readiness, immutable templates and proposals,
explicit proposal admission, run projections, cancellation, and recovery. Every
state-changing request requires an exact `X-Orchestrator-Intent` header. The API
owns transport and persistence; it delegates structural state to the runtime and
RWO.

`POST /api/v1/workers` exposes the transport-neutral worker boundary over HTTP.
A caller sends one tagged `poll`, `begin`, or `complete` request with the
`X-Orchestrator-Intent: worker-operation` header. Polling acquires a durable
lease, beginning checks its worker and fencing token, and completion records a
receipt before its event may advance the RWO cursor. Run projections retain all
three records so the Control Center can explain what was assigned, executed,
recorded, and accepted.

`GET /api/v1/operations` projects scheduler capacity, run population, pending
commands, recovery items, Gateway reachability, and durability for the
read-only Operations dashboard.

Set `ORCHESTRATOR_TEMPLATE_CATALOG` to a directory whose immediate children
contain immutable `strategy-template.json` and `run-template.json` files. The
packaged service imports the Robot Talks and Robot World examples at startup so
their Run Templates appear as buttons in Control Center.

Run locally from the repository root:

```bash
tools/toolchain/run cargo run --manifest-path orchestrator/api/Cargo.toml -- \
  /tmp/orchestrator-state orchestrator/frontend 127.0.0.1:8787
```

## Open Questions

Remote authentication, multi-tenant isolation, and the automatic Gateway-backed
worker supervisor remain deployment and adapter admission work.
