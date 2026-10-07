# Narrow linked navigation — 2026-10-02

Status: candidate UI implementation and bounded development evidence. Authority
effect: none. No package was installed, admitted, or released. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## User path and change

At a real 340 × 740 dashboard, the Overview's source index can open Evolution
while the horizontal navigation strip is still scrolled to its first item. The
old implementation selected Evolution and focused its heading, but left the
selected navigation item outside the visible strip. The dashboard now scrolls
only the navigation strip enough to reveal the active item, with an 8 px inset.
It preserves page-heading focus and does not change ARE observations or state.

## Evidence

- The previous extracted Linux candidate failed the added native WebKitGTK/X11
  linked-navigation assertion: Evolution opened, but its selected navigation
  item was outside the strip and the strip had not scrolled.
- Current source passes 57/57 UI tests, including cross-page navigation and a
  wide-window no-op. The isolated Chromium fixture passes the 340 px
  source-index-to-Evolution interaction, selected-item visibility, heading
  focus, and no document overflow.
- A distinct unsigned, uninstalled [Linux candidate](../dist/are-companion_0.1.0_amd64-nav-reveal-20261002.deb)
  is 45,853,780 bytes, SHA-256
  `419c48a01efda15c0ee53c9a407bf934bfa228dc14bee44c656f7a3391fa4523`.
  The offline builder reported an 839-file development closure digest of
  `2621ba28316ee299e47315a079a7fa78b7a251c50df7b1e44108110a4146d7fc`.
  Its extracted bundled doctor passes at `0.10.0-rc.1` with exact Node version.
- The new extracted Linux package passes the [native narrow test](../scripts/test-linux-evolution-narrow.sh)
  in both registry-only and isolated one-cycle verified-ledger states at an
  actual 340 × 740 WebKitGTK/X11 window. The selected Evolution item is
  visible and current, the strip has scrolled, its page heading is focused,
  the first useful content is visible, and the document does not overflow.
  Native X11 hints still advertise the 320 × 540 minimum.
- The [Windows UI harness](../scripts/test-windows-ui.mjs) now carries the
  matching actual-window WebView2 linked-navigation assertion. After two
  transient WSL Windows-process bridge failures (`UtilAcceptVsock:273:
  accept4 failed 110`), the synchronized staging source built successfully.
  A distinct unsigned, uninstalled Windows candidate is at
  `D:\ARE_Companion_Nav_reveal_20261002_x64-setup.exe` (33,819,304 bytes,
  SHA-256 `0d0be47abce3b00dbdfe26a560978320696b4dd88d58e3ebcdcd42cd39868c6c`).
  Its staged executable is 9,561,088 bytes, SHA-256
  `d8c4949e901f962b7cab5318224b6d7ac7162dab11350902df35d3f21f083e92`.
  The staged bundled 13-check native Windows feature probe passes at
  `0.10.0-rc.1`, with closure digest
  `2d7ff4ed56d5ff108276fecedbfa1db364b78f29e02755c91b3bce25ffdb6f63`.
  The new actual-window WebView2 harness passes both registry-only and isolated
  one-cycle verified-ledger journeys at a 340 × 740 client. It measures a
  336 px native minimum tracking width, verifies that the Overview link leaves
  Evolution selected and visible in the scrolled navigation strip, retains
  heading focus, waits for the destination reading to settle, and finds no
  horizontal document overflow. The settled
  [registry-only capture](/mnt/d/acw/are-nav-reveal-registry-settled-20261002.png)
  and [verified-ledger capture](/mnt/d/acw/are-nav-reveal-verified-settled-20261002.png)
  were visually inspected: selected tab, status, and first useful content are
  legible. The earlier Windows installer predates this navigation fix.
- The staged candidate's default Windows entry also passed the separate
  [bundled native-orb launch test](../experiments/native-orb/test-windows-bundled-launch.ps1):
  an 84 × 84 orb, one dashboard after repeated launch, foreground focus,
  close/reopen, and owned-child exit. Its ten-second orb-only sample was
  3,309,568 private bytes with zero additional CPU seconds. This is a staged
  development-machine sample, not an accepted resource budget.

## Resource observation boundary

An eight-cycle process-tree probe of the same executable in the harness's
explicit `--webview-orb` mode passed dashboard close/reopen each time but
measured 135,667,712 private bytes before opening a dashboard and 188,813,312
bytes after the eighth close. That mode retains WebView2 children for its
floating orb and is **not** the candidate's default native-orb entry. The
53,145,600-byte difference is a follow-up diagnostic for the legacy test mode,
not evidence that the default native orb leaks or meets a low-resource budget.

## Claim ceiling and open questions

This proves the interaction in current-source browser rendering, one extracted
Linux package, and one staged Windows executable; it closes development-renderer
parity for this path. It does not prove physical pointer or assistive-technology
behavior, Wayland, installed lifecycle, live ARE worker state, or control of
this Codex task. The Windows installer was built but not installed; its staged
executable, not an installed upgrade, supplied the native UI evidence. Longer
native-default resource runs and an owner-defined CPU/memory budget remain open.
