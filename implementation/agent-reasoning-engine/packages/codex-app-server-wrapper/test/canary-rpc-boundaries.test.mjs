import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {createAppServerRpcClient} from "../index.mjs";

function silentTransport() {
  return {
    input: new PassThrough(),
    output: new PassThrough(),
    failure: new EventEmitter(),
    ready: Promise.resolve({ok: true}),
    close: async () => {},
    inspect: () => ({kind: "silent-test"}),
  };
}

test("canary RPC requests fail within their configured boundary", async () => {
  const client = createAppServerRpcClient({transport: silentTransport(), request_timeout_ms: 15});
  await assert.rejects(
    client.request("initialize", {}),
    (error) => error.code === "rpc.request-timeout" && error.details?.method === "initialize" && error.details?.timeout_ms === 15,
  );
  assert.equal(client.inspect().pending_requests, 0);
  await client.close();
});

test("canary notification waits fail within their configured boundary", async () => {
  const client = createAppServerRpcClient({transport: silentTransport(), completion_timeout_ms: 15});
  await assert.rejects(
    client.waitForNotification(() => false),
    (error) => error.code === "rpc.notification-timeout" && error.details?.timeout_ms === 15,
  );
  assert.equal(client.inspect().notification_waiters, 0);
  await client.close();
});
