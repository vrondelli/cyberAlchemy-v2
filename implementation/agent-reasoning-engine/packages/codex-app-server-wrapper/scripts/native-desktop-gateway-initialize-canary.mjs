#!/usr/bin/env node
// Isolated, model-free installed-binary proof of the managed desktop launch path.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {createReadStream, mkdirSync, mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {connectGatewayRpcTransport} from "../index.mjs";
import {desktopHostProfile} from "../src/desktop-host-profile.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profile = join(packageRoot, "profiles/repository-v1.json");
const gatewayEntrypoint = join(packageRoot, "bin/are-codex-gateway.mjs");
const shimEntrypoint = join(packageRoot, "bin/are-codex-desktop-shim.mjs");
const [binary, expectedVersion, hostProfileId = "desktop-wsl-base/v1"] = process.argv.slice(2);
const probeModelList = process.argv.includes("--model-list");
const hostProfile = desktopHostProfile(hostProfileId);
const report = {schema_version: "are.native-desktop-gateway-initialize-canary/v1",
  status: "FAIL", current_desktop_task_touched: false, external_model_calls: 0,
  desktop_ui_ingress_proven: false, host_profile: hostProfileId, authority_effect: "none"};
let scratch;
let gateway;
let desktop;
const gatewayErrors = [];
let clientStatePath;
let socket;
let token;

function lines(stream, callback) {
  let pending = "";
  stream.on("data", chunk => {
    pending += chunk.toString("utf8");
    let index;
    while ((index = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, index);
      pending = pending.slice(index + 1);
      callback(line);
    }
  });
}

async function until(predicate, stage, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`canary.${stage}-timeout`);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, "exit").catch(() => {});
  child.kill("SIGTERM");
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 10000))]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await exited;
  }
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function inspectNativeInitialization(binaryPath, codexHome) {
  const child = spawn(binaryPath, ["app-server", "--listen", "stdio://"],
    {stdio: ["pipe", "pipe", "pipe"], env: {...process.env, CODEX_HOME: codexHome}});
  const frames = [];
  lines(child.stdout, line => {
    try {
      const message = JSON.parse(line);
      frames.push({kind: typeof message.method === "string" ? "method" : "response",
        method: typeof message.method === "string" ? message.method : null,
        id: Object.hasOwn(message, "id") ? message.id : null,
        has_result: Object.hasOwn(message, "result"), has_error: Object.hasOwn(message, "error")});
    } catch { frames.push({kind: "invalid-json"}); }
  });
  try {
    child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "are_native_desktop_canary", version: "1.0.0"}}})}\n`);
    await until(() => frames.some(frame => frame.kind === "response" && frame.id === 1)
      || child.exitCode !== null, "native-initialize-prefix", 10000);
    return frames.slice(0, 8);
  } finally { await stop(child); }
}

try {
  assert.ok(binary && expectedVersion && hostProfile,
    "usage: native-desktop-gateway-initialize-canary <codex> <version> [desktop-host-profile]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 10000});
  assert.equal(version.status, 0, "canary.version-query-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  const binaryDigest = await sha256File(binary);
  report.backend = {version: expectedVersion, sha256: binaryDigest};
  scratch = mkdtempSync(join(tmpdir(), "are-native-desktop-gateway-"));
  const codexHome = join(scratch, "codex-home");
  const clientState = join(scratch, "desktop-state");
  clientStatePath = join(clientState, "desktop-gateway-state.json");
  const reasoningState = join(scratch, "reasoning-state");
  for (const path of [codexHome, clientState, reasoningState]) mkdirSync(path, {mode: 0o700});
  report.native_initialize_prefix = await inspectNativeInitialization(binary, codexHome);
  socket = join(scratch, "gateway.sock");
  token = randomBytes(32).toString("hex");
  const gatewayLines = [];
  gateway = spawn(process.execPath, [gatewayEntrypoint, "--listen", socket,
    "--backend", "direct-stdio", "--codex-command", binary,
    "--desktop-host-profile", hostProfileId, "--desktop-backend-sha256", binaryDigest,
    "--session-store", join(scratch, "gateway-sessions.jsonl"),
    "--reasoning-state-dir", reasoningState], {stdio: ["ignore", "ignore", "pipe"],
    env: {...process.env, CODEX_HOME: codexHome, ARE_GATEWAY_CONNECTION_TOKEN: token}});
  lines(gateway.stderr, line => {
    try {
      const record = JSON.parse(line);
      if (record.schema_version === "are.gateway-ready/v1") gatewayLines.push(record);
      else gatewayErrors.push(record.reason ?? record.schema_version ?? "unknown");
    } catch { gatewayErrors.push("gateway.stderr-non-json"); }
  });
  await until(() => gatewayLines.length > 0 || gateway.exitCode !== null,
    "gateway-start");
  assert.equal(gateway.exitCode, null, `canary.gateway-start-failed:${gatewayErrors.join(",")}`);
  assert.equal(gatewayLines[0].backend_adapter_id, "codex-app-server/v1");
  assert.deepEqual(gatewayLines[0].desktop_backend_binding,
    {binary_sha256: binaryDigest, host_profile: hostProfileId});
  assert.equal(gatewayLines[0].observed_backend_version, expectedVersion);

  const desktopLines = [];
  const desktopErrors = [];
  desktop = spawn(process.execPath, [shimEntrypoint, ...hostProfile.prefix_args,
    "app-server", ...hostProfile.app_server_args], {stdio: ["pipe", "pipe", "pipe"],
    env: {...process.env, CODEX_HOME: codexHome,
      ARE_DESKTOP_SHIM_MODE: "managed-gateway",
      ARE_DESKTOP_SHIM_CODEX_COMMAND: binary,
      ARE_DESKTOP_SHIM_CODEX_SHA256: binaryDigest,
      ARE_DESKTOP_SHIM_CONFIG: profile,
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: repositoryRoot,
      ARE_DESKTOP_GATEWAY_SOCKET: socket,
      ARE_DESKTOP_GATEWAY_STATE_DIR: clientState,
      ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: token}});
  lines(desktop.stdout, line => {
    try { desktopLines.push(JSON.parse(line)); }
    catch { desktopErrors.push("desktop.stdout-non-json"); }
  });
  lines(desktop.stderr, line => desktopErrors.push(line.slice(0, 256)));
  const clientInfo = {name: "are_native_desktop_canary", version: "1.0.0"};
  desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1,
    method: "initialize", params: {clientInfo}})}\n`);
  await until(() => desktopLines.length > 0 || desktop.exitCode !== null,
    "initialize-response");
  assert.equal(desktop.exitCode, null, `canary.desktop-client-failed:${desktopErrors.join(",")}`);
  assert.equal(desktopLines[0].id, 1);
  assert.equal(typeof desktopLines[0].result?.userAgent, "string",
    `canary.initialize-result-invalid:${JSON.stringify(desktopLines[0]).slice(0, 256)}`);
  await until(() => desktopLines.some(line => line.method === "remoteControl/status/changed"),
    "native-global-notification");
  assert.equal(desktopLines[1].method, "remoteControl/status/changed");
  assert.equal(desktopLines[1].params?.status, "disabled");
  desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", method: "initialized", params: {}})}\n`);
  if (probeModelList) {
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "model/list",
      params: {limit: 20, includeHidden: false}})}\n`);
    await until(() => desktopLines.some(line => line.id === 2) || desktop.exitCode !== null,
      "model-list-response");
    const listing = desktopLines.find(line => line.id === 2);
    assert.equal(desktop.exitCode, null, `canary.desktop-model-list-client-failed:${desktopErrors.join(",")}`);
    assert.ok(Array.isArray(listing?.result?.data), "canary.model-list-result-invalid");
    assert.ok(listing.result.data.length <= 20, "canary.model-list-limit-not-honored");
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "model/list",
      params: {limit: 20, includeHidden: true}})}\n`);
    await until(() => desktopLines.some(line => line.id === 3) || desktop.exitCode !== null,
      "hidden-model-rejection");
    const rejected = desktopLines.find(line => line.id === 3);
    assert.equal(desktop.exitCode, null, `canary.desktop-hidden-model-client-failed:${desktopErrors.join(",")}`);
    assert.equal(rejected?.error?.code, -32082, "canary.hidden-model-request-not-rejected");
    assert.deepEqual(rejected.error.data?.reason_codes, ["host.params-invalid"]);
    report.model_list = {bounded_read_completed: true,
      hidden_model_request_rejected: true, data_count: listing.result.data.length};
  }
  desktop.stdin.end();
  await until(() => desktop.exitCode !== null, "desktop-exit");
  assert.equal(desktop.exitCode, 0, `canary.desktop-client-exit:${desktopErrors.join(",")}`);
  const state = JSON.parse(readFileSync(clientStatePath, "utf8"));
  assert.equal(state.consumer_id, "codex:desktop-wsl");
  assert.equal(state.intents.length, probeModelList ? 3 : 1);
  assert.ok(state.intents.every(intent => intent.status === "response-recorded"));
  assert.equal(state.deliveries.length, probeModelList ? 4 : 2);
  report.status = "PASS";
  report.initialized = true;
  report.gateway_profile_source = "verified-runtime-bundle";
  report.desktop_gateway_consumer = state.consumer_id;
  report.delivery_count = state.deliveries.length;
  report.global_notification = desktopLines[1].method;
} catch (error) {
  report.reason = typeof error?.message === "string" ? error.message.slice(0, 512) : "canary.failed";
  report.gateway_diagnostics = gatewayErrors.slice(-8);
  if (clientStatePath) {
    try {
      const state = JSON.parse(readFileSync(clientStatePath, "utf8"));
      report.client_state = {intent_count: state.intents?.length,
        pending_count: state.intents?.filter(entry => entry.status === "pending").length,
        delivery_count: state.deliveries?.length};
      if (socket && token && gateway?.exitCode === null) {
        let diagnostic;
        const probe = connectGatewayRpcTransport({socket_path: socket,
          connection_token: token, consumer_id: "codex:desktop-wsl",
          lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1",
          resume_token: state.resume_token, last_acked_sequence: state.last_acked_sequence,
          delivery_handler: delivery => {
            diagnostic = {request_key_present: delivery.request_key !== null,
              response_kind: Object.hasOwn(delivery.message, "error") ? "error" : "result",
              error_code: delivery.message.error?.code ?? null,
              reason_codes: delivery.message.error?.data?.reason_codes ?? []};
            return false;
          }});
        try {
          await probe.ready;
          await until(() => diagnostic !== undefined, "diagnostic-delivery", 3000);
          report.delivery_diagnostic = diagnostic;
        } catch { report.delivery_diagnostic = {status: "unavailable"}; }
        await probe.close().catch(() => {});
      }
    } catch { report.client_state = {status: "unavailable"}; }
  }
  process.exitCode = 1;
} finally {
  await stop(desktop);
  await stop(gateway);
  if (scratch && (!gateway || gateway.exitCode !== null)
    && (!desktop || desktop.exitCode !== null)) rmSync(scratch, {recursive: true, force: true});
}
process.stdout.write(`${JSON.stringify(report)}\n`);
