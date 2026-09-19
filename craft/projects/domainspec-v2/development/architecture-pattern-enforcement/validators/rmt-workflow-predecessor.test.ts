import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  readLockedRepositoryFile,
  validateWorkflowPredecessor,
  type LockedRepositoryRef,
  type WorkflowPredecessorInput,
} from "./rmt-workflow-predecessor.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const PACKET_SCHEMA =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/rmt-profile-binding-packet.schema.json";
const PACKET_VALIDATOR =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.ts";
const PACKET_CLOSEOUT =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/SWU-AOP-001-closeout.json";
const WORKFLOW_CANDIDATE =
  "projects/domainspec-v2/development/remaining-meta-types/candidates/workflow.json";
const WORKFLOW_RECEIPT =
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-010.json";

function lock(path: string): LockedRepositoryRef {
  const bytes = readFileSync(resolve(REPO_ROOT, path));
  return {
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size_bytes: statSync(resolve(REPO_ROOT, path)).size,
  };
}

function input(): WorkflowPredecessorInput {
  return {
    packet_schema: lock(PACKET_SCHEMA),
    packet_validator: lock(PACKET_VALIDATOR),
    packet_closeout: lock(PACKET_CLOSEOUT),
    workflow_candidate: lock(WORKFLOW_CANDIDATE),
    workflow_projection_receipt: lock(WORKFLOW_RECEIPT),
    proof_receipts: ["006", "007", "008", "009"].map((suffix) => ({
      swu_id: `RMT-WF-${suffix}`,
      ...lock(
        `projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-${suffix}.json`,
      ),
    })),
    required_evidence_lane: "candidate-local-prototype",
    synchronized_task_session_closeout: false,
    operation_type_completion_receipt: null,
    authority_effect: "none",
  };
}

test("accepts the exact candidate-local Workflow predecessor without Operation completion", () => {
  const result = validateWorkflowPredecessor(input(), { repoRoot: REPO_ROOT });
  assert.equal(result.result, "pass");
  if (result.result !== "pass") return;
  assert.equal(result.subject_id, "candidate.settlement.ordered-workflow.workflow-implementation/v1");
  assert.equal(result.evidence_lane, "candidate-local-prototype");
  assert.equal(result.synchronized_task_session_closeout, false);
  assert.deepEqual(result.proof_swu_ids, [
    "RMT-WF-006",
    "RMT-WF-007",
    "RMT-WF-008",
    "RMT-WF-009",
  ]);
  assert.equal(result.authority_effect, "none");
});

test("blocks stale, reordered, and escaped predecessor material with distinct causes", () => {
  const stale = input();
  stale.workflow_candidate.sha256 = "0".repeat(64);
  assert.equal(
    validateWorkflowPredecessor(stale, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_STALE",
  );

  const reordered = input();
  reordered.proof_receipts = [
    reordered.proof_receipts[1],
    reordered.proof_receipts[0],
    ...reordered.proof_receipts.slice(2),
  ];
  assert.equal(
    validateWorkflowPredecessor(reordered, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_PROOF_CHAIN",
  );

  const escaped = input();
  escaped.packet_schema.path = "../../../../etc/hosts";
  assert.equal(
    validateWorkflowPredecessor(escaped, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_PATH_ESCAPE",
  );
});

test("blocks evidence-lane, authority, and Operation-completion growth", () => {
  const operation = input() as unknown as Record<string, unknown>;
  operation.operation_type_completion_receipt = {
    path: "operation-type-completion-receipt.json",
  };
  assert.equal(
    validateWorkflowPredecessor(operation, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_OPERATION_DEPENDENCY",
  );

  const lane = input() as unknown as Record<string, unknown>;
  lane.required_evidence_lane = "canonical-governance";
  assert.equal(
    validateWorkflowPredecessor(lane, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_EVIDENCE_LANE",
  );

  const authority = input() as unknown as Record<string, unknown>;
  authority.authority_effect = "profile-admission";
  assert.equal(
    validateWorkflowPredecessor(authority, { repoRoot: REPO_ROOT }).diagnostic,
    "AOP_WF_PREDECESSOR_AUTHORITY_GROWTH",
  );
});

test("rejects a symlink even when its target bytes match the declared lock", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "awf-predecessor-symlink-"));
  writeFileSync(join(repoRoot, "target.json"), "{}\n", "utf8");
  symlinkSync("target.json", join(repoRoot, "linked.json"));
  const bytes = readFileSync(join(repoRoot, "target.json"));
  assert.throws(
    () =>
      readLockedRepositoryFile(repoRoot, {
        path: "linked.json",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        size_bytes: bytes.length,
      }),
    /AOP_WF_PREDECESSOR_PATH_ESCAPE/,
  );
});
