import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  evaluateWorkflowProfile,
  recomputeWorkflowPropertyClaims,
  REQUIRED_WORKFLOW_MATERIAL_PATHS,
  type WorkflowMaterialItemV1,
  type WorkflowProfileEvaluationInputV1,
} from "./workflow-profile-evaluator.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const PROFILE_REF = REQUIRED_WORKFLOW_MATERIAL_PATHS.profile;
const APPLICABILITY_REF = REQUIRED_WORKFLOW_MATERIAL_PATHS.applicability;
const FIXTURE_REF = REQUIRED_WORKFLOW_MATERIAL_PATHS.fixture;
const HOSTILES_REF = REQUIRED_WORKFLOW_MATERIAL_PATHS.hostiles;
const RECEIPT_SCHEMA_REF = REQUIRED_WORKFLOW_MATERIAL_PATHS["receipt-schema"];

function json(ref: string): Record<string, any> {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, ref), "utf8")) as Record<string, any>;
}

function material(
  role: keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS,
  path = REQUIRED_WORKFLOW_MATERIAL_PATHS[role],
): WorkflowMaterialItemV1 {
  const bytes = readFileSync(resolve(REPO_ROOT, path));
  return {
    role,
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size_bytes: statSync(resolve(REPO_ROOT, path)).size,
  };
}

function input(): WorkflowProfileEvaluationInputV1 {
  const fixture = json(FIXTURE_REF);
  return {
    repo_root: REPO_ROOT,
    evidence_lane: "candidate-local-prototype",
    profile: json(PROFILE_REF),
    applicability_scaffold: json(APPLICABILITY_REF),
    fixture,
    hostile_catalogue: json(HOSTILES_REF),
    claimed_results: recomputeWorkflowPropertyClaims(fixture, REPO_ROOT),
    material_inventory: (
      Object.keys(REQUIRED_WORKFLOW_MATERIAL_PATHS) as Array<
        keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS
      >
    ).map((role) => material(role)),
    synchronized_task_session_closeout: false,
    authority_effect: "none",
  };
}

test("emits a deterministic Workflow-only receipt with total nine-property accounting", () => {
  const first = evaluateWorkflowProfile(input());
  const second = evaluateWorkflowProfile(input());
  assert.deepEqual(first, second);
  assert.equal(first.result, "pass");
  assert.equal(first.subject.meta_type_id, "Workflow");
  assert.equal(first.predecessor.projection_swu_id, "RMT-WF-010");
  assert.equal(first.predecessor.operation_type_completion_receipt_used, false);
  assert.deepEqual(first.accounting, {
    denominator_count: 9,
    applicable_count: 7,
    not_applicable_count: 2,
    owner_blocked_applicability_count: 0,
    pass_count: 7,
    fail_count: 0,
    missing_count: 0,
    unsupported_count: 0,
    owner_blocked_count: 0,
    unaccounted_property_ids: [],
    extra_property_ids: [],
  });
  assert.equal(first.findings.length, 7);
  const compensation = first.findings.find(
    (finding) => finding.property_id === "APE.WF.P09-TRAVERSAL-EQUIVALENCE",
  )!;
  assert.equal(compensation.result, "pass");
  assert.equal(compensation.diagnostic, "AOP_WF_COMPENSATION_PASS");
  assert.equal(first.authority_effect, "none");
  const { receipt_sha256: _ignored, ...body } = first;
  const canonical = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonical)
      : value !== null && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, child]) => [key, canonical(child)]),
          )
        : value;
  assert.equal(
    first.receipt_sha256,
    createHash("sha256").update(JSON.stringify(canonical(body))).digest("hex"),
  );
});

test("the emitted receipt validates against the strict Draft 2020-12 schema", () => {
  const receipt = evaluateWorkflowProfile(input());
  const script = [
    "import json, sys",
    "from jsonschema import Draft202012Validator",
    "schema=json.load(open(sys.argv[1], encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "instance=json.load(sys.stdin)",
    "errors=sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda e:list(e.path))",
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

test("recomputes observers and rejects result or join relabeling", () => {
  const relabeled = input();
  relabeled.claimed_results = relabeled.claimed_results.map((claim, index) =>
    index === 8 ? { ...claim, result: "missing" } : claim,
  );
  assert.throws(() => evaluateWorkflowProfile(relabeled), /AOP_WF_EVALUATOR_STALE_RESULT/);

  const staleProducer = input();
  staleProducer.claimed_results = staleProducer.claimed_results.map((claim, index) =>
    index === 0 ? { ...claim, producer_output_sha256: "0".repeat(64) } : claim,
  );
  assert.throws(() => evaluateWorkflowProfile(staleProducer), /AOP_WF_EVALUATOR_STALE_RESULT/);

  const staleJoin = input();
  staleJoin.claimed_results = staleJoin.claimed_results.map((claim, index) =>
    index === 6 ? { ...claim, joins_sha256: "f".repeat(64) } : claim,
  );
  assert.throws(() => evaluateWorkflowProfile(staleJoin), /AOP_WF_EVALUATOR_STALE_JOIN/);
});

test("requires every property once and rejects extra or duplicate claims", () => {
  const missing = input();
  missing.claimed_results = missing.claimed_results.slice(0, -1);
  assert.throws(() => evaluateWorkflowProfile(missing), /AOP_WF_EVALUATOR_UNACCOUNTED/);

  const duplicate = input();
  duplicate.claimed_results = [
    ...duplicate.claimed_results.slice(0, -1),
    structuredClone(duplicate.claimed_results[0]),
  ];
  assert.throws(() => evaluateWorkflowProfile(duplicate), /AOP_WF_EVALUATOR_DUPLICATE_RESULT/);

  const extra = input() as unknown as Record<string, any>;
  extra.claimed_results[8] = {
    ...extra.claimed_results[8],
    property_id: "APE.WF.P99-EXTRA",
  };
  assert.throws(
    () => evaluateWorkflowProfile(extra as WorkflowProfileEvaluationInputV1),
    /AOP_WF_EVALUATOR_EXTRA_PROPERTY/,
  );
});

test("requires the exact 25-role material set and exact role-to-path binding", () => {
  const extra = input() as unknown as Record<string, any>;
  extra.material_inventory.push({ ...extra.material_inventory[0], role: "extra" });
  assert.throws(
    () => evaluateWorkflowProfile(extra as WorkflowProfileEvaluationInputV1),
    /AOP_WF_EVALUATOR_MATERIAL_EXTRA/,
  );

  const substituted = input();
  substituted.material_inventory = substituted.material_inventory.map((item) =>
    item.role === "profile" ? material("profile", REQUIRED_WORKFLOW_MATERIAL_PATHS.hostiles) : item,
  );
  assert.throws(
    () => evaluateWorkflowProfile(substituted),
    /AOP_WF_EVALUATOR_MATERIAL_PATH/,
  );

  const stale = input();
  stale.material_inventory = stale.material_inventory.map((item) =>
    item.role === "fixture" ? { ...item, sha256: "a".repeat(64) } : item,
  );
  assert.throws(() => evaluateWorkflowProfile(stale), /AOP_WF_EVALUATOR_STALE_MATERIAL/);
});

test("rejects surplus fields on the input, claimed-result, and material row envelopes", () => {
  const topLevel = input() as unknown as Record<string, any>;
  topLevel.oracle_hint = "ignore-exact-input-contract";
  assert.throws(
    () => evaluateWorkflowProfile(topLevel as WorkflowProfileEvaluationInputV1),
    /AOP_WF_EVALUATOR_SCHEMA at \$/,
  );

  const claimedResult = input() as unknown as Record<string, any>;
  claimedResult.claimed_results[0].oracle_hint = "relabel-result";
  assert.throws(
    () => evaluateWorkflowProfile(claimedResult as WorkflowProfileEvaluationInputV1),
    /AOP_WF_EVALUATOR_SCHEMA at \$\.claimed_results\[0\]/,
  );

  const materialRow = input() as unknown as Record<string, any>;
  materialRow.material_inventory[0].oracle_hint = "rebind-material";
  assert.throws(
    () => evaluateWorkflowProfile(materialRow as WorkflowProfileEvaluationInputV1),
    /AOP_WF_EVALUATOR_SCHEMA at \$\.material_inventory\[0\]/,
  );
});

test("rejects rebound profile, applicability, fixture, and hostile bytes", () => {
  const profile = input();
  profile.profile.properties[0].owner_route = "invented-owner";
  assert.throws(() => evaluateWorkflowProfile(profile), /AOP_WF_EVALUATOR_STALE_PROFILE/);
  const applicability = input();
  applicability.applicability_scaffold.unresolved_case.basis = "rewritten";
  assert.throws(
    () => evaluateWorkflowProfile(applicability),
    /AOP_WF_EVALUATOR_STALE_APPLICABILITY/,
  );
  const fixture = input();
  fixture.fixture.expected_property_results[8].result = "missing";
  assert.throws(() => evaluateWorkflowProfile(fixture), /AOP_WF_EVALUATOR_STALE_FIXTURE/);
  const hostiles = input();
  hostiles.hostile_catalogue.cases.pop();
  assert.throws(() => evaluateWorkflowProfile(hostiles), /AOP_WF_EVALUATOR_STALE_HOSTILES/);
});

test("rejects authority, synchronization, and subject growth", () => {
  for (const mutation of [
    (candidate: Record<string, any>) => { candidate.authority_effect = "profile-admission"; },
    (candidate: Record<string, any>) => { candidate.synchronized_task_session_closeout = true; },
  ]) {
    const candidate = input() as unknown as Record<string, any>;
    mutation(candidate);
    assert.throws(
      () => evaluateWorkflowProfile(candidate as WorkflowProfileEvaluationInputV1),
      /AOP_WF_EVALUATOR_AUTHORITY_GROWTH/,
    );
  }
  const operation = input();
  operation.fixture.subject.meta_type_id = "Operation";
  assert.throws(() => evaluateWorkflowProfile(operation), /AOP_WF_EVALUATOR_STALE_FIXTURE/);
});
