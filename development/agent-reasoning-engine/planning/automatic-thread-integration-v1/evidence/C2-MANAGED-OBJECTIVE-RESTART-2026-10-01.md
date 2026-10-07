# C2 managed objective restart: disposable native proof

## Result

On 2026-10-01, `managed-objective-restart-canary.mjs` passed with the selected
installed WSL Codex binary (`codex-cli 0.155.0-alpha.16.4`). One managed launcher
owned the gateway and hosted HTTP client. A hosted thread completed an initial
objective turn against a private fixed-response loopback provider. After clean
manager shutdown and restart from the same private state directory, the hosted
client resumed the same backend thread, replayed the first request key from a
durable accepted-turn receipt without redispatch, and completed a second
`do next` turn. The two durable `objective-transition-resolved` events carry
the same active objective ID; the second transition is `continue`.

The fixture reported two local model calls, zero external model calls, and
`current_desktop_task_control: false`. It creates and deletes disposable
private state. It does not install software, activate this desktop task, or
exercise the discontinued TUI.

## Verification

Run:

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/managed-session-cli.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/objective-lifecycle.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/objective-requirements.test.mjs
```

Observed: canary `ok:true`, two objective events, duplicate dispatch rejected;
focused suites 36/36 pass.

## Claim boundary and next gap

This is a C2 objective-only two-turn/restart slice, not full C2 completion:
steering, compaction, unknown-outcome reconciliation, and an exclusive desktop
handover need their own proof. Requirement tracking was disabled for this
fixture. The gateway currently supplies no trusted `requirement_seed_provider`
to the wrapper, while the requirement lifecycle explicitly blocks a new
tracked objective without an explicit seed (`requirements.explicit-seed-required`).
The readiness boolean reflects configuration only. A future host-bound seed
contract must preserve explicit requirements and bind them to the exact turn;
defaulting to an empty requirement set would risk losing user constraints.

## Open Questions

- Which authenticated hosted input field or host bridge should supply the
  explicit first-turn requirement seed, including a deliberate empty set?
- How should the Companion disclose configured-but-not-operational requirement
  tracking without implying this desktop task is ARE-controlled?
