# Windows exact-source resize and gateway framing slice

Status: candidate development evidence, not installation, activation, release, or control of the current Codex task. The unsigned installer was built on native Windows from this checkout with Node 26.8.1, pinned Rust/MSVC, a short `D:\acw` stage, and signing disabled. No installer was run.

## Package and source boundary

- Installer: `D:\ARE_Companion_resize_gateway_20261003_x64-setup.exe`; 29,703,162 bytes; SHA-256 `d9155348794aba86df477aa3e7c30605daecc4b225cf81bc587630cb57c68d36`.
- Builder-reported development distribution: 841 files, closure digest `caa6b3ef0874797c7df471d04a625ea8bed3ed59cc503cc1bbe4e657f8b2086e`; Core closure digest `a66e73d77ba1ef71b4251d8048463f504652c8aadc041dcb531a44655342fd81`.
- The build stage was removed by the builder. Before removal, its executable and runtime resources were copied to `D:\acw\are-resize-gateway-staged-20261003` for non-installed testing. The copied `gateway-client.mjs` and checkout source have the same SHA-256, `6a93f03a8bce9e81cb9a7b7629012a55539d50507fc331f11c443dde8ab3cb80`. This verifies the new streaming UTF-8 framing source is in the staged closure. The copied executable has SHA-256 `798283bd1e9d3d7e15d9c798f686445c6f1d7362064d3c7636f471d54b268c01`.
- The installer payload itself was not extracted and independently compared with the copied stage. Staged native testing and a successful builder do not prove installed NSIS lifecycle behavior.

## Checks

- Bundled Windows ARE feature probe passed all 13 checks, including exact Node, product diagnostic, route/context, Reasoning State plan context, thread/decision observation modules, and Evolution SQLite reopen/replay. Its Core closure digest matched the builder's digest.
- The source UI suite passed 64/64. A private-mount Linux `/tmp` full gateway-wrapper test run exited 0; six focused framing/delivery tests passed, including a handshake character and a delivery emoji split between socket chunks.
- Native WebView2 staged-executable journey passed: orb and nonblank dashboard; seven panels; source-scoped Evolution candidate posture; Evidence links; keyboard heading focus; skin and placement persistence. The new test asserts that a selected Evolution section stays current, visible and heading-focused immediately after an actual 1120 × 760 to 340 × 740 client resize. Both that assertion and the existing narrow linked-navigation, one-line Refresh, registry first view and no-horizontal-overflow checks passed. The test was repeated with a screenshot at `D:\acw\are-resize-gateway-evolution-340-20261003.png`.
- Visual inspection of the 340 × 740 capture shows the selected Evolution label, working previous/next controls, single-line Refresh, readable status/source text, and no document overflow. The horizontal navigation strip still displays its platform scrollbar; this is a polish candidate, not a functional failure.

## Claim ceiling and next work

This proves a current-source staged Windows UI/runtime slice, not the exact extracted installer payload, physical pointer or screen-reader use, installed restart/rollback/uninstall, or ARE ownership of this Codex desktop task. The gateway's clean desktop-consumption reconciliation and supported exact-task writer transfer remain separate G1 D3/D4 work. A future UI polish slice may suppress the redundant narrow-strip scrollbar only after preserving arrow, keyboard and touch affordances and requalifying exact-source Linux and Windows packages.

## Open Questions

- What supported desktop host action can release and redirect the current task's writer and approvals?
- Who will run physical accessibility and installed-package lifecycle checks, and on which supported OS matrix?
