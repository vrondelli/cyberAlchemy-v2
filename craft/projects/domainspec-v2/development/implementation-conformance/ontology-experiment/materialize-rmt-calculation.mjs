#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../../..");
const paths = {
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W2-CALCULATION-001.json",
  enumContinuity: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.semantic-slice-v1.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/calculation/cross-language-realization-descriptor.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/calculation/protocol-admission.json",
};
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const bytes = (path) => readFileSync(resolve(root, path));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const ref = (path) => ({path, sha256: sha256(bytes(path))});
const writeJson = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const assertMissing = (items, id, label) => {
  if (items.some((item) => item[label] === id)) throw new Error(`RMT_CALCULATION_DUPLICATE:${id}`);
};

const ontology = readJson(paths.ontology);
const projection = readJson(paths.projection);
const profiles = {
  typescript: readJson(paths.typescript),
  python: readJson(paths.python),
  rust: readJson(paths.rust),
};
const decision = readJson(paths.decision);
if (decision.selected_option_id !== "W2-CALCULATION-A-BOUND-PURE-VALUE") {
  throw new Error("RMT_CALCULATION_DECISION_NOT_SELECTED");
}

if (!ontology.source_refs.some(({source_id}) => source_id ===
  "domainspec.calculation-form-decision")) ontology.source_refs.push({
  source_id: "domainspec.calculation-form-decision",
  path: paths.decision,
  sha256: sha256(bytes(paths.decision)),
  use: "owner-selected descriptor-bound pure-value Calculation architecture and TypeScript, Python, and Rust candidate protocols",
});
if (!ontology.concept_types.some(({concept_id}) => concept_id ===
  "architecture.CalculationImplementation")) ontology.concept_types.push({
  concept_id: "architecture.CalculationImplementation",
  label: "Calculation Implementation",
  abstract: false,
  extends: "architecture.DomainConceptImplementation",
  concept_role: "system object",
  canonical_meta_type_ref: "DS-D1.6",
  canonical_mapping_status: "candidate-alignment",
  source_refs: [
    "experiment.property-evaluation-model",
    "domainspec.calculation-form-decision",
  ],
  owner_route: "Calculation realization profile owner",
  candidate_status: "candidate",
  confidence: {evidence_confidence: "medium", commitment_confidence: "low"},
  challenge_contract: {
    valid_challenge_modes: ["evidence", "contradiction", "owner_review"],
    resolution_gate: "exact descriptor/provider binding, deterministic repeated value, independently observed zero forbidden reads and writes, complete result consumption, and hostile nondeterminism/effect controls",
  },
  forbidden_collapse: "An arrow function, pure-looking expression, or returned value does not establish an admitted DomainSpec Calculation.",
});

const propertyDefinitions = [
  ["binding.input_concepts", "Calculation input concept bindings", {kind: "array", items: {kind: "string"}}, "Exact ordered concept inputs declared by the accountable binding owner.", "descriptor binding", "Calculation binding owner", "Function parameters cannot author the portable input concept set."],
  ["binding.output_concept", "Calculation output concept binding", {kind: "string"}, "Exact value concept returned by the admitted Calculation.", "descriptor binding", "Calculation binding owner", "A native return type cannot author the portable output concept."],
  ["callable.effect_contract", "Callable effect contract", {kind: "enum", values: ["none"]}, "Declared effect perimeter for a Calculation; none forbids ambient reads and writes.", "descriptor binding plus independent effect observation", "Calculation descriptor owner", "Self-issued zero counts or source syntax cannot prove purity."],
  ["callable.dependency_contract", "Callable dependency contract", {kind: "enum", values: ["explicit-only"]}, "Every admitted dependency enters through the declared input perimeter.", "descriptor binding plus dependency observation", "Calculation descriptor owner", "A closed-over global or hidden service is not an explicit dependency."],
  ["callable.failure_contract", "Callable failure contract", {kind: "enum", values: ["declared"]}, "Failure outcomes are typed and declared by the descriptor.", "descriptor binding plus hostile input fixtures", "Calculation descriptor owner", "A thrown exception cannot author the portable failure contract."],
  ["callable.result_consumption", "Callable result consumption", {kind: "enum", values: ["complete"]}, "The returned value is fully consumed before the purity and determinism observation closes.", "result observation perimeter", "Calculation evidence owner", "Returning a lazy iterator, future, callback, or finalizer cannot close proof before its effects are observed."],
  ["callable.provider_id", "Callable provider identity", {kind: "string"}, "Exact provider identity bound to the Calculation descriptor.", "descriptor/provider join", "Calculation provider owner", "A matching callable name cannot establish provider identity."],
  ["callable.provider_digest", "Callable provider digest", {kind: "string"}, "Content digest of the exact provider implementation under observation.", "content-addressed provider loading", "Calculation provider owner", "A provider identifier without matching bytes cannot establish current implementation identity."],
  ["callable.descriptor_digest", "Callable descriptor digest", {kind: "string"}, "Content digest of the exact owner-authored Calculation descriptor.", "content-addressed descriptor loading", "Calculation descriptor owner", "Provider-emitted metadata cannot author the descriptor digest."],
];
for (const [property_id, label, value_type, semantics, observation_stage, owner_route,
  forbidden_inference] of propertyDefinitions) {
  if (!ontology.property_definitions.some((candidate) => candidate.property_id === property_id)) {
    ontology.property_definitions.push({
    property_id, label, value_type,
    applies_to: {kind: "node", types: ["architecture.CalculationImplementation"]},
    semantics, observation_stage, owner_route, forbidden_inference,
    });
  }
}
for (const languageProjection of ontology.language_projections) {
  for (const propertyId of [
    "binding.input_concepts", "binding.output_concept", "callable.return_semantics",
    "callable.effect_contract", "callable.dependency_contract", "callable.failure_contract",
    "callable.result_consumption", "callable.provider_id", "callable.provider_digest",
    "callable.descriptor_digest",
  ]) if (!languageProjection.observes.includes(propertyId)) languageProjection.observes.push(propertyId);
  if (!languageProjection.source_refs.includes("domainspec.calculation-form-decision")) {
    languageProjection.source_refs.push("domainspec.calculation-form-decision");
  }
}

const calculationProjection = projection.meta_types.find(({meta_type_id}) => meta_type_id === "DS-D1.6");
if (calculationProjection === undefined || ![
  "profiled-unmapped", "candidate-mapped",
].includes(calculationProjection.mapping_status)) {
  throw new Error("RMT_CALCULATION_PROJECTION_BASELINE_DRIFT");
}
Object.assign(calculationProjection, {
  mapping_status: "candidate-mapped",
  architecture_type_id: "architecture.CalculationImplementation",
  mapping_reason: "The accepted W2 descriptor-bound pure-value decision is now represented by one reciprocal Calculation architecture type and exact candidate protocols in TypeScript, Python, and Rust.",
  evidence_refs: [
    "experiment.property-evaluation-model",
    "domainspec.calculation-form-decision",
  ],
  candidate_language_protocols: decision.language_target_realizations.map(({language, form_id, protocol_id}) => ({
    language,
    protocol_id,
    form_id,
    protocol_status: "admitted-candidate-protocol",
    implementation_change: "provider-absent",
  })),
  review_trigger: "A descriptor/provider digest changes, the effect observation perimeter changes, a nondeterminism mutant survives, or a target admits implicit dependencies or incomplete result consumption.",
});

const formByLanguage = Object.fromEntries(decision.language_target_realizations.map((item) =>
  [item.language, item]));
for (const [language, profile] of Object.entries(profiles)) {
  const existingOverlay = profile.representation_overlays.find(({contract_id}) =>
    contract_id === "calculation.profile-representation");
  const selected = formByLanguage[language];
  const candidateOverlay = {
    contract_id: "calculation.profile-representation",
    language,
    selection_mode: "owner-decision-and-descriptor-digest",
    admitted_forms: [selected.form_id],
    rejected_forms: language === "typescript" ? ["typescript.unbound-calculation-function"] : [],
    unsupported_forms: [
      `${language}.ambient-read-calculation`,
      `${language}.state-writing-calculation`,
      `${language}.lazy-unconsumed-calculation`,
      `${language}.boolean-rule-impersonation`,
    ],
    candidate_protocols: [{
      protocol_id: selected.protocol_id,
      form_id: selected.form_id,
      status: "admitted-candidate-protocol",
      implementation_status: "provider-absent",
      descriptor_contract: decision.portable_architecture.descriptor_contract,
      native_requirements: selected.requirements,
      activation_gate: `exact ${language} provider, independent effect observation, determinism, complete-consumption, and hostile proof required by its target SWU`,
    }],
    activation_binding: {decision_ref: ref(paths.decision)},
    admission_status: "candidate-protocol-only",
    missing_decision_outcome: "unselected",
    language_mismatch_outcome: "unsupported",
    owner_route: `${language}-calculation-profile-owner`,
    representation_constraints: [
      {
        constraint_id: `${language}.calculation-bound-protocol`,
        constraint_kind: "node-property",
        applies_to: ["architecture.CalculationImplementation"],
        property_id: "representation.protocol_id",
        operator: "equals",
        expected: selected.protocol_id,
        severity: "error",
      },
      {
        constraint_id: `${language}.calculation-value-return`,
        constraint_kind: "node-property",
        applies_to: ["architecture.CalculationImplementation"],
        property_id: "callable.return_semantics",
        operator: "equals",
        expected: "value",
        severity: "error",
      },
      {
        constraint_id: `${language}.calculation-zero-effects`,
        constraint_kind: "node-property",
        applies_to: ["architecture.CalculationImplementation"],
        property_id: "callable.effect_contract",
        operator: "equals",
        expected: "none",
        severity: "error",
      },
      {
        constraint_id: `${language}.calculation-explicit-dependencies`,
        constraint_kind: "node-property",
        applies_to: ["architecture.CalculationImplementation"],
        property_id: "callable.dependency_contract",
        operator: "equals",
        expected: "explicit-only",
        severity: "error",
      },
      {
        constraint_id: `${language}.calculation-complete-result`,
        constraint_kind: "node-property",
        applies_to: ["architecture.CalculationImplementation"],
        property_id: "callable.result_consumption",
        operator: "equals",
        expected: "complete",
        severity: "error",
      },
    ],
  };
  if (existingOverlay === undefined) profile.representation_overlays.push(candidateOverlay);
  else Object.assign(existingOverlay, candidateOverlay);
}

writeJson(paths.ontology, ontology);
writeJson(paths.projection, projection);
writeJson(paths.typescript, profiles.typescript);
writeJson(paths.python, profiles.python);
writeJson(paths.rust, profiles.rust);

const materialRefs = [paths.ontology, paths.projection, paths.typescript, paths.python, paths.rust]
  .map((path) => ref(path));
const descriptor = {
  schema_version: "domainspec.calculation-cross-language-realization-descriptor/v1",
  descriptor_id: "domainspec.calculation.bound-pure-value/v1",
  descriptor_status: "candidate-protocol-only",
  meta_type_ref: "DS-D1.6",
  architecture_type_ref: "architecture.CalculationImplementation",
  decision_ref: ref(paths.decision),
  enum_continuity_ref: ref(paths.enumContinuity),
  portable_architecture: decision.portable_architecture,
  language_bindings: decision.language_target_realizations.map((item) => ({
    ...item,
    status: "admitted-candidate-protocol",
    implementation_status: "provider-absent",
    profile_ref: ref(paths[item.language]),
  })),
  proof_contract: decision.proof_contract,
  material_refs: materialRefs,
  claim_ceiling: decision.proof_contract.claim_ceiling,
  authority_effect: "none",
};
writeJson(paths.descriptor, descriptor);
const admission = {
  schema_version: "domainspec.calculation-protocol-admission/v1",
  admission_id: "RMT-CALC-001-candidate-protocol-admission",
  admission_status: "candidate-protocol-only",
  result: "pass",
  meta_type_id: "DS-D1.6",
  architecture_type_id: "architecture.CalculationImplementation",
  dependency_ref: {...ref(paths.enumContinuity), required_result: "pass"},
  decision_ref: {...ref(paths.decision), selected_option_id: decision.selected_option_id},
  descriptor_ref: ref(paths.descriptor),
  material_refs: materialRefs,
  selected_protocols: descriptor.language_bindings,
  implementation_effects: {
    providers_created: false,
    targets_created: false,
    parity_proven: false,
    ontology_authority_changed: false,
  },
  successor: {
    swu_id: "RMT-CALC-002",
    state: "not-executed",
    required_outcome: "independent effect observation transport and Calculation family expected-red",
  },
  claim_ceiling: "candidate-only Calculation ontology, profile, protocol, and descriptor admission; no target provider, independent effect proof, parity, promotion, publication, deployment, release, or production proof",
  authority_effect: "none",
};
writeJson(paths.admission, admission);

console.log(JSON.stringify({
  result: "pass",
  files: [...materialRefs, ref(paths.descriptor), ref(paths.admission)],
  authority_effect: "none",
}, null, 2));
