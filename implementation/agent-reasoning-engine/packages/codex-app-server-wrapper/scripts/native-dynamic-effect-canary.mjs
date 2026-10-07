#!/usr/bin/env node
// Disposable native host proof of authenticated dynamic-tool call attribution.
// This fixture always denies the tool and performs no requested effect.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {once} from "node:events";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {HOSTED_EFFECT_DYNAMIC_TOOL, HOSTED_EFFECT_TOOL_NAME} from "../src/host-method-policy.mjs";

const [binary, expectedVersion] = process.argv.slice(2);
const report = {schema_version: "are.native-dynamic-effect-canary/v1", status: "FAIL",
  authority_effect: "none", current_desktop_task_touched: false, external_model_calls: 0};
const providerRequests = [];
const dynamicCalls = [];
let root, provider, child;

function responseEvents(id, output) {
  const events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}}];
  for (const [index, item] of output.entries()) {
    events.push({type: "response.output_item.added", output_index: index,
      item: {...item, status: "in_progress"}});
    if (item.type === "message") {
      events.push({type: "response.content_part.added", item_id: item.id, output_index: index,
        content_index: 0, part: {type: "output_text", text: "", annotations: []}});
      events.push({type: "response.output_text.delta", item_id: item.id, output_index: index,
        content_index: 0, delta: item.content[0].text});
    }
    events.push({type: "response.output_item.done", output_index: index, item});
  }
  events.push({type: "response.completed", response: {id, object: "response", status: "completed",
    output, usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
      input_tokens_details: {cached_tokens: 0}}}});
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

try {
  assert.ok(binary && expectedVersion,
    "usage: native-dynamic-effect-canary.mjs <installed-codex> <exact-version>");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  root = mkdtempSync(join(tmpdir(), "are-native-dynamic-effect-"));
  const codexHome = join(root, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 2 * 1024 * 1024, "canary.provider-input-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      assert.ok(providerRequests.length <= 2, "canary.unexpected-provider-request");
      let output;
      if (providerRequests.length === 1) {
        const toolNames = (body.tools ?? []).map(item => item.name).filter(Boolean);
        report.model_tool_names = toolNames;
        const toolName = toolNames.find(name => name === HOSTED_EFFECT_TOOL_NAME);
        assert.equal(toolName, HOSTED_EFFECT_TOOL_NAME, "canary.dynamic-tool-not-advertised");
        assert.ok(["exec_command", "apply_patch", "shell_command"].every(name => !toolNames.includes(name)),
          "canary.native-effect-tool-advertised");
        output = [{id: "fc_are_effect_probe", type: "function_call", call_id: "are_effect_probe_call_1",
          name: toolName, arguments: JSON.stringify({kind: "command", proposal: {executable_id: "denied-fixture"}}), status: "completed"}];
      } else {
        const denied = (body.input ?? []).some(item => item.type === "function_call_output"
          && item.call_id === "are_effect_probe_call_1"
          && JSON.stringify(item.output).includes("ARE_EFFECT_DENIED_BY_HOST_FIXTURE"));
        assert.equal(denied, true, "canary.dynamic-denial-not-returned-to-model");
        report.denial_returned_to_model = true;
        output = [{id: "msg_are_effect_probe", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_DYNAMIC_EFFECT_DENIED_OK", annotations: []}]}];
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(`resp_are_dynamic_${providerRequests.length}`, output));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500); response.end("fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  writeFileSync(join(codexHome, "config.toml"),
    `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n` +
    `[features]\nshell_tool = false\nunified_exec = false\napps = false\n` +
    `multi_agent = false\ngoals = false\nplugins = false\nremote_plugin = false\n` +
    `[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\n` +
    `base_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\n` +
    `request_max_retries = 0\nstream_max_retries = 0\n`, {mode: 0o600});

  child = spawn(binary, ["app-server", "--stdio"], {cwd: resolve(import.meta.dirname, "../../../.."),
    env: {...process.env, CODEX_HOME: codexHome}, stdio: ["pipe", "pipe", "pipe"], windowsHide: true});
  let stderr = "";
  child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-4096); });
  const pending = new Map();
  const events = [];
  let nextId = 1;
  const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
  lines.on("line", line => {
    let message;
    try { message = JSON.parse(line); }
    catch { report.host_invalid_json = true; return; }
    if (message.method === "item/tool/call" && Object.hasOwn(message, "id")) {
      dynamicCalls.push(message);
      child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id, result: {
        contentItems: [{type: "inputText", text: "ARE_EFFECT_DENIED_BY_HOST_FIXTURE"}], success: false}})}\n`);
      return;
    }
    if (message.method) { events.push(message); return; }
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
      rejectRpc(new Error(`canary.rpc-timeout:${method}:${stderr.slice(-200)}`)); }, 20000);
    pending.set(String(id), {method, resolve: resolveRpc, reject: rejectRpc, timer});
    child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id, method, params})}\n`);
  });
  await rpc("initialize", {clientInfo: {name: "are_native_dynamic_effect_canary", version: "1.0.0"},
    capabilities: {experimentalApi: true}});
  child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", method: "initialized", params: {}})}\n`);
  const started = await rpc("thread/start", {cwd: resolve(import.meta.dirname, "../../../.."),
    model: "are-fixture", approvalPolicy: "never", sandbox: "read-only",
    dynamicTools: [HOSTED_EFFECT_DYNAMIC_TOOL]});
  const threadId = started?.thread?.id;
  assert.ok(typeof threadId === "string" && threadId, "canary.thread-id-missing");
  const turn = await rpc("turn/start", {threadId, input: [{type: "text", text: "Call the fixture effect probe."}],
    approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
  const turnId = turn?.turn?.id;
  assert.ok(typeof turnId === "string" && turnId, "canary.turn-id-missing");
  const deadline = Date.now() + 20000;
  while (!events.some(event => event.method === "turn/completed" && event.params?.turn?.id === turnId)
    && Date.now() < deadline) await new Promise(done => setTimeout(done, 25));
  assert.ok(events.some(event => event.method === "turn/completed"
    && event.params?.turn?.id === turnId && event.params?.turn?.status === "completed"),
  "canary.turn-did-not-complete");
  assert.equal(dynamicCalls.length, 1, "canary.expected-one-dynamic-call");
  const call = dynamicCalls[0];
  assert.equal(call.params.threadId, threadId, "canary.dynamic-thread-id-mismatch");
  assert.equal(call.params.turnId, turnId, "canary.dynamic-turn-id-mismatch");
  assert.equal(call.params.callId, "are_effect_probe_call_1", "canary.dynamic-call-id-mismatch");
  assert.equal(call.params.tool, HOSTED_EFFECT_TOOL_NAME, "canary.dynamic-tool-name-mismatch");
  assert.deepEqual(call.params.arguments, {kind: "command", proposal: {executable_id: "denied-fixture"}},
    "canary.dynamic-arguments-mismatch");
  assert.equal(providerRequests.length, 2, "canary.expected-two-model-requests");
  assert.equal(report.provider_error, undefined, "canary.provider-failed");
  report.dynamic_call_host_bound = "PASS";
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.stdin.end();
    child.kill("SIGTERM");
    await Promise.race([once(child, "close").catch(() => {}),
      new Promise(done => setTimeout(done, 3000))]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  if (provider) {
    provider.closeAllConnections();
    await new Promise(done => provider.close(done));
  }
  if (root) rmSync(root, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});
  report.teardown = {temporary_configuration_removed: root ? !existsSync(root) : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
