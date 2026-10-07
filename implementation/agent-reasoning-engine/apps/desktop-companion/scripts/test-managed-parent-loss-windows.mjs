#!/usr/bin/env node
// Disposable native-Windows canary: a guarded managed session must not leave
// its IPC-owned gateway or hosted client running after abrupt parent loss.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";

assert.equal(process.platform, "win32", "native Windows is required");
const duringStartup = process.argv[4] === "--during-startup";
const withCompanion = process.argv[4] === "--with-companion" ? resolve(process.argv[5] ?? "") : null;
assert.ok(process.argv.length === 4 || (process.argv.length === 5 && duringStartup)
  || (process.argv.length === 6 && withCompanion),
"usage: test-managed-parent-loss-windows.mjs <node.exe> <codex.exe> [--during-startup | --with-companion <are-companion.exe>]");
const [node, codex] = process.argv.slice(2).map(value => resolve(value));
for (const path of [node, codex]) assert.ok(existsSync(path), `Missing test input: ${path}`);
if (withCompanion) assert.ok(existsSync(withCompanion), `Missing test input: ${withCompanion}`);
const productRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const repositoryRoot = resolve(productRoot, "../../..");
const managerEntry = join(productRoot, "packages/codex-app-server-wrapper/bin/are-managed-session.mjs");
const scratch = mkdtempSync(join(tmpdir(), "are-managed-parent-loss-"));
const state = join(scratch, "state");
const codexHome = join(state, "codex-home");
let manager;
let children = [];
let companionPid = null;
let diagnostics = "";

function processRows(parentPid) {
  const script = `$ErrorActionPreference = 'Stop'
$rows = @(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${parentPid}' | Select-Object ProcessId,ExecutablePath)
ConvertTo-Json -InputObject @($rows) -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15000});
  if (result.error || result.status !== 0) {
    throw new Error(`process-inspection-failed:${result.error?.message ?? result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout.trim());
}

function pidExists(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function poll(work, label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await work();
    if (result) return result;
    await new Promise(done => setTimeout(done, 150));
  }
  throw new Error(`${label}:timeout`);
}

try {
  mkdirSync(state);
  mkdirSync(codexHome);
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n[features]\nshell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\nremote_plugin = false\nplugins = false\n[model_providers.are_fixture]\nname = "ARE no-model parent-loss fixture"\nbase_url = "http://127.0.0.1:1/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[projects.${JSON.stringify(productRoot)}]\ntrust_level = "trusted"\n`);
  manager = spawn(node, [managerEntry,
    "--config", join(productRoot, "packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json"),
    "--repository-root", repositoryRoot, "--codex-command", codex,
    "--state-dir", state, "--cwd", productRoot,
    ...(withCompanion ? ["--companion-command", withCompanion] : []),
    "--require-restricted-host-profile", "--codex-home", codexHome,
    "--model-wire-upstream", "http://127.0.0.1:1/v1/responses",
    "--model-wire-provider-id", "are_fixture", "--windows-guarded-text-turns"], {
    env: {...process.env, CODEX_HOME: codexHome,
      ARE_COMPANION_NODE: node, ARE_COMPANION_ENTRY: join(productRoot, "bin/are.mjs"),
      ARE_COMPANION_PREFERENCES_PATH: join(scratch, "companion.json"),
      WEBVIEW2_USER_DATA_FOLDER: join(scratch, "webview2")},
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  manager.stderr.on("data", chunk => { diagnostics = (diagnostics + chunk).slice(-2000); });
  const records = [];
  createInterface({input: manager.stdout, crlfDelay: Infinity}).on("line", line => {
    try { records.push(JSON.parse(line)); } catch { /* Ignore non-record output. */ }
  });
  if (duringStartup) {
    children = await poll(() => {
      if (manager.exitCode !== null) throw new Error(`manager-exited:${diagnostics}`);
      const rows = processRows(manager.pid).filter(row => row.ExecutablePath?.toLowerCase() === node.toLowerCase());
      return rows.length > 0 ? rows : null;
    }, "first-managed-child", 45000);
  } else {
    const ready = await poll(() => {
      if (manager.exitCode !== null) throw new Error(`manager-exited:${diagnostics}`);
      return records.find(item => item.schema_version === "are.managed-session-ready/v1");
    }, "managed-session-ready", 45000);
    assert.equal(ready.ok, true);
    assert.equal(ready.companion_process_started, Boolean(withCompanion));
    assert.equal(ready.model_entry_boundary, "guarded-text-only-candidate");
    assert.equal(ready.managed_gateway_turn_ingress_blocked_reason, null);
    assert.equal(ready.hosted_effects_status, "disabled");
    assert.equal(ready.current_desktop_task_control, false);
    children = processRows(manager.pid).filter(row => row.ExecutablePath?.toLowerCase() === node.toLowerCase());
    assert.equal(children.length, 2, "expected exactly one IPC-owned gateway and hosted client");
    if (withCompanion) {
      const companions = processRows(manager.pid).filter(row => row.ExecutablePath?.toLowerCase() === withCompanion.toLowerCase());
      assert.equal(companions.length, 1, "expected exactly one managed Companion child");
      companionPid = companions[0].ProcessId;
    }
  }
  assert.ok(children.every(row => pidExists(row.ProcessId)));
  process.kill(manager.pid, "SIGKILL");
  if (duringStartup) {
    for (const row of processRows(manager.pid).filter(row => row.ExecutablePath?.toLowerCase() === node.toLowerCase())) {
      if (!children.some(owned => owned.ProcessId === row.ProcessId)) children.push(row);
    }
  }
  await poll(() => manager.exitCode !== null || manager.signalCode !== null,
    "manager-killed", 10000);
  await poll(() => children.every(row => !pidExists(row.ProcessId)),
    "ipc-owned-children-stopped", 15000);
  if (companionPid !== null) await poll(() => !pidExists(companionPid),
    "managed-companion-stopped", 5000);
  process.stdout.write(`${JSON.stringify({schema_version: "are.managed-parent-loss-windows-canary/v1",
    ok: true, guarded_text_mode_requested: true, startup_loss: duringStartup,
    ipc_owned_children: children.length,
    companion_stopped_on_parent_loss: companionPid === null ? null : true,
    parent_killed_without_cleanup: true, children_stopped_on_disconnect: true,
    private_model_calls: 0, external_model_calls: 0, current_desktop_task_control: false,
    installed: false, authority_effect: "none"})}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.managed-parent-loss-windows-canary-failure/v1",
    ok: false, reason: error.message, managed_diagnostics_present: diagnostics.length > 0,
    authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  if (manager && manager.exitCode === null && manager.signalCode === null) manager.kill("SIGTERM");
  for (const row of children) if (pidExists(row.ProcessId)) process.kill(row.ProcessId, "SIGTERM");
  if (companionPid !== null && pidExists(companionPid)) process.kill(companionPid, "SIGTERM");
  rmSync(scratch, {recursive: true, force: true, maxRetries: 20, retryDelay: 200});
}
