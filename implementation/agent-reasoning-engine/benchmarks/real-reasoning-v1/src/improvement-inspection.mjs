import {canonicalJson, canonicalizeJson, deepFreeze} from "../../../packages/intent-route-resolver/index.mjs";
import {attachImprovementFeedback, sha256} from "./common.mjs";
import {projectFailureLearningCanary} from "./evolution-canary.mjs";

export function inspectImprovementArtifact(artifact, options = {}) {
  if (artifact === null || typeof artifact !== "object" || Array.isArray(artifact)) throw new TypeError("An improvement artifact object is required.");
  if (artifact.schema_version === "are.failure-learning-canary-result/v1") {
    const summary = projectFailureLearningCanary(artifact);
    return deepFreeze(canonicalizeJson({
      schema_version: "are.improvement-inspection/v1",
      source_schema: artifact.schema_version,
      source_digest: sha256(canonicalJson(canonicalizeJson(artifact))),
      source_bytes_sha256: options.source_bytes_sha256 ?? null,
      mode: artifact.mode,
      status: artifact.status,
      hypothesis: {record_id: artifact.hypothesis.record_id, implementation_pattern: artifact.hypothesis.implementation_pattern, statement: artifact.hypothesis.statement},
      comparison: {record_id: artifact.comparison.record_id, outcome: artifact.comparison.outcome, reason_codes: artifact.comparison.reason_codes},
      learning: {decision_ref: artifact.learning_decision.record_id, disposition: artifact.learning_decision.disposition, retained_epoch_digest: artifact.retained_learning.epoch.epoch_digest},
      provider_cache_telemetry: artifact.provider_cache_telemetry,
      summary,
      authority_effect: "none",
    }));
  }
  if (artifact.schema_version !== "are.real-reasoning-benchmark-result/v1") throw new TypeError(`Unsupported improvement artifact schema: ${artifact.schema_version ?? "missing"}`);
  const bound = attachImprovementFeedback(artifact);
  const feedback = bound.improvement_feedback;
  return deepFreeze(canonicalizeJson({
    schema_version: "are.improvement-inspection/v1",
    source_schema: bound.schema_version,
    source_digest: sha256(canonicalJson(canonicalizeJson(artifact))),
    source_bytes_sha256: options.source_bytes_sha256 ?? null,
    benchmark_id: bound.benchmark_id,
    mode: bound.mode,
    status: bound.status,
    feedback: {
      disposition: feedback.disposition,
      failed_check_keys: feedback.failed_check_keys,
      failed_scenario_ids: feedback.failed_scenario_ids,
      hypotheses: feedback.hypotheses.map((hypothesis) => ({record_id: hypothesis.record_id, implementation_pattern: hypothesis.implementation_pattern, statement: hypothesis.statement})),
    },
    provider_cache_telemetry: bound.metrics?.by_arm
      ? Object.fromEntries(Object.entries(bound.metrics.by_arm).map(([arm, metrics]) => [arm, {cache_hit_posture: metrics.cache_hit_posture ?? "not-applicable", reused_prefix_bytes: metrics.reused_prefix_bytes ?? null}]))
      : null,
    claim_limit: bound.claim_limit,
    authority_effect: "none",
  }));
}
