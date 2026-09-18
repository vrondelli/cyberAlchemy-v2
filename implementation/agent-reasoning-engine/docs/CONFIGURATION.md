# Configuration

ARE configuration is explicit and source-bound. Candidate 018 does not use one
global mutable configuration file.

## Product profile

`product.json` owns product identity, Node version, closure roots, required
components, integrations, and entrypoints. Changing it changes the product
closure and requires successor evidence.

## Repository profile

`packages/codex-app-server-wrapper/profiles/repository-v1.json` binds the route
profile and the definition and ontology sources. It also binds the selected protocol observation, context limits, and semantic
and evolution toggles. Other bindings cover telemetry, journal limits, Reasoning
State storage, gateway limits, clients, turn bindings, and effect defaults.

Source paths and digests are checked when the profile loads. Update the profile
and its evidence deliberately when an owned source changes.
The current runtime and host boundaries are summarized in [Compatibility and
lifecycle](COMPATIBILITY-AND-LIFECYCLE.md). Storage defaults and their limits
are explained in [Privacy and retention](PRIVACY-AND-RETENTION.md).

## Gateway command options

Required:

- `--config <profile.json>`
- `--repository-root <repository>`
- `--listen <gateway.sock>`

Optional:

- `--backend direct-stdio|daemon-proxy|websocket`
- `--upstream-socket <app-server.sock>`
- `--upstream-url <ws://...>`
- `--reasoning-state-dir <directory>`
- `--session-store <gateway-sessions.jsonl>`

The selected backend must match its required upstream option. The default
repository profile uses `daemon-proxy` and validates the observed Codex version
against pinned protocol evidence.

## Coding-agent runtime

Configured runs validate against
`packages/coding-agent-runtime/schemas/run-config.schema.json`. Provider
transports, secret providers, tool policy, budgets, workspace boundaries, and
verification commands remain separate fields. Therefore, a provider selection
cannot silently expand tool or effect authority.

## Environment and secrets

Use the secret-provider interfaces rather than embedding credentials in JSON.
The `PYTHON` environment variable may select the Python executable for the
product test runner. Use `tools/toolchain/run` for native builds.

## Open Questions

- Should validated profile overlays support host-specific storage paths without
  changing the semantic repository profile digest?
