import {evaluateContinuation} from "../../request-decision-router/index.mjs";
import {digestValue, fail, freezeResult, isRecord, nonEmptyString, uniqueStrings} from "./canonical.mjs";
import {approvalAccepted, denyApprovalResult, EFFECT_METHODS, extractTurnIdentity} from "./protocol.mjs";

function normalizedMetadata(message, metadata) {
  const identity = extractTurnIdentity(message);
  const fallbackEffect = message.method === "item/fileChange/requestApproval"
    ? "persistent-mutation"
    : message.method === "item/permissions/requestApproval"
      ? "unknown-permission-expansion"
      : "unknown-command-effect";
  return {
    identity,
    effect_classes: uniqueStrings(metadata?.effect_classes?.length ? metadata.effect_classes : [fallbackEffect]),
    reversible: typeof metadata?.reversible === "boolean" ? metadata.reversible : false,
    owner_gate_ref: nonEmptyString(metadata?.owner_gate_ref) ? metadata.owner_gate_ref.trim() : null,
    route_id: nonEmptyString(metadata?.route_id) ? metadata.route_id.trim() : "CA2-ROUTE-IMPLEMENT",
    structurally_admissible: metadata?.structurally_admissible !== false,
    rejection_reasons: uniqueStrings(metadata?.rejection_reasons),
  };
}

export function evaluateEffectRequest(input) {
  if (!isRecord(input) || !isRecord(input.message) || !EFFECT_METHODS.includes(input.message.method)) {
    return fail("effect-boundary", ["effect.supported-approval-request-required"]);
  }
  const metadata = normalizedMetadata(input.message, input.effect_metadata);
  const identity = metadata.identity;
  const missing = [];
  if (!nonEmptyString(identity.thread_id)) missing.push("effect.thread-id-required");
  if (!nonEmptyString(identity.turn_id)) missing.push("effect.turn-id-required");
  if (!nonEmptyString(identity.item_id)) missing.push("effect.item-id-required");
  if (missing.length > 0) return fail("effect-boundary", missing);
  const effectDigest = digestValue({method: input.message.method, params: input.message.params, metadata});
  const option = {
    option_id: `effect:${effectDigest}`,
    route_id: metadata.route_id,
    effect_classes: metadata.effect_classes,
    reversible: metadata.reversible,
    owner_gate_ref: metadata.owner_gate_ref,
    structurally_admissible: metadata.structurally_admissible,
    rejection_reasons: metadata.rejection_reasons,
    proposal: input.message.params?.proposal ?? null,
  };
  const decision = evaluateContinuation({
    completion: {completion_id: `effect-boundary:${identity.turn_id}:${identity.item_id}`, status: "completed", continuation_required: true, evidence_refs: [`effect:${effectDigest}`]},
    options: [option],
  }, input.decision_profile);
  const directiveKind = decision.kind === "direct" ? "direct" : decision.kind === "gate" ? "gate" : "block";
  const value = freezeResult({
    schema_version: "are.codex-effect-directive/v1",
    directive_kind: directiveKind,
    method: input.message.method,
    rpc_id: input.message.id,
    ...identity,
    effect_digest: effectDigest,
    effect_classes: metadata.effect_classes,
    reversible: metadata.reversible,
    owner_gate_refs: decision.owner_gate_refs,
    decision_profile_digest: decision.decision_profile_digest,
    decision_digest: decision.decision_digest,
    reason_codes: decision.reason_codes,
    client_approval_required: directiveKind !== "block",
    authority_effect: "none",
  });
  return freezeResult({ok: true, value, evaluation: decision, deny_result: directiveKind === "block" ? denyApprovalResult(input.message.method) : null, authority_effect: "none"});
}

export function bindApprovalResponse(input) {
  if (!isRecord(input) || !isRecord(input.pending) || !isRecord(input.response)) {
    return fail("approval-response", ["effect.pending-and-response-required"]);
  }
  const pending = input.pending;
  if (input.response.id !== pending.rpc_id) return fail("approval-response", ["effect.approval-response-id-mismatch"]);
  if (isRecord(input.response.error)) {
    return freezeResult({ok: true, action: "forward", accepted: false, binding: null, authority_effect: "none"});
  }
  if ((pending.method === "item/commandExecution/requestApproval" || pending.method === "item/fileChange/requestApproval")
    && !["accept", "decline", "cancel"].includes(input.response.result?.decision)) {
    return fail("approval-response", ["effect.session-or-policy-grant-unsupported"]);
  }
  if (pending.method === "item/permissions/requestApproval" && input.response.result?.scope !== "turn") {
    return fail("approval-response", ["effect.permission-scope-unsupported"]);
  }
  const accepted = approvalAccepted(pending.method, input.response.result);
  if (pending.directive_kind === "block" && accepted) return fail("approval-response", ["effect.blocked-approval-cannot-be-accepted"]);
  const bindingMaterial = accepted ? {
    schema_version: "are.codex-human-effect-decision-binding/v1",
    rpc_id: pending.rpc_id,
    effect_digest: pending.effect_digest,
    engine_decision_digest: pending.decision_digest,
    response_digest: digestValue(input.response.result),
    owner_gate_refs: pending.owner_gate_refs,
    decision: "approved-by-client",
    authority_effect: "none",
  } : null;
  const binding = bindingMaterial ? freezeResult({...bindingMaterial, binding_digest: digestValue(bindingMaterial)}) : null;
  return freezeResult({ok: true, action: "forward", accepted, binding, authority_effect: "none"});
}
