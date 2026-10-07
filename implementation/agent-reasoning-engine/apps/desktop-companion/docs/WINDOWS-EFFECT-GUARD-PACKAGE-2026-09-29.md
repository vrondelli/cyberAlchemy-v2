# Windows hosted-effect guard Companion candidate — 2026-09-29

Status: bounded development evidence; authority effect: none. The TUI is
discontinued: it is not a product interface, dependency, fallback, or parity
target for this candidate.

## Exact candidate

- Unsigned NSIS installer: `D:\are-companion-windows-effect-guard-20260929.exe`
  (29,577,306 bytes; SHA-256
  `6d6dbeaaa1524cd5db1f97650688286e7178ad34a9c55e74ac8b6158b924b18f`).
  It supersedes the earlier Plan-status installer for hosted-effect testing
  because that installer predates the fail-closed guard.
- Retained Windows build stage: `D:\acw-sN7uaf`. The compiled
  `src-tauri\target\release\are-companion.exe` and its adjacent-resource
  test copy are both 9,365,504 bytes, SHA-256
  `51208cb45d6307b79d7badc443f47fd59ec40c55f8095a6a5e17a3319c003cde`.
- Build-reported standalone ARE closure digest:
  `8558cbb27f344daed04da4db5f311d1dd18fb1a1d3ab086f894844a6168e8232`
  (807 files); Core closure digest:
  `79a201f48857c69b8099e4556c6f1eb7c556209fe76de02f5d41b397e5b406c0`.
  Native Windows Node 26.8.1 and the pinned Rust toolchain built this candidate.
- The staged `hosted-effect-execution.mjs` SHA-256 matches checkout source:
  `dc83d4ac45832b4d1617f7814ce8a19740a1a60ecf03bddba74b498706a4113f`.
  The staged `are-managed-session.mjs` also matches checkout source:
  `b8eb9c80ad45342cf54a34fdd678873da18a8227064dac288c418ddf7e59c8db`.

## Validation

- Package-adjacent `test-windows-features.mjs` passed all 11 checks; product
  health reported `0.10.0-rc.1` and the build's Core closure digest.
- The packaged gateway and hosted-client CLIs each refused
  `--allow-hosted-effects` with exit code 2 and a typed Windows sandbox reason.
  The managed-session preflight and final hosted-command preparation also
  refuse this Windows effect path. This is an intentional stop, not a
  successful Windows hosted-command dispatch.
- `test-managed-session-windows.mjs --guarded-plan-input` passed against the
  adjacent package: floating orb and seven-panel dashboard rendered;
  gateway/backend/client connected; guarded Plan input was launch-configured;
  parent guard heartbeat ran; and shutdown was supervised. It made zero
  model calls and did not touch the current desktop task.
- The ordinary package-only managed smoke also passed: guarded Plan input
  was not declared, model turns stayed paused, and shutdown was supervised.
- `test-windows-ui.mjs --adapter-live` passed against the staged executable:
  nonblank orb/dashboard, all seven panels, Reasoning State, Evolution,
  evidence, appearance, and keyboard/focus checks. No TUI was used.
- The full Linux wrapper suite passed 664/682 tests with 18
  platform/browser skips. Focused native Windows execution, managed-session,
  wrapper, gateway, and client checks exercised the fail-closed path. Full
  native Windows wrapper/gateway suites remain unclaimed because unrelated
  hard-coded POSIX `/tmp` fixture paths fail there.

The [G1 hosted-effect evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-HOSTED-DYNAMIC-EFFECT-TRANSPORT.md)
records the pinned native Windows App Server canary: an unconfigured
disposable Windows sandbox accepted a `readOnly` write, whereas explicitly
configured disposable `unelevated` mode passed four controls. Neither run
proves the managed product path's effective sandbox posture.

## Claim ceiling and Open Questions

The installer was built but not extracted, installed, signed, or exercised
through upgrade/rollback. These checks validate retained adjacent build
resources, not installed behavior or every installer payload byte. Windows
sandbox-mode binding, managed preflight probes, and the Windows-compatible
hosted-command shape were added to repository source after this build; this
installer does not contain those later changes. The [new source-only
evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-WINDOWS-SANDBOX-MANAGED-PREFLIGHT.md)
is not a packaged or installed claim. Windows
hosted effects remain disabled until the managed gateway binds and verifies
an effective sandbox mode and the read-only, inside-root, outside-root,
restart, approval, and recovery boundaries. The desktop task's writer was
not handed over to ARE. The Companion's read-only and guarded Plan UI can
continue independently of Windows hosted effects.

Open questions: verify the NSIS payload and isolated install lifecycle;
establish a managed Windows sandbox attestation and joined effect tests;
prove exact current-task writer handover before activation. TUI has no
remaining parity or integration work.
