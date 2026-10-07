# Current-source Linux native Companion package — 2026-10-01

Status: bounded, unsigned and uninstalled development candidate. Authority effect:
none. TUI is discontinued and is not a package, UI, or parity target.

## Exact package

- The current guarded-source successor is
  [`are-companion_0.1.0_amd64-current-20261001-g2.deb`](../dist/are-companion_0.1.0_amd64-current-20261001-g2.deb):
  45,774,338 bytes, SHA-256
  `1b81eb14c058f43746cdac2cbb410a2ad0a8fcffd92d7f5f7346b6a56c2231cf`.
  It was built offline in the same existing builder image after the model-wire
  guard's fatal UTF-8 request-decoding change. Its 813-file development closure
  digest is `5f4f5b61ae25bf5ca76a9f152235f9aab768fd3faf4868a9ed581fbe5d1e4bce`.
  An uninstalled extraction had byte-identical guard source, passed all 13
  bundled guard tests with bundled Node 26.8.1, and returned `PASS` from
  bundled `are doctor --json`. No TUI path was present in the extracted ARE
  closure. The extracted Tauri dashboard and native-orb executable hashes
  exactly match g1 (`c3b25fac27b878cb47ce94d1629adbb1bc382b4a1ea53d0030dcb186f43208d7`
  and `e28316906476fddf5f8d567293fa2596924117dfdf1dc2b61fe8c2f2b9048560`).
  The g1 UI checks below therefore cover identical native UI binaries, but
  no g2-specific native-window run is claimed here.
- [`are-companion_0.1.0_amd64-current-20261001-g1.deb`](../dist/are-companion_0.1.0_amd64-current-20261001-g1.deb): 45,773,644 bytes, SHA-256 `73d86134a9eed885d6d2adc58833779df59914620a43492c5bb005f613fe9579`.
- Built from the current checkout offline in the existing Ubuntu 26.04
  `are-companion-builder:native-managed-20260930` image, with Node 26.8.1 and
  the repository-locked Rust 1.98.1 toolchain. No host packages were installed.
  Temporary distribution staging had to be outside the source tree; the first
  attempt correctly rejected staging under `dist/`, and the `/var/tmp` retry
  succeeded. The failed staging directory was removed after diagnosis.
- The builder reported an 813-file development closure with digest
  `9c36bf898bd260083a8db16aa63c924773e76b7aac3f67a06dcac88808816808`.
  `dpkg-deb` inspection found the native Slint orb, Tauri dashboard, bundled
  Node and ARE. The extracted ARE tree contained 813 files and no TUI path.
  Bundled `are doctor --json` reported product status `PASS`, version
  `0.10.0-rc.1`, and an exact Node version match. Product health does not prove
  live adapter, session, or host-task readiness.
- A package-only feature check used bundled Node to obtain a direct
  `CA2-ROUTE-UNDERSTAND` decision and direct context preflight, load the
  Reasoning State and backend-thread observation modules, and read all five
  Evolution candidate definitions with no configured ledger root. These are
  loadability and local decision checks, not live-thread or cycle execution.

## Extracted-package UI checks

The package was extracted, not installed, and run as UID 1000 in a
network-disabled Ubuntu 26.04 container attached to WSLg/X11. An isolated
test home and test-only local WebKit inspector were used. The dashboard-only
WebKitGTK view had a working Tauri bridge, no orb WebView, a passing bundled
product diagnostic, and all seven panels: Overview, Adapters, Threads,
Decisions, Evolution, Diagnostics, and Appearance.

- The [bundled launch test](../experiments/native-orb/test-linux-bundled-launch.sh)
  passed both repeated-launch activation and a separate synthetic-X11-pointer
  run: native orb drag and click, owned dashboard, no duplicate processes,
  close/reopen, and child exit after abrupt orb loss.
- The [appearance test](../experiments/native-orb/test-linux-bundled-appearance.sh)
  passed ember and cobalt selection, native-orb X11 pixel-color assertions,
  and saved skin after dashboard reopen and orb restart.
- The new [native placement test](../experiments/native-orb/test-linux-bundled-placement.sh)
  passed saved Center (`1238,678`), Top right (`2460,16`), Center again,
  synthetic drag (`1280,675`), restoration on dashboard reopen, and restoration
  after orb restart. It checks the actual native X11 window coordinates, not
  only the preference or the dashboard message. Its test-only X11 pointer
  helper was compiled with the locked repository toolchain in the builder
  container. `bash -n` passed for the new harness.

These checks establish WSLg/X11 synthetic input and pixels for this exact
uninstalled package. They do not establish physical-pointer behavior on a
normal Linux desktop, Wayland placement, accessibility, long-duration or
numerically budgeted resource use, signing, installed lifecycle, or control of
this Codex desktop task. The Companion remains a read-only observer; opening
it does not activate an ARE-managed chat.

## G2 idle-resource observation

The [bounded native idle probe](../experiments/native-orb/measure-linux-idle.mjs)
launched the uninstalled g2 payload in a network-disabled Ubuntu 26.04
container against WSLg/X11. It sampled `/proc` for the native orb and all its
live descendants, including the dashboard and WebKit processes when open. It
used isolated XDG state, no inspector, and terminated the exact orb it started.

| Mode | Duration | Live processes | Initial → final PSS | Initial → final summed RSS | CPU, one-core equivalent |
| --- | ---: | ---: | ---: | ---: | ---: |
| Floating icon only | 15.0 s | 1 | 15,826 → 15,826 KiB | 17,184 → 17,184 KiB | 0% (0 added ticks) |
| Dashboard open, first sample | 15.1 s | 4 | 258,665 → 258,374 KiB | 408,496 → 408,920 KiB | 3.46% |
| Dashboard open, repeat | 30.0 s | 4 | 259,324 → 261,491 KiB | 408,464 → 411,076 KiB | 1.90% |
| After ordinary X11 dashboard close | 15.0 s | 1 | 15,780 → 15,780 KiB | 17,104 → 17,104 KiB | 0% (0 added ticks) |

The four-process mode included one native orb, one dashboard, one WebKit network
process and one WebKit web process. The close-mode run used the existing
PID-checked X11 helper to send `WM_DELETE_WINDOW` to the owned dashboard;
its dashboard and WebKit children exited, leaving one orb process. Immediately
before that close, the four-process group measured 256,434 KiB PSS. One
failed preliminary close measurement counted a terminated zombie as a live
descendant; the probe now excludes zombies and still checks the original
process identities before accepting the transition. PSS avoids counting shared pages in full
for each process; summed RSS is included only as a diagnostic. These short
WSLg/container observations distinguish a low-idle-cost icon from the more
expensive open dashboard. No numerical product budget, normal desktop result,
Wayland result, long-duration trend, or causal attribution of dashboard CPU
to polling versus WebKit is established.

## Open Questions

- Does the exact package behave the same after installation on normal X11 and
  Wayland desktops, including physical drag, focus, skin and recovery?
- What measured resource and accessibility budgets must the product meet?
- Can the open-window idle cost be reduced without weakening fresh diagnostic
  and Reasoning State reporting? Does the X11 close result generalize to a
  normal installed desktop and Wayland?
- Which supported host mechanism can exclusively hand over the exact desktop
  task before its UI may call that task ARE-managed?
