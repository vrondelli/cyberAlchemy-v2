#!/usr/bin/env node
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";

import {createCodexAppServerWrapper, createPersistentGateway, deriveGatewayReasoningStateProfile, loadRepositoryProfile, protocolBindingCheck} from "../index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const configArg = argument("--config");
const repositoryRootArg = argument("--repository-root");
const listenArg = argument("--listen");
if (!configArg || !repositoryRootArg || !listenArg) {
  process.stderr.write("Usage: are-codex-gateway --config <profile.json> --repository-root <repository> --listen <gateway.sock> [--backend direct-stdio|daemon-proxy|websocket] [--upstream-socket <app-server.sock>] [--upstream-url ws://127.0.0.1:PORT] [--reasoning-state-dir <directory>] [--session-store <gateway-sessions.jsonl>]\n");
  process.exitCode = 2;
} else {
  const repositoryRoot = resolve(repositoryRootArg);
  const modulePort = createNativeSemanticModulePort();
  const loaded = loadRepositoryProfile(resolve(configArg), repositoryRoot);
  if (!loaded.ok) {
    process.stderr.write(`${JSON.stringify(loaded)}\n`);
    process.exitCode = 3;
  } else {
    let version = "unavailable";
    try { version = execFileSync("codex", ["--version"], {encoding: "utf8"}).trim(); } catch {}
    const protocol = protocolBindingCheck(loaded.value.protocol_binding, version);
    if (!protocol.ok) {
      process.stderr.write(`${JSON.stringify(protocol)}\n`);
      process.exitCode = 4;
    } else {
      const backendMode = argument("--backend") ?? loaded.value.gateway.backend_mode;
      if (backendMode === "daemon-proxy") {
        let daemonVersion = null;
        try {
          daemonVersion = JSON.parse(execFileSync("codex", ["app-server", "daemon", "version"], {encoding: "utf8"}));
        } catch (error) {
          process.stderr.write(`${JSON.stringify({schema_version: "are.codex-gateway-start-failure/v1", reason: "gateway.daemon-unavailable", detail: error.message, authority_effect: "none"})}\n`);
          process.exit(5);
        }
        const versionStrings = JSON.stringify(daemonVersion);
        if (!versionStrings.includes(loaded.value.protocol_binding.observed_codex_version.replace("codex-cli ", ""))) {
          process.stderr.write(`${JSON.stringify({schema_version: "are.codex-gateway-start-failure/v1", reason: "gateway.daemon-version-drift", expected: loaded.value.protocol_binding.observed_codex_version, observed: daemonVersion, authority_effect: "none"})}\n`);
          process.exit(6);
        }
      }
      const allowed = new Map(loaded.value.gateway.allowed_clients.map((client) => [client.consumer_id, client]));
      const gateway = createPersistentGateway({
        listen_path: resolve(listenArg),
        backend: {
          mode: backendMode,
          socket_path: argument("--upstream-socket"),
          url: argument("--upstream-url"),
        },
        max_clients: loaded.value.gateway.max_clients,
        max_buffered_messages_per_client: loaded.value.gateway.max_buffered_messages_per_client,
        reconnect: loaded.value.gateway.reconnect,
        detach_timeout_ms: loaded.value.gateway.detach_timeout_ms,
        idle_timeout_ms: loaded.value.gateway.idle_timeout_ms,
        max_retained_bytes_per_session: loaded.value.gateway.max_retained_bytes_per_session,
        max_reasoning_log_bytes_per_session: loaded.value.gateway.max_reasoning_log_bytes_per_session,
        expiration_tombstone_ttl_ms: loaded.value.gateway.expiration_tombstone_ttl_ms,
        eviction_retry_ms: loaded.value.gateway.eviction_retry_ms,
        session_store_path: argument("--session-store") ?? loaded.value.gateway.session_store.path,
        on_backend_stderr: (chunk) => process.stderr.write(chunk),
        authorize_client: ({consumer_id, lane}) => allowed.get(consumer_id)?.lane === lane,
        wrapper_factory: ({consumer_id, lane}) => {
          const profile = structuredClone(loaded.value);
          profile.turn_bindings.default = {
            ...profile.turn_bindings.default,
            lane,
            consumer_ref: consumer_id,
            purpose: lane === "plan-bound" ? "persistent-plan-client" : "persistent-human-chat-client",
            ...(lane === "plan-bound" ? {window_ref: allowed.get(consumer_id).window_ref, request_id: allowed.get(consumer_id).request_id} : {}),
          };
          profile.reasoning_state = deriveGatewayReasoningStateProfile(loaded.value, consumer_id, argument("--reasoning-state-dir"));
          return createCodexAppServerWrapper({
            loaded_profile: profile,
            decision_profile: loaded.decision_profile,
            definition_catalog: loaded.definition_catalog,
            ontology_snapshot: loaded.ontology_snapshot,
            source_snapshot: loaded.source_snapshot,
            context_source_provider: loaded.context_source_provider,
            semantic_profile: loaded.semantic_profile,
            module_port: modulePort,
          });
        },
      });
      await gateway.start();
      process.stderr.write(`${JSON.stringify({schema_version: "are.codex-gateway-ready/v1", listen_path: resolve(listenArg), backend_mode: backendMode, observed_codex_version: version, authority_effect: "none"})}\n`);
      let closing = false;
      const close = async () => {
        if (closing) return;
        closing = true;
        await gateway.close();
      };
      process.once("SIGINT", () => close().finally(() => process.exit(0)));
      process.once("SIGTERM", () => close().finally(() => process.exit(0)));
    }
  }
}
