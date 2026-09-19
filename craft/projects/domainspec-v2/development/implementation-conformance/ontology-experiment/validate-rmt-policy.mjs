#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const paths = Object.freeze({
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W2-POLICY-001.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/policy/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/policy/protocol-admission.json",
  calculationReceipt: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-CALC-007.json",
  calculationCandidate: "projects/domainspec-v2/development/remaining-meta-types/candidates/calculation.json"
});
const absolute = (path) => resolve(root, path);
const readJson = (path) => JSON.parse(readFileSync(absolute(path), "utf8"));
const sha = (path) => createHash("sha256").update(readFileSync(absolute(path))).digest("hex");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone = (value) => structuredClone(value);
const overlay = (profile, id) => profile.representation_overlays?.find(({contract_id}) => contract_id === id);

const load = () => ({
  ontology: readJson(paths.ontology),
  projection: readJson(paths.projection),
  profiles: {typescript: readJson(paths.typescript), python: readJson(paths.python), rust: readJson(paths.rust)},
  decision: readJson(paths.decision),
  descriptor: readJson(paths.descriptor),
  admission: readJson(paths.admission),
  calculationReceipt: readJson(paths.calculationReceipt),
  calculationCandidate: readJson(paths.calculationCandidate)
});

const liveDigests = new Map(Object.values(paths).map((path) => [path, sha(path)]));
const validateBundle = (bundle) => {
  const failures = [];
  const fail = (code, detail) => failures.push({code, detail});
  const {ontology, projection, profiles, decision, descriptor, admission, calculationReceipt, calculationCandidate} = bundle;
  if (decision.selected_option_id !== "W2-POLICY-A-BOUND-EFFECT-FREE-STRATEGY" ||
      decision.portable_architecture?.type_id !== "architecture.PolicyImplementation" ||
      decision.portable_architecture?.strategy_contract_type_id !== "architecture.PolicyStrategyContract") {
    fail("POLICY_DECISION_DRIFT", "W2-A is not the exact selected Policy boundary");
  }
  const concepts = new Map((ontology.concept_types ?? []).map((item) => [item.concept_id, item]));
  const policy = concepts.get("architecture.PolicyImplementation");
  const strategy = concepts.get("architecture.PolicyStrategyContract");
  if (policy?.extends !== "architecture.DomainConceptImplementation" || policy?.canonical_meta_type_ref !== "DS-D1.8" ||
      !policy?.source_refs?.includes("domainspec.policy-form-decision") || strategy?.extends !== "architecture.ArchitectureElement") {
    fail("POLICY_TYPES_INVALID", "Policy and strategy contract types must be distinct reciprocal candidate nodes");
  }
  const properties = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  const requiredProperties = [
    "binding.input_concepts", "binding.output_concept", "callable.effect_contract", "callable.dependency_contract",
    "callable.failure_contract", "callable.result_consumption", "callable.provider_id", "callable.provider_digest",
    "callable.descriptor_digest", "policy.strategy_set_digest"
  ];
  for (const id of requiredProperties) {
    const property = properties.get(id);
    if (!property?.applies_to?.types?.includes("architecture.PolicyImplementation") || !property?.observation_stage ||
        !property?.owner_route || !property?.forbidden_inference) fail("POLICY_PROPERTY_MISSING", id);
  }
  if (!properties.get("callable.return_semantics")?.value_type?.values?.includes("strategy") ||
      !properties.get("callable.dependency_contract")?.value_type?.values?.includes("explicit-inputs-only")) {
    fail("POLICY_PROPERTY_VALUES_INVALID", "strategy and explicit-inputs-only must be admitted ontology values");
  }
  const relations = (ontology.relation_definitions ?? []).filter(({relation_id}) => relation_id === "architecture.selects_strategy");
  if (relations.length !== 1 || JSON.stringify(relations[0].source_types) !== JSON.stringify(["architecture.PolicyImplementation"]) ||
      JSON.stringify(relations[0].target_types) !== JSON.stringify(["architecture.PolicyStrategyContract"]) ||
      relations[0].authority_effect !== "none" || relations[0].cycle_policy !== "acyclic") {
    fail("POLICY_RELATION_INVALID", "selects_strategy endpoints or authority boundary drifted");
  }
  const projected = (projection.meta_types ?? []).filter(({meta_type_id}) => meta_type_id === "DS-D1.8");
  if (projected.length !== 1 || projected[0].mapping_status !== "candidate-mapped" ||
      projected[0].architecture_type_id !== "architecture.PolicyImplementation" ||
      projected[0].strategy_contract_type_id !== "architecture.PolicyStrategyContract" ||
      projected[0].candidate_language_protocols?.length !== 3) fail("POLICY_PROJECTION_INVALID", "DS-D1.8 projection drifted");
  const expected = {
    typescript: ["typescript.bound-policy/v1", "typescript.policy-selector-arrow-function"],
    python: ["python.bound-policy/v1", "python.policy-selector-function"],
    rust: ["rust.bound-policy/v1", "rust.policy-selector-function"]
  };
  for (const [language, [protocolId, formId]] of Object.entries(expected)) {
    const selected = overlay(profiles[language], "policy.profile-representation");
    const protocol = selected?.candidate_protocols?.[0];
    const contract = protocol?.descriptor_contract;
    if (selected?.admission_status !== "candidate-protocol-only" || protocol?.protocol_id !== protocolId ||
        protocol?.form_id !== formId || protocol?.status !== "admitted-candidate-protocol" ||
        protocol?.implementation_status !== "provider-absent" || contract?.return_semantics !== "strategy" ||
        contract?.effect_contract !== "none" || contract?.dependency_contract !== "explicit-inputs-only" ||
        contract?.failure_contract !== "declared" || contract?.result_consumption !== "complete") {
      fail("POLICY_PROFILE_INVALID", language);
    }
  }
  const selection = descriptor.portable_architecture?.selection_contract;
  if (descriptor.schema_version !== "domainspec.policy-cross-language-realization-descriptor/v1" ||
      descriptor.descriptor_status !== "candidate-protocol-only" || descriptor.language_bindings?.length !== 3 ||
      selection?.strategy_set !== "non-empty-content-addressed-current-members" ||
      selection?.output !== "one-current-member-identity" || selection?.strategy_execution !== "forbidden" ||
      selection?.boolean_collapse !== "forbidden" || selection?.read_only_exception !== "forbidden" ||
      descriptor.authority_effect !== "none") fail("POLICY_DESCRIPTOR_INVALID", "descriptor boundary drifted");
  if (admission.schema_version !== "domainspec.policy-protocol-admission/v1" || admission.result !== "pass" ||
      admission.admission_status !== "candidate-protocol-only" || admission.selected_protocols?.length !== 3 ||
      admission.implementation_effects?.providers_created !== false || admission.authority_effect !== "none") {
    fail("POLICY_ADMISSION_INVALID", "admission boundary or non-effects drifted");
  }
  for (const ref of [admission.decision_ref, admission.descriptor_ref, ...admission.dependency_refs,
    ...admission.material_refs, ...admission.selected_protocols.map(({profile_ref}) => profile_ref), descriptor.decision_ref,
    ...descriptor.calculation_continuity_refs, ...descriptor.material_refs, ...descriptor.language_bindings.map(({profile_ref}) => profile_ref)]) {
    if (liveDigests.get(ref?.path) !== ref?.sha256) fail("STALE_DIGEST", ref?.path ?? "missing");
  }
  const calculationProjection = projection.meta_types?.find(({meta_type_id}) => meta_type_id === "DS-D1.6");
  if (!concepts.has("architecture.CalculationImplementation") || calculationProjection?.mapping_status !== "candidate-mapped" ||
      calculationReceipt.result !== "pass" || calculationReceipt.projection_semantics?.meta_type_id !== "DS-D1.6" ||
      calculationCandidate.meta_type?.id !== "DS-D1.6") fail("CALCULATION_CONTINUITY_INVALID", "live Calculation projection continuity failed");
  for (const [language, profile] of Object.entries(profiles)) {
    const calculation = overlay(profile, "calculation.profile-representation")?.candidate_protocols?.[0]?.descriptor_contract;
    if (calculation?.return_semantics !== "value" || calculation?.dependency_contract !== "explicit-only") {
      fail("CALCULATION_CONTINUITY_INVALID", language);
    }
  }
  return failures;
};

const members = [{id: "strategy.standard"}, {id: "strategy.priority"}];
const positiveModel = {
  catalogue: {id: "settlement-strategies/v1", members, digest: digest(members)},
  declared_input_fields: ["priority", "amount"], consumed_input_fields: ["priority", "amount"],
  observations: [{input: {priority: false, amount: 10}, selected: "strategy.standard"}, {input: {priority: true, amount: 10}, selected: "strategy.priority"}],
  returned_kind: "strategy-identity", returned_executable: false,
  effects: {reads: 0, writes: 0, strategy_executions: 0},
  descriptor_current: true, provider_current: true, strategy_set_current: true
};
const validateModel = (model) => {
  const failures = [];
  if (!Array.isArray(model.catalogue?.members) || model.catalogue.members.length === 0) failures.push("STRATEGY_SET_EMPTY");
  if (digest(model.catalogue?.members ?? []) !== model.catalogue?.digest) failures.push("STRATEGY_SET_DIGEST_STALE");
  const ids = new Set((model.catalogue?.members ?? []).map(({id}) => id));
  if (model.observations?.some(({selected}) => !ids.has(selected))) failures.push("UNKNOWN_STRATEGY");
  if (model.returned_kind !== "strategy-identity") failures.push("BOOLEAN_RETURN_COLLAPSE");
  if (model.returned_executable !== false) failures.push("EXECUTABLE_MEMBERSHIP_COLLAPSE");
  if (JSON.stringify(model.declared_input_fields) !== JSON.stringify(model.consumed_input_fields) ||
      new Set(model.observations?.map(({selected}) => selected)).size < 2) failures.push("INPUT_IGNORED");
  if (model.effects?.reads !== 0) failures.push("READ_EFFECT");
  if (model.effects?.writes !== 0) failures.push("WRITE_EFFECT");
  if (model.effects?.strategy_executions !== 0) failures.push("STRATEGY_EXECUTION");
  if (!model.descriptor_current || !model.provider_current || !model.strategy_set_current) failures.push("STALE_DIGEST");
  return failures;
};

const bundle = load();
const checks = [];
const errors = [...validateBundle(bundle), ...validateModel(positiveModel).map((code) => ({code, detail: "positive model"}))];
const hostileCases = [
  ["boolean-return", "BOOLEAN_RETURN_COLLAPSE", (b, m) => { m.returned_kind = "boolean"; }],
  ["empty-set", "STRATEGY_SET_EMPTY", (b, m) => { m.catalogue.members = []; m.catalogue.digest = digest([]); }],
  ["unknown-member", "UNKNOWN_STRATEGY", (b, m) => { m.observations[0].selected = "strategy.foreign"; }],
  ["stable-id-content-drift", "STRATEGY_SET_DIGEST_STALE", (b, m) => { m.catalogue.members[0].id = "strategy.changed"; }],
  ["ignored-input", "INPUT_IGNORED", (b, m) => { m.consumed_input_fields = ["priority"]; }],
  ["executable-object-membership", "EXECUTABLE_MEMBERSHIP_COLLAPSE", (b, m) => { m.returned_executable = true; }],
  ["read-effect", "READ_EFFECT", (b, m) => { m.effects.reads = 1; }],
  ["write-effect", "WRITE_EFFECT", (b, m) => { m.effects.writes = 1; }],
  ["strategy-execution", "STRATEGY_EXECUTION", (b, m) => { m.effects.strategy_executions = 1; }],
  ["stale-digest", "STALE_DIGEST", (b) => { b.descriptor.material_refs[0].sha256 = "0".repeat(64); }],
  ["missing-relation", "POLICY_RELATION_INVALID", (b) => { b.ontology.relation_definitions = b.ontology.relation_definitions.filter(({relation_id}) => relation_id !== "architecture.selects_strategy"); }],
  ["missing-property", "POLICY_PROPERTY_MISSING", (b) => { b.ontology.property_definitions = b.ontology.property_definitions.filter(({property_id}) => property_id !== "policy.strategy_set_digest"); }],
  ["authority-inflation", "POLICY_ADMISSION_INVALID", (b) => { b.admission.authority_effect = "promotion"; }]
];
for (const [id, expected, mutate] of hostileCases) {
  const hostileBundle = clone(bundle);
  const hostileModel = clone(positiveModel);
  mutate(hostileBundle, hostileModel);
  const codes = [...validateBundle(hostileBundle).map(({code}) => code), ...validateModel(hostileModel)];
  const killed = codes.includes(expected);
  checks.push({case_id: id, expected_code: expected, result: killed ? "killed" : "survived"});
  if (!killed) errors.push({code: "HOSTILE_SURVIVED", detail: id});
}
for (const path of Object.values(paths)) {
  const target = absolute(path);
  const safe = target.startsWith(`${root}${sep}`) && existsSync(target) && lstatSync(target).isFile() &&
    !lstatSync(target).isSymbolicLink() && realpathSync(target) === target;
  if (!safe) errors.push({code: "UNSAFE_REF", detail: path});
}
const result = {
  schema_version: "domainspec.rmt-policy-admission-validation/v1",
  swu_id: "RMT-POLICY-001",
  verdict: errors.length === 0 ? "pass" : "fail",
  semantic_checks: errors.length === 0 ? "pass" : "fail",
  hostile_validations: checks,
  hostile_kills: `${checks.filter(({result}) => result === "killed").length}/${checks.length}`,
  calculation_semantic_continuity: errors.some(({code}) => code === "CALCULATION_CONTINUITY_INVALID") ? "fail" : "pass",
  legacy_calculation_whole_file_validators: "admission-snapshot-expected-to-stale-after-monotonic-shared-ontology-growth",
  errors,
  implementation_status: {typescript_provider: "absent", python_provider: "absent", rust_provider: "absent", strategy_catalogue_proof: "not-executed", selector_proof: "not-executed", parity: "not-proven"},
  claim_ceiling: "candidate-only Policy ontology/profile/protocol/relation/descriptor admission with synthetic hostile validation and live Calculation semantic continuity; no provider, catalogue, selector, effect/non-execution, parity, promotion, publication, release, deployment, or production proof",
  authority_effect: "none"
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
