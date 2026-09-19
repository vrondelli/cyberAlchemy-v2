#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const repositoryRoot = resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT ?? process.cwd());
const packageRoot = resolve(
  repositoryRoot,
  "projects/domainspec-v2/development/architecture-realization-compiler",
);
const argumentsByName = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--self-test") argumentsByName.set(argument, true);
  else if (argument.startsWith("--")) argumentsByName.set(argument, process.argv[index += 1]);
}

const compareUtf8 = (left, right) => Buffer.from(left).compare(Buffer.from(right));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([key, child]) => [key, canonicalize(child)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const diagnostic = (code, detail = undefined) => ({ code, ...(detail ? { detail } : {}) });
const exactKeys = (value, expected) => value !== null && typeof value === "object"
  && !Array.isArray(value) && same(Object.keys(value).sort(compareUtf8), [...expected].sort(compareUtf8));
const safeRelativePath = (path) => typeof path === "string" && path.length > 0
  && !isAbsolute(path) && !path.split(/[\\/]/u).includes("..");
const readJson = async (path, code) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${code}: ${error instanceof Error ? error.message : String(error)}`);
  }
};
const digestCatalogue = (catalogue) => {
  const payload = structuredClone(catalogue);
  delete payload.catalogue_sha256;
  return sha256(canonicalJson(payload));
};
const digestDefinition = (definition) => {
  const payload = structuredClone(definition);
  delete payload.definition_sha256;
  payload.members = [...payload.members].sort(({ member_id: left }, { member_id: right }) =>
    compareUtf8(left, right));
  return sha256(canonicalJson(payload));
};
const withCatalogueDigest = (catalogue) => ({
  ...catalogue,
  catalogue_sha256: digestCatalogue(catalogue),
});
const resolveSource = (sourceRef) => {
  if (!safeRelativePath(sourceRef?.path)) return null;
  const absolute = resolve(repositoryRoot, sourceRef.path);
  return absolute.startsWith(`${repositoryRoot}/`) ? absolute : null;
};

const validateCatalogue = async (catalogue) => {
  const diagnostics = [];
  if (!exactKeys(catalogue, [
    "schema_version", "catalogue_id", "catalogue_version", "supersedes_ref",
    "definition_ref", "ontology_ref", "profile_ref", "obligations",
    "catalogue_sha256", "owner_ref", "authority_effect",
  ]) || catalogue.schema_version !== "ArchitectureObligationCatalogue/v2"
      || catalogue.catalogue_version !== "2") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_CATALOGUE_SHAPE_INVALID"));
    return diagnostics;
  }
  if (catalogue.authority_effect !== "none"
      || catalogue.definition_ref?.authority_status === "canonical-promoted") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_AUTHORITY_INFLATION"));
  }
  if (catalogue.owner_ref !== "architecture-obligation-catalogue-owner") {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_OWNER_NOT_INDEPENDENT"));
  }
  const definitionPath = resolveSource(catalogue.definition_ref);
  const exactDefinitionPath = "projects/domainspec-v2/development/architecture-realization-compiler/fixtures/order-status/definition.snapshot.json";
  if (definitionPath === null || catalogue.definition_ref.path !== exactDefinitionPath
      || catalogue.definition_ref.path.includes("stages/08")) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_DEFINITION_SOURCE_INVALID"));
    return diagnostics;
  }
  const definitionBytes = await readFile(definitionPath);
  if (sha256(definitionBytes) !== catalogue.definition_ref.sha256) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_DEFINITION_SOURCE_STALE"));
    return diagnostics;
  }
  const definition = JSON.parse(definitionBytes.toString("utf8"));
  if (digestDefinition(definition) !== definition.definition_sha256
      || catalogue.definition_ref.definition_sha256 !== definition.definition_sha256) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_DEFINITION_DIGEST_STALE"));
    return diagnostics;
  }
  const sourceRefs = [catalogue.supersedes_ref, catalogue.ontology_ref, catalogue.profile_ref,
    ...(catalogue.profile_ref.extends ?? [])];
  const documents = [];
  for (const sourceRef of sourceRefs) {
    const path = resolveSource(sourceRef);
    if (path === null) {
      diagnostics.push(diagnostic("ARCH_OBLIGATION_SOURCE_PATH_INVALID"));
      return diagnostics;
    }
    const bytes = await readFile(path);
    if (sha256(bytes) !== sourceRef.sha256) {
      diagnostics.push(diagnostic("ARCH_OBLIGATION_SOURCE_DIGEST_STALE", { path: sourceRef.path }));
      return diagnostics;
    }
    documents.push(JSON.parse(bytes.toString("utf8")));
  }
  const [predecessor, ontology, typescriptProfile, baseProfile] = documents;
  const overlay = (typescriptProfile.representation_overlays ?? [])
    .find(({ contract_id: contractId }) => contractId === "enum.profile-representation");
  const properties = new Set((ontology.property_definitions ?? []).map(({ property_id: id }) => id));
  const denominatorPass = predecessor.schema_version === "ArchitectureObligationCatalogue/v1"
    && predecessor.catalogue_id === catalogue.catalogue_id
    && catalogue.supersedes_ref.catalogue_version === "1"
    && (ontology.concept_types ?? []).some(({ concept_id: id, canonical_meta_type_ref: ref }) =>
      id === "architecture.EnumImplementation" && ref === "DS-D1.3")
    && ["binding.expected_enum_values", "enum.implemented_members", "enum.implemented_values"]
      .every((propertyId) => properties.has(propertyId))
    && (baseProfile.constraints ?? []).some(({ operator, applies_to: appliesTo }) =>
      operator === "set_equals" && appliesTo?.includes("architecture.EnumImplementation"))
    && overlay?.activation_binding?.protocol_id === "typescript.owned-const-object-enum/v1";
  if (!denominatorPass) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_SOURCE_DENOMINATOR_INVALID"));
    return diagnostics;
  }
  const obligation = catalogue.obligations?.[0];
  const members = obligation?.expected_payload?.members;
  const expectedMembers = [...definition.members]
    .sort(({ member_id: left }, { member_id: right }) => compareUtf8(left, right));
  if (catalogue.obligations?.length !== 1
      || obligation?.obligation_key !== "enum.member-bijection@1"
      || obligation?.operator !== "member-bijection"
      || obligation?.expected_payload?.concept_id !== definition.concept_id
      || obligation?.expected_payload?.composition_kind !== definition.composition_kind
      || obligation?.expected_payload?.order_semantics !== definition.order_semantics
      || !same(members, expectedMembers)
      || digestCatalogue(catalogue) !== catalogue.catalogue_sha256) {
    diagnostics.push(diagnostic("ARCH_OBLIGATION_PAYLOAD_STALE"));
  }
  return diagnostics;
};

const assertExact = (actual, expected, name) => {
  if (!same(actual, expected)) {
    throw new Error(`${name}: ${JSON.stringify(actual)}`);
  }
};
const assertForbiddenSources = async () => {
  const source = await readFile(new URL(import.meta.url), "utf8");
  const forbiddenToken = "positive" + "_members";
  const forbiddenImports = ["realization/spec", "generator/", "adapter/", "evaluator/"];
  if (source.includes(forbiddenToken)
      || forbiddenImports.some((token) => source.match(/from\s+["'][^"']+/gu)?.some((item) => item.includes(token)))) {
    throw new Error("ARCH_OBLIGATION_FORBIDDEN_SOURCE");
  }
};

const requestedCatalogue = argumentsByName.get("--catalogue");
if (typeof requestedCatalogue !== "string") {
  throw new Error("ARCH_OBLIGATION_CATALOGUE_ARGUMENT_MISSING");
}
await assertForbiddenSources();
const catalogue = await readJson(resolve(repositoryRoot, requestedCatalogue), "ARCH_OBLIGATION_CATALOGUE_JSON_INVALID");
const positiveDiagnostics = await validateCatalogue(catalogue);
assertExact(positiveDiagnostics, [], "ARCH_OBLIGATION_POSITIVE_FAILED");

const hostile = {};
if (argumentsByName.has("--self-test")) {
  const mutant = await readJson(
    resolve(packageRoot, "fixtures/order-status/catalogue.same-key-drift.v2.json"),
    "ARCH_OBLIGATION_MUTANT_JSON_INVALID",
  );
  hostile.same_key = await validateCatalogue(mutant);
  const invalidPath = structuredClone(catalogue);
  invalidPath.definition_ref.path = "stages/08/SELECTED-UNIT-REPAIR.json";
  hostile.definition_path = await validateCatalogue(withCatalogueDigest(invalidPath));
  const staleBytes = structuredClone(catalogue);
  staleBytes.definition_ref.sha256 = "0".repeat(64);
  hostile.definition_bytes = await validateCatalogue(withCatalogueDigest(staleBytes));
  const staleSemantic = structuredClone(catalogue);
  staleSemantic.definition_ref.definition_sha256 = "0".repeat(64);
  hostile.definition_semantic = await validateCatalogue(withCatalogueDigest(staleSemantic));
  assertExact(hostile.same_key, [{ code: "ARCH_OBLIGATION_PAYLOAD_STALE" }], "same-key mutant");
  assertExact(hostile.definition_path, [{ code: "ARCH_OBLIGATION_DEFINITION_SOURCE_INVALID" }], "definition path mutant");
  assertExact(hostile.definition_bytes, [{ code: "ARCH_OBLIGATION_DEFINITION_SOURCE_STALE" }], "definition bytes mutant");
  assertExact(hostile.definition_semantic, [{ code: "ARCH_OBLIGATION_DEFINITION_DIGEST_STALE" }], "definition semantic mutant");
  execFileSync(process.execPath, [
    resolve(packageRoot, "tools/validate-obligation-catalogue.mjs"),
    "--catalogue",
    "projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json",
    "--self-test",
  ], { cwd: repositoryRoot, stdio: "ignore" });
}

process.stdout.write(`${JSON.stringify({
  result: "pass",
  catalogue_id: catalogue.catalogue_id,
  catalogue_version: catalogue.catalogue_version,
  catalogue_sha256: catalogue.catalogue_sha256,
  definition_sha256: catalogue.definition_ref.definition_sha256,
  positive_diagnostics: positiveDiagnostics,
  hostile_diagnostics: hostile,
  forbidden_sources: [],
  v1_regression: argumentsByName.has("--self-test") ? "pass" : "not-run",
  authority_effect: catalogue.authority_effect,
}, null, 2)}\n`);
