import {timingSafeEqual} from "node:crypto";
import {createServer} from "node:http";

const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const SAFE_ITEM_TYPES = new Set(["message", "reasoning", "function_call"]);
const SAFE_EVENTS = new Set(["response.created", "response.in_progress", "response.output_item.added",
  "response.output_item.done", "response.content_part.added", "response.content_part.done",
  "response.output_text.delta", "response.output_text.done", "response.function_call_arguments.delta",
  "response.function_call_arguments.done", "response.reasoning_summary_text.delta",
  "response.reasoning_summary_text.done", "response.refusal.delta", "response.refusal.done",
  "response.completed"]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readBounded(stream, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) throw fail("model-wire.body-too-large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function filterModelRequest(bytes, allowedToolNames = []) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > MAX_REQUEST_BYTES
    || !Array.isArray(allowedToolNames) || allowedToolNames.some(name => typeof name !== "string")
    || new Set(allowedToolNames).size !== allowedToolNames.length) throw fail("model-wire.request-invalid");
  let body;
  try { body = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes)); }
  catch { throw fail("model-wire.request-invalid"); }
  if (!record(body) || (body.tools !== undefined && !Array.isArray(body.tools))
    || (body.tool_choice !== undefined && !["auto", "none"].includes(body.tool_choice))) {
    throw fail("model-wire.request-invalid");
  }
  const offered = new Set();
  const allowed = new Set(allowedToolNames);
  const tools = [];
  for (const tool of body.tools ?? []) {
    if (!record(tool) || tool.type !== "function" || typeof tool.name !== "string"
      || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(tool.name)
      || offered.has(tool.name)) throw fail("model-wire.tool-catalog-invalid");
    offered.add(tool.name);
    if (allowed.has(tool.name)) tools.push(tool);
  }
  body.tools = tools;
  return {bytes: Buffer.from(JSON.stringify(body)), forwardedToolNames: tools.map(tool => tool.name)};
}

function isTextPart(part) {
  return record(part) && (part.type === "output_text"
    ? typeof part.text === "string" && Array.isArray(part.annotations)
    : part.type === "refusal" && typeof part.refusal === "string");
}

function checkTextPart(part) {
  if (!isTextPart(part)) throw fail("model-wire.message-content-unsupported");
}

function checkOutputItem(item, allowed, {partial = false} = {}) {
  if (!record(item) || !SAFE_ITEM_TYPES.has(item.type) || typeof item.id !== "string") {
    throw fail("model-wire.output-item-unsupported");
  }
  if (item.type === "message") {
    if (item.role !== "assistant" || (!partial && (!Array.isArray(item.content)
      || item.content.length === 0)) || (item.content !== undefined
      && (!Array.isArray(item.content) || item.content.some(part => !isTextPart(part))))) {
      throw fail("model-wire.message-content-unsupported");
    }
  }
  if (partial) return;
  if (item.type !== "function_call") return;
  if (!allowed.has(item.name) || typeof item.call_id !== "string"
    || typeof item.arguments !== "string") throw fail("model-wire.function-call-denied");
  let args;
  try { args = JSON.parse(item.arguments); }
  catch { throw fail("model-wire.function-arguments-invalid"); }
  if (!record(args)) throw fail("model-wire.function-arguments-invalid");
}

export function validateModelResponse(bytes, forwardedToolNames = []) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > MAX_RESPONSE_BYTES
    || !Array.isArray(forwardedToolNames)) throw fail("model-wire.response-invalid");
  let source;
  try { source = new TextDecoder("utf-8", {fatal: true}).decode(bytes); }
  catch { throw fail("model-wire.response-invalid"); }
  if (!/(?:\r?\n){2}$/.test(source)) throw fail("model-wire.response-incomplete");
  const allowed = new Set(forwardedToolNames);
  const completedItems = new Map();
  let complete = null;
  for (const frame of source.split(/\r?\n\r?\n/).filter(Boolean)) {
    if (complete) throw fail("model-wire.event-after-completion");
    const lines = frame.split(/\r?\n/);
    const eventLines = lines.filter(line => line.startsWith("event: "));
    const dataLines = lines.filter(line => line.startsWith("data: "));
    if (eventLines.length !== 1 || dataLines.length !== 1
      || lines.some(line => !line.startsWith("event: ") && !line.startsWith("data: "))) {
      throw fail("model-wire.event-invalid");
    }
    const event = eventLines[0].slice(7);
    let data;
    try { data = JSON.parse(dataLines[0].slice(6)); }
    catch { throw fail("model-wire.event-invalid"); }
    if (!record(data) || data.type !== event || !SAFE_EVENTS.has(event)) {
      throw fail("model-wire.event-invalid");
    }
    if (event !== "response.completed" && record(data.response)
      && Array.isArray(data.response.output) && data.response.output.length > 0) {
      throw fail("model-wire.early-output-denied");
    }
    if (event.startsWith("response.function_call_arguments.") && allowed.size === 0) {
      throw fail("model-wire.function-call-denied");
    }
    if (event === "response.content_part.added" || event === "response.content_part.done") {
      checkTextPart(data.part);
    }
    if (event === "response.output_text.delta" || event === "response.reasoning_summary_text.delta") {
      if (typeof data.delta !== "string") throw fail("model-wire.event-invalid");
    }
    if (event === "response.output_text.done" || event === "response.reasoning_summary_text.done") {
      if (typeof data.text !== "string") throw fail("model-wire.event-invalid");
    }
    if (event === "response.refusal.delta" || event === "response.refusal.done") {
      if (typeof data.item_id !== "string" || !Number.isSafeInteger(data.output_index)
        || data.output_index < 0 || !Number.isSafeInteger(data.content_index)
        || data.content_index < 0 || typeof data[event === "response.refusal.delta" ? "delta" : "refusal"] !== "string") {
        throw fail("model-wire.event-invalid");
      }
    }
    if (event === "response.output_item.added") {
      if (!record(data.item) || !SAFE_ITEM_TYPES.has(data.item.type)
        || (data.item.type === "function_call" && !allowed.has(data.item.name))) {
        throw fail("model-wire.output-item-unsupported");
      }
      checkOutputItem(data.item, allowed, {partial: true});
    }
    if (event === "response.output_item.done") {
      checkOutputItem(data.item, allowed);
      if (completedItems.has(data.item.id)) throw fail("model-wire.output-item-duplicate");
      completedItems.set(data.item.id, data.item);
    }
    if (event === "response.completed") {
      if (complete || !record(data.response) || data.response.status !== "completed"
        || !Array.isArray(data.response.output)) throw fail("model-wire.response-invalid");
      complete = data.response;
    }
    if (event === "response.failed" || event === "response.incomplete") {
      throw fail("model-wire.response-incomplete");
    }
  }
  if (!complete || complete.output.length !== completedItems.size) throw fail("model-wire.response-incomplete");
  for (const item of complete.output) {
    checkOutputItem(item, allowed);
    if (JSON.stringify(completedItems.get(item.id)) !== JSON.stringify(item)) {
      throw fail("model-wire.output-item-mismatch");
    }
  }
  return {output_item_count: complete.output.length, function_call_count: complete.output
    .filter(item => item.type === "function_call").length};
}

export async function startModelWireGuard({upstreamUrl, allowedToolNames = [], clientToken,
  upstreamBearerToken = null, fetchImpl = fetch} = {}) {
  let upstream;
  try { upstream = new URL(upstreamUrl); }
  catch { throw fail("model-wire.upstream-invalid"); }
  const loopbackUpstream = upstream.protocol === "http:" && upstream.hostname === "127.0.0.1";
  const openAiUpstream = upstream.protocol === "https:" && upstream.hostname === "api.openai.com"
    && (upstream.port === "" || upstream.port === "443");
  if ((!loopbackUpstream && !openAiUpstream) || upstream.username || upstream.password
    || upstream.hash || upstream.search || upstream.pathname !== "/v1/responses") {
    throw fail("model-wire.upstream-invalid");
  }
  if (openAiUpstream ? (typeof upstreamBearerToken !== "string"
    || !/^[\x21-\x7e]{1,4096}$/.test(upstreamBearerToken)) : upstreamBearerToken !== null) {
    throw fail("model-wire.upstream-auth-invalid");
  }
  if (typeof clientToken !== "string" || !/^[0-9a-f]{64}$/.test(clientToken)) {
    throw fail("model-wire.client-token-invalid");
  }
  const expectedToken = Buffer.from(clientToken, "ascii");
  const observations = {requests: 0, forwarded: 0, blocked: 0, last_reason: null};
  const activeRequests = new Set();
  let closing = false;
  let closePromise = null;
  const server = createServer(async (request, response) => {
    observations.requests += 1;
    const controller = new AbortController();
    activeRequests.add(controller);
    response.once("close", () => {
      if (!response.writableEnded && !controller.signal.aborted) {
        controller.abort(fail("model-wire.client-disconnected"));
      }
    });
    try {
      if (closing) throw fail("model-wire.guard-closed");
      const supplied = request.headers["x-are-guard-token"];
      const suppliedToken = typeof supplied === "string" ? Buffer.from(supplied, "ascii") : null;
      if (!suppliedToken || suppliedToken.length !== expectedToken.length
        || !timingSafeEqual(suppliedToken, expectedToken)) {
        throw fail("model-wire.client-not-authorized");
      }
      if (request.method !== "POST" || request.url !== "/v1/responses") {
        throw fail("model-wire.endpoint-denied");
      }
      const filtered = filterModelRequest(await readBounded(request, MAX_REQUEST_BYTES), allowedToolNames);
      const upstreamResponse = await fetchImpl(upstream, {method: "POST", redirect: "error",
        headers: {"content-type": "application/json",
          ...(openAiUpstream ? {authorization: `Bearer ${upstreamBearerToken}`} : {})},
        body: filtered.bytes, signal: AbortSignal.any([controller.signal,
          AbortSignal.timeout(openAiUpstream ? 300000 : 30000)])});
      if (upstreamResponse.status !== 200 || !upstreamResponse.headers.get("content-type")?.includes("text/event-stream")) {
        throw fail("model-wire.upstream-response-invalid");
      }
      const body = await readBounded(upstreamResponse.body, MAX_RESPONSE_BYTES);
      if (controller.signal.aborted) throw controller.signal.reason;
      validateModelResponse(body, filtered.forwardedToolNames);
      observations.forwarded += 1;
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(body);
    } catch (error) {
      observations.blocked += 1;
      const reason = controller.signal.aborted ? controller.signal.reason : error;
      observations.last_reason = /^[a-z0-9.-]+$/.test(reason?.code ?? "")
        ? reason.code : "model-wire.unexpected-failure";
      if (response.destroyed || response.writableEnded) return;
      if (!response.headersSent) response.writeHead(observations.last_reason === "model-wire.client-not-authorized"
        ? 403 : 502, {"content-type": "application/json"});
      response.end(JSON.stringify({error: {code: observations.last_reason}}));
    } finally {
      activeRequests.delete(controller);
    }
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", resolveReady);
  });
  const stopped = new Promise(resolveStopped => {
    server.once("close", () => resolveStopped("model-wire-guard"));
    server.once("error", () => resolveStopped("model-wire-guard"));
  });
  return {url: `http://127.0.0.1:${server.address().port}/v1`,
    inspect: () => ({...observations, listening: server.listening && !closing}),
    stopped,
    close: () => {
      if (closePromise) return closePromise;
      closing = true;
      for (const controller of activeRequests) controller.abort(fail("model-wire.guard-closed"));
      server.closeAllConnections();
      closePromise = new Promise(done => server.close(done));
      return closePromise;
    }};
}
