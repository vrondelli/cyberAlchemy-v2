# Linux Companion UI refresh — 2026-10-03

Status: bounded development evidence. Authority effect: none. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md). The package was
extracted, not installed, admitted, signed, or released.

## Exact candidate

The current source, including the compact one-line “Refresh view” treatment,
was built offline in the existing Ubuntu 26.04 builder using bundled Node
26.8.1 and the repository-locked Rust toolchain. The unsigned
[Linux package](../dist/are-companion_0.1.0_amd64-ui-refresh-20261003.deb) is
45,846,178 bytes, SHA-256
`f428b447d4fb3bd5d56fcb152f81d26c5e9220118fab5d5e607088d771897b3f`.
The development ARE closure has 839 files and digest
`369cb29c6c6e3b4f10a53d008d06c1abd33f55d0cb3e77473255d23c17d30af9`.
Its extracted bundled Node ran ARE `doctor --json`: `PASS`, version
`0.10.0-rc.1`, exact Node match. No discontinued TUI path was found.

## Native window result

The extracted executable ran as UID 1000 in an isolated, network-disabled
Ubuntu container on WSLg/X11, with a test-only loopback WebKit inspector. The
dashboard-only launch exposed a working Tauri bridge, all seven panels, and a
passing bundled product diagnostic. The owned-PID X11 helper checked the
320 × 540 native minimum and resized the actual client to 340 × 740.

Both separate journeys passed: registry-only shows five candidate definitions
without inventing a cycle; an isolated SQLite fixture shows its one verified
cycle before the metrics and definitions. Each keeps the first useful item in
the first viewport, the active navigation item visible, no horizontal document
overflow, and “Refresh view” on one line within the viewport. The native
[registry-only capture](/home/vlad_/.cache/are-ui-build-20261003-rhkhQx1h/linux-evolution-registry-20261003.png)
and [verified-ledger capture](/home/vlad_/.cache/are-ui-build-20261003-rhkhQx1h/linux-evolution-verified-20261003.png)
were visually inspected. The test-only Linux inspector now asserts the compact
Refresh treatment so a later regression is caught in the native window.

The source dashboard test suite passed 63/63; the Linux inspector and narrow
shell harness passed syntax checks. The optional Chromium source journey was
not rerun in this environment because `playwright-core` is unavailable here;
the current native WebKit result is independent of that browser harness.

## Claim ceiling

This does not prove a normal installed Linux desktop, physical pointer use,
screen-reader traversal, a numerical idle resource budget, live Evolution
worker state, installer lifecycle, or control of the current Codex task. The
fixture is synthetic candidate evidence, not an admitted Evolution cycle.

## Open Questions

- How does the narrow layout behave under a normal Wayland and X11 desktop,
  including manual pointer and screen-reader navigation?
- What exact installed-package upgrade/rollback and resource budgets define
  the eventual release gate?
