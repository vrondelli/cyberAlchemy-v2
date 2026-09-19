import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  observeWorkflowChildren,
  type WorkflowChildObserverInput,
} from "./workflow-child-observer.ts";

function fixture(source = 'const steps = ["validate-child", "persist-child"];') {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-child-"));
  const path = "workflow.ts";
  writeFileSync(join(repo_root, path), source, "utf8");
  const bytes = readFileSync(join(repo_root, path));
  const input: WorkflowChildObserverInput = {
    repo_root,
    source: {
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size_bytes: bytes.length,
    },
    subject_id: "Fixture.Workflow",
    orchestration_id: "fixture.workflow/v1",
    composition_root_ref: "fixture:composition-root",
    children: [
      { step_id: "validate", child_id: "validate-child", child_kind: "Operation", source_selector: "validate-child", supplied_at_composition_root: true },
      { step_id: "persist", child_id: "persist-child", child_kind: "Operation", source_selector: "persist-child", supplied_at_composition_root: true }
    ],
    child_repository_ownership_selectors: [],
    duplicated_child_rule_selectors: [],
    direct_entity_mutation_selectors: [],
    provider_construction_selectors: [],
    workflow_wide_transaction_claimed: false,
    semantic_claims: [],
    authority_effect: "none",
  };
  return input;
}

test("observes named child callables while retaining child authority", () => {
  const result = observeWorkflowChildren(fixture());
  assert.equal(result.result, "pass");
  assert.equal(result.diagnostic, "AOP_WF_CHILD_PASS");
  assert.equal(result.observations.length, 4);
  assert.equal(result.semantic_result_claimed, false);
  assert.equal(result.authority_effect, "none");
});

test("distinguishes repository, Rule, entity, provider and transaction absorption", () => {
  const cases: Array<[keyof WorkflowChildObserverInput, unknown, string]> = [
    ["child_repository_ownership_selectors", ["repo.save"], "AOP_WF_CHILD_REPOSITORY_ABSORPTION"],
    ["duplicated_child_rule_selectors", ["canSettle"], "AOP_WF_CHILD_RULE_ABSORPTION"],
    ["direct_entity_mutation_selectors", ["entity.status"], "AOP_WF_CHILD_ENTITY_MUTATION"],
    ["provider_construction_selectors", ["new Provider"], "AOP_WF_CHILD_PROVIDER_CONSTRUCTION"],
    ["workflow_wide_transaction_claimed", true, "AOP_WF_CHILD_TRANSACTION_COLLAPSE"],
  ];
  for (const [key, value, diagnostic] of cases) {
    const input = fixture() as unknown as Record<string, unknown>;
    input[key] = value;
    assert.equal(
      observeWorkflowChildren(input as unknown as WorkflowChildObserverInput).diagnostic,
      diagnostic,
    );
  }
});

test("keeps generic and dynamic child resolution unsupported", () => {
  const generic = fixture();
  generic.children = generic.children.map((child, index) =>
    index === 0 ? { ...child, child_kind: "generic-callback" as const } : child,
  );
  assert.equal(
    observeWorkflowChildren(generic).diagnostic,
    "AOP_WF_CHILD_GENERIC_UNSUPPORTED",
  );
  const dynamic = fixture("const child = steps[name]; const x = 'validate-child persist-child';");
  assert.equal(
    observeWorkflowChildren(dynamic).diagnostic,
    "AOP_WF_CHILD_DYNAMIC_UNSUPPORTED",
  );
});
