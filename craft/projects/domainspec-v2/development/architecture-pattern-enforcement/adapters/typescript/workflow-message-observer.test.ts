import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  observeWorkflowMessageBoundary,
  sealWorkflowMessagePlacement,
  type WorkflowMessageObserverInput,
} from "./workflow-message-observer.ts";
import { sealWorkflowGovernanceRecord } from "./workflow-runtime-observer.ts";

const SUBJECT = "Fixture.Workflow";
function lock(root: string, path: string) {
  const bytes = readFileSync(join(root, path));
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}
function fixture(kind: "none" | "direct-transporter" | "child-operation" = "direct-transporter"): WorkflowMessageObserverInput {
  const repo_root = mkdtempSync(join(tmpdir(), "awf-message-"));
  writeFileSync(join(repo_root, "workflow.ts"), "publishStep Transporter", "utf8");
  const none = kind === "none";
  return {
    repo_root,
    source: lock(repo_root, "workflow.ts"),
    subject_id: SUBJECT,
    placement: sealWorkflowMessagePlacement({
      schema_version: "ape.workflow-message-placement-declaration/v1",
      declaration_id: `message.${kind}/v1`,
      subject_id: SUBJECT,
      placement: kind,
      step_id: none ? null : "publish",
      interface_ref: none ? null : "SettlementTransporter",
      source_selector: "publishStep",
      basis_ref: "owner-decision:message-placement",
      owner: "workflow-profile:message-placement-owner",
      authority_effect: "none",
    }),
    stage_evidence: none ? [] : [
      { stage: "intent-observed", evidence_ref: "evidence:intent" },
      { stage: "send-attempt-observed", evidence_ref: "evidence:send" },
      { stage: "provider-accepted", evidence_ref: "evidence:accepted" },
      { stage: "delivered-or-redelivered", evidence_ref: "evidence:delivered" },
      { stage: "application-committed", evidence_ref: "evidence:commit" },
    ],
    external_records: [],
    collapsed_status_claimed: false,
    guarantee_claims: [],
    provider_taxonomy: [],
    authority_effect: "none",
  };
}
function records(input: WorkflowMessageObserverInput, admitted: boolean) {
  const concernKinds = ["transport", "transport", "delivery", "application-commit"] as const;
  return concernKinds.map((concern_kind, index) => sealWorkflowGovernanceRecord({
    schema_version: "ape.workflow-external-governance-record/v1",
    record_id: `message.${concern_kind}.${index}/v1`,
    concern_kind,
    subject_id: SUBJECT,
    interface_ref: "SettlementTransporter",
    assertion_owner: "system-integration:transport-delivery-owner",
    status: admitted ? "admitted" : "candidate",
    evidence_lane: admitted ? "canonical-governance" : "candidate-local-prototype",
    ceiling: "stage observation only",
    authority_effect: "none",
  }));
}

test("makes an explicitly absent Workflow-owned message step not-applicable", () => {
  const result = observeWorkflowMessageBoundary(fixture("none"));
  assert.equal(result.result, "not-applicable");
  assert.equal(result.diagnostic, "AOP_WF_MESSAGE_NOT_APPLICABLE");
});

test("keeps the five message stages distinct and blocks absent or candidate records", () => {
  const missing = fixture();
  const missingResult = observeWorkflowMessageBoundary(missing);
  assert.equal(missingResult.result, "owner-blocked");
  assert.equal(missingResult.stage_results.length, 5);
  const candidate = fixture();
  candidate.external_records = records(candidate, false);
  assert.equal(observeWorkflowMessageBoundary(candidate).diagnostic, "AOP_WF_MESSAGE_EXTERNAL_RECORD_NOT_ADMITTED");
});

test("passes exact canonical stages without inferring delivery guarantees", () => {
  const input = fixture();
  input.external_records = records(input, true);
  const result = observeWorkflowMessageBoundary(input);
  assert.equal(result.result, "pass");
  assert.equal(result.stage_results.length, 5);
  assert.equal(result.joins.length, 4);
  assert.equal(result.delivery_guarantee_claimed, false);
  assert.equal(result.exactly_once_claimed, false);
});

test("rejects collapsed stages and guarantee/provider overclaim", () => {
  const collapsed = fixture();
  collapsed.collapsed_status_claimed = true;
  assert.equal(observeWorkflowMessageBoundary(collapsed).diagnostic, "AOP_WF_MESSAGE_STAGE_COLLAPSE");
  const guarantee = fixture();
  guarantee.guarantee_claims = ["send means delivered"];
  assert.equal(observeWorkflowMessageBoundary(guarantee).diagnostic, "AOP_WF_MESSAGE_GUARANTEE_OVERCLAIM");
  const provider = fixture();
  provider.provider_taxonomy = ["KafkaTopic"];
  assert.equal(observeWorkflowMessageBoundary(provider).diagnostic, "AOP_WF_MESSAGE_PROVIDER_TAXONOMY");
});
