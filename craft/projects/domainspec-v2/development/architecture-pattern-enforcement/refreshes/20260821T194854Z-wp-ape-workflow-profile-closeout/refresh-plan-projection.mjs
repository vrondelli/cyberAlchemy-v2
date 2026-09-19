#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const candidateRoot = path.join(
  repoRoot,
  "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs/candidates",
);
const manifestPath = path.join(candidateRoot, "SWU-MANIFEST.json");
const verificationPath = path.join(
  repoRoot,
  "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-WF-PROFILE-001/WORK-PACK-VERIFICATION.json",
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const verification = JSON.parse(fs.readFileSync(verificationPath, "utf8"));
const workflow = manifest.work_packs.find(
  (workPack) => workPack.work_pack_id === "WP-APE-WF-PROFILE-001",
);

if (!workflow || workflow.swus.length !== 11) {
  throw new Error("Expected the exact eleven-SWU Workflow work pack");
}
if (
  verification.work_pack_id !== workflow.work_pack_id ||
  verification.result !== "pass" ||
  verification.terminal_receipts.length !== workflow.swus.length ||
  verification.closeout_receipts.length !== workflow.swus.length
) {
  throw new Error("Workflow verification does not match the manifest frontier");
}

const terminalBySwu = new Map(
  verification.terminal_receipts.map((reference) => [
    path.basename(reference.path, "-terminal-source.json"),
    reference,
  ]),
);
const closeoutBySwu = new Map(
  verification.closeout_receipts.map((reference) => [
    path.basename(reference.path, "-closeout.json"),
    reference,
  ]),
);

manifest.generated_at = "2026-08-21T19:48:54Z";
manifest.status = "operation-and-workflow-prototypes-closed-candidate-local";
manifest.selected_swu = null;
manifest.first_candidate_swu = null;
manifest.first_unit_narrowness = "terminal-no-swu-selectable";
manifest.evidence_lane_admission.current_predecessor_availability.Workflow =
  "candidate-local Workflow RMT predecessor is available and exact candidate/receipt bindings are preserved by the Work Pack B execution entry";
manifest.validation_admission_contract = {
  applies_to: "work_packs[1].swus[*]",
  state: "satisfied-candidate-local",
  blocker: null,
  resolved_blocker: "R-08-for-candidate-local-work-pack-validation-only",
  resolution:
    "The exact Workflow executable, version, argv, cwd, fixture, diagnostic, and failure-status-propagation contract passed against the staged-equivalent product bytes.",
  validation_contract_ref: verification.precloseout_validation_ref,
  prototype_validation_ref: verification.prototype_validation_ref,
  verification_receipt_ref: {
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-WF-PROFILE-001/WORK-PACK-VERIFICATION.json",
    sha256: "6076df2ac279816b246994d52cf6b6ac148fbcb5545a95fa0108447ba69f84df",
    size_bytes: 13812,
  },
  workflow_tests: "40/40",
  operation_workflow_recomposition: "140/140",
  strict_typescript: "pass",
  selected_subject_result: "incomplete",
  primary_finding: "AOP_WF_COMPENSATION_CALLABLE_MISSING",
  synchronized_task_session_closeout: false,
  canonical_closeout: false,
  profile_admitted: false,
  authority_effect: "none",
  claim_effect:
    "Both work packs are terminally closed at the candidate-local prototype ceiling; no SWU is selectable and no admission, authority, publication, release, deployment, or production claim follows.",
};

workflow.frontier_state = "closed-candidate-local-with-findings";
for (const swu of workflow.swus) {
  const terminalSource = terminalBySwu.get(swu.swu_id);
  const closeout = closeoutBySwu.get(swu.swu_id);
  if (!terminalSource || !closeout) {
    throw new Error(`${swu.swu_id}: exact terminal or closeout receipt is missing`);
  }
  swu.handoff_status = "closed-candidate-local";
  swu.blockers = [];
  swu.validation_surface[0] =
    `execution-bound:${swu.swu_id}:exact Node v22.13.0 / tsx v4.23.12 / TypeScript 5.9.3 commands and failure-status propagation are bound by ${verification.precloseout_validation_ref.path}`;
  swu.closure_evidence = {
    result: "pass",
    terminal_source_receipt: terminalSource,
    closeout_receipt: closeout,
    source_report: verification.prototype_validation_ref,
    validation_contract_ref: verification.precloseout_validation_ref,
    selected_subject_result: verification.selected_subject_evaluation.result,
    primary_finding: verification.selected_subject_evaluation.primary_finding,
    synchronized_task_session_closeout: false,
    canonical_closeout: false,
    profile_admitted: false,
    authority_effect: "none",
  };
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const validatorRelative =
  "projects/domainspec-v2/development/refinement-runs/20260820T193401Z-ape-operation-workflow-realization-work-packs/candidates/validate-plan-consistency.mjs";
const validatorPath = path.join(repoRoot, validatorRelative);
const validation = spawnSync(process.execPath, [validatorPath], {
  cwd: repoRoot,
  encoding: "utf8",
});
if (validation.status !== 0) {
  process.stderr.write(validation.stderr);
  process.stdout.write(validation.stdout);
  process.exit(validation.status ?? 1);
}
const validationOutput = JSON.parse(validation.stdout);
if (validationOutput.status !== "pass") {
  throw new Error("Plan validator exited zero without a pass result");
}

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const exactFile = (filePath, repositoryPath) => ({
  path: repositoryPath,
  sha256: sha256(fs.readFileSync(filePath)),
  size_bytes: fs.statSync(filePath).size,
});
const planReceiptPath = path.join(candidateRoot, "PLAN-VALIDATION-RECEIPT.json");
const planReceipt = JSON.parse(fs.readFileSync(planReceiptPath, "utf8"));
const invocationId = "plan-consistency-workflow-terminal-refresh";
planReceipt.refresh_id = "20260821T194854Z-wp-ape-workflow-profile-closeout";
planReceipt.validated_at_utc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
planReceipt.status = "pass";
planReceipt.invocations = planReceipt.invocations.filter(
  (invocation) => invocation.id !== invocationId,
);
planReceipt.invocations.push({
  id: invocationId,
  argv: [process.execPath, validatorRelative],
  cwd: ".",
  exit_status: validation.status,
  stdout_sha256: sha256(validation.stdout),
  stderr_sha256: sha256(validation.stderr),
  validator: exactFile(validatorPath, validatorRelative),
  inputs: validationOutput.input_digests,
  output: validationOutput,
});
planReceipt.failed_validation_attempts = planReceipt.failed_validation_attempts.filter(
  (attempt) => attempt.attempt_id !== "workflow-terminal-refresh-stale-awf005-blocker-assertion",
);
planReceipt.failed_validation_attempts.push({
  attempt_id: "workflow-terminal-refresh-stale-awf005-blocker-assertion",
  exit_status: 1,
  classification: "governance-projection-validator",
  product_bytes_changed: false,
  diagnostic: "AWF-005 must retain R-04",
  disposition:
    "Preserved as failed; the stale blockers-array assertion was moved to the durable R-04 task-contract wording while closed SWUs retain empty blockers.",
});
planReceipt.failure_status_preservation =
  "The earlier TypeScript harness failure remains recorded as exit 2, and the first Workflow terminal projection replay remains recorded as exit 1. Neither is counted as acceptance or masked by the later exact pass.";
planReceipt.post_workflow_terminal_projection = {
  result: "pass",
  manifest_status: "operation-and-workflow-prototypes-closed-candidate-local",
  closed_operation_swus: 10,
  closed_workflow_swus: 11,
  blocked_workflow_swus: 0,
  workflow_terminal_receipts: 11,
  workflow_closeout_receipts: 11,
  workflow_rmt_predecessor: "available-candidate-local",
  workflow_entry_state: "terminal-locked-candidate-local",
  next_owner: "continuation-router:search-next-implementation",
  synchronized_task_session_closeout: false,
  profile_admitted: false,
  authority_effect: "none",
};
fs.writeFileSync(planReceiptPath, `${JSON.stringify(planReceipt, null, 2)}\n`);
