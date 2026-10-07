# Adapter observation: implementation analysis

Status: candidate analysis, 2026-09-26. Owner: ARE product/runtime and Companion
owners. This is not evidence that any adapter is currently connected. Scope is
the read-only [Adapters UX brief](../ux/ADAPTERS.md), not adapter activation.

## Current path and what it proves

| Surface | Current observation | Claim ceiling |
| --- | --- | --- |
| [Companion Rust bridge](../../src-tauri/src/main.rs) | `get_snapshot` runs fixed `doctor --json` with a 15-second timeout and 256 KiB output bound, then allowlists product-health fields. | Installed product diagnostic only; no gateway or backend liveness. |
| [Companion renderer](../../ui/app.js) and [dashboard](../../ui/dashboard.html) | Overview, Decisions, Diagnostics, Appearance; no Adapters panel or adapter command. | No live adapter status. The `connection-banner` name is misleading because it paints doctor health. |
| [Product profile](../../../../product.json) | Declares Core, optional components, and integrations. DSH and MCP are optional extensions; the bridge is optional. | Declaration/default selection is not effective runtime configuration or activity. |
| [Gateway entrypoint](../../../../packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs) | Chooses Codex or DSH and emits `are.gateway-ready/v1` after listening. | Startup receipt, not current liveness or backend readiness. |
| [Gateway runtime](../../../../packages/codex-app-server-wrapper/src/gateway.mjs) | `inspect()` knows selected adapter, runtime epoch, started state, and session internals. Normal connect creates a session and spawns a backend. | Useful in-process source; raw result is too broad/private and is not a remote read API. Existing connect must not be used as a health probe. |
| [Gateway client](../../../../packages/codex-app-server-wrapper/src/gateway-client.mjs) | Holds a transport handshake receipt and connected flag for its own process. | Not a Companion-wide registry or safe diagnostic endpoint. |
| [Backend contract](../../../../packages/codex-app-server-wrapper/src/backend-adapter.mjs) | Validates adapter shape and spawns a backend. | Selection/spawn capability, not proof that a child initialized or can serve a turn. |
| [MCP server](../../../../packages/are-mcp-server/src/server.mjs) and [host hook candidate](../../../../../../agent-routing/capabilities/are-cli/HOOKS.md) | MCP has STDIO `ping`; hooks can inspect host support. | Neither proves registration, active connection, or delivery to this Companion. |
| [Windows feature check](../../scripts/test-windows-features.mjs) | Tests bundled doctor, route/context, and reasoning module load. | Does not start or probe the gateway; no adapter observation coverage. |

## Required boundary

The authoritative source of the selected path and live session state must be
the process that owns them: the ARE gateway. Companion must receive only a
versioned, allowlisted, bounded projection. No renderer access to repository
files, session stores, gateway `inspect()` internals, sockets, tokens, command
arguments, raw logs, or effectful RPC. A normal gateway connection is unsuitable
for observation: its [handshake path](../../../../packages/codex-app-server-wrapper/src/gateway.mjs)
can create durable session state and spawn a backend, even if the caller sends
no model request.

Candidate topology: gateway-owned observation endpoint → fixed, read-only ARE
adapter-status command → bounded Tauri command → renderer. The endpoint is
separate from normal client admission and cannot create sessions or forward
RPC. The first live experiment is limited to an isolated, private, same-user
development harness with an explicit endpoint, no default listener, and no
packaged enablement. Full transport/authentication and cross-user proof on
Linux and Windows is the final package gate. If private local access cannot be
guaranteed, the functional UI remains fixture-backed until that gate. Do not
scan arbitrary sockets, processes, ports, or repository files to guess an
active gateway. A missing endpoint remains “not configured” or “unavailable,”
not proof that ARE is broken.

## Evidence semantics

- `declared`: product metadata only. `configured`: an explicit local endpoint
  selection. The selected backend adapter is verified only from a current
  gateway response; when offline, its identity is unverified.
- `running`: gateway answered a current bounded observation request. An old
  `gateway-ready` line, socket file, or process listing does not suffice.
- `connected`: per link. An attached authorized client is distinct from a
  backend child. A listening gateway does not prove either.
- `ready`: per session only while its backend child remains alive and the
  selected backend's protocol initialization has succeeded. Startup DSH
  preflight and Codex version checks are configuration
  checks, not global model readiness. A gateway with no sessions has no
  backend-ready claim.
- `in_use`: only recent, source-attributed bounded traffic; no thread count
  inference. Every dynamic claim carries source, epoch, observation time,
  freshness, and a stable reason code. Old success becomes stale after timeout.
  This claim can be deferred from the first live slice.

The public projection should contain fixed adapter IDs, selected/unselected
posture, aggregate session counts, coarse link states, bounded reason codes,
and times. It should not expose consumer IDs, thread titles, private reasoning,
request bodies, resume tokens/digests, filesystem paths, credential values,
provider names, or raw stderr. A later per-thread feature needs its own
identity/privacy contract; this feature must not smuggle it in.

## Gaps and decisions before implementation

1. Define a read-only schema and claim-to-evidence matrix; add explicit
   `not_configured`, `disabled`, `unavailable`, `stale`, and `incompatible`
   outcomes. Do not turn lack of a source into a negative health verdict.
2. Add a gateway-owned allowlisted projection, fed from existing lifecycle
   state plus explicit backend child/initialization observations. Never return
   raw `inspect()` or call its effectful/pruning paths merely to render UI.
3. Use only a private, same-user, explicitly configured local endpoint for
   development-harness live reads. Existing gateway socket mode `0600` is a
   useful Linux precedent, not a proven Windows ACL or complete production
   authorization design. No token may appear in URL, argv, logs, or renderer.
   Full IPC threat/privacy review and cross-user proof are deferred to the
   final gate before packaged enablement.
4. Decide how a packaged Companion finds an independently running gateway. Its
   bundled ARE runtime is a product closure, not automatically the same live
   gateway instance. Check runtime epoch and schema to prevent cross-instance
   or stale-file confusion. A challenge/response nonce should bind each live
   read to its exact response, subject to the selected IPC protocol.
5. Add bounded timeouts, byte caps, no-store behavior, one-shot or visible-only
   refresh, and explicit failure transitions. No background model launch.
6. Add renderer, Rust, Node, IPC, package, and native Linux/Windows checks. A
   source test cannot establish OS ACLs, installed-resource resolution, idle
   cost, or a live connection on another host.

## Open Questions

- Which owner approves the exact per-user IPC/authentication scheme and
  permitted disclosure of aggregate live-session status?
- Does the first prototype observe only the selected gateway/backend path, or
  must optional MCP/hook registration be independently attested? This analysis
  recommends the selected path first; other integrations remain unverified.
- What freshness and resource budgets make “current” and “low resource”
  measurable on each supported OS?
