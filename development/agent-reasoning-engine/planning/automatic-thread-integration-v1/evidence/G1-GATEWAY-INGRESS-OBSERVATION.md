# G1 gateway model-entry observation

Status: bounded source-level construction evidence, 2026-09-28. This does not
activate or hand over the current Codex desktop task. TUI is discontinued and
outside this path.

The managed Codex gateway already blocks `turn/start`, `turn/steer`,
`review/start`, and `thread/compact` before backend dispatch when its exact
Windows hook-boundary pause is configured. Its authenticated, read-only adapter
observation now projects that configured pause directly as
`model_entry_ingress`, with a closed reason code. A gateway without the pause
reports `not-paused`, which means only that this particular guard is absent;
it is not an effect-safety or task-control assertion. Older gateways omit the
field and normalize to `unknown`.

The Companion bridge prefers the gateway observation over a launch-environment
declaration. On an older gateway it may still show the declaration, visibly
marked as such. If the launcher declares a pause but the gateway reports
`not-paused`, the bridge rejects the snapshot as incompatible. The Adapters and
Overview screens distinguish gateway-enforced pause, launcher-only declaration,
no configured gateway pause, and unknown state. The connected backend and this
desktop task's unverified control remain separate facts.

Verification: focused gateway/adapter suites passed 143/143; dashboard source
suite passed 41/41; full wrapper suite passed 557 with 14 platform skips;
Companion offline `cargo check` passed. The Rust unit-test target could not
build in this Linux environment because `pkg-config` and GIO development
tooling are absent. No external model call or host configuration change was
made.

A fresh native Windows release build and unsigned NSIS packaging completed
cleanly. The retained setup candidate is
`D:\are-companion-observation-gQHm7P\ARE_Companion_0.1.0_x64-setup-gateway-observation.exe`
(SHA-256 `effa2ca3344ffdea1ebb882756b3c755a68c80f3e5d0614be0bb0ed734c701cf`).
The staged binary is under
`C:\Users\vlad_\AppData\Local\Temp\acw-2bhg6h\src-tauri\target\release\are-companion.exe`
(SHA-256 `73785af343769ebb1d1a0ae441e652aa6bf0f37297014ba460e3497a7c984e7e`).
Its bundled feature check passed exact Node, product doctor, route/context,
Reasoning State, thread/decision clients, and SQLite Evolution replay. The
native staged WebView2 managed-session canary passed with one gateway, hosted
client, rendered orb and seven-panel dashboard, connected/ready backend,
gateway-sourced `paused` ingress, disabled hosted turns, supervised shutdown,
zero model calls, and no current-desktop-task control. The setup executable
was **not installed**.

## Open Questions

- Verify installed-package startup, bridge access, recovery, and cleanup before
  treating this unsigned staged candidate as a release.
- A configured ingress pause does not solve local hook delivery, complete host
  effect interception, or exclusive current-desktop-task handover.
