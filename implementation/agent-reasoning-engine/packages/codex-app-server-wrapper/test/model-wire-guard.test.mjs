import assert from "node:assert/strict";
import {createServer} from "node:http";
import test from "node:test";

import {filterModelRequest, startModelWireGuard, validateModelResponse} from "../src/model-wire-guard.mjs";

function sse(item) {
  const response = {id: "resp_fixture", object: "response", status: "completed", output: [item]};
  return Buffer.from([
    {type: "response.created", response: {...response, status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response},
  ].map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""));
}

function message() {
  return {id: "msg_fixture", type: "message", role: "assistant", status: "completed",
    content: [{type: "output_text", text: "done", annotations: []}]};
}

function call(name) {
  return {id: "fc_fixture", type: "function_call", call_id: "call_fixture", name,
    arguments: JSON.stringify({path: "/private/image.png"}), status: "completed"};
}

test("model-wire request removes non-brokered tools and rejects unsupported catalogs", () => {
  const input = Buffer.from(JSON.stringify({model: "fixture", tools: [
    {type: "function", name: "view_image", parameters: {}},
    {type: "function", name: "request_user_input", parameters: {}}]}));
  const result = filterModelRequest(input, ["request_user_input"]);
  assert.deepEqual(result.forwardedToolNames, ["request_user_input"]);
  assert.deepEqual(JSON.parse(result.bytes).tools.map(tool => tool.name), ["request_user_input"]);
  assert.throws(() => filterModelRequest(Buffer.from('{"tools":[{"type":"web_search"}]}')),
    /model-wire.tool-catalog-invalid/);
  assert.throws(() => filterModelRequest(Buffer.from('{"tool_choice":{"type":"function","name":"view_image"}}')),
    /model-wire.request-invalid/);
});

test("model-wire request rejects malformed UTF-8 before rewriting its tool catalog", () => {
  const request = Buffer.from('{"model":"fixture","input":"marker","tools":[]}');
  request[request.indexOf("marker")] = 0xff;
  assert.throws(() => filterModelRequest(request), /model-wire.request-invalid/);
});

test("model-wire response rejects unbrokered calls, incomplete streams, and inconsistent items", () => {
  assert.deepEqual(validateModelResponse(sse(message()), []), {output_item_count: 1, function_call_count: 0});
  assert.throws(() => validateModelResponse(sse(call("view_image")), []), /model-wire.output-item-unsupported/);
  assert.deepEqual(validateModelResponse(sse(call("request_user_input")), ["request_user_input"]),
    {output_item_count: 1, function_call_count: 1});
  assert.throws(() => validateModelResponse(Buffer.from("event: response.completed\ndata: {}\n"), []),
    /model-wire.response-incomplete/);
  const completeStream = sse(message()).toString();
  const lastText = completeStream.lastIndexOf('"text":"done"');
  const mismatched = completeStream.slice(0, lastText)
    + completeStream.slice(lastText).replace('"text":"done"', '"text":"other"');
  assert.throws(() => validateModelResponse(Buffer.from(mismatched), []), /model-wire.output-item-mismatch/);
  const earlyOutput = sse(message()).toString().replace('"output":[]',
    `"output":[${JSON.stringify(call("view_image"))}]`);
  assert.throws(() => validateModelResponse(Buffer.from(earlyOutput), []), /model-wire.early-output-denied/);
  const afterComplete = Buffer.concat([sse(message()), sse(message())]);
  assert.throws(() => validateModelResponse(afterComplete, []), /model-wire.event-after-completion/);
});

test("model-wire text-only response rejects non-text and malformed completed message parts", () => {
  for (const content of [
    [{type: "output_image", image_url: "data:image/png;base64,AAAA"}],
    [{type: "output_audio", data: "AAAA"}],
    [{type: "output_text", text: "done", annotations: {}}],
    [{type: "refusal", refusal: {text: "denied"}}],
    [],
  ]) {
    assert.throws(() => validateModelResponse(sse({...message(), content}), []),
      /model-wire.message-content-unsupported/);
  }
  assert.deepEqual(validateModelResponse(sse({...message(), content: [
    {type: "output_text", text: "first", annotations: []},
    {type: "output_text", text: "second", annotations: []},
  ]}), []), {output_item_count: 1, function_call_count: 0});
});

test("model-wire text-only response rejects non-text early stream parts before forwarding", () => {
  const base = sse(message()).toString();
  const imagePart = {type: "output_image", image_url: "data:image/png;base64,AAAA"};
  const contentPartFrame = part => `event: response.content_part.added\ndata: ${JSON.stringify({
    type: "response.content_part.added", item_id: "msg_fixture", output_index: 0,
    content_index: 0, part})}\n\n`;
  const earlyImage = base.replace("event: response.output_item.done",
    `${contentPartFrame(imagePart)}event: response.output_item.done`);
  assert.throws(() => validateModelResponse(Buffer.from(earlyImage), []),
    /model-wire.message-content-unsupported/);
  const earlyItem = base.replace(/event: response\.output_item\.added\ndata: [^\n]+\n\n/,
    `event: response.output_item.added\ndata: ${JSON.stringify({type: "response.output_item.added",
      output_index: 0, item: {...message(), status: "in_progress", content: [imagePart]}})}\n\n`);
  assert.throws(() => validateModelResponse(Buffer.from(earlyItem), []),
    /model-wire.message-content-unsupported/);
  const malformedDelta = base.replace("event: response.output_item.done",
    `event: response.output_text.delta\ndata: ${JSON.stringify({
      type: "response.output_text.delta", item_id: "msg_fixture", output_index: 0,
      content_index: 0, delta: {image_url: "data:image/png;base64,AAAA"}})}\n\n`
      + "event: response.output_item.done");
  assert.throws(() => validateModelResponse(Buffer.from(malformedDelta), []),
    /model-wire.event-invalid/);
  const textPart = base.replace("event: response.output_item.done",
    `${contentPartFrame({type: "output_text", text: "done", annotations: []})}`
      + "event: response.output_item.done");
  assert.deepEqual(validateModelResponse(Buffer.from(textPart), []),
    {output_item_count: 1, function_call_count: 0});
});

test("model-wire response admits documented text-only refusal frames without admitting a tool call", () => {
  const refused = {id: "msg_refused", type: "message", role: "assistant", status: "completed",
    content: [{type: "refusal", refusal: "I cannot help with that request."}]};
  const frames = [
    {type: "response.refusal.delta", item_id: refused.id, output_index: 0, content_index: 0,
      delta: "I cannot help ", sequence_number: 2},
    {type: "response.refusal.done", item_id: refused.id, output_index: 0, content_index: 0,
      refusal: "I cannot help with that request.", sequence_number: 3},
  ].map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
  const base = sse(refused).toString();
  const response = Buffer.from(base.replace("event: response.output_item.done", `${frames}event: response.output_item.done`));
  assert.deepEqual(validateModelResponse(response, []), {output_item_count: 1, function_call_count: 0});
  const malformed = Buffer.from(response.toString().replace('"delta":"I cannot help "', '"delta":{}'));
  assert.throws(() => validateModelResponse(malformed, []), /model-wire.event-invalid/);
  const toolResponse = Buffer.from(sse(call("view_image")).toString()
    .replace("event: response.output_item.done", `${frames}event: response.output_item.done`));
  assert.throws(() => validateModelResponse(toolResponse, []), /model-wire.output-item-unsupported/);
});

test("model-wire response accepts complete CRLF SSE framing but not a truncated final frame", () => {
  const crlf = sse(message()).toString().replaceAll("\n", "\r\n");
  assert.deepEqual(validateModelResponse(Buffer.from(crlf), []), {output_item_count: 1, function_call_count: 0});
  assert.throws(() => validateModelResponse(Buffer.from(crlf.slice(0, -2)), []),
    /model-wire.response-incomplete/);
});

test("model-wire response rejects malformed UTF-8 even when lossy decoding would match every item", () => {
  const marked = {...message(), content: [{type: "output_text", text: "marker", annotations: []}]};
  const body = sse(marked);
  const needle = Buffer.from('"text":"marker"');
  let offset = 0;
  let changed = 0;
  while ((offset = body.indexOf(needle, offset)) !== -1) {
    body[offset + '"text":"'.length] = 0xff;
    offset += needle.length;
    changed += 1;
  }
  assert.equal(changed, 3, "fixture did not corrupt the added, done, and completed items");
  assert.throws(() => validateModelResponse(body, []), /model-wire.response-invalid/);
});

test("loopback guard buffers a complete response before forwarding and fails closed", async context => {
  let upstreamBody = sse(message());
  let upstreamRequest = null;
  let upstreamTokenHeader = null;
  const clientToken = "a".repeat(64);
  const upstream = createServer(async (request, response) => {
    upstreamTokenHeader = request.headers["x-are-guard-token"] ?? null;
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    upstreamRequest = JSON.parse(Buffer.concat(chunks).toString());
    response.writeHead(200, {"content-type": "text/event-stream"});
    response.end(upstreamBody);
  });
  await new Promise(done => upstream.listen(0, "127.0.0.1", done));
  context.after(() => new Promise(done => upstream.close(done)));
  const guard = await startModelWireGuard({upstreamUrl: `http://127.0.0.1:${upstream.address().port}/v1/responses`,
    allowedToolNames: [], clientToken});
  context.after(() => guard.close());
  const send = token => fetch(`${guard.url}/responses`, {method: "POST", headers: {"content-type": "application/json",
    ...(token ? {"x-are-guard-token": token} : {})},
    body: JSON.stringify({model: "fixture", tools: [{type: "function", name: "view_image", parameters: {}}]})});
  const unauthorized = await send(null);
  assert.equal(unauthorized.status, 403);
  const wrongToken = await send("b".repeat(64));
  assert.equal(wrongToken.status, 403);
  assert.equal(upstreamRequest, null, "guard forwarded an unauthenticated request");
  const malformed = Buffer.from('{"model":"fixture","input":"marker","tools":[]}');
  malformed[malformed.indexOf("marker")] = 0xff;
  const malformedResponse = await fetch(`${guard.url}/responses`, {method: "POST",
    headers: {"content-type": "application/json", "x-are-guard-token": clientToken}, body: malformed});
  assert.equal(malformedResponse.status, 502);
  assert.equal((await malformedResponse.json()).error.code, "model-wire.request-invalid");
  assert.equal(upstreamRequest, null, "guard forwarded malformed UTF-8 upstream");
  const okay = await send(clientToken);
  assert.equal(okay.status, 200);
  assert.equal((await okay.text()).includes("response.completed"), true);
  assert.deepEqual(upstreamRequest.tools, []);
  assert.equal(upstreamTokenHeader, null, "guard forwarded its client token upstream");
  upstreamBody = sse(call("view_image"));
  const denied = await send(clientToken);
  assert.equal(denied.status, 502);
  assert.equal((await denied.text()).includes("input_image"), false);
  upstreamBody = sse({...message(), content: [{type: "output_image", image_url: "data:image/png;base64,AAAA"}]});
  const nonText = await send(clientToken);
  assert.equal(nonText.status, 502);
  assert.equal((await nonText.text()).includes("data:image"), false);
  assert.deepEqual(guard.inspect(), {requests: 6, forwarded: 1, blocked: 5,
    last_reason: "model-wire.message-content-unsupported", listening: true});
});

test("HTTPS OpenAI upstream uses only its own bearer token and forbids redirects", async context => {
  const clientToken = "b".repeat(64);
  const upstreamBearerToken = "fixture-upstream-key";
  let seen = null;
  const guard = await startModelWireGuard({upstreamUrl: "https://api.openai.com/v1/responses",
    clientToken, upstreamBearerToken, fetchImpl: async (url, options) => {
      seen = {url: String(url), redirect: options.redirect, headers: options.headers,
        body: JSON.parse(options.body.toString())};
      return new Response(sse(message()), {status: 200, headers: {"content-type": "text/event-stream"}});
    }});
  context.after(() => guard.close());
  const response = await fetch(`${guard.url}/responses`, {method: "POST",
    headers: {"content-type": "application/json", "x-are-guard-token": clientToken,
      authorization: "Bearer never-forward-client-authorization"},
    body: JSON.stringify({model: "fixture", tools: [{type: "function", name: "view_image", parameters: {}}]})});
  assert.equal(response.status, 200);
  assert.equal(seen.url, "https://api.openai.com/v1/responses");
  assert.equal(seen.redirect, "error");
  assert.deepEqual(seen.headers, {"content-type": "application/json",
    authorization: `Bearer ${upstreamBearerToken}`});
  assert.deepEqual(seen.body.tools, []);
  await assert.rejects(() => startModelWireGuard({upstreamUrl: "https://api.openai.com/v1/responses",
    clientToken}), /model-wire.upstream-auth-invalid/);
  await assert.rejects(() => startModelWireGuard({upstreamUrl: "https://example.com/v1/responses",
    clientToken, upstreamBearerToken}), /model-wire.upstream-invalid/);
});

test("closing the guard cancels an in-flight upstream request without forwarding", {timeout: 5000}, async context => {
  let entered;
  const upstreamEntered = new Promise(done => { entered = done; });
  let aborted;
  const upstreamAborted = new Promise(done => { aborted = done; });
  const clientToken = "c".repeat(64);
  const guard = await startModelWireGuard({upstreamUrl: "http://127.0.0.1:1/v1/responses",
    clientToken, fetchImpl: async (_url, options) => {
      entered();
      return new Promise((_done, reject) => options.signal.addEventListener("abort", () => {
        aborted(options.signal.reason);
        reject(options.signal.reason);
      }, {once: true}));
    }});
  context.after(() => guard.close());
  const pending = fetch(`${guard.url}/responses`, {method: "POST",
    headers: {"content-type": "application/json", "x-are-guard-token": clientToken},
    body: JSON.stringify({model: "fixture", tools: []})});
  await upstreamEntered;
  await guard.close();
  assert.equal((await upstreamAborted).code, "model-wire.guard-closed");
  await assert.rejects(pending);
  assert.equal(await guard.stopped, "model-wire-guard");
  assert.equal(guard.inspect().forwarded, 0);
  assert.equal(guard.inspect().listening, false);
});

test("client disconnect cancels its in-flight upstream request", {timeout: 5000}, async context => {
  let entered;
  const upstreamEntered = new Promise(done => { entered = done; });
  let aborted;
  const upstreamAborted = new Promise(done => { aborted = done; });
  const clientToken = "d".repeat(64);
  const guard = await startModelWireGuard({upstreamUrl: "http://127.0.0.1:1/v1/responses",
    clientToken, fetchImpl: async (_url, options) => {
      entered();
      return new Promise((_done, reject) => options.signal.addEventListener("abort", () => {
        aborted(options.signal.reason);
        reject(options.signal.reason);
      }, {once: true}));
    }});
  context.after(() => guard.close());
  const clientAbort = new AbortController();
  const pending = fetch(`${guard.url}/responses`, {method: "POST",
    headers: {"content-type": "application/json", "x-are-guard-token": clientToken},
    body: JSON.stringify({model: "fixture", tools: []}), signal: clientAbort.signal});
  await upstreamEntered;
  clientAbort.abort();
  await assert.rejects(pending);
  assert.equal((await upstreamAborted).code, "model-wire.client-disconnected");
  assert.equal(guard.inspect().forwarded, 0);
});

test("guard shutdown aborts a real loopback provider stream mid-response", {timeout: 5000}, async context => {
  let entered;
  const upstreamEntered = new Promise(done => { entered = done; });
  let closed;
  const upstreamClosed = new Promise(done => { closed = done; });
  const upstream = createServer(async (request, response) => {
    for await (const _chunk of request) { /* consume the complete filtered request */ }
    response.once("close", closed);
    response.writeHead(200, {"content-type": "text/event-stream"});
    response.write("event: response.created\ndata: {\"type\":\"response.created\"}\n\n");
    entered();
  });
  await new Promise(done => upstream.listen(0, "127.0.0.1", done));
  context.after(() => { upstream.closeAllConnections(); return new Promise(done => upstream.close(done)); });
  const clientToken = "e".repeat(64);
  const guard = await startModelWireGuard({upstreamUrl: `http://127.0.0.1:${upstream.address().port}/v1/responses`,
    clientToken});
  context.after(() => guard.close());
  const pendingFailure = fetch(`${guard.url}/responses`, {method: "POST",
    headers: {"content-type": "application/json", "x-are-guard-token": clientToken},
    body: JSON.stringify({model: "fixture", tools: []})}).then(() => null, error => error);
  await upstreamEntered;
  await guard.close();
  await upstreamClosed;
  assert.ok(await pendingFailure instanceof Error);
  assert.equal(guard.inspect().forwarded, 0);
  assert.equal(guard.inspect().last_reason, "model-wire.guard-closed");
});
