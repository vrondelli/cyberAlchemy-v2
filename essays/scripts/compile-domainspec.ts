#!/usr/bin/env -S node --import tsx
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMintedProjectViews,
  verifyMintedProjectBuild,
} from "../../../projects/domainspec-v2/impl/tools/minted-project/views.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const projectRoot = resolve(packageRoot, "domainspec-project");
const generatedRoot = resolve(projectRoot, ".domainspec/generated");
const systemRoot = resolve(packageRoot, "system-ontology");
const developmentProfilePath = resolve(projectRoot, "development-profile.json");
const developmentProfileHandle = "essays-development-explicit-v0.1";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

const artifacts = buildMintedProjectViews(projectRoot, {
  developmentProfileRegistry: {
    path: developmentProfilePath,
    handle: developmentProfileHandle,
  },
});
const verification = verifyMintedProjectBuild(projectRoot, artifacts);
if (verification.status !== "pass") {
  process.stdout.write(bytes({ status: "BLOCK", codes: verification.codes, authority_effect: "none" }));
  process.exit(1);
}

const bridgePath = resolve(systemRoot, "BRIDGE.json");
const bridgeBytes = readFileSync(bridgePath);
const bridge = readJson(bridgePath);
const semanticNodes = readJson(resolve(packageRoot, "nodes.json"));
const semanticIds = new Set(
  ((semanticNodes.nodes ?? []) as Array<Record<string, unknown>>).map((node) => String(node.id)),
);
const systemIds = new Set(artifacts.graph.nodes.map((node) => node.node_id));
const mappings = Array.isArray(bridge.mappings)
  ? bridge.mappings as Array<Record<string, unknown>>
  : [];
const bridgeErrors: string[] = [];
if (bridge.schema_version !== "cav2-essays-semantic-system-bridge/v1") {
  bridgeErrors.push("BRIDGE_SCHEMA_VERSION_INVALID");
}
if (bridge.authority_effect !== "none") bridgeErrors.push("BRIDGE_AUTHORITY_EFFECT_INVALID");
if (mappings.length === 0) bridgeErrors.push("BRIDGE_MAPPINGS_EMPTY");
for (const mapping of mappings) {
  const semanticRef = String(mapping.semantic_ref ?? "");
  const systemRef = String(mapping.system_ref ?? "");
  if (!semanticIds.has(semanticRef)) bridgeErrors.push(`BRIDGE_SEMANTIC_REF_MISSING:${semanticRef}`);
  if (!systemIds.has(systemRef)) bridgeErrors.push(`BRIDGE_SYSTEM_REF_MISSING:${systemRef}`);
  if (!String(mapping.claim_limit ?? "")) bridgeErrors.push(`BRIDGE_CLAIM_LIMIT_MISSING:${semanticRef}:${systemRef}`);
}
if (bridgeErrors.length > 0) {
  process.stdout.write(bytes({ status: "BLOCK", codes: bridgeErrors.sort(), authority_effect: "none" }));
  process.exit(1);
}

const generated: Record<string, string> = {
  "graph.json": artifacts.graphBytes,
  "source-manifest.json": artifacts.sourceManifestBytes,
  "SPEC.md": artifacts.markdownBytes,
  "markdown-view.json": artifacts.markdownViewBytes,
  "build-receipt.json": artifacts.buildReceiptBytes,
};
const graphDigest = sha256(artifacts.graphBytes);
const compilerPath = fileURLToPath(import.meta.url);
const systemNodes = bytes({
  schema_version: "cav2-essays-system-nodes/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  nodes: artifacts.graph.nodes.map((node) => ({ ...node, authority_effect: "none" })),
});
const systemRelations = bytes({
  schema_version: "cav2-essays-system-relations/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  relations: artifacts.graph.edges.map((edge) => ({ ...edge, authority_effect: "none" })),
});
const bridgeValidation = bytes({
  schema_version: "cav2-essays-bridge-validation/v1",
  status: "PASS",
  bridge_ref: "BRIDGE.json",
  bridge_digest: sha256(bridgeBytes),
  semantic_node_registry_ref: "../nodes.json",
  semantic_node_registry_digest: sha256(readFileSync(resolve(packageRoot, "nodes.json"))),
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  mapping_count: mappings.length,
  authority_effect: "none",
  claim_ceiling: "Bridge referential closure only; no semantic equivalence, implementation binding, conformance, release admission, or adoption claim.",
});
const systemProfile = bytes({
  schema_version: "cav2-essays-system-profile/v1",
  ontology_id: "cav2.essays.system-runtime.v1",
  ontology_type: "system-runtime",
  branch: "system",
  project_ref: "CA2-PROJECT-ESSAYS",
  goal_ref: "CA2-GOAL-ESSAYS-FIRST-RUNTIME",
  product_ref: "CA2-PRODUCT-ESSAYS",
  product_capability_ref: "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
  product_capability_refs: [
    "CA2-CAP-DEVELOP-GOVERNED-ESSAY",
    "CA2-CAP-INSPECT-ESSAYS-PRODUCT-MODEL",
  ],
  domainspec_project_ref: "../domainspec-project/project.json",
  compiled_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  compiled_graph_digest: graphDigest,
  source_set_digest: artifacts.graph.source_set_digest,
  domainspec_build_receipt_ref: "../domainspec-project/.domainspec/generated/build-receipt.json",
  domainspec_build_receipt_digest: sha256(artifacts.buildReceiptBytes),
  compiler_ref: "../scripts/compile-domainspec.ts",
  compiler_digest: sha256(readFileSync(compilerPath)),
  bridge_ref: "BRIDGE.json",
  bridge_digest: sha256(bridgeBytes),
  bridge_validation_ref: "BRIDGE-VALIDATION.json",
  bridge_validation_digest: sha256(bridgeValidation),
  runtime_owner: "CyberAlchemy v2 Essays runtime owner",
  implementation_state: "not-started",
  domainspec_conformance: "development-profile-build-pass-release-admission-not-granted",
  authority_effect: "none",
  claim_ceiling: "Deterministic DomainSpec v2 development-profile graph and system ontology projection only; no implementation binding, runtime conformance, dependency adoption, release admission, publication, or deployment."
});
const outputs: Record<string, string> = {
  ...Object.fromEntries(Object.entries(generated).map(([name, value]) => [`domainspec-project/.domainspec/generated/${name}`, value])),
  "system-ontology/NODES.json": systemNodes,
  "system-ontology/RELATIONS.json": systemRelations,
  "system-ontology/BRIDGE-VALIDATION.json": bridgeValidation,
  "system-ontology/PROFILE.json": systemProfile,
};

const checkOnly = process.argv.includes("--check");
const mismatches: string[] = [];
for (const [relative, content] of Object.entries(outputs)) {
  const target = resolve(packageRoot, relative);
  if (checkOnly) {
    try {
      if (readFileSync(target, "utf8") !== content) mismatches.push(relative);
    } catch {
      mismatches.push(relative);
    }
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}
const status = mismatches.length === 0 ? "PASS" : "BLOCK";
process.stdout.write(bytes({
  status,
  mode: checkOnly ? "check" : "write",
  outputs: Object.keys(outputs).sort(),
  mismatches,
  node_count: artifacts.graph.nodes.length,
  relation_count: artifacts.graph.edges.length,
  bridge_mapping_count: mappings.length,
  graph_digest: graphDigest,
  source_set_digest: artifacts.graph.source_set_digest,
  domainspec_profile: "essays-development@0.1",
  domainspec_profile_status: "development-only",
  authority_effect: "none",
  claim_ceiling: "Deterministic DomainSpec v2 development-profile build and system projection only; no release admission, implementation conformance, dependency adoption, runtime adoption, publication, or deployment."
}));
process.exit(status === "PASS" ? 0 : 1);
