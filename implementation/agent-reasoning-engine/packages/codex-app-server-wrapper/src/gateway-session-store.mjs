import {appendFileSync, chmodSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, writeSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {hostname} from "node:os";
import {dirname, resolve} from "node:path";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {createConversationBindingEventReplay} from "./conversation-binding-contract.mjs";
import {GATEWAY_SESSION_FAULT_SCHEMA, isGatewaySessionFaultReason} from "./gateway-fault-contract.mjs";
import {verifyCodexModelEntryReceipt} from "./model-entry-receipt.mjs";
import {validDshObjectiveCheckpoint, validDshInterpretationObservation} from "./dsh-objective-checkpoint-observation.mjs";
export {projectDshObjectiveCheckpoint} from "./dsh-objective-checkpoint-observation.mjs";

export const GATEWAY_SESSION_EVENT_SCHEMA = "are.gateway-session-event/v1";
export const GATEWAY_SESSION_INDEX_SCHEMA = "are.gateway-session-index/v1";
export {GATEWAY_SESSION_FAULT_SCHEMA};
const THREAD_REF = /^backend-thread:[0-9a-f]{64}$/;
const DIGEST_REF = /^[0-9a-f]{64}$/;
const GATEWAY_CLIENT_MESSAGE_ID = /^are-gateway-client:[0-9a-f]{32}$/;
const GENERATED_REQUEST_PREFIX = "are-generated:";
const MAX_THREAD_REFS_PER_CONSUMER = 1024;
const MAX_HOST_OBSERVATIONS_PER_CONSUMER = 256;
const MAX_PENDING_HISTORY_AUDITS_PER_CONSUMER = 256;
const MAX_CONVERSATION_BINDING_EVENTS_PER_CONSUMER = 4096;
const GATEWAY_WRITER_LOCK_SCHEMA = "are.gateway-session-store-writer-lock/v1";

function readWriterLock(lockPath, storePath) {
  let record;
  try { record = JSON.parse(readFileSync(lockPath, "utf8").trim()); }
  catch { throw new Error("gateway.session-store-writer-lock-unreadable"); }
  if (!isRecord(record) || record.schema_version !== GATEWAY_WRITER_LOCK_SCHEMA
    || record.store_path !== resolve(storePath) || record.host_name !== hostname()
    || !Number.isSafeInteger(record.process_id) || record.process_id < 1
    || !nonEmptyString(record.nonce) || !DIGEST_REF.test(record.lock_digest ?? "")) {
    throw new Error("gateway.session-store-writer-lock-invalid");
  }
  const material = {...record};
  delete material.lock_digest;
  if (digestValue(material) !== record.lock_digest) throw new Error("gateway.session-store-writer-lock-invalid");
  return record;
}

function writerProcessState(processId) {
  try { process.kill(processId, 0); return "alive"; }
  catch (error) {
    if (error?.code === "ESRCH") return "missing";
    return "unknown";
  }
}

function acquireWriterLock(lockPath, storePath) {
  if (existsSync(`${lockPath}.recovery.lock`)) throw new Error("gateway.session-store-writer-lock-recovery-held");
  let descriptor;
  try { descriptor = openSync(lockPath, "wx", 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw new Error("gateway.session-store-writer-lock-create-failed");
    const old = readWriterLock(lockPath, storePath);
    if (writerProcessState(old.process_id) !== "missing") throw new Error("gateway.session-store-writer-lock-held");
    const recoveryPath = `${lockPath}.recovery.lock`;
    let recovery;
    try { recovery = openSync(recoveryPath, "wx", 0o600); }
    catch { throw new Error("gateway.session-store-writer-lock-recovery-held"); }
    try {
      const current = readWriterLock(lockPath, storePath);
      if (current.lock_digest !== old.lock_digest || writerProcessState(current.process_id) !== "missing") {
        throw new Error("gateway.session-store-writer-lock-held");
      }
      unlinkSync(lockPath);
      try { descriptor = openSync(lockPath, "wx", 0o600); }
      catch (reacquireError) {
        throw new Error(reacquireError?.code === "EEXIST" ? "gateway.session-store-writer-lock-held" : "gateway.session-store-writer-lock-create-failed");
      }
    } finally {
      closeSync(recovery);
      unlinkSync(recoveryPath);
    }
  }
  const material = freezeResult({schema_version: GATEWAY_WRITER_LOCK_SCHEMA, store_path: resolve(storePath), host_name: hostname(), process_id: process.pid, nonce: randomUUID(), authority_effect: "none"});
  const record = freezeResult({...material, lock_digest: digestValue(material)});
  try {
    writeSync(descriptor, `${JSON.stringify(record)}\n`, null, "utf8");
    fsyncSync(descriptor);
  } catch (error) {
    closeSync(descriptor);
    unlinkSync(lockPath);
    throw new Error("gateway.session-store-writer-lock-write-failed");
  }
  return {descriptor, record};
}

export function inspectFileGatewaySessionStoreWriterLock({path} = {}) {
  if (!nonEmptyString(path)) throw new TypeError("A gateway session-store path is required.");
  const lockPath = `${path}.writer.lock`;
  const recoveryMarkerPresent = existsSync(`${lockPath}.recovery.lock`);
  if (!existsSync(lockPath)) return freezeResult({disposition: recoveryMarkerPresent ? "recovery-interrupted" : "missing", recovery_marker_present: recoveryMarkerPresent, break_authorized: false, authority_effect: "none"});
  let record;
  try { record = readWriterLock(lockPath, path); }
  catch (error) { return freezeResult({disposition: error.message.endsWith("unreadable") ? "unreadable" : "invalid-or-foreign", recovery_marker_present: recoveryMarkerPresent, break_authorized: false, authority_effect: "none"}); }
  const processState = writerProcessState(record.process_id);
  return freezeResult({disposition: processState === "missing" ? "stale-candidate" : processState === "alive" ? "active" : "indeterminate", process_state: processState, process_id: record.process_id, lock_digest: record.lock_digest, recovery_marker_present: recoveryMarkerPresent, break_authorized: false, authority_effect: "none"});
}

function validHostObservation(value) {
  if (!isRecord(value) || !["turn-start-accepted", "compaction-turn-accepted", "turn-history-verified", "compaction-history-verified", "turn-marker-observed", "turn-completion-observed", "steer-accepted", "compaction-item-completed", "dsh-are-preparation-observed", "dsh-objective-interpretation-observed", "dsh-model-entry-intent", "dsh-turn-terminal-observed", "dsh-queue-remove-observed", "dsh-queue-edit-observed", "dsh-queue-steer-observed", "dsh-session-release-observed"].includes(value.kind)
    || typeof value.thread_ref !== "string" || !THREAD_REF.test(value.thread_ref)
    || (value.turn_ref !== null && (typeof value.turn_ref !== "string" || !DIGEST_REF.test(value.turn_ref)))
    || typeof value.observation_digest !== "string" || !DIGEST_REF.test(value.observation_digest)) return false;
  const material = {...value};
  delete material.observation_digest;
  if (digestValue(material) !== value.observation_digest) return false;
  if (value.kind === "dsh-objective-interpretation-observed") return validDshInterpretationObservation(value);
  if (value.kind === "turn-start-accepted") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.response_digest === "string" && DIGEST_REF.test(value.response_digest)
    && Object.keys(value).length === 7;
  if (value.kind === "compaction-turn-accepted") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.response_digest === "string" && DIGEST_REF.test(value.response_digest)
    && typeof value.event_digest === "string" && DIGEST_REF.test(value.event_digest)
    && Object.keys(value).length === 8;
  if (value.kind === "turn-history-verified") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.history_response_digest === "string" && DIGEST_REF.test(value.history_response_digest)
    && ["inProgress", "completed", "failed", "interrupted"].includes(value.turn_status)
    && Object.keys(value).length === 8;
  if (value.kind === "compaction-history-verified") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.history_response_digest === "string" && DIGEST_REF.test(value.history_response_digest)
    && typeof value.item_ref === "string" && DIGEST_REF.test(value.item_ref)
    && value.turn_status === "completed" && Object.keys(value).length === 9;
  if (value.kind === "turn-completion-observed") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.event_digest === "string" && DIGEST_REF.test(value.event_digest)
    && ["completed", "failed", "interrupted"].includes(value.turn_status)
    && Object.keys(value).length === 8;
  if (value.kind === "dsh-are-preparation-observed") return value.turn_ref === null
    && DIGEST_REF.test(value.request_key_digest ?? "")
    && DIGEST_REF.test(value.request_digest ?? "")
    && typeof value.route_id === "string" && /^CA2-ROUTE-[A-Z0-9-]{1,80}$/u.test(value.route_id)
    && DIGEST_REF.test(value.route_receipt_digest ?? "")
    && DIGEST_REF.test(value.context_result_digest ?? "")
    && DIGEST_REF.test(value.context_envelope_digest ?? "")
    && DIGEST_REF.test(value.model_context_digest ?? "")
    && value.authority_effect === "none"
    && (value.objective_checkpoint === undefined
      ? Object.keys(value).length === 12
      : Object.keys(value).length === 13 && validDshObjectiveCheckpoint(value.objective_checkpoint));
  if (value.kind === "dsh-model-entry-intent") return typeof value.turn_ref === "string"
    && DIGEST_REF.test(value.binding_id_digest ?? "")
    && DIGEST_REF.test(value.context_digest ?? "")
    && DIGEST_REF.test(value.model_messages_digest ?? "")
    && Number.isSafeInteger(value.native_event_seq) && value.native_event_seq >= 0
    && Array.isArray(value.request_key_digests)
    && Array.isArray(value.request_digests)
    && value.request_key_digests.length > 0 && value.request_key_digests.length <= 16
    && value.request_key_digests.length === value.request_digests.length
    && new Set(value.request_key_digests).size === value.request_key_digests.length
    && value.request_key_digests.every((item) => DIGEST_REF.test(item))
    && value.request_digests.every((item) => DIGEST_REF.test(item))
    && (value.preparation_bindings === undefined
      ? Object.keys(value).length === 10
      : Object.keys(value).length === 11
        && Array.isArray(value.preparation_bindings)
        && value.preparation_bindings.length === value.request_key_digests.length
        && value.preparation_bindings.every((binding) => isRecord(binding)
          && Object.keys(binding).sort().join(",") === "request_digest,request_key_digest"
          && DIGEST_REF.test(binding.request_key_digest ?? "")
          && DIGEST_REF.test(binding.request_digest ?? "")));
  if (value.kind === "dsh-turn-terminal-observed") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.event_digest === "string" && DIGEST_REF.test(value.event_digest)
    && ["completed", "failed", "interrupted"].includes(value.turn_status)
    && Object.keys(value).length === 8;
  if (value.kind === "dsh-queue-remove-observed") return value.turn_ref === null
    && DIGEST_REF.test(value.request_key_digest ?? "")
    && DIGEST_REF.test(value.request_digest ?? "")
    && DIGEST_REF.test(value.target_request_key_digest ?? "")
    && DIGEST_REF.test(value.target_request_digest ?? "")
    && DIGEST_REF.test(value.item_id_digest ?? "")
    && DIGEST_REF.test(value.event_digest ?? "")
    && Number.isSafeInteger(value.native_event_seq) && value.native_event_seq >= 0
    && Object.keys(value).length === 11;
  if (value.kind === "dsh-queue-edit-observed") return value.turn_ref === null
    && DIGEST_REF.test(value.request_key_digest ?? "")
    && DIGEST_REF.test(value.request_digest ?? "")
    && DIGEST_REF.test(value.target_request_key_digest ?? "")
    && DIGEST_REF.test(value.target_request_digest ?? "")
    && DIGEST_REF.test(value.item_id_digest ?? "")
    && DIGEST_REF.test(value.content_digest ?? "")
    && DIGEST_REF.test(value.event_digest ?? "")
    && Number.isSafeInteger(value.native_event_seq) && value.native_event_seq >= 0
    && Object.keys(value).length === 12;
  if (value.kind === "dsh-queue-steer-observed") return value.turn_ref === null
    && DIGEST_REF.test(value.request_key_digest ?? "")
    && DIGEST_REF.test(value.request_digest ?? "")
    && DIGEST_REF.test(value.target_request_key_digest ?? "")
    && DIGEST_REF.test(value.target_request_digest ?? "")
    && DIGEST_REF.test(value.item_id_digest ?? "")
    && DIGEST_REF.test(value.remove_event_digest ?? "")
    && DIGEST_REF.test(value.insert_event_digest ?? "")
    && Number.isSafeInteger(value.native_remove_seq) && value.native_remove_seq >= 0
    && Number.isSafeInteger(value.native_insert_seq)
    && value.native_insert_seq === value.native_remove_seq + 1
    && Object.keys(value).length === 13;
  if (value.kind === "dsh-session-release-observed") return value.turn_ref === null
    && DIGEST_REF.test(value.binding_id_digest ?? "")
    && DIGEST_REF.test(value.native_session_id_digest ?? "")
    && DIGEST_REF.test(value.native_header_digest ?? "")
    && DIGEST_REF.test(value.native_history_digest ?? "")
    && DIGEST_REF.test(value.native_tail_digest ?? "")
    && Number.isSafeInteger(value.native_event_count) && value.native_event_count >= 0
    && Object.keys(value).length === 10;
  if (value.kind === "turn-marker-observed") return typeof value.turn_ref === "string"
    && typeof value.request_key_digest === "string" && DIGEST_REF.test(value.request_key_digest)
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.client_message_id_digest === "string" && DIGEST_REF.test(value.client_message_id_digest)
    && typeof value.history_response_digest === "string" && DIGEST_REF.test(value.history_response_digest)
    && ["inProgress", "completed", "failed", "interrupted"].includes(value.turn_status)
    && Object.keys(value).length === 9;
  if (value.kind === "steer-accepted") return typeof value.turn_ref === "string"
    && typeof value.request_digest === "string" && DIGEST_REF.test(value.request_digest)
    && typeof value.response_digest === "string" && DIGEST_REF.test(value.response_digest)
    && (value.request_key_digest === undefined ? Object.keys(value).length === 6
      : DIGEST_REF.test(value.request_key_digest) && Object.keys(value).length === 7);
  return typeof value.item_ref === "string" && DIGEST_REF.test(value.item_ref)
    && ["completed", "not-reported"].includes(value.item_status)
    && Object.keys(value).length === 6;
}

function dshReleaseObservationBound(observation, bindingEvents, requireDraining = false) {
  const bound = bindingEvents.find((event) => ["bound", "handed-over"].includes(event.kind)
    && digestValue(event.binding.binding_id) === observation.binding_id_digest
    && `backend-thread:${event.binding.backend_thread_ref}` === observation.thread_ref);
  if (!bound) return false;
  const transitions = bindingEvents.filter((event) => event.binding_id === bound.binding.binding_id);
  return transitions.some((event) => event.kind === "draining")
    && (!requireDraining || transitions.at(-1)?.kind === "draining");
}

function dshInterpretationObservationBound(observation, bindingEvents, requireActive = false) {
  const bound = bindingEvents.find(event => ["bound", "handed-over"].includes(event.kind)
    && digestValue(event.binding.binding_id) === observation.binding_id_digest
    && event.binding.generation === observation.generation
    && event.binding.backend_adapter_id === "deepseek-harness-web/are-v1"
    && `backend-thread:${event.binding.backend_thread_ref}` === observation.thread_ref);
  return !!bound && (!requireActive || bindingEvents.findLast(event =>
    event.binding_id === bound.binding.binding_id || event.binding?.binding_id === bound.binding.binding_id)?.kind === "activated");
}

function dshQueueMutationObservationBound(observation, requests) {
  const entries = Array.isArray(requests) ? requests : [...requests.values()];
  const method = observation.kind === "dsh-queue-edit-observed"
    ? "dsh/web-queue-edit" : observation.kind === "dsh-queue-steer-observed"
      ? "dsh/web-queue-steer" : "dsh/web-queue-remove";
  const mutation = entries.find((request) => request.method === method
    && request.thread_ref === observation.thread_ref
    && request.binding_digest === observation.request_digest
    && digestValue(request.request_key) === observation.request_key_digest
    && digestValue(request.item_id) === observation.item_id_digest
    && digestValue(request.target_request_key) === observation.target_request_key_digest
    && request.target_request_digest === observation.target_request_digest
    && (method !== "dsh/web-queue-edit" || request.content_digest === observation.content_digest));
  return !!mutation && entries.some((request) => request.method === "dsh/web-prompt"
    && request.status === "complete" && request.thread_ref === observation.thread_ref
    && request.request_key === mutation.target_request_key
    && request.binding_digest === observation.target_request_digest);
}

function dshModelEntryObservationBound(observation, requests, bindingEvents,
  requireActive = false, hostObservations = []) {
  const entries = Array.isArray(requests) ? requests : [...requests.values()];
  const bindingEvent = bindingEvents.find((event) => ["bound", "handed-over"].includes(event.kind)
    && digestValue(event.binding.binding_id) === observation.binding_id_digest
    && `backend-thread:${event.binding.backend_thread_ref}` === observation.thread_ref);
  if (!bindingEvent) return false;
  if (requireActive && bindingEvents.findLast((event) =>
    event.binding_id === bindingEvent.binding.binding_id
      || event.binding?.binding_id === bindingEvent.binding.binding_id)?.kind !== "activated") return false;
  return observation.request_key_digests.every((keyDigest, index) => {
    const origin = entries.find((request) =>
    request.method === "dsh/web-prompt" && request.thread_ref === observation.thread_ref
    && digestValue(request.request_key) === keyDigest
    && request.binding_digest === observation.request_digests[index]);
    if (!origin) return false;
    // Legacy entries retain their old evidence ceiling; never infer a current
    // preparation from their origin prompt alone.
    if (observation.preparation_bindings === undefined) return true;
    const binding = observation.preparation_bindings[index];
    const preparation = hostObservations.find((item) =>
      item.kind === "dsh-are-preparation-observed"
      && item.thread_ref === observation.thread_ref
      && item.request_key_digest === binding.request_key_digest
      && item.request_digest === binding.request_digest);
    if (!preparation) return false;
    // Subsequent edits must not invalidate historical dispatch evidence on
    // reopen. Match the last applied edit at this exact native event frontier.
    const edit = hostObservations.filter((item) => item.kind === "dsh-queue-edit-observed"
      && item.thread_ref === observation.thread_ref
      && item.target_request_key_digest === keyDigest
      && item.target_request_digest === origin.binding_digest
      && item.native_event_seq <= observation.native_event_seq)
      .sort((left, right) => left.native_event_seq - right.native_event_seq).at(-1);
    if (!edit) return binding.request_key_digest === keyDigest
      && binding.request_digest === origin.binding_digest;
    return binding.request_key_digest === edit.request_key_digest
      && binding.request_digest === edit.request_digest
      && entries.some((request) => request.method === "dsh/web-queue-edit"
        && request.thread_ref === observation.thread_ref
        && digestValue(request.request_key) === binding.request_key_digest
        && request.binding_digest === binding.request_digest
        && request.target_request_key === origin.request_key
        && request.target_request_digest === origin.binding_digest);
  });
}

function validDispatchRecovery(value) {
  return isRecord(value)
    && Object.keys(value).sort().join(",") === "host_observation_digest,recovery_digest,request_digest,request_key,semantic_receipt_digest,thread_ref,turn_ref,turn_status"
    && nonEmptyString(value.request_key)
    && THREAD_REF.test(value.thread_ref ?? "")
    && ["request_digest", "turn_ref", "host_observation_digest", "semantic_receipt_digest",
      "recovery_digest"].every((key) => DIGEST_REF.test(value[key] ?? ""))
    && ["completed", "interrupted", "failed"].includes(value.turn_status);
}

function validThreadCreationAcceptance(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "acceptance_digest,request_digest,request_key,response_digest,thread_id"
    || !nonEmptyString(value.request_key) || !nonEmptyString(value.thread_id)
    || value.thread_id !== value.thread_id.trim() || Buffer.byteLength(value.thread_id, "utf8") > 256
    || !["acceptance_digest", "request_digest", "response_digest"].every((key) => DIGEST_REF.test(value[key] ?? ""))) return false;
  const {acceptance_digest: acceptanceDigest, ...material} = value;
  return digestValue(material) === acceptanceDigest;
}

function validModelEntryProof(proof, request) {
  if (!isRecord(proof) || Object.keys(proof).sort().join(",") !== "forwarded_binding_digest,receipt"
    || !DIGEST_REF.test(proof.forwarded_binding_digest ?? "")
    || !verifyCodexModelEntryReceipt(proof.receipt)
    || proof.receipt.thread_ref !== request?.thread_ref) return false;
  const generated = request.request_key.startsWith(GENERATED_REQUEST_PREFIX);
  return proof.receipt.source === (generated ? "generated" : "direct")
    && (generated ? proof.forwarded_binding_digest === request.binding_digest
      : proof.receipt.request_binding_digest === request.binding_digest);
}

function validThreadCreationHistory(value) {
  return isRecord(value)
    && Object.keys(value).sort().join(",") === "acceptance_digest,history_response_digest,request_digest,request_key,thread_id"
    && nonEmptyString(value.request_key) && nonEmptyString(value.thread_id)
    && value.thread_id === value.thread_id.trim() && Buffer.byteLength(value.thread_id, "utf8") <= 256
    && ["acceptance_digest", "history_response_digest", "request_digest"].every((key) => DIGEST_REF.test(value[key] ?? ""));
}

function validThreadCreationRecovery(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "acceptance_digest,authority_effect,history_response_digest,receipt_digest,request_digest,request_key,schema_version,thread_id"
    || value.schema_version !== "are.gateway-thread-creation-recovery/v1" || value.authority_effect !== "none"
    || !nonEmptyString(value.request_key) || !nonEmptyString(value.thread_id)
    || value.thread_id !== value.thread_id.trim() || Buffer.byteLength(value.thread_id, "utf8") > 256
    || !["acceptance_digest", "history_response_digest", "receipt_digest", "request_digest"].every((key) => DIGEST_REF.test(value[key] ?? ""))) return false;
  const {receipt_digest: receiptDigest, ...material} = value;
  return digestValue(material) === receiptDigest;
}

function validSessionFault(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "fault_digest,new_observation_digest,prior_observation_digest,reason_code,request_key_digest,schema_version,thread_ref"
    || value.schema_version !== GATEWAY_SESSION_FAULT_SCHEMA
    || !isGatewaySessionFaultReason(value.reason_code)
    || !THREAD_REF.test(value.thread_ref ?? "")
    || !["request_key_digest", "prior_observation_digest", "new_observation_digest", "fault_digest"].every((key) => DIGEST_REF.test(value[key] ?? ""))) return false;
  const material = {...value};
  delete material.fault_digest;
  return digestValue(material) === value.fault_digest;
}

function validBackendProcessIdentity(value) {
  return isRecord(value)
    && ["host_name,process_id", "birth_ref,host_name,process_id"].includes(Object.keys(value).sort().join(","))
    && nonEmptyString(value.host_name) && value.host_name.length <= 256
    && Number.isSafeInteger(value.process_id) && value.process_id > 0
    && (value.birth_ref === undefined || DIGEST_REF.test(value.birth_ref));
}

function checkedConversationBindingReplay(events, threadRefs, backendAdapterId) {
  if (!Array.isArray(events) || events.length > MAX_CONVERSATION_BINDING_EVENTS_PER_CONSUMER
    || events.some((event) => ["bound", "handed-over"].includes(event?.kind)
      && (event.binding?.backend_adapter_id !== backendAdapterId
        || !threadRefs.includes(`backend-thread:${event.binding?.backend_thread_ref}`)))) {
    throw new Error("gateway.session-store-conversation-binding-invalid");
  }
  try { return createConversationBindingEventReplay(events); }
  catch { throw new Error("gateway.session-store-conversation-binding-invalid"); }
}

function replay(records, expectedStoreId = null) {
  const sessions = new Map();
  const threadOwners = new Map();
  const bindingReplays = new Map();
  let previous = null;
  let sequence = 0;
  for (const event of records) {
    if (!isRecord(event) || event.schema_version !== GATEWAY_SESSION_EVENT_SCHEMA) throw new Error("gateway.session-store-record-invalid");
    if (expectedStoreId && event.store_id !== expectedStoreId) throw new Error("gateway.session-store-id-mismatch");
    if (event.sequence !== ++sequence || event.previous_event_digest !== previous) throw new Error("gateway.session-store-chain-invalid");
    const material = {...event};
    delete material.event_digest;
    if (digestValue(material) !== event.event_digest) throw new Error("gateway.session-store-digest-invalid");
    previous = event.event_digest;
    const prior = sessions.get(event.consumer_id) ?? {consumer_id: event.consumer_id, lane: null, backend_adapter_id: null, backend_process_identity: null, resume_token_digest: null, status: "missing", acknowledged_through: 0, delivery_sequence: 0, deliveries: new Map(), requests: new Map(), server_requests: new Map(), thread_refs: [], conversation_binding_events: [], host_observations: [], pending_history_audits: new Map(), expiration: null, fault: null};
    if (prior.status === "faulted" && event.event_kind !== "session-checkpoint") throw new Error("gateway.session-store-faulted");
    if (event.event_kind === "session-checkpoint") {
      const checkpoint = event.content.session;
      if (!isRecord(checkpoint) || !Array.isArray(checkpoint.deliveries) || !Array.isArray(checkpoint.requests) || !Array.isArray(checkpoint.server_requests)) throw new Error("gateway.session-store-checkpoint-invalid");
      const checkpointMarkers = checkpoint.requests.map((request) => request?.client_message_id).filter((marker) => marker !== undefined && marker !== null);
      if (checkpoint.requests.some((request) => request?.client_message_id !== undefined
        && request?.client_message_id !== null && (request.method !== "turn/start"
          || !GATEWAY_CLIENT_MESSAGE_ID.test(request.client_message_id)))
        || new Set(checkpointMarkers).size !== checkpointMarkers.length) {
        throw new Error("gateway.session-store-checkpoint-client-markers-invalid");
      }
      if (checkpoint.requests.some((request) => request?.pre_dispatch_rejection !== undefined
        && (request.pre_dispatch_rejection !== true || request.method !== "turn/start"
          || request.status !== "complete" || !isRecord(request.response?.error)))
        || [...prior.requests.values()].some((request) => request.pre_dispatch_rejection === true
          && !checkpoint.requests.some((item) => item.request_key === request.request_key
            && item.pre_dispatch_rejection === true))) {
        throw new Error("gateway.session-store-checkpoint-pre-dispatch-invalid");
      }
      if (checkpoint.requests.some((request) => request?.model_entry_proof !== undefined
        && (!validModelEntryProof(request.model_entry_proof, request)
          || request.pre_dispatch_rejection === true))
        || [...prior.requests.values()].some((request) => request.model_entry_proof
          && !checkpoint.requests.some((item) => item.request_key === request.request_key
            && item.model_entry_proof
            && digestValue(item.model_entry_proof) === digestValue(request.model_entry_proof)))) {
        throw new Error("gateway.session-store-checkpoint-model-entry-invalid");
      }
      const checkpointAdapterId = checkpoint.backend_adapter_id ?? null;
      if (checkpointAdapterId !== null && (!nonEmptyString(checkpointAdapterId) || checkpointAdapterId.length > 256)) throw new Error("gateway.session-store-backend-adapter-invalid");
      if (prior.status !== "missing" && checkpointAdapterId !== prior.backend_adapter_id) throw new Error("gateway.session-store-backend-adapter-mismatch");
      const checkpointProcessIdentity = checkpoint.backend_process_identity ?? null;
      if (checkpointProcessIdentity !== null && !validBackendProcessIdentity(checkpointProcessIdentity)) throw new Error("gateway.session-store-backend-process-invalid");
      if (prior.backend_process_identity !== null
        && digestValue(checkpointProcessIdentity) !== digestValue(prior.backend_process_identity)) throw new Error("gateway.session-store-backend-process-mismatch");
      if ((checkpoint.fault !== null && checkpoint.fault !== undefined && !validSessionFault(checkpoint.fault))
        || (checkpoint.status === "faulted") !== Boolean(checkpoint.fault)
        || (prior.status !== "missing" && Boolean(checkpoint.fault) !== Boolean(prior.fault))
        || (prior.fault && checkpoint.fault?.fault_digest !== prior.fault.fault_digest)) throw new Error("gateway.session-store-fault-checkpoint-invalid");
      const threadRefs = checkpoint.thread_refs ?? [];
      const conversationBindingEvents = checkpoint.conversation_binding_events ?? [];
      const hostObservations = checkpoint.host_observations ?? [];
      const pendingHistoryAudits = checkpoint.pending_history_audits ?? [];
      if (!Array.isArray(pendingHistoryAudits) || pendingHistoryAudits.length > MAX_PENDING_HISTORY_AUDITS_PER_CONSUMER
        || pendingHistoryAudits.some((audit) => !isRecord(audit)
          || Object.keys(audit).sort().join(",") !== "audit_ref,thread_ref"
          || !DIGEST_REF.test(audit.audit_ref ?? "") || !THREAD_REF.test(audit.thread_ref ?? "")
          || !threadRefs.includes(audit.thread_ref))
        || new Set(pendingHistoryAudits.map((audit) => audit.audit_ref)).size !== pendingHistoryAudits.length
        || [...prior.pending_history_audits.values()].some((audit) =>
          !pendingHistoryAudits.some((item) => item.audit_ref === audit.audit_ref && item.thread_ref === audit.thread_ref))) {
        throw new Error("gateway.session-store-history-audit-checkpoint-invalid");
      }
      if (!Array.isArray(threadRefs) || threadRefs.length > MAX_THREAD_REFS_PER_CONSUMER
        || threadRefs.some((ref) => typeof ref !== "string" || !THREAD_REF.test(ref)) || new Set(threadRefs).size !== threadRefs.length
        || prior.thread_refs.some((ref) => !threadRefs.includes(ref))) throw new Error("gateway.session-store-thread-refs-invalid");
      let checkpointBindingReplay;
      try { checkpointBindingReplay = checkedConversationBindingReplay(
        conversationBindingEvents, threadRefs, checkpointAdapterId); }
      catch { throw new Error("gateway.session-store-conversation-binding-checkpoint-invalid"); }
      if (prior.conversation_binding_events.some((bindingEvent, index) =>
          conversationBindingEvents[index]?.event_digest !== bindingEvent.event_digest)) {
        throw new Error("gateway.session-store-conversation-binding-checkpoint-invalid");
      }
      if (!Array.isArray(hostObservations) || hostObservations.length > MAX_HOST_OBSERVATIONS_PER_CONSUMER
        || hostObservations.some((observation) => !validHostObservation(observation))
        || new Set(hostObservations.map((observation) => observation.observation_digest)).size !== hostObservations.length
        || prior.host_observations.some((observation) => !hostObservations.some((item) => item.observation_digest === observation.observation_digest))) throw new Error("gateway.session-store-host-observations-invalid");
      if (hostObservations.some((observation) => observation.kind === "turn-marker-observed"
        && !checkpoint.requests.some((request) => ["outcome-unknown", "recovered"].includes(request.status)
          && request.method === "turn/start" && request.thread_ref === observation.thread_ref
          && request.binding_digest === observation.request_digest
          && digestValue(request.request_key) === observation.request_key_digest
          && typeof request.client_message_id === "string"
          && digestValue(request.client_message_id) === observation.client_message_id_digest))) {
        throw new Error("gateway.session-store-marker-observation-unbound");
      }
      if (hostObservations.some((observation) => observation.kind === "dsh-turn-terminal-observed"
        && (checkpointAdapterId !== "deepseek-harness-web/are-v1"
          || !checkpoint.requests.some((request) => request.method === "dsh/web-prompt"
            && request.thread_ref === observation.thread_ref
            && request.binding_digest === observation.request_digest
            && digestValue(request.request_key) === observation.request_key_digest)))) {
        throw new Error("gateway.session-store-dsh-terminal-checkpoint-unbound");
      }
      if (hostObservations.some(observation => observation.kind === "dsh-objective-interpretation-observed"
        && (checkpointAdapterId !== "deepseek-harness-web/are-v1"
          || !threadRefs.includes(observation.thread_ref)
          || !dshInterpretationObservationBound(observation, conversationBindingEvents)))
        || new Set(hostObservations.filter(item => item.kind === "dsh-objective-interpretation-observed")
          .map(item => item.request_ref_digest)).size !== hostObservations
          .filter(item => item.kind === "dsh-objective-interpretation-observed").length) {
        throw new Error("gateway.session-store-dsh-interpretation-checkpoint-unbound");
      }
      if (hostObservations.some((observation) => observation.kind === "dsh-model-entry-intent"
        && (checkpointAdapterId !== "deepseek-harness-web/are-v1"
          || !dshModelEntryObservationBound(observation, checkpoint.requests,
            conversationBindingEvents, false, hostObservations)))) {
        throw new Error("gateway.session-store-dsh-model-entry-checkpoint-unbound");
      }
      if (hostObservations.some((observation) => ["dsh-queue-remove-observed", "dsh-queue-edit-observed", "dsh-queue-steer-observed"].includes(observation.kind)
        && (checkpointAdapterId !== "deepseek-harness-web/are-v1"
          || !dshQueueMutationObservationBound(observation, checkpoint.requests)))) {
        throw new Error("gateway.session-store-dsh-queue-mutation-checkpoint-unbound");
      }
      if (hostObservations.some((observation) => observation.kind === "dsh-session-release-observed"
        && (checkpointAdapterId !== "deepseek-harness-web/are-v1"
          || !dshReleaseObservationBound(observation, conversationBindingEvents)
          || (prior.status !== "missing" && !prior.host_observations.some((item) =>
            item.observation_digest === observation.observation_digest))))
        || new Set(hostObservations.filter((observation) =>
          observation.kind === "dsh-session-release-observed")
          .map((observation) => observation.binding_id_digest)).size
          !== hostObservations.filter((observation) =>
            observation.kind === "dsh-session-release-observed").length) {
        throw new Error("gateway.session-store-dsh-release-checkpoint-unbound");
      }
      if (checkpoint.requests.some((request) => request.status === "recovered"
        && (request.method === "thread/start"
          ? !validThreadCreationRecovery(request.recovery)
            || !validThreadCreationAcceptance(request.creation_acceptance)
            || !validThreadCreationHistory(request.creation_history)
            || request.recovery.request_key !== request.request_key
            || request.recovery.request_digest !== request.binding_digest
            || request.recovery.thread_id !== request.creation_acceptance.thread_id
            || request.recovery.acceptance_digest !== request.creation_acceptance.acceptance_digest
            || request.recovery.history_response_digest !== request.creation_history.history_response_digest
            || !threadRefs.includes(`backend-thread:${digestValue(request.recovery.thread_id)}`)
          : !validDispatchRecovery(request.recovery)
            || request.recovery.request_key !== request.request_key
            || request.recovery.request_digest !== request.binding_digest
            || request.recovery.thread_ref !== request.thread_ref
            || !hostObservations.some((observation) => observation.kind === "turn-marker-observed"
              && observation.observation_digest === request.recovery.host_observation_digest
              && observation.request_digest === request.recovery.request_digest
              && observation.request_key_digest === digestValue(request.recovery.request_key)
              && observation.thread_ref === request.recovery.thread_ref
              && observation.turn_ref === request.recovery.turn_ref
              && observation.turn_status === request.recovery.turn_status)))) {
        throw new Error("gateway.session-store-recovery-checkpoint-invalid");
      }
      if (checkpoint.requests.some((request) => (request.creation_history !== undefined
          && request.creation_acceptance === undefined)
        || (request.creation_acceptance !== undefined
        && (!validThreadCreationAcceptance(request.creation_acceptance)
          || request.method !== "thread/start" || request.creation_acceptance.request_key !== request.request_key
          || request.creation_acceptance.request_digest !== request.binding_digest
          || !threadRefs.includes(`backend-thread:${digestValue(request.creation_acceptance.thread_id)}`)
          || (request.creation_history !== undefined && (!validThreadCreationHistory(request.creation_history)
            || request.creation_history.request_key !== request.request_key
            || request.creation_history.request_digest !== request.binding_digest
            || request.creation_history.thread_id !== request.creation_acceptance.thread_id
            || request.creation_history.acceptance_digest !== request.creation_acceptance.acceptance_digest)))))
        || [...prior.requests.values()].some((request) => request.creation_acceptance
          && !checkpoint.requests.some((item) => item.request_key === request.request_key
            && item.creation_acceptance?.acceptance_digest === request.creation_acceptance.acceptance_digest))) {
        throw new Error("gateway.session-store-creation-checkpoint-invalid");
      }
      for (const ref of threadRefs) {
        const owner = threadOwners.get(ref);
        if (owner && owner !== event.consumer_id) throw new Error("gateway.session-store-thread-owner-conflict");
        threadOwners.set(ref, event.consumer_id);
      }
      Object.assign(prior, {...checkpoint, backend_adapter_id: checkpointAdapterId, backend_process_identity: checkpointProcessIdentity, thread_refs: [...threadRefs], conversation_binding_events: [...conversationBindingEvents], host_observations: [...hostObservations], pending_history_audits: new Map(pendingHistoryAudits.map((audit) => [audit.audit_ref, audit])), deliveries: new Map(checkpoint.deliveries.map((entry) => [entry.sequence, entry])), requests: new Map(checkpoint.requests.map((entry) => [entry.request_key, entry])), server_requests: new Map(checkpoint.server_requests.map((entry) => [String(entry.request_id), entry]))});
      bindingReplays.set(event.consumer_id, checkpointBindingReplay);
    }
    else if (event.event_kind === "session-started") {
      if (prior.status === "faulted") throw new Error("gateway.session-store-faulted");
      if (prior.pending_history_audits.size > 0) throw new Error("gateway.session-store-history-audit-incomplete");
      const adapterId = event.content.backend_adapter_id ?? null;
      if (adapterId !== null && (!nonEmptyString(adapterId) || adapterId.length > 256)) throw new Error("gateway.session-store-backend-adapter-invalid");
      if (prior.status !== "missing" && adapterId !== prior.backend_adapter_id) throw new Error("gateway.session-store-backend-adapter-mismatch");
      const backendProcessIdentity = event.content.backend_process_identity ?? null;
      if (backendProcessIdentity !== null && !validBackendProcessIdentity(backendProcessIdentity)) throw new Error("gateway.session-store-backend-process-invalid");
      Object.assign(prior, {lane: event.content.lane, backend_adapter_id: adapterId,
        backend_process_identity: backendProcessIdentity, resume_token_digest: event.content.resume_token_digest, status: "active", expiration: null});
    }
    else if (event.event_kind === "thread-bound") {
      const ref = event.content?.thread_ref;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1 || typeof ref !== "string" || !THREAD_REF.test(ref)) throw new Error("gateway.session-store-thread-ref-invalid");
      const owner = threadOwners.get(ref);
      if (owner && owner !== event.consumer_id) throw new Error("gateway.session-store-thread-owner-conflict");
      if (!prior.thread_refs.includes(ref)) {
        if (prior.thread_refs.length >= MAX_THREAD_REFS_PER_CONSUMER) throw new Error("gateway.session-store-thread-limit");
        prior.thread_refs.push(ref);
      }
      threadOwners.set(ref, event.consumer_id);
    }
    else if (event.event_kind === "conversation-binding-event") {
      const bindingEvent = event.content?.binding_event;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1
        || prior.status !== "active"
        || prior.conversation_binding_events.length >= MAX_CONVERSATION_BINDING_EVENTS_PER_CONSUMER
        || (["bound", "handed-over"].includes(bindingEvent?.kind)
          && (bindingEvent.binding?.backend_adapter_id !== prior.backend_adapter_id
            || !prior.thread_refs.includes(`backend-thread:${bindingEvent.binding?.backend_thread_ref}`)))) {
        throw new Error("gateway.session-store-conversation-binding-invalid");
      }
      let bindingReplay = bindingReplays.get(event.consumer_id);
      if (!bindingReplay) {
        bindingReplay = checkedConversationBindingReplay(prior.conversation_binding_events,
          prior.thread_refs, prior.backend_adapter_id);
        bindingReplays.set(event.consumer_id, bindingReplay);
      }
      try { bindingReplay.appendEvent(bindingEvent); }
      catch { throw new Error("gateway.session-store-conversation-binding-invalid"); }
      prior.conversation_binding_events.push(bindingEvent);
    }
    else if (event.event_kind === "host-observation") {
      const observation = event.content?.observation;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1 || !validHostObservation(observation)) throw new Error("gateway.session-store-host-observation-invalid");
      if (!prior.thread_refs.includes(observation.thread_ref)) throw new Error("gateway.session-store-host-observation-unbound");
      if (observation.kind === "dsh-objective-interpretation-observed"
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || !dshInterpretationObservationBound(observation, prior.conversation_binding_events, true)
          || prior.host_observations.some(item => item.kind === observation.kind
            && item.request_ref_digest === observation.request_ref_digest
            && item.observation_digest !== observation.observation_digest))) {
        throw new Error("gateway.session-store-dsh-interpretation-unbound");
      }
      if (observation.kind === "turn-start-accepted" && ![...prior.requests.values()].some((request) =>
        request.method === "turn/start" && request.thread_ref === observation.thread_ref
        && request.binding_digest === observation.request_digest
        && digestValue(request.request_key) === observation.request_key_digest)) {
        throw new Error("gateway.session-store-host-observation-request-unbound");
      }
      if (observation.kind === "compaction-turn-accepted" && (![...prior.requests.values()].some((request) =>
        request.method === "thread/compact/start" && request.status === "complete"
        && request.thread_ref === observation.thread_ref
        && request.binding_digest === observation.request_digest
        && digestValue(request.request_key) === observation.request_key_digest
        && request.response_digest === observation.response_digest)
        || prior.host_observations.some((accepted) =>
          accepted.thread_ref === observation.thread_ref && accepted.turn_ref === observation.turn_ref
          && ["turn-start-accepted", "compaction-turn-accepted"].includes(accepted.kind)))) {
        throw new Error("gateway.session-store-compaction-acceptance-unbound");
      }
      if (["turn-history-verified", "turn-completion-observed"].includes(observation.kind) && (![...prior.requests.values()].some((request) =>
        (observation.kind === "turn-completion-observed" ? ["complete", "outcome-unknown", "recovered"]
          : ["complete", "outcome-unknown"]).includes(request.status)
        && (request.method === "turn/start" || (observation.kind === "turn-completion-observed"
          && request.method === "thread/compact/start"))
        && request.thread_ref === observation.thread_ref && request.binding_digest === observation.request_digest
        && digestValue(request.request_key) === observation.request_key_digest)
        || !prior.host_observations.some((accepted) => ["turn-start-accepted", "compaction-turn-accepted"].includes(accepted.kind)
          && accepted.thread_ref === observation.thread_ref && accepted.turn_ref === observation.turn_ref
          && accepted.request_key_digest === observation.request_key_digest
          && accepted.request_digest === observation.request_digest))) {
        throw new Error("gateway.session-store-host-history-unbound");
      }
      if (observation.kind === "compaction-history-verified" && (![...prior.requests.values()].some((request) =>
        request.method === "thread/compact/start" && request.status === "complete" && !request.response?.error
        && request.thread_ref === observation.thread_ref && request.binding_digest === observation.request_digest
        && digestValue(request.request_key) === observation.request_key_digest)
        || !prior.host_observations.some((accepted) => accepted.kind === "compaction-turn-accepted"
          && accepted.thread_ref === observation.thread_ref && accepted.turn_ref === observation.turn_ref
          && accepted.request_key_digest === observation.request_key_digest
          && accepted.request_digest === observation.request_digest))) {
        throw new Error("gateway.session-store-compaction-history-unbound");
      }
      if (observation.kind === "compaction-item-completed"
        && !prior.host_observations.some((accepted) =>
          ["turn-start-accepted", "compaction-turn-accepted"].includes(accepted.kind)
          && accepted.thread_ref === observation.thread_ref
          && accepted.turn_ref === observation.turn_ref)) {
        throw new Error("gateway.session-store-compaction-item-unbound");
      }
      if (observation.kind === "steer-accepted" && observation.request_key_digest !== undefined
        && ![...prior.requests.values()].some(request => request.method === "turn/steer"
          && request.thread_ref === observation.thread_ref
          && request.binding_digest === observation.request_digest
          && digestValue(request.request_key) === observation.request_key_digest)) {
        throw new Error("gateway.session-store-steer-acceptance-unbound");
      }
      if (observation.kind === "turn-marker-observed" && ![...prior.requests.values()].some((request) =>
        ["outcome-unknown", "recovered"].includes(request.status) && request.method === "turn/start"
        && request.thread_ref === observation.thread_ref
        && request.binding_digest === observation.request_digest
        && digestValue(request.request_key) === observation.request_key_digest
        && typeof request.client_message_id === "string"
        && digestValue(request.client_message_id) === observation.client_message_id_digest)) {
        throw new Error("gateway.session-store-marker-observation-unbound");
      }
      if (observation.kind === "dsh-turn-terminal-observed"
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || ![...prior.requests.values()].some((request) => request.method === "dsh/web-prompt"
            && request.thread_ref === observation.thread_ref
            && request.binding_digest === observation.request_digest
            && digestValue(request.request_key) === observation.request_key_digest)
          || prior.host_observations.some((previous) => previous.kind === observation.kind
            && previous.request_key_digest === observation.request_key_digest
            && previous.observation_digest !== observation.observation_digest))) {
        throw new Error("gateway.session-store-dsh-terminal-unbound");
      }
      if (observation.kind === "dsh-are-preparation-observed"
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || ![...prior.requests.values()].some((request) =>
            ["dsh/web-prompt", "dsh/web-queue-edit"].includes(request.method)
            && request.thread_ref === observation.thread_ref
            && request.binding_digest === observation.request_digest
            && digestValue(request.request_key) === observation.request_key_digest)
          || prior.host_observations.some((previous) => previous.kind === observation.kind
            && previous.request_key_digest === observation.request_key_digest))) {
        throw new Error("gateway.session-store-dsh-preparation-unbound");
      }
      if (observation.kind === "dsh-model-entry-intent"
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || !dshModelEntryObservationBound(observation, prior.requests,
            prior.conversation_binding_events, true, prior.host_observations))) {
        throw new Error("gateway.session-store-dsh-model-entry-unbound");
      }
      if (["dsh-queue-remove-observed", "dsh-queue-edit-observed", "dsh-queue-steer-observed"].includes(observation.kind)
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || !dshQueueMutationObservationBound(observation, prior.requests)
          || prior.host_observations.some((previous) => previous.kind === observation.kind
            && previous.request_key_digest === observation.request_key_digest
            && previous.observation_digest !== observation.observation_digest))) {
        throw new Error("gateway.session-store-dsh-queue-mutation-unbound");
      }
      if (observation.kind === "dsh-session-release-observed"
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || !dshReleaseObservationBound(observation, prior.conversation_binding_events, true)
          || prior.host_observations.some((previous) => previous.kind === observation.kind
            && previous.binding_id_digest === observation.binding_id_digest
            && previous.observation_digest !== observation.observation_digest))) {
        throw new Error("gateway.session-store-dsh-release-unbound");
      }
      if (!prior.host_observations.some((item) => item.observation_digest === observation.observation_digest)) {
        if (prior.host_observations.length >= MAX_HOST_OBSERVATIONS_PER_CONSUMER) {
          // Compaction acceptance is still needed by the post-restart mutation
          // gate even after completion. Capacity exhaustion must stop safely,
          // not silently discard the binding that makes recovery provable.
          const resolvedIndex = prior.host_observations.findIndex((item) => item.kind === "turn-start-accepted"
            && [...prior.requests.values()].some((request) => request.status === "complete"
              && request.method === "turn/start"
              && request.thread_ref === item.thread_ref
              && request.binding_digest === item.request_digest
              && digestValue(request.request_key) === item.request_key_digest)
            && prior.host_observations.some((terminal) =>
              (terminal.kind === "turn-completion-observed" || terminal.kind === "turn-history-verified")
              && terminal.thread_ref === item.thread_ref && terminal.turn_ref === item.turn_ref
              && terminal.request_key_digest === item.request_key_digest
              && terminal.request_digest === item.request_digest
              && ["completed", "failed", "interrupted"].includes(terminal.turn_status)));
          if (resolvedIndex < 0) throw new Error("gateway.session-store-host-observation-limit");
          prior.host_observations.splice(resolvedIndex, 1);
        }
        prior.host_observations.push(observation);
      }
    }
    else if (event.event_kind === "history-audit-started") {
      const audit = event.content?.audit;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1
        || !isRecord(audit) || Object.keys(audit).sort().join(",") !== "audit_ref,thread_ref"
        || !DIGEST_REF.test(audit.audit_ref ?? "") || !THREAD_REF.test(audit.thread_ref ?? "")
        || prior.status !== "active" || !prior.thread_refs.includes(audit.thread_ref)
        || ![...prior.requests.values()].some((request) => ["turn/start", "thread/compact/start"].includes(request.method)
          && ["complete", "outcome-unknown"].includes(request.status)
          && request.thread_ref === audit.thread_ref)
        || prior.pending_history_audits.has(audit.audit_ref)
        || prior.pending_history_audits.size >= MAX_PENDING_HISTORY_AUDITS_PER_CONSUMER) {
        throw new Error("gateway.session-store-history-audit-invalid");
      }
      prior.pending_history_audits.set(audit.audit_ref, audit);
    }
    else if (event.event_kind === "history-audit-completed") {
      const audit = event.content?.audit;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1
        || !isRecord(audit) || Object.keys(audit).sort().join(",") !== "audit_ref,thread_ref"
        || !DIGEST_REF.test(audit.audit_ref ?? "") || !THREAD_REF.test(audit.thread_ref ?? "")
        || prior.status !== "active"
        || prior.pending_history_audits.get(audit.audit_ref)?.thread_ref !== audit.thread_ref) {
        throw new Error("gateway.session-store-history-audit-invalid");
      }
      prior.pending_history_audits.delete(audit.audit_ref);
    }
    else if (event.event_kind === "delivery-enqueued") {
      const delivery = event.content.delivery;
      if (!isRecord(delivery) || !Number.isSafeInteger(delivery.sequence) || delivery.sequence !== prior.delivery_sequence + 1) throw new Error("gateway.session-store-delivery-sequence-invalid");
      prior.delivery_sequence = delivery.sequence;
      if (delivery.sequence > prior.acknowledged_through) prior.deliveries.set(delivery.sequence, delivery);
    }
    else if (event.event_kind === "delivery-acknowledged") {
      const through = event.content.through_sequence;
      if (!Number.isSafeInteger(through) || through < prior.acknowledged_through || through > prior.delivery_sequence) throw new Error("gateway.session-store-ack-sequence-invalid");
      prior.acknowledged_through = through;
      for (const deliverySequence of [...prior.deliveries.keys()]) if (deliverySequence <= through) prior.deliveries.delete(deliverySequence);
    }
    else if (event.event_kind === "dispatch-intent") {
      const content = event.content;
      const existing = prior.requests.get(content?.request_key);
      const reinitializing = content?.method === "initialize" && existing?.method === "initialize"
        && existing.status === "complete" && existing.binding_digest === content.binding_digest;
      if (!nonEmptyString(content?.request_key) || !nonEmptyString(content.method)
        || !nonEmptyString(content.binding_digest)
        || (existing && !reinitializing)
        || (content.thread_ref !== undefined && content.thread_ref !== null
          && (typeof content.thread_ref !== "string" || !THREAD_REF.test(content.thread_ref)))
        || (content.client_message_id !== undefined && (content.method !== "turn/start"
          || !GATEWAY_CLIENT_MESSAGE_ID.test(content.client_message_id)
          || [...prior.requests.values()].some((request) => request.client_message_id === content.client_message_id)))) {
        throw new Error("gateway.session-store-dispatch-intent-invalid");
      }
      prior.requests.set(content.request_key, {...content, status: "outcome-unknown"});
    }
    else if (event.event_kind === "model-entry-verified") {
      const content = event.content;
      const request = prior.requests.get(content?.request_key);
      if (!isRecord(content) || Object.keys(content).sort().join(",") !== "forwarded_binding_digest,receipt,request_key"
        || request?.method !== "turn/start" || request.status !== "outcome-unknown"
        || request.model_entry_proof !== undefined
        || !validModelEntryProof({receipt: content.receipt,
          forwarded_binding_digest: content.forwarded_binding_digest}, request)) {
        throw new Error("gateway.session-store-model-entry-invalid");
      }
      prior.requests.set(content.request_key, {...request, model_entry_proof: {
        receipt: content.receipt, forwarded_binding_digest: content.forwarded_binding_digest}});
    }
    else if (event.event_kind === "thread-creation-accepted") {
      const acceptance = event.content;
      const request = prior.requests.get(acceptance?.request_key);
      if (!validThreadCreationAcceptance(acceptance) || request?.method !== "thread/start"
        || request.status !== "outcome-unknown" || request.creation_acceptance
        || request.binding_digest !== acceptance.request_digest
        || !prior.thread_refs.includes(`backend-thread:${digestValue(acceptance.thread_id)}`)) {
        throw new Error("gateway.session-store-creation-acceptance-invalid");
      }
      prior.requests.set(acceptance.request_key, {...request, creation_acceptance: acceptance});
    }
    else if (event.event_kind === "thread-creation-history-verified") {
      const history = event.content;
      const request = prior.requests.get(history?.request_key);
      if (!validThreadCreationHistory(history) || !["outcome-unknown", "recovered"].includes(request?.status)
        || request.method !== "thread/start" || !validThreadCreationAcceptance(request.creation_acceptance)
        || request.binding_digest !== history.request_digest || request.creation_history
        || request.creation_acceptance.thread_id !== history.thread_id
        || request.creation_acceptance.acceptance_digest !== history.acceptance_digest) {
        throw new Error("gateway.session-store-creation-history-invalid");
      }
      prior.requests.set(history.request_key, {...request, creation_history: history});
    }
    else if (event.event_kind === "dispatch-outcome") {
      const request = prior.requests.get(event.content?.request_key);
      const terminalRecovery = event.content?.response?.recovered_from_terminal_observation_digest;
      const recoveryRequestKey = request?.method === "dsh/web-cancel"
        ? request.target_request_key : request?.request_key;
      const recoveryRequestDigest = request?.method === "dsh/web-cancel"
        ? request.target_request_digest : request?.binding_digest;
      if (terminalRecovery !== undefined
        && (prior.backend_adapter_id !== "deepseek-harness-web/are-v1"
          || !["dsh/web-prompt", "dsh/web-cancel"].includes(request?.method)
          || request.status !== "outcome-unknown"
          || event.content.response.accepted !== true
          || Object.keys(event.content.response).sort().join(",")
            !== "accepted,recovered_from_terminal_observation_digest"
          || !prior.host_observations.some((observation) =>
            observation.kind === "dsh-turn-terminal-observed"
            && observation.observation_digest === terminalRecovery
            && observation.thread_ref === request.thread_ref
            && observation.request_digest === recoveryRequestDigest
            && observation.request_key_digest === digestValue(recoveryRequestKey)))) {
        throw new Error("gateway.session-store-dsh-prompt-recovery-invalid");
      }
      if (event.content?.pre_dispatch_rejection !== undefined
        && (event.content.pre_dispatch_rejection !== true || request?.method !== "turn/start"
          || request.status !== "outcome-unknown" || !isRecord(event.content.response?.error))) {
        throw new Error("gateway.session-store-pre-dispatch-invalid");
      }
      prior.requests.set(event.content.request_key, {...request, ...event.content, status: "complete"});
    }
    else if (event.event_kind === "thread-creation-recovered") {
      const recovery = event.content;
      const request = prior.requests.get(recovery?.request_key);
      if (!validThreadCreationRecovery(recovery) || request?.status !== "outcome-unknown"
        || request.method !== "thread/start" || request.binding_digest !== recovery.request_digest
        || request.creation_acceptance?.thread_id !== recovery.thread_id
        || request.creation_acceptance.acceptance_digest !== recovery.acceptance_digest
        || request.creation_history?.history_response_digest !== recovery.history_response_digest) {
        throw new Error("gateway.session-store-creation-recovery-invalid");
      }
      prior.requests.set(recovery.request_key, {...request, status: "recovered", recovery});
    }
    else if (event.event_kind === "dispatch-recovered") {
      const recovery = event.content;
      const request = prior.requests.get(recovery?.request_key);
      if (!validDispatchRecovery(recovery) || request?.status !== "outcome-unknown"
        || request.method !== "turn/start" || request.binding_digest !== recovery.request_digest
        || request.thread_ref !== recovery.thread_ref
        || !prior.host_observations.some((observation) => observation.kind === "turn-marker-observed"
          && observation.observation_digest === recovery.host_observation_digest
          && observation.thread_ref === recovery.thread_ref
          && observation.turn_ref === recovery.turn_ref
          && observation.turn_status === recovery.turn_status
          && observation.request_digest === recovery.request_digest
          && observation.request_key_digest === digestValue(recovery.request_key))) {
        throw new Error("gateway.session-store-dispatch-recovery-invalid");
      }
      prior.requests.set(recovery.request_key, {...request, status: "recovered", recovery});
    }
    else if (event.event_kind === "session-fault") {
      const fault = event.content?.fault;
      if (!isRecord(event.content) || Object.keys(event.content).length !== 1 || !validSessionFault(fault)
        || prior.status !== "active" || !prior.thread_refs.includes(fault.thread_ref)
        || ![...prior.requests.values()].some((request) => ["turn/start", "thread/compact/start"].includes(request.method)
          && request.thread_ref === fault.thread_ref && digestValue(request.request_key) === fault.request_key_digest)
        || !prior.host_observations.some((observation) => observation.observation_digest === fault.prior_observation_digest)) {
        throw new Error("gateway.session-store-fault-invalid");
      }
      prior.status = "faulted";
      prior.fault = fault;
    }
    else if (event.event_kind === "server-request-observed") prior.server_requests.set(String(event.content.request_id), {...event.content, status: "pending"});
    else if (event.event_kind === "server-response-intent") prior.server_requests.set(String(event.content.request_id), {...prior.server_requests.get(String(event.content.request_id)), ...event.content, status: "outcome-unknown"});
    else if (event.event_kind === "server-response-forwarded") prior.server_requests.set(String(event.content.request_id), {...prior.server_requests.get(String(event.content.request_id)), ...event.content, status: "forwarded"});
    else if (event.event_kind === "server-request-resolved") {
      const content = event.content;
      const request = isRecord(content) ? prior.server_requests.get(String(content.request_id)) : null;
      if (!isRecord(content) || Object.keys(content).sort().join(",") !== "request_id,resolution_digest,thread_ref"
        || !(nonEmptyString(content.request_id) || Number.isSafeInteger(content.request_id))
        || !THREAD_REF.test(content.thread_ref ?? "") || !DIGEST_REF.test(content.resolution_digest ?? "")
        || !request || request.thread_ref !== content.thread_ref
        || !["pending", "forwarded"].includes(request.status)) {
        throw new Error("gateway.session-store-server-resolution-invalid");
      }
      prior.server_requests.set(String(content.request_id), {...request,
        status: request.status === "forwarded" ? "resolved-forwarded" : "resolved-unanswered",
        resolution_digest: content.resolution_digest});
    }
    else if (event.event_kind === "session-expired") Object.assign(prior, {status: "expired", expiration: event.content.expiration});
    else if (event.event_kind === "session-closed") prior.status = "closed";
    sessions.set(event.consumer_id, prior);
  }
  return {sessions, sequence, head: previous};
}

function publicSession(value) {
  if (!value) return null;
  return freezeResult({...value, thread_refs: [...value.thread_refs].sort(), conversation_binding_events: [...value.conversation_binding_events], host_observations: [...value.host_observations], pending_history_audits: [...value.pending_history_audits.values()].sort((a, b) => a.audit_ref.localeCompare(b.audit_ref)), deliveries: [...value.deliveries.values()].sort((a, b) => a.sequence - b.sequence), requests: [...value.requests.values()].sort((a, b) => a.request_key.localeCompare(b.request_key)), server_requests: [...value.server_requests.values()].sort((a, b) => String(a.request_id).localeCompare(String(b.request_id))), authority_effect: "none"});
}

function inspectedSession(value) {
  const session = publicSession(value);
  const {conversation_binding_events: bindingEvents, ...publicFields} = session;
  return freezeResult({...publicFields, conversation_binding_event_count: bindingEvents.length,
    conversation_binding_head_digest: bindingEvents.at(-1)?.event_digest ?? null});
}

function createStore({storeId, initialRecords = [], appendRecord = () => {}, replaceRecords = () => {}, closeStore = () => {}, durability = "process-memory", maximumBytes = null}) {
  if (!nonEmptyString(storeId)) throw new TypeError("A gateway session-store id is required.");
  const state = replay(initialRecords, storeId);
  function append({event_kind, consumer_id, content = {}}) {
    if (!nonEmptyString(event_kind) || !nonEmptyString(consumer_id) || !isRecord(content)) return freezeResult({ok: false, reason_codes: ["gateway.session-store-event-invalid"], authority_effect: "none"});
    const material = freezeResult({schema_version: GATEWAY_SESSION_EVENT_SCHEMA, store_id: storeId, sequence: state.sequence + 1, previous_event_digest: state.head, event_kind: event_kind.trim(), consumer_id: consumer_id.trim(), content, authority_effect: "none"});
    const event = freezeResult({...material, event_digest: digestValue(material)});
    let next;
    try { next = replay([...initialRecords, event], storeId); } catch (error) {
      return freezeResult({ok: false, reason_codes: [error?.message?.startsWith("gateway.") ? error.message : "gateway.session-store-record-invalid"], authority_effect: "none"});
    }
    try { appendRecord(event); } catch (error) {
      const reason = typeof error?.message === "string" && error.message.startsWith("gateway.") ? error.message : `gateway.session-store-append-failed:${error?.code ?? error?.name ?? "Error"}`;
      return freezeResult({ok: false, reason_codes: [reason], authority_effect: "none"});
    }
    initialRecords.push(event);
    state.sessions = next.sessions;
    state.sequence = next.sequence;
    state.head = next.head;
    return freezeResult({ok: true, event, authority_effect: "none"});
  }
  function compact() {
    const records = [];
    let previous = null;
    for (const session of [...state.sessions.values()].sort((left, right) => left.consumer_id.localeCompare(right.consumer_id))) {
      const content = {session: publicSession(session)};
      const material = freezeResult({schema_version: GATEWAY_SESSION_EVENT_SCHEMA, store_id: storeId, sequence: records.length + 1, previous_event_digest: previous, event_kind: "session-checkpoint", consumer_id: session.consumer_id, content, authority_effect: "none"});
      const event = freezeResult({...material, event_digest: digestValue(material)});
      records.push(event);
      previous = event.event_digest;
    }
    try { replaceRecords(records); } catch (error) {
      return freezeResult({ok: false, reason_codes: [`gateway.session-store-compaction-failed:${error?.code ?? error?.name ?? "Error"}`], authority_effect: "none"});
    }
    initialRecords.splice(0, initialRecords.length, ...records);
    const next = replay(initialRecords, storeId);
    state.sessions = next.sessions; state.sequence = next.sequence; state.head = next.head;
    return freezeResult({ok: true, event_count: state.sequence, session_count: state.sessions.size, authority_effect: "none"});
  }
  return Object.freeze({
    append,
    compact,
    getSession: (consumerId) => publicSession(state.sessions.get(consumerId)),
    hasFaultedSession: () => {
      for (const session of state.sessions.values()) if (session.status === "faulted") return true;
      return false;
    },
    hasIncompleteHistoryAudit: () => {
      for (const session of state.sessions.values()) if (session.pending_history_audits.size > 0) return true;
      return false;
    },
    inspect: () => freezeResult({schema_version: GATEWAY_SESSION_INDEX_SCHEMA, store_id: storeId, durability, maximum_bytes: maximumBytes, event_count: state.sequence, head_event_digest: state.head, sessions: [...state.sessions.values()].map(inspectedSession).sort((a, b) => a.consumer_id.localeCompare(b.consumer_id)), authority_effect: "none"}),
    close: closeStore,
  });
}

export function createMemoryGatewaySessionStore({store_id = "are-gateway-sessions:memory"} = {}) {
  return createStore({storeId: store_id});
}

export function createFileGatewaySessionStore({path, store_id = "are-gateway-sessions:file", maximum_bytes = 16 * 1024 * 1024} = {}) {
  if (!nonEmptyString(path)) throw new TypeError("A gateway session-store path is required.");
  if (!Number.isSafeInteger(maximum_bytes) || maximum_bytes < 1024) throw new TypeError("gateway session-store maximum_bytes must be at least 1024.");
  mkdirSync(dirname(path), {recursive: true});
  const lockPath = `${path}.writer.lock`;
  const {descriptor: lock, record: lockRecord} = acquireWriterLock(lockPath, path);
  let records = [];
  try {
    if (existsSync(path)) {
      const source = readFileSync(path, "utf8");
      if (source.length > 0 && !source.endsWith("\n")) throw new Error("gateway.session-store-torn-tail");
      records = source.split("\n").filter(Boolean).map((line) => JSON.parse(line));
    }
    replay(records, store_id);
  } catch (error) {
    closeSync(lock);
    unlinkSync(lockPath);
    throw error;
  }
  let closed = false;
  return createStore({
    storeId: store_id,
    initialRecords: records,
    durability: process.platform === "win32" ? "append-only-file-fsync/windows-directory-flush-unverified" : "append-only-file-fsync",
    maximumBytes: maximum_bytes,
    appendRecord(event) {
      if (closed) throw new Error("gateway.session-store-closed");
      const line = `${JSON.stringify(event)}\n`;
      const currentBytes = existsSync(path) ? statSync(path).size : 0;
      if (currentBytes + Buffer.byteLength(line) > maximum_bytes) throw new Error("gateway.session-store-byte-limit");
      appendFileSync(path, line, {encoding: "utf8", mode: 0o600});
      const fd = openSync(path, process.platform === "win32" ? "r+" : "r");
      try { fsyncSync(fd); } finally { closeSync(fd); }
    },
    replaceRecords(nextRecords) {
      if (closed) throw new Error("gateway.session-store-closed");
      const bytes = nextRecords.map((event) => JSON.stringify(event)).join("\n") + (nextRecords.length ? "\n" : "");
      if (Buffer.byteLength(bytes) > maximum_bytes) throw new Error("gateway.session-store-byte-limit");
      const temporary = `${path}.${process.pid}.${randomUUID()}.compact.tmp`;
      writeFileSync(temporary, bytes, {encoding: "utf8", mode: 0o600, flag: "wx"});
      chmodSync(temporary, 0o600);
      const temporaryFd = openSync(temporary, process.platform === "win32" ? "r+" : "r");
      try { fsyncSync(temporaryFd); } finally { closeSync(temporaryFd); }
      renameSync(temporary, path);
      if (process.platform !== "win32") {
        const directoryFd = openSync(dirname(path), "r");
        try { fsyncSync(directoryFd); } finally { closeSync(directoryFd); }
      }
    },
    closeStore() {
      if (closed) return freezeResult({ok: true, already_closed: true, authority_effect: "none"});
      if (readWriterLock(lockPath, path).lock_digest !== lockRecord.lock_digest) throw new Error("gateway.session-store-writer-lock-owner-mismatch");
      closed = true;
      closeSync(lock);
      unlinkSync(lockPath);
      return freezeResult({ok: true, authority_effect: "none"});
    },
  });
}
