import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { sealWorkflowModeDeclaration } from "./workflow-mode-discriminator.ts";
import {
  observeWorkflowRuntime,
  sealWorkflowGovernanceRecord,
  type WorkflowRuntimeObserverInput,
} from "./workflow-runtime-observer.ts";

const SUBJECT = "Fixture.Workflow";
function lock(root: string, path: string) {
  const bytes = readFileSync(join(root, path));
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}
function mode(value: "synchronous" | "durable") {
  return {
    subject_id: SUBJECT,
    declarations: [sealWorkflowModeDeclaration({
      schema_version: "ape.workflow-mode-declaration/v1",
      declaration_id: `mode.${value}/v1`,
      subject_id: SUBJECT,
      mode: value,
      basis_ref: "owner-decision:workflow-mode",
      owner: "workflow-profile:mode-owner",
      authority_effect: "none",
    })],
    authority_effect: "none" as const,
  };
}
function fixture(selected: "synchronous" | "durable" = "durable"): WorkflowRuntimeObserverInput {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-runtime-"));
  writeFileSync(join(repo_root, "workflow.ts"), "WorkflowStore Checkpoint History Scheduler", "utf8");
  return {
    repo_root,
    source: lock(repo_root, "workflow.ts"),
    subject_id: SUBJECT,
    mode_input: mode(selected),
    capabilities: selected === "durable" ? [
      { role: "workflow-store", interface_ref: "WorkflowStore", source_selector: "WorkflowStore", supplied_at_composition_root: true },
      { role: "checkpoint", interface_ref: "Checkpoint", source_selector: "Checkpoint", supplied_at_composition_root: true },
      { role: "history", interface_ref: "History", source_selector: "History", supplied_at_composition_root: true },
      { role: "scheduler", interface_ref: "Scheduler", source_selector: "Scheduler", supplied_at_composition_root: true },
    ] : [],
    external_records: [],
    runtime_guarantee_claims: [],
    provider_taxonomy: [],
    authority_effect: "none",
  };
}
function records(input: WorkflowRuntimeObserverInput, admitted: boolean) {
  return input.capabilities.map((capability) => sealWorkflowGovernanceRecord({
    schema_version: "ape.workflow-external-governance-record/v1",
    record_id: `runtime.${capability.role}/v1`,
    concern_kind: "workflow-runtime",
    subject_id: SUBJECT,
    interface_ref: capability.interface_ref,
    assertion_owner: "system-integration:workflow-runtime-owner",
    status: admitted ? "admitted" : "candidate",
    evidence_lane: admitted ? "canonical-governance" : "candidate-local-prototype",
    ceiling: "placement evidence only",
    authority_effect: "none",
  }));
}

test("makes durable runtime explicitly not-applicable for synchronous mode", () => {
  const result = observeWorkflowRuntime(fixture("synchronous"));
  assert.equal(result.result, "not-applicable");
  assert.equal(result.diagnostic, "AOP_WF_RUNTIME_NOT_APPLICABLE");
});

test("keeps missing and candidate durable records owner-blocked", () => {
  const missing = fixture();
  assert.equal(observeWorkflowRuntime(missing).diagnostic, "AOP_WF_RUNTIME_EXTERNAL_RECORD_REQUIRED");
  const candidate = fixture();
  candidate.external_records = records(candidate, false);
  assert.equal(observeWorkflowRuntime(candidate).diagnostic, "AOP_WF_RUNTIME_EXTERNAL_RECORD_NOT_ADMITTED");
});

test("passes exact canonical admitted records without synthesizing runtime guarantees", () => {
  const input = fixture();
  input.external_records = records(input, true);
  const result = observeWorkflowRuntime(input);
  assert.equal(result.result, "pass");
  assert.equal(result.joins.length, 4);
  assert.equal(result.replay_safety_claimed, false);
  assert.equal(result.runtime_guarantee_claimed, false);
});

test("rejects provider taxonomy, guarantees, and candidate self-admission", () => {
  const provider = fixture();
  provider.provider_taxonomy = ["TemporalActivity"];
  assert.equal(observeWorkflowRuntime(provider).diagnostic, "AOP_WF_RUNTIME_PROVIDER_TAXONOMY");
  const guarantee = fixture();
  guarantee.runtime_guarantee_claims = ["exactly-once"];
  assert.equal(observeWorkflowRuntime(guarantee).diagnostic, "AOP_WF_RUNTIME_GUARANTEE_OVERCLAIM");
  const self = fixture();
  self.external_records = records(self, true).map((record) => {
    const { record_sha256: _ignored, ...body } = record;
    return sealWorkflowGovernanceRecord({ ...body, assertion_owner: SUBJECT });
  });
  assert.equal(observeWorkflowRuntime(self).diagnostic, "AOP_WF_RUNTIME_SELF_ADMISSION");
});
