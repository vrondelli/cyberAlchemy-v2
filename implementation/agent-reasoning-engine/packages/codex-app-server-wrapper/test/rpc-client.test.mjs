import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {AppServerRpcError, createAppServerRpcClient} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";

function fakeTransport() {
  const input = new PassThrough();
  const output = new PassThrough();
  const failure = new EventEmitter();
  return {
    input,
    output,
    failure,
    ready: Promise.resolve({ok: true}),
    close: async () => {},
    inspect: () => ({kind: "fake"}),
  };
}

function jsonLines(stream) {
  let buffer = "";
  const queue = [];
  const waiters = [];
  stream.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const value = JSON.parse(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      const waiter = waiters.shift();
      if (waiter) waiter(value);
      else queue.push(value);
    }
  });
  return {next: () => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolveValue) => waiters.push(resolveValue))};
}

test("shared RPC client correlates requests and completes a structured turn", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, request_timeout_ms: 1000, completion_timeout_ms: 1000});
  const initializing = client.initialize({clientInfo: {name: "test", version: "1"}});
  const initializeRequest = await sent.next();
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: initializeRequest.id, result: {ready: true}})}\n`);
  assert.deepEqual(await initializing, {ready: true});

  const running = client.runTurn({threadId: "thread-1", input: [{type: "text", text: "hello"}]});
  const turnRequest = await sent.next();
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: turnRequest.id, result: {turn: {id: "turn-1"}}})}\n`);
  transport.output.write(`${JSON.stringify({method: "item/agentMessage/delta", params: {turnId: "turn-1", delta: "hello back"}})}\n`);
  transport.output.write(`${JSON.stringify({method: "turn/completed", params: {turn: {id: "turn-1", status: "completed", items: []}}})}\n`);
  const result = await running;
  assert.equal(result.text, "hello back");
  assert.equal(result.completed.turn.status, "completed");
  await client.close();
});

test("shared RPC client exposes the transport handshake receipt", async () => {
  const transport = fakeTransport();
  transport.ready = Promise.resolve({ok: true, resumed: true, runtime_epoch_id: "runtime:1"});
  const client = createAppServerRpcClient({transport});
  assert.deepEqual(await client.ready(), {ok: true, resumed: true, runtime_epoch_id: "runtime:1"});
  await client.close();
});

test("shared RPC client sends lifecycle notifications without a request id", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport});
  await client.notify("initialized", {});
  assert.deepEqual(await sent.next(), {jsonrpc: "2.0", method: "initialized", params: {}});
  await client.close();
});

test("shared RPC client reuses an exactly bound reconnect initialization without writing", async () => {
  const params = {clientInfo: {name: "test", version: "1"}, capabilities: {experimentalApi: true}};
  const transport = fakeTransport();
  transport.ready = Promise.resolve({
    ok: true,
    resumed: true,
    initialization: {
      status: "complete",
      binding_digest: digestValue({method: "initialize", params}),
      result: {ready: true, serverInfo: {version: "1"}},
      result_digest: digestValue({ready: true, serverInfo: {version: "1"}}),
    },
  });
  let writes = 0;
  transport.input.on("data", () => { writes += 1; });
  const client = createAppServerRpcClient({transport});
  assert.deepEqual(await client.initialize(params), {ready: true, serverInfo: {version: "1"}});
  assert.equal(writes, 0);
  assert.equal(client.inspect().initialization_reuse_count, 1);
  await client.close();
});

test("shared RPC client rejects reconnect initialization drift without writing", async () => {
  const retained = {clientInfo: {name: "test", version: "1"}};
  const transport = fakeTransport();
  transport.ready = Promise.resolve({
    ok: true,
    resumed: true,
    initialization: {status: "complete", binding_digest: digestValue({method: "initialize", params: retained}), result: {ready: true}, result_digest: digestValue({ready: true})},
  });
  let writes = 0;
  transport.input.on("data", () => { writes += 1; });
  const client = createAppServerRpcClient({transport});
  await assert.rejects(client.initialize({clientInfo: {name: "different", version: "1"}}), (error) => error.code === "rpc.initialize-binding-mismatch");
  assert.equal(writes, 0);
  await client.close();
});

test("shared RPC client rejects a tampered retained initialization result", async () => {
  const params = {clientInfo: {name: "test", version: "1"}};
  const transport = fakeTransport();
  transport.ready = Promise.resolve({
    ok: true,
    resumed: true,
    initialization: {
      status: "complete",
      binding_digest: digestValue({method: "initialize", params}),
      result: {ready: false},
      result_digest: digestValue({ready: true}),
    },
  });
  const client = createAppServerRpcClient({transport});
  await assert.rejects(client.initialize(params), (error) => error.code === "rpc.initialize-result-digest-mismatch");
  await client.close();
});

test("shared RPC client declines approvals by default", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-1", method: "item/commandExecution/requestApproval", params: {command: "false"}})}\n`);
  assert.deepEqual(await sent.next(), {jsonrpc: "2.0", id: "approval-1", result: {decision: "decline"}});
  await client.close();
});

test("shared RPC client rejects pending work on transport failure", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, request_timeout_ms: 1000});
  const pending = client.request("initialize", {});
  await sent.next();
  transport.failure.emit("failure", new AppServerRpcError("rpc.transport-exited", "provider exited"));
  await assert.rejects(pending, /provider exited/);
  assert.equal(client.inspect().pending_requests, 0);
});

test("shared RPC client observes a transport failure retained before attachment", async () => {
  const transport = fakeTransport();
  const retained = new AppServerRpcError("rpc.transport-exited", "provider exited before attachment");
  transport.get_failure = () => retained;
  const client = createAppServerRpcClient({transport});
  await assert.rejects(client.initialize({}), /provider exited before attachment/);
  assert.equal(client.inspect().failure, retained.message);
});
