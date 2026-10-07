#!/usr/bin/env node
// Disposable, model-free probe of the selected App Server's command/exec sandbox.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {once} from "node:events";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createInterface} from "node:readline";
import {materializeHostedCommandExec} from "../src/hosted-effect-command.mjs";
import {validateRestrictedHostConfig} from "../src/restricted-host-profile.mjs";

const [binary, expectedVersion, mode] = process.argv.slice(2);
const windowsUnelevated = mode === "--windows-unelevated";
const report = {schema_version: "are.native-command-exec-sandbox-canary/v1",
  status: "FAIL", current_desktop_task_touched: false, external_model_calls: 0,
  authority_effect: "none"};
let root, outsideRoot, child;
try {
  assert.ok(binary && expectedVersion && (mode === undefined || (windowsUnelevated && process.platform === "win32")),
    "usage: native-command-exec-sandbox-canary <codex> <version> [--windows-unelevated]");
  if (process.platform === "win32") report.requested_windows_sandbox = windowsUnelevated ? "unelevated" : "default";
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  root = mkdtempSync(join(tmpdir(), "are-native-command-exec-"));
  outsideRoot = mkdtempSync(join(tmpdir(), "are-native-command-outside-"));
  const codexHome = join(root, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  writeFileSync(join(codexHome, "config.toml"),
    `web_search = "disabled"\n[features]\nshell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\nplugins = false\nremote_plugin = false\n${windowsUnelevated ? '[windows]\nsandbox = "unelevated"\n' : ""}`,
    {mode: 0o600});
  child = spawn(binary, ["app-server", "--stdio"], {cwd: root,
    env: {...process.env, CODEX_HOME: codexHome}, stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true});
  let stderr = "";
  let streamingDeltaCount = 0;
  let streamingDeltaWireBytes = 0;
  child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-2048); });
  const pending = new Map();
  let nextId = 1;
  createInterface({input: child.stdout, crlfDelay: Infinity}).on("line", line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.method === "command/exec/outputDelta") {
      streamingDeltaCount += 1;
      streamingDeltaWireBytes += Buffer.byteLength(JSON.stringify(message.params ?? {}));
    }
    if (message.method) return;
    const entry = pending.get(String(message.id));
    if (!entry) return;
    pending.delete(String(message.id));
    clearTimeout(entry.timer);
    if (message.error) entry.reject(new Error(`canary.rpc-${entry.method}:${message.error.message}`));
    else entry.resolve(message.result);
  });
  const rpc = (method, params) => new Promise((resolveRpc, rejectRpc) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(String(id));
      rejectRpc(new Error(`canary.rpc-timeout:${method}:${stderr.slice(-200)}`)); }, 10000);
    pending.set(String(id), {method, resolve: resolveRpc, reject: rejectRpc, timer});
    child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id, method, params})}\n`);
  });
  await rpc("initialize", {clientInfo: {name: "are_command_exec_sandbox_canary", version: "1.0.0"}});
  child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", method: "initialized", params: {}})}\n`);
  const effective = await rpc("config/read", {includeLayers: false});
  validateRestrictedHostConfig(effective,
    {expectedWindowsSandbox: windowsUnelevated ? "unelevated" : null});
  const windowsSandbox = effective?.config?.windows?.sandbox
    ?? effective?.config?.windowsSandbox?.sandbox ?? null;
  if (process.platform === "win32") report.effective_windows_sandbox =
    ["elevated", "unelevated"].includes(windowsSandbox) ? windowsSandbox : "not-reported";
  const read = await rpc("command/exec", {command: [process.execPath, "-e", "process.stdout.write('ARE_EXEC_OK')"],
    cwd: root, sandboxPolicy: {type: "readOnly"}, timeoutMs: 5000});
  assert.equal(read.exitCode, 0, "canary.read-command-failed");
  assert.equal(read.stdout, "ARE_EXEC_OK", "canary.read-output-mismatch");
  const outputProbe = await rpc("command/exec", {command: [process.execPath, "-e",
    "process.stdout.write('A'.repeat(100000))"], cwd: root,
  sandboxPolicy: {type: "readOnly"}, timeoutMs: 5000});
  report.default_buffered_output_bytes = Buffer.byteLength(outputProbe.stdout ?? "", "utf8");
  report.default_buffered_output_exit_code = outputProbe.exitCode;
  try {
    const cappedProbe = await rpc("command/exec", {command: [process.execPath, "-e",
      "process.stdout.write('C'.repeat(100000))"], cwd: root,
    sandboxPolicy: {type: "readOnly"}, timeoutMs: 5000, outputBytesCap: 8192});
    report.output_cap_disposition = "accepted";
    report.output_cap_result_bytes = Buffer.byteLength(cappedProbe.stdout ?? "", "utf8");
    report.output_cap_exit_code = cappedProbe.exitCode;
  } catch (error) {
    report.output_cap_disposition = "rejected";
    report.output_cap_reason = String(error?.message ?? error).slice(0, 180);
  }
  try {
    const streamingProbe = await rpc("command/exec", {command: [process.execPath, "-e",
      "process.stdout.write('B'.repeat(100000))"], cwd: root,
    sandboxPolicy: {type: "readOnly"}, timeoutMs: 5000, streamStdoutStderr: true,
    processId: "are-canary-stream-output-1"});
    report.streaming_result_output_bytes = Buffer.byteLength(streamingProbe.stdout ?? "", "utf8");
    report.streaming_notification_count = streamingDeltaCount;
    report.streaming_notification_wire_bytes = streamingDeltaWireBytes;
    report.streaming_disposition = "accepted";
  } catch (error) {
    report.streaming_disposition = "rejected";
    report.streaming_reason = String(error?.message ?? error).slice(0, 180);
  }
  const hosted = materializeHostedCommandExec({repository_root: root,
    request: {kind: "command", proposal: {command: [process.execPath, "-e",
      "process.stdout.write('ARE_HOSTED_EXEC_OK')"], cwd: root}}});
  assert.equal(hosted.ok, true, "canary.hosted-command-materialization-failed");
  const hostedResult = await rpc(hosted.host_method, hosted.params);
  if (hostedResult.exitCode !== 0) report.hosted_command_diagnostic = {
    exit_code: hostedResult.exitCode,
    stderr: String(hostedResult.stderr ?? "").slice(0, 500)};
  assert.equal(hostedResult.exitCode, 0, "canary.hosted-command-shape-failed");
  assert.equal(hostedResult.stdout, "ARE_HOSTED_EXEC_OK", "canary.hosted-command-output-mismatch");
  report.materialized_hosted_command_shape_passed = true;
  const sentinel = join(root, "must-not-write.txt");
  let writeRejected = false;
  try {
    const write = await rpc("command/exec", {command: [process.execPath, "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'UNSAFE')`],
    cwd: root, sandboxPolicy: {type: "readOnly"}, timeoutMs: 5000});
    report.read_only_write_exit_code = write.exitCode;
    writeRejected = write.exitCode !== 0;
  } catch { writeRejected = true; }
  report.read_only_sentinel_created = existsSync(sentinel);
  assert.equal(writeRejected, true, "canary.read-only-write-was-not-rejected");
  assert.equal(existsSync(sentinel), false, "canary.read-only-write-reached-disk");
  const workspaceSandbox = {type: "workspaceWrite", writableRoots: [root],
    excludeSlashTmp: true, excludeTmpdirEnvVar: true, networkAccess: false};
  const workspaceSentinel = join(root, "workspace-write.txt");
  const allowed = await rpc("command/exec", {command: [process.execPath, "-e",
    `require('node:fs').writeFileSync(${JSON.stringify(workspaceSentinel)}, 'ARE_WORKSPACE_OK')`],
  cwd: root, sandboxPolicy: workspaceSandbox, timeoutMs: 5000});
  assert.equal(allowed.exitCode, 0, "canary.workspace-write-failed");
  assert.equal(readFileSync(workspaceSentinel, "utf8"), "ARE_WORKSPACE_OK");
  const outsideSentinel = join(outsideRoot, "must-not-write.txt");
  let outsideRejected = false;
  try {
    const outside = await rpc("command/exec", {command: [process.execPath, "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(outsideSentinel)}, 'UNSAFE')`],
    cwd: root, sandboxPolicy: workspaceSandbox, timeoutMs: 5000});
    outsideRejected = outside.exitCode !== 0;
  } catch { outsideRejected = true; }
  assert.equal(outsideRejected, true, "canary.outside-write-was-not-rejected");
  assert.equal(existsSync(outsideSentinel), false, "canary.outside-write-reached-disk");
  report.status = "PASS";
  report.read_only_execution = true;
  report.read_only_write_denied = true;
  report.workspace_write_inside_allowed = true;
  report.workspace_write_outside_denied = true;
} catch (error) {
  report.reason = String(error?.message ?? error).slice(0, 300);
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit").catch(() => {}),
      new Promise(resolveDelay => setTimeout(resolveDelay, 1000))]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  const cleanupFailures = [];
  for (const target of [root, outsideRoot]) {
    if (!target) continue;
    try { rmSync(target, {recursive: true, force: true, maxRetries: 10, retryDelay: 200}); }
    catch (error) { cleanupFailures.push({path: target, code: error?.code ?? "unknown"}); }
  }
  if (cleanupFailures.length > 0) {
    report.cleanup_failures = cleanupFailures;
    if (report.status === "PASS") {
      report.status = "FAIL";
      report.reason = "canary.cleanup-failed";
      process.exitCode = 1;
    }
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
