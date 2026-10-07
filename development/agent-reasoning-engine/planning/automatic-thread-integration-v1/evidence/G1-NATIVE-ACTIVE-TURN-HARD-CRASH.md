# G1 installed-host active-turn gateway hard crash

Status: bounded candidate construction evidence, 2026-09-27. The TUI is
discontinued and was not used. This test did not touch or activate the current
desktop task, change host configuration, install software, or call an external
model.

## Exact probe

`native-gateway-hard-crash-recovery.mjs <binary> <exact-version> --active-turn`
used installed `codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`),
a disposable Codex home, private file-backed gateway and Reasoning State,
and a fixed loopback Responses provider. The [native user-input
canary](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs)
completed an initial turn and held a second accepted turn at
`item/tool/requestUserInput`, before answering it. It recorded the exact
owned thread/turn/request key, backend PID and prior completion frontier.

The driver killed the live gateway with `SIGKILL` while that turn was active,
then checked and killed only the orphaned backend whose `/proc` executable
matched the pinned binary. No orderly gateway or hosted-client close handler
ran. A separate process reopened the same authenticated consumer, gateway
session store and Reasoning State with a new installed backend. Before reading
history, the Threads projection was `recovery-unverified` and retained the
prior frontier. Read-only `thread/read(includeTurns:true)` found exactly one
matching host turn with `interrupted` status. The gateway fsynced one exact
`turn-history-verified` observation; the wrapper checkpointed the distinct
`recovery-terminal` state without fabricating a completion frontier or a
current-process Decision record. Host-task control stayed `unverified`.

The fresh client then explicitly resumed only that owned host thread. A new,
distinct user turn completed through a newly started fixed loopback provider.
Exactly one provider request occurred after recovery; its body contained the
distinct new user prompt, not a replay in place of the interrupted request.
The new completion produced a different frontier. Three full active-turn runs
passed on WSL/Linux and removed their temporary
state. The earlier clean interrupted-turn recovery canary and the separate
completed-turn hard-crash canary also passed after these changes.

One 2026-09-28 regression run passed after the native completion witness and
early-event ordering changes. It retained the prior frontier, observed one
exact `interrupted` host-history receipt after restart, completed one distinct
new user turn, and removed its disposable state. No external model or current
desktop task was involved.

## Claim ceiling

This demonstrates one installed-host active-turn crash checkpoint followed by
backend interruption, exact terminal-history reconciliation, and a subsequent
user turn. It does not prove reattachment to a backend that remains alive
after the gateway crash, an unanswered request's survival or replay policy,
every crash point, power-loss durability, native Windows process termination,
complete effect interception, or exclusive handover of this desktop chat.
The prior [completed-turn hard-crash evidence](G1-NATIVE-HARD-CRASH-RECOVERY.md)
covers a different lost-response/automatic-compaction checkpoint.

## Open Questions

- Can a gateway reconnect to a still-running backend turn, or must that
  situation remain visibly unsupported and fail closed?
- What exact recovery applies if the host records `inProgress` or its history
  is unavailable after the gateway dies?
- Which additional checkpoint and power-loss tests are needed before a live
  task handover is eligible, and how will the desktop client relinquish its
  writer and support rollback?
