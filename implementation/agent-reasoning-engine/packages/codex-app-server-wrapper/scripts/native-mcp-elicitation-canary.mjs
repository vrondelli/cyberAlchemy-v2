#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createAppServerRpcClient, createApprovalBroker, createCodexAppServerWrapper,
  createElicitationBroker, createPersistentGateway, createWindowsClientHost,
  deriveGatewayReasoningStateProfile, loadRepositoryProfile} from "../index.mjs";
import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checkoutRoot = resolve(packageRoot, "../../../../..");
const fixtureServer = resolve(packageRoot, "scripts/fixtures/mcp-elicitation-server.mjs");
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {schema_version: "are.native-mcp-elicitation-canary/v1", status: "FAIL",
  authority_effect: "none", external_model_calls: 0, current_desktop_task_touched: false};
let scratch;
let provider;
let gateway;
let transport;
let rpc;
let host;
let backend;
let stderr = "";
const requests = [];
const hostRequests = [];
const notifications = [];

function responseEvents(id, output) {
  const events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}}];
  for (const [index, item] of output.entries()) {
    events.push({type: "response.output_item.added", output_index: index, item: {...item, status: "in_progress"}});
    if (item.type === "message") {
      events.push({type: "response.content_part.added", item_id: item.id, output_index: index, content_index: 0,
        part: {type: "output_text", text: "", annotations: []}});
      events.push({type: "response.output_text.delta", item_id: item.id, output_index: index, content_index: 0,
        delta: item.content[0].text});
    }
    events.push({type: "response.output_item.done", output_index: index, item});
  }
  events.push({type: "response.completed", response: {id, object: "response", status: "completed", output,
    usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}});
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

try {
  const [binaryArg, expectedVersion] = process.argv.slice(2);
  assert.ok(binaryArg && expectedVersion, "Usage: native-mcp-elicitation-canary.mjs <installed-codex-binary> <exact-version>");
  const binary = realpathSync(binaryArg);
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {path: binary, version: expectedVersion, sha256: sha256(readFileSync(binary))};
  scratch = mkdtempSync(resolve(tmpdir(), "are-native-mcp-elicitation-"));
  const configRoot = resolve(scratch, "codex-home");
  mkdirSync(configRoot);
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 2 * 1024 * 1024, "canary.provider-request-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      requests.push(body);
      assert.ok(requests.length <= 2, "canary.unexpected-provider-retry");
      let output;
      if (requests.length === 1) {
        const names = (body.tools ?? []).map((tool) => tool.name).filter(Boolean);
        report.available_mcp_tool = names.find((name) => name.includes("are_elicitation_fixture")) ?? null;
        const namespace = (body.tools ?? []).find((tool) => tool.name === report.available_mcp_tool);
        assert.ok(report.available_mcp_tool, `canary.mcp-tool-unavailable:${names.join(",")}`);
        assert.equal(namespace?.type, "namespace", "canary.mcp-tool-not-namespace");
        assert.ok(namespace.tools?.some((tool) => tool.name === "collect_fixture_answer"),
          "canary.mcp-inner-tool-unavailable");
        output = [{id: "fc_are_mcp_elicitation", type: "function_call", call_id: "are_mcp_elicitation_1",
          namespace: report.available_mcp_tool, name: "collect_fixture_answer", arguments: "{}", status: "completed"}];
      } else {
        const answered = (body.input ?? []).some((item) => item.type === "function_call_output"
          && item.call_id === "are_mcp_elicitation_1"
          && JSON.stringify(item.output).includes("ARE_MCP_ELICITATION_NATIVE_OK"));
        report.answer_observed_by_provider = answered;
        assert.ok(answered, "canary.mcp-answer-not-on-provider-wire");
        output = [{id: "msg_are_mcp_elicitation", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_MCP_ELICITATION_COMPLETE", annotations: []}]}];
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(`resp_are_mcp_elicitation_${requests.length}`, output));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500);
      response.end("fixture rejected request");
    }
  });
  await new Promise((done) => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nmcp_optional_startup_grace_ms = 0\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[mcp_servers.are_elicitation_fixture]\ncommand = ${JSON.stringify(process.execPath)}\nargs = [${JSON.stringify(fixtureServer)}]\nrequired = true\nstartup_timeout_sec = 10\ntool_timeout_sec = 30\ndefault_tools_approval_mode = "auto"\n`, {mode: 0o600});

  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), checkoutRoot);
  assert.equal(loaded.ok, true, `canary.wrapper-profile-unavailable:${JSON.stringify(loaded.reason_codes)}`);
  const gatewayPath = resolve(scratch, "gateway.sock");
  gateway = createPersistentGateway({listen_path: gatewayPath, expected_codex_version: expectedVersion,
    backend: {mode: "direct-stdio", command: binary},
    spawn_impl: (command, args, options) => {
      backend = spawn(command, args, {cwd: scratch, ...options, env: {...process.env, CODEX_HOME: configRoot}});
      backend.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8192); });
      return backend;
    },
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, lane, consumer_ref: consumer_id};
      profile.reasoning_state = deriveGatewayReasoningStateProfile(loaded.value, consumer_id,
        resolve(scratch, "reasoning-state"));
      return createCodexAppServerWrapper({loaded_profile: profile,
        decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
        ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot});
    }});
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
    lane: "interaction-bound"});
  const approvalBroker = createApprovalBroker();
  const elicitationBroker = createElicitationBroker({timeout_ms: 90000});
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000, completion_timeout_ms: 30000,
    server_request_timeout_ms: 120000,
    approval_handler: (message, options) => approvalBroker.request(message, options),
    elicitation_handler: (message, options) => {
      hostRequests.push({method: message.method, thread_id: message.params?.threadId,
        turn_id: message.params?.turnId, server_name: message.params?.serverName,
        mode: message.params?.mode});
      return elicitationBroker.request(message, options);
    }});
  rpc.events.on("notification", (message) => notifications.push(message));
  host = createWindowsClientHost({rpc_client: rpc, approval_broker: approvalBroker,
    elicitation_broker: elicitationBroker, repository_root: checkoutRoot, default_cwd: checkoutRoot,
    assets_directory: resolve(packageRoot, "client"), port: 0,
    token: "are-native-mcp-elicitation-fixture-token", thread_approval_policy: "on-request",
    thread_sandbox: "read-only"});
  const ready = await host.start();
  const api = async (path, options = {}) => {
    const response = await fetch(new URL(path, ready.url), {method: options.method ?? "GET",
      headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
      ...(options.body ? {body: JSON.stringify(options.body)} : {})});
    const body = await response.json();
    assert.ok(response.ok && body.ok !== false,
      `canary.host-http-failed:${path}:${body.reason ?? response.status}:${body.detail ?? ""}`);
    return body.value ?? body;
  };
  assert.equal((await fetch(ready.url)).status, 200, "canary.host-ui-unavailable");
  const started = await api("api/threads", {method: "POST", body: {cwd: checkoutRoot, model: "are-fixture",
    requestKey: "native-mcp-elicitation-thread-start"}});
  const threadId = started.thread.id;
  assert.equal(gateway.inspect().sessions[0]?.initialization_status, "complete",
    "canary.backend-version-not-bound");
  const turn = await rpc.request("turn/start", {threadId,
    input: [{type: "text", text: "Research the repository routing architecture with the isolated fixture MCP tool"}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
    collaborationMode: {mode: "plan", settings: {model: "are-fixture", reasoning_effort: null,
      developer_instructions: null}}}, {idempotency_key: "native-mcp-elicitation-turn-start"});
  const turnId = turn.turn.id;
  const promptDeadline = Date.now() + 20000;
  let pending;
  while (Date.now() < promptDeadline) {
    pending = (await api("api/state")).pending_elicitations.find((entry) =>
      entry.thread_id === threadId && entry.turn_id === turnId);
    if (pending) break;
    await delay(25);
  }
  assert.ok(pending, "canary.native-mcp-prompt-missing");
  assert.equal(pending.server_name, "are_elicitation_fixture", "canary.mcp-server-identity-mismatch");
  assert.equal(pending.fields.length, 1, "canary.mcp-schema-field-count");
  assert.equal(pending.fields[0].name, "answer", "canary.mcp-schema-field-name");
  const answer = await api(`api/elicitations/${encodeURIComponent(pending.request_id)}`, {method: "POST",
    body: {action: "accept", content: {answer: "native fixture answer"}}});
  assert.equal(answer.request_id, pending.request_id, "canary.mcp-answer-request-mismatch");
  assert.equal(JSON.stringify(answer).includes("native fixture answer"), false, "canary.mcp-answer-echoed");
  const completed = await rpc.waitForNotification((message) => message.method === "turn/completed"
    && message.params?.threadId === threadId && message.params?.turn?.id === turnId,
  {timeout_ms: 30000});
  assert.equal(completed.params.turn.status, "completed", "canary.turn-not-completed");
  assert.equal(requests.length, 2, "canary.provider-request-count");
  assert.equal(hostRequests.length, 1, "canary.mcp-host-request-count");
  assert.deepEqual(hostRequests[0], {method: "mcpServer/elicitation/request", thread_id: threadId,
    turn_id: turnId, server_name: "are_elicitation_fixture", mode: "form"});
  assert.ok(notifications.some((message) => message.method === "serverRequest/resolved"
    && message.params?.threadId === threadId && String(message.params?.requestId) === pending.request_id),
  "canary.mcp-server-request-resolution-missing");
  assert.equal((await api("api/state")).pending_elicitations.length, 0,
    "canary.mcp-prompt-not-cleared");
  report.host_request = hostRequests[0];
  report.host_ui = {pending_prompt_observed: true, authenticated_answer_accepted: true,
    answer_not_echoed: true, pending_after_answer: 0};
  report.provider_requests = requests.length;
  report.server_request_resolved = true;
  report.turn_status = completed.params.turn.status;
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  report.error_code = error.code ?? null;
  report.error_details = error.details ?? null;
  report.host_stderr_tail = stderr;
  process.exitCode = 1;
} finally {
  await host?.close().catch(() => {});
  await rpc?.close().catch(() => {});
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  if (backend && backend.exitCode === null && backend.signalCode === null) {
    backend.kill("SIGTERM");
    await Promise.race([new Promise((done) => backend.once("exit", done)), delay(2000)]);
    if (backend.exitCode === null && backend.signalCode === null) backend.kill("SIGKILL");
  }
  if (provider) {
    provider.closeAllConnections();
    await new Promise((done) => provider.close(done));
  }
  try {
    if (scratch) rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});
  } catch (error) {
    report.teardown_error = error.message;
  }
  report.teardown = {temporary_configuration_removed: scratch ? !existsSync(scratch) : null,
    native_child_reaped: backend ? backend.exitCode !== null || backend.signalCode !== null : null};
  if (report.teardown.temporary_configuration_removed !== true || report.teardown.native_child_reaped !== true) {
    report.status = "FAIL";
    process.exitCode = 1;
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
