# Windows Plan-status Companion candidate — 2026-09-29

Status: bounded development evidence. Authority effect: none. TUI is discontinued and is not a tested or shipped interface here.

## Exact candidate

- Unsigned NSIS installer: `D:\are-companion-plan-status-20260929.exe` (29,577,185 bytes; SHA-256 `25653be744478139287a7c4761217d259f9859f1d7ae0bcb295667e7f5cd3be6`). It was built from the current checkout by `scripts/build-windows.mjs` with native Windows Node 26.8.1 and the pinned Windows Rust toolchain, without signing or installation.
- Retained build stage: `D:\acw-iII8tS`. The compiled executable was copied to `src-tauri\resources\are-companion.exe` solely for adjacent-resource tests (9,365,504 bytes; SHA-256 `12e2adf7eff20772ea9b1e9187dbbfbbe1024f57985a6be6a0080310df97325b`). The same SHA-256 applies to `src-tauri\target\release\are-companion.exe`.
- Build-reported standalone closure digest: `0b971d682c50c0e2f291bcb3baf35291a30ff1ee2814a4873391c9b9275be7e2`, 807 files. Product-health core closure digest: `7fcfce3416af5bfb06590a6ae32d891a911c96f21d581aa10bd0ae0012ba467c`.
- Native Codex canary binary: `D:\are-codex-canary-0nuH2W\codex.exe`, `codex-cli 0.155.0-alpha.16.4`, SHA-256 `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`.
- The staged `are-managed-session.mjs`, dashboard `app.js`, and Tauri `main.rs` SHA-256 hashes match the checkout source. No TUI or `terminal-ui` package path appeared in the staged ARE closure.

## Validation

- `scripts/test-windows-features.mjs` passed 11 checks against the retained package resources: exact bundled Node, product health, route/context, Reasoning State, thread and decision observation imports, and native Evolution SQLite write/reopen/replay.
- `scripts/test-managed-session-windows.mjs` passed against the adjacent app/Node/ARE resources with `--guarded-plan-input`. The floating orb and seven-panel dashboard rendered; gateway/backend/client were connected; the model-wire guard had a parent heartbeat; the Adapters panel showed guarded Plan questions as **configured at launch (candidate)**. Hosted state reported `plan-with-guarded-user-input`. The test performed no model turn, no external model call, and no current-desktop-task handover. Unexpected Companion exit stopped the managed session.
- The same package-only smoke passed in ordinary mode. The Adapters panel showed guarded Plan questions as **not declared**, model entry stayed paused, and the manager supervised shutdown.
- `scripts/test-windows-ui.mjs --adapter-live` passed twice after one initial failure in the Evidence-to-Decisions return navigation. The initial failure reported a hidden Decisions panel and missing heading focus immediately after a pointer click; two independent reruns passed that path and the full native UI journey. The test now polls up to three seconds for both post-click panel and heading focus, without re-clicking or accepting a wrong state; two further runs passed. This is an intermittent test observation, not proof that the path is fully stable. The passing journeys covered nonblank UI, all seven panels, adapter state, Thread Reasoning State, decision linkage, Evolution empty state, evidence, appearance persistence, keyboard focus, contrast, and reduced motion.

## Claim ceiling and Open Questions

The installer was created but not extracted, installed, signed, or exercised through upgrade/rollback. No NSIS extraction tool was available locally, so the tests validate the retained adjacent build resources, not installer payload bytes or installed behavior. The bundled runtime remains a development candidate; observed backend threads are not automatically this Codex desktop task. The current desktop task's writer has not been handed over to ARE. The guarded Plan declaration is launch-scoped and does not assert that a question is currently pending or that this chat is controlled.

Open questions: extract and verify the NSIS payload against the retained stage; test an isolated install/uninstall and fresh-machine WebView2 path; determine whether the intermittent Evidence return is a timing-sensitive automation click or a user-visible navigation defect; verify native host callback and exclusive current-task writer handover before any activation claim. The active integration work-pack owns those remaining boundaries.
