import assert from "node:assert/strict";
import {dirname, resolve} from "node:path";
import {test} from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";

const testRoot = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(testRoot, "../upstream/overlay/packages/dashboard/src/oew");
const references = await import(pathToFileURL(resolve(sourceRoot, "scene/relationReference.ts")));
const viewModels = await import(pathToFileURL(resolve(sourceRoot, "relationViewModels.ts")));
const digest = "a".repeat(64);
const relation = (id, evidence) => ({
  source_relation_id: id,
  source_node_id: "runner",
  target_node_id: "track",
  exact_predicate: "confirms",
  source_direction: "forward",
  presentation_family: "workflow",
  color_token: "edge.predicate.confirms",
  pattern_token: "edge.pattern.solid",
  visible_label: "confirms",
  direction_label: "runner confirms track",
  evidence_refs: [evidence],
  mapping_loss: "exact",
  authority_effect: "none",
});
const draft = () => ({
  schema_version: references.OEW_KNOWLEDGE_SCENE_V13,
  scene_id: "scene:consumer-sync",
  graph_digest: digest,
  internal_relations: [relation("parallel-a", "evidence:a"), relation("parallel-b", "evidence:b")],
  cut_relations: [],
  portals: [{
    portal_id: "portal:track",
    destination_cluster_id: "track",
    constituents: [{
      relation_ref: {source_relation_id: "parallel-a"},
      traversal_direction: "with-source",
    }],
  }],
  path: {
    path_id: "path:track",
    hops: [{
      relation_ref: {source_relation_id: "parallel-a"},
      traversal_direction: "with-source",
    }],
  },
  navigation_frame: {
    selected: {kind: "relation", relation_ref: {source_relation_id: "parallel-a"}},
  },
});
const adapter = {
  resolveRelationRef: references.resolveRelationRef,
  computeRelationDigest: references.computeRelationDigest,
};

test("graph, Portal, Path, inspector, and index projections share one exact binding", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const ref = scene.navigation_frame.selected.relation_ref;
  const graph = await viewModels.deriveRelationViewModel(scene, ref, adapter);
  const portal = await viewModels.derivePortalViewModel(scene, scene.portals[0], adapter);
  const path = await viewModels.derivePathViewModel(scene, scene.path, adapter);
  const inspector = await viewModels.deriveInspectorViewModel(scene, ref, adapter);
  const index = await viewModels.deriveIndexRelationRow(scene, ref, adapter);
  assert.equal(viewModels.assertRelationConsumersSynchronized([
    graph,
    portal.constituents[0].relation,
    path.hops[0].relation,
    inspector,
    index,
  ]), true);
  assert.equal(graph.predicate, "confirms");
  assert.deepEqual(graph.endpoints, {source_node_id: "runner", target_node_id: "track"});
  assert.equal(graph.traversal_phrase, "runner confirms track");
  assert.equal(graph.display_cues.color_token, "edge.predicate.confirms");
});

test("parallel same-tuple relations remain distinct by source relation ID", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const left = await viewModels.deriveRelationViewModel(scene, {
    source_relation_id: "parallel-a",
    scene_digest: scene.scene_digest,
  }, adapter);
  const right = await viewModels.deriveRelationViewModel(scene, {
    source_relation_id: "parallel-b",
    scene_digest: scene.scene_digest,
  }, adapter);
  assert.notEqual(left.ref.source_relation_id, right.ref.source_relation_id);
  assert.notEqual(left.relation_digest, right.relation_digest);
  assert.throws(
    () => viewModels.assertRelationConsumersSynchronized([left, right]),
    /CONSUMER_BINDING_DRIFT/,
  );
});

test("stale, missing, and copied semantic drift fail closed without tuple fallback", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  await assert.rejects(viewModels.deriveRelationViewModel(scene, {
    source_relation_id: "parallel-a",
    scene_digest: "0".repeat(64),
  }, adapter), /RELATION_REFERENCE_STALE-SCENE/);
  await assert.rejects(viewModels.deriveRelationViewModel(scene, {
    source_relation_id: "missing",
    scene_digest: scene.scene_digest,
  }, adapter), /RELATION_REFERENCE_MISSING/);
  await assert.rejects(viewModels.deriveRelationViewModel(
    scene,
    scene.navigation_frame.selected.relation_ref,
    adapter,
    {predicate: "owns"},
  ), /COPIED_FIELD_DRIFT:predicate/);
});

test("Portal and Path copied projections cannot drift from the exact facet", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const portal = structuredClone(scene.portals[0]);
  portal.constituents[0].relation_projection = {authority_effect: "promotion"};
  await assert.rejects(
    viewModels.derivePortalViewModel(scene, portal, adapter),
    /COPIED_FIELD_DRIFT:authority_effect/,
  );
  const path = structuredClone(scene.path);
  path.hops[0].relation_projection = {endpoints: {source_node_id: "track", target_node_id: "runner"}};
  await assert.rejects(
    viewModels.derivePathViewModel(scene, path, adapter),
    /COPIED_FIELD_DRIFT:endpoints/,
  );
});
