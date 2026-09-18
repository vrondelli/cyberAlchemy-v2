#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const manifestPath = resolve(docsRoot, "release-manifest.json");
const receiptPath = resolve(docsRoot, "release-receipt.json");
const docsManifest = JSON.parse(readFileSync(resolve(docsRoot, "manifest.json"), "utf8"));
const product = JSON.parse(readFileSync(resolve(productRoot, "product.json"), "utf8"));
const candidateNumber = docsManifest.candidate_id?.match(/(\d+)$/u)?.[1];
const candidate = JSON.parse(readFileSync(resolve(productRoot, `evidence/product-candidate.${candidateNumber}.json`), "utf8"));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function selectedPaths() {
  const declared = docsManifest.documents.map(document => resolve(docsRoot, document));
  const infrastructure = [
    "README.md",
    "DOCUMENTATION.md",
    "RELEASE.md",
    "docs/manifest.json",
    "docs/reference/api-surface.json",
    "docs/reference/api-field-annotations.json",
    "docs/generate-api-reference.mjs",
    "docs/generate-api-reference.test.mjs",
    "docs/generate-candidate-history.mjs",
    "docs/generate-candidate-history.test.mjs",
    "docs/audit-candidate-artifact.mjs",
    "docs/audit-candidate-artifact.test.mjs",
    "docs/releases/candidate-history.json",
    "docs/releases/candidate-013-recovery-sources.json",
    "docs/releases/candidate-013-artifact-preflight.json",
    "docs/releases/0.10.0-self-contained-candidate.7-lifecycle-receipt.json",
    "docs/compatibility-matrix.json",
    "docs/compatibility-matrix-receipt.json",
    "docs/verify-compatibility-matrix.mjs",
    "docs/verify-compatibility-matrix.test.mjs",
    "docs/release-policy.json",
    "docs/release-policy-receipt.json",
    "docs/verify-release-policy.mjs",
    "docs/verify-release-policy.test.mjs",
    "docs/license-requirements.json",
    "docs/license-requirements-receipt.json",
    "docs/verify-license-requirements.mjs",
    "docs/verify-license-requirements.test.mjs",
    "docs/release-owner-decisions.json",
    "docs/release-owner-decisions-receipt.json",
    "docs/verify-release-owner-decisions.mjs",
    "docs/verify-release-owner-decisions.test.mjs",
    "docs/source-rights-inventory.json",
    "docs/source-rights-inventory-receipt.json",
    "docs/generate-source-rights-inventory.mjs",
    "docs/generate-source-rights-inventory.test.mjs",
    "docs/source-rights-review.json",
    "docs/verify-source-rights-review.mjs",
    "docs/verify-source-rights-review.test.mjs",
    "docs/commercial-successor-materialization-receipt.json",
    "docs/release-readiness.json",
    "docs/release-readiness-receipt.json",
    "docs/verify-release-readiness.mjs",
    "docs/verify-release-readiness.test.mjs",
    "docs/verify-docs.mjs",
    "docs/writing-style-policy.json",
    "docs/writing-style-review.json",
    "docs/lint-writing-style.mjs",
    "docs/lint-writing-style.test.mjs",
    "docs/verify-release-manifest.mjs",
    "../../development/agent-reasoning-engine/planning/documentation-readiness/verify-source-distribution-lifecycle.mjs",
    "../../development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.mjs",
    "../../development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.test.mjs",
    "../../development/agent-reasoning-engine/planning/documentation-readiness/materialize-commercial-successor.mjs",
    "../../development/agent-reasoning-engine/planning/documentation-readiness/materialize-commercial-successor.test.mjs",
  ].map(path => resolve(productRoot, path));
  return [...new Set([...declared, ...infrastructure])]
    .map(path => ({absolute: path, path: relative(productRoot, path).replaceAll("\\", "/")}))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function buildManifest() {
  const files = selectedPaths().map(item => {
    need(existsSync(item.absolute), `documentation-release.file-missing:${item.path}`);
    const bytes = readFileSync(item.absolute);
    return {path: item.path, bytes: bytes.length, sha256: sha256(bytes)};
  });
  return {
    schema_version: "are.documentation-release-manifest/v1",
    release_id: "ARE-DOCUMENTATION-CANDIDATE-002",
    lifecycle_status: "candidate-internal",
    product_id: product.product_id,
    product_version: product.version,
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    source_closure_digest: candidate.source_closure.closure_digest,
    review_date: "2026-09-17",
    selection_basis: "Every Markdown document in docs/manifest.json plus the product entry documents and documentation generators/verifiers.",
    files,
    exclusions: [
      "frozen Candidate 018 source closure, which excludes this separate manual",
      "research artifacts and benchmark run data",
      "publication, deployment, security-policy activation, SLO, and compliance decisions",
      "release-manifest.json and release-receipt.json to avoid recursive self-digests",
    ],
    authority_effect: "none",
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function runDocumentationChecks() {
  const apiTest = spawnSync(process.execPath, ["--test", "docs/generate-api-reference.test.mjs", "docs/generate-source-rights-inventory.test.mjs", "docs/lint-writing-style.test.mjs", "docs/verify-source-rights-review.test.mjs", "docs/verify-compatibility-matrix.test.mjs", "docs/verify-license-requirements.test.mjs", "docs/verify-release-owner-decisions.test.mjs", "docs/verify-release-policy.test.mjs", "docs/verify-release-readiness.test.mjs", "../../development/agent-reasoning-engine/planning/documentation-readiness/sign-source-distribution.test.mjs", "../../development/agent-reasoning-engine/planning/documentation-readiness/materialize-commercial-successor.test.mjs"], {cwd: productRoot, encoding: "utf8"});
  need(apiTest.status === 0, "documentation-release.api-generator-test-failed");
  const compatibilityCheck = spawnSync(process.execPath, ["docs/verify-compatibility-matrix.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(compatibilityCheck.status === 0, "documentation-release.compatibility-matrix-verification-failed");
  const releasePolicyCheck = spawnSync(process.execPath, ["docs/verify-release-policy.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(releasePolicyCheck.status === 0, "documentation-release.release-policy-verification-failed");
  const licenseRequirementsCheck = spawnSync(process.execPath, ["docs/verify-license-requirements.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(licenseRequirementsCheck.status === 0, "documentation-release.license-requirements-verification-failed");
  const ownerDecisionsCheck = spawnSync(process.execPath, ["docs/verify-release-owner-decisions.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(ownerDecisionsCheck.status === 0, "documentation-release.owner-decisions-verification-failed");
  const sourceRightsCheck = spawnSync(process.execPath, ["docs/generate-source-rights-inventory.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(sourceRightsCheck.status === 0, "documentation-release.source-rights-inventory-verification-failed");
  const sourceRightsReviewCheck = spawnSync(process.execPath, ["docs/verify-source-rights-review.mjs"], {cwd: productRoot, encoding: "utf8"});
  need(sourceRightsReviewCheck.status === 0, "documentation-release.source-rights-review-verification-failed");
  const readinessCheck = spawnSync(process.execPath, ["docs/verify-release-readiness.mjs", "--check"], {cwd: productRoot, encoding: "utf8"});
  need(readinessCheck.status === 0, "documentation-release.readiness-verification-failed");
  const docsCheck = spawnSync(process.execPath, ["docs/verify-docs.mjs"], {cwd: productRoot, encoding: "utf8"});
  need(docsCheck.status === 0, "documentation-release.documentation-verification-failed");
  const parsed = JSON.parse(docsCheck.stdout);
  need(parsed.status === "PASS", "documentation-release.documentation-status-failed");
  const writingStyleCheck = spawnSync(process.execPath, ["docs/lint-writing-style.mjs", "--check-review"], {cwd: productRoot, encoding: "utf8"});
  need(writingStyleCheck.status === 0, "documentation-release.writing-style-verification-failed");
  const writingStyle = JSON.parse(writingStyleCheck.stdout);
  need(writingStyle.status === "PASS", "documentation-release.writing-style-status-failed");
  const sensitivePatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /AKIA[0-9A-Z]{16}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
    /sk-[A-Za-z0-9]{20,}/u,
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/u,
  ];
  for (const item of selectedPaths().filter(item => item.path.endsWith(".md"))) {
    const source = readFileSync(item.absolute, "utf8");
    need(!sensitivePatterns.some(pattern => pattern.test(source)), `documentation-release.sensitive-pattern:${item.path}`);
  }
  return {
    api_reference_generator_test: "PASS",
    compatibility_matrix: "PASS",
    release_policy: "PASS",
    license_requirements: "PASS",
    release_owner_decisions: "PASS",
    source_rights_inventory: "PASS",
    source_rights_review: "PASS",
    commercial_successor_materialization: "PASS",
    artifact_signing_test: "PASS",
    release_readiness_ledger: "PASS",
    documentation_integrity: "PASS",
    writing_style: "PASS",
    documentation_sensitive_pattern_scan: "PASS",
    document_count: parsed.document_count,
  };
}

function buildReceipt(manifestBytes, checks) {
  return {
    schema_version: "are.documentation-release-receipt/v1",
    release_id: "ARE-DOCUMENTATION-CANDIDATE-002",
    status: "PASS",
    lifecycle_status: "candidate-internal",
    verified_on: "2026-09-17",
    release_manifest_sha256: sha256(manifestBytes),
    checks,
    claim_limit: "PASS proves deterministic API generation, manual structure, local links, lifecycle metadata, and selected documentation-byte digests. It grants no product approval, publication, deployment, policy activation, service commitment, or compliance conclusion.",
    authority_effect: "none",
  };
}

const [mode = "--check"] = process.argv.slice(2);
need(["--check", "--write"].includes(mode), "usage:verify-release-manifest [--check|--write]");
const manifestBytes = stableJson(buildManifest());
if (mode === "--write") {
  writeFileSync(manifestPath, manifestBytes);
  if (!existsSync(receiptPath)) writeFileSync(receiptPath, "{}\n");
}
const checks = runDocumentationChecks();
const receiptBytes = stableJson(buildReceipt(manifestBytes, checks));

if (mode === "--write") {
  writeFileSync(receiptPath, receiptBytes);
} else {
  need(existsSync(manifestPath), "documentation-release.manifest-missing");
  need(existsSync(receiptPath), "documentation-release.receipt-missing");
  need(readFileSync(manifestPath, "utf8") === manifestBytes, "documentation-release.manifest-drift");
  need(readFileSync(receiptPath, "utf8") === receiptBytes, "documentation-release.receipt-drift");
}

process.stdout.write(`${JSON.stringify({
  schema_version: "are.documentation-release-verification/v1",
  status: "PASS",
  mode,
  release_id: "ARE-DOCUMENTATION-CANDIDATE-002",
  selected_file_count: JSON.parse(manifestBytes).files.length,
  manifest_sha256: sha256(manifestBytes),
  authority_effect: "none",
}, null, 2)}\n`);
