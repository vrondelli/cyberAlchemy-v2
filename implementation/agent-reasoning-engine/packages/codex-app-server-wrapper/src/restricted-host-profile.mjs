import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {once} from "node:events";
import {closeSync, constants, existsSync, fstatSync, lstatSync, mkdtempSync, openSync,
  readFileSync, realpathSync, rmSync, statSync} from "node:fs";
import {tmpdir} from "node:os";
import {isAbsolute, join} from "node:path";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "./rpc-client.mjs";

const DISABLED_FEATURES = Object.freeze([
  "shell_tool", "unified_exec", "apps", "multi_agent", "goals", "plugins", "remote_plugin",
]);
const MAX_RESTRICTED_CONFIG_BYTES = 1024 * 1024;

// This binds the dedicated Codex home bytes across controller/backend restarts.
// It supplements effective config/read and thread tool-catalog checks; it is
// not an atomic snapshot of every configuration layer or a tool effect broker.
export function restrictedHostConfigDigest(codexHome) {
  if (typeof codexHome !== "string" || !isAbsolute(codexHome)
    || lstatSync(codexHome).isSymbolicLink()
    || realpathSync(codexHome) !== codexHome) {
    throw new Error("managed-session.codex-home-invalid");
  }
  const homeStat = statSync(codexHome);
  if (!homeStat.isDirectory() || (process.platform !== "win32"
    && ((homeStat.mode & 0o077) !== 0 || homeStat.uid !== process.getuid()))) {
    throw new Error("managed-session.codex-home-invalid");
  }
  const path = join(codexHome, "config.toml");
  const pathStat = lstatSync(path);
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.size < 1
    || pathStat.size > MAX_RESTRICTED_CONFIG_BYTES) {
    throw new Error("managed-session.codex-home-config-invalid");
  }
  const descriptor = openSync(path, constants.O_RDONLY
    | (process.platform === "win32" ? 0 : constants.O_NOFOLLOW));
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.size !== pathStat.size
      || before.ino !== pathStat.ino || before.dev !== pathStat.dev
      || (process.platform !== "win32"
        && ((before.mode & 0o077) !== 0 || before.uid !== process.getuid()))) {
      throw new Error("managed-session.codex-home-config-invalid");
    }
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (bytes.length !== before.size || after.size !== before.size
      || after.mtimeMs !== before.mtimeMs) {
      throw new Error("managed-session.codex-home-config-changed-during-read");
    }
    const digest = createHash("sha256").update("are.restricted-host-files/v2\0")
      .update(bytes).update("\0hooks.json\0");
    const hookPath = join(codexHome, "hooks.json");
    if (!existsSync(hookPath)) return digest.update("absent").digest("hex");
    const hookStat = lstatSync(hookPath);
    if (!hookStat.isFile() || hookStat.isSymbolicLink() || hookStat.size < 2
      || hookStat.size > 8192 || (process.platform !== "win32"
        && ((hookStat.mode & 0o077) !== 0 || hookStat.uid !== process.getuid()))) {
      throw new Error("managed-session.codex-home-hooks-invalid");
    }
    const hookDescriptor = openSync(hookPath, constants.O_RDONLY
      | (process.platform === "win32" ? 0 : constants.O_NOFOLLOW));
    try {
      const before = fstatSync(hookDescriptor);
      if (!before.isFile() || before.size !== hookStat.size
        || before.ino !== hookStat.ino || before.dev !== hookStat.dev) {
        throw new Error("managed-session.codex-home-hooks-invalid");
      }
      const hookBytes = readFileSync(hookDescriptor);
      const after = fstatSync(hookDescriptor);
      if (hookBytes.length !== before.size || after.size !== before.size
        || after.mtimeMs !== before.mtimeMs) {
        throw new Error("managed-session.codex-home-hooks-changed-during-read");
      }
      return digest.update("present\0").update(hookBytes).digest("hex");
    } finally { closeSync(hookDescriptor); }
  } finally { closeSync(descriptor); }
}

export function restrictedHostConfigMatches(binding) {
  if (!binding || typeof binding.codex_home !== "string"
    || !/^[0-9a-f]{64}$/.test(binding.sha256 ?? "")) return false;
  try { return restrictedHostConfigDigest(binding.codex_home) === binding.sha256; }
  catch { return false; }
}

export function preflightRestrictedHostHome(stateDir, codexHome) {
  if (codexHome !== join(stateDir, "codex-home")) {
    throw new Error("managed-session.codex-home-must-be-dedicated-state-child");
  }
  const home = realpathSync(codexHome);
  if (home !== join(stateDir, "codex-home") || lstatSync(codexHome).isSymbolicLink()
    || !statSync(home).isDirectory()) throw new Error("managed-session.codex-home-invalid");
  const config = join(home, "config.toml");
  if (lstatSync(config).isSymbolicLink() || !statSync(config).isFile()) {
    throw new Error("managed-session.codex-home-config-invalid");
  }
  if (process.platform !== "win32") {
    const uid = typeof process.getuid === "function" ? process.getuid() : null;
    for (const path of [home, config]) {
      const info = statSync(path);
      if ((info.mode & 0o077) !== 0 || (uid !== null && info.uid !== uid)) {
        throw new Error("managed-session.codex-home-not-private");
      }
    }
  }
  return home;
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Diagnostic only: all probes use generated paths, never a model turn or an
// arbitrary user command. This is not a reusable attestation for a later
// backend process or permission to dispatch a hosted effect.
export async function probeWindowsHostedCommandSandbox({rpc, workspaceRoot, nodeCommand} = {}) {
  if (process.platform !== "win32" || typeof rpc?.request !== "function"
    || typeof workspaceRoot !== "string" || !isAbsolute(workspaceRoot)
    || realpathSync(workspaceRoot) !== workspaceRoot || !statSync(workspaceRoot).isDirectory()
    || typeof nodeCommand !== "string" || !isAbsolute(nodeCommand)) {
    throw new Error("managed-session.windows-sandbox-probe-input-invalid");
  }
  let insideRoot, outsideRoot;
  const command = (code, policy) => rpc.request("command/exec", {
    command: [nodeCommand, "-e", code], cwd: workspaceRoot, sandboxPolicy: policy,
    timeoutMs: 5000, tty: false,
    streamStdin: false, streamStdoutStderr: false}, {timeout_ms: 10000});
  const denied = async (path, policy) => {
    let result;
    try { result = await command(`require('node:fs').writeFileSync(${JSON.stringify(path)}, 'UNSAFE')`, policy); }
    catch (error) {
      if (error?.code !== "rpc.response-error") throw error;
    }
    return (result === undefined || (Number.isSafeInteger(result.exitCode) && result.exitCode !== 0))
      && !existsSync(path);
  };
  try {
    insideRoot = mkdtempSync(join(workspaceRoot, ".are-sandbox-probe-"));
    outsideRoot = mkdtempSync(join(tmpdir(), "are-sandbox-outside-"));
    let read;
    try { read = await command("process.stdout.write('ARE_EXEC_OK')", {type: "readOnly"}); }
    catch { throw new Error("managed-session.windows-sandbox-read-command-failed"); }
    if (read?.exitCode !== 0 || read.stdout !== "ARE_EXEC_OK") {
      throw new Error("managed-session.windows-sandbox-read-command-failed");
    }
    if (!await denied(join(insideRoot, "read-only-must-not-write.txt"), {type: "readOnly"})) {
      throw new Error("managed-session.windows-sandbox-read-only-write-allowed");
    }
    const workspacePolicy = {type: "workspaceWrite", writableRoots: [workspaceRoot],
      excludeSlashTmp: true, excludeTmpdirEnvVar: true, networkAccess: false};
    const inside = join(insideRoot, "workspace-write.txt");
    let allowed, written;
    try {
      allowed = await command(`require('node:fs').writeFileSync(${JSON.stringify(inside)}, 'ARE_WORKSPACE_OK')`,
        workspacePolicy);
      written = existsSync(inside) ? readFileSync(inside, "utf8") : null;
    } catch { throw new Error("managed-session.windows-sandbox-workspace-write-failed"); }
    if (allowed?.exitCode !== 0 || written !== "ARE_WORKSPACE_OK") {
      throw new Error("managed-session.windows-sandbox-workspace-write-failed");
    }
    if (!await denied(join(outsideRoot, "must-not-write.txt"), workspacePolicy)) {
      throw new Error("managed-session.windows-sandbox-outside-write-allowed");
    }
    return {status: "passed", read_only_execution: true, read_only_write_denied: true,
      workspace_write_inside_allowed: true, workspace_write_outside_denied: true};
  } finally {
    for (const path of [insideRoot, outsideRoot]) {
      if (path) rmSync(path, {recursive: true, force: true, maxRetries: 10, retryDelay: 200});
    }
  }
}

export function validateRestrictedHostConfig(result, {expectedMcpServers = [], expectedModelWire = null,
  expectedWindowsSandbox = null} = {}) {
  const features = result?.config?.features;
  if (!features || DISABLED_FEATURES.some(key => features[key] !== false)) {
    throw new Error("managed-session.restricted-host-features-not-disabled");
  }
  if ((result.config.webSearch ?? result.config.web_search) !== "disabled") {
    throw new Error("managed-session.restricted-host-web-search-not-disabled");
  }
  if (expectedWindowsSandbox !== null) {
    validateWindowsSandboxMode(result, expectedWindowsSandbox);
  }
  const servers = result.config.mcpServers ?? result.config.mcp_servers;
  if (!record(servers) || !Array.isArray(expectedMcpServers)
    || expectedMcpServers.some(server => !record(server) || typeof server.name !== "string"
      || typeof server.command !== "string" || !Array.isArray(server.args)
      || server.args.some(arg => typeof arg !== "string") || !Array.isArray(server.tools)
      || server.tools.some(tool => typeof tool !== "string"))
    || new Set(expectedMcpServers.map(server => server.name)).size !== expectedMcpServers.length) {
    throw new Error("managed-session.restricted-mcp-policy-invalid");
  }
  const actualNames = Object.keys(servers).sort();
  const expectedNames = expectedMcpServers.map(server => server.name).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error("managed-session.restricted-mcp-server-set-mismatch");
  }
  const allowedFields = new Set(["args", "command", "enabled", "enabled_tools",
    "environment_id", "required", "startup_timeout_sec", "tool_timeout_sec"]);
  for (const expected of expectedMcpServers) {
    const server = servers[expected.name];
    const actualTools = server?.enabled_tools;
    if (!record(server) || Object.keys(server).some(key => !allowedFields.has(key))
      || server.command !== expected.command || server.enabled !== true
      || server.required !== true || server.environment_id !== "local"
      || !Array.isArray(server.args) || JSON.stringify(server.args) !== JSON.stringify(expected.args)
      || !Array.isArray(actualTools)
      || JSON.stringify([...actualTools].sort()) !== JSON.stringify([...expected.tools].sort())) {
      throw new Error("managed-session.restricted-mcp-server-identity-mismatch");
    }
  }
  if (expectedModelWire !== null) {
    const providerId = result.config.modelProvider ?? result.config.model_provider;
    const providers = result.config.modelProviders ?? result.config.model_providers;
    const selected = providers?.[expectedModelWire.provider_id];
    const baseUrl = selected?.baseUrl ?? selected?.base_url;
    const envHeaders = selected?.envHttpHeaders ?? selected?.env_http_headers;
    if (!record(expectedModelWire) || typeof expectedModelWire.provider_id !== "string"
      || typeof expectedModelWire.base_url !== "string"
      || typeof expectedModelWire.env_header_var !== "string"
      || providerId !== expectedModelWire.provider_id || baseUrl !== expectedModelWire.base_url
      || !record(envHeaders) || Object.keys(envHeaders).length !== 1
      || envHeaders["X-ARE-Guard-Token"] !== expectedModelWire.env_header_var) {
      throw new Error("managed-session.model-wire-provider-binding-mismatch");
    }
  }
  return {features: Object.fromEntries(DISABLED_FEATURES.map(key => [key, false])),
    web_search: "disabled", mcp_server_names: actualNames,
    model_wire_provider_id: expectedModelWire?.provider_id ?? null,
    windows_sandbox_mode: expectedWindowsSandbox};
}

export function validateWindowsSandboxMode(result, expectedWindowsSandbox) {
  if (!["elevated", "unelevated"].includes(expectedWindowsSandbox)) {
    throw new Error("managed-session.windows-sandbox-policy-invalid");
  }
  const modes = [result?.config?.windows?.sandbox, result?.config?.windowsSandbox?.sandbox]
    .filter(mode => mode !== undefined);
  if (modes.length === 0 || modes.some(mode => mode !== expectedWindowsSandbox)) {
    throw new Error("managed-session.windows-sandbox-mode-mismatch");
  }
  return expectedWindowsSandbox;
}

export async function verifyRestrictedHostProfile({codexCommand, codexHome, cwd, expectedMcpServers = [],
  codexPrefixArgs = [], expectedModelWire = null, expectedWindowsSandbox = null,
  probeWindowsHostedEffects = false,
  baseEnv = process.env, envOverrides = {}}) {
  if (!Array.isArray(codexPrefixArgs) || codexPrefixArgs.some(arg => typeof arg !== "string")) {
    throw new TypeError("managed-session.codex-prefix-args-invalid");
  }
  if (!record(baseEnv) || !record(envOverrides)
    || Object.values(envOverrides).some(value => typeof value !== "string")) {
    throw new TypeError("managed-session.preflight-env-invalid");
  }
  let child;
  const transport = spawnAppServerRpcTransport({command: codexCommand,
    args: [...codexPrefixArgs, "app-server", "--stdio"],
    env: {...baseEnv, CODEX_HOME: codexHome, ...envOverrides},
    spawn_impl: (command, args, options) => {
      child = spawn(command, args, {...options, cwd, windowsHide: true});
      return child;
    }});
  const rpc = createAppServerRpcClient({transport, request_timeout_ms: 15000});
  try {
    await rpc.initialize({clientInfo: {name: "are_restricted_host_preflight", version: "1.0.0"}});
    await rpc.notify("initialized", {});
    const result = await rpc.request("config/read", {includeLayers: false}, {timeout_ms: 15000});
    const validated = validateRestrictedHostConfig(result, {expectedMcpServers, expectedModelWire,
      expectedWindowsSandbox});
    if (probeWindowsHostedEffects) {
      if (expectedWindowsSandbox === null) {
        throw new Error("managed-session.windows-sandbox-probe-mode-required");
      }
      return {...validated, windows_hosted_command_sandbox: await probeWindowsHostedCommandSandbox({
        rpc, workspaceRoot: cwd, nodeCommand: process.execPath})};
    }
    return validated;
  } finally {
    await rpc.close();
    if (child && child.exitCode === null && child.signalCode === null) {
      await Promise.race([once(child, "close").catch(() => {}),
        new Promise(resolveDelay => setTimeout(resolveDelay, 3000))]);
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  }
}
