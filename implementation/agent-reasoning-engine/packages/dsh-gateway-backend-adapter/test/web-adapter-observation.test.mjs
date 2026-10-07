import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {chmodSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {readAdapterObservation}
  from "../../codex-app-server-wrapper/src/adapter-observation-client.mjs";
import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";
import {projectDshObjectiveCheckpoint, summarizeDshObjectiveCheckpoint}
  from "../../codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs";
import {createDshWebAdapterObservationServer, observedNativeTurnState, projectDshWebActivity,
  projectDshWebAdapterObservation}
  from "../src/web-adapter-observation.mjs";

const progress = {schema_version: 'are.dsh-plan-progress/v1', posture: 'checkpointed-declaration',
  obligation_count: 30, completed_count: 3, open_count: 25, active_count: 1, deferred_count: 1,
  open_decision_count: 7, active_slice_ordinal: 4, active_slice_status: 'active'};
const planHead = {schema_version: 'are.dsh-plan-head-summary/v1', status: 'checkpoint-retained',
  checkpoint_digest: 'd'.repeat(64), plan_context_digest: 'e'.repeat(64), plan_progress: progress,
  sources: 'verified-at-read', selection_relation: 'matches-startup'};
const checkpoint = (continuity, plan, planProgress) => projectDshObjectiveCheckpoint({
  scope_digest: "a".repeat(64), objective_state_digest: "b".repeat(64),
  resolution_digest: "c".repeat(64), preflight_event_digest: "d".repeat(64),
  checkpoint_digest: "e".repeat(64), binding_digest: "f".repeat(64),
  requirement_continuity_digest: continuity,
  ...(plan === undefined ? {} : {plan_context_digest: plan})}, planProgress);

function interpretation(thread_ref, changes = {}) {
  const value = {kind: "dsh-objective-interpretation-observed", thread_ref, turn_ref: null,
    binding_id_digest: "1".repeat(64), generation: 1, request_ref_digest: "2".repeat(64),
    scope_digest: "a".repeat(64), objective_state_digest: "b".repeat(64), resolution_digest: "c".repeat(64),
    interpretation_event_digest: "3".repeat(64), checkpoint_digest: "4".repeat(64),
    requirement_continuity_digest: null, plan_context_digest: null, authority_effect: "none", ...changes};
  return {...value, observation_digest: digestValue(value)};
}

test("latest interpretation remains distinct from an older admission and from model execution", () => {
  const thread_ref = `backend-thread:${"a".repeat(64)}`;
  const initial = interpretation(thread_ref);
  const prepare = {kind: "dsh-are-preparation-observed", thread_ref,
    route_id: "CA2-ROUTE-UNDERSTAND", objective_checkpoint: checkpoint(null)};
  const project = events => projectDshWebActivity({agent_records: [{status: "active", thread_ref}],
    host_observations: events});
  assert.equal(project([initial]).agents[0].are_interpretation.status,
    "checkpoint-retained-no-admission-retained");
  assert.equal(project([initial, prepare]).agents[0].are_interpretation, undefined);
  const newer = interpretation(thread_ref, {objective_state_digest: "5".repeat(64),
    checkpoint_digest: "6".repeat(64), requirement_continuity_digest: "7".repeat(64),
    plan_context_digest: "8".repeat(64)});
  const state = project([initial, prepare, newer]);
  assert.equal(state.agents[0].are_preparation.objective_checkpoint.objective_state_digest, "b".repeat(64));
  assert.equal(state.agents[0].are_interpretation.objective_state_digest, "5".repeat(64));
  assert.equal(state.agents[0].are_interpretation.plan_context_digest, "8".repeat(64));
  assert.equal(state.retained_model_entry_count, 0);
  assert.equal(state.retained_turn_terminal_count, 0);
  // A matching-looking admission from another thread must not hide this one.
  assert.ok(project([newer, {...prepare, thread_ref: `backend-thread:${"f".repeat(64)}`,
    objective_checkpoint: {...checkpoint(null), objective_state_digest: "5".repeat(64)}}])
    .agents[0].are_interpretation);
  for (const changes of [{prompt: "private"}, {checkpoint_digest: ["4".repeat(64)]},
    {plan_context_digest: undefined}, {authority_effect: "admit"}, {generation: 0}]) {
    assert.throws(() => project([{...initial, ...changes}]), /interpretation-invalid/);
  }
});

test("observer bounds dual interpretation and admission rows without losing omitted counts", () => {
  const records = Array.from({length: 16}, (_, i) => ({status: "active",
    thread_ref: `backend-thread:${(i + 1).toString(16).padStart(64, "0")}`,
    native_turn_state: "open-observed", are_plan_head: planHead}));
  const events = records.flatMap(record => [
    {kind: "dsh-are-preparation-observed", thread_ref: record.thread_ref,
      route_id: `CA2-ROUTE-${"X".repeat(80)}`, objective_checkpoint: checkpoint("9".repeat(64), "a".repeat(64), progress)},
    interpretation(record.thread_ref, {objective_state_digest: "5".repeat(64), plan_context_digest: "b".repeat(64),
      requirement_continuity_digest: 'c'.repeat(64), plan_progress: progress})]);
  const activity = projectDshWebActivity({agent_records: records, host_observations: events});
  assert.equal(activity.active_agent_count, 16);
  assert.ok(activity.omitted_agent_count > 0);
  assert.equal(activity.agents.length + activity.omitted_agent_count, 16);
  assert.ok(activity.agents.every(row => row.are_interpretation && row.are_preparation));
  const full = projectDshWebAdapterObservation({runtime_epoch_id: "x".repeat(256),
    gateway_healthy: true, host_running: true, faulted: false, quarantined: false,
    dsh_web_activity: activity});
  assert.ok(Buffer.byteLength(JSON.stringify({schema_version: "are.adapter-observation-response/v1",
    nonce: "n".repeat(128), observation: full})) < 16 * 1024);
});

test("checkpoint summary follows the latest preparation without becoming a dispatch claim", () => {
  const thread_ref = `backend-thread:${"a".repeat(64)}`;
  const prepared = {kind: "dsh-are-preparation-observed", thread_ref,
    route_id: "CA2-ROUTE-UNDERSTAND", request_key_digest: "c".repeat(64),
    request_digest: "d".repeat(64), objective_checkpoint: checkpoint(null)};
  const activity = events => projectDshWebActivity({agent_records: [{status: "active", thread_ref}],
    host_observations: events});
  assert.deepEqual(activity([prepared]).agents[0].are_preparation.objective_checkpoint,
    summarizeDshObjectiveCheckpoint(prepared.objective_checkpoint));
  assert.equal(activity([prepared]).agents[0].are_preparation.dispatch_relation, "not-retained");
  const entry = {kind: "dsh-model-entry-intent", thread_ref,
    preparation_bindings: [{request_key_digest: prepared.request_key_digest,
      request_digest: prepared.request_digest}]};
  const next = {...prepared, request_key_digest: "1".repeat(64),
    objective_checkpoint: {...checkpoint("2".repeat(64), "4".repeat(64)), checkpoint_digest: "3".repeat(64)}};
  const projected = activity([prepared, entry, next]).agents[0].are_preparation;
  assert.equal(projected.dispatch_relation, "other-preparation");
  assert.equal(projected.objective_checkpoint.checkpoint_digest, "3".repeat(64));
  assert.equal(projected.objective_checkpoint.requirements, "continuity-reference-retained");
  assert.equal(projected.objective_checkpoint.schema_version, "are.dsh-objective-checkpoint-summary/v2");
  assert.equal(projected.objective_checkpoint.plan_context_digest, "4".repeat(64));
  assert.throws(() => activity([{...prepared, objective_checkpoint: {
    ...prepared.objective_checkpoint, prompt: "private text"}}]), /checkpoint-invalid/);
  const full = projectDshWebAdapterObservation({runtime_epoch_id: "x".repeat(256),
    gateway_healthy: true, host_running: true, faulted: false, quarantined: false,
    dsh_web_activity: projectDshWebActivity({agent_records: Array.from({length: 16}, (_, i) => ({
      status: "active", thread_ref: `backend-thread:${(i+1).toString(16).padStart(64,"0")}`,
      native_turn_state: "open-observed"})), host_observations: Array.from({length: 16}, (_, i) => ({
      ...next, thread_ref: `backend-thread:${(i+1).toString(16).padStart(64,"0")}`,
      route_id: `CA2-ROUTE-${"X".repeat(80)}`}))})});
  assert.ok(Buffer.byteLength(JSON.stringify({schema_version: "are.adapter-observation-response/v1",
    nonce: "n".repeat(32), observation: full})) < 16 * 1024);
});

test("DSH Agent activity uses only the latest retained event for each active opaque thread", () => {
  const first = `backend-thread:${"a".repeat(64)}`;
  const second = `backend-thread:${"b".repeat(64)}`;
  const state = projectDshWebActivity({agent_records: [
    {status: "active", thread_ref: second, native_turn_state: "open-observed"},
    {status: "released", thread_ref: `backend-thread:${"c".repeat(64)}`},
    {status: "active", thread_ref: first}], host_observations: [
    {thread_ref: first, kind: "dsh-are-preparation-observed", route_id: "CA2-ROUTE-IMPLEMENT"},
    {thread_ref: first, kind: "dsh-model-entry-intent"},
    {thread_ref: first, kind: "dsh-turn-terminal-observed"},
    {thread_ref: second, kind: "dsh-turn-terminal-observed"},
    {thread_ref: second, kind: "dsh-model-entry-intent"}]});
  assert.deepEqual(state, {status: "observed", active_agent_count: 2,
    retained_model_entry_count: 2, retained_turn_terminal_count: 2,
    omitted_agent_count: 0, agents: [
      {thread_ref: first, last_turn_evidence: "terminal-retained",
        are_preparation: {status: "route-context-prepared", route_id: "CA2-ROUTE-IMPLEMENT",
          dispatch_relation: "legacy-unbound"}},
      {thread_ref: second, last_turn_evidence: "model-entry-retained",
        native_turn_state: "open-observed"}]});
  assert.throws(() => projectDshWebActivity({agent_records: [
    {status: "active", thread_ref: first}], host_observations: [
    {thread_ref: first, kind: "dsh-are-preparation-observed", route_id: "private prompt"}]}),
  /adapter-preparation-invalid/u);
});

test("DSH preparation correlation never joins a newer queued prompt to an older model entry", () => {
  const thread_ref = `backend-thread:${"a".repeat(64)}`;
  const other = `backend-thread:${"b".repeat(64)}`;
  const prepared = {kind: "dsh-are-preparation-observed", thread_ref,
    route_id: "CA2-ROUTE-IMPLEMENT", request_key_digest: "c".repeat(64),
    request_digest: "d".repeat(64)};
  const entry = {kind: "dsh-model-entry-intent", thread_ref,
    preparation_bindings: [{request_key_digest: prepared.request_key_digest,
      request_digest: prepared.request_digest}]};
  const relation = events => projectDshWebActivity({agent_records: [{status: "active", thread_ref}],
    host_observations: events}).agents[0].are_preparation.dispatch_relation;
  assert.equal(relation([prepared]), "not-retained");
  assert.equal(relation([prepared, {...entry, thread_ref: other}]), "not-retained");
  assert.equal(relation([prepared, entry]), "latest-model-entry");
  assert.equal(relation([prepared, entry, {...prepared,
    request_key_digest: "e".repeat(64)}]), "other-preparation");
  assert.equal(relation([prepared, entry, {...prepared,
    request_digest: "f".repeat(64)}]), "other-preparation");
  assert.equal(relation([prepared, {...entry, preparation_bindings: undefined}]), "legacy-unbound");
  // An edited preparation is matched by its own exact receipt, not the
  // original prompt identity. Batched entries can include multiple receipts.
  const edited = {...prepared, request_key_digest: "e".repeat(64), request_digest: "f".repeat(64)};
  assert.equal(relation([prepared, edited, {...entry, preparation_bindings: [
    entry.preparation_bindings[0], {request_key_digest: edited.request_key_digest,
      request_digest: edited.request_digest}]}]), "latest-model-entry");
});

test("native turn state is only the in-memory event sequence, not model liveness", () => {
  assert.equal(observedNativeTurnState([]), "not-started");
  assert.equal(observedNativeTurnState(null), "unknown");
  assert.equal(observedNativeTurnState([{type: "turn/end", seq: 2}]), "unknown");
  assert.equal(observedNativeTurnState([{type: "turn/start", seq: "1"}]), "unknown");
  assert.equal(observedNativeTurnState([{type: "turn/start", seq: 1}]), "open-observed");
  assert.equal(observedNativeTurnState([{type: "turn/start", seq: 1},
    {type: "turn/end", seq: 2}]), "closed-observed");
  assert.equal(observedNativeTurnState([{type: "turn/start", seq: 3},
    {type: "turn/end", seq: 2}]), "open-observed");
  assert.throws(() => projectDshWebAdapterObservation({runtime_epoch_id: "test",
    gateway_healthy: true, host_running: true, faulted: false, quarantined: false,
    dsh_web_activity: {status: "observed", active_agent_count: 1,
      retained_model_entry_count: 0, retained_turn_terminal_count: 0,
      omitted_agent_count: 0, agents: [{thread_ref: `backend-thread:${"a".repeat(64)}`,
        last_turn_evidence: "no-retained-turn-event", native_turn_state: "model-running"}]}}),
  /adapter-observation-input-invalid/u);
});

test("DSH Web observation exposes Host and sidecar liveness without claiming browser linkage", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-web-observation-"));
  const path = join(directory, "observation.sock");
  const token = "x".repeat(40);
  let gatewayHealthy = true;
  let spoof = null;
  let activity = {status: "observed", active_agent_count: 1,
    retained_model_entry_count: 2, retained_turn_terminal_count: 1,
    omitted_agent_count: 0, agents: [{thread_ref: `backend-thread:${"a".repeat(64)}`,
      last_turn_evidence: "terminal-retained", native_turn_state: "closed-observed",
      are_preparation: {status: "route-context-prepared", route_id: "CA2-ROUTE-IMPLEMENT",
        dispatch_relation: "latest-model-entry",
        objective_checkpoint: summarizeDshObjectiveCheckpoint(checkpoint(null))}}]};
  let server;
  try {
    server = await createDshWebAdapterObservationServer({path, token,
      observe: () => ({...projectDshWebAdapterObservation({runtime_epoch_id: "dsh-web-test",
        gateway_healthy: gatewayHealthy, host_running: true, faulted: false,
        quarantined: false, dsh_web_activity: activity}), ...(spoof ?? {})})});
    const live = await readAdapterObservation({socket_path: path, token});
    assert.equal(live.source, "dsh-web-host-process");
    assert.equal(live.selected_backend_adapter_id, "deepseek-harness-web/are-v1");
    assert.equal(live.gateway.status, "running");
    assert.equal(live.backend.status, "running");
    assert.equal(live.client_link.status, "not-observed");
    assert.equal(live.selected_path.status, "not-observed");
    assert.equal(live.session_paths.status, "unknown");
    assert.equal(live.backend_capabilities.effect_requests, "unsupported");
    assert.deepEqual(live.dsh_web_activity, activity);
    activity.agents[0].are_plan_head = planHead;
    assert.deepEqual((await readAdapterObservation({socket_path: path, token})).dsh_web_activity, activity);
    for (const override of [{sources: 'healthy'}, {selection_relation: 'advanced'}, {status: 'unavailable'},
      {plan_progress: null}, {checkpoint_digest: null}, {prompt: 'private'}]) {
      spoof = {dsh_web_activity: {...activity, agents: [{...activity.agents[0], are_plan_head: {...planHead, ...override}}]}};
      await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter.observation-incompatible/u);
    }
    spoof = null;
    activity.agents[0].are_preparation.objective_checkpoint =
      summarizeDshObjectiveCheckpoint(checkpoint("b".repeat(64), "c".repeat(64)));
    const selected = await readAdapterObservation({socket_path: path, token});
    assert.deepEqual(selected.dsh_web_activity, activity);
    assert.equal(selected.dsh_web_activity.agents[0].are_preparation.objective_checkpoint.plan_context_digest,
      "c".repeat(64));
    for (const override of [{status: "executing"}, {checkpoint_digest: "not-a-digest"},
      {prompt: "private"}, {requirements: "plan-completed"}, {plan_context_digest: null},
      {plan_context_digest: "C".repeat(64)}, {schema_version: "are.dsh-objective-checkpoint-summary/v1"}]) {
      spoof = {dsh_web_activity: {...activity, agents: [{...activity.agents[0], are_preparation: {
        ...activity.agents[0].are_preparation, objective_checkpoint: {
          ...activity.agents[0].are_preparation.objective_checkpoint, ...override}}}]}};
      await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter.observation-incompatible/u);
    }
    spoof = null;
    activity.agents[0].are_interpretation = projectDshWebActivity({agent_records: [{status: "active",
      thread_ref: activity.agents[0].thread_ref}], host_observations: [interpretation(activity.agents[0].thread_ref)]})
      .agents[0].are_interpretation;
    assert.deepEqual((await readAdapterObservation({socket_path: path, token})).dsh_web_activity, activity);
    activity.agents[0].are_interpretation = projectDshWebActivity({agent_records: [{status: 'active',
      thread_ref: activity.agents[0].thread_ref}], host_observations: [interpretation(activity.agents[0].thread_ref,
      {plan_context_digest: 'd'.repeat(64), requirement_continuity_digest: 'e'.repeat(64), plan_progress: progress})]})
      .agents[0].are_interpretation;
    const progressRead = await readAdapterObservation({socket_path: path, token});
    assert.deepEqual(progressRead.dsh_web_activity, activity);
    assert.deepEqual(progressRead.dsh_web_activity.agents[0].are_interpretation.plan_progress, progress);
    for (const override of [{status: "rejected"}, {prompt: "private"}, {checkpoint_digest: "X".repeat(64)},
      {plan_context_digest: []}, {requirements: "completed"}, {schema_version: "unknown"},
      {plan_context_digest: null}, {requirements: 'not-selected'},
      {plan_progress: {...progress, completed_count: 31}}, {plan_progress: {...progress, prompt: 'private'}}]) {
      spoof = {dsh_web_activity: {...activity, agents: [{...activity.agents[0], are_interpretation: {
        ...activity.agents[0].are_interpretation, ...override}}]}};
      await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter.observation-incompatible/u);
    }
    spoof = null;
    await assert.rejects(readAdapterObservation({socket_path: path, token: "y".repeat(40)}),
      /adapter\.observation-closed/u);
    gatewayHealthy = false;
    const lost = await readAdapterObservation({socket_path: path, token});
    assert.equal(lost.gateway.status, "unavailable");
    assert.equal(lost.backend.status, "not-observed");
    assert.deepEqual(lost.reason_codes, ["dsh-web.gateway-unavailable"]);
    spoof = {selected_backend_adapter_id: "codex-app-server/v1"};
    await assert.rejects(readAdapterObservation({socket_path: path, token}),
      /adapter\.observation-incompatible/u);
    spoof = {client_link: {status: "connected"}};
    await assert.rejects(readAdapterObservation({socket_path: path, token}),
      /adapter\.observation-incompatible/u);
    spoof = {dsh_web_activity: {status: "observed", active_agent_count: -1,
      retained_model_entry_count: 2, retained_turn_terminal_count: 1,
      omitted_agent_count: 0, agents: activity.agents}};
    await assert.rejects(readAdapterObservation({socket_path: path, token}),
      /adapter\.observation-incompatible/u);
    spoof = {dsh_web_activity: {...activity, agents: [activity.agents[0], activity.agents[0]],
      active_agent_count: 2}};
    await assert.rejects(readAdapterObservation({socket_path: path, token}),
      /adapter\.observation-incompatible/u);
    spoof = null;
    spoof = {dsh_web_activity: {...activity, agents: [{...activity.agents[0],
      are_preparation: {...activity.agents[0].are_preparation, dispatch_relation: "model-thinking"}}]}};
    await assert.rejects(readAdapterObservation({socket_path: path, token}),
      /adapter\.observation-incompatible/u);
    spoof = null;
    activity = {status: "unknown", active_agent_count: null,
      retained_model_entry_count: null, retained_turn_terminal_count: null,
      omitted_agent_count: null, agents: []};
    assert.deepEqual((await readAdapterObservation({socket_path: path, token})).dsh_web_activity,
      activity);
  } finally {
    await server?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("DSH Web observation refuses a non-private parent and never replaces an existing path", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-web-observation-deny-"));
  const path = join(directory, "observation.sock");
  const token = "x".repeat(40);
  let server;
  try {
    chmodSync(directory, 0o755);
    await assert.rejects(createDshWebAdapterObservationServer({path, token, observe: () => ({})}),
      /adapter-observation-parent-not-private/u);
    chmodSync(directory, 0o700);
    server = await createDshWebAdapterObservationServer({path, token,
      observe: () => projectDshWebAdapterObservation({runtime_epoch_id: "dsh-web-test",
        gateway_healthy: true, host_running: true, faulted: null, quarantined: null})});
    await assert.rejects(createDshWebAdapterObservationServer({path, token, observe: () => ({})}),
      /adapter-observation-path-exists/u);
    await assert.rejects(createDshWebAdapterObservationServer({path, token,
      observe: () => ({}), recover_stale: true}), /adapter-observation-path-exists/u);
  } finally {
    await server?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("DSH Web development observer binds only authenticated numeric loopback", async () => {
  const token = "dsh-loopback-test-token-".repeat(2);
  await assert.rejects(createDshWebAdapterObservationServer({tcp_port: 0,
    token, observe: () => ({}), recover_stale: true}),
  /adapter-observation-server-input-invalid/u);
  const server = await createDshWebAdapterObservationServer({tcp_port: 0, token,
    observe: () => projectDshWebAdapterObservation({runtime_epoch_id: "dsh-loopback-test",
      gateway_healthy: true, host_running: true, faulted: false, quarantined: false})});
  try {
    assert.match(server.endpoint, /^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/u);
    const result = await readAdapterObservation({socket_path: server.endpoint, token});
    assert.equal(result.source, "dsh-web-host-process");
    await assert.rejects(readAdapterObservation({socket_path: server.endpoint,
      token: "wrong-loopback-observation-token-".repeat(2)}),
    /adapter\.observation-closed/u);
  } finally { await server.close(); }
  await assert.rejects(readAdapterObservation({socket_path: server.endpoint, token}),
    /adapter\.observation-unavailable/u);
});

test("DSH Web observation recovers only an owner-private stale socket", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-web-observation-stale-"));
  const path = join(directory, "observation.sock");
  const token = "x".repeat(40);
  const child = spawn(process.execPath, ["-e", `const net=require("node:net");
    const fs=require("node:fs");const s=net.createServer();
    s.listen(${JSON.stringify(path)},()=>{fs.chmodSync(${JSON.stringify(path)},0o600);
      process.stdout.write("ready\\n")})`], {stdio: ["ignore", "pipe", "pipe"]});
  let server;
  try {
    await once(child.stdout, "data");
    const closed = once(child, "close");
    child.kill("SIGKILL");
    await closed;
    server = await createDshWebAdapterObservationServer({path, token,
      recover_stale: true,
      observe: () => projectDshWebAdapterObservation({runtime_epoch_id: "recovered",
        gateway_healthy: true, host_running: true, faulted: false, quarantined: false})});
    assert.equal((await readAdapterObservation({socket_path: path, token})).runtime_epoch_id,
      "recovered");
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await server?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});
