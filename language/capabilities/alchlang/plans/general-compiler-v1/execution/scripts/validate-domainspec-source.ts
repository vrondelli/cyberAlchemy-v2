import assert from "node:assert/strict";
import { resolve } from "node:path";
import { loadDomainSpecCompiler } from "../../implementation/src/domainspec-cli.ts";

const root = resolve(import.meta.dirname, "../..", "domainspec");
const compiler = await loadDomainSpecCompiler();
const { graph } = compiler.compileProject(root);
assert.equal(graph.project_id, "alchlang-general-compiler");
assert.equal(graph.nodes.length, 50);
assert.equal(graph.relationships.length, 42);
assert.equal(graph.authority_effect, "none");
const selectors = new Set(graph.nodes.map((node) => node.selector));
for (const edge of graph.relationships) {
  assert(selectors.has(`${edge.source.feature_id}:${edge.source.node_id}`));
  assert(selectors.has(`${edge.target.feature_id}:${edge.target.node_id}`));
}
const kinds = new Set(graph.nodes.map((node) => node.kind));
for (const required of ["Entity", "Value Object", "Operation", "Event", "State Machine", "Rule", "Query", "Calculation", "Mapping", "Policy"]) assert(kinds.has(required));
console.log(JSON.stringify({ status: "PASS", compiler: compiler.binding, project_id: graph.project_id, nodes: graph.nodes.length, relationships: graph.relationships.length, authority_effect: "none" }, null, 2));
