# P1 — authenticated conversation identity and writer gap

Status: implementation analysis, 2026-10-04. Authority effect: none. P1 is
**not implemented** by the existing transport credentials or D0 probe.

## What the current code actually authenticates

| Surface | Current credential and owned fact | Missing identity fact |
| --- | --- | --- |
| ARE gateway IPC | A configured connection token authenticates a socket peer; acknowledged continuity adds a resume token; the durable store binds hashed backend-thread IDs to a `consumer_id`. | The caller-supplied consumer label is not a signed Codex account, app instance, workspace, or desktop conversation identity. The file-store writer lock serializes the gateway store, not every possible direct Host writer. |
| Codex desktop shim candidate | The shim pins backend executable hash and validates launch arguments; its gateway client uses a fixed `codex:desktop-wsl` consumer and connection token. | No observed stock desktop New Chat invocation/consumption for C0, no app account assertion, and no exclusive stock-client writer release. |
| DSH Web | The Host mints a signed authority-bound browser cookie from a process launch token and checks Origin/Host. The disposable D0 probe preserves this fence. | The cookie identifies authorized access to a local Web Host, not a named human/account, workspace, or native Session writer lease. The browser supplies `sessionId`; it is not itself proof of ownership. |

The related implementation is in the
[Codex gateway](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs),
[gateway session store](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-session-store.mjs),
[desktop gateway client](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-desktop-gateway-client.mjs),
and the pinned DSH `@deepseek-ai/dsh-client-connection` BrowserAuth implementation
under the package-local installed dependencies. The latter is dependency
evidence, not source owned by ARE.

## Required P1 contract before P3, C1, or D1

The binding needs a Host-authenticated principal scope with an explicitly
declared kind (`account` when the Host provides it, otherwise a local Host
instance/browser authorization principal that is **not** called an account),
client instance, canonical workspace root, ARE conversation ID, native backend
thread/Session ID, writer owner, capability/profile version, generation,
creation time, expiry and release state. The credential that proves the
principal must be verified at the Host boundary and bound to the exact
conversation/writer record before a user message is admitted; a JSON field or
client label cannot self-attest it. Reconnect must prove continuity against
the same identity and generation. An existing native Session can be adopted
only after a separate writer-release and history-watermark protocol.

State transitions should be `proposed -> bound -> active -> draining ->
released`, with `quarantined` for unknown or conflicting ownership. Only one
active writer is permitted per native thread/Session; a second writer, wrong
workspace/principal, stale generation, expired lease, or unowned resume must
fail before turn dispatch. Release requires terminal or reconciled unknown
delivery, not socket closure alone. Durable replay must reconstruct the same
binding without promoting an unauthenticated label.

The first implementation slice should add a closed versioned binding record
and conflict/recovery tests beside the existing gateway store, but leave its
activation switch off until C0 supplies a stock Codex Host assertion and D0's
native DSH writer-lock/bypass inventory is complete. A structure-only
validator must not be represented as authentication.

## Open Questions

- Can stock Codex desktop provide a stable account/client/workspace assertion
  at its app-server launch or first `thread/start`, and will the app consume
  gateway output for that same conversation?
- Which DSH Host principal is appropriate for a single-user local Web profile,
  and can its signed cookie verdict be conveyed to the controller without
  accepting a caller-supplied identity claim?
- Does DSH expose a native Session writer lock/release API that covers Web,
  subagent, plugin and direct Host paths, or must D1 be restricted to an
  isolated profile with those alternate paths disabled?
