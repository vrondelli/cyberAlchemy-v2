import assert from "node:assert/strict";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runLiveMultiTurnBenchmark} from "../src/live.mjs";

function mockClient(turns, variant) {
  let threadSequence = 0;
  const calls = [];
  const threads = [];
  return {
    calls,
    threads,
    async startThread(params) {
      threadSequence += 1;
      threads.push(params);
      return {thread: {id: `${variant}:thread:${threadSequence}`}};
    },
    async runTurn(params) {
      const turn = turns.find((candidate) => params.input[0].text.startsWith(candidate.request));
      assert.ok(turn, `unknown mock turn: ${params.input[0].text}`);
      calls.push({thread_id: params.threadId, request: turn.request, has_context: Boolean(params.additionalContext)});
      return {text: JSON.stringify({
        answer: [...turn.required_terms, ...(turn.required_concepts ?? []).map((concept) => concept.any_terms[0])].join(" "),
        next_question: turn.next_question_policy === "required" ? "Which constraint should we resolve next?" : null,
        used_context_item_ids: turn.required_context_item_ids,
        authority_claims: [],
      })};
    },
    async close() {},
  };
}

test("multi-turn live runner preserves one thread per conversation and scores every turn", async () => {
  const benchmark = loadBenchmark(packageRoot);
  const turns = benchmark.corpora.live_multiturn.flatMap((scenario) => scenario.turns);
  const clients = {are: mockClient(turns, "are"), control: mockClient(turns, "control")};
  const result = await runLiveMultiTurnBenchmark(benchmark, {
    repetitions: 1,
    model: "gpt-5.6-luna",
    observed_version: "codex-cli 0.153.0-alpha.5",
    clients,
  });
  assert.equal(result.status, "PASS");
  assert.deepEqual(result.summary.model_binding, {
    requested_model: "gpt-5.6-luna",
    profile_model: "gpt-5.6-sol",
    selection_source: "cli-override",
  });
  assert.equal(result.cases.turns.length, 24);
  assert.equal(result.cases.conversations.length, 8);
  assert.equal(result.cases.conversations.every((conversation) => conversation.passed && conversation.turn_count === 3), true);
  assert.equal(new Set(clients.are.calls.map((call) => call.thread_id)).size, 4);
  assert.equal(new Set(clients.control.calls.map((call) => call.thread_id)).size, 4);
  assert.equal(clients.are.calls.every((call) => call.has_context), true);
  assert.equal(clients.control.calls.every((call) => !call.has_context), true);
  assert.equal(clients.are.threads.every((thread) => thread.model === "gpt-5.6-luna"), true);
  assert.equal(clients.control.threads.every((thread) => thread.model === "gpt-5.6-luna"), true);
});
