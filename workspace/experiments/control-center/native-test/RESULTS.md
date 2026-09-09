# CC-003 native test result

2026-09-05. Overall: FAIL — unchanged unified chat timing budgets exceeded.
Local candidate evidence only; no product approval or operational authority.

## Executed

- Explicit CC-003 frontend selection: 78/78 tests passed across 14 files.
  `vitest.config.mjs` selects only the manifest imported by its existing test;
  assertions and every other test remain intact. Default historical selection
  is unchanged, not silently labeled current or green.
- TypeScript no-emit: passed.
- WDIO-specific Vite build: passed, temporary frontend assets only.
- Cargo `--locked --features wdio` build with temporary frontendDist and unique
  test app identifier: passed. Binary copied into isolated test directory.
- Focused native Tauri/WebKitGTK continuity test: passed. Same DOM composer,
  retained unsent draft, one input, artifact navigation and expand/compact tested.
- Native narrow check initially lacked resize synchronization. Screenshot review
  detected the false narrow witness; test was corrected to wait for measured
  innerWidth <=720, rerun successfully, and final narrow screenshot inspected.
  Requested outer size 390×844 is not an assertion of exact inner viewport size.
- Unchanged unified Workspace/Essays smoke: FAIL at timing assertions after
  executing lifecycle/relaunch and governed chat fixture interactions.
- CC-003 selected bindings revalidated after execution: PASS.

## Timing evidence, not a qualified campaign

| Metric | Observed | Budget | Population |
| --- | --- | --- | --- |
| workspace.navigation-to-paint | p95 29 ms | 120 ms | 22 samples, one smoke session |
| chat.delta-to-projection | 20 ms | 16.7 ms | 1 sample |
| chat.delta-to-paint | 99 ms | 16.7 ms | 1 sample |

The harness labels the single-sample values p95, but they are not meaningful
population estimates. Both exceed their unchanged limits; the failure is retained.
Host load immediately before unified run: 4.60 / 2.91 / 1.92 (1/5/15 minutes).
No host-qualification predicate or repeated cold-session population was established.
Contamination is not proven, and host load does not excuse or reverse this failure.
No rerun-until-green campaign was performed.

## Native versus fixture boundary

Real Tauri IPC and ARE desktop bridge were used, with the existing mock Codex
executable and ARE_CODEX_ALLOW_PROTOCOL_DRIFT=1. No live Codex session or external
agent work. Unified fixture approved its mock effect through the existing gate.
Its bridge journal contains 12 entries including preflight.decision,
effect.decision, effect.approval-bound, turn.completed, and turn.receipt-manifest.
This does not establish live-provider protocol conformance or receipt-panel
rendering completeness. The focused layout test sends no message or approval.

Driver diagnostics warned about missing external drivers/packages despite the
embedded driver completing native sessions. Teardown also warned about clearing
mock state after session closure. No dependency installation was performed.

## Identity and isolation

- CC-003 JSON SHA-256: `d6d0cab8e8b6699eafed912a8467a7599ed3d10cf756348765cc6142f361861d`
- Test binary SHA-256: `9de53e4a5875251626c2a0f42ddd2bdbb015fb95ee456233c4c2aef40a182921`
- Budget SHA-256 unchanged: `e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf`
- Temporary directory: `/tmp/cav2-cc003-native.JHGox9` (binary, frontend,
  separate SQLite databases, app data, screenshots and receipt journals retained).
- Final screenshots copied to `output/control-center-desktop.png` and
  `output/control-center-narrow.png`. CC-003 itself remains unchanged.
- Ordinary non-WDIO `cargo build --locked` restored successfully after testing.
  Production frontend dist was never replaced; no restoration was needed there.
  Driver port 4445 is no longer listening. No user desktop session was stopped.

These identities link this bounded attempt, not a complete differential evidence
bundle or transitive frozen-product closure. The test apparatus is separately
authored under this directory.

## Next frontier

Harden the timing campaign: deterministic host-load qualification, repeated cold
desktop sessions, meaningful populations, and an identity-bound comparison against
the previous candidate. Then diagnose reproducible projection/paint overruns with
transport, projection and frame-wait breakdowns. Preserve budgets and failed runs.
Product approval, reconciliation and delivery remain pending.
