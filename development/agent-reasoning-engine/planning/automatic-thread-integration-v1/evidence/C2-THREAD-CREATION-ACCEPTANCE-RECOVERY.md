# C2 accepted thread-creation recovery

Status: bounded local candidate; installed-host recovery blocked, 2026-09-28. The [work-pack](../INTEGRATION-WORK-PACK.md)
owns C2 status. No current desktop task, installed client, or global host
configuration was changed.

## Recovery boundary

The pinned Codex `thread/start` protocol does not carry a caller-supplied
creation marker. A response-less unknown creation therefore remains
unattributable and blocked. This change handles only the narrower crash window
where the gateway received an exact successful host response but could not
durably return the dispatch outcome to its client.

The gateway checkpoints a request-key/digest-bound creation acceptance and
the raw host thread ID in its private, single-writer session store after it
claims that thread and before wrapper/client delivery. On same-key recovery,
it exposes that ID only to the authenticated owner. A subsequent `thread/read`
must return the same ID with `includeTurns:true` and no turns; the gateway
checkpoints the response digest. Only then can a digest-bound recovery receipt
be confirmed. The hosted client records the ID in its private recovery state
before confirmation and returns a reconstructed ID-only creation result to the
browser. No second `thread/start` is dispatched. Repeated confirmation is
idempotent; a recovered request key cannot be replayed as a host creation.

## Validation

- Local gateway fixtures cover accepted-result persistence before wrapper
  delivery, an undurable dispatch outcome, wrong request binding, nonempty
  host history, tampered receipt, exact confirmation, idempotence, compaction,
  and refusal to redispatch the same key.
- A file-backed session-store fixture reopens the accepted/history/recovered
  chain after compaction and rejects duplicate recovery.
- A hosted HTTP fixture checks private thread recording before gateway
  confirmation and an ID-only recovered result. The existing uncorrelated
  unknown-creation fixture remains quarantined.
- Full wrapper package `npm test` after the pending-creation guard: 497 passed,
  13 skipped, zero failures (510 tests). Syntax checks passed for touched code.
- Installed-host probe through the isolated native gateway, pinned to Codex
  `0.155.0-alpha.16.4` (binary SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`):
  creation and gateway ownership succeeded, but `thread/read` with
  `includeTurns:true` and `thread/turns/list` both returned JSON-RPC `-32601`
  (`list_turns is not supported yet`); `thread/items/list` also returned
  `-32601` (`thread/items/list is not supported yet`). The canary correctly failed; no model
  request occurred and its disposable Codex home was removed.
- A separate fixed-loopback turn probe showed that `thread/read` with
  `includeTurns:false` returns `turns: []` even after two provider requests.
  That field is a summary projection, not proof of empty history. This probe
  passed with its isolated state removed; it did not activate this desktop task.
- The gateway now refuses another client mutation while a durable
  `thread/start` intent is preparing, pending or outcome-unknown, and stops if
  a wrapper attempts a generated host mutation before creation settles. Two
  focused fixtures and the pre-existing unknown-creation restart test pass.
  The accepted-creation fixture also refuses wrapper-local control during
  unknown creation, while leaving read-only recovery available.
  This closes a gateway-local dispatch race; it does
  not prove exclusive access to the host's stored thread from other processes.

## Claim ceiling and open questions

The installed Codex host cannot currently supply the exact empty-history read
required by the accepted-creation recovery contract. The lost-response path
remains locally fixture-tested only and **blocked for this installed host**;
substituting `includeTurns:false` would falsely accept a nonempty thread. An
installed-host recovery implementation needs another exact, tested history
signal or a separately proven exclusive-writer/no-turn causal contract before
confirmation may be enabled. A creation with no durable acceptance remains
unknown because the host provides no correlation marker.
The raw accepted ID is held only in the private gateway session store, not in
an observation projection. Exact desktop-client writer handover, account/ingress
binding and G1/O1 activation remain unproved. TUI is discontinued.

## Exact paginated-read retest — 2026-09-28

The original empty-thread probe called `thread/turns/list` with only
`threadId`. The disposable canary now supplies the same bounded parameters
used by its completed-turn history path: `limit:1`, `itemsView:"summary"`,
and `sortDirection:"desc"`. On a newly created, gateway-owned thread with no
provider request, pinned Codex `0.155.0-alpha.16.4` still returns JSON-RPC
`-32601` (`list_turns is not supported yet`). `thread/read` with
`includeTurns:true` returns the same error; `includeTurns:false` reports
`turns:[]` but has `historyMode:"paginated"`, so it is not an empty-history
proof. The canary intentionally exits nonzero with
`canary.creation-empty-history-unverifiable` and removes its disposable
Codex home.

The same binary and correctly shaped `thread/turns/list` call returns one
turn after a separate disposable hosted turn completes. Thus the method is
available for a populated thread but cannot enumerate a newly empty thread
on this host. The `-32601` response itself is not a contractual empty result;
it could also mean history unavailable. No second creation was dispatched,
no external model was called, and the current desktop task was untouched.
The accepted-creation recovery gate remains closed pending a genuine empty
history signal or an independently proven exclusive-writer/no-turn contract.
