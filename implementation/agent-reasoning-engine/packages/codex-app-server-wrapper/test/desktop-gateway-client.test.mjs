import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {createDesktopGatewayJsonlClient} from "../src/desktop-gateway-client.mjs";
import {GATEWAY_ACK_SCHEMA, GATEWAY_CONNECTED_SCHEMA, GATEWAY_DELIVERY_SCHEMA} from "../src/gateway.mjs";

const consumerId = "codex:desktop-jsonl-fixture";
const connectionToken = "fixture-connection-token-32-bytes-minimum";
const resumeToken = "fixture-resume-token";
const backendBinding = {binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"};

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-client-"));
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-client-state-"));
  const socketPath = join(directory, "gateway.sock");
  let socket = null;
  const frames = [];
  const server = createServer((connection) => {
    socket = connection;
    let buffer = "";
    connection.on("data", chunk => {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        frames.push(JSON.parse(buffer.slice(0, index)));
        buffer = buffer.slice(index + 1);
      }
    });
  });
  try {
    await new Promise(resolve => server.listen(socketPath, resolve));
    await run({socketPath, stateDir, frames, serverSocket: () => socket,
      connected: () => ({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
        consumer_id: consumerId, lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
        desktop_backend_binding: backendBinding,
        resumed: false, continuity: {resume_token: resumeToken, resume_token_digest: digestValue(resumeToken),
          acknowledged_through: 0, next_sequence: 1}})});
  } finally {
    socket?.destroy();
    await new Promise(resolve => server.close(resolve));
    rmSync(directory, {recursive: true, force: true});
    rmSync(stateDir, {recursive: true, force: true});
  }
}

async function until(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Desktop client fixture timed out.");
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

test("desktop JSONL client refuses a gateway with a different backend binding before ingress", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    const stopped = assert.rejects(client.done, /gateway.desktop-backend-binding-mismatch/);
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify({...connected(), desktop_backend_binding: {
        ...backendBinding, host_profile: "desktop-wsl-app-tools/v1"}})}\n`);
      await assert.rejects(client.ready, /gateway.desktop-backend-binding-mismatch/);
      await stopped;
      assert.equal(frames.length, 1);
      assert.equal(output.readableLength, 0);
    } finally { client.close(); }
  });
});

test("desktop JSONL client checkpoints a stable request and returns an acknowledged response", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    let clientText = "";
    const methods = [];
    output.on("data", chunk => { clientText += chunk.toString("utf8"); });
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output, trace_method: method => methods.push(method)});
    try {
      await until(() => frames.length === 1);
      assert.equal(frames[0].connection_token, connectionToken);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 5, method: "initialize",
        params: {clientInfo: {name: "desktop-fixture"}}})}\n`);
      await until(() => frames.length === 2);
      assert.deepEqual(methods, ["initialize"]);
      const requestKey = frames[1]._are_gateway.request_key;
      assert.match(requestKey, /^desktop:/);
      assert.equal(client.inspect().pending_intent_count, 1);
      const result = {jsonrpc: "2.0", id: 5, result: {userAgent: "fixture"}};
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: requestKey, message: result})}\n`);
      await until(() => frames.length === 3);
      assert.deepEqual(frames[2], {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1});
      assert.deepEqual(JSON.parse(clientText), result);
      assert.equal(client.inspect().pending_intent_count, 0);
      input.end();
      await client.done;
      assert.throws(() => createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
        consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
        client_input: new PassThrough(), client_output: new PassThrough()}),
      /desktop-gateway.unreconciled-client-state/);
    } finally { client.close(); }
  });
});

test("opt-in desktop receipts permit an owned-thread restart without forwarding the receipt", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const options = {socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken,
      desktop_backend_binding: backendBinding, allow_desktop_consumption_receipts: true};
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    const methods = [];
    output.on("data", chunk => { text += chunk.toString("utf8"); });
    const client = createDesktopGatewayJsonlClient({...options, client_input: input, client_output: output,
      trace_method: method => methods.push(method)});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
        params: {cwd: "/fixture"}})}\n`);
      await until(() => frames.length === 2);
      assert.deepEqual(methods, ["thread/start"]);
      const creation = {jsonrpc: "2.0", id: 1, result: {thread: {id: "owned-thread"}}};
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: frames[1]._are_gateway.request_key, message: creation})}\n`);
      await until(() => frames.length === 3 && text.includes("\n"));
      assert.deepEqual(JSON.parse(text.trim()), creation);
      assert.equal(client.inspect().requires_client_reconciliation, true);
      input.write(`${JSON.stringify({jsonrpc: "2.0", method: "cyberalchemy/desktopDeliveryConsumed",
        params: {throughSequence: 1, messageDigest: digestValue(creation)}})}\n`);
      await until(() => client.inspect().desktop_consumed_through === 1);
      assert.equal(frames.length, 3, "A desktop receipt must never reach the gateway.");
      input.end();
      await client.done;
    } finally { client.close(); }

    const resumedInput = new PassThrough();
    const resumedOutput = new PassThrough();
    let resumedText = "";
    resumedOutput.on("data", chunk => { resumedText += chunk.toString("utf8"); });
    const resumed = createDesktopGatewayJsonlClient({...options,
      client_input: resumedInput, client_output: resumedOutput});
    try {
      await until(() => frames.length === 4);
      const receipt = connected();
      receipt.resumed = true;
      receipt.continuity.acknowledged_through = 1;
      receipt.continuity.next_sequence = 2;
      serverSocket().write(`${JSON.stringify(receipt)}\n`);
      await resumed.ready;
      resumedInput.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/resume",
        params: {threadId: "owned-thread"}})}\n`);
      await until(() => frames.length === 5);
      assert.equal(frames[4].method, "thread/resume");
      const resumeReply = {jsonrpc: "2.0", id: 2, result: {thread: {id: "owned-thread"}}};
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 2, request_key: frames[4]._are_gateway.request_key, message: resumeReply})}\n`);
      await until(() => frames.length === 6 && resumedText.includes("\n"));
      assert.deepEqual(JSON.parse(resumedText.trim()), resumeReply);
      resumedInput.write(`${JSON.stringify({jsonrpc: "2.0", method: "cyberalchemy/desktopDeliveryConsumed",
        params: {throughSequence: 2, messageDigest: digestValue(resumeReply)}})}\n`);
      await until(() => resumed.inspect().desktop_consumed_through === 2);
      resumedInput.end();
      await resumed.done;
    } finally { resumed.close(); }
  });
});

test("desktop consumption receipts fail closed without opt-in or an exact digest", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: new PassThrough()});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", method: "cyberalchemy/desktopDeliveryConsumed",
        params: {throughSequence: 1, messageDigest: "a".repeat(64)}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.consumption-receipt-invalid/);
      assert.equal(frames.length, 1);
    } finally { client.close(); }
  });
});

test("desktop JSONL client pauses ingress when the gateway socket is backpressured and preserves frame order", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      serverSocket().pause();
      const messages = Array.from({length: 128}, (_, sequence) => ({jsonrpc: "2.0", method: "initialized",
        params: {sequence, padding: "x".repeat(64 * 1024)}}));
      for (const message of messages) input.write(`${JSON.stringify(message)}\n`);
      await until(() => input.isPaused(), 10000);
      assert.ok(frames.length < messages.length + 1, "gateway must not have received the entire burst while paused");
      serverSocket().resume();
      await until(() => frames.length === messages.length + 1, 10000);
      assert.deepEqual(frames.slice(1), messages);
      input.end();
      await client.done;
    } finally { client.close(); }
  });
});

test("desktop JSONL client journals overlapping requests and dispatches them in order", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const replies = [];
    let text = "";
    output.on("data", chunk => {
      text += chunk.toString("utf8");
      let index;
      while ((index = text.indexOf("\n")) >= 0) {
        replies.push(JSON.parse(text.slice(0, index)));
        text = text.slice(index + 1);
      }
    });
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "thread/start",
        params: {cwd: "/first"}})}\n`);
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "thread/start",
        params: {cwd: "/second"}})}\n`);
      await until(() => client.inspect().pending_intent_count === 2 && frames.length === 2);
      assert.equal(frames.length, 2);
      const first = frames[1];
      assert.equal(client.inspect().pending_intent_count, 2);
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: first._are_gateway.request_key,
        message: {jsonrpc: "2.0", id: 10, result: {thread: {id: "thread-first"}}}})}\n`);
      await until(() => replies.length === 1 && frames.length === 4);
      assert.equal(replies[0].id, 10);
      assert.deepEqual(frames[2], {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1});
      const second = frames[3];
      assert.notEqual(first._are_gateway.request_key, second._are_gateway.request_key);
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 2, request_key: second._are_gateway.request_key,
        message: {jsonrpc: "2.0", id: 11, result: {thread: {id: "thread-second"}}}})}\n`);
      await until(() => replies.length === 2 && frames.length === 5);
      assert.equal(replies[1].id, 11);
      assert.deepEqual(frames[4], {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 2});
      assert.equal(client.inspect().pending_intent_count, 0);
      assert.equal(client.inspect().owned_thread_count, 2);
      input.end();
      await client.done;
      assert.throws(() => createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
        consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
        client_input: new PassThrough(), client_output: new PassThrough()}),
      /desktop-gateway.unreconciled-client-state/);
    } finally { client.close(); }
  });
});

test("desktop JSONL client stops before forwarding an unbound server-request response", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 8, result: {decision: "accept"}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.server-response-unbound/);
      assert.equal(frames.length, 1);
    } finally { client.close(); }
  });
});

test("desktop JSONL client stops before forwarding an unowned thread resume", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 7, method: "thread/resume",
        params: {threadId: "foreign-thread"}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.thread-unowned/);
      assert.equal(frames.length, 1);
      assert.equal(output.readableLength, 0);
    } finally { client.close(); }
  });
});

test("desktop JSONL client withholds an invalid creation response before desktop output or ACK", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      input.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "thread/start",
        params: {cwd: "/fixture"}})}\n`);
      await until(() => frames.length === 2);
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: frames[1]._are_gateway.request_key,
        message: {jsonrpc: "2.0", id: 9, result: {thread: {id: " "}}}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.thread-creation-invalid/);
      assert.equal(frames.length, 2);
      assert.equal(output.readableLength, 0);
    } finally { client.close(); }
  });
});

test("desktop JSONL client records a scoped server request and response intent before forwarding", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    output.on("data", chunk => { text += chunk.toString("utf8"); });
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      const request = {jsonrpc: "2.0", id: "input-1", method: "item/tool/requestUserInput",
        params: {threadId: "thread-owned", turnId: "turn-owned", itemId: "item-1",
          isBlocking: true, questions: [{header: "Choice", question: "Proceed?", options: []}]}};
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: null, message: request})}\n`);
      await until(() => frames.length === 2 && text.includes("\n"));
      assert.deepEqual(JSON.parse(text), request);
      assert.deepEqual(frames[1], {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1});
      const response = {jsonrpc: "2.0", id: "input-1", result: {answers: {Choice: "Yes"}}};
      input.write(`${JSON.stringify(response)}\n`);
      await until(() => frames.length === 3);
      assert.deepEqual(frames[2], response);
      input.end();
      await client.done;
      const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
      assert.equal(state.server_response_intents.length, 1);
      assert.equal(state.server_response_intents[0].delivery_sequence, 1);
      assert.equal(state.server_response_intents[0].response_digest, digestValue(response));
    } finally { client.close(); }
  });
});

test("desktop JSONL client withholds acknowledgement for an unsupported server request", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    output.on("data", chunk => { text += chunk.toString("utf8"); });
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, request_key: null,
        message: {jsonrpc: "2.0", id: "effect-1", method: "item/tool/call",
          params: {threadId: "thread-owned", turnId: "turn-owned"}}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.server-request-unsupported/);
      assert.equal(frames.length, 1);
      assert.equal(text, "");
    } finally { client.close(); }
  });
});

test("desktop JSONL client rejects unknown notifications without desktop output or ACK", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, message: {jsonrpc: "2.0", method: "unknown/event", params: {}}})}\n`);
      await assert.rejects(client.done, /desktop-gateway.server-notification-unsupported/);
      assert.equal(frames.length, 1);
      assert.equal(output.readableLength, 0);
    } finally { client.close(); }
  });
});

test("desktop JSONL client checkpoints and forwards an unbound gateway parse error", async context => {
  if (process.platform === "win32") return context.skip("Desktop gateway client runs in WSL.");
  await fixture(async ({socketPath, stateDir, frames, serverSocket, connected}) => {
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    output.on("data", chunk => { text += chunk.toString("utf8"); });
    const client = createDesktopGatewayJsonlClient({socket_path: socketPath, state_dir: stateDir,
      consumer_id: consumerId, connection_token: connectionToken, desktop_backend_binding: backendBinding,
      client_input: input, client_output: output});
    try {
      await until(() => frames.length === 1);
      serverSocket().write(`${JSON.stringify(connected())}\n`);
      await client.ready;
      const message = {jsonrpc: "2.0", id: null, error: {code: -32700, message: "Parse error"}};
      serverSocket().write(`${JSON.stringify({schema_version: GATEWAY_DELIVERY_SCHEMA,
        sequence: 1, message})}\n`);
      await until(() => frames.length === 2 && text.includes("\n"));
      assert.deepEqual(JSON.parse(text), message);
      assert.deepEqual(frames[1], {schema_version: GATEWAY_ACK_SCHEMA, through_sequence: 1});
      input.end();
      await client.done;
    } finally { client.close(); }
  });
});
