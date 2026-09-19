#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT ?? process.cwd());
const canonicalPackageRoot = resolve(
  repositoryRoot,
  "projects/domainspec-v2/development/architecture-realization-compiler",
);
const packageRoot = resolve(
  process.env.DOMAINSPEC_ARCHITECTURE_REALIZATION_ROOT ?? canonicalPackageRoot,
);
const receiptPath = resolve(
  process.env.DOMAINSPEC_ARCHITECTURE_REALIZATION_RECEIPT
    ?? resolve(packageRoot, "receipts/SWU-ARE-001.red.json"),
);

const paths = Object.freeze({
  schema: resolve(packageRoot, "contracts/architecture-realization-spec.schema.json"),
  expected: resolve(packageRoot, "fixtures/order-status/realization-spec.expected.json"),
  mutant: resolve(packageRoot, "fixtures/order-status/realization-spec.missing-property.json"),
  verifier: resolve(packageRoot, "tools/verify-red-realization-spec.mjs"),
  ontology: resolve(
    repositoryRoot,
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  ),
  baseProfile: resolve(
    repositoryRoot,
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json",
  ),
  typescriptProfile: resolve(
    repositoryRoot,
    "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  ),
  projector: resolve(
    repositoryRoot,
    "projects/domainspec-v2/impl/architecture-conformance/realization/spec/derive-enum-realization-spec.ts",
  ),
});

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const semanticDigest = (document) => {
  const payload = structuredClone(document);
  delete payload.spec_sha256;
  return sha256(canonicalJson(payload));
};
const same = (left, right) => canonicalJson(left) === canonicalJson(right);

const readJson = async (path, label) => {
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new Error(`ARCH_REALIZATION_INPUT_MISSING: ${label}: ${error.code ?? error.message}`);
  }
  try {
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
  } catch (error) {
    throw new Error(`ARCH_REALIZATION_JSON_INVALID: ${label}: ${error.message}`);
  }
};

const exactRef = async (path, relativePath) => {
  const bytes = await readFile(path);
  return Object.freeze({ path: relativePath, sha256: sha256(bytes), size_bytes: bytes.byteLength });
};

const diagnostic = (code, detail = {}) => Object.freeze({ code, ...detail });

const assertSchemaContract = (schema) => {
  if (schema.$id !== "https://domainspec.dev/schemas/architecture-realization-spec/v1") {
    throw new Error("ARCH_REALIZATION_SCHEMA_ID_INVALID");
  }
  if (schema.additionalProperties !== false || schema.properties?.schema_version?.const !== "ArchitectureRealizationSpec/v1") {
    throw new Error("ARCH_REALIZATION_SCHEMA_OPEN_OR_MISMATCHED");
  }
  const required = new Set(schema.required ?? []);
  for (const field of [
    "schema_version",
    "spec_id",
    "ontology_ref",
    "profile_ref",
    "realization_type",
    "definition_type_ref",
    "required_properties",
    "required_relations",
    "constraint_operators",
    "composition_kind",
    "unsupported_outcomes",
    "spec_sha256",
    "authority_effect",
  ]) {
    if (!required.has(field)) throw new Error(`ARCH_REALIZATION_SCHEMA_FIELD_MISSING: ${field}`);
  }
};

const isSubtype = (conceptById, actualType, expectedType) => {
  let current = conceptById.get(actualType);
  while (current) {
    if (current.concept_id === expectedType) return true;
    current = current.extends ? conceptById.get(current.extends) : null;
  }
  return false;
};

const propertyProjection = (property) => ({
  property_id: property.property_id,
  value_type: property.value_type,
  observation_stage: property.observation_stage,
  owner_route: property.owner_route,
  forbidden_inference: property.forbidden_inference,
});

const validateSpec = ({ spec, ontology, baseProfile, typescriptProfile, sourceDigests }) => {
  const diagnostics = [];
  const requiredTopLevel = [
    "schema_version",
    "spec_id",
    "ontology_ref",
    "profile_ref",
    "realization_type",
    "definition_type_ref",
    "required_properties",
    "required_relations",
    "constraint_operators",
    "composition_kind",
    "unsupported_outcomes",
    "spec_sha256",
    "authority_effect",
  ];
  const actualKeys = Object.keys(spec).sort();
  if (!same(actualKeys, [...requiredTopLevel].sort())) diagnostics.push(diagnostic("ARCH_REALIZATION_SPEC_SHAPE_INVALID"));
  if (spec.schema_version !== "ArchitectureRealizationSpec/v1") diagnostics.push(diagnostic("ARCH_REALIZATION_SCHEMA_VERSION_INVALID"));
  if (spec.realization_type !== "architecture.EnumImplementation") diagnostics.push(diagnostic("ARCH_REALIZATION_TYPE_INVALID"));
  if (spec.definition_type_ref !== "DS-D1.3") diagnostics.push(diagnostic("ARCH_REALIZATION_DEFINITION_TYPE_INVALID"));
  if (spec.composition_kind !== "direct") diagnostics.push(diagnostic("ARCH_REALIZATION_COMPOSITION_INVALID"));
  if (spec.authority_effect !== "none") diagnostics.push(diagnostic("ARCH_REALIZATION_AUTHORITY_INFLATION"));
  if (semanticDigest(spec) !== spec.spec_sha256) diagnostics.push(diagnostic("ARCH_REALIZATION_SPEC_DIGEST_STALE"));

  const ontologyRef = {
    ontology_id: ontology.ontology_id,
    schema_version: ontology.schema_version,
    sha256: sourceDigests.ontology,
  };
  if (!same(spec.ontology_ref, ontologyRef)) diagnostics.push(diagnostic("ARCH_REALIZATION_ONTOLOGY_REF_STALE"));
  const profileRef = {
    profile_id: typescriptProfile.profile_id,
    schema_version: typescriptProfile.schema_version,
    sha256: sourceDigests.typescriptProfile,
    extends: [{
      profile_id: baseProfile.profile_id,
      schema_version: baseProfile.schema_version,
      sha256: sourceDigests.baseProfile,
    }],
  };
  if (!same(spec.profile_ref, profileRef)) diagnostics.push(diagnostic("ARCH_REALIZATION_PROFILE_REF_STALE"));

  const conceptById = new Map(ontology.concept_types.map((concept) => [concept.concept_id, concept]));
  const realization = conceptById.get("architecture.EnumImplementation");
  if (!realization || realization.canonical_meta_type_ref !== "DS-D1.3") {
    diagnostics.push(diagnostic("ARCH_REALIZATION_ENUM_TYPE_MISSING"));
  }

  const representationOverlay = (typescriptProfile.representation_overlays ?? []).find(
    ({ contract_id }) => contract_id === "enum.profile-representation",
  );
  if (!representationOverlay) diagnostics.push(diagnostic("ARCH_REALIZATION_PROFILE_OVERLAY_MISSING"));
  const exactEnumConstraints = [
    ...(baseProfile.constraints ?? []).filter(({ applies_to }) => applies_to?.includes("architecture.EnumImplementation")),
    ...(representationOverlay?.representation_constraints ?? []).filter(({ applies_to }) => applies_to?.includes("architecture.EnumImplementation")),
  ];
  const requiredPropertyIds = new Set([
    ...exactEnumConstraints.map(({ property_id }) => property_id),
    "binding.concept_id",
    "binding.current",
    "enum.implemented_members",
    "enum.composition_kind",
  ]);
  const propertyById = new Map(ontology.property_definitions.map((property) => [property.property_id, property]));
  const suppliedProperties = new Map((spec.required_properties ?? []).map((property) => [property.property_id, property]));
  if (suppliedProperties.size !== (spec.required_properties ?? []).length) {
    diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_DUPLICATE"));
  }
  for (const propertyId of [...requiredPropertyIds].sort()) {
    const source = propertyById.get(propertyId);
    const supplied = suppliedProperties.get(propertyId);
    if (!source || !supplied) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_MISSING", { property_id: propertyId }));
      continue;
    }
    if (!source.applies_to?.types?.some((type) => isSubtype(conceptById, "architecture.EnumImplementation", type))) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_APPLICABILITY_INVALID", { property_id: propertyId }));
    }
    if (!source.owner_route || !source.forbidden_inference) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_METADATA_INCOMPLETE", { property_id: propertyId }));
    }
    if (!same(supplied, propertyProjection(source))) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_METADATA_STALE", { property_id: propertyId }));
    }
  }
  for (const propertyId of suppliedProperties.keys()) {
    if (!requiredPropertyIds.has(propertyId)) diagnostics.push(diagnostic("ARCH_REALIZATION_PROPERTY_UNDECLARED", { property_id: propertyId }));
  }

  const requiredOperatorIds = new Set(exactEnumConstraints.map(({ operator }) => operator));
  const operatorById = new Map(ontology.constraint_operators.map((operator) => [operator.operator_id, operator]));
  const suppliedOperators = new Map((spec.constraint_operators ?? []).map((operator) => [operator.operator_id, operator]));
  if (suppliedOperators.size !== (spec.constraint_operators ?? []).length) diagnostics.push(diagnostic("ARCH_REALIZATION_OPERATOR_DUPLICATE"));
  for (const operatorId of [...requiredOperatorIds].sort()) {
    const source = operatorById.get(operatorId);
    const supplied = suppliedOperators.get(operatorId);
    if (!source || !supplied) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_OPERATOR_MISSING", { operator_id: operatorId }));
    } else if (!same(source, supplied)) {
      diagnostics.push(diagnostic("ARCH_REALIZATION_OPERATOR_METADATA_STALE", { operator_id: operatorId }));
    }
  }
  for (const operatorId of suppliedOperators.keys()) {
    if (!requiredOperatorIds.has(operatorId)) diagnostics.push(diagnostic("ARCH_REALIZATION_OPERATOR_UNDECLARED", { operator_id: operatorId }));
  }

  if (!Array.isArray(spec.required_relations) || spec.required_relations.length !== 0) {
    diagnostics.push(diagnostic("ARCH_REALIZATION_DIRECT_RELATION_INVALID"));
  }
  const unsupportedOutcomes = [
    ...(representationOverlay?.unsupported_forms ?? []),
    representationOverlay?.missing_decision_outcome,
    representationOverlay?.language_mismatch_outcome,
  ].filter(Boolean).sort();
  if (!same(spec.unsupported_outcomes, unsupportedOutcomes)) diagnostics.push(diagnostic("ARCH_REALIZATION_UNSUPPORTED_OUTCOMES_STALE"));
  return diagnostics;
};

const main = async () => {
  const [schemaInput, expectedInput, mutantInput, ontologyInput, baseProfileInput, typescriptProfileInput] = await Promise.all([
    readJson(paths.schema, "schema"),
    readJson(paths.expected, "expected fixture"),
    readJson(paths.mutant, "missing-property fixture"),
    readJson(paths.ontology, "architecture ontology"),
    readJson(paths.baseProfile, "base profile"),
    readJson(paths.typescriptProfile, "TypeScript profile"),
  ]);
  assertSchemaContract(schemaInput.value);
  const sourceDigests = {
    ontology: sha256(ontologyInput.bytes),
    baseProfile: sha256(baseProfileInput.bytes),
    typescriptProfile: sha256(typescriptProfileInput.bytes),
  };
  const common = {
    ontology: ontologyInput.value,
    baseProfile: baseProfileInput.value,
    typescriptProfile: typescriptProfileInput.value,
    sourceDigests,
  };
  const positiveDiagnostics = validateSpec({ spec: expectedInput.value, ...common });
  if (positiveDiagnostics.length !== 0) {
    throw new Error(`ARCH_REALIZATION_EXPECTED_INVALID: ${JSON.stringify(positiveDiagnostics)}`);
  }
  const mutantDiagnostics = validateSpec({ spec: mutantInput.value, ...common });
  const expectedMutantDiagnostics = [diagnostic("ARCH_REALIZATION_PROPERTY_MISSING", { property_id: "runtime.provider_sha256" })];
  if (!same(mutantDiagnostics, expectedMutantDiagnostics)) {
    throw new Error(`ARCH_REALIZATION_MUTANT_NOT_DISCRIMINATING: ${JSON.stringify(mutantDiagnostics)}`);
  }
  const repairedMutant = structuredClone(mutantInput.value);
  repairedMutant.required_properties.push(
    expectedInput.value.required_properties.find(({ property_id }) => property_id === "runtime.provider_sha256"),
  );
  repairedMutant.required_properties.sort((left, right) => left.property_id.localeCompare(right.property_id));
  repairedMutant.spec_sha256 = expectedInput.value.spec_sha256;
  if (!same(repairedMutant, expectedInput.value)) {
    throw new Error("ARCH_REALIZATION_MUTANT_HAS_MULTIPLE_CAUSES");
  }
  try {
    await readFile(paths.projector);
    throw new Error("ARCH_REALIZATION_PROJECTOR_UNEXPECTEDLY_PRESENT");
  } catch (error) {
    if (error.message === "ARCH_REALIZATION_PROJECTOR_UNEXPECTEDLY_PRESENT") throw error;
    if (error.code !== "ENOENT") throw error;
  }

  const materialRefs = await Promise.all([
    exactRef(paths.schema, "contracts/architecture-realization-spec.schema.json"),
    exactRef(paths.expected, "fixtures/order-status/realization-spec.expected.json"),
    exactRef(paths.mutant, "fixtures/order-status/realization-spec.missing-property.json"),
    exactRef(paths.verifier, "tools/verify-red-realization-spec.mjs"),
  ]);
  const sourceRefs = await Promise.all([
    exactRef(paths.ontology, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json"),
    exactRef(paths.baseProfile, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json"),
    exactRef(paths.typescriptProfile, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json"),
  ]);
  const receipt = {
    schema_version: "domainspec.architecture-realization-red-receipt/v1",
    result: "pass",
    task_id: "TASK-ARE-L0-CONTRACTS",
    swu_id: "SWU-ARE-001",
    status: "expected-red",
    spec_id: expectedInput.value.spec_id,
    spec_sha256: expectedInput.value.spec_sha256,
    mutant_sha256: mutantInput.value.spec_sha256,
    exact_mutant_diagnostic: expectedMutantDiagnostics[0],
    projector: {
      path: "projects/domainspec-v2/impl/architecture-conformance/realization/spec/derive-enum-realization-spec.ts",
      state: "absent",
    },
    material_refs: materialRefs,
    source_refs: sourceRefs,
    validation: {
      command: "node projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs",
      positive_diagnostics: 0,
      mutant_diagnostics: 1,
      causal_mutant: true,
      deterministic_replay: true,
    },
    authority_effect: "none",
    claim_ceiling: "Frozen candidate-local expected-red contract only; no projector, source generation, conformance, promotion, publication, deployment, or release proof.",
  };
  await mkdir(dirname(receiptPath), { recursive: true });
  const temporaryReceiptPath = `${receiptPath}.tmp-${process.pid}`;
  await writeFile(temporaryReceiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  await rename(temporaryReceiptPath, receiptPath);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
};

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
