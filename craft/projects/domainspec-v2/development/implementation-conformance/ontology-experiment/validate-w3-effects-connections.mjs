import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(experimentRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(resolve(repoRoot, path))).digest("hex");
const errors = [];
const checks = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const ontologyPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
const projectionPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json";
const profilePaths = {
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
};
const historicalTypeScriptProfilePath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/legacy-whole-file-snapshots/enum-v1/typescript-strict.profile.json";
const providerPaths = {
  typescript: "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/providers/typescript/financial-settlement.ts",
  python: "projects/domainspec-v2/impl/architecture-conformance/targets/python/w3.py",
  rust: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w3.rs",
};
const descriptorPath = "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json";
const observationPath = "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/observations.json";

const ontology = readJson(ontologyPath);
const projection = readJson(projectionPath);
const concepts = new Map(ontology.concept_types.map((item) => [item.concept_id, item]));
const properties = new Set(ontology.property_definitions.map((item) => item.property_id));
const relations = new Map(ontology.relation_definitions.map((item) => [item.relation_id, item]));

const requiredConcepts = new Map([
  ["architecture.MappingImplementation", "DS-D1.13"],
  ["architecture.InterfaceImplementation", "DS-D1.11"],
  ["architecture.EventImplementation", "DS-D1.12"],
  ["architecture.OperationImplementation", "DS-D1.4"],
]);
for (const [typeId, metaTypeId] of requiredConcepts) {
  const concept = concepts.get(typeId);
  expect(concept?.extends === "architecture.DomainConceptImplementation", `${typeId} must extend DomainConceptImplementation`);
  expect(concept?.canonical_meta_type_ref === metaTypeId, `${typeId} must reciprocally bind ${metaTypeId}`);
}
expect(concepts.get("architecture.InterfaceImplementation")?.candidate_status === "candidate", "implemented Interface realization must be candidate");
expect(concepts.get("architecture.DataShapeContract")?.canonical_mapping_status === "architecture-role-only", "DataShapeContract must remain architecture-only");
checks.push("W3 ontology types and Interface admission boundary");

const requiredProperties = [
  "mapping.source_contract_ref", "mapping.target_contract_ref", "mapping.direction", "mapping.correspondence_ref", "mapping.totality", "mapping.failure_contract_ref", "mapping.effect_policy",
  "interface.boundary_kind", "interface.contract_identity", "interface.exact_version", "interface.compatibility_policy_ref", "interface.exposure_set_ref",
  "event.tense", "event.payload_contract_ref", "event.payload_version", "event.occurrence_identity_contract_ref", "event.fact_checkpoint", "event.publication_policy_ref", "event.consumer_contracts_ref",
  "operation.input_contract_ref", "operation.declared_read_set_ref", "operation.declared_write_set_ref", "operation.declared_external_effect_set_ref", "operation.outcome_contract_ref", "operation.failure_contract_ref", "operation.atomicity_contract_ref", "operation.order_contract_ref", "operation.guard_bindings_ref", "operation.emitted_event_bindings_ref", "operation.continuation_boundary",
];
for (const property of requiredProperties) expect(properties.has(property), `missing W3 property ${property}`);
checks.push(`${requiredProperties.length} W3 properties`);

const requiredRelations = {
  "architecture.maps_from": ["architecture.MappingImplementation", "architecture.DataShapeContract"],
  "architecture.maps_to": ["architecture.MappingImplementation", "architecture.DataShapeContract"],
  "architecture.exposes": ["architecture.InterfaceImplementation", "architecture.OperationImplementation"],
  "architecture.emits": ["architecture.OperationImplementation", "architecture.EventImplementation"],
  "architecture.consumes": ["architecture.ArchitectureElement", "architecture.EventImplementation"],
  "architecture.guards": ["architecture.RuleImplementation", "architecture.OperationImplementation"],
};
for (const [relationId, [source, target]] of Object.entries(requiredRelations)) {
  const relation = relations.get(relationId);
  expect(relation?.source_types.includes(source), `${relationId} missing source ${source}`);
  expect(relation?.target_types.includes(target), `${relationId} missing target ${target}`);
  expect(relation?.authority_effect === "none", `${relationId} must not carry authority`);
}
checks.push("typed Mapping, Interface, Event, Operation relations");

for (const [typeId, metaTypeId] of requiredConcepts) {
  const item = projection.meta_types.find((candidate) => candidate.meta_type_id === metaTypeId);
  expect(item?.mapping_status === "candidate-mapped" && item?.architecture_type_id === typeId, `${metaTypeId} projection must map to ${typeId}`);
}
checks.push("reciprocal DS-D1 projection");

const contractIds = ["mapping.profile-representation", "interface.profile-representation", "event.profile-representation", "operation.profile-representation"];
const formIds = {
  typescript: ["typescript.bound-mapping-function", "typescript.bound-interface-structural", "typescript.bound-event-readonly-record", "typescript.bound-operation-function"],
  python: ["python.bound-mapping-function", "python.bound-interface-protocol", "python.bound-event-frozen-record", "python.bound-operation-function"],
  rust: ["rust.bound-mapping-function", "rust.bound-interface-trait", "rust.bound-event-struct", "rust.bound-operation-function"],
};
for (const [language, profilePath] of Object.entries(profilePaths)) {
  const profile = readJson(profilePath);
  const providerDigest = sha256(providerPaths[language]);
  const providerSource = readFileSync(resolve(repoRoot, providerPaths[language]), "utf8");
  contractIds.forEach((contractId, index) => {
    const overlay = profile.representation_overlays.find((item) => item.contract_id === contractId);
    expect(overlay?.admitted_forms.includes(formIds[language][index]), `${language} ${contractId} form is not admitted`);
    const protocol = overlay?.candidate_protocols?.[0];
    expect(protocol?.runtime_provider?.provider_sha256 === providerDigest, `${language} ${contractId} provider digest drift`);
    expect(protocol?.runtime_provider?.module_path === providerPaths[language], `${language} ${contractId} provider path drift`);
    for (const exported of protocol?.runtime_provider?.required_exports ?? []) {
      expect(providerSource.includes(exported), `${language} provider is missing declared export ${exported}`);
    }
    if (contractId === "interface.profile-representation") expect(overlay?.admission_status === "candidate", `${language} implemented Interface profile must be candidate`);
  });
}
checks.push("12 language protocol bindings with exact provider digests");

const descriptors = readJson(descriptorPath);
const observations = readJson(observationPath);
expect(descriptors.descriptors.length === 4, "descriptor set must contain four W3 descriptors");
expect(observations.observations.length === 4, "observation set must contain four W3 observations");
const registryDigest = sha256("projects/domainspec-v2/definitions/meta-types/meta-types.yml");
// Existing W3 descriptors are immutable historical evidence. Their broad profile
// reference remains bound to the exact pre-Calculation snapshot, while the loop
// above selects and validates the current W3 overlays from the live profile.
const typescriptProfileDigest = sha256(historicalTypeScriptProfilePath);
const providerDigest = sha256(providerPaths.typescript);
const observationDigest = sha256(observationPath);
const decisions = {
  Mapping: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W3-MAPPING-001.json",
  Interface: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W3-INTERFACE-001.json",
  Event: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W3-EVENT-001.json",
  Operation: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W3-OPERATION-001.json",
};
descriptors.descriptors.forEach((descriptor, index) => {
  const binding = descriptor.binding;
  expect(binding.protocol_id === "domainspec.w3-descriptor-binding/v1", `${descriptor.kind} descriptor protocol drift`);
  expect(binding.concept_ref.sha256 === registryDigest, `${descriptor.kind} concept registry digest drift`);
  expect(binding.decision_ref.sha256 === sha256(decisions[descriptor.kind]), `${descriptor.kind} decision digest drift`);
  expect(binding.profile_ref.sha256 === typescriptProfileDigest, `${descriptor.kind} profile digest drift`);
  expect(binding.provider_ref.sha256 === providerDigest && binding.source_ref.sha256 === providerDigest, `${descriptor.kind} provider/source digest drift`);
  expect(binding.fixture_ref.sha256 === observationDigest, `${descriptor.kind} fixture digest drift`);
  expect(descriptor.kind === observations.observations[index]?.kind, `${descriptor.kind} observation join drift`);
  expect(descriptor.claim_ceiling === "candidate-local-exact-fixture" && descriptor.authority_effect === "none", `${descriptor.kind} claim ceiling drift`);
});
const event = descriptors.descriptors.find((item) => item.kind === "Event");
expect(event?.distributed_exactly_once_claim === false, "Event descriptor must forbid distributed exactly-once inflation");
const interfaceDescriptor = descriptors.descriptors.find((item) => item.kind === "Interface");
expect(interfaceDescriptor?.admission_status === "candidate", "implemented Interface descriptor must be candidate");
checks.push("four exact content-addressed descriptor joins");

const result = {
  schema_version: "domainspec.w3-validation/v1",
  verdict: errors.length === 0 ? "pass" : "fail",
  checks,
  errors,
  claim_ceiling: "candidate-local ontology, profiles, provider-source bindings, and fixtures; hostile accounting and native execution remain separately required validation evidence; no promotion, release, or production proof",
  authority_effect: "none",
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
