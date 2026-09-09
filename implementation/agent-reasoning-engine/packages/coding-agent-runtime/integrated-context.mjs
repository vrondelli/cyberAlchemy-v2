import {createHash} from "node:crypto";

import {composeContextLifecycle} from "../context-basis-runtime/index.mjs";
import {
  acquireReasoningStateWriterLock,
  recoverReasoningStateLedger,
} from "../reasoning-state-runtime/index.mjs";
import {
  applyReflectionDisposition,
  appendIntentLifecycleEvents,
  compileRequestIntent,
  createCorrectedIntentContract,
  detectCorrection,
  materializeIntentReflection,
  toImprovementSignalCandidate,
} from "../request-intent-runtime/index.mjs";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function digest(value) { return createHash("sha256").update(stable(value)).digest("hex"); }
function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freeze(child);
  return value;
}
function failure(stage, reasonCodes, residue = []) {
  return freeze({schema_version: "are.coding-agent-integration-failure/v1", ok: false, stage, reason_codes: [...new Set(reasonCodes)].sort(), residue, authority_effect: "none"});
}

export function openPersistentCodingSession({log_path, ledger_id, owner_id = "are-coding-agent"} = {}) {
  if (typeof log_path !== "string" || !log_path || typeof ledger_id !== "string" || !ledger_id) {
    return failure("session-open", ["session.log-path-and-ledger-id-required"]);
  }
  const locked = acquireReasoningStateWriterLock({path: log_path, owner_id});
  if (!locked.ok) return failure("session-lock", locked.reason_codes, locked.residue);
  const recovered = recoverReasoningStateLedger({path: log_path, ledger_id, create_if_missing: true});
  if (!recovered.ok) {
    locked.lock.release();
    return failure("session-recovery", recovered.reason_codes, recovered.residue);
  }
  const {ledger} = recovered;
  let lastEpoch = recovered.checkpoint ? ledger.getEpoch(recovered.checkpoint.epoch_digest) : null;
  let closed = false;
  const session = Object.freeze({
    ledger_id,
    log_path,
    recovery: recovered.assessment,
    ledger,
    record({event_kind, content, request_ref = null, context_envelope_digest = null, checkpoint_kind = "manual", provenance_refs = []} = {}) {
      if (closed) return failure("session-record", ["session.closed"]);
      if (typeof event_kind !== "string" || !event_kind || !content || typeof content !== "object" || Array.isArray(content)) {
        return failure("session-record", ["session.event-invalid"]);
      }
      const appended = ledger.append({event_kind, idempotency_key: `${event_kind}:${digest(content)}`, content, provenance_refs});
      if (!appended.ok) return failure("session-append", appended.reason_codes ?? ["session.append-failed"]);
      const eventDigests = ledger.snapshot().map((event) => event.event_digest);
      const epoch = ledger.seal({event_digests: eventDigests, consumer_ref: "are:coding-agent", request_ref, context_envelope_digest, selected_dependencies: [], frontier: {last_event_kind: event_kind}});
      if (!epoch.ok) return failure("session-epoch", epoch.reason_codes ?? ["session.epoch-failed"]);
      const checkpoint = ledger.checkpoint({checkpoint_kind, epoch: epoch.value, subject_digest: digest(content)});
      if (!checkpoint.ok) return failure("session-checkpoint", checkpoint.reason_codes ?? ["session.checkpoint-failed"]);
      lastEpoch = epoch.value;
      return freeze({ok: true, event: appended.event, epoch: epoch.value, checkpoint: checkpoint.value, authority_effect: "none"});
    },
    checkpointEpoch(epoch, checkpoint_kind = "manual", subject_digest = null) {
      if (closed) return failure("session-checkpoint", ["session.closed"]);
      const checkpoint = ledger.checkpoint({checkpoint_kind, epoch, subject_digest});
      if (checkpoint.ok) lastEpoch = epoch;
      return checkpoint;
    },
    latestEpoch() { return lastEpoch; },
    snapshot() { return ledger.snapshot(); },
    inspect() { return ledger.inspect(); },
    close() {
      if (closed) return freeze({ok: true, disposition: "already-closed", authority_effect: "none"});
      const ledgerResult = ledger.close();
      const lockResult = locked.lock.release();
      closed = true;
      return freeze({ok: ledgerResult.ok !== false && lockResult.ok !== false, ledger: ledgerResult, lock: lockResult, authority_effect: "none"});
    },
  });
  return freeze({ok: true, session, recovery: recovered.assessment, authority_effect: "none"});
}

export async function prepareIntegratedContext({session, request, request_ref, context_input, intent_provider = null, module_port} = {}) {
  if (!session || typeof session.record !== "function") return failure("context-prepare", ["session.required"]);
  const context = composeContextLifecycle(context_input, {module_port});
  if (!context.ok) return failure("context-lifecycle", context.reason_codes ?? [`context.${context.stage ?? "failed"}`], [context]);
  const envelopeDigest = context.value.context_envelope.digest;
  const compiled = await compileRequestIntent({request, request_ref, context_envelope_digest: envelopeDigest}, intent_provider);
  if (!compiled.ok) return failure("intent-compilation", compiled.reason_codes, compiled.residue);
  const recorded = session.record({
    event_kind: "IntegratedContextPrepared",
    request_ref,
    context_envelope_digest: envelopeDigest,
    checkpoint_kind: "before-model-request",
    content: {request_ref, context_lifecycle_digest: context.digest, context_envelope_digest: envelopeDigest, intent_contract_digest: compiled.value.contract.intent_contract_digest},
    provenance_refs: ["context-basis-runtime", "request-intent-runtime"],
  });
  if (!recorded.ok) return recorded;
  return freeze({schema_version: "are.coding-agent-integrated-context/v1", ok: true, context_lifecycle: context, intent_compilation: compiled, checkpoint: recorded.checkpoint, digest: digest({context: context.digest, intent: compiled.digest}), authority_effect: "none"});
}

export async function applyIntegratedCorrection({session, previous_contract, request, request_ref, corrected_overrides = {}, correction_provider = null, reflection = {}, disposition = {}} = {}) {
  if (!session || typeof session.record !== "function") return failure("correction", ["session.required"]);
  const detected = await detectCorrection({request, request_ref, previous_contract}, correction_provider);
  if (!detected.ok) return failure("correction-detection", detected.reason_codes, detected.residue);
  if (detected.disposition === "not-detected") return freeze({schema_version: "are.coding-agent-correction/v1", ok: true, disposition: "not-detected", improvement_signal_candidate: null, authority_effect: "none"});
  let corrected;
  let reflected;
  try {
    corrected = createCorrectedIntentContract(previous_contract, corrected_overrides);
    reflected = materializeIntentReflection({correction_candidate: detected.value, previous_contract, corrected_contract: corrected, ...reflection});
  } catch (error) {
    return failure("correction-materialization", ["correction.successor-invalid"], [{message: error.message}]);
  }
  const applied = applyReflectionDisposition(reflected, disposition);
  if (!applied.ok) return failure("correction-disposition", applied.reason_codes, applied.residue);
  const improvement = toImprovementSignalCandidate(reflected, applied.value);
  if (!improvement.ok) return failure("correction-improvement", improvement.reason_codes, improvement.residue);
  const lifecycle = appendIntentLifecycleEvents({append: (entry) => session.record({...entry, checkpoint_kind: "after-turn-completion"})}, [
    {event_kind: "IntentCorrected", content: corrected, provenance_refs: [previous_contract.intent_contract_digest]},
    {event_kind: "IntentReflectionMaterialized", content: reflected, provenance_refs: [corrected.intent_contract_digest]},
    {event_kind: "ReflectionDispositionApplied", content: applied.value, provenance_refs: [reflected.reflection_digest]},
  ]);
  if (!lifecycle.ok) return failure("correction-record", lifecycle.reason_codes, lifecycle.residue);
  return freeze({schema_version: "are.coding-agent-correction/v1", ok: true, disposition: "corrected", correction_candidate: detected.value, corrected_contract: corrected, reflection: reflected, reflection_disposition: applied.value, improvement_signal_candidate: improvement.value, authority_effect: "none"});
}
