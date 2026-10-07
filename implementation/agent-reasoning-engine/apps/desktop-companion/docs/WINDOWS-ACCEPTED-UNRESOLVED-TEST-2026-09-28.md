# Windows Companion accepted-but-unresolved turn observation

Status: bounded development validation, 2026-09-28. Authority effect: none.
The TUI is discontinued and outside this test. The current desktop task was
not handed over to ARE, and the installer was not run.

## Exact artifact and scope

- Current-source, unsigned NSIS candidate:
  `/mnt/d/are-companion-accepted-NNfHc6/ARE_Companion_accepted_unresolved_20260928.exe`
  (29,436,621 bytes; SHA-256
  `c4eabfb26448b7004f9fde74ed5950b9bef80ac92cdb3113798c90cc75e4c483`).
  The builder reported a 764-file development closure digest
  `e8af6bb3e4b5d7e2ff38bfd4d647d268c9afd29d9f33460f2befe264b9a27a6a`
  and Core closure digest
  `ae11adedc991915b99dc65199fddf173ed0febb95ea29358baada141cb3e5fdc`.
- Retained, tested executable:
  `/mnt/d/are-companion-accepted-NNfHc6/stage/src-tauri/target/release/are-companion.exe`
  (SHA-256
  `d8410f3c6f85af1622b4176a6cc3e4b4ec879b6e8e9b97bec9046c3a3dcbb6ab`).
  The generated stage was moved intact from C: to D: after testing; the
  bundled-feature and accepted-unresolved UI checks passed again at its D:
  location. Measured C: free space increased from about 1.8 GB to 3.2 GB.

## Validation

- Native Windows Node 26.8.1 built the pinned Tauri/WebView2 development
  package. The bundled `test-windows-features.mjs` probe passed all 11 named
  checks before and after the stage move: product health, route/context,
  Reasoning State, observation imports, and native Evolution storage among
  them.
- The test-only `--adapter-live --accepted-unresolved` fixture checkpoints
  one exact `turn/start` intent and matching content-free host-acceptance
  receipt while leaving its gateway outcome unknown. The native WebView2
  journey passed before and after the stage move: orb and dashboard were
  nonblank, all seven pages remained navigable, and Threads showed a durable
  host-accepted unresolved turn separately from an ARE completion or safe
  retry. Gateway loss withdrew live postures without changing product health.
- The distinct `--adapter-live --unknown-dispatch` journey also passed. It
  reported one unresolved gateway mutation and zero retained host-acceptance
  receipts, so the new status did not manufacture acceptance for an entirely
  unknown dispatch.
- `node --check` and scoped `git diff --check` passed for the native test
  harness. The installer is identified as a Nullsoft self-extracting archive;
  archive extraction/integrity and installed lifecycle were not checked.

The fixtures used no external model calls, host mutation, or current-task
access. These results prove the staged executable's read-only projection in
isolated WebView2 profiles, not an installed package, real unknown-delivery
reconciliation, host-writer transfer, or a live ARE-managed chat.

## Open Questions

- Which supported host contract can reconcile a genuinely unknown gateway
  outcome without risking a duplicate turn?
- Does the final installed package retain this UI behavior after access
  controls, lifecycle, and rollback are validated?
