# G1 DSH server-event contract

Status: bounded candidate implementation, 2026-09-26. This does not activate
ARE control of the current desktop task or attest an arbitrary DSH binary.

## Observed gap and change

Before this change, the gateway applied its server method catalog, owned-thread
check, and pending-request response correlation only when the selected adapter
ID was Codex. DSH's client ingress was closed, but DSH backend output could
still deliver an unknown method, an event for another thread, or a response
with no corresponding forwarded request to the client.

The backend adapter contract now accepts an optional `server_method_posture`.
DSH declares exactly the six notification methods emitted by its bundled
app-server shim: `turn/started`, `turn/completed`, `item/started`,
`item/completed`, `item/agentMessage/delta`, and `are/adapterTelemetry`.
Each requires a nonempty, trimmed, at-most-256-byte `params.threadId`; the
gateway verifies that this ID belongs to the current consumer before delivery.
DSH declares no server-initiated requests. Its responses must be correlated to
a forwarded request, and a returned thread ID must match an owned requested
thread except for a new thread-creation response. The existing creation
binding still claims a new thread before returning its ID to the client.
Unknown methods, malformed/unowned events, unsolicited responses, and thread
mismatches stop the affected gateway session. Codex keeps its pinned server
catalog, while generic JSONL adapters without a declared server posture do not
inherit this DSH claim.

## Verification

- The complete gateway fixture passed before the final owned-event/mismatch addition; its three focused DSH event fixtures then passed 3/3, and the final gateway fixture was included in the full serial wrapper run below.
- `node --test implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/server.test.mjs`: 16/16 passed, including the real gateway CLI plus ARE wrapper lifecycle.
- `node --test implementation/agent-reasoning-engine/test/integration-surface.test.mjs`: 4/4 passed.
- From the wrapper package, `node --test --test-concurrency=1 test/*.test.mjs`: 379 passed, 1 platform skip, 0 failed after all changes.

The negative gateway fixtures inject an unowned completion, a completion
without a thread ID, an undeclared method, an unsolicited response, and a
response for another thread. They assert rejection without exposing private
payload values. A separate fixture binds a DSH thread through a creation
response and confirms its owned completion is delivered before testing the
mismatch.

## Claim ceiling and open questions

This is a fail-closed boundary for the selected bundled DSH shim's declared
server methods, not cryptographic backend identity, all event-field semantic
validation, all generic JSONL protocol conformance, or proof that an installed
client is now controlled by ARE. A later adapter protocol conformance task
should decide whether generic process adapters require their own closed server
postures before production use. Exact installed-client task identity and
handover remain separately gated.
