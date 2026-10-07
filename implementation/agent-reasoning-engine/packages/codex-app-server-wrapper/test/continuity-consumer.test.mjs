import assert from "node:assert/strict";
import {EventEmitter, once} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_NOTIFICATION,
  CONTINUITY_OWNER_DECISION_DIGEST,
  createAppServerRpcClient,
  createContinuityHostConsumer,
  materializeContinuityProjection,
  validateContinuityNotification,
} from "../index.mjs";

const enabled = {
  enabled: true,
  mode: "context-and-notification",
  candidate_ref: CONTINUITY_CANDIDATE_REF,
  learning_package_digest: CONTINUITY_LEARNING_PACKAGE_DIGEST,
  owner_decision_digest: CONTINUITY_OWNER_DECISION_DIGEST,
};

function notification() {
  const materialized = materializeContinuityProjection({
    configuration: enabled,
    resolution: {disposition: "resolved", transition: "continue", resolution_digest: "a".repeat(64), next_state: {state_digest: "b".repeat(64), active_objective: {description: "Confirm host continuity."}}},
    engine_binding: {high_risk: true, active_cycle: "controlled-upgrade-preflight", relationship_code: "same-cycle-continuation", response_language: "en", next_action: "Verify the bounded host receipt.", clarification_needed: false, evidence_status: "pending"},
  });
  assert.equal(materialized.ok, true);
  return {jsonrpc: "2.0", method: CONTINUITY_NOTIFICATION, params: materialized.projection};
}

function fakeTransport() {
  return {input: new PassThrough(), output: new PassThrough(), failure: new EventEmitter(), ready: Promise.resolve({ok: true}), close: async () => {}, inspect: () => ({kind: "fake"})};
}

test("host validates, surfaces, and receipts an exact continuity notification", async () => {
  const surfaced = [];
  const consumer = createContinuityHostConsumer({surface: async (projection) => surfaced.push(projection.response)});
  const result = await consumer.consume(notification());
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "surfaced");
  assert.equal(surfaced.length, 1);
  assert.equal(consumer.inspect().surfaced_count, 1);
  assert.match(result.receipt.receipt_digest, /^[a-f0-9]{64}$/u);
});

test("host rejects tampering and never calls the surface", async () => {
  let calls = 0;
  const consumer = createContinuityHostConsumer({surface: () => { calls += 1; }});
  const value = structuredClone(notification());
  value.params.response = "tampered";
  const result = await consumer.consume(value);
  assert.equal(result.ok, false);
  assert.equal(calls, 0);
  assert.equal(consumer.inspect().rejected_count, 1);
  assert.ok(result.reason_codes.includes("continuity-host.projection-digest-mismatch"));
});

test("recovered host state suppresses a replayed projection", async () => {
  const message = notification();
  const first = createContinuityHostConsumer({surface: () => {}});
  assert.equal((await first.consume(message)).disposition, "surfaced");
  let recoveryCalls = 0;
  const recovered = createContinuityHostConsumer({retained_projection_digests: first.inspect().retained_projection_digests, surface: () => { recoveryCalls += 1; }});
  const replay = await recovered.consume(message);
  assert.equal(replay.disposition, "duplicate-suppressed");
  assert.equal(recoveryCalls, 0);
  assert.equal(recovered.inspect().duplicate_suppressed_count, 1);
});

test("shared RPC host routes continuity notifications through the validated surface", async () => {
  const transport = fakeTransport();
  let surfaces = 0;
  const consumer = createContinuityHostConsumer({surface: () => { surfaces += 1; }});
  const client = createAppServerRpcClient({transport, continuity_consumer: consumer});
  const observed = once(client.events, "continuity");
  transport.output.write(`${JSON.stringify(notification())}\n`);
  const [result] = await observed;
  assert.equal(result.disposition, "surfaced");
  assert.equal(surfaces, 1);
  await client.close();
});

test("shared RPC host fails closed on a malformed named continuity notification", async () => {
  const transport = fakeTransport();
  const consumer = createContinuityHostConsumer({surface: () => {}});
  const client = createAppServerRpcClient({transport, continuity_consumer: consumer});
  const failed = once(client.events, "failure");
  const value = notification();
  value.params = {...value.params, projection_digest: "0".repeat(64)};
  transport.output.write(`${JSON.stringify(value)}\n`);
  const [error] = await failed;
  assert.equal(error.code, "rpc.continuity-notification-invalid");
  assert.equal(client.inspect().closed, true);
});

test("validator rejects generic notifications without classifying them as continuity", () => {
  const result = validateContinuityNotification({jsonrpc: "2.0", method: "turn/completed", params: {}});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("continuity-host.notification-invalid"));
});
