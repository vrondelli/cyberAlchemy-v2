#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MIGRATION_ROOT = "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b";
const MANIFEST_PATH = `${MIGRATION_ROOT}/BASELINE-V11-CANDIDATE-V9-MANIFEST.json`;
const RECEIPT_PATH = `${MIGRATION_ROOT}/BASELINE-V11-CANDIDATE-V9-RECEIPT.json`;
const RUNTIME_ROOT = "cyberAlchemy-v2/implementation/domainspec-v2/current-candidate-v9";
const AUTHORITY_ROOT = "cyberAlchemy-v2/authority/domainspec-v2/current-candidate-v9";
const ONTOLOGY_ROOT = "cyberAlchemy-v2/ontology/domainspec-v2/current-candidate-v9";
const CLI_DEV_DEPENDENCIES = Object.freeze({ "@types/node": "26.4.0", tsx: "4.20.6", typescript: "7.0.2" });

function fail(message) {
  throw new Error(`successor-candidate: ${message}`);
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function canonicalDigest(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value)), "utf8"));
}

const repoRoot = findRepositoryRoot(process.cwd());
const read = (repoPath) => readFileSync(path.join(repoRoot, repoPath));
const readJson = (repoPath) => JSON.parse(read(repoPath).toString("utf8"));
let checks = 0;
const assert = (condition, message) => { checks += 1; if (!condition) fail(message); };

const stageManifest = readJson(MANIFEST_PATH);
const stageReceipt = readJson(RECEIPT_PATH);
assert(stageReceipt.manifest_digest === stageManifest.manifest_digest, "stage receipt binding drift");
assert(stageManifest.status === "candidate-unadmitted", "stage status drift");
assert(stageManifest.summary.output_entries === 2424, "contract dependency closure denominator drift");
for (const entry of stageManifest.entries) {
  const bytes = read(entry.target_path);
  assert(bytes.length === entry.bytes, `stage output byte drift:${entry.target_path}`);
  assert(sha256(bytes) === entry.sha256, `stage output digest drift:${entry.target_path}`);
  assert(!bytes.includes(Buffer.from("projects/domainspec-v2", "utf8")), `old root remains:${entry.target_path}`);
  assert(!bytes.includes(Buffer.from("rebound-candidate", "utf8")), `rebound epoch remains:${entry.target_path}`);
}

const baselinePath = stageManifest.baseline.manifest_ref;
const baselineBytes = read(baselinePath);
const baseline = JSON.parse(baselineBytes.toString("utf8"));
const { baseline_digest: recordedBaselineDigest, ...baselineBody } = baseline;
assert(baseline.baseline_id === "domainspec-meta-types-current-implemented@11-candidate.9", "baseline identity drift");
assert(canonicalDigest(baselineBody) === recordedBaselineDigest, "baseline body digest drift");
assert(sha256(baselineBytes) === stageManifest.baseline.manifest_sha256, "baseline manifest digest drift");
assert(baseline.inventory.length === 847, "baseline inventory denominator drift");
assert(baseline.realization_rows.length === 39, "realization denominator drift");
assert(new Set(baseline.inventory.map((entry) => entry.path)).size === baseline.inventory.length, "duplicate baseline member");
for (const entry of baseline.inventory) {
  const bytes = read(entry.path);
  assert(bytes.length === entry.bytes, `baseline member byte drift:${entry.path}`);
  assert(sha256(bytes) === entry.sha256, `baseline member digest drift:${entry.path}`);
}
for (const row of baseline.realization_rows) {
  for (const role of ["source", "provider", "binding"]) assert(sha256(read(row[role].path)) === row[role].sha256, `realization ${role} drift:${row.meta_type_id}/${row.language}`);
}
assert(baseline.authority_effect === "none", "candidate authority inflated");
assert(baseline.claim_ceiling.canonical_project_local_baseline === false, "candidate baseline called canonical");
assert(baseline.claim_ceiling.successor_candidate === true, "successor candidate marker missing");

const migratedV2Path = `${RUNTIME_ROOT}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v2.json`;
const migratedV2 = readJson(migratedV2Path);
const { baseline_digest: migratedV2Digest, ...migratedV2Body } = migratedV2;
assert(migratedV2.baseline_id === "domainspec-meta-types-current-implemented@2", "migrated V2 identity drift");
assert(canonicalDigest(migratedV2Body) === migratedV2Digest, "migrated V2 body digest drift");
assert(migratedV2.inventory.length === 771, "migrated V2 inventory denominator drift");
assert(migratedV2.realization_rows.length === 39, "migrated V2 realization denominator drift");
for (const entry of migratedV2.inventory) {
  const bytes = read(entry.path);
  assert(bytes.length === entry.bytes, `migrated V2 member byte drift:${entry.path}`);
  assert(sha256(bytes) === entry.sha256, `migrated V2 member digest drift:${entry.path}`);
}
for (const row of migratedV2.realization_rows) {
  for (const role of ["source", "provider", "binding"]) assert(sha256(read(row[role].path)) === row[role].sha256, `migrated V2 realization ${role} drift:${row.meta_type_id}/${row.language}`);
}

const runtime = readJson(`${RUNTIME_ROOT}/RUNTIME.json`);
assert(process.versions.node === runtime.node.version, `Node drift expected ${runtime.node.version} got ${process.versions.node}`);
assert(runtime.canonical_meta_type_baseline.id === baseline.baseline_id, "runtime baseline identity drift");
assert(runtime.canonical_meta_type_baseline.digest === baseline.baseline_digest, "runtime baseline digest drift");
assert(runtime.canonical_meta_type_baseline.manifest_sha256 === sha256(baselineBytes), "runtime manifest digest drift");
assert(runtime.claim_ceiling.successor_baseline_admitted === false, "runtime admission inflated");
assert(runtime.claim_ceiling.authority_switched === false, "authority switch inflated");

const statePath = `${AUTHORITY_ROOT}/definitions/meta-types/current-implementation.json`;
const stateSchemaPath = `${AUTHORITY_ROOT}/definitions/meta-types/current-implementation.schema.json`;
const state = readJson(statePath);
assert(state.baseline.id === baseline.baseline_id, "current state baseline identity drift");
assert(state.baseline.baseline_digest === baseline.baseline_digest, "current state baseline digest drift");
assert(state.claim_ceiling.canonical_project_local_baseline === false, "current state admission inflated");
const schemaRun = spawnSync("python3", ["-c", "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1])); v=json.load(open(sys.argv[2])); Draft202012Validator.check_schema(s); Draft202012Validator(s).validate(v)", path.join(repoRoot, stateSchemaPath), path.join(repoRoot, statePath)], { encoding: "utf8" });
assert(schemaRun.status === 0, `current state schema failed:${(schemaRun.stderr || schemaRun.stdout).trim()}`);

const receiptSchema = readJson(`${RUNTIME_ROOT}/impl/cli/contracts/instantiation-receipt.schema.json`);
const receiptBaseline = receiptSchema.properties.baseline.properties;
assert(receiptBaseline.id.const === baseline.baseline_id, "CLI receipt baseline id drift");
assert(receiptBaseline.digest.const === baseline.baseline_digest, "CLI receipt baseline digest drift");
assert(receiptBaseline.manifest_sha256.const === sha256(baselineBytes), "CLI receipt manifest digest drift");
const catalog = read(`${RUNTIME_ROOT}/impl/cli/src/meta-types/frozen-catalog.generated.ts`).toString("utf8");
assert(catalog.includes(baseline.baseline_id) && catalog.includes(baseline.baseline_digest), "CLI catalog baseline drift");
const catalogTypes = read(`${RUNTIME_ROOT}/impl/cli/src/meta-types/types.ts`).toString("utf8");
assert(catalogTypes.includes('`domainspec-meta-types-current-implemented@${number}-candidate.${number}`'), "candidate baseline identity type missing");
assert(catalogTypes.includes("export type ImplementedBaselineId ="), "shared candidate baseline identity type missing");
for (const relativePath of ["src/generation/contracts.ts", "src/conformance/receipt.ts"]) {
  const consumer = read(`${RUNTIME_ROOT}/impl/cli/${relativePath}`).toString("utf8");
  assert(consumer.includes("ImplementedBaselineId") && consumer.includes("readonly id: ImplementedBaselineId;"), `candidate baseline identity consumer drift:${relativePath}`);
}
const cliTsconfigPath = `${RUNTIME_ROOT}/impl/cli/tsconfig.json`;
const cliTsconfig = readJson(cliTsconfigPath);
assert(cliTsconfig.extends === "../../../../../../toolchains/node-typescript/tsconfig/node.json", "relocated CLI tsconfig base drift");
assert(path.posix.normalize(path.posix.join(path.posix.dirname(cliTsconfigPath), cliTsconfig.extends)) === "toolchains/node-typescript/tsconfig/node.json", "relocated CLI tsconfig does not resolve to Node 26 profile");
const cliPackage = readJson(`${RUNTIME_ROOT}/impl/cli/package.json`);
const cliPackageLock = readJson(`${RUNTIME_ROOT}/impl/cli/package-lock.json`);
assert(canonicalDigest(cliPackage.devDependencies) === canonicalDigest(CLI_DEV_DEPENDENCIES), "standalone CLI development dependencies drift");
assert(cliPackageLock.lockfileVersion === 3, "standalone CLI lockfile version drift");
assert(canonicalDigest(cliPackageLock.packages?.[""]?.devDependencies) === canonicalDigest(CLI_DEV_DEPENDENCIES), "standalone CLI lock dependency drift");
const integrationProfileRun = spawnSync(process.execPath, ["tools/materialize-system-integration-profile.mjs", "--check"], {
  cwd: path.join(repoRoot, RUNTIME_ROOT, "impl/cli"),
  encoding: "utf8",
});
assert(integrationProfileRun.status === 0, `system-integration profile projection failed:${(integrationProfileRun.stderr || integrationProfileRun.stdout).trim()}`);

const cliRoot = path.join(repoRoot, RUNTIME_ROOT, "impl/cli");
for (const [contractPath, schemaPath] of [
  ["contracts/foundation-contract.json", "contracts/foundation-contract.schema.json"],
  ["contracts/foundation-contract.candidate-3.json", "contracts/foundation-contract.candidate-3.schema.json"],
]) {
  const contractSchemaRun = spawnSync("python3", ["-c", "import json,jsonschema,sys; s=json.load(open(sys.argv[1])); v=json.load(open(sys.argv[2])); jsonschema.Draft202012Validator.check_schema(s); jsonschema.Draft202012Validator(s).validate(v)", path.join(cliRoot, schemaPath), path.join(cliRoot, contractPath)], { encoding: "utf8" });
  assert(contractSchemaRun.status === 0, `migrated foundation contract schema failed:${contractPath}:${(contractSchemaRun.stderr || contractSchemaRun.stdout).trim()}`);
}
for (const validatorPath of ["tools/validate-foundation-contract.mjs", "contracts/validate-foundation-contract.candidate-3.mjs"]) {
  const contractRun = spawnSync(process.execPath, [validatorPath], { cwd: cliRoot, encoding: "utf8" });
  assert(contractRun.status === 0, `migrated foundation contract validator failed:${validatorPath}:${(contractRun.stderr || contractRun.stdout).trim()}`);
}

const ontologySources = readJson(`${ONTOLOGY_ROOT}/sources.json`);
for (const source of ontologySources.sources) assert(sha256(read(source.path)) === source.sha256, `ontology source digest drift:${source.source_id}`);
const ontologyProfile = readJson(`${ONTOLOGY_ROOT}/profile.json`);
assert(ontologyProfile.current_implementation.baseline_id === baseline.baseline_id, "ontology baseline identity drift");
assert(ontologyProfile.current_implementation.baseline_digest === baseline.baseline_digest, "ontology baseline digest drift");
assert(ontologyProfile.authority_effect === "none", "ontology candidate authority inflated");

process.stdout.write(`${JSON.stringify({status:"pass",checks,baseline_id:baseline.baseline_id,baseline_digest:baseline.baseline_digest,frozen_evidence_files:baseline.inventory.length,realization_rows:baseline.realization_rows.length,authority_effect:"none"}, null, 2)}\n`);
