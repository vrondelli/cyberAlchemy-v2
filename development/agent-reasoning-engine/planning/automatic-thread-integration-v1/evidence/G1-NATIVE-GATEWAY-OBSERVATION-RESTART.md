# G1 native gateway observation across restart

Status: bounded construction evidence, 2026-09-27. Authority effect: none.
The current Codex desktop task was not read, interrupted, resumed, or
activated by this test. The TUI is discontinued and was not used.

## Exact test

`native-user-input-canary.mjs --gateway-recovery` ran against the installed
`codex-cli 0.155.0-alpha.16.4` binary with SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
It used a separate temporary `CODEX_HOME`, a fixed loopback Responses provider,
a private gateway session store, and the repository profile's file-per-consumer
Reasoning State. It made zero external model calls. Temporary configuration
and child processes were removed by the canary.

The canary now binds one private observation socket and checks its three
bounded read projections against the same completed disposable backend
thread. Before restart, the adapter was ready, one Reasoning State row had a
completion frontier, and two process-local decision records joined that row
by hashed consumer/thread references. The three observations shared one
gateway runtime epoch; none exposed the raw backend thread ID or promoted
host-task control beyond `unverified`.

After closing and recreating the gateway, the client authenticated a resumed
session, rejoined its owned backend thread, recovered the hosted conversation,
and replayed the same request key without another provider dispatch. The
gateway epoch rotated. The file-backed Reasoning State row and completion
frontier were still visible through the new observation socket. The decision
count was zero after restart: the current decision trace is process-local,
not durable history. The canary treats this as an explicit limitation, not a
claim that no prior decision occurred.

## Claim ceiling

This is a real installed-binary, fixed-provider disposable-host proof of the
gateway-to-observer data path and completed-turn recovery. It is not a
Companion WebView2 read of this real session, an installed application test,
an interrupted-turn recovery proof, complete effect interception, or
exclusive handover of the active desktop task. The UI must continue to label
decisions as current-process observations and must not infer absence of past
decisions from the post-restart zero count.

## Open Questions

- Which durable, scoped and privacy-reviewed decision record should survive
  gateway restart, and what retention rule should the Companion use?
- Can an interrupted backend turn be reconciled and projected after gateway
  restart without unsafe redispatch or a false completion claim?
- What exact desktop-host writer relinquishment and rollback evidence is
  required before this task can be called ARE-managed?
