import {spawn} from "node:child_process";

import {spawnCodexBackend} from "./backend.mjs";
import {freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const GATEWAY_BACKEND_ADAPTER_SCHEMA = "are.gateway-backend-adapter/v1";

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
