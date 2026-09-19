import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../../../../impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const domainspecRoot = resolve(scriptDir, "..");
const packageRoot = resolve(domainspecRoot, "..");
const repositoryRoot = resolve(packageRoot, "../../../../../..");
const generatedRoot = resolve(domainspecRoot, "generated");
const sha256 = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");
const jsonBytes = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

function build() {
  const options = {
    developmentProfileRegistry: {
      path: resolve(domainspecRoot, "development-profile.json"),
      handle: "orodi-alert-profile-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(domainspecRoot, options);
  const second = buildMintedProjectViews(domainspecRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }
  const compilerPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const systemOntology = {
    schema_version: "domainspec.orodi.alert-profile-system-ontology/v1",
    ontology_id: "domainspec.orodi.alert-profile.system@1",
    status: "candidate",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    language: first.graph.language,
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
    projection_contract: {
      derivation: "exact-copy-of-compiled-graph-nodes-and-edges",
      independently_authored_system_nodes_forbidden: true,
      product_capability_projection_ref: "../../product-capability-projection.json",
      business_ontology_ref: "../../business-ontology",
      profile_release_admission: "not-granted",
      system_ontology_admission: "not-granted",
      authority_effect: "none",
    },
    claim_ceiling: "Deterministic alert-profile candidate projection only; no admission, binding acceptance, implementation conformance, notification authority, publication, release, deployment, or external effect.",
  };
  const systemOntologyBytes = jsonBytes(systemOntology);
  const receipt = {
    schema_version: "domainspec.orodi.alert-profile-system-ontology-projection/v1",
    status: "candidate",
    deterministic_runs: 2,
    equal_graph_bytes: true,
    equal_system_ontology_bytes: true,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    system_ontology_digest: sha256(systemOntologyBytes),
    profile_id: first.buildReceipt.language.profile_id,
    profile_version: first.buildReceipt.language.profile_version,
    profile_digest: first.buildReceipt.language.profile_digest,
    profile_release_admission: "not-granted",
    authority_effect: "none",
  };
  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": systemOntologyBytes,
    "system-ontology-receipt.json": jsonBytes(receipt),
  };
}

const artifacts = build();
if (process.argv.includes("--emit-json")) process.stdout.write(jsonBytes(artifacts));
else {
  mkdirSync(generatedRoot, { recursive: true });
  for (const [name, content] of Object.entries(artifacts)) writeFileSync(resolve(generatedRoot, name), content, "utf8");
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
