# Owned native-orb handoff candidate, 2026-09-30

Status: latest Windows and Linux candidates use the bundled native orb by
default, but remain extracted, uninstalled development integrations. The TUI
is discontinued and excluded. Authority effect: none; this does not hand over
the current Codex task to ARE.

## Contract implemented

The experimental Slint orb starts the Tauri dashboard with
`--dashboard-only --orb-owned-stdin` and retains its child's stdin pipe. A
second activation writes the bounded `focus` command; Tauri schedules its
existing show/focus path on the main thread. The orb does not launch a second
live child. If the dashboard has exited, another click launches a new one.
EOF on the owned pipe requests dashboard exit, including when the orb process
is forcibly terminated. This channel does not carry model turns, approvals,
ARE effects, credentials, or gateway data. Standalone `--dashboard-only` and
the default WebView orb do not use this optional ownership mode.

The follow-on appearance candidate also pipes bounded dashboard stdout back
to its owning orb. Only exact `ARE_COMPANION_ORB_SKIN` lines naming one of the
three known skins are accepted; other output and overlong lines are ignored.
The dashboard sends its saved skin at startup and after a successful Appearance
change. This is local UI state transfer, not an ARE session-control channel.

The next candidate sends an exact, bounded `ARE_COMPANION_ORB_POSITION x y`
line for native Windows and selected Linux X11 placement presets. Tauri
computes physical coordinates from the dashboard monitor's usable work area;
the Slint orb applies them on its UI thread. Initial saved placement is resent
when the dashboard opens. On Linux, the owned orb opts its dashboard child
into `GDK_BACKEND=x11` and marks its selected native backend as X11 only when
`SLINT_BACKEND=winit-x11` and `DISPLAY` is present, or when X11 is selected
without a Wayland display. The dashboard requires those same X11 markers
before saving a native placement preset. Wayland native placement remains
explicitly unsupported; free drag remains separate.

## Observed checks

- WSLg/X11 source-built candidate, 2026-10-01: the native Slint orb appeared
  as an 84×84 X11 window and opened the owned Tauri dashboard. Appearance
  selected Top right and moved the actual native window to `(2460, 16)`;
  Reset to center moved it to `(1238, 678)`. Both selections were read back
  from the saved preference. After closing the dashboard, moving the orb from
  center to `(1318, 734)`, and clicking again, the newly opened dashboard
  restored the saved center position. Closing the orb exited its owned
  dashboard; no test-owned orb or dashboard process remained. Rust unit tests
  passed 3/3 for the orb and 8/8 for Tauri; the inspector script passed its
  syntax check. These are source-built development binaries, not installer or
  normal Linux desktop evidence. The test used an isolated dependency overlay
  because the pinned desktop bootstrap currently returns HTTP 404 for five
  archives; no system packages were installed. WSLg WebKit required a
  test-only virtual mapping for its helper path. The dashboard's product
  diagnostic displayed `Stale` at a later inspection, so this run does not
  claim a current whole-product diagnostic PASS. No Wayland placement test or
  current Codex task handover was performed.

- Native Windows 11: the current staged Tauri executable passed the default
  orb-to-dashboard WebView2 journey and the separate dashboard-only seven-panel
  journey with no orb WebView and a passing bundled ARE diagnostic.
- Native Windows 11: the [native launch test](../experiments/native-orb/test-windows-launch.ps1)
  passed one dashboard launch, duplicate prevention, foreground focus after a
  second icon click, close/reopen to a new child, and owned-child exit on normal
  orb close. A separate forced orb termination also caused its dashboard child
  to exit within the test timeout. Both modes passed against the staged binary
  and again against the actual NSIS-extracted binary.
- WSLg/X11: the current Linux release binaries passed the default orb journey,
  standalone dashboard-only journey, and native-orb-to-dashboard handoff. The
  [PID-checked X11 helper](../experiments/native-orb/test-linux-pointer.c)
  closed the first dashboard by its normal window protocol; a new click
  reopened a verified seven-panel dashboard; normal orb close exited the new
  child. A separate `SIGKILL` of the orb caused its child to exit after pipe
  EOF. This is WSLg/container evidence, not a normal Linux desktop or Wayland
  verdict.
- The actual NSIS archive extracted with integrity success to
  `D:\are-nsis-owned-fANG1A` (820 files). Its bundled runtime passed 13 feature
  checks; the extracted WebView2 executable passed default and dashboard-only
  journeys, then the separate native orb launched and recovered that same
  extracted executable. The extracted executable SHA-256 is
  `67da9e4203a103e2817c884983e75187c5e18e05ff5dfb9db4dc52609c074911`.
  The extracted `are/` resource tree compares byte-for-byte with the retained
  stage. No discontinued TUI path was found in that tree.
- Two local Windows ten-second orb-only samples, with no dashboard or gateway,
  measured 141,819,904 private bytes across the packaged Tauri/WebView orb's
  seven processes versus 3,256,320 private bytes in the separate Slint orb's
  one process. The respective working sets were 311,353,344 and 20,013,056
  bytes; CPU deltas were 0.0625 and 0 seconds. This is an idle-shell
  comparison, **not** a joined product-tree measurement or an accepted
  resource-budget verdict.
- Follow-on native Windows 11 candidate: the new orb and staged dashboard
  passed initial saved-skin synchronization for cobalt and ember, duplicate
  prevention, foreground focus, close/reopen, normal child cleanup, and forced
  orb-loss cleanup. A test-only WebView2 inspector opened Appearance, selected
  ember while the cobalt orb and dashboard were running, verified the saved
  preference, and observed the native orb apply ember. The current dashboard
  source passed 48/48 UI tests and 5/5 Tauri unit tests; the native orb's
  bounded message parser passed its unit test. The current Windows staged
  dashboard passed the default 36-check WebView2 journey and the separate
  dashboard-only seven-panel journey. Remote debugging was enabled only for
  the test process, not in the packaged app.
- Native Windows placement candidate: the dashboard's Top right control moved
  the separate native orb to the requested physical window coordinates and
  saved the preference. After closing the dashboard and moving the disposable
  orb elsewhere, reopening the dashboard restored Top right; Reset to center
  then moved it again and saved Center. The same test retained skin change,
  focus, duplicate prevention, and normal child cleanup. A separate forced
  orb-loss run after placement exited its dashboard child. The default WebView
  journey and dashboard-only journey passed on the new staged executable.
  Linux Tauri placement geometry tests passed 2/2 (total Tauri 7/7), native
  message parser tests passed 2/2, and the unchanged dashboard UI suite passed
  48/48. The same normal and forced-parent-loss native-orb tests passed again
  against the latest NSIS-extracted dashboard executable. The extracted
  executable also passed the 36-check default WebView2 journey and the
  dashboard-only seven-panel journey; its bundled ARE runtime passed all 13
  feature checks.

The unsigned, **uninstalled** Tauri installer is
`D:\ARE_Companion_0.1.0_x64-orb-owned-20260930.exe` (SHA-256
`99b1df0358acb64aba0e052afafcf355270888106404322814a1a2cfe0fa7559`).
Its retained build stage is `D:\acw-LMELxO`; the tested executable SHA-256 is
`1888fe00b97e63b92d01154cbe446e664e429bf00293a0c8e2116e703f70d036`.
The **separate, unbundled** Windows native orb is
`D:\are-native-orb-dashboard-admk2h\target\release\are-native-orb-spike.exe`
(SHA-256 `fa41afbecd41063968adce14fca4e421cf071c157b60f8a63751840b9aa69b35`).
The tested Linux Tauri and native-orb release binary SHA-256 values are
`575935c05f153210c95decd58e56fd77ad8c8ca69769deebb9104112fbcedc03`
and `e7c60818c1670421ad6f2bcb771d16ebe96dbcbd07f2b18b6d3a1cf893f08160`,
respectively. No Slint orb is included in the NSIS package.

The follow-on **unsigned, uninstalled** Tauri-only installer is
`D:\ARE_Companion_0.1.0_x64-skin-stdio-20260930.exe` (SHA-256
`617697f57c8ea1423ae1c8f9345955c5bfe907412d98c9a694ad32689573fb4c`).
Its retained stage is `D:\acw-ild6Oq`; the tested staged dashboard executable
has SHA-256 `7f120f906939478717493f0395ced2d833a9f7c557e29ec638234e6bc1edad51`.
The **separate, unbundled** new native orb is
`D:\are-native-orb-skin-S05xB5\target\release\are-native-orb-spike.exe`
(SHA-256 `ff0825c8247e0de22aaa43993a19c6b17422b4284d409f45d1ff2ed10054be87`).
The new installer itself has not been extracted or installed.

The later **unsigned, uninstalled** Tauri-only installer is
`D:\ARE_Companion_0.1.0_x64-native-placement-20260930.exe` (SHA-256
`e10f9510bc83d56f9eb1c84859a3c7d0e4583578e3b8ff8b571469850dcb9e29`).
Its retained stage is `D:\acw-j61qHQ`; the tested staged executable SHA-256 is
`9649dcade48e4e5b146e8f5d8fe1ff3531e95e2c5a286401f5a7ef60dcf45da3`.
The matching **separate, unbundled** native orb is
`D:\are-native-orb-placement-amjasT\target\release\are-native-orb-spike.exe`
(SHA-256 `fe33daf1123c8c541bd5b9850dd8a2e8a8f0e301b7299dc952d80c8aa7cc7466`).
The NSIS archive passed its integrity check and was extracted to
`D:\are-nsis-placement-Kg8jsl` (820 files). Its extracted dashboard executable
has SHA-256 `dbd3ece47157d5fae7c754232f137baa3a43759cd069a2cb76a84135d78bceaa`;
the extracted `are/` resource tree compares byte-for-byte with the retained
stage. The extracted Node binary has SHA-256
`5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.
The current checkout source files match their respective retained build-stage
source files byte-for-byte. No Slint orb is included in this NSIS package.

## Opt-in bundled Windows candidate

The Windows builder now accepts `--include-native-orb`. It copies the pinned
native-orb manifest, lockfile, and source into a fresh build stage, compiles
that binary with the pinned Windows toolchain, and includes it as
`native-orb/are-native-orb.exe` in the same NSIS payload as the dashboard.
The packaged dashboard accepts `--native-orb` as an explicit launcher mode:
it locates that exact bundled sibling and starts it with the same dashboard
executable path. At this opt-in stage, the installer shortcut and normal
WebView-orb default were unchanged. The launcher carries no ARE authority or
current-task handover.

The new unsigned, **uninstalled** installer is
`D:\ARE_Companion_0.1.0_x64-bundled-orb-20260930.exe` (SHA-256
`3faf5ea2ed66887666ec99453eec0bc9327fe3698621cbea1077c75f57a1643e`).
Its retained stage is `D:\acw-mgVjTI`; the NSIS archive passed integrity
testing and was extracted to `D:\are-nsis-bundled-busXaN` (821 files).
The extracted native orb matches the staged resource byte-for-byte (SHA-256
`ba66624b170a1886cb34a2081ae6e369e4d80adb78cfa9c0821babc16def2086`).
The extracted dashboard executable has SHA-256
`96f03f82d6015e3606b7ff0a7aae6a42346fcfbe9da50c8b11568778a435a076`;
its `are/` resource tree compares byte-for-byte with the retained stage, and
the bundled Node binary has SHA-256
`5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.
The staged Tauri and native-orb source files match the current checkout source
files byte-for-byte. No discontinued TUI path was found in the extracted ARE
tree.

Against this exact extraction, the bundled runtime passed all 13 Windows
feature checks, the default WebView orb passed its 36-check seven-panel UI
journey, and dashboard-only opened all seven panels with no orb WebView.
The [packaged-launch test](../experiments/native-orb/test-windows-bundled-launch.ps1)
passed exact sibling launch, an 84×84 native window, click-to-open, duplicate
prevention and foreground focus, dashboard close/reopen, normal child cleanup,
and a separate forced orb-loss cleanup. The direct
[native-orb handoff test](../experiments/native-orb/test-windows-launch.ps1)
on those same extracted binaries additionally passed initial and live skin
transfer, Top right placement, saved-placement restoration, and Reset to
center. The 48/48 dashboard UI suite also passed. These are local Windows 11
candidate tests; the installer was not run or installed.

## Windows native-default candidate

The next candidate makes no-argument Windows startup select the bundled
native orb when the exact `native-orb/are-native-orb.exe` sibling exists.
`--webview-orb` remains an explicit diagnostic fallback; `--dashboard-only`
continues to open only the dashboard. An explicit `--native-orb` request fails
if the sibling is absent, while an unbundled no-argument build keeps its
existing WebView orb. The launcher gives its orb null standard streams; the
owned dashboard-to-orb appearance pipe is separate and unchanged.

The native orb now holds a session-local Windows named mutex for its lifetime.
A repeated launch exits the duplicate orb process rather than leaving a
second floating icon or a second dashboard owner. This is duplicate UI
prevention, not a security or authority boundary. At this earlier candidate,
repeated launcher activation did **not yet** signal the existing orb to open
or focus its dashboard; the following candidate addresses that gap.

The new unsigned, **uninstalled** installer is
`D:\ARE_Companion_0.1.0_x64-native-default-20260930.exe` (SHA-256
`8686769a7b6eae1dba972cfe30bb7f74fba368f3a7a4bbac1cc71c58c93fe5b6`).
Its retained stage is `D:\acw-tFgyG0`. The NSIS archive passed integrity
testing and was extracted to `D:\are-nsis-native-default-EKfgnt` (821 files).
The extracted dashboard executable has SHA-256
`6e003d43dc3ee3b0c66ec7b35b1790dd63dc5968751bd7c1a69b976e5d5139e8`;
the extracted native orb has SHA-256
`8623a98c9e47db8861defcbc3a28e945bb1eeeef40de01a4e539a4f6abf24ded`.
The orb matches the staged resource byte-for-byte, the extracted `are/` tree
matches the stage, and the staged Tauri/native-orb sources match the current
checkout. Bundled Node remains the exact 26.8.1 executable (SHA-256
`5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`).
No discontinued TUI path was found in the extracted ARE tree.

Against this exact extraction, the ARE feature probe passed all 13 checks
with core closure digest
`39acf46535115321e03b1c06291b9e580f60e9fa27dd39c848d2fa1c079f7fc8`.
The [default-startup test](../experiments/native-orb/test-windows-bundled-launch.ps1)
passed two normal runs and one forced-orb-loss run: no-argument launch,
84×84 native icon, one orb after a repeated launch, one dashboard after
repeated clicks, foreground focus, dashboard close/reopen, and owned-child
exit. A direct handoff run on the same extracted binaries passed live skin
and placement changes plus restore/reset. The 36-check WebView2 UI journey
passed via explicit `--webview-orb`; dashboard-only passed all seven panels
without an orb WebView. The source dashboard suite passed 48/48. Initial
pointer-injection timing failures were addressed in the bounded test helper
by waiting for the settled native window and retrying click/focus; the final
three default-startup runs passed. These checks do not prove installed
shortcuts, reboot persistence, physical Linux behavior, or current-chat
control.

## Windows repeated-launch activation candidate

The native orb now scopes its session-local mutex and auto-reset activation
event to the canonical dashboard executable path. A duplicate process signals
the existing orb and exits; the orb schedules its ordinary activation callback
on the UI event loop. The first signal opens its owned dashboard, and later
signals send the existing child its focus request. A one-second bounded retry
covers the interval between mutex creation and event creation. Separate
installations no longer share the same singleton name. This is local UI
coordination, not an ARE authority or security boundary.

The new unsigned, **uninstalled** installer is
`D:\ARE_Companion_0.1.0_x64-activation-20260930.exe` (SHA-256
`f04c50f0354c01deb412170a90baeed71d0839cf369484b788db78a738f8ba17`).
Its retained stage is `D:\acw-fFBBJO`. The NSIS archive passed integrity
testing and extracted to `D:\are-nsis-activation-jTYkUZ` (821 files). The
extracted orb SHA-256 is
`cea1c53b95b520c41e5463aa4950d47c66324080e0024be8125744464ca88c02`,
identical to the staged resource. The extracted dashboard SHA-256 is
`f2281b786e81bf3f6368a5554d91788c8ee70744a0f9d78052933be0078c8354`;
NSIS changed exactly three bundle-type bytes relative to the staged executable.
Staged Tauri and orb sources match the checkout; extracted Node matches the
stage byte-for-byte.

The exact extraction passed the 13-check ARE feature probe with core closure
digest `39acf46535115321e03b1c06291b9e580f60e9fa27dd39c848d2fa1c079f7fc8`.
The packaged-launch test passed two normal runs and one forced-orb-loss run:
repeated launch opened the dashboard without an icon click, a later launch
focused the same dashboard from a foreground sentinel, no duplicate orb or
dashboard appeared, icon click reopened a closed dashboard, and the owned
child exited on normal or abrupt orb loss. The direct appearance test passed
live skin, placement, saved-position restore, and reset against these exact
extracted binaries. Its direct background-process focus request was sent but
did not always receive Windows foreground permission; foreground focus is
claimed only for the user-initiated packaged-launch journey above. Pointer
injection required bounded retries in the packaged test; the appearance test
uses duplicate-launch activation to isolate its skin/placement assertions.
This candidate has not been installed, signed, upgraded, or rollback-tested.

## Linux native-default package candidate

The Linux builder now compiles and bundles the pinned Slint orb alongside the
Tauri launcher and ARE/Node resource tree. No-argument launch selects the
exact `bin/native-orb/are-native-orb` sibling; `--webview-orb` remains an
explicit fallback, while an unbundled development build retains its WebView
default. The Linux orb holds a per-user, per-session, per-dashboard-path
abstract Unix socket. A repeated launcher invocation signals the existing
orb's normal activation callback, opening or focusing its owned dashboard
without a second orb. The socket is released when its process exits, so an
abrupt orb loss permits a new launch. This local UI coordination conveys no
ARE authority, approvals, model turns, or host-session control.

The unsigned, **uninstalled** candidate is
[`are-companion_0.1.0_amd64-native-default-x11dep-20260930.deb`](../dist/are-companion_0.1.0_amd64-native-default-x11dep-20260930.deb)
(45,778,476 bytes; SHA-256
`52d3be1052bf9aec42b7fb6a965976eda2e0a02e48cee2adf25b51d7a8db9d7b`).
It was built offline in the pinned Ubuntu 26.04 builder and extracted without
installing it. The package declares GTK/WebKit, fontconfig, xkbcommon,
`libxkbcommon-x11-0`, Wayland, and X11 dependencies. The extracted dashboard
and orb SHA-256 values are
`cab47cdc1e40ceae01e8f30267b89a4fd55f89c341feb4af6e52b8c663d83e58`
and `df2a5069efb8c5fc6d044c9c9702cf636d3b769cf400edb88819f3f2055fa2ac`;
both match the built binaries. Its bundled ARE `doctor --json` passed for
`0.10.0-rc.1` with core closure digest
`aac529c47a3e42535f40f7a639e689e0e9eb77bfc9a1ae187f296743d4c84748`.

The [bundled-launch test](../experiments/native-orb/test-linux-bundled-launch.sh)
passed against this exact extraction in disposable, network-isolated WSLg
containers on X11 and Wayland. Both paths launched one native orb by default,
inspected the dashboard-only WebKitGTK renderer and all seven panels, reopened
a dashboard after exit, prevented duplicate orb/dashboard processes, and exited
the child on forced orb loss. The X11 run used the test-only pointer helper to
click the actual native orb and open its owned dashboard, then verified a
repeated launcher did not duplicate either process. It also closed the first
dashboard through its actual window protocol, using a PID-checked helper. The
Wayland run opened the dashboard by repeated launcher invocation and terminated
that dashboard process instead; it does **not** prove Wayland pointer-click or
window-close behavior. A separate WSLg X11 check confirmed that an orb
could launch again after `SIGKILL`, without a stale socket. These are
extracted-package checks, not installed-package, normal Linux desktop,
accessibility, drag, compositor pinning, or resource-budget verdicts. The
pinned Ubuntu builder also passed the native orb's 2/2 Rust unit tests and
Tauri's 7/7 Rust unit tests; the package script and bundled-launch test passed
their JavaScript and shell syntax checks.

## Linux X11 drag follow-on candidate

The prior extracted Linux native orb did not move under a settled, test-only
X11 pointer drag, although an ordinary X11 top-level move request did move the
same window. Slint's `WindowMoveArea` delegates the move to the windowing
backend. The follow-on orb uses a small pointer-delta/`set_position` path when
its selected Linux session is X11, preserving `WindowMoveArea` for Wayland and
Windows. A drag does not trigger the orb's click action; a subsequent click
still opens the dashboard. This is an interaction repair, not a change to the
ARE adapter or authority boundary.

The latest unsigned, **uninstalled** package is
[`are-companion_0.1.0_amd64-native-drag-x11-v3-20260930.deb`](../dist/are-companion_0.1.0_amd64-native-drag-x11-v3-20260930.deb)
(45,782,026 bytes; SHA-256
`6de957efb308a173cfe56ecf631457729b7a3422599386a18e4f1d08d9534fad`).
It was built offline and extracted to a disposable `/var/tmp` directory without
installation. The extracted native orb SHA-256 is
`43bf57e1bb4f6a6173c999e223903186c3e33781d977ee8a1012371d941a98a6`,
and the dashboard SHA-256 is
`cab47cdc1e40ceae01e8f30267b89a4fd55f89c341feb4af6e52b8c663d83e58`;
both match the compiled release binaries. Bundled ARE `doctor --json` reports
`PASS` for `0.10.0-rc.1`, Node `26.8.1`, and core closure digest
`aac529c47a3e42535f40f7a639e689e0e9eb77bfc9a1ae187f296743d4c84748`.

Against this exact extraction, the expanded
[Linux bundled-launch test](../experiments/native-orb/test-linux-bundled-launch.sh)
passed on WSLg/X11: a stabilized pointer drag moved the native icon without
opening a dashboard; clicking it then opened the owned dashboard; all seven
panels loaded; repeated launch did not duplicate the orb or dashboard;
window-protocol close and reopen worked; abrupt orb loss exited the child.
The same package passed the Wayland launcher/dashboard seven-panel journey and
parent-loss cleanup, but Wayland pointer drag, click, and window-protocol close
were not exercised. Native orb Rust tests passed 3/3, and source formatting
and shell syntax checks passed. No normal physical Linux session, installed
package, accessibility activation, or resource-budget verdict is claimed.

## Linux native appearance journey

The [appearance test](../experiments/native-orb/test-linux-bundled-appearance.sh)
now exercises the exact `native-drag-x11-v3` extracted binaries with a private
test profile. It opens the bundled dashboard from the native orb, selects Ember
and then Cobalt through the Appearance panel, reads back the Tauri preference,
and observes the owning native orb apply each bounded skin message. After
dashboard close/reopen and after a full orb restart, Cobalt remains selected
and is resent to the native orb. The test-only inspector is enabled only for
these disposable processes.

The WSLg/X11 run additionally reads an interior pixel from the actual native
orb window: Verdant before opening the dashboard, Ember after selection, and
Cobalt after selection and restart. The WSLg/Wayland run passes the dashboard,
saved-preference, and native-orb update-message checks, but it has no visual
pixel or physical-pointer verdict. Both runs passed against the extracted
package, not an installed desktop session. The test helper passed warning-on
C compilation in the pinned Ubuntu builder, and its shell and inspector
scripts passed syntax checks. These results validate appearance propagation
in this bounded package; they do not imply ARE session control or release
readiness.

## Managed native-orb integration follow-up

The prior managed-session launcher spawned `are-companion` as if it were a
long-lived WebView orb. In the native-orb package that executable delegates to
the sidecar and exits. A joined package smoke therefore lost its supervised UI
process after an apparently successful ready record. The manager now selects
the bundled native orb as its direct child on Linux and Windows, passes the
dashboard executable to it, and waits for a fixed `ARE_NATIVE_ORB_READY`
signal emitted after Slint shows the orb. It still reports
`current_desktop_task_control: false`. The Linux and Windows smoke scripts
distinguish native-orb mode from the older direct WebView mode.

The new unsigned, **uninstalled** Linux candidate is
[`are-companion_0.1.0_amd64-native-managed-v4-20260930.deb`](../dist/are-companion_0.1.0_amd64-native-managed-v4-20260930.deb)
(45,771,996 bytes; SHA-256
`a3dad2007b29a40579ee8f6db89f32490724bf68ee3a43e50c279096df3b19a0`).
It was built offline in the pinned Ubuntu 26.04 builder, then extracted to
`/var/tmp/are-native-managed-v4-extract-weWt2q`. The extracted manager and
native-orb hashes match source/build (`e4b4adf5721a5107b775fc40c6b195b7e2b11fcced23b4af640f5e5abecf2f61`
and `5759d7a3b621aab673d3e92ac3653b1e9cd4f13a1635aa3d5996cb612054ba16`).
Bundled `are doctor --json` passed for Node `26.8.1` and ARE
`0.10.0-rc.1`. The test image now includes `libxkbcommon-x11-0`, already
declared by the `.deb`, so the extracted native orb can actually run in the
joined WSLg/X11 container.

Two network-isolated, package-adjacent managed-session smokes passed against
these exact extracted bytes: default read-only observation and guarded
Plan-input launch. Both opened the native orb and dashboard, rendered all seven
panels, showed gateway running/backend ready/client connected while host-task
control remained unverified, and stopped the gateway/client when the owned orb
was terminated. Both made zero private or external model calls. Focused
manager/topology tests passed 14/14; native-orb release tests passed 3/3.
The extracted default launcher also passed a separate repeat-open,
dashboard-owner, close/reopen, duplicate-prevention and abrupt-orb-loss check;
that run did not exercise a pointer click or drag on the new bytes.
This repairs the bundled Linux manager/UI lifecycle in a disposable test. At
this checkpoint it did not prove a real model turn, installed-package
lifecycle, native Windows orb supervision, physical Linux compositor behavior,
or transfer of this chat; the Windows candidate below addresses its native
supervision check separately.

## Managed native-orb Windows package follow-up

The current Windows source compiled into a new unsigned, **uninstalled** NSIS
candidate at `D:\ARE_Companion_0.1.0_x64-native-managed-20260930.exe`
(33,758,859 bytes; SHA-256
`5f138c6be6eb71dcbea81299a3d415728c6989bdaa31a8ad001ff41c9f6db558`).
The retained stage is `D:\acw-03VmIc`. The NSIS archive passed an integrity
test (821 files) and extracted to `D:\are-nsis-native-managed-iPekz2` without
running the installer. The extracted `are/` tree compares byte-for-byte with
the stage. Its managed-session launcher matches the source SHA-256
`e4b4adf5721a5107b775fc40c6b195b7e2b11fcced23b4af640f5e5abecf2f61`;
the bundled native orb matches its current staged build SHA-256
`ade3062c08be9c16e2182ca86539bc1a84fbf183093e58684c420e598d075aff`.
The extracted dashboard executable SHA-256 is
`933360bf0944f49d117c2793faca8e98cde8590f4eb8398c26fb702a40072ecf`.
No discontinued TUI resource path was found.

The extracted package passed all 13 Windows runtime feature checks, including
Reasoning State and Evolution operations. The revised
[`test-managed-session-windows.mjs`](../scripts/test-managed-session-windows.mjs)
now requires the manager's `native-orb` mode and a real 84×84 native Win32
window before reporting the orb as rendered. Both default read-only and
guarded Plan-input package-adjacent managed runs passed: seven dashboard
panels, gateway running, backend ready, client connected, and supervised stop
after orb termination. The default run kept turn ingress paused; the guarded
run showed its parent-heartbeat model-wire guard and Plan-input candidate.
Both made zero private or external model calls and reported current desktop
task control as false. The ordinary bundled-launch test passed click-to-open,
duplicate prevention, focus, dashboard close/reopen and owned-child cleanup;
its separate forced-orb-loss run also passed. Dashboard-only opened all seven
panels without an orb WebView; the explicit WebView diagnostic path passed its
36-check journey. Source UI tests passed 48/48 and focused manager/topology
tests passed 14/14. This establishes native Windows supervision for this
extracted candidate, not an installed or current-chat-controlled product.

The same extracted dashboard passed additional feature journeys. A disposable
one-cycle/one-commit Evolution ledger displayed its verified cycle and event
progression while retaining candidate/disabled definition labels and saying
that ledger history is not a currently running worker. A live gateway fixture
showed an active backend thread's explicit Reasoning State, its plan context,
decision link, and bounded second-page navigation; a changed snapshot was
rejected. More strongly, a native Codex `0.155.0-alpha.16.4` canary using a
loopback fixed-response provider showed an in-flight thread **without** a
fabricated completion frontier, then a completed thread with its verified
frontier and linked decisions. That canary reported one backend thread, two
gateway decisions, zero external model calls, and no contact with this desktop
task. Visual review captures are `D:\are-ui-features-mAXPi2\threads.png` and
`D:\are-ui-features-mAXPi2\evolution.png`; both depict isolated fixtures, not
the user's live work.

An additional native Windows joined canary used the NSIS-extracted package,
the pinned Codex `0.155.0-alpha.16.4` host, an isolated Codex home, and a
loopback fixed-response provider. Its read-only variant completed one real
hosted turn with one private provider request and no tool attempt. The
supervised native orb remained the manager's exact child, and activating that
orb opened a seven-panel WebView2 dashboard with no orb WebView. The dashboard
observed the completed thread, its verified completion frontier, and its
linked decision through the same gateway epoch. The orb and gateway stopped
after the test. The Windows source syntax checks passed for both the joined
canary and UI inspector. This is a disposable joined read-only UI proof, not
current-task handover, effect enforcement, or external-model integration.

The separate effect-boundary variant **failed** against the same pinned host:
it observed `hook/completed` for `PreToolUse` with status `blocked`, yet the
private provider received the shell command's success marker. The canary
rejected the turn as failed. A blocked hook notification is therefore not
proof that Windows prevented execution. Normal managed Windows turn ingress
remains disabled without the test-only probe flag, and the dashboard correctly
reports host-task control as `unverified`. The read-only variant does not
weaken or replace this failing effect-boundary test.

A third isolated run selected the existing MCP hook relay with the same
NSIS-extracted native orb and dashboard. The pinned Windows host completed
the fixture turn with two private provider requests. The relay put prompt
context on the model wire, returned an ARE-bound denial for the attempted
tool, and completed the Stop hook. The joined dashboard showed the completed
thread frontier and linked decision. The canary reported
`hook_boundary_verified:true` and
`complete_host_effect_boundary_verified:false`; it did not contact an
external model or transfer this Codex task. The manager's hosted client and
gateway stopped, and the private hook connection file was removed. This
demonstrates a working bounded MCP-relay integration candidate on native
Windows, while the command-hook failure and the normal Windows turn pause
remain unchanged. More effect classes, failure recovery, and host-writer
handover still need independent proof before broader activation.

The follow-on source contract now requires the managed MCP relay to have an
exact private `hooks.json`: one prompt handler, one Stop handler, and a
`PreToolUse` handler without a matcher. The pinned Windows transport canary
confirmed that this broad handler intercepted `view_image` and withheld the
image from the model; the missing-tool control returned the image, showing
why an MCP catalog alone is insufficient. The restricted host digest now
binds `hooks.json` bytes as well as `config.toml`. A native managed relay turn
passed with the new source, while a separate native run changed the source
to `Bash`-only after startup and was refused before another model request.
Focused profile/preflight/digest tests passed 16/16. The hosted turn gate now
also queries native `hooks/list` immediately before intent creation and requires
exactly the three dedicated-source hooks to be enabled and trusted. The pinned
Windows `managed-relay-turn` canary passed with that gate, and unit tests deny
missing or untrusted hook state before dispatch. This is a pre-turn snapshot,
not an atomic guarantee through every tool call or coverage of all tool paths.
The [official Codex Hooks documentation](https://learn.chatgpt.com/docs/hooks)
identifies specialized paths that can bypass `PreToolUse` and says a missing
hook or unsupported output may let the tool continue; the normal Windows
ingress pause therefore remains unchanged.

## Current-source native-hook-trust package follow-up

The unsigned `D:\ARE_Companion_0.1.0_x64-native-trust-20260930.exe` was built
from the current ARE and Companion source with the native orb bundled. It is
33,750,261 bytes, SHA-256
`5144fa871b44c432ceaacef1bb3e7a3ce12a5054b5a81899fa8664df39876ae5`,
with ARE closure digest
`a1cee1659864f38be3cd8d3e3a48e2473849cc8a19ea5a21050e49e73e5d2f16`
and Core digest
`5a52a37ac4ecd801f4a038df4480cf36fd8f0e76313d5df470dfb61dbd5d3d62`.
The NSIS integrity check passed (823 files); extraction to
`D:\are-nsis-native-trust-KpvAJK` passed without installation. The extracted
manager and hook-profile bytes match the checkout, and no TUI resource path
was found. The builder's temporary stage was removed after success.

On those exact extracted bytes, the 13-check bundled ARE feature probe and
36-check seven-panel WebView2 journey passed. The native-orb packaged-launch
test passed initial 84×84 window, repeated-launch focus, dashboard close and
reopen, duplicate prevention, owned-child cleanup, and forced parent-loss
cleanup. Its added ten-second idle sample measured 3,301,376 private bytes
and zero additional process CPU seconds in the normal-close run; the forced
loss run measured 3,256,320 bytes and zero additional seconds. These are
bounded native-orb process samples, not a whole-product resource budget. A
separate three-cycle direct executable test passed but exercised the legacy
WebView orb path, not the native-orb idle path.

Package-only managed startup passed in default paused mode and guarded Plan
mode: the bundled Node, ARE runtime, pinned Codex host, gateway, client,
native orb and dashboard joined and stopped under supervision. Both displayed
seven panels and reported current desktop task control as false with zero
model calls. The guarded mode showed `parent-heartbeat-observed` and the
candidate Plan-input setting; its smoke dispatched no turn. A separate
current-source native guarded-text canary dispatched one private turn with
an empty model tool catalog and no test-only hook bypass.

The test harness's package-adjacent mode then ran the **extracted** manager,
gateway, hosted client, relay, Node, native orb and dashboard in one isolated
MCP-hook canary. The pinned Windows host reported all three dedicated hooks
enabled and trusted, placed prompt context on the model wire, blocked the
attempted tool, completed Stop, and produced a completed hosted thread with
a verified frontend frontier and linked decision. It used two private
provider requests, zero external model calls, and did not touch or hand over
this desktop task. The extracted processes were absent after teardown.
This verifies the bounded package-adjacent candidate, not installed-package
behavior, complete effect interception, exclusive host-writer control, or
release readiness. Normal Windows effectful turn ingress remains paused.

The extracted dashboard also passed a 49-check native Windows active-state UI
run using an isolated gateway fixture and a one-cycle verified Evolution
fixture. The active thread's Reasoning State card entered the first viewport,
linked to its decision, and remained distinct from this desktop task. The
Evolution view displayed the verified cycle and event history without claiming
a worker is running. Visual captures are
`D:\are-native-trust-active-adapter-20260930-b.png`,
`D:\are-native-trust-active-thread-20260930-b.png`, and
`D:\are-native-trust-verified-evolution-20260930-b.png`. The discontinued TUI
was neither a tested surface nor a fallback.

A separate native Windows model-turn check now uses the extracted package's
adjacent Node, managed-session launcher, gateway, hosted client, and runtime,
with the source canary supplying only isolated fixtures and assertions. The
test-only package-root override is constrained to the guarded text and guarded
Plan-input modes and verifies the extracted layout and adjacent executable.
Both modes passed against pinned `codex-cli 0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`):
the first completed one private model turn with an empty model-tool catalog;
the second brokered one authenticated Plan-input answer back to the model and
exposed only `request_user_input` on the model wire. The reports explicitly
identified `runtime_origin: adjacent-extracted-package`, recorded three and
four private provider requests respectively, zero external model calls, no
current-desktop-task touch, and removal of temporary configuration. No exact
extracted test process remained afterward. The installer SHA-256 remained
`5144fa871b44c432ceaacef1bb3e7a3ce12a5054b5a81899fa8664df39876ae5`.
An invalid package-root override was rejected before managed startup. The
disposable copy of the pinned Codex CLI used for these tests was removed after
confirming no process was using it; the installed app binary was unchanged.
This is package-adjacent guarded-turn evidence, not an installed-package,
normal effectful-turn, full hook-coverage, or current-chat handover result.

The corrected Evolution-copy installer candidate
`D:\ARE_Companion_0.1.0_x64-disposition-20260930.exe` was later extracted
without installation to `D:\are-nsis-disposition-iaST2G`. Its default-entry
native-orb bundled-launch test passed against those extracted bytes: the orb
was 84×84, a repeated launch opened and focused one dashboard without a
duplicate orb or dashboard, and a click reopened the dashboard after close.
Closing the orb ended its owned dashboard. The isolated ten-second orb-only
sample measured 3,280,896 private bytes and zero additional process CPU
seconds. This is one development-machine sample, not an owner-set resource
budget or an installed-app lifecycle verdict. The same extracted payload's
bundled ARE feature and WebView2 dashboard journeys are recorded in the
[Evolution coordination evidence](EVOLUTION-COORDINATION-UI-2026-09-30.md).

## Claim ceiling

The local click/focus/reopen/parent-loss contract, plus WSLg/X11 native-icon
drag, works in the bounded tests above. It is not a shipped cross-OS companion.
The latest bundled candidates
use the native orb by default on Windows and Linux. Their packages were
extracted and tested, not installed. Neither candidate nor the separate
earlier ones establish release readiness. Product health is separate from live
adapter, thread, decision, Evolution, and current-chat control claims.

## Open Questions

- Which Slint license/attribution path, if any, is approved for shipment?
  [Slint's own license overview](https://github.com/slint-ui/slint/blob/master/LICENSE.md)
  says its royalty-free desktop path requires attribution; its
  [FAQ](https://github.com/slint-ui/slint/blob/master/FAQ.md#licensing)
  describes an AboutSlint or public-badge option. Neither is implemented here,
  and no license path has been selected for a product package.
- Do installed shortcuts, startup, updates, and rollback preserve the
  repeated-launch activation contract? They remain unverified. Background
  requests may be denied foreground by Windows even when the focus request
  reaches the dashboard.
- Does focus, normal close, crash recovery, keyboard/screen-reader activation,
  and drag work on physical Linux X11 and Wayland desktops? WSLg/X11 pointer
  drag now passes, but physical X11 and Wayland pointer behavior remain
  unresolved. [Slint's Window API](https://docs.slint.dev/latest/docs/rust/slint/struct.Window)
  notes that setting top-level position is unavailable on some window systems,
  including Wayland; native presets remain unsupported on Wayland and
  unverified on physical Linux X11 beyond the WSLg/X11 source-built run.
- What matched idle/active resource and cold-start budget must the assembled
  product meet, including dashboard, gateway, and retained post-close state?
- What supported, exclusive host-writer handover would enable ARE to control
  this current chat? The UI protocol above does not provide that authority.
