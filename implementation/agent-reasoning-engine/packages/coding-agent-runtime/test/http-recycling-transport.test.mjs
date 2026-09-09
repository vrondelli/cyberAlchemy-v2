import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";
import {createHttpRecyclingTransport} from "../http-recycling-transport.mjs";
import {createSecretReference} from "../secret-provider.mjs";
import {runIterativeCodingAgent} from "../iterative-agent.mjs";
import {snapshotTree} from "../verifier.mjs";

const hash = (s) => createHash("sha256").update(s).digest("hex");
const json = (res, body) => { res.writeHead(200, {"content-type": "application/json"}); res.end(JSON.stringify(body)); };
const event = (id, kind, body) => JSON.stringify({schema_version: "are.coding-agent-event/v1", event_id: id, kind, ...body, authority_effect: "none"});

async function setup(t, respond, options = {}) {
  const root = mkdtempSync(resolve(tmpdir(), "are-http-recycling-"));
  const work = resolve(root, "fixture");
  mkdirSync(work);
  writeFileSync(resolve(work, "a.txt"), "old\n");
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const seen = [];
  const measurements = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      seen.push({raw, headers: req.headers, url: req.url});
      respond({req, res, raw, body: JSON.parse(raw), count: seen.length, success, final, tool});
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(async () => { server.closeAllConnections(); await new Promise((r) => server.close(r)); });
  const endpoint = `http://127.0.0.1:${server.address().port}/chat/completions`;
  const final = () => event("final", "final-candidate", {candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.txt", expected_base_tree_sha256: snapshotTree(work).tree_sha256, expected_file_sha256: hash("old\n"), utf8: "new\n", rationale: "HTTP fixture", authority_effect: "none"}});
  const tool = (n) => event(`tool:${n}`, "tool-request", {tool: {name: "observe", arguments: {}}});
  const success = (raw, text) => ({model: "fixture-model", choices: [{finish_reason: "stop", message: {content: text}}], usage: {prompt_tokens: Buffer.byteLength(raw), completion_tokens: Buffer.byteLength(text)}});
  const transportOptions = {endpoint, model: "fixture-model", measurement_ref: "synthetic-byte-provider/v1",
    measure_input_tokens: ({serialized_body}) => { measurements.push(serialized_body); return Buffer.byteLength(serialized_body); },
    maximum_output_tokens: 2000, ...options};
  const input = {run_id: "http-test", request: "Change old to new", fixture_root: work,
    model_transport: createHttpRecyclingTransport(transportOptions),
    tool_runtime: {tool_names: ["observe"], tool_contracts: {observe: {arguments: {}}}, invoke: () => ({ok: true, output: "x".repeat(6000)})},
    tool_policy: {allow: ["observe", "read-context-evidence"]}, mutation_allowlist: ["a.txt"], verification_command: [process.execPath, "-e", "process.exit(0)"], maximum_steps: 8, approve: false,
    context_recycling: {directory: resolve(root, "state"), context_limit: 12000, recycle_at: 10000, safety_margin: 1000,
      state: {objective: "Change old to new", constraints: ["Preserve approval"], completed: [], pending: ["Produce candidate"], facts: [], lessons: ["Explain with examples"], evidence_refs: ["fixture:a.txt"]}}};
  return {input, seen, measurements, work, transportOptions};
}

test("real HTTP requests pass the recycling gate and use the exact measured body", async (t) => {
  const f = await setup(t, ({res, raw, count, success, final, tool}) => json(res, success(raw, count < 3 ? tool(count) : final())));
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "AWAITING_APPROVAL", JSON.stringify(output));
  assert.equal(output.recycling.recycles, 2);
  assert.equal(f.seen.length, 3);
  for (const request of f.seen) {
    assert.ok(f.measurements.includes(request.raw));
    const body = JSON.parse(request.raw);
    assert.equal(body.max_completion_tokens, 2000);
    assert.equal(body.stream, false);
    assert.deepEqual(Object.keys(body).sort(), ["max_completion_tokens", "messages", "model", "stream"]);
    assert.equal(body.messages.length, 1);
    assert.match(body.messages[0].content, /Explain with examples/);
  }
  for (const entry of output.history) {
    assert.equal(entry.transport_receipt.request_count, 1);
    assert.equal(entry.transport_receipt.automatic_retries, 0);
  }
  assert.equal(readFileSync(resolve(f.work, "a.txt"), "utf8"), "old\n");
});

for (const status of [302, 429, 503]) test(`HTTP ${status} is terminal and never redirected or retried`, async (t) => {
  const f = await setup(t, ({res}) => { res.writeHead(status, {location: "/unexpected", "retry-after": "0"}); res.end("sensitive server error body"); });
  const first = await runIterativeCodingAgent(f.input);
  assert.equal(first.status, "BLOCK");
  assert.match(first.model_error, new RegExp(`status-${status}`));
  assert.doesNotMatch(JSON.stringify(first), /sensitive server error body/);
  assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
  assert.equal(f.seen.length, 1);
});

test("connection loss never triggers a replacement request", async (t) => {
  const f = await setup(t, ({req}) => req.socket.destroy());
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  assert.equal(f.seen.length, 1);
});

test("deadline covers a stalled response body", async (t) => {
  const f = await setup(t, ({res}) => { res.writeHead(200, {"content-type": "application/json"}); res.write('{"partial":'); }, {timeout_ms: 150});
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.model_error, /deadline-exceeded/);
  assert.equal(f.seen.length, 1);
});

test("chunked and declared oversized responses stop at the byte limit", async (t) => {
  for (const declared of [false, true]) {
    const f = await setup(t, ({res}) => {
      res.writeHead(200, {"content-type": "application/json", ...(declared ? {"content-length": 4096} : {})});
      res.end("x".repeat(4096));
    }, {maximum_response_bytes: 1024});
    const output = await runIterativeCodingAgent(f.input);
    assert.match(output.model_error, /response-too-large/);
    assert.equal(f.seen.length, 1);
  }
});

test("measurement drift prevents the HTTP request", async (t) => {
  let measurements = 0;
  const f = await setup(t, () => assert.fail("must not dispatch"), {measure_input_tokens: () => 5000 + measurements++});
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.model_error, /measurement-drift/);
  assert.equal(f.seen.length, 0);
});

test("missing or understated provider usage blocks continuation", async (t) => {
  for (const usage of [undefined, {prompt_tokens: 999999, completion_tokens: 1}, {prompt_tokens: 1, completion_tokens: 2001}]) {
    const f = await setup(t, ({res, raw, success, final}) => json(res, {...success(raw, final()), usage}));
    const output = await runIterativeCodingAgent(f.input);
    assert.equal(output.status, "BLOCK");
    assert.match(output.model_error, /bound-violated/);
    assert.equal(f.seen.length, 1);
  }
});

test("truncated, tool-bearing and foreign-model outputs cannot advance the task", async (t) => {
  for (const mutate of [
    (p) => { p.choices[0].finish_reason = "length"; },
    (p) => { p.choices[0].message.tool_calls = []; },
    (p) => { p.model = "different-model"; }
  ]) {
    const f = await setup(t, ({res, raw, success, final}) => { const p = success(raw, final()); mutate(p); json(res, p); });
    assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
    assert.equal(f.seen.length, 1);
  }
});

test("endpoint credentials, remote cleartext and unknown measurement are rejected", () => {
  const base = {model: "fixture", measurement_ref: "test", measure_input_tokens: () => 10, maximum_output_tokens: 100};
  for (const endpoint of ["http://example.com/model", "https://u:p@example.com/model", "https://example.com/model?key=secret", "file:///tmp/model"]) {
    assert.throws(() => createHttpRecyclingTransport({...base, endpoint}), /http-recycling/);
  }
  assert.throws(() => createHttpRecyclingTransport({...base, endpoint: "https://example.com/model", measure_input_tokens: undefined}), /measurement-required/);
});

test("a repeated credential callback cannot send twice or expose its material", async (t) => {
  const api_key_ref = createSecretReference({provider_id: "test", locator: "test-only", purpose: "model-provider"});
  const secret_registry = {async consume({consumer}) { await consumer(Buffer.from("synthetic-secret")); await consumer(Buffer.from("synthetic-secret")); }};
  const f = await setup(t, ({res, raw, success, final}) => json(res, success(raw, final())), {api_key_ref, secret_registry});
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  assert.equal(f.seen.length, 1);
  assert.equal(f.seen[0].headers.authorization, "Bearer synthetic-secret");
  assert.doesNotMatch(JSON.stringify(output), /synthetic-secret/);
});

test("a delayed credential callback after failure cannot dispatch", async (t) => {
  let delayed;
  const api_key_ref = createSecretReference({provider_id: "test", locator: "test-only", purpose: "model-provider"});
  const secret_registry = {async consume({consumer}) { delayed = consumer; }};
  const f = await setup(t, () => assert.fail("must not dispatch"), {api_key_ref, secret_registry});
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  await assert.rejects(delayed(Buffer.from("synthetic-secret")), /duplicate-or-late/);
  assert.equal(f.seen.length, 0);
});

test("an unawaited credential callback is cancelled and cannot advance the task", async (t) => {
  const api_key_ref = createSecretReference({provider_id: "test", locator: "test-only", purpose: "model-provider"});
  let pending;
  const secret_registry = {async consume({consumer}) { pending = consumer(Buffer.from("synthetic-secret")); }};
  const f = await setup(t, ({res}) => { res.writeHead(200, {"content-type": "application/json"}); res.write("{"); }, {api_key_ref, secret_registry});
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  assert.match(output.model_error, /response-missing/);
  await assert.rejects(pending, /request-cancelled/);
  assert.ok(f.seen.length <= 1);
});
