# ARE Companion current-source Windows package check

Status: bounded prototype evidence, 2026-09-27. Authority effect: none. The
TUI is discontinued; this check covers the desktop Companion only. No
installer was run, no application was installed, and this Codex desktop task
was not handed over to ARE.

## Exact package

- Source: the current checkout at build time, including the seven-page
  Companion and the ARE standalone development closure.
- Builder: native Windows Node 26.8.1, pinned Rust 1.98.1 MSVC, Tauri CLI;
  unsigned NSIS output. The Node ZIP was downloaded from the official
  `v26.8.1` distribution and matched its published `SHASUMS256.txt` entry
  (`57693d8e93d1b04e7b7de46aca53ecd63e97564e73de36a68428d7ff08d83587`).
- Output: `dist/ARE_Companion_0.1.0_x64-setup-current-20260927.exe`,
  29,350,694 bytes, SHA-256
  `fab1d1e1eaf5acd18147759b5ef733f331b24b3bf6db1bc97fe7724fb34a3b79`.
- Development closure: 773 files, digest
  `9487a901a22458cdf2958429b8bb35e7140cae1d09006825301fa7c10f001882`.
  Core product closure digest:
  `7ac4456d0b5a131e76c011fc5256f0de3059abb6e239d5ea39cac776c52a9cb8`.

## Current checks

`test-windows-features.mjs` passed against the staged bundled resources:
exact Node, product health, route/context, Reasoning State plan context,
thread/decision observer imports, and fail-closed native Windows Evolution
writer behavior without creating a root.

`test-windows-ui.mjs` passed against the same staged executable in an isolated
WebView2 profile in three modes:

1. Default: floating orb, nonblank dashboard, seven destinations, honest
   unconfigured sources, keyboard/focus, appearance and relaunch persistence.
2. `--adapter-live`: a local development gateway fixture provided an observed
   adapter path, one gateway Reasoning State row and a linked decision.
   Gateway loss cleared live postures; product health remained independent.
3. `--adapter-live --unknown-dispatch`: the unresolved dispatch appeared as
   Attention without a safe-retry claim.

The first live-adapter run stopped on a stale test assertion expecting old
copy. The rendered screen already reported `Desktop task control: unverified`
and `This chat is not established as ARE-managed.` The test now asserts both
current statements; the same executable passed the rerun. This was a test
repair, not a runtime or package change.

## Claim ceiling and next boundary

These checks establish a current-source unsigned package build and a staged
native WebView2 development smoke. The live adapter is a fixture, not the
current desktop task or a real backend-thread handover. The installer remains
uninstalled. No signing, release, update, rollback, uninstall, universal
effect interception, or exact host-task activation is proved. The Companion
must continue to report host-task control as unverified.

## Open Questions

- Can the exact desktop client relinquish and recover this task's sole writer
  with complete ingress, approval and rollback coverage?
- What native installed-package and real-gateway checks are required before
  enabling the read-only observation endpoint outside development mode?
- Which supported Windows and Linux versions, accessibility criteria and idle
  resource budgets define a product-candidate gate?
