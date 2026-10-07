#!/usr/bin/env node
// Disposable installed-host join with a local fake Responses provider. It
// exercises the real ARE wrapper, gateway, broker and journal without a paid
// model call or touching the current desktop task. Approval is a test fixture
// unless --browser-approval is selected for a human/browser-driven canary.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";

import {connectGatewayRpcTransport, createAppServerRpcClient,
  createCodexAppServerWrapper, createCodexGatewayBackendAdapter,
  createApprovalBroker, createFileGatewaySessionStore, createPersistentGateway,
  createWindowsClientHost, loadRepositoryProfile, spawnAppServerRpcTransport} from "../index.mjs";
import {createGatewayHostedEffectAssessor, createHostedEffectApprovalAdapter,
  createHostedEffectBroker, createHostedEffectDynamicToolHandler} from "../src/hosted-effect-broker.mjs";
import {createGatewayHostedEffectCommandDispatcher,
  createHostedEffectCommandExecutor} from "../src/hosted-effect-execution.mjs";
import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";
import {HOSTED_EFFECT_DYNAMIC_TOOL, HOSTED_EFFECT_TOOL_NAME} from "../src/host-method-policy.mjs";

const [binary, expectedVersion, approvalMode] = process.argv.slice(2);
const browserApproval = approvalMode === "--browser-approval";
const resumeRevokeProbe = approvalMode === "--resume-revoke-probe";
const resumeReplaceProbe = approvalMode === "--resume-replace-probe";
const resumeProbe = approvalMode === "--resume-probe" || resumeRevokeProbe || resumeReplaceProbe;
const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const sourceRepo = join(repositoryRoot, "cyberAlchemy-v2");
const report = {schema_version: "are.native-hosted-effect-join-canary/v1",
  status: "FAIL", current_desktop_task_touched: false, external_model_calls: 0,
  approval_surface: browserApproval ? "hosted-browser-one-use-click" : "auto-accepted-one-use-broker-fixture",
  authority_effect: "none"};
let root, provider, gateway, transport, journal, store, browserHost;

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
  assert.ok(binary && expectedVersion && (!approvalMode || browserApproval || resumeProbe),
    "usage: native-hosted-effect-join-canary <codex> <version> [--browser-approval|--resume-probe|--resume-revoke-probe|--resume-replace-probe]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  root = mkdtempSync(join(tmpdir(), "are-native-hosted-effect-join-"));
  const codexHome = join(root, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  const sentinel = join(root, "approved-effect.txt");
  let providerCalls = 0;
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 4 * 1024 * 1024, "canary.provider-input-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerCalls += 1;
      assert.ok(providerCalls <= (resumeProbe ? 3 : 2), "canary.unexpected-provider-request");
      let output;
      if (providerCalls === 1) {
        const toolNames = (body.tools ?? []).map(item => item.name).filter(Boolean);
        assert.ok(toolNames.includes(HOSTED_EFFECT_TOOL_NAME), "canary.dynamic-tool-not-advertised");
        assert.ok(["exec_command", "apply_patch", "shell_command"].every(name => !toolNames.includes(name)),
          "canary.native-effect-tool-advertised");
        output = [{id: "fc_are_join", type: "function_call", call_id: "are_join_call_1",
          name: HOSTED_EFFECT_TOOL_NAME, arguments: JSON.stringify({kind: "command",
            proposal: {command: [process.execPath, "-e",
              `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'ARE_JOIN_OK')`], cwd: root}}),
          status: "completed"}];
      } else if (providerCalls === 2) {
        report.model_tool_output_observed = (body.input ?? []).some(item =>
          item.type === "function_call_output" && item.call_id === "are_join_call_1");
        const succeeded = (body.input ?? []).some(item => item.type === "function_call_output"
          && item.call_id === "are_join_call_1" && String(item.output).includes('"ok":true'));
        assert.equal(succeeded, true, "canary.broker-success-not-returned-to-model");
        output = [{id: "msg_are_join", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_HOSTED_EFFECT_JOIN_OK", annotations: []}]}];
      } else {
        report.resumed_model_tool_names = (body.tools ?? []).map(item => item.name).filter(Boolean);
        output = [{id: "msg_are_resume", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_HOSTED_EFFECT_RESUME_PROBE_OK", annotations: []}]}];
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(`resp_are_join_${providerCalls}`, output));
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
  const loaded = loadRepositoryProfile(resolve(import.meta.dirname, "../profiles/repository-v1.json"),
    repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  let wrapper = null;
  store = createFileGatewaySessionStore({path: join(root, "gateway-sessions.jsonl"),
    store_id: "native-hosted-effect-join-canary"});
  const token = randomBytes(32).toString("hex");
  gateway = createPersistentGateway({listen_path: join(root, "gateway.sock"),
    runtime_epoch_id: "are-native-hosted-effect-join-canary",
    backend: {mode: "direct-stdio", command: binary},
    backend_adapter: createCodexGatewayBackendAdapter(),
    session_store: store, connection_token: token,
    allow_hosted_effect_tool: true,
    spawn_impl: (command, args, options) => spawn(command, args, {...options,
      cwd: sourceRepo, env: {...options.env, CODEX_HOME: codexHome}, windowsHide: true}),
    wrapper_factory: () => {
      wrapper = createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value,
        allow_hosted_effect_tool: true, hosted_effect_repository_root: root,
        require_bound_effect_route: true});
      return wrapper;
    },
  });
  journal = createFileHostedEffectJournal({state_dir: root});
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: join(root, "gateway.sock"),
    connection_token: token, consumer_id: "codex:native-hosted-join", lane: "interaction-bound"});
  await transport.ready;
  let hostedHandler = null;
  const rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000,
    completion_timeout_ms: 30000, dynamic_tool_name: HOSTED_EFFECT_TOOL_NAME,
    dynamic_tool_handler: async message => {
      const result = await hostedHandler(message);
      report.dynamic_result_success = result?.success === true;
      return result;
    }});
  const active = (threadId, turnId) => wrapper?.inspectState().active_semantic_turn_ids.includes(turnId) === true;
  let approvalBroker;
  approvalBroker = createApprovalBroker({on_change: event => {
    if (!browserApproval && event.kind === "approval-requested") queueMicrotask(() =>
      approvalBroker.decide(event.approval.request_id, {decision: "accept"}));
  }});
  const broker = createHostedEffectBroker({journal, is_active_turn: active,
    assess: createGatewayHostedEffectAssessor({rpc_client: rpc}),
    approve: createHostedEffectApprovalAdapter({approval_broker: approvalBroker}),
    execute: createHostedEffectCommandExecutor({journal, is_active_turn: active,
      repository_root: root,
      dispatch: createGatewayHostedEffectCommandDispatcher({rpc_client: rpc})})});
  hostedHandler = createHostedEffectDynamicToolHandler({broker, is_active_turn: active});
  if (browserApproval) {
    browserHost = createWindowsClientHost({rpc_client: rpc, approval_broker: approvalBroker,
      allow_hosted_effect_tool: true, repository_root: root, hosted_effect_root: root,
      assets_directory: resolve(import.meta.dirname, "../client"), port: 0,
      token: randomBytes(24).toString("hex")});
    const ready = await browserHost.start();
    process.stderr.write(`CANARY_APPROVAL_URL=${ready.url}#token=${browserHost.token}\n`);
  } else {
    await rpc.initialize({clientInfo: {name: "are_native_hosted_join_canary", version: "1.0.0"},
      capabilities: {experimentalApi: true}});
    await rpc.notify("initialized", {});
  }
  const thread = await rpc.startThread({cwd: sourceRepo, model: "are-fixture",
    approvalPolicy: "on-request", sandbox: "read-only",
    dynamicTools: [HOSTED_EFFECT_DYNAMIC_TOOL]},
  {idempotency_key: "canary:thread"});
  assert.ok(thread?.thread?.id, "canary.thread-id-missing");
  const turn = await rpc.runTurn({threadId: thread.thread.id,
    input: [{type: "text", text: "Implement the bounded fixture change using the ARE effect tool."}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}},
  {idempotency_key: "canary:turn"});
  assert.equal(turn.completed?.turn?.status, "completed", "canary.turn-not-completed");
  const read = await rpc.request("thread/read", {threadId: thread.thread.id, includeTurns: false});
  report.host_thread_fields = Object.keys(read?.thread ?? {}).sort();
  report.host_thread_cwd_matches_selected_root = read?.thread?.cwd === sourceRepo;
  report.host_thread_exposes_dynamic_tools = Object.hasOwn(read?.thread ?? {}, "dynamicTools");
  report.host_thread_extra_fields = read?.thread?.extra && typeof read.thread.extra === "object"
    ? Object.keys(read.thread.extra).sort() : [];
  assert.equal(readFileSync(sentinel, "utf8"), "ARE_JOIN_OK");
  assert.equal(journal.inspect().unsettled, 0);
  report.status = "PASS";
  report.local_provider_requests = providerCalls;
  report.broker_effect_completed = true;
  if (resumeProbe) {
    await transport.close(); transport = null;
    await gateway.close(); gateway = null;
    const resumedTransport = spawnAppServerRpcTransport({command: binary,
      args: ["app-server", "--stdio"], env: {...process.env, CODEX_HOME: codexHome},
      spawn_impl: (command, args, options) => spawn(command, args, {...options,
        cwd: sourceRepo, windowsHide: true})});
    const resumedRpc = createAppServerRpcClient({transport: resumedTransport,
      request_timeout_ms: 30000, completion_timeout_ms: 30000});
    try {
      await resumedRpc.initialize({clientInfo: {name: "are_native_hosted_resume_probe", version: "1.0.0"},
        capabilities: {experimentalApi: true}});
      await resumedRpc.notify("initialized", {});
      const beforeResume = await resumedRpc.request("thread/read", {threadId: thread.thread.id,
        includeTurns: true});
      report.pre_resume_read_cwd_matches_selected_root = beforeResume?.thread?.cwd === sourceRepo;
      report.pre_resume_read_thread_id_matches = beforeResume?.thread?.id === thread.thread.id;
      const resumed = await resumedRpc.request("thread/resume", {threadId: thread.thread.id,
        approvalPolicy: "on-request", sandbox: "read-only",
        ...(resumeRevokeProbe ? {dynamicTools: []} : {}),
        ...(resumeReplaceProbe ? {dynamicTools: [{type: "function", name: "are_deactivated_notice",
          description: "Test-only marker with no implementation or effect handler.",
          inputSchema: {type: "object", properties: {}, additionalProperties: false}}]} : {})});
      report.resumed_thread_fields = Object.keys(resumed?.thread ?? {}).sort();
      report.resumed_thread_cwd_matches_selected_root = resumed?.thread?.cwd === sourceRepo;
      report.resumed_thread_exposes_dynamic_tools = Object.hasOwn(resumed?.thread ?? {}, "dynamicTools");
      const continuation = await resumedRpc.runTurn({threadId: thread.thread.id,
        input: [{type: "text", text: "Continue the fixed resume probe without using tools."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}});
      assert.equal(continuation.completed?.turn?.status, "completed", "canary.resume-turn-not-completed");
      report.resumed_tool_advertised = report.resumed_model_tool_names?.includes(HOSTED_EFFECT_TOOL_NAME) === true;
      if (resumeRevokeProbe) {
        assert.equal(report.resumed_tool_advertised, true,
          "canary.pinned-host-empty-resume-tool-behavior-changed");
        report.resumed_tool_revocation = "UNAVAILABLE_EMPTY_LIST_IGNORED";
      }
      if (resumeReplaceProbe) {
        assert.equal(report.resumed_tool_advertised, true,
          "canary.pinned-host-replacement-resume-tool-behavior-changed");
        assert.equal(report.resumed_model_tool_names?.includes("are_deactivated_notice"), false,
          "canary.pinned-host-replacement-tool-behavior-changed");
        report.resumed_tool_revocation = "UNAVAILABLE_REPLACEMENT_IGNORED";
      }
    } finally { await resumedRpc.close(); }
  }
} catch (error) {
  report.reason = typeof error?.message === "string" ? error.message.slice(0, 256) : "canary.failed";
  process.exitCode = 1;
} finally {
  await browserHost?.close().catch(() => {});
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  journal?.close();
  store?.close();
  if (provider) await new Promise(done => provider.close(done));
  if (root) rmSync(root, {recursive: true, force: true});
}
process.stdout.write(`${JSON.stringify(report)}\n`);
