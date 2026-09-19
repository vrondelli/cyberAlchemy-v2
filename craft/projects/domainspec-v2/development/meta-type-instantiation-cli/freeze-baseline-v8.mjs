import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "../..");
const repoRoot = resolve(projectRoot, "../..");
const outputPath = resolve(here, "CANONICAL-IMPLEMENTED-BASELINE.v8.json");
const decisionPath = resolve(here, "OWNER-SYSTEM-INTEGRATION-FORMATION-IMPLEMENTATION-ADMISSION.json");
const statePath = resolve(projectRoot, ".craft/artifacts/META-TYPE-STATE.json");
const maturityPath = resolve(
  projectRoot,
  "development/backend-meta-type-conformance/evidence/WP-BMC-001/BMC-EVD-001.MATURITY-MATRIX.json",
);

const sha256Bytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const repoPath = (path) => relative(repoRoot, path).replaceAll("\\", "/");

const exactFiles = [
  "definitions/DEFINITIONS.md",
  "definitions/DEFINITIONS-INDEX.md",
  "definitions/DEFINITION-DRIFT-AUDIT.md",
  "definitions/meta-types/meta-types.yml",
  "definitions/meta-types/meta-types.md",
  "definitions/meta-types/current-implementation.schema.json",
  "definitions/meta-types/validate-current-implementation.mjs",
  "definitions/relationships/relationships.yml",
  "definitions/minted-project/supported-profiles.yml",
  "RUNTIME.json",
  "validate-runtime.mjs",
  "impl/architecture-conformance/targets/typescript/workflow-compensation-v1.md",
  "impl/architecture-conformance/targets/typescript/workflow-compensation-v1.ts",
  "impl/architecture-conformance/targets/typescript/workflow-compensation-v1.test.ts",
  "impl/architecture-conformance/targets/typescript/workflow-v1.composition.ts",
  "impl/architecture-conformance/targets/typescript/workflow-v1.composition.test.ts",
  "development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json",
  "development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  "development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  "development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
  "development/backend-meta-type-conformance/evidence/WP-BMC-001/BMC-EVD-001.MATURITY-MATRIX.json",
  "development/durable-compensation-concepts/README.md",
  "development/durable-compensation-concepts/concepts.json",
  "development/durable-compensation-concepts/concepts.schema.json",
  "development/durable-compensation-concepts/validate.mjs",
  "development/meta-type-instantiation-cli/freeze-baseline-v8.mjs",
  "development/meta-type-instantiation-cli/validate-baseline-v8.mjs",
].map((path) => resolve(projectRoot, path));

const evidenceRoots = [
  "impl/spec/meta-types",
  "impl/architecture-conformance/families",
  "impl/architecture-conformance/realizations",
  "impl/architecture-conformance/acceptance",
  "impl/architecture-conformance/kernel",
  "impl/architecture-conformance/factory",
  "impl/cli/src",
  "impl/cli/contracts",
  "impl/cli/test",
  "impl/cli/tools",
  "impl/system-integration",
].map((path) => resolve(projectRoot, path));

const digestCycleProjections = new Set([
  "projects/domainspec-v2/impl/cli/contracts/instantiation-receipt.schema.json",
  "projects/domainspec-v2/impl/cli/src/meta-types/frozen-catalog.generated.ts",
  "projects/domainspec-v2/impl/cli/tools/materialize-frozen-catalog.mjs",
]);

function walk(root) {
  const stat = lstatSync(root);
  if (stat.isSymbolicLink()) throw new Error(`BASELINE_SYMLINK_FORBIDDEN:${repoPath(root)}`);
  if (stat.isFile()) return [root];
  if (!stat.isDirectory()) return [];
  return readdirSync(root, { withFileTypes: true })
    .sort((left, right) => Buffer.from(left.name).compare(Buffer.from(right.name)))
    .flatMap((entry) => walk(resolve(root, entry.name)));
}

const inventoryPaths = [...new Set([...exactFiles, ...evidenceRoots.flatMap(walk)])]
  .filter((path) => !digestCycleProjections.has(repoPath(path)))
  .sort((left, right) => Buffer.from(repoPath(left)).compare(Buffer.from(repoPath(right))));

const inventory = inventoryPaths.map((path) => {
  const bytes = readFileSync(path);
  return Object.freeze({ path: repoPath(path), bytes: bytes.length, sha256: sha256Bytes(bytes) });
});

const state = readJson(statePath);
const maturity = readJson(maturityPath);
const decisionBytes = readFileSync(decisionPath);

const realizationRows = maturity.rows.flatMap((row) => row.realization_refs.map((realization) => ({
  meta_type_id: row.meta_type_id,
  meta_type_label: row.meta_type_label,
  language: realization.language,
  source: {
    path: realization.source.path,
    sha256: sha256Bytes(readFileSync(resolve(repoRoot, realization.source.path))),
  },
  provider: {
    path: realization.provider.path,
    sha256: sha256Bytes(readFileSync(resolve(repoRoot, realization.provider.path))),
  },
  binding: {
    path: realization.binding.path,
    sha256: sha256Bytes(readFileSync(resolve(repoRoot, realization.binding.path))),
  },
}))).sort((left, right) => Buffer.from(`${left.meta_type_id}/${left.language}`)
  .compare(Buffer.from(`${right.meta_type_id}/${right.language}`)));

const body = {
  $schema: "https://domainspec.dev/schemas/canonical-implemented-meta-type-baseline/v8",
  schema_version: "domainspec.canonical-implemented-meta-type-baseline/v8",
  baseline_id: "domainspec-meta-types-current-implemented@8",
  frozen_at: "2026-08-30",
  supersedes: {
    baseline_id: "domainspec-meta-types-current-implemented@7",
    baseline_digest: "98b7a28db368dee56f16769ac3a78873adc0dbd82b4e11f89f94d1579c5fb5ac",
    manifest_path: "projects/domainspec-v2/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v7.json",
    reason: "Baseline @8 preserves @7 and admits the completed Operation and Workflow recovery corrections plus provider-neutral D45-D49 formation, three-language contracts, CLI generation, exact observation, and tests.",
  },
  owner_decision: {
    path: repoPath(decisionPath),
    sha256: sha256Bytes(decisionBytes),
  },
  denominators: {
    backend_meta_types: state.backend_types.length,
    realization_rows: realizationRows.length,
    realization_languages: ["python", "rust", "typescript"],
    ui_state_rows: state.ui_types.length,
    relationship_authority_rows: state.headline.architecture_relationship_rows,
    compensation_runtime_contracts: 1,
    compensation_definition_cards: 9,
    infrastructure_binding_definition_cards: 5,
    system_integration_language_profiles: 3,
    system_integration_obligation_rows: 15,
    frozen_evidence_files: inventory.length,
  },
  backend_meta_types: state.backend_types.map(({ id, label }) => ({ id, label })),
  ui_state: state.ui_types,
  realization_rows: realizationRows,
  inventory_roots: evidenceRoots.map(repoPath),
  inventory,
  derived_current_views: {
    excluded_from_inventory_to_prevent_digest_cycles: [
      "projects/domainspec-v2/definitions/meta-types/current-implementation.json",
      "projects/domainspec-v2/definitions/meta-types/current-implementation.md",
      "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
      "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
      ...digestCycleProjections,
    ],
    rule: "These derived current-state views must bind this completed manifest and digest exactly; they do not author baseline membership.",
  },
  instantiation_contract: {
    status: "canonical-operational-baseline",
    selection_rule: "Use exactly one realization row matching the requested backend meta-type id and language.",
    generated_receipt_binding: "Every output receipt must bind baseline_id, baseline_digest, selected row paths and selected row digests.",
    mutation_policy: "A changed frozen byte requires a new baseline id and manifest; this manifest is never regenerated in place.",
  },
  claim_ceiling: {
    canonical_project_local_baseline: true,
    current_implementation_evidence_admitted: true,
    generated_target_conformance: true,
    compensation_runtime_contract_admitted: true,
    durable_compensation_model_admitted: true,
    recovery_intent_terminology_admitted: true,
    infrastructure_binding_model_admitted: true,
    durable_workflow_runtime_binding_admitted: true,
    system_integration_contract_profiles_implemented: true,
    system_integration_cli_binding_formation_implemented: true,
    system_integration_provider_runtime_implemented: false,
    system_integration_runtime_guarantees_observed: false,
    durable_compensation_dispatch_implemented: false,
    publication: false,
    release: false,
    deployment: false,
    production: false,
  },
  authority_effect: "project-local-canonical-baseline-admission",
};

const baselineDigest = sha256Bytes(Buffer.from(JSON.stringify(body)));
writeFileSync(outputPath, `${JSON.stringify({ ...body, baseline_digest: baselineDigest }, null, 2)}\n`, {
  encoding: "utf8",
  flag: "wx",
});

process.stdout.write(`${JSON.stringify({
  status: "pass",
  baseline_id: body.baseline_id,
  baseline_digest: baselineDigest,
  evidence_files: inventory.length,
  realization_rows: realizationRows.length,
  output: repoPath(outputPath),
}, null, 2)}\n`);
