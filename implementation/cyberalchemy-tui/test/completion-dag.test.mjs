import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

test("completion DAG is acyclic and its human view names every node", () => {
  const graph = JSON.parse(readFileSync(resolve(import.meta.dirname, "../completion-dag.json"), "utf8"));
  const human = readFileSync(resolve(import.meta.dirname, "../COMPLETION-DAG.md"), "utf8");
  const ids = new Set(graph.nodes.map((node) => node.id));
  assert.equal(ids.size, graph.nodes.length);
  for (const node of graph.nodes) for (const dependency of node.depends_on) assert.equal(ids.has(dependency), true);
  const visiting = new Set(); const visited = new Set();
  function visit(id) { if (visiting.has(id)) throw new Error(`cycle:${id}`); if (visited.has(id)) return; visiting.add(id); const node = graph.nodes.find((item) => item.id === id); for (const dependency of node.depends_on) visit(dependency); visiting.delete(id); visited.add(id); }
  for (const id of ids) { visit(id); assert.match(human, new RegExp(`\\b${id}\\b`, "u")); }
  assert.equal(graph.authority_effect, "none");
});
