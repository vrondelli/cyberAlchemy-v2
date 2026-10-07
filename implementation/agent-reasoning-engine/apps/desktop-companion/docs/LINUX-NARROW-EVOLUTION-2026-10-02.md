# Native narrow Linux Evolution — 2026-10-02

Status: candidate construction and extracted-package evidence. Authority effect:
none. The package was not installed, admitted or released. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md); experience
contract: [Evolution UX](ux/EVOLUTION.md).

## Product change

The Tauri dashboard's minimum inner width was 760 px even though the UI had
passed source and emulated narrow-viewport checks. It now permits 320 px. The
default 1120 × 760 size and 540 px minimum height are unchanged. This makes a
real 340 px-wide desktop window possible; its navigation remains an internally
scrollable strip. No Evolution admission, worker or chat-control behavior
changed.

## Exact candidate and checks

The source was built offline in the existing Ubuntu 26.04 image with bundled
Node 26.8.1 and the repository-locked Rust toolchain. The unsigned,
uninstalled [Linux candidate](../dist/are-companion_0.1.0_amd64-evolution-a11y-narrow-20261002.deb)
is 45,839,332 bytes, SHA-256
`40ede499bd8d13bdc603fed85227579b57ad1dfb1168e038fc6411b1d0d6bf90`.
The builder reported an 839-file development closure digest of
`b705af0f44bbe7e88bb514916043d025f16287aadb30e258df1231c9b69db3c0`.
The extracted package's bundled `are doctor --json` returned `PASS`, version
`0.10.0-rc.1` and an exact Node match. No TUI file was found in its extracted
ARE distribution.

The extracted executable ran as UID 1000 in an isolated, network-disabled
Ubuntu 26.04 container on WSLg/X11. The test-only WebKit inspector and an
owned-PID X11 helper verified the actual dashboard viewport—not only a CSS
emulation—at 340 × 740. The repeatable
[narrow test](../scripts/test-linux-evolution-narrow.sh) first checked the
Tauri bridge, product diagnostic and seven panels, then resized the owned
window and checked. A later guard queries the real X11 `WM_NORMAL_HINTS`
before resize: this candidate advertises a 320 × 540 minimum, which admits
the 340 × 740 test window. Both states passed again with that guard:

- Registry-only: five candidate-definition headings, definitions before cycle
  history, hidden unavailable metrics, first definition in the viewport, and
  no horizontal document overflow.
- An isolated one-cycle SQLite fixture: recorded cycle before metrics and
  definitions, one verified cycle, first cycle in the viewport, heading order,
  and no horizontal document overflow.

The test-only X11 helper captured 340 × 740 native pixels. The
[registry-only view](../../../../../output/playwright/evolution-registry-webkit-340-20261002.png)
and [verified-ledger view](../../../../../output/playwright/evolution-verified-webkit-340-20261002.png)
were visually inspected and remain legible. Source UI tests pass 56/56; the
inspector and shell harness pass syntax checks. One initial run failed because
the inspector client address was omitted; the harness now requires both the
WebKit server and client address. That was a test configuration error, not a
package failure.

## Claim ceiling and next checks

This proves a real narrow WebKitGTK/X11 window from one uninstalled package.
It does not prove physical pointer use, Wayland, installed upgrade/rollback,
assistive-technology speech/focus traversal, longer resource runs, a numerical
idle budget, live worker state, or control of the current Codex task. The
Windows installer built before this minimum-width change must not be called
current source; actual native Windows resizing remains a separate check.

## Open Questions

- Does a real 340 px Windows desktop window keep the same first-view layout
  after the new native minimum-width source is rebuilt there?
- What do NVDA/Orca users hear when navigating from ledger status to the first
  cycle or candidate definition? Programmatic heading checks do not answer it.
