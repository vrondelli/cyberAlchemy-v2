import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { evaluateGrounding } from "../src/evaluator/grounding.mjs";
import { projectResearchLineage } from "../src/projection/research-lineage.mjs";

const url = new URL("../fixtures/cases/", import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, url), "utf8"));

async function example() {
  const descriptor = await read("poker-team-o13.v1.json");
  const graph = await read(descriptor.base_case);
  graph.edges.push(...descriptor.added_edges);
  return { descriptor, graph, groundingResult: evaluateGrounding(graph) };
}

test("projects the exact Poker Team lineage and visible conflict", async () => {
  const { descriptor, graph, groundingResult } = await example();
  assert.deepEqual(
    projectResearchLineage({ graph, groundingResult, policyResult: { disposition: "policy-pass" } }),
    descriptor.expected,
  );
});

for (const disposition of ["policy-fail", "policy-indeterminate"]) {
  test(`returns no projection for ${disposition}`, async () => {
    const { graph, groundingResult } = await example();
    assert.equal(projectResearchLineage({ graph, groundingResult, policyResult: { disposition } }), null);
  });
}

test("input order does not alter output", async () => {
  const { graph, groundingResult } = await example();
  const expected = projectResearchLineage({ graph, groundingResult, policyResult: { disposition: "policy-pass" } });
  graph.nodes.reverse();
  graph.edges.reverse();
  assert.equal(JSON.stringify(projectResearchLineage({ graph, groundingResult, policyResult: { disposition: "policy-pass" } })), JSON.stringify(expected));
});

test("projection contains no authority or promotion fields", async () => {
  const source = await readFile(new URL("../src/projection/research-lineage.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|writeFile|canonical_ontology|promotion|authority_effect:\s*"(?!none)/);
});
