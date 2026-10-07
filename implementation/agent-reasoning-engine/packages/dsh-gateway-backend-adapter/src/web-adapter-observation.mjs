import {timingSafeEqual} from "node:crypto";
import {chmod, lstat, realpath, unlink} from "node:fs/promises";
import {connect, createServer} from "node:net";
import {dirname, isAbsolute} from "node:path";
import {summarizeDshObjectiveCheckpoint, validDshObjectiveCheckpointSummary,
  summarizeDshInterpretation, validDshInterpretationSummary, validDshPlanHeadSummary}
  from "../../codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs";

const REQUEST_SCHEMA = "are.adapter-observation-request/v1";
const RESPONSE_SCHEMA = "are.adapter-observation-response/v1";
const OBSERVATION_SCHEMA = "are.adapter-observation/v1";
const MAX_REQUEST_BYTES = 4096;
const MAX_RESPONSE_BYTES = 16 * 1024;

async function recoverStaleSocket(path, previous) {
  if (!previous.isSocket() || (previous.mode & 0o077) !== 0
    || typeof process.getuid === "function" && previous.uid !== process.getuid()) {
    throw new Error("dsh-web.adapter-observation-path-exists");
  }
  const state = await new Promise(resolve => {
    const socket = connect(path);
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => finish("unknown"), 250);
    socket.once("connect", () => finish("active"));
    socket.once("error", error => finish(error?.code === "ECONNREFUSED" ? "stale" : "unknown"));
  });
  if (state !== "stale") throw new Error("dsh-web.adapter-observation-path-exists");
  const current = await lstat(path).catch(error => error?.code === "ENOENT" ? null : Promise.reject(error));
  if (!current?.isSocket() || current.dev !== previous.dev || current.ino !== previous.ino) {
    throw new Error("dsh-web.adapter-observation-path-changed");
  }
  await unlink(path);
}

function sameToken(left, right) {
  if (typeof left !== "string" || Buffer.byteLength(left) !== Buffer.byteLength(right)) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function observedNativeTurnState(events) {
  if (!Array.isArray(events)) return "unknown";
  let start;
  let end;
  let malformed = false;
  for (const event of events) {
    if (event?.type !== "turn/start" && event?.type !== "turn/end") continue;
    if (!Number.isSafeInteger(event.seq) || event.seq < 0) {
      malformed = true;
      continue;
    }
    if (event.type === "turn/start") start = Math.max(start ?? -1, event.seq);
    if (event.type === "turn/end") end = Math.max(end ?? -1, event.seq);
  }
  if (malformed) return "unknown";
  if (start === undefined) return end === undefined ? "not-started" : "unknown";
  if (end === undefined || start > end) return "open-observed";
  return "closed-observed";
}

export function projectDshWebActivity({agent_records, host_observations} = {}) {
  if (!Array.isArray(agent_records) || agent_records.length > 1024
    || !Array.isArray(host_observations) || host_observations.length > 256) {
    throw new TypeError("dsh-web.adapter-activity-input-invalid");
  }
  const active = agent_records.filter(record => record?.status === "active")
    .sort((left, right) => left.thread_ref.localeCompare(right.thread_ref));
  const agents = active.slice(0, 16).map(record => {
    if (record.are_plan_head !== undefined && !validDshPlanHeadSummary(record.are_plan_head)) {
      throw new TypeError('dsh-web.adapter-plan-head-invalid');
    }
    const latest = host_observations.findLast(item => item.thread_ref === record.thread_ref
      && ["dsh-model-entry-intent", "dsh-turn-terminal-observed"].includes(item.kind));
    const preparation = host_observations.findLast(item => item.thread_ref === record.thread_ref
      && item.kind === "dsh-are-preparation-observed");
    const interpretation = host_observations.findLast(item => item.thread_ref === record.thread_ref
      && item.kind === "dsh-objective-interpretation-observed");
    const interpretationAdmitted = interpretation && host_observations.some(item =>
      item.kind === "dsh-are-preparation-observed" && item.thread_ref === record.thread_ref
      && item.objective_checkpoint?.scope_digest === interpretation.scope_digest
      && item.objective_checkpoint?.objective_state_digest === interpretation.objective_state_digest
      && item.objective_checkpoint?.resolution_digest === interpretation.resolution_digest);
    const modelEntry = host_observations.findLast(item => item.thread_ref === record.thread_ref
      && item.kind === "dsh-model-entry-intent");
    const dispatchRelation = !modelEntry ? "not-retained"
      : modelEntry.preparation_bindings === undefined ? "legacy-unbound"
        : modelEntry.preparation_bindings.some(binding =>
          binding.request_key_digest === preparation?.request_key_digest
          && binding.request_digest === preparation?.request_digest)
          ? "latest-model-entry" : "other-preparation";
    if (preparation && !/^CA2-ROUTE-[A-Z0-9-]{1,80}$/u.test(preparation.route_id ?? "")) {
      throw new TypeError("dsh-web.adapter-preparation-invalid");
    }
    return {thread_ref: record.thread_ref,
      ...(record.are_plan_head === undefined ? {} : {are_plan_head: record.are_plan_head}),
      last_turn_evidence: latest?.kind === "dsh-model-entry-intent"
        ? "model-entry-retained" : latest?.kind === "dsh-turn-terminal-observed"
          ? "terminal-retained" : "no-retained-turn-event",
      ...(interpretation && !interpretationAdmitted
        ? {are_interpretation: summarizeDshInterpretation(interpretation)} : {}),
      ...(preparation ? {are_preparation: {status: "route-context-prepared",
        route_id: preparation.route_id, dispatch_relation: dispatchRelation,
        ...(preparation.objective_checkpoint === undefined ? {} : {
          objective_checkpoint: summarizeDshObjectiveCheckpoint(preparation.objective_checkpoint)})}} : {}),
      ...(record.native_turn_state === undefined ? {}
        : {native_turn_state: record.native_turn_state})};
  });
  // Keep the complete wire response below its existing 16 KiB ceiling even
  // when every row contains both an older admission and a newer interpretation.
  // Omitted rows remain counted; never truncate a checkpoint or hide overload.
  while (Buffer.byteLength(JSON.stringify(agents)) > 12 * 1024) agents.pop();
  return {status: "observed", active_agent_count: active.length,
    retained_model_entry_count: host_observations.filter(item => item.kind === "dsh-model-entry-intent").length,
    retained_turn_terminal_count: host_observations.filter(item => item.kind === "dsh-turn-terminal-observed").length,
    omitted_agent_count: active.length - agents.length, agents};
}

/** A Host/sidecar liveness projection, not a browser-connection or task-control claim. */
export function projectDshWebAdapterObservation({runtime_epoch_id, gateway_healthy,
  host_running, faulted, quarantined, dsh_web_activity = null,
  observed_at_unix_ms = Date.now()} = {}) {
  const activity = dsh_web_activity ?? {status: "unknown", active_agent_count: null,
    retained_model_entry_count: null, retained_turn_terminal_count: null,
    omitted_agent_count: null, agents: []};
  if (typeof runtime_epoch_id !== "string" || !runtime_epoch_id || runtime_epoch_id.length > 256
    || typeof gateway_healthy !== "boolean" || typeof host_running !== "boolean"
    || ![true, false, null].includes(faulted) || ![true, false, null].includes(quarantined)
    || !activity || typeof activity !== "object" || Array.isArray(activity)
    || Object.keys(activity).sort().join(",") !== "active_agent_count,agents,omitted_agent_count,retained_model_entry_count,retained_turn_terminal_count,status"
    || !["observed", "unknown"].includes(activity.status)
    || !Array.isArray(activity.agents) || activity.agents.length > 16
    || activity.agents.some((item, index) => !item || typeof item !== "object"
      || Array.isArray(item) || !["last_turn_evidence,thread_ref",
        "last_turn_evidence,native_turn_state,thread_ref",
        "are_preparation,last_turn_evidence,thread_ref",
        "are_preparation,last_turn_evidence,native_turn_state,thread_ref"].includes(Object.keys(item)
          .filter(key => !['are_interpretation', 'are_plan_head'].includes(key)).sort().join(","))
      || item.are_interpretation !== undefined && !validDshInterpretationSummary(item.are_interpretation)
      || item.are_plan_head !== undefined && !validDshPlanHeadSummary(item.are_plan_head)
      || !/^backend-thread:[0-9a-f]{64}$/u.test(item.thread_ref)
      || !["model-entry-retained", "terminal-retained", "no-retained-turn-event"].includes(item.last_turn_evidence)
      || item.are_preparation !== undefined && (!item.are_preparation
        || typeof item.are_preparation !== "object" || Array.isArray(item.are_preparation)
        || !["route_id,status", "dispatch_relation,route_id,status",
          "objective_checkpoint,route_id,status", "dispatch_relation,objective_checkpoint,route_id,status"].includes(
          Object.keys(item.are_preparation).sort().join(","))
        || item.are_preparation.objective_checkpoint !== undefined
          && !validDshObjectiveCheckpointSummary(item.are_preparation.objective_checkpoint)
        || item.are_preparation.status !== "route-context-prepared"
        || item.are_preparation.dispatch_relation !== undefined
          && !["latest-model-entry", "other-preparation", "not-retained", "legacy-unbound"]
            .includes(item.are_preparation.dispatch_relation)
        || !/^CA2-ROUTE-[A-Z0-9-]{1,80}$/u.test(item.are_preparation.route_id))
      || item.native_turn_state !== undefined && !["not-started", "open-observed",
        "closed-observed", "unknown"].includes(item.native_turn_state)
      || index > 0 && activity.agents[index - 1].thread_ref >= item.thread_ref)
    || (activity.status === "unknown" && (activity.omitted_agent_count !== null
      || activity.agents.length !== 0))
    || (activity.status === "observed" && (!Number.isSafeInteger(activity.omitted_agent_count)
      || activity.omitted_agent_count < 0 || activity.omitted_agent_count > 1024
      || activity.agents.length + activity.omitted_agent_count !== activity.active_agent_count))
    || ["active_agent_count", "retained_model_entry_count", "retained_turn_terminal_count"].some(key =>
      activity.status === "unknown" ? activity[key] !== null
        : !Number.isSafeInteger(activity[key]) || activity[key] < 0 || activity[key] > 262_144)
    || (activity.status === "observed" && activity.active_agent_count > 1024)
    || !Number.isSafeInteger(observed_at_unix_ms) || observed_at_unix_ms < 0) {
    throw new TypeError("dsh-web.adapter-observation-input-invalid");
  }
  const gatewayRunning = gateway_healthy;
  return Object.freeze({schema_version: OBSERVATION_SCHEMA, source: "dsh-web-host-process",
    runtime_epoch_id, observed_at_unix_ms,
    selected_backend_adapter_id: "deepseek-harness-web/are-v1",
    backend_capabilities: {turn_start: "supported", turn_interrupt: "supported",
      turn_steer: "supported", thread_resume: "supported", thread_compact: "unsupported",
      effect_requests: "unsupported", history_persistence: "durable"},
    retained_host_receipts: {status: "unknown", turn_start_accepted: null,
      turn_history_verified: null, steer_accepted: null,
      compaction_turn_accepted: null, compaction_item_completed: null,
      compaction_history_verified: null},
    dsh_web_activity: activity,
    gateway: {status: gatewayRunning ? "running" : "unavailable"},
    client_link: {status: "not-observed"},
    backend: {status: gatewayRunning && host_running ? "running" : "not-observed"},
    selected_path: {status: "not-observed"},
    session_paths: {status: "unknown", total: null, ready: null, initializing: null,
      backend_unavailable: null, detached_backend: null, inactive: null},
    host_method_policy: {status: "not-applicable", codex_version: null,
      known_request_count: null, admitted_request_count: null},
    model_entry_ingress: {status: "unknown", reason_code: null},
    model_wire_guard: {status: "not-declared"},
    hosted_input_attestation: {status: "unknown"},
    mcp_hook_relay_preflight: {status: "unknown"},
    hosted_effect_tool: {status: "disabled"},
    windows_backend_sandbox: {status: "not-configured"},
    session_fault: {status: faulted === null ? "unknown" : faulted ? "observed" : "not-observed"},
    session_quarantine: {status: quarantined === null ? "unknown"
      : quarantined ? "observed" : "not-observed"},
    host_task_control: {status: "unverified"},
    reason_codes: gatewayRunning ? [] : ["dsh-web.gateway-unavailable"],
    authority_effect: "none"});
}

/** Optional, private Unix socket or explicit development loopback observer. */
export async function createDshWebAdapterObservationServer({path = null, tcp_port = null,
  token, observe, recover_stale = false} = {}) {
  if ((path === null) === (tcp_port === null)
    || (path !== null && (typeof path !== "string" || !isAbsolute(path)))
    || (tcp_port !== null && (!Number.isSafeInteger(tcp_port)
      || tcp_port < 0 || tcp_port > 65535 || recover_stale))
    || typeof token !== "string"
    || Buffer.byteLength(token) < 32 || Buffer.byteLength(token) > 256
    || /[\0\r\n]/u.test(token) || typeof observe !== "function"
    || typeof recover_stale !== "boolean") {
    throw new TypeError("dsh-web.adapter-observation-server-input-invalid");
  }
  if (path !== null) {
    const parent = await realpath(dirname(path));
    const parentInfo = await lstat(parent);
    if (!parentInfo.isDirectory() || (parentInfo.mode & 0o077) !== 0
      || typeof process.getuid === "function" && parentInfo.uid !== process.getuid()) {
      throw new Error("dsh-web.adapter-observation-parent-not-private");
    }
    const existing = await lstat(path).catch(error => error?.code === "ENOENT" ? null : Promise.reject(error));
    if (existing) {
      if (!recover_stale) throw new Error("dsh-web.adapter-observation-path-exists");
      await recoverStaleSocket(path, existing);
    }
  }
  const server = createServer(socket => {
    let bytes = Buffer.alloc(0);
    socket.setTimeout(2000, () => socket.destroy());
    socket.on("data", chunk => {
      bytes = Buffer.concat([bytes, chunk]);
      if (bytes.length > MAX_REQUEST_BYTES) return socket.destroy();
      const newline = bytes.indexOf(0x0a);
      if (newline < 0) return;
      socket.removeAllListeners("data");
      let request;
      try { request = JSON.parse(bytes.subarray(0, newline).toString("utf8")); }
      catch { return socket.destroy(); }
      if (request?.schema_version !== REQUEST_SCHEMA
        || typeof request.nonce !== "string" || !/^[A-Za-z0-9_-]{22,128}$/u.test(request.nonce)
        || !sameToken(request.token, token)) return socket.destroy();
      let observation;
      try {
        observation = observe();
        if (observation?.schema_version !== OBSERVATION_SCHEMA
          || observation.source !== "dsh-web-host-process" || typeof observation.then === "function") {
          throw new Error("dsh-web.adapter-observation-invalid");
        }
      } catch { return socket.destroy(); }
      const response = Buffer.from(`${JSON.stringify({schema_version: RESPONSE_SCHEMA,
        nonce: request.nonce, observation, authority_effect: "none"})}\n`);
      if (response.length > MAX_RESPONSE_BYTES) return socket.destroy();
      socket.end(response);
    });
  });
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(path === null ? {host: "127.0.0.1", port: tcp_port} : path,
        () => { server.off("error", reject); resolve(); });
    });
    let socketInfo = null;
    let endpoint = path;
    if (path !== null) {
      await chmod(path, 0o600);
      socketInfo = await lstat(path);
      if (!socketInfo.isSocket()) throw new Error("dsh-web.adapter-observation-socket-invalid");
    } else {
      const address = server.address();
      if (!address || typeof address === "string" || address.address !== "127.0.0.1"
        || !Number.isSafeInteger(address.port) || address.port < 1) {
        throw new Error("dsh-web.adapter-observation-loopback-invalid");
      }
      endpoint = `tcp://127.0.0.1:${address.port}`;
    }
    return Object.freeze({path, endpoint, async close() {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      if (path !== null) {
        const current = await lstat(path).catch(error => error?.code === "ENOENT" ? null : Promise.reject(error));
        if (current?.isSocket() && current.dev === socketInfo.dev && current.ino === socketInfo.ino) {
          await unlink(path);
        }
      }
    }});
  } catch (error) {
    server.close();
    throw error;
  }
}
