# Linux WSLg pointer and pixel test — 2026-09-28

Status: bounded development evidence, not a Linux release or installed-app test.
TUI is discontinued and outside this UI path.

## Exact scope

- Tested extracted package:
  `dist/are-companion_0.1.0_amd64-current-source-ui-20260927.deb`, SHA-256
  `e13c1e0336914428e2b9ec9cdb93325418a7a2ed970ad19b8da5b1482b2f5256`.
  This package predates the later orb asset split; it is not a build of the
  newest UI source bytes.
- Environment: existing WSLg X11 display `:0` (2560×1440), Ubuntu 26.04
  builder container, extracted package, isolated test preferences, no package
  installation, no external model calls, and no desktop-task handover.
  Test-only WebKit inspector was bound to container loopback with Docker
  network disabled. `xdotool`, `xdpyinfo`, and `xwd` were extracted into a
  disposable tool directory, not system-installed.
- Test sources: [`test-linux-ui.sh`](../scripts/test-linux-ui.sh) and
  [`inspect-linux-ui.mjs`](../scripts/inspect-linux-ui.mjs).

## Result

The X11-reported orb window measured 200×200 under WSLg scaling. The earlier
smoke test used half that physical width and missed the 84-logical-pixel orb
surface. With an orb-ready check and an X11 pointer click at its logical center
(42,42), the dashboard opened at 1120×760. Two isolated inspector-assisted
runs reported `input_method: "x11-synthetic"` and `content_verified: true`;
the inspector was used to check readiness and content, not to open the window.
A separate no-inspector run also reported the X11 click and dashboard window,
with `content_verified: false` as expected because window existence alone
cannot prove content.
The shared-display guard rejected a deliberately pre-existing Companion
window with exit 2 before launching a second test app; a normal rerun then
passed while checking that both windows belonged to its own process.

After renderer readiness, the WebKit inspector verified the Tauri bridge,
bundled product diagnostic, seven navigation panels, Evolution's honest
not-configured states, and a Cobalt skin change. A window-specific XWD capture
then produced nonblank pixels for the floating mark and Evolution dashboard.
The [orb image](evidence/linux-wslg-20260928/orb.png) is 200×200, SHA-256
`b40e2635d70b0107e644f6ba4db002890de51ec30b69d2bce18983d2c98a1b6e`;
the [Evolution dashboard image](evidence/linux-wslg-20260928/evolution-dashboard.png)
is 1120×760, SHA-256
`0f53378555c696c4642d17be2ebbdd504761324cd61041ba9e5a44172fe28500`.
Capturing before renderer readiness produced black images; those were rejected
as a test race, not accepted as product evidence.

This proves X11-delivered synthetic pointer input and visible pixels for this
exact extracted package under WSLg. It does **not** prove human physical-mouse
input, free drag, placement persistence after relaunch, screen-reader use,
other Linux compositors or displays, latest-source binary behavior, numerical
resource budgets, installer lifecycle, or activation of this Codex task.

## Current-source orb-split follow-up

An isolated Ubuntu 26.04 builder produced the later exact development package
[`are-companion_0.1.0_amd64-orb-split-current-20260928.deb`](../dist/are-companion_0.1.0_amd64-orb-split-current-20260928.deb),
SHA-256 `cf4492324889673831151a5d7004e733c9271dd9a2886b26b0ce9af9659b98b5`.
The package bundles Node 26.8.1 and a 754-file standalone ARE closure with
distribution digest `9781d7dff10fde965b7aecfa38d386228d2560b6029ab254dcd872f3bd2ea7dd`.
Its declared system dependencies remain WebKitGTK 4.1 and GTK 3. The package
was extracted, not installed. Bundled `doctor --json` returned product-health
`PASS` and an exact Node match; that is not service readiness.

For the UI test, `xdotool` and X11 test utilities were installed only inside
a disposable builder container. The container was disconnected from external
networking before launch and used the existing WSLg X11 display. The extracted
orb opened the 1120×760 dashboard from an X11 synthetic click at logical
coordinate (42,42), with its window reporting 200×200 under WSLg scaling.
The test-only WebKit inspector verified the Tauri bridge, bundled diagnostic,
all seven panels, Evolution's unconfigured source states, and the Cobalt skin.
The final smoke receipt reported `input_method:"x11-synthetic"` and
`content_verified:true`. Window-specific captures made after renderer readiness
show a visible [orb](evidence/linux-wslg-20260928/orb-split-orb.png) and
[Evolution dashboard](evidence/linux-wslg-20260928/orb-split-dashboard.png).
Their SHA-256 hashes are, respectively,
`b40e2635d70b0107e644f6ba4db002890de51ec30b69d2bce18983d2c98a1b6e`
and `0f53378555c696c4642d17be2ebbdd504761324cd61041ba9e5a44172fe28500`.
Those bytes happen to match the earlier same-display captures; the files were
captured again from this exact new package, not reused to assert a test pass.

This closes the earlier question of whether the orb-split source still opens
and renders under this WSLg/X11 configuration. It does not establish physical
mouse input, free drag, placement persistence, accessibility, normal Linux
desktop/compositor behavior, resource budgets, package installation, or
current-task control.

## Saved-placement regression and drag limit

The same WSLg test environment exposed a startup-placement defect in that
orb-split package: choosing Top right moved the orb and wrote
`orbPlacement:"top-right"` to the isolated preference file, but a fresh app
process loaded that preference while the X11 window returned near the upper
left. The native setup attempted placement before the window manager finished
mapping the orb. A test-only post-render placement call moved the window to
the expected corner, so the product now reapplies the saved placement once
after the orb's first frame without rewriting the preference.

The rebuilt exact development package is
[`are-companion_0.1.0_amd64-placement-restore-20260928.deb`](../dist/are-companion_0.1.0_amd64-placement-restore-20260928.deb),
SHA-256 `ac2be6a3cc0af25fc047cc00ec5a6f013919d0466e4232cb06066b8ef8ec2325`.
It was extracted, not installed. Its bundled Node and ARE `doctor --json`
passed, and the WebKit inspector again verified the orb, seven panels,
Evolution's unconfigured states, and a skin change. The new
[`test-linux-placement.sh`](../scripts/test-linux-placement.sh) uses a private
preference file and checks exact app-window ownership. With the new package,
the orb started at `1174,603`, moved to Top right at `2300,48`, restored to
`2300,48` after process restart, moved to Center at `1174,603`, and restored
to `1174,603` after another restart. The previous package failed this same
test with `expected 2300,48, found 44,86`. UI source tests passed 35/35;
the placement script, inspector syntax, and package build passed. The
container had no external network during UI execution, and the temporary
test container and extracted copies were not installed on the host.

A separate synthetic-drag probe delivered `pointerdown` and `pointermove`
events with the left button held. The Tauri `start_orb_drag` command returned
success, but WSLg did not move the X11 window. That result cannot distinguish
an X11-synthetic/compositor limitation from a remaining free-drag product
issue. Named placement and reset are verified recovery alternatives here;
physical-mouse drag on a normal Linux desktop remains unverified.

## Open Questions

- Does a physical-mouse drag move the orb under normal X11 and Wayland desktop
  sessions? The WSLg synthetic pointer probe did not move it.
- Does the placement-restore package retain this behavior under a normal Linux
  desktop session, including free drag and saved placement after relaunch?
- Which supported Linux distributions, compositor modes, and accessibility
  configurations must pass before release consideration?
