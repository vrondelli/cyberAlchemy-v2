import assert from "node:assert/strict";
import test from "node:test";

import { sealConcernRecord, type ExactConcernRecordV1 } from "./operation-persistence-observer.ts";
import {
  observeOperationEventBoundary,
  sealEventBoundaryObservation,
  type EventBoundaryObservationV1,
  type EventStageEvidenceV1,
} from "./operation-event-boundary-observer.ts";

const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);

const LOCAL_EVIDENCE: EventStageEvidenceV1[] = [
  {
    evidence_id: "poker.event-handler.call",
    dependency_role: "event-handler",
    operation_kind: "callable-invocation",
    symbol_name: "onEvent",
    interface_ref: "PlayerManagementEventHandler",
    evidence_kind: "static",
    claimed_stage: "in-process-handler",
    source_ref: "validation/poker-team/backend/src/use-cases/player/create-player.ts",
    source_sha256: HEX_A,
  },
  {
    evidence_id: "poker.outbox.persist",
    dependency_role: "outbox-repository",
    operation_kind: "persistence-write",
    symbol_name: "publish",
    interface_ref: "OutboxRepository",
    evidence_kind: "static",
    claimed_stage: "durable-intent-persisted",
    source_ref: "fixtures/outbox-adapter.ts",
    source_sha256: HEX_B,
  },
  {
    evidence_id: "poker.transporter.send",
    dependency_role: "transporter",
    operation_kind: "external-provider-placement",
    symbol_name: "MessageTransporterAdapter",
    interface_ref: "MessageTransporter",
    evidence_kind: "static",
    claimed_stage: "external-transporter-placement",
    source_ref: "fixtures/message-transporter.ts",
    source_sha256: HEX_B,
  },
];

function observation(
  evidence: EventStageEvidenceV1[] = LOCAL_EVIDENCE,
): EventBoundaryObservationV1 {
  return sealEventBoundaryObservation({
    schema_version: "ape.operation.event-boundary-observation/v1",
    observation_id: "poker.operation.event-boundaries",
    observation_ref: "fixtures/observations.json#/event_boundary",
    subject_meta_type_id: "Operation",
    evidence,
  });
}

function externalRecord(
  kind: "transport" | "delivery",
  overrides: Partial<Omit<ExactConcernRecordV1, "record_sha256">> = {},
): ExactConcernRecordV1 {
  return sealConcernRecord({
    schema_version: "system-integration.concern-record/v1",
    evidence_lane: "canonical",
    record_id: `fixture.${kind}.message-provider`,
    record_ref: `fixtures/records.json#/${kind}`,
    concern_kind: kind,
    status: "admitted",
    ceiling: `fixture-only-${kind}`,
    interface_ref: "MessageTransporter",
    payload_sha256: kind === "transport" ? HEX_A : HEX_B,
    authority_effect: "none",
    ...overrides,
  });
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    stage_observation: observation(),
    external_records: [],
    collapsed_status_claimed: false,
    ...overrides,
  };
}

test("keeps in-process, durable intent, and external send placement distinct", () => {
  const actual = observeOperationEventBoundary(input());
  assert.deepEqual(
    [actual.status, actual.diagnostic],
    ["pass", "AOP_EVENT_BOUNDARY_PASS"],
  );
  assert.deepEqual(
    actual.stage_results.map((entry) => entry.stage),
    [
      "in-process-handler",
      "durable-intent-persisted",
      "external-transporter-placement",
    ],
  );
  assert.equal(actual.joins.length, 0);
});

test("preserves exact transport and delivery joins but keeps their unadmitted schemas owner-blocked", () => {
  const evidence: EventStageEvidenceV1[] = [
    ...LOCAL_EVIDENCE,
    {
      evidence_id: "provider.send-attempt",
      dependency_role: "transporter",
      operation_kind: "send-attempt",
      symbol_name: "send",
      interface_ref: "MessageTransporter",
      evidence_kind: "runtime",
      claimed_stage: "send-attempt-observed",
      source_ref: "fixtures/provider-receipt.json",
      source_sha256: HEX_A,
    },
    {
      evidence_id: "provider.accepted",
      dependency_role: "transporter",
      operation_kind: "provider-acceptance",
      symbol_name: "providerReceipt",
      interface_ref: "MessageTransporter",
      evidence_kind: "runtime",
      claimed_stage: "provider-accepted",
      source_ref: "fixtures/provider-receipt.json",
      source_sha256: HEX_A,
    },
    {
      evidence_id: "message.delivered",
      dependency_role: "transporter",
      operation_kind: "delivery-observation",
      symbol_name: "deliveryReceipt",
      interface_ref: "MessageTransporter",
      evidence_kind: "runtime",
      claimed_stage: "delivered-or-redelivered",
      source_ref: "fixtures/delivery-receipt.json",
      source_sha256: HEX_B,
    },
    {
      evidence_id: "consumer.committed",
      dependency_role: "consumer",
      operation_kind: "consumer-commit",
      symbol_name: "applicationCommit",
      interface_ref: "MessageConsumer",
      evidence_kind: "runtime",
      claimed_stage: "consumer-application-committed",
      source_ref: "fixtures/delivery-receipt.json",
      source_sha256: HEX_B,
    },
  ];
  const actual = observeOperationEventBoundary(
    input({
      stage_observation: observation(evidence),
      external_records: [externalRecord("transport"), externalRecord("delivery")],
    }),
  );
  assert.equal(actual.status, "owner-blocked");
  assert.equal(new Set(actual.stage_results.map((entry) => entry.stage)).size, 7);
  assert.deepEqual(
    actual.joins.map((entry) => entry.concern_kind),
    ["transport", "delivery"],
  );
  assert.deepEqual(
    actual.stage_results
      .filter((entry) => entry.record_id !== null)
      .map((entry) => entry.diagnostic),
    [
      "AOP_EVENT_EXTERNAL_SCHEMA_NOT_ADMITTED",
      "AOP_EVENT_EXTERNAL_SCHEMA_NOT_ADMITTED",
      "AOP_EVENT_EXTERNAL_SCHEMA_NOT_ADMITTED",
    ],
  );
  assert.equal(actual.runtime_guarantee_claimed, false);
});

test("missing or unadmitted transport/delivery evidence stays owner-blocked", () => {
  const acceptance: EventStageEvidenceV1 = {
    evidence_id: "provider.accepted",
    dependency_role: "transporter",
    operation_kind: "provider-acceptance",
    symbol_name: "providerReceipt",
    interface_ref: "MessageTransporter",
    evidence_kind: "runtime",
    claimed_stage: "provider-accepted",
    source_ref: "fixtures/provider-receipt.json",
    source_sha256: HEX_A,
  };
  const missing = observeOperationEventBoundary(
    input({ stage_observation: observation([acceptance]) }),
  );
  assert.deepEqual(
    [missing.status, missing.stage_results[0].diagnostic],
    ["owner-blocked", "AOP_EVENT_EXTERNAL_RECORD_REQUIRED"],
  );
  const candidate = observeOperationEventBoundary(
    input({
      stage_observation: observation([acceptance]),
      external_records: [externalRecord("transport", { status: "candidate" })],
    }),
  );
  assert.deepEqual(
    [candidate.status, candidate.stage_results[0].diagnostic],
    ["owner-blocked", "AOP_EVENT_EXTERNAL_RECORD_NOT_ADMITTED"],
  );
  const selfAdmittedFixture = observeOperationEventBoundary(
    input({
      stage_observation: observation([acceptance]),
      external_records: [
        externalRecord("transport", {
          evidence_lane: "candidate-local-fixture",
          status: "admitted",
        }),
      ],
    }),
  );
  assert.deepEqual(
    [selfAdmittedFixture.status, selfAdmittedFixture.stage_results[0].diagnostic],
    ["owner-blocked", "AOP_EVENT_EXTERNAL_RECORD_NOT_ADMITTED"],
  );
});

test("a publish-named persistence write cannot become delivery", () => {
  const mutant: EventStageEvidenceV1 = {
    ...LOCAL_EVIDENCE[1],
    claimed_stage: "delivered-or-redelivered",
  };
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({ stage_observation: observation([mutant]) }),
      ),
    /AOP_EVENT_STAGE_INFERENCE/,
  );
});

test("an EventHandler call cannot become an external send", () => {
  const mutant: EventStageEvidenceV1 = {
    ...LOCAL_EVIDENCE[0],
    claimed_stage: "send-attempt-observed",
  };
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({ stage_observation: observation([mutant]) }),
      ),
    /AOP_EVENT_STAGE_INFERENCE/,
  );
});

test("rejects one collapsed status for the seven-stage ladder", () => {
  const actual = observeOperationEventBoundary(
    input({ collapsed_status_claimed: true }),
  );
  assert.deepEqual(
    [actual.status, actual.diagnostic],
    ["fail", "AOP_EVENT_STAGE_COLLAPSE"],
  );
});

test("delivery evidence cannot stand in for consumer application commit", () => {
  const consumerCommit: EventStageEvidenceV1 = {
    evidence_id: "consumer.committed",
    dependency_role: "consumer",
    operation_kind: "consumer-commit",
    symbol_name: "applicationCommit",
    interface_ref: "MessageConsumer",
    evidence_kind: "runtime",
    claimed_stage: "consumer-application-committed",
    source_ref: "fixtures/consumer-receipt.json",
    source_sha256: HEX_B,
  };
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({
          stage_observation: observation([consumerCommit]),
          external_records: [externalRecord("delivery")],
        }),
      ),
    /AOP_EVENT_UNUSED_EXTERNAL_RECORD/,
  );

  const staticOnly = observeOperationEventBoundary(
    input({
      stage_observation: observation([
        { ...consumerCommit, evidence_kind: "static" },
      ]),
    }),
  );
  assert.deepEqual(
    [staticOnly.status, staticOnly.stage_results[0].diagnostic],
    ["owner-blocked", "AOP_EVENT_RUNTIME_EVIDENCE_REQUIRED"],
  );
});

test("external record interface must match the exact Transporter contract", () => {
  const acceptance: EventStageEvidenceV1 = {
    evidence_id: "provider.accepted",
    dependency_role: "transporter",
    operation_kind: "provider-acceptance",
    symbol_name: "providerReceipt",
    interface_ref: "MessageTransporter",
    evidence_kind: "runtime",
    claimed_stage: "provider-accepted",
    source_ref: "fixtures/provider-receipt.json",
    source_sha256: HEX_A,
  };
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({
          stage_observation: observation([acceptance]),
          external_records: [
            externalRecord("transport", { interface_ref: "OtherTransporter" }),
          ],
        }),
      ),
    /AOP_EVENT_INTERFACE_MISMATCH/,
  );
});

test("rejects stale observation and duplicate concern records", () => {
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({
          stage_observation: {
            ...observation(),
            observation_id: "mutated",
          },
        }),
      ),
    /AOP_EVENT_STALE_OBSERVATION/,
  );
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({
          external_records: [
            externalRecord("transport"),
            externalRecord("transport", { record_id: "fixture.transport.second" }),
          ],
        }),
      ),
    /AOP_EVENT_DUPLICATE_JOIN/,
  );
});

test("rejects role relabeling even when stage text looks valid", () => {
  const mutant = {
    ...LOCAL_EVIDENCE[2],
    dependency_role: "event-handler",
  } as EventStageEvidenceV1;
  assert.throws(
    () =>
      observeOperationEventBoundary(
        input({ stage_observation: observation([mutant]) }),
      ),
    /AOP_EVENT_ROLE_MISMATCH/,
  );
});
