import test from "node:test";
import assert from "node:assert/strict";
import {probeProviderReadiness} from "./probe-provider-readiness-r1.mjs";

const digest = "a".repeat(64);
const topology = {host_fingerprint_sha256: digest, container_image: `sha256:${digest}`};
const input = {topology, helperSha256: digest, scriptSha256: digest, now: () => "2026-09-29T12:00:00.000Z"};

test("tokenizer denial stops before generation and does not export provider payload", async () => {
  let calls = 0;
  const receipt = await probeProviderReadiness({...input, post: async () => {
    calls++;
    return {status: 429, bytes: 99, payload: {error: {code: 1113, message: "private account detail"}}};
  }});
  assert.equal(calls, 1);
  assert.equal(receipt.status, "not-ready");
  assert.equal(receipt.generation_calls, 0);
  assert.equal(receipt.tiny_generation.status, "not-attempted");
  assert.equal(receipt.tokenizer.api_error_code, "1113");
  assert.doesNotMatch(JSON.stringify(receipt), /private account detail/);
});

test("successful same-account tokenizer and bounded generation produce readiness", async () => {
  const urls = [];
  const receipt = await probeProviderReadiness({...input, post: async (url, body, options) => {
    urls.push(url.pathname);
    assert.equal(options.apiKey, "container-owned-marker");
    if (url.pathname.endsWith("/tokenizer")) return {status: 200, bytes: 44, payload: {usage: {prompt_tokens: 12}}};
    assert.equal(JSON.parse(body).max_completion_tokens, 64);
    return {status: 200, bytes: 80, payload: {usage: {completion_tokens: 4},
      choices: [{message: {content: "OK"}}]}};
  }});
  assert.deepEqual(urls, ["/api/paas/v4/tokenizer", "/api/paas/v4/chat/completions"]);
  assert.equal(receipt.status, "ready");
  assert.equal(receipt.provider_requests, 2);
  assert.equal(receipt.tiny_generation.output_tokens, 4);
  assert.equal(receipt.gateway_container_image, topology.container_image);
  assert.doesNotMatch(JSON.stringify(receipt), /"content":"OK"/);
});

test("HTTP 200 without usable answer is not ready", async () => {
  let calls = 0;
  const receipt = await probeProviderReadiness({...input, post: async () => {
    calls++;
    return calls === 1 ? {status: 200, bytes: 44, payload: {usage: {prompt_tokens: 12}}} :
      {status: 200, bytes: 40, payload: {usage: {completion_tokens: 4}, choices: [{message: {content: ""}}]}};
  }});
  assert.equal(receipt.status, "not-ready");
  assert.equal(receipt.generation_calls, 1);
  assert.equal(receipt.tiny_generation.output_tokens, null);
});
