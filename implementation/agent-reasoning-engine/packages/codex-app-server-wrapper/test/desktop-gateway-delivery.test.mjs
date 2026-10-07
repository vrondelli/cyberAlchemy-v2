import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {digestValue} from "../src/canonical.mjs";
import {createDesktopGatewayState} from "../src/desktop-gateway-state.mjs";
import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";
import {ACKNOWLEDGED_CONTINUITY_MODE, GATEWAY_ACK_SCHEMA,
  GATEWAY_CONNECTED_SCHEMA, GATEWAY_DELIVERY_SCHEMA} from "../src/gateway.mjs";

const consumerId = "codex:desktop-delivery-fixture";
const backendBinding = {binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"};

async function fakeGateway(count, run, messageForSequence = sequence => ({id: sequence, result: {sequence}})) {
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-delivery-"));
  const socketPath = join(directory, "gateway.sock");
  const acknowledgements = [];
  let clientSocket = null;
  const server = createServer((socket) => {
    clientSocket = socket;
    let buffer = "";
    let connected = false;
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const frame = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (!connected) {
          connected = true;
          assert.equal(frame.consumer_id, consumerId);
          assert.equal(frame.continuity.mode, ACKNOWLEDGED_CONTINUITY_MODE);
          socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA,
            ok: true, consumer_id: consumerId, lane: "interaction-bound",
            backend_adapter_id: "codex-app-server/v1", resumed: false,
            desktop_backend_binding: backendBinding,
            continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, resume_token: "fixture-token",
              resume_token_digest: digestValue("fixture-token"), acknowledged_through: 0, next_sequence: 1}})}\n`);
          for (let sequence = 1; sequence <= count; sequence += 1) {
            socket.write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
            sequence, message: messageForSequence(sequence)})}\n`);
          }
        } else {
          assert.equal(frame.schema_version, GATEWAY_ACK_SCHEMA);
          acknowledgements.push(frame.through_sequence);
        }
      }
    });
  });
  try {
    await new Promise((resolve, reject) => server.listen(socketPath, (error) => error ? reject(error) : resolve()));
    await run({socketPath, acknowledgements});
  } finally {
    clientSocket?.destroy();
    await new Promise((resolve) => server.close(resolve));
    rmSync(directory, {recursive: true, force: true});
  }
}

async function until(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Fixture delivery timed out.");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("desktop delivery handler serializes frames and withholds ACK until confirmed", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop WSL adapter uses a Unix socket.");
  await fakeGateway(2, async ({socketPath, acknowledgements}) => {
    let releaseFirst;
    const first = new Promise((resolve) => { releaseFirst = resolve; });
    const seen = [];
    const transport = connectGatewayRpcTransport({socket_path: socketPath,
      consumer_id: consumerId, lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1",
      delivery_handler: async ({sequence, message}) => {
        seen.push(sequence);
        assert.equal(message.result.sequence, sequence);
        if (sequence === 1) await first;
        return true;
      }});
    try {
      await transport.ready;
      await until(() => seen.length === 1);
      assert.deepEqual(acknowledgements, []);
      releaseFirst();
      await until(() => acknowledgements.length === 2);
      assert.deepEqual(seen, [1, 2]);
      assert.deepEqual(acknowledgements, [1, 2]);
    } finally { releaseFirst(); await transport.close(); }
  });
});

test("rejected desktop delivery fails closed without acknowledging the frame", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop WSL adapter uses a Unix socket.");
  await fakeGateway(1, async ({socketPath, acknowledgements}) => {
    const transport = connectGatewayRpcTransport({socket_path: socketPath,
      consumer_id: consumerId, lane: "interaction-bound", delivery_handler: async () => false});
    const failure = new Promise((resolve) => transport.failure.once("failure", resolve));
    try {
      await transport.ready;
      assert.equal((await failure).code, "gateway.delivery-handler-rejected");
      assert.deepEqual(acknowledgements, []);
    } finally { await transport.close(); }
  });
});

test("desktop gateway persists the resume token and same-packet delivery before ACK", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop WSL adapter uses a Unix socket.");
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-state-"));
  const state = createDesktopGatewayState({state_dir: stateDir,
    consumer_id: consumerId, backend_adapter_id: "codex-app-server/v1",
    desktop_backend_binding: backendBinding});
  try {
    await fakeGateway(1, async ({socketPath, acknowledgements}) => {
      const transport = connectGatewayRpcTransport({socket_path: socketPath,
        consumer_id: consumerId, lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1",
        connection_handler: receipt => { state.bind_gateway(receipt); return true; },
        delivery_handler: delivery => state.record_delivery(delivery)});
      try {
        await transport.ready;
        await until(() => acknowledgements.length === 1);
        assert.deepEqual(acknowledgements, [1]);
        assert.equal(state.inspect().last_acked_sequence, 1);
        assert.equal(state.deliveries()[0].message.params.sequence, 1);
      } finally { await transport.close(); }
    }, sequence => ({method: "thread/status", params: {sequence}}));
  } finally { state.close(); rmSync(stateDir, {recursive: true, force: true}); }
});

test("desktop gateway rejects connection checkpoint failure before any delivery ACK", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop WSL adapter uses a Unix socket.");
  await fakeGateway(1, async ({socketPath, acknowledgements}) => {
    let delivered = false;
    const transport = connectGatewayRpcTransport({socket_path: socketPath,
      consumer_id: consumerId, lane: "interaction-bound",
      connection_handler: () => { throw new Error("fixture checkpoint failure"); },
      delivery_handler: () => { delivered = true; return true; }});
    try {
      await assert.rejects(transport.ready, /gateway.connection-handler-failed/);
      assert.equal(delivered, false);
      assert.deepEqual(acknowledgements, []);
    } finally { await transport.close(); }
  });
});
