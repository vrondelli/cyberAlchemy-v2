import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {canonicalJson, canonicalizeJson, sha256HexText} from "../../intent-route-resolver/index.mjs";

import {
  assessResearchHypothesis,
  createEvolutionRuntime,
  createHypothesisObservation,
  createResearchHypothesis,
  diagnoseLexicalScoringAnomaly,
  projectBenchmarkFailuresToHypotheses,
  runHypothesisLearningCycle,
  verifyEvolutionRecord,
} from "../index.mjs";

function exactDigest(value) {
  return sha256HexText(canonicalJson(canonicalizeJson(value)));
}

function benchmarkResult(overrides = {}) {
  return {
    schema_version: "are.real-reasoning-benchmark-result/v1",
    benchmark_id: "are.real-reasoning-v1",
    profile_digest: "a".repeat(64),
    mode: "adaptive-reuse-holdout",
    status: "FAIL",
    summary: {checks: {adaptive_eliminates_stale_reuse: false, mandatory_reasoning_preserved: true}},
    cases: [{scenario_id: "ADAPTIVE-HOLDOUT-003", passed: false}],
    authority_effect: "none",
    claim_limit: "candidate benchmark evidence only",
    ...overrides,
  };
}

const profile = JSON.parse(readFileSync(new URL("../profiles/default-v1.json", import.meta.url), "utf8"));
const fixture = JSON.parse(readFileSync(new URL("../fixtures/luna-lexical-scoring-hypothesis.json", import.meta.url), "utf8"));
const ontology = JSON.parse(readFileSync(new URL("../ontology/research-learning-v1.json", import.meta.url), "utf8"));

function hypothesis() {
  return createResearchHypothesis(fixture.hypothesis);
}

function diagnostic(hypothesisRef = hypothesis().record_id) {
  return diagnoseLexicalScoringAnomaly({...fixture.diagnostics[0], hypothesis_ref: hypothesisRef});
}

test("research-learning ontology binds every runtime record and keeps learning non-effectful", () => {
  assert.equal(ontology.product_capability.capability_id, "ARE-CAP-LEARN-FROM-EVIDENCE");
  assert.deepEqual(ontology.nodes.map((node) => node.record_schema).slice(0, 5), [
    "are.failure-hypothesis-projection/v1",
    "are.research-hypothesis/v1",
    "are.hypothesis-observation/v1",
    "are.research-experiment/v1",
    "are.learning-decision/v1",
  ]);
  assert.equal(ontology.definitions.some((definition) => definition.definition_id === "ARE-RL-D06" && definition.term === "Failure Hypothesis Projection"), true);
  assert.equal(ontology.relations.some((relation) => relation.relation_id === "failure-projection-creates-hypothesis"), true);
  assert.equal(ontology.definitions.some((definition) => definition.definition_id === "ARE-RL-D05" && definition.term === "Improvement Retention"), true);
  assert.equal(ontology.nodes.some((node) => node.record_schema === "are.improvement-retention/v1"), true);
  assert.equal(ontology.relations.some((relation) => relation.relation_id === "successful-comparison-can-support-retention"), true);
  assert.equal(ontology.authority_effect, "none");
});

test("hypotheses are deterministic, immutable, and self-verifying", () => {
  const left = hypothesis();
  const right = createResearchHypothesis({...fixture.hypothesis, metrics: [...fixture.hypothesis.metrics].reverse()});
  assert.deepEqual(left, right);
  assert.equal(Object.isFrozen(left), true);
  assert.equal(verifyEvolutionRecord(left).ok, true);
});

test("failed benchmark checks deterministically project improvement signals and hypotheses", () => {
  const result = benchmarkResult();
  const left = projectBenchmarkFailuresToHypotheses({benchmark_result: result, expected_result_digest: exactDigest(result)});
  const right = projectBenchmarkFailuresToHypotheses({benchmark_result: result, expected_result_digest: exactDigest(result)});
  assert.deepEqual(left, right);
  assert.equal(left.ok, true);
  assert.equal(left.value.disposition, "hypotheses-projected");
  assert.deepEqual(left.value.failed_check_keys, ["adaptive_eliminates_stale_reuse"]);
  assert.equal(left.value.signals.length, 1);
  assert.equal(left.value.hypotheses.length, 1);
  assert.equal(left.value.hypotheses[0].implementation_pattern, "bind-refresh-assessment-before-cache-eligibility");
  assert.equal(left.value.hypotheses[0].experiment_template.dataset_refs[0], "scenario:ADAPTIVE-HOLDOUT-003");
  assert.equal(verifyEvolutionRecord(left.value).ok, true);
  assert.equal(verifyEvolutionRecord(left.value.hypotheses[0]).ok, true);
});

test("failure projection emits no candidate for PASS and blocks drift or inconsistent status", () => {
  const passed = benchmarkResult({status: "PASS", summary: {checks: {adaptive_eliminates_stale_reuse: true, mandatory_reasoning_preserved: true}}, cases: [{scenario_id: "ADAPTIVE-HOLDOUT-003", passed: true}]});
  const empty = projectBenchmarkFailuresToHypotheses({benchmark_result: passed, expected_result_digest: exactDigest(passed)});
  assert.equal(empty.value.disposition, "no-failures");
  assert.deepEqual(empty.value.hypotheses, []);

  const tampered = structuredClone(passed);
  tampered.summary.checks.mandatory_reasoning_preserved = false;
  assert.deepEqual(projectBenchmarkFailuresToHypotheses({benchmark_result: tampered, expected_result_digest: exactDigest(passed)}).reason_codes, ["evolution.benchmark-result-digest-mismatch"]);
  const inconsistent = benchmarkResult({status: "PASS"});
  assert.deepEqual(projectBenchmarkFailuresToHypotheses({benchmark_result: inconsistent, expected_result_digest: exactDigest(inconsistent)}).reason_codes, ["evolution.benchmark-status-inconsistent"]);
});

test("failure projection accepts grouped cases and keeps not-evaluated runs visible without hypotheses", () => {
  const grouped = benchmarkResult({cases: {lifecycle: [{scenario_id: "LIFECYCLE-001", passed: true}], failure_safety: [{scenario_id: "FAILURE-001", passed: false}]}});
  const projected = projectBenchmarkFailuresToHypotheses({benchmark_result: grouped, expected_result_digest: exactDigest(grouped)});
  assert.deepEqual(projected.value.failed_scenario_ids, ["FAILURE-001"]);

  const notEvaluated = benchmarkResult({status: "NOT_EVALUATED", summary: {reason_codes: ["codex.version-drift"]}, cases: []});
  const skipped = projectBenchmarkFailuresToHypotheses({benchmark_result: notEvaluated, expected_result_digest: exactDigest(notEvaluated)});
  assert.equal(skipped.ok, true);
  assert.equal(skipped.value.disposition, "not-evaluated");
  assert.deepEqual(skipped.value.hypotheses, []);
});

test("Luna anomaly becomes bounded supporting evidence, not semantic proof", () => {
  const result = diagnostic();
  assert.equal(result.disposition, "hypothesis-supported");
  assert.equal(result.observation.observation_kind, "supporting");
  assert.deepEqual(result.observation.missing_terms, ["evidence"]);
  assert.deepEqual(result.observation.observed_markers, ["measure", "metrics", "receipts", "record", "reproduce"]);
  assert.match(result.observation.limitations[0], /not proof/);
});

test("undeclared semantic coverage remains inconclusive", () => {
  const result = diagnoseLexicalScoringAnomaly({...fixture.diagnostics[0], hypothesis_ref: hypothesis().record_id, concept_markers: {evidence: []}});
  assert.equal(result.disposition, "inconclusive");
  assert.equal(result.observation.observation_kind, "inconclusive");
});

test("one anomaly generates a registered experiment but requires replication", () => {
  const runtime = createEvolutionRuntime({profile});
  const selected = hypothesis();
  const observation = diagnostic(selected.record_id).observation;
  const result = runHypothesisLearningCycle({runtime, hypothesis: selected, observations: [observation], policy: fixture.policy});
  assert.equal(result.ok, true);
  assert.equal(result.decision.disposition, "collect-replications");
  assert.equal(result.experiment.required_repetitions, 3);
  assert.equal(result.sealed.ok, true);
  assert.equal(runtime.snapshot().filter((record) => record.schema_version === "are.hypothesis-observation/v1").length, 1);
});

test("counterevidence is preserved and forces revision", () => {
  const selected = hypothesis();
  const counter = createHypothesisObservation({
    hypothesis_ref: selected.record_id,
    source_result_ref: "benchmark:counterexample",
    observation_kind: "counterevidence",
    phase: "replication",
    claim: "Expert review rejects the declared marker equivalence.",
    evaluator_id: "expert-panel:v1",
    evidence_refs: ["labels:counterexample"],
  });
  const assessed = assessResearchHypothesis(selected, [counter]);
  assert.equal(assessed.decision.disposition, "revise-hypothesis");
  assert.equal(assessed.decision.counterevidence_count, 1);
});

test("hypothesis fixture preserves optimization attempts as separate evidence", () => {
  assert.equal(Array.isArray(fixture.experiment_attempts), true);
  assert.equal(fixture.experiment_attempts.length, 2);
  const attempt = fixture.experiment_attempts[0];
  assert.equal(attempt.hypothesis_key, "ARE-RH-LEXICAL-001");
  assert.equal(attempt.treatment_ref, "scorer:declared-concept-equivalence/candidate-v2");
  assert.equal(attempt.status, "FAIL");
  assert.equal(attempt.authority_effect, "none");
  assert.equal(attempt.checks.p95_latency_regression, false);
  assert.equal(fixture.experiment_attempts[1].treatment_ref, "scorer:declared-concept-equivalence/candidate-v3");
  assert.equal(fixture.experiment_attempts[1].status, "FAIL");
  assert.equal(fixture.loop_runs.length, 1);
  assert.equal(fixture.loop_runs[0].attempts_run, 15);
  assert.equal(fixture.loop_runs[0].hypotheses_created, 15);
  assert.equal(fixture.loop_runs[0].stop_reason, "max-attempts");
  assert.equal(fixture.loop_runs[0].final_status, "FAIL");
  assert.equal(fixture.strategy_loop_runs.length, 2);
  assert.deepEqual(fixture.strategy_loop_runs[0].strategy_refs, [
    "strategy:declared-equivalence-fused-v3",
    "strategy:declared-equivalence-compiled-v2",
    "strategy:declared-equivalence-overlay-v1",
  ]);
  assert.equal(fixture.strategy_loop_runs[0].attempts_run, 15);
  assert.equal(fixture.strategy_loop_runs[0].hypotheses_created, 16);
  assert.equal(fixture.strategy_loop_runs[1].stop_reason, "no-gain");
  assert.equal(fixture.strategy_loop_runs[1].attempts_run, 2);
  assert.equal(fixture.strategy_loop_runs[1].hypotheses_created, 3);
  assert.equal(fixture.strategy_loop_runs[1].gain_trigger.metric, "deltas.p95_latency_regression_ratio");
  assert.equal(fixture.portfolio_runs.length, 5);
  assert.equal(fixture.portfolio_runs[0].hypotheses_declared, 3);
  assert.equal(fixture.portfolio_runs[0].screening_count, 3);
  assert.equal(fixture.portfolio_runs[0].survivor_count, 2);
  assert.equal(fixture.portfolio_runs[0].full_evaluation_count, 2);
  assert.equal(fixture.portfolio_runs[0].final_status, "PROVISIONAL");
  assert.equal(fixture.portfolio_runs[1].confirmation_dataset_revision, "v1:confirmation-even-v1");
  assert.equal(fixture.portfolio_runs[1].full_replications, 3);
  assert.equal(fixture.portfolio_runs[1].stop_reason, "no-full-survivor");
  assert.equal(fixture.portfolio_runs[1].final_status, "FAIL");
  assert.equal(fixture.portfolio_runs[2].hypotheses_declared, 5);
  assert.equal(fixture.portfolio_runs[2].full_replications, 3);
  assert.equal(fixture.portfolio_runs[2].stop_reason, "no-full-survivor");
  assert.equal(fixture.portfolio_runs[2].final_status, "FAIL");
  assert.equal(fixture.portfolio_runs[3].hypotheses_declared, 7);
  assert.equal(fixture.portfolio_runs[3].full_replications, 3);
  assert.equal(fixture.portfolio_runs[3].stop_reason, "no-full-survivor");
  assert.equal(fixture.portfolio_runs[3].final_status, "FAIL");
  assert.equal(fixture.portfolio_runs[4].hypotheses_declared, 7);
  assert.equal(fixture.portfolio_runs[4].full_replications, 3);
  assert.equal(fixture.portfolio_runs[4].stop_reason, "no-full-survivor");
  assert.equal(fixture.portfolio_runs[4].final_status, "FAIL");
});
