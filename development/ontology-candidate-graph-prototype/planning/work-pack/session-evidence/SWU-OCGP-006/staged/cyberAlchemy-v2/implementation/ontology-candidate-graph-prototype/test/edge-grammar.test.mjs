import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { validateCandidateCarrier } from "../src/contracts/candidate-v1.mjs";
import {
  evaluateEdgeGrammar,
  GRAMMAR_SOURCE_DIGESTS,
} from "../src/evaluator/edge-grammar.mjs";

const fixtureUrl = new URL("../fixtures/cases/", import.meta.url);

async function readJson(name) {
  return JSON.parse(await readFile(new URL(name, fixtureUrl), "utf8"));
}

function applyDescriptor(base, descriptor) {
  const graph = structuredClone(base);
  if (descriptor.mutation.operation === "add-edge") {
    graph.edges.push(descriptor.mutation.value);
  } else if (descriptor.mutation.operation === "replace-edge") {
    const index = graph.edges.findIndex(({ edge_id }) => edge_id === descriptor.mutation.edge_id);
    graph.edges[index] = descriptor.mutation.value;
  } else {
    throw new Error(`Unknown mutation operation ${descriptor.mutation.operation}`);
  }
  return graph;
}

function conflictEdge() {
  return {
    edge_id: "E5",
    source: "D2",
    predicate: "contradicts",
    target: "D1",
    evidence_refs: [
      "validation/poker-team/docs/features/financial-settlement/observability.md",
      "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
    ],
    authority_effect: "none",
  };
}

test("accepts the five Poker Team forward edges", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push(conflictEdge());
  assert.equal(validateCandidateCarrier(graph).accepted, true);
  assert.deepEqual(evaluateEdgeGrammar(graph), {
    grammar_version: "candidate-edge-grammar-v1",
    accepted_edge_ids: ["E1", "E2", "E3", "E4", "E5"],
    issues: [],
  });
});

for (const name of [
  "wrong-direction.v1.json",
  "session-claim-forbidden.v1.json",
  "session-evidence-forbidden.v1.json",
  "inverse-stored-forbidden.v1.json",
]) {
  test(`rejects the one-condition mutation ${name}`, async () => {
    const base = await readJson("carrier-minimal.v1.json");
    const descriptor = await readJson(name);
    const graph = applyDescriptor(base, descriptor);
    assert.equal(validateCandidateCarrier(graph).accepted, true);
    const result = evaluateEdgeGrammar(graph);
    assert.deepEqual(result.issues.map(({ code }) => code), [descriptor.expected_issue_code]);
  });
}

test("canonical result does not depend on edge insertion order", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push(conflictEdge());
  const forward = evaluateEdgeGrammar(graph);
  graph.edges.reverse();
  assert.equal(JSON.stringify(evaluateEdgeGrammar(graph)), JSON.stringify(forward));
});

test("enforces per-source cardinality", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push({
    edge_id: "E5",
    source: "R1",
    predicate: "derives-from",
    target: "D2",
    evidence_refs: ["validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts"],
    authority_effect: "none",
  });
  const result = evaluateEdgeGrammar(graph);
  assert.deepEqual(result.issues.map(({ code }) => code), ["EDGE_CARDINALITY_EXCEEDED"]);
});

test("rejects unknown predicates", async () => {
  const graph = await readJson("carrier-minimal.v1.json");
  graph.edges.push({
    ...conflictEdge(),
    predicate: "related-to",
  });
  const result = evaluateEdgeGrammar(graph);
  assert.deepEqual(result.issues.map(({ code }) => code), ["UNKNOWN_PREDICATE"]);
});

test("binds the finite table to the governed source digests", () => {
  assert.deepEqual(GRAMMAR_SOURCE_DIGESTS, {
    "cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml":
      "f3ed1ed8a6452b5b8c200eadf184b2bf937b919440c26dcfa726fa334752e0d1",
    "cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml":
      "500851b158e5c286a45ce50a99a7010e58ede6d7702cbf148c0f9db24a0224b8",
  });
});

test("edge grammar is pure and contains no traversal or writer", async () => {
  const source = await readFile(new URL("../src/evaluator/edge-grammar.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|writeFile|mkdir|rename|createWriteStream/);
  assert.doesNotMatch(source, /depth|breadth|reachable|cycle/);
});
