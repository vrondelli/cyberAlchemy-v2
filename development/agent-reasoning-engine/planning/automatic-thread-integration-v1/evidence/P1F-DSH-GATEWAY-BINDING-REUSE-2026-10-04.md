# P1f — DSH reuse boundary for the ARE gateway binding journal

Status: **candidate cross-adapter conformance evidence**, 2026-10-04.
Authority effect: none. Route: `CA2-ROUTE-IMPLEMENT`. This test neither
activates DSH Web nor selects an upstream hook, private patch, or restricted
profile.

## Bounded task and context

The task-session unit was to determine which existing ARE gateway admission
primitive DSH can reuse without creating a second owner journal. The selected
context was the [P1b binding journal](P1B-GATEWAY-BINDING-JOURNAL-2026-10-04.md),
[P1c Codex admission](P1C-OPT-IN-CODEX-BINDING-ADMISSION-2026-10-04.md),
[P3b receipt join](P3B-GATEWAY-RECEIPT-JOIN-2026-10-04.md), the
[D0b DSH contract](../D0B-DSH-SUPPORTED-ADMISSION-CONTRACT-2026-10-04.md),
and the exact `conversation-binding-contract.mjs`, `gateway-session-store.mjs`,
`gateway.mjs`, and DSH adapter ID. The write scope was one conformance test
and this candidate evidence/DAG update. No Host configuration, dependency,
model, website, or live session was changed.

## Result and boundary

The existing file-backed gateway session store and conversation-binding
contract are already adapter-keyed. The DSH headless adapter ID can use the
same durable `thread-bound` and `conversation-binding-event` writer, active
binding check, compaction, and reopen path. A fixture second-writer assertion
or wrong backend ID is rejected without another binding event. This is a
reusable **state primitive**, not proof of an authenticated DSH Web principal.

The current `conversation_binding_gate` in `gateway.mjs` explicitly requires
`codex-app-server/v1`; its native creation join, model-entry guard, and P3
receipt also assume Codex `thread/start` / `turn/start` messages and a genuine
Codex wrapper. The DSH headless adapter uses its own synthetic `dsh-thread-*`
history and does not provide DSH Web's native session journal. Therefore the
new test does **not** make DSH Web ingress mediated. A DSH Web adapter must
obtain a real Host-owned session/Agent creation assertion and call the shared
binding journal, then join an ARE decision/receipt to the final native
pre-inbox insertion boundary. Reusing the journal must not create a second
text-replay history or count prepared input as accepted input.

## Verification

- `node --test test/conversation-binding-gateway-store.test.mjs` in the Codex
  wrapper package: 4/4 passed, including the DSH-keyed case.
- Binding contract, gateway-backed binding, and gateway session-store suites:
  47/47 passed.
- DSH adapter package `npm test`: 27/27 passed. These existing tests remain
  headless and disposable-Web probes, not a DSH Web control qualification.
- The test uses a fixture assertion and current **headless** adapter ID.
  DSH Web authenticated Host identity, direct Session-log writers, receipt
  preparation, and insertion/recovery behavior remain untested here.

## Next action and open questions

The next independent construction unit is a DSH Web Host-identity/Agent-session
creation witness and a protocol-neutral binding invocation contract. It can
reuse P1b storage, but cannot lift the Codex-only P1c/P3b dispatch code by
renaming the adapter ID. D0b still needs an owner-selected delivery path for
the supported lower admission seam. P1, P3, D0b, and D1 remain open.

## Source selectors

- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/conversation-binding-contract.mjs`:
  `createGatewayBackedConversationBindingContract`, `authorizeTurn`.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-session-store.mjs`:
  `checkedConversationBindingReplay`, `conversation-binding-event` branch.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs`:
  `conversation_binding_gate` constructor check, `authorizeBoundModelEntry`,
  `bindNativeThreadCreation`.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/model-entry-receipt.mjs`:
  `verifyCodexModelEntryReceipt`.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/conversation-binding-gateway-store.test.mjs`:
  DSH-keyed journal conformance case.
