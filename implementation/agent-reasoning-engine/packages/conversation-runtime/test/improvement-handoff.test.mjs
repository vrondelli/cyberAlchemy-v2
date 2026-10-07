import assert from "node:assert/strict";
import test from "node:test";

import {digest} from "../src/canonical.mjs";
import {classifyUsabilityFailure, createEngineImprovementHandoff, createUsabilityObservation, projectEngineHandoffToHypotheses} from "../index.mjs";

function failedBenchmark() {
  return {
    schema_version: "are.real-reasoning-benchmark-result/v1",
    benchmark_id: "are.real-reasoning-v1",
    profile_digest: "p".repeat(64),
    mode: "chat-usability",
    status: "FAIL",
    environment: {node: process.version},
    summary: {checks: {chat_context_continuity: false, authority_violations: true}},
    metrics: {},
    cases: [{scenario_id: "CHAT-003", passed: false}],
    authority_effect: "none",
    claim_limit: "local candidate evidence only"
  };
}

const projector = ({benchmark_result: benchmark, expected_result_digest: expected}) => ({
  ok: true,
  value: {
    failed_scenario_ids: benchmark.cases.filter((item) => !item.passed).map((item) => item.scenario_id),
    hypotheses: [{hypothesis_id: `hypothesis:${expected.slice(0, 12)}`, authority_effect: "none"}],
    authority_effect: "none"
  }
});

test("an exact ARE-owned usability failure creates a non-authorizing hypothesis handoff", () => {
  const benchmark = failedBenchmark();
  const observation = createUsabilityObservation({source_benchmark_result_digest: digest(benchmark), scenario_id: "CHAT-003", status: "FAIL", observed_behavior: "The corrected constraint was forgotten.", expected_behavior: "The corrected constraint remains active.", failure_domain: "reasoning-engine", target_component: "request-intent-runtime"});
  const classified = classifyUsabilityFailure({observation, failure_kind: "conversation-context-continuity"});
  assert.equal(classified.ok, true);
  const handed = createEngineImprovementHandoff({observation, classification: classified.value});
  assert.equal(handed.ok, true);
  assert.equal(handed.value.authority_effect, "none");
  const projected = projectEngineHandoffToHypotheses({handoff: handed.value, benchmark_result: benchmark, projector});
  assert.equal(projected.ok, true);
  assert.equal(projected.value.hypotheses.length, 1);
  assert.equal(projected.value.hypotheses[0].authority_effect, "none");
});

test("interaction-adapter and not-evaluated observations cannot enter ARE evolution", () => {
  const benchmark = failedBenchmark();
  const adapterObservation = createUsabilityObservation({source_benchmark_result_digest: digest(benchmark), scenario_id: "CHAT-003", status: "FAIL", observed_behavior: "Text was clipped.", expected_behavior: "Text remains visible.", failure_domain: "interaction-adapter"});
  const adapterClass = classifyUsabilityFailure({observation: adapterObservation, failure_kind: "render-clipping"});
  assert.equal(adapterClass.ok, true);
  assert.equal(adapterClass.value.disposition, "interaction-adapter-improvement-candidate");
  assert.equal(createEngineImprovementHandoff({observation: adapterObservation, classification: adapterClass.value}).ok, false);
  const unknown = createUsabilityObservation({source_benchmark_result_digest: digest(benchmark), scenario_id: "CHAT-003", status: "NOT_EVALUATED", observed_behavior: "No participant evidence.", expected_behavior: "Comprehension measured.", failure_domain: "not_evaluable"});
  const unknownClass = classifyUsabilityFailure({observation: unknown, failure_kind: "missing-evidence"});
  assert.equal(createEngineImprovementHandoff({observation: unknown, classification: unknownClass.value}).ok, false);
});

test("handoff projection rejects changed benchmark bytes", () => {
  const benchmark = failedBenchmark();
  const observation = createUsabilityObservation({source_benchmark_result_digest: digest(benchmark), scenario_id: "CHAT-003", status: "FAIL", observed_behavior: "Constraint lost.", expected_behavior: "Constraint retained.", failure_domain: "reasoning-engine", target_component: "request-intent-runtime"});
  const classification = classifyUsabilityFailure({observation, failure_kind: "context"}).value;
  const handoff = createEngineImprovementHandoff({observation, classification}).value;
  assert.equal(projectEngineHandoffToHypotheses({handoff, benchmark_result: {...benchmark, status: "PASS"}, projector}).ok, false);
});

test("an interaction failure cannot be relabeled as engine-owned", () => {
  const benchmark = failedBenchmark();
  const observation = createUsabilityObservation({source_benchmark_result_digest: digest(benchmark), scenario_id: "CHAT-003", status: "FAIL", observed_behavior: "Text was clipped.", expected_behavior: "Text remains visible.", failure_domain: "interaction-adapter"});
  const classified = classifyUsabilityFailure({observation, failure_domain: "reasoning-engine"});
  assert.equal(classified.ok, false);
  assert.deepEqual(classified.reason_codes, ["usability.failure-domain-evidence-mismatch"]);
});
