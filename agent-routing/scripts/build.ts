import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const layout = JSON.parse(execFileSync("python3", [resolve(scriptDir, "layout.py")], {
  encoding: "utf8", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
}));
function selectedPath(ref: string): string {
  if (!Object.hasOwn(layout.paths, ref)) throw new Error(`UNDECLARED_SOURCE:${ref}`);
  return layout.paths[ref];
}
const { buildMintedProjectViews } = await import(pathToFileURL(selectedPath(
  "projects/domainspec-v2/impl/tools/minted-project/views.ts"
)).href);
const runnerPackage = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));
const compilerPackage = JSON.parse(readFileSync(selectedPath("projects/domainspec-v2/impl/package.json"), "utf8"));
if (process.versions.node !== runnerPackage.engines.node || runnerPackage.engines.node !== compilerPackage.engines.node) {
  throw new Error("NODE_VERSION_BINDING_MISMATCH");
}
const tsxPackage = JSON.parse(readFileSync(resolve(packageRoot, "node_modules/tsx/package.json"), "utf8"));
if (tsxPackage.version !== runnerPackage.devDependencies.tsx || tsxPackage.version !== compilerPackage.devDependencies.tsx) {
  throw new Error("TSX_VERSION_BINDING_MISMATCH");
}
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

function verifySemanticBindings(): SemanticBinding[] {
  const nodePath = resolve(projectRoot, "nodes/cyberalchemy-route-resolution.json");
  const node = JSON.parse(readFileSync(nodePath, "utf8"));
  const bindings = node?.body?.semantic_bindings as SemanticBinding[];
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error("SEMANTIC_BINDINGS_MISSING");
  }
  for (const binding of bindings) {
    const path = selectedPath(binding.path);
    const selected = binding.scope_kind === "whole-file"
      ? readFileSync(path)
      : headingSection(path, String(binding.selector));
    const actual = sha256(selected);
    if (actual !== binding.sha256) {
      throw new Error(`SEMANTIC_BINDING_DRIFT:${binding.id}:${actual}`);
    }
  }
  return bindings;
}

function build() {
  const semanticBindings = verifySemanticBindings();
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "cyberalchemy-agent-routing-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) {
      throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
    }
  }

  const compilerPath = selectedPath("projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = selectedPath("projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const projectionBuilderPath = resolve(packageRoot, "scripts/build.ts");
  const routesPath = resolve(packageRoot, "routes.json");
  const validatorPath = resolve(packageRoot, "scripts/validate.py");
  const agentsPath = selectedPath(layout.root_instruction_ref);
  const sourceMapPath = selectedPath("cyberAlchemy-v2/SOURCE-MAP.md");
  const systemOntology = {
    schema_version: "cav2-agent-routing-system-ontology/v1",
    ontology_id: "cav2.agent-routing.system",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    construction_inputs: semanticBindings,
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      projection_builder_path: "cyberAlchemy-v2/agent-routing/scripts/build.ts",
      projection_builder_sha256: sha256(readFileSync(projectionBuilderPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    implementation_contract: {
      product_capability_ref: "CA2-CAP-ROUTE-REPOSITORY-WORK",
      route_registry_ref: "cyberAlchemy-v2/agent-routing/routes.json",
      route_registry_sha256: sha256(readFileSync(routesPath)),
      project_index_ref: "cyberAlchemy-v2/agent-routing/project-index.json",
      project_index_sha256: sha256(readFileSync(resolve(packageRoot, "project-index.json"))),
      project_lookup_ref: "cyberAlchemy-v2/agent-routing/scripts/locate.py",
      project_lookup_sha256: sha256(readFileSync(resolve(packageRoot, "scripts/locate.py"))),
      project_lookup_contract_ref: "cyberAlchemy-v2/agent-routing/PROJECT-LOOKUP.md",
      project_lookup_contract_sha256: sha256(readFileSync(resolve(packageRoot, "PROJECT-LOOKUP.md"))),
      construction_sources: Object.fromEntries([
        "DOMAINSPEC-CORE-INDEX.md", "scripts/layout.py", "package.json", "package-lock.json",
        "tests/test_domainspec_core_route.py", "tests/test_layout.py", "LAYOUT.md",
        "README.md", "ROUTER.md", "schemas/agent-router.schema.json",
        "tests/test_negative_mutations.py", "tests/test_project_lookup.py",
        "capabilities/are-cli/PLAN.md",
        "capabilities/are-cli/EVENT-BINDING.md",
        "capabilities/are-cli/GATEWAY-CONTINUITY.md",
        "capabilities/are-cli/NATIVE-GATEWAY.md",
        "../implementation/agent-reasoning-engine/src/hook-callback-bridge.mjs",
        "../implementation/agent-reasoning-engine/test/hook-callback-bridge.test.mjs",
        "../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend.mjs",
        "../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/gateway.test.mjs",
        "../implementation/agent-reasoning-engine/src/gateway-session-client.mjs",
        "../implementation/agent-reasoning-engine/test/gateway-session-client.test.mjs",
        "../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway-client.mjs",
        "../implementation/agent-reasoning-engine/src/hook-event-session.mjs",
        "../implementation/agent-reasoning-engine/test/hook-event-session.test.mjs",
        "capabilities/are-cli/NATIVE-HOST-TEST.md",
        "../implementation/agent-reasoning-engine/scripts/test-native-prompt-hook.mjs",
        "capabilities/are-cli/HOOKS.md",
        "../implementation/agent-reasoning-engine/src/prompt-hook.mjs",
        "../implementation/agent-reasoning-engine/bin/are-hook.mjs",
        "../implementation/agent-reasoning-engine/test/prompt-hook.test.mjs",
        "tests/test_are_cli.py",
        "../implementation/agent-reasoning-engine/product.json",
        "../implementation/agent-reasoning-engine/test/product.test.mjs",
        "capabilities/are-cli/README.md",
        "capabilities/are-cli/ontology.json",
        "capabilities/are-cli/request.schema.json",
        "capabilities/are-cli/result.schema.json",
        "capabilities/are-cli/route.example.json",
        "capabilities/are-cli/session-example.mjs",
        "../implementation/agent-reasoning-engine/src/decision-cli.mjs",
        "../implementation/agent-reasoning-engine/bin/are-decide.mjs",
        "../implementation/agent-reasoning-engine/bin/are.mjs",
        "../implementation/agent-reasoning-engine/test/decision-cli.test.mjs",
        "../implementation/agent-reasoning-engine/README.md",
        "../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json",
        "../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json",
      ].map(name => [name, sha256(readFileSync(resolve(packageRoot, name)))])),
      build_runtime: { node: process.versions.node, tsx: tsxPackage.version,
        compiler_package_ref: "projects/domainspec-v2/impl/package.json",
        compiler_package_sha256: sha256(readFileSync(selectedPath("projects/domainspec-v2/impl/package.json"))) },
      recent_context_sources: Object.fromEntries([
        "profile.json", "README.md", "definitions.json", "capability.json", "ontology.json",
        "recent-context.alch", "build.ts", "recent.py", "validate.py", "test_recent.py", "model.test.ts",
    "hooks.py", "test_hooks.py", "hooks-contract.json",
        "generated/build-receipt.json",
      ].map(name => [name, sha256(readFileSync(resolve(packageRoot, "capabilities/recent-context", name)))])),
      ontology_enforcement: "suspended-pending-governed-rust-binding",
      validator_ref: "cyberAlchemy-v2/agent-routing/scripts/validate.py",
      validator_sha256: sha256(readFileSync(validatorPath)),
      root_instruction_ref: layout.root_instruction_ref,
      checkout_layout: layout.mode,
      root_instruction_sha256: sha256(readFileSync(agentsPath)),
      source_map_ref: "cyberAlchemy-v2/SOURCE-MAP.md",
      source_map_sha256: sha256(readFileSync(sourceMapPath)),
      fallback_policy: "forbidden",
      accepted_baseline_required: true,
      authority_effect: "none",
    },
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "cav2-agent-routing-system-ontology-projection/v1",
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
    claim_limit: "Deterministic candidate router projection only; no profile or system-ontology admission, complete capability realization, conformance, publication, release, deployment, or external effect.",
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
