# G1 native Windows hosted-command sandbox preflight — 2026-09-29

Status: bounded source and native diagnostic evidence; authority effect: none.
The TUI is discontinued and is not a consumer, fallback, or test target.
No host effect was enabled, no model call was made, and the current Codex
desktop task was not handed over.

## Construction

The managed launcher now accepts an explicit `--windows-sandbox-mode`
(`elevated` or `unelevated`) for a dedicated restricted Codex home. Its
`config/read` preflight requires the selected mode to appear exactly in the
effective configuration; omitted, unknown, or conflicting mode projections
fail closed. The optional `--probe-windows-hosted-effects` diagnostic uses
the same preflight App Server connection and selected checkout to verify a
read-only command, read-only write denial, workspace write inside, and
workspace write denial outside. All files are generated under unique probe
directories and removed after the run. It reports
`preflight-passed-not-backend-attested`, never an execution authorization.

The native Windows App Server rejected a custom `outputBytesCap` in the
diagnostic request. The probe no longer sends that field. The hosted-command
materializer also omits it on Windows while retaining the Linux value;
the wrapper still projects at most 8 KiB from each returned output stream.
This does not establish a host-side output-memory limit on Windows.

## Exact observations

- Pinned native host: `codex-cli 0.155.0-alpha.16.4`, SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.
  A disposable profile with explicit `unelevated` mode passed all four
  controls and the exact materialized hosted-command request shape. The
  default-mode profile still reported no effective Windows mode and accepted
  a forbidden `readOnly` write. Both runs made zero model calls.
- A source-managed, package-adjacent Companion smoke selected the native
  `D:\acw-sN7uaf` staged checkout. Explicit `unelevated` mode and the four
  preflight controls passed; gateway/backend/client connected, the orb and
  seven-panel dashboard rendered, guarded Plan input remained a candidate,
  shutdown was supervised, and model calls remained zero. The output was
  `windows_hosted_command_sandbox_status:
  preflight-passed-not-backend-attested`. The source manager, gateway and
  client were newer than the retained packaged resources.
- Selecting the WSL UNC source checkout with the same native Windows host
  failed the allowed workspace-write control with the typed reason
  `managed-session.windows-sandbox-workspace-write-failed`. This is a
  selected-root portability gap, not evidence that the D: root failed.
- Linux focused tests passed 13/13; the full wrapper suite passed 665/683
  with 18 platform/browser skips. A focused native Windows hosted-command
  materialization test passed. The full native Windows wrapper/gateway suites
  remain unclaimed because unrelated hard-coded POSIX `/tmp` fixtures fail.

## Same-backend diagnostic update

The gateway now starts a fresh, process-local attestation after each spawned
backend's verified initialization. It reads the effective Windows sandbox mode
from that same backend and runs the four model-free command controls through
that backend's own JSON-RPC stream. A new backend starts unverified; exit,
restart, failed checks, and missing proof cannot inherit a previous process's
pass. The authenticated adapter observation projects only aggregate status,
without paths, process IDs, or a dispatch permission. The Companion Adapters
panel labels this separately from the hosted-command setting.

On the pinned native Windows host and disposable `D:\acw-sN7uaf` checkout,
the source-managed Companion smoke now reports
`windows_backend_sandbox_status: passed-all-active-backends` for its connected
gateway session. The earlier preflight still reports
`preflight-passed-not-backend-attested` as its own, narrower evidence. The orb,
seven panels, guarded Plan candidate, supervised shutdown, and zero model
calls were reconfirmed. WSL suite: 667/685 pass, 18 platform/browser skips,
0 failures; dashboard source suite: 47/47; offline Tauri `cargo check`: pass.
The packaged executable used by that earlier native smoke predates the new
Adapters label. The rebuilt-package check below supersedes that UI limitation.

The next native effect canary exposed a distinct resource boundary. On the
same pinned host, a 100,000-byte command stdout was returned untruncated by
default. `streamStdoutStderr: true` with a `processId` was rejected as
`streaming command/exec is not supported with windows sandbox`; the custom
`outputBytesCap` had already been rejected. A bounded-output Node runner
worked outside the sandbox, but the unelevated sandbox rejected its nested
process launch with `EPERM`. The runner was removed from the production
command materializer. The native canary again passes the four filesystem
controls and exact direct command shape, but does not establish a bounded
Windows output path. Windows hosted-command execution remains explicitly
denied with `hosted-effect.windows-output-bound-unavailable` even when a
same-backend sandbox proof is present.

## Pinned output-cap recheck — 2026-09-30

The native command canary now tests a separate 8 KiB `outputBytesCap` request
against 100,000 bytes of generated stdout and records only the disposition,
byte count, and bounded error text. Under the same disposable native Windows
`unelevated` sandbox and pinned `codex-cli 0.155.0-alpha.16.4` binary, the
host rejected it with `custom outputBytesCap is not supported with windows
sandbox`. Streaming with a client `processId` was also rejected as
`streaming command/exec is not supported with windows sandbox`; the default
buffered request still returned all 100,000 bytes. All four filesystem
controls passed. The canary touched no desktop task, made no model request,
and cleaned its disposable roots.

The version-generated `CommandExecParams` schema advertises `outputBytesCap`,
but also says `streamStdoutStderr` requires a client `processId`. Therefore
removing `processId` is not a supported streaming workaround, and the schema
alone cannot override the native Windows rejection. The pinned WSL/Linux
binary of the same CLI version accepted the 8 KiB cap and returned exactly
8,192 stdout bytes; its streaming probe and four filesystem controls also
passed. These observations support keeping the Windows effect gate closed
while considering a separately verified WSL-native execution boundary. They
do not authorize routing a Windows hosted effect into WSL, relaxing output
bounds, or controlling this desktop task.

## Rebuilt package and rendered UI check

An isolated native Windows build completed from the current Companion source
at `D:\acw-W8LBY7`; it produced the unsigned NSIS installer
`D:\are-companion-backend-boundary-20260929.exe` with closure digest
`05728e61ba43476b2ff9d4084cfe1a98cf2739aefea1aa3ccb1dba8af3766e43`
(807 files) and installer SHA-256
`a4d0bc10a1cb5ce5638a0b175e1f87dd72dbc3d0ed8c127a32c37b6b943e7e62`.
The staged executable was launched directly, not installed.
The default native WebView smoke passed: orb rendered, dashboard was nonblank,
all seven panels and their source-aware empty states rendered, the movable
orb and skin persisted, and keyboard, contrast, and reduced-motion checks
passed. The package-adjacent managed-session smoke also passed with the
guarded Plan candidate and the pinned native Windows host: gateway running,
backend ready, hosted client connected, and the rendered Adapters panel
reported `windows_backend_sandbox_status: passed-all-active-backends`.
The same smoke reported `current_desktop_task_control: false`, zero private
and external model calls, supervised process stop, and `installed: false`.
The current UI now visibly states that a passed sandbox probe does not enable
Windows hosted commands while the host output bound is unavailable.
An additional staged WebView fixture journey with 40 gateway thread rows
passed pagination, changed-snapshot rejection, per-thread Reasoning State,
thread-specific decision navigation, focus return, and gateway-loss clearing.
Those 40 rows are fixture data, not live host threads.

The current wrapper suite passed 667/686 with 19 skips and zero failures;
the changed source paths passed `git diff --check`. A Linux native
hosted-effect join canary passed with a local fake Responses provider, one-use
approval fixture, durable journal, command effect, and tool result returned
to the model; it did not claim an external model call or control of this
desktop task.

The [official App Server documentation](https://learn.chatgpt.com/docs/app-server#command-execution)
describes `command/exec` as server-sandboxed, and the
[Windows sandbox guidance](https://learn.chatgpt.com/docs/windows/windows-sandbox)
distinguishes elevated and unelevated modes. The exact compatibility and
UNC results above are observations of this pinned host and these fixtures.

## Claim ceiling and Open Questions

The first observation above is preflight evidence from a short-lived App
Server. The newer diagnostic verifies the actual live gateway backend in one
native session, but does not prove permission to dispatch an effect or cover
every recovery generation. The Windows hosted-effect gate remains closed in
the managed launcher, gateway, hosted client, and final command preparation.
The rebuilt unsigned Windows installer contains these source changes, and the
staged executable passed the rendered UI checks above. Installed behavior was
not tested.

Open questions: obtain a host-supported bounded-output command path on native
Windows, or select a separately governed Linux-backed execution adapter;
recheck effective configuration and root permissions at dispatch/restart; test approval,
one-use dispatch, crash uncertainty, and recovery; route WSL UNC checkouts
through a proven WSL-native execution boundary or keep native Windows
hosted effects unavailable for them. Current-task writer handover remains
separate.
