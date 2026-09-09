import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../../../../projects/domainspec-v2/impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function verifySources() {
  const registry = JSON.parse(readFileSync(resolve(packageRoot, "sources.json"), "utf8"));
  const sources = registry?.sources as Array<{id: string; path: string; sha256: string}>;
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("SOURCE_BINDINGS_MISSING");
  for (const source of sources) {
    const observed = sha256(readFileSync(resolve(repositoryRoot, source.path)));
    if (observed !== source.sha256) throw new Error(`SOURCE_BINDING_DRIFT:${source.id}:${observed}`);
  }
  return sources;
}

function build() {
  const sources = verifySources();
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "are-continuous-construction-task-loop-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }

  const compilerPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const builderPath = resolve(packageRoot, "scripts/build.ts");
  const capabilityPath = resolve(packageRoot, "product-capability.json");
  const businessPath = resolve(packageRoot, "business-ontology.json");
  const interfacePath = resolve(packageRoot, "interface-contract.json");
  const decisionPath = resolve(packageRoot, "runtime/composed-continuation-decision.mjs");
  const adapterPath = resolve(packageRoot, "runtime/continuous-construction-adapter.mjs");
  const systemOntology = {
    schema_version: "cav2-are-continuous-construction-task-loop-system-ontology/v1",
    ontology_id: "CA2-ARE-C19-TASK-LOOP-SYSTEM-ONTOLOGY",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    enforcement_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    construction_inputs: sources,
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      projection_builder_path: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/continuous-construction-task-loop/scripts/build.ts",
      projection_builder_sha256: sha256(readFileSync(builderPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    implementation_contract: {
      project_ref: "CA2-PROJECT-AGENT-REASONING-ENGINE",
      product_capability_ref: "CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP",
      product_capability_sha256: sha256(readFileSync(capabilityPath)),
      business_ontology_ref: "CA2-ARE-C19-TASK-LOOP-BUSINESS-ONTOLOGY",
      business_ontology_sha256: sha256(readFileSync(businessPath)),
      interface_contract_sha256: sha256(readFileSync(interfacePath)),
      decision_implementation_sha256: sha256(readFileSync(decisionPath)),
      c19_adapter_sha256: sha256(readFileSync(adapterPath)),
      composition_policy: "C19-CONTINUE-and-ARE-direct-and-exact-first-pending-stage",
      live_proxy_integration: false,
      successor_execution_authorized: false,
      effect_authorized: false,
      authority_effect: "none",
      enforcement_effect: "none",
    },
    claim_limit: "Deterministic candidate L0 system read model only; no Product Capability adoption, profile or ontology admission, accepted implementation, live proxy integration, activation, publication, release, deployment, or external effect.",
  };
  const systemOntologyBytes = bytes(systemOntology);
  const receipt = {
    schema_version: "cav2-are-continuous-construction-task-loop-system-ontology-projection/v1",
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
    implementation_level: "L0-offline",
    live_proxy_integration: false,
    authority_effect: "none",
    enforcement_effect: "none",
    claim_limit: "Two-run deterministic candidate projection only; no admission, acceptance, installation, publication, release, deployment, or external effect.",
  };
  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": systemOntologyBytes,
    "system-ontology-receipt.json": bytes(receipt),
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

