import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const modulePath = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene/relationReference.ts",
);
const {
  RelationReferenceError,
  admitKnowledgeScene,
  computeRelationDigest,
  finalizeKnowledgeScene,
  relationRef,
  resolveRelationRef,
} = await import(pathToFileURL(modulePath));

const digestA = "a".repeat(64);
const digestB = "b".repeat(64);

const relation = (id, evidence = id) => ({
  source_relation_id: id,
  source_node_id: "import-activities",
  target_node_id: "provider-accounts",
  exact_predicate: "consumes",
  source_direction: "forward",
  presentation_family: "dependency",
  color_token: "relation-consumes",
  pattern_token: "solid-arrow",
  visible_label: "consumes",
  direction_label: "from activity to account",
  evidence_refs: [`evidence:${evidence}`],
  source_refs: [`relations/${id}.json`],
  mapping_loss: "exact",
  authority_effect: "none",
  source_digest: digestB,
});

const draft = (internalRelations, cutRelations) => ({
  schema_version: "oew.knowledge-scene.v1.2",
  scene_id: "scene:test:home",
  graph_digest: digestA,
  view_pack_id: "test.business",
  view_pack_digest: digestB,
  scope: "home",
  nodes: [],
  internal_relations: internalRelations,
  cut_relations: cutRelations,
  clusters: [],
  portals: [],
  legend: [],
  navigation_frame: {
    frame_id: "frame:test:home",
    graph_digest: digestA,
    view_pack_id: "test.business",
    view_pack_digest: digestB,
    scope: "home",
    selected: { kind: "none" },
  },
  denominators: {
    source_nodes: 2,
    source_relations: internalRelations.length + cutRelations.length,
    scene_nodes: 2,
    internal_relations: internalRelations.length,
    cut_relations: cutRelations.length,
    complete_index_rows: 2 + internalRelations.length + cutRelations.length,
    filtered_index_rows: 2 + internalRelations.length + cutRelations.length,
  },
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const expectIssue = async (promise, issue) => {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof RelationReferenceError && error.issues.includes(issue),
  );
};

test("builds one immutable exact-object index and excludes it from serialization", async () => {
  const relationA = relation("relation-a");
  const relationB = relation("relation-b");
  const scene = await finalizeKnowledgeScene(draft([relationB], [relationA]));

  assert.deepEqual(scene.relation_index_receipt.relation_ids, [
    "relation-a",
    "relation-b",
  ]);
  assert.equal(scene.relation_index_receipt.relation_count, 2);
  assert.equal(scene.relationFacetsById.get("relation-a"), scene.cut_relations[0]);
  assert.equal(
    scene.relationFacetsById.get("relation-b"),
    scene.internal_relations[0],
  );
  assert.throws(
    () => scene.relationFacetsById.set("relation-c", relation("relation-c")),
    /RELATION_INDEX_IMMUTABLE/,
  );
  assert.equal(Object.keys(scene).includes("relationFacetsById"), false);
  assert.equal(JSON.stringify(scene).includes("relationFacetsById"), false);

  const admitted = await admitKnowledgeScene(clone(scene));
  assert.equal(
    admitted.relationFacetsById.get("relation-a"),
    admitted.cut_relations[0],
  );
  assert.equal(admitted.scene_digest, scene.scene_digest);
});

test("preserves parallel same-tuple relations and never falls back from a missing ID", async () => {
  const scene = await finalizeKnowledgeScene(
    draft([relation("relation-a", "a"), relation("relation-b", "b")], []),
  );
  const resolvedA = resolveRelationRef(scene, relationRef(scene, "relation-a"));
  const resolvedB = resolveRelationRef(scene, relationRef(scene, "relation-b"));
  assert.equal(resolvedA.status, "resolved");
  assert.equal(resolvedB.status, "resolved");
  assert.notEqual(
    await computeRelationDigest(resolvedA.facet),
    await computeRelationDigest(resolvedB.facet),
  );

  const missing = resolveRelationRef(scene, relationRef(scene, "relation-missing"));
  assert.deepEqual(missing, {
    status: "missing",
    ref: {
      source_relation_id: "relation-missing",
      scene_digest: scene.scene_digest,
    },
  });
});

test("returns a typed stale-scene result before index lookup", async () => {
  const scene = await finalizeKnowledgeScene(draft([relation("relation-a")], []));
  const staleRef = {
    source_relation_id: "relation-a",
    scene_digest: "0".repeat(64),
  };
  assert.deepEqual(resolveRelationRef(scene, staleRef), {
    status: "stale-scene",
    ref: staleRef,
    actual_scene_digest: scene.scene_digest,
  });
});

test("rejects duplicate IDs across the internal and cut union", async () => {
  const reused = relation("relation-a");
  await expectIssue(
    finalizeKnowledgeScene(draft([reused], [reused])),
    "RELATION_ID_COLLISION:relation-a",
  );
});

test("rejects noncanonical receipt order, bad count, and wrong-domain digest", async () => {
  const scene = await finalizeKnowledgeScene(
    draft([relation("relation-b")], [relation("relation-a")]),
  );

  const wrongOrder = clone(scene);
  wrongOrder.relation_index_receipt.relation_ids.reverse();
  await expectIssue(
    admitKnowledgeScene(wrongOrder),
    "RELATION_INDEX_ORDER_MISMATCH",
  );

  const badCount = clone(scene);
  badCount.relation_index_receipt.relation_count = 7;
  await expectIssue(
    admitKnowledgeScene(badCount),
    "RELATION_INDEX_COUNT_MISMATCH",
  );

  const wrongDomain = clone(scene);
  wrongDomain.relation_index_receipt.facet_set_digest = await computeRelationDigest(
    wrongDomain.internal_relations[0],
  );
  await expectIssue(
    admitKnowledgeScene(wrongDomain),
    "RELATION_INDEX_DIGEST_MISMATCH",
  );

  const staleNavigation = clone(scene);
  staleNavigation.navigation_frame.scene_digest = "0".repeat(64);
  await expectIssue(
    admitKnowledgeScene(staleNavigation),
    "NAVIGATION_SCENE_DIGEST_MISMATCH",
  );
});

test("rejects stale content and a supplied index that does not reuse partition objects", async () => {
  const scene = await finalizeKnowledgeScene(
    draft([relation("relation-a")], [relation("relation-b")]),
  );

  const staleContent = clone(scene);
  staleContent.internal_relations[0].exact_predicate = "owns";
  await expectIssue(admitKnowledgeScene(staleContent), "RELATION_INDEX_DIGEST_MISMATCH");

  const copiedIndex = new Map(
    [...scene.relationFacetsById].map(([relationId, facet]) => [
      relationId,
      { ...facet },
    ]),
  );
  await expectIssue(
    admitKnowledgeScene(scene, copiedIndex),
    "RELATION_INDEX_OBJECT_MISMATCH:relation-a",
  );

  const missingIndexRow = new Map([
    ["relation-a", scene.internal_relations[0]],
  ]);
  await expectIssue(
    admitKnowledgeScene(scene, missingIndexRow),
    "RELATION_INDEX_UNION_MISMATCH",
  );
});
