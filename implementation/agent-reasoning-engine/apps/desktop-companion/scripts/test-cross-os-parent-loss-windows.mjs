#!/usr/bin/env node
// Disposable native-Windows canary for the development cross-OS parent.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomBytes} from "node:crypto";
import {existsSync} from "node:fs";
import {connect} from "node:net";
import {basename, dirname, join} from "node:path";
import {createInterface} from "node:readline";

assert.equal(process.platform, "win32", "native Windows is required");
const [node, launcher, ...launcherArgs] = process.argv.slice(2);
assert.ok(node && launcher && existsSync(node) && existsSync(launcher),
  "usage: test-cross-os-parent-loss-windows.mjs <node.exe> <run.mjs> <launcher arguments>");
const option = name => {
  const index = launcherArgs.indexOf(name);
  assert.ok(index >= 0 && index + 1 < launcherArgs.length, `Missing ${name}`);
  return launcherArgs[index + 1];
};
const port = Number(option("--observer-port"));
const companionExe = option("--companion-exe").toLowerCase();
assert.ok(Number.isSafeInteger(port) && port > 0 && port <= 65535);
assert.ok(existsSync(companionExe));
const nativeOrb = join(dirname(companionExe), "native-orb", "are-native-orb.exe");
const companionMode = basename(companionExe) === "are-companion.exe" && existsSync(nativeOrb)
  ? "native-orb" : "direct";
const ownedCompanionPath = companionMode === "native-orb" ? nativeOrb.toLowerCase() : companionExe;

function processRows(parentPid) {
  const script = `$ErrorActionPreference = 'Stop'
$rows = @(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${parentPid}' | Select-Object ProcessId,ExecutablePath)
ConvertTo-Json -InputObject @($rows) -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15_000});
  if (result.error || result.status !== 0) throw new Error("cross-os-parent-loss.process-inspection-failed");
  return JSON.parse(result.stdout.trim());
}

function pidExists(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function portClosed() {
  return new Promise(resolveResult => {
    const socket = connect(port, "127.0.0.1");
    const done = closed => { socket.destroy(); resolveResult(closed); };
    socket.once("connect", () => done(false));
    socket.once("error", error => done(error.code === "ECONNREFUSED"));
    socket.setTimeout(1500, () => done(false));
  });
}

async function poll(work, label, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await work();
    if (value) return value;
    await new Promise(resolveWait => setTimeout(resolveWait, 200));
  }
  throw new Error(`${label}:timeout`);
}

let parent;
let restartParent;
let companionPid;
let wslPid;
let ready;
let lastFailure = null;
const token = () => randomBytes(32).toString("hex");
try {
  parent = spawn(node, [launcher, ...launcherArgs, "--stop-after-ms", "120000"], {
    env: {...process.env, ARE_INTEGRATION_TEST_MODE: "1",
      ARE_CROSS_OS_TEST_TOKEN: token()},
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  const records = [];
  createInterface({input: parent.stdout, crlfDelay: Infinity}).on("line", line => {
    try { records.push(JSON.parse(line)); } catch { /* No untrusted output forwarding. */ }
  });
  createInterface({input: parent.stderr, crlfDelay: Infinity}).on("line", line => {
    try {
      const record = JSON.parse(line);
      if (typeof record.reason === "string") lastFailure = record.reason;
    } catch { /* No untrusted output forwarding. */ }
  });
  ready = await poll(() => {
    if (parent.exitCode !== null) throw new Error(lastFailure ?? "cross-os-parent-loss.parent-exited");
    return records.find(record => record.schema_version === "are.cross-os-windows-ready/v1");
  }, "cross-os-parent-ready", 75_000);
  assert.equal(ready.ok, true);
  assert.equal(ready.current_desktop_task_control, false);
  assert.equal(ready.observation_endpoint, `tcp://127.0.0.1:${port}`);
  assert.equal(ready.companion_mode, companionMode);
  const children = processRows(parent.pid);
  companionPid = children.find(row => row.ExecutablePath?.toLowerCase() === ownedCompanionPath)?.ProcessId;
  wslPid = children.find(row => row.ExecutablePath?.toLowerCase().endsWith("\\wsl.exe"))?.ProcessId;
  assert.ok(companionPid && wslPid, "Expected one owned Companion and one WSL child");
  assert.equal(await portClosed(), false, "Observation endpoint was not live before parent loss");
  process.kill(parent.pid, "SIGKILL");
  await poll(() => parent.exitCode !== null || parent.signalCode !== null,
    "windows-parent-stopped", 10_000);
  await poll(portClosed, "wsl-observer-stopped-after-parent-loss", 30_000);
  await poll(() => !pidExists(companionPid), "companion-stopped-after-parent-loss", 15_000);
  await poll(() => !pidExists(wslPid), "wsl-child-stopped-after-parent-loss", 15_000);
  const restartRecords = [];
  let restartFailure = null;
  restartParent = spawn(node, [launcher, ...launcherArgs, "--stop-after-ms", "120000"], {
    env: {...process.env, ARE_INTEGRATION_TEST_MODE: "1",
      ARE_CROSS_OS_TEST_TOKEN: token()},
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  createInterface({input: restartParent.stdout, crlfDelay: Infinity}).on("line", line => {
    try { restartRecords.push(JSON.parse(line)); } catch { /* No untrusted output forwarding. */ }
  });
  createInterface({input: restartParent.stderr, crlfDelay: Infinity}).on("line", line => {
    try {
      const record = JSON.parse(line);
      if (typeof record.reason === "string") restartFailure = record.reason;
    } catch { /* No untrusted output forwarding. */ }
  });
  const recovered = await poll(() => {
    if (restartParent.exitCode !== null) throw new Error(restartFailure ?? "cross-os-parent-loss.restart-exited");
    return restartRecords.find(record => record.schema_version === "are.cross-os-windows-ready/v1");
  }, "same-state-restart-ready", 75_000);
  assert.equal(recovered.ok, true);
  assert.equal(recovered.companion_mode, companionMode);
  assert.equal(recovered.observation_endpoint, `tcp://127.0.0.1:${port}`);
  assert.equal(await portClosed(), false, "Recovered observer was not live");
  restartParent.stdin.end("stop\n");
  await poll(() => restartParent.exitCode !== null || restartParent.signalCode !== null,
    "same-state-restart-stopped", 60_000);
  assert.equal(restartParent.exitCode, 0, "Recovered launcher did not stop cleanly");
  await poll(portClosed, "recovered-observer-stopped", 10_000);
  process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-parent-loss-canary/v1",
    ok: true, parent_killed_without_cleanup: true, observer_stopped: true,
    companion_stopped: true, wsl_child_stopped: true, same_state_restart_ready: true,
    same_state_restart_stopped: true, external_model_calls: 0,
    current_desktop_task_control: false, authority_effect: "none"})}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.cross-os-parent-loss-canary-failure/v1",
    ok: false, reason: error.message, ready_observed: Boolean(ready),
    companion_still_running: companionPid ? pidExists(companionPid) : null,
    wsl_child_still_running: wslPid ? pidExists(wslPid) : null,
    authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  if (restartParent && restartParent.exitCode === null && restartParent.signalCode === null) {
    restartParent.stdin?.end("stop\n");
    await Promise.race([new Promise(resolveExit => restartParent.once("exit", resolveExit)),
      new Promise(resolveWait => setTimeout(resolveWait, 30_000))]);
    if (restartParent.exitCode === null && restartParent.signalCode === null) restartParent.kill("SIGTERM");
  }
  if (parent && parent.exitCode === null && parent.signalCode === null) {
    parent.stdin?.end("stop\n");
    await Promise.race([new Promise(resolveExit => parent.once("exit", resolveExit)),
      new Promise(resolveWait => setTimeout(resolveWait, 30_000))]);
    if (parent.exitCode === null && parent.signalCode === null) parent.kill("SIGTERM");
  }
}
