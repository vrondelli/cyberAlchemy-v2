import {createHash} from "node:crypto";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  evaluateContinuation,
  loadVerifiedDecisionProfile,
  routeRequest,
} from "../../../../implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs";
import {createAlchSemanticModulePort} from "../../../../implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs";

const runtimeRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(runtimeRoot, "..");
const repositoryRoot = resolve(packageRoot, "../../../..");
const defaultProfilePath = resolve(
  repositoryRoot,
  "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json",
);

function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(normalized(value));
}

export function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))].sort();
}

function textInput(params) {
  return (Array.isArray(params?.input) ? params.input : [])
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function finalize(material) {
  const base = normalized({...material, authority_effect: "none"});
  return Object.freeze(normalized({...base, decision_digest: digest(base)}));
}

function requestContext(message) {
  const extension = message?.params?._are?.requestContext ?? {};
  const has = (key) => Object.hasOwn(extension, key);
  return {
    schema_version: "are.request-context/v1",
    request_id: String(extension.request_id ?? message.id ?? ""),
    raw_request: extension.raw_request ?? textInput(message.params),
    objective_kind: extension.objective_kind ?? null,
    requested_effects: uniqueStrings(extension.requested_effects),
    target_refs: uniqueStrings(extension.target_refs),
    constraints: uniqueStrings(extension.constraints),
    evidence_refs: uniqueStrings(extension.evidence_refs?.length ? extension.evidence_refs : ["codex:turn/start.params.input"]),
    field_postures: {
      request_id: has("request_id") ? "explicit" : (message?.id !== undefined && message?.id !== null ? "inferred" : "absent"),
      raw_request: has("raw_request") ? "explicit" : "inferred",
      objective_kind: has("objective_kind") ? "explicit" : "absent",
      requested_effects: has("requested_effects") ? "explicit" : "absent",
      target_refs: has("target_refs") ? "explicit" : "absent",
      constraints: has("constraints") ? "explicit" : "absent",
      evidence_refs: has("evidence_refs") ? "explicit" : "inferred",
    },
  };
}

function preflightIdentityBlock(message, context, profileDigest) {
  const missing = [];
  if (!context.request_id) missing.push("request-id");
  if (!message?.params?.threadId) missing.push("thread-id");
  if (!context.raw_request.trim()) missing.push("raw-request");
  if (missing.length === 0) return null;
  return finalize({
    schema_version: "are.capability-selection/v1",
    kind: "block",
    request_id: context.request_id || null,
    request_context_digest: digest(context),
    decision_profile_digest: profileDigest,
    selected: null,
    candidates: [],
    candidate_details: [],
    evaluated_routes: [],
    semantic_evidence: {
      disposition: "blocked",
      module_set_digest: null,
      capability_ids: [],
      receipt_count: 0,
      receipt_set_digest: digest([]),
      reason_codes: ["route.preflight-identity-blocked"],
      dependency_posture: "required-for-judgment",
      authority_effect: "none",
    },
    provenance: [],
    reason_codes: missing.map((key) => `context.${key}-required`),
  });
}

function contextItem(decision) {
  return {
    type: "text",
    text: [
      "<application_context>",
      "Agent Reasoning Engine routing evidence (non-authorizing).",
      `route_id=${decision.selected.route_id}`,
      `request_context_digest=${decision.request_context_digest}`,
      `decision_profile_digest=${decision.decision_profile_digest}`,
      `decision_digest=${decision.decision_digest}`,
      "authority_effect=none",
      "</application_context>",
    ].join("\n"),
  };
}

function effectOwner(method) {
  if (method === "item/commandExecution/requestApproval") return "Owner of the exact command effect";
  if (method === "item/fileChange/requestApproval") return "Owner of the exact file-change effect";
  if (method === "item/permissions/requestApproval") return "Owner of the exact permission grant";
  return "Owner of the exact effect";
}

function acceptedApproval(method, result) {
  if (method === "item/permissions/requestApproval") return Boolean(result?.permissions);
  const decision = result?.decision;
  return decision === "accept" || decision === "acceptForSession" || Boolean(decision?.acceptWithExecpolicyAmendment) || Boolean(decision?.applyNetworkPolicyAmendment);
}

function laneOption(proposal, index, lane) {
  const value = proposal && typeof proposal === "object" ? proposal : {};
  const effectClasses = uniqueStrings(value.effect_classes);
  const rejectionReasons = uniqueStrings(value.rejection_reasons);
  if (lane === "plan_bound" && (!value.next_turn || typeof value.next_turn !== "object" || !Array.isArray(value.next_turn.input))) {
    rejectionReasons.push("option.next-turn-required");
  }
  return {
    option_id: String(value.option_id ?? `${lane}-${index + 1}`),
    route_id: String(value.route_id ?? "CA2-ROUTE-AMBIGUOUS"),
    effect_classes: effectClasses,
    reversible: value.reversible,
    owner_gate_ref: lane === "interaction_bound"
      ? String(value.owner_gate_ref ?? "Human owner of the exact interaction proposal")
      : (value.owner_gate_ref ?? null),
    structurally_admissible: value.structurally_admissible !== false,
    rejection_reasons: [...new Set(rejectionReasons)].sort(),
  };
}

function proposalBinding(proposal, index, lane) {
  const value = proposal && typeof proposal === "object" ? structuredClone(proposal) : {};
  const optionId = String(value.option_id ?? `${lane}-${index + 1}`);
  return Object.freeze(normalized({
    lane,
    option_id: optionId,
    proposal_digest: digest({lane, option_id: optionId, proposal: value}),
    has_next_turn: Boolean(value.next_turn && typeof value.next_turn === "object" && Array.isArray(value.next_turn.input)),
  }));
}

export function createDecisionEngine({profilePath = defaultProfilePath, repoRoot = repositoryRoot, modulePort = createAlchSemanticModulePort()} = {}) {
  const loaded = loadVerifiedDecisionProfile(profilePath, repoRoot);
  if (!loaded.ok) throw new Error(`ARE_PROFILE_VERIFICATION_FAILED:${loaded.reason_codes.join(",")}`);
  const profile = loaded.value;

  return Object.freeze({
    profileDigest: profile.profile_digest,

    preflight(message) {
      const context = requestContext(message);
      const decision = preflightIdentityBlock(message, context, profile.profile_digest) ?? routeRequest(context, profile, modulePort);
      if (decision.kind !== "direct") return {context, decision, forwarded: null, continuation: null};
      const forwarded = structuredClone(message);
      const continuation = structuredClone(forwarded.params?._are?.continuation ?? {});
      if (continuation.plan_manifest?.source_kind === "host-declared-plan") {
        continuation.plan_manifest.turn_request_digest = decision.request_context_digest;
      }
      delete forwarded.params._are;
      forwarded.params.input = [...forwarded.params.input, contextItem(decision)];
      return {context, decision, forwarded, continuation};
    },

    effect(request) {
      const params = request?.params ?? {};
      const identity = {
        method: request?.method ?? null,
        thread_id: params.threadId ?? null,
        turn_id: params.turnId ?? null,
        item_id: params.itemId ?? null,
        approval_id: params.approvalId ?? null,
        command: params.command ?? null,
        cwd: params.cwd ?? null,
        permissions: params.permissions ?? null,
        grant_root: params.grantRoot ?? null,
      };
      const missing = ["thread_id", "turn_id", "item_id"].filter((key) => !identity[key]);
      return finalize({
        schema_version: "are.codex-effect-decision/v1",
        kind: missing.length ? "block" : "gate",
        effect_digest: digest(identity),
        effect_identity: identity,
        owner_gate_refs: [effectOwner(request?.method)],
        reason_codes: missing.length ? missing.map((key) => `effect.${key.replaceAll("_", "-")}-required`) : ["effect.explicit-human-decision-required"],
        decision_profile_digest: profile.profile_digest,
      });
    },

    bindApproval(request, response, effectDecision, permissionDecision) {
      const accepted = acceptedApproval(request.method, response?.result);
      const policyPermits = permissionDecision?.kind === "permit"
        && permissionDecision?.effect_digest === effectDecision.effect_digest;
      return finalize({
        schema_version: "are.codex-effect-binding/v1",
        kind: accepted && policyPermits ? "human-bound" : "declined",
        effect_digest: effectDecision.effect_digest,
        effect_decision_digest: effectDecision.decision_digest,
        permission_decision_digest: permissionDecision?.decision_digest ?? null,
        response_digest: digest(response?.result ?? response?.error ?? null),
        reason_codes: [accepted && policyPermits ? "effect.human-and-policy-bound" : (!policyPermits ? "effect.permission-policy-denied" : "effect.not-approved")],
        decision_profile_digest: profile.profile_digest,
      });
    },

    continuation(notification, declared = {}, evidence = {}) {
      const turn = notification?.params?.turn ?? {};
      const assertedPlan = Array.isArray(declared.plan_bound) ? declared.plan_bound : [];
      const manifest = declared.plan_manifest ?? {};
      const planVerified = ["host-declared-plan", "mechanism-observed-plan"].includes(manifest.source_kind)
        && typeof manifest.source_ref === "string" && manifest.source_ref.length > 0
        && manifest.turn_request_digest === evidence.request_context_digest
        && manifest.plan_digest === digest(assertedPlan);
      const plan = planVerified ? assertedPlan : [];
      const demotedPlan = planVerified ? [] : assertedPlan.map((proposal) => ({
        ...proposal,
        owner_gate_ref: "Human owner of the unverified plan assertion",
        rejection_reasons: [...uniqueStrings(proposal?.rejection_reasons), "plan.evidence-unverified"],
      }));
      const interactions = [
        ...(Array.isArray(declared.interaction_bound) ? declared.interaction_bound : []),
        ...demotedPlan,
      ];
      const options = [
        ...plan.map((proposal, index) => laneOption(proposal, index, "plan_bound")),
        ...interactions.map((proposal, index) => laneOption(proposal, index, "interaction_bound")),
      ];
      const proposalBindings = [
        ...plan.map((proposal, index) => proposalBinding(proposal, index, "plan_bound")),
        ...interactions.map((proposal, index) => proposalBinding(proposal, index, "interaction_bound")),
      ];
      const input = {
        completion: {
          completion_id: turn.id ?? null,
          status: evidence.valid === false ? "evidence-invalid" : (turn.status === "completed" ? "completed" : String(turn.status ?? "unknown")),
          continuation_required: options.length > 0,
          evidence_refs: [...new Set(["codex:turn/completed", ...(evidence.evidence_refs ?? [])])],
        },
        options,
      };
      const decision = evaluateContinuation(input, profile);
      return {
        input,
        source_lanes: {plan_bound: plan.length, interaction_bound: interactions.length},
        plan_evidence_status: planVerified ? "verified" : (assertedPlan.length > 0 ? "demoted-to-interaction" : "none"),
        evidence_manifest: evidence.manifest ?? null,
        proposal_bindings: proposalBindings,
        decision,
        selected_plan: decision.kind === "direct"
          ? plan.find((proposal, index) => String(proposal?.option_id ?? `plan_bound-${index + 1}`) === decision.selected_option_id) ?? null
          : null,
        proposal(optionId, proposalDigest) {
          const candidates = [
            ...plan.map((proposal, index) => ({proposal, binding: proposalBindings[index]})),
            ...interactions.map((proposal, index) => ({proposal, binding: proposalBindings[plan.length + index]})),
          ];
          return candidates.find(({binding}) => binding.option_id === optionId && binding.proposal_digest === proposalDigest) ?? null;
        },
      };
    },
  });
}
