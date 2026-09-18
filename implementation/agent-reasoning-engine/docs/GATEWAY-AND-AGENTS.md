# Gateway and agent integration

The persistent gateway keeps authenticated agent sessions alive across client
disconnects and selected process restarts. It listens on a Unix socket and
speaks JSON-RPC 2.0 over JSON lines.

## Backend adapter contract

`are.gateway-backend-adapter/v1` requires:

- a non-empty `adapter_id`.
- the exact schema version.
- a `spawn(configuration, dependencies)` function returning a valid process
  transport with stdin, stdout, stderr, lifecycle events, and `kill`.

Codex is the default backend. `createJsonLineProcessBackendAdapter` connects any
process that implements the same transport. Protocol translation remains the
adapter's responsibility.

```js
import {
  createJsonLineProcessBackendAdapter,
  createPersistentGateway,
} from "../packages/codex-app-server-wrapper/index.mjs";

const backendAdapter = createJsonLineProcessBackendAdapter({
  adapter_id: "example-agent/v1",
  command: "/opt/example-agent/bin/server",
  args: ["--json-lines"],
});

const gatewayOptions = {
  listen_path: "/run/user/1000/are/example.sock",
  backend_adapter: backendAdapter,
};

// Add a host-specific wrapper_factory before calling
// createPersistentGateway(gatewayOptions).
```

This excerpt shows the boundary, not a complete runnable host. Read
[`src/backend-adapter.mjs`](../packages/codex-app-server-wrapper/src/backend-adapter.mjs)
and the gateway tests for the exact contract.
The wider package and wire-contract map is in [API and data
contracts](API-AND-DATA-CONTRACTS.md).

## Session continuity

The gateway assigns a runtime epoch, authenticates reconnects with resume
tokens, retains stable request identities, buffers bounded deliveries, and
tracks acknowledgements. Completed requests can replay. Requests with unknown
crash-time outcomes block instead of being dispatched twice.

The reusable gateway session client retains credentials and stable request IDs
across reconnects. The host must persist or protect credentials according to
its own threat model.

## Adding another agent

1. Implement or wrap a JSON-lines process backend.
2. Validate the adapter before starting the gateway.
3. Map host messages to the wrapper's expected request semantics.
4. Use stable request IDs and acknowledge deliveries.
5. Test disconnect, reconnect, duplicate, timeout, and unknown-outcome paths.
6. Keep effect authorization in the host. The adapter must not infer it.

## Current integration boundary

There is no hosted endpoint, browser adapter, MCP server, or deployed
multi-tenant gateway in Candidate 018. Native Codex canaries are controlled
compatibility evidence, not installation.

## Open Questions

- Which non-Codex agent should become the first maintained adapter fixture?
- Should a future network gateway use mutual TLS or remain behind a local host
  bridge?
