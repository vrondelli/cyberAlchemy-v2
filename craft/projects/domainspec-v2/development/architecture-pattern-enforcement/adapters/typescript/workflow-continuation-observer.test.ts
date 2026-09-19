import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  observeWorkflowContinuation,
  type WorkflowContinuationObserverInput,
} from "./workflow-continuation-observer.ts";

function lock(root: string, path: string) {
  const bytes = readFileSync(join(root, path));
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}

function fixture(): WorkflowContinuationObserverInput {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-cont-"));
  writeFileSync(join(repo_root, "workflow.ts"), "stop continue compensate terminal", "utf8");
  writeFileSync(
    join(repo_root, "oracle.json"),
    `${JSON.stringify({ task_id: "TASK-RMT-WF", result: "pass", retry_policy: "none", authority_effect: "none" })}\n`,
    "utf8",
  );
  return {
    repo_root,
    source: lock(repo_root, "workflow.ts"),
    rmt_oracle: lock(repo_root, "oracle.json"),
    subject_id: "Fixture.Workflow",
    placements: [
      { route: "stop", applicability: "applicable", placement: "workflow-handler", evidence_selector: "stop" },
      { route: "continue", applicability: "applicable", placement: "child-result", evidence_selector: "continue" },
      { route: "retry", applicability: "not-applicable", placement: "not-applicable", evidence_selector: "retry_policy" },
      { route: "compensate", applicability: "applicable", placement: "composition-root", evidence_selector: "compensate" },
      { route: "terminal", applicability: "applicable", placement: "workflow-handler", evidence_selector: "terminal" }
    ],
    provider_or_service_locator_selectors: [],
    semantic_claims: [],
    authority_effect: "none",
  };
}

test("observes continuation placement against an exact RMT oracle", () => {
  const first = observeWorkflowContinuation(fixture());
  const secondInput = fixture();
  const second = observeWorkflowContinuation(secondInput);
  assert.equal(first.result, "pass");
  assert.equal(first.diagnostic, "AOP_WF_CONTINUATION_PASS");
  assert.equal(first.route_results.length, 5);
  assert.equal(first.semantic_result_claimed, false);
  assert.equal(second.result, "pass");
});

test("does not turn placement into RMT semantics or provider policy", () => {
  const semantic = fixture();
  semantic.semantic_claims = ["retry-order-is-correct"];
  assert.equal(
    observeWorkflowContinuation(semantic).diagnostic,
    "AOP_WF_CONTINUATION_SEMANTIC_ABSORPTION",
  );
  const provider = fixture();
  provider.provider_or_service_locator_selectors = ["container.resolve"];
  assert.equal(
    observeWorkflowContinuation(provider).diagnostic,
    "AOP_WF_CONTINUATION_PROVIDER_RESOLUTION",
  );
});

test("keeps missing and unresolved routes distinct", () => {
  const missing = fixture();
  missing.placements = missing.placements.map((entry, index) =>
    index === 0 ? { ...entry, evidence_selector: "absent" } : entry,
  );
  assert.equal(
    observeWorkflowContinuation(missing).diagnostic,
    "AOP_WF_CONTINUATION_PLACEMENT_MISSING",
  );
  const blocked = fixture();
  blocked.placements = blocked.placements.map((entry, index) =>
    index === 2
      ? {
          ...entry,
          applicability: "owner-blocked" as const,
          placement: "owner-blocked" as const,
        }
      : entry,
  );
  assert.equal(observeWorkflowContinuation(blocked).result, "owner-blocked");
});
