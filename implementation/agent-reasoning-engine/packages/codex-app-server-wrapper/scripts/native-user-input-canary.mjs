#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {hostname, tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {PassThrough} from "node:stream";
import {fileURLToPath} from "node:url";

import {
  createAppServerRpcClient,
  createApprovalBroker,
  createCodexAppServerWrapper,
  createPersistentGateway,
  createUserInputBroker,
  createWindowsClientHost,
  createWindowsClientRecoveryState,
  deriveGatewayReasoningStateProfile,
  GATEWAY_TURN_RECOVERY_CONFIRM,
  GATEWAY_TURN_RECOVERY_GET,
  loadRepositoryProfile,
} from "../index.mjs";
import {readAdapterObservation} from "../src/adapter-observation-client.mjs";
import {backendProcessBirthRef, backendProcessBirthSupported} from "../src/backend-process-birth.mjs";
import {digestValue} from "../src/canonical.mjs";
import {readGatewayDecisionObservation} from "../src/decision-observation-client.mjs";
import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";
import {startModelWireGuard} from "../src/model-wire-guard.mjs";
import {readGatewayThreadObservation} from "../src/thread-observation-client.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checkoutRoot = resolve(packageRoot, "../../../../..");
const binaryArg = process.argv[2];
const expectedVersion = process.argv[3];
const browserMode = process.argv.includes("--browser");
const guardedUserInputMode = process.argv.includes("--guarded-user-input");
const initializeOptOutProbeMode = process.argv.includes("--initialize-opt-out-probe");
const interruptedTurnRecoveryMode = process.argv.includes("--interrupted-turn-recovery");
const completedNotificationLossMode = process.argv.includes("--completed-notification-loss");
const clientIdProbeMode = process.argv.includes("--client-id-probe");
const clientIdRestartProbeMode = process.argv.includes("--client-id-restart-probe");
const threadCreationHistoryProbeMode = process.argv.includes("--thread-creation-history-probe");
const gatewayAutoCompactionLostResponseMode = process.argv.includes("--gateway-auto-compaction-lost-response-probe");
const gatewayCrashBeforeRecoveryMode = process.argv.includes("--gateway-hard-crash-before-recovery");
const gatewayCrashActiveTurnMode = process.argv.includes("--gateway-hard-crash-active-turn");
const gatewayAutoCompactionMarkerMode = process.argv.includes("--gateway-auto-compaction-marker-probe")
  || gatewayAutoCompactionLostResponseMode;
const hostedPendingProbeMode = process.argv.includes("--hosted-pending-marker-probe");
const unknownAcceptanceProbeMode = process.argv.includes("--unknown-acceptance-marker-probe")
  || hostedPendingProbeMode || gatewayAutoCompactionLostResponseMode;
const terminalRecoveryMode = interruptedTurnRecoveryMode || completedNotificationLossMode;
const gatewayRecoveryMode = process.argv.includes("--gateway-recovery") || terminalRecoveryMode;
const holdObservationTcpMode = process.argv.includes("--hold-observation-tcp");
const holdObservationMode = process.argv.includes("--hold-observation") || holdObservationTcpMode;
const holdActiveObservationMode = process.argv.includes("--hold-active-observation");
const recoveryMode = process.argv.includes("--recovery") || gatewayRecoveryMode;
const browserRecoveryMode = process.argv.includes("--browser-recovery");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const delay = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));
const report = {schema_version: "are.native-user-input-canary/v1", status: "FAIL", authority_effect: "none",
  external_model_calls: 0, provider: "loopback-fixed-responses-fixture", current_desktop_task_touched: false};
let scratch;
let server;
let modelWireGuard;
let modelWireClientToken;
let gateway;
let rpc;
let transport;
let backend;
let host;
let recoveryState;
let dropProbeStartResponse = false;
let suppressedProbeStartResponse = false;
let stderr = "";
const requests = [];
const notifications = [];
const hostRequests = [];
let observationPath;
let observationToken;
let gatewayPath;
let gatewayConnectionToken;
let dropProbeCompletion = false;
let suppressedProbeCompletion = false;
let diagnosticThreadId;

async function holdForCompanion(phase) {
  if (!holdObservationMode) return;
  process.stderr.write(`ARE_CANARY_OBSERVATION_READY ${JSON.stringify({phase,
    socket_path: observationPath, token: observationToken})}\n`);
  await new Promise((resolveHold, rejectHold) => {
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.off("end", onEnd);
      process.stdin.pause();
    };
    const onData = () => { cleanup(); resolveHold(); };
    const onEnd = () => { cleanup(); rejectHold(new Error("canary.companion-hold-ended")); };
    process.stdin.once("data", onData);
    process.stdin.once("end", onEnd);
    process.stdin.resume();
  });
}

async function observeGatewayThread(threadId, options = {}) {
  const readOptions = {socket_path: observationPath, token: observationToken};
  const [adapter, threads, decisions] = await Promise.all([
    readAdapterObservation(readOptions),
    readGatewayThreadObservation(readOptions),
    readGatewayDecisionObservation(readOptions),
  ]);
  assert.equal(adapter.runtime_epoch_id, threads.runtime_epoch_id, "canary.adapter-thread-source-epoch-mismatch");
  assert.equal(adapter.runtime_epoch_id, decisions.runtime_epoch_id, "canary.adapter-decision-source-epoch-mismatch");
  assert.equal(adapter.selected_backend_adapter_id, "codex-app-server/v1", "canary.observed-adapter-mismatch");
  assert.equal(adapter.host_task_control.status, "unverified", "canary.observation-promoted-desktop-task-control");
  assert.equal(adapter.gateway.status, "running", "canary.observed-gateway-not-running");
  assert.equal(threads.scope, "gateway-backend-threads-not-host-activation");
  assert.equal(decisions.scope, "gateway-backend-decisions-not-durable-host-history");
  assert.equal(threads.thread_count, 1, "canary.observed-reasoning-thread-missing");
  const row = threads.threads[0];
  assert.equal(row.thread_ref, `backend-thread:${digestValue(threadId)}`, "canary.observed-thread-identity-mismatch");
  assert.equal(row.phase, options.expectedPhase ?? "turn-completed", "canary.observed-thread-phase-mismatch");
  assert.ok(row.latest_frontier_digest, "canary.observed-completion-frontier-missing");
  assert.equal(JSON.stringify({adapter, threads, decisions}).includes(threadId), false,
    "canary.observation-leaked-host-thread-id");
  if (options.requireDecision) {
    assert.ok(decisions.decision_count > 0, "canary.observed-decision-missing");
    assert.ok(decisions.decisions.some((decision) => decision.thread_ref === row.thread_ref
      && decision.consumer_ref === row.consumer_ref), "canary.observed-decision-thread-join-missing");
  }
  return {runtime_epoch_id: adapter.runtime_epoch_id, adapter_status: adapter.backend.status,
    thread_count: threads.thread_count, thread_phase: row.phase, frontier_present: true,
    latest_frontier_digest: row.latest_frontier_digest,
    decision_count: decisions.decision_count, host_task_control: adapter.host_task_control.status};
}

function decisionIdentities(projection) {
  assert.equal(projection.truncated, false, "canary.decision-identity-comparison-truncated");
  const identities = projection.decisions.map((decision) =>
    `${decision.consumer_ref}:${decision.thread_ref}:${decision.event_sequence}:${decision.decision_digest}:${decision.evidence_event_digest}`);
  assert.equal(new Set(identities).size, identities.length, "canary.duplicate-decision-observation-identity");
  return identities.sort();
}

function assertPriorDecisionsPreserved(before, after) {
  assert.ok(before.decision_count > 0, "canary.prior-decision-observations-missing");
  assert.ok(after.decision_count >= before.decision_count, "canary.prior-decision-observations-lost");
  const recovered = new Set(decisionIdentities(after));
  for (const identity of decisionIdentities(before)) assert.ok(recovered.has(identity),
    "canary.prior-decision-observation-identity-lost");
}

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
  assert.ok(binaryArg && expectedVersion, "Usage: native-user-input-canary.mjs <installed-codex-binary> <exact-version>");
  assert.ok(!gatewayCrashBeforeRecoveryMode || gatewayAutoCompactionLostResponseMode,
    "canary.hard-crash-mode-requires-auto-compaction-lost-response");
  assert.ok(!gatewayCrashActiveTurnMode || interruptedTurnRecoveryMode,
    "canary.active-hard-crash-mode-requires-interrupted-turn-recovery");
  assert.ok(!(gatewayCrashBeforeRecoveryMode && gatewayCrashActiveTurnMode),
    "canary.hard-crash-modes-conflict");
  const binary = realpathSync(binaryArg);
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {path: binary, version: expectedVersion, sha256: sha256(readFileSync(binary))};

  scratch = mkdtempSync(resolve(tmpdir(), "are-native-user-input-"));
  const configRoot = resolve(scratch, "codex-home");
  mkdirSync(configRoot);
  server = createServer(async (request, response) => {
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
      assert.ok(requests.length <= (gatewayAutoCompactionMarkerMode ? 16
        : terminalRecoveryMode ? 4 : recoveryMode || clientIdProbeMode || clientIdRestartProbeMode || unknownAcceptanceProbeMode ? 3 : 2),
      "canary.unexpected-provider-retry");
      const id = `resp_are_user_input_${requests.length}`;
      let output;
      if (gatewayAutoCompactionMarkerMode) {
        output = [{id: `msg_are_compaction_${requests.length}`, type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_GATEWAY_COMPACTION_FIXTURE_OK", annotations: []}]}];
      } else if (requests.length === 1) {
        const names = (body.tools ?? []).map((tool) => tool.name).filter(Boolean);
        report.available_user_input_tool = names.find((name) => name.includes("request_user_input")) ?? null;
        assert.ok(report.available_user_input_tool, `canary.user-input-tool-unavailable:${names.join(",")}`);
        output = [{id: "fc_are_user_input", type: "function_call", call_id: "are_user_input_1",
          name: report.available_user_input_tool, arguments: JSON.stringify({questions: [{id: "choice", header: "Fixture choice",
            question: "Continue the isolated ARE canary?", options: [{label: "Continue", description: "Complete the fixed local test."}]}]}), status: "completed"}];
      } else if (requests.length === 2) {
        const answered = (body.input ?? []).some((item) => item.type === "function_call_output" && item.call_id === "are_user_input_1" &&
          JSON.stringify(item.output).includes("Continue"));
        report.answer_observed_by_provider = answered;
        assert.ok(answered, "canary.user-input-answer-not-on-provider-wire");
        output = [{id: "msg_are_user_input", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_USER_INPUT_NATIVE_OK", annotations: []}]}];
      } else if (interruptedTurnRecoveryMode && requests.length === 3) {
        output = [{id: "fc_are_interrupted_turn", type: "function_call", call_id: "are_interrupted_turn_1",
          name: report.available_user_input_tool, arguments: JSON.stringify({questions: [{id: "interrupt",
            header: "Fixture stop", question: "Pause this isolated ARE canary?",
            options: [{label: "Continue", description: "Complete the fixed local test."}]}]}), status: "completed"}];
      } else {
        output = [{id: "msg_are_replay_probe", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_STABLE_REPLAY_NATIVE_OK", annotations: []}]}];
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(id, output));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500);
      response.end("fixture rejected request");
    }
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  if (guardedUserInputMode) {
    modelWireClientToken = randomBytes(32).toString("hex");
    modelWireGuard = await startModelWireGuard({upstreamUrl: `${endpoint}/responses`,
      allowedToolNames: ["request_user_input"], clientToken: modelWireClientToken});
  }
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n${guardedUserInputMode ? 'web_search = "disabled"\n' : ""}${gatewayAutoCompactionMarkerMode ? "model_context_window = 4096\nmodel_auto_compact_token_limit = 10\n" : ""}[features]\nremote_plugin = false\nplugins = false\n${guardedUserInputMode ? "shell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\n" : ""}\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(modelWireGuard?.url ?? endpoint)}\n${guardedUserInputMode ? 'env_http_headers = {"X-ARE-Guard-Token" = "ARE_MODEL_WIRE_CLIENT_TOKEN"}\n' : ""}wire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`, {mode: 0o600});

  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), checkoutRoot);
  assert.equal(loaded.ok, true, `canary.wrapper-profile-unavailable:${JSON.stringify(loaded.reason_codes)}`);
  const pipeSuffix = `${process.pid}-${randomBytes(8).toString("hex")}`;
  gatewayPath = process.platform === "win32"
    ? `\\\\.\\pipe\\are-native-gateway-${pipeSuffix}` : resolve(scratch, "gateway.sock");
  observationPath = process.platform === "win32"
    ? `\\\\.\\pipe\\are-native-observation-${pipeSuffix}` : resolve(scratch, "observation.sock");
  observationToken = randomBytes(32).toString("hex");
  gatewayConnectionToken = process.platform === "win32" ? randomBytes(32).toString("hex") : undefined;
  const sessionStorePath = resolve(scratch, "gateway-session-store.jsonl");
  const gatewayOptions = {listen_path: gatewayPath,
    ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {}),
    ...(holdObservationTcpMode ? {observation_tcp_port: 0} : {observation_listen_path: observationPath}),
    observation_token: observationToken,
    expected_codex_version: expectedVersion,
    ...((gatewayCrashBeforeRecoveryMode || gatewayCrashActiveTurnMode)
      ? {backend_process_guard: "required"} : {}),
    ...(gatewayRecoveryMode || clientIdRestartProbeMode || unknownAcceptanceProbeMode || gatewayAutoCompactionMarkerMode
      ? {session_store_path: sessionStorePath} : {}),
    backend: {mode: "direct-stdio", command: binary},
    spawn_impl: (command, args, options) => {
      backend = spawn(command, args, {cwd: scratch, ...options,
        env: {...process.env, CODEX_HOME: configRoot,
          ...(modelWireClientToken ? {ARE_MODEL_WIRE_CLIENT_TOKEN: modelWireClientToken} : {})}});
      backend.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8192); });
      if (!unknownAcceptanceProbeMode) return backend;
      const filteredStdout = new PassThrough();
      let pending = "";
      backend.stdout.on("data", (chunk) => {
        pending += chunk.toString("utf8");
        let newline;
        while ((newline = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, newline);
          pending = pending.slice(newline + 1);
          let message;
          try { message = JSON.parse(line); } catch { message = null; }
          if (dropProbeStartResponse && message?.result?.turn?.id
            && String(message.id).startsWith("are-gateway:")) {
            dropProbeStartResponse = false;
            suppressedProbeStartResponse = true;
            continue;
          }
          filteredStdout.write(`${line}\n`);
        }
      });
      backend.stdout.on("end", () => filteredStdout.end());
      return {pid: backend.pid, stdin: backend.stdin, stdout: filteredStdout, stderr: backend.stderr,
        on: backend.on.bind(backend), kill: backend.kill.bind(backend)};
    },
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, lane, consumer_ref: consumer_id};
      profile.reasoning_state = deriveGatewayReasoningStateProfile(loaded.value, consumer_id, resolve(scratch, "reasoning-state"));
      const wrapped = createCodexAppServerWrapper({loaded_profile: profile,
        decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
        ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot});
      if (!completedNotificationLossMode) return wrapped;
      return {...wrapped, processServerMessage: async (message) => {
        if (dropProbeCompletion && message?.method === "turn/completed") {
          dropProbeCompletion = false;
          suppressedProbeCompletion = true;
          return {to_server: [], to_client: []};
        }
        return wrapped.processServerMessage(message);
      }};
    },
  };
  gateway = createPersistentGateway(gatewayOptions);
  await gateway.start();
  if (holdObservationTcpMode) {
    gatewayOptions.observation_tcp_port = gateway.observationAddress().port;
    observationPath = `tcp://127.0.0.1:${gatewayOptions.observation_tcp_port}`;
  }
  transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat", lane: "interaction-bound",
    ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {})});
  if (recoveryMode || clientIdRestartProbeMode || unknownAcceptanceProbeMode || gatewayAutoCompactionMarkerMode) {
    recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"), consumer_id: "codex:human-chat"});
    recoveryState.bind_gateway(await transport.ready);
  }
  const approvalBroker = createApprovalBroker();
  const userInputBroker = createUserInputBroker({timeout_ms: browserMode ? 240000 : 120000});
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000, completion_timeout_ms: 30000,
    server_request_timeout_ms: browserMode ? 240000 : 120000,
    approval_handler: (message, options) => approvalBroker.request(message, options),
    user_input_handler: (message, options) => {
      hostRequests.push({method: message.method, thread_id: message.params?.threadId, turn_id: message.params?.turnId,
        question_ids: message.params?.questions?.map((question) => question.id) ?? []});
      return userInputBroker.request(message, options);
    },
  });
  rpc.events.on("notification", (message) => notifications.push(message));
  host = createWindowsClientHost({rpc_client: rpc, approval_broker: approvalBroker, user_input_broker: userInputBroker,
    recovery_state: recoveryState,
    repository_root: checkoutRoot, default_cwd: checkoutRoot, assets_directory: resolve(packageRoot, "client"), port: 0,
    token: "are-native-user-input-fixture-token", thread_approval_policy: "on-request", thread_sandbox: "read-only"});
  if (initializeOptOutProbeMode) {
    let rejected = false;
    try {
      await rpc.request("initialize", {clientInfo: {name: "are_negative_probe", version: "0.1.0"},
        capabilities: {experimentalApi: true, optOutNotificationMethods: ["turn/completed"]}});
    } catch (error) {
      assert.equal(error?.details?.code, -32082, `canary.initialize-opt-out-unexpected-rejection:${String(error)}`);
      assert.deepEqual(error.details.data?.reason_codes, ["host.required-notification-opt-out"]);
      rejected = true;
    }
    assert.equal(rejected, true, "canary.initialize-opt-out-admitted");
    assert.equal(gateway.inspect().sessions[0]?.initialization_status, "not-started",
      "canary.unsafe-initialize-changed-host-state");
    report.initialize_notification_policy = {completion_opt_out_rejected: true,
      backend_not_initialized_by_rejected_request: true};
  }
  const ready = await host.start();
  const api = async (path, options = {}) => {
    const response = await fetch(new URL(path, ready.url), {method: options.method ?? "GET",
      headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
      ...(options.body ? {body: JSON.stringify(options.body)} : {})});
    const body = await response.json();
    assert.ok(response.ok && body.ok !== false, `canary.host-http-failed:${path}:${body.reason ?? response.status}:${body.detail ?? ""}`);
    return body.value ?? body;
  };
  const asset = await fetch(ready.url);
  assert.equal(asset.status, 200, "canary.host-ui-unavailable");
  const thread = await api("api/threads", {method: "POST", body: {cwd: checkoutRoot, model: "are-fixture",
    requestKey: "native-user-input-thread-start"}});
  assert.equal(gateway.inspect().sessions[0]?.initialization_status, "complete", "canary.backend-version-not-bound");
  report.backend_initialize_version_gate = "verified-for-live-transport";
  const threadId = thread.thread.id;
  diagnosticThreadId = threadId;
  if (threadCreationHistoryProbeMode) {
    let history;
    let fullHistoryError = null;
    try { history = await rpc.request("thread/read", {threadId, includeTurns: true}); }
    catch (error) { fullHistoryError = {code: error?.details?.code ?? null, message: error?.message ?? String(error)}; }
    const summary = await rpc.request("thread/read", {threadId, includeTurns: false});
    let turnsList;
    let turnsListError = null;
    let itemsList;
    let itemsListError = null;
    if (!history) {
      try { turnsList = await rpc.request("thread/turns/list", {threadId, limit: 1,
        itemsView: "summary", sortDirection: "desc"}); }
      catch (error) { turnsListError = {code: error?.details?.code ?? null, message: error?.message ?? String(error)}; }
      try { itemsList = await rpc.request("thread/items/list", {threadId}); }
      catch (error) { itemsListError = {code: error?.details?.code ?? null, message: error?.message ?? String(error)}; }
    }
    assert.equal(requests.length, 0, "canary.creation-history-called-provider");
    report.thread_creation_history_probe = {installed_host_read: true,
      summary_exact_thread_id: summary?.thread?.id === threadId,
      summary_thread_keys: Object.keys(summary?.thread ?? {}).sort(),
      summary_turns_is_array: Array.isArray(summary?.thread?.turns),
      summary_turn_count: Array.isArray(summary?.thread?.turns) ? summary.thread.turns.length : null,
      summary_history_mode: summary?.thread?.historyMode ?? null,
      full_history_error: fullHistoryError,
      full_history_empty: history?.thread?.id === threadId && Array.isArray(history?.thread?.turns)
        && history.thread.turns.length === 0,
      turns_list_error: turnsListError,
      turns_list_keys: turnsList ? Object.keys(turnsList).sort() : null,
      turns_list_empty: Array.isArray(turnsList?.data) && turnsList.data.length === 0
        && (turnsList.nextCursor === null || turnsList.nextCursor === undefined),
      items_list_error: itemsListError,
      items_list_keys: itemsList ? Object.keys(itemsList).sort() : null,
      provider_requests: 0,
      gateway_thread_owned: gateway.inspect().durable_session_index.sessions.some((session) =>
        session.consumer_id === "codex:human-chat"
          && session.thread_refs.includes(`backend-thread:${digestValue(threadId)}`))};
    assert.equal(report.thread_creation_history_probe.summary_exact_thread_id, true,
      "canary.creation-summary-thread-id-mismatch");
    assert.equal(report.thread_creation_history_probe.gateway_thread_owned, true,
      "canary.creation-history-thread-not-gateway-owned");
    assert.equal(report.thread_creation_history_probe.full_history_empty
      || report.thread_creation_history_probe.turns_list_empty, true,
      "canary.creation-empty-history-unverifiable");
  }
  if (!threadCreationHistoryProbeMode) {
  if (gatewayAutoCompactionMarkerMode) {
    const initialKey = "native-gateway-auto-compact-initial-turn";
    const initial = await rpc.request("turn/start", {threadId,
      input: [{type: "text", text: "Explain the repository routing architecture"}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}, {idempotency_key: initialKey});
    await rpc.waitForNotification((message) => message.method === "turn/completed"
      && message.params?.threadId === threadId && message.params?.turn?.id === initial.turn.id,
    {timeout_ms: 30000});
    const durableIntent = gateway.inspect().durable_session_index.sessions
      .find((entry) => entry.consumer_id === "codex:human-chat")?.requests
      .find((entry) => entry.request_key === initialKey);
    let marker = durableIntent?.client_message_id;
    assert.match(marker ?? "", /^are-gateway-client:[0-9a-f]{32}$/, "canary.auto-compaction-marker-not-gateway-owned");
    let targetTurnId = initial.turn.id;
    let lostStart = null;
    let lostRequestKey = null;
    let lostParams = null;
    let lostHostTurn = null;
    if (gatewayAutoCompactionLostResponseMode) {
      assert.equal(notifications.some((message) => message.method === "item/completed"
        && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction"), false,
      "canary.auto-compaction-before-lost-response-turn");
      lostRequestKey = "native-gateway-auto-compact-lost-response-turn";
      lostParams = {threadId, input: [{type: "text", text: "Explain the repository routing architecture, isolated lost response."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}};
      dropProbeStartResponse = true;
      let startAcknowledged = false;
      lostStart = rpc.request("turn/start", lostParams, {idempotency_key: lostRequestKey})
        .then(() => { startAcknowledged = true; }, () => {});
      const responseDeadline = Date.now() + 15000;
      while (!suppressedProbeStartResponse && Date.now() < responseDeadline) await delay(25);
      assert.equal(suppressedProbeStartResponse, true, "canary.auto-compaction-start-response-not-suppressed");
      const uncertain = gateway.inspect().durable_session_index.sessions
        .find((entry) => entry.consumer_id === "codex:human-chat")?.requests
        .find((entry) => entry.request_key === lostRequestKey);
      assert.equal(uncertain?.status, "outcome-unknown", "canary.auto-compaction-lost-turn-not-unknown");
      marker = uncertain.client_message_id;
      assert.match(marker ?? "", /^are-gateway-client:[0-9a-f]{32}$/,
        "canary.auto-compaction-lost-marker-not-gateway-owned");
      const historyDeadline = Date.now() + 30000;
      while (!lostHostTurn && Date.now() < historyDeadline) {
        const history = await rpc.request("thread/read", {threadId, includeTurns: true});
        lostHostTurn = (history?.thread?.turns ?? []).find((turn) => turn.status === "completed"
          && (turn.items ?? []).some((item) => item.type === "userMessage" && item.clientId === marker));
        if (!lostHostTurn) await delay(100);
      }
      assert.ok(lostHostTurn, "canary.auto-compaction-lost-turn-not-completed-in-host-history");
      assert.equal(startAcknowledged, false, "canary.auto-compaction-lost-response-was-acknowledged");
      targetTurnId = lostHostTurn.id;
    } else {
      for (let index = 0; index < 7 && !notifications.some((message) => message.method === "item/completed"
        && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction"); index++) {
        const next = await rpc.request("turn/start", {threadId,
          input: [{type: "text", text: `Explain the repository routing architecture, isolated step ${index + 1}.`}],
          approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}},
        {idempotency_key: `native-gateway-auto-compact-followup-${index + 1}`});
        await rpc.waitForNotification((message) => message.method === "turn/completed"
          && message.params?.threadId === threadId && message.params?.turn?.id === next.turn.id,
        {timeout_ms: 30000});
      }
    }
    const compactions = notifications.filter((message) => message.method === "item/completed"
      && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction");
    if (lostHostTurn) compactions.push(...(lostHostTurn.items ?? []).filter((item) => item.type === "contextCompaction"));
    assert.ok(compactions.length >= 1, "canary.gateway-automatic-compaction-not-observed");
    if (gatewayCrashBeforeRecoveryMode) {
      const decisionsBeforeCrash = await readGatewayDecisionObservation({socket_path: observationPath,
        token: observationToken});
      assert.ok(Number.isInteger(backend?.pid), "canary.hard-crash-backend-pid-missing");
      const backendBirthRef = backendProcessBirthSupported() ? backendProcessBirthRef(backend.pid) : null;
      if (backendProcessBirthSupported()) assert.match(backendBirthRef, /^[0-9a-f]{64}$/u);
      assert.deepEqual(gateway.inspect().durable_session_index.sessions.find((entry) =>
        entry.consumer_id === "codex:human-chat")?.backend_process_identity,
      {host_name: hostname(), process_id: backend.pid,
        ...(backendBirthRef ? {birth_ref: backendBirthRef} : {})}, "canary.hard-crash-backend-identity-not-durable");
      const statePath = resolve(scratch, "hard-crash-state.json");
      writeFileSync(statePath, `${JSON.stringify({schema_version: "are.native-gateway-hard-crash-state/v1",
        mode: "completed-lost-response",
        scratch, binary, expected_version: expectedVersion, backend_pid: backend.pid,
        backend_birth_ref: backendBirthRef,
        thread_id: threadId, turn_id: targetTurnId, client_message_id: marker,
        request_key: lostRequestKey, request_params: lostParams,
        provider_requests_before_crash: requests.length, compaction_item_count: compactions.length,
        decision_count_before_crash: decisionsBeforeCrash.decision_count,
        decision_digests_before_crash: decisionsBeforeCrash.decisions.map((entry) => entry.decision_digest)})}\n`,
      {mode: 0o600, flag: "wx"});
      process.stderr.write(`ARE_NATIVE_GATEWAY_CRASH_READY ${JSON.stringify({state_path: statePath,
        backend_pid: backend.pid})}\n`);
      await new Promise(() => {});
    }
    const matchingTurns = (history) => (history?.thread?.turns ?? []).flatMap((entry) => (entry.items ?? [])
      .filter((item) => item.type === "userMessage" && item.clientId === marker)
      .map(() => entry.id));
    if (!gatewayAutoCompactionLostResponseMode) {
      const history = await rpc.request("thread/read", {threadId, includeTurns: true});
      assert.deepEqual(matchingTurns(history), [targetTurnId], "canary.gateway-marker-lost-after-automatic-compaction");
    }
    const previousBackendPid = backend?.pid;
    const previousGatewayEpoch = gateway.inspect().runtime_epoch_id;
    const providerRequestsBeforeRestart = requests.length;
    const decisionsBeforeAutoCompactionRestart = gatewayAutoCompactionLostResponseMode
      ? await readGatewayDecisionObservation({socket_path: observationPath, token: observationToken}) : null;
    await host.close();
    host = null;
    rpc = null;
    transport = null;
    recoveryState.close();
    await gateway.close();
    if (lostStart) await lostStart;
    gateway = createPersistentGateway(gatewayOptions);
    await gateway.start();
    recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"),
      consumer_id: "codex:human-chat"});
    transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
      lane: "interaction-bound", resume_token: recoveryState.resume_token(),
      ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {})});
    const resumed = await transport.ready;
    assert.equal(resumed.resumed, true, "canary.gateway-auto-compaction-session-not-resumed");
    assert.equal(resumed.session_recovery?.gateway_delivery, "recovered-after-restart",
      "canary.gateway-auto-compaction-session-not-recovered-after-restart");
    recoveryState.bind_gateway(resumed);
    rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000});
    host = createWindowsClientHost({rpc_client: rpc, approval_broker: createApprovalBroker(),
      user_input_broker: createUserInputBroker(), recovery_state: recoveryState,
      repository_root: checkoutRoot, default_cwd: checkoutRoot,
      assets_directory: resolve(packageRoot, "client"), port: 0,
      token: "are-native-auto-compaction-restarted-fixture-token", thread_approval_policy: "on-request",
      thread_sandbox: "read-only"});
    await host.start();
    if (gatewayAutoCompactionLostResponseMode) {
      for (const [key, reason] of [[lostRequestKey, "gateway.dispatch-outcome-unknown"],
        ["native-gateway-auto-compact-new-turn", "gateway.session-outcome-unknown"]]) {
        let rejected = false;
        try { await rpc.request("turn/start", lostParams, {idempotency_key: key}); }
        catch (error) {
          assert.deepEqual(error?.details?.data?.reason_codes, [reason],
            `canary.auto-compaction-unexpected-retry-rejection:${key}`);
          rejected = true;
        }
        assert.equal(rejected, true, `canary.auto-compaction-unsafe-retry-admitted:${key}`);
      }
      assert.equal(requests.length, providerRequestsBeforeRestart,
        "canary.auto-compaction-unsafe-retry-reached-provider");
    }
    const restartedHistory = await rpc.request("thread/read", {threadId, includeTurns: true});
    assert.deepEqual(matchingTurns(restartedHistory), [targetTurnId],
      "canary.gateway-marker-lost-after-automatic-compaction-restart");
    if (gatewayAutoCompactionLostResponseMode) {
      const observed = gateway.inspect().durable_session_index.sessions
        .find((entry) => entry.consumer_id === "codex:human-chat")?.host_observations
        .filter((entry) => entry.kind === "turn-marker-observed"
          && entry.request_key_digest === digestValue(lostRequestKey)) ?? [];
      assert.equal(observed.length, 1, "canary.auto-compaction-marker-observation-not-durable");
      assert.equal(observed[0].turn_ref, digestValue(targetTurnId),
        "canary.auto-compaction-marker-observation-wrong-turn");
      assert.equal(observed[0].turn_status, "completed",
        "canary.auto-compaction-marker-observation-not-terminal");
      const recovered = await rpc.request(GATEWAY_TURN_RECOVERY_GET, {threadId, requestKey: lostRequestKey,
        requestBindingDigest: digestValue({method: "turn/start", params: lostParams})});
      assert.equal(recovered.recovery.turn_id, targetTurnId, "canary.auto-compaction-recovery-wrong-turn");
      const confirmed = await rpc.request(GATEWAY_TURN_RECOVERY_CONFIRM, {receipt: recovered.recovery});
      assert.equal(confirmed.confirmed, true, "canary.auto-compaction-recovery-not-confirmed");
      const recoveredSession = gateway.inspect().durable_session_index.sessions
        .find((entry) => entry.consumer_id === "codex:human-chat");
      assert.equal(recoveredSession?.requests.find((entry) => entry.request_key === lostRequestKey)?.status,
        "recovered", "canary.auto-compaction-recovery-not-durable");
      const projectedRecovery = await readGatewayThreadObservation({socket_path: observationPath,
        token: observationToken});
      const recoveredThread = projectedRecovery.threads.find((entry) =>
        entry.thread_ref === `backend-thread:${digestValue(threadId)}`);
      assert.equal(recoveredThread?.recovered_dispatch_count, 1,
        "canary.auto-compaction-recovery-not-projected-to-thread");
      assert.equal(projectedRecovery.unknown_dispatch_count, 0,
        "canary.auto-compaction-recovered-dispatch-still-unknown");
      const projectedDecisions = await readGatewayDecisionObservation({socket_path: observationPath,
        token: observationToken});
      assert.equal(projectedDecisions.runtime_epoch_id, projectedRecovery.runtime_epoch_id,
        "canary.auto-compaction-recovered-decision-epoch-mismatch");
      assertPriorDecisionsPreserved(decisionsBeforeAutoCompactionRestart, projectedDecisions);
      let replayRejected = false;
      try { await rpc.request("turn/start", lostParams, {idempotency_key: lostRequestKey}); }
      catch (error) {
        assert.deepEqual(error?.details?.data?.reason_codes, ["gateway.dispatch-recovered-no-host-response"]);
        replayRejected = true;
      }
      assert.equal(replayRejected, true, "canary.auto-compaction-recovered-response-synthesized");
      report.gateway_auto_compaction_lost_response_probe = {host_start_response_suppressed: true,
        compaction_item_count: compactions.length, unique_marker_after_restart: true,
        durable_marker_observation_count: observed.length, semantic_recovery_confirmed: true,
        durable_dispatch_recovered: true, thread_recovery_projection_verified: true,
        same_key_retry_rejected: true, new_key_turn_rejected_while_unknown: true,
        gateway_and_backend_restarted: true, provider_redispatch_after_recovery: false};
      report.observation_after_restart = {runtime_epoch_id: projectedRecovery.runtime_epoch_id,
        thread_count: projectedRecovery.thread_count, thread_phase: recoveredThread.phase,
        recovered_dispatch_count: projectedRecovery.recovered_dispatch_count,
        decision_count: projectedDecisions.decision_count,
        prior_decision_observations_preserved: true};
      await holdForCompanion("after-restart");
    }
    assert.ok(backend?.pid && backend.pid !== previousBackendPid,
      "canary.gateway-auto-compaction-backend-not-restarted");
    assert.notEqual(gateway.inspect().runtime_epoch_id, previousGatewayEpoch,
      "canary.gateway-auto-compaction-epoch-not-rotated");
    assert.equal(requests.length, providerRequestsBeforeRestart, "canary.gateway-auto-compaction-redispatched-provider");
    if (!gatewayAutoCompactionLostResponseMode) report.gateway_auto_compaction_marker_probe = {
      marker_origin: "gateway-owned-durable-intent", compaction_item_count: compactions.length,
      unique_marker_after_compaction: true, unique_marker_after_restart: true,
      gateway_and_backend_restarted: true, provider_redispatch_after_restart: false};
  } else {
  async function rejectWritableLifecycle(method, params, requestKey) {
    let rejected = false;
    try {
      await rpc.request(method, params, {idempotency_key: requestKey});
    } catch (error) {
      assert.equal(error?.details?.code, -32082, `canary.${method}-unexpected-rejection:${String(error)}`);
      assert.deepEqual(error.details.data?.reason_codes, ["host.sandbox-policy-unsafe"],
        `canary.${method}-unexpected-reason`);
      rejected = true;
    }
    assert.equal(rejected, true, `canary.${method}-writable-policy-admitted`);
  }
  await rejectWritableLifecycle("thread/start", {cwd: checkoutRoot, model: "are-fixture",
    approvalPolicy: "on-request", sandbox: "workspace-write"}, "native-unsafe-thread-start");
  await rejectWritableLifecycle("turn/start", {threadId, input: [{type: "text", text: "Unsafe policy probe"}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "workspaceWrite"}}, "native-unsafe-turn-start");
  assert.equal(requests.length, 0, "canary.unsafe-policy-reached-provider");
  report.lifecycle_policy = {writable_thread_start_rejected: true,
    writable_turn_start_rejected: true, provider_requests_before_safe_turn: requests.length};
  const turn = await rpc.request("turn/start", {threadId, input: [{type: "text", text: "Explain the repository routing architecture"}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
    collaborationMode: {mode: "plan", settings: {model: "are-fixture", reasoning_effort: null, developer_instructions: null}}},
  {idempotency_key: "native-user-input-turn-start"});
  const turnId = turn.turn.id;
  const promptDeadline = Date.now() + 15000;
  let pendingInput;
  while (Date.now() < promptDeadline) {
    const state = await api("api/state");
    pendingInput = state.pending_user_inputs.find((entry) => entry.thread_id === threadId && entry.turn_id === turnId);
    if (pendingInput) break;
    await delay(25);
  }
  assert.ok(pendingInput, "canary.host-ui-prompt-missing");
  const activeRuntime = await api(`api/threads/${encodeURIComponent(threadId)}/runtime`);
  assert.equal(activeRuntime.disposition, "active", "canary.active-turn-not-observed");
  const duplicate = await fetch(new URL("api/turns", ready.url), {method: "POST",
    headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
    body: JSON.stringify({threadId, text: "duplicate while pending", requestKey: "native-user-input-duplicate"})});
  assert.equal(duplicate.status, 409, "canary.active-turn-duplicate-not-blocked");
  assert.equal((await duplicate.json()).reason, "windows-client.turn-not-reconciled");
  report.active_runtime = {disposition: activeRuntime.disposition, turn_id_matches: activeRuntime.turn_id === turnId,
    duplicate_start_denied: true};
  if (holdActiveObservationMode) {
    const readOptions = {socket_path: observationPath, token: observationToken};
    const [threads, decisions] = await Promise.all([
      readGatewayThreadObservation(readOptions), readGatewayDecisionObservation(readOptions),
    ]);
    assert.equal(threads.scope, "gateway-backend-threads-not-host-activation");
    assert.equal(threads.thread_count, 1, "canary.active-observation-thread-missing");
    assert.equal(threads.threads[0].thread_ref, `backend-thread:${digestValue(threadId)}`);
    assert.equal(threads.threads[0].phase, "turn-active", "canary.active-observation-phase-mismatch");
    assert.equal(threads.threads[0].latest_frontier_digest, null, "canary.active-observation-false-frontier");
    assert.equal(decisions.runtime_epoch_id, threads.runtime_epoch_id);
    assert.ok(decisions.decision_count > 0, "canary.active-observation-decisions-missing");
    report.observation_during_active_turn = {phase: threads.threads[0].phase,
      thread_count: threads.thread_count, decision_count: decisions.decision_count,
      completed_frontier_present: false};
    await holdForCompanion("active-turn");
  }
  const answers = Object.create(null);
  for (const question of pendingInput.questions) {
    assert.ok(question.options?.some((option) => option.label === "Continue"));
    answers[question.id] = {answers: ["Continue"]};
  }
  if (browserMode) {
    process.stderr.write(`ARE_BROWSER_LAUNCH ${ready.url}#token=${host.token}\n`);
    const browserDeadline = Date.now() + 180000;
    while (Date.now() < browserDeadline && userInputBroker.snapshot().some((entry) => entry.request_id === pendingInput.request_id)) await delay(100);
    assert.ok(!userInputBroker.snapshot().some((entry) => entry.request_id === pendingInput.request_id), "canary.browser-answer-timeout");
  } else {
    const answerReceipt = await api(`api/user-input/${encodeURIComponent(pendingInput.request_id)}`,
      {method: "POST", body: {answers}});
    assert.equal(answerReceipt.request_id, pendingInput.request_id, "canary.host-ui-answer-unbound");
  }
  const completed = await rpc.waitForNotification((message) => message.method === "turn/completed" &&
    message.params?.threadId === threadId && message.params?.turn?.id === turnId, {timeout_ms: 30000});
  assert.equal(completed.params.turn.status, "completed", "canary.turn-not-completed");
  const idleRuntime = await api(`api/threads/${encodeURIComponent(threadId)}/runtime`);
  assert.equal(idleRuntime.disposition, "idle", "canary.terminal-turn-not-reconciled");
  assert.equal(requests.length, 2, "canary.provider-request-count");
  assert.equal(hostRequests.length, 1, "canary.host-request-count");
  assert.equal(hostRequests[0].thread_id, threadId, "canary.host-thread-mismatch");
  assert.equal(hostRequests[0].turn_id, turnId, "canary.host-turn-mismatch");
  assert.ok(notifications.some((message) => message.method === "serverRequest/resolved" && message.params?.threadId === threadId),
    "canary.server-request-resolution-missing");
  report.host_request = hostRequests[0];
  report.host_ui = {asset_status: asset.status, pending_prompt_observed: true, authenticated_answer_accepted: true,
    pending_after_answer: (await api("api/state")).pending_user_inputs.length,
    browser_interaction: browserMode};
  report.provider_requests = requests.length;
  report.server_request_resolved = true;
  report.turn_status = completed.params.turn.status;
  report.observation_before_restart = await observeGatewayThread(threadId, {requireDecision: true});
  await holdForCompanion("before-restart");
  if (process.argv.includes("--history-probe")) {
    const page = await rpc.request("thread/turns/list", {threadId, limit: 1, itemsView: "summary", sortDirection: "desc"});
    report.history_probe = {turns: page.data?.length ?? null, next_cursor_present: Boolean(page.nextCursor),
      items_view: page.data?.[0]?.itemsView ?? null,
      items: page.data?.[0]?.items?.map((item) => ({type: item.type,
        text_length: typeof item.text === "string" ? item.text.length : null,
        user_text_lengths: item.type === "userMessage" ? item.content?.filter((part) => part.type === "text").map((part) => part.text?.length ?? null) : null})) ?? []};
  }
  if (recoveryMode) {
    const replayBody = {threadId, text: "Explain the repository routing architecture", requestKey: "turn:11111111-1111-4111-8111-111111111111"};
    if (completedNotificationLossMode) dropProbeCompletion = true;
    const probe = await api("api/turns", {method: "POST", body: replayBody});
    const probeTurnId = probe.turn.id;
    let terminalDecisionsBeforeRestart = null;
    if (interruptedTurnRecoveryMode) {
      const deadline = Date.now() + 15000;
      let interruptedPrompt;
      while (Date.now() < deadline) {
        interruptedPrompt = (await api("api/state")).pending_user_inputs.find((entry) =>
          entry.thread_id === threadId && entry.turn_id === probeTurnId);
        if (interruptedPrompt) break;
        await delay(25);
      }
      assert.ok(interruptedPrompt, "canary.interrupted-turn-prompt-missing");
      assert.equal((await api(`api/threads/${encodeURIComponent(threadId)}/runtime`)).disposition,
        "active", "canary.interrupted-turn-not-active");
      terminalDecisionsBeforeRestart = await readGatewayDecisionObservation({socket_path: observationPath,
        token: observationToken});
      if (gatewayCrashActiveTurnMode) {
        assert.ok(Number.isInteger(backend?.pid), "canary.active-hard-crash-backend-pid-missing");
        const backendBirthRef = backendProcessBirthSupported() ? backendProcessBirthRef(backend.pid) : null;
        if (backendProcessBirthSupported()) assert.match(backendBirthRef, /^[0-9a-f]{64}$/u);
        assert.deepEqual(gateway.inspect().durable_session_index.sessions.find((entry) =>
          entry.consumer_id === "codex:human-chat")?.backend_process_identity,
        {host_name: hostname(), process_id: backend.pid,
          ...(backendBirthRef ? {birth_ref: backendBirthRef} : {})}, "canary.active-hard-crash-backend-identity-not-durable");
        const statePath = resolve(scratch, "hard-crash-state.json");
        writeFileSync(statePath, `${JSON.stringify({schema_version: "are.native-gateway-hard-crash-state/v1",
          mode: "active-turn", scratch, binary, expected_version: expectedVersion,
          backend_pid: backend.pid, backend_birth_ref: backendBirthRef,
          thread_id: threadId, turn_id: probeTurnId,
          request_key: replayBody.requestKey, provider_requests_before_crash: requests.length,
          prior_frontier_digest: report.observation_before_restart.latest_frontier_digest,
          decision_count_before_crash: terminalDecisionsBeforeRestart.decision_count,
          decision_digests_before_crash: terminalDecisionsBeforeRestart.decisions
            .map((entry) => entry.decision_digest)})}\n`,
        {mode: 0o600, flag: "wx"});
        process.stderr.write(`ARE_NATIVE_GATEWAY_CRASH_READY ${JSON.stringify({state_path: statePath,
          backend_pid: backend.pid})}\n`);
        await new Promise(() => {});
      }
      assert.equal(backend.kill("SIGKILL"), true, "canary.interrupted-backend-kill-failed");
      await Promise.race([
        new Promise((resolveExit) => backend.once("exit", resolveExit)),
        delay(10000).then(() => { throw new Error("canary.interrupted-backend-exit-timeout"); }),
      ]);
      report.interrupted_turn = {host_turn_accepted: true, pending_user_input_observed: true,
        backend_terminated_before_answer: true};
    } else if (completedNotificationLossMode) {
      const deadline = Date.now() + 30000;
      while (!suppressedProbeCompletion && Date.now() < deadline) await delay(25);
      assert.equal(suppressedProbeCompletion, true, "canary.completed-host-notification-not-suppressed");
      assert.equal(dropProbeCompletion, false, "canary.completed-notification-loss-not-one-shot");
      terminalDecisionsBeforeRestart = await readGatewayDecisionObservation({socket_path: observationPath,
        token: observationToken});
      report.completed_notification_loss = {host_turn_accepted: true,
        host_completion_notification_suppressed_before_are: true};
    } else {
      await rpc.waitForNotification((message) => message.method === "turn/completed" &&
        message.params?.threadId === threadId && message.params?.turn?.id === probeTurnId, {timeout_ms: 30000});
    }
    assert.equal(requests.length, 3, "canary.hosted-probe-provider-count");
    await host.close();
    host = null;
    rpc = null;
    transport = null;
    recoveryState.close();
    if (gatewayRecoveryMode) {
      await gateway.close();
      gateway = createPersistentGateway(gatewayOptions);
      await gateway.start();
    }
    recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"), consumer_id: "codex:human-chat"});
    transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
      lane: "interaction-bound", resume_token: recoveryState.resume_token(),
      ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {})});
    const resumedReceipt = await transport.ready;
    assert.equal(resumedReceipt.resumed, true, "canary.gateway-session-not-resumed");
    if (gatewayRecoveryMode) assert.equal(resumedReceipt.session_recovery?.gateway_delivery, "recovered-after-restart", "canary.gateway-restart-not-recovered");
    recoveryState.bind_gateway(resumedReceipt);
    const recoveredApprovals = createApprovalBroker();
    const recoveredUserInputs = createUserInputBroker();
    rpc = createAppServerRpcClient({transport,
      approval_handler: (message, options) => recoveredApprovals.request(message, options),
      user_input_handler: (message, options) => recoveredUserInputs.request(message, options),
    });
    host = createWindowsClientHost({rpc_client: rpc, approval_broker: recoveredApprovals, user_input_broker: recoveredUserInputs,
      recovery_state: recoveryState, repository_root: checkoutRoot, default_cwd: checkoutRoot,
      assets_directory: resolve(packageRoot, "client"), port: 0, token: "are-native-user-input-recovered-fixture-token",
      thread_approval_policy: "on-request", thread_sandbox: "read-only"});
    const recoveredReady = await host.start();
    const recoveredGet = async (path, options = {}) => {
      const response = await fetch(new URL(path, recoveredReady.url), {method: options.method ?? "GET",
        headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
        ...(options.body ? {body: JSON.stringify(options.body)} : {})});
      const body = await response.json();
      assert.ok(response.ok && body.ok !== false, `canary.recovered-http-failed:${path}:${body.reason ?? response.status}:${body.detail ?? ""}`);
      return body.value ?? body;
    };
    const state = await recoveredGet("api/state");
    assert.deepEqual(state.thread_ids, [threadId], "canary.recovered-thread-identity-mismatch");
    assert.equal(state.recovery_mode, "private-file");
    assert.equal(state.pending_turn, null, "canary.accepted-intent-not-settled");
    assert.equal(state.last_turn_result?.request_key, replayBody.requestKey, "canary.accepted-receipt-not-restored");
    assert.equal(state.last_turn_result?.text_digest, sha256(replayBody.text), "canary.accepted-receipt-text-mismatch");
    assert.equal(state.last_turn_result?.turn_id, probeTurnId, "canary.accepted-receipt-turn-mismatch");
    assert.equal(JSON.stringify(state.last_turn_result).includes(replayBody.text), false, "canary.accepted-receipt-leaked-content");
    const rejoined = await recoveredGet("api/threads/resume", {method: "POST",
      body: {threadId, requestKey: "native-user-input-recovered-resume"}});
    assert.equal(rejoined.thread.id, threadId, "canary.native-thread-rejoin-mismatch");
    const replayed = await recoveredGet("api/turns", {method: "POST", body: replayBody});
    assert.equal(replayed.turn.id, probeTurnId, "canary.stable-hosted-turn-not-replayed");
    assert.equal(replayed.recovered_from_receipt, true, "canary.accepted-receipt-not-used");
    assert.equal(requests.length, 3, "canary.stable-replay-dispatched-provider-again");
    assert.equal((await recoveredGet("api/state")).pending_turn, null, "canary.pending-intent-not-cleared");
    if (terminalRecoveryMode) {
      const unsafeNext = await fetch(new URL("api/turns", recoveredReady.url), {method: "POST",
        headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
        body: JSON.stringify({threadId, text: "Research the next step after host recovery",
          requestKey: "turn:22222222-2222-4222-8222-222222222222"})});
      assert.equal(unsafeNext.status, 409, "canary.unsettled-turn-accepted-before-history");
      assert.equal((await unsafeNext.json()).reason, "windows-client.reasoning-recovery-unverified");
      assert.equal((await recoveredGet("api/state")).pending_turn, null,
        "canary.definite-recovery-refusal-stranded-client-intent");
      assert.equal(requests.length, 3, "canary.unsettled-turn-reached-provider");
    }
    const history = await recoveredGet(`api/threads/${encodeURIComponent(threadId)}/history`);
    const recoveredRuntime = await recoveredGet(`api/threads/${encodeURIComponent(threadId)}/runtime`);
    if (terminalRecoveryMode) {
      const hostHistory = await rpc.request("thread/read", {threadId, includeTurns: true});
      const recoveredTurn = hostHistory?.thread?.turns?.filter((entry) => entry.id === probeTurnId) ?? [];
      assert.equal(recoveredTurn.length, 1, "canary.recovered-turn-history-ambiguous");
      assert.ok(completedNotificationLossMode ? recoveredTurn[0].status === "completed"
        : ["interrupted", "failed"].includes(recoveredTurn[0].status),
      `canary.recovered-turn-not-expected-terminal:${recoveredTurn[0].status}`);
      assert.equal(recoveredRuntime.disposition, "idle", "canary.recovered-terminal-runtime-not-idle");
      assert.equal(requests.length, 3, "canary.unsettled-turn-reached-provider");
      const reportKey = completedNotificationLossMode ? "completed_notification_loss" : "interrupted_turn";
      report[reportKey] = {...report[reportKey], host_history_terminal: recoveredTurn[0].status,
        same_key_replayed_without_redispatch: true, runtime_reconciled: true,
        prehistory_turn_fail_closed_without_stuck_intent: true};
    } else assert.equal(recoveredRuntime.disposition, "idle", "canary.recovered-runtime-not-idle");
    assert.equal(history.thread_id, threadId, "canary.recovered-history-thread-mismatch");
    assert.ok(history.messages.some((entry) => entry.role === "user" && entry.text.includes("Explain the repository routing architecture")),
      "canary.recovered-user-message-missing");
    assert.ok(history.messages.some((entry) => entry.role === "agent" && entry.text.includes("ARE_USER_INPUT_NATIVE_OK")),
      "canary.recovered-agent-message-missing");
    const external = await fetch(new URL("api/threads/resume", recoveredReady.url), {method: "POST",
      headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
      body: JSON.stringify({threadId: "unrelated-desktop-task", requestKey: "native-user-input-external-resume"})});
    assert.equal(external.status, 409, "canary.external-thread-was-not-rejected");
    if (terminalRecoveryMode) {
      const [observed, decisions] = await Promise.all([
        readGatewayThreadObservation({socket_path: observationPath, token: observationToken}),
        readGatewayDecisionObservation({socket_path: observationPath, token: observationToken}),
      ]);
      const row = observed.threads.find((entry) => entry.thread_ref === `backend-thread:${digestValue(threadId)}`);
      assert.ok(row, "canary.recovered-reasoning-thread-missing");
      assert.equal(row.phase, "recovery-terminal", "canary.recovered-reasoning-state-not-distinctly-reconciled");
      assert.equal(row.latest_frontier_digest, report.observation_before_restart.latest_frontier_digest,
        "canary.recovered-turn-fabricated-completion-frontier");
      const recoveredReport = completedNotificationLossMode ? report.completed_notification_loss : report.interrupted_turn;
      assert.equal(row.recovery_host_status, recoveredReport.host_history_terminal,
        "canary.exact-recovered-turn-host-status-not-projected");
      const durableHostHistory = readFileSync(resolve(scratch, "gateway-session-store.jsonl"), "utf8").trim().split("\n")
        .map((line) => JSON.parse(line)).filter((entry) => entry.event_kind === "host-observation")
        .map((entry) => entry.content?.observation).filter((entry) => entry?.kind === "turn-history-verified"
          && entry.turn_ref === digestValue(probeTurnId) && entry.turn_status === recoveredReport.host_history_terminal);
      assert.equal(durableHostHistory.length, 1,
        "canary.accepted-recovered-host-turn-history-not-durable");
      assert.ok(row.verified_host_turn_count >= 1,
        "canary.recovered-host-turn-not-projected");
      assert.ok(row.latest_host_observation_digest,
        "canary.recovered-host-history-receipt-missing");
      assert.equal(row.recovery_host_observation_digest, durableHostHistory[0].observation_digest,
        "canary.recovered-turn-host-receipt-not-exact");
      assert.equal(decisions.runtime_epoch_id, observed.runtime_epoch_id, "canary.interrupted-decision-epoch-mismatch");
      assert.ok(terminalDecisionsBeforeRestart?.decision_count > 0,
        "canary.terminal-decision-observations-before-restart-missing");
      assert.equal(decisions.decision_count, terminalDecisionsBeforeRestart.decision_count,
        "canary.reconciliation-created-or-lost-decision-observation");
      assert.deepEqual(decisionIdentities(decisions), decisionIdentities(terminalDecisionsBeforeRestart),
        "canary.reconciliation-changed-decision-observation-identity");
      report.observation_after_restart = {runtime_epoch_id: observed.runtime_epoch_id,
        thread_count: observed.thread_count, thread_phase: row.phase,
        exact_recovered_host_history_receipts: durableHostHistory.length,
        exact_recovered_turn_host_status: row.recovery_host_status,
        decision_count: decisions.decision_count,
        prior_decision_observations_recovered_without_reconciliation_additions: true};
    } else report.observation_after_restart = await observeGatewayThread(threadId);
    await holdForCompanion("after-restart");
    if (terminalRecoveryMode) {
      const next = await recoveredGet("api/turns", {method: "POST", body: {threadId,
        text: "Research the next step after host recovery",
        requestKey: "turn:33333333-3333-4333-8333-333333333333"}});
      assert.ok(next.turn?.id && next.turn.id !== probeTurnId, "canary.new-turn-not-distinct-after-recovery");
      const nextCompleted = await rpc.waitForNotification((message) => message.method === "turn/completed"
        && message.params?.threadId === threadId && message.params?.turn?.id === next.turn.id,
      {timeout_ms: 30000});
      assert.equal(nextCompleted.params.turn.status, "completed", "canary.new-turn-not-completed");
      assert.equal(requests.length, 4, "canary.new-turn-not-dispatched-exactly-once");
      const afterNext = await readGatewayThreadObservation({socket_path: observationPath, token: observationToken});
      const nextRow = afterNext.threads.find((entry) => entry.thread_ref === `backend-thread:${digestValue(threadId)}`);
      assert.equal(nextRow?.phase, "turn-completed", "canary.new-completion-did-not-supersede-recovery-phase");
      assert.ok(nextRow.latest_frontier_digest
        && nextRow.latest_frontier_digest !== report.observation_before_restart.latest_frontier_digest,
      "canary.new-turn-frontier-not-distinct");
      report[completedNotificationLossMode ? "completed_notification_loss" : "interrupted_turn"].next_user_turn_after_reconciliation = true;
    }
    if (gatewayRecoveryMode) {
      assert.notEqual(report.observation_before_restart.runtime_epoch_id,
        report.observation_after_restart.runtime_epoch_id, "canary.gateway-runtime-epoch-not-rotated");
    }
    report.recovery = {gateway_session_resumed: true, gateway_process_restarted: gatewayRecoveryMode,
      owned_thread_rejoined: true, history_projected: true, runtime_reconciled: true,
      same_key_replayed_without_redispatch: true, accepted_receipt_restored: true,
      external_thread_denied: true};
    if (browserRecoveryMode) {
      process.stderr.write(`ARE_RECOVERED_BROWSER_LAUNCH ${recoveredReady.url}#token=${host.token}\n`);
      await delay(90000);
      assert.equal(requests.length, 3, "canary.browser-replay-dispatched-provider-again");
      assert.equal(report.provider_error, undefined, "canary.browser-replay-provider-error");
    }
  }
  if (clientIdProbeMode || clientIdRestartProbeMode) {
    const suppliedClientId = clientIdRestartProbeMode ? null : `are-client-id:${randomBytes(16).toString("hex")}`;
    const started = await rpc.request("turn/start", {threadId,
      input: [{type: "text", text: "Explain the repository routing architecture"}],
      ...(suppliedClientId ? {clientUserMessageId: suppliedClientId} : {}), approvalPolicy: "on-request",
      sandboxPolicy: {type: "readOnly"}}, {idempotency_key: "native-client-id-echo-probe"});
    assert.ok(started?.turn?.id, "canary.client-id-probe-turn-unaccepted");
    const durableIntent = clientIdRestartProbeMode ? gateway.inspect().durable_session_index.sessions
      .find((entry) => entry.consumer_id === "codex:human-chat")?.requests
      .find((entry) => entry.request_key === "native-client-id-echo-probe") : null;
    const clientId = suppliedClientId ?? durableIntent?.client_message_id;
    assert.ok(clientIdRestartProbeMode ? /^are-gateway-client:[0-9a-f]{32}$/.test(clientId ?? "")
      : /^are-client-id:[0-9a-f]{32}$/.test(clientId ?? ""), "canary.client-id-origin-invalid");
    const finished = await rpc.waitForNotification((message) => message.method === "turn/completed"
      && message.params?.threadId === threadId && message.params?.turn?.id === started.turn.id,
    {timeout_ms: 30000});
    assert.equal(finished.params.turn.status, "completed", "canary.client-id-probe-not-completed");
    const history = await rpc.request("thread/read", {threadId, includeTurns: true});
    const turns = history?.thread?.turns?.filter((turn) => turn.id === started.turn.id) ?? [];
    assert.equal(turns.length, 1, "canary.client-id-probe-turn-history-ambiguous");
    const matching = turns[0].items?.filter((item) => item.type === "userMessage" && item.clientId === clientId) ?? [];
    report.client_id_probe = {host_turn_completed: true, exact_turn_found: true,
      marker_origin: clientIdRestartProbeMode ? "gateway-owned-durable-intent" : "caller-supplied-schema-probe",
      matching_user_message_client_id_count: matching.length,
      request_key_visible_in_history: JSON.stringify(turns[0]).includes("native-client-id-echo-probe")};
    assert.equal(matching.length, 1, "canary.client-id-not-echoed-uniquely-in-history");
    assert.equal(report.client_id_probe.request_key_visible_in_history, false,
      "canary.gateway-request-key-leaked-to-host-history");
    if (clientIdRestartProbeMode) {
      const previousBackendPid = backend?.pid;
      const previousGatewayEpoch = gateway.inspect().runtime_epoch_id;
      assert.ok(previousBackendPid, "canary.client-id-original-backend-pid-missing");
      await host.close();
      host = null;
      rpc = null;
      transport = null;
      recoveryState.close();
      await gateway.close();
      gateway = createPersistentGateway(gatewayOptions);
      await gateway.start();
      recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"),
        consumer_id: "codex:human-chat"});
      transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
        lane: "interaction-bound", resume_token: recoveryState.resume_token(),
        ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {})});
      const resumed = await transport.ready;
      assert.equal(resumed.resumed, true, "canary.client-id-session-not-resumed");
      assert.equal(resumed.session_recovery?.gateway_delivery, "recovered-after-restart",
        "canary.client-id-gateway-not-restarted");
      recoveryState.bind_gateway(resumed);
      rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000});
      const approvals = createApprovalBroker();
      const userInputs = createUserInputBroker();
      host = createWindowsClientHost({rpc_client: rpc, approval_broker: approvals, user_input_broker: userInputs,
        recovery_state: recoveryState, repository_root: checkoutRoot, default_cwd: checkoutRoot,
        assets_directory: resolve(packageRoot, "client"), port: 0,
        token: "are-native-client-id-restarted-fixture-token", thread_approval_policy: "on-request",
        thread_sandbox: "read-only"});
      await host.start();
      assert.ok(backend?.pid && backend.pid !== previousBackendPid,
        "canary.client-id-backend-process-not-restarted");
      assert.notEqual(gateway.inspect().runtime_epoch_id, previousGatewayEpoch,
        "canary.client-id-gateway-epoch-not-rotated");
      const restartedHistory = await rpc.request("thread/read", {threadId, includeTurns: true});
      const restartedTurns = restartedHistory?.thread?.turns ?? [];
      const restartedTurn = restartedTurns.filter((entry) => entry.id === started.turn.id);
      assert.equal(restartedTurn.length, 1, "canary.client-id-restarted-turn-history-ambiguous");
      const restartedMatches = restartedTurns.flatMap((entry) => (entry.items ?? [])
        .filter((item) => item.type === "userMessage" && item.clientId === clientId)
        .map(() => entry.id));
      assert.deepEqual(restartedMatches, [started.turn.id],
        "canary.client-id-not-unique-after-backend-restart");
      assert.equal(restartedTurn[0].status, "completed", "canary.client-id-restarted-turn-not-completed");
      assert.equal(requests.length, 3, "canary.client-id-restart-redispatched-provider");
      report.client_id_probe = {...report.client_id_probe, backend_and_gateway_restarted: true,
        session_resumed: true, exact_completed_turn_found_after_restart: true,
        unique_client_id_match_after_restart: true, provider_redispatch_after_restart: false};
    }
  }
  if (unknownAcceptanceProbeMode) {
    const requestKey = hostedPendingProbeMode
      ? "turn:55555555-5555-4555-8555-555555555555" : "native-unknown-acceptance-probe";
    const probeText = "Explain the repository routing architecture";
    const noRetryParams = {threadId, input: [{type: "text", text: probeText}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}};
    dropProbeStartResponse = true;
    let startAcknowledged = false;
    const abortPendingHttp = hostedPendingProbeMode ? new AbortController() : null;
    const pendingStart = hostedPendingProbeMode
      ? fetch(new URL("api/turns", ready.url), {method: "POST",
        headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
        body: JSON.stringify({threadId, text: probeText, requestKey}),
        signal: abortPendingHttp.signal}).then((response) => { startAcknowledged = response.ok; }, () => {})
      : rpc.request("turn/start", noRetryParams, {idempotency_key: requestKey})
        .then(() => { startAcknowledged = true; }, () => {});
    const responseDeadline = Date.now() + 15000;
    while (!suppressedProbeStartResponse && Date.now() < responseDeadline) await delay(25);
    assert.equal(suppressedProbeStartResponse, true, "canary.unknown-probe-start-response-not-suppressed");
    assert.equal(dropProbeStartResponse, false, "canary.unknown-probe-response-filter-not-one-shot");
    // The suppressed start response also withholds ARE's durable acceptance.
    // Progress/completion notifications for that unaccepted turn must not reach
    // the client; host history is the read-only evidence for recovery instead.
    let completedProbe;
    const hostHistoryDeadline = Date.now() + 30000;
    while (Date.now() < hostHistoryDeadline) {
      const history = await rpc.request("thread/read", {threadId, includeTurns: true});
      completedProbe = history?.thread?.turns?.find((turn) => turn.id !== turnId && turn.status === "completed");
      if (completedProbe) break;
      await delay(100);
    }
    assert.ok(completedProbe, "canary.unknown-probe-host-not-completed");
    assert.equal(notifications.some((message) => message.method === "turn/completed"
      && message.params?.turn?.id === completedProbe.id), false,
    "canary.unaccepted-turn-completion-leaked-to-client");
    assert.equal(startAcknowledged, false, "canary.unknown-probe-lost-response-was-acknowledged");
    const before = gateway.inspect().durable_session_index.sessions.find((entry) =>
      entry.consumer_id === "codex:human-chat");
    const intent = before?.requests?.find((entry) => entry.request_key === requestKey);
    assert.equal(intent?.status, "outcome-unknown", "canary.unknown-probe-intent-not-pending");
    if (hostedPendingProbeMode) {
      const clientPending = recoveryState.pending_turn_intent();
      assert.equal(clientPending?.schema_version, "are.codex-client-pending-turn/v2",
        "canary.hosted-pending-intent-not-durable");
      assert.equal(clientPending.request_key, requestKey, "canary.hosted-pending-request-key-mismatch");
      assert.equal(clientPending.request_binding_digest, digestValue({method: "turn/start", params: noRetryParams}),
        "canary.hosted-pending-binding-mismatch");
      abortPendingHttp.abort();
    }
    assert.match(intent.client_message_id, /^are-gateway-client:[0-9a-f]{32}$/);
    assert.equal(before.host_observations.some((entry) => entry.kind === "turn-start-accepted"
      && entry.request_key_digest === digestValue(requestKey)), false,
    "canary.unknown-probe-acceptance-was-durable");
    const decisionsBeforeUnknownRestart = await readGatewayDecisionObservation({socket_path: observationPath,
      token: observationToken});
    const previousBackendPid = backend?.pid;
    const previousGatewayEpoch = gateway.inspect().runtime_epoch_id;
    await host.close();
    host = null;
    rpc = null;
    transport = null;
    recoveryState.close();
    await gateway.close();
    await pendingStart;
    gateway = createPersistentGateway(gatewayOptions);
    await gateway.start();
    recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"),
      consumer_id: "codex:human-chat"});
    transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
      lane: "interaction-bound", resume_token: recoveryState.resume_token(),
      ...(gatewayConnectionToken ? {connection_token: gatewayConnectionToken} : {})});
    const resumed = await transport.ready;
    assert.equal(resumed.resumed, true, "canary.unknown-probe-session-not-resumed");
    assert.equal(resumed.session_recovery?.gateway_delivery, "recovered-after-restart",
      "canary.unknown-probe-gateway-not-restarted");
    recoveryState.bind_gateway(resumed);
    rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000});
    const approvals = createApprovalBroker();
    const userInputs = createUserInputBroker();
    host = createWindowsClientHost({rpc_client: rpc, approval_broker: approvals, user_input_broker: userInputs,
      recovery_state: recoveryState, repository_root: checkoutRoot, default_cwd: checkoutRoot,
      assets_directory: resolve(packageRoot, "client"), port: 0,
      token: "are-native-unknown-marker-restarted-fixture-token", thread_approval_policy: "on-request",
      thread_sandbox: "read-only"});
    const restartedReady = await host.start();
    assert.ok(backend?.pid && backend.pid !== previousBackendPid,
      "canary.unknown-probe-backend-process-not-restarted");
    assert.notEqual(gateway.inspect().runtime_epoch_id, previousGatewayEpoch,
      "canary.unknown-probe-gateway-epoch-not-rotated");
    const history = await rpc.request("thread/read", {threadId, includeTurns: true});
    const reconciledReasoning = await observeGatewayThread(threadId, {expectedPhase: "recovery-terminal"});
    const matches = (history?.thread?.turns ?? []).flatMap((turn) => (turn.items ?? [])
      .filter((item) => item.type === "userMessage" && item.clientId === intent.client_message_id)
      .map(() => turn));
    const after = gateway.inspect().durable_session_index.sessions.find((entry) =>
      entry.consumer_id === "codex:human-chat");
    const markerObservations = after.host_observations.filter((entry) => entry.kind === "turn-marker-observed"
      && entry.request_key_digest === digestValue(requestKey));
    assert.equal(after.requests.find((entry) => entry.request_key === requestKey)?.status,
      hostedPendingProbeMode ? "recovered" : "outcome-unknown",
    "canary.unknown-probe-recovery-posture-invalid");
    assert.equal(requests.length <= 3, true, "canary.unknown-probe-provider-redispatched");
    if (!hostedPendingProbeMode) {
      for (const [key, reason] of [[requestKey, "gateway.dispatch-outcome-unknown"],
        ["native-unknown-acceptance-new-turn", "gateway.session-outcome-unknown"]]) {
      let rejected = false;
      try { await rpc.request("turn/start", noRetryParams, {idempotency_key: key}); }
      catch (error) {
        assert.deepEqual(error?.details?.data?.reason_codes, [reason],
          `canary.unknown-probe-unexpected-retry-rejection:${key}`);
        rejected = true;
      }
      assert.equal(rejected, true, `canary.unknown-probe-retry-admitted:${key}`);
    }
      assert.equal(requests.length, 3, "canary.unknown-probe-retry-reached-provider");
      report.unknown_acceptance_probe = {host_start_response_suppressed: true,
        gateway_and_backend_restarted: true, host_history_marker_matches: matches.length,
        marker_observation_receipts: markerObservations.length, unknown_write_block_retained: true,
        reasoning_phase_after_restart: reconciledReasoning.thread_phase,
        reasoning_frontier_retained: reconciledReasoning.frontier_present,
        same_key_retry_rejected: true, new_key_turn_rejected: true,
        provider_requests: requests.length};
    }
    assert.equal(matches.length, 1, "canary.unknown-probe-exact-host-marker-not-found");
    assert.equal(markerObservations.length, 1, "canary.unknown-probe-marker-observation-not-durable");
    assert.equal(markerObservations[0].turn_ref, digestValue(matches[0].id),
      "canary.unknown-probe-marker-turn-mismatch");
    assert.equal(markerObservations[0].turn_status, matches[0].status,
      "canary.unknown-probe-marker-status-mismatch");
    assert.equal(JSON.stringify(markerObservations).includes(threadId), false,
      "canary.unknown-probe-observation-leaked-thread-id");
    if (hostedPendingProbeMode) {
      const clientState = host.state();
      assert.equal(clientState.pending_turn, null, "canary.hosted-pending-not-cleared");
      assert.equal(clientState.last_turn_result?.schema_version, "are.codex-client-recovered-turn/v1",
        "canary.hosted-recovery-receipt-missing");
      assert.equal(clientState.last_turn_result.turn_id, matches[0].id,
        "canary.hosted-recovery-turn-mismatch");
      assert.equal(clientState.recovery_confirmation_required, false,
        "canary.hosted-recovery-confirmation-missing");
      const replayResponse = await fetch(new URL("api/turns", restartedReady.url), {method: "POST",
        headers: {authorization: `Bearer ${host.token}`, "content-type": "application/json"},
        body: JSON.stringify({threadId, text: probeText, requestKey})});
      const replay = await replayResponse.json();
      assert.equal(replayResponse.status, 202, "canary.hosted-recovered-replay-not-local");
      assert.equal(replay.value?.recovered_from_receipt, true,
        "canary.hosted-recovered-replay-synthesized-host-response");
      assert.equal(replay.value?.turn?.id, matches[0].id, "canary.hosted-replay-turn-mismatch");
      assert.equal(requests.length, 3, "canary.hosted-replay-redispatched-provider");
      report.unknown_acceptance_probe = {host_start_response_suppressed: true,
        gateway_and_backend_restarted: true, host_history_marker_matches: matches.length,
        marker_observation_receipts: markerObservations.length, hosted_pending_intent_recovered: true,
        gateway_recovery_confirmed: true, hosted_same_key_local_replay: true,
        reasoning_phase_after_restart: reconciledReasoning.thread_phase,
        reasoning_frontier_retained: reconciledReasoning.frontier_present, provider_requests: requests.length};
    } else {
      const recovered = await rpc.request(GATEWAY_TURN_RECOVERY_GET, {threadId, requestKey,
        requestBindingDigest: digestValue({method: "turn/start", params: noRetryParams})});
      assert.equal(recovered.recovery.turn_id, matches[0].id,
        "canary.unknown-probe-recovery-turn-mismatch");
      const confirmed = await rpc.request(GATEWAY_TURN_RECOVERY_CONFIRM, {receipt: recovered.recovery});
      assert.equal(confirmed.confirmed, true, "canary.unknown-probe-recovery-not-confirmed");
      assert.equal(confirmed.recovery_digest, recovered.recovery.receipt_digest,
        "canary.unknown-probe-recovery-receipt-mismatch");
      assert.equal(gateway.inspect().durable_session_index.sessions.find((entry) =>
        entry.consumer_id === "codex:human-chat").requests.find((entry) =>
        entry.request_key === requestKey).status, "recovered",
      "canary.unknown-probe-recovery-not-durable");
      let recoveredReplayRejected = false;
      try { await rpc.request("turn/start", noRetryParams, {idempotency_key: requestKey}); }
      catch (error) {
        assert.deepEqual(error?.details?.data?.reason_codes, ["gateway.dispatch-recovered-no-host-response"]);
        recoveredReplayRejected = true;
      }
      assert.equal(recoveredReplayRejected, true, "canary.unknown-probe-synthetic-host-response");
      assert.equal(requests.length, 3, "canary.unknown-probe-recovery-redispatched-provider");
      report.unknown_acceptance_probe = {...report.unknown_acceptance_probe,
        semantic_recovery_confirmed: true, recovered_replay_rejected: true,
        provider_redispatch_after_recovery: false};
    }
    const projectedRecovery = await readGatewayThreadObservation({socket_path: observationPath,
      token: observationToken});
    const recoveredThread = projectedRecovery.threads.find((entry) =>
      entry.thread_ref === `backend-thread:${digestValue(threadId)}`);
    assert.equal(projectedRecovery.unknown_dispatch_count, 0,
      "canary.recovered-dispatch-still-unknown");
    assert.equal(projectedRecovery.recovered_dispatch_count, 1,
      "canary.recovered-dispatch-count-missing");
    assert.equal(recoveredThread?.recovered_dispatch_count, 1,
      "canary.recovered-thread-count-missing");
    const projectedDecisions = await readGatewayDecisionObservation({socket_path: observationPath,
      token: observationToken});
    assert.equal(projectedDecisions.runtime_epoch_id, projectedRecovery.runtime_epoch_id,
      "canary.recovered-decision-epoch-mismatch");
    assertPriorDecisionsPreserved(decisionsBeforeUnknownRestart, projectedDecisions);
    report.observation_after_restart = {runtime_epoch_id: projectedRecovery.runtime_epoch_id,
      thread_count: projectedRecovery.thread_count, thread_phase: recoveredThread.phase,
      recovered_dispatch_count: projectedRecovery.recovered_dispatch_count,
      decision_count: projectedDecisions.decision_count,
      prior_decision_observations_preserved: true};
    report.unknown_acceptance_probe = {...report.unknown_acceptance_probe,
      companion_recovery_projection_verified: true};
    await holdForCompanion("after-restart");
  }
  }
  }
  if (process.argv.includes("--thread-summary-after-turn-probe")) {
    const summaryAfterTurn = await rpc.request("thread/read", {threadId, includeTurns: false});
    report.thread_summary_after_turn_probe = {
      exact_thread_id: summaryAfterTurn?.thread?.id === threadId,
      turns_is_array: Array.isArray(summaryAfterTurn?.thread?.turns),
      turn_count: Array.isArray(summaryAfterTurn?.thread?.turns) ? summaryAfterTurn.thread.turns.length : null,
      provider_requests: requests.length,
    };
    assert.ok(requests.length > 0, "canary.summary-after-turn-provider-not-called");
  }
  report.total_provider_requests = requests.length;
  if (guardedUserInputMode) {
    const guard = modelWireGuard.inspect();
    assert.equal(guard.forwarded, requests.length, "canary.guarded-user-input-not-forwarded");
    assert.equal(guard.blocked, 0, "canary.guarded-user-input-wire-blocked");
    report.model_wire_guard = {status: "guarded-user-input-passed", forwarded: guard.forwarded,
      blocked: guard.blocked};
  }
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  if (modelWireGuard) report.model_wire_guard_observation = modelWireGuard.inspect();
  report.error_code = error.code ?? null;
  report.error_details = error.details ?? null;
  const gatewayState = gateway?.inspect();
  report.gateway_failure = gatewayState ? {sessions: gatewayState.sessions?.map((session) => ({
    status: session.status, fault_reason_code: session.fault_reason_code,
    initialization_status: session.initialization_status,
  })), durable_sessions: gatewayState.durable_session_index?.sessions?.map((session) => ({
    status: session.status, fault_reason_code: session.fault?.reason_code,
    request_statuses: session.requests?.map((request) => request.status),
    observation_kinds: session.host_observations?.map((observation) => observation.kind),
  }))} : null;
  report.fixture_progress = {provider_requests: requests.length,
    notification_methods: notifications.map((notification) => notification.method)};
  if (error.code === "rpc.notification-timeout" && rpc && diagnosticThreadId) {
    const history = await Promise.race([
      rpc.request("thread/read", {threadId: diagnosticThreadId, includeTurns: true})
        .then((value) => ({value}), (failure) => ({error: failure.message})),
      delay(5000).then(() => ({error: "diagnostic-thread-read-timeout"})),
    ]);
    report.failure_thread_history = history.value?.thread?.turns?.map((turn) => ({
      id: turn.id, status: turn.status,
      item_types: turn.items?.map((item) => item.type),
    })) ?? history.error;
  }
  report.host_stderr_tail = stderr;
  process.exitCode = 1;
} finally {
  await host?.close().catch(() => {});
  await rpc?.close().catch(() => {});
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  await modelWireGuard?.close().catch(() => {});
  recoveryState?.close();
  if (backend && backend.exitCode === null && backend.signalCode === null) {
    backend.kill("SIGTERM");
    await Promise.race([new Promise((resolveExit) => backend.once("exit", resolveExit)), delay(2000)]);
    if (backend.exitCode === null && backend.signalCode === null) backend.kill("SIGKILL");
  }
  if (server) {
    server.closeAllConnections();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  let cleanupError = null;
  if (scratch) {
    // Windows can retain a just-exited Codex SQLite handle briefly. Keep the
    // functional verdict observable even if this exact disposable cleanup
    // exhausts its bounded retries; never silently report a PASS with residue.
    for (let attempt = 0; attempt < 5 && existsSync(scratch); attempt++) {
      try { rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}); }
      catch (error) {
        cleanupError = error;
        if (attempt < 4) await delay(1000);
      }
    }
  }
  report.teardown = {temporary_configuration_removed: scratch ? !existsSync(scratch) : null,
    native_child_reaped: backend ? backend.exitCode !== null || backend.signalCode !== null : null,
    cleanup_error_code: scratch && existsSync(scratch) ? cleanupError?.code ?? "cleanup-incomplete" : null};
  if (report.teardown.temporary_configuration_removed === false) {
    report.status = "FAIL";
    report.error ??= "canary.temporary-configuration-cleanup-failed";
    process.exitCode = 1;
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
