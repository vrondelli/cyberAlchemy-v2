#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../../../..");
const relative = {
  oldAdmission: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.json",
  oldDescriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/cross-language-realization-descriptor.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/cross-language-realization-descriptor.semantic-slice-v1.json",
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.semantic-slice-v1.json",
  decision: "projects/domainspec-v2/development/ontology-form-decisions/decisions/W1-ENUM-001.json",
  catalogue: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/owner-member-wire-catalogue.json",
  dependency: "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-006.json",
  selector: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/selector-contract.enum-v1.json",
  extractor: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/extract-meta-type-semantic-slices.mjs",
  validator: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/validate-meta-type-semantic-slices.mjs",
  request: "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum-semantic-slice.request.json",
  tsProvider: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/typescript-enum-shipment-priority-semantic-slice-v1.ts",
  pythonProvider: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/python-enum-v1.ts",
  rustProvider: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/providers/rust-enum-v1.ts",
};
const slicePaths = {
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/ontology.slice.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/projection.slice.json",
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/typescript-profile.slice.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/python-profile.slice.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/rust-profile.slice.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const ref = (path) => ({path, sha256: sha256(bytes(path))});
const sliceRef = (role, path) => {
  const slice = JSON.parse(bytes(path));
  return {role, ...ref(path), semantic_sha256: slice.semantic_sha256};
};
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const write = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, json(value), "utf8");
};

const semanticSliceRefs = [
  sliceRef("ontology", slicePaths.ontology),
  sliceRef("meta-type-projection", slicePaths.projection),
  sliceRef("typescript-profile", slicePaths.typescript),
  sliceRef("python-profile", slicePaths.python),
  sliceRef("rust-profile", slicePaths.rust),
];

const descriptor = {
  schema_version: "domainspec.enum-cross-language-realization-descriptor/v2",
  descriptor_id: "candidate.logistics.shipment-priority.cross-language/semantic-slice-v1",
  descriptor_status: "implemented-candidate",
  supersedes_ref: ref(relative.oldDescriptor),
  meta_type_ref: "DS-D1.3",
  architecture_type_ref: "architecture.EnumImplementation",
  concept_id: "candidate.logistics.shipment-priority",
  binding: {
    protocol_id: "domainspec.meta-type-semantic-slice-binding/v1",
    decision_ref: ref(relative.decision),
    catalogue_ref: ref(relative.catalogue),
    selector_contract_ref: ref(relative.selector),
    semantic_slice_refs: semanticSliceRefs,
  },
  language_bindings: [
    {
      language: "typescript",
      protocol_id: "typescript.owned-const-object-enum/v1",
      form_id: "typescript.owned-const-object-enum",
      status: "implemented-candidate",
      profile_slice_ref: semanticSliceRefs.find(({role}) => role === "typescript-profile"),
      provider_ref: ref(relative.tsProvider),
    },
    {
      language: "python",
      protocol_id: "python.nominal-enum-explicit-wire/v1",
      form_id: "python.enum-class",
      status: "implemented-candidate",
      profile_slice_ref: semanticSliceRefs.find(({role}) => role === "python-profile"),
      provider_ref: ref(relative.pythonProvider),
    },
    {
      language: "rust",
      protocol_id: "rust.nominal-enum-explicit-wire/v1",
      form_id: "rust.native-enum",
      status: "implemented-candidate",
      profile_slice_ref: semanticSliceRefs.find(({role}) => role === "rust-profile"),
      provider_ref: ref(relative.rustProvider),
    },
  ],
  proof_frontier: {
    factory_request_ref: ref(relative.request),
    direct_target_count: 3,
    composition_status: "candidate-proven",
    parity_status: "candidate-proven",
    same_oracle_replay_required: true,
  },
  historical_boundary: {
    prior_receipts: "immutable",
    prior_candidate: "immutable",
    prior_whole_file_request: "historical-only",
  },
  claim_ceiling: "candidate-local Enum implementation descriptor bound to five concordant semantic slices and three language providers; no ontology promotion, publication, deployment, or production claim",
  authority_effect: "none",
};
write(relative.descriptor, descriptor);

const admission = {
  schema_version: "domainspec.enum-protocol-admission/v2",
  admission_id: "RMT-ENUM-CONTINUITY-001-semantic-slice-admission",
  admission_status: "implemented-candidate",
  result: "pass",
  supersedes_ref: ref(relative.oldAdmission),
  meta_type_id: "DS-D1.3",
  architecture_type_id: "architecture.EnumImplementation",
  concept_id: "candidate.logistics.shipment-priority",
  dependency_ref: {...ref(relative.dependency), swu_id: "RMT-ENUM-006", required_result: "pass"},
  decision_ref: {...ref(relative.decision), selected_option_id: "W1-ENUM-A-NOMINAL-BOUNDARY"},
  descriptor_ref: ref(relative.descriptor),
  selector_contract_ref: ref(relative.selector),
  extractor_ref: ref(relative.extractor),
  concordance_validator_ref: ref(relative.validator),
  semantic_slice_refs: semanticSliceRefs,
  factory_request_ref: ref(relative.request),
  selected_protocols: descriptor.language_bindings,
  continuity_policy: {
    unrelated_shared_document_additions: "semantic-digest-stable",
    selected_enum_meaning_change: "semantic-digest-changes-or-rejects",
    current_source_concordance: "required-before-dependent-swu",
    historical_evidence: "preserved-byte-for-byte",
  },
  implementation_effects: {
    semantic_slice_extractor_created: true,
    versioned_typescript_provider_created: true,
    python_provider_reused: true,
    rust_provider_reused: true,
    parity_rebound_to_versioned_typescript_provider: true,
    ontology_authority_changed: false,
  },
  successor: {
    swu_id: "RMT-CALC-001",
    state: "dependency-ready-after-concordance-proof",
  },
  claim_ceiling: "candidate-local semantic-slice admission and versioned Enum proof lane; no authority, promotion, publication, deployment, release, or production effect",
  authority_effect: "none",
};
write(relative.admission, admission);

console.log(JSON.stringify({
  result: "pass",
  descriptor: ref(relative.descriptor),
  admission: ref(relative.admission),
  slice_count: semanticSliceRefs.length,
  authority_effect: "none",
}, null, 2));
