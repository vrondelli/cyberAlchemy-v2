import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {EventEmitter, once} from "node:events";
import {mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync} from "node:fs";
import {createConnection} from "node:net";
import {hostname} from "node:os";
import {resolve} from "node:path";
import {spawn, spawnSync} from "node:child_process";
import {createInterface} from "node:readline";
import {PassThrough} from "node:stream";
import test from "node:test";

import {ACKNOWLEDGED_CONTINUITY_MODE, createFileGatewaySessionStore, createMemoryGatewaySessionStore, createPersistentGateway, GATEWAY_ACK_SCHEMA, GATEWAY_CONNECT_SCHEMA, GATEWAY_REQUEST_META_KEY, inspectFileGatewaySessionStoreWriterLock} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";
import {backendProcessBirthRef, backendProcessBirthSupported} from "../src/backend-process-birth.mjs";
import {CODEX_MODEL_ENTRY_RECEIPT_SCHEMA} from "../src/model-entry-receipt.mjs";
import {projectDshObjectiveCheckpoint} from "../src/gateway-session-store.mjs";
import {createGatewayBackedConversationBindingContract} from "../src/conversation-binding-contract.mjs";

for (const progress of [false, true]) test(`DSH interpretation reference requires its exact active binding and survives compaction without admission (progress=${progress})`, async () => {
  const directory = mkdtempSync("/tmp/are-dsh-interpretation-journal-");
  const path = resolve(directory, "gateway.jsonl");
  const consumer_id = "dsh:interpretation-test";
  const backend_adapter_id = "deepseek-harness-web/are-v1";
  const backend_thread_ref = digestValue("native interpretation thread");
  const thread_ref = `backend-thread:${backend_thread_ref}`;
  const owner = {};
  const assertion = {backend_adapter_id, backend_thread_ref, principal_kind: "local-host",
    principal_ref: digestValue("principal"), workspace_ref: digestValue("workspace"),
    host_instance_ref: digestValue("host"), client_instance_ref: digestValue("client"),
    writer_ref: digestValue("writer"), creation_receipt_digest: digestValue("create")};
  const store = createFileGatewaySessionStore({path});
  let observation;
  try {
    assert.equal(store.append({event_kind: "session-started", consumer_id,
      content: {lane: "interaction-bound", backend_adapter_id,
        resume_token_digest: digestValue("local host")}}).ok, true);
    assert.equal(store.append({event_kind: "thread-bound", consumer_id, content: {thread_ref}}).ok, true);
    const bindings = createGatewayBackedConversationBindingContract({session_store: store, consumer_id,
      verify_host_context: input => input === owner ? assertion : null, verify_release: () => null});
    const bound = await bindings.bindNewThread({host_context: owner, ttl_ms: 60_000});
    const material = {kind: "dsh-objective-interpretation-observed", thread_ref, turn_ref: null,
      binding_id_digest: digestValue(bound.binding_id), generation: 1,
      ...Object.fromEntries(["request_ref_digest", "scope_digest", "objective_state_digest",
        "resolution_digest", "interpretation_event_digest", "checkpoint_digest"]
        .map(key => [key, digestValue(key)])),
      plan_context_digest: digestValue("selected plan"), requirement_continuity_digest: progress ? digestValue('requirements') : null,
      ...(progress ? {plan_progress: {schema_version: 'are.dsh-plan-progress/v1', posture: 'checkpointed-declaration',
        obligation_count: 30, completed_count: 3, open_count: 25, active_count: 1, deferred_count: 1,
        open_decision_count: 7, active_slice_ordinal: 4, active_slice_status: 'active'}} : {}),
      authority_effect: "none"};
    const append = value => store.append({event_kind: "host-observation", consumer_id,
      content: {observation: {...value, observation_digest: digestValue(value)}}});
    assert.deepEqual(append(material).reason_codes, ["gateway.session-store-dsh-interpretation-unbound"]);
    await bindings.activate({binding_id: bound.binding_id, host_context: owner});
    if (progress) for (const change of [{plan_context_digest: null}, {requirement_continuity_digest: null},
      {plan_progress: {...material.plan_progress, completed_count: 31}},
      {plan_progress: {...material.plan_progress, prompt: 'private'}}]) {
      assert.deepEqual(append({...material, ...change}).reason_codes,
        ['gateway.session-store-host-observation-invalid']);
    }
    for (const change of [{binding_id_digest: digestValue("foreign")}, {generation: 2}]) {
      assert.deepEqual(append({...material, ...change}).reason_codes,
        ["gateway.session-store-dsh-interpretation-unbound"]);
    }
    for (const change of [{prompt: "private"}, {checkpoint_digest: ["a".repeat(64)]},
      {authority_effect: "admit"}, {generation: 0}, {plan_context_digest: "A".repeat(64)}]) {
      assert.deepEqual(append({...material, ...change}).reason_codes,
        ["gateway.session-store-host-observation-invalid"]);
    }
    assert.equal(append(material).ok, true);
    observation = {...material, observation_digest: digestValue(material)};
    assert.equal(append(material).ok, true, "an exact repeated observation is idempotent");
    assert.deepEqual(append({...material, checkpoint_digest: digestValue("different")}).reason_codes,
      ["gateway.session-store-dsh-interpretation-unbound"]);
    assert.equal(store.getSession(consumer_id).requests.length, 0);
    assert.equal(store.getSession(consumer_id).host_observations.length, 1);
    assert.equal(store.compact().ok, true);
  } finally {store.close();}
  const reopened = createFileGatewaySessionStore({path});
  try {
    assert.deepEqual(reopened.getSession(consumer_id).host_observations, [observation]);
    assert.equal(reopened.getSession(consumer_id).requests.length, 0);
    assert.equal(reopened.compact().ok, true);
  } finally {reopened.close(); rmSync(directory, {recursive: true, force: true});}
});

for (const selectedPlan of [false, true]) test(`DSH preparation retains a closed content-free objective checkpoint through compaction (plan=${selectedPlan})`, () => {
  const directory = mkdtempSync("/tmp/are-dsh-checkpoint-journal-");
  const path = resolve(directory, "gateway.jsonl");
  const consumer_id = "dsh:checkpoint-test";
  const thread_ref = `backend-thread:${digestValue("native thread")}`;
  const request_key = "native-session:request";
  const request_digest = digestValue("exact request");
  const binding = Object.fromEntries(["scope_digest", "objective_state_digest", "resolution_digest",
    "preflight_event_digest", "checkpoint_digest", "binding_digest"].map(key => [key, digestValue(key)]));
  const checkpoint = projectDshObjectiveCheckpoint({...binding,
    requirement_continuity_digest: null, private_prompt: "never project this",
    ...(selectedPlan ? {plan_context_digest: digestValue("selected plan")} : {})});
  assert.equal(checkpoint.schema_version, `are.dsh-objective-checkpoint-observation/v${selectedPlan ? 2 : 1}`);
  if (selectedPlan) assert.equal(checkpoint.plan_context_digest, digestValue("selected plan"));
  assert.doesNotMatch(JSON.stringify(checkpoint), /private_prompt|never project/);
  assert.throws(() => projectDshObjectiveCheckpoint({...binding, requirement_continuity_digest: undefined}),
    /checkpoint-invalid/);
  for (const plan_context_digest of [null, undefined, "private plan", "A".repeat(64)]) {
    assert.throws(() => projectDshObjectiveCheckpoint({...binding,
      requirement_continuity_digest: null, plan_context_digest}), /checkpoint-invalid/);
  }
  const store = createFileGatewaySessionStore({path});
  try {
    assert.equal(store.append({event_kind: "session-started", consumer_id,
      content: {lane: "interaction-bound", backend_adapter_id: "deepseek-harness-web/are-v1",
        resume_token_digest: digestValue("local host")}}).ok, true);
    assert.equal(store.append({event_kind: "thread-bound", consumer_id, content: {thread_ref}}).ok, true);
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id,
      content: {request_key, method: "dsh/web-prompt", thread_ref, binding_digest: request_digest}}).ok, true);
    const material = {kind: "dsh-are-preparation-observed", thread_ref, turn_ref: null,
      request_key_digest: digestValue(request_key), request_digest, route_id: "CA2-ROUTE-UNDERSTAND",
      route_receipt_digest: digestValue("route"), context_result_digest: digestValue("result"),
      context_envelope_digest: digestValue("envelope"), model_context_digest: digestValue("context"),
      objective_checkpoint: checkpoint, authority_effect: "none"};
    for (const objective_checkpoint of [null, {...checkpoint, checkpoint_digest: "invalid"},
      {...checkpoint, prompt: "private"}, {...checkpoint, requirement_continuity_digest: 0},
      {...checkpoint, scope_digest: null}, {...checkpoint, plan_context_digest: null},
      {...checkpoint, schema_version: "are.dsh-objective-checkpoint-observation/v3"}]) {
      const wrong = {...material, objective_checkpoint};
      assert.deepEqual(store.append({event_kind: "host-observation", consumer_id,
        content: {observation: {...wrong, observation_digest: digestValue(wrong)}}}).reason_codes,
      ["gateway.session-store-host-observation-invalid"]);
    }
    const foreign = {...material, request_digest: digestValue("foreign")};
    assert.deepEqual(store.append({event_kind: "host-observation", consumer_id,
      content: {observation: {...foreign, observation_digest: digestValue(foreign)}}}).reason_codes,
    ["gateway.session-store-dsh-preparation-unbound"]);
    assert.equal(store.append({event_kind: "host-observation", consumer_id,
      content: {observation: {...material, observation_digest: digestValue(material)}}}).ok, true);
    assert.equal(store.getSession(consumer_id).requests[0].status, "outcome-unknown");
    assert.equal(store.compact().ok, true);
  } finally {store.close();}
  const reopened = createFileGatewaySessionStore({path});
  try {
    assert.deepEqual(reopened.getSession(consumer_id).host_observations[0].objective_checkpoint, checkpoint);
    assert.equal(reopened.getSession(consumer_id).requests[0].status, "outcome-unknown");
  } finally {reopened.close(); rmSync(directory, {recursive: true, force: true});}
});

const windowsConnectionToken = "test-only-windows-session-store-token-32-bytes";
const gatewayPath = (directory) => process.platform === "win32" ? `\\\\.\\pipe\\are-session-store-${randomUUID()}` : resolve(directory, "gateway.sock");

function child() {
  const value = new EventEmitter();
  value.stdin = new PassThrough(); value.stdout = new PassThrough(); value.stderr = new PassThrough();
  value.kill = () => value.emit("exit", 0, "SIGTERM");
  return value;
}

function wrapper() {
  return {processClientMessage: async (message) => ({to_server: [message], to_client: []}), processServerMessage: async (message) => ({to_server: [], to_client: [message]}), prepareForEviction: () => ({ok: true, checkpoint_digest: "checkpoint:test", epoch_digest: "epoch:test", preparation_digest: "preparation:test"})};
}

const safeTurnParams = (threadId) => ({threadId, input: [], approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}});

test("DSH terminal observation binds to one Web prompt and survives compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-dsh-terminal-");
  const path = resolve(directory, "sessions.jsonl");
  const consumerId = "dsh:terminal-test";
  const storeId = "gateway-store:dsh-terminal-test";
  const threadRef = `backend-thread:${digestValue("dsh native session")}`;
  const requestKey = "session-1:prompt-1";
  const bindingDigest = digestValue("bound DSH prompt");
  let terminalObservationDigest;
  const store = createFileGatewaySessionStore({path, store_id: storeId});
  try {
    assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
      content: {lane: "interaction-bound", backend_adapter_id: "deepseek-harness-web/are-v1",
        resume_token_digest: digestValue("local host")}}).ok, true);
    assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
      content: {thread_ref: threadRef}}).ok, true);
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: {request_key: requestKey, method: "dsh/web-prompt",
        thread_ref: threadRef, binding_digest: bindingDigest}}).ok, true);
    const material = {kind: "dsh-turn-terminal-observed", thread_ref: threadRef,
      turn_ref: digestValue("native turn"), request_key_digest: digestValue(requestKey),
      request_digest: bindingDigest, event_digest: digestValue("durable turn/end"),
      turn_status: "completed"};
    const observation = {...material, observation_digest: digestValue(material)};
    terminalObservationDigest = observation.observation_digest;
    assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
      content: {observation: {...observation, request_digest: digestValue("wrong")}}}).reason_codes,
    ["gateway.session-store-host-observation-invalid"]);
    const wrongMaterial = {...material, request_digest: digestValue("wrong")};
    assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
      content: {observation: {...wrongMaterial,
        observation_digest: digestValue(wrongMaterial)}}}).reason_codes,
    ["gateway.session-store-dsh-terminal-unbound"]);
    assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
      content: {observation}}).ok, true);
    assert.equal(store.getSession(consumerId).requests[0].status, "outcome-unknown");
    assert.deepEqual(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
      content: {request_key: requestKey, response: {accepted: true,
        recovered_from_terminal_observation_digest: digestValue("wrong terminal")}}}).reason_codes,
    ["gateway.session-store-dsh-prompt-recovery-invalid"]);
    assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
      content: {request_key: requestKey, response: {accepted: true,
        recovered_from_terminal_observation_digest: observation.observation_digest}}}).ok, true);
    assert.equal(store.getSession(consumerId).requests[0].status, "complete");
    assert.equal(store.compact().ok, true);
  } finally {store.close();}
  const reopened = createFileGatewaySessionStore({path, store_id: storeId});
  try {
    assert.deepEqual(reopened.getSession(consumerId).host_observations[0].kind,
      "dsh-turn-terminal-observed");
    assert.equal(reopened.getSession(consumerId).requests[0].status, "complete");
    assert.equal(reopened.getSession(consumerId).requests[0].response
      .recovered_from_terminal_observation_digest, terminalObservationDigest);
  } finally {reopened.close(); rmSync(directory, {recursive: true, force: true});}
});

test("DSH cancellation recovers only from its target prompt terminal", () => {
  const store = createMemoryGatewaySessionStore();
  const consumerId = "dsh:cancel-recovery-test";
  const threadRef = `backend-thread:${digestValue("cancel recovery thread")}`;
  const promptKey = "session-1:prompt-1";
  const cancelKey = "session-1:cancel-1";
  const promptDigest = digestValue("cancel recovery prompt");
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "deepseek-harness-web/are-v1",
      resume_token_digest: digestValue("local host")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: promptKey, method: "dsh/web-prompt", thread_ref: threadRef,
      binding_digest: promptDigest}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: promptKey, response: {accepted: true}}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: cancelKey, method: "dsh/web-cancel", thread_ref: threadRef,
      target_request_key: promptKey, target_request_digest: promptDigest,
      binding_digest: digestValue("cancel intent")}}).ok, true);
  const material = {kind: "dsh-turn-terminal-observed", thread_ref: threadRef,
    turn_ref: digestValue("cancelled turn"), request_key_digest: digestValue(promptKey),
    request_digest: promptDigest, event_digest: digestValue("durable interruption"),
    turn_status: "interrupted"};
  const observation = {...material, observation_digest: digestValue(material)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation}}).ok, true);
  assert.deepEqual(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: cancelKey, response: {accepted: true,
      recovered_from_terminal_observation_digest: digestValue("wrong terminal")}}}).reason_codes,
  ["gateway.session-store-dsh-prompt-recovery-invalid"]);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: cancelKey, response: {accepted: true,
      recovered_from_terminal_observation_digest: observation.observation_digest}}}).ok, true);
  assert.equal(store.getSession(consumerId).requests.find((item) =>
    item.request_key === cancelKey).status, "complete");
});

test("verified model-entry proof rejects drift and survives durable compaction", () => {
  for (const source of ["direct", "generated"]) {
    const directory = mkdtempSync("/tmp/are-gateway-model-entry-");
    const path = resolve(directory, "sessions.jsonl");
    const storeId = `gateway-store:model-entry:${source}`;
    const consumerId = `codex:model-entry:${source}`;
    const threadRef = `backend-thread:${digestValue("receipt-thread")}`;
    const requestKey = source === "generated" ? "are-generated:receipt" : "receipt:direct";
    const requestBindingDigest = digestValue("original client request");
    const forwardedBindingDigest = digestValue("forwarded turn with context");
    const material = {schema_version: CODEX_MODEL_ENTRY_RECEIPT_SCHEMA, source, thread_ref: threadRef,
      forwarded_message_digest: digestValue("forwarded message"), request_binding_digest: requestBindingDigest,
      objective_resolution_digest: digestValue("objective resolution"),
      objective_state_digest: digestValue("objective state"), objective_id_digest: digestValue("objective id"),
      requirement_continuity_digest: digestValue("requirement continuity"), route_id: "CA2-ROUTE-IMPLEMENT",
      route_decision_digest: digestValue("route decision"), context_envelope_digest: digestValue("context"),
      plan_context_digest: null, semantic_state_digest: digestValue("semantic state"),
      reasoning_checkpoint_digest: digestValue("reasoning checkpoint"), authority_effect: "none"};
    const receipt = {...material, receipt_digest: digestValue(material)};
    const store = createFileGatewaySessionStore({path, store_id: storeId});
    try {
      assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
        content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
          resume_token_digest: digestValue("receipt-token")}}).ok, true);
      assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
        content: {request_key: requestKey, method: "turn/start", thread_ref: threadRef,
          binding_digest: source === "direct" ? requestBindingDigest : forwardedBindingDigest}}).ok, true);
      const proof = {request_key: requestKey, receipt, forwarded_binding_digest: forwardedBindingDigest};
      assert.equal(store.append({event_kind: "model-entry-verified", consumer_id: consumerId,
        content: {...proof, receipt: {...receipt, route_id: "forged"}}}).ok, false);
      assert.equal(store.append({event_kind: "model-entry-verified", consumer_id: consumerId,
        content: source === "direct"
          ? {...proof, receipt: {...receipt, request_binding_digest: digestValue("wrong client request")}}
          : {...proof, forwarded_binding_digest: digestValue("wrong forwarded binding")}}).ok, false);
      assert.equal(store.append({event_kind: "model-entry-verified", consumer_id: consumerId,
        content: proof}).ok, true);
      assert.equal(store.append({event_kind: "model-entry-verified", consumer_id: consumerId,
        content: proof}).ok, false, "proof is one-use per dispatch intent");
      assert.equal(store.compact().ok, true);
    } finally {store.close();}
    const reopened = createFileGatewaySessionStore({path, store_id: storeId});
    try { assert.equal(reopened.getSession(consumerId).requests[0].model_entry_proof.receipt.receipt_digest,
      receipt.receipt_digest); }
    finally {reopened.close(); rmSync(directory, {recursive: true, force: true});}
  }
});

test("server-request resolution is bound to the observed thread and survives compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-resolution-");
  const path = resolve(directory, "sessions.jsonl");
  const storeId = "gateway-store:server-resolution";
  const consumerId = "codex:server-resolution";
  const threadRef = `backend-thread:${digestValue("owned-thread")}`;
  const store = createFileGatewaySessionStore({path, store_id: storeId});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("resolution-token")}}).ok, true);
  assert.equal(store.append({event_kind: "server-request-observed", consumer_id: consumerId,
    content: {request_id: "input-1", thread_ref: threadRef,
      request_digest: digestValue("input-request")}}).ok, true);
  const resolution = {request_id: "input-1", thread_ref: threadRef,
    resolution_digest: digestValue("host-resolution")};
  assert.equal(store.append({event_kind: "server-request-resolved", consumer_id: consumerId,
    content: {...resolution, thread_ref: `backend-thread:${digestValue("other-thread")}`}}).ok, false);
  assert.equal(store.append({event_kind: "server-request-resolved", consumer_id: consumerId,
    content: resolution}).ok, true);
  assert.equal(store.getSession(consumerId).server_requests[0].status, "resolved-unanswered");
  assert.equal(store.append({event_kind: "server-request-resolved", consumer_id: consumerId,
    content: resolution}).ok, false);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: storeId});
  assert.equal(reopened.getSession(consumerId).server_requests[0].status, "resolved-unanswered");
  assert.equal(reopened.getSession(consumerId).server_requests[0].resolution_digest,
    resolution.resolution_digest);
  reopened.close();
});

test("pre-dispatch turn denial survives compaction without becoming host acceptance", () => {
  const directory = mkdtempSync("/tmp/are-gateway-pre-dispatch-");
  const path = resolve(directory, "sessions.jsonl");
  const storeId = "gateway-store:pre-dispatch-denial";
  const consumerId = "codex:pre-dispatch-denial";
  const store = createFileGatewaySessionStore({path, store_id: storeId});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("pre-dispatch-token")}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: "turn:denied", method: "turn/start", binding_digest: digestValue("denied"),
      thread_ref: `backend-thread:${digestValue("owned-thread")}`}}).ok, true);
  const response = {jsonrpc: "2.0", id: 1, error: {code: -32072, message: "ARE preflight block"}};
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: "turn:denied", response, response_digest: digestValue(response),
      pre_dispatch_rejection: true}}).ok, true);
  assert.equal(store.getSession(consumerId).requests[0].pre_dispatch_rejection, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: storeId});
  assert.equal(reopened.getSession(consumerId).requests[0].pre_dispatch_rejection, true);
  reopened.close();
});

test("manual compaction observations require the exact durable request and new turn", () => {
  const directory = mkdtempSync("/tmp/are-gateway-manual-compaction-");
  const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path,
    store_id: "gateway-store:manual-compaction-binding"});
  const consumerId = "codex:manual-compaction-binding";
  const threadRef = `backend-thread:${digestValue("owned-compaction-thread")}`;
  const turnRef = digestValue("new-compaction-turn");
  const requestKey = "compact:owned-compaction-thread:1";
  const requestDigest = digestValue({method: "thread/compact/start",
    params: {threadId: "owned-compaction-thread"}});
  const response = {jsonrpc: "2.0", id: "host-compact-1", result: {}};
  const responseDigest = digestValue(response);
  const record = (material) => ({...material, observation_digest: digestValue(material)});
  const changedRecord = (observation, changes) => {
    const {observation_digest: _priorDigest, ...material} = observation;
    return record({...material, ...changes});
  };
  const appendObservation = (observation) => store.append({event_kind: "host-observation",
    consumer_id: consumerId, content: {observation}});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("compaction token")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/compact/start",
      binding_digest: requestDigest, thread_ref: threadRef}}).ok, true);
  const accepted = record({kind: "compaction-turn-accepted", thread_ref: threadRef,
    turn_ref: turnRef, request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, response_digest: responseDigest,
    event_digest: digestValue("compaction turn/started")});
  const item = record({kind: "compaction-item-completed", thread_ref: threadRef,
    turn_ref: turnRef, item_ref: digestValue("compaction item"), item_status: "not-reported"});
  const completed = record({kind: "turn-completion-observed", thread_ref: threadRef,
    turn_ref: turnRef, request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, event_digest: digestValue("compaction turn/completed"),
    turn_status: "completed"});
  assert.equal(appendObservation(accepted).ok, false, "acknowledgement is required before turn binding");
  assert.equal(appendObservation(item).ok, false, "a compaction item cannot invent a turn");
  assert.equal(appendObservation(completed).ok, false, "completion cannot invent a turn");
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: responseDigest}}).ok, true);
  assert.equal(appendObservation(changedRecord(accepted,
    {response_digest: digestValue("foreign response")})).ok, false);
  assert.equal(appendObservation(accepted).ok, true);
  assert.equal(appendObservation(changedRecord(item,
    {turn_ref: digestValue("foreign turn")})).ok, false);
  assert.equal(appendObservation(item).ok, true);
  assert.equal(appendObservation(completed).ok, true);
  assert.deepEqual(store.getSession(consumerId).host_observations.map((observation) => observation.kind),
    ["compaction-turn-accepted", "compaction-item-completed", "turn-completion-observed"]);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path,
    store_id: "gateway-store:manual-compaction-binding"});
  assert.deepEqual(reopened.getSession(consumerId).host_observations.map((observation) => observation.kind),
    ["compaction-turn-accepted", "compaction-item-completed", "turn-completion-observed"]);
  reopened.close();
});

test("exact compaction history receipt survives store compaction and rejects an unbound turn", () => {
  const directory = mkdtempSync("/tmp/are-gateway-compact-history-");
  const path = resolve(directory, "sessions.jsonl");
  const storeId = "gateway-store:compact-history";
  const store = createFileGatewaySessionStore({path, store_id: storeId});
  const consumerId = "codex:compact-history";
  const threadId = "compact-history-thread";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const turnRef = digestValue("compact-history-turn");
  const requestKey = "compact:history:1";
  const requestDigest = digestValue({method: "thread/compact/start", params: {threadId}});
  const response = {jsonrpc: "2.0", id: 1, result: {}};
  const record = (material) => ({...material, observation_digest: digestValue(material)});
  const append = (observation) => store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation}});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("compact-history-token")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/compact/start", binding_digest: requestDigest,
      thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response, response_digest: digestValue(response)}}).ok, true);
  const history = record({kind: "compaction-history-verified", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    history_response_digest: digestValue("private history response"),
    item_ref: digestValue("private compact item"), turn_status: "completed"});
  assert.equal(append(history).ok, false, "history alone cannot bind a compact turn");
  const accepted = record({kind: "compaction-turn-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    response_digest: digestValue(response), event_digest: digestValue("native start")});
  assert.equal(append(accepted).ok, true);
  const {observation_digest: _observationDigest, ...historyMaterial} = history;
  assert.equal(append(record({...historyMaterial, turn_ref: digestValue("foreign turn")})).ok, false);
  assert.equal(append(history).ok, true);
  const faultMaterial = {schema_version: "are.gateway-session-fault/v1",
    reason_code: "gateway.compaction-history-conflict", thread_ref: threadRef,
    request_key_digest: digestValue(requestKey),
    prior_observation_digest: history.observation_digest,
    new_observation_digest: digestValue("contradictory host response")};
  const fault = {...faultMaterial, fault_digest: digestValue(faultMaterial)};
  assert.equal(store.append({event_kind: "session-fault", consumer_id: consumerId,
    content: {fault}}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: storeId});
  assert.deepEqual(reopened.getSession(consumerId).host_observations.map((item) => item.kind),
    ["compaction-turn-accepted", "compaction-history-verified"]);
  assert.equal(reopened.getSession(consumerId).status, "faulted");
  reopened.close();
});

function lines(stream) {
  let buffer = ""; const queued = []; const waiters = [];
  stream.on("data", (chunk) => { buffer += chunk; let index; while ((index = buffer.indexOf("\n")) >= 0) { const value = JSON.parse(buffer.slice(0, index)); buffer = buffer.slice(index + 1); const waiter = waiters.shift(); if (waiter) waiter(value); else queued.push(value); } });
  return {next: () => queued.length ? Promise.resolve(queued.shift()) : new Promise((resolveValue, reject) => { const timeout = new Error("gateway test timeout"); const timer = setTimeout(() => reject(timeout), 2000); waiters.push((value) => { clearTimeout(timer); resolveValue(value); }); })};
}

async function connect(path, consumerId, token = null) {
  const socket = createConnection(path); const output = lines(socket); await once(socket, "connect");
  socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: consumerId, lane: "plan-bound", ...(process.platform === "win32" ? {connection_token: windowsConnectionToken} : {}), continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, last_acked_sequence: 0, request_aliases: [], ...(token ? {resume_token: token} : {})}})}\n`);
  return {socket, output, receipt: await output.next()};
}

async function createOwnedThread(connection, backend, threadId, gatewayInstance = null) {
  const forwarded = lines(backend.stdin).next();
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 9001, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: `thread:create:${threadId}`}})}\n`);
  const request = await forwarded;
  assert.equal(request.method, "thread/start");
  backend.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: request.id, result: {thread: {id: threadId}}})}\n`);
  const created = await connection.output.next();
  assert.equal(created.message.result.thread.id, threadId);
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA, through_sequence: created.sequence})}\n`);
  if (gatewayInstance) {
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline && (gatewayInstance.inspect().durable_session_index.sessions.find((session) =>
      session.consumer_id === connection.receipt.consumer_id)?.acknowledged_through ?? 0) < created.sequence) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 10));
    }
    assert.equal(gatewayInstance.inspect().durable_session_index.sessions.find((session) =>
      session.consumer_id === connection.receipt.consumer_id)?.acknowledged_through, created.sequence);
  }
}

function gateway(path, storePath, children) {
  return createPersistentGateway({listen_path: path, ...(process.platform === "win32" ? {connection_token: windowsConnectionToken} : {}), session_store_path: storePath, wrapper_factory: wrapper, spawn_impl: () => { const value = child(); children.push(value); return value; }});
}

test("guarded Codex restart refuses a live prior backend and resumes after its verified exit", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-backend-guard-");
  const socketPath = gatewayPath(directory);
  const storePath = resolve(directory, "sessions.jsonl");
  const token = `guard-test-${randomUUID()}`;
  const oldBackend = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {stdio: "ignore"});
  await once(oldBackend, "spawn");
  const store = createFileGatewaySessionStore({path: storePath, store_id: "are-codex-gateway-sessions:v1"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: "codex:guarded", content: {
    lane: "plan-bound", backend_adapter_id: "codex-app-server/v1", resume_token_digest: digestValue(token),
    backend_process_identity: {host_name: hostname(), process_id: oldBackend.pid},
  }}).ok, true);
  assert.equal(store.append({event_kind: "session-started", consumer_id: "codex:legacy", content: {
    lane: "plan-bound", backend_adapter_id: "codex-app-server/v1", resume_token_digest: digestValue(token),
  }}).ok, true);
  if (backendProcessBirthSupported()) {
    assert.equal(store.append({event_kind: "session-started", consumer_id: "codex:reused", content: {
      lane: "plan-bound", backend_adapter_id: "codex-app-server/v1", resume_token_digest: digestValue(token),
      backend_process_identity: {host_name: hostname(), process_id: process.pid, birth_ref: "0".repeat(64)},
    }}).ok, true);
  }
  assert.equal(store.compact().ok, true);
  assert.deepEqual(store.getSession("codex:guarded").backend_process_identity,
    {host_name: hostname(), process_id: oldBackend.pid});
  store.close();
  const newBackends = [];
  const restarted = createPersistentGateway({listen_path: socketPath,
    ...(process.platform === "win32" ? {connection_token: windowsConnectionToken} : {}),
    session_store_path: storePath, backend_process_guard: "required", wrapper_factory: wrapper,
    spawn_impl: () => { const backend = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"],
      {stdio: ["pipe", "pipe", "pipe"]}); newBackends.push(backend); return backend; }});
  context.after(async () => {
    await restarted.close();
    if (oldBackend.exitCode === null && oldBackend.signalCode === null) oldBackend.kill("SIGKILL");
    for (const backend of newBackends) if (backend.exitCode === null && backend.signalCode === null) backend.kill("SIGKILL");
  });
  await restarted.start();
  const live = await connect(socketPath, "codex:guarded", token);
  assert.equal(live.receipt.reason, "gateway.prior-backend-process-live");
  live.socket.destroy();
  const legacy = await connect(socketPath, "codex:legacy", token);
  assert.equal(legacy.receipt.reason, "gateway.backend-process-identity-missing");
  legacy.socket.destroy();
  assert.equal(newBackends.length, 0, "A rejected restart must not spawn another backend.");
  if (backendProcessBirthSupported()) {
    const reused = await connect(socketPath, "codex:reused", token);
    assert.equal(reused.receipt.ok, true, "A different process birth must not retain a stale PID lock.");
    reused.socket.destroy();
    assert.equal(newBackends.length, 1);
  }
  const exited = once(oldBackend, "exit");
  assert.equal(oldBackend.kill("SIGKILL"), true);
  await exited;
  const resumed = await connect(socketPath, "codex:guarded", token);
  assert.equal(resumed.receipt.ok, true);
  assert.equal(resumed.receipt.resumed, true);
  assert.equal(newBackends.length, backendProcessBirthSupported() ? 2 : 1);
  const recorded = restarted.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "codex:guarded");
  const latestBackend = newBackends.at(-1);
  assert.deepEqual(recorded.backend_process_identity, {host_name: hostname(), process_id: latestBackend.pid,
    ...(backendProcessBirthSupported() ? {birth_ref: backendProcessBirthRef(latestBackend.pid)} : {})});
  resumed.socket.destroy();
});

test("acknowledged-only process guard preserves the legacy unacknowledged client boundary", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-backend-compat-");
  const socketPath = gatewayPath(directory);
  const storePath = resolve(directory, "sessions.jsonl");
  const children = [];
  const instance = createPersistentGateway({listen_path: socketPath,
    ...(process.platform === "win32" ? {connection_token: windowsConnectionToken} : {}),
    session_store_path: storePath, backend_process_guard: "acknowledged-only", wrapper_factory: wrapper,
    spawn_impl: () => { const value = child(); children.push(value); return value; }});
  context.after(async () => { await instance.close(); });
  await instance.start();
  const socket = createConnection(socketPath);
  const output = lines(socket);
  await once(socket, "connect");
  socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: "codex:legacy-client",
    lane: "plan-bound", ...(process.platform === "win32" ? {connection_token: windowsConnectionToken} : {})})}\n`);
  const receipt = await output.next();
  assert.equal(receipt.ok, true);
  assert.equal(children.length, 1);
  assert.equal(instance.inspect().durable_session_index.sessions.length, 0,
    "The legacy path remains non-resumable and cannot be counted as guarded recovery evidence.");
  socket.destroy();
});

test("file session store is hash chained, fsynced, and single writer", () => {
  const directory = mkdtempSync("/tmp/are-gateway-store-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:test"});
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "active");
  store.append({event_kind: "session-started", consumer_id: "codex:test", content: {lane: "plan-bound", resume_token_digest: "digest"}});
  store.append({event_kind: "dispatch-intent", consumer_id: "codex:test", content: {request_key: "turn:1", method: "turn/start", binding_digest: "binding"}});
  assert.throws(() => createFileGatewaySessionStore({path, store_id: "gateway-store:test"}), /writer-lock-held/);
  assert.equal(store.inspect().sessions[0].requests[0].status, "outcome-unknown");
  store.close();
  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:test"});
  assert.equal(recovered.inspect().event_count, 2);
  assert.equal(readFileSync(path, "utf8").trim().split("\n").length, 2);
  recovered.close();
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "missing");
});

test("accepted thread creation and verified recovery survive file compaction and reopen", () => {
  const directory = mkdtempSync("/tmp/are-gateway-creation-recovery-");
  const path = resolve(directory, "sessions.jsonl");
  const storeId = "gateway-store:creation-recovery-file";
  const consumerId = "codex:creation-recovery-file";
  const requestKey = "thread:creation-recovery-file";
  const threadId = "private-created-thread";
  const requestDigest = digestValue("private creation request");
  const store = createFileGatewaySessionStore({path, store_id: storeId});
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("private token")}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "thread/start", binding_digest: requestDigest,
      thread_ref: null}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: `backend-thread:${digestValue(threadId)}`}}).ok, true);
  const acceptanceMaterial = {request_key: requestKey, request_digest: requestDigest,
    thread_id: threadId, response_digest: digestValue("private accepted response")};
  const acceptance = {...acceptanceMaterial, acceptance_digest: digestValue(acceptanceMaterial)};
  assert.equal(store.append({event_kind: "thread-creation-accepted", consumer_id: consumerId,
    content: acceptance}).ok, true);
  const history = {request_key: requestKey, request_digest: requestDigest,
    thread_id: threadId, acceptance_digest: acceptance.acceptance_digest,
    history_response_digest: digestValue("private empty host history")};
  assert.equal(store.append({event_kind: "thread-creation-history-verified", consumer_id: consumerId,
    content: history}).ok, true);
  const receiptMaterial = {schema_version: "are.gateway-thread-creation-recovery/v1",
    request_key: requestKey, request_digest: requestDigest, thread_id: threadId,
    acceptance_digest: acceptance.acceptance_digest,
    history_response_digest: history.history_response_digest, authority_effect: "none"};
  const receipt = {...receiptMaterial, receipt_digest: digestValue(receiptMaterial)};
  assert.equal(store.append({event_kind: "thread-creation-recovered", consumer_id: consumerId,
    content: receipt}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: storeId});
  const request = reopened.getSession(consumerId).requests[0];
  assert.equal(request.status, "recovered");
  assert.equal(request.creation_acceptance.thread_id, threadId);
  assert.equal(request.creation_history.history_response_digest, history.history_response_digest);
  assert.equal(request.recovery.receipt_digest, receipt.receipt_digest);
  assert.deepEqual(reopened.append({event_kind: "thread-creation-recovered", consumer_id: consumerId,
    content: receipt}).reason_codes, ["gateway.session-store-creation-recovery-invalid"]);
  reopened.close();
});

test("bound native completion witness survives compaction without turn content", () => {
  const directory = mkdtempSync("/tmp/are-gateway-completion-witness-");
  const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:completion-witness"});
  const consumerId = "codex:completion-witness";
  const threadRef = `backend-thread:${digestValue("private-thread")}`;
  const turnRef = digestValue("private-turn");
  const requestKey = "turn:completion-witness";
  const requestDigest = digestValue("private request binding");
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("private resume token")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: threadRef}}).ok, true);
  const acceptanceMaterial = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    response_digest: digestValue("private acceptance")};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...acceptanceMaterial,
      observation_digest: digestValue(acceptanceMaterial)}}}).ok, true);
  const completionMaterial = {kind: "turn-completion-observed", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: requestDigest,
    event_digest: digestValue("private completion notification"), turn_status: "completed"};
  const completion = {...completionMaterial, observation_digest: digestValue(completionMaterial)};
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...completion, turn_status: "interrupted"}}}).reason_codes,
  ["gateway.session-store-host-observation-invalid"]);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: completion}}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:completion-witness"});
  assert.equal(reopened.getSession(consumerId).host_observations.find((entry) =>
    entry.kind === "turn-completion-observed")?.observation_digest, completion.observation_digest);
  assert.doesNotMatch(JSON.stringify(reopened.getSession(consumerId).host_observations),
    /private-thread|private-turn|private completion notification/);
  reopened.close();
});

test("a host-history conflict remains faulted through compaction and reopen", () => {
  const directory = mkdtempSync("/tmp/are-gateway-fault-");
  const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:fault"});
  const consumerId = "codex:fault";
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const requestKey = "turn:fault";
  const requestDigest = "b".repeat(64);
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("fault-token")}}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: threadRef}}).ok, true);
  const observationMaterial = {kind: "turn-start-accepted", thread_ref: threadRef,
    turn_ref: "c".repeat(64), request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, response_digest: "d".repeat(64)};
  const observation = {...observationMaterial, observation_digest: digestValue(observationMaterial)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation}}).ok, true);
  const audit = {audit_ref: "f".repeat(64), thread_ref: threadRef};
  assert.equal(store.append({event_kind: "history-audit-started", consumer_id: consumerId,
    content: {audit}}).ok, true);
  const faultMaterial = {schema_version: "are.gateway-session-fault/v1",
    reason_code: "gateway.turn-history-status-conflict", thread_ref: threadRef,
    request_key_digest: digestValue(requestKey), prior_observation_digest: observation.observation_digest,
    new_observation_digest: "e".repeat(64)};
  const fault = {...faultMaterial, fault_digest: digestValue(faultMaterial)};
  assert.equal(store.append({event_kind: "session-fault", consumer_id: consumerId,
    content: {fault}}).ok, true);
  assert.equal(store.getSession(consumerId).status, "faulted");
  assert.equal(store.hasFaultedSession(), true);
  assert.deepEqual(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
      resume_token_digest: digestValue("fault-token")}}).reason_codes,
  ["gateway.session-store-faulted"]);
  assert.deepEqual(store.append({event_kind: "session-closed", consumer_id: consumerId}).reason_codes,
    ["gateway.session-store-faulted"]);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:fault"});
  assert.equal(reopened.getSession(consumerId).status, "faulted");
  assert.equal(reopened.hasFaultedSession(), true);
  assert.deepEqual(reopened.getSession(consumerId).fault, fault);
  assert.deepEqual(reopened.getSession(consumerId).pending_history_audits, [audit]);
  reopened.close();
});

test("an unfinished history audit survives compaction and prevents session reopening", () => {
  const directory = mkdtempSync("/tmp/are-gateway-history-audit-");
  const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:history-audit"});
  const consumerId = "codex:history-audit";
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const marker = `are-gateway-client:${"b".repeat(32)}`;
  const requestKey = "turn:history-audit";
  const requestDigest = "c".repeat(64);
  const sessionStart = {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
    resume_token_digest: digestValue("private-audit-token")};
  assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: sessionStart}).ok, true);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: requestDigest,
      thread_ref: threadRef, client_message_id: marker}}).ok, true);
  const material = {kind: "turn-marker-observed", thread_ref: threadRef,
    turn_ref: "d".repeat(64), request_key_digest: digestValue(requestKey),
    request_digest: requestDigest, client_message_id_digest: digestValue(marker),
    history_response_digest: "e".repeat(64), turn_status: "completed"};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...material, observation_digest: digestValue(material)}}}).ok, true);
  const audit = {audit_ref: "f".repeat(64), thread_ref: threadRef};
  assert.equal(store.append({event_kind: "history-audit-started", consumer_id: consumerId,
    content: {audit}}).ok, true);
  assert.deepEqual(store.getSession(consumerId).pending_history_audits, [audit]);
  assert.deepEqual(store.append({event_kind: "session-started", consumer_id: consumerId,
    content: sessionStart}).reason_codes, ["gateway.session-store-history-audit-incomplete"]);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:history-audit"});
  assert.deepEqual(reopened.getSession(consumerId).pending_history_audits, [audit]);
  assert.deepEqual(reopened.append({event_kind: "history-audit-completed", consumer_id: consumerId,
    content: {audit: {...audit, audit_ref: "0".repeat(64)}}}).reason_codes,
  ["gateway.session-store-history-audit-invalid"]);
  assert.equal(reopened.append({event_kind: "history-audit-completed", consumer_id: consumerId,
    content: {audit}}).ok, true);
  assert.deepEqual(reopened.getSession(consumerId).pending_history_audits, []);
  reopened.close();
});

test("durable dispatch intent never replaces an earlier request key", () => {
  const directory = mkdtempSync("/tmp/are-gateway-intent-replay-");
  const path = resolve(directory, "sessions.jsonl");
  const storeId = "gateway-store:intent-replay";
  const consumerId = "codex:intent-replay";
  let store = createFileGatewaySessionStore({path, store_id: storeId});
  try {
    assert.equal(store.append({event_kind: "session-started", consumer_id: consumerId,
      content: {lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1",
        resume_token_digest: digestValue("intent-replay-token")}}).ok, true);
    const first = {request_key: "same-key", method: "turn/start",
      binding_digest: digestValue("first-binding")};
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: first}).ok, true);
    const duplicate = store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: {...first, binding_digest: digestValue("forged-second-binding")}});
    assert.equal(duplicate.ok, false);
    assert.deepEqual(duplicate.reason_codes, ["gateway.session-store-dispatch-intent-invalid"]);
    assert.equal(store.getSession(consumerId).requests[0].binding_digest, first.binding_digest);
    assert.equal(store.compact().ok, true);
    store.close();
    store = createFileGatewaySessionStore({path, store_id: storeId});
    assert.equal(store.getSession(consumerId).requests[0].binding_digest, first.binding_digest);
    assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
      content: first}).ok, false);
  } finally {
    store.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("gateway-owned client marker is unique, durable, and preserved by compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-client-marker-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:client-marker"});
  const consumerId = "codex:client-marker";
  const marker = `are-gateway-client:${"a".repeat(32)}`;
  const intent = {request_key: "turn:marked", method: "turn/start", binding_digest: "b".repeat(64),
    thread_ref: `backend-thread:${"c".repeat(64)}`, client_message_id: marker};
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: intent.thread_ref}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId, content: intent}).ok, true);
  assert.deepEqual(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {...intent, request_key: "turn:duplicate"}}).reason_codes,
  ["gateway.session-store-dispatch-intent-invalid"]);
  assert.deepEqual(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {...intent, request_key: "turn:malformed", client_message_id: "client supplied"}}).reason_codes,
  ["gateway.session-store-dispatch-intent-invalid"]);
  assert.deepEqual(store.append({event_kind: "session-checkpoint", consumer_id: consumerId,
    content: {session: {...store.getSession(consumerId), requests: [{...store.getSession(consumerId).requests[0],
      client_message_id: "client supplied"}]}}}).reason_codes,
  ["gateway.session-store-checkpoint-client-markers-invalid"]);
  const material = {kind: "turn-marker-observed", thread_ref: intent.thread_ref,
    turn_ref: "d".repeat(64), request_key_digest: digestValue(intent.request_key),
    request_digest: intent.binding_digest, client_message_id_digest: digestValue(marker),
    history_response_digest: "e".repeat(64), turn_status: "completed"};
  const observation = {...material, observation_digest: digestValue(material)};
  const wrongMaterial = {...material, client_message_id_digest: "f".repeat(64)};
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...wrongMaterial, observation_digest: digestValue(wrongMaterial)}}}).reason_codes,
  ["gateway.session-store-marker-observation-unbound"]);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation}}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:client-marker"});
  assert.equal(reopened.getSession(consumerId).requests[0].client_message_id, marker);
  assert.equal(reopened.getSession(consumerId).requests[0].status, "outcome-unknown");
  assert.deepEqual(reopened.getSession(consumerId).host_observations, [observation]);
  reopened.close();
});

test("marked unknown dispatch recovery is durable, bound, and survives compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-dispatch-recovered-");
  const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:dispatch-recovered"});
  const consumerId = "codex:dispatch-recovered";
  const marker = `are-gateway-client:${"a".repeat(32)}`;
  const intent = {request_key: "turn:recovered", method: "turn/start", binding_digest: "b".repeat(64),
    thread_ref: `backend-thread:${"c".repeat(64)}`, client_message_id: marker};
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: intent.thread_ref}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId, content: intent}).ok, true);
  const material = {kind: "turn-marker-observed", thread_ref: intent.thread_ref,
    turn_ref: "d".repeat(64), request_key_digest: digestValue(intent.request_key),
    request_digest: intent.binding_digest, client_message_id_digest: digestValue(marker),
    history_response_digest: "e".repeat(64), turn_status: "completed"};
  const observation = {...material, observation_digest: digestValue(material)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation}}).ok, true);
  const recovery = {request_key: intent.request_key, request_digest: intent.binding_digest,
    thread_ref: intent.thread_ref, turn_ref: material.turn_ref, turn_status: material.turn_status,
    host_observation_digest: observation.observation_digest, semantic_receipt_digest: "f".repeat(64),
    recovery_digest: "1".repeat(64)};
  assert.deepEqual(store.append({event_kind: "dispatch-recovered", consumer_id: consumerId,
    content: {...recovery, turn_ref: "0".repeat(64)}}).reason_codes,
  ["gateway.session-store-dispatch-recovery-invalid"]);
  assert.equal(store.append({event_kind: "dispatch-recovered", consumer_id: consumerId,
    content: recovery}).ok, true);
  assert.equal(store.getSession(consumerId).requests[0].status, "recovered");
  assert.deepEqual(store.append({event_kind: "dispatch-recovered", consumer_id: consumerId,
    content: recovery}).reason_codes, ["gateway.session-store-dispatch-recovery-invalid"]);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:dispatch-recovered"});
  assert.deepEqual(reopened.getSession(consumerId).requests[0].recovery, recovery);
  reopened.close();
});

test("backend adapter identity survives compaction and cannot change within a session", () => {
  const directory = mkdtempSync("/tmp/are-gateway-adapter-store-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:backend-adapter"});
  assert.equal(store.append({event_kind: "session-started", consumer_id: "agent:bound", content: {
    lane: "interaction-bound", backend_adapter_id: "deepseek-harness-headless/v1", resume_token_digest: "digest",
  }}).ok, true);
  assert.equal(store.getSession("agent:bound").backend_adapter_id, "deepseek-harness-headless/v1");
  assert.equal(store.append({event_kind: "session-started", consumer_id: "agent:bound", content: {
    lane: "interaction-bound", backend_adapter_id: "codex-app-server/v1", resume_token_digest: "digest",
  }}).reason_codes[0], "gateway.session-store-backend-adapter-mismatch");
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:backend-adapter"});
  assert.equal(reopened.getSession("agent:bound").backend_adapter_id, "deepseek-harness-headless/v1");
  reopened.close();
});

test("file session store recovers a verified lock left by a terminated writer", () => {
  const directory = mkdtempSync("/tmp/are-gateway-crash-lock-"); const path = resolve(directory, "sessions.jsonl");
  const moduleUrl = new URL("../index.mjs", import.meta.url).href;
  const script = `const {createFileGatewaySessionStore} = await import(${JSON.stringify(moduleUrl)}); const store = createFileGatewaySessionStore({path: ${JSON.stringify(path)}, store_id: "gateway-store:crash"}); store.append({event_kind: "session-started", consumer_id: "codex:crash", content: {lane: "plan-bound", resume_token_digest: "digest"}});`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {encoding: "utf8"});
  assert.equal(child.status, 0, child.stderr);
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "stale-candidate");
  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:crash"});
  assert.equal(recovered.inspect().event_count, 1);
  assert.equal(recovered.getSession("codex:crash").status, "active");
  recovered.close();
});

test("gateway startup reclaims a terminated session-store owner before accepting a client", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-crash-start-"); const path = resolve(directory, "sessions.jsonl");
  const moduleUrl = new URL("../index.mjs", import.meta.url).href;
  const script = `const {createFileGatewaySessionStore} = await import(${JSON.stringify(moduleUrl)}); createFileGatewaySessionStore({path: ${JSON.stringify(path)}, store_id: "are-codex-gateway-sessions:v1"});`;
  const childProcess = spawnSync(process.execPath, ["--input-type=module", "-e", script], {encoding: "utf8"});
  assert.equal(childProcess.status, 0, childProcess.stderr);
  const children = []; const running = gateway(gatewayPath(directory), path, children);
  await running.start();
  context.after(() => running.close());
  const client = await connect(running.inspect().listen_path, "codex:recovered-start");
  assert.equal(client.receipt.ok, true);
  client.socket.destroy();
});

test("legacy or ambiguous session-store locks remain fail-closed", () => {
  const directory = mkdtempSync("/tmp/are-gateway-legacy-lock-"); const path = resolve(directory, "sessions.jsonl");
  writeFileSync(`${path}.writer.lock`, "", {flag: "wx"});
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "unreadable");
  assert.throws(() => createFileGatewaySessionStore({path}), /writer-lock-unreadable/);
});

test("an interrupted recovery marker blocks stale-lock reclamation", () => {
  const directory = mkdtempSync("/tmp/are-gateway-recovery-marker-"); const path = resolve(directory, "sessions.jsonl");
  const moduleUrl = new URL("../index.mjs", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `const {createFileGatewaySessionStore} = await import(${JSON.stringify(moduleUrl)}); createFileGatewaySessionStore({path: ${JSON.stringify(path)}});`], {encoding: "utf8"});
  assert.equal(child.status, 0, child.stderr);
  const marker = `${path}.writer.lock.recovery.lock`;
  writeFileSync(marker, "", {flag: "wx"});
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).recovery_marker_present, true);
  assert.throws(() => createFileGatewaySessionStore({path}), /writer-lock-recovery-held/);
  unlinkSync(`${path}.writer.lock`);
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "recovery-interrupted");
  assert.throws(() => createFileGatewaySessionStore({path}), /writer-lock-recovery-held/);
  unlinkSync(marker);
  const recovered = createFileGatewaySessionStore({path});
  recovered.close();
});

test("a modified dead-writer record cannot authorize reclamation", () => {
  const directory = mkdtempSync("/tmp/are-gateway-tampered-lock-"); const path = resolve(directory, "sessions.jsonl");
  const moduleUrl = new URL("../index.mjs", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `const {createFileGatewaySessionStore} = await import(${JSON.stringify(moduleUrl)}); createFileGatewaySessionStore({path: ${JSON.stringify(path)}});`], {encoding: "utf8"});
  assert.equal(child.status, 0, child.stderr);
  const lockPath = `${path}.writer.lock`;
  const record = JSON.parse(readFileSync(lockPath, "utf8"));
  writeFileSync(lockPath, `${JSON.stringify({...record, nonce: "tampered"})}\n`);
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path}).disposition, "invalid-or-foreign");
  assert.throws(() => createFileGatewaySessionStore({path}), /writer-lock-invalid/);
});

test("file session store recovers only unacknowledged sequenced deliveries", () => {
  const directory = mkdtempSync("/tmp/are-gateway-delivery-store-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:deliveries"});
  store.append({event_kind: "session-started", consumer_id: "codex:delivery", content: {lane: "interaction-bound", resume_token_digest: "digest"}});
  for (const sequence of [1, 2]) {
    store.append({event_kind: "delivery-enqueued", consumer_id: "codex:delivery", content: {delivery: {schema_version: "are.codex-gateway-delivery/v1", sequence, message: {jsonrpc: "2.0", method: "item/agentMessage/delta", params: {delta: String(sequence)}}, authority_effect: "none"}}});
  }
  store.append({event_kind: "delivery-acknowledged", consumer_id: "codex:delivery", content: {through_sequence: 1}});
  store.close();

  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:deliveries"});
  const session = recovered.getSession("codex:delivery");
  assert.equal(session.delivery_sequence, 2);
  assert.equal(session.acknowledged_through, 1);
  assert.deepEqual(session.deliveries.map((delivery) => delivery.sequence), [2]);
  recovered.close();
});

test("session-store compaction atomically preserves live recovery state and bounds replay", () => {
  const directory = mkdtempSync("/tmp/are-gateway-compact-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:compact"});
  store.append({event_kind: "session-started", consumer_id: "codex:compact", content: {lane: "plan-bound", resume_token_digest: "digest"}});
  store.append({event_kind: "dispatch-intent", consumer_id: "codex:compact", content: {request_key: "turn:1", method: "turn/start", binding_digest: "binding"}});
  store.append({event_kind: "dispatch-outcome", consumer_id: "codex:compact", content: {request_key: "turn:1", response: {ok: true}}});
  const compacted = store.compact();
  assert.equal(compacted.ok, true);
  assert.equal(compacted.event_count, 1);
  assert.equal(readFileSync(path, "utf8").trim().split("\n").length, 1);
  store.close();
  const recovered = createFileGatewaySessionStore({path, store_id: "gateway-store:compact"});
  assert.equal(recovered.getSession("codex:compact").requests[0].status, "complete");
  recovered.close();
});

test("session-store byte ceiling fails closed without a partial record", () => {
  const directory = mkdtempSync("/tmp/are-gateway-quota-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:quota", maximum_bytes: 1024});
  const first = store.append({event_kind: "session-started", consumer_id: "codex:quota", content: {lane: "plan-bound", resume_token_digest: "digest"}});
  assert.equal(first.ok, true);
  let blocked;
  for (let index = 0; index < 20 && blocked?.ok !== false; index += 1) blocked = store.append({event_kind: "dispatch-intent", consumer_id: "codex:quota", content: {request_key: `turn:${index}`, method: "turn/start", binding_digest: "x".repeat(64)}});
  assert.equal(blocked.ok, false);
  assert.match(blocked.reason_codes[0], /byte-limit/);
  store.close();
  const source = readFileSync(path, "utf8");
  assert.equal(source.endsWith("\n"), true);
});

test("backend-thread claims reject a second consumer before disk mutation and survive compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-thread-owner-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:owners"});
  const ref = `backend-thread:${"a".repeat(64)}`;
  for (const consumer_id of ["codex:owner", "codex:contender"]) {
    assert.equal(store.append({event_kind: "session-started", consumer_id, content: {lane: "plan-bound", resume_token_digest: "digest"}}).ok, true);
  }
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: "codex:owner", content: {thread_ref: ref}}).ok, true);
  const before = readFileSync(path, "utf8");
  assert.deepEqual(store.append({event_kind: "thread-bound", consumer_id: "codex:contender", content: {thread_ref: ref}}).reason_codes, ["gateway.session-store-thread-owner-conflict"]);
  assert.deepEqual(store.append({event_kind: "thread-bound", consumer_id: "codex:contender", content: {thread_ref: "raw-thread-id"}}).reason_codes, ["gateway.session-store-thread-ref-invalid"]);
  assert.equal(readFileSync(path, "utf8"), before);
  assert.deepEqual(store.getSession("codex:owner").thread_refs, [ref]);
  assert.deepEqual(store.getSession("codex:contender").thread_refs, []);
  assert.equal(store.compact().ok, true);
  store.close();

  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:owners"});
  assert.deepEqual(reopened.getSession("codex:owner").thread_refs, [ref]);
  assert.deepEqual(reopened.append({event_kind: "thread-bound", consumer_id: "codex:contender", content: {thread_ref: ref}}).reason_codes, ["gateway.session-store-thread-owner-conflict"]);
  reopened.close();
});

test("host observations require an owned thread and retain content-free receipts after restart", () => {
  const directory = mkdtempSync("/tmp/are-gateway-host-observation-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:host-observations"});
  const threadRef = `backend-thread:${"b".repeat(64)}`;
  const material = {kind: "steer-accepted", thread_ref: threadRef, turn_ref: "c".repeat(64), request_digest: "d".repeat(64), response_digest: "e".repeat(64)};
  const observation = {...material, observation_digest: digestValue(material)};
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: "codex:observer", content: {observation}}).reason_codes, ["gateway.session-store-host-observation-unbound"]);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: "codex:observer", content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: "codex:observer", content: {observation}}).ok, true);
  const before = readFileSync(path, "utf8");
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: "codex:observer", content: {observation: {...observation, response_digest: "f".repeat(64)}}}).reason_codes, ["gateway.session-store-host-observation-invalid"]);
  assert.equal(readFileSync(path, "utf8"), before);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:host-observations"});
  assert.deepEqual(reopened.getSession("codex:observer").host_observations, [observation]);
  reopened.close();
});

test("keyed steering acceptance is bound to the exact durable request", () => {
  const store = createMemoryGatewaySessionStore({store_id: "gateway-store:keyed-steer-observation"});
  const consumerId = "codex:keyed-steer-observation";
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const requestKey = "steer:bound";
  const bindingDigest = "b".repeat(64);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/steer",
      binding_digest: bindingDigest, thread_ref: threadRef}}).ok, true);
  const material = {kind: "steer-accepted", thread_ref: threadRef, turn_ref: "c".repeat(64),
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    response_digest: "d".repeat(64)};
  const wrong = {...material, request_key_digest: "e".repeat(64)};
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...wrong, observation_digest: digestValue(wrong)}}}).reason_codes,
  ["gateway.session-store-steer-acceptance-unbound"]);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...material, observation_digest: digestValue(material)}}}).ok, true);
  store.close();
});

test("turn-start acceptance is bound to one durable request and survives compaction", () => {
  const directory = mkdtempSync("/tmp/are-gateway-turn-acceptance-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:turn-acceptance"});
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const requestKey = "turn:accepted";
  const bindingDigest = "b".repeat(64);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: "codex:accepted", content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: "codex:accepted",
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest, thread_ref: threadRef}}).ok, true);
  const material = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: "c".repeat(64),
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest, response_digest: "d".repeat(64)};
  const observation = {...material, observation_digest: digestValue(material)};
  const before = readFileSync(path, "utf8");
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: "codex:other", content: {observation}}).reason_codes,
    ["gateway.session-store-host-observation-unbound"]);
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: "codex:accepted",
    content: {observation: {...observation, request_key_digest: "f".repeat(64), observation_digest: digestValue({...material, request_key_digest: "f".repeat(64)})}}}).reason_codes,
    ["gateway.session-store-host-observation-request-unbound"]);
  assert.equal(readFileSync(path, "utf8"), before);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: "codex:accepted", content: {observation}}).ok, true);
  assert.equal(store.getSession("codex:accepted").requests[0].status, "outcome-unknown",
    "Host acceptance is not a completed gateway outcome.");
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:turn-acceptance"});
  assert.deepEqual(reopened.getSession("codex:accepted").host_observations, [observation]);
  assert.equal(reopened.getSession("codex:accepted").requests[0].status, "outcome-unknown");
  reopened.close();
});

test("host-history verification requires prior acceptance and keeps unknown dispatch after reopen", () => {
  const directory = mkdtempSync("/tmp/are-gateway-turn-history-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:turn-history"});
  const consumerId = "codex:history";
  const requestKey = "turn:history";
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const bindingDigest = "b".repeat(64);
  const turnRef = "c".repeat(64);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest, thread_ref: threadRef}}).ok, true);
  const historyMaterial = {kind: "turn-history-verified", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    history_response_digest: "d".repeat(64), turn_status: "completed"};
  const history = {...historyMaterial, observation_digest: digestValue(historyMaterial)};
  assert.deepEqual(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: history}}).reason_codes, ["gateway.session-store-host-history-unbound"]);
  const acceptanceMaterial = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest, response_digest: "e".repeat(64)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...acceptanceMaterial, observation_digest: digestValue(acceptanceMaterial)}}}).ok, true);
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: history}}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:turn-history"});
  assert.equal(reopened.getSession(consumerId).requests[0].status, "outcome-unknown");
  assert.deepEqual(reopened.getSession(consumerId).host_observations.at(-1), history);
  reopened.close();
});

test("accepted turn history remains verifiable after the turn/start response was settled", () => {
  const directory = mkdtempSync("/tmp/are-gateway-settled-turn-history-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:settled-turn-history"});
  const consumerId = "codex:settled-history";
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const turnRef = "c".repeat(64);
  const requestKey = "turn:settled-history";
  const bindingDigest = "b".repeat(64);
  assert.equal(store.append({event_kind: "thread-bound", consumer_id: consumerId,
    content: {thread_ref: threadRef}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: consumerId,
    content: {request_key: requestKey, method: "turn/start", binding_digest: bindingDigest, thread_ref: threadRef}}).ok, true);
  const acceptance = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    response_digest: "d".repeat(64)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...acceptance, observation_digest: digestValue(acceptance)}}}).ok, true);
  assert.equal(store.append({event_kind: "dispatch-outcome", consumer_id: consumerId,
    content: {request_key: requestKey, response: {jsonrpc: "2.0", id: 1, result: {turn: {id: "private-host-turn"}}}}}).ok, true);
  assert.equal(store.getSession(consumerId).requests[0].status, "complete");
  const history = {kind: "turn-history-verified", thread_ref: threadRef, turn_ref: turnRef,
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest,
    history_response_digest: "e".repeat(64), turn_status: "interrupted"};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: consumerId,
    content: {observation: {...history, observation_digest: digestValue(history)}}}).ok, true);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:settled-turn-history"});
  assert.equal(reopened.getSession(consumerId).requests[0].status, "complete");
  assert.equal(reopened.getSession(consumerId).host_observations.at(-1).turn_status, "interrupted");
  reopened.close();
});

test("acceptance retention prunes only settled turns and preserves unresolved host acceptance", () => {
  const directory = mkdtempSync("/tmp/are-gateway-acceptance-retention-"); const path = resolve(directory, "sessions.jsonl");
  const store = createFileGatewaySessionStore({path, store_id: "gateway-store:acceptance-retention"});
  const threadRef = `backend-thread:${"a".repeat(64)}`;
  const requests = [];
  const hostObservations = [];
  for (let index = 0; index < 255; index += 1) {
    const requestKey = `turn:${index}`;
    const bindingDigest = digestValue({requestKey});
    requests.push({request_key: requestKey, method: "turn/start", binding_digest: bindingDigest,
      thread_ref: threadRef, status: index === 0 ? "outcome-unknown" : "complete"});
    const material = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: digestValue(`host-turn:${index}`),
      request_key_digest: digestValue(requestKey), request_digest: bindingDigest, response_digest: digestValue(`response:${index}`)};
    hostObservations.push({...material, observation_digest: digestValue(material)});
  }
  const settled = hostObservations[1];
  const completionMaterial = {kind: "turn-completion-observed", thread_ref: threadRef,
    turn_ref: settled.turn_ref, request_key_digest: settled.request_key_digest,
    request_digest: settled.request_digest, event_digest: digestValue("completed:1"),
    turn_status: "completed"};
  hostObservations.push({...completionMaterial, observation_digest: digestValue(completionMaterial)});
  assert.equal(store.append({event_kind: "session-checkpoint", consumer_id: "codex:retention", content: {session: {
    consumer_id: "codex:retention", lane: "interaction-bound", resume_token_digest: null, status: "active",
    acknowledged_through: 0, delivery_sequence: 0, deliveries: [], requests, server_requests: [],
    thread_refs: [threadRef], host_observations: hostObservations, expiration: null,
  }}}).ok, true);
  const newRequestKey = "turn:255";
  const newBindingDigest = digestValue({requestKey: newRequestKey});
  assert.equal(store.append({event_kind: "dispatch-intent", consumer_id: "codex:retention",
    content: {request_key: newRequestKey, method: "turn/start", binding_digest: newBindingDigest, thread_ref: threadRef}}).ok, true);
  const nextMaterial = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: digestValue("host-turn:255"),
    request_key_digest: digestValue(newRequestKey), request_digest: newBindingDigest, response_digest: digestValue("response:255")};
  const nextObservation = {...nextMaterial, observation_digest: digestValue(nextMaterial)};
  assert.equal(store.append({event_kind: "host-observation", consumer_id: "codex:retention", content: {observation: nextObservation}}).ok, true);
  const retained = store.getSession("codex:retention").host_observations;
  assert.equal(retained.length, 256);
  assert.equal(retained.some((entry) => entry.observation_digest === hostObservations[0].observation_digest), true,
    "Unresolved host acceptance must not be pruned.");
  assert.equal(retained.some((entry) => entry.observation_digest === hostObservations[1].observation_digest), false,
    "The oldest settled host acceptance can be pruned.");
  assert.equal(retained.at(-1).observation_digest, nextObservation.observation_digest);
  assert.equal(store.compact().ok, true);
  store.close();
  const reopened = createFileGatewaySessionStore({path, store_id: "gateway-store:acceptance-retention"});
  assert.deepEqual(reopened.getSession("codex:retention").host_observations, retained);
  reopened.close();
});

test("gateway restart authenticates and replays a durable completed request exactly once", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-restart-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:restart"); const token = connection.receipt.continuity.resume_token;
  await createOwnedThread(connection, firstChildren[0], "thread-1");
  assert.equal(first.inspect().durable_session_index.sessions.find((entry) => entry.consumer_id === "codex:restart")?.thread_refs?.length, 1);
  const request = {jsonrpc: "2.0", id: 1, method: "turn/start", params: safeTurnParams("thread-1"), [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:durable"}};
  connection.socket.write(`${JSON.stringify(request)}\n`);
  const upstream = await lines(firstChildren[0].stdin).next();
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: upstream.id, result: {turn: {id: "turn-1"}}})}\n`);
  assert.equal((await connection.output.next()).message.result.turn.id, "turn-1");
  await first.close(); connection.socket.destroy();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:restart", token);
  assert.equal(resumed.receipt.ok, true);
  assert.equal(resumed.receipt.continuity.resume_token, token);
  assert.equal(resumed.receipt.continuity.resume_token_digest, connection.receipt.continuity.resume_token_digest);
  resumed.socket.write(`${JSON.stringify({...request, id: 99})}\n`);
  const replay = await resumed.output.next();
  assert.equal(replay.message.id, 99);
  assert.equal(replay.message.result.turn.id, "turn-1");
  assert.equal(secondChildren[0].stdin.readableLength, 0);
  resumed.socket.destroy(); await second.close();
});

test("gateway restart retains the backend-thread owner against another consumer", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-owner-restart-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const owner = await connect(socketPath, "codex:durable-owner");
  await createOwnedThread(owner, firstChildren[0], "restart-owned-thread");
  owner.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "turn/start", params: safeTurnParams("restart-owned-thread"), [GATEWAY_REQUEST_META_KEY]: {request_key: "owner:1"}})}\n`);
  assert.equal((await lines(firstChildren[0].stdin).next()).method, "turn/start");
  owner.socket.destroy(); await first.close();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const contender = await connect(socketPath, "codex:after-restart-contender");
  contender.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "turn/start", params: safeTurnParams("restart-owned-thread"), [GATEWAY_REQUEST_META_KEY]: {request_key: "contender:1"}})}\n`);
  assert.deepEqual((await contender.output.next()).message.error.data.reason_codes, ["gateway.thread-owned-by-other-consumer"]);
  assert.equal(secondChildren[0].stdin.readableLength, 0);
  contender.socket.destroy(); await second.close();
});

test("gateway restart reinitializes the new backend before forwarding later requests", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-reinitialize-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:reinitialize-after-restart"); const token = connection.receipt.continuity.resume_token;
  const initialize = {jsonrpc: "2.0", id: 1, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}, [GATEWAY_REQUEST_META_KEY]: {request_key: "initialize:durable"}};
  connection.socket.write(`${JSON.stringify(initialize)}\n`);
  const firstInitialize = await lines(firstChildren[0].stdin).next();
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: firstInitialize.id, result: {ready: "first"}})}\n`);
  const firstDelivery = await connection.output.next();
  assert.equal(firstDelivery.message.result.ready, "first");
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: firstDelivery.sequence})}\n`);
  const ackDeadline = Date.now() + 2000;
  while (Date.now() < ackDeadline && (first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:reinitialize-after-restart")?.acknowledged_through ?? 0)
      < firstDelivery.sequence) {
    await new Promise(done => setTimeout(done, 10));
  }
  assert.equal(first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:reinitialize-after-restart")?.acknowledged_through,
  firstDelivery.sequence);
  await first.close(); connection.socket.destroy();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:reinitialize-after-restart", token);
  resumed.socket.write(`${JSON.stringify({...initialize, id: 2})}\n`);
  const secondInitialize = await lines(secondChildren[0].stdin).next();
  assert.equal(secondInitialize.method, "initialize");
  secondChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: secondInitialize.id, result: {ready: "second"}})}\n`);
  assert.equal((await resumed.output.next()).message.result.ready, "second");

  const turn = {jsonrpc: "2.0", id: 3, method: "thread/start", params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"}, [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:after-reinitialize"}};
  resumed.socket.write(`${JSON.stringify(turn)}\n`);
  assert.equal((await lines(secondChildren[0].stdin).next()).method, "thread/start");
  resumed.socket.destroy(); await second.close();
});

test("gateway restart blocks a request whose crash-time outcome is unknown", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-unknown-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:unknown"); const token = connection.receipt.continuity.resume_token;
  await createOwnedThread(connection, firstChildren[0], "thread-1");
  const request = {jsonrpc: "2.0", id: 1, method: "turn/start", params: safeTurnParams("thread-1"), [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:unknown"}};
  connection.socket.write(`${JSON.stringify(request)}\n`); await lines(firstChildren[0].stdin).next();
  await first.close(); connection.socket.destroy();
  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:unknown", token); resumed.socket.write(`${JSON.stringify({...request, id: 2})}\n`);
  const blocked = await resumed.output.next();
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.dispatch-outcome-unknown"]);
  resumed.socket.write(`${JSON.stringify({...request, id: 3,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:new-key-after-unknown"}})}\n`);
  const secondBlocked = await resumed.output.next();
  assert.deepEqual(secondBlocked.message.error.data.reason_codes, ["gateway.session-outcome-unknown"]);
  assert.equal(secondChildren[0].stdin.readableLength, 0, "A new request key must not bypass unknown delivery.");
  resumed.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 4, method: "thread/read",
    params: {threadId: "thread-1", includeTurns: false},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:diagnostic-read"}})}\n`);
  assert.equal((await lines(secondChildren[0].stdin).next()).method, "thread/read",
    "Read-only backend inspection remains available for reconciliation.");
  resumed.socket.destroy(); await second.close();
});

test("gateway restart quarantines an unknown thread creation without dispatching another", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-unknown-thread-create-");
  const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  const connection = await connect(socketPath, "codex:unknown-thread-create");
  const token = connection.receipt.continuity.resume_token;
  const request = {jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:unknown-create"}};
  connection.socket.write(`${JSON.stringify(request)}\n`);
  assert.equal((await lines(firstChildren[0].stdin).next()).method, "thread/start");
  await first.close(); connection.socket.destroy();

  const secondChildren = []; const second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:unknown-thread-create", token);
  assert.equal(second.observeReasoningThreads().unknown_dispatch_count, 1);
  assert.equal(second.observeReasoningThreads().unknown_thread_creation_count, 1);
  resumed.socket.write(`${JSON.stringify({...request, id: 2})}\n`);
  assert.deepEqual((await resumed.output.next()).message.error.data.reason_codes, ["gateway.dispatch-outcome-unknown"]);
  resumed.socket.write(`${JSON.stringify({...request, id: 3,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:new-key-after-unknown"}})}\n`);
  assert.deepEqual((await resumed.output.next()).message.error.data.reason_codes, ["gateway.session-outcome-unknown"]);
  assert.equal(secondChildren[0].stdin.readableLength, 0, "An unknown creation cannot be sent to the new backend twice.");
  resumed.socket.destroy(); await second.close();
});

test("SIGKILL after a forwarded turn preserves unknown delivery and denies redispatch", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-sigkill-");
  const firstSocketPath = gatewayPath(directory);
  const restartedSocketPath = process.platform === "win32" ? gatewayPath(directory) : resolve(directory, "restarted.sock");
  const storePath = resolve(directory, "sessions.jsonl");
  const moduleUrl = new URL("../index.mjs", import.meta.url).href;
  const script = `
    import {EventEmitter} from "node:events";
    import {PassThrough} from "node:stream";
    import {createPersistentGateway} from ${JSON.stringify(moduleUrl)};
    const backend = new EventEmitter();
    backend.stdin = new PassThrough(); backend.stdout = new PassThrough(); backend.stderr = new PassThrough();
    backend.kill = () => { backend.emit("exit", 0, "SIGTERM"); return true; };
    let pending = "";
    backend.stdin.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      let end;
      while ((end = pending.indexOf("\\n")) >= 0) {
        const message = JSON.parse(pending.slice(0, end));
        pending = pending.slice(end + 1);
        if (message.method === "thread/start") backend.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: "crash-owned-thread"}}}) + "\\n");
        if (message.method === "turn/start") process.stdout.write("TURN_FORWARDED\\n");
      }
    });
    const gateway = createPersistentGateway({listen_path: ${JSON.stringify(firstSocketPath)},
      ...(process.platform === "win32" ? {connection_token: ${JSON.stringify(windowsConnectionToken)}} : {}),
      session_store_path: ${JSON.stringify(storePath)},
      wrapper_factory: () => ({processClientMessage: async (message) => ({to_server: [message], to_client: []}),
        processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
        prepareForEviction: () => ({ok: true, checkpoint_digest: "checkpoint:test",
          epoch_digest: "epoch:test", preparation_digest: "preparation:test"})}),
      spawn_impl: () => backend});
    await gateway.start();
    process.stdout.write("READY\\n");
    setInterval(() => {}, 1000);
  `;
  const crashed = spawn(process.execPath, ["--input-type=module", "-e", script],
    {stdio: ["ignore", "pipe", "pipe"]});
  const markers = createInterface({input: crashed.stdout})[Symbol.asyncIterator]();
  let childStderr = "";
  crashed.stderr.on("data", (chunk) => { childStderr += chunk.toString("utf8"); });
  const nextMarker = async (expected) => {
    let timer;
    const received = await Promise.race([markers.next(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`gateway crash fixture timed out waiting for ${expected}: ${childStderr}`)), 10000);
    })]).finally(() => clearTimeout(timer));
    assert.equal(received.value, expected, childStderr);
  };
  let firstClient = null;
  let resumed = null;
  let second = null;
  context.after(async () => {
    firstClient?.socket.destroy();
    resumed?.socket.destroy();
    if (crashed.exitCode === null && crashed.signalCode === null) crashed.kill("SIGKILL");
    await second?.close();
  });
  await nextMarker("READY");
  firstClient = await connect(firstSocketPath, "codex:sigkill");
  const token = firstClient.receipt.continuity.resume_token;
  firstClient.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "thread/start",
    params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:sigkill-create"}})}\n`);
  const created = await firstClient.output.next();
  assert.equal(created.message.result.thread.id, "crash-owned-thread");
  firstClient.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: created.sequence})}\n`);
  const unresolved = {jsonrpc: "2.0", id: 2, method: "turn/start",
    params: safeTurnParams("crash-owned-thread"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:sigkill-unknown"}};
  firstClient.socket.write(`${JSON.stringify(unresolved)}\n`);
  await nextMarker("TURN_FORWARDED");
  const persisted = readFileSync(storePath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.ok(persisted.some((event) => event.event_kind === "dispatch-intent"
    && event.content?.request_key === "turn:sigkill-unknown"), "The turn intent must be durable before the crash.");
  const exited = once(crashed, "exit");
  assert.equal(crashed.kill("SIGKILL"), true);
  await exited;
  assert.equal(inspectFileGatewaySessionStoreWriterLock({path: storePath}).disposition, "stale-candidate");
  const children = [];
  second = gateway(restartedSocketPath, storePath, children);
  await second.start();
  resumed = await connect(restartedSocketPath, "codex:sigkill", token);
  assert.equal(resumed.receipt.resumed, true);
  resumed.socket.write(`${JSON.stringify({...unresolved, id: 3})}\n`);
  const sameKey = await resumed.output.next();
  assert.deepEqual(sameKey.message.error.data.reason_codes, ["gateway.dispatch-outcome-unknown"]);
  resumed.socket.write(`${JSON.stringify({...unresolved, id: 4,
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:sigkill-new-key"}})}\n`);
  const newKey = await resumed.output.next();
  assert.deepEqual(newKey.message.error.data.reason_codes, ["gateway.session-outcome-unknown"]);
  assert.equal(children[0].stdin.readableLength, 0, "Neither unsafe retry reached the restarted backend.");
  resumed.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 5, method: "thread/read",
    params: {threadId: "crash-owned-thread", includeTurns: false},
    [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:sigkill-diagnostic"}})}\n`);
  assert.equal((await lines(children[0].stdin).next()).method, "thread/read",
    "Read-only diagnosis remains available after a hard gateway crash.");
});

test("gateway restart replays a durable unacknowledged streamed delivery", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-stream-restart-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  let second = null;
  context.after(async () => { await first.close(); if (second) await second.close(); });
  const connection = await connect(socketPath, "codex:stream-restart"); const token = connection.receipt.continuity.resume_token;
  await createOwnedThread(connection, firstChildren[0], "stream-owned-thread", first);
  const forwardedTurn = lines(firstChildren[0].stdin).next();
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 9002, method: "turn/start",
    params: safeTurnParams("stream-owned-thread"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:stream-restart"}})}\n`);
  const started = await forwardedTurn;
  assert.equal(started.method, "turn/start");
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: started.id,
    result: {turn: {id: "turn-1", threadId: "stream-owned-thread"}}})}\n`);
  const accepted = await connection.output.next();
  assert.equal(accepted.sequence, 2);
  assert.equal(accepted.message.result.turn.id, "turn-1");
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: accepted.sequence})}\n`);
  const ackDeadline = Date.now() + 2000;
  while ((first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:stream-restart")?.acknowledged_through ?? 0) < accepted.sequence
    && Date.now() < ackDeadline) await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  assert.equal(first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:stream-restart")?.acknowledged_through, accepted.sequence);
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "item/agentMessage/delta",
    params: {threadId: "stream-owned-thread", turnId: "turn-1", itemId: "item-1", delta: "durable"}})}\n`);
  const delivered = await connection.output.next();
  assert.equal(delivered.sequence, 3);
  assert.equal(delivered.message.params.delta, "durable");
  connection.socket.destroy(); await first.close();

  const secondChildren = []; second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:stream-restart", token);
  assert.equal(resumed.receipt.ok, true);
  const replayed = await resumed.output.next();
  assert.equal(replayed.sequence, delivered.sequence);
  assert.deepEqual(replayed.message, delivered.message);
  resumed.socket.write(`${JSON.stringify({schema_version: "are.codex-gateway-ack/v1", through_sequence: replayed.sequence})}\n`);
  resumed.socket.destroy(); await second.close();
});

test("gateway restart blocks a response to a server request owned by the old backend", async (context) => {
  const directory = mkdtempSync("/tmp/are-gateway-tool-restart-"); const socketPath = gatewayPath(directory); const storePath = resolve(directory, "sessions.jsonl");
  const firstChildren = []; const first = gateway(socketPath, storePath, firstChildren); await first.start();
  let second = null;
  context.after(async () => { await first.close(); if (second) await second.close(); });
  const connection = await connect(socketPath, "codex:tool-restart"); const token = connection.receipt.continuity.resume_token;
  await createOwnedThread(connection, firstChildren[0], "tool-owned-thread", first);
  const forwardedTurn = lines(firstChildren[0].stdin).next();
  connection.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 9002, method: "turn/start",
    params: safeTurnParams("tool-owned-thread"),
    [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:tool-restart"}})}\n`);
  const started = await forwardedTurn;
  assert.equal(started.method, "turn/start");
  firstChildren[0].stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: started.id,
    result: {turn: {id: "turn-1", threadId: "tool-owned-thread"}}})}\n`);
  const accepted = await connection.output.next();
  assert.equal(accepted.message.result.turn.id, "turn-1");
  connection.socket.write(`${JSON.stringify({schema_version: GATEWAY_ACK_SCHEMA,
    through_sequence: accepted.sequence})}\n`);
  const ackDeadline = Date.now() + 2000;
  while ((first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:tool-restart")?.acknowledged_through ?? 0) < accepted.sequence
    && Date.now() < ackDeadline) await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  assert.equal(first.inspect().durable_session_index.sessions.find((session) =>
    session.consumer_id === "codex:tool-restart")?.acknowledged_through, accepted.sequence);
  const approval = {jsonrpc: "2.0", id: "approval-1", method: "item/commandExecution/requestApproval",
    params: {threadId: "tool-owned-thread", turnId: "turn-1", itemId: "item-1", startedAtMs: 1, command: "echo safe"}};
  firstChildren[0].stdout.write(`${JSON.stringify(approval)}\n`);
  const delivered = await connection.output.next();
  assert.deepEqual(delivered.message, approval);
  connection.socket.destroy(); await first.close();

  const secondChildren = []; second = gateway(socketPath, storePath, secondChildren); await second.start();
  const resumed = await connect(socketPath, "codex:tool-restart", token);
  const replayed = await resumed.output.next();
  assert.deepEqual(replayed.message, approval);
  resumed.socket.write(`${JSON.stringify({jsonrpc: "2.0", id: approval.id, result: {decision: "decline"}})}\n`);
  const blocked = await resumed.output.next();
  assert.deepEqual(blocked.message.error.data.reason_codes, ["gateway.server-response-outcome-unknown"]);
  assert.equal(secondChildren[0].stdin.readableLength, 0);
  resumed.socket.destroy(); await second.close();
});
