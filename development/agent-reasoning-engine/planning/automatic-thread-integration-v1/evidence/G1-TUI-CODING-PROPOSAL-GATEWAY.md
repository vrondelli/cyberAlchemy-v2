# G1 TUI coding-proposal gateway evidence

Status: bounded construction evidence, updated 2026-09-27. Authority effect: none.

The TUI's Codex coding-proposal client now uses the acknowledged persistent
gateway by default under its own `codex:coding-proposal` consumer. It pins the
Codex backend adapter, supplies stable keys for `thread/start` and each
`turn/start`, sends the exact user request with an explicit user-selected
Implement posture, and uses read-only/on-request host policy. A private
single-writer POSIX recovery record checkpoints the gateway receipt before
host initialization or thread creation; it allows a second TUI process to
reattach without sharing Define's `codex:human-chat` identity. This reuses the
hosted client's existing POSIX recovery-store implementation under a gateway
client export; its legacy schema/error names remain Windows-client-prefixed.
The token is not included in the proposal result, UI snapshot or saved proposal receipt. The direct wrapper
remains an explicit API-level compatibility mode, not a fallback when the
gateway is unavailable.

Each model-turn intent now enters that private record before `turn/start` as
owned thread, stable request key, prompt SHA-256 and timestamp, without prompt
text. It clears only after a response with completed status, turn ID and
nonempty final output. An unresolved turn makes the current TUI uncertain, and
a restarted TUI starts blocked before another proposal can dispatch. Its
composer is disabled and its control-center status is blocked, not idle. This
prevents silent duplicate starts; it does not recover a lost proposal or
resolve host history.

A read-only TUI recovery observer now rebinds the same gateway consumer and
tries `thread/read` with turns. It reports an exact host-turn status only if
one owned turn's user text hashes to the saved prompt digest. The TUI redacts
prompt and raw turn ID, shows a dedicated blocked recovery panel, and offers
Ctrl+R to recheck. Missing,
duplicate, unrecognized or unavailable history remains unverified. On the
installed host, ephemeral threads reject both full `thread/read` and
`thread/turns/list`; default-mode recovery can therefore show only the owned
thread runtime status, explicitly unbound to the pending intent. An opt-in
`--durable-proposal-thread` uses local Codex history for exact matching. This
changes local retention only when selected; it is not the default.

Verification from this checkout:

- TUI package `npm test`: 55/55 passed.
- Coding-agent runtime `npm test`: 417/417 passed when rerun alone.
- Codex wrapper `npm test`: 379 passed, one platform skip, zero failures.
- Integration-surface test: 5/5 passed, including recognition of an injected
  gateway transport reference and the new recovery observer as executable
  client sources. The topology entry's claim limit was synchronized.
- `native-gateway-proposal-canary.mjs` passed two proposal turns in distinct
  worker processes through the
  installed `codex-cli 0.155.0-alpha.16.4` binary with a fixed loopback
  provider. Both used the same gateway consumer session; the temporary
  repository tree was unchanged. The 0600 recovery file survived between
  workers. The fixture made zero external model calls,
  touched no current desktop task, and removed its temporary configuration.
  The updated workers checkpointed and settled each intent through the
  installed host. A focused restart fixture separately verifies that an
  unresolved intent blocks a new TUI controller without dispatch.
- With the explicit durable-thread option, the installed-host canary matched
  each of two completed proposal prompts to one stored turn via full
  `thread/read`. An optional crash mode killed a third proposal worker after
  its provider request arrived. The intent survived, and a new client
  matched the same terminal host turn. Separate runs observed both
  `interrupted` and `completed`, so client death does not imply host
  interruption. Neither run made a replacement provider request or changed
  the fixture. A separate default-ephemeral canary proved summary-only idle
  status after full history was rejected; it did not claim turn attribution.
  These modes used temporary Codex state, zero
  external model calls, and removed their temporary configuration.

An initial simultaneous run of the TUI, coding and wrapper suites hit
timeout-sensitive coding secret-diagnostic and gateway-handshake fixtures;
the coding and wrapper suites both passed when rerun serially. This is a test
resource-sensitivity observation, not an integration success claim.

This proves a bounded gateway-backed TUI proposal path, completed-turn
client-process restart, fail-closed unresolved-turn detection and read-only
host-history attribution for opt-in durable threads on the selected POSIX
host. It does not recover a lost proposal, release an uncertain intent,
prove a live external-model result, restore UI history, or establish universal
host effect interception, desktop-client
relinquishment, ownership of the current task, product approval or activation.

## Open Questions

- How should a terminal attributed turn become a durable, explicit resolution
  that can safely release the TUI block without silently losing a completed
  proposal? How should
  expired gateway sessions be retired?
- What native Windows credential store should replace this POSIX-only file
  implementation before cross-OS TUI recovery is claimed?
- How will the selected desktop client hand over the exact active task without
  a competing writer or an unobserved ingress route?
- When can the explicit direct compatibility mode be retired after equivalent
  gateway and rollback evidence?
