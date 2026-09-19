import assert from "node:assert/strict";
import test from "node:test";

import { sealConcernRecord, type ExactConcernRecordV1 } from "./operation-persistence-observer.ts";
import {
  observeOperationTransaction,
  sealUnitOfWorkObservation,
  type UnitOfWorkObservationV1,
} from "./operation-transaction-observer.ts";

const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);

function observation(
  overrides: Partial<Omit<UnitOfWorkObservationV1, "observation_sha256">> = {},
): UnitOfWorkObservationV1 {
  return sealUnitOfWorkObservation({
    schema_version: "ape.operation.unit-of-work-observation/v1",
    observation_id: "poker.financial-write-uow",
    observation_ref: "fixtures/observations.json#/unit_of_work",
    subject_meta_type_id: "Operation",
    property_id: "APE.ImplementationProperty.operation.unit-of-work-boundary",
    dependency_role: "unit-of-work",
    interface_ref: "FinancialWriteUnitOfWork",
    source_ref:
      "validation/poker-team/backend/src/domain/shared/financial-write-unit-of-work.ts",
    source_sha256: HEX_A,
    declared_participants: ["playerRepo", "transactionRepo", "outboxRepo"],
    observed_local_writes: ["playerRepo", "transactionRepo"],
    durable_intent_writes: ["outboxRepo"],
    optional: false,
    fallback_bypass: false,
    callback_uses_transaction_scoped_repositories: true,
    runtime_commit_evidence: true,
    runtime_failure_evidence: true,
    ...overrides,
  });
}

function record(
  kind: "transaction" | "failure",
  overrides: Partial<Omit<ExactConcernRecordV1, "record_sha256">> = {},
): ExactConcernRecordV1 {
  return sealConcernRecord({
    schema_version: "system-integration.concern-record/v1",
    evidence_lane: "canonical",
    record_id: `fixture.${kind}.financial-write`,
    record_ref: `fixtures/records.json#/${kind}`,
    concern_kind: kind,
    status: "admitted",
    ceiling: `fixture-only-${kind}`,
    interface_ref: "FinancialWriteUnitOfWork",
    payload_sha256: kind === "transaction" ? HEX_A : HEX_B,
    authority_effect: "none",
    ...overrides,
  });
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    unit_of_work_observation: observation(),
    transaction_records: [record("transaction")],
    failure_records: [record("failure")],
    claims: {
      distributed_atomicity_claimed: false,
      remote_rollback_claimed: false,
      compensation_is_rollback_claimed: false,
    },
    ...overrides,
  };
}

test("joins independent transaction and failure records for a local boundary", () => {
  const actual = observeOperationTransaction(input());
  assert.deepEqual(
    [actual.status, actual.diagnostic],
    ["pass", "AOP_TRANSACTION_PASS"],
  );
  assert.deepEqual(
    actual.joins.map((entry) => entry.concern_kind),
    ["transaction", "failure"],
  );
  assert.equal(actual.authority_effect, "none");
});

test("structural UnitOfWork shape alone never proves runtime commit", () => {
  const actual = observeOperationTransaction(
    input({
      unit_of_work_observation: observation({
        runtime_commit_evidence: false,
        runtime_failure_evidence: false,
      }),
    }),
  );
  assert.deepEqual(
    [actual.status, actual.diagnostic],
    ["owner-blocked", "AOP_TRANSACTION_RUNTIME_EVIDENCE_REQUIRED"],
  );
});

test("rejects missing, extra, and non-transaction-scoped participants", () => {
  for (const mutant of [
    observation({ declared_participants: ["playerRepo", "transactionRepo"] }),
    observation({ observed_local_writes: ["playerRepo", "otherRepo"] }),
  ]) {
    const actual = observeOperationTransaction(
      input({ unit_of_work_observation: mutant }),
    );
    assert.equal(actual.diagnostic, "AOP_TRANSACTION_PARTICIPANT_MISMATCH");
  }
  const unscoped = observeOperationTransaction(
    input({
      unit_of_work_observation: observation({
        callback_uses_transaction_scoped_repositories: false,
      }),
    }),
  );
  assert.equal(unscoped.diagnostic, "AOP_TRANSACTION_UNSCOPED_REPOSITORY");
});

test("rejects optional and fallback UnitOfWork bypasses", () => {
  for (const mutant of [
    observation({ optional: true }),
    observation({ fallback_bypass: true }),
  ]) {
    const actual = observeOperationTransaction(
      input({ unit_of_work_observation: mutant }),
    );
    assert.deepEqual(
      [actual.status, actual.diagnostic],
      ["fail", "AOP_TRANSACTION_OPTIONAL_BYPASS"],
    );
  }
});

test("rejects duplicate joins and concern substitution", () => {
  const duplicate = observeOperationTransaction(
    input({
      transaction_records: [
        record("transaction"),
        record("transaction", { record_id: "fixture.transaction.second" }),
      ],
    }),
  );
  assert.equal(duplicate.diagnostic, "AOP_TRANSACTION_DUPLICATE_JOIN");

  const substituted = observeOperationTransaction(
    input({ transaction_records: [record("failure")] }),
  );
  assert.equal(substituted.diagnostic, "AOP_TRANSACTION_CONCERN_MISMATCH");

  const wrongInterface = observeOperationTransaction(
    input({
      failure_records: [
        record("failure", { interface_ref: "OtherUnitOfWork" }),
      ],
    }),
  );
  assert.equal(
    wrongInterface.diagnostic,
    "AOP_TRANSACTION_INTERFACE_MISMATCH",
  );
});

test("preserves missing and candidate records as owner-blocked", () => {
  const missing = observeOperationTransaction(
    input({ transaction_records: [] }),
  );
  assert.equal(missing.diagnostic, "AOP_TRANSACTION_RECORDS_REQUIRED");
  const candidate = observeOperationTransaction(
    input({
      failure_records: [record("failure", { status: "candidate" })],
    }),
  );
  assert.deepEqual(
    [candidate.status, candidate.diagnostic, candidate.joins[1].external_status],
    ["owner-blocked", "AOP_TRANSACTION_RECORD_NOT_ADMITTED", "candidate"],
  );
  const selfAdmittedFixture = observeOperationTransaction(
    input({
      transaction_records: [
        record("transaction", {
          evidence_lane: "candidate-local-fixture",
          status: "admitted",
        }),
      ],
    }),
  );
  assert.deepEqual(
    [selfAdmittedFixture.status, selfAdmittedFixture.diagnostic],
    ["owner-blocked", "AOP_TRANSACTION_RECORD_NOT_ADMITTED"],
  );
});

test("rejects distributed, remote rollback, and compensation overclaims independently", () => {
  for (const key of [
    "distributed_atomicity_claimed",
    "remote_rollback_claimed",
    "compensation_is_rollback_claimed",
  ] as const) {
    const actual = observeOperationTransaction(
      input({
        claims: {
          distributed_atomicity_claimed: false,
          remote_rollback_claimed: false,
          compensation_is_rollback_claimed: false,
          [key]: true,
        },
      }),
    );
    assert.equal(actual.diagnostic, "AOP_TRANSACTION_BOUNDARY_OVERCLAIM", key);
  }
});

test("rejects stale nested observations and external records", () => {
  assert.throws(
    () =>
      observeOperationTransaction(
        input({
          unit_of_work_observation: {
            ...observation(),
            runtime_commit_evidence: false,
          },
        }),
      ),
    /AOP_TRANSACTION_STALE_OBSERVATION/,
  );
  assert.throws(
    () =>
      observeOperationTransaction(
        input({
          failure_records: [
            { ...record("failure"), payload_sha256: HEX_A },
          ],
        }),
      ),
    /AOP_PERSISTENCE_STALE_RECORD/,
  );
});
