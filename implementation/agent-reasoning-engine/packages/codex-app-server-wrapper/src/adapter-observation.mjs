import {freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import hostCatalog from "./host-client-method-catalog.v1.json" with {type: "json"};

export const ADAPTER_OBSERVATION_SCHEMA = "are.adapter-observation/v1";
const POSTURE = new Set(["supported", "unsupported", "unknown"]);
const OPERATIONS = ["turn_start", "turn_interrupt", "turn_steer", "thread_resume", "thread_compact", "effect_requests"];
const HOST_RECEIPT_KINDS = ["turn-start-accepted", "turn-history-verified", "steer-accepted",
  "compaction-turn-accepted", "compaction-item-completed", "compaction-history-verified"];
const DSH_WEB_OBSERVATION_KINDS = ["dsh-turn-terminal-observed", "dsh-queue-edit-observed",
  "dsh-queue-remove-observed", "dsh-queue-steer-observed", "dsh-session-release-observed"];

// This projector accepts only gateway-owned, in-memory status facts. It never
// reads a session store or exposes consumer, thread, path, prompt, or token data.
export function projectAdapterObservation(input) {
  if (!isRecord(input) || !nonEmptyString(input.runtime_epoch_id) || !nonEmptyString(input.backend_adapter_id)) {
    throw new TypeError("Adapter observation requires a gateway epoch and selected backend adapter.");
  }
  if (!Number.isSafeInteger(input.observed_at_unix_ms) || input.observed_at_unix_ms < 0) {
    throw new TypeError("Adapter observation requires a non-negative observation time.");
  }
  if (!Array.isArray(input.sessions) || input.sessions.length > 1024) {
    throw new TypeError("Adapter observation sessions must be a bounded array.");
  }
  const declared = input.backend_capabilities;
  if (!isRecord(declared) || !isRecord(declared.operations)
    || OPERATIONS.some((operation) => !POSTURE.has(declared.operations[operation]))
    || !["durable", "ephemeral", "unknown"].includes(declared.history_persistence)) {
    throw new TypeError("Adapter observation requires bounded backend capability declarations.");
  }
  const sessions = input.sessions;
  if (sessions.some((session) => !isRecord(session) || typeof session.attached !== "boolean" || typeof session.backend_running !== "boolean" || typeof session.initialized !== "boolean")) {
    throw new TypeError("Adapter observation received invalid session facts.");
  }
  const receiptCoverageComplete = sessions.every((session) => Array.isArray(session.host_observations));
  if (sessions.some((session) => session.host_observations !== undefined
    && (!Array.isArray(session.host_observations) || session.host_observations.length > 256
      || session.host_observations.some((observation) => !isRecord(observation)
        || ![...HOST_RECEIPT_KINDS, "turn-marker-observed", "turn-completion-observed",
          ...DSH_WEB_OBSERVATION_KINDS].includes(observation.kind))))) {
    throw new TypeError("Adapter observation received invalid retained host receipt facts.");
  }
  const retainedReceipts = receiptCoverageComplete ? sessions.flatMap((session) => session.host_observations) : [];
  const receiptCounts = receiptCoverageComplete
    ? Object.fromEntries(HOST_RECEIPT_KINDS.map((kind) => [kind, retainedReceipts.filter((item) => item.kind === kind).length]))
    : null;
  const gatewayRunning = input.started === true;
  if (input.turn_ingress_blocked_reason !== undefined && input.turn_ingress_blocked_reason !== null
    && input.turn_ingress_blocked_reason !== "windows-client.hook-boundary-unverified") {
    throw new TypeError("Adapter observation received an invalid gateway model-entry pause reason.");
  }
  const modelEntryPaused = input.turn_ingress_blocked_reason === "windows-client.hook-boundary-unverified";
  if (input.managed_model_wire_guard_expected !== undefined
    && typeof input.managed_model_wire_guard_expected !== "boolean") {
    throw new TypeError("Adapter observation received invalid managed model-wire guard declaration.");
  }
  const guardHeartbeatAt = input.model_wire_guard_heartbeat_at_unix_ms ?? null;
  if (guardHeartbeatAt !== null && (!Number.isSafeInteger(guardHeartbeatAt) || guardHeartbeatAt < 0
    || input.managed_model_wire_guard_expected !== true)) {
    throw new TypeError("Adapter observation received invalid managed model-wire guard heartbeat.");
  }
  const guardHeartbeatFresh = guardHeartbeatAt !== null
    && guardHeartbeatAt <= input.observed_at_unix_ms
    && input.observed_at_unix_ms - guardHeartbeatAt <= 3000;
  if (input.faulted_session_present !== undefined && input.faulted_session_present !== null
    && typeof input.faulted_session_present !== "boolean") {
    throw new TypeError("Adapter observation received invalid durable fault status.");
  }
  if (input.incomplete_history_audit_present !== undefined && input.incomplete_history_audit_present !== null
    && typeof input.incomplete_history_audit_present !== "boolean") {
    throw new TypeError("Adapter observation received invalid history-audit quarantine status.");
  }
  if (input.hosted_input_attestation_configured !== undefined
    && input.hosted_input_attestation_configured !== null
    && typeof input.hosted_input_attestation_configured !== "boolean") {
    throw new TypeError("Adapter observation received invalid hosted-input attestation status.");
  }
  if (input.mcp_hook_relay_preflight_required !== undefined
    && input.mcp_hook_relay_preflight_required !== null
    && typeof input.mcp_hook_relay_preflight_required !== "boolean") {
    throw new TypeError("Adapter observation received invalid MCP hook relay preflight status.");
  }
  if (input.hosted_effect_tool_enabled !== undefined && input.hosted_effect_tool_enabled !== null
    && typeof input.hosted_effect_tool_enabled !== "boolean") {
    throw new TypeError("Adapter observation received invalid hosted-effect configuration status.");
  }
  if (input.windows_backend_sandbox_attestation_configured !== undefined
    && typeof input.windows_backend_sandbox_attestation_configured !== "boolean") {
    throw new TypeError("Adapter observation received invalid Windows backend attestation declaration.");
  }
  const sandboxStatuses = new Set(["not-configured", "pending-initialize", "checking",
    "passed-this-backend", "failed", "backend-closed"]);
  if (sessions.some((session) => session.windows_backend_sandbox_status !== undefined
    && !sandboxStatuses.has(session.windows_backend_sandbox_status))) {
    throw new TypeError("Adapter observation received invalid Windows backend attestation state.");
  }
  const activeSandboxSessions = sessions.filter((session) => session.attached && session.backend_running);
  const windowsSandboxStatus = input.windows_backend_sandbox_attestation_configured !== true
    ? "not-configured" : activeSandboxSessions.length === 0 ? "no-active-backend"
      : activeSandboxSessions.every((session) => session.windows_backend_sandbox_status === "passed-this-backend")
        ? "passed-all-active-backends" : activeSandboxSessions.some((session) =>
          session.windows_backend_sandbox_status === "failed") ? "failed"
          : "pending-or-mixed";
  const clientConnected = gatewayRunning && sessions.some((session) => session.attached);
  const backendRunning = gatewayRunning && sessions.some((session) => session.backend_running);
  const backendReady = backendRunning && sessions.some((session) => session.backend_running && session.initialized);
  // Independent aggregate link states may describe different sessions.
  const selectedPathReady = gatewayRunning && sessions.some((session) => session.attached && session.backend_running && session.initialized);
  // These mutually exclusive, content-free counts describe exact sessions,
  // unlike the independent aggregate client/backend indicators above.
  const sessionPaths = gatewayRunning ? {
    status: "observed",
    total: sessions.length,
    ready: sessions.filter((session) => session.attached && session.backend_running && session.initialized).length,
    initializing: sessions.filter((session) => session.attached && session.backend_running && !session.initialized).length,
    backend_unavailable: sessions.filter((session) => session.attached && !session.backend_running).length,
    detached_backend: sessions.filter((session) => !session.attached && session.backend_running).length,
    inactive: sessions.filter((session) => !session.attached && !session.backend_running).length,
  } : {status: "unavailable", total: 0, ready: 0, initializing: 0,
    backend_unavailable: 0, detached_backend: 0, inactive: 0};
  return freezeResult({
    schema_version: ADAPTER_OBSERVATION_SCHEMA,
    source: "gateway-in-process",
    runtime_epoch_id: input.runtime_epoch_id,
    observed_at_unix_ms: input.observed_at_unix_ms,
    selected_backend_adapter_id: input.backend_adapter_id,
    backend_capabilities: {
      ...Object.fromEntries(OPERATIONS.map((operation) => [operation, declared.operations[operation]])),
      history_persistence: declared.history_persistence,
    },
    retained_host_receipts: receiptCounts === null ? {status: "unknown", turn_start_accepted: null,
      turn_history_verified: null, steer_accepted: null, compaction_turn_accepted: null,
      compaction_item_completed: null, compaction_history_verified: null}
      : {status: Object.values(receiptCounts).some((count) => count > 0) ? "observed" : "not-observed",
        turn_start_accepted: receiptCounts["turn-start-accepted"],
        turn_history_verified: receiptCounts["turn-history-verified"],
        steer_accepted: receiptCounts["steer-accepted"],
        compaction_turn_accepted: receiptCounts["compaction-turn-accepted"],
        compaction_item_completed: receiptCounts["compaction-item-completed"],
        compaction_history_verified: receiptCounts["compaction-history-verified"]},
    gateway: {status: gatewayRunning ? "running" : "unavailable"},
    client_link: {status: clientConnected ? "connected" : "not-observed"},
    backend: {status: backendReady ? "ready" : backendRunning ? "running" : "not-observed"},
    selected_path: {status: selectedPathReady ? "ready" : "not-observed"},
    session_paths: sessionPaths,
    // This is pinned gateway policy scope, not a measured desktop compatibility
    // percentage or evidence that a desktop task is controlled by ARE.
    host_method_policy: input.backend_adapter_id === "codex-app-server/v1"
      ? {status: "pinned-catalog", codex_version: hostCatalog.observed_codex_version,
        known_request_count: hostCatalog.client_request_methods.length,
        admitted_request_count: hostCatalog.admitted_gateway_requests.length}
      : {status: "not-applicable", codex_version: null,
        known_request_count: null, admitted_request_count: null},
    model_entry_ingress: {status: modelEntryPaused ? "paused" : "not-paused",
      reason_code: modelEntryPaused ? input.turn_ingress_blocked_reason : null},
    // Parent IPC heartbeat is live process evidence, not a probe of provider or host-effect coverage.
    model_wire_guard: {status: input.managed_model_wire_guard_expected !== true ? "not-declared"
      : guardHeartbeatFresh ? "parent-heartbeat-observed" : "not-observed"},
    hosted_input_attestation: {status: input.hosted_input_attestation_configured === true ? "configured"
      : input.hosted_input_attestation_configured === false ? "not-configured" : "unknown"},
    mcp_hook_relay_preflight: {status: input.mcp_hook_relay_preflight_required === true ? "required"
      : input.mcp_hook_relay_preflight_required === false ? "not-required" : "unknown"},
    hosted_effect_tool: {status: input.hosted_effect_tool_enabled === true ? "candidate-enabled"
      : input.hosted_effect_tool_enabled === false ? "disabled" : "unknown"},
    windows_backend_sandbox: {status: windowsSandboxStatus},
    session_fault: {status: input.faulted_session_present === true ? "observed"
      : input.faulted_session_present === false ? "not-observed" : "unknown"},
    session_quarantine: {status: input.incomplete_history_audit_present === true ? "observed"
      : input.incomplete_history_audit_present === false ? "not-observed" : "unknown"},
    // Aggregate gateway facts cannot establish ownership of an exact desktop task.
    host_task_control: {status: "unverified"},
    reason_codes: gatewayRunning ? [] : ["adapter.gateway-not-running"],
    authority_effect: "none",
  });
}
