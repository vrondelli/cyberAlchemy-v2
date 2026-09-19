import {
  sha256Canonical,
  validateConcernRecord,
  type ConcernJoinV1,
  type ExactConcernRecordV1,
  type OperationPropertyObservationResultV1,
  type PropertyResult,
} from "./operation-persistence-observer.ts";

export interface UnitOfWorkObservationV1 {
  schema_version: "ape.operation.unit-of-work-observation/v1";
  observation_id: string;
  observation_ref: string;
  subject_meta_type_id: "Operation";
  property_id: "APE.ImplementationProperty.operation.unit-of-work-boundary";
  dependency_role: "unit-of-work";
  interface_ref: string;
  source_ref: string;
  source_sha256: string;
  declared_participants: string[];
  observed_local_writes: string[];
  durable_intent_writes: string[];
  optional: boolean;
  fallback_bypass: boolean;
  callback_uses_transaction_scoped_repositories: boolean;
  runtime_commit_evidence: boolean;
  runtime_failure_evidence: boolean;
  observation_sha256: string;
}

export interface OperationTransactionInputV1 {
  unit_of_work_observation: UnitOfWorkObservationV1;
  transaction_records: ExactConcernRecordV1[];
  failure_records: ExactConcernRecordV1[];
  claims: {
    distributed_atomicity_claimed: boolean;
    remote_rollback_claimed: boolean;
    compensation_is_rollback_claimed: boolean;
  };
}

type JsonRecord = Record<string, unknown>;
const SHA256 = /^[a-f0-9]{64}$/;

function object(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
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
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
  }
}

function nonEmpty(value: unknown, selector: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
  }
  return value;
}

function bool(value: unknown, selector: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
  }
  return value;
}

function strings(value: unknown, selector: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
  }
  const values = value.map((entry, index) =>
    nonEmpty(entry, `${selector}[${index}]`),
  );
  if (new Set(values).size !== values.length) {
    throw new Error(`AOP_TRANSACTION_DUPLICATE_PARTICIPANT at ${selector}`);
  }
  return values;
}

function sha(value: unknown, selector: string): string {
  const candidate = nonEmpty(value, selector);
  if (!SHA256.test(candidate)) {
    throw new Error(`AOP_TRANSACTION_SCHEMA at ${selector}`);
  }
  return candidate;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    [...left].sort().every((value, index) => value === [...right].sort()[index])
  );
}

export function sealUnitOfWorkObservation(
  body: Omit<UnitOfWorkObservationV1, "observation_sha256">,
): UnitOfWorkObservationV1 {
  return { ...body, observation_sha256: sha256Canonical(body) };
}

export function validateUnitOfWorkObservation(
  value: unknown,
): UnitOfWorkObservationV1 {
  const candidate = object(value, "$.unit_of_work_observation");
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
      "source_ref",
      "source_sha256",
      "declared_participants",
      "observed_local_writes",
      "durable_intent_writes",
      "optional",
      "fallback_bypass",
      "callback_uses_transaction_scoped_repositories",
      "runtime_commit_evidence",
      "runtime_failure_evidence",
      "observation_sha256",
    ],
    "$.unit_of_work_observation",
  );
  if (
    candidate.schema_version !== "ape.operation.unit-of-work-observation/v1" ||
    candidate.subject_meta_type_id !== "Operation" ||
    candidate.property_id !==
      "APE.ImplementationProperty.operation.unit-of-work-boundary" ||
    candidate.dependency_role !== "unit-of-work"
  ) {
    throw new Error("AOP_TRANSACTION_SCHEMA at $.unit_of_work_observation");
  }
  nonEmpty(candidate.observation_id, "$.unit_of_work_observation.observation_id");
  nonEmpty(candidate.observation_ref, "$.unit_of_work_observation.observation_ref");
  nonEmpty(candidate.interface_ref, "$.unit_of_work_observation.interface_ref");
  nonEmpty(candidate.source_ref, "$.unit_of_work_observation.source_ref");
  sha(candidate.source_sha256, "$.unit_of_work_observation.source_sha256");
  strings(
    candidate.declared_participants,
    "$.unit_of_work_observation.declared_participants",
  );
  strings(
    candidate.observed_local_writes,
    "$.unit_of_work_observation.observed_local_writes",
  );
  strings(
    candidate.durable_intent_writes,
    "$.unit_of_work_observation.durable_intent_writes",
  );
  bool(candidate.optional, "$.unit_of_work_observation.optional");
  bool(candidate.fallback_bypass, "$.unit_of_work_observation.fallback_bypass");
  bool(
    candidate.callback_uses_transaction_scoped_repositories,
    "$.unit_of_work_observation.callback_uses_transaction_scoped_repositories",
  );
  bool(
    candidate.runtime_commit_evidence,
    "$.unit_of_work_observation.runtime_commit_evidence",
  );
  bool(
    candidate.runtime_failure_evidence,
    "$.unit_of_work_observation.runtime_failure_evidence",
  );
  const observedSha = sha(
    candidate.observation_sha256,
    "$.unit_of_work_observation.observation_sha256",
  );
  const { observation_sha256: _ignored, ...body } = candidate;
  if (sha256Canonical(body) !== observedSha) {
    throw new Error(
      "AOP_TRANSACTION_STALE_OBSERVATION at $.unit_of_work_observation.observation_sha256",
    );
  }
  return candidate as unknown as UnitOfWorkObservationV1;
}

function join(
  observation: UnitOfWorkObservationV1,
  external: ExactConcernRecordV1,
): ConcernJoinV1 {
  return {
    concern_kind: external.concern_kind,
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
}

function result(
  observation: UnitOfWorkObservationV1,
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
    owner_route: "system-integration:transaction-failure-owner",
    observation_id: observation.observation_id,
    observation_sha256: observation.observation_sha256,
    joins,
    forbidden_inferences: [
      "distributed-atomicity",
      "remote-rollback",
      "compensation-equals-rollback",
      "workflow-wide-atomicity",
      "source-structure-proves-commit",
    ],
    authority_effect: "none",
  };
}

function decodeRecordList(
  value: unknown,
  kind: "transaction" | "failure",
): ExactConcernRecordV1[] {
  if (!Array.isArray(value)) {
    throw new Error(`AOP_TRANSACTION_SCHEMA at $.${kind}_records`);
  }
  if (value.length > 1) return value as ExactConcernRecordV1[];
  return value.map((entry, index) => {
    const decoded = validateConcernRecord(entry, `$.${kind}_records[${index}]`);
    return decoded;
  });
}

export function observeOperationTransaction(
  value: unknown,
): OperationPropertyObservationResultV1 {
  const input = object(value, "$");
  exactKeys(
    input,
    [
      "unit_of_work_observation",
      "transaction_records",
      "failure_records",
      "claims",
    ],
    "$",
  );
  const observation = validateUnitOfWorkObservation(
    input.unit_of_work_observation,
  );
  const transactionRecords = decodeRecordList(
    input.transaction_records,
    "transaction",
  );
  const failureRecords = decodeRecordList(input.failure_records, "failure");
  if (transactionRecords.length > 1 || failureRecords.length > 1) {
    return result(observation, "fail", "AOP_TRANSACTION_DUPLICATE_JOIN");
  }
  const claims = object(input.claims, "$.claims");
  exactKeys(
    claims,
    [
      "distributed_atomicity_claimed",
      "remote_rollback_claimed",
      "compensation_is_rollback_claimed",
    ],
    "$.claims",
  );
  const prohibitedClaims = [
    bool(claims.distributed_atomicity_claimed, "$.claims.distributed_atomicity_claimed"),
    bool(claims.remote_rollback_claimed, "$.claims.remote_rollback_claimed"),
    bool(
      claims.compensation_is_rollback_claimed,
      "$.claims.compensation_is_rollback_claimed",
    ),
  ];
  if (prohibitedClaims.some(Boolean)) {
    return result(observation, "fail", "AOP_TRANSACTION_BOUNDARY_OVERCLAIM");
  }
  if (observation.optional || observation.fallback_bypass) {
    return result(observation, "fail", "AOP_TRANSACTION_OPTIONAL_BYPASS");
  }
  if (!observation.callback_uses_transaction_scoped_repositories) {
    return result(observation, "fail", "AOP_TRANSACTION_UNSCOPED_REPOSITORY");
  }
  const observedWrites = [
    ...observation.observed_local_writes,
    ...observation.durable_intent_writes,
  ];
  if (!sameSet(observation.declared_participants, observedWrites)) {
    return result(observation, "fail", "AOP_TRANSACTION_PARTICIPANT_MISMATCH");
  }
  const records = [...transactionRecords, ...failureRecords];
  const validated = records.map((entry, index) =>
    validateConcernRecord(entry, `$.records[${index}]`),
  );
  if (
    (transactionRecords.length === 1 && validated[0].concern_kind !== "transaction") ||
    (failureRecords.length === 1 && validated.at(-1)?.concern_kind !== "failure")
  ) {
    return result(observation, "fail", "AOP_TRANSACTION_CONCERN_MISMATCH");
  }
  if (
    validated.some(
      (entry) => entry.interface_ref !== observation.interface_ref,
    )
  ) {
    return result(observation, "fail", "AOP_TRANSACTION_INTERFACE_MISMATCH");
  }
  const joins = validated.map((entry) => join(observation, entry));
  if (transactionRecords.length === 0 || failureRecords.length === 0) {
    return result(observation, "owner-blocked", "AOP_TRANSACTION_RECORDS_REQUIRED", joins);
  }
  if (
    validated.some(
      (entry) =>
        entry.evidence_lane !== "canonical" || entry.status !== "admitted",
    )
  ) {
    return result(
      observation,
      "owner-blocked",
      "AOP_TRANSACTION_RECORD_NOT_ADMITTED",
      joins,
    );
  }
  if (
    !observation.runtime_commit_evidence ||
    !observation.runtime_failure_evidence
  ) {
    return result(
      observation,
      "owner-blocked",
      "AOP_TRANSACTION_RUNTIME_EVIDENCE_REQUIRED",
      joins,
    );
  }
  return result(observation, "pass", "AOP_TRANSACTION_PASS", joins);
}
