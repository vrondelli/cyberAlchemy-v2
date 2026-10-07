# G1 host-request turn binding

Status: bounded candidate integration evidence, 2026-09-28. Authority effect:
none. No current desktop-task handover, activation or release is claimed.

## Gap and selected rule

The Codex gateway already checked the top-level owned `threadId` on host
server requests, but an owned-thread approval, user-input or MCP elicitation
could reach the ARE wrapper even when its `turnId` did not match a durable
ARE-accepted turn. The wrapper's effect assessment does not itself establish
that the emitting host turn was accepted by this gateway. A request from a
different, unknown, or already terminal turn could therefore be shown to a
client as though it belonged to an active ARE interaction.

The exact installed `codex-cli 0.155.0-alpha.16.4` generated server-request
schema, bound to binary SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`,
requires `turnId` on five request methods: three assessed approval methods,
`item/tool/requestUserInput`, and unsupported `item/tool/call`. It permits a
nullable `turnId` on `mcpServer/elicitation/request`. `currentTime/read` is
thread-scoped without turn attribution; the remaining four methods have no
owned-thread request path in this gateway. The pinned catalog and live-schema
verifier now check these exact required and optional turn-ID method sets.

For admitted Codex host requests carrying `turnId`, the gateway requires a
bounded ID, its owned thread, and a matching durable `turn-start-accepted` or
active `turn-marker-observed` receipt. A durable terminal observation for the
same turn rejects the request even if earlier acceptance exists. Wrong,
missing, early and terminal requests stop that gateway session before the
wrapper or client sees the request content. A standalone MCP elicitation with
null or absent turn ID is denied upstream as unsupported, without showing a
form; there is no reviewed standalone attribution policy. `item/tool/call`
remains denied earlier by the existing unassessed-effect boundary. The
separate generic and DSH backend contracts are unchanged.

The selected early-request rule is fail-closed rather than buffered. A host
request may await a client response, so queuing it behind a pending
`turn/start` acceptance could deadlock. The native canaries below show ordinary
installed-host ordering for two interaction kinds, not a universal transport
ordering guarantee. A future host version that emits a valid request before
acceptance needs its own reviewed compatibility rule.

## Verification

- Focused gateway, host-policy and catalog-verification suites passed 137/137.
  Fixtures cover unaccepted, early, wrong-turn, malformed and terminal
  requests; accepted approval, user-input and MCP requests; and upstream
  denial of an unattributed standalone MCP form without client delivery.
- A file-backed gateway restart fixture was corrected to create and
  acknowledge a real host-accepted turn before its approval request. It
  still proves that a restarted gateway blocks a response owned by the old
  backend; the session-store suite passed 32/32.
- The full wrapper `npm test` passed 540, failed 0, skipped 14 (554 total).
- Disposable installed-host user-input and MCP elicitation canaries both
  passed on the pinned binary. Each used two fixed local provider requests,
  zero external model calls, an owned accepted turn, authenticated hosted
  answer delivery, and scratch teardown. Neither touched this desktop task.
- The older native approval fixture was repaired for the current closed
  gateway lifecycle policy, without relaxing that policy: decline and
  session-grant modes now use exact discovered hook hashes, read-only sandbox
  and `on-request` approval settings, with no host trust bypass. Both modes
  passed on the pinned installed host with one real approval request through
  the actual wrapper and gateway. The decline prevented command execution;
  the proposed `acceptForSession` grant was rejected. Both used a fixed local
  provider, zero external model calls, no active configuration change and
  scratch teardown. Approved-write mode was not used as proof for this
  read-only gateway profile.
- The default `--gateway-wrapper` native canary was also brought onto that
  same closed lifecycle profile. It passed on the pinned installed host with
  exact disposable hook hashes, read-only sandbox, `on-request` approval,
  zero external model calls and scratch teardown. It observed prompt context
  on the provider wire, one wrapper reasoning frontier, gateway-only terminal
  delivery, and a stable turn replay after client disconnect without a second
  native `turn/start`. Its fixture command nevertheless executed after an
  advisory `PreToolUse` block. The passing canary proves the wrapper path and
  recovery behavior, not universal host-effect enforcement.

## Required-field ingress follow-up

The Codex gateway now checks safety-critical required fields after owned-turn
attribution and before wrapper/client delivery. Assessed approvals need a
bounded `itemId` and nonnegative integer `startedAtMs`; permissions approval
also needs a bounded `cwd` and object-shaped `permissions`. User input needs a
bounded `itemId`, boolean `isBlocking`, and 1–16 questions. MCP elicitation
needs a bounded `serverName`. The gateway rejects a malformed request, does
not forward its private payload, and stops that affected backend session.
The check deliberately does not close the whole `params` object: the pinned
generated MCP request schema does not enumerate the `mode`, `message`, and
`requestedSchema` fields observed in native form requests. The hosted browser
broker still validates their presentation and answer details.

The pinned generated schema was regenerated and verified against the selected
installed binary (`codex-cli 0.155.0-alpha.16.4`). Focused gateway/policy tests
passed 140/140; the complete wrapper suite passed 546, failed 0, skipped 14
(560 total). Disposable installed-host approval-decline, user-input, and MCP
canaries passed through the modified gateway, each with a fixed local provider,
zero external model calls, and no current desktop-task mutation. These checks
do not establish full schema conformance, universal effect interception, or
desktop writer handover.

## Claim ceiling and open questions

This closes a specific candidate Codex gateway causal ingress gap. It does
not prove every native approval shape, full field validation for all server
requests, safe standalone MCP elicitation,
universal effect interception, old-proxy conformance, or exact desktop
writer/input handover. G1 and O1 remain open under the
[session-control contract](../SESSION-CONTROL-CONTRACT.md). TUI is
discontinued and is not part of this work.
