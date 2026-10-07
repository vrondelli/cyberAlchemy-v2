import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {materializeHostedCommandExec} from "./hosted-effect-command.mjs";
import {HOSTED_EFFECT_EXECUTE} from "./protocol.mjs";

function denied(reason) {
  return freezeResult({ok: false, reason_codes: [reason], authority_effect: "none"});
}


// Structural authorization only. The dispatcher must independently establish
// that intent was durably recorded, that the browser approval came from its
// one-use UI, and that the turn is still active immediately before send.
export function prepareHostedCommandExecution({request, directive, intent,
  approval_binding: approvalBinding, repository_root: repositoryRoot,
  windows_backend_sandbox_attested: windowsBackendSandboxAttested = false,
  windows_backend_sandbox_root: windowsBackendSandboxRoot = null} = {}) {
  if (!isRecord(request) || request.kind !== "command"
    || !nonEmptyString(request.thread_id) || !nonEmptyString(request.turn_id)
    || !/^hosted-effect:[0-9a-f]{64}$/.test(request.effect_id ?? "")
    || !isRecord(request.proposal)
    || Object.keys(request).sort().join(",") !== "effect_id,kind,proposal,thread_id,turn_id") {
    return denied("hosted-effect.execution-request-invalid");
  }
  const proposalDigest = digestValue(request);
  if (!isRecord(directive) || directive.schema_version !== "are.codex-effect-directive/v1"
    || !["direct", "gate"].includes(directive.directive_kind)
    || directive.authority_effect !== "none"
    || directive.method !== "item/commandExecution/requestApproval"
    || directive.rpc_id !== request.effect_id
    || directive.thread_id !== request.thread_id
    || directive.turn_id !== request.turn_id
    || directive.item_id !== request.effect_id
    || !nonEmptyString(directive.effect_digest)
    || !nonEmptyString(directive.decision_digest)) {
    return denied("hosted-effect.execution-directive-invalid");
  }
  if (!isRecord(approvalBinding)
    || approvalBinding.schema_version !== "are.codex-human-effect-decision-binding/v1"
    || approvalBinding.authority_effect !== "none"
    || approvalBinding.rpc_id !== request.effect_id
    || approvalBinding.effect_digest !== directive.effect_digest
    || approvalBinding.engine_decision_digest !== directive.decision_digest
    || approvalBinding.decision !== "approved-by-client"
    || digestValue(approvalBinding.owner_gate_refs) !== digestValue(directive.owner_gate_refs)
    || !nonEmptyString(approvalBinding.response_digest)) {
    return denied("hosted-effect.execution-approval-invalid");
  }
  const {binding_digest: bindingDigest, ...bindingMaterial} = approvalBinding;
  if (bindingDigest !== digestValue(bindingMaterial)) {
    return denied("hosted-effect.execution-approval-invalid");
  }
  if (!isRecord(intent) || intent.schema_version !== "are.hosted-effect-intent/v1"
    || intent.authority_effect !== "none" || intent.status !== "intent"
    || intent.effect_id !== request.effect_id
    || intent.proposal_digest !== proposalDigest
    || digestValue(intent.request) !== proposalDigest
    || intent.engine_decision_digest !== directive.decision_digest
    || intent.approval_binding_digest !== bindingDigest) {
    return denied("hosted-effect.execution-intent-invalid");
  }
  const materialized = materializeHostedCommandExec({request, repository_root: repositoryRoot});
  if (materialized.ok !== true) return materialized;
  // Only the gateway owning this exact backend may supply the process-local
  // attestation. The standalone executor intentionally supplies neither field.
  if (process.platform === "win32") {
    if (windowsBackendSandboxAttested !== true
      || windowsBackendSandboxRoot !== materialized.params.sandboxPolicy.writableRoots[0]) {
      return denied("hosted-effect.windows-sandbox-unverified");
    }
    // The pinned Windows App Server neither accepts outputBytesCap nor streams
    // command/exec under its sandbox. Its default buffered result returned
    // 100 KiB unchanged, and a nested output-limiting runner was EPERM.
    // A process-local sandbox pass cannot authorize unbounded host output.
    return denied("hosted-effect.windows-output-bound-unavailable");
  }
  return freezeResult({ok: true, schema_version: "are.hosted-effect-command-dispatch/v1",
    effect_id: request.effect_id, proposal_digest: proposalDigest,
    intent_digest: digestValue(intent), host_method: materialized.host_method,
    params: materialized.params, authority_effect: "none"});
}

// This adapter deliberately receives a dispatch function rather than an App
// Server RPC client. The selected gateway must own the only path that forwards
// its prepared command; ordinary client command/exec remains forbidden.
export function createHostedEffectCommandExecutor({journal, is_active_turn: isActiveTurn,
  dispatch, repository_root: repositoryRoot} = {}) {
  if (typeof journal?.get !== "function" || typeof isActiveTurn !== "function"
    || typeof dispatch !== "function" || typeof repositoryRoot !== "string") {
    throw new TypeError("hosted-effect.command-executor-boundaries-required");
  }
  const dispatched = new Set();
  return async envelope => {
    const prepared = prepareHostedCommandExecution({...envelope, repository_root: repositoryRoot});
    if (prepared.ok !== true) return prepared;
    if (dispatched.has(prepared.effect_id)) return denied("hosted-effect.execution-already-dispatched");
    const recorded = await journal.get(envelope.request.effect_id);
    if (!isRecord(recorded) || recorded.status !== "intent"
      || digestValue(recorded) !== prepared.intent_digest) {
      return denied("hosted-effect.execution-intent-not-durable");
    }
    if (await isActiveTurn(envelope.request.thread_id, envelope.request.turn_id) !== true) {
      return denied("hosted-effect.execution-turn-not-active");
    }
    dispatched.add(prepared.effect_id);
    // A transport exception is intentionally left for the broker to classify
    // as outcome-unknown; never turn it into a replayable completed failure.
    return dispatch({prepared, envelope});
  };
}

export function createGatewayHostedEffectCommandDispatcher({rpc_client: rpcClient} = {}) {
  if (typeof rpcClient?.request !== "function") {
    throw new TypeError("hosted-effect.gateway-dispatch-rpc-required");
  }
  return async ({prepared, envelope}) => {
    if (prepared?.schema_version !== "are.hosted-effect-command-dispatch/v1"
      || prepared?.effect_id !== envelope?.request?.effect_id) {
      throw new Error("hosted-effect.gateway-dispatch-envelope-invalid");
    }
    const result = await rpcClient.request(HOSTED_EFFECT_EXECUTE,
      {request: envelope.request, intent: envelope.intent,
        approval_binding: envelope.approval_binding},
      {idempotency_key: prepared.effect_id});
    if (!isRecord(result) || typeof result.ok !== "boolean"
      || result.effect_id !== prepared.effect_id
      || !Number.isSafeInteger(result.exit_code)) {
      throw new Error("hosted-effect.gateway-dispatch-result-unknown");
    }
    return result;
  };
}
