# Gateway client continuity

Status: implemented local candidate; verification recorded under `receipts/`. Route: CA2-ROUTE-IMPLEMENT. Authority effect: none.

## Product frontier and plan

Build a reusable in-memory client over the existing authenticated Unix gateway
transport and RPC client. Retain the gateway resume token privately, retain exact
stable request bindings, and reconnect only when the caller explicitly asks.
An uncertain request is retried only by its original key and payload. Gateway
recovery owns whether it can replay a result or must report an unknown outcome.
No reconnect automatically launches a thread or turn.

The client owns the existing hook-event adapter across transport disconnects.
Its host feeds native prompt/tool/Stop callbacks; native terminal notifications
arriving through the gateway feed that same adapter. A missing prompt binding
remains a diagnostic. Transport reconnect is not repository SESSION realization.

Runnable construction: add `src/gateway-session-client.mjs` and integration
tests under the ARE product; test authenticated reconnect, stable replay,
conflicts, isolation, and retained hook bindings against the actual gateway
with a scripted backend fixture. Bind these sources into the router's D65
construction closure, rebuild it, and run the product suite.

## Prototype distinctions and dependencies

Gateway consumer identity, native thread identity, native turn identity, and
stable request key are distinct. The resume token authenticates gateway
reattachment; ARE receipts remain non-authorizing integrity evidence. Neither
transport ACK nor native completion proves the user's goal complete.

Dependencies are the existing gateway/client/RPC protocol and hook-event adapter,
with its existing declared ARE profile and selectors. No new ontology-runtime
selector or mandatory enforcement is introduced. The candidate ontology scaffold
is `ontology.json`; product tests do not grant product approval or activation.

The native app-server lifecycle is documented in the
[official OpenAI documentation](https://learn.chatgpt.com/docs/app-server).
This adapter reconnects to ARE's existing gateway protocol, not directly to the
native WebSocket protocol. Gateway credentials and ACKs have local meanings.

## Client API

Import `createGatewaySessionClient` from the ARE product's
`src/gateway-session-client.mjs`. Supply an absolute gateway `socket_path`, a
unique `consumer_id`, and `lane` (`interaction-bound` or `plan-bound`).

```js
const client = createGatewaySessionClient({socket_path, consumer_id, lane});
await client.connect();
await client.request("initialize-v1", "initialize", {
  clientInfo: {name: "workspace", version: "1"}
});
await client.notify("initialized");
const result = await client.request("read-thread-a", "thread/read", {threadId});
await client.disconnect();
await client.connect();
const replay = await client.request("read-thread-a", "thread/read", {threadId});
await client.close();
```

The host calls `observeHook(payload)` for native callbacks and forwards only its
`stdout` field. `events` emits `notification` and `hook-observation` (terminal ARE
results). Observe callbacks only from the host's trusted callback transport.
`releaseCompleted(threadId, turnId)` frees completed hook state. `inspect()`
contains counts and connection state, never the resume credential or raw prompt.

`request(key, method, params)` retains up to 256 exact request digests (lower via
`max_requests`). Changed key reuse and simultaneous same-key requests fail.
Disconnect rejects pending promises; the caller explicitly retries the original
request after reconnect. No automatic retry, new key, thread creation or turn
submission follows failure. Notifications have no stable request key and are
never automatically replayed by this client. RPC approval handling defaults to
decline unless the host explicitly supplies an approval handler.

`disconnect()` waits for socket closure before reconnect; `close()` permanently
disposes the client, credentials and hook bindings. Concurrent connect calls join
one handshake. Missing gateway state and authentication failures do not create a
replacement session. Process restart loses client credentials and bindings;
application delivery across process loss is not guaranteed by transport ACKs.

Run the integration test without a model or live VPS:

```sh
node --test implementation/agent-reasoning-engine/test/gateway-session-client.test.mjs
```

It uses the actual Unix gateway, RPC and session-store implementations with a
scripted backend. It verifies reconnect, no redispatch, source-bound hook
continuity, cross-consumer isolation, pending work, and restart replay versus
unknown outcomes. The follow-on [native gateway canary](NATIVE-GATEWAY.md) now verifies real native
callback delivery and completion recovery through this client.

## Operational support and deferred residue

| Task | Owner | Affected stage | Causal blocker |
| --- | --- | --- | --- |
| Select VPS and approved transport tunnel | Deployment owner | Remote connection | No remote endpoint selected; does not block local adapter construction. |
| Select compatible native host and hook trust | Host owner | Automatic callback delivery | Required for live installation, not fixture verification. |
| Wire operational callback delivery to this client | Integration owner | Live host | Tested adapter API precedes installation. |
| Persist client credentials and reconcile process loss | Runtime owner | Client restart | Outside this in-memory reconnect stage. |
| MCP adapter | Integration owner | Final stage | Deferred until host integration. |

## Open Questions

- Which Workspace/VPS process will own this client and deliver native callbacks?
- Which approved tunnel exposes the gateway Unix socket to that process?
- What credential store should own client restart recovery?

No deployment, active hook configuration, external model call, or replacement
of this conversation's transport belongs to this construction stage.
