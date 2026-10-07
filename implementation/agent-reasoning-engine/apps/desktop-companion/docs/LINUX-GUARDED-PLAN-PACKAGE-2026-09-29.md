# Linux package from the guarded-Plan source snapshot — 2026-09-29

Status: bounded development evidence; authority effect: none. TUI is
discontinued and is not part of these packages. The original same-source
Linux package below preceded Linux guarded Plan input; a distinct updated
package now carries that opt-in path and has native loopback proof.

## Newest read-only Plan-status candidate

- Unsigned, uninstalled Debian package:
  [`are-companion_0.1.0_amd64-plan-observer-20260929.deb`](../dist/are-companion_0.1.0_amd64-plan-observer-20260929.deb),
  38,740,032 bytes, SHA-256
  `c59c2f442403b18d46580937b5d879411c6aa3e910ba456b2f285ecf36db1730`.
  The offline builder reported 811 development files, closure digest
  `dac8a2fa081a02bc0f395ea6eaba07a5ce00706846411f63fb310de3b7f27daf`,
  Node 26.8.1, and the same GTK 3/WebKitGTK 4.1 dependencies. The extracted
  resource tree contains no TUI path.
- The managed launcher now removes inherited Plan-mode markers before child
  startup. A native isolated startup with deliberately polluted parent markers
  passed without enabling Plan mode. The launcher passes a separate, exact
  launch declaration to Companion only after the guarded hosted client has
  reached its verified ready boundary.
- The extracted executable passed the package-only WebKitGTK managed UI smoke
  twice. With the opt-in guarded Plan mode, Adapters displayed “configured at
  launch (candidate)” alongside a fresh parent/listener guard heartbeat. In
  ordinary managed mode it displayed “not declared.” Both runs rendered the
  orb and seven-panel dashboard, passed the bundled diagnostic, saw one ready
  gateway/client/backend path, and stopped the managed session on unexpected
  Companion exit. Neither made a model call or controlled this desktop task.
- The same extracted package passed the pinned-Codex fixed-loopback
  `managed-wire-guard-user-input-turn` canary: the authenticated answer was
  returned to the model fixture, the advertised model tool set contained only
  `request_user_input`, and external model calls were zero. Source dashboard
  tests passed 47/47, native Rust bridge tests 5/5, and wrapper tests 664
  passed with 17 environment-dependent skips and no failures.

The new Adapters row reports a managed **launch declaration**, not a live
pending-question count, a provider probe, complete host-effect coverage, or
control of this Codex desktop task. An absent fresh heartbeat downgrades the
display to guard-unverified. This remains an extracted-package X11/WebKitGTK
fixture rather than an installed Linux lifecycle or macOS result.

## Updated Linux guarded Plan-input package

- Unsigned, uninstalled Debian package:
  [`are-companion_0.1.0_amd64-linux-plan-20260929.deb`](../dist/are-companion_0.1.0_amd64-linux-plan-20260929.deb),
  38,731,978 bytes, SHA-256
  `2d7195c89f8826411f1b293cfde43acf81cfe01ba74287698dd3d69fcfb83034`.
  Built offline in the existing Ubuntu 26.04 image with Node 26.8.1 and the
  locked toolchain; the build reported 807 files and closure digest
  `584c96ca9235d30a22e4a11305ca3a53afb46e18e4674f4370a2251cf19d6368`.
- `dpkg-deb` reported amd64, version 0.1.0, and GTK 3/WebKitGTK 4.1 system
  dependencies. Extracted package code hashes match the checked source for
  the managed launcher, hosted client, and native canary. Its bundled Node
  passed `are doctor --json` with product `0.10.0-rc.1` and exact Node match.
  No TUI path was present in the extracted resource tree.
- From the extracted package, with pinned Codex
  `0.155.0-alpha.16.4` (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`),
  the native Linux `managed-wire-guard-user-input-turn` canary passed in a
  network-disabled container. It verified one managed Plan turn, an
  authenticated `request_user_input` answer returned to the model fixture,
  exactly that one model-advertised tool, no test-only hook bypass, and zero
  external model calls. `current_desktop_task_touched` was false.
- The updated package-only managed UI smoke passed on WSLg X11/WebKitGTK:
  orb and dashboard rendered, all seven panels appeared, the bundled product
  diagnostic passed, gateway/backend/client were running/ready/connected,
  and unexpected Companion exit stopped the managed session. It made no model
  calls and reported `current_desktop_task_control: false`.
- The wrapper suite after the launcher change passed 664 tests, with 17
  environment-dependent skips and no failures. A separate offline Playwright
  container run passed all 12 hosted-browser tests, including guarded Plan
  mode labeling and listed/free-text question submission. The host shell could
  not launch Chromium because `libnspr4.so` is absent; no host package was
  installed to work around that environment gap.

## Earlier package (pre-Linux Plan input)

- Unsigned Debian package:
  [`are-companion_0.1.0_amd64-guarded-plan-20260929.deb`](../dist/are-companion_0.1.0_amd64-guarded-plan-20260929.deb),
  38,736,032 bytes, SHA-256
  `db50025b138788ee2c2f93cbe28d30c99e7f11c4df6a004d1a2096897efc8470`.
- Built offline in the existing `are-companion-builder:ubuntu26.04` image using
  the locked repository toolchain and Node 26.8.1. No host packages were
  installed. The builder reported an 807-file development distribution with
  closure digest
  `87e933480406df19717c413e6af7885d45430326b5a51d7413f1282c98eab083`.
- `dpkg-deb` inspection confirmed amd64, version 0.1.0, and system dependencies
  on GTK 3 and WebKitGTK 4.1. The package was extracted to an isolated
  temporary directory, not installed. Its bundled Node ran `are doctor --json`
  with `status: PASS`, product version `0.10.0-rc.1`, and an exact Node version
  match. The extracted ARE tree contained 807 files and no TUI path.

## Rendered and managed checks

- The extracted executable ran as UID 1000 in a network-disabled Ubuntu 26.04
  container on the WSLg X11 display. Test-only WebKit inspector access verified
  the orb document and Tauri bridge, opened the dashboard, passed its bundled
  product diagnostic, found all seven panels, checked navigation and the
  unconfigured Evolution states, and applied the Cobalt skin. WebKit emitted
  non-fatal DRI3/EGL acceleration warnings.
- [`test-managed-session-linux.mjs`](../scripts/test-managed-session-linux.mjs)
  now has a `--package-root` mode that requires Node and the ARE tree adjacent
  to the extracted Companion executable. That package-only run passed with
  gateway `running`, backend `ready`, hosted client `connected`, a rendered orb
  and seven-panel dashboard, and supervised Companion-exit cleanup. It made
  zero private/external model calls and reported
  `current_desktop_task_control: false`.
- The legacy repository-source mode passed the same rendered managed-session
  smoke after the new package-mode argument parsing, preserving that test path.

## Claim ceiling and Open Questions

These are extracted-package WSLg/WebKitGTK fixtures, not a normal Linux
installation or a physical-pointer/compositor acceptance test. It does not
prove free drag, long-run CPU/memory budgets, screen-reader behavior, install
or upgrade/rollback/uninstall behavior, a real-provider Plan turn, macOS
support, or handover of this desktop task. The packages depend on host GTK and
WebKitGTK libraries and are not universal Linux binaries.

Open questions: what supported compositor/OS matrix and numerical resource budget define
product acceptance; and whether a supported exact-task host handover exists.
