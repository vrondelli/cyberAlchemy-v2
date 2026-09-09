import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sceneRoot = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene",
);
const sourceGraphModule = await import(
  pathToFileURL(resolve(sceneRoot, "sourceGraph.ts"))
);
const viewPackModule = await import(pathToFileURL(resolve(sceneRoot, "viewPack.ts")));
const relationReferenceModule = await import(
  pathToFileURL(resolve(sceneRoot, "relationReference.ts"))
);
const portalQueryModule = await import(
  pathToFileURL(resolve(sceneRoot, "portalQuery.ts"))
);
const sceneQueryModule = await import(
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
const relation = (
  id,
  sourceNodeId,
  targetNodeId,
  exactPredicate = "depends_on",
  sourceDirection = "forward",
  colorToken = "edge.predicate.depends-on",
) => ({
  source_relation_id: id,
  source_node_id: sourceNodeId,
  target_node_id: targetNodeId,
  exact_predicate: exactPredicate,
  source_direction: sourceDirection,
  presentation_family: "dependency",
  color_token: colorToken,
  pattern_token: "edge.pattern.solid",
  visible_label: exactPredicate.replaceAll("_", " "),
  direction_label: `${sourceNodeId} ${exactPredicate} ${targetNodeId}`,
  evidence_refs: [`relations/${id}.json`],
  source_refs: [`relations/${id}.json#/id`],
  mapping_loss: "exact",
  authority_effect: "none",
  source_digest: digestB,
});
const cluster = (id, memberNodeIds) => ({
  id,
  label: `Cluster ${id}`,
  purpose: `Purpose ${id}`,
  icon_token: `cluster.${id}`,
  member_node_ids: memberNodeIds,
  source_refs: [`views.json#/${id}`],
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
const compilePack = async (graph, clusters) => {
  const input = {
    schema_version: viewPackModule.OEW_VIEW_PACK_SCHEMA,
    view_pack_id: "fixture.business",
    graph_digest: graph.graph_digest,
    role: "business",
    label: "Fixture",
    purpose: "Exercise reference-first grouped portals.",
    allowed_readings: ["Declared clusters bind every portal destination."],
    forbidden_readings: ["Layout infers membership."],
    membership_policy: "exactly-one-cluster-per-admitted-node",
    unassigned_policy: "reject",
    clusters,
    default_cluster_id: "alpha",
    source_refs: ["views.json"],
    authority_effect: "none",
  };
  return viewPackModule.compileViewPack(graph, {
    ...input,
    view_pack_digest: await viewPackModule.computeViewPackDigest(input),
  });
};
const fixture = async (relations) => {
  const fixtureRelations = relations ?? [
    relation("internal", "a", "b", "owns"),
    relation("cut-forward", "a", "d", "depends_on"),
    relation("cut-reverse", "e", "b", "blocks", "reverse"),
    relation("cut-bidirectional", "c", "f", "relates_to", "bidirectional"),
    relation("parallel-a", "b", "d", "depends_on"),
    relation("parallel-b", "b", "d", "depends_on"),
    relation("outside", "d", "e", "owns"),
  ];
  const graph = await compileGraph(
    ["a", "b", "c", "d", "e", "f"].map(node),
    fixtureRelations,
  );
  const pack = await compilePack(graph, [
    cluster("alpha", ["a", "b", "c"]),
    cluster("beta", ["d", "e"]),
    cluster("gamma", ["f"]),
  ]);
  return { graph, pack };
};
const serialized = (value) => JSON.parse(JSON.stringify(value));
const toDraft = (scene) => {
  const draft = serialized(scene);
  delete draft.scene_digest;
  delete draft.relation_index_receipt;
  delete draft.navigation_frame.scene_digest;
  for (const portal of draft.portals) {
    for (const constituent of portal.constituents) {
      delete constituent.relation_ref.scene_digest;
    }
  }
  return draft;
};
const expectIssue = async (callback, issue) => {
  await assert.rejects(callback, (error) =>
    Array.isArray(error.issues) && error.issues.includes(issue),
  );
};

test("preserves the v1.2 scene API while exposing a separate v1.3 route", async () => {
  const { graph, pack } = await fixture();
  const legacy = await sceneQueryModule.deriveScene(graph, pack, { scope: "home" });
  assert.equal(legacy.schema_version, "oew.knowledge-scene.v1.2");
  assert.deepEqual(legacy.portals, []);

  const current = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  assert.equal(current.schema_version, "oew.knowledge-scene.v1.3");
  assert.equal(current.portals.length, 2);
});

test("groups every cut relation once with deterministic portal and constituent order", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  assert.deepEqual(scene.portals.map(({ portal_id }) => portal_id), [
    "portal:beta",
    "portal:gamma",
  ]);
  assert.deepEqual(
    scene.portals[0].constituents.map(({ relation_ref }) => relation_ref.source_relation_id),
    ["cut-forward", "cut-reverse", "parallel-a", "parallel-b"],
  );
  assert.deepEqual(
    scene.portals.flatMap(({ constituents }) =>
      constituents.map(({ relation_ref }) => relation_ref.source_relation_id),
    ).sort(),
    scene.cut_relations.map(({ source_relation_id }) => source_relation_id).sort(),
  );
  assert.equal(scene.portals[0].destination_cluster_icon_token, "cluster.beta");
  assert.equal(scene.portals[0].destination_cluster_label, "Cluster beta");
});

test("binds one revision to scene, receipt, navigation, and every constituent", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  assert.equal(scene.relation_index_receipt.scene_digest, scene.scene_digest);
  assert.equal(scene.navigation_frame.scene_digest, scene.scene_digest);
  for (const portal of scene.portals) {
    assert.match(portal.summary_digest, /^[a-f0-9]{64}$/);
    for (const constituent of portal.constituents) {
      assert.equal(constituent.relation_ref.scene_digest, scene.scene_digest);
      const resolution = relationReferenceModule.resolveRelationRef(
        scene,
        constituent.relation_ref,
      );
      assert.equal(resolution.status, "resolved");
      assert.equal(resolution.facet.exact_predicate, constituent.exact_predicate);
      assert.equal(resolution.facet.source_direction, constituent.source_direction);
    }
  }
});

test("derives stable summaries and keeps text and direction independent from color", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const beta = scene.portals[0];
  assert.deepEqual(beta.predicate_summary, [
    { exact_predicate: "depends_on", relation_count: 3 },
    { exact_predicate: "blocks", relation_count: 1 },
  ]);
  assert.equal(
    await portalQueryModule.computePortalSummaryDigest(beta),
    beta.summary_digest,
  );
  for (const constituent of beta.constituents) {
    assert.notEqual(constituent.visible_label, constituent.color_token);
    assert.notEqual(constituent.direction_label, constituent.color_token);
  }

  const firstFixture = await fixture([
    relation("color-cut", "a", "d", "depends_on", "forward", "edge.color.first"),
  ]);
  const secondFixture = await fixture([
    relation("color-cut", "a", "d", "depends_on", "forward", "edge.color.second"),
  ]);
  const firstScene = await sceneQueryModule.deriveSceneV13(
    firstFixture.graph,
    firstFixture.pack,
    { scope: "home" },
  );
  const secondScene = await sceneQueryModule.deriveSceneV13(
    secondFixture.graph,
    secondFixture.pack,
    { scope: "home" },
  );
  const firstConstituent = firstScene.portals[0].constituents[0];
  const secondConstituent = secondScene.portals[0].constituents[0];
  assert.equal(firstConstituent.visible_label, secondConstituent.visible_label);
  assert.equal(firstConstituent.direction_label, secondConstituent.direction_label);
  assert.notEqual(firstConstituent.color_token, secondConstituent.color_token);
});

test("computes traversal from semantic source direction", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const byId = Object.fromEntries(
    scene.portals.flatMap(({ constituents }) =>
      constituents.map((item) => [item.relation_ref.source_relation_id, item]),
    ),
  );
  assert.equal(byId["cut-forward"].traversal_direction, "with-source");
  assert.equal(byId["cut-reverse"].traversal_direction, "with-source");
  assert.equal(byId["cut-bidirectional"].traversal_direction, "either");
});

test("rejects an unresolved destination and portal cap overflow", async () => {
  const { graph, pack } = await fixture();
  const legacy = await sceneQueryModule.deriveScene(graph, pack, { scope: "home" });
  const visibleIds = legacy.nodes.map(({ source_node_id }) => source_node_id);
  const unresolvedPack = {
    ...pack,
    cluster_id_by_node_id: { ...pack.cluster_id_by_node_id, d: undefined },
  };
  await expectIssue(
    () => portalQueryModule.compilePortalDrafts(
      legacy.cut_relations,
      visibleIds,
      unresolvedPack,
      12,
    ),
    "PORTAL_DESTINATION_UNRESOLVED:d",
  );
  await expectIssue(
    () => portalQueryModule.compilePortalDrafts(
      legacy.cut_relations,
      visibleIds,
      pack,
      1,
    ),
    "PORTAL_CAP_EXCEEDED:2:1",
  );
});

test("rejects predicate summary drift after otherwise valid v1.3 finalization", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const draft = toDraft(scene);
  draft.portals[0].predicate_summary = [
    { exact_predicate: "fabricated", relation_count: 99 },
  ];
  const inconsistent = await relationReferenceModule.finalizeKnowledgeSceneV13(draft);
  await expectIssue(
    () => sceneQueryModule.admitPortalSceneV13(serialized(inconsistent)),
    "PORTAL_SUMMARY_DRIFT:portal:beta",
  );
});

test("rejects summary digest drift after otherwise valid v1.3 finalization", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const draft = toDraft(scene);
  draft.portals[0].summary_digest = "f".repeat(64);
  const inconsistent = await relationReferenceModule.finalizeKnowledgeSceneV13(draft);
  await expectIssue(
    () => sceneQueryModule.admitPortalSceneV13(serialized(inconsistent)),
    "PORTAL_SUMMARY_DIGEST_DRIFT:portal:beta",
  );
});

test("rejects missing and stale portal references", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const missingDraft = toDraft(scene);
  missingDraft.portals[0].constituents[0].relation_ref.source_relation_id = "missing";
  await expectIssue(
    () => relationReferenceModule.finalizeKnowledgeSceneV13(missingDraft),
    "RELATION_REFERENCE_MISSING:portals[0].constituents[0].relation_ref:missing",
  );

  const stale = serialized(scene);
  stale.portals[0].constituents[0].relation_ref.scene_digest = "f".repeat(64);
  await expectIssue(
    () => sceneQueryModule.admitPortalSceneV13(stale),
    "RELATION_REFERENCE_REVISION_MISMATCH:portals[0].constituents[0].relation_ref",
  );
});

test("rejects parallel-relation collapse and local facet drift", async () => {
  const { graph, pack } = await fixture();
  const scene = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });

  const collapsedDraft = toDraft(scene);
  collapsedDraft.portals[0].constituents = collapsedDraft.portals[0].constituents.filter(
    ({ relation_ref }) => relation_ref.source_relation_id !== "parallel-b",
  );
  collapsedDraft.portals[0].constituent_count -= 1;
  collapsedDraft.portals[0].predicate_summary = [
    { exact_predicate: "depends_on", relation_count: 2 },
    { exact_predicate: "blocks", relation_count: 1 },
  ];
  collapsedDraft.portals[0].summary_digest =
    await portalQueryModule.computePortalSummaryDigest(collapsedDraft.portals[0]);
  const collapsed = await relationReferenceModule.finalizeKnowledgeSceneV13(
    collapsedDraft,
  );
  await expectIssue(
    () => sceneQueryModule.admitPortalSceneV13(serialized(collapsed)),
    "PORTAL_CUT_PARTITION_NOT_TOTAL",
  );

  const driftDraft = toDraft(scene);
  driftDraft.portals[0].constituents[0].exact_predicate = "fabricated";
  driftDraft.portals[0].predicate_summary = [
    { exact_predicate: "depends_on", relation_count: 2 },
    { exact_predicate: "blocks", relation_count: 1 },
    { exact_predicate: "fabricated", relation_count: 1 },
  ];
  driftDraft.portals[0].summary_digest =
    await portalQueryModule.computePortalSummaryDigest(driftDraft.portals[0]);
  const drifted = await relationReferenceModule.finalizeKnowledgeSceneV13(driftDraft);
  await expectIssue(
    () => sceneQueryModule.admitPortalSceneV13(serialized(drifted)),
    "PORTAL_RELATION_FACET_DRIFT:cut-forward",
  );
});

test("is byte-deterministic across repeated v1.3 derivation", async () => {
  const { graph, pack } = await fixture();
  const first = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  const second = await sceneQueryModule.deriveSceneV13(graph, pack, { scope: "home" });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.scene_digest, second.scene_digest);
});
