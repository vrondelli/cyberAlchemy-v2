import {digest, sealed, text} from "./canonical.mjs";
import {fail, pass, verifyRecordDigest} from "./contracts.mjs";

export const USABILITY_OBSERVATION_SCHEMA = "are.usability-observation/v1";
export const FAILURE_CLASSIFICATION_SCHEMA = "are.failure-classification/v1";
export const IMPROVEMENT_HANDOFF_SCHEMA = "are.improvement-handoff/v1";

const failureDomains = new Set(["reasoning-engine", "interaction-adapter", "conversation-protocol", "not_evaluable"]);

export function createUsabilityObservation(input = {}) {
  if (!/^[a-f0-9]{64}$/u.test(input.source_benchmark_result_digest ?? "") || !text(input.scenario_id) || !text(input.observed_behavior) || !text(input.expected_behavior)) {
    throw new TypeError("Usability observation requires exact source digest, scenario, observed behavior, and expected behavior");
  }
  if (!["FAIL", "NOT_EVALUATED"].includes(input.status)) throw new TypeError("Usability observation status must be FAIL or NOT_EVALUATED");
  if (!failureDomains.has(input.failure_domain)) throw new TypeError("Usability observation requires its evidence-bound failure domain");
  if (input.failure_domain === "reasoning-engine" && !text(input.target_component)) throw new TypeError("Reasoning-engine observation requires its target component");
  return sealed(USABILITY_OBSERVATION_SCHEMA, {
    source_benchmark_result_digest: input.source_benchmark_result_digest,
    scenario_id: input.scenario_id.trim(),
    status: input.status,
    observed_behavior: input.observed_behavior.trim(),
    expected_behavior: input.expected_behavior.trim(),
    failure_domain: input.failure_domain,
    target_component: text(input.target_component) ? input.target_component.trim() : null,
    evidence_refs: Array.isArray(input.evidence_refs) ? [...new Set(input.evidence_refs.filter(text))].sort() : [],
  }, "observation_digest");
}

export function classifyUsabilityFailure(input = {}) {
  if (!verifyRecordDigest(input.observation, "observation_digest")) return fail("failure-classification", ["usability.observation-invalid"]);
  const failureDomain = input.observation.failure_domain;
  if (!failureDomains.has(failureDomain)) return fail("failure-classification", ["usability.failure-domain-invalid"]);
  if (input.failure_domain !== undefined && input.failure_domain !== failureDomain) return fail("failure-classification", ["usability.failure-domain-evidence-mismatch"]);
  if (failureDomain === "reasoning-engine" && !text(input.observation.target_component)) return fail("failure-classification", ["usability.engine-target-required"]);
  const classification = sealed(FAILURE_CLASSIFICATION_SCHEMA, {
    observation_ref: input.observation.observation_digest,
    failure_domain: failureDomain,
    failure_kind: text(input.failure_kind) ? input.failure_kind.trim() : "unclassified",
    target_component: input.observation.target_component,
    rationale: text(input.rationale) ? input.rationale.trim() : null,
    disposition: failureDomain === "reasoning-engine" ? "engine-improvement-candidate"
      : failureDomain === "interaction-adapter" ? "interaction-adapter-improvement-candidate"
        : failureDomain === "conversation-protocol" ? "protocol-improvement-candidate" : "not-evaluable",
  }, "classification_digest");
  return pass(classification);
}

export function createEngineImprovementHandoff(input = {}) {
  const observation = input.observation;
  const classification = input.classification;
  if (!verifyRecordDigest(observation, "observation_digest")) return fail("engine-improvement-handoff", ["usability.observation-invalid"]);
  if (!verifyRecordDigest(classification, "classification_digest") || classification.observation_ref !== observation.observation_digest) return fail("engine-improvement-handoff", ["usability.classification-invalid"]);
  if (observation.status === "NOT_EVALUATED") return fail("engine-improvement-handoff", ["usability.not-evaluated-no-handoff"]);
  if (classification.failure_domain !== "reasoning-engine" || classification.disposition !== "engine-improvement-candidate") {
    return fail("engine-improvement-handoff", ["usability.failure-not-engine-owned"]);
  }
  const handoff = sealed(IMPROVEMENT_HANDOFF_SCHEMA, {
    source_benchmark_result_digest: observation.source_benchmark_result_digest,
    scenario_ids: [observation.scenario_id],
    observation_ref: observation.observation_digest,
    classification_ref: classification.classification_digest,
    failure_kind: classification.failure_kind,
    target_component: classification.target_component,
    replay_refs: [`scenario:${observation.scenario_id}`],
    protected_checks: Array.isArray(input.protected_checks) ? [...new Set(input.protected_checks.filter(text))].sort() : ["authority_violations", "previously_passing_checks"],
    disposition: "research-hypothesis-candidate",
    claim_ceiling: "Improvement evidence only; no implementation, adoption, activation, publication, deployment, or effect authority.",
  }, "handoff_digest");
  return pass(handoff);
}

export function projectEngineHandoffToHypotheses({handoff, benchmark_result: benchmarkResult, projector} = {}) {
  if (!verifyRecordDigest(handoff, "handoff_digest")) return fail("engine-handoff-projection", ["usability.handoff-invalid"]);
  const actualDigest = digest(benchmarkResult);
  if (actualDigest !== handoff.source_benchmark_result_digest) return fail("engine-handoff-projection", ["usability.benchmark-digest-mismatch"]);
  if (typeof projector !== "function") return fail("engine-handoff-projection", ["usability.research-projector-required"]);
  const projected = projector({benchmark_result: benchmarkResult, expected_result_digest: actualDigest});
  if (!projected.ok) return projected;
  const failedScenarioIds = new Set(projected.value.failed_scenario_ids);
  if (handoff.scenario_ids.some((id) => !failedScenarioIds.has(id))) return fail("engine-handoff-projection", ["usability.handoff-scenario-not-failed"]);
  return pass(projected.value, {handoff_digest: handoff.handoff_digest});
}
