import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from "node:fs";
import {hostname, tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {digestValue} from "../src/canonical.mjs";
import {createDesktopGatewayState, inspectDesktopGatewayState} from "../src/desktop-gateway-state.mjs";
import {GATEWAY_CONNECTED_SCHEMA} from "../src/gateway.mjs";

const consumerId = "codex:desktop-state-fixture";
const adapterId = "codex-app-server/v1";
const token = "private-fixture-resume-token";
const backendBinding = {binary_sha256: "a".repeat(64), host_profile: "desktop-wsl-base/v1"};

function receipt(resumed = false, acknowledgedThrough = 0) {
  return {schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true, consumer_id: consumerId,
    lane: "interaction-bound", backend_adapter_id: adapterId, resumed,
    desktop_backend_binding: backendBinding,
    continuity: {resume_token: token, resume_token_digest: digestValue(token),
      acknowledged_through: acknowledgedThrough}};
}

async function withPrivateDir(run) {
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-gateway-state-"));
  try { await run(stateDir); }
  finally { rmSync(stateDir, {recursive: true, force: true}); }
}

test("desktop gateway inspection is read-only and never promotes a local snapshot to reconnect proof", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const options = {state_dir: stateDir, consumer_id: consumerId,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding};
    const statePath = join(stateDir, "desktop-gateway-state.json");
    const lockPath = `${statePath}.writer.lock`;
    const absent = inspectDesktopGatewayState(options);
    assert.equal(absent.state_present, false);
    assert.equal(absent.requires_client_reconciliation, null);
    assert.equal(absent.pending_intent_count, null);
    assert.equal(absent.retained_delivery_count, null);
    assert.equal(absent.compacted_through, null);
    assert.equal(absent.retained_creation_claim_count, null);
    assert.equal(absent.current_epoch_client_id_count, null);
    assert.equal(absent.gateway_reconnect_admission, "not-assessed");
    assert.equal(existsSync(statePath), false);
    assert.equal(existsSync(lockPath), false);
    const state = createDesktopGatewayState(options);
    try {
      state.bind_gateway(receipt());
      const prepared = state.record_intent({id: 1, method: "thread/start", params: {cwd: "/fixture"}});
      state.record_delivery({sequence: 1, request_key: prepared.request_key,
        message: {id: 1, result: {thread: {id: "owned-thread"}}}});
      const before = readFileSync(statePath);
      const observed = inspectDesktopGatewayState(options);
      assert.deepEqual({present: observed.state_present, pending: observed.pending_intent_count,
        retained: observed.retained_delivery_count, owned: observed.owned_thread_count,
        sequence: observed.last_acked_sequence, reconcile: observed.requires_client_reconciliation},
      {present: true, pending: 0, retained: 1, owned: 1, sequence: 1, reconcile: true});
      assert.equal(observed.gateway_reconnect_admission, "not-assessed");
      assert.equal(observed.desktop_consumption, "not-observed");
      assert.equal(observed.compacted_through, 0);
      assert.equal(observed.retained_creation_claim_count, 0);
      assert.equal(observed.current_epoch_client_id_count, 1);
      assert.equal(JSON.stringify(observed).includes(token), false);
      assert.equal(JSON.stringify(observed).includes("owned-thread"), false);
      assert.deepEqual(readFileSync(statePath), before);
      assert.equal(existsSync(lockPath), true, "Inspection must not seize or remove the active writer lock.");
    } finally { state.close(); }
    assert.equal(inspectDesktopGatewayState(options).requires_client_reconciliation, true);
    assert.throws(() => inspectDesktopGatewayState({...options,
      desktop_backend_binding: {...backendBinding, binary_sha256: "b".repeat(64)}}),
    /desktop-gateway.state-invalid/);
  });
});

test("desktop gateway inspection CLI reports a bound private snapshot without exposing its contents", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const desktopConsumer = "codex:desktop-wsl";
    const state = createDesktopGatewayState({state_dir: stateDir, consumer_id: desktopConsumer,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      state.bind_gateway({...receipt(), consumer_id: desktopConsumer});
      const prepared = state.record_intent({id: 1, method: "thread/start", params: {cwd: "/fixture"}});
      state.record_delivery({sequence: 1, request_key: prepared.request_key,
        message: {id: 1, result: {thread: {id: "private-owned-thread"}}}});
    } finally { state.close(); }
    const cli = fileURLToPath(new URL("../bin/are-desktop-gateway-inspect.mjs", import.meta.url));
    const checked = spawnSync(process.execPath, [cli, stateDir, backendBinding.binary_sha256,
      backendBinding.host_profile], {encoding: "utf8"});
    assert.equal(checked.status, 0, checked.stderr);
    const summary = JSON.parse(checked.stdout);
    assert.equal(summary.requires_client_reconciliation, true);
    assert.equal(summary.retained_delivery_count, 1);
    assert.equal(summary.compacted_through, 0);
    assert.equal(summary.retained_creation_claim_count, 0);
    assert.equal(summary.current_epoch_client_id_count, 1);
    assert.equal(summary.gateway_reconnect_admission, "not-assessed");
    assert.doesNotMatch(checked.stdout, /private-owned-thread|private-fixture-resume-token|desktop:/);
    const drift = spawnSync(process.execPath, [cli, stateDir, "b".repeat(64),
      backendBinding.host_profile], {encoding: "utf8"});
    assert.equal(drift.status, 2);
    assert.equal(drift.stdout, "");
    assert.match(drift.stderr, /desktop-gateway.state-invalid/);
  });
});

test("desktop gateway state persists connection, intent and delivery before acknowledgement", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async (stateDir) => {
    const first = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    let prepared;
    try {
      assert.deepEqual(first.connect_options(), {resume_token: null, last_acked_sequence: 0});
      first.bind_gateway(receipt());
      prepared = first.record_intent({id: 1, method: "thread/start", params: {cwd: "/fixture"}});
      assert.match(prepared.request_key, /^desktop:/);
      assert.equal(prepared.gateway_message._are_gateway.request_key, prepared.request_key);
      assert.equal(first.record_delivery({sequence: 1,
        message: {method: "thread/status", params: {threadId: "thread-1"}}}), true);
      assert.equal(first.inspect().pending_intent_count, 1);
      const persisted = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
      assert.equal(persisted.resume_token, token);
      assert.equal(persisted.intents[0].request_key, prepared.request_key);
      assert.equal(persisted.deliveries[0].sequence, 1);
      assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
        consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding}), /desktop-gateway.lock-held/);
    } finally { first.close(); }

    const reopened = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      assert.deepEqual(reopened.connect_options(), {resume_token: token, last_acked_sequence: 1});
      assert.throws(() => reopened.bind_gateway(receipt(false, 1)), /desktop-gateway.gateway-mismatch/);
      reopened.bind_gateway(receipt(true, 1));
      assert.equal(reopened.pending_intents().length, 1);
      assert.equal(reopened.deliveries().length, 1);
      const second = reopened.record_intent({id: 2, method: "thread/start", params: {cwd: "/other"}});
      assert.notEqual(second.request_key, prepared.request_key);
      assert.throws(() => reopened.record_intent({id: 1, method: "thread/start", params: {cwd: "/changed"}}),
        /desktop-gateway.client-id-reused/);
    } finally { reopened.close(); }
  });
});

test("desktop gateway records only ordered digest-bound client consumption receipts", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const options = {state_dir: stateDir, consumer_id: consumerId,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding};
    const first = createDesktopGatewayState(options);
    const message = {id: 1, result: {thread: {id: "owned-thread"}}};
    try {
      first.bind_gateway(receipt());
      const request = first.record_intent({id: 1, method: "thread/start", params: {cwd: "/fixture"}});
      first.record_delivery({sequence: 1, request_key: request.request_key, message});
      assert.equal(first.inspect().requires_client_reconciliation, true);
      assert.throws(() => first.begin_client_connection(),
        /desktop-gateway.unreconciled-client-state/);
      assert.throws(() => first.record_desktop_consumption({through_sequence: 2,
        message_digest: digestValue(message)}), /desktop-gateway.consumption-receipt-invalid/);
      assert.throws(() => first.record_desktop_consumption({through_sequence: 1,
        message_digest: "a".repeat(64)}), /desktop-gateway.consumption-receipt-invalid/);
      assert.equal(first.record_desktop_consumption({through_sequence: 1,
        message_digest: digestValue(message)}), true);
      assert.throws(() => first.record_desktop_consumption({through_sequence: 1,
        message_digest: digestValue(message)}), /desktop-gateway.consumption-receipt-invalid/);
      assert.equal(first.inspect().desktop_consumed_through, 1);
      assert.equal(first.inspect().requires_client_reconciliation, false);
    } finally { first.close(); }
    const observed = inspectDesktopGatewayState(options);
    assert.equal(observed.desktop_consumption, "client-receipt-observed");
    assert.equal(observed.requires_client_reconciliation, false);
    assert.equal(observed.gateway_reconnect_admission, "not-assessed");
    const reopened = createDesktopGatewayState(options);
    try {
      reopened.begin_client_connection();
      reopened.bind_gateway(receipt(true, 1));
      assert.equal(reopened.inspect().client_epoch, 2);
      assert.equal(reopened.inspect().owned_thread_count, 1);
      assert.equal(reopened.inspect().desktop_consumed_through, 1);
      const reused = reopened.record_intent({id: 1, method: "thread/resume",
        params: {threadId: "owned-thread"}});
      assert.match(reused.request_key, /^desktop:/);
      assert.equal(JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"))
        .intents.at(-1).client_epoch, 2);
    } finally { reopened.close(); }
  });
});

test("desktop gateway checkpoints long consumed sessions without losing ownership or ID uniqueness", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const options = {state_dir: stateDir, consumer_id: consumerId,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding};
    const statePath = join(stateDir, "desktop-gateway-state.json");
    const state = createDesktopGatewayState(options);
    try {
      state.bind_gateway(receipt());
      for (let sequence = 1; sequence <= 100; sequence += 1) {
        const method = sequence === 1 ? "thread/start" : "thread/read";
        const request = state.record_intent({id: sequence, method,
          params: sequence === 1 ? {cwd: "/fixture"} : {threadId: "owned-thread"}});
        const message = {id: sequence, result: {thread: {id: "owned-thread"}}};
        state.record_delivery({sequence, request_key: request.request_key, message});
        state.record_desktop_consumption({through_sequence: sequence,
          message_digest: digestValue(message)});
      }
      const persisted = JSON.parse(readFileSync(statePath, "utf8"));
      assert.equal(persisted.schema_version, "are.codex-desktop-gateway-state/v7");
      assert.ok(persisted.compacted_through >= 64);
      assert.equal(persisted.compacted_owned_claims.length, 1);
      assert.equal(persisted.current_epoch_client_id_digests.length, 100);
      assert.ok(persisted.intents.length < 48);
      assert.ok(persisted.deliveries.length < 32);
      const observed = inspectDesktopGatewayState(options);
      assert.equal(observed.compacted_through, persisted.compacted_through);
      assert.equal(observed.retained_creation_claim_count, 1);
      assert.equal(observed.current_epoch_client_id_count, 100);
      assert.equal(observed.retained_delivery_count, persisted.deliveries.length);
      assert.equal(state.inspect().owned_thread_count, 1);
      assert.equal(state.inspect().requires_client_reconciliation, false);
      assert.throws(() => state.record_intent({id: 1, method: "thread/read",
        params: {threadId: "owned-thread"}}), /desktop-gateway.client-id-reused/);
    } finally { state.close(); }
    const intact = JSON.parse(readFileSync(statePath, "utf8"));
    const altered = structuredClone(intact);
    delete altered.record_digest;
    altered.compacted_owned_claims[0].thread_ref = "f".repeat(64);
    writeFileSync(statePath, `${JSON.stringify({...altered, record_digest: digestValue(altered)})}\n`,
      {mode: 0o600});
    assert.throws(() => inspectDesktopGatewayState(options), /desktop-gateway.state-invalid/);
    writeFileSync(statePath, `${JSON.stringify(intact)}\n`, {mode: 0o600});
    const reopened = createDesktopGatewayState(options);
    try {
      reopened.begin_client_connection();
      reopened.bind_gateway(receipt(true, 100));
      assert.equal(reopened.inspect().owned_thread_count, 1);
      assert.equal(reopened.inspect().retained_delivery_count, 0);
      assert.match(reopened.record_intent({id: 1, method: "thread/resume",
        params: {threadId: "owned-thread"}}).request_key, /^desktop:/);
    } finally { reopened.close(); }
  });
});

test("desktop gateway migrates v6 state without treating unconsumed delivery as consumed", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const options = {state_dir: stateDir, consumer_id: consumerId,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding};
    const statePath = join(stateDir, "desktop-gateway-state.json");
    const first = createDesktopGatewayState(options);
    const message = {id: 7, result: {thread: {id: "owned-thread"}}};
    try {
      first.bind_gateway(receipt());
      const request = first.record_intent({id: 7, method: "thread/start", params: {cwd: "/fixture"}});
      first.record_delivery({sequence: 1, request_key: request.request_key, message});
    } finally { first.close(); }
    const current = JSON.parse(readFileSync(statePath, "utf8"));
    const {record_digest, compacted_through, compacted_owned_claims,
      current_epoch_client_id_digests, ...legacyMaterial} = current;
    const legacy = {...legacyMaterial, schema_version: "are.codex-desktop-gateway-state/v6"};
    writeFileSync(statePath, `${JSON.stringify({...legacy, record_digest: digestValue(legacy)})}\n`,
      {mode: 0o600});
    const legacyInspection = inspectDesktopGatewayState(options);
    assert.equal(legacyInspection.compacted_through, null);
    assert.equal(legacyInspection.retained_creation_claim_count, null);
    assert.equal(legacyInspection.current_epoch_client_id_count, null);
    const migrated = createDesktopGatewayState(options);
    try {
      assert.equal(JSON.parse(readFileSync(statePath, "utf8")).schema_version,
        "are.codex-desktop-gateway-state/v7");
      assert.equal(migrated.inspect().desktop_consumed_through, 0);
      assert.equal(migrated.inspect().retained_delivery_count, 1);
      assert.throws(() => migrated.begin_client_connection(),
        /desktop-gateway.unreconciled-client-state/);
      migrated.bind_gateway(receipt(true, 1));
      migrated.record_desktop_consumption({through_sequence: 1,
        message_digest: digestValue(message)});
      assert.equal(migrated.inspect().requires_client_reconciliation, false);
    } finally { migrated.close(); }
  });
});

test("desktop gateway writer lock distinguishes a recycled PID from its original process", async context => {
  if (process.platform !== "linux") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const statePath = join(stateDir, "desktop-gateway-state.json");
    const lockPath = `${statePath}.writer.lock`;
    const options = {state_dir: stateDir, consumer_id: consumerId,
      backend_adapter_id: adapterId, desktop_backend_binding: backendBinding};
    const stale = {schema_version: "are.codex-desktop-gateway-state-lock/v2",
      state_path: statePath, host_name: hostname(), process_id: process.pid,
      process_birth_ref: "f".repeat(64), nonce: "recycled-pid-fixture"};
    writeFileSync(lockPath, `${JSON.stringify({...stale, lock_digest: digestValue(stale)})}\n`, {mode: 0o600});
    const replacement = createDesktopGatewayState(options);
    try {
      const acquired = JSON.parse(readFileSync(lockPath, "utf8"));
      assert.equal(acquired.schema_version, "are.codex-desktop-gateway-state-lock/v2");
      assert.notEqual(acquired.process_birth_ref, stale.process_birth_ref);
      assert.equal(acquired.process_id, process.pid);
      assert.throws(() => createDesktopGatewayState(options), /desktop-gateway.lock-held/);
    } finally { replacement.close(); }
    assert.equal(existsSync(`${lockPath}.recovery.lock`), false);
  });
});

test("desktop gateway retains conservative live-PID handling for legacy writer locks", async context => {
  if (process.platform !== "linux") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const statePath = join(stateDir, "desktop-gateway-state.json");
    const lockPath = `${statePath}.writer.lock`;
    const legacy = {schema_version: "are.codex-desktop-gateway-state-lock/v1",
      state_path: statePath, host_name: hostname(), process_id: process.pid,
      nonce: "legacy-live-pid-fixture"};
    writeFileSync(lockPath, `${JSON.stringify({...legacy, lock_digest: digestValue(legacy)})}\n`, {mode: 0o600});
    assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId,
      desktop_backend_binding: backendBinding}), /desktop-gateway.lock-held/);
    assert.equal(existsSync(lockPath), true);
    rmSync(lockPath);
    const orphaned = {...legacy, process_id: 99_999_999, nonce: "legacy-dead-pid-fixture"};
    writeFileSync(lockPath, `${JSON.stringify({...orphaned, lock_digest: digestValue(orphaned)})}\n`, {mode: 0o600});
    const replacement = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId,
      desktop_backend_binding: backendBinding});
    try {
      assert.equal(JSON.parse(readFileSync(lockPath, "utf8")).schema_version,
        "are.codex-desktop-gateway-state-lock/v2");
    } finally { replacement.close(); }
  });
});

test("desktop gateway state binds concurrent intents and out-of-order responses", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async (stateDir) => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      state.bind_gateway(receipt());
      const first = state.record_intent({id: "a", method: "thread/start", params: {cwd: "/fixture"}});
      const concurrent = state.record_intent({id: "b", method: "thread/start", params: {cwd: "/other"}});
      assert.notEqual(concurrent.request_key, first.request_key);
      assert.equal(state.pending_intents().length, 2);
      assert.throws(() => state.record_delivery({sequence: 1, request_key: first.request_key,
        message: {id: "other", result: {}}}),
        /desktop-gateway.response-unbound/);
      assert.throws(() => state.record_delivery({sequence: 1, request_key: first.request_key,
        message: {id: "b", result: {thread: {id: "thread-2"}}}}),
      /desktop-gateway.response-unbound/);
      state.record_delivery({sequence: 1, request_key: concurrent.request_key,
        message: {id: "b", result: {thread: {id: "thread-2"}}}});
      assert.deepEqual(state.pending_intents().map(intent => intent.client_id), ["a"]);
      const response = {id: "a", result: {thread: {id: "thread-1"}}};
      state.record_delivery({sequence: 2, message: response, request_key: first.request_key});
      assert.equal(state.pending_intents().length, 0);
      assert.equal(state.inspect().owned_thread_count, 2);
      assert.throws(() => state.record_intent({id: "unowned", method: "thread/resume",
        params: {threadId: "other-thread"}}), /desktop-gateway.thread-unowned/);
      assert.throws(() => state.record_intent({id: "a", method: "thread/start", params: {cwd: "/changed"}}),
        /desktop-gateway.client-id-reused/);
      const second = state.record_intent({id: "c", method: "turn/start", params: {threadId: "thread-1"}});
      assert.notEqual(second.request_key, first.request_key);
      assert.equal(state.pending_intents().length, 1);
    } finally { state.close(); }
  });
});

test("desktop gateway state claims only a valid creation response before owned-thread ingress", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      state.bind_gateway(receipt());
      const creation = state.record_intent({id: 1, method: "thread/start", params: {cwd: "/fixture"}});
      assert.throws(() => state.record_delivery({sequence: 1, request_key: creation.request_key,
        message: {id: 1, result: {thread: {id: " "}}}}), /desktop-gateway.thread-creation-invalid/);
      assert.equal(state.inspect().last_acked_sequence, 0);
      state.record_delivery({sequence: 1, request_key: creation.request_key,
        message: {id: 1, result: {thread: {id: "owned-thread"}}}});
      assert.equal(state.inspect().owned_thread_count, 1);
      const saved = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
      assert.deepEqual(saved.owned_thread_refs, [digestValue("owned-thread")]);
      assert.throws(() => state.record_intent({id: 2, method: "turn/start",
        params: {threadId: "foreign-thread"}}), /desktop-gateway.thread-unowned/);
      const resumed = state.record_intent({id: 3, method: "thread/resume",
        params: {threadId: "owned-thread"}});
      assert.match(resumed.request_key, /^desktop:/);
      state.record_delivery({sequence: 2, request_key: resumed.request_key,
        message: {id: 3, result: {thread: {id: "owned-thread"}}}});
    } finally { state.close(); }
    const reopened = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      reopened.bind_gateway(receipt(true, 2));
      assert.equal(reopened.inspect().owned_thread_count, 1);
      assert.throws(() => reopened.record_intent({id: 4, method: "turn/interrupt",
        params: {threadId: "foreign-thread", turnId: "turn-1"}}), /desktop-gateway.thread-unowned/);
    } finally { reopened.close(); }
  });
});

test("desktop gateway state binds a server-request rejection diagnostic without a client request key", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      state.bind_gateway(receipt());
      state.record_delivery({sequence: 1, message: {jsonrpc: "2.0", id: "approval-1",
        method: "item/fileChange/requestApproval", params: {threadId: "thread-1"}}});
      state.record_server_response({jsonrpc: "2.0", id: "approval-1",
        result: {decision: "acceptForSession"}});
      const diagnostic = {jsonrpc: "2.0", id: "approval-1",
        error: {code: -32073, message: "Approval binding failed"}};
      assert.equal(state.record_delivery({sequence: 2, message: diagnostic}), true);
      assert.throws(() => state.record_delivery({sequence: 3, message: diagnostic}),
        /desktop-gateway.response-key-missing/);
      assert.throws(() => state.record_delivery({sequence: 3, message: {jsonrpc: "2.0",
        id: "approval-1", result: {decision: "accept"}}}), /desktop-gateway.response-key-missing/);
      assert.throws(() => state.record_delivery({sequence: 3, message: {jsonrpc: "2.0",
        id: "unknown-approval", error: {code: -32073, message: "Unknown"}}}),
      /desktop-gateway.response-key-missing/);
      assert.equal(state.inspect().last_acked_sequence, 2);
    } finally { state.close(); }
  });
});

test("desktop gateway state binds host resolution and refuses a late user-input response", async context => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async stateDir => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    try {
      state.bind_gateway(receipt());
      const request = {jsonrpc: "2.0", id: "input-1", method: "item/tool/requestUserInput",
        params: {threadId: "thread-1", turnId: "turn-1", itemId: "item-1",
          questions: [{id: "choice", header: "Choice", question: "Proceed?"}]}};
      state.record_delivery({sequence: 1, message: request});
      const resolved = {jsonrpc: "2.0", method: "serverRequest/resolved",
        params: {threadId: "thread-1", requestId: "input-1"}};
      assert.throws(() => state.record_delivery({sequence: 2, message: {...resolved,
        params: {threadId: "other-thread", requestId: "input-1"}}}),
      /desktop-gateway.server-request-resolution-unbound/);
      state.record_delivery({sequence: 2, message: resolved});
      assert.throws(() => state.record_server_response({jsonrpc: "2.0", id: "input-1",
        result: {answers: {choice: {answers: ["Yes"]}}}}),
      /desktop-gateway.server-request-resolved/);
      assert.throws(() => state.record_delivery({sequence: 3, message: resolved}),
        /desktop-gateway.server-request-resolution-unbound/);
      assert.equal(state.inspect().last_acked_sequence, 2);
    } finally { state.close(); }
  });
});

test("desktop gateway state refuses torn or altered private records", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async (stateDir) => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    state.bind_gateway(receipt());
    state.close();
    const path = join(stateDir, "desktop-gateway-state.json");
    const original = readFileSync(path, "utf8");
    writeFileSync(path, original.slice(0, -20), {mode: 0o600});
    assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding}), /desktop-gateway.state-unsafe/);
    writeFileSync(path, original.replace(token, "another-token"), {mode: 0o600});
    assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding}), /desktop-gateway.state-invalid/);
    const forged = JSON.parse(original);
    forged.owned_thread_refs = [digestValue("foreign-thread")];
    const {record_digest: ignored, ...material} = forged;
    forged.record_digest = digestValue(material);
    writeFileSync(path, `${JSON.stringify(forged)}\n`, {mode: 0o600});
    assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding}),
    /desktop-gateway.state-invalid/);
  });
});

test("desktop gateway state rejects a changed backend binding after restart", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop gateway client runs in WSL.");
  await withPrivateDir(async (stateDir) => {
    const state = createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId, desktop_backend_binding: backendBinding});
    state.bind_gateway(receipt());
    state.close();
    assert.throws(() => createDesktopGatewayState({state_dir: stateDir,
      consumer_id: consumerId, backend_adapter_id: adapterId,
      desktop_backend_binding: {...backendBinding, binary_sha256: "b".repeat(64)}}),
    /desktop-gateway.state-invalid/);
  });
});
