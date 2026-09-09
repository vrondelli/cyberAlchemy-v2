import assert from "node:assert/strict";
import test from "node:test";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {assessImpactCandidates, formatImpactProfileSummary, runImpactProfile, verifyImpactProfile} from "../src/impact-profiler.mjs";

test("impact gate rejects micro-optimizations below absolute product impact", () => {
  const result = assessImpactCandidates({
    boundary_p95_ms: 100,
    phase_metrics: {"micro-scorer": {p95_ms: 0.002, candidate_target: true}},
    thresholds: {minimum_absolute_savings_ms: 1, minimum_end_to_end_savings_ratio: 0.01, component_optimizable_fraction: 0.5},
  });
  assert.equal(result.status, "NO_ELIGIBLE_TARGET");
  assert.equal(result.candidates[0].gates.absolute_savings, false);
  assert.equal(result.candidates[0].eligible, false);
});

test("impact gate selects the largest candidate that clears both gates", () => {
  const result = assessImpactCandidates({
    boundary_p95_ms: 100,
    phase_metrics: {
      routing: {p95_ms: 0.5, candidate_target: true},
      preflight: {p95_ms: 12, candidate_target: true},
    },
    observed_comparisons: [{candidate_id: "reuse:context", target_phase: "turn", baseline_p95_ms: 100, candidate_p95_ms: 91}],
    thresholds: {minimum_absolute_savings_ms: 1, minimum_end_to_end_savings_ratio: 0.01, component_optimizable_fraction: 0.5},
  });
  assert.equal(result.status, "TARGET_SELECTED");
  assert.equal(result.selected_candidate.candidate_id, "reuse:context");
  assert.equal(result.selected_candidate.evidence_kind, "observed-comparison");
  assert.equal(result.selected_candidate.potential_savings_ms, 9);
});

test("impact gate preserves but does not reselect a current retained candidate", () => {
  const result = assessImpactCandidates({
    boundary_p95_ms: 100,
    observed_comparisons: [
      {candidate_id: "hash:native", target_phase: "source-refresh", baseline_p95_ms: 80, candidate_p95_ms: 10},
      {candidate_id: "reuse:projection", target_phase: "projection", baseline_p95_ms: 100, candidate_p95_ms: 90},
    ],
    retained_candidates: [{candidate_id: "hash:native", retention_ref: "improvement-retention:fixture"}],
    thresholds: {minimum_absolute_savings_ms: 1, minimum_end_to_end_savings_ratio: 0.01, component_optimizable_fraction: 0.5},
  });
  assert.equal(result.selected_candidate.candidate_id, "reuse:projection");
  const retained = result.retained_candidates[0];
  assert.equal(retained.candidate_id, "hash:native");
  assert.equal(retained.eligible, false);
  assert.deepEqual(retained.reason_codes, ["impact.candidate-already-retained"]);
});

test("local impact profile measures real phases and exposes non-additive boundaries", async () => {
  // This phase-measurement test must not assume that historical retained
  // measurements still bind a configuration file after product construction.
  // Retention selection is tested above; this case measures both arms freshly.
  const benchmark = loadBenchmark(packageRoot);
  const result = await runImpactProfile({...benchmark, profile: {...benchmark.profile,
    impact_profiling: {...benchmark.profile.impact_profiling, retention_records: []}}}, {warm_iterations: 1, iterations: 2});
  assert.equal(result.schema_version, "are.local-turn-impact-profile/v1");
  assert.equal(result.authority_effect, "none");
  assert.equal(result.sampling.iterations, 2);
  assert.ok(Number.isFinite(result.phase_metrics["local-turn-start-cold"].p95_ms));
  assert.ok(Number.isFinite(result.phase_metrics["local-turn-start-plan-reuse"].p95_ms));
  assert.ok(Number.isFinite(result.phase_metrics["local-turn-start-interaction-reassembled"].p95_ms));
  assert.ok(Number.isFinite(result.phase_metrics["local-turn-start-interaction-projection-reuse"].p95_ms));
  assert.equal(result.interaction_comparison_design.kind, "counterbalanced-isolated-successor-pairs");
  assert.equal(result.interaction_comparison_design.observed_valid_reassembled, 3);
  assert.equal(result.interaction_comparison_design.observed_valid_reused, 3);
  assert.equal(result.source_refresh_comparison_design.kind, "counterbalanced-full-read-and-hash");
  assert.equal(result.source_refresh_comparison_design.observed_valid_portable, 3);
  assert.equal(result.source_refresh_comparison_design.observed_valid_native, 3);
  assert.equal(result.source_refresh_comparison_design.required_valid_observations_per_arm, 3);
  assert.equal(result.improvement_retention.configured_record_count, 0);
  assert.deepEqual(result.improvement_retention.current, []);
  assert.deepEqual(result.improvement_retention.diagnostics, []);
  assert.deepEqual(result.impact_assessment.retained_candidates, []);
  assert.equal(result.preflight_phase_observation.output_bytes_changed, false);
  assert.equal(result.preflight_phase_observation.observed_phases["context-envelope-assembly"], 2);
  assert.ok(Number.isFinite(result.phase_metrics["turn-preflight:context-envelope-assembly"].p95_ms));
  assert.equal(result.envelope_hash_comparison_design.kind, "counterbalanced-byte-identical-envelope-assembly");
  assert.equal(result.envelope_hash_comparison_design.observed_valid_portable, 3);
  assert.equal(result.envelope_hash_comparison_design.observed_valid_native, 3);
  assert.equal(result.envelope_hash_comparison_design.required_valid_observations_per_arm, 3);
  assert.equal(result.envelope_hash_comparison_design.output_bytes_equal, true);
  assert.equal(result.impact_assessment.candidates.some((candidate) => candidate.candidate_id === "hash:context-envelope-native-sha256" && candidate.evidence_kind === "observed-comparison"), true);
  assert.equal(result.impact_assessment.candidates.some((candidate) => candidate.candidate_id === "hash:live-source-native-sha256" && candidate.evidence_kind === "observed-comparison"), true);
  assert.equal(result.impact_assessment.candidates.some((candidate) => candidate.candidate_id === "reuse:interaction-bound-content-projection" && candidate.evidence_kind === "observed-comparison"), true);
  assert.ok(result.phase_metrics["request-routing"].observation_checksum > 0);
  assert.equal(result.phase_relationships.every((entry) => entry.additive === false), true);
  assert.ok(["TARGET_SELECTED", "NO_ELIGIBLE_TARGET"].includes(result.status));
  assert.match(formatImpactProfileSummary(result), /impact-profile status=/);
  assert.equal(verifyImpactProfile(result, result.profile_digest).ok, true);
  const tampered = structuredClone(result);
  tampered.status = "TAMPERED";
  assert.deepEqual(verifyImpactProfile(tampered).reason_codes, ["impact.profile-digest-invalid"]);
});
