#!/usr/bin/env node
// Disposable installed-host proof through the real hosted-client executable.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {hostedMcpHookProfile} from "../src/hosted-hook-profile.mjs";

const sourcePackageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageRoot = process.env.ARE_MANAGED_CANARY_PACKAGE_ROOT
  ? resolve(process.env.ARE_MANAGED_CANARY_PACKAGE_ROOT) : sourcePackageRoot;
const productRoot = resolve(packageRoot, "../..");
const repositoryRoot = resolve(packageRoot, "../../../../../");
const checkoutRoot = resolve(repositoryRoot, "cyberAlchemy-v2");
const binary = resolve(process.argv[2] ?? "");
const pollStress = process.argv[3] === "--poll-stress";
const goalToolProbe = process.argv[3] === "--probe-goal-tool";
const callbackOutageProbe = process.argv[3] === "--probe-callback-outage";
const mcpToolMissingProbe = process.argv[3] === "--mcp-hook-missing-tool";
const managedUiMcpProbe = process.argv[3] === "--managed-session-ui-mcp";
const mcpHookProbe = process.argv[3] === "--mcp-hook" || mcpToolMissingProbe || managedUiMcpProbe;
const windowsDirectHookProbe = process.argv[3] === "--managed-session-direct-hook";
const managedUiObserveProbe = process.argv[3] === "--managed-session-ui-observe";
const windowsAncestryProbe = process.platform === "win32" && !mcpHookProbe && !managedUiObserveProbe
  && process.argv[4] !== "--skip-ancestry";
const managedUiProbe = process.argv[3] === "--managed-session-ui" || managedUiObserveProbe || managedUiMcpProbe;
const managedSessionProbe = process.argv[3] === "--managed-session" || managedUiProbe
  || windowsDirectHookProbe || mcpHookProbe;
const expectedVersion = process.env.ARE_NATIVE_CANARY_EXPECTED_VERSION ?? "codex-cli 0.155.0-alpha.16.4";
const scratch = mkdtempSync(join(tmpdir(), "are-hosted-hook-denial-"));
const configRoot = join(scratch, "codex-home");
const hookPath = join(scratch, managedSessionProbe ? "hook-connection.json" : "callback-connection.json");
const socketPath = process.platform === "win32" ? "\\\\.\\pipe\\are-hosted-hook-" + process.pid + "-" + randomUUID() : join(scratch, "gateway.sock");
let token = randomUUID();
const quote = value => process.platform === "win32"
  ? `"${value.replaceAll('"', '\\"')}"`
  : "'" + value.replaceAll("'", "'\\''") + "'";
const sha256 = value => createHash("sha256").update(value).digest("hex");
let provider, gateway, client, managed, native, ready, threadId, turnId;
let providerFailure = null, providerRequests = [], gatewayDiagnostics = () => "", clientDiagnostics = () => "";
let toolResult = null;
let nativeCompletion = null;
let managedUiInspectorPort = null;
let hookInventory = [];
let windowsShellInputControl = null;
const windowsAncestryScript = `$ErrorActionPreference = 'Stop'
$targetPid = __PPID__
$rows = @()
for ($index = 0; $index -lt 4; $index++) {
  $row = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $targetPid) |
    Select-Object -First 1 Name,ParentProcessId
  if ($null -eq $row) { break }
  $rows += @{ name = $row.Name; parent_process_id = $row.ParentProcessId }
  $targetPid = $row.ParentProcessId
}
ConvertTo-Json -InputObject @($rows) -Compress`;

async function freeLoopbackPort() {
  const probe = createServer();
  await new Promise((done, fail) => probe.once("error", fail).listen(0, "127.0.0.1", done));
  const port = probe.address().port;
  await new Promise(done => probe.close(done));
  return port;
}

function events(id, output) {
  const item = output.type === "function_call" ? {id: "fc_" + id, type: "function_call", call_id: "are_hosted_tool_1",
    name: output.name, arguments: JSON.stringify(output.arguments), status: "completed"}
    : {id: "msg_" + id, type: "message", status: "completed", role: "assistant",
      content: [{type: "output_text", text: output.text, annotations: []}]};
  const records = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}}];
  if (output.type !== "function_call") records.push(
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: output.text});
  records.push({type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}});
  return records.map(record => "event: " + record.type + "\ndata: " + JSON.stringify(record) + "\n\n").join("");
}

function childProcess(command, args, environment = process.env) {
  const child = spawn(command, args, {stdio: ["pipe", "pipe", "pipe"], env: environment});
  let diagnostic = "";
  child.stderr.on("data", chunk => { diagnostic = (diagnostic + chunk).slice(-4000); });
  return {child, diagnostics: () => diagnostic};
}

function diagnosticSummary(raw) {
  return raw.split("\n").filter(Boolean).slice(-12).map(line => {
    try {
      const value = JSON.parse(line);
      return {schema_version: value.schema_version ?? null, reason: value.reason ?? null};
    } catch { return {schema_version: null, reason: "non-json-diagnostic"}; }
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolveExit => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await Promise.race([exited, new Promise(resolveTimeout => setTimeout(resolveTimeout, 3000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await exited;
  }
}

function managedWindowsChildren(parentPid) {
  const script = `$ErrorActionPreference = 'Stop'
$rows = @(Get-CimInstance Win32_Process -Filter 'ParentProcessId = ${parentPid}' | Select-Object ProcessId,ExecutablePath,CommandLine)
ConvertTo-Json -InputObject @($rows) -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64")], {encoding: "utf8", timeout: 15000});
  if (result.error || result.status !== 0) throw new Error("native.managed-process-inspection-failed");
  return JSON.parse(result.stdout.trim());
}

async function stopManaged() {
  if (!managed || managed.exitCode !== null || managed.signalCode !== null) return;
  if (process.platform !== "win32") { await stop(managed); return; }
  const children = managedWindowsChildren(managed.pid);
  const companionPath = managedUiProbe ? resolve(process.env.ARE_MANAGED_CANARY_COMPANION) : null;
  const supervisedCompanionPath = managedUiProbe && ready?.companion_mode === "native-orb"
    ? resolve(dirname(companionPath), "native-orb/are-native-orb.exe") : companionPath;
  const target = children.filter(row => managedUiProbe
    ? row.ExecutablePath?.toLowerCase() === supervisedCompanionPath.toLowerCase()
    : row.CommandLine?.includes("are-codex-windows-client.mjs"));
  assert.equal(target.length, 1, "native.managed-stop-child-not-unique");
  const exited = new Promise(done => managed.once("exit", done));
  process.kill(target[0].ProcessId, "SIGTERM");
  // The manager gives the hosted client and gateway separate bounded IPC shutdown windows.
  await Promise.race([exited, new Promise((_, fail) => setTimeout(() => fail(new Error("native.managed-stop-timeout")),
    40000))]);
}

function waitReady(child, schema, diagnostics, stream = child.stderr) {
  return new Promise((resolveReady, rejectReady) => {
    const lines = createInterface({input: stream, crlfDelay: Infinity});
    const timer = setTimeout(() => rejectReady(new Error(schema + " timeout: " + diagnostics())), 30000);
    lines.on("line", line => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== schema) return;
      clearTimeout(timer); lines.close(); resolveReady(value);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer); rejectReady(new Error(schema + " exited " + (signal ?? code) + ": " + diagnostics()));
    });
  });
}

function waitReadyFromStdout(child, schema, diagnostics) {
  return waitReady(child, schema, diagnostics, child.stdout);
}

async function discoverAndTrustHooks() {
  const run = childProcess(binary, ["app-server"], {...process.env, CODEX_HOME: configRoot});
  native = run.child;
  let nextId = 0;
  const pending = new Map();
  createInterface({input: native.stdout, crlfDelay: Infinity}).on("line", line => {
    let value;
    try { value = JSON.parse(line); } catch { return; }
    const waiter = pending.get(value.id);
    if (!waiter) return;
    pending.delete(value.id);
    if (value.error) waiter.reject(new Error(JSON.stringify(value.error)));
    else waiter.resolve(value.result);
  });
  const request = (method, params) => new Promise((resolveResult, rejectResult) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); rejectResult(new Error("native.rpc-timeout:" + method)); }, 15000);
    pending.set(id, {resolve: value => { clearTimeout(timer); resolveResult(value); },
      reject: error => { clearTimeout(timer); rejectResult(error); }});
    native.stdin.write(JSON.stringify({id, method, params}) + "\n");
  });
  try {
    await request("initialize", {clientInfo: {name: "are_hosted_hook_canary", version: "1"}, capabilities: {experimentalApi: true}});
    native.stdin.write(JSON.stringify({method: "initialized"}) + "\n");
    const listed = await request("hooks/list", {cwds: [checkoutRoot]});
    const hooks = listed.data?.flatMap(row => row.hooks ?? []) ?? [];
    assert.equal(hooks.length, 3, "native.exact-hook-count");
    for (const hook of hooks) {
      assert.equal(hook.sourcePath, join(configRoot, "hooks.json"), "native.hook-source");
      assert.match(hook.currentHash, /^sha256:[0-9a-f]{64}$/, "native.hook-hash");
      appendFileSync(join(configRoot, "config.toml"), "\n[hooks.state." + JSON.stringify(hook.key) + "]\ntrusted_hash = "
        + JSON.stringify(hook.currentHash) + "\n");
    }
    const trusted = await request("hooks/list", {cwds: [checkoutRoot]});
    const verified = trusted.data?.flatMap(row => row.hooks ?? []) ?? [];
    assert.equal(verified.length, 3);
    assert.ok(verified.every((hook, index) => hook.key === hooks[index].key
      && hook.currentHash === hooks[index].currentHash && hook.trustStatus === "trusted"), "native.exact-hook-trust");
    hookInventory = verified.map(hook => ({key: hook.key, command: hook.command,
      enabled: hook.enabled ?? null, async: hook.async ?? null, trust_status: hook.trustStatus}));
  } finally { await stop(native); native = null; }
}

async function api(method, path, body) {
  const response = await fetch(new URL(path, ready.url), {method,
    headers: {authorization: "Bearer " + token, ...(body ? {"content-type": "application/json"} : {})},
    ...(body ? {body: JSON.stringify(body)} : {})});
  const value = await response.json();
  if (!value.ok) throw new Error(method + " " + path + ": " + response.status + " " + JSON.stringify(value));
  return value.value ?? value;
}

async function waitForCompletion() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const [runtime, history] = await Promise.all([
        api("GET", "api/threads/" + encodeURIComponent(threadId) + "/runtime"),
        api("GET", "api/threads/" + encodeURIComponent(threadId) + "/history")]);
      if (runtime.disposition === "idle" && history.messages?.some(message => message.turn_id === turnId && message.role === "agent")) return;
    } catch (error) {
      if (!/rollout at .* is empty|windows-client\.history-unavailable|Host history snapshot is behind a durable terminal observation/.test(error.message)) throw error;
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 500));
  }
  throw new Error("native.hosted-turn-timeout");
}

async function waitForNativeCompletion() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), process.platform === "win32" ? 60000 : 30000);
  const observed = {tool_blocked: false, turn_status: null, hook_events: [], effect_decisions: []};
  try {
    const response = await fetch(new URL("api/events?after=0", ready.url), {
      headers: {authorization: "Bearer " + token}, signal: abort.signal});
    assert.equal(response.status, 200, "native.hosted-event-stream-unavailable");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const {value, done} = await reader.read();
      if (done) throw new Error("native.hosted-event-stream-closed");
      buffer += decoder.decode(value, {stream: true});
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const data = frame.split("\n").find(line => line.startsWith("data: "))?.slice(6);
        if (!data) continue;
        const event = JSON.parse(data);
        if (event.kind !== "app-server-notification") continue;
        const message = event.payload;
        if (message?.method === "cyberalchemy/decision"
          && message.params?.schema_version === "are.codex-effect-directive/v1"
          && message.params.thread_id === threadId && message.params.turn_id === turnId) {
          observed.effect_decisions.push({directive_kind: message.params.directive_kind,
            method: message.params.method, item_id: message.params.item_id,
            effect_digest: message.params.effect_digest,
            decision_digest: message.params.decision_digest});
        }
        if (message?.params?.threadId !== threadId) continue;
        if ((message.method === "hook/started" || message.method === "hook/completed")
          && message.params?.turnId === turnId) {
          const run = message.params?.run ?? {};
          observed.hook_events.push({method: message.method, event_name: run.eventName ?? null,
            status: run.status ?? null, status_message: run.statusMessage ?? null,
            execution_mode: run.executionMode ?? null, duration_ms: run.durationMs ?? null,
            entry_summaries: Array.isArray(run.entries) ? run.entries.map(entry => ({
              keys: Object.keys(entry).sort(), status: entry.status ?? null,
              error: typeof entry.error === "string" ? entry.error.slice(0, 250) : null,
              exit_code: entry.exitCode ?? null,
              stdout_bytes: typeof entry.stdout === "string" ? Buffer.byteLength(entry.stdout) : null,
              stderr: typeof entry.stderr === "string" ? entry.stderr.slice(0, 250) : null})) : null});
        }
        if (message.method === "hook/completed" && message.params?.turnId === turnId
          && message.params?.run?.eventName === "preToolUse" && message.params.run.status === "blocked") {
          observed.tool_blocked = true;
        }
        if (message.method === "turn/completed" && message.params?.turn?.id === turnId) {
          observed.turn_status = message.params.turn.status;
          return observed;
        }
      }
    }
  } finally { clearTimeout(timer); abort.abort(); }
}

async function declineWindowsFixtureApproval(isCompleted) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const state = await api("GET", "api/state");
    const pending = state.pending_approvals ?? [];
    if (pending.length > 0) {
      assert.equal(pending.length, 1, "native.windows-fixture-approval-count");
      assert.equal(pending[0].method, "item/commandExecution/requestApproval",
        "native.windows-fixture-approval-method");
      const result = await api("POST", "api/approvals/" + encodeURIComponent(pending[0].request_id),
        {decision: "decline"});
      assert.equal(result.decision, "decline");
      return true;
    }
    if (isCompleted()) return false;
    await new Promise(done => setTimeout(done, 150));
  }
  throw new Error("native.windows-fixture-approval-timeout");
}

function inspectManagedUi() {
  const nativeOrbMode = ready.companion_mode === "native-orb";
  let nativeOrbPid = null;
  if (nativeOrbMode && process.platform === "win32") {
    const path = resolve(dirname(process.env.ARE_MANAGED_CANARY_COMPANION), "native-orb/are-native-orb.exe");
    const matches = managedWindowsChildren(managed.pid).filter(row =>
      row.ExecutablePath?.toLowerCase() === path.toLowerCase());
    assert.equal(matches.length, 1, "native.managed-native-orb-child-not-unique");
    nativeOrbPid = matches[0].ProcessId;
  }
  if (nativeOrbMode && process.platform === "linux") {
    const activation = spawnSync(resolve(process.env.ARE_MANAGED_CANARY_COMPANION), [], {
      env: {...process.env, HOME: scratch, XDG_RUNTIME_DIR: join(scratch, "runtime"), GDK_BACKEND: "x11"},
      encoding: "utf8", timeout: 15000, maxBuffer: 4096,
    });
    assert.equal(activation.status, 0,
      `native.managed-linux-orb-activation:${(activation.stderr ?? "").slice(-300)}`);
  }
  const inspector = spawnSync(process.execPath,
    process.platform === "win32"
      ? [resolve(sourcePackageRoot, "../../apps/desktop-companion/scripts/inspect-managed-windows-ui.mjs"),
        String(managedUiInspectorPort), "--verify-managed-turn",
        ...(nativeOrbMode ? ["--native-orb-pid", String(nativeOrbPid)] : [])]
      : [resolve(sourcePackageRoot, "../../apps/desktop-companion/scripts/inspect-linux-ui.mjs"), "--verify-managed-turn"],
    {encoding: "utf8", timeout: 45000, maxBuffer: 1024 * 1024,
      env: {...process.env, ARE_COMPANION_PREFERENCES_PATH: join(scratch, "companion.json"),
        ARE_LINUX_UI_NATIVE_ORB: nativeOrbMode && process.platform === "linux" ? "1" : "0",
        ARE_LINUX_UI_INSPECTOR_SERVER: process.env.ARE_LINUX_UI_INSPECTOR_SERVER ?? "127.0.0.1:19723"}});
  assert.equal(inspector.status, 0, `native.managed-ui-inspector:${(inspector.stderr ?? "").slice(-700)}`);
  const managedUi = JSON.parse(inspector.stdout.trim());
  assert.equal(managedUi.managed_turn?.count, "1", "native.managed-ui-thread-count");
  assert.equal(managedUi.managed_turn?.same_gateway_epoch, true, "native.managed-ui-epoch");
  assert.equal(managedUi.managed_turn?.completion_frontier, true, "native.managed-ui-frontier");
  assert.equal(managedUi.managed_turn?.linked_decision, true, "native.managed-ui-linked-decision");
  return managedUi;
}

try {
  assert.ok(process.argv[2] && existsSync(binary) && (process.argv.length === 3
    || (process.argv.length === 4 && (pollStress || goalToolProbe || callbackOutageProbe || mcpHookProbe || managedSessionProbe))
    || (process.argv.length === 5 && windowsDirectHookProbe && process.argv[4] === "--skip-ancestry")),
  "usage: hosted-hook-denial-canary.mjs /absolute/path/to/codex [--poll-stress|--probe-goal-tool|--probe-callback-outage|--mcp-hook|--mcp-hook-missing-tool|--managed-session|--managed-session-ui|--managed-session-ui-observe|--managed-session-ui-mcp|--managed-session-direct-hook [--skip-ancestry]]");
  assert.ok(!windowsDirectHookProbe || process.platform === "win32", "native.windows-direct-hook-probe-only");
  if (process.env.ARE_MANAGED_CANARY_PACKAGE_ROOT) {
    assert.equal((managedUiMcpProbe && process.platform === "win32")
      || (managedUiObserveProbe && process.platform === "linux"), true,
      "native.package-runtime-only-for-bounded-managed-ui-probes");
    const companionRoot = dirname(resolve(process.env.ARE_MANAGED_CANARY_COMPANION));
    assert.equal(packageRoot, resolve(companionRoot,
      process.platform === "win32"
        ? "are/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper"
        : "../are/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper"),
    "native.package-runtime-not-adjacent-to-companion");
    assert.equal(process.execPath.toLowerCase(), resolve(companionRoot,
      process.platform === "win32" ? "node/node.exe" : "../node/bin/node").toLowerCase(),
      "native.package-node-not-adjacent-to-companion");
    assert.ok(existsSync(resolve(packageRoot, "bin/are-managed-session.mjs")),
      "native.package-manager-missing");
  }
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "native.exact-version");
  mkdirSync(configRoot, {mode: 0o700});
  if (managedUiProbe) {
    assert.ok(["linux", "win32"].includes(process.platform) && process.env.ARE_MANAGED_CANARY_COMPANION
      && existsSync(process.env.ARE_MANAGED_CANARY_COMPANION), "native.managed-ui-companion-required");
    if (process.platform === "linux") mkdirSync(join(scratch, "runtime"), {mode: 0o700});
    else managedUiInspectorPort = await freeLoopbackPort();
  }
  const callback = join(scratch, "capture-callback.mjs");
  writeFileSync(callback, "import {appendFileSync,fstatSync,unlinkSync} from 'node:fs';\n"
    + "import {spawnSync} from 'node:child_process';\n"
    + "const progress=" + JSON.stringify(join(scratch, "callback-progress.jsonl")) + ";const mark=value=>appendFileSync(progress,JSON.stringify(value)+'\\n');\n"
    + "appendFileSync(" + JSON.stringify(join(scratch, "callback-entry.log")) + ",'started\\n');\n"
    + "if(process.platform==='win32'){let kind='unknown',error=null;try{const stat=fstatSync(0);kind=stat.isFIFO()?'pipe':stat.isFile()?'file':stat.isCharacterDevice()?'character':'other'}catch(cause){error=cause.code??'unknown'}mark({phase:'stdin-handle',kind,error,is_tty:process.stdin.isTTY===true})}\n"
    + (windowsAncestryProbe ? "if(process.platform==='win32'){const script=" + JSON.stringify(windowsAncestryScript)
    + ".replace('__PPID__',String(process.ppid));const probe=spawnSync('powershell.exe',"
    + "['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],"
    + "{encoding:'utf8',timeout:3000,windowsHide:true});let rows=[];try{rows=JSON.parse(probe.stdout??'[]')}catch{}"
    + ";mark({phase:'ancestry',probe_exit:probe.status??null,probe_error:probe.error?.code??null,"
    + "process_names:Array.isArray(rows)?rows.map(row=>row.name??null):[]})}\n" : "")
    + "let raw='';let event=null;let bytes=0;const chunks=[];const timer=setTimeout(()=>process.stdin.destroy(new Error('hook-input-timeout')),10000);\n"
    + "try{for await(const chunk of process.stdin){bytes+=chunk.length;mark({phase:'chunk',bytes:chunk.length,total:bytes});if(bytes>2097152)throw new Error('hook-input-too-large');chunks.push(chunk);raw=Buffer.concat(chunks).toString('utf8');try{event=JSON.parse(raw);mark({phase:'parsed',name:event.hook_event_name??null});break}catch(error){if(!(error instanceof SyntaxError))throw error}}}finally{clearTimeout(timer)};if(!event)throw new Error('hook-input-incomplete');\n"
    + "const run=spawnSync(process.execPath,[" + JSON.stringify(resolve(productRoot, "bin/are-hook-callback.mjs")) + ","
    + JSON.stringify(hookPath) + ",'--fail-closed-tools'],{input:raw,encoding:'utf8',timeout:10000,maxBuffer:2097152});\n"
    + "mark({phase:'runner-returned',status:run.status??null});\n"
    + "appendFileSync(" + JSON.stringify(join(scratch, "callbacks.jsonl")) + ",JSON.stringify({event,status:run.status,output:run.stdout,error:run.stderr})+'\\n');\n"
    + (callbackOutageProbe ? "if(event.hook_event_name==='UserPromptSubmit'&&run.status===0)unlinkSync(" + JSON.stringify(hookPath) + ");\n" : "")
    + "process.stdout.write(run.stdout??'');process.stderr.write(run.stderr??'');process.exitCode=run.status??1;\n", {mode: 0o600});
  const command = quote(process.execPath) + " " + quote(callback);
  const windowsCommand = `${process.execPath} ${callback}`;
  if (process.platform === "win32" && (/\s/.test(process.execPath) || /\s/.test(callback))) {
    throw new Error("native.windows-hook-fixture-path-contains-space");
  }
  const windowsBatch = join(scratch, "capture-callback.cmd");
  if (process.platform === "win32") writeFileSync(windowsBatch,
    `@echo off\r\n${windowsCommand}\r\nexit /b %errorlevel%\r\n`, {mode: 0o600});
  const windowsPowerShell = join(scratch, "capture-callback.ps1");
  if (process.platform === "win32") writeFileSync(windowsPowerShell,
    `$ErrorActionPreference = 'Stop'\r\n`
    + `$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)\r\n`
    + `$reader = [IO.StreamReader]::new([Console]::OpenStandardInput(), [Text.Encoding]::UTF8)\r\n`
    + `$raw = $reader.ReadToEnd()\r\n`
    + `$raw | & ${windowsCommand}\r\n`
    + `exit $LASTEXITCODE\r\n`, {mode: 0o600});
  if (process.platform === "win32" && !mcpHookProbe && !managedUiObserveProbe) {
    const controlInput = JSON.stringify({hook_event_name: "UserPromptSubmit",
      session_id: "shell-control", turn_id: "shell-control"});
    const controlProgressPath = join(scratch, "callback-progress.jsonl");
    const clearControl = () => {
      for (const file of ["callback-entry.log", "callback-progress.jsonl", "callbacks.jsonl"]) {
        rmSync(join(scratch, file), {force: true});
      }
    };
    const runControl = (program, args, options = {}) => {
      const control = spawnSync(program, args, {input: controlInput, cwd: checkoutRoot,
        encoding: "utf8", timeout: 5000, ...options});
      const progress = existsSync(controlProgressPath)
        ? readFileSync(controlProgressPath, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
      const result = {exit_code: control.status, error: control.error?.code ?? null,
        chunk_seen: progress.some(row => row.phase === "chunk"),
        parsed: progress.some(row => row.phase === "parsed")};
      clearControl();
      return result;
    };
    windowsShellInputControl = {
      cmd: runControl("cmd.exe", ["/C", `"cmd.exe /c ${windowsBatch}"`],
        {windowsVerbatimArguments: true}),
      powershell: runControl("powershell.exe", ["-NoProfile", "-Command", `cmd.exe /c ${windowsBatch}`]),
      powershell_forwarded: runControl("powershell.exe", ["-NoProfile", "-Command",
        `$input | & ${windowsCommand}`]),
      powershell_raw_stream: runControl("powershell.exe", ["-NoProfile", "-Command",
        `& ${windowsPowerShell}`]),
    };
  }
  const hooks = mcpHookProbe ? hostedMcpHookProfile().hooks
    : Object.fromEntries(["UserPromptSubmit", "PreToolUse", "Stop"].map(name => [name,
    [{hooks: [{type: "command", command,
      ...(process.platform === "win32" ? {commandWindows: windowsDirectHookProbe
        ? windowsCommand : `cmd.exe /c ${windowsBatch}`} : {}), timeout: 15}]}]]));
  writeFileSync(join(configRoot, "hooks.json"), JSON.stringify({hooks}), {mode: 0o600});
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let bytes = 0;
      for await (const chunk of request) { bytes += chunk.length; assert.ok(bytes <= 2 * 1024 * 1024); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      assert.ok(providerRequests.length <= 2, "native.unexpected-provider-retry");
      let output;
      if (providerRequests.length === 1 && managedUiObserveProbe) {
        output = {type: "message", text: "ARE_MANAGED_UI_READ_ONLY_OK"};
      } else if (providerRequests.length === 1) {
        const tool = body.tools?.find(item => item.type === "function" && (goalToolProbe
          ? item.name === "create_goal" : ["exec_command", "shell_command", "shell"].includes(item.name)));
        assert.ok(tool, goalToolProbe ? "native.goal-tool-unavailable" : "native.shell-tool-unavailable");
        const commandText = process.platform === "win32" ? "echo ARE_HOSTED_TOOL_OK" : "printf '%s' ARE_HOSTED_TOOL_ OK";
        const args = goalToolProbe ? {objective: "Disposable ARE hook boundary probe; no user task."}
          : tool.name === "exec_command" ? {cmd: commandText, max_output_tokens: 64, yield_time_ms: 1000}
            : tool.name === "shell_command" ? {command: commandText}
              : {command: process.platform === "win32" ? ["cmd.exe", "/d", "/c", commandText] : ["/bin/sh", "-c", commandText]};
        output = {type: "function_call", name: tool.name, arguments: args};
      } else {
        const toolOutput = body.input?.find(item => item.type === "function_call_output" && item.call_id === "are_hosted_tool_1");
        assert.ok(toolOutput, "native.tool-result-missing");
        toolResult = JSON.stringify(toolOutput.output);
        if (!goalToolProbe && mcpHookProbe) {
          assert.match(toolResult, /Command blocked by PreToolUse hook:/,
            "native.mcp-hook-denial-not-enforced");
          assert.ok(!toolResult.includes("Output:\\nARE_HOSTED_TOOL_OK")
            && !toolResult.includes("Output:\\r\\nARE_HOSTED_TOOL_OK"), "native.denied-tool-executed");
        } else if (!goalToolProbe) assert.ok(!toolResult.includes("ARE_HOSTED_TOOL_OK"), "native.denied-tool-executed");
        output = {type: "message", text: "ARE_HOSTED_DENIAL_OK"};
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(events("resp_hosted_" + providerRequests.length, output));
    } catch (error) {
      providerFailure = error.message;
      response.writeHead(500); response.end("private fixture rejected request");
    }
  });
  await new Promise(resolveListen => provider.listen(0, "127.0.0.1", resolveListen));
  const endpoint = "http://127.0.0.1:" + provider.address().port + "/v1";
  writeFileSync(join(configRoot, "config.toml"), "model_provider = \"are_fixture\"\nmodel = \"are-fixture\"\n"
    + "[model_providers.are_fixture]\nname = \"ARE private hosted hook fixture\"\nbase_url = " + JSON.stringify(endpoint)
    + "\nwire_api = \"responses\"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n"
    + "[features]\ncodex_hooks = true\nremote_plugin = false\nplugins = false\n[projects." + JSON.stringify(checkoutRoot) + "]\ntrust_level = \"trusted\"\n"
    + (mcpHookProbe ? "[mcp_servers.are_hosted_hook_relay]\ncommand = " + JSON.stringify(process.execPath)
      + "\nargs = " + JSON.stringify(mcpToolMissingProbe
        ? [resolve(packageRoot, "scripts/fixtures/mcp-hook-transport-server.mjs"), "missing-tool",
          join(scratch, "unused-mcp-tool.jsonl")]
        : [resolve(productRoot, "packages/are-mcp-server/bin/are-hook-mcp-server.mjs"),
          "--connection-file", hookPath])
      + "\nrequired = true\nstartup_timeout_sec = 10\ntool_timeout_sec = 30\ndefault_tools_approval_mode = \"auto\"\n" : ""), {mode: 0o600});
  await discoverAndTrustHooks();
  let gatewayReady;
  if (managedSessionProbe) {
    const managedArgs = [process.platform === "win32"
      ? resolve(packageRoot, "bin/are-managed-session.mjs") : resolve(productRoot, "bin/are.mjs"),
      ...(process.platform === "win32" ? [] : ["managed-session"]),
      "--config", resolve(packageRoot, "profiles/interaction-learning-canary-v1.json"),
      "--repository-root", repositoryRoot, "--codex-command", binary,
      "--state-dir", scratch, "--cwd", checkoutRoot, "--hook-bridge",
      ...(mcpHookProbe ? ["--require-mcp-hook-relay"] : []),
      ...(process.platform === "win32" ? ["--probe-unverified-windows-hooks"] : [])];
    if (managedUiProbe) managedArgs.push("--companion-command", process.env.ARE_MANAGED_CANARY_COMPANION);
    const managedRun = childProcess(process.execPath, managedArgs,
    {...process.env, HOME: managedUiProbe ? scratch : process.env.HOME, CODEX_HOME: configRoot,
      ARE_INTEGRATION_TEST_MODE: "1",
      ...(managedUiProbe ? {ARE_COMPANION_NODE: process.execPath,
        ARE_COMPANION_ENTRY: resolve(productRoot, "bin/are.mjs"),
        ARE_COMPANION_PREFERENCES_PATH: join(scratch, "companion.json"),
        ...(process.platform === "win32"
          ? {WEBVIEW2_USER_DATA_FOLDER: join(scratch, "webview2"),
            WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${managedUiInspectorPort}`}
          : {XDG_RUNTIME_DIR: join(scratch, "runtime"), GDK_BACKEND: "x11",
            WEBKIT_DISABLE_COMPOSITING_MODE: "1",
            WEBKIT_INSPECTOR_HTTP_SERVER: process.env.ARE_LINUX_UI_INSPECTOR_SERVER ?? "127.0.0.1:19723"})} : {})});
    managed = managedRun.child; gatewayDiagnostics = managedRun.diagnostics;
    ready = await waitReadyFromStdout(managed, "are.managed-session-ready/v1", gatewayDiagnostics);
    token = new URL(ready.launch_url).hash.slice("#token=".length);
    assert.match(token, /^[A-Za-z0-9_-]{32,128}$/);
    ready.url = ready.launch_url.split("#")[0];
    gatewayReady = {observed_backend_version: ready.observed_backend_version};
  } else {
    const gatewayRun = childProcess(process.execPath, [resolve(packageRoot, "bin/are-codex-gateway.mjs"),
      "--development-live", "--config", resolve(packageRoot, "profiles/interaction-learning-canary-v1.json"),
      "--repository-root", repositoryRoot, "--listen", socketPath, "--backend", "direct-stdio",
      "--codex-command", binary, "--session-store", join(scratch, "sessions.jsonl"),
      "--reasoning-state-dir", join(scratch, "reasoning-state")], {...process.env, CODEX_HOME: configRoot});
    gateway = gatewayRun.child; gatewayDiagnostics = gatewayRun.diagnostics;
    gatewayReady = await waitReady(gateway, "are.gateway-ready/v1", gatewayDiagnostics);
    const clientRun = childProcess(process.execPath, [resolve(packageRoot, "bin/are-codex-windows-client.mjs"),
      "--socket", socketPath, "--repository-root", repositoryRoot, "--cwd", checkoutRoot,
      "--state-file", join(scratch, "client-state.json"), "--hook-connection-file", hookPath,
      "--port", "0", "--token", token,
      ...(process.platform === "win32" ? ["--probe-unverified-windows-hooks"] : [])],
      {...process.env, ARE_INTEGRATION_TEST_MODE: "1"});
    client = clientRun.child; clientDiagnostics = clientRun.diagnostics;
    ready = await waitReady(client, "are.codex-windows-client-ready/v1", clientDiagnostics);
  }
  const started = await api("POST", "api/threads", {cwd: checkoutRoot, requestKey: "thread:" + randomUUID()});
  threadId = started.thread.id;
  if (mcpToolMissingProbe) {
    const response = await fetch(new URL("api/turns", ready.url), {method: "POST",
      headers: {authorization: "Bearer " + token, "content-type": "application/json"},
      body: JSON.stringify({threadId, requestKey: "turn:" + randomUUID(), text: "This turn must not start."})});
    const result = await response.json();
    assert.equal(response.status, 409, "native.missing-mcp-tool-turn-not-rejected");
    assert.equal(result.reason, "windows-client.mcp-hook-relay-unavailable", "native.missing-mcp-tool-reason");
    assert.equal(providerRequests.length, 0, "native.missing-mcp-tool-model-request");
    assert.equal(providerFailure, null, "native.missing-mcp-tool-provider-failure");
    await stopManaged(); managed = null;
    assert.equal(existsSync(hookPath), false, "native.callback-file-not-removed");
    process.stdout.write(JSON.stringify({schema_version: "are.hosted-mcp-catalog-gate-canary/v1", ok: true,
      host_version: version.stdout.trim(), host_sha256: sha256(readFileSync(binary)),
      hosted_thread_bound: true, required_server_connected: true, required_tool_present: false,
      turn_start_rejected: true, reason: result.reason, private_provider_requests: 0,
      external_model_calls: 0, active_configuration_changed: false,
      current_task_handover: false, authority_effect: "none"}) + "\n");
  } else {
  const turn = await api("POST", "api/turns", {threadId, requestKey: "turn:" + randomUUID(),
    text: managedUiObserveProbe
      ? "Explain the repository routing architecture briefly. Do not call tools or change files."
      : "Explain the repository routing architecture briefly. The local fixture may ask for one harmless shell command."});
  turnId = turn.turn.id;
  let nativeTurnCompleted = false;
  const completionPromise = waitForNativeCompletion().then(value => {
    nativeTurnCompleted = true;
    return value;
  });
  const windowsApproval = process.platform === "win32" && managedSessionProbe && !managedUiObserveProbe
    ? declineWindowsFixtureApproval(() => nativeTurnCompleted) : null;
  const [completion, windowsApprovalDeclined] = windowsApproval
    ? await Promise.all([completionPromise, windowsApproval])
    : [pollStress ? (await Promise.all([completionPromise, waitForCompletion()]))[0]
      : await completionPromise, false];
  nativeCompletion = completion;
  assert.equal(completion.turn_status, "completed", "native.turn-not-completed");
  if (managedUiObserveProbe) {
    assert.equal(providerFailure, null, "native.provider-failure:" + providerFailure);
    assert.equal(providerRequests.length, 1, "native.readonly-provider-request-count");
    assert.equal(toolResult, null, "native.readonly-tool-result-unexpected");
    const managedUi = inspectManagedUi();
    await stopManaged(); managed = null;
    assert.equal(existsSync(hookPath), false, "native.callback-file-not-removed");
    process.stdout.write(JSON.stringify({schema_version: "are.managed-session-ui-observation-canary/v1", ok: true,
      host_version: version.stdout.trim(), host_sha256: sha256(readFileSync(binary)),
      observed_backend_version: gatewayReady.observed_backend_version,
      hosted_thread_bound: true, native_completion_observed: true,
      managed_ui: managedUi, read_only_turn: true, tool_attempted: false,
      hook_boundary_verified: false, complete_host_effect_boundary_verified: false,
      private_provider_requests: providerRequests.length, external_model_calls: 0,
      active_configuration_changed: false, current_task_handover: false, authority_effect: "none"}) + "\n");
  } else {
  assert.ok(completion.tool_blocked || windowsApprovalDeclined,
    "native.tool-was-neither-hook-blocked-nor-host-approval-declined");
  if (windowsApprovalDeclined) {
    assert.equal(completion.effect_decisions.length, 1, "native.effect-decision-not-observed");
    assert.equal(completion.effect_decisions[0].directive_kind, "gate", "native.effect-decision-not-gated");
    assert.equal(completion.effect_decisions[0].method, "item/commandExecution/requestApproval",
      "native.effect-decision-method-mismatch");
  }
  assert.equal(providerFailure, null, "native.provider-failure:" + providerFailure);
  assert.equal(providerRequests.length, 2, "native.provider-request-count");
  const callbacks = existsSync(join(scratch, "callbacks.jsonl"))
    ? readFileSync(join(scratch, "callbacks.jsonl"), "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line))
    : [];
  const scoped = callbacks.filter(row => row.event.session_id === threadId && row.event.turn_id === turnId);
  const callbackEntryPath = join(scratch, "callback-entry.log");
  const callbackEntryCount = existsSync(callbackEntryPath)
    ? readFileSync(callbackEntryPath, "utf8").split("\n").filter(Boolean).length : 0;
  const progressPath = join(scratch, "callback-progress.jsonl");
  const callbackProgress = existsSync(progressPath)
    ? readFileSync(progressPath, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
  const prompts = scoped.filter(row => row.event.hook_event_name === "UserPromptSubmit");
  const tools = scoped.filter(row => row.event.hook_event_name === "PreToolUse");
  const stops = scoped.filter(row => row.event.hook_event_name === "Stop");
  const mcpCompletedHooks = completion.hook_events.filter(row => row.method === "hook/completed");
  const mcpHookCompleted = name => mcpCompletedHooks.some(row => row.event_name?.toLowerCase() === name.toLowerCase()
    && ["completed", "blocked"].includes(row.status));
  const mcpLifecycleBound = mcpHookCompleted("userPromptSubmit")
    && mcpHookCompleted("preToolUse") && mcpHookCompleted("stop");
  const mcpPromptOnWire = JSON.stringify(providerRequests[0]?.input ?? []).includes("ARE advisory routing evidence");
  if (mcpHookProbe) {
    assert.equal(prompts.length + tools.length + stops.length, 0, "native.mcp-command-callback-unexpected");
    assert.equal(mcpLifecycleBound, true, "native.mcp-lifecycle-incomplete");
    assert.equal(mcpPromptOnWire, true, "native.mcp-prompt-context-not-on-wire");
    assert.equal(completion.tool_blocked, true, "native.mcp-tool-not-blocked");
    assert.ok(!toolResult?.includes("ARE tool assessment unavailable on this hook transport"),
      "native.mcp-controller-assessment-unavailable");
    assert.match(toolResult ?? "", /ARE (?:requires a separate decision for|blocked) this bound tool proposal/,
      "native.mcp-bound-ARE-effect-decision-missing");
  } else if (!windowsApprovalDeclined) {
    assert.equal(prompts.length, 1, "native.prompt-binding");
    assert.equal(tools.length, 1, "native.tool-binding");
    assert.equal(stops.length, 1, "native.stop-binding");
  }
  if (!mcpHookProbe && tools.length === 1) {
    assert.equal(tools[0].status, callbackOutageProbe ? 2 : 0, tools[0].error);
    if (callbackOutageProbe) {
      assert.equal(tools[0].output, "", "native.outage-unexpected-hook-output");
      assert.match(tools[0].error, /ARE tool assessment unavailable; this supported tool call is blocked\./,
        "native.outage-block-reason-missing");
    } else assert.equal(JSON.parse(tools[0].output).hookSpecificOutput.permissionDecision, "deny");
  }
  const toolDecisionKind = tools.length === 1 && !callbackOutageProbe
    ? JSON.parse(JSON.parse(tools[0].output).hookSpecificOutput.additionalContext.split("\n").at(-1)).kind : null;
  if (!mcpHookProbe && !windowsApprovalDeclined) {
    const context = JSON.parse(prompts[0].output).hookSpecificOutput.additionalContext;
    assert.ok(JSON.stringify(providerRequests[0].input).includes(JSON.stringify(context).slice(1, -1)), "native.context-not-on-wire");
  }
  assert.equal(existsSync(hookPath), !callbackOutageProbe, "native.callback-file-posture-before-shutdown");
  let managedUi = null;
  if (managedUiProbe) managedUi = inspectManagedUi();
  if (managedSessionProbe) { await stopManaged(); managed = null; }
  else { await stop(client); client = null; }
  assert.equal(existsSync(hookPath), false, "native.callback-file-not-removed");
  process.stdout.write(JSON.stringify({schema_version: "are.hosted-hook-denial-installed-canary/v1", ok: true,
    host_version: version.stdout.trim(), host_sha256: sha256(readFileSync(binary)),
    observed_backend_version: gatewayReady.observed_backend_version, hosted_client_executable: true,
    hosted_thread_bound: true, exact_hook_hashes_trusted: 3,
    native_hook_inventory: hookInventory,
    prompt_context_on_model_wire: mcpHookProbe ? mcpPromptOnWire : !windowsApprovalDeclined,
    managed_session_probe: managedSessionProbe,
    runtime_origin: process.env.ARE_MANAGED_CANARY_PACKAGE_ROOT
      ? "adjacent-extracted-package" : "source-checkout",
    mcp_hook_probe: mcpHookProbe,
    windows_direct_hook_probe: windowsDirectHookProbe,
    windows_ancestry_probe: windowsAncestryProbe,
    managed_ui_probe: managedUiProbe, managed_ui_completed_thread: managedUi?.managed_turn?.completion_frontier ?? null,
    managed_ui_linked_decision: managedUi?.managed_turn?.linked_decision ?? null,
    pre_tool_use_denied: completion.tool_blocked, host_approval_declined: windowsApprovalDeclined,
    stop_bound: mcpHookProbe ? mcpHookCompleted("stop") : stops.length === 1,
    private_callback_removed: true,
    hook_boundary_verified: mcpHookProbe ? mcpLifecycleBound && completion.tool_blocked
      : !windowsApprovalDeclined && completion.tool_blocked
        && prompts.length === 1 && tools.length === 1 && stops.length === 1,
    complete_host_effect_boundary_verified: false,
    native_completion_observed: true, native_hook_block_observed: completion.tool_blocked,
    native_hook_events: completion.hook_events, callback_entry_count: callbackEntryCount,
    gateway_effect_decisions: completion.effect_decisions,
    callback_progress: callbackProgress,
    callback_process_ancestry: callbackProgress.filter(row => row.phase === "ancestry")
      .map(row => ({probe_exit: row.probe_exit, probe_error: row.probe_error,
        process_names: row.process_names})),
    callback_stdin_handles: callbackProgress.filter(row => row.phase === "stdin-handle"),
    windows_shell_input_control: windowsShellInputControl,
    poll_stress_mode: pollStress,
    callback_outage_probe: callbackOutageProbe,
    callback_outage_exit_two_observed: callbackOutageProbe ? tools[0]?.status === 2 : null,
    goal_tool_probe: goalToolProbe,
    goal_tool_hook_observed: goalToolProbe ? tools.length === 1 : null,
    goal_tool_are_kind: goalToolProbe ? toolDecisionKind : null,
    goal_tool_result_digest: goalToolProbe ? sha256(toolResult ?? "") : null,
    advertised_function_tools: providerRequests[0].tools?.filter(tool => tool.type === "function")
      .map(tool => tool.name).filter(name => typeof name === "string").sort() ?? [],
    private_provider_requests: providerRequests.length, external_model_calls: 0,
    active_configuration_changed: false, current_task_handover: false, authority_effect: "none"}) + "\n");
  }
  }
} catch (error) {
  const sessionPath = join(scratch, "sessions.jsonl");
  const sessionLines = existsSync(sessionPath) ? readFileSync(sessionPath, "utf8").trim().split("\n").filter(Boolean) : [];
  const lastEvents = sessionLines.slice(-8).map(line => JSON.parse(line));
  const historyStatuses = sessionLines.map(line => JSON.parse(line)).filter(event => event.event_kind === "host-observation")
    .map(event => ({kind: event.content?.observation?.kind, status: event.content?.observation?.turn_status})).slice(-8);
  const serverRequestMethods = sessionLines.map(line => JSON.parse(line))
    .filter(event => event.event_kind === "server-request-observed")
    .map(event => event.content?.method ?? null).slice(-8);
  const callbackLog = join(scratch, "callbacks.jsonl");
  const callbackRows = existsSync(callbackLog) ? readFileSync(callbackLog, "utf8").trim().split("\n").filter(Boolean)
    .map(line => JSON.parse(line)) : [];
  const progressPath = join(scratch, "callback-progress.jsonl");
  const callbackProgress = existsSync(progressPath) ? readFileSync(progressPath, "utf8").trim()
    .split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
  const entryPath = join(scratch, "callback-entry.log");
  const callbackEntryCount = existsSync(entryPath)
    ? readFileSync(entryPath, "utf8").split("\n").filter(Boolean).length : 0;
  process.stderr.write(JSON.stringify({schema_version: "are.hosted-hook-denial-installed-canary-failure/v1", ok: false,
    reason: error.message, provider_failure: providerFailure, provider_requests: providerRequests.length,
    windows_direct_hook_probe: windowsDirectHookProbe,
    windows_ancestry_probe: windowsAncestryProbe,
    hosted_thread_created: Boolean(threadId), hosted_turn_started: Boolean(turnId),
    tool_execution_marker_seen: toolResult?.includes("ARE_HOSTED_TOOL_OK") ?? false,
    session_store_bytes: existsSync(sessionPath) ? statSync(sessionPath).size : 0,
    session_store_event_count: sessionLines.length,
    last_session_event_kinds: lastEvents.map(event => event.event_kind),
    session_fault_reason: lastEvents.find(event => event.event_kind === "session-fault")?.content?.fault?.reason_code ?? null,
    recent_history_statuses: historyStatuses,
    server_request_methods: serverRequestMethods,
    callback_events: callbackRows.map(row => ({name: row.event?.hook_event_name, status: row.status,
      output_kind: (() => { try { return JSON.parse(row.output)?.hookSpecificOutput?.hookEventName ?? null; } catch { return null; } })()})),
    callback_entry_count: callbackEntryCount,
    callback_process_ancestry: callbackProgress.filter(row => row.phase === "ancestry")
      .map(row => ({probe_exit: row.probe_exit, probe_error: row.probe_error,
        process_names: row.process_names})),
    callback_stdin_handles: callbackProgress.filter(row => row.phase === "stdin-handle"),
    callback_input_chunks: callbackProgress.filter(row => row.phase === "chunk").length,
    native_hook_events: nativeCompletion?.hook_events ?? [],
    windows_shell_input_control: windowsShellInputControl,
    gateway_diagnostics: diagnosticSummary(gatewayDiagnostics()),
    client_diagnostics: diagnosticSummary(clientDiagnostics()), authority_effect: "none"}) + "\n");
  process.exitCode = 1;
} finally {
  await stop(native); await stop(client); await stop(gateway);
  if (managed) {
    try { await stopManaged(); }
    catch {
      if (process.platform === "win32" && managed.exitCode === null) {
        spawnSync("taskkill", ["/PID", String(managed.pid), "/T", "/F"], {windowsHide: true, timeout: 10000});
      } else await stop(managed);
    }
  }
  if (provider) { provider.closeAllConnections(); await new Promise(resolveClose => provider.close(resolveClose)); }
  rmSync(scratch, {recursive: true, force: true, maxRetries: process.platform === "win32" ? 20 : 0, retryDelay: 200});
}
