#!/usr/bin/env node
import {randomBytes} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {PassThrough} from "node:stream";
import {fileURLToPath} from "node:url";

import {
  AppServerRpcError,
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createApprovalBroker,
  createElicitationBroker,
  createUserInputBroker,
  createWindowsClientHost,
} from "../index.mjs";
import {resolveGatewayIpcPath} from "../src/local-ipc.mjs";
import {createGatewayHostedEffectAssessor, createHostedEffectApprovalAdapter,
  createHostedEffectBroker, createHostedEffectDynamicToolHandler} from "../src/hosted-effect-broker.mjs";
import {createGatewayHostedEffectCommandDispatcher,
  createHostedEffectCommandExecutor} from "../src/hosted-effect-execution.mjs";
import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";
import {HOSTED_EFFECT_TOOL_NAME} from "../src/host-method-policy.mjs";
import {resolveHostedEffectRoot} from "../src/hosted-effect-root.mjs";
import {createWindowsClientRecoveryState} from "../src/windows-client-recovery-state.mjs";
import {startHostedHookControl} from "../../../src/hosted-hook-control.mjs";
import {validateHostedMcpHookProfile} from "../src/hosted-hook-profile.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function has(name) {
  return process.argv.includes(name);
}

function list(name) {
  return String(argument(name) ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

const socket = argument("--socket");
const repositoryRoot = argument("--repository-root");
const hookConnectionPath = argument("--hook-connection-file");
const probeUnverifiedWindowsHooks = has("--probe-unverified-windows-hooks");
const requireMcpHookRelay = has("--require-mcp-hook-relay");
const hookProfile = requireMcpHookRelay
  ? validateHostedMcpHookProfile(process.env.CODEX_HOME) : null;
const requireRestrictedMcpCatalog = has("--require-restricted-mcp-catalog");
const allowHostedEffects = has("--allow-hosted-effects");
if (process.platform === "win32" && allowHostedEffects) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.codex-windows-client-start-failure/v1",
    reason: "windows-client.hosted-effect-sandbox-unverified", authority_effect: "none"})}\n`);
  process.exit(2);
}
const guardedTextMarker = process.env.ARE_MANAGED_GUARDED_TEXT_ONLY;
const guardedTextOnly = guardedTextMarker === "bound-by-managed-launcher/v1";
const guardedUserInputPlanMarker = process.env.ARE_MANAGED_GUARDED_USER_INPUT_PLAN;
const guardedUserInputPlan = guardedUserInputPlanMarker === "bound-by-managed-launcher/v1";
const guardedPlanModel = process.env.ARE_MANAGED_GUARDED_PLAN_MODEL;
const managedIpcMarker = process.env.ARE_MANAGED_IPC_REQUIRED;
const managedIpcRequired = managedIpcMarker === "bound-by-managed-launcher/v1";
const managedRequirementTrackingPosture = process.env.ARE_MANAGED_REQUIREMENT_TRACKING_POSTURE;
const hostedEffectRootArg = argument("--hosted-effect-root");
const simulateUnsupportedHistory = has("--simulate-unsupported-history");
const dropSteerRpcResponseMarker = process.env.ARE_INTEGRATION_TEST_DROP_STEER_RPC_RESPONSE;
const dropSteerRpcResponse = dropSteerRpcResponseMarker === "1";
if (!socket || !repositoryRoot || (has("--hook-connection-file") && !hookConnectionPath)
  || (hookConnectionPath && has("--initialize-only"))
  || (requireMcpHookRelay && !hookConnectionPath)
  || (allowHostedEffects && (!argument("--state-file") || has("--initialize-only")))
  || (allowHostedEffects !== Boolean(hostedEffectRootArg))
  || (managedIpcMarker !== undefined && (!managedIpcRequired || !process.connected))
  || (managedRequirementTrackingPosture !== undefined
    && (!managedIpcRequired || !process.connected
      || !["enabled", "disabled", "unverified"].includes(managedRequirementTrackingPosture)))
  || (probeUnverifiedWindowsHooks && (process.platform !== "win32"
    || process.env.ARE_INTEGRATION_TEST_MODE !== "1" || !hookConnectionPath))
  || (guardedTextMarker !== undefined && (!guardedTextOnly
    || !["win32", "linux"].includes(process.platform)
    || !process.connected || !requireRestrictedMcpCatalog || allowHostedEffects || probeUnverifiedWindowsHooks))
  || (guardedUserInputPlanMarker !== undefined && (!guardedUserInputPlan || !guardedTextOnly
    || !managedIpcRequired || allowHostedEffects))
  || (guardedUserInputPlan
    ? (typeof guardedPlanModel !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(guardedPlanModel))
    : guardedPlanModel !== undefined)
  || (simulateUnsupportedHistory && (process.env.ARE_INTEGRATION_TEST_MODE !== "1" || !argument("--state-file")))
  || (dropSteerRpcResponseMarker !== undefined && (!dropSteerRpcResponse
    || process.platform !== "win32" || process.env.ARE_INTEGRATION_TEST_MODE !== "1"
    || !managedIpcRequired || !process.connected || !argument("--state-file")))) {
  process.stderr.write("Usage: are-codex-windows-client --socket <gateway.sock> --repository-root <root> [--state-file <private-path>] [--hook-connection-file <new-private-path> --require-mcp-hook-relay] [--require-restricted-mcp-catalog] [--cwd <path>] [--allow-hosted-effects --hosted-effect-root <selected-checkout>] [--host 127.0.0.1] [--port 4317] [--token <token>] [--tls-key <path> --tls-cert <path> --allowed-origins <origin,...>] [--frame-ancestors <source,...>] [--initialize-only]\n");
  process.exitCode = 2;
} else {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const consumerId = "codex:human-chat";
  let recoveryState = null;
  let host = null;
  let transport = null;
  let hookControl = null;
  let effectJournal = null;
  let hostedEffectRoot = null;
  let hostOptions = null;
  function installStopSignals() {
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      try { await hookControl?.close(); }
      finally {
        try { await host.close(); }
        finally {
          try { effectJournal?.close(); }
          finally { recoveryState?.close(); }
        }
      }
    };
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      return close().then(() => {
        if (process.connected) process.disconnect();
        process.exit(0);
      }, error => {
        process.stderr.write(`${JSON.stringify({schema_version: "are.codex-windows-client-stop-failure/v1",
          reason: typeof error?.code === "string" ? error.code : "windows-client.stop-failed",
          authority_effect: "none"})}\n`);
        if (process.connected) process.disconnect();
        process.exit(1);
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    if (process.connected) {
      // The guarded hosted client cannot remain a writer after its manager dies.
      process.once("disconnect", stop);
      process.on("message", message => {
        if (message !== null && typeof message === "object" && !Array.isArray(message)
          && message.schema_version === "are.codex-windows-client-stop/v1"
          && Object.keys(message).length === 1) stop();
      });
    }
    if (managedIpcRequired && !process.connected) stop();
  }
  try {
    if (allowHostedEffects) hostedEffectRoot = resolveHostedEffectRoot({repository_root: resolve(repositoryRoot),
      effect_root: hostedEffectRootArg});
    recoveryState = argument("--state-file") ? createWindowsClientRecoveryState({path: argument("--state-file"), consumer_id: consumerId}) : null;
    if (allowHostedEffects) effectJournal = createFileHostedEffectJournal({state_dir: dirname(resolve(argument("--state-file")))});
    const approvalBroker = createApprovalBroker();
    const userInputBroker = createUserInputBroker();
    const elicitationBroker = createElicitationBroker();
    const tlsKey = argument("--tls-key");
    const tlsCert = argument("--tls-cert");
    if ((tlsKey === null) !== (tlsCert === null)) throw new TypeError("--tls-key and --tls-cert must be supplied together.");
    hostOptions = {
      approval_broker: approvalBroker,
      user_input_broker: userInputBroker,
      elicitation_broker: elicitationBroker,
      recovery_state: recoveryState,
      repository_root: resolve(repositoryRoot),
      default_cwd: resolve(argument("--cwd") ?? repositoryRoot),
      assets_directory: resolve(packageRoot, "client"),
      host: argument("--host") ?? "127.0.0.1",
      port: Number(argument("--port") ?? 4317),
      token: argument("--token") ?? randomBytes(32).toString("base64url"),
      observation_token: process.env.ARE_HOSTED_REJOIN_OBSERVATION_TOKEN ?? null,
      ...(tlsKey && tlsCert ? {tls: {key: readFileSync(resolve(tlsKey), "utf8"), cert: readFileSync(resolve(tlsCert), "utf8")}} : {}),
      allowed_origins: list("--allowed-origins"),
      frame_ancestors: list("--frame-ancestors"),
      turn_execution_blocked_reason: process.platform === "win32" && !probeUnverifiedWindowsHooks && !guardedTextOnly
        ? "windows-client.hook-boundary-unverified" : null,
      require_mcp_hook_relay: requireMcpHookRelay,
      hook_profile_source_path: hookProfile?.path ?? null,
      require_restricted_mcp_catalog: requireRestrictedMcpCatalog,
      guarded_user_input_plan: guardedUserInputPlan,
      guarded_plan_model: guardedPlanModel ?? null,
      hosted_input_attestation_available: Boolean(process.env.ARE_HOSTED_INPUT_ATTESTATION_KEY),
      requirement_tracking_posture: managedRequirementTrackingPosture ?? "unverified",
      allow_hosted_effect_tool: allowHostedEffects,
      ...(allowHostedEffects ? {hosted_effect_root: hostedEffectRoot.root,
        hosted_effect_journal: effectJournal} : {}),
    };
    transport = connectGatewayRpcTransport({
      socket_path: resolveGatewayIpcPath(socket),
      consumer_id: consumerId,
      lane: "interaction-bound",
      expected_backend_adapter_id: "codex-app-server/v1",
      connection_token: process.env.ARE_GATEWAY_CONNECTION_TOKEN,
      ...(recoveryState?.resume_token() ? {resume_token: recoveryState.resume_token()} : {}),
    });
    const receipt = await transport.ready;
    recoveryState?.bind_gateway(receipt);
    let rpcTransport = transport;
    if (dropSteerRpcResponse) {
      // Native canary only: suppress one already-delivered gateway response
      // before the hosted RPC consumer observes it. The marker contains no
      // request or guidance content and lives beside the private state file.
      const filteredOutput = new PassThrough();
      const markerPath = resolve(dirname(argument("--state-file")), "held-steer-rpc-response.json");
      let buffered = "";
      let dropped = false;
      transport.output.on("data", chunk => {
        buffered += chunk.toString("utf8");
        let end;
        while ((end = buffered.indexOf("\n")) >= 0) {
          const line = buffered.slice(0, end);
          buffered = buffered.slice(end + 1);
          const message = JSON.parse(line);
          if (!dropped && typeof message?.result?.turnId === "string"
            && Object.keys(message.result).join(",") === "turnId") {
            writeFileSync(markerPath, `${JSON.stringify({schema_version: "are.test-held-steer-rpc-response/v1",
              held: true, authority_effect: "none"})}\n`, {flag: "wx", mode: 0o600});
            dropped = true;
            continue;
          }
          filteredOutput.write(`${line}\n`);
        }
      });
      transport.output.on("end", () => filteredOutput.end());
      rpcTransport = {...transport, output: filteredOutput};
    }
    let hostedHandler = null;
    const rpc = createAppServerRpcClient({transport: rpcTransport,
      ...(allowHostedEffects ? {dynamic_tool_name: HOSTED_EFFECT_TOOL_NAME,
        dynamic_tool_handler: message => hostedHandler(message)} : {}),
      ...(process.env.ARE_HOSTED_INPUT_ATTESTATION_KEY ? {
        hosted_input_attestation_key: process.env.ARE_HOSTED_INPUT_ATTESTATION_KEY,
        hosted_input_consumer_id: consumerId,
      } : {}),
      approval_handler: (message, options) => approvalBroker.request(message, options),
      user_input_handler: (message, options) => userInputBroker.request(message, options),
      elicitation_handler: (message, options) => elicitationBroker.request(message, options),
    });
    if (allowHostedEffects) {
      const isActiveTurn = (threadId, turnId) => host?.verify_active_turn(threadId, turnId) ?? false;
      const broker = createHostedEffectBroker({
        assess: createGatewayHostedEffectAssessor({rpc_client: rpc}),
        approve: createHostedEffectApprovalAdapter({approval_broker: approvalBroker}),
        execute: createHostedEffectCommandExecutor({journal: effectJournal,
          is_active_turn: isActiveTurn, repository_root: hostedEffectRoot.root,
          dispatch: createGatewayHostedEffectCommandDispatcher({rpc_client: rpc})}),
        journal: effectJournal, is_active_turn: isActiveTurn,
      });
      hostedHandler = createHostedEffectDynamicToolHandler({broker,
        is_active_turn: isActiveTurn});
    }
    if (hookConnectionPath) hookControl = await startHostedHookControl({rpc_client: rpc,
      connection_path: hookConnectionPath,
      owns_session: sessionId => host?.state()?.thread_ids?.includes(sessionId) === true});
    // Test-only host compatibility seam. The real gateway and installed Codex
    // still execute every turn; only detailed-history reads are unavailable.
    const hostRpc = simulateUnsupportedHistory ? {...rpc,
      request: (method, params, options) => {
        if (method === "thread/turns/list") {
          throw new AppServerRpcError("rpc.response-error", "thread/turns/list: list_turns is not supported yet", {code: -32601});
        }
        if (method === "thread/read" && params?.includeTurns === true) {
          throw new AppServerRpcError("rpc.response-error", "thread/read: list_turns is not supported yet", {code: -32601});
        }
        return rpc.request(method, params, options);
      },
    } : rpc;
    host = createWindowsClientHost({...hostOptions, rpc_client: hostRpc});
    if (has("--initialize-only")) {
      const initialization = await host.initialize();
      process.stdout.write(`${JSON.stringify({schema_version: "are.codex-windows-client-canary/v1", ok: true, initialization, model_turns_started: 0, authority_effect: "none"})}\n`);
      await host.close();
      recoveryState?.close();
    } else {
      const ready = await host.start();
      process.stderr.write(`${JSON.stringify({...ready,
        require_restricted_mcp_catalog: requireRestrictedMcpCatalog,
        allow_hosted_effects: allowHostedEffects,
        guarded_text_only_model_wire: guardedTextOnly,
        guarded_user_input_plan: guardedUserInputPlan,
        requirement_tracking_posture: host.state().requirement_tracking.status,
        hosted_effect_root_sha256: hostedEffectRoot?.sha256 ?? null,
        launch_url: `${ready.url}#token=${host.token}`})}\n`);
      installStopSignals();
    }
  } catch (error) {
    await hookControl?.close().catch(() => {});
    await host?.close().catch(() => {});
    await transport?.close().catch(() => {});
    effectJournal?.close();
    let faultViewStarted = false;
    let faultViewReason = null;
    if (!has("--initialize-only") && hostOptions
      && ["gateway.session-faulted", "gateway.history-audit-incomplete"].includes(error.code)) {
      try {
        host = createWindowsClientHost({...hostOptions, recovery_state: null,
          allow_hosted_effect_tool: false,
          recovery_state_retained: Boolean(recoveryState), startup_failure: {code: error.code,
          ...(error.code === "gateway.session-faulted" ? {fault_digest: error.fault_digest,
            fault_reason_code: error.fault_reason_code} : {})}});
        const stopped = await host.start();
        process.stderr.write(`${JSON.stringify({...stopped, launch_url: `${stopped.url}#token=${host.token}`})}\n`);
        installStopSignals();
        faultViewStarted = true;
      } catch (viewError) {
        faultViewReason = typeof viewError?.message === "string" && /^[a-z0-9.-]{1,128}$/.test(viewError.message)
          ? viewError.message : "windows-client.fault-view-unavailable";
        await host?.close().catch(() => {});
      }
    }
    if (!faultViewStarted) {
      process.stderr.write(`${JSON.stringify({schema_version: "are.codex-windows-client-start-failure/v1", ok: false, reason: error.code ?? "windows-client.start-failed", detail: error.message,
        ...(faultViewReason ? {fault_view_reason: faultViewReason} : {}),
        ...(error.code === "gateway.session-faulted" ? {fault_digest: error.fault_digest,
          fault_reason_code: error.fault_reason_code} : {}), authority_effect: "none"})}\n`);
      recoveryState?.close();
      process.exitCode = 1;
    }
  }
}
