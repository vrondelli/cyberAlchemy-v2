# C2 fresh owned first-turn runtime proof

Status: bounded hosted-path construction, 2026-09-28. This does not hand over
the current desktop task or recover an uncertain thread creation.

## Problem and boundary

The installed Codex `0.155.0-alpha.16.4` can return `list_turns is not
supported yet` for both experimental `thread/turns/list` and
`thread/read` with `includeTurns:true` on a new empty thread. A summary
`thread/read` with `includeTurns:false` reports idle but does not prove empty
history. The [official App Server documentation](https://developers.openai.com/codex/app-server)
describes the paginated turns method as experimental and distinguishes the
summary and turn-inclusive reads. The separate [accepted-creation recovery
evidence](C2-THREAD-CREATION-ACCEPTANCE-RECOVERY.md) preserves the stricter
empty-history requirement after an uncertain creation response.

For a newly created thread in the same live gateway process, the owned-runtime
query can now return `first-turn-ready` only when the exact host creation
acceptance and successful response are durable, the client has not reattached,
the backend remains live, and neither the in-process nor durable session has a
turn-start intent for that thread. The hosted client also requires the host's
summary status to be idle and validates the closed proof shape before it
permits one first send. Once a turn intent exists, after a client reattachment,
or after gateway restart, this process-local proof cannot be recreated from
the stored creation receipt. Subsequent turns continue to require readable
host history or an exact completed ARE frontier.

## Verification and claim ceiling

- Gateway fixture: a durably accepted fresh creation returns the bounded proof;
  reattachment and a first turn intent revoke it. The full wrapper suite
  passed 532 total, 518 passed, 14 skipped, zero failed.
- Hosted-client fixture: unsupported empty-history calls permit a first turn
  only with the closed gateway proof; malformed proof remains blocked.
- Disposable installed-Codex canary with test-only history failure injection:
  one real gateway and host turn reached one loopback model request, completed,
  and used `gateway-fresh-creation`; external model calls: zero. The ordinary
  hosted feedback canary also passed four loopback turns and restart replay.
- A separate disposable two-process probe on pinned Codex
  `0.155.0-alpha.16.4` (SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
  tried `thread/resume` and direct `turn/start` from a second initialized App
  Server process after gateway creation but before its first turn. The host
  rejected both (`no rollout found` and `thread not found`); zero provider
  requests occurred before the gateway's first turn. The gateway then
  completed that turn, and the prior completed-thread writer-lock and
  post-close resume/turn checks passed. This is a version-bound observation,
  not a documented cross-process exclusivity guarantee.

This is a candidate first-turn path, not proof that an unrelated direct host
process can never write the same new thread, that all Codex versions have the
same writer-lock behavior, or that a lost creation response is recoverable.
The current desktop task is not ARE-controlled. The TUI is discontinued.

## Pre-first-message history guard — 2026-09-28

The hosted client previously treated the host's specific “history unavailable
before first user message” error plus an idle `thread/read(includeTurns:false)`
summary as an empty history and idle runtime. That host error alone did not
bind the gateway's durable creation acceptance or exclude a locally known turn.
The runtime and history endpoints now require the gateway's closed
`first-turn-ready` proof for this fallback, and refuse it when the hosted
client has a pending or accepted turn for the thread. An unproved or stale
pre-first-message error returns `windows-client.history-unavailable` (409),
without another `turn/start`.

The hosted-client fixture suite passed 58/58, including a verified first
turn, no-proof refusal, and a contradictory error after an accepted turn. The
full wrapper suite passed 519 with 14 skips (533 total). A separate disposable
installed-Codex `0.155.0-alpha.16.4` loopback canary completed one fresh
first turn through the actual gateway with one private provider request and
zero external model calls. That canary exercised the host's unsupported-history
fallback, not the injected pre-first-message error; the latter has fixture
coverage only. No current desktop task was handed over.

## Open Questions

- Can a supported host contract guarantee the observed fresh-thread
  cross-process rejection across future versions and all host transports?
- What supported host signal can establish an empty history after a lost
  creation response or backend restart, without trusting summary `turns:[]`?
- Can an installed-host canary reproduce a stale pre-first-message error after
  an accepted turn, or should this remain a negative fixture until the host
  exposes a reliable fault-injection seam?
