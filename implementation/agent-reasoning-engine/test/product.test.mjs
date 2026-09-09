import assert from "node:assert/strict";
import test from "node:test";

import {inspectProduct, materializeProductClosure} from "../src/product.mjs";
import {
  materializeFailureLearningCanaryEvidence,
  materializeProductCandidate,
  materializeProductTestReceipt,
  projectProductTestResult,
  verifyFailureLearningCanaryEvidence,
  verifyProductCandidate,
  verifyProductTestReceipt,
} from "../src/product-candidate.mjs";

test("integrated ARE product has an exact runtime, verified profile, and complete component closure", () => {
  const health = inspectProduct({require_exact_runtime: true});
  assert.equal(health.status, "PASS", health.reason_codes.join(","));
  assert.equal(health.node.exact_match, true);
  assert.equal(health.repository_profile.verified, true);
  assert.equal(health.components.length, 16);
  assert.equal(health.components.every((component) => component.present && component.package_name), true);
  assert.equal(health.integrations.every((integration) => integration.present), true);
  assert.equal(health.authority_effect, "none");
  const replay = materializeProductClosure();
  assert.equal(health.source_closure.closure_digest, replay.closure_digest);
  assert.equal(replay.files.length > 100, true);
  assert.equal(replay.files.some((entry) => entry.path.includes("/evidence/")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/runs/")), false);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-reasoning-engine/product.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-routing/capabilities/are-cli/request.schema.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-reasoning-engine/product-capability.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/ontology/product/nodes.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/capability/capability-references.json"), true);
});

test("integrated product candidate is deterministic, current, and non-authorizing", () => {
  const left = materializeProductCandidate();
  const right = materializeProductCandidate();
  assert.deepEqual(left, right);
  assert.equal(verifyProductCandidate(left).status, "PASS");
  assert.equal(left.product_approval.status, "not-requested");
  assert.equal(left.authority_effect, "none");
  assert.equal(left.construction.operational_support.every((entry) => entry.disposition === "deferred"), true);
});

function canaryFixture() {
  return {
    schema_version: "are.failure-learning-canary-result/v1",
    mode: "failure-learning-canary",
    status: "KEEP",
    baseline: {status: "FAIL", metrics: {stale_reuse_incidents: 5}},
    treatment: {status: "PASS", metrics: {stale_reuse_incidents: 0}},
    holdout: {status: "PASS"},
    hypothesis: {record_id: "hypothesis:1", implementation_pattern: "bind-refresh-assessment-before-cache-eligibility"},
    variant: {record_id: "variant:1"},
    comparison: {record_id: "comparison:1", outcome: "KEEP"},
    learning_decision: {record_id: "learning:1", disposition: "candidate-supported"},
    retained_learning: {epoch: {epoch_digest: "a".repeat(64)}},
    provider_cache_telemetry: {disposition: "unobserved"},
  };
}

test("test receipt binds stable product evidence and the failure-learning canary", () => {
  const candidate = materializeProductCandidate();
  const testEvidence = projectProductTestResult({
    schema_version: "are.product-test-result/v1",
    status: "PASS",
    product_id: candidate.product.product_id,
    product_version: candidate.product.version,
    total_test_cases: 2,
    results: [{target: new URL("..", import.meta.url).pathname, test_files: 1, test_cases: 2, status: "PASS", elapsed_ms: 19.8}],
  });
  assert.deepEqual(testEvidence.volatile_fields_excluded, ["elapsed_ms"]);
  const canary = materializeFailureLearningCanaryEvidence(canaryFixture());
  assert.equal(verifyFailureLearningCanaryEvidence(canary).status, "PASS");
  const candidateBytes = Buffer.from(`${JSON.stringify(candidate, null, 2)}\n`);
  const canaryBytes = Buffer.from(`${JSON.stringify(canary, null, 2)}\n`);
  const receipt = materializeProductTestReceipt({candidate, candidate_bytes: candidateBytes, test_evidence: testEvidence, canary_evidence: canary, canary_evidence_bytes: canaryBytes});
  assert.equal(receipt.status, "PASS", receipt.reason_codes.join(","));
  assert.equal(verifyProductTestReceipt(receipt, {candidate, candidate_bytes: candidateBytes, canary_evidence: canary, canary_evidence_bytes: canaryBytes}).status, "PASS");
  assert.equal(receipt.product_approval.status, "not-requested");
});

test("candidate and receipt verification fail closed on tampering", () => {
  const candidate = materializeProductCandidate();
  const tamperedCandidate = {...candidate, status: "approved"};
  assert.equal(verifyProductCandidate(tamperedCandidate, {compare_current: false}).status, "BLOCK");
  const canary = materializeFailureLearningCanaryEvidence(canaryFixture());
  const tamperedCanary = {...canary, treatment: {...canary.treatment, stale_reuse_incidents: 1}};
  assert.equal(verifyFailureLearningCanaryEvidence(tamperedCanary).status, "BLOCK");
});
