import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  PROHIBITED_CLAIMS,
  implementationPropertyDenominatorDigest,
  validateRmtProfileBindingPacket,
  type PacketDiagnostic,
} from "./rmt-profile-binding-packet.ts";

type MutablePacket = Record<string, any>;

const REPO_ROOT = resolve(process.cwd(), "../../..");
const SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/rmt-profile-binding-packet.schema.json";
const CANONICAL_RECEIPT_REF =
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-OP-010.json";
const CANONICAL_REALIZATION_REF =
  "projects/domainspec-v2/development/remaining-meta-types/candidates/operation.json";
const PROPERTY_ID = "APE.ImplementationProperty.operation.owner-decision";

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileDigest(repoRoot: string, ref: string): string {
  return sha256(readFileSync(join(repoRoot, ref.split("#", 1)[0])));
}

function readJson(repoRoot: string, ref: string): MutablePacket {
  return JSON.parse(readFileSync(join(repoRoot, ref), "utf8")) as MutablePacket;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function basePacket(input: {
  receiptRef: string;
  receiptDigest: string;
  receiptClaimCeiling: string;
  lane: "candidate-local-prototype" | "canonical-governance";
  synchronized: boolean;
  realizationRef: string;
  realizationDigest: string;
  subjectId: string;
}): MutablePacket {
  return {
    schema_version: "ape.rmt-profile-binding-packet/v1",
    packet_id: `packet.operation.${input.lane}/v1`,
    rmt_subject: {
      work_pack_id: "WP-RMT-002",
      meta_type_id: "Operation",
      subject_id: input.subjectId,
      realization_contract: {
        ref: `${input.realizationRef}#/candidate_id`,
        digest: input.realizationDigest,
      },
    },
    predecessor_evidence: {
      required_evidence_lane: input.lane,
      receipt_ref: input.receiptRef,
      receipt_digest: input.receiptDigest,
      result: "pass",
      claim_ceiling: input.receiptClaimCeiling,
      synchronized_task_session_closeout: input.synchronized,
    },
    profile: {
      architecture_profile_id: "APE.ArchitectureProfile.TypeScriptOperationApplication/candidate-v1",
      architecture_profile_version: "0.1.0-candidate",
      implementation_property_denominator_digest:
        implementationPropertyDenominatorDigest([PROPERTY_ID]),
    },
    observations: [],
    bindings: [],
    infrastructure_joins: [],
    accounting: {
      denominator_property_ids: [PROPERTY_ID],
      applicability_results: [
        {
          property_id: PROPERTY_ID,
          applicability: "owner-blocked",
          basis: "AOP-002 owns the portable Rule-status decision.",
          evidence_ref: "R-01",
        },
      ],
      applicable_property_ids: [],
      non_applicable_property_ids: [],
      owner_blocked_applicability_ids: [PROPERTY_ID],
      property_results: [
        {
          property_id: PROPERTY_ID,
          result: "owner-blocked",
          finding_ref: "owner-route:R-01",
        },
      ],
      result_counts: {
        pass: 0,
        fail: 0,
        missing: 0,
        unsupported: 0,
        owner_blocked: 1,
        not_applicable: 0,
      },
      unaccounted_property_ids: [],
    },
    stale_input: {
      result: "pass",
      mismatches: [],
    },
    claim_ceiling: {
      evidence_only: true,
      authority_effect: "none",
      synchronized_closeout_claim: input.synchronized,
      prohibited_claims: [...PROHIBITED_CLAIMS],
    },
  };
}

function canonicalPacket(): MutablePacket {
  const receipt = readJson(REPO_ROOT, CANONICAL_RECEIPT_REF);
  return basePacket({
    receiptRef: CANONICAL_RECEIPT_REF,
    receiptDigest: fileDigest(REPO_ROOT, CANONICAL_RECEIPT_REF),
    receiptClaimCeiling: receipt.claim_ceiling as string,
    lane: "canonical-governance",
    synchronized: false,
    realizationRef: CANONICAL_REALIZATION_REF,
    realizationDigest: fileDigest(REPO_ROOT, CANONICAL_REALIZATION_REF),
    subjectId: receipt.candidate_projection.candidate_id as string,
  });
}

interface FixtureRepo {
  repoRoot: string;
  packet: MutablePacket;
  sourceRef: string;
  sourceDigest: string;
  receiptRef: string;
  externalRecordRef: string;
  externalRecordDigest: string;
  cleanup(): void;
}

function fixtureRepo(): FixtureRepo {
  const repoRoot = mkdtempSync(join(tmpdir(), "aop-packet-v1-"));
  mkdirSync(join(repoRoot, "sources"), { recursive: true });
  mkdirSync(join(repoRoot, "receipts"), { recursive: true });
  mkdirSync(join(repoRoot, "records"), { recursive: true });

  const sourceRef = "sources/operation.json";
  const source = `${JSON.stringify(
    {
      schema_version: "domainspec.meta-type-implementation-candidate/v1",
      candidate_id: "candidate.fixture.operation/v1",
      meta_type: "Operation",
    },
    null,
    2,
  )}\n`;
  writeFileSync(join(repoRoot, sourceRef), source, "utf8");
  const sourceDigest = sha256(source);

  const receiptRef = "receipts/prototype.json";
  const receiptClaimCeiling =
    "Candidate-local structural evidence only; no synchronized closeout or authority.";
  const receipt = `${JSON.stringify(
    {
      schema_version: "ape.prototype-validation-receipt/v1",
      evidence_lane: "candidate-local-prototype",
      result: "pass",
      claim_ceiling: receiptClaimCeiling,
      synchronized_task_session_closeout: false,
      authority_effect: "none",
      work_pack_id: "WP-RMT-002",
      task_id: "TASK-RMT-OP",
      candidate_projection: {
        path: sourceRef,
        sha256: sourceDigest,
        candidate_id: "candidate.fixture.operation/v1",
      },
    },
    null,
    2,
  )}\n`;
  writeFileSync(join(repoRoot, receiptRef), receipt, "utf8");

  const externalRecordRef = "records/persistence.json";
  const externalRecord = `${JSON.stringify(
    {
      schema_version: "fixture.persistence-record/v1",
      concern_kind: "persistence",
      result: "pass",
      claim_ceiling: "persistence observation only",
    },
    null,
    2,
  )}\n`;
  writeFileSync(join(repoRoot, externalRecordRef), externalRecord, "utf8");

  return {
    repoRoot,
    sourceRef,
    sourceDigest,
    receiptRef,
    externalRecordRef,
    externalRecordDigest: sha256(externalRecord),
    packet: basePacket({
      receiptRef,
      receiptDigest: sha256(receipt),
      receiptClaimCeiling,
      lane: "candidate-local-prototype",
      synchronized: false,
      realizationRef: sourceRef,
      realizationDigest: sourceDigest,
      subjectId: "candidate.fixture.operation/v1",
    }),
    cleanup: () => rmSync(repoRoot, { recursive: true }),
  };
}

function makeObservedPassPacket(fixture: FixtureRepo): MutablePacket {
  const packet = clone(fixture.packet);
  packet.accounting.applicability_results[0].applicability = "applicable";
  packet.accounting.applicable_property_ids = [PROPERTY_ID];
  packet.accounting.owner_blocked_applicability_ids = [];
  packet.accounting.property_results[0] = {
    property_id: PROPERTY_ID,
    result: "pass",
    finding_ref: "finding:operation-observed",
  };
  packet.accounting.result_counts.pass = 1;
  packet.accounting.result_counts.owner_blocked = 0;
  packet.bindings = [
    {
      implementation_binding_id: "binding.operation.repository",
      dependency_role: "repository",
      consumer_contract_ref: `${fixture.sourceRef}#/candidate_id`,
      adapter_ref: `${fixture.sourceRef}#/candidate_id`,
      adapter_digest: fixture.sourceDigest,
    },
  ];
  packet.observations = [
    {
      observation_id: "observation.operation.repository",
      projection_kind: "observed",
      property_id: PROPERTY_ID,
      implementation_binding_id: "binding.operation.repository",
      source_ref: `${fixture.sourceRef}#/candidate_id`,
      source_digest: fixture.sourceDigest,
      observed_value: { dependency_form: "injected" },
      provenance_ref: "fixture:operation:repository",
    },
  ];
  return packet;
}

function assertDiagnostic(
  packet: MutablePacket,
  repoRoot: string,
  expected: PacketDiagnostic,
): void {
  const result = validateRmtProfileBindingPacket(packet, { repoRoot });
  assert.equal(result.result, "block");
  assert.equal(result.diagnostic, expected);
}

test("accepts the exact current canonical Operation predecessor without relabeling closeout", () => {
  const result = validateRmtProfileBindingPacket(canonicalPacket(), {
    repoRoot: REPO_ROOT,
  });
  assert.deepEqual(result, {
    result: "pass",
    diagnostic: "AOP_PACKET_PASS",
    selector: "$",
    evidence_lane: "canonical-governance",
    synchronized_task_session_closeout: false,
  });
  assert.equal("findings" in result, false);
  assert.equal("type_completion_receipt" in result, false);
});

test("accepts an exact candidate-local predecessor without calling it synchronized", () => {
  const fixture = fixtureRepo();
  try {
    const result = validateRmtProfileBindingPacket(fixture.packet, {
      repoRoot: fixture.repoRoot,
    });
    assert.deepEqual(result, {
      result: "pass",
      diagnostic: "AOP_PACKET_PASS",
      selector: "$",
      evidence_lane: "candidate-local-prototype",
      synchronized_task_session_closeout: false,
    });
  } finally {
    fixture.cleanup();
  }
});

test("the JSON Schema is Draft 2020-12 valid, accepts the canonical packet, and rejects nested surplus", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "aop-packet-schema-"));
  try {
    const validPacketRef = join(tempRoot, "valid.json");
    const invalidPacketRef = join(tempRoot, "invalid.json");
    const invalid = canonicalPacket();
    invalid.profile.oracle_hint = true;
    writeFileSync(validPacketRef, `${JSON.stringify(canonicalPacket(), null, 2)}\n`);
    writeFileSync(invalidPacketRef, `${JSON.stringify(invalid, null, 2)}\n`);
    const python = [
      "import json, sys",
      "from jsonschema import Draft202012Validator",
      "schema = json.load(open(sys.argv[1], encoding='utf-8'))",
      "Draft202012Validator.check_schema(schema)",
      "validator = Draft202012Validator(schema)",
      "valid = json.load(open(sys.argv[2], encoding='utf-8'))",
      "invalid = json.load(open(sys.argv[3], encoding='utf-8'))",
      "assert not list(validator.iter_errors(valid))",
      "assert list(validator.iter_errors(invalid))",
    ].join("\n");
    const run = spawnSync(
      "/usr/bin/python3",
      ["-c", python, join(REPO_ROOT, SCHEMA_REF), validPacketRef, invalidPacketRef],
      { encoding: "utf8" },
    );
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
  } finally {
    rmSync(tempRoot, { recursive: true });
  }
});

const simpleHostiles: ReadonlyArray<{
  fixtureId: string;
  expected: PacketDiagnostic;
  mutate(packet: MutablePacket): void;
}> = [
  {
    fixtureId: "stale-receipt-digest",
    expected: "AOP_PACKET_STALE_INPUT",
    mutate: (packet) => {
      packet.predecessor_evidence.receipt_digest = "0".repeat(64);
    },
  },
  {
    fixtureId: "stale-realization-digest",
    expected: "AOP_PACKET_STALE_INPUT",
    mutate: (packet) => {
      packet.rmt_subject.realization_contract.digest = "0".repeat(64);
    },
  },
  {
    fixtureId: "prototype-lane-relabel",
    expected: "AOP_PACKET_EVIDENCE_LANE",
    mutate: (packet) => {
      packet.predecessor_evidence.required_evidence_lane = "canonical-governance";
    },
  },
  {
    fixtureId: "mutable-lifecycle-state",
    expected: "AOP_PACKET_BOUNDARY_GROWTH",
    mutate: (packet) => {
      packet.selected_swu = "SWU-AOP-002";
    },
  },
  {
    fixtureId: "combined-operation-workflow-subject",
    expected: "AOP_PACKET_SUBJECT_COLLAPSE",
    mutate: (packet) => {
      packet.rmt_subject.meta_type_id = ["Operation", "Workflow"];
    },
  },
  {
    fixtureId: "omitted-denominator-property",
    expected: "AOP_PACKET_APPLICABILITY",
    mutate: (packet) => {
      packet.accounting.denominator_property_ids.push(
        "APE.ImplementationProperty.operation.second-property",
      );
      packet.profile.implementation_property_denominator_digest =
        implementationPropertyDenominatorDigest(
          packet.accounting.denominator_property_ids,
        );
    },
  },
  {
    fixtureId: "cross-concern-inference",
    expected: "AOP_PACKET_CROSS_INFERENCE",
    mutate: (packet) => {
      packet.derived_claims = ["persistence proves transport"];
    },
  },
  {
    fixtureId: "authority-growth",
    expected: "AOP_PACKET_AUTHORITY_GROWTH",
    mutate: (packet) => {
      packet.claim_ceiling.authority_effect = "profile-admission";
    },
  },
  {
    fixtureId: "nested-schema-surplus",
    expected: "AOP_PACKET_SCHEMA",
    mutate: (packet) => {
      packet.profile.oracle_hint = "ignore denominator";
    },
  },
];

for (const hostile of simpleHostiles) {
  test(`rejects ${hostile.fixtureId} for ${hostile.expected}`, () => {
    const fixture = fixtureRepo();
    try {
      const packet = clone(fixture.packet);
      hostile.mutate(packet);
      assertDiagnostic(packet, fixture.repoRoot, hostile.expected);
    } finally {
      fixture.cleanup();
    }
  });
}

test("rejects duplicate concern kinds for one dependency observation", () => {
  const fixture = fixtureRepo();
  try {
    const packet = makeObservedPassPacket(fixture);
    const common = {
      dependency_observation_id: "observation.operation.repository",
      concern_kind: "persistence",
      external_record_ref: fixture.externalRecordRef,
      external_record_digest: fixture.externalRecordDigest,
      external_record_status: "pass",
      observation_ceiling: "persistence observation only",
    };
    packet.infrastructure_joins = [
      { join_id: "join.persistence.1", ...common },
      { join_id: "join.persistence.2", ...common },
    ];
    assertDiagnostic(
      packet,
      fixture.repoRoot,
      "AOP_PACKET_JOIN_DUPLICATE",
    );
  } finally {
    fixture.cleanup();
  }
});

test("rejects unsupported observation and adapter evidence collapsed into pass", () => {
  const fixture = fixtureRepo();
  try {
    const packet = makeObservedPassPacket(fixture);
    packet.observations[0].projection_kind = "unsupported";
    packet.bindings[0].adapter_ref = "unsupported";
    packet.bindings[0].adapter_digest = null;
    assertDiagnostic(
      packet,
      fixture.repoRoot,
      "AOP_PACKET_RESULT_COLLAPSE",
    );
  } finally {
    fixture.cleanup();
  }
});

test("rejects repository-reference escape before reading outside the selected root", () => {
  const fixture = fixtureRepo();
  try {
    const packet = clone(fixture.packet);
    packet.rmt_subject.realization_contract.ref = "../outside.json";
    assertDiagnostic(packet, fixture.repoRoot, "AOP_PACKET_PATH_ESCAPE");
  } finally {
    fixture.cleanup();
  }
});

test("rejects a repository-relative symlink whose real target escapes the selected root", () => {
  const fixture = fixtureRepo();
  const outsideRoot = mkdtempSync(join(tmpdir(), "aop-packet-outside-"));
  try {
    const outsidePath = join(outsideRoot, "outside.json");
    const outside = "{\"outside\":true}\n";
    writeFileSync(outsidePath, outside, "utf8");
    symlinkSync(outsidePath, join(fixture.repoRoot, "sources", "escape.json"));
    const packet = makeObservedPassPacket(fixture);
    packet.observations[0].source_ref = "sources/escape.json#/outside";
    packet.observations[0].source_digest = sha256(outside);
    assertDiagnostic(packet, fixture.repoRoot, "AOP_PACKET_PATH_ESCAPE");
  } finally {
    fixture.cleanup();
    rmSync(outsideRoot, { recursive: true });
  }
});

test("rejects authority growth nested inside an exactly rebound predecessor receipt", () => {
  const fixture = fixtureRepo();
  try {
    const receiptPath = join(fixture.repoRoot, fixture.receiptRef);
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as MutablePacket;
    receipt.lifecycle = { authority_effect: "profile-admission" };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptPath, bytes, "utf8");
    const packet = clone(fixture.packet);
    packet.predecessor_evidence.receipt_digest = sha256(bytes);
    assertDiagnostic(
      packet,
      fixture.repoRoot,
      "AOP_PACKET_AUTHORITY_GROWTH",
    );
  } finally {
    fixture.cleanup();
  }
});

test("rejects a persistence record relabeled as transport evidence", () => {
  const fixture = fixtureRepo();
  try {
    const packet = makeObservedPassPacket(fixture);
    packet.infrastructure_joins = [
      {
        join_id: "join.transport.relabel",
        dependency_observation_id: "observation.operation.repository",
        concern_kind: "transport",
        external_record_ref: fixture.externalRecordRef,
        external_record_digest: fixture.externalRecordDigest,
        external_record_status: "pass",
        observation_ceiling: "persistence observation only",
      },
    ];
    assertDiagnostic(
      packet,
      fixture.repoRoot,
      "AOP_PACKET_CROSS_INFERENCE",
    );
  } finally {
    fixture.cleanup();
  }
});
