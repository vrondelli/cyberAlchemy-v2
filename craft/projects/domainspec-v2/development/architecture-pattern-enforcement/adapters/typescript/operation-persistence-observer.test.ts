import assert from "node:assert/strict";
import test from "node:test";

import {
  observeOperationPersistence,
  sealConcernRecord,
  sealRepositoryObservation,
  type ExactConcernRecordV1,
  type RepositoryObservationV1,
} from "./operation-persistence-observer.ts";

const HEX_A = "a".repeat(64);
const HEX_B = "b".repeat(64);

function observation(
  overrides: Partial<Omit<RepositoryObservationV1, "observation_sha256">> = {},
): RepositoryObservationV1 {
  return sealRepositoryObservation({
    schema_version: "ape.operation.repository-observation/v1",
    observation_id: "poker.create-player.repository",
    observation_ref: "fixtures/observations.json#/repository",
    subject_meta_type_id: "Operation",
    property_id: "APE.ImplementationProperty.operation.repository-boundary",
    dependency_role: "repository",
    interface_ref: "PlayerRepository",
    adapter_ref: "composition/player-repository",
    adapter_sha256: HEX_A,
    source_ref: "validation/poker-team/backend/src/use-cases/player/create-player.ts",
    source_sha256: HEX_B,
    resolution: "resolved",
    structural_result: "pass",
    ...overrides,
  });
}

function persistenceRecord(
  overrides: Partial<Omit<ExactConcernRecordV1, "record_sha256">> = {},
): ExactConcernRecordV1 {
  return sealConcernRecord({
    schema_version: "system-integration.concern-record/v1",
    evidence_lane: "canonical",
    record_id: "fixture.persistence.player-repository",
    record_ref: "fixtures/records.json#/persistence",
    concern_kind: "persistence",
    status: "admitted",
    ceiling: "fixture-only-persistence-binding",
    interface_ref: "PlayerRepository",
    payload_sha256: HEX_A,
    authority_effect: "none",
    ...overrides,
  });
}

function input(
  overrides: Partial<{
    repository_observation: RepositoryObservationV1;
    persistence_records: ExactConcernRecordV1[];
    asserted_inferences: string[];
  }> = {},
) {
  return {
    repository_observation: observation(),
    persistence_records: [persistenceRecord()],
    asserted_inferences: [],
    ...overrides,
  };
}

test("joins one exact admitted persistence record without growing its ceiling", () => {
  const actual = observeOperationPersistence(input());
  assert.equal(actual.status, "pass");
  assert.equal(actual.diagnostic, "AOP_PERSISTENCE_PASS");
  assert.equal(actual.joins.length, 1);
  assert.deepEqual(actual.joins[0], {
    concern_kind: "persistence",
    observation_id: "poker.create-player.repository",
    observation_ref: "fixtures/observations.json#/repository",
    observation_sha256: input().repository_observation.observation_sha256,
    record_id: "fixture.persistence.player-repository",
    record_ref: "fixtures/records.json#/persistence",
    record_sha256: input().persistence_records[0].record_sha256,
    external_status: "admitted",
    external_ceiling: "fixture-only-persistence-binding",
    interface_ref: "PlayerRepository",
    evidence_lane: "canonical",
  });
  assert.equal(actual.authority_effect, "none");
});

test("keeps missing and unadmitted records owner-visible", () => {
  const absent = observeOperationPersistence(input({ persistence_records: [] }));
  assert.deepEqual(
    [absent.status, absent.diagnostic],
    ["owner-blocked", "AOP_PERSISTENCE_RECORD_REQUIRED"],
  );

  const candidate = observeOperationPersistence(
    input({
      persistence_records: [persistenceRecord({ status: "candidate" })],
    }),
  );
  assert.deepEqual(
    [candidate.status, candidate.diagnostic, candidate.joins[0].external_status],
    ["owner-blocked", "AOP_PERSISTENCE_RECORD_NOT_ADMITTED", "candidate"],
  );

  const selfAdmittedFixture = observeOperationPersistence(
    input({
      persistence_records: [
        persistenceRecord({
          evidence_lane: "candidate-local-fixture",
          status: "admitted",
          ceiling: "fixture-only; no system-integration admission",
        }),
      ],
    }),
  );
  assert.deepEqual(
    [
      selfAdmittedFixture.status,
      selfAdmittedFixture.diagnostic,
      selfAdmittedFixture.joins[0].evidence_lane,
    ],
    [
      "owner-blocked",
      "AOP_PERSISTENCE_RECORD_NOT_ADMITTED",
      "candidate-local-fixture",
    ],
  );
});

test("rejects duplicate persistence records", () => {
  const actual = observeOperationPersistence(
    input({
      persistence_records: [
        persistenceRecord(),
        persistenceRecord({ record_id: "fixture.persistence.second" }),
      ],
    }),
  );
  assert.deepEqual(
    [actual.status, actual.diagnostic],
    ["fail", "AOP_PERSISTENCE_DUPLICATE_JOIN"],
  );
});

test("rejects stale observation and record digests before evaluation", () => {
  assert.throws(
    () =>
      observeOperationPersistence(
        input({
          repository_observation: {
            ...observation(),
            source_sha256: HEX_A,
          },
        }),
      ),
    /AOP_PERSISTENCE_STALE_OBSERVATION/,
  );
  assert.throws(
    () =>
      observeOperationPersistence(
        input({
          persistence_records: [
            { ...persistenceRecord(), payload_sha256: HEX_B },
          ],
        }),
      ),
    /AOP_PERSISTENCE_STALE_RECORD/,
  );
});

test("does not turn Repository evidence into transaction, query, send, or delivery proof", () => {
  for (const inference of [
    "query-budget",
    "transaction-guarantee",
    "external-send",
    "provider-acceptance",
    "delivery",
  ]) {
    const actual = observeOperationPersistence(
      input({ asserted_inferences: [inference] }),
    );
    assert.deepEqual(
      [actual.status, actual.diagnostic],
      ["fail", "AOP_PERSISTENCE_CROSS_INFERENCE"],
      inference,
    );
  }
});

test("a publish-named repository interface remains persistence-only", () => {
  const observed = observation({ interface_ref: "DatabasePublishRepository" });
  const external = persistenceRecord({
    interface_ref: "DatabasePublishRepository",
  });
  const actual = observeOperationPersistence(
    input({
      repository_observation: observed,
      persistence_records: [external],
    }),
  );
  assert.equal(actual.status, "pass");
  assert.deepEqual(actual.joins.map((join) => join.concern_kind), ["persistence"]);
});

test("rejects a concern-kind or interface substitution", () => {
  const concern = observeOperationPersistence(
    input({
      persistence_records: [
        persistenceRecord({ concern_kind: "transaction" }),
      ],
    }),
  );
  assert.equal(concern.diagnostic, "AOP_PERSISTENCE_CONCERN_MISMATCH");

  const iface = observeOperationPersistence(
    input({
      persistence_records: [persistenceRecord({ interface_ref: "OtherRepo" })],
    }),
  );
  assert.equal(iface.diagnostic, "AOP_PERSISTENCE_INTERFACE_MISMATCH");
});

test("preserves missing, unsupported, and raw-provider failure as distinct states", () => {
  const missing = observeOperationPersistence(
    input({
      repository_observation: observation({
        adapter_ref: null,
        adapter_sha256: null,
        resolution: "missing",
      }),
    }),
  );
  const unsupported = observeOperationPersistence(
    input({
      repository_observation: observation({
        resolution: "unsupported",
        structural_result: "unsupported",
      }),
    }),
  );
  const rawProvider = observeOperationPersistence(
    input({
      repository_observation: observation({ structural_result: "fail" }),
    }),
  );
  assert.deepEqual(
    [missing.status, unsupported.status, rawProvider.status],
    ["missing", "unsupported", "fail"],
  );
});
