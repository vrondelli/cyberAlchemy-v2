# Actual narrow Windows Evolution — 2026-10-02

Status: unsigned candidate construction and isolated staged-executable evidence.
Authority effect: none. The installer was not installed, admitted, signed or
released. Parent: [whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md);
experience contract: [Evolution UX](ux/EVOLUTION.md).

## Gap and correction

The prior Windows build rendered correctly when WebView2 metrics were emulated
at 340 × 740, but its Tauri dashboard still declared a 760 px minimum inner
width. A Win32 `WM_GETMINMAXINFO` probe measured a 776 px minimum tracking
width. Programmatic resizing could bypass this limit, so a successful capture
alone did not prove a person could resize the window that narrow. The current
source changes the minimum inner width to 320 px; the default 1120 × 760 and
minimum 540 px height are unchanged. The new native test checks the operating
system's tracking limit as well as the measured WebView2 viewport.

## Exact candidate and results

The retained native Windows stage was incrementally rebuilt with the changed
Tauri source and pinned Rust 1.98.1 toolchain. The distinct, unsigned NSIS
candidate is `/mnt/d/ARE_Companion_Evolution_native_narrow_20261002_x64-setup.exe`
(33,822,770 bytes; SHA-256
`b047986ada7924f60ea573b89ea1e3b44d8630a681b386e9b241ec33a370c1f5`).
No prior installer was overwritten. The staged 13-check Windows feature probe
passed, including bundled Node exactness, product-health PASS, route/context,
Reasoning State load, and Evolution SQLite/observer replay. It reported
product `0.10.0-rc.1` and closure digest
`2d7ff4ed56d5ff108276fecedbfa1db364b78f29e02755c91b3bce25ffdb6f63`.

The isolated [Windows UI harness](../scripts/test-windows-ui.mjs) now accepts
`--evolution-native-narrow`. It identifies the test-launched dashboard by
both root PID and exact title, obtains `devicePixelRatio`, queries Win32
minimum tracking size, resizes the actual client area, and reads its WebView2
viewport without a device-metrics override. The new candidate measured:

| Measurement | Old executable | New executable |
| --- | ---: | ---: |
| Native minimum tracking width | 776 px | 336 px |
| Requested outer width for a 340 px client | 356 px | 356 px |
| Achieved client viewport | 340 × 740 px when forced | 340 × 740 px |

The old executable fails the new user-resize admission check; the new one
passes. Both registry-only and isolated one-cycle verified-ledger journeys
passed all seven panels, source-aware headings, first useful Evolution content
within the initial viewport, keyboard/focus and appearance checks, with no
horizontal document overflow. The registry-only
[/mnt/d/acw/are-evolution-registry-actual-20261002.png](/mnt/d/acw/are-evolution-registry-actual-20261002.png)
and verified-ledger
[/mnt/d/acw/are-evolution-verified-actual-20261002.png](/mnt/d/acw/are-evolution-verified-actual-20261002.png)
captures were visually inspected. The navigation strip scrolls horizontally
inside its own region; the document itself does not overflow.

The matching extracted Linux package separately advertises 320 × 540 via
X11 `WM_NORMAL_HINTS`; its real 340 × 740 registry-only and verified-ledger
WebKitGTK journeys pass with that OS-level guard.

## Claim ceiling and open questions

This is a staged development executable and an unsigned, uninstalled installer.
It proves neither manual mouse resizing nor assistive-technology speech/focus
traversal, installed upgrade/rollback, Wayland, a longer idle-resource budget,
live Evolution workers, nor control of the current Codex task. These remain
open, along with the security/admission gate for enabled live read paths.
