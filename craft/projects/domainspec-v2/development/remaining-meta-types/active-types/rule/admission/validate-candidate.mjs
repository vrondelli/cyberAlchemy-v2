#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve} from "node:path";

const CANDIDATE_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/candidates/rule.json";
const PROJECTION_RECEIPT_PATH =
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-RULE-010.json";
const REGISTRY_PATH =
  "projects/domainspec-v2/impl/architecture-conformance/factory/registry/factory-node-registry-v1.ts";
const ONTOLOGY_PATH =
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
const ONTOLOGY_PROJECTION_PATH =
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json";
const NEW_PROVIDER_IDS = [
  "rule-typescript-v1", "rule-python-v1", "rule-rust-v1",
];
const RECEIPT_SPECS = [
  ["RMT-RULE-006", "parity", "eb2f54234d9f93d933bd7160539452536244b419fb9ba923044bdf56e9d5ed32", 2115],
  ["RMT-RULE-007", "replay", "6f452f4136bea2a3f58750fe59d7092fe82d6afc00ec6d39fc7dffac09c6d9d3", 3273],
  ["RMT-RULE-008", "relations", "8b2e39bda39fc47f6a31176945cf78f049a8e8ceeeaff9e732689e422a41ccf1", 2560],
  ["RMT-RULE-009", "registry-negative", "1a7959f176d39f368a01e95750c30c382af9cb16ef56f28e11d93ba38eb69018", 2951],
].map(([swu_id, stage, sha256, size_bytes]) => ({
  swu_id, stage,
  path: `projects/domainspec-v2/development/remaining-meta-types/receipts/${swu_id}.json`,
  sha256, size_bytes,
}));
const TARGETS = [
  {
    language: "typescript", form_id: "typescript.pure-boolean-rule",
    provider_id: "rule-typescript-v1", registered: false,
    source: {path: "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/rule-v1.ts", sha256: "5163d8fd9a4f040b8eef49db2127e54a7089b0b7a2e18b7afb523c8a94c5c8b5", size_bytes: 516},
    provider: {path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rule-typescript-v1.ts", sha256: "a49fd32267e3dc166a4380e80b9f7f49046f6622581bdbdd205e42b0df950ab3", size_bytes: 917},
    binding: {path: "projects/domainspec-v2/impl/architecture-conformance/realizations/rule/typescript/pure-boolean-v1/typescript-binding.json", sha256: "be17b5db82127ceb2cc80266460690355355d67ea33fa68cf890df92e5b72c03", size_bytes: 1288},
  },
  {
    language: "python", form_id: "python.pure-boolean-rule",
    provider_id: "rule-python-v1", registered: false,
    source: {path: "projects/domainspec-v2/impl/architecture-conformance/targets/python/remaining_types/rule_v1.py", sha256: "4232c444014341f37848bc9c17225b9a123c805a1558144d4588715b2e6abaf2", size_bytes: 387},
    provider: {path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rule-python-v1.ts", sha256: "f7492965505f291eb4e3554546db7065a2aad90a4a6c16506bc75232f556d836", size_bytes: 876},
    binding: {path: "projects/domainspec-v2/impl/architecture-conformance/realizations/rule/python/pure-boolean-v1/python-binding.json", sha256: "2a045d7d1556ac98831ae0eb50f3302304e6788008cdcc0cae49fc9bb492f322", size_bytes: 1272},
  },
  {
    language: "rust", form_id: "rust.pure-boolean-rule",
    provider_id: "rule-rust-v1", registered: false,
    source: {path: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/remaining_types/rule_v1.rs", sha256: "4daaebe9b10f5fccf884382611fec4b12013e9ed9d03056b45ae97c8b9f73c64", size_bytes: 398},
    provider: {path: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rule-rust-v1.ts", sha256: "951b547efe3d0ccfacdae523ca4dabe5e4030c39bed26df3ace1e219c042afb5", size_bytes: 868},
    binding: {path: "projects/domainspec-v2/impl/architecture-conformance/realizations/rule/rust/pure-boolean-v1/rust-binding.json", sha256: "be5626203da8a9353acba1d351e6946487d20a827777a1909ec809bfc0f3a896", size_bytes: 1260},
  },
];
const DEFERRED_LIFECYCLE_PATHS = [
  "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/RECEIPT.json",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-RULE-002.json",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-RULE-003.json",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-RULE-004.json",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-RULE-005.json",
];

const checks = [];
const check = (condition, id) => {
  if (!condition) throw new Error(id);
  checks.push(id);
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const exactKeys = (value, keys, id) => check(value &&
  typeof value === "object" && !Array.isArray(value) &&
  equal(Object.keys(value).sort(), [...keys].sort()), id);
const resolveInside = (root, path, id) => {
  check(typeof path === "string" && path.length > 0 && !isAbsolute(path) &&
    !path.split("/").includes("..") && !path.includes("\0"), `${id}-path`);
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  check(!rel.startsWith("..") && !isAbsolute(rel), `${id}-scope`);
  return absolute;
};
const readBytes = (root, path, id) => {
  const absolute = resolveInside(root, path, id);
  const stat = lstatSync(absolute);
  check(stat.isFile() && !stat.isSymbolicLink(), `${id}-regular-file`);
  const rel = relative(root, realpathSync(absolute));
  check(!rel.startsWith("..") && !isAbsolute(rel), `${id}-realpath`);
  return readFileSync(absolute);
};
const readJson = (root, path, id) => {
  const bytes = readBytes(root, path, id);
  const text = new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  check(text.endsWith("\n"), `${id}-final-newline`);
  check(!text.split("\n").some((line) => /[ \t]+$/.test(line)),
    `${id}-trailing-whitespace`);
  return {bytes, value: JSON.parse(text)};
};
const validateRef = (root, ref, expected, id) => {
  exactKeys(ref, ["path", "sha256", "size_bytes"], `${id}-shape`);
  check(equal(ref, expected), `${id}-binding`);
  const bytes = readBytes(root, ref.path, id);
  check(bytes.length === ref.size_bytes, `${id}-size`);
  check(sha256(bytes) === ref.sha256, `${id}-hash`);
  return bytes;
};

const root = realpathSync(process.cwd());
const requested = process.argv[2] ?? CANDIDATE_PATH;
const candidateRelative = isAbsolute(requested) ? relative(root, requested) : requested;
check(candidateRelative === CANDIDATE_PATH, "candidate-path-exact");
const candidateArtifact = readJson(root, CANDIDATE_PATH, "candidate");
const candidate = candidateArtifact.value;
exactKeys(candidate, [
  "schema_version", "candidate_id", "candidate_kind", "work_pack_id",
  "task_id", "projection_swu_id", "meta_type", "execution_mode",
  "projection_source", "admission_context", "architecture_implementation",
  "targets", "portable_parity", "deterministic_replay",
  "architecture_relations", "registry_nonmembership", "lifecycle",
  "publication_class", "proof_projection_policy", "external_effects",
  "validation_surface", "claim_ceiling",
], "candidate-top-level");
check(candidate.schema_version === "domainspec.meta-type-implementation-candidate/v1" &&
  candidate.candidate_id === "candidate.settlement.pure-boolean-rule.rule-implementation/v1" &&
  candidate.candidate_kind === "MetaTypeImplementationSlice/v1" &&
  candidate.work_pack_id === "WP-RMT-002" &&
  candidate.task_id === "TASK-RMT-RULE" &&
  candidate.projection_swu_id === "RMT-RULE-010" &&
  candidate.execution_mode === "candidate-local-fast-lane",
"candidate-identity-exact");
check(equal(candidate.meta_type, {
  id: "DS-D1.7", label: "Rule", category: "behavioral",
  plain_language: "A pure boolean guard that enforces a condition without side effects.",
}), "candidate-meta-type-exact");
check(equal(candidate.projection_source.receipt_order,
  RECEIPT_SPECS.map(({swu_id}) => swu_id)) &&
  Array.isArray(candidate.projection_source.proof_receipts) &&
  candidate.projection_source.proof_receipts.length === 4,
"candidate-receipt-order-exact");
for (let index = 0; index < RECEIPT_SPECS.length; index += 1) {
  const expected = RECEIPT_SPECS[index];
  const ref = candidate.projection_source.proof_receipts[index];
  validateRef(root, {path: ref.path, sha256: ref.sha256,
    size_bytes: ref.size_bytes}, {
    path: expected.path, sha256: expected.sha256, size_bytes: expected.size_bytes,
  }, `proof-receipt-${expected.swu_id}`);
  check(ref.swu_id === expected.swu_id && ref.stage === expected.stage &&
    ref.required_result === "pass" && ref.required_authority_effect === "none",
  `proof-receipt-${expected.swu_id}-contract`);
  const receipt = readJson(root, expected.path, expected.swu_id).value;
  check(receipt.schema_version ===
    "domainspec.wp-rmt-002-candidate-proof-receipt/v1" &&
    receipt.swu_id === expected.swu_id && receipt.stage === expected.stage &&
    receipt.execution_mode === "candidate-local-fast-lane" &&
    receipt.result === "pass" && receipt.authority_effect === "none" &&
    receipt.lifecycle.task_session_admitted === false &&
    receipt.lifecycle.canonical_terminal_receipt === false &&
    receipt.lifecycle.ontology_admitted === false &&
    receipt.lifecycle.registered === false &&
    receipt.lifecycle.promoted === false,
  `proof-receipt-${expected.swu_id}-candidate-local`);
}
validateRef(root, candidate.admission_context.admission, {
  path: "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/admission.json",
  sha256: "627050175ae5f5f291f635e9bacbeda4ccd952d28253797adbc11c43c9854f95",
  size_bytes: 2585,
}, "admission-context");
validateRef(root, candidate.admission_context.source_inventory, {
  path: "projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/source-inventory.json",
  sha256: "edd4847e8195eedca4dc8e8c49b49bf0d5d13bf1a1d2879583057d856f208666",
  size_bytes: 2178,
}, "source-inventory");
validateRef(root, candidate.admission_context.ontology, {
  path: ONTOLOGY_PATH,
  sha256: "6cd5a46c8d51c3c88f16a5ee483e190c6225e5aebeffbb909070ad6cac44169a",
  size_bytes: 151653,
}, "ontology");
validateRef(root, candidate.admission_context.ontology_projection, {
  path: ONTOLOGY_PROJECTION_PATH,
  sha256: "43afaa7532614ddc1894b1d4760cb434792964295b1ec637e9ddcbf74f052323",
  size_bytes: 34206,
}, "ontology-projection");
check(candidate.architecture_implementation.architecture_type_id ===
  "architecture.RuleImplementation" &&
  candidate.architecture_implementation.family_id === "pure-boolean-rule/v1" &&
  candidate.architecture_implementation.evidence_status === "candidate" &&
  candidate.architecture_implementation.provider_registration_status ===
  "unregistered" &&
  equal(candidate.architecture_implementation.direct_provider_ids,
    NEW_PROVIDER_IDS), "architecture-implementation-exact");
validateRef(root, candidate.architecture_implementation.source_binding_request, {
  path: "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-rule-wp-rmt-002.request.json",
  sha256: "37806ca042f4fccd76327c7199f0d9e08e1046a1f7b8a6835eb02f33972a8560",
  size_bytes: 4747,
}, "source-binding-request");
check(equal(candidate.targets, TARGETS), "candidate-targets-exact");
for (const target of TARGETS) {
  validateRef(root, target.source, target.source, `${target.language}-source`);
  validateRef(root, target.provider, target.provider, `${target.language}-provider`);
  validateRef(root, target.binding, target.binding, `${target.language}-binding`);
}
check(equal(candidate.portable_parity, {
  receipt_swu_id: "RMT-RULE-006", direct_provider_count: 3,
  declared_case_count: 3, semantic_controls_killed: 10,
  native_evidence_separated: true, native_hash_byte_comparison: false,
}), "portable-parity-exact");
check(equal(candidate.deterministic_replay, {
  receipt_swu_id: "RMT-RULE-007", fresh_process_count_declared: 2,
  semantic_receipts_deterministic: true,
  child_process_ids_excluded_from_semantic_identity: true,
  owned_transient_residue_count: 0, failure_exit_preserved: true,
}), "deterministic-replay-exact");
check(equal(candidate.architecture_relations, {
  receipt_swu_id: "RMT-RULE-008", mode: "blueprint-only",
  relation_contract_ids: ["rule/enforces-to-guards", "rule/factory-validation"],
  materialized_relation_count: 0, unmapped_domain_relations: ["mirrors"],
}), "architecture-relations-exact");
check(equal(candidate.registry_nonmembership, {
  receipt_swu_id: "RMT-RULE-009",
  registry: {path: REGISTRY_PATH,
    sha256: "2497f2e047e023de2738bac4b815e6b0212560dcfc8053982c94f4a529a9f51b",
    size_bytes: 5105},
  direct_provider_ids_absent: 3, predecessor_provider_ids_present: 3,
  registry_changed: false,
}), "registry-nonmembership-exact");
validateRef(root, candidate.registry_nonmembership.registry,
  candidate.registry_nonmembership.registry, "canonical-registry");
check(equal(candidate.lifecycle, {
  canonical_maturity: "active", architecture_mapping_status: "candidate-mapped",
  implementation_evidence_status: "candidate", task_session_admitted: false,
  admission_status: "not-admitted", provider_registration_status: "unregistered",
  ontology_admission_status: "not-admitted", promotion_status: "not-promoted",
  promotion_record_count: 0, queue_readiness: false, authority_effect: "none",
}), "candidate-lifecycle-exact");
check(candidate.publication_class === "internal" &&
  Object.values(candidate.proof_projection_policy).every((value) => value === false) &&
  Object.values(candidate.external_effects).every((value) => value === false) &&
  candidate.validation_surface.command ===
  "node projects/domainspec-v2/development/remaining-meta-types/active-types/rule/admission/validate-candidate.mjs projects/domainspec-v2/development/remaining-meta-types/candidates/rule.json",
"candidate-claim-boundaries-exact");
for (const path of DEFERRED_LIFECYCLE_PATHS) {
  check(!existsSync(resolve(root, path)), `deferred-lifecycle-absent:${path}`);
}
const projection = readJson(root, PROJECTION_RECEIPT_PATH,
  "projection-receipt").value;
check(projection.schema_version ===
  "domainspec.wp-rmt-002-candidate-proof-receipt/v1" &&
  projection.work_pack_id === "WP-RMT-002" &&
  projection.task_id === "TASK-RMT-RULE" &&
  projection.swu_id === "RMT-RULE-010" && projection.stage === "candidate" &&
  projection.execution_mode === "candidate-local-fast-lane" &&
  projection.result === "pass" && projection.authority_effect === "none" &&
  projection.projection_receipt_written_last === true,
"projection-receipt-identity-exact");
validateRef(root, projection.candidate, {
  path: CANDIDATE_PATH, sha256: sha256(candidateArtifact.bytes),
  size_bytes: candidateArtifact.bytes.length,
}, "projection-candidate-ref");
check(equal(projection.dependencies, RECEIPT_SPECS.map(({swu_id, stage, path,
  sha256, size_bytes}) => ({swu_id, stage, path, sha256, size_bytes,
  required_result: "pass"}))), "projection-dependencies-exact");
check(equal(projection.lifecycle, {
  task_session_admitted: false, canonical_terminal_receipt: false,
  candidate_mapped: true, ontology_admitted: false, registered: false,
  promoted: false,
}), "projection-lifecycle-exact");

process.stdout.write(`${JSON.stringify({
  schema_version: "RuleCandidateValidation/v1",
  result: "pass",
  candidate_path: CANDIDATE_PATH,
  candidate_sha256: sha256(candidateArtifact.bytes),
  proof_receipts_validated: 5,
  deferred_lifecycle_paths_absent: DEFERRED_LIFECYCLE_PATHS.length,
  checks_passed: checks.length,
  lifecycle: candidate.lifecycle,
  authority_effect: "none",
})}\n`);
