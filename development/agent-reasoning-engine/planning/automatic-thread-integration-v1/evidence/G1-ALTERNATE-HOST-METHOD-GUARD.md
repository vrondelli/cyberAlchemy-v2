# G1 alternate host method guard

Status: bounded construction evidence, 2026-09-26. Authority effect: none.

## Finding and implementation

The shared Codex App Server wrapper preflights `turn/start` and `turn/steer`,
but otherwise forwarded client methods to the backend. A client on either the
direct stdio path or the acknowledged gateway path could therefore request
another host execution or model-entry method without that ARE turn/effect
preflight. The App Server documentation identifies `thread/shellCommand` as
running outside the sandbox with full access, so merely selecting a read-only
turn sandbox would not close this ingress.

One shared method classification now rejects the explicitly identified
alternate methods `thread/shellCommand`, `thread/rollback`, `thread/compact`,
`thread/queue`, `thread/realtime`, `review/start`, `command/exec`, and
`process/spawn`; any ungoverned `turn/*` method; and the
`thread/compact/*`, `thread/queue/*`, and `thread/realtime/*` families. It
is enforced at both gateway ingress and shared-wrapper ingress, including
when the gateway is configured with a substitute wrapper. The wrapper records
a content-digest rejection event; both ingress paths send a bounded JSON-RPC
error for requests. Notifications are dropped without a fabricated response.
Normal `thread/read`, `thread/resume`, and `turn/interrupt` forwarding remains
unchanged. This is an unsupported-method posture until each alternate method
has its own explicit lifecycle and effect mapping.

The ARE-hosted browser client now selects `read-only` for thread creation,
resume, and turn start, keeps `onRequest` approval, and refuses a trusted
constructor request for `workspaceWrite`. Browser policy overrides were already
rejected. This removes the hosted default's unapproved workspace-write mode;
the direct stdio wrapper and older proxy have their own host-policy contracts.

The gateway's stable-key and thread-ownership checks remain separate. One
gateway test exercises an acknowledged client through a real wrapper; another
uses a pass-through wrapper. Both assert that alternate execution methods
cause no backend write. The wrapper test covers the listed methods and
preserved pass-through controls.

## Verification

- Shared wrapper focused test: 70/70 passed.
- Focused gateway and wrapper admission tests: 3/3 passed.
- Full serial wrapper package suite after the shared gateway policy: 348 passed,
  1 platform skip, 0 failed.
- Hosted-client focused suite after read-only pin: 25/25 passed. The prior
  native disposable read-only canary proved a one-use approved write and
  blocked an unapproved write under the installed host. After the shared
  gateway policy, the one-use approved-write mode passed again against
  `codex-cli 0.155.0-alpha.16.4` with one wrapper directive, one client
  approval request, an observed write marker, zero external model calls,
  temporary configuration and write probe removed, and native child reaped.
  This did not test the hosted browser against the desktop task.

## Claim ceiling and open questions

This does not prove a complete App Server method allowlist, universal effect
interception, or control of the currently running desktop chat. New or
unlisted host methods and the older independent governance proxy need separate
review. Read-only plus on-request approval narrows hosted effects, but is not
proof that every App Server operation must emit an approval request.
The exact installed `codex-cli 0.155.0-alpha.16.4` experimental
`generate-json-schema` output contains 164 client request methods
(`ClientRequest.json` SHA-256
`84503651b1b6f9a4f259cf6d917b6b46a4a8f3262e00f6cfd077abc84dfbb5c1`).
In addition to the guarded methods, it includes direct filesystem writes and
removal, configuration writes, plugin installation, MCP tool calls, remote
control mutations, and thread item injection. These remain unreviewed paths
for a generic gateway client; the current bounded denylist is not a complete
admission catalog. The generated schema was inspected in a disposable `/tmp`
directory, not copied into the repository or treated as canonical ARE policy.
The gateway's unknown-delivery recovery and exclusive desktop handover are
also open. G1 and O1 remain unadmitted.
The later [versioned gateway catalog](G1-VERSIONED-HOST-METHOD-CATALOG.md)
closes this method-name inventory gap for the gateway path only. It does not
resolve admitted-method parameters or the direct-stdio/legacy paths.

Official protocol reference: https://learn.chatgpt.com/docs/app-server

## Open Questions

- Which exact App Server methods should be admitted for a selected host mode,
  and how will version drift fail closed before activation?
- What is the user-visible workflow for compaction, review, realtime, and
  shell commands once their ARE contracts exist?
