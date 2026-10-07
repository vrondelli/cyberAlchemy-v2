import {randomUUID} from "node:crypto";
import {spawnSync} from "node:child_process";
import {constants, closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeSync} from "node:fs";
import {hostname} from "node:os";
import {dirname, isAbsolute, join, resolve, sep} from "node:path";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {GATEWAY_CONNECTED_SCHEMA} from "./gateway.mjs";

export const WINDOWS_CLIENT_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v6";
const LEGACY_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v1";
const PRIOR_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v2";
const SINGLE_RECEIPT_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v3";
const MULTI_RECEIPT_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v4";
const HOSTED_BINDING_RECOVERY_SCHEMA = "are.codex-windows-client-recovery/v5";
const HOSTED_THREAD_BINDING_SCHEMA = "are.codex-hosted-effect-thread-binding/v1";
const PENDING_TURN_SCHEMA = "are.codex-client-pending-turn/v1";
const BOUND_PENDING_TURN_SCHEMA = "are.codex-client-pending-turn/v2";
const PENDING_STEER_SCHEMA = "are.codex-client-pending-steer/v1";
const ACCEPTED_TURN_SCHEMA = "are.codex-client-accepted-turn/v1";
const BOUND_ACCEPTED_TURN_SCHEMA = "are.codex-client-accepted-turn/v2";
const RECOVERED_TURN_SCHEMA = "are.codex-client-recovered-turn/v1";
const GATEWAY_TURN_RECOVERY_SCHEMA = "are.gateway-turn-recovery/v1";
const LOCK_SCHEMA = "are.codex-windows-client-recovery-lock/v1";
const SEALED_SCHEMA = "are.codex-windows-client-recovery-sealed/v1";
const MAX_BYTES = 256 * 1024;
const MAX_SEALED_BYTES = 512 * 1024;
const MAX_THREADS = 1024;
export const MAX_ACCEPTED_TURN_RECEIPTS = 256;
const DIGEST = /^[0-9a-f]{64}$/;
const WINDOWS_DPAPI_SCRIPT = `$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
$data = [Convert]::FromBase64String([string]$request.data)
$entropy = [Convert]::FromBase64String([string]$request.entropy)
$scope = [Security.Cryptography.DataProtectionScope]::CurrentUser
if ($request.operation -eq 'protect') {
  $result = [Security.Cryptography.ProtectedData]::Protect($data, $entropy, $scope)
} elseif ($request.operation -eq 'unprotect') {
  $result = [Security.Cryptography.ProtectedData]::Unprotect($data, $entropy, $scope)
} else { throw 'Unsupported recovery protection operation.' }
[Console]::Out.Write([Convert]::ToBase64String($result))`;

function windowsProtection(operation, bytes, path) {
  const systemRoot = process.env.SystemRoot;
  if (!systemRoot) throw new Error("windows-client.recovery-native-windows-secret-store-unavailable");
  const powershell = join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const entropy = Buffer.from(`are.codex-windows-client-recovery/v1:${digestValue(resolve(path).toLowerCase())}`, "utf8");
  const input = JSON.stringify({operation, data: bytes.toString("base64"), entropy: entropy.toString("base64")});
  const command = Buffer.from(WINDOWS_DPAPI_SCRIPT, "utf16le").toString("base64");
  const result = spawnSync(powershell, ["-NoProfile", "-NonInteractive", "-EncodedCommand", command],
    {input, encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 1024 * 1024});
  if (result.status !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(result.stdout?.trim() ?? "")) {
    throw new Error("windows-client.recovery-protection-failed");
  }
  const encoded = result.stdout.trim();
  const output = Buffer.from(encoded, "base64");
  if (output.toString("base64") !== encoded
    || output.length > (operation === "protect" ? MAX_SEALED_BYTES : MAX_BYTES)) {
    throw new Error("windows-client.recovery-protection-failed");
  }
  return output;
}

function windowsRecoveryParent(path) {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) throw new Error("windows-client.recovery-parent-unsafe");
  const parent = dirname(path);
  const stat = lstatSync(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("windows-client.recovery-parent-unsafe");
  let actualParent;
  let actualLocal;
  try {
    actualParent = realpathSync(parent).toLowerCase();
    actualLocal = realpathSync(localAppData).toLowerCase();
  } catch { throw new Error("windows-client.recovery-parent-unsafe"); }
  if (!actualParent.startsWith(`${actualLocal}${sep}`)) throw new Error("windows-client.recovery-parent-unsafe");
}

function encodeRecord(path, record) {
  const plaintext = Buffer.from(`${JSON.stringify(record)}\n`, "utf8");
  if (plaintext.length > MAX_BYTES) throw new Error("windows-client.recovery-state-unsafe");
  if (process.platform !== "win32") return plaintext;
  const sealed = windowsProtection("protect", plaintext, path);
  return `${JSON.stringify({schema_version: SEALED_SCHEMA, protected_base64: sealed.toString("base64")})}\n`;
}

function decodeRecord(path, bytes) {
  if (process.platform !== "win32") return JSON.parse(bytes.toString("utf8"));
  let envelope;
  try { envelope = JSON.parse(bytes.toString("utf8")); }
  catch { throw new Error("windows-client.recovery-state-unreadable"); }
  if (!isRecord(envelope) || Object.keys(envelope).sort().join(",") !== "protected_base64,schema_version"
    || envelope.schema_version !== SEALED_SCHEMA || typeof envelope.protected_base64 !== "string"
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.protected_base64)) {
    throw new Error("windows-client.recovery-state-unsafe");
  }
  const sealed = Buffer.from(envelope.protected_base64, "base64");
  if (sealed.toString("base64") !== envelope.protected_base64 || sealed.length > MAX_SEALED_BYTES) {
    throw new Error("windows-client.recovery-state-unsafe");
  }
  return JSON.parse(windowsProtection("unprotect", sealed, path).toString("utf8"));
}

function validPendingTurn(value, threadIds) {
  const bound = value?.schema_version === BOUND_PENDING_TURN_SCHEMA;
  return isRecord(value)
    && Object.keys(value).sort().join(",") === (bound
      ? "created_at,request_binding_digest,request_key,schema_version,text_digest,thread_id"
      : "created_at,request_key,schema_version,text_digest,thread_id")
    && [PENDING_TURN_SCHEMA, BOUND_PENDING_TURN_SCHEMA].includes(value.schema_version)
    && (!bound || DIGEST.test(value.request_binding_digest ?? ""))
    && threadIds.includes(value.thread_id)
    && nonEmptyString(value.request_key) && value.request_key === value.request_key.trim()
    && Buffer.byteLength(value.request_key) <= 256
    && DIGEST.test(value.text_digest ?? "")
    && nonEmptyString(value.created_at) && Number.isFinite(Date.parse(value.created_at));
}

function samePendingTurn(left, right) {
  return left?.schema_version === right?.schema_version && left?.thread_id === right?.thread_id
    && left?.request_key === right?.request_key && left?.text_digest === right?.text_digest
    && left?.created_at === right?.created_at
    && left?.request_binding_digest === right?.request_binding_digest;
}

function validPendingSteer(value, threadIds, acceptedTurns) {
  return isRecord(value)
    && Object.keys(value).sort().join(",") === "created_at,request_key,schema_version,text_digest,thread_id,turn_id"
    && value.schema_version === PENDING_STEER_SCHEMA
    && threadIds.includes(value.thread_id)
    && acceptedTurns.some(entry => entry.thread_id === value.thread_id && entry.turn_id === value.turn_id)
    && nonEmptyString(value.turn_id) && value.turn_id === value.turn_id.trim()
    && Buffer.byteLength(value.turn_id) <= 256
    && typeof value.request_key === "string"
    && /^steer:[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(value.request_key)
    && DIGEST.test(value.text_digest ?? "")
    && nonEmptyString(value.created_at) && Number.isFinite(Date.parse(value.created_at));
}

function samePendingSteer(left, right) {
  return left?.schema_version === right?.schema_version && left?.thread_id === right?.thread_id
    && left?.turn_id === right?.turn_id && left?.request_key === right?.request_key
    && left?.text_digest === right?.text_digest && left?.created_at === right?.created_at;
}

function validGatewayTurnRecovery(value) {
  if (!isRecord(value)
    || Object.keys(value).sort().join(",") !== "authority_effect,host_observation_digest,receipt_digest,request_digest,request_key,schema_version,semantic_receipt_digest,thread_id,turn_id,turn_status"
    || value.schema_version !== GATEWAY_TURN_RECOVERY_SCHEMA || value.authority_effect !== "none"
    || !["completed", "interrupted", "failed"].includes(value.turn_status)
    || !nonEmptyString(value.thread_id) || value.thread_id !== value.thread_id.trim()
    || Buffer.byteLength(value.thread_id) > 256
    || !nonEmptyString(value.turn_id) || value.turn_id !== value.turn_id.trim()
    || Buffer.byteLength(value.turn_id) > 256
    || !nonEmptyString(value.request_key) || value.request_key !== value.request_key.trim()
    || Buffer.byteLength(value.request_key) > 256
    || !["request_digest", "host_observation_digest", "semantic_receipt_digest", "receipt_digest"]
      .every((key) => DIGEST.test(value[key] ?? ""))) return false;
  const {receipt_digest: receiptDigest, ...material} = value;
  return digestValue(material) === receiptDigest;
}

function validAcceptedTurn(value, threadIds) {
  if (value?.schema_version === BOUND_ACCEPTED_TURN_SCHEMA) {
    return isRecord(value)
      && Object.keys(value).sort().join(",") === "accepted_at,request_binding_digest,request_key,schema_version,text_digest,thread_id,turn_id"
      && threadIds.includes(value.thread_id) && nonEmptyString(value.turn_id)
      && value.turn_id === value.turn_id.trim() && Buffer.byteLength(value.turn_id) <= 256
      && nonEmptyString(value.request_key) && value.request_key === value.request_key.trim()
      && Buffer.byteLength(value.request_key) <= 256 && DIGEST.test(value.text_digest ?? "")
      && DIGEST.test(value.request_binding_digest ?? "")
      && nonEmptyString(value.accepted_at) && Number.isFinite(Date.parse(value.accepted_at));
  }
  if (value?.schema_version === RECOVERED_TURN_SCHEMA) {
    return isRecord(value)
      && Object.keys(value).sort().join(",") === "accepted_at,gateway_recovery,request_key,schema_version,text_digest,thread_id,turn_id"
      && threadIds.includes(value.thread_id) && nonEmptyString(value.turn_id)
      && value.turn_id === value.turn_id.trim() && Buffer.byteLength(value.turn_id) <= 256
      && nonEmptyString(value.request_key) && value.request_key === value.request_key.trim()
      && Buffer.byteLength(value.request_key) <= 256 && DIGEST.test(value.text_digest ?? "")
      && nonEmptyString(value.accepted_at) && Number.isFinite(Date.parse(value.accepted_at))
      && validGatewayTurnRecovery(value.gateway_recovery)
      && value.gateway_recovery.request_key === value.request_key
      && value.gateway_recovery.thread_id === value.thread_id
      && value.gateway_recovery.turn_id === value.turn_id;
  }
  return isRecord(value)
    && Object.keys(value).sort().join(",") === "accepted_at,request_key,schema_version,text_digest,thread_id,turn_id"
    && value.schema_version === ACCEPTED_TURN_SCHEMA
    && threadIds.includes(value.thread_id)
    && nonEmptyString(value.turn_id) && value.turn_id === value.turn_id.trim() && Buffer.byteLength(value.turn_id) <= 256
    && nonEmptyString(value.request_key) && value.request_key === value.request_key.trim()
    && Buffer.byteLength(value.request_key) <= 256 && DIGEST.test(value.text_digest ?? "")
    && nonEmptyString(value.accepted_at) && Number.isFinite(Date.parse(value.accepted_at));
}

function validHostedThreadBinding(value, threadIds) {
  return isRecord(value)
    && Object.keys(value).sort().join(",")
      === "cwd,host_user_agent,request_binding_digest,root_digest,schema_version,thread_id,tool_digest"
    && value.schema_version === HOSTED_THREAD_BINDING_SCHEMA
    && threadIds.includes(value.thread_id)
    && typeof value.cwd === "string" && isAbsolute(value.cwd)
    && Buffer.byteLength(value.cwd, "utf8") <= 4096
    && nonEmptyString(value.host_user_agent)
    && Buffer.byteLength(value.host_user_agent, "utf8") <= 256
    && ["request_binding_digest", "root_digest", "tool_digest"]
      .every(key => DIGEST.test(value[key] ?? ""));
}

function readPrivateRecord(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (process.platform !== "win32" && (stat.mode & 0o077) !== 0)
    || stat.size > (process.platform === "win32" ? MAX_SEALED_BYTES : MAX_BYTES)) {
    throw new Error("windows-client.recovery-state-unsafe");
  }
  let record;
  try { record = decodeRecord(path, readFileSync(path)); }
  catch (error) {
    if (error?.message?.startsWith("windows-client.recovery-")) throw error;
    throw new Error("windows-client.recovery-state-unreadable");
  }
  const legacy = record?.schema_version === LEGACY_RECOVERY_SCHEMA;
  const prior = record?.schema_version === PRIOR_RECOVERY_SCHEMA;
  const singleReceipt = record?.schema_version === SINGLE_RECEIPT_RECOVERY_SCHEMA;
  const multiReceipt = record?.schema_version === MULTI_RECEIPT_RECOVERY_SCHEMA;
  const hostedBinding = record?.schema_version === HOSTED_BINDING_RECOVERY_SCHEMA;
  const current = record?.schema_version === WINDOWS_CLIENT_RECOVERY_SCHEMA;
  if (!isRecord(record) || (!legacy && !prior && !singleReceipt && !multiReceipt && !hostedBinding && !current)
    || Object.keys(record).sort().join(",") !== (legacy
      ? "consumer_id,record_digest,resume_token,resume_token_digest,schema_version,thread_ids"
      : prior ? "consumer_id,pending_turn,record_digest,resume_token,resume_token_digest,schema_version,thread_ids"
        : singleReceipt ? "consumer_id,last_turn_result,pending_turn,record_digest,resume_token,resume_token_digest,schema_version,thread_ids"
          : multiReceipt ? "accepted_turns,consumer_id,last_turn_result,pending_turn,record_digest,resume_token,resume_token_digest,schema_version,thread_ids"
            : hostedBinding
              ? "accepted_turns,consumer_id,last_turn_result,pending_turn,record_digest,resume_token,resume_token_digest,schema_version,thread_bindings,thread_ids"
              : "accepted_turns,consumer_id,last_turn_result,pending_steer,pending_turn,record_digest,resume_token,resume_token_digest,schema_version,thread_bindings,thread_ids")
    || !nonEmptyString(record.consumer_id) || !nonEmptyString(record.resume_token)
    || record.resume_token.length > 256 || !Array.isArray(record.thread_ids)
    || record.thread_ids.length > MAX_THREADS || record.thread_ids.some((id) => !nonEmptyString(id) || id !== id.trim() || Buffer.byteLength(id) > 256)
    || new Set(record.thread_ids).size !== record.thread_ids.length
    || !DIGEST.test(record.resume_token_digest ?? "") || !DIGEST.test(record.record_digest ?? "")
    || (!legacy && record.pending_turn !== null && !validPendingTurn(record.pending_turn, record.thread_ids))
    || (!legacy && !prior && record.last_turn_result !== null && !validAcceptedTurn(record.last_turn_result, record.thread_ids))
    || (!legacy && !prior && !singleReceipt && (!Array.isArray(record.accepted_turns)
      || record.accepted_turns.length > MAX_ACCEPTED_TURN_RECEIPTS
      || record.accepted_turns.some((entry) => !validAcceptedTurn(entry, record.thread_ids))
      || new Set(record.accepted_turns.map((entry) => entry.request_key)).size !== record.accepted_turns.length
      || new Set(record.accepted_turns.map((entry) => entry.turn_id)).size !== record.accepted_turns.length
      || (record.pending_turn !== null && record.accepted_turns.length === MAX_ACCEPTED_TURN_RECEIPTS)
      || digestValue(record.accepted_turns.at(-1) ?? null) !== digestValue(record.last_turn_result)))
    || ((hostedBinding || current) && (!Array.isArray(record.thread_bindings)
      || record.thread_bindings.length > MAX_THREADS
      || record.thread_bindings.some(binding => !validHostedThreadBinding(binding, record.thread_ids))
      || new Set(record.thread_bindings.map(binding => binding.thread_id)).size !== record.thread_bindings.length))
    || (current && record.pending_steer !== null
      && !validPendingSteer(record.pending_steer, record.thread_ids, record.accepted_turns))
    || (current && record.pending_turn !== null && record.pending_steer !== null)
    || (!legacy && record.pending_turn && (singleReceipt
      ? record.pending_turn.request_key === record.last_turn_result?.request_key
      : !prior && record.accepted_turns.some((entry) => entry.request_key === record.pending_turn.request_key)))) {
    throw new Error("windows-client.recovery-state-invalid");
  }
  const material = {...record};
  delete material.record_digest;
  if (digestValue(record.resume_token) !== record.resume_token_digest || digestValue(material) !== record.record_digest) {
    throw new Error("windows-client.recovery-state-digest-invalid");
  }
  return record;
}

function readLock(path) {
  let record;
  try { record = JSON.parse(readFileSync(path, "utf8")); }
  catch { throw new Error("windows-client.recovery-lock-unreadable"); }
  if (!isRecord(record) || record.schema_version !== LOCK_SCHEMA || !nonEmptyString(record.path)
    || record.host_name !== hostname() || !Number.isSafeInteger(record.process_id) || record.process_id < 1
    || !nonEmptyString(record.nonce) || !DIGEST.test(record.lock_digest ?? "")) throw new Error("windows-client.recovery-lock-invalid");
  const material = {...record};
  delete material.lock_digest;
  if (digestValue(material) !== record.lock_digest) throw new Error("windows-client.recovery-lock-invalid");
  return record;
}

function processMissing(pid) {
  try { process.kill(pid, 0); return false; }
  catch (error) { return error?.code === "ESRCH"; }
}

function acquireLock(path) {
  const lockPath = `${path}.writer.lock`;
  const marker = `${lockPath}.recovery.lock`;
  if (existsSync(marker)) throw new Error("windows-client.recovery-lock-interrupted");
  let descriptor;
  try { descriptor = openSync(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw new Error("windows-client.recovery-lock-create-failed");
    const old = readLock(lockPath);
    if (old.path !== path || !processMissing(old.process_id)) throw new Error("windows-client.recovery-lock-held");
    const recovery = openSync(marker, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    try {
      const current = readLock(lockPath);
      if (current.lock_digest !== old.lock_digest || !processMissing(current.process_id)) throw new Error("windows-client.recovery-lock-held");
      unlinkSync(lockPath);
      descriptor = openSync(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    } finally {
      closeSync(recovery);
      unlinkSync(marker);
    }
  }
  const material = {schema_version: LOCK_SCHEMA, path, host_name: hostname(), process_id: process.pid, nonce: randomUUID()};
  const record = {...material, lock_digest: digestValue(material)};
  try { writeSync(descriptor, `${JSON.stringify(record)}\n`); fsyncSync(descriptor); }
  catch {
    closeSync(descriptor);
    unlinkSync(lockPath);
    throw new Error("windows-client.recovery-lock-write-failed");
  }
  return {lockPath, descriptor, record};
}

function writeState(path, record, expectedDigest) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    writeSync(descriptor, encodeRecord(path, record));
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    const current = existsSync(path) ? readPrivateRecord(path) : null;
    if ((current?.record_digest ?? null) !== expectedDigest) throw new Error("windows-client.recovery-state-drift");
    renameSync(temporary, path);
    if (process.platform !== "win32") {
      const directory = openSync(dirname(path), constants.O_RDONLY);
      try { fsyncSync(directory); } finally { closeSync(directory); }
    }
  } catch (error) {
    if (descriptor !== undefined && descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
}

export function createWindowsClientRecoveryState({path, consumer_id} = {}) {
  if (!nonEmptyString(path) || !nonEmptyString(consumer_id)) throw new TypeError("Recovery path and gateway consumer ID are required.");
  const statePath = resolve(path);
  if (process.platform === "win32") windowsRecoveryParent(statePath);
  else {
    const parent = lstatSync(dirname(statePath));
    if (!parent.isDirectory() || (parent.mode & 0o077) !== 0) throw new Error("windows-client.recovery-parent-unsafe");
  }
  const lock = acquireLock(statePath);
  let record;
  try { record = existsSync(statePath) ? readPrivateRecord(statePath) : null; }
  catch (error) { closeSync(lock.descriptor); unlinkSync(lock.lockPath); throw error; }
  if (record && record.consumer_id !== consumer_id) {
    closeSync(lock.descriptor);
    unlinkSync(lock.lockPath);
    throw new Error("windows-client.recovery-consumer-mismatch");
  }
  let closed = false;
  let bound = false;
  function requireOpen() { if (closed) throw new Error("windows-client.recovery-state-closed"); }
  function persist(material) {
    const next = freezeResult({...material, record_digest: digestValue(material)});
    writeState(statePath, next, record?.record_digest ?? null);
    record = next;
  }
  function bindGateway(receipt) {
    requireOpen();
    if (!isRecord(receipt) || receipt.schema_version !== GATEWAY_CONNECTED_SCHEMA || receipt.ok !== true
      || receipt.consumer_id !== consumer_id || !nonEmptyString(receipt.continuity?.resume_token)
      || !DIGEST.test(receipt.continuity?.resume_token_digest ?? "")
      || digestValue(receipt.continuity.resume_token) !== receipt.continuity.resume_token_digest) {
      throw new Error("windows-client.recovery-gateway-invalid");
    }
    if (record) {
      if (receipt.resumed !== true || record.resume_token_digest !== receipt.continuity.resume_token_digest
        || record.resume_token !== receipt.continuity.resume_token) throw new Error("windows-client.recovery-gateway-mismatch");
      if (record.schema_version !== WINDOWS_CLIENT_RECOVERY_SCHEMA) {
        const {record_digest, ...material} = record;
        const singleReceipt = record.schema_version === SINGLE_RECEIPT_RECOVERY_SCHEMA;
        const multiReceipt = record.schema_version === MULTI_RECEIPT_RECOVERY_SCHEMA;
        persist({...material, schema_version: WINDOWS_CLIENT_RECOVERY_SCHEMA,
          pending_turn: record.schema_version === LEGACY_RECOVERY_SCHEMA ? null : record.pending_turn,
          last_turn_result: singleReceipt || multiReceipt ? record.last_turn_result : null,
          accepted_turns: multiReceipt ? record.accepted_turns
            : singleReceipt && record.last_turn_result ? [record.last_turn_result] : [],
          thread_bindings: multiReceipt || singleReceipt || record.schema_version === LEGACY_RECOVERY_SCHEMA
            || record.schema_version === PRIOR_RECOVERY_SCHEMA ? [] : record.thread_bindings,
          pending_steer: null});
      }
    } else {
      if (receipt.resumed === true) throw new Error("windows-client.recovery-record-missing");
      persist({schema_version: WINDOWS_CLIENT_RECOVERY_SCHEMA, consumer_id, resume_token: receipt.continuity.resume_token,
        resume_token_digest: receipt.continuity.resume_token_digest, thread_ids: [], pending_turn: null,
        last_turn_result: null, accepted_turns: [], thread_bindings: [], pending_steer: null});
    }
    bound = true;
  }
  function recordThread(threadId, binding = null) {
    requireOpen();
    if (!bound || !record) throw new Error("windows-client.recovery-gateway-unbound");
    if (!nonEmptyString(threadId) || threadId !== threadId.trim() || Buffer.byteLength(threadId) > 256) throw new TypeError("Invalid thread ID.");
    if (binding !== null && (!validHostedThreadBinding(binding, [...record.thread_ids, threadId])
      || binding.thread_id !== threadId)) throw new TypeError("Invalid hosted thread binding.");
    if (record.thread_ids.includes(threadId)) {
      const existing = record.thread_bindings.find(entry => entry.thread_id === threadId) ?? null;
      if (digestValue(existing) !== digestValue(binding)) throw new Error("windows-client.recovery-thread-binding-conflict");
      return;
    }
    if (record.thread_ids.length >= MAX_THREADS) throw new Error("windows-client.recovery-thread-limit");
    const {record_digest, ...material} = record;
    persist({...material, thread_ids: [...record.thread_ids, threadId],
      thread_bindings: binding ? [...record.thread_bindings, binding] : record.thread_bindings});
  }
  function pendingTurnIntent() {
    requireOpen();
    if (!bound) throw new Error("windows-client.recovery-gateway-unbound");
    return record.pending_turn;
  }
  function lastTurnResult() {
    requireOpen();
    if (!bound) throw new Error("windows-client.recovery-gateway-unbound");
    return record.last_turn_result;
  }
  function acceptedTurnResults() {
    requireOpen();
    if (!bound) throw new Error("windows-client.recovery-gateway-unbound");
    return freezeResult(record.accepted_turns);
  }
  function pendingSteerIntent() {
    requireOpen();
    if (!bound) throw new Error("windows-client.recovery-gateway-unbound");
    return record.pending_steer;
  }
  function recordSteerIntent(entry) {
    requireOpen();
    if (!bound || !record) throw new Error("windows-client.recovery-gateway-unbound");
    if (!validPendingSteer(entry, record.thread_ids, record.accepted_turns)) {
      throw new TypeError("Invalid pending steer intent.");
    }
    if (record.pending_turn) throw new Error("windows-client.recovery-turn-intent-conflict");
    if (record.pending_steer) {
      if (!samePendingSteer(record.pending_steer, entry)) throw new Error("windows-client.recovery-steer-intent-conflict");
      return;
    }
    const {record_digest, ...material} = record;
    persist({...material, pending_steer: entry});
  }
  function clearSteerIntent(entry) {
    requireOpen();
    if (!bound || !record || !validPendingSteer(entry, record.thread_ids, record.accepted_turns)
      || !record.pending_steer || !samePendingSteer(record.pending_steer, entry)) {
      throw new Error("windows-client.recovery-steer-intent-mismatch");
    }
    const {record_digest, ...material} = record;
    persist({...material, pending_steer: null});
  }
  function recordTurnIntent(entry) {
    requireOpen();
    if (!bound || !record) throw new Error("windows-client.recovery-gateway-unbound");
    if (!validPendingTurn(entry, record.thread_ids)) throw new TypeError("Invalid pending turn intent.");
    if (record.pending_steer) throw new Error("windows-client.recovery-steer-intent-conflict");
    if (record.accepted_turns.some((accepted) => accepted.request_key === entry.request_key)) {
      throw new Error("windows-client.recovery-accepted-key-reused");
    }
    if (record.pending_turn) {
      if (!samePendingTurn(record.pending_turn, entry)) throw new Error("windows-client.recovery-turn-intent-conflict");
      return;
    }
    if (record.accepted_turns.length >= MAX_ACCEPTED_TURN_RECEIPTS) throw new Error("windows-client.recovery-accepted-receipt-limit");
    const {record_digest, ...material} = record;
    persist({...material, pending_turn: entry});
  }
  function settleTurnIntent(entry, turnId, requestBindingDigest = null) {
    requireOpen();
    if (!bound || !record) throw new Error("windows-client.recovery-gateway-unbound");
    if (!validPendingTurn(entry, record.thread_ids) || !record.pending_turn
      || !samePendingTurn(record.pending_turn, entry)) throw new Error("windows-client.recovery-turn-intent-mismatch");
    if (!nonEmptyString(turnId) || turnId !== turnId.trim() || Buffer.byteLength(turnId) > 256) {
      throw new TypeError("Invalid accepted turn ID.");
    }
    if (requestBindingDigest !== null && (entry.schema_version !== BOUND_PENDING_TURN_SCHEMA
      || requestBindingDigest !== entry.request_binding_digest)) {
      throw new Error("windows-client.recovery-accepted-binding-mismatch");
    }
    const accepted = {schema_version: requestBindingDigest === null ? ACCEPTED_TURN_SCHEMA
      : BOUND_ACCEPTED_TURN_SCHEMA, thread_id: entry.thread_id,
      request_key: entry.request_key, text_digest: entry.text_digest, turn_id: turnId, accepted_at: new Date().toISOString()};
    if (requestBindingDigest !== null) accepted.request_binding_digest = requestBindingDigest;
    const {record_digest, ...material} = record;
    persist({...material, pending_turn: null, last_turn_result: accepted,
      accepted_turns: [...record.accepted_turns, accepted]});
    return record.last_turn_result;
  }
  function settleRecoveredTurnIntent(entry, gatewayRecovery) {
    requireOpen();
    if (!bound || !record || !validPendingTurn(entry, record.thread_ids)
      || entry.schema_version !== BOUND_PENDING_TURN_SCHEMA
      || !record.pending_turn || !samePendingTurn(record.pending_turn, entry)
      || !validGatewayTurnRecovery(gatewayRecovery)
      || gatewayRecovery.thread_id !== entry.thread_id
      || gatewayRecovery.request_key !== entry.request_key
      || gatewayRecovery.request_digest !== entry.request_binding_digest) {
      throw new Error("windows-client.recovery-turn-receipt-mismatch");
    }
    const recovered = {schema_version: RECOVERED_TURN_SCHEMA, thread_id: entry.thread_id,
      request_key: entry.request_key, text_digest: entry.text_digest,
      turn_id: gatewayRecovery.turn_id, gateway_recovery: gatewayRecovery,
      accepted_at: new Date().toISOString()};
    const {record_digest, ...material} = record;
    persist({...material, pending_turn: null, last_turn_result: recovered,
      accepted_turns: [...record.accepted_turns, recovered]});
    return record.last_turn_result;
  }
  function rejectTurnIntent(entry, reasonCode) {
    requireOpen();
    if (!bound || !record) throw new Error("windows-client.recovery-gateway-unbound");
    if (!["reasoning.prior-turn-unsettled", "gateway.restricted-host-config-drift",
      "reasoning.preflight-failed"].includes(reasonCode)
      || !validPendingTurn(entry, record.thread_ids)
      || !record.pending_turn || !samePendingTurn(record.pending_turn, entry)) {
      throw new Error("windows-client.recovery-turn-rejection-unbound");
    }
    const {record_digest, ...material} = record;
    persist({...material, pending_turn: null});
  }
  function close() {
    if (closed) return;
    closed = true;
    closeSync(lock.descriptor);
    const current = readLock(lock.lockPath);
    if (current.lock_digest === lock.record.lock_digest) unlinkSync(lock.lockPath);
  }
  return Object.freeze({bind_gateway: bindGateway, record_thread: recordThread,
    pending_turn_intent: pendingTurnIntent, record_turn_intent: recordTurnIntent,
    pending_steer_intent: pendingSteerIntent, record_steer_intent: recordSteerIntent,
    clear_steer_intent: clearSteerIntent,
    has_unresolved_turn_intent: () => { requireOpen(); return record?.pending_turn !== null && record?.pending_turn !== undefined; },
    last_turn_result: lastTurnResult, accepted_turn_results: acceptedTurnResults,
    settle_turn_intent: settleTurnIntent,
    settle_recovered_turn_intent: settleRecoveredTurnIntent, reject_turn_intent: rejectTurnIntent,
    thread_ids: () => [...(record?.thread_ids ?? [])],
    thread_binding: threadId => record?.thread_bindings?.find(entry => entry.thread_id === threadId) ?? null,
    resume_token: () => record?.resume_token ?? null,
    state_path: statePath, close});
}
