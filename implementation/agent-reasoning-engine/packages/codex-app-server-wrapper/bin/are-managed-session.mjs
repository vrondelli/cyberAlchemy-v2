#!/usr/bin/env node
import {spawn} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {existsSync, lstatSync, realpathSync, statSync} from "node:fs";
import {basename, dirname, join, relative, resolve, isAbsolute} from "node:path";
import {createInterface} from "node:readline";
import {pathToFileURL} from "node:url";
import {reclaimTerminatedHostedHookConnection} from "../../../src/hosted-hook-control.mjs";
import {resolveHostedEffectRoot} from "../src/hosted-effect-root.mjs";
import {validateHostedMcpHookProfile} from "../src/hosted-hook-profile.mjs";
import {HOSTED_EFFECT_TOOL_NAME} from "../src/host-method-policy.mjs";
import {startModelWireGuard} from "../src/model-wire-guard.mjs";
import {readAdapterObservation} from "../src/adapter-observation-client.mjs";
import {preflightRestrictedHostHome, restrictedHostConfigDigest, verifyRestrictedHostProfile} from "../src/restricted-host-profile.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const gatewayEntry = resolve(packageRoot, "bin/are-codex-gateway.mjs");
const clientEntry = resolve(packageRoot, "bin/are-codex-windows-client.mjs");
const hostedRelayEntry = resolve(packageRoot, "../are-mcp-server/bin/are-hook-mcp-server.mjs");
const READY_TIMEOUT_MS = 30000;

function within(root, target) {
  const path = relative(root, target);
  return path === "" || (path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(path));
}

export function parseManagedSessionArgs(argv) {
  const values = new Map();
  const switches = new Set(["--hook-bridge", "--probe-unverified-windows-hooks", "--require-mcp-hook-relay",
    "--require-restricted-host-profile", "--allow-hosted-effects", "--probe-windows-hosted-effects",
    "--require-objective-continuity",
    "--windows-guarded-text-turns",
    "--windows-guarded-user-input", "--guarded-text-turns", "--guarded-user-input"]);
  const argumentsWithValues = new Set(["--repository-root", "--codex-command", "--state-dir", "--config",
    "--cwd", "--port", "--companion-command", "--companion-evolution-root", "--evolution-signal-log", "--codex-home",
    "--model-wire-upstream", "--model-wire-provider-id", "--model-wire-upstream-key-env",
    "--guarded-plan-model", "--windows-sandbox-mode", "--development-observation-tcp-port"]);
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (values.has(name) || !(switches.has(name) || argumentsWithValues.has(name))) throw new Error("managed-session.argument-invalid");
    if (switches.has(name)) { values.set(name, true); continue; }
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error("managed-session.argument-value-required");
    values.set(name, value);
  }
  for (const name of ["--repository-root", "--codex-command", "--state-dir", "--config"]) {
    if (!values.has(name)) throw new Error("managed-session.required-argument-missing");
  }
  const port = values.has("--port") ? Number(values.get("--port")) : 0;
  if (!Number.isSafeInteger(port) || port < 0 || port > 65535) throw new Error("managed-session.port-invalid");
  const observationTcpPort = values.has("--development-observation-tcp-port")
    ? Number(values.get("--development-observation-tcp-port")) : null;
  if (observationTcpPort !== null && (!/^[1-9][0-9]{0,4}$/.test(values.get("--development-observation-tcp-port"))
    || observationTcpPort > 65535)) throw new Error("managed-session.observation-tcp-port-invalid");
  if ((values.has("--guarded-text-turns") && values.has("--windows-guarded-text-turns"))
    || (values.has("--guarded-user-input") && values.has("--windows-guarded-user-input"))) {
    throw new Error("managed-session.guarded-alias-conflict");
  }
  return {
    repository_root: values.get("--repository-root"), codex_command: values.get("--codex-command"),
    state_dir: values.get("--state-dir"), config: values.get("--config"),
    cwd: values.get("--cwd") ?? values.get("--repository-root"), port,
    cwd_explicit: values.has("--cwd"),
    companion_command: values.get("--companion-command") ?? null,
    companion_evolution_root: values.get("--companion-evolution-root") ?? null,
    evolution_signal_log: values.get("--evolution-signal-log") ?? null,
    development_observation_tcp_port: observationTcpPort,
    hook_bridge: values.has("--hook-bridge"),
    require_mcp_hook_relay: values.has("--require-mcp-hook-relay"),
    require_restricted_host_profile: values.has("--require-restricted-host-profile"),
    allow_hosted_effects: values.has("--allow-hosted-effects"),
    require_objective_continuity: values.has("--require-objective-continuity"),
    codex_home: values.get("--codex-home") ?? null,
    windows_sandbox_mode: values.get("--windows-sandbox-mode") ?? null,
    probe_windows_hosted_effects: values.has("--probe-windows-hosted-effects"),
    model_wire_upstream: values.get("--model-wire-upstream") ?? null,
    model_wire_provider_id: values.get("--model-wire-provider-id") ?? null,
    model_wire_upstream_key_env: values.get("--model-wire-upstream-key-env") ?? null,
    probe_unverified_windows_hooks: values.has("--probe-unverified-windows-hooks"),
    windows_guarded_text_turns: values.has("--windows-guarded-text-turns"),
    windows_guarded_user_input: values.has("--windows-guarded-user-input"),
    guarded_text_turns: values.has("--guarded-text-turns"),
    guarded_user_input: values.has("--guarded-user-input"),
    guarded_plan_model: values.get("--guarded-plan-model") ?? null,
  };
}

export function preflightManagedSession(input) {
  if (input.development_observation_tcp_port != null
    && (process.platform !== "linux" || !Number.isSafeInteger(input.development_observation_tcp_port)
      || input.development_observation_tcp_port < 1 || input.development_observation_tcp_port > 65535
      || input.companion_command != null)) {
    throw new Error("managed-session.observation-tcp-boundary-invalid");
  }
  const guardedTextTurns = input.guarded_text_turns === true || input.windows_guarded_text_turns === true;
  const guardedUserInput = input.guarded_user_input === true || input.windows_guarded_user_input === true;
  if ((input.guarded_text_turns === true && input.windows_guarded_text_turns === true)
    || (input.guarded_user_input === true && input.windows_guarded_user_input === true)) {
    throw new Error("managed-session.guarded-alias-conflict");
  }
  if (process.platform !== "win32"
    && (input.windows_guarded_text_turns === true || input.windows_guarded_user_input === true)) {
    throw new Error("managed-session.windows-guarded-text-boundary-invalid");
  }
  if (input.require_mcp_hook_relay === true && input.hook_bridge !== true) {
    throw new Error("managed-session.mcp-hook-relay-requires-hook-bridge");
  }
  if (input.require_mcp_hook_relay === true && input.codex_home == null
    && process.env.ARE_INTEGRATION_TEST_MODE !== "1") {
    throw new Error("managed-session.mcp-hook-relay-requires-dedicated-codex-home");
  }
  if (input.require_restricted_host_profile === true && input.codex_home == null) {
    throw new Error("managed-session.restricted-host-profile-requires-codex-home");
  }
  if (input.allow_hosted_effects === true && input.require_restricted_host_profile !== true) {
    throw new Error("managed-session.hosted-effects-require-restricted-host-profile");
  }
  if (input.allow_hosted_effects === true && input.cwd_explicit !== true) {
    throw new Error("managed-session.hosted-effects-require-explicit-cwd");
  }
  if (input.codex_home != null && input.require_restricted_host_profile !== true) {
    throw new Error("managed-session.codex-home-requires-restricted-host-profile");
  }
  if (input.windows_sandbox_mode != null && (process.platform !== "win32"
    || input.require_restricted_host_profile !== true
    || !["elevated", "unelevated"].includes(input.windows_sandbox_mode))) {
    throw new Error("managed-session.windows-sandbox-mode-invalid");
  }
  if (input.probe_windows_hosted_effects === true && (process.platform !== "win32"
    || input.windows_sandbox_mode == null || input.require_restricted_host_profile !== true)) {
    throw new Error("managed-session.windows-sandbox-probe-mode-required");
  }
  if ((input.model_wire_upstream !== null && input.model_wire_upstream !== undefined)
    !== (input.model_wire_provider_id !== null && input.model_wire_provider_id !== undefined)) {
    throw new Error("managed-session.model-wire-arguments-must-be-paired");
  }
  if (input.model_wire_upstream != null && input.require_restricted_host_profile !== true) {
    throw new Error("managed-session.model-wire-requires-restricted-host-profile");
  }
  if (input.model_wire_upstream != null && (typeof input.model_wire_upstream !== "string"
    || typeof input.model_wire_provider_id !== "string"
    || !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(input.model_wire_provider_id))) {
    throw new Error("managed-session.model-wire-provider-id-invalid");
  }
  if (input.model_wire_upstream_key_env != null && (input.model_wire_upstream == null
    || typeof input.model_wire_upstream_key_env !== "string"
    || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(input.model_wire_upstream_key_env)
    || input.model_wire_upstream_key_env === "ARE_MODEL_WIRE_CLIENT_TOKEN")) {
    throw new Error("managed-session.model-wire-upstream-key-env-invalid");
  }
  if (guardedTextTurns && (!["win32", "linux"].includes(process.platform)
    || input.probe_unverified_windows_hooks === true || input.require_restricted_host_profile !== true
    || input.model_wire_upstream == null || input.allow_hosted_effects === true)) {
    throw new Error("managed-session.guarded-text-boundary-invalid");
  }
  if (guardedUserInput && !guardedTextTurns) {
    throw new Error("managed-session.guarded-user-input-requires-guarded-text");
  }
  if (guardedUserInput
    ? (typeof input.guarded_plan_model !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(input.guarded_plan_model))
    : input.guarded_plan_model != null) {
    throw new Error("managed-session.guarded-plan-model-invalid");
  }
  if (process.platform === "win32" && input.allow_hosted_effects === true) {
    throw new Error("managed-session.windows-hosted-effect-sandbox-unverified");
  }
  if (input.probe_unverified_windows_hooks === true && (process.platform !== "win32"
    || process.env.ARE_INTEGRATION_TEST_MODE !== "1" || input.hook_bridge !== true)) {
    throw new Error("managed-session.unverified-hook-probe-test-only");
  }
  for (const field of ["repository_root", "codex_command", "state_dir", "config", "cwd"]) {
    if (typeof input?.[field] !== "string" || !isAbsolute(input[field])) throw new Error(`managed-session.${field}-absolute-required`);
  }
  if (input.companion_command !== null && (typeof input.companion_command !== "string"
    || !isAbsolute(input.companion_command))) throw new Error("managed-session.companion-command-absolute-required");
  if (input.companion_evolution_root != null && (input.companion_command == null
    || typeof input.companion_evolution_root !== "string"
    || !isAbsolute(input.companion_evolution_root))) {
    throw new Error("managed-session.companion-evolution-root-requires-companion-and-absolute-path");
  }
  if (input.evolution_signal_log != null && (typeof input.evolution_signal_log !== "string"
    || !isAbsolute(input.evolution_signal_log))) {
    throw new Error("managed-session.evolution-signal-log-absolute-required");
  }
  const repositoryRoot = realpathSync(input.repository_root);
  const stateDir = realpathSync(input.state_dir);
  if (!statSync(repositoryRoot).isDirectory() || !statSync(stateDir).isDirectory()
    || lstatSync(input.state_dir).isSymbolicLink()) throw new Error("managed-session.directory-invalid");
  if (within(repositoryRoot, stateDir)) throw new Error("managed-session.state-inside-repository");
  if (process.platform !== "win32" && (statSync(stateDir).mode & 0o077) !== 0) {
    throw new Error("managed-session.state-directory-not-private");
  }
  if (process.platform !== "win32" && typeof process.getuid === "function"
    && statSync(stateDir).uid !== process.getuid()) throw new Error("managed-session.state-directory-not-owned");
  const evolutionSignalLog = input.evolution_signal_log == null ? null : resolve(input.evolution_signal_log);
  if (evolutionSignalLog) {
    let parent;
    try { parent = realpathSync(dirname(evolutionSignalLog)); }
    catch { throw new Error("managed-session.evolution-signal-log-parent-invalid"); }
    if (!within(stateDir, parent)) {
      throw new Error("managed-session.evolution-signal-log-outside-private-state");
    }
    let existingLog = null;
    try { existingLog = lstatSync(evolutionSignalLog); }
    catch (error) {
      if (error?.code !== "ENOENT") throw new Error("managed-session.evolution-signal-log-file-invalid");
    }
    if (existingLog && !existingLog.isFile()) {
      throw new Error("managed-session.evolution-signal-log-file-invalid");
    }
  }
  const codexHome = input.require_restricted_host_profile
    ? preflightRestrictedHostHome(stateDir, input.codex_home) : null;
  const cwd = realpathSync(input.cwd);
  if (!within(repositoryRoot, cwd)) throw new Error("managed-session.cwd-outside-repository");
  const codexCommand = realpathSync(input.codex_command);
  const config = realpathSync(input.config);
  if (!statSync(codexCommand).isFile() || !statSync(config).isFile()) throw new Error("managed-session.file-invalid");
  const companionCommand = input.companion_command ? realpathSync(input.companion_command) : null;
  if (companionCommand && !statSync(companionCommand).isFile()) throw new Error("managed-session.companion-file-invalid");
  const companionEvolutionRoot = input.companion_evolution_root
    ? realpathSync(input.companion_evolution_root) : null;
  if (companionEvolutionRoot && !statSync(companionEvolutionRoot).isDirectory()) {
    throw new Error("managed-session.companion-evolution-root-directory-required");
  }
  const socketSuffix = createHash("sha256").update(stateDir).digest("hex").slice(0, 24);
  const gatewaySocket = process.platform === "win32" ? `\\\\.\\pipe\\are-managed-${socketSuffix}` : join(stateDir, "gateway.sock");
  const observationSocket = process.platform === "win32" ? `\\\\.\\pipe\\are-managed-observe-${socketSuffix}` : join(stateDir, "observe.sock");
  return {repositoryRoot, stateDir, cwd, codexCommand, config, companionCommand,
    companionEvolutionRoot, evolutionSignalLog,
    codexHome,
    gatewaySocket, observationSocket, port: input.port, hookBridge: input.hook_bridge === true,
    observationTcpPort: input.development_observation_tcp_port ?? null,
    requireMcpHookRelay: input.require_mcp_hook_relay === true,
    probeUnverifiedWindowsHooks: input.probe_unverified_windows_hooks === true,
    allowHostedEffects: input.allow_hosted_effects === true,
    requireObjectiveContinuity: input.require_objective_continuity === true,
    windowsSandboxMode: input.windows_sandbox_mode ?? null,
    probeWindowsHostedEffects: input.probe_windows_hosted_effects === true,
    modelWireUpstream: input.model_wire_upstream ?? null,
    modelWireProviderId: input.model_wire_provider_id ?? null,
    modelWireUpstreamKeyEnv: input.model_wire_upstream_key_env ?? null,
    windowsGuardedTextTurns: input.windows_guarded_text_turns === true,
    windowsGuardedUserInput: input.windows_guarded_user_input === true,
    guardedTextTurns, guardedUserInput,
    guardedPlanModel: input.guarded_plan_model ?? null};
}

function launch(script, args, env, shutdownMessage = null) {
  const child = spawn(process.execPath, [script, ...args], {env,
    stdio: ["ignore", "ignore", "pipe", ...(shutdownMessage ? ["ipc"] : [])], windowsHide: true});
  const lines = createInterface({input: child.stderr, crlfDelay: Infinity});
  const ready = new Map();
  const readyRecords = new Map();
  let lastReason = null;
  let lastDetail = null;
  lines.on("line", line => {
    let record;
    try { record = JSON.parse(line); } catch { return; }
    if (typeof record.reason === "string") lastReason = record.reason;
    else if (Array.isArray(record.reason_codes)) {
      const codes = record.reason_codes.filter(code => typeof code === "string" && /^[a-z0-9.-]{1,96}$/.test(code));
      if (codes.length > 0) lastReason = codes.slice(0, 4).join(",");
    }
    if (typeof record.detail === "string" && /^[\w .:/()-]{1,256}$/.test(record.detail)) lastDetail = record.detail;
    if (typeof record.schema_version === "string") {
      readyRecords.set(record.schema_version, record);
      ready.get(record.schema_version)?.(record);
    }
  });
  return {child, ready, readyRecords, shutdownMessage,
    diagnostics: () => lastReason && lastDetail ? `${lastReason}: ${lastDetail}` : lastReason};
}

function awaitReady(process, schema) {
  if (process.readyRecords.has(schema)) return Promise.resolve(process.readyRecords.get(schema));
  return new Promise((resolveReady, rejectReady) => {
    const clear = () => {
      clearTimeout(timer);
      process.ready.delete(schema);
      process.child.off("error", onError);
      process.child.off("exit", onExit);
    };
    const fail = reason => { clear(); rejectReady(new Error(reason)); };
    const onError = () => fail(`${schema}:spawn-failed`);
    const onExit = () => fail(process.diagnostics() ?? `${schema}:exited`);
    const timer = setTimeout(() => fail(`${schema}:timeout`), READY_TIMEOUT_MS);
    process.ready.set(schema, record => { clear(); resolveReady(record); });
    process.child.once("error", onError);
    process.child.once("exit", onExit);
  });
}

async function stop(process) {
  const child = process?.child;
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit").catch(() => {});
  if (process.shutdownMessage && child.connected) {
    try {
      await new Promise((resolveSent, rejectSent) => child.send(
        {schema_version: process.shutdownMessage}, error => error ? rejectSent(error) : resolveSent()));
      await Promise.race([exited, new Promise(resolveDelay => setTimeout(resolveDelay, 10000))]);
    } catch { /* A failed private shutdown retains the existing forced-stop fallback. */ }
  }
  if (child.exitCode === null && child.signalCode === null) {
    try { child.kill("SIGTERM"); } catch { return; }
    await Promise.race([exited, new Promise(resolveDelay => setTimeout(resolveDelay, 3000))]);
  }
  if (child.exitCode === null && child.signalCode === null) {
    try { child.kill("SIGKILL"); } catch { return; }
    await exited;
  }
}

function watchExit(process, component) {
  if (process.child.exitCode !== null || process.child.signalCode !== null) return Promise.resolve(component);
  return once(process.child, "exit").then(() => component);
}

export function managedCompanionIngressDeclaration(platform, probeUnverifiedWindowsHooks, windowsGuardedTextTurns = false) {
  return platform === "win32" && !probeUnverifiedWindowsHooks && !windowsGuardedTextTurns
    ? "windows-client.hook-boundary-unverified" : "unknown";
}

export function managedObjectiveContinuityReadiness(gatewayReady) {
  const status = ["configured", "disabled"].includes(gatewayReady?.objective_continuity_status)
    ? gatewayReady.objective_continuity_status : "not-reported";
  const requirementTracking = typeof gatewayReady?.objective_requirement_tracking === "boolean"
    ? gatewayReady.objective_requirement_tracking : null;
  return {status, requirementTracking};
}

export function isManagedStopMessage(message) {
  return message !== null && typeof message === "object" && !Array.isArray(message)
    && message.schema_version === "are.managed-session-stop/v1"
    && Object.keys(message).length === 1;
}

export function isManagedTestGuardFaultMessage(message) {
  return message !== null && typeof message === "object" && !Array.isArray(message)
    && message.schema_version === "are.integration-test-stop-model-wire-guard/v1"
    && Object.keys(message).length === 1;
}

export function selectManagedCompanionLaunch(companionCommand, platform = process.platform) {
  if (companionCommand === null) return null;
  const direct = {command: companionCommand, args: [], mode: "direct"};
  if (!((platform === "linux" && basename(companionCommand) === "are-companion")
    || (platform === "win32" && basename(companionCommand).toLowerCase() === "are-companion.exe"))) {
    return direct;
  }
  const orb = join(dirname(companionCommand), "native-orb",
    platform === "win32" ? "are-native-orb.exe" : "are-native-orb");
  if (!existsSync(orb)) return direct;
  if (!statSync(orb).isFile()) throw new Error("managed-session.native-orb-invalid");
  return {command: realpathSync(orb), args: ["--dashboard", companionCommand], mode: "native-orb"};
}

export function managedCompanionEvolutionEnvironment(base, evolutionRoot = null, signalLog = null) {
  const env = {...base};
  for (const key of Object.keys(env)) {
    if (["ARE_COMPANION_EVOLUTION_ROOT", "ARE_COMPANION_EVOLUTION_SIGNAL_LOG"].includes(key.toUpperCase())) {
      delete env[key];
    }
  }
  if (evolutionRoot !== null) env.ARE_COMPANION_EVOLUTION_ROOT = evolutionRoot;
  if (signalLog !== null) env.ARE_COMPANION_EVOLUTION_SIGNAL_LOG = signalLog;
  return env;
}

async function awaitNativeOrbReady(child) {
  if (!child.stdout) throw new Error("managed-session.native-orb-output-unavailable");
  const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
  await new Promise((resolveReady, rejectReady) => {
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      child.off("error", onError);
      if (error) { lines.close(); rejectReady(error); }
      else resolveReady();
    };
    const onExit = () => finish(new Error("managed-session.native-orb-exited-before-ready"));
    const onError = () => finish(new Error("managed-session.native-orb-spawn-failed"));
    const timer = setTimeout(() => finish(new Error("managed-session.native-orb-ready-timeout")), READY_TIMEOUT_MS);
    lines.on("line", line => { if (line === "ARE_NATIVE_ORB_READY") finish(null); });
    child.once("exit", onExit);
    child.once("error", onError);
  });
  child.once("exit", () => lines.close());
}

export async function runManagedSession(input, output = process.stdout) {
  const config = preflightManagedSession(input);
  const hookProfile = config.requireMcpHookRelay
    ? validateHostedMcpHookProfile(config.codexHome ?? process.env.CODEX_HOME) : null;
  const companionLaunch = selectManagedCompanionLaunch(config.companionCommand);
  if (config.observationTcpPort !== null
    && (typeof process.env.ARE_ADAPTER_OBSERVATION_TOKEN !== "string"
      || Buffer.byteLength(process.env.ARE_ADAPTER_OBSERVATION_TOKEN) < 32)) {
    throw new Error("managed-session.observation-tcp-token-required");
  }
  const hostedEffectRoot = config.allowHostedEffects
    ? resolveHostedEffectRoot({repository_root: config.repositoryRoot, effect_root: config.cwd}) : null;
  const expectedMcpServers = config.requireMcpHookRelay ? [{name: "are_hosted_hook_relay",
    command: process.execPath,
    args: [hostedRelayEntry, "--connection-file", join(config.stateDir, "hook-connection.json")],
    tools: ["are_hook_observe"]}] : [];
  const restrictedConfigDigest = config.codexHome ? restrictedHostConfigDigest(config.codexHome) : null;
  const launchEnv = {...process.env, ...(config.codexHome ? {CODEX_HOME: config.codexHome} : {})};
  delete launchEnv.ARE_ADAPTER_OBSERVATION_TOKEN;
  delete launchEnv.ARE_HOSTED_REJOIN_OBSERVATION_TOKEN;
  delete launchEnv.ARE_COMPANION_HOSTED_REJOIN_URL;
  delete launchEnv.ARE_MODEL_WIRE_CLIENT_TOKEN;
  delete launchEnv.ARE_MANAGED_GUARDED_TEXT_ONLY;
  delete launchEnv.ARE_MANAGED_GUARDED_USER_INPUT_PLAN;
  delete launchEnv.ARE_MANAGED_GUARDED_PLAN_MODEL;
  delete launchEnv.ARE_MANAGED_REQUIREMENT_TRACKING_POSTURE;
  delete launchEnv.ARE_MANAGED_MODEL_ENTRY_BOUNDARY;
  delete launchEnv.ARE_COMPANION_GUARDED_PLAN_INPUT;
  delete launchEnv.ARE_MANAGED_IPC_REQUIRED;
  if (config.modelWireUpstreamKeyEnv) delete launchEnv[config.modelWireUpstreamKeyEnv];
  let turnIngressDeclaration;
  const connectionToken = randomBytes(32).toString("hex");
  const observationToken = config.observationTcpPort === null
    ? randomBytes(32).toString("hex") : process.env.ARE_ADAPTER_OBSERVATION_TOKEN;
  const observationEndpoint = config.observationTcpPort === null
    ? config.observationSocket : `tcp://127.0.0.1:${config.observationTcpPort}`;
  const hostedInputKey = randomBytes(32).toString("hex");
  const hostedRejoinObservationToken = config.companionCommand
    ? randomBytes(32).toString("hex") : null;
  const modelWireClientToken = config.modelWireUpstream ? randomBytes(32).toString("hex") : null;
  let gateway, client, companion, modelWireGuard, guardHeartbeatTimer;
  try {
    if (config.modelWireUpstream) modelWireGuard = await startModelWireGuard({
      upstreamUrl: config.modelWireUpstream,
      allowedToolNames: config.allowHostedEffects ? [HOSTED_EFFECT_TOOL_NAME]
        : config.guardedUserInput ? ["request_user_input"] : [],
      clientToken: modelWireClientToken,
      upstreamBearerToken: config.modelWireUpstreamKeyEnv
        ? process.env[config.modelWireUpstreamKeyEnv] ?? null : null});
    const codexPrefixArgs = modelWireGuard ? ["-c",
      `model_providers.${config.modelWireProviderId}.base_url=${JSON.stringify(modelWireGuard.url)}`,
      "-c", `model_providers.${config.modelWireProviderId}.env_http_headers={"X-ARE-Guard-Token"="ARE_MODEL_WIRE_CLIENT_TOKEN"}`] : [];
    if (config.codexHome) {
      const restrictedPreflight = await verifyRestrictedHostProfile({codexCommand: config.codexCommand,
        codexHome: config.codexHome, cwd: config.cwd, expectedMcpServers, codexPrefixArgs,
        expectedWindowsSandbox: config.windowsSandboxMode,
        probeWindowsHostedEffects: config.probeWindowsHostedEffects,
        expectedModelWire: modelWireGuard ? {provider_id: config.modelWireProviderId,
          base_url: modelWireGuard.url, env_header_var: "ARE_MODEL_WIRE_CLIENT_TOKEN"} : null,
        baseEnv: launchEnv,
        envOverrides: modelWireGuard ? {ARE_MODEL_WIRE_CLIENT_TOKEN: modelWireClientToken} : {}});
      if (config.probeWindowsHostedEffects
        && restrictedPreflight.windows_hosted_command_sandbox?.status !== "passed") {
        throw new Error("managed-session.windows-sandbox-probe-incomplete");
      }
      if (restrictedHostConfigDigest(config.codexHome) !== restrictedConfigDigest) {
        throw new Error("managed-session.restricted-host-config-changed-during-preflight");
      }
    }
    const guardedTextOnly = config.guardedTextTurns && Boolean(modelWireGuard);
    turnIngressDeclaration = managedCompanionIngressDeclaration(process.platform,
      config.probeUnverifiedWindowsHooks, guardedTextOnly);
    const gatewayArgs = ["--development-live", "--config", config.config,
      "--repository-root", config.repositoryRoot, "--listen", config.gatewaySocket,
      "--backend", "direct-stdio", "--codex-command", config.codexCommand,
      "--session-store", join(config.stateDir, "sessions.jsonl"),
      "--reasoning-state-dir", join(config.stateDir, "reasoning-state")];
    for (const arg of codexPrefixArgs) gatewayArgs.push("--codex-prefix-arg", arg);
    if (turnIngressDeclaration !== "unknown") gatewayArgs.push("--managed-turn-ingress-blocked-reason", turnIngressDeclaration);
    if (config.requireMcpHookRelay) gatewayArgs.push("--require-mcp-hook-relay");
    if (config.codexHome) gatewayArgs.push("--require-restricted-mcp-catalog",
      "--restricted-host-config-sha256", restrictedConfigDigest);
    if (config.probeWindowsHostedEffects) gatewayArgs.push("--windows-backend-sandbox-mode",
      config.windowsSandboxMode, "--windows-backend-workspace-root", config.cwd);
    if (config.allowHostedEffects) gatewayArgs.push("--allow-hosted-effects",
      "--hosted-effect-root", hostedEffectRoot.root);
    if (config.evolutionSignalLog) gatewayArgs.push("--evolution-signal-log", config.evolutionSignalLog);
    if (config.companionCommand) gatewayArgs.push("--development-observation-socket", config.observationSocket);
    else if (config.observationTcpPort !== null) gatewayArgs.push("--development-observation-tcp-port",
      String(config.observationTcpPort));
    if (modelWireGuard) gatewayArgs.push("--managed-model-wire-guard-expected");
    gateway = launch(gatewayEntry, gatewayArgs, {...launchEnv,
      ARE_MANAGED_IPC_REQUIRED: "bound-by-managed-launcher/v1",
      ARE_GATEWAY_CONNECTION_TOKEN: connectionToken,
      ARE_HOSTED_INPUT_ATTESTATION_KEY: hostedInputKey,
      ...(modelWireGuard ? {ARE_MODEL_WIRE_CLIENT_TOKEN: modelWireClientToken} : {}),
      ...(config.companionCommand || config.observationTcpPort !== null
        ? {ARE_ADAPTER_OBSERVATION_TOKEN: observationToken} : {})},
    "are.codex-gateway-stop/v1");
    const gatewayReady = await awaitReady(gateway, "are.gateway-ready/v1");
    if ((gatewayReady.evolution_signal_intake?.status ?? "disabled")
      !== (config.evolutionSignalLog ? "ready" : "disabled")) {
      throw new Error("managed-session.gateway-evolution-intake-binding-mismatch");
    }
    const objectiveContinuity = managedObjectiveContinuityReadiness(gatewayReady);
    const requirementTrackingPosture = objectiveContinuity.status === "disabled" ? "disabled"
      : objectiveContinuity.status === "configured"
        ? objectiveContinuity.requirementTracking === true ? "enabled"
          : objectiveContinuity.requirementTracking === false ? "disabled" : "unverified"
        : "unverified";
    if (config.requireObjectiveContinuity
      && objectiveContinuity.status !== "configured") {
      throw new Error("managed-session.objective-continuity-not-configured");
    }
    if ((gatewayReady.managed_turn_ingress_blocked_reason ?? null)
      !== (turnIngressDeclaration === "unknown" ? null : turnIngressDeclaration)) {
      throw new Error("managed-session.gateway-turn-ingress-binding-mismatch");
    }
    if (gatewayReady.managed_model_wire_guard_expected !== Boolean(modelWireGuard)) {
      throw new Error("managed-session.gateway-model-wire-guard-binding-mismatch");
    }
    if (gatewayReady.require_mcp_hook_relay !== config.requireMcpHookRelay) {
      throw new Error("managed-session.gateway-mcp-hook-relay-binding-mismatch");
    }
    if (gatewayReady.require_restricted_mcp_catalog !== Boolean(config.codexHome)) {
      throw new Error("managed-session.gateway-restricted-mcp-catalog-binding-mismatch");
    }
    if ((gatewayReady.windows_backend_sandbox_attestation_mode ?? null)
      !== (config.probeWindowsHostedEffects ? config.windowsSandboxMode : null)) {
      throw new Error("managed-session.gateway-windows-backend-attestation-binding-mismatch");
    }
    if (gatewayReady.allow_hosted_effects !== config.allowHostedEffects) {
      throw new Error("managed-session.gateway-hosted-effects-binding-mismatch");
    }
    if (gatewayReady.observation_transport !== (config.observationTcpPort !== null
      ? "loopback-tcp-development" : config.companionCommand ? "local-ipc-development" : "disabled")) {
      throw new Error("managed-session.gateway-observation-transport-mismatch");
    }
    if (gatewayReady.hosted_effect_root_sha256 !== (hostedEffectRoot?.sha256 ?? null)) {
      throw new Error("managed-session.gateway-hosted-effect-root-mismatch");
    }
    if (config.codexHome && gatewayReady.restricted_host_config_sha256 !== restrictedConfigDigest) {
      throw new Error("managed-session.gateway-restricted-host-config-binding-mismatch");
    }
    if (modelWireGuard) {
      const sendGuardHeartbeat = () => {
        if (gateway.child.connected && modelWireGuard.inspect().listening) {
          // The child-exit watcher owns channel loss; consume a racing send error.
          gateway.child.send({schema_version: "are.managed-model-wire-guard-heartbeat/v1"}, () => {});
        }
      };
      sendGuardHeartbeat();
      guardHeartbeatTimer = setInterval(sendGuardHeartbeat, 1000);
    }
    const clientArgs = ["--socket", config.gatewaySocket, "--repository-root", config.repositoryRoot,
      "--cwd", config.cwd, "--state-file", join(config.stateDir, "client-state.json"),
      "--port", String(config.port)];
    if (config.hookBridge) clientArgs.push("--hook-connection-file", join(config.stateDir, "hook-connection.json"));
    if (config.requireMcpHookRelay) clientArgs.push("--require-mcp-hook-relay");
    if (config.codexHome) clientArgs.push("--require-restricted-mcp-catalog");
    if (config.allowHostedEffects) clientArgs.push("--allow-hosted-effects",
      "--hosted-effect-root", hostedEffectRoot.root);
    if (config.probeUnverifiedWindowsHooks) clientArgs.push("--probe-unverified-windows-hooks");
    client = launch(clientEntry, clientArgs, {...launchEnv,
      ARE_MANAGED_IPC_REQUIRED: "bound-by-managed-launcher/v1",
      ARE_MANAGED_REQUIREMENT_TRACKING_POSTURE: requirementTrackingPosture,
      ARE_GATEWAY_CONNECTION_TOKEN: connectionToken,
      ARE_HOSTED_INPUT_ATTESTATION_KEY: hostedInputKey,
      ...(hostedRejoinObservationToken
        ? {ARE_HOSTED_REJOIN_OBSERVATION_TOKEN: hostedRejoinObservationToken} : {}),
      ...(guardedTextOnly ? {ARE_MANAGED_GUARDED_TEXT_ONLY: "bound-by-managed-launcher/v1"} : {}),
      ...(config.guardedUserInput
        ? {ARE_MANAGED_GUARDED_USER_INPUT_PLAN: "bound-by-managed-launcher/v1",
          ARE_MANAGED_GUARDED_PLAN_MODEL: config.guardedPlanModel} : {})},
    "are.codex-windows-client-stop/v1");
    const clientReady = await awaitReady(client, "are.codex-windows-client-ready/v1");
    const hostedRejoinUrl = new URL("/api/observation/rejoin", clientReady.launch_url);
    if (hostedRejoinUrl.protocol !== "http:"
      || !["127.0.0.1", "localhost", "[::1]"].includes(hostedRejoinUrl.hostname)) {
      throw new Error("managed-session.hosted-rejoin-observation-not-loopback");
    }
    if (config.observationTcpPort !== null) {
      const observed = await readAdapterObservation({socket_path: observationEndpoint,
        token: observationToken, timeout_ms: 2500});
      if (observed.gateway.status !== "running" || observed.runtime_epoch_id !== gatewayReady.runtime_epoch_id) {
        throw new Error("managed-session.observation-tcp-source-mismatch");
      }
    }
    if (clientReady.require_restricted_mcp_catalog !== Boolean(config.codexHome)) {
      throw new Error("managed-session.client-restricted-mcp-catalog-binding-mismatch");
    }
    if (clientReady.allow_hosted_effects !== config.allowHostedEffects) {
      throw new Error("managed-session.client-hosted-effects-binding-mismatch");
    }
    if (clientReady.guarded_text_only_model_wire !== guardedTextOnly) {
      throw new Error("managed-session.client-guarded-text-boundary-mismatch");
    }
    if (clientReady.guarded_user_input_plan !== config.guardedUserInput) {
      throw new Error("managed-session.client-guarded-user-input-boundary-mismatch");
    }
    if (clientReady.hosted_effect_root_sha256 !== (hostedEffectRoot?.sha256 ?? null)) {
      throw new Error("managed-session.client-hosted-effect-root-mismatch");
    }
    if (clientReady.requirement_tracking_posture !== requirementTrackingPosture) {
      throw new Error("managed-session.client-requirement-tracking-binding-mismatch");
    }
    if (companionLaunch) {
      companion = {child: spawn(companionLaunch.command, companionLaunch.args, {
        env: {...managedCompanionEvolutionEnvironment(launchEnv, config.companionEvolutionRoot,
          config.evolutionSignalLog),
          ARE_COMPANION_OBSERVATION_SOCKET: config.observationSocket,
          ARE_ADAPTER_OBSERVATION_TOKEN: observationToken,
          ...(hostedRejoinObservationToken ? {
            ARE_COMPANION_HOSTED_REJOIN_URL: hostedRejoinUrl.href,
            ARE_HOSTED_REJOIN_OBSERVATION_TOKEN: hostedRejoinObservationToken} : {}),
          ARE_MANAGED_CLIENT_TURN_INGRESS: turnIngressDeclaration,
          ...(guardedTextOnly ? {ARE_MANAGED_MODEL_ENTRY_BOUNDARY: "guarded-text-only-candidate"} : {}),
          ...(config.guardedUserInput ? {ARE_COMPANION_GUARDED_PLAN_INPUT: "launch-declared-candidate/v1"} : {})},
        stdio: ["ignore", companionLaunch.mode === "native-orb" ? "pipe" : "ignore", "ignore"],
        windowsHide: true})};
      await once(companion.child, "spawn");
      if (companionLaunch.mode === "native-orb") await awaitNativeOrbReady(companion.child);
    }
    let windowsBackendSandboxStatus = config.probeWindowsHostedEffects
      ? "not-observed" : "not-requested";
    if (config.probeWindowsHostedEffects && config.companionCommand) {
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        try {
          const observed = await readAdapterObservation({socket_path: config.observationSocket,
            token: observationToken, timeout_ms: 1000});
          windowsBackendSandboxStatus = observed.windows_backend_sandbox.status;
          if (["passed-all-active-backends", "failed"].includes(windowsBackendSandboxStatus)) break;
        } catch { /* A missing observation remains unverified, never a pass. */ }
        await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
      }
    }
    output.write(`${JSON.stringify({schema_version: "are.managed-session-ready/v1", ok: true,
      launch_url: clientReady.launch_url, gateway_socket: config.gatewaySocket,
      observation_transport: config.observationTcpPort !== null ? "loopback-tcp-development"
        : config.companionCommand ? "local-ipc-development" : "disabled",
      observation_endpoint: config.observationTcpPort !== null ? observationEndpoint : null,
      backend_adapter_id: gatewayReady.backend_adapter_id, companion_process_started: Boolean(companion),
      companion_mode: companionLaunch?.mode ?? "disabled",
      companion_evolution_root_configured: Boolean(config.companionEvolutionRoot),
      companion_evolution_signal_log_configured: Boolean(config.companionCommand && config.evolutionSignalLog),
      evolution_signal_intake_status: gatewayReady.evolution_signal_intake.status,
      observed_backend_version: gatewayReady.observed_backend_version,
      managed_gateway_turn_ingress_blocked_reason: gatewayReady.managed_turn_ingress_blocked_reason ?? null,
      hook_bridge_enabled: config.hookBridge, current_desktop_task_control: false,
      objective_continuity_status: objectiveContinuity.status,
      objective_requirement_tracking: objectiveContinuity.requirementTracking,
      hosted_effects_status: config.allowHostedEffects ? "candidate-enabled" : "disabled",
      restricted_host_profile_status: config.codexHome ? "verified-startup" : "not-required",
      windows_sandbox_mode: config.windowsSandboxMode,
      windows_hosted_command_sandbox_status: config.probeWindowsHostedEffects
        ? "preflight-passed-not-backend-attested" : "not-probed",
      windows_backend_sandbox_status: windowsBackendSandboxStatus,
      restricted_host_config_sha256: restrictedConfigDigest,
      restricted_mcp_catalog_preflight_required: Boolean(config.codexHome),
      restricted_mcp_server_names: config.codexHome ? expectedMcpServers.map(server => server.name) : null,
      mcp_hook_profile_source_sha256: hookProfile?.sha256 ?? null,
      model_wire_guard_status: modelWireGuard ? "verified-loopback-candidate" : "disabled",
      model_wire_provider_id: modelWireGuard ? config.modelWireProviderId : null,
      guarded_user_input_status: config.guardedUserInput ? "plan-mode-candidate-enabled" : "disabled",
      model_entry_boundary: guardedTextOnly ? "guarded-text-only-candidate"
        : turnIngressDeclaration === "windows-client.hook-boundary-unverified" ? "paused-windows-hooks" : "not-verified",
      ...(process.env.ARE_INTEGRATION_TEST_MODE === "1"
        ? {integration_test_hosted_client_pid: client.child.pid} : {}),
      authority_effect: "none"})}\n`);
    const signal = new Promise(resolveSignal => {
      process.once("SIGINT", () => resolveSignal("signal"));
      process.once("SIGTERM", () => resolveSignal("signal"));
      if (process.connected) process.on("message", message => {
        if (isManagedStopMessage(message)) resolveSignal("signal");
        else if (process.env.ARE_INTEGRATION_TEST_MODE === "1" && modelWireGuard
          && isManagedTestGuardFaultMessage(message)) void modelWireGuard.close();
      });
    });
    const stopped = await Promise.race([watchExit(gateway, "gateway"), watchExit(client, "hosted-client"),
      ...(companion ? [watchExit(companion, "companion")] : []),
      ...(modelWireGuard ? [modelWireGuard.stopped] : []), signal]);
    output.write(`${JSON.stringify({schema_version: "are.managed-session-stopped/v1", component: stopped,
      authority_effect: "none"})}\n`);
    return stopped === "signal" ? 0 : 1;
  } finally {
    if (guardHeartbeatTimer) clearInterval(guardHeartbeatTimer);
    await stop(companion);
    try {
      await stop(client);
      if (config.hookBridge) {
        const connectionFile = join(config.stateDir, "hook-connection.json");
        if (existsSync(connectionFile) && !reclaimTerminatedHostedHookConnection(connectionFile)) {
          throw new Error("managed-session.hook-connection-not-reclaimed");
        }
      }
    } finally {
      try { await stop(gateway); }
      finally {
        await modelWireGuard?.close();
        if (process.connected) process.disconnect();
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await runManagedSession(parseManagedSessionArgs(process.argv.slice(2))); }
  catch (error) {
    process.stderr.write(`${JSON.stringify({schema_version: "are.managed-session-start-failure/v1", ok: false,
      reason: error?.message ?? "managed-session.failed", authority_effect: "none"})}\n`);
    process.exitCode = 1;
  }
}
