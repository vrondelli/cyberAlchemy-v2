import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  observeWorkflowCompensation,
  type WorkflowCompensationObserverInput,
} from "./workflow-compensation-observer.ts";

function lock(root: string, path: string) {
  const bytes = readFileSync(join(root, path));
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}

function fixture(): WorkflowCompensationObserverInput {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-comp-"));
  writeFileSync(
    join(repo_root, "workflow.ts"),
    "forwardSettlement(); for (const item of reversed) await compensateSettlement(item);",
    "utf8",
  );
  writeFileSync(
    join(repo_root, "oracle.json"),
    `${JSON.stringify({ task_id: "TASK-RMT-WF", result: "pass", authority_effect: "none" })}\n`,
    "utf8",
  );
  return {
    repo_root,
    source: lock(repo_root, "workflow.ts"),
    rmt_oracle: lock(repo_root, "oracle.json"),
    subject_id: "Fixture.Workflow",
    forward_action: { callable_id: "forward-settlement/v1", callable_kind: "Operation", source_selector: "forwardSettlement", supplied_at_composition_root: true },
    compensation: { callable_id: "compensate-settlement/v1", callable_kind: "Operation", source_selector: "compensateSettlement", supplied_at_composition_root: true },
    evidence_stages: {
      forward_action_ref: "evidence:forward",
      compensation_invocation_ref: "evidence:compensation-invocation",
      compensation_failure_ref: "evidence:compensation-failure",
      final_residue_ref: "evidence:final-residue",
    },
    traversal: { form: "explicit-loop", direction: "reverse", awaited: true, source_selector: "for (const item", comparison: "not-compared", semantic_order_claimed: false },
    provider_construction_selectors: [],
    overclaim_labels: [],
    semantic_claims: [],
    authority_effect: "none",
  };
}

test("keeps compensation placement and four evidence stages distinct", () => {
  const result = observeWorkflowCompensation(fixture());
  assert.equal(result.result, "pass");
  assert.equal(result.diagnostic, "AOP_WF_COMPENSATION_PASS");
  assert.equal(new Set(Object.values(result.evidence_stages!)).size, 4);
  assert.equal(result.rollback_claimed, false);
  assert.equal(result.semantic_result_claimed, false);
});

test("rejects collapsed evidence and rollback/restoration overclaim independently", () => {
  const collapsed = fixture();
  collapsed.evidence_stages.compensation_failure_ref =
    collapsed.evidence_stages.compensation_invocation_ref;
  assert.equal(
    observeWorkflowCompensation(collapsed).diagnostic,
    "AOP_WF_COMPENSATION_STAGE_COLLAPSE",
  );
  const overclaim = fixture();
  overclaim.overclaim_labels = ["guaranteed rollback and restoration"];
  assert.equal(
    observeWorkflowCompensation(overclaim).diagnostic,
    "AOP_WF_COMPENSATION_ROLLBACK_OVERCLAIM",
  );
});

test("rejects copied RMT semantics and provider construction", () => {
  const semantic = fixture();
  semantic.semantic_claims = ["compensation trigger order is semantically correct"];
  assert.equal(
    observeWorkflowCompensation(semantic).diagnostic,
    "AOP_WF_COMPENSATION_SEMANTIC_ABSORPTION",
  );
  const provider = fixture();
  provider.provider_construction_selectors = ["new Provider"];
  assert.equal(
    observeWorkflowCompensation(provider).diagnostic,
    "AOP_WF_COMPENSATION_PROVIDER_CONSTRUCTION",
  );
});
