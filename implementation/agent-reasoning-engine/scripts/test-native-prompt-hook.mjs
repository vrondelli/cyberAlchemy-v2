#!/usr/bin/env node
import assert from "node:assert/strict";
import {createHash, randomBytes} from "node:crypto";
import {createServer} from "node:http";
import {spawn, spawnSync} from "node:child_process";
import {mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, realpathSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createInterface} from "node:readline";
import {createHookEventSession} from "../src/hook-event-session.mjs";
import {createGatewaySessionClient} from "../src/gateway-session-client.mjs";
import {startHookCallbackBridge} from "../src/hook-callback-bridge.mjs";
import {createPersistentGateway} from "../packages/codex-app-server-wrapper/src/gateway.mjs";

const product = fileURLToPath(new URL("../", import.meta.url));
const checkout = resolve(product, "../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const binary = process.argv[2];
const gatewayMode = process.argv[3] === "--gateway";
const eventsMode = process.argv[3] === "--events" || gatewayMode;
const eventSession = createHookEventSession();
const nativeCompletions = [];
const callbackToken = randomBytes(32).toString("hex");
const report = {schema_version: "are.native-prompt-hook-canary/v1", status: "FAIL", authority_effect: "none",
  external_model_calls: 0, provider: "loopback-fixed-responses-fixture", active_configuration_changed: false,
  trust_scope: "inspected disposable config; explicit thread/start.config.bypass_hook_trust; no persisted trust",
  native_delivery_verified: false, turns: [], open_questions_ref: "../NATIVE-HOST-TEST.md#open-questions"};
if (gatewayMode) report.open_questions_ref = "../NATIVE-GATEWAY.md#open-questions";
report.mode = gatewayMode ? "native-gateway-events" : eventsMode ? "request-bound-events" : "prompt-only";
let scratch, child, server, gateway, gatewayClient, bridge;
const upstreamTerminals = [], upstreamRequests = [];
let releaseFirstTurn;
const firstTurnReady = new Promise(resolve => { releaseFirstTurn = resolve; });
const requests = [], notifications = [], pending = new Map();
let stderr = "", nextId = 0;
const rpc = (method, params, key) => gatewayMode ? gatewayClient.request(key ?? `canary-rpc-${++nextId}`, method, params) : new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`native.rpc-timeout:${method}`)); }, 15000);
  pending.set(id, {resolve: value => {clearTimeout(timer); resolve(value);}, reject: error => {clearTimeout(timer); reject(error);}});
  child.stdin.write(JSON.stringify({id, method, params}) + "\n");
});
const callbacks = () => {
  const path = resolve(scratch, "callbacks.jsonl");
  return existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function commands(value, output = []) {
  if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) {
    if (key === "command" && typeof item === "string") output.push(item);
    else commands(item, output);
  }
  return output;
}

try {
  assert.ok(binary && (process.argv.length === 3 || (process.argv.length === 4 && eventsMode)), "usage: node scripts/test-native-prompt-hook.mjs /absolute/path/to/codex [--events]");
  const executable = realpathSync(binary);
  const version = spawnSync(executable, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "codex-cli 0.153.0-alpha.5", "native.exact-version-required");
  report.host = {path: executable, version: version.stdout.trim(), sha256: sha(readFileSync(executable))};
  report.sources = Object.fromEntries(["src/prompt-hook.mjs", "src/hook-event-session.mjs", "src/decision-cli.mjs", "bin/are-hook.mjs", "scripts/test-native-prompt-hook.mjs", "src/gateway-session-client.mjs", "src/hook-callback-bridge.mjs", "packages/codex-app-server-wrapper/src/backend.mjs", "packages/codex-app-server-wrapper/src/gateway.mjs", "packages/codex-app-server-wrapper/src/gateway-client.mjs", "packages/codex-app-server-wrapper/src/rpc-client.mjs"].map(name => [name, sha(readFileSync(resolve(product, name)))]));
  scratch = mkdtempSync(resolve(tmpdir(), "are-native-prompt-canary-"));
  const configRoot = resolve(scratch, "codex-config"); mkdirSync(configRoot);
  const rendered = spawnSync(process.execPath, [resolve(product, "bin/are.mjs"), "hook", "config"], {encoding: "utf8", timeout: 5000});
  assert.equal(rendered.status, 0);
  const config = JSON.parse(rendered.stdout);
  const adapterCommand = config.hooks.UserPromptSubmit[0].hooks[0].command;
  const callbackPath = resolve(scratch, "callback.mjs");
  writeFileSync(callbackPath, `import {readFileSync,appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const raw=readFileSync(0,'utf8');const event=JSON.parse(raw);
let run;
if (${JSON.stringify(eventsMode)}) {
 const connection=JSON.parse(readFileSync(${JSON.stringify(resolve(scratch, "callback-endpoint.json"))},'utf8'));
 const response=await fetch(connection.url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+connection.token},body:raw,signal:AbortSignal.timeout(10000)});
 const result=await response.json();run={status:result.ok?0:1,stdout:JSON.stringify(result.stdout),stderr:result.ok?'':JSON.stringify(result.reason_codes)};
} else run=spawnSync('/bin/sh',['-c',${JSON.stringify(adapterCommand)}],{input:raw,encoding:'utf8',timeout:10000,maxBuffer:2097152});
appendFileSync(${JSON.stringify(resolve(scratch, "callbacks.jsonl"))},JSON.stringify({event,status:run.status,output:run.stdout,error:run.stderr})+'\\n');
process.stdout.write(run.stdout??'{}\\n');process.stderr.write(run.stderr??'');process.exitCode=run.status??1;
`);
  const callbackCommand = `${quote(process.execPath)} ${quote(callbackPath)}`;
  config.hooks.UserPromptSubmit[0].hooks[0].command = callbackCommand;
  if (eventsMode) for (const name of ["PreToolUse", "Stop"]) config.hooks[name] = [{hooks: [{type: "command", command: callbackCommand, timeout: 15}]}];
  writeFileSync(resolve(configRoot, "hooks.json"), JSON.stringify(config));
  report.adapter_command_sha256 = sha(adapterCommand);
  server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      const chunks = []; let bytes = 0;
      for await (const chunk of request) { bytes += chunk.length; assert.ok(bytes <= 2 * 1024 * 1024); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (eventsMode && !gatewayMode && request.url === "/hook-events") {
        assert.ok(request.headers.authorization === `Bearer ${callbackToken}`, "native.callback-authentication-failed");
        const result = eventSession.observe(body);
        response.writeHead(200, {"Content-Type": "application/json"});response.end(JSON.stringify(result));return;
      }
      assert.ok(request.url.endsWith("/responses"));
      assert.ok(requests.length < (eventsMode ? 4 : 3), "native.unexpected-provider-retry");
      requests.push({body, callbacks: callbacks()});
      if (gatewayMode && requests.length === 1) {
        await firstTurnReady;
        await gatewayClient.disconnect();
        report.disconnected_before_tool = true;
      }
      const id = `resp_fixture_${requests.length}`, itemId = `msg_fixture_${requests.length}`;
      const item = {id: itemId, type: "message", status: "completed", role: "assistant", content: [{type: "output_text", text: "ARE_NATIVE_FIXTURE_OK", annotations: []}]};
      let events = [
        {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
        {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress", content: []}},
        {type: "response.content_part.added", item_id: itemId, output_index: 0, content_index: 0, part: {type: "output_text", text: "", annotations: []}},
        {type: "response.output_text.delta", item_id: itemId, output_index: 0, content_index: 0, delta: "ARE_NATIVE_FIXTURE_OK"},
        {type: "response.output_item.done", output_index: 0, item},
        {type: "response.completed", response: {id, object: "response", status: "completed", output: [item], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}},
      ];
      if (eventsMode && requests.length === 1) {
        const tools = body.tools ?? [];
        const tool = tools.find(tool => tool.type === "function" && ["exec_command", "shell_command", "shell"].includes(tool.name));
        assert.ok(tool, `native.fixture-shell-tool-unavailable:${tools.map(tool => tool.name ?? tool.type).join(",")}`);
        const command = "printf ARE_NATIVE_TOOL_OK";
        const args = tool.name === "exec_command" ? {cmd: command, max_output_tokens: 64, yield_time_ms: 1000}
          : tool.name === "shell_command" ? {command} : {command: ["/bin/sh", "-c", command]};
        const call = {id: "fc_are_fixture", type: "function_call", call_id: "are_native_tool_1", name: tool.name, arguments: JSON.stringify(args), status: "completed"};
        events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
          {type: "response.output_item.added", output_index: 0, item: {...call, status: "in_progress"}},
          {type: "response.output_item.done", output_index: 0, item: call},
          {type: "response.completed", response: {id, object: "response", status: "completed", output: [call], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28}}}];
        report.fixture_tool = {name: tool.name, command};
      }
      response.writeHead(200, {"Content-Type": "text/event-stream"});
      response.end(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""));
    } catch (error) { report.provider_error = error.message; response.writeHead(500); response.end("fixture rejected request"); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  if (eventsMode) writeFileSync(resolve(scratch, "callback-endpoint.json"), JSON.stringify({url: `http://127.0.0.1:${server.address().port}/hook-events`, token: callbackToken}), {mode: 0o600});
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"
model = "are-fixture"
[model_providers.are_fixture]
name = "ARE local fixed response fixture"
base_url = ${JSON.stringify(endpoint)}
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[features]
codex_hooks = true
[projects.${JSON.stringify(checkout)}]
trust_level = "trusted"
`);
  const spawnNative = (command, args) => {
    child = spawn(command, args, {cwd: scratch, detached: true,
      env: {PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, LANG: "C.UTF-8", CODEX_HOME: configRoot}, stdio: ["pipe", "pipe", "pipe"]});
    if (gatewayMode) createInterface({input: child.stdout}).on("line", line => {
      const message = JSON.parse(line);
      if (message.method === "turn/completed") upstreamTerminals.push(message);
    });
    return child;
  };
  if (gatewayMode) {
    gateway = createPersistentGateway({listen_path: resolve(scratch, "gateway.sock"),
      backend: {mode: "direct-stdio", command: executable, command_prefix_args: ["--dangerously-bypass-hook-trust"]},
      spawn_impl: spawnNative,
      wrapper_factory: () => ({
        processClientMessage: async message => {upstreamRequests.push(message);return {to_server: [message], to_client: []};},
        processServerMessage: async message => ({to_server: [], to_client: [message]}),
      })});
    await gateway.start();
    gatewayClient = createGatewaySessionClient({socket_path: resolve(scratch, "gateway.sock"), consumer_id: "native-gateway-canary", lane: "interaction-bound"});
    gatewayClient.events.on("notification", message => notifications.push(message));
    gatewayClient.events.on("hook-observation", (result, message) => nativeCompletions.push({thread: message.params.threadId, turn: message.params.turn.id, result}));
    bridge = await startHookCallbackBridge({client: gatewayClient});
    writeFileSync(resolve(scratch, "callback-endpoint.json"), JSON.stringify(bridge.connection), {mode: 0o600});
    await gatewayClient.connect();
  } else spawnNative(executable, ["--dangerously-bypass-hook-trust", "app-server"]);
  child.stderr.on("data", chunk => { if (stderr.length < 16384) stderr += chunk.toString(); });
  child.on("error", error => { for (const request of pending.values()) request.reject(error); pending.clear(); });
  child.on("exit", () => { for (const request of pending.values()) request.reject(new Error("native.host-exited")); pending.clear(); });
  if (!gatewayMode) createInterface({input: child.stdout}).on("line", line => {
    try {
      const message = JSON.parse(line);
      if (message.method) {
        notifications.push(message);
        if (eventsMode && message.method === "turn/completed") nativeCompletions.push({thread: message.params.threadId, turn: message.params.turn.id, result: eventSession.observe(message)});
        if (message.id !== undefined) {
          report.unexpected_server_request = message.method;
          child.stdin.write(JSON.stringify({id: message.id, error: {code: -32601, message: "Canary accepts no server requests"}}) + "\n");
        }
      } else if (pending.has(message.id)) {
        const request = pending.get(message.id); pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
      }
    } catch { report.protocol_parse_error = true; }
  });
  await rpc("initialize", {clientInfo: {name: "are_native_prompt_fixture", version: "1"}, capabilities: {experimentalApi: true}});
  if (gatewayMode) await gatewayClient.notify("initialized");
  else child.stdin.write(JSON.stringify({method: "initialized"}) + "\n");
  const discovery = await rpc("hooks/list", {cwds: [checkout]});
  assert.deepEqual(commands(discovery), Array(eventsMode ? 3 : 1).fill(callbackCommand), "native.hook-discovery-mismatch");
  report.hook_discovery_verified = true;
  report.hook_discovery = discovery;
  let threadId;
  for (let index = 0; index < 3; index++) {
    const providerOffset = requests.length;
    if (index !== 1) {
      const started = await rpc("thread/start", {cwd: checkout, model: "are-fixture", modelProvider: "are_fixture", approvalPolicy: "never", sandbox: "read-only", ephemeral: true,
        config: {bypass_hook_trust: true},
        baseInstructions: eventsMode ? "Synthetic local test; the fixture may request one fixed printf command in the read-only workspace." : "Synthetic transport test. The provider returns fixed text and no tool calls."});
      threadId = started.thread.id;
    }
    const prompt = index === 1 ? "next" : "Explain the repository routing architecture";
    const turnParams = {threadId, input: [{type: "text", text: prompt}]};
    const turnKey = `native-turn-${index}`;
    const started = await rpc("turn/start", turnParams, turnKey);
    const turnId = started.turn.id;
    if (gatewayMode && index === 0) {
      releaseFirstTurn();
      const terminalDeadline = Date.now() + 20000;
      while (!upstreamTerminals.some(message => message.params?.turn?.id === turnId) && Date.now() < terminalDeadline) await delay(25);
      assert.ok(upstreamTerminals.some(message => message.params?.turn?.id === turnId), "native.detached-terminal-missing");
      assert.equal(gatewayClient.inspect().connected, false);
      assert.equal(nativeCompletions.length, 0, "native.terminal-bypassed-gateway");
      await gatewayClient.connect();
      const replay = await gatewayClient.request(turnKey, "turn/start", turnParams);
      assert.deepEqual(replay, started, "native.stable-turn-replay-mismatch");
      report.detached_completion_recovered = true;
      report.stable_turn_replayed = true;
    }
    const deadline = Date.now() + 20000;
    let completion;
    while (Date.now() < deadline) {
      completion = notifications.find(message => message.method === "turn/completed" && message.params?.threadId === threadId && message.params?.turn?.id === turnId);
      if (completion) break;
      await delay(25);
    }
    assert.equal(completion?.params.turn.status, "completed", "native.turn-not-completed");
    const turnCallbacks = callbacks().filter(row => row.event.session_id === threadId && row.event.turn_id === turnId);
    const matches = turnCallbacks.filter(row => row.event.hook_event_name === "UserPromptSubmit");
    assert.equal(matches.length, 1, "native.callback-attribution-mismatch");
    const callback = matches[0];
    report.last_callback_keys = Object.keys(callback.event).sort();
    assert.equal(callback.event.prompt, prompt, "native.prompt-changed");
    assert.equal(realpathSync(callback.event.cwd), checkout, "native.callback-cwd-mismatch");
    assert.equal(callback.status, 0, `native.adapter-failed:${callback.error}`);
    const context = JSON.parse(callback.output).hookSpecificOutput.additionalContext;
    assert.equal(requests.length - providerOffset, eventsMode && index === 0 ? 2 : 1, "native.provider-request-count");
    const captured = requests[providerOffset];
    assert.ok(captured.callbacks.some(row => row.event.turn_id === turnId && row.event.session_id === threadId), "native.callback-after-provider");
    assert.ok(JSON.stringify(captured.body.input).includes(JSON.stringify(context).slice(1, -1)), "native.context-not-on-wire");
    const material = JSON.parse(context.split("\n").at(-1));
    assert.equal(material.engine_kind, index === 1 ? "block" : "direct");
    report.turns.push({thread_id: threadId, turn_id: turnId, prompt_sha256: sha(prompt), context_sha256: sha(context),
      receipt_digest: material.receipt.receipt_digest, callback_before_provider: true, exact_context_on_wire: true, completed: true, engine_kind: material.engine_kind});
    if (eventsMode) {
      const terminal = nativeCompletions.find(row => row.thread === threadId && row.turn === turnId)?.result;
      assert.ok(terminal?.ok, `native.completion-binding-failed:${JSON.stringify(terminal?.reason_codes)}`);
      assert.equal(terminal.kind, index === 1 ? "block" : "complete");
      assert.equal(terminal.completion_scope, "native-turn-only");
      const stops = turnCallbacks.filter(row => row.event.hook_event_name === "Stop");
      assert.equal(stops.length, 1);assert.equal(stops[0].status, 0);assert.deepEqual(JSON.parse(stops[0].output), {});
      const tools = turnCallbacks.filter(row => row.event.hook_event_name === "PreToolUse");
      assert.equal(tools.length, index === 0 ? 1 : 0);
      if (index === 0) {
        assert.equal(tools[0].status, 0, tools[0].error);
        assert.equal(tools[0].event.tool_use_id, "are_native_tool_1");
        const effect = JSON.parse(JSON.parse(tools[0].output).hookSpecificOutput.additionalContext.split("\n").at(-1));
        assert.equal(effect.kind, "gate");assert.equal(effect.binding_digest, terminal.binding_digest);
        const output = requests[providerOffset + 1].body.input.find(item => item.type === "function_call_output" && item.call_id === "are_native_tool_1");
        assert.ok(JSON.stringify(output?.output).includes("ARE_NATIVE_TOOL_OK"), "native.fixture-tool-output-missing");
        report.turns.at(-1).tool_bound_to_request = true;
      }
      report.turns.at(-1).stop_observed = true;
      report.turns.at(-1).terminal_binding_digest = terminal.binding_digest;
      report.turns.at(-1).continuation_kind = terminal.kind;
    }
  }
  assert.equal(new Set(report.turns.map(turn => turn.thread_id)).size, 2);
  assert.equal(new Set(report.turns.map(turn => turn.receipt_digest)).size, 3);
  assert.ok(!report.protocol_parse_error && !report.provider_error && !report.unexpected_server_request);
  if (gatewayMode) {
    assert.equal(upstreamRequests.filter(message => message.method === "turn/start").length, 3, "native.duplicate-turn-dispatch");
    assert.equal(gateway.inspect().sessions.length, 1);
    assert.equal(gatewayClient.inspect().generation, 2);
    report.gateway = {client_generations: 2, native_turn_dispatches: 3, replay_without_redispatch: true,
      terminal_delivery: "gateway-rpc-only", wrapper_scope: "pass-through transport; ARE decisions through hook adapter", authority_effect: "none"};
  }
  report.native_delivery_verified = true; report.status = "PASS";
} catch (error) {
  report.error = error.message;
  report.host_stderr = stderr;
  report.host_diagnostics = notifications.filter(message => /hook|warn|error/i.test(message.method));
  if (scratch) report.callback_diagnostics = callbacks().map(row => ({keys: Object.keys(row.event), status: row.status, error: row.error}));
  process.exitCode = 1;
} finally {
  releaseFirstTurn();
  if (bridge) await bridge.close();
  if (gatewayClient) await gatewayClient.close();
  if (gateway) await gateway.close();
  if (child && child.exitCode === null) {
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
    await Promise.race([new Promise(resolve => child.once("exit", resolve)), delay(2000)]);
    if (child.exitCode === null) try { process.kill(-child.pid, "SIGKILL"); } catch {}
  }
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (scratch) rmSync(scratch, {recursive: true, force: true});
  eventSession.clear();
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
