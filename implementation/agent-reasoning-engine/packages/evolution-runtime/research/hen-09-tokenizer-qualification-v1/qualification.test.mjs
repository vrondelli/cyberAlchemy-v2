import test from "node:test";
import assert from "node:assert/strict";

import {assessHen09Receipts, renderRemoteTokenizerProgram} from "./qualification.mjs";

function fixture(tokens = [100, 200]) {
  const requests = tokens.map((_, index) => ({request_id: `r${index}`, task_ref: "t", instance_id: "i",
    stage: index ? "terminal" : "initial", stage_index: 0, prompt_sha256: "a".repeat(64),
    body: {messages: [], model: "glm-5.3-flash", tools: []}}));
  return {manifest: {endpoint: "https://api.z.ai/api/paas/v4/tokenizer", model: "glm-5.3-flash",
    qualification_ref: "q", token_margin: 512, output_cap: 2048, context_limit: 8000,
    stage_counts: {initial: 1, populated: 0, terminal: 1}, claim_ceiling: "bounded"},
    manifest_sha256: "b".repeat(64), requests};
}

test("remote program uses the mounted credential without embedding it", () => {
  const source = renderRemoteTokenizerProgram(fixture());
  assert.match(source, /\/run\/secrets\/model_api_key/);
  assert.match(source, /Promise\.all\(\[worker\(\),worker\(\)\]\)/);
  assert.doesNotMatch(source, /model_api_key\s*:/);
});

test("receipt assessment computes complete envelope and detects overflow", () => {
  const freeze = fixture();
  const lines = freeze.requests.map((request, index) => JSON.stringify({
    schema_version: "are.hen-tokenizer-receipt/v1", request_id: request.request_id, task_ref: "t",
    instance_id: "i", stage: request.stage, stage_index: 0, prompt_sha256: request.prompt_sha256,
    request_sha256: request.prompt_sha256, status: 200, input_tokens: index ? 5500 : 100,
    response_bytes: 10, latency_ms: 1, automatic_retries: 0, dispatched: true,
    model: "glm-5.3-flash", authority_effect: "none"}));
  const result = assessHen09Receipts(freeze, lines);
  assert.equal(result.qualified, false);
  assert.equal(result.model_calls, 0);
  assert.equal(result.overflows[0].request_id, "r1");
  assert.equal(result.stage_maximums.terminal, 8060);
});

test("receipt assessment rejects missing receipts", () => {
  assert.throws(() => assessHen09Receipts(fixture(), []), /receipt-count/);
});
