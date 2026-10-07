import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {existsSync, mkdtempSync, rmSync, statSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createConnection, createServer} from "node:net";
import test from "node:test";
import {promisify} from "node:util";

import {createPersistentGateway, gatewayBackendCapabilities, projectAdapterObservation, readAdapterObservation, readGatewayThreadObservation, readGatewayDecisionObservation} from "../index.mjs";

// Keep the optional DSH test runnable in source and extension builds without
// making its adapter a default ARE Core closure dependency.
const dshAdapterUrl = new URL(["..", "..", "dsh-gateway-backend-adapter", "index.mjs"].join("/"), import.meta.url);
const createDshGatewayBackendAdapter = existsSync(dshAdapterUrl)
  ? (await import(dshAdapterUrl.href)).createDshGatewayBackendAdapter : null;

const base = {
  runtime_epoch_id: "epoch:test",
  backend_adapter_id: "fixture-agent/v1",
  observed_at_unix_ms: 1234,
  backend_capabilities: {operations: {turn_start: "unknown", turn_interrupt: "unknown", turn_steer: "unknown", thread_resume: "unknown", thread_compact: "unknown", effect_requests: "unknown"}, history_persistence: "unknown"},
  started: true,
  faulted_session_present: false,
  incomplete_history_audit_present: false,
  sessions: [],
};
const execFileAsync = promisify(execFile);

test("adapter observation never promotes selected backend to running without a session", () => {
  const view = projectAdapterObservation(base);
  assert.equal(view.gateway.status, "running");
  assert.equal(view.client_link.status, "not-observed");
  assert.equal(view.backend.status, "not-observed");
  assert.equal(view.selected_path.status, "not-observed");
  assert.deepEqual(view.session_paths, {status: "observed", total: 0, ready: 0,
    initializing: 0, backend_unavailable: 0, detached_backend: 0, inactive: 0});
  assert.deepEqual(view.model_entry_ingress, {status: "not-paused", reason_code: null});
  assert.deepEqual(view.model_wire_guard, {status: "not-declared"});
  assert.deepEqual(view.hosted_input_attestation, {status: "unknown"});
  assert.deepEqual(view.mcp_hook_relay_preflight, {status: "unknown"});
  assert.deepEqual(view.hosted_effect_tool, {status: "unknown"});
  assert.deepEqual(view.windows_backend_sandbox, {status: "not-configured"});
  assert.equal(view.host_task_control.status, "unverified");
  assert.deepEqual(view.host_method_policy, {status: "not-applicable", codex_version: null,
    known_request_count: null, admitted_request_count: null});
  assert.equal(view.session_fault.status, "not-observed");
  assert.equal(view.session_quarantine.status, "not-observed");
  assert.equal(view.selected_backend_adapter_id, "fixture-agent/v1");
  assert.deepEqual(view.backend_capabilities, {...base.backend_capabilities.operations, history_persistence: "unknown"});
  assert.deepEqual(view.retained_host_receipts, {status: "not-observed", turn_start_accepted: 0,
    turn_history_verified: 0, steer_accepted: 0, compaction_turn_accepted: 0,
    compaction_item_completed: 0, compaction_history_verified: 0});
  assert.deepEqual(projectAdapterObservation({...base, started: false}).reason_codes, ["adapter.gateway-not-running"]);
  assert.deepEqual(projectAdapterObservation({...base, started: false}).session_paths,
    {status: "unavailable", total: 0, ready: 0, initializing: 0,
      backend_unavailable: 0, detached_backend: 0, inactive: 0});
  assert.equal(projectAdapterObservation({...base, mcp_hook_relay_preflight_required: true})
    .mcp_hook_relay_preflight.status, "required");
  assert.equal(projectAdapterObservation({...base, mcp_hook_relay_preflight_required: false})
    .mcp_hook_relay_preflight.status, "not-required");
  assert.equal(projectAdapterObservation({...base, hosted_effect_tool_enabled: true})
    .hosted_effect_tool.status, "candidate-enabled");
  assert.equal(projectAdapterObservation({...base, hosted_effect_tool_enabled: false})
    .hosted_effect_tool.status, "disabled");
});

test("adapter observation distinguishes backend process, client link, and initialization", () => {
  const running = projectAdapterObservation({...base, sessions: [{attached: false, backend_running: true, initialized: false}]});
  assert.equal(running.backend.status, "running");
  assert.equal(running.client_link.status, "not-observed");
  const ready = projectAdapterObservation({...base, sessions: [{attached: true, backend_running: true, initialized: true}]});
  assert.equal(ready.backend.status, "ready");
  assert.equal(ready.client_link.status, "connected");
  assert.equal(ready.selected_path.status, "ready");
  assert.equal(ready.host_task_control.status, "unverified", "backend readiness does not verify exact desktop-task control");
  assert.deepEqual(Object.keys(ready).sort(), ["authority_effect", "backend", "backend_capabilities", "client_link", "gateway", "host_task_control", "host_method_policy", "hosted_input_attestation", "hosted_effect_tool", "mcp_hook_relay_preflight", "model_entry_ingress", "model_wire_guard", "retained_host_receipts", "session_fault", "session_quarantine", "selected_path", "session_paths", "observed_at_unix_ms", "reason_codes", "runtime_epoch_id", "schema_version", "selected_backend_adapter_id", "source", "windows_backend_sandbox"].sort());
  assert.equal(ready.retained_host_receipts.status, "unknown", "legacy session facts cannot claim zero receipts");
  assert.doesNotMatch(JSON.stringify(ready), /consumer|resume_token|thread_id|prompt|listen_path/);
  const fault = projectAdapterObservation({...base, faulted_session_present: true});
  assert.equal(fault.session_fault.status, "observed");
  const quarantine = projectAdapterObservation({...base, incomplete_history_audit_present: true});
  assert.equal(quarantine.session_quarantine.status, "observed");
  assert.equal(quarantine.session_fault.status, "not-observed");
  assert.equal(fault.host_task_control.status, "unverified");
});

test("adapter observation labels pinned Codex method policy without claiming desktop compatibility", () => {
  const view = projectAdapterObservation({...base, backend_adapter_id: "codex-app-server/v1"});
  assert.deepEqual(view.host_method_policy, {status: "pinned-catalog",
    codex_version: "codex-cli 0.155.0-alpha.16.4", known_request_count: 164,
    admitted_request_count: 19});
  assert.equal(view.host_task_control.status, "unverified");
});

test("adapter observation never promotes a mixed Windows session set to sandbox-attested", () => {
  const session = status => ({attached: true, backend_running: true, initialized: true,
    windows_backend_sandbox_status: status});
  const input = {...base, windows_backend_sandbox_attestation_configured: true};
  assert.equal(projectAdapterObservation(input).windows_backend_sandbox.status, "no-active-backend");
  assert.equal(projectAdapterObservation({...input, sessions: [session("checking")]})
    .windows_backend_sandbox.status, "pending-or-mixed");
  assert.equal(projectAdapterObservation({...input, sessions: [session("passed-this-backend"),
    session("failed")]}).windows_backend_sandbox.status, "failed");
  assert.equal(projectAdapterObservation({...input, sessions: [session("passed-this-backend"),
    session("passed-this-backend")]}).windows_backend_sandbox.status, "passed-all-active-backends");
});

test("adapter observation counts only bounded retained host-protocol receipts", () => {
  const session = {attached: true, backend_running: true, initialized: true,
    host_observations: [{kind: "turn-start-accepted"}, {kind: "turn-history-verified"},
      {kind: "steer-accepted"}, {kind: "compaction-turn-accepted"},
      {kind: "compaction-item-completed"}, {kind: "compaction-history-verified"}, {kind: "turn-marker-observed"},
      {kind: "turn-completion-observed"}]};
  const view = projectAdapterObservation({...base, sessions: [session]});
  assert.deepEqual(view.retained_host_receipts, {status: "observed", turn_start_accepted: 1,
    turn_history_verified: 1, steer_accepted: 1, compaction_turn_accepted: 1,
    compaction_item_completed: 1, compaction_history_verified: 1});
  assert.equal(JSON.stringify(view).includes("host_observations"), false);
  assert.deepEqual(projectAdapterObservation({...base, sessions: [{...session, host_observations: []}]}).retained_host_receipts,
    {status: "not-observed", turn_start_accepted: 0, turn_history_verified: 0,
      steer_accepted: 0, compaction_turn_accepted: 0, compaction_item_completed: 0,
      compaction_history_verified: 0});
  assert.throws(() => projectAdapterObservation({...base, sessions: [{...session, host_observations: [{kind: "made-up"}]}]}), /retained host receipt/);
});

test("DSH Web journal observations do not become Codex host receipts", () => {
  const kinds = ["dsh-turn-terminal-observed", "dsh-queue-edit-observed",
    "dsh-queue-remove-observed", "dsh-queue-steer-observed", "dsh-session-release-observed"];
  const view = projectAdapterObservation({...base, backend_adapter_id: "deepseek-harness-web/are-v1",
    sessions: [{attached: true, backend_running: true, initialized: true,
      host_observations: kinds.map(kind => ({kind}))}]});
  assert.deepEqual(view.retained_host_receipts, {status: "not-observed", turn_start_accepted: 0,
    turn_history_verified: 0, steer_accepted: 0, compaction_turn_accepted: 0,
    compaction_item_completed: 0, compaction_history_verified: 0});
  assert.equal(view.host_task_control.status, "unverified");
});

test("independent aggregate links cannot fabricate a connected-and-ready session", () => {
  const view = projectAdapterObservation({...base, sessions: [
    {attached: true, backend_running: false, initialized: false},
    {attached: false, backend_running: true, initialized: true},
  ]});
  assert.equal(view.client_link.status, "connected");
  assert.equal(view.backend.status, "ready");
  assert.equal(view.selected_path.status, "not-observed");
  assert.deepEqual(view.session_paths, {status: "observed", total: 2, ready: 0,
    initializing: 0, backend_unavailable: 1, detached_backend: 1, inactive: 0});
});

test("session path counts classify every gateway session exactly once without identities", () => {
  const view = projectAdapterObservation({...base, sessions: [
    {attached: true, backend_running: true, initialized: true},
    {attached: true, backend_running: true, initialized: false},
    {attached: true, backend_running: false, initialized: false},
    {attached: false, backend_running: true, initialized: true},
    {attached: false, backend_running: false, initialized: false},
  ]});
  assert.deepEqual(view.session_paths, {status: "observed", total: 5, ready: 1,
    initializing: 1, backend_unavailable: 1, detached_backend: 1, inactive: 1});
  assert.equal(view.selected_path.status, "ready");
  assert.equal(view.host_task_control.status, "unverified");
  assert.doesNotMatch(JSON.stringify(view.session_paths), /thread|consumer|prompt|resume_token/);
});

test("managed guard heartbeat expires and never proves host-task ownership", () => {
  const expected = {...base, managed_model_wire_guard_expected: true};
  assert.deepEqual(projectAdapterObservation(expected).model_wire_guard, {status: "not-observed"});
  assert.deepEqual(projectAdapterObservation({...expected, model_wire_guard_heartbeat_at_unix_ms: 1233}).model_wire_guard,
    {status: "parent-heartbeat-observed"});
  assert.deepEqual(projectAdapterObservation({...expected, observed_at_unix_ms: 5000,
    model_wire_guard_heartbeat_at_unix_ms: 1233}).model_wire_guard, {status: "not-observed"});
  assert.equal(projectAdapterObservation({...expected, model_wire_guard_heartbeat_at_unix_ms: 1233})
    .host_task_control.status, "unverified");
  assert.throws(() => projectAdapterObservation({...base, model_wire_guard_heartbeat_at_unix_ms: 1233}), /guard heartbeat/);
});

test("the actual DSH adapter's six declared operations survive the observation projection", {skip: !createDshGatewayBackendAdapter}, () => {
  const adapter = createDshGatewayBackendAdapter();
  const capabilities = gatewayBackendCapabilities(adapter, {persistence_mode: "ephemeral"});
  const view = projectAdapterObservation({...base, backend_adapter_id: adapter.adapter_id, backend_capabilities: capabilities});
  assert.deepEqual(view.backend_capabilities, {
    turn_start: "supported",
    turn_interrupt: "supported",
    turn_steer: "unsupported",
    thread_resume: "supported",
    thread_compact: "unsupported",
    effect_requests: "unsupported",
    history_persistence: "ephemeral",
  });
  assert.equal(view.host_task_control.status, "unverified");
});

test("adapter observation rejects unbounded or malformed facts", () => {
  assert.throws(() => projectAdapterObservation({...base, sessions: Array(1025).fill({attached: false, backend_running: false, initialized: false})}), /bounded/);
  assert.throws(() => projectAdapterObservation({...base, sessions: [{attached: "yes", backend_running: true, initialized: true}]}), /invalid session/);
  assert.throws(() => projectAdapterObservation({...base, observed_at_unix_ms: -1}), /observation time/);
  assert.throws(() => projectAdapterObservation({...base, faulted_session_present: "yes"}), /durable fault status/);
  assert.throws(() => projectAdapterObservation({...base, incomplete_history_audit_present: "yes"}), /history-audit quarantine status/);
  assert.throws(() => projectAdapterObservation({...base, turn_ingress_blocked_reason: "other"}), /model-entry pause reason/);
  assert.deepEqual(projectAdapterObservation({...base, hosted_input_attestation_configured: true}).hosted_input_attestation,
    {status: "configured"});
  assert.deepEqual(projectAdapterObservation({...base, hosted_input_attestation_configured: false}).hosted_input_attestation,
    {status: "not-configured"});
  assert.throws(() => projectAdapterObservation({...base, hosted_input_attestation_configured: "yes"}), /hosted-input attestation status/);
  assert.throws(() => projectAdapterObservation({...base, backend_capabilities: {operations: {...base.backend_capabilities.operations, turn_interrupt: undefined}, history_persistence: "unknown"}}), /capability declarations/);
});

test("private observation socket reads gateway state without creating a session or backend", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-"));
  const token = "test-only-observation-token-32-bytes-minimum";
  const gateway = createPersistentGateway({
    listen_path: join(directory, "gateway.sock"),
    observation_listen_path: join(directory, "observation.sock"),
    observation_token: token,
    wrapper_factory: () => { throw new Error("observation must not construct a wrapper"); },
    spawn_impl: () => { throw new Error("observation must not spawn a backend"); },
  });
  try {
    await gateway.start();
    assert.equal(statSync(join(directory, "observation.sock")).mode & 0o777, 0o600);
    const first = await readAdapterObservation({socket_path: join(directory, "observation.sock"), token});
    assert.equal(first.gateway.status, "running");
    assert.equal(first.backend.status, "not-observed");
    assert.equal(first.host_task_control.status, "unverified");
    assert.deepEqual(first.model_wire_guard, {status: "not-declared"});
    assert.deepEqual(first.hosted_input_attestation, {status: "not-configured"});
    assert.equal(first.retained_host_receipts.status, "not-observed");
    assert.deepEqual(Object.keys(first.backend_capabilities).sort(), ["turn_start", "turn_interrupt", "turn_steer", "thread_resume", "thread_compact", "effect_requests", "history_persistence"].sort());
    assert.deepEqual(gateway.inspect().sessions, []);
    const emptyThreads = await readGatewayThreadObservation({socket_path: join(directory, "observation.sock"), token});
    assert.equal(emptyThreads.thread_count, 0);
    assert.equal(emptyThreads.page_offset, 0);
    assert.equal(emptyThreads.next_offset, null);
    assert.match(emptyThreads.snapshot_digest, /^[0-9a-f]{64}$/);
    const cliOutput = await execFileAsync(process.execPath, [new URL("../../../bin/are.mjs", import.meta.url).pathname, "adapter-status", "--json", "--socket", join(directory, "observation.sock")], {
      encoding: "utf8",
      env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: token},
    });
    const cli = JSON.parse(cliOutput.stdout);
    assert.equal(cli.schema_version, "are.adapter-observation/v1");
    assert.equal(cli.backend.status, "not-observed");
    assert.deepEqual(gateway.inspect().sessions, []);
    await assert.rejects(readAdapterObservation({socket_path: join(directory, "observation.sock"), token: `${token}-wrong`}), /adapter\.observation-/);
    assert.deepEqual(gateway.inspect().sessions, []);
  } finally {
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("opt-in loopback observation shares no gateway control transport", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-tcp-"));
  const token = "test-only-observation-token-32-bytes-minimum";
  const gateway = createPersistentGateway({listen_path: join(directory, "gateway.sock"),
    observation_tcp_port: 0, observation_token: token,
    wrapper_factory: () => { throw new Error("observation must not construct a wrapper"); },
    spawn_impl: () => { throw new Error("observation must not spawn a backend"); }});
  try {
    await gateway.start();
    const address = gateway.observationAddress();
    assert.equal(address.address, "127.0.0.1");
    const endpoint = `tcp://127.0.0.1:${address.port}`;
    const adapter = await readAdapterObservation({socket_path: endpoint, token});
    const threads = await readGatewayThreadObservation({socket_path: endpoint, token});
    const decisions = await readGatewayDecisionObservation({socket_path: endpoint, token});
    assert.equal(adapter.gateway.status, "running");
    assert.equal(adapter.host_task_control.status, "unverified");
    assert.equal(threads.thread_count, 0);
    assert.equal(decisions.decision_count, 0);
    assert.equal(adapter.runtime_epoch_id, threads.runtime_epoch_id);
    assert.equal(adapter.runtime_epoch_id, decisions.runtime_epoch_id);
    assert.deepEqual(gateway.inspect().sessions, []);
    const controlReply = await new Promise((resolve, reject) => {
      const socket = createConnection({host: "127.0.0.1", port: address.port});
      let bytes = "";
      socket.setTimeout(2000, () => { socket.destroy(); reject(new Error("Control probe timed out.")); });
      socket.once("error", reject);
      socket.on("data", chunk => { bytes += chunk.toString("utf8"); });
      socket.once("close", () => resolve(bytes));
      socket.once("connect", () => socket.write(`${JSON.stringify({schema_version: "are.gateway-connect/v1",
        nonce: "control-probe-nonce-1234567890", token})}\n`));
    });
    assert.equal(controlReply, "", "The observation port must not answer gateway-control frames.");
    assert.deepEqual(gateway.inspect().sessions, []);
    await assert.rejects(readAdapterObservation({socket_path: endpoint, token: `${token}-wrong`}), /adapter\.observation-/);
    assert.deepEqual(gateway.inspect().sessions, []);
    for (const invalid of [`tcp://0.0.0.0:${address.port}`, `tcp://localhost:${address.port}`,
      `tcp://127.0.0.1:${address.port}/control`, `tcp://127.0.0.1:${address.port}?x=1`]) {
      await assert.rejects(readAdapterObservation({socket_path: invalid, token}), /loopback/);
    }
    const cliOutput = await execFileAsync(process.execPath,
      [new URL("../../../bin/are.mjs", import.meta.url).pathname, "adapter-status", "--json", "--socket", endpoint],
      {encoding: "utf8", env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: token}});
    assert.equal(JSON.parse(cliOutput.stdout).runtime_epoch_id, adapter.runtime_epoch_id);
  } finally {
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
  }
  assert.equal(gateway.observationAddress(), null);
});

test("loopback observation requires an exclusive endpoint and strong token", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-tcp-invalid-"));
  const basic = {listen_path: join(directory, "gateway.sock"),
    wrapper_factory: () => { throw new Error("unused"); }};
  try {
    assert.throws(() => createPersistentGateway({...basic, observation_tcp_port: 0,
      observation_listen_path: join(directory, "observation.sock"), observation_token: "x".repeat(32)}), /exclusive loopback/);
    assert.throws(() => createPersistentGateway({...basic, observation_tcp_port: 0,
      observation_token: "short"}), /observation token/);
    assert.throws(() => createPersistentGateway({...basic, observation_tcp_port: 65536,
      observation_token: "x".repeat(32)}), /exclusive loopback/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("private observation socket reports a fresh managed guard parent heartbeat", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-guard-observation-"));
  const token = "test-only-observation-token-32-bytes-minimum";
  const gateway = createPersistentGateway({listen_path: join(directory, "gateway.sock"),
    observation_listen_path: join(directory, "observation.sock"), observation_token: token,
    managed_model_wire_guard_expected: true,
    wrapper_factory: () => { throw new Error("observation must not construct a wrapper"); },
    spawn_impl: () => { throw new Error("observation must not spawn a backend"); }});
  try {
    await gateway.start();
    assert.deepEqual((await readAdapterObservation({socket_path: join(directory, "observation.sock"), token}))
      .model_wire_guard, {status: "not-observed"});
    gateway.noteManagedModelWireGuardHeartbeat();
    const observed = await readAdapterObservation({socket_path: join(directory, "observation.sock"), token});
    assert.deepEqual(observed.model_wire_guard, {status: "parent-heartbeat-observed"});
    assert.equal(observed.host_task_control.status, "unverified");
    assert.deepEqual(gateway.observeAdapters(Date.now() + 4000).model_wire_guard, {status: "not-observed"});
  } finally {
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("private observation socket reports the gateway-enforced model-entry pause", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-paused-"));
  const token = "test-only-observation-token-32-bytes-minimum";
  const reason = "windows-client.hook-boundary-unverified";
  const gateway = createPersistentGateway({
    listen_path: join(directory, "gateway.sock"),
    observation_listen_path: join(directory, "observation.sock"),
    observation_token: token,
    turn_ingress_blocked_reason: reason,
    hosted_input_attestation_key: "a".repeat(64),
    hosted_input_consumer_id: "codex:human-chat",
    wrapper_factory: () => { throw new Error("observation must not construct a wrapper"); },
    spawn_impl: () => { throw new Error("observation must not spawn a backend"); },
  });
  try {
    await gateway.start();
    const observed = await readAdapterObservation({socket_path: join(directory, "observation.sock"), token});
    assert.deepEqual(observed.model_entry_ingress, {status: "paused", reason_code: reason});
    assert.deepEqual(observed.hosted_input_attestation, {status: "configured"});
    assert.equal(observed.backend.status, "not-observed");
    assert.equal(observed.host_task_control.status, "unverified");
  } finally {
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("observation client rejects nonce mismatch and stale source time", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-invalid-"));
  const path = join(directory, "observation.sock");
  const token = "test-only-observation-token-32-bytes-minimum";
  let stale = false;
  let invalidControl = false;
  let inconsistentPath = false;
  let inconsistentCounts = false;
  let inconsistentBackend = false;
  let nullCounts = false;
  let invalidReceipts = false;
  let invalidIngress = false;
  const server = createServer((socket) => {
    socket.once("data", (chunk) => {
      const request = JSON.parse(chunk.toString("utf8").trim());
      const observation = projectAdapterObservation({...base, observed_at_unix_ms: stale ? Date.now() - 60_000 : Date.now()});
      socket.end(`${JSON.stringify({schema_version: "are.adapter-observation-response/v1", nonce: stale || invalidControl || inconsistentPath || inconsistentCounts || inconsistentBackend || nullCounts || invalidReceipts || invalidIngress ? request.nonce : "wrong-nonce", observation: invalidControl ? {...observation, host_task_control: {status: "verified"}} : inconsistentPath ? {...observation, selected_path: {status: "ready"}} : inconsistentCounts ? {...observation, session_paths: {...observation.session_paths, total: 1}} : inconsistentBackend ? {...observation, backend: {status: "ready"}} : nullCounts ? {...observation, session_paths: null} : invalidReceipts ? {...observation, retained_host_receipts: {status: "observed", turn_start_accepted: 0, turn_history_verified: 0, steer_accepted: 0, compaction_item_completed: 0}} : invalidIngress ? {...observation, model_entry_ingress: {status: "paused", reason_code: null}} : observation})}\n`);
    });
  });
  try {
    await new Promise((resolveListen) => server.listen(path, resolveListen));
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    stale = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-stale/);
    stale = false;
    invalidControl = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    invalidControl = false;
    inconsistentPath = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    inconsistentPath = false;
    inconsistentCounts = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    inconsistentCounts = false;
    inconsistentBackend = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    inconsistentBackend = false;
    nullCounts = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    nullCounts = false;
    invalidReceipts = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
    invalidReceipts = false;
    invalidIngress = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  }
});

test("observation client treats omitted legacy capability and fault fields as unknown", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-observation-legacy-"));
  const path = join(directory, "observation.sock");
  const token = "test-only-observation-token-32-bytes-minimum";
  let invalidExplicitValue = false;
  const server = createServer((socket) => {
    socket.once("data", (chunk) => {
      const request = JSON.parse(chunk.toString("utf8").trim());
      const current = projectAdapterObservation({...base, observed_at_unix_ms: Date.now()});
      const legacyCapabilities = {...current.backend_capabilities};
      delete legacyCapabilities.turn_start;
      delete legacyCapabilities.turn_interrupt;
      delete legacyCapabilities.thread_compact;
      if (invalidExplicitValue) legacyCapabilities.turn_interrupt = "yes";
      const {session_fault: _modernSessionFault, session_quarantine: _modernSessionQuarantine,
        session_paths: _modernSessionPaths,
        selected_path: _modernSelectedPath, model_entry_ingress: _modernIngress,
        model_wire_guard: _modernGuard,
        retained_host_receipts: _modernRetainedReceipts,
        ...legacyObservation} = current;
      socket.end(`${JSON.stringify({schema_version: "are.adapter-observation-response/v1", nonce: request.nonce,
        observation: {...legacyObservation, backend_capabilities: legacyCapabilities}})}\n`);
    });
  });
  try {
    await new Promise((resolveListen) => server.listen(path, resolveListen));
    const result = await readAdapterObservation({socket_path: path, token});
    assert.deepEqual(result.session_paths, {status: "unknown", total: null, ready: null,
      initializing: null, backend_unavailable: null, detached_backend: null, inactive: null});
    assert.equal(result.retained_host_receipts.status, "unknown");
    assert.equal(result.backend_capabilities.turn_start, "unknown");
    assert.equal(result.backend_capabilities.turn_interrupt, "unknown");
    assert.equal(result.backend_capabilities.thread_compact, "unknown");
    assert.equal(result.session_fault.status, "unknown");
    assert.equal(result.session_quarantine.status, "unknown");
    assert.equal(result.selected_path.status, "unknown");
    assert.deepEqual(result.model_entry_ingress, {status: "unknown", reason_code: null});
    assert.deepEqual(result.model_wire_guard, {status: "unknown"});
    invalidExplicitValue = true;
    await assert.rejects(readAdapterObservation({socket_path: path, token}), /adapter\.observation-incompatible/);
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
    rmSync(directory, {recursive: true, force: true});
  }
});
