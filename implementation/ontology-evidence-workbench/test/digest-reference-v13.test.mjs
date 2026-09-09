import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const implementationRoot = resolve(testDirectory, "..");
const modulePath = resolve(
  implementationRoot,
  "upstream/overlay/packages/dashboard/src/oew/scene/relationReference.ts",
);
const {
  OEW_KNOWLEDGE_SCENE_V13,
  OEW_V13_RELATION_REFERENCE_PATHS,
  RelationReferenceError,
  admitKnowledgeScene,
  admitKnowledgeSceneV13,
  canonicalRelationJson,
  computeKnowledgeSceneRevisionV13,
  enumerateRelationReferenceSlotsV13,
  finalizeKnowledgeScene,
  finalizeKnowledgeSceneV13,
  resolveRelationRef,
} = await import(pathToFileURL(modulePath));

const digestA = "a".repeat(64);
const digestB = "b".repeat(64);
const clone = (value) => JSON.parse(JSON.stringify(value));
const relation = (id, evidence = id) => ({
  source_relation_id: id,
  source_node_id: "n1",
  target_node_id: "n2",
  exact_predicate: "depends_on",
  source_direction: "forward",
  presentation_family: "dependency",
  color_token: "edge.predicate.depends-on",
  pattern_token: "edge.pattern.solid",
  visible_label: "depends on",
  direction_label: "source depends on target",
  evidence_refs: [`evidence:${evidence}`],
  source_refs: [`relations/${id}.json`],
  mapping_loss: "exact",
  authority_effect: "none",
  source_digest: digestB,
});

const draft = () => ({
  schema_version: OEW_KNOWLEDGE_SCENE_V13,
  scene_id: "scene:test:v13",
  graph_digest: digestA,
  view_pack_id: "test.business",
  view_pack_digest: digestB,
  scope: "home",
  nodes: [{ source_node_id: "n1" }, { source_node_id: "n2" }],
  internal_relations: [],
  cut_relations: [relation("relation-a", "a"), relation("relation-b", "b")],
  clusters: [],
  portals: [
    {
      portal_id: "portal:other",
      destination_cluster_id: "other",
      constituents: [
        {
          relation_ref: { source_relation_id: "relation-a" },
          traversal_direction: "with-source",
        },
        {
          relation_ref: { source_relation_id: "relation-b" },
          traversal_direction: "against-source",
        },
      ],
    },
  ],
  path: {
    path_id: "path:one",
    hops: [
      {
        relation_ref: { source_relation_id: "relation-b" },
        traversal_direction: "against-source",
      },
    ],
  },
  legend: [],
  navigation_frame: {
    frame_id: "frame:test:v13",
    graph_digest: digestA,
    view_pack_id: "test.business",
    view_pack_digest: digestB,
    scope: "home",
    selected: {
      kind: "relation",
      relation_ref: { source_relation_id: "relation-a" },
    },
  },
  denominators: {
    source_nodes: 2,
    source_relations: 2,
    scene_nodes: 2,
    internal_relations: 0,
    cut_relations: 2,
    complete_index_rows: 4,
    filtered_index_rows: 4,
  },
  extension: { scene_digest: "semantic-extension-value" },
});

const legacyDraft = () => {
  const value = {
    ...draft(),
    schema_version: "oew.knowledge-scene.v1.2",
    portals: [],
    navigation_frame: {
    frame_id: "frame:test:v12",
    graph_digest: digestA,
    view_pack_id: "test.business",
    view_pack_digest: digestB,
    scope: "home",
      selected: { kind: "none" },
    },
  };
  delete value.path;
  return value;
};

const expectIssue = async (promise, issue) => {
  await assert.rejects(
    promise,
    (error) =>
      error instanceof RelationReferenceError &&
      error.issues.some(
        (observed) => observed === issue || observed.startsWith(`${issue}:`),
      ),
  );
};

const rebindRevisionCopies = async (scene) => {
  const revision = await computeKnowledgeSceneRevisionV13(scene);
  scene.scene_digest = revision;
  scene.navigation_frame.scene_digest = revision;
  scene.relation_index_receipt.scene_digest = revision;
  for (const slot of enumerateRelationReferenceSlotsV13(scene)) {
    slot.ref.scene_digest = revision;
  }
};

test("v1.3 schemas expose the same complete reference-slot witness as the runtime", async () => {
  const sceneSchema = JSON.parse(
    await readFile(
      resolve(implementationRoot, "contracts/knowledge-scene.v1.3.schema.json"),
      "utf8",
    ),
  );
  const relationSchema = JSON.parse(
    await readFile(
      resolve(implementationRoot, "contracts/relation-reference.v1.3.schema.json"),
      "utf8",
    ),
  );
  assert.equal(sceneSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.deepEqual(
    sceneSchema["x-oew-relation-reference-paths"],
    [...OEW_V13_RELATION_REFERENCE_PATHS],
  );
  assert.deepEqual(
    Object.keys(relationSchema.$defs.relationLocator.properties),
    ["source_relation_id"],
  );
  assert.deepEqual(
    Object.keys(relationSchema.$defs.relationRef.properties).sort(),
    ["scene_digest", "source_relation_id"],
  );
  assert.equal(sceneSchema.oneOf.length, 2);
});

test("finalizes portal, Path, and selection locators once without self-staleness", async () => {
  const scene = await finalizeKnowledgeSceneV13(draft());
  const admitted = await admitKnowledgeSceneV13(clone(scene));
  const slots = enumerateRelationReferenceSlotsV13(admitted);
  assert.equal(slots.length, 4);
  for (const { ref } of slots) {
    assert.equal(ref.scene_digest, admitted.scene_digest);
    assert.equal(resolveRelationRef(admitted, ref).status, "resolved");
  }
  assert.equal(Object.isFrozen(admitted), true);
  assert.equal(Object.keys(admitted).includes("relationFacetsById"), false);
});

test("serialize, parse, and admit preserves canonical bytes and revision", async () => {
  const scene = await finalizeKnowledgeSceneV13(draft());
  const serialized = canonicalRelationJson(scene);
  const admitted = await admitKnowledgeSceneV13(JSON.parse(serialized));
  assert.equal(canonicalRelationJson(admitted), serialized);
  assert.equal(await computeKnowledgeSceneRevisionV13(admitted), scene.scene_digest);
});

test("rejects any pre-bound draft instead of overwriting its reference", async () => {
  const value = draft();
  value.portals[0].constituents[0].relation_ref.scene_digest = "c".repeat(64);
  await expectIssue(finalizeKnowledgeSceneV13(value), "REFERENCE_ALREADY_BOUND");
});

test("semantic portal traversal tamper changes the scene revision", async () => {
  const scene = clone(await finalizeKnowledgeSceneV13(draft()));
  scene.portals[0].constituents[0].traversal_direction = "against-source";
  await expectIssue(admitKnowledgeSceneV13(scene), "SCENE_REVISION_MISMATCH");
});

test("typed reference digest tamper is rejected without changing the semantic basis", async () => {
  const scene = clone(await finalizeKnowledgeSceneV13(draft()));
  scene.portals[0].constituents[0].relation_ref.scene_digest = "b".repeat(64);
  await expectIssue(
    admitKnowledgeSceneV13(scene),
    "RELATION_REFERENCE_REVISION_MISMATCH",
  );
});

test("an arbitrary extension field named scene_digest remains hashed", async () => {
  const scene = clone(await finalizeKnowledgeSceneV13(draft()));
  scene.extension.scene_digest = "changed-semantic-value";
  await expectIssue(admitKnowledgeSceneV13(scene), "SCENE_REVISION_MISMATCH");
});

test("a missing exact relation ID is rejected even after all revision copies are rebound", async () => {
  const scene = clone(await finalizeKnowledgeSceneV13(draft()));
  scene.portals[0].constituents[0].relation_ref.source_relation_id =
    "relation-missing";
  await rebindRevisionCopies(scene);
  await expectIssue(admitKnowledgeSceneV13(scene), "RELATION_REFERENCE_MISSING");
});

test("duplicate IDs across relation partitions are rejected", async () => {
  const value = draft();
  value.internal_relations = [value.cut_relations[0]];
  await expectIssue(
    finalizeKnowledgeSceneV13(value),
    "RELATION_ID_COLLISION:relation-a",
  );
});

test("parallel same-tuple relations preserve exact identities", async () => {
  const scene = await finalizeKnowledgeSceneV13(draft());
  const portalIds = scene.portals[0].constituents.map(
    ({ relation_ref }) => relation_ref.source_relation_id,
  );
  assert.deepEqual(portalIds, ["relation-a", "relation-b"]);
  assert.equal(new Set(portalIds).size, 2);
});

test("a cross-scene bound reference is rejected", async () => {
  const first = clone(await finalizeKnowledgeSceneV13(draft()));
  const secondDraft = draft();
  secondDraft.scene_id = "scene:test:v13:second";
  const second = await finalizeKnowledgeSceneV13(secondDraft);
  first.portals[0].constituents[0].relation_ref =
    clone(second.portals[0].constituents[0].relation_ref);
  await expectIssue(
    admitKnowledgeSceneV13(first),
    "RELATION_REFERENCE_REVISION_MISMATCH",
  );
});

test("a relation selection without its required reference is malformed", async () => {
  const value = draft();
  delete value.navigation_frame.selected.relation_ref;
  await expectIssue(
    finalizeKnowledgeSceneV13(value),
    "RELATION_REFERENCE_INVALID:navigation_frame.selected.relation_ref",
  );
});

test("a relation_ref outside the schema-declared paths is rejected", async () => {
  const value = draft();
  value.extension.relation_ref = { source_relation_id: "relation-a" };
  await expectIssue(
    finalizeKnowledgeSceneV13(value),
    "RELATION_REFERENCE_UNDECLARED:extension.relation_ref",
  );
});

test("v1.2 remains supported while relabeling finalized bytes as v1.3 is rejected", async () => {
  const legacy = await finalizeKnowledgeScene(legacyDraft());
  const admittedLegacy = await admitKnowledgeScene(clone(legacy));
  assert.equal(admittedLegacy.schema_version, "oew.knowledge-scene.v1.2");

  const relabeled = clone(legacy);
  relabeled.schema_version = OEW_KNOWLEDGE_SCENE_V13;
  await expectIssue(
    admitKnowledgeSceneV13(relabeled),
    "SCENE_REVISION_MISMATCH",
  );
});

test("the v1.2 complete-scene digest reproduces the embedded-reference fixed-point hazard", async () => {
  const legacy = clone(await finalizeKnowledgeScene(legacyDraft()));
  legacy.portals = [
    {
      portal_id: "legacy-portal",
      constituents: [
        {
          relation_ref: {
            source_relation_id: "relation-a",
            scene_digest: legacy.scene_digest,
          },
          traversal_direction: "with-source",
        },
      ],
    },
  ];
  await expectIssue(admitKnowledgeScene(legacy), "SCENE_DIGEST_MISMATCH");
});
