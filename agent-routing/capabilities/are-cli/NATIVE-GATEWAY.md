# Native gateway hook delivery

Status: implemented local candidate; native gateway canary passed. Route: CA2-ROUTE-IMPLEMENT. Authority effect: none.

## Product frontier and construction plan

Connect the tested gateway session client to real native prompt/tool/Stop
callbacks through a reusable authenticated loopback bridge. The bridge forwards
only advisory hook stdout; native completion continues through the gateway RPC
stream to the same client's request binding. It never manufactures completion.

Runnable product work: implement the bounded callback bridge, add HTTP boundary
tests, and extend the native canary with a gateway mode. Run three turns over two
native threads using the pinned host and the existing local Responses fixture.
Disconnect the client during the first turn, accept its tool/Stop callbacks,
then reconnect and verify completion and exact stable-request replay without a
second native turn or tool execution. Only the existing fixed `printf` fixture
is in the test effect envelope. No external model is invoked.

Exact construction sources are the bridge, gateway client, native canary and
their tests, CLI entrypoint, and linked router scaffolds. Reuse the existing ARE
request/profile/selector dependencies; no new ontology runtime prerequisite.
The bridge is a transport adapter, the ontology is candidate navigation, and
test receipts are product evidence rather than approval or activation.

## Bridge API and verification

`startHookCallbackBridge({client})` in the ARE product's
`src/hook-callback-bridge.mjs` starts one listener on `127.0.0.1` with an ephemeral
port and random credential. Pass the owning `createGatewaySessionClient` instance.
Its returned `connection` contains a URL and token for the host's native callback
processes; keep it private (the canary uses a temporary mode-0600 file). The
credential is separate from the gateway resume token. `close()` stops the bridge.

Callback processes POST the original native JSON to that URL with
`Content-Type: application/json` and `Authorization: Bearer <token>`. The response
contains `ok`, `stdout`, and bounded `reason_codes`. Print only JSON `stdout` to
Codex; report failed observations on stderr and return nonzero. The bridge
accepts only UserPromptSubmit, PreToolUse and Stop; terminal notifications must
arrive through gateway RPC. Request size is limited to 1 MiB, connections to 32,
and idle requests to ten seconds. It stores no callback payloads.

The existing gateway client emits `hook-observation(result, nativeMessage)` for
terminal observations. The second argument identifies the exact native thread
and turn; the result retains the request binding. This signal remains advisory.

```sh
node --test implementation/agent-reasoning-engine/test/hook-callback-bridge.test.mjs
node implementation/agent-reasoning-engine/bin/are.mjs hook native-gateway-test \
  /absolute/path/to/codex-0.153.0-alpha.5
```

The canary uses the actual gateway, RPC client, native host and callback bridge,
with a pass-through gateway wrapper. ARE route/effect/continuation evaluation is
provided by the hook adapter; this is not a test of the full semantic wrapper.
Three turns across two native threads produce four local provider requests and
exactly one fixed `printf ARE_NATIVE_TOOL_OK`. The gateway client disconnects
before the fixture emits that tool call. Tool and Stop callbacks still reach its
binding. Native completion remains buffered until authenticated reconnect; exact
turn-request replay does not dispatch another turn. No model credentials are read.

The native check exposed and fixed the direct backend launch argument: both
locally inspected Codex 0.114.0 and 0.153.0-alpha.5 advertise `--listen stdio://`;
`--stdio` is not their supported app-server flag. Existing direct backend tests
now bind the explicit supported transport argument.

## Operational work and deferred residue

| Task | Owner | Affected stage | Causal blocker |
| --- | --- | --- | --- |
| Native callback delivery and reconnect canary | Integration owner | Current construction | Runnable locally with disposable host configuration. |
| VPS endpoint and tunnel selection | Deployment owner | Remote rollout | No selected remote endpoint; independent of this canary. |
| Operational binary and hook trust | Host owner | Live installation | Exact tested product precedes separate activation. |
| Credential storage and client process recovery | Runtime owner | Process restart | In-memory client remains explicit. |
| MCP | Integration owner | Final adapter | Still last. |

## Open Questions

- Which Workspace/VPS host will own the tested bridge and gateway client?
- Which approved tunnel and credential store will support remote rollout?
- What task-specific evidence will establish goal completion beyond native turn
  completion?
