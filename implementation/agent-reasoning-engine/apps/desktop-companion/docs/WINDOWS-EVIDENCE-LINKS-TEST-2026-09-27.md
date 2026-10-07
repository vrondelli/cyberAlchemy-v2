# ARE Companion exact Evidence links: staged Windows check

Status: bounded development evidence, 2026-09-27. The TUI is discontinued.
This check did not run the installer, install the app, activate this desktop
task, or enable any repair/control action.

## Build and validation

- Current-source native Windows Node 26.8.1 and pinned Rust 1.98.1 MSVC built
  the unsigned NSIS installer
  `dist/ARE_Companion_0.1.0_x64-setup-evidence-links-20260927.exe`.
  It is 29,377,190 bytes, SHA-256
  `35f8a962d556f0fb58198adf3f8ac60d45baf2bad9d3fb05ec8834329b59799d`.
  The isolated stage was retained at
  `C:\Users\vlad_\AppData\Local\Temp\acw-Mx72MT` for testing.
- `test-windows-features.mjs` passed against that stage: bundled Node,
  product health, route/context, Reasoning State, observation clients and
  fail-closed native Windows Evolution writer behavior.
- `test-windows-ui.mjs` passed in the unconfigured mode and in
  `--adapter-live --confirmed-recovery` mode. Both isolated WebView2 runs
  opened the orb and nonblank seven-page dashboard, followed each of the
  Adapter, Thread, Decision, Evolution ledger and gateway candidate-inbox
  links to its own focusable Evidence source row, and returned to the owning
  page with heading focus. The live fixture kept gateway recovery distinct
  from desktop-task activation and cleared independent source claims after
  gateway loss.
- The source UI fixture suite passed 27/27. The real Chromium navigation
  journey passed 56 checks with no page errors, including exact issue focus,
  return navigation, narrow layout and decision-epoch mismatch behavior.

## Claim ceiling

The links are navigation to source-scoped explanations, not a diagnostic
repair capability. The live gateway in this Windows UI check is a local
fixture, not the current desktop task. The installer is unsigned and
uninstalled. Exact task handover, installed-package lifecycle, Linux physical
pointer/accessibility behavior and a numerical idle-resource budget remain
unverified.

## Open Questions

- Which issue-specific technical details can be shown without exposing
  private thread content, paths or secrets?
- What installed-package and cross-OS interaction matrix is required before
  product approval?
