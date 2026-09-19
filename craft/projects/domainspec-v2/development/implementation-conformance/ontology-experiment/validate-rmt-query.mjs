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
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W2-QUERY-001.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/query/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/query/protocol-admission.json",
  policyReceipt: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-POLICY-008.json",
  policyCandidate: "projects/domainspec-v2/development/remaining-meta-types/candidates/policy.json"
});
const absolute = (path) => resolve(root, path);
const readJson = (path) => JSON.parse(readFileSync(absolute(path), "utf8"));
const sha = (path) => createHash("sha256").update(readFileSync(absolute(path))).digest("hex");
const semanticDigest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone = (value) => structuredClone(value);
const overlay = (profile, id) => profile.representation_overlays?.find(({contract_id}) => contract_id === id);

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
  policyReceipt: readJson(paths.policyReceipt),
  policyCandidate: readJson(paths.policyCandidate)
});

const liveDigests = new Map(Object.values(paths).map((path) => [path, sha(path)]));
const preservedSemanticDigests = Object.freeze({
  calculationProjection: "e00425dde5cd953f4aac390528af293e954a4ed10066ef84553b68705f6034d9",
  policyProjection: "f1fd65c6c394e61e6668838ce1103e60819a4afb74ae0212cbeb3dd83c4283c5",
  calculationType: "5c8030bb154ebb7ca25d4434d34e6322d3300b7a3ce1fa2a1ff36ec7ba4ceec6",
  policyType: "d9e375d5837563c47904aa6c2799abf6ac44ce353a5566003a39f3724dd85694",
  policyStrategyType: "1561b8f2d68335704e4f7794ff40dbc4cbe668a1a06be2dad9bd35955e429a07",
  typescriptPolicyOverlay: "38eaf99a1920ce63312657300496b13aa86c2b1b72594a1df9893c943b6a6fec",
  pythonPolicyOverlay: "935c69de5609dd4ae04c24dfd248721b2333c3f640ef0866b75b7482898a7a8e",
  rustPolicyOverlay: "c6ee101101a7ea94db469034375e2a1273e12408b6a0948c0a266f3fc5127bc3"
});

const validateBundle = (bundle) => {
  const failures = [];
  const fail = (code, detail) => failures.push({code, detail});
  const {ontology, projection, profiles, decision, descriptor, admission, policyReceipt, policyCandidate} = bundle;
  if (decision.selected_option_id !== "W2-QUERY-A-BOUND-FULLY-OBSERVED-READ-ONLY" ||
      decision.portable_architecture?.type_id !== "architecture.QueryImplementation" ||
      decision.shared_architecture_selection?.descriptor_protocol_id !== "domainspec.behavior-bound-callable/v1") {
    fail("QUERY_DECISION_DRIFT", "W2 Query A is not the exact selected boundary");
  }

  const concepts = new Map((ontology.concept_types ?? []).map((item) => [item.concept_id, item]));
  const query = concepts.get("architecture.QueryImplementation");
  if (query?.extends !== "architecture.DomainConceptImplementation" || query?.canonical_meta_type_ref !== "DS-D1.5" ||
      !query?.source_refs?.includes("domainspec.query-form-decision") ||
      !query?.challenge_contract?.resolution_gate?.includes("every declared read and no undeclared read") ||
      !query?.challenge_contract?.resolution_gate?.includes("zero writes through quiescence")) {
    fail("QUERY_TYPE_INVALID", "Query type or challenge gate drifted");
  }

  const properties = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  const requiredProperties = [
    "binding.input_concepts", "binding.output_concept", "callable.effect_contract", "callable.dependency_contract",
    "callable.failure_contract", "callable.result_consumption", "callable.provider_id", "callable.provider_digest",
    "callable.descriptor_digest"
  ];
  for (const id of requiredProperties) {
    const property = properties.get(id);
    if (!property?.applies_to?.types?.includes("architecture.QueryImplementation") || !property?.observation_stage ||
        !property?.owner_route || !property?.forbidden_inference) fail("QUERY_PROPERTY_MISSING", id);
  }
  if (!properties.get("callable.return_semantics")?.value_type?.values?.includes("read-model") ||
      !properties.get("callable.effect_contract")?.value_type?.values?.includes("declared-read-only") ||
      !properties.get("callable.dependency_contract")?.value_type?.values?.includes("declared-read-targets-only")) {
    fail("QUERY_PROPERTY_VALUES_INVALID", "read-model and declared read-only target values must be admitted");
  }

  const projected = (projection.meta_types ?? []).filter(({meta_type_id}) => meta_type_id === "DS-D1.5");
  if (projected.length !== 1 || projected[0].maturity !== "active" || projected[0].mapping_status !== "candidate-mapped" ||
      projected[0].architecture_type_id !== "architecture.QueryImplementation" ||
      projected[0].candidate_language_protocols?.length !== 3) {
    fail("QUERY_PROJECTION_INVALID", "DS-D1.5 projection drifted");
  }

  const expected = {
    typescript: ["typescript.bound-query/v1", "typescript.query-arrow-function"],
    python: ["python.bound-query/v1", "python.query-function"],
    rust: ["rust.bound-query/v1", "rust.query-function"]
  };
  for (const [language, [protocolId, formId]] of Object.entries(expected)) {
    const selected = overlay(profiles[language], "query.profile-representation");
    const protocol = selected?.candidate_protocols?.[0];
    const contract = protocol?.descriptor_contract;
    if (selected?.admission_status !== "candidate-protocol-only" || protocol?.protocol_id !== protocolId ||
        protocol?.form_id !== formId || protocol?.status !== "admitted-candidate-protocol" ||
        protocol?.implementation_status !== "provider-absent" || contract?.return_semantics !== "read-model" ||
        contract?.effect_contract !== "declared-read-only" ||
        contract?.dependency_contract !== "declared-read-targets-only" || contract?.failure_contract !== "declared" ||
        contract?.result_consumption !== "complete" || selected?.unsupported_forms?.length !== 7) {
      fail("QUERY_PROFILE_INVALID", language);
    }
  }

  const observation = descriptor.portable_architecture?.observation_contract;
  const binding = descriptor.portable_architecture?.binding_contract;
  if (descriptor.schema_version !== "domainspec.query-cross-language-realization-descriptor/v1" ||
      descriptor.descriptor_id !== "domainspec.query.bound-fully-observed-read-only/v1" ||
      descriptor.descriptor_protocol_id !== "domainspec.behavior-bound-callable/v1" ||
      descriptor.descriptor_status !== "candidate-protocol-only" || descriptor.language_bindings?.length !== 3 ||
      binding?.read_targets !== "non-empty-exact-ordered-owner-authored-concept-bindings" ||
      binding?.output_shape !== "exact-owner-authored-closed-result-shape" ||
      observation?.missing_channel_outcome !== "unsupported" || observation?.unsupported_source_outcome !== "unsupported" ||
      observation?.before_after_snapshot !== "supplementary-only" || descriptor.authority_effect !== "none") {
    fail("QUERY_DESCRIPTOR_INVALID", "descriptor boundary drifted");
  }
  if (descriptor.proof_contract?.positive_obligations?.length !== 4 ||
      descriptor.proof_contract?.negative_controls?.length !== 7) {
    fail("QUERY_PROOF_DENOMINATOR_INVALID", "expected 4 positive obligations and 7 negative controls");
  }
  if (admission.schema_version !== "domainspec.query-protocol-admission/v1" || admission.result !== "pass" ||
      admission.admission_status !== "candidate-protocol-only" || admission.selected_protocols?.length !== 3 ||
      admission.implementation_effects?.providers_created !== false ||
      admission.implementation_effects?.read_ledger_proven !== false ||
      admission.implementation_effects?.write_ledger_proven !== false || admission.authority_effect !== "none") {
    fail("QUERY_ADMISSION_INVALID", "admission boundary or non-effects drifted");
  }

  const refs = [
    admission.decision_ref, admission.descriptor_ref, ...admission.dependency_refs, ...admission.material_refs,
    ...admission.selected_protocols.map(({profile_ref}) => profile_ref), descriptor.decision_ref,
    ...descriptor.policy_continuity_refs, ...descriptor.material_refs,
    ...descriptor.language_bindings.map(({profile_ref}) => profile_ref)
  ];
  for (const ref of refs) {
    if (liveDigests.get(ref?.path) !== ref?.sha256) fail("STALE_DIGEST", ref?.path ?? "missing");
  }

  const projectionById = new Map((projection.meta_types ?? []).map((item) => [item.meta_type_id, item]));
  const expectedPreserved = {
    calculationProjection: semanticDigest(projectionById.get("DS-D1.6")),
    policyProjection: semanticDigest(projectionById.get("DS-D1.8")),
    calculationType: semanticDigest(concepts.get("architecture.CalculationImplementation")),
    policyType: semanticDigest(concepts.get("architecture.PolicyImplementation")),
    policyStrategyType: semanticDigest(concepts.get("architecture.PolicyStrategyContract")),
    typescriptPolicyOverlay: semanticDigest(overlay(profiles.typescript, "policy.profile-representation")),
    pythonPolicyOverlay: semanticDigest(overlay(profiles.python, "policy.profile-representation")),
    rustPolicyOverlay: semanticDigest(overlay(profiles.rust, "policy.profile-representation"))
  };
  for (const [id, actual] of Object.entries(expectedPreserved)) {
    if (actual !== preservedSemanticDigests[id]) fail("POLICY_CALCULATION_CONTINUITY_INVALID", id);
  }
  if (policyReceipt.result !== "pass" || policyReceipt.projection_semantics?.meta_type_id !== "DS-D1.8" ||
      policyCandidate.meta_type?.id !== "DS-D1.8" ||
      admission.semantic_continuity?.policy_candidate_projection_ref_current_live_rehashable !== false) {
    fail("POLICY_CALCULATION_CONTINUITY_INVALID", "Policy receipt/candidate or historical-snapshot boundary drifted");
  }
  return failures;
};

const positiveModel = Object.freeze({
  declared_reads: Object.freeze(["settlement.by-player-id", "settlement.by-payout-id"]),
  observed_reads: Object.freeze(["settlement.by-player-id", "settlement.by-payout-id"]),
  unresolved_reads: Object.freeze([]),
  declared_output_shape: Object.freeze(["settlement_id", "status", "amount_minor"]),
  observed_output_shape: Object.freeze(["settlement_id", "status", "amount_minor"]),
  write_attempts: Object.freeze({
    during_call: 0,
    during_consumption: 0,
    during_cancel: 0,
    during_close: 0,
    during_dispose: 0,
    during_finalizer: 0,
    after_quiescence: 0
  }),
  write_then_restore_detected: false,
  deferred_lazy_write_detected: false,
  channels: Object.freeze({read_ledger: "covered", write_ledger: "covered", lifecycle: "covered", quiescence: "covered"}),
  source_support: "supported-static",
  fully_consumed: true,
  quiescent: true
});

const validateModel = (model) => {
  const failures = [];
  if (JSON.stringify(model.declared_reads) !== JSON.stringify(model.observed_reads) ||
      model.unresolved_reads?.length !== 0) failures.push("READ_TARGET_MISMATCH");
  if (JSON.stringify(model.declared_output_shape) !== JSON.stringify(model.observed_output_shape)) {
    failures.push("OUTPUT_SHAPE_MISMATCH");
  }
  if (Object.values(model.write_attempts ?? {}).some((count) => count !== 0)) failures.push("WRITE_OBSERVED");
  if (model.write_then_restore_detected !== false) failures.push("WRITE_THEN_RESTORE");
  if (model.deferred_lazy_write_detected !== false) failures.push("DEFERRED_WRITE");
  if (["read_ledger", "write_ledger", "lifecycle", "quiescence"].some((id) => model.channels?.[id] !== "covered")) {
    failures.push("OBSERVATION_UNSUPPORTED");
  }
  if (model.source_support !== "supported-static") failures.push("SOURCE_UNSUPPORTED");
  if (model.fully_consumed !== true || model.quiescent !== true) failures.push("RESULT_NOT_FULLY_CONSUMED");
  return failures;
};

const validatePositiveObligations = (model) => Object.freeze([
  {
    obligation_id: "exact-declared-reads",
    result: JSON.stringify(model.declared_reads) === JSON.stringify(model.observed_reads) && model.unresolved_reads.length === 0 ? "pass" : "fail"
  },
  {
    obligation_id: "exact-fully-consumed-output-shape",
    result: JSON.stringify(model.declared_output_shape) === JSON.stringify(model.observed_output_shape) && model.fully_consumed === true ? "pass" : "fail"
  },
  {
    obligation_id: "independent-read-and-zero-write-observation-through-quiescence",
    result: Object.values(model.write_attempts).every((count) => count === 0) &&
      Object.values(model.channels).every((coverage) => coverage === "covered") && model.quiescent === true ? "pass" : "fail"
  },
  {
    obligation_id: "write-restore-and-lazy-controls-distinguishable",
    result: model.write_then_restore_detected === false && model.deferred_lazy_write_detected === false ? "pass" : "fail"
  }
]);

const bundle = load();
const errors = [
  ...validateBundle(bundle),
  ...validateModel(positiveModel).map((code) => ({code, detail: "positive model"}))
];
const positiveObligations = validatePositiveObligations(positiveModel);
for (const obligation of positiveObligations) {
  if (obligation.result !== "pass") errors.push({code: "POSITIVE_OBLIGATION_FAILED", detail: obligation.obligation_id});
}
const hostileCases = [
  ["hidden-write", "WRITE_OBSERVED", (model) => { model.write_attempts.during_call = 1; }],
  ["write-then-restore", "WRITE_THEN_RESTORE", (model) => { model.write_then_restore_detected = true; }],
  ["deferred-lazy-write", "DEFERRED_WRITE", (model) => { model.deferred_lazy_write_detected = true; }],
  ["unresolved-or-undeclared-read", "READ_TARGET_MISMATCH", (model) => { model.observed_reads.push("settlement.hidden-index"); }],
  ["undeclared-result-shape", "OUTPUT_SHAPE_MISMATCH", (model) => { model.observed_output_shape.push("internal_note"); }],
  ["missing-effect-channel", "OBSERVATION_UNSUPPORTED", (model) => { delete model.channels.write_ledger; }],
  ["unsupported-dynamic-or-generated-source", "SOURCE_UNSUPPORTED", (model) => { model.source_support = "unsupported-dynamic"; }]
];
const hostileValidations = [];
for (const [caseId, expectedCode, mutate] of hostileCases) {
  const hostile = clone(positiveModel);
  mutate(hostile);
  const killed = validateModel(hostile).includes(expectedCode);
  hostileValidations.push({case_id: caseId, expected_code: expectedCode, result: killed ? "killed" : "survived"});
  if (!killed) errors.push({code: "HOSTILE_SURVIVED", detail: caseId});
}

for (const path of Object.values(paths)) {
  const target = absolute(path);
  const safe = target.startsWith(`${root}${sep}`) && existsSync(target) && lstatSync(target).isFile() &&
    !lstatSync(target).isSymbolicLink() && realpathSync(target) === target;
  if (!safe) errors.push({code: "UNSAFE_REF", detail: path});
}

const result = {
  schema_version: "domainspec.rmt-query-admission-validation/v1",
  swu_id: "RMT-QUERY-001",
  verdict: errors.length === 0 ? "pass" : "fail",
  semantic_checks: errors.length === 0 ? "pass" : "fail",
  positive_obligations: positiveObligations,
  positive_passes: `${positiveObligations.filter(({result: outcome}) => outcome === "pass").length}/${positiveObligations.length}`,
  hostile_validations: hostileValidations,
  hostile_kills: `${hostileValidations.filter(({result: outcome}) => outcome === "killed").length}/${hostileValidations.length}`,
  policy_and_calculation_semantic_continuity: errors.some(({code}) => code === "POLICY_CALCULATION_CONTINUITY_INVALID") ? "fail" : "pass",
  legacy_policy_whole_file_projection_ref: "historical-admission-snapshot-after-monotonic-shared-projection-growth",
  errors,
  implementation_status: {
    typescript_provider: "absent",
    python_provider: "absent",
    rust_provider: "absent",
    read_write_lifecycle_observer: "not-executed",
    query_behavior: "not-executed",
    parity: "not-proven"
  },
  claim_ceiling: "candidate-only Query ontology, profile, protocol, and descriptor admission with synthetic 4/4 positive and 7/7 hostile validation plus Policy and Calculation semantic continuity; no provider, runtime read or write observation, complete-consumption proof, parity, promotion, publication, release, deployment, or production proof",
  authority_effect: "none"
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
