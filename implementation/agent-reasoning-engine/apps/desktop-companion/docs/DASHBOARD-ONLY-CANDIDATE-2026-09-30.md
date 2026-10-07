# Dashboard-only Companion candidate, 2026-09-30

Status: source and unsigned, uninstalled installer **candidate**. The TUI is
discontinued and was not used. Authority effect: none. This work does not hand
over the current Codex task to ARE.

## Change and evidence

The Tauri orb window is now explicitly created by the normal startup path;
`--dashboard-only` instead starts the seven-panel dashboard without creating
the orb WebView. Default startup remains the floating WebView orb. Both modes
share the same dashboard creation and focus path. The orb click now exposes a
readable open/failure state, and the Linux inspector waits until its click
handler is attached. A previously accepted `--verify-dashboard` test mode had
omitted the click; that test defect was corrected.

- Current-source Linux release build and WSLg/WebKitGTK normal orb-to-dashboard
  journey passed: seven panels, navigation, bridge, and bundled ARE diagnostic.
- WSLg/WebKitGTK `--dashboard-only` passed with no orb WebView, seven panels,
  navigation, bridge, and bundled ARE diagnostic. In a separate Xvfb/Openbox
  close check, the dashboard-only process exited with code 0. WSLg close
  produced a GTK `BadDrawable` warning and exit 1; that environment-specific
  discrepancy remains open.
- Native Windows 11 build passed using local Visual Studio Build Tools after
  the builder accepted a verified local installation when `vswhere` returned
  no registered path. The existing default-mode WebView2 test passed its
  nonblank seven-panel, navigation, skin/placement, keyboard, focus, evidence
  link, and preference-relaunch checks.
- The new native WebView2 `--dashboard-only` test passed: no orb WebView,
  all seven panels navigable, exact bundled Node match, and ARE product
  diagnostic passed.
- JavaScript syntax checks and offline Linux Rust check/release build passed.
  Whole-file `cargo fmt --check` is still red because of pre-existing broad
  formatting drift in `main.rs`; no wholesale reformat was applied.

The retained staged Windows binary is
`D:\acw-xWOSbv\src-tauri\target\release\are-companion.exe` (SHA-256
`e0816997c431348bb48ccb5ef802bbf70f49f46dbf6ed407c0a73357d1b7ee3d`).
The unsigned NSIS candidate is
`D:\ARE_Companion_0.1.0_x64-dashboard-mode-20260930.exe` (SHA-256
`c51ceaf2a6a1b95ae89fcb477856d175532559475530d8029cb65ae272f7dac9`).
The installer was built but not installed or extracted. The stage remains at
`D:\acw-xWOSbv`; neither candidate is a release.

## Claim ceiling

Dashboard-only mode provides the necessary Tauri half of a possible native
floating-orb split. It does **not** integrate the experimental Slint orb,
provide a single-instance/focus handoff, prove installed lifecycle, or establish
a low-resource budget. A product-health pass is not live adapter or session
control. The current desktop task remains outside verified ARE control.

## Open Questions

- Which process owns native-orb/dashboard lifetime, focus, restart, and crash
  recovery? A repeated click must not create duplicate dashboards.
- Will a normal Linux desktop reproduce the WSLg close warning or the earlier
  WSLg drag discrepancy? Wayland and physical-pointer checks remain open.
- Which Slint license/attribution path, if any, is approved for shipping the
  separate native orb? What numeric resource and cold-start budgets apply?
- What exact supported host writer handover would let ARE control this current
  chat without making an unsupported takeover claim?
