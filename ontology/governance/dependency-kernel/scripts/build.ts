import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../../../projects/domainspec-v2/impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function build() {
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "governance-dependency-kernel-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }

  const compilerPath = resolve(packageRoot, "../../../../projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(packageRoot, "../../../../projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const systemOntology = {
    schema_version: "governance-dependency-kernel-system-ontology/v1",
    ontology_id: "governance.system.dependency-kernel",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    enforcement_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    implementation_contract: {
      product_capability_ref: "CA2-CAP-VALIDATE-DEPENDENCY-RELEVANCE",
      business_ontology_ref: "GOV-DEPENDENCY-KERNEL-ONTOLOGY",
      implementation_target_ref: "cyberAlchemy-v2/ontology/governance/dependency-kernel/runtime/src/lib.rs",
      implementation_language: "rust",
      permitted_operations: ["validate-program", "evaluate", "enforce"],
      evaluation_modes: ["admitted_use", "candidate_construction"],
      evaluation_results: ["PASS", "CANDIDATE", "BLOCK", "NOT_EVALUABLE"],
      relevance_boundary: "explicit-roots-plus-transitive-dependency-closure",
      selector_kinds: ["whole-file", "heading-section", "json-record", "json-record-set"],
      ambient_drift: "diagnostic-only",
      candidate_activation: "forbidden",
      enforcement_requires_activation_binding: true,
      effect_authorized: false,
      authority_effect: "none",
      enforcement_effect: "none",
    },
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "governance-dependency-kernel-system-ontology-projection/v1",
    status: "candidate",
    deterministic_runs: 2,
    equal_graph_bytes: true,
    equal_system_ontology_bytes: true,
    source_graph_digest: sha256(first.graphBytes),
    system_ontology_digest: sha256(systemOntologyBytes),
    profile_id: first.buildReceipt.language.profile_id,
    profile_version: first.buildReceipt.language.profile_version,
    profile_digest: first.buildReceipt.language.profile_digest,
    profile_release_admission: "not-granted",
    authority_effect: "none",
    enforcement_effect: "none",
    claim_limit: "Deterministic candidate projection only; no profile or system-ontology admission, Rust baseline acceptance, conformance, program activation, route enforcement, publication, release, or deployment.",
  };
  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": systemOntologyBytes,
    "system-ontology-receipt.json": bytes(projectionReceipt),
  };
}

const artifacts = build();
if (process.argv.includes("--emit-json")) {
  process.stdout.write(bytes(artifacts));
} else {
  mkdirSync(generatedRoot, { recursive: true });
  for (const [name, content] of Object.entries(artifacts)) writeFileSync(resolve(generatedRoot, name), content, "utf8");
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
