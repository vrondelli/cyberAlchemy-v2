import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {AppServerRpcError, createAppServerRpcClient, createApprovalBroker, createElicitationBroker, createUserInputBroker} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";
import {verifyHostedInput} from "../src/hosted-input-attestation.mjs";

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

async function bounded(promise, timeoutMs = 500) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("fixture timed out")), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
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

test("hosted RPC signs only an explicitly marked user-input request", async () => {
  const key = "b".repeat(64);
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, hosted_input_attestation_key: key,
    hosted_input_consumer_id: "codex:human-chat", request_timeout_ms: 1000});
  const params = {threadId: "thread-1", input: [{type: "text", text: "A direct user input"}]};
  const pending = client.request("turn/start", params,
    {idempotency_key: "turn:one", hosted_input: true});
  const request = await sent.next();
  assert.equal(verifyHostedInput({key, signature: request._are_gateway.hosted_input_attestation,
    consumer_id: "codex:human-chat", method: request.method, params: request.params,
    request_key: request._are_gateway.request_key}), true);
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: request.id, result: {turn: {id: "turn-1"}}})}\n`);
  await pending;
  const read = client.request("thread/read", {threadId: "thread-1"});
  const readRequest = await sent.next();
  assert.equal(Object.hasOwn(readRequest, "_are_gateway"), false);
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: readRequest.id, result: {thread: {id: "thread-1"}}})}\n`);
  await read;
  await assert.rejects(client.request("thread/read", {threadId: "thread-1"},
    {hosted_input: true}), /supported request/);
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

test("shared RPC client refuses unhandled host requests instead of leaving them pending", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport});
  for (const method of ["item/tool/requestUserInput", "item/tool/call", "unknown/requestApproval"]) {
    transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: method, method, params: {secret: "private fixture"}})}\n`);
    const response = await sent.next();
    assert.equal(response.id, method);
    assert.equal(response.error.code, -32601);
    assert.deepEqual(response.error.data.reason_codes, ["rpc.server-request-unsupported"]);
    assert.equal(JSON.stringify(response).includes("private fixture"), false);
  }
  await client.close();
});

test("opt-in dynamic effect tool handler preserves host attribution and rejects other tools", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const seen = [];
  const client = createAppServerRpcClient({transport, dynamic_tool_name: "are_effect_request",
    dynamic_tool_handler: async message => {
      seen.push(message.params);
      return {contentItems: [{type: "inputText", text: "ARE_EFFECT_DENIED"}], success: false};
    }});
  const params = {threadId: "thread-owned", turnId: "turn-owned", callId: "call-one",
    namespace: null, tool: "are_effect_request", arguments: {effect_id: "effect-one"}};
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "dynamic-1",
    method: "item/tool/call", params})}\n`);
  assert.deepEqual(await sent.next(), {jsonrpc: "2.0", id: "dynamic-1",
    result: {contentItems: [{type: "inputText", text: "ARE_EFFECT_DENIED"}], success: false}});
  assert.deepEqual(seen, [params]);
  for (const invalid of [{...params, tool: "unrelated"}, {...params, turnId: ""},
    {...params, arguments: []}, {...params, clientApproval: true}]) {
    transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "invalid-dynamic",
      method: "item/tool/call", params: invalid})}\n`);
    assert.deepEqual((await sent.next()).error.data.reason_codes,
      ["rpc.dynamic-tool-request-invalid"]);
  }
  assert.equal(seen.length, 1);
  await client.close();
});

test("dynamic tool handler cannot return a privileged or unbounded host response", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, dynamic_tool_name: "are_effect_request",
    dynamic_tool_handler: async () => ({contentItems: [{type: "inputText", text: "unsafe"}],
      success: true, permissions: {network: true}})});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "dynamic-unsafe",
    method: "item/tool/call", params: {threadId: "thread-owned", turnId: "turn-owned",
      callId: "call-one", namespace: null, tool: "are_effect_request", arguments: {}}})}\n`);
  assert.deepEqual((await sent.next()).error.data.reason_codes,
    ["rpc.dynamic-tool-handler-failed"]);
  await client.close();
});

test("shared RPC client declines MCP elicitation and permissions by default", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "elicitation-1", method: "mcpServer/elicitation/request", params: {mode: "form", message: "private fixture"}})}\n`);
  assert.deepEqual(await sent.next(), {jsonrpc: "2.0", id: "elicitation-1", result: {action: "decline", content: null, _meta: null}});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "permissions-1", method: "item/permissions/requestApproval", params: {permissions: {network: true}}})}\n`);
  assert.deepEqual(await sent.next(), {jsonrpc: "2.0", id: "permissions-1", result: {permissions: {}, scope: "turn"}});
  await client.close();
});

test("hosted MCP form round-trips an accepted response and aborts a timed-out prompt", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const events = [];
  const broker = createElicitationBroker({timeout_ms: 1000, on_change: (event) => events.push(event)});
  const client = createAppServerRpcClient({transport, elicitation_handler: (message, options) => broker.request(message, options)});
  const request = (id) => ({jsonrpc: "2.0", id, method: "mcpServer/elicitation/request", params: {
    threadId: "thread-1", turnId: "turn-1", serverName: "Fixture MCP", mode: "form", message: "Supply a value",
    requestedSchema: {type: "object", properties: {answer: {type: "string", minLength: 1}}, required: ["answer"]},
  }});
  transport.output.write(`${JSON.stringify(request("elicitation-1"))}\n`);
  await bounded(new Promise((resolveValue) => {
    const check = () => broker.snapshot().length ? resolveValue() : setImmediate(check);
    check();
  }));
  assert.equal(broker.answer("elicitation-1", {action: "accept", content: {answer: "private answer"}}).ok, true);
  assert.deepEqual(await bounded(sent.next()), {jsonrpc: "2.0", id: "elicitation-1",
    result: {action: "accept", content: {answer: "private answer"}, _meta: null}});
  assert.doesNotMatch(JSON.stringify(events), /private answer/);
  await client.close();
  broker.close();

  const slowTransport = fakeTransport();
  const slowSent = jsonLines(slowTransport.input);
  const slowBroker = createElicitationBroker({timeout_ms: 1000});
  const slowClient = createAppServerRpcClient({transport: slowTransport, server_request_timeout_ms: 15,
    elicitation_handler: (message, options) => slowBroker.request(message, options)});
  slowTransport.output.write(`${JSON.stringify(request("elicitation-slow"))}\n`);
  assert.equal((await bounded(slowSent.next())).error.code, -32098);
  assert.deepEqual(slowBroker.snapshot(), []);
  assert.equal(slowBroker.answer("elicitation-slow", {action: "accept", content: {answer: "late"}}).ok, false);
  await slowClient.close();
  slowBroker.close();
});

test("shared RPC client answers scoped current-time reads in installed-host wire shape", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport});
  const before = Math.floor(Date.now() / 1000);
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "time-1", method: "currentTime/read", params: {threadId: "owned-thread"}})}\n`);
  const response = await sent.next();
  const after = Math.floor(Date.now() / 1000);
  assert.equal(response.jsonrpc, "2.0");
  assert.equal(response.id, "time-1");
  assert.deepEqual(Object.keys(response.result), ["currentTimeAt"]);
  assert.ok(Number.isSafeInteger(response.result.currentTimeAt));
  assert.ok(response.result.currentTimeAt >= before && response.result.currentTimeAt <= after);
  for (const threadId of [undefined, "", " padded ", "a".repeat(257)]) {
    transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "invalid-time", method: "currentTime/read", params: {threadId}})}\n`);
    const invalid = await sent.next();
    assert.equal(invalid.error.code, -32602);
    assert.deepEqual(invalid.error.data.reason_codes, ["rpc.current-time-thread-id-required"]);
    if (threadId) assert.equal(JSON.stringify(invalid).includes(threadId), false);
  }
  await client.close();
});

test("shared RPC client contains approval handler faults and does not approve", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, approval_handler: () => { throw new Error("private fixture"); }});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-2", method: "item/commandExecution/requestApproval", params: {command: "false"}})}\n`);
  const response = await sent.next();
  assert.equal(response.error.code, -32603);
  assert.deepEqual(response.error.data.reason_codes, ["rpc.approval-handler-failed"]);
  assert.equal(JSON.stringify(response).includes("private fixture"), false);
  await client.close();
});

test("server approval handler can await a response on the same RPC connection", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  let client;
  client = createAppServerRpcClient({transport, request_timeout_ms: 500, server_request_timeout_ms: 500,
    approval_handler: async () => {
      const observed = await client.request("thread/read", {threadId: "fixture-thread"});
      assert.equal(observed.safe, true);
      return {decision: "decline"};
    },
  });
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-nested", method: "item/commandExecution/requestApproval", params: {command: "private fixture"}})}\n`);
  const read = await bounded(sent.next());
  assert.equal(read.method, "thread/read");
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: read.id, result: {safe: true}})}\n`);
  assert.deepEqual(await bounded(sent.next()), {jsonrpc: "2.0", id: "approval-nested", result: {decision: "decline"}});
  await client.close();
});

test("server request timeout responds once and discards a late approval", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  let resolveApproval;
  let approvalSignal;
  let writes = 0;
  transport.input.on("data", (chunk) => { writes += chunk.toString("utf8").split("\n").filter(Boolean).length; });
  const client = createAppServerRpcClient({transport, server_request_timeout_ms: 15,
    approval_handler: (_message, {signal}) => {
      approvalSignal = signal;
      return new Promise((resolveValue) => { resolveApproval = resolveValue; });
    },
  });
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-slow", method: "item/commandExecution/requestApproval", params: {command: "private fixture"}})}\n`);
  const timedOut = await bounded(sent.next());
  assert.equal(timedOut.error.code, -32098);
  assert.deepEqual(timedOut.error.data.reason_codes, ["rpc.server-request-timeout"]);
  assert.equal(client.inspect().pending_server_requests, 0);
  assert.equal(approvalSignal.aborted, true);
  assert.equal(client.inspect().active_server_handlers, 1, "a timed-out unresolved handler still consumes capacity");
  resolveApproval({decision: "accept"});
  await new Promise((resolveValue) => setTimeout(resolveValue, 20));
  assert.equal(writes, 1, "a late approval must not be sent after the timeout");
  assert.equal(client.inspect().active_server_handlers, 0);
  await client.close();
});

test("server request capacity is bounded without waiting for a blocked handler", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, max_pending_server_requests: 1,
    approval_handler: () => new Promise(() => {}),
  });
  const request = (id) => `${JSON.stringify({jsonrpc: "2.0", id, method: "item/commandExecution/requestApproval", params: {command: "private fixture"}})}\n`;
  transport.output.write(`${request("approval-one")}${request("approval-two")}`);
  const second = await bounded(sent.next());
  assert.equal(second.id, "approval-two");
  assert.equal(second.error.code, -32099);
  assert.deepEqual(second.error.data.reason_codes, ["rpc.server-request-capacity"]);
  assert.equal(client.inspect().pending_server_requests, 1);
  assert.equal(client.inspect().active_server_handlers, 1);
  await client.close();
  assert.equal(client.inspect().pending_server_requests, 0);
});

test("an unresolved timed-out handler holds its capacity until it settles", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  let resolveFirst;
  let calls = 0;
  const client = createAppServerRpcClient({transport, max_pending_server_requests: 1, server_request_timeout_ms: 15,
    approval_handler: () => {
      calls += 1;
      if (calls === 1) return new Promise((resolveValue) => { resolveFirst = resolveValue; });
      return {decision: "decline"};
    },
  });
  const request = (id) => `${JSON.stringify({jsonrpc: "2.0", id, method: "item/commandExecution/requestApproval", params: {command: "private fixture"}})}\n`;
  transport.output.write(request("first"));
  assert.equal((await bounded(sent.next())).error.code, -32098);
  assert.equal(client.inspect().active_server_handlers, 1);
  transport.output.write(request("second"));
  assert.equal((await bounded(sent.next())).error.code, -32099);
  assert.equal(calls, 1);
  resolveFirst({decision: "accept"});
  await new Promise((resolveValue) => setImmediate(resolveValue));
  assert.equal(client.inspect().active_server_handlers, 0);
  transport.output.write(request("third"));
  assert.deepEqual(await bounded(sent.next()), {jsonrpc: "2.0", id: "third", result: {decision: "decline"}});
  assert.equal(calls, 2);
  await client.close();
});

test("RPC timeout aborts the hosted approval broker's pending UI prompt", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const events = [];
  const broker = createApprovalBroker({timeout_ms: 1000, on_change: (event) => events.push(event)});
  const client = createAppServerRpcClient({transport, server_request_timeout_ms: 15,
    approval_handler: (message, options) => broker.request(message, options),
  });
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "hosted-approval", method: "item/fileChange/requestApproval", params: {reason: "fixture"}})}\n`);
  const response = await bounded(sent.next());
  assert.equal(response.error.code, -32098);
  assert.deepEqual(broker.snapshot(), []);
  assert.deepEqual(events.map((event) => event.kind), ["approval-requested", "approval-aborted"]);
  assert.equal(broker.decide("hosted-approval", {decision: "accept"}).ok, false);
  await client.close();
  broker.close();
});

test("hosted user input round-trips the generated response shape without echoing answers", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const events = [];
  const broker = createUserInputBroker({timeout_ms: 1000, on_change: (event) => events.push(event)});
  const client = createAppServerRpcClient({transport, user_input_handler: (message, options) => broker.request(message, options)});
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: 19, method: "item/tool/requestUserInput", params: {
    threadId: "thread-1", turnId: "turn-1", itemId: "item-1", isBlocking: true, autoResolutionMs: null,
    questions: [{id: "password", header: "Secret", question: "Enter a value", isOther: false, isSecret: true, options: null}],
  }})}\n`);
  await bounded(new Promise((resolveValue) => {
    const check = () => broker.snapshot().length ? resolveValue() : setImmediate(check);
    check();
  }));
  assert.equal(broker.answer("19", {answers: {password: {answers: ["private fixture"]}}}).ok, true);
  assert.deepEqual(await bounded(sent.next()), {jsonrpc: "2.0", id: 19, result: {answers: {password: {answers: ["private fixture"]}}}});
  assert.equal(JSON.stringify(events).includes("private fixture"), false);
  assert.deepEqual(broker.snapshot(), []);
  await client.close();
});

test("hosted user input times out and retires its pending prompt", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const broker = createUserInputBroker({timeout_ms: 1000});
  const client = createAppServerRpcClient({transport, server_request_timeout_ms: 15,
    user_input_handler: (message, options) => broker.request(message, options),
  });
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: "prompt-timeout", method: "item/tool/requestUserInput", params: {
    threadId: "thread-1", turnId: "turn-1", itemId: "item-1", questions: [{id: "q", header: "Question", question: "Choose", isOther: false, isSecret: false, options: null}],
  }})}\n`);
  assert.equal((await bounded(sent.next())).error.code, -32098);
  assert.deepEqual(broker.snapshot(), []);
  assert.equal(broker.answer("prompt-timeout", {answers: {q: {answers: ["late"]}}}).ok, false);
  await client.close();
});

test("client RPC correlates numeric ids and rejects a duplicate outstanding id", async () => {
  const transport = fakeTransport();
  const sent = jsonLines(transport.input);
  const client = createAppServerRpcClient({transport, request_timeout_ms: 500});
  const pending = client.request("thread/read", {threadId: "fixture-thread"}, {request_id: 7});
  assert.equal((await bounded(sent.next())).id, 7);
  await assert.rejects(client.request("thread/read", {}, {request_id: 7}), (error) => error.code === "rpc.request-id-collision");
  transport.output.write(`${JSON.stringify({jsonrpc: "2.0", id: 7, result: {id: "fixture-thread"}})}\n`);
  assert.deepEqual(await bounded(pending), {id: "fixture-thread"});
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
