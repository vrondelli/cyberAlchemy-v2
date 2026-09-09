import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { evaluateEdgeGrammar } from "../src/evaluator/edge-grammar.mjs";
import { evaluateGrounding } from "../src/evaluator/grounding.mjs";

const fixtureUrl = new URL("../fixtures/cases/", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, fixtureUrl), "utf8"));

function conflictEdge() {
  return {
    edge_id: "E5",
    source: "D2",
    predicate: "contradicts",
    target: "D1",
    evidence_refs: ["synthetic:poker-team-o13"],
    authority_effect: "none",
  };
}

test("computes the exact Poker Team grounding closure", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push(conflictEdge());
  assert.deepEqual(evaluateEdgeGrammar(graph).issues, []);
  assert.deepEqual(evaluateGrounding(graph), {
    grounding_version: "candidate-grounding-v1",
    roots: {
      F1: {
        reachable_ids: ["D1", "R1"],
        paths: [["F1", "R1", "D1"]],
      },
    },
    issues: [],
  });
});

test("rejects a grounding cycle", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  const descriptor = await readJson("grounding-cycle.v1.json");
  graph.edges.push(descriptor.mutation.value);
  assert.deepEqual(evaluateEdgeGrammar(graph).issues, []);
  const result = evaluateGrounding(graph);
  assert.deepEqual(result.issues.map(({ code }) => code), [descriptor.expected_issue_code]);
  assert.deepEqual(result.roots, {});
});

test("input insertion order does not change canonical output", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  const expected = evaluateGrounding(graph);
  graph.edges.reverse();
  assert.equal(JSON.stringify(evaluateGrounding(graph)), JSON.stringify(expected));
});

test("contradiction remains outside grounding closure", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push(conflictEdge());
  const result = evaluateGrounding(graph);
  assert.doesNotMatch(JSON.stringify(result), /D2|E5|contradicts/);
});

test("grounding evaluator is pure and has no policy or writer", async () => {
  const source = await readFile(new URL("../src/evaluator/grounding.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|writeFile|mkdir|rename|policy-pass|policy-fail/);
});
