import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createHash, randomBytes, randomUUID} from "node:crypto";
import {EventEmitter, once} from "node:events";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createConnection, createServer} from "node:net";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {digestValue} from "../src/canonical.mjs";
import {selectHostedFeedbackCueProvider} from "../src/hosted-feedback-cues.mjs";
import {signHostedInput} from "../src/hosted-input-attestation.mjs";
import {restrictedHostConfigDigest} from "../src/restricted-host-profile.mjs";
import {materializeRequirementSnapshot} from "../../request-intent-runtime/index.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";
import {createWindowsClientRecoveryState} from "../src/windows-client-recovery-state.mjs";
import {createGatewayHostedEffectAssessor, createHostedEffectApprovalAdapter,
  createHostedEffectBroker} from "../src/hosted-effect-broker.mjs";
import {createGatewayHostedEffectCommandDispatcher,
  createHostedEffectCommandExecutor} from "../src/hosted-effect-execution.mjs";
import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";

import {
  ACKNOWLEDGED_CONTINUITY_MODE,
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createCodexGatewayBackendAdapter,
  createJsonLineProcessBackendAdapter,
  createFileGatewaySessionStore,
  createGatewayBackedConversationBindingContract,
  createMemoryGatewaySessionStore,
  createPersistentGateway,
  deriveGatewayReasoningStateProfile,
  GATEWAY_ACK_SCHEMA,
  GATEWAY_CONNECT_SCHEMA,
  GATEWAY_CONNECTED_SCHEMA,
  GATEWAY_DELIVERY_SCHEMA,
  GATEWAY_REQUEST_META_KEY,
  GATEWAY_STEER_OUTCOME_GET,
  GATEWAY_TURN_RECOVERY_GET,
  GATEWAY_TURN_RECOVERY_CONFIRM,
  GATEWAY_THREAD_CREATION_RECOVERY_GET,
  GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM,
  GATEWAY_OWNED_RUNTIME_GET,
  loadRepositoryProfile,
  readAdapterObservation,
  readGatewayThreadObservation,
  resolveBackendCommand,
  runGatewayClientProxy,
  validateGatewayBackendAdapter,
} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const testConnectionToken = process.platform === "win32" ? randomBytes(32).toString("hex") : null;
// DSH is optional: core distribution tests must not pull its source into the core closure.
const dshAdapterUrl = new URL(["..", "..", "dsh-gateway-backend-adapter", "index.mjs"].join("/"), import.meta.url);
const createDshGatewayBackendAdapter = existsSync(dshAdapterUrl)
  ? (await import(dshAdapterUrl.href)).createDshGatewayBackendAdapter : null;

function testGatewayPath(directory, endpoint = "gateway") {
  return process.platform === "win32" ? `\\\\.\\pipe\\are-${endpoint}-test-${randomUUID()}` : resolve(directory, `${endpoint}.sock`);
}

function fakeChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => { child.killed = true; child.exitCode = 0; child.signalCode = "SIGTERM"; child.emit("exit", 0, "SIGTERM"); };
  return child;
}

function passThroughWrapper() {
  return {
    processClientMessage: async (message) => ({to_server: [message], to_client: []}),
    processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
    prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`, epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
  };
}

function safeCodexTurnParams(threadId, input = []) {
  return {threadId, input, approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}};
}

function bindFixtureThread(store, consumerId, threadId) {
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
}

function fixtureConversationGate(threadId) {
  const trustedContext = Symbol("fixture Host context");
  const assertion = {principal_kind: "account", principal_ref: digestValue("fixture principal"),
    host_instance_ref: digestValue("fixture host"), client_instance_ref: digestValue("fixture client"),
    workspace_ref: digestValue("fixture workspace"), backend_adapter_id: "codex-app-server/v1",
    backend_thread_ref: digestValue(threadId), writer_ref: digestValue("fixture writer"),
    creation_receipt_digest: digestValue("fixture native creation")};
  const verifyHost = (context) => context === trustedContext ? assertion : null;
  return {trustedContext, verifyHost, gate: {host_context_for: () => trustedContext,
    ttl_ms: 60_000, verify_host_context: verifyHost, verify_release: () => null}};
}

function fixtureReceiptWrapper({objective_enabled = true} = {}) {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  if (!objective_enabled) return createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value,
    module_port: semanticModulePort()});
  const profile = {...loaded.value, objective_resolution: {enabled: true, requirement_tracking: true}};
  const seed = input => materializeRequirementSnapshot({consumer_ref: input.state.consumer_ref,
    scope_ref: input.state.scope_ref, objective_id: input.state.active_objective.objective_id,
    objective_state_digest: input.state.state_digest, requirements: ["citations"],
    source_refs: [input.request_ref, "fixture:explicit-requirement"]});
  return createCodexAppServerWrapper({...loaded, loaded_profile: profile,
    module_port: semanticModulePort(), requirement_seed_provider: seed,
    objective_provider: input => input.request === "Validate the bounded result."
      ? {transition: "new", objective: {description: input.request},
        evidence_span: {start: 0, end: input.request.length}} : null});
}

async function bindFixtureConversation(store, consumerId, threadId, host) {
  bindFixtureThread(store, consumerId, threadId);
  const contract = createGatewayBackedConversationBindingContract({session_store: store,
    consumer_id: consumerId, verify_host_context: host.verifyHost, verify_release: () => null});
  const binding = await contract.bindNewThread({host_context: host.trustedContext, ttl_ms: 60_000});
  await contract.activate({binding_id: binding.binding_id, host_context: host.trustedContext});
}

function seedAcceptedTurnForFixture(store, consumerId, threadId, turnId) {
  const requestKey = `fixture:turn-start:${turnId}`;
  const requestDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const observation = {kind: "turn-start-accepted", thread_ref: `backend-thread:${digestValue(threadId)}`,
    turn_ref: digestValue(turnId), request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, response_digest: digestValue("fixture:response")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...observation, observation_digest: digestValue(observation)}}}).ok, true);
}

test("owned runtime requires durable host completion and the matching ARE frontier", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:owned-runtime"});
  const consumerId = "codex:owned-runtime";
  const token = "owned-runtime-secret";
  const threadId = "private-owned-thread";
  const turnId = "private-owned-turn";
  const requestKey = "turn:owned-runtime";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const turnRef = digestValue(turnId);
  const bindingDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest,
      thread_ref: threadRef}}).ok, true);
  const accepted = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    response_digest: digestValue("host acceptance")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...accepted, observation_digest: digestValue(accepted)}}}).ok, true);
  const response = {jsonrpc: "2.0", id: 1, result: {turn: {id: turnId, status: "inProgress"}}};
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  let frontierPresent = false;
  const {gateway, listenPath} = fixture({session_store: store, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), completedTurnProof: () => frontierPresent
      ? {thread_ref: threadRef, turn_ref: turnRef, turn_status: "completed",
        frontier_digest: "a".repeat(64), checkpoint_digest: "b".repeat(64), authority_effect: "none"} : null})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  const get = async (id, params = {threadId}) => {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: GATEWAY_OWNED_RUNTIME_GET, params})}\n`);
    return (await connection.lines.next("owned runtime")).message;
  };
  const beforeCompletion = await get(1);
  assert.deepEqual(beforeCompletion.error?.data?.reason_codes, ["gateway.owned-runtime-frontier-unverified"],
    JSON.stringify(beforeCompletion));
  const completion = {kind: "turn-completion-observed", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    event_digest: digestValue("host completion"), turn_status: "completed"};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...completion, observation_digest: digestValue(completion)}}}).ok, true);
  assert.deepEqual((await get(2)).error.data.reason_codes, ["gateway.owned-runtime-frontier-unverified"]);
  frontierPresent = true;
  const verified = (await get(3)).result;
  assert.equal(verified.schema_version, "are.gateway-owned-runtime/v1");
  assert.equal(verified.disposition, "terminal-verified");
  assert.equal(verified.turn_ref, turnRef);
  assert.equal(verified.turn_status, "completed");
  assert.deepEqual((await get(4, {threadId: "foreign-thread"})).error.data.reason_codes,
    ["gateway.owned-runtime-thread-unavailable"]);
  assert.deepEqual((await get(5, {threadId, extra: true})).error.data.reason_codes,
    ["gateway.owned-runtime-input-invalid"]);
  connection.socket.destroy();
});

test("thread observation separates unresolved hosted-effect dispatches from other mutations", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-effect-observation"});
  const consumerId = "codex:hosted-effect-observation";
  const observationToken = "hosted-effect-observation-token-with-32-bytes";
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("hosted-effect-observation-token"), recovered: false}}).ok, true);
  for (const [requestKey, method] of [["turn:unknown", "turn/start"],
    ["hosted-effect:unknown", "cyberalchemy/hostedEffect/execute"]]) {
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: {request_key: requestKey, method, binding_digest: digestValue(requestKey),
        thread_ref: `backend-thread:${digestValue("private-hosted-effect-thread")}`}}).ok, true);
  }
  const {gateway, observationPath} = fixture({session_store: store, codex_protocol: true,
    observation_token: observationToken,
    wrapper_factory: passThroughWrapper});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const observation = gateway.observeReasoningThreads();
  assert.equal(observation.unknown_dispatch_count, 2);
  assert.equal(observation.unknown_hosted_effect_dispatch_count, 1);
  assert.equal(observation.thread_count, 0,
    "A durable effect request does not invent a Reasoning State row.");
  assert.doesNotMatch(JSON.stringify(observation), /private-hosted-effect-thread|hosted-effect:unknown/);
  const authenticated = await readGatewayThreadObservation({socket_path: observationPath,
    token: observationToken});
  assert.equal(authenticated.unknown_hosted_effect_dispatch_count, 1);
  assert.equal(authenticated.snapshot_digest, observation.snapshot_digest);
});

test("hosted-effect thread attribution requires the same gateway consumer session", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-effect-session-join"});
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const {gateway, listenPath} = fixture({session_store: store, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), observeReasoningThreads: () => [{
      thread_ref: threadRef, phase: "turn-active", reasoning_epoch_digest: "b".repeat(64),
      checkpoint_digest: "c".repeat(64), latest_frontier_digest: null,
      last_completion_status: null,
    }]})});
  await gateway.start();
  const active = await connectGateway(listenPath, "codex:hosted-effect-visible", "interaction-bound");
  context.after(async () => { active.socket.destroy(); await gateway.close(); store.close(); });
  assert.equal(active.receipt.schema_version, GATEWAY_CONNECTED_SCHEMA);

  const foreignConsumer = "codex:hosted-effect-foreign";
  assert.equal(store.append({event_kind: "session-started", consumer_id: foreignConsumer,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("foreign-token"), recovered: false}}).ok, true);
  const unresolved = (consumerId, key) => {
    assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
      content: {thread_ref: threadRef}}).ok, true);
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: {request_key: key, method: "cyberalchemy/hostedEffect/execute",
        binding_digest: digestValue(key), thread_ref: threadRef}}).ok, true);
  };
  unresolved(foreignConsumer, "hosted-effect:foreign");
  const foreignOnly = gateway.observeReasoningThreads();
  assert.equal(foreignOnly.unknown_hosted_effect_dispatch_count, 1);
  assert.equal(foreignOnly.threads.length, 1);
  assert.equal(foreignOnly.threads[0].unknown_hosted_effect_dispatch_count, 0);

  const sameStore = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-effect-same-session"});
  const {gateway: sameGateway, listenPath: sameListenPath} = fixture({session_store: sameStore,
    codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), observeReasoningThreads: () => [{
      thread_ref: threadRef, phase: "turn-active", reasoning_epoch_digest: "b".repeat(64),
      checkpoint_digest: "c".repeat(64), latest_frontier_digest: null,
      last_completion_status: null,
    }]})});
  await sameGateway.start();
  const sameSession = await connectGateway(sameListenPath, "codex:hosted-effect-visible", "interaction-bound");
  context.after(async () => { sameSession.socket.destroy(); await sameGateway.close(); sameStore.close(); });
  assert.equal(sameSession.receipt.schema_version, GATEWAY_CONNECTED_SCHEMA);
  assert.equal(sameStore.append({event_kind: "thread-bound", consumer_id: "codex:hosted-effect-visible",
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(sameStore.append({event_kind: "dispatch-intent", consumer_id: "codex:hosted-effect-visible",
    content: {request_key: "hosted-effect:visible", method: "cyberalchemy/hostedEffect/execute",
      binding_digest: digestValue("hosted-effect:visible"), thread_ref: threadRef}}).ok, true);
  const matching = sameGateway.observeReasoningThreads();
  assert.equal(matching.unknown_hosted_effect_dispatch_count, 1);
  assert.equal(matching.threads[0].unknown_hosted_effect_dispatch_count, 1);
});

function nextJsonLine(stream, timeout = 2000, label = "JSON line") {
  return new Promise((resolveLine, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), timeout);
    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const index = buffer.indexOf("\n");
      if (index < 0) return;
      clearTimeout(timer);
      stream.off("data", onData);
      resolveLine(JSON.parse(buffer.slice(0, index)));
    }
    stream.on("data", onData);
  });
}

function collectJsonLines(stream) {
  let buffer = "";
  const queue = [];
  const waiters = [];
  stream.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const value = JSON.parse(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      const waiter = waiters.shift();
      if (waiter) waiter(value);
      else queue.push(value);
    }
  });
  return {next: (label = "collected JSON line") => queue.length ? Promise.resolve(queue.shift()) : new Promise((resolveValue, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), 2000);
    waiters.push((value) => { clearTimeout(timer); resolveValue(value); });
  })};
}

async function waitFor(predicate, label) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }
  throw new Error(`timed out waiting for ${label}`);
}

async function connectGateway(path, consumerId, lane) {
  const socket = createConnection(path);
  await once(socket, "connect");
  const receipt = nextJsonLine(socket, 2000, `${consumerId} handshake`);
  socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: consumerId, lane,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {})})}\n`);
  return {socket, receipt: await receipt};
}

async function connectAcknowledgedGateway(path, consumerId, lane, continuity = {}) {
  const socket = createConnection(path);
  const lines = collectJsonLines(socket);
  await once(socket, "connect");
  socket.write(`${JSON.stringify({
    schema_version: GATEWAY_CONNECT_SCHEMA,
    consumer_id: consumerId,
    lane,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, last_acked_sequence: continuity.last_acked_sequence ?? 0, request_aliases: continuity.request_aliases ?? [], ...(continuity.resume_token ? {resume_token: continuity.resume_token} : {})},
  })}\n`);
  return {socket, lines, receipt: await lines.next(`${consumerId} acknowledged handshake`)};
}

function fixture(options = {}) {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-test-"));
  const listenPath = testGatewayPath(directory);
  const observationPath = options.observation_token ? testGatewayPath(directory, "observation") : null;
  const restrictedHome = options.require_restricted_mcp_catalog ? join(directory, "codex-home") : null;
  const restrictedConfigPath = restrictedHome ? join(restrictedHome, "config.toml") : null;
  if (restrictedHome) {
    mkdirSync(restrictedHome, {mode: 0o700});
    writeFileSync(restrictedConfigPath, "web_search = \"disabled\"\n", {mode: 0o600});
  }
  const children = [];
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    ...(observationPath ? {observation_listen_path: observationPath, observation_token: options.observation_token} : {}),
    runtime_epoch_id: "are-gateway-runtime:test",
    backend: options.backend ?? {mode: "direct-stdio"},
    backend_adapter: options.backend_adapter ?? (options.codex_protocol
      ? createCodexGatewayBackendAdapter()
      : createJsonLineProcessBackendAdapter({adapter_id: "gateway-continuity-fixture/v1", command: "fixture-backend"})),
    ...(options.expected_codex_version ? {expected_codex_version: options.expected_codex_version} : {}),
    ...(options.desktop_backend_binding ? {desktop_backend_binding: options.desktop_backend_binding} : {}),
    ...(options.turn_ingress_blocked_reason ? {turn_ingress_blocked_reason: options.turn_ingress_blocked_reason} : {}),
    ...(options.require_mcp_hook_relay ? {require_mcp_hook_relay: true} : {}),
    ...(options.require_restricted_mcp_catalog ? {require_restricted_mcp_catalog: true} : {}),
    ...(options.allow_hosted_effect_tool ? {allow_hosted_effect_tool: true} : {}),
    ...(restrictedHome ? {restricted_host_config: options.restricted_host_config ?? {
      codex_home: restrictedHome, sha256: restrictedHostConfigDigest(restrictedHome)}} : {}),
    ...(options.hosted_input_attestation_key ? {
      hosted_input_attestation_key: options.hosted_input_attestation_key,
      hosted_input_consumer_id: options.hosted_input_consumer_id,
    } : {}),
    max_clients: options.max_clients ?? 4,
    max_buffered_messages_per_client: options.max_buffered_messages_per_client ?? 4,
    reconnect: options.reconnect ?? true,
    detach_timeout_ms: options.detach_timeout_ms,
    idle_timeout_ms: options.idle_timeout_ms,
    max_retained_bytes_per_session: options.max_retained_bytes_per_session,
    max_reasoning_log_bytes_per_session: options.max_reasoning_log_bytes_per_session,
    expiration_tombstone_ttl_ms: options.expiration_tombstone_ttl_ms,
    eviction_retry_ms: options.eviction_retry_ms,
    authorize_client: options.authorize_client,
    session_store: options.session_store,
    ...(options.conversation_binding_gate ? {conversation_binding_gate: options.conversation_binding_gate} : {}),
    ...(options.require_model_entry_receipt ? {require_model_entry_receipt: true} : {}),
    wrapper_factory: options.wrapper_factory ?? passThroughWrapper,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    spawn_impl: (command, args) => {
      const child = fakeChild();
      child.command = command;
      child.args = args;
      children.push(child);
      return child;
    },
  });
  return {gateway, listenPath, observationPath, children, restrictedConfigPath};
}

test("gateway shutdown waits for its backend to exit before reporting completion", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-owned-exit-"));
  const listenPath = testGatewayPath(directory);
  const child = fakeChild();
  let spawns = 0;
  let releaseExit;
  child.kill = signal => {
    child.killed = true;
    if (signal === "SIGTERM") releaseExit = () => {
      child.exitCode = 0;
      child.signalCode = "SIGTERM";
      child.emit("exit", 0, "SIGTERM");
    };
  };
  const gateway = createPersistentGateway({listen_path: listenPath,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    backend_adapter: createJsonLineProcessBackendAdapter({adapter_id: "owned-exit-fixture/v1",
      command: "fixture-backend"}), wrapper_factory: passThroughWrapper,
    spawn_impl: () => { spawns += 1; return child; }});
  await gateway.start();
  const connection = await connectGateway(listenPath, "codex:owned-exit", "interaction-bound");
  try {
    assert.equal(connection.receipt.ok, true);
    let closed = false;
    const closing = gateway.close().then(() => { closed = true; });
    assert.equal(child.killed, true);
    assert.equal(typeof releaseExit, "function");
    await new Promise(resolveWait => setTimeout(resolveWait, 20));
    assert.equal(closed, false, "the gateway must not exit while its backend is still live");
    const late = createConnection(listenPath);
    late.on("error", () => {});
    await once(late, "close");
    assert.equal(spawns, 1, "shutdown must not admit a second backend");
    releaseExit();
    await closing;
    assert.equal(closed, true);
  } finally {
    connection.socket.destroy();
    if (child.exitCode === null) releaseExit?.();
    await gateway.close();
  }
});

test("managed Codex gateway pauses model entry before any client dispatch intent", async (context) => {
  const reason = "windows-client.hook-boundary-unverified";
  assert.throws(() => fixture({codex_protocol: true, turn_ingress_blocked_reason: "other"}),
    /exact Codex Windows hook-boundary reason/);
  assert.throws(() => fixture({turn_ingress_blocked_reason: reason}),
    /exact Codex Windows hook-boundary reason/);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, turn_ingress_blocked_reason: reason});
  await gateway.start();
  context.after(() => gateway.close());
  assert.deepEqual(gateway.observeAdapters().model_entry_ingress, {status: "paused", reason_code: reason});
  const connection = await connectAcknowledgedGateway(listenPath, "codex:paused-ingress", "interaction-bound");
  for (const [index, method] of ["turn/start", "turn/steer", "review/start", "thread/compact/start"].entries()) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index + 1, method,
      params: method === "turn/start" ? safeCodexTurnParams("thread-1") : {threadId: "thread-1"}})}\n`);
    const denied = (await connection.lines.next(`paused ${method}`)).message;
    assert.equal(denied.error.code, -32085);
    assert.deepEqual(denied.error.data.reason_codes, [reason]);
  }
  assert.equal(children[0].stdin.readableLength, 0);
  assert.deepEqual(gateway.inspect().durable_session_index.sessions[0].requests, []);
  const allowed = nextJsonLine(children[0].stdin, 2000, "non-model thread creation");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "paused:thread-start"}})}\n`);
  assert.equal((await allowed).method, "thread/start");
  connection.socket.destroy();
});

test("managed Codex gateway denies a wrapper-produced turn from a non-turn client request", async (context) => {
  const reason = "windows-client.hook-boundary-unverified";
  const {gateway, listenPath, children} = fixture({codex_protocol: true, turn_ingress_blocked_reason: reason,
    wrapper_factory: () => ({...passThroughWrapper(), processClientMessage: async (message) =>
      message.method === "thread/start"
        ? {to_server: [{jsonrpc: "2.0", id: message.id, method: "turn/start",
          params: safeCodexTurnParams("thread-1")}], to_client: []}
        : {to_server: [message], to_client: []}})});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:paused-wrapper", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  assert.deepEqual((await lines.next("paused wrapper-produced turn")).error.data.reason_codes, [reason]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("managed Codex gateway stops before an automatic successor reaches the backend", async (context) => {
  const reason = "windows-client.hook-boundary-unverified";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:paused-successor"});
  const consumerId = "codex:paused-successor";
  const threadId = "paused-successor-thread";
  const turnId = "paused-successor-parent";
  const token = "paused-successor-secret";
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "plan-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const requestKey = `fixture:turn-start:${turnId}`;
  const response = {jsonrpc: "2.0", id: 1, result: {turn: {id: turnId, threadId}}};
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    turn_ingress_blocked_reason: reason, wrapper_factory: () => ({...passThroughWrapper(),
      processServerMessage: async (message) => message.method === "turn/completed"
        ? {to_server: [{jsonrpc: "2.0", id: "successor:paused", method: "turn/start",
          params: safeCodexTurnParams(threadId)}], to_client: [message]}
        : {to_server: [], to_client: [message]}})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "plan-bound", {resume_token: token});
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: turnId, status: "completed"}}})}\n`);
  const denied = (await connection.lines.next("paused generated successor")).message;
  assert.deepEqual(denied.error.data.reason_codes, [reason]);
  await waitFor(() => children[0].killed, "backend stopped after paused successor");
  assert.equal(children[0].stdin.readableLength, 0);
  assert.equal(store.getSession(consumerId).requests.length, 1, "No successor dispatch intent is durable.");
  connection.socket.destroy();
});

test("backend resolution distinguishes direct stdio from the official daemon proxy", () => {
  assert.deepEqual(resolveBackendCommand({mode: "direct-stdio"}).args, ["app-server", "--listen", "stdio://"]);
  assert.deepEqual(resolveBackendCommand({mode: "daemon-proxy", socket_path: "/tmp/codex.sock"}).args, ["app-server", "proxy", "--sock", "/tmp/codex.sock"]);
  assert.equal(resolveBackendCommand({mode: "websocket", url: "ws://127.0.0.1:4500"}).url, "ws://127.0.0.1:4500");
  assert.throws(() => resolveBackendCommand({mode: "invented"}), /Unsupported/);
  assert.equal(createCodexGatewayBackendAdapter().thread_ownership, "gateway-created");
  const generic = createJsonLineProcessBackendAdapter({adapter_id: "fixture-agent/v1", command: "fixture-backend"});
  assert.equal(generic.thread_ownership, "unverified");
  assert.deepEqual(validateGatewayBackendAdapter({...generic, thread_ownership: "invented"}).reason_codes,
    ["backend-adapter.thread-ownership-invalid"]);
  assert.deepEqual(validateGatewayBackendAdapter({...generic, client_method_posture: "allow-all"}).reason_codes,
    ["backend-adapter.client-method-posture-invalid"]);
  assert.deepEqual(validateGatewayBackendAdapter({...generic, server_method_posture: "allow-all"}).reason_codes,
    ["backend-adapter.server-method-posture-invalid"]);
});

test("acknowledged gateway and real wrapper reject alternate host execution before backend dispatch", async (context) => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const {gateway, listenPath, children} = fixture({wrapper_factory: () =>
    createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value})});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:alternate-ingress", "plan-bound");
  let backendWrites = "";
  children[0].stdin.on("data", (chunk) => { backendWrites += chunk.toString("utf8"); });
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/shellCommand",
    params: {threadId: "thread-alternate-ingress", command: "echo should-not-run"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "alternate:shell:1"}})}\n`);
  const denied = await connection.lines.next();
  assert.equal(denied.message.error.code, -32081);
  assert.deepEqual(denied.message.error.data.reason_codes, ["host.method-ungoverned"]);
  assert.equal(backendWrites, "");
  connection.socket.destroy();
});

test("gateway admission rejects alternate host execution even with a pass-through wrapper", async (context) => {
  const {gateway, listenPath, children} = fixture({max_buffered_messages_per_client: 16});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:method-policy", "plan-bound");
  let backendWrites = "";
  children[0].stdin.on("data", (chunk) => { backendWrites += chunk.toString("utf8"); });
  const methods = ["thread/shellCommand", "command/exec", "review/start", "fs/writeFile",
    "config/value/write", "mcpServer/tool/call", "thread/inject_items", "turn/unknownStart"];
  for (const [index, method] of methods.entries()) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index + 1, method,
      params: {threadId: "thread-method-policy"}})}\n`);
    const denied = await connection.lines.next(`method denial: ${method}`);
    assert.equal(denied.message.error.code, -32081, method);
    assert.deepEqual(denied.message.error.data.reason_codes,
      [method === "turn/unknownStart" ? "host.method-unknown" : "host.method-ungoverned"], method);
  }
  assert.equal(backendWrites, "");
  connection.socket.destroy();
});

test("only the bound hosted-effect local request can dispatch command/exec with a stable effect key", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-command"});
  const consumerId = "codex:hosted-command";
  const threadId = "hosted-command-thread";
  const effectId = `hosted-effect:${"c".repeat(64)}`;
  bindFixtureThread(store, consumerId, threadId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store, wrapper_factory: () => ({...passThroughWrapper(),
      processClientMessage: async message => message.method === "cyberalchemy/hostedEffect/execute"
        ? {to_server: [{jsonrpc: "2.0", id: message.id, method: "command/exec",
          params: {command: ["node", "--version"]}}], to_client: []}
        : {to_server: [message], to_client: []}})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const request = {jsonrpc: "2.0", id: 41, method: "cyberalchemy/hostedEffect/execute",
    params: {request: {thread_id: threadId, effect_id: effectId}},
    [GATEWAY_REQUEST_META_KEY]: {request_key: effectId}};
  connection.socket.write(`${JSON.stringify({...request,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "wrong-key"}})}\n`);
  assert.deepEqual((await connection.lines.next("wrong effect key")).message.error.data.reason_codes,
    ["hosted-effect.exact-request-key-required"]);
  connection.socket.write(`${JSON.stringify(request)}\n`);
  const forwarded = await nextJsonLine(children[0].stdin);
  assert.equal(forwarded.method, "command/exec");
  assert.notEqual(forwarded.id, request.id);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {exitCode: 0, stdout: "v", stderr: ""}})}\n`);
  const result = await connection.lines.next("hosted command result");
  assert.equal(result.message.id, request.id);
  assert.equal(result.message.result.exitCode, 0);
  connection.socket.destroy();
});

test("broker, real ARE wrapper and gateway join a durable approved command through a fake host", async (context) => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true);
  const consumerId = "codex:hosted-join";
  const threadId = "hosted-join-thread";
  const turnId = "hosted-join-turn";
  const effectId = `hosted-effect:${"d".repeat(64)}`;
  const wrapper = createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value,
    allow_hosted_effect_tool: true, hosted_effect_repository_root: repositoryRoot,
    require_bound_effect_route: true,
    effect_metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT",
      effect_classes: ["persistent-mutation"], reversible: false,
      owner_gate_ref: "Owner of exact hosted command"})});
  const started = await wrapper.processClientMessage({jsonrpc: "2.0", id: 101,
    method: "turn/start", params: {threadId, input: [{type: "text", text: "Implement the bounded change."}]}});
  assert.equal(started.to_server.length, 1);
  await wrapper.processServerMessage({jsonrpc: "2.0", id: 101, result: {turn: {id: turnId}}});
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-join"});
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    allow_hosted_effect_tool: true, session_store: store, wrapper_factory: () => wrapper});
  const journalDir = mkdtempSync(join(tmpdir(), "are-hosted-join-"));
  const journal = createFileHostedEffectJournal({state_dir: journalDir});
  await gateway.start();
  context.after(async () => { journal.close(); await gateway.close(); store.close();
    rmSync(journalDir, {recursive: true, force: true}); });
  const transport = connectGatewayRpcTransport({socket_path: listenPath,
    connection_token: testConnectionToken, consumer_id: consumerId, lane: "interaction-bound"});
  await transport.ready;
  context.after(() => transport.close());
  const rpc = createAppServerRpcClient({transport, request_timeout_ms: 2000});
  const active = async () => true;
  const broker = createHostedEffectBroker({journal, is_active_turn: active,
    assess: createGatewayHostedEffectAssessor({rpc_client: rpc}),
    approve: createHostedEffectApprovalAdapter({approval_broker: {
      request: async () => ({decision: "accept"})}}),
    execute: createHostedEffectCommandExecutor({journal, is_active_turn: active,
      repository_root: repositoryRoot,
      dispatch: createGatewayHostedEffectCommandDispatcher({rpc_client: rpc})})});
  const request = {thread_id: threadId, turn_id: turnId, effect_id: effectId,
    kind: "command", proposal: {command: ["node", "--version"], cwd: repositoryRoot}};
  const resultPromise = broker.requestEffect(request);
  const hostRequest = await nextJsonLine(children[0].stdin, 2000, "broker host command");
  assert.equal(hostRequest.method, "command/exec");
  assert.equal(hostRequest.params.sandboxPolicy.networkAccess, false);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: hostRequest.id,
    result: {exitCode: 0, stdout: "fixture-ok", stderr: ""}})}\n`);
  const result = await resultPromise;
  assert.equal(result.ok, true);
  assert.equal(result.execution.stdout, "fixture-ok");
  assert.equal(journal.inspect().unsettled, 0);
  assert.equal((await broker.requestEffect(request)).execution.stdout, "fixture-ok");
});

test("Codex gateway rejects unsafe lifecycle parameters before a pass-through wrapper or backend sees them", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true, max_buffered_messages_per_client: 16});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:parameter-policy", "interaction-bound");
  let backendWrites = "";
  children[0].stdin.on("data", (chunk) => { backendWrites += chunk.toString("utf8"); });
  const unsafe = [
    {method: "initialize", params: {clientInfo: {name: "are_test", version: "0.1.0"},
      capabilities: {experimentalApi: true, optOutNotificationMethods: ["turn/completed"]}}},
    {method: "initialize", params: {clientInfo: {name: "are_test", version: "0.1.0"},
      capabilities: {futureCapability: true}}},
    {method: "initialize", params: {clientInfo: {name: "are_test", version: "0.1.0"},
      capabilities: {requestAttestation: true}}},
    {method: "thread/start", params: {cwd: "/tmp", approvalPolicy: "never", sandbox: "read-only"}},
    {method: "thread/start", params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only", config: {bypass_hook_trust: true}}},
    {method: "thread/resume", params: {threadId: "thread-1", approvalPolicy: "on-request", sandbox: "workspace-write"}},
    {method: "thread/fork", params: {threadId: "thread-1", approvalPolicy: "on-request", sandbox: "read-only"}},
    {method: "turn/start", params: {threadId: "thread-1", input: [], approvalPolicy: "on-request", sandboxPolicy: {type: "dangerFullAccess"}}},
    {method: "turn/steer", params: {threadId: "thread-1", expectedTurnId: "turn-1", input: [{type: "text", text: "continue"}], model: "override"}},
    {method: "turn/interrupt", params: {threadId: "thread-1", turnId: "turn-1", sandboxPolicy: {type: "dangerFullAccess"}}},
  ];
  for (const [index, request] of unsafe.entries()) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index + 1, ...request})}\n`);
    const denied = await connection.lines.next(`unsafe ${request.method} ${index}`);
    assert.equal(denied.message.error.code, -32082);
  }
  assert.equal(backendWrites, "");
  const safe = {jsonrpc: "2.0", id: unsafe.length + 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "safe:thread:start"}};
  connection.socket.write(`${JSON.stringify(safe)}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "thread/start");
  connection.socket.destroy();
});

test("Codex gateway denies unowned thread data and control before backend dispatch", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:unowned-ingress", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  let backendWrites = "";
  children[0].stdin.on("data", (chunk) => { backendWrites += chunk.toString("utf8"); });
  const requests = [
    {method: "thread/read", params: {threadId: "foreign-thread", includeTurns: false}},
    {method: "thread/turns/list", params: {threadId: "foreign-thread"}},
    {method: "thread/items/list", params: {threadId: "foreign-thread"}},
    {method: "thread/goal/get", params: {threadId: "foreign-thread"}},
    {method: "thread/backgroundTerminals/list", params: {threadId: "foreign-thread"}},
    {method: "mcpServerStatus/list", params: {threadId: "foreign-thread", detail: "toolsAndAuthOnly", limit: 100}},
    {method: "thread/resume", params: {threadId: "foreign-thread", approvalPolicy: "on-request", sandbox: "read-only"}},
    {method: "thread/fork", params: {threadId: "foreign-thread", approvalPolicy: "on-request", sandbox: "read-only", deferGoalContinuation: true}},
    {method: "turn/start", params: safeCodexTurnParams("foreign-thread")},
    {method: "turn/interrupt", params: {threadId: "foreign-thread", turnId: "foreign-turn"}},
    {method: "cyberalchemy/intent/get", params: {threadId: "foreign-thread"}},
    {method: "cyberalchemy/continuation/registerInteraction", params: {threadId: "foreign-thread"}},
  ];
  for (const [index, request] of requests.entries()) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index + 1, ...request})}\n`);
    const denied = await lines.next(`unowned ${request.method}`);
    assert.equal(denied.error?.code, -32102, request.method);
    assert.deepEqual(denied.error.data.reason_codes, ["gateway.thread-unowned"], request.method);
  }
  assert.equal(backendWrites, "");
  connection.socket.destroy();
});

test("opt-in conversation binding gate denies unbound and changed Host identity before direct model entry", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-binding-entry-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:binding-entry"});
  const consumerId = "codex:binding-entry";
  const threadId = "native-bound-thread";
  const trustedContext = Symbol("trusted Host context");
  let currentContext = trustedContext;
  const assertion = {principal_kind: "account", principal_ref: digestValue("principal"),
    host_instance_ref: digestValue("host"), client_instance_ref: digestValue("client"),
    workspace_ref: digestValue("workspace"), backend_adapter_id: "codex-app-server/v1",
    backend_thread_ref: digestValue(threadId), writer_ref: digestValue("writer"),
    creation_receipt_digest: digestValue("native creation receipt")};
  const verifyHost = (value) => value === trustedContext ? assertion : null;
  const gate = {host_context_for: () => currentContext, ttl_ms: 60_000,
    verify_host_context: verifyHost, verify_release: () => null};
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store, conversation_binding_gate: gate});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true}); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const lines = connection.lines;
  bindFixtureThread(store, consumerId, threadId);
  const start = (id) => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
    method: "turn/start", params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: `binding-entry:${id}`}})}\n`);
  start(1);
  assert.deepEqual((await lines.next("unbound model entry")).message.error.data.reason_codes, ["binding.unowned"]);
  assert.equal(children[0].stdin.readableLength, 0);
  const binding = createGatewayBackedConversationBindingContract({session_store: store,
    consumer_id: consumerId, verify_host_context: verifyHost, verify_release: () => null});
  const bound = await binding.bindNewThread({host_context: trustedContext, ttl_ms: 60_000});
  await binding.activate({binding_id: bound.binding_id, host_context: trustedContext});
  const forwarded = nextJsonLine(children[0].stdin, 2000, "authorized bound model entry");
  start(2);
  const native = await forwarded;
  assert.equal(native.method, "turn/start");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: native.id,
    result: {turn: {id: "bound-turn", threadId}}})}\n`);
  assert.equal((await lines.next("bound turn accepted")).message.result.turn.id, "bound-turn");
  currentContext = Symbol("different Host context");
  start(3);
  assert.deepEqual((await lines.next("changed Host identity")).message.error.data.reason_codes,
    ["binding.host-assertion-invalid"]);
  currentContext = trustedContext;
  await binding.drain({binding_id: bound.binding_id, host_context: trustedContext});
  start(4);
  assert.deepEqual((await lines.next("draining binding")).message.error.data.reason_codes,
    ["binding.not-active"]);
  connection.socket.destroy();
});

test("opt-in gateway rejects a bound turn without an in-process objective receipt", async (context) => {
  assert.throws(() => fixture({codex_protocol: true, require_model_entry_receipt: true}),
    /model-entry receipt gate requires the durable conversation binding gate/u);
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-missing-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:receipt-missing"});
  const consumerId = "codex:receipt-missing", threadId = "receipt-missing-thread";
  const host = fixtureConversationGate(threadId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: () => fixtureReceiptWrapper({objective_enabled: false})});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  await bindFixtureConversation(store, consumerId, threadId, host);
  for (const [index, method, params] of [
    [10, "turn/steer", {threadId, expectedTurnId: "unverified-turn", input: [{type: "text", text: "continue"}]}],
    [11, "thread/compact/start", {threadId}],
  ]) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index, method, params,
      [GATEWAY_REQUEST_META_KEY]: {request_key: `receipt:unsupported:${index}`}})}\n`);
    const deniedMethod = (await connection.lines.next("unsupported model-entry method")).message;
    assert.deepEqual(deniedMethod.error?.data?.reason_codes, ["gateway.model-entry-method-unsupported"]);
  }
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId, [{type: "text", text: "Research context management approaches."}]),
    model_entry_receipts: [{receipt_digest: "a".repeat(64)}],
    [GATEWAY_REQUEST_META_KEY]: {request_key: "receipt:missing"}})}\n`);
  const denied = (await connection.lines.next("missing model-entry receipt")).message;
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.model-entry-receipt-missing-or-invalid"]);
  assert.equal(children[0].stdin.readableLength, 0);
  assert.equal(store.getSession(consumerId).requests[0].pre_dispatch_rejection, true);
  assert.equal(store.getSession(consumerId).requests[0].model_entry_proof, undefined);
  connection.socket.destroy();
});

test("opt-in receipt gate refuses a fabricated wrapper factory before backend startup", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-wrapper-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:receipt-wrapper"});
  const host = fixtureConversationGate("fixture-thread");
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: passThroughWrapper});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const connection = await connectAcknowledgedGateway(listenPath, "codex:receipt-wrapper", "interaction-bound");
  assert.equal(connection.receipt.ok, false);
  assert.match(connection.receipt.detail, /gateway.model-entry-wrapper-untrusted/u);
  assert.equal(children.length, 0);
  connection.socket.destroy();
});

test("opt-in receipt gate does not share one wrapper instance across gateway sessions", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-shared-wrapper-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:receipt-shared-wrapper"});
  const host = fixtureConversationGate("fixture-thread");
  const wrapper = fixtureReceiptWrapper();
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: () => wrapper});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const first = await connectAcknowledgedGateway(listenPath, "codex:receipt-shared-a", "interaction-bound");
  assert.equal(first.receipt.ok, true);
  const second = await connectAcknowledgedGateway(listenPath, "codex:receipt-shared-b", "interaction-bound");
  assert.equal(second.receipt.ok, false);
  assert.match(second.receipt.detail, /gateway.model-entry-wrapper-untrusted/u);
  assert.equal(children.length, 1);
  first.socket.destroy(); second.socket.destroy();
});

test("opt-in gateway never dispatches when the verified receipt cannot be journaled", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-undurable-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:receipt-undurable"});
  const failingStore = {...store, append: event => event.event_kind === "model-entry-verified"
    ? {ok: false, reason_codes: ["fixture.proof-undurable"]} : store.append(event)};
  const consumerId = "codex:receipt-undurable", threadId = "receipt-undurable-thread";
  const host = fixtureConversationGate(threadId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: failingStore,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: () => fixtureReceiptWrapper()});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  await bindFixtureConversation(store, consumerId, threadId, host);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId, [{type: "text", text: "Research context management approaches."}]),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "receipt:undurable"}})}\n`);
  await waitFor(() => children[0].killed, "gateway stopped after undurable model-entry proof");
  assert.equal(children[0].stdin.readableLength, 0);
  assert.equal(store.getSession(consumerId).requests[0].model_entry_proof, undefined);
  connection.socket.destroy();
});

test("opt-in gateway refuses a recovered turn intent lacking model-entry proof", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-recovery-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:receipt-recovery"});
  const consumerId = "codex:receipt-recovery", threadId = "receipt-recovery-thread";
  const host = fixtureConversationGate(threadId);
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("receipt-recovery-token")}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: "receipt:unproven", method: "turn/start",
      binding_digest: digestValue("unproven request"),
      thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: () => fixtureReceiptWrapper()});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound",
    {resume_token: "receipt-recovery-token"});
  assert.equal(connection.receipt.ok, false);
  assert.match(connection.receipt.detail, /recovered-model-entry-receipt-missing/u,
    JSON.stringify(connection.receipt));
  assert.equal(children.length, 0);
  connection.socket.destroy();
});

test("opt-in gateway persists the real wrapper receipt before direct backend dispatch", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-receipt-direct-"));
  const storeId = "gateway-store:receipt-direct";
  const storePath = join(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path: storePath, store_id: storeId});
  const consumerId = "codex:receipt-direct", threadId = "receipt-direct-thread";
  const host = fixtureConversationGate(threadId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: host.gate, require_model_entry_receipt: true,
    wrapper_factory: () => fixtureReceiptWrapper()});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close(); rmSync(directory, {recursive: true, force: true});});
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  await bindFixtureConversation(store, consumerId, threadId, host);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId, [{type: "text", text: "Research context management approaches."}]),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "receipt:direct"}})}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 5000, "receipt-bound direct turn");
  assert.equal(forwarded.method, "turn/start");
  const request = store.getSession(consumerId).requests.find(item => item.request_key === "receipt:direct");
  assert.equal(request.model_entry_proof.receipt.source, "direct");
  assert.equal(request.model_entry_proof.receipt.request_binding_digest, request.binding_digest);
  assert.equal(request.model_entry_proof.receipt.thread_ref, request.thread_ref);
  assert.equal(request.model_entry_proof.forwarded_binding_digest,
    digestValue({method: forwarded.method, params: forwarded.params}));
  const events = readFileSync(storePath, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(events.findIndex(event => event.event_kind === "dispatch-intent")
    < events.findIndex(event => event.event_kind === "model-entry-verified"), true);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {turn: {id: "receipt-direct-turn", threadId}}})}\n`);
  const accepted = (await connection.lines.next("receipt direct turn accepted")).message;
  assert.equal(accepted.result.turn.id, "receipt-direct-turn");
  const proposal = {proposal_id: "P1", declared_plan_digest: "plan:P1", action_ref: "validate",
    route_id: "CA2-ROUTE-VALIDATE", objective_kind: "validate", effect_classes: ["non-effectful-validate"],
    reversible: true, evidence_refs: ["plan:P1"], next_turn: {params: {threadId,
      input: [{type: "text", text: "Validate the bounded result."}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}}};
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    method: "cyberalchemy/continuation/registerPlan", params: {threadId, proposal},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "receipt:plan"}})}\n`);
  const registration = (await connection.lines.next("receipt plan registered")).message;
  assert.equal(registration.result?.registered, true, JSON.stringify(registration));
  const generatedPromise = nextJsonLine(children[0].stdin, 5000, "receipt-bound generated turn");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: "receipt-direct-turn", items: [], status: "completed"}}})}\n`);
  const completionMessage = (await connection.lines.next("receipt completion projection")).message;
  assert.equal(completionMessage.method, "turn/completed", JSON.stringify(completionMessage));
  const generated = await generatedPromise;
  assert.equal(generated.method, "turn/start");
  const generatedRequest = store.getSession(consumerId).requests.find(item => item.request_key.startsWith("are-generated:"));
  assert.equal(generatedRequest.model_entry_proof.receipt.source, "generated");
  assert.equal(generatedRequest.model_entry_proof.forwarded_binding_digest, generatedRequest.binding_digest);
  assert.equal(generatedRequest.binding_digest, digestValue({method: generated.method, params: generated.params}));
  const generatedEvents = readFileSync(storePath, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(generatedEvents.findIndex(event => event.event_kind === "dispatch-intent"
    && event.content.request_key === generatedRequest.request_key)
    < generatedEvents.findIndex(event => event.event_kind === "model-entry-verified"
      && event.content.request_key === generatedRequest.request_key), true);
  assert.equal(store.compact().ok, true);
  assert.equal(store.getSession(consumerId).requests.find(item => item.request_key === "receipt:direct")
    .model_entry_proof.receipt.receipt_digest,
    request.model_entry_proof.receipt.receipt_digest);
  connection.socket.destroy();
});

test("conversation binding gate cannot start with a memory store or incomplete Host verifier", () => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:invalid-binding-gate"});
  assert.throws(() => fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: {host_context_for: () => null, ttl_ms: 60_000,
      verify_host_context: () => null, verify_release: () => null}}),
  /conversation binding gate requires/u);
  store.close();
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-binding-invalid-"));
  const durable = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:invalid-binding-provider"});
  try {
    assert.throws(() => fixture({codex_protocol: true, session_store: durable,
      conversation_binding_gate: {host_context_for: () => null, ttl_ms: 60_000,
        verify_host_context: () => null}}), /conversation binding gate requires/u);
  } finally {
    durable.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("opt-in conversation binding gate also denies wrapper-generated model entry", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-binding-generated-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:binding-generated"});
  const consumerId = "codex:binding-generated";
  const threadId = "native-generated-thread";
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    conversation_binding_gate: {host_context_for: () => null, ttl_ms: 60_000,
      verify_host_context: () => null, verify_release: () => null},
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) =>
      message.result?.thread?.id === threadId
        ? {to_server: [{jsonrpc: "2.0", id: "generated:bound", method: "turn/start",
          params: safeCodexTurnParams(threadId)}], to_client: [message]}
        : {to_server: [], to_client: [message]}})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true}); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const lines = connection.lines;
  bindFixtureThread(store, consumerId, threadId);
  const forwarded = nextJsonLine(children[0].stdin, 2000, "thread read before generated entry");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/read",
    params: {threadId, includeTurns: false}})}\n`);
  const read = await forwarded;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: read.id,
    result: {thread: {id: threadId, turns: []}}})}\n`);
  assert.deepEqual((await lines.next("generated unbound entry")).message.error.data.reason_codes,
    ["binding.unowned"]);
  await waitFor(() => children[0].killed, "generated-entry backend stopped");
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("opt-in native thread creation binds its exact durable acceptance before client success or first turn", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-native-binding-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:native-binding"});
  const consumerId = "codex:native-binding";
  const threadId = "created-native-thread";
  const hostContext = Symbol("Host-owned context");
  let assertion = null;
  const gate = {ttl_ms: 60_000,
    host_context_for: ({creation_acceptance: acceptance}) => {
      if (acceptance) assertion = {principal_kind: "account", principal_ref: digestValue("native-principal"),
        host_instance_ref: digestValue("native-host"), client_instance_ref: digestValue("native-client"),
        workspace_ref: digestValue("native-workspace"), backend_adapter_id: "codex-app-server/v1",
        backend_thread_ref: digestValue(threadId), writer_ref: digestValue("native-writer"),
        creation_receipt_digest: acceptance.acceptance_digest};
      return hostContext;
    },
    verify_host_context: (value) => value === hostContext ? assertion : null,
    verify_release: () => null};
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store, conversation_binding_gate: gate});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true}); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const creation = nextJsonLine(children[0].stdin, 2000, "native creation dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "native-binding:create"}})}\n`);
  const nativeCreation = await creation;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: nativeCreation.id,
    result: {thread: {id: threadId}}})}\n`);
  assert.equal((await connection.lines.next("bound native creation")).message.result.thread.id, threadId);
  const retained = store.getSession(consumerId);
  assert.equal(retained.conversation_binding_events.length, 2);
  assert.equal(retained.conversation_binding_events[0].binding.creation_receipt_digest,
    retained.requests.find((item) => item.request_key === "native-binding:create")
      .creation_acceptance.acceptance_digest);
  assert.equal(retained.conversation_binding_events[1].kind, "activated");
  const turn = nextJsonLine(children[0].stdin, 2000, "bound first turn dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "native-binding:first-turn"}})}\n`);
  assert.equal((await turn).method, "turn/start");
  connection.socket.destroy();
});

test("opt-in native thread creation withholds success when the Host creation assertion mismatches", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-native-mismatch-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:native-mismatch"});
  const consumerId = "codex:native-mismatch";
  const threadId = "orphaned-native-thread";
  const gate = {ttl_ms: 60_000, host_context_for: () => Symbol("Host context"),
    verify_host_context: () => ({principal_kind: "account", principal_ref: digestValue("principal"),
      host_instance_ref: digestValue("host"), client_instance_ref: digestValue("client"),
      workspace_ref: digestValue("workspace"), backend_adapter_id: "codex-app-server/v1",
      backend_thread_ref: digestValue(threadId), writer_ref: digestValue("writer"),
      creation_receipt_digest: digestValue("wrong creation")}), verify_release: () => null};
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store, conversation_binding_gate: gate});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true}); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const creation = nextJsonLine(children[0].stdin, 2000, "mismatched native creation dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "native-mismatch:create"}})}\n`);
  const nativeCreation = await creation;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: nativeCreation.id,
    result: {thread: {id: threadId}}})}\n`);
  assert.deepEqual((await connection.lines.next("creation identity mismatch")).message.error.data.reason_codes,
    ["binding.creation-identity-mismatch"]);
  await waitFor(() => children[0].killed, "unbound native backend stopped");
  const retained = store.getSession(consumerId);
  assert.equal(retained.conversation_binding_events.length, 0);
  assert.ok(retained.requests[0].creation_acceptance,
    "native creation remains an uncertain accepted outcome, not a fabricated rejection");
  connection.socket.destroy();
});

test("opt-in binding profile requires acknowledged continuity and refuses unproven fork", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-binding-profile-"));
  const store = createFileGatewaySessionStore({path: join(directory, "sessions.jsonl"),
    store_id: "gateway-store:binding-profile"});
  const gate = {ttl_ms: 60_000, host_context_for: () => null,
    verify_host_context: () => null, verify_release: () => null};
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store, conversation_binding_gate: gate});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true}); });
  const legacy = await connectGateway(listenPath, "codex:legacy-binding", "interaction-bound");
  assert.equal(legacy.receipt.reason, "binding.acknowledged-continuity-required");
  assert.equal(children.length, 0);
  legacy.socket.destroy();
  const connection = await connectAcknowledgedGateway(listenPath, "codex:fork-binding", "interaction-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/fork",
    params: {threadId: "any-native-thread", approvalPolicy: "on-request", sandbox: "read-only",
      deferGoalContinuation: true},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "binding:fork"}})}\n`);
  assert.deepEqual((await connection.lines.next("unproven fork")).message.error.data.reason_codes,
    ["binding.fork-unsupported"]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("opt-in Codex gateway requires a fresh backend MCP relay catalog for each owned turn", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:mcp-relay"});
  const consumerId = "codex:mcp-relay";
  const threadId = "mcp-owned-thread";
  bindFixtureThread(store, consumerId, threadId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    require_mcp_hook_relay: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), observeReasoningThreads: () => [{
      thread_ref: `backend-thread:${digestValue(threadId)}`, phase: "turn-active",
      reasoning_epoch_digest: "a".repeat(64), checkpoint_digest: "b".repeat(64),
      latest_frontier_digest: null, last_completion_status: null,
    }]})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, consumerId, "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  const sendRequest = (id, method, params) => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method, params})}\n`);
  const start = (id, requestKey = null) => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
    method: "turn/start", params: safeCodexTurnParams(threadId),
    ...(requestKey ? {[GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}} : {})})}\n`);
  const status = (id) => sendRequest(id, "mcpServerStatus/list",
    {threadId, detail: "toolsAndAuthOnly", limit: 100});
  start(1);
  assert.deepEqual((await lines.next("unproven relay turn")).error.data.reason_codes,
    ["gateway.mcp-hook-relay-preflight-required"]);
  status(2);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    result: {data: [], nextCursor: null}})}\n`);
  await lines.next("missing relay status");
  assert.equal(gateway.observeReasoningThreads().threads[0].mcp_hook_relay_check.status, "not-ready");
  start(3);
  assert.deepEqual((await lines.next("missing relay turn")).error.data.reason_codes,
    ["gateway.mcp-hook-relay-preflight-required"]);
  status(4);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, result: {data: [{name: "are_hosted_hook_relay",
    runtimeStatus: "connected", toolsError: null,
    tools: {are_hook_observe: {name: "are_hook_observe"}}}], nextCursor: null}})}\n`);
  await lines.next("ready relay status");
  const relayCheck = gateway.observeReasoningThreads().threads[0].mcp_hook_relay_check;
  assert.equal(relayCheck.status, "listed");
  assert.ok(Number.isSafeInteger(relayCheck.checked_at_unix_ms));
  start(5, "turn:mcp-relay-one");
  assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/start");
  start(6, "turn:mcp-relay-one");
  await waitFor(() => gateway.inspect().sessions[0]?.deduplicated_request_count === 1,
    "adopted keyed turn without a second relay check");
  start(7, "turn:mcp-relay-two");
  assert.deepEqual((await lines.next("consumed relay proof")).error.data.reason_codes,
    ["gateway.mcp-hook-relay-preflight-required"]);
  connection.socket.destroy();
});

test("restricted gateway requires a fresh catalog for hosted steering", async context => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:restricted-steer"});
  const consumerId = "codex:restricted-steer";
  const threadId = "restricted-steer-thread";
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, "restricted-steer-turn");
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    require_restricted_mcp_catalog: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, consumerId, "interaction-bound");
  context.after(() => connection.socket.destroy());
  const lines = collectJsonLines(connection.socket);
  const steer = id => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
    method: "turn/steer", params: {threadId, expectedTurnId: "restricted-steer-turn",
      input: [{type: "text", text: "Correct the objective."}]},
    [GATEWAY_REQUEST_META_KEY]: {request_key: `steer:${id}`}})}\n`);
  steer(1);
  assert.deepEqual((await lines.next("steer without catalog")).error.data.reason_codes,
    ["gateway.restricted-mcp-catalog-preflight-required"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    method: "mcpServerStatus/list", params: {threadId, detail: "toolsAndAuthOnly", limit: 100}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    result: {data: [], nextCursor: null}})}\n`);
  await lines.next("steer catalog ready");
  steer(3);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/steer");
  steer(4);
  assert.deepEqual((await lines.next("steer catalog consumed")).error.data.reason_codes,
    ["gateway.restricted-mcp-catalog-preflight-required"]);
});

test("restricted gateway consumes only exact per-thread MCP snapshots before turns", async context => {
  const relay = {name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}};
  for (const [requireRelay, invalid, valid] of [
    [false, {data: [relay], nextCursor: null}, {data: [], nextCursor: null}],
    [true, {data: [{...relay, tools: {...relay.tools, extra: {name: "extra"}}}], nextCursor: null},
      {data: [relay], nextCursor: null}],
  ]) {
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:restricted-mcp:${requireRelay}`});
    const consumerId = `codex:restricted-mcp:${requireRelay}`;
    const threadId = `restricted-owned-thread-${requireRelay}`;
    bindFixtureThread(store, consumerId, threadId);
    const {gateway, listenPath, children} = fixture({codex_protocol: true,
      require_mcp_hook_relay: requireRelay, require_restricted_mcp_catalog: true,
      session_store: store, wrapper_factory: () => ({...passThroughWrapper(), observeReasoningThreads: () => [{
        thread_ref: `backend-thread:${digestValue(threadId)}`, phase: "turn-active",
        reasoning_epoch_digest: "a".repeat(64), checkpoint_digest: "b".repeat(64),
        latest_frontier_digest: null, last_completion_status: null,
      }]})});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectGateway(listenPath, consumerId, "interaction-bound");
    context.after(() => connection.socket.destroy());
    const lines = collectJsonLines(connection.socket);
    const start = (id, key) => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
      method: "turn/start", params: safeCodexTurnParams(threadId),
      [GATEWAY_REQUEST_META_KEY]: {request_key: key}})}\n`);
    const status = id => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
      method: "mcpServerStatus/list", params: {threadId, detail: "toolsAndAuthOnly", limit: 100}})}\n`);
    const reason = ["gateway.restricted-mcp-catalog-preflight-required"];
    start(1, "turn:before-catalog");
    assert.deepEqual((await lines.next("missing restricted catalog")).error.data.reason_codes, reason);
    status(2);
    assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, result: invalid})}\n`);
    await lines.next("invalid restricted catalog response");
    start(3, "turn:after-invalid-catalog");
    assert.deepEqual((await lines.next("invalid restricted catalog")).error.data.reason_codes, reason);
    status(4);
    assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, result: valid})}\n`);
    await lines.next("valid restricted catalog response");
    start(5, "turn:after-valid-catalog");
    assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/start");
    start(6, "turn:second-without-refresh");
    assert.deepEqual((await lines.next("consumed restricted catalog")).error.data.reason_codes, reason);
  }
});

test("restricted gateway denies changed host config before a model turn and consumes prior catalog proof", async context => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:restricted-config-drift"});
  const consumerId = "codex:restricted-config-drift";
  const threadId = "restricted-config-owned-thread";
  bindFixtureThread(store, consumerId, threadId);
  const {gateway, listenPath, children, restrictedConfigPath} = fixture({codex_protocol: true,
    require_restricted_mcp_catalog: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, consumerId, "interaction-bound");
  context.after(() => connection.socket.destroy());
  const lines = collectJsonLines(connection.socket);
  const send = (id, method, params, requestKey = null) => connection.socket.write(`${JSON.stringify({
    jsonrpc: "2.0", id, method, params,
    ...(requestKey ? {[GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}} : {}),
  })}\n`);
  const status = id => send(id, "mcpServerStatus/list", {threadId, detail: "toolsAndAuthOnly", limit: 100});
  status(1);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 1,
    result: {data: [], nextCursor: null}})}\n`);
  await lines.next("ready restricted config catalog");
  writeFileSync(restrictedConfigPath, "web_search = \"cached\"\n");
  send(2, "turn/start", safeCodexTurnParams(threadId), "turn:config-drift");
  assert.deepEqual((await lines.next("changed host config")).error.data.reason_codes,
    ["gateway.restricted-host-config-drift"]);
  const restarted = await connectGateway(listenPath, "codex:restricted-config-new-session", "interaction-bound");
  context.after(() => restarted.socket.destroy());
  assert.equal(restarted.receipt.ok, false);
  assert.equal(restarted.receipt.reason, "gateway.session-start-failed");
  assert.equal(restarted.receipt.detail, "gateway.restricted-host-config-drift");
  assert.equal(children.length, 1, "changed config cannot spawn another backend");
  writeFileSync(restrictedConfigPath, "web_search = \"disabled\"\n");
  send(3, "turn/start", safeCodexTurnParams(threadId), "turn:config-restored");
  assert.deepEqual((await lines.next("old catalog consumed on drift")).error.data.reason_codes,
    ["gateway.restricted-mcp-catalog-preflight-required"]);
  status(4);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "mcpServerStatus/list");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 4,
    result: {data: [], nextCursor: null}})}\n`);
  await lines.next("fresh catalog after config restore");
  send(5, "turn/start", safeCodexTurnParams(threadId), "turn:config-restored-fresh");
  assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/start");
});

test("Codex gateway rejects unscoped thread listing even after creating an owned thread", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:scoped-ingress", "plan-bound");
  const lines = collectJsonLines(connection.socket);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  const created = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: created.id,
    result: {thread: {id: "owned-thread"}}})}\n`);
  assert.equal((await lines.next("thread creation")).result.thread.id, "owned-thread");
  for (const [index, method] of ["thread/list", "thread/loaded/list"].entries()) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: index + 2, method, params: {}})}\n`);
    const denied = await lines.next(`unscoped ${method}`);
    assert.equal(denied.error?.code, -32102, method);
    assert.deepEqual(denied.error.data.reason_codes, ["gateway.unscoped-thread-read-unsupported"], method);
  }
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, method: "thread/read",
    params: {threadId: "owned-thread", includeTurns: false}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, result: {thread: {id: "owned-thread"}}})}\n`);
  assert.equal((await lines.next("owned thread read")).result.thread.id, "owned-thread");
  connection.socket.destroy();
});

test("Codex gateway stops before forwarding an unowned server thread event", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:foreign-event", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId: "foreign-thread", turn: {id: "private-turn", status: "completed"}}})}\n`);
  const denied = await lines.next("unowned server event");
  assert.equal(denied.error?.code, -32102);
  assert.deepEqual(denied.error.data.reason_codes, ["gateway.host-event-thread-unowned"]);
  assert.equal(JSON.stringify(denied).includes("private-turn"), false);
  await waitFor(() => children[0].killed, "unowned event session stop");
  connection.socket.destroy();
});

test("DSH gateway rejects unowned and malformed server events before delivery", {skip: !createDshGatewayBackendAdapter}, async (context) => {
  for (const [name, event, reason] of [
    ["unowned", {method: "turn/completed", params: {threadId: "foreign-thread", turn: {id: "private-turn"}}}, "gateway.host-event-thread-unowned"],
    ["missing thread", {method: "turn/completed", params: {turn: {id: "private-turn"}}}, "dsh.server-thread-id-required"],
    ["unknown method", {method: "private/event", params: {threadId: "foreign-thread", secret: "private-turn"}}, "dsh.server-method-unknown"],
  ]) {
    const {gateway, listenPath, children} = fixture({backend: {}, backend_adapter: createDshGatewayBackendAdapter()});
    await gateway.start();
    context.after(() => gateway.close());
    const connection = await connectGateway(listenPath, `codex:dsh-event-${name}`, "interaction-bound");
    const lines = collectJsonLines(connection.socket);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...event})}\n`);
    const denied = await lines.next(`DSH ${name} event rejection`);
    assert.deepEqual(denied.error?.data?.reason_codes, [reason]);
    assert.equal(JSON.stringify(denied).includes("private-turn"), false);
    await waitFor(() => children[0].killed, `DSH ${name} session stop`);
    connection.socket.destroy();
  }
});

test("DSH gateway rejects unsolicited backend responses before delivery", {skip: !createDshGatewayBackendAdapter}, async (context) => {
  const {gateway, listenPath, children} = fixture({backend: {}, backend_adapter: createDshGatewayBackendAdapter()});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:dsh-unsolicited", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 99,
    result: {thread: {id: "foreign-thread", name: "private-name"}}})}\n`);
  const denied = await lines.next("DSH unsolicited response rejection");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-response-unsolicited"]);
  assert.equal(JSON.stringify(denied).includes("private-name"), false);
  await waitFor(() => children[0].killed, "DSH unsolicited response session stop");
  connection.socket.destroy();
});

test("DSH gateway delivers only owned server events and rejects mismatched responses", {skip: !createDshGatewayBackendAdapter}, async (context) => {
  const {gateway, listenPath, children} = fixture({backend: {}, backend_adapter: createDshGatewayBackendAdapter()});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:dsh-owned-event", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  const backendLines = collectJsonLines(children[0].stdin);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start", params: {}})}\n`);
  const start = await backendLines.next("DSH thread start dispatch");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: start.id,
    result: {thread: {id: "owned-dsh-thread"}}})}\n`);
  assert.equal((await lines.next("DSH thread start response")).result.thread.id, "owned-dsh-thread");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId: "owned-dsh-thread", turn: {id: "owned-turn", status: "completed"}}})}\n`);
  assert.equal((await lines.next("owned DSH event")).params.turn.id, "owned-turn");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/resume",
    params: {threadId: "owned-dsh-thread"}})}\n`);
  const resume = await backendLines.next("DSH thread resume dispatch");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: resume.id,
    result: {thread: {id: "foreign-thread", name: "private-name"}}})}\n`);
  const denied = await lines.next("DSH mismatched response rejection");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-response-thread-mismatch"]);
  assert.equal(JSON.stringify(denied).includes("private-name"), false);
  await waitFor(() => children[0].killed, "DSH mismatched response session stop");
  connection.socket.destroy();
});

test("Codex gateway rejects a scoped host event with a missing thread ID", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:missing-event-thread", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {turn: {id: "private-turn", status: "completed"}}})}\n`);
  const denied = await lines.next("missing event thread ID");
  assert.deepEqual(denied.error?.data?.reason_codes, ["host.server-thread-id-required"]);
  assert.equal(JSON.stringify(denied).includes("private-turn"), false);
  await waitFor(() => children[0].killed, "malformed event session stop");
  connection.socket.destroy();
});

test("Codex gateway stops malformed owned turn lifecycle events before the ARE wrapper", async (context) => {
  for (const [index, method, turn] of [
    [1, "turn/completed", {status: "completed", items: [{text: "PRIVATE_COMPLETION"}]}],
    [2, "turn/completed", {id: "private-turn", status: "inProgress", items: []}],
    [3, "turn/started", {id: "private-turn", status: "completed", items: []}],
  ]) {
    const consumerId = `codex:malformed-turn-${index}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:malformed-turn-${index}`});
    let wrapperCalls = 0;
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
      wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
        wrapperCalls += 1;
        return {to_server: [], to_client: [message]};
      }})});
    await gateway.start();
    context.after(async () => {await gateway.close(); store.close();});
    const connection = await connectGateway(listenPath, consumerId, "interaction-bound");
    const lines = collectJsonLines(connection.socket);
    bindFixtureThread(store, consumerId, "owned-thread");
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method,
      params: {threadId: "owned-thread", turn}})}\n`);
    const denied = await lines.next("malformed owned turn diagnostic");
    assert.deepEqual(denied.error?.data?.reason_codes, ["host.server-turn-lifecycle-invalid"]);
    assert.equal(JSON.stringify(denied).includes("PRIVATE_COMPLETION"), false);
    assert.equal(JSON.stringify(denied).includes("private-turn"), false);
    await waitFor(() => children[0].killed, "malformed owned turn session stop");
    assert.equal(wrapperCalls, 0, "A malformed lifecycle event must not reach ARE Reasoning State.");
    connection.socket.destroy();
  }
});

for (const [label, admission, completedTurnId] of [
  ["unaccepted", "none", "private-turn"],
  ["pending", "pending", "private-turn"],
  ["mismatched", "accepted", "other-turn"],
  ["accepted", "accepted", "private-turn"],
]) {
  test(`Codex gateway ${["accepted", "pending"].includes(label) ? "delivers" : "rejects"} ${label} turn completion`, async (context) => {
    const consumerId = `codex:completion-${label}`;
    const threadId = `owned-completion-${label}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:completion-${label}`});
    let wrapperCalls = 0;
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
      wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
        wrapperCalls += 1;
        return {to_server: [], to_client: [message]};
      }})});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
    bindFixtureThread(store, consumerId, threadId);
    let upstream;
    if (admission !== "none") {
      connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
        params: safeCodexTurnParams(threadId),
        [GATEWAY_REQUEST_META_KEY]: {request_key: `completion:${label}`}})}\n`);
      upstream = await nextJsonLine(children[0].stdin);
      if (admission === "accepted") {
        children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
          result: {turn: {id: "private-turn", threadId}}})}\n`);
        assert.equal((await connection.lines.next()).message.result.turn.id, "private-turn");
      }
    }
    const baselineCalls = wrapperCalls;
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
      params: {threadId, turn: {id: completedTurnId, status: "completed",
        items: [{type: "agentMessage", text: "PRIVATE_COMPLETION"}]}}})}\n`);
    if (label === "pending") {
      await new Promise((resolveWait) => setTimeout(resolveWait, 20));
      assert.equal(wrapperCalls, baselineCalls, "Early completion must remain private until acceptance.");
      children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
        result: {turn: {id: completedTurnId, threadId}}})}\n`);
      assert.equal((await connection.lines.next("pending turn accepted")).message.result.turn.id, completedTurnId);
    }
    const delivery = await connection.lines.next("completion causality result");
    if (label === "accepted" || label === "pending") {
      assert.equal(delivery.message.method, "turn/completed");
      assert.equal(wrapperCalls, baselineCalls + (label === "pending" ? 2 : 1));
    } else {
      assert.deepEqual(delivery.message.error?.data?.reason_codes, ["gateway.turn-completion-unbound"]);
      assert.equal(wrapperCalls, baselineCalls, "An unbound completion must not reach ARE Reasoning State.");
      assert.doesNotMatch(JSON.stringify(delivery), /PRIVATE_COMPLETION|private-turn|other-turn/u);
      await waitFor(() => children[0].killed, "unbound completion backend shutdown");
    }
    connection.socket.destroy();
  });
}

for (const [label, admission, method, eventParams] of [
  ["unaccepted start", "none", "turn/started", {turn: {id: "private-turn", status: "inProgress"}}],
  ["mismatched item", "accepted", "item/started", {turnId: "other-turn", item: {id: "private-item", type: "agentMessage"}}],
  ["missing item turn", "accepted", "item/agentMessage/delta", {itemId: "private-item", delta: "PRIVATE_DELTA"}],
  ["mismatched turn update", "accepted", "turn/diff/updated", {turnId: "other-turn", diff: "PRIVATE_DIFF"}],
  ["mismatched token usage", "accepted", "thread/tokenUsage/updated", {turnId: "other-turn", tokenUsage: {private: "PRIVATE_DELTA"}}],
  ["mismatched error", "accepted", "error", {turnId: "other-turn", error: {message: "PRIVATE_DELTA"}, willRetry: false}],
  ["mismatched compaction", "accepted", "thread/compacted", {turnId: "other-turn"}],
  ["mismatched model event", "accepted", "model/rerouted", {turnId: "other-turn", reason: "PRIVATE_DELTA"}],
  ["mismatched strict review", "accepted", "autoApprovalReview/strictReviewRequired", {turnId: "other-turn"}],
  ["mismatched hook", "accepted", "hook/started", {turnId: "other-turn", run: {private: "PRIVATE_DELTA"}}],
  ["mismatched goal event", "accepted", "thread/goal/updated", {turnId: "other-turn", goal: {private: "PRIVATE_DELTA"}}],
]) {
  test(`Codex gateway rejects ${label} before the ARE wrapper`, async (context) => {
    const consumerId = `codex:turn-event-${label.replaceAll(" ", "-")}`;
    const threadId = `owned-turn-event-${label.replaceAll(" ", "-")}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:turn-event-${label.replaceAll(" ", "-")}`});
    let wrapperCalls = 0;
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
      wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
        wrapperCalls += 1;
        return {to_server: [], to_client: [message]};
      }})});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
    bindFixtureThread(store, consumerId, threadId);
    if (admission !== "none") {
      connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
        params: safeCodexTurnParams(threadId),
        [GATEWAY_REQUEST_META_KEY]: {request_key: `turn-event:${label}`}})}\n`);
      const upstream = await nextJsonLine(children[0].stdin);
      if (admission === "accepted") {
        children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
          result: {turn: {id: "private-turn", threadId}}})}\n`);
        assert.equal((await connection.lines.next()).message.result.turn.id, "private-turn");
      }
    }
    const baselineCalls = wrapperCalls;
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method,
      params: {threadId, ...eventParams}})}\n`);
    const denied = (await connection.lines.next("turn event binding rejection")).message;
    assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.turn-event-unbound"]);
    assert.equal(wrapperCalls, baselineCalls, "An unbound event must not enter ARE Reasoning State.");
    assert.doesNotMatch(JSON.stringify(denied), /private-turn|private-item|PRIVATE_DELTA|PRIVATE_DIFF|other-turn/u);
    await waitFor(() => children[0].killed, "unbound turn event backend shutdown");
    connection.socket.destroy();
  });
}

test("Codex gateway defers an early turn event until exact durable turn-start acceptance", async (context) => {
  const consumerId = "codex:early-turn-event";
  const threadId = "owned-early-turn-event";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:early-turn-event"});
  let wrapperCalls = 0;
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      wrapperCalls += 1;
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn-event:early"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/started",
    params: {threadId, turn: {id: "private-turn", status: "inProgress"}}})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  assert.equal(wrapperCalls, 0, "Early event must remain private until acceptance is durable.");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {turn: {id: "private-turn", threadId}}})}\n`);
  assert.equal((await connection.lines.next("accepted start response")).message.result.turn.id, "private-turn");
  assert.equal((await connection.lines.next("deferred start event")).message.method, "turn/started");
  assert.equal(wrapperCalls, 2);
  assert.ok(store.getSession(consumerId).host_observations.some((entry) => entry.kind === "turn-start-accepted"));
  connection.socket.destroy();
});

test("Codex gateway replays early compaction and completion only after durable turn acceptance", async (context) => {
  const consumerId = "codex:early-turn-lifecycle";
  const threadId = "owned-early-lifecycle-thread";
  const turnId = "private-early-lifecycle-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:early-turn-lifecycle"});
  const wrapperEvents = [];
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      wrapperEvents.push(message.method ?? "turn/start-response");
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn-event:early-lifecycle"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  for (const event of [
    {method: "turn/started", params: {threadId, turn: {id: turnId, status: "inProgress"}}},
    {method: "thread/tokenUsage/updated", params: {threadId, turnId, tokenUsage: {}}},
    {method: "item/completed", params: {threadId, turnId,
      item: {type: "contextCompaction", id: "private-compaction-item", status: "completed"}}},
    {method: "turn/completed", params: {threadId, turn: {id: turnId, status: "completed"}}},
  ]) children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...event})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  assert.deepEqual(wrapperEvents, [], "Early host events must not reach the wrapper before acceptance.");
  assert.deepEqual(store.getSession(consumerId).host_observations, []);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {turn: {id: turnId, threadId}}})}\n`);
  const delivered = [];
  for (let index = 0; index < 5; index += 1) delivered.push((await connection.lines.next()).message);
  assert.deepEqual(delivered.map((message) => message.method ?? "turn/start-response"),
    ["turn/start-response", "turn/started", "thread/tokenUsage/updated", "item/completed", "turn/completed"]);
  assert.deepEqual(wrapperEvents,
    ["turn/start-response", "turn/started", "thread/tokenUsage/updated", "item/completed", "turn/completed"]);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["turn-start-accepted", "compaction-item-completed", "turn-completion-observed"]);
  assert.equal(store.getSession(consumerId).host_observations[2].turn_status, "completed");
  connection.socket.destroy();
});

test("Codex gateway closes if an early turn event disagrees with accepted turn identity", async (context) => {
  const consumerId = "codex:mismatched-early-turn";
  const threadId = "owned-mismatched-early-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:mismatched-early-turn"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    wrapper_factory: () => passThroughWrapper()});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn-event:mismatched-early"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/started",
    params: {threadId, turn: {id: "private-other-turn", status: "inProgress"}}})}\n`);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {turn: {id: "private-turn", threadId}}})}\n`);
  assert.equal((await connection.lines.next("accepted start response")).message.result.turn.id, "private-turn");
  const denied = (await connection.lines.next("early turn mismatch")).message;
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.pre-acceptance-event-mismatch"]);
  assert.doesNotMatch(JSON.stringify(denied), /private-other-turn|private-turn/u);
  await waitFor(() => children[0].killed, "backend stopped after early turn mismatch");
  connection.socket.destroy();
});

test("Codex gateway never releases an early compaction event after host rejects turn/start", async (context) => {
  const consumerId = "codex:rejected-early-compaction";
  const threadId = "owned-rejected-early-compaction";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:rejected-early-compaction"});
  const wrapperEvents = [];
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      wrapperEvents.push(message.method ?? "turn/start-response");
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn-event:rejected-compaction"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/completed",
    params: {threadId, turnId: "private-rejected-turn",
      item: {type: "contextCompaction", id: "private-rejected-item", status: "completed"}}})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  assert.deepEqual(wrapperEvents, []);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    error: {code: -32603, message: "fixture host rejected the turn"}})}\n`);
  assert.equal((await connection.lines.next("rejected turn response")).message.error.code, -32603);
  const denied = (await connection.lines.next("early event after rejection")).message;
  assert.deepEqual(denied.error.data.reason_codes, ["gateway.pre-acceptance-event-mismatch"]);
  assert.deepEqual(wrapperEvents, ["turn/start-response"]);
  assert.deepEqual(store.getSession(consumerId).host_observations, []);
  assert.doesNotMatch(JSON.stringify(denied), /private-rejected-turn|private-rejected-item/);
  await waitFor(() => children[0].killed, "backend stopped after rejected early compaction");
  connection.socket.destroy();
});

test("Codex gateway delivers only accepted turn-scoped notifications in order", async (context) => {
  const consumerId = "codex:accepted-turn-events";
  const threadId = "owned-accepted-turn-events";
  const turnId = "accepted-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:accepted-turn-events"});
  const wrapperEvents = [];
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    max_buffered_messages_per_client: 16,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      if (message.method) wrapperEvents.push(message.method);
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn-event:accepted"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {turn: {id: turnId, threadId}}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turn.id, turnId);
  const events = [
    ["turn/started", {turn: {id: turnId, status: "inProgress"}}],
    ["item/started", {turnId, item: {id: "message-1", type: "agentMessage"}}],
    ["item/agentMessage/delta", {turnId, itemId: "message-1", delta: "fixture text"}],
    ["item/completed", {turnId, item: {id: "message-1", type: "agentMessage"}}],
    ["turn/diff/updated", {turnId, diff: "fixture diff"}],
    ["thread/tokenUsage/updated", {turnId, tokenUsage: {}}],
    ["thread/compacted", {turnId}],
    ["model/rerouted", {turnId, fromModel: "fixture-a", toModel: "fixture-b", reason: "fixture"}],
    ["hook/started", {turnId, run: {}}],
    ["turn/completed", {turn: {id: turnId, status: "completed"}}],
  ];
  for (const [method, params] of events) {
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method, params: {threadId, ...params}})}\n`);
    assert.equal((await connection.lines.next(`accepted ${method}`)).message.method, method);
  }
  assert.deepEqual(wrapperEvents, events.map(([method]) => method));
  assert.equal(children[0].killed, false);
  connection.socket.destroy();
});

for (const [label, method, turnId, phase, expectedReason] of [
  ["unaccepted approval", "item/commandExecution/requestApproval", "private-turn", "none", "gateway.host-request-turn-unbound"],
  ["early user input", "item/tool/requestUserInput", "private-turn", "pending", "gateway.host-request-turn-unbound"],
  ["wrong-turn approval", "item/fileChange/requestApproval", "other-turn", "active", "gateway.host-request-turn-unbound"],
  ["missing approval turn", "item/permissions/requestApproval", undefined, "active", "gateway.host-request-turn-id-invalid"],
  ["terminal approval", "item/commandExecution/requestApproval", "private-turn", "terminal", "gateway.host-request-turn-terminal"],
  ["wrong-turn MCP form", "mcpServer/elicitation/request", "other-turn", "active", "gateway.host-request-turn-unbound"],
  ["accepted approval", "item/commandExecution/requestApproval", "private-turn", "active", null],
  ["accepted user input", "item/tool/requestUserInput", "private-turn", "active", null],
  ["accepted MCP form", "mcpServer/elicitation/request", "private-turn", "active", null],
]) {
  test(`Codex gateway binds ${label} to an active accepted turn`, async (context) => {
    const consumerId = `codex:host-request-${label.replaceAll(" ", "-")}`;
    const threadId = `owned-host-request-${label.replaceAll(" ", "-")}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:host-request-${label.replaceAll(" ", "-")}`});
    let wrapperCalls = 0;
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
      wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
        wrapperCalls += 1;
        return {to_server: [], to_client: [message]};
      }})});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
    bindFixtureThread(store, consumerId, threadId);
    if (phase !== "none") {
      connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
        params: safeCodexTurnParams(threadId),
        [GATEWAY_REQUEST_META_KEY]: {request_key: `host-request:${label}`}})}\n`);
      const upstream = await nextJsonLine(children[0].stdin);
      if (phase !== "pending") {
        children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
          result: {turn: {id: "private-turn", threadId}}})}\n`);
        assert.equal((await connection.lines.next("accepted turn")).message.result.turn.id, "private-turn");
      }
    }
    if (phase === "terminal") {
      children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
        params: {threadId, turn: {id: "private-turn", status: "completed"}}})}\n`);
      assert.equal((await connection.lines.next("terminal turn")).message.method, "turn/completed");
    }
    const baselineCalls = wrapperCalls;
    const requiredFields = method === "mcpServer/elicitation/request" ? {serverName: "fixture-server"}
      : method === "item/tool/requestUserInput" ? {itemId: "fixture-item", isBlocking: true, questions: [{}]}
        : method === "item/permissions/requestApproval"
          ? {itemId: "fixture-item", startedAtMs: 123, cwd: "/work", permissions: {network: null}}
          : {itemId: "fixture-item", startedAtMs: 123};
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "private-request", method,
      params: {threadId, ...(turnId === undefined ? {} : {turnId}), ...requiredFields,
        secret: "PRIVATE_REQUEST_CONTENT"}})}\n`);
    const result = (await connection.lines.next("host request turn binding")).message;
    if (expectedReason === null) {
      assert.equal(result.method, method);
      assert.equal(wrapperCalls, baselineCalls + 1);
      assert.equal(children[0].killed, false);
    } else {
      assert.deepEqual(result.error?.data?.reason_codes, [expectedReason]);
      assert.equal(wrapperCalls, baselineCalls, "An unbound host request must not reach the wrapper.");
      assert.doesNotMatch(JSON.stringify(result), /PRIVATE_REQUEST_CONTENT|private-request|other-turn/u);
      await waitFor(() => children[0].killed, "backend stopped after unbound host request");
    }
    connection.socket.destroy();
  });
}

for (const [label, method, fields] of [
  ["approval item identity", "item/commandExecution/requestApproval", {startedAtMs: 123}],
  ["approval timestamp", "item/fileChange/requestApproval", {itemId: "item-1", startedAtMs: "123"}],
  ["permission profile", "item/permissions/requestApproval", {itemId: "item-1", startedAtMs: 123, cwd: "/work"}],
  ["user-input blocking field", "item/tool/requestUserInput", {itemId: "item-1", questions: [{}]}],
  ["MCP server identity", "mcpServer/elicitation/request", {serverName: " "}],
]) {
  test(`Codex gateway rejects malformed ${label} before wrapper or client delivery`, async (context) => {
    const consumerId = `codex:malformed-${label.replaceAll(" ", "-")}`;
    const threadId = `owned-malformed-${label.replaceAll(" ", "-")}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:malformed-${label.replaceAll(" ", "-")}`});
    let wrapperCalls = 0;
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
      wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
        wrapperCalls += 1;
        return {to_server: [], to_client: [message]};
      }})});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
    bindFixtureThread(store, consumerId, threadId);
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
      params: safeCodexTurnParams(threadId),
      [GATEWAY_REQUEST_META_KEY]: {request_key: `malformed:${label}`}})}\n`);
    const upstream = await nextJsonLine(children[0].stdin);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
      result: {turn: {id: "active-turn", threadId}}})}\n`);
    assert.equal((await connection.lines.next("accepted turn")).message.result.turn.id, "active-turn");
    const baselineCalls = wrapperCalls;
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "private-request", method,
      params: {threadId, turnId: "active-turn", ...fields, secret: "PRIVATE_REQUEST_CONTENT"}})}\n`);
    const result = (await connection.lines.next("malformed host request")).message;
    assert.deepEqual(result.error?.data?.reason_codes, ["host.server-request-required-field-invalid"]);
    assert.equal(wrapperCalls, baselineCalls);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_REQUEST_CONTENT|private-request/u);
    await waitFor(() => children[0].killed, "backend stopped after malformed host request");
    connection.socket.destroy();
  });
}

test("Codex gateway rejects a standalone unattributed MCP form before client delivery", async (context) => {
  const consumerId = "codex:unattributed-mcp-form";
  const threadId = "owned-unattributed-mcp-form";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:unattributed-mcp-form"});
  let wrapperCalls = 0;
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      wrapperCalls += 1;
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "standalone-form",
    method: "mcpServer/elicitation/request", params: {threadId, turnId: null,
      serverName: "private-server", secret: "PRIVATE_REQUEST_CONTENT"}})}\n`);
  const denied = await nextJsonLine(children[0].stdin);
  assert.equal(denied.id, "standalone-form");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-request-turn-unattributed"]);
  assert.equal(wrapperCalls, 0);
  assert.equal(children[0].killed, false);
  connection.socket.destroy();
});

test("Codex gateway suppresses unscoped output and denies a legacy approval without leaking either", async (context) => {
  const threadId = "owned-event-thread";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:server-event-scope"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, "codex:server-event-scope", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  const backendLines = collectJsonLines(children[0].stdin);
  bindFixtureThread(store, "codex:server-event-scope", threadId);
  seedAcceptedTurnForFixture(store, "codex:server-event-scope", threadId, "owned-turn");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "process/outputDelta",
    params: {processHandle: "foreign-process", deltaBase64: "cHJpdmF0ZQ=="}})}\n`);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "legacy-approval", method: "execCommandApproval",
    params: {command: ["private-command"], conversationId: "foreign-thread", callId: "foreign-call", cwd: "/tmp", parsedCmd: []}})}\n`);
  const denied = await backendLines.next("unscoped legacy approval denial");
  assert.equal(denied.id, "legacy-approval");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-request-unscoped"]);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/started",
    params: {threadId, turnId: "owned-turn", item: {id: "owned-item", type: "agentMessage"}}})}\n`);
  const delivered = await lines.next("owned event after unscoped suppression");
  assert.equal(delivered.method, "item/started");
  assert.equal(delivered.params.item.id, "owned-item");
  assert.equal(JSON.stringify(delivered).includes("private-command"), false);
  assert.equal(JSON.stringify(delivered).includes("cHJpdmF0ZQ=="), false);
  assert.equal(children[0].killed, false);
  connection.socket.destroy();
});

test("Codex gateway denies a scoped unassessed tool call before a pass-through wrapper can expose it", async (context) => {
  const threadId = "owned-tool-thread";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:unassessed-tool-call"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, "codex:unassessed-tool-call", "interaction-bound");
  const lines = collectJsonLines(connection.socket);
  const backendLines = collectJsonLines(children[0].stdin);
  bindFixtureThread(store, "codex:unassessed-tool-call", threadId);
  seedAcceptedTurnForFixture(store, "codex:unassessed-tool-call", threadId, "owned-turn");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "tool-call-1", method: "item/tool/call",
    params: {threadId, tool: "private-tool"}})}\n`);
  const denied = await backendLines.next("unassessed tool-call denial");
  assert.equal(denied.id, "tool-call-1");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-effect-unassessed"]);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/started",
    params: {threadId, turnId: "owned-turn", item: {id: "owned-item", type: "agentMessage"}}})}\n`);
  const delivered = await lines.next("owned event after tool-call denial");
  assert.equal(delivered.method, "item/started");
  assert.equal(JSON.stringify(delivered).includes("private-tool"), false);
  connection.socket.destroy();
});

test("opted-in hosted effect call crosses only an owned active turn and returns the broker response", async (context) => {
  const consumer = "codex:hosted-effect-transport";
  const threadId = "owned-effect-thread";
  const turnId = "owned-effect-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-effect-transport"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    allow_hosted_effect_tool: true});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectGateway(listenPath, consumer, "interaction-bound");
  const clientLines = collectJsonLines(connection.socket);
  const backendLines = collectJsonLines(children[0].stdin);
  bindFixtureThread(store, consumer, threadId);
  seedAcceptedTurnForFixture(store, consumer, threadId, turnId);
  const request = {jsonrpc: "2.0", id: "effect-request-1", method: "item/tool/call", params: {
    threadId, turnId, callId: "effect-call-1", namespace: null, tool: "are_effect_request",
    arguments: {kind: "command", proposal: {command: ["pwd"]}}}};
  children[0].stdout.write(`${JSON.stringify(request)}\n`);
  assert.deepEqual(await clientLines.next("hosted effect request"), request);
  const denial = {jsonrpc: "2.0", id: request.id,
    result: {contentItems: [{type: "inputText", text: "ARE_EFFECT_DENIED"}], success: false}};
  connection.socket.write(`${JSON.stringify(denial)}\n`);
  assert.deepEqual(await backendLines.next("hosted effect denial"), denial);
  connection.socket.destroy();
});

test("Codex gateway stops before exposing an unsolicited host response", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:unsolicited-response", "plan-bound");
  const lines = collectJsonLines(connection.socket);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 99,
    result: {thread: {id: "foreign-thread", name: "private-name"}}})}\n`);
  const denied = await lines.next("unsolicited response");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-response-unsolicited"]);
  assert.equal(JSON.stringify(denied).includes("private-name"), false);
  await waitFor(() => children[0].killed, "unsolicited response session stop");
  connection.socket.destroy();
});

test("Codex gateway rejects a host read response for a different thread", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:mismatched-response", "plan-bound");
  const lines = collectJsonLines(connection.socket);
  const backendLines = collectJsonLines(children[0].stdin);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  const created = await backendLines.next("thread creation dispatch");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: created.id,
    result: {thread: {id: "owned-thread"}}})}\n`);
  assert.equal((await lines.next("thread creation response")).result.thread.id, "owned-thread");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/read",
    params: {threadId: "owned-thread", includeTurns: false}})}\n`);
  const read = await backendLines.next("owned thread read dispatch");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: read.id,
    result: {thread: {id: "foreign-thread", name: "private-name"}}})}\n`);
  const denied = await lines.next("mismatched thread read response");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.host-response-thread-mismatch"]);
  assert.equal(JSON.stringify(denied).includes("private-name"), false);
  await waitFor(() => children[0].killed, "mismatched response session stop");
  connection.socket.destroy();
});

test("Codex gateway rejects an unsafe wrapper-generated successor before backend dispatch", async (context) => {
  const threadId = "generated-unsafe-thread";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:unsafe-successor"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store, wrapper_factory: () => ({
    ...passThroughWrapper(),
    processServerMessage: async (message) => message.method === "turn/completed"
      ? {to_client: [message], to_server: [{jsonrpc: "2.0", id: "unsafe-successor",
        method: "turn/start", params: {...safeCodexTurnParams(threadId), approvalPolicy: "never"}}]}
      : {to_client: [message], to_server: []},
  })});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, "codex:unsafe-successor", "interaction-bound");
  bindFixtureThread(store, "codex:unsafe-successor", threadId);
  let backendWrites = "";
  children[0].stdin.on("data", (chunk) => { backendWrites += chunk.toString("utf8"); });
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "unsafe-successor:parent"}})}\n`);
  const parent = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: parent.id,
    result: {turn: {id: "parent", threadId}}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turn.id, "parent");
  const writeBaseline = backendWrites;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: "parent", status: "completed"}}})}\n`);
  const denial = await connection.lines.next();
  assert.deepEqual(denial.message.error?.data?.reason_codes, ["host.approval-policy-unsafe"]);
  await waitFor(() => children[0].killed, "unsafe generated successor stops backend");
  assert.equal(backendWrites, writeBaseline);
  connection.socket.destroy();
});

test("persistent gateway runs a model-neutral backend adapter without changing its continuity protocol", async (context) => {
  const adapter = createJsonLineProcessBackendAdapter({adapter_id: "fixture-agent/v1", command: "fixture-agent", args: ["serve", "--jsonl"]});
  const {gateway, listenPath, children} = fixture({backend: {}, backend_adapter: adapter});
  const beforeStart = gateway.observeAdapters(1000);
  assert.equal(beforeStart.gateway.status, "unavailable");
  assert.equal(beforeStart.backend.status, "not-observed");
  assert.equal(children.length, 0);
  await gateway.start();
  context.after(() => gateway.close());
  assert.equal(gateway.observeAdapters(1001).gateway.status, "running");
  assert.equal(gateway.observeAdapters(1001).backend.status, "not-observed");
  assert.equal(children.length, 0);
  const connection = await connectGateway(listenPath, "fixture:agent", "interaction-bound");
  assert.equal(connection.receipt.ok, true);
  assert.equal(connection.receipt.backend_adapter_id, "fixture-agent/v1");
  assert.equal(connection.receipt.backend_capabilities.operations.turn_steer, "unknown");
  assert.equal(connection.receipt.backend_capabilities.history_persistence, "unknown");
  assert.equal(gateway.inspect().backend_adapter_id, "fixture-agent/v1");
  assert.deepEqual({command: children[0].command, args: children[0].args}, {command: "fixture-agent", args: ["serve", "--jsonl"]});
  assert.equal(gateway.observeAdapters(1002).backend.status, "running");
  assert.equal(gateway.observeAdapters(1002).client_link.status, "connected");
  const initialized = nextJsonLine(connection.socket, 2000, "fixture initialization response");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "fixture initialization request");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {}})}\n`);
  assert.equal((await forwarded).method, "initialize");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true}})}\n`);
  await initialized;
  assert.equal(gateway.observeAdapters(1003).backend.status, "ready");
  connection.socket.destroy();
});

test("backend-specific client refuses the wrong adapter before a backend process starts", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const client = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken,
    consumer_id: "codex:hosted-client", lane: "interaction-bound",
    expected_backend_adapter_id: "codex-app-server/v1"});
  await assert.rejects(client.ready, /gateway.backend-adapter-mismatch/);
  assert.equal(children.length, 0);
  assert.equal(gateway.inspect().durable_session_index.sessions.length, 0);
  await client.close();
});

test("durable gateway recovery refuses a different or unbound backend adapter before spawning", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:backend-adapter-binding"});
  context.after(() => store.close());
  const first = fixture({session_store: store});
  await first.gateway.start();
  context.after(() => first.gateway.close());
  const initial = await connectAcknowledgedGateway(first.listenPath, "codex:adapter-bound", "interaction-bound");
  assert.equal(initial.receipt.backend_adapter_id, "gateway-continuity-fixture/v1");
  assert.equal(store.getSession("codex:adapter-bound").backend_adapter_id, "gateway-continuity-fixture/v1");
  const token = initial.receipt.continuity.resume_token;
  initial.socket.destroy();
  await first.gateway.close();

  const changed = fixture({session_store: store, backend_adapter: createJsonLineProcessBackendAdapter({
    adapter_id: "other-agent/v1", command: "other-agent"})});
  await changed.gateway.start();
  context.after(() => changed.gateway.close());
  const refused = await connectAcknowledgedGateway(changed.listenPath, "codex:adapter-bound", "interaction-bound",
    {resume_token: token});
  assert.equal(refused.receipt.reason, "gateway.backend-adapter-mismatch");
  assert.equal(changed.children.length, 0);
  assert.equal(store.getSession("codex:adapter-bound").backend_adapter_id, "gateway-continuity-fixture/v1");
  refused.socket.destroy();
  await changed.gateway.close();

  const legacy = store.append({event_kind: "session-started", consumer_id: "codex:legacy-adapter",
    content: {lane: "interaction-bound", resume_token_digest: digestValue("legacy-secret")}});
  assert.equal(legacy.ok, true);
  const unbound = fixture({session_store: store});
  await unbound.gateway.start();
  context.after(() => unbound.gateway.close());
  const legacyResume = await connectAcknowledgedGateway(unbound.listenPath, "codex:legacy-adapter",
    "interaction-bound", {resume_token: "legacy-secret"});
  assert.equal(legacyResume.receipt.reason, "gateway.backend-adapter-unbound");
  assert.equal(unbound.children.length, 0);
  legacyResume.socket.destroy();
});

test("gateway derives collision-resistant durable logs per consumer", () => {
  const loaded = {
    reasoning_state: {ledger_id: "reasoning:gateway", storage_mode: "process-memory", log_path: null},
    gateway: {reasoning_state: {mode: "file-per-consumer", directory: "/tmp/are-gateway-state", single_writer: true}},
  };
  const first = deriveGatewayReasoningStateProfile(loaded, "codex:human/chat");
  const second = deriveGatewayReasoningStateProfile(loaded, "codex:human-chat");
  assert.equal(first.storage_mode, "append-only-file-fsync");
  assert.equal(first.single_writer, true);
  assert.notEqual(first.log_path, second.log_path);
  assert.match(first.log_path, /codex-human-chat-[a-f0-9]{16}\.jsonl$/);
});

test("gateway shutdown closes the wrapper before releasing its session", async () => {
  let closeCalls = 0;
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-close-"));
  const listenPath = testGatewayPath(directory);
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    wrapper_factory: () => ({...passThroughWrapper(), close: () => { closeCalls += 1; }}),
    spawn_impl: () => fakeChild(),
  });
  await gateway.start();
  const connection = await connectGateway(listenPath, "codex:close", "interaction-bound");
  assert.equal(connection.receipt.ok, true);
  await gateway.close();
  assert.equal(closeCalls, 1);
  connection.socket.destroy();
});

for (const [responseSource, appendResult] of [
  ["wrapper", "explicit-failure"], ["wrapper", "indeterminate"],
  ["backend", "explicit-failure"], ["backend", "indeterminate"],
]) {
  test(`gateway does not acknowledge an undurable ${responseSource} dispatch outcome (${appendResult})`, async (context) => {
    const baseStore = createMemoryGatewaySessionStore({store_id: `gateway-store:failed-${responseSource}`});
    const sessionStore = {
      ...baseStore,
      append(event) {
        if (event.event_kind === "dispatch-outcome") return appendResult === "explicit-failure"
          ? {ok: false, reason_codes: ["test.dispatch-outcome-failed"]} : undefined;
        return baseStore.append(event);
      },
    };
    const {gateway, listenPath, children} = fixture({
      session_store: sessionStore,
      ...(responseSource === "backend" ? {codex_protocol: true} : {}),
      ...(responseSource === "wrapper" ? {wrapper_factory: () => ({
        ...passThroughWrapper(),
        processClientMessage: async (message) => ({
          to_server: [], to_client: [{jsonrpc: "2.0", id: message.id, result: {turn: {id: "turn:local"}}}],
        }),
      })} : {}),
    });
    await gateway.start();
    context.after(async () => { await gateway.close(); baseStore.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, `codex:failed-${responseSource}`, "interaction-bound");
    assert.equal(connection.receipt.ok, true);
    if (responseSource === "backend") bindFixtureThread(baseStore, "codex:failed-backend", "thread:failure");
    const request = {jsonrpc: "2.0", id: 7, method: "turn/start", params: responseSource === "backend"
      ? safeCodexTurnParams("thread:failure") : {threadId: "thread:failure", input: []},
      [GATEWAY_REQUEST_META_KEY]: {request_key: `turn:failed-${responseSource}`}};
    const forwarded = responseSource === "backend" ? nextJsonLine(children[0].stdin, 2000, "forwarded turn") : null;
    connection.socket.write(`${JSON.stringify(request)}\n`);
    if (forwarded) {
      const upstream = await forwarded;
      children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn:remote"}}})}\n`);
    }
    const failure = await connection.lines.next("undurable outcome diagnostic");
    assert.deepEqual(failure.error?.data?.reason_codes, ["gateway.dispatch-outcome-not-durable"]);
    assert.equal(failure.result, undefined);
    await waitFor(() => children[0].killed, "backend stopped after undurable outcome");
    assert.equal(baseStore.getSession(`codex:failed-${responseSource}`).requests[0].status, "outcome-unknown");
    if (responseSource === "backend") {
      const accepted = baseStore.getSession("codex:failed-backend").host_observations;
      assert.equal(accepted.length, 1);
      assert.equal(accepted[0].kind, "turn-start-accepted");
      assert.equal(accepted[0].turn_ref, digestValue("turn:remote"));
      assert.doesNotMatch(JSON.stringify(accepted), /thread:failure|turn:remote/);
    }
    const recoveryObservation = gateway.observeReasoningThreads();
    assert.equal(recoveryObservation.session_count, 0);
    assert.equal(recoveryObservation.unknown_dispatch_count, 1);
    assert.equal(recoveryObservation.accepted_unresolved_turn_count, responseSource === "backend" ? 1 : 0);
    connection.socket.destroy();
  });
}

test("gateway recovers only an accepted, owned thread creation after exact empty host history", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:creation-recovery"});
  const consumerId = "codex:creation-recovery";
  const token = "creation-recovery-secret";
  const requestKey = "thread:creation-recovery";
  const threadId = "private-created-thread";
  const params = {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"};
  const requestDigest = digestValue({method: "thread/start", params});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/start", binding_digest: requestDigest,
      thread_ref: null}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const acceptanceMaterial = {request_key: requestKey, request_digest: requestDigest,
    thread_id: threadId, response_digest: digestValue("private host creation response")};
  const acceptance = {...acceptanceMaterial, acceptance_digest: digestValue(acceptanceMaterial)};
  assert.equal(store.append({event_kind: "thread-creation-accepted", consumer_id: consumerId,
    content: acceptance}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    max_buffered_messages_per_client: 16});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 300,
    method: GATEWAY_OWNED_RUNTIME_GET, params: {threadId}})}\n`);
  assert.deepEqual((await connection.lines.next("recovered creation is not pristine")).message.error.data.reason_codes,
    ["gateway.owned-runtime-acceptance-unsettled"]);
  const get = async (id, binding = requestDigest) => {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: GATEWAY_THREAD_CREATION_RECOVERY_GET,
      params: {requestKey, requestBindingDigest: binding}})}\n`);
    return (await connection.lines.next("creation recovery get")).message;
  };
  assert.deepEqual((await get(301, "e".repeat(64))).error.data.reason_codes,
    ["gateway.creation-recovery-acceptance-required"]);
  assert.deepEqual((await get(302)).result, {thread_id: threadId, history_verified: false});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 311,
    method: "cyberalchemy/intent/control", params: {threadId, action: "resume"}})}\n`);
  assert.deepEqual((await connection.lines.next("unknown creation blocks local control")).message.error.data.reason_codes,
    ["gateway.session-outcome-unknown"]);
  assert.equal(children[0].stdin.readableLength, 0,
    "Wrapper-local control cannot create a host mutation during unknown creation.");
  const read = nextJsonLine(children[0].stdin, 2000, "creation recovery history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 303, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await read).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 303,
    result: {thread: {id: threadId, turns: [{id: "foreign-turn"}]}}})}\n`);
  assert.equal((await connection.lines.next("nonempty creation history")).message.result.thread.id, threadId);
  assert.equal((await get(304)).result.history_verified, false,
    "A thread with a turn cannot prove untouched creation ownership.");
  const emptyRead = nextJsonLine(children[0].stdin, 2000, "empty creation history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 305, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await emptyRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 305,
    result: {thread: {id: threadId, turns: []}}})}\n`);
  assert.equal((await connection.lines.next("empty creation history")).message.result.thread.id, threadId);
  const receipt = (await get(306)).result.receipt;
  assert.equal(receipt.thread_id, threadId);
  assert.equal(receipt.acceptance_digest, acceptance.acceptance_digest);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 307,
    method: GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM,
    params: {receipt: {...receipt, thread_id: "foreign-thread"}}})}\n`);
  assert.deepEqual((await connection.lines.next("tampered creation receipt")).message.error.data.reason_codes,
    ["gateway.creation-recovery-confirm-binding-mismatch"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 308,
    method: GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM, params: {receipt}})}\n`);
  assert.equal((await connection.lines.next("confirmed creation recovery")).message.result.confirmed, true);
  assert.equal(store.getSession(consumerId).requests[0].status, "recovered");
  assert.equal(store.compact().ok, true);
  assert.equal(store.getSession(consumerId).requests[0].recovery.receipt_digest, receipt.receipt_digest);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 309,
    method: GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM, params: {receipt}})}\n`);
  assert.equal((await connection.lines.next("idempotent creation confirmation")).message.result.already_confirmed, true);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 310, method: "thread/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}})}\n`);
  assert.deepEqual((await connection.lines.next("recovered creation replay refusal")).message.error.data.reason_codes,
    ["gateway.dispatch-recovered-no-host-response"]);
  connection.socket.destroy();
});

test("Codex gateway persists thread creation acceptance before returning the host response", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:creation-acceptance"});
  const consumerId = "codex:creation-acceptance";
  const threadId = "private-accepted-created-thread";
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      if (message.result?.thread?.id === threadId) {
        assert.equal(store.getSession(consumerId).requests[0].creation_acceptance.thread_id, threadId,
          "Creation acceptance must be durable before wrapper delivery.");
      }
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  let connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const requestKey = "thread:creation-acceptance";
  const params = {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"};
  const forwarded = nextJsonLine(children[0].stdin, 2000, "accepted thread creation");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 331, method: "thread/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}})}\n`);
  const upstream = await forwarded;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: threadId}}})}\n`);
  const creationDelivery = await connection.lines.next("accepted thread creation response");
  assert.equal(creationDelivery.message.result.thread.id, threadId);
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: creationDelivery.sequence})}\n`);
  const stored = store.getSession(consumerId);
  assert.equal(stored.requests[0].status, "complete");
  assert.equal(stored.requests[0].creation_acceptance.thread_id, threadId);
  assert.equal(stored.requests[0].creation_acceptance.request_key, requestKey);
  assert.equal(stored.thread_refs.includes(`backend-thread:${digestValue(threadId)}`), true);
  const getOwnedRuntime = async (id) => {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: GATEWAY_OWNED_RUNTIME_GET,
      params: {threadId}})}\n`);
    return connection.lines.next("fresh owned runtime");
  };
  const pristineDelivery = await getOwnedRuntime(332);
  assert.deepEqual(pristineDelivery.message.result, {
    schema_version: "are.gateway-owned-runtime/v1", thread_id: threadId,
    disposition: "first-turn-ready",
    creation_acceptance_digest: stored.requests[0].creation_acceptance.acceptance_digest,
    authority_effect: "none",
  });
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: pristineDelivery.sequence})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 0,
    "fresh creation delivery acknowledgement");
  const resumeToken = connection.receipt.continuity.resume_token;
  const disconnected = once(connection.socket, "close");
  connection.socket.destroy();
  await disconnected;
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "fresh creation detach");
  connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound",
    {resume_token: resumeToken, last_acked_sequence: pristineDelivery.sequence});
  assert.deepEqual((await getOwnedRuntime(335)).message.error.data.reason_codes,
    ["gateway.owned-runtime-acceptance-unsettled"],
    "A client reattachment cannot reuse a process-local first-turn proof.");
  assert.equal(store.compact().ok, true);
  assert.equal(store.getSession(consumerId).requests[0].creation_acceptance.thread_id, threadId);
  const forwardedTurn = nextJsonLine(children[0].stdin, 2000, "first owned turn dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 333, method: "turn/start",
    params: safeCodexTurnParams(threadId), [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:first-owned"}})}\n`);
  assert.equal((await forwardedTurn).method, "turn/start");
  assert.deepEqual((await getOwnedRuntime(334)).message.error.data.reason_codes,
    ["gateway.owned-runtime-acceptance-unsettled"], "A dispatched turn revokes pristine readiness.");
  connection.socket.destroy();
});

test("pending thread creation blocks another client mutation until its outcome is durable", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:creation-pending", "interaction-bound");
  const params = {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"};
  const forwarded = nextJsonLine(children[0].stdin, 2000, "pending creation dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 351, method: "thread/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:pending-first"}})}\n`);
  const upstream = await forwarded;
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 352, method: "thread/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:pending-second"}})}\n`);
  assert.deepEqual((await connection.lines.next("blocked second creation")).message.error.data.reason_codes,
    ["gateway.thread-creation-unsettled"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 353, method: "turn/start",
    params: safeCodexTurnParams("new-thread"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:pending-creation"}})}\n`);
  assert.deepEqual((await connection.lines.next("blocked turn during creation")).message.error.data.reason_codes,
    ["gateway.thread-creation-unsettled"]);
  assert.equal(children[0].stdin.readableLength, 0);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: "new-thread"}}})}\n`);
  assert.equal((await connection.lines.next("completed creation")).message.result.thread.id, "new-thread");
  assert.deepEqual(gateway.inspect().durable_session_index.sessions[0].requests.map((entry) => entry.request_key),
    ["thread:pending-first"], "Blocked mutations must not create durable intents.");
  const next = nextJsonLine(children[0].stdin, 2000, "creation after settlement");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 354, method: "thread/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:pending-second"}})}\n`);
  assert.equal((await next).method, "thread/start");
  connection.socket.destroy();
});

test("a pending creation cannot emit a wrapper-generated turn before its outcome", async (context) => {
  const threadId = "generated-pending-thread";
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) =>
      message.result?.thread?.id === threadId
        ? {to_server: [{jsonrpc: "2.0", id: "generated-turn", method: "turn/start",
          params: safeCodexTurnParams(threadId)}], to_client: [message]}
        : {to_server: [], to_client: [message]}})});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:generated-creation", "interaction-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "generated creation dispatch");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 361, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:generated-pending"}})}\n`);
  const upstream = await forwarded;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: threadId}}})}\n`);
  assert.deepEqual((await connection.lines.next("blocked generated turn")).message.error.data.reason_codes,
    ["gateway.server-mutation-creation-unsettled"]);
  await waitFor(() => children[0].killed, "backend stopped after generated turn attempt");
  assert.equal(children[0].stdin.readableLength, 0, "No generated turn reached the backend.");
  connection.socket.destroy();
});

test("undurable thread creation outcome retains accepted identity and no success response", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:creation-outcome-failed"});
  const guardedStore = {...store, append: (event) => event.event_kind === "dispatch-outcome"
    ? {ok: false, reason_codes: ["test.dispatch-outcome-failed"]} : store.append(event)};
  const consumerId = "codex:creation-outcome-failed";
  const threadId = "private-created-before-outcome-failure";
  const {gateway, listenPath, children} = fixture({session_store: guardedStore, codex_protocol: true});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "creation before outcome failure");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 341, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:outcome-failed"}})}\n`);
  const upstream = await forwarded;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: threadId}}})}\n`);
  const result = await connection.lines.next("undurable creation outcome");
  assert.equal(result.result?.thread, undefined);
  await waitFor(() => children[0].killed, "backend stopped after undurable creation outcome");
  const stored = store.getSession(consumerId);
  assert.equal(stored.requests[0].status, "outcome-unknown");
  assert.equal(stored.requests[0].creation_acceptance.thread_id, threadId);
  assert.equal(stored.thread_refs.includes(`backend-thread:${digestValue(threadId)}`), true);
  connection.socket.destroy();
});

for (const acceptedBeforeCrash of [false, true]) test(`gateway releases an unknown marked turn only after exact semantic recovery is confirmed (accepted=${acceptedBeforeCrash})`, async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:recovered-turn"});
  const consumerId = "codex:recovered-turn";
  const token = "recovered-turn-secret";
  const threadId = "private-recovered-thread";
  const turnId = "host:recovered";
  const requestKey = "turn:recovered";
  const marker = `are-gateway-client:${"a".repeat(32)}`;
  const params = safeCodexTurnParams(threadId, [{type: "text", text: "private prompt"}]);
  const bindingDigest = digestValue({method: "turn/start", params});
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest,
      thread_ref: threadRef, client_message_id: marker}}).ok, true);
  if (acceptedBeforeCrash) {
    const accepted = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: digestValue(turnId),
      request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
      response_digest: digestValue("private accepted response")};
    assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
      content: {observation: {...accepted, observation_digest: digestValue(accepted)}}}).ok, true);
  }
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    max_buffered_messages_per_client: 16,
    wrapper_factory: () => ({...passThroughWrapper(), reconcileRecoveredTerminalTurn: () =>
      ({ok: true, disposition: "reconciled-terminal", semantic_receipt_digest: "f".repeat(64)})})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  const forwarded = nextJsonLine(children[0].stdin, 2000, "recovery host read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 101, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await forwarded).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 101,
    result: {thread: {id: threadId, turns: [{id: turnId, status: "completed", items: [
      {type: "userMessage", clientId: marker, text: "private prompt"}]}]}}})}\n`);
  assert.equal((await connection.lines.next("recovery history response")).message.result.thread.id, threadId);
  const get = async (id, requestBindingDigest) => {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: GATEWAY_TURN_RECOVERY_GET,
      params: {threadId, requestKey, requestBindingDigest}})}\n`);
    return (await connection.lines.next("gateway recovery get")).message;
  };
  assert.deepEqual((await get(102, "e".repeat(64))).error.data.reason_codes,
    ["gateway.recovery-history-required"]);
  const receipt = (await get(103, bindingDigest)).result.recovery;
  assert.equal(receipt.turn_id, turnId);
  assert.equal(receipt.semantic_receipt_digest, "f".repeat(64));
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 104, method: GATEWAY_TURN_RECOVERY_CONFIRM,
    params: {receipt: {...receipt, turn_id: "wrong-turn"}}})}\n`);
  assert.deepEqual((await connection.lines.next("tampered recovery confirmation")).message.error.data.reason_codes,
    ["gateway.recovery-confirm-binding-mismatch"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 105, method: GATEWAY_TURN_RECOVERY_CONFIRM,
    params: {receipt}})}\n`);
  assert.equal((await connection.lines.next("valid recovery confirmation")).message.result.confirmed, true);
  assert.equal(store.getSession(consumerId).requests[0].status, "recovered");
  const observed = gateway.observeReasoningThreads();
  assert.equal(observed.unknown_dispatch_count, 0);
  assert.equal(observed.recovered_dispatch_count, 1);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 106, method: "turn/start", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}})}\n`);
  assert.deepEqual((await connection.lines.next("recovered turn replay refusal")).message.error.data.reason_codes,
    ["gateway.dispatch-recovered-no-host-response"]);
  connection.socket.destroy();
});

for (const conflict of ["turn-id", "terminal-status", "stale-active"]) test(`accepted-but-unknown recovery rejects ${conflict} conflict`, async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:accepted-marker-conflict"});
  const consumerId = "codex:accepted-marker-conflict";
  const token = "accepted-marker-conflict-secret";
  const threadId = "private-conflict-thread";
  const requestKey = "turn:accepted-marker-conflict";
  const marker = `are-gateway-client:${"b".repeat(32)}`;
  const params = safeCodexTurnParams(threadId);
  const bindingDigest = digestValue({method: "turn/start", params});
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest,
      thread_ref: threadRef, client_message_id: marker}}).ok, true);
  const accepted = {kind: "turn-start-accepted", thread_ref: threadRef,
    turn_ref: digestValue("host:accepted"), request_key_digest: digestValue(requestKey),
    request_digest: bindingDigest, response_digest: digestValue("private accepted response")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...accepted, observation_digest: digestValue(accepted)}}}).ok, true);
  if (conflict !== "turn-id") {
    const completion = {kind: "turn-completion-observed", thread_ref: threadRef,
      turn_ref: accepted.turn_ref, request_key_digest: digestValue(requestKey),
      request_digest: bindingDigest, event_digest: digestValue("private native completion"),
      turn_status: "interrupted"};
    assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
      content: {observation: {...completion, observation_digest: digestValue(completion)}}}).ok, true);
  }
  let reconciliations = 0;
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), reconcileRecoveredTerminalTurn: () => {
      reconciliations += 1;
      return {ok: true, disposition: "reconciled-terminal", semantic_receipt_digest: "f".repeat(64)};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  const forwarded = nextJsonLine(children[0].stdin, 2000, "conflicting recovery read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 201, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await forwarded).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 201,
    result: {thread: {id: threadId, turns: [{id: conflict === "turn-id" ? "host:other" : "host:accepted",
      status: conflict === "stale-active" ? "inProgress" : "completed",
      items: [{type: "userMessage", clientId: marker}]}]}}})}\n`);
  if (conflict === "stale-active") {
    const response = await connection.lines.next("stale accepted marker history");
    assert.deepEqual(response.message.error.data.reason_codes, ["gateway.turn-history-stale"]);
    assert.equal(store.getSession(consumerId).status, "active");
    assert.deepEqual(store.getSession(consumerId).pending_history_audits, []);
    assert.equal(reconciliations, 0);
    connection.socket.destroy();
    return;
  }
  await waitFor(() => children[0].killed, "backend stopped after accepted marker conflict");
  assert.equal(store.getSession(consumerId).status, "faulted");
  assert.equal(store.getSession(consumerId).fault.reason_code,
    conflict === "turn-id" ? "gateway.turn-marker-history-conflict" : "gateway.turn-completion-status-conflict");
  assert.equal(store.getSession(consumerId).requests[0].status, "outcome-unknown");
  assert.equal(reconciliations, 0);
  connection.socket.destroy();
});

for (const hostStatus of ["interrupted", "completed"]) test(`gateway checkpoints exact Codex turn-start acceptance and ${hostStatus} history before wrapper recovery`, async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:accepted-turn"});
  const reconciliations = [];
  const wrapperMessageIds = [];
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    max_buffered_messages_per_client: 16,
    wrapper_factory: () => ({...passThroughWrapper(), processClientMessage: async message => {
      if (message.method === "turn/start") wrapperMessageIds.push(message.params.clientUserMessageId);
      return passThroughWrapper().processClientMessage(message);
    }, reconcileRecoveredTerminalTurn: (input) => {
      const durable = store.getSession("codex:accepted-turn").host_observations;
      assert.equal(durable.some((entry) => entry.kind === "turn-history-verified" && entry.turn_status === hostStatus), true);
      reconciliations.push(input);
      return {ok: true, disposition: "reconciled-terminal"};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, "codex:accepted-turn", "interaction-bound");
  const privateThreadId = "private-accepted-thread";
  bindFixtureThread(store, "codex:accepted-turn", privateThreadId);
  const request = {jsonrpc: "2.0", id: 41, method: "turn/start",
    params: safeCodexTurnParams(privateThreadId, [{type: "text", text: "private prompt never belongs in the observation"}]),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:accepted-41"}};
  const forwarded = nextJsonLine(children[0].stdin, 2000, "forwarded accepted turn");
  connection.socket.write(`${JSON.stringify(request)}\n`);
  const upstream = await forwarded;
  assert.match(upstream.params.clientUserMessageId, /^are-gateway-client:[0-9a-f]{32}$/);
  assert.deepEqual(wrapperMessageIds, [upstream.params.clientUserMessageId],
    "ARE must receive the durable gateway-owned message identity before preflight.");
  assert.equal(request.params.clientUserMessageId, undefined, "The gateway owns the host marker, not the client.");
  const intent = store.getSession("codex:accepted-turn").requests[0];
  assert.equal(intent.client_message_id, upstream.params.clientUserMessageId,
    "The exact marker must be durable before host dispatch.");
  assert.equal(intent.binding_digest, digestValue({method: request.method, params: request.params}),
    "The original client request binding stays unchanged.");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn:accepted-41", threadId: privateThreadId}}})}\n`);
  const response = await connection.lines.next("accepted turn response");
  assert.equal(response.message.result.turn.id, "turn:accepted-41");
  const session = store.getSession("codex:accepted-turn");
  const acceptance = session.host_observations.find((entry) => entry.kind === "turn-start-accepted");
  assert.ok(acceptance);
  assert.equal(acceptance.thread_ref, `backend-thread:${digestValue(privateThreadId)}`);
  assert.equal(acceptance.turn_ref, digestValue("turn:accepted-41"));
  assert.equal(acceptance.request_key_digest, digestValue("turn:accepted-41"));
  assert.equal(session.requests[0].status, "complete");
  assert.doesNotMatch(JSON.stringify(acceptance), /private prompt|private-accepted-thread|turn:accepted-41/);
  const provisionalStatus = hostStatus === "completed" ? "interrupted" : "completed";
  const unsettledRead = nextJsonLine(children[0].stdin, 2000, "forwarded live terminal history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 40, method: "thread/read",
    params: {threadId: privateThreadId, includeTurns: true}})}\n`);
  assert.equal((await unsettledRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 40,
    result: {thread: {id: privateThreadId, turns: [{id: "turn:accepted-41", status: provisionalStatus}]}}})}\n`);
  assert.deepEqual((await connection.lines.next("unsettled live history response")).message.error.data.reason_codes,
    ["gateway.turn-history-unsettled"]);
  assert.equal(reconciliations.length, 0);
  assert.equal(store.getSession("codex:accepted-turn").host_observations.some((entry) => entry.kind === "turn-history-verified"), false);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId: privateThreadId, turn: {id: "turn:accepted-41", status: hostStatus}}})}\n`);
  assert.equal((await connection.lines.next("bound native completion")).message.method, "turn/completed");
  assert.equal(store.getSession("codex:accepted-turn").host_observations.some((entry) => entry.kind === "turn-completion-observed"
    && entry.turn_status === hostStatus), true);
  const laggingRead = nextJsonLine(children[0].stdin, 2000, "forwarded lagging terminal history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 45, method: "thread/read",
    params: {threadId: privateThreadId, includeTurns: true}})}\n`);
  assert.equal((await laggingRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 45,
    result: {thread: {id: privateThreadId, turns: [{id: "turn:accepted-41", status: provisionalStatus}]}}})}\n`);
  assert.deepEqual((await connection.lines.next("lagging terminal history response")).message.error.data.reason_codes,
    ["gateway.turn-history-stale"]);
  assert.equal(store.getSession("codex:accepted-turn").status, "active");
  assert.deepEqual(store.getSession("codex:accepted-turn").pending_history_audits, []);
  assert.equal(reconciliations.length, 0);
  const historyRequest = nextJsonLine(children[0].stdin, 2000, "forwarded accepted-turn history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 42, method: "thread/read",
    params: {threadId: privateThreadId, includeTurns: true}})}\n`);
  assert.equal((await historyRequest).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 42,
    result: {thread: {id: privateThreadId, turns: [{id: "turn:accepted-41", status: hostStatus}]}}})}\n`);
  assert.equal((await connection.lines.next("accepted-turn history response")).message.result.thread.id, privateThreadId);
  assert.equal(reconciliations.length, 1);
  assert.equal(reconciliations[0].request.status, "complete");
  assert.equal(reconciliations[0].turn_id, "turn:accepted-41");
  assert.equal(reconciliations[0].response.result.thread.turns[0].status, hostStatus);
  const staleRead = nextJsonLine(children[0].stdin, 2000, "forwarded stale active history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 43, method: "thread/read",
    params: {threadId: privateThreadId, includeTurns: true}})}\n`);
  assert.equal((await staleRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 43,
    result: {thread: {id: privateThreadId, turns: [{id: "turn:accepted-41", status: "inProgress"}]}}})}\n`);
  assert.deepEqual((await connection.lines.next("stale active history response")).message.error.data.reason_codes,
    ["gateway.turn-history-stale"]);
  assert.equal(store.getSession("codex:accepted-turn").status, "active");
  assert.deepEqual(store.getSession("codex:accepted-turn").pending_history_audits, []);
  const conflictingStatus = hostStatus === "completed" ? "interrupted" : "completed";
  const repeatedRead = nextJsonLine(children[0].stdin, 2000, "forwarded conflicting accepted-turn history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 44, method: "thread/read",
    params: {threadId: privateThreadId, includeTurns: true}})}\n`);
  assert.equal((await repeatedRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 44,
    result: {thread: {id: privateThreadId, turns: [{id: "turn:accepted-41", status: conflictingStatus}]}}})}\n`);
  await waitFor(() => children[0].killed, "backend stopped after conflicting accepted-turn history");
  assert.equal(store.getSession("codex:accepted-turn").status, "faulted");
  assert.equal(store.getSession("codex:accepted-turn").fault.reason_code,
    "gateway.turn-history-status-conflict");
  connection.socket.destroy();
});

test("recovered unknown marked turn journals only exact host observation and remains write-blocked", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:marker-recovery"});
  const reconciliations = [];
  const consumerId = "codex:human-chat";
  const token = "marker-recovery-secret";
  const threadId = "private-marker-thread";
  const requestKey = "turn:marker-unknown";
  const marker = `are-gateway-client:${"a".repeat(32)}`;
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const bindingDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest,
      thread_ref: threadRef, client_message_id: marker}}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), reconcileRecoveredTerminalTurn: (input) => {
      assert.equal(store.getSession(consumerId).host_observations.some((entry) =>
        entry.kind === "turn-marker-observed" && entry.observation_digest === input.marker_observation.observation_digest), true,
      "The marker receipt must be durable before ARE reconciles semantic state.");
      reconciliations.push(input);
      return {ok: true, disposition: "reconciled-terminal"};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(connection.receipt.ok, true);
  const readHistory = async (id, turns) => {
    const forwarded = nextJsonLine(children[0].stdin, 2000, "forwarded marked history read");
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: "thread/read",
      params: {threadId, includeTurns: true}})}\n`);
    assert.equal((await forwarded).method, "thread/read");
    assert.equal(store.getSession(consumerId).pending_history_audits.length, 1,
      "Even the first full-history read must carry a durable audit guard.");
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id,
      result: {thread: {id: threadId, turns}}})}\n`);
    return connection.lines.next("marked history response");
  };
  await readHistory(71, []);
  await readHistory(72, [{id: "host:1", status: "completed", items: [
    {type: "userMessage", clientId: marker}, {type: "userMessage", clientId: marker}]}]);
  assert.equal(store.getSession(consumerId).host_observations.length, 0,
    "Missing and ambiguous history cannot create a correlation receipt.");
  const turn = {id: "host:1", status: "completed", items: [{type: "userMessage", clientId: marker,
    text: "private prompt"}]};
  await readHistory(73, [turn]);
  const observations = store.getSession(consumerId).host_observations;
  assert.equal(reconciliations.length, 1);
  assert.equal(reconciliations[0].request.status, "outcome-unknown");
  assert.equal(reconciliations[0].turn_id, turn.id);
  assert.equal(observations.length, 1);
  assert.equal(observations[0].kind, "turn-marker-observed");
  assert.equal(observations[0].turn_ref, digestValue(turn.id));
  assert.equal(observations[0].client_message_id_digest, digestValue(marker));
  assert.doesNotMatch(JSON.stringify(observations), /private prompt|private-marker-thread|host:1|turn:marker-unknown|are-gateway-client:/);
  await readHistory(74, [turn]);
  assert.equal(store.getSession(consumerId).host_observations.length, 1,
    "Repeated host reads must not grow the marker receipt.");
  assert.deepEqual(store.getSession(consumerId).pending_history_audits, [],
    "A matching history response must durably clear its audit guard.");
  assert.equal(store.getSession(consumerId).requests[0].status, "outcome-unknown");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 75, method: "turn/start",
    params: safeCodexTurnParams(threadId), [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:next"}})}\n`);
  assert.deepEqual((await connection.lines.next("marker-blocked mutation")).message.error.data.reason_codes,
    ["gateway.session-outcome-unknown"]);
  assert.equal(children[0].stdin.readableLength, 0);
  const conflictingRead = nextJsonLine(children[0].stdin, 2000, "conflicting marked history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 76, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await conflictingRead).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 76,
    result: {thread: {id: threadId, turns: [{...turn, id: "host:other"}]}}})}\n`);
  await waitFor(() => children[0].killed, "backend stopped after conflicting marker history");
  assert.equal(store.getSession(consumerId).host_observations.length, 1,
    "Conflicting host history must not replace the durable receipt.");
  const faulted = store.getSession(consumerId);
  assert.equal(faulted.status, "faulted");
  assert.equal(faulted.pending_history_audits.length, 1,
    "A contradictory read must retain its audit guard with the fault.");
  assert.equal(faulted.fault.reason_code, "gateway.turn-marker-history-conflict");
  assert.equal(faulted.fault.thread_ref, threadRef);
  assert.equal(gateway.observeAdapters().session_fault.status, "observed");
  assert.doesNotMatch(JSON.stringify(faulted.fault), /private prompt|private-marker-thread|host:other|turn:marker-unknown/);
  const denied = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(denied.receipt.ok, false);
  assert.equal(denied.receipt.reason, "gateway.session-faulted");
  assert.equal(denied.receipt.fault_digest, faulted.fault.fault_digest);
  assert.equal(children.length, 1, "A faulted session must not spawn another backend writer.");
  denied.socket.destroy();
  const client = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken,
    consumer_id: consumerId, lane: "interaction-bound", resume_token: token});
  await assert.rejects(client.ready, (error) => {
    assert.equal(error.code, "gateway.session-faulted");
    assert.equal(error.fault_digest, faulted.fault.fault_digest);
    assert.equal(error.fault_reason_code, "gateway.turn-marker-history-conflict");
    assert.doesNotMatch(error.message, /private prompt|private-marker-thread|host:other|turn:marker-unknown/);
    return true;
  });
  await client.close();
  const unauthenticated = await connectAcknowledgedGateway(listenPath, consumerId,
    "interaction-bound", {resume_token: "different-token"});
  assert.equal(unauthenticated.receipt.reason, "gateway.resume-authentication-required");
  assert.equal(Object.hasOwn(unauthenticated.receipt, "fault_digest"), false);
  unauthenticated.socket.destroy();
  const wrongTokenClient = connectGatewayRpcTransport({socket_path: listenPath,
    connection_token: testConnectionToken, consumer_id: consumerId, lane: "interaction-bound",
    resume_token: "different-token"});
  await assert.rejects(wrongTokenClient.ready, (error) => {
    assert.equal(error.code, "gateway.resume-authentication-required");
    assert.equal(Object.hasOwn(error, "fault_digest"), false);
    assert.equal(Object.hasOwn(error, "fault_reason_code"), false);
    return true;
  });
  await wrongTokenClient.close();
  connection.socket.destroy();
  await gateway.close();
  const restarted = fixture({session_store: store, codex_protocol: true});
  await restarted.gateway.start();
  assert.equal(restarted.gateway.observeAdapters().session_fault.status, "observed");
  const afterRestart = await connectAcknowledgedGateway(restarted.listenPath, consumerId,
    "interaction-bound", {resume_token: token});
  assert.equal(afterRestart.receipt.reason, "gateway.session-faulted");
  assert.equal(afterRestart.receipt.fault_digest, faulted.fault.fault_digest);
  assert.equal(restarted.children.length, 0, "Restart must not revive a faulted backend writer.");
  afterRestart.socket.destroy();
  if (process.platform !== "win32") {
    const clientDirectory = mkdtempSync(join(tmpdir(), "are-gateway-fault-page-"));
    const statePath = resolve(clientDirectory, "client-state.json");
    const recovery = createWindowsClientRecoveryState({path: statePath, consumer_id: consumerId});
    recovery.bind_gateway({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
      consumer_id: consumerId, resumed: false,
      continuity: {resume_token: token, resume_token_digest: digestValue(token)}});
    recovery.close();
    const executable = resolve(packageRoot, "bin/are-codex-windows-client.mjs");
    const child = spawn(process.execPath, [executable, "--socket", restarted.listenPath,
      "--repository-root", clientDirectory, "--state-file", statePath,
      "--port", "0", "--token", "gateway-fault-page-test-token"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    context.after(async () => {
      if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
      rmSync(clientDirectory, {recursive: true, force: true});
    });
    const stopped = await new Promise((resolveStopped, rejectStopped) => {
      let output = "";
      const timer = setTimeout(() => rejectStopped(new Error("Timed out waiting for gateway fault page")), 5000);
      child.once("exit", (code) => { clearTimeout(timer); rejectStopped(new Error(`Hosted client exited before fault page: ${code}; ${output}`)); });
      child.stderr.on("data", (chunk) => {
        output += chunk.toString("utf8");
        const newline = output.indexOf("\n");
        if (newline < 0) return;
        clearTimeout(timer);
        try { resolveStopped(JSON.parse(output.slice(0, newline))); }
        catch (error) { rejectStopped(error); }
      });
    });
    assert.equal(stopped.schema_version, "are.codex-windows-client-stopped/v1");
    assert.equal(stopped.transport_failure.fault_digest, faulted.fault.fault_digest);
    assert.equal(stopped.transport_failure.fault_reason_code, faulted.fault.reason_code);
    const headers = {authorization: "Bearer gateway-fault-page-test-token"};
    const response = await fetch(`${stopped.url}api/state`, {headers});
    assert.equal(response.status, 200);
    const state = (await response.json()).value;
    assert.equal(state.ready, false);
    assert.equal(state.recovery_mode, "private-file-stopped");
    assert.equal(state.transport_failure.fault_digest, faulted.fault.fault_digest);
    assert.equal((await fetch(`${stopped.url}api/turns`, {method: "POST",
      headers: {...headers, "content-type": "application/json"}, body: "{}"})).status, 503);
    assert.equal(restarted.children.length, 0, "Fault page must not revive a backend writer.");
    assert.doesNotMatch(JSON.stringify(state), /private prompt|private-marker-thread|host:other|turn:marker-unknown/);
  }
  await restarted.gateway.close();
});

for (const appendResult of ["explicit-failure", "indeterminate"]) test(
  `an undurable marked-history receipt stops without settling unknown dispatch (${appendResult})`, async (context) => {
  const baseStore = createMemoryGatewaySessionStore({store_id: "gateway-store:marker-undurable"});
  const consumerId = "codex:marker-undurable";
  const threadId = "private-undurable-marker-thread";
  const marker = `are-gateway-client:${"b".repeat(32)}`;
  const requestKey = "turn:undurable-marker";
  assert.equal(baseStore.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("undurable-secret"), recovered: false}}).ok, true);
  assert.equal(baseStore.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  assert.equal(baseStore.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: digestValue({method: "turn/start",
      params: safeCodexTurnParams(threadId)}), thread_ref: `backend-thread:${digestValue(threadId)}`,
    client_message_id: marker}}).ok, true);
  const store = {...baseStore, append: (event) => event.event_kind === "host-observation"
    && event.content.observation.kind === "turn-marker-observed"
    ? appendResult === "explicit-failure" ? {ok: false, reason_codes: ["test.marker-write-failed"]}
      : undefined : baseStore.append(event)};
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true});
  await gateway.start();
  context.after(async () => { await gateway.close(); baseStore.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound",
    {resume_token: "undurable-secret"});
  const forwarded = nextJsonLine(children[0].stdin, 2000, "undurable marker history read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 81, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await forwarded).method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 81, result: {thread: {id: threadId,
    turns: [{id: "host:undurable", status: "completed", items: [{type: "userMessage", clientId: marker}]}]}}})}\n`);
  await waitFor(() => children[0].killed, "backend stopped after undurable marker receipt");
  assert.equal(baseStore.getSession(consumerId).host_observations.length, 0);
  assert.equal(baseStore.getSession(consumerId).requests[0].status, "outcome-unknown");
  connection.socket.destroy();
});

test("an undurable contradictory-history fault leaves a durable audit quarantine across restart", async (context) => {
  const baseStore = createMemoryGatewaySessionStore({store_id: "gateway-store:undurable-history-fault"});
  const consumerId = "codex:human-chat";
  const token = "private-fault-resume-token";
  const threadId = "private-fault-thread";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const requestKey = "turn:private-fault";
  const marker = `are-gateway-client:${"c".repeat(32)}`;
  const requestDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(baseStore.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  bindFixtureThread(baseStore, consumerId, threadId);
  assert.equal(baseStore.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: threadRef, client_message_id: marker}}).ok, true);
  const store = {...baseStore, append: (event) => event.event_kind === "session-fault"
    ? {ok: false, reason_codes: ["test.fault-write-failed"]} : baseStore.append(event)};
  const observationToken = "test-only-history-quarantine-observation-token";
  const {gateway, listenPath, observationPath, children} = fixture({session_store: store, codex_protocol: true,
    observation_token: observationToken});
  await gateway.start();
  context.after(async () => { await gateway.close(); baseStore.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(connection.receipt.ok, true);
  const firstForwarded = nextJsonLine(children[0].stdin, 2000, "first history audit read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 90, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await firstForwarded).method, "thread/read");
  const secondForwarded = nextJsonLine(children[0].stdin, 2000, "second history audit read");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 91, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  assert.equal((await secondForwarded).method, "thread/read");
  assert.equal(baseStore.getSession(consumerId).pending_history_audits.length, 2,
    "Both concurrent reads must be guarded before the first observation exists.");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 90,
    result: {thread: {id: threadId, turns: [{id: "host:original", status: "completed",
      items: [{type: "userMessage", clientId: marker, text: "private prompt"}]}]}}})}\n`);
  assert.equal((await connection.lines.next("first history audit response")).message.result.thread.id, threadId);
  assert.equal(baseStore.getSession(consumerId).pending_history_audits.length, 1,
    "A clean first response must clear only its own audit.");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 91,
    result: {thread: {id: threadId, turns: [{id: "host:contradiction", status: "completed",
      items: [{type: "userMessage", clientId: marker, text: "private prompt"}]}]}}})}\n`);
  await waitFor(() => children[0].killed, "backend stopped after undurable history fault");
  assert.equal(baseStore.getSession(consumerId).status, "active");
  assert.equal(baseStore.getSession(consumerId).fault, null);
  assert.equal(baseStore.getSession(consumerId).pending_history_audits.length, 1);
  assert.equal(gateway.observeAdapters().session_quarantine.status, "observed");
  assert.equal(gateway.observeAdapters().session_fault.status, "not-observed");
  const observed = await readAdapterObservation({socket_path: observationPath, token: observationToken});
  assert.equal(observed.session_quarantine.status, "observed");
  assert.equal(observed.session_fault.status, "not-observed");
  assert.doesNotMatch(JSON.stringify(observed), /private-fault|codex:human-chat|private prompt|audit_ref/);
  const denied = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(denied.receipt.reason, "gateway.history-audit-incomplete");
  denied.socket.destroy();
  connection.socket.destroy();
  await gateway.close();
  const restarted = fixture({session_store: store, codex_protocol: true,
    observation_token: observationToken});
  await restarted.gateway.start();
  context.after(() => restarted.gateway.close());
  assert.equal(restarted.gateway.observeAdapters().session_quarantine.status, "observed");
  assert.equal((await readAdapterObservation({socket_path: restarted.observationPath,
    token: observationToken})).session_quarantine.status, "observed");
  const resumed = await connectAcknowledgedGateway(restarted.listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(resumed.receipt.reason, "gateway.history-audit-incomplete");
  resumed.socket.destroy();
  const unauthorized = await connectAcknowledgedGateway(restarted.listenPath, consumerId,
    "interaction-bound", {resume_token: "wrong-token"});
  assert.equal(unauthorized.receipt.reason, "gateway.resume-authentication-required");
  unauthorized.socket.destroy();
  assert.equal(restarted.children.length, 0, "An incomplete durable audit must not spawn a backend writer.");
  if (process.platform !== "win32") {
    const clientDirectory = mkdtempSync(join(tmpdir(), "are-gateway-audit-page-"));
    const statePath = resolve(clientDirectory, "client-state.json");
    const recovery = createWindowsClientRecoveryState({path: statePath, consumer_id: consumerId});
    recovery.bind_gateway({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
      consumer_id: consumerId, resumed: false,
      continuity: {resume_token: token, resume_token_digest: digestValue(token)}});
    recovery.close();
    const child = spawn(process.execPath, [resolve(packageRoot, "bin/are-codex-windows-client.mjs"),
      "--socket", restarted.listenPath, "--repository-root", clientDirectory,
      "--state-file", statePath, "--port", "0", "--token", "audit-page-test-token"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    context.after(async () => {
      if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
      rmSync(clientDirectory, {recursive: true, force: true});
    });
    const stopped = await new Promise((resolveStopped, rejectStopped) => {
      let output = "";
      const timer = setTimeout(() => rejectStopped(new Error("Timed out waiting for audit quarantine page")), 5000);
      child.once("exit", (code) => { clearTimeout(timer); rejectStopped(new Error(`Client exited before audit page: ${code}; ${output}`)); });
      child.stderr.on("data", (chunk) => {
        output += chunk.toString("utf8");
        const newline = output.indexOf("\n");
        if (newline < 0) return;
        clearTimeout(timer);
        try { resolveStopped(JSON.parse(output.slice(0, newline))); }
        catch (error) { rejectStopped(error); }
      });
    });
    assert.equal(stopped.schema_version, "are.codex-windows-client-stopped/v1");
    assert.equal(stopped.transport_failure.code, "gateway.history-audit-incomplete");
    assert.equal(Object.hasOwn(stopped.transport_failure, "fault_digest"), false);
    const headers = {authorization: "Bearer audit-page-test-token"};
    const response = await fetch(`${stopped.url}api/state`, {headers});
    assert.equal(response.status, 200);
    const state = (await response.json()).value;
    assert.equal(state.ready, false);
    assert.equal(state.recovery_mode, "private-file-stopped");
    assert.equal(state.transport_failure.code, "gateway.history-audit-incomplete");
    assert.equal((await fetch(`${stopped.url}api/turns`, {method: "POST",
      headers: {...headers, "content-type": "application/json"}, body: "{}"})).status, 503);
    assert.equal(restarted.children.length, 0);
  }
  await restarted.gateway.close();
});

test("recovered unknown accepted turn gains host-history evidence without releasing the write block", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:history-recovery"});
  const consumerId = "codex:history-recovery";
  const token = "recovery-secret";
  const threadId = "private-history-thread";
  const turnId = "private-accepted-turn";
  const requestKey = "turn:history-unknown";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const bindingDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest, thread_ref: threadRef}}).ok, true);
  const accepted = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: digestValue(turnId),
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    response_digest: digestValue("private host acceptance")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...accepted, observation_digest: digestValue(accepted)}}}).ok, true);
  const completion = {kind: "turn-completion-observed", thread_ref: threadRef, turn_ref: digestValue(turnId),
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    event_digest: digestValue("durable native completion"), turn_status: "completed"};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...completion, observation_digest: digestValue(completion)}}}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    max_buffered_messages_per_client: 16, wrapper_factory: () => ({
    ...passThroughWrapper(),
    processServerMessage: async (message) => message.method === "turn/completed"
      ? {to_server: [{jsonrpc: "2.0", id: "successor:unknown", method: "turn/start",
        params: safeCodexTurnParams(threadId, [{type: "text", text: "unsafe automatic successor"}])}], to_client: [message]}
      : {to_server: [], to_client: [message]},
  })});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  assert.equal(connection.receipt.ok, true);
  const readHistory = async (id, turns) => {
    const forwarded = nextJsonLine(children[0].stdin, 2000, "forwarded history read");
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: "thread/read",
      params: {threadId, includeTurns: true}})}\n`);
    assert.equal((await forwarded).method, "thread/read");
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id,
      result: {thread: {id: threadId, turns}}})}\n`);
    return connection.lines.next("history read response");
  };
  await readHistory(50, []);
  assert.equal(store.getSession(consumerId).host_observations.length, 2, "Missing history is not proof of non-delivery.");
  const lagging = await readHistory(54, [{id: turnId, status: "interrupted"}]);
  assert.deepEqual(lagging.message.error.data.reason_codes, ["gateway.turn-history-stale"]);
  assert.equal(store.getSession(consumerId).host_observations.length, 2,
    "A lagging terminal snapshot must not replace the persisted completion witness.");
  const response = await readHistory(51, [{id: turnId, status: "completed",
    items: [{type: "userMessage", text: "private prompt"}]}]);
  assert.equal(response.message.result.thread.turns[0].id, turnId);
  const recovered = store.getSession(consumerId);
  const verified = recovered.host_observations.find((entry) => entry.kind === "turn-history-verified");
  assert.equal(verified.turn_status, "completed");
  assert.equal(verified.turn_ref, digestValue(turnId));
  assert.equal(recovered.requests[0].status, "outcome-unknown");
  assert.doesNotMatch(JSON.stringify(recovered.host_observations), /private prompt|private-history-thread|private-accepted-turn|turn:history-unknown/);
  await readHistory(52, [{id: turnId, status: "completed"}]);
  assert.equal(store.getSession(consumerId).host_observations.length, 3, "Repeated history reads must not grow receipts.");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 53, method: "turn/start",
    params: safeCodexTurnParams(threadId), [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:another"}})}\n`);
  const blocked = await connection.lines.next("blocked new mutation");
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.session-outcome-unknown"]);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: turnId, status: "completed"}}})}\n`);
  const serverBlocked = await connection.lines.next("blocked server-generated successor");
  assert.deepEqual(serverBlocked.message.error.data.reason_codes, ["gateway.server-mutation-outcome-unknown"]);
  await waitFor(() => children[0].killed, "backend stopped after unsafe automatic successor");
  assert.equal(children[0].stdin.readableLength, 0, "A recovered unknown turn cannot cause a wrapper-generated host mutation.");
  connection.socket.destroy();
});

test("a native completion contradicting its durable witness faults the exact session", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:completion-conflict"});
  const consumerId = "codex:completion-conflict";
  const token = "completion-conflict-secret";
  const threadId = "private-completion-thread";
  const turnId = "private-completion-turn";
  const requestKey = "turn:completion-conflict";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const turnRef = digestValue(turnId);
  const requestDigest = digestValue({method: "turn/start", params: safeCodexTurnParams(threadId)});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token)}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: threadRef}}).ok, true);
  const accepted = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    response_digest: digestValue("private acceptance")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...accepted, observation_digest: digestValue(accepted)}}}).ok, true);
  const completion = {kind: "turn-completion-observed", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    event_digest: digestValue("private native completion"), turn_status: "completed"};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...completion, observation_digest: digestValue(completion)}}}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound", {resume_token: token});
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: turnId, status: "interrupted"}}})}\n`);
  await waitFor(() => children[0].killed, "backend stopped after conflicting native completion");
  assert.equal(store.getSession(consumerId).status, "faulted");
  assert.equal(store.getSession(consumerId).fault.reason_code, "gateway.turn-completion-status-conflict");
  assert.doesNotMatch(JSON.stringify(store.getSession(consumerId).fault), /private-completion-thread|private-completion-turn/);
  connection.socket.destroy();
});

test("acknowledged gateway journals an automatic successor before host dispatch and binds its response", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:generated-successor"});
  const consumerId = "codex:generated-successor";
  const threadId = "private-generated-thread";
  const token = "generated-secret";
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "plan-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true, wrapper_factory: () => ({
    ...passThroughWrapper(),
    processServerMessage: async (message) => message.method === "turn/completed"
      ? {to_server: [{jsonrpc: "2.0", id: "successor:auto", method: "turn/start",
        params: safeCodexTurnParams(threadId, [{type: "text", text: "private generated input"}])}], to_client: [message]}
      : {to_server: [], to_client: [message]},
  })});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "plan-bound", {resume_token: token});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "generated:parent"}})}\n`);
  const parent = await nextJsonLine(children[0].stdin, 2000, "parent turn dispatch");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: parent.id,
    result: {turn: {id: "parent-turn", threadId}}})}\n`);
  await waitFor(() => store.getSession(consumerId).requests[0]?.status === "complete", "accepted parent outcome");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "durably dispatched successor");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: "parent-turn", status: "completed"}}})}\n`);
  const successor = await forwarded;
  assert.equal(successor.method, "turn/start");
  assert.notEqual(successor.id, "successor:auto", "The gateway owns the upstream request id.");
  const pending = store.getSession(consumerId).requests;
  assert.equal(pending.length, 2);
  const generated = pending.find((entry) => entry.request_key.startsWith("are-generated:"));
  assert.match(generated.request_key, /^are-generated:[0-9a-f]{64}$/);
  assert.equal(generated.status, "outcome-unknown", "The intent precedes the backend response.");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: successor.id,
    result: {turn: {id: "generated-turn", threadId}}})}\n`);
  await waitFor(() => store.getSession(consumerId).requests.every((entry) => entry.status === "complete"), "generated successor outcome");
  const settled = store.getSession(consumerId);
  assert.deepEqual(settled.host_observations.map((entry) => entry.kind),
    ["turn-start-accepted", "turn-completion-observed", "turn-start-accepted"]);
  assert.equal(settled.host_observations[2].request_key_digest, digestValue(generated.request_key));
  assert.doesNotMatch(JSON.stringify(settled.host_observations), /private generated input|private-generated-thread|generated-turn/);
  connection.socket.destroy();
});

test("an undurable automatic successor is withheld from the backend", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:generated-intent-failure"});
  const consumerId = "codex:generated-intent-failure";
  const threadId = "generated-intent-thread";
  const token = "generated-intent-secret";
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "plan-bound", backend_adapter_id: "gateway-continuity-fixture/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const failingStore = {...store, append: (event) => event.event_kind === "dispatch-intent"
    && event.content.request_key.startsWith("are-generated:")
    ? {ok: false, reason_codes: ["test.generated-intent-failed"]} : store.append(event)};
  const {gateway, listenPath, children} = fixture({session_store: failingStore, wrapper_factory: () => ({
    ...passThroughWrapper(),
    processServerMessage: async (message) => message.method === "turn/completed"
      ? {to_server: [{jsonrpc: "2.0", id: "successor:undurable", method: "turn/start",
        params: {threadId, input: []}}], to_client: [message]}
      : {to_server: [], to_client: [message]},
  })});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "plan-bound", {resume_token: token});
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: "parent-turn", status: "completed"}}})}\n`);
  const failure = await connection.lines.next("undurable generated-intent diagnostic");
  assert.deepEqual(failure.message.error.data.reason_codes, ["gateway.generated-intent-not-durable"]);
  await waitFor(() => children[0].killed, "backend stopped after generated-intent failure");
  assert.equal(children[0].stdin.readableLength, 0);
  assert.equal(store.getSession(consumerId).requests.length, 0);
  connection.socket.destroy();
});

test("real wrapper automatic continuation uses the gateway's durable generated-turn path", async (context) => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:real-generated-successor"});
  let instance;
  const {gateway, listenPath, children} = fixture({session_store: store, codex_protocol: true,
    max_buffered_messages_per_client: 16,
    wrapper_factory: () => {
      instance = createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value});
      return instance;
    }});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, "codex:real-generated-successor", "plan-bound");
  const threadId = "real-generated-thread";
  bindFixtureThread(store, "codex:real-generated-successor", threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: safeCodexTurnParams(threadId, [{type: "text", text: "Research the bounded result."}]),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "real-generated:parent"}})}\n`);
  const parent = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: parent.id,
    result: {turn: {id: "parent-turn", threadId}}})}\n`);
  await waitFor(() => store.getSession("codex:real-generated-successor")?.requests[0]?.status === "complete", "parent outcome");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    method: "cyberalchemy/continuation/registerPlan", params: {threadId, proposal: {
      proposal_id: "P1", declared_plan_digest: "plan:real-generated", action_ref: "validate",
      route_id: "CA2-ROUTE-VALIDATE", objective_kind: "validate",
      effect_classes: ["non-effectful-validate"], reversible: true,
      evidence_refs: ["plan:real-generated"],
      next_turn: {params: safeCodexTurnParams(threadId, [{type: "text", text: "Validate the bounded result."}])}
    }}})}\n`);
  await waitFor(() => instance.inspectState().proposal_thread_ids.includes(threadId), "registered continuation proposal");
  const successorForwarded = nextJsonLine(children[0].stdin, 2000, "real generated successor");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: "parent-turn", status: "completed", items: []}}})}\n`);
  const successor = await successorForwarded;
  assert.equal(successor.method, "turn/start");
  assert.match(String(successor.id), /^are-gateway:/);
  const pending = store.getSession("codex:real-generated-successor").requests;
  assert.equal(pending.length, 2);
  assert.equal(pending.find((entry) => entry.request_key.startsWith("are-generated:")).status, "outcome-unknown");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: successor.id,
    result: {turn: {id: "successor-turn", threadId}}})}\n`);
  await waitFor(() => store.getSession("codex:real-generated-successor").requests.every((entry) => entry.status === "complete"), "real generated outcome");
  assert.equal(instance.inspectState().completion_frontier_turn_ids.includes(`${threadId}:parent-turn`), true);
  assert.equal(store.getSession("codex:real-generated-successor").host_observations.filter((entry) => entry.kind === "turn-start-accepted").length, 2);
  connection.socket.destroy();
});

test("gateway and file-backed wrapper restore a bound turn together after restart", async (context) => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const profile = structuredClone(loaded.value);
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-wrapper-restart-"));
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl"), single_writer: true};
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:wrapper-restart"});
  context.after(() => store.close());
  let firstWrapper;
  const first = fixture({session_store: store, wrapper_factory: () => {
    firstWrapper = createCodexAppServerWrapper({...loaded, loaded_profile: profile});
    return firstWrapper;
  }});
  await first.gateway.start();
  context.after(() => first.gateway.close());
  const consumerId = "codex:wrapper-restart";
  const threadId = "thread-wrapper-restart";
  const turnId = "turn-wrapper-restart";
  const firstConnection = await connectAcknowledgedGateway(first.listenPath, consumerId, "plan-bound");
  const forwardedLine = nextJsonLine(first.children[0].stdin, 2000, "first bound turn");
  firstConnection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 301, method: "turn/start",
    params: {threadId, input: [{type: "text", text: "Research bounded gateway restart."}]},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:wrapper-restart"}})}\n`);
  const forwarded = await forwardedLine;
  first.children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {turn: {id: turnId, threadId}}})}\n`);
  const accepted = await firstConnection.lines.next("accepted first turn");
  assert.equal(accepted.message.result.turn.id, turnId);
  assert.deepEqual(firstWrapper.inspectState().active_semantic_turn_ids, [turnId]);
  assert.equal(store.getSession(consumerId).requests[0].status, "complete");
  const firstDecisions = first.gateway.observeDecisions();
  assert.equal(firstDecisions.decision_count, 1);
  assert.equal(firstDecisions.decisions[0].decision_type, "turn-preflight");
  assert.doesNotMatch(JSON.stringify(firstDecisions), /thread-wrapper-restart|Research bounded gateway restart/);
  const resumeToken = firstConnection.receipt.continuity.resume_token;
  firstConnection.socket.destroy();
  await first.gateway.close();

  let secondWrapper;
  const second = fixture({session_store: store, wrapper_factory: () => {
    secondWrapper = createCodexAppServerWrapper({...loaded, loaded_profile: profile});
    return secondWrapper;
  }});
  await second.gateway.start();
  context.after(() => second.gateway.close());
  const resumed = await connectAcknowledgedGateway(second.listenPath, consumerId, "plan-bound",
    {resume_token: resumeToken, last_acked_sequence: accepted.sequence});
  assert.equal(resumed.receipt.resumed, true);
  assert.deepEqual(secondWrapper.inspectState().active_semantic_turn_ids, [turnId]);
  const recoveredDecisions = second.gateway.observeDecisions();
  assert.equal(recoveredDecisions.decision_count, 1);
  assert.equal(recoveredDecisions.decisions[0].decision_digest, firstDecisions.decisions[0].decision_digest);
  assert.equal(recoveredDecisions.decisions[0].thread_ref, firstDecisions.decisions[0].thread_ref);
  assert.equal(recoveredDecisions.decisions[0].consumer_ref, firstDecisions.decisions[0].consumer_ref);
  assert.doesNotMatch(JSON.stringify(recoveredDecisions), /thread-wrapper-restart|Research bounded gateway restart/);
  second.children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId, turn: {id: turnId, status: "completed", items: []}}})}\n`);
  await waitFor(() => secondWrapper.inspectState().completion_frontier_turn_ids.includes(`${threadId}:${turnId}`),
    "recovered turn completion frontier");
  assert.deepEqual(secondWrapper.inspectState().active_semantic_turn_ids, []);
  assert.equal(store.getSession(consumerId).requests[0].status, "complete");
  resumed.socket.destroy();
});

test("gateway withholds a host-accepted turn if its acceptance receipt cannot persist", async (context) => {
  const baseStore = createMemoryGatewaySessionStore({store_id: "gateway-store:failed-acceptance"});
  const sessionStore = {...baseStore, append(event) {
    if (event.event_kind === "host-observation" && event.content.observation?.kind === "turn-start-accepted") {
      return {ok: false, reason_codes: ["test.host-acceptance-not-durable"]};
    }
    return baseStore.append(event);
  }};
  let wrapperResponseCount = 0;
  const {gateway, listenPath, children} = fixture({session_store: sessionStore, codex_protocol: true,
    wrapper_factory: () => ({...passThroughWrapper(), processServerMessage: async (message) => {
      wrapperResponseCount += 1;
      return {to_server: [], to_client: [message]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); baseStore.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, "codex:failed-acceptance", "interaction-bound");
  bindFixtureThread(baseStore, "codex:failed-acceptance", "thread:failed-acceptance");
  const request = {jsonrpc: "2.0", id: 42, method: "turn/start", params: safeCodexTurnParams("thread:failed-acceptance"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:failed-acceptance"}};
  const forwarded = nextJsonLine(children[0].stdin, 2000, "forwarded failed-acceptance turn");
  connection.socket.write(`${JSON.stringify(request)}\n`);
  const upstream = await forwarded;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn:host-accepted"}}})}\n`);
  const failure = await connection.lines.next("undurable acceptance diagnostic");
  assert.deepEqual(failure.message.error?.data?.reason_codes, ["gateway.turn-start-acceptance-not-durable"]);
  await waitFor(() => children[0].killed, "backend stopped after undurable acceptance");
  assert.equal(wrapperResponseCount, 0, "An unjournaled host response must never reach the wrapper.");
  assert.equal(baseStore.getSession("codex:failed-acceptance").requests[0].status, "outcome-unknown");
  connection.socket.destroy();
});

test("gateway stops after a wrapper binding failure instead of forwarding host acceptance", async (context) => {
  const {gateway, listenPath, children} = fixture({wrapper_factory: () => ({...passThroughWrapper(),
    processServerMessage: async () => { throw new Error("semantic.turn-binding-not-durable"); },
  })});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:binding-failure", "interaction-bound");
  assert.equal(connection.receipt.ok, true);
  const upstreamLine = nextJsonLine(children[0].stdin, 2000, "forwarded turn with binding failure");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 64, method: "turn/start", params: {threadId: "thread:binding-failure", input: []}})}\n`);
  const upstream = await upstreamLine;
  const diagnosticLine = nextJsonLine(connection.socket, 2000, "binding failure diagnostic");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn:host-accepted"}}})}\n`);
  const diagnostic = await diagnosticLine;
  assert.equal(diagnostic.error?.message, "Gateway server-path failure");
  await waitFor(() => children[0].killed, "backend stopped after binding failure");
  connection.socket.destroy();
});

test("gateway preserves one consumer session and buffered output across reconnect", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:plan", "plan-bound");
  assert.equal(first.receipt.ok, true);
  assert.equal(first.receipt.resumed, false);
  assert.equal(first.receipt.session_recovery.gateway_delivery, "new");
  assert.equal(first.receipt.session_recovery.backend_history, "not-verified-by-connect");
  assert.equal(children.length, 1);
  const upstream = nextJsonLine(children[0].stdin, 2000, "first upstream request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).method, "initialize");
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.buffered_messages === 1, "detached response buffer");
  const secondSocket = createConnection(listenPath);
  const secondLines = collectJsonLines(secondSocket);
  await once(secondSocket, "connect");
  secondSocket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: "codex:plan", lane: "plan-bound",
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {})})}\n`);
  const receipt = await secondLines.next("reconnect handshake");
  assert.equal(receipt.resumed, true);
  assert.equal(receipt.session_recovery.gateway_delivery, "reattached");
  const replayed = await secondLines.next("buffered replay");
  assert.equal(replayed.result.ready, true);
  assert.equal(children.length, 1);
  secondSocket.destroy();
});

test("gateway replays an identical completed initialization without forwarding it twice", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:reinitialize", "interaction-bound");
  let upstreamWrites = 0;
  children[0].stdin.on("data", () => { upstreamWrites += 1; });
  const firstResponse = nextJsonLine(first.socket, 2000, "first initialize response");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  await waitFor(() => upstreamWrites === 1, "one upstream initialize");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true, serverInfo: {version: "1"}}})}\n`);
  assert.equal((await firstResponse).result.ready, true);
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:reinitialize", "interaction-bound");
  assert.equal(second.receipt.resumed, true);
  assert.equal(second.receipt.initialization.status, "complete");
  assert.deepEqual(second.receipt.initialization.result, {ready: true, serverInfo: {version: "1"}});
  assert.match(second.receipt.initialization.result_digest, /^[a-f0-9]{64}$/);
  const replay = nextJsonLine(second.socket, 2000, "replayed initialize response");
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  assert.deepEqual(await replay, {jsonrpc: "2.0", id: 2, result: {ready: true, serverInfo: {version: "1"}}});
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(upstreamWrites, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_forward_count, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_replay_count, 1);
  second.socket.destroy();
});

test("Codex gateway binds a live backend initialize version before forwarding other host operations", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectGateway(listenPath, "codex:identity", "interaction-bound");
  assert.equal(client.receipt.initialization.host_version_binding, "pending");
  const lines = collectJsonLines(client.socket);
  let upstreamWrites = 0;
  children[0].stdin.on("data", () => { upstreamWrites += 1; });
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "thread/start",
    params: {cwd: repositoryRoot, approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  const preinitialize = await lines.next("preinitialize rejection");
  assert.equal(preinitialize.error.code, -32096);
  assert.deepEqual(preinitialize.error.data.reason_codes, ["gateway.host-initialize-version-required"]);
  assert.equal(upstreamWrites, 0);

  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}}})}\n`);
  const initialize = await nextJsonLine(children[0].stdin, 2000, "forwarded initialize");
  assert.equal(initialize.method, "initialize");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 11,
    result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)", codexHome: "/fixture", platformFamily: "unix", platformOs: "linux"}})}\n`);
  assert.equal((await lines.next("verified initialize response")).result.userAgent.startsWith("Codex Desktop/0.155.0-alpha.16.4"), true);
  assert.equal(gateway.inspect().sessions[0].initialization_status, "complete");
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 12, method: "thread/start",
    params: {cwd: repositoryRoot, approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin, 2000, "post-identity host operation")).method, "thread/start");
  client.socket.destroy();
});

test("acknowledged Codex initialize verifies the remapped upstream response identity", async context => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectAcknowledgedGateway(listenPath, "codex:desktop-init-identity", "interaction-bound");
  const requestKey = "desktop:initialize-version-bound";
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}},
    [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}})}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "stable upstream initialize");
  assert.equal(forwarded.method, "initialize");
  assert.notEqual(forwarded.id, 11);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)"}})}\n`);
  const delivery = await client.lines.next("verified acknowledged initialize");
  assert.equal(delivery.schema_version, GATEWAY_DELIVERY_SCHEMA);
  assert.equal(delivery.request_key, requestKey);
  assert.equal(delivery.message.id, 11);
  assert.equal(gateway.inspect().sessions[0].initialization_status, "complete");
  client.socket.destroy();
});

test("bound desktop gateway delivers only the pinned native global status after verified initialize", async context => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4",
    desktop_backend_binding: {binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"}});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectAcknowledgedGateway(listenPath, "codex:desktop-wsl", "interaction-bound");
  assert.equal(client.receipt.desktop_backend_binding.host_profile, "desktop-wsl-base/v1");
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "desktop:global-initialize"}})}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "desktop initialize");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)"}})}\n`);
  const initialized = await client.lines.next("verified desktop initialize");
  assert.equal(initialized.message.id, 1);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0",
    method: "remoteControl/status/changed", params: {status: "disabled", serverName: "fixture",
      installationId: "install-1", environmentId: null}})}\n`);
  const global = await client.lines.next("native remote-control status");
  assert.equal(global.sequence, initialized.sequence + 1);
  assert.equal(global.message.method, "remoteControl/status/changed");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "account/updated",
    params: {authMode: "chatgpt"}})}\n`);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0",
    method: "remoteControl/status/changed", params: {status: "connected", serverName: "fixture",
      installationId: "install-1", token: "not-admitted"}})}\n`);
  const rejection = await client.lines.next("invalid global status rejection");
  assert.deepEqual(rejection.message.error.data.reason_codes,
    ["desktop-gateway.global-notification-invalid"]);
  assert.equal(rejection.sequence, global.sequence + 1);
  client.socket.destroy();
});

test("desktop global status stays suppressed outside its exact binary, version and lane binding", async context => {
  for (const [name, options, lane] of [["no-binary-binding", {
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"}],
  ["no-live-version-binding", {desktop_backend_binding: {
    binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"}}],
  ["wrong-lane", {desktop_backend_binding: {
    binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"},
  expected_codex_version: "codex-cli 0.155.0-alpha.16.4"}, "plan-bound"]]) {
    const {gateway, listenPath, children} = fixture({codex_protocol: true, ...options});
    await gateway.start();
    context.after(() => gateway.close());
    const client = await connectAcknowledgedGateway(listenPath, "codex:desktop-wsl", lane ?? "interaction-bound");
    if (name === "wrong-lane") assert.equal(client.receipt.desktop_backend_binding, undefined);
    client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "fixture", version: "1"}},
      [GATEWAY_REQUEST_META_KEY]: {request_key: `desktop:${name}-initialize`}})}\n`);
    const forwarded = await nextJsonLine(children[0].stdin, 2000, `${name} initialize`);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
      result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)"}})}\n`);
    const initialized = await client.lines.next(`${name} initialize response`);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0",
      method: "remoteControl/status/changed", params: {status: "disabled", serverName: "fixture",
        installationId: "install-1"}})}\n`);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0",
      method: "thread/status/changed", params: {}})}\n`);
    const rejection = await client.lines.next(`${name} unbound event rejection`);
    assert.equal(rejection.sequence, initialized.sequence + 1);
    assert.deepEqual(rejection.message.error.data.reason_codes, ["host.server-thread-id-required"]);
    client.socket.destroy();
  }
});

test("acknowledged Codex initialize rejects a response that spoofs the desktop ID", async context => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectAcknowledgedGateway(listenPath, "codex:desktop-init-spoof", "interaction-bound");
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "desktop:spoofed-initialize"}})}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "stable upstream initialize");
  assert.notEqual(forwarded.id, 11);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 11,
    result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)"}})}\n`);
  const delivery = await client.lines.next("spoofed initialize rejection");
  assert.equal(delivery.message.error.code, -32096);
  assert.deepEqual(delivery.message.error.data.reason_codes, ["gateway.host-event-before-initialize"]);
  assert.notEqual(gateway.inspect().sessions[0]?.initialization_status, "complete");
  client.socket.destroy();
});

test("Codex gateway accepts the exact authenticated client name in a standalone host identity", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectGateway(listenPath, "codex:standalone-identity", "interaction-bound");
  const lines = collectJsonLines(client.socket);
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
    params: {clientInfo: {name: "cyberalchemy_are_windows", version: "0.1.0"}}})}\n`);
  await nextJsonLine(children[0].stdin, 2000, "forwarded standalone initialize");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 1,
    result: {userAgent: "cyberalchemy_are_windows/0.155.0-alpha.16.4 (fixture)",
      codexHome: "/fixture", platformFamily: "unix", platformOs: "linux"}})}\n`);
  const accepted = await lines.next("standalone initialize accepted");
  assert.equal(accepted.result.userAgent.startsWith("cyberalchemy_are_windows/0.155.0-alpha.16.4"), true);
  assert.equal(gateway.inspect().sessions[0].initialization_status, "complete");
  client.socket.destroy();
});

test("Codex gateway closes a transport whose initialize response reports another version", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    expected_codex_version: "codex-cli 0.155.0-alpha.16.4"});
  await gateway.start();
  context.after(() => gateway.close());
  const client = await connectGateway(listenPath, "codex:identity-drift", "interaction-bound");
  const lines = collectJsonLines(client.socket);
  client.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}}})}\n`);
  await nextJsonLine(children[0].stdin, 2000, "forwarded initialize");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 1,
    result: {userAgent: "Codex Desktop/0.155.0-alpha.16.3 (fixture)"}})}\n`);
  const rejected = await lines.next("host version rejection");
  assert.equal(rejected.id, 1);
  assert.equal(rejected.error.code, -32096);
  assert.deepEqual(rejected.error.data.reason_codes, ["host.initialize-version-drift"]);
  assert.equal(gateway.inspect().sessions.some((session) => session.initialization_status === "complete"), false);
  await waitFor(() => children[0].killed, "mismatched backend teardown");
  client.socket.destroy();
});

test("gateway blocks initialization drift on a retained session", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:init-drift", "plan-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "initial initialize request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {capabilities: {experimentalApi: true}}})}\n`);
  await forwarded;
  const completed = nextJsonLine(first.socket, 2000, "initial initialize response");
  children[0].stdout.write(`${JSON.stringify({id: 1, result: {ready: true}})}\n`);
  await completed;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:init-drift", "plan-bound");
  const blocked = nextJsonLine(second.socket, 2000, "initialization mismatch");
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "initialize", params: {capabilities: {experimentalApi: false}}})}\n`);
  const response = await blocked;
  assert.equal(response.id, 2);
  assert.equal(response.error.code, -32092);
  assert.deepEqual(response.error.data.reason_codes, ["gateway.initialize-binding-mismatch"]);
  assert.notEqual(response.error.data.expected_binding_digest, response.error.data.actual_binding_digest);
  second.socket.destroy();
});

test("gateway binds a reconnecting initialize request to the pending upstream response", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:init-pending", "interaction-bound");
  const forwarded = nextJsonLine(children[0].stdin, 2000, "pending initialize request");
  first.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: "old", method: "initialize", params: {clientInfo: {name: "pending"}}})}\n`);
  await forwarded;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "gateway detach");

  const second = await connectGateway(listenPath, "codex:init-pending", "interaction-bound");
  assert.equal(second.receipt.initialization.status, "pending");
  const lines = collectJsonLines(second.socket);
  second.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: "new", method: "initialize", params: {clientInfo: {name: "pending"}}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.pending_initialization_aliases === 1, "pending initialization alias");
  children[0].stdout.write(`${JSON.stringify({id: "old", result: {ready: true}})}\n`);
  const rebound = await lines.next("rebound initialize response");
  assert.deepEqual(rebound, {jsonrpc: "2.0", id: "new", result: {ready: true}});
  assert.equal(gateway.inspect().sessions[0].initialization_status, "complete");
  assert.equal(gateway.inspect().sessions[0].initialization_forward_count, 1);
  assert.equal(gateway.inspect().sessions[0].initialization_replay_count, 1);
  second.socket.destroy();
});

test("gateway isolates consumers and rejects lane substitution", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const plan = await connectGateway(listenPath, "codex:plan", "plan-bound");
  const human = await connectGateway(listenPath, "codex:human-chat", "interaction-bound");
  assert.equal(plan.receipt.ok, true);
  assert.equal(human.receipt.ok, true);
  assert.equal(children.length, 2);
  plan.socket.destroy();
  await once(plan.socket, "close");
  const mismatch = await connectGateway(listenPath, "codex:plan", "interaction-bound");
  assert.equal(mismatch.receipt.ok, false);
  assert.equal(mismatch.receipt.reason, "gateway.consumer-lane-mismatch");
  human.socket.destroy();
  mismatch.socket.destroy();
});

test("gateway binds a backend thread to one consumer before dispatch", async (context) => {
  const wrapperCalls = [];
  const {gateway, listenPath, children} = fixture({wrapper_factory: () => ({
    ...passThroughWrapper(),
    processClientMessage: async (message) => { wrapperCalls.push(message); return {to_server: [message], to_client: []}; },
  })});
  await gateway.start();
  context.after(() => gateway.close());
  const owner = await connectAcknowledgedGateway(listenPath, "codex:thread-owner", "plan-bound");
  const contender = await connectAcknowledgedGateway(listenPath, "codex:thread-contender", "plan-bound");
  assert.equal(owner.receipt.ok, true);
  assert.equal(contender.receipt.ok, true);
  const ownerRequest = {jsonrpc: "2.0", id: 1, method: "turn/start", params: {threadId: "shared-backend-thread", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "owner:turn:1"}};
  owner.socket.write(`${JSON.stringify(ownerRequest)}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/start");

  const contenderRequest = {jsonrpc: "2.0", id: 2, method: "thread/resume", params: {threadId: "shared-backend-thread"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "contender:resume:1"}};
  contender.socket.write(`${JSON.stringify(contenderRequest)}\n`);
  const denied = await contender.lines.next();
  assert.deepEqual(denied.message.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  assert.equal(children[1].stdin.readableLength, 0);
  assert.equal(wrapperCalls.length, 1);
  const ownerSession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:thread-owner");
  assert.equal(ownerSession.thread_refs.length, 1);
  assert.match(ownerSession.thread_refs[0], /^backend-thread:[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(gateway.inspect().durable_session_index).includes("shared-backend-thread"), false);

  contender.socket.write(`${JSON.stringify({...contenderRequest, id: 3, params: {threadId: "other-backend-thread"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "contender:resume:2"}})}\n`);
  assert.equal((await nextJsonLine(children[1].stdin)).params.threadId, "other-backend-thread");
  owner.socket.destroy(); contender.socket.destroy();
});

test("gateway refuses a thread mutation without a valid backend thread id", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:missing-thread", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start", params: {input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "missing-thread:1"}})}\n`);
  const denied = await connection.lines.next();
  assert.deepEqual(denied.message.error.data.reason_codes, ["gateway.thread-id-required"]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("gateway claims a newly created backend thread before returning its id", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const owner = await connectAcknowledgedGateway(listenPath, "codex:new-thread-owner", "plan-bound");
  const contender = await connectAcknowledgedGateway(listenPath, "codex:new-thread-contender", "plan-bound");
  owner.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start", params: {cwd: "/tmp"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "new-thread:1"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "thread/started", params: {thread: {id: "created-backend-thread"}}})}\n`);
  assert.equal((await owner.lines.next()).message.params.thread.id, "created-backend-thread");
  const earlyOwnerSession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:new-thread-owner");
  assert.equal(earlyOwnerSession.thread_refs.length, 1);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {thread: {id: "created-backend-thread"}}})}\n`);
  assert.equal((await owner.lines.next()).message.result.thread.id, "created-backend-thread");
  const ownerSession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:new-thread-owner");
  assert.equal(ownerSession.thread_refs.length, 1);

  contender.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/start", params: {threadId: "created-backend-thread", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "new-thread:contender"}})}\n`);
  assert.deepEqual((await contender.lines.next()).message.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  assert.equal(children[1].stdin.readableLength, 0);
  owner.socket.destroy(); contender.socket.destroy();
});

test("Codex gateway never exposes an unrelated thread/started during creation", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:unrelated-started", "plan-bound");
  const lines = collectJsonLines(connection.socket);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "thread/started",
    params: {thread: {id: "unrelated-private-thread", name: "private-name"}}})}\n`);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: "actual-created-thread"}}})}\n`);
  const denied = await lines.next("unmatched thread notification");
  assert.deepEqual(denied.error?.data?.reason_codes, ["gateway.thread-started-unmatched"]);
  assert.equal(JSON.stringify(denied).includes("private-name"), false);
  await waitFor(() => children[0].killed, "unmatched notification session stop");
  connection.socket.destroy();
});

test("Codex gateway releases thread/started only after a matching creation response", async (context) => {
  const {gateway, listenPath, children} = fixture({codex_protocol: true});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:matched-started", "plan-bound");
  const lines = collectJsonLines(connection.socket);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "thread/started",
    params: {thread: {id: "matched-created-thread"}}})}\n`);
  const earlySession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:matched-started");
  assert.equal(earlySession?.thread_refs?.length ?? 0, 0);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
    result: {thread: {id: "matched-created-thread"}}})}\n`);
  assert.equal((await lines.next("verified thread started")).params.thread.id, "matched-created-thread");
  assert.equal((await lines.next("verified thread creation")).result.thread.id, "matched-created-thread");
  const ownedSession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:matched-started");
  assert.equal(ownedSession.thread_refs.length, 1);
  connection.socket.destroy();
});

test("gateway guards thread metadata mutations and binds forked children", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const owner = await connectAcknowledgedGateway(listenPath, "codex:fork-owner", "plan-bound");
  const contender = await connectAcknowledgedGateway(listenPath, "codex:fork-contender", "plan-bound");
  owner.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/fork", params: {threadId: "fork-parent"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "fork:1"}})}\n`);
  const fork = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: fork.id, result: {thread: {id: "fork-child"}}})}\n`);
  assert.equal((await owner.lines.next()).message.result.thread.id, "fork-child");
  const ownerSession = gateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:fork-owner");
  assert.equal(ownerSession.thread_refs.length, 2);

  contender.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/name/set", params: {threadId: "fork-child", name: "renamed"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "fork:rename"}})}\n`);
  assert.deepEqual((await contender.lines.next()).message.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  assert.equal(children[1].stdin.readableLength, 0);
  contender.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "thread/read", params: {threadId: "fork-child", includeTurns: false}, [GATEWAY_REQUEST_META_KEY]: {request_key: "fork:read"}})}\n`);
  assert.equal((await nextJsonLine(children[1].stdin)).method, "thread/read");
  owner.socket.destroy(); contender.socket.destroy();
});

test("gateway fails closed if a successful thread creation lacks a bindable id", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:invalid-new-thread", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start", params: {cwd: "/tmp"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "invalid-new-thread:1"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {thread: {}}})}\n`);
  const denied = await connection.lines.next();
  assert.deepEqual(denied.message.error.data.reason_codes, ["gateway.thread-id-required"]);
  assert.equal(denied.message.result, undefined);
  await waitFor(() => children[0].killed, "unbound backend shutdown");
  connection.socket.destroy();
});

test("gateway records accepted steer and completed compaction without retaining input text", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:lifecycle-observer"});
  const {gateway, listenPath, children} = fixture({session_store: store, wrapper_factory: () => ({
    ...passThroughWrapper(),
    observeReasoningThreads: () => [{thread_ref: `backend-thread:${digestValue("lifecycle-thread")}`, phase: "turn-active", reasoning_epoch_digest: "b".repeat(64), checkpoint_digest: "c".repeat(64), latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null}],
  })});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, "codex:lifecycle-observer", "plan-bound");
  bindFixtureThread(store, "codex:lifecycle-observer", "lifecycle-thread");
  seedAcceptedTurnForFixture(store, "codex:lifecycle-observer", "lifecycle-thread", "live-turn");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start", params: {threadId: "lifecycle-thread", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "lifecycle:start"}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "turn/start");

  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/steer", params: {threadId: "lifecycle-thread", expectedTurnId: "live-turn", input: [{type: "text", text: "private steering text"}]}, [GATEWAY_REQUEST_META_KEY]: {request_key: "lifecycle:steer"}})}\n`);
  const steer = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: steer.id, result: {turnId: "live-turn"}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turnId, "live-turn");

  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/completed", params: {threadId: "lifecycle-thread", turnId: "live-turn", item: {type: "contextCompaction", id: "compact-1", status: "completed"}}})}\n`);
  assert.equal((await connection.lines.next()).message.params.item.type, "contextCompaction");
  const observations = gateway.inspect().durable_session_index.sessions[0].host_observations;
  assert.deepEqual(observations.map((item) => item.kind),
    ["turn-start-accepted", "steer-accepted", "compaction-item-completed"]);
  assert.equal(observations[2].item_status, "completed");
  const serialized = JSON.stringify(observations);
  assert.equal(serialized.includes("private steering text"), false);
  assert.equal(serialized.includes("lifecycle-thread"), false);
  assert.equal(serialized.includes("live-turn"), false);
  const projected = gateway.observeReasoningThreads();
  assert.equal(projected.threads.length, 1);
  assert.equal(projected.threads[0].accepted_steer_count, 1);
  assert.equal(projected.threads[0].completed_compaction_item_count, 1);
  connection.socket.destroy();
});

test("gateway reports only a bound durable steering outcome without redispatch", async context => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:steer-outcome"});
  const consumerId = "codex:steer-outcome";
  const threadId = "steer-outcome-thread";
  const turnId = "steer-outcome-turn";
  const requestKey = "steer:outcome:one";
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  context.after(() => connection.socket.destroy());
  const status = id => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
    method: GATEWAY_STEER_OUTCOME_GET, params: {threadId, expectedTurnId: turnId, requestKey}})}\n`);
  status(1);
  assert.equal((await connection.lines.next()).message.result.disposition, "unrecorded");
  const params = {threadId, expectedTurnId: turnId,
    input: [{type: "text", text: "Private correction text"}]};
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2,
    method: "turn/steer", params,
    [GATEWAY_REQUEST_META_KEY]: {request_key: requestKey}})}\n`);
  const forwarded = await nextJsonLine(children[0].stdin);
  assert.equal(forwarded.method, "turn/steer");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {turnId}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turnId, turnId);
  status(3);
  assert.deepEqual((await connection.lines.next()).message.result, {
    schema_version: "are.gateway-steer-outcome/v1", disposition: "settled-accepted", authority_effect: "none"});
  const observation = gateway.inspect().durable_session_index.sessions[0].host_observations.find(item =>
    item.kind === "steer-accepted");
  assert.equal(observation.request_key_digest, digestValue(requestKey));
  assert.equal(observation.request_digest, digestValue({method: "turn/steer", params}));
  assert.equal(JSON.stringify(observation).includes("Private correction text"), false);
  assert.equal(children[0].stdin.readableLength, 0);
});

test("gateway exact-key status survives a steer RPC response lost before the client observes it", async context => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:steer-response-loss"});
  const consumerId = "codex:steer-response-loss";
  const threadId = "steer-response-loss-thread";
  const turnId = "steer-response-loss-turn";
  const requestKey = "steer:response-loss:one";
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const transport = connectGatewayRpcTransport({socket_path: listenPath,
    connection_token: testConnectionToken, consumer_id: consumerId, lane: "interaction-bound"});
  await transport.ready;
  const filteredOutput = new PassThrough();
  let buffer = "";
  let dropped = 0;
  transport.output.on("data", chunk => {
    buffer += chunk.toString("utf8");
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      const frame = JSON.parse(line);
      if (frame.result?.turnId === turnId && dropped === 0) { dropped += 1; continue; }
      filteredOutput.write(`${line}\n`);
    }
  });
  const rpc = createAppServerRpcClient({transport: {...transport, output: filteredOutput},
    request_timeout_ms: 300});
  context.after(() => rpc.close());
  const params = {threadId, expectedTurnId: turnId,
    input: [{type: "text", text: "Private correction text"}]};
  const lost = rpc.request("turn/steer", params, {idempotency_key: requestKey});
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "one forwarded steer");
  assert.equal(forwarded.method, "turn/steer");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: forwarded.id,
    result: {turnId}})}\n`);
  await assert.rejects(lost, /timed out/i);
  assert.equal(dropped, 1, "only the successful steer response is hidden from this client");
  const outcome = await rpc.request(GATEWAY_STEER_OUTCOME_GET,
    {threadId, expectedTurnId: turnId, requestKey});
  assert.deepEqual(outcome, {schema_version: "are.gateway-steer-outcome/v1",
    disposition: "settled-accepted", authority_effect: "none"});
  assert.equal(gateway.inspect().sessions[0].upstream_request_count, 1);
  assert.equal(children[0].stdin.readableLength, 0);
});

test("gateway distinguishes unknown steering from host-accepted but unreconciled steering", async context => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:steer-unknown"});
  const consumerId = "codex:steer-unknown";
  const threadId = "steer-unknown-thread";
  const turnId = "steer-unknown-turn";
  const requestKey = "steer:unknown";
  const token = "steer-unknown-secret";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const bindingDigest = digestValue({method: "turn/steer", params: {threadId,
    expectedTurnId: turnId, input: [{type: "text", text: "Private correction"}]}});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token), recovered: false}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/steer", binding_digest: bindingDigest,
      thread_ref: threadRef}}).ok, true);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound",
    {resume_token: token});
  context.after(() => connection.socket.destroy());
  const status = id => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id,
    method: GATEWAY_STEER_OUTCOME_GET, params: {threadId, expectedTurnId: turnId, requestKey}})}\n`);
  status(1);
  assert.equal((await connection.lines.next()).message.result.disposition, "outcome-unknown");
  const observation = {kind: "steer-accepted", thread_ref: threadRef,
    turn_ref: digestValue(turnId), request_key_digest: digestValue(requestKey),
    request_digest: bindingDigest, response_digest: "a".repeat(64)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...observation, observation_digest: digestValue(observation)}}}).ok, true);
  status(2);
  assert.equal((await connection.lines.next()).message.result.disposition,
    "host-accepted-unreconciled");
  assert.equal(children[0].stdin.readableLength, 0);
});

test("manual compaction binds its distinct turn and releases the next turn only after completion", async (context) => {
  const consumerId = "codex:manual-compaction";
  const threadId = "manual-compaction-thread";
  const turnId = "manual-compaction-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:manual-compaction"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  const receive = async (label) => {
    const delivery = await connection.lines.next(label);
    connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
      through_sequence: delivery.sequence})}\n`);
    return delivery.message;
  };
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/compact/start",
    params: {threadId}, [GATEWAY_REQUEST_META_KEY]: {request_key: "manual-compaction:1"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  assert.equal(upstream.method, "thread/compact/start");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {}})}\n`);
  assert.deepEqual((await receive("manual compaction acknowledgement")).result, {});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:early"}})}\n`);
  assert.deepEqual((await receive("early turn denial")).error.data.reason_codes,
    ["gateway.compaction-unsettled"]);
  for (const event of [
    {method: "turn/started", params: {threadId, turn: {id: turnId, status: "inProgress"}}},
    {method: "item/started", params: {threadId, turnId,
      item: {id: "manual-compaction-item", type: "contextCompaction"}}},
    {method: "thread/tokenUsage/updated", params: {threadId, turnId, tokenUsage: {}}},
    {method: "item/completed", params: {threadId, turnId,
      item: {id: "manual-compaction-item", type: "contextCompaction"}}},
    {method: "turn/completed", params: {threadId,
      turn: {id: turnId, status: "completed"}}},
  ]) {
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...event})}\n`);
    assert.equal((await receive(`manual compaction ${event.method}`)).method, event.method);
  }
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted", "compaction-item-completed", "turn-completion-observed"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:complete"}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin, 2000, "post-compaction turn dispatch")).method, "turn/start");
  connection.socket.destroy();
});

test("pre-ack compaction events remain withheld until the exact acknowledgement is durable", async (context) => {
  const consumerId = "codex:manual-compaction-pre-ack";
  const threadId = "manual-compaction-pre-ack-thread";
  const turnId = "manual-compaction-pre-ack-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:manual-compaction-pre-ack"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store,
    max_buffered_messages_per_client: 16});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/compact/start",
    params: {threadId}, [GATEWAY_REQUEST_META_KEY]: {request_key: "manual-compaction:pre-ack"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  const events = [
    {method: "turn/started", params: {threadId, turn: {id: turnId, status: "inProgress"}}},
    {method: "item/started", params: {threadId, turnId,
      item: {id: "pre-ack-item", type: "contextCompaction"}}},
    {method: "item/completed", params: {threadId, turnId,
      item: {id: "pre-ack-item", type: "contextCompaction"}}},
    {method: "turn/completed", params: {threadId, turn: {id: turnId, status: "completed"}}},
  ];
  for (const event of events) children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", ...event})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  assert.deepEqual(store.getSession(consumerId).host_observations, []);
  assert.equal(store.getSession(consumerId).deliveries.length, 0);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {}})}\n`);
  const received = [];
  for (let index = 0; index < 5; index += 1) {
    const delivery = await connection.lines.next(`pre-ack compaction delivery ${index}`);
    received.push(delivery.message);
    connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
      through_sequence: delivery.sequence})}\n`);
  }
  assert.deepEqual(received.map((message) => message.method ?? "ack"),
    ["ack", "turn/started", "item/started", "item/completed", "turn/completed"]);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted", "compaction-item-completed", "turn-completion-observed"]);
  connection.socket.destroy();
});

test("recovered acknowledged compaction without a terminal receipt blocks later mutations", async (context) => {
  const consumerId = "codex:recovered-manual-compaction";
  const threadId = "recovered-manual-compaction-thread";
  const token = "recovered-manual-compaction-token";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:recovered-manual-compaction"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token)}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  const params = {threadId};
  const requestKey = "manual-compaction:recovered";
  const response = {jsonrpc: "2.0", id: 1, result: {}};
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/compact/start",
      binding_digest: digestValue({method: "thread/compact/start", params}),
      thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId,
    "interaction-bound", {resume_token: token});
  assert.equal(connection.receipt.ok, true);
  for (const [id, method, methodParams] of [
    [2, "turn/start", safeCodexTurnParams(threadId)],
    [3, "thread/resume", {threadId, approvalPolicy: "on-request", sandbox: "read-only"}],
  ]) {
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method, params: methodParams,
      [GATEWAY_REQUEST_META_KEY]: {request_key: `after-recovery:${id}`}})}\n`);
    assert.deepEqual((await connection.lines.next(`blocked recovered ${method}`)).message.error.data.reason_codes,
      ["gateway.compaction-unsettled"]);
  }
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("recovered accepted compaction opens mutations only after exact durable full host history", async (context) => {
  const consumerId = "codex:recovered-compaction-history";
  const threadId = "recovered-compaction-history-thread";
  const turnId = "recovered-compaction-history-turn";
  const token = "recovered-compaction-history-token";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:recovered-compaction-history"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token)}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  const params = {threadId};
  const requestKey = "manual-compaction:history-recovery";
  const requestDigest = digestValue({method: "thread/compact/start", params});
  const response = {jsonrpc: "2.0", id: 1, result: {}};
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/compact/start",
      binding_digest: requestDigest, thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  const acceptance = {kind: "compaction-turn-accepted", thread_ref: threadRef,
    turn_ref: digestValue(turnId), request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, response_digest: digestValue(response),
    event_digest: digestValue("native compact started")};
  acceptance.observation_digest = digestValue(acceptance);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: acceptance}}).ok, true);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId,
    "interaction-bound", {resume_token: token});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:before-history"}})}\n`);
  assert.deepEqual((await connection.lines.next("blocked before history")).message.error.data.reason_codes,
    ["gateway.compaction-unsettled"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "thread/read",
    params: {threadId, includeTurns: true}})}\n`);
  const read = await nextJsonLine(children[0].stdin, 2000, "compaction history read");
  assert.equal(read.method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: read.id,
    result: {thread: {id: threadId, turns: [{id: turnId, threadId, status: "completed",
      itemsView: "full", items: [{id: "recovered-compact-item", type: "contextCompaction"}]}]}}})}\n`);
  assert.equal((await connection.lines.next("verified compaction history")).message.result.thread.id, threadId);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted", "compaction-history-verified"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:verified-history"}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin, 2000, "turn after compact recovery")).method, "turn/start");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/completed",
    params: {threadId, turnId, item: {id: "contradictory-item", type: "contextCompaction"}}})}\n`);
  const conflictDelivery = await connection.lines.next("contradictory compact item");
  assert.deepEqual(conflictDelivery.error.data.reason_codes,
    ["gateway.compaction-item-history-conflict"]);
  assert.equal(store.getSession(consumerId).fault?.reason_code, "gateway.compaction-item-history-conflict");
  connection.socket.destroy();
  const reconnect = connectGatewayRpcTransport({socket_path: listenPath,
    connection_token: testConnectionToken, consumer_id: consumerId,
    lane: "interaction-bound", resume_token: token});
  await assert.rejects(reconnect.ready, (error) => error.code === "gateway.session-faulted"
    && error.fault_reason_code === "gateway.compaction-item-history-conflict");
  await reconnect.close();
});

test("next owned mutation automatically reads accepted compaction history before dispatch", async (context) => {
  const consumerId = "codex:auto-compaction-history";
  const threadId = "auto-compaction-history-thread";
  const turnId = "auto-compaction-history-turn";
  const token = "auto-compaction-history-token";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:auto-compaction-history"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue(token)}}).ok, true);
  bindFixtureThread(store, consumerId, threadId);
  const requestKey = "manual-compaction:auto-history";
  const requestDigest = digestValue({method: "thread/compact/start", params: {threadId}});
  const response = {jsonrpc: "2.0", id: 1, result: {}};
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/compact/start",
      binding_digest: requestDigest, thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  const accepted = {kind: "compaction-turn-accepted", thread_ref: threadRef,
    turn_ref: digestValue(turnId), request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, response_digest: digestValue(response),
    event_digest: digestValue("native compact started")};
  accepted.observation_digest = digestValue(accepted);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: accepted}}).ok, true);
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId,
    "interaction-bound", {resume_token: token});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "initialize",
    params: {clientInfo: {name: "fixture", version: "1"}}})}\n`);
  const initialize = await nextJsonLine(children[0].stdin, 2000, "auto-recovery initialize");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: initialize.id, result: {}})}\n`);
  assert.deepEqual((await connection.lines.next("initialized before recovery")).message.result, {});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "turn/start",
    params: safeCodexTurnParams("foreign-thread"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:foreign-thread"}})}\n`);
  assert.deepEqual((await connection.lines.next("foreign recovery denied")).message.error.data.reason_codes,
    ["gateway.compaction-unsettled"]);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:auto-history"}})}\n`);
  const read = await nextJsonLine(children[0].stdin, 2000, "automatic compact history read");
  assert.equal(read.method, "thread/read");
  assert.deepEqual(read.params, {threadId, includeTurns: true});
  assert.deepEqual(store.getSession(consumerId).pending_history_audits, [],
    "an interrupted read-only compaction probe must not quarantine restart");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 13, method: "turn/start",
    params: safeCodexTurnParams(threadId),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:concurrent"}})}\n`);
  assert.deepEqual((await connection.lines.next("concurrent recovery denied")).message.error.data.reason_codes,
    ["gateway.compaction-recovery-pending"]);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted"], "original mutation is held until history proof");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: read.id,
    result: {thread: {id: threadId, turns: [{id: turnId, threadId, status: "inProgress",
      itemsView: "full", items: []}]}}})}\n`);
  assert.deepEqual((await connection.lines.next("unsettled automatic read")).message.error.data.reason_codes,
    ["gateway.compaction-unsettled"]);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted"], "active history must not release a mutation");
  await new Promise((resolveWait) => setTimeout(resolveWait, 1050));
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 12, method: "thread/resume",
    params: {threadId, approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "after-compaction:auto-history-retry"}})}\n`);
  const retryRead = await nextJsonLine(children[0].stdin, 2000, "automatic compact history retry");
  assert.equal(retryRead.method, "thread/read");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: retryRead.id,
    result: {thread: {id: threadId, turns: [{id: turnId, threadId, status: "completed",
      itemsView: "full", items: [{id: "auto-compact-item", type: "contextCompaction"}]}]}}})}\n`);
  const original = await nextJsonLine(children[0].stdin, 2000, "original turn after auto recovery");
  assert.equal(original.method, "thread/resume");
  assert.deepEqual(store.getSession(consumerId).host_observations.map((entry) => entry.kind),
    ["compaction-turn-accepted", "compaction-history-verified"]);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: original.id,
    result: {thread: {id: threadId}}})}\n`);
  assert.equal((await connection.lines.next("original turn completion")).message.id, 12);
  connection.socket.destroy();
});

for (const [label, compactionTurnId] of [["matching", "accepted-turn"], ["different", "other-turn"], ["missing", undefined]]) {
  test(`Codex gateway ${label === "matching" ? "records" : "rejects"} ${label} compaction turn evidence`, async (context) => {
    const consumerId = `codex:compaction-${label}`;
    const threadId = `compaction-thread-${label}`;
    const store = createMemoryGatewaySessionStore({store_id: `gateway-store:compaction-${label}`});
    const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
    await gateway.start();
    context.after(async () => { await gateway.close(); store.close(); });
    const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
    bindFixtureThread(store, consumerId, threadId);
    connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
      params: safeCodexTurnParams(threadId),
      [GATEWAY_REQUEST_META_KEY]: {request_key: `compaction:${label}`}})}\n`);
    const upstream = await nextJsonLine(children[0].stdin);
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id,
      result: {turn: {id: "accepted-turn", threadId}}})}\n`);
    assert.equal((await connection.lines.next()).message.result.turn.id, "accepted-turn");
    const params = {threadId, item: {type: "contextCompaction", id: "compaction-item", status: "completed"}};
    if (compactionTurnId !== undefined) params.turnId = compactionTurnId;
    children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/completed", params})}\n`);
    const delivery = await connection.lines.next();
    const observations = store.getSession(consumerId).host_observations;
    if (label === "matching") {
      assert.equal(delivery.message.method, "item/completed");
      assert.deepEqual(observations.map((item) => item.kind), ["turn-start-accepted", "compaction-item-completed"]);
      assert.equal(observations[1].turn_ref, digestValue("accepted-turn"));
    } else {
      assert.deepEqual(delivery.message.error.data.reason_codes, ["gateway.compaction-observation-turn-unbound"]);
      assert.deepEqual(observations.map((item) => item.kind), ["turn-start-accepted"]);
      await waitFor(() => children[0].killed, "unbound compaction backend shutdown");
    }
    connection.socket.destroy();
  });
}

test("gateway and real wrapper checkpoint a successor plan only after host steer acceptance", async (context) => {
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const sourceRef = "plans:gateway-steer";
  const sourceDigest = createHash("sha256").update("gateway steer fixture").digest("hex");
  let version = 1;
  let instance;
  const provider = ({thread_ref, previous_plan_context_digest}) => ({
    input: {thread_ref, parent_plan_ref: sourceRef, parent_plan_digest: sourceDigest,
      feature_obligations: [
        {obligation_id: "first", summary: "Complete first slice", status: version === 1 ? "active" : "completed"},
        {obligation_id: "second", summary: "Continue second slice", status: version === 1 ? "open" : "active"},
      ], active_slice_id: version === 1 ? "first" : "second", unresolved_decisions: [],
      source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}], previous_plan_context_digest},
    source_digests: {[sourceRef]: sourceDigest},
  });
  const {gateway, listenPath, children} = fixture({wrapper_factory: () => {
    instance = createCodexAppServerWrapper({...loaded, loaded_profile: loaded.value, plan_context_provider: provider});
    return instance;
  }});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:real-steer", "plan-bound");
  const threadId = "real-steer-thread";
  const turnId = "real-steer-turn";
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: {threadId, input: [{type: "text", text: "Research the first slice."}]},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "real-steer:start"}})}\n`);
  const first = await nextJsonLine(children[0].stdin);
  assert.equal(first.method, "turn/start");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: first.id, result: {turn: {id: turnId}}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turn.id, turnId);
  const originalDigest = instance.observeReasoningThreads()[0].plan_context_digest;
  version = 2;
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/steer",
    params: {threadId, expectedTurnId: turnId, input: [{type: "text", text: "Research the second slice."}]},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "real-steer:steer"}})}\n`);
  const steer = await nextJsonLine(children[0].stdin);
  assert.equal(steer.method, "turn/steer");
  assert.equal(instance.observeReasoningThreads()[0].plan_context_digest, originalDigest);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: steer.id, result: {turnId}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turnId, turnId);
  const successor = instance.observeReasoningThreads()[0];
  assert.equal(successor.plan_completed_count, 1);
  assert.notEqual(successor.plan_context_digest, originalDigest);
  assert.equal(gateway.observeReasoningThreads().threads[0].accepted_steer_count, 1);
  assert.equal(gateway.observeReasoningThreads().degraded_steer_thread_count, 0);
  connection.socket.destroy();
});

test("gateway verifies hosted input before exposing its provenance to a wrapper", async (context) => {
  const key = "c".repeat(64);
  const consumerId = "codex:human-chat";
  const threadId = "hosted-attestation-thread";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-attestation"});
  const observed = [];
  const {gateway, listenPath} = fixture({codex_protocol: true, session_store: store,
    hosted_input_attestation_key: key, hosted_input_consumer_id: consumerId,
    wrapper_factory: () => ({...passThroughWrapper(), processClientMessage: async (message, requestContext) => {
      observed.push(requestContext.hosted_input_verified);
      return {to_server: [], to_client: [{jsonrpc: "2.0", id: message.id,
        result: {verified: requestContext.hosted_input_verified}}]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  const method = "cyberalchemy/learning/submitFeedback";
  const params = {threadId, feedbackId: "feedback:one", text: "A correction"};
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method, params})}\n`);
  assert.equal((await connection.lines.next("unattested hosted input")).message.result.verified, false);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method, params,
    [GATEWAY_REQUEST_META_KEY]: {hosted_input_attestation: "0".repeat(64)}})}\n`);
  assert.deepEqual((await connection.lines.next("forged hosted input")).message.error.data.reason_codes,
    ["gateway.hosted-input-attestation-invalid"]);
  assert.equal(observed.length, 1);
  const signature = signHostedInput({key, consumer_id: consumerId, method, params});
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method, params,
    [GATEWAY_REQUEST_META_KEY]: {hosted_input_attestation: signature}})}\n`);
  assert.equal((await connection.lines.next("verified hosted input")).message.result.verified, true);
  assert.deepEqual(observed, [false, true]);
  connection.socket.destroy();
});

test("gateway confines hosted assessment to its owned thread and keeps it local", async (context) => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-assessment"});
  const ownerId = "codex:hosted-assessment-owner";
  const otherId = "codex:hosted-assessment-other";
  const threadId = "hosted-assessment-thread";
  const observed = [];
  const {gateway, listenPath, children} = fixture({codex_protocol: true,
    allow_hosted_effect_tool: true, session_store: store,
    wrapper_factory: () => ({...passThroughWrapper(), processClientMessage: async message => {
      observed.push(message);
      return {to_server: [], to_client: [{jsonrpc: "2.0", id: message.id,
        result: {schema_version: "are.hosted-effect-assessment/v1", ok: true}}]};
    }})});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const owner = await connectAcknowledgedGateway(listenPath, ownerId, "interaction-bound");
  const other = await connectAcknowledgedGateway(listenPath, otherId, "interaction-bound");
  bindFixtureThread(store, ownerId, threadId);
  const request = {jsonrpc: "2.0", id: 1, method: "cyberalchemy/hostedEffect/assess",
    params: {threadId, turnId: "turn-1", effectId: `hosted-effect:${"a".repeat(64)}`,
      kind: "command", proposal: {command: ["pwd"]}}};
  other.socket.write(`${JSON.stringify(request)}\n`);
  assert.deepEqual((await other.lines.next("unowned hosted assessment")).message.error.data.reason_codes,
    ["gateway.thread-owned-by-other-consumer"]);
  assert.equal(observed.length, 0);
  owner.socket.write(`${JSON.stringify(request)}\n`);
  assert.equal((await owner.lines.next("owned hosted assessment")).message.result.ok, true);
  assert.equal(observed.length, 1);
  assert.equal(children[0].stdin.readableLength, 0);
  assert.equal(children[1].stdin.readableLength, 0);
  owner.socket.destroy(); other.socket.destroy();
});

test("learning-enabled human-chat gateway forwards an attributed correction as same-thread context", async (context) => {
  const observationToken = 'test-only-feedback-observation-token-32-bytes';
  const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/interaction-learning-canary-v1.json"), repositoryRoot);
  assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:hosted-feedback"});
  const {gateway, listenPath, children, observationPath} = fixture({codex_protocol: true, session_store: store,
    observation_token: observationToken,
    max_buffered_messages_per_client: 12,
    wrapper_factory: ({consumer_id, lane}) => createCodexAppServerWrapper({
    ...loaded, loaded_profile: loaded.value,
    interaction_input_provider: selectHostedFeedbackCueProvider({consumer_id, lane,
      learning_enabled: loaded.value.interaction_learning.enabled}),
  })});
  await gateway.start();
  context.after(async () => {await gateway.close(); store.close();});
  const connection = await connectAcknowledgedGateway(listenPath, "codex:human-chat", "interaction-bound");
  const nextMatching = async (lines, predicate) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const delivery = await lines.next();
      if (predicate(delivery.message)) return delivery.message;
    }
    throw new Error("matching gateway delivery not found");
  };
  const threadId = "hosted-feedback-thread";
  bindFixtureThread(store, "codex:human-chat", threadId);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 0, method: "cyberalchemy/learning/status", params: {}})}\n`);
  assert.equal((await nextMatching(connection.lines, (message) => message?.id === 0)).result.available, true);
  const sendTurn = (id, text) => connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id, method: "turn/start",
    params: safeCodexTurnParams(threadId, [{type: "text", text}]),
    [GATEWAY_REQUEST_META_KEY]: {request_key: `hosted-feedback:${id}`}})}\n`);
  sendTurn(1, "Explain context management");
  const first = await nextJsonLine(children[0].stdin);
  assert.equal(first.method, "turn/start");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: first.id, result: {turn: {id: "hosted-turn-1"}}})}\n`);
  assert.equal((await connection.lines.next()).message.result.turn.id, "hosted-turn-1");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId,
    turn: {id: "hosted-turn-1", status: "completed", items: [{type: "agentMessage", text: "A technical answer"}]}}})}\n`);
  assert.equal((await connection.lines.next()).message.method, "turn/completed");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "cyberalchemy/learning/submitFeedback",
    params: {threadId, feedbackId: "hosted-feedback:standalone:1",
      text: "Your last answer was too technical. From now on, use plain language."}})}\n`);
  const feedback = await nextMatching(connection.lines, (message) => message?.id === 3);
  assert.equal(feedback.result.disposition, "applied");
  assert.equal(feedback.result.retention_scope, "current-interaction");
  const feedbackObservation = await readGatewayThreadObservation({socket_path: observationPath, token: observationToken});
  const ownedFeedbackRow = feedbackObservation.threads.find(row => row.thread_ref === `backend-thread:${digestValue(threadId)}`);
  assert.equal(ownedFeedbackRow.learning_feedback.retained_lesson_count, 1);
  assert.equal(ownedFeedbackRow.learning_feedback.pending_feedback_count, 0);
  assert.doesNotMatch(JSON.stringify(feedbackObservation), /Use plain language|A technical answer|hosted-feedback-thread/);
  const pendingText = "Your last answer was too technical. Just this once, use plain language.";
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 5, method: "cyberalchemy/learning/submitFeedback",
    params: {threadId, feedbackId: "hosted-feedback:pending:1", text: pendingText}})}\n`);
  assert.equal((await nextMatching(connection.lines, (message) => message?.id === 5)).result.disposition, "pending");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 8, method: "cyberalchemy/learning/pendingFeedback/list",
    params: {threadId}})}\n`);
  const pendingList = await nextMatching(connection.lines, (message) => message?.id === 8);
  assert.deepEqual(pendingList.result.items.map((item) => item.feedback_id), ["hosted-feedback:pending:1"]);
  assert.equal(JSON.stringify(pendingList).includes(pendingText), false);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 6, method: "cyberalchemy/learning/dismissPendingFeedback",
    params: {threadId, feedbackId: "hosted-feedback:pending:1", text: pendingText}})}\n`);
  assert.equal((await nextMatching(connection.lines, (message) => message?.id === 6)).result.disposition, "dismissed");
  const reviewedText = "For this conversation, include examples.";
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "cyberalchemy/learning/submitFeedback",
    params: {threadId, feedbackId: "hosted-feedback:pending:apply", text: reviewedText}})}\n`);
  assert.equal((await nextMatching(connection.lines, (message) => message?.id === 10)).result.disposition, "pending");
  const reviewParams = {threadId, feedbackId: "hosted-feedback:pending:apply", text: reviewedText,
    episodeRef: feedback.result.episode_ref, quote: "include examples", instruction: "Include one example."};
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "cyberalchemy/learning/applyPendingFeedback",
    params: reviewParams})}\n`);
  const reviewed = await nextMatching(connection.lines, (message) => message?.id === 11);
  assert.ok(reviewed.result, JSON.stringify(reviewed));
  assert.equal(reviewed.result.disposition, "applied", JSON.stringify(reviewed));
  assert.equal(reviewed.result.retention_scope, "current-interaction");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 14, method: "cyberalchemy/learning/lessons/list",
    params: {threadId}})}\n`);
  const lessons = await nextMatching(connection.lines, (message) => message?.id === 14);
  assert.equal(lessons.result.schema_version, "are.current-lessons-list/v1");
  assert.equal(lessons.result.items.some((item) => item.lesson_id === reviewed.result.lesson_id), true);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 12, method: "cyberalchemy/learning/applyPendingFeedback",
    params: reviewParams})}\n`);
  assert.equal((await nextMatching(connection.lines, (message) => message?.id === 12)).result.replayed, true);
  sendTurn(2, "Explain context management again.");
  const corrected = await nextJsonLine(children[0].stdin);
  assert.equal(corrected.method, "turn/start");
  const learning = JSON.parse(corrected.params.additionalContext["cyberalchemy.are.interaction-learning"].value);
  assert.equal(learning.items[0].instruction, "Use plain language.");
  assert.equal(learning.items[1].instruction, "Include one example.");
  const foreign = await connectAcknowledgedGateway(listenPath, "codex:foreign-feedback", "interaction-bound");
  foreign.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, method: "cyberalchemy/learning/submitFeedback",
    params: {threadId, feedbackId: "foreign:1", text: "Your last answer was too technical. From now on, use plain language."}})}\n`);
  const denied = await nextMatching(foreign.lines, (message) => message?.id === 4);
  assert.ok(denied.error, JSON.stringify(denied));
  assert.deepEqual(denied.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  foreign.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 7, method: "cyberalchemy/learning/dismissPendingFeedback",
    params: {threadId, feedbackId: "hosted-feedback:pending:1", text: pendingText}})}\n`);
  const deniedDismissal = await nextMatching(foreign.lines, (message) => message?.id === 7);
  assert.deepEqual(deniedDismissal.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  foreign.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 13, method: "cyberalchemy/learning/applyPendingFeedback",
    params: reviewParams})}\n`);
  const deniedReview = await nextMatching(foreign.lines, (message) => message?.id === 13);
  assert.deepEqual(deniedReview.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  foreign.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "cyberalchemy/learning/pendingFeedback/list",
    params: {threadId}})}\n`);
  const deniedList = await nextMatching(foreign.lines, (message) => message?.id === 9);
  assert.deepEqual(deniedList.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  foreign.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 15, method: "cyberalchemy/learning/lessons/list",
    params: {threadId}})}\n`);
  const deniedLessons = await nextMatching(foreign.lines, (message) => message?.id === 15);
  assert.deepEqual(deniedLessons.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  foreign.socket.destroy();
  connection.socket.destroy();
});

test("gateway reports degraded steer continuity even without a recoverable reasoning row", async (context) => {
  const {gateway, listenPath} = fixture({wrapper_factory: () => ({...passThroughWrapper(),
    observeReasoningThreads: () => [], inspectState: () => ({degraded_steer_threads: ["private-thread-id"]})})});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:degraded-observer", "plan-bound");
  assert.equal(connection.receipt.ok, true);
  const observation = gateway.observeReasoningThreads();
  assert.equal(observation.thread_count, 0);
  assert.equal(observation.degraded_steer_thread_count, 1);
  assert.doesNotMatch(JSON.stringify(observation), /private-thread-id/);
  connection.socket.destroy();
});

test("acknowledged gateway requires stable keys for mutations but permits keyless reads", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:stable-key-required", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start",
    params: {threadId: "thread-stable-key", input: []}})}\n`);
  const denied = await connection.lines.next();
  assert.deepEqual(denied.message.error.data.reason_codes, ["gateway.stable-request-key-required"]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
    params: {threadId: "thread-stable-key", input: []},
    [GATEWAY_REQUEST_META_KEY]: {request_key: `are-generated:${"a".repeat(64)}`}})}\n`);
  assert.deepEqual((await connection.lines.next()).message.error.data.reason_codes, ["gateway.request-key-invalid"]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/read",
    params: {threadId: "thread-stable-key", includeTurns: false}})}\n`);
  assert.equal((await nextJsonLine(children[0].stdin)).method, "thread/read");
  connection.socket.destroy();
});

test("gateway does not record a rejected steer or a failed compaction item", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:negative-lifecycle", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start", params: {threadId: "negative-thread", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "negative:start"}})}\n`);
  await nextJsonLine(children[0].stdin);
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/steer", params: {threadId: "negative-thread", expectedTurnId: "turn-1", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "negative:steer"}})}\n`);
  const steer = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: steer.id, error: {code: -32602, message: "No active turn"}})}\n`);
  assert.equal((await connection.lines.next()).message.error.message, "No active turn");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/completed", params: {threadId: "negative-thread", turnId: "turn-1", item: {type: "contextCompaction", id: "compact-failed", status: "failed"}}})}\n`);
  assert.equal((await connection.lines.next()).message.params.item.status, "failed");
  assert.deepEqual(gateway.inspect().durable_session_index.sessions[0].host_observations, []);
  connection.socket.destroy();
});

test("gateway rejects a host steer acknowledgement for the wrong turn", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:steer-mismatch", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/steer", params: {threadId: "steer-thread", expectedTurnId: "expected-turn", input: []}, [GATEWAY_REQUEST_META_KEY]: {request_key: "steer:mismatch"}})}\n`);
  const upstream = await nextJsonLine(children[0].stdin);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turnId: "other-turn"}})}\n`);
  const denied = await connection.lines.next();
  assert.deepEqual(denied.message.error.data.reason_codes, ["gateway.steer-turn-mismatch"]);
  assert.equal(gateway.inspect().durable_session_index.sessions[0].host_observations.length, 0);
  await waitFor(() => children[0].killed, "mismatched steer backend shutdown");
  connection.socket.destroy();
});

test("gateway rejects concurrent attachment and unauthorized consumers", async (context) => {
  const {gateway, listenPath} = fixture({authorize_client: ({consumer_id}) => consumer_id === "allowed"});
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "allowed", "plan-bound");
  const duplicate = await connectGateway(listenPath, "allowed", "plan-bound");
  const denied = await connectGateway(listenPath, "denied", "plan-bound");
  assert.equal(first.receipt.ok, true);
  assert.equal(duplicate.receipt.reason, "gateway.consumer-already-attached");
  assert.equal(denied.receipt.reason, "gateway.client-not-authorized");
  first.socket.destroy();
  duplicate.socket.destroy();
  denied.socket.destroy();
});

test("detached buffer overflow closes only the affected session", async (context) => {
  const {gateway, listenPath, children} = fixture({max_buffered_messages_per_client: 1});
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.destroy();
  await once(connection.socket, "close");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  children[0].stdout.write(`${JSON.stringify({method: "one"})}\n${JSON.stringify({method: "two"})}\n`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(children[0].killed, true);
  assert.equal(gateway.inspect().sessions.length, 0);
});

test("detach expiry checkpoints before eviction and authenticates an explicit session-expired result", async (context) => {
  const calls = [];
  const {gateway, listenPath, children} = fixture({
    detach_timeout_ms: 20,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({
      ...passThroughWrapper(),
      prepareForEviction: ({reason}) => {
        calls.push(`checkpoint:${reason}`);
        return {ok: true, checkpoint_digest: "checkpoint:detach", epoch_digest: "epoch:detach", preparation_digest: "preparation:detach"};
      },
      close: () => calls.push("close"),
    }),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "session expiration tombstone");
  assert.deepEqual(calls, ["checkpoint:detach-timeout", "close"]);
  assert.equal(children[0].killed, true);
  const resumed = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(resumed.receipt.ok, false);
  assert.equal(resumed.receipt.reason, "gateway.session-expired");
  assert.equal(resumed.receipt.expiration.checkpoint_digest, "checkpoint:detach");
  resumed.socket.destroy();
});

test("unsafe eviction retries without closing until the checkpoint becomes eligible", async (context) => {
  let eligible = false;
  let attempts = 0;
  let closes = 0;
  const {gateway, listenPath} = fixture({
    detach_timeout_ms: 15,
    eviction_retry_ms: 10,
    wrapper_factory: () => ({
      ...passThroughWrapper(),
      prepareForEviction: () => {
        attempts += 1;
        return eligible ? {ok: true, checkpoint_digest: "checkpoint:retry", epoch_digest: "epoch:retry", preparation_digest: "preparation:retry"} : {ok: false, reason_codes: ["session.active-turn"]};
      },
      close: () => { closes += 1; },
    }),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.destroy();
  await once(connection.socket, "close");
  await waitFor(() => attempts >= 1, "blocked eviction attempt");
  assert.equal(gateway.inspect().sessions.length, 1);
  assert.equal(closes, 0);
  assert.deepEqual(gateway.inspect().sessions[0].lifecycle.last_eviction_block.reason_codes, ["session.active-turn"]);
  eligible = true;
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "retried safe eviction");
  assert.equal(closes, 1);
});

test("reconnect before detach timeout cancels expiration", async (context) => {
  let checkpoints = 0;
  const {gateway, listenPath} = fixture({
    detach_timeout_ms: 80,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({...passThroughWrapper(), prepareForEviction: () => { checkpoints += 1; return {ok: true}; }}),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await once(first.socket, "close");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  const second = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(second.receipt.ok, true);
  assert.equal(second.receipt.resumed, true);
  await new Promise((resolveWait) => setTimeout(resolveWait, 90));
  assert.equal(gateway.inspect().expired_sessions.length, 0);
  assert.equal(checkpoints, 0);
  second.socket.destroy();
});

test("reasoning-log limit rejects new work, checkpoints, and never truncates the ledger", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-ledger-limit-"));
  const logPath = resolve(directory, "reasoning.jsonl");
  const original = "0123456789abcdefghijklmnopqrstuvwxyz\n";
  writeFileSync(logPath, original);
  const {gateway, listenPath} = fixture({
    max_reasoning_log_bytes_per_session: 16,
    eviction_retry_ms: 5,
    wrapper_factory: () => ({...passThroughWrapper(), inspectState: () => ({reasoning_state: {sink: {path: logPath}}})}),
  });
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start", params: {}})}\n`);
  const blocked = await connection.lines.next("resource limit delivery");
  assert.equal(blocked.message.error.code, -32095);
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.session-reasoning-log-byte-limit"]);
  await waitFor(() => gateway.inspect().expired_sessions.length === 1, "log-limit expiration");
  assert.equal(readFileSync(logPath, "utf8"), original);
  connection.socket.destroy();
});

test("disabled reconnect closes consumer state on disconnect", async (context) => {
  const {gateway, listenPath, children} = fixture({reconnect: false});
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectGateway(listenPath, "codex:plan", "plan-bound");
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions.length === 0, "non-reconnectable session close");
  const second = await connectGateway(listenPath, "codex:plan", "plan-bound");
  assert.equal(second.receipt.resumed, false);
  assert.equal(children.length, 2);
  second.socket.destroy();
});

test("upstream exit is visible and closes only its consumer session", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectGateway(listenPath, "codex:plan", "plan-bound");
  const errorLine = nextJsonLine(connection.socket, 2000, "upstream exit error");
  children[0].emit("exit", 17, null);
  const error = await errorLine;
  assert.equal(error.error.code, -32090);
  await waitFor(() => gateway.inspect().sessions.length === 0, "failed upstream cleanup");
});

test("stdio client adapter consumes the gateway handshake and forwards only app-server bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const input = new PassThrough();
  const output = new PassThrough();
  const error = new PassThrough();
  const socket = runGatewayClientProxy({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:human-chat", lane: "interaction-bound", client_input: input, client_output: output, client_error: error});
  context.after(() => socket.destroy());
  await once(socket, "connect");
  await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  const upstream = nextJsonLine(children[0].stdin);
  input.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).id, 9);
  const downstream = nextJsonLine(output);
  children[0].stdout.write(`${JSON.stringify({id: 9, result: {ready: true}})}\n`);
  assert.equal((await downstream).result.ready, true);
});

test("stdio compatibility client rejects a mismatched gateway receipt before exposing server bytes", async (context) => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-gateway-proxy-"));
  const listenPath = testGatewayPath(directory);
  let handshake = null;
  const server = createServer((peer) => {
    let buffer = "";
    peer.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const index = buffer.indexOf("\n");
      if (index < 0 || handshake) return;
      handshake = JSON.parse(buffer.slice(0, index));
      peer.write(`${JSON.stringify({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
        consumer_id: "codex:other", lane: "interaction-bound"})}\n${JSON.stringify({id: 1, result: {private: true}})}\n`);
    });
  });
  await new Promise((resolveListen) => server.listen(listenPath, resolveListen));
  context.after(async () => {
    await new Promise((resolveClose) => server.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  });
  const input = new PassThrough();
  const output = new PassThrough();
  const error = new PassThrough();
  const errorLine = once(error, "data");
  const socket = runGatewayClientProxy({socket_path: listenPath, consumer_id: "codex:human-chat",
    lane: "interaction-bound", client_input: input, client_output: output, client_error: error});
  context.after(() => socket.destroy());
  const [failure] = await errorLine;
  assert.match(failure.toString(), /gateway.connect-binding-mismatch/);
  assert.equal(handshake.continuity, undefined, "legacy restart semantics stay unacknowledged");
  assert.equal(output.read(), null, "mismatched server payload must not reach the client");
  input.end();
});

test("programmatic RPC transport consumes the gateway handshake and exposes app-server bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const transport = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:human-chat", lane: "interaction-bound"});
  context.after(() => transport.close());
  const receipt = await transport.ready;
  assert.equal(receipt.ok, true);
  assert.equal(receipt.consumer_id, "codex:human-chat");
  const upstream = nextJsonLine(children[0].stdin);
  transport.input.write(`${JSON.stringify({jsonrpc: "2.0", id: 17, method: "initialize", params: {}})}\n`);
  assert.equal((await upstream).id, 17);
  const downstream = nextJsonLine(transport.output);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 17, result: {ready: true}})}\n`);
  assert.deepEqual((await downstream).result, {ready: true});
});

test("acknowledged reconnect requires the session resume secret", async (context) => {
  const {gateway, listenPath} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:authenticated", lane: "plan-bound"});
  const firstReceipt = await first.ready;
  assert.match(firstReceipt.continuity.resume_token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(firstReceipt.continuity.resume_token_digest, /^[a-f0-9]{64}$/);
  await first.close();
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "authenticated detach");

  const missing = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:authenticated", lane: "plan-bound", continuity: false});
  await assert.rejects(missing.ready, (error) => error.code === "gateway.resume-authentication-required");
  const wrong = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:authenticated", lane: "plan-bound", resume_token: "not-the-session-secret"});
  await assert.rejects(wrong.ready, (error) => error.code === "gateway.resume-authentication-failed");

  const resumed = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:authenticated", lane: "plan-bound", resume_token: firstReceipt.continuity.resume_token});
  assert.equal((await resumed.ready).resumed, true);
  await resumed.close();
});

test("fresh RPC transport adopts the authenticated gateway delivery watermark after restart", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken,
    consumer_id: "codex:watermark", lane: "plan-bound"});
  const firstReceipt = await first.ready;
  const firstResponse = nextJsonLine(first.output);
  const firstUpstream = nextJsonLine(children[0].stdin);
  first.input.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {}})}\n`);
  assert.equal((await firstUpstream).id, 1);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, result: {ready: true}})}\n`);
  assert.equal((await firstResponse).result.ready, true);
  await waitFor(() => gateway.inspect().sessions[0]?.acknowledged_through > 0, "first transport acknowledgement");
  const watermark = gateway.inspect().sessions[0].acknowledged_through;
  await first.close();
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "watermark detach");

  const resumed = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken,
    consumer_id: "codex:watermark", lane: "plan-bound", resume_token: firstReceipt.continuity.resume_token});
  context.after(() => resumed.close());
  const receipt = await resumed.ready;
  assert.equal(receipt.resumed, true);
  assert.equal(receipt.continuity.acknowledged_through, watermark);
  assert.equal(resumed.inspect().last_acked_sequence, watermark);
  const secondResponse = nextJsonLine(resumed.output);
  const secondUpstream = nextJsonLine(children[0].stdin);
  resumed.input.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/read", params: {threadId: "stored-thread", includeTurns: false}})}\n`);
  assert.equal((await secondUpstream).id, 2);
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, result: {thread: {id: "stored-thread"}}})}\n`);
  assert.equal((await secondResponse).result.thread.id, "stored-thread");
});

test("stable request key adopts an in-flight request without duplicate upstream dispatch", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const firstTransport = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:inflight", lane: "interaction-bound"});
  const firstReceipt = await firstTransport.ready;
  const firstClient = createAppServerRpcClient({transport: firstTransport, request_timeout_ms: 2000});
  const abandoned = firstClient.request("turn/start", {threadId: "thread-1", input: []}, {idempotency_key: "turn:stable-1"});
  abandoned.catch(() => {});
  const upstream = await nextJsonLine(children[0].stdin, 2000, "stable upstream request");
  assert.match(String(upstream.id), /^are-gateway:/);
  await firstClient.close();
  await assert.rejects(abandoned, /closed/);
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "in-flight detach");

  const resumedTransport = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:inflight", lane: "interaction-bound", resume_token: firstReceipt.continuity.resume_token});
  await resumedTransport.ready;
  const resumedClient = createAppServerRpcClient({transport: resumedTransport, request_timeout_ms: 2000});
  const adopted = resumedClient.request("turn/start", {threadId: "thread-1", input: []}, {idempotency_key: "turn:stable-1"});
  await waitFor(() => gateway.inspect().sessions[0]?.deduplicated_request_count === 1, "stable request adoption");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn-1"}}})}\n`);
  assert.deepEqual(await adopted, {turn: {id: "turn-1"}});
  const state = gateway.inspect().sessions[0];
  assert.equal(state.upstream_request_count, 1);
  assert.equal(state.deduplicated_request_count, 1);
  assert.equal(state.stable_requests[0].status, "complete");
  await resumedClient.close();
});

test("stable request key blocks changed request bytes", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const transport = connectGatewayRpcTransport({socket_path: listenPath, connection_token: testConnectionToken, consumer_id: "codex:binding", lane: "plan-bound"});
  await transport.ready;
  const client = createAppServerRpcClient({transport, request_timeout_ms: 2000});
  const first = client.request("thread/start", {cwd: "/one"}, {idempotency_key: "thread:one"});
  first.catch(() => {});
  await nextJsonLine(children[0].stdin, 2000, "first bound request");
  await assert.rejects(client.request("thread/start", {cwd: "/two"}, {idempotency_key: "thread:one"}), (error) => error.details?.data?.reason_codes?.includes("gateway.request-binding-mismatch") || error.details?.reason_codes?.includes("gateway.request-binding-mismatch"));
  assert.equal(gateway.inspect().sessions[0].upstream_request_count, 1);
  await client.close();
  await assert.rejects(first, /closed/);
});

test("unacknowledged delivery replays once and disappears after acknowledgement", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound");
  children[0].stdout.write(`${JSON.stringify({method: "turn/completed", params: {turn: {id: "turn-1"}}})}\n`);
  const delivery = await first.lines.next("first delivery");
  assert.equal(delivery.schema_version, GATEWAY_DELIVERY_SCHEMA);
  first.socket.destroy();
  await once(first.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "delivery detach");

  const replay = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound", {resume_token: first.receipt.continuity.resume_token});
  const replayed = await replay.lines.next("replayed delivery");
  assert.equal(replayed.sequence, delivery.sequence);
  assert.deepEqual(replayed.message, delivery.message);
  replay.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: replayed.sequence})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 0, "delivery acknowledgement");
  replay.socket.destroy();
  await once(replay.socket, "close");
  await waitFor(() => gateway.inspect().sessions[0]?.attached === false, "acknowledged detach");
  const final = await connectAcknowledgedGateway(listenPath, "codex:delivery", "interaction-bound", {resume_token: first.receipt.continuity.resume_token, last_acked_sequence: replayed.sequence});
  await new Promise((resolveWait) => setTimeout(resolveWait, 30));
  assert.equal(gateway.inspect().sessions[0].unacknowledged_deliveries, 0);
  final.socket.destroy();
});

test("recovered deliveries replay before a newly emitted host notification", async (context) => {
  const directory = mkdtempSync(join(tmpdir(), "are-gateway-replay-order-"));
  const listenPath = testGatewayPath(directory);
  const consumerId = "codex:replay-order";
  const resumeToken = "replay-order-secret";
  const adapterId = "gateway-replay-order-fixture/v1";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:replay-order"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: adapterId,
      resume_token_digest: digestValue(resumeToken)}}).ok, true);
  for (const sequence of [1, 2]) {
    assert.equal(store.append({event_kind: "delivery-enqueued", consumer_id: consumerId,
      content: {delivery: {schema_version: GATEWAY_DELIVERY_SCHEMA, sequence,
        message: {jsonrpc: "2.0", method: "fixture/retained", params: {sequence}},
        authority_effect: "none"}}}).ok, true);
  }
  const gateway = createPersistentGateway({listen_path: listenPath,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    backend_adapter: createJsonLineProcessBackendAdapter({adapter_id: adapterId,
      command: "fixture-backend"}), session_store: store,
    wrapper_factory: passThroughWrapper,
    spawn_impl: () => {
      const child = fakeChild();
      setImmediate(() => child.stdout.write(`${JSON.stringify({jsonrpc: "2.0",
        method: "fixture/new", params: {sequence: 3}})}\n`));
      return child;
    }});
  await gateway.start();
  context.after(async () => {
    await gateway.close(); store.close();
    rmSync(directory, {recursive: true, force: true});
  });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId,
    "interaction-bound", {resume_token: resumeToken});
  assert.equal(connection.receipt.ok, true);
  for (const sequence of [1, 2, 3]) {
    const delivery = await connection.lines.next(`ordered delivery ${sequence}`);
    assert.equal(delivery.sequence, sequence);
    assert.equal(delivery.message.params.sequence, sequence);
  }
  connection.socket.destroy();
});

test("turn completion is continuous both immediately before and after disconnect", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const first = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "thread-chaos", turn: {id: "turn-before", status: "completed"}}})}\n`);
  const before = await first.lines.next("completion before disconnect");
  first.socket.destroy();
  await once(first.socket, "close");
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "thread-chaos", turn: {id: "turn-after", status: "completed"}}})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 2, "two retained completions");
  const second = await connectAcknowledgedGateway(listenPath, "codex:plan", "plan-bound", {resume_token: token});
  assert.equal(second.receipt.ok, true);
  const replayedBefore = await second.lines.next("replayed completion before disconnect");
  const replayedAfter = await second.lines.next("replayed completion after disconnect");
  assert.equal(replayedBefore.sequence, before.sequence);
  assert.equal(replayedBefore.message.params.turn.id, "turn-before");
  assert.equal(replayedAfter.message.params.turn.id, "turn-after");
  second.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: replayedAfter.sequence})}\n`);
  await waitFor(() => gateway.inspect().sessions[0]?.unacknowledged_deliveries === 0, "completion acknowledgements");
  second.socket.destroy();
});

test("server-request response is forwarded upstream at most once", async (context) => {
  const {gateway, listenPath, children} = fixture();
  await gateway.start();
  context.after(() => gateway.close());
  const connection = await connectAcknowledgedGateway(listenPath, "codex:effect", "interaction-bound");
  let upstreamWrites = 0;
  children[0].stdin.on("data", () => { upstreamWrites += 1; });
  children[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-1", method: "item/commandExecution/requestApproval", params: {command: "echo safe"}})}\n`);
  const request = await connection.lines.next("server request delivery");
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: request.sequence})}\n`);
  const response = {jsonrpc: "2.0", id: "approval-1", result: {decision: "decline"}};
  connection.socket.write(`${JSON.stringify(response)}\n${JSON.stringify(response)}\n`);
  const forwarded = await nextJsonLine(children[0].stdin, 2000, "one server response");
  assert.deepEqual(forwarded, response);
  await waitFor(() => gateway.inspect().sessions[0]?.deduplicated_server_response_count === 1, "duplicate server response suppression");
  assert.equal(upstreamWrites, 1);
  assert.equal(gateway.inspect().sessions[0].forwarded_server_responses, 1);
  connection.socket.destroy();
});

test("Codex gateway durably resolves a turn-bound user-input request and rejects a late answer", async context => {
  const consumerId = "codex:resolved-user-input";
  const threadId = "owned-input-thread";
  const turnId = "owned-input-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:resolved-user-input"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const request = {jsonrpc: "2.0", id: "input-1", method: "item/tool/requestUserInput",
    params: {threadId, turnId, itemId: "item-1", isBlocking: true,
      questions: [{id: "choice", header: "Choice", question: "Proceed?", options: []}]}};
  children[0].stdout.write(`${JSON.stringify(request)}\n`);
  const delivered = await connection.lines.next("user-input delivery");
  assert.deepEqual(delivered.message, request);
  const resolution = {jsonrpc: "2.0", method: "serverRequest/resolved",
    params: {threadId, requestId: request.id}};
  children[0].stdout.write(`${JSON.stringify(resolution)}\n`);
  const deliveredResolution = await connection.lines.next("user-input resolution");
  assert.deepEqual(deliveredResolution.message, resolution);
  assert.equal(store.getSession(consumerId).server_requests[0].status, "resolved-unanswered");
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: request.id,
    result: {answers: {choice: {answers: ["Yes"]}}}})}\n`);
  const rejected = await connection.lines.next("late answer rejection");
  assert.deepEqual(rejected.message.error?.data?.reason_codes,
    ["gateway.server-request-already-resolved"]);
  assert.equal(children[0].stdin.readableLength, 0);
  connection.socket.destroy();
});

test("Codex gateway fails closed when the host reuses an unresolved server request ID", async context => {
  const consumerId = "codex:duplicate-user-input";
  const threadId = "owned-duplicate-thread";
  const turnId = "owned-duplicate-turn";
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:duplicate-user-input"});
  const {gateway, listenPath, children} = fixture({codex_protocol: true, session_store: store});
  await gateway.start();
  context.after(async () => { await gateway.close(); store.close(); });
  const connection = await connectAcknowledgedGateway(listenPath, consumerId, "interaction-bound");
  bindFixtureThread(store, consumerId, threadId);
  seedAcceptedTurnForFixture(store, consumerId, threadId, turnId);
  const request = {jsonrpc: "2.0", id: "input-duplicate", method: "item/tool/requestUserInput",
    params: {threadId, turnId, itemId: "item-1", isBlocking: true,
      questions: [{id: "choice", header: "Choice", question: "Proceed?", options: []}]}};
  children[0].stdout.write(`${JSON.stringify(request)}\n`);
  assert.deepEqual((await connection.lines.next("first user-input request")).message, request);
  children[0].stdout.write(`${JSON.stringify(request)}\n`);
  const rejected = await connection.lines.next("duplicate user-input request rejection");
  assert.deepEqual(rejected.message.error?.data?.reason_codes, ["gateway.server-request-id-reused"]);
  assert.equal(store.getSession(consumerId).server_requests.length, 1);
  connection.socket.destroy();
});

test("resume token fails closed after gateway process-state loss", async () => {
  const firstFixture = fixture();
  await firstFixture.gateway.start();
  const first = await connectAcknowledgedGateway(firstFixture.listenPath, "codex:crash", "plan-bound");
  const token = first.receipt.continuity.resume_token;
  first.socket.destroy();
  await firstFixture.gateway.close();

  let spawns = 0;
  const restarted = createPersistentGateway({
    listen_path: firstFixture.listenPath,
    ...(testConnectionToken ? {connection_token: testConnectionToken} : {}),
    wrapper_factory: passThroughWrapper,
    spawn_impl: () => { spawns += 1; return fakeChild(); },
  });
  await restarted.start();
  try {
    const rejected = await connectAcknowledgedGateway(firstFixture.listenPath, "codex:crash", "plan-bound", {resume_token: token});
    assert.equal(rejected.receipt.ok, false);
    assert.equal(rejected.receipt.reason, "gateway.resume-session-missing");
    assert.equal(spawns, 0);
    rejected.socket.destroy();
  } finally {
    await restarted.close();
  }
});
