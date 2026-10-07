#!/usr/bin/env node
// Isolated installed-Codex canary for the actual hosted-client CLI hook path.
// It uses a fixed loopback provider, a disposable CODEX_HOME, and no active chat.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {createServer} from "node:http";
import {appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";

import {createPersistentGateway, connectGatewayRpcTransport, createAppServerRpcClient,
  createCodexAppServerWrapper,
  loadRepositoryProfile} from "../packages/codex-app-server-wrapper/index.mjs";

const product = fileURLToPath(new URL("../", import.meta.url));
const checkout = resolve(product, "../..");
const binary = process.argv[2];
const expectedVersion = process.env.ARE_NATIVE_CANARY_EXPECTED_VERSION ?? "codex-cli 0.155.0-alpha.16.4";
const sha = value => createHash("sha256").update(value).digest("hex");
const delay = ms => new Promise(done => setTimeout(done, ms));
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const report = {schema_version: "are.native-hosted-cli-hook-canary/v1", status: "FAIL",
  authority_effect: "none", active_configuration_changed: false,
  external_model_calls: 0, provider: "loopback-fixed-responses-fixture",
  current_desktop_task_control: false};
let scratch, configRoot, gateway, trustTransport, trustRpc, client, provider;
const backends = [];
const providerRequests = [];
const hostNotifications = [];

async function waitFor(predicate, label, ms = 20000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await delay(25);
  }
  throw new Error(label);
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await Promise.race([exited, delay(3000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await exited;
  }
}

async function readyLine(child) {
  return await new Promise((done, fail) => {
    let buffer = "";
    const timer = setTimeout(() => fail(new Error("native.hosted-cli-ready-timeout")), 15000);
    const onData = chunk => {
      buffer += chunk.toString("utf8");
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        let value;
        try { value = JSON.parse(line); } catch { continue; }
        if (typeof value?.launch_url !== "string") continue;
        clearTimeout(timer); child.stderr.off("data", onData);
        child.stderr.resume(); // Drain later diagnostics without retaining a launch token.
        done(value); return;
      }
    };
    child.stderr.on("data", onData);
    child.once("exit", code => { clearTimeout(timer); fail(new Error(`native.hosted-cli-exited:${code}`)); });
  });
}

function fixedResponse(requestIndex, body) {
  const id = `resp_cli_fixture_${requestIndex}`;
  const message = {id: `msg_cli_fixture_${requestIndex}`, type: "message", status: "completed",
    role: "assistant", content: [{type: "output_text", text: "ARE_NATIVE_FIXTURE_OK", annotations: []}]};
  let output = [message];
  if (requestIndex === 1) {
    const tool = body.tools?.find(value => value.type === "function"
      && ["exec_command", "shell_command", "shell"].includes(value.name));
    assert.ok(tool, "native.fixture-shell-tool-unavailable");
    const command = "printf '%s' ARE_NATIVE_TOOL_ OK";
    const args = tool.name === "exec_command" ? {cmd: command, max_output_tokens: 64, yield_time_ms: 1000}
      : tool.name === "shell_command" ? {command} : {command: ["/bin/sh", "-c", command]};
    output = [{id: "fc_are_cli_fixture", type: "function_call", call_id: "are_cli_tool_1",
      name: tool.name, arguments: JSON.stringify(args), status: "completed"}];
    report.fixture_tool_name = tool.name;
  }
  const item = output[0];
  const events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress",
      ...(item.type === "message" ? {content: []} : {})}},
    ...(item.type === "message" ? [{type: "response.content_part.added", item_id: item.id,
      output_index: 0, content_index: 0, part: {type: "output_text", text: "", annotations: []}},
      {type: "response.output_text.delta", item_id: item.id, output_index: 0,
        content_index: 0, delta: "ARE_NATIVE_FIXTURE_OK"}] : []),
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output,
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28}}}];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

try {
  assert.ok(binary && process.argv.length === 3, "usage: test-native-hosted-cli-hook.mjs /exact/path/to/codex");
  const executable = realpathSync(binary);
  const version = spawnSync(executable, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "native.exact-version-required");
  report.host = {version: expectedVersion, sha256: sha(readFileSync(executable))};
  scratch = mkdtempSync(resolve(tmpdir(), "are-native-hosted-cli-"));
  configRoot = resolve(scratch, "codex-home");
  mkdirSync(configRoot, {mode: 0o700});
  const connectionPath = resolve(scratch, "hook-connection.json");
  const callbackCommand = `${quote(process.execPath)} ${quote(resolve(product, "bin/are-hook-callback.mjs"))} ${quote(connectionPath)} --fail-closed-tools`;
  writeFileSync(resolve(configRoot, "hooks.json"), JSON.stringify({hooks: Object.fromEntries(
    ["UserPromptSubmit", "PreToolUse", "Stop"].map(event => [event,
      [{hooks: [{type: "command", command: callbackCommand}]}]]))}), {mode: 0o600});
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let size = 0;
      for await (const chunk of request) {
        size += chunk.length; assert.ok(size <= 2 * 1024 * 1024); chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      assert.ok(providerRequests.length <= 2, "native.unexpected-provider-retry");
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(fixedResponse(providerRequests.length, body));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500); response.end("fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"
model = "are-fixture"
[model_providers.are_fixture]
name = "ARE local fixed response fixture"
base_url = "http://127.0.0.1:${provider.address().port}/v1"
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[features]
codex_hooks = true
[projects.${JSON.stringify(checkout)}]
trust_level = "trusted"
`, {mode: 0o600});
  const loaded = loadRepositoryProfile(resolve(product,
    "packages/codex-app-server-wrapper/profiles/repository-v1.json"), resolve(checkout, ".."));
  assert.equal(loaded.ok, true, "native.wrapper-profile-unavailable");
  gateway = createPersistentGateway({listen_path: resolve(scratch, "gateway.sock"),
    backend: {mode: "direct-stdio", command: executable},
    spawn_impl: (command, args) => {
      const child = spawn(command, args, {cwd: scratch, detached: true,
        env: {PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, LANG: "C.UTF-8",
          CODEX_HOME: configRoot, TMPDIR: tmpdir()}, stdio: ["pipe", "pipe", "pipe"]});
      backends.push(child);
      createInterface({input: child.stdout}).on("line", line => {
        try { const message = JSON.parse(line); if (message.method) hostNotifications.push(message); }
        catch { /* The gateway owns protocol validation; this is a bounded event census. */ }
      });
      return child;
    },
    wrapper_factory: () => {
      return createCodexAppServerWrapper({loaded_profile: loaded.value,
        decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
        ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot});
    }});
  await gateway.start();
  trustTransport = connectGatewayRpcTransport({socket_path: resolve(scratch, "gateway.sock"),
    consumer_id: "native-cli-trust-fixture", lane: "interaction-bound",
    expected_backend_adapter_id: "codex-app-server/v1"});
  await trustTransport.ready;
  trustRpc = createAppServerRpcClient({transport: trustTransport});
  await trustRpc.request("initialize", {clientInfo: {name: "are_native_cli_hook_fixture", version: "1"},
    capabilities: {experimentalApi: true}});
  await trustRpc.notify("initialized");
  const discovery = await trustRpc.request("hooks/list", {cwds: [checkout]});
  const hooks = discovery.data?.flatMap(row => row.hooks ?? []) ?? [];
  assert.equal(hooks.length, 3, "native.exact-hook-trust-scope-mismatch");
  for (const hook of hooks) {
    assert.equal(hook.sourcePath, resolve(configRoot, "hooks.json"));
    assert.match(hook.currentHash, /^sha256:[0-9a-f]{64}$/);
    appendFileSync(resolve(configRoot, "config.toml"),
      `\n[hooks.state.${JSON.stringify(hook.key)}]\ntrusted_hash = ${JSON.stringify(hook.currentHash)}\n`);
  }
  const trusted = await trustRpc.request("hooks/list", {cwds: [checkout]});
  assert.ok((trusted.data?.flatMap(row => row.hooks ?? []) ?? []).every(hook => hook.trustStatus === "trusted"),
    "native.hook-trust-not-exact");
  report.exact_hook_hashes_trusted = hooks.length;
  await trustRpc.close(); trustRpc = null; trustTransport = null;
  const token = randomBytes(32).toString("base64url");
  client = spawn(process.execPath, [resolve(product,
    "packages/codex-app-server-wrapper/bin/are-codex-windows-client.mjs"),
    "--socket", resolve(scratch, "gateway.sock"), "--repository-root", checkout,
    "--cwd", checkout, "--hook-connection-file", connectionPath,
    "--port", "0", "--token", token], {cwd: scratch,
    env: {...process.env, CODEX_HOME: configRoot, TMPDIR: tmpdir()}, stdio: ["ignore", "ignore", "pipe"]});
  const ready = await readyLine(client);
  assert.equal(ready.schema_version, "are.codex-windows-client-ready/v1");
  assert.equal(existsSync(connectionPath), true, "native.hosted-cli-hook-binding-missing");
  assert.equal(JSON.parse(readFileSync(connectionPath, "utf8")).owner_process.pid, client.pid);
  const launch = new URL(ready.launch_url);
  launch.hash = "";
  const headers = {authorization: `Bearer ${token}`, "content-type": "application/json"};
  const post = async (path, body) => {
    const response = await fetch(new URL(path, launch), {method: "POST", headers, body: JSON.stringify(body)});
    return {status: response.status, body: await response.json()};
  };
  const created = await post("api/threads", {requestKey: "native-cli-thread-1", cwd: checkout, model: "are-fixture"});
  assert.equal(created.status, 201, `native.hosted-cli-thread-start:${JSON.stringify(created.body)}`);
  const threadId = created.body.value?.thread?.id;
  assert.ok(threadId);
  const turn = await post("api/turns", {threadId, text: "Explain the repository routing architecture",
    requestKey: "native-cli-turn-1"});
  assert.equal(turn.status, 202, `native.hosted-cli-turn-start:${JSON.stringify(turn.body)}`);
  const terminal = await waitFor(() => hostNotifications.find(message => message.method === "turn/completed"
    && message.params?.threadId === threadId), "native.hosted-cli-terminal-missing");
  assert.equal(terminal.params.turn.status, "completed");
  assert.equal(providerRequests.length, 2, "native.provider-request-count");
  assert.ok(hostNotifications.some(message => message.method === "hook/completed"
    && message.params?.threadId === threadId && message.params?.run?.eventName === "userPromptSubmit"
    && message.params?.run?.status === "completed"), "native.prompt-hook-not-delivered");
  assert.ok(hostNotifications.some(message => message.method === "hook/completed"
    && message.params?.threadId === threadId && message.params?.run?.eventName === "preToolUse"
    && message.params?.run?.status === "blocked"), "native.tool-hook-not-blocked");
  assert.ok(JSON.stringify(providerRequests[0].input).includes("engine_kind"),
    "native.prompt-context-not-on-provider-wire");
  const toolOutput = providerRequests[1].input?.find(item => item.type === "function_call_output"
    && item.call_id === "are_cli_tool_1");
  assert.ok(toolOutput, "native.denied-tool-result-missing");
  assert.ok(!JSON.stringify(toolOutput.output).includes("ARE_NATIVE_TOOL_OK"), "native.denied-tool-executed");
  report.status = "PASS";
  report.hosted_client_cli_hook_binding = true;
  report.prompt_context_on_provider_wire = true;
  report.supported_tool_denied = true;
  report.native_turn_completed = true;
  report.scope = "one disposable hosted-client CLI thread and one supported local shell tool";
} catch (error) {
  report.error = error.message;
  report.client_exit_code = client?.exitCode ?? null;
  process.exitCode = 1;
} finally {
  await stopChild(client);
  report.hook_connection_removed = scratch ? !existsSync(resolve(scratch, "hook-connection.json")) : null;
  await trustRpc?.close().catch(() => {});
  await trustTransport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  for (const child of backends) await stopChild(child);
  if (provider) { provider.closeAllConnections(); await new Promise(done => provider.close(done)); }
  if (scratch) rmSync(scratch, {recursive: true, force: true});
  report.temporary_configuration_removed = scratch ? !existsSync(scratch) : null;
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
