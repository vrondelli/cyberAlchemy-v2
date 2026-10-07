# Current Windows Companion thread-phase check

Status: bounded development evidence, 2026-09-27. Authority effect: none.
The TUI is discontinued and is not part of this UI path. The installer was not
run; the current Codex desktop task was not activated or handed over to ARE.

## Exact artifact and boundary

- Unsigned NSIS output:
  `dist/ARE_Companion_0.1.0_x64-setup-thread-phase-current-20260927.exe`
  (29,397,561 bytes; SHA-256
  `340e5e56a6378216964d14999e6c481c17d04abc5d970e695b515a4791ae2ba0`).
- Native Windows build from this checkout; development closure digest
  `7010bf923c234406c5deab17f4a0af734eaa4b872035b42136df3db3a47fe181`
  and core product closure digest
  `eafdc7b55278f63bbf619fc2cfa15165cc9cbbcef11a42aea91c9c64fbf5c96b`.
- The NSIS archive integrity check passed (792 entries). It was extracted into
  an isolated directory and copied to a disposable local Windows directory
  for native WebView2 tests. Nothing was installed or registered.

## Native checks

`test-windows-features.mjs` passed against the extracted resources: exact
bundled Node, product `doctor`, route/context, Reasoning State plan context,
thread/decision observers, and native SQLite Evolution write/read/replay.

`test-windows-ui.mjs` passed against the extracted executable in isolated
WebView2 profiles for the default seven-page journey, a live gateway fixture
with one active Reasoning State row and linked decision, degraded steering,
unknown dispatch, and confirmed dispatch recovery. Product health remained
separate from adapter and thread observations; gateway loss cleared live
postures. The native test harness was extended to assert distinct `failed`,
`interrupted`, and `cancelled` terminal labels with no fabricated completion
frontier. Each of those three WebView2 cases passed. A failed-turn screenshot
visually confirms the `TURN FAILED` label and `No completed frontier`.

The first extracted run directly from the WSL network path rendered the orb
and nonblank dashboard but reported `ARE diagnostic read failed`.
Running the same extracted files from a local Windows directory passed. This
is an extraction-path discrepancy whose cause is not yet established, not
proof of installed-package behavior.

## Claim ceiling and next checks

The checked package is a development prototype. The gateway was a fixture,
not the current desktop task. These results do not prove live host-task
control, installed-app lifecycle, source access control, physical Linux
usability, resource-budget compliance, signing, release, or deployment.

## Open Questions

- Can exact desktop-task ownership, ingress, approvals, and recovery be proven
  through a supported host boundary without two active writers?
- Will an installed Windows package pass the same joined source and lifecycle
  checks with the final access-control boundary?
- What numerical memory/CPU and cold-diagnostic budgets define acceptance?
