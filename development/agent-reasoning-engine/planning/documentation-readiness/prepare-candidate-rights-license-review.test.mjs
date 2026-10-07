#!/usr/bin/env node

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const script = resolve(import.meta.dirname, "prepare-candidate-rights-license-review.mjs");
const docsRoot = resolve(repositoryRoot, "implementation/agent-reasoning-engine/docs");

test("Candidate 020 rights and license package is deterministic and remains non-authoritative", () => {
  const result = spawnSync(process.execPath, [script, "--check"], {encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "PASS");
  assert.equal(receipt.candidate_id, "ARE-PRODUCT-CANDIDATE-020");
  assert.equal(receipt.file_count, 988);
  assert.equal(receipt.qualified_review_status, "REQUIRED");
});

test("Candidate 020 records do not rewrite Candidate 018 bindings", () => {
  const historicalInventory = JSON.parse(readFileSync(resolve(docsRoot, "source-rights-inventory.json"), "utf8"));
  const currentInventory = JSON.parse(readFileSync(resolve(docsRoot, "source-rights-inventory.candidate-020.json"), "utf8"));
  assert.equal(historicalInventory.applies_to.candidate_id, "ARE-PRODUCT-CANDIDATE-018");
  assert.equal(currentInventory.applies_to.candidate_id, "ARE-PRODUCT-CANDIDATE-020");
  assert.notEqual(historicalInventory.applies_to.source_closure_digest, currentInventory.applies_to.source_closure_digest);
});

test("handoff expressly leaves legal and rights decisions to qualified review", () => {
  const handoff = readFileSync(resolve(docsRoot, "releases/0.10.0-rc.1-rights-license-review-handoff.md"), "utf8");
  assert.match(handoff, /QUALIFIED REVIEW REQUIRED/u);
  assert.match(handoff, /not legal advice/u);
  assert.match(handoff, /Open Questions/u);
});

test("reviewer nomination remains incomplete until identity and qualification inputs exist", () => {
  const assignment = JSON.parse(readFileSync(resolve(docsRoot, "releases/0.10.0-rc.1-rights-license-review-assignment.json"), "utf8"));
  assert.equal(assignment.status, "INTERNAL_ENGINEERING_REVIEW_ACCEPTED_LEGAL_REVIEWER_UNASSIGNED");
  assert.deepEqual(assignment.reviewers.map(reviewer => reviewer.recorded_identity), ["Vladimir Rondelli", "Dave"]);
  assert.equal(assignment.reviewers[0].qualification_basis.capacity, "PRODUCT_OWNER_AND_DIRECT_MAINTAINER");
  assert.equal(assignment.reviewers[0].qualification_basis.legal_qualification_asserted, false);
  assert.equal(assignment.reviewers[1].identity_status, "DISPLAY_NAME_ONLY_BY_OWNER_DECISION");
  assert.equal(assignment.reviewers[1].identity_decision.selected_option, "B");
  assert.equal(assignment.reviewers[1].qualification_basis.capacity, "TRUSTED_TECHNICAL_REVIEWER");
  assert.equal(assignment.reviewers[1].qualification_basis.legal_qualification_asserted, false);
  assert.equal(assignment.reviewers[0].conflict_and_independence_disclosure.posture, "NOT_INDEPENDENT_PRODUCT_OWNER");
  assert.equal(assignment.reviewers[1].conflict_and_independence_disclosure.posture, "INDEPENDENCE_NOT_ESTABLISHED");
  assert.equal(assignment.independence_decision.review_posture, "INTERNAL_ENGINEERING_REVIEW_ONLY");
  assert.equal(assignment.independence_decision.independent_review_claimed, false);
  assert.equal(assignment.reviewers[0].review_status, "ACCEPTED_INTERNAL_ENGINEERING_DISPOSITION");
  assert.equal(assignment.reviewers[0].review_disposition.source_family_count, 137);
  assert.equal(assignment.reviewers[0].review_disposition.result, "ACCEPTED");
  assert.equal(assignment.reviewers[1].review_status, "ACCEPTED_INTERNAL_ENGINEERING_DISPOSITION");
  assert.equal(assignment.reviewers[1].review_disposition.attestation_source, "USER_RELAYED_DAVE_CONFIRMATION");
  assert.equal(assignment.reviewers[1].review_disposition.direct_signed_attestation, false);
  assert.equal(assignment.internal_engineering_review_status, "ACCEPTED_BY_BOTH_DESIGNATED_REVIEWERS");
  assert.equal(assignment.legal_review_path.disposition, "DEFERRED_BLOCKING");
  assert.equal(assignment.legal_review_path.non_legal_readiness_work_may_continue, true);
  assert.equal(assignment.legal_review_path.legal_gate_bypass_allowed, false);
  assert.deepEqual(assignment.reviewers[0].roles, ["product reviewer", "source-rights reviewer"]);
  assert.equal(assignment.capacity_decision.selected_option, "A");
  assert.equal(assignment.capacity_decision.qualified_legal_reviewer, null);
  assert.equal(assignment.completion_status, "NOT_COMPLETE");
});
