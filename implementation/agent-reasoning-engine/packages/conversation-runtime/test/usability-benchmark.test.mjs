import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {runChatUsabilityBenchmark} from "../index.mjs";

const corpus = JSON.parse(readFileSync(resolve(import.meta.dirname, "../benchmark/chat-usability-v1.json"), "utf8"));

test("benchmark collects every check and preserves not-evaluable residue", async () => {
  const executed = [];
  const run = await runChatUsabilityBenchmark({corpus, executeScenario: async (scenario) => {
    executed.push(scenario.scenario_id);
    return {checks: Object.fromEntries(scenario.checks.map((check) => [check.check_id, {
      status: check.check_id === "human_comprehension" ? "NOT_EVALUATED" : "PASS",
      observed_behavior: check.check_id === "human_comprehension" ? "No participant session was run." : check.expected_behavior,
      evidence_refs: [`fixture:${scenario.scenario_id}:${check.check_id}`],
    }]))};
  }});
  assert.deepEqual(executed, ["CHAT-001", "CHAT-002", "CHAT-003"]);
  assert.equal(run.result.status, "NOT_EVALUATED");
  assert.equal(run.result.cases.flatMap((entry) => entry.checks).length, 5);
  assert.equal(run.observations.length, 1);
  assert.equal(run.observations[0].failure_domain, "not_evaluable");
});

test("benchmark binds a failed check to the owner declared by the corpus", async () => {
  const run = await runChatUsabilityBenchmark({corpus: {...corpus, scenarios: [corpus.scenarios[0]]}, executeScenario: async (scenario) => ({checks: {
    internal_route_transition: {status: "FAIL", observed_behavior: "The second turn restarted in another conversation."},
    single_transcript_projection: {status: "PASS", observed_behavior: scenario.checks[1].expected_behavior},
  }})});
  assert.equal(run.result.status, "FAIL");
  assert.equal(run.observations[0].failure_domain, "reasoning-engine");
  assert.equal(run.observations[0].target_component, "request-decision-router");
});
