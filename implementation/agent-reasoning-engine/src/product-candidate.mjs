import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  sha256Hex,
  sha256HexText,
} from "../packages/intent-route-resolver/index.mjs";
import {inspectProduct, materializeProductClosure, productRoot, repositoryRoot} from "./product.mjs";

export const PRODUCT_CANDIDATE_ID = "ARE-PRODUCT-CANDIDATE-008";
export const PRODUCT_CANDIDATE_PATH = resolve(productRoot, "evidence/product-candidate.008.json");
export const PRODUCT_TEST_RECEIPT_PATH = resolve(productRoot, "evidence/product-test-receipt.008.json");
export const FAILURE_LEARNING_CANARY_PATH = resolve(productRoot, "evidence/failure-learning-canary.008.json");

function digest(value) {
  return sha256HexText(canonicalJson(value));
}

function bytesDigest(bytes) {
  return sha256Hex(new Uint8Array(bytes));
}

function sealed(material, digestField) {
  const canonical = canonicalizeJson(material);
  return deepFreeze(canonicalizeJson({...canonical, [digestField]: digest(canonical)}));
}

function without(record, key) {
  const copy = {...record};
  delete copy[key];
  return copy;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function repositoryPath(path) {
  const relative = resolve(path).slice(repositoryRoot.length + 1).replaceAll("\\", "/");
  return relative.startsWith("../") ? resolve(path).replaceAll("\\", "/") : relative;
}

export function materializeProductCandidate() {
  const profilePath = resolve(productRoot, "product.json");
  const profileBytes = readFileSync(profilePath);
  const profile = JSON.parse(profileBytes.toString("utf8"));
  const closure = materializeProductClosure();
  return sealed({
    schema_version: "are.integrated-product-candidate/v1",
    candidate_id: PRODUCT_CANDIDATE_ID,
    status: "frozen-testable-candidate",
    content_model: "content-addressed-without-wall-clock",
    product: {
      product_id: profile.product_id,
      version: profile.version,
      profile_path: repositoryPath(profilePath),
      profile_bytes_sha256: bytesDigest(profileBytes),
      node_runtime: profile.node_runtime,
    },
    source_closure: closure,
    construction: {
      lane: "product-construction",
      frontier: "exact-testable-product-candidate",
      runnable_now: ["verify-current-source-closure", "bind-current-product-tests", "bind-failure-learning-canary"],
      causal_blockers: [],
      operational_support: [
        {task: "commit", owner: "product-owner", affected_stage: "none", disposition: "deferred"},
        {task: "push", owner: "product-owner", affected_stage: "none", disposition: "deferred"},
      ],
    },
    product_approval: {status: "not-requested", owner: "product-owner", bound_digest: null},
    claim_limit: "This record freezes one testable product candidate. It grants no product approval, authority, admission, activation, publication, release, deployment, commit, or push.",
    authority_effect: "none",
  }, "candidate_digest");
}

export function verifyProductCandidate(candidate, options = {}) {
  const reasons = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) reasons.push("candidate.record-required");
  else {
    if (candidate.schema_version !== "are.integrated-product-candidate/v1") reasons.push("candidate.schema-version-invalid");
    if (candidate.candidate_id !== PRODUCT_CANDIDATE_ID) reasons.push("candidate.identity-invalid");
    if (candidate.status !== "frozen-testable-candidate") reasons.push("candidate.status-invalid");
    if (candidate.authority_effect !== "none") reasons.push("candidate.authority-effect-invalid");
    if (candidate.product_approval?.status !== "not-requested") reasons.push("candidate.approval-state-invalid");
    if (candidate.candidate_digest !== digest(without(candidate, "candidate_digest"))) reasons.push("candidate.digest-invalid");
    if (options.compare_current !== false) {
      const current = materializeProductCandidate();
      if (candidate.candidate_digest !== current.candidate_digest) reasons.push("candidate.current-source-closure-mismatch");
      if (candidate.source_closure?.closure_digest !== current.source_closure.closure_digest) reasons.push("candidate.source-closure-drift");
    }
  }
  return deepFreeze({
    schema_version: "are.product-candidate-verification/v1",
    status: reasons.length === 0 ? "PASS" : "BLOCK",
    candidate_id: candidate?.candidate_id ?? null,
    candidate_digest: candidate?.candidate_digest ?? null,
    reason_codes: unique(reasons),
    authority_effect: "none",
  });
}

export function projectProductTestResult(result) {
  if (!result || result.schema_version !== "are.product-test-result/v1") throw new TypeError("A product test result is required.");
  return sealed({
    schema_version: "are.product-test-evidence/v1",
    status: result.status,
    product_id: result.product_id ?? null,
    product_version: result.product_version ?? null,
    total_test_cases: result.total_test_cases ?? 0,
    targets: (result.results ?? []).map((entry) => ({
      target: repositoryPath(entry.target),
      test_files: entry.test_files,
      test_cases: entry.test_cases,
      status: entry.status,
    })).sort((left, right) => left.target.localeCompare(right.target)),
    volatile_fields_excluded: ["elapsed_ms"],
    authority_effect: "none",
  }, "evidence_digest");
}

export function materializeFailureLearningCanaryEvidence(result) {
  if (!result || result.schema_version !== "are.failure-learning-canary-result/v1") throw new TypeError("A failure-learning canary result is required.");
  const baselineStale = result.baseline?.metrics?.stale_reuse_incidents;
  const treatmentStale = result.treatment?.metrics?.stale_reuse_incidents;
  return sealed({
    schema_version: "are.failure-learning-canary-evidence/v1",
    source_schema: result.schema_version,
    mode: result.mode,
    status: result.status,
    baseline: {status: result.baseline?.status ?? null, stale_reuse_incidents: baselineStale ?? null},
    treatment: {status: result.treatment?.status ?? null, stale_reuse_incidents: treatmentStale ?? null},
    holdout: {status: result.holdout?.status ?? null},
    hypothesis_ref: result.hypothesis?.record_id ?? null,
    implementation_pattern: result.hypothesis?.implementation_pattern ?? null,
    variant_ref: result.variant?.record_id ?? null,
    comparison_ref: result.comparison?.record_id ?? null,
    comparison_outcome: result.comparison?.outcome ?? null,
    learning_decision_ref: result.learning_decision?.record_id ?? null,
    learning_disposition: result.learning_decision?.disposition ?? null,
    retained_epoch_digest: result.retained_learning?.epoch?.epoch_digest ?? null,
    provider_cache_posture: result.provider_cache_telemetry?.disposition ?? "unobserved",
    source_projection_digest: digest({
      baseline_status: result.baseline?.status ?? null,
      baseline_stale_reuse_incidents: baselineStale ?? null,
      treatment_status: result.treatment?.status ?? null,
      treatment_stale_reuse_incidents: treatmentStale ?? null,
      holdout_status: result.holdout?.status ?? null,
      hypothesis_ref: result.hypothesis?.record_id ?? null,
      variant_ref: result.variant?.record_id ?? null,
      comparison_ref: result.comparison?.record_id ?? null,
      comparison_outcome: result.comparison?.outcome ?? null,
      learning_decision_ref: result.learning_decision?.record_id ?? null,
      learning_disposition: result.learning_decision?.disposition ?? null,
      retained_epoch_digest: result.retained_learning?.epoch?.epoch_digest ?? null,
    }),
    claim_limit: "This compact record proves only the selected deterministic canary observations. Provider cache use remains unobserved.",
    authority_effect: "none",
  }, "evidence_digest");
}

export function verifyFailureLearningCanaryEvidence(evidence) {
  const reasons = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) reasons.push("canary-evidence.record-required");
  else {
    if (evidence.schema_version !== "are.failure-learning-canary-evidence/v1") reasons.push("canary-evidence.schema-version-invalid");
    if (evidence.evidence_digest !== digest(without(evidence, "evidence_digest"))) reasons.push("canary-evidence.digest-invalid");
    if (evidence.status !== "KEEP") reasons.push("canary-evidence.comparison-not-kept");
    if (evidence.baseline?.status !== "FAIL" || !(evidence.baseline?.stale_reuse_incidents > 0)) reasons.push("canary-evidence.baseline-did-not-expose-failure");
    if (evidence.treatment?.status !== "PASS" || evidence.treatment?.stale_reuse_incidents !== 0) reasons.push("canary-evidence.treatment-not-clean");
    if (evidence.holdout?.status !== "PASS") reasons.push("canary-evidence.holdout-failed");
    if (evidence.comparison_outcome !== "KEEP") reasons.push("canary-evidence.outcome-invalid");
    if (evidence.learning_disposition !== "candidate-supported") reasons.push("canary-evidence.learning-not-supported");
    if (evidence.authority_effect !== "none") reasons.push("canary-evidence.authority-effect-invalid");
  }
  return deepFreeze({
    schema_version: "are.failure-learning-canary-verification/v1",
    status: reasons.length === 0 ? "PASS" : "BLOCK",
    evidence_digest: evidence?.evidence_digest ?? null,
    reason_codes: unique(reasons),
    authority_effect: "none",
  });
}

export function materializeProductTestReceipt(input) {
  const candidate = input.candidate;
  const testEvidence = input.test_evidence;
  const canaryEvidence = input.canary_evidence;
  const candidateVerification = verifyProductCandidate(candidate);
  const canaryVerification = verifyFailureLearningCanaryEvidence(canaryEvidence);
  const health = inspectProduct({require_exact_runtime: true});
  const reasons = [...candidateVerification.reason_codes, ...canaryVerification.reason_codes];
  if (testEvidence?.schema_version !== "are.product-test-evidence/v1") reasons.push("product-tests.evidence-invalid");
  else {
    if (testEvidence.evidence_digest !== digest(without(testEvidence, "evidence_digest"))) reasons.push("product-tests.digest-invalid");
    if (testEvidence.status !== "PASS") reasons.push("product-tests.failed");
    if (!(testEvidence.total_test_cases > 0)) reasons.push("product-tests.empty");
    if (testEvidence.targets.some((target) => target.status !== "PASS")) reasons.push("product-tests.target-failed");
  }
  if (health.status !== "PASS") reasons.push(...health.reason_codes.map((reason) => `product-health.${reason}`));
  if (health.source_closure.closure_digest !== candidate?.source_closure?.closure_digest) reasons.push("product-health.source-closure-mismatch");
  const status = reasons.length === 0 ? "PASS" : "BLOCK";
  return sealed({
    schema_version: "are.integrated-product-test-receipt/v1",
    receipt_id: "ARE-PRODUCT-TEST-RECEIPT-008",
    status,
    candidate_binding: {
      candidate_id: candidate?.candidate_id ?? null,
      candidate_digest: candidate?.candidate_digest ?? null,
      candidate_bytes_sha256: input.candidate_bytes ? bytesDigest(input.candidate_bytes) : null,
      source_closure_digest: candidate?.source_closure?.closure_digest ?? null,
    },
    product_test_evidence: testEvidence ?? null,
    failure_learning_canary_binding: {
      evidence_digest: canaryEvidence?.evidence_digest ?? null,
      evidence_bytes_sha256: input.canary_evidence_bytes ? bytesDigest(input.canary_evidence_bytes) : null,
    },
    product_health: {
      status: health.status,
      product_id: health.product_id,
      product_version: health.product_version,
      node: health.node,
      source_closure: health.source_closure,
    },
    reason_codes: unique(reasons),
    product_approval: {status: "not-requested", owner: "product-owner", bound_digest: null},
    claim_limit: "PASS proves the current candidate bytes passed the recorded product suite and failure-learning canary. It grants no product approval, authority, admission, activation, publication, release, deployment, commit, or push.",
    authority_effect: "none",
  }, "receipt_digest");
}

export function verifyProductTestReceipt(receipt, input = {}) {
  const reasons = [];
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) reasons.push("product-receipt.record-required");
  else {
    if (receipt.schema_version !== "are.integrated-product-test-receipt/v1") reasons.push("product-receipt.schema-version-invalid");
    if (receipt.receipt_digest !== digest(without(receipt, "receipt_digest"))) reasons.push("product-receipt.digest-invalid");
    if (receipt.status !== "PASS") reasons.push("product-receipt.not-pass");
    if (receipt.product_approval?.status !== "not-requested") reasons.push("product-receipt.approval-state-invalid");
    if (receipt.authority_effect !== "none") reasons.push("product-receipt.authority-effect-invalid");
    if (input.candidate) {
      const verified = verifyProductCandidate(input.candidate);
      reasons.push(...verified.reason_codes);
      if (receipt.candidate_binding?.candidate_digest !== input.candidate.candidate_digest) reasons.push("product-receipt.candidate-binding-mismatch");
    }
    if (input.candidate_bytes && receipt.candidate_binding?.candidate_bytes_sha256 !== bytesDigest(input.candidate_bytes)) reasons.push("product-receipt.candidate-bytes-mismatch");
    if (input.canary_evidence) {
      const verified = verifyFailureLearningCanaryEvidence(input.canary_evidence);
      reasons.push(...verified.reason_codes);
      if (receipt.failure_learning_canary_binding?.evidence_digest !== input.canary_evidence.evidence_digest) reasons.push("product-receipt.canary-binding-mismatch");
    }
    if (input.canary_evidence_bytes && receipt.failure_learning_canary_binding?.evidence_bytes_sha256 !== bytesDigest(input.canary_evidence_bytes)) reasons.push("product-receipt.canary-bytes-mismatch");
  }
  return deepFreeze({
    schema_version: "are.product-test-receipt-verification/v1",
    status: reasons.length === 0 ? "PASS" : "BLOCK",
    receipt_digest: receipt?.receipt_digest ?? null,
    reason_codes: unique(reasons),
    authority_effect: "none",
  });
}

export function inspectFrozenProductCandidate(options = {}) {
  const candidatePath = resolve(options.candidate_path ?? PRODUCT_CANDIDATE_PATH);
  const receiptPath = resolve(options.receipt_path ?? PRODUCT_TEST_RECEIPT_PATH);
  const canaryPath = resolve(options.canary_path ?? FAILURE_LEARNING_CANARY_PATH);
  try {
    const candidateBytes = readFileSync(candidatePath);
    const receiptBytes = readFileSync(receiptPath);
    const canaryBytes = readFileSync(canaryPath);
    const candidate = JSON.parse(candidateBytes.toString("utf8"));
    const receipt = JSON.parse(receiptBytes.toString("utf8"));
    const canary = JSON.parse(canaryBytes.toString("utf8"));
    const candidateVerification = verifyProductCandidate(candidate);
    const receiptVerification = verifyProductTestReceipt(receipt, {
      candidate,
      candidate_bytes: candidateBytes,
      canary_evidence: canary,
      canary_evidence_bytes: canaryBytes,
    });
    const reasons = unique([...candidateVerification.reason_codes, ...receiptVerification.reason_codes]);
    return deepFreeze({
      schema_version: "are.frozen-product-candidate-inspection/v1",
      status: reasons.length === 0 ? "PASS" : "BLOCK",
      candidate: {candidate_id: candidate.candidate_id, candidate_digest: candidate.candidate_digest, source_closure_digest: candidate.source_closure?.closure_digest ?? null, path: repositoryPath(candidatePath)},
      tests: {receipt_digest: receipt.receipt_digest, total_test_cases: receipt.product_test_evidence?.total_test_cases ?? null, path: repositoryPath(receiptPath)},
      canary: {evidence_digest: canary.evidence_digest, comparison_outcome: canary.comparison_outcome, learning_disposition: canary.learning_disposition, path: repositoryPath(canaryPath)},
      product_approval: receipt.product_approval,
      reason_codes: reasons,
      authority_effect: "none",
    });
  } catch (error) {
    return deepFreeze({
      schema_version: "are.frozen-product-candidate-inspection/v1",
      status: "BLOCK",
      reason_codes: [error?.code === "ENOENT" ? "product-candidate.evidence-missing" : "product-candidate.evidence-invalid"],
      detail: String(error?.message ?? error),
      authority_effect: "none",
    });
  }
}
