import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {loadRuntime, packageRoot} from "../src/common.mjs";
import {generateCompactionDistractor, renderPinnedReasoningState, runCompactionAutoLiveBenchmark} from "../src/compaction-auto-live.mjs";

function fakeClient(facts) {
  const events = new EventEmitter();
  let sequence = 0;
  const fillers = new Map();
  return {
    events,
    async startThread() { sequence += 1; return {thread: {id: `auto-thread-${sequence}`}}; },
    async runTurn(params) {
      const threadId = params.threadId;
      const prompt = params.input.at(-1).text;
      if (prompt.startsWith("Inert benchmark distractor")) {
        const count = (fillers.get(threadId) ?? 0) + 1;
        fillers.set(threadId, count);
        events.emit("notification", {method: "thread/tokenUsage/updated", params: {threadId, tokenUsage: {last: {totalTokens: count * 50000}, modelContextWindow: 128000}}});
        if (count === 2) events.emit("notification", {method: "item/completed", params: {threadId, item: {id: `auto-compact-${threadId}`, type: "contextCompaction"}}});
        return {text: '{"facts":[]}'};
      }
      if (!prompt.startsWith("Return every exact")) return {text: '{"facts":[]}'};
      const treatment = params.input.some((item) => item.text.startsWith("<are_reusable_reasoning_state>"));
      return {text: JSON.stringify({facts: treatment ? facts : facts.slice(0, 12)})};
    },
  };
}

test("automatic compaction runner counterbalances arms and requires measurable gain", async () => {
  const benchmark = loadBenchmark(packageRoot);
  const scenario = benchmark.corpora.compaction.find((entry) => entry.scenario_kind === "automatic-live-canary");
  const facts = scenario.facts.map((fact) => fact.exact_value);
  const result = await runCompactionAutoLiveBenchmark(benchmark, {
    client: fakeClient(facts),
    observed_version: loadRuntime(benchmark.profile).value.protocol_binding.observed_codex_version,
    model: "gpt-5.6-luna",
    repetitions: 1,
  });
  assert.equal(result.status, "PASS", JSON.stringify(result.summary));
  assert.equal(result.summary.baseline_exact_recall, 0.5);
  assert.equal(result.summary.treatment_exact_recall, 1);
  assert.equal(result.summary.exact_recall_delta, 0.5);
  assert.equal(result.summary.experiment_id, "are.compaction-auto-live/v2");
  assert.equal(result.summary.supersedes_experiment_id, "are.compaction-auto-live/v1");
  assert.equal(result.summary.treatment_strategy, "inline-pinned-reasoning-state/v1");
  assert.match(result.summary.implementation_digest, /^[0-9a-f]{64}$/);
  const treatment = result.cases.cases.find((entry) => entry.variant === "treatment");
  assert.match(treatment.treatment_input_digest, /^[0-9a-f]{64}$/);
  assert.ok(treatment.treatment_input_bytes > 0);
  assert.equal(result.cases.pairs[0].turn_order.filter((entry) => entry.phase === "filler").length, 4);
});

test("distractor generation is deterministic and changes by turn", () => {
  const scenario = {distractor_seed: 42};
  assert.equal(generateCompactionDistractor(scenario, 1, 10), generateCompactionDistractor(scenario, 1, 10));
  assert.notEqual(generateCompactionDistractor(scenario, 1, 10), generateCompactionDistractor(scenario, 2, 10));
});

test("inline reasoning-state rendering is deterministic, exact, and non-authorizing", () => {
  const benchmark = loadBenchmark(packageRoot);
  const scenario = benchmark.corpora.compaction.find((entry) => entry.scenario_kind === "automatic-live-canary");
  const projection = {
    ok: true,
    digest: "a".repeat(64),
    value: {
      projected_context: {
        source_epoch_id: `reasoning-epoch:${scenario.scenario_id}`,
        pinned_events: scenario.facts.map((fact, index) => ({
          event_id: fact.event_id,
          event_digest: String(index).padStart(64, "0"),
          content: {exact_canary_fact: fact.exact_value},
        })),
      },
    },
  };
  const rendered = renderPinnedReasoningState(projection);
  assert.equal(rendered, renderPinnedReasoningState(projection));
  assert.match(rendered, /schema_version=are\.reusable-reasoning-state-input\/v1/);
  assert.match(rendered, /authority_effect=none/);
  assert.equal(scenario.facts.filter((fact) => rendered.includes(JSON.stringify(fact.exact_value))).length, scenario.facts.length);
});
