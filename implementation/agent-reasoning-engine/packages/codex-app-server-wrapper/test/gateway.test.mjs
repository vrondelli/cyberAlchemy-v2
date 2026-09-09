import assert from "node:assert/strict";
import {EventEmitter, once} from "node:events";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {createConnection} from "node:net";
import {resolve} from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";

import {
  ACKNOWLEDGED_CONTINUITY_MODE,
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createPersistentGateway,
  deriveGatewayReasoningStateProfile,
  GATEWAY_ACK_SCHEMA,
  GATEWAY_CONNECT_SCHEMA,
  GATEWAY_DELIVERY_SCHEMA,
  resolveBackendCommand,
  runGatewayClientProxy,
} from "../index.mjs";

function fakeChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.kill = () => { child.killed = true; child.emit("exit", 0, "SIGTERM"); };
  return child;
}

function passThroughWrapper() {
  return {
    processClientMessage: async (message) => ({to_server: [message], to_client: []}),
    processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
    prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`, epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
  };
}

function nextJsonLine(stream, timeout = 2000, label = "JSON line") {
  return new Promise((resolveLine, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), timeout);
    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const index = buffer.indexOf("\n");
      if (index < 0) return;
      clearTimeout(timer);
      stream.off("data", onData);
      resolveLine(JSON.parse(buffer.slice(0, index)));
    }
    stream.on("data", onData);
  });
}

function collectJsonLines(stream) {
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
  return {next: (label = "collected JSON line") => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolveValue, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), 2000);
    waiters.push((value) => { clearTimeout(timer); resolveValue(value); });
  })};
}

async function waitFor(predicate, label) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function connectGateway(path, consumerId, lane) {
  const socket = createConnection(path);
  await once(socket, "connect");
  const receipt = nextJsonLine(socket, 2000, `${consumerId} handshake`);
  socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: consumerId, lane})}\n`);
  return {socket, receipt: await receipt};
}

async function connectAcknowledgedGateway(path, consumerId, lane, continuity = {}) {
  const socket = createConnection(path);
  const lines = collectJsonLines(socket);
  await once(socket, "connect");
  socket.write(`${JSON.stringify({
    schema_version: GATEWAY_CONNECT_SCHEMA,
    consumer_id: consumerId,
    lane,
    continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, last_acked_sequence: continuity.last_acked_sequence ?? 0, request_aliases: continuity.request_aliases ?? [], ...(continuity.resume_token ? {resume_token: continuity.resume_token} : {})},
  })}\n`);
  return {socket, lines, receipt: await lines.next(`${consumerId} acknowledged handshake`)};
}

function fixture(options = {}) {
  const directory = mkdtempSync("/tmp/are-gateway-test-");
  const listenPath = resolve(directory, "gateway.sock");
  const children = [];
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    runtime_epoch_id: "are-gateway-runtime:test",
    backend: options.backend ?? {mode: "direct-stdio"},
    max_clients: options.max_clients ?? 4,
    max_buffered_messages_per_client: options.max_buffered_messages_per_client ?? 4,
    reconnect: options.reconnect ?? true,
    detach_timeout_ms: options.detach_timeout_ms,
    idle_timeout_ms: options.idle_timeout_ms,
    max_retained_bytes_per_session: options.max_retained_bytes_per_session,
    max_reasoning_log_bytes_per_session: options.max_reasoning_log_bytes_per_session,
    expiration_tombstone_ttl_ms: options.expiration_tombstone_ttl_ms,
    eviction_retry_ms: options.eviction_retry_ms,
    authorize_client: options.authorize_client,
    wrapper_factory: options.wrapper_factory ?? passThroughWrapper,
    spawn_impl: (command, args) => {
      const child = fakeChild();
      child.command = command;
      child.args = args;
      children.push(child);
      return child;
    },
  });
  return {gateway, listenPath, children};
}

test("backend resolution distinguishes direct stdio from the official daemon proxy", () => {
  assert.deepEqual(resolveBackendCommand({mode: "direct-stdio"}).args, ["app-server", "--listen", "stdio://"]);
  assert.deepEqual(resolveBackendCommand({mode: "daemon-proxy", socket_path: "/tmp/codex.sock"}).args, ["app-server", "proxy", "--sock", "/tmp/codex.sock"]);
  assert.equal(resolveBackendCommand({mode: "websocket", url: "ws://127.0.0.1:4500"}).url, "ws://127.0.0.1:4500");
  assert.throws(() => resolveBackendCommand({mode: "invented"}), /Unsupported/);
});

test("gateway derives collision-resistant durable logs per consumer", () => {
  const loaded = {
    reasoning_state: {ledger_id: "reasoning:gateway", storage_mode: "process-memory", log_path: null},
    gateway: {reasoning_state: {mode: "file-per-consumer", directory: "/tmp/are-gateway-state", single_writer: true}},
  };
  const first = deriveGatewayReasoningStateProfile(loaded, "codex:human/chat");
  const second = deriveGatewayReasoningStateProfile(loaded, "codex:human-chat");
  assert.equal(first.storage_mode, "append-only-file-fsync");
  assert.equal(first.single_writer, true);
  assert.notEqual(first.log_path, second.log_path);
  assert.match(first.log_path, /codex-human-chat-[a-f0-9]{16}\.jsonl$/);
});

test("gateway shutdown closes the wrapper before releasing its session", async () => {
  let closeCalls = 0;
  const directory = mkdtempSync("/tmp/are-gateway-close-");
  const listenPath = resolve(directory, "gateway.sock");
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    wrapper_factory: () => ({...passThroughWrapper(), close: () => { closeCalls += 1; }}),
    spawn_impl: () => fakeChild(),
  });
  await gateway.start();
  const connection = await connectGateway(listenPath, "codex:close", "interaction-bound");
  assert.equal(connection.receipt.ok, true);
  await gateway.close();
  assert.equal(closeCalls, 1);
  connection.socket.destroy();
});

test("gateway preserves one consumer session and buffered output across reconnect", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:plan", "plan-bound");
  assert.equal(first.receipt.ok, true);
  assert.equal(first.receipt.resumed, false);
  assert.equal(children.length, 1);
  const upstream = nextJsonLine(children[0].stdin, 2000, "first upstream request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).method, "initialize");
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.buffered_messages === 1, "detached response buffer");
  const secondSocket = createConnection(listenPath);
  const secondLines = collectJsonLines(secondSocket);
  await once(secondSocket, "connect");
  secondSocket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: "codex:plan", lane: "plan-bound"})}\n`);
  const receipt = await secondLines.next("reconnect handshake");
  assert.equal(receipt.resumed, true);
  const replayed = await secondLines.next("buffered replay");
  assert.equal(replayed.result.ready, true);
  assert.equal(children.length, 1);
  secondSocket.destroy();
});

test("gateway replays an identical completed initialization without forwarding it twice", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:reinitialize", "interaction-bound");
  let upstreamWrites = 0;
  children[0].stdin.on("data", () => { upstreamWrites += 1; });
  const firstResponse = nextJsonLine(first.socket, 2000, "first initialize response");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  await waitFor(() => upstreamWrites === 1, "one upstream initialize");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true, serverInfo: {version: "1"}}})}\n`);
  assert.equal((await firstResponse).result.ready, true);
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:reinitialize", "interaction-bound");
  assert.equal(second.receipt.resumed, true);
  assert.equal(second.receipt.initialization.status, "complete");
  assert.deepEqual(second.receipt.initialization.result, {ready: true, serverInfo: {version: "1"}});
  assert.match(second.receipt.initialization.result_digest, /^[a-f0-9]{64}$/);
  const replay = nextJsonLine(second.socket, 2000, "replayed initialize response");
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  assert.deepEqual(await replay, {jsonrpc: "2.0", id: 2, result: {ready: true, serverInfo: {version: "1"}}});
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(upstreamWrites, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_forward_count, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_replay_count, 1);
  second.socket.destroy();
});

test("gateway blocks initialization drift on a retained session", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:init-drift", "plan-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "initial initialize request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {capabilities: {experimentalApi: true}}})}\n`);
  await forwarded;
  const completed = nextJsonLine(first.socket, 2000, "initial initialize response");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true}})}\n`);
  await completed;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:init-drift", "plan-bound");
  const blocked = nextJsonLine(second.socket, 2000, "initialization mismatch");
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "initialize", params: {capabilities: {experimentalApi: false}}})}\n`);
  const response = await blocked;
  assert.equal(response.id, 2);
  assert.equal(response.error.code, -32092);
  assert.deepEqual(response.error.data.reason_codes, ["gateway.initialize-binding-mismatch"]);
  assert.notEqual(response.error.data.expected_binding_digest, response.error.data.actual_binding_digest);
  second.socket.destroy();
});

test("gateway binds a reconnecting initialize request to the pending upstream response", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:init-pending", "interaction-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "pending initialize request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: "old", method: "initialize", params: {clientInfo: {name: "pending"}}})}\n`);
  await forwarded;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:init-pending", "interaction-bound");
  assert.equal(second.receipt.initialization.status, "pending");
  const lines = collectJsonLines(second.socket);
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: "new", method: "initialize", params: {clientInfo: {name: "pending"}}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.pending_initialization_aliases === 1, "pending initialization alias");
  children[0].stdout.write(`${JSON.stringify({id: "old", result: {ready: true}})}\n`);
  const rebound = await lines.next("rebound initialize response");
  assert.deepEqual(rebound, {jsonrpc: "2.0", id: "new", result: {ready: true}});
  assert.equal(gateway.inspect().sessions[0].initialization_status, "complete");
  assert.equal(gateway.inspect().sessions[0].initialization_forward_count, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_replay_count, 1);
  second.socket.destroy();
});

test("gateway isolates consumers and rejects lane substitution", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const plan = await connectGateway(listenPath, "codex:plan", "plan-bound");
  const human = await connectGateway(listenPath, "codex:human-chat", "interaction-bound");
  assert.equal(plan.receipt.ok, true);
  assert.equal(human.receipt.ok, true);
  assert.equal(children.length, 2);
  plan.socket.destroy();
  await once(plan.socket, "close");
  const mismatch = await connectGateway(listenPath, "codex:plan", "interaction-bound");
  assert.equal(mismatch.receipt.ok, false);
  assert.equal(mismatch.receipt.reason, "gateway.consumer-lane-mismatch");
  human.socket.destroy();
  mismatch.socket.destroy();
});

test("gateway rejects concurrent attachment and unauthorized consumers", async (context) => {
  const {gateway, listenPath} = fixture({authorize_client: ({consumer_id}) => consumer_id === "allowed"});
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "allowed", "plan-bound");
  const duplicate = await connectGateway(listenPath, "allowed", "plan-bound");
  const denied = await connectGateway(listenPath, "denied", "plan-bound");
  assert.equal(first.receipt.ok, true);
  assert.equal(duplicate.receipt.reason, "gateway.consumer-already-attached");
  assert.equal(denied.receipt.reason, "gateway.client-not-authorized");
  first.socket.destroy();
  duplicate.socket.destroy();
  denied.socket.destroy();
});

test("detached buffer overflow closes only the affected session", async (context) => {
  const {gateway, listenPath, children} = fixture({max_buffered_messages_per_client: 1});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.destroy();
  await once(connection.socket, "close");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  children[0].stdout.write(`${JSON.stringify({method: "one"})}\n${JSON.stringify({method: "two"})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(children[0].killed, true);
  assert.equal(gateway.inspect().sessions.length, 0);
});

test("detach expiry checkpoints before eviction and authenticates an explicit session-expired result", async (context) => {
  const calls = [];
  const {gateway, listenPath, children} = fixture({
    detach_timeout_ms: 20,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({
      ...passThroughWrapper(),
      prepareForEviction: ({reason}) => {
        calls.push(`checkpoint:${reason}`);
        return {ok: true, checkpoint_digest: "checkpoint:detach", epoch_digest: "epoch:detach", preparation_digest: "preparation:detach"};
      },
      close: () => calls.push("close"),
    }),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "session expiration tombstone");
  assert.deepEqual(calls, ["checkpoint:detach-timeout", "close"]);
  assert.equal(children[0].killed, true);
  const resumed = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(resumed.receipt.ok, false);
  assert.equal(resumed.receipt.reason, "gateway.session-expired");
  assert.equal(resumed.receipt.expiration.checkpoint_digest, "checkpoint:detach");
  resumed.socket.destroy();
});

test("unsafe eviction retries without closing until the checkpoint becomes eligible", async (context) => {
  let eligible = false;
  let attempts = 0;
  let closes = 0;
  const {gateway, listenPath} = fixture({
    detach_timeout_ms: 15,
    eviction_retry_ms: 10,
    wrapper_factory: () => ({
      ...passThroughWrapper(),
      prepareForEviction: () => {
        attempts += 1;
        return eligible ? {ok: true, checkpoint_digest: "checkpoint:retry", epoch_digest: "epoch:retry", preparation_digest: "preparation:retry"} : {ok: false, reason_codes: ["session.active-turn"]};
      },
      close: () => { closes += 1; },
    }),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.destroy();
  await once(connection.socket, "close");
  await waitFor(() => attempts >= 1, "blocked eviction attempt");
  assert.equal(gateway.inspect().sessions.length, 1);
  assert.equal(closes, 0);
  assert.deepEqual(gateway.inspect().sessions[0].lifecycle.last_eviction_block.reason_codes, ["session.active-turn"]);
  eligible = true;
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "retried safe eviction");
  assert.equal(closes, 1);
});

test("reconnect before detach timeout cancels expiration", async (context) => {
  let checkpoints = 0;
  const {gateway, listenPath} = fixture({
    detach_timeout_ms: 80,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({...passThroughWrapper(), prepareForEviction: () => { checkpoints += 1; return {ok: true}; }}),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await once(first.socket, "close");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  const second = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(second.receipt.ok, true);
  assert.equal(second.receipt.resumed, true);
  await new Promise((resolveWait) => setTimeout(resolveWait, 90));
  assert.equal(gateway.inspect().expired_sessions.length, 0);
  assert.equal(checkpoints, 0);
  second.socket.destroy();
});

test("reasoning-log limit rejects new work, checkpoints, and never truncates the ledger", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-ledger-limit-");
  const logPath = resolve(directory, "reasoning.jsonl");
  const original = "0123456789abcdefghijklmnopqrstuvwxyz\n";
  writeFileSync(logPath, original);
  const {gateway, listenPath} = fixture({
    max_reasoning_log_bytes_per_session: 16,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({...passThroughWrapper(), inspectState: () => ({reasoning_state: {sink: {path: logPath}}})}),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start", params: {}})}\n`);
  const blocked = await connection.lines.next("resource limit delivery");
  assert.equal(blocked.message.error.code, -32095);
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.session-reasoning-log-byte-limit"]);
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "log-limit expiration");
  assert.equal(readFileSync(logPath, "utf8"), original);
  connection.socket.destroy();
});

test("disabled reconnect closes consumer state on disconnect", async (context) => {
  const {gateway, listenPath, children} = fixture({reconnect: false});
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:plan", "plan-bound");
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions.length === 0, "non-reconnectable session close");
  const second = await connectGateway(listenPath, "codex:plan", "plan-bound");
  assert.equal(second.receipt.resumed, false);
  assert.equal(children.length, 2);
  second.socket.destroy();
});

test("upstream exit is visible and closes only its consumer session", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:plan", "plan-bound");
  const errorLine = nextJsonLine(connection.socket, 2000, "upstream exit error");
  children[0].emit("exit", 17, null);
  const error = await errorLine;
  assert.equal(error.error.code, -32090);
  await waitFor(() => gateway.inspect().sessions.length === 0, "failed upstream cleanup");
});

test("stdio client adapter consumes the gateway handshake and forwards only app-server bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const input = new PassThrough();
  const output = new PassThrough();
  const error = new PassThrough();
  const socket = runGatewayClientProxy({socket_path: listenPath, consumer_id: "codex:human-chat", lane: "interaction-bound", client_input: input, client_output: output, client_error: error});
  context.after(() => socket.destroy());
  await once(socket, "connect");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  const upstream = nextJsonLine(children[0].stdin);
  input.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).id, 9);
  const downstream = nextJsonLine(output);
  children[0].stdout.write(`${JSON.stringify({id: 9, result: {ready: true}})}\n`);
  assert.equal((await downstream).result.ready, true);
});

test("programmatic RPC transport consumes the gateway handshake and exposes app-server bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const transport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:human-chat", lane: "interaction-bound"});
  context.after(() => transport.close());
  const receipt = await transport.ready;
  assert.equal(receipt.ok, true);
  assert.equal(receipt.consumer_id, "codex:human-chat");
  const upstream = nextJsonLine(children[0].stdin);
  transport.input.write(`${JSON.stringify({jsonrpc: "2.0", id: 17, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).id, 17);
  const downstream = nextJsonLine(transport.output);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 17, result: {ready: true}})}\n`);
  assert.deepEqual((await downstream).result, {ready: true});
});

test("acknowledged reconnect requires the session resume secret", async (context) => {
  const {gateway, listenPath} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:authenticated", lane: "plan-bound"});
  const firstReceipt = await first.ready;
  assert.match(firstReceipt.continuity.resume_token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(firstReceipt.continuity.resume_token_digest, /^[a-f0-9]{64}$/);
  await first.close();
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "authenticated detach");

  const missing = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:authenticated", lane: "plan-bound", continuity: false});
  await assert.rejects(missing.ready, (error) => error.code === "gateway.resume-authentication-required");
  const wrong = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:authenticated", lane: "plan-bound", resume_token: "not-the-session-secret"});
  await assert.rejects(wrong.ready, (error) => error.code === "gateway.resume-authentication-failed");

  const resumed = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:authenticated", lane: "plan-bound", resume_token: firstReceipt.continuity.resume_token});
  assert.equal((await resumed.ready).resumed, true);
  await resumed.close();
});

test("stable request key adopts an in-flight request without duplicate upstream dispatch", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const firstTransport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:inflight", lane: "interaction-bound"});
  const firstReceipt = await firstTransport.ready;
  const firstClient = createAppServerRpcClient({transport: firstTransport, request_timeout_ms: 2000});
  const abandoned = firstClient.request("turn/start", {threadId: "thread-1", input: []}, {idempotency_key: "turn:stable-1"});
  abandoned.catch(() => {});
  const upstream = await nextJsonLine(children[0].stdin, 2000, "stable upstream request");
  assert.match(String(upstream.id), /^are-gateway:/);
  await firstClient.close();
  await assert.rejects(abandoned, /closed/);
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "in-flight detach");

  const resumedTransport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:inflight", lane: "interaction-bound", resume_token: firstReceipt.continuity.resume_token});
  await resumedTransport.ready;
  const resumedClient = createAppServerRpcClient({transport: resumedTransport, request_timeout_ms: 2000});
  const adopted = resumedClient.request("turn/start", {threadId: "thread-1", input: []}, {idempotency_key: "turn:stable-1"});
  await waitFor(() => gateway.inspect().sessions[0]?.deduplicated_request_count === 1, "stable request adoption");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn-1"}}})}\n`);
  assert.deepEqual(await adopted, {turn: {id: "turn-1"}});
  const state = gateway.inspect().sessions[0];
  assert.equal(state.upstream_request_count, 1);
  assert.equal(state.deduplicated_request_count, 1);
  assert.equal(state.stable_requests[0].status, "complete");
  await resumedClient.close();
});

test("stable request key blocks changed request bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const transport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "codex:binding", lane: "plan-bound"});
  await transport.ready;
  const client = createAppServerRpcClient({transport, request_timeout_ms: 2000});
  const first = client.request("thread/start", {cwd: "/one"}, {idempotency_key: "thread:one"});
  first.catch(() => {});
  await nextJsonLine(children[0].stdin, 2000, "first bound request");
  await assert.rejects(client.request("thread/start", {cwd: "/two"}, {idempotency_key: "thread:one"}), (error) => error.details?.data?.reason_codes?.includes("gateway.request-binding-mismatch") || error.details?.reason_codes?.includes("gateway.request-binding-mismatch"));
  assert.equal(gateway.inspect().sessions[0].upstream_request_count, 1);
  await client.close();
  await assert.rejects(first, /closed/);
});

test("unacknowledged delivery replays once and disappears after acknowledgement", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound");
  children[0].stdout.write(`${JSON.stringify({method: "turn/completed", params: {turn: {id: "turn-1"}}})}\n`);
  const delivery = await first.lines.next("first delivery");
  assert.equal(delivery.schema_version, GATEWAY_DELIVERY_SCHEMA);
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "delivery detach");

  const replay = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound", {resume_token: first.receipt.continuity.resume_token});
  const replayed = await replay.lines.next("replayed delivery");
  assert.equal(replayed.sequence, delivery.sequence);
  assert.deepEqual(replayed.message, delivery.message);
  replay.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: replayed.sequence})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 0, "delivery acknowledgement");
  replay.socket.destroy();
  await once(replay.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "acknowledged detach");
  const final = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound", {resume_token: first.receipt.continuity.resume_token, last_acked_sequence: replayed.sequence});
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(gateway.inspect().sessions[0].unacknowledged_deliveries, 0);
  final.socket.destroy();
});

test("turn completion is continuous both immediately before and after disconnect", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "thread-chaos", turn: {id: "turn-before", status: "completed"}}})}\n`);
  const before = await first.lines.next("completion before disconnect");
  first.socket.destroy();
  await once(first.socket, "close");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "thread-chaos", turn: {id: "turn-after", status: "completed"}}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 2, "two retained completions");
  const second = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(second.receipt.ok, true);
  const replayedBefore = await second.lines.next("replayed completion before disconnect");
  const replayedAfter = await second.lines.next("replayed completion after disconnect");
  assert.equal(replayedBefore.sequence, before.sequence);
  assert.equal(replayedBefore.message.params.turn.id, "turn-before");
  assert.equal(replayedAfter.message.params.turn.id, "turn-after");
  second.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: replayedAfter.sequence})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 0, "completion acknowledgements");
  second.socket.destroy();
});

test("server-request response is forwarded upstream at most once", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:effect", "interaction-bound");
  let upstreamWrites = 0;
  children[0].stdin.on("data", () => { upstreamWrites += 1; });
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-1", method: "item/commandExecution/requestApproval", params: {command: "echo safe"}})}\n`);
  const request = await connection.lines.next("server request delivery");
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: request.sequence})}\n`);
  const response = {jsonrpc: "2.0", id: "approval-1", result: {decision: "decline"}};
  connection.socket.write(`${JSON.stringify(response)}\n${JSON.stringify(response)}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "one server response");
  assert.deepEqual(forwarded, response);
  await waitFor(() => gateway.inspect().sessions[0]?.deduplicated_server_response_count === 1, "duplicate server response suppression");
  assert.equal(upstreamWrites, 1);
  assert.equal(gateway.inspect().sessions[0].forwarded_server_responses, 1);
  connection.socket.destroy();
});

test("resume token fails closed after gateway process-state loss", async () => {
  const firstFixture = fixture();
  await firstFixture.gateway.start();
  const first = await connectAcknowledgedGateway(firstFixture.listenPath, "codex:crash", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await firstFixture.gateway.close();

  let spawns = 0;
  const restarted = createPersistentGateway({
    listen_path: firstFixture.listenPath,
    wrapper_factory: passThroughWrapper,
    spawn_impl: () => { spawns += 1; return fakeChild(); },
  });
  await restarted.start();
  try {
    const rejected = await connectAcknowledgedGateway(firstFixture.listenPath, "codex:crash", "plan-bound", {resume_token: token});
    assert.equal(rejected.receipt.ok, false);
    assert.equal(rejected.receipt.reason, "gateway.resume-session-missing");
    assert.equal(spawns, 0);
    rejected.socket.destroy();
  } finally {
    await restarted.close();
  }
});
