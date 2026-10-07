import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {connectGatewayRpcTransport, createPersistentGateway, readAdapterObservation, readGatewayThreadObservation, readGatewayDecisionObservation} from "../index.mjs";
import {resolveGatewayIpcPath} from "../src/local-ipc.mjs";

const pipe = (name) => `\\\\.\\pipe\\are-${name}-${process.pid}-${randomUUID()}`;
const connectionToken = "test-only-gateway-connection-token-32-bytes";
const observationToken = "test-only-gateway-observation-token-32-bytes";

function fakeChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => { child.emit("exit", 0, "SIGTERM"); return true; };
  return child;
}

function wrapper() {
  return {
    processClientMessage: async (message) => ({to_server: [message], to_client: []}),
    processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
    observeReasoningThreads: () => [{thread_ref: `backend-thread:${"a".repeat(64)}`, phase: "turn-active", reasoning_epoch_digest: "b".repeat(64), checkpoint_digest: "c".repeat(64), latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null}],
    observeDecisions: () => [{decision_type: "turn-preflight", outcome: "direct", thread_ref: `backend-thread:${"a".repeat(64)}`, decision_digest: "b".repeat(64), evidence_event_digest: "c".repeat(64), event_sequence: 1, observed_at_unix_ms: Date.now(), reason_codes: []}],
    prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`, epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
  };
}

test("Windows IPC paths retain a strict local named-pipe identity", () => {
  const path = pipe("validated");
  assert.equal(resolveGatewayIpcPath(path, "win32"), path);
  assert.throws(() => resolveGatewayIpcPath("C:\\tmp\\gateway.sock", "win32"), /named pipe/);
  assert.throws(() => resolveGatewayIpcPath("\\\\server\\pipe\\gateway", "win32"), /local named pipe/);
  assert.throws(() => resolveGatewayIpcPath("\\\\.\\pipe\\a..b", "win32"), /invalid/);
});

test("Windows named-pipe gateway authenticates normal and observation paths", {skip: process.platform !== "win32"}, async () => {
  const listenPath = pipe("gateway");
  const observationPath = pipe("observation");
  assert.throws(() => createPersistentGateway({listen_path: listenPath, wrapper_factory: wrapper}), /connection token/);
  let wrapperCount = 0;
  let backendCount = 0;
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    observation_listen_path: observationPath,
    observation_token: observationToken,
    connection_token: connectionToken,
    wrapper_factory: () => { wrapperCount += 1; return wrapper(); },
    spawn_impl: () => { backendCount += 1; return fakeChild(); },
  });
  try {
    await gateway.start();
    const initial = await readAdapterObservation({socket_path: observationPath, token: observationToken});
    assert.equal(initial.gateway.status, "running");
    assert.equal(initial.backend.status, "not-observed");
    const initialThreads = await readGatewayThreadObservation({socket_path: observationPath, token: observationToken});
    assert.equal(initialThreads.thread_count, 0);
    const initialDecisions = await readGatewayDecisionObservation({socket_path: observationPath, token: observationToken});
    assert.equal(initialDecisions.decision_count, 0);
    assert.equal(wrapperCount, 0);
    assert.equal(backendCount, 0);

    const denied = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "windows:test", lane: "interaction-bound", connection_token: `${connectionToken}-wrong`});
    await assert.rejects(denied.ready, /gateway\.client-not-authorized/);
    await denied.close();
    assert.equal(wrapperCount, 0);

    const accepted = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "windows:test", lane: "interaction-bound", connection_token: connectionToken});
    const receipt = await accepted.ready;
    assert.equal(receipt.ok, true);
    assert.equal(wrapperCount, 1);
    assert.equal(backendCount, 1);
    const live = await readAdapterObservation({socket_path: observationPath, token: observationToken});
    assert.equal(live.client_link.status, "connected");
    assert.equal(live.backend.status, "running");
    const threads = await readGatewayThreadObservation({socket_path: observationPath, token: observationToken});
    assert.equal(threads.thread_count, 1);
    assert.equal(threads.threads[0].phase, "turn-active");
    assert.doesNotMatch(JSON.stringify(threads), /windows:test/);
    const decisions = await readGatewayDecisionObservation({socket_path: observationPath, token: observationToken});
    assert.equal(decisions.decision_count, 1);
    assert.equal(decisions.decisions[0].decision_type, "turn-preflight");
    assert.doesNotMatch(JSON.stringify(decisions), /windows:test/);
    assert.doesNotMatch(JSON.stringify(live), /windows:test|connection-token|observation-token/);
    await assert.rejects(readAdapterObservation({socket_path: observationPath, token: `${observationToken}-wrong`}), /adapter\.observation-/);
    await assert.rejects(readGatewayThreadObservation({socket_path: observationPath, token: `${observationToken}-wrong`}), /thread\.observation-/);
    await assert.rejects(readGatewayDecisionObservation({socket_path: observationPath, token: `${observationToken}-wrong`}), /decision\.observation-/);
    await accepted.close();
  } finally {
    await gateway.close();
  }
  // Windows pipes are removed when the server closes; the exact name is reusable.
  const reopened = createPersistentGateway({listen_path: listenPath, connection_token: connectionToken, wrapper_factory: wrapper, spawn_impl: fakeChild});
  try { await reopened.start(); } finally { await reopened.close(); }
});
