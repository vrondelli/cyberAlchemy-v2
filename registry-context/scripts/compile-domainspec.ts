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
const developmentProfileHandle = "registry-context-development-explicit-v0.1";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
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

const generated: Record<string, string> = {
  "graph.json": artifacts.graphBytes,
  "source-manifest.json": artifacts.sourceManifestBytes,
  "SPEC.md": artifacts.markdownBytes,
  "markdown-view.json": artifacts.markdownViewBytes,
  "build-receipt.json": artifacts.buildReceiptBytes,
};
const graphDigest = sha256(artifacts.graphBytes);
const systemNodes = bytes({
  schema_version: "cav2-registry-context-system-nodes/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  nodes: artifacts.graph.nodes.map((node) => ({ ...node, authority_effect: "none" })),
});
const systemRelations = bytes({
  schema_version: "cav2-registry-context-system-relations/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  relations: artifacts.graph.edges.map((edge) => ({ ...edge, authority_effect: "none" })),
});
const compilerPath = fileURLToPath(import.meta.url);
const systemProfile = bytes({
  schema_version: "cav2-registry-context-system-profile/v1",
  ontology_id: "cav2.registry-context.system-runtime.v2",
  ontology_type: "system-runtime",
  branch: "system",
  project_ref: "CA2-PROJECT-REGISTRY-CONTEXT",
  goal_ref: "CA2-GOAL-REGISTRY-CONTEXT-FIRST-VERTICAL",
  context_ref: "CA2-CONTEXT-REGISTRY-CONTEXT-FIRST-VERTICAL",
  domainspec_project_ref: "../domainspec-project/project.json",
  compiled_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  compiled_graph_digest: graphDigest,
  source_set_digest: artifacts.graph.source_set_digest,
  domainspec_build_receipt_ref: "../domainspec-project/.domainspec/generated/build-receipt.json",
  domainspec_build_receipt_digest: sha256(artifacts.buildReceiptBytes),
  compiler_ref: "../scripts/compile-domainspec.ts",
  compiler_digest: sha256(readFileSync(compilerPath)),
  bridge_ref: "BRIDGE.json",
  runtime_owner: "CyberAlchemy v2 Registry Context runtime owner",
  implementation_state: "local-read-only-prototype-implemented-not-adopted",
  domainspec_conformance: "development-profile-build-pass-release-admission-not-granted",
  authority_effect: "none",
});
const outputs: Record<string, string> = {
  ...Object.fromEntries(Object.entries(generated).map(([name, value]) => [`domainspec-project/.domainspec/generated/${name}`, value])),
  "system-ontology/NODES.json": systemNodes,
  "system-ontology/RELATIONS.json": systemRelations,
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
  graph_digest: graphDigest,
  source_set_digest: artifacts.graph.source_set_digest,
  domainspec_profile: "registry-context-development@0.1",
  domainspec_profile_status: "development-only",
  authority_effect: "none",
  claim_ceiling: "Deterministic DomainSpec v2 development-profile build and system projection only; no release admission, implementation conformance, runtime adoption, publication, or deployment.",
}));
process.exit(status === "PASS" ? 0 : 1);
