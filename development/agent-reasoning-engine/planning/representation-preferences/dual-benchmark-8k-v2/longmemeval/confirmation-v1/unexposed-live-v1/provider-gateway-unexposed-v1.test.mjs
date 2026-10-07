import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import {sha, wire} from "./adapter-unexposed-v1.mjs";
import {createGatewayExchange, createGatewayProviders, inspectGateway, GATEWAY_CONTAINER, GATEWAY_USER} from "./provider-gateway-unexposed-v1.mjs";

const descriptor = () => JSON.stringify({Id: "a".repeat(64), Image: `sha256:${"b".repeat(64)}`, Config: {Image: "gateway@sha256:pinned"}, State: {Running: true}, Mounts: [{Type: "volume", Name: "model-api-key", Source: "/var/lib/docker/volumes/model-api-key/_data", Destination: "/run/secrets/model_api_key", Mode: "", Propagation: "", RW: false}], NetworkSettings: {Networks: {gateway: {}}}});
const inspector = (command, args) => args[0] === "inspect" ? descriptor() : "";

function launcher(responder, observations = []) {
  return (command, args) => {
    assert.equal(command, "docker"); assert.deepEqual(args.slice(0, 5), ["exec", "--user", GATEWAY_USER, "-i", GATEWAY_CONTAINER]); assert.deepEqual(args.slice(5, 8), ["/nodejs/bin/node", "--input-type=module", "-e"]);
    const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => {};
    const chunks = []; child.stdin.on("data", (chunk) => chunks.push(chunk)); child.stdin.on("finish", () => { const raw = Buffer.concat(chunks); observations.push({args, raw}); const result = responder(args.at(-1), raw); child.stdout.end(JSON.stringify(result)); queueMicrotask(() => child.emit("close", 0)); }); return child;
  };
}
const response = (kind) => kind === "tokenizer"
  ? {status: 200, payload: {usage: {prompt_tokens: 12}}, response_sha256: "1".repeat(64), response_bytes: 40}
  : {status: 200, payload: {model: "glm-5.3-flash", choices: [{finish_reason: "stop", message: {content: "answer"}}], usage: {prompt_tokens: 12, completion_tokens: 3, total_tokens: 15}}, response_sha256: "2".repeat(64), response_bytes: 120};

test("gateway inspection binds the exact running container without credential reads", () => {
  let calls = 0, reads = 0; const value = inspectGateway((command, args) => { calls++; assert.equal(command, "docker"); if (args[0] === "exec") { assert.deepEqual(args.slice(-4, -1), ["/nodejs/bin/node", "--input-type=module", "-e"]); assert.match(args.at(-1), /statSync/); assert.doesNotMatch(args.at(-1), /readFile/); assert.ok(!args.some((item) => /\bcat\b|\bhead\b|\btail\b/.test(item))); } return inspector(command, args); }, (path) => { reads++; assert.equal(path, "/etc/machine-id"); return "machine-a\n"; });
  assert.equal(calls, 2); assert.equal(value.credentials_crossed_gateway_boundary, false); assert.equal(value.secret_mount.destination, "/run/secrets/model_api_key"); assert.match(value.secret_mount.source_path_sha256, /^[a-f0-9]{64}$/); assert.equal(value.image_digest, `sha256:${"b".repeat(64)}`); assert.deepEqual(value.network_policy.attached_networks, ["gateway"]);
  assert.equal(reads, 1);
  assert.throws(() => inspectGateway((command, args) => args[0] === "inspect" ? JSON.stringify({...JSON.parse(descriptor()), State: {Running: false}}) : "", () => "machine-a\n"), /gateway-not-running/);
});

test("tokenizer and chat use one exact docker exec attempt after durable dispatch intent", async () => {
  const observations = [], exchange = createGatewayExchange({spawn: launcher((kind) => response(kind), observations)}), events = [];
  const tokenRaw = JSON.stringify({messages: [], model: "glm-5.3-flash"}); const token = await exchange("tokenizer", tokenRaw, sha(tokenRaw), {onDispatch: async () => events.push("tokenizer-dispatch")});
  const modelRaw = JSON.stringify(wire([{role: "user", content: "hello"}], 768)); const model = await exchange("model", modelRaw, sha(modelRaw), {onDispatch: async () => events.push("model-dispatch")});
  assert.deepEqual(events, ["tokenizer-dispatch", "model-dispatch"]); assert.equal(observations.length, 2); assert.equal(token.payload.usage.prompt_tokens, 12); assert.equal(model.payload.choices[0].message.content, "answer");
  assert.ok(observations.every(({args}) => args.some((value) => value.includes("/run/secrets/model_api_key")))); assert.ok(observations.every(({raw}) => !raw.includes("model_api_key")));
});

test("provider preserves no-retry journal, usage, and settlement semantics", async () => {
  const records = [], observations = [], providers = createGatewayProviders({record: async (value) => records.push(value), before: () => {}, maximum_calls: 1, inspect: inspector, spawn: launcher((kind) => response(kind), observations)});
  const request = wire([{role: "user", content: "hello"}], 768), receipt = await providers.generate({id: "one", request});
  assert.equal(receipt.ok, true); assert.equal(receipt.transport_attempts, 1); assert.equal(receipt.usage.total_tokens, 15); assert.deepEqual(records.filter((item) => item.channel === "model").map((item) => item.phase), ["prepared", "dispatch-intent", "completed"]); assert.equal(observations.length, 1);
  await assert.rejects(() => providers.generate({id: "one", request}), /no retries/); assert.equal(observations.length, 1); assert.deepEqual(await providers.generate.settle(), {settled: true, pending: 0});
});

test("malformed or oversized wrappers fail closed without a second attempt", async () => {
  let calls = 0; const bad = createGatewayExchange({spawn: launcher(() => { calls++; return {status: 200, payload: {}, response_sha256: "x", response_bytes: 1}; })}); const raw = "{}";
  await assert.rejects(() => bad("tokenizer", raw, sha(raw), {onDispatch: async () => {}}), /wrapper-invalid/); assert.equal(calls, 1);
  const oversized = createGatewayExchange({spawn: launcher(() => { calls++; return {status: 200, payload: {}, response_sha256: "3".repeat(64), response_bytes: 65537}; })});
  await assert.rejects(() => oversized("tokenizer", raw, sha(raw), {onDispatch: async () => {}}), /wrapper-invalid/); assert.equal(calls, 2);
});

test("provider rejection records only a numeric error code and never retries", async () => {
  const records = [], observations = [];
  const providers = createGatewayProviders({record: async (value) => records.push(value), inspect: inspector,
    spawn: launcher(() => ({status: 400, payload: {error: {code: 1301, message: "private rejection text"}},
      response_sha256: "4".repeat(64), response_bytes: 74}), observations)});
  const request = wire([{role: "user", content: "hello"}], 768);
  await assert.rejects(() => providers.meter(request), /provider-http-error/);
  assert.equal(observations.length, 1);
  const failure = records.at(-1);
  assert.equal(failure.status, "failed");
  assert.equal(failure.http_status, 400);
  assert.equal(failure.provider_error_code, "1301");
  assert.equal(failure.failure_code, "provider-http-error");
  assert.doesNotMatch(JSON.stringify(records), /private rejection text/);
});
