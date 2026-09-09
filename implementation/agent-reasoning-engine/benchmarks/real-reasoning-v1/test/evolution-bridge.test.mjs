import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {createFixtureResearchProvider, diagnosisSignals, runBenchmarkEvolutionCycle} from "../src/evolution-bridge.mjs";
import {projectCanaryResult, projectFailureLearningCanary, runFailureLearningCanary, runFixtureEvolutionCanary} from "../src/evolution-canary.mjs";
import {inspectImprovementArtifact} from "../src/improvement-inspection.mjs";

const evolutionProfile = JSON.parse(readFileSync(new URL("../../../packages/evolution-runtime/profiles/default-v1.json", import.meta.url), "utf8"));

function evidence(precision) {
  return {
    sampling_mode: "fast",
    core: {result_id: `core:${precision}`, summary: {route_accuracy: 0.99, definition_recall: 0.97, context_precision: precision, false_direct_ambiguities: 0, determinism_mismatches: 0}, metrics: {route: {p95_ms: 1}, request_selection: {p95_ms: 2}, preflight: {p95_ms: 20}}, cases: {routing: [], context: []}},
    integration: {cases: {lifecycle: [{passed: true}], failure_safety: [{passed: true}]}},
    authority_measurement: {observed: true, violations: 0, case_ids: ["fixture:failure-safety"], basis: "explicit-fixture-safety-case"},
  };
}

function diagnosis() {
  return {schema_version: "are.reasoning-improvement-iteration/v1", iteration_id: "diagnosis:context-precision", evidence_digest: "d".repeat(64), status: "DIAGNOSED", findings: [{target_id: "context-precision", priority: 1, metric: "context_precision", value: 0.72, threshold: 0.8, meets_target: false, failed_cases: [], mutation_allowlist: ["selector.mjs"]}]};
}

test("diagnosis produces one exact improvement signal for each unmet target", () => {
  const signals = diagnosisSignals(diagnosis());
  assert.equal(signals.length, 1);
  assert.equal(signals[0].kind, "context-precision-failure");
});

test("research disabled blocks before provider, reproduction, or variant calls", async () => {
  let calls = 0;
  const provider = {id: "unused", search: async () => { calls += 1; return []; }};
  const result = await runBenchmarkEvolutionCycle(loadBenchmark(packageRoot), {evolution_profile: evolutionProfile, diagnosis: diagnosis(), research_providers: [provider]});
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.research.disposition, "disabled");
  assert.equal(calls, 0);
});

test("context-precision cycle reaches a recommend-only upgrade decision", async () => {
  const configured = structuredClone(evolutionProfile);
  configured.research.enabled = true;
  const provider = createFixtureResearchProvider(new URL("../fixtures/evolution/context-precision-research.json", import.meta.url));
  const result = await runBenchmarkEvolutionCycle(loadBenchmark(packageRoot), {
    evolution_profile: configured, diagnosis: diagnosis(), research_providers: [provider],
    reproduce: async ({technique}) => ({technique_ref: technique.record_id, environment_ref: "node:26.8.1", protocol_ref: "fixture:context-precision", expected_observations: technique.expected_observations, actual_observations: ["context precision increased"], outcome: "reproduced"}),
    build_variant: async ({technique, reproduction}) => ({baseline_ref: "serving:baseline", source_tree_digest: "a".repeat(64), build_environment_ref: "node:26.8.1", technique_refs: [technique.record_id], reproduction_refs: [reproduction.record_id], changed_paths: ["selector.mjs"]}),
    baseline_evidence: evidence(0.72), candidate_evidence: evidence(0.84), holdout_passed: true, keep_streak: 2,
  });
  assert.equal(result.status, "RECOMMEND");
  assert.equal(result.comparison.outcome, "KEEP");
  assert.equal(result.decision.disposition, "recommend-candidate");
  assert.equal(result.sealed.ok, true);
});

test("cycle rejects an unsafe candidate before upgrade recommendation", async () => {
  const configured = structuredClone(evolutionProfile);
  configured.research.enabled = true;
  const provider = createFixtureResearchProvider(new URL("../fixtures/evolution/context-precision-research.json", import.meta.url));
  const unsafe = evidence(0.9);
  unsafe.integration.cases.failure_safety[0].passed = false;
  const result = await runBenchmarkEvolutionCycle(loadBenchmark(packageRoot), {
    evolution_profile: configured, diagnosis: diagnosis(), research_providers: [provider],
    reproduce: async ({technique}) => ({technique_ref: technique.record_id, environment_ref: "node:26.8.1", protocol_ref: "fixture", outcome: "reproduced"}),
    build_variant: async ({technique, reproduction}) => ({baseline_ref: "serving:baseline", source_tree_digest: "b".repeat(64), build_environment_ref: "node:26.8.1", technique_refs: [technique.record_id], reproduction_refs: [reproduction.record_id]}),
    baseline_evidence: evidence(0.72), candidate_evidence: unsafe, holdout_passed: true, keep_streak: 2,
  });
  assert.equal(result.status, "REJECT");
  assert.ok(result.comparison.reason_codes.includes("fitness.safety-failed"));
  assert.equal(result.decision.disposition, "retain-current");
});

test("full evolution fixture canary is deterministic across independent runs", async () => {
  const left = projectCanaryResult(await runFixtureEvolutionCanary());
  const right = projectCanaryResult(await runFixtureEvolutionCanary());
  assert.deepEqual(left, right);
  assert.equal(left.status, "RECOMMEND");
  assert.equal(left.comparison_outcome, "KEEP");
  assert.equal(left.upgrade_disposition, "recommend-candidate");
  assert.equal(left.authority_effect, "none");
});

test("failure learning canary converts a real stale-reuse failure into retained candidate support", async () => {
  const artifact = await runFailureLearningCanary();
  const left = projectFailureLearningCanary(artifact);
  const right = projectFailureLearningCanary(await runFailureLearningCanary());
  assert.deepEqual(left, right);
  assert.equal(left.baseline_status, "FAIL");
  assert.equal(left.treatment_status, "PASS");
  assert.equal(left.holdout_status, "PASS");
  assert.equal(left.baseline_stale_reuse_incidents, 5);
  assert.equal(left.treatment_stale_reuse_incidents, 0);
  assert.equal(left.implementation_pattern, "bind-refresh-assessment-before-cache-eligibility");
  assert.equal(left.comparison_outcome, "KEEP");
  assert.equal(left.learning_disposition, "candidate-supported");
  assert.equal(left.provider_cache_posture, "unobserved");
  assert.equal(left.authority_effect, "none");
  const inspection = inspectImprovementArtifact(artifact, {source_bytes_sha256: "f".repeat(64)});
  assert.equal(inspection.comparison.outcome, "KEEP");
  assert.equal(inspection.hypothesis.implementation_pattern, left.implementation_pattern);
  assert.equal(inspection.learning.retained_epoch_digest, left.retained_epoch_digest);
  assert.equal(inspection.source_bytes_sha256, "f".repeat(64));
});
