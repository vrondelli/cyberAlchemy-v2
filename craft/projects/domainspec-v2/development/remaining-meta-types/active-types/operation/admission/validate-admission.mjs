#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const LIVE_ADMISSION_DIR =
  "projects/domainspec-v2/development/remaining-meta-types/active-types/operation/admission";

const expectedSources = [
  ["live_projection", "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json", "43afaa7532614ddc1894b1d4760cb434792964295b1ec637e9ddcbf74f052323", 34206],
  ["operation_schema", "projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml", "01eb8520a1a7a0272d40bfb943d9ddbfc3a57bfe84b878c4a24c308b37551132", 1118],
  ["operation_form_decision", "projects/domainspec-v2/development/ontology-form-decisions/decisions/W3-OPERATION-001.json", "48f7b14368c8f31d0bee8395b0d70417412d9ecee8638fcc46805e97436b02c5", 9627],
  ["swu_manifest", "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/refreshes/20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/SWU-MANIFEST.json", "58e39654caab130dd71c9ffe151f8ba209b5ca3abba27c698b8e83a1ee4bf0c9", 93497],
  ["swu_contracts", "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/refreshes/20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/SWU-CONTRACTS.json", "a1e9158f7fff7f78d5820237c6f276a07c4c658610a51fc91ca026f7e41faa11", 2679223],
  ["hostile_catalogue", "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/refreshes/20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/HOSTILE-CATALOGUE.json", "41d5937f8bb6cc40475c23e228248130fe383b7930f09078fc7c98d26873505e", 56677],
  ["relation_contracts", "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/refreshes/20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/RELATION-CONTRACTS.json", "a26e1b6dd9dcc2f2903970a212f938270ef96284e0db8a8a62d5cc21c272ced4", 15026],
  ["task_contract", "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/refreshes/20260821T023424Z-wp-rmt-002-integrated-reuse-refresh/staged/tasks/TASK-RMT-OP.md", "a042af716feda5e77b68ace4bb5018a9264fb8f4e40cae0fb260547c3d9b6869", 1507],
  ["plan_semantic_manifest", "projects/domainspec-v2/development/remaining-meta-types/readiness/20260820T173252Z-wp-rmt-002-live-post-refresh/audit-2/plan-semantic-manifest.json", "919e51c82bcabde5490cdb7da98d533325dc2ed32b24f78bc34bf16703b27631", 143316],
  ["selection_receipt", "projects/domainspec-v2/development/remaining-meta-types/readiness/20260820T173252Z-wp-rmt-002-live-post-refresh/execution/selection-receipt.json", "93f2397800902dd3a3057a84b3779ce2a0a446955b674a88119c791c9b27e6e5", 961],
  ["operation_precedent_contract", "projects/domainspec-v2/impl/architecture-conformance/families/state-change/contracts/operation-contracts.ts", "568dfff380d93e58cc4d74a23bf85de459bd533e751ef75833f885a81708eaae", 660],
  ["operation_precedent_definition", "projects/domainspec-v2/impl/architecture-conformance/families/state-change/fixtures/complete-settlement/operation-definition.json", "18bbe235394c752c47f24ea70d6c14c189790b12f85e30d2807028b240659b9c", 539],
  ["operation_precedent_direct_proof", "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/typescript/run-direct-operation-proof.ts", "7f71f2653a44ced734c37c15cf8463a72edff5c647afd929e661463d0d544365", 6791],
  ["operation_precedent_direct_test", "projects/domainspec-v2/impl/architecture-conformance/acceptance/operation/typescript/direct-operation-proof.test.ts", "bd8878740fe4724ccc6ccbcc781b18e2464bc8b6dcc18270d0ec108984596cad", 2991],
  ["w3_precedent_contracts", "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/contracts/w3-contracts.ts", "ab44599370cc64f30dc75780cd4cff23220926049a2eefda42ed84ed4a687193", 7072],
  ["w3_precedent_evaluator", "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/evaluator/evaluate-w3.ts", "54ef9b154a1f5ed9be7cedc4ce9b73391803e51935b3282ba0fc323b75f58313", 14198],
  ["w3_precedent_typescript_provider", "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/providers/typescript/financial-settlement.ts", "24228bb025aaf39b2da11cb8237aef1cd228997172f0586fadb8cf9e0d33302f", 2075],
  ["w3_precedent_python_target", "projects/domainspec-v2/impl/architecture-conformance/targets/python/w3.py", "8cf9abc539034cae057cd9648a6942f84c783150095da805ba0468d486072f4d", 4578],
  ["w3_precedent_rust_target", "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w3.rs", "36e8c5f495f644d3c74775859461748903d313619b601596d207a50c5b23f493", 4931],
  ["w3_precedent_validator", "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-w3-effects-connections.mjs", "88df748b6afdfbb892aee0c6d9e6cf9dd7bd826821b234c33cd30bc403c79cfb", 11340],
].map(([role, path, sha256, size_bytes]) => ({ role, path, sha256, size_bytes }));

const precedentRoles = expectedSources.slice(10).map(({ role }) => role);

const expectedTargetForms = [
  {
    language: "typescript",
    form_id: "typescript.bound-operation-function",
    protocol_id: "typescript.bound-operation/v1",
    implementation_swu: "RMT-OP-003",
    status: "declared-not-implemented",
    material_targets: [
      "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/operation-v1.ts",
      "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/operation-v1.test.ts",
      "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/typescript/state-changing-v1/",
      "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-typescript-v1.ts",
    ],
  },
  {
    language: "python",
    form_id: "python.bound-operation-function",
    protocol_id: "python.bound-operation/v1",
    implementation_swu: "RMT-OP-004",
    status: "declared-not-implemented",
    material_targets: [
      "projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/operation_v1.py",
      "projects/domainspec-v2/impl/architecture-conformance/targets/python/test_operation_v1.py",
      "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/python/state-changing-v1/",
      "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-python-v1.ts",
    ],
  },
  {
    language: "rust",
    form_id: "rust.bound-operation-function",
    protocol_id: "rust.bound-operation/v1",
    implementation_swu: "RMT-OP-005",
    status: "declared-not-implemented",
    material_targets: [
      "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/remaining_types/operation_v1.rs",
      "projects/domainspec-v2/impl/architecture-conformance/targets/rust/tests/operation_v1.rs",
      "projects/domainspec-v2/impl/architecture-conformance/realizations/operation/rust/state-changing-v1/",
      "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/operation-rust-v1.ts",
      "projects/domainspec-v2/development/remaining-meta-types/runs/operation/cargo-target",
    ],
  },
];

const expectedHostileIds = [
  "op/undeclared-write",
  "op/undeclared-effect",
  "op/guard-bypass",
  "op/order-swap",
  "op/atomicity-removed",
  "op/success-failure-collapse",
  "op/emitted-before-commit",
  "op/continuation-mismatch",
  "op/read-set-drift",
  "op/output-contract-overclaim",
  "op/relation-owner-evidence-stale",
  "op/relation-source-endpoint-mismatch",
  "op/relation-target-endpoint-mismatch",
  "op/materialized-without-exact-assertion",
];

const expectedS1Controls = [
  {
    hostile_id: "s1/before-state-write-failure",
    hostile_class: "s1-cross-boundary",
    expected_code: "RMT_S1_BEFORE_STATE_WRITE_FAILURE",
    fixture_owner_swu: "RMT-OP-002",
    proof_owner_swu: "RMT-OP-006",
    fixture_path: "projects/domainspec-v2/impl/architecture-conformance/families/state-changing-action/hostiles/before-state-write-failure.json",
    non_noop_required: true,
    category: "fault-matrix:S1-F01",
    required_observation: "state-write-attempt and transaction abort",
    required_outcome: "no durable state and no occurrence",
  },
  {
    hostile_id: "s1/between-state-and-outbox-failure",
    hostile_class: "s1-cross-boundary",
    expected_code: "RMT_S1_STATE_OUTBOX_ATOMICITY_BREACH",
    fixture_owner_swu: "RMT-OP-002",
    proof_owner_swu: "RMT-OP-006",
    fixture_path: "projects/domainspec-v2/impl/architecture-conformance/families/state-changing-action/hostiles/between-state-and-outbox-failure.json",
    non_noop_required: true,
    category: "fault-matrix:S1-F02",
    required_observation: "state write plus missing outbox checkpoint",
    required_outcome: "atomic abort; no mixed commit",
  },
  {
    hostile_id: "s1/missing-member",
    hostile_class: "s1-cross-boundary",
    expected_code: "RMT_S1_MISSING_MEMBER",
    fixture_owner_swu: "RMT-OP-002",
    proof_owner_swu: "RMT-OP-006",
    fixture_path: "projects/domainspec-v2/impl/architecture-conformance/families/state-changing-action/hostiles/missing-member.json",
    non_noop_required: true,
    category: "decode-contract",
    required_observation: "missing transaction or occurrence member",
    required_outcome: "closed rejection with stable code",
  },
  {
    hostile_id: "s1/mixed-commit",
    hostile_class: "s1-cross-boundary",
    expected_code: "RMT_S1_MIXED_COMMIT",
    fixture_owner_swu: "RMT-OP-002",
    proof_owner_swu: "RMT-OP-006",
    fixture_path: "projects/domainspec-v2/impl/architecture-conformance/families/state-changing-action/hostiles/mixed-commit.json",
    non_noop_required: true,
    category: "atomicity-contract",
    required_observation: "state durable while outbox absent, or inverse",
    required_outcome: "reject mixed commit",
  },
  {
    hostile_id: "s1/rollback-after-commit",
    hostile_class: "s1-cross-boundary",
    expected_code: "RMT_S1_ROLLBACK_AFTER_COMMIT",
    fixture_owner_swu: "RMT-OP-002",
    proof_owner_swu: "RMT-OP-006",
    fixture_path: "projects/domainspec-v2/impl/architecture-conformance/families/state-changing-action/hostiles/rollback-after-commit.json",
    non_noop_required: true,
    category: "recovery-contract",
    required_observation: "attempt to erase committed state or outbox occurrence",
    required_outcome: "reject rollback and require forward recovery",
  },
];

const expectedRelationIds = [
  "op/enforced-by-to-guards",
  "op/exposed-by-to-exposes",
  "op/emitted-events-to-emits",
  "op/workflow-step-to-binds-step",
];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function equal(actual, expected) {
  return JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected));
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function resolveInside(root, value, label) {
  const target = resolve(root, value);
  const rel = relative(root, target);
  check(rel !== "" || target === root, `${label} did not resolve`);
  check(!rel.startsWith("..") && !isAbsolute(rel), `${label} escapes repository root`);
  return target;
}

function parseArguments(argv) {
  const args = [...argv];
  let root = process.cwd();
  if (args[0] && !args[0].startsWith("--")) root = resolve(args.shift());
  let admissionDir = resolve(root, LIVE_ADMISSION_DIR);
  while (args.length) {
    const flag = args.shift();
    check(flag === "--admission-dir", `unsupported argument: ${flag}`);
    const value = args.shift();
    check(Boolean(value), "--admission-dir requires a path");
    admissionDir = resolveInside(root, value, "admission directory");
  }
  return { root: realpathSync(root), admissionDir };
}

function sourceByRole(inventory, role) {
  const found = inventory.sources.filter((entry) => entry.role === role);
  check(found.length === 1, `expected one source with role ${role}`);
  return found[0];
}

const checks = [];
function passed(id) {
  checks.push(id);
}

try {
  const { root, admissionDir } = parseArguments(process.argv.slice(2));
  const admissionRel = relative(root, admissionDir);
  check(!admissionRel.startsWith("..") && !isAbsolute(admissionRel), "admission directory is outside repository root");
  check(lstatSync(admissionDir).isDirectory(), "admission directory is not a directory");

  const allowedFiles = new Set([
    "admission.json",
    "source-inventory.json",
    "validate-admission.mjs",
    "validate-candidate.mjs",
    "RECEIPT.json",
  ]);
  const materialFiles = readdirSync(admissionDir, { withFileTypes: true });
  for (const entry of materialFiles) {
    check(entry.isFile(), `non-file material is forbidden: ${entry.name}`);
    check(allowedFiles.has(entry.name), `undeclared material is forbidden: ${entry.name}`);
  }
  for (const required of ["admission.json", "source-inventory.json", "validate-admission.mjs", "validate-candidate.mjs"]) {
    check(materialFiles.some((entry) => entry.name === required), `required material is missing: ${required}`);
  }
  passed("material-inventory-exact");

  const admission = readJson(resolve(admissionDir, "admission.json"), "admission");
  const inventory = readJson(resolve(admissionDir, "source-inventory.json"), "source inventory");
  check(inventory.schema_version === "domainspec.wp-rmt-002.source-inventory/v1", "source inventory schema mismatch");
  check(inventory.work_pack_id === "WP-RMT-002" && inventory.task_id === "TASK-RMT-OP" && inventory.swu_id === "RMT-OP-001", "source inventory identity mismatch");
  check(inventory.attempt_id === "rmt-op-001-20260820T180000Z", "source inventory attempt mismatch");
  check(equal(inventory.sources, expectedSources), "source inventory is not the exact declared 20-source set");
  check(equal(inventory.counts, { all_sources: 20, control_sources: 10, read_only_precedents: 10 }), "source inventory denominator mismatch");
  check(inventory.authority_effect === "none", "source inventory claims authority");

  for (const expected of expectedSources) {
    const target = resolveInside(root, expected.path, expected.role);
    const stat = lstatSync(target);
    check(stat.isFile(), `${expected.role} is not a regular file`);
    const bytes = readFileSync(target);
    check(bytes.length === expected.size_bytes, `${expected.role} size drift`);
    check(sha256(bytes) === expected.sha256, `${expected.role} hash drift`);
  }
  passed("exact-input-rehash");

  check(admission.schema_version === "domainspec.wp-rmt-002.operation-admission/v1", "admission schema mismatch");
  check(admission.work_pack_id === "WP-RMT-002" && admission.task_id === "TASK-RMT-OP" && admission.swu_id === "RMT-OP-001", "admission identity mismatch");
  check(admission.attempt_id === "rmt-op-001-20260820T180000Z", "admission attempt mismatch");
  check(admission.result === "pass" && admission.stage === "admission", "admission result or stage mismatch");

  const selection = readJson(resolveInside(root, sourceByRole(inventory, "selection_receipt").path, "selection receipt"), "selection receipt");
  check(selection.selectionVerdict === "select" && selection.terminalCode === "SELECTION_READY", "selection is not ready");
  check(selection.swuId === "RMT-OP-001" && selection.taskId === "TASK-RMT-OP", "selection targets another unit");
  check(selection.planEpochId === "epoch-2cd4b2d98d05cb62ea719a74", "selection epoch mismatch");
  check(selection.canonicalSemanticDigest === "3db6fce085d02709196d89acc48044df1ff32d3578f27c2403b7d76188ae5441", "selection semantic digest mismatch");
  check(selection.unitContractDigest === "fbb88dbf86d74616c627705c7727a634a59fc9282dfb48699338d242dcb310af", "selection unit digest mismatch");
  check(admission.selection_binding.plan_epoch_id === selection.planEpochId, "admission selection epoch drift");
  check(admission.selection_binding.work_pack_semantic_digest === selection.canonicalSemanticDigest, "admission semantic digest drift");
  check(admission.selection_binding.unit_contract_digest === selection.unitContractDigest, "admission unit digest drift");
  check(admission.selection_binding.selection_receipt.sha256 === sourceByRole(inventory, "selection_receipt").sha256, "admission selection receipt digest drift");
  passed("selection-binding-exact");

  const projection = readJson(resolveInside(root, sourceByRole(inventory, "live_projection").path, "live projection"), "live projection");
  const rows = projection.meta_types.filter((row) => row.meta_type_id === "DS-D1.4");
  check(rows.length === 1, "live projection must contain exactly one DS-D1.4 row");
  check(projection.meta_types.indexOf(rows[0]) === 3, "DS-D1.4 projection pointer drift");
  check(admission.active_row.source.pointer === "/meta_types/3", "active row pointer mismatch");
  check(admission.active_row.source.path === sourceByRole(inventory, "live_projection").path, "active row source path mismatch");
  check(admission.active_row.source.sha256 === sourceByRole(inventory, "live_projection").sha256, "active row source hash mismatch");
  check(equal(admission.active_row.value, rows[0]), "admission active row is not exact");
  check(rows[0].maturity === "active" && rows[0].mapping_status === "candidate-mapped", "Operation row is not live active candidate-mapped");
  passed("active-row-exact");

  const schemaSource = sourceByRole(inventory, "operation_schema");
  const schemaText = readFileSync(resolveInside(root, schemaSource.path, "Operation schema"), "utf8");
  for (const marker of [
    "meta_type: Operation",
    "category: behavioral",
    "writes_state:",
    "rule: attribute-equals",
    "key: state_change",
    "value: yes",
    "authorship: forbidden",
  ]) {
    check(schemaText.includes(marker), `Operation schema marker missing: ${marker}`);
  }
  check(admission.criterion_schema.path === schemaSource.path && admission.criterion_schema.sha256 === schemaSource.sha256, "criterion schema binding mismatch");
  check(equal(admission.criterion_schema.criterion, { writes_state: { rule: "attribute-equals", key: "state_change", value: "yes" } }), "criterion schema semantic projection mismatch");
  check(equal(admission.criterion_schema.generated_relationship_projection, { relation: "creates", attribute: "creation_targets", value_shape: "concept-reference-set", derivation: "outgoing-targets", authorship: "forbidden" }), "generated relationship projection mismatch");
  passed("criterion-schema-exact");

  check(admission.precedent_inventory.count === 10, "precedent count mismatch");
  check(equal(admission.precedent_inventory.roles, precedentRoles), "precedent role set mismatch");
  check(admission.precedent_inventory.source_inventory_ref === "source-inventory.json", "precedent inventory ref mismatch");
  check(admission.precedent_inventory.policy === "read-only exact-byte precedent; no precedent is promoted or mutated", "precedent policy mismatch");
  passed("read-only-precedent-inventory-exact");

  const decision = readJson(resolveInside(root, sourceByRole(inventory, "operation_form_decision").path, "Operation form decision"), "Operation form decision");
  check(decision.decision_id === "DS-OF-W3-OPERATION-001", "Operation decision id mismatch");
  check(decision.selected_option_id === "W3-OPERATION-A-BOUND-ORDERED-EFFECT-CONTRACT", "Operation selected form drift");
  check(decision.shared_architecture_selection.selected_option_id === "W3-A-DESCRIPTOR-BOUND-TYPED-EFFECTS-CONNECTIONS", "shared W3 selection drift");
  check(admission.selected_form.decision_id === decision.decision_id, "admission decision id drift");
  check(admission.selected_form.selected_option_id === decision.selected_option_id, "admission selected form drift");
  check(admission.selected_form.decision_ref.sha256 === sourceByRole(inventory, "operation_form_decision").sha256, "admission form decision digest drift");

  const decisionForms = decision.language_target_realizations.map(({ language, form_id, protocol_id }) => ({ language, form_id, protocol_id }));
  const admissionForms = admission.target_forms.map(({ language, form_id, protocol_id }) => ({ language, form_id, protocol_id }));
  check(equal(admissionForms, decisionForms), "target language forms do not match the selected decision");

  const manifest = readJson(resolveInside(root, sourceByRole(inventory, "swu_manifest").path, "SWU manifest"), "SWU manifest");
  for (const targetForm of expectedTargetForms) {
    const unit = manifest.swus.find((swu) => swu.id === targetForm.implementation_swu);
    check(Boolean(unit), `missing ${targetForm.implementation_swu} in manifest`);
    check(unit.type === "Operation", `${targetForm.implementation_swu} is not an Operation unit`);
    check(equal(unit.write_scope, targetForm.material_targets), `${targetForm.implementation_swu} target path drift`);
  }
  check(equal(admission.target_forms, expectedTargetForms), "declared target forms or paths mismatch");
  passed("target-forms-declared");

  const hostileCatalogue = readJson(resolveInside(root, sourceByRole(inventory, "hostile_catalogue").path, "hostile catalogue"), "hostile catalogue");
  const hostileGroup = hostileCatalogue.groups.find((group) => group.type === "Operation");
  check(Boolean(hostileGroup), "Operation hostile group missing");
  check(hostileGroup.accounting === "14/14" && hostileGroup.semantic_controls === "10/10" && hostileGroup.rel_a_controls === "4/4", "Operation hostile denominator drift");
  check(equal(hostileGroup.controls.map(({ hostile_id }) => hostile_id), expectedHostileIds), "Operation hostile ids drift");
  check(equal(admission.hostile_ids, expectedHostileIds), "admission hostile ids mismatch");
  const s1Controls = hostileCatalogue.cross_type_controls.filter(
    (control) => control.fixture_owner_swu === "RMT-OP-002",
  );
  check(equal(s1Controls, expectedS1Controls), "Operation S1 hostile controls drift");
  check(equal(admission.s1_hostile_ids, expectedS1Controls.map(
    ({ hostile_id }) => hostile_id,
  )), "admission S1 hostile ids mismatch");

  const relationCatalogue = readJson(resolveInside(root, sourceByRole(inventory, "relation_contracts").path, "relation contracts"), "relation contracts");
  const relationGroup = relationCatalogue.type_contracts.find((group) => group.type === "Operation");
  check(Boolean(relationGroup), "Operation relation group missing");
  check(equal(relationGroup.contracts.map(({ contract_id }) => contract_id), expectedRelationIds), "Operation relation ids drift");
  check(equal(admission.relation_contract_ids, expectedRelationIds), "admission relation ids mismatch");
  check(equal(admission.proof_denominator, {
    precedent_sources: { expected: 10, bound: 10 },
    semantic_hostiles: { expected: 10, declared: 10 },
    relation_hostiles: { expected: 4, declared: 4 },
    s1_cross_boundary_hostiles: { expected: 5, declared: 5 },
    all_hostiles: { expected: 19, declared: 19 },
    relation_contracts: { expected: 4, declared: 4 },
    target_languages: { expected: 3, declared: 3 },
  }), "proof denominator mismatch");
  passed("proof-denominator-declared");

  check(admission.semantic_plan.epoch_id === "WP-RMT-002/S1/2026-08-16", "S1 semantic plan epoch drift");
  passed("s1-semantic-plan-epoch-exact");
  check(admission.semantic_plan.contract_digest === "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7", "S1 semantic contract digest drift");
  check(manifest.semantic_plan_epoch.epoch_id === admission.semantic_plan.epoch_id && manifest.semantic_plan_epoch.contract_digest === admission.semantic_plan.contract_digest, "S1 manifest binding drift");
  passed("s1-contract-digest-exact");
  check(equal(admission.s1_type_observation_denominator, {
    fault_controls: ["S1-F01", "S1-F02"],
    decode_controls: 1,
    atomicity_controls: 1,
    recovery_controls: 1,
    required_observations: [
      "transaction_id", "state_write_attempt", "outbox_checkpoint",
      "occurrence_id", "commit_outcome",
    ],
    declared_controls: 5,
  }), "S1 type observation denominator drift");
  passed("s1-type-observation-denominator-declared");
  check(equal(admission.provider_proof_separation, manifest.semantic_plan_epoch.contract.provider_proof), "provider proof separation drift");
  passed("provider-proof-separation-declared");

  const contracts = readJson(resolveInside(root, sourceByRole(inventory, "swu_contracts").path, "SWU contracts"), "SWU contracts");
  const unitContract = contracts.contracts.find((contract) => contract.swu_id === "RMT-OP-001");
  check(Boolean(unitContract), "RMT-OP-001 contract missing");
  check(equal(unitContract.acceptance, ["active-row-exact", "criterion-schema-exact", "read-only-precedent-inventory-exact", "target-forms-declared", "proof-denominator-declared", "authority-none", "s1-semantic-plan-epoch-exact", "s1-contract-digest-exact", "s1-type-observation-denominator-declared", "provider-proof-separation-declared"]), "RMT-OP-001 acceptance contract drift");
  check(equal(unitContract.dependencies, []), "RMT-OP-001 unexpectedly has dependencies");
  check(equal(unitContract.canonical_successors, ["RMT-OP-002"]), "RMT-OP-001 successor drift");
  passed("swu-contract-exact");

  check(equal(admission.semantic_contract, {
    failed_guard_forms_successful_transition: false,
    declared_order_is_observable: true,
    failure_carries_success_value: false,
    events_are_past_tense_facts_after_commit: true,
    exactly_once_distributed_delivery_claimed: false,
    observer_claim: "proves only what was attempted and returned within the declared continuation closure",
  }), "Operation semantic contract mismatch");
  check(Object.values(admission.implementation_effects).every((value) => value === false), "admission overclaims implementation effects");
  check(admission.successor.swu_id === "RMT-OP-002" && admission.successor.state === "not-executed", "admission successor mismatch");
  check(admission.claim_ceiling.includes("No family, target, provider, native proof, parity, registry admission, ontology mutation, promotion, publication, release, deployment, or production claim."), "claim ceiling is incomplete");
  check(admission.authority_effect === "none" && inventory.authority_effect === "none", "authority effect must remain none");
  passed("authority-none");

  process.stdout.write(`${JSON.stringify({
    schema_version: "domainspec.wp-rmt-002.operation-admission-validation/v1",
    work_pack_id: "WP-RMT-002",
    task_id: "TASK-RMT-OP",
    swu_id: "RMT-OP-001",
    attempt_id: "rmt-op-001-20260820T180000Z",
    result: "pass",
    checks,
    source_count: expectedSources.length,
    precedent_count: precedentRoles.length,
    hostile_count: expectedHostileIds.length + expectedS1Controls.length,
    base_hostile_count: expectedHostileIds.length,
    s1_hostile_count: expectedS1Controls.length,
    relation_contract_count: expectedRelationIds.length,
    target_language_count: expectedTargetForms.length,
    authority_effect: "none",
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    schema_version: "domainspec.wp-rmt-002.operation-admission-validation/v1",
    work_pack_id: "WP-RMT-002",
    task_id: "TASK-RMT-OP",
    swu_id: "RMT-OP-001",
    result: "block",
    checks,
    error: error.message,
    authority_effect: "none",
  }, null, 2)}\n`);
  process.exitCode = 1;
}
