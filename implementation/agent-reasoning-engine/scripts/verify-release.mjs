#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {basename, resolve} from "node:path";

import {inspectFrozenProductCandidate, PRODUCT_TEST_RECEIPT_PATH} from "../src/product-candidate.mjs";
import {inspectProduct, materializeProductClosure, PRODUCT_CLOSURE_LIMITS, productRoot, repositoryRoot} from "../src/product.mjs";
import {materializeProductTestPlan} from "../src/product-test-plan.mjs";

const packageManifest = JSON.parse(readFileSync(resolve(productRoot, "package.json"), "utf8"));
const productProfile = JSON.parse(readFileSync(resolve(productRoot, "product.json"), "utf8"));
const health = inspectProduct({require_exact_runtime: true});
const candidate = inspectFrozenProductCandidate();
const closure = materializeProductClosure();
const testPlan = materializeProductTestPlan();
const totalBytes = closure.files.reduce((sum, file) => sum + file.bytes, 0);
const reasonCodes = [];

if (health.status !== "PASS") reasonCodes.push(...health.reason_codes.map((code) => `health.${code}`));
if (candidate.status !== "PASS") reasonCodes.push(...candidate.reason_codes.map((code) => `candidate.${code}`));
if (packageManifest.version !== productProfile.version) reasonCodes.push("metadata.version-mismatch");
if (packageManifest.private !== true) reasonCodes.push("metadata.root-package-must-be-private");
if (closure.files.length >= PRODUCT_CLOSURE_LIMITS.maximum_files) reasonCodes.push("closure.file-limit-exceeded");
if (totalBytes >= PRODUCT_CLOSURE_LIMITS.maximum_bytes) reasonCodes.push("closure.byte-limit-exceeded");

const forbiddenSegments = [
  "/agent-reasoning-engine/research/",
  "/benchmarks/contextbench-v1/",
  "/benchmarks/external-context-v1/",
  "/benchmarks/glm-episodes-v1/",
  "/benchmarks/glm-fitting-v1/",
  "/packages/evolution-runtime/research/",
];
for (const file of closure.files) {
  if (forbiddenSegments.some((segment) => file.path.includes(segment))) {
    reasonCodes.push(`closure.non-product-source:${file.path}`);
  }
}

if (testPlan.unowned_test_files.length > 0) reasonCodes.push(...testPlan.unowned_test_files.map((path) => `tests.unowned:${path}`));
for (const component of health.components) {
  if (!testPlan.suites.some((suite) => suite.target_id === `component:${component.component_id}`)) reasonCodes.push(`tests.component-uncovered:${component.component_id}`);
}
for (const integration of health.integrations) {
  if (!testPlan.suites.some((suite) => suite.target_id === `integration:${integration.integration_id}`)) reasonCodes.push(`tests.integration-uncovered:${integration.integration_id}`);
}
if (!testPlan.suites.some((suite) => suite.target_id === "derived:module-port-governance-binding-rust" && suite.runner === "cargo-test")) reasonCodes.push("tests.rust-binding-uncovered");

let recordedTests = null;
try { recordedTests = JSON.parse(readFileSync(PRODUCT_TEST_RECEIPT_PATH, "utf8")).product_test_evidence; }
catch { reasonCodes.push("tests.receipt-unreadable"); }
if (recordedTests) {
  if (recordedTests.execution_mode !== "isolated-source-closure") reasonCodes.push("tests.not-isolated");
  if (recordedTests.source_closure_digest !== closure.closure_digest) reasonCodes.push("tests.closure-binding-mismatch");
  if (recordedTests.test_plan_digest !== testPlan.plan_digest) reasonCodes.push("tests.plan-binding-mismatch");
  const expected = [...new Set(testPlan.suites.flatMap((suite) => suite.test_refs))].sort();
  const observed = [...new Set(recordedTests.targets.flatMap((target) => target.test_paths ?? []))].sort();
  if (JSON.stringify(expected) !== JSON.stringify(observed)) reasonCodes.push("tests.file-coverage-mismatch");
}

for (const requiredPath of [
  "cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs",
  "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/lib.rs",
  "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64/are-module-port-governance-binding",
]) {
  if (!closure.files.some((file) => file.path === requiredPath)) reasonCodes.push(`closure.required-runtime-source-missing:${requiredPath}`);
}

const secretPatterns = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
  ["openai-key", /\bsk-[A-Za-z0-9_-]{32,}\b/u],
  ["github-token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/u],
  ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/u],
];
for (const file of closure.files) {
  const name = basename(file.path);
  if (name === ".env" || name === ".npmrc") reasonCodes.push(`security.sensitive-filename:${file.path}`);
  const bytes = readFileSync(resolve(repositoryRoot, file.path), "utf8");
  for (const [kind, pattern] of secretPatterns) {
    if (pattern.test(bytes)) reasonCodes.push(`security.${kind}:${file.path}`);
  }
}

const uniqueReasons = [...new Set(reasonCodes)].sort();
const result = {
  schema_version: "are.release-verification/v1",
  status: uniqueReasons.length === 0 ? "PASS" : "BLOCK",
  distribution: "private-repository-product-candidate",
  product_id: productProfile.product_id,
  product_version: productProfile.version,
  runtime: health.node,
  source_closure: {
    closure_digest: closure.closure_digest,
    file_count: closure.files.length,
    total_bytes: totalBytes,
  },
  components: {
    declared: health.components.length,
    test_covered: health.components.length - uniqueReasons.filter((code) => code.startsWith("tests.component-uncovered:")).length,
  },
  integrations: {
    declared: health.integrations.length,
    test_covered: health.integrations.length - uniqueReasons.filter((code) => code.startsWith("tests.integration-uncovered:")).length,
  },
  candidate: candidate.candidate ?? null,
  tests: candidate.tests ?? null,
  canary: candidate.canary ?? null,
  reason_codes: uniqueReasons,
  claim_limit: "PASS verifies the private repository candidate and its bound evidence. Publication, deployment, activation, and product approval remain separate actions.",
  authority_effect: "none",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "PASS") process.exitCode = 1;
