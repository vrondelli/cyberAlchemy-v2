import {readFileSync} from "node:fs";

import {canonicalJson} from "../../../packages/intent-route-resolver/index.mjs";
import {
  assessResearchHypothesis,
  createEngineVariant,
  createEvolutionRuntime,
  createHypothesisObservation,
  createImprovementTarget,
  createResearchExperiment,
  createResearchResult,
  createReproductionTrial,
  createTechniqueCandidate,
  createVariantComparison,
} from "../../../packages/evolution-runtime/index.mjs";
import {runAdaptiveReuseBenchmark, ARM_IDS} from "./adaptive-reuse.mjs";
import {loadBenchmark} from "./corpus.mjs";
import {packageRoot, sha256} from "./common.mjs";
import {createFixtureResearchProvider, runBenchmarkEvolutionCycle} from "./evolution-bridge.mjs";

function evidence(precision) {
  return {
    sampling_mode: "fixture",
    core: {
      result_id: `fixture:core:${precision}`,
      summary: {route_accuracy: 0.99, definition_recall: 0.97, context_precision: precision, false_direct_ambiguities: 0, determinism_mismatches: 0},
      metrics: {route: {p95_ms: 1}, request_selection: {p95_ms: 2}, preflight: {p95_ms: 20}},
      cases: {routing: [], context: []},
    },
    integration: {cases: {lifecycle: [{passed: true}], failure_safety: [{passed: true}]}},
    authority_measurement: {observed: true, violations: 0, case_ids: ["fixture:failure-safety"], basis: "explicit-fixture-safety-case"},
  };
}

function diagnosis() {
  return {
    schema_version: "are.reasoning-improvement-iteration/v1",
    iteration_id: "fixture:diagnosis:context-precision",
    evidence_digest: "d".repeat(64),
    status: "DIAGNOSED",
    findings: [{target_id: "context-precision", priority: 1, metric: "context_precision", value: 0.72, threshold: 0.8, meets_target: false, failed_cases: ["fixture:precision"], mutation_allowlist: ["packages/context-basis-runtime"],}],
  };
}

export async function runFixtureEvolutionCanary() {
  const evolutionProfile = JSON.parse(readFileSync(new URL("../../../packages/evolution-runtime/profiles/default-v1.json", import.meta.url), "utf8"));
  evolutionProfile.research.enabled = true;
  const provider = createFixtureResearchProvider(new URL("../fixtures/evolution/context-precision-research.json", import.meta.url));
  return runBenchmarkEvolutionCycle(loadBenchmark(packageRoot), {
    evolution_profile: evolutionProfile,
    diagnosis: diagnosis(),
    research_providers: [provider],
    reproduce: async ({technique}) => ({
      technique_ref: technique.record_id,
      environment_ref: "node:26.8.1-fixture",
      protocol_ref: "fixture:context-precision-reproduction-v1",
      expected_observations: technique.expected_observations,
      actual_observations: ["fixture context precision increased"],
      outcome: "reproduced",
    }),
    build_variant: async ({technique, reproduction}) => ({
      baseline_ref: "serving:fixture-baseline",
      source_tree_digest: "a".repeat(64),
      build_environment_ref: "node:26.8.1-fixture",
      technique_refs: [technique.record_id],
      reproduction_refs: [reproduction.record_id],
      changed_paths: ["packages/context-basis-runtime/index.mjs"],
    }),
    baseline_evidence: evidence(0.72),
    candidate_evidence: evidence(0.84),
    manifest_ref: "benchmark:real-reasoning-v1:fixture",
    environment_ref: "node:26.8.1-fixture",
    holdout_passed: true,
    keep_streak: evolutionProfile.upgrade.required_keep_streak,
  });
}

export function projectCanaryResult(result) {
  return {
    schema_version: "are.evolution-canary-result/v1",
    status: result.status,
    target_ref: result.target?.record_id ?? null,
    research_result_refs: result.research?.results?.map((item) => item.record_id) ?? [],
    technique_ref: result.technique?.record_id ?? null,
    reproduction_ref: result.reproduction?.record_id ?? null,
    variant_ref: result.variant?.record_id ?? null,
    comparison_ref: result.comparison?.record_id ?? null,
    comparison_outcome: result.comparison?.outcome ?? null,
    upgrade_decision_ref: result.decision?.record_id ?? null,
    upgrade_disposition: result.decision?.disposition ?? null,
    evolution_epoch_digest: result.sealed?.epoch?.epoch_digest ?? null,
    authority_effect: "none",
  };
}

function adaptiveMetrics(result) {
  const adaptive = result.metrics.by_arm[ARM_IDS[3]];
  return {
    stale_reuse_incidents: adaptive.stale_reuse_incidents,
    critical_fact_preservation_rate: adaptive.critical_fact_preservation_rate,
    intent_fidelity_rate: adaptive.intent_fidelity_rate,
    mean_byte_reduction_ratio: adaptive.mean_byte_reduction_ratio,
  };
}

function sourceTreeDigest() {
  const paths = [
    new URL("../../../packages/reasoning-state-runtime/index.mjs", import.meta.url),
    new URL("../../../packages/codex-app-server-wrapper/src/wrapper.mjs", import.meta.url),
  ];
  return sha256(canonicalJson(paths.map((path) => ({path: path.pathname, sha256: sha256(readFileSync(path, "utf8"))}))));
}

export async function runFailureLearningCanary(options = {}) {
  const benchmark = loadBenchmark(packageRoot);
  const benchmarkOptions = {warm_iterations: 0, timing_iterations: 0, enforce_performance: false};
  const baseline = await runAdaptiveReuseBenchmark(benchmark, {...benchmarkOptions, candidate_mode: "legacy-ungated-reuse"});
  if (baseline.status !== "FAIL") throw new Error("The registered legacy reuse baseline did not fail.");
  const hypothesis = baseline.improvement_feedback.hypotheses.find((entry) => entry.implementation_pattern === "bind-refresh-assessment-before-cache-eligibility");
  if (!hypothesis) throw new Error("The failed benchmark did not project the required context-bound reuse hypothesis.");
  const signal = baseline.improvement_feedback.signals.find((entry) => hypothesis.provenance_refs.includes(entry.record_id));
  if (!signal) throw new Error("The projected hypothesis is not bound to its improvement signal.");

  const treatment = await runAdaptiveReuseBenchmark(benchmark, {...benchmarkOptions, candidate_mode: "context-bound-refresh-gate"});
  const replay = await runAdaptiveReuseBenchmark(benchmark, {...benchmarkOptions, candidate_mode: "context-bound-refresh-gate"});
  const holdout = await runAdaptiveReuseBenchmark(benchmark, {...benchmarkOptions, candidate_mode: "context-bound-refresh-gate", holdout: true});
  const deterministic = canonicalJson({summary: treatment.summary, metrics: treatment.metrics, cases: treatment.cases})
    === canonicalJson({summary: replay.summary, metrics: replay.metrics, cases: replay.cases});

  const target = createImprovementTarget({
    target_key: "context-bound-cache-eligibility",
    signal_refs: [signal.record_id],
    metric: "stale_reuse_incidents",
    direction: "lower",
    baseline_ref: baseline.improvement_feedback.source_result_ref,
    baseline_value: baseline.metrics.stale_reuse_incidents,
    threshold: 0,
    priority: 1,
    protected_metrics: {critical_fact_preservation_rate: 0, intent_fidelity_rate: 0, mean_byte_reduction_ratio: 0},
    test_sets: ["adaptive-reuse", "adaptive-reuse-holdout"],
    mutation_allowlist: ["packages/reasoning-state-runtime/index.mjs", "packages/codex-app-server-wrapper/src/wrapper.mjs"],
    invalidation_rules: ["benchmark profile changed", "adaptive corpus changed", "selected dependency model changed"],
  });
  const research = createResearchResult({
    target_ref: target.record_id,
    provider_id: "are.failure-hypothesis-projection/v1",
    source_ref: hypothesis.record_id,
    source_version: hypothesis.record_digest,
    mechanism: hypothesis.mechanism,
    evidence: [signal.record_id, baseline.improvement_feedback.record_id],
    limitations: ["A deterministic structural benchmark does not observe an upstream provider cache hit."],
    fit_hypothesis: hypothesis.statement,
  });
  const technique = createTechniqueCandidate({
    target_ref: target.record_id,
    research_result_ref: research.record_id,
    mechanism: hypothesis.mechanism,
    integration_point: "packages/codex-app-server-wrapper/src/wrapper.mjs",
    required_dependencies: ["are.context-refresh-assessment/v1", "are.context-bound-reuse-receipt/v1"],
    expected_observations: ["selected dependency drift cannot retain exact-prefix eligibility", "unchanged plan-bound dependencies can reuse the exact prefix"],
    limitations: research.limitations,
  });
  const reproduction = createReproductionTrial({
    technique_ref: technique.record_id,
    environment_ref: `node:${process.version}:${process.platform}:${process.arch}`,
    protocol_ref: `benchmark:${benchmark.profile.benchmark_id}:adaptive-reuse`,
    expected_observations: technique.expected_observations,
    actual_observations: [`baseline stale reuse incidents: ${baseline.metrics.stale_reuse_incidents}`, `treatment stale reuse incidents: ${treatment.metrics.stale_reuse_incidents}`],
    deviations: [],
    outcome: baseline.status === "FAIL" && treatment.status === "PASS" ? "reproduced" : "not-reproduced",
  });
  const variant = createEngineVariant({
    baseline_ref: baseline.improvement_feedback.source_result_ref,
    source_tree_digest: sourceTreeDigest(),
    build_environment_ref: `node:${process.version}:${process.platform}:${process.arch}`,
    technique_refs: [technique.record_id],
    reproduction_refs: [reproduction.record_id],
    changed_paths: target.mutation_allowlist,
    change_digest: sha256(canonicalJson({implementation_pattern: hypothesis.implementation_pattern, technique_ref: technique.record_id})),
  });
  const comparison = createVariantComparison({
    variant_ref: variant.record_id,
    baseline_ref: variant.baseline_ref,
    target_ref: target.record_id,
    manifest_ref: `benchmark:${benchmark.profile.benchmark_id}:${baseline.profile_digest}`,
    environment_ref: `node:${process.version}:${process.platform}:${process.arch}`,
    baseline_metrics: adaptiveMetrics(baseline),
    candidate_metrics: adaptiveMetrics(treatment),
    fitness: {
      target_metric: "stale_reuse_incidents",
      direction: "lower",
      minimum_delta: 1,
      protected_quality: {critical_fact_preservation_rate: 0, intent_fidelity_rate: 0, mean_byte_reduction_ratio: 0},
      maximum_regression_ratio: {},
    },
    safety_passed: treatment.summary.checks.scenario_contracts && treatment.summary.checks.mandatory_reasoning_preserved,
    determinism_passed: deterministic,
    holdout_passed: holdout.status === "PASS",
    run_refs: [baseline.improvement_feedback.source_result_ref, treatment.improvement_feedback.source_result_ref, holdout.improvement_feedback.source_result_ref],
  });
  const observation = createHypothesisObservation({
    hypothesis_ref: hypothesis.record_id,
    source_result_ref: comparison.record_id,
    source_result_digest: comparison.record_digest,
    observation_kind: comparison.outcome === "KEEP" ? "supporting" : "counterevidence",
    phase: "experiment",
    claim: comparison.outcome === "KEEP"
      ? "The context-bound refresh gate removed stale reuse on the registered development and holdout corpora without protected-metric regression."
      : "The context-bound refresh gate did not satisfy the registered comparison contract.",
    evaluator_id: "are.failure-learning-canary/v1",
    evidence_refs: [baseline.improvement_feedback.record_id, treatment.improvement_feedback.record_id, holdout.improvement_feedback.record_id, comparison.record_id],
    limitations: ["Provider cache telemetry is unobserved because this canary is a deterministic structural run."],
  });
  const experiment = createResearchExperiment({
    hypothesis_ref: hypothesis.record_id,
    research_question: hypothesis.experiment_template.research_question,
    baseline_ref: baseline.improvement_feedback.source_result_ref,
    treatment_ref: variant.record_id,
    metrics: ["stale_reuse_incidents", "critical_fact_preservation_rate", "intent_fidelity_rate", "mean_byte_reduction_ratio"],
    dataset_refs: [`benchmark:${benchmark.profile.benchmark_id}:adaptive-reuse`, `benchmark:${benchmark.profile.benchmark_id}:adaptive-reuse-holdout`],
    required_repetitions: 1,
    success_criteria: hypothesis.experiment_template.success_criteria,
    stop_conditions: hypothesis.experiment_template.stop_conditions,
    observation_refs: [observation.record_id],
  });
  const assessed = assessResearchHypothesis(hypothesis, [observation], experiment, {minimum_replications: 1, minimum_experiment_support: 1});
  if (!assessed.ok) throw new Error(`Hypothesis assessment failed: ${assessed.reason_codes.join(",")}`);

  const evolutionProfile = JSON.parse(readFileSync(new URL("../../../packages/evolution-runtime/profiles/default-v1.json", import.meta.url), "utf8"));
  const runtime = createEvolutionRuntime({profile: evolutionProfile});
  for (const record of [signal, hypothesis, target, research, technique, reproduction, variant, comparison, observation, experiment, assessed.decision]) {
    const appended = runtime.append(record);
    if (!appended.ok) throw new Error(`Evolution record append failed: ${appended.reason_codes.join(",")}`);
  }
  const sealed = runtime.sealCycle({stage: "failure-learning-canary", hypothesis_ref: hypothesis.record_id, comparison_ref: comparison.record_id, learning_decision_ref: assessed.decision.record_id});
  if (!sealed.ok) throw new Error(`Evolution cycle seal failed: ${sealed.reason_codes.join(",")}`);

  return Object.freeze({
    schema_version: "are.failure-learning-canary-result/v1",
    mode: "failure-learning-canary",
    status: comparison.outcome,
    baseline,
    treatment,
    treatment_replay: replay,
    holdout,
    signal,
    hypothesis,
    target,
    research,
    technique,
    reproduction,
    variant,
    comparison,
    observation,
    experiment,
    learning_decision: assessed.decision,
    retained_learning: sealed,
    provider_cache_telemetry: {disposition: "unobserved", reason_codes: ["cache-telemetry.no-provider-usage-in-structural-canary"], authority_effect: "none"},
    runtime: runtime.inspect(),
    authority_effect: "none",
  });
}

export function projectFailureLearningCanary(result) {
  return {
    schema_version: "are.failure-learning-canary-summary/v1",
    status: result.status,
    baseline_status: result.baseline.status,
    treatment_status: result.treatment.status,
    holdout_status: result.holdout.status,
    baseline_stale_reuse_incidents: result.baseline.metrics.stale_reuse_incidents,
    treatment_stale_reuse_incidents: result.treatment.metrics.stale_reuse_incidents,
    hypothesis_ref: result.hypothesis.record_id,
    implementation_pattern: result.hypothesis.implementation_pattern,
    variant_ref: result.variant.record_id,
    comparison_ref: result.comparison.record_id,
    comparison_outcome: result.comparison.outcome,
    learning_decision_ref: result.learning_decision.record_id,
    learning_disposition: result.learning_decision.disposition,
    retained_epoch_digest: result.retained_learning.epoch.epoch_digest,
    provider_cache_posture: result.provider_cache_telemetry.disposition,
    authority_effect: "none",
  };
}
