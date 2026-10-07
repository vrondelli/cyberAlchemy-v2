#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createGatewaySessionClient} from "../src/gateway-session-client.mjs";
import {createCodexAppServerWrapper, loadRepositoryProfile} from "../packages/codex-app-server-wrapper/index.mjs";
import {digestValue} from "../packages/codex-app-server-wrapper/src/canonical.mjs";
import {createPersistentGateway} from "../packages/codex-app-server-wrapper/src/gateway.mjs";
import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../packages/codex-app-server-wrapper/src/rpc-client.mjs";

const product = fileURLToPath(new URL("../", import.meta.url));
const checkout = resolve(product, "../..");
const binary = process.argv[2];
const flags = process.argv.slice(3);
const reverseMode = flags.includes("--reverse");
const unsubscribeProbeMode = flags.includes("--unsubscribe-probe");
const freshLockProbeMode = flags.includes("--fresh-lock-probe");
const expectedVersion = process.env.ARE_NATIVE_CANARY_EXPECTED_VERSION;
const report = {schema_version: "are.g1-disposable-cross-process-probe/v1", status: "FAIL",
  authority_effect: "disposable-only", external_model_calls: 0,
  active_task_touched: false, active_configuration_changed: false,
  gateway_claimed: false, direct_resume_rejected_while_gateway_active: false,
  direct_resumed_after_gateway_close: false, direct_turn_completed: false,
  provider_calls: 0, open_questions_ref: "../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md#open-questions"};
let scratch, server, gateway, gatewayClient, directClient, directTransport, directProbeClient;
let providerCalls = 0;
const observedNotifications = [];

function completedTurn(client, threadId, turnId) {
  const prior = observedNotifications.find(message => message.method === "turn/completed"
    && message.params?.threadId === threadId && message.params?.turn?.id === turnId);
  if (prior) return Promise.resolve(prior.params);
  return new Promise((resolveValue, reject) => {
    const timer = setTimeout(() => {client.events.off("notification", onNotification); reject(new Error("gateway.turn-completion-timeout"));}, 20000);
    function onNotification(message) {
      if (message.method !== "turn/completed" || message.params?.threadId !== threadId || message.params?.turn?.id !== turnId) return;
      clearTimeout(timer);
      client.events.off("notification", onNotification);
      resolveValue(message.params);
    }
    client.events.on("notification", onNotification);
  });
}

try {
  assert.ok(binary && expectedVersion && flags.every(flag => ["--reverse", "--unsubscribe-probe", "--fresh-lock-probe"].includes(flag))
    && new Set(flags).size === flags.length && !(unsubscribeProbeMode && reverseMode)
    && (!freshLockProbeMode || flags.length === 1),
  "usage: ARE_NATIVE_CANARY_EXPECTED_VERSION=<exact version> node scripts/test-native-gateway-bypass.mjs /absolute/path/to/codex [--reverse | --unsubscribe-probe | --fresh-lock-probe]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "native.exact-version-required");
  report.host = {version: expectedVersion, sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  const loaded = loadRepositoryProfile(resolve(product, "packages/codex-app-server-wrapper/profiles/repository-v1.json"), resolve(checkout, ".."));
  assert.equal(loaded.ok, true, "native.wrapper-profile-unavailable");
  scratch = mkdtempSync(resolve(tmpdir(), "are-g1-disposable-"));
  const configRoot = resolve(scratch, "codex");
  mkdirSync(configRoot);
  server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      let bytes = 0;
      for await (const chunk of request) {bytes += chunk.length; assert.ok(bytes <= 1024 * 1024);}
      providerCalls += 1;
      assert.ok(providerCalls <= (reverseMode ? 3 : 2), "native.unexpected-provider-dispatch");
      const id = `resp_fixture_${providerCalls}`;
      const item = {id: `msg_fixture_${providerCalls}`, type: "message", status: "completed", role: "assistant",
        content: [{type: "output_text", text: "ARE_G1_LOCAL_FIXTURE_OK", annotations: []}]};
      const events = [
        {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
        {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress", content: []}},
        {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0, part: {type: "output_text", text: "", annotations: []}},
        {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: "ARE_G1_LOCAL_FIXTURE_OK"},
        {type: "response.output_item.done", output_index: 0, item},
        {type: "response.completed", response: {id, object: "response", status: "completed", output: [item], usage: {input_tokens: 10, output_tokens: 5, total_tokens: 15}}},
      ];
      response.writeHead(200, {"Content-Type": "text/event-stream"});
      response.end(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""));
    } catch (error) {report.provider_error = error.message; response.writeHead(500); response.end("fixture rejected request");}
  });
  await new Promise(resolveValue => server.listen(0, "127.0.0.1", resolveValue));
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = "http://127.0.0.1:${server.address().port}/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`);
  const env = {...process.env, CODEX_HOME: configRoot};
  const gatewaySocketPath = resolve(scratch, "gateway.sock");
  const gatewaySessionStorePath = resolve(scratch, "gateway-sessions.jsonl");
  gateway = createPersistentGateway({listen_path: gatewaySocketPath,
    session_store_path: gatewaySessionStorePath,
    backend: {mode: "direct-stdio", command: binary},
    spawn_impl: (command, args, options) => spawn(command, args, {...options, env}),
    wrapper_factory: () => createCodexAppServerWrapper({loaded_profile: loaded.value,
      decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
      ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot})});
  await gateway.start();
  gatewayClient = createGatewaySessionClient({socket_path: gatewaySocketPath,
    consumer_id: "g1-disposable-owner", lane: "interaction-bound", request_timeout_ms: 10000});
  gatewayClient.events.on("notification", message => observedNotifications.push(message));
  await gatewayClient.connect();
  await gatewayClient.request("g1-init", "initialize", {clientInfo: {name: "are_g1_disposable", version: "1"}, capabilities: {experimentalApi: true}});
  await gatewayClient.notify("initialized");
  const started = await gatewayClient.request("g1-thread", "thread/start", {cwd: checkout,
    model: "are-fixture", approvalPolicy: "on-request", sandbox: "read-only", ephemeral: false});
  const threadId = started.thread.id;
  const ownedRef = `backend-thread:${digestValue(threadId)}`;
  report.gateway_claimed = gateway.inspect().durable_session_index.sessions.some(session =>
    session.consumer_id === "g1-disposable-owner" && session.thread_refs.includes(ownedRef));
  assert.ok(report.gateway_claimed, "gateway.backend-thread-claim-missing");
  if (freshLockProbeMode) {
    directTransport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--listen", "stdio://"], env});
    directClient = createAppServerRpcClient({transport: directTransport, request_timeout_ms: 10000,
      completion_timeout_ms: 20000});
    await directClient.initialize({clientInfo: {name: "are_g1_fresh_lock_probe", version: "1"},
      capabilities: {experimentalApi: true}});
    await directClient.notify("initialized");
    try { await directClient.request("thread/resume", {threadId}); }
    catch (error) {
      if (!/already has an active writer|no rollout found for thread id/.test(error.message)) throw error;
      report.fresh_direct_resume_rejection = error.message;
      report.fresh_direct_resume_rejected = true;
    }
    assert.equal(report.fresh_direct_resume_rejected, true, "native.fresh-second-writer-not-rejected");
    try {
      await directClient.request("turn/start", {threadId,
        input: [{type: "text", text: "Local fixture only: test second-writer rejection."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}});
    } catch (error) {
      if (!/thread not found|already has an active writer/.test(error.message)) throw error;
      report.fresh_direct_turn_rejection = error.message;
      report.fresh_direct_turn_rejected = true;
    }
    assert.equal(report.fresh_direct_turn_rejected, true, "native.fresh-direct-turn-bypassed-writer-lock");
    assert.equal(providerCalls, 0, "native.fresh-probe-dispatched-provider-before-gateway-turn");
    await directClient.close();
    directClient = null;
  }
  const beforeTurnStart = observedNotifications.length;
  const start = await gatewayClient.request("g1-turn-1", "turn/start", {threadId,
    input: [{type: "text", text: "Explain the repository routing architecture."}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}});
  const atTurnStartResponse = observedNotifications.length;
  const firstCompleted = await completedTurn(gatewayClient, threadId, start.turn.id);
  assert.equal(firstCompleted.turn.status, "completed", "gateway.first-turn-not-completed");
  const turnNotificationMethods = observedNotifications.slice(beforeTurnStart)
    .filter(message => message.params?.threadId === threadId
      && ["turn/started", "item/started", "item/completed", "turn/completed"].includes(message.method))
    .map(message => message.method);
  const beforeResponseMethods = observedNotifications.slice(beforeTurnStart, atTurnStartResponse)
    .filter(message => message.params?.threadId === threadId
      && ["turn/started", "item/started", "item/completed", "turn/completed"].includes(message.method))
    .map(message => message.method);
  report.gateway_turn_event_order = {
    boundary: "gateway turn/start request promise resolution",
    before_start_response: beforeResponseMethods.slice(0, 32),
    through_completion: turnNotificationMethods.slice(0, 32),
    truncated: beforeResponseMethods.length > 32 || turnNotificationMethods.length > 32,
  };
  report.gateway_first_turn_completed = true;

  directTransport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--listen", "stdio://"], env});
  directClient = createAppServerRpcClient({transport: directTransport, request_timeout_ms: 10000, completion_timeout_ms: 20000});
  await directClient.initialize({clientInfo: {name: "are_g1_direct", version: "1"}, capabilities: {experimentalApi: true}});
  await directClient.notify("initialized");
  try {
    await directClient.request("thread/resume", {threadId});
  } catch (error) {
    if (!/already has an active writer/.test(error.message)) throw error;
    report.direct_resume_rejected_while_gateway_active = true;
  }
  assert.ok(report.direct_resume_rejected_while_gateway_active, "native.host-did-not-reject-second-writer");
  await directClient.close();
  directClient = null;
  if (reverseMode) await gatewayClient.disconnect();
  else { await gatewayClient.close(); gatewayClient = null; }
  await gateway.close();
  gateway = null;
  report.gateway_closed_before_direct_turn = true;

  directTransport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--listen", "stdio://"], env});
  directClient = createAppServerRpcClient({transport: directTransport, request_timeout_ms: 10000, completion_timeout_ms: 20000});
  await directClient.initialize({clientInfo: {name: "are_g1_direct_after_close", version: "1"}, capabilities: {experimentalApi: true}});
  await directClient.notify("initialized");
  const resumed = await directClient.request("thread/resume", {threadId});
  report.direct_resumed_after_gateway_close = resumed?.thread?.id === threadId;
  assert.ok(report.direct_resumed_after_gateway_close, "direct.resume-after-close-identity-mismatch");
  const second = await directClient.runTurn({threadId, input: [{type: "text", text: "Reply from the fixed local fixture."}]});
  report.direct_turn_completed = second.completed?.turn?.status === "completed";
  report.provider_calls = providerCalls;
  assert.ok(report.direct_turn_completed, "direct.turn-not-completed");
  assert.equal(providerCalls, 2, "native.provider-call-count");
  if (unsubscribeProbeMode) {
    const unsubscribed = await directClient.request("thread/unsubscribe", {threadId});
    report.direct_unsubscribe_status = unsubscribed?.status ?? null;
    assert.equal(report.direct_unsubscribe_status, "unsubscribed", "native.unsubscribe-status-unexpected");
    const probeTransport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--listen", "stdio://"], env});
    directProbeClient = createAppServerRpcClient({transport: probeTransport,
      request_timeout_ms: 10000, completion_timeout_ms: 20000});
    await directProbeClient.initialize({clientInfo: {name: "are_g1_unsubscribe_probe", version: "1"},
      capabilities: {experimentalApi: true}});
    await directProbeClient.notify("initialized");
    try {
      await directProbeClient.request("thread/resume", {threadId});
    } catch (error) {
      if (!/already has an active writer/.test(error.message)) throw error;
      report.direct_resume_rejected_after_unsubscribe = true;
    }
    assert.equal(report.direct_resume_rejected_after_unsubscribe, true,
      "native.unsubscribe-released-active-writer");
    await directProbeClient.close();
    directProbeClient = null;
    await directClient.close();
    directClient = null;
    directTransport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--listen", "stdio://"], env});
    directClient = createAppServerRpcClient({transport: directTransport,
      request_timeout_ms: 10000, completion_timeout_ms: 20000});
    await directClient.initialize({clientInfo: {name: "are_g1_after_unsubscribe_close", version: "1"},
      capabilities: {experimentalApi: true}});
    await directClient.notify("initialized");
    const afterClose = await directClient.request("thread/resume", {threadId});
    report.direct_resumed_after_unsubscribe_writer_close = afterClose?.thread?.id === threadId;
    assert.equal(report.direct_resumed_after_unsubscribe_writer_close, true,
      "native.unsubscribe-probe-after-close-resume-failed");
  }
  if (reverseMode) {
    const startReverseGateway = async (suffix) => {
      gateway = createPersistentGateway({listen_path: gatewaySocketPath,
        session_store_path: gatewaySessionStorePath,
        backend: {mode: "direct-stdio", command: binary},
        spawn_impl: (command, args, options) => spawn(command, args, {...options, env}),
        wrapper_factory: () => createCodexAppServerWrapper({loaded_profile: loaded.value,
          decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
          ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot})});
      await gateway.start();
      await gatewayClient.connect();
      await gatewayClient.request(`${suffix}-init`, "initialize", {clientInfo: {name: "are_g1_reverse", version: "1"}, capabilities: {experimentalApi: true}});
      await gatewayClient.notify("initialized");
      report.gateway_session_recovered = gateway.inspect().durable_session_index.sessions.some(session =>
        session.consumer_id === "g1-disposable-owner" && session.thread_refs.includes(ownedRef));
      assert.equal(report.gateway_session_recovered, true, "gateway.backend-thread-owner-not-recovered");
    };
    await startReverseGateway("reverse-locked");
    try {
      await gatewayClient.request("reverse-resume-locked", "thread/resume", {threadId,
        approvalPolicy: "on-request", sandbox: "read-only"});
    } catch (error) {
      if (!/already has an active writer/.test(error.message)) throw error;
      report.gateway_resume_rejected_while_direct_active = true;
    }
    assert.ok(report.gateway_resume_rejected_while_direct_active, "native.reverse-second-writer-not-rejected");
    await gatewayClient.disconnect();
    await gateway.close(); gateway = null;
    await directClient.close(); directClient = null;
    await new Promise(resolveValue => setTimeout(resolveValue, 300));
    await startReverseGateway("reverse-released");
    const imported = await gatewayClient.request("reverse-resume-released", "thread/resume", {threadId,
      approvalPolicy: "on-request", sandbox: "read-only"});
    report.gateway_resumed_after_direct_close = imported?.thread?.id === threadId;
    assert.ok(report.gateway_resumed_after_direct_close, "gateway.reverse-resume-identity-mismatch");
    const thirdStart = await gatewayClient.request("reverse-turn-3", "turn/start", {threadId,
      input: [{type: "text", text: "Explain the repository routing architecture."}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}});
    const thirdCompleted = await completedTurn(gatewayClient, threadId, thirdStart.turn.id);
    report.gateway_imported_turn_completed = thirdCompleted.turn.status === "completed";
    assert.ok(report.gateway_imported_turn_completed, "gateway.imported-turn-not-completed");
    assert.equal(providerCalls, 3, "native.reverse-provider-call-count");
    const history = await gatewayClient.request("reverse-history", "thread/turns/list", {threadId,
      limit: 10, sortDirection: "desc", itemsView: "notLoaded"});
    const expectedTurns = new Set([start.turn.id, second.started.turn.id, thirdStart.turn.id]);
    const observedTurns = history.data ?? [];
    assert.equal(history.nextCursor, null, "native.reverse-history-incomplete");
    assert.equal(observedTurns.length, expectedTurns.size, "native.reverse-history-turn-count");
    assert.ok(observedTurns.every(turn => expectedTurns.has(turn.id) && turn.status === "completed"), "native.reverse-history-mismatch");
    report.stored_history_reconciled = {turn_count: observedTurns.length, all_completed: true,
      no_duplicate_turns: new Set(observedTurns.map(turn => turn.id)).size === observedTurns.length};
  }
  report.provider_calls = providerCalls;
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  report.error_details = error.details?.data ?? null;
  report.provider_calls = providerCalls;
  process.exitCode = 1;
} finally {
  await directProbeClient?.close().catch(() => {});
  await directClient?.close().catch(() => {});
  await gatewayClient?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  if (server) {server.closeAllConnections(); await new Promise(resolveValue => server.close(resolveValue));}
  if (scratch) rmSync(scratch, {recursive: true, force: true});
  report.teardown = {temporary_configuration_removed: true, authority_effect: "none"};
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
