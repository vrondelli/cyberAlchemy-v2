# Current-source Linux extracted-package UI check — 2026-09-28

Status: bounded development evidence. This is not an installed-app, release,
resource-budget, physical-pointer, or desktop-task-control result. TUI is
discontinued and was not used.

## Exact package and environment

- Built the current checkout's Companion source with the locked repository
  toolchain in the existing Ubuntu 26.04 builder image, without network access
  or host package installation. The output is the unsigned development package
  [`are-companion_0.1.0_amd64-current-20260928-g35.deb`](../dist/are-companion_0.1.0_amd64-current-20260928-g35.deb),
  SHA-256 `09b57b9db1cd5a472a51028121a184dafaee96b918240f0ce508a8368da1829d`.
- The builder reported a 764-file development ARE closure with digest
  `52b5184274aa7f938b144d3265926426c315fafff5fe2aad0ed21e0525e3227d`
  and bundled Node 26.8.1. The package was extracted to a temporary directory,
  not installed. Its bundled `are doctor --json` returned product-health `PASS`
  and an exact Node-version match; this does not establish gateway readiness.
  `dpkg-deb --info` confirmed an amd64 package with GTK 3 and WebKitGTK 4.1
  system-library dependencies. The current dashboard source suite passed 36/36.
- The extracted executable ran as a non-root user in a disposable,
  network-disabled Ubuntu 26.04 container using WSLg X11 and test-only WebKit
  inspector access on container loopback. The package and inspector script were
  mounted read-only; preferences used an isolated temporary `companion.json`.

## Rendered result

The WebKitGTK inspector verified a loaded orb document and Tauri bridge, an
opened dashboard document, bundled product diagnostic, all seven navigation
panels, the separate steer-continuity and dispatch-recovery disclosures,
Evolution's unconfigured ledger and candidate-inbox states, and a Cobalt skin
change. The run exited successfully with no external model call. The display
reported non-fatal DRI3/EGL acceleration warnings.

An initial test invocation used `preferences.json` as the override filename.
The native contract accepts only an absolute path ending in `companion.json`,
so that run rejected the skin save. Re-running with the required filename
passed; this was a test-harness input error, not evidence of a product defect.

## Claim ceiling and next checks

The orb was opened by the test inspector, not a physical pointer. This check
does not prove free drag, pixels, normal Linux desktop/compositor behavior,
placement persistence, screen-reader usability, longer idle cost, numerical
resource-budget compliance, package install/upgrade/rollback/uninstall, or
control of this Codex task. The earlier WSLg synthetic-click and placement
checks apply to their own exact package bytes, not automatically to this one.
Final security and packaged enablement remain separate gates in the
[whole-UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

## Open Questions

- Does this exact package pass physical-pointer free drag and saved placement
  on a normal Linux desktop?
- What supported OS/compositor matrix and numerical idle-resource budget will
  define a release-candidate acceptance test?
