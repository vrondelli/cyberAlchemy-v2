#!/usr/bin/env node
// Disposable, loopback-only App Server start/restart/resume model-tool catalog probe.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes, randomUUID} from "node:crypto";
import {once} from "node:events";
import {appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../src/rpc-client.mjs";
import {connectGatewayRpcTransport, createCodexGatewayBackendAdapter,
  createFileGatewaySessionStore, createPersistentGateway} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";
import {HOSTED_EFFECT_TOOL_NAME} from "../src/host-method-policy.mjs";
import {hostedMcpHookProfile, hostedMcpHookTrustPosture} from "../src/hosted-hook-profile.mjs";
import {preflightRestrictedHostHome, verifyRestrictedHostProfile} from "../src/restricted-host-profile.mjs";

const fixtureServer = resolve(import.meta.dirname, "fixtures/mcp-hook-transport-server.mjs");
const compactionCrashChild = resolve(import.meta.dirname,
  "fixtures/compaction-gateway-crash-child.mjs");
const [binary, expectedVersion, mode = "lifecycle"] = process.argv.slice(2);
const relayModes = new Set(["managed-relay-startup", "managed-relay-turn", "managed-hook-drift-turn"]);
const nativeCompactionMode = ["native-compaction-probe",
  "native-compaction-gateway-recovery-probe",
  "native-compaction-gateway-crash-probe"].includes(mode);
const selectedCheckout = resolve(import.meta.dirname, "../../../../..");
const extractedPackageRoot = process.env.ARE_RESTRICTED_CANARY_PACKAGE_ROOT
  ? resolve(process.env.ARE_RESTRICTED_CANARY_PACKAGE_ROOT) : null;
const guardedEffectMode = ["managed-wire-guard-effect-decline-turn",
  "managed-wire-guard-effect-accept-turn",
  "managed-wire-guard-inflight-crash-turn"].includes(mode);
const hostedMode = ["managed-hosted-startup", "managed-hosted-turn", "managed-hosted-effect-turn",
  "managed-hosted-restart-turn", "managed-hosted-crash-restart-turn",
  "managed-hosted-inflight-crash-turn"].includes(mode) || guardedEffectMode;
const guardedMode = ["managed-wire-guard-turn", "managed-wire-guard-two-turn",
  "managed-wire-guard-user-input-turn",
  "managed-wire-guard-compaction-turn",
  "managed-wire-guard-restart-turn", "managed-wire-guard-client-crash-turn",
  "managed-wire-guard-fault-turn", "managed-wire-guard-midstream-fault-turn"].includes(mode)
  || guardedEffectMode;
const nativeGuardedTextMode = guardedMode && !hostedMode
  && (process.platform === "win32" || mode === "managed-wire-guard-user-input-turn");
const guardedRestartMode = ["managed-wire-guard-restart-turn",
  "managed-wire-guard-client-crash-turn", "managed-wire-guard-fault-turn"].includes(mode);
const report = {schema_version: "are.restricted-lifecycle-canary/v1", status: "FAIL", mode,
  authority_effect: "none", current_desktop_task_touched: false, external_model_calls: 0};
const providerRequests = [];
let root, provider, active, managed, recoveryGateway, recoveryTransport, recoveryRpc,
  recoveryStore, crashChild, crashBackendPid, crashStorePath;
let crashChildOutput = "", crashChildErrors = "";

function sse(id, text) {
  const item = {id: `msg_${id}`, type: "message", role: "assistant", status: "completed",
    content: [{type: "output_text", text, annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function sseToolCall(id, inFlight = false) {
  const item = {id: `fc_${id}`, type: "function_call", call_id: "managed_hosted_effect_call_1",
    name: HOSTED_EFFECT_TOOL_NAME, arguments: JSON.stringify({kind: "command",
      proposal: {command: [process.execPath, "-e",
        inFlight ? "setTimeout(() => process.stdout.write('ARE_MANAGED_HOSTED_LATE'), 20000)"
          : "process.stdout.write('ARE_MANAGED_HOSTED_OK')"], cwd: selectedCheckout}}), status: "completed"};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function sseUserInputCall(id) {
  const item = {id: `fc_${id}`, type: "function_call", call_id: "managed_guarded_input_call_1",
    name: "request_user_input", arguments: JSON.stringify({questions: [{id: "choice",
      header: "Fixture choice", question: "Continue the isolated guarded ARE canary?",
      options: [{label: "Continue", description: "Complete the fixed local test."}]}]}),
    status: "completed"};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

async function closeClient(instance) {
  if (!instance) return;
  await instance.rpc.close().catch(() => {});
  const child = instance.child;
  if (child.exitCode !== null || child.signalCode !== null) return;
  await Promise.race([once(child, "close").catch(() => {}),
    new Promise(done => setTimeout(done, 3000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "close").catch(() => {}),
      new Promise(done => setTimeout(done, 3000))]);
  }
  assert.ok(child.exitCode !== null || child.signalCode !== null,
    "canary.app-server-did-not-exit");
}

async function openClient(codexHome, cwd) {
  let child;
  const transport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--stdio"],
    env: {...process.env, CODEX_HOME: codexHome},
    spawn_impl: (command, args, options) => {
      child = spawn(command, args, {...options, cwd, windowsHide: true});
      return child;
    }});
  const rpc = createAppServerRpcClient({transport, request_timeout_ms: 15000,
    completion_timeout_ms: 30000});
  try {
    await rpc.initialize({clientInfo: {name: "are_restricted_lifecycle_canary", version: "1.0.0"}});
    await rpc.notify("initialized", {});
    return {rpc, child};
  } catch (error) {
    await closeClient({rpc, child});
    throw error;
  }
}

try {
  assert.ok(binary && expectedVersion && ["lifecycle", "managed-startup", "managed-hosted-startup", "managed-relay-startup",
    "managed-turn", "managed-hosted-turn", "managed-hosted-effect-turn", "managed-hosted-restart-turn",
    "managed-hosted-crash-restart-turn", "managed-hosted-inflight-crash-turn",
    "managed-relay-turn", "managed-hook-drift-turn", "managed-drift-turn", "managed-wire-guard-turn",
    "managed-wire-guard-user-input-turn",
    "managed-wire-guard-two-turn", "managed-wire-guard-compaction-turn", "managed-wire-guard-restart-turn",
    "managed-wire-guard-client-crash-turn", "managed-wire-guard-fault-turn",
    "managed-wire-guard-midstream-fault-turn",
    "managed-wire-guard-effect-decline-turn", "managed-wire-guard-effect-accept-turn",
    "managed-wire-guard-inflight-crash-turn",
    "managed-invalid-profile", "managed-unapproved-mcp", "native-compaction-probe",
    "native-compaction-gateway-recovery-probe",
    "native-compaction-gateway-crash-probe"].includes(mode),
  "usage: restricted-lifecycle-canary.mjs <installed-codex> <exact-version> [lifecycle|native-compaction-probe|native-compaction-gateway-recovery-probe|native-compaction-gateway-crash-probe|managed-*]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  if (extractedPackageRoot) {
    assert.equal(process.platform, "win32", "canary.package-runtime-windows-only");
    assert.ok(["managed-wire-guard-turn", "managed-wire-guard-user-input-turn"].includes(mode),
      "canary.package-runtime-guarded-turn-only");
    const extractionRoot = resolve(extractedPackageRoot, "../../../../../..");
    assert.equal(extractedPackageRoot, resolve(extractionRoot,
      "are/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper"),
    "canary.package-runtime-layout-invalid");
    assert.equal(resolve(process.execPath).toLowerCase(),
      resolve(extractionRoot, "node/node.exe").toLowerCase(),
    "canary.package-node-not-adjacent");
    assert.ok(existsSync(resolve(extractionRoot, "are-companion.exe"))
      && existsSync(resolve(extractedPackageRoot, "bin/are-managed-session.mjs"))
      && existsSync(resolve(extractedPackageRoot, "profiles/interaction-learning-canary-v1.json")),
    "canary.package-runtime-incomplete");
  }
  if (mode === "managed-wire-guard-user-input-turn") assert.ok(
    process.platform === "win32" || process.platform === "linux",
    "canary.guarded-user-input-requires-native-desktop");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  report.runtime_origin = extractedPackageRoot ? "adjacent-extracted-package" : "source-checkout";

  root = mkdtempSync(join(tmpdir(), "are-restricted-lifecycle-"));
  const state = join(root, "state");
  const codexHome = join(state, "codex-home");
  mkdirSync(codexHome, {recursive: true, mode: 0o700});
  const fixtureLog = join(root, "unused-mcp-events.jsonl");
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
      const names = (body.tools ?? []).map(item => item.name).filter(Boolean);
      providerRequests.push({tool_names: names});
      assert.ok(providerRequests.length <= (mode === "managed-wire-guard-compaction-turn" ? 5
        : ["managed-hosted-effect-turn", "managed-hosted-inflight-crash-turn",
        "managed-hosted-restart-turn",
        "managed-hosted-crash-restart-turn", "managed-wire-guard-two-turn",
        "managed-wire-guard-user-input-turn",
        "managed-wire-guard-restart-turn", "managed-wire-guard-client-crash-turn",
        "managed-wire-guard-fault-turn"].includes(mode)
        || guardedEffectMode || nativeCompactionMode ? 4
        : mode.endsWith("-turn") ? 3 : 2),
        "canary.unexpected-provider-request");
      response.writeHead(200, {"content-type": "text/event-stream"});
      if (mode === "managed-wire-guard-midstream-fault-turn" && providerRequests.length === 3) {
        response.once("close", () => { report.managed_midstream_provider_closed = true; });
        response.write("event: response.created\ndata: {\"type\":\"response.created\"}\n\n");
        report.managed_midstream_provider_open = true;
        return;
      }
      if ((["managed-hosted-effect-turn", "managed-hosted-inflight-crash-turn"].includes(mode)
        || guardedEffectMode) && providerRequests.length === 3) {
        assert.ok(names.includes(HOSTED_EFFECT_TOOL_NAME), "canary.managed-effect-tool-not-advertised");
        response.end(sseToolCall("resp_are_managed_effect",
          ["managed-hosted-inflight-crash-turn",
            "managed-wire-guard-inflight-crash-turn"].includes(mode)));
      } else if (mode === "managed-wire-guard-user-input-turn" && providerRequests.length === 3) {
        assert.deepEqual(names, ["request_user_input"], "canary.guarded-user-input-tool-not-exclusive");
        response.end(sseUserInputCall("resp_are_managed_user_input"));
      } else {
        if (mode === "managed-wire-guard-user-input-turn" && providerRequests.length === 4) {
          const outputs = (body.input ?? []).filter(item => item.type === "function_call_output"
            && item.call_id === "managed_guarded_input_call_1");
          report.guarded_user_input_answer_observed = outputs.some(item => String(item.output).includes("Continue"));
          assert.equal(report.guarded_user_input_answer_observed, true,
            "canary.guarded-user-input-answer-not-returned-to-model");
        }
        if (["managed-hosted-inflight-crash-turn",
          "managed-wire-guard-inflight-crash-turn"].includes(mode)
          && providerRequests.length === 4) {
          report.managed_inflight_early_tool_output = (body.input ?? []).filter(item =>
            item.type === "function_call_output" && item.call_id === "managed_hosted_effect_call_1")
            .map(item => String(item.output).slice(0, 1024));
        }
        if (mode === "managed-hosted-effect-turn" && providerRequests.length === 4) {
          report.managed_effect_tool_output = (body.input ?? []).filter(item =>
            item.type === "function_call_output" && item.call_id === "managed_hosted_effect_call_1")
            .map(item => String(item.output).slice(0, 1024));
          report.managed_effect_model_result_observed = (body.input ?? []).some(item =>
            item.type === "function_call_output" && item.call_id === "managed_hosted_effect_call_1"
              && String(item.output).includes('"ok":true')
              && String(item.output).includes("ARE_MANAGED_HOSTED_OK"));
          assert.equal(report.managed_effect_model_result_observed, true,
            "canary.managed-effect-result-not-returned-to-model");
          delete report.managed_effect_tool_output;
        }
        if (guardedEffectMode && mode !== "managed-wire-guard-inflight-crash-turn"
          && providerRequests.length === 4) {
          const outputs = (body.input ?? []).filter(item => item.type === "function_call_output"
            && item.call_id === "managed_hosted_effect_call_1");
          assert.equal(outputs.length, 1, "canary.managed-guard-effect-output-missing");
          const succeeded = String(outputs[0].output).includes("ARE_MANAGED_HOSTED_OK")
            && String(outputs[0].output).includes('"ok":true');
          assert.equal(succeeded, mode === "managed-wire-guard-effect-accept-turn",
            "canary.managed-guard-effect-outcome-mismatch");
          report.managed_guard_effect_result_observed = true;
        }
        response.end(sse(`resp_are_lifecycle_${providerRequests.length}`,
          `ARE_RESTRICTED_LIFECYCLE_${providerRequests.length}`));
      }
    } catch (error) {
      report.provider_error = error.message;
      if (!response.headersSent) response.writeHead(500);
      response.end("fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  const configPath = join(codexHome, "config.toml");
  const baseConfig =
    `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n` +
    `[features]\nshell_tool = false\nunified_exec = false\napps = false\n` +
    `multi_agent = false\ngoals = false\nplugins = false\nremote_plugin = false\n` +
    `[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\n` +
    `base_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\n` +
    `request_max_retries = 0\nstream_max_retries = 0\n`;
  const fixtureMcpConfig =
    `[mcp_servers.are_mcp_hook_fixture]\ncommand = ${JSON.stringify(process.execPath)}\n` +
    `args = ${JSON.stringify([fixtureServer, "restricted-catalog", fixtureLog])}\n` +
    `required = true\nenabled_tools = ["intercept_fixture_tool"]\n` +
    `startup_timeout_sec = 10\ntool_timeout_sec = 10\n`;
  writeFileSync(configPath, baseConfig + fixtureMcpConfig, {mode: 0o600});
  preflightRestrictedHostHome(state, codexHome);
  await verifyRestrictedHostProfile({codexCommand: binary, codexHome, cwd: root,
    expectedMcpServers: [{name: "are_mcp_hook_fixture", command: process.execPath,
      args: [fixtureServer, "restricted-catalog", fixtureLog], tools: ["intercept_fixture_tool"]}]});

  active = await openClient(codexHome, root);
  const started = await active.rpc.startThread({cwd: root, model: "are-fixture"});
  const threadId = started?.thread?.id;
  assert.ok(typeof threadId === "string" && threadId.length > 0,
    "canary.thread-start-id-missing");
  const first = await active.rpc.runTurn({threadId,
    input: [{type: "text", text: "Say the fixed first fixture response."}],
    approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
  assert.match(first.text, /ARE_RESTRICTED_LIFECYCLE_1/,
    "canary.first-turn-not-completed");
  await closeClient(active); active = null;

  active = await openClient(codexHome, root);
  const resumed = await active.rpc.request("thread/resume", {threadId}, {timeout_ms: 15000});
  assert.equal(resumed?.thread?.id, threadId, "canary.resume-thread-identity-mismatch");
  const second = await active.rpc.runTurn({threadId,
    input: [{type: "text", text: "Say the fixed second fixture response."}],
    approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
  assert.match(second.text, /ARE_RESTRICTED_LIFECYCLE_2/,
    "canary.second-turn-not-completed");

  assert.equal(report.provider_error, undefined, "canary.provider-failed");
  assert.equal(providerRequests.length, 2, "canary.expected-two-model-requests");
  const before = providerRequests[0].tool_names;
  const after = providerRequests[1].tool_names;
  const forbidden = ["exec_command", "write_stdin", "apply_patch", "shell_command",
    "command/exec", "command/exec/write", "thread/shellCommand"];
  assert.ok(forbidden.every(name => !before.includes(name) && !after.includes(name)),
    "canary.native-effect-tool-advertised");
  assert.ok(before.includes("mcp__are_mcp_hook_fixture"),
    "canary.required-mcp-server-tool-not-advertised");
  assert.deepEqual(after, before, "canary.catalog-drift-after-resume");
  assert.equal(existsSync(fixtureLog), false, "canary.fixture-tool-was-invoked");
  report.model_turns = 2;
  report.tool_names_before_restart = before;
  report.tool_names_after_resume = after;
  if (nativeCompactionMode && mode !== "native-compaction-gateway-crash-probe") {
    const compactionNotifications = [];
    let compactTurnId = null;
    active.rpc.events.on("notification", message => {
      if (message.params?.threadId === threadId && compactionNotifications.length < 32) {
        compactionNotifications.push({method: message.method,
          turn_id: message.params?.turnId ?? message.params?.turn?.id ?? null,
          item_type: message.params?.item?.type ?? null});
      }
    });
    try {
      const acknowledged = await active.rpc.request("thread/compact/start", {threadId},
        {timeout_ms: 15000});
      assert.deepEqual(acknowledged, {}, "canary.native-compaction-ack-shape-drift");
      report.native_compaction_request = "ACKNOWLEDGED";
      try {
        const event = await active.rpc.waitForNotification(message =>
          message.method === "item/completed"
            && message.params?.threadId === threadId
            && message.params?.item?.type === "contextCompaction", {timeout_ms: 30000});
        report.native_compaction_event = event.method;
        report.native_compaction_item_status = event.params.item.status ?? null;
        report.native_compaction_item_keys = Object.keys(event.params.item).sort();
        report.native_compaction_new_turn = typeof event.params.turnId === "string"
          && event.params.turnId.length > 0
          && event.params.turnId !== second.started?.turn?.id;
        compactTurnId = event.params.turnId;
        assert.equal(report.native_compaction_new_turn, true,
          "canary.native-compaction-turn-not-distinct");
        const completed = await active.rpc.waitForNotification(message =>
          message.method === "turn/completed"
            && message.params?.threadId === threadId
            && message.params?.turn?.id === event.params.turnId, {timeout_ms: 15000});
        report.native_compaction_turn_status = completed.params.turn.status;
        assert.equal(report.native_compaction_turn_status, "completed",
          "canary.native-compaction-turn-not-completed");
      } catch (error) {
        report.native_compaction_event = "NOT_OBSERVED_WITHIN_BOUND";
        report.native_compaction_event_error = error.code ?? "unknown";
      }
    } catch (error) {
      report.native_compaction_request = "REFUSED_OR_FAILED";
      report.native_compaction_error = {code: error.code ?? "unknown",
        rpc_code: error.details?.code ?? null,
        message: String(error.details?.message ?? error.message).slice(0, 256)};
    }
    report.native_compaction_provider_requests = providerRequests.length - 2;
    report.native_compaction_notifications = compactionNotifications;
    report.native_compaction_tool_names = providerRequests[2]?.tool_names ?? null;
    report.native_compaction_tool_free = providerRequests.length === 3
      && providerRequests[2].tool_names.length === 0;
    report.native_compaction_provider_error = report.provider_error ?? null;
    assert.equal(report.native_compaction_request, "ACKNOWLEDGED",
      "canary.native-compaction-request-not-acknowledged");
    assert.equal(report.native_compaction_event, "item/completed",
      "canary.native-compaction-event-not-observed");
    assert.equal(report.native_compaction_tool_free, true,
      "canary.native-compaction-tool-catalog-not-empty");
    assert.equal(report.native_compaction_provider_error, null,
      "canary.native-compaction-provider-failed");
    const history = await active.rpc.request("thread/read", {threadId, includeTurns: true},
      {timeout_ms: 15000});
    const compactHistoryTurn = history?.thread?.turns?.find(turn => turn?.id === compactTurnId);
    report.native_compaction_history = {
      turn_found: Boolean(compactHistoryTurn),
      turn_status: compactHistoryTurn?.status ?? null,
      item_types: Array.isArray(compactHistoryTurn?.items)
        ? compactHistoryTurn.items.map(item => item?.type ?? null) : null,
      items_view: compactHistoryTurn?.itemsView ?? null,
    };
    const postCompaction = await active.rpc.runTurn({threadId,
      input: [{type: "text", text: "Say the fixed fourth fixture response."}],
      approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
    assert.match(postCompaction.text, /ARE_RESTRICTED_LIFECYCLE_4/,
      "canary.post-compaction-turn-not-completed");
    assert.deepEqual(providerRequests[3]?.tool_names, after,
      "canary.post-compaction-catalog-drift");
    report.post_compaction_turn = "COMPLETED";
    report.post_compaction_catalog_restored = true;
    report.model_turns = 3;
    if (mode === "native-compaction-gateway-recovery-probe") {
      assert.ok(compactTurnId, "canary.recovery-compaction-turn-id-missing");
      assert.equal(compactHistoryTurn?.status, "completed",
        "canary.recovery-compaction-history-not-completed");
      assert.equal(compactHistoryTurn?.itemsView, "full",
        "canary.recovery-compaction-history-not-full");
      assert.ok(compactHistoryTurn.items.some(item => item?.type === "contextCompaction"),
        "canary.recovery-compaction-item-missing");
      await closeClient(active); active = null;

      const consumerId = "codex:disposable-native-compaction-recovery";
      const resumeToken = randomBytes(32).toString("hex");
      const connectionToken = randomBytes(32).toString("hex");
      const requestKey = "native-compaction:seeded-accepted-receipt";
      const requestParams = {threadId};
      const bindingDigest = digestValue({method: "thread/compact/start", params: requestParams});
      const response = {jsonrpc: "2.0", id: 1, result: {}};
      const threadRef = `backend-thread:${digestValue(threadId)}`;
      const storePath = join(state, "recovery-session.jsonl");
      recoveryStore = createFileGatewaySessionStore({path: storePath,
        store_id: "are-native-compaction-recovery-canary"});
      const append = (event_kind, content) => assert.equal(recoveryStore.append({event_kind,
        consumer_id: consumerId, content}).ok, true,
      `canary.recovery-store-${event_kind}-failed`);
      append("session-started", {lane: "interaction-bound",
        backend_adapter_id: "codex-app-server/v1",
        resume_token_digest: digestValue(resumeToken)});
      append("thread-bound", {thread_ref: threadRef});
      append("dispatch-intent", {request_key: requestKey, method: "thread/compact/start",
        binding_digest: bindingDigest, thread_ref: threadRef});
      append("dispatch-outcome", {request_key: requestKey, response,
        response_digest: digestValue(response)});
      const accepted = {kind: "compaction-turn-accepted", thread_ref: threadRef,
        turn_ref: digestValue(compactTurnId), request_key_digest: digestValue(requestKey),
        request_digest: bindingDigest, response_digest: digestValue(response),
        event_digest: digestValue("seeded-from-real-native-compaction-history")};
      append("host-observation", {observation: {...accepted,
        observation_digest: digestValue(accepted)}});
      assert.equal(recoveryStore.compact().ok, true,
        "canary.recovery-store-compaction-failed");
      recoveryStore.close(); recoveryStore = null;
      recoveryStore = createFileGatewaySessionStore({path: storePath,
        store_id: "are-native-compaction-recovery-canary"});
      const socketPath = process.platform === "win32"
        ? `\\\\.\\pipe\\are-native-compact-${randomUUID()}` : join(root, "recovery-gateway.sock");
      recoveryGateway = createPersistentGateway({listen_path: socketPath,
        runtime_epoch_id: "are-native-compaction-recovery-canary",
        backend: {command: binary, args: ["app-server", "--stdio"]},
        backend_adapter: createCodexGatewayBackendAdapter(), session_store: recoveryStore,
        expected_codex_version: expectedVersion, connection_token: connectionToken,
        spawn_impl: (command, args, options) => spawn(command, args, {...options,
          cwd: root, env: {...process.env, CODEX_HOME: codexHome}, windowsHide: true}),
        wrapper_factory: () => ({
          processClientMessage: async message => ({to_server: [message], to_client: []}),
          processServerMessage: async message => ({to_server: [], to_client: [message]}),
        })});
      await recoveryGateway.start();
      recoveryTransport = connectGatewayRpcTransport({socket_path: socketPath,
        connection_token: connectionToken, consumer_id: consumerId,
        lane: "interaction-bound", resume_token: resumeToken,
        expected_backend_adapter_id: "codex-app-server/v1"});
      await recoveryTransport.ready;
      recoveryRpc = createAppServerRpcClient({transport: recoveryTransport,
        request_timeout_ms: 30000});
      await recoveryRpc.initialize({clientInfo: {name: "are_compaction_recovery_canary",
        version: "1.0.0"}});
      await recoveryRpc.notify("initialized", {});
      const recovered = await recoveryRpc.request("thread/resume", {threadId,
        approvalPolicy: "on-request", sandbox: "read-only"},
        {idempotency_key: "resume:after-seeded-compaction-history", timeout_ms: 30000});
      assert.equal(recovered?.thread?.id, threadId,
        "canary.recovery-resume-thread-identity-mismatch");
      const durable = recoveryStore.getSession(consumerId);
      assert.ok(durable.host_observations.some(entry => entry.kind === "compaction-history-verified"
        && entry.thread_ref === threadRef && entry.turn_ref === digestValue(compactTurnId)),
      "canary.recovery-history-proof-not-durable");
      assert.deepEqual(durable.pending_history_audits, [],
        "canary.recovery-left-pending-history-audit");
      assert.equal(providerRequests.length, 4,
        "canary.recovery-caused-an-extra-model-call");
      report.gateway_compaction_recovery = "REAL_NATIVE_HISTORY_VERIFIED_AND_RESUMED";
      report.gateway_recovery_seeded_acceptance = true;
      report.gateway_recovery_process_kill_tested = false;
      report.gateway_recovery_external_model_calls = 0;
    }
  }
  if (mode === "native-compaction-gateway-crash-probe") {
    await closeClient(active); active = null;
    const consumerId = "codex:disposable-native-compaction-crash";
    const resumeToken = randomBytes(32).toString("hex");
    const connectionToken = randomBytes(32).toString("hex");
    const storeId = "are-native-compaction-crash-canary";
    const storePath = join(state, "crash-session.jsonl");
    crashStorePath = storePath;
    const socketPath = process.platform === "win32"
      ? `\\\\.\\pipe\\are-native-crash-${randomUUID()}` : join(root, "crash-gateway.sock");
    recoveryStore = createFileGatewaySessionStore({path: storePath, store_id: storeId});
    assert.equal(recoveryStore.append({event_kind: "session-started", consumer_id: consumerId,
      content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
        resume_token_digest: digestValue(resumeToken)}}).ok, true);
    recoveryStore.close(); recoveryStore = null;

    crashChild = spawn(process.execPath, [compactionCrashChild, JSON.stringify({binary,
      expectedVersion, codexHome, cwd: root, storePath, storeId, socketPath,
      connectionToken})], {cwd: root, windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]});
    crashChild.stdout.on("data", chunk => { crashChildOutput += chunk.toString("utf8"); });
    crashChild.stderr.on("data", chunk => { crashChildErrors += chunk.toString("utf8"); });
    const readyDeadline = Date.now() + 10000;
    while (!crashChildOutput.includes("READY\n") && crashChild.exitCode === null
      && crashChild.signalCode === null && Date.now() < readyDeadline) {
      await new Promise(done => setTimeout(done, 20));
    }
    assert.ok(crashChildOutput.includes("READY\n"),
      `canary.crash-child-not-ready:${crashChildErrors.slice(-300)}`);
    recoveryTransport = connectGatewayRpcTransport({socket_path: socketPath,
      connection_token: connectionToken, consumer_id: consumerId,
      lane: "interaction-bound", resume_token: resumeToken,
      expected_backend_adapter_id: "codex-app-server/v1"});
    await recoveryTransport.ready;
    recoveryRpc = createAppServerRpcClient({transport: recoveryTransport,
      request_timeout_ms: 45000});
    await recoveryRpc.initialize({clientInfo: {name: "are_compaction_crash_canary",
      version: "1.0.0"}});
    await recoveryRpc.notify("initialized", {});
    const gatewayStarted = await recoveryRpc.startThread({cwd: root, model: "are-fixture",
      approvalPolicy: "on-request", sandbox: "read-only"},
    {idempotency_key: "thread:before-real-process-crash", timeout_ms: 45000});
    const crashThreadId = gatewayStarted?.thread?.id;
    assert.ok(typeof crashThreadId === "string" && crashThreadId.length > 0,
      "canary.crash-child-thread-not-created");
    const gatewayTurn = await recoveryRpc.runTurn({threadId: crashThreadId,
      input: [{type: "text", text: "Say the fixed third fixture response."}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}},
    {idempotency_key: "turn:before-real-process-crash"});
    assert.match(gatewayTurn.text, /ARE_RESTRICTED_LIFECYCLE_3/,
      "canary.crash-child-turn-not-completed");
    report.model_turns = 3;
    const childClosed = once(crashChild, "close");
    const compactResult = recoveryRpc.request("thread/compact/start",
      {threadId: crashThreadId},
      {idempotency_key: "compact:real-process-crash", timeout_ms: 15000})
      .then(() => ({status: "acknowledged"}), error => ({status: "rejected",
        reason: String(error?.details?.message ?? error?.message).slice(0, 200),
        reason_codes: error?.details?.data?.reason_codes ?? null}));
    const compactFirst = await Promise.race([compactResult,
      childClosed.then(() => ({status: "child-exited"}))]);
    report.gateway_compact_start_transport = compactFirst.status;
    if (compactFirst.status === "rejected") {
      await new Promise(done => setTimeout(done, 300));
      if (crashChild.exitCode === null && crashChild.signalCode === null) {
        report.gateway_crash_debug_events = readFileSync(storePath, "utf8")
          .split("\n").filter(Boolean).map(line => {
            const record = JSON.parse(line);
            return [record.event_kind, record.content?.observation?.kind ?? null,
              record.content?.delivery?.message?.method ?? null,
              record.content?.delivery?.message?.error?.message ?? null,
              record.content?.delivery?.message?.error?.data?.reason_codes ?? null,
              record.content?.response?.error?.message ?? null];
          });
        throw new Error(`canary.crash-request-rejected-before-kill:${JSON.stringify(compactFirst)}:${crashChildErrors.slice(-700)}`);
      }
    }
    await Promise.race([childClosed,
      new Promise((_, reject) => setTimeout(() => reject(new Error(
        `canary.crash-child-did-not-exit:${JSON.stringify(compactFirst)}:${crashChildErrors.slice(-300)}:${crashChildOutput.slice(-300)}`)), 30000))]);
    await compactResult;
    assert.ok(crashChild.exitCode !== 0 || crashChild.signalCode !== null,
      "canary.crash-child-exited-cleanly");
    const pidMatch = crashChildOutput.match(/BACKEND_PID:(\d+)/);
    assert.ok(pidMatch, `canary.crash-backend-pid-missing:${crashChildErrors.slice(-300)}`);
    crashBackendPid = Number(pidMatch[1]);
    report.gateway_process_interrupted = true;
    report.gateway_crash_at = "AFTER_DURABLE_COMPACTION_ACCEPTANCE";
    const survivingClientCursor = recoveryTransport.inspect().last_acked_sequence;
    report.gateway_surviving_client_cursor = survivingClientCursor;
    await recoveryRpc.close().catch(() => {}); recoveryRpc = null;
    await recoveryTransport.close().catch(() => {}); recoveryTransport = null;

    recoveryStore = createFileGatewaySessionStore({path: storePath, store_id: storeId});
    const interrupted = recoveryStore.getSession(consumerId);
    report.crash_interrupted_delivery_state = {
      acknowledged_through: interrupted.acknowledged_through,
      sequences: interrupted.deliveries.map(delivery => delivery.sequence),
    };
    const compactObservations = interrupted.host_observations.filter(entry =>
      entry.kind === "compaction-turn-accepted");
    assert.equal(compactObservations.length, 1,
      "canary.crash-acceptance-not-exact");
    const accepted = compactObservations[0];
    assert.equal(interrupted.host_observations.some(entry =>
      entry.turn_ref === accepted.turn_ref
        && ["compaction-item-completed", "turn-completion-observed",
          "compaction-history-verified"].includes(entry.kind)), false,
    "canary.crash-terminal-evidence-was-recorded");
    assert.ok(interrupted.requests.some(request => request.method === "thread/compact/start"
      && request.status === "complete"), "canary.crash-compaction-ack-not-durable");
    recoveryStore.close(); recoveryStore = null;

    const hostExitDeadline = Date.now() + 5000;
    while (Date.now() < hostExitDeadline) {
      try { process.kill(crashBackendPid, 0); }
      catch (error) { if (error?.code === "ESRCH") break; throw error; }
      await new Promise(done => setTimeout(done, 50));
    }
    try { process.kill(crashBackendPid, "SIGTERM"); }
    catch (error) { if (error?.code !== "ESRCH") throw error; }
    await new Promise(done => setTimeout(done, 250));
    try { process.kill(crashBackendPid, 0);
      process.kill(crashBackendPid, "SIGKILL"); }
    catch (error) { if (error?.code !== "ESRCH") throw error; }
    const terminatedDeadline = Date.now() + 3000;
    let oldBackendGone = false;
    while (Date.now() < terminatedDeadline) {
      try { process.kill(crashBackendPid, 0); }
      catch (error) {
        if (error?.code === "ESRCH") { oldBackendGone = true; break; }
        throw error;
      }
      await new Promise(done => setTimeout(done, 50));
    }
    assert.equal(oldBackendGone, true, "canary.crashed-gateway-backend-still-live");
    crashBackendPid = null;
    report.crashed_gateway_backend_terminated = true;

    active = await openClient(codexHome, root);
    const realHistory = await active.rpc.request("thread/read",
      {threadId: crashThreadId, includeTurns: true}, {timeout_ms: 15000});
    const matchingTurns = (realHistory?.thread?.turns ?? []).filter(turn =>
      turn?.status === "completed" && turn?.itemsView === "full"
        && turn.items?.some(item => item?.type === "contextCompaction"));
    assert.equal(matchingTurns.length, 1,
      "canary.crash-compaction-not-in-real-native-history");
    assert.equal(digestValue(matchingTurns[0].id), accepted.turn_ref,
      "canary.crash-history-turn-mismatch");
    await closeClient(active); active = null;

    recoveryStore = createFileGatewaySessionStore({path: storePath, store_id: storeId});
    recoveryGateway = createPersistentGateway({listen_path: socketPath,
      runtime_epoch_id: "are-native-compaction-crash-recovery",
      backend: {command: binary, args: ["app-server", "--stdio"]},
      backend_adapter: createCodexGatewayBackendAdapter(), session_store: recoveryStore,
      expected_codex_version: expectedVersion, connection_token: connectionToken,
      spawn_impl: (command, args, options) => spawn(command, args, {...options,
        cwd: root, env: {...process.env, CODEX_HOME: codexHome}, windowsHide: true}),
      wrapper_factory: () => ({
        processClientMessage: async message => ({to_server: [message], to_client: []}),
        processServerMessage: async message => ({to_server: [], to_client: [message]}),
      })});
    await recoveryGateway.start();
    recoveryTransport = connectGatewayRpcTransport({socket_path: socketPath,
      connection_token: connectionToken, consumer_id: consumerId,
      lane: "interaction-bound", resume_token: resumeToken,
      last_acked_sequence: survivingClientCursor,
      request_aliases: [{request_key: "compact:real-process-crash",
        client_id: "canary:crashed-compaction-ack"}],
      expected_backend_adapter_id: "codex-app-server/v1"});
    await recoveryTransport.ready;
    recoveryRpc = createAppServerRpcClient({transport: recoveryTransport,
      request_timeout_ms: 30000});
    await recoveryRpc.initialize({clientInfo: {name: "are_compaction_crash_canary",
      version: "1.0.0"}});
    await recoveryRpc.notify("initialized", {});
    const recovered = await recoveryRpc.request("thread/resume", {threadId: crashThreadId,
      approvalPolicy: "on-request", sandbox: "read-only"},
    {idempotency_key: "resume:after-real-gateway-crash", timeout_ms: 30000});
    assert.equal(recovered?.thread?.id, crashThreadId,
      "canary.crash-recovery-resume-thread-mismatch");
    const durable = recoveryStore.getSession(consumerId);
    assert.ok(durable.host_observations.some(entry =>
      entry.kind === "compaction-history-verified" && entry.turn_ref === accepted.turn_ref),
    "canary.crash-recovery-proof-not-durable");
    assert.deepEqual(durable.pending_history_audits, [],
      "canary.crash-recovery-left-history-audit");
    assert.equal(providerRequests.length, 4,
      "canary.crash-recovery-caused-extra-model-request");
    report.gateway_compaction_recovery = "ACTUAL_GATEWAY_CRASH_RECOVERED_FROM_NATIVE_HISTORY";
    report.gateway_recovery_seeded_acceptance = false;
    report.gateway_recovery_process_kill_tested = true;
    report.native_compaction_provider_requests = 1;
  }
  if (mode !== "lifecycle" && !nativeCompactionMode) {
    const packageRoot = extractedPackageRoot ?? resolve(import.meta.dirname, "..");
    if (relayModes.has(mode)) {
      const relayEntry = resolve(packageRoot, "../are-mcp-server/bin/are-hook-mcp-server.mjs");
      writeFileSync(join(codexHome, "hooks.json"), JSON.stringify(hostedMcpHookProfile()), {mode: 0o600});
      writeFileSync(configPath, baseConfig.replace("shell_tool = false", "shell_tool = false\ncodex_hooks = true") +
        `[mcp_servers.are_hosted_hook_relay]\ncommand = ${JSON.stringify(process.execPath)}\n` +
        `args = ${JSON.stringify([relayEntry, "--connection-file", join(state, "hook-connection.json")])}\n` +
        `required = true\nenabled_tools = ["are_hook_observe"]\n` +
        `startup_timeout_sec = 10\ntool_timeout_sec = 10\n`, {mode: 0o600});
      const probe = await openClient(codexHome, resolve(packageRoot, "../../../.."));
      try {
        const sourcePath = join(codexHome, "hooks.json");
        const listed = await probe.rpc.request("hooks/list", {cwds: [resolve(packageRoot, "../../../..")]});
        const hooks = listed.data?.flatMap(row => row.hooks ?? []) ?? [];
        assert.equal(hooks.length, 3, "canary.native-hook-count");
        for (const hook of hooks) {
          assert.equal(hook.sourcePath, sourcePath, "canary.native-hook-source");
          assert.match(hook.currentHash, /^sha256:[0-9a-f]{64}$/, "canary.native-hook-hash");
          appendFileSync(configPath, `\n[hooks.state.${JSON.stringify(hook.key)}]\ntrusted_hash = ${JSON.stringify(hook.currentHash)}\n`);
        }
        const trusted = await probe.rpc.request("hooks/list", {cwds: [resolve(packageRoot, "../../../..")]});
        assert.equal(hostedMcpHookTrustPosture(trusted, sourcePath).ok, true,
          "canary.native-hooks-not-trusted");
      } finally { await closeClient(probe); }
    } else if (mode !== "managed-unapproved-mcp") writeFileSync(configPath, baseConfig, {mode: 0o600});
    if (mode === "managed-invalid-profile") {
      writeFileSync(configPath,
        baseConfig.replace("shell_tool = false", "shell_tool = true"), {mode: 0o600});
    }
    const repositoryRoot = extractedPackageRoot ? selectedCheckout : resolve(packageRoot, "../../../..");
    const managedArgs = [resolve(packageRoot, "bin/are-managed-session.mjs"),
      "--repository-root", resolve(repositoryRoot, ".."),
      "--config", resolve(packageRoot, "profiles/interaction-learning-canary-v1.json"),
      "--codex-command", binary, "--state-dir", state, "--cwd", repositoryRoot,
      "--require-restricted-host-profile", "--codex-home", codexHome,
      ...(guardedMode ? ["--model-wire-upstream", `${endpoint}/responses`,
        "--model-wire-provider-id", "are_fixture"] : []),
      ...(nativeGuardedTextMode ? [process.platform === "win32"
        ? "--windows-guarded-text-turns" : "--guarded-text-turns"] : []),
      ...(mode === "managed-wire-guard-user-input-turn"
        ? [process.platform === "win32" ? "--windows-guarded-user-input" : "--guarded-user-input",
          "--guarded-plan-model", "are-fixture"] : []),
      ...(hostedMode ? ["--allow-hosted-effects"] : []),
      ...(relayModes.has(mode)
        ? ["--hook-bridge", "--require-mcp-hook-relay"] : []),
      ...(mode.endsWith("-turn") && process.platform === "win32"
        ? [...(["managed-turn", "managed-hosted-turn", "managed-hosted-effect-turn",
          "managed-hosted-restart-turn", "managed-hosted-crash-restart-turn",
          "managed-hosted-inflight-crash-turn", "managed-drift-turn",
          "managed-wire-guard-turn", "managed-wire-guard-two-turn", "managed-wire-guard-compaction-turn",
          "managed-wire-guard-user-input-turn",
          "managed-wire-guard-restart-turn",
          "managed-wire-guard-client-crash-turn",
          "managed-wire-guard-fault-turn",
          "managed-wire-guard-midstream-fault-turn",
          "managed-wire-guard-effect-decline-turn",
          "managed-wire-guard-effect-accept-turn",
          "managed-wire-guard-inflight-crash-turn"].includes(mode) ? ["--hook-bridge"] : []),
          ...(nativeGuardedTextMode ? [] : ["--probe-unverified-windows-hooks"])] : [])];
    const managedEnv = {...process.env, CODEX_HOME: codexHome,
      ...((mode.endsWith("-turn") && process.platform === "win32")
        || ["managed-hosted-crash-restart-turn", "managed-hosted-inflight-crash-turn",
          "managed-wire-guard-client-crash-turn", "managed-wire-guard-fault-turn",
          "managed-wire-guard-midstream-fault-turn",
          "managed-wire-guard-inflight-crash-turn"].includes(mode)
        ? {ARE_INTEGRATION_TEST_MODE: "1"} : {})};
    managed = spawn(process.execPath, managedArgs,
      {env: managedEnv, stdio: ["ignore", "pipe", "pipe",
        ...(["managed-hosted-restart-turn", "managed-wire-guard-restart-turn",
          "managed-wire-guard-client-crash-turn", "managed-wire-guard-fault-turn",
          "managed-wire-guard-midstream-fault-turn",
          "managed-hosted-crash-restart-turn",
          "managed-hosted-inflight-crash-turn",
          "managed-wire-guard-inflight-crash-turn"].includes(mode) ? ["ipc"] : [])], windowsHide: true});
    let stdout = "", stderr = "";
    managed.stdout.on("data", chunk => { stdout = `${stdout}${chunk}`.slice(-16384); });
    managed.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-16384); });
    if (mode === "managed-invalid-profile" || mode === "managed-unapproved-mcp") {
      const outcome = await new Promise((done, fail) => {
        const timer = setTimeout(() => fail(new Error("canary.managed-invalid-profile-timeout")), 30000);
        managed.once("exit", code => { clearTimeout(timer); done(code); });
        managed.once("error", error => { clearTimeout(timer); fail(error); });
      });
      assert.equal(outcome, 1, "canary.managed-unsafe-profile-not-refused");
      assert.ok(!stdout.includes("are.managed-session-ready/v1"),
        "canary.managed-unsafe-profile-reached-ready");
      assert.match(stderr, mode === "managed-invalid-profile"
        ? /managed-session.restricted-host-features-not-disabled/
        : /managed-session.restricted-mcp-server-set-mismatch/,
      "canary.managed-unsafe-profile-unrelated-failure");
      report[mode === "managed-invalid-profile" ? "managed_invalid_profile" : "managed_unapproved_mcp"]
        = "REFUSED_BEFORE_READY";
    } else {
    const ready = await new Promise((done, fail) => {
        const timer = setTimeout(() => fail(new Error(`canary.managed-startup-timeout:${stderr.slice(-1000)}`)),
          process.platform === "win32" ? 60000 : 30000);
        const finish = record => { clearTimeout(timer); done(record); };
        const reject = error => { clearTimeout(timer); fail(error); };
        managed.stdout.on("data", () => {
          for (const line of stdout.split("\n")) {
            let record;
            try { record = JSON.parse(line); } catch { continue; }
            if (record.schema_version === "are.managed-session-ready/v1") return finish(record);
          }
        });
        managed.once("exit", (code) => reject(new Error(`canary.managed-exited-before-ready:${code}:${stderr.slice(-300)}`)));
        managed.once("error", reject);
      });
    assert.equal(ready.restricted_host_profile_status, "verified-startup",
      "canary.managed-restricted-profile-not-bound");
    assert.deepEqual(ready.restricted_mcp_server_names,
      relayModes.has(mode) ? ["are_hosted_hook_relay"] : [],
      "canary.managed-mcp-identity-not-bound");
    assert.equal(ready.restricted_mcp_catalog_preflight_required, true,
      "canary.managed-restricted-catalog-not-bound");
    assert.equal(ready.current_desktop_task_control, false,
      "canary.managed-fabricated-task-control");
    assert.equal(ready.authority_effect, "none", "canary.managed-authority-effect");
    assert.equal(ready.model_wire_guard_status, guardedMode
      ? "verified-loopback-candidate" : "disabled", "canary.managed-wire-guard-status-mismatch");
    assert.equal(ready.model_wire_provider_id, guardedMode
      ? "are_fixture" : null, "canary.managed-wire-provider-mismatch");
    assert.equal(ready.guarded_user_input_status,
      mode === "managed-wire-guard-user-input-turn" ? "plan-mode-candidate-enabled" : "disabled",
      "canary.managed-guarded-user-input-status-mismatch");
    if (nativeGuardedTextMode) {
      assert.equal(ready.model_entry_boundary, "guarded-text-only-candidate",
        "canary.managed-guarded-text-boundary-missing");
      assert.equal(ready.managed_gateway_turn_ingress_blocked_reason, null,
        "canary.managed-guarded-text-gateway-still-paused");
      report[process.platform === "win32" ? "windows_guarded_text_without_test_bypass"
        : "linux_guarded_text_without_test_bypass"] = true;
    }
    assert.equal(ready.hosted_effects_status,
      hostedMode ? "candidate-enabled" : "disabled",
      "canary.managed-hosted-effects-posture-mismatch");
    report.managed_startup = "PASS";
    if (mode.endsWith("-turn")) {
      if (mode === "managed-hosted-effect-turn") {
        process.stderr.write(`CANARY_MANAGED_APPROVAL_URL=${ready.launch_url}\n`);
      }
      const launch = new URL(ready.launch_url);
      const token = launch.hash.slice("#token=".length);
      assert.match(token, /^[A-Za-z0-9_-]{32,128}$/, "canary.managed-token-invalid");
      launch.hash = "";
      const call = async (path, body) => {
        const response = await fetch(new URL(path, launch), {method: "POST",
          headers: {authorization: `Bearer ${token}`, "content-type": "application/json"},
          body: JSON.stringify(body)});
        const value = await response.json();
        assert.ok(response.status >= 200 && response.status < 300,
          `canary.managed-http-${path}:${response.status}:${value.reason ?? "unknown"}:${String(value.detail ?? "").slice(0, 400)}:${JSON.stringify(value.value?.reason_codes ?? []).slice(0, 400)}:${stderr.slice(-400)}`);
        assert.equal(value.ok, true, `canary.managed-api-${path}`);
        return value.value;
      };
      const started = await call("api/threads", {cwd: repositoryRoot,
        requestKey: `thread:restricted-${mode}`});
      assert.ok(typeof started?.thread?.id === "string", "canary.managed-thread-missing");
      if (mode === "managed-drift-turn" || mode === "managed-hook-drift-turn") {
        if (mode === "managed-hook-drift-turn") {
          const narrowed = hostedMcpHookProfile();
          narrowed.hooks.PreToolUse[0].matcher = "Bash";
          writeFileSync(join(codexHome, "hooks.json"), JSON.stringify(narrowed), {mode: 0o600});
        } else writeFileSync(configPath,
          baseConfig.replace("shell_tool = false", "shell_tool = true"), {mode: 0o600});
        const response = await fetch(new URL("api/turns", launch), {method: "POST",
          headers: {authorization: `Bearer ${token}`, "content-type": "application/json"},
          body: JSON.stringify({threadId: started.thread.id,
            requestKey: `turn:restricted-${mode}`,
            text: "Explain the repository routing architecture briefly."})});
        assert.equal(response.status, 409, "canary.managed-drift-not-refused");
        assert.deepEqual(await response.json(),
          {ok: false, reason: "windows-client.restricted-host-config-drift"},
          "canary.managed-drift-wrong-refusal");
        const stateResponse = await fetch(new URL("api/state", launch),
          {headers: {authorization: `Bearer ${token}`}});
        assert.equal(stateResponse.status, 200, "canary.managed-drift-state-unavailable");
        assert.equal((await stateResponse.json()).value.pending_turn, null,
          "canary.managed-drift-pending-intent-left-behind");
        assert.equal(providerRequests.length, 2,
          "canary.managed-drift-model-request-dispatched");
        report[mode === "managed-hook-drift-turn"
          ? "managed_hook_drift_refused_before_model" : "managed_drift_refused_before_model"] = "PASS";
        report.model_requests = 2;
      } else {
        const turn = await call("api/turns", {threadId: started.thread.id,
          requestKey: `turn:restricted-${mode}`,
          text: ["managed-hosted-effect-turn", "managed-hosted-inflight-crash-turn"].includes(mode)
            || guardedEffectMode
            ? "Implement the bounded fixture change using the ARE effect tool."
            : "Explain the repository routing architecture briefly."});
        assert.ok(typeof turn?.turn?.id === "string", "canary.managed-turn-missing");
        if (mode === "managed-wire-guard-user-input-turn") {
          const inputDeadline = Date.now() + 30000;
          let prompt;
          while (Date.now() < inputDeadline) {
            const stateResponse = await fetch(new URL("api/state", launch),
              {headers: {authorization: `Bearer ${token}`}});
            assert.equal(stateResponse.status, 200, "canary.guarded-user-input-state-unavailable");
            prompt = (await stateResponse.json()).value.pending_user_inputs?.[0];
            if (prompt) break;
            await new Promise(done => setTimeout(done, 100));
          }
          assert.deepEqual(prompt?.questions?.map(question => question.id), ["choice"],
            "canary.guarded-user-input-prompt-missing");
          await call(`api/user-input/${encodeURIComponent(prompt.request_id)}`,
            {answers: {choice: {answers: ["Continue"]}}});
          report.guarded_user_input_authenticated_answer = true;
        }
        if (guardedEffectMode && mode !== "managed-wire-guard-inflight-crash-turn") {
          const approvalDeadline = Date.now() + 30000;
          let approval;
          while (Date.now() < approvalDeadline) {
            const stateResponse = await fetch(new URL("api/state", launch),
              {headers: {authorization: `Bearer ${token}`}});
            assert.equal(stateResponse.status, 200, "canary.managed-guard-approval-state-unavailable");
            const pending = (await stateResponse.json()).value.pending_approvals ?? [];
            if (pending.length > 0) { approval = pending[0]; break; }
            await new Promise(done => setTimeout(done, 100));
          }
          assert.equal(approval?.method, "item/commandExecution/requestApproval",
            "canary.managed-guard-approval-unavailable");
          const decision = mode === "managed-wire-guard-effect-accept-turn" ? "accept" : "decline";
          const approvalResponse = await fetch(new URL(
            `api/approvals/${encodeURIComponent(approval.request_id)}`, launch), {method: "POST",
            headers: {authorization: `Bearer ${token}`, "content-type": "application/json"},
            body: JSON.stringify({decision})});
          assert.equal(approvalResponse.status, 200, "canary.managed-guard-approval-http-failed");
          assert.equal((await approvalResponse.json()).decision, decision,
            "canary.managed-guard-approval-not-recorded");
          report.managed_guard_fixture_approval = decision.toUpperCase();
        }
        const expectedRequests = mode === "managed-wire-guard-user-input-turn"
          || mode === "managed-hosted-effect-turn"
          || (guardedEffectMode && mode !== "managed-wire-guard-inflight-crash-turn") ? 4 : 3;
        const deadline = Date.now() + (expectedRequests === 4 ? 90000 : 30000);
        while (providerRequests.length < expectedRequests && Date.now() < deadline) {
          await new Promise(done => setTimeout(done, 100));
        }
        assert.equal(providerRequests.length, expectedRequests, "canary.managed-turn-not-dispatched");
        const managedTools = providerRequests[2].tool_names;
        if (guardedMode) {
          assert.deepEqual(managedTools, guardedEffectMode
            ? [HOSTED_EFFECT_TOOL_NAME]
            : mode === "managed-wire-guard-user-input-turn" ? ["request_user_input"] : [],
          "canary.managed-wire-guard-upstream-catalog-not-filtered");
          report.managed_wire_guard = mode === "managed-wire-guard-inflight-crash-turn"
            ? "BOUND_AND_BROKERED_INFLIGHT"
            : mode === "managed-wire-guard-user-input-turn"
              ? "BOUND_AND_BROKERED_PLAN_USER_INPUT_ONE_TURN"
            : mode === "managed-wire-guard-midstream-fault-turn"
              ? "BOUND_WITH_UPSTREAM_STREAM_OPEN"
            : guardedEffectMode
            ? `BOUND_AND_BROKERED_${mode === "managed-wire-guard-effect-accept-turn" ? "ACCEPT" : "DECLINE"}_ONE_TURN`
            : "BOUND_AND_FILTERED_ONE_TURN";
        }
        assert.ok(forbidden.every(name => !managedTools.includes(name)),
          "canary.managed-native-effect-tool-advertised");
        assert.equal(managedTools.includes(HOSTED_EFFECT_TOOL_NAME), hostedMode,
          "canary.managed-hosted-effect-tool-advertisement-mismatch");
        const mcpTools = managedTools.filter(name => name.startsWith("mcp__"));
        assert.ok(mode === "managed-relay-turn"
          ? mcpTools.length === 1 && mcpTools[0].startsWith("mcp__are_hosted_hook_relay")
          : mcpTools.length === 0, "canary.managed-mcp-model-catalog-mismatch");
        report.managed_turn_dispatched = "PASS";
        report.managed_model_tool_names = managedTools;
        if (mode === "managed-wire-guard-midstream-fault-turn") {
          assert.equal(report.managed_midstream_provider_open, true,
            "canary.managed-midstream-provider-not-open");
          await new Promise((done, fail) => managed.send(
            {schema_version: "are.integration-test-stop-model-wire-guard/v1"},
            error => error ? fail(error) : done()));
          await Promise.race([once(managed, "close").catch(() => {}),
            new Promise(done => setTimeout(done, 15000))]);
          assert.equal(managed.exitCode, 1, "canary.managed-midstream-fault-did-not-stop-session");
          assert.match(stdout, /"component":"model-wire-guard"/,
            "canary.managed-midstream-fault-not-attributed");
          const closeDeadline = Date.now() + 5000;
          while (!report.managed_midstream_provider_closed && Date.now() < closeDeadline) {
            await new Promise(done => setTimeout(done, 50));
          }
          assert.equal(report.managed_midstream_provider_closed, true,
            "canary.managed-midstream-provider-stream-survived-guard-stop");
          assert.equal(providerRequests.length, 3,
            "canary.managed-midstream-provider-request-redispatched");
          report.managed_guard_midstream_fault = "UPSTREAM_CLOSED_AND_SESSION_STOPPED";
        }
        if (mode === "managed-hosted-effect-turn") {
          assert.equal(report.managed_effect_model_result_observed, true,
            "canary.managed-effect-not-completed");
          report.managed_effect_completed = "PASS";
        }
        if (guardedEffectMode && mode !== "managed-wire-guard-inflight-crash-turn") {
          assert.equal(report.managed_guard_effect_result_observed, true,
            "canary.managed-guard-effect-result-not-returned-to-model");
        }
        report.model_requests = expectedRequests;
        if (["managed-wire-guard-two-turn", "managed-wire-guard-compaction-turn"].includes(mode)) {
          const waitForIdle = async label => {
            const idleDeadline = Date.now() + 30000;
            let runtime;
            while (Date.now() < idleDeadline) {
              const response = await fetch(new URL(
                `api/threads/${encodeURIComponent(started.thread.id)}/runtime`, launch),
              {headers: {authorization: `Bearer ${token}`}});
              if (response.status !== 200) {
                const state = await fetch(new URL("api/state", launch),
                  {headers: {authorization: `Bearer ${token}`}});
                const fault = (await state.json()).value?.transport_failure?.code ?? "unknown";
                assert.equal(response.status, 200, `canary.managed-${label}-runtime-unavailable:${fault}`);
              }
              runtime = (await response.json()).value;
              if (runtime?.disposition === "idle") return;
              await new Promise(done => setTimeout(done, 100));
            }
            assert.equal(runtime?.disposition, "idle", `canary.managed-${label}-turn-not-idle`);
          };
          await waitForIdle("first");
          if (mode === "managed-wire-guard-compaction-turn") {
            const compact = await call("api/threads/compact", {threadId: started.thread.id,
              requestKey: "compact:restricted-managed-wire-guard"});
            assert.deepEqual(compact, {}, "canary.managed-compaction-ack-invalid");
            const compactionDeadline = Date.now() + 30000;
            while (providerRequests.length < 4 && Date.now() < compactionDeadline) {
              await new Promise(done => setTimeout(done, 100));
            }
            assert.equal(providerRequests.length, 4, "canary.managed-compaction-not-dispatched");
            assert.deepEqual(providerRequests[3].tool_names, [],
              "canary.managed-compaction-wire-catalog-not-empty");
            await waitForIdle("compaction");
            const eventAbort = new AbortController();
            const eventTimer = setTimeout(() => eventAbort.abort(), 30000);
            const eventResponse = await fetch(new URL("api/events", launch), {
              headers: {authorization: `Bearer ${token}`}, signal: eventAbort.signal});
            assert.equal(eventResponse.status, 200, "canary.managed-compaction-events-unavailable");
            const eventReader = eventResponse.body.getReader();
            let eventText = "";
            const eventDeadline = Date.now() + 30000;
            let itemTurnId = null;
            let completedTurnId = null;
            try {
              while ((!itemTurnId || itemTurnId !== completedTurnId) && Date.now() < eventDeadline) {
                const {value, done} = await eventReader.read();
                if (done) break;
                eventText += new TextDecoder().decode(value);
                const frames = eventText.split("\n\n");
                eventText = frames.pop() ?? "";
                for (const frame of frames) {
                  const data = frame.split("\n").find(line => line.startsWith("data: "))?.slice(6);
                  if (!data) continue;
                  const event = JSON.parse(data);
                  const notification = event.kind === "app-server-notification" ? event.payload : null;
                  if (notification?.params?.threadId !== started.thread.id) continue;
                  if (notification.method === "item/completed"
                    && notification.params?.item?.type === "contextCompaction") {
                    itemTurnId = notification.params.turnId;
                  }
                  if (notification.method === "turn/completed"
                    && notification.params?.turn?.status === "completed") {
                    completedTurnId = notification.params.turn.id;
                  }
                }
              }
            } catch (error) {
              if (error.name !== "AbortError") throw error;
            } finally {clearTimeout(eventTimer); eventAbort.abort();}
            assert.ok(itemTurnId && itemTurnId === completedTurnId && itemTurnId !== turn.turn.id,
              "canary.managed-compaction-receipts-not-bound");
            report.managed_compaction = "ACKNOWLEDGED_ITEM_AND_TURN_COMPLETED";
            report.managed_compaction_turn_id_distinct = true;
          }
          const second = await call("api/turns", {threadId: started.thread.id,
            requestKey: `turn:restricted-${mode}:second`,
            text: "Explain the repository routing architecture briefly in a second turn."});
          assert.ok(typeof second?.turn?.id === "string", "canary.managed-second-turn-missing");
          assert.notEqual(second.turn.id, turn.turn.id, "canary.managed-second-turn-identity-reused");
          const secondDeadline = Date.now() + 30000;
          const secondRequestCount = mode === "managed-wire-guard-compaction-turn" ? 5 : 4;
          while (providerRequests.length < secondRequestCount && Date.now() < secondDeadline) {
            await new Promise(done => setTimeout(done, 100));
          }
          assert.equal(providerRequests.length, secondRequestCount, "canary.managed-second-turn-not-dispatched");
          assert.deepEqual(providerRequests[secondRequestCount - 1].tool_names, [],
            "canary.managed-second-turn-wire-catalog-not-filtered");
          await waitForIdle("second");
          report.managed_wire_guard = mode === "managed-wire-guard-compaction-turn"
            ? "BOUND_AND_FILTERED_ACROSS_COMPACTION" : "BOUND_AND_FILTERED_TWO_TURNS";
          report.managed_second_turn = "COMPLETED_IDLE";
          report.model_requests = secondRequestCount;
        }
        if (["managed-hosted-restart-turn", "managed-wire-guard-restart-turn",
          "managed-wire-guard-client-crash-turn", "managed-wire-guard-fault-turn",
          "managed-hosted-crash-restart-turn",
          "managed-hosted-inflight-crash-turn",
          "managed-wire-guard-inflight-crash-turn"].includes(mode)) {
          const inFlightMode = ["managed-hosted-inflight-crash-turn",
            "managed-wire-guard-inflight-crash-turn"].includes(mode);
          const crashMode = !["managed-hosted-restart-turn",
            "managed-wire-guard-restart-turn"].includes(mode);
          const guardFaultMode = mode === "managed-wire-guard-fault-turn";
          let inFlightEffectId = null;
          if (inFlightMode) {
            const approvalDeadline = Date.now() + 30000;
            let approval;
            while (Date.now() < approvalDeadline) {
              const response = await fetch(new URL("api/state", launch),
                {headers: {authorization: `Bearer ${token}`}});
              assert.equal(response.status, 200, "canary.managed-inflight-state-unavailable");
              const pending = (await response.json()).value.pending_approvals ?? [];
              if (pending.length > 0) {
                assert.equal(pending.length, 1, "canary.managed-inflight-approval-count");
                approval = pending[0];
                break;
              }
              await new Promise(done => setTimeout(done, 100));
            }
            assert.equal(approval?.method, "item/commandExecution/requestApproval",
              "canary.managed-inflight-approval-unavailable");
            const approvalResponse = await fetch(new URL(
              `api/approvals/${encodeURIComponent(approval.request_id)}`, launch), {method: "POST",
              headers: {authorization: `Bearer ${token}`, "content-type": "application/json"},
              body: JSON.stringify({decision: "accept"})});
            assert.equal(approvalResponse.status, 200,
              "canary.managed-inflight-fixture-approval-http-failed");
            const accepted = await approvalResponse.json();
            assert.equal(accepted.decision, "accept", "canary.managed-inflight-fixture-approval-not-accepted");
            const journalPath = join(state, "hosted-effects.jsonl");
            const gatewayPath = join(state, "sessions.jsonl");
            const readEvents = path => existsSync(path)
              ? readFileSync(path, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line)) : [];
            const dispatchDeadline = Date.now() + 15000;
            while (Date.now() < dispatchDeadline) {
              const journal = readEvents(journalPath);
              const intents = journal.filter(record => record.event?.status === "intent");
              const dispatches = readEvents(gatewayPath).filter(record =>
                record.event_kind === "dispatch-intent"
                  && record.content?.method === "cyberalchemy/hostedEffect/execute");
              if (intents.length === 1 && dispatches.length === 1) {
                inFlightEffectId = intents[0].event.effect_id;
                assert.equal(journal.some(record => record.event?.effect_id === inFlightEffectId
                  && record.event.status === "complete"), false,
                "canary.managed-inflight-outcome-already-known");
                break;
              }
              await new Promise(done => setTimeout(done, 50));
            }
            if (!inFlightEffectId) report.managed_inflight_dispatch_diagnostic = {
              journal_statuses: readEvents(journalPath).map(record => record.event?.status ?? null),
              gateway_methods: readEvents(gatewayPath).filter(record =>
                record.event_kind === "dispatch-intent").map(record => record.content?.method ?? null),
              provider_requests: providerRequests.length,
              early_tool_output: report.managed_inflight_early_tool_output ?? null,
            };
            assert.match(inFlightEffectId ?? "", /^hosted-effect:[0-9a-f]{64}$/,
              "canary.managed-inflight-dispatch-not-durable");
            assert.equal(readEvents(gatewayPath).filter(record =>
              record.event_kind === "dispatch-intent"
                && record.content?.method === "cyberalchemy/hostedEffect/execute"
                && record.content?.request_key === inFlightEffectId).length, 1,
            "canary.managed-inflight-dispatch-identity-mismatch");
            assert.equal(providerRequests.length, 3,
              "canary.managed-inflight-model-result-arrived-before-crash");
            report.managed_inflight_dispatch = "DURABLE_INTENT_AND_GATEWAY_DISPATCH_INTENT";
            report.managed_inflight_fixture_approval = "ACCEPTED";
          } else {
            const firstDeadline = Date.now() + 30000;
            let firstRuntime;
            while (Date.now() < firstDeadline) {
              const response = await fetch(new URL(`api/threads/${encodeURIComponent(started.thread.id)}/runtime`, launch),
                {headers: {authorization: `Bearer ${token}`}});
              assert.equal(response.status, 200, "canary.managed-first-runtime-unavailable");
              firstRuntime = (await response.json()).value;
              if (firstRuntime?.disposition === "idle") break;
              await new Promise(done => setTimeout(done, 100));
            }
            assert.equal(firstRuntime?.disposition, "idle", "canary.managed-first-turn-not-idle");
          }
          if (guardFaultMode) {
            await new Promise((done, fail) => managed.send(
              {schema_version: "are.integration-test-stop-model-wire-guard/v1"},
              error => error ? fail(error) : done()));
          } else if (crashMode) {
            assert.ok(Number.isSafeInteger(ready.integration_test_hosted_client_pid)
              && ready.integration_test_hosted_client_pid > 0,
            "canary.managed-crash-client-pid-unavailable");
            process.kill(ready.integration_test_hosted_client_pid, "SIGKILL");
          } else {
            await new Promise((done, fail) => managed.send(
              {schema_version: "are.managed-session-stop/v1"}, error => error ? fail(error) : done()));
          }
          await Promise.race([once(managed, "close").catch(() => {}),
            new Promise(done => setTimeout(done, 15000))]);
          assert.ok(managed.exitCode !== null || managed.signalCode !== null,
            "canary.managed-clean-stop-timeout");
          assert.equal(managed.exitCode, crashMode ? 1 : 0,
            `canary.managed-stop-unexpected:${stderr.slice(-400)}`);
          if (guardFaultMode) {
            assert.match(stdout, /"component":"model-wire-guard"/,
              "canary.managed-guard-fault-not-attributed");
            report.managed_guard_fault = "STOPPED_SESSION";
          }
          const stoppedState = {
            hook_connection_exists: existsSync(join(state, "hook-connection.json")),
            effect_writer_lock_exists: existsSync(join(state, "hosted-effects.lock")),
            client_writer_lock_exists: existsSync(join(state, "client-state.json.writer.lock")),
            gateway_writer_lock_exists: existsSync(join(state, "sessions.jsonl.writer.lock")),
          };
          report[guardFaultMode ? "guard_fault_stop_state"
            : crashMode ? "crash_stop_state" : "clean_stop_state"] = stoppedState;
          if (guardFaultMode) {
            assert.ok(Object.values(stoppedState).every(present => present === false),
              "canary.managed-guard-fault-left-private-lock");
          } else if (crashMode) {
            assert.equal(stoppedState.effect_writer_lock_exists, !guardedRestartMode,
              "canary.managed-crash-journal-lock-posture-mismatch");
            assert.equal(stoppedState.client_writer_lock_exists, true,
              "canary.managed-crash-recovery-lock-missing");
            assert.equal(stoppedState.gateway_writer_lock_exists, false,
              "canary.managed-crash-gateway-lock-left-behind");
          } else assert.ok(Object.values(stoppedState).every(present => present === false),
            "canary.managed-clean-stop-left-private-lock");
          managed = spawn(process.execPath, managedArgs,
            {env: managedEnv, stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true});
          let restartStdout = "", restartStderr = "";
          managed.stdout.on("data", chunk => { restartStdout = `${restartStdout}${chunk}`.slice(-16384); });
          managed.stderr.on("data", chunk => { restartStderr = `${restartStderr}${chunk}`.slice(-16384); });
          const restarted = await new Promise((done, fail) => {
            const timer = setTimeout(() => fail(new Error(`canary.managed-restart-timeout:${restartStderr.slice(-500)}`)),
              process.platform === "win32" ? 60000 : 30000);
            managed.stdout.on("data", () => {
              for (const line of restartStdout.split("\n")) {
                let record;
                try { record = JSON.parse(line); } catch { continue; }
                if (record.schema_version === "are.managed-session-ready/v1") {
                  clearTimeout(timer); done(record); return;
                }
              }
            });
            managed.once("exit", code => {clearTimeout(timer);
              fail(new Error(`canary.managed-restart-exited:${code}:${restartStderr.slice(-500)}`));});
            managed.once("error", error => {clearTimeout(timer); fail(error);});
          });
          assert.equal(restarted.hosted_effects_status,
            guardedRestartMode ? "disabled" : "candidate-enabled",
            "canary.managed-restart-hosted-effects-posture-mismatch");
          if (guardedMode) {
            assert.equal(restarted.model_wire_guard_status, "verified-loopback-candidate",
              "canary.managed-restart-wire-guard-not-bound");
            assert.equal(restarted.model_wire_provider_id, "are_fixture",
              "canary.managed-restart-wire-provider-mismatch");
          }
          const restartLaunch = new URL(restarted.launch_url);
          const restartToken = restartLaunch.hash.slice("#token=".length);
          assert.match(restartToken, /^[A-Za-z0-9_-]{32,128}$/, "canary.managed-restart-token-invalid");
          restartLaunch.hash = "";
          if (inFlightMode) {
            const response = await fetch(new URL("api/state", restartLaunch),
              {headers: {authorization: `Bearer ${restartToken}`}});
            assert.equal(response.status, 200, "canary.managed-inflight-restart-state-unavailable");
            const restartedState = (await response.json()).value;
            assert.equal(restartedState.thread_ids.includes(started.thread.id), true,
              "canary.managed-inflight-thread-not-restored");
            const journal = readFileSync(join(state, "hosted-effects.jsonl"), "utf8")
              .split("\n").filter(Boolean).map(line => JSON.parse(line));
            assert.equal(journal.filter(record => record.event?.effect_id === inFlightEffectId
              && record.event.status === "intent").length, 1,
            "canary.managed-inflight-intent-not-restored");
            assert.equal(journal.some(record => record.event?.effect_id === inFlightEffectId
              && record.event.status === "complete"), false,
            "canary.managed-inflight-outcome-fabricated-on-restart");
            const gatewayDispatches = readFileSync(join(state, "sessions.jsonl"), "utf8")
              .split("\n").filter(Boolean).map(line => JSON.parse(line)).filter(record =>
                record.event_kind === "dispatch-intent"
                  && record.content?.method === "cyberalchemy/hostedEffect/execute"
                  && record.content?.request_key === inFlightEffectId);
            assert.equal(gatewayDispatches.length, 1,
              "canary.managed-inflight-dispatch-replayed-on-restart");
            const recovery = await fetch(new URL("api/turns/recover", restartLaunch), {method: "POST",
              headers: {authorization: `Bearer ${restartToken}`, "content-type": "application/json"},
              body: "{}"});
            assert.ok([200, 409].includes(recovery.status),
              "canary.managed-inflight-recovery-unexpected-status");
            const recoveryResult = await recovery.json();
            if (recovery.status === 409) {
              assert.equal(recoveryResult.reason, "windows-client.recovery-evidence-unavailable",
                "canary.managed-inflight-recovery-wrong-refusal");
            } else assert.equal(recoveryResult.ok, true,
              "canary.managed-inflight-recovery-invalid-success");
            report.managed_inflight_turn_recovery = recovery.status === 200
              ? "RECOVERED" : "EVIDENCE_UNAVAILABLE";
            const resume = await fetch(new URL("api/threads/resume", restartLaunch), {method: "POST",
              headers: {authorization: `Bearer ${restartToken}`, "content-type": "application/json"},
              body: JSON.stringify({threadId: started.thread.id, requestKey: "resume:inflight-crash"})});
            assert.equal(resume.status, 409, "canary.managed-inflight-resume-not-blocked");
            const resumeReason = (await resume.json()).reason;
            assert.ok(["windows-client.pending-turn-recovery-required",
              "windows-client.hosted-effect-resume-rebind-unverified"].includes(resumeReason),
              "canary.managed-inflight-resume-wrong-refusal");
            if (recovery.status === 200) assert.equal(resumeReason,
              "windows-client.hosted-effect-resume-rebind-unverified",
            "canary.managed-inflight-unsettled-effect-rebind-not-blocked");
            report.managed_inflight_resume_refusal = resumeReason;
            assert.equal(providerRequests.length, 3,
              "canary.managed-inflight-effect-or-model-replayed");
            report.managed_inflight_restart = "UNSETTLED_AND_RESUME_REFUSED";
            report.model_requests = 3;
          } else {
          const restartCall = async (path, body) => {
            const response = await fetch(new URL(path, restartLaunch), {method: "POST",
              headers: {authorization: `Bearer ${restartToken}`, "content-type": "application/json"},
              body: JSON.stringify(body)});
            const value = await response.json();
            assert.ok(response.status >= 200 && response.status < 300,
              `canary.managed-restart-http-${path}:${response.status}:${value.reason ?? "unknown"}:${JSON.stringify(value.value?.reason_codes ?? []).slice(0, 300)}:${restartStderr.slice(-300)}`);
            assert.equal(value.ok, true, `canary.managed-restart-api-${path}`);
            return value.value;
          };
          if (!guardedRestartMode) {
            const beforeResume = await fetch(new URL("api/turns", restartLaunch), {method: "POST",
              headers: {authorization: `Bearer ${restartToken}`, "content-type": "application/json"},
              body: JSON.stringify({threadId: started.thread.id,
                requestKey: "turn:before-hosted-rebind", text: "Continue the fixture."})});
            assert.equal(beforeResume.status, 409, "canary.managed-restart-turn-was-not-blocked");
            assert.equal((await beforeResume.json()).reason,
              "windows-client.hosted-effect-resume-rebind-unverified",
              "canary.managed-restart-wrong-before-resume-refusal");
          }
          const resumedThread = await restartCall("api/threads/resume", {threadId: started.thread.id,
            requestKey: guardedRestartMode
              ? "resume:guard-restart" : "resume:hosted-restart"});
          assert.equal(resumedThread?.thread?.id, started.thread.id,
            "canary.managed-restart-thread-identity-drift");
          const continued = await restartCall("api/turns", {threadId: started.thread.id,
            requestKey: guardedRestartMode
              ? "turn:after-guard-rebind" : "turn:after-hosted-rebind",
            text: "Explain the repository routing architecture in one sentence."});
          assert.ok(typeof continued?.turn?.id === "string", "canary.managed-restart-turn-missing");
          const secondDeadline = Date.now() + 30000;
          while (providerRequests.length < 4 && Date.now() < secondDeadline) {
            await new Promise(done => setTimeout(done, 100));
          }
          assert.equal(providerRequests.length, 4, "canary.managed-restart-turn-not-dispatched");
          if (guardedRestartMode) {
            assert.deepEqual(providerRequests[3].tool_names, [],
              "canary.managed-restart-wire-catalog-not-filtered");
            report.managed_wire_guard = mode === "managed-wire-guard-restart-turn"
              ? "BOUND_AND_FILTERED_AFTER_CLEAN_RESTART"
              : guardFaultMode ? "BOUND_AND_FILTERED_AFTER_GUARD_FAULT"
                : "BOUND_AND_FILTERED_AFTER_CLIENT_CRASH";
          } else assert.ok(providerRequests[3].tool_names.includes(HOSTED_EFFECT_TOOL_NAME),
            "canary.managed-restart-effect-tool-not-advertised");
          report.managed_restart_resume = "PASS";
          report.model_requests = 4;
          }
        }
      }
    }
    }
  }
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  if (crashChild) report.crash_child_diagnostics = {
    stdout: crashChildOutput.slice(-300), stderr: crashChildErrors.slice(-700),
    exit_code: crashChild.exitCode, signal: crashChild.signalCode,
  };
  if (crashStorePath && existsSync(crashStorePath)) {
    report.crash_store_diagnostics = readFileSync(crashStorePath, "utf8")
      .split("\n").filter(Boolean).map(line => {
        const record = JSON.parse(line);
        return [record.event_kind, record.content?.method ?? null,
          record.content?.delivery?.message?.method ?? null,
          record.content?.delivery?.message?.error?.data?.reason_codes ?? null];
      }).slice(-25);
  }
  if (recoveryStore) {
    const session = recoveryStore.inspect().sessions?.find(value =>
      value.consumer_id === "codex:disposable-native-compaction-crash");
    if (session) report.crash_failure_delivery_state = {
      acknowledged_through: session.acknowledged_through,
      sequences: session.deliveries?.map(delivery => delivery.sequence),
    };
  }
  process.exitCode = 1;
} finally {
  if (crashChild && crashChild.exitCode === null && crashChild.signalCode === null) {
    crashChild.kill("SIGKILL");
    await Promise.race([once(crashChild, "close").catch(() => {}),
      new Promise(done => setTimeout(done, 3000))]);
  }
  if (Number.isSafeInteger(crashBackendPid) && crashBackendPid > 0) {
    try { process.kill(crashBackendPid, "SIGTERM"); }
    catch (error) { if (error?.code !== "ESRCH") {
      report.recovery_teardown_error = error.message; process.exitCode = 1;
    } }
  }
  try { await recoveryRpc?.close(); } catch (error) {
    report.recovery_teardown_error = error.message; process.exitCode = 1;
  }
  try { await recoveryTransport?.close(); } catch (error) {
    report.recovery_teardown_error = error.message; process.exitCode = 1;
  }
  try { await recoveryGateway?.close(); } catch (error) {
    report.recovery_teardown_error = error.message; process.exitCode = 1;
  }
  try { recoveryStore?.close(); } catch (error) {
    report.recovery_teardown_error = error.message; process.exitCode = 1;
  }
  if (managed && managed.exitCode === null && managed.signalCode === null) {
    if (managed.connected) {
      try { await new Promise((done, fail) => managed.send(
        {schema_version: "are.managed-session-stop/v1"}, error => error ? fail(error) : done())); }
      catch { /* Fall through to the existing forced-stop cleanup. */ }
    }
    await Promise.race([once(managed, "close").catch(() => {}),
      new Promise(done => setTimeout(done, managed.connected ? 15000 : 1000))]);
    if (managed.exitCode === null && managed.signalCode === null) managed.kill("SIGTERM");
    await Promise.race([once(managed, "close").catch(() => {}),
      new Promise(done => setTimeout(done, 5000))]);
    if (managed.exitCode === null && managed.signalCode === null) managed.kill("SIGKILL");
  }
  try { await closeClient(active); } catch (error) { report.teardown_error = error.message; process.exitCode = 1; }
  if (provider) {
    provider.closeAllConnections();
    await new Promise(done => provider.close(done));
  }
  if (root) rmSync(root, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});
  report.teardown = {temporary_configuration_removed: root ? !existsSync(root) : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
