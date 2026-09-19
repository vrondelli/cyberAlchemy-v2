import {createHash} from "node:crypto";
import {readFile, lstat} from "node:fs/promises";
import {resolve} from "node:path";

const root = resolve(process.argv[2] ?? process.cwd());
const admissionPath =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/admission.json";
const inventoryPath =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/source-inventory.json";
const lifecycleReceiptPath =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/RECEIPT.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (code) => {
  throw Object.assign(new Error(code), {code});
};
const read = (path) => readFile(resolve(root, path));
const json = async (path) => JSON.parse((await read(path)).toString("utf8"));
const same = (actual, expected) =>
  JSON.stringify(actual) === JSON.stringify(expected);

const expectedSources = [
  ["rule_schema", "projects/domainspec-v2/impl/spec/meta-types/behavioral/rule.schema.yml", "b55f1321f519989c018d6e1330e02aa1797cad2763a07b6450945fb8c3109cc6", 857],
  ["rule_reuse_contract", "projects/domainspec-v2/impl/architecture-conformance/families/outcome-function/contracts/rule-contracts.ts", "3076af897b0c33be009e425dc94ec1170441418d1b50996591726c1eda6f2b35", 3593],
  ["rule_reuse_evaluator", "projects/domainspec-v2/impl/architecture-conformance/families/outcome-function/evaluator/evaluate-rule.ts", "4b77ef382d431c3f1b28f8a9786a23c24af1f96f9732e0fa01091fee4ca0498e", 4424],
  ["rule_reuse_typescript_provider", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/typescript-rule-v1.ts", "b59dd87d5db39363a64ed1070524747e1b8e59e6a49357b61c6bff4872ca92f6", 2477],
  ["rule_reuse_python_provider", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/python-rule-v1.ts", "48b07d1f5f766a5243aad9a67c97c78db4ca96fe0af7cc7e9adfbb7050c0e053", 4209],
  ["rule_reuse_rust_provider", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rust-rule-v1.ts", "c1760b6ea7e76bc191913d22a61e0eddae4b97fecc5b076c47b2ee99573b0324", 4869],
  ["rule_reuse_parity_provider", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rule-parity-v1.ts", "9c2e32f0a8eb8dd622005ad8e2e0aced4ad271e86ab99dba19c4a053b31b2ee7", 2385],
];
const expectedTargetForms = [
  {target_id: "typescript", path: "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/rule-v1.ts", symbol: "evaluateRuleV1"},
  {target_id: "python", path: "projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/rule_v1.py", symbol: "evaluate_rule_v1"},
  {target_id: "rust", path: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/remaining_types/rule_v1.rs", symbol: "evaluate_rule_v1"},
];
const newProviderIds = [
  "rule-typescript-v1", "rule-python-v1", "rule-rust-v1",
];
const predecessorIds = [
  "typescript-rule-v1", "python-rule-v1", "rust-rule-v1", "rule-parity-v1",
];
const predecessorRegistryBindings = [
  ["typescript-rule-v1", "typeScriptRuleV1Provider", "./providers/typescript-rule-v1.js", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/typescript-rule-v1.ts"],
  ["python-rule-v1", "pythonRuleV1Provider", "./providers/python-rule-v1.js", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/python-rule-v1.ts"],
  ["rust-rule-v1", "rustRuleV1Provider", "./providers/rust-rule-v1.js", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rust-rule-v1.ts"],
  ["rule-parity-v1", "ruleParityV1Provider", "./providers/rule-parity-v1.js", "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rule-parity-v1.ts"],
];

const admissionBytes = await read(admissionPath);
const admission = JSON.parse(admissionBytes.toString("utf8"));
const inventoryBytes = await read(inventoryPath);
const inventory = JSON.parse(inventoryBytes.toString("utf8"));
if (admission.schema_version !== "RmtRuleAdmissionContext/v1" ||
    admission.work_pack_id !== "WP-RMT-002" ||
    admission.swu_id !== "RMT-RULE-001" || admission.type !== "Rule" ||
    admission.execution_mode !== "candidate-local-fast-lane" ||
    admission.authority_effect !== "none") {
  fail("RMT_RULE_ADMISSION_CONTEXT_INVALID");
}
if (admission.source_inventory.path !== inventoryPath ||
    admission.source_inventory.sha256 !== sha256(inventoryBytes) ||
    admission.source_inventory.size_bytes !== inventoryBytes.length) {
  fail("RMT_RULE_SOURCE_INVENTORY_BINDING_STALE");
}
if (inventory.schema_version !== "RmtRuleSourceInventory/v1" ||
    inventory.work_pack_id !== "WP-RMT-002" || inventory.type !== "Rule" ||
    inventory.reuse_policy !==
      "adopt-existing-outcome-function-engine; add-only-thin-type-owned-adapters" ||
    inventory.authority_effect !== "none" ||
    !same(inventory.sources.map(({role, path, sha256: digest, size_bytes: size}) =>
      [role, path, digest, size]), expectedSources)) {
  fail("RMT_RULE_SOURCE_INVENTORY_INVALID");
}
for (const [, path, digest, size] of expectedSources) {
  const bytes = await read(path);
  if (sha256(bytes) !== digest || bytes.length !== size) {
    fail(`RMT_RULE_SOURCE_DRIFT:${path}`);
  }
}
if (!same(admission.target_forms, expectedTargetForms) ||
    !same(admission.proof_denominator, {
      declared_case_count: 3,
      semantic_hostile_count: 10,
      rel_a_hostile_count: 4,
      native_target_count: 3,
      native_evidence_separated: true,
    })) {
  fail("RMT_RULE_TARGET_OR_DENOMINATOR_INVALID");
}
const registryBytes = await read(admission.provider_policy.registry_path);
if (sha256(registryBytes) !== admission.provider_policy.registry_sha256 ||
    !same(admission.provider_policy.new_unregistered_provider_ids,
      newProviderIds) ||
    !same(admission.provider_policy.registered_predecessor_provider_ids,
      predecessorIds)) {
  fail("RMT_RULE_REGISTRY_SNAPSHOT_STALE");
}
const registryText = registryBytes.toString("utf8");
if (newProviderIds.some((id) => registryText.includes(id)) ||
    predecessorRegistryBindings.some(([, binding, path]) =>
      !registryText.includes(`import { ${binding} } from \"${path}\"`) ||
      !registryText.includes(`  ${binding},`))) {
  fail("RMT_RULE_PROVIDER_REGISTRY_POLICY_INVALID");
}
for (const [providerId, , , providerPath] of predecessorRegistryBindings) {
  const providerSource = (await read(providerPath)).toString("utf8");
  if (!providerSource.includes(`provider_id: \"${providerId}\"`)) {
    fail(`RMT_RULE_PREDECESSOR_PROVIDER_ID_INVALID:${providerPath}`);
  }
}
for (const snapshot of admission.canonical_snapshots) {
  if (sha256(await read(snapshot.path)) !== snapshot.sha256) {
    fail(`RMT_RULE_CANONICAL_SNAPSHOT_DRIFT:${snapshot.path}`);
  }
}
if (!same(admission.lifecycle, {
  context_validated: true,
  task_session_admitted: false,
  candidate_mapped: false,
  ontology_admitted: false,
  promoted: false,
})) {
  fail("RMT_RULE_LIFECYCLE_CEILING_INVALID");
}
try {
  await lstat(resolve(root, lifecycleReceiptPath));
  fail("RMT_RULE_DEFERRED_LIFECYCLE_RECEIPT_PRESENT");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
process.stdout.write(`${JSON.stringify({
  result: "pass",
  work_pack_id: "WP-RMT-002",
  swu_id: "RMT-RULE-001",
  source_count: expectedSources.length,
  target_form_count: expectedTargetForms.length,
  task_session_admitted: false,
  lifecycle_receipt_present: false,
  authority_effect: "none",
})}\n`);
