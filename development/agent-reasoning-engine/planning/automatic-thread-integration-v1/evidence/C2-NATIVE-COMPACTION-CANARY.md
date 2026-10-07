# C2 isolated native compaction canary

Status: passed for one selected PATH CLI, 2026-09-26; automatic-compaction
follow-up passed on 2026-09-27. This is construction
evidence, not activation or a claim that the current desktop task is
ARE-managed. The canary source is
[`test-native-compact-context-hook.mjs`](../../../../../implementation/agent-reasoning-engine/scripts/test-native-compact-context-hook.mjs).

## Exact scope and result

The selected executable was
`/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex`, reporting
`codex-cli 0.155.0-alpha.16.4` with binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
The canary used an isolated temporary `CODEX_HOME`, a temporary ephemeral
thread, and a fixed loopback Responses provider. It changed no active host
configuration and made no external model calls. Its temporary files and child
process were removed on exit.

From the implementation directory, both commands exited zero with `PASS`:

```text
node scripts/test-native-compact-context-hook.mjs /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex
node scripts/test-native-compact-context-hook.mjs /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex --invalid-ledger
```

In the positive mode, `thread/compact/start` produced a completed
`contextCompaction` item. A subsequent turn delivered exactly one native
`SessionStart source:compact` callback for the bound session and cwd. The
callback's latest checkpointed C1 plan digest matched the ledger, and the
returned additional context appeared on the next provider request. In the
negative mode, the exact bound ledger path was unavailable; the callback
returned `continue:false`, and there was no post-compaction provider request.
The host still reported the synthetic turn as `completed`, so the assertion is
suppressed model dispatch, not a particular host turn-status label.

The callback occurred before the **next model request**, not at the moment
the compaction item completed. This matches the
[official hook contract](https://learn.chatgpt.com/docs/hooks) and the
[App Server compaction API](https://learn.chatgpt.com/docs/app-server) used by
the canary. These initial tests used explicit `thread/compact/start`.
Automatic compaction is tested separately below.

Source SHA-256 values for this run:

| Source | SHA-256 |
| --- | --- |
| `src/compact-context-hook.mjs` | `fa458c2de47653621aa908b7ea447fdd13b7c67eddde19bb8d332bbe4ce05445` |
| `bin/are-hook.mjs` | `e69722f52c49101da771a7b4c28963ce2ba410a3d4ad579f1d60fdb0a3ae20cc` |
| `scripts/test-native-compact-context-hook.mjs` | `c05235256603e861b767c31972f1dee613bc0f4b895502c00c684a37690ae8da` |

## Automatic-compaction follow-up (2026-09-27)

The same installed binary passed two further modes of the isolated canary:

```text
node scripts/test-native-compact-context-hook.mjs /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex --automatic
node scripts/test-native-compact-context-hook.mjs /mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex --automatic-invalid-ledger
```

The fixture's private `CODEX_HOME` set `model_context_window = 4096` and
`model_auto_compact_token_limit = 10`; `config/read` confirmed those effective
values. These settings were never applied to the active Codex configuration.
The fixed loopback provider returned synthetic responses, with zero external
model calls. The host emitted one completed `contextCompaction` item and one
native `SessionStart source:compact` callback without an explicit compact RPC.
With a valid bound ledger, the exact checkpointed C1 plan digest was in the
hook output and the returned context appeared on the next provider request:
two requests preceded the first compaction item and three were observed in
total. With an unavailable bound ledger, the hook returned `continue:false`
and the request count stayed at two after compaction, proving suppressed model
dispatch in this fixture. The original explicit positive and negative modes
also passed when rerun individually. A concurrent four-mode run transiently
hit `ENOMEM` before the manual negative mode reached its provider; its
individual rerun passed. No resource-limit claim is inferred from that error.

The source SHA-256 of the extended canary was
`f19887ca62e25bddb99ccd92932c01b0015693536ff640ac4ffcdefb8d2401fd`.
The hook and CLI source hashes and native binary hash remained as in the table
above. This extends the evidence to automatic compaction on this disposable
CLI-host thread, not to the current desktop task.

## Claim ceiling

This verifies one disposable CLI-host path, including automatic compaction,
and the hook's positive and fail-closed behavior. It does not establish that this executable is the
desktop app's bundled host, that this task's session and backend-thread IDs
can be bound privately and exactly, or that ARE has exclusive chat control.
It does not resolve gateway/backend unknown-delivery reconciliation, live
restart or steering coverage, hook trust installation, or O1 handover.

## Open Questions

- Which executable and hook trust boundary actually serve the current desktop
  task, and can its task/session/backend-thread mapping be proven without
  disclosing a transcript?
- Does the selected desktop host deliver the same event for automatic mid-turn
  compaction on the current task, and how should an already-running model turn
  receive the C1 frontier after steering?
- What exact recovery receipt prevents an unknown-delivery turn or duplicate
  desktop client writer from being redispatched at G1?
