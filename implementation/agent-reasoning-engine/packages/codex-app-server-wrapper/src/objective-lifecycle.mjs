import {canonicalJson, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {createOwnedObjectiveLifecycle} from "./objective-session-lifecycle.mjs";

export const OBJECTIVE_CONTEXT_KEY = "cyberalchemy.are.objective";

// Codex wire normalization stays at the facade; durable lifecycle behavior is shared.
export function createCodexObjectiveLifecycle({profile_id, ...options}) {
  const owned = createOwnedObjectiveLifecycle({...options, normalize_request: ({message, binding}) => {
    if (!isRecord(message.params) || !nonEmptyString(message.params.threadId) || !Array.isArray(message.params.input)
      || message.params.input.some(item => !isRecord(item)) || !nonEmptyString(binding?.consumer_ref)
      || !["string", "number"].includes(typeof message.id)) return {ok: false, reason_codes: ["objective.codex-request-invalid"]};
    return {ok: true, value: {consumer_ref: binding.consumer_ref,
      scope_ref: canonicalJson([profile_id, message.params.threadId]), thread_ref: message.params.threadId,
      request: message.params.input.filter(item => item.type === "text" && typeof item.text === "string").map(item => item.text.trim()).join("\n"),
      request_ref: `codex-objective:${canonicalJson(message.params.clientUserMessageId ?? message.id)}`}};
  }});
  return {
    prepare(message, binding, loadSources = null, selected_context = [], trusted_requirement_seed = null) {
      return owned.prepare({message, binding}, loadSources, selected_context, trusted_requirement_seed);
    },
    inspect: owned.inspect,
  };
}

export function addObjectiveContext(message, objective) {
  if (!objective?.resolution) return message;
  const r = objective.resolution;
  return freezeResult({...message, params: {...message.params, additionalContext: {...message.params.additionalContext,
    [OBJECTIVE_CONTEXT_KEY]: {kind: "application", value: canonicalJson({schema_version: objective.requirement_continuity ? "are.codex-objective-fragment/v2" : "are.codex-objective-fragment/v1",
      active_objective: r.next_state.active_objective, state_digest: r.next_state.state_digest, resolution_digest: r.resolution_digest,
      transition: r.transition, classification_basis: r.classification_basis, completion_criteria_posture: r.completion_criteria_posture,
      ...(objective.requirement_continuity ? {requirement_snapshot: objective.requirement_continuity.snapshots.find(s => s.objective_id === r.next_state.active_objective.objective_id),
        requirement_continuity_digest: objective.requirement_continuity.continuity_digest} : {}),
      authority_effect: "none"})}}}});
}
