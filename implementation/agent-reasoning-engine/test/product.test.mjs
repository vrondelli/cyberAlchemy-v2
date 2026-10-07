import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {inspectProduct, materializeProductClosure, normalizeProductProfile, packagedProductPath, PRODUCT_CLOSURE_LIMITS, productRoot, projectRoot, resolveProductSourcePath, validateProductProfile} from "../src/product.mjs";
import {materializeCapabilityMatrix} from "../src/capability-matrix.mjs";
import {materializeProductTestPlan} from "../src/product-test-plan.mjs";
import {
  materializeFailureLearningCanaryEvidence,
  materializeProductCandidate,
  materializeProductTestReceipt,
  projectProductTestResult,
  verifyFailureLearningCanaryEvidence,
  verifyProductCandidate,
  verifyProductTestReceipt,
} from "../src/product-candidate.mjs";

test("logical product paths remain stable when the checkout has a different physical folder name", () => {
  assert.equal(packagedProductPath(productRoot), "cyberAlchemy-v2/implementation/agent-reasoning-engine");
  assert.equal(resolveProductSourcePath("cyberAlchemy-v2/implementation/agent-reasoning-engine/product.json"),
    resolve(productRoot, "product.json"));
  assert.equal(resolveProductSourcePath("implementation/agent-reasoning-engine/product.json"),
    resolve(productRoot, "product.json"));
  assert.throws(() => resolveProductSourcePath("../outside.json"), /product\.source-path-outside-project/u);
  assert.throws(() => packagedProductPath(resolve(projectRoot, "..")), /product\.source-path-outside-project/u);
});

test("minimum ARE Core has an exact runtime and excludes optional layers", () => {
  const health = inspectProduct({require_exact_runtime: true});
  assert.equal(health.status, "PASS", health.reason_codes.join(","));
  assert.equal(health.node.exact_match, true);
  assert.equal(health.repository_profile.verification, "owned-by-selected-component");
  assert.equal(health.components.length, 19);
  assert.equal(health.components.filter((component) => component.selected).every((component) => component.present && component.package_name), true);
  assert.equal(health.integrations.every((integration) => integration.present), true);
  assert.equal(health.authority_effect, "none");
  const replay = materializeProductClosure();
  assert.equal(health.source_closure.closure_digest, replay.closure_digest);
  assert.equal(replay.files.length > 100, true);
  const evidencePaths = replay.files.filter((entry) => entry.path.includes("/evidence/")).map((entry) => entry.path);
  assert.deepEqual(evidencePaths.filter((path) => !(
    path.startsWith("cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/evidence/")
    || path.startsWith("cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/evidence/")
    || path.startsWith("cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/generated/route-availability/evidence/")
    || path === "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/evidence/prompt-overhead-baseline.json"
  )), []);
  assert.equal(replay.files.some((entry) => entry.path.includes("/runs/")), false);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-reasoning-engine/product.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-routing/capabilities/are-cli/request.schema.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/implementation/agent-reasoning-engine/schemas/cli-request.schema.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/agent-reasoning-engine/product-capability.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/ontology/product/nodes.json"), true);
  assert.equal(replay.files.some((entry) => entry.path === "cyberAlchemy-v2/capability/capability-references.json"), true);
  assert.equal(replay.files.some((entry) => entry.path.includes("/agent-reasoning-engine/research/")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/benchmarks/contextbench-v1/")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/benchmarks/glm-episodes-v1/")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/packages/evolution-runtime/research/")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/packages/evolution-runtime/research-records/")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/are-mcp-server/src/server.mjs")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/dsh-gateway-backend-adapter/index.mjs")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/evolution-runtime/index.mjs")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/coding-agent-runtime/bin/live-demo.mjs")), false);
  assert.equal(replay.files.some((entry) => entry.path.includes("/implementation/cyberalchemy-tui/")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/request-decision-router/profiles/cyberalchemy-route-pack-v1.json")), true);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/module-port/index.mjs")), true);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/module-port/alch-semantic-adapter.mjs")), true);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/module-port/test/alch-semantic-adapter.test.mjs")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/module-port/test/alch-semantic-adapter-boundary.test.mjs")), true);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/module-port/native-semantic-adapter.mjs")), true);
  assert.equal(replay.files.some((entry) => entry.path.startsWith("domainspec-core/") || entry.path.includes("/language/capabilities/alchlang/")), false);
  for (const required of [
    "/goals/profile.json",
    "/authority/AUTHORITY-MODEL.md",
    "/ontology/governance/invariants.json",
    "/ontology/governance/rules.json",
    "/define/profile.json",
    "/agent-routing/routes.json",
    "/define/system-ontology/PROFILE.json",
    "/define/system-ontology/NODES.json",
    "/define/system-ontology/RELATIONS.json",
    "/define/definitions.json",
  ]) assert.equal(replay.files.some((entry) => entry.path.endsWith(required)), true, required);
  assert.equal(replay.files.some((entry) => entry.path.endsWith("/packages/conversation-runtime/index.mjs")), true);
  assert.equal(replay.files.some((entry) => entry.path.includes("/__pycache__/")), false);
  assert.equal(replay.files.some((entry) => entry.path.endsWith(".pyc")), false);
  assert.equal(replay.files.length < PRODUCT_CLOSURE_LIMITS.maximum_files, true, `release closure contains ${replay.files.length} files`);
  assert.equal(replay.files.reduce((sum, entry) => sum + entry.bytes, 0) < PRODUCT_CLOSURE_LIMITS.maximum_bytes, true, "release closure exceeds byte limit");
});

test("product profile v2 classifies every item and retains a bounded v1 compatibility parser", () => {
  const profile = JSON.parse(readFileSync(new URL("../product.json", import.meta.url), "utf8"));
  assert.equal(validateProductProfile(profile).status, "PASS");
  const ids = [...profile.components, ...profile.integrations].map((item) => item.component_id ?? item.integration_id);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(profile.components.filter((item) => item.layer === "core").every((item) => item.required && item.default_enabled && item.install_posture === "required"), true);
  const legacy = normalizeProductProfile({...profile, schema_version: "are.product-profile/v1", components: profile.components.map(({layer, maturity, default_enabled, install_posture, ...item}) => item), integrations: profile.integrations.map(({layer, maturity, default_enabled, install_posture, ...item}) => item)});
  assert.equal(legacy.compatibility_source_schema, "are.product-profile/v1");
  assert.equal(legacy.components.every((item) => item.layer === (item.required ? "core" : "extension")), true);
});

test("optional DSH closure is explicit and does not enter Core transitively", () => {
  const core = materializeProductClosure();
  const dsh = materializeProductClosure({include: ["dsh-gateway-backend-adapter", "codex-app-server-wrapper"]});
  assert.equal(core.selection.includes("dsh-gateway-backend-adapter"), false);
  assert.equal(dsh.selection.includes("dsh-gateway-backend-adapter"), true);
  assert.equal(dsh.files.some((entry) => entry.path.endsWith("/packages/dsh-gateway-backend-adapter/index.mjs")), true);
  assert.equal(dsh.files.some((entry) => entry.path.endsWith("/packages/dsh-gateway-backend-adapter/package-lock.json")), true);
  assert.deepEqual(dsh.install_contracts.map((contract) => contract.component_id), ["dsh-gateway-backend-adapter"]);
  assert.equal(dsh.install_contracts[0].network_policy, "operator-controlled-no-implicit-download");
});

test("Companion Evolution observer is packaged only in an explicit development closure", () => {
  const core = materializeProductClosure();
  const companion = materializeProductClosure({include: ["evolution-runtime"], development: true});
  const observer = "/packages/evolution-runtime/bin/observe.mjs";
  assert.equal(core.files.some((entry) => entry.path.endsWith(observer)), false);
  assert.equal(companion.files.some((entry) => entry.path.endsWith(observer)), true);
  assert.equal(companion.selection.includes("evolution-runtime"), true);
  assert.equal(companion.mode, "development");
});

test("capability matrix is derived only from the validated product profile", () => {
  const matrix = materializeCapabilityMatrix();
  assert.equal(matrix.rows.length, 21);
  assert.equal(matrix.rows.find((row) => row.id === "dsh-gateway-backend-adapter").layer, "extension");
  assert.equal(matrix.rows.find((row) => row.id === "evolution-runtime").install_posture, "development-only");
  assert.equal(matrix.authority_effect, "none");
});

test("Core product test plan covers every selected in-closure suite", () => {
  const plan = materializeProductTestPlan();
  assert.deepEqual(plan.unowned_test_files, []);
  assert.equal(plan.suites.some((suite) => suite.test_refs.some((path) => path.endsWith("/glm-flash-v1/test.mjs"))), false);
  assert.equal(plan.suites.some((suite) => suite.test_refs.some((path) => path.endsWith("/continuous-construction-task-loop/test/continuous-construction-adapter.test.mjs"))), false);
  assert.equal(plan.suites.some((suite) => suite.runner === "cargo-test"), false);
  assert.equal(plan.suites.some((suite) => suite.target_id === "integration:are-product-package" && suite.runner === "python-unittest" && suite.test_refs.some((path) => path.endsWith("/agent-reasoning-engine/tests/test_negative_mutations.py"))), true);
  assert.equal(plan.suites.some((suite) => suite.target_id === "component:conversation-runtime" && suite.test_refs.length === 4), true);
  assert.equal(plan.suites.some((suite) => suite.target_id === "component:are-mcp-server"), false);
  assert.equal(plan.suites.some((suite) => suite.target_id === "component:dsh-gateway-backend-adapter"), false);
  assert.equal(plan.suites.some((suite) => suite.test_refs.some((path) => path.includes("/evolution-runtime/research/"))), false);
});

test("package and product versions identify the same release candidate", () => {
  const root = new URL("..", import.meta.url).pathname;
  const packageManifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const productProfile = JSON.parse(readFileSync(resolve(root, "product.json"), "utf8"));
  assert.equal(packageManifest.version, productProfile.version);
  assert.equal(packageManifest.private, true);
});

test("selected wrapper test evidence remains packaged while runtime and research evidence stay excluded", () => {
  const closure = materializeProductClosure({include: ["codex-app-server-wrapper"]});
  assert.ok(closure.files.some(file => file.path.includes("/test/evidence/requirement-change-001.manifest.json")));
  assert.equal(closure.files.some(file => file.path.includes("/packages/evolution-runtime/evidence/")), false);
  assert.equal(closure.files.some(file => file.path.includes("/packages/evolution-runtime/research-records/")), false);
  assert.equal(closure.files.some(file => file.path.endsWith("/packages/evolution-runtime/test/benchmark-research-v1.test.mjs")), false);
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
  const plan = materializeProductTestPlan();
  const testEvidence = projectProductTestResult({
    schema_version: "are.product-test-result/v1",
    status: "PASS",
    product_id: candidate.product.product_id,
    product_version: candidate.product.version,
    source_closure_digest: candidate.source_closure.closure_digest,
    test_plan_digest: plan.plan_digest,
    execution_mode: "isolated-source-closure",
    total_test_files: plan.suites.reduce((sum, suite) => sum + suite.test_refs.length, 0),
    total_test_cases: plan.suites.length,
    results: plan.suites.map((suite) => ({target_ref: suite.target_ref, target_id: suite.target_id, runner: suite.runner, test_files: suite.test_refs.length, test_paths: suite.test_refs, test_cases: 1, status: "PASS", elapsed_ms: 19.8})),
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
