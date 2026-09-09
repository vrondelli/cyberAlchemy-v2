import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(runtimeRoot, "..");
const repositoryRoot = resolve(workspaceRoot, "../..");
const implementationRoot = resolve(workspaceRoot, "implementation");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileDigest = (path) => sha256(readFileSync(path));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const fail = (code) => { throw new Error(code); };

const baselinePath = resolve(implementationRoot, "REALIZATION-BASELINE.candidate.json");
const requestPath = resolve(implementationRoot, "OWNER-ACCEPTANCE-REQUEST.json");
const receiptPath = resolve(implementationRoot, "OWNER-ACCEPTANCE-RECEIPT.json");
const baseline = readJson(baselinePath);
const request = readJson(requestPath);
const receipt = readJson(receiptPath);
const baselineDigest = fileDigest(baselinePath);

if (baselineDigest !== "5c8833f886bd55330d602a7f72386861f8d36a8a01aa7923c8afcc8f0c4f7620") fail("BASELINE_DIGEST_DRIFT");
if (request.baseline_digest !== baselineDigest || receipt.baseline_digest !== baselineDigest) fail("BASELINE_ACCEPTANCE_LINK_INVALID");
if (receipt.status !== "accepted" || receipt.selected_option_id !== "WORKSPACE-DECISION-ACCEPT-001") fail("BASELINE_NOT_ACCEPTED");
if (fileDigest(requestPath) !== receipt.owner_request_digest) fail("OWNER_REQUEST_DIGEST_DRIFT");

const boundFiles = [
  [baseline.semantic_binding.definitions_ref, baseline.semantic_binding.definitions_digest],
  [baseline.semantic_binding.capability_ontology_ref, baseline.semantic_binding.capability_ontology_digest],
  [baseline.semantic_binding.node_registry_ref, baseline.semantic_binding.node_registry_digest],
  [baseline.semantic_binding.relation_registry_ref, baseline.semantic_binding.relation_registry_digest],
  [baseline.semantic_binding.essays_evidence_ref, baseline.semantic_binding.essays_evidence_digest],
  [baseline.system_ontology_binding.profile_ref, baseline.system_ontology_binding.profile_digest],
  [baseline.system_ontology_binding.compiled_graph_ref, baseline.system_ontology_binding.compiled_graph_digest],
  [baseline.system_ontology_binding.domainspec_build_receipt_ref, baseline.system_ontology_binding.domainspec_build_receipt_digest],
  [baseline.system_ontology_binding.bridge_ref, baseline.system_ontology_binding.bridge_digest],
  [baseline.system_ontology_binding.bridge_validation_ref, baseline.system_ontology_binding.bridge_validation_digest],
  [baseline.system_ontology_binding.compiler_ref, baseline.system_ontology_binding.compiler_digest],
];
for (const [relative, expected] of boundFiles) {
  const path = resolve(implementationRoot, relative);
  if (fileDigest(path) !== expected) fail(`BOUND_SOURCE_DIGEST_DRIFT:${relative}`);
}

const definitionsPath = resolve(workspaceRoot, "definitions.json");
const nodesPath = resolve(workspaceRoot, "nodes.json");
const relationsPath = resolve(workspaceRoot, "relations.json");
const definitions = readJson(definitionsPath);
const nodes = readJson(nodesPath).nodes;
const catalogRun = spawnSync(
  "python3",
  ["cyberAlchemy-v2/implementation/ontology-runtime/runtime.py", "catalog"],
  { cwd: repositoryRoot, encoding: "utf8", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" } },
);
if (catalogRun.error || !catalogRun.stdout) fail("ONTOLOGY_CATALOG_EXECUTION_FAILED");
const catalog = JSON.parse(catalogRun.stdout);
if (!Array.isArray(catalog.entries)) fail("ONTOLOGY_CATALOG_SHAPE_INVALID");
const workspaceCatalogEntry = catalog.entries.find((entry) => entry.ontology_id === baseline.ontology_runtime_binding.ontology_id);
if (!workspaceCatalogEntry || workspaceCatalogEntry.status !== "PASS" || workspaceCatalogEntry.snapshot_id !== baseline.ontology_runtime_binding.catalog_snapshot_id) fail("WORKSPACE_CATALOG_SNAPSHOT_DRIFT");
if (workspaceCatalogEntry.material_digest !== baseline.ontology_runtime_binding.material_digest) fail("WORKSPACE_MATERIAL_DIGEST_DRIFT");

const catalogProjection = catalog.entries.map((entry) => ({
  ontologyId: entry.ontology_id,
  materialDigest: entry.material_digest,
  snapshotId: entry.snapshot_id,
  status: entry.status,
})).sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));
const sourceEpoch = sha256(JSON.stringify({
  baselineDigest,
  definitions: fileDigest(definitionsPath),
  nodes: fileDigest(nodesPath),
  relations: fileDigest(relationsPath),
  catalog: catalogProjection,
}));

const record = (collection, value) => ({ collection, ...value, sourceEpoch });
const definitionRecords = [
  ...definitions.canonical_bindings.map((item) => record("definitions", {
    recordId: item.definition_ref,
    label: item.term,
    status: "canonical-binding",
    meaning: item.use,
    ownerRoute: "CyberAlchemy v2 definitions-governance owner",
    sourceRefs: [`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#${item.definition_ref}`],
    boundary: `The Workspace projection does not redefine, revise, or promote ${item.definition_ref}.`,
    claimCeiling: "Canonical definition binding and Workspace use only.",
  })),
  ...definitions.proposals.map((item) => record("definitions", {
    recordId: item.definition_id,
    label: item.term,
    status: item.status,
    meaning: item.normative_voice,
    ownerRoute: item.owner_route,
    sourceRefs: [`cyberAlchemy-v2/workspace/definitions.json#${item.definition_id}`],
    boundary: item.forbidden_collapse,
    claimCeiling: "Candidate Workspace-local definition only.",
  })),
].sort((a, b) => a.label.localeCompare(b.label));

const fromNode = (collection, node) => record(collection, {
  recordId: node.id,
  label: node.label,
  status: node.status,
  meaning: node.meaning,
  ownerRoute: node.owner_route,
  sourceRefs: node.source_refs,
  boundary: node.boundary,
  claimCeiling: node.claim_ceiling,
  ...(collection === "projects" ? { projectEntryRef: `#/projects/${node.id}` } : {}),
});
const productRecords = nodes.filter((node) => node.kind === "Product" || node.kind === "Product Capability")
  .map((node) => fromNode("products", node)).sort((a, b) => a.label.localeCompare(b.label));
const projectRecords = nodes.filter((node) => node.kind === "Project" || node.kind === "Project Entry")
  .map((node) => fromNode("projects", node)).sort((a, b) => a.label.localeCompare(b.label));

const registry = readJson(resolve(repositoryRoot, "cyberAlchemy-v2/implementation/ontology-runtime/registry.json"));
const registrations = new Map(registry.entries.map((entry) => [entry.ontology_id, entry]));
const ontologyRecords = catalog.entries.map((entry) => {
  const registration = registrations.get(entry.ontology_id);
  const profilePath = resolve(repositoryRoot, registration.package_root, registration.profile_ref);
  const profile = readJson(profilePath);
  return record("ontologies", {
    recordId: entry.ontology_id,
    label: profile.title ?? entry.ontology_id,
    status: entry.status === "PASS" ? "registered-current" : "registered-blocked",
    meaning: `${profile.ontology_type ?? "Registered ontology"} at ${registration.package_root}.`,
    ownerRoute: entry.owner_route,
    sourceRefs: [`${registration.package_root}/${registration.profile_ref}`, `ontology-runtime:snapshot:${entry.snapshot_id ?? "unavailable"}`],
    boundary: "Catalog visibility and currentness do not imply ontology acceptance, semantic authority, conformance, or mutation permission.",
    claimCeiling: "Read-only ontology-runtime catalog projection at the displayed snapshot.",
  });
}).sort((a, b) => a.label.localeCompare(b.label));

const snapshot = {
  snapshotId: sha256(`cav2-workspace:${sourceEpoch}`),
  sourceEpoch,
  generatedAt: receipt.accepted_at,
  authorityEffect: "none",
  definitions: definitionRecords,
  products: productRecords,
  projects: projectRecords,
  ontologies: ontologyRecords,
};
const output = `/* Generated by scripts/build-workspace-snapshot.mjs. Do not edit. */\nimport type { WorkspaceSnapshot } from "./workspace";\n\nexport const GENERATED_WORKSPACE_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)} as const satisfies WorkspaceSnapshot;\n`;
const target = resolve(runtimeRoot, "src/domain/workspace.generated.ts");
const checkOnly = process.argv.includes("--check");
const current = (() => { try { return readFileSync(target, "utf8"); } catch { return null; } })();
if (checkOnly && current !== output) fail("GENERATED_WORKSPACE_SNAPSHOT_DRIFT");
if (!checkOnly && current !== output) writeFileSync(target, output);
process.stdout.write(`${JSON.stringify({ status: "PASS", mode: checkOnly ? "check" : "write", snapshotId: snapshot.snapshotId, sourceEpoch, counts: { definitions: definitionRecords.length, products: productRecords.length, projects: projectRecords.length, ontologies: ontologyRecords.length }, authorityEffect: "none" }, null, 2)}\n`);
