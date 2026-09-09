import {digest} from "../runtime/engine.mjs";

const METHODS = new Set([
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval",
  "item/permissions/requestApproval",
]);

export function evaluatePermissionPolicy(request, effectDecision, turnPolicy = {}) {
  const exact = effectDecision?.effect_identity?.method === request?.method
    && effectDecision?.effect_identity?.thread_id === (request?.params?.threadId ?? null)
    && effectDecision?.effect_identity?.turn_id === (request?.params?.turnId ?? null)
    && effectDecision?.effect_identity?.item_id === (request?.params?.itemId ?? null);
  const base = {
    schema_version: "are.codex-permission-policy-decision/v1",
    effect_digest: effectDecision?.effect_digest ?? null,
    approval_policy: turnPolicy.approvalPolicy ?? null,
    sandbox_policy: turnPolicy.sandboxPolicy ?? null,
    reason_codes: [],
    authority_effect: "none",
  };
  if (!METHODS.has(request?.method)) base.reason_codes.push("permission.method-unsupported");
  if (!exact) base.reason_codes.push("permission.effect-identity-mismatch");
  if (turnPolicy.approvalPolicy !== "untrusted") base.reason_codes.push("permission.approval-policy-not-untrusted");
  const material = {...base, kind: base.reason_codes.length === 0 ? "permit" : "deny"};
  return Object.freeze({...material, decision_digest: digest(material)});
}
