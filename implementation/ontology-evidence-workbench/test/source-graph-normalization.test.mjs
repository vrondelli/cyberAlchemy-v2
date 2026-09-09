import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene/sourceGraph.ts",
);
const source = await readFile(sourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const {
  OEW_SOURCE_GRAPH_SCHEMA,
  SourceGraphError,
  compileSourceGraph,
  computeSourceGraphDigest,
} = await import(moduleUrl);

const digestA = "a".repeat(64);
const digestB = "b".repeat(64);
const node = (id, changed = {}) => ({
  source_node_id: id,
  label: `Node ${id}`,
  summary: `Summary ${id}`,
  node_kind: "business-concept",
  role: "entity",
  icon_token: "node.kind.business-concept",
  evidence_refs: [`ontology/nodes/${id}.json`],
  source_refs: [`ontology/nodes/${id}.json#/concept_id`],
  authority_effect: "none",
  source_digest: id === "node-a" ? digestA : digestB,
  ...changed,
});
const relation = (id, sourceNode, targetNode, changed = {}) => ({
  source_relation_id: id,
  source_node_id: sourceNode,
  target_node_id: targetNode,
  exact_predicate: "depends_on",
  source_direction: "forward",
  presentation_family: "dependency",
  color_token: "edge.predicate.depends-on",
  pattern_token: "edge.pattern.solid",
  visible_label: "depends on",
  direction_label: "source depends on target",
  evidence_refs: [`ontology/relations/${id}.json`],
  source_refs: [`ontology/relations/${id}.json#/relation_id`],
  mapping_loss: "exact",
  authority_effect: "none",
  source_digest: id === "relation-a" ? digestA : digestB,
  ...changed,
});
const envelope = (changed = {}) => ({
  schema_version: OEW_SOURCE_GRAPH_SCHEMA,
  source_digests: {
    "ontology/nodes.json": digestA,
    "ontology/relations.json": digestB,
  },
  nodes: [node("node-b"), node("node-a")],
  relations: [
    relation("relation-b", "node-a", "node-b"),
    relation("relation-a", "node-a", "node-b"),
  ],
  ...changed,
});
const withDigest = async (value) => ({
  ...value,
  graph_digest: await computeSourceGraphDigest(value),
});
const expectIssue = async (value, issue) => {
  await assert.rejects(
    () => compileSourceGraph(value),
    (error) =>
      error instanceof SourceGraphError &&
      error.code === "OEW_SOURCE_GRAPH_REJECTED" &&
      error.issues.includes(issue),
  );
};

test("emits exact-ID maps, ID-sorted records, and a digest-bound source receipt", async () => {
  const input = await withDigest(envelope());
  const result = await compileSourceGraph(input);
  assert.deepEqual(
    result.nodes.map(({ source_node_id }) => source_node_id),
    ["node-a", "node-b"],
  );
  assert.deepEqual(
    result.relations.map(({ source_relation_id }) => source_relation_id),
    ["relation-a", "relation-b"],
  );
  assert.deepEqual(Object.keys(result.node_by_id), ["node-a", "node-b"]);
  assert.deepEqual(Object.keys(result.relation_by_id), ["relation-a", "relation-b"]);
  assert.deepEqual(result.receipt, {
    schema_version: "oew.source-graph-receipt.v1",
    result: "pass",
    source_schema_version: OEW_SOURCE_GRAPH_SCHEMA,
    graph_digest: input.graph_digest,
    source_digests: {
      "ontology/nodes.json": digestA,
      "ontology/relations.json": digestB,
    },
    canonicalization: "id-sorted-records@1.0.0",
    node_count: 2,
    relation_count: 2,
    node_ids: ["node-a", "node-b"],
    relation_ids: ["relation-a", "relation-b"],
    authority_effect: "none",
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.nodes[0].evidence_refs), true);
});

test("replays one canonical digest and byte-equivalent output across source record order", async () => {
  const first = envelope();
  const second = envelope({
    nodes: [...first.nodes].reverse(),
    relations: [...first.relations].reverse(),
  });
  const firstDigest = await computeSourceGraphDigest(first);
  const secondDigest = await computeSourceGraphDigest(second);
  assert.equal(firstDigest, secondDigest);
  assert.equal(
    JSON.stringify(await compileSourceGraph({ ...first, graph_digest: firstDigest })),
    JSON.stringify(await compileSourceGraph({ ...second, graph_digest: secondDigest })),
  );
});

test("preserves exact evidence, authority, source digests, endpoint order, and mapping status", async () => {
  const result = await compileSourceGraph(await withDigest(envelope()));
  assert.deepEqual(result.node_by_id["node-a"].evidence_refs, [
    "ontology/nodes/node-a.json",
  ]);
  assert.deepEqual(result.node_by_id["node-a"].source_refs, [
    "ontology/nodes/node-a.json#/concept_id",
  ]);
  assert.equal(result.node_by_id["node-a"].source_digest, digestA);
  assert.deepEqual(result.relation_by_id["relation-a"], {
    source_relation_id: "relation-a",
    source_node_id: "node-a",
    target_node_id: "node-b",
    exact_predicate: "depends_on",
    source_direction: "forward",
    presentation_family: "dependency",
    color_token: "edge.predicate.depends-on",
    pattern_token: "edge.pattern.solid",
    visible_label: "depends on",
    direction_label: "source depends on target",
    evidence_refs: ["ontology/relations/relation-a.json"],
    source_refs: ["ontology/relations/relation-a.json#/relation_id"],
    mapping_loss: "exact",
    authority_effect: "none",
    source_digest: digestA,
  });
});

test("preserves parallel relation identities instead of deduplicating endpoint and predicate tuples", async () => {
  const result = await compileSourceGraph(await withDigest(envelope()));
  assert.equal(result.relations.length, 2);
  assert.notEqual(
    result.relations[0].source_relation_id,
    result.relations[1].source_relation_id,
  );
  assert.equal(result.relations[0].source_node_id, result.relations[1].source_node_id);
  assert.equal(result.relations[0].target_node_id, result.relations[1].target_node_id);
  assert.equal(result.relations[0].exact_predicate, result.relations[1].exact_predicate);
});

test("rejects duplicate node and relation IDs after binding a current digest", async () => {
  const duplicateNode = envelope({
    nodes: [node("node-a"), node("node-a")],
  });
  await expectIssue(
    await withDigest(duplicateNode),
    "NODE_ID_DUPLICATE:node-a",
  );

  const duplicateRelation = envelope({
    relations: [
      relation("relation-a", "node-a", "node-b"),
      relation("relation-a", "node-a", "node-b"),
    ],
  });
  await expectIssue(
    await withDigest(duplicateRelation),
    "RELATION_ID_DUPLICATE:relation-a",
  );
});

test("canonicalizes correctly digested duplicate fixtures independently of input order", async () => {
  const first = envelope({
    nodes: [node("node-a", { label: "First" }), node("node-a", { label: "Second" })],
  });
  const second = { ...first, nodes: [...first.nodes].reverse() };
  assert.equal(
    await computeSourceGraphDigest(first),
    await computeSourceGraphDigest(second),
  );
});

test("rejects dangling source and target endpoints without rewriting direction", async () => {
  const dangling = envelope({
    relations: [
      relation("relation-source", "missing-source", "node-a"),
      relation("relation-target", "node-b", "missing-target"),
    ],
  });
  const input = await withDigest(dangling);
  await expectIssue(
    input,
    "RELATION_SOURCE_DANGLING:relation-source:missing-source",
  );
  await expectIssue(
    input,
    "RELATION_TARGET_DANGLING:relation-target:missing-target",
  );
});

test("rejects stale graph digests and unauthorized source bindings", async () => {
  await expectIssue(
    { ...(await withDigest(envelope())), graph_digest: "invalid" },
    "GRAPH_DIGEST_INVALID",
  );
  await expectIssue(
    { ...(await withDigest(envelope())), graph_digest: "0".repeat(64) },
    "GRAPH_DIGEST_MISMATCH",
  );
  const unauthorizedNode = envelope({
    nodes: [node("node-a", { authority_effect: "admit" }), node("node-b")],
  });
  await expectIssue(
    await withDigest(unauthorizedNode),
    "NODE_AUTHORITY_INVALID:node-a",
  );
  const unauthorizedRelation = envelope({
    relations: [
      relation("relation-a", "node-a", "node-b", { authority_effect: "blocked" }),
    ],
  });
  await expectIssue(
    await withDigest(unauthorizedRelation),
    "RELATION_AUTHORITY_INVALID:relation-a",
  );
});

test("rejects unsupported envelopes and lossy unknown fields", async () => {
  await expectIssue(
    await withDigest(envelope({ schema_version: "oew.source-graph-envelope.v2" })),
    "ENVELOPE_SCHEMA_UNSUPPORTED",
  );
  const unknownField = envelope({ unexpected: true });
  await expectIssue(await withDigest(unknownField), "ENVELOPE_SHAPE_INVALID");
});

test("retains case-distinct exact IDs and remains renderer-independent", async () => {
  const exactIds = envelope({
    nodes: [node("Node"), node("node")],
    relations: [relation("relation-a", "Node", "node")],
  });
  const result = await compileSourceGraph(await withDigest(exactIds));
  assert.deepEqual(result.receipt.node_ids, ["node", "Node"]);
  assert.doesNotMatch(source, /addEdge\s*\(/u);
  assert.doesNotMatch(source, /react[- ]?flow/iu);
  assert.doesNotMatch(source, /from\s+["'][^"']*(renderer|canvas|graph-surface)/iu);
});
