import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {EventEmitter} from "node:events";
import {mkdirSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

import {AppServerRpcError, createApprovalBroker, createElicitationBroker, createUserInputBroker, createWindowsClientHost, WINDOWS_CLIENT_STATE_SCHEMA} from "../index.mjs";
import {HOSTED_EFFECT_DYNAMIC_TOOL} from "../src/host-method-policy.mjs";
import {resolveHostedEffectRoot} from "../src/hosted-effect-root.mjs";
import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";
import {createWindowsClientRecoveryState} from "../src/windows-client-recovery-state.mjs";
import {digestValue} from "../src/canonical.mjs";
import {hostedMcpRelayCatalogPosture} from "../src/windows-client-host.mjs";
import {hostedRestrictedMcpCatalogPosture} from "../src/hosted-mcp-catalog.mjs";
import {readHostedRejoinObservation} from "../src/hosted-rejoin-observation-client.mjs";
import {GATEWAY_CONNECTED_SCHEMA, GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM, GATEWAY_THREAD_CREATION_RECOVERY_GET,
  GATEWAY_OWNED_RUNTIME_GET, GATEWAY_TURN_RECOVERY_CONFIRM, GATEWAY_TURN_RECOVERY_GET,
  GATEWAY_STEER_OUTCOME_GET} from "../src/gateway.mjs";

const HOOK_SOURCE = join(tmpdir(), "are-windows-client-test-hooks.json");
function trustedHooks() {
  return {data: [{hooks: ["pre_tool_use", "user_prompt_submit", "stop"].map(event => ({
    key: `${HOOK_SOURCE}:${event}:0:0`, sourcePath: HOOK_SOURCE,
    currentHash: `sha256:${"a".repeat(64)}`, trustStatus: "trusted", enabled: true}))}], nextCursor: null};
}
const firstTurnProof = threadId => ({schema_version: "are.gateway-owned-runtime/v1",
  thread_id: threadId, disposition: "first-turn-ready", creation_acceptance_digest: "a".repeat(64),
  authority_effect: "none"});

function fixture(options = {}) {
  const calls = [];
  const events = new EventEmitter();
  const rpc = {
    events,
    initialize: async (params) => { calls.push(["initialize", params]); return {platformFamily: "unix", platformOs: "linux", userAgent: "fixture"}; },
    notify: async (method, params) => { calls.push(["notify", method, params]); },
    startThread: async (params, requestOptions) => {
      calls.push(["thread/start", params, requestOptions]);
      return options.start_thread?.(params, requestOptions) ?? {thread: {id: "thread-1"}, instructionSources: []};
    },
    request: async (method, params, requestOptions) => {
      calls.push([method, params, requestOptions]);
      if (method === "thread/resume") return options.resume_thread?.(params) ?? {thread: {id: params.threadId}};
      if (method === "mcpServerStatus/list") {
        if (options.mcp_status_error) throw options.mcp_status_error;
        return options.mcp_status ?? {data: [], nextCursor: null};
      }
      if (method === "hooks/list") {
        if (options.hooks_list_error) throw options.hooks_list_error;
        return options.hooks_list ?? trustedHooks();
      }
      if (method === "cyberalchemy/learning/status") return {available: options.feedback_available ?? true};
      if (method === "cyberalchemy/learning/pendingFeedback/list") return options.feedback_list?.(params)
        ?? {ok: true, schema_version: "are.pending-feedback-list/v1", thread_id: params.threadId,
          count: 0, items: [], authority_effect: "none"};
      if (method === "cyberalchemy/learning/lessons/list") return options.feedback_lessons?.(params)
        ?? {ok: true, schema_version: "are.current-lessons-list/v1", thread_id: params.threadId,
          count: 0, items: [], authority_effect: "none"};
      if (method === "thread/read") {
        if (params.includeTurns && options.thread_read_with_turns_error) throw options.thread_read_with_turns_error;
        return (params.includeTurns ? options.thread_read_with_turns : null)
          ?? options.thread_read ?? {thread: {id: params.threadId, status: {type: "idle"}}};
      }
      if (method === GATEWAY_TURN_RECOVERY_GET) return options.recovery_response ?? {};
      if (method === GATEWAY_STEER_OUTCOME_GET) return options.steer_outcome?.(params)
        ?? {schema_version: "are.gateway-steer-outcome/v1", disposition: "unrecorded", authority_effect: "none"};
      if (method === GATEWAY_TURN_RECOVERY_CONFIRM) return options.confirm_recovery?.(params) ?? {};
      if (method === GATEWAY_THREAD_CREATION_RECOVERY_GET) return options.creation_recovery_get?.(params) ?? {};
      if (method === GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM) return options.creation_recovery_confirm?.(params) ?? {};
      if (method === GATEWAY_OWNED_RUNTIME_GET) return options.owned_runtime?.(params) ?? {};
      if (method === "thread/turns/list" && params.itemsView === "notLoaded") {
        if (options.runtime_error) throw options.runtime_error;
        return options.runtime_page ?? {data: [], nextCursor: null};
      }
      if (method === "thread/turns/list") {
        if (options.history_error) throw options.history_error;
        return options.history_page ?? {data: [], nextCursor: null, backwardsCursor: null};
      }
      if (method === "turn/start") {
        if (options.turn_start) return options.turn_start(params);
        return {turn: {id: "turn-1", status: "inProgress"}};
      }
      if (method === "turn/steer") return options.turn_steer?.(params, requestOptions)
        ?? {turnId: params.expectedTurnId};
      if (method === "thread/compact/start") return options.compact_start?.(params, requestOptions) ?? {};
      if (method === "cyberalchemy/learning/submitFeedback") return options.feedback_submit?.(params)
        ?? {ok: true, disposition: "applied", feedback_ref: "feedback:fixture", lesson_digest: "a".repeat(64)};
      if (method === "cyberalchemy/learning/dismissPendingFeedback") return options.feedback_dismiss?.(params)
        ?? {ok: true, disposition: "dismissed", feedback_ref: "feedback:fixture"};
      if (method === "cyberalchemy/learning/applyPendingFeedback") return options.feedback_apply?.(params)
        ?? {ok: true, disposition: "applied", feedback_ref: "feedback:fixture",
          retention_scope: "current-interaction", lesson_digest: "a".repeat(64)};
      return {};
    },
    close: async () => { calls.push(["close"]); },
  };
  const broker = createApprovalBroker({timeout_ms: 1000});
  const userInputBroker = createUserInputBroker({timeout_ms: 1000});
  const elicitationBroker = createElicitationBroker({timeout_ms: 1000});
  const repositoryRoot = options.repository_root ?? mkdtempSync(join(tmpdir(), "are-windows-client-test-"));
  const effectRoot = options.effect_root_subdir ? join(repositoryRoot, options.effect_root_subdir) : repositoryRoot;
  if (options.effect_root_subdir) mkdirSync(effectRoot);
  const assets = resolve(import.meta.dirname, "../client");
  const recoveryState = options.recovery_state ? {
    pending_turn_intent: () => null, record_turn_intent: () => {}, last_turn_result: () => null,
    pending_steer_intent: () => null, record_steer_intent: () => {}, clear_steer_intent: () => {},
    reject_turn_intent: () => {},
    settle_recovered_turn_intent: () => { throw new Error("unexpected recovered turn"); },
    settle_turn_intent: (entry, turnId) => ({schema_version: "are.codex-client-accepted-turn/v1", thread_id: entry.thread_id,
      request_key: entry.request_key, text_digest: entry.text_digest, turn_id: turnId, accepted_at: new Date().toISOString()}),
    ...options.recovery_state,
  } : null;
  const host = createWindowsClientHost({rpc_client: rpc, approval_broker: broker, user_input_broker: userInputBroker, elicitation_broker: elicitationBroker, recovery_state: recoveryState, repository_root: repositoryRoot, default_cwd: effectRoot, assets_directory: assets, port: 0, token: "test-token", ...(options.host_options?.allow_hosted_effect_tool ? {hosted_effect_root: effectRoot} : {}), ...(options.host_options ?? {})});
  return {host, rpc, broker, userInputBroker, elicitationBroker, calls, repositoryRoot, effectRoot, options};
}

async function request(ready, path, options = {}) {
  return fetch(`${ready.url.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {authorization: "Bearer test-token", "content-type": "application/json", ...(options.headers ?? {})},
  });
}

test("hosted Rejoin observation is scoped, content-free, and cannot use the control API", async context => {
  const threadId = "observed-recovered-thread";
  const observer = "observation-token-0123456789abcdef0123456789abcdef";
  const value = fixture({host_options: {observation_token: observer},
    recovery_state: {thread_ids: () => [threadId], record_thread: () => {}},
    owned_runtime: () => firstTurnProof(threadId)});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const ref = `backend-thread:${digestValue(threadId)}`;
  const endpoint = `${ready.url}api/observation/rejoin`;
  assert.deepEqual((await readHostedRejoinObservation({url: endpoint, token: observer, refs: []})).rows, []);
  const observed = await readHostedRejoinObservation({url: endpoint, token: observer, refs: [ref]});
  assert.equal(observed.rows[0].status, "rejoin-ready");
  assert.deepEqual(Object.keys(observed.rows[0]).sort(), ["pending_steer_checkpoint", "reason_code", "status", "thread_ref"]);
  assert.equal(observed.rows[0].reason_code, null);
  assert.equal(observed.rows[0].pending_steer_checkpoint, false);
  assert.equal((await fetch(`${ready.url}api/state`, {headers: {authorization: `Bearer ${observer}`}})).status, 401);
  assert.equal((await request(ready, `/api/observation/rejoin?refs=${ref}`)).status, 401);
  assert.equal((await fetch(`${endpoint}?refs=${ref}`, {headers: {authorization: `Bearer ${observer}`,
    origin: "https://other.example"}})).status, 401);
  assert.equal((await fetch(`${endpoint}?refs=not-a-ref`, {headers: {authorization: `Bearer ${observer}`}})).status, 400);
  assert.equal(value.calls.some(([method]) => method === "thread/resume" || method === "turn/start"), false);
  const resumed = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId, requestKey: "resume:observation"})});
  assert.equal(resumed.status, 200);
  assert.equal((await readHostedRejoinObservation({url: endpoint, token: observer, refs: [ref]})).rows[0].status,
    "rejoined");
});

async function rejoinRecoveredFixture(value, ready, threadId = "owned-thread") {
  assert.equal(value.options.owned_runtime, undefined, "fixture must not replace a selected runtime proof");
  value.options.owned_runtime = ({threadId: observed}) => firstTurnProof(observed);
  try {
    const resumed = await request(ready, "/api/threads/resume", {method: "POST",
      body: JSON.stringify({threadId, requestKey: `resume:${threadId}`})});
    assert.equal(resumed.status, 200, JSON.stringify(await resumed.clone().json()));
  } finally {
    delete value.options.owned_runtime;
  }
}

test("Windows client host initializes once and serves authenticated state", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await fetch(`${ready.url}healthz`)).status, 200);
  const pendingThreadAsset = await fetch(`${ready.url}pending-thread.js`);
  assert.equal(pendingThreadAsset.status, 200);
  assert.match(pendingThreadAsset.headers.get("content-type"), /javascript/);
  assert.match(await pendingThreadAsset.text(), /preparePendingThread/);
  const runtimeVerificationAsset = await fetch(`${ready.url}runtime-verification.js`);
  assert.equal(runtimeVerificationAsset.status, 200);
  assert.match(runtimeVerificationAsset.headers.get("content-type"), /javascript/);
  assert.match(await runtimeVerificationAsset.text(), /readVerifiedRuntime/);
  const requirementsAsset = await fetch(`${ready.url}requirements-entry.js`);
  assert.equal(requirementsAsset.status, 200);
  assert.match(requirementsAsset.headers.get("content-type"), /javascript/);
  assert.match(await requirementsAsset.text(), /prepareRequirementEntry/);
  const postureAsset = await fetch(`${ready.url}requirement-posture.js`);
  assert.equal(postureAsset.status, 200);
  assert.match(await postureAsset.text(), /requirementPostureView/);
  assert.equal((await fetch(`${ready.url}api/state`)).status, 401);
  const response = await request(ready, "/api/state");
  const body = await response.json();
  assert.equal(body.value.schema_version, WINDOWS_CLIENT_STATE_SCHEMA);
  assert.equal(body.value.ready, true);
  assert.deepEqual(body.value.requirement_tracking, {status: "unverified", source: "unverified"});
  assert.equal(value.calls.filter(([method]) => method === "initialize").length, 1);
  assert.equal(value.calls.some(([method]) => method === "notify"), true);
});

test("hosted state exposes only validated launch-bound requirement posture", async (context) => {
  assert.throws(() => fixture({host_options: {requirement_tracking_posture: "other"}}),
    /Invalid hosted requirement-tracking posture/);
  const value = fixture({host_options: {requirement_tracking_posture: "enabled"}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/state");
  assert.deepEqual((await response.json()).value.requirement_tracking,
    {status: "enabled", source: "managed-gateway-startup"});
});

test("hosted client advertises only the exact opted-in effect tool on new threads", async (context) => {
  const normal = fixture();
  const normalReady = await normal.host.start();
  context.after(() => normal.host.close());
  assert.equal((await request(normalReady, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: normal.repositoryRoot, requestKey: "thread:without-effect-tool"})})).status, 201);
  const normalParams = normal.calls.find(([method]) => method === "thread/start")?.[1];
  assert.equal(Object.hasOwn(normalParams, "dynamicTools"), false);

  const opted = fixture({host_options: {allow_hosted_effect_tool: true}});
  const optedReady = await opted.host.start();
  context.after(() => opted.host.close());
  assert.equal((await request(optedReady, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: opted.repositoryRoot, requestKey: "thread:with-effect-tool"})})).status, 201);
  const optedParams = opted.calls.find(([method]) => method === "thread/start")?.[1];
  assert.deepEqual(optedParams.dynamicTools, [HOSTED_EFFECT_DYNAMIC_TOOL]);
});

test("hosted effect tool cannot be advertised for a thread outside its selected root", async (context) => {
  const value = fixture({effect_root_subdir: "selected",
    host_options: {allow_hosted_effect_tool: true}});
  const ready = await value.host.start();
  context.after(async () => { await value.host.close(); rmSync(value.repositoryRoot, {recursive: true, force: true}); });
  const outside = await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:outside-effect-root"})});
  assert.equal(outside.status, 409);
  assert.equal((await outside.json()).reason, "windows-client.hosted-effect-workspace-outside-root");
  assert.equal(value.calls.some(([method]) => method === "thread/start"), false);
  const inside = await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.effectRoot, requestKey: "thread:inside-effect-root"})});
  assert.equal(inside.status, 201);
  assert.deepEqual(value.calls.find(([method]) => method === "thread/start")?.[1]?.dynamicTools,
    [HOSTED_EFFECT_DYNAMIC_TOOL]);
});

test("unverified Windows hook boundary leaves observation available but blocks new turns", async (context) => {
  const value = fixture({host_options: {turn_execution_blocked_reason: "windows-client.hook-boundary-unverified"}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const snapshot = (await (await request(ready, "/api/state")).json()).value;
  assert.deepEqual(snapshot.turn_execution, {enabled: false,
    reason_code: "windows-client.hook-boundary-unverified"});
  const response = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", requestKey: "turn:blocked", text: "Run a shell command."})});
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, "windows-client.hook-boundary-unverified");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  assert.equal((await request(ready, "/api/state")).status, 200);
});

test("hosted client exposes a sanitized stopped state and blocks ingress after gateway transport failure", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const failure = new Error("private prompt and local socket path must not cross HTTP");
  failure.code = "gateway.connection-closed";
  value.rpc.events.emit("failure", failure);
  const stateResponse = await request(ready, "/api/state");
  const snapshot = (await stateResponse.json()).value;
  assert.equal(snapshot.ready, false);
  assert.deepEqual(snapshot.transport_failure, {code: "gateway.connection-closed", authority_effect: "none"});
  assert.doesNotMatch(JSON.stringify(snapshot), /private prompt|local socket path/);
  assert.equal((await (await fetch(`${ready.url}healthz`)).json()).ready, false);
  for (const path of ["/api/threads", "/api/threads/resume", "/api/turns", "/api/turns/recover",
    "/api/turns/interrupt", "/api/feedback", "/api/approvals/1", "/api/user-input/1", "/api/elicitations/1"]) {
    const response = await request(ready, path, {method: "POST", body: "{}"});
    assert.equal(response.status, 503, path);
    assert.equal((await response.json()).reason, "windows-client.gateway-unavailable");
  }
  assert.equal((await request(ready, "/api/threads/thread-1/runtime")).status, 503);
  assert.equal((await request(ready, "/api/threads/thread-1/history")).status, 503);
  const events = await request(ready, "/api/events");
  assert.equal(events.status, 200);
  await events.body.cancel();
  assert.equal(value.calls.some(([method]) => ["thread/start", "turn/start", "thread/resume"].includes(method)), false);
  assert.equal((await fetch(`${ready.url}api/state`)).status, 401);
});

test("valid durable startup fault serves only a read-only stopped client", async (context) => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), "are-windows-client-stopped-"));
  const fault = {code: "gateway.session-faulted", fault_digest: "a".repeat(64),
    fault_reason_code: "gateway.compaction-item-history-conflict"};
  const options = {approval_broker: createApprovalBroker(), user_input_broker: createUserInputBroker(),
    repository_root: repositoryRoot, assets_directory: resolve(import.meta.dirname, "../client"),
    port: 0, token: "test-token", startup_failure: fault};
  assert.throws(() => createWindowsClientHost({...options,
    startup_failure: {...fault, fault_digest: "private-thread"}}), /valid gateway stop diagnostic/);
  const host = createWindowsClientHost(options);
  context.after(async () => { await host.close(); rmSync(repositoryRoot, {recursive: true, force: true}); });
  const stopped = await host.start();
  assert.equal(stopped.schema_version, "are.codex-windows-client-stopped/v1");
  assert.equal(stopped.transport_failure.fault_digest, fault.fault_digest);
  const state = (await (await request(stopped, "/api/state")).json()).value;
  assert.equal(state.ready, false);
  assert.equal(state.initialization, null);
  assert.equal(state.transport_failure.fault_reason_code, fault.fault_reason_code);
  assert.equal((await request(stopped, "/api/threads", {method: "POST", body: "{}"})).status, 503);
  assert.equal((await (await fetch(`${stopped.url}healthz`)).json()).ready, false);
  assert.equal((await fetch(`${stopped.url}api/state`)).status, 401);
});

test("Windows client host starts a confined thread and turn", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const threadResponse = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  assert.equal(threadResponse.status, 201);
  const thread = await threadResponse.json();
  assert.equal(thread.value.thread.id, "thread-1");
  assert.equal(value.calls.find(([method]) => method === "thread/start")?.[1]?.approvalPolicy, "on-request");
  assert.equal(value.calls.find(([method]) => method === "thread/start")?.[1]?.sandbox, "read-only");
  const turnResponse = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:key"})});
  assert.equal(turnResponse.status, 202);
  const turnParams = value.calls.find(([method]) => method === "turn/start")?.[1];
  assert.equal(turnParams.approvalPolicy, "on-request");
  assert.deepEqual(turnParams.sandboxPolicy, {type: "readOnly"});
  assert.equal(turnParams.collaborationMode, undefined);
  const escaped = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: "/tmp"})});
  assert.equal(escaped.status, 400);
});

test("hosted requirement seed is bounded and bound into the submitted turn parameters", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:requirements"})})).status, 201);
  const invalid = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "Research context", requestKey: "turn:invalid",
      requirements: ["citations", "citations"]})});
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).reason, "windows-client.requirements-invalid");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  const accepted = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "Research context", requestKey: "turn:requirements",
      requirements: ["citations"]})});
  assert.equal(accepted.status, 202);
  const params = value.calls.find(([method]) => method === "turn/start")?.[1];
  assert.deepEqual(JSON.parse(params.additionalContext["cyberalchemy.request-context"].value), {
    schema_version: "are.request-context-hint/v1", raw_request: "Research context",
    requirement_seed: ["citations"],
  });
  for (const requirements of [["different"], undefined]) {
    const conflicting = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", text: "Research context",
        requestKey: "turn:requirements", ...(requirements === undefined ? {} : {requirements})})});
    assert.equal(conflicting.status, 409);
    assert.equal((await conflicting.json()).reason, "windows-client.accepted-binding-conflict");
  }
  const replay = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "Research context",
      requestKey: "turn:requirements", requirements: ["citations"]})});
  assert.equal(replay.status, 202);
  assert.equal((await replay.json()).value.recovered_from_receipt, true);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
});

test("guarded user input binds a fixed Plan model and exposes its mode without changing browser policy", async (context) => {
  const value = fixture({host_options: {require_restricted_mcp_catalog: true,
    guarded_user_input_plan: true, guarded_plan_model: "are-fixture"}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const stateResponse = await request(ready, "/api/state");
  assert.equal(stateResponse.status, 200);
  assert.equal((await stateResponse.json()).value.collaboration_mode, "plan-with-guarded-user-input");
  const threadResponse = await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:plan"})});
  assert.equal(threadResponse.status, 201);
  const rejectedOverride = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "override", requestKey: "turn:override",
      collaborationMode: {mode: "default"}})});
  assert.equal(rejectedOverride.status, 400);
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  const turnResponse = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:plan"})});
  assert.equal(turnResponse.status, 202);
  const turnParams = value.calls.find(([method]) => method === "turn/start")?.[1];
  assert.deepEqual(turnParams.collaborationMode, {mode: "plan", settings: {
    model: "are-fixture", reasoning_effort: null, developer_instructions: null}});
  assert.equal(turnParams.approvalPolicy, "on-request");
  assert.deepEqual(turnParams.sandboxPolicy, {type: "readOnly"});
});

test("thread creation requires a stable request key before backend dispatch", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  for (const requestKey of [undefined, "", " ", "a".repeat(257)]) {
    const response = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, ...(requestKey === undefined ? {} : {requestKey})})});
    assert.equal(response.status, 400);
    assert.equal((await response.json()).reason, "windows-client.thread-request-key-invalid");
  }
  assert.equal(value.calls.some(([method]) => method === "thread/start"), false);
});

test("unknown gateway thread creation becomes a typed quarantine without claiming ownership", async (context) => {
  const value = fixture({start_thread: () => { throw new AppServerRpcError("rpc.response-error",
    "thread/start: Gateway stable request binding failed", {code: -32093,
      data: {reason_codes: ["gateway.dispatch-outcome-unknown"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:stable-unknown"})});
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {ok: false, reason: "windows-client.thread-creation-outcome-unknown"});
  }
  assert.deepEqual(value.calls.filter(([method]) => method === "thread/start")
    .map(([, , options]) => options.idempotency_key), ["thread:stable-unknown", "thread:stable-unknown"]);
  const state = await (await request(ready, "/api/state")).json();
  assert.deepEqual(state.value.thread_ids, []);
});

test("hosted client records an accepted unknown creation before confirming gateway recovery", async (context) => {
  const requestKey = "thread:accepted-unknown";
  const threadId = "thread:created-before-crash";
  const recorded = [];
  const receiptMaterial = {schema_version: "are.gateway-thread-creation-recovery/v1",
    request_key: requestKey, request_digest: "a".repeat(64), thread_id: threadId,
    acceptance_digest: "b".repeat(64), history_response_digest: "c".repeat(64), authority_effect: "none"};
  const receipt = {...receiptMaterial, receipt_digest: digestValue(receiptMaterial)};
  let getCount = 0;
  const value = fixture({
    start_thread: () => { throw new AppServerRpcError("rpc.response-error",
      "thread/start: Gateway stable request binding failed", {code: -32093,
        data: {reason_codes: ["gateway.dispatch-outcome-unknown"]}}); },
    recovery_state: {thread_ids: () => [...recorded], record_thread: (id) => { recorded.push(id); }},
    creation_recovery_get: () => ++getCount === 1
      ? {thread_id: threadId, history_verified: false}
      : {thread_id: threadId, history_verified: true, receipt},
    thread_read_with_turns: {thread: {id: threadId, turns: []}},
    creation_recovery_confirm: ({receipt: received}) => {
      assert.deepEqual(recorded, [threadId], "The owned thread must be checkpointed before gateway release.");
      assert.deepEqual(received, receipt);
      return {confirmed: true, recovery_digest: receipt.receipt_digest};
    },
  });
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.repositoryRoot, requestKey})});
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {ok: true, value: {thread: {id: threadId}, recovered_from_receipt: true}});
  assert.deepEqual((await (await request(ready, "/api/state")).json()).value.thread_ids, [threadId]);
  assert.equal(value.calls.filter(([method]) => method === "thread/start").length, 1);
  assert.equal(value.calls.filter(([method]) => method === "thread/read").length, 1);
});

test("new installed-host thread permits its first turn before turn history materializes", async (context) => {
  const unavailable = new AppServerRpcError("rpc.response-error",
    "thread/turns/list: thread thread-1 is not materialized yet; thread/turns/list is unavailable before first user message");
  const value = fixture({runtime_error: unavailable, history_error: unavailable,
    owned_runtime: ({threadId}) => ({schema_version: "are.gateway-owned-runtime/v1",
      thread_id: threadId, disposition: "first-turn-ready",
      creation_acceptance_digest: "a".repeat(64), authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:first"})});
  const runtime = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal((await runtime.json()).value.verification_source, "gateway-fresh-creation");
  const history = await request(ready, "/api/threads/thread-1/history");
  assert.deepEqual((await history.json()).value.messages, []);
  const turn = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:first"})});
  assert.equal(turn.status, 202);
  assert.equal(value.calls.some(([method]) => method === "turn/start"), true);
  for (const path of ["/api/threads/thread-1/runtime", "/api/threads/thread-1/history"]) {
    const stale = await request(ready, path);
    assert.equal(stale.status, 409, "A pre-first-turn host error cannot override an accepted turn.");
    assert.equal((await stale.json()).reason, "windows-client.history-unavailable");
  }
  const next = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "next", requestKey: "turn:next"})});
  assert.equal(next.status, 409);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
});

test("pre-first-turn host error without an exact gateway proof does not fabricate empty history", async (context) => {
  const unavailable = new AppServerRpcError("rpc.response-error",
    "thread/turns/list: thread thread-1 is not materialized yet; thread/turns/list is unavailable before first user message");
  const value = fixture({runtime_error: unavailable, history_error: unavailable});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:unproved"})});
  for (const path of ["/api/threads/thread-1/runtime", "/api/threads/thread-1/history"]) {
    const response = await request(ready, path);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).reason, "windows-client.history-unavailable");
  }
  const held = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:unproved"})});
  assert.equal(held.status, 409);
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
});

test("unsupported installed-host turns list falls back to verified thread read", async (context) => {
  const unsupported = new AppServerRpcError("rpc.response-error", "thread/turns/list: list_turns is not supported yet");
  const value = fixture({runtime_error: unsupported, history_error: unsupported,
    thread_read_with_turns: {thread: {id: "thread-1", status: {type: "idle"}, turns: [
      {id: "turn-1", status: "completed", items: [
        {type: "userMessage", id: "user-1", content: [{type: "text", text: "hello"}]},
        {type: "agentMessage", id: "agent-1", text: "world"},
      ]},
    ]}}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:first"})});
  const runtime = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal((await runtime.json()).value.disposition, "idle");
  const history = await request(ready, "/api/threads/thread-1/history");
  assert.deepEqual((await history.json()).value.messages.map(({role, text}) => ({role, text})), [
    {role: "user", text: "hello"}, {role: "agent", text: "world"},
  ]);
  assert.equal(value.calls.filter(([method]) => method === "thread/turns/list").length, 1);
});

test("unavailable installed-host history keeps runtime uncertain and blocks a new send", async (context) => {
  const unavailable = new AppServerRpcError("rpc.response-error", "thread/read: list_turns is not supported yet");
  const options = {runtime_error: new AppServerRpcError("rpc.response-error",
    "thread/turns/list: list_turns is not supported yet"), thread_read_with_turns_error: unavailable,
    thread_read_with_turns: {thread: {id: "thread-1", status: {type: "idle"}, turns: []}}};
  const value = fixture(options);
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:pending-history"})});
  for (const path of ["/api/threads/thread-1/runtime", "/api/threads/thread-1/history"]) {
    const response = await request(ready, path);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {ok: false, reason: "windows-client.history-unavailable"});
  }
  const body = JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:pending-history"});
  const held = await request(ready, "/api/turns", {method: "POST", body});
  assert.equal(held.status, 409);
  assert.equal((await held.json()).reason, "windows-client.history-unavailable");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  options.thread_read_with_turns_error = null;
  const accepted = await request(ready, "/api/turns", {method: "POST", body});
  assert.equal(accepted.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
});

test("fresh owned gateway creation permits only the first send when empty host history is unavailable", async (context) => {
  const unavailable = new AppServerRpcError("rpc.response-error", "thread/read: list_turns is not supported yet");
  const options = {runtime_error: new AppServerRpcError("rpc.response-error",
    "thread/turns/list: list_turns is not supported yet"), thread_read_with_turns_error: unavailable,
    owned_runtime: ({threadId}) => ({schema_version: "are.gateway-owned-runtime/v1",
      thread_id: threadId, disposition: "first-turn-ready",
      creation_acceptance_digest: "a".repeat(64), authority_effect: "none"})};
  const value = fixture(options);
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:fresh-owned"})});
  const runtime = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal(runtime.status, 200);
  assert.deepEqual((await runtime.json()).value, {schema_version: "are.codex-windows-client-runtime/v1",
    thread_id: "thread-1", disposition: "idle", host_status: "idle", turn_id: null,
    turn_status: null, verification_source: "gateway-fresh-creation", authority_effect: "none"});
  const first = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "first", requestKey: "turn:first-fresh"})});
  assert.equal(first.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
  options.owned_runtime = ({threadId}) => ({schema_version: "are.gateway-owned-runtime/v1",
    thread_id: threadId, disposition: "first-turn-ready", creation_acceptance_digest: "not-a-digest",
    authority_effect: "none"});
  const invalid = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal(invalid.status, 409);
  assert.equal((await invalid.json()).reason, "windows-client.history-unavailable");
});

test("unsupported host history permits a next turn only with a bounded owned gateway frontier", async (context) => {
  const unavailable = new AppServerRpcError("rpc.response-error", "thread/read: list_turns is not supported yet");
  const options = {runtime_error: new AppServerRpcError("rpc.response-error",
    "thread/turns/list: list_turns is not supported yet"), thread_read_with_turns_error: unavailable,
    owned_runtime: ({threadId}) => ({schema_version: "are.gateway-owned-runtime/v1",
      thread_id: threadId, disposition: "terminal-verified", turn_status: "completed",
      turn_ref: "a".repeat(64), host_observation_digest: "b".repeat(64),
      frontier_digest: "c".repeat(64), checkpoint_digest: "d".repeat(64), authority_effect: "none"})};
  const value = fixture(options);
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:owned-runtime"})});
  const runtime = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal(runtime.status, 200);
  assert.deepEqual((await runtime.json()).value, {schema_version: "are.codex-windows-client-runtime/v1",
    thread_id: "thread-1", disposition: "idle", host_status: "idle", turn_id: null,
    turn_status: "completed", turn_ref: "a".repeat(64), verification_source: "gateway-owned-frontier", authority_effect: "none"});
  const history = await request(ready, "/api/threads/thread-1/history");
  assert.equal(history.status, 409, "A frontier is not transcript history.");
  const turn = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", text: "next turn", requestKey: "turn:owned-runtime"})});
  assert.equal(turn.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
  options.owned_runtime = ({threadId}) => ({schema_version: "are.gateway-owned-runtime/v1",
    thread_id: threadId, disposition: "terminal-verified", turn_status: "completed",
    turn_ref: "a".repeat(64), host_observation_digest: "b".repeat(64),
    frontier_digest: "c".repeat(64), checkpoint_digest: "d".repeat(64), authority_effect: "granted"});
  const rejected = await request(ready, "/api/threads/thread-1/runtime");
  assert.equal(rejected.status, 409);
  assert.equal((await rejected.json()).reason, "windows-client.history-unavailable");
});

for (const reason of ["gateway.turn-history-unsettled", "gateway.turn-history-stale"]) {
  test(`hosted client withholds ${reason} without leaking the gateway diagnostic`, async (context) => {
    const unavailable = new AppServerRpcError("rpc.response-error", "private host status detail", {
      code: -32106, data: {reason_codes: [reason]}});
    const value = fixture({start_thread: () => ({thread: {id: "owned-thread"}}),
      history_error: new AppServerRpcError("rpc.response-error", "thread/turns/list: list_turns is not supported yet"),
      thread_read_with_turns_error: unavailable,
      thread_read: {thread: {id: "owned-thread", status: {type: "idle"}}}});
    const ready = await value.host.start();
    context.after(() => value.host.close());
    assert.equal((await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:history-fault"})})).status, 201);
    const response = await request(ready, "/api/threads/owned-thread/history");
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {ok: false, reason: "windows-client.history-unavailable"});
    const send = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "owned-thread", text: "hello", requestKey: `turn:${reason}`})});
    assert.equal(send.status, 409);
    assert.deepEqual(await send.json(), {ok: false, reason: "windows-client.history-unavailable"});
    assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  });
}

test("concurrent hosted runtime and history requests serialize audit-bearing reads for one thread", async (context) => {
  const unsupported = new AppServerRpcError("rpc.response-error", "thread/turns/list: list_turns is not supported yet");
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    runtime_error: unsupported, history_error: unsupported,
    thread_read: {thread: {id: "owned-thread", status: {type: "idle"}}},
    thread_read_with_turns: {thread: {id: "owned-thread", status: {type: "idle"}, turns: []}}});
  let releaseFirst;
  const held = new Promise(resolveHeld => { releaseFirst = resolveHeld; });
  let firstStarted;
  const started = new Promise(resolveStarted => { firstStarted = resolveStarted; });
  const originalRequest = value.rpc.request;
  let auditedReads = 0;
  value.rpc.request = async (method, params) => {
    if (method === "thread/read" && params.includeTurns === true) {
      auditedReads += 1;
      if (auditedReads === 1) { firstStarted(); await held; }
    }
    return originalRequest(method, params);
  };
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const runtime = request(ready, "/api/threads/owned-thread/runtime");
  let startTimeout;
  await Promise.race([started, new Promise((_, reject) => {
    startTimeout = setTimeout(() => {
      releaseFirst();
      reject(new Error(`audit read did not start: ${JSON.stringify(value.calls)}`));
    }, 2000);
  })]);
  clearTimeout(startTimeout);
  const history = request(ready, "/api/threads/owned-thread/history");
  await new Promise(resolveWait => setTimeout(resolveWait, 40));
  assert.equal(auditedReads, 1, "a second audit-bearing read was issued before the first response");
  releaseFirst();
  const [runtimeResponse, historyResponse] = await Promise.all([runtime, history]);
  assert.equal(runtimeResponse.status, 200);
  assert.equal(historyResponse.status, 200);
  assert.equal(auditedReads, 2);
});

test("hosted history retries only a typed stale active snapshot and preserves the audit queue", async (context) => {
  const unsupported = new AppServerRpcError("rpc.response-error", "thread/turns/list: list_turns is not supported yet");
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    history_error: unsupported,
    thread_read_with_turns: {thread: {id: "owned-thread", status: {type: "idle"}, turns: []}}});
  const originalRequest = value.rpc.request;
  let auditedReads = 0;
  value.rpc.request = async (method, params) => {
    if (method === "thread/read" && params.includeTurns === true && ++auditedReads === 1) {
      throw new AppServerRpcError("rpc.response-error", "thread/read: stale host snapshot", {
        code: -32105, data: {reason_codes: ["gateway.turn-history-stale"]}});
    }
    return originalRequest(method, params);
  };
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/threads/owned-thread/history");
  assert.equal(response.status, 200);
  assert.equal(auditedReads, 2);
});

test("hosted feedback is an authenticated owned-thread local operation, not a model turn", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const payload = {threadId: "thread-1", requestKey: "feedback:key:1",
    text: "Your last answer was too technical. From now on, use plain language."};
  assert.equal((await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify(payload)})).status, 409);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  const response = await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify(payload)});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).value.disposition, "applied");
  assert.deepEqual(value.calls.find(([method]) => method === "cyberalchemy/learning/submitFeedback")?.[1],
    {threadId: payload.threadId, feedbackId: payload.requestKey, text: payload.text});
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  for (const extra of [{approvalPolicy: "never"}, {requestKey: ""}, {text: ""}]) {
    const denied = await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify({...payload, ...extra})});
    assert.equal(denied.status, 400);
  }
});

test("hosted feedback preserves pending and rejects active-thread submissions", async (context) => {
  const pending = fixture({feedback_submit: () => ({ok: true, disposition: "pending", reason_codes: ["learning.feedback-unclassified"]})});
  const ready = await pending.host.start();
  context.after(() => pending.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: pending.repositoryRoot, requestKey: "thread:key"})});
  const payload = {threadId: "thread-1", requestKey: "feedback:key:2", text: "Please reconsider."};
  const response = await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify(payload)});
  assert.equal(response.status, 202, JSON.stringify(await response.clone().json()));
  assert.equal((await response.json()).value.disposition, "pending");
  const active = fixture({start_thread: () => ({thread: {id: "owned-thread"}}),
    thread_read: {thread: {id: "owned-thread", status: {type: "active"}}},
    runtime_page: {data: [{id: "turn-current", status: "inProgress"}], nextCursor: null}});
  const activeReady = await active.host.start();
  context.after(() => active.host.close());
  assert.equal((await request(activeReady, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: active.repositoryRoot, requestKey: "thread:active-feedback"})})).status, 201);
  const denied = await request(activeReady, "/api/feedback", {method: "POST", body: JSON.stringify({...payload, threadId: "owned-thread"})});
  assert.equal(denied.status, 409);
  assert.equal((await denied.json()).reason, "windows-client.turn-not-reconciled");
});
test("hosted pending feedback dismissal is owned, closed, and starts no model turn", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const payload = {threadId: "thread-1", requestKey: "feedback:key:review", text: "A task-only correction"};
  assert.equal((await request(ready, "/api/feedback/dismiss", {method: "POST", body: JSON.stringify(payload)})).status, 409);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  const dismissed = await request(ready, "/api/feedback/dismiss", {method: "POST", body: JSON.stringify(payload)});
  assert.equal(dismissed.status, 200);
  assert.equal((await dismissed.json()).value.disposition, "dismissed");
  assert.deepEqual(value.calls.find(([method]) => method === "cyberalchemy/learning/dismissPendingFeedback")?.[1],
    {threadId: payload.threadId, feedbackId: payload.requestKey, text: payload.text});
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  for (const extra of [{retentionScope: "current-product"}, {requestKey: ""}, {text: ""}]) {
    assert.equal((await request(ready, "/api/feedback/dismiss", {method: "POST",
      body: JSON.stringify({...payload, ...extra})})).status, 400);
  }
});

test("hosted pending feedback application is explicit, owned, closed, and starts no model turn", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const payload = {threadId: "thread-1", requestKey: "feedback:key:apply",
    text: "Please make the answer clearer.", episodeRef: "learning:episode-1",
    quote: "make the answer clearer", instruction: "Use plain language."};
  assert.equal((await request(ready, "/api/feedback/apply", {method: "POST", body: JSON.stringify(payload)})).status, 409);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  const applied = await request(ready, "/api/feedback/apply", {method: "POST", body: JSON.stringify(payload)});
  assert.equal(applied.status, 200);
  assert.equal((await applied.json()).value.retention_scope, "current-interaction");
  assert.deepEqual(value.calls.find(([method]) => method === "cyberalchemy/learning/applyPendingFeedback")?.[1],
    {threadId: payload.threadId, feedbackId: payload.requestKey, text: payload.text,
      episodeRef: payload.episodeRef, quote: payload.quote, instruction: payload.instruction});
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  for (const extra of [{retentionScope: "current-product"}, {requestKey: ""}, {quote: "not in text"}, {instruction: ""}]) {
    assert.equal((await request(ready, "/api/feedback/apply", {method: "POST",
      body: JSON.stringify({...payload, ...extra})})).status, 400);
  }
});

test("hosted revision selection binds the exact listed predecessor and remains read-only until application", async (context) => {
  const lessonId = `lesson:${"b".repeat(64)}`;
  const lessonDigest = "a".repeat(64);
  const value = fixture({feedback_lessons: ({threadId}) => ({ok: true,
    schema_version: "are.current-lessons-list/v1", thread_id: threadId,
    count: 1, items: [{lesson_id: lessonId, lesson_digest: lessonDigest,
      revision: 1, instruction: "Use plain language."}], authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await request(ready, "/api/feedback/lessons?threadId=thread-1")).status, 409);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  assert.equal((await request(ready, "/api/feedback/lessons?threadId=foreign")).status, 409);
  assert.equal((await request(ready, "/api/feedback/lessons?threadId=thread-1&extra=1")).status, 400);
  const listed = await request(ready, "/api/feedback/lessons?threadId=thread-1");
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).value.items[0].lesson_id, lessonId);
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  const payload = {threadId: "thread-1", requestKey: "feedback:key:revise",
    text: "Please include one example.", episodeRef: "learning:episode-2",
    quote: "include one example", instruction: "Include one concrete example.",
    revisesLessonId: lessonId, expectedLessonDigest: lessonDigest};
  assert.equal((await request(ready, "/api/feedback/apply", {method: "POST",
    body: JSON.stringify({...payload, expectedLessonDigest: undefined})})).status, 400);
  const applied = await request(ready, "/api/feedback/apply", {method: "POST", body: JSON.stringify(payload)});
  assert.equal(applied.status, 200);
  assert.deepEqual(value.calls.find(([method]) => method === "cyberalchemy/learning/applyPendingFeedback")?.[1],
    {threadId: payload.threadId, feedbackId: payload.requestKey, text: payload.text,
      episodeRef: payload.episodeRef, quote: payload.quote, instruction: payload.instruction,
      revisesLessonId: lessonId, expectedLessonDigest: lessonDigest});
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
});

test("hosted pending-review discovery is authenticated, owned, and read-only", async (context) => {
  const value = fixture({feedback_list: ({threadId}) => ({ok: true, schema_version: "are.pending-feedback-list/v1",
    thread_id: threadId, count: 1, items: [{feedback_id: "feedback:11111111-1111-4111-8111-111111111111",
      text_digest: "a".repeat(64)}], authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await fetch(`${ready.url}api/feedback/pending?threadId=thread-1`)).status, 401);
  assert.equal((await request(ready, "/api/feedback/pending?threadId=thread-1")).status, 409);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  assert.equal((await request(ready, "/api/feedback/pending?threadId=foreign")).status, 409);
  assert.equal((await request(ready, "/api/feedback/pending?threadId=thread-1&extra=1")).status, 400);
  const response = await request(ready, "/api/feedback/pending?threadId=thread-1");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).value.items.length, 1);
  assert.deepEqual(value.calls.find(([method]) => method === "cyberalchemy/learning/pendingFeedback/list")?.[1],
    {threadId: "thread-1"});
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
});

test("hosted pending-review discovery withholds unbounded wrapper output", async (context) => {
  const value = fixture({feedback_list: ({threadId}) => ({ok: true, schema_version: "are.pending-feedback-list/v1",
    thread_id: threadId, count: 1, items: [{feedback_id: "feedback:example", text_digest: "a".repeat(64),
      text: "private feedback"}], authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  const response = await request(ready, "/api/feedback/pending?threadId=thread-1");
  assert.equal(response.status, 409);
  const body = await response.text();
  assert.equal(body.includes("private feedback"), false);
});

test("hosted feedback is unavailable when the selected ARE profile does not provide it", async (context) => {
  const value = fixture({feedback_available: false});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await (await request(ready, "/api/state")).json()).value.feedback_available, false);
  await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})});
  const denied = await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify({threadId: "thread-1",
    requestKey: "feedback:key", text: "Your last answer was too technical. From now on, use plain language."})});
  assert.equal(denied.status, 409);
  assert.equal((await denied.json()).reason, "windows-client.feedback-unavailable");
  assert.equal(value.calls.some(([method]) => method === "cyberalchemy/learning/submitFeedback"), false);
});

test("browser cannot choose a weaker approval or sandbox policy", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  for (const override of [
    {approvalPolicy: "never"}, {sandbox: "dangerFullAccess"},
    {sandboxPolicy: {type: "dangerFullAccess"}}, {permissions: "unrestricted"},
  ]) {
    const response = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, ...override})});
    assert.equal(response.status, 400);
    assert.equal((await response.json()).reason, "windows-client.thread-policy-client-override-forbidden");
  }
  assert.equal(value.calls.some(([method]) => method === "thread/start"), false);
});

test("trusted caller cannot select an unadmitted writable hosted sandbox", () => {
  assert.throws(() => fixture({host_options: {thread_sandbox: "workspaceWrite"}}), /requires a read-only sandbox/);
});

test("hosted MCP relay catalog requires one connected server and named tool", () => {
  const present = {data: [{name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}}], nextCursor: null};
  assert.deepEqual(hostedMcpRelayCatalogPosture(present), {ok: true});
  for (const status of [{data: [], nextCursor: null},
    {...present, nextCursor: "more"},
    {...present, data: [...present.data, ...present.data]},
    {...present, data: [{...present.data[0], runtimeStatus: "failed"}]},
    {...present, data: [{...present.data[0], toolsError: "discovery failed"}]},
    {...present, data: [{...present.data[0], tools: {}}]},
    {...present, data: [{...present.data[0], tools: {are_hook_observe: {name: "other"}}}]}]) {
    assert.deepEqual(hostedMcpRelayCatalogPosture(status), {ok: false});
  }
});

test("restricted MCP catalog requires an exact empty or relay-only snapshot", () => {
  const empty = {data: [], nextCursor: null};
  const relay = {name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}};
  assert.deepEqual(hostedRestrictedMcpCatalogPosture(empty), {ok: true});
  assert.deepEqual(hostedRestrictedMcpCatalogPosture({data: [relay], nextCursor: null},
    {requireRelay: true}), {ok: true});
  for (const invalid of [{data: [relay], nextCursor: null}, {...empty, nextCursor: "more"},
    {data: [{name: "unapproved", runtimeStatus: "connected", tools: {}}], nextCursor: null}]) {
    assert.deepEqual(hostedRestrictedMcpCatalogPosture(invalid), {ok: false});
  }
  for (const invalid of [empty, {data: [relay, relay], nextCursor: null},
    {data: [{...relay, tools: {...relay.tools, extra: {name: "extra"}}}], nextCursor: null},
    {data: [{...relay, runtimeStatus: "failed"}], nextCursor: null}]) {
    assert.deepEqual(hostedRestrictedMcpCatalogPosture(invalid, {requireRelay: true}), {ok: false});
  }
});

test("restricted hosted turn rejects MCP drift before intent or turn dispatch", async context => {
  const relay = {name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}};
  for (const [requireRelay, catalog, expected] of [
    [false, {data: [], nextCursor: null}, 202],
    [false, {data: [relay], nextCursor: null}, 409],
    [true, {data: [relay], nextCursor: null}, 202],
    [true, {data: [{...relay, tools: {...relay.tools, extra: {name: "extra"}}}], nextCursor: null}, 409],
  ]) {
    const value = fixture({host_options: {require_restricted_mcp_catalog: true,
      require_mcp_hook_relay: requireRelay,
      ...(requireRelay ? {hook_profile_source_path: HOOK_SOURCE} : {})}, mcp_status: catalog});
    context.after(() => value.host.close());
    const ready = await value.host.start();
    const thread = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, requestKey: `thread:restricted:${requireRelay}:${expected}`})});
    assert.equal(thread.status, 201);
    const turn = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", text: "hello",
        requestKey: `turn:restricted:${requireRelay}:${expected}`})});
    assert.equal(turn.status, expected);
    if (expected === 409) assert.equal((await turn.json()).reason,
      "windows-client.restricted-mcp-catalog-unavailable");
    assert.equal(value.calls.filter(([method]) => method === "turn/start").length,
      expected === 202 ? 1 : 0);
  }
});

test("opt-in hosted turn gate checks relay catalog before recording or starting a turn", async (context) => {
  const present = {data: [{name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}}], nextCursor: null};
  for (const [mcpStatus, mcpStatusError, expected] of [[{data: [], nextCursor: null}, null, 409],
    [null, new Error("status unavailable"), 409], [present, null, 202]]) {
    const value = fixture({host_options: {require_mcp_hook_relay: true,
      hook_profile_source_path: HOOK_SOURCE},
      mcp_status: mcpStatus, mcp_status_error: mcpStatusError});
    context.after(() => value.host.close());
    const ready = await value.host.start();
    const thread = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:mcp"})});
    assert.equal(thread.status, 201);
    const turn = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:mcp"})});
    assert.equal(turn.status, expected);
    if (expected === 409) assert.equal((await turn.json()).reason, "windows-client.mcp-hook-relay-unavailable");
    assert.equal(value.calls.filter(([method]) => method === "turn/start").length, expected === 202 ? 1 : 0);
    assert.deepEqual(value.calls.find(([method]) => method === "mcpServerStatus/list")?.[1],
      {threadId: "thread-1", detail: "toolsAndAuthOnly", limit: 100});
    const snapshot = (await (await request(ready, "/api/state")).json()).value;
    assert.equal(snapshot.hook_relay.required, true);
    assert.equal(snapshot.hook_relay.last_check.thread_id, "thread-1");
    assert.equal(snapshot.hook_relay.last_check.status,
      expected === 202 ? "trusted" : mcpStatusError ? "unavailable" : "not-ready");
    assert.equal(Number.isSafeInteger(snapshot.hook_relay.last_check.checked_at_unix_ms), true);
  }
});

test("hosted turn rejects missing or untrusted native hook state before intent", async context => {
  const present = {data: [{name: "are_hosted_hook_relay", runtimeStatus: "connected",
    toolsError: null, tools: {are_hook_observe: {name: "are_hook_observe"}}}], nextCursor: null};
  const trusted = trustedHooks();
  for (const [hooksList, hooksError] of [
    [{data: [], nextCursor: null}, null],
    [{data: [{hooks: trusted.data[0].hooks.map((hook, index) => index === 0
      ? {...hook, trustStatus: "untrusted"} : hook)}], nextCursor: null}, null],
    [null, new Error("hooks/list unavailable")],
  ]) {
    const value = fixture({host_options: {require_mcp_hook_relay: true,
      hook_profile_source_path: HOOK_SOURCE}, mcp_status: present,
    hooks_list: hooksList, hooks_list_error: hooksError});
    context.after(() => value.host.close());
    const ready = await value.host.start();
    const thread = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:hook-trust"})});
    assert.equal(thread.status, 201);
    const turn = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:hook-trust"})});
    assert.equal(turn.status, 409);
    assert.equal((await turn.json()).reason, "windows-client.mcp-hook-trust-unavailable");
    assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
    const state = (await (await request(ready, "/api/state")).json()).value;
    assert.equal(state.hook_relay.last_check.status,
      hooksError ? "hook-trust-unavailable" : "hook-not-ready");
    assert.deepEqual(value.calls.find(([method]) => method === "hooks/list")?.[1],
      {cwds: [value.effectRoot]});
  }
});

test("trusted host may select a read-only fixture without browser policy input", async (context) => {
  const value = fixture({host_options: {thread_approval_policy: "never", thread_sandbox: "read-only"}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:read-only"})});
  assert.equal(response.status, 201);
  assert.equal(value.calls.find(([method]) => method === "thread/start")?.[1]?.approvalPolicy, "never");
  assert.equal(value.calls.find(([method]) => method === "thread/start")?.[1]?.sandbox, "read-only");
  const turn = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "thread-1", text: "hello", requestKey: "turn:read-only"})});
  assert.equal(turn.status, 202);
  const turnParams = value.calls.find(([method]) => method === "turn/start")?.[1];
  assert.equal(turnParams.approvalPolicy, "never");
  assert.deepEqual(turnParams.sandboxPolicy, {type: "readOnly"});
});

test("hosted steering binds a client-accepted exact active turn and stable request key", async (context) => {
  const ownedThreads = [];
  let checkpoint = null;
  let clears = 0;
  const observationToken = "observation-token-0123456789abcdef0123456789abcdef";
  const value = fixture({host_options: {hosted_input_attestation_available: true,
    observation_token: observationToken},
    recovery_state: {thread_ids: () => [...ownedThreads], record_thread: id => { ownedThreads.push(id); },
      pending_steer_intent: () => checkpoint,
      record_steer_intent: entry => { checkpoint = entry; },
      clear_steer_intent: entry => { assert.deepEqual(entry, checkpoint); checkpoint = null; clears += 1; }},
    steer_outcome: () => ({schema_version: "are.gateway-steer-outcome/v1",
      disposition: "settled-accepted", authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({
    cwd: value.repositoryRoot, requestKey: "thread:steer"})})).status, 201);
  assert.equal((await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", text: "First task", requestKey: "turn:first"})})).status, 202);
  value.options.thread_read = {thread: {id: "thread-1", status: {type: "active"}}};
  value.options.runtime_page = {data: [{id: "turn-1", status: "inProgress"}], nextCursor: null};
  const steer = (overrides = {}) => request(ready, "/api/turns/steer", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", expectedTurnId: "turn-1", text: "Correct the scope",
    requestKey: "steer:one", ...overrides})});
  assert.equal((await (await steer({expectedTurnId: "turn-other"})).json()).reason,
    "windows-client.steer-turn-not-accepted");
  assert.equal((await steer({approvalPolicy: "never"})).status, 400);
  assert.equal(value.calls.some(([method]) => method === "turn/steer"), false);
  const accepted = await steer();
  assert.equal(accepted.status, 202);
  assert.deepEqual(await accepted.json(), {ok: true, value: {turnId: "turn-1"}});
  assert.deepEqual(value.calls.find(([method]) => method === "turn/steer")?.slice(1), [
    {threadId: "thread-1", expectedTurnId: "turn-1", input: [{type: "text", text: "Correct the scope"}]},
    {idempotency_key: "steer:one", hosted_input: true},
  ]);
  assert.equal(checkpoint?.request_key, "steer:one", "success must retain the host-owned key until ack");
  assert.equal(JSON.stringify(checkpoint).includes("Correct the scope"), false);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_steer.request_key, "steer:one");
  const observedPending = await readHostedRejoinObservation({url: `${ready.url}api/observation/rejoin`,
    token: observationToken, refs: [`backend-thread:${digestValue("thread-1")}`]});
  assert.equal(observedPending.rows[0].pending_steer_checkpoint, true);
  assert.equal((await steer({requestKey: "steer:another"})).status, 409);
  assert.equal((await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", text: "Next task", requestKey: "turn:next"})})).status, 409);
  value.options.runtime_page = {data: [{id: "turn-1", status: "completed"}], nextCursor: null};
  value.options.thread_read = {thread: {id: "thread-1", status: {type: "idle"}}};
  const compact = () => request(ready, "/api/threads/compact", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", requestKey: "compact:after-steer"})});
  const heldCompaction = await compact();
  assert.equal(heldCompaction.status, 409);
  assert.equal((await heldCompaction.json()).reason, "windows-client.pending-steer-recovery-required");
  assert.equal(value.calls.some(([method]) => method === "thread/compact/start"), false,
    "an idle host turn does not release an unacknowledged steer checkpoint");
  const feedbackText = "Your last answer was too technical. From now on, use plain language.";
  const fencedWrites = [
    ["/api/threads", {cwd: value.repositoryRoot, requestKey: "thread:while-steer"}],
    ["/api/feedback", {threadId: "thread-1", requestKey: "feedback:while-steer", text: feedbackText}],
    ["/api/feedback/dismiss", {threadId: "thread-1", requestKey: "feedback:dismiss-while-steer", text: "A task-only correction"}],
    ["/api/feedback/apply", {threadId: "thread-1", requestKey: "feedback:apply-while-steer",
      text: "Please make the answer clearer.", episodeRef: "learning:episode-1",
      quote: "make the answer clearer", instruction: "Use plain language."}],
  ];
  for (const [path, body] of fencedWrites) {
    const held = await request(ready, path, {method: "POST", body: JSON.stringify(body)});
    assert.equal(held.status, 409, path);
    assert.equal((await held.json()).reason, "windows-client.pending-steer-recovery-required", path);
  }
  assert.equal(value.calls.filter(([method]) => ["thread/start", "cyberalchemy/learning/submitFeedback",
    "cyberalchemy/learning/dismissPendingFeedback", "cyberalchemy/learning/applyPendingFeedback"].includes(method)).length,
  1, "only the original thread creation may reach a fenced backend write");
  const exactKey = {threadId: "thread-1", expectedTurnId: "turn-1", requestKey: "steer:one"};
  assert.equal((await request(ready, "/api/turns/steer/status", {method: "POST", body: JSON.stringify(exactKey)})).status, 200);
  assert.equal(checkpoint?.request_key, "steer:one", "read-only status cannot clear the key");
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify(exactKey)})).status, 200);
  assert.equal(checkpoint, null);
  assert.equal(clears, 1);
  assert.equal((await compact()).status, 202,
    "terminal exact-key acknowledgement reopens hosted compaction");
  assert.equal(value.calls.filter(([method]) => method === "thread/compact/start").length, 1);
  assert.equal((await request(ready, "/api/feedback", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", requestKey: "feedback:after-steer", text: feedbackText})})).status, 200,
  "terminal exact-key acknowledgement reopens a feedback write");
  const observedCleared = await readHostedRejoinObservation({url: `${ready.url}api/observation/rejoin`,
    token: observationToken, refs: [`backend-thread:${digestValue("thread-1")}`]});
  assert.equal(observedCleared.rows[0].pending_steer_checkpoint, false);
  assert.equal((await (await steer({requestKey: "steer:late"})).json()).reason,
    "windows-client.turn-not-current");
  assert.equal(value.calls.filter(([method]) => method === "turn/steer").length, 1);
});

test("hosted steering requires the restricted MCP catalog before model entry", async (context) => {
  const value = fixture({host_options: {require_restricted_mcp_catalog: true}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({
    cwd: value.repositoryRoot, requestKey: "thread:steer-catalog"})})).status, 201);
  assert.equal((await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", text: "First task", requestKey: "turn:first"})})).status, 202);
  value.options.thread_read = {thread: {id: "thread-1", status: {type: "active"}}};
  value.options.runtime_page = {data: [{id: "turn-1", status: "inProgress"}], nextCursor: null};
  value.options.mcp_status_error = new Error("catalog unavailable");
  const blocked = await request(ready, "/api/turns/steer", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", expectedTurnId: "turn-1", text: "Correct the scope", requestKey: "steer:catalog"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.restricted-mcp-catalog-unavailable");
  assert.equal(value.calls.some(([method]) => method === "turn/steer"), false);
});

test("hosted steering status is a bounded owned-thread read, including after the turn ends", async context => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    steer_outcome: params => {
      assert.deepEqual(params, {threadId: "owned-thread", expectedTurnId: "turn-old", requestKey: "steer:old"});
      return {schema_version: "are.gateway-steer-outcome/v1",
        disposition: "settled-accepted", authority_effect: "none"};
    }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const post = (body) => request(ready, "/api/turns/steer/status", {method: "POST", body: JSON.stringify(body)});
  const input = {threadId: "owned-thread", expectedTurnId: "turn-old", requestKey: "steer:old"};
  assert.equal((await post({...input, text: "private"})).status, 400);
  assert.equal((await post({...input, threadId: "external-thread"})).status, 409);
  assert.equal(value.calls.some(([method]) => method === GATEWAY_STEER_OUTCOME_GET), false);
  const result = await post(input);
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).value, {schema_version: "are.gateway-steer-outcome/v1",
    disposition: "settled-accepted", authority_effect: "none"});
  assert.equal(value.calls.some(([method]) => method === "thread/read"), false,
    "status must not require a currently active host turn");
});

test("recovered steer key blocks new sends until exact terminal acknowledgement", async context => {
  const pending = {schema_version: "are.codex-client-pending-steer/v1", thread_id: "owned-thread",
    turn_id: "turn-old", request_key: "steer:00000000-0000-4000-8000-000000000001",
    text_digest: "a".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "owned-thread",
    turn_id: "turn-old", request_key: "turn:old", text_digest: "b".repeat(64),
    accepted_at: "2026-10-01T00:00:00.000Z"};
  let checkpoint = pending;
  let disposition = "unrecorded";
  let clears = 0;
  const value = fixture({host_options: {observation_token: "observation-token-0123456789abcdef0123456789abcdef"},
    recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_steer_intent: () => checkpoint, accepted_turn_results: () => [accepted],
    last_turn_result: () => accepted, clear_steer_intent: entry => {
      assert.deepEqual(entry, pending); checkpoint = null; clears += 1;
    }}, steer_outcome: () => ({schema_version: "are.gateway-steer-outcome/v1",
    disposition, authority_effect: "none"})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const input = {threadId: "owned-thread", expectedTurnId: "turn-old", requestKey: pending.request_key};
  assert.deepEqual((await (await request(ready, "/api/state")).json()).value.pending_steer, pending);
  const observed = await readHostedRejoinObservation({url: `${ready.url}api/observation/rejoin`,
    token: "observation-token-0123456789abcdef0123456789abcdef",
    refs: [`backend-thread:${digestValue("owned-thread")}`]});
  assert.equal(observed.rows[0].pending_steer_checkpoint, true);
  assert.equal((await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "New task", requestKey: "turn:new"})})).status, 409);
  assert.equal((await request(ready, "/api/turns/steer", {method: "POST", body: JSON.stringify({
    ...input, text: "Different guidance"})})).status, 409);
  for (const [path, body] of [
    ["/api/threads", {cwd: value.repositoryRoot, requestKey: "thread:recovered-steer"}],
    ["/api/feedback", {threadId: "owned-thread", requestKey: "feedback:recovered-steer",
      text: "Your last answer was too technical. From now on, use plain language."}],
    ["/api/feedback/dismiss", {threadId: "owned-thread", requestKey: "feedback:dismiss-recovered-steer",
      text: "A task-only correction"}],
    ["/api/feedback/apply", {threadId: "owned-thread", requestKey: "feedback:apply-recovered-steer",
      text: "Please make the answer clearer.", episodeRef: "learning:episode-1",
      quote: "make the answer clearer", instruction: "Use plain language."}],
  ]) {
    const held = await request(ready, path, {method: "POST", body: JSON.stringify(body)});
    assert.equal(held.status, 409, path);
    assert.equal((await held.json()).reason, "windows-client.pending-steer-recovery-required", path);
  }
  assert.equal(value.calls.some(([method]) => ["thread/start", "cyberalchemy/learning/submitFeedback",
    "cyberalchemy/learning/dismissPendingFeedback", "cyberalchemy/learning/applyPendingFeedback"].includes(method)), false);
  assert.equal((await request(ready, "/api/turns/steer/status", {method: "POST", body: JSON.stringify(input)})).status, 200);
  assert.equal(checkpoint, pending, "status reads do not mutate the host checkpoint");
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify(input)})).status, 409);
  assert.equal(clears, 0);
  disposition = "settled-accepted";
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify({
    ...input, requestKey: "steer:other"})})).status, 409);
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify(input)})).status, 200);
  assert.equal(clears, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_steer, null);
  const cleared = await readHostedRejoinObservation({url: `${ready.url}api/observation/rejoin`,
    token: "observation-token-0123456789abcdef0123456789abcdef",
    refs: [`backend-thread:${digestValue("owned-thread")}`]});
  assert.equal(cleared.rows[0].pending_steer_checkpoint, false);
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify(input)})).status, 200,
    "a lost acknowledgement response is safe to retry without a second clear");
  assert.equal(clears, 1);
  assert.equal(value.calls.some(([method]) => method === "turn/steer" || method === "turn/start"), false);
});

test("private recovery restores a steer key across hosted process reconstruction", async context => {
  const root = mkdtempSync(join(process.platform === "win32" ? process.env.LOCALAPPDATA : tmpdir(),
    "are-steer-host-restart-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const path = join(root, "client-state.json");
  const receipt = resumed => ({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
    consumer_id: "codex:human-chat", resumed,
    continuity: {resume_token: "gateway-steer-session",
      resume_token_digest: digestValue("gateway-steer-session")}});
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt(false));
  first.record_thread("owned-thread");
  const turn = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "owned-thread",
    request_key: "turn:one", text_digest: "a".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  first.record_turn_intent(turn);
  first.settle_turn_intent(turn, "turn-one");
  const steer = {schema_version: "are.codex-client-pending-steer/v1", thread_id: "owned-thread",
    turn_id: "turn-one", request_key: "steer:00000000-0000-4000-8000-000000000001",
    text_digest: "b".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  first.record_steer_intent(steer);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  context.after(() => second.close());
  second.bind_gateway(receipt(true));
  const value = fixture({repository_root: root, recovery_state: second,
    steer_outcome: () => ({schema_version: "are.gateway-steer-outcome/v1",
      disposition: "settled-accepted", authority_effect: "none"})});
  context.after(() => value.host.close());
  const ready = await value.host.start();
  assert.deepEqual((await (await request(ready, "/api/state")).json()).value.pending_steer, steer);
  const input = {threadId: "owned-thread", expectedTurnId: "turn-one", requestKey: steer.request_key};
  assert.equal((await request(ready, "/api/turns/steer/ack", {method: "POST", body: JSON.stringify(input)})).status, 200);
  await value.host.close();
  second.close();
  const third = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  third.bind_gateway(receipt(true));
  assert.equal(third.pending_steer_intent(), null);
  third.close();
});

test("lost gateway steer response retains the exact host key across reconstruction without redispatch", async context => {
  const root = mkdtempSync(join(process.platform === "win32" ? process.env.LOCALAPPDATA : tmpdir(),
    "are-steer-rpc-loss-"));
  let first = null;
  let second = null;
  let recoveredState = null;
  let firstHostClosed = false;
  let firstStateClosed = false;
  context.after(async () => {
    await second?.host.close();
    recoveredState?.close();
    if (!firstHostClosed) await first?.host.close();
    if (!firstStateClosed) firstState.close();
    rmSync(root, {recursive: true, force: true});
  });
  const path = join(root, "client-state.json");
  const receipt = resumed => ({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
    consumer_id: "codex:human-chat", resumed,
    continuity: {resume_token: "gateway-steer-rpc-loss",
      resume_token_digest: digestValue("gateway-steer-rpc-loss")}});
  const firstState = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  firstState.bind_gateway(receipt(false));
  const requestKey = "steer:00000000-0000-4000-8000-000000000002";
  first = fixture({repository_root: root, recovery_state: firstState,
    turn_steer: () => { throw new Error("gateway response lost after dispatch"); }});
  const readyFirst = await first.host.start();
  assert.equal((await request(readyFirst, "/api/threads", {method: "POST", body: JSON.stringify({
    cwd: root, requestKey: "thread:one"})})).status, 201);
  assert.equal((await request(readyFirst, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", requestKey: "turn:one", text: "First task"})})).status, 202);
  first.options.thread_read = {thread: {id: "thread-1", status: {type: "active"}}};
  first.options.runtime_page = {data: [{id: "turn-1", status: "inProgress"}], nextCursor: null};
  const steerInput = {threadId: "thread-1", expectedTurnId: "turn-1",
    requestKey, text: "Correct the existing turn, once"};
  const failed = await request(readyFirst, "/api/turns/steer", {method: "POST", body: JSON.stringify(steerInput)});
  assert.equal(failed.status, 500);
  assert.equal((await failed.json()).reason, "windows-client.request-failed");
  const pending = firstState.pending_steer_intent();
  assert.equal(pending.request_key, requestKey);
  assert.equal(JSON.stringify(pending).includes(steerInput.text), false);
  assert.equal(first.calls.filter(([method]) => method === "turn/steer").length, 1);
  await first.host.close();
  firstHostClosed = true;
  firstState.close();
  firstStateClosed = true;

  recoveredState = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  recoveredState.bind_gateway(receipt(true));
  let disposition = "outcome-unknown";
  second = fixture({repository_root: root, recovery_state: recoveredState,
    steer_outcome: () => ({schema_version: "are.gateway-steer-outcome/v1",
      disposition, authority_effect: "none"})});
  const readySecond = await second.host.start();
  const exactKey = {threadId: "thread-1", expectedTurnId: "turn-1", requestKey};
  assert.deepEqual((await (await request(readySecond, "/api/state")).json()).value.pending_steer, pending);
  assert.equal((await request(readySecond, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "thread-1", requestKey: "turn:next", text: "Next task"})})).status, 409);
  assert.equal((await request(readySecond, "/api/turns/steer", {method: "POST",
    body: JSON.stringify(steerInput)})).status, 409);
  assert.equal((await (await request(readySecond, "/api/turns/steer/status", {method: "POST",
    body: JSON.stringify(exactKey)})).json()).value.disposition, "outcome-unknown");
  assert.equal((await request(readySecond, "/api/turns/steer/ack", {method: "POST",
    body: JSON.stringify(exactKey)})).status, 409);
  assert.deepEqual(recoveredState.pending_steer_intent(), pending);
  disposition = "settled-accepted";
  assert.equal((await request(readySecond, "/api/turns/steer/ack", {method: "POST",
    body: JSON.stringify(exactKey)})).status, 200);
  assert.equal(recoveredState.pending_steer_intent(), null);
  assert.equal(second.calls.some(([method]) => method === "turn/steer" || method === "turn/start"), false);
});

test("interrupt is limited to an owned exact active turn", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    thread_read: {thread: {id: "owned-thread", status: {type: "active"}}},
    runtime_page: {data: [{id: "turn-current", status: "inProgress"}], nextCursor: null}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const post = async (threadId, turnId) => request(ready, "/api/turns/interrupt", {method: "POST", body: JSON.stringify({threadId, turnId})});
  const external = await post("desktop-task-id", "turn-current");
  assert.equal(external.status, 409);
  assert.equal((await external.json()).reason, "windows-client.thread-not-loaded");
  const wrongTurn = await post("owned-thread", "turn-other");
  assert.equal(wrongTurn.status, 409);
  assert.equal((await wrongTurn.json()).reason, "windows-client.turn-not-current");
  assert.equal(value.calls.some(([method]) => method === "turn/interrupt"), false);
  const exact = await post("owned-thread", "turn-current");
  assert.equal(exact.status, 202);
  assert.deepEqual(value.calls.find(([method]) => method === "turn/interrupt")?.[1],
    {threadId: "owned-thread", turnId: "turn-current"});
});

test("interrupt refuses an owned thread with no currently verified active turn", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/turns/interrupt", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", turnId: "turn-old"})});
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, "windows-client.turn-not-current");
  assert.equal(value.calls.some(([method]) => method === "turn/interrupt"), false);
});

test("host atomically replaces the pending intent with an accepted-turn receipt", async (context) => {
  let intent = null;
  let accepted = null;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: (entry) => { intent = entry; },
    last_turn_result: () => accepted,
    settle_turn_intent: (entry, turnId) => { assert.deepEqual(entry, intent); intent = null;
      accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: entry.thread_id,
        request_key: entry.request_key, text_digest: entry.text_digest, turn_id: turnId, accepted_at: new Date().toISOString()};
      return accepted; }},
    turn_start: () => { assert.equal(intent.thread_id, "owned-thread"); assert.equal(JSON.stringify(intent).includes("private message"), false); return {turn: {id: "turn-1"}}; }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const result = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "private message", requestKey: "turn:stable"})});
  assert.equal(result.status, 202);
  assert.equal(intent, null);
  const state = (await (await request(ready, "/api/state")).json()).value;
  assert.equal(state.pending_turn, null);
  assert.equal(state.last_turn_result.turn_id, "turn-1");
  assert.equal(JSON.stringify(state.last_turn_result).includes("private message"), false);
});

test("host settles a bound pending turn from verified gateway receipt without redispatch", async (context) => {
  const intent = {schema_version: "are.codex-client-pending-turn/v2", thread_id: "owned-thread",
    request_key: "turn:stable", text_digest: "a".repeat(64), request_binding_digest: "b".repeat(64),
    created_at: "2026-09-27T00:00:00.000Z"};
  const material = {schema_version: "are.gateway-turn-recovery/v1", authority_effect: "none",
    request_key: intent.request_key, request_digest: intent.request_binding_digest,
    thread_id: intent.thread_id, turn_id: "turn-recovered", turn_status: "completed",
    host_observation_digest: "c".repeat(64), semantic_receipt_digest: "d".repeat(64)};
  const gatewayRecovery = {...material, receipt_digest: digestValue(material)};
  let pending = intent;
  let result = null;
  const value = fixture({recovery_state: {thread_ids: () => [intent.thread_id], record_thread: () => {},
    pending_turn_intent: () => pending, last_turn_result: () => result,
    settle_recovered_turn_intent: (entry, recovered) => {
      assert.deepEqual(entry, pending);
      assert.deepEqual(recovered, gatewayRecovery);
      pending = null;
      result = {schema_version: "are.codex-client-recovered-turn/v1", thread_id: entry.thread_id,
        request_key: entry.request_key, text_digest: entry.text_digest, turn_id: recovered.turn_id,
        gateway_recovery: recovered, accepted_at: new Date().toISOString()};
      return result;
    }}, recovery_response: {recovery: gatewayRecovery},
  confirm_recovery: ({receipt}) => { assert.deepEqual(receipt, gatewayRecovery);
    return {confirmed: true, recovery_digest: receipt.receipt_digest}; }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const state = (await (await request(ready, "/api/state")).json()).value;
  assert.equal(state.pending_turn, null);
  assert.equal(state.last_turn_result.schema_version, "are.codex-client-recovered-turn/v1");
  assert.equal(state.recovery_confirmation_required, false);
  assert.equal(value.calls.some(([method, params]) => method === "thread/read" && params.includeTurns === true), true);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
  const replay = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: intent.thread_id,
    requestKey: intent.request_key, text: "not matching digest"})});
  assert.equal(replay.status, 409);
});

test("host retains a bound pending turn when gateway recovery proof is missing", async (context) => {
  const pending = {schema_version: "are.codex-client-pending-turn/v2", thread_id: "owned-thread",
    request_key: "turn:stable", text_digest: "a".repeat(64), request_binding_digest: "b".repeat(64),
    created_at: "2026-09-27T00:00:00.000Z"};
  const value = fixture({recovery_state: {thread_ids: () => [pending.thread_id], record_thread: () => {},
    pending_turn_intent: () => pending}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.deepEqual((await (await request(ready, "/api/state")).json()).value.pending_turn, pending);
  const blocked = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: pending.thread_id,
    requestKey: pending.request_key, text: "anything"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.pending-turn-recovery-required");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
});

test("durable recovered receipt retries gateway confirmation after restart and blocks new sends until confirmed", async (context) => {
  const material = {schema_version: "are.gateway-turn-recovery/v1", authority_effect: "none",
    request_key: "turn:stable", request_digest: "b".repeat(64), thread_id: "owned-thread",
    turn_id: "turn-recovered", turn_status: "completed", host_observation_digest: "c".repeat(64),
    semantic_receipt_digest: "d".repeat(64)};
  const gatewayRecovery = {...material, receipt_digest: digestValue(material)};
  const recovered = {schema_version: "are.codex-client-recovered-turn/v1", thread_id: "owned-thread",
    request_key: "turn:stable", text_digest: "a".repeat(64), turn_id: "turn-recovered",
    accepted_at: "2026-09-27T00:00:00.000Z", gateway_recovery: gatewayRecovery};
  let allowConfirmation = false;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    last_turn_result: () => recovered},
  confirm_recovery: () => { if (!allowConfirmation) throw new Error("gateway unavailable");
    return {confirmed: true, recovery_digest: gatewayRecovery.receipt_digest}; }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  assert.equal((await (await request(ready, "/api/state")).json()).value.recovery_confirmation_required, true);
  const blocked = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", requestKey: "turn:new", text: "new"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.recovery-confirmation-required");
  allowConfirmation = true;
  const confirmation = await request(ready, "/api/turns/recover", {method: "POST", body: "{}"});
  assert.equal(confirmation.status, 200);
  assert.equal((await (await request(ready, "/api/state")).json()).value.recovery_confirmation_required, false);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
});

test("a definite ARE recovery refusal clears only the matching pending intent", async (context) => {
  let intent = null;
  let rejected = 0;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: (entry) => { intent = entry; },
    reject_turn_intent: (entry, reason) => { assert.deepEqual(entry, intent);
      assert.equal(reason, "reasoning.prior-turn-unsettled"); rejected += 1; intent = null; }},
  turn_start: () => { throw new AppServerRpcError("rpc.response-error", "turn/start: ARE prior turn is not settled",
    {code: -32082, data: {reason_codes: ["reasoning.prior-turn-unsettled"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const first = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "Research next step", requestKey: "turn:new"})});
  assert.equal(first.status, 409);
  assert.equal((await first.json()).reason, "windows-client.reasoning-recovery-unverified");
  assert.equal(rejected, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn, null);
});

test("managed compaction is an owned idle-thread operation with a stable request key", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const payload = {threadId: "thread-1", requestKey: "compact:key:1"};
  assert.equal((await request(ready, "/api/threads/compact", {method: "POST",
    body: JSON.stringify(payload)})).status, 409);
  assert.equal((await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "thread:key"})})).status, 201);
  for (const extra of [{requestKey: " "}, {requestKey: " compact:key"}, {approvalPolicy: "never"}]) {
    assert.equal((await request(ready, "/api/threads/compact", {method: "POST",
      body: JSON.stringify({...payload, ...extra})})).status, 400);
  }
  const accepted = await request(ready, "/api/threads/compact", {method: "POST",
    body: JSON.stringify(payload)});
  assert.equal(accepted.status, 202, JSON.stringify(await accepted.clone().json()));
  assert.deepEqual((await accepted.json()).value, {});
  assert.deepEqual(value.calls.find(([method]) => method === "thread/compact/start"),
    ["thread/compact/start", {threadId: "thread-1"}, {idempotency_key: "compact:key:1"}]);
});

test("managed compaction obeys the model-entry pause and active-turn gate", async (context) => {
  const paused = fixture({host_options: {turn_execution_blocked_reason: "windows-client.hook-boundary-unverified"}});
  const pausedReady = await paused.host.start();
  context.after(() => paused.host.close());
  const denied = await request(pausedReady, "/api/threads/compact", {method: "POST",
    body: JSON.stringify({threadId: "thread-1", requestKey: "compact:paused"})});
  assert.equal(denied.status, 409);
  assert.equal((await denied.json()).reason, "windows-client.hook-boundary-unverified");
  assert.equal(paused.calls.some(([method]) => method === "thread/compact/start"), false);

  const active = fixture({start_thread: () => ({thread: {id: "owned-thread"}}),
    thread_read: {thread: {id: "owned-thread", status: {type: "active"}}},
    runtime_page: {data: [{id: "turn-current", status: "inProgress"}], nextCursor: null}});
  const activeReady = await active.host.start();
  context.after(() => active.host.close());
  assert.equal((await request(activeReady, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: active.repositoryRoot, requestKey: "thread:active-compaction"})})).status, 201);
  const blocked = await request(activeReady, "/api/threads/compact", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", requestKey: "compact:active"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.turn-not-reconciled");
  assert.equal(active.calls.some(([method]) => method === "thread/compact/start"), false);
});

test("compaction conflict clears only the definite later turn refusal", async (context) => {
  let intent = null;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: entry => { intent = entry; },
    reject_turn_intent: (entry, reason) => { assert.deepEqual(entry, intent);
      assert.equal(reason, "gateway.compaction-unsettled"); intent = null; }},
  turn_start: () => { throw new AppServerRpcError("rpc.response-error", "private host diagnostic", {
    code: -32093, data: {reason_codes: ["gateway.compaction-unsettled"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const blocked = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "Continue", requestKey: "turn:after-compaction"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.compaction-unsettled");
  assert.equal(intent, null);
});

test("a definite ARE preflight refusal clears the exact intent and exposes only bounded diagnostics", async context => {
  let intent = null;
  let rejected = 0;
  let attempts = 0;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: entry => { intent = entry; },
    reject_turn_intent: (entry, reason) => { assert.deepEqual(entry, intent);
      assert.equal(reason, "reasoning.preflight-failed"); rejected += 1; intent = null; }},
  turn_start: () => { if (++attempts === 1) throw new AppServerRpcError("rpc.response-error",
    "turn/start: ARE preflight failed: PRIVATE_SOURCE", {code: -32070,
      message: "ARE preflight failed", data: {ok: false, authority_effect: "none",
        reason_codes: ["learning.request-recorded-dispatch-not-retried"],
        residue: ["PRIVATE_SOURCE"]}});
    return {turn: {id: "turn-after-preflight", status: "inProgress"}}; }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const first = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "Continue", requestKey: "turn:preflight-failure"})});
  assert.equal(first.status, 409);
  const response = await first.json();
  assert.deepEqual(response, {ok: false, reason: "windows-client.are-preflight-unavailable",
    value: {reason_codes: ["learning.request-recorded-dispatch-not-retried"]}});
  assert.doesNotMatch(JSON.stringify(response), /PRIVATE_SOURCE/);
  assert.equal(rejected, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn, null);
  const second = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "Continue", requestKey: "turn:after-preflight-failure"})});
  assert.equal(second.status, 202);
  assert.equal(attempts, 2);
});

test("a definite ARE preflight block is a bounded conflict, not a generic server error", async context => {
  let intent = null;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: entry => { intent = entry; },
    reject_turn_intent: entry => { assert.deepEqual(entry, intent); intent = null; }},
  turn_start: () => { throw new AppServerRpcError("rpc.response-error",
    "turn/start: ARE preflight block: PRIVATE_SOURCE", {code: -32072,
      message: "ARE preflight block", data: {authority_effect: "none",
        reason_codes: ["preflight.view-reuse-blocked"], residue: ["PRIVATE_SOURCE"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const blocked = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "Continue", requestKey: "turn:preflight-block"})});
  assert.equal(blocked.status, 409);
  const response = await blocked.json();
  assert.deepEqual(response, {ok: false, reason: "windows-client.are-preflight-blocked",
    value: {reason_codes: ["preflight.view-reuse-blocked"]}});
  assert.doesNotMatch(JSON.stringify(response), /PRIVATE_SOURCE/);
  assert.equal(intent, null);
});

test("an unverified preflight-like error preserves the pending turn intent", async context => {
  let intent = null;
  let rejected = 0;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: entry => { intent = entry; },
    reject_turn_intent: () => { rejected += 1; }},
  turn_start: () => { throw new AppServerRpcError("rpc.response-error", "turn/start: unverified failure",
    {code: -32070, message: "Different failure", data: {ok: false, authority_effect: "none",
      reason_codes: ["learning.request-recorded-dispatch-not-retried"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const response = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "Continue", requestKey: "turn:unverified-preflight"})});
  assert.equal(response.status, 500);
  assert.equal(rejected, 0);
  assert.equal(intent?.request_key, "turn:unverified-preflight");
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn?.request_key,
    "turn:unverified-preflight");
});

test("a definite restricted host-config drift refusal clears only the matching pending intent", async context => {
  let intent = null;
  let rejected = 0;
  const value = fixture({host_options: {require_restricted_mcp_catalog: true},
    recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
      pending_turn_intent: () => intent, record_turn_intent: entry => { intent = entry; },
      reject_turn_intent: (entry, reason) => {
        assert.deepEqual(entry, intent);
        assert.equal(reason, "gateway.restricted-host-config-drift");
        rejected += 1;
        intent = null;
      }},
    turn_start: () => { throw new AppServerRpcError("rpc.response-error", "turn/start: host config changed",
      {code: -32087, data: {reason_codes: ["gateway.restricted-host-config-drift"]}}); }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const response = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "Research next step",
      requestKey: "turn:config-drift"})});
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {ok: false, reason: "windows-client.restricted-host-config-drift"});
  assert.equal(rejected, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn, null);
});

test("host exposes an uncertain intent after restart and rejects changed replay", async (context) => {
  const pending = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "owned-thread", request_key: "turn:stable",
    text_digest: createHash("sha256").update("private message").digest("hex"), created_at: "2026-09-26T00:00:00.000Z"};
  let intent = pending;
  const recovery_state = {thread_ids: () => ["owned-thread"], record_thread: () => {}, pending_turn_intent: () => intent,
    record_turn_intent: () => { throw new Error("must reuse checkpoint"); }, settle_turn_intent: (entry, turnId) => {
      intent = null;
      return {schema_version: "are.codex-client-accepted-turn/v1", thread_id: entry.thread_id,
        request_key: entry.request_key, text_digest: entry.text_digest, turn_id: turnId, accepted_at: new Date().toISOString()};
    }};
  const value = fixture({recovery_state});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const state = (await (await request(ready, "/api/state")).json()).value;
  assert.deepEqual(state.pending_turn, pending);
  assert.equal((await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({})})).status, 409);
  const changed = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "changed", requestKey: "turn:stable"})});
  assert.equal(changed.status, 409);
  assert.equal((await changed.json()).reason, "windows-client.pending-turn-conflict");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
  const replay = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "private message", requestKey: "turn:stable"})});
  assert.equal(replay.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn, null);
  const newTurn = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({
    threadId: "owned-thread", text: "another message", requestKey: "turn:new"})});
  assert.equal(newTurn.status, 409);
  assert.equal((await newTurn.json()).reason, "windows-client.reasoning-recovery-unverified");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
});

test("a recovered accepted turn replays locally and identical new text requires explicit confirmation", async (context) => {
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "owned-thread", request_key: "turn:old",
    text_digest: createHash("sha256").update("same message").digest("hex"), turn_id: "turn-old",
    accepted_at: "2026-09-26T00:00:00.000Z"};
  let proof = {};
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    last_turn_result: () => accepted}, owned_runtime: () => proof});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const replay = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:old"})});
  assert.equal(replay.status, 202);
  assert.equal((await replay.json()).value.turn.id, "turn-old");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
  const conflict = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "changed", requestKey: "turn:old"})});
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).reason, "windows-client.accepted-key-conflict");
  const duplicate = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:new"})});
  assert.equal(duplicate.status, 409);
  assert.deepEqual((await duplicate.json()).value, {turn_id: "turn-old", accepted_at: accepted.accepted_at});
  const stale = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:new", confirmRepeatOfTurnId: "another-turn"})});
  assert.equal(stale.status, 409);
  const unverified = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:new", confirmRepeatOfTurnId: "turn-old"})});
  assert.equal(unverified.status, 409);
  assert.equal((await unverified.json()).reason, "windows-client.reasoning-recovery-unverified");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
  proof = {schema_version: "are.gateway-owned-runtime/v1", thread_id: accepted.thread_id,
    disposition: "terminal-verified", turn_status: "completed", turn_ref: digestValue(accepted.turn_id),
    host_observation_digest: "c".repeat(64), frontier_digest: "d".repeat(64),
    checkpoint_digest: "e".repeat(64), authority_effect: "none"};
  const stillUnresumed = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:new", confirmRepeatOfTurnId: "turn-old"})});
  assert.equal(stillUnresumed.status, 409);
  assert.equal((await stillUnresumed.json()).reason, "windows-client.rejoin-required");
  const resume = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", requestKey: "resume:accepted"})});
  assert.equal(resume.status, 200);
  const confirmed = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "same message", requestKey: "turn:new", confirmRepeatOfTurnId: "turn-old"})});
  assert.equal(confirmed.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
  assert.equal((await (await request(ready, "/api/state")).json()).value.last_turn_result.request_key, "turn:new");
});

test("an older accepted key replays locally after a newer turn without backend dispatch", async (context) => {
  const accepted = ["older", "newer"].map((label) => ({schema_version: "are.codex-client-accepted-turn/v1",
    thread_id: "owned-thread", request_key: `turn:${label}`,
    text_digest: createHash("sha256").update(`${label} message`).digest("hex"),
    turn_id: `turn-${label}`, accepted_at: "2026-09-28T00:00:00.000Z"}));
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    last_turn_result: () => accepted.at(-1), accepted_turn_results: () => accepted}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const state = (await (await request(ready, "/api/state")).json()).value;
  assert.deepEqual(state.accepted_turn_results.map((item) => item.turn_id), ["turn-older", "turn-newer"]);
  const replay = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "older message", requestKey: "turn:older"})});
  assert.equal(replay.status, 202);
  assert.deepEqual((await replay.json()).value, {turn: {id: "turn-older"}, recovered_from_receipt: true});
  const altered = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "altered", requestKey: "turn:older"})});
  assert.equal(altered.status, 409);
  assert.equal((await altered.json()).reason, "windows-client.accepted-key-conflict");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
});

test("full accepted-receipt retention stops a new turn before backend dispatch", async (context) => {
  const accepted = Array.from({length: 256}, (_, index) => ({schema_version: "are.codex-client-accepted-turn/v1",
    thread_id: "owned-thread", request_key: `turn:${index}`, text_digest: "a".repeat(64),
    turn_id: `turn-${index}`, accepted_at: "2026-09-28T00:00:00.000Z"}));
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    last_turn_result: () => accepted.at(-1), accepted_turn_results: () => accepted}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const blocked = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "new message", requestKey: "turn:new"})});
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).reason, "windows-client.accepted-receipt-limit");
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
  const replay = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "owned-thread", text: "new message", requestKey: "turn:0"})});
  assert.equal(replay.status, 409);
  assert.equal((await replay.json()).reason, "windows-client.accepted-key-conflict");
});

test("a malformed accepted-turn response retains the pending intent", async (context) => {
  let intent = null;
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => intent, record_turn_intent: (entry) => { intent = entry; },
    settle_turn_intent: () => { throw new Error("must not settle"); }}, turn_start: () => ({turn: {id: ""}})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  await rejoinRecoveredFixture(value, ready);
  const response = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "message", requestKey: "turn:stable"})});
  assert.equal(response.status, 500);
  assert.equal(intent.request_key, "turn:stable");
  assert.equal((await (await request(ready, "/api/state")).json()).value.pending_turn.request_key, "turn:stable");
});

test("Windows client host refuses external desktop thread resume without handover", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const denied = await request(ready, "/api/threads/resume", {method: "POST", body: JSON.stringify({threadId: "desktop-task-id", requestKey: "resume:external"})});
  assert.equal(denied.status, 409);
  assert.equal((await denied.json()).reason, "windows-client.external-thread-handover-unverified");
  assert.equal(value.calls.some(([method]) => method === "thread/resume"), false);
  const created = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "start:owned"})});
  assert.equal(created.status, 201);
  const rejoined = await request(ready, "/api/threads/resume", {method: "POST", body: JSON.stringify({threadId: "thread-1", requestKey: "resume:owned"})});
  assert.equal(rejoined.status, 200);
  assert.equal(value.calls.filter(([method]) => method === "thread/resume").length, 1);
  const resumeParams = value.calls.find(([method]) => method === "thread/resume")?.[1];
  assert.equal(resumeParams.approvalPolicy, "on-request");
  assert.equal(resumeParams.sandbox, "read-only");
  for (const path of ["/api/threads/resume", "/api/turns"]) {
    const response = await request(ready, path, {method: "POST", body: JSON.stringify({threadId: "thread-1", text: "hello",
      requestKey: "override:forbidden", approvalPolicy: "never", sandboxPolicy: {type: "dangerFullAccess"}})});
    assert.equal(response.status, 400);
    assert.equal((await response.json()).reason, "windows-client.thread-policy-client-override-forbidden");
  }
});

test("Windows client host reopens only recovered owned IDs and checkpoints new IDs before delivery", async (context) => {
  const recorded = [];
  const value = fixture({recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: (id) => recorded.push(id)},
    owned_runtime: ({threadId}) => firstTurnProof(threadId)});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const initial = await (await request(ready, "/api/state")).json();
  assert.deepEqual(initial.value.thread_ids, ["prior-owned-thread"]);
  assert.equal(initial.value.recovery_mode, "private-file");
  const external = await request(ready, "/api/threads/resume", {method: "POST", body: JSON.stringify({threadId: "desktop-task-id", requestKey: "resume:external"})});
  assert.equal(external.status, 409);
  const recovered = await request(ready, "/api/threads/resume", {method: "POST", body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "resume:owned"})});
  assert.equal(recovered.status, 200);
  const created = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "start:new"})});
  assert.equal(created.status, 201);
  assert.deepEqual(recorded, ["thread-1"]);
});

test("recovered accepted thread rejoin waits for its exact gateway-owned terminal frontier", async (context) => {
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "prior-owned-thread",
    request_key: "turn:accepted", text_digest: "b".repeat(64), turn_id: "turn:accepted",
    accepted_at: "2026-10-01T00:00:00.000Z"};
  let proof = {};
  const value = fixture({recovery_state: {thread_ids: () => [accepted.thread_id], record_thread: () => {},
    last_turn_result: () => accepted}, owned_runtime: () => proof});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const resume = () => request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: accepted.thread_id, requestKey: "resume:accepted"})});
  const unverified = await resume();
  assert.equal(unverified.status, 409);
  assert.equal((await unverified.json()).reason, "windows-client.reasoning-recovery-unverified");
  const preflight = () => request(ready, `/api/threads/${accepted.thread_id}/rejoin-check`);
  const blockedCheck = await preflight();
  assert.equal(blockedCheck.status, 409);
  assert.equal((await blockedCheck.json()).reason, "windows-client.reasoning-recovery-unverified");
  const compact = await request(ready, "/api/threads/compact", {method: "POST",
    body: JSON.stringify({threadId: accepted.thread_id, requestKey: "compact:unverified"})});
  assert.equal(compact.status, 409);
  assert.equal((await compact.json()).reason, "windows-client.reasoning-recovery-unverified");
  assert.equal(value.calls.some(([method]) => method === "thread/compact/start"), false);
  assert.equal(value.calls.some(([method]) => method === "thread/resume"), false);
  proof = {schema_version: "are.gateway-owned-runtime/v1", thread_id: accepted.thread_id,
    disposition: "terminal-verified", turn_status: "interrupted", turn_ref: digestValue("different-turn"),
    host_observation_digest: "c".repeat(64), frontier_digest: "d".repeat(64),
    checkpoint_digest: "e".repeat(64), authority_effect: "none"};
  const wrongTurn = await resume();
  assert.equal(wrongTurn.status, 409);
  assert.equal((await wrongTurn.json()).reason, "windows-client.reasoning-recovery-unverified");
  proof = {...proof, turn_ref: digestValue(accepted.turn_id)};
  const verifiedCheck = await preflight();
  assert.equal(verifiedCheck.status, 200);
  assert.deepEqual((await verifiedCheck.json()).value, {thread_id: accepted.thread_id,
    check: "rejoin-preflight", requires_resume: true, authority_effect: "none"});
  assert.equal(value.calls.some(([method]) => method === "thread/resume"), false);
  const reconciled = await resume();
  assert.equal(reconciled.status, 200);
  assert.equal((await reconciled.json()).value.thread.id, accepted.thread_id);
  const afterResumeCheck = await preflight();
  assert.equal((await afterResumeCheck.json()).value.requires_resume, false);
  assert.equal(value.calls.filter(([method]) => method === "thread/resume").length, 1);
});

test("recovered accepted thread cannot mutate feedback before verified Rejoin", async (context) => {
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "prior-owned-thread",
    request_key: "turn:accepted", text_digest: "b".repeat(64), turn_id: "turn:accepted",
    accepted_at: "2026-10-01T00:00:00.000Z"};
  let proof = {};
  const value = fixture({recovery_state: {thread_ids: () => [accepted.thread_id], record_thread: () => {},
    last_turn_result: () => accepted}, owned_runtime: () => proof});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const mutations = [
    ["/api/feedback", {threadId: accepted.thread_id, text: "Improve this response", requestKey: "feedback:submit"}],
    ["/api/feedback/dismiss", {threadId: accepted.thread_id, text: "Dismiss feedback", requestKey: "feedback:dismiss"}],
    ["/api/feedback/apply", {threadId: accepted.thread_id, text: "Apply this quote", requestKey: "feedback:apply",
      episodeRef: "episode:fixture", quote: "this quote", instruction: "Prefer the corrected explanation."}],
  ];
  const submit = ([path, body]) => request(ready, path, {method: "POST", body: JSON.stringify(body)});
  const methods = ["cyberalchemy/learning/submitFeedback", "cyberalchemy/learning/dismissPendingFeedback",
    "cyberalchemy/learning/applyPendingFeedback"];
  for (const mutation of mutations) {
    const refused = await submit(mutation);
    assert.equal(refused.status, 409);
    assert.equal((await refused.json()).reason, "windows-client.reasoning-recovery-unverified");
  }
  proof = {schema_version: "are.gateway-owned-runtime/v1", thread_id: accepted.thread_id,
    disposition: "terminal-verified", turn_status: "completed", turn_ref: digestValue(accepted.turn_id),
    host_observation_digest: "c".repeat(64), frontier_digest: "d".repeat(64),
    checkpoint_digest: "e".repeat(64), authority_effect: "none"};
  for (const mutation of mutations) {
    const refused = await submit(mutation);
    assert.equal(refused.status, 409);
    assert.equal((await refused.json()).reason, "windows-client.rejoin-required");
  }
  assert.equal(value.calls.some(([method]) => methods.includes(method)), false);
  const resumed = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: accepted.thread_id, requestKey: "resume:feedback"})});
  assert.equal(resumed.status, 200);
  for (const mutation of mutations) assert.equal((await submit(mutation)).status, 200);
  assert.deepEqual(value.calls.filter(([method]) => methods.includes(method)).map(([method]) => method), methods);
});

test("recovered zero-turn thread rejoin needs its gateway-owned creation proof", async (context) => {
  let proof = {};
  const value = fixture({recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {}},
    owned_runtime: () => proof});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const resume = () => request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "resume:zero-turn"})});
  const unverified = await resume();
  assert.equal(unverified.status, 409);
  assert.equal((await unverified.json()).reason, "windows-client.zero-turn-rejoin-unverified");
  assert.equal(value.calls.some(([method]) => method === "thread/resume"), false);
  proof = firstTurnProof("prior-owned-thread");
  const verified = await resume();
  assert.equal(verified.status, 200);
  assert.equal(value.calls.filter(([method]) => method === "thread/resume").length, 1);
});

test("recovered zero-turn thread cannot mutate before verified Rejoin", async (context) => {
  let proof = {};
  const value = fixture({recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {}},
    owned_runtime: () => proof});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const threadId = "prior-owned-thread";
  const mutations = [
    ["/api/turns", {threadId, text: "new work", requestKey: "turn:zero"}],
    ["/api/threads/compact", {threadId, requestKey: "compact:zero"}],
    ["/api/feedback", {threadId, text: "feedback", requestKey: "feedback:zero"}],
    ["/api/feedback/dismiss", {threadId, text: "dismiss", requestKey: "dismiss:zero"}],
    ["/api/feedback/apply", {threadId, text: "quoted feedback", requestKey: "apply:zero",
      episodeRef: "episode:zero", quote: "quoted", instruction: "Use the correction."}],
  ];
  const submit = ([path, body]) => request(ready, path, {method: "POST", body: JSON.stringify(body)});
  for (const mutation of mutations) {
    const denied = await submit(mutation);
    assert.equal(denied.status, 409);
    assert.equal((await denied.json()).reason, "windows-client.zero-turn-rejoin-unverified");
  }
  proof = firstTurnProof(threadId);
  const check = await request(ready, `/api/threads/${threadId}/rejoin-check`);
  assert.equal(check.status, 200);
  assert.equal((await check.json()).value.requires_resume, true);
  for (const mutation of mutations) {
    const denied = await submit(mutation);
    assert.equal(denied.status, 409);
    assert.equal((await denied.json()).reason, "windows-client.rejoin-required");
  }
  const mutationMethods = ["turn/start", "thread/compact/start", "cyberalchemy/learning/submitFeedback",
    "cyberalchemy/learning/dismissPendingFeedback", "cyberalchemy/learning/applyPendingFeedback"];
  assert.equal(value.calls.some(([method]) => mutationMethods.includes(method)), false);
  const resumed = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId, requestKey: "resume:zero"})});
  assert.equal(resumed.status, 200);
  const sent = await submit(mutations[0]);
  assert.equal(sent.status, 202);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 1);
});

test("recovered rejoin never records a mismatched native thread identity", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {}},
    owned_runtime: ({threadId}) => firstTurnProof(threadId),
    resume_thread: () => ({thread: {id: "different-thread"}})});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const resume = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "resume:mismatch"})});
  assert.equal(resume.status, 409);
  assert.equal((await resume.json()).reason, "windows-client.thread-resume-identity-unverified");
  const check = await request(ready, "/api/threads/prior-owned-thread/rejoin-check");
  assert.equal((await check.json()).value.requires_resume, true);
});

test("hosted effect opt-in refuses persisted threads until dynamic tools and workspace can be rebound", async (context) => {
  const value = fixture({host_options: {allow_hosted_effect_tool: true},
    recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {}}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const resume = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "resume:prior-effect"})});
  assert.equal(resume.status, 409);
  assert.equal((await resume.json()).reason, "windows-client.hosted-effect-resume-rebind-unverified");
  const turn = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", text: "Implement", requestKey: "turn:prior-effect"})});
  assert.equal(turn.status, 409);
  assert.equal((await turn.json()).reason, "windows-client.hosted-effect-resume-rebind-unverified");
  assert.equal(value.calls.some(([method]) => method === "thread/resume" || method === "turn/start"), false);
});

test("hosted effect thread creation checkpoints the exact tool and workspace binding", async (context) => {
  const recorded = [];
  const value = fixture({host_options: {allow_hosted_effect_tool: true},
    recovery_state: {thread_ids: () => [], record_thread: (...args) => recorded.push(args)}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const created = await request(ready, "/api/threads", {method: "POST",
    body: JSON.stringify({cwd: value.effectRoot, requestKey: "thread:bound"})});
  assert.equal(created.status, 201);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0][0], "thread-1");
  assert.deepEqual(recorded[0][1], {
    schema_version: "are.codex-hosted-effect-thread-binding/v1", thread_id: "thread-1",
    cwd: value.effectRoot, host_user_agent: "fixture",
    request_binding_digest: digestValue({method: "thread/start",
      params: value.calls.find(([method]) => method === "thread/start")[1]}),
    root_digest: resolveHostedEffectRoot({repository_root: value.repositoryRoot,
      effect_root: value.effectRoot}).sha256,
    tool_digest: digestValue([HOSTED_EFFECT_DYNAMIC_TOOL]),
  });
});

test("persisted hosted thread resumes only after exact binding, journal and host cwd checks", async (context) => {
  let binding;
  const settings = {host_options: {allow_hosted_effect_tool: true,
    hosted_effect_journal: {inspect: () => ({schema_version: "are.hosted-effect-journal-state/v1",
      unsettled: 0, faulted: false, closed: false})}},
  owned_runtime: ({threadId}) => firstTurnProof(threadId),
  recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {},
    thread_binding: () => binding}};
  const value = fixture(settings);
  context.after(() => value.host.close());
  binding = {schema_version: "are.codex-hosted-effect-thread-binding/v1",
    thread_id: "prior-owned-thread", cwd: value.effectRoot, host_user_agent: "fixture",
    request_binding_digest: "a".repeat(64),
    root_digest: resolveHostedEffectRoot({repository_root: value.repositoryRoot,
      effect_root: value.effectRoot}).sha256,
    tool_digest: digestValue([HOSTED_EFFECT_DYNAMIC_TOOL])};
  settings.thread_read_with_turns = {thread: {id: "prior-owned-thread", cwd: value.effectRoot,
    status: {type: "idle"}, turns: []}};
  settings.resume_thread = () => ({thread: {id: "prior-owned-thread", cwd: value.effectRoot}});
  const ready = await value.host.start();
  const resumed = await request(ready, "/api/threads/resume", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "resume:bound"})});
  assert.equal(resumed.status, 200);
  assert.equal(value.calls.some(([method]) => method === "thread/resume"), true);
  const turn = await request(ready, "/api/turns", {method: "POST",
    body: JSON.stringify({threadId: "prior-owned-thread", requestKey: "turn:rebound", text: "Continue"})});
  assert.equal(turn.status, 202);
  assert.equal(value.calls.some(([method]) => method === "turn/start"), true);
});

test("real private recovery and effect journal rejoin one hosted thread after clean restart", {
  skip: process.platform === "win32"}, async () => {
  const root = mkdtempSync(join(tmpdir(), "are-hosted-rebind-"));
  const statePath = join(root, "client-state.json");
  const consumerId = "codex:human-chat";
  const token = "rebind-gateway-token";
  const receipt = resumed => ({schema_version: GATEWAY_CONNECTED_SCHEMA,
    ok: true, consumer_id: consumerId, resumed,
    continuity: {resume_token: token, resume_token_digest: digestValue(token)}});
  let state, journal, hosted;
  try {
    state = createWindowsClientRecoveryState({path: statePath, consumer_id: consumerId});
    state.bind_gateway(receipt(false));
    journal = createFileHostedEffectJournal({state_dir: root});
    hosted = fixture({repository_root: root, recovery_state: state,
      host_options: {allow_hosted_effect_tool: true, hosted_effect_journal: journal}});
    let ready = await hosted.host.start();
    const created = await request(ready, "/api/threads", {method: "POST",
      body: JSON.stringify({cwd: root, requestKey: "thread:durable-binding"})});
    assert.equal(created.status, 201);
    const originalBinding = state.thread_binding("thread-1");
    assert.equal(originalBinding?.cwd, root);
    await hosted.host.close(); hosted = null;
    journal.close(); journal = null;
    state.close(); state = null;

    state = createWindowsClientRecoveryState({path: statePath, consumer_id: consumerId});
    state.bind_gateway(receipt(true));
    assert.deepEqual(state.thread_binding("thread-1"), originalBinding);
    journal = createFileHostedEffectJournal({state_dir: root});
    hosted = fixture({repository_root: root, recovery_state: state,
      owned_runtime: ({threadId}) => firstTurnProof(threadId),
      thread_read_with_turns: {thread: {id: "thread-1", cwd: root,
        status: {type: "idle"}, turns: []}},
      resume_thread: () => ({thread: {id: "thread-1", cwd: root}}),
      host_options: {allow_hosted_effect_tool: true, hosted_effect_journal: journal}});
    ready = await hosted.host.start();
    const before = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", requestKey: "turn:before-rebind", text: "Continue"})});
    assert.equal(before.status, 409);
    const resumed = await request(ready, "/api/threads/resume", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", requestKey: "resume:durable-binding"})});
    assert.equal(resumed.status, 200);
    const after = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "thread-1", requestKey: "turn:after-rebind", text: "Continue"})});
    assert.equal(after.status, 202);
  } finally {
    await hosted?.host.close();
    journal?.close();
    state?.close();
    rmSync(root, {recursive: true, force: true});
  }
});

test("hosted effect rebind fails closed on binding, journal, and host drift", async (context) => {
  const cases = ["missing-binding", "root-drift", "tool-drift", "host-drift", "cwd-drift",
    "unsettled-journal", "faulted-journal", "pre-read-cwd-drift", "post-resume-cwd-drift"];
  for (const failure of cases) {
    let binding;
    const journal = {schema_version: "are.hosted-effect-journal-state/v1",
      unsettled: failure === "unsettled-journal" ? 1 : 0,
      faulted: failure === "faulted-journal", closed: false};
    const settings = {host_options: {allow_hosted_effect_tool: true,
      hosted_effect_journal: {inspect: () => journal}},
    owned_runtime: ({threadId}) => firstTurnProof(threadId),
    recovery_state: {thread_ids: () => ["prior-owned-thread"], record_thread: () => {},
      thread_binding: () => binding}};
    const value = fixture(settings);
    context.after(() => value.host.close());
    const cwd = value.effectRoot;
    binding = {schema_version: "are.codex-hosted-effect-thread-binding/v1",
      thread_id: "prior-owned-thread", cwd, host_user_agent: "fixture",
      request_binding_digest: "a".repeat(64),
      root_digest: resolveHostedEffectRoot({repository_root: value.repositoryRoot,
        effect_root: cwd}).sha256,
      tool_digest: digestValue([HOSTED_EFFECT_DYNAMIC_TOOL])};
    if (failure === "missing-binding") binding = null;
    if (failure === "root-drift") binding.root_digest = "b".repeat(64);
    if (failure === "tool-drift") binding.tool_digest = "b".repeat(64);
    if (failure === "host-drift") binding.host_user_agent = "another-host";
    if (failure === "cwd-drift") binding.cwd = value.repositoryRoot + "/elsewhere";
    settings.thread_read_with_turns = {thread: {id: "prior-owned-thread",
      cwd: failure === "pre-read-cwd-drift" ? "/wrong-root" : cwd,
      status: {type: "idle"}, turns: []}};
    settings.resume_thread = () => ({thread: {id: "prior-owned-thread",
      cwd: failure === "post-resume-cwd-drift" ? "/wrong-root" : cwd}});
    const ready = await value.host.start();
    const resumed = await request(ready, "/api/threads/resume", {method: "POST",
      body: JSON.stringify({threadId: "prior-owned-thread", requestKey: `resume:${failure}`})});
    assert.equal(resumed.status, 409, failure);
    assert.equal((await resumed.json()).reason,
      "windows-client.hosted-effect-resume-rebind-unverified", failure);
    const turn = await request(ready, "/api/turns", {method: "POST",
      body: JSON.stringify({threadId: "prior-owned-thread", requestKey: `turn:${failure}`, text: "Continue"})});
    assert.equal(turn.status, 409, failure);
    assert.equal(value.calls.some(([method]) => method === "turn/start"), false, failure);
  }
});

test("Windows client withholds a new host thread when ownership checkpoint fails", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => [], record_thread: () => { throw new Error("checkpoint failed"); }}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const created = await request(ready, "/api/threads", {method: "POST", body: JSON.stringify({cwd: value.repositoryRoot, requestKey: "start:failed"})});
  assert.equal(created.status, 500);
  const state = await (await request(ready, "/api/state")).json();
  assert.deepEqual(state.value.thread_ids, []);
  assert.equal(value.calls.filter(([method]) => method === "thread/start").length, 1);
});

test("stored history projects only bounded user and agent text from an owned thread", async (context) => {
  const secretToolOutput = "TOOL_SECRET_NEVER_RENDER";
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}}, history_page: {
    data: [{id: "turn-old", itemsView: "summary", items: [
      {type: "userMessage", id: "item-user", content: [{type: "text", text: "A prior question"}]},
      {type: "reasoning", id: "item-reasoning", summary: ["private reasoning"], content: []},
      {type: "commandExecution", id: "item-tool", aggregatedOutput: secretToolOutput},
      {type: "agentMessage", id: "item-agent", text: "A prior answer"},
    ]}], nextCursor: "older-cursor", backwardsCursor: null,
  }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const unknown = await request(ready, "/api/threads/desktop-task-id/history");
  assert.equal(unknown.status, 409);
  assert.equal(value.calls.some(([method]) => method === "thread/turns/list"), false);
  const response = await request(ready, "/api/threads/owned-thread/history");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.value.messages.map(({role, text}) => ({role, text})), [
    {role: "user", text: "A prior question"}, {role: "agent", text: "A prior answer"},
  ]);
  assert.equal(body.value.has_older, true);
  assert.equal(body.value.truncated, true);
  assert.equal(JSON.stringify(body).includes(secretToolOutput), false);
  assert.equal(JSON.stringify(body).includes("private reasoning"), false);
  assert.deepEqual(value.calls.find(([method]) => method === "thread/turns/list")?.[1], {
    threadId: "owned-thread", limit: 20, itemsView: "summary", sortDirection: "desc",
  });
});

test("stored-history text is capped before delivery to the browser", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}}, history_page: {
    data: [{id: "turn-long", itemsView: "summary", items: [{type: "agentMessage", id: "item-long", text: "x".repeat(9000)}]}],
    nextCursor: null, backwardsCursor: null,
  }});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/threads/owned-thread/history");
  assert.equal(response.status, 200);
  const history = (await response.json()).value;
  assert.equal(history.messages[0].text.length, 8192);
  assert.equal(history.messages[0].truncated, true);
  assert.equal(history.truncated, true);
});

test("active unrejoined turn blocks a duplicate start and exposes only bounded status", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    thread_read: {thread: {id: "owned-thread", status: {type: "active", activeFlags: ["turn"]}, secret: "DO_NOT_RENDER"}},
    runtime_page: {data: [{id: "turn-active", status: "inProgress", items: [{text: "PRIVATE"}]}]}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const runtimeResponse = await request(ready, "/api/threads/owned-thread/runtime");
  assert.equal(runtimeResponse.status, 200);
  const runtime = (await runtimeResponse.json()).value;
  assert.equal(runtime.disposition, "active");
  assert.equal(runtime.turn_id, "turn-active");
  assert.equal(await value.host.verify_active_turn("owned-thread", "turn-active"), true);
  assert.equal(await value.host.verify_active_turn("owned-thread", "turn-other"), false);
  assert.equal(await value.host.verify_active_turn("foreign-thread", "turn-active"), false);
  assert.equal(JSON.stringify(runtime).includes("PRIVATE"), false);
  assert.equal(JSON.stringify(runtime).includes("DO_NOT_RENDER"), false);
  const start = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "duplicate", requestKey: "turn:duplicate"})});
  assert.equal(start.status, 409);
  assert.equal((await start.json()).reason, "windows-client.zero-turn-rejoin-unverified");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
});

test("recovered pending intent cannot redispatch while its host turn remains active", async (context) => {
  const pending = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "owned-thread", request_key: "turn:pending",
    text_digest: createHash("sha256").update("private message").digest("hex"), created_at: "2026-09-27T00:00:00.000Z"};
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {},
    pending_turn_intent: () => pending, record_turn_intent: () => { throw new Error("must not dispatch"); }},
    thread_read: {thread: {id: "owned-thread", status: {type: "active", activeFlags: ["turn"]}}},
    runtime_page: {data: [{id: "turn-active", status: "inProgress"}]}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const response = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread",
    text: "private message", requestKey: pending.request_key})});
  assert.equal(response.status, 409);
  assert.equal((await response.json()).reason, "windows-client.turn-not-reconciled");
  assert.equal(value.calls.some(([method]) => method === "turn/start"), false);
  assert.deepEqual((await (await request(ready, "/api/state")).json()).value.pending_turn, pending);
});

test("unknown or contradictory recovered status fails closed", async (context) => {
  const value = fixture({recovery_state: {thread_ids: () => ["owned-thread"], record_thread: () => {}},
    thread_read: {thread: {id: "owned-thread", status: {type: "idle"}}},
    runtime_page: {data: [{id: "turn-active", status: "inProgress"}]}});
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const active = (await (await request(ready, "/api/threads/owned-thread/runtime")).json()).value;
  assert.equal(active.disposition, "active");
  const denied = await request(ready, "/api/turns", {method: "POST", body: JSON.stringify({threadId: "owned-thread", text: "again", requestKey: "turn:again"})});
  assert.equal(denied.status, 409);
  const external = await request(ready, "/api/threads/desktop-task-id/runtime");
  assert.equal(external.status, 409);
  assert.equal(value.calls.filter(([method]) => method === "turn/start").length, 0);
});

test("approval broker supports command decisions and fail-closed permissions", async () => {
  const broker = createApprovalBroker({timeout_ms: 1000});
  const command = broker.request({id: 7, method: "item/commandExecution/requestApproval", params: {command: "npm test"}});
  assert.equal(broker.snapshot().length, 1);
  assert.equal(broker.decide("7", {decision: "acceptForSession"}).ok, false);
  assert.equal(broker.snapshot().length, 1);
  assert.equal(broker.decide("7", {decision: "accept"}).ok, true);
  assert.deepEqual(await command, {decision: "accept"});
  const permissions = broker.request({id: 8, method: "item/permissions/requestApproval", params: {permissions: {network: true}}});
  assert.equal(broker.decide("8", {decision: "accept"}).ok, false);
  assert.equal(broker.decide("8", {decision: "decline"}).ok, true);
  assert.deepEqual(await permissions, {permissions: {}, scope: "turn"});
});

test("approval broker cancels a stale prompt when its RPC request aborts", async () => {
  const events = [];
  const broker = createApprovalBroker({timeout_ms: 1000, on_change: (event) => events.push(event)});
  const controller = new AbortController();
  const pending = broker.request({id: "approval-stale", method: "item/commandExecution/requestApproval", params: {command: "false"}}, {signal: controller.signal});
  assert.equal(broker.snapshot().length, 1);
  controller.abort();
  assert.deepEqual(await pending, {decision: "decline"});
  assert.deepEqual(broker.snapshot(), []);
  assert.equal(broker.decide("approval-stale", {decision: "accept"}).ok, false);
  assert.equal(events.at(-1).kind, "approval-aborted");
  broker.close();
});

test("Windows client user input endpoint validates choices and keeps answers out of events", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const waiting = value.userInputBroker.request({id: 23, method: "item/tool/requestUserInput", params: {
    threadId: "thread-1", turnId: "turn-1", itemId: "item-1", questions: [
      {id: "mode", header: "Mode", question: "Choose mode", isOther: false, isSecret: false, options: [{label: "Safe", description: "Keep checks"}]},
      {id: "secret", header: "Token", question: "Enter token", isOther: false, isSecret: true, options: null},
    ],
  }});
  const state = await (await request(ready, "/api/state")).json();
  assert.equal(state.value.pending_user_inputs.length, 1);
  assert.equal(state.value.pending_user_inputs[0].questions[1].isSecret, true);
  const invalid = await request(ready, "/api/user-input/23", {method: "POST", body: JSON.stringify({answers: {mode: {answers: ["Unsafe"]}, secret: {answers: ["hidden"]}}})});
  assert.equal(invalid.status, 409);
  const answer = await request(ready, "/api/user-input/23", {method: "POST", body: JSON.stringify({answers: {mode: {answers: ["Safe"]}, secret: {answers: ["private fixture"]}}})});
  assert.equal(answer.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(await waiting)), {answers: {mode: {answers: ["Safe"]}, secret: {answers: ["private fixture"]}}});
  assert.equal(JSON.stringify(await answer.json()).includes("private fixture"), false);
  assert.equal(JSON.stringify(value.host.state()).includes("private fixture"), false);
});

test("serverRequest resolved clears the matching pending user input", async (context) => {
  const value = fixture();
  await value.host.start();
  context.after(() => value.host.close());
  const waiting = value.userInputBroker.request({id: "stale", method: "item/tool/requestUserInput", params: {
    threadId: "thread-1", turnId: "turn-1", itemId: "item-1", questions: [{id: "q", header: "Q", question: "Answer", isOther: false, isSecret: false, options: null}],
  }});
  value.rpc.events.emit("notification", {method: "serverRequest/resolved", params: {threadId: "thread-other", requestId: "stale"}});
  assert.equal(value.userInputBroker.snapshot().length, 1);
  value.rpc.events.emit("notification", {method: "serverRequest/resolved", params: {threadId: "thread-1", requestId: "stale"}});
  await assert.rejects(waiting, /cleared/);
  assert.deepEqual(value.userInputBroker.snapshot(), []);
});

test("user input auto-resolution returns an empty answer map at the host deadline", async () => {
  const events = [];
  const broker = createUserInputBroker({timeout_ms: 1000, on_change: (event) => events.push(event)});
  const pending = broker.request({id: "automatic", method: "item/tool/requestUserInput", params: {
    threadId: "thread-1", turnId: "turn-1", itemId: "item-1", isBlocking: false, autoResolutionMs: 5,
    questions: [{id: "q", header: "Question", question: "Optional answer", isOther: false, isSecret: false, options: null}],
  }});
  const timer = setTimeout(() => {}, 100);
  try { assert.deepEqual(await pending, {answers: {}}); }
  finally { clearTimeout(timer); }
  assert.deepEqual(broker.snapshot(), []);
  assert.equal(events.at(-1).kind, "user-input-expired");
  assert.equal(events.at(-1).resolution, "automatic");
  broker.close();
});

test("hosted MCP form validates typed answers and keeps content out of state, acknowledgement, and events", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const waiting = value.elicitationBroker.request({id: "form-1", method: "mcpServer/elicitation/request", params: {
    threadId: "thread-1", turnId: "turn-1", serverName: "Fixture MCP", mode: "form", message: "Provide bounded input",
    requestedSchema: {type: "object", properties: {
      mode: {type: "string", oneOf: [{const: "safe", title: "Safe"}, {const: "review", title: "Review"}]},
      note: {type: "string", minLength: 2, maxLength: 32},
      count: {type: "integer", minimum: 1, maximum: 3},
      confirmed: {type: "boolean"},
    }, required: ["mode", "note", "count", "confirmed"]},
  }});
  const state = (await (await request(ready, "/api/state")).json()).value;
  assert.equal(state.pending_elicitations.length, 1);
  assert.equal(state.pending_elicitations[0].fields.length, 4);
  assert.equal(state.pending_elicitations[0].server_name, "Fixture MCP");
  assert.equal((await request(ready, "/api/elicitations/form-1", {method: "POST", body: JSON.stringify({action: "accept", content: {mode: "wrong"}})})).status, 409);
  const content = {mode: "safe", note: "private fixture answer", count: 2, confirmed: true};
  const response = await request(ready, "/api/elicitations/form-1", {method: "POST", body: JSON.stringify({action: "accept", content})});
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(await waiting)), {action: "accept", content, _meta: null});
  assert.doesNotMatch(JSON.stringify(await response.json()), /private fixture answer/);
  assert.doesNotMatch(JSON.stringify(value.host.state()), /private fixture answer/);
  const events = await request(ready, "/api/events");
  const reader = events.body.getReader();
  const chunk = await reader.read();
  assert.doesNotMatch(new TextDecoder().decode(chunk.value), /private fixture answer/);
  await reader.cancel();
});

test("MCP form broker declines unsupported modes and removes stale or expired requests", async (context) => {
  const value = fixture();
  await value.host.start();
  context.after(() => value.host.close());
  const base = {threadId: "thread-1", turnId: "turn-1", serverName: "Fixture MCP", message: "Question"};
  for (const mode of ["url", "openai/form", "openai/userVerification"]) {
    const result = await value.elicitationBroker.request({id: mode, method: "mcpServer/elicitation/request", params: {...base, mode}});
    assert.deepEqual(result, {action: "decline", content: null, _meta: null});
  }
  assert.deepEqual(value.elicitationBroker.snapshot(), []);
  const form = {type: "object", properties: {answer: {type: "string"}}, required: ["answer"]};
  const waiting = value.elicitationBroker.request({id: "stale-form", method: "mcpServer/elicitation/request", params: {...base, mode: "form", requestedSchema: form}});
  value.rpc.events.emit("notification", {method: "serverRequest/resolved", params: {threadId: "foreign-thread", requestId: "stale-form"}});
  assert.equal(value.elicitationBroker.snapshot().length, 1);
  value.rpc.events.emit("notification", {method: "serverRequest/resolved", params: {threadId: "thread-1", requestId: "stale-form"}});
  assert.deepEqual(await waiting, {action: "decline", content: null, _meta: null});
  assert.deepEqual(value.elicitationBroker.snapshot(), []);
  assert.equal(value.elicitationBroker.answer("stale-form", {action: "accept", content: {answer: "late"}}).ok, false);
  const expiring = createElicitationBroker({timeout_ms: 5});
  const pending = expiring.request({id: "expire-form", method: "mcpServer/elicitation/request", params: {...base, mode: "form", requestedSchema: form}});
  const timer = setTimeout(() => {}, 100);
  try { assert.deepEqual(await pending, {action: "decline", content: null, _meta: null}); }
  finally { clearTimeout(timer); }
  assert.deepEqual(expiring.snapshot(), []);
});

test("MCP form broker rejects unsupported constraints and validates multi-choice and dates", async () => {
  const broker = createElicitationBroker({timeout_ms: 1000});
  const base = {threadId: "thread-1", serverName: "Fixture MCP", mode: "form", message: "Question"};
  for (const property of [
    {type: "string", pattern: "^secret$"},
    {type: "array", items: {type: "string", enum: ["a", "b"], pattern: "^a$"}},
    {type: "string", oneOf: [{const: "a", title: "A", secret: true}]},
  ]) {
    const result = await broker.request({id: "unsafe", method: "mcpServer/elicitation/request", params: {
      ...base, requestedSchema: {type: "object", properties: {value: property}},
    }});
    assert.deepEqual(result, {action: "decline", content: null, _meta: null});
  }
  const waiting = broker.request({id: "typed", method: "mcpServer/elicitation/request", params: {
    ...base, requestedSchema: {type: "object", properties: {
      choices: {type: "array", items: {type: "string", enum: ["a", "b"]}, minItems: 1, maxItems: 2},
      day: {type: "string", format: "date", default: "private schema default"},
    }, required: ["choices", "day"]},
  }});
  assert.doesNotMatch(JSON.stringify(broker.snapshot()), /private schema default/);
  assert.equal(broker.answer("typed", {action: "accept", content: {choices: ["a", "a"], day: "2026-02-28"}}).ok, false);
  assert.equal(broker.answer("typed", {action: "accept", content: {choices: ["a"], day: "2026-02-30"}}).ok, false);
  assert.equal(broker.answer("typed", {action: "accept", content: {choices: ["a", "b"], day: "2026-02-28"}}).ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(await waiting)), {
    action: "accept", content: {choices: ["a", "b"], day: "2026-02-28"}, _meta: null,
  });
});

test("Windows client host streams app-server notifications over authenticated SSE", async (context) => {
  const value = fixture();
  const ready = await value.host.start();
  context.after(() => value.host.close());
  const controller = new AbortController();
  const response = await request(ready, "/api/events", {signal: controller.signal});
  assert.equal(response.status, 200);
  value.rpc.events.emit("notification", {method: "turn/started", params: {turn: {id: "turn-1"}}});
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let observed = "";
  while (!observed.includes("turn/started")) observed += decoder.decode((await reader.read()).value);
  controller.abort();
  assert.match(observed, /are\.codex-windows-client-event\/v1/);
});

test("hosted boundary rejects public cleartext and enforces configured browser origins", async (context) => {
  const value = fixture();
  assert.throws(() => createWindowsClientHost({rpc_client: value.rpc, approval_broker: value.broker, repository_root: value.repositoryRoot, default_cwd: value.repositoryRoot, assets_directory: resolve(import.meta.dirname, "../client"), host: "0.0.0.0", port: 0}), /requires TLS/);
  await value.host.close();
  const host = createWindowsClientHost({rpc_client: value.rpc, approval_broker: value.broker, repository_root: value.repositoryRoot, default_cwd: value.repositoryRoot, assets_directory: resolve(import.meta.dirname, "../client"), port: 0, token: "test-token", allowed_origins: ["https://are.example"]});
  const ready = await host.start();
  context.after(() => host.close());
  assert.equal((await request(ready, "/api/state", {headers: {origin: "https://evil.example"}})).status, 403);
  assert.equal((await request(ready, "/api/state", {headers: {origin: "https://are.example"}})).status, 200);
});
