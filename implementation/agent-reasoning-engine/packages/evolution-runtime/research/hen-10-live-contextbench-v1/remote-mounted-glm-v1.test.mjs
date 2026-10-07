import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";

import {createRemoteMountedCredentialBinding, createRemoteMountedPost} from "./remote-mounted-glm-v1.mjs";

test("remote post keeps credential material remote and returns bounded JSON", async () => {
  let args, stdin = "";
  const spawnProcess = (...input) => {
    args = input;
    const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => {}; child.stdin.on("data", chunk => { stdin += chunk; });
    queueMicrotask(() => { child.stdout.end('{"status":200,"payload":{"usage":{"prompt_tokens":3}},"bytes":42}'); child.emit("close", 0); });
    return child;
  };
  const post = createRemoteMountedPost({spawnProcess});
  const result = await post(new URL("https://api.z.ai/api/paas/v4/tokenizer"), "{}", {apiKey: "remote-owned-marker", timeout_ms: 30_000, maximum_response_bytes: 65_536});
  assert.equal(result.status, 200); assert.equal(result.payload.usage.prompt_tokens, 3);
  assert.equal(args[0], "ssh"); assert.match(args[1].at(-1), /are-keld-presentation-provider-gateway-1/);
  assert.equal(JSON.parse(stdin).body, "{}"); assert.ok(!stdin.includes("model_api_key"));
});

test("credential binding exposes only an opaque marker to the custom transport", async () => {
  const {registry, reference} = createRemoteMountedCredentialBinding(); let seen;
  await registry.consume({secret_ref: reference, consumer_id: "glm-flash-transport", request_digest: "a".repeat(64), consumer: async material => { seen = Buffer.from(material).toString(); }});
  assert.equal(seen, "remote-owned-marker");
  assert.ok(!JSON.stringify(reference).includes("/run/secrets/model_api_key"));
});

test("abort settles even when SSH ignores TERM and escalates to KILL", async () => {
  const controller = new AbortController(), kills = [];
  const spawnProcess = () => {
    const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = signal => { kills.push(signal); }; return child;
  };
  const post = createRemoteMountedPost({spawnProcess});
  const pending = post(new URL("https://api.z.ai/api/paas/v4/tokenizer"), "{}", {apiKey: "remote-owned-marker", timeout_ms: 30_000, maximum_response_bytes: 65_536, signal: controller.signal});
  controller.abort(); await assert.rejects(pending, error => error.code === "cancelled"); assert.deepEqual(kills, ["SIGTERM"]);
  await new Promise(resolve => setTimeout(resolve, 2_100)); assert.deepEqual(kills, ["SIGTERM", "SIGKILL"]);
});
