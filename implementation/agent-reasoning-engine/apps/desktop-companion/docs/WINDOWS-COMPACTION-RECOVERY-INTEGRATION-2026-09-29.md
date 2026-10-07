# ARE Companion Windows compaction-recovery integration — 2026-09-29

Status: bounded development evidence. No installation, release, desktop-task
handover, or model-provider call. The discontinued TUI is out of scope.

## Candidate and source boundary

A fresh unsigned Windows NSIS candidate was built from the current local source
at `D:\are-companion-integration-20260929.exe` (29,574,907 bytes; SHA-256
`8d41bd8077ac20443eab1ee49f04fbff8c2e4de0e756be19ab71b357e04eacb7`).
The retained, uninstalled build stage is `D:\acw-Nl0hRI`. Its development
distribution has 807 source files and closure digest
`5f7f4715d65c31a9826dd0f67fe804975733e24216a621d9cc92a21ab90d4f1a`;
the Core closure digest is
`0250a2e4e238681210145c3f1e3e27cfb9c2ac8f48f9fe432731724b0799f217`.
The staged `gateway.mjs` and Companion `ui/app.js` match the current repository
source byte for byte. The installer bytes were built and hashed, but the
installer itself was not extracted, executed, or installed in this check.

## Verified behavior

- The wrapper's direct native crash canary passed on both the pinned WSL and
  Windows Codex binaries. A disposable gateway child durably accepted a real
  `thread/compact/start`, then was killed before its terminal event. The next
  gateway verified the completed compaction from native thread history,
  persisted the verified receipt, and resumed the client without another model
  request. The old disposable backend was stopped. This was not this desktop
  task or a simultaneous machine/backend power-loss test.
- Gateway reconnect now buffers newly emitted host notifications until retained
  deliveries are replayed in sequence. The focused ordering regression and
  gateway-session-store suite passed; the full wrapper test suite exited zero.
- The staged Windows resources passed `test-windows-features.mjs`: bundled Node,
  product health, route/context, Reasoning State, bounded plan context,
  thread/decision clients, and native Evolution SQLite write/reopen/replay.
- The staged executable passed `test-windows-ui.mjs` in a real isolated WebView2
  profile: floating orb, nonblank dashboard, all seven destinations, appearance
  persistence, keyboard focus, contrast, and reduced motion. A second
  `--adapter-live` run showed gateway reasoning state, a linked decision, and
  independent product versus adapter health, then cleared live evidence on
  gateway loss.
- `test-managed-session-windows.mjs` passed using the staged executable, its
  adjacent bundled Node/ARE resources, and the pinned Windows Codex binary.
  The ARE-owned gateway, hosted client, and Companion came up together; the
  managed session shut down when its Companion exited. Its hosted turn ingress
  was deliberately paused with `windows-client.hook-boundary-unverified`;
  model calls were zero and current desktop task control remained false.
- A no-debug orb-only sample observed seven processes, 150,077,440 private
  bytes, and 0.125 CPU-seconds over 10 seconds. A separate three-cycle
  dashboard open/close/reopen run kept all reopened dashboards nonblank;
  dashboard private bytes were 236,912,640, 228,261,888, and 222,687,232,
  while post-close bytes were 153,006,080, 150,568,960, and 150,577,152.
  These short observations do not establish a resource budget or a leak verdict.

## Claim ceiling

These tests prove candidate source behavior and staged native UI behavior, not
installed lifecycle, signed delivery, current-chat control, or complete host
effect interception. The dashboard's gateway thread represents a bounded
backend-thread projection; it is not the hidden model chain of thought. The
Companion must continue to say that this chat is not established as
ARE-managed. Reconnect depends on a surviving client delivery cursor and
request alias; missing continuity material remains fail-closed and still needs
a clear client-facing recovery path.

## Open Questions

- Which supported host contract can provide exclusive current-task ownership,
  full ingress/approval/effect coverage, and a Windows hook boundary?
- Does the actual installed package pass startup, upgrade, rollback, native
  pointer/accessibility, and resource-budget acceptance checks?
- How should the client surface a missing reconnect cursor or alias without
  hiding a pending accepted operation or retrying it unsafely?
