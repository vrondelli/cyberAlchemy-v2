import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {bindApprovalResponse, evaluateEffectRequest} from "./effect-boundary.mjs";
import {hostedEffectToolCallPosture} from "./host-method-policy.mjs";
import {HOSTED_EFFECT_ASSESS} from "./protocol.mjs";

const METHODS = Object.freeze({command: "item/commandExecution/requestApproval",
  "file-change": "item/fileChange/requestApproval"});
const MAX_PROPOSAL_BYTES = 64 * 1024;
const MAX_RESULT_BYTES = 64 * 1024;

function failure(reason, details = {}) {
  return freezeResult({schema_version: "are.hosted-effect-result/v1", ok: false,
    reason_codes: [reason], ...details, authority_effect: "none"});
}

function exactRequest(input) {
  if (!isRecord(input) || input.kind !== "command"
    || Object.keys(input).some(key => !["thread_id", "turn_id", "effect_id", "kind", "proposal"].includes(key))
    || ![input.thread_id, input.turn_id, input.effect_id].every(value => nonEmptyString(value)
      && value === value.trim() && Buffer.byteLength(value, "utf8") <= 256)
    || !isRecord(input.proposal)) return null;
  let bytes;
  try { bytes = Buffer.byteLength(JSON.stringify(input.proposal), "utf8"); }
  catch { return null; }
  if (bytes < 2 || bytes > MAX_PROPOSAL_BYTES) return null;
  return freezeResult({thread_id: input.thread_id, turn_id: input.turn_id,
    effect_id: input.effect_id, kind: input.kind, proposal: input.proposal});
}

// The metadata is supplied by the owning controller, never by the model's
// proposal. This adapts the existing ARE consequence assessment to a broker
// request without treating its gate as permission to execute.
export function createAreHostedEffectAssessor({decision_profile: decisionProfile,
  metadata_provider: metadataProvider} = {}) {
  if (!isRecord(decisionProfile) || typeof metadataProvider !== "function") {
    throw new TypeError("hosted-effect.assessor-configuration-required");
  }
  return request => evaluateEffectRequest({decision_profile: decisionProfile,
    effect_metadata: metadataProvider(request),
    message: {jsonrpc: "2.0", id: request.effect_id, method: METHODS[request.kind],
      params: {threadId: request.thread_id, turnId: request.turn_id,
        itemId: request.effect_id, startedAtMs: Date.now(), proposal: request.proposal}}});
}

// Ask the session-owning wrapper to assess against the route bound to the
// accepted turn. The hosted client cannot choose or duplicate that route.
export function createGatewayHostedEffectAssessor({rpc_client: rpcClient} = {}) {
  if (typeof rpcClient?.request !== "function") {
    throw new TypeError("hosted-effect.gateway-assessor-rpc-required");
  }
  return async request => {
    const exact = exactRequest(request);
    if (!exact) return {ok: false, reason_codes: ["hosted-effect.request-invalid"]};
    const result = await rpcClient.request(HOSTED_EFFECT_ASSESS, {
      threadId: exact.thread_id, turnId: exact.turn_id, effectId: exact.effect_id,
      kind: exact.kind, proposal: exact.proposal,
    });
    if (!isRecord(result) || result.schema_version !== "are.hosted-effect-assessment/v1"
      || result.ok !== true || result.authority_effect !== "none"
      || result.request_digest !== digestValue(exact) || !isRecord(result.value)) {
      return {ok: false, reason_codes: ["hosted-effect.gateway-assessment-invalid"]};
    }
    return {ok: true, value: result.value};
  };
}

// Reuse the hosted client's one-use approval surface. This is an ARE-owned
// prompt, not a response to a Codex server approval request; the broker still
// binds and journals the accepted decision before any executor is reached.
export function createHostedEffectApprovalAdapter({approval_broker: approvalBroker} = {}) {
  if (typeof approvalBroker?.request !== "function") {
    throw new TypeError("hosted-effect.approval-broker-required");
  }
  return async ({request, proposal_digest: proposalDigest, directive}) => {
    const exact = exactRequest(request);
    if (!exact || proposalDigest !== digestValue(exact)
      || directive?.rpc_id !== exact.effect_id || directive?.thread_id !== exact.thread_id
      || directive?.turn_id !== exact.turn_id || directive?.item_id !== exact.effect_id
      || directive?.method !== METHODS[exact.kind]
      || !["direct", "gate"].includes(directive?.directive_kind)) {
      return {decision: "decline", proposal_digest: proposalDigest};
    }
    const response = await approvalBroker.request({jsonrpc: "2.0", id: exact.effect_id,
      method: METHODS[exact.kind], params: {threadId: exact.thread_id,
        turnId: exact.turn_id, itemId: exact.effect_id, proposal: exact.proposal,
        approvalSource: "are-hosted-effect", assessment: {directive: directive.directive_kind,
          decisionDigest: directive.decision_digest,
          ownerGateRefs: directive.owner_gate_refs}}});
    return {decision: ["accept", "decline", "cancel"].includes(response?.decision)
      ? response.decision : "decline", proposal_digest: proposalDigest};
  };
}

// The host supplies thread, turn and call identities; model arguments cannot
// choose an effect ID or the assessment metadata. This adapter performs no
// execution of its own and requires a second active-turn check before it calls
// the broker. The broker's executor must recheck its own dispatch boundary.
export function createHostedEffectDynamicToolHandler({broker, is_active_turn: isActiveTurn} = {}) {
  if (typeof broker?.requestEffect !== "function" || typeof isActiveTurn !== "function") {
    throw new TypeError("hosted-effect.dynamic-tool-boundaries-required");
  }
  const denied = (reason, effectId = null) => freezeResult({success: false,
    contentItems: [{type: "inputText", text: JSON.stringify({ok: false,
      ...(effectId ? {effect_id: effectId} : {}), reason_codes: [reason]})}]});
  return async message => {
    if (hostedEffectToolCallPosture(message).kind !== "admitted") {
      return denied("hosted-effect.host-call-invalid");
    }
    const {threadId, turnId, callId, arguments: args} = message.params;
    const effectId = `hosted-effect:${digestValue({thread_id: threadId, turn_id: turnId, call_id: callId})}`;
    let active;
    try { active = await isActiveTurn(threadId, turnId); }
    catch { active = false; }
    if (active !== true) return denied("hosted-effect.turn-not-active", effectId);
    let result;
    try { result = await broker.requestEffect({thread_id: threadId, turn_id: turnId,
      effect_id: effectId, kind: args.kind, proposal: args.proposal}); }
    catch { return denied("hosted-effect.outcome-unknown", effectId); }
    if (!isRecord(result) || typeof result.ok !== "boolean") {
      return denied("hosted-effect.broker-result-invalid", effectId);
    }
    let text = JSON.stringify(result);
    if (Buffer.byteLength(text, "utf8") > 60_000) {
      text = JSON.stringify({ok: result.ok, effect_id: effectId,
        result_digest: digestValue(result), output_status: "omitted-too-large"});
    }
    return freezeResult({success: result.ok, contentItems: [{type: "inputText", text}]});
  };
}

// Candidate authorization core only. Its caller must supply an authenticated
// user approval surface, a durable journal, an active-turn verifier, and a
// scoped executor. No default executor or permissive in-memory journal exists.
export function createHostedEffectBroker({assess, approve, execute, journal,
  is_active_turn: isActiveTurn} = {}) {
  if (typeof assess !== "function" || typeof approve !== "function"
    || typeof execute !== "function" || typeof isActiveTurn !== "function"
    || typeof journal?.get !== "function"
    || typeof journal?.append !== "function" || typeof journal?.unsettled !== "function") {
    throw new TypeError("hosted-effect.boundaries-required");
  }
  const inFlight = new Set();
  let outcomeUnknown = false;

  async function requestEffect(input) {
    const request = exactRequest(input);
    if (!request) return failure("hosted-effect.request-invalid");
    if (outcomeUnknown) return failure("hosted-effect.outcome-unknown");
    if (inFlight.has(request.effect_id)) return failure("hosted-effect.effect-in-flight");
    if (inFlight.size > 0) return failure("hosted-effect.broker-busy");
    inFlight.add(request.effect_id);
    try {
      const proposalDigest = digestValue(request);
      let prior;
      let unsettled;
      try {
        unsettled = await journal.unsettled();
        prior = await journal.get(request.effect_id);
      }
      catch { return failure("hosted-effect.journal-unavailable"); }
      if (!Array.isArray(unsettled) || unsettled.some(id => !nonEmptyString(id))) {
        return failure("hosted-effect.journal-unavailable");
      }
      if (unsettled.length > 0) return failure("hosted-effect.outcome-unknown");
      if (prior !== null && prior !== undefined) {
        if (!isRecord(prior) || prior.proposal_digest !== proposalDigest) {
          return failure("hosted-effect.effect-id-conflict");
        }
        // Even a recorded intent may have reached the executor before a
        // crash. Never replay it merely because the outcome is absent.
        if (prior.status !== "complete" || !isRecord(prior.result)) {
          return failure("hosted-effect.outcome-unknown");
        }
        return freezeResult(prior.result);
      }
      let assessed;
      try { assessed = await assess(request); }
      catch { return failure("hosted-effect.assessment-unavailable"); }
      const directive = assessed?.value;
      if (assessed?.ok !== true || !isRecord(directive)
        || directive.method !== METHODS[request.kind]
        || directive.rpc_id !== request.effect_id
        || directive.thread_id !== request.thread_id
        || directive.turn_id !== request.turn_id
        || directive.item_id !== request.effect_id
        || !["direct", "gate", "block"].includes(directive.directive_kind)
        || directive.authority_effect !== "none") {
        return failure("hosted-effect.assessment-invalid");
      }
      if (directive.directive_kind === "block") return failure("hosted-effect.assessment-blocked");
      let approval;
      try { approval = await approve(freezeResult({request, proposal_digest: proposalDigest,
        directive, authority_effect: "none"})); }
      catch { return failure("hosted-effect.approval-unavailable"); }
      if (!isRecord(approval) || approval.proposal_digest !== proposalDigest
        || !["accept", "decline", "cancel"].includes(approval.decision)
        || Object.keys(approval).some(key => !["proposal_digest", "decision"].includes(key))) {
        return failure("hosted-effect.approval-invalid");
      }
      const binding = bindApprovalResponse({pending: directive,
        response: {jsonrpc: "2.0", id: request.effect_id,
          result: {decision: approval.decision}}});
      if (binding?.ok !== true) return failure("hosted-effect.approval-binding-invalid");
      if (!binding.accepted) return failure("hosted-effect.declined");
      let stillActive;
      try { stillActive = await isActiveTurn(request.thread_id, request.turn_id); }
      catch { stillActive = false; }
      if (stillActive !== true) return failure("hosted-effect.turn-not-active");
      const intent = freezeResult({schema_version: "are.hosted-effect-intent/v1",
        effect_id: request.effect_id, proposal_digest: proposalDigest,
        engine_decision_digest: directive.decision_digest,
        approval_binding_digest: binding.binding?.binding_digest,
        request, status: "intent", authority_effect: "none"});
      if (typeof intent.approval_binding_digest !== "string") {
        return failure("hosted-effect.approval-binding-invalid");
      }
      try {
        if ((await journal.append(intent))?.ok !== true) {
          return failure("hosted-effect.intent-not-durable");
        }
      } catch { return failure("hosted-effect.intent-not-durable"); }
      let execution;
      try { execution = await execute(freezeResult({request, directive, intent,
        approval_binding: binding.binding, authority_effect: "none"})); }
      catch {
        // The request may have reached the host before the transport failed.
        // Keep the durable intent unsettled; never convert uncertainty into a
        // replayable completed failure.
        outcomeUnknown = true;
        return failure("hosted-effect.outcome-unknown", {effect_id: request.effect_id});
      }
      let resultBytes;
      try { resultBytes = Buffer.byteLength(JSON.stringify(execution), "utf8"); }
      catch { resultBytes = Infinity; }
      if (resultBytes > MAX_RESULT_BYTES || !isRecord(execution)
        || typeof execution.ok !== "boolean") {
        outcomeUnknown = true;
        return failure("hosted-effect.outcome-unknown", {effect_id: request.effect_id});
      }
      const result = freezeResult({schema_version: "are.hosted-effect-result/v1",
        ok: execution.ok, effect_id: request.effect_id,
        proposal_digest: proposalDigest, execution, authority_effect: "none"});
      try {
        if ((await journal.append({schema_version: "are.hosted-effect-outcome/v1",
          effect_id: request.effect_id, proposal_digest: proposalDigest,
          status: "complete", result, authority_effect: "none"}))?.ok !== true) {
          outcomeUnknown = true;
          return failure("hosted-effect.outcome-not-durable");
        }
      } catch {
        outcomeUnknown = true;
        return failure("hosted-effect.outcome-not-durable");
      }
      return result;
    } finally { inFlight.delete(request.effect_id); }
  }

  return Object.freeze({requestEffect,
    inspect: () => freezeResult({schema_version: "are.hosted-effect-broker-state/v1",
      in_flight: inFlight.size, outcome_unknown: outcomeUnknown, authority_effect: "none"})});
}
