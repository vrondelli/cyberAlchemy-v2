import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { sealWorkflowModeDeclaration } from "./workflow-mode-discriminator.ts";
import { sealWorkflowGovernanceRecord } from "./workflow-runtime-observer.ts";
import {
  observeWorkflowVersion,
  type WorkflowVersionObserverInput,
} from "./workflow-version-observer.ts";

const SUBJECT = "Fixture.Workflow";
function lock(root: string, path: string) {
  const bytes = readFileSync(join(root, path));
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}
function mode(selected: "synchronous" | "durable") {
  return {
    subject_id: SUBJECT,
    declarations: [sealWorkflowModeDeclaration({
      schema_version: "ape.workflow-mode-declaration/v1",
      declaration_id: `mode.${selected}/v1`,
      subject_id: SUBJECT,
      mode: selected,
      basis_ref: "owner-decision:workflow-mode",
      owner: "workflow-profile:mode-owner",
      authority_effect: "none",
    })],
    authority_effect: "none" as const,
  };
}
function fixture(selected: "synchronous" | "durable" = "durable"): WorkflowVersionObserverInput {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-version-"));
  writeFileSync(join(repo_root, "workflow.ts"), "const workflowVersion = 'v2';", "utf8");
  return {
    repo_root,
    source: lock(repo_root, "workflow.ts"),
    subject_id: SUBJECT,
    mode_input: mode(selected),
    observation: selected === "durable" ? {
      observation_id: "version.fixture/v1",
      stored_progress_version: "v1",
      current_workflow_version: "v2",
      compatibility: "compatible",
      interface_ref: "WorkflowVersionRecord",
      source_selector: "workflowVersion",
      evidence_ref: "fixture:stored-progress",
    } : null,
    external_records: [],
    replay_or_migration_claims: [],
    provider_taxonomy: [],
    authority_effect: "none",
  };
}
function record(input: WorkflowVersionObserverInput, admitted: boolean) {
  return sealWorkflowGovernanceRecord({
    schema_version: "ape.workflow-external-governance-record/v1",
    record_id: "version.fixture/v1",
    concern_kind: "version",
    subject_id: SUBJECT,
    interface_ref: input.observation!.interface_ref,
    assertion_owner: "system-integration:workflow-version-owner",
    status: admitted ? "admitted" : "candidate",
    evidence_lane: admitted ? "canonical-governance" : "candidate-local-prototype",
    ceiling: "compatibility observation only",
    authority_effect: "none",
  });
}

test("makes stored-progress version evidence not-applicable for synchronous mode", () => {
  assert.equal(observeWorkflowVersion(fixture("synchronous")).result, "not-applicable");
});

test("keeps absent, unresolved, and candidate version evidence owner-blocked", () => {
  const missing = fixture();
  assert.equal(observeWorkflowVersion(missing).diagnostic, "AOP_WF_VERSION_EXTERNAL_RECORD_REQUIRED");
  const unresolved = fixture();
  unresolved.observation = { ...unresolved.observation!, compatibility: "unresolved" };
  assert.equal(observeWorkflowVersion(unresolved).diagnostic, "AOP_WF_VERSION_COMPATIBILITY_OWNER_BLOCKED");
  const candidate = fixture();
  candidate.external_records = [record(candidate, false)];
  assert.equal(observeWorkflowVersion(candidate).diagnostic, "AOP_WF_VERSION_EXTERNAL_RECORD_NOT_ADMITTED");
});

test("records canonical compatibility without replay or migration readiness", () => {
  const input = fixture();
  input.external_records = [record(input, true)];
  const result = observeWorkflowVersion(input);
  assert.equal(result.result, "pass");
  assert.equal(result.replay_readiness_claimed, false);
  assert.equal(result.migration_readiness_claimed, false);
});

test("rejects readiness overclaim and provider taxonomy", () => {
  const readiness = fixture();
  readiness.replay_or_migration_claims = ["replay-ready"];
  assert.equal(observeWorkflowVersion(readiness).diagnostic, "AOP_WF_VERSION_READINESS_OVERCLAIM");
  const provider = fixture();
  provider.provider_taxonomy = ["TemporalPatch"];
  assert.equal(observeWorkflowVersion(provider).diagnostic, "AOP_WF_VERSION_PROVIDER_TAXONOMY");
});
