import assert from "node:assert/strict";
import test from "node:test";

import {createAnthropicNativeModelTransport, createGoogleNativeModelTransport, createOpenAINativeModelTransport} from "../native-provider-transports.mjs";
import {runProviderConformance} from "../provider-conformance.mjs";

test("native provider SDK adapters normalize output and cache telemetry", async () => {
  const output = '{"schema_version":"fixture/v1"}';
  const transports = [
    createOpenAINativeModelTransport({model: "openai-fixture", client: {responses: {create: async () => ({id: "o", output_text: output, usage: {input_tokens: 10, output_tokens: 4, input_tokens_details: {cached_tokens: 3}}})}}}),
    createAnthropicNativeModelTransport({model: "anthropic-fixture", client: {messages: {create: async () => ({id: "a", content: [{type: "text", text: output}], usage: {input_tokens: 10, output_tokens: 4, cache_read_input_tokens: 3, cache_creation_input_tokens: 1}})}}}),
    createGoogleNativeModelTransport({model: "google-fixture", client: {models: {generateContent: async () => ({responseId: "g", text: output, usageMetadata: {promptTokenCount: 10, candidatesTokenCount: 4, cachedContentTokenCount: 3}})}}}),
  ];
  const matrix = await runProviderConformance({transports, prompt: "fixture", expected_final_bytes: output});
  assert.equal(matrix.status, "PASS_BOUNDED", JSON.stringify(matrix));
  assert.equal(matrix.checks.length, 3);
  assert.deepEqual(matrix.checks.map((entry) => entry.receipt.usage.cache_read_tokens), [3, 3, 3]);
  assert.equal(matrix.live_calls_authorized, false);
});

test("provider conformance blocks unavailable adapters without fallback", async () => {
  const matrix = await runProviderConformance({transports: [{transport_id: "broken", async generate() { throw new Error("offline"); }}], prompt: "fixture", expected_final_bytes: "expected"});
  assert.equal(matrix.status, "BLOCK");
  assert.deepEqual(matrix.reason_codes, ["provider.conformance-transport-failed"]);
});
