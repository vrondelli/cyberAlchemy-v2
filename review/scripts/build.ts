import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../projects/domainspec-v2/impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(packageRoot, "../..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

type SemanticBinding = {
  id: string;
  path: string;
  scope_kind: "whole-file" | "heading-section";
  selector: string | null;
  sha256: string;
};

function headingSection(path: string, selector: string): Buffer {
  const lines = readFileSync(path, "utf8").match(/.*(?:\r?\n|$)/g)?.filter(Boolean) ?? [];
  const start = lines.findIndex((line) => line.replace(/\r?\n$/, "") === selector);
  if (start < 0) throw new Error(`SEMANTIC_SELECTOR_NOT_FOUND:${selector}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      end = index;
      break;
    }
  }
  return Buffer.from(lines.slice(start, end).join(""));
}

function semanticBindings(): SemanticBinding[] {
  const path = resolve(projectRoot, "nodes/review-capability-workflow.json");
  const node = JSON.parse(readFileSync(path, "utf8"));
  const bindings = node?.body?.semantic_bindings as SemanticBinding[];
  if (!Array.isArray(bindings) || bindings.length !== 8) {
    throw new Error("SEMANTIC_BINDINGS_NOT_EXACT");
  }
  for (const binding of bindings) {
    const sourcePath = resolve(repositoryRoot, binding.path);
    const selected = binding.scope_kind === "whole-file"
      ? readFileSync(sourcePath)
      : headingSection(sourcePath, String(binding.selector));
    const actual = sha256(selected);
    if (actual !== binding.sha256) {
      throw new Error(`SEMANTIC_BINDING_DRIFT:${binding.id}:${actual}`);
    }
  }
  return bindings;
}

function build() {
  const constructionInputs = semanticBindings();
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "cyberalchemy-review-capabilities-development-explicit-v0.1",
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
  const decisionSkillPath = resolve(repositoryRoot, "arcanum/arcana/decision-gate/SKILL.md");
  const ladderSkillPath = resolve(repositoryRoot, "arcanum/transmutations/complexity-example-ladder/SKILL.md");
  const supportPath = resolve(packageRoot, "capabilities/support.json");
  const schemaPath = resolve(packageRoot, "schemas/review-capabilities.schema.json");
  const systemOntology = {
    schema_version: "cav2-review-capabilities-system-ontology/v1",
    ontology_id: "cav2.review-capabilities.system",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    construction_inputs: constructionInputs,
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      projection_builder_path: "cyberAlchemy-v2/review/scripts/build.ts",
      projection_builder_sha256: sha256(readFileSync(builderPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    implementation_contract: {
      product_capability_refs: [
        "CA2-CAP-RESOLVE-CONSEQUENTIAL-DECISIONS",
        "CA2-CAP-EXPLAIN-COMPLEXITY-WITHOUT-MEANING-DRIFT",
      ],
      support_ref: "cyberAlchemy-v2/review/capabilities/support.json",
      support_sha256: sha256(readFileSync(supportPath)),
      decision_gate_agent_capability_ref: "CA2-REF-ARC-DECISION-GATE",
      decision_gate_implementation_ref: "arcanum/arcana/decision-gate/SKILL.md",
      decision_gate_implementation_sha256: sha256(readFileSync(decisionSkillPath)),
      complexity_ladder_agent_capability_ref: "CA2-REF-ARC-COMPLEXITY-EXAMPLE-LADDER",
      complexity_ladder_implementation_ref: "arcanum/transmutations/complexity-example-ladder/SKILL.md",
      complexity_ladder_implementation_sha256: sha256(readFileSync(ladderSkillPath)),
      schema_ref: "cyberAlchemy-v2/review/schemas/review-capabilities.schema.json",
      schema_sha256: sha256(readFileSync(schemaPath)),
      accepted_baseline_required: true,
      authority_effect: "none",
    },
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "cav2-review-capabilities-system-ontology-projection/v1",
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
    claim_limit: "Deterministic candidate review-capability projection only; no Product Capability adoption, profile or system-ontology admission, realization conformance, human decision effect, publication, release, deployment, or external effect.",
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
