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
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W1-VALUE-OBJECT-001.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/value-object/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/value-object/protocol-admission.json",
  queryReceipt: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-QUERY-007.json",
  queryCandidate: "projects/domainspec-v2/development/remaining-meta-types/candidates/query.json"
});
const expectedDigests = Object.freeze({
  [paths.ontology]: "a01a69e4033ed7823a46ff85c52f3004d0be89d100f3f1c400b4e950d9aaecea",
  [paths.projection]: "22bef93abe8b21d278eafe50150e107adeedc55d84f105c0e92a69e5d2750d29",
  [paths.typescript]: "6f0657cc4c3497c5af8def0ce48e4fee37ae5d5b9288902c24bdacb4a02eec49",
  [paths.python]: "07f959f44f0561f4fdb8916291cb7caff8618de190b2422eb2a891d5aef4c612",
  [paths.rust]: "e40cddc9d21a507f42a32117bd54beaecf037044e7a3a7cedc02df8b59eb0d41",
  [paths.decision]: "06841c0db26b36c43f5a2d94de42c01252a413e87903495f22a3cd5c54fd038a",
  [paths.descriptor]: "2279aca8a8494a1ffee40ef2f4164bffaa269c29d1fb2365480e11784361ca26",
  [paths.queryReceipt]: "f8edd4c467ef678b1d644daf2b6be61234269bc5f3e0ce0af2d353f6fa62b910",
  [paths.queryCandidate]: "eec263c266549df778472f529512c5b38842cedc2d375e3e4552228d745eeaa5"
});
const absolute = (path) => resolve(root, path);
const sha = (path) => createHash("sha256").update(readFileSync(absolute(path))).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(absolute(path), "utf8"));
const clone = (value) => structuredClone(value);
const overlay = (profile) => profile.representation_overlays?.filter(({contract_id}) => contract_id === "value-object.profile-representation") ?? [];
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

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
  queryReceipt: readJson(paths.queryReceipt),
  queryCandidate: readJson(paths.queryCandidate)
});

const validateBundle = (bundle, digestMap) => {
  const failures = [];
  const fail = (code, detail) => failures.push({code, detail});
  const {ontology, projection, profiles, decision, descriptor, admission, queryReceipt, queryCandidate} = bundle;
  if (decision.selected_option_id !== "W1-VALUE-A-OWNED-VALUE-PROTOCOL" ||
      decision.meta_type_id !== "DS-D1.2" ||
      decision.portable_architecture?.type_id !== "architecture.ValueObjectImplementation" ||
      decision.portable_architecture?.factory_provider_type_id !== "architecture.ValueObjectFactoryProvider") {
    fail("VALUE_OBJECT_DECISION_DRIFT", "W1 Value Object A is not the exact selected boundary");
  }

  const concepts = new Map((ontology.concept_types ?? []).map((item) => [item.concept_id, item]));
  const valueObject = concepts.get("architecture.ValueObjectImplementation");
  const factory = concepts.get("architecture.ValueObjectFactoryProvider");
  const rule = concepts.get("architecture.RuleImplementation");
  if (valueObject?.extends !== "architecture.DomainConceptImplementation" ||
      valueObject?.canonical_meta_type_ref !== "DS-D1.2" ||
      !valueObject?.source_refs?.includes("domainspec.value-object-form-decision") ||
      factory?.extends !== "architecture.ArchitectureElement" ||
      factory?.canonical_meta_type_ref !== undefined ||
      rule?.concept_id !== "architecture.RuleImplementation") {
    fail("VALUE_OBJECT_TYPES_INVALID", "Value Object, factory provider, or Rule reciprocal types drifted");
  }

  const properties = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  const expectedProperties = Object.freeze({
    "creation.extension_policy": ["architecture.ValueObjectFactoryProvider", "additive-validation-only"],
    "creation.validator_count": ["architecture.ValueObjectFactoryProvider", 0],
    "value.equality_mode": ["architecture.ValueObjectImplementation", "complete-normalized-tuple"],
    "value.hash_mode": ["architecture.ValueObjectImplementation", "same-normalized-complete-tuple"],
    "value.immutability_mode": ["architecture.ValueObjectImplementation", "formed-and-recursive-owned-components"]
  });
  for (const [id, [type, expected]] of Object.entries(expectedProperties)) {
    const property = properties.get(id);
    const admitted = property?.value_type?.kind === "integer" ? property.value_type.minimum : property?.value_type?.values?.[0];
    if (!property?.applies_to?.types?.includes(type) || admitted !== expected || !property?.observation_stage ||
        !property?.owner_route || !property?.forbidden_inference) fail("VALUE_OBJECT_PROPERTY_INVALID", id);
  }

  const relations = new Map((ontology.relation_definitions ?? []).map((item) => [item.relation_id, item]));
  const expectedRelations = Object.freeze({
    "architecture.constructed_by": ["architecture.ValueObjectImplementation", "architecture.ValueObjectFactoryProvider", "not-applicable"],
    "architecture.validated_by": ["architecture.ValueObjectFactoryProvider", "architecture.RuleImplementation", "not-applicable"],
    "architecture.extends_factory": ["architecture.ValueObjectFactoryProvider", "architecture.ValueObjectFactoryProvider", "acyclic"]
  });
  for (const [id, [source, target, cycle]] of Object.entries(expectedRelations)) {
    const relation = relations.get(id);
    if (!same(relation?.source_types, [source]) || !same(relation?.target_types, [target]) ||
        relation?.cycle_policy !== cycle || relation?.authority_effect !== "none") fail("VALUE_OBJECT_RELATION_INVALID", id);
  }

  const projected = (projection.meta_types ?? []).filter(({meta_type_id}) => meta_type_id === "DS-D1.2");
  const projectionEntry = projected[0];
  if (projected.length !== 1 || projectionEntry?.maturity !== "active" || projectionEntry?.mapping_status !== "candidate-mapped" ||
      projectionEntry?.architecture_type_id !== "architecture.ValueObjectImplementation" ||
      projectionEntry?.factory_provider_type_id !== "architecture.ValueObjectFactoryProvider" ||
      !same(projectionEntry?.candidate_properties, Object.keys(expectedProperties)) ||
      !same(projectionEntry?.candidate_relations, Object.keys(expectedRelations)) ||
      projectionEntry?.candidate_language_protocols?.length !== 3) {
    fail("VALUE_OBJECT_PROJECTION_INVALID", "DS-D1.2 reciprocal projection drifted");
  }

  const expectedLanguages = Object.freeze({
    typescript: ["typescript.value-object-factory", "typescript.owned-value-object-factory/v1", "typescript.owned-value-component/v1"],
    python: ["python.frozen-dataclass-value-object", "python.owned-value-object-factory/v1", "python.owned-value-component/v1"],
    rust: ["rust.value-object-struct", "rust.owned-value-object-factory/v1", "rust.eq-hash-value-component/v1"]
  });
  for (const [language, [formId, protocolId, componentId]] of Object.entries(expectedLanguages)) {
    const matches = overlay(profiles[language]);
    const selected = matches[0];
    const protocol = selected?.candidate_protocols?.[0];
    const contract = protocol?.descriptor_contract;
    if (matches.length !== 1 || selected?.language !== language || !same(selected?.admitted_forms, [formId]) ||
        selected?.admission_status !== "candidate-protocol-only" || protocol?.protocol_id !== protocolId ||
        protocol?.form_id !== formId || protocol?.status !== "admitted-candidate-protocol" ||
        protocol?.implementation_status !== "provider-absent" ||
        contract?.equality_mode !== "complete-normalized-tuple" ||
        contract?.hash_mode !== "same-normalized-complete-tuple" ||
        contract?.immutability_mode !== "formed-and-recursive-owned-components" ||
        contract?.validator_binding !== "factory-definition" || contract?.validator_cardinality !== "zero-or-more" ||
        contract?.validation_failure !== "structured-failure-no-formation" ||
        contract?.extension_policy !== "additive-validation-only" || contract?.extension_cycle_policy !== "acyclic" ||
        contract?.component_protocol_id !== componentId ||
        protocol?.component_domain?.admission !== "exact-current-owner-protocol-identity-and-digest" ||
        protocol?.component_domain?.component_protocol_id !== componentId ||
        protocol?.component_domain?.component_protocol_sha256 !== "required-before-activation") {
      fail("VALUE_OBJECT_PROFILE_INVALID", language);
    }
    const constraintProperties = new Set((selected?.representation_constraints ?? []).map(({property_id}) => property_id));
    for (const property of ["representation.protocol_id", "value.equality_mode", "value.hash_mode", "value.immutability_mode",
      "value.component_protocol_id", "value.component_protocol_sha256", "creation.extension_policy", "creation.extension_cycle_policy",
      "creation.validator_binding", "creation.validator_count", "creation.validator_bindings"]) {
      if (!constraintProperties.has(property)) fail("VALUE_OBJECT_PROFILE_CONSTRAINT_MISSING", `${language}:${property}`);
    }
  }

  const portable = descriptor.portable_architecture;
  if (descriptor.schema_version !== "domainspec.value-object-cross-language-realization-descriptor/v1" ||
      descriptor.descriptor_id !== "domainspec.value-object.owned-immutable-factory/v1" ||
      descriptor.descriptor_protocol_id !== "domainspec.owned-value-object-factory/v1" ||
      descriptor.descriptor_status !== "candidate-protocol-only" || descriptor.meta_type_ref !== "DS-D1.2" ||
      descriptor.architecture_type_ref !== "architecture.ValueObjectImplementation" ||
      descriptor.factory_provider_type_ref !== "architecture.ValueObjectFactoryProvider" ||
      descriptor.language_bindings?.length !== 3 || Object.keys(portable?.properties ?? {}).length !== 5 ||
      portable?.relations?.length !== 3 || portable?.component_domain?.admission !== "exact-current-owner-protocol-identity-and-digest" ||
      portable?.validator_contract?.failure !== "structured-failure-no-object" ||
      portable?.extension_contract?.cycle_policy !== "acyclic" || descriptor.authority_effect !== "none") {
    fail("VALUE_OBJECT_DESCRIPTOR_INVALID", "descriptor boundary drifted");
  }
  if (descriptor.proof_contract?.positive_obligations?.length !== 7 || descriptor.proof_contract?.semantic_hostiles?.length !== 8) {
    fail("VALUE_OBJECT_PROOF_DENOMINATOR_INVALID", "expected 7 positive obligations and 8 semantic hostiles");
  }
  if (admission.schema_version !== "domainspec.value-object-protocol-admission/v1" || admission.result !== "pass" ||
      admission.admission_status !== "candidate-protocol-only" || admission.meta_type_id !== "DS-D1.2" ||
      admission.architecture_type_id !== "architecture.ValueObjectImplementation" ||
      admission.factory_provider_type_id !== "architecture.ValueObjectFactoryProvider" ||
      admission.selected_properties?.length !== 5 || admission.selected_relations?.length !== 3 ||
      admission.selected_protocols?.length !== 3 || admission.proof_denominator?.positive_obligations !== "7/7" ||
      admission.proof_denominator?.semantic_hostiles !== "8/8" ||
      admission.implementation_effects?.providers_created !== false || admission.implementation_effects?.targets_created !== false ||
      admission.implementation_effects?.native_value_behavior_proven !== false || admission.authority_effect !== "none") {
    fail("VALUE_OBJECT_ADMISSION_INVALID", "admission boundary or non-effects drifted");
  }

  const refs = [
    descriptor.decision_ref, ...descriptor.query_continuity_refs, ...descriptor.material_refs,
    ...descriptor.language_bindings.map(({profile_ref}) => profile_ref), admission.decision_ref, admission.descriptor_ref,
    ...admission.dependency_refs, ...admission.material_refs, ...admission.selected_protocols.map(({profile_ref}) => profile_ref)
  ];
  for (const ref of refs) {
    if (digestMap.get(ref?.path) !== ref?.sha256) fail("STALE_DIGEST", ref?.path ?? "missing");
  }

  if (queryReceipt.result !== "pass" || queryReceipt.swu_id !== "RMT-QUERY-007" ||
      queryReceipt.candidate_projection?.meta_type_id !== "DS-D1.5" ||
      queryReceipt.candidate_projection?.architecture_type_id !== "architecture.QueryImplementation" ||
      queryReceipt.projected_contract?.family_positive_decisions !== "4/4" ||
      queryReceipt.projected_contract?.family_hostile_classes !== "7/7" ||
      queryCandidate.meta_type?.id !== "DS-D1.5" ||
      queryCandidate.architecture_implementation?.type_id !== "architecture.QueryImplementation" ||
      queryCandidate.lifecycle?.authority_effect !== "none" ||
      admission.semantic_continuity?.prior_query_whole_file_ontology_projection_and_profile_hashes !==
        "historical-admission-snapshots-after-monotonic-shared-material-growth" ||
      admission.semantic_continuity?.current_query_receipt_and_candidate_refs !== "live-and-rehashable") {
    fail("QUERY_007_SEMANTIC_CONTINUITY_INVALID", "Query-007 semantic identity or historical hash boundary drifted");
  }
  return failures;
};

const positiveModel = Object.freeze({
  normalized_tuple: Object.freeze(["BRL", 1250, "settlement"]),
  peer_normalized_tuple: Object.freeze(["BRL", 1250, "settlement"]),
  changed_component_tuple: Object.freeze(["BRL", 1251, "settlement"]),
  equal: true,
  same_hash: true,
  every_component_changes_equality: true,
  recursive_owned_immutable: true,
  validator_binding: "factory-definition",
  validators: Object.freeze(["rule.amount-positive@sha256:a", "rule.currency-supported@sha256:b"]),
  validator_order: Object.freeze(["base:rule.amount-positive@sha256:a", "extension:rule.currency-supported@sha256:b"]),
  validation_passed: true,
  object_formed: true,
  invalid_input_object_formed: false,
  validation_failure: "structured-failure-no-object",
  extension_policy: "additive-validation-only",
  extension_preserves: Object.freeze(["tuple", "normalization", "equality", "hash", "concept", "immutability"]),
  extension_acyclic: true,
  component_protocol_identity: "owned-component/v1",
  component_protocol_digest: "sha256:component",
  nested_value_protocol_delegated: true,
  ambient_component: false,
  unspecified_collection: false
});

const validateModel = (model) => {
  const failures = [];
  if (!same(model.normalized_tuple, model.peer_normalized_tuple) || model.equal !== true) failures.push("COMPLETE_TUPLE_EQUALITY_INVALID");
  if (model.equal === true && model.same_hash !== true) failures.push("HASH_CONGRUENCE_INVALID");
  if (model.every_component_changes_equality !== true) failures.push("PARTIAL_TUPLE_EQUALITY");
  if (model.recursive_owned_immutable !== true) failures.push("MUTABLE_COMPONENT");
  if (model.validator_binding !== "factory-definition" || !Array.isArray(model.validators) ||
      model.validators.some((id) => !id.includes("@sha256:")) ||
      !same(model.validator_order, ["base:rule.amount-positive@sha256:a", "extension:rule.currency-supported@sha256:b"])) {
    failures.push("VALIDATOR_BINDING_INVALID");
  }
  if (model.validation_passed !== true || model.object_formed !== true || model.invalid_input_object_formed !== false ||
      model.validation_failure !== "structured-failure-no-object") failures.push("FORMATION_FAILURE_INVALID");
  if (model.extension_policy !== "additive-validation-only" || model.extension_acyclic !== true ||
      !same(model.extension_preserves, ["tuple", "normalization", "equality", "hash", "concept", "immutability"])) {
    failures.push("EXTENSION_CONTRACT_INVALID");
  }
  if (!model.component_protocol_identity || !model.component_protocol_digest?.startsWith("sha256:") ||
      model.ambient_component !== false || model.unspecified_collection !== false) failures.push("COMPONENT_PROTOCOL_INVALID");
  if (model.nested_value_protocol_delegated !== true) failures.push("NESTED_PROTOCOL_INVALID");
  return failures;
};

const positiveObligations = (model) => Object.freeze([
  {obligation_id: "validators-before-formation", result: model.validator_binding === "factory-definition" && model.validator_order.length === 2 && model.object_formed ? "pass" : "fail"},
  {obligation_id: "equal-tuples-equal-and-hash-equally", result: same(model.normalized_tuple, model.peer_normalized_tuple) && model.equal && model.same_hash ? "pass" : "fail"},
  {obligation_id: "every-component-participates", result: model.every_component_changes_equality ? "pass" : "fail"},
  {obligation_id: "recursive-owned-immutability", result: model.recursive_owned_immutable ? "pass" : "fail"},
  {obligation_id: "extension-preserves-contract", result: model.extension_policy === "additive-validation-only" && model.extension_acyclic && model.extension_preserves.length === 6 ? "pass" : "fail"},
  {obligation_id: "exact-component-protocol-identity-and-digest", result: Boolean(model.component_protocol_identity && model.component_protocol_digest) && !model.ambient_component && !model.unspecified_collection ? "pass" : "fail"},
  {obligation_id: "nested-values-delegate-owned-protocol", result: model.nested_value_protocol_delegated ? "pass" : "fail"}
]);

const bundle = load();
const digestMap = new Map(Object.values(paths).map((path) => [path, sha(path)]));
const errors = [...validateBundle(bundle, digestMap), ...validateModel(positiveModel).map((code) => ({code, detail: "positive model"}))];
const obligations = positiveObligations(positiveModel);
for (const obligation of obligations) if (obligation.result !== "pass") errors.push({code: "POSITIVE_OBLIGATION_FAILED", detail: obligation.obligation_id});

const semanticHostiles = [
  ["reference-identity", "COMPLETE_TUPLE_EQUALITY_INVALID", (model) => { model.peer_normalized_tuple = [...model.normalized_tuple]; model.equal = false; }],
  ["partial-tuple-equality", "PARTIAL_TUPLE_EQUALITY", (model) => { model.every_component_changes_equality = false; }],
  ["incongruent-hash", "HASH_CONGRUENCE_INVALID", (model) => { model.same_hash = false; }],
  ["mutable-nested-component", "MUTABLE_COMPONENT", (model) => { model.recursive_owned_immutable = false; }],
  ["per-call-validator-bypass", "VALIDATOR_BINDING_INVALID", (model) => { model.validator_binding = "per-call"; }],
  ["tuple-changing-extension", "EXTENSION_CONTRACT_INVALID", (model) => { model.extension_preserves = model.extension_preserves.filter((item) => item !== "tuple"); }],
  ["component-without-owned-protocol", "COMPONENT_PROTOCOL_INVALID", (model) => { model.component_protocol_digest = null; }],
  ["invalid-input-forms-object", "FORMATION_FAILURE_INVALID", (model) => { model.invalid_input_object_formed = true; }]
];
const hostileValidations = semanticHostiles.map(([caseId, expectedCode, mutate]) => {
  const hostile = clone(positiveModel);
  mutate(hostile);
  const killed = validateModel(hostile).includes(expectedCode);
  if (!killed) errors.push({code: "SEMANTIC_HOSTILE_SURVIVED", detail: caseId});
  return {case_id: caseId, expected_code: expectedCode, result: killed ? "killed" : "survived"};
});

const structuralControls = [
  ["stale-digest", "STALE_DIGEST", (candidate, digests) => { candidate.admission.material_refs[0].sha256 = "0".repeat(64); }],
  ["wrong-language-protocol", "VALUE_OBJECT_PROFILE_INVALID", (candidate) => { overlay(candidate.profiles.typescript)[0].candidate_protocols[0].protocol_id = "typescript.wrong/v1"; }],
  ["wrong-relation-endpoint", "VALUE_OBJECT_RELATION_INVALID", (candidate) => { candidate.ontology.relation_definitions.find(({relation_id}) => relation_id === "architecture.validated_by").target_types = ["architecture.OperationImplementation"]; }],
  ["extension-cycle-permitted", "VALUE_OBJECT_RELATION_INVALID", (candidate) => { candidate.ontology.relation_definitions.find(({relation_id}) => relation_id === "architecture.extends_factory").cycle_policy = "allowed"; }],
  ["authority-escalation", "VALUE_OBJECT_ADMISSION_INVALID", (candidate) => { candidate.admission.authority_effect = "promotion"; }]
];
const structuralValidations = structuralControls.map(([caseId, expectedCode, mutate]) => {
  const hostile = clone(bundle);
  const hostileDigests = new Map(digestMap);
  mutate(hostile, hostileDigests);
  const killed = validateBundle(hostile, hostileDigests).some(({code}) => code === expectedCode);
  if (!killed) errors.push({code: "STRUCTURAL_CONTROL_SURVIVED", detail: caseId});
  return {case_id: caseId, expected_code: expectedCode, result: killed ? "killed" : "survived"};
});

for (const path of Object.values(paths)) {
  const target = absolute(path);
  const safe = target.startsWith(`${root}${sep}`) && existsSync(target) && lstatSync(target).isFile() &&
    !lstatSync(target).isSymbolicLink() && realpathSync(target) === target;
  if (!safe) errors.push({code: "UNSAFE_REF", detail: path});
}
for (const [path, expected] of Object.entries(expectedDigests)) {
  if (sha(path) !== expected) errors.push({code: "ACCEPTANCE_BOUND_DIGEST_DRIFT", detail: path});
}

const result = {
  schema_version: "domainspec.rmt-value-object-admission-validation/v1",
  swu_id: "RMT-VO-001",
  verdict: errors.length === 0 ? "pass" : "fail",
  semantic_checks: errors.length === 0 ? "pass" : "fail",
  positive_obligations: obligations,
  positive_passes: `${obligations.filter(({result: outcome}) => outcome === "pass").length}/${obligations.length}`,
  semantic_hostile_validations: hostileValidations,
  semantic_hostile_kills: `${hostileValidations.filter(({result: outcome}) => outcome === "killed").length}/${hostileValidations.length}`,
  structural_control_validations: structuralValidations,
  structural_control_kills: `${structuralValidations.filter(({result: outcome}) => outcome === "killed").length}/${structuralValidations.length}`,
  query_007_semantic_continuity: errors.some(({code}) => code === "QUERY_007_SEMANTIC_CONTINUITY_INVALID") ? "fail" : "pass",
  prior_query_whole_file_shared_material_refs: "historical-admission-snapshots-after-monotonic-shared-material-growth",
  errors,
  implementation_status: {
    typescript_provider: "absent",
    python_provider: "absent",
    rust_provider: "absent",
    component_protocol_providers: "absent",
    native_value_behavior: "not-executed",
    parity: "not-proven"
  },
  claim_ceiling: "candidate-only Value Object ontology, projection, profile, protocol, and descriptor admission with synthetic 7/7 positive, 8/8 semantic hostile, structural fail-closed controls, and Query-007 semantic continuity; no provider, target, native proof, family proof, parity, promotion, publication, release, deployment, or production proof",
  authority_effect: "none"
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
