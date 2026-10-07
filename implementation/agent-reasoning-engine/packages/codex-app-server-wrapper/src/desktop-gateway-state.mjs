import {randomUUID} from "node:crypto";
import {constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, openSync,
  readFileSync, realpathSync, renameSync, unlinkSync, writeSync} from "node:fs";
import {hostname} from "node:os";
import {dirname, isAbsolute, join} from "node:path";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {backendProcessBirthRef} from "./backend-process-birth.mjs";
import {GATEWAY_CONNECTED_SCHEMA, GATEWAY_REQUEST_META_KEY} from "./gateway.mjs";

export const DESKTOP_GATEWAY_STATE_SCHEMA = "are.codex-desktop-gateway-state/v7";
const LEGACY_STATE_SCHEMA = "are.codex-desktop-gateway-state/v6";
export const DESKTOP_GATEWAY_INSPECTION_SCHEMA = "are.codex-desktop-gateway-inspection/v1";
const LOCK_SCHEMA = "are.codex-desktop-gateway-state-lock/v2";
const LEGACY_LOCK_SCHEMA = "are.codex-desktop-gateway-state-lock/v1";
const DIGEST = /^[0-9a-f]{64}$/;
const MAX_STATE_BYTES = 512 * 1024;
const MAX_DELIVERY_BYTES = 128 * 1024;
const MAX_INTENTS = 64;
const MAX_DELIVERIES = 256;
const MAX_EPOCH_CLIENT_IDS = 2048;
const CHECKPOINT_DELIVERIES = 32;
const CHECKPOINT_INTENTS = 48;
const OWNED_THREAD_METHODS = new Set(["thread/resume", "thread/fork", "turn/start",
  "turn/steer", "turn/interrupt", "thread/compact/start"]);
const THREAD_CREATION_METHODS = new Set(["thread/start", "thread/fork"]);

function threadRef(threadId) {
  return nonEmptyString(threadId) && threadId === threadId.trim()
    && Buffer.byteLength(threadId, "utf8") <= 256 ? digestValue(threadId) : null;
}

function sameFile(path, identity) {
  try {
    const actual = lstatSync(path);
    return actual.isFile() && !actual.isSymbolicLink()
      && actual.dev === identity.dev && actual.ino === identity.ino;
  } catch { return false; }
}

function readPrivateJson(path, maxBytes, reason) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== process.getuid()
    || (stat.mode & 0o077) !== 0 || stat.size > maxBytes) throw new Error(reason);
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new Error(reason); }
}

function writerMissing(lock) {
  try { process.kill(lock.process_id, 0); }
  catch (error) { return error?.code === "ESRCH"; }
  if (!lock.process_birth_ref) return false; // A live legacy PID cannot prove replacement.
  const observedBirthRef = backendProcessBirthRef(lock.process_id);
  return observedBirthRef !== null && observedBirthRef !== lock.process_birth_ref;
}

function readLock(path, statePath) {
  const record = readPrivateJson(path, 4096, "desktop-gateway.lock-invalid");
  const current = record?.schema_version === LOCK_SCHEMA;
  const legacy = record?.schema_version === LEGACY_LOCK_SCHEMA;
  if (!isRecord(record) || !((current && Object.keys(record).sort().join(",")
      === "host_name,lock_digest,nonce,process_birth_ref,process_id,schema_version,state_path")
      || (legacy && Object.keys(record).sort().join(",")
      === "host_name,lock_digest,nonce,process_id,schema_version,state_path"))
    || current && !DIGEST.test(record.process_birth_ref ?? "") || record.state_path !== statePath
    || record.host_name !== hostname() || !Number.isSafeInteger(record.process_id)
    || record.process_id < 1 || !nonEmptyString(record.nonce)
    || !DIGEST.test(record.lock_digest ?? "")) throw new Error("desktop-gateway.lock-invalid");
  const {lock_digest, ...material} = record;
  if (digestValue(material) !== lock_digest) throw new Error("desktop-gateway.lock-invalid");
  return record;
}

function acquireLock(statePath) {
  const processBirthRef = backendProcessBirthRef(process.pid);
  if (!DIGEST.test(processBirthRef ?? "")) throw new Error("desktop-gateway.lock-birth-unavailable");
  const path = `${statePath}.writer.lock`;
  const markerPath = `${path}.recovery.lock`;
  if (existsSync(markerPath)) throw new Error("desktop-gateway.lock-recovery-interrupted");
  const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW;
  let descriptor;
  try { descriptor = openSync(path, flags, 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw new Error("desktop-gateway.lock-create-failed");
    const old = readLock(path, statePath);
    if (!writerMissing(old)) throw new Error("desktop-gateway.lock-held");
    let marker;
    try { marker = openSync(markerPath, flags, 0o600); }
    catch { throw new Error("desktop-gateway.lock-recovery-interrupted"); }
    const markerIdentity = fstatSync(marker);
    let reclaimed = false;
    try {
      const current = readLock(path, statePath);
      if (current.lock_digest !== old.lock_digest || !writerMissing(current)) {
        throw new Error("desktop-gateway.lock-held");
      }
      unlinkSync(path);
      descriptor = openSync(path, flags, 0o600);
      reclaimed = true;
    } finally {
      closeSync(marker);
      if (reclaimed && sameFile(markerPath, markerIdentity)) unlinkSync(markerPath);
    }
  }
  const identity = fstatSync(descriptor);
  const material = {schema_version: LOCK_SCHEMA, state_path: statePath,
    host_name: hostname(), process_id: process.pid, process_birth_ref: processBirthRef,
    nonce: randomUUID()};
  const record = {...material, lock_digest: digestValue(material)};
  try {
    writeSync(descriptor, `${JSON.stringify(record)}\n`);
    fsyncSync(descriptor);
  } catch {
    closeSync(descriptor);
    if (sameFile(path, identity)) unlinkSync(path);
    throw new Error("desktop-gateway.lock-write-failed");
  }
  return {path, descriptor, identity, record};
}

function validIntent(value) {
  return isRecord(value) && Object.keys(value).sort().join(",")
    === "binding_digest,client_epoch,client_id,method,request_key,response_digest,status"
    && nonEmptyString(value.request_key) && value.request_key.startsWith("desktop:")
    && Buffer.byteLength(value.request_key) <= 256 && DIGEST.test(value.binding_digest ?? "")
    && Number.isSafeInteger(value.client_epoch) && value.client_epoch > 0
    && nonEmptyString(value.method) && Buffer.byteLength(value.method) <= 256
    && (typeof value.client_id === "string" || Number.isSafeInteger(value.client_id))
    && ["pending", "response-recorded"].includes(value.status)
    && (value.status === "pending" ? value.response_digest === null : DIGEST.test(value.response_digest ?? ""));
}

function validDelivery(value) {
  return isRecord(value) && Object.keys(value).sort().join(",") === "message,message_digest,request_key,sequence"
    && Number.isSafeInteger(value.sequence) && value.sequence > 0
    && isRecord(value.message) && DIGEST.test(value.message_digest ?? "")
    && (value.request_key === null || nonEmptyString(value.request_key)
      && Buffer.byteLength(value.request_key) <= 256)
    && digestValue(value.message) === value.message_digest
    && Buffer.byteLength(JSON.stringify(value.message)) <= MAX_DELIVERY_BYTES;
}

function validServerResponseIntent(value) {
  return isRecord(value) && Object.keys(value).sort().join(",")
    === "delivery_sequence,response_digest,server_id"
    && Number.isSafeInteger(value.delivery_sequence) && value.delivery_sequence > 0
    && (typeof value.server_id === "string" || Number.isSafeInteger(value.server_id))
    && DIGEST.test(value.response_digest ?? "");
}

function validCompactedClaim(value) {
  return isRecord(value) && Object.keys(value).sort().join(",")
    === "client_id,message,message_digest,method,request_key,sequence,thread_ref"
    && nonEmptyString(value.request_key) && value.request_key.startsWith("desktop:")
    && Buffer.byteLength(value.request_key) <= 256
    && THREAD_CREATION_METHODS.has(value.method)
    && (typeof value.client_id === "string" || Number.isSafeInteger(value.client_id))
    && Number.isSafeInteger(value.sequence) && value.sequence > 0
    && DIGEST.test(value.message_digest ?? "") && DIGEST.test(value.thread_ref ?? "")
    && isRecord(value.message) && value.message.id === value.client_id
    && Object.hasOwn(value.message, "result") && !Object.hasOwn(value.message, "method")
    && Buffer.byteLength(JSON.stringify(value.message)) <= MAX_DELIVERY_BYTES
    && digestValue(value.message) === value.message_digest
    && threadRef(value.message.result?.thread?.id) === value.thread_ref;
}

function clientIdDigest(id) { return digestValue({client_id: id}); }

function creationRefsFromDeliveries(record) {
  const refs = [];
  for (const delivery of record.deliveries) {
    const intent = record.intents.find(entry => entry.request_key === delivery.request_key);
    if (!intent || !THREAD_CREATION_METHODS.has(intent.method)
      || !Object.hasOwn(delivery.message, "result")) continue;
    const ref = threadRef(delivery.message.result?.thread?.id);
    if (!ref) return null;
    refs.push(ref);
  }
  return refs;
}

function unresolvedServerRequestCount(record) {
  return record.deliveries.filter(delivery => {
    const message = delivery.message;
    if (typeof message.method !== "string" || !Object.hasOwn(message, "id")) return false;
    return !record.deliveries.some(later => later.message.method === "serverRequest/resolved"
      && later.message.params?.requestId === message.id
      && later.message.params?.threadId === message.params?.threadId);
  }).length;
}

function needsClientReconciliation(record) {
  return record.intents.some(value => value.status === "pending")
    || record.desktop_consumed_through !== record.last_acked_sequence
    || unresolvedServerRequestCount(record) > 0;
}

function readState(path, consumerId, adapterId, backendBinding) {
  const record = readPrivateJson(path, MAX_STATE_BYTES, "desktop-gateway.state-unsafe");
  const legacy = record?.schema_version === LEGACY_STATE_SCHEMA;
  const expectedKeys = legacy
    ? "backend_adapter_id,client_epoch,consumer_id,deliveries,desktop_backend_binding,desktop_consumed_through,intents,last_acked_sequence,owned_thread_refs,record_digest,resume_token,resume_token_digest,schema_version,server_response_intents"
    : "backend_adapter_id,client_epoch,compacted_owned_claims,compacted_through,consumer_id,current_epoch_client_id_digests,deliveries,desktop_backend_binding,desktop_consumed_through,intents,last_acked_sequence,owned_thread_refs,record_digest,resume_token,resume_token_digest,schema_version,server_response_intents";
  if (!isRecord(record) || Object.keys(record).sort().join(",") !== expectedKeys
    || ![LEGACY_STATE_SCHEMA, DESKTOP_GATEWAY_STATE_SCHEMA].includes(record.schema_version)
    || record.consumer_id !== consumerId || record.backend_adapter_id !== adapterId
    || record.desktop_backend_binding?.binary_sha256 !== backendBinding.binary_sha256
    || record.desktop_backend_binding?.host_profile !== backendBinding.host_profile
    || !Number.isSafeInteger(record.client_epoch) || record.client_epoch < 1
    || !nonEmptyString(record.resume_token) || record.resume_token.length > 256
    || !DIGEST.test(record.resume_token_digest ?? "")
    || digestValue(record.resume_token) !== record.resume_token_digest
    || !Number.isSafeInteger(record.last_acked_sequence) || record.last_acked_sequence < 0
    || !Number.isSafeInteger(record.desktop_consumed_through)
    || record.desktop_consumed_through < 0
    || record.desktop_consumed_through > record.last_acked_sequence
    || !Array.isArray(record.intents) || record.intents.length > MAX_INTENTS
    || !record.intents.every(validIntent)
    || record.intents.some(value => value.client_epoch > record.client_epoch)
    || new Set(record.intents.map(value => `${value.client_epoch}:${JSON.stringify(value.client_id)}`)).size
      !== record.intents.length
    || new Set(record.intents.map(entry => entry.request_key)).size !== record.intents.length
    || !Array.isArray(record.owned_thread_refs) || record.owned_thread_refs.length > MAX_INTENTS
    || !record.owned_thread_refs.every(value => DIGEST.test(value))
    || new Set(record.owned_thread_refs).size !== record.owned_thread_refs.length
    || !Array.isArray(record.deliveries) || record.deliveries.length > MAX_DELIVERIES
    || !record.deliveries.every(validDelivery)
    || !Array.isArray(record.server_response_intents)
    || record.server_response_intents.length > MAX_DELIVERIES
    || !record.server_response_intents.every(validServerResponseIntent)
    || new Set(record.server_response_intents.map(entry => entry.delivery_sequence)).size
      !== record.server_response_intents.length
    || record.server_response_intents.some(entry => !record.deliveries.some(delivery =>
      delivery.sequence === entry.delivery_sequence
      && typeof delivery.message.method === "string"
      && delivery.message.id === entry.server_id))
    || record.deliveries.some((entry, index) => index > 0
      && entry.sequence !== record.deliveries[index - 1].sequence + 1)
    || record.intents.some(intent => intent.status === "response-recorded"
      && !record.deliveries.some(delivery => delivery.request_key === intent.request_key
        && delivery.message_digest === intent.response_digest))
    || (record.deliveries.at(-1)?.sequence ?? (legacy ? 0 : record.compacted_through))
      !== record.last_acked_sequence
    || (!legacy && (!Number.isSafeInteger(record.compacted_through)
      || record.compacted_through < 0
      || record.compacted_through > record.desktop_consumed_through
      || (record.deliveries[0]?.sequence ?? record.compacted_through + 1)
        !== record.compacted_through + 1
      || !Array.isArray(record.compacted_owned_claims)
      || record.compacted_owned_claims.length > MAX_INTENTS
      || !record.compacted_owned_claims.every(validCompactedClaim)
      || record.compacted_owned_claims.some((claim, index) =>
        claim.sequence > record.compacted_through
        || index > 0 && claim.sequence <= record.compacted_owned_claims[index - 1].sequence)
      || new Set(record.compacted_owned_claims.map(claim => claim.request_key)).size
        !== record.compacted_owned_claims.length
      || !Array.isArray(record.current_epoch_client_id_digests)
      || record.current_epoch_client_id_digests.length > MAX_EPOCH_CLIENT_IDS
      || !record.current_epoch_client_id_digests.every(value => DIGEST.test(value))
      || new Set(record.current_epoch_client_id_digests).size
        !== record.current_epoch_client_id_digests.length
      || record.intents.some(intent => intent.client_epoch === record.client_epoch
        && !record.current_epoch_client_id_digests.includes(clientIdDigest(intent.client_id)))))
    || !DIGEST.test(record.record_digest ?? "")) throw new Error("desktop-gateway.state-invalid");
  const creationRefs = creationRefsFromDeliveries(record);
  const allCreationRefs = legacy ? creationRefs
    : [...record.compacted_owned_claims.map(claim => claim.thread_ref), ...(creationRefs ?? [])];
  if (!creationRefs || allCreationRefs.length !== record.owned_thread_refs.length
    || allCreationRefs.some((ref, index) => ref !== record.owned_thread_refs[index])) {
    throw new Error("desktop-gateway.state-invalid");
  }
  const {record_digest, ...material} = record;
  if (digestValue(material) !== record_digest) throw new Error("desktop-gateway.state-digest-invalid");
  return record;
}

function persistState(path, material, expectedDigest, consumerId, adapterId, backendBinding) {
  const record = freezeResult({...material, record_digest: digestValue(material)});
  const encoded = `${JSON.stringify(record)}\n`;
  if (Buffer.byteLength(encoded) > MAX_STATE_BYTES) throw new Error("desktop-gateway.state-limit");
  const temporary = `${path}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    writeSync(descriptor, encoded);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    const current = existsSync(path) ? readState(path, consumerId, adapterId, backendBinding) : null;
    if ((current?.record_digest ?? null) !== expectedDigest) throw new Error("desktop-gateway.state-drift");
    renameSync(temporary, path);
    const directory = openSync(dirname(path), constants.O_RDONLY);
    try { fsyncSync(directory); } finally { closeSync(directory); }
  } catch (error) {
    if (descriptor !== undefined && descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
  return record;
}

function stateLocation({state_dir: stateDir, consumer_id: consumerId,
  backend_adapter_id: adapterId, desktop_backend_binding: backendBinding} = {}) {
  if (process.platform === "win32") throw new Error("desktop-gateway.wsl-required");
  if (!nonEmptyString(stateDir) || !isAbsolute(stateDir) || !nonEmptyString(consumerId)
    || !nonEmptyString(adapterId) || consumerId.length > 256 || adapterId.length > 256
    || !isRecord(backendBinding) || !DIGEST.test(backendBinding.binary_sha256 ?? "")
    || !["desktop-wsl-base/v1", "desktop-wsl-app-tools/v1"].includes(backendBinding.host_profile)) {
    throw new TypeError("An absolute private state directory, consumer ID and adapter ID are required.");
  }
  const stat = lstatSync(stateDir);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(stateDir) !== stateDir
    || stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error("desktop-gateway.state-dir-unsafe");
  }
  return join(stateDir, "desktop-gateway-state.json");
}

// A diagnostic snapshot never acquires or repairs the writer lock. Its counts
// describe validated private state only; they do not authorize reconnect or
// prove that the desktop consumed a prior stdout delivery.
export function inspectDesktopGatewayState(options = {}) {
  const path = stateLocation(options);
  const record = existsSync(path) ? readState(path, options.consumer_id,
    options.backend_adapter_id, options.desktop_backend_binding) : null;
  const checkpointed = record?.schema_version === DESKTOP_GATEWAY_STATE_SCHEMA;
  const pendingIntentCount = record?.intents.filter(value => value.status === "pending").length ?? null;
  const retainedDeliveryCount = record?.deliveries.length ?? null;
  return freezeResult({schema_version: DESKTOP_GATEWAY_INSPECTION_SCHEMA,
    state_present: record !== null, validated_snapshot: record !== null,
    pending_intent_count: pendingIntentCount,
    retained_delivery_count: retainedDeliveryCount,
    compacted_through: checkpointed ? record.compacted_through : null,
    retained_creation_claim_count: checkpointed ? record.compacted_owned_claims.length : null,
    current_epoch_client_id_count: checkpointed ? record.current_epoch_client_id_digests.length : null,
    client_epoch: record?.client_epoch ?? null,
    desktop_consumed_through: record?.desktop_consumed_through ?? null,
    unresolved_server_request_count: record ? unresolvedServerRequestCount(record) : null,
    owned_thread_count: record?.owned_thread_refs.length ?? null,
    last_acked_sequence: record?.last_acked_sequence ?? null,
    requires_client_reconciliation: record === null ? null : needsClientReconciliation(record),
    gateway_reconnect_admission: "not-assessed",
    desktop_consumption: record?.desktop_consumed_through > 0
      ? "client-receipt-observed" : "not-observed",
    authority_effect: "none"});
}

export function createDesktopGatewayState({state_dir: stateDir, consumer_id: consumerId,
  backend_adapter_id: adapterId, desktop_backend_binding: backendBinding} = {}) {
  const path = stateLocation({state_dir: stateDir, consumer_id: consumerId,
    backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
  const lock = acquireLock(path);
  let record;
  try { record = existsSync(path) ? readState(path, consumerId, adapterId, backendBinding) : null; }
  catch (error) {
    closeSync(lock.descriptor);
    if (sameFile(lock.path, lock.identity)) unlinkSync(lock.path);
    throw error;
  }
  let closed = false;
  let bound = false;
  function requireOpen() { if (closed) throw new Error("desktop-gateway.state-closed"); }
  function requireBound() { requireOpen(); if (!bound) throw new Error("desktop-gateway.gateway-unbound"); }
  function save(material) {
    record = persistState(path, material, record?.record_digest ?? null, consumerId, adapterId, backendBinding);
  }
  // A checkpoint is eligible only after the desktop has acknowledged every
  // delivery and every request/server request has settled. The sequence floor
  // and creation claims preserve continuity and owned-thread evidence.
  function checkpoint() {
    if (!record || needsClientReconciliation(record)) return false;
    if (record.deliveries.length === 0 && record.intents.length === 0
      && record.server_response_intents.length === 0) return false;
    const claims = [...record.compacted_owned_claims];
    for (const delivery of record.deliveries) {
      const intent = record.intents.find(entry => entry.request_key === delivery.request_key);
      if (!intent || !THREAD_CREATION_METHODS.has(intent.method)
        || !Object.hasOwn(delivery.message, "result")) continue;
      claims.push({sequence: delivery.sequence, request_key: intent.request_key,
        client_id: intent.client_id, method: intent.method,
        message: delivery.message, message_digest: delivery.message_digest,
        thread_ref: threadRef(delivery.message.result?.thread?.id)});
    }
    const {record_digest, ...material} = record;
    save({...material, compacted_through: record.last_acked_sequence,
      compacted_owned_claims: claims, intents: [], deliveries: [], server_response_intents: []});
    return true;
  }
  if (record?.schema_version === LEGACY_STATE_SCHEMA) {
    const {record_digest, ...material} = record;
    save({...material, schema_version: DESKTOP_GATEWAY_STATE_SCHEMA,
      compacted_through: 0, compacted_owned_claims: [],
      current_epoch_client_id_digests: record.intents
        .filter(intent => intent.client_epoch === record.client_epoch)
        .map(intent => clientIdDigest(intent.client_id))});
  }
  function connectOptions() {
    requireOpen();
    return freezeResult({resume_token: record?.resume_token ?? null,
      last_acked_sequence: record?.last_acked_sequence ?? 0});
  }
  function beginClientConnection() {
    requireOpen();
    if (!record) return;
    if (needsClientReconciliation(record) || record.client_epoch >= Number.MAX_SAFE_INTEGER) {
      throw new Error("desktop-gateway.unreconciled-client-state");
    }
    checkpoint();
    const {record_digest, ...material} = record;
    save({...material, client_epoch: record.client_epoch + 1,
      current_epoch_client_id_digests: []});
  }
  function bindGateway(receipt) {
    requireOpen();
    const continuity = receipt?.continuity;
    if (!isRecord(receipt) || receipt.schema_version !== GATEWAY_CONNECTED_SCHEMA || receipt.ok !== true
      || receipt.consumer_id !== consumerId || receipt.lane !== "interaction-bound"
      || receipt.backend_adapter_id !== adapterId
      || receipt.desktop_backend_binding?.binary_sha256 !== backendBinding.binary_sha256
      || receipt.desktop_backend_binding?.host_profile !== backendBinding.host_profile
      || !nonEmptyString(continuity?.resume_token)
      || !DIGEST.test(continuity.resume_token_digest ?? "")
      || digestValue(continuity.resume_token) !== continuity.resume_token_digest
      || !Number.isSafeInteger(continuity.acknowledged_through)) {
      throw new Error("desktop-gateway.gateway-invalid");
    }
    if (record) {
      if (receipt.resumed !== true || record.resume_token !== continuity.resume_token
        || record.resume_token_digest !== continuity.resume_token_digest
        || record.last_acked_sequence !== continuity.acknowledged_through) {
        throw new Error("desktop-gateway.gateway-mismatch");
      }
    } else {
      if (receipt.resumed === true || continuity.acknowledged_through !== 0) {
        throw new Error("desktop-gateway.gateway-mismatch");
      }
      save({schema_version: DESKTOP_GATEWAY_STATE_SCHEMA, consumer_id: consumerId,
        client_epoch: 1,
        backend_adapter_id: adapterId, desktop_backend_binding: backendBinding,
        resume_token: continuity.resume_token,
        resume_token_digest: continuity.resume_token_digest, last_acked_sequence: 0,
        desktop_consumed_through: 0, compacted_through: 0,
        compacted_owned_claims: [], current_epoch_client_id_digests: [],
        intents: [], owned_thread_refs: [], deliveries: [], server_response_intents: []});
    }
    bound = true;
  }
  function recordIntent(message) {
    requireBound();
    if (!isRecord(message) || !nonEmptyString(message.method)
      || !Object.hasOwn(message, "id") || Object.hasOwn(message, GATEWAY_REQUEST_META_KEY)
      || !(typeof message.id === "string" || Number.isSafeInteger(message.id))
      || Buffer.byteLength(JSON.stringify(message)) > MAX_DELIVERY_BYTES) {
      throw new TypeError("Invalid desktop JSONL request intent.");
    }
    // Desktop JSON-RPC IDs remain unique for the lifetime of this connection,
    // even when a settled intent has been checkpointed away.
    if (OWNED_THREAD_METHODS.has(message.method)
      && !record.owned_thread_refs.includes(threadRef(message.params?.threadId))) {
      throw new Error("desktop-gateway.thread-unowned");
    }
    const idDigest = clientIdDigest(message.id);
    if (record.current_epoch_client_id_digests.includes(idDigest)) {
      throw new Error("desktop-gateway.client-id-reused");
    }
    if (record.current_epoch_client_id_digests.length >= MAX_EPOCH_CLIENT_IDS) {
      throw new Error("desktop-gateway.client-id-limit");
    }
    if (record.intents.length >= MAX_INTENTS) throw new Error("desktop-gateway.intent-limit");
    const requestKey = `desktop:${randomUUID()}`;
    const entry = {request_key: requestKey, client_epoch: record.client_epoch,
      client_id: message.id, method: message.method,
      binding_digest: digestValue({method: message.method,
        params: Object.hasOwn(message, "params") ? message.params : null}),
      status: "pending", response_digest: null};
    const {record_digest, ...material} = record;
    save({...material, intents: [...record.intents, entry],
      current_epoch_client_id_digests: [...record.current_epoch_client_id_digests, idDigest]});
    return freezeResult({request_key: requestKey,
      gateway_message: {...message, [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}}});
  }
  function recordDelivery({sequence, message, request_key: requestKey = null}) {
    requireBound();
    if (!Number.isSafeInteger(sequence) || sequence !== record.last_acked_sequence + 1
      || !isRecord(message) || Buffer.byteLength(JSON.stringify(message)) > MAX_DELIVERY_BYTES
      || !(requestKey === null || nonEmptyString(requestKey) && Buffer.byteLength(requestKey) <= 256)) {
      throw new Error("desktop-gateway.delivery-invalid");
    }
    if (record.deliveries.length >= MAX_DELIVERIES) throw new Error("desktop-gateway.delivery-limit");
    const response = (typeof message.id === "string" || Number.isSafeInteger(message.id))
      && !Object.hasOwn(message, "method")
      && (Object.hasOwn(message, "result") !== Object.hasOwn(message, "error"));
    const serverResponseDiagnostic = response && requestKey === null && isRecord(message.error)
      && record.server_response_intents.some(intent => intent.server_id === message.id)
      && !record.deliveries.some(delivery => delivery.request_key === null
        && !Object.hasOwn(delivery.message, "method") && delivery.message.id === message.id);
    const unboundError = message.id === null && !Object.hasOwn(message, "method")
      && !Object.hasOwn(message, "result") && isRecord(message.error);
    const serverRequest = typeof message.method === "string" && Object.hasOwn(message, "id");
    if (message.method === "serverRequest/resolved") {
      const requestId = message.params?.requestId;
      const threadId = message.params?.threadId;
      const prior = record.deliveries.find(delivery => Object.hasOwn(delivery.message, "id")
        && delivery.message.id === requestId && typeof delivery.message.method === "string"
        && delivery.message.params?.threadId === threadId);
      if (requestKey !== null || !(typeof requestId === "string" || Number.isSafeInteger(requestId))
        || !nonEmptyString(threadId) || !prior
        || record.deliveries.some(delivery => delivery.message.method === "serverRequest/resolved"
          && delivery.message.params?.requestId === requestId
          && delivery.message.params?.threadId === threadId)) {
        throw new Error("desktop-gateway.server-request-resolution-unbound");
      }
    }
    if (serverRequest && (requestKey !== null
      || !(typeof message.id === "string" || Number.isSafeInteger(message.id))
      || record.deliveries.some(delivery => typeof delivery.message.method === "string"
        && Object.hasOwn(delivery.message, "id") && delivery.message.id === message.id
        && !record.server_response_intents.some(intent => intent.delivery_sequence === delivery.sequence)))) {
      throw new Error("desktop-gateway.server-request-ambiguous");
    }
    let settledIntent = null;
    if (response && !serverResponseDiagnostic) {
      if (requestKey === null) throw new Error("desktop-gateway.response-key-missing");
      settledIntent = record.intents.find(entry => entry.request_key === requestKey);
      if (!settledIntent || settledIntent.status !== "pending" || message.id !== settledIntent.client_id) {
        throw new Error("desktop-gateway.response-unbound");
      }
    } else if (unboundError && requestKey !== null) {
      throw new Error("desktop-gateway.delivery-key-unbound");
    } else if (requestKey !== null && !record.intents.some(entry => entry.request_key === requestKey)) {
      throw new Error("desktop-gateway.delivery-key-unbound");
    }
    let createdThreadRef = null;
    if (settledIntent && THREAD_CREATION_METHODS.has(settledIntent.method)
      && Object.hasOwn(message, "result")) {
      createdThreadRef = threadRef(message.result?.thread?.id);
      if (!createdThreadRef || record.owned_thread_refs.includes(createdThreadRef)
        || record.owned_thread_refs.length >= MAX_INTENTS) {
        throw new Error("desktop-gateway.thread-creation-invalid");
      }
    }
    const messageDigest = digestValue(message);
    const {record_digest, ...material} = record;
    save({...material, last_acked_sequence: sequence,
      owned_thread_refs: createdThreadRef
        ? [...record.owned_thread_refs, createdThreadRef] : record.owned_thread_refs,
      deliveries: [...record.deliveries, {sequence, message, message_digest: messageDigest,
        request_key: requestKey}],
      intents: settledIntent ? record.intents.map(entry => entry.request_key === requestKey
        ? {...entry, status: "response-recorded", response_digest: messageDigest} : entry) : record.intents});
    return true;
  }
  function recordServerResponse(message) {
    requireBound();
    if (!isRecord(message) || Object.hasOwn(message, "method")
      || !(typeof message.id === "string" || Number.isSafeInteger(message.id))
      || (Object.hasOwn(message, "result") === Object.hasOwn(message, "error"))
      || Buffer.byteLength(JSON.stringify(message)) > MAX_DELIVERY_BYTES) {
      throw new Error("desktop-gateway.server-response-invalid");
    }
    const candidates = record.deliveries.filter(delivery => typeof delivery.message.method === "string"
      && Object.hasOwn(delivery.message, "id") && delivery.message.id === message.id
      && !record.server_response_intents.some(intent => intent.delivery_sequence === delivery.sequence));
    if (candidates.length !== 1) throw new Error("desktop-gateway.server-response-unbound");
    if (record.deliveries.some(delivery => delivery.message.method === "serverRequest/resolved"
      && delivery.message.params?.requestId === message.id
      && delivery.message.params?.threadId === candidates[0].message.params?.threadId)) {
      throw new Error("desktop-gateway.server-request-resolved");
    }
    const {record_digest, ...material} = record;
    save({...material, server_response_intents: [...record.server_response_intents,
      {delivery_sequence: candidates[0].sequence, server_id: message.id,
        response_digest: digestValue(message)}]});
    return true;
  }
  function recordDesktopConsumption({through_sequence: sequence, message_digest: messageDigest} = {}) {
    requireBound();
    const delivery = record.deliveries.find(value => value.sequence === sequence);
    if (!Number.isSafeInteger(sequence) || sequence !== record.desktop_consumed_through + 1
      || !DIGEST.test(messageDigest ?? "") || !delivery
      || delivery.message_digest !== messageDigest) {
      throw new Error("desktop-gateway.consumption-receipt-invalid");
    }
    const {record_digest, ...material} = record;
    save({...material, desktop_consumed_through: sequence});
    if (!needsClientReconciliation(record)
      && (record.deliveries.length >= CHECKPOINT_DELIVERIES
        || record.intents.length >= CHECKPOINT_INTENTS)) checkpoint();
    return true;
  }
  function close() {
    if (closed) return;
    closed = true;
    closeSync(lock.descriptor);
    if (sameFile(lock.path, lock.identity)
      && readLock(lock.path, path).lock_digest === lock.record.lock_digest) unlinkSync(lock.path);
  }
  return Object.freeze({connect_options: connectOptions, begin_client_connection: beginClientConnection,
    bind_gateway: bindGateway,
    record_intent: recordIntent, record_delivery: recordDelivery,
    record_server_response: recordServerResponse,
    record_desktop_consumption: recordDesktopConsumption,
    pending_intents: () => { requireBound(); return freezeResult(record.intents.filter(value => value.status === "pending")); },
    deliveries: () => { requireBound(); return freezeResult(record.deliveries); },
    inspect: () => freezeResult({bound, consumer_id: consumerId, backend_adapter_id: adapterId,
      last_acked_sequence: record?.last_acked_sequence ?? 0,
      client_epoch: record?.client_epoch ?? 0,
      pending_intent_count: record?.intents.filter(value => value.status === "pending").length ?? 0,
      owned_thread_count: record?.owned_thread_refs.length ?? 0,
      retained_delivery_count: record?.deliveries.length ?? 0,
      desktop_consumed_through: record?.desktop_consumed_through ?? 0,
      unresolved_server_request_count: record ? unresolvedServerRequestCount(record) : 0,
      requires_client_reconciliation: record ? needsClientReconciliation(record) : false,
      authority_effect: "none"}),
    close});
}
