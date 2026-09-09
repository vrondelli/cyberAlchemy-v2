import {canonicalJson, digestValue, fail, freezeResult, isRecord, nonEmptyString, uniqueStrings} from "./canonical.mjs";
import {digestIntentMaterial, verifyObjectiveState} from "../../request-intent-runtime/index.mjs";

export const REQUEST_CONTEXT_KEY = "cyberalchemy.request-context";

function contextHint(params) {
  const entry = params.additionalContext?.[REQUEST_CONTEXT_KEY];
  if (entry === undefined) return {ok: true, value: null};
  if (!isRecord(entry) || entry.kind !== "application" || !nonEmptyString(entry.value)) {
    return fail("request-context", ["request.context-hint-invalid"]);
  }
  let value;
  try { value = JSON.parse(entry.value); } catch { return fail("request-context", ["request.context-hint-json-invalid"]); }
  if (!isRecord(value) || value.schema_version !== "are.request-context-hint/v1" || !nonEmptyString(value.raw_request)) {
    return fail("request-context", ["request.context-hint-invalid"]);
  }
  return {ok: true, value};
}

function describeInput(item) {
  if (!isRecord(item) || !nonEmptyString(item.type)) return canonicalJson(item);
  if (item.type === "text" && typeof item.text === "string") return item.text;
  if (item.type === "image" && nonEmptyString(item.url)) return `[image:${item.url}]`;
  if (item.type === "localImage" && nonEmptyString(item.path)) return `[local-image:${item.path}]`;
  if (item.type === "audio" && nonEmptyString(item.url)) return `[audio:${item.url}]`;
  if (item.type === "localAudio" && nonEmptyString(item.path)) return `[local-audio:${item.path}]`;
  if ((item.type === "skill" || item.type === "mention") && nonEmptyString(item.name) && nonEmptyString(item.path)) return `[${item.type}:${item.name}:${item.path}]`;
  return canonicalJson(item);
}

export function buildRequestContext(message, turnBinding, objectiveResolution = null) {
  if (!isRecord(message) || message.method !== "turn/start" || !isRecord(message.params)) {
    return fail("request-context", ["request.turn-start-required"]);
  }
  if (!isRecord(turnBinding)) return fail("request-context", ["request.turn-binding-required"]);
  const input = message.params.input;
  if (!Array.isArray(input) || input.length === 0) return fail("request-context", ["request.input-required"]);
  if (!nonEmptyString(message.params.threadId)) return fail("request-context", ["request.thread-id-required"]);
  const hint = contextHint(message.params);
  if (!hint.ok) return hint;
  if (objectiveResolution) {
    const {resolution_digest, ...material} = objectiveResolution;
    const originalText = input.filter(item => isRecord(item) && item.type === "text" && typeof item.text === "string").map(item => item.text.trim()).join("\n");
    if (objectiveResolution.disposition !== "resolved" || objectiveResolution.authority_effect !== "none"
      || !verifyObjectiveState(objectiveResolution.next_state) || objectiveResolution.next_state.consumer_ref !== turnBinding.consumer_ref
      || digestIntentMaterial(material) !== resolution_digest || objectiveResolution.request_digest !== digestIntentMaterial(originalText)) {
      return fail("request-context", ["objective.resolution-request-binding-invalid"]);
    }
  }
  const rawRequest = (hint.value?.raw_request ?? input.map(describeInput).join("\n")).trim();
  if (!rawRequest) return fail("request-context", ["request.raw-request-empty"]);
  const requestId = nonEmptyString(turnBinding.request_id)
    ? turnBinding.request_id.trim()
    : `codex-request:${digestValue({rpc_id: message.id ?? null, thread_id: message.params.threadId, input})}`;
  const value = freezeResult({
    schema_version: "are.request-context/v1",
    request_id: requestId,
    raw_request: objectiveResolution?.next_state?.active_objective?.description ?? rawRequest,
    objective_kind: nonEmptyString(hint.value?.objective_kind) ? hint.value.objective_kind.trim() : nonEmptyString(turnBinding.objective_kind) ? turnBinding.objective_kind.trim() : null,
    requested_effects: uniqueStrings([...(turnBinding.requested_effects ?? []), ...(hint.value?.requested_effects ?? [])]),
    target_refs: uniqueStrings([...(turnBinding.target_refs ?? []), ...(hint.value?.target_refs ?? [])]),
    constraints: uniqueStrings([...(turnBinding.constraints ?? []), ...(hint.value?.constraints ?? [])]),
    evidence_refs: uniqueStrings([...(turnBinding.evidence_refs ?? []), ...(hint.value?.evidence_refs ?? []), `codex-input:${digestValue(input)}`, ...(objectiveResolution ? [`objective-resolution:${objectiveResolution.resolution_digest}`, `original-request:${digestValue(rawRequest)}`] : []), ...(hint.value ? [`request-context-hint:${digestValue(hint.value)}`] : [])]),
  });
  return freezeResult({
    ok: true,
    value,
    raw_input: input,
    raw_input_digest: digestValue(input),
    authority_effect: "none",
  });
}
