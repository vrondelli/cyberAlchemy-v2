#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const repositoryRoot = resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT ?? process.cwd());
const packageRoot = resolve(
  process.env.DOMAINSPEC_ARCHITECTURE_REALIZATION_ROOT
    ?? resolve(repositoryRoot, "projects/domainspec-v2/development/architecture-realization-compiler"),
);
const argumentsByName = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--self-test") argumentsByName.set(argument, true);
  else if (argument.startsWith("--")) argumentsByName.set(argument, process.argv[index += 1]);
}

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
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const diagnostic = (code, detail = undefined) => ({ code, ...(detail === undefined ? {} : { detail }) });
const exactKeys = (value, expected) =>
  value !== null && typeof value === "object" && !Array.isArray(value)
  && same(Object.keys(value).sort(), [...expected].sort());
const safeRelativePath = (path) =>
  typeof path === "string" && path.length > 0 && !isAbsolute(path)
  && !path.split("/").includes("..");

const readJson = async (path, code) => {
  try {
    return JSON.parse((await readFile(path)).toString("utf8"));
  } catch (error) {
    throw new Error(`${code}: ${error.message}`);
  }
};

const resolveSource = (sourceRef) => {
  if (!safeRelativePath(sourceRef?.path)) throw new Error("ARCH_OBLIGATION_SOURCE_PATH_INVALID");
  const absolute = resolve(repositoryRoot, sourceRef.path);
  if (!absolute.startsWith(`${repositoryRoot}/`)) throw new Error("ARCH_OBLIGATION_SOURCE_PATH_INVALID");
  return absolute;
};

const assertSchemaContract = (schema) => {
  if (schema.$id !== "https://domainspec.dev/schemas/architecture-obligation-catalogue/v1") {
    throw new Error("ARCH_OBLIGATION_SCHEMA_ID_INVALID");
  }
  if (schema.additionalProperties !== false
      || schema.properties?.schema_version?.const !== "ArchitectureObligationCatalogue/v1") {
    throw new Error("ARCH_OBLIGATION_SCHEMA_OPEN_OR_MISMATCHED");
  }
  const required = new Set(schema.required ?? []);
  for (const field of [
    "schema_version", "catalogue_id", "catalogue_version", "definition_ref",
    "ontology_ref", "profile_ref", "obligations", "catalogue_sha256",
    "owner_ref", "authority_effect",
  ]) {
    if (!required.has(field)) throw new Error(`ARCH_OBLIGATION_SCHEMA_FIELD_MISSING: ${field}`);
  }
};

const semanticDigest = (catalogue) => {
  const payload = structuredClone(catalogue);
  delete payload.catalogue_sha256;
  return sha256(canonicalJson(payload));
};

const validateCatalogue = async (catalogue) => {
  const diagnostics = [];
  if (!exactKeys(catalogue, [
    "schema_version", "catalogue_id", "catalogue_version", "definition_ref",
    "ontology_ref", "profile_ref", "obligations", "catalogue_sha256",
    "owner_ref", "authority_effect",
  ])) diagnostics.push(diagnostic("ARCH_OBLIGATION_CATALOGUE_SHAPE_INVALID"));
  if (catalogue.schema_version !== "ArchitectureObligationCatalogue/v1"
      || catalogue.catalogue_version !== "1") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_CATALOGUE_VERSION_INVALID"));
  }
  if (catalogue.authority_effect !== "none") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_AUTHORITY_INFLATION"));
  }
  if (catalogue.owner_ref !== "architecture-obligation-catalogue-owner"
      || ["typescript-realization-projector-owner", "enum-emitter-owner", "architecture-evaluator-owner"]
        .includes(catalogue.owner_ref)) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_OWNER_NOT_INDEPENDENT"));
  }

  const obligations = Array.isArray(catalogue.obligations) ? catalogue.obligations : [];
  const obligation = obligations[0];
  if (obligations.length !== 1 || !exactKeys(obligation, [
    "obligation_key", "contract_version", "subject_ref", "operator",
    "expected_payload", "failure_codes",
  ]) || obligation?.obligation_key !== "enum.member-bijection@1"
      || obligation?.contract_version !== "1"
      || obligation?.subject_ref !== "candidate.order-status@1"
      || obligation?.operator !== "member-bijection") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_CONTRACT_INVALID"));
  }

  const payload = obligation?.expected_payload;
  const members = Array.isArray(payload?.members) ? payload.members : [];
  if (!exactKeys(payload, ["concept_id", "composition_kind", "order_semantics", "members"])
      || payload?.concept_id !== "candidate.order-status"
      || payload?.composition_kind !== "direct"
      || payload?.order_semantics !== "none"
      || members.length === 0) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_PAYLOAD_INVALID"));
  }
  const memberIds = members.map(({ member_id: memberId }) => memberId);
  const semanticValues = members.map(({ semantic_value: semanticValue }) => semanticValue);
  if (members.some((member) => !exactKeys(member, ["member_id", "semantic_value"])
      || typeof member.member_id !== "string" || member.member_id.length === 0
      || typeof member.semantic_value !== "string" || member.semantic_value.length === 0)
      || new Set(memberIds).size !== memberIds.length
      || new Set(semanticValues).size !== semanticValues.length
      || !same(memberIds, [...memberIds].sort())) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_MEMBER_SET_INVALID"));
  }

  const sourceRefs = [catalogue.definition_ref, catalogue.ontology_ref, catalogue.profile_ref,
    ...(catalogue.profile_ref?.extends ?? [])];
  const sourceDocuments = [];
  for (const sourceRef of sourceRefs) {
    const sourcePath = resolveSource(sourceRef);
    const bytes = await readFile(sourcePath);
    if (sha256(bytes) !== sourceRef.sha256) {
      diagnostics.push(diagnostic("ARCH_OBLIGATION_SOURCE_DIGEST_STALE", { path: sourceRef.path }));
    }
    sourceDocuments.push(JSON.parse(bytes.toString("utf8")));
  }
  const [definitionSource, ontology, typescriptProfile, baseProfile] = sourceDocuments;
  const expectedMembers = [...(definitionSource.positive_members ?? [])]
    .sort(({ member_id: left }, { member_id: right }) => left.localeCompare(right));
  const enumType = (ontology.concept_types ?? [])
    .find(({ concept_id: conceptId }) => conceptId === "architecture.EnumImplementation");
  const enumProperties = new Set((ontology.property_definitions ?? []).map(({ property_id: propertyId }) => propertyId));
  const baseEnumConstraints = (baseProfile.constraints ?? [])
    .filter(({ applies_to: appliesTo }) => appliesTo?.includes("architecture.EnumImplementation"));
  const overlay = (typescriptProfile.representation_overlays ?? [])
    .find(({ contract_id: contractId }) => contractId === "enum.profile-representation");
  if (enumType?.canonical_meta_type_ref !== "DS-D1.3"
      || !["binding.expected_enum_values", "enum.implemented_members", "enum.implemented_values"]
        .every((propertyId) => enumProperties.has(propertyId))
      || !baseEnumConstraints.some(({ operator }) => operator === "set_equals")
      || overlay?.activation_binding?.protocol_id !== "typescript.owned-const-object-enum/v1") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_SOURCE_DENOMINATOR_INVALID"));
  }

  if (!same(members, expectedMembers) || semanticDigest(catalogue) !== catalogue.catalogue_sha256) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_PAYLOAD_STALE"));
  }
  return [...new Map(diagnostics.map((item) => [canonicalJson(item), item])).values()];
};

const assertForbiddenImports = async (validatorPath) => {
  const source = (await readFile(validatorPath)).toString("utf8");
  const imports = [
    ...source.matchAll(/from\s+["']([^"']+)["']/g),
    ...source.matchAll(/import\(["']([^"']+)["']\)/g),
    ...source.matchAll(/require\(["']([^"']+)["']\)/g),
  ].map((match) => match[1]);
  const forbidden = imports.filter((specifier) =>
    ["realization/spec", "realization/enum", "generator", "emitter", "adapter", "evaluator"]
      .some((part) => specifier.includes(part)),
  );
  if (forbidden.length > 0) throw new Error(`ARCH_OBLIGATION_FORBIDDEN_IMPORT: ${forbidden.join(",")}`);
};

const requestedCatalogue = argumentsByName.get("--catalogue");
if (typeof requestedCatalogue !== "string") throw new Error("ARCH_OBLIGATION_CATALOGUE_ARGUMENT_MISSING");
const cataloguePath = resolve(repositoryRoot, requestedCatalogue);
const paths = {
  schema: resolve(packageRoot, "contracts/architecture-obligation-catalogue.schema.json"),
  mutant: resolve(packageRoot, "fixtures/order-status/catalogue.same-key-drift.json"),
  validator: resolve(packageRoot, "tools/validate-obligation-catalogue.mjs"),
};
assertSchemaContract(await readJson(paths.schema, "ARCH_OBLIGATION_SCHEMA_JSON_INVALID"));
await assertForbiddenImports(paths.validator);
const positive = await readJson(cataloguePath, "ARCH_OBLIGATION_CATALOGUE_JSON_INVALID");
const positiveDiagnostics = await validateCatalogue(positive);
if (positiveDiagnostics.length !== 0) {
  throw new Error(`ARCH_OBLIGATION_POSITIVE_FAILED: ${JSON.stringify(positiveDiagnostics)}`);
}

let mutantDiagnostics = [];
if (argumentsByName.has("--self-test")) {
  mutantDiagnostics = await validateCatalogue(
    await readJson(paths.mutant, "ARCH_OBLIGATION_MUTANT_JSON_INVALID"),
  );
  if (!same(mutantDiagnostics, [{ code: "ARCH_OBLIGATION_PAYLOAD_STALE" }])) {
    throw new Error(`ARCH_OBLIGATION_MUTANT_NOT_DISCRIMINATING: ${JSON.stringify(mutantDiagnostics)}`);
  }
}

process.stdout.write(`${JSON.stringify({
  result: "pass",
  schema_version: positive.schema_version,
  catalogue_id: positive.catalogue_id,
  catalogue_sha256: positive.catalogue_sha256,
  obligation_count: positive.obligations.length,
  positive_diagnostics: positiveDiagnostics,
  mutant_diagnostics: mutantDiagnostics,
  forbidden_imports: [],
  owner_ref: positive.owner_ref,
  authority_effect: positive.authority_effect,
}, null, 2)}\n`);
