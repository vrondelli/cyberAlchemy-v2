# G1 installed-host gateway hard-crash recovery

Status: bounded candidate construction evidence, 2026-09-27. The TUI is
discontinued and was not used. No current desktop task, host configuration,
installed software, or external model was touched.

## Exact probe

Run `native-gateway-hard-crash-recovery.mjs` with the installed
`codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`).
The driver uses [the native user-input canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs)
to create a disposable Codex home, fixed loopback Responses provider, private
file-backed gateway session, and per-consumer Reasoning State. It suppresses
the `turn/start` response for a completed host turn, observes one automatic
compaction item, and writes an exact private crash checkpoint. The driver then
kills the gateway process with `SIGKILL` before its close handlers run. It
checks and kills the orphaned installed backend by its exact executable path.

A separate Node process starts the real gateway and installed backend from the
same private stores. It resumes the authenticated consumer and retained host
initialization, confirms the original request remains `outcome-unknown`, and
checks that both same-key retry and a different-key turn are rejected. A
read-only `thread/read` finds exactly one host user-message marker on the
completed turn. The gateway persists one marker observation, then
`GATEWAY_TURN_RECOVERY_GET` and `CONFIRM` transition that exact intent to
`recovered`; replay still cannot fabricate the lost host response. The
Threads projection reports one recovered dispatch and no unknown dispatch.
The restarted process has zero prior process-local Decision records and keeps
host-task control `unverified`. It never starts a provider service or
redispatches the turn.

The hard-crash probe passed three times on WSL/Linux with the installed binary.
Each run observed one compaction item and one matching host marker, blocked
both unsafe retries, confirmed one semantic recovery, and removed its
temporary state. The pre-existing clean gateway/backend restart probe with
the same lost-response and automatic-compaction mode also passed after this
change. All four runs reported zero external model calls.

On 2026-09-28, one additional run passed after the gateway began deferring
host turn events that arrive before a durable `turn/start` acceptance. The
fixture deliberately withheld that start response; it therefore used bounded
read-only history polling to verify the completed marked turn, instead of
requiring an unbound completion notification. The gateway crash and restart
still yielded one marker match, one automatic-compaction item, blocked both
unsafe retries, confirmed semantic recovery, and removed temporary state.
The adapter and thread-status projections were updated to accept the new
content-free native-completion receipt in retained state. This run used no
external model and did not touch the current desktop task.

## Claim ceiling

This closes one specific installed-host G1 gap: completed-turn marker and
semantic-state reconciliation after an actual gateway-process kill, without
duplicate dispatch. It does not prove active/interrupted turn recovery after
`SIGKILL`, every crash point, power-loss durability, native Windows process
termination, complete effect interception, or exclusive writer handover for
the current Codex desktop task. The separate [gateway-only process-kill
fixture](G1-FORWARDED-TURN-SIGKILL.md) covers the forwarded but unresolved
backend case; its controlled backend is not this installed-host test.

## Open Questions

- Can active or interrupted installed-host turns be reconciled after a hard
  gateway crash without a false terminal claim or redispatch?
- Are all durable intent, marker, and confirmation checkpoint boundaries safe
  under process termination and actual power loss, including native Windows?
- What verified desktop-client relinquishment, account binding, live ingress
  coverage, and rollback establish exclusive ARE control of this chat?
