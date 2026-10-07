import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import test from "node:test";

import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";
import {GATEWAY_CONNECTED_SCHEMA, GATEWAY_DELIVERY_SCHEMA, GATEWAY_ACK_SCHEMA} from "../src/gateway.mjs";

class ThrottledSocket extends EventEmitter {
  destroyed = false;
  closed = false;
  writes = [];

  write(data) {
    this.writes.push(String(data));
    // The first write is the connection handshake; the first client frame
    // fills the simulated socket. Further frames must wait for drain.
    return this.writes.length !== 2;
  }

  end() {
    this.closed = true;
    this.emit("close");
  }

  destroy() {
    this.destroyed = true;
    this.closed = true;
    this.emit("close");
  }
}

test("gateway transport stops reading input until the socket drains", async () => {
  const socket = new ThrottledSocket();
  const transport = connectGatewayRpcTransport({socket_path: "/unused-test-socket",
    consumer_id: "codex:flow-fixture", lane: "interaction-bound", continuity: false,
    connect_impl: () => socket});
  socket.emit("connect");
  socket.emit("data", Buffer.from(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA,
    ok: true, consumer_id: "codex:flow-fixture", lane: "interaction-bound",
    backend_adapter_id: "codex-app-server/v1"})}\n`));
  await transport.ready;
  transport.input.write("first\n");
  assert.equal(socket.writes.length, 2);
  assert.equal(transport.input.isPaused(), true);
  transport.input.write("second\n");
  assert.equal(socket.writes.length, 2, "backpressure holds the next client frame");
  socket.emit("drain");
  for (let attempt = 0; attempt < 10 && socket.writes.length < 3; attempt++) {
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(socket.writes.length, 3);
  assert.equal(socket.writes[2], "second\n");
  await transport.close();
  assert.equal(transport.input.isPaused(), true, "closed transport cannot resume queued input");
});

test("gateway transport decodes UTF-8 characters split across handshake and delivery chunks", async () => {
  const socket = new ThrottledSocket();
  const consumerId = "codex:café";
  const transport = connectGatewayRpcTransport({socket_path: "/unused-test-socket",
    consumer_id: consumerId, lane: "interaction-bound", connect_impl: () => socket});
  socket.emit("connect");
  const handshake = Buffer.from(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA,
    ok: true, consumer_id: consumerId, lane: "interaction-bound",
    backend_adapter_id: "codex-app-server/v1"})}\n`);
  const accent = handshake.indexOf(Buffer.from("é"));
  socket.emit("data", handshake.subarray(0, accent + 1));
  socket.emit("data", handshake.subarray(accent + 1));
  await transport.ready;

  const delivered = new Promise(resolve => transport.output.once("data", resolve));
  const frame = Buffer.from(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
    sequence: 1, message: {jsonrpc: "2.0", method: "notice", params: {label: "ready 🟢"}}})}\n`);
  const emoji = frame.indexOf(Buffer.from("🟢"));
  socket.emit("data", frame.subarray(0, emoji + 2));
  socket.emit("data", frame.subarray(emoji + 2));
  assert.equal(JSON.parse((await delivered).toString()).params.label, "ready 🟢");
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(socket.writes.at(-1)), {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1});
  await transport.close();
});

test("acknowledged delivery waits for the downstream handler before parsing the next same-chunk frame", async () => {
  class PausableSocket extends ThrottledSocket {
    paused = false;
    pause() { this.paused = true; }
    resume() { this.paused = false; }
  }
  const socket = new PausableSocket();
  const seen = [];
  let releaseFirst;
  const firstHandled = new Promise(resolve => { releaseFirst = resolve; });
  const transport = connectGatewayRpcTransport({socket_path: "/unused-test-socket",
    consumer_id: "codex:ordered-fixture", lane: "interaction-bound", connect_impl: () => socket,
    delivery_handler: async ({sequence}) => {
      seen.push(sequence);
      if (sequence === 1) await firstHandled;
      return true;
    }});
  socket.emit("connect");
  socket.emit("data", Buffer.from(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA,
    ok: true, consumer_id: "codex:ordered-fixture", lane: "interaction-bound",
    backend_adapter_id: "codex-app-server/v1"})}\n`));
  await transport.ready;
  const frame = sequence => JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
    sequence, message: {jsonrpc: "2.0", method: "notice", params: {sequence}}});
  socket.emit("data", Buffer.from(`${frame(1)}\n${frame(2)}\n`));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(seen, [1]);
  assert.equal(socket.paused, true);
  assert.equal(socket.writes.length, 1, "no delivery is acknowledged before the handler confirms it");
  releaseFirst();
  for (let attempt = 0; attempt < 10 && socket.writes.length < 3; attempt++) {
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.deepEqual(seen, [1, 2]);
  assert.deepEqual(socket.writes.slice(1).map(JSON.parse), [
    {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1},
    {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 2},
  ]);
  assert.equal(socket.paused, false);
  await transport.close();
});

test("a stalled downstream delivery has a bounded server input buffer", async () => {
  class PausableSocket extends ThrottledSocket {
    pause() {}
    resume() {}
  }
  const socket = new PausableSocket();
  const transport = connectGatewayRpcTransport({socket_path: "/unused-test-socket",
    consumer_id: "codex:buffer-fixture", lane: "interaction-bound", connect_impl: () => socket,
    delivery_handler: () => new Promise(() => {})});
  socket.emit("connect");
  socket.emit("data", Buffer.from(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA,
    ok: true, consumer_id: "codex:buffer-fixture", lane: "interaction-bound",
    backend_adapter_id: "codex-app-server/v1"})}\n`));
  await transport.ready;
  const failure = new Promise(resolve => transport.failure.once("failure", resolve));
  socket.emit("data", Buffer.from(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
    sequence: 1, message: {jsonrpc: "2.0", method: "notice"}})}\n`));
  socket.emit("data", Buffer.alloc(4 * 1024 * 1024 + 1, 0x78));
  assert.equal((await failure).code, "gateway.delivery-buffer-too-large");
  assert.equal(socket.writes.length, 1, "an oversized pending buffer cannot acknowledge the delivery");
  await transport.close();
});
