#!/usr/bin/env node
// Reopen one private installed-Codex canary after its gateway process was killed.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomBytes} from "node:crypto";
import {readFileSync, realpathSync} from "node:fs";
import {createServer} from "node:http";
import {hostname, tmpdir} from "node:os";
import {basename, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createPersistentGateway,
  createWindowsClientRecoveryState,
  deriveGatewayReasoningStateProfile,
  GATEWAY_TURN_RECOVERY_CONFIRM,
  GATEWAY_TURN_RECOVERY_GET,
  loadRepositoryProfile,
} from "../index.mjs";
import {readAdapterObservation} from "../src/adapter-observation-client.mjs";
import {digestValue} from "../src/canonical.mjs";
import {readGatewayDecisionObservation} from "../src/decision-observation-client.mjs";
import {connectGatewayRpcTransport} from "../src/gateway-client.mjs";
import {readGatewayThreadObservation} from "../src/thread-observation-client.mjs";
import {inspectBackendProcess} from "./native-backend-process-identity.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checkoutRoot = resolve(packageRoot, "../../../../..");
const survivorObserveOnly = process.argv.includes("--survivor-observe-only");
const report = {schema_version: "are.native-gateway-hard-crash-recovery/v1", status: "FAIL",
  authority_effect: "none", external_model_calls: 0, current_desktop_task_touched: false};
const birthFlagIndex = process.argv.indexOf("--expected-backend-birth");
const expectedBackendBirth = birthFlagIndex >= 0 ? process.argv[birthFlagIndex + 1] : null;
const oldBackendRunning = (pid, binary, scratch) =>
  inspectBackendProcess(pid, binary, scratch, expectedBackendBirth).exact;
function assertRecoveredDecisions(decisions, state) {
  assert.ok(Number.isSafeInteger(state.decision_count_before_crash)
    && state.decision_count_before_crash >= 0, "recovery.precrash-decision-count-missing");
  assert.equal(decisions.decision_count, state.decision_count_before_crash,
    "recovery.precrash-decision-count-changed");
  assert.deepEqual(decisions.decisions.map((entry) => entry.decision_digest),
    state.decision_digests_before_crash, "recovery.precrash-decision-digests-changed");
}
let gateway;
let transport;
let rpc;
let recoveryState;
let backend;
let recoveryProvider;
let backendStderr = "";

try {
  const statePath = realpathSync(process.argv[2]);
  const binary = realpathSync(process.argv[3]);
  const expectedVersion = process.argv[4];
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  if (process.platform === "win32") assert.ok(expectedBackendBirth,
    "recovery.windows-backend-birth-required");
  assert.equal(state.schema_version, "are.native-gateway-hard-crash-state/v1");
  assert.ok(["completed-lost-response", "active-turn"].includes(state.mode),
    "recovery.unknown-probe-mode");
  assert.ok(!survivorObserveOnly || state.mode === "active-turn",
    "recovery.survivor-probe-requires-active-turn");
  const scratch = realpathSync(state.scratch);
  assert.equal(dirname(statePath), scratch, "recovery.state-outside-private-scratch");
  assert.ok(basename(scratch).startsWith("are-native-user-input-"), "recovery.unexpected-scratch-root");
  assert.equal(resolve(dirname(scratch)), resolve(tmpdir()), "recovery.scratch-not-in-system-temp");
  assert.equal(binary, state.binary, "recovery.installed-binary-changed");
  assert.equal(expectedVersion, state.expected_version, "recovery.expected-version-changed");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "recovery.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "recovery.host-version-drift");
  if (state.mode === "completed-lost-response") {
    assert.match(state.client_message_id, /^are-gateway-client:[0-9a-f]{32}$/);
    assert.ok(state.compaction_item_count > 0);
  } else assert.match(state.prior_frontier_digest, /^[0-9a-f]{64}$/);
  assert.ok(Number.isInteger(state.backend_pid) && state.backend_pid > 0);
  assert.ok(Number.isInteger(state.provider_requests_before_crash)
    && state.provider_requests_before_crash > 0);
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), checkoutRoot);
  assert.equal(loaded.ok, true, `recovery.profile-unavailable:${JSON.stringify(loaded.reason_codes)}`);

  const suffix = `${process.pid}-${randomBytes(8).toString("hex")}`;
  const gatewayPath = process.platform === "win32"
    ? `\\\\.\\pipe\\are-hard-crash-gateway-${suffix}` : resolve(scratch, "restarted-gateway.sock");
  const observationPath = process.platform === "win32"
    ? `\\\\.\\pipe\\are-hard-crash-observation-${suffix}` : resolve(scratch, "restarted-observation.sock");
  const observationToken = randomBytes(32).toString("hex");
  const connectionToken = process.platform === "win32" ? randomBytes(32).toString("hex") : null;
  gateway = createPersistentGateway({listen_path: gatewayPath,
    ...(connectionToken ? {connection_token: connectionToken} : {}),
    observation_listen_path: observationPath, observation_token: observationToken,
    expected_codex_version: expectedVersion,
    session_store_path: resolve(scratch, "gateway-session-store.jsonl"),
    backend_process_guard: "required",
    backend: {mode: "direct-stdio", command: binary},
    spawn_impl: (command, args, options) => {
      backend = spawn(command, args, {cwd: scratch, ...options,
        env: {...process.env, CODEX_HOME: resolve(scratch, "codex-home")}});
      backend.stderr.on("data", (chunk) => { backendStderr = `${backendStderr}${chunk}`.slice(-8192); });
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
    },
  });
  await gateway.start();
  if (process.platform === "linux" || process.platform === "win32") {
    assert.match(state.backend_birth_ref, /^[0-9a-f]{64}$/u,
      "recovery.prior-backend-birth-missing");
  }
  assert.deepEqual(gateway.inspect().durable_session_index.sessions.find((entry) =>
    entry.consumer_id === "codex:human-chat")?.backend_process_identity,
  {host_name: hostname(), process_id: state.backend_pid,
    ...(state.backend_birth_ref ? {birth_ref: state.backend_birth_ref} : {})},
  "recovery.prior-backend-identity-not-durable");
  recovery: {
  recoveryState = createWindowsClientRecoveryState({path: resolve(scratch, "client-state.json"),
    consumer_id: "codex:human-chat"});
  transport = connectGatewayRpcTransport({socket_path: gatewayPath, consumer_id: "codex:human-chat",
    lane: "interaction-bound", resume_token: recoveryState.resume_token(),
    ...(connectionToken ? {connection_token: connectionToken} : {})});
  let resumed;
  try { resumed = await transport.ready; }
  catch (error) {
    if (!survivorObserveOnly || error.code !== "gateway.prior-backend-process-live") throw error;
    assert.equal(oldBackendRunning(state.backend_pid, binary, scratch), true,
      "recovery.live-pid-is-not-the-exact-backend");
    assert.equal(backend, undefined, "recovery.guard-spawned-replacement-backend");
    report.status = "BACKEND_LIVE_GUARD_BLOCKED";
    report.guard_reason = error.code;
    report.prior_backend_exactly_running = true;
    report.replacement_backend_spawned = false;
    break recovery;
  }
  assert.equal(resumed.resumed, true, "recovery.gateway-session-not-resumed");
  assert.equal(resumed.session_recovery?.gateway_delivery, "recovered-after-restart",
    "recovery.gateway-delivery-not-recovered");
  recoveryState.bind_gateway(resumed);
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 30000});
  await rpc.initialize({clientInfo: {name: "cyberalchemy_are_windows",
    title: "CyberAlchemy ARE Windows Client", version: "0.1.0"},
  capabilities: {experimentalApi: true}});
  await rpc.notify("initialized", {});
  const durableBeforeRead = gateway.inspect().durable_session_index.sessions
    .find((entry) => entry.consumer_id === "codex:human-chat")?.requests
    .find((entry) => entry.request_key === state.request_key);
  if (state.mode === "active-turn") {
    assert.equal(durableBeforeRead?.status, "complete", "recovery.active-turn-acceptance-not-durable");
    const readOptions = {socket_path: observationPath, token: observationToken};
    const before = await readGatewayThreadObservation(readOptions);
    const beforeRow = before.threads.find((entry) =>
      entry.thread_ref === `backend-thread:${digestValue(state.thread_id)}`);
    assert.equal(beforeRow?.phase, "recovery-unverified", "recovery.active-turn-not-unverified-before-history");
    assert.equal(beforeRow.latest_frontier_digest, state.prior_frontier_digest,
      "recovery.active-turn-prior-frontier-not-restored");
    if (survivorObserveOnly) {
      report.backend_running_before_history = oldBackendRunning(state.backend_pid, binary, scratch);
      const history = await rpc.request("thread/read", {threadId: state.thread_id, includeTurns: true});
      report.backend_running_after_history = oldBackendRunning(state.backend_pid, binary, scratch);
      const hostTurns = (history?.thread?.turns ?? []).filter((entry) => entry.id === state.turn_id);
      assert.equal(hostTurns.length, 1, "recovery.surviving-host-turn-not-exact");
      const observedHostStatus = hostTurns[0].status;
      const observations = gateway.inspect().durable_session_index.sessions
        .find((entry) => entry.consumer_id === "codex:human-chat")?.host_observations
        .filter((entry) => entry.kind === "turn-history-verified"
          && entry.request_key_digest === digestValue(state.request_key)
          && entry.turn_ref === digestValue(state.turn_id)) ?? [];
      assert.equal(observations.length, 1, "recovery.surviving-host-history-not-durable");
      assert.equal(observations[0].turn_status, observedHostStatus,
        "recovery.surviving-host-receipt-status-mismatch");
      const afterRead = await readGatewayThreadObservation(readOptions);
      const afterRow = afterRead.threads.find((entry) =>
        entry.thread_ref === `backend-thread:${digestValue(state.thread_id)}`);
      report.surviving_host_status = observedHostStatus;
      report.recovery_phase = afterRow?.phase ?? null;
      report.exact_host_history_receipts = observations.length;
      if (!report.backend_running_after_history && observedHostStatus === "interrupted"
        && afterRow?.phase === "recovery-terminal") {
        report.status = "BACKEND_EXITED_BEFORE_RECONCILIATION";
      } else if (observedHostStatus !== "inProgress" || afterRow?.phase !== "recovery-unverified") {
        report.status = "GAP_CONFIRMED";
        report.error = "recovery.surviving-backend-host-history-is-not-exclusive-process-proof";
        process.exitCode = 2;
      } else {
      assert.equal(afterRow?.phase, "recovery-unverified", "recovery.surviving-turn-falsely-terminal");
      assert.equal(afterRow.latest_frontier_digest, state.prior_frontier_digest,
        "recovery.surviving-turn-fabricated-frontier");
      let blocked = false;
      try {
        await rpc.request("turn/start", {threadId: state.thread_id,
          input: [{type: "text", text: "Research the next step after host recovery"}],
          approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}},
        {idempotency_key: "native-surviving-backend-unsafe-new-turn"});
      } catch (error) {
        assert.deepEqual(error?.details?.data?.reason_codes, ["reasoning.prior-turn-unsettled"],
          "recovery.surviving-turn-unexpected-new-turn-rejection");
        blocked = true;
      }
      assert.equal(blocked, true, "recovery.surviving-turn-new-dispatch-admitted");
      const decisions = await readGatewayDecisionObservation(readOptions);
      assertRecoveredDecisions(decisions, state);
      report.status = "PASS";
      report.host = {version: expectedVersion};
      report.surviving_host_status = hostTurns[0].status;
      report.recovery_phase = afterRow.phase;
      report.prior_frontier_preserved = true;
      report.exact_host_history_receipts = observations.length;
      report.new_turn_blocked = true;
      report.process_local_decision_count = 0;
      report.prior_decision_observation_count = decisions.decision_count;
      report.host_task_control = "unverified";
      }
    } else {
    const history = await rpc.request("thread/read", {threadId: state.thread_id, includeTurns: true});
    const hostTurns = (history?.thread?.turns ?? []).filter((entry) => entry.id === state.turn_id);
    assert.equal(hostTurns.length, 1, "recovery.active-turn-host-history-not-exact");
    assert.equal(hostTurns[0].status, "interrupted", "recovery.active-turn-host-not-interrupted");
    const observations = gateway.inspect().durable_session_index.sessions
      .find((entry) => entry.consumer_id === "codex:human-chat")?.host_observations
      .filter((entry) => entry.kind === "turn-history-verified"
        && entry.request_key_digest === digestValue(state.request_key)
        && entry.turn_ref === digestValue(state.turn_id)
        && entry.turn_status === "interrupted") ?? [];
    assert.equal(observations.length, 1, "recovery.active-turn-history-receipt-not-durable");
    assert.equal(observations[0].turn_status, "interrupted", "recovery.active-turn-receipt-status-wrong");
    const [adapter, threads, decisions] = await Promise.all([
      readAdapterObservation(readOptions), readGatewayThreadObservation(readOptions),
      readGatewayDecisionObservation(readOptions)]);
    assert.equal(adapter.runtime_epoch_id, threads.runtime_epoch_id);
    assert.equal(adapter.runtime_epoch_id, decisions.runtime_epoch_id);
    assert.equal(adapter.host_task_control.status, "unverified", "recovery.promoted-desktop-task-control");
    const row = threads.threads.find((entry) =>
      entry.thread_ref === `backend-thread:${digestValue(state.thread_id)}`);
    assert.equal(row?.phase, "recovery-terminal", "recovery.active-turn-semantic-state-not-terminal");
    assert.equal(row.recovery_host_status, "interrupted", "recovery.active-turn-host-status-not-projected");
    assert.equal(row.latest_frontier_digest, state.prior_frontier_digest,
      "recovery.active-turn-fabricated-completion-frontier");
    assert.equal(row.recovery_host_observation_digest, observations[0].observation_digest,
      "recovery.active-turn-receipt-not-exact");
    assertRecoveredDecisions(decisions, state);
    assert.ok(backend?.pid && backend.pid !== state.backend_pid, "recovery.backend-not-restarted");
    const rejoined = await rpc.request("thread/resume", {threadId: state.thread_id,
      approvalPolicy: "on-request", sandbox: "read-only"},
    {idempotency_key: "native-active-hard-crash-owned-resume"});
    assert.equal(rejoined.thread?.id, state.thread_id, "recovery.active-turn-owned-thread-not-rejoined");
    const config = readFileSync(resolve(scratch, "codex-home/config.toml"), "utf8");
    const endpointMatch = config.match(/^base_url = ("[^"\n]+")$/m);
    assert.ok(endpointMatch, "recovery.active-turn-loopback-endpoint-missing");
    const endpoint = new URL(JSON.parse(endpointMatch[1]));
    assert.equal(endpoint.hostname, "127.0.0.1", "recovery.active-turn-provider-not-loopback");
    let postRecoveryProviderRequests = 0;
    recoveryProvider = createServer(async (request, response) => {
      try {
        assert.equal(request.method, "POST");
        assert.equal(request.url, "/v1/responses");
        let bytes = 0;
        const chunks = [];
        for await (const chunk of request) {
          bytes += chunk.length;
          assert.ok(bytes <= 2 * 1024 * 1024, "recovery.active-turn-provider-request-too-large");
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.ok(JSON.stringify(body).includes("Research the next step after host recovery"),
          "recovery.active-turn-old-provider-request-redispatched");
        postRecoveryProviderRequests++;
        assert.equal(postRecoveryProviderRequests, 1, "recovery.active-turn-provider-redispatched");
        const output = {id: "msg_are_recovered_next_turn", type: "message", status: "completed",
          role: "assistant", content: [{type: "output_text", text: "ARE_RECOVERED_NEXT_TURN_OK", annotations: []}]};
        const completed = {id: "resp_are_recovered_next_turn", object: "response", status: "completed",
          output: [output], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
            input_tokens_details: {cached_tokens: 0}}};
        const events = [
          {type: "response.created", response: {...completed, status: "in_progress", output: []}},
          {type: "response.output_item.added", output_index: 0, item: {...output, status: "in_progress"}},
          {type: "response.content_part.added", item_id: output.id, output_index: 0, content_index: 0,
            part: {type: "output_text", text: "", annotations: []}},
          {type: "response.output_text.delta", item_id: output.id, output_index: 0, content_index: 0,
            delta: output.content[0].text},
          {type: "response.output_item.done", output_index: 0, item: output},
          {type: "response.completed", response: completed},
        ];
        response.writeHead(200, {"content-type": "text/event-stream"});
        response.end(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""));
      } catch (error) {
        response.writeHead(500);
        response.end(error.message);
      }
    });
    await new Promise((resolveListen, rejectListen) => {
      recoveryProvider.once("error", rejectListen);
      recoveryProvider.listen(Number(endpoint.port), "127.0.0.1", resolveListen);
    });
    const next = await rpc.request("turn/start", {threadId: state.thread_id,
      input: [{type: "text", text: "Research the next step after host recovery"}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}},
    {idempotency_key: "native-active-hard-crash-next-user-turn"});
    assert.ok(next.turn?.id && next.turn.id !== state.turn_id,
      "recovery.active-turn-next-turn-not-distinct");
    const nextCompleted = await rpc.waitForNotification((message) => message.method === "turn/completed"
      && message.params?.threadId === state.thread_id && message.params?.turn?.id === next.turn.id,
    {timeout_ms: 30000});
    assert.equal(nextCompleted.params.turn.status, "completed", "recovery.active-turn-next-turn-not-completed");
    assert.equal(postRecoveryProviderRequests, 1, "recovery.active-turn-new-provider-dispatch-not-exact");
    const afterNext = await readGatewayThreadObservation(readOptions);
    const nextRow = afterNext.threads.find((entry) =>
      entry.thread_ref === `backend-thread:${digestValue(state.thread_id)}`);
    assert.equal(nextRow?.phase, "turn-completed", "recovery.active-turn-next-frontier-not-completed");
    assert.ok(nextRow.latest_frontier_digest
      && nextRow.latest_frontier_digest !== state.prior_frontier_digest,
    "recovery.active-turn-next-frontier-not-distinct");
    report.status = "PASS";
    report.host = {version: expectedVersion};
    report.backend_process_restarted = true;
    report.provider_requests_before_crash = state.provider_requests_before_crash;
    report.provider_service_started_after_crash = true;
    report.post_recovery_provider_requests = postRecoveryProviderRequests;
    report.new_user_turn_completed = true;
    report.host_history_terminal = hostTurns[0].status;
    report.recovery_phase = row.phase;
    report.prior_frontier_preserved = true;
    report.exact_host_history_receipts = observations.length;
    report.process_local_decision_count = 0;
    report.prior_decision_observation_count = decisions.decision_count;
    report.host_task_control = adapter.host_task_control.status;
    }
  } else {
  assert.equal(durableBeforeRead?.status, "outcome-unknown", "recovery.unknown-intent-not-preserved");

  for (const [key, reason] of [[state.request_key, "gateway.dispatch-outcome-unknown"],
    ["native-hard-crash-new-turn", "gateway.session-outcome-unknown"]]) {
    let rejected = false;
    try { await rpc.request("turn/start", state.request_params, {idempotency_key: key}); }
    catch (error) {
      assert.deepEqual(error?.details?.data?.reason_codes, [reason],
        `recovery.unexpected-retry-rejection:${key}`);
      rejected = true;
    }
    assert.equal(rejected, true, `recovery.unsafe-retry-admitted:${key}`);
  }
  const history = await rpc.request("thread/read", {threadId: state.thread_id, includeTurns: true});
  const markedTurns = (history?.thread?.turns ?? []).flatMap((entry) => (entry.items ?? [])
    .filter((item) => item.type === "userMessage" && item.clientId === state.client_message_id)
    .map(() => entry.id));
  assert.deepEqual(markedTurns, [state.turn_id], "recovery.host-marker-not-unique-after-hard-crash");
  const observations = gateway.inspect().durable_session_index.sessions
    .find((entry) => entry.consumer_id === "codex:human-chat")?.host_observations
    .filter((entry) => entry.kind === "turn-marker-observed"
      && entry.request_key_digest === digestValue(state.request_key)) ?? [];
  assert.equal(observations.length, 1, "recovery.host-marker-observation-not-durable");
  assert.equal(observations[0].turn_ref, digestValue(state.turn_id), "recovery.observed-wrong-host-turn");
  assert.equal(observations[0].turn_status, "completed", "recovery.host-turn-not-terminal");
  const recovery = await rpc.request(GATEWAY_TURN_RECOVERY_GET, {threadId: state.thread_id,
    requestKey: state.request_key,
    requestBindingDigest: digestValue({method: "turn/start", params: state.request_params})});
  assert.equal(recovery.recovery.turn_id, state.turn_id, "recovery.semantic-turn-mismatch");
  const confirmed = await rpc.request(GATEWAY_TURN_RECOVERY_CONFIRM, {receipt: recovery.recovery});
  assert.equal(confirmed.confirmed, true, "recovery.confirmation-failed");
  const durableAfterConfirm = gateway.inspect().durable_session_index.sessions
    .find((entry) => entry.consumer_id === "codex:human-chat")?.requests
    .find((entry) => entry.request_key === state.request_key);
  assert.equal(durableAfterConfirm?.status, "recovered", "recovery.confirmed-intent-not-durable");
  let replayRejected = false;
  try { await rpc.request("turn/start", state.request_params, {idempotency_key: state.request_key}); }
  catch (error) {
    assert.deepEqual(error?.details?.data?.reason_codes, ["gateway.dispatch-recovered-no-host-response"]);
    replayRejected = true;
  }
  assert.equal(replayRejected, true, "recovery.synthetic-host-response-admitted");

  const readOptions = {socket_path: observationPath, token: observationToken};
  const [adapter, threads, decisions] = await Promise.all([
    readAdapterObservation(readOptions), readGatewayThreadObservation(readOptions),
    readGatewayDecisionObservation(readOptions)]);
  assert.equal(adapter.runtime_epoch_id, threads.runtime_epoch_id);
  assert.equal(adapter.runtime_epoch_id, decisions.runtime_epoch_id);
  assert.equal(adapter.host_task_control.status, "unverified", "recovery.promoted-desktop-task-control");
  assert.equal(threads.unknown_dispatch_count, 0);
  assert.equal(threads.recovered_dispatch_count, 1);
  const row = threads.threads.find((entry) => entry.thread_ref === `backend-thread:${digestValue(state.thread_id)}`);
  assert.equal(row?.recovered_dispatch_count, 1, "recovery.thread-projection-missing");
  assertRecoveredDecisions(decisions, state);
  assert.ok(backend?.pid && backend.pid !== state.backend_pid, "recovery.backend-not-restarted");
  report.status = "PASS";
  report.host = {version: expectedVersion};
  report.gateway_process_killed = true;
  report.backend_process_restarted = true;
  report.host_marker_match_count = markedTurns.length;
  report.compaction_item_count_before_crash = state.compaction_item_count;
  report.provider_requests_before_crash = state.provider_requests_before_crash;
  report.provider_service_started_after_crash = false;
  report.same_key_retry_rejected = true;
  report.new_key_turn_rejected_while_unknown = true;
  report.semantic_recovery_confirmed = true;
  report.recovered_dispatch_count = threads.recovered_dispatch_count;
  report.process_local_decision_count = 0;
  report.prior_decision_observation_count = decisions.decision_count;
  report.host_task_control = adapter.host_task_control.status;
  }
  }
} catch (error) {
  report.error = error.message;
  report.error_details = error.details ?? null;
  report.host_stderr_tail = backendStderr;
  process.exitCode = 1;
} finally {
  await rpc?.close().catch(() => {});
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  if (recoveryProvider) await new Promise((resolveClose) => recoveryProvider.close(resolveClose));
  recoveryState?.close();
  if (backend && backend.exitCode === null && backend.signalCode === null) {
    backend.kill("SIGTERM");
    await Promise.race([new Promise((resolveExit) => backend.once("exit", resolveExit)),
      new Promise((resolveWait) => setTimeout(resolveWait, 2000))]);
    if (backend.exitCode === null && backend.signalCode === null) backend.kill("SIGKILL");
  }
  report.teardown = {backend_reaped: backend ? backend.exitCode !== null || backend.signalCode !== null : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
