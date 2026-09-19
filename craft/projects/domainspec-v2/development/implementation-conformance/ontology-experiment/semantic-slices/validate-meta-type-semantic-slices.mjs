#!/usr/bin/env node

import {readFileSync} from "node:fs";

import {
  canonicalJson,
  extractEnumSemanticSlices,
  loadEnumSourceBundle,
  outputPaths,
  paths,
  renderSlice,
  repositoryRoot,
  sha256,
} from "./extract-meta-type-semantic-slices.mjs";

const clone = (value) => structuredClone(value);
const errors = [];
const checks = [];
const error = (code, message) => errors.push({code, message});
const expect = (condition, code, message) => {
  if (!condition) error(code, message);
  checks.push({check_id: code, result: condition ? "pass" : "fail"});
};
const digestMap = (slices) => Object.fromEntries(Object.entries(slices)
  .map(([role, slice]) => [role, slice.semantic_sha256]));
const sameDigests = (left, right) => canonicalJson(digestMap(left)) === canonicalJson(digestMap(right));
const expectReject = (id, expectedCode, mutate, baselineBundle) => {
  const hostile = clone(baselineBundle);
  hostile.selectorContractBytes = baselineBundle.selectorContractBytes;
  mutate(hostile);
  let observed = null;
  try {
    extractEnumSemanticSlices(hostile);
  } catch (caught) {
    observed = caught?.code ?? null;
  }
  expect(observed === expectedCode, `hostile:${id}`, `expected ${expectedCode}, observed ${observed}`);
};

const baselineBundle = loadEnumSourceBundle(repositoryRoot);
const current = extractEnumSemanticSlices(baselineBundle);

for (const [role, relativePath] of Object.entries(outputPaths)) {
  let artifact;
  try {
    artifact = JSON.parse(readFileSync(`${repositoryRoot}/${relativePath}`, "utf8"));
  } catch (caught) {
    error("SEMANTIC_SLICE_ARTIFACT_MISSING", `${role}:${caught.message}`);
    continue;
  }
  expect(renderSlice(artifact) === renderSlice(current[role]),
    `concordance:${role}`, `${role} slice differs from current deterministic extraction`);
  expect(artifact.semantic_sha256 === sha256(canonicalJson(artifact.semantic_content)),
    `semantic-digest:${role}`, `${role} semantic digest is stale`);
  expect(artifact.selector_contract.sha256 === sha256(baselineBundle.selectorContractBytes),
    `selector-digest:${role}`, `${role} selector contract digest is stale`);
  expect(artifact.authority_effect === "none" && artifact.status === "candidate",
    `boundary:${role}`, `${role} authority or status inflated`);
}

const calculationAppend = clone(baselineBundle);
calculationAppend.selectorContractBytes = baselineBundle.selectorContractBytes;
if (!calculationAppend.ontology.concept_types.some(({concept_id: id}) =>
  id === "architecture.CalculationImplementation")) calculationAppend.ontology.concept_types.push({
  concept_id: "architecture.CalculationImplementation",
  label: "Calculation Implementation",
  abstract: false,
  extends: "architecture.DomainConceptImplementation",
  concept_role: "system object",
  canonical_meta_type_ref: "DS-D1.6",
  canonical_mapping_status: "candidate-alignment",
  source_refs: ["experiment.property-evaluation-model"],
  owner_route: "Calculation realization profile owner",
  candidate_status: "candidate",
  confidence: {evidence_confidence: "low", commitment_confidence: "low"},
  challenge_contract: {valid_challenge_modes: ["evidence"], resolution_gate: "candidate proof"},
  forbidden_collapse: "A callable shape is not Calculation meaning.",
});
if (!calculationAppend.ontology.property_definitions.some(({property_id: id}) =>
  id === "callable.effect_contract")) calculationAppend.ontology.property_definitions.push({
  property_id: "callable.effect_contract",
  label: "Effect contract",
  value_type: {kind: "enum", values: ["none"]},
  applies_to: {kind: "node", types: ["architecture.DomainConceptImplementation"]},
  semantics: "Declared effect perimeter.",
  observation_stage: "descriptor binding",
  owner_route: "behavior descriptor owner",
  forbidden_inference: "Self-issued zero counts do not prove purity.",
});
const calculationProjection = calculationAppend.projection.meta_types.find(({meta_type_id: id}) => id === "DS-D1.6");
calculationProjection.mapping_status = "candidate-mapped";
calculationProjection.architecture_type_id = "architecture.CalculationImplementation";
for (const profile of [
  calculationAppend.typescriptProfile,
  calculationAppend.pythonProfile,
  calculationAppend.rustProfile,
]) {
  if (!profile.representation_overlays.some(({contract_id: id}) =>
    id === "calculation.profile-representation")) profile.representation_overlays.push({
    contract_id: "calculation.profile-representation",
    language: profile.language,
    selection_mode: "owner-decision-and-descriptor-digest",
    admitted_forms: [`${profile.language}.bound-calculation`],
    candidate_protocols: [{
      protocol_id: `${profile.language}.bound-calculation/v1`,
      form_id: `${profile.language}.bound-calculation`,
      status: "candidate-protocol-only",
    }],
    missing_decision_outcome: "unselected",
    language_mismatch_outcome: "unsupported",
    owner_route: `${profile.language}-calculation-profile-owner`,
    representation_constraints: [],
  });
}
expect(sameDigests(current, extractEnumSemanticSlices(calculationAppend)),
  "calculation-append-invariance", "accepted Calculation additions changed an Enum semantic slice");

const reordered = clone(baselineBundle);
reordered.selectorContractBytes = baselineBundle.selectorContractBytes;
reordered.ontology.property_definitions.reverse();
reordered.ontology.concept_types.reverse();
reordered.projection.meta_types.reverse();
expect(sameDigests(current, extractEnumSemanticSlices(reordered)),
  "unordered-source-reordering", "semantically unordered source arrays changed a slice digest");

const extendsReordered = clone(baselineBundle);
extendsReordered.selectorContractBytes = baselineBundle.selectorContractBytes;
extendsReordered.typescriptProfile.extends = ["./later.profile.json", ...extendsReordered.typescriptProfile.extends];
const orderedChange = extractEnumSemanticSlices(extendsReordered);
expect(current.typescriptProfile.semantic_sha256 !== orderedChange.typescriptProfile.semantic_sha256,
  "ordered-extends-sensitive", "precedence-sensitive extends ordering was ignored");

const enumMeaningChanged = clone(baselineBundle);
enumMeaningChanged.selectorContractBytes = baselineBundle.selectorContractBytes;
enumMeaningChanged.ontology.concept_types.find(({concept_id: id}) =>
  id === "architecture.EnumImplementation").forbidden_collapse = "changed Enum meaning";
expect(current.ontology.semantic_sha256 !==
  extractEnumSemanticSlices(enumMeaningChanged).ontology.semantic_sha256,
"enum-meaning-sensitive", "Enum concept meaning drift did not change the ontology slice");

expectReject("duplicate-concept", "SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", (bundle) => {
  bundle.ontology.concept_types.push(clone(bundle.ontology.concept_types.find(({concept_id: id}) =>
    id === "architecture.EnumImplementation")));
}, baselineBundle);
expectReject("missing-property", "SEMANTIC_SLICE_SELECTED_ID_MISSING", (bundle) => {
  bundle.ontology.property_definitions = bundle.ontology.property_definitions.filter(
    ({property_id: id}) => id !== "enum.composition_kind");
}, baselineBundle);
expectReject("duplicate-overlay", "SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", (bundle) => {
  bundle.pythonProfile.representation_overlays.push(clone(bundle.pythonProfile.representation_overlays.find(
    ({contract_id: id}) => id === "enum.profile-representation")));
}, baselineBundle);
expectReject("duplicate-protocol", "SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", (bundle) => {
  const overlay = bundle.rustProfile.representation_overlays.find(
    ({contract_id: id}) => id === "enum.profile-representation");
  overlay.candidate_protocols.push(clone(overlay.candidate_protocols[0]));
}, baselineBundle);
expectReject("unresolved-ancestor", "SEMANTIC_SLICE_SELECTED_ID_MISSING", (bundle) => {
  bundle.ontology.concept_types.find(({concept_id: id}) =>
    id === "architecture.EnumImplementation").extends = "architecture.Missing";
}, baselineBundle);
expectReject("authority-inflation", "SEMANTIC_SLICE_AUTHORITY_INFLATION", (bundle) => {
  bundle.ontology.authority_effect = "promotion";
}, baselineBundle);

const result = {
  schema_version: "MetaTypeSemanticSliceValidation/v1",
  selector_id: "domainspec.enum-semantic-slice/v1",
  result: errors.length === 0 ? "pass" : "fail",
  semantic_digests: digestMap(current),
  checks_passed: checks.filter(({result: status}) => status === "pass").length,
  checks_total: checks.length,
  checks,
  errors,
  claim_ceiling: "deterministic candidate-local Enum semantic-slice concordance and hostile sensitivity; not ontology promotion, publication, deployment, or production proof",
  authority_effect: "none",
};

console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
