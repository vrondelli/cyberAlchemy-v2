import assert from "node:assert/strict";
import test from "node:test";

import {createCodexContextWindowTracker, extractCodexContextWindowObservation} from "../index.mjs";

const usage = {
  jsonrpc: "2.0",
  method: "thread/tokenUsage/updated",
  params: {
    threadId: "thread-1",
    turnId: "turn-2",
    tokenUsage: {
      last: {inputTokens: 800, cachedInputTokens: 500, cacheWriteInputTokens: 0, outputTokens: 100, reasoningOutputTokens: 25, totalTokens: 925},
      total: {inputTokens: 1800, cachedInputTokens: 900, cacheWriteInputTokens: 0, outputTokens: 200, reasoningOutputTokens: 50, totalTokens: 2050},
      modelContextWindow: 4000,
    },
  },
};

test("Codex token and compaction notifications become bounded observations", () => {
  const tracker = createCodexContextWindowTracker();
  assert.equal(tracker.observe(usage).disposition, "observed");
  assert.equal(tracker.observe(usage).disposition, "duplicate");
  assert.equal(tracker.observe({jsonrpc: "2.0", method: "item/started", params: {threadId: "thread-1", turnId: "turn-2", item: {id: "compact-1", type: "contextCompaction"}}}).disposition, "observed");
  assert.equal(tracker.observe({jsonrpc: "2.0", method: "item/completed", params: {threadId: "thread-1", turnId: "turn-2", item: {id: "compact-1", type: "contextCompaction"}}}).disposition, "observed");
  const state = tracker.snapshot().threads[0];
  assert.equal(state.token_usage_update_count, 1);
  assert.equal(state.duplicate_observation_count, 1);
  assert.equal(state.compaction_started_count, 1);
  assert.equal(state.compaction_completed_count, 1);
  assert.equal(state.first_compaction_turn_id, "turn-2");
  assert.equal(state.peak_last_input_tokens, 800);
  assert.equal(state.latest_token_usage.last.cachedInputTokens, 500);
});

test("malformed usage is rejected while unrelated notifications are ignored", () => {
  assert.equal(extractCodexContextWindowObservation({jsonrpc: "2.0", method: "turn/started", params: {threadId: "thread-1"}}).disposition, "not-applicable");
  const malformed = extractCodexContextWindowObservation({...usage, params: {...usage.params, tokenUsage: {...usage.params.tokenUsage, modelContextWindow: 0}}});
  assert.equal(malformed.ok, false);
  assert.deepEqual(malformed.reason_codes, ["context-window.token-usage-invalid"]);
});
