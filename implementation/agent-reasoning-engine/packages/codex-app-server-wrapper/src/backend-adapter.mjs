import {spawn} from "node:child_process";

import {spawnCodexBackend} from "./backend.mjs";
import {GATEWAY_BACKEND_LIFECYCLE_SCHEMA, validateGatewayBackendLifecycle} from "./backend-lifecycle-contract.mjs";
import {freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const GATEWAY_BACKEND_ADAPTER_SCHEMA = "are.gateway-backend-adapter/v1";
export const GATEWAY_BACKEND_CAPABILITIES_SCHEMA = "are.gateway-backend-capabilities/v1";
const CAPABILITY_NAMES = ["turn_start", "turn_interrupt", "turn_steer", "thread_resume", "thread_compact", "effect_requests"];
const CAPABILITY_POSTURES = new Set(["supported", "unsupported", "unknown"]);
const THREAD_OWNERSHIP_POSTURES = new Set(["gateway-created", "unverified"]);

export function gatewayBackendCapabilities(adapter, configuration = {}) {
  const declared = typeof adapter.capabilities === "function" ? adapter.capabilities(configuration) : null;
  const operations = Object.fromEntries(CAPABILITY_NAMES.map((name) => [name, declared?.operations?.[name] ?? "unknown"]));
  if (Object.values(operations).some((posture) => !CAPABILITY_POSTURES.has(posture))) {
    throw new TypeError(`Gateway backend adapter ${adapter.adapter_id} declared an invalid capability posture.`);
  }
  const historyPersistence = declared?.history_persistence ?? "unknown";
  if (!["durable", "ephemeral", "unknown"].includes(historyPersistence)) {
    throw new TypeError(`Gateway backend adapter ${adapter.adapter_id} declared invalid history persistence.`);
  }
  return freezeResult({
    schema_version: GATEWAY_BACKEND_CAPABILITIES_SCHEMA,
    adapter_id: adapter.adapter_id,
    operations,
    history_persistence: historyPersistence,
    authority_effect: "none",
  });
}

function validBackendProcess(value) {
  return value
    && value.stdin && typeof value.stdin.write === "function"
    && value.stdout && typeof value.stdout.on === "function"
    && value.stderr && typeof value.stderr.on === "function"
    && typeof value.on === "function"
    && typeof value.kill === "function";
}

export function validateGatewayBackendAdapter(adapter) {
  const reasonCodes = [];
  if (!isRecord(adapter)) reasonCodes.push("backend-adapter.not-object");
  else {
    if (adapter.schema_version !== GATEWAY_BACKEND_ADAPTER_SCHEMA) reasonCodes.push("backend-adapter.schema-version-invalid");
    if (!nonEmptyString(adapter.adapter_id)) reasonCodes.push("backend-adapter.id-invalid");
    if (adapter.thread_ownership !== undefined && !THREAD_OWNERSHIP_POSTURES.has(adapter.thread_ownership)) reasonCodes.push("backend-adapter.thread-ownership-invalid");
    if (adapter.lifecycle_contract !== undefined && !validateGatewayBackendLifecycle(adapter.lifecycle_contract).ok) reasonCodes.push("backend-adapter.lifecycle-contract-invalid");
    if (adapter.client_method_posture !== undefined && typeof adapter.client_method_posture !== "function") reasonCodes.push("backend-adapter.client-method-posture-invalid");
    if (adapter.server_method_posture !== undefined && typeof adapter.server_method_posture !== "function") reasonCodes.push("backend-adapter.server-method-posture-invalid");
    if (typeof adapter.spawn !== "function") reasonCodes.push("backend-adapter.spawn-missing");
  }
  return freezeResult({ok: reasonCodes.length === 0, reason_codes: reasonCodes, authority_effect: "none"});
}

export function spawnGatewayBackend(adapter, configuration = {}, dependencies = {}) {
  const validation = validateGatewayBackendAdapter(adapter);
  if (!validation.ok) throw new TypeError(`Invalid gateway backend adapter: ${validation.reason_codes.join(",")}`);
  const child = adapter.spawn(configuration, dependencies);
  if (!validBackendProcess(child)) throw new TypeError(`Gateway backend adapter ${adapter.adapter_id} returned an invalid process transport.`);
  return child;
}

export function createCodexGatewayBackendAdapter() {
  return Object.freeze({
    schema_version: GATEWAY_BACKEND_ADAPTER_SCHEMA,
    adapter_id: "codex-app-server/v1",
    protocol: "json-rpc-2.0/json-lines",
    thread_ownership: "gateway-created",
    lifecycle_contract: Object.freeze({schema_version: GATEWAY_BACKEND_LIFECYCLE_SCHEMA,
      session_kind: "native-host-thread", history_source: "native-host-history",
      turn_acceptance: "rpc-in-progress", turn_terminal: "turn/completed",
      client_ingress: "unverified", authority_effect: "none"}),
    spawn: (configuration, dependencies = {}) => spawnCodexBackend(
      configuration,
      dependencies.spawn_impl ?? spawn,
      dependencies.websocket_impl ?? globalThis.WebSocket,
    ),
    authority_effect: "none",
  });
}

export function createJsonLineProcessBackendAdapter(options = {}) {
  if (!nonEmptyString(options.adapter_id)) throw new TypeError("A process backend adapter_id is required.");
  return Object.freeze({
    schema_version: GATEWAY_BACKEND_ADAPTER_SCHEMA,
    adapter_id: options.adapter_id,
    protocol: options.protocol ?? "json-rpc-2.0/json-lines",
    thread_ownership: options.thread_ownership ?? "unverified",
    ...(options.lifecycle_contract ? {lifecycle_contract: options.lifecycle_contract} : {}),
    ...(options.client_method_posture ? {client_method_posture: options.client_method_posture} : {}),
    ...(options.server_method_posture ? {server_method_posture: options.server_method_posture} : {}),
    spawn: (configuration = {}, dependencies = {}) => {
      const command = configuration.command ?? options.command;
      const args = configuration.args ?? options.args ?? [];
      if (!nonEmptyString(command)) throw new TypeError(`Gateway backend adapter ${options.adapter_id} requires a command.`);
      if (!Array.isArray(args) || args.some((arg) => !nonEmptyString(arg))) throw new TypeError(`Gateway backend adapter ${options.adapter_id} args must be non-empty strings.`);
      const spawnImpl = dependencies.spawn_impl ?? spawn;
      return spawnImpl(command, [...args], {stdio: ["pipe", "pipe", "pipe"]});
    },
    authority_effect: "none",
  });
}
