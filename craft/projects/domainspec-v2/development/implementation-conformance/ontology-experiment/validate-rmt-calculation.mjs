#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(experimentRoot, "../../../../..");
const relative = Object.freeze({
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W2-CALCULATION-001.json",
  enumContinuity: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.semantic-slice-v1.json",
  enumValidator: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-rmt-enum-semantic-slices.mjs",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/calculation/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/calculation/protocol-admission.json",
});
const absolute = (path) => resolve(repositoryRoot, path);
const readJson = (path) => JSON.parse(readFileSync(absolute(path), "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(absolute(path))).digest("hex");
const clone = (value) => structuredClone(value);
const errors = [];
const checks = [];
const check = (id, condition, message) => {
  checks.push({check_id: id, result: condition ? "pass" : "fail"});
  if (!condition) errors.push({code: id, message});
};
const validateRef = (reference, label) => {
  const target = reference?.path === undefined ? "" : absolute(reference.path);
  const safe = target.startsWith(`${repositoryRoot}${sep}`) && existsSync(target) &&
    lstatSync(target).isFile() && !lstatSync(target).isSymbolicLink() && realpathSync(target) === target;
  check(`ref:${label}`, safe && /^[a-f0-9]{64}$/u.test(reference?.sha256 ?? "") &&
    sha256(reference.path) === reference.sha256, `${label} is unsafe, missing, or stale`);
};
const overlay = (profile, contractId = "calculation.profile-representation") =>
  profile.representation_overlays?.find((candidate) => candidate.contract_id === contractId);
const protocol = (profile) => overlay(profile)?.candidate_protocols?.[0];
const exactSet = (actual, expected) => actual.length === expected.length &&
  expected.every((value) => actual.includes(value));

const load = () => ({
  ontology: readJson(relative.ontology),
  projection: readJson(relative.projection),
  profiles: {
    typescript: readJson(relative.typescript),
    python: readJson(relative.python),
    rust: readJson(relative.rust),
  },
  decision: readJson(relative.decision),
  enumContinuity: readJson(relative.enumContinuity),
  descriptor: readJson(relative.descriptor),
  admission: readJson(relative.admission),
});

const validateBundle = (bundle) => {
  const local = [];
  const report = (code, message) => local.push({code, message});
  const {ontology, projection, profiles, decision, enumContinuity, descriptor, admission} = bundle;
  if (decision.selected_option_id !== "W2-CALCULATION-A-BOUND-PURE-VALUE" ||
      decision.portable_architecture?.type_id !== "architecture.CalculationImplementation") {
    report("CALCULATION_DECISION_DRIFT", "accepted W2 Calculation decision is not selected");
  }
  if (enumContinuity.result !== "pass" || enumContinuity.meta_type_id !== "DS-D1.3") {
    report("ENUM_CONTINUITY_NOT_PASSING", "Enum semantic-slice continuity must pass first");
  }
  const concepts = ontology.concept_types ?? [];
  const calculationTypes = concepts.filter(({concept_id}) =>
    concept_id === "architecture.CalculationImplementation");
  if (calculationTypes.length !== 1 || calculationTypes[0].extends !==
      "architecture.DomainConceptImplementation" || calculationTypes[0].canonical_meta_type_ref !== "DS-D1.6" ||
      !calculationTypes[0].source_refs?.includes("domainspec.calculation-form-decision") ||
      calculationTypes[0].canonical_mapping_status !== "candidate-alignment") {
    report("CALCULATION_ONTOLOGY_TYPE_INVALID", "Calculation type lacks exact reciprocal candidate binding");
  }
  const requiredProperties = [
    "binding.input_concepts", "binding.output_concept", "callable.effect_contract",
    "callable.dependency_contract", "callable.failure_contract", "callable.result_consumption",
    "callable.provider_id", "callable.provider_digest", "callable.descriptor_digest",
  ];
  const propertyMap = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  for (const propertyId of requiredProperties) {
    const property = propertyMap.get(propertyId);
    if (property === undefined || !property.applies_to?.types?.includes("architecture.CalculationImplementation") ||
        typeof property.observation_stage !== "string" || typeof property.owner_route !== "string" ||
        typeof property.forbidden_inference !== "string") {
      report("CALCULATION_PROPERTY_MISSING", propertyId);
    }
  }
  const expectedValues = {
    "callable.effect_contract": ["none"],
    "callable.dependency_contract": ["explicit-only"],
    "callable.failure_contract": ["declared"],
    "callable.result_consumption": ["complete"],
  };
  for (const [id, values] of Object.entries(expectedValues)) {
    if (!exactSet(propertyMap.get(id)?.value_type?.values ?? [], values)) {
      report("CALCULATION_PROPERTY_VALUE_DRIFT", id);
    }
  }
  const projected = projection.meta_types?.filter(({meta_type_id}) => meta_type_id === "DS-D1.6") ?? [];
  if (projected.length !== 1 || projected[0].mapping_status !== "candidate-mapped" ||
      projected[0].architecture_type_id !== "architecture.CalculationImplementation" ||
      projected[0].candidate_language_protocols?.length !== 3) {
    report("CALCULATION_PROJECTION_INVALID", "DS-D1.6 projection is not one candidate-mapped three-language record");
  }
  const expectedProtocol = {
    typescript: ["typescript.bound-calculation/v1", "typescript.calculation-arrow-function"],
    python: ["python.bound-calculation/v1", "python.calculation-function"],
    rust: ["rust.bound-calculation/v1", "rust.calculation-function"],
  };
  for (const [language, [protocolId, formId]] of Object.entries(expectedProtocol)) {
    const selectedOverlay = overlay(profiles[language]);
    const selectedProtocol = protocol(profiles[language]);
    if (selectedOverlay === undefined || selectedOverlay.admission_status !== "candidate-protocol-only" ||
        selectedOverlay.selection_mode !== "owner-decision-and-descriptor-digest" ||
        selectedProtocol?.protocol_id !== protocolId || selectedProtocol?.form_id !== formId ||
        selectedProtocol?.status !== "admitted-candidate-protocol" ||
        selectedProtocol?.implementation_status !== "provider-absent" ||
        selectedProtocol?.descriptor_contract?.return_semantics !== "value" ||
        selectedProtocol?.descriptor_contract?.effect_contract !== "none" ||
        selectedProtocol?.descriptor_contract?.dependency_contract !== "explicit-only" ||
        selectedProtocol?.descriptor_contract?.result_consumption !== "complete") {
      report("CALCULATION_PROFILE_PROTOCOL_INVALID", language);
    }
  }
  if (descriptor.schema_version !== "domainspec.calculation-cross-language-realization-descriptor/v1" ||
      descriptor.descriptor_status !== "candidate-protocol-only" || descriptor.meta_type_ref !== "DS-D1.6" ||
      descriptor.architecture_type_ref !== "architecture.CalculationImplementation" ||
      descriptor.language_bindings?.length !== 3 || descriptor.authority_effect !== "none") {
    report("CALCULATION_DESCRIPTOR_INVALID", "cross-language descriptor boundary drifted");
  }
  if (admission.schema_version !== "domainspec.calculation-protocol-admission/v1" ||
      admission.admission_status !== "candidate-protocol-only" || admission.result !== "pass" ||
      admission.meta_type_id !== "DS-D1.6" || admission.architecture_type_id !==
        "architecture.CalculationImplementation" || admission.selected_protocols?.length !== 3 ||
      admission.implementation_effects?.providers_created !== false ||
      admission.implementation_effects?.targets_created !== false ||
      admission.implementation_effects?.parity_proven !== false || admission.authority_effect !== "none") {
    report("CALCULATION_ADMISSION_INVALID", "protocol admission boundary or non-effects drifted");
  }
  return local;
};

const bundle = load();
errors.push(...validateBundle(bundle));
for (const reference of [
  bundle.admission.dependency_ref, bundle.admission.decision_ref, bundle.admission.descriptor_ref,
  ...bundle.admission.material_refs, bundle.descriptor.decision_ref,
  bundle.descriptor.enum_continuity_ref, ...bundle.descriptor.material_refs,
  ...bundle.descriptor.language_bindings.map(({profile_ref}) => profile_ref),
]) validateRef(reference, reference?.path ?? "missing");

const enumRun = spawnSync(process.execPath, [absolute(relative.enumValidator)], {
  cwd: repositoryRoot, encoding: "utf8",
});
let enumResult = null;
try { enumResult = JSON.parse(enumRun.stdout); } catch { /* reported */ }
check("enum-semantic-slice-continuity", enumRun.status === 0 && enumResult?.result === "pass",
  "Enum continuity no longer passes after Calculation admission");

const hostileCases = [
  ["boolean-return", "CALCULATION_PROFILE_PROTOCOL_INVALID", (hostile) => {
    protocol(hostile.profiles.typescript).descriptor_contract.return_semantics = "boolean";
  }],
  ["state-write-contract", "CALCULATION_PROFILE_PROTOCOL_INVALID", (hostile) => {
    protocol(hostile.profiles.python).descriptor_contract.effect_contract = "writes-state";
  }],
  ["implicit-dependency", "CALCULATION_PROFILE_PROTOCOL_INVALID", (hostile) => {
    protocol(hostile.profiles.rust).descriptor_contract.dependency_contract = "ambient-allowed";
  }],
  ["lazy-unconsumed-result", "CALCULATION_PROFILE_PROTOCOL_INVALID", (hostile) => {
    protocol(hostile.profiles.typescript).descriptor_contract.result_consumption = "partial";
  }],
  ["missing-provider-digest-property", "CALCULATION_PROPERTY_MISSING", (hostile) => {
    hostile.ontology.property_definitions = hostile.ontology.property_definitions.filter(
      ({property_id}) => property_id !== "callable.provider_digest");
  }],
  ["projection-unmapped", "CALCULATION_PROJECTION_INVALID", (hostile) => {
    hostile.projection.meta_types.find(({meta_type_id}) => meta_type_id === "DS-D1.6").mapping_status = "profiled-unmapped";
  }],
  ["provider-premature", "CALCULATION_PROFILE_PROTOCOL_INVALID", (hostile) => {
    protocol(hostile.profiles.python).implementation_status = "implemented-candidate";
  }],
  ["authority-inflation", "CALCULATION_ADMISSION_INVALID", (hostile) => {
    hostile.admission.authority_effect = "promotion";
  }],
];
const hostileValidations = [];
for (const [caseId, expectedCode, mutate] of hostileCases) {
  const hostile = clone(bundle);
  mutate(hostile);
  const killed = validateBundle(hostile).some(({code}) => code === expectedCode);
  hostileValidations.push({case_id: caseId, expected_code: expectedCode, result: killed ? "killed" : "survived"});
  check(`hostile:${caseId}`, killed, `${caseId} survived without ${expectedCode}`);
}

const result = {
  schema_version: "domainspec.rmt-calculation-admission-validation/v1",
  swu_id: "RMT-CALC-001",
  verdict: errors.length === 0 ? "pass" : "fail",
  checks_passed: checks.filter(({result: status}) => status === "pass").length,
  checks_total: checks.length,
  hostile_validations: hostileValidations,
  enum_continuity: enumResult === null ? null : {
    result: enumResult.result,
    checks_passed: enumResult.checks_passed,
    checks_total: enumResult.checks_total,
  },
  errors,
  implementation_status: {
    ontology_profile_descriptor: "candidate-admitted",
    typescript_provider: "absent",
    python_provider: "absent",
    rust_provider: "absent",
    independent_effect_observer: "not-executed",
    parity: "not-proven",
  },
  claim_ceiling: "candidate-only Calculation ontology/profile/protocol/descriptor admission with Enum semantic-slice continuity; no native provider, independent effect proof, parity, promotion, publication, deployment, release, or production proof",
  authority_effect: "none",
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
