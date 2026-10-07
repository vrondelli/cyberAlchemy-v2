# ARE Companion current-source Windows package — 2026-09-29

Status: bounded development evidence; no installation, release, or current-task
handover. The TUI is discontinued and is not a product or validation target.

## Exact package

The current source was built with native Windows Node 26.8.1 and the existing
pinned Rust/Tauri toolchain into an unsigned NSIS installer at
`D:\are-companion-current-20260929.exe` (29,497,132 bytes; SHA-256
`807c4714c29c3df2df33d5ce58115d15682011b241503f846c9450142a8d5c22`).
The retained, uninstalled build stage is
`C:\Users\vlad_\AppData\Local\Temp\acw-3NHvNC`. The development distribution
contains 784 source files with closure digest
`c92a8415778adb636436d97390fbe74d191c30c786ac2361ea51f74111aea569`;
the Core closure digest is
`bf28300b30c2acaf10cde676a1e419ec9d744d85bdf07be633ca5c598e24ba31`.
The optional components include Evolution and the unregistered hosted MCP hook
relay; packaging does not activate either for this desktop task.

## Staged results

- `test-windows-features.mjs` passed against the staged `src-tauri/resources`
  directory: bundled Node, ARE product health, route/context decisions,
  Reasoning State, bounded plan context, thread/decision client imports, and
  native Evolution SQLite write, observe, reopen, and replay. Its active-thread
  claim is explicitly limited to development-gateway backend threads.
- `test-windows-ui.mjs` passed against the staged executable's real WebView2
  window in an isolated profile. The orb rendered, opened a nonblank dashboard,
  all seven destinations appeared, and keyboard focus, skin, corner preference,
  refresh, contrast, and reduced-motion checks passed. Unconfigured Adapters,
  Threads, Decisions, and Evolution remained visibly unconfigured.
- A second native WebView2 run with a test-only live gateway passed. It showed
  the adapter path, one gateway reasoning-state thread, a thread-specific
  decision link and return focus, then cleared live postures on gateway loss
  without changing product health. This is a fixture, not this desktop task.
- The current source browser fixture separately passed its relay-required
  per-thread catalog-check display. The native WebView2 fixture above did not
  exercise that new per-thread relay-check row; do not count it as native UI
  proof of the row or as continuing hook availability.

The first feature-probe command was given an executable path rather than the
documented resource-directory argument and exited before tests. The corrected
invocation passed; this was a test-invocation error, not an ARE failure.

## Claim ceiling

This is a source-built, staged Windows package and native UI smoke result.
The installer was not executed. Installed lifecycle, real desktop pointer and
screen-reader behavior, resource-budget acceptance, complete fail-closed host
effect coverage, and exclusive handover of this chat remain unverified. A
successful product diagnostic and gateway fixture must not be displayed as
ARE control of the current Codex task.

## Same-backend boundary follow-up — 2026-09-29

A newer current-source, unsigned NSIS build is retained at
`D:\are-companion-backend-boundary-20260929.exe` (SHA-256
`a4d0bc10a1cb5ce5638a0b175e1f87dd72dbc3d0ed8c127a32c37b6b943e7e62`).
Its uninstalled stage is `D:\acw-W8LBY7`; the 807-file package closure digest
is `05728e61ba43476b2ff9d4084cfe1a98cf2739aefea1aa3ccb1dba8af3766e43`.
The native staged-WebView baseline passed the orb, nonblank seven-panel
dashboard, skin and placement persistence, keyboard focus, contrast, and
reduced-motion checks. A separate 40-row gateway fixture passed pagination,
per-thread Reasoning State and decision links; those rows were not live host
threads.
The package feature probe passed the exact bundled Node and product health,
route/context CLI decisions, Reasoning State and bounded plan context,
thread/decision observer imports, and native SQLite Evolution write, observe,
reopen and replay. Its reported Core closure digest matches the installer
manifest: `279af146c62be2df8eb58e89c0e2701fb6e9eae9eb14f25ea4b591abdd07a4a3`.

The package-adjacent managed-session smoke passed with the pinned Windows
`codex-cli 0.155.0-alpha.16.4`: the gateway/backend/client path was ready,
the guarded Plan candidate remained labelled as such, and the rendered
Adapters panel displayed `passed-all-active-backends` for the model-free
same-backend sandbox probe. The panel also states that Windows hosted
commands are still disabled because this host has no verified bounded-output
path. The separate native gateway/UI joined canary passed with one actual
gateway backend thread, two decision records, in-flight Reasoning State and
thread-specific decision navigation. It used a loopback fixed provider, made
zero external model calls, and did not touch this desktop task.
The same package then passed the native same-window gateway-restart journey:
the selected adapter epoch changed, old thread/decision correlation cleared,
and the reopened gateway's thread and decision observations reappeared without
reopening the Companion dashboard. This is fixture recovery evidence, not a
power-loss, installed-package, or current-task handover proof.

The four-cycle connected-adapter WebView resource sample passed its lifecycle
checks, but it is not a low-resource acceptance result. With the test debugger
attached, initial orb-only process-tree private bytes were 137,383,936 and
the fourth dashboard-close reading was 169,869,312: 32,485,376 bytes above
that starting point. The same process tree included WebView2 child processes;
this measurement neither isolates a leak from WebView2 caching nor establishes
normal non-debug idle usage. No owner-set numerical budget exists yet.
An additional no-debug orb-only sample returned 136,830,976 private bytes,
309,858,304 working-set bytes and 0.141 CPU seconds across ten seconds for
the seven-process tree. This is closer to normal idle than the debugger run,
but remains one short local sample rather than a sustained budget verdict.

## Open Questions

- Can a supported host API provide exclusive writer handover and all required
  ingress, approval, and effect boundaries for this exact desktop task?
- Does an installed package pass the same seven-panel journey, the per-thread
  relay-check row, normal pointer/accessibility checks, and upgrade/rollback?
- What idle and post-close process-tree resource budget should this Companion
  meet, and does a non-debug normal-desktop run meet it over longer cycles?
