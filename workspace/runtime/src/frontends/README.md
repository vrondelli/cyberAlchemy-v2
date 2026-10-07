# Workspace frontend hosting

Workspace's Runs rail opens the Control Center owned by the **in-repository**
`orchestrator/` project. Its frontend is a dependency-free browser application
served by `orchestrator/api`; it is not the old React
`@cyberalchemy/orchestrator-console` package. Workspace embeds that app in an
iframe at the explicit local origin `http://127.0.0.1:8787` (override with
`VITE_ORCHESTRATOR_URL`). The direct-open link remains available if embedding is
restricted by a browser or host policy.

The two runtimes remain separate. The Control Center reads and writes only its
own `/api/v1` state. Workspace's Dashboard continues to show Workspace run
observations; historical Dashboard result links remain in Dashboard and are
never interpreted as new orchestrator run IDs. No observation merge, authority
transfer, or runtime cutover is claimed by this presentation integration.

## Run locally

From the repository root, use three terminals:

```bash
pnpm --dir essays/runtime install --frozen-lockfile
pnpm --dir workspace/runtime install --frozen-lockfile
tools/toolchain/run cargo build --locked --manifest-path orchestrator/api/Cargo.toml
```

Start the orchestrator API with a dedicated state directory. The directory is
durable until you intentionally remove it; use a path you control if you want
runs to survive a restart:

```bash
mkdir -p /tmp/cyberalchemy-workspace-orchestrator-state
orchestrator/api/target/debug/cyberalchemy-orchestrator-api \
  /tmp/cyberalchemy-workspace-orchestrator-state orchestrator/frontend 127.0.0.1:8787
```

In another terminal:

```bash
pnpm --dir workspace/runtime dev:fast
```

Open `http://127.0.0.1:4187/#/apps/orchestrator/runs`. Verify
`http://127.0.0.1:8787/healthz` if the embedded Control Center is blank. The
Control Center's Runs, Lab, Ontology, Operations, and Adapters navigation is
owned inside the frame. Running a local server is construction evidence only,
not deployment or product admission.

## Host contract

`FrontendHost.tsx` mounts trusted React adapters in a shadow root. The
orchestrator adapter intentionally owns only the frame and explicit origin;
it does not use the old RunsProvider projection or expose its fixture controls
to the new runtime. The source app handles its own internal history and API.
Workspace hashes select an initial app route, while subsequent navigation in
the frame stays in the Control Center. Historical `#/runs` links open its Runs
list. Historical Dashboard result links stay in Dashboard.

## Open Questions

A shared run-observation contract, authenticated cross-origin embedding, deep
link synchronization, and an explicit service-level launch contract remain
future integration work. The current local-first frame does not imply any of
these are implemented.
