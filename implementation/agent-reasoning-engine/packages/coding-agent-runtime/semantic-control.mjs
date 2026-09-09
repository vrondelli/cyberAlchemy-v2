import {createHash} from "node:crypto";

import {composeSemanticLifecycle} from "../semantic-input-runtime/index.mjs";
import {bindApprovalResponse, evaluateDualLaneContinuation, evaluateEffectRequest} from "../codex-app-server-wrapper/index.mjs";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function digest(value) { return createHash("sha256").update(stable(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function fail(stage, reasonCodes, residue = []) { return freeze({schema_version: "are.coding-agent-semantic-control/v1", ok: false, stage, reason_codes: [...new Set(reasonCodes)].sort(), residue, authority_effect: "none"}); }

export function assessPatchSemantics({candidate_digest, semantic_input} = {}) {
  if (!/^[a-f0-9]{64}$/u.test(candidate_digest ?? "")) return fail("semantic-assessment", ["semantic.candidate-digest-required"]);
  const semantic = composeSemanticLifecycle(semantic_input);
  if (!semantic.ok) return fail("semantic-assessment", semantic.reason_codes ?? ["semantic.lifecycle-blocked"], semantic.residue ?? [semantic]);
  const value = {schema_version: "are.coding-agent-patch-semantic-assessment/v1", candidate_digest, semantic_lifecycle_digest: semantic.digest ?? null, semantic_disposition: semantic.disposition, reasoning_receipt_digest: semantic.reasoning_receipt?.receipt_digest ?? null, claim_ceiling: semantic.claim_ceiling ?? null, authority_effect: "none"};
  return freeze({ok: true, value, semantic, digest: digest(value), authority_effect: "none"});
}

export function decideAgentContinuation({continuation_input, decision_profile} = {}) {
  return evaluateDualLaneContinuation(continuation_input, decision_profile);
}

export function evaluateAgentEffect(input) { return evaluateEffectRequest(input); }
export function bindAgentApproval(input) { return bindApprovalResponse(input); }
