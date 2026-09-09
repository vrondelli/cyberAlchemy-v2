import assert from "node:assert/strict";
import {EventEmitter, once} from "node:events";
import {mkdtempSync, readFileSync} from "node:fs";
import {createConnection} from "node:net";
import {resolve} from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";

import {ACKNOWLEDGED_CONTINUITY_MODE, createFileGatewaySessionStore, createPersistentGateway, GATEWAY_CONNECT_SCHEMA, GATEWAY_REQUEST_META_KEY} from "../index.mjs";

function child() {
  const value = new EventEmitter();
  value.stdin = new PassThrough(); value.stdout = new PassThrough(); value.stderr = new PassThrough();
  value.kill = () => value.emit("exit", 0, "SIGTERM");
  return value;
}

function wrapper() {
  return {processClientMessage: async (message) => ({to_server: [message], to_client: []}), processServerMessage: async (message) => ({to_server: [], to_client: [message]}), prepareForEviction: () => ({ok: true, checkpoint_digest: "checkpoint:test", epoch_digest: "epoch:test", preparation_digest: "preparation:test"})};
}

function lines(stream) {
  let buffer = ""; const queued = []; const waiters = [];
  stream.on("data", (chunk) => { buffer += chunk; let index; while ((index = buffer.indexOf("\n")) >= 0) { const value = JSON.parse(buffer.slice(0, index)); buffer = buffer.slice(index + 1); const waiter = waiters.shift(); if (waiter) waiter(value); else queued.push(value); } });
  return {next: () => queued.length ? Promise.resolve(queued.shift()) : new Promise((resolveValue, reject) => { const timer = setTimeout(() => reject(new Error("gateway test timeout")), 2000); waiters.push((value) => { clearTimeout(timer); resolveValue(value); }); })};
}

async function connect(path, consumerId, token = null) {
  const socket = createConnection(path); const output = lines(socket); await once(socket, "connect");
  socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: consumerId, lane: "plan-bound", continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, last_acked_sequence: 0, request_aliases: [], ...(token ? {resume_token: token} : {})}})}\n`);
  return {socket, output, receipt: await output.next()};
}

function gateway(path, storePath, children) {
  return createPersistentGateway({listen_path: path, session_store_path: storePath, wrapper_factory: wrapper, spawn_impl: () => { const value = child(); children.push(value); return value; }});
}

test("file session store is hash chained, fsynced, and single writer", () => {
  const directory = mkdtempSync("/tmp/are-gateway-store-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:test"});
  store.append({event_kind: "session-started", consumer_id: "codex:test", content: {lane: "plan-bound", resume_token_digest: "digest"}});
  store.append({event_kind: "dispatch-intent", consumer_id: "codex:test", content: {request_key: "turn:1", method: "turn/start", binding_digest: "binding"}});
  assert.throws(() => createFileGatewaySessionStore({path, store_id: "gateway-store:test"}), /writer-lock-held/);
  assert.equal(store.inspect().sessions[0].requests[0].status, "outcome-unknown");
  store.close();
  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:test"});
  assert.equal(recovered.inspect().event_count, 2);
  assert.equal(readFileSync(path, "utf8").trim().split("\n").length, 2);
  recovered.close();
});

test("file session store recovers only unacknowledged sequenced deliveries", () => {
  const directory = mkdtempSync("/tmp/are-gateway-delivery-store-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:deliveries"});
  store.append({event_kind: "session-started", consumer_id: "codex:delivery", content: {lane: "interaction-bound", resume_token_digest: "digest"}});
  for (const sequence of [1, 2]) {
    store.append({event_kind: "delivery-enqueued", consumer_id: "codex:delivery", content: {delivery: {schema_version: "are.codex-gateway-delivery/v1", sequence, message: {jsonrpc: "2.0", method: "item/agentMessage/delta", params: {delta: String(sequence)}}, authority_effect: "none"}}});
  }
  store.append({event_kind: "delivery-acknowledged", consumer_id: "codex:delivery", content: {through_sequence: 1}});
  store.close();

  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:deliveries"});
  const session = recovered.getSession("codex:delivery");
  assert.equal(session.delivery_sequence, 2);
  assert.equal(session.acknowledged_through, 1);
  assert.deepEqual(session.deliveries.map((delivery) => delivery.sequence), [2]);
  recovered.close();
});

test("gateway restart authenticates and replays a durable completed request exactly once", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-restart-"); const socketPath = resolve(directory, "gateway.sock"); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:restart"); const token = connection.receipt.continuity.resume_token;
  const request = {jsonrpc: "2.0", id: 1, method: "turn/start", params: {threadId: "thread-1", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:durable"}};
  connection.socket.write(`${JSON.stringify(request)}\n`);
  const upstream = await lines(firstChildren[0].stdin).next();
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn-1"}}})}\n`);
  assert.equal((await connection.output.next()).message.result.turn.id, "turn-1");
  await first.close(); connection.socket.destroy();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:restart", token);
  assert.equal(resumed.receipt.ok, true);
  resumed.socket.write(`${JSON.stringify({...request, id: 99})}\n`);
  const replay = await resumed.output.next();
  assert.equal(replay.message.id, 99);
  assert.equal(replay.message.result.turn.id, "turn-1");
  assert.equal(secondChildren[0].stdin.readableLength, 0);
  resumed.socket.destroy(); await second.close();
});

test("gateway restart blocks a request whose crash-time outcome is unknown", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-unknown-"); const socketPath = resolve(directory, "gateway.sock"); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:unknown"); const token = connection.receipt.continuity.resume_token;
  const request = {jsonrpc: "2.0", id: 1, method: "turn/start", params: {threadId: "thread-1", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:unknown"}};
  connection.socket.write(`${JSON.stringify(request)}\n`); await lines(firstChildren[0].stdin).next();
  await first.close(); connection.socket.destroy();
  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:unknown", token); resumed.socket.write(`${JSON.stringify({...request, id: 2})}\n`);
  const blocked = await resumed.output.next();
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.dispatch-outcome-unknown"]);
  resumed.socket.destroy(); await second.close();
});

test("gateway restart replays a durable unacknowledged streamed delivery", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-stream-restart-"); const socketPath = resolve(directory, "gateway.sock"); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:stream-restart"); const token = connection.receipt.continuity.resume_token;
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/agentMessage/delta", params: {delta: "durable"}})}\n`);
  const delivered = await connection.output.next();
  assert.equal(delivered.sequence, 1);
  assert.equal(delivered.message.params.delta, "durable");
  connection.socket.destroy(); await first.close();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:stream-restart", token);
  assert.equal(resumed.receipt.ok, true);
  const replayed = await resumed.output.next();
  assert.equal(replayed.sequence, delivered.sequence);
  assert.deepEqual(replayed.message, delivered.message);
  resumed.socket.write(`${JSON.stringify({schema_version: "are.codex-gateway-ack/v1", through_sequence: replayed.sequence})}\n`);
  resumed.socket.destroy(); await second.close();
});

test("gateway restart blocks a response to a server request owned by the old backend", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-tool-restart-"); const socketPath = resolve(directory, "gateway.sock"); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:tool-restart"); const token = connection.receipt.continuity.resume_token;
  const approval = {jsonrpc: "2.0", id: "approval-1", method: "item/commandExecution/requestApproval", params: {command: "echo safe"}};
  firstChildren[0].stdout.write(`${JSON.stringify(approval)}\n`);
  const delivered = await connection.output.next();
  assert.deepEqual(delivered.message, approval);
  connection.socket.destroy(); await first.close();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:tool-restart", token);
  const replayed = await resumed.output.next();
  assert.deepEqual(replayed.message, approval);
  resumed.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: approval.id, result: {decision: "decline"}})}\n`);
  const blocked = await resumed.output.next();
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.server-response-outcome-unknown"]);
  assert.equal(secondChildren[0].stdin.readableLength, 0);
  resumed.socket.destroy(); await second.close();
});
