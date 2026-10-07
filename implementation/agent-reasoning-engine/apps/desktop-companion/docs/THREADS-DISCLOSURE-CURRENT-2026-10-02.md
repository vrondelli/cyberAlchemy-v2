# Threads progressive disclosure — current development candidates

Status: candidate implementation and bounded test evidence, 2026-10-02.
Authority effect: none. Neither package was installed, released, or used to
activate a Codex desktop task. Parent: [whole UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## Change and source evidence

The gateway backend-thread card begins with phase, observation time and
attention signals. A thread-specific keyboard-accessible button reveals its
completion frontier and verified plan progress; host receipts and opaque
digests remain a second disclosure. One card can be expanded at a time. A
same-gateway refresh preserves the selected detail and button focus, while a
gateway epoch change cannot carry that selection forward. Recovery and
uncertain-hosted-effect warnings remain visible when detail is collapsed.
This is presentation of the existing privacy-filtered gateway projection,
not a host-task title, hidden reasoning stream, or desktop-task activation.

- Current source: `node --test ui/dashboard.test.mjs` passed 58/58. The isolated
  Chromium navigation fixture passed the collapsed/keyboard/refresh/focus and
  340 px expanded-state checks with no uncaught browser error.
- The native Windows WebView2 harness passed against the staged executable
  with `--adapter-live --timeout-ms 30000`. It verified the orb and non-blank
  dashboard, observed gateway thread reasoning state, collapsed-first thread
  details, keyboard-open disclosure, thread-to-decision navigation and focus
  return, adapter loss, diagnostics, Evolution, and appearance in an isolated
  synthetic gateway fixture. This does not test an installed package or a
  live Codex desktop session.

## Exact uninstalled packages

| Target | Candidate | Size | SHA-256 | Bounded result |
| --- | --- | ---: | --- | --- |
| Ubuntu 26.04 x64 | [`are-companion_0.1.0_amd64-thread-detail-20261002.deb`](../dist/are-companion_0.1.0_amd64-thread-detail-20261002.deb) | 45,841,416 bytes | `0f7347faf469230a8f713fdc80443b426cf642b6bd661e825a335053b404f03b` | Offline build, extraction under `/var/tmp`, byte-identical extracted/native Tauri executable, bundled Node 26.8.1 and ARE `doctor --json` PASS at `0.10.0-rc.1`. Extracted dashboard-only process survived a bounded eight-second WSLg/X11 container run; EGL acceleration warnings remain. No packaged Threads interaction was exercised. |
| Windows x64 | `D:\ARE_Companion_Threads_detail_20261002_x64-setup.exe` | 33,829,307 bytes | `2a27f2b52d725099309a554deb6baaecca3cdac54f69a7f183ca3cbef99716a5` | Fresh unsigned NSIS build with native orb; stage retained at `D:\acw\acw-UsbiZR`. Its `ui/app.js` and `ui/app.css` match current source. Staged bundled feature probe passed all 13 checks at ARE `0.10.0-rc.1`. The staged executable passed the isolated native WebView2 UI harness, including Threads disclosure. The NSIS installer was not executed. |

The Windows staged executable is 9,562,112 bytes, SHA-256
`deda9639ab8deaf78a369e41841126bdb11b4d3078a7fd43de34e570c760a498`.
The Linux builder reported an 839-file development closure digest of
`427c1578b5f92b514e23137ae8e2fc94050c18f2e7ed6b5838412916580bdfe6`;
the Windows builder reported 839 files and development closure digest
`afc4b87b3ca6a41ad2cb1e8777206229155a76bee6c12621fb57c2cd23924394`.
These differing platform closures are not a parity failure by themselves.

## Test boundary and open questions

The Windows Computer Use helper still could not initialize from this WSL-backed
task (`sandboxCwd is not a local file URI`). The narrow `--adapter-live` native
UI harness path used WebView2 CDP against its own test-owned Companion process;
the harness's PowerShell-based window-management paths were not selected. The
native pass establishes behavior for the exact staged executable whose UI
bytes match the installer stage, not an installed-package lifecycle, real-host
connection, assistive-technology traversal, or stock Codex task activation.
The Linux smoke proves process/display startup, not rendered Threads behavior,
Wayland, or normal desktop use.

The existing [session-control contract](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md)
still requires a verified host ingress/writer handover. These Companion
packages observe gateway state and do not establish that this Codex chat, or
stock-app New Chat, is ARE-controlled.
