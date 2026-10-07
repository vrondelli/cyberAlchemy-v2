# P2a — gateway backend lifecycle conformance

Status: bounded candidate implementation evidence, 2026-10-04. Authority
effect: none. This is the Codex App Server / ARE headless-DSH portion of P2,
not the full DSH Web or ACP protocol matrix.

## Implemented slice

- A closed [`are.gateway-backend-lifecycle/v1` contract](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend-lifecycle-contract.mjs)
  distinguishes native Host threads/history from adapter-owned replay and
  marks stock-client ingress `unverified`. Invalid or contradictory lifecycle
  claims fail adapter validation before process spawn.
- The exact turn classifier treats a `turn/start` `inProgress` response as
  **accepted only** and a matching `turn/completed` notification with a
  terminal status as completion. Mismatched multiplexed frames cannot advance
  that turn. It does not claim the UI consumed the event.
- [Codex adapter](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend-adapter.mjs)
  declares native Host history; [headless DSH adapter](../../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/index.mjs)
  declares adapter replay. Neither declaration says the stock desktop or DSH
  Web composer is routed through ARE.
- DSH's admitted compact method now uses the gateway-governed
  `thread/compact/start` spelling. It is explicitly unsupported by this
  backend; the old `thread/compact` spelling is rejected as ungoverned.

## Verification

| Check | Result |
| --- | --- |
| `node --test` focused Codex adapter/lifecycle and DSH server suites | 25 passed, 0 failed |
| `npm test` in Codex wrapper package | 809 total: 785 passed, 24 platform/fixture skips, 0 failed |
| Source scope | New lifecycle module/test; bounded edits to adapter declarations, export, DSH method posture and its assertion. No installed host launch, dependency install, live service, or client activation. |

The DSH suite was 16/17 before correcting the method spelling/expectation;
its final run is 17/17. The old test expected a backend-unsupported error for
`thread/compact`, but that spelling was already intercepted as ungoverned.
This was a protocol-contract mismatch, not evidence that a native DSH Web
compaction path works.

## Remaining P2 obligations

P2 is **partial**. The DSH Web session-controller method/event/cursor matrix,
ACP negotiation and idle/completion mapping, installed Codex desktop client
event coverage, native approvals, and reconnect/consumption proof remain open.
The classifier is a conformance primitive, not a new dispatch or delivery
receipt. No C1 or D1 first-turn gate is closed by these tests.

## Open Questions

- Which DSH Web native session-controller methods and stream events should be
  mapped into ARE without replacing its journal or browser authentication?
- Which ACP capabilities, if any, will be negotiated for a separately named
  custom client rather than assumed for Web?
- What host-supported client acknowledgement can prove visible consumption
  after a terminal event is written to the Codex desktop pipe?
