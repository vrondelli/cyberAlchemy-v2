import {randomBytes} from "node:crypto";
import {observationConnection} from "./observation-endpoint.mjs";
import {validDshObjectiveCheckpointSummary, validDshInterpretationSummary, validDshPlanHeadSummary} from "./dsh-objective-checkpoint-observation.mjs";

import {ADAPTER_OBSERVATION_SCHEMA} from "./adapter-observation.mjs";
import {ADAPTER_OBSERVATION_REQUEST_SCHEMA, ADAPTER_OBSERVATION_RESPONSE_SCHEMA} from "./gateway.mjs";

const GATEWAY_STATUS = new Set(["unavailable", "running"]);
const CLIENT_STATUS = new Set(["connected", "not-observed"]);
const BACKEND_STATUS = new Set(["ready", "running", "not-observed"]);
const SESSION_FAULT_STATUS = new Set(["observed", "not-observed", "unknown"]);
const SESSION_QUARANTINE_STATUS = new Set(["observed", "not-observed", "unknown"]);
const CAPABILITY_POSTURE = new Set(["supported", "unsupported", "unknown"]);
const CAPABILITY_OPERATIONS = ["turn_start", "turn_interrupt", "turn_steer", "thread_resume", "thread_compact", "effect_requests"];
const EXTENDED_CAPABILITY_OPERATIONS = ["turn_start", "turn_interrupt", "thread_compact"];
const RECEIPT_COUNTS = ["turn_start_accepted", "turn_history_verified", "steer_accepted", "compaction_item_completed"];
const OPTIONAL_RECEIPT_COUNTS = ["compaction_turn_accepted", "compaction_history_verified"];
const SESSION_PATH_COUNTS = ["total", "ready", "initializing", "backend_unavailable", "detached_backend", "inactive"];

export function readAdapterObservation(options = {}) {
  const {socket_path: socketPath, token} = options;
  const timeoutMs = options.timeout_ms ?? 2500;
  const maxBytes = options.max_bytes ?? 16 * 1024;
  if (typeof socketPath !== "string" || !socketPath) throw new TypeError("Observation socket path is required.");
  if (typeof token !== "string" || Buffer.byteLength(token) < 32) throw new TypeError("Observation token is required.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) throw new TypeError("Invalid observation timeout.");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || maxBytes > 64 * 1024) throw new TypeError("Invalid observation byte limit.");
  const nonce = randomBytes(24).toString("base64url");
  return new Promise((resolveRead, rejectRead) => {
    const socket = observationConnection(socketPath);
    let settled = false;
    let buffer = "";
    const finish = (error, observation = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) rejectRead(error);
      else resolveRead(observation);
    };
    socket.setTimeout(timeoutMs, () => finish(new Error("adapter.observation-timeout")));
    socket.once("error", () => finish(new Error("adapter.observation-unavailable")));
    socket.once("connect", () => socket.write(`${JSON.stringify({schema_version: ADAPTER_OBSERVATION_REQUEST_SCHEMA, nonce, token})}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (Buffer.byteLength(buffer) > maxBytes) return finish(new Error("adapter.observation-too-large"));
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      let response;
      try { response = JSON.parse(buffer.slice(0, newline)); }
      catch { return finish(new Error("adapter.observation-invalid-json")); }
      const observation = response?.observation;
      const sessionFaultStatus = observation?.session_fault === undefined ? "unknown" : observation.session_fault?.status;
      const sessionQuarantineStatus = observation?.session_quarantine === undefined
        ? "unknown" : observation.session_quarantine?.status;
      const selectedPathStatus = observation?.selected_path === undefined
        ? "unknown" : observation.selected_path?.status;
      const sessionPaths = observation?.session_paths === undefined ? {status: "unknown",
        total: null, ready: null, initializing: null, backend_unavailable: null,
        detached_backend: null, inactive: null} : observation.session_paths;
      const sessionPathsValid = sessionPaths && typeof sessionPaths === "object" && !Array.isArray(sessionPaths)
        && ["observed", "unavailable", "unknown"].includes(sessionPaths.status)
        && (sessionPaths.status === "unknown"
          ? SESSION_PATH_COUNTS.every((name) => sessionPaths[name] === null)
          : SESSION_PATH_COUNTS.every((name) => Number.isSafeInteger(sessionPaths[name])
            && sessionPaths[name] >= 0 && sessionPaths[name] <= 1024)
            && sessionPaths.total === sessionPaths.ready + sessionPaths.initializing
              + sessionPaths.backend_unavailable + sessionPaths.detached_backend + sessionPaths.inactive
            && (sessionPaths.status === "unavailable"
              ? observation.gateway?.status === "unavailable" && sessionPaths.total === 0
                && observation.backend?.status === "not-observed"
              : observation.gateway?.status === "running"
                && (selectedPathStatus === "ready") === (sessionPaths.ready > 0)
                && (observation.client_link?.status === "connected")
                  === (sessionPaths.ready + sessionPaths.initializing + sessionPaths.backend_unavailable > 0)
                && (observation.backend?.status !== "not-observed")
                  === (sessionPaths.ready + sessionPaths.initializing + sessionPaths.detached_backend > 0)));
      const hostMethodPolicy = observation?.host_method_policy ?? {status: "unknown",
        codex_version: null, known_request_count: null, admitted_request_count: null};
      const modelEntryIngress = observation?.model_entry_ingress === undefined
        ? {status: "unknown", reason_code: null} : observation.model_entry_ingress;
      const modelWireGuard = observation?.model_wire_guard === undefined
        ? {status: "unknown"} : observation.model_wire_guard;
      const hostedInputAttestation = observation?.hosted_input_attestation === undefined
        ? {status: "unknown"} : observation.hosted_input_attestation;
      const windowsBackendSandbox = observation?.windows_backend_sandbox === undefined
        ? {status: "unknown"} : observation.windows_backend_sandbox;
      const capabilities = observation?.backend_capabilities;
      const normalizedCapabilities = capabilities && typeof capabilities === "object" && !Array.isArray(capabilities)
        ? {...capabilities} : null;
      if (normalizedCapabilities) {
        for (const operation of EXTENDED_CAPABILITY_OPERATIONS) {
          if (!Object.hasOwn(normalizedCapabilities, operation)) normalizedCapabilities[operation] = "unknown";
        }
      }
      const retainedHostReceipts = observation?.retained_host_receipts ?? {status: "unknown",
        turn_start_accepted: null, turn_history_verified: null, steer_accepted: null, compaction_item_completed: null};
      const dshWebActivity = observation?.source === "dsh-web-host-process"
        ? observation.dsh_web_activity === undefined
          ? {status: "unknown", active_agent_count: null, retained_model_entry_count: null,
            retained_turn_terminal_count: null, omitted_agent_count: null, agents: []}
          : observation.dsh_web_activity
        : null;
      const dshWebActivityValid = dshWebActivity === null
        ? observation?.dsh_web_activity === undefined
        : dshWebActivity && typeof dshWebActivity === "object" && !Array.isArray(dshWebActivity)
          && Object.keys(dshWebActivity).sort().join(",")
            === "active_agent_count,agents,omitted_agent_count,retained_model_entry_count,retained_turn_terminal_count,status"
          && ["observed", "unknown"].includes(dshWebActivity.status)
          && Array.isArray(dshWebActivity.agents) && dshWebActivity.agents.length <= 16
          && dshWebActivity.agents.every((item, index) => item && typeof item === "object"
            && !Array.isArray(item) && ["last_turn_evidence,thread_ref",
              "last_turn_evidence,native_turn_state,thread_ref",
              "are_preparation,last_turn_evidence,thread_ref",
              "are_preparation,last_turn_evidence,native_turn_state,thread_ref"].includes(Object.keys(item)
                .filter(key => !['are_interpretation', 'are_plan_head'].includes(key)).sort().join(","))
            && (item.are_interpretation === undefined || validDshInterpretationSummary(item.are_interpretation))
            && (item.are_plan_head === undefined || validDshPlanHeadSummary(item.are_plan_head))
            && /^backend-thread:[0-9a-f]{64}$/u.test(item.thread_ref)
            && ["model-entry-retained", "terminal-retained", "no-retained-turn-event"].includes(item.last_turn_evidence)
            && (item.are_preparation === undefined || item.are_preparation
              && typeof item.are_preparation === "object" && !Array.isArray(item.are_preparation)
              && ["route_id,status", "dispatch_relation,route_id,status",
                "objective_checkpoint,route_id,status", "dispatch_relation,objective_checkpoint,route_id,status"].includes(
                Object.keys(item.are_preparation).sort().join(","))
              && (item.are_preparation.objective_checkpoint === undefined
                || validDshObjectiveCheckpointSummary(item.are_preparation.objective_checkpoint))
              && item.are_preparation.status === "route-context-prepared"
              && (item.are_preparation.dispatch_relation === undefined
                || ["latest-model-entry", "other-preparation", "not-retained", "legacy-unbound"]
                  .includes(item.are_preparation.dispatch_relation))
              && /^CA2-ROUTE-[A-Z0-9-]{1,80}$/u.test(item.are_preparation.route_id))
            && (item.native_turn_state === undefined || ["not-started", "open-observed",
              "closed-observed", "unknown"].includes(item.native_turn_state))
            && (index === 0 || dshWebActivity.agents[index - 1].thread_ref < item.thread_ref))
          && (dshWebActivity.status === "unknown"
            ? dshWebActivity.omitted_agent_count === null && dshWebActivity.agents.length === 0
            : Number.isSafeInteger(dshWebActivity.omitted_agent_count)
              && dshWebActivity.omitted_agent_count >= 0 && dshWebActivity.omitted_agent_count <= 1024
              && dshWebActivity.agents.length + dshWebActivity.omitted_agent_count
                === dshWebActivity.active_agent_count)
          && ["active_agent_count", "retained_model_entry_count", "retained_turn_terminal_count"].every(key =>
            dshWebActivity.status === "unknown" ? dshWebActivity[key] === null
              : Number.isSafeInteger(dshWebActivity[key]) && dshWebActivity[key] >= 0
                && dshWebActivity[key] <= (key === "active_agent_count" ? 1024 : 262_144));
      const receiptValuesValid = retainedHostReceipts && typeof retainedHostReceipts === "object"
        && !Array.isArray(retainedHostReceipts)
        && ["observed", "not-observed", "unknown"].includes(retainedHostReceipts.status)
        && RECEIPT_COUNTS.every((name) => retainedHostReceipts.status === "unknown"
          ? retainedHostReceipts[name] === null
          : Number.isSafeInteger(retainedHostReceipts[name]) && retainedHostReceipts[name] >= 0
            && retainedHostReceipts[name] <= 262_144)
        && OPTIONAL_RECEIPT_COUNTS.every((name) => retainedHostReceipts[name] === undefined
          || (retainedHostReceipts.status === "unknown" ? retainedHostReceipts[name] === null
            : Number.isSafeInteger(retainedHostReceipts[name]) && retainedHostReceipts[name] >= 0
              && retainedHostReceipts[name] <= 262_144))
        && (retainedHostReceipts.status === "unknown" || (retainedHostReceipts.status === "observed")
          === [...RECEIPT_COUNTS, ...OPTIONAL_RECEIPT_COUNTS].some((name) => retainedHostReceipts[name] > 0));
      if (response?.schema_version !== ADAPTER_OBSERVATION_RESPONSE_SCHEMA || response.nonce !== nonce
        || observation?.schema_version !== ADAPTER_OBSERVATION_SCHEMA || observation.authority_effect !== "none"
        || !["gateway-in-process", "dsh-web-host-process"].includes(observation.source)
        || (observation.source === "dsh-web-host-process"
          && (observation.selected_backend_adapter_id !== "deepseek-harness-web/are-v1"
            || observation.client_link?.status !== "not-observed"
            || selectedPathStatus !== "not-observed" || sessionPaths.status !== "unknown"))
        || typeof observation.runtime_epoch_id !== "string" || observation.runtime_epoch_id.length < 1 || observation.runtime_epoch_id.length > 256
        || typeof observation.selected_backend_adapter_id !== "string" || observation.selected_backend_adapter_id.length < 1 || observation.selected_backend_adapter_id.length > 256
        || !GATEWAY_STATUS.has(observation.gateway?.status) || !CLIENT_STATUS.has(observation.client_link?.status) || !BACKEND_STATUS.has(observation.backend?.status)
        || !SESSION_FAULT_STATUS.has(sessionFaultStatus)
        || !SESSION_QUARANTINE_STATUS.has(sessionQuarantineStatus)
        || !["ready", "not-observed", "unknown"].includes(selectedPathStatus)
        || !sessionPathsValid
        || !hostMethodPolicy || typeof hostMethodPolicy !== "object" || Array.isArray(hostMethodPolicy)
        || !["pinned-catalog", "not-applicable", "unknown"].includes(hostMethodPolicy.status)
        || (hostMethodPolicy.status === "pinned-catalog"
          ? observation.selected_backend_adapter_id !== "codex-app-server/v1"
            || typeof hostMethodPolicy.codex_version !== "string" || !hostMethodPolicy.codex_version
            || hostMethodPolicy.codex_version.length > 128
            || !Number.isSafeInteger(hostMethodPolicy.known_request_count)
            || hostMethodPolicy.known_request_count < 1 || hostMethodPolicy.known_request_count > 4096
            || !Number.isSafeInteger(hostMethodPolicy.admitted_request_count)
            || hostMethodPolicy.admitted_request_count < 0
            || hostMethodPolicy.admitted_request_count > hostMethodPolicy.known_request_count
          : hostMethodPolicy.codex_version !== null || hostMethodPolicy.known_request_count !== null
            || hostMethodPolicy.admitted_request_count !== null)
        || !modelEntryIngress || typeof modelEntryIngress !== "object" || Array.isArray(modelEntryIngress)
        || !["paused", "not-paused", "unknown"].includes(modelEntryIngress.status)
        || (modelEntryIngress.status === "paused"
          ? modelEntryIngress.reason_code !== "windows-client.hook-boundary-unverified"
          : modelEntryIngress.reason_code !== null)
        || !modelWireGuard || typeof modelWireGuard !== "object" || Array.isArray(modelWireGuard)
        || !["parent-heartbeat-observed", "not-observed", "not-declared", "unknown"].includes(modelWireGuard.status)
        || !hostedInputAttestation || typeof hostedInputAttestation !== "object"
        || Array.isArray(hostedInputAttestation)
        || !["configured", "not-configured", "unknown"].includes(hostedInputAttestation.status)
        || !windowsBackendSandbox || typeof windowsBackendSandbox !== "object"
        || Array.isArray(windowsBackendSandbox)
        || !["not-configured", "no-active-backend", "pending-or-mixed",
          "passed-all-active-backends", "failed", "unknown"].includes(windowsBackendSandbox.status)
        || (selectedPathStatus === "ready" && (observation.gateway?.status !== "running"
          || observation.client_link?.status !== "connected" || observation.backend?.status !== "ready"))
        || observation.host_task_control?.status !== "unverified"
        || CAPABILITY_OPERATIONS.some((operation) => !CAPABILITY_POSTURE.has(normalizedCapabilities?.[operation]))
        || !["durable", "ephemeral", "unknown"].includes(observation.backend_capabilities?.history_persistence)
        || !receiptValuesValid || !dshWebActivityValid
        || !Number.isSafeInteger(observation.observed_at_unix_ms) || !Array.isArray(observation.reason_codes)
        || observation.reason_codes.length > 16 || observation.reason_codes.some((reason) => typeof reason !== "string" || reason.length > 128)) {
        return finish(new Error("adapter.observation-incompatible"));
      }
      const age = Date.now() - observation.observed_at_unix_ms;
      if (age > 5000 || age < -1000) return finish(new Error("adapter.observation-stale"));
      finish(null, {...observation, session_fault: {status: sessionFaultStatus},
        session_quarantine: {status: sessionQuarantineStatus},
        selected_path: {status: selectedPathStatus},
        session_paths: sessionPaths,
        host_method_policy: hostMethodPolicy,
        model_entry_ingress: modelEntryIngress,
        model_wire_guard: modelWireGuard,
        hosted_input_attestation: hostedInputAttestation,
        windows_backend_sandbox: windowsBackendSandbox,
        retained_host_receipts: retainedHostReceipts,
        dsh_web_activity: dshWebActivity,
        backend_capabilities: normalizedCapabilities});
    });
    socket.once("close", () => { if (!settled) finish(new Error("adapter.observation-closed")); });
  });
}
