# Orchestrator Deployment

Status: local deployment candidate  
Authority effect: none

The container builds the canonical Rust API and serves the dependency-free
Control Center. State is mounted at `/var/lib/orchestrator`; the process runs as
an unprivileged user with a read-only root filesystem.

Start the local edition from the repository root:

```bash
docker compose -f orchestrator/deployment/compose.yaml up --build
```

Gateway use is opt-in. Configure an independently managed Unix socket volume,
then add `compose.gateway.yaml`. The API reports configuration and reachability;
it does not start, impersonate, or grant authority to the Gateway.

The current API exposes Gateway configuration and socket reachability. Executing
agent turns through that socket still requires a separately installed Worker
adapter; attaching the volume alone does not execute a model turn.

For the existing single-operator VPS, compose the three files and use a protected
`.env` containing `PUBLIC_HOST`, `BASIC_AUTH_USERS`, `IMAGE_TAG`,
`ORCHESTRATOR_PORT=18080`, `ARE_GATEWAY_PROFILE_REF`, and
`ARE_GATEWAY_RUNTIME_VOLUME=cyberalchemy_are_gateway_runtime`:

```bash
docker compose --project-name cyberalchemy-orchestrator \
  -f compose.yaml -f compose.gateway.yaml -f compose.vps.yaml \
  up -d --no-deps orchestrator
```

The VPS overlay reuses the private Gateway socket volume and Traefik network,
while `cyberalchemy_orchestrator_v2_state` keeps the new runtime state separate
from the predecessor rollback volume.

Before replacing an established console, verify all required product surfaces:
Runs, proposal/template authoring, Lab, the per-run DAG graph, ontology,
Operations, adapters, and recovery. A healthy container or `/healthz` response
does not establish product parity. The rollback of candidate `b04644005462` is
recorded under `evidence/b04644005462/ROLLBACK-RECEIPT.json`.
The current surface-baseline check is insufficient for cutover while the
functional gaps in `../migration/feature-parity/FEATURE-PARITY.md` remain open.

## Open Questions

TLS, authentication, backups, monitoring, and remote multi-tenant isolation must
be configured and admitted before a public deployment.
