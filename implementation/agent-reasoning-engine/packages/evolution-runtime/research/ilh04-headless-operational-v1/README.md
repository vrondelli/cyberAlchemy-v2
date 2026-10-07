# IL-H04 Operational Headless Continuity

Status: completed  
Cycle kind: `controlled-upgrade`  
Phase: `operational-headless-binding`  
Activation: controlled local operational

## Objective

Close the final gap between the admitted local serving pointer and the real ARE
app-server and gateway entrypoints.

## Result

Both entrypoints now accept `--continuity-activation <manifest.json>`. The
resolver verifies the manifest, active serving pointer, activation package,
provider package, and operational state snapshot before deriving the enabled
profile and provider. Direct `--continuity-state` input cannot be mixed with an
activation manifest.

The operational state is separate from the earlier canary fixture and directs
the runtime to resume the next admitted evolution objective from retained
evidence. The repository-default profile remains disabled.

The installed Codex `0.155.0-alpha.16.3` protocol was regenerated and observed.
All selected wrapper surfaces remain present. A real gateway process consumed
the manifest and completed an actual app-server initialization without starting
a model turn. The model-neutral gateway canary also surfaced the exact
high-risk continuity notification.

Exact results are in [RESULTS.md](RESULTS.md).

## Run

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs \
  --config implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json \
  --repository-root /home/vlad_/projects \
  --listen /tmp/are-codex-gateway.sock \
  --backend direct-stdio \
  --continuity-activation implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-operational-v1/activation-manifest.json
```

The app-server stdio entrypoint accepts the same activation flag.

## Rollback

Omit `--continuity-activation`, or restore the retained predecessor
`continuity:repository-default-disabled`. The repository profile already uses
that disabled posture.

## Open Questions

The local shared-RPC/headless objective is complete. Broader questions belong
to separate scopes: external deployment, a supported Codex Desktop/Windows UI
adapter, live state hot-reload, and a real-user effectiveness cohort.
