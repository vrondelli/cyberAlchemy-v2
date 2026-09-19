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
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W1-ENTITY-001.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/entity/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/entity/protocol-admission.json",
  valueObjectReceipt: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-VO-007.json",
  valueObjectCandidate: "projects/domainspec-v2/development/remaining-meta-types/candidates/value-object.json"
});
const expectedImmutableDigests = Object.freeze({
  [paths.decision]: "de9c159ea4b65ab6d3508e94a731770724c87cdef5dd6333c41f231746438a9f",
  [paths.valueObjectReceipt]: "45de2a6f7fe7ef168697c5909251e44aaf17cc58e5ff2ac39bb4dc8b88a71387",
  [paths.valueObjectCandidate]: "c171dab764a6a31e961d38c13986b7b56142e532d46758217e0ebd8a782c073f"
});
const exactRoutes = Object.freeze([
  "factory",
  "deserialization-reconstruction",
  "lifecycle-transition",
  "language-visible-direct-constructor"
]);
const exactPipeline = Object.freeze([
  "normalize-and-apply-declared-defaults",
  "run-base-validators",
  "run-extension-validators",
  "resolve-stable-identity",
  "construct-entity-snapshot",
  "enforce-native-immutability"
]);
const expectedLanguages = Object.freeze({
  typescript: ["typescript.entity-factory-record", "typescript.validated-extensible-entity-factory/v1"],
  python: ["python.entity-dataclass", "python.validated-extensible-entity-factory/v1"],
  rust: ["rust.entity-struct", "rust.validated-extensible-entity-factory/v1"]
});
const expectedProperties = Object.freeze({
  "creation.extension_policy": "additive-only",
  "creation.validator_count": "integer-minimum-one-by-entity-profile",
  "creation.base_invariants_preserved": true,
  "identity.stable_across_lifecycle": true,
  "lifecycle.observation_mode": "immutable-snapshot-sequence"
});
const expectedRelations = Object.freeze([
  ["architecture.constructed_by", "architecture.EntityImplementation", "architecture.EntityFactoryProvider", "not-applicable"],
  ["architecture.validated_by", "architecture.EntityFactoryProvider", "architecture.RuleImplementation", "not-applicable"],
  ["architecture.extends_factory", "architecture.EntityFactoryProvider", "architecture.EntityFactoryProvider", "acyclic"]
]);

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const clone = (value) => structuredClone(value);
const absolute = (path) => resolve(root, path);
const safeBytes = (path) => {
  const target = absolute(path);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error(`ENTITY_PATH_ESCAPE:${path}`);
  if (!existsSync(target)) throw new Error(`ENTITY_PATH_MISSING:${path}`);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`ENTITY_PATH_NOT_REGULAR:${path}`);
  const real = realpathSync(target);
  if (real !== root && !real.startsWith(`${root}${sep}`)) throw new Error(`ENTITY_REALPATH_ESCAPE:${path}`);
  return readFileSync(real);
};
const sha = (path) => createHash("sha256").update(safeBytes(path)).digest("hex");
const readJson = (path) => JSON.parse(safeBytes(path).toString("utf8"));
const entityOverlays = (profile) => profile.representation_overlays?.filter(({contract_id}) => contract_id === "entity.profile-representation") ?? [];
const valueObjectOverlays = (profile) => profile.representation_overlays?.filter(({contract_id}) => contract_id === "value-object.profile-representation") ?? [];

const load = () => ({
  ontology: readJson(paths.ontology),
  projection: readJson(paths.projection),
  profiles: {
    typescript: readJson(paths.typescript),
    python: readJson(paths.python),
    rust: readJson(paths.rust)
  },
  decision: readJson(paths.decision),
  descriptor: readJson(paths.descriptor),
  admission: readJson(paths.admission),
  valueObjectReceipt: readJson(paths.valueObjectReceipt),
  valueObjectCandidate: readJson(paths.valueObjectCandidate)
});

const collectRefs = (bundle) => [
  bundle.descriptor.decision_ref,
  ...bundle.descriptor.value_object_continuity_refs,
  ...bundle.descriptor.material_refs,
  ...bundle.descriptor.language_bindings.map(({profile_ref}) => profile_ref),
  bundle.admission.decision_ref,
  bundle.admission.descriptor_ref,
  ...bundle.admission.dependency_refs,
  ...bundle.admission.material_refs,
  ...bundle.admission.selected_protocols.map(({profile_ref}) => profile_ref)
];

const validateBundle = (bundle) => {
  const failures = [];
  const fail = (code, detail) => failures.push({code, detail});
  const {ontology, projection, profiles, decision, descriptor, admission, valueObjectReceipt, valueObjectCandidate} = bundle;

  if (decision.selected_option_id !== "W1-ENTITY-A-VALIDATED-EXTENSIBLE-FACTORY" ||
      decision.meta_type_id !== "DS-D1.1" ||
      decision.portable_architecture?.type_id !== "architecture.EntityImplementation" ||
      decision.portable_architecture?.factory_provider_type_id !== "architecture.EntityFactoryProvider") {
    fail("ENTITY_DECISION_DRIFT", "accepted Entity decision is not exact");
  }

  const source = ontology.source_refs?.find(({source_id}) => source_id === "domainspec.entity-form-decision");
  if (source?.path !== paths.decision || source?.sha256 !== expectedImmutableDigests[paths.decision]) {
    fail("ENTITY_DECISION_SOURCE_INVALID", "ontology decision source is missing or stale");
  }
  const concepts = new Map((ontology.concept_types ?? []).map((item) => [item.concept_id, item]));
  const entity = concepts.get("architecture.EntityImplementation");
  const factory = concepts.get("architecture.EntityFactoryProvider");
  if (entity?.extends !== "architecture.DomainConceptImplementation" || entity?.canonical_meta_type_ref !== "DS-D1.1" ||
      entity?.candidate_status !== "candidate" || !entity?.source_refs?.includes("domainspec.entity-form-decision") ||
      factory?.extends !== "architecture.ArchitectureElement" || factory?.canonical_meta_type_ref !== undefined ||
      factory?.candidate_status !== "candidate" || !factory?.source_refs?.includes("domainspec.entity-form-decision")) {
    fail("ENTITY_TYPES_INVALID", "Entity or its support factory type drifted");
  }

  const properties = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  const extension = properties.get("creation.extension_policy");
  const entityExtension = extension?.type_value_contracts?.find(({type_id}) => type_id === "architecture.EntityFactoryProvider");
  const valueExtension = extension?.type_value_contracts?.find(({type_id}) => type_id === "architecture.ValueObjectFactoryProvider");
  if (!same(extension?.value_type?.values, ["additive-validation-only", "additive-only"]) ||
      !same(entityExtension?.allowed_values, ["additive-only"]) || !same(valueExtension?.allowed_values, ["additive-validation-only"])) {
    fail("ENTITY_EXTENSION_PROPERTY_INVALID", "type-specific extension values drifted");
  }
  const validatorCount = properties.get("creation.validator_count");
  if (validatorCount?.value_type?.kind !== "integer" || validatorCount?.value_type?.minimum !== 0 ||
      !validatorCount?.applies_to?.types?.includes("architecture.EntityFactoryProvider")) {
    fail("ENTITY_VALIDATOR_COUNT_PROPERTY_INVALID", "generic count must remain zero-minimum and Entity-profile constrained");
  }
  const expectedNodeProperties = Object.freeze({
    "creation.base_invariants_preserved": ["architecture.EntityFactoryProvider", "boolean", undefined],
    "identity.stable_across_lifecycle": ["architecture.EntityImplementation", "boolean", undefined],
    "lifecycle.observation_mode": ["architecture.EntityImplementation", "enum", ["immutable-snapshot-sequence"]]
  });
  for (const [id, [type, kind, values]] of Object.entries(expectedNodeProperties)) {
    const property = properties.get(id);
    if (property?.value_type?.kind !== kind || !property?.applies_to?.types?.includes(type) ||
        (values && !same(property?.value_type?.values, values)) || !property?.owner_route || !property?.forbidden_inference) {
      fail("ENTITY_PROPERTY_INVALID", id);
    }
  }

  const relations = new Map((ontology.relation_definitions ?? []).map((item) => [item.relation_id, item]));
  const allExpectedPairs = Object.freeze({
    "architecture.constructed_by": [
      {source_type: "architecture.ValueObjectImplementation", target_type: "architecture.ValueObjectFactoryProvider"},
      {source_type: "architecture.EntityImplementation", target_type: "architecture.EntityFactoryProvider"}
    ],
    "architecture.validated_by": [
      {source_type: "architecture.ValueObjectFactoryProvider", target_type: "architecture.RuleImplementation"},
      {source_type: "architecture.EntityFactoryProvider", target_type: "architecture.RuleImplementation"}
    ],
    "architecture.extends_factory": [
      {source_type: "architecture.ValueObjectFactoryProvider", target_type: "architecture.ValueObjectFactoryProvider"},
      {source_type: "architecture.EntityFactoryProvider", target_type: "architecture.EntityFactoryProvider"}
    ]
  });
  for (const [id, source, target, cycle] of expectedRelations) {
    const relation = relations.get(id);
    const pair = relation?.allowed_type_pairs?.find((item) => item.source_type === source && item.target_type === target);
    if (!pair || !same(relation?.allowed_type_pairs, allExpectedPairs[id]) || relation?.cycle_policy !== cycle || relation?.authority_effect !== "none") {
      fail("ENTITY_RELATION_INVALID", id);
    }
  }

  const projected = (projection.meta_types ?? []).filter(({meta_type_id}) => meta_type_id === "DS-D1.1");
  const projectionEntry = projected[0];
  if (projected.length !== 1 || projectionEntry?.maturity !== "active" || projectionEntry?.mapping_status !== "candidate-mapped" ||
      projectionEntry?.architecture_type_id !== "architecture.EntityImplementation" ||
      projectionEntry?.factory_provider_type_id !== "architecture.EntityFactoryProvider" ||
      !same(projectionEntry?.candidate_properties, Object.keys(expectedProperties)) ||
      !same(projectionEntry?.candidate_relations, expectedRelations.map(([id]) => id)) ||
      !same(projectionEntry?.construction_routes, exactRoutes) || projectionEntry?.candidate_language_protocols?.length !== 3) {
    fail("ENTITY_PROJECTION_INVALID", "DS-D1.1 projection is not exact");
  }

  for (const [language, [formId, protocolId]] of Object.entries(expectedLanguages)) {
    const matches = entityOverlays(profiles[language]);
    const selected = matches[0];
    const protocol = selected?.candidate_protocols?.[0];
    const contract = protocol?.descriptor_contract;
    if (matches.length !== 1 || selected?.language !== language || !same(selected?.admitted_forms, [formId]) ||
        selected?.admission_status !== "candidate-protocol-only" || protocol?.protocol_id !== protocolId ||
        protocol?.form_id !== formId || protocol?.status !== "admitted-candidate-protocol" ||
        protocol?.implementation_status !== "provider-absent" || contract?.identity_component_cardinality !== "one-or-more-typed" ||
        contract?.identity_stability !== "stable-across-every-lifecycle-snapshot" ||
        contract?.equality_mode !== "canonical-identity-only" || contract?.hash_mode !== "canonical-identity-only" ||
        contract?.immutability_mode !== "immutable-lifecycle-snapshots" ||
        contract?.lifecycle_observation_mode !== "immutable-snapshot-sequence" ||
        contract?.validator_binding !== "factory-definition" || contract?.validator_cardinality !== "one-or-more" ||
        contract?.validator_order !== "base-then-extension" || contract?.validation_failure !== "structured-failure-no-snapshot" ||
        contract?.base_invariants_preserved !== true || contract?.extension_policy !== "additive-only" ||
        contract?.extension_cycle_policy !== "acyclic" || !same(contract?.construction_routes, exactRoutes) ||
        contract?.construction_route_policy !== "all-admitted-routes-converge-on-owner-pipeline" ||
        contract?.direct_constructor_policy !== "private-inaccessible-or-delegating-facade" ||
        !same(contract?.construction_pipeline, exactPipeline)) {
      fail("ENTITY_PROFILE_INVALID", language);
    }
    const constraintKeys = new Set((selected?.representation_constraints ?? []).map((item) => item.property_id ?? item.descriptor_path));
    for (const key of ["representation.protocol_id", "identity_component_cardinality", "identity.stable_across_lifecycle",
      "equality_mode", "hash_mode", "lifecycle.observation_mode", "construction_routes", "construction_route_policy",
      "direct_constructor_policy", "construction_pipeline", "creation.base_invariants_preserved", "creation.validator_binding",
      "creation.validator_count", "creation.validator_bindings", "creation.extension_policy", "creation.extension_cycle_policy"]) {
      if (!constraintKeys.has(key)) fail("ENTITY_PROFILE_CONSTRAINT_MISSING", `${language}:${key}`);
    }
  }

  const portable = descriptor.portable_architecture;
  const expectedProtocolProjection = Object.entries(expectedLanguages).map(([language, [form_id, protocol_id]]) => ({
    language,
    form_id,
    protocol_id,
    status: "admitted-candidate-protocol",
    implementation_status: "provider-absent"
  }));
  const descriptorProtocolProjection = descriptor.language_bindings?.map(({language, form_id, protocol_id, status, implementation_status}) => ({
    language, form_id, protocol_id, status, implementation_status
  }));
  const admissionProtocolProjection = admission.selected_protocols?.map(({language, form_id, protocol_id, status, implementation_status}) => ({
    language, form_id, protocol_id, status, implementation_status
  }));
  if (descriptor.schema_version !== "domainspec.entity-cross-language-realization-descriptor/v1" ||
      descriptor.descriptor_id !== "domainspec.entity.stable-identity-lifecycle-factory/v1" ||
      descriptor.descriptor_protocol_id !== "domainspec.validated-extensible-entity-factory/v1" ||
      descriptor.descriptor_status !== "candidate-protocol-only" || descriptor.meta_type_ref !== "DS-D1.1" ||
      descriptor.architecture_type_ref !== "architecture.EntityImplementation" ||
      descriptor.factory_provider_type_ref !== "architecture.EntityFactoryProvider" ||
      !same(portable?.properties, expectedProperties) || !same(portable?.construction_routes, exactRoutes) ||
      !same(portable?.construction_pipeline, exactPipeline) || portable?.identity_contract?.component_cardinality !== "one-or-more-typed" ||
      portable?.identity_contract?.equality !== "canonical-identity-only" || portable?.identity_contract?.hash !== "canonical-identity-only" ||
      portable?.validator_contract?.cardinality !== "one-or-more" || portable?.validator_contract?.failure !== "structured-failure-no-snapshot" ||
      portable?.extension_contract?.policy !== "additive-only" || portable?.extension_contract?.cycle_policy !== "acyclic" ||
      !same(descriptorProtocolProjection, expectedProtocolProjection) || descriptor.proof_contract?.positive_obligations?.length !== 5 ||
      descriptor.proof_contract?.semantic_hostiles?.length !== 7 || descriptor.authority_effect !== "none") {
    fail("ENTITY_DESCRIPTOR_INVALID", "descriptor boundary drifted");
  }
  if (admission.schema_version !== "domainspec.entity-protocol-admission/v1" || admission.result !== "pass" ||
      admission.admission_status !== "candidate-protocol-only" || admission.meta_type_id !== "DS-D1.1" ||
      admission.architecture_type_id !== "architecture.EntityImplementation" ||
      admission.factory_provider_type_id !== "architecture.EntityFactoryProvider" ||
      !same(admission.selected_properties, Object.entries(expectedProperties).map(([property_id, expected]) => ({property_id, expected}))) ||
      !same(admission.construction_routes, exactRoutes) || admission.selected_relations?.length !== 3 ||
      !same(admissionProtocolProjection, expectedProtocolProjection) || admission.proof_denominator?.positive_obligations !== "5/5" ||
      admission.proof_denominator?.semantic_hostiles !== "7/7" || admission.proof_denominator?.construction_routes !== "4/4" ||
      admission.implementation_effects?.providers_created !== false || admission.implementation_effects?.targets_created !== false ||
      admission.implementation_effects?.native_entity_behavior_proven !== false || admission.authority_effect !== "none") {
    fail("ENTITY_ADMISSION_INVALID", "admission boundary or non-effects drifted");
  }

  for (const ref of collectRefs(bundle)) {
    try {
      if (sha(ref?.path) !== ref?.sha256) fail("STALE_DIGEST", ref?.path ?? "missing");
    } catch (error) {
      fail("STALE_DIGEST", `${ref?.path ?? "missing"}:${error.message}`);
    }
  }

  if (valueObjectReceipt.swu_id !== "RMT-VO-007" || valueObjectReceipt.result !== "pass" ||
      valueObjectReceipt.candidate_projection?.meta_type_id !== "DS-D1.2" ||
      valueObjectReceipt.candidate_projection?.architecture_type_id !== "architecture.ValueObjectImplementation" ||
      valueObjectCandidate.meta_type?.id !== "DS-D1.2" ||
      valueObjectCandidate.architecture_implementation?.type_id !== "architecture.ValueObjectImplementation" ||
      valueObjectCandidate.architecture_implementation?.value_contract?.equality_mode !== "complete-normalized-tuple" ||
      valueObjectCandidate.architecture_implementation?.factory_contract?.extension_policy !== "additive-validation-only" ||
      valueObjectCandidate.lifecycle?.authority_effect !== "none") {
    fail("VALUE_OBJECT_007_CONTINUITY_INVALID", "live Value Object candidate or receipt drifted");
  }
  const valueConcept = concepts.get("architecture.ValueObjectImplementation");
  const valueFactory = concepts.get("architecture.ValueObjectFactoryProvider");
  if (valueConcept?.canonical_meta_type_ref !== "DS-D1.2" || valueFactory?.canonical_meta_type_ref !== undefined ||
      !same(valueExtension?.allowed_values, ["additive-validation-only"])) {
    fail("VALUE_OBJECT_SEMANTIC_SLICE_INVALID", "Value Object type-specific meaning changed");
  }
  for (const [language, profile] of Object.entries(profiles)) {
    const vo = valueObjectOverlays(profile);
    const contract = vo[0]?.candidate_protocols?.[0]?.descriptor_contract;
    if (vo.length !== 1 || contract?.equality_mode !== "complete-normalized-tuple" ||
        contract?.hash_mode !== "same-normalized-complete-tuple" ||
        contract?.extension_policy !== "additive-validation-only") {
      fail("VALUE_OBJECT_PROFILE_SLICE_INVALID", language);
    }
  }
  if (admission.semantic_continuity?.prior_value_object_whole_file_ontology_projection_and_profile_hashes !==
        "historical-admission-snapshots-after-monotonic-shared-material-growth" ||
      admission.semantic_continuity?.current_value_object_receipt_and_candidate_refs !== "live-and-rehashable" ||
      admission.semantic_continuity?.value_object_semantic_slices_preserved !== true) {
    fail("VALUE_OBJECT_CONTINUITY_CLAIM_INVALID", "historical whole-file boundary is misstated");
  }
  return failures;
};

const positiveModel = Object.freeze({
  identity_components: Object.freeze([{name: "settlement_id", type_id: "SettlementId"}]),
  identity_resolver: "owner.settlement-id-resolver/v1",
  expected_identity_resolver: "owner.settlement-id-resolver/v1",
  equality_mode: "canonical-identity-only",
  hash_mode: "canonical-identity-only",
  validator_binding: "factory-definition",
  base_validators: Object.freeze(["rule.settlement-id-valid@sha256:a"]),
  extension_validators: Object.freeze(["rule.amount-nonnegative@sha256:b"]),
  per_call_validator_allowed: false,
  pipeline: exactPipeline,
  valid_input_snapshot_count: 1,
  invalid_input_snapshot_created: false,
  structured_failure: "structured-failure-no-snapshot",
  snapshots: Object.freeze([
    Object.freeze({identity: "settlement-42", state: "pending", immutable: true}),
    Object.freeze({identity: "settlement-42", state: "complete", immutable: true})
  ]),
  same_identity_different_state_equal: true,
  distinct_identities_equal: false,
  extension_policy: "additive-only",
  base_invariants_preserved: true,
  extension_cycle: false,
  routes: Object.freeze(exactRoutes.map((route_id) => Object.freeze({route_id, converges_on_pipeline: true}))),
  direct_constructor_policy: "private-inaccessible-or-delegating-facade"
});

const validateModel = (model) => {
  const failures = [];
  if (!Array.isArray(model.identity_components) || model.identity_components.length < 1 ||
      model.identity_components.some(({name, type_id}) => !name || !type_id)) failures.push("TYPED_IDENTITY_MISSING");
  if (!same(model.pipeline, exactPipeline) || model.validator_binding !== "factory-definition") failures.push("CONSTRUCTION_PIPELINE_INVALID");
  if (!Array.isArray(model.base_validators) || model.base_validators.length < 1) failures.push("BASE_VALIDATOR_REMOVED");
  if (model.per_call_validator_allowed !== false) failures.push("PER_CALL_VALIDATOR_BYPASS");
  if (model.identity_resolver !== model.expected_identity_resolver) failures.push("IDENTITY_RESOLVER_REPLACED");
  if (model.extension_policy !== "additive-only" || model.base_invariants_preserved !== true) failures.push("BASE_INVARIANTS_WEAKENED");
  if (model.extension_cycle !== false) failures.push("EXTENSION_CYCLE");
  if (model.invalid_input_snapshot_created !== false || model.structured_failure !== "structured-failure-no-snapshot") {
    failures.push("INVALID_INPUT_FORMED_SNAPSHOT");
  }
  if (model.valid_input_snapshot_count !== 1) failures.push("VALID_FORMATION_COUNT_INVALID");
  if (model.snapshots?.some(({immutable}) => immutable !== true)) failures.push("SNAPSHOT_MUTABLE");
  if (model.snapshots?.length !== 2 || model.snapshots[0].identity !== model.snapshots[1].identity) failures.push("LIFECYCLE_IDENTITY_UNSTABLE");
  if (model.equality_mode !== "canonical-identity-only" || model.hash_mode !== "canonical-identity-only") {
    failures.push("COMPLETE_FIELD_EQUALITY");
  }
  if (model.same_identity_different_state_equal !== true || model.distinct_identities_equal !== false) failures.push("IDENTITY_EQUALITY_INVALID");
  if (!same(model.routes?.map(({route_id}) => route_id), exactRoutes) || model.routes?.some(({converges_on_pipeline}) => !converges_on_pipeline) ||
      model.direct_constructor_policy !== "private-inaccessible-or-delegating-facade") failures.push("CONSTRUCTION_ROUTE_INVALID");
  return failures;
};

const positiveObligations = (model) => Object.freeze([
  {obligation_id: "validators-before-construction", result: model.validator_binding === "factory-definition" && same(model.pipeline, exactPipeline) ? "pass" : "fail"},
  {obligation_id: "valid-input-one-immutable-snapshot", result: model.valid_input_snapshot_count === 1 && model.snapshots.every(({immutable}) => immutable) ? "pass" : "fail"},
  {obligation_id: "lifecycle-transition-preserves-identity", result: model.snapshots[0].identity === model.snapshots[1].identity ? "pass" : "fail"},
  {obligation_id: "same-identity-different-state-equal", result: model.snapshots[0].state !== model.snapshots[1].state && model.same_identity_different_state_equal ? "pass" : "fail"},
  {obligation_id: "distinct-identities-remain-distinct", result: model.distinct_identities_equal === false ? "pass" : "fail"}
]);

const hostileMutations = Object.freeze([
  {mutation_id: "per-call-always-true", expected: "PER_CALL_VALIDATOR_BYPASS", apply: (model) => { model.per_call_validator_allowed = true; }},
  {mutation_id: "remove-base-validator", expected: "BASE_VALIDATOR_REMOVED", apply: (model) => { model.base_validators = []; }},
  {mutation_id: "replace-identity-resolver", expected: "IDENTITY_RESOLVER_REPLACED", apply: (model) => { model.identity_resolver = "foreign.resolver/v1"; }},
  {mutation_id: "allow-extension-cycle", expected: "EXTENSION_CYCLE", apply: (model) => { model.extension_cycle = true; }},
  {mutation_id: "invalid-input-forms-snapshot", expected: "INVALID_INPUT_FORMED_SNAPSHOT", apply: (model) => { model.invalid_input_snapshot_created = true; }},
  {mutation_id: "mutate-constructed-snapshot", expected: "SNAPSHOT_MUTABLE", apply: (model) => { model.snapshots[0].immutable = false; }},
  {mutation_id: "complete-field-equality", expected: "COMPLETE_FIELD_EQUALITY", apply: (model) => { model.equality_mode = "complete-field"; model.hash_mode = "complete-field"; }}
]);

const routeResults = (model) => model.routes.map(({route_id, converges_on_pipeline}) => ({
  route_id,
  result: converges_on_pipeline && exactRoutes.includes(route_id) ? "pass" : "fail"
}));

const structuralControls = (bundle) => {
  const controls = [];
  const run = (control_id, mutate, expected) => {
    const candidate = clone(bundle);
    mutate(candidate);
    const findings = validateBundle(candidate);
    controls.push({control_id, expected, findings: findings.map(({code}) => code), result: findings.some(({code}) => code === expected) ? "killed" : "survived"});
  };
  run("stale-digest", (candidate) => { candidate.descriptor.material_refs[0].sha256 = "0".repeat(64); }, "STALE_DIGEST");
  run("wrong-protocol", (candidate) => { candidate.admission.selected_protocols[0].protocol_id = "typescript.wrong/v1"; }, "ENTITY_ADMISSION_INVALID");
  run("wrong-relation-pair", (candidate) => {
    candidate.ontology.relation_definitions.find(({relation_id}) => relation_id === "architecture.constructed_by").allowed_type_pairs[1].target_type = "architecture.ValueObjectFactoryProvider";
  }, "ENTITY_RELATION_INVALID");
  run("extension-cycle-allowed", (candidate) => { candidate.descriptor.portable_architecture.extension_contract.cycle_policy = "allowed"; }, "ENTITY_DESCRIPTOR_INVALID");
  run("authority-escalation", (candidate) => { candidate.admission.authority_effect = "promotion"; }, "ENTITY_ADMISSION_INVALID");
  return controls;
};

let output;
try {
  for (const [path, expected] of Object.entries(expectedImmutableDigests)) {
    if (sha(path) !== expected) throw new Error(`ENTITY_IMMUTABLE_INPUT_STALE:${path}`);
  }
  const bundle = load();
  const bundleFailures = validateBundle(bundle);
  const modelFailures = validateModel(clone(positiveModel));
  const positives = positiveObligations(positiveModel);
  const hostiles = hostileMutations.map(({mutation_id, expected, apply}) => {
    const candidate = clone(positiveModel);
    apply(candidate);
    const findings = validateModel(candidate);
    return {mutation_id, expected, findings, result: findings.includes(expected) ? "killed" : "survived"};
  });
  const routes = routeResults(positiveModel);
  const controls = structuralControls(bundle);
  const errors = [
    ...bundleFailures.map(({code, detail}) => `${code}:${detail}`),
    ...modelFailures,
    ...positives.filter(({result}) => result !== "pass").map(({obligation_id}) => `POSITIVE_FAILED:${obligation_id}`),
    ...hostiles.filter(({result}) => result !== "killed").map(({mutation_id}) => `HOSTILE_SURVIVED:${mutation_id}`),
    ...routes.filter(({result}) => result !== "pass").map(({route_id}) => `ROUTE_FAILED:${route_id}`),
    ...controls.filter(({result}) => result !== "killed").map(({control_id}) => `STRUCTURAL_SURVIVED:${control_id}`)
  ];
  output = {
    schema_version: "domainspec.rmt-entity-admission-validation/v1",
    swu_id: "RMT-ENTITY-001",
    verdict: errors.length === 0 ? "pass" : "fail",
    positive_obligations: {passed: positives.filter(({result}) => result === "pass").length, total: positives.length, results: positives},
    semantic_hostiles: {killed: hostiles.filter(({result}) => result === "killed").length, total: hostiles.length, results: hostiles},
    construction_routes: {passed: routes.filter(({result}) => result === "pass").length, total: routes.length, results: routes},
    structural_controls: {killed: controls.filter(({result}) => result === "killed").length, total: controls.length, results: controls},
    value_object_semantic_continuity: errors.some((item) => item.includes("VALUE_OBJECT")) ? "fail" : "pass",
    implementation_status: {
      provider: "absent",
      target: "absent",
      native_lifecycle_proof: false,
      reconstruction_proof: false,
      family_proof: false,
      parity: false
    },
    authority_effect: "none",
    claim_ceiling: "Candidate-only Entity ontology, projection, language-profile protocol, descriptor admission, synthetic 5/5 semantic positives, 7/7 hostile controls, and 4/4 construction-route model checks; no provider, target, native lifecycle or reconstruction proof, family proof, parity, promotion, publication, release, deployment, or production claim.",
    errors
  };
} catch (error) {
  output = {
    schema_version: "domainspec.rmt-entity-admission-validation/v1",
    swu_id: "RMT-ENTITY-001",
    verdict: "fail",
    authority_effect: "none",
    errors: [error instanceof Error ? error.message : String(error)]
  };
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = output.verdict === "pass" ? 0 : 1;
