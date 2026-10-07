#!/usr/bin/env node
import {execFileSync} from "node:child_process";
import {realpathSync, statSync} from "node:fs";
import {isAbsolute, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {classifyBackendDiagnostic, createCodexAppServerWrapper, createPersistentGateway, deriveGatewayReasoningStateProfile, loadRepositoryProfile, loadVerifiedRepositoryRuntimeBundle, protocolBindingCheck, resolveEntrypointContinuity} from "../index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";
import {resolveGatewayIpcPath} from "../src/local-ipc.mjs";
import {verifyHostMethodCatalog} from "../src/host-catalog-verification.mjs";
import {selectHostedFeedbackCueProvider} from "../src/hosted-feedback-cues.mjs";
import {resolveHostedEffectRoot} from "../src/hosted-effect-root.mjs";
import {validHostedInputAttestationKey} from "../src/hosted-input-attestation.mjs";
import {desktopHostProfile} from "../src/desktop-host-profile.mjs";
import {sha256PinnedBackend} from "../src/pinned-backend-digest.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function repeatedArguments(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] !== name) continue;
    const value = process.argv[index + 1];
    if (!value || value === name) throw new TypeError(`${name} requires a value.`);
    values.push(value);
    index += 1;
  }
  return values;
}

const configArg = argument("--config");
const repositoryRootArg = argument("--repository-root");
const listenArg = argument("--listen");
const developmentLive = process.argv.includes("--development-live");
const observationSocketArg = argument("--development-observation-socket");
const observationTcpPortArg = argument("--development-observation-tcp-port");
const evolutionSignalLogArg = argument("--evolution-signal-log");
const turnIngressBlockedReason = argument("--managed-turn-ingress-blocked-reason");
const requireMcpHookRelay = process.argv.includes("--require-mcp-hook-relay");
const requireRestrictedMcpCatalog = process.argv.includes("--require-restricted-mcp-catalog");
const allowHostedEffects = process.argv.includes("--allow-hosted-effects");
const windowsBackendSandboxMode = argument("--windows-backend-sandbox-mode");
const windowsBackendWorkspaceRoot = argument("--windows-backend-workspace-root");
if (process.platform === "win32" && allowHostedEffects) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1",
    reason: "gateway.windows-hosted-effect-sandbox-unverified", authority_effect: "none"})}\n`);
  process.exit(2);
}
const managedModelWireGuardExpected = process.argv.includes("--managed-model-wire-guard-expected");
const managedIpcMarker = process.env.ARE_MANAGED_IPC_REQUIRED;
const managedIpcRequired = managedIpcMarker === "bound-by-managed-launcher/v1";
const hostedEffectRootArg = argument("--hosted-effect-root");
const restrictedHostConfigSha256 = argument("--restricted-host-config-sha256");
const codexCommand = argument("--codex-command") ?? "codex";
const codexPrefixArgs = repeatedArguments("--codex-prefix-arg");
const desktopHostProfileArg = argument("--desktop-host-profile");
const desktopBackendSha256Arg = argument("--desktop-backend-sha256");
const runtimeBundleArg = argument("--runtime-bundle") ?? fileURLToPath(new URL("../profiles/repository-runtime-v1.json", import.meta.url));
if (!listenArg || (developmentLive && (!configArg || !repositoryRootArg)) || (process.argv.includes("--development-observation-socket") && (!observationSocketArg || observationSocketArg.startsWith("--") || !developmentLive))
  || (process.argv.includes("--development-observation-tcp-port") && (!developmentLive
    || !/^[1-9][0-9]{0,4}$/.test(observationTcpPortArg ?? "")
    || Number(observationTcpPortArg) > 65535 || observationSocketArg !== null))
  || (process.argv.includes("--managed-turn-ingress-blocked-reason")
    && turnIngressBlockedReason !== "windows-client.hook-boundary-unverified")
  || (requireRestrictedMcpCatalog && (!/^[0-9a-f]{64}$/.test(restrictedHostConfigSha256 ?? "")
    || !process.env.CODEX_HOME))
  || (!requireRestrictedMcpCatalog && restrictedHostConfigSha256 !== null)
  || (allowHostedEffects !== Boolean(hostedEffectRootArg))
  || (windowsBackendSandboxMode !== null && (process.platform !== "win32"
    || !["elevated", "unelevated"].includes(windowsBackendSandboxMode)
    || !managedIpcRequired || !requireRestrictedMcpCatalog
    || !windowsBackendWorkspaceRoot))
  || (windowsBackendSandboxMode === null && windowsBackendWorkspaceRoot !== null)
  || (managedIpcMarker !== undefined && (!managedIpcRequired || !process.connected))
  || (managedModelWireGuardExpected && !managedIpcRequired)
  || ((desktopHostProfileArg === null) !== (desktopBackendSha256Arg === null))
  || ((requireMcpHookRelay || requireRestrictedMcpCatalog || allowHostedEffects) && argument("--backend-agent") === "dsh")) {
  process.stderr.write("Usage: are-codex-gateway --listen <gateway.sock> [--runtime-bundle <bundle.json> | --development-live --config <profile.json> --repository-root <repository>] [--backend-agent codex|dsh] [--backend direct-stdio|daemon-proxy|websocket] [--codex-command <path>] [--codex-prefix-arg <arg>]... [--desktop-host-profile <id> --desktop-backend-sha256 <sha256>] [--upstream-socket <app-server.sock>] [--upstream-url ws://127.0.0.1:PORT] [--dsh-entry <file>] [--dsh-patch <file>] [--dsh-home <directory>] [--dsh-workspace-root <directory>] [--dsh-persistence-mode ephemeral|durable] [--dsh-turn-timeout-ms <milliseconds>] [--dsh-env-allowlist NAME,NAME] [--reasoning-state-dir <directory>] [--session-store <gateway-sessions.jsonl>] [--evolution-signal-log <absolute-private-path>] [--development-observation-socket <path> | --development-observation-tcp-port <port>] [--managed-turn-ingress-blocked-reason windows-client.hook-boundary-unverified] [--require-mcp-hook-relay] [--require-restricted-mcp-catalog --restricted-host-config-sha256 <sha256> with CODEX_HOME] [--allow-hosted-effects --hosted-effect-root <selected-checkout>] [--continuity-state <snapshot.json> | --continuity-activation <manifest.json>]\n");
  process.exitCode = 2;
} else {
  const listenPath = resolveGatewayIpcPath(listenArg);
  const observationPath = observationSocketArg ? resolveGatewayIpcPath(observationSocketArg) : null;
  const repositoryRoot = resolve(repositoryRootArg ?? process.cwd());
  let hostedEffectRoot = null;
  if (allowHostedEffects) {
    try { hostedEffectRoot = resolveHostedEffectRoot({repository_root: repositoryRoot,
      effect_root: hostedEffectRootArg}); }
    catch (error) {
      process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1",
        reason: error.message, authority_effect: "none"})}\n`);
      process.exit(2);
    }
  }
  const modulePort = createNativeSemanticModulePort();
  const loaded = developmentLive
    ? loadRepositoryProfile(resolve(configArg), repositoryRoot)
    : loadVerifiedRepositoryRuntimeBundle(resolve(runtimeBundleArg));
  if (!loaded.ok) {
    process.stderr.write(`${JSON.stringify(loaded)}\n`);
    process.exitCode = 3;
  } else {
    const backendAgent = argument("--backend-agent") ?? "codex";
    if (!["codex", "dsh"].includes(backendAgent)) {
      process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: "gateway.backend-agent-unsupported", backend_agent: backendAgent, authority_effect: "none"})}\n`);
      process.exit(8);
    }
    const desktopProfile = desktopHostProfileArg === null ? null : desktopHostProfile(desktopHostProfileArg);
    let desktopBackendCommand = codexCommand;
    let desktopBackendBinding = null;
    if (desktopHostProfileArg !== null) {
      let reason = null;
      let diagnosticCode = null;
      if (backendAgent !== "codex" || (argument("--backend") ?? loaded.value.gateway.backend_mode) !== "direct-stdio"
        || codexPrefixArgs.length > 0 || !desktopProfile || !isAbsolute(codexCommand)
        || !/^[0-9a-f]{64}$/.test(desktopBackendSha256Arg ?? "")) reason = "gateway.desktop-backend-invalid";
      else {
        try {
          desktopBackendCommand = realpathSync(codexCommand);
          if (!statSync(desktopBackendCommand).isFile()) {
            reason = "gateway.desktop-backend-digest-drift";
          } else {
            if (await sha256PinnedBackend(desktopBackendCommand) !== desktopBackendSha256Arg) {
              reason = "gateway.desktop-backend-digest-drift";
            }
          }
        } catch (error) {
          reason = "gateway.desktop-backend-unreadable";
          diagnosticCode = error?.code ?? error?.name ?? "unknown";
        }
      }
      if (reason) {
        process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1",
          reason, ...(diagnosticCode ? {diagnostic_code: diagnosticCode} : {}),
          authority_effect: "none"})}\n`);
        process.exit(13);
      }
      desktopBackendBinding = {binary_sha256: desktopBackendSha256Arg, host_profile: desktopHostProfileArg};
    }
    const hostCatalogVerification = backendAgent === "codex"
      ? verifyHostMethodCatalog({command: desktopBackendCommand, prefix_args: codexPrefixArgs}) : null;
    const version = backendAgent === "codex" ? hostCatalogVerification.observed_codex_version ?? "unavailable" : null;
    const protocol = backendAgent === "codex" ? protocolBindingCheck(loaded.value.protocol_binding, version) : {ok: true};
    if (!protocol.ok) {
      process.stderr.write(`${JSON.stringify(protocol)}\n`);
      process.exitCode = 4;
    } else if (backendAgent === "codex" && !hostCatalogVerification.ok) {
      process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1",
        reason: "gateway.host-method-catalog-verification-failed", verification: hostCatalogVerification,
        authority_effect: "none"})}\n`);
      process.exitCode = 4;
    } else {
      const continuity = resolveEntrypointContinuity({loaded_profile: loaded.value, repository_root: repositoryRoot, activation_manifest_path: argument("--continuity-activation"), state_path: argument("--continuity-state")});
      if (!continuity.ok) {
        process.stderr.write(`${JSON.stringify(continuity)}\n`);
        process.exitCode = 7;
        process.exit();
      }
      const effectiveProfile = continuity.loaded_profile;
      const hostedInputKey = process.env.ARE_HOSTED_INPUT_ATTESTATION_KEY ?? null;
      if (effectiveProfile.interaction_learning?.enabled === true
        && !validHostedInputAttestationKey(hostedInputKey)) {
        process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1",
          reason: "gateway.hosted-input-attestation-required", authority_effect: "none"})}\n`);
        process.exit(12);
      }
      const evolutionEnabled = effectiveProfile.evolution_signals?.enabled === true;
      if (evolutionEnabled && (!evolutionSignalLogArg || backendAgent !== "codex")) {
        process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: backendAgent !== "codex" ? "gateway.evolution-signal-backend-unsupported" : "gateway.evolution-signal-log-required", authority_effect: "none"})}\n`);
        process.exit(11);
      }
      if (!evolutionEnabled && evolutionSignalLogArg) {
        process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: "gateway.evolution-signals-disabled", authority_effect: "none"})}\n`);
        process.exit(11);
      }
      const backendMode = argument("--backend") ?? effectiveProfile.gateway.backend_mode;
      if (backendAgent === "codex" && backendMode === "daemon-proxy") {
        let daemonVersion = null;
        try {
          daemonVersion = JSON.parse(execFileSync(codexCommand, [...codexPrefixArgs, "app-server", "daemon", "version"], {encoding: "utf8"}));
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
      const allowed = new Map(effectiveProfile.gateway.allowed_clients.map((client) => [client.consumer_id, client]));
      const positiveArgument = (name) => {
        const value = argument(name);
        if (value === null) return undefined;
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`${name} must be a positive safe integer.`);
        return parsed;
      };
      const dshConfiguration = backendAgent === "dsh" ? {
        dsh_entry: argument("--dsh-entry") ?? undefined,
        patch_path: argument("--dsh-patch") ?? undefined,
        dsh_home: argument("--dsh-home") ?? undefined,
        persistence_mode: argument("--dsh-persistence-mode") ?? "ephemeral",
        workspace_root: resolve(argument("--dsh-workspace-root") ?? repositoryRoot),
        turn_timeout_ms: positiveArgument("--dsh-turn-timeout-ms"),
      } : null;
      const dshEnvironment = {};
      if (backendAgent === "dsh" && argument("--dsh-env-allowlist")) {
        for (const key of argument("--dsh-env-allowlist").split(",").map((item) => item.trim()).filter(Boolean)) {
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new TypeError(`Invalid DSH environment key: ${key}`);
          if (typeof process.env[key] !== "string") throw new TypeError(`Missing allowlisted DSH environment key: ${key}`);
          dshEnvironment[key] = process.env[key];
        }
      }
      let selectedBackendAdapter = null;
      if (backendAgent === "dsh") {
        try {
          const dshModuleUrl = new URL(["..", "..", "dsh-gateway-backend-adapter", "index.mjs"].join("/"), import.meta.url);
          const {createDshGatewayBackendAdapter} = await import(dshModuleUrl);
          selectedBackendAdapter = createDshGatewayBackendAdapter({env: dshEnvironment});
        } catch (error) {
          process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: "gateway.optional-backend-unavailable", backend_agent: backendAgent, detail: error.code ?? error.name, authority_effect: "none"})}\n`);
          process.exit(10);
        }
      }
      const backendPreflight = selectedBackendAdapter?.preflight(dshConfiguration);
      if (backendPreflight && !backendPreflight.ok) {
        process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: "gateway.backend-preflight-failed", backend_preflight: backendPreflight, authority_effect: "none"})}\n`);
        process.exit(9);
      }
      let evolutionSignalIntake = null;
      const gateway = createPersistentGateway({
        listen_path: listenPath,
        ...(observationSocketArg || observationTcpPortArg ? {
          ...(observationSocketArg ? {observation_listen_path: observationPath}
            : {observation_tcp_port: Number(observationTcpPortArg)}),
          observation_token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN,
        } : {}),
        ...(process.env.ARE_GATEWAY_CONNECTION_TOKEN ? {connection_token: process.env.ARE_GATEWAY_CONNECTION_TOKEN} : {}),
        ...(hostedInputKey ? {hosted_input_attestation_key: hostedInputKey,
          hosted_input_consumer_id: "codex:human-chat"} : {}),
        backend: backendAgent === "dsh" ? dshConfiguration : {
          mode: backendMode,
          command: desktopBackendCommand,
          command_prefix_args: desktopProfile?.prefix_args ?? codexPrefixArgs,
          ...(desktopProfile ? {command_app_server_args: desktopProfile.app_server_args} : {}),
          socket_path: argument("--upstream-socket"),
          url: argument("--upstream-url"),
        },
        backend_process_guard: backendAgent === "codex" && backendMode === "direct-stdio" ? "acknowledged-only" : "off",
        ...(backendAgent === "codex" ? {expected_codex_version: version} : {}),
        ...(desktopBackendBinding ? {desktop_backend_binding: desktopBackendBinding} : {}),
        ...(turnIngressBlockedReason ? {turn_ingress_blocked_reason: turnIngressBlockedReason} : {}),
        managed_model_wire_guard_expected: managedModelWireGuardExpected,
        require_mcp_hook_relay: requireMcpHookRelay,
        allow_hosted_effect_tool: allowHostedEffects,
        ...(windowsBackendSandboxMode ? {windows_backend_sandbox_attestation: {
          mode: windowsBackendSandboxMode, workspace_root: resolve(windowsBackendWorkspaceRoot),
          node_command: process.execPath}} : {}),
        require_restricted_mcp_catalog: requireRestrictedMcpCatalog,
        ...(requireRestrictedMcpCatalog ? {restricted_host_config: {
          codex_home: process.env.CODEX_HOME, sha256: restrictedHostConfigSha256}} : {}),
        ...(selectedBackendAdapter ? {backend_adapter: selectedBackendAdapter} : {}),
        max_clients: effectiveProfile.gateway.max_clients,
        max_buffered_messages_per_client: effectiveProfile.gateway.max_buffered_messages_per_client,
        reconnect: effectiveProfile.gateway.reconnect,
        detach_timeout_ms: effectiveProfile.gateway.detach_timeout_ms,
        idle_timeout_ms: effectiveProfile.gateway.idle_timeout_ms,
        max_retained_bytes_per_session: effectiveProfile.gateway.max_retained_bytes_per_session,
        max_reasoning_log_bytes_per_session: effectiveProfile.gateway.max_reasoning_log_bytes_per_session,
        expiration_tombstone_ttl_ms: effectiveProfile.gateway.expiration_tombstone_ttl_ms,
        eviction_retry_ms: effectiveProfile.gateway.eviction_retry_ms,
        session_store_path: argument("--session-store") ?? effectiveProfile.gateway.session_store.path,
        on_backend_stderr: (chunk) => process.stderr.write(`${JSON.stringify(classifyBackendDiagnostic(chunk))}\n`),
        authorize_client: ({consumer_id, lane}) => allowed.get(consumer_id)?.lane === lane,
        wrapper_factory: ({consumer_id, lane}) => {
          const profile = structuredClone(effectiveProfile);
          profile.turn_bindings.default = {
            ...profile.turn_bindings.default,
            lane,
            consumer_ref: consumer_id,
            purpose: lane === "plan-bound" ? "persistent-plan-client" : "persistent-human-chat-client",
            ...(lane === "plan-bound" ? {window_ref: allowed.get(consumer_id).window_ref, request_id: allowed.get(consumer_id).request_id} : {}),
          };
          profile.reasoning_state = deriveGatewayReasoningStateProfile(effectiveProfile, consumer_id, argument("--reasoning-state-dir"));
          return createCodexAppServerWrapper({
            loaded_profile: profile,
            decision_profile: loaded.decision_profile,
            definition_catalog: loaded.definition_catalog,
            ontology_snapshot: loaded.ontology_snapshot,
            source_snapshot: loaded.source_snapshot,
            context_source_provider: loaded.context_source_provider,
            require_bound_effect_route: true,
            allow_hosted_effect_tool: allowHostedEffects,
            ...(allowHostedEffects ? {hosted_effect_repository_root: hostedEffectRoot.root} : {}),
            interaction_input_provider: selectHostedFeedbackCueProvider({consumer_id, lane,
              learning_enabled: backendAgent === "codex" && profile.interaction_learning?.enabled === true}),
            require_hosted_input_attestation: backendAgent === "codex"
              && profile.interaction_learning?.enabled === true,
            semantic_profile: loaded.semantic_profile,
            module_port: modulePort,
            continuity_binding_provider: continuity.provider,
            ...(evolutionSignalIntake ? {
              evolution_signal_provider: evolutionSignalIntake.signal_provider,
              evolution_signal_factory: evolutionSignalIntake.signal_factory,
              evolution_signal_sink: evolutionSignalIntake.signal_sink,
            } : {}),
          });
        },
      });
      if (evolutionEnabled) {
        try {
          // The intake is an opt-in development extension, not a Core closure dependency.
          const intakeUrl = new URL(["..", "..", "evolution-runtime", "src", "gateway-signal-intake.mjs"].join("/"), import.meta.url);
          const {createGatewayEvolutionSignalIntake} = await import(intakeUrl);
          evolutionSignalIntake = createGatewayEvolutionSignalIntake({log_path: evolutionSignalLogArg});
        } catch (error) {
          process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-start-failure/v1", reason: "gateway.evolution-signal-intake-unavailable", detail: error.message, authority_effect: "none"})}\n`);
          process.exit(11);
        }
      }
      try { await gateway.start(); } catch (error) { evolutionSignalIntake?.close(); throw error; }
      process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-ready/v1", listen_path: listenPath, runtime_epoch_id: gateway.inspect().runtime_epoch_id, observation_transport: observationTcpPortArg ? "loopback-tcp-development" : observationSocketArg ? "local-ipc-development" : "disabled", backend_agent: backendAgent, backend_adapter_id: backendAgent === "dsh" ? "deepseek-harness-headless/v1" : "codex-app-server/v1", backend_mode: backendAgent === "codex" ? backendMode : "headless", desktop_backend_binding: desktopBackendBinding, observed_backend_version: version, host_catalog_verification: hostCatalogVerification, backend_initialize_version_gate: backendAgent === "codex" ? "required-per-session" : "not-applicable", managed_turn_ingress_blocked_reason: turnIngressBlockedReason, managed_model_wire_guard_expected: managedModelWireGuardExpected, require_mcp_hook_relay: requireMcpHookRelay, require_restricted_mcp_catalog: requireRestrictedMcpCatalog, windows_backend_sandbox_attestation_mode: windowsBackendSandboxMode, allow_hosted_effects: allowHostedEffects, hosted_effect_root_sha256: hostedEffectRoot?.sha256 ?? null, restricted_host_config_sha256: restrictedHostConfigSha256, backend_preflight: backendPreflight ?? null, continuity_disposition: continuity.disposition, continuity_activation_receipt_digest: continuity.receipt?.receipt_digest ?? null, objective_continuity_status: effectiveProfile.objective_resolution?.enabled === true ? "configured" : "disabled", objective_requirement_tracking: effectiveProfile.objective_resolution?.requirement_tracking === true, evolution_signal_intake: evolutionSignalIntake ? evolutionSignalIntake.inspect() : {status: "disabled", authority_effect: "none"}, authority_effect: "none"})}\n`);
      let closing = false;
      const close = async () => {
        if (closing) return;
        closing = true;
        try { await gateway.close(); } finally { evolutionSignalIntake?.close(); }
      };
      let stopping = false;
      const stop = () => {
        if (stopping) return;
        stopping = true;
        return close().then(() => {
          if (process.connected) process.disconnect();
          process.exit(0);
        }, error => {
          process.stderr.write(`${JSON.stringify({schema_version: "are.gateway-stop-failure/v1",
            reason: typeof error?.code === "string" ? error.code : "gateway.stop-failed",
            authority_effect: "none"})}\n`);
          if (process.connected) process.disconnect();
          process.exit(1);
        });
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      if (process.connected) {
        // A managed gateway must not outlive the parent that owns its guard and client.
        process.once("disconnect", stop);
        process.on("message", message => {
          if (message !== null && typeof message === "object" && !Array.isArray(message)
            && message.schema_version === "are.codex-gateway-stop/v1"
            && Object.keys(message).length === 1) stop();
          else if (managedIpcRequired && managedModelWireGuardExpected
            && message !== null && typeof message === "object" && !Array.isArray(message)
            && message.schema_version === "are.managed-model-wire-guard-heartbeat/v1"
            && Object.keys(message).length === 1) gateway.noteManagedModelWireGuardHeartbeat();
        });
      }
      if (managedIpcRequired && !process.connected) stop();
    }
  }
}
