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
const { deriveScene } = await import(pathToFileURL(resolve(sceneRoot, "sceneQuery.ts")));
const {
  admitKnowledgeScene,
  admitKnowledgeSceneV13,
  finalizeKnowledgeScene,
} = await import(
  pathToFileURL(resolve(sceneRoot, "relationReference.ts"))
);
const {
  migrateKnowledgeScene,
  migrateKnowledgeSceneV13,
  OEW_LEGACY_RELATION_FIELDS,
  OEW_SCENE_MIGRATION_RECEIPT_SCHEMA,
  OEW_SCENE_MIGRATION_V13_RECEIPT_SCHEMA,
  SceneMigrationError,
} = await import(pathToFileURL(resolve(sceneRoot, "sceneMigration.ts")));

const digestA = "a".repeat(64);
const digestB = "b".repeat(64);
const clone = (value) => JSON.parse(JSON.stringify(value));
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
const compileGraph = async () => {
  const input = {
    schema_version: sourceGraphModule.OEW_SOURCE_GRAPH_SCHEMA,
    source_digests: { "fixture.json": digestA },
    nodes: ["a", "b", "c", "d"].map(node),
    relations: [
      relation("internal", "a", "b"),
      relation("cut", "b", "c"),
      relation("outside", "c", "d"),
    ],
  };
  return sourceGraphModule.compileSourceGraph({
    ...input,
    graph_digest: await sourceGraphModule.computeSourceGraphDigest(input),
  });
};
const compilePack = async (graph, reverseClusterInput = false) => {
  const clusters = [
    {
      id: "alpha",
      label: "Alpha",
      purpose: "Migrated scene boundary.",
      icon_token: "cluster.alpha",
      member_node_ids: ["a", "b"],
      source_refs: ["views.json#/alpha"],
    },
    {
      id: "beta",
      label: "Beta",
      purpose: "Outside the migrated scene.",
      icon_token: "cluster.beta",
      member_node_ids: ["c", "d"],
      source_refs: ["views.json#/beta"],
    },
  ];
  if (reverseClusterInput) clusters.reverse();
  const input = {
    schema_version: viewPackModule.OEW_VIEW_PACK_SCHEMA,
    view_pack_id: "fixture.business",
    graph_digest: graph.graph_digest,
    role: "business",
    label: "Fixture",
    purpose: "Exercise source-bound scene migration.",
    allowed_readings: ["Legacy scenes remain evidence, not authority."],
    forbidden_readings: ["A legacy scene certifies its own migration."],
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
const asLegacy = (scene, schemaVersion) => {
  const legacy = clone(scene);
  legacy.schema_version = schemaVersion;
  delete legacy.scene_digest;
  delete legacy.relation_index_receipt;
  delete legacy.navigation_frame.scene_digest;
  for (const binding of [...legacy.internal_relations, ...legacy.cut_relations]) {
    delete binding.source_refs;
    delete binding.source_digest;
  }
  return legacy;
};
const fixture = async (schemaVersion = "oew.knowledge-scene.v1.1") => {
  const graph = await compileGraph();
  const pack = await compilePack(graph);
  const current = await deriveScene(graph, pack, { scope: "home" });
  return { graph, pack, legacy: asLegacy(current, schemaVersion) };
};
const v12Fixture = async () => {
  const graph = await compileGraph();
  const pack = await compilePack(graph);
  const scene = await deriveScene(graph, pack, { scope: "home" });
  return { graph, pack, scene };
};
const rebuildV12 = async (scene, changes) => {
  const draft = clone(scene);
  delete draft.scene_digest;
  delete draft.relation_index_receipt;
  delete draft.navigation_frame.scene_digest;
  return finalizeKnowledgeScene({ ...draft, ...changes });
};
const expectIssue = async (callback, issue) => {
  await assert.rejects(
    callback,
    (error) =>
      error instanceof SceneMigrationError &&
      error.code === "OEW_SCENE_MIGRATION_REJECTED" &&
      error.issues.includes(issue),
  );
};

for (const schemaVersion of [
  "oew.knowledge-scene.v1",
  "oew.knowledge-scene.v1.1",
]) {
  test(`migrates an exact source-bound ${schemaVersion} scene without changing it`, async () => {
    const { graph, pack, legacy } = await fixture(schemaVersion);
    const before = JSON.stringify(legacy);
    const result = await migrateKnowledgeScene(legacy, graph, pack);
    const replay = await migrateKnowledgeScene(legacy, graph, pack);

    assert.equal(JSON.stringify(legacy), before);
    assert.equal(Object.isFrozen(legacy), false);
    assert.equal(legacy.schema_version, schemaVersion);
    assert.equal(result.scene.schema_version, "oew.knowledge-scene.v1.2");
    assert.notEqual(result.scene.scene_id, legacy.scene_id);
    assert.equal(result.scene.scene_digest, replay.scene.scene_digest);
    assert.deepEqual(result.receipt, replay.receipt);
    assert.equal(result.receipt.schema_version, OEW_SCENE_MIGRATION_RECEIPT_SCHEMA);
    assert.equal(result.receipt.legacy_schema_version, schemaVersion);
    assert.equal(result.receipt.migrated_scene_digest, result.scene.scene_digest);
    assert.equal(result.receipt.authority_effect, "none");
    assert.equal(result.receipt.legacy_artifact_mutated, false);
    assert.deepEqual(
      result.receipt.compared_relation_fields,
      OEW_LEGACY_RELATION_FIELDS,
    );
    assert.equal(
      result.scene.relationFacetsById.get("internal"),
      graph.relation_by_id.internal,
    );
    assert.equal(result.scene.relationFacetsById.get("cut"), graph.relation_by_id.cut);
    assert.equal(result.scene.relationFacetsById.has("outside"), false);
    assert.equal(result.scene.relationFacetsById.get("internal").color_token,
      legacy.internal_relations[0].color_token);
    await admitKnowledgeScene(clone(result.scene));
  });
}

test("rejects graph, ViewPack, and legacy schema identity mismatches", async () => {
  const { graph, pack, legacy } = await fixture();

  const wrongGraph = clone(legacy);
  wrongGraph.graph_digest = "0".repeat(64);
  await expectIssue(
    migrateKnowledgeScene(wrongGraph, graph, pack),
    "MIGRATION_SOURCE_MISMATCH",
  );

  const wrongPack = clone(legacy);
  wrongPack.view_pack_digest = "0".repeat(64);
  await expectIssue(
    migrateKnowledgeScene(wrongPack, graph, pack),
    "MIGRATION_VIEW_PACK_MISMATCH",
  );

  const wrongSchema = clone(legacy);
  wrongSchema.schema_version = "oew.knowledge-scene.v1.2";
  await expectIssue(
    migrateKnowledgeScene(wrongSchema, graph, pack),
    "MIGRATION_LEGACY_SCHEMA_UNSUPPORTED",
  );
});

test("accepts an admitted ViewPack compiled from noncanonical cluster input order", async () => {
  const graph = await compileGraph();
  const pack = await compilePack(graph, true);
  const current = await deriveScene(graph, pack, { scope: "home" });
  const legacy = asLegacy(current, "oew.knowledge-scene.v1.1");
  const result = await migrateKnowledgeScene(legacy, graph, pack);
  assert.equal(result.receipt.view_pack_digest, pack.view_pack_digest);
  assert.equal(result.scene.view_pack_digest, pack.view_pack_digest);
});

test("rejects predicate, endpoint, cue, evidence, mapping, and authority drift", async (t) => {
  const cases = [
    ["exact_predicate", "owns"],
    ["target_node_id", "c"],
    ["color_token", "edge.predicate.owns"],
    ["pattern_token", "edge.pattern.dashed"],
    ["evidence_refs", ["relations/drifted.json"]],
    ["mapping_loss", "lossy"],
    ["authority_effect", "write"],
  ];
  for (const [field, value] of cases) {
    await t.test(field, async () => {
      const { graph, pack, legacy } = await fixture();
      legacy.internal_relations[0][field] = value;
      await expectIssue(
        migrateKnowledgeScene(legacy, graph, pack),
        `MIGRATION_BINDING_DRIFT:internal:${field}`,
      );
    });
  }
});

test("rejects missing, extra, duplicate, and wrong-partition bindings", async () => {
  const missing = await fixture();
  missing.legacy.cut_relations = [];
  await expectIssue(
    migrateKnowledgeScene(missing.legacy, missing.graph, missing.pack),
    "MIGRATION_RELATION_PARTITION_MISSING:cut",
  );

  const extra = await fixture();
  extra.legacy.cut_relations.push(
    Object.fromEntries(
      OEW_LEGACY_RELATION_FIELDS.map((field) => [
        field,
        clone(extra.graph.relation_by_id.outside[field]),
      ]),
    ),
  );
  await expectIssue(
    migrateKnowledgeScene(extra.legacy, extra.graph, extra.pack),
    "MIGRATION_RELATION_EXTRA:outside",
  );

  const duplicate = await fixture();
  duplicate.legacy.cut_relations.push(clone(duplicate.legacy.internal_relations[0]));
  await expectIssue(
    migrateKnowledgeScene(duplicate.legacy, duplicate.graph, duplicate.pack),
    "MIGRATION_RELATION_DUPLICATE:internal",
  );

  const wrongPartition = await fixture();
  wrongPartition.legacy.cut_relations.push(
    wrongPartition.legacy.internal_relations.shift(),
  );
  await expectIssue(
    migrateKnowledgeScene(
      wrongPartition.legacy,
      wrongPartition.graph,
      wrongPartition.pack,
    ),
    "MIGRATION_RELATION_PARTITION_MISMATCH:internal",
  );
});

test("rejects forged compiled SourceGraph and ViewPack inputs", async () => {
  const sourceForgery = await fixture();
  const forgedGraph = clone(sourceForgery.graph);
  forgedGraph.relations[0].exact_predicate = "owns";
  await expectIssue(
    migrateKnowledgeScene(sourceForgery.legacy, forgedGraph, sourceForgery.pack),
    "MIGRATION_SOURCE_GRAPH_DIGEST_MISMATCH",
  );

  const packForgery = await fixture();
  const forgedPack = clone(packForgery.pack);
  forgedPack.label = "Forged";
  await expectIssue(
    migrateKnowledgeScene(packForgery.legacy, packForgery.graph, forgedPack),
    "MIGRATION_VIEW_PACK_NOT_ADMITTED",
  );
});

test("rebuilds an exact admitted v1.2 scene with empty reference structures as deterministic v1.3", async () => {
  const { graph, pack, scene } = await v12Fixture();
  const before = JSON.stringify(scene);
  const result = await migrateKnowledgeSceneV13(scene, graph, pack);
  const replay = await migrateKnowledgeSceneV13(scene, graph, pack);

  assert.equal(JSON.stringify(scene), before);
  assert.equal(result.scene.schema_version, "oew.knowledge-scene.v1.3");
  assert.notEqual(result.scene.scene_id, scene.scene_id);
  assert.equal(result.scene.scene_digest, replay.scene.scene_digest);
  assert.deepEqual(result.receipt, replay.receipt);
  assert.equal(
    result.receipt.schema_version,
    OEW_SCENE_MIGRATION_V13_RECEIPT_SCHEMA,
  );
  assert.equal(result.receipt.behavior, "rebuild-empty-reference-structures");
  assert.equal(result.receipt.legacy_scene_digest, scene.scene_digest);
  assert.equal(result.receipt.migrated_scene_digest, result.scene.scene_digest);
  assert.equal(result.receipt.legacy_artifact_mutated, false);
  assert.equal(result.receipt.authority_effect, "none");
  await admitKnowledgeSceneV13(clone(result.scene));
});

test("rejects non-empty legacy portals instead of trusting embedded revisions", async () => {
  const { graph, pack, scene } = await v12Fixture();
  const legacy = await rebuildV12(scene, {
    portals: [
      {
        portal_id: "legacy-portal",
        constituents: [
          {
            relation_ref: {
              source_relation_id: "cut",
              scene_digest: scene.scene_digest,
            },
          },
        ],
      },
    ],
  });
  await expectIssue(
    migrateKnowledgeSceneV13(legacy, graph, pack),
    "LEGACY_SCENE_REBUILD_REQUIRED",
  );
});

test("rejects non-empty legacy Path hops without exact regeneration inputs", async () => {
  const { graph, pack, scene } = await v12Fixture();
  const legacy = await rebuildV12(scene, {
    path: {
      hops: [
        {
          relation_ref: {
            source_relation_id: "internal",
            scene_digest: scene.scene_digest,
          },
        },
      ],
    },
  });
  await expectIssue(
    migrateKnowledgeSceneV13(legacy, graph, pack),
    "LEGACY_SCENE_REBUILD_REQUIRED",
  );
});

test("rejects legacy relation selection without exact regeneration inputs", async () => {
  const { graph, pack, scene } = await v12Fixture();
  const navigationFrame = clone(scene.navigation_frame);
  delete navigationFrame.scene_digest;
  navigationFrame.selected = {
    kind: "relation",
    relation_ref: {
      source_relation_id: "internal",
      scene_digest: scene.scene_digest,
    },
  };
  const legacy = await rebuildV12(scene, { navigation_frame: navigationFrame });
  await expectIssue(
    migrateKnowledgeSceneV13(legacy, graph, pack),
    "LEGACY_SCENE_REBUILD_REQUIRED",
  );
});

test("rejects v1.2 relabeling and source semantic drift in v1.3 migration", async () => {
  const relabel = await v12Fixture();
  const relabeled = clone(relabel.scene);
  relabeled.schema_version = "oew.knowledge-scene.v1.3";
  await expectIssue(
    migrateKnowledgeSceneV13(relabeled, relabel.graph, relabel.pack),
    "MIGRATION_LEGACY_SCHEMA_UNSUPPORTED",
  );

  const drift = await v12Fixture();
  const forgedGraph = clone(drift.graph);
  forgedGraph.relations[0].exact_predicate = "owns";
  await expectIssue(
    migrateKnowledgeSceneV13(drift.scene, forgedGraph, drift.pack),
    "MIGRATION_SOURCE_GRAPH_DIGEST_MISMATCH",
  );
});
