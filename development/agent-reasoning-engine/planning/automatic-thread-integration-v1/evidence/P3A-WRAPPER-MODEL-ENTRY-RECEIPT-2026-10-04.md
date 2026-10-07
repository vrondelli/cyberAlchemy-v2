# P3a: checkpointed Codex model-entry receipt

Status: candidate construction evidence, 2026-10-04. Authority effect: none.
This is a wrapper-side slice of P3, not an admitted or deployed integration.

## Implemented boundary

The existing Codex wrapper preflight already resolves the objective and exact
requirement continuity, selects a route and context envelope, and checkpoints
the semantic turn state before returning a `turn/start` for dispatch. It now
projects a closed, content-free `are.codex-model-entry-receipt/v1` from those
checkpointed values. The receipt binds the exact forwarded JSON-RPC message,
backend-thread reference, request binding, objective resolution and state,
requirement continuity, route, context, semantic state, and Reasoning State
checkpoint by digest. Both direct and wrapper-generated turns use this path.
If an enabled objective path has inconsistent receipt inputs, the wrapper
withholds that turn. With objective resolution disabled, no receipt is emitted.

Sources: `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/model-entry-receipt.mjs`,
`src/wrapper.mjs` in the same package, and its
`test/objective-requirements.test.mjs`.

## Evidence and ceiling

Focused tests cover direct and generated receipts, exact forwarded-message
verification, changed-route/request/binding rejection, content-free projection,
and absence when objective resolution is disabled. The creator also verifies
the exact objective fragment forwarded to Codex against its checkpointed
resolution and continuity digests. After the final cross-check, the focused
objective requirements file passed (21/21), and the wrapper package suite
passed (825 total, 801 passed, 24 skipped, 0 failed). `git diff --check` and
syntax checks for both changed source modules passed.

The receipt is **not an identity credential**. This P3a slice alone did not
consume, verify, or durably join it at the gateway; the subsequent
[P3b candidate](P3B-GATEWAY-RECEIPT-JOIN-2026-10-04.md) adds that opt-in
join. A caller-supplied copy cannot establish Host ownership. P1's
real Host assertion, P2's full conformance matrix, C0's actual stock-desktop
New Chat probe, and DSH Agent admission also remain open. No desktop session,
packaged profile, deployment, or website was changed.

## Open Questions

- Should the gateway persist the verified receipt digest in its existing
  dispatch-intent journal, or add a dedicated model-entry event with replay
  validation?
- How will a real Host-owned creation assertion be bound to the same
  gateway request and backend thread without treating the receipt itself as
  an authentication token?
