import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../../projects/domainspec-v2/impl/tools/minted-project/views";

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
      handle: "ontology-runtime-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of [
    "graphBytes",
    "sourceManifestBytes",
    "markdownBytes",
    "markdownViewBytes",
    "buildReceiptBytes",
  ] as const) {
    if (first[key] !== second[key]) {
      throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
    }
  }

  const compilerPath = resolve(
    packageRoot,
    "../../../projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
  );
  const viewsPath = resolve(
    packageRoot,
    "../../../projects/domainspec-v2/impl/tools/minted-project/views.ts",
  );
  const systemOntology = {
    schema_version: "cav2-ontology-runtime-system-ontology/v1",
    ontology_id: "cav2.system.ontology-runtime",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
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
    product_capability_ref: "CA2-CAP-MANAGE-ONTOLOGIES",
    business_ontology_ref: "CA2-ONTOLOGY-RUNTIME-MANAGEMENT",
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    runtime_contract: {
      implementation_target_ref: "cyberAlchemy-v2/implementation/ontology-runtime/runtime.py",
      permitted_operations: [
        "route-preflight",
        "catalog",
        "snapshot",
        "get-record",
        "validate",
        "validate-all",
        "reconcile-preflight",
        "stage-candidate",
        "get-candidate",
        "list-candidates",
        "verify-candidate",
      ],
      route_preflight: {
        selected_route_preserved: true,
        required_for_ontology_related_agent_requests: true,
        repeat_after_material_mutation: true,
        effect_authorized: false,
      },
      registration_mode: "explicit-local-registry-only",
      snapshot_identity: "sha256-canonical-json-v1",
      source_currentness: "selector-bound",
      native_validation: "verdict-preserving-wrapper",
      reconciliation: {
        admitted_epoch_mutation: "forbidden",
        candidate_identity: "sha256-canonical-manifest-and-captured-bytes-v1",
        candidate_posture: "non-active-non-authoritative",
        repeated_stage: "idempotent",
      },
      durable_epoch_store: {
        provider: "repository-local-filesystem-v1",
        root_ref: "durable-store/ontology-epochs",
        layout: "ontology-epoch-store/v1",
        publication: "write-temp-fsync-atomic-rename",
        mutable_pointers: "forbidden-in-this-capability-layer",
      },
      failure_behavior: "collect-all-and-block",
      writes: "durable-store/ontology-epochs-only",
      forbidden_writes: ["ontology-sources", "registry.json", "admitted-epochs"],
      network: "forbidden",
      authority_effect: "none",
    },
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "cav2-ontology-runtime-system-ontology-projection/v1",
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
    claim_limit: "Deterministic candidate projection only; no DomainSpec profile admission, system-ontology admission, implementation acceptance, conformance, publication, release, or deployment.",
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
  for (const [name, content] of Object.entries(artifacts)) {
    writeFileSync(resolve(generatedRoot, name), content, "utf8");
  }
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
