import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CODEX_MODEL_ENTRY_RECEIPT_SCHEMA = "are.codex-model-entry-receipt/v1";
const DIGEST = /^[0-9a-f]{64}$/u;
const FIELDS = ["schema_version", "source", "thread_ref", "forwarded_message_digest",
  "request_binding_digest", "objective_resolution_digest", "objective_state_digest",
  "objective_id_digest", "requirement_continuity_digest", "route_id",
  "route_decision_digest", "context_envelope_digest", "plan_context_digest",
  "semantic_state_digest", "reasoning_checkpoint_digest", "authority_effect", "receipt_digest"];
const DIGEST_FIELDS = FIELDS.filter((field) => field.endsWith("_digest")
  && field !== "plan_context_digest" && field !== "receipt_digest");

export function verifyCodexModelEntryReceipt(receipt, {forwarded_message = null,
  request_binding_digest = null} = {}) {
  if (!isRecord(receipt) || Object.keys(receipt).sort().join(",") !== [...FIELDS].sort().join(",")
    || receipt.schema_version !== CODEX_MODEL_ENTRY_RECEIPT_SCHEMA
    || !["direct", "generated"].includes(receipt.source)
    || !/^backend-thread:[0-9a-f]{64}$/u.test(receipt.thread_ref ?? "")
    || !nonEmptyString(receipt.route_id) || receipt.route_id.length > 256
    || receipt.authority_effect !== "none"
    || !DIGEST_FIELDS.every((field) => DIGEST.test(receipt[field] ?? ""))
    || (receipt.plan_context_digest !== null && !DIGEST.test(receipt.plan_context_digest ?? ""))
    || !DIGEST.test(receipt.receipt_digest ?? "")) return false;
  const {receipt_digest: _digest, ...material} = receipt;
  if (digestValue(material) !== receipt.receipt_digest) return false;
  if (forwarded_message !== null && (!isRecord(forwarded_message)
    || forwarded_message.method !== "turn/start"
    || !nonEmptyString(forwarded_message.params?.threadId)
    || receipt.thread_ref !== `backend-thread:${digestValue(forwarded_message.params.threadId)}`
    || receipt.forwarded_message_digest !== digestValue(forwarded_message))) return false;
  return request_binding_digest === null || receipt.request_binding_digest === request_binding_digest;
}

/** Projection of already checkpointed wrapper state, never an identity credential. */
export function createCodexModelEntryReceipt({source, forwarded_message, semantic_state,
  semantic_state_digest, reasoning_checkpoint_digest, objective_lifecycle} = {}) {
  const resolution = objective_lifecycle?.resolution;
  const continuity = objective_lifecycle?.requirement_continuity;
  if (!resolution || !continuity) return null;
  const state = semantic_state;
  const route = state?.route_decision;
  let forwardedObjective;
  try {
    forwardedObjective = JSON.parse(forwarded_message?.params?.additionalContext?.["cyberalchemy.are.objective"]?.value);
  } catch { throw new TypeError("model-entry.objective-fragment-invalid"); }
  if (!isRecord(state) || state.schema_version !== "are.codex-semantic-turn-state/v1"
    || digestValue(state) !== semantic_state_digest
    || !isRecord(route) || route.kind !== "direct" || !nonEmptyString(route.selected?.route_id)
    || !isRecord(state.context_envelope) || !DIGEST.test(state.context_envelope_digest ?? "")
    || state.context_envelope.digest !== state.context_envelope_digest
    || !DIGEST.test(state.request_binding_digest ?? "")
    || !DIGEST.test(reasoning_checkpoint_digest ?? "")
    || !DIGEST.test(resolution.resolution_digest ?? "")
    || !DIGEST.test(resolution.next_state?.state_digest ?? "")
    || !nonEmptyString(resolution.next_state?.active_objective?.objective_id)
    || !DIGEST.test(continuity.continuity_digest ?? "")
    || forwardedObjective?.schema_version !== "are.codex-objective-fragment/v2"
    || forwardedObjective.resolution_digest !== resolution.resolution_digest
    || forwardedObjective.state_digest !== resolution.next_state.state_digest
    || forwardedObjective.requirement_continuity_digest !== continuity.continuity_digest
    || forwardedObjective.active_objective?.objective_id !== resolution.next_state.active_objective.objective_id
    || !state.request_context?.evidence_refs?.includes(`objective-resolution:${resolution.resolution_digest}`)) {
    throw new TypeError("model-entry.receipt-source-invalid");
  }
  const material = {schema_version: CODEX_MODEL_ENTRY_RECEIPT_SCHEMA, source,
    thread_ref: `backend-thread:${digestValue(state.thread_id)}`,
    forwarded_message_digest: digestValue(forwarded_message),
    request_binding_digest: state.request_binding_digest,
    objective_resolution_digest: resolution.resolution_digest,
    objective_state_digest: resolution.next_state.state_digest,
    objective_id_digest: digestValue(resolution.next_state.active_objective.objective_id),
    requirement_continuity_digest: continuity.continuity_digest,
    route_id: route.selected.route_id, route_decision_digest: route.decision_digest,
    context_envelope_digest: state.context_envelope_digest,
    plan_context_digest: state.plan_context_digest ?? null,
    semantic_state_digest, reasoning_checkpoint_digest, authority_effect: "none"};
  const receipt = freezeResult({...material, receipt_digest: digestValue(material)});
  if (!verifyCodexModelEntryReceipt(receipt, {forwarded_message})) {
    throw new TypeError("model-entry.receipt-invalid");
  }
  return receipt;
}
