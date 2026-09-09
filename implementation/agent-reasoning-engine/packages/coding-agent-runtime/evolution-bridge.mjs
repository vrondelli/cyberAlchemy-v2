import {createEvolutionRuntime, createEvolutionScheduler, createImprovementSignal} from "../evolution-runtime/index.mjs";

function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function fail(...reason_codes) { return freeze({schema_version: "are.coding-agent-evolution-projection/v1", ok: false, reason_codes: [...new Set(reason_codes)].sort(), authority_effect: "none"}); }

export function projectAgentImprovementSignals({correction_signal_candidate = null, benchmark_result = null, user_selected = false} = {}) {
  if (user_selected !== true) return freeze({schema_version: "are.coding-agent-evolution-projection/v1", ok: true, disposition: "not-selected", signals: [], automatic_adoption: false, authority_effect: "none"});
  const signals = [];
  try {
    if (correction_signal_candidate !== null) {
      if (typeof correction_signal_candidate !== "object" || typeof correction_signal_candidate.kind !== "string" || !Array.isArray(correction_signal_candidate.provenance_refs)) return fail("evolution.correction-signal-invalid");
      signals.push(createImprovementSignal({...correction_signal_candidate, source_result_ref: correction_signal_candidate.provenance_refs[0] ?? "coding-agent:correction"}));
    }
    if (benchmark_result !== null) {
      if (benchmark_result.schema_version !== "are.coding-agent-integrated-benchmark/v1" || benchmark_result.status !== "MEASURED") return fail("evolution.benchmark-result-invalid");
      for (const metric of ["event_parse", "read_file", "search_text"]) {
        if (!Number.isFinite(benchmark_result[metric]?.p95_us)) return fail("evolution.benchmark-metric-invalid");
        signals.push(createImprovementSignal({kind: "coding-agent.latency", source_result_ref: `benchmark:${metric}`, scope: `coding-agent-runtime:${metric}`, observed_value: benchmark_result[metric].p95_us, expected_value: "lower", metric: "p95_us", provenance_refs: [benchmark_result.schema_version], confidence: 1}));
      }
    }
  } catch (error) { return fail(`evolution.projection-failed:${error.message}`); }
  return freeze({schema_version: "are.coding-agent-evolution-projection/v1", ok: true, disposition: signals.length ? "candidate-signals" : "no-signal", signals, automatic_adoption: false, next_authority: "evolution-runtime recommend-only review", authority_effect: "none"});
}

export async function runRecommendOnlyEvolutionCycle({evidence, user_selected = false, required_keep_streak_met = false} = {}) {
  if (user_selected !== true) return freeze({schema_version: "are.coding-agent-evolution-cycle/v1", ok: true, disposition: "not-selected", automatic_adoption: false, authority_effect: "none"});
  if (!evidence || typeof evidence !== "object" || typeof evidence.run_id !== "string" || typeof evidence.result_digest !== "string" || typeof evidence.source_tree_digest !== "string" || !Array.isArray(evidence.changed_paths)) return fail("evolution.run-evidence-invalid");
  const success = evidence.status === "PATCH_CANDIDATE";
  const profile = freeze({schema_version: "are.evolution-profile/v1", profile_id: `coding-agent:${evidence.run_id}`, research: {enabled: false, maximum_results_per_provider: 1}, target_selection: {minimum_signal_count: 1}, upgrade: {mode: "recommend-only", required_keep_streak: 1}, authority_effect: "none"});
  const targetProfiles = [{target_key: "coding-agent-run-quality", signal_kinds: ["coding-agent.run-outcome"], scope: "coding-agent-runtime", metric: "success_rate", direction: "higher", threshold: 0, priority: 1, protected_metrics: {}, test_sets: ["coding-agent-runtime"], mutation_allowlist: evidence.changed_paths, invalidation_rules: ["source-tree-drift"]}];
  const runtime = createEvolutionRuntime({profile, target_profiles: targetProfiles});
  const scheduler = createEvolutionScheduler({run_cycle: async () => {
    const signal = runtime.appendSignal({kind: "coding-agent.run-outcome", source_result_ref: evidence.result_digest, scope: "coding-agent-runtime", observed_value: success ? 1 : 0, expected_value: 1, metric: "success_rate", provenance_refs: [evidence.result_digest], confidence: 1});
    const target = runtime.selectTarget();
    if (!signal.ok || !target.ok || !target.target) return fail("evolution.target-unavailable");
    const research = runtime.appendResearchResult({target_ref: target.target.record_id, provider_id: "coding-agent-local-evidence", source_ref: evidence.result_digest, source_version: evidence.source_tree_digest, mechanism: "verified-run-evidence", evidence: [evidence.status], counterevidence: success ? [] : [evidence.status], limitations: ["single-run-evidence"], fit_hypothesis: "A verified candidate improves coding-agent success rate."});
    const hypothesis = runtime.appendHypothesis({hypothesis_key: `run-quality:${evidence.run_id}`, statement: "The candidate technique improves verified coding-agent success rate without safety regression.", mechanism: "bounded iterative reasoning with governed tools", falsifier: "Candidate success rate does not exceed baseline or a protected check regresses.", scope: "coding-agent-runtime", metrics: ["success_rate"], provenance_refs: [research.record.record_id], experiment_template: {research_question: "Does the candidate improve verified success rate?", baseline_ref: evidence.baseline_ref ?? "coding-agent:current", treatment_ref: evidence.candidate_ref ?? `coding-agent:candidate:${evidence.result_digest}`, dataset_refs: [evidence.run_id], required_repetitions: 1, success_criteria: {success_rate: "> baseline"}, stop_conditions: ["safety-regression"]}});
    const experiment = runtime.appendResearchExperiment({hypothesis_ref: hypothesis.record.record_id, research_question: "Does the candidate improve verified success rate?", baseline_ref: evidence.baseline_ref ?? "coding-agent:current", treatment_ref: evidence.candidate_ref ?? `coding-agent:candidate:${evidence.result_digest}`, metrics: ["success_rate"], dataset_refs: [evidence.run_id], required_repetitions: 1, success_criteria: {success_rate: "> baseline"}, stop_conditions: ["safety-regression"]});
    const technique = runtime.appendTechnique({target_ref: target.target.record_id, research_result_ref: research.record.record_id, mechanism: "governed-iterative-coding", integration_point: "coding-agent-runtime", required_dependencies: ["sandbox", "exact-approval"], expected_observations: ["verified-patch-candidate"], limitations: ["prototype-evidence"]});
    const reproduction = runtime.appendReproduction({technique_ref: technique.record.record_id, environment_ref: evidence.environment_ref ?? "coding-agent:test", protocol_ref: experiment.record.record_id, dependency_versions: evidence.dependency_versions ?? {}, expected_observations: ["verified-patch-candidate"], actual_observations: [evidence.status], deviations: [], outcome: success ? "reproduced" : "not-reproduced"});
    const variant = runtime.appendVariant({baseline_ref: evidence.baseline_ref ?? "coding-agent:current", source_tree_digest: evidence.source_tree_digest, build_environment_ref: evidence.environment_ref ?? "coding-agent:test", technique_refs: [technique.record.record_id], reproduction_refs: [reproduction.record.record_id], changed_paths: evidence.changed_paths});
    const baselineMetrics = evidence.baseline_metrics ?? {success_rate: 0};
    const candidateMetrics = evidence.candidate_metrics ?? {success_rate: success ? 1 : 0};
    const comparison = runtime.appendComparison({variant_ref: variant.record.record_id, baseline_ref: evidence.baseline_ref ?? "coding-agent:current", target_ref: target.target.record_id, manifest_ref: evidence.result_digest, environment_ref: evidence.environment_ref ?? "coding-agent:test", baseline_metrics: baselineMetrics, candidate_metrics: candidateMetrics, fitness: {target_metric: "success_rate", direction: "higher", minimum_delta: 0.01, protected_quality: {}, maximum_regression_ratio: {}}, safety_passed: evidence.safety_passed === true, determinism_passed: evidence.determinism_passed === true, holdout_passed: evidence.holdout_passed === true, run_refs: [evidence.run_id]});
    const upgrade = runtime.appendUpgradeDecision({current_version_ref: evidence.baseline_ref ?? "coding-agent:current", candidate_version_ref: variant.record.record_id, comparison_ref: comparison.record.record_id, comparison_outcome: comparison.record.outcome, required_keep_streak_met, reproduction_passed: reproduction.record.outcome === "reproduced", holdout_passed: evidence.holdout_passed === true, activation_enabled: false});
    const sealed = runtime.sealCycle({run_id: evidence.run_id, upgrade_decision_ref: upgrade.record.record_id});
    return freeze({ok: true, signal: signal.record, target: target.target, research: research.record, hypothesis: hypothesis.record, experiment: experiment.record, technique: technique.record, reproduction: reproduction.record, variant: variant.record, comparison: comparison.record, upgrade: upgrade.record, sealed_cycle: sealed.cycle, automatic_adoption: false, authority_effect: "none"});
  }});
  const scheduled = await scheduler.runOnce({trigger_id: `coding-agent:${evidence.run_id}:${evidence.result_digest}`});
  return freeze({schema_version: "are.coding-agent-evolution-cycle/v1", ok: scheduled.ok, disposition: scheduled.disposition, result: scheduled.result ?? null, scheduler: scheduler.inspect(), automatic_adoption: false, authority_effect: "none"});
}
