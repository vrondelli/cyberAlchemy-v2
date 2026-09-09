import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sceneRoot = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene",
);
const sourceGraphModule = await import(pathToFileURL(resolve(sceneRoot, "sourceGraph.ts")));
const viewPackModule = await import(pathToFileURL(resolve(sceneRoot, "viewPack.ts")));
const { SceneQueryError, deriveScene } = await import(
  pathToFileURL(resolve(sceneRoot, "sceneQuery.ts"))
);

const digestA = "a".repeat(64);
const digestB = "b".repeat(64);
const node = (id) => ({
  source_node_id: id,
  label: `Node ${id}`,
  summary: `Summary ${id}`,
  node_kind: "business-concept",
  role: "entity",
  icon_token: "node.kind.business-concept",
  evidence_refs: [`nodes/${id}.json`],
  source_refs: [`nodes/${id}.json#/id`],
  authority_effect: "none",
  source_digest: digestA,
});
const relation = (id, sourceNodeId, targetNodeId) => ({
  source_relation_id: id,
  source_node_id: sourceNodeId,
  target_node_id: targetNodeId,
  exact_predicate: "depends_on",
  source_direction: "forward",
  presentation_family: "dependency",
  color_token: "edge.predicate.depends-on",
  pattern_token: "edge.pattern.solid",
  visible_label: "depends on",
  direction_label: "source depends on target",
  evidence_refs: [`relations/${id}.json`],
  source_refs: [`relations/${id}.json#/id`],
  mapping_loss: "exact",
  authority_effect: "none",
  source_digest: digestB,
});
const compileGraph = async (nodes, relations) => {
  const input = {
    schema_version: sourceGraphModule.OEW_SOURCE_GRAPH_SCHEMA,
    source_digests: { "fixture.json": digestA },
    nodes,
    relations,
  };
  return sourceGraphModule.compileSourceGraph({
    ...input,
    graph_digest: await sourceGraphModule.computeSourceGraphDigest(input),
  });
};
const cluster = (id, memberNodeIds) => ({
  id,
  label: `Cluster ${id}`,
  purpose: `Purpose ${id}`,
  icon_token: `cluster.${id}`,
  member_node_ids: memberNodeIds,
  source_refs: [`views.json#/${id}`],
});
const compilePack = async (graph, clusters, defaultClusterId = clusters[0].id) => {
  const input = {
    schema_version: viewPackModule.OEW_VIEW_PACK_SCHEMA,
    view_pack_id: "fixture.business",
    graph_digest: graph.graph_digest,
    role: "business",
    label: "Fixture",
    purpose: "Exercise semantic partitioning.",
    allowed_readings: ["Declared clusters bound visible nodes."],
    forbidden_readings: ["Layout infers membership."],
    membership_policy: "exactly-one-cluster-per-admitted-node",
    unassigned_policy: "reject",
    clusters,
    default_cluster_id: defaultClusterId,
    source_refs: ["views.json"],
    authority_effect: "none",
  };
  return viewPackModule.compileViewPack(graph, {
    ...input,
    view_pack_digest: await viewPackModule.computeViewPackDigest(input),
  });
};
const fixture = async () => {
  const graph = await compileGraph(
    ["a", "b", "c", "d", "e"].map(node),
    [
      relation("internal-b", "a", "b"),
      relation("internal-a", "a", "b"),
      relation("cut-out", "b", "d"),
      relation("cut-in", "e", "c"),
      relation("outside", "d", "e"),
    ],
  );
  const pack = await compilePack(graph, [
    cluster("alpha", ["a", "b", "c"]),
    cluster("beta", ["d", "e"]),
  ]);
  return { graph, pack };
};
const expectIssue = async (callback, issue) => {
  await assert.rejects(
    callback,
    (error) =>
      error instanceof SceneQueryError &&
      error.code === "OEW_SCENE_QUERY_REJECTED" &&
      error.issues.includes(issue),
  );
};

test("partitions every home-relevant relation exactly once and binds denominators", async () => {
  const { graph, pack } = await fixture();
  const scene = await deriveScene(graph, pack, { scope: "home" });
  assert.deepEqual(Object.keys(scene).sort(), [
    "clusters",
    "cut_relations",
    "denominators",
    "graph_digest",
    "internal_relations",
    "legend",
    "navigation_frame",
    "nodes",
    "portals",
    "relation_index_receipt",
    "scene_digest",
    "scene_id",
    "schema_version",
    "scope",
    "view_pack_digest",
    "view_pack_id",
  ]);
  assert.deepEqual(scene.nodes.map(({ source_node_id }) => source_node_id), ["a", "b", "c"]);
  assert.deepEqual(
    scene.internal_relations.map(({ source_relation_id }) => source_relation_id),
    ["internal-a", "internal-b"],
  );
  assert.deepEqual(
    scene.cut_relations.map(({ source_relation_id }) => source_relation_id),
    ["cut-in", "cut-out"],
  );
  const internalIds = scene.internal_relations.map(
    ({ source_relation_id }) => source_relation_id,
  );
  const cutIds = scene.cut_relations.map(({ source_relation_id }) => source_relation_id);
  assert.deepEqual([...internalIds, ...cutIds].sort(), [
    "cut-in",
    "cut-out",
    "internal-a",
    "internal-b",
  ]);
  assert.equal(internalIds.some((relationId) => cutIds.includes(relationId)), false);
  assert.deepEqual(scene.denominators, {
    source_nodes: 5,
    source_relations: 5,
    scene_nodes: 3,
    internal_relations: 2,
    cut_relations: 2,
    complete_index_rows: 10,
    filtered_index_rows: 10,
  });
  assert.equal(Object.isFrozen(scene), true);
  assert.equal(Object.isFrozen(scene.cut_relations[0].evidence_refs), true);
  assert.equal(scene.schema_version, "oew.knowledge-scene.v1.2");
  assert.equal(scene.navigation_frame.scene_digest, scene.scene_digest);
  assert.equal(scene.relation_index_receipt.scene_digest, scene.scene_digest);
  assert.deepEqual(scene.relation_index_receipt.relation_ids, [
    "cut-in",
    "cut-out",
    "internal-a",
    "internal-b",
  ]);
  assert.equal(scene.relation_index_receipt.relation_count, 4);
  assert.equal(Object.keys(scene).includes("relationFacetsById"), false);
  assert.equal(JSON.stringify(scene).includes("relationFacetsById"), false);
});

test("resolves focus through declared membership and preserves the boundary", async () => {
  const { graph, pack } = await fixture();
  const scene = await deriveScene(graph, pack, { scope: "focus", focus_node_id: "d" });
  assert.deepEqual(scene.nodes.map(({ source_node_id }) => source_node_id), ["d", "e"]);
  assert.deepEqual(
    scene.internal_relations.map(({ source_relation_id }) => source_relation_id),
    ["outside"],
  );
  assert.deepEqual(
    scene.cut_relations.map(({ source_relation_id }) => source_relation_id),
    ["cut-in", "cut-out"],
  );
  assert.equal(scene.navigation_frame.focus_node_id, "d");
  assert.equal(scene.clusters[0].cluster_id, "beta");
  const visible = new Set(scene.nodes.map(({ source_node_id }) => source_node_id));
  const destinationClusterIds = scene.cut_relations.map((relation) => {
    const outsideNodeId = visible.has(relation.source_node_id)
      ? relation.target_node_id
      : relation.source_node_id;
    return pack.cluster_id_by_node_id[outsideNodeId];
  });
  assert.deepEqual([...new Set(destinationClusterIds)].sort(), ["alpha"]);
});

test("preserves parallel relation identities in one partition", async () => {
  const { graph, pack } = await fixture();
  const scene = await deriveScene(graph, pack, { scope: "home" });
  assert.equal(scene.internal_relations.length, 2);
  assert.notEqual(
    scene.internal_relations[0].source_relation_id,
    scene.internal_relations[1].source_relation_id,
  );
  assert.equal(scene.internal_relations[0].source_node_id, "a");
  assert.equal(scene.internal_relations[1].source_node_id, "a");
});

test("rejects empty and unresolved scene boundaries", async () => {
  const { graph, pack } = await fixture();
  await expectIssue(
    () => deriveScene(graph, pack, { scope: "focus", focus_node_id: "missing" }),
    "SCENE_FOCUS_UNKNOWN:missing",
  );
  const emptyPack = {
    ...pack,
    cluster_by_id: { alpha: { ...pack.cluster_by_id.alpha, member_node_ids: [] } },
  };
  await expectIssue(
    () => deriveScene(graph, emptyPack, { scope: "home" }),
    "SCENE_EMPTY:alpha",
  );
});

test("enforces home node, internal-relation, and portal caps", async () => {
  const manyNodes = Array.from({ length: 25 }, (_, index) => node(`n-${index}`));
  const nodeGraph = await compileGraph(manyNodes, []);
  const nodePack = await compilePack(nodeGraph, [
    cluster("large", manyNodes.map(({ source_node_id }) => source_node_id)),
  ]);
  await expectIssue(
    () => deriveScene(nodeGraph, nodePack, { scope: "home" }),
    "SCENE_NODE_CAP_EXCEEDED:25:24",
  );

  const denseRelations = Array.from({ length: 49 }, (_, index) =>
    relation(`r-${String(index).padStart(2, "0")}`, "a", "b"),
  );
  const denseGraph = await compileGraph([node("a"), node("b")], denseRelations);
  const densePack = await compilePack(denseGraph, [cluster("dense", ["a", "b"])]);
  await expectIssue(
    () => deriveScene(denseGraph, densePack, { scope: "home" }),
    "SCENE_INTERNAL_RELATION_CAP_EXCEEDED:49:48",
  );

  const boundaryNodes = [node("center"), ...Array.from({ length: 13 }, (_, index) => node(`outside-${index}`))];
  const boundaryRelations = Array.from({ length: 13 }, (_, index) =>
    relation(`boundary-${index}`, "center", `outside-${index}`),
  );
  const boundaryGraph = await compileGraph(boundaryNodes, boundaryRelations);
  const boundaryPack = await compilePack(boundaryGraph, [
    cluster("center", ["center"]),
    ...Array.from({ length: 13 }, (_, index) =>
      cluster(`destination-${index}`, [`outside-${index}`]),
    ),
  ]);
  await expectIssue(
    () => deriveScene(boundaryGraph, boundaryPack, { scope: "home" }),
    "SCENE_PORTAL_CAP_EXCEEDED:13:12",
  );
});

test("rejects stale graph and View Pack revisions without inference", async () => {
  const { graph, pack } = await fixture();
  await expectIssue(
    () => deriveScene(graph, { ...pack, graph_digest: "f".repeat(64) }, { scope: "home" }),
    "SCENE_REVISION_MISMATCH",
  );
  await expectIssue(
    () => deriveScene(graph, pack, { scope: "path" }),
    "SCENE_SCOPE_UNSUPPORTED",
  );
});
