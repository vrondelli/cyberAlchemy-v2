# Windows Companion appearance-startup development package — 2026-09-28

Status: bounded development evidence; authority effect: none. The TUI is
discontinued. This result does not install, sign, release, or deploy the
Companion, and it does not activate ARE control of the current Codex task.

## Scope and source binding

The orb and dashboard now subscribe to native appearance-change events before
reading saved preferences. A valid live event wins over a delayed startup read,
so an old snapshot cannot revert the selected skin or orb placement. The
dashboard ignores invalid placement events. The staged UI bytes match the
current source: `orb.js` SHA-256
`c4a8730c2d9c879f0289524278ed56e6a35f18faab7ca594a06145d085fde883`
and `app.js` SHA-256
`878bf309e14077301746bb44250c57822b1c5cff5ffedd573df4eabd29176b78`.

## Exact Windows artifact and checks

The unsigned NSIS bundle was built at
`D:\are-companion-build-NqJb8b\acw-2B4Pn5\src-tauri\target\release\bundle\nsis\ARE Companion_0.1.0_x64-setup.exe`.
Its byte-identical, no-overwrite copy is
`D:\ARE_Companion_0.1.0_x64-setup-appearance-race-20260928.exe`,
SHA-256 `aa626f99ddd7bf3c7af908c283ac8d4a2ae4aa3c25fedc918ce9f3da126857bb`.

- Source dashboard suite: 38/38 passed, including a delayed-preference-read
  regression for both orb and dashboard.
- Native Windows Chromium source journey: 87 checks passed, zero page errors.
- Staged bundled-ARE feature probe: 11 checks passed, including exact Node,
  product doctor, route/context, Reasoning State, and native SQLite Evolution.
- Staged native WebView2 UI journey: 35 checks passed, including a nonblank
  seven-panel dashboard, skin propagation, saved preference relaunch, and
  keyboard/contrast checks.

The builder completed Rust release compilation and produced the NSIS bundle,
but its final copy to a drive-root output failed with `EPERM` when it tried to
create existing `D:\`. The builder source now skips recursive directory
creation for a drive-root parent. A native Windows root-path guard check passed,
and the already-built NSIS bundle was copied without overwrite and hash-checked.
The full builder was **not rerun after that source fix**; the staged executable
and copied installer were not installed. The native UI journey checks normal
appearance behavior, while the delayed-read race itself remains a deterministic
source-level test, not a native injected-race result.

## Open Questions

- Does an installed package preserve the same appearance behavior and clean
  install/upgrade/uninstall lifecycle?
- Does the patched builder complete a new drive-root output end to end on a
  subsequent build?
- What repeatable low-resource and accessibility acceptance budgets apply on
  supported Windows versions?
