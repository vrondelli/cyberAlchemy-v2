import {
  sha256Canonical,
  validateConcernRecord,
  type ConcernJoinV1,
  type ExactConcernRecordV1,
  type PropertyResult,
} from "./operation-persistence-observer.ts";

export type EventBoundaryStage =
  | "in-process-handler"
  | "durable-intent-persisted"
  | "external-transporter-placement"
  | "send-attempt-observed"
  | "provider-accepted"
  | "delivered-or-redelivered"
  | "consumer-application-committed";

export interface EventStageEvidenceV1 {
  evidence_id: string;
  dependency_role:
    | "event-handler"
    | "outbox-repository"
    | "transporter"
    | "consumer";
  operation_kind:
    | "callable-invocation"
    | "persistence-write"
    | "external-provider-placement"
    | "send-attempt"
    | "provider-acceptance"
    | "delivery-observation"
    | "consumer-commit";
  symbol_name: string;
  interface_ref: string;
  evidence_kind: "static" | "runtime";
  claimed_stage: EventBoundaryStage;
  source_ref: string;
  source_sha256: string;
}

export interface EventBoundaryObservationV1 {
  schema_version: "ape.operation.event-boundary-observation/v1";
  observation_id: string;
  observation_ref: string;
  subject_meta_type_id: "Operation";
  evidence: EventStageEvidenceV1[];
  observation_sha256: string;
}

export interface EventStageResultV1 {
  evidence_id: string;
  stage: EventBoundaryStage;
  status: PropertyResult;
  diagnostic: string;
  record_id: string | null;
  record_sha256: string | null;
}

export interface OperationEventBoundaryResultV1 {
  schema_version: "ape.operation-event-boundary-result/v1";
  subject_meta_type_id: "Operation";
  status: PropertyResult;
  diagnostic: string;
  observation_id: string;
  observation_sha256: string;
  stage_results: EventStageResultV1[];
  joins: ConcernJoinV1[];
  owner_route: "system-integration:transport-delivery-owner";
  forbidden_inferences: string[];
  authority_effect: "none";
  runtime_guarantee_claimed: false;
}

type JsonRecord = Record<string, unknown>;
const SHA256 = /^[a-f0-9]{64}$/;
const STAGE_BY_OPERATION: Readonly<Record<EventStageEvidenceV1["operation_kind"], EventBoundaryStage>> = {
  "callable-invocation": "in-process-handler",
  "persistence-write": "durable-intent-persisted",
  "external-provider-placement": "external-transporter-placement",
  "send-attempt": "send-attempt-observed",
  "provider-acceptance": "provider-accepted",
  "delivery-observation": "delivered-or-redelivered",
  "consumer-commit": "consumer-application-committed",
};
const ROLE_BY_OPERATION: Readonly<Record<EventStageEvidenceV1["operation_kind"], EventStageEvidenceV1["dependency_role"]>> = {
  "callable-invocation": "event-handler",
  "persistence-write": "outbox-repository",
  "external-provider-placement": "transporter",
  "send-attempt": "transporter",
  "provider-acceptance": "transporter",
  "delivery-observation": "transporter",
  "consumer-commit": "consumer",
};

function object(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`AOP_EVENT_SCHEMA at ${selector}`);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], selector: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`AOP_EVENT_SCHEMA at ${selector}`);
  }
}

function nonEmpty(value: unknown, selector: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`AOP_EVENT_SCHEMA at ${selector}`);
  }
  return value;
}

function sha(value: unknown, selector: string): string {
  const candidate = nonEmpty(value, selector);
  if (!SHA256.test(candidate)) throw new Error(`AOP_EVENT_SCHEMA at ${selector}`);
  return candidate;
}

function validateEvidence(value: unknown, selector: string): EventStageEvidenceV1 {
  const candidate = object(value, selector);
  exactKeys(
    candidate,
    [
      "evidence_id",
      "dependency_role",
      "operation_kind",
      "symbol_name",
      "interface_ref",
      "evidence_kind",
      "claimed_stage",
      "source_ref",
      "source_sha256",
    ],
    selector,
  );
  nonEmpty(candidate.evidence_id, `${selector}.evidence_id`);
  nonEmpty(candidate.symbol_name, `${selector}.symbol_name`);
  nonEmpty(candidate.interface_ref, `${selector}.interface_ref`);
  if (!["static", "runtime"].includes(candidate.evidence_kind as string)) {
    throw new Error(`AOP_EVENT_SCHEMA at ${selector}.evidence_kind`);
  }
  nonEmpty(candidate.source_ref, `${selector}.source_ref`);
  sha(candidate.source_sha256, `${selector}.source_sha256`);
  if (
    typeof candidate.operation_kind !== "string" ||
    !(candidate.operation_kind in STAGE_BY_OPERATION)
  ) {
    throw new Error(`AOP_EVENT_SCHEMA at ${selector}.operation_kind`);
  }
  const kind = candidate.operation_kind as EventStageEvidenceV1["operation_kind"];
  if (candidate.dependency_role !== ROLE_BY_OPERATION[kind]) {
    throw new Error(`AOP_EVENT_ROLE_MISMATCH at ${selector}.dependency_role`);
  }
  if (candidate.claimed_stage !== STAGE_BY_OPERATION[kind]) {
    throw new Error(`AOP_EVENT_STAGE_INFERENCE at ${selector}.claimed_stage`);
  }
  return candidate as unknown as EventStageEvidenceV1;
}

export function sealEventBoundaryObservation(
  body: Omit<EventBoundaryObservationV1, "observation_sha256">,
): EventBoundaryObservationV1 {
  return { ...body, observation_sha256: sha256Canonical(body) };
}

export function validateEventBoundaryObservation(
  value: unknown,
): EventBoundaryObservationV1 {
  const candidate = object(value, "$.stage_observation");
  exactKeys(
    candidate,
    [
      "schema_version",
      "observation_id",
      "observation_ref",
      "subject_meta_type_id",
      "evidence",
      "observation_sha256",
    ],
    "$.stage_observation",
  );
  if (
    candidate.schema_version !== "ape.operation.event-boundary-observation/v1" ||
    candidate.subject_meta_type_id !== "Operation"
  ) {
    throw new Error("AOP_EVENT_SCHEMA at $.stage_observation");
  }
  nonEmpty(candidate.observation_id, "$.stage_observation.observation_id");
  nonEmpty(candidate.observation_ref, "$.stage_observation.observation_ref");
  if (!Array.isArray(candidate.evidence) || candidate.evidence.length === 0) {
    throw new Error("AOP_EVENT_SCHEMA at $.stage_observation.evidence");
  }
  const evidence = candidate.evidence.map((entry, index) =>
    validateEvidence(entry, `$.stage_observation.evidence[${index}]`),
  );
  if (new Set(evidence.map((entry) => entry.evidence_id)).size !== evidence.length) {
    throw new Error("AOP_EVENT_DUPLICATE_EVIDENCE at $.stage_observation.evidence");
  }
  const expectedSha = sha(
    candidate.observation_sha256,
    "$.stage_observation.observation_sha256",
  );
  const { observation_sha256: _ignored, ...body } = candidate;
  if (sha256Canonical(body) !== expectedSha) {
    throw new Error(
      "AOP_EVENT_STALE_OBSERVATION at $.stage_observation.observation_sha256",
    );
  }
  return candidate as unknown as EventBoundaryObservationV1;
}

function requiredConcern(stage: EventBoundaryStage): "transport" | "delivery" | null {
  if (stage === "send-attempt-observed" || stage === "provider-accepted") {
    return "transport";
  }
  if (stage === "delivered-or-redelivered") return "delivery";
  return null;
}

function join(
  observation: EventBoundaryObservationV1,
  record: ExactConcernRecordV1,
): ConcernJoinV1 {
  return {
    concern_kind: record.concern_kind,
    observation_id: observation.observation_id,
    observation_ref: observation.observation_ref,
    observation_sha256: observation.observation_sha256,
    record_id: record.record_id,
    record_ref: record.record_ref,
    record_sha256: record.record_sha256,
    external_status: record.status,
    external_ceiling: record.ceiling,
    interface_ref: record.interface_ref,
    evidence_lane: record.evidence_lane,
  };
}

export function observeOperationEventBoundary(
  value: unknown,
): OperationEventBoundaryResultV1 {
  const input = object(value, "$");
  exactKeys(
    input,
    ["stage_observation", "external_records", "collapsed_status_claimed"],
    "$",
  );
  if (typeof input.collapsed_status_claimed !== "boolean") {
    throw new Error("AOP_EVENT_SCHEMA at $.collapsed_status_claimed");
  }
  const observation = validateEventBoundaryObservation(input.stage_observation);
  if (!Array.isArray(input.external_records)) {
    throw new Error("AOP_EVENT_SCHEMA at $.external_records");
  }
  const records = input.external_records.map((entry, index) =>
    validateConcernRecord(entry, `$.external_records[${index}]`),
  );
  const concernKinds = records.map((entry) => entry.concern_kind);
  if (new Set(concernKinds).size !== concernKinds.length) {
    throw new Error("AOP_EVENT_DUPLICATE_JOIN at $.external_records");
  }
  if (input.collapsed_status_claimed) {
    return {
      schema_version: "ape.operation-event-boundary-result/v1",
      subject_meta_type_id: "Operation",
      status: "fail",
      diagnostic: "AOP_EVENT_STAGE_COLLAPSE",
      observation_id: observation.observation_id,
      observation_sha256: observation.observation_sha256,
      stage_results: [],
      joins: [],
      owner_route: "system-integration:transport-delivery-owner",
      forbidden_inferences: [
        "event-handler-is-external-send",
        "intent-commit-is-delivery",
        "send-is-provider-acceptance",
        "provider-acceptance-is-delivery",
        "delivery-is-consumer-commit",
      ],
      authority_effect: "none",
      runtime_guarantee_claimed: false,
    };
  }

  const stageResults: EventStageResultV1[] = [];
  const usedRecords = new Set<string>();
  for (const evidence of observation.evidence) {
    const stage = STAGE_BY_OPERATION[evidence.operation_kind];
    const required = requiredConcern(stage);
    if (
      [
        "send-attempt-observed",
        "provider-accepted",
        "delivered-or-redelivered",
        "consumer-application-committed",
      ].includes(stage) &&
      evidence.evidence_kind !== "runtime"
    ) {
      stageResults.push({
        evidence_id: evidence.evidence_id,
        stage,
        status: "owner-blocked",
        diagnostic: "AOP_EVENT_RUNTIME_EVIDENCE_REQUIRED",
        record_id: null,
        record_sha256: null,
      });
      continue;
    }
    if (required === null) {
      stageResults.push({
        evidence_id: evidence.evidence_id,
        stage,
        status: "pass",
        diagnostic: "AOP_EVENT_STAGE_PASS",
        record_id: null,
        record_sha256: null,
      });
      continue;
    }
    const external = records.find((entry) => entry.concern_kind === required);
    if (external === undefined) {
      stageResults.push({
        evidence_id: evidence.evidence_id,
        stage,
        status: "owner-blocked",
        diagnostic: "AOP_EVENT_EXTERNAL_RECORD_REQUIRED",
        record_id: null,
        record_sha256: null,
      });
      continue;
    }
    if (external.interface_ref !== evidence.interface_ref) {
      throw new Error(
        `AOP_EVENT_INTERFACE_MISMATCH at $.stage_observation.evidence[${evidence.evidence_id}]`,
      );
    }
    usedRecords.add(external.record_id);
    const recordAdmitted =
      external.evidence_lane === "canonical" && external.status === "admitted";
    stageResults.push({
      evidence_id: evidence.evidence_id,
      stage,
      status: "owner-blocked",
      diagnostic: recordAdmitted
        ? "AOP_EVENT_EXTERNAL_SCHEMA_NOT_ADMITTED"
        : "AOP_EVENT_EXTERNAL_RECORD_NOT_ADMITTED",
      record_id: external.record_id,
      record_sha256: external.record_sha256,
    });
  }
  if (records.some((entry) => !usedRecords.has(entry.record_id))) {
    throw new Error("AOP_EVENT_UNUSED_EXTERNAL_RECORD at $.external_records");
  }
  const joins = records.map((entry) => join(observation, entry));
  const status: PropertyResult = stageResults.some((entry) => entry.status === "fail")
    ? "fail"
    : stageResults.some((entry) => entry.status === "owner-blocked")
      ? "owner-blocked"
      : "pass";
  return {
    schema_version: "ape.operation-event-boundary-result/v1",
    subject_meta_type_id: "Operation",
    status,
    diagnostic:
      status === "pass"
        ? "AOP_EVENT_BOUNDARY_PASS"
        : "AOP_EVENT_BOUNDARY_OWNER_BLOCKED",
    observation_id: observation.observation_id,
    observation_sha256: observation.observation_sha256,
    stage_results: stageResults,
    joins,
    owner_route: "system-integration:transport-delivery-owner",
    forbidden_inferences: [
      "event-handler-is-external-send",
      "intent-commit-is-delivery",
      "send-is-provider-acceptance",
      "provider-acceptance-is-delivery",
      "delivery-is-consumer-commit",
    ],
    authority_effect: "none",
    runtime_guarantee_claimed: false,
  };
}
