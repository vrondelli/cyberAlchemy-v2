import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { resolve } from "node:path";

import {
  sha256Canonical,
  type ConcernJoinV1,
  type ExactConcernRecordV1,
  type RepositoryObservationV1,
} from "../adapters/typescript/operation-persistence-observer.ts";
import {
  evaluateOperationProfile,
  OPERATION_APPLICABILITY_FILE_SHA256,
  OPERATION_FIXTURE_FILE_SHA256,
  OPERATION_HOSTILES_FILE_SHA256,
  OPERATION_PROFILE_FILE_SHA256,
  type ApplicabilityCaseV1,
  type OperationArchitectureProfileV1,
  type OperationProfileEvaluationInputV1,
  type PropertyEvaluationV1,
} from "./operation-profile-evaluator.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const PROFILE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.json";
const APPLICABILITY_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/applicability.json";
const FIXTURE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/poker-team.fixture.json";
const HOSTILES_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/hostiles.json";
const SUBJECT_REF = "validation/poker-team/backend/src/use-cases/player/create-player.ts";
const UOW_SUBJECT_REF =
  "validation/poker-team/backend/src/domain/shared/financial-write-unit-of-work.ts";
const PACKET_SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/rmt-profile-binding-packet.schema.json";
const PACKET_VALIDATOR_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.ts";
const PROFILE_SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.schema.json";
const DEPENDENCY_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.ts";
const BOUNDARY_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.ts";
const COST_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.ts";
const PERSISTENCE_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.ts";
const TRANSACTION_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.ts";
const EVENT_OBSERVER_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.ts";
const EVALUATOR_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.ts";
const RECEIPT_SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/operation-type-completion-receipt.schema.json";

function bytes(ref: string): Buffer {
  return readFileSync(resolve(REPO_ROOT, ref));
}

function sha(ref: string): string {
  return createHash("sha256").update(bytes(ref)).digest("hex");
}

const profile = JSON.parse(bytes(PROFILE_REF).toString("utf8")) as OperationArchitectureProfileV1;
const applicabilitySet = JSON.parse(bytes(APPLICABILITY_REF).toString("utf8")) as {
  cases: ApplicabilityCaseV1[];
};
const fixture = JSON.parse(bytes(FIXTURE_REF).toString("utf8")) as {
  fixture_id: string;
  evaluation_evidence: Array<{
    envelope_id: string;
    envelope_ref: string;
    property_id: string;
    result: PropertyEvaluationV1["result"];
    diagnostic: string;
    owner_route: string;
    envelope_sha256: string;
  }>;
  integration_evidence: {
    repository_observation: RepositoryObservationV1;
    persistence_candidate_record: ExactConcernRecordV1;
  };
};

function fixtureCandidateJoin(): ConcernJoinV1 {
  const observation = fixture.integration_evidence.repository_observation;
  const record = fixture.integration_evidence.persistence_candidate_record;
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

function caseById(caseId: string): ApplicabilityCaseV1 {
  return structuredClone(
    applicabilitySet.cases.find((entry) => entry.case_id === caseId)!,
  );
}

function resultsFor(applicabilityCase: ApplicabilityCaseV1): PropertyEvaluationV1[] {
  return applicabilityCase.applicability_results
    .filter((row) => row.applicability !== "not-applicable")
    .map((row) => {
      const suffix = row.property_id.split(".").at(-1);
      const envelope = fixture.evaluation_evidence.find(
        (entry) => entry.envelope_id === `PokerTeam.CreatePlayer.${suffix}`,
      )!;
      return {
        property_id: row.property_id,
        result: envelope.result,
        expected_value: { profile_obligation: row.basis },
        observed_value: {
          evidence_state: envelope.result === "pass" ? "observed" : envelope.result,
        },
        result_envelope_ref: envelope.envelope_ref,
        result_envelope_sha256: envelope.envelope_sha256,
        diagnostic: envelope.diagnostic,
        owner_route: envelope.owner_route,
        raw_evidence: [{ ref: SUBJECT_REF, sha256: sha(SUBJECT_REF) }],
        joins: [],
        authority_effect: "none" as const,
      };
    });
}

function bindCandidatePersistenceResult(row: PropertyEvaluationV1): void {
  const envelope = fixture.evaluation_evidence.find(
    (entry) =>
      entry.envelope_id ===
      "PokerTeam.CreatePlayer.repository-boundary.candidate-persistence",
  )!;
  row.result = envelope.result;
  row.observed_value = { evidence_state: "owner-blocked" };
  row.result_envelope_ref = envelope.envelope_ref;
  row.result_envelope_sha256 = envelope.envelope_sha256;
  row.diagnostic = envelope.diagnostic;
  row.owner_route = envelope.owner_route;
  row.joins = [fixtureCandidateJoin()];
}

function material(role: string, path: string) {
  return {
    role,
    path,
    sha256: sha(path),
    size: statSync(resolve(REPO_ROOT, path)).size,
  };
}

function input(caseId = "AOP-APP-001-poker-create-player"): OperationProfileEvaluationInputV1 {
  const applicabilityCase = caseById(caseId);
  const pokerCase = caseById("AOP-APP-001-poker-create-player");
  return {
    repo_root: REPO_ROOT,
    evidence_lane: "candidate-local-prototype",
    subject: {
      meta_type_id: "Operation",
      subject_id: applicabilityCase.subject_id,
      subject_sha256: sha(SUBJECT_REF),
    },
    profile: structuredClone(profile),
    profile_file_sha256: sha(PROFILE_REF),
    applicability_case: applicabilityCase,
    fixture: {
      fixture_id: fixture.fixture_id,
      fixture_sha256: sha(FIXTURE_REF),
      hostile_catalogue_sha256: sha(HOSTILES_REF),
    },
    property_results: resultsFor(pokerCase),
    material_inventory: [
      material("subject", SUBJECT_REF),
      material("packet-schema", PACKET_SCHEMA_REF),
      material("packet-validator", PACKET_VALIDATOR_REF),
      material("profile-schema", PROFILE_SCHEMA_REF),
      material("profile", PROFILE_REF),
      material("applicability", APPLICABILITY_REF),
      material("dependency-observer", DEPENDENCY_OBSERVER_REF),
      material("boundary-observer", BOUNDARY_OBSERVER_REF),
      material("cost-observer", COST_OBSERVER_REF),
      material("persistence-observer", PERSISTENCE_OBSERVER_REF),
      material("transaction-observer", TRANSACTION_OBSERVER_REF),
      material("event-observer", EVENT_OBSERVER_REF),
      material("fixture", FIXTURE_REF),
      material("hostiles", HOSTILES_REF),
      material("evaluator", EVALUATOR_REF),
      material("receipt-schema", RECEIPT_SCHEMA_REF),
    ],
    synchronized_task_session_closeout: false,
    authority_effect: "none",
  };
}

test("emits a deterministic Operation-only receipt with complete denominator accounting", () => {
  assert.equal(sha(PROFILE_REF), OPERATION_PROFILE_FILE_SHA256);
  assert.equal(sha(APPLICABILITY_REF), OPERATION_APPLICABILITY_FILE_SHA256);
  assert.equal(sha(FIXTURE_REF), OPERATION_FIXTURE_FILE_SHA256);
  assert.equal(sha(HOSTILES_REF), OPERATION_HOSTILES_FILE_SHA256);

  const first = evaluateOperationProfile(input());
  const second = evaluateOperationProfile(input());
  assert.deepEqual(first, second);
  assert.equal(first.result, "incomplete");
  assert.equal(first.subject.meta_type_id, "Operation");
  assert.equal(first.accounting.denominator_count, 13);
  assert.equal(first.accounting.applicable_count, 10);
  assert.equal(first.accounting.not_applicable_count, 3);
  assert.equal(first.accounting.pass_count, 7);
  assert.equal(first.accounting.fail_count, 0);
  assert.equal(first.accounting.missing_count, 0);
  assert.equal(first.accounting.owner_blocked_count, 3);
  assert.deepEqual(first.accounting.unaccounted_property_ids, []);
  assert.equal(first.synchronized_task_session_closeout, false);
  assert.equal(first.authority_effect, "none");

  const { receipt_sha256: _ignored, ...body } = first;
  assert.equal(first.receipt_sha256, sha256Canonical(body));
});

test("emitted receipt validates against the strict Draft 2020-12 schema", () => {
  const receipt = evaluateOperationProfile(input());
  const script = [
    "import json, sys",
    "from jsonschema import Draft202012Validator",
    "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "instance = json.load(sys.stdin)",
    "errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda e: list(e.path))",
    "assert not errors, '\\n'.join(e.message for e in errors)",
  ].join("\n");
  const checked = spawnSync(
    "python3",
    ["-c", script, resolve(REPO_ROOT, RECEIPT_SCHEMA_REF)],
    { input: JSON.stringify(receipt), encoding: "utf8" },
  );
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);

  const surplus = { ...receipt, profile_admission: "accepted" };
  const rejected = spawnSync(
    "python3",
    ["-c", script, resolve(REPO_ROOT, RECEIPT_SCHEMA_REF)],
    { input: JSON.stringify(surplus), encoding: "utf8" },
  );
  assert.notEqual(rejected.status, 0);
});

test("keeps passing implementation evidence distinct from unresolved owner evidence", () => {
  const receipt = evaluateOperationProfile(input());
  assert.equal(receipt.result, "incomplete");
  assert.deepEqual(
    [
      receipt.accounting.pass_count,
      receipt.accounting.missing_count,
      receipt.accounting.unsupported_count,
      receipt.accounting.owner_blocked_count,
      receipt.accounting.fail_count,
    ],
    [7, 0, 0, 3, 0],
  );

  const relabeled = input();
  relabeled.property_results[0].result = "pass";
  assert.throws(
    () => evaluateOperationProfile(relabeled),
    /AOP_EVALUATOR_STALE_RESULT/,
  );
});

test("requires every applicable or owner-blocked property exactly once", () => {
  const missing = input();
  missing.property_results.pop();
  assert.throws(() => evaluateOperationProfile(missing), /AOP_EVALUATOR_UNACCOUNTED/);

  const duplicate = input();
  duplicate.property_results.push(structuredClone(duplicate.property_results[0]));
  assert.throws(() => evaluateOperationProfile(duplicate), /AOP_EVALUATOR_DUPLICATE_RESULT/);

  const extra = input();
  extra.property_results.push({
    ...structuredClone(extra.property_results[0]),
    property_id: "APE.ImplementationProperty.operation.not-in-denominator",
  });
  assert.throws(() => evaluateOperationProfile(extra), /AOP_EVALUATOR_EXTRA_PROPERTY/);
});

test("an owner-blocked result envelope cannot be relabeled pass", () => {
  const candidate = input();
  const blocked = candidate.property_results.find((row) =>
    row.property_id.endsWith(".outcome-cohesion"),
  )!;
  blocked.result = "pass";
  assert.throws(
    () => evaluateOperationProfile(candidate),
    /AOP_EVALUATOR_STALE_RESULT/,
  );
});

test("preserves an exact byte-bound candidate concern join and rejects cross-concern inference", () => {
  const exactJoin = fixtureCandidateJoin();
  const candidate = input();
  const repository = candidate.property_results.find(
    (row) =>
      row.property_id === "APE.ImplementationProperty.operation.repository-boundary",
  )!;
  bindCandidatePersistenceResult(repository);
  assert.deepEqual(repository.joins, [exactJoin]);
  const receipt = evaluateOperationProfile(candidate);
  assert.deepEqual(
    receipt.findings.find((finding) => finding.property_id === repository.property_id)!
      .joins,
    [exactJoin],
  );

  const hostile = input();
  const hostileRepository = hostile.property_results.find(
    (row) => row.property_id === repository.property_id,
  )!;
  bindCandidatePersistenceResult(hostileRepository);
  hostileRepository.joins = [{ ...exactJoin, concern_kind: "transaction" }];
  assert.throws(
    () => evaluateOperationProfile(hostile),
    /AOP_EVALUATOR_CROSS_INFERENCE/,
  );
});

test("a candidate record cannot become passing by relabeling only the emitted join", () => {
  const candidate = input();
  const repository = candidate.property_results.find(
    (row) =>
      row.property_id === "APE.ImplementationProperty.operation.repository-boundary",
  )!;
  bindCandidatePersistenceResult(repository);
  assert.equal(
    evaluateOperationProfile(candidate).findings.find(
      (finding) => finding.property_id === repository.property_id,
    )!.result,
    "owner-blocked",
  );

  const relabeled = structuredClone(candidate);
  const relabeledRepository = relabeled.property_results.find(
    (row) => row.property_id === repository.property_id,
  )!;
  relabeledRepository.result = "pass";
  relabeledRepository.joins[0].external_status = "admitted";
  relabeledRepository.joins[0].evidence_lane = "canonical";
  assert.throws(
    () => evaluateOperationProfile(relabeled),
    /AOP_EVALUATOR_STALE_JOIN/,
  );
});

test("rejects applicability cases outside the exact Poker fixture scope", () => {
  const candidate = input(
    "AOP-APP-003-unresolved-infrastructure-discriminators",
  );
  assert.throws(
    () => evaluateOperationProfile(candidate),
    /AOP_EVALUATOR_FIXTURE_SCOPE/,
  );
});

test("rejects stale profile, applicability, and fixture material even when rebound", () => {
  const staleProfile = input();
  staleProfile.profile.properties[0].owner_route = "invented-owner";
  assert.throws(
    () => evaluateOperationProfile(staleProfile),
    /AOP_EVALUATOR_STALE_PROFILE/,
  );

  const staleApplicability = input();
  staleApplicability.applicability_case.basis = "rewritten expectation";
  assert.throws(
    () => evaluateOperationProfile(staleApplicability),
    /AOP_EVALUATOR_STALE_APPLICABILITY/,
  );

  const staleFixture = input();
  staleFixture.fixture.fixture_sha256 = "c".repeat(64);
  staleFixture.material_inventory.find((row) => row.role === "fixture")!.sha256 =
    "c".repeat(64);
  assert.throws(
    () => evaluateOperationProfile(staleFixture),
    /AOP_EVALUATOR_STALE_MATERIAL/,
  );
});

test("requires the exact 16-role material inventory and exact role-to-path binding", () => {
  const extra = input();
  extra.material_inventory.push(material("extra-unplanned", UOW_SUBJECT_REF));
  assert.throws(
    () => evaluateOperationProfile(extra),
    /AOP_EVALUATOR_MATERIAL_EXTRA/,
  );

  const substituted = input();
  const packetSchema = substituted.material_inventory.find(
    (row) => row.role === "packet-schema",
  )!;
  Object.assign(packetSchema, material("packet-schema", UOW_SUBJECT_REF));
  assert.throws(
    () => evaluateOperationProfile(substituted),
    /AOP_EVALUATOR_MATERIAL_PATH/,
  );
});

test("binds result and diagnostic to the exact immutable observer-result envelope", () => {
  const relabeled = input();
  const dependency = relabeled.property_results.find((row) =>
    row.property_id.endsWith(".hof-direction"),
  )!;
  dependency.result = "missing";
  dependency.diagnostic = "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING";
  dependency.observed_value = {
    producer_result: {
      result: "pass",
      diagnostic: "AOP_DEPENDENCY_PASS",
    },
  };
  assert.throws(
    () => evaluateOperationProfile(relabeled),
    /AOP_EVALUATOR_STALE_RESULT/,
  );

  const substituted = input();
  substituted.property_results[0].result_envelope_ref =
    substituted.property_results[1].result_envelope_ref;
  substituted.property_results[0].result_envelope_sha256 =
    substituted.property_results[1].result_envelope_sha256;
  assert.throws(
    () => evaluateOperationProfile(substituted),
    /AOP_EVALUATOR_STALE_RESULT/,
  );
});

test("rehashes raw evidence and rejects lexical path escape before evaluation", () => {
  const stale = input();
  stale.property_results[0].raw_evidence[0].sha256 = "d".repeat(64);
  assert.throws(
    () => evaluateOperationProfile(stale),
    /AOP_EVALUATOR_STALE_EVIDENCE/,
  );

  const escaped = input();
  escaped.property_results[0].raw_evidence[0].ref = "../../../../etc/hosts";
  assert.throws(
    () => evaluateOperationProfile(escaped),
    /AOP_EVALUATOR_PATH_ESCAPE/,
  );
});

test("rejects Workflow, authority, admission, and synchronized-closeout growth", () => {
  const workflow = input() as unknown as Record<string, unknown>;
  (workflow.subject as Record<string, unknown>).meta_type_id = "Workflow";
  assert.throws(() => evaluateOperationProfile(workflow), /AOP_EVALUATOR_SUBJECT_COLLAPSE/);

  for (const mutation of [
    (candidate: Record<string, unknown>) => {
      candidate.authority_effect = "profile-admission";
    },
    (candidate: Record<string, unknown>) => {
      candidate.synchronized_task_session_closeout = true;
    },
    (candidate: Record<string, unknown>) => {
      (candidate.profile as Record<string, unknown>).profile_admission = "accepted";
    },
  ]) {
    const candidate = input() as unknown as Record<string, unknown>;
    mutation(candidate);
    assert.throws(
      () => evaluateOperationProfile(candidate),
      /AOP_EVALUATOR_AUTHORITY_GROWTH/,
    );
  }
});

test("a missing cost budget remains owner-blocked and never claims semantic admission", () => {
  const receipt = evaluateOperationProfile(input());
  const cost = receipt.findings.find(
    (row) => row.property_id === "APE.ImplementationProperty.operation.cost-observation",
  )!;
  assert.equal(cost.result, "owner-blocked");
  assert.equal(cost.diagnostic, "AOP_COST_ADVISORY_NO_BUDGET");
  assert.equal(receipt.accounting.owner_blocked_count, 3);
  assert.equal(receipt.accounting.fail_count, 0);
  assert.equal(receipt.claim_ceiling.semantic_admission, false);
});
