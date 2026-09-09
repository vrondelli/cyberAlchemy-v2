import assert from "node:assert/strict";
import {dirname, resolve} from "node:path";
import {test} from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";

const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../upstream/overlay/packages/dashboard/src/oew",
);
const references = await import(pathToFileURL(resolve(root, "scene/relationReference.ts")));
const encodingApi = await import(pathToFileURL(resolve(root, "relationEncoding.ts")));
const geometryApi = await import(pathToFileURL(resolve(root, "scene/relationGeometry.ts")));
const presentationApi = await import(pathToFileURL(resolve(root, "relationPresentation.ts")));

const digest = "a".repeat(64);
const token = (index) => `edge.predicate.p${String(index).padStart(2, "0")}`;
const registryCandidate = () => {
  const predicateColorMap = {confirms: "edge.predicate.confirms"};
  const colorTokens = {
    "edge.predicate.confirms": {
      predicate: "confirms",
      dark: "#11aa77",
      dark_contrast: 7,
      light: "#117755",
      light_contrast: 7,
    },
  };
  for (let index = 1; index < 39; index += 1) {
    const predicate = `p${String(index).padStart(2, "0")}`;
    predicateColorMap[predicate] = token(index);
    colorTokens[token(index)] = {
      predicate,
      dark: `#${(index + 256).toString(16).padStart(6, "0")}`,
      dark_contrast: 7,
      light: `#${(index + 1024).toString(16).padStart(6, "0")}`,
      light_contrast: 7,
    };
  }
  return {
    authority_effect: "none",
    minimum_graphical_contrast: 4.5,
    predicateColorMap,
    colorTokens,
    presentationPatternMap: {workflow: "edge.pattern.solid"},
    patternTokens: {
      "edge.pattern.solid": {label: "solid directed", stroke_dasharray: "none"},
    },
  };
};

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
  scene_id: "scene:relation-projection",
  graph_digest: digest,
  internal_relations: [
    relation("parallel-a", "evidence:a"),
    relation("parallel-b", "evidence:b"),
  ],
  cut_relations: [],
  portals: [],
  path: {path_id: "path:none", hops: []},
  navigation_frame: {selected: {kind: "none"}},
});

const geometry = (scene) => ({
  schema_version: geometryApi.OEW_SCENE_GEOMETRY_SCHEMA,
  scene_digest: scene.scene_digest,
  layout_engine: "elk-layered",
  layout_version: "0.9.3",
  options_digest: "b".repeat(64),
  seed: 1,
  canonical_precision_px: 0.25,
  nodes: [],
  clusters: [],
  relations: [
    {
      source_relation_id: "parallel-a",
      sections: [[{x: 0, y: 0}, {x: 10, y: 10}]],
      label_box: {x: 4, y: 4, width: 2, height: 1},
      marker_endpoint: {x: 10, y: 10},
    },
    {
      source_relation_id: "parallel-b",
      sections: [[{x: 0, y: 2}, {x: 10, y: 12}]],
      label_box: {x: 4, y: 6, width: 2, height: 1},
      marker_endpoint: {x: 10, y: 12},
    },
  ],
});

const adapter = {
  resolveRelationRef: references.resolveRelationRef,
  computeRelationDigest: references.computeRelationDigest,
};

test("admits all 39 injective predicate colors and redundant pattern cues", () => {
  const registry = encodingApi.createRelationEncodingRegistry(registryCandidate());
  assert.equal(Object.keys(registry.predicateColorMap).length, 39);
  assert.equal(new Set(Object.values(registry.predicateColorMap)).size, 39);
  assert.equal(Object.isFrozen(registry), true);
});

test("joins exact reference, digest, encoding, and geometry without collapsing parallel tuples", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const registry = encodingApi.createRelationEncodingRegistry(registryCandidate());
  const geometryIndex = geometryApi.createRelationGeometryIndex(scene, geometry(scene));
  const projections = await presentationApi.deriveResolvedRelationPresentationSet({
    scene,
    adapter,
    encodingRegistry: registry,
    geometryIndex,
  });
  assert.deepEqual(Object.keys(projections), ["parallel-a", "parallel-b"]);
  assert.notEqual(projections["parallel-a"].relation_digest, projections["parallel-b"].relation_digest);
  assert.equal(projections["parallel-a"].predicate, "confirms");
  assert.equal(projections["parallel-a"].encoding.color_token, "edge.predicate.confirms");
  assert.match(projections["parallel-a"].accessible_text, /confirms; runner confirms track; solid directed/);
  assert.equal(projections["parallel-a"].geometry.source_relation_id, "parallel-a");
  assert.equal(Object.hasOwn(projections["parallel-a"].geometry, "exact_predicate"), false);
});

test("inspector and Full Index projections remain available without geometry", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const projection = await presentationApi.deriveResolvedRelationPresentation({
    scene,
    ref: {source_relation_id: "parallel-a", scene_digest: scene.scene_digest},
    adapter,
    encodingRegistry: registryCandidate(),
  });
  assert.equal(projection.geometry, null);
  assert.deepEqual(projection.endpoints, {
    source_node_id: "runner",
    target_node_id: "track",
  });
  assert.deepEqual(projection.evidence_refs, ["evidence:a"]);
});

test("rejects missing, colliding, and copied compatibility cues", async () => {
  const missing = registryCandidate();
  delete missing.predicateColorMap.confirms;
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  await assert.rejects(
    presentationApi.deriveResolvedRelationPresentation({
      scene,
      ref: {source_relation_id: "parallel-a", scene_digest: scene.scene_digest},
      adapter,
      encodingRegistry: missing,
    }),
    /PREDICATE_ENCODING_MISSING:confirms/,
  );

  const collision = registryCandidate();
  collision.predicateColorMap.p01 = "edge.predicate.confirms";
  assert.throws(
    () => encodingApi.createRelationEncodingRegistry(collision),
    /COLOR_TOKEN_COLLISION/,
  );

  const drift = structuredClone(scene);
  drift.internal_relations[0].color_token = "edge.predicate.wrong";
  const driftScene = await references.finalizeKnowledgeSceneV13((() => {
    const value = draft();
    value.internal_relations[0].color_token = "edge.predicate.wrong";
    return value;
  })());
  await assert.rejects(
    presentationApi.deriveResolvedRelationPresentation({
      scene: driftScene,
      ref: {source_relation_id: "parallel-a", scene_digest: driftScene.scene_digest},
      adapter,
      encodingRegistry: registryCandidate(),
    }),
    /COLOR_CUE_DRIFT:confirms/,
  );
});

test("geometry fails closed on stale, incomplete, duplicate, and semantic rows", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  const stale = geometry(scene);
  stale.scene_digest = "0".repeat(64);
  assert.throws(() => geometryApi.createRelationGeometryIndex(scene, stale), /GEOMETRY_SCENE_STALE/);

  const incomplete = geometry(scene);
  incomplete.relations.pop();
  assert.throws(() => geometryApi.createRelationGeometryIndex(scene, incomplete), /GEOMETRY_RELATION_MISSING:parallel-b/);

  const duplicate = geometry(scene);
  duplicate.relations[1].source_relation_id = "parallel-a";
  assert.throws(() => geometryApi.createRelationGeometryIndex(scene, duplicate), /GEOMETRY_RELATION_DUPLICATE:parallel-a/);

  const semantic = geometry(scene);
  semantic.relations[0].exact_predicate = "confirms";
  assert.throws(() => geometryApi.createRelationGeometryIndex(scene, semantic), /GEOMETRY_SEMANTICS_FORBIDDEN/);
});

test("stale and missing exact references never fall back to endpoint tuples", async () => {
  const scene = await references.finalizeKnowledgeSceneV13(draft());
  await assert.rejects(
    presentationApi.deriveResolvedRelationPresentation({
      scene,
      ref: {source_relation_id: "parallel-a", scene_digest: "0".repeat(64)},
      adapter,
      encodingRegistry: registryCandidate(),
    }),
    /RELATION_REFERENCE_STALE-SCENE/,
  );
  await assert.rejects(
    presentationApi.deriveResolvedRelationPresentation({
      scene,
      ref: {source_relation_id: "missing", scene_digest: scene.scene_digest},
      adapter,
      encodingRegistry: registryCandidate(),
    }),
    /RELATION_REFERENCE_MISSING/,
  );
});
