# C2 hosted explicit requirement seed

## Result

An opted-in hosted `POST /api/turns` request can include an explicit bounded
`requirements` array. The hosted client encodes it inside the existing
`are.request-context-hint/v1` value in `turn/start` parameters. The RPC client
signs those complete parameters with the managed hosted-input key; the gateway
verifies the signature and records the full parameter digest under the stable
request key. The wrapper refuses an unverified, mismatched, duplicate, oversized,
or tracking-disabled seed. The objective lifecycle materializes the verified
list into a request- and objective-bound requirement snapshot before forwarding
to the backend. An absent seed still blocks a new tracked objective; `[]` is an
explicit empty seed, not an inferred absence.

The installed Codex fixture passed two managed hosted turns with tracking
enabled: first-turn `Include sources`, then `do next` after gateway and client
restart. The two durable objective events retain that exact requirement, the
second continuity record binds the first digest, the same backend thread and
objective remain active, and a replayed request key creates no additional
model call. The fixture used two private loopback model responses and no
external model provider.

The hosted client now stores a content-free accepted-turn v2 receipt for seeded
turns, including the complete signed request-binding digest. A same-key,
same-text replay with a different requirement list is rejected before any
backend call; the native restart canary exercises that negative case. Older
unbound receipts remain accepted only for their legacy scope; a supplied seed
cannot be silently attached to one.

The canary also exercises a missing-seed rejection before the first accepted
turn. That exposed a recovery defect: the gateway had counted the durable
preflight denial as a host-dispatched turn, blocking a corrected first turn and
later restart proof. The gateway now records a `pre_dispatch_rejection` only
when the wrapper returns an error with no host-bound action. Its owned-runtime
proof excludes that exact durable class while retaining uncertain and accepted
requests. The marker survives store compaction. The canary passed after this
repair, including the later same-objective rejoin.

The supervised manager now passes the gateway's effective startup posture to
its IPC-owned hosted client as `enabled`, `disabled`, or `unverified`. It clears
any inherited marker first and verifies that the client reports the same
posture before declaring the managed session ready. The authenticated
`/api/state` projection exposes only that bounded posture and its
`managed-gateway-startup` source; a standalone client remains `unverified`.
The browser shows the posture above the requirement form before Send and opens
the form for a verified enabled session. This is a startup-bound UI statement,
not live governance admission or a dispatch-policy change.

## Verification

```sh
node implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/managed-objective-restart-canary.mjs /absolute/path/to/codex --requirement-tracking
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/objective-requirements.test.mjs
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/windows-client-host.test.mjs
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/windows-client-recovery-state.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/pending-turn.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/requirements-entry.test.mjs
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway-session-store.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs
node --test implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/requirement-posture.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/windows-client-host.test.mjs implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/managed-session-cli.test.mjs
```

Observed: native canary `ok:true`, `requirement_tracking:verified-explicit-seed`,
two objective events and two local model calls, with changed-list replay denied;
requirement tests 19/19; hosted-client tests 86/86 before the accepted-receipt
binding addition; recovery, hosted-client, and browser-entry helper tests
111 passed with four platform skips after that addition. The broader gateway,
wrapper, hosted-input, and hosted-client run passed 320/320 before the final
disabled-tracking assertion and accepted-receipt binding addition. After the
pre-dispatch recovery repair, gateway and store tests passed 184/184, and the
native tracked canary passed with two objective events and two local model
calls after the missing-seed negative probe. The selected final regression
suite passed 316 tests with four Windows-only skips and zero failures; the
native untracked restart canary also passed with two local model calls.
After the posture projection, the focused manager, hosted-client, and browser
copy suite passed 96/96. Both native tracked and untracked restart canaries
passed again, asserting the corresponding hosted `/api/state` posture at
startup and after restart.

## Claim boundary

The hosted browser form now has an optional, explicit requirement entry and
confirmation control. Its parser and endpoint behavior are tested, but a
rendered-browser pass was not available on this Linux host: Playwright Chrome
was absent, Firefox lacked `libasound.so.2`, WebKit was absent, and the Linux
Playwright launcher could not find Windows Edge. The Windows-app helper also
rejected this WSL workspace URI before selecting a browser window. The
Companion is read-only and does not show or edit this list. This evidence does
not prove current desktop-task
control, steering or compaction continuity, broader host ingress coverage, or
deployment readiness. TUI is discontinued and out of scope.

## Open Questions

- What distinct status should Companion show when tracking is configured but
  a new objective is waiting for its explicit seed?
