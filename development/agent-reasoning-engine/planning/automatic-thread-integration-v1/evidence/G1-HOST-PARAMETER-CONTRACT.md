# G1 Codex host parameter contract

Status: bounded candidate implementation, 2026-09-26. No current desktop-task
handover, product approval, or activation is claimed.

The persistent gateway now checks the admitted Codex App Server lifecycle
methods before a wrapper or backend sees them. `thread/start`, `thread/resume`,
`thread/fork`, and `turn/start` require explicit on-request approval and a
read-only sandbox. Their parameter keys are closed: config overrides,
permissions profiles, dynamic tools, developer instructions, alternate
sandboxes, tool outputs, and unknown sticky settings are rejected. Fork also
requires `deferGoalContinuation: true`. A narrow plan-mode collaboration
selection and the ARE request-context hint are admitted with bounded shapes.
The wrapper-local `registerPlan` successor params are checked before
registration, and wrapper-generated turns are checked again before backend
dispatch. Only known ARE-generated context keys are accepted on that latter
path. This policy applies to the exact `codex-app-server/v1` backend adapter;
DSH and other adapter protocols retain their own contracts.

The installed host's generated `AskForApproval` wire type uses `on-request`,
not `onRequest`. The hosted client default and isolated user-input canary now
send the valid wire spelling. The native canary completed one disposable
gateway/wrapper/client turn with a fixed loopback provider, a hosted user-input
prompt and answer, zero external model calls, temporary configuration removed,
and the child reaped. The native prompt-hook gateway canary's historical
`thread/start.config.bypass_hook_trust` request is intentionally rejected by
the new parameter contract; its earlier proof is not current safe-gateway
evidence.

Verification: focused gateway/method-policy suite 55/55; gateway restart and
Evolution suites 22/22; full serial wrapper suite exited successfully (one
platform-specific skip). The installed-host `native-user-input-canary.mjs`
reported `PASS` with two local provider requests. These fixtures do not prove
the desktop task has relinquished its writer, that all host effects are
intercepted, or that direct stdio and older proxy paths share this guard.

## Installed-host negative policy probe (2026-09-27)

The disposable `native-user-input-canary.mjs` now sends two deliberately
writable lifecycle requests before its safe turn: `thread/start` with
`sandbox: "workspace-write"`, and `turn/start` on its owned thread with
`sandboxPolicy: {"type":"workspaceWrite"}`. Both returned JSON-RPC `-32082`
with `host.sandbox-policy-unsafe`. The fixed provider saw zero requests before
the safe turn. The subsequent read-only turn and hosted user-input exchange
still passed with two local provider requests, zero external model calls,
temporary configuration removal, and native-child teardown. The current
desktop task was not contacted. The selected installed binary was
`codex-cli 0.155.0-alpha.16.4`, SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
This proves rejection of these two parameter shapes at this gateway, not
universal host-effect interception or desktop-task control.

## Active-turn parameter closure (2026-09-27)

The admitted Codex `turn/steer` and `turn/interrupt` requests now pass a
closed parameter contract before the wrapper or backend sees them. Steer
requires `threadId`, nonempty `input`, and `expectedTurnId`; interrupt requires
`threadId` and `turnId`. Unknown fields, including turn-level model, sandbox,
and output overrides, are rejected. This matches the documented active-turn
request shapes while leaving the existing owned-thread and active-turn checks
in place. The rejected-shape gateway test demonstrates zero backend writes;
the method-policy test covers admitted and rejected shapes. The full wrapper
suite passed 441 tests, skipped 9, failed 0, and `git diff --check` passed on
the touched code and tests. This is a bounded ingress guard, not a claim of
complete desktop-client ingress or live task handover.

## Initialization notification coverage (2026-09-27)

The Codex gateway now rejects a nonempty
`initialize.params.capabilities.optOutNotificationMethods` before backend
dispatch. The [official App Server documentation](https://learn.chatgpt.com/docs/app-server#notification-opt-out)
describes this capability as an exact-match per-connection suppression of
notifications, including turn and item methods.
ARE cannot depend on completion and lifecycle observation if the client can
silence those events at initialization. Empty or absent opt-out lists retain
the normal hosted-client negotiation. Malformed capability shapes are denied.

The policy and gateway fixtures passed 83/83. The full wrapper suite passed
442, skipped 9, failed 0. The opt-in disposable installed-host canary passed
against `codex-cli 0.155.0-alpha.16.4` (SHA-256
`20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`):
`turn/completed` suppression returned `-32082` with
`host.required-notification-opt-out`, left the backend uninitialized, and the
subsequent ordinary initialization and one hosted user-input turn completed.
The fixed local provider saw two requests, zero external model calls; temporary
configuration was removed and the native child reaped. This proves the selected
gateway guard and recovery to an ordinary disposable turn, not that the current
desktop task is under ARE control or that all host events/effects are covered.

## Open Questions

- The later [owned-thread ingress evidence](G1-OWNED-THREAD-INGRESS.md)
  closes direct unowned scoped reads in the Codex gateway, but complete
  server-event shape coverage and owner-filtered listing remain open.
- Can the desktop client be handed over with an exact frozen watermark,
  complete UI ingress, and a reversible one-writer cutover? G1/O1 remain open.
- Does the live installed host expose further execution-shaping fields or
  behavior under a future version? Startup version binding and catalog
  verification must continue to fail closed on drift.
