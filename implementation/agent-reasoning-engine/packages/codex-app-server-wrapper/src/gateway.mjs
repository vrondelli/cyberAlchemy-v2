import {randomBytes, randomUUID, timingSafeEqual} from "node:crypto";
import {chmodSync, existsSync, lstatSync, realpathSync, statSync, unlinkSync} from "node:fs";
import {createServer} from "node:net";
import {hostname} from "node:os";

import {createCodexGatewayBackendAdapter, gatewayBackendCapabilities, spawnGatewayBackend, validateGatewayBackendAdapter} from "./backend-adapter.mjs";
import {backendProcessBirthRef, backendProcessBirthSupported, classifyBackendProcessIdentity} from "./backend-process-birth.mjs";
import {projectAdapterObservation} from "./adapter-observation.mjs";
import {projectGatewayThreadObservation} from "./thread-observation.mjs";
import {projectGatewayDecisionObservation} from "./decision-observation.mjs";
import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {createGatewayBackedConversationBindingContract} from "./conversation-binding-contract.mjs";
import {createFileGatewaySessionStore, createMemoryGatewaySessionStore, GATEWAY_SESSION_FAULT_SCHEMA} from "./gateway-session-store.mjs";
import {verifyCodexModelEntryReceipt} from "./model-entry-receipt.mjs";
import {isCodexAppServerWrapper} from "./wrapper.mjs";
import {resolveGatewayIpcPath} from "./local-ipc.mjs";
import {validHostedInputAttestationKey, verifyHostedInput} from "./hosted-input-attestation.mjs";
import {hostedMcpRelayCatalogPosture, hostedRestrictedMcpCatalogPosture} from "./hosted-mcp-catalog.mjs";
import {probeWindowsHostedCommandSandbox, restrictedHostConfigMatches, validateWindowsSandboxMode} from "./restricted-host-profile.mjs";
import {jsonLine, jsonRpcError, parseJsonLine} from "./protocol.mjs";
import {observeMarkedTurnInHostHistory, verifyAcceptedCompactionInHostHistory, verifyAcceptedTurnInHostHistory} from "./host-turn-reconciliation.mjs";
import {codexGatewayGeneratedParameterPosture, codexGatewayLifecycleParameterPosture, codexServerNotificationRequiresAcceptedTurn, codexServerRequestCriticalShapePosture, codexServerRequestTurnPosture, gatewayClientMethodPosture, gatewayServerMethodPosture} from "./host-method-policy.mjs";
import {validExpectedCodexVersion, verifyCodexBackendInitializeVersion} from "./host-backend-identity.mjs";
import {desktopHostGlobalNotificationPosture, isDesktopSidebandNotification} from "./desktop-host-protocol.mjs";

export const GATEWAY_CONNECT_SCHEMA = "are.codex-gateway-connect/v1";
export const GATEWAY_CONNECTED_SCHEMA = "are.codex-gateway-connected/v1";
export const GATEWAY_DELIVERY_SCHEMA = "are.codex-gateway-delivery/v1";
export const GATEWAY_ACK_SCHEMA = "are.codex-gateway-ack/v1";
export const GATEWAY_REQUEST_META_KEY = "_are_gateway";
export const GATEWAY_TURN_RECOVERY_GET = "cyberalchemy/gateway/turnRecovery/get";
export const GATEWAY_TURN_RECOVERY_CONFIRM = "cyberalchemy/gateway/turnRecovery/confirm";
export const GATEWAY_TURN_RECOVERY_SCHEMA = "are.gateway-turn-recovery/v1";
export const GATEWAY_STEER_OUTCOME_GET = "cyberalchemy/gateway/steerOutcome/get";
export const GATEWAY_STEER_OUTCOME_SCHEMA = "are.gateway-steer-outcome/v1";
export const GATEWAY_THREAD_CREATION_RECOVERY_GET = "cyberalchemy/gateway/threadCreationRecovery/get";
export const GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM = "cyberalchemy/gateway/threadCreationRecovery/confirm";
export const GATEWAY_THREAD_CREATION_RECOVERY_SCHEMA = "are.gateway-thread-creation-recovery/v1";
export const GATEWAY_OWNED_RUNTIME_GET = "cyberalchemy/gateway/ownedRuntime/get";
export const GATEWAY_OWNED_RUNTIME_SCHEMA = "are.gateway-owned-runtime/v1";
export const ACKNOWLEDGED_CONTINUITY_MODE = "acknowledged-v1";
export const GATEWAY_SESSION_EXPIRATION_SCHEMA = "are.codex-session-expiration/v1";
export const ADAPTER_OBSERVATION_REQUEST_SCHEMA = "are.adapter-observation-request/v1";
export const ADAPTER_OBSERVATION_RESPONSE_SCHEMA = "are.adapter-observation-response/v1";
export const THREAD_OBSERVATION_REQUEST_SCHEMA = "are.gateway-thread-observation-request/v1";
export const THREAD_OBSERVATION_RESPONSE_SCHEMA = "are.gateway-thread-observation-response/v1";
export const DECISION_OBSERVATION_REQUEST_SCHEMA = "are.gateway-decision-observation-request/v1";
export const DECISION_OBSERVATION_RESPONSE_SCHEMA = "are.gateway-decision-observation-response/v1";
const LANES = new Set(["plan-bound", "interaction-bound"]);
const READ_ONLY_THREAD_METHODS = new Set(["model/list", "thread/read", "thread/list", "thread/loaded/list", "thread/turns/list", "thread/items/list", "thread/goal/get", "thread/backgroundTerminals/list", "mcpServerStatus/list", "cyberalchemy/hostedEffect/assess"]);
const CODEX_UNSCOPED_THREAD_READS = new Set(["thread/list", "thread/loaded/list"]);
const CODEX_SCOPED_THREAD_METHODS = new Set([
  "thread/read", "thread/turns/list", "thread/items/list", "thread/goal/get", "thread/backgroundTerminals/list",
  "mcpServerStatus/list",
  "thread/resume", "thread/fork", "thread/name/set", "thread/compact/start",
  "turn/start", "turn/steer", "turn/interrupt",
  "cyberalchemy/continuation/registerPlan", "cyberalchemy/continuation/registerInteraction",
  "cyberalchemy/intent/get", "cyberalchemy/intent/project", "cyberalchemy/intent/control",
  "cyberalchemy/hostedEffect/assess", "cyberalchemy/hostedEffect/execute",
  "cyberalchemy/learning/submitFeedback",
  "cyberalchemy/learning/applyPendingFeedback",
  "cyberalchemy/learning/dismissPendingFeedback",
  "cyberalchemy/learning/pendingFeedback/list",
  "cyberalchemy/learning/lessons/list",
]);
const THREAD_CREATION_METHODS = new Set(["thread/start", "thread/fork"]);
const TURN_WRITER_METHODS = new Set(["turn/start", "turn/steer", "turn/interrupt", "review/start"]);
const MODEL_ENTRY_METHODS = new Set(["turn/start", "turn/steer", "review/start", "thread/compact/start"]);
const BINDING_ADMISSION_REASONS = new Set(["binding.gateway-session-not-active", "binding.unowned",
  "binding.host-assertion-invalid", "binding.host-identity-mismatch", "binding.store-drift",
  "binding.generation-mismatch", "binding.not-active", "binding.expired"]);
const GENERATED_REQUEST_PREFIX = "are-generated:";
const MCP_RELAY_CATALOG_TTL_MS = 15_000;
const MAX_MCP_RELAY_CHECKS_PER_SESSION = 256;

function verifiedModelEntryReceipts(actions, source) {
  const turns = actions.to_server.filter((message) => message.method === "turn/start");
  const receipts = actions.model_entry_receipts ?? [];
  if (turns.length > 1 || (turns.length === 1 && actions.to_server.length !== 1)
    || !Array.isArray(receipts) || receipts.length !== turns.length) return null;
  const byMessageDigest = new Map();
  for (const receipt of receipts) {
    if (receipt?.source !== source || !verifyCodexModelEntryReceipt(receipt)
      || byMessageDigest.has(receipt.forwarded_message_digest)) return null;
    byMessageDigest.set(receipt.forwarded_message_digest, receipt);
  }
  for (const turn of turns) {
    const digest = digestValue(turn);
    if (!verifyCodexModelEntryReceipt(byMessageDigest.get(digest), {forwarded_message: turn})) return null;
  }
  return byMessageDigest;
}

function backendProcessState(identity) {
  try {
    process.kill(identity.process_id, 0);
    return classifyBackendProcessIdentity(identity, "alive",
      identity.birth_ref ? backendProcessBirthRef(identity.process_id) : null);
  } catch (error) { return error?.code === "ESRCH" ? "missing" : "unknown"; }
}

function ownedBackendExited(child) {
  return child.exitCode != null || child.signalCode != null;
}

async function awaitOwnedBackendExit(child) {
  const waitWithin = (timeoutMs) => new Promise(resolveExit => {
    if (ownedBackendExited(child)) return resolveExit(true);
    let timer;
    const finish = (exited) => {
      clearTimeout(timer);
      child.off("exit", onExit);
      resolveExit(exited);
    };
    const onExit = () => finish(true);
    child.once("exit", onExit);
    timer = setTimeout(() => finish(false), timeoutMs);
  });
  if (await waitWithin(3000)) return;
  if (!ownedBackendExited(child)) child.kill("SIGKILL");
  if (!await waitWithin(3000)) throw new Error("gateway.backend-shutdown-unconfirmed");
}

function mutatesBackendThread(method) {
  return method === "cyberalchemy/hostedEffect/execute"
    || TURN_WRITER_METHODS.has(method) || (typeof method === "string" && method.startsWith("thread/")
    && !READ_ONLY_THREAD_METHODS.has(method));
}

function scopedThreadId(message) {
  return message?.method === "cyberalchemy/hostedEffect/execute"
    ? message?.params?.request?.thread_id : message?.params?.threadId;
}

function send(stream, value) {
  if (stream && !stream.destroyed) stream.write(jsonLine(value));
}

function validateHandshake(value) {
  if (!isRecord(value) || value.schema_version !== GATEWAY_CONNECT_SCHEMA || !nonEmptyString(value.consumer_id) || !LANES.has(value.lane)) {
    return {ok: false, reason: "gateway.handshake-invalid"};
  }
  if (value.consumer_id.length > 256) return {ok: false, reason: "gateway.consumer-id-too-long"};
  if (value.expected_backend_adapter_id !== undefined
    && (!nonEmptyString(value.expected_backend_adapter_id) || value.expected_backend_adapter_id.length > 256)) {
    return {ok: false, reason: "gateway.expected-backend-adapter-invalid"};
  }
  let continuity = null;
  if (value.continuity !== undefined) {
    if (!isRecord(value.continuity) || value.continuity.mode !== ACKNOWLEDGED_CONTINUITY_MODE) {
      return {ok: false, reason: "gateway.continuity-mode-invalid"};
    }
    if (value.continuity.resume_token !== undefined && (!nonEmptyString(value.continuity.resume_token) || value.continuity.resume_token.length > 256)) {
      return {ok: false, reason: "gateway.resume-token-invalid"};
    }
    const lastAcked = value.continuity.last_acked_sequence ?? 0;
    if (!Number.isSafeInteger(lastAcked) || lastAcked < 0) return {ok: false, reason: "gateway.ack-sequence-invalid"};
    const aliases = value.continuity.request_aliases ?? [];
    if (!Array.isArray(aliases) || aliases.length > 256 || aliases.some((alias) => !isRecord(alias) || !nonEmptyString(alias.request_key) || alias.request_key.length > 256 || alias.request_key.startsWith(GENERATED_REQUEST_PREFIX) || !Object.hasOwn(alias, "client_id"))) {
      return {ok: false, reason: "gateway.request-aliases-invalid"};
    }
    continuity = {mode: value.continuity.mode, resume_token: value.continuity.resume_token ?? null, last_acked_sequence: lastAcked, request_aliases: aliases};
  }
  return {ok: true, value: {consumer_id: value.consumer_id, lane: value.lane,
    expected_backend_adapter_id: value.expected_backend_adapter_id ?? null, continuity}};
}

function sameSecret(left, right) {
  if (!nonEmptyString(left) || !nonEmptyString(right)) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requestMetadata(message) {
  const metadata = message?.[GATEWAY_REQUEST_META_KEY];
  if (metadata === undefined) return {ok: true, request_key: null,
    hosted_input_attestation: null, message};
  if (!isRecord(metadata) || Object.keys(metadata).some((key) => !["request_key", "hosted_input_attestation"].includes(key))
    || (metadata.request_key === undefined && metadata.hosted_input_attestation === undefined)
    || (metadata.request_key !== undefined && (!nonEmptyString(metadata.request_key)
      || metadata.request_key.length > 256 || metadata.request_key.startsWith(GENERATED_REQUEST_PREFIX)))
    || (metadata.hosted_input_attestation !== undefined
      && (typeof metadata.hosted_input_attestation !== "string"
        || !/^[0-9a-f]{64}$/.test(metadata.hosted_input_attestation)))) {
    return {ok: false, reason: "gateway.request-key-invalid"};
  }
  const clean = {...message};
  delete clean[GATEWAY_REQUEST_META_KEY];
  return {ok: true, request_key: metadata.request_key ?? null,
    hosted_input_attestation: metadata.hosted_input_attestation ?? null, message: clean};
}

function removeSocketPath(path) {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (!stat.isSocket()) throw new Error(`Gateway listen path exists and is not a socket: ${path}`);
  unlinkSync(path);
}

function createLineReader(stream, onLine, onOverflow, initial = "") {
  let buffer = initial;
  const onData = (chunk) => {
    buffer += chunk.toString("utf8");
    if (buffer.length > 1024 * 1024) {
      onOverflow();
      return;
    }
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (line.trim()) onLine(line);
    }
  };
  stream.on("data", onData);
  return () => stream.off("data", onData);
}

function createSession({metadata, wrapper, backend, backendAdapter, backendCapabilities, expectedCodexVersion = null, desktopGlobalNotifications = false, turnIngressBlockedReason = null, authorizeBoundModelEntry = async () => ({ok: true}), bindNativeThreadCreation = async () => ({ok: true}), requireBoundNativeCreation = false, requireModelEntryReceipt = false, requireMcpHookRelay = false, requireRestrictedMcpCatalog = false, allowHostedEffectTool = false, restrictedHostConfig = null, windowsBackendSandboxAttestation = null, hostedInputKey = null, hostedInputConsumer = null, spawnImpl, WebSocketImpl, maxBufferedMessages, reconnectEnabled, continuityMode, detachTimeoutMs, idleTimeoutMs, maxRetainedBytes, maxReasoningLogBytes, evictionRetryMs, onBackendStderr, onClosed, onExpired, onDurableEvent = () => ({ok: true}), hostObservationsForConsumer = () => [], getStoredSession = () => null, claimBackendThread = () => ({ok: true}), precheckBackendThread = () => ({ok: true}), backendThreadOwned = () => false, initialResumeToken = null, initialStableRequests = [], initialDeliveries = [], initialAcknowledgedThrough = 0, initialDeliverySequence = 0, initialServerRequests = []}) {
  if (requireModelEntryReceipt && initialStableRequests.some((request) => request.method === "turn/start"
    && request.pre_dispatch_rejection !== true && !request.model_entry_proof)) {
    throw new TypeError("gateway.recovered-model-entry-receipt-missing");
  }
  const requireMcpCatalog = requireMcpHookRelay || requireRestrictedMcpCatalog;
  const mcpCatalogReason = requireRestrictedMcpCatalog
    ? "gateway.restricted-mcp-catalog-preflight-required" : "gateway.mcp-hook-relay-preflight-required";
  if (restrictedHostConfig && !restrictedHostConfigMatches(restrictedHostConfig)) {
    throw new Error("gateway.restricted-host-config-drift");
  }
  const child = spawnGatewayBackend(backendAdapter, backend, {spawn_impl: spawnImpl, websocket_impl: WebSocketImpl});
  let client = null;
  let detachReader = null;
  let clientChain = Promise.resolve();
  let serverChain = Promise.resolve();
  let closed = false;
  let closeReason = null;
  let windowsBackendSandboxStatus = windowsBackendSandboxAttestation ? "pending-initialize" : "not-configured";
  let windowsBackendSandboxReason = null;
  let windowsBackendSandboxAttestedPid = null;
  const pendingSandboxProbeRequests = new Map();
  function backendSandboxRpcRequest(method, params, {timeout_ms: timeoutMs = 10_000} = {}) {
    if (closed || initialization.status !== "complete") return Promise.reject(new Error("gateway.windows-backend-not-initialized"));
    const id = `are-gateway:sandbox-probe:${randomUUID()}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingSandboxProbeRequests.delete(id);
        reject(new Error("gateway.windows-backend-sandbox-probe-timeout"));
      }, timeoutMs);
      pendingSandboxProbeRequests.set(id, {resolve, reject, timer});
      send(child.stdin, {jsonrpc: "2.0", id, method, params});
    });
  }
  function startWindowsBackendSandboxAttestation() {
    if (!windowsBackendSandboxAttestation || windowsBackendSandboxStatus !== "pending-initialize") return;
    windowsBackendSandboxStatus = "checking";
    void (async () => {
      const config = await backendSandboxRpcRequest("config/read", {includeLayers: false});
      validateWindowsSandboxMode(config, windowsBackendSandboxAttestation.mode);
      const result = await probeWindowsHostedCommandSandbox({rpc: {request: backendSandboxRpcRequest},
        workspaceRoot: windowsBackendSandboxAttestation.workspace_root,
        nodeCommand: windowsBackendSandboxAttestation.node_command});
      if (!closed && result.status === "passed") {
        windowsBackendSandboxAttestedPid = child.pid;
        windowsBackendSandboxStatus = "passed-this-backend";
      }
    })().catch((error) => {
      if (!closed) {
        windowsBackendSandboxStatus = "failed";
        windowsBackendSandboxReason = error.message;
      }
    });
  }
  function windowsSandboxProofForEffect() {
    if (process.platform !== "win32") return {ok: true, root: null};
    if (closed || !windowsBackendSandboxAttestation
      || windowsBackendSandboxStatus !== "passed-this-backend"
      || !Number.isSafeInteger(child.pid) || child.pid !== windowsBackendSandboxAttestedPid
      || child.exitCode !== null || child.signalCode !== null) {
      return {ok: false, reason: "hosted-effect.windows-backend-sandbox-unverified"};
    }
    if (!restrictedHostConfig || !restrictedHostConfigMatches(restrictedHostConfig)) {
      return {ok: false, reason: "gateway.restricted-host-config-drift"};
    }
    try {
      if (realpathSync(windowsBackendSandboxAttestation.workspace_root)
        !== windowsBackendSandboxAttestation.workspace_root) {
        return {ok: false, reason: "hosted-effect.windows-backend-root-drift"};
      }
    } catch { return {ok: false, reason: "hosted-effect.windows-backend-root-drift"}; }
    return {ok: true, root: windowsBackendSandboxAttestation.workspace_root};
  }
  const buffered = [];
  const resumeToken = continuityMode === ACKNOWLEDGED_CONTINUITY_MODE
    ? (initialResumeToken ?? randomBytes(32).toString("base64url"))
    : null;
  const resumeTokenDigest = resumeToken ? digestValue(resumeToken) : null;
  const deliveries = new Map();
  const deliveredThisAttachment = new Set();
  let clientDeliveryReady = false;
  let deliverySequence = initialDeliverySequence;
  let acknowledgedThrough = initialAcknowledgedThrough;
  const stableRequests = new Map();
  const compactionAcceptance = (entry) => hostObservationsForConsumer().find((observation) =>
    observation.kind === "compaction-turn-accepted"
    && observation.thread_ref === entry.thread_ref
    && observation.request_digest === entry.binding_digest
    && observation.request_key_digest === digestValue(entry.request_key));
  const unsettledCompaction = () => [...stableRequests.values()].find((entry) => {
    if (entry.method !== "thread/compact/start") return false;
    if (entry.status === "complete" && entry.response?.error) return false;
    const accepted = compactionAcceptance(entry);
    if (entry.status !== "complete" || !accepted) return true;
    const observations = hostObservationsForConsumer();
    const recovered = observations.some((observation) => observation.kind === "compaction-history-verified"
      && observation.thread_ref === entry.thread_ref && observation.turn_ref === accepted.turn_ref
      && observation.request_digest === entry.binding_digest
      && observation.request_key_digest === digestValue(entry.request_key)
      && observation.turn_status === "completed");
    if (recovered) return false;
    const item = observations.some((observation) => observation.kind === "compaction-item-completed"
      && observation.thread_ref === entry.thread_ref && observation.turn_ref === accepted.turn_ref);
    const terminal = observations.some((observation) => observation.kind === "turn-completion-observed"
      && observation.thread_ref === entry.thread_ref && observation.turn_ref === accepted.turn_ref
      && observation.request_digest === entry.binding_digest
      && observation.request_key_digest === digestValue(entry.request_key)
      && observation.turn_status === "completed");
    return !item || !terminal;
  });
  // This proof is intentionally process-local. A recovered gateway must never
  // infer an untouched thread from a stored creation receipt alone.
  const freshThreadCreations = new Map();
  const unsettledThreadCreation = () => backendAdapter.adapter_id === "codex-app-server/v1"
    ? [...stableRequests.values()].find((entry) => entry.method === "thread/start"
      && !["complete", "recovered"].includes(entry.status)) : null;
  const upstreamRequests = new Map();
  const pendingThreadCreations = new Map();
  const pendingThreadStarted = new Map();
  const pendingHostSteers = new Map();
  const pendingHostReads = new Map();
  const pendingAutoCompactionReads = new Map();
  const autoCompactionReadAttempts = new Map();
  const pendingPreAcceptanceEvents = [];
  const recoveryCandidates = new Map();
  const pendingHostRequests = new Map();
  const readyMcpRelayCatalogs = new Map();
  const lastMcpRelayChecks = new Map();
  const governedServerEvents = backendAdapter.adapter_id === "codex-app-server/v1"
    || typeof backendAdapter.server_method_posture === "function";
  const attachmentRequestKeys = new Set();
  const serverRequests = new Map();
  let upstreamRequestSequence = 0;
  let deduplicatedRequestCount = 0;
  let deduplicatedServerResponseCount = 0;
  let reconnectCount = 0;
  let initialization = freezeResult({status: "not-started", binding_digest: null, request_id: null, client_name: null, result: null, result_digest: null});
  let hostInitializeVersionVerification = null;
  let initializationForwardCount = 0;
  let initializationReplayCount = 0;
  const pendingInitializationAliases = new Map();
  let lastActivityAt = Date.now();
  let detachedAt = null;
  let lifecycleTimer = null;
  let evictionInProgress = false;
  let evictionAttemptCount = 0;
  let lastEvictionBlock = null;
  let expirationReceipt = null;
  function trackHostRead(message, clientId = message.id, purpose = "client-history",
    compactionRequestKey = null) {
    if (backendAdapter.adapter_id !== "codex-app-server/v1" || message.method !== "thread/read"
      || message.params?.includeTurns !== true || !nonEmptyString(message.params?.threadId)
      || !Object.hasOwn(message, "id")) return true;
    const threadRef = `backend-thread:${digestValue(message.params.threadId)}`;
    let audit = null;
    if (purpose !== "auto-compaction" && [...stableRequests.values()].some((request) => ["turn/start", "thread/compact/start"].includes(request.method)
      && ["complete", "outcome-unknown"].includes(request.status) && request.thread_ref === threadRef)) {
      audit = {audit_ref: digestValue({thread_ref: threadRef, nonce: randomUUID()}), thread_ref: threadRef};
      if (onDurableEvent("history-audit-started", {audit})?.ok !== true) {
        emitClient(jsonRpcError(clientId, -32103, "Gateway history audit could not be persisted", {
          reason_codes: ["gateway.history-audit-not-durable"], authority_effect: "none",
        }));
        stop("gateway.history-audit-not-durable", true, false);
        return false;
      }
    }
    pendingHostReads.set(String(message.id), {thread_ref: threadRef, audit, purpose,
      compaction_request_key: compactionRequestKey});
    return true;
  }
  function forwardHostMessage(message) {
    if (governedServerEvents && typeof message.method === "string"
      && Object.hasOwn(message, "id")) {
      const id = String(message.id);
      if (pendingHostRequests.has(id)) return false;
      pendingHostRequests.set(id, {method: message.method,
        thread_ref: nonEmptyString(message.params?.threadId)
          ? `backend-thread:${digestValue(message.params.threadId)}` : null});
    }
    send(child.stdin, message);
    return true;
  }
  function stopForDuplicateHostRequest(id) {
    emitClient(jsonRpcError(id ?? null, -32104, "Gateway duplicate pending host request", {
      reason_codes: ["gateway.host-request-id-duplicate"], authority_effect: "none",
    }));
    stop("gateway.host-request-id-duplicate", true, false);
  }
  for (const recovered of initialStableRequests) {
    if (!nonEmptyString(recovered?.request_key) || !nonEmptyString(recovered?.binding_digest)) continue;
    stableRequests.set(recovered.request_key, {
      request_key: recovered.request_key,
      method: recovered.method,
      binding_digest: recovered.binding_digest,
      wrapper_id: null,
      client_id: null,
      upstream_id: null,
      status: ["complete", "recovered"].includes(recovered.status) ? recovered.status : "outcome-unknown",
      thread_ref: recovered.thread_ref ?? null,
      client_message_id: recovered.client_message_id ?? null,
      response: recovered.response ?? null,
      response_digest: recovered.response_digest ?? null,
      recovery: recovered.recovery ?? null,
      creation_acceptance: recovered.creation_acceptance ?? null,
      creation_history: recovered.creation_history ?? null,
      pre_dispatch_rejection: recovered.pre_dispatch_rejection === true,
      recovered: true,
      generated: false,
    });
  }
  for (const recovered of initialDeliveries) {
    if (!isRecord(recovered) || !Number.isSafeInteger(recovered.sequence) || recovered.sequence <= acknowledgedThrough || recovered.sequence > deliverySequence) continue;
    deliveries.set(recovered.sequence, structuredClone(recovered));
  }
  for (const recovered of initialServerRequests) {
    if (!isRecord(recovered) || !Object.hasOwn(recovered, "request_id") || !nonEmptyString(recovered.method)) continue;
    serverRequests.set(String(recovered.request_id), {
      method: recovered.method,
      request_digest: recovered.request_digest,
      thread_ref: recovered.thread_ref ?? null,
      status: ["forwarded", "resolved-forwarded", "resolved-unanswered"].includes(recovered.status)
        ? recovered.status : "outcome-unknown",
      response_digest: recovered.response_digest ?? null,
      resolution_digest: recovered.resolution_digest ?? null,
      recovered: true,
    });
  }

  function touch() {
    lastActivityAt = Date.now();
    scheduleLifecycleCheck();
  }

  function reasoningLogBytes() {
    const path = wrapper.inspectState?.()?.reasoning_state?.sink?.path;
    if (!nonEmptyString(path)) return 0;
    try { return statSync(path).size; } catch { return 0; }
  }

  function retainedProtocolBytes() {
    let bytes = buffered.reduce((sum, value) => sum + Buffer.byteLength(value), 0);
    for (const delivery of deliveries.values()) bytes += Buffer.byteLength(jsonLine(delivery));
    for (const entry of stableRequests.values()) {
      bytes += Buffer.byteLength(entry.request_key) + Buffer.byteLength(entry.binding_digest);
      if (entry.response) bytes += Buffer.byteLength(JSON.stringify(entry.response));
    }
    return bytes;
  }

  function lifecycleReason(now = Date.now()) {
    if ((continuityMode === ACKNOWLEDGED_CONTINUITY_MODE ? deliveries.size : buffered.length) > maxBufferedMessages) return "buffered-message-limit";
    if (retainedProtocolBytes() > maxRetainedBytes) return "retained-byte-limit";
    if (reasoningLogBytes() > maxReasoningLogBytes) return "reasoning-log-byte-limit";
    if (client) return null;
    if (detachTimeoutMs > 0 && detachedAt !== null && now - detachedAt >= detachTimeoutMs) return "detach-timeout";
    if (idleTimeoutMs > 0 && now - lastActivityAt >= idleTimeoutMs) return "idle-timeout";
    return null;
  }

  function lifecycleDelay(now = Date.now()) {
    const candidates = [];
    if (detachTimeoutMs > 0 && detachedAt !== null) candidates.push(Math.max(1, detachTimeoutMs - (now - detachedAt)));
    if (idleTimeoutMs > 0) candidates.push(Math.max(1, idleTimeoutMs - (now - lastActivityAt)));
    return candidates.length > 0 ? Math.min(...candidates) : evictionRetryMs;
  }

  function scheduleLifecycleCheck(delay = lifecycleDelay()) {
    if (closed) return;
    clearTimeout(lifecycleTimer);
    lifecycleTimer = setTimeout(runLifecycleCheck, delay);
    lifecycleTimer.unref?.();
  }

  function safeToEvict() {
    if ([...stableRequests.values()].some((entry) => entry.status !== "complete")) return {ok: false, reason_codes: ["session.pending-stable-request"]};
    if ([...serverRequests.values()].some((entry) => entry.status === "pending")) return {ok: false, reason_codes: ["session.pending-server-request"]};
    if (initialization.status === "pending") return {ok: false, reason_codes: ["session.pending-initialization"]};
    if (typeof wrapper.prepareForEviction !== "function") return {ok: false, reason_codes: ["session.eviction-checkpoint-unsupported"]};
    return wrapper.prepareForEviction({reason: lifecycleReason() ?? "session-lifecycle-expiry", consumer_id: metadata.consumer_id, lane: metadata.lane});
  }

  function runLifecycleCheck() {
    lifecycleTimer = null;
    if (closed || evictionInProgress) return;
    const reason = lifecycleReason();
    if (!reason) {
      scheduleLifecycleCheck();
      return;
    }
    if (client) {
      stop(`gateway.${reason}`);
      return;
    }
    evictionInProgress = true;
    evictionAttemptCount += 1;
    const prepared = safeToEvict();
    evictionInProgress = false;
    if (!prepared?.ok) {
      lastEvictionBlock = freezeResult({reason_codes: prepared?.reason_codes ?? ["session.eviction-preparation-failed"], observed_at: new Date().toISOString()});
      scheduleLifecycleCheck(evictionRetryMs);
      return;
    }
    const expiredAt = new Date().toISOString();
    expirationReceipt = freezeResult({
      schema_version: GATEWAY_SESSION_EXPIRATION_SCHEMA,
      consumer_id: metadata.consumer_id,
      lane: metadata.lane,
      reason: `gateway.session-${reason}`,
      resume_token_digest: resumeTokenDigest,
      retained_protocol_bytes: retainedProtocolBytes(),
      reasoning_log_bytes: reasoningLogBytes(),
      checkpoint_digest: prepared.checkpoint_digest,
      reasoning_epoch_digest: prepared.epoch_digest,
      preparation_digest: prepared.preparation_digest,
      expired_at: expiredAt,
      authority_effect: "none",
    });
    onExpired(metadata.consumer_id, api, expirationReceipt);
    stop(expirationReceipt.reason);
  }

  function initializationBinding(message) {
    return digestValue({method: "initialize", params: Object.hasOwn(message, "params") ? message.params : null});
  }

  function initializationError(id, reason, actualBindingDigest) {
    return jsonRpcError(id, -32092, "Gateway initialization binding failed", {
      reason_codes: [reason],
      expected_binding_digest: initialization.binding_digest,
      actual_binding_digest: actualBindingDigest,
      authority_effect: "none",
    });
  }

  function interceptInitialization(message, requestKey = null) {
    if (message.method !== "initialize" || !Object.hasOwn(message, "id")) return false;
    const bindingDigest = initializationBinding(message);
    if (initialization.status === "complete") {
      const existing = requestKey ? stableRequests.get(requestKey) : null;
      if (existing && (existing.method !== "initialize" || existing.binding_digest !== bindingDigest)) {
        emitClient(stableRequestError(message.id, "gateway.request-binding-mismatch", requestKey,
          existing.binding_digest, bindingDigest), requestKey);
        return true;
      }
      if (requestKey) attachmentRequestKeys.add(requestKey);
      if (bindingDigest !== initialization.binding_digest) {
        emitClient(initializationError(message.id, "gateway.initialize-binding-mismatch", bindingDigest), requestKey);
      } else {
        initializationReplayCount += 1;
        emitClient({jsonrpc: "2.0", id: message.id, result: initialization.result}, requestKey);
      }
      return true;
    }
    if (initialization.status === "pending") {
      if (bindingDigest !== initialization.binding_digest) {
        emitClient(initializationError(message.id, "gateway.initialize-binding-mismatch", bindingDigest));
      } else if (String(message.id) !== String(initialization.request_id)) {
        pendingInitializationAliases.set(String(message.id), message.id);
      }
      return true;
    }
    initialization = freezeResult({status: "pending", binding_digest: bindingDigest, request_id: message.id,
      client_name: message.params?.clientInfo?.name ?? null, result: null, result_digest: null});
    return false;
  }

  function observeInitializationResponse(message) {
    if (initialization.status !== "pending" || !Object.hasOwn(message, "id") || String(message.id) !== String(initialization.request_id)) return;
    if (Object.hasOwn(message, "result") && !Object.hasOwn(message, "error")) {
      initialization = freezeResult({status: "complete", binding_digest: initialization.binding_digest, request_id: initialization.request_id,
        client_name: initialization.client_name, result: message.result, result_digest: digestValue(message.result)});
      for (const id of pendingInitializationAliases.values()) {
        initializationReplayCount += 1;
        emitClient({jsonrpc: "2.0", id, result: initialization.result});
      }
      pendingInitializationAliases.clear();
      return;
    }
    for (const id of pendingInitializationAliases.values()) emitClient({...message, id});
    pendingInitializationAliases.clear();
    initialization = freezeResult({status: "not-started", binding_digest: null, request_id: null, client_name: null, result: null, result_digest: null});
  }

  function initializationReceipt() {
    return freezeResult({
      status: initialization.status,
      binding_digest: initialization.binding_digest,
      host_version_binding: expectedCodexVersion === null ? "not-configured"
        : initialization.status === "complete" && hostInitializeVersionVerification?.ok ? "verified" : "pending",
      ...(initialization.status === "complete" ? {result: initialization.result, result_digest: initialization.result_digest} : {}),
      authority_effect: "none",
    });
  }

  function stopForHostHistoryConflict(id, reasonCode, request, priorObservation, newObservation) {
    const material = {schema_version: GATEWAY_SESSION_FAULT_SCHEMA, reason_code: reasonCode,
      thread_ref: request.thread_ref, request_key_digest: digestValue(request.request_key),
      prior_observation_digest: priorObservation.observation_digest,
      new_observation_digest: newObservation.observation_digest};
    const fault = {...material, fault_digest: digestValue(material)};
    const recorded = onDurableEvent("session-fault", {fault});
    const persisted = recorded?.ok === true;
    send(client, jsonRpcError(id, -32103, persisted
      ? "Gateway host history conflicts with its durable receipt" : "Gateway host-history conflict could not be persisted", {
      reason_codes: [persisted ? reasonCode : "gateway.session-fault-not-durable"], authority_effect: "none",
    }));
    stop(persisted ? reasonCode : "gateway.session-fault-not-durable", true, false);
  }

  function encodeDelivery(value, requestKey = null) {
    const sequence = deliverySequence + 1;
    const delivery = {schema_version: GATEWAY_DELIVERY_SCHEMA, sequence, message: value, ...(requestKey ? {request_key: requestKey} : {}), authority_effect: "none"};
    const persisted = onDurableEvent("delivery-enqueued", {delivery});
    if (persisted?.ok !== true) return {ok: false, reason: "gateway.delivery-not-durable"};
    deliverySequence = sequence;
    deliveries.set(sequence, delivery);
    return {ok: true, encoded: jsonLine(delivery)};
  }

  function emitClient(value, requestKey = null) {
    touch();
    if (metadata.consumer_id === "codex:desktop-wsl" && isDesktopSidebandNotification(value)) return;
    if (continuityMode === ACKNOWLEDGED_CONTINUITY_MODE) {
      const encoded = encodeDelivery(value, requestKey);
      if (!encoded.ok) {
        send(client, jsonRpcError(value?.id ?? null, -32096, "Gateway delivery persistence failed", {reason_codes: [encoded.reason], authority_effect: "none"}));
        stop(encoded.reason);
        return;
      }
      if (client && !client.destroyed && clientDeliveryReady) flushBuffered();
      if (deliveries.size > maxBufferedMessages || retainedProtocolBytes() > maxRetainedBytes) {
        if (client && !client.destroyed) client.end();
        else scheduleLifecycleCheck(1);
      }
      return;
    }
    const encoded = jsonLine(value);
    if (client && !client.destroyed) {
      client.write(encoded);
      return;
    }
    buffered.push(encoded);
    if (buffered.length > maxBufferedMessages || retainedProtocolBytes() > maxRetainedBytes) scheduleLifecycleCheck(1);
  }

  function stopForUndurableDispatchOutcome(id) {
    send(client, jsonRpcError(id ?? null, -32095, "Gateway dispatch outcome is not durable", {
      reason_codes: ["gateway.dispatch-outcome-not-durable"], authority_effect: "none",
    }));
    stop("gateway.dispatch-outcome-not-durable", true, false);
  }

  function acknowledge(message) {
    if (continuityMode !== ACKNOWLEDGED_CONTINUITY_MODE || !isRecord(message) || message.schema_version !== GATEWAY_ACK_SCHEMA) return false;
    const through = message.through_sequence;
    if (!Number.isSafeInteger(through) || through < acknowledgedThrough || through > deliverySequence) {
      stop("gateway.ack-sequence-invalid");
      return true;
    }
    const persisted = onDurableEvent("delivery-acknowledged", {through_sequence: through});
    if (persisted?.ok !== true) {
      send(client, jsonRpcError(null, -32097, "Gateway acknowledgement persistence failed", {reason_codes: ["gateway.acknowledgement-not-durable"], authority_effect: "none"}));
      stop("gateway.acknowledgement-not-durable");
      return true;
    }
    acknowledgedThrough = through;
    for (const sequence of [...deliveries.keys()]) if (sequence <= through) deliveries.delete(sequence);
    touch();
    return true;
  }

  function stableRequestError(id, reason, requestKey, expectedDigest = null, actualDigest = null) {
    return jsonRpcError(id, -32093, "Gateway stable request binding failed", {
      reason_codes: [reason], request_key: requestKey, expected_binding_digest: expectedDigest, actual_binding_digest: actualDigest, authority_effect: "none",
    });
  }

  function rebindStableRequest(requestKey, clientId) {
    const entry = stableRequests.get(requestKey);
    if (!entry) return {ok: false, reason: "gateway.request-alias-not-found"};
    entry.client_id = clientId;
    for (const delivery of deliveries.values()) {
      if (delivery.request_key !== requestKey || !Object.hasOwn(delivery.message, "id")) continue;
      delivery.message = {...delivery.message, id: clientId};
    }
    return {ok: true};
  }

  function interceptStableRequest(message, requestKey) {
    if (!requestKey || !message.method || !Object.hasOwn(message, "id")) return {intercepted: false};
    const bindingDigest = digestValue({method: message.method, params: Object.hasOwn(message, "params") ? message.params : null});
    const existing = stableRequests.get(requestKey);
    if (existing) {
      if (existing.binding_digest !== bindingDigest) {
        emitClient(stableRequestError(message.id, "gateway.request-binding-mismatch", requestKey, existing.binding_digest, bindingDigest));
      } else if (existing.status === "outcome-unknown") {
        emitClient(stableRequestError(message.id, "gateway.dispatch-outcome-unknown", requestKey, existing.binding_digest, bindingDigest));
      } else if (existing.status === "recovered") {
        emitClient(stableRequestError(message.id, "gateway.dispatch-recovered-no-host-response", requestKey,
          existing.binding_digest, bindingDigest));
      } else {
        deduplicatedRequestCount += 1;
        attachmentRequestKeys.add(requestKey);
        rebindStableRequest(requestKey, message.id);
        if (existing.status === "complete" && ![...deliveries.values()].some((delivery) => delivery.request_key === requestKey)) {
          emitClient({...existing.response, id: message.id}, requestKey);
        }
        flushBuffered();
      }
      return {intercepted: true};
    }
    const upstreamId = `are-gateway:${metadata.consumer_id}:${++upstreamRequestSequence}`;
    const threadId = scopedThreadId(message);
    const threadRef = nonEmptyString(threadId) ? `backend-thread:${digestValue(threadId)}` : null;
    const clientMessageId = backendAdapter.adapter_id === "codex-app-server/v1" && message.method === "turn/start"
      && message.params?.clientUserMessageId === undefined
      ? `are-gateway-client:${randomBytes(16).toString("hex")}` : null;
    const entry = {request_key: requestKey, method: message.method, binding_digest: bindingDigest, thread_ref: threadRef,
      client_message_id: clientMessageId, wrapper_id: message.id, client_id: message.id,
      upstream_id: upstreamId, status: "preparing", response: null, response_digest: null};
    stableRequests.set(requestKey, entry);
    upstreamRequests.set(String(upstreamId), entry);
    const persisted = onDurableEvent("dispatch-intent", {request_key: requestKey, method: message.method,
      binding_digest: bindingDigest, thread_ref: threadRef,
      ...(clientMessageId ? {client_message_id: clientMessageId} : {})});
    if (persisted?.ok !== true) {
      stableRequests.delete(requestKey);
      upstreamRequests.delete(String(upstreamId));
      emitClient(stableRequestError(message.id, "gateway.dispatch-intent-not-durable", requestKey));
      return {intercepted: true};
    }
    attachmentRequestKeys.add(requestKey);
    return {intercepted: false, entry};
  }

  function interceptRecoveredInitialization(message, requestKey) {
    if (message.method !== "initialize" || initialization.status !== "not-started" || !requestKey) return false;
    const existing = stableRequests.get(requestKey);
    if (!existing) return false;
    const bindingDigest = initializationBinding(message);
    if (existing.binding_digest !== bindingDigest) {
      emitClient(stableRequestError(message.id, "gateway.request-binding-mismatch", requestKey, existing.binding_digest, bindingDigest));
      return true;
    }
    stableRequests.delete(requestKey);
    upstreamRequests.delete(String(existing.upstream_id));
    return false;
  }

  function handleTurnRecoveryRequest(message, metadataRequestKey) {
    const reject = (reason) => emitClient(jsonRpcError(message.id ?? null, -32093,
      "Gateway turn recovery is not verified", {reason_codes: [reason], authority_effect: "none"}));
    if (backendAdapter.adapter_id !== "codex-app-server/v1" || metadata.lane !== "interaction-bound"
      || !Object.hasOwn(message, "id") || metadataRequestKey !== null
      || !isRecord(message.params) || (expectedCodexVersion && initialization.status !== "complete")) {
      reject("gateway.recovery-method-unavailable");
      return;
    }
    if (message.method === GATEWAY_TURN_RECOVERY_GET) {
      const params = message.params;
      if (Object.keys(params).sort().join(",") !== "requestBindingDigest,requestKey,threadId"
        || !nonEmptyString(params.requestKey) || !nonEmptyString(params.threadId)
        || !/^[0-9a-f]{64}$/.test(params.requestBindingDigest ?? "")) {
        reject("gateway.recovery-get-invalid");
        return;
      }
      const entry = stableRequests.get(params.requestKey);
      const candidate = recoveryCandidates.get(params.requestKey);
      if (!entry || entry.status !== "outcome-unknown" || entry.method !== "turn/start"
        || entry.binding_digest !== params.requestBindingDigest
        || entry.thread_ref !== `backend-thread:${digestValue(params.threadId)}`
        || !backendThreadOwned(metadata.consumer_id, entry.thread_ref) || !candidate
        || candidate.request_digest !== entry.binding_digest
        || candidate.thread_id !== params.threadId
        || !hostObservationsForConsumer().some((observation) =>
          observation.kind === "turn-marker-observed"
          && observation.observation_digest === candidate.host_observation_digest)) {
        reject("gateway.recovery-history-required");
        return;
      }
      emitClient({jsonrpc: "2.0", id: message.id, result: {recovery: candidate}});
      return;
    }
    const receipt = message.params.receipt;
    if (Object.keys(message.params).join(",") !== "receipt" || !isRecord(receipt)
      || Object.keys(receipt).sort().join(",") !== "authority_effect,host_observation_digest,receipt_digest,request_digest,request_key,schema_version,semantic_receipt_digest,thread_id,turn_id,turn_status"
      || receipt.schema_version !== GATEWAY_TURN_RECOVERY_SCHEMA
      || receipt.authority_effect !== "none" || !/^[0-9a-f]{64}$/.test(receipt.receipt_digest ?? "")
      || !/^[0-9a-f]{64}$/.test(receipt.request_digest ?? "")
      || !/^[0-9a-f]{64}$/.test(receipt.host_observation_digest ?? "")
      || !/^[0-9a-f]{64}$/.test(receipt.semantic_receipt_digest ?? "")
      || !["completed", "interrupted", "failed"].includes(receipt.turn_status)
      || !nonEmptyString(receipt.request_key) || !nonEmptyString(receipt.thread_id)
      || !nonEmptyString(receipt.turn_id)) {
      reject("gateway.recovery-confirm-invalid");
      return;
    }
    const {receipt_digest: receiptDigest, ...receiptMaterial} = receipt;
    const entry = stableRequests.get(receipt.request_key);
    if (digestValue(receiptMaterial) !== receiptDigest || !entry || entry.method !== "turn/start"
      || entry.binding_digest !== receipt.request_digest
      || entry.thread_ref !== `backend-thread:${digestValue(receipt.thread_id)}`
      || !backendThreadOwned(metadata.consumer_id, entry.thread_ref)) {
      reject("gateway.recovery-confirm-binding-mismatch");
      return;
    }
    if (entry.status === "recovered") {
      if (entry.recovery?.recovery_digest !== receiptDigest) {
        reject("gateway.recovery-confirm-binding-mismatch");
        return;
      }
      emitClient({jsonrpc: "2.0", id: message.id, result: {confirmed: true,
        recovery_digest: receiptDigest, already_confirmed: true}});
      return;
    }
    const candidate = recoveryCandidates.get(receipt.request_key);
    if (entry.status !== "outcome-unknown" || candidate?.receipt_digest !== receiptDigest
      || !hostObservationsForConsumer().some((observation) => observation.kind === "turn-marker-observed"
        && observation.observation_digest === receipt.host_observation_digest)) {
      reject("gateway.recovery-history-required");
      return;
    }
    const recovery = {request_key: receipt.request_key, request_digest: receipt.request_digest,
      thread_ref: entry.thread_ref, turn_ref: digestValue(receipt.turn_id),
      turn_status: receipt.turn_status, host_observation_digest: receipt.host_observation_digest,
      semantic_receipt_digest: receipt.semantic_receipt_digest, recovery_digest: receiptDigest};
    const persisted = onDurableEvent("dispatch-recovered", recovery);
    if (persisted?.ok !== true) {
      reject("gateway.recovery-confirm-not-durable");
      return;
    }
    entry.status = "recovered";
    entry.recovery = recovery;
    recoveryCandidates.delete(receipt.request_key);
    emitClient({jsonrpc: "2.0", id: message.id, result: {confirmed: true,
      recovery_digest: receiptDigest, already_confirmed: false}});
  }

  function handleSteerOutcomeRequest(message, metadataRequestKey) {
    const reject = reason => emitClient(jsonRpcError(message.id ?? null, -32093,
      "Gateway steering outcome is not verified", {reason_codes: [reason], authority_effect: "none"}));
    if (backendAdapter.adapter_id !== "codex-app-server/v1" || metadata.lane !== "interaction-bound"
      || continuityMode !== ACKNOWLEDGED_CONTINUITY_MODE || !Object.hasOwn(message, "id")
      || metadataRequestKey !== null || !isRecord(message.params)
      || (expectedCodexVersion && initialization.status !== "complete")) {
      reject("gateway.steer-outcome-unavailable");
      return;
    }
    const {threadId, expectedTurnId, requestKey} = message.params;
    const bounded = value => nonEmptyString(value) && value === value.trim()
      && Buffer.byteLength(value, "utf8") <= 256;
    if (Object.keys(message.params).sort().join(",") !== "expectedTurnId,requestKey,threadId"
      || !bounded(threadId) || !bounded(expectedTurnId) || !bounded(requestKey)) {
      reject("gateway.steer-outcome-params-invalid");
      return;
    }
    const threadRef = `backend-thread:${digestValue(threadId)}`;
    if (!backendThreadOwned(metadata.consumer_id, threadRef)) {
      reject("gateway.steer-outcome-thread-unowned");
      return;
    }
    const entry = stableRequests.get(requestKey);
    if (!entry) {
      emitClient({jsonrpc: "2.0", id: message.id, result: {
        schema_version: GATEWAY_STEER_OUTCOME_SCHEMA, disposition: "unrecorded", authority_effect: "none"}});
      return;
    }
    if (entry.method !== "turn/steer" || entry.thread_ref !== threadRef) {
      reject("gateway.steer-outcome-request-unbound");
      return;
    }
    const accepted = hostObservationsForConsumer().some(observation =>
      observation.kind === "steer-accepted" && observation.thread_ref === threadRef
      && observation.turn_ref === digestValue(expectedTurnId)
      && observation.request_key_digest === digestValue(requestKey)
      && observation.request_digest === entry.binding_digest);
    const degraded = wrapper.inspectState?.()?.degraded_steer_threads?.includes(threadId) === true;
    let disposition = "unverified";
    if (entry.status === "complete" && entry.response?.error) disposition = "rejected";
    else if (accepted && entry.status === "complete"
      && entry.response?.result?.turnId === expectedTurnId && !degraded) disposition = "settled-accepted";
    else if (accepted) disposition = "host-accepted-unreconciled";
    else if (entry.status === "outcome-unknown") disposition = "outcome-unknown";
    else if (["preparing", "pending"].includes(entry.status)) disposition = "pending";
    emitClient({jsonrpc: "2.0", id: message.id, result: {
      schema_version: GATEWAY_STEER_OUTCOME_SCHEMA, disposition, authority_effect: "none"}});
  }

  function handleThreadCreationRecoveryRequest(message, metadataRequestKey) {
    const reject = (reason) => emitClient(jsonRpcError(message.id ?? null, -32093,
      "Gateway thread creation recovery is not verified", {reason_codes: [reason], authority_effect: "none"}));
    if (backendAdapter.adapter_id !== "codex-app-server/v1" || metadata.lane !== "interaction-bound"
      || !Object.hasOwn(message, "id") || metadataRequestKey !== null
      || !isRecord(message.params) || (expectedCodexVersion && initialization.status !== "complete")) {
      reject("gateway.creation-recovery-unavailable");
      return;
    }
    if (message.method === GATEWAY_THREAD_CREATION_RECOVERY_GET) {
      const params = message.params;
      if (Object.keys(params).sort().join(",") !== "requestBindingDigest,requestKey"
        || !nonEmptyString(params.requestKey) || !/^[0-9a-f]{64}$/.test(params.requestBindingDigest ?? "")) {
        reject("gateway.creation-recovery-get-invalid");
        return;
      }
      const entry = stableRequests.get(params.requestKey);
      const acceptance = entry?.creation_acceptance;
      if (!entry || entry.method !== "thread/start" || !["outcome-unknown", "recovered"].includes(entry.status)
        || entry.binding_digest !== params.requestBindingDigest || !acceptance
        || acceptance.request_digest !== entry.binding_digest
        || !backendThreadOwned(metadata.consumer_id, `backend-thread:${digestValue(acceptance.thread_id)}`)) {
        reject("gateway.creation-recovery-acceptance-required");
        return;
      }
      const history = entry.creation_history;
      if (!history) {
        emitClient({jsonrpc: "2.0", id: message.id,
          result: {thread_id: acceptance.thread_id, history_verified: false}});
        return;
      }
      const material = {schema_version: GATEWAY_THREAD_CREATION_RECOVERY_SCHEMA,
        request_key: entry.request_key, request_digest: entry.binding_digest,
        thread_id: acceptance.thread_id, acceptance_digest: acceptance.acceptance_digest,
        history_response_digest: history.history_response_digest, authority_effect: "none"};
      emitClient({jsonrpc: "2.0", id: message.id,
        result: {thread_id: acceptance.thread_id, history_verified: true,
          receipt: {...material, receipt_digest: digestValue(material)}}});
      return;
    }
    const receipt = message.params.receipt;
    if (Object.keys(message.params).join(",") !== "receipt" || !isRecord(receipt)
      || Object.keys(receipt).sort().join(",") !== "acceptance_digest,authority_effect,history_response_digest,receipt_digest,request_digest,request_key,schema_version,thread_id"
      || receipt.schema_version !== GATEWAY_THREAD_CREATION_RECOVERY_SCHEMA
      || receipt.authority_effect !== "none" || !nonEmptyString(receipt.request_key)
      || !nonEmptyString(receipt.thread_id) || receipt.thread_id !== receipt.thread_id.trim()
      || Buffer.byteLength(receipt.thread_id, "utf8") > 256
      || !["acceptance_digest", "history_response_digest", "receipt_digest", "request_digest"]
        .every((key) => /^[0-9a-f]{64}$/.test(receipt[key] ?? ""))) {
      reject("gateway.creation-recovery-confirm-invalid");
      return;
    }
    const {receipt_digest: receiptDigest, ...material} = receipt;
    const entry = stableRequests.get(receipt.request_key);
    if (digestValue(material) !== receiptDigest || !entry || entry.method !== "thread/start"
      || entry.binding_digest !== receipt.request_digest
      || entry.creation_acceptance?.thread_id !== receipt.thread_id
      || entry.creation_acceptance.acceptance_digest !== receipt.acceptance_digest
      || entry.creation_history?.history_response_digest !== receipt.history_response_digest
      || !backendThreadOwned(metadata.consumer_id, `backend-thread:${digestValue(receipt.thread_id)}`)) {
      reject("gateway.creation-recovery-confirm-binding-mismatch");
      return;
    }
    if (entry.status === "recovered") {
      if (entry.recovery?.receipt_digest !== receiptDigest) {
        reject("gateway.creation-recovery-confirm-binding-mismatch");
        return;
      }
      emitClient({jsonrpc: "2.0", id: message.id, result: {confirmed: true,
        recovery_digest: receiptDigest, already_confirmed: true}});
      return;
    }
    if (entry.status !== "outcome-unknown"
      || onDurableEvent("thread-creation-recovered", receipt)?.ok !== true) {
      reject("gateway.creation-recovery-confirm-not-durable");
      return;
    }
    entry.status = "recovered";
    entry.recovery = receipt;
    emitClient({jsonrpc: "2.0", id: message.id, result: {confirmed: true,
      recovery_digest: receiptDigest, already_confirmed: false}});
  }

  function handleOwnedRuntimeRequest(message, metadataRequestKey) {
    const reject = (reason) => emitClient(jsonRpcError(message.id ?? null, -32093,
      "Gateway owned runtime is not verified", {reason_codes: [reason], authority_effect: "none"}));
    const params = message.params;
    if (backendAdapter.adapter_id !== "codex-app-server/v1" || metadata.lane !== "interaction-bound"
      || !Object.hasOwn(message, "id") || metadataRequestKey !== null
      || (expectedCodexVersion && initialization.status !== "complete")
      || !isRecord(params) || Object.keys(params).join(",") !== "threadId"
      || !nonEmptyString(params.threadId) || params.threadId !== params.threadId.trim()
      || Buffer.byteLength(params.threadId, "utf8") > 256) {
      reject("gateway.owned-runtime-input-invalid");
      return;
    }
    const threadRef = `backend-thread:${digestValue(params.threadId)}`;
    const stored = getStoredSession();
    if (!backendThreadOwned(metadata.consumer_id, threadRef) || stored?.status !== "active"
      || !Array.isArray(stored.pending_history_audits)
      || stored.pending_history_audits.length > 0 || stored.fault !== null) {
      reject("gateway.owned-runtime-thread-unavailable");
      return;
    }
    const rejectedBeforeDispatch = (entry) => entry.status === "complete"
      && entry.pre_dispatch_rejection === true && entry.response?.error;
    const requests = [...stableRequests.values()].filter((entry) =>
      entry.method === "turn/start" && entry.thread_ref === threadRef
      && !rejectedBeforeDispatch(entry));
    const accepted = hostObservationsForConsumer().filter((entry) =>
      entry.kind === "turn-start-accepted" && entry.thread_ref === threadRef);
    const freshCreation = freshThreadCreations.get(params.threadId);
    if (freshCreation && reconnectCount === 1 && requests.length === 0 && accepted.length === 0
      && !closed && !child.killed && child.exitCode === null && child.signalCode === null
      && Array.isArray(stored.requests)
      && !stored.requests.some((entry) => entry.method === "turn/start" && entry.thread_ref === threadRef
        && !rejectedBeforeDispatch(entry))) {
      const creation = [...stableRequests.values()].filter((entry) => entry.method === "thread/start"
        && entry.creation_acceptance?.acceptance_digest === freshCreation.acceptance_digest
        && entry.creation_acceptance.thread_id === params.threadId);
      const durable = stored.requests.filter((entry) => entry.method === "thread/start"
        && entry.creation_acceptance?.acceptance_digest === freshCreation.acceptance_digest
        && entry.creation_acceptance.thread_id === params.threadId);
      if (creation.length === 1 && durable.length === 1 && creation[0].status === "complete"
        && durable[0].status === "complete" && creation[0].request_key === durable[0].request_key
        && creation[0].response?.result?.thread?.id === params.threadId) {
        emitClient({jsonrpc: "2.0", id: message.id, result: freezeResult({
          schema_version: GATEWAY_OWNED_RUNTIME_SCHEMA, thread_id: params.threadId,
          disposition: "first-turn-ready", creation_acceptance_digest: freshCreation.acceptance_digest,
          authority_effect: "none",
        })});
        return;
      }
    }
    // The retained request set must account for every accepted host turn.
    // A missing acceptance, unknown delivery, or trimmed receipt is not idle.
    if (requests.length === 0 || requests.length !== accepted.length
      || requests.some((entry) => entry.status !== "complete" || !accepted.some((observation) =>
        observation.request_key_digest === digestValue(entry.request_key)
        && observation.request_digest === entry.binding_digest))) {
      reject("gateway.owned-runtime-acceptance-unsettled");
      return;
    }
    const latest = accepted.at(-1);
    const completions = hostObservationsForConsumer().filter((entry) =>
      entry.kind === "turn-completion-observed" && entry.thread_ref === threadRef
      && entry.turn_ref === latest.turn_ref
      && entry.request_key_digest === latest.request_key_digest
      && entry.request_digest === latest.request_digest);
    const proof = wrapper.completedTurnProof?.(params.threadId, latest.turn_ref);
    if (completions.length !== 1 || !proof
      || Object.keys(proof).sort().join(",") !== "authority_effect,checkpoint_digest,frontier_digest,thread_ref,turn_ref,turn_status"
      || proof.thread_ref !== threadRef || proof.turn_ref !== latest.turn_ref
      || proof.turn_status !== completions[0].turn_status
      || !["frontier_digest", "checkpoint_digest"].every((key) => /^[0-9a-f]{64}$/.test(proof[key] ?? ""))
      || proof.authority_effect !== "none") {
      reject("gateway.owned-runtime-frontier-unverified");
      return;
    }
    emitClient({jsonrpc: "2.0", id: message.id, result: freezeResult({
      schema_version: GATEWAY_OWNED_RUNTIME_SCHEMA, thread_id: params.threadId,
      disposition: "terminal-verified", turn_status: proof.turn_status,
      turn_ref: latest.turn_ref, host_observation_digest: completions[0].observation_digest,
      frontier_digest: proof.frontier_digest, checkpoint_digest: proof.checkpoint_digest,
      authority_effect: "none",
    })});
  }

  function processClientLine(line) {
    clientChain = clientChain.then(async () => {
      touch();
      let control;
      try { control = JSON.parse(line); } catch { control = null; }
      if (control?.schema_version === GATEWAY_ACK_SCHEMA) {
        acknowledge(control);
        return;
      }
      const parsed = parseJsonLine(line);
      if (!parsed.ok) {
        emitClient(jsonRpcError(null, -32700, "Parse error", parsed));
        return;
      }
      const resourceReason = lifecycleReason();
      if (resourceReason === "retained-byte-limit" || resourceReason === "reasoning-log-byte-limit") {
        emitClient(jsonRpcError(parsed.value?.id ?? null, -32095, "Gateway session resource limit reached", {
          reason_codes: [`gateway.session-${resourceReason}`],
          retained_protocol_bytes: retainedProtocolBytes(),
          reasoning_log_bytes: reasoningLogBytes(),
          authority_effect: "none",
        }));
        if (client && !client.destroyed) client.end();
        return;
      }
      const metadataResult = requestMetadata(parsed.value);
      if (!metadataResult.ok) {
        emitClient(stableRequestError(parsed.value?.id ?? null, metadataResult.reason, null));
        return;
      }
      const message = metadataResult.message;
      const hostedInputVerified = metadataResult.hosted_input_attestation !== null
        && metadata.consumer_id === hostedInputConsumer
        && verifyHostedInput({key: hostedInputKey,
          signature: metadataResult.hosted_input_attestation,
          consumer_id: metadata.consumer_id, method: message.method, params: message.params,
          request_key: metadataResult.request_key});
      if (metadataResult.hosted_input_attestation !== null && !hostedInputVerified) {
        if (Object.hasOwn(message, "id")) emitClient(jsonRpcError(message.id, -32092,
          "Hosted input attestation invalid", {reason_codes: ["gateway.hosted-input-attestation-invalid"], authority_effect: "none"}));
        return;
      }
      if (turnIngressBlockedReason && MODEL_ENTRY_METHODS.has(message.method)) {
        if (Object.hasOwn(message, "id")) emitClient(jsonRpcError(message.id, -32085, "Managed turn execution is paused", {
          reason_codes: [turnIngressBlockedReason], authority_effect: "none",
        }));
        return;
      }
      if (requireModelEntryReceipt && MODEL_ENTRY_METHODS.has(message.method)
        && message.method !== "turn/start") {
        if (metadataResult.request_key && !stableRequests.has(metadataResult.request_key)) {
          attachmentRequestKeys.add(metadataResult.request_key);
        }
        if (Object.hasOwn(message, "id")) emitClient(jsonRpcError(message.id, -32105,
          "Model-entry method has no objective receipt contract", {
            reason_codes: ["gateway.model-entry-method-unsupported"], authority_effect: "none",
          }), metadataResult.request_key);
        return;
      }
      const unfinishedCompaction = unsettledCompaction();
      if (unfinishedCompaction && mutatesBackendThread(message.method)
        && metadataResult.request_key !== unfinishedCompaction.request_key) {
        const threadId = scopedThreadId(message);
        const exactThreadRef = nonEmptyString(threadId) ? `backend-thread:${digestValue(threadId)}` : null;
        const accepted = compactionAcceptance(unfinishedCompaction);
        const recoverable = backendAdapter.adapter_id === "codex-app-server/v1"
          && continuityMode === ACKNOWLEDGED_CONTINUITY_MODE
          && initialization.status === "complete" && unfinishedCompaction.status === "complete"
          && !unfinishedCompaction.response?.error && accepted
          && exactThreadRef === unfinishedCompaction.thread_ref
          && backendThreadOwned(metadata.consumer_id, exactThreadRef)
          && Object.hasOwn(message, "id");
        if (recoverable && pendingAutoCompactionReads.size === 0) {
          const now = Date.now();
          const attempt = autoCompactionReadAttempts.get(unfinishedCompaction.request_key)
            ?? {count: 0, last_at: 0};
          if (attempt.count < 8 && (attempt.count === 0 || now - attempt.last_at >= 1000)) {
            const read = {jsonrpc: "2.0", id: `are-gateway:compaction-recovery:${randomUUID()}`,
              method: "thread/read", params: {threadId, includeTurns: true}};
            if (!trackHostRead(read, message.id, "auto-compaction",
              unfinishedCompaction.request_key)) return;
            pendingAutoCompactionReads.set(String(read.id), {client_id: message.id, line,
              attachment_generation: reconnectCount});
            autoCompactionReadAttempts.set(unfinishedCompaction.request_key,
              {count: attempt.count + 1, last_at: now});
            if (!forwardHostMessage(read)) {
              stopForDuplicateHostRequest(message.id);
            }
            return;
          }
        }
        emitClient(jsonRpcError(message.id ?? null, -32093, "Managed compaction is unsettled", {
          reason_codes: [pendingAutoCompactionReads.size > 0
            ? "gateway.compaction-recovery-pending" : "gateway.compaction-unsettled"], authority_effect: "none",
        }));
        return;
      }
      if ([GATEWAY_TURN_RECOVERY_GET, GATEWAY_TURN_RECOVERY_CONFIRM].includes(message.method)) {
        handleTurnRecoveryRequest(message, metadataResult.request_key);
        return;
      }
      if (message.method === GATEWAY_STEER_OUTCOME_GET) {
        handleSteerOutcomeRequest(message, metadataResult.request_key);
        return;
      }
      if ([GATEWAY_THREAD_CREATION_RECOVERY_GET, GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM].includes(message.method)) {
        handleThreadCreationRecoveryRequest(message, metadataResult.request_key);
        return;
      }
      if (message.method === GATEWAY_OWNED_RUNTIME_GET) {
        handleOwnedRuntimeRequest(message, metadataResult.request_key);
        return;
      }
      let methodPosture;
      try { methodPosture = backendAdapter.client_method_posture?.(message) ?? gatewayClientMethodPosture(message); }
      catch { methodPosture = {kind: "rejected", reason_code: "backend.method-posture-error"}; }
      if (!isRecord(methodPosture) || !["response", "admitted-local", "admitted-host", "rejected"].includes(methodPosture.kind)
        || (methodPosture.kind === "rejected" && !nonEmptyString(methodPosture.reason_code))) {
        methodPosture = {kind: "rejected", reason_code: "backend.method-posture-invalid"};
      }
      if (methodPosture.kind === "rejected") {
        if (Object.hasOwn(message, "id")) emitClient(jsonRpcError(message.id, -32081, "ARE host method is not governed", {
          reason_codes: [methodPosture.reason_code], authority_effect: "none",
        }));
        return;
      }
      if (backendAdapter.adapter_id === "codex-app-server/v1"
        && ["admitted-host", "admitted-local"].includes(methodPosture.kind)) {
        const parameterPosture = codexGatewayLifecycleParameterPosture(message,
          {allow_hosted_effect_tool: allowHostedEffectTool});
        if (parameterPosture.kind === "rejected") {
          // This error precedes durable dispatch-intent creation. Bind its
          // delivery to the current attachment's exact request key so the
          // managed client can record a terminal rejection instead of
          // retaining an undeliverable frame.
          if (metadataResult.request_key && !stableRequests.has(metadataResult.request_key)) {
            attachmentRequestKeys.add(metadataResult.request_key);
          }
          if (Object.hasOwn(message, "id")) emitClient(jsonRpcError(message.id, -32082, "ARE host parameters are not governed", {
            reason_codes: [parameterPosture.reason_code], authority_effect: "none",
          }), metadataResult.request_key);
          return;
        }
      }
      const operation = ({"turn/start": "turn_start", "turn/interrupt": "turn_interrupt", "turn/steer": "turn_steer", "thread/resume": "thread_resume", "thread/compact/start": "thread_compact"})[message.method];
      if (operation && backendCapabilities.operations[operation] === "unsupported") {
        emitClient(jsonRpcError(message.id ?? null, -32601, "Backend operation is unsupported", {
          reason_codes: ["gateway.backend-operation-unsupported"],
          backend_adapter_id: backendAdapter.adapter_id,
          operation,
          authority_effect: "none",
        }));
        return;
      }
      if (interceptRecoveredInitialization(message, metadataResult.request_key)) return;
      const serverRequest = !message.method && Object.hasOwn(message, "id") ? serverRequests.get(String(message.id)) : null;
      if (serverRequest?.status === "outcome-unknown") {
        emitClient(jsonRpcError(message.id, -32098, "Gateway server-request outcome is unknown after recovery", {
          reason_codes: ["gateway.server-response-outcome-unknown"],
          request_digest: serverRequest.request_digest,
          authority_effect: "none",
        }));
        return;
      }
      if (serverRequest?.status === "resolved-unanswered") {
        emitClient(jsonRpcError(message.id, -32094, "Gateway server request was already resolved", {
          reason_codes: ["gateway.server-request-already-resolved"], authority_effect: "none",
        }));
        return;
      }
      if (["forwarded", "resolved-forwarded"].includes(serverRequest?.status)) {
        const responseDigest = digestValue(message);
        if (responseDigest !== serverRequest.response_digest) {
          emitClient(jsonRpcError(message.id, -32094, "Gateway server-request response binding failed", {
            reason_codes: ["gateway.server-response-binding-mismatch"],
            expected_response_digest: serverRequest.response_digest,
            actual_response_digest: responseDigest,
            authority_effect: "none",
          }));
        } else deduplicatedServerResponseCount += 1;
        return;
      }
      if (interceptInitialization(message, metadataResult.request_key)) return;
      if (expectedCodexVersion && message.method !== "initialize" && initialization.status !== "complete") {
        emitClient(jsonRpcError(message.id ?? null, -32096, "Codex backend identity is not initialized", {
          reason_codes: ["gateway.host-initialize-version-required"], authority_effect: "none",
        }));
        return;
      }
      if (message.method === "cyberalchemy/hostedEffect/execute"
        && (continuityMode !== ACKNOWLEDGED_CONTINUITY_MODE
          || metadataResult.request_key !== message.params?.request?.effect_id)) {
        emitClient(jsonRpcError(message.id ?? null, -32093,
          "Hosted effect execution needs its exact durable request key", {
            reason_codes: ["hosted-effect.exact-request-key-required"], authority_effect: "none",
          }));
        return;
      }
      const windowsEffectProof = message.method === "cyberalchemy/hostedEffect/execute"
        ? windowsSandboxProofForEffect() : null;
      if (windowsEffectProof?.ok === false) {
        emitClient(jsonRpcError(message.id ?? null, -32084, "Windows backend sandbox is not attested", {
          reason_codes: [windowsEffectProof.reason],
          sandbox_status: windowsBackendSandboxStatus, authority_effect: "none",
        }));
        return;
      }
      if (continuityMode === ACKNOWLEDGED_CONTINUITY_MODE && mutatesBackendThread(message.method)
        && !metadataResult.request_key) {
        emitClient(jsonRpcError(message.id ?? null, -32093, "Gateway mutation needs a stable request key", {
          reason_codes: ["gateway.stable-request-key-required"], authority_effect: "none",
        }));
        return;
      }
      const pendingCreation = unsettledThreadCreation();
      if (pendingCreation && metadataResult.request_key !== pendingCreation.request_key
        && typeof message.method === "string"
        && !READ_ONLY_THREAD_METHODS.has(message.method)
        && !["cyberalchemy/intent/get", "cyberalchemy/intent/project",
          "cyberalchemy/learning/status", "cyberalchemy/learning/pendingFeedback/list",
          "cyberalchemy/learning/lessons/list"].includes(message.method)) {
        const reason = pendingCreation.status === "outcome-unknown"
          ? "gateway.session-outcome-unknown" : "gateway.thread-creation-unsettled";
        emitClient(jsonRpcError(message.id ?? null, -32093, "Gateway thread creation is unsettled", {
          reason_codes: [reason], authority_effect: "none",
        }));
        return;
      }
      const unknownMutation = [...stableRequests.values()].find((entry) => entry.status === "outcome-unknown"
        && mutatesBackendThread(entry.method));
      if (unknownMutation && mutatesBackendThread(message.method)
        && metadataResult.request_key !== unknownMutation.request_key) {
        emitClient(jsonRpcError(message.id ?? null, -32093, "Gateway session has an unresolved backend mutation", {
          reason_codes: ["gateway.session-outcome-unknown"], authority_effect: "none",
        }));
        return;
      }
      if (requireMcpCatalog && (message.method === "turn/start" || message.method === "turn/steer")
        && metadataResult.request_key && stableRequests.has(metadataResult.request_key)) {
        const replay = interceptStableRequest(message, metadataResult.request_key);
        if (replay.intercepted) return;
      }
      if (restrictedHostConfig && MODEL_ENTRY_METHODS.has(message.method)
        && !restrictedHostConfigMatches(restrictedHostConfig)) {
        readyMcpRelayCatalogs.clear();
        emitClient(jsonRpcError(message.id ?? null, -32087, "Managed host configuration changed", {
          reason_codes: ["gateway.restricted-host-config-drift"], authority_effect: "none",
        }));
        return;
      }
      if (requireMcpCatalog && (message.method === "turn/start" || message.method === "turn/steer")) {
        const owned = precheckBackendThread(metadata.consumer_id, message);
        if (!owned.ok) {
          emitClient(jsonRpcError(message.id ?? null, -32102, "Gateway backend-thread ownership rejected", {
            reason_codes: owned.reason_codes, authority_effect: "none",
          }));
          return;
        }
        const checkedAt = readyMcpRelayCatalogs.get(owned.thread_ref);
        readyMcpRelayCatalogs.delete(owned.thread_ref);
        if (!checkedAt || Date.now() - checkedAt > MCP_RELAY_CATALOG_TTL_MS) {
          emitClient(jsonRpcError(message.id ?? null, -32086, "Managed MCP catalog is unavailable", {
            reason_codes: [mcpCatalogReason], authority_effect: "none",
          }));
          return;
        }
      }
      if (message.method === "thread/compact/start" && !stableRequests.has(metadataResult.request_key)) {
        if (continuityMode !== ACKNOWLEDGED_CONTINUITY_MODE || !metadataResult.request_key) {
          emitClient(jsonRpcError(message.id ?? null, -32093, "Managed compaction needs a durable request key", {
            reason_codes: ["gateway.compaction-stable-request-required"], authority_effect: "none",
          }));
          return;
        }
        const threadRef = `backend-thread:${digestValue(message.params.threadId)}`;
        const observations = hostObservationsForConsumer();
        const activeTurn = observations.some((accepted) => accepted.kind === "turn-start-accepted"
          && accepted.thread_ref === threadRef
          && !observations.some((terminal) => terminal.kind === "turn-completion-observed"
            && terminal.thread_ref === threadRef && terminal.turn_ref === accepted.turn_ref));
        const pendingTurn = [...stableRequests.values()].some((entry) => entry.method === "turn/start"
          && entry.thread_ref === threadRef && entry.status !== "complete");
        if (activeTurn || pendingTurn) {
          emitClient(jsonRpcError(message.id ?? null, -32093, "Managed compaction needs an idle turn", {
            reason_codes: ["gateway.compaction-thread-not-idle"], authority_effect: "none",
          }));
          return;
        }
      }
      const stable = interceptStableRequest(message, metadataResult.request_key);
      if (stable.intercepted) return;
      const precheck = precheckBackendThread(metadata.consumer_id, message);
      if (!precheck.ok) {
        const denied = jsonRpcError(message.id ?? null, -32102, "Gateway backend-thread ownership rejected", {
          reason_codes: precheck.reason_codes, authority_effect: "none",
        });
        if (stable.entry) {
          stable.entry.status = "complete";
          stable.entry.response = denied;
          stable.entry.response_digest = digestValue(denied);
          const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.entry.request_key,
            response: denied, response_digest: stable.entry.response_digest,
            ...(requireModelEntryReceipt && message.method === "turn/start"
              ? {pre_dispatch_rejection: true} : {})});
          if (outcome?.ok !== true) { stop("gateway.thread-rejection-not-durable"); return; }
          if (requireModelEntryReceipt && message.method === "turn/start") stable.entry.pre_dispatch_rejection = true;
          upstreamRequests.delete(String(stable.entry.upstream_id));
          emitClient(denied, stable.entry.request_key);
        } else emitClient(denied);
        return;
      }
      let actions;
      try {
        // The gateway-owned client message ID is durable with the exact turn
        // intent. Give ARE the same identity the installed host will receive;
        // a fresh client's numeric RPC IDs can repeat after process restart.
        const wrapperMessage = stable.entry?.client_message_id
          ? {...message, params: {...message.params,
            clientUserMessageId: stable.entry.client_message_id}}
          : message;
        actions = message.method === "thread/compact/start"
          ? {to_server: [wrapperMessage], to_client: []}
          : await wrapper.processClientMessage(wrapperMessage,
            {hosted_input_verified: hostedInputVerified,
              ...(stable.entry?.client_message_id
                ? {gateway_request_binding_digest: stable.entry.binding_digest} : {}),
              windows_backend_sandbox_attested: windowsEffectProof?.ok === true
                && process.platform === "win32",
              windows_backend_sandbox_root: windowsEffectProof?.root ?? null});
      } catch (error) {
        if (stable.entry) {
          stableRequests.delete(stable.entry.request_key);
          upstreamRequests.delete(String(stable.entry.upstream_id));
        }
        throw error;
      }
      if (process.platform === "win32" && message.method === "cyberalchemy/hostedEffect/execute"
        && actions.to_server.length > 0) {
        const refreshedProof = windowsSandboxProofForEffect();
        const exactCommand = actions.to_server.length === 1
          && actions.to_server[0].method === "command/exec"
          && actions.to_server[0].params?.sandboxPolicy?.writableRoots?.length === 1
          && actions.to_server[0].params.sandboxPolicy.writableRoots[0] === refreshedProof.root;
        if (!refreshedProof.ok || !exactCommand) {
          const denied = jsonRpcError(message.id ?? null, -32084,
            "Windows backend sandbox proof changed before dispatch", {
              reason_codes: [refreshedProof.reason ?? "hosted-effect.windows-backend-command-root-mismatch"],
              authority_effect: "none",
            });
          if (stable.entry) {
            stable.entry.status = "complete";
            stable.entry.response = denied;
            stable.entry.response_digest = digestValue(denied);
            const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.entry.request_key,
              response: denied, response_digest: stable.entry.response_digest});
            if (outcome?.ok !== true) { stop("gateway.windows-backend-rejection-not-durable"); return; }
            upstreamRequests.delete(String(stable.entry.upstream_id));
            emitClient(denied, stable.entry.request_key);
          } else emitClient(denied);
          return;
        }
      }
      for (const candidate of actions.to_server) {
        const paused = turnIngressBlockedReason && MODEL_ENTRY_METHODS.has(candidate.method);
        const claim = paused ? {ok: false, reason_codes: [turnIngressBlockedReason]}
          : claimBackendThread(metadata.consumer_id, candidate);
        const binding = claim.ok && MODEL_ENTRY_METHODS.has(candidate.method)
          ? await authorizeBoundModelEntry(metadata.consumer_id, candidate) : {ok: true};
        if (claim.ok && binding.ok) continue;
        const denied = jsonRpcError(message.id ?? null, paused ? -32085 : !claim.ok ? -32102 : -32104,
          paused ? "Managed turn execution is paused" : !claim.ok ? "Gateway backend-thread ownership rejected"
            : "Gateway conversation binding rejected model entry", {
          reason_codes: claim.ok ? binding.reason_codes : claim.reason_codes, authority_effect: "none",
        });
        if (stable.entry) {
          stable.entry.status = "complete";
          stable.entry.response = denied;
          stable.entry.response_digest = digestValue(denied);
          const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.entry.request_key,
            response: denied, response_digest: stable.entry.response_digest,
            ...(requireModelEntryReceipt && message.method === "turn/start"
              ? {pre_dispatch_rejection: true} : {})});
          if (outcome?.ok !== true) { stop("gateway.thread-rejection-not-durable"); return; }
          if (requireModelEntryReceipt && message.method === "turn/start") stable.entry.pre_dispatch_rejection = true;
          upstreamRequests.delete(String(stable.entry.upstream_id));
          emitClient(denied, stable.entry.request_key);
        } else emitClient(denied);
        return;
      }
      const modelEntryReceipts = requireModelEntryReceipt
        ? verifiedModelEntryReceipts(actions, "direct") : null;
      if (requireModelEntryReceipt && modelEntryReceipts === null) {
        const denied = jsonRpcError(message.id ?? null, -32105,
          "Gateway model-entry receipt rejected", {
            reason_codes: ["gateway.model-entry-receipt-missing-or-invalid"], authority_effect: "none",
          });
        if (stable.entry) {
          stable.entry.status = "complete";
          stable.entry.response = denied;
          stable.entry.response_digest = digestValue(denied);
          const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.entry.request_key,
            response: denied, response_digest: stable.entry.response_digest,
            ...(message.method === "turn/start" ? {pre_dispatch_rejection: true} : {})});
          if (outcome?.ok !== true) { stop("gateway.model-entry-rejection-not-durable"); return; }
          if (message.method === "turn/start") stable.entry.pre_dispatch_rejection = true;
          upstreamRequests.delete(String(stable.entry.upstream_id));
          emitClient(denied, stable.entry.request_key);
        } else emitClient(denied);
        return;
      }
      const forwardedInitialization = actions.to_server.some((candidate) => candidate.method === "initialize" && String(candidate.id) === String(message.id));
      if (forwardedInitialization) initializationForwardCount += 1;
      else if (message.method === "initialize" && initialization.status === "pending" && String(initialization.request_id) === String(message.id)) {
        initialization = freezeResult({status: "not-started", binding_digest: null, request_id: null, client_name: null, result: null, result_digest: null});
      }
      let forwardedStable = false;
      for (const candidate of actions.to_server) {
        if (requireModelEntryReceipt && candidate.method === "turn/start"
          && (!stable.entry || candidate.method !== message.method
            || String(candidate.id) !== String(message.id))) {
          stop("gateway.model-entry-stable-binding-missing");
          return;
        }
        const forwardsServerResponse = serverRequest && Object.hasOwn(candidate, "id") && String(candidate.id) === String(message.id);
        if (forwardsServerResponse) {
          const responseDigest = digestValue(message);
          const intent = onDurableEvent("server-response-intent", {request_id: message.id, response_digest: responseDigest});
          if (intent?.ok !== true) {
            emitClient(jsonRpcError(message.id, -32099, "Gateway server response is not durable", {reason_codes: ["gateway.server-response-intent-not-durable"], authority_effect: "none"}));
            return;
          }
        }
        if (stable.entry && (candidate.method === message.method
          || (message.method === "cyberalchemy/hostedEffect/execute"
            && candidate.method === "command/exec"))
          && String(candidate.id) === String(message.id)) {
          stable.entry.status = "pending";
          forwardedStable = true;
          const forwarded = {...candidate, id: stable.entry.upstream_id,
            ...(stable.entry.client_message_id ? {params: {...candidate.params,
              clientUserMessageId: stable.entry.client_message_id}} : {})};
          if (THREAD_CREATION_METHODS.has(forwarded.method)) pendingThreadCreations.set(String(forwarded.id), message.id);
          if (forwarded.method === "turn/steer") pendingHostSteers.set(String(forwarded.id), {
            client_id: message.id,
            thread_ref: `backend-thread:${digestValue(forwarded.params.threadId)}`,
            turn_ref: digestValue(forwarded.params.expectedTurnId),
            expected_turn_id: forwarded.params.expectedTurnId,
            request_digest: stable.entry.binding_digest,
            request_key_digest: digestValue(stable.entry.request_key),
          });
          if (requireModelEntryReceipt && candidate.method === "turn/start") {
            const receipt = modelEntryReceipts.get(digestValue(candidate));
            if (receipt.request_binding_digest !== stable.entry.binding_digest) {
              stop("gateway.model-entry-request-binding-mismatch"); return;
            }
            const proof = {receipt, forwarded_binding_digest: digestValue({method: candidate.method,
              params: candidate.params})};
            const persisted = onDurableEvent("model-entry-verified", {
              request_key: stable.entry.request_key, ...proof});
            if (persisted?.ok !== true) { stop("gateway.model-entry-proof-not-durable"); return; }
            stable.entry.model_entry_proof = proof;
          }
          if (!trackHostRead(forwarded)) return;
          if (!forwardHostMessage(forwarded)) { stopForDuplicateHostRequest(message.id); return; }
        } else {
          if (THREAD_CREATION_METHODS.has(candidate.method) && Object.hasOwn(candidate, "id")) pendingThreadCreations.set(String(candidate.id), candidate.id);
          if (candidate.method === "turn/steer" && Object.hasOwn(candidate, "id")) pendingHostSteers.set(String(candidate.id), {
            client_id: candidate.id,
            thread_ref: `backend-thread:${digestValue(candidate.params.threadId)}`,
            turn_ref: digestValue(candidate.params.expectedTurnId),
            expected_turn_id: candidate.params.expectedTurnId,
            request_digest: digestValue(candidate),
          });
          if (!trackHostRead(candidate)) return;
          if (!forwardHostMessage(candidate)) { stopForDuplicateHostRequest(message.id); return; }
        }
        if (forwardsServerResponse) {
          serverRequest.status = "forwarded";
          serverRequest.response_digest = digestValue(message);
          const outcome = onDurableEvent("server-response-forwarded", {request_id: message.id, response_digest: serverRequest.response_digest});
          if (outcome?.ok !== true) {
            stop("gateway.server-response-outcome-not-durable");
            return;
          }
        }
      }
      for (const candidate of actions.to_client) {
        if (stable.entry && Object.hasOwn(candidate, "id") && String(candidate.id) === String(message.id)) {
          stable.entry.status = "complete";
          stable.entry.response = candidate;
          stable.entry.response_digest = digestValue(candidate);
          // Only a local wrapper denial with no host-bound action proves that
          // this turn did not consume the thread's pristine first-turn state.
          const preDispatchRejection = stable.entry.method === "turn/start"
            && actions.to_server.length === 0 && candidate.error !== undefined;
          const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.entry.request_key,
            response: candidate, response_digest: stable.entry.response_digest,
            ...(preDispatchRejection ? {pre_dispatch_rejection: true} : {})});
          if (outcome?.ok !== true) { stopForUndurableDispatchOutcome(message.id); return; }
          if (preDispatchRejection) stable.entry.pre_dispatch_rejection = true;
          upstreamRequests.delete(String(stable.entry.upstream_id));
          emitClient(candidate, stable.entry.request_key);
        } else emitClient(candidate);
      }
      if (stable.entry && !forwardedStable && stable.entry.status === "preparing") {
        stableRequests.delete(stable.entry.request_key);
        upstreamRequests.delete(String(stable.entry.upstream_id));
      }
    }).catch((error) => {
      emitClient(jsonRpcError(null, -32603, "Gateway client-path failure", {message: error.message}));
      stop("gateway.client-path-failure", true, false);
    });
  }

  async function processServerLine(line) {
      touch();
      const parsed = parseJsonLine(line);
      if (!parsed.ok) {
        emitClient(jsonRpcError(null, -32700, "App-server parse error", parsed));
        return;
      }
      const sandboxProbe = pendingSandboxProbeRequests.get(String(parsed.value.id));
      if (sandboxProbe) {
        pendingSandboxProbeRequests.delete(String(parsed.value.id));
        clearTimeout(sandboxProbe.timer);
        if (Object.hasOwn(parsed.value, "error")) {
          const error = new Error("gateway.windows-backend-sandbox-probe-rpc-error");
          error.code = "rpc.response-error";
          sandboxProbe.reject(error);
        } else if (Object.hasOwn(parsed.value, "result")) sandboxProbe.resolve(parsed.value.result);
        else sandboxProbe.reject(new Error("gateway.windows-backend-sandbox-probe-response-invalid"));
        return;
      }
      if (expectedCodexVersion && initialization.status !== "complete") {
        const upstreamInitialization = Object.hasOwn(parsed.value, "id")
          ? upstreamRequests.get(String(parsed.value.id)) : null;
        const stableInitializationPending = [...upstreamRequests.values()].some(request =>
          request.method === "initialize"
          && request.binding_digest === initialization.binding_digest
          && String(request.client_id) === String(initialization.request_id));
        const responseToInitialization = initialization.status === "pending"
          && Object.hasOwn(parsed.value, "id")
          && (upstreamInitialization
            ? upstreamInitialization.method === "initialize"
              && upstreamInitialization.binding_digest === initialization.binding_digest
              && String(upstreamInitialization.client_id) === String(initialization.request_id)
            : !stableInitializationPending
              && String(parsed.value.id) === String(initialization.request_id));
        if (!responseToInitialization) {
          emitClient(jsonRpcError(null, -32096, "Codex backend sent data before identity verification", {
            reason_codes: ["gateway.host-event-before-initialize"], authority_effect: "none",
          }));
          stop("gateway.host-event-before-initialize", true, false);
          return;
        }
        const verified = verifyCodexBackendInitializeVersion(parsed.value, expectedCodexVersion, initialization.client_name);
        if (!verified.ok) {
          emitClient(jsonRpcError(parsed.value.id, -32096, "Codex backend identity verification failed", {
            reason_codes: [verified.reason], authority_effect: "none",
          }));
          stop("gateway.host-initialize-version-rejected", true, false);
          return;
        }
        hostInitializeVersionVerification = verified;
      }
      if (governedServerEvents) {
        let posture;
        try { posture = backendAdapter.server_method_posture?.(parsed.value)
          ?? gatewayServerMethodPosture(parsed.value, {allow_hosted_effect_tool: allowHostedEffectTool}); }
        catch { posture = {kind: "rejected", reason_code: "backend.server-method-posture-error"}; }
        if (posture?.kind === "suppress-unscoped-notification" && desktopGlobalNotifications
          && initialization.status === "complete" && hostInitializeVersionVerification?.ok === true) {
          const global = desktopHostGlobalNotificationPosture(parsed.value);
          if (global.kind === "admitted") posture = {kind: "desktop-global"};
          else if (global.kind === "rejected") posture = {kind: "rejected",
            reason_code: global.reason};
        }
        if (!isRecord(posture) || !["response", "scoped", "thread-started", "suppress-unscoped-notification",
          "desktop-global", "deny-unscoped-request", "deny-unassessed-request", "rejected"].includes(posture.kind)
          || (posture.kind === "scoped" && !nonEmptyString(posture.thread_id))
          || (posture.kind === "rejected" && !nonEmptyString(posture.reason_code))) {
          posture = {kind: "rejected", reason_code: "backend.server-method-posture-invalid"};
        }
        if (posture.kind === "suppress-unscoped-notification") return;
        if (posture.kind === "deny-unassessed-request") {
          send(child.stdin, jsonRpcError(parsed.value.id, -32601, "Host tool call has no ARE effect assessment", {
            reason_codes: ["gateway.host-effect-unassessed"], authority_effect: "none",
          }));
          return;
        }
        if (posture.kind === "deny-unscoped-request") {
          send(child.stdin, jsonRpcError(parsed.value.id, -32601, "Unscoped host request is unsupported", {
            reason_codes: ["gateway.host-request-unscoped"], authority_effect: "none",
          }));
          return;
        }
        if (posture.kind === "rejected") {
          emitClient(jsonRpcError(null, -32102, "Gateway host method shape rejected", {
            reason_codes: [posture.reason_code], authority_effect: "none",
          }));
          stop("gateway.host-method-shape-rejected", true, false);
          return;
        }
        if (posture.kind === "scoped" && !backendThreadOwned(metadata.consumer_id,
          `backend-thread:${digestValue(posture.thread_id)}`)) {
          emitClient(jsonRpcError(null, -32102, "Gateway unowned host event rejected", {
            reason_codes: ["gateway.host-event-thread-unowned"], authority_effect: "none",
          }));
          stop("gateway.host-event-thread-unowned", true, false);
          return;
        }
        if (backendAdapter.adapter_id === "codex-app-server/v1"
          && parsed.value.method === "serverRequest/resolved" && !Object.hasOwn(parsed.value, "id")) {
          const requestId = parsed.value.params?.requestId;
          const prior = (typeof requestId === "string" || Number.isSafeInteger(requestId))
            ? serverRequests.get(String(requestId)) : null;
          const threadRef = `backend-thread:${digestValue(posture.thread_id)}`;
          if (!prior || prior.thread_ref !== threadRef || !["pending", "forwarded"].includes(prior.status)) {
            emitClient(jsonRpcError(null, -32103, "Gateway server-request resolution is unbound", {
              reason_codes: ["gateway.server-request-resolution-unbound"], authority_effect: "none",
            }));
            stop("gateway.server-request-resolution-unbound", true, false);
            return;
          }
          const resolutionDigest = digestValue(parsed.value);
          const recorded = onDurableEvent("server-request-resolved", {request_id: requestId,
            thread_ref: threadRef, resolution_digest: resolutionDigest});
          if (recorded?.ok !== true) {
            emitClient(jsonRpcError(null, -32103, "Gateway server-request resolution is not durable", {
              reason_codes: ["gateway.server-request-resolution-not-durable"], authority_effect: "none",
            }));
            stop("gateway.server-request-resolution-not-durable", true, false);
            return;
          }
          prior.status = prior.status === "forwarded" ? "resolved-forwarded" : "resolved-unanswered";
          prior.resolution_digest = resolutionDigest;
        }
        if (backendAdapter.adapter_id === "codex-app-server/v1" && Object.hasOwn(parsed.value, "id")
          && typeof parsed.value.method === "string") {
          const turnPosture = codexServerRequestTurnPosture(parsed.value);
          if (turnPosture.kind === "unsupported-unattributed") {
            send(child.stdin, jsonRpcError(parsed.value.id, -32601, "Unattributed host interaction is unsupported", {
              reason_codes: ["gateway.host-request-turn-unattributed"], authority_effect: "none",
            }));
            return;
          }
          if (turnPosture.kind === "invalid") {
            emitClient(jsonRpcError(null, -32103, "Gateway host request turn identity is invalid", {
              reason_codes: ["gateway.host-request-turn-id-invalid"], authority_effect: "none",
            }));
            stop("gateway.host-request-turn-id-invalid", true, false);
            return;
          }
          if (turnPosture.kind === "scoped") {
            const threadRef = `backend-thread:${digestValue(posture.thread_id)}`;
            const turnRef = digestValue(turnPosture.turn_id);
            const observations = hostObservationsForConsumer();
            const accepted = observations.some((entry) => entry.thread_ref === threadRef
              && entry.turn_ref === turnRef && (entry.kind === "turn-start-accepted"
                || (entry.kind === "turn-marker-observed" && entry.turn_status === "inProgress")));
            const terminal = observations.some((entry) => entry.thread_ref === threadRef
              && entry.turn_ref === turnRef && ((entry.kind === "turn-completion-observed"
                || entry.kind === "turn-history-verified" || entry.kind === "turn-marker-observed")
                && ["completed", "failed", "interrupted"].includes(entry.turn_status)));
            if (!accepted || terminal) {
              const reason = terminal ? "gateway.host-request-turn-terminal" : "gateway.host-request-turn-unbound";
              emitClient(jsonRpcError(null, -32103, "Gateway host request is not bound to an active ARE turn", {
                reason_codes: [reason], authority_effect: "none",
              }));
              stop(reason, true, false);
              return;
            }
          }
          const shapePosture = codexServerRequestCriticalShapePosture(parsed.value);
          if (shapePosture.kind === "rejected") {
            emitClient(jsonRpcError(null, -32103, "Gateway host request required fields are invalid", {
              reason_codes: [shapePosture.reason_code], authority_effect: "none",
            }));
            stop(shapePosture.reason_code, true, false);
            return;
          }
        }
        if (posture.kind === "response" && Object.hasOwn(parsed.value, "id")) {
          const pending = pendingHostRequests.get(String(parsed.value.id));
          if (!pending) {
            emitClient(jsonRpcError(null, -32102, "Gateway unsolicited host response rejected", {
              reason_codes: ["gateway.host-response-unsolicited"], authority_effect: "none",
            }));
            stop("gateway.host-response-unsolicited", true, false);
            return;
          }
          pendingHostRequests.delete(String(parsed.value.id));
          const resultThreadId = parsed.value.result?.thread?.id ?? parsed.value.result?.turn?.threadId;
          if (pending.thread_ref && (!backendThreadOwned(metadata.consumer_id, pending.thread_ref)
            || (pending.method !== "thread/fork" && nonEmptyString(resultThreadId)
              && `backend-thread:${digestValue(resultThreadId)}` !== pending.thread_ref))) {
            emitClient(jsonRpcError(null, -32102, "Gateway host response thread binding rejected", {
              reason_codes: ["gateway.host-response-thread-mismatch"], authority_effect: "none",
            }));
            stop("gateway.host-response-thread-mismatch", true, false);
            return;
          }
          if (requireMcpCatalog && pending.method === "mcpServerStatus/list" && pending.thread_ref) {
            const checkedAt = Date.now();
            const ready = requireRestrictedMcpCatalog
              ? hostedRestrictedMcpCatalogPosture(parsed.value.result, {requireRelay: requireMcpHookRelay}).ok
              : hostedMcpRelayCatalogPosture(parsed.value.result).ok;
            if (ready) readyMcpRelayCatalogs.set(pending.thread_ref, checkedAt);
            else readyMcpRelayCatalogs.delete(pending.thread_ref);
            if (readyMcpRelayCatalogs.size > MAX_MCP_RELAY_CHECKS_PER_SESSION) {
              readyMcpRelayCatalogs.delete(readyMcpRelayCatalogs.keys().next().value);
            }
            if (requireMcpHookRelay) {
              lastMcpRelayChecks.delete(pending.thread_ref);
              lastMcpRelayChecks.set(pending.thread_ref, {status: ready ? "listed" : "not-ready",
                checked_at_unix_ms: checkedAt});
              if (lastMcpRelayChecks.size > MAX_MCP_RELAY_CHECKS_PER_SESSION) {
                const oldestThreadRef = lastMcpRelayChecks.keys().next().value;
                lastMcpRelayChecks.delete(oldestThreadRef);
                readyMcpRelayCatalogs.delete(oldestThreadRef);
              }
            }
          }
        }
      }
      // The pinned Codex catalog requires a turn identity on all notifications
      // with a required turnId, as well as turn lifecycle events with turn.id.
      // Do not let progress, reasoning, or completion from another turn reach
      // the wrapper just because the thread is owned. An
      // event before a durable acceptance receipt is withheld in a bounded
      // queue only for one exact pending turn/start on its owned thread. It
      // reaches the wrapper only after the accepted turn ID matches; otherwise
      // the gateway closes without inferring acceptance from the event.
      if (backendAdapter.adapter_id === "codex-app-server/v1"
        && !Object.hasOwn(parsed.value, "id")
        && typeof parsed.value.method === "string"
        && codexServerNotificationRequiresAcceptedTurn(parsed.value.method, parsed.value.params)) {
        const params = parsed.value.params;
        const turnId = parsed.value.method === "turn/started" || parsed.value.method === "turn/completed"
          ? params?.turn?.id : params?.turnId;
        const validThreadId = nonEmptyString(params?.threadId) && params.threadId === params.threadId.trim()
          && Buffer.byteLength(params.threadId, "utf8") <= 256;
        const threadRef = validThreadId ? `backend-thread:${digestValue(params.threadId)}` : null;
        const validTurnId = nonEmptyString(turnId) && turnId === turnId.trim()
          && Buffer.byteLength(turnId, "utf8") <= 256;
        const turnRef = validTurnId ? digestValue(turnId) : null;
        let accepted = validThreadId && validTurnId && hostObservationsForConsumer().some((entry) =>
          (entry.kind === "turn-start-accepted" || entry.kind === "compaction-turn-accepted"
            || entry.kind === "turn-marker-observed"
            || entry.kind === "turn-completion-observed")
          && entry.thread_ref === threadRef && entry.turn_ref === turnRef);
        const compacting = validThreadId ? [...stableRequests.values()].filter((entry) =>
          entry.method === "thread/compact/start" && entry.thread_ref === threadRef
          && !compactionAcceptance(entry) && ["pending", "complete"].includes(entry.status)) : [];
        if (!accepted && validTurnId && parsed.value.method === "turn/started"
          && compacting.length === 1 && compacting[0].status === "complete"
          && isRecord(compacting[0].response?.result)
          && Object.keys(compacting[0].response.result).length === 0) {
          const entry = compacting[0];
          const material = {kind: "compaction-turn-accepted", thread_ref: threadRef,
            turn_ref: turnRef, request_key_digest: digestValue(entry.request_key),
            request_digest: entry.binding_digest, response_digest: entry.response_digest,
            event_digest: digestValue(parsed.value)};
          const observation = {...material, observation_digest: digestValue(material)};
          if (onDurableEvent("host-observation", {observation})?.ok !== true) {
            emitClient(jsonRpcError(null, -32103, "Gateway compaction turn binding is not durable", {
              reason_codes: ["gateway.compaction-turn-binding-not-durable"], authority_effect: "none",
            }));
            stop("gateway.compaction-turn-binding-not-durable", true, false);
            return;
          }
          accepted = true;
        }
        if (!accepted) {
          const pending = [...upstreamRequests.values()].filter((entry) => entry.method === "turn/start"
            && entry.thread_ref === threadRef && entry.status === "pending");
          const pendingCompact = compacting.filter((entry) => entry.status === "pending");
          if (validThreadId && validTurnId && pending.length + pendingCompact.length === 1
            && pendingPreAcceptanceEvents.length < maxBufferedMessages) {
            pendingPreAcceptanceEvents.push({thread_ref: threadRef, turn_ref: turnRef, line});
            return;
          }
          const reason = parsed.value.method === "turn/completed" ? "gateway.turn-completion-unbound"
            : parsed.value.method === "item/completed" && params?.item?.type === "contextCompaction"
              && (params.item.status === undefined || params.item.status === "completed")
              ? "gateway.compaction-observation-turn-unbound" : "gateway.turn-event-unbound";
          emitClient(jsonRpcError(null, -32103, "Gateway host turn event is not ARE-accepted", {
            reason_codes: [reason], authority_effect: "none",
          }));
          stop(reason, true, false);
          return;
        }
      }
      if (backendAdapter.adapter_id === "codex-app-server/v1" && parsed.value.method === "turn/completed") {
        const params = parsed.value.params;
        const threadRef = `backend-thread:${digestValue(params.threadId)}`;
        const turnRef = digestValue(params.turn.id);
        if (!["completed", "failed", "interrupted"].includes(params.turn.status)) {
          emitClient(jsonRpcError(null, -32103, "Gateway host completion status is not terminal", {
            reason_codes: ["gateway.turn-completion-status-invalid"], authority_effect: "none",
          }));
          stop("gateway.turn-completion-status-invalid", true, false);
          return;
        }
        const accepted = hostObservationsForConsumer().filter((entry) =>
          (entry.kind === "turn-start-accepted" || entry.kind === "compaction-turn-accepted"
            || entry.kind === "turn-marker-observed")
          && entry.thread_ref === threadRef && entry.turn_ref === turnRef);
        const prior = hostObservationsForConsumer().find((entry) => entry.kind === "turn-completion-observed"
          && entry.thread_ref === threadRef && entry.turn_ref === turnRef);
        if (accepted.length > 1 || (accepted.length === 0 && !prior)) {
          emitClient(jsonRpcError(null, -32103, "Gateway host completion acceptance is ambiguous", {
            reason_codes: ["gateway.turn-completion-acceptance-ambiguous"], authority_effect: "none",
          }));
          stop("gateway.turn-completion-acceptance-ambiguous", true, false);
          return;
        }
        const binding = accepted[0] ?? prior;
        const material = {kind: "turn-completion-observed", thread_ref: threadRef, turn_ref: turnRef,
          request_key_digest: binding.request_key_digest, request_digest: binding.request_digest,
          event_digest: digestValue(parsed.value), turn_status: params.turn.status};
        const observation = {...material, observation_digest: digestValue(material)};
        const request = [...stableRequests.values()].find((entry) =>
          (entry.method === "turn/start" || entry.method === "thread/compact/start")
          && entry.thread_ref === threadRef && entry.binding_digest === binding.request_digest
          && digestValue(entry.request_key) === binding.request_key_digest);
        if (!request) {
          emitClient(jsonRpcError(null, -32103, "Gateway host completion request is not bound", {
            reason_codes: ["gateway.turn-completion-request-unbound"], authority_effect: "none",
          }));
          stop("gateway.turn-completion-request-unbound", true, false);
          return;
        }
        if (prior && prior.turn_status !== observation.turn_status) {
          stopForHostHistoryConflict(null, "gateway.turn-completion-status-conflict", request, prior, observation);
          return;
        }
        const priorTerminal = hostObservationsForConsumer().find((entry) =>
          (entry.kind === "turn-history-verified" || entry.kind === "turn-marker-observed"
            || entry.kind === "compaction-history-verified")
          && entry.thread_ref === threadRef && entry.turn_ref === turnRef
          && ["completed", "failed", "interrupted"].includes(entry.turn_status));
        if (priorTerminal && priorTerminal.turn_status !== observation.turn_status) {
          stopForHostHistoryConflict(null, "gateway.turn-completion-status-conflict", request,
            priorTerminal, observation);
          return;
        }
        if (!prior && onDurableEvent("host-observation", {observation})?.ok !== true) {
          emitClient(jsonRpcError(null, -32103, "Gateway host completion receipt is not durable", {
            reason_codes: ["gateway.turn-completion-not-durable"], authority_effect: "none",
          }));
          stop("gateway.turn-completion-not-durable", true, false);
          return;
        }
      }
      const hostRead = Object.hasOwn(parsed.value, "id") ? pendingHostReads.get(String(parsed.value.id)) : null;
      const readThreadRef = hostRead?.thread_ref;
      if (readThreadRef) {
        pendingHostReads.delete(String(parsed.value.id));
        if (Object.hasOwn(parsed.value, "result") && !Object.hasOwn(parsed.value, "error")) {
          const observations = [...hostObservationsForConsumer()];
          const generalHistoryRequests = hostRead.purpose === "auto-compaction"
            ? [] : [...stableRequests.values()];
          for (const request of generalHistoryRequests) {
            if (request.method !== "thread/start" || request.status !== "outcome-unknown"
              || !request.creation_acceptance || request.creation_history
              || `backend-thread:${digestValue(request.creation_acceptance.thread_id)}` !== readThreadRef
              || parsed.value.result?.thread?.id !== request.creation_acceptance.thread_id
              || !Array.isArray(parsed.value.result.thread.turns)
              || parsed.value.result.thread.turns.length !== 0) continue;
            const history = {request_key: request.request_key, request_digest: request.binding_digest,
              thread_id: request.creation_acceptance.thread_id,
              acceptance_digest: request.creation_acceptance.acceptance_digest,
              history_response_digest: digestValue(parsed.value)};
            if (onDurableEvent("thread-creation-history-verified", history)?.ok !== true) {
              emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway thread creation history is not durable", {
                reason_codes: ["gateway.thread-creation-history-not-durable"], authority_effect: "none",
              }));
              stop("gateway.thread-creation-history-not-durable", true, false);
              return;
            }
            request.creation_history = history;
          }
          for (const request of generalHistoryRequests) {
            if (request.method !== "turn/start" || !["complete", "outcome-unknown"].includes(request.status)
              || request.thread_ref !== readThreadRef) continue;
            const accepted = observations.filter((entry) => entry.kind === "turn-start-accepted"
              && entry.thread_ref === request.thread_ref && entry.request_key_digest === digestValue(request.request_key)
              && entry.request_digest === request.binding_digest);
            if (accepted.length <= 1 && request.status === "outcome-unknown" && request.client_message_id) {
              const marked = observeMarkedTurnInHostHistory({request, response: parsed.value});
              if (!marked.ok) continue;
              if (accepted.length === 1 && accepted[0].turn_ref !== marked.observation.turn_ref) {
                stopForHostHistoryConflict(parsed.value.id, "gateway.turn-marker-history-conflict",
                  request, accepted[0], marked.observation);
                return;
              }
              const completion = accepted.length === 1 && observations.find((entry) =>
                entry.kind === "turn-completion-observed"
                && entry.request_key_digest === marked.observation.request_key_digest
                && entry.turn_ref === marked.observation.turn_ref);
              if (completion && completion.turn_status !== marked.observation.turn_status) {
                if (marked.observation.turn_status !== "inProgress") {
                  stopForHostHistoryConflict(parsed.value.id, "gateway.turn-completion-status-conflict",
                    request, completion, marked.observation);
                  return;
                }
                if (hostRead.audit && onDurableEvent("history-audit-completed", {audit: hostRead.audit})?.ok !== true) {
                  emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway history audit completion could not be persisted", {
                    reason_codes: ["gateway.history-audit-completion-not-durable"], authority_effect: "none",
                  }));
                  stop("gateway.history-audit-completion-not-durable", true, false);
                  return;
                }
                emitClient(jsonRpcError(parsed.value.id, -32105, "Host history snapshot is behind a durable terminal observation", {
                  reason_codes: ["gateway.turn-history-stale"], authority_effect: "none",
                }));
                return;
              }
              const priorMarked = observations.filter((entry) => entry.kind === "turn-marker-observed"
                && entry.request_key_digest === marked.observation.request_key_digest
                && entry.request_digest === marked.observation.request_digest
                && entry.client_message_id_digest === marked.observation.client_message_id_digest);
              const conflictingMarker = priorMarked.find((entry) => entry.turn_ref !== marked.observation.turn_ref
                || (entry.turn_status !== "inProgress" && entry.turn_status !== marked.observation.turn_status));
              if (conflictingMarker) {
                stopForHostHistoryConflict(parsed.value.id, "gateway.turn-marker-history-conflict",
                  request, conflictingMarker, marked.observation);
                return;
              }
              if (!priorMarked.some((entry) => entry.turn_status === marked.observation.turn_status)) {
                const recorded = onDurableEvent("host-observation", {observation: marked.observation});
                if (recorded?.ok !== true) {
                  emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway host marker receipt is not durable", {
                    reason_codes: ["gateway.turn-marker-not-durable"], authority_effect: "none",
                  }));
                  stop("gateway.turn-marker-not-durable", true, false);
                  return;
                }
                observations.push(marked.observation);
              }
              if (["completed", "interrupted", "failed"].includes(marked.observation.turn_status)
                && typeof wrapper.reconcileRecoveredTerminalTurn === "function") {
                const durableMarked = observations.find((entry) => entry.kind === "turn-marker-observed"
                  && entry.request_key_digest === marked.observation.request_key_digest
                  && entry.request_digest === marked.observation.request_digest
                  && entry.client_message_id_digest === marked.observation.client_message_id_digest
                  && entry.turn_ref === marked.observation.turn_ref
                  && entry.turn_status === marked.observation.turn_status);
                const hostTurn = parsed.value.result.thread.turns.find((turn) =>
                  isRecord(turn) && nonEmptyString(turn.id)
                  && digestValue(turn.id) === marked.observation.turn_ref);
                const reconciled = await wrapper.reconcileRecoveredTerminalTurn({request,
                  marker_observation: durableMarked, response: parsed.value,
                  thread_id: parsed.value.result.thread.id, turn_id: hostTurn.id});
                if (!reconciled?.ok) {
                  emitClient(jsonRpcError(parsed.value.id, -32103, "ARE marked turn could not be reconciled", {
                    reason_codes: reconciled?.reason_codes ?? ["gateway.recovery-marker-terminal-failed"],
                    authority_effect: "none",
                  }));
                  stop("gateway.recovery-marker-terminal-failed", true, false);
                  return;
                }
                if (["already-completed", "already-reconciled", "reconciled-terminal"].includes(reconciled.disposition)
                  && /^[0-9a-f]{64}$/.test(reconciled.semantic_receipt_digest ?? "")) {
                  const material = {schema_version: GATEWAY_TURN_RECOVERY_SCHEMA,
                    request_key: request.request_key, request_digest: request.binding_digest,
                    thread_id: parsed.value.result.thread.id, turn_id: hostTurn.id,
                    turn_status: marked.observation.turn_status,
                    host_observation_digest: durableMarked.observation_digest,
                    semantic_receipt_digest: reconciled.semantic_receipt_digest,
                    authority_effect: "none"};
                  recoveryCandidates.set(request.request_key,
                    freezeResult({...material, receipt_digest: digestValue(material)}));
                }
              }
              continue;
            }
            if (accepted.length !== 1) continue;
            const verified = verifyAcceptedTurnInHostHistory({request, acceptance: accepted[0], response: parsed.value});
            if (!verified.ok) continue;
            const completion = observations.find((entry) => entry.kind === "turn-completion-observed"
              && entry.request_key_digest === verified.observation.request_key_digest
              && entry.turn_ref === verified.observation.turn_ref);
            const prior = observations.find((entry) => entry.kind === "turn-history-verified"
              && entry.request_key_digest === verified.observation.request_key_digest
              && entry.turn_ref === verified.observation.turn_ref
              && (entry.turn_status === verified.observation.turn_status || entry.turn_status !== "inProgress"));
            if (prior && prior.turn_status !== verified.observation.turn_status) {
              if (verified.observation.turn_status === "inProgress"
                && ["completed", "failed", "interrupted"].includes(prior.turn_status)) {
                // A delayed active snapshot cannot supersede a durable terminal
                // observation. Reject only this read; a different terminal
                // outcome remains a session fault below.
                if (hostRead.audit && onDurableEvent("history-audit-completed", {audit: hostRead.audit})?.ok !== true) {
                  emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway history audit completion could not be persisted", {
                    reason_codes: ["gateway.history-audit-completion-not-durable"], authority_effect: "none",
                  }));
                  stop("gateway.history-audit-completion-not-durable", true, false);
                  return;
                }
                emitClient(jsonRpcError(parsed.value.id, -32105, "Host history snapshot is behind a durable terminal observation", {
                  reason_codes: ["gateway.turn-history-stale"], authority_effect: "none",
                }));
                return;
              }
              stopForHostHistoryConflict(parsed.value.id, "gateway.turn-history-status-conflict",
                request, prior, verified.observation);
              return;
            }
            if ((request.recovered !== true && !completion
                && ["completed", "interrupted", "failed"].includes(verified.observation.turn_status))
              || (completion && completion.turn_status !== verified.observation.turn_status)) {
              if (hostRead.audit && onDurableEvent("history-audit-completed", {audit: hostRead.audit})?.ok !== true) {
                emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway history audit completion could not be persisted", {
                  reason_codes: ["gateway.history-audit-completion-not-durable"], authority_effect: "none",
                }));
                stop("gateway.history-audit-completion-not-durable", true, false);
                return;
              }
              emitClient(jsonRpcError(parsed.value.id, -32106, "Host history is not aligned with the native completion receipt", {
                reason_codes: [completion ? "gateway.turn-history-stale" : "gateway.turn-history-unsettled"],
                authority_effect: "none",
              }));
              return;
            }
            if (!prior) {
              const recorded = onDurableEvent("host-observation", {observation: verified.observation});
              if (recorded?.ok !== true) {
                emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway host history receipt is not durable", {
                  reason_codes: ["gateway.turn-history-not-durable"], authority_effect: "none",
                }));
                stop("gateway.turn-history-not-durable", true, false);
                return;
              }
              observations.push(verified.observation);
            }
            if (request.status === "complete" && ["completed", "interrupted", "failed"].includes(verified.observation.turn_status)
              && (!prior || prior.turn_status === verified.observation.turn_status)
              && typeof wrapper.reconcileRecoveredTerminalTurn === "function") {
              const hostTurn = parsed.value.result.thread.turns.find((turn) =>
                isRecord(turn) && nonEmptyString(turn.id) && digestValue(turn.id) === accepted[0].turn_ref);
              const reconciled = await wrapper.reconcileRecoveredTerminalTurn({request, acceptance: accepted[0],
                response: parsed.value, thread_id: parsed.value.result.thread.id, turn_id: hostTurn.id});
              if (!reconciled?.ok) {
                emitClient(jsonRpcError(parsed.value.id, -32103, "ARE recovered turn could not be reconciled", {
                  reason_codes: reconciled?.reason_codes ?? ["gateway.recovery-terminal-failed"], authority_effect: "none",
                }));
                stop("gateway.recovery-terminal-failed", true, false);
                return;
              }
            }
          }
          for (const request of stableRequests.values()) {
            if (request.method !== "thread/compact/start" || request.status !== "complete"
              || (hostRead.purpose === "auto-compaction"
                && request.request_key !== hostRead.compaction_request_key)
              || request.thread_ref !== readThreadRef || request.response?.error) continue;
            const accepted = observations.filter((entry) => entry.kind === "compaction-turn-accepted"
              && entry.thread_ref === request.thread_ref
              && entry.request_key_digest === digestValue(request.request_key)
              && entry.request_digest === request.binding_digest);
            if (accepted.length !== 1) continue;
            const verified = verifyAcceptedCompactionInHostHistory({request, acceptance: accepted[0],
              response: parsed.value});
            if (!verified.ok) continue;
            const prior = observations.filter((entry) => entry.kind === "compaction-history-verified"
              && entry.thread_ref === request.thread_ref && entry.turn_ref === accepted[0].turn_ref
              && entry.request_key_digest === accepted[0].request_key_digest);
            const nativeItem = observations.find((entry) => entry.kind === "compaction-item-completed"
              && entry.thread_ref === request.thread_ref && entry.turn_ref === accepted[0].turn_ref);
            const nativeTerminal = observations.find((entry) => entry.kind === "turn-completion-observed"
              && entry.thread_ref === request.thread_ref && entry.turn_ref === accepted[0].turn_ref
              && entry.request_key_digest === accepted[0].request_key_digest);
            const conflict = prior.find((entry) => entry.item_ref !== verified.observation.item_ref)
              ?? (nativeItem?.item_ref !== undefined && nativeItem.item_ref !== verified.observation.item_ref ? nativeItem : null)
              ?? (nativeTerminal?.turn_status !== undefined && nativeTerminal.turn_status !== "completed" ? nativeTerminal : null);
            if (conflict) {
              stopForHostHistoryConflict(parsed.value.id, "gateway.compaction-history-conflict",
                request, conflict, verified.observation);
              return;
            }
            if (prior.length === 0) {
              const recorded = onDurableEvent("host-observation", {observation: verified.observation});
              if (recorded?.ok !== true) {
                emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway compaction history receipt is not durable", {
                  reason_codes: ["gateway.compaction-history-not-durable"], authority_effect: "none",
                }));
                stop("gateway.compaction-history-not-durable", true, false);
                return;
              }
              observations.push(verified.observation);
            }
          }
        }
      }
      if (hostRead?.audit && onDurableEvent("history-audit-completed", {audit: hostRead.audit})?.ok !== true) {
        emitClient(jsonRpcError(parsed.value.id, -32103, "Gateway history audit completion could not be persisted", {
          reason_codes: ["gateway.history-audit-completion-not-durable"], authority_effect: "none",
        }));
        stop("gateway.history-audit-completion-not-durable", true, false);
        return;
      }
      const autoCompactionRead = Object.hasOwn(parsed.value, "id")
        ? pendingAutoCompactionReads.get(String(parsed.value.id)) : null;
      if (autoCompactionRead) {
        pendingAutoCompactionReads.delete(String(parsed.value.id));
        if (closed) return;
        if (reconnectCount !== autoCompactionRead.attachment_generation || !client || client.destroyed) {
          emitClient(jsonRpcError(autoCompactionRead.client_id, -32093,
            "Managed compaction recovery needs a new client request", {
              reason_codes: ["gateway.compaction-recovery-retry-required"], authority_effect: "none",
            }));
        } else if (Object.hasOwn(parsed.value, "error") || unsettledCompaction()) {
          emitClient(jsonRpcError(autoCompactionRead.client_id, -32093,
            "Managed compaction recovery is not yet verified", {
              reason_codes: [Object.hasOwn(parsed.value, "error")
                ? "gateway.compaction-history-read-failed" : "gateway.compaction-unsettled"],
              authority_effect: "none",
            }));
        } else processClientLine(autoCompactionRead.line);
        return;
      }
      if (parsed.value.method === "thread/started") {
        const threadId = parsed.value.params?.thread?.id;
        const threadRef = nonEmptyString(threadId) ? `backend-thread:${digestValue(threadId)}` : null;
        const alreadyOwned = threadRef && backendThreadOwned(metadata.consumer_id, threadRef);
        if (!alreadyOwned && (!nonEmptyString(threadId) || pendingThreadCreations.size === 0
          || pendingThreadStarted.has(threadId) || pendingThreadStarted.size >= maxBufferedMessages)) {
          emitClient(jsonRpcError(null, -32102, "Gateway unbound backend-thread notification rejected", {
            reason_codes: ["gateway.thread-started-unbound"], authority_effect: "none",
          }));
          stop("gateway.thread-started-unbound", true, false);
          return;
        }
        if (!alreadyOwned && backendAdapter.adapter_id === "codex-app-server/v1") {
          // A notification has no creation request ID. Its thread ID is not
          // trusted until the matching creation response proves the binding.
          pendingThreadStarted.set(threadId, parsed.value);
          return;
        }
        if (!alreadyOwned) {
          const claim = claimBackendThread(metadata.consumer_id, {method: "thread/resume", params: {threadId}}, {createdByGateway: true});
          if (!claim.ok) {
            emitClient(jsonRpcError(null, -32102, "Gateway backend-thread notification binding rejected", {
              reason_codes: claim.reason_codes, authority_effect: "none",
            }));
            stop("gateway.thread-started-binding-rejected", true, false);
            return;
          }
        }
      }
      const pendingThreadCreationId = Object.hasOwn(parsed.value, "id") ? pendingThreadCreations.get(String(parsed.value.id)) : undefined;
      if (pendingThreadCreationId !== undefined) {
        pendingThreadCreations.delete(String(parsed.value.id));
        if (Object.hasOwn(parsed.value, "result") && !Object.hasOwn(parsed.value, "error")) {
          const threadId = parsed.value.result?.thread?.id;
          const claim = claimBackendThread(metadata.consumer_id, {method: "thread/resume", params: {threadId}}, {createdByGateway: true});
          if (!claim.ok) {
            emitClient(jsonRpcError(pendingThreadCreationId, -32102, "Gateway backend-thread creation binding rejected", {
              reason_codes: claim.reason_codes, authority_effect: "none",
            }));
            stop("gateway.thread-creation-binding-rejected", true, false);
            return;
          }
          const creationRequest = upstreamRequests.get(String(parsed.value.id));
          let creationAcceptance = null;
          if (creationRequest?.method === "thread/start" && backendAdapter.adapter_id === "codex-app-server/v1") {
            const material = {request_key: creationRequest.request_key,
              request_digest: creationRequest.binding_digest, thread_id: threadId,
              response_digest: digestValue(parsed.value)};
            const acceptance = {...material, acceptance_digest: digestValue(material)};
            if (onDurableEvent("thread-creation-accepted", acceptance)?.ok !== true) {
              emitClient(jsonRpcError(pendingThreadCreationId, -32103, "Gateway thread creation acceptance is not durable", {
                reason_codes: ["gateway.thread-creation-acceptance-not-durable"], authority_effect: "none",
              }));
              stop("gateway.thread-creation-acceptance-not-durable", true, false);
              return;
            }
            creationRequest.creation_acceptance = acceptance;
            freshThreadCreations.set(threadId, acceptance);
            creationAcceptance = acceptance;
          }
          if (requireBoundNativeCreation) {
            const joined = creationAcceptance
              ? await bindNativeThreadCreation(metadata.consumer_id, creationAcceptance)
              : {ok: false, reason_codes: ["binding.creation-acceptance-required"]};
            if (!joined.ok) {
              emitClient(jsonRpcError(pendingThreadCreationId, -32104,
                "Gateway native thread was not bound to a verified conversation", {
                  reason_codes: joined.reason_codes, authority_effect: "none",
                }));
              stop("gateway.native-creation-binding-rejected", true, false);
              return;
            }
          }
          const started = pendingThreadStarted.get(threadId);
          if (started) {
            pendingThreadStarted.delete(threadId);
            const startedActions = await wrapper.processServerMessage(started);
            if (startedActions.to_server.length > 0) {
              emitClient(jsonRpcError(null, -32102, "Gateway deferred thread notification produced an unbound action", {
                reason_codes: ["gateway.thread-started-action-unsupported"], authority_effect: "none",
              }));
              stop("gateway.thread-started-action-unsupported", true, false);
              return;
            }
            for (const notification of startedActions.to_client) emitClient(notification);
          }
        }
        if (pendingThreadCreations.size === 0 && pendingThreadStarted.size > 0) {
          emitClient(jsonRpcError(null, -32102, "Gateway unmatched backend-thread notification rejected", {
            reason_codes: ["gateway.thread-started-unmatched"], authority_effect: "none",
          }));
          stop("gateway.thread-started-unmatched", true, false);
          return;
        }
      }
      const pendingSteer = Object.hasOwn(parsed.value, "id") ? pendingHostSteers.get(String(parsed.value.id)) : null;
      if (pendingSteer) {
        pendingHostSteers.delete(String(parsed.value.id));
        if (Object.hasOwn(parsed.value, "result") && !Object.hasOwn(parsed.value, "error")) {
          if (parsed.value.result?.turnId !== pendingSteer.expected_turn_id) {
            emitClient(jsonRpcError(pendingSteer.client_id, -32103, "Gateway host steer binding rejected", {
              reason_codes: ["gateway.steer-turn-mismatch"], authority_effect: "none",
            }));
            stop("gateway.steer-turn-mismatch", true, false);
            return;
          }
          const observation = {
            kind: "steer-accepted", thread_ref: pendingSteer.thread_ref, turn_ref: pendingSteer.turn_ref,
            request_digest: pendingSteer.request_digest, response_digest: digestValue(parsed.value),
            ...(pendingSteer.request_key_digest ? {request_key_digest: pendingSteer.request_key_digest} : {}),
          };
          observation.observation_digest = digestValue(observation);
          const recorded = onDurableEvent("host-observation", {observation});
          if (recorded?.ok !== true) {
            emitClient(jsonRpcError(pendingSteer.client_id, -32103, "Gateway host steer receipt is not durable", {
              reason_codes: ["gateway.steer-observation-not-durable"], authority_effect: "none",
            }));
            stop("gateway.steer-observation-not-durable", true, false);
            return;
          }
        }
      }
      if (parsed.value.method === "item/completed" && parsed.value.params?.item?.type === "contextCompaction"
        && (parsed.value.params.item.status === undefined || parsed.value.params.item.status === "completed")) {
        const params = parsed.value.params;
        const threadRef = nonEmptyString(params.threadId) ? `backend-thread:${digestValue(params.threadId)}` : null;
        if (!threadRef || !backendThreadOwned(metadata.consumer_id, threadRef)
          || !nonEmptyString(params.item.id)) {
          emitClient(jsonRpcError(null, -32103, "Gateway unbound host compaction observation rejected", {
            reason_codes: ["gateway.compaction-observation-unbound"], authority_effect: "none",
          }));
          stop("gateway.compaction-observation-unbound", true, false);
          return;
        }
        const turnRef = nonEmptyString(params.turnId) && params.turnId === params.turnId.trim()
          && Buffer.byteLength(params.turnId, "utf8") <= 256 ? digestValue(params.turnId) : null;
        if (backendAdapter.adapter_id === "codex-app-server/v1"
          && (!turnRef || !hostObservationsForConsumer().some((entry) =>
            (entry.kind === "turn-start-accepted" || entry.kind === "compaction-turn-accepted"
              || entry.kind === "turn-marker-observed"
              || entry.kind === "turn-completion-observed")
            && entry.thread_ref === threadRef && entry.turn_ref === turnRef))) {
          emitClient(jsonRpcError(null, -32103, "Gateway host compaction turn is not ARE-accepted", {
            reason_codes: ["gateway.compaction-observation-turn-unbound"], authority_effect: "none",
          }));
          stop("gateway.compaction-observation-turn-unbound", true, false);
          return;
        }
        const observation = {
          kind: "compaction-item-completed", thread_ref: threadRef,
          turn_ref: turnRef,
          item_ref: digestValue(params.item.id),
          item_status: params.item.status === "completed" ? "completed" : "not-reported",
        };
        observation.observation_digest = digestValue(observation);
        const recoveredItem = hostObservationsForConsumer().find((entry) =>
          entry.kind === "compaction-history-verified" && entry.thread_ref === threadRef
          && entry.turn_ref === turnRef);
        if (recoveredItem && recoveredItem.item_ref !== observation.item_ref) {
          const request = [...stableRequests.values()].find((entry) =>
            entry.method === "thread/compact/start" && entry.thread_ref === threadRef
            && entry.binding_digest === recoveredItem.request_digest
            && digestValue(entry.request_key) === recoveredItem.request_key_digest);
          if (!request) {
            stop("gateway.compaction-item-history-request-unbound", true, false);
            return;
          }
          stopForHostHistoryConflict(null, "gateway.compaction-item-history-conflict",
            request, recoveredItem, observation);
          return;
        }
        const recorded = onDurableEvent("host-observation", {observation});
        if (recorded?.ok !== true) {
          emitClient(jsonRpcError(null, -32103, "Gateway host compaction receipt is not durable", {
            reason_codes: ["gateway.compaction-observation-not-durable"], authority_effect: "none",
          }));
          stop("gateway.compaction-observation-not-durable", true, false);
          return;
        }
      }
      if (backendAdapter.adapter_id === "codex-app-server/v1"
        && !Object.hasOwn(parsed.value, "id") && typeof parsed.value.method === "string") {
        const params = parsed.value.params;
        const compactTurnId = parsed.value.method === "turn/started" || parsed.value.method === "turn/completed"
          ? params?.turn?.id : params?.turnId;
        const compactThreadRef = nonEmptyString(params?.threadId)
          ? `backend-thread:${digestValue(params.threadId)}` : null;
        const compactTurnRef = nonEmptyString(compactTurnId) ? digestValue(compactTurnId) : null;
        const compactAccepted = compactThreadRef && compactTurnRef
          && hostObservationsForConsumer().find((observation) =>
            observation.kind === "compaction-turn-accepted"
            && observation.thread_ref === compactThreadRef
            && observation.turn_ref === compactTurnRef);
        if (compactAccepted) {
          const lifecycle = ["turn/started", "turn/completed", "thread/tokenUsage/updated"]
            .includes(parsed.value.method);
          const item = ["item/started", "item/completed"].includes(parsed.value.method)
            && params?.item?.type === "contextCompaction";
          if (!lifecycle && !item) {
            emitClient(jsonRpcError(null, -32103, "Gateway compaction emitted an ungoverned event", {
              reason_codes: ["gateway.compaction-event-ungoverned"], authority_effect: "none",
            }));
            stop("gateway.compaction-event-ungoverned", true, false);
            return;
          }
          if (parsed.value.method === "turn/completed" && params.turn.status === "completed"
            && !hostObservationsForConsumer().some((observation) =>
              observation.kind === "compaction-item-completed"
              && observation.thread_ref === compactThreadRef
              && observation.turn_ref === compactTurnRef)) {
            emitClient(jsonRpcError(null, -32103, "Gateway compaction completed without its item", {
              reason_codes: ["gateway.compaction-item-missing"], authority_effect: "none",
            }));
            stop("gateway.compaction-item-missing", true, false);
            return;
          }
          emitClient(parsed.value);
          return;
        }
      }
      const stable = Object.hasOwn(parsed.value, "id") ? upstreamRequests.get(String(parsed.value.id)) : null;
      if (stable?.method === "turn/start" && backendAdapter.adapter_id === "codex-app-server/v1"
        && Object.hasOwn(parsed.value, "result") && !Object.hasOwn(parsed.value, "error")) {
        const turnId = parsed.value.result?.turn?.id;
        const responseThreadId = parsed.value.result?.turn?.threadId;
        if (!stable.thread_ref || !backendThreadOwned(metadata.consumer_id, stable.thread_ref)
          || !nonEmptyString(turnId) || (nonEmptyString(responseThreadId)
            && `backend-thread:${digestValue(responseThreadId)}` !== stable.thread_ref)) {
          emitClient(jsonRpcError(stable.client_id, -32103, "Gateway host turn-start acceptance is unbound", {
            reason_codes: ["gateway.turn-start-acceptance-unbound"], authority_effect: "none",
          }));
          stop("gateway.turn-start-acceptance-unbound", true, false);
          return;
        }
        const observation = {
          kind: "turn-start-accepted", thread_ref: stable.thread_ref,
          turn_ref: digestValue(turnId), request_key_digest: digestValue(stable.request_key),
          request_digest: stable.binding_digest, response_digest: digestValue(parsed.value),
        };
        observation.observation_digest = digestValue(observation);
        const recorded = onDurableEvent("host-observation", {observation});
        if (recorded?.ok !== true) {
          emitClient(jsonRpcError(stable.client_id, -32103, "Gateway host turn-start acceptance is not durable", {
            reason_codes: ["gateway.turn-start-acceptance-not-durable"], authority_effect: "none",
          }));
          stop("gateway.turn-start-acceptance-not-durable", true, false);
          return;
        }
      }
      if (stable?.method === "thread/compact/start" && backendAdapter.adapter_id === "codex-app-server/v1"
        && Object.hasOwn(parsed.value, "result") && !Object.hasOwn(parsed.value, "error")
        && (!isRecord(parsed.value.result) || Object.keys(parsed.value.result).length !== 0)) {
        emitClient(jsonRpcError(stable.client_id, -32103, "Gateway host compaction acknowledgement changed", {
          reason_codes: ["gateway.compaction-ack-shape-invalid"], authority_effect: "none",
        }));
        stop("gateway.compaction-ack-shape-invalid", true, false);
        return;
      }
      const wrapperMessage = stable ? {...parsed.value, id: stable.wrapper_id} : parsed.value;
      const actions = stable?.method === "thread/compact/start"
        ? {to_server: [], to_client: [wrapperMessage]}
        : await wrapper.processServerMessage(wrapperMessage);
      const generatedModelEntryReceipts = requireModelEntryReceipt
        ? verifiedModelEntryReceipts(actions, "generated") : null;
      if (requireModelEntryReceipt && generatedModelEntryReceipts === null) {
        emitClient(jsonRpcError(null, -32105, "Gateway generated model-entry receipt rejected", {
          reason_codes: ["gateway.model-entry-receipt-missing-or-invalid"], authority_effect: "none",
        }));
        stop("gateway.generated-model-entry-receipt-invalid", true, false);
        return;
      }
      if (stable?.generated) {
        stable.response = wrapperMessage;
        stable.response_digest = digestValue(wrapperMessage);
        const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.request_key,
          response: stable.response, response_digest: stable.response_digest});
        if (outcome?.ok !== true) { stopForUndurableDispatchOutcome(stable.client_id); return; }
        stable.status = "complete";
        upstreamRequests.delete(String(stable.upstream_id));
      }
      observeInitializationResponse(wrapperMessage);
      if (initialization.status === "complete") startWindowsBackendSandboxAttestation();
      for (const candidate of actions.to_server) {
        if (requireModelEntryReceipt && MODEL_ENTRY_METHODS.has(candidate.method)
          && candidate.method !== "turn/start") {
          emitClient(jsonRpcError(null, -32105,
            "Generated model-entry method has no objective receipt contract", {
              reason_codes: ["gateway.model-entry-method-unsupported"], authority_effect: "none",
            }));
          stop("gateway.generated-model-entry-method-unsupported", true, false);
          return;
        }
        if (restrictedHostConfig && MODEL_ENTRY_METHODS.has(candidate.method)
          && !restrictedHostConfigMatches(restrictedHostConfig)) {
          readyMcpRelayCatalogs.clear();
          emitClient(jsonRpcError(null, -32087, "Managed generated turn host configuration changed", {
            reason_codes: ["gateway.restricted-host-config-drift"], authority_effect: "none",
          }));
          stop("gateway.restricted-host-config-drift", true, false);
          return;
        }
        if (requireMcpCatalog && candidate.method === "turn/start") {
          const threadRef = nonEmptyString(candidate.params?.threadId)
            ? `backend-thread:${digestValue(candidate.params.threadId)}` : null;
          const checkedAt = threadRef ? readyMcpRelayCatalogs.get(threadRef) : null;
          if (threadRef) readyMcpRelayCatalogs.delete(threadRef);
          if (!checkedAt || Date.now() - checkedAt > MCP_RELAY_CATALOG_TTL_MS) {
            emitClient(jsonRpcError(null, -32086, "Managed generated turn needs a fresh MCP catalog preflight", {
              reason_codes: [mcpCatalogReason], authority_effect: "none",
            }));
            stop(mcpCatalogReason, true, false);
            return;
          }
        }
        if (turnIngressBlockedReason && MODEL_ENTRY_METHODS.has(candidate.method)) {
          emitClient(jsonRpcError(null, -32085, "Managed generated turn execution is paused", {
            reason_codes: [turnIngressBlockedReason], authority_effect: "none",
          }));
          stop("gateway.turn-ingress-paused", true, false);
          return;
        }
        if (backendAdapter.adapter_id === "codex-app-server/v1") {
          const parameterPosture = codexGatewayGeneratedParameterPosture(candidate,
            {allow_objective_context: requireModelEntryReceipt});
          if (parameterPosture.kind === "rejected") {
            emitClient(jsonRpcError(null, -32082, "ARE generated host parameters are not governed", {
              reason_codes: [parameterPosture.reason_code], authority_effect: "none",
            }));
            stop("gateway.generated-host-parameters-ungoverned", true, false);
            return;
          }
        }
        if (mutatesBackendThread(candidate.method) && unsettledThreadCreation()) {
          emitClient(jsonRpcError(null, -32093, "Gateway thread creation is unsettled", {
            reason_codes: ["gateway.server-mutation-creation-unsettled"], authority_effect: "none",
          }));
          stop("gateway.server-mutation-creation-unsettled", true, false);
          return;
        }
        if (mutatesBackendThread(candidate.method) && [...stableRequests.values()].some((entry) =>
          entry.status === "outcome-unknown" && mutatesBackendThread(entry.method))) {
          emitClient(jsonRpcError(null, -32093, "Gateway session has an unresolved backend mutation", {
            reason_codes: ["gateway.server-mutation-outcome-unknown"], authority_effect: "none",
          }));
          stop("gateway.server-mutation-outcome-unknown", true, false);
          return;
        }
        const claim = claimBackendThread(metadata.consumer_id, candidate);
        const binding = claim.ok && MODEL_ENTRY_METHODS.has(candidate.method)
          ? await authorizeBoundModelEntry(metadata.consumer_id, candidate) : {ok: true};
        if (claim.ok && binding.ok) continue;
        emitClient(jsonRpcError(null, claim.ok ? -32104 : -32102,
          claim.ok ? "Gateway conversation binding rejected generated model entry"
            : "Gateway backend-thread ownership rejected", {
          reason_codes: claim.ok ? binding.reason_codes : claim.reason_codes, authority_effect: "none",
        }));
        stop(claim.ok ? "gateway.conversation-binding-rejected" : "gateway.thread-ownership-rejected", true, false);
        return;
      }
      const forwardedServerMessages = [];
      for (const [actionIndex, candidate] of actions.to_server.entries()) {
        if (continuityMode !== ACKNOWLEDGED_CONTINUITY_MODE || !mutatesBackendThread(candidate.method)) {
          forwardedServerMessages.push(candidate);
          continue;
        }
        if (candidate.method !== "turn/start" || !Object.hasOwn(candidate, "id")
          || !nonEmptyString(candidate.params?.threadId)) {
          emitClient(jsonRpcError(null, -32093, "Gateway generated mutation has no durable dispatch contract", {
            reason_codes: ["gateway.generated-mutation-unsupported"], authority_effect: "none",
          }));
          stop("gateway.generated-mutation-unsupported", true, false);
          return;
        }
        const requestKey = `${GENERATED_REQUEST_PREFIX}${digestValue({trigger: digestValue(wrapperMessage),
          action_index: actionIndex, method: candidate.method, params: candidate.params})}`;
        if (stableRequests.has(requestKey)) {
          emitClient(jsonRpcError(null, -32093, "Gateway generated request was already dispatched", {
            reason_codes: ["gateway.generated-request-repeated"], authority_effect: "none",
          }));
          stop("gateway.generated-request-repeated", true, false);
          return;
        }
        const upstreamId = `are-gateway:${metadata.consumer_id}:${++upstreamRequestSequence}`;
        const threadRef = `backend-thread:${digestValue(candidate.params.threadId)}`;
        const bindingDigest = digestValue({method: candidate.method, params: candidate.params});
        const intent = onDurableEvent("dispatch-intent", {request_key: requestKey, method: candidate.method,
          binding_digest: bindingDigest, thread_ref: threadRef});
        if (intent?.ok !== true) {
          emitClient(jsonRpcError(null, -32093, "Gateway generated request intent is not durable", {
            reason_codes: ["gateway.generated-intent-not-durable"], authority_effect: "none",
          }));
          stop("gateway.generated-intent-not-durable", true, false);
          return;
        }
        const entry = {request_key: requestKey, method: candidate.method, binding_digest: bindingDigest,
          thread_ref: threadRef, wrapper_id: candidate.id, client_id: candidate.id, upstream_id: upstreamId,
          status: "pending", response: null, response_digest: null, generated: true};
        if (requireModelEntryReceipt) {
          const receipt = generatedModelEntryReceipts.get(digestValue(candidate));
          const proof = {receipt, forwarded_binding_digest: bindingDigest};
          const persisted = onDurableEvent("model-entry-verified", {request_key: requestKey, ...proof});
          if (persisted?.ok !== true) {
            emitClient(jsonRpcError(null, -32105, "Gateway generated model-entry proof is not durable", {
              reason_codes: ["gateway.model-entry-proof-not-durable"], authority_effect: "none",
            }));
            stop("gateway.generated-model-entry-proof-not-durable", true, false);
            return;
          }
          entry.model_entry_proof = proof;
        }
        stableRequests.set(requestKey, entry);
        upstreamRequests.set(String(upstreamId), entry);
        forwardedServerMessages.push({...candidate, id: upstreamId});
      }
      for (const message of forwardedServerMessages) {
        if (!forwardHostMessage(message)) { stopForDuplicateHostRequest(message.id); return; }
      }
      for (const message of actions.to_client) {
        if (message.method && Object.hasOwn(message, "id")) {
          if (serverRequests.has(String(message.id))) {
            emitClient(jsonRpcError(null, -32103, "Gateway server request ID is ambiguous", {
              reason_codes: ["gateway.server-request-id-reused"], authority_effect: "none",
            }));
            stop("gateway.server-request-id-reused", true, false);
            return;
          }
          const requestRecord = {request_id: message.id, method: message.method,
            request_digest: digestValue(message),
            thread_ref: nonEmptyString(message.params?.threadId)
              ? `backend-thread:${digestValue(message.params.threadId)}` : null};
          const persisted = onDurableEvent("server-request-observed", requestRecord);
          if (persisted?.ok !== true) {
            send(client, jsonRpcError(message.id, -32100, "Gateway server request is not durable", {reason_codes: ["gateway.server-request-not-durable"], authority_effect: "none"}));
            stop("gateway.server-request-not-durable");
            return;
          }
          serverRequests.set(String(message.id), {...requestRecord, status: "pending", response_digest: null});
        }
        if (stable && !stable.generated && Object.hasOwn(message, "id") && String(message.id) === String(stable.wrapper_id)) {
          const response = {...message, id: stable.client_id};
          stable.status = "complete";
          stable.response = {...message};
          stable.response_digest = digestValue(stable.response);
          const outcome = onDurableEvent("dispatch-outcome", {request_key: stable.request_key, response: stable.response, response_digest: stable.response_digest});
          if (outcome?.ok !== true) { stopForUndurableDispatchOutcome(stable.client_id); return; }
          upstreamRequests.delete(String(stable.upstream_id));
          emitClient(response, stable.request_key);
        } else emitClient(message);
      }
      if (stable?.method === "turn/start" && pendingPreAcceptanceEvents.some((entry) => entry.thread_ref === stable.thread_ref)) {
        const queued = pendingPreAcceptanceEvents.splice(0).filter((entry) => {
          if (entry.thread_ref !== stable.thread_ref) {
            pendingPreAcceptanceEvents.push(entry);
            return false;
          }
          return true;
        });
        const accepted = hostObservationsForConsumer().find((entry) => entry.kind === "turn-start-accepted"
          && entry.thread_ref === stable.thread_ref && entry.request_digest === stable.binding_digest
          && entry.request_key_digest === digestValue(stable.request_key));
        if (!accepted || queued.some((entry) => entry.turn_ref !== accepted.turn_ref)) {
          emitClient(jsonRpcError(null, -32103, "Gateway pending host turn event did not match accepted turn", {
            reason_codes: ["gateway.pre-acceptance-event-mismatch"], authority_effect: "none",
          }));
          stop("gateway.pre-acceptance-event-mismatch", true, false);
          return;
        }
        for (const entry of queued) {
          if (closed) return;
          await processServerLine(entry.line);
        }
      }
      if (stable?.method === "thread/compact/start"
        && pendingPreAcceptanceEvents.some((entry) => entry.thread_ref === stable.thread_ref)) {
        const queued = pendingPreAcceptanceEvents.splice(0).filter((entry) => {
          if (entry.thread_ref !== stable.thread_ref) {
            pendingPreAcceptanceEvents.push(entry);
            return false;
          }
          return true;
        });
        const first = queued.length > 0 ? parseJsonLine(queued[0].line) : null;
        if (!isRecord(stable.response?.result) || Object.keys(stable.response.result).length !== 0
          || first?.ok !== true || first.value.method !== "turn/started"
          || queued.some((entry) => entry.turn_ref !== queued[0].turn_ref)) {
          emitClient(jsonRpcError(null, -32103, "Gateway pre-ack compaction events are unbound", {
            reason_codes: ["gateway.compaction-pre-ack-event-unbound"], authority_effect: "none",
          }));
          stop("gateway.compaction-pre-ack-event-unbound", true, false);
          return;
        }
        for (const entry of queued) {
          if (closed) return;
          await processServerLine(entry.line);
        }
      }
  }

  const detachServerReader = createLineReader(child.stdout, (line) => {
    serverChain = serverChain.then(() => processServerLine(line)).catch((error) => {
      emitClient(jsonRpcError(null, -32603, "Gateway server-path failure", {message: error.message}));
      stop("gateway.server-path-failure", true, false);
    });
  }, () => stop("gateway.upstream-line-too-large"));

  child.stderr.on("data", (chunk) => onBackendStderr(chunk, metadata));
  child.on("exit", (code, signal) => {
    if (closed) return;
    emitClient(jsonRpcError(null, -32090, "Codex app-server backend exited", {code, signal, authority_effect: "none"}));
    stop("gateway.upstream-exited", false, false);
  });
  child.on("error", (error) => {
    if (closed) return;
    emitClient(jsonRpcError(null, -32091, "Codex app-server backend failed", {message: error.message, authority_effect: "none"}));
    stop("gateway.upstream-failed", false, false);
  });

  function attach(socket, continuity = null) {
    if (closed) return {ok: false, reason: closeReason ?? "gateway.session-closed"};
    if (client && !client.destroyed) return {ok: false, reason: "gateway.consumer-already-attached"};
    attachmentRequestKeys.clear();
    deliveredThisAttachment.clear();
    clientDeliveryReady = false;
    if (continuityMode === ACKNOWLEDGED_CONTINUITY_MODE) {
      if (!continuity || continuity.mode !== ACKNOWLEDGED_CONTINUITY_MODE) return {ok: false, reason: "gateway.resume-authentication-required"};
      if (reconnectCount > 0 && !sameSecret(continuity.resume_token, resumeToken)) return {ok: false, reason: "gateway.resume-authentication-failed"};
      if (continuity.last_acked_sequence > deliverySequence) return {ok: false, reason: "gateway.ack-sequence-invalid"};
      if (continuity.last_acked_sequence > acknowledgedThrough) {
        const persisted = onDurableEvent("delivery-acknowledged", {through_sequence: continuity.last_acked_sequence});
        if (persisted?.ok !== true) return {ok: false, reason: "gateway.acknowledgement-not-durable"};
      }
      acknowledgedThrough = Math.max(acknowledgedThrough, continuity.last_acked_sequence);
      for (const sequence of [...deliveries.keys()]) if (sequence <= acknowledgedThrough) deliveries.delete(sequence);
      for (const alias of continuity.request_aliases) {
        if (!stableRequests.has(alias.request_key)) return {ok: false, reason: "gateway.request-alias-not-found"};
      }
      for (const alias of continuity.request_aliases) {
        const rebound = rebindStableRequest(alias.request_key, alias.client_id);
        if (!rebound.ok) return rebound;
        attachmentRequestKeys.add(alias.request_key);
      }
    }
    client = socket;
    clearTimeout(lifecycleTimer);
    lifecycleTimer = null;
    detachedAt = null;
    touch();
    reconnectCount += 1;
    detachReader = createLineReader(socket, processClientLine, () => stop("gateway.client-line-too-large"));
    const detach = () => {
      if (client !== socket) return;
      detachReader?.();
      detachReader = null;
      client = null;
      detachedAt = Date.now();
      if (!reconnectEnabled) stop("gateway.client-disconnected");
      else scheduleLifecycleCheck(lifecycleReason() ? 1 : lifecycleDelay());
    };
    socket.once("close", detach);
    socket.once("error", detach);
    return {ok: true};
  }

  function flushBuffered() {
    if (!client || client.destroyed) return;
    clientDeliveryReady = true;
    if (continuityMode === ACKNOWLEDGED_CONTINUITY_MODE) {
      for (const delivery of [...deliveries.values()].sort((a, b) => a.sequence - b.sequence)) {
        if (delivery.request_key && !attachmentRequestKeys.has(delivery.request_key)) break;
        if (deliveredThisAttachment.has(delivery.sequence)) continue;
        client.write(jsonLine(delivery));
        deliveredThisAttachment.add(delivery.sequence);
      }
      return;
    }
    for (const encoded of buffered.splice(0)) client.write(encoded);
  }

  function stop(reason = "gateway.closed", killChild = true, destroyClient = true) {
    if (closed) return;
    closed = true;
    closeReason = reason;
    if (windowsBackendSandboxAttestation) windowsBackendSandboxStatus = "backend-closed";
    for (const [id, pending] of pendingSandboxProbeRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("gateway.windows-backend-closed-during-attestation"));
      pendingSandboxProbeRequests.delete(id);
    }
    clearTimeout(lifecycleTimer);
    lifecycleTimer = null;
    detachReader?.();
    detachServerReader();
    if (client && !client.destroyed) {
      if (destroyClient) client.destroy();
      else client.end();
    }
    client = null;
    if (killChild && typeof child.kill === "function") child.kill("SIGTERM");
    if (typeof wrapper.close === "function") wrapper.close();
    onClosed(metadata.consumer_id, api);
  }

  const api = Object.freeze({
    attach,
    flushBuffered,
    initializationReceipt,
    resumeToken: () => resumeToken,
    stop,
    metadata: freezeResult(metadata),
    child,
    windowsBackendSandboxStatus: () => freezeResult({status: windowsBackendSandboxStatus,
      reason: windowsBackendSandboxReason, backend_pid: child.pid ?? null, authority_effect: "none"}),
    observeAdapter: () => freezeResult({
      attached: Boolean(client && !client.destroyed),
      backend_running: !closed,
      initialized: !closed && initialization.status === "complete",
      windows_backend_sandbox_status: windowsBackendSandboxStatus,
    }),
    observeReasoningThreads: () => wrapper.observeReasoningThreads?.() ?? [],
    observeMcpRelayChecks: () => freezeResult([...lastMcpRelayChecks].map(([thread_ref, check]) => ({
      thread_ref, ...check,
    }))),
    observeSteerContinuity: () => {
      const degraded = wrapper.inspectState?.()?.degraded_steer_threads;
      return Array.isArray(degraded) ? degraded.length : null;
    },
    observeDecisions: () => wrapper.observeDecisions?.() ?? [],
    inspect: () => freezeResult({
      consumer_id: metadata.consumer_id,
      lane: metadata.lane,
      backend_capabilities: backendCapabilities,
      attached: Boolean(client && !client.destroyed),
      buffered_messages: continuityMode === ACKNOWLEDGED_CONTINUITY_MODE ? deliveries.size : buffered.length,
      continuity_mode: continuityMode,
      resume_token_digest: resumeTokenDigest,
      delivery_sequence: deliverySequence,
      acknowledged_through: acknowledgedThrough,
      unacknowledged_deliveries: deliveries.size,
      stable_requests: [...stableRequests.values()].map((entry) => ({request_key: entry.request_key, method: entry.method, binding_digest: entry.binding_digest, thread_ref: entry.thread_ref, status: entry.status, response_digest: entry.response_digest})).sort((a, b) => a.request_key.localeCompare(b.request_key)),
      upstream_request_count: upstreamRequestSequence,
      deduplicated_request_count: deduplicatedRequestCount,
      pending_server_requests: [...serverRequests.entries()].filter(([, entry]) => entry.status === "pending").map(([id]) => id).sort(),
      forwarded_server_responses: [...serverRequests.values()].filter((entry) => ["forwarded", "resolved-forwarded"].includes(entry.status)).length,
      deduplicated_server_response_count: deduplicatedServerResponseCount,
      reconnect_count: reconnectCount,
      initialization_status: initialization.status,
      windows_backend_sandbox: {status: windowsBackendSandboxStatus,
        reason: windowsBackendSandboxReason, backend_pid: child.pid ?? null},
      initialization_binding_digest: initialization.binding_digest,
      initialization_forward_count: initializationForwardCount,
      initialization_replay_count: initializationReplayCount,
      pending_initialization_aliases: pendingInitializationAliases.size,
      lifecycle: {
        last_activity_at: new Date(lastActivityAt).toISOString(),
        detached_at: detachedAt === null ? null : new Date(detachedAt).toISOString(),
        detach_timeout_ms: detachTimeoutMs,
        idle_timeout_ms: idleTimeoutMs,
        retained_protocol_bytes: retainedProtocolBytes(),
        max_retained_bytes: maxRetainedBytes,
        reasoning_log_bytes: reasoningLogBytes(),
        max_reasoning_log_bytes: maxReasoningLogBytes,
        eviction_attempt_count: evictionAttemptCount,
        last_eviction_block: lastEvictionBlock,
        expiration_receipt: expirationReceipt,
      },
      closed,
      close_reason: closeReason,
      wrapper_state: typeof wrapper.inspectState === "function" ? wrapper.inspectState() : null,
      authority_effect: "none",
    }),
  });
  return api;
}

export function createPersistentGateway(options = {}) {
  const listenPath = resolveGatewayIpcPath(options.listen_path);
  if (typeof options.wrapper_factory !== "function") throw new TypeError("A wrapper_factory is required.");
  const observationListenPath = options.observation_listen_path === undefined || options.observation_listen_path === null
    ? null : resolveGatewayIpcPath(options.observation_listen_path);
  const observationTcpPort = options.observation_tcp_port ?? null;
  const observationToken = options.observation_token ?? null;
  const connectionToken = options.connection_token ?? null;
  const hostedInputKey = options.hosted_input_attestation_key ?? null;
  const hostedInputConsumer = options.hosted_input_consumer_id ?? null;
  if ((hostedInputKey === null) !== (hostedInputConsumer === null)
    || (hostedInputKey !== null && (!validHostedInputAttestationKey(hostedInputKey)
      || !nonEmptyString(hostedInputConsumer)))) {
    throw new TypeError("A hosted input attestation key requires its consumer identity.");
  }
  if (process.platform === "win32" && (!nonEmptyString(connectionToken) || Buffer.byteLength(connectionToken) < 32)) {
    throw new TypeError("A Windows gateway connection token of at least 32 bytes is required.");
  }
  if (connectionToken !== null && (!nonEmptyString(connectionToken) || Buffer.byteLength(connectionToken) < 32)) {
    throw new TypeError("A gateway connection token of at least 32 bytes is required.");
  }
  if (observationTcpPort !== null && (!Number.isSafeInteger(observationTcpPort)
    || observationTcpPort < 0 || observationTcpPort > 65535 || observationListenPath !== null)) {
    throw new TypeError("An observation TCP port must be a valid, exclusive loopback port.");
  }
  if (observationListenPath !== null) {
    if (observationListenPath === listenPath) throw new TypeError("A separate observation listen path is required.");
    if (!nonEmptyString(observationToken) || Buffer.byteLength(observationToken) < 32) throw new TypeError("An observation token of at least 32 bytes is required.");
  } else if (observationTcpPort !== null) {
    if (!nonEmptyString(observationToken) || Buffer.byteLength(observationToken) < 32) throw new TypeError("An observation token of at least 32 bytes is required.");
  } else if (observationToken !== null) throw new TypeError("An observation token requires an observation endpoint.");
  const backendAdapter = options.backend_adapter ?? createCodexGatewayBackendAdapter();
  const backendAdapterValidation = validateGatewayBackendAdapter(backendAdapter);
  if (!backendAdapterValidation.ok) throw new TypeError(`Invalid gateway backend adapter: ${backendAdapterValidation.reason_codes.join(",")}`);
  const desktopBackendBinding = options.desktop_backend_binding ?? null;
  if (desktopBackendBinding !== null && (backendAdapter.adapter_id !== "codex-app-server/v1"
    || (options.backend?.mode ?? "direct-stdio") !== "direct-stdio"
    || !isRecord(desktopBackendBinding)
    || !/^[0-9a-f]{64}$/.test(desktopBackendBinding.binary_sha256 ?? "")
    || !["desktop-wsl-base/v1", "desktop-wsl-app-tools/v1"].includes(desktopBackendBinding.host_profile))) {
    throw new TypeError("A desktop backend binding requires a pinned direct Codex App Server.");
  }
  const turnIngressBlockedReason = options.turn_ingress_blocked_reason ?? null;
  if (options.managed_model_wire_guard_expected !== undefined
    && typeof options.managed_model_wire_guard_expected !== "boolean") {
    throw new TypeError("managed_model_wire_guard_expected must be a boolean.");
  }
  const managedModelWireGuardExpected = options.managed_model_wire_guard_expected === true;
  let modelWireGuardHeartbeatAt = null;
  const requireMcpHookRelay = options.require_mcp_hook_relay === true;
  const requireRestrictedMcpCatalog = options.require_restricted_mcp_catalog === true;
  const allowHostedEffectTool = options.allow_hosted_effect_tool === true;
  const windowsBackendSandboxAttestation = options.windows_backend_sandbox_attestation ?? null;
  const restrictedHostConfig = options.restricted_host_config === undefined
    ? null : isRecord(options.restricted_host_config)
      ? Object.freeze({...options.restricted_host_config}) : options.restricted_host_config;
  if (options.require_mcp_hook_relay !== undefined && typeof options.require_mcp_hook_relay !== "boolean") {
    throw new TypeError("require_mcp_hook_relay must be a boolean.");
  }
  if (options.allow_hosted_effect_tool !== undefined && typeof options.allow_hosted_effect_tool !== "boolean") {
    throw new TypeError("allow_hosted_effect_tool must be a boolean.");
  }
  if (allowHostedEffectTool && backendAdapter.adapter_id !== "codex-app-server/v1") {
    throw new TypeError("A hosted effect tool requires the Codex adapter.");
  }
  if (windowsBackendSandboxAttestation !== null
    && (process.platform !== "win32" || backendAdapter.adapter_id !== "codex-app-server/v1"
      || (options.backend?.mode ?? "direct-stdio") !== "direct-stdio"
      || !requireRestrictedMcpCatalog
      || !["elevated", "unelevated"].includes(windowsBackendSandboxAttestation.mode)
      || !nonEmptyString(windowsBackendSandboxAttestation.workspace_root)
      || !nonEmptyString(windowsBackendSandboxAttestation.node_command))) {
    throw new TypeError("A Windows backend sandbox attestation needs the native Codex adapter and exact probe inputs.");
  }
  if (requireMcpHookRelay && backendAdapter.adapter_id !== "codex-app-server/v1") {
    throw new TypeError("A hosted MCP hook relay preflight requires the Codex adapter.");
  }
  if (options.require_restricted_mcp_catalog !== undefined
    && typeof options.require_restricted_mcp_catalog !== "boolean") {
    throw new TypeError("require_restricted_mcp_catalog must be a boolean.");
  }
  if (requireRestrictedMcpCatalog && backendAdapter.adapter_id !== "codex-app-server/v1") {
    throw new TypeError("A restricted MCP catalog preflight requires the Codex adapter.");
  }
  if ((requireRestrictedMcpCatalog && (!isRecord(restrictedHostConfig)
    || Object.keys(restrictedHostConfig).sort().join(",") !== "codex_home,sha256"
    || !nonEmptyString(restrictedHostConfig.codex_home)
    || !/^[0-9a-f]{64}$/.test(restrictedHostConfig.sha256 ?? "")))
    || (!requireRestrictedMcpCatalog && restrictedHostConfig !== null)) {
    throw new TypeError("A restricted MCP catalog requires an exact host config binding.");
  }
  if (restrictedHostConfig && !restrictedHostConfigMatches(restrictedHostConfig)) {
    throw new TypeError("gateway.restricted-host-config-drift");
  }
  if (turnIngressBlockedReason !== null && (turnIngressBlockedReason !== "windows-client.hook-boundary-unverified"
    || backendAdapter.adapter_id !== "codex-app-server/v1")) {
    throw new TypeError("A managed turn-ingress pause requires the exact Codex Windows hook-boundary reason.");
  }
  const expectedCodexVersion = options.expected_codex_version ?? null;
  if (expectedCodexVersion !== null && (backendAdapter.adapter_id !== "codex-app-server/v1"
    || !validExpectedCodexVersion(expectedCodexVersion))) {
    throw new TypeError("A pinned Codex backend version requires the Codex adapter and a canonical version string.");
  }
  const backendCapabilities = gatewayBackendCapabilities(backendAdapter, options.backend ?? {});
  const maxClients = options.max_clients ?? 8;
  const maxBufferedMessages = options.max_buffered_messages_per_client ?? 256;
  const detachTimeoutMs = options.detach_timeout_ms ?? 300_000;
  const idleTimeoutMs = options.idle_timeout_ms ?? 1_800_000;
  const maxRetainedBytes = options.max_retained_bytes_per_session ?? 4 * 1024 * 1024;
  const maxReasoningLogBytes = options.max_reasoning_log_bytes_per_session ?? 64 * 1024 * 1024;
  const expirationTombstoneTtlMs = options.expiration_tombstone_ttl_ms ?? 3_600_000;
  const evictionRetryMs = options.eviction_retry_ms ?? 1_000;
  if (!Number.isSafeInteger(maxClients) || maxClients < 1) throw new TypeError("max_clients must be a positive safe integer.");
  if (!Number.isSafeInteger(maxBufferedMessages) || maxBufferedMessages < 1) throw new TypeError("max_buffered_messages_per_client must be a positive safe integer.");
  for (const [name, value] of [["detach_timeout_ms", detachTimeoutMs], ["idle_timeout_ms", idleTimeoutMs]]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative safe integer.`);
  }
  for (const [name, value] of [["max_retained_bytes_per_session", maxRetainedBytes], ["max_reasoning_log_bytes_per_session", maxReasoningLogBytes], ["expiration_tombstone_ttl_ms", expirationTombstoneTtlMs], ["eviction_retry_ms", evictionRetryMs]]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive safe integer.`);
  }
  const runtimeEpochId = options.runtime_epoch_id ?? `are-gateway-runtime:${randomUUID()}`;
  const reconnectEnabled = options.reconnect !== false;
  const backendProcessGuard = options.backend_process_guard ?? "off";
  if (!["off", "required", "acknowledged-only"].includes(backendProcessGuard)) throw new TypeError("backend_process_guard must be off, required, or acknowledged-only.");
  if (backendProcessGuard !== "off" && (backendAdapter.adapter_id !== "codex-app-server/v1"
    || (options.backend?.mode ?? "direct-stdio") !== "direct-stdio"
    || !nonEmptyString(options.session_store_path) || options.session_store)) {
    throw new TypeError("A required backend process guard needs Codex direct stdio and an owned durable file session store.");
  }
  const ownsSessionStore = !options.session_store;
  const sessionStore = options.session_store ?? (nonEmptyString(options.session_store_path)
    ? createFileGatewaySessionStore({path: options.session_store_path, store_id: options.session_store_id ?? "are-codex-gateway-sessions:v1"})
    : createMemoryGatewaySessionStore({store_id: options.session_store_id ?? `are-codex-gateway-sessions:${runtimeEpochId}`}));
  const conversationBindingGate = options.conversation_binding_gate ?? null;
  if (conversationBindingGate !== null && (backendAdapter.adapter_id !== "codex-app-server/v1"
    || !sessionStore.inspect()?.durability?.startsWith("append-only-file-fsync")
    || !isRecord(conversationBindingGate)
    || Object.keys(conversationBindingGate).sort().join(",")
      !== "host_context_for,ttl_ms,verify_host_context,verify_release"
    || [conversationBindingGate.host_context_for, conversationBindingGate.verify_host_context,
      conversationBindingGate.verify_release].some((value) => typeof value !== "function")
    || !Number.isSafeInteger(conversationBindingGate.ttl_ms)
    || conversationBindingGate.ttl_ms < 1 || conversationBindingGate.ttl_ms > 86_400_000)) {
    if (ownsSessionStore) sessionStore.close();
    throw new TypeError("A conversation binding gate requires the Codex adapter, durable gateway store and trusted Host callbacks.");
  }
  if (options.require_model_entry_receipt !== undefined
    && typeof options.require_model_entry_receipt !== "boolean") {
    if (ownsSessionStore) sessionStore.close();
    throw new TypeError("require_model_entry_receipt must be a boolean.");
  }
  const requireModelEntryReceipt = options.require_model_entry_receipt === true;
  if (requireModelEntryReceipt && !conversationBindingGate) {
    if (ownsSessionStore) sessionStore.close();
    throw new TypeError("A model-entry receipt gate requires the durable conversation binding gate.");
  }
  const sessions = new Map();
  const usedReceiptWrappers = new WeakSet();
  const ownedBackends = new Set();
  const expiredSessions = new Map();
  const authorizeClient = options.authorize_client ?? (() => true);
  const backendThreadOwned = (consumerId, threadRef) => sessionStore.getSession(consumerId)?.thread_refs?.includes(threadRef) === true;
  async function authorizeBoundModelEntry(consumerId, message) {
    if (!conversationBindingGate) return {ok: true};
    const threadId = scopedThreadId(message);
    if (!nonEmptyString(threadId) || threadId !== threadId.trim()
      || Buffer.byteLength(threadId, "utf8") > 256) {
      return {ok: false, reason_codes: ["binding.native-thread-required"]};
    }
    const threadRef = digestValue(threadId);
    try {
      const contract = createGatewayBackedConversationBindingContract({session_store: sessionStore,
        consumer_id: consumerId, verify_host_context: conversationBindingGate.verify_host_context,
        verify_release: conversationBindingGate.verify_release});
      const matches = contract.events().filter((event) => event.kind === "bound"
        && event.binding.backend_adapter_id === backendAdapter.adapter_id
        && event.binding.backend_thread_ref === threadRef);
      if (matches.length !== 1) return {ok: false, reason_codes: ["binding.unowned"]};
      const hostContext = await conversationBindingGate.host_context_for({consumer_id: consumerId,
        backend_thread_ref: threadRef});
      await contract.authorizeTurn({binding_id: matches[0].binding.binding_id, host_context: hostContext});
      return {ok: true};
    } catch (error) {
      return {ok: false, reason_codes: [BINDING_ADMISSION_REASONS.has(error?.message)
        ? error.message : "binding.verification-failed"]};
    }
  }
  async function bindNativeThreadCreation(consumerId, acceptance) {
    if (!conversationBindingGate) return {ok: true};
    const threadRef = digestValue(acceptance.thread_id);
    try {
      const hostContext = await conversationBindingGate.host_context_for({consumer_id: consumerId,
        backend_thread_ref: threadRef, creation_acceptance: freezeResult(acceptance)});
      const assertion = await conversationBindingGate.verify_host_context(hostContext);
      if (!isRecord(assertion) || assertion.backend_adapter_id !== backendAdapter.adapter_id
        || assertion.backend_thread_ref !== threadRef
        || assertion.creation_receipt_digest !== acceptance.acceptance_digest) {
        return {ok: false, reason_codes: ["binding.creation-identity-mismatch"]};
      }
      const verifier = async (context) => {
        const current = await conversationBindingGate.verify_host_context(context);
        if (!isRecord(current) || digestValue(current) !== digestValue(assertion)) {
          throw new Error("binding.host-identity-mismatch");
        }
        return current;
      };
      const contract = createGatewayBackedConversationBindingContract({session_store: sessionStore,
        consumer_id: consumerId, verify_host_context: verifier,
        verify_release: conversationBindingGate.verify_release});
      const bound = await contract.bindNewThread({host_context: hostContext,
        ttl_ms: conversationBindingGate.ttl_ms});
      await contract.activate({binding_id: bound.binding_id, host_context: hostContext});
      return {ok: true};
    } catch (error) {
      return {ok: false, reason_codes: [BINDING_ADMISSION_REASONS.has(error?.message)
        ? error.message : "binding.creation-verification-failed"]};
    }
  }
  function precheckBackendThread(consumerId, message, {createdByGateway = false} = {}) {
    const method = message?.method;
    const codexBackend = backendAdapter.adapter_id === "codex-app-server/v1";
    if (conversationBindingGate && method === "thread/fork") {
      return {ok: false, reason_codes: ["binding.fork-unsupported"]};
    }
    if (codexBackend && CODEX_UNSCOPED_THREAD_READS.has(method)) {
      return {ok: false, reason_codes: ["gateway.unscoped-thread-read-unsupported"]};
    }
    if (codexBackend && method === "thread/start") return {ok: true};
    if (codexBackend ? !CODEX_SCOPED_THREAD_METHODS.has(method)
      : !TURN_WRITER_METHODS.has(method) && !(typeof method === "string" && method.startsWith("thread/")
        && !READ_ONLY_THREAD_METHODS.has(method) && method !== "thread/start")) return {ok: true};
    const threadId = scopedThreadId(message);
    if (!nonEmptyString(threadId) || threadId !== threadId.trim() || Buffer.byteLength(threadId, "utf8") > 256) {
      return {ok: false, reason_codes: ["gateway.thread-id-required"]};
    }
    if (method === "turn/steer" && !nonEmptyString(message.params.expectedTurnId)) {
      return {ok: false, reason_codes: ["gateway.steer-expected-turn-required"]};
    }
    const threadRef = `backend-thread:${digestValue(threadId)}`;
    const owner = sessionStore.inspect().sessions.find((session) => session.thread_refs.includes(threadRef))?.consumer_id;
    if (owner && owner !== consumerId) return {ok: false, reason_codes: ["gateway.thread-owned-by-other-consumer"]};
    if (backendAdapter.thread_ownership === "gateway-created" && !createdByGateway && owner !== consumerId) {
      return {ok: false, reason_codes: ["gateway.thread-unowned"]};
    }
    return {ok: true, thread_ref: threadRef, already_owned: owner === consumerId};
  }
  function claimBackendThread(consumerId, message, options = {}) {
    const checked = precheckBackendThread(consumerId, message, options);
    if (!checked.ok || !checked.thread_ref || checked.already_owned) return checked;
    const threadRef = checked.thread_ref;
    const bound = sessionStore.append({event_kind: "thread-bound", consumer_id: consumerId, content: {thread_ref: threadRef}});
    if (!bound.ok) return {ok: false, reason_codes: bound.reason_codes?.includes("gateway.session-store-thread-owner-conflict")
      ? ["gateway.thread-owned-by-other-consumer"] : ["gateway.thread-binding-not-durable"]};
    return {ok: true};
  }
  const server = createServer();
  const observationServer = observationListenPath !== null || observationTcpPort !== null ? createServer((socket) => {
    let buffer = "";
    socket.setTimeout(2000, () => socket.destroy());
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (Buffer.byteLength(buffer) > 4096) { socket.destroy(); return; }
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      socket.removeAllListeners("data");
      let request;
      try { request = JSON.parse(buffer.slice(0, newline)); } catch { socket.destroy(); return; }
      if (!isRecord(request) || ![ADAPTER_OBSERVATION_REQUEST_SCHEMA, THREAD_OBSERVATION_REQUEST_SCHEMA, DECISION_OBSERVATION_REQUEST_SCHEMA].includes(request.schema_version)
        || !nonEmptyString(request.nonce) || !/^[A-Za-z0-9_-]{22,128}$/.test(request.nonce)
        || !sameSecret(request.token, observationToken)) { socket.destroy(); return; }
      if (request.schema_version === THREAD_OBSERVATION_REQUEST_SCHEMA
        && (!Number.isSafeInteger(request.page_offset ?? 0) || (request.page_offset ?? 0) < 0 || (request.page_offset ?? 0) % 32 !== 0
          || ((request.expected_snapshot_digest ?? null) !== null && !/^[0-9a-f]{64}$/.test(request.expected_snapshot_digest)))) {
        socket.destroy(); return;
      }
      let observation;
      try {
        observation = request.schema_version === THREAD_OBSERVATION_REQUEST_SCHEMA
          ? api.observeReasoningThreads(Date.now(), {page_offset: request.page_offset ?? 0,
            expected_snapshot_digest: request.expected_snapshot_digest ?? undefined})
          : request.schema_version === DECISION_OBSERVATION_REQUEST_SCHEMA ? api.observeDecisions() : api.observeAdapters();
      } catch (error) {
        if (request.schema_version !== THREAD_OBSERVATION_REQUEST_SCHEMA) { socket.destroy(); return; }
        socket.end(jsonLine({schema_version: THREAD_OBSERVATION_RESPONSE_SCHEMA, nonce: request.nonce,
          error: error?.message === "thread.observation-source-changed" ? "thread.observation-source-changed" : "thread.observation-invalid-page",
          authority_effect: "none"}));
        return;
      }
      socket.end(jsonLine({
        schema_version: request.schema_version === THREAD_OBSERVATION_REQUEST_SCHEMA ? THREAD_OBSERVATION_RESPONSE_SCHEMA
          : request.schema_version === DECISION_OBSERVATION_REQUEST_SCHEMA ? DECISION_OBSERVATION_RESPONSE_SCHEMA : ADAPTER_OBSERVATION_RESPONSE_SCHEMA,
        nonce: request.nonce,
        observation,
        authority_effect: "none",
      }));
    });
  }) : null;
  let started = false;
  let shuttingDown = false;

  function closeSession(consumerId, session) {
    if (sessions.get(consumerId) === session) sessions.delete(consumerId);
  }

  function recordExpiration(consumerId, session, receipt) {
    expiredSessions.set(consumerId, {session, receipt, retain_until: Date.now() + expirationTombstoneTtlMs});
    sessionStore.append({event_kind: "session-expired", consumer_id: consumerId, content: {expiration: receipt}});
  }

  function pruneExpirations() {
    const now = Date.now();
    for (const [consumerId, entry] of expiredSessions) if (entry.retain_until <= now) expiredSessions.delete(consumerId);
  }

  server.on("connection", (socket) => {
    if (shuttingDown) { socket.destroy(); return; }
    let buffer = "";
    const onData = (chunk) => {
      if (shuttingDown) { socket.destroy(); return; }
      buffer += chunk.toString("utf8");
      if (buffer.length > 16384) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.handshake-too-large", authority_effect: "none"});
        socket.end();
        return;
      }
      const index = buffer.indexOf("\n");
      if (index < 0) return;
      socket.off("data", onData);
      const line = buffer.slice(0, index);
      const remainder = buffer.slice(index + 1);
      let parsed;
      try { parsed = JSON.parse(line); } catch { parsed = null; }
      const handshake = validateHandshake(parsed);
      if (!handshake.ok || (connectionToken !== null && !sameSecret(parsed?.connection_token, connectionToken)) || authorizeClient(handshake.value ?? parsed) !== true) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: handshake.ok ? "gateway.client-not-authorized" : handshake.reason, authority_effect: "none"});
        socket.end();
        return;
      }
      const metadata = handshake.value;
      if (conversationBindingGate && metadata.continuity?.mode !== ACKNOWLEDGED_CONTINUITY_MODE) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
          reason: "binding.acknowledged-continuity-required", authority_effect: "none"});
        socket.end();
        return;
      }
      if (metadata.expected_backend_adapter_id !== null
        && metadata.expected_backend_adapter_id !== backendAdapter.adapter_id) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
          reason: "gateway.backend-adapter-mismatch", authority_effect: "none"});
        socket.end();
        return;
      }
      pruneExpirations();
      let session = sessions.get(metadata.consumer_id);
      const durableSession = sessionStore.getSession(metadata.consumer_id);
      if (durableSession?.status === "faulted") {
        const authenticated = metadata.continuity?.resume_token
          && digestValue(metadata.continuity.resume_token) === durableSession.resume_token_digest;
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
          reason: authenticated ? "gateway.session-faulted" : "gateway.resume-authentication-required",
          ...(authenticated ? {fault_digest: durableSession.fault.fault_digest,
            fault_reason_code: durableSession.fault.reason_code} : {}), authority_effect: "none"});
        socket.end();
        return;
      }
      if (durableSession?.pending_history_audits?.length > 0) {
        const authenticated = metadata.continuity?.resume_token
          && digestValue(metadata.continuity.resume_token) === durableSession.resume_token_digest;
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
          reason: authenticated ? "gateway.history-audit-incomplete" : "gateway.resume-authentication-required",
          authority_effect: "none"});
        socket.end();
        return;
      }
      if (durableSession && durableSession.status !== "missing"
        && durableSession.backend_adapter_id !== backendAdapter.adapter_id) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
          reason: durableSession.backend_adapter_id === null ? "gateway.backend-adapter-unbound"
            : "gateway.backend-adapter-mismatch", authority_effect: "none"});
        socket.end();
        return;
      }
      if (!session && durableSession?.status === "active" && durableSession.lane !== metadata.lane) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.consumer-lane-mismatch", authority_effect: "none"});
        socket.end();
        return;
      }
      if (session && session.metadata.lane !== metadata.lane) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.consumer-lane-mismatch", authority_effect: "none"});
        socket.end();
        return;
      }
      if (!session) {
        const guardThisSession = backendProcessGuard === "required"
          || (backendProcessGuard === "acknowledged-only" && metadata.continuity?.mode === ACKNOWLEDGED_CONTINUITY_MODE);
        if (backendProcessGuard === "required" && metadata.continuity?.mode !== ACKNOWLEDGED_CONTINUITY_MODE) {
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
            reason: "gateway.backend-process-guard-requires-continuity", authority_effect: "none"});
          socket.end();
          return;
        }
        if (metadata.continuity?.resume_token) {
          const expired = expiredSessions.get(metadata.consumer_id);
          const tokenDigest = digestValue(metadata.continuity.resume_token);
          const durableExpired = durableSession?.status === "expired" && tokenDigest === durableSession.resume_token_digest;
          const authenticatedExpiration = (expired && tokenDigest === expired.receipt.resume_token_digest) || durableExpired;
          if (authenticatedExpiration) {
            send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.session-expired", expiration: expired?.receipt ?? durableSession.expiration, authority_effect: "none"});
            socket.end();
            return;
          }
          if (durableSession?.status !== "active" || tokenDigest !== durableSession.resume_token_digest) {
            send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.resume-session-missing", authority_effect: "none"});
            socket.end();
            return;
          }
          if (guardThisSession) {
            const identity = durableSession.backend_process_identity;
            const processState = identity?.host_name === hostname()
              ? backendProcessState(identity) : null;
            const reason = !identity ? "gateway.backend-process-identity-missing"
              : identity.host_name !== hostname() ? "gateway.backend-process-host-unknown"
                : processState === "alive" ? "gateway.prior-backend-process-live"
                  : processState === "unknown" ? "gateway.prior-backend-process-unknown" : null;
            if (reason) {
              send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason, authority_effect: "none"});
              socket.end();
              return;
            }
          }
        } else if (durableSession?.status === "active") {
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.resume-authentication-required", authority_effect: "none"});
          socket.end();
          return;
        }
        if (sessions.size >= maxClients) {
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.max-clients-reached", authority_effect: "none"});
          socket.end();
          return;
        }
        let wrapper;
        try {
          wrapper = options.wrapper_factory(metadata);
          if (requireModelEntryReceipt && (!isCodexAppServerWrapper(wrapper)
            || usedReceiptWrappers.has(wrapper))) {
            throw new TypeError("gateway.model-entry-wrapper-untrusted");
          }
          session = createSession({
            metadata,
            wrapper,
            backend: options.backend ?? {},
            backendAdapter,
            backendCapabilities,
            expectedCodexVersion,
            desktopGlobalNotifications: metadata.consumer_id === "codex:desktop-wsl"
              && metadata.lane === "interaction-bound"
              && desktopBackendBinding !== null && expectedCodexVersion !== null,
            turnIngressBlockedReason,
            authorizeBoundModelEntry,
            bindNativeThreadCreation,
            requireBoundNativeCreation: conversationBindingGate !== null,
            requireModelEntryReceipt,
            requireMcpHookRelay,
            requireRestrictedMcpCatalog,
            allowHostedEffectTool,
            restrictedHostConfig,
            windowsBackendSandboxAttestation,
            hostedInputKey,
            hostedInputConsumer,
            spawnImpl: options.spawn_impl,
            WebSocketImpl: options.websocket_impl,
            maxBufferedMessages,
            reconnectEnabled,
            continuityMode: metadata.continuity?.mode ?? null,
            detachTimeoutMs,
            idleTimeoutMs,
            maxRetainedBytes,
            maxReasoningLogBytes,
            evictionRetryMs,
            onBackendStderr: options.on_backend_stderr ?? (() => {}),
            onClosed: closeSession,
            onExpired: recordExpiration,
            onDurableEvent: (eventKind, content) => sessionStore.append({event_kind: eventKind, consumer_id: metadata.consumer_id, content}),
            hostObservationsForConsumer: () => sessionStore.getSession(metadata.consumer_id)?.host_observations ?? [],
            getStoredSession: () => sessionStore.getSession(metadata.consumer_id),
            claimBackendThread,
            precheckBackendThread,
            backendThreadOwned,
            initialResumeToken: durableSession?.status === "active" ? metadata.continuity?.resume_token ?? null : null,
            initialStableRequests: durableSession?.status === "active" ? durableSession.requests : [],
            initialDeliveries: durableSession?.status === "active" ? durableSession.deliveries : [],
            initialAcknowledgedThrough: durableSession?.status === "active" ? durableSession.acknowledged_through : 0,
            initialDeliverySequence: durableSession?.status === "active" ? durableSession.delivery_sequence : 0,
            initialServerRequests: durableSession?.status === "active" ? durableSession.server_requests : [],
          });
          if (requireModelEntryReceipt) usedReceiptWrappers.add(wrapper);
        } catch (error) {
          if (wrapper && !usedReceiptWrappers.has(wrapper)) {
            try { wrapper.close?.(); } catch { /* Startup failure remains authoritative. */ }
          }
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.session-start-failed", detail: error.message, authority_effect: "none"});
          socket.end();
          return;
        }
        if (!ownedBackendExited(session.child)) {
          ownedBackends.add(session.child);
          session.child.once("exit", () => ownedBackends.delete(session.child));
        }
        const backendPid = session.child?.pid;
        const backendBirthRef = guardThisSession && backendProcessBirthSupported()
          ? backendProcessBirthRef(backendPid) : null;
        const backendProcessIdentity = guardThisSession
          ? {host_name: hostname(), process_id: backendPid,
            ...(backendBirthRef ? {birth_ref: backendBirthRef} : {})} : null;
        if (guardThisSession && (!Number.isSafeInteger(backendPid)
          || backendPid < 1 || (backendProcessBirthSupported() && !backendBirthRef))) {
          session.stop("gateway.backend-process-identity-unavailable");
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false,
            reason: "gateway.backend-process-identity-unavailable", authority_effect: "none"});
          socket.end();
          return;
        }
        sessions.set(metadata.consumer_id, session);
        const resumable = nonEmptyString(session.inspect().resume_token_digest);
        const persisted = resumable
          ? sessionStore.append({event_kind: "session-started", consumer_id: metadata.consumer_id, content: {lane: metadata.lane,
            backend_adapter_id: backendAdapter.adapter_id, resume_token_digest: session.inspect().resume_token_digest,
            ...(backendProcessIdentity ? {backend_process_identity: backendProcessIdentity} : {}),
            recovered: durableSession?.status === "active"}})
          : {ok: true};
        if (!persisted.ok) {
          session.stop("gateway.session-start-not-durable");
          send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: "gateway.session-start-not-durable", detail: persisted.reason_codes?.join(","), authority_effect: "none"});
          socket.end();
          return;
        }
      }
      const attached = session.attach(socket, metadata.continuity);
      if (!attached.ok) {
        send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: false, reason: attached.reason, authority_effect: "none"});
        socket.end();
        return;
      }
      const state = session.inspect();
      send(socket, {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true, consumer_id: metadata.consumer_id, lane: metadata.lane,
        backend_adapter_id: backendAdapter.adapter_id, runtime_epoch_id: runtimeEpochId,
        ...(desktopBackendBinding && metadata.consumer_id === "codex:desktop-wsl"
          && metadata.lane === "interaction-bound"
          ? {desktop_backend_binding: desktopBackendBinding} : {}),
        resumed: durableSession?.status === "active" || state.reconnect_count > 1,
        session_recovery: {gateway_delivery: durableSession?.status === "active" ? "recovered-after-restart" : state.reconnect_count > 1 ? "reattached" : "new", backend_history: "not-verified-by-connect"}, initialization: session.initializationReceipt(), backend_capabilities: backendCapabilities, ...(state.continuity_mode === ACKNOWLEDGED_CONTINUITY_MODE ? {continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, resume_token: session.resumeToken(), resume_token_digest: state.resume_token_digest, acknowledged_through: state.acknowledged_through, next_sequence: state.delivery_sequence + 1}} : {}), authority_effect: "none"});
      setImmediate(() => session.flushBuffered());
      if (remainder) socket.emit("data", Buffer.from(remainder));
    };
    socket.on("data", onData);
  });

  async function start() {
    if (started) return api;
    if (process.platform !== "win32" && observationListenPath && existsSync(observationListenPath)) throw new Error("Observation listen path already exists.");
    if (process.platform !== "win32") removeSocketPath(listenPath);
    await new Promise((resolveStart, reject) => {
      server.once("error", reject);
      server.listen(listenPath, () => {
        server.off("error", reject);
        resolveStart();
      });
    });
    if (process.platform !== "win32") chmodSync(listenPath, 0o600);
    if (observationServer) {
      try {
        await new Promise((resolveStart, reject) => {
          observationServer.once("error", reject);
          observationServer.listen(observationTcpPort === null ? observationListenPath
            : {host: "127.0.0.1", port: observationTcpPort}, () => {
            observationServer.off("error", reject);
            resolveStart();
          });
        });
        if (process.platform !== "win32" && observationListenPath !== null) chmodSync(observationListenPath, 0o600);
      } catch (error) {
        if (observationServer.listening) await new Promise((resolveClose) => observationServer.close(resolveClose));
        await new Promise((resolveClose) => server.close(resolveClose));
        if (process.platform !== "win32") removeSocketPath(listenPath);
        throw error;
      }
    }
    started = true;
    return api;
  }

  async function close() {
    shuttingDown = true;
    for (const session of [...sessions.values()]) session.stop("gateway.shutdown");
    const backendExits = await Promise.allSettled([...ownedBackends].map(awaitOwnedBackendExit));
    if (observationServer?.listening) await new Promise((resolveClose) => observationServer.close(resolveClose));
    if (started) await new Promise((resolveClose) => server.close(resolveClose));
    started = false;
    expiredSessions.clear();
    if (process.platform !== "win32" && observationListenPath && existsSync(observationListenPath)) removeSocketPath(observationListenPath);
    if (process.platform !== "win32") removeSocketPath(listenPath);
    if (ownsSessionStore) sessionStore.close();
    const unconfirmed = backendExits.find(result => result.status === "rejected");
    if (unconfirmed) throw unconfirmed.reason;
  }

  const api = Object.freeze({
    start,
    close,
    server,
    observationAddress: () => observationServer?.address() ?? null,
    noteManagedModelWireGuardHeartbeat: (receivedAtUnixMs = Date.now()) => {
      if (!managedModelWireGuardExpected || !Number.isSafeInteger(receivedAtUnixMs) || receivedAtUnixMs < 0) {
        throw new TypeError("A managed model-wire guard heartbeat requires an expected guard and valid time.");
      }
      modelWireGuardHeartbeatAt = receivedAtUnixMs;
    },
    observeAdapters: (observedAtUnixMs = Date.now()) => projectAdapterObservation({
      runtime_epoch_id: runtimeEpochId,
      backend_adapter_id: backendAdapter.adapter_id,
      backend_capabilities: backendCapabilities,
      observed_at_unix_ms: observedAtUnixMs,
      started,
      turn_ingress_blocked_reason: turnIngressBlockedReason,
      managed_model_wire_guard_expected: managedModelWireGuardExpected,
      model_wire_guard_heartbeat_at_unix_ms: modelWireGuardHeartbeatAt,
      hosted_input_attestation_configured: hostedInputKey !== null,
      mcp_hook_relay_preflight_required: requireMcpHookRelay,
      hosted_effect_tool_enabled: allowHostedEffectTool,
      windows_backend_sandbox_attestation_configured: windowsBackendSandboxAttestation !== null,
      faulted_session_present: typeof sessionStore.hasFaultedSession === "function"
        ? sessionStore.hasFaultedSession() : null,
      incomplete_history_audit_present: typeof sessionStore.hasIncompleteHistoryAudit === "function"
        ? sessionStore.hasIncompleteHistoryAudit() : null,
      sessions: [...sessions.values()].map((session) => ({...session.observeAdapter(),
        host_observations: sessionStore.getSession(session.metadata.consumer_id)?.host_observations ?? []})),
    }),
    observeReasoningThreads: (observedAtUnixMs = Date.now(), page = {}) => {
      const storedSessions = sessionStore.inspect().sessions;
      return projectGatewayThreadObservation({
        runtime_epoch_id: runtimeEpochId,
        observed_at_unix_ms: observedAtUnixMs,
        page_offset: page.page_offset ?? 0,
        expected_snapshot_digest: page.expected_snapshot_digest,
        unknown_dispatch_count: storedSessions.reduce((count, storedSession) => count
          + storedSession.requests.filter((request) => request.status === "outcome-unknown"
            && mutatesBackendThread(request.method)).length, 0),
        unknown_hosted_effect_dispatch_count: storedSessions.reduce((count, storedSession) => count
          + storedSession.requests.filter((request) => request.status === "outcome-unknown"
            && request.method === "cyberalchemy/hostedEffect/execute").length, 0),
        unknown_thread_creation_count: storedSessions.reduce((count, storedSession) => count
          + storedSession.requests.filter((request) => request.status === "outcome-unknown"
            && THREAD_CREATION_METHODS.has(request.method)).length, 0),
        accepted_unresolved_turn_count: storedSessions.reduce((count, storedSession) => count
          + storedSession.requests.filter((request) => request.status === "outcome-unknown"
            && request.method === "turn/start" && request.thread_ref
            && storedSession.host_observations.some((observation) => observation.kind === "turn-start-accepted"
              && observation.thread_ref === request.thread_ref
              && observation.request_key_digest === digestValue(request.request_key)
              && observation.request_digest === request.binding_digest)).length, 0),
        recovered_dispatch_count: storedSessions.reduce((count, storedSession) => count
          + storedSession.requests.filter((request) => request.status === "recovered").length, 0),
        sessions: [...sessions.values()].map((session) => {
          const stored = sessionStore.getSession(session.metadata.consumer_id);
          const recoveredByThread = new Map();
          const unknownHostedEffectsByThread = new Map();
          for (const request of stored?.requests ?? []) {
            if (request.status === "outcome-unknown"
              && request.method === "cyberalchemy/hostedEffect/execute" && request.thread_ref) {
              unknownHostedEffectsByThread.set(request.thread_ref,
                (unknownHostedEffectsByThread.get(request.thread_ref) ?? 0) + 1);
            }
            if (request.status !== "recovered" || !request.thread_ref) continue;
            recoveredByThread.set(request.thread_ref, (recoveredByThread.get(request.thread_ref) ?? 0) + 1);
          }
          return {consumer_id: session.metadata.consumer_id,
            threads: session.observeReasoningThreads().map((thread) => ({...thread,
              recovered_dispatch_count: recoveredByThread.get(thread.thread_ref) ?? 0,
              unknown_hosted_effect_dispatch_count: unknownHostedEffectsByThread.get(thread.thread_ref) ?? 0})),
            mcp_hook_relay_checks: session.observeMcpRelayChecks(),
            degraded_steer_thread_count: session.observeSteerContinuity(),
            host_observations: stored?.host_observations ?? []};
        }),
      });
    },
    observeDecisions: (observedAtUnixMs = Date.now()) => projectGatewayDecisionObservation({
      runtime_epoch_id: runtimeEpochId,
      observed_at_unix_ms: observedAtUnixMs,
      sessions: [...sessions.values()].map((session) => ({consumer_id: session.metadata.consumer_id, decisions: session.observeDecisions()})),
    }),
    inspect: () => {
      pruneExpirations();
      return freezeResult({
      schema_version: "are.codex-persistent-gateway-state/v1",
      runtime_epoch_id: runtimeEpochId,
      backend_adapter_id: backendAdapter.adapter_id,
      backend_capabilities: backendCapabilities,
      listen_path: listenPath,
      started,
      sessions: [...sessions.values()].map((session) => session.inspect()).sort((a, b) => a.consumer_id.localeCompare(b.consumer_id)),
      expired_sessions: [...expiredSessions.values()].map((entry) => entry.receipt).sort((a, b) => a.consumer_id.localeCompare(b.consumer_id)),
      durable_session_index: sessionStore.inspect(),
      authority_effect: "none",
      });
    },
  });
  return api;
}
