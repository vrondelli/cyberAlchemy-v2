# Windows package-only managed Companion check — 2026-09-30

Status: bounded development evidence. The TUI is discontinued. Neither the
installer nor persistent host configuration was run, installed, or activated;
the current Codex desktop task remained outside ARE control.

## Exact tested bytes

The staged executable, bundled Node 26.8.1, and ARE runtime came from the
same retained `D:\acw-ggmlQ0\src-tauri\target\release` tree. That tree belongs
to the unsigned `D:\are-companion-evolution-registry-20260930.exe` installer
(SHA-256 `d6c5e02997b21cb9927f51c7342f8e01c1b41f3d39fd4f9355d0fd353579f1cc`;
807 package files; closure digest
`aba0a7efaeec3ba6f91942716e25061315dd6056a9639356de7ccf1159275824`).
The disposable host was a hash-verified copy of native Windows
`codex-cli 0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).

The test runner lived in the checkout, but it invoked `are-managed-session.mjs`,
the hosted client, gateway, profile, Node, ARE entry, and Companion from the
package-adjacent resource tree. Each run used generated private state and a
disposable, model-free provider configuration.

## Results

- Baseline package-only mode passed: gateway running, backend ready, hosted
  client connected, floating orb and seven-panel dashboard rendered, hosted
  input proof configured, model-turn ingress paused, and supervised Companion
  stop. It made zero private or external model calls.
- Package-only guarded Plan mode also passed with explicit native Windows
  `unelevated` sandbox configuration. Its four read/write sandbox controls
  passed in preflight, and the actual connected backend separately reported
  `passed-all-active-backends`. The dashboard showed its guarded Plan candidate,
  parent-heartbeat model-wire guard, and independent sandbox status. This
  launch declared guarded text-only model entry, but the fixture dispatched
  no model turn and made zero private or external model calls.
- Both runs reported `resource_origin: adjacent-package-resources`,
  `current_desktop_task_control: false`, `installed: false`, and
  `authority_effect: none`; both processes exited with status zero after
  supervised cleanup.

The sandbox result does **not** open Windows hosted-command execution. The
pinned native host still rejects a custom `outputBytesCap` and streaming under
its Windows sandbox, so the production gate remains
`hosted-effect.windows-output-bound-unavailable`; see the
[output-cap evidence](../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/G1-WINDOWS-SANDBOX-MANAGED-PREFLIGHT.md#pinned-output-cap-recheck--2026-09-30).

## Claim ceiling

This proves package-adjacent development startup and rendered status, not the
NSIS installation lifecycle, a live model turn, complete effect enforcement,
task identity, exclusive desktop writer handover, cross-OS execution, or
resource-budget acceptance. The guarded Plan posture remains a candidate.

## Open Questions

- Can an installed package preserve the same runtime path, private-state
  permissions, supervised stop, and rollback behavior?
- Which bounded execution adapter can provide a Windows UI with safe command
  output without weakening the active Windows hosted-effect gate?
- Can a supported host API release the current desktop writer and transfer all
  ingress, approval, and effect boundaries to one ARE-owned session?
