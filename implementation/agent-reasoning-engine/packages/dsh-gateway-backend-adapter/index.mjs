import {spawn} from "node:child_process";
import {existsSync, statSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {createDshRunner, resolveBundledDshEntry} from "./src/dsh-runner.mjs";
import {gatewayPrivateEnvironmentKey} from "../codex-app-server-wrapper/src/backend-environment.mjs";

const SERVER_ENTRY = fileURLToPath(new URL("./bin/are-dsh-app-server.mjs", import.meta.url));
export const DSH_GATEWAY_BACKEND_ADAPTER_SCHEMA = "are.gateway-backend-adapter/v1";
const DSH_HOST_REQUESTS = new Set(["initialize", "thread/start", "thread/resume", "thread/close", "turn/start", "turn/interrupt", "turn/steer", "thread/compact/start"]);
const ARE_LOCAL_REQUESTS = new Set(["cyberalchemy/continuation/registerPlan", "cyberalchemy/continuation/registerInteraction",
  "cyberalchemy/intent/get", "cyberalchemy/intent/project", "cyberalchemy/intent/control"]);
const DSH_SERVER_NOTIFICATIONS = new Set(["item/agentMessage/delta", "item/started", "item/completed",
  "turn/started", "turn/completed", "are/adapterTelemetry"]);

function dshClientMethodPosture(message) {
  if (typeof message?.method !== "string") return {kind: "rejected", reason_code: "backend.response-unexpected"};
  const request = Object.hasOwn(message, "id");
  if (request && ARE_LOCAL_REQUESTS.has(message.method)) return {kind: "admitted-local"};
  if (request && DSH_HOST_REQUESTS.has(message.method)) return {kind: "admitted-host"};
  if (!request && message.method === "initialized") return {kind: "admitted-host"};
  return {kind: "rejected", reason_code: "backend.method-unsupported"};
}

function dshServerMethodPosture(message) {
  if (!Object.hasOwn(message, "method")) {
    return Object.hasOwn(message, "result") !== Object.hasOwn(message, "error")
      ? {kind: "response"} : {kind: "rejected", reason_code: "dsh.server-response-shape-invalid"};
  }
  if (Object.hasOwn(message, "id") || !DSH_SERVER_NOTIFICATIONS.has(message.method)) {
    return {kind: "rejected", reason_code: "dsh.server-method-unknown"};
  }
  const threadId = message.params?.threadId;
  if (typeof threadId !== "string" || !threadId || threadId !== threadId.trim()
    || Buffer.byteLength(threadId, "utf8") > 256) {
    return {kind: "rejected", reason_code: "dsh.server-thread-id-required"};
  }
  return {kind: "scoped", thread_id: threadId};
}

function optionalString(value, name) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} must be a non-empty string.`);
  return value;
}

function optionalPositiveInteger(value, name) {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive safe integer.`);
  return value;
}

function inheritedRuntimeEnvironment() {
  const keys = ["PATH", "Path", "SystemRoot", "WINDIR", "TEMP", "TMP", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"];
  return Object.fromEntries(keys.filter((key) => typeof process.env[key] === "string").map((key) => [key, process.env[key]]));
}

export function createDshGatewayBackendAdapter(defaults = {}) {
  const defaultEntry = optionalString(defaults.dsh_entry, "dsh_entry");
  const defaultPatch = optionalString(defaults.patch_path, "patch_path");
  const defaultHome = optionalString(defaults.dsh_home, "dsh_home");
  const defaultWorkspaceRoot = optionalString(defaults.workspace_root, "workspace_root");
  const defaultTimeoutMs = optionalPositiveInteger(defaults.turn_timeout_ms, "turn_timeout_ms");
  const defaultMaxThreads = optionalPositiveInteger(defaults.max_threads, "max_threads");
  const defaultMaxPromptBytes = optionalPositiveInteger(defaults.max_prompt_bytes, "max_prompt_bytes");
  const defaultMaxHistoryBytes = optionalPositiveInteger(defaults.max_history_bytes, "max_history_bytes");
  const defaultMaxActiveTurns = optionalPositiveInteger(defaults.max_active_turns, "max_active_turns");
  const defaultThreadIdleTtlMs = optionalPositiveInteger(defaults.thread_idle_ttl_ms, "thread_idle_ttl_ms");
  const defaultPersistenceMode = defaults.persistence_mode;
  if (defaultPersistenceMode !== undefined && !["ephemeral", "durable"].includes(defaultPersistenceMode)) throw new TypeError("persistence_mode must be ephemeral or durable.");
  return Object.freeze({
    schema_version: DSH_GATEWAY_BACKEND_ADAPTER_SCHEMA,
    adapter_id: "deepseek-harness-headless/v1",
    protocol: "json-rpc-2.0/json-lines",
    thread_ownership: "gateway-created",
    lifecycle_contract: Object.freeze({schema_version: "are.gateway-backend-lifecycle/v1",
      session_kind: "adapter-replay-thread", history_source: "adapter-replay-history",
      turn_acceptance: "rpc-in-progress", turn_terminal: "turn/completed",
      client_ingress: "unverified", authority_effect: "none"}),
    client_method_posture: dshClientMethodPosture,
    server_method_posture: dshServerMethodPosture,
    authority_effect: "none",
    capabilities(configuration = {}) {
      const persistenceMode = configuration.persistence_mode ?? defaultPersistenceMode ?? "ephemeral";
      if (!["ephemeral", "durable"].includes(persistenceMode)) throw new TypeError("persistence_mode must be ephemeral or durable.");
      return Object.freeze({
        operations: {
          turn_start: "supported",
          turn_interrupt: "supported",
          turn_steer: "unsupported",
          thread_resume: "supported",
          thread_compact: "unsupported",
          effect_requests: "unsupported",
        },
        history_persistence: persistenceMode,
      });
    },
    preflight(configuration = {}) {
      const dshEntry = optionalString(configuration.dsh_entry, "dsh_entry") ?? defaultEntry ?? resolveBundledDshEntry();
      const workspaceRoot = optionalString(configuration.workspace_root, "workspace_root") ?? defaultWorkspaceRoot;
      const persistenceMode = configuration.persistence_mode ?? defaultPersistenceMode ?? "ephemeral";
      const dshHome = optionalString(configuration.dsh_home, "dsh_home") ?? defaultHome;
      const reasons = [];
      if (!["ephemeral", "durable"].includes(persistenceMode)) reasons.push("dsh.persistence-mode-invalid");
      if (persistenceMode === "durable" && !dshHome) reasons.push("dsh.durable-store-root-missing");
      if (!existsSync(dshEntry) || !statSync(dshEntry).isFile()) reasons.push("dsh.entry-unavailable");
      if (workspaceRoot && (!existsSync(workspaceRoot) || !statSync(workspaceRoot).isDirectory())) reasons.push("dsh.workspace-root-unavailable");
      if (dshHome && (!existsSync(dshHome) || !statSync(dshHome).isDirectory())) reasons.push("dsh.home-unavailable");
      const runner = reasons.length === 0 ? (() => { try { return createDshRunner({dsh_entry: dshEntry, patch_path: optionalString(configuration.patch_path, "patch_path") ?? defaultPatch}); } catch { return null; } })() : null;
      if (!runner && reasons.length === 0) reasons.push("dsh.capability-attestation-unavailable");
      return Object.freeze({ok: reasons.length === 0, adapter_id: "deepseek-harness-headless/v1", dsh_entry: dshEntry, workspace_root: workspaceRoot ?? null, persistence_mode: persistenceMode, capability_attestation: runner?.capability_attestation ?? null, reason_codes: [...new Set(reasons)], authority_effect: "none"});
    },
    spawn(configuration = {}, dependencies = {}) {
      if (Object.keys({...defaults.env, ...configuration.env}).some(gatewayPrivateEnvironmentKey)) {
        throw new TypeError("Gateway private credentials cannot be passed to a DSH backend.");
      }
      const spawnImpl = dependencies.spawn_impl ?? spawn;
      const dshEntry = optionalString(configuration.dsh_entry, "dsh_entry") ?? defaultEntry;
      const patchPath = optionalString(configuration.patch_path, "patch_path") ?? defaultPatch;
      const dshHome = optionalString(configuration.dsh_home, "dsh_home") ?? defaultHome;
      const workspaceRoot = optionalString(configuration.workspace_root, "workspace_root") ?? defaultWorkspaceRoot;
      const turnTimeoutMs = optionalPositiveInteger(configuration.turn_timeout_ms, "turn_timeout_ms") ?? defaultTimeoutMs;
      const maxThreads = optionalPositiveInteger(configuration.max_threads, "max_threads") ?? defaultMaxThreads;
      const maxPromptBytes = optionalPositiveInteger(configuration.max_prompt_bytes, "max_prompt_bytes") ?? defaultMaxPromptBytes;
      const maxHistoryBytes = optionalPositiveInteger(configuration.max_history_bytes, "max_history_bytes") ?? defaultMaxHistoryBytes;
      const maxActiveTurns = optionalPositiveInteger(configuration.max_active_turns, "max_active_turns") ?? defaultMaxActiveTurns;
      const threadIdleTtlMs = optionalPositiveInteger(configuration.thread_idle_ttl_ms, "thread_idle_ttl_ms") ?? defaultThreadIdleTtlMs;
      const persistenceMode = configuration.persistence_mode ?? defaultPersistenceMode ?? "ephemeral";
      if (!["ephemeral", "durable"].includes(persistenceMode)) throw new TypeError("persistence_mode must be ephemeral or durable.");
      const env = {
        ...inheritedRuntimeEnvironment(),
        ...defaults.env,
        ...configuration.env,
        ARE_DSH_PASSTHROUGH_ENV: [...new Set([...Object.keys(defaults.env ?? {}), ...Object.keys(configuration.env ?? {})])].sort().join(","),
        ...(dshEntry ? {ARE_DSH_ENTRY: dshEntry} : {}),
        ...(patchPath ? {ARE_DSH_PATCH_PATH: patchPath} : {}),
        ...(dshHome ? {DSH_HOME: dshHome} : {}),
        ...(workspaceRoot ? {ARE_DSH_WORKSPACE_ROOT: workspaceRoot} : {}),
        ...(turnTimeoutMs ? {ARE_DSH_TURN_TIMEOUT_MS: String(turnTimeoutMs)} : {}),
        ...(maxThreads ? {ARE_DSH_MAX_THREADS: String(maxThreads)} : {}),
        ...(maxPromptBytes ? {ARE_DSH_MAX_PROMPT_BYTES: String(maxPromptBytes)} : {}),
        ...(maxHistoryBytes ? {ARE_DSH_MAX_HISTORY_BYTES: String(maxHistoryBytes)} : {}),
        ...(maxActiveTurns ? {ARE_DSH_MAX_ACTIVE_TURNS: String(maxActiveTurns)} : {}),
        ...(threadIdleTtlMs ? {ARE_DSH_THREAD_IDLE_TTL_MS: String(threadIdleTtlMs)} : {}),
        ARE_DSH_PERSISTENCE_MODE: persistenceMode,
        DSH_PERMISSION_MODE: "read-only",
        DSH_TELEMETRY_DISABLED: "1",
      };
      return spawnImpl(process.execPath, [SERVER_ENTRY], {stdio: ["pipe", "pipe", "pipe"], env});
    },
  });
}
