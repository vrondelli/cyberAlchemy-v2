import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { loadDomainSpecCompiler } from "../../implementation/src/domainspec-cli.ts";

const packageRoot = resolve(import.meta.dirname, "../..");
const dsRoot = join(packageRoot, "domainspec");
const generatedRoot = join(packageRoot, "generated");
const evidenceRoot = join(packageRoot, "evidence");
const compiler = await loadDomainSpecCompiler();
const sha256 = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const files = (root: string): string[] => readdirSync(root).sort().flatMap((name) => {
  const path = join(root, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});
const treeDigest = (root: string) => sha256(`${files(root).map((path) => `${relative(root, path)}:${sha256(readFileSync(path))}`).join("\n")}\n`);

function build() {
  const { graph: loaded } = compiler.compileProject(dsRoot);
  const graph = { ...loaded, project_root: "." };
  const graphBytes = jsonBytes(graph);
  const graphDigest = sha256(graphBytes);
  const systemOntology = {
    schema_version: "cav2.alchlang.general-compiler.system-ontology/v1-candidate",
    ontology_id: "cav2.alchlang.general-compiler.system",
    source_graph_sha256: graphDigest,
    system_nodes: graph.nodes.map((node) => ({ id: `system:${node.selector}`, role: node.kind, meta_type_id: node.meta_type_id, body: node.body })),
    relations: graph.relationships.map((edge) => ({ id: edge.edge_id, type: edge.relationship, source: `system:${edge.source.feature_id}:${edge.source.node_id}`, target: `system:${edge.target.feature_id}:${edge.target.node_id}` })),
    business_bindings: [
      { business_ref: "B-GC-CAPABILITY-COMPILE", system_ref: "system:general-compiler:compile-domain-model", type: "realized_by", status: "candidate" },
      { business_ref: "B-GC-POLICY-NO-NAME-INFERENCE", system_ref: "system:general-compiler:no-name-inference", type: "realized_by", status: "candidate" },
      { business_ref: "B-GC-POLICY-AUTHORITY-PRESERVATION", system_ref: "system:general-compiler:authority-preservation", type: "realized_by", status: "candidate" },
      { business_ref: "B-LRC-TEXTUAL-SOURCE", system_ref: "system:local-runtime-cli:textual-domain-source", type: "realized_by", status: "candidate" },
      { business_ref: "B-LRC-BUILD", system_ref: "system:local-runtime-cli:build-domain-artifacts", type: "realized_by", status: "candidate" },
      { business_ref: "B-LRC-EXECUTE", system_ref: "system:local-runtime-cli:execute-domain-action", type: "realized_by", status: "candidate" },
      { business_ref: "B-LRC-ADAPTER", system_ref: "system:local-runtime-cli:effect-adapter", type: "realized_by", status: "candidate" },
      { business_ref: "B-LRC-AUTHORITY", system_ref: "system:local-runtime-cli:explicit-local-authority", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-PATTERN", system_ref: "system:operation-pattern-registry:operation-pattern-registry", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-META-TYPE", system_ref: "system:operation-pattern-registry:availability-closure", type: "constrained_by", status: "candidate" }
      ,{ business_ref: "B-GOP-BINDING", system_ref: "system:operation-pattern-registry:availability-closure", type: "constrained_by", status: "candidate" }
      ,{ business_ref: "B-GOP-GENERATOR", system_ref: "system:operation-pattern-registry:register-operation-pattern", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-AVAILABILITY", system_ref: "system:operation-pattern-registry:availability-closure", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-STABILITY", system_ref: "system:operation-pattern-registry:owner-stability-decision", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-REGISTRY-COMPILER", system_ref: "system:operation-pattern-registry:compile-registry", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-EFFECT", system_ref: "system:operation-pattern-registry:explicit-effect-contract", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-PERFORMS", system_ref: "system:operation-pattern-registry:explicit-effect-contract", type: "constrained_by", status: "candidate" }
      ,{ business_ref: "B-GOP-OUTBOX-SQLITE", system_ref: "system:operation-pattern-registry:transactional-outbox-sqlite", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-RUNTIME-BINDING-RESOLVER", system_ref: "system:operation-pattern-registry:runtime-binding-resolver", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-SQLITE-EFFECT-RUNTIME", system_ref: "system:operation-pattern-registry:sqlite-effect-runtime", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-LOCAL-DISPATCHER", system_ref: "system:operation-pattern-registry:local-outbox-dispatcher", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-LEASE", system_ref: "system:operation-pattern-registry:dispatch-lease-policy", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-RETRY", system_ref: "system:operation-pattern-registry:retry-dead-letter-policy", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-HTTP", system_ref: "system:operation-pattern-registry:http-outbox-transport", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-INBOX", system_ref: "system:operation-pattern-registry:sqlite-inbox-consumer", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-MIGRATION", system_ref: "system:operation-pattern-registry:provider-schema-migration", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-GOP-TELEMETRY", system_ref: "system:operation-pattern-registry:outbox-runtime-observed", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-QUERY", system_ref: "system:typed-backend:typed-query", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-CALCULATION", system_ref: "system:typed-backend:typed-calculation", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-MAPPING", system_ref: "system:typed-backend:typed-mapping", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-POLICY", system_ref: "system:typed-backend:typed-policy", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-NO-EFFECT", system_ref: "system:typed-backend:typed-no-effect", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-SFOL-TERM", system_ref: "system:typed-backend:typed-calculation", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-SFOL-FORMULA", system_ref: "system:typed-backend:bounded-sfol-kernel", type: "realized_by", status: "candidate" }
      ,{ business_ref: "B-TB-INTEGRATION-BINDING", system_ref: "system:typed-backend:operational-realization-boundary", type: "constrained_by", status: "candidate" }
      ,{ business_ref: "B-TB-RUNTIME-PROVIDER", system_ref: "system:typed-backend:operational-realization-boundary", type: "constrained_by", status: "candidate" }
      ,{ business_ref: "B-TB-ORODI-EVIDENCE", system_ref: "system:typed-backend:operational-realization-boundary", type: "constrained_by", status: "candidate" }
    ],
    authority_effect: "none"
  };
  const ontologyBytes = jsonBytes(systemOntology);
  const traceability = {
    schema_version: "cav2.alchlang.general-compiler.traceability/v1-candidate",
    source_manifest_sha256: graph.source_manifest.manifest_sha256,
    compiled_graph_sha256: graphDigest,
    system_ontology_sha256: sha256(ontologyBytes),
    node_bindings: graph.nodes.map((node) => ({ source: node.selector, graph: node.selector, system: `system:${node.selector}` })),
    relation_bindings: graph.relationships.map((edge) => ({ source: edge.edge_id, graph: edge.edge_id, system: edge.edge_id })),
    authority_effect: "none"
  };
  return {
    "domain.graph.json": graphBytes,
    "system-ontology.json": ontologyBytes,
    "traceability.json": jsonBytes(traceability),
    sourceManifest: graph.source_manifest.manifest_sha256
  };
}

const first = build();
const second = build();
for (const name of ["domain.graph.json", "system-ontology.json", "traceability.json"] as const) assert.equal(first[name], second[name], `non-deterministic:${name}`);
if (process.argv.includes("--check")) {
  for (const name of ["domain.graph.json", "system-ontology.json", "traceability.json"] as const) assert.equal(readFileSync(join(generatedRoot, name), "utf8"), first[name], `drift:${name}`);
} else if (!process.argv.includes("--determinism")) {
  mkdirSync(generatedRoot, { recursive: true });
  mkdirSync(evidenceRoot, { recursive: true });
  for (const name of ["domain.graph.json", "system-ontology.json", "traceability.json"] as const) writeFileSync(join(generatedRoot, name), first[name]);
  const receipt = {
    schema_version: "cav2.alchlang.general-compiler.generation-receipt/v1-candidate",
    inputs: {
      domainspec_source_tree_sha256: treeDigest(dsRoot),
      domainspec_source_manifest_sha256: first.sourceManifest,
      domainspec_compiler: compiler.binding
    },
    outputs: Object.fromEntries((["domain.graph.json", "system-ontology.json", "traceability.json"] as const).map((name) => [name, sha256(first[name])])),
    deterministic_replay: "PASS",
    node_runtime: process.version,
    authority_effect: "none",
    claim_ceiling: "Generated candidate projections only; no admission, implementation conformance, release, deployment, or external effect."
  };
  writeFileSync(join(evidenceRoot, "generation-receipt.json"), jsonBytes(receipt));
}
console.log(JSON.stringify({ status: "PASS", compiler: compiler.binding, deterministic: true, source_manifest_sha256: first.sourceManifest, authority_effect: "none" }, null, 2));
