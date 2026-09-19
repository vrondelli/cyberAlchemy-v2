import { createHash } from "node:crypto";

export const PERSISTENCE_OBSERVER_SCHEMA_VERSION =
  "ape.operation-persistence-observer/v1" as const;

export type PropertyResult =
  | "pass"
  | "fail"
  | "missing"
  | "unsupported"
  | "owner-blocked";

export type ConcernKind =
  | "persistence"
  | "transaction"
  | "failure"
  | "transport"
  | "delivery";

export interface ExactConcernRecordV1 {
  schema_version: "system-integration.concern-record/v1";
  evidence_lane: "candidate-local-fixture" | "canonical";
  record_id: string;
  record_ref: string;
  concern_kind: ConcernKind;
  status: "admitted" | "candidate" | "absent";
  ceiling: string;
  interface_ref: string | null;
  payload_sha256: string;
  authority_effect: "none";
  record_sha256: string;
}

export interface RepositoryObservationV1 {
  schema_version: "ape.operation.repository-observation/v1";
  observation_id: string;
  observation_ref: string;
  subject_meta_type_id: "Operation";
  property_id: "APE.ImplementationProperty.operation.repository-boundary";
  dependency_role: "repository";
  interface_ref: string;
  adapter_ref: string | null;
  adapter_sha256: string | null;
  source_ref: string;
  source_sha256: string;
  resolution: "resolved" | "missing" | "unsupported";
  structural_result: "pass" | "fail" | "unsupported";
  observation_sha256: string;
}

export interface ConcernJoinV1 {
  concern_kind: ConcernKind;
  observation_id: string;
  observation_ref: string;
  observation_sha256: string;
  record_id: string;
  record_ref: string;
  record_sha256: string;
  external_status: ExactConcernRecordV1["status"];
  external_ceiling: string;
  interface_ref: string | null;
  evidence_lane: ExactConcernRecordV1["evidence_lane"];
}

export interface OperationPropertyObservationResultV1 {
  schema_version: "ape.operation-property-observation-result/v1";
  subject_meta_type_id: "Operation";
  property_id: string;
  status: PropertyResult;
  diagnostic: string;
  owner_route: string;
  observation_id: string;
  observation_sha256: string;
  joins: ConcernJoinV1[];
  forbidden_inferences: string[];
  authority_effect: "none";
}

export interface OperationPersistenceInputV1 {
  repository_observation: RepositoryObservationV1;
  persistence_records: ExactConcernRecordV1[];
  asserted_inferences: string[];
}

type JsonRecord = Record<string, unknown>;

const SHA256 = /^[a-f0-9]{64}$/;
const FORBIDDEN_INFERENCES = [
  "query-budget",
  "transaction-guarantee",
  "external-send",
  "provider-acceptance",
  "delivery",
] as const;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as JsonRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function record(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}`);
  }
  return value as JsonRecord;
}

function exactKeys(
  value: JsonRecord,
  keys: readonly string[],
  selector: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}`);
  }
}

function string(value: unknown, selector: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}`);
  }
  return value;
}

function digest(value: unknown, selector: string): string {
  const candidate = string(value, selector);
  if (!SHA256.test(candidate)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}`);
  }
  return candidate;
}

export function sealConcernRecord(
  body: Omit<ExactConcernRecordV1, "record_sha256">,
): ExactConcernRecordV1 {
  return { ...body, record_sha256: sha256Canonical(body) };
}

export function sealRepositoryObservation(
  body: Omit<RepositoryObservationV1, "observation_sha256">,
): RepositoryObservationV1 {
  return { ...body, observation_sha256: sha256Canonical(body) };
}

export function validateConcernRecord(
  value: unknown,
  selector = "$.record",
): ExactConcernRecordV1 {
  const candidate = record(value, selector);
  exactKeys(
    candidate,
    [
      "schema_version",
      "evidence_lane",
      "record_id",
      "record_ref",
      "concern_kind",
      "status",
      "ceiling",
      "interface_ref",
      "payload_sha256",
      "authority_effect",
      "record_sha256",
    ],
    selector,
  );
  if (candidate.schema_version !== "system-integration.concern-record/v1") {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.schema_version`);
  }
  if (
    candidate.evidence_lane !== "candidate-local-fixture" &&
    candidate.evidence_lane !== "canonical"
  ) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.evidence_lane`);
  }
  string(candidate.record_id, `${selector}.record_id`);
  string(candidate.record_ref, `${selector}.record_ref`);
  if (
    ![
      "persistence",
      "transaction",
      "failure",
      "transport",
      "delivery",
    ].includes(candidate.concern_kind as string)
  ) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.concern_kind`);
  }
  if (!["admitted", "candidate", "absent"].includes(candidate.status as string)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.status`);
  }
  string(candidate.ceiling, `${selector}.ceiling`);
  if (candidate.interface_ref !== null) {
    string(candidate.interface_ref, `${selector}.interface_ref`);
  }
  digest(candidate.payload_sha256, `${selector}.payload_sha256`);
  if (candidate.authority_effect !== "none") {
    throw new Error(`AOP_PERSISTENCE_AUTHORITY_GROWTH at ${selector}.authority_effect`);
  }
  const recordSha = digest(candidate.record_sha256, `${selector}.record_sha256`);
  const { record_sha256: _ignored, ...body } = candidate;
  if (sha256Canonical(body) !== recordSha) {
    throw new Error(`AOP_PERSISTENCE_STALE_RECORD at ${selector}.record_sha256`);
  }
  return candidate as unknown as ExactConcernRecordV1;
}

export function validateRepositoryObservation(
  value: unknown,
  selector = "$.repository_observation",
): RepositoryObservationV1 {
  const candidate = record(value, selector);
  exactKeys(
    candidate,
    [
      "schema_version",
      "observation_id",
      "observation_ref",
      "subject_meta_type_id",
      "property_id",
      "dependency_role",
      "interface_ref",
      "adapter_ref",
      "adapter_sha256",
      "source_ref",
      "source_sha256",
      "resolution",
      "structural_result",
      "observation_sha256",
    ],
    selector,
  );
  if (
    candidate.schema_version !== "ape.operation.repository-observation/v1" ||
    candidate.subject_meta_type_id !== "Operation" ||
    candidate.property_id !==
      "APE.ImplementationProperty.operation.repository-boundary" ||
    candidate.dependency_role !== "repository"
  ) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}`);
  }
  string(candidate.observation_id, `${selector}.observation_id`);
  string(candidate.observation_ref, `${selector}.observation_ref`);
  string(candidate.interface_ref, `${selector}.interface_ref`);
  if (candidate.adapter_ref !== null) {
    string(candidate.adapter_ref, `${selector}.adapter_ref`);
  }
  if (candidate.adapter_sha256 !== null) {
    digest(candidate.adapter_sha256, `${selector}.adapter_sha256`);
  }
  if ((candidate.adapter_ref === null) !== (candidate.adapter_sha256 === null)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.adapter_ref`);
  }
  string(candidate.source_ref, `${selector}.source_ref`);
  digest(candidate.source_sha256, `${selector}.source_sha256`);
  if (!["resolved", "missing", "unsupported"].includes(candidate.resolution as string)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.resolution`);
  }
  if (!["pass", "fail", "unsupported"].includes(candidate.structural_result as string)) {
    throw new Error(`AOP_PERSISTENCE_SCHEMA at ${selector}.structural_result`);
  }
  const observationSha = digest(
    candidate.observation_sha256,
    `${selector}.observation_sha256`,
  );
  const { observation_sha256: _ignored, ...body } = candidate;
  if (sha256Canonical(body) !== observationSha) {
    throw new Error(
      `AOP_PERSISTENCE_STALE_OBSERVATION at ${selector}.observation_sha256`,
    );
  }
  return candidate as unknown as RepositoryObservationV1;
}

function result(
  observation: RepositoryObservationV1,
  status: PropertyResult,
  diagnostic: string,
  joins: ConcernJoinV1[] = [],
): OperationPropertyObservationResultV1 {
  return {
    schema_version: "ape.operation-property-observation-result/v1",
    subject_meta_type_id: "Operation",
    property_id: observation.property_id,
    status,
    diagnostic,
    owner_route: "system-integration:persistence-binding-owner",
    observation_id: observation.observation_id,
    observation_sha256: observation.observation_sha256,
    joins,
    forbidden_inferences: [...FORBIDDEN_INFERENCES],
    authority_effect: "none",
  };
}

export function observeOperationPersistence(
  value: unknown,
): OperationPropertyObservationResultV1 {
  const input = record(value, "$");
  exactKeys(
    input,
    ["repository_observation", "persistence_records", "asserted_inferences"],
    "$",
  );
  const observation = validateRepositoryObservation(input.repository_observation);
  if (!Array.isArray(input.persistence_records)) {
    throw new Error("AOP_PERSISTENCE_SCHEMA at $.persistence_records");
  }
  if (!Array.isArray(input.asserted_inferences)) {
    throw new Error("AOP_PERSISTENCE_SCHEMA at $.asserted_inferences");
  }
  const asserted = input.asserted_inferences.map((item, index) =>
    string(item, `$.asserted_inferences[${index}]`),
  );
  if (asserted.length > 0) {
    return result(observation, "fail", "AOP_PERSISTENCE_CROSS_INFERENCE");
  }
  if (input.persistence_records.length > 1) {
    return result(observation, "fail", "AOP_PERSISTENCE_DUPLICATE_JOIN");
  }
  if (observation.resolution === "missing" || observation.adapter_ref === null) {
    return result(observation, "missing", "AOP_PERSISTENCE_ADAPTER_MISSING");
  }
  if (
    observation.resolution === "unsupported" ||
    observation.structural_result === "unsupported"
  ) {
    return result(observation, "unsupported", "AOP_PERSISTENCE_UNSUPPORTED");
  }
  if (observation.structural_result === "fail") {
    return result(observation, "fail", "AOP_PERSISTENCE_RAW_PROVIDER_INWARD");
  }
  if (input.persistence_records.length === 0) {
    return result(observation, "owner-blocked", "AOP_PERSISTENCE_RECORD_REQUIRED");
  }
  const external = validateConcernRecord(input.persistence_records[0]);
  if (external.concern_kind !== "persistence") {
    return result(observation, "fail", "AOP_PERSISTENCE_CONCERN_MISMATCH");
  }
  if (external.interface_ref !== observation.interface_ref) {
    return result(observation, "fail", "AOP_PERSISTENCE_INTERFACE_MISMATCH");
  }
  const join: ConcernJoinV1 = {
    concern_kind: "persistence",
    observation_id: observation.observation_id,
    observation_ref: observation.observation_ref,
    observation_sha256: observation.observation_sha256,
    record_id: external.record_id,
    record_ref: external.record_ref,
    record_sha256: external.record_sha256,
    external_status: external.status,
    external_ceiling: external.ceiling,
    interface_ref: external.interface_ref,
    evidence_lane: external.evidence_lane,
  };
  if (
    external.evidence_lane !== "canonical" ||
    external.status !== "admitted"
  ) {
    return result(
      observation,
      "owner-blocked",
      "AOP_PERSISTENCE_RECORD_NOT_ADMITTED",
      [join],
    );
  }
  return result(observation, "pass", "AOP_PERSISTENCE_PASS", [join]);
}
