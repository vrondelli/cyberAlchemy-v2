# G1/D3 managed desktop private-state inspection — 2026-10-02

Status: bounded candidate construction. No Codex desktop task was resumed,
handed over, or activated. No installed configuration changed.

## Gap and decision

The separate managed desktop JSONL client correctly refuses a restart when
its private state contains a pending request or a delivery whose consumption
by the desktop cannot be proved. That refusal was opaque to an operator without
opening the private journal, which also contains a resume token and native
messages. The [D3 construction contract](../G1-DESKTOP-GATEWAY-ADAPTER-CONSTRUCTION.md)
requires recovery to remain fail-closed. The [activated-session contract](../SESSION-CONTROL-CONTRACT.md)
forbids treating a matching thread or resumable App Server ID as handover.

The chosen construction is a read-only, content-free diagnostic, not a replay
or reconciliation operation. The new `inspectDesktopGatewayState` function
validates the same private directory, backend binding, state schema, record
digest, delivery sequence, and owned-thread references as the writer. It does
not take or repair the writer lock. The CLI can be invoked with:

`node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-desktop-gateway-inspect.mjs <absolute-private-state-dir> <backend-sha256> <desktop-wsl-base/v1|desktop-wsl-app-tools/v1>`

It returns only state presence, pending-intent and retained-delivery counts,
owned-thread count, last acknowledged sequence, and an explicit local
reconciliation flag. It always labels gateway reconnect admission as
`not-assessed` and desktop consumption as `not-observed`. The count of zero
is not a gateway or desktop readiness claim; when no state exists, counts and
the reconciliation flag are `null` rather than invented zeroes. Wrong backend binding, unsafe or
corrupt state, and malformed input fail closed without printing the token,
thread IDs, request payloads, or stored native messages.

## Verification

- State suite: 9/9 passed, including absent state without lock creation,
  inspection while the writer lock is live, byte-identical state before and
  after, no secret or thread-ID output, persistent unreconciled posture after
  writer close, changed backend digest rejection, and a CLI subprocess against
  a populated private fixture.
- Combined state, managed desktop-client and separate-process suites: 22/22
  passed. The
  pre-existing two-turn fixture still refuses an unreconciled restart without
  redispatching a host turn.
- The full wrapper package suite, run with test-file concurrency 2 and a
  task-owned `TMPDIR`, passed 759, skipped 24, failed 0 (783 total) after the
  final absent-state `null` correction.
- `node --check` passed for the state module and CLI. A direct CLI smoke on an
  exact private directory with no state returned `state_present:false` and
  `gateway_reconnect_admission:not-assessed`; an invalid digest exited with a
  sanitized diagnostic. Tests used a task-owned cache temp root because the
  host's `/tmp` filesystem was full.

The current [official OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server)
describes custom clients using `thread/resume` and `turn/start`, but does not
document an exclusive desktop-to-ARE writer handover. The [remote-connection
handoff documentation](https://learn.chatgpt.com/docs/remote-connections#hand-off-a-chat-between-hosts)
describes changing a chat's run location; that is not session-controller
ownership. This is an inference about the documented surface, not proof that
no undocumented or future host mechanism exists.

## Claim ceiling

The diagnostic makes a refused restart inspectable without weakening it. It
does not make the managed client restartable, prove desktop receipt, repair
unknown backend acceptance, establish stock-app ingress, or control the
current task. TUI is discontinued and not a fallback.

## Open Questions

- Can a supported desktop client supply an exact, durable consumption receipt
  for each delivered response and server request, allowing D3 recovery without
  replay or skipping unknown output?
- Can a desktop-host integrator expose exclusive writer release and input/
  approval redirection for the exact current task? Until then G1/D4 and O1
  remain open.
