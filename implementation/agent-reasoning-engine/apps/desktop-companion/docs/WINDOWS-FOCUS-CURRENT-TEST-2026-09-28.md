# ARE Companion current-source Windows focus and package check — 2026-09-28

Status: bounded development evidence; authority effect: none. TUI is
discontinued and outside this path. The installer was built but not installed,
and this Codex desktop task was not handed over to ARE.

## Exact package

- Unsigned NSIS output: [`ARE_Companion_0.1.0_x64-setup-focus-current-20260928.exe`](../dist/ARE_Companion_0.1.0_x64-setup-focus-current-20260928.exe),
  29,440,216 bytes, SHA-256
  `62b5b7c5574dd65a003b3a2eca1537ea67e3ca31dab3c9c64c0a3a254f668ca7`.
- Built from the current checkout with native Windows Node 26.8.1 (the
  downloaded `node.exe` matched the official `SHASUMS256.txt` entry), the
  existing Tauri/Rust Windows build tools, and retained temporary staging.
  The standalone development closure contains 764 files, digest
  `4ab07e88a03d871a49c3188d57d9b0e549a146931ea6d31316d7074ca92917d1`;
  Core product closure digest
  `f1c1a79b2df39459695ab9207e43ba195fe766f7b4d7bd590b026b72ce16698c`.
- The package's staged executable was tested from the retained build directory
  with an isolated WebView2 profile. No installer execution, system setting,
  or real gateway binding was part of this check.

## Results

- `test-windows-features.mjs` passed: exact bundled Node, ARE product health,
  route/context evaluation, Reasoning State runtime and bounded plan context,
  backend thread/decision observation imports, and the native SQLite Evolution
  writer/observer/reopen path. The test reported product version
  `0.10.0-rc.1` and a development-gateway-only active-thread projection.
- `test-windows-ui.mjs` passed against native WebView2: the orb rendered,
  opened a nonblank dashboard, and all seven destinations were navigable.
  With no observation gateway configured, Adapters, Threads, Decisions, and
  Evolution showed honest unconfigured postures. Evidence cross-links,
  refresh, skin/corner persistence, reduced-motion and high-contrast checks
  passed in the isolated profile.
- A new native assertion checks that keyboard navigation focuses the Overview
  heading, its computed outline is solid and at least 2 px, and its width is
  less than 85% of the containing panel. It passed in the staged executable.
  The test script changed after the package build; its assertion tests the
  unchanged staged executable. Overview and Evolution WebView2 screenshots
  were captured in a temporary directory and visually inspected; both rendered
  without a blank-window or obvious layout failure.
- Three further WebView2 runs passed with a test-only development gateway:
  ordinary live observation showed an adapter path, one gateway thread with
  bounded Reasoning State, and a linked decision; a same-window gateway
  restart withdrew the old epoch and recovered a new one without old decisions;
  and an unknown dispatch appeared as Attention. Gateway loss cleared live
  postures while product health stayed independent. All three runs kept
  desktop-task control explicitly unverified.

## Claim ceiling

This is a staged native UI and bundled-feature check, not an installed-package,
screen-reader, physical-pointer, resource-budget, release, security, or real
desktop-task-control result. Product diagnostic success does not establish
gateway readiness. The observation gateway was not configured, so no active
thread reasoning state from this task was observed. Exact host-task identity,
single-writer handover, and restart/rollback remain open in the
[whole-UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## Open Questions

- Can the exact current desktop task be bound to an ARE-controlled gateway
  without competing writers, including approvals and recovery?
- Does the installed package pass the same UI journey, normal desktop pointer
  interactions, accessible-name/screen-reader review, and resource budget?
