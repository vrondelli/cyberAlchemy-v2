# Narrow navigation and inbound gateway flow — Linux candidate

Status: candidate source/package evidence only. Nothing was installed, activated, signed, released, or deployed. This does not prove ARE controls the current Codex desktop task.

## Exact changes and package

At widths up to 740 px, the dashboard's horizontal section strip remains scrollable but suppresses its redundant platform scrollbar. The visible Previous/Next buttons, focus recovery, and active-label reveal remain. The source UI suite passed 64/64. A headed Chromium/Playwright CLI check at 340 × 740 observed `scrollWidth: 650`, `clientWidth: 224`, `scrollbarWidth: none`, hidden WebKit scrollbar display, a working Previous button (offset 296 → 128), selected Evolution visible and heading-focused, and no horizontal document overflow. Its captured [source-browser viewport](/home/vlad_/projects/cyberAlchemy-v2/output/playwright/are-narrow-nav-no-scrollbar-20261003.png) was visually inspected. The browser-only page lacked a native Tauri bridge, so its source readings correctly remained unavailable.

The exact-source unsigned [Linux development package](../dist/are-companion_0.1.0_amd64-navclean-20261003.deb) is 45,858,016 bytes, SHA-256 `6f75b43d0cb75c61c7a6eb50d7619b378dffab79c09821906ac3d2ea5ea39d17`. It was built offline in the existing Ubuntu 26.04 builder image with Node 26.8.1 and the repository-locked Rust 1.98.1 toolchain; the host lacked GUI build headers, and no host packages were installed. The builder reported an 841-file development closure digest `010adf5f9adca5c641f147f97fb390c1d57069a23ad314edd3bdc2135e274718`. `dpkg-deb` confirms amd64, version 0.1.0, and GTK/WebKit runtime dependencies. The package was extracted without installation. Its bundled ARE `doctor --json` passed with the exact Node version. The packaged gateway client and current source are byte-identical (SHA-256 `80daf3ebd7f33fc30275274134f625ebd61b0154cec5ce84eac606c220311200`).

## Native Linux journey

An extracted-package dashboard-only WebKitGTK/X11 run in a network-disabled container passed the bundled diagnostic and all seven sections. A real 1120 × 760 to 340 × 740 client resize passed narrow navigation in both directions, edge-focus recovery, linked Evolution selection, first useful registry content, and no horizontal document overflow. Its [340 × 740 native capture](/home/vlad_/.cache/are-linux-navclean-build-gLkh96/navclean-native-340-converted.png) was visually inspected: the active label and arrows are visible without a horizontal scrollbar.

The first native attempt exposed a fixture ordering error: seven-panel preflight ended on Appearance, while the narrow-control assertion assumed Overview was selected at the start. The inspector now explicitly selects Overview before that separate edge-control journey; the exact same extracted package then passed. The fixture correction does not modify the packaged UI.

## Integration boundary

The gateway transport now pauses socket reads while an acknowledged delivery waits for downstream confirmation, processes same-chunk frames serially, and rejects more than 4 MiB of buffered delivery data. Focused desktop/gateway delivery tests passed 19/19 and the complete wrapper test command exited 0 in an isolated `/tmp`. This bounds a local resource/reordering gap; it does not add a desktop-consumption receipt. G1 D3 clean restart after delivered turns and D4 exact-task writer transfer remain open.

## Open Questions

- What supported desktop receipt or host handover can prove consumption and exclusive ownership of the existing task?
- When will physical pointer/assistive-technology checks and installed-package lifecycle tests be run on the selected OS matrix?
