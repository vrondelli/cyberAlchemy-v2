#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(here, "../../../../../..");
const experimentRoot = resolve(here, "..");

export const paths = Object.freeze({
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  baseProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json",
  typescriptProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  pythonProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rustProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  selectorContract: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/selector-contract.enum-v1.json",
});

export const outputPaths = Object.freeze({
  ontology: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/ontology.slice.json",
  projection: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/projection.slice.json",
  typescriptProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/typescript-profile.slice.json",
  pythonProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/python-profile.slice.json",
  rustProfile: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/enum/rust-profile.slice.json",
});

const fail = (code, detail = null) => {
  throw Object.assign(new Error(detail === null ? code : `${code}:${detail}`), {code, detail});
};
const asObject = (value, code = "SEMANTIC_SLICE_SOURCE_SHAPE_INVALID") =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value : fail(code);
const asArray = (value, code = "SEMANTIC_SLICE_SOURCE_SHAPE_INVALID") =>
  Array.isArray(value) ? value : fail(code);
const asString = (value, code = "SEMANTIC_SLICE_SOURCE_SHAPE_INVALID") =>
  typeof value === "string" && value.length > 0 ? value : fail(code);
const utf8Compare = (left, right) => Buffer.from(left).compare(Buffer.from(right));
const by = (key) => (left, right) => utf8Compare(asString(left[key]), asString(right[key]));
const clone = (value) => structuredClone(value);

export const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => utf8Compare(left, right))
      .map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
};
export const canonicalJson = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const assertSafeFile = (root, relativePath) => {
  const target = resolve(root, relativePath);
  if (!target.startsWith(`${root}${sep}`) || !existsSync(target)) fail("SEMANTIC_SLICE_SOURCE_UNSAFE", relativePath);
  const stat = lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(target) !== target) {
    fail("SEMANTIC_SLICE_SOURCE_UNSAFE", relativePath);
  }
  return target;
};

const readJson = (root, relativePath) => {
  const target = assertSafeFile(root, relativePath);
  try {
    return JSON.parse(readFileSync(target, "utf8"));
  } catch {
    return fail("SEMANTIC_SLICE_SOURCE_JSON_INVALID", relativePath);
  }
};

const indexUnique = (values, key, role) => {
  const map = new Map();
  for (const raw of asArray(values)) {
    const value = asObject(raw);
    const id = asString(value[key]);
    if (map.has(id)) fail("SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", `${role}:${id}`);
    map.set(id, value);
  }
  return map;
};

const exactOne = (values, predicate, role) => {
  const selected = asArray(values).filter(predicate);
  if (selected.length === 0) fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", role);
  if (selected.length > 1) fail("SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", role);
  return asObject(selected[0]);
};

const assertBoundary = (document, role) => {
  if (document.authority_effect !== "none") fail("SEMANTIC_SLICE_AUTHORITY_INFLATION", role);
  if (typeof document.status === "string" && ![
    "candidate", "candidate-read-model", "active-candidate",
  ].includes(document.status)) {
    fail("SEMANTIC_SLICE_STATUS_INVALID", role);
  }
};

const appliesToEnum = (constraint) =>
  asArray(constraint.applies_to ?? []).includes("architecture.EnumImplementation");
const enumOverlay = (profile) => exactOne(
  profile.representation_overlays,
  (candidate) => candidate?.contract_id === "enum.profile-representation",
  `${profile.language}:enum.profile-representation`,
);

const selectProfile = (profile, baseProfile) => {
  assertBoundary(profile, `${profile.language}-profile`);
  const overlay = enumOverlay(profile);
  if (overlay.authority_effect !== undefined && overlay.authority_effect !== "none") {
    fail("SEMANTIC_SLICE_AUTHORITY_INFLATION", `${profile.language}:overlay`);
  }
  const protocols = asArray(overlay.candidate_protocols ?? []);
  const protocolIds = new Set();
  for (const raw of protocols) {
    const protocol = asObject(raw);
    const id = asString(protocol.protocol_id);
    if (protocolIds.has(id)) fail("SEMANTIC_SLICE_DUPLICATE_SELECTED_ID", `${profile.language}:${id}`);
    protocolIds.add(id);
  }
  if (protocols.length !== 1) fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", `${profile.language}:selected-protocol`);
  const inheritedConstraints = asArray(baseProfile.constraints ?? []).filter(appliesToEnum).map(clone);
  const localConstraints = asArray(profile.constraints ?? []).filter(appliesToEnum).map(clone);
  const effectiveConstraints = [...inheritedConstraints, ...localConstraints]
    .sort(by("constraint_id"));
  indexUnique(effectiveConstraints, "constraint_id", `${profile.language}:constraint`);
  return {
    profile_document: {
      schema_version: asString(profile.schema_version),
      profile_id: asString(profile.profile_id),
      language: asString(profile.language),
      status: profile.status,
      extends: clone(asArray(profile.extends ?? [])),
      constraints: effectiveConstraints,
      representation_overlays: [clone(overlay)],
      authority_effect: "none",
    },
    inherited_profiles: [{
      schema_version: asString(baseProfile.schema_version),
      profile_id: asString(baseProfile.profile_id),
      language: asString(baseProfile.language),
      status: baseProfile.status,
      extends: clone(asArray(baseProfile.extends ?? [])),
      constraints: inheritedConstraints.sort(by("constraint_id")),
      representation_overlays: [],
      authority_effect: "none",
    }],
  };
};

const selectOntology = (ontology, profiles) => {
  assertBoundary(ontology, "ontology");
  const concepts = indexUnique(ontology.concept_types, "concept_id", "concept");
  const roots = ["architecture.EnumImplementation", "architecture.EnumRepresentationUnit"];
  const selectedConceptIds = new Set();
  for (const root of roots) {
    let current = root;
    const ancestry = new Set();
    while (current !== null) {
      if (ancestry.has(current)) fail("SEMANTIC_SLICE_UNRESOLVED_REFERENCE", `concept-cycle:${current}`);
      ancestry.add(current);
      const concept = concepts.get(current) ?? fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", `concept:${current}`);
      selectedConceptIds.add(current);
      current = concept.extends === null ? null : asString(concept.extends);
    }
  }
  const selectedConcepts = [...selectedConceptIds].map((id) => clone(concepts.get(id))).sort(by("concept_id"));
  const properties = indexUnique(ontology.property_definitions, "property_id", "property");
  const propertyIds = new Set([
    "binding.concept_id",
    "binding.current",
    "enum.composition_kind",
    "enum.implemented_members",
  ]);
  for (const id of properties.keys()) {
    if (id.startsWith("binding.expected_enum") || id.startsWith("enum.")) propertyIds.add(id);
  }
  for (const profile of profiles) {
    for (const constraint of profile.profile_document.constraints) propertyIds.add(asString(constraint.property_id));
    for (const constraint of profile.profile_document.representation_overlays[0].representation_constraints ?? []) {
      propertyIds.add(asString(constraint.property_id));
    }
  }
  const selectedProperties = [...propertyIds].map((id) =>
    clone(properties.get(id) ?? fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", `property:${id}`)),
  ).sort(by("property_id"));
  for (const property of selectedProperties) {
    const types = asArray(asObject(property.applies_to).types);
    if (!types.some((type) => selectedConceptIds.has(type) || type === "architecture.DomainConceptImplementation")) {
      fail("SEMANTIC_SLICE_FOREIGN_SELECTED_REFERENCE", `property:${property.property_id}`);
    }
  }
  const operatorIds = new Set();
  for (const profile of profiles) {
    for (const constraint of [
      ...profile.profile_document.constraints,
      ...(profile.profile_document.representation_overlays[0].representation_constraints ?? []),
    ]) operatorIds.add(asString(constraint.operator));
  }
  const operators = indexUnique(ontology.constraint_operators, "operator_id", "operator");
  const selectedOperators = [...operatorIds].map((id) =>
    clone(operators.get(id) ?? fail("SEMANTIC_SLICE_UNRESOLVED_REFERENCE", `operator:${id}`)),
  ).sort(by("operator_id"));
  const relations = indexUnique(ontology.relation_definitions, "relation_id", "relation");
  const selectedRelations = [clone(relations.get("architecture.composed_from") ??
    fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", "relation:architecture.composed_from"))];
  const relevantPropertyIds = new Set(selectedProperties.map(({property_id: id}) => id));
  const languageProjections = asArray(ontology.language_projections).map((raw) => {
    const projection = asObject(raw);
    const language = asString(projection.language);
    if (!profiles.some(({profile_document: profile}) => profile.language === language)) return null;
    return {
      projection_id: asString(projection.projection_id),
      language,
      projection_kind: projection.projection_kind,
      source_refs: asArray(projection.source_refs ?? []).filter((id) => String(id).startsWith("domainspec.enum")),
      observes: asArray(projection.observes ?? []).filter((id) => relevantPropertyIds.has(id)).sort(utf8Compare),
      allowed_use: projection.allowed_use,
      blocked_use: projection.blocked_use,
      drift_owner: projection.drift_owner,
      expiry_or_review_trigger: projection.expiry_or_review_trigger,
    };
  }).filter(Boolean).sort(by("projection_id"));
  const sourceRefs = indexUnique(ontology.source_refs, "source_id", "source-ref");
  const sourceIds = new Set();
  for (const value of [...selectedConcepts, ...languageProjections]) {
    for (const id of value.source_refs ?? []) sourceIds.add(asString(id));
  }
  const selectedSourceRefs = [...sourceIds].map((id) => {
    const source = sourceRefs.get(id) ?? fail("SEMANTIC_SLICE_UNRESOLVED_REFERENCE", `source:${id}`);
    if (id.startsWith("domainspec.enum")) return clone(source);
    return {source_id: id, path: source.path, use: source.use};
  }).sort(by("source_id"));
  return {
    ontology_document: {
      schema_version: asString(ontology.schema_version),
      ontology_id: asString(ontology.ontology_id),
      model_kind: ontology.model_kind,
      status: ontology.status,
      source_refs: selectedSourceRefs,
      concept_types: selectedConcepts,
      property_definitions: selectedProperties,
      relation_definitions: selectedRelations,
      constraint_operators: selectedOperators,
      language_projections: languageProjections,
      authority_effect: "none",
    },
  };
};

const selectProjection = (projection) => {
  assertBoundary(projection, "projection");
  const metaTypes = indexUnique(projection.meta_types, "meta_type_id", "projection-meta-type");
  const enumType = clone(metaTypes.get("DS-D1.3") ??
    fail("SEMANTIC_SLICE_SELECTED_ID_MISSING", "projection:DS-D1.3"));
  if (enumType.architecture_type_id !== "architecture.EnumImplementation") {
    fail("SEMANTIC_SLICE_FOREIGN_SELECTED_REFERENCE", "projection:DS-D1.3");
  }
  return {
    projection_document: {
      schema_version: asString(projection.schema_version),
      projection_id: asString(projection.projection_id),
      purpose: projection.purpose,
      status: projection.status,
      source_refs: clone(asArray(projection.source_refs ?? [])).sort(utf8Compare),
      meta_types: [enumType],
      authority_effect: "none",
    },
  };
};

const envelope = ({role, language = null, sourceLocators, semanticContent, contractSha256}) => ({
  schema_version: "MetaTypeSemanticSlice/v1",
  slice_id: `enum.${role}/v1`,
  meta_type_id: "DS-D1.3",
  architecture_type_id: "architecture.EnumImplementation",
  source_role: role.endsWith("profile") ? "language-profile" : role,
  language,
  selector_contract: {
    id: "domainspec.enum-semantic-slice/v1",
    sha256: contractSha256,
  },
  source_locators: sourceLocators,
  semantic_content: semanticContent,
  semantic_sha256: sha256(canonicalJson(semanticContent)),
  status: "candidate",
  authority_effect: "none",
});

export const loadEnumSourceBundle = (root = repositoryRoot) => ({
  ontology: readJson(root, paths.ontology),
  projection: readJson(root, paths.projection),
  baseProfile: readJson(root, paths.baseProfile),
  typescriptProfile: readJson(root, paths.typescriptProfile),
  pythonProfile: readJson(root, paths.pythonProfile),
  rustProfile: readJson(root, paths.rustProfile),
  selectorContractBytes: readFileSync(assertSafeFile(root, paths.selectorContract)),
});

export const extractEnumSemanticSlices = (bundle, sourcePaths = paths) => {
  const contractSha256 = sha256(bundle.selectorContractBytes);
  const profileContents = [
    selectProfile(bundle.typescriptProfile, bundle.baseProfile),
    selectProfile(bundle.pythonProfile, bundle.baseProfile),
    selectProfile(bundle.rustProfile, bundle.baseProfile),
  ];
  const ontologyContent = selectOntology(bundle.ontology, profileContents);
  const projectionContent = selectProjection(bundle.projection);
  const profileSlice = (index, role, language, path) => envelope({
    role,
    language,
    sourceLocators: [
      {document_role: "language-profile", path},
      {document_role: "inherited-base-profile", path: sourcePaths.baseProfile},
    ],
    semanticContent: profileContents[index],
    contractSha256,
  });
  return Object.freeze({
    ontology: envelope({
      role: "ontology",
      sourceLocators: [{document_role: "ontology", path: sourcePaths.ontology}],
      semanticContent: ontologyContent,
      contractSha256,
    }),
    projection: envelope({
      role: "projection",
      sourceLocators: [{document_role: "projection", path: sourcePaths.projection}],
      semanticContent: projectionContent,
      contractSha256,
    }),
    typescriptProfile: profileSlice(0, "typescript-profile", "typescript", sourcePaths.typescriptProfile),
    pythonProfile: profileSlice(1, "python-profile", "python", sourcePaths.pythonProfile),
    rustProfile: profileSlice(2, "rust-profile", "rust", sourcePaths.rustProfile),
  });
};

export const renderSlice = (slice) => `${JSON.stringify(slice, null, 2)}\n`;

export const writeEnumSemanticSlices = (root = repositoryRoot) => {
  const slices = extractEnumSemanticSlices(loadEnumSourceBundle(root));
  for (const [role, relativePath] of Object.entries(outputPaths)) {
    const target = resolve(root, relativePath);
    if (!target.startsWith(`${root}${sep}`)) fail("SEMANTIC_SLICE_OUTPUT_UNSAFE", relativePath);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, renderSlice(slices[role]), {encoding: "utf8"});
  }
  return slices;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--write")) {
    const slices = writeEnumSemanticSlices();
    console.log(JSON.stringify({
      result: "pass",
      written: Object.entries(outputPaths).map(([role, path]) => ({
        role,
        path,
        semantic_sha256: slices[role].semantic_sha256,
      })),
      authority_effect: "none",
    }, null, 2));
  } else {
    const slices = extractEnumSemanticSlices(loadEnumSourceBundle());
    console.log(JSON.stringify(Object.fromEntries(Object.entries(slices)
      .map(([role, slice]) => [role, slice.semantic_sha256])), null, 2));
  }
}
