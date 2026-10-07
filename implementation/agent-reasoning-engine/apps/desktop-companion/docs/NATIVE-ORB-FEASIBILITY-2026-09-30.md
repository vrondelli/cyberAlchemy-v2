# Native floating-orb feasibility, 2026-09-30

Status: historical feasibility snapshot. The later
[Windows native-default candidate](OWNED-NATIVE-ORB-HANDOFF-2026-09-30.md#windows-native-default-candidate)
now packages the orb and tests it as the no-argument Windows entry point;
this snapshot alone was neither an installer nor a product verdict. TUI
remains discontinued. No ARE session-control boundary changes here.

## Question and bounded experiment

The existing floating orb lazily creates the dashboard, but its Windows idle
process tree still measured 142,548,992 private bytes in the latest eight-cycle
sample. The root process was small; the WebView2 children dominated. The
[resource baseline](WINDOWS-RESOURCE-BASELINE-2026-09-27.md) is the comparison
source, not a numeric product budget.

The [native-orb spike](../experiments/native-orb/src/main.rs) uses Slint 1.18.1
with a winit/software renderer, an 84×84 transparent always-on-top window,
three skin inputs, an accessible button role, pointer/Enter activation, and
native window dragging. It performs no ARE reads. The initial tested build
merely printed an activation marker and did **not** open the dashboard. A later,
separately tested experimental `--dashboard <executable>` option launches the
new dashboard-only Tauri mode once per live child. A later owned-pipe revision
also focuses the existing child and exits it after normal or forced orb loss.
This is not a shipped or complete process contract. The
production orb remains unchanged. The dependency is pinned in the [experiment manifest](../experiments/native-orb/Cargo.toml)
and lockfile.

## Observed results

| Host and check | Observation | Claim ceiling |
| --- | --- | --- |
| Linux WSLg/X11, Ubuntu 26.04 builder | Release build passed. Window appeared at 84×84; X11-injected pointer click and Enter each emitted one activation. A settled sample showed 15,864 KiB RSS, 14,450 KiB PSS, and 13,556 KiB private clean+dirty. | Containerized WSLg sample, not normal Linux desktop or installed package. |
| Linux WSLg/X11 drag | Two automated pointer-drag attempts left the window at its original position. | Drag is **unverified/failed in this environment**; do not claim Linux feature parity. |
| Linux Xvfb/Openbox drag | The same binary and X11-injected pointer sequence moved the window from (598,358) to (670,406), a 72×48 pixel move. | Supports the native drag mechanism under one disposable X11 window manager, not WSLg, Wayland, or a physical desktop. |
| Native Windows 11, staged executable | The [Windows test helper](../experiments/native-orb/test-windows.ps1) passed an 84×84 window, two activation markers (click and Enter), and native drag moving the window 72×48 pixels for each skin. | Standalone spike only; no dashboard/lifecycle integration. |
| Native Windows idle cost | Verdant: 3,190,784 private bytes; cobalt: 3,256,320; ember: 3,194,880. Working set after interaction was about 20.2 MB. A separate four-second verdant idle sample was 3,264,512 private bytes and 29,904,896 working-set bytes. | Not a full Companion-tree benchmark or owner-approved resource budget. |
| Visual | Cropped screenshots for all three skins showed a colored circular mark and transparent corners. | Styling is a placeholder, not the approved beautiful orb or accessibility/pixel review. |

The staged Windows executable is
`D:\are-native-orb-hRHWdl\target\release\are-native-orb-spike.exe`, SHA-256
`14326648989ef0f224bb32e6141abff3e1f92292a65ee78abd7958b36940e2d4`.
Its three cropped images are `D:\are-native-orb-hRHWdl\orb-windows.png`,
`orb-cobalt.png`, and `orb-ember.png`. The stage is retained, not installed.
The Linux experimental binary SHA-256 is
`c44057630db162aeb15c84aecd981f0adcc84bed25214e3c0d59168c66ad3ffd`.
The experiment lockfile SHA-256 is
`2a400dd1bab3d5e5dc5022320780fde3143d6458fff3717b6c2f220ef9b66da9`.

The Windows comparison is compelling but conditional: roughly 3.2 MB is a
single idle native-orb process, whereas 142.5 MB is the current whole
WebView-orb tree. A real replacement still needs a dashboard process and
possibly a local handoff channel. The delta is therefore an opportunity, not
a measured product saving.

## Experimental native-orb to dashboard handoff

The [owned native-orb handoff evidence](OWNED-NATIVE-ORB-HANDOFF-2026-09-30.md)
now supersedes the first launch-only experiment. A parent-owned stdin pipe
allows a second click to focus the live dashboard and makes the dashboard exit
when the orb is lost. Windows and WSLg checks passed normal close/reopen and
forced-parent-loss journeys, while the default WebView orb remains unchanged.
The updated binary hashes and exact claim ceiling are in that evidence note.
Neither the native orb nor a joint installer is shipped. Linux drag under WSLg,
physical desktop/Wayland behavior, accessibility, licensing, and matched
whole-product resources remain open. A faster synthetic second click was not
reliably observed under WSLg; the settled duplicate-prevention check passed.

## Integration sequence and current progress

1. Define an exact orb-to-dashboard launch/control contract, single-instance
   behavior, package ownership, and failure/restart semantics. It must not
   dispatch ARE turns or expand Companion's read-only authority.
2. A **candidate** `--dashboard-only` Tauri mode now creates the dashboard
   without creating the orb WebView; the default remains the existing WebView
   orb. A current-source WSLg/WebKitGTK smoke verified that mode's seven
   panels and bundled product diagnostic, as well as the default orb-to-
   dashboard journey. A separate native-orb handoff experiment now passes
   normal-close and forced-parent-loss checks on Windows and WSLg; package and
   normal-desktop tests are still required before any entry-point switch.
3. Share only validated local appearance/placement preferences. Preserve all
   three skins, corner reset, keyboard/screen-reader activation, focus ring,
   and drag. The Xvfb/Openbox drag success narrows, but does not explain, the
   WSLg failure; normal Linux X11 and Wayland checks remain required.
4. Package the native launcher plus dashboard binary; test clean install,
   restart, dashboard close/reopen, source loss, and crash recovery separately
   on Windows and Linux. Compare matched idle and active process trees, CPU,
   cold-start latency, and retained post-close memory against an owner-set
   budget.
5. The later Windows candidate now tests a native default entry point while
   retaining `--webview-orb` for diagnosis. This is an extracted-package
   test, not an installed or shipped cutover; Linux, license, resource, and
   operational gates remain open. No live ARE task handover is implied.

The Slint [Window API](https://docs.slint.dev/latest/docs/slint/reference/window/window/)
documents frameless/always-on-top windows; its
[WindowMoveArea](https://docs.slint.dev/latest/docs/slint/reference/window/windowmovearea/)
documents native dragging on supported winit platforms. Its
[license terms](https://slint.dev/terms-and-conditions) offer a royalty-free
desktop option with attribution conditions in addition to GPLv3; adoption
requires a deliberate project license/notice choice. None is selected by this
experiment.

## Open Questions

- What numeric idle/active memory, CPU, and cold-start budgets will the
  Companion owner accept, using which host/OS versions?
- Why did WSLg/X11 ignore the same pointer drag that moved the window under
  Xvfb/Openbox and native Windows? A normal X11 and Wayland desktop check is
  still needed.
- Which side owns native-orb/dashboard process lifetime, and how is a click
  handled when dashboard startup fails or an old dashboard is still running?
- Which Slint license path and required attribution notice would be used if
  this renderer were shipped?
