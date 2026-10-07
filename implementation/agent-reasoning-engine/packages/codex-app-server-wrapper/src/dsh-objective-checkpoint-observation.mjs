import {freezeResult, isRecord} from "./canonical.mjs";
import {verifyReasoningPlanContext} from "../../reasoning-state-runtime/plan-context.mjs";

const DIGEST = /^[0-9a-f]{64}$/u;
const FIELDS = ["scope_digest", "objective_state_digest", "resolution_digest",
  "preflight_event_digest", "checkpoint_digest", "binding_digest"];

export function validDshPlanHeadSummary(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'checkpoint_digest,plan_context_digest,plan_progress,schema_version,selection_relation,sources,status'
    || value.schema_version !== 'are.dsh-plan-head-summary/v1') return false;
  if (['not-retained', 'unavailable'].includes(value.status)) return value.checkpoint_digest === null
    && value.plan_context_digest === null && value.plan_progress === null
    && value.sources === 'not-checked' && value.selection_relation === 'not-checked';
  return value.status === 'checkpoint-retained'
    && typeof value.checkpoint_digest === 'string' && DIGEST.test(value.checkpoint_digest)
    && typeof value.plan_context_digest === 'string' && DIGEST.test(value.plan_context_digest)
    && validDshPlanProgress(value.plan_progress)
    && ['verified-at-read', 'unverified-at-read'].includes(value.sources)
    && ['matches-startup', 'different-from-startup'].includes(value.selection_relation);
}

export function emptyDshPlanHeadSummary(status) {
  const value = {schema_version: 'are.dsh-plan-head-summary/v1', status, checkpoint_digest: null,
    plan_context_digest: null, plan_progress: null, sources: 'not-checked', selection_relation: 'not-checked'};
  if (!validDshPlanHeadSummary(value)) throw new TypeError('gateway.dsh-plan-head-invalid');
  return freezeResult(value);
}

export function validDshPlanProgress(value) {
  const keys = ['schema_version', 'posture', 'obligation_count', 'completed_count', 'open_count',
    'active_count', 'deferred_count', 'open_decision_count', 'active_slice_ordinal', 'active_slice_status'];
  return isRecord(value) && Object.keys(value).sort().join(',') === keys.sort().join(',')
    && value.schema_version === 'are.dsh-plan-progress/v1' && value.posture === 'checkpointed-declaration'
    && keys.filter(key => key.endsWith('_count') || key === 'active_slice_ordinal')
      .every(key => Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 32)
    && value.obligation_count > 0
    && value.completed_count + value.open_count + value.active_count + value.deferred_count === value.obligation_count
    && value.active_slice_ordinal > 0 && value.active_slice_ordinal <= value.obligation_count
    && ['open', 'active', 'deferred'].includes(value.active_slice_status)
    && value[`${value.active_slice_status}_count`] > 0;
}

/** Counts from an exact verified typed plan; declarations, never turn-derived completion. */
export function projectDshPlanProgress(plan) {
  if (!verifyReasoningPlanContext(plan).ok) throw new TypeError('gateway.dsh-plan-progress-invalid');
  const ordinal = plan.feature_obligations.findIndex(row => row.obligation_id === plan.active_slice_id);
  const value = {schema_version: 'are.dsh-plan-progress/v1', posture: 'checkpointed-declaration',
    obligation_count: plan.feature_obligations.length,
    ...Object.fromEntries(['completed', 'open', 'active', 'deferred'].map(status =>
      [`${status}_count`, plan.feature_obligations.filter(row => row.status === status).length])),
    open_decision_count: plan.unresolved_decisions.length, active_slice_ordinal: ordinal + 1,
    active_slice_status: plan.feature_obligations[ordinal]?.status};
  if (!validDshPlanProgress(value)) throw new TypeError('gateway.dsh-plan-progress-invalid');
  return freezeResult(value);
}

export function validDshInterpretationObservation(value) {
  const progress = Object.hasOwn(value ?? {}, 'plan_progress');
  return isRecord(value)
    && Object.keys(value).sort().join(",") === `authority_effect,binding_id_digest,checkpoint_digest,generation,interpretation_event_digest,kind,objective_state_digest,observation_digest,plan_context_digest,${progress ? 'plan_progress,' : ''}request_ref_digest,requirement_continuity_digest,resolution_digest,scope_digest,thread_ref,turn_ref`
    && (!progress || validDshPlanProgress(value.plan_progress)
      && value.plan_context_digest !== null && value.requirement_continuity_digest !== null)
    && value.kind === "dsh-objective-interpretation-observed" && value.turn_ref === null
    && value.authority_effect === "none"
    && Number.isSafeInteger(value.generation) && value.generation >= 1
    && typeof value.thread_ref === "string" && /^backend-thread:[0-9a-f]{64}$/u.test(value.thread_ref)
    && ["binding_id_digest", "checkpoint_digest", "interpretation_event_digest",
      "objective_state_digest", "observation_digest", "request_ref_digest", "resolution_digest", "scope_digest"]
      .every(key => typeof value[key] === "string" && DIGEST.test(value[key]))
    && ["plan_context_digest", "requirement_continuity_digest"]
      .every(key => value[key] === null || typeof value[key] === "string" && DIGEST.test(value[key]));
}

export function validDshInterpretationSummary(value) {
  const progress = value?.schema_version === 'are.dsh-objective-interpretation-summary/v2';
  return isRecord(value)
    && Object.keys(value).sort().join(",") === `checkpoint_digest,objective_state_digest,plan_context_digest,${progress ? 'plan_progress,' : ''}requirements,schema_version,status`
    && ['are.dsh-objective-interpretation-summary/v1', 'are.dsh-objective-interpretation-summary/v2'].includes(value.schema_version)
    && (!progress || validDshPlanProgress(value.plan_progress)
      && value.plan_context_digest !== null && value.requirements === 'continuity-reference-retained')
    && value.status === "checkpoint-retained-no-admission-retained"
    && ["checkpoint_digest", "objective_state_digest"]
      .every(key => typeof value[key] === "string" && DIGEST.test(value[key]))
    && (value.plan_context_digest === null
      || typeof value.plan_context_digest === "string" && DIGEST.test(value.plan_context_digest))
    && ["not-selected", "continuity-reference-retained"].includes(value.requirements);
}

/** A Host-reported reference, not independent ledger replay or a rejection verdict. */
export function summarizeDshInterpretation(value) {
  if (!validDshInterpretationObservation(value)) throw new TypeError("gateway.dsh-interpretation-invalid");
  const progress = Object.hasOwn(value, 'plan_progress');
  return freezeResult({schema_version: progress ? 'are.dsh-objective-interpretation-summary/v2' : "are.dsh-objective-interpretation-summary/v1",
    status: "checkpoint-retained-no-admission-retained", checkpoint_digest: value.checkpoint_digest,
    objective_state_digest: value.objective_state_digest, plan_context_digest: value.plan_context_digest,
    requirements: value.requirement_continuity_digest === null ? "not-selected" : "continuity-reference-retained",
    ...(progress ? {plan_progress: value.plan_progress} : {})});
}

export function validDshObjectiveCheckpoint(value) {
  return isRecord(value)
    && (value.schema_version === "are.dsh-objective-checkpoint-observation/v1"
      ? Object.keys(value).length === 8 && !Object.hasOwn(value, "plan_context_digest")
      : ['are.dsh-objective-checkpoint-observation/v2', 'are.dsh-objective-checkpoint-observation/v3'].includes(value.schema_version)
        && Object.keys(value).length === (value.schema_version.endsWith('/v3') ? 10 : 9)
        && (value.schema_version.endsWith('/v3') ? validDshPlanProgress(value.plan_progress)
          && value.requirement_continuity_digest !== null : !Object.hasOwn(value, 'plan_progress'))
        && typeof value.plan_context_digest === "string" && DIGEST.test(value.plan_context_digest))
    && FIELDS.every(key => typeof value[key] === "string" && DIGEST.test(value[key]))
    && (value.requirement_continuity_digest === null
      || typeof value.requirement_continuity_digest === "string"
        && DIGEST.test(value.requirement_continuity_digest));
}

/** A projection of an already validated Host preparation, not independent ledger verification. */
export function projectDshObjectiveCheckpoint(binding, plan_progress) {
  const selected = Object.hasOwn(binding ?? {}, "plan_context_digest");
  const value = {schema_version: selected ? plan_progress === undefined ? "are.dsh-objective-checkpoint-observation/v2" : "are.dsh-objective-checkpoint-observation/v3"
      : "are.dsh-objective-checkpoint-observation/v1",
    ...Object.fromEntries(FIELDS.map(key => [key, binding?.[key]])),
    requirement_continuity_digest: binding?.requirement_continuity_digest,
    ...(selected ? {plan_context_digest: binding.plan_context_digest} : {}),
    ...(plan_progress === undefined ? {} : {plan_progress})};
  if (!validDshObjectiveCheckpoint(value)) throw new TypeError("gateway.dsh-objective-checkpoint-invalid");
  return freezeResult(value);
}

export function validDshObjectiveCheckpointSummary(value) {
  return isRecord(value)
    && (value.schema_version === "are.dsh-objective-checkpoint-summary/v1"
      ? Object.keys(value).length === 6 && !Object.hasOwn(value, "plan_context_digest")
      : ['are.dsh-objective-checkpoint-summary/v2', 'are.dsh-objective-checkpoint-summary/v3'].includes(value.schema_version)
        && Object.keys(value).length === (value.schema_version.endsWith('/v3') ? 8 : 7)
        && (value.schema_version.endsWith('/v3') ? validDshPlanProgress(value.plan_progress)
          && value.requirements === 'continuity-reference-retained' : !Object.hasOwn(value, 'plan_progress'))
        && typeof value.plan_context_digest === "string" && DIGEST.test(value.plan_context_digest))
    && value.status === "host-retained-reference"
    && ["checkpoint_digest", "objective_state_digest", "binding_digest"]
      .every(key => typeof value[key] === "string" && DIGEST.test(value[key]))
    && ["not-selected", "continuity-reference-retained"].includes(value.requirements);
}

/** Bounded observer summary: no objective text, requirement text, or raw identities. */
export function summarizeDshObjectiveCheckpoint(value) {
  if (!validDshObjectiveCheckpoint(value)) throw new TypeError("gateway.dsh-objective-checkpoint-invalid");
  const selected = value.schema_version !== "are.dsh-objective-checkpoint-observation/v1";
  const progress = value.schema_version === 'are.dsh-objective-checkpoint-observation/v3';
  return freezeResult({schema_version: selected ? progress ? "are.dsh-objective-checkpoint-summary/v3" : "are.dsh-objective-checkpoint-summary/v2"
      : "are.dsh-objective-checkpoint-summary/v1",
    status: "host-retained-reference", checkpoint_digest: value.checkpoint_digest,
    objective_state_digest: value.objective_state_digest, binding_digest: value.binding_digest,
    requirements: value.requirement_continuity_digest === null
      ? "not-selected" : "continuity-reference-retained",
    ...(selected ? {plan_context_digest: value.plan_context_digest} : {}),
    ...(progress ? {plan_progress: value.plan_progress} : {})});
}
