#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const OLD_ROOT = "projects/domainspec-v2";
const MIGRATION_ROOT = "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b";
const REBIND_MANIFEST_PATH = `${MIGRATION_ROOT}/REBIND-MANIFEST.json`;
const REBIND_RECEIPT_PATH = `${MIGRATION_ROOT}/REBIND-RECEIPT.json`;
const SELECTION_PATH = "cyberAlchemy-v2/authority/decisions/domainspec-v2-migration/selection.json";
const V10_PATH = `${OLD_ROOT}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json`;
const RUNTIME_PATH = `${OLD_ROOT}/RUNTIME.json`;
const ORIGINAL_ONTOLOGY_SOURCES_PATH = `${OLD_ROOT}/ontology/sources.json`;
const PACKAGE_LOCK_TEMPLATE_PATH = `${MIGRATION_ROOT}/CLI-STANDALONE-PACKAGE-LOCK.v1.json`;
const OUTPUT_MANIFEST_PATH = `${MIGRATION_ROOT}/BASELINE-V11-CANDIDATE-V9-MANIFEST.json`;
const OUTPUT_RECEIPT_PATH = `${MIGRATION_ROOT}/BASELINE-V11-CANDIDATE-V9-RECEIPT.json`;
const CANDIDATE_ID = "domainspec-meta-types-current-implemented@11-candidate.9";

const CURRENT_GROUPS = {
  implementation: "cyberAlchemy-v2/implementation/domainspec-v2/current-candidate-v9",
  product: "cyberAlchemy-v2/product/domainspec-v2/current-candidate-v9",
  architecture: "cyberAlchemy-v2/architecture/domainspec-v2/current-candidate-v9",
  authority: "cyberAlchemy-v2/authority/domainspec-v2/current-candidate-v9",
  ontology: "cyberAlchemy-v2/ontology/domainspec-v2/current-candidate-v9",
  research: "cyberAlchemy-v2/research/domainspec-v2/current-candidate-v9",
};

const BASELINE_CANDIDATE_PATH = `${CURRENT_GROUPS.implementation}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v11.candidate.9.json`;
const CURRENT_STATE_RELATIVE = "definitions/meta-types/current-implementation.json";
const CURRENT_SCHEMA_RELATIVE = "definitions/meta-types/current-implementation.schema.json";
const CURRENT_HUMAN_RELATIVE = "definitions/meta-types/current-implementation.md";
const RECEIPT_SCHEMA_RELATIVE = "impl/cli/contracts/instantiation-receipt.schema.json";
const CATALOG_RELATIVE = "impl/cli/src/meta-types/frozen-catalog.generated.ts";
const CATALOG_TOOL_RELATIVE = "impl/cli/tools/materialize-frozen-catalog.mjs";
const SYSTEM_INTEGRATION_PROFILE_ROOT_RELATIVE = "impl/system-integration/profiles/provider-neutral-v1";
const SYSTEM_INTEGRATION_PROJECTION_RELATIVE = "impl/cli/src/system-integration/frozen-profile.generated.ts";
const CATALOG_TYPES_RELATIVE = "impl/cli/src/meta-types/types.ts";
const GENERATION_CONTRACTS_RELATIVE = "impl/cli/src/generation/contracts.ts";
const CONFORMANCE_RECEIPT_RELATIVE = "impl/cli/src/conformance/receipt.ts";
const CLI_TSCONFIG_RELATIVE = "impl/cli/tsconfig.json";
const CLI_PACKAGE_RELATIVE = "impl/cli/package.json";
const CLI_PACKAGE_LOCK_RELATIVE = "impl/cli/package-lock.json";
const FOUNDATION_CONTRACT_RELATIVE = "impl/cli/contracts/foundation-contract.json";
const FOUNDATION_SCHEMA_RELATIVE = "impl/cli/contracts/foundation-contract.schema.json";
const FOUNDATION_VALIDATOR_RELATIVE = "impl/cli/tools/validate-foundation-contract.mjs";
const CANDIDATE3_CONTRACT_RELATIVE = "impl/cli/contracts/foundation-contract.candidate-3.json";
const CANDIDATE3_SCHEMA_RELATIVE = "impl/cli/contracts/foundation-contract.candidate-3.schema.json";
const CANDIDATE3_VALIDATOR_RELATIVE = "impl/cli/contracts/validate-foundation-contract.candidate-3.mjs";
const V2_BASELINE_SOURCE_PATH = `${OLD_ROOT}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v2.json`;
const V2_BASELINE_TARGET_PATH = `${CURRENT_GROUPS.implementation}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v2.json`;
const CONTRACT_DEPENDENCY_SOURCE_PATHS = Object.freeze([
  `${OLD_ROOT}/development/first-production-release/decisions/2026-07-12-product-release-contract.md`,
  `${OLD_ROOT}/development/first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md`,
  `${OLD_ROOT}/development/meta-type-instantiation-cli/OWNER-CANONICAL-DOCS-AND-BASELINE-V2-DECISION.json`,
  V2_BASELINE_SOURCE_PATH,
]);
const CLI_DEV_DEPENDENCIES = Object.freeze({
  "@types/node": "26.4.0",
  tsx: "4.20.6",
  typescript: "7.0.2",
});

function fail(message) {
  process.stderr.write(`mig-b-v11: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { builtAt: null, mode: "check" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--built-at") options.builtAt = argv[++index];
    else if (value === "--write") options.mode = "write";
    else if (value === "--check") options.mode = "check";
    else fail(`unknown argument: ${value}`);
  }
  if (!options.builtAt || Number.isNaN(Date.parse(options.builtAt))) {
    fail("--built-at must be an explicit ISO-8601 timestamp");
  }
  return options;
}

function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) fail(`cannot locate repository root from ${startPath}`);
    candidate = parent;
  }
}

function readJson(repoRoot, repoPath) {
  return JSON.parse(readFileSync(path.join(repoRoot, repoPath), "utf8"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value)), "utf8"));
}

function systemIntegrationProfileSource(buffers) {
  const readProfile = (relativePath) => {
    const candidatePath = `${CURRENT_GROUPS.implementation}/${SYSTEM_INTEGRATION_PROFILE_ROOT_RELATIVE}/${relativePath}`;
    const bytes = buffers.get(candidatePath);
    if (!bytes) fail(`system-integration profile source missing: ${candidatePath}`);
    return JSON.parse(bytes.toString("utf8"));
  };
  const profile = readProfile("profile.json");
  if (profile.profile_id !== "domainspec.system-integration-profile/provider-neutral-v1" || profile.status !== "canonical-target" || profile.contract_kinds?.length !== 5) {
    fail("system-integration profile drift");
  }
  const languages = Object.fromEntries(["typescript", "python", "rust"].map((language) => {
    const value = readProfile(`${language}.json`);
    if (value.language !== language || value.system_profile_ref !== profile.profile_id || value.semantic_obligations?.length !== 5) {
      fail(`system-integration language profile drift: ${language}`);
    }
    return [language, { value, digest: canonicalDigest(value) }];
  }));
  return Buffer.from([
    "// Generated by cli/tools/materialize-system-integration-profile.mjs. Do not hand-edit.",
    "import type { FrozenSystemIntegrationProfileV1 } from \"./types.js\";",
    "",
    `export const FROZEN_SYSTEM_INTEGRATION_PROFILE: FrozenSystemIntegrationProfileV1 = ${JSON.stringify({ profile, profile_digest: canonicalDigest(profile), language_profiles: languages }, null, 2)};`,
    "",
  ].join("\n"), "utf8");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function replaceExactly(source, from, to, label) {
  if (source.split(from).length !== 2) fail(`${label} drift`);
  return source.replace(from, to);
}

function replaceSection(source, start, end, replacement, label) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0 || source.indexOf(start, startIndex + 1) >= 0) fail(`${label} drift`);
  return `${source.slice(0, startIndex)}${replacement}${source.slice(endIndex)}`;
}

function replaceRegexExactly(source, pattern, replacement, label) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) fail(`${label} drift`);
  return source.replace(pattern, replacement);
}

function writeAtomic(targetPath, bytes) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.tmp`;
  try {
    writeFileSync(temporaryPath, bytes);
    renameSync(temporaryPath, targetPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function mapSourcePath(sourcePath) {
  if (!sourcePath.startsWith(`${OLD_ROOT}/`)) fail(`cannot map non-DomainSpec source path: ${sourcePath}`);
  const relative = sourcePath.slice(`${OLD_ROOT}/`.length);
  if (relative.startsWith("definitions/") || relative.startsWith("authority/")) {
    return path.posix.join(CURRENT_GROUPS.authority, relative);
  }
  if (relative.startsWith("architecture/") || ["ARCHITECTURE.md", "RELATED-FRAMEWORK-CROSSWALK.md"].includes(relative)) {
    return path.posix.join(CURRENT_GROUPS.architecture, relative);
  }
  if (relative.startsWith("ontology/")) {
    return path.posix.join(CURRENT_GROUPS.ontology, relative.slice("ontology/".length));
  }
  if (relative.startsWith("research/") || relative.startsWith("discovery/")) {
    return path.posix.join(CURRENT_GROUPS.research, relative);
  }
  if (["PRODUCT-THESIS.md", "README.md", "COMPLETE-GUIDE.md", "COMPLETE-GUIDE.html", "COMPLETE-GUIDE.lanes.json", "COMPLETE-GUIDE.schema.json"].includes(relative)) {
    return path.posix.join(CURRENT_GROUPS.product, relative);
  }
  return path.posix.join(CURRENT_GROUPS.implementation, relative);
}

function replaceEpoch(bytes) {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes) || !text.includes("rebound-candidate")) return bytes;
  return Buffer.from(text.split("rebound-candidate").join("current-candidate-v9"), "utf8");
}

function rebindOldRootToCurrent(bytes) {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes) || !text.includes(OLD_ROOT)) return bytes;
  const replacements = [
    [`${OLD_ROOT}/definitions`, `${CURRENT_GROUPS.authority}/definitions`],
    [`${OLD_ROOT}/authority`, `${CURRENT_GROUPS.authority}/authority`],
    [`${OLD_ROOT}/architecture`, `${CURRENT_GROUPS.architecture}/architecture`],
    [`${OLD_ROOT}/ontology`, CURRENT_GROUPS.ontology],
    [`${OLD_ROOT}/research`, `${CURRENT_GROUPS.research}/research`],
    [`${OLD_ROOT}/discovery`, `${CURRENT_GROUPS.research}/discovery`],
    [`${OLD_ROOT}/impl`, `${CURRENT_GROUPS.implementation}/impl`],
    [`${OLD_ROOT}/formalization`, `${CURRENT_GROUPS.implementation}/formalization`],
    [`${OLD_ROOT}/development`, `${CURRENT_GROUPS.implementation}/development`],
    [`${OLD_ROOT}/PRODUCT-THESIS.md`, `${CURRENT_GROUPS.product}/PRODUCT-THESIS.md`],
    [`${OLD_ROOT}/README.md`, `${CURRENT_GROUPS.product}/README.md`],
    [`${OLD_ROOT}/ARCHITECTURE.md`, `${CURRENT_GROUPS.architecture}/ARCHITECTURE.md`],
    [OLD_ROOT, CURRENT_GROUPS.implementation],
  ];
  let result = text;
  for (const [from, to] of replacements) result = result.split(from).join(to);
  return Buffer.from(result, "utf8");
}

function refreshPathDigests(value, buffers) {
  if (Array.isArray(value)) {
    for (const item of value) refreshPathDigests(item, buffers);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.path === "string" && typeof value.sha256 === "string" && buffers.has(value.path)) {
    value.sha256 = sha256(buffers.get(value.path));
  }
  for (const child of Object.values(value)) refreshPathDigests(child, buffers);
}

function candidateCatalogSource(baseline, manifestSha) {
  const projection = {
    schema_version: "domainspec.meta-type-catalog/v2",
    baseline_id: baseline.baseline_id,
    baseline_digest: baseline.baseline_digest,
    manifest_sha256: manifestSha,
    backend_meta_types: baseline.backend_meta_types,
    realization_rows: baseline.realization_rows,
  };
  return Buffer.from([
    "// Generated by cli/tools/materialize-frozen-catalog.mjs. Do not hand-edit.",
    "import type { FrozenCatalogV2 } from \"./types.js\";",
    "",
    `export const FROZEN_CATALOG_V2: FrozenCatalogV2 = ${JSON.stringify(projection, null, 2)};`,
    "",
  ].join("\n"), "utf8");
}

function catalogToolSource(baseline, manifestSha) {
  return Buffer.from(`#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.resolve(here, "../../../development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v11.candidate.9.json");
const outputPath = path.resolve(here, "../src/meta-types/frozen-catalog.generated.ts");
const expectedBaselineId = ${JSON.stringify(baseline.baseline_id)};
const expectedBaselineDigest = ${JSON.stringify(baseline.baseline_digest)};
const expectedManifestSha256 = ${JSON.stringify(manifestSha)};
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

const baselineBytes = fs.readFileSync(baselinePath);
const baseline = JSON.parse(baselineBytes.toString("utf8"));
if (baseline.baseline_id !== expectedBaselineId || baseline.baseline_digest !== expectedBaselineDigest || sha256(baselineBytes) !== expectedManifestSha256) throw new Error("candidate baseline identity drift");
if (baseline.backend_meta_types.length !== 13 || baseline.realization_rows.length !== 39) throw new Error("candidate catalog denominator drift");
const projection = { schema_version: "domainspec.meta-type-catalog/v2", baseline_id: baseline.baseline_id, baseline_digest: baseline.baseline_digest, manifest_sha256: expectedManifestSha256, backend_meta_types: baseline.backend_meta_types, realization_rows: baseline.realization_rows };
const expected = ["// Generated by cli/tools/materialize-frozen-catalog.mjs. Do not hand-edit.", "import type { FrozenCatalogV2 } from \\\"./types.js\\\";", "", \`export const FROZEN_CATALOG_V2: FrozenCatalogV2 = \${JSON.stringify(projection, null, 2)};\`, ""].join("\\n");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== expected) { process.stderr.write("candidate catalog projection is stale\\n"); process.exitCode = 1; }
  else process.stdout.write(JSON.stringify({status:"pass",rows:39,baseline_id:baseline.baseline_id}) + "\\n");
} else { fs.writeFileSync(outputPath, expected, "utf8"); process.stdout.write(JSON.stringify({status:"written",rows:39,baseline_id:baseline.baseline_id}) + "\\n"); }
`, "utf8");
}

function build(repoRoot, builtAt) {
  const rebind = readJson(repoRoot, REBIND_MANIFEST_PATH);
  const rebindReceipt = readJson(repoRoot, REBIND_RECEIPT_PATH);
  const selection = readJson(repoRoot, SELECTION_PATH);
  const v10 = readJson(repoRoot, V10_PATH);
  if (rebindReceipt.status !== "pass" || rebindReceipt.manifest_digest !== rebind.manifest_digest) fail("rebind receipt binding drift");
  if (selection.selected_option_id !== "MIG-B-STAGED-SUCCESSOR") fail("MIG-B selection drift");

  const buffers = new Map();
  const provenance = new Map();
  for (const entry of rebind.entries) {
    const currentPath = entry.target_path.split("rebound-candidate").join("current-candidate-v9");
    const bytes = readFileSync(path.join(repoRoot, entry.target_path));
    if (sha256(bytes) !== entry.target_sha256) fail(`rebound preimage drift: ${entry.target_path}`);
    buffers.set(currentPath, replaceEpoch(bytes));
    provenance.set(currentPath, { kind: "rebound-postimage", source_path: entry.target_path });
  }

  const originalOntologySources = readJson(repoRoot, ORIGINAL_ONTOLOGY_SOURCES_PATH);
  for (const source of originalOntologySources.sources) {
    if (!source.path.startsWith(`${OLD_ROOT}/`)) continue;
    const targetPath = mapSourcePath(source.path);
    if (buffers.has(targetPath)) continue;
    const sourceBytes = readFileSync(path.join(repoRoot, source.path));
    if (sha256(sourceBytes) !== source.sha256) fail(`ontology source digest drift:${source.source_id}`);
    buffers.set(targetPath, rebindOldRootToCurrent(sourceBytes));
    provenance.set(targetPath, { kind: "ontology-dependency-closure", source_path: source.path });
  }

  for (const sourcePath of CONTRACT_DEPENDENCY_SOURCE_PATHS) {
    const targetPath = mapSourcePath(sourcePath);
    if (buffers.has(targetPath)) continue;
    const sourceBytes = readFileSync(path.join(repoRoot, sourcePath));
    buffers.set(targetPath, rebindOldRootToCurrent(sourceBytes));
    provenance.set(targetPath, { kind: "contract-dependency-closure", source_path: sourcePath });
  }

  const catalogTypesPath = `${CURRENT_GROUPS.implementation}/${CATALOG_TYPES_RELATIVE}`;
  const admittedBaselineType = 'readonly baseline_id: `domainspec-meta-types-current-implemented@${number}`;';
  const admittedBaselineIdType = 'readonly id: `domainspec-meta-types-current-implemented@${number}`;';
  const sharedBaselineType = "readonly baseline_id: ImplementedBaselineId;";
  const supportedLanguageType = "export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];";
  const implementedBaselineAlias = [
    supportedLanguageType,
    "",
    "export type ImplementedBaselineId =",
    '  | `domainspec-meta-types-current-implemented@${number}`',
    '  | `domainspec-meta-types-current-implemented@${number}-candidate.${number}`;',
  ].join("\n");
  const catalogTypesSource = buffers.get(catalogTypesPath)?.toString("utf8");
  if (!catalogTypesSource) fail("catalog baseline identity type missing");
  const catalogWithAlias = replaceExactly(catalogTypesSource, supportedLanguageType, implementedBaselineAlias, "catalog baseline identity alias");
  buffers.set(catalogTypesPath, Buffer.from(replaceExactly(catalogWithAlias, admittedBaselineType, sharedBaselineType, "catalog baseline identity type"), "utf8"));
  provenance.set(catalogTypesPath, { kind: "generated-candidate-catalog-type", source_path: CATALOG_TYPES_RELATIVE });

  for (const [relativePath, importFrom, importTo] of [
    [GENERATION_CONTRACTS_RELATIVE, "import type { CatalogRealizationRow, SupportedLanguage } from \"../meta-types/types.js\";", "import type { CatalogRealizationRow, ImplementedBaselineId, SupportedLanguage } from \"../meta-types/types.js\";"],
    [CONFORMANCE_RECEIPT_RELATIVE, "import type { CatalogRealizationRow, SupportedLanguage } from \"../meta-types/types.js\";", "import type { CatalogRealizationRow, ImplementedBaselineId, SupportedLanguage } from \"../meta-types/types.js\";"],
  ]) {
    const targetPath = `${CURRENT_GROUPS.implementation}/${relativePath}`;
    const source = buffers.get(targetPath)?.toString("utf8");
    if (!source) fail(`candidate baseline identity consumer missing: ${relativePath}`);
    const withImport = replaceExactly(source, importFrom, importTo, `${relativePath} baseline identity import`);
    buffers.set(targetPath, Buffer.from(replaceExactly(withImport, admittedBaselineIdType, "readonly id: ImplementedBaselineId;", `${relativePath} baseline identity type`), "utf8"));
    provenance.set(targetPath, { kind: "generated-candidate-baseline-id-consumer", source_path: relativePath });
  }

  const cliTsconfigPath = `${CURRENT_GROUPS.implementation}/${CLI_TSCONFIG_RELATIVE}`;
  const cliTsconfig = JSON.parse(buffers.get(cliTsconfigPath).toString("utf8"));
  cliTsconfig.extends = "../../../../../../toolchains/node-typescript/tsconfig/node.json";
  const resolvedTsconfigBase = path.posix.normalize(path.posix.join(path.posix.dirname(cliTsconfigPath), cliTsconfig.extends));
  if (resolvedTsconfigBase !== "toolchains/node-typescript/tsconfig/node.json") {
    fail(`relocated CLI tsconfig resolves outside the Node 26 profile: ${resolvedTsconfigBase}`);
  }
  buffers.set(cliTsconfigPath, Buffer.from(json(cliTsconfig), "utf8"));
  provenance.set(cliTsconfigPath, { kind: "generated-relocated-cli-tsconfig", source_path: CLI_TSCONFIG_RELATIVE });

  const cliPackagePath = `${CURRENT_GROUPS.implementation}/${CLI_PACKAGE_RELATIVE}`;
  const cliPackage = JSON.parse(buffers.get(cliPackagePath).toString("utf8"));
  cliPackage.devDependencies = CLI_DEV_DEPENDENCIES;
  buffers.set(cliPackagePath, Buffer.from(json(cliPackage), "utf8"));
  provenance.set(cliPackagePath, { kind: "generated-standalone-cli-package", source_path: CLI_PACKAGE_RELATIVE });

  const cliPackageLockPath = `${CURRENT_GROUPS.implementation}/${CLI_PACKAGE_LOCK_RELATIVE}`;
  const cliPackageLockBytes = readFileSync(path.join(repoRoot, PACKAGE_LOCK_TEMPLATE_PATH));
  const cliPackageLock = JSON.parse(cliPackageLockBytes.toString("utf8"));
  if (cliPackageLock.name !== cliPackage.name || cliPackageLock.version !== cliPackage.version || cliPackageLock.lockfileVersion !== 3) {
    fail("standalone CLI package lock identity drift");
  }
  if (canonicalDigest(cliPackageLock.packages?.[""]?.devDependencies) !== canonicalDigest(CLI_DEV_DEPENDENCIES)) {
    fail("standalone CLI package lock dependency drift");
  }
  buffers.set(cliPackageLockPath, cliPackageLockBytes);
  provenance.set(cliPackageLockPath, { kind: "generated-standalone-cli-package-lock", source_path: PACKAGE_LOCK_TEMPLATE_PATH });

  const systemIntegrationProjectionPath = `${CURRENT_GROUPS.implementation}/${SYSTEM_INTEGRATION_PROJECTION_RELATIVE}`;
  buffers.set(systemIntegrationProjectionPath, systemIntegrationProfileSource(buffers));
  provenance.set(systemIntegrationProjectionPath, {
    kind: "generated-system-integration-profile",
    source_path: SYSTEM_INTEGRATION_PROFILE_ROOT_RELATIVE,
  });

  const migratedV2 = JSON.parse(buffers.get(V2_BASELINE_TARGET_PATH).toString("utf8"));
  for (const entry of migratedV2.inventory) {
    const bytes = buffers.get(entry.path);
    if (!bytes) fail(`migrated V2 baseline member missing: ${entry.path}`);
    entry.bytes = bytes.length;
    entry.sha256 = sha256(bytes);
  }
  for (const row of migratedV2.realization_rows) {
    for (const role of ["source", "provider", "binding"]) {
      const bytes = buffers.get(row[role].path);
      if (!bytes) fail(`migrated V2 realization ${role} missing: ${row.meta_type_id}/${row.language}`);
      row[role].sha256 = sha256(bytes);
    }
  }
  refreshPathDigests(migratedV2, buffers);
  delete migratedV2.baseline_digest;
  migratedV2.baseline_digest = canonicalDigest(migratedV2);
  buffers.set(V2_BASELINE_TARGET_PATH, Buffer.from(json(migratedV2), "utf8"));
  provenance.set(V2_BASELINE_TARGET_PATH, { kind: "generated-migrated-predecessor-baseline", source_path: V2_BASELINE_SOURCE_PATH });

  const foundationContractPath = `${CURRENT_GROUPS.implementation}/${FOUNDATION_CONTRACT_RELATIVE}`;
  const foundationContract = JSON.parse(buffers.get(foundationContractPath).toString("utf8"));
  for (const [name, binding] of Object.entries(foundationContract.decision_bindings)) {
    const bytes = buffers.get(binding.path);
    if (!bytes) fail(`foundation decision binding missing: ${name}:${binding.path}`);
    binding.sha256 = sha256(bytes);
  }
  foundationContract.input_digest = canonicalDigest(foundationContract.decision_bindings);
  delete foundationContract.contract_digest;
  foundationContract.contract_digest = canonicalDigest(foundationContract);
  buffers.set(foundationContractPath, Buffer.from(json(foundationContract), "utf8"));
  provenance.set(foundationContractPath, { kind: "generated-migrated-foundation-contract", source_path: FOUNDATION_CONTRACT_RELATIVE });

  const foundationSchemaPath = `${CURRENT_GROUPS.implementation}/${FOUNDATION_SCHEMA_RELATIVE}`;
  const foundationSchema = JSON.parse(buffers.get(foundationSchemaPath).toString("utf8"));
  foundationSchema.properties.decision_bindings.const = foundationContract.decision_bindings;
  buffers.set(foundationSchemaPath, Buffer.from(json(foundationSchema), "utf8"));
  provenance.set(foundationSchemaPath, { kind: "generated-migrated-foundation-schema", source_path: FOUNDATION_SCHEMA_RELATIVE });

  const rootDiscoveryPrelude = `const moduleDir = path.dirname(fileURLToPath(import.meta.url));
function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (fs.existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) throw new Error("cannot locate repository root");
    candidate = parent;
  }
}
export const DEFAULT_REPO_ROOT = findRepositoryRoot(moduleDir);`;
  const fixedRootPrelude = 'const moduleDir = path.dirname(fileURLToPath(import.meta.url));\nexport const DEFAULT_REPO_ROOT = path.resolve(moduleDir, "../../../../..");';

  const foundationValidatorPath = `${CURRENT_GROUPS.implementation}/${FOUNDATION_VALIDATOR_RELATIVE}`;
  let foundationValidator = buffers.get(foundationValidatorPath).toString("utf8");
  foundationValidator = replaceExactly(foundationValidator, fixedRootPrelude, rootDiscoveryPrelude, "foundation validator repository root");
  foundationValidator = replaceSection(
    foundationValidator,
    "const EXPECTED_BINDINGS = {",
    "\n\nconst EXPECTED_SURFACE",
    'const EXPECTED_BINDINGS = JSON.parse(fs.readFileSync(DEFAULT_SCHEMA_PATH, "utf8")).properties.decision_bindings.const;',
    "foundation validator decision bindings",
  );
  buffers.set(foundationValidatorPath, Buffer.from(foundationValidator, "utf8"));
  provenance.set(foundationValidatorPath, { kind: "generated-relocatable-foundation-validator", source_path: FOUNDATION_VALIDATOR_RELATIVE });

  const candidate3ContractPath = `${CURRENT_GROUPS.implementation}/${CANDIDATE3_CONTRACT_RELATIVE}`;
  const candidate3 = JSON.parse(buffers.get(candidate3ContractPath).toString("utf8"));
  candidate3.supersedes.input_digest = foundationContract.input_digest;
  candidate3.supersedes.contract_digest = foundationContract.contract_digest;
  candidate3.supersedes.contract.path = foundationContractPath;
  candidate3.supersedes.contract.sha256 = sha256(buffers.get(foundationContractPath));
  candidate3.supersedes.schema.path = foundationSchemaPath;
  candidate3.supersedes.schema.sha256 = sha256(buffers.get(foundationSchemaPath));
  refreshPathDigests(candidate3.decision_bindings, buffers);
  candidate3.baseline_binding.baseline_id = migratedV2.baseline_id;
  candidate3.baseline_binding.baseline_digest = migratedV2.baseline_digest;
  candidate3.baseline_binding.manifest.path = V2_BASELINE_TARGET_PATH;
  candidate3.baseline_binding.manifest.sha256 = sha256(buffers.get(V2_BASELINE_TARGET_PATH));
  const selectedV2Rows = migratedV2.realization_rows.filter((row) => row.meta_type_id === "DS-D1.1" && row.language === "typescript");
  if (selectedV2Rows.length !== 1) fail("migrated V2 selected realization denominator drift");
  candidate3.baseline_binding.selected_realization = selectedV2Rows[0];
  candidate3.input_digest = canonicalDigest({
    supersedes: candidate3.supersedes,
    decision_bindings: candidate3.decision_bindings,
    baseline_binding: candidate3.baseline_binding,
  });
  delete candidate3.contract_digest;
  candidate3.contract_digest = canonicalDigest(candidate3);
  buffers.set(candidate3ContractPath, Buffer.from(json(candidate3), "utf8"));
  provenance.set(candidate3ContractPath, { kind: "generated-migrated-candidate3-contract", source_path: CANDIDATE3_CONTRACT_RELATIVE });

  const candidate3SchemaPath = `${CURRENT_GROUPS.implementation}/${CANDIDATE3_SCHEMA_RELATIVE}`;
  const candidate3Schema = JSON.parse(buffers.get(candidate3SchemaPath).toString("utf8"));
  candidate3Schema.properties.input_digest.const = candidate3.input_digest;
  candidate3Schema.properties.contract_digest.const = candidate3.contract_digest;
  buffers.set(candidate3SchemaPath, Buffer.from(json(candidate3Schema), "utf8"));
  provenance.set(candidate3SchemaPath, { kind: "generated-migrated-candidate3-schema", source_path: CANDIDATE3_SCHEMA_RELATIVE });

  const candidate3ValidatorPath = `${CURRENT_GROUPS.implementation}/${CANDIDATE3_VALIDATOR_RELATIVE}`;
  let candidate3Validator = buffers.get(candidate3ValidatorPath).toString("utf8");
  candidate3Validator = replaceExactly(candidate3Validator, fixedRootPrelude, rootDiscoveryPrelude, "candidate3 validator repository root");
  candidate3Validator = replaceRegexExactly(candidate3Validator, /export const EXPECTED_INPUT_DIGEST = "[0-9a-f]{64}";/g, `export const EXPECTED_INPUT_DIGEST = ${JSON.stringify(candidate3.input_digest)};`, "candidate3 expected input digest");
  candidate3Validator = replaceRegexExactly(candidate3Validator, /export const EXPECTED_CONTRACT_DIGEST = "[0-9a-f]{64}";/g, `export const EXPECTED_CONTRACT_DIGEST = ${JSON.stringify(candidate3.contract_digest)};`, "candidate3 expected contract digest");
  buffers.set(candidate3ValidatorPath, Buffer.from(candidate3Validator, "utf8"));
  provenance.set(candidate3ValidatorPath, { kind: "generated-relocatable-candidate3-validator", source_path: CANDIDATE3_VALIDATOR_RELATIVE });

  const planTestRelative = "impl/cli/test/generation/plan-instantiation.test.ts";
  const planTestPath = `${CURRENT_GROUPS.implementation}/${planTestRelative}`;
  let planTest = buffers.get(planTestPath).toString("utf8");
  planTest = replaceExactly(planTest, 'path.resolve(testDir, "../../../node_modules/.bin/tsc")', 'path.resolve(testDir, "../../node_modules/.bin/tsc")', "generated TypeScript test compiler path");
  buffers.set(planTestPath, Buffer.from(planTest, "utf8"));
  provenance.set(planTestPath, { kind: "generated-standalone-test-tool-path", source_path: planTestRelative });

  const catalogTestRelative = "impl/cli/test/meta-types/catalog.test.ts";
  const catalogTestPath = `${CURRENT_GROUPS.implementation}/${catalogTestRelative}`;
  let catalogTest = buffers.get(catalogTestPath).toString("utf8");
  catalogTest = replaceRegexExactly(catalogTest, /assert\.equal\(row\.binding\.sha256, "[0-9a-f]{64}"\);/g, `assert.equal(row.binding.sha256, ${JSON.stringify(candidate3.baseline_binding.selected_realization.binding.sha256)});`, "catalog selected binding digest");
  buffers.set(catalogTestPath, Buffer.from(catalogTest, "utf8"));
  provenance.set(catalogTestPath, { kind: "generated-migrated-catalog-test", source_path: catalogTestRelative });

  const candidate3TestRelative = "impl/cli/test/contract/instantiation-foundation-contract.test.mjs";
  const candidate3TestPath = `${CURRENT_GROUPS.implementation}/${candidate3TestRelative}`;
  let candidate3Test = buffers.get(candidate3TestPath).toString("utf8");
  candidate3Test = replaceExactly(candidate3Test, "  Candidate3ContractError,\n", "  Candidate3ContractError,\n  DEFAULT_REPO_ROOT,\n", "candidate3 test repository root import");
  candidate3Test = replaceExactly(candidate3Test, 'const repoRoot = path.resolve(testDir, "../../../../../..");', "const repoRoot = DEFAULT_REPO_ROOT;", "candidate3 test repository root");
  candidate3Test = replaceExactly(candidate3Test, 'test("candidate-2 contract and schema remain exact immutable predecessors", () => {', 'test("migrated candidate-2 contract and schema match their resealed predecessor bindings", () => {', "candidate3 predecessor test claim");
  buffers.set(candidate3TestPath, Buffer.from(candidate3Test, "utf8"));
  provenance.set(candidate3TestPath, { kind: "generated-migrated-candidate3-test", source_path: candidate3TestRelative });

  const packageTestRelative = "impl/cli/test/contract/package-boundary.test.mjs";
  const packageTestPath = `${CURRENT_GROUPS.implementation}/${packageTestRelative}`;
  let packageTest = buffers.get(packageTestPath).toString("utf8");
  packageTest = replaceExactly(packageTest, '  assert.equal("devDependencies" in packageJson, false);', `  assert.deepEqual(packageJson.devDependencies, ${JSON.stringify(CLI_DEV_DEPENDENCIES)});`, "package test standalone dependencies");
  packageTest = replaceExactly(packageTest, '  assert.deepEqual(packageLock.packages[""].bin, { "domainspec-v2": "dist/cli/main.js" });', `  assert.deepEqual(packageLock.packages[""].bin, { "domainspec-v2": "dist/cli/main.js" });\n  assert.deepEqual(packageLock.packages[""].devDependencies, ${JSON.stringify(CLI_DEV_DEPENDENCIES)});`, "package lock dependency test");
  packageTest = replaceExactly(packageTest, '  assert.equal(tsconfig.extends, "../../../../toolchains/node-typescript/tsconfig/node.json");', '  assert.equal(tsconfig.extends, "../../../../../../toolchains/node-typescript/tsconfig/node.json");', "package test tsconfig relocation");
  packageTest = replaceExactly(packageTest, 'const tsc = path.resolve(cliRoot, "../node_modules/.bin/tsc");', 'const tsc = path.resolve(cliRoot, "node_modules/.bin/tsc");', "package test compiler path");
  buffers.set(packageTestPath, Buffer.from(packageTest, "utf8"));
  provenance.set(packageTestPath, { kind: "generated-standalone-package-test", source_path: packageTestRelative });

  const mappedV10 = JSON.parse(
    Buffer.from(JSON.stringify(v10), "utf8")
      .toString("utf8")
      .split(OLD_ROOT)
      .join(CURRENT_GROUPS.implementation),
  );
  const baselineBody = {
    ...mappedV10,
    $schema: "https://domainspec.dev/schemas/canonical-implemented-meta-type-baseline/v11-candidate",
    schema_version: "domainspec.canonical-implemented-meta-type-baseline/v11-candidate.9",
    baseline_id: CANDIDATE_ID,
    supersedes: {
      baseline_id: v10.baseline_id,
      baseline_digest: v10.baseline_digest,
      reason: "MIG-B path-rebound CyberAlchemy successor candidate; v10 remains immutable and authoritative until separate v11 admission.",
    },
    frozen_at: builtAt,
    owner_decision: {
      path: SELECTION_PATH,
      sha256: sha256(readFileSync(path.join(repoRoot, SELECTION_PATH))),
      effect: "migration-route-selection-not-baseline-admission",
    },
    inventory_roots: v10.inventory_roots.map(mapSourcePath),
    inventory: v10.inventory.map((entry) => {
      const mappedPath = mapSourcePath(entry.path);
      const bytes = buffers.get(mappedPath);
      if (!bytes) fail(`candidate baseline member missing: ${mappedPath}`);
      return { path: mappedPath, bytes: bytes.length, sha256: sha256(bytes) };
    }),
    realization_rows: v10.realization_rows.map((row) => ({
      ...row,
      ...Object.fromEntries(["source", "provider", "binding"].map((role) => {
        const mappedPath = mapSourcePath(row[role].path);
        const bytes = buffers.get(mappedPath);
        if (!bytes) fail(`candidate realization ${role} missing: ${mappedPath}`);
        return [role, { path: mappedPath, sha256: sha256(bytes) }];
      })),
    })),
    derived_current_views: {
      ...v10.derived_current_views,
      excluded_from_inventory_to_prevent_digest_cycles: v10.derived_current_views.excluded_from_inventory_to_prevent_digest_cycles.map(mapSourcePath),
    },
    digest_policy: "sorted-key-canonical-json-sha256",
    authority_effect: "none",
    claim_ceiling: {
      ...v10.claim_ceiling,
      canonical_project_local_baseline: false,
      current_implementation_evidence_admitted: false,
      successor_candidate: true,
      publication: false,
      release: false,
      deployment: false,
      production: false,
    },
  };
  delete baselineBody.baseline_digest;
  const baseline = { ...baselineBody, baseline_digest: canonicalDigest(baselineBody) };
  const baselineBytes = Buffer.from(json(baseline), "utf8");
  const baselineManifestSha = sha256(baselineBytes);
  buffers.set(BASELINE_CANDIDATE_PATH, baselineBytes);
  provenance.set(BASELINE_CANDIDATE_PATH, { kind: "generated-v11-candidate", source_path: V10_PATH });

  const selectionSha = sha256(readFileSync(path.join(repoRoot, SELECTION_PATH)));
  const authorityStatePath = `${CURRENT_GROUPS.authority}/${CURRENT_STATE_RELATIVE}`;
  const implementationStatePath = `${CURRENT_GROUPS.implementation}/${CURRENT_STATE_RELATIVE}`;
  const state = JSON.parse(buffers.get(authorityStatePath).toString("utf8"));
  state.state_id = "domainspec-meta-types-current-implementation@11-candidate.9";
  state.status = "successor-candidate-unadmitted";
  state.baseline = {
    id: baseline.baseline_id,
    manifest: BASELINE_CANDIDATE_PATH,
    manifest_sha256: baselineManifestSha,
    baseline_digest: baseline.baseline_digest,
    owner_decision: SELECTION_PATH,
    owner_decision_sha256: selectionSha,
    supersedes: {
      id: v10.baseline_id,
      baseline_digest: v10.baseline_digest,
      reason: "MIG-B CyberAlchemy successor candidate; separate admission required.",
    },
  };
  state.claim_ceiling.canonical_project_local_baseline = false;
  state.target_conformance.status = "candidate-static-generated-target-unadmitted";
  state.authority_effect = "none";
  refreshPathDigests(state, buffers);
  const stateBytes = Buffer.from(json(state), "utf8");
  for (const target of [authorityStatePath, implementationStatePath]) {
    buffers.set(target, stateBytes);
    provenance.set(target, { kind: "generated-current-projection", source_path: CURRENT_STATE_RELATIVE });
  }

  const authoritySchemaPath = `${CURRENT_GROUPS.authority}/${CURRENT_SCHEMA_RELATIVE}`;
  const implementationSchemaPath = `${CURRENT_GROUPS.implementation}/${CURRENT_SCHEMA_RELATIVE}`;
  const stateSchema = JSON.parse(buffers.get(authoritySchemaPath).toString("utf8"));
  stateSchema.properties.state_id = { const: state.state_id };
  stateSchema.properties.status = { const: state.status };
  stateSchema.properties.baseline.properties.id = { const: baseline.baseline_id };
  stateSchema.properties.baseline.properties.supersedes.properties.id = { const: v10.baseline_id };
  stateSchema.properties.claim_ceiling.properties.canonical_project_local_baseline = { const: false };
  stateSchema.properties.target_conformance.properties.status = { const: state.target_conformance.status };
  stateSchema.properties.authority_effect = { const: "none" };
  const schemaPreflight = spawnSync("python3", ["-c", "import json,sys; from jsonschema import Draft202012Validator; p=json.load(sys.stdin); Draft202012Validator.check_schema(p['schema']); Draft202012Validator(p['schema']).validate(p['state'])"], {
    input: JSON.stringify({ schema: stateSchema, state }),
    encoding: "utf8",
  });
  if (schemaPreflight.status !== 0) fail(`generated current-state schema preflight failed:${(schemaPreflight.stderr || schemaPreflight.stdout).trim()}`);
  const stateSchemaBytes = Buffer.from(json(stateSchema), "utf8");
  for (const target of [authoritySchemaPath, implementationSchemaPath]) {
    buffers.set(target, stateSchemaBytes);
    provenance.set(target, { kind: "generated-current-schema", source_path: CURRENT_SCHEMA_RELATIVE });
  }

  const authorityHumanPath = `${CURRENT_GROUPS.authority}/${CURRENT_HUMAN_RELATIVE}`;
  const implementationHumanPath = `${CURRENT_GROUPS.implementation}/${CURRENT_HUMAN_RELATIVE}`;
  let human = buffers.get(authorityHumanPath).toString("utf8");
  human = human
    .split(v10.baseline_id).join(baseline.baseline_id)
    .split(v10.baseline_digest).join(baseline.baseline_digest)
    .split("4e8c72e3c59308bf7f476a2365d0ba66e149534b8dfddb4ad8b555e454edbf59").join(baselineManifestSha);
  human = `> MIG-B successor candidate. Baseline admission and authority switching remain pending.\n\n${human}`;
  const humanBytes = Buffer.from(human, "utf8");
  for (const target of [authorityHumanPath, implementationHumanPath]) {
    buffers.set(target, humanBytes);
    provenance.set(target, { kind: "generated-current-human-view", source_path: CURRENT_HUMAN_RELATIVE });
  }

  const receiptSchemaPath = `${CURRENT_GROUPS.implementation}/${RECEIPT_SCHEMA_RELATIVE}`;
  const receiptSchema = JSON.parse(buffers.get(receiptSchemaPath).toString("utf8"));
  const receiptBaseline = receiptSchema.properties.baseline.properties;
  receiptBaseline.id = { const: baseline.baseline_id };
  receiptBaseline.digest = { const: baseline.baseline_digest };
  receiptBaseline.manifest_sha256 = { const: baselineManifestSha };
  buffers.set(receiptSchemaPath, Buffer.from(json(receiptSchema), "utf8"));
  provenance.set(receiptSchemaPath, { kind: "generated-cli-receipt-schema", source_path: RECEIPT_SCHEMA_RELATIVE });

  const catalogPath = `${CURRENT_GROUPS.implementation}/${CATALOG_RELATIVE}`;
  buffers.set(catalogPath, candidateCatalogSource(baseline, baselineManifestSha));
  provenance.set(catalogPath, { kind: "generated-cli-catalog", source_path: CATALOG_RELATIVE });
  const catalogToolPath = `${CURRENT_GROUPS.implementation}/${CATALOG_TOOL_RELATIVE}`;
  buffers.set(catalogToolPath, catalogToolSource(baseline, baselineManifestSha));
  provenance.set(catalogToolPath, { kind: "generated-cli-catalog-tool", source_path: CATALOG_TOOL_RELATIVE });

  const runtimePath = `${CURRENT_GROUPS.implementation}/RUNTIME.json`;
  const runtime = JSON.parse(buffers.get(runtimePath).toString("utf8"));
  runtime.$schema = "https://domainspec.dev/schemas/project-runtime/v3-candidate";
  runtime.schema_version = "domainspec.project-runtime/v3-candidate";
  runtime.status = "successor-candidate-unadmitted";
  runtime.owner_decision = { path: SELECTION_PATH, sha256: selectionSha, effect: "migration-route-selection-not-baseline-admission" };
  runtime.canonical_meta_type_baseline = {
    id: baseline.baseline_id,
    digest: baseline.baseline_digest,
    manifest: BASELINE_CANDIDATE_PATH,
    manifest_sha256: baselineManifestSha,
    frozen_evidence_files: baseline.inventory.length,
    admission: "pending-independent-review-and-owner-decision",
  };
  runtime.validation.command = `toolchains/node-typescript/bin/node-env run --project ${CURRENT_GROUPS.implementation}/impl/cli -- node ../../../../../development/domainspec-v2/migration/mig-b/validate-successor-candidate.mjs`;
  runtime.claim_ceiling.node_26_runtime_selected = true;
  runtime.claim_ceiling.successor_baseline_candidate = true;
  runtime.claim_ceiling.successor_baseline_admitted = false;
  runtime.claim_ceiling.authority_switched = false;
  runtime.authority_effect = "none";
  buffers.set(runtimePath, Buffer.from(json(runtime), "utf8"));
  provenance.set(runtimePath, { kind: "generated-runtime-candidate", source_path: RUNTIME_PATH });

  const runtimeValidatorPath = `${CURRENT_GROUPS.implementation}/validate-runtime.mjs`;
  buffers.set(runtimeValidatorPath, Buffer.from(`#!/usr/bin/env node\nimport \"../../../development/domainspec-v2/migration/mig-b/validate-successor-candidate.mjs\";\n`, "utf8"));
  provenance.set(runtimeValidatorPath, { kind: "generated-runtime-validator-shim", source_path: `${OLD_ROOT}/validate-runtime.mjs` });

  for (const ontologyRoot of [CURRENT_GROUPS.ontology, `${CURRENT_GROUPS.implementation}/ontology`]) {
    const sourcesPath = `${ontologyRoot}/sources.json`;
    const profilePath = `${ontologyRoot}/profile.json`;
    if (!buffers.has(sourcesPath) || !buffers.has(profilePath)) continue;
    const sources = JSON.parse(buffers.get(sourcesPath).toString("utf8"));
    refreshPathDigests(sources, buffers);
    buffers.set(sourcesPath, Buffer.from(json(sources), "utf8"));
    provenance.set(sourcesPath, { kind: "generated-ontology-source-binding", source_path: "ontology/sources.json" });
    const profile = JSON.parse(buffers.get(profilePath).toString("utf8"));
    profile.status = "successor-candidate-unadmitted";
    profile.authority_effect = "none";
    profile.current_implementation = {
      baseline_id: baseline.baseline_id,
      baseline_digest: baseline.baseline_digest,
      state_ref: authorityStatePath,
    };
    buffers.set(profilePath, Buffer.from(json(profile), "utf8"));
    provenance.set(profilePath, { kind: "generated-ontology-profile", source_path: "ontology/profile.json" });
    for (const source of sources.sources) {
      const sourceBytes = buffers.get(source.path);
      if (!sourceBytes) fail(`generated ontology source is outside candidate closure:${source.source_id}:${source.path}`);
      if (sha256(sourceBytes) !== source.sha256) fail(`generated ontology source digest preflight failed:${source.source_id}`);
    }
  }

  const entries = [...buffers.entries()].map(([targetPath, bytes]) => ({
    target_path: targetPath,
    group: Object.entries(CURRENT_GROUPS).find(([, root]) => targetPath === root || targetPath.startsWith(`${root}/`))?.[0] ?? "implementation",
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...provenance.get(targetPath),
  })).sort((left, right) => left.target_path.localeCompare(right.target_path));

  const body = {
    schema_version: "cav2.domainspec-v2.mig-b-baseline-candidate-manifest/v1",
    migration_id: rebind.migration_id,
    stage_id: "CAV2-DOMAINSPEC-V2-MIG-B-BASELINE-V11-CANDIDATE-009",
    status: "candidate-unadmitted",
    authority_effect: "none",
    visibility: "private",
    built_at: builtAt,
    rebind_manifest_ref: REBIND_MANIFEST_PATH,
    rebind_manifest_digest: rebind.manifest_digest,
    baseline: {
      id: baseline.baseline_id,
      digest: baseline.baseline_digest,
      manifest_ref: BASELINE_CANDIDATE_PATH,
      manifest_sha256: baselineManifestSha,
      frozen_evidence_files: baseline.inventory.length,
      admission: "pending",
    },
    summary: {
      output_entries: entries.length,
      output_bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
      generated_entries: entries.filter((entry) => entry.kind?.startsWith("generated-")).length,
    },
    groups: Object.fromEntries(Object.entries(CURRENT_GROUPS).map(([id, root]) => [id, { target_root: root, entries: entries.filter((entry) => entry.group === id).length }])),
    entries,
    claim_ceiling: {
      baseline_candidate_formed: true,
      baseline_candidate_validated: false,
      baseline_admitted: false,
      authority_switched: false,
      old_source_deleted: false,
      publication: false,
      release: false,
      deployment: false,
      production: false,
    },
  };
  return { buffers, manifest: { ...body, manifest_digest: canonicalDigest(body) } };
}

function verifyFile(repoRoot, repoPath, expectedBytes, expectedDigest) {
  const absolute = path.join(repoRoot, repoPath);
  if (!existsSync(absolute) || !lstatSync(absolute).isFile()) fail(`candidate target missing: ${repoPath}`);
  const bytes = readFileSync(absolute);
  if (bytes.length !== expectedBytes || sha256(bytes) !== expectedDigest) fail(`candidate target drift: ${repoPath}`);
}

function publish(repoRoot, buffers, manifest) {
  const stageRoot = path.join(repoRoot, MIGRATION_ROOT, `.v11-stage-${process.pid}`);
  if (existsSync(stageRoot)) fail("v11 staging root already exists");
  mkdirSync(stageRoot, { recursive: true });
  try {
    for (const [groupId, group] of Object.entries(manifest.groups)) {
      const finalRoot = path.join(repoRoot, group.target_root);
      if (existsSync(finalRoot)) {
        for (const entry of manifest.entries.filter((value) => value.group === groupId)) verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256);
        continue;
      }
      const stagedRoot = path.join(stageRoot, groupId);
      for (const entry of manifest.entries.filter((value) => value.group === groupId)) {
        const relative = path.posix.relative(group.target_root, entry.target_path);
        const target = path.join(stagedRoot, relative);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, buffers.get(entry.target_path));
      }
      mkdirSync(path.dirname(finalRoot), { recursive: true });
      renameSync(stagedRoot, finalRoot);
    }
  } finally {
    if (existsSync(stageRoot)) rmSync(stageRoot, { recursive: true, force: false });
  }
}

const options = parseArguments(process.argv.slice(2));
const repoRoot = findRepositoryRoot(process.cwd());
const { buffers, manifest } = build(repoRoot, options.builtAt);
const manifestBytes = Buffer.from(json(manifest), "utf8");
const receipt = {
  schema_version: "cav2.domainspec-v2.mig-b-baseline-candidate-receipt/v1",
  migration_id: manifest.migration_id,
  stage_id: manifest.stage_id,
  status: "candidate-formed-unadmitted",
  authority_effect: "none",
  built_at: manifest.built_at,
  manifest_ref: OUTPUT_MANIFEST_PATH,
  manifest_digest: manifest.manifest_digest,
  baseline: manifest.baseline,
  output_entries: manifest.summary.output_entries,
  candidate_exact: true,
  baseline_candidate_validated: false,
  baseline_admitted: false,
  authority_switched: false,
  old_source_deleted: false,
  publication: false,
  release: false,
  deployment: false,
  production: false,
};

if (options.mode === "write") {
  const existingManifest = path.join(repoRoot, OUTPUT_MANIFEST_PATH);
  if (existsSync(existingManifest) && !readFileSync(existingManifest).equals(manifestBytes)) fail("existing v11 candidate manifest drift");
  writeAtomic(existingManifest, manifestBytes);
  publish(repoRoot, buffers, manifest);
  for (const entry of manifest.entries) verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256);
  writeAtomic(path.join(repoRoot, OUTPUT_RECEIPT_PATH), Buffer.from(json(receipt), "utf8"));
} else {
  if (!existsSync(path.join(repoRoot, OUTPUT_MANIFEST_PATH)) || !readFileSync(path.join(repoRoot, OUTPUT_MANIFEST_PATH)).equals(manifestBytes)) fail("v11 candidate manifest absent or drifted");
  const persistedReceipt = readJson(repoRoot, OUTPUT_RECEIPT_PATH);
  if (persistedReceipt.manifest_digest !== manifest.manifest_digest) fail("v11 receipt binding drift");
  for (const entry of manifest.entries) verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256);
}

process.stdout.write(`${options.mode}: ${manifest.baseline.id}, ${manifest.baseline.frozen_evidence_files} frozen files, ${manifest.summary.output_entries} outputs, ${manifest.manifest_digest}\n`);
