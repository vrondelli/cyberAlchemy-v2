import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = fileURLToPath(import.meta.url);
const root = resolve(dirname(script), "..");
const repo = resolve(root, "../../../../..");
const authored = resolve(root, "authored");
const generated = resolve(root, "generated");
const compiler = resolve(repo, "projects/domainspec-v2/impl/cli/src/input/project-model.ts");
const { loadCompiledProjectGraph } = await import(pathToFileURL(compiler).href) as {
  loadCompiledProjectGraph(root: string): any;
};
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const normalized = (value: any): any => Array.isArray(value)
  ? value.map(normalized)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]))
    : value;
const bytes = (value: any) => `${JSON.stringify(normalized(value), null, 2)}\n`;
const write = (name: string, value: any) => {
  mkdirSync(generated, { recursive: true });
  writeFileSync(resolve(generated, name), bytes(value));
};

const first = loadCompiledProjectGraph(authored);
const second = loadCompiledProjectGraph(authored);
const firstBytes = bytes(first);
const secondBytes = bytes(second);
if (firstBytes !== secondBytes) throw new Error("NON_DETERMINISTIC_DOMAIN_GRAPH");

const predecessors = JSON.parse(readFileSync(resolve(root, "PREDECESSORS.json"), "utf8"));
const all = first.nodes.map((node: any) => `system:${node.selector}`);
const byKind = (kinds: string[]) => first.nodes
  .filter((node: any) => kinds.includes(node.kind))
  .map((node: any) => `system:${node.selector}`);
const systemOntology = {
  schema_version: "cav2.essays.agent-runtime.generated-system-ontology/v1-candidate",
  ontology_id: "cav2.essays.agent-runtime.system-runtime.v1",
  source_graph_sha256: hash(firstBytes),
  source_manifest_sha256: first.source_manifest.manifest_sha256,
  predecessor_digests: predecessors,
  system_nodes: first.nodes.map((node: any) => ({
    id: `system:${node.selector}`,
    kind: node.kind,
    meta_type_id: node.meta_type_id,
    body: node.body,
  })),
  relations: first.relationships.map((relation: any) => ({
    id: relation.edge_id,
    type: relation.relationship,
    source: `system:${relation.source.feature_id}:${relation.source.node_id}`,
    target: `system:${relation.target.feature_id}:${relation.target.node_id}`,
  })),
  views: [
    { view_id: "kernel-and-state-machine", node_ids: byKind(["Entity", "Rule", "Operation"]) },
    { view_id: "commands-events-and-receipts", node_ids: byKind(["Operation", "Event"]) },
    { view_id: "persistence-migrations-and-recovery", node_ids: byKind(["Entity", "Event"]) },
    { view_id: "desktop-cli-local-ipc-and-remote-protocol", node_ids: all },
    { view_id: "agent-and-wasm-extension-execution", node_ids: byKind(["Operation", "Rule"]) },
    { view_id: "browser-session-and-effect-supervision", node_ids: all.filter((id: string) => id.includes("browser") || id.includes("effect")) },
    { view_id: "identity-authorization-and-secrets", node_ids: all.filter((id: string) => id.includes("owner") || id.includes("principal") || id.includes("authorized")) },
    { view_id: "telemetry-audit-and-redaction", node_ids: byKind(["Event"]) },
    { view_id: "platform-process-and-deployment", node_ids: [] },
  ],
  residue: [
    "candidate implementation and local tests do not prove independent conformance",
    "live credentials, browser, WebAssembly, publication, and deployment remain unauthorized",
  ],
  authority_effect: "none",
};
const systemBytes = bytes(systemOntology);
write("domain.graph.json", first);
write("system-ontology.json", systemOntology);
write("compile-receipt.json", {
  schema_version: "cav2.essays.agent-runtime.domainspec-compile-receipt/v1",
  compile_count: 2,
  determinism_posture: "byte-identical-two-run-local",
  domainspec_compiler_path: "projects/domainspec-v2/impl/cli/src/input/project-model.ts",
  domainspec_compiler_sha256: hash(readFileSync(compiler)),
  source_manifest_sha256: first.source_manifest.manifest_sha256,
  compiled_graph_sha256: hash(firstBytes),
  second_compiled_graph_sha256: hash(secondBytes),
  system_ontology_sha256: hash(systemBytes),
  predecessor_digests: predecessors,
  authority_effect: "none",
  claim_ceiling: "Two byte-identical local compilations; no admission, implementation conformance, merge, release, deployment, or external-effect authority.",
});
process.stdout.write(`${JSON.stringify({
  result: "PASS",
  compile_count: 2,
  nodes: first.nodes.length,
  relations: first.relationships.length,
  graph_sha256: hash(firstBytes),
  system_ontology_sha256: hash(systemBytes),
  determinism: "byte-identical-two-run-local",
  authority_effect: "none",
}, null, 2)}\n`);
