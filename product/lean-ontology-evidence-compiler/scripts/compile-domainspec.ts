#!/usr/bin/env -S node --import tsx
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMintedProjectViews,
  verifyMintedProjectBuild,
} from "../../../../projects/domainspec-v2/impl/tools/minted-project/views.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const projectRoot = resolve(packageRoot, "domainspec-project");
const profilePath = resolve(projectRoot, "development-profile.json");
const generatedRoot = resolve(projectRoot, ".domainspec/generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const artifacts = buildMintedProjectViews(projectRoot, {
  developmentProfileRegistry: {
    path: profilePath,
    handle: "lean-ontology-evidence-development-explicit-v0.1",
  },
});
const verification = verifyMintedProjectBuild(projectRoot, artifacts);
if (verification.status !== "pass") {
  process.stdout.write(bytes({status:"BLOCK", codes:verification.codes, authority_effect:"none"}));
  process.exit(1);
}

const graphDigest = sha256(artifacts.graphBytes);
const compilerDigest = sha256(readFileSync(fileURLToPath(import.meta.url)));
const generated: Record<string, string> = {
  "graph.json": artifacts.graphBytes,
  "source-manifest.json": artifacts.sourceManifestBytes,
  "SPEC.md": artifacts.markdownBytes,
  "markdown-view.json": artifacts.markdownViewBytes,
  "build-receipt.json": artifacts.buildReceiptBytes,
};
const systemNodes = bytes({
  schema_version: "cav2-loec-system-nodes/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  nodes: artifacts.graph.nodes.map((node) => ({...node, authority_effect:"none"})),
});
const systemRelations = bytes({
  schema_version: "cav2-loec-system-relations/v1",
  source_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  source_graph_digest: graphDigest,
  relations: artifacts.graph.edges.map((edge) => ({...edge, authority_effect:"none"})),
});
const bridge = bytes({
  schema_version: "cav2-loec-business-system-bridge/v1",
  status: "candidate-not-admitted",
  business_ontology_ref: "../business-ontology/PROFILE.json",
  compiled_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  compiled_graph_digest: graphDigest,
  mappings: [
    {business_ref:"B-LOEC-LEAN-DECLARATION-BINDING", system_ref:"lean-ontology-evidence-compiler.LeanDeclarationBinding", relation:"realized_by", status:"candidate"},
    {business_ref:"B-LOEC-CANDIDATE-TYPED-EDGE", system_ref:"lean-ontology-evidence-compiler.CandidateTypedEdge", relation:"realized_by", status:"candidate"},
    {business_ref:"CA2-CAP-CONTRACT-LEAN-ONTOLOGY-EVIDENCE-INPUT", system_ref:"lean-ontology-evidence-compiler.EvidencePackage", relation:"realized_by", status:"candidate"},
    {business_ref:"CA2-CAP-CONTRACT-LEAN-ONTOLOGY-EVIDENCE-RESULT", system_ref:"lean-ontology-evidence-compiler.TypedEdgeValidationResult", relation:"realized_by", status:"candidate"},
    {business_ref:"B-LOEC-OUTCOME-REVIEWABLE-EVIDENCE", system_ref:"lean-ontology-evidence-compiler.ValidateTypedOntologyEdge", relation:"depends_on", status:"candidate"}
  ],
  authority_effect: "none",
  claim_limit: "Traceability candidate only; no business-meaning fidelity decision or ontology admission."
});
const systemProfile = bytes({
  schema_version: "cav2-loec-system-profile/v1",
  ontology_id: "cav2.lean-ontology-evidence-compiler.system.v1",
  ontology_type: "system-runtime",
  branch: "system",
  status: "candidate-not-admitted",
  capability_ref: "CA2-CAP-COMPILE-LEAN-ONTOLOGY-EVIDENCE",
  domainspec_project_ref: "../domainspec-project/project.json",
  domainspec_profile_ref: "../domainspec-project/development-profile.json",
  compiled_graph_ref: "../domainspec-project/.domainspec/generated/graph.json",
  compiled_graph_digest: graphDigest,
  source_set_digest: artifacts.graph.source_set_digest,
  domainspec_build_receipt_ref: "../domainspec-project/.domainspec/generated/build-receipt.json",
  domainspec_build_receipt_digest: sha256(artifacts.buildReceiptBytes),
  compiler_ref: "../scripts/compile-domainspec.ts",
  compiler_digest: compilerDigest,
  bridge_ref: "BRIDGE.json",
  implementation_binding_ref: "../implementation/BINDING.json",
  stage_states: {
    definitions: "candidate",
    product_ontology: "candidate",
    business_ontology: "candidate",
    domainspec_source: "validated",
    compiled_graph: "validated",
    system_ontology: "candidate",
    implementation: "not_evaluable",
    static_conformance: "not_evaluable",
    runtime_evidence: "absent"
  },
  authority_effect: "none",
  claim_limit: "Deterministic development-profile projection only; no release-profile admission, system-ontology admission, implementation acceptance, or conformance."
});

const outputs: Record<string, string> = {
  ...Object.fromEntries(Object.entries(generated).map(([name, value]) => [`domainspec-project/.domainspec/generated/${name}`, value])),
  "system-ontology/NODES.json": systemNodes,
  "system-ontology/RELATIONS.json": systemRelations,
  "system-ontology/BRIDGE.json": bridge,
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
    mkdirSync(dirname(target), {recursive:true});
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
  domainspec_profile: "lean-ontology-evidence-development@0.1",
  domainspec_profile_status: "development-only",
  authority_effect: "none",
  claim_ceiling: "Deterministic candidate projection only; no admission, implementation acceptance, conformance, publication, release, or deployment."
}));
process.exit(status === "PASS" ? 0 : 1);
