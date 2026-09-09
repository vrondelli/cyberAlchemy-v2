import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import test from "node:test";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));

test("implementation DAG is acyclic and its human and machine views name the same nodes", () => {
  const dag = JSON.parse(readFileSync(new URL("../implementation-dag.json", import.meta.url), "utf8"));
  const markdown = readFileSync(new URL("../IMPLEMENTATION-DAG.md", import.meta.url), "utf8");
  const nodes = new Map(dag.nodes.map((node) => [node.id, node]));
  assert.equal(nodes.size, dag.nodes.length, "DAG node IDs must be unique");

  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    assert.equal(nodes.has(id), true, `unknown DAG node: ${id}`);
    assert.equal(visiting.has(id), false, `cycle detected at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of nodes.get(id).depends_on) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of nodes.keys()) visit(id);

  const markdownIds = new Set([...markdown.matchAll(/\bCAR-\d{3}\b/gu)].map((match) => match[0]));
  assert.deepEqual([...markdownIds].sort(), [...nodes.keys()].sort());
  assert.equal(dag.authority_effect, "none");
  assert.equal(packageRoot.endsWith("coding-agent-runtime/"), true);
});
