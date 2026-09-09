import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const digest = (domain, value) => createHash("sha256")
  .update(`${domain}\0${canonical(value)}`, "utf8")
  .digest("hex");

const relationDigest = (relation) => digest("oew/relation-binding/v1", relation);

const compileScene = ({ sourceGraphDigest, viewPackDigest, internal, cut }) => {
  const union = [...internal, ...cut];
  const ids = union.map((relation) => relation.source_relation_id).sort();
  assert.equal(new Set(ids).size, ids.length, "RELATION_ID_COLLISION");
  const facets = new Map(union.map((relation) => [relation.source_relation_id, relation]));
  const digestPairs = ids.map((id) => [id, relationDigest(facets.get(id))]);
  const basis = {
    source_graph_digest: sourceGraphDigest,
    relation_ids: ids,
    relation_count: ids.length,
    facet_set_digest: digest("oew/facet-set/v1", digestPairs),
    digest_profile: "oew.relation-digest.v1",
    canonicalization_version: "rfc8785",
    hash_algorithm: "sha256"
  };
  const content = {
    schema_version: "oew.knowledge-scene.v1.2",
    graph_digest: sourceGraphDigest,
    view_pack_digest: viewPackDigest,
    internal_relations: internal,
    cut_relations: cut
  };
  const sceneContentDigest = digest("oew/scene-content/v1.2", content);
  const sceneDigest = digest("oew/scene/v1.2", { scene_content_digest: sceneContentDigest, receipt_basis: basis });
  return Object.freeze({
    ...content,
    scene_digest: sceneDigest,
    relation_index_receipt: Object.freeze({ scene_digest: sceneDigest, ...basis }),
    relationFacetsById: facets
  });
};

const resolve = (scene, ref) => {
  if (scene.scene_digest !== ref.scene_digest) return { status: "stale-scene" };
  const facet = scene.relationFacetsById.get(ref.source_relation_id);
  return facet ? { status: "resolved", facet } : { status: "missing" };
};

const assertResolved = (scene, ref) => {
  const result = resolve(scene, ref);
  if (result.status !== "resolved") throw new Error(`RELATION_REFERENCE_${result.status.toUpperCase().replace("-", "_")}`);
  return result.facet;
};

const validateGeometry = (scene, geometry) => {
  assert.equal(geometry.scene_digest, scene.scene_digest, "RELATION_REVISION_STALE");
  for (const entry of geometry.relations) assertResolved(scene, entry.relation_ref);
};

const validateProjection = (scene, row) => {
  const facet = assertResolved(scene, row.relation_ref ?? row.ref);
  assert.equal(row.relation_digest, relationDigest(facet), "RELATION_SNAPSHOT_STALE");
};

const makeSnapshot = (scene, relation, context = "relation", traversal = undefined) => {
  const body = {
    snapshot_schema_version: "oew.relation-snapshot.v1",
    ref: { source_relation_id: relation.source_relation_id, scene_digest: scene.scene_digest },
    source_graph_digest: scene.graph_digest,
    relation_digest: relationDigest(relation),
    projection_context: context,
    source_node_id: relation.source_node_id,
    source_node_label: "Import Activities",
    target_node_id: relation.target_node_id,
    target_node_label: "Provider Accounts",
    exact_predicate: relation.exact_predicate,
    source_direction: relation.source_direction,
    source_direction_phrase: "Import Activities consumes Provider Accounts",
    ...(traversal ? { traversal_direction: traversal, traversal_phrase: "Travel against the source arrow" } : {}),
    visible_label: relation.visible_label,
    direction_label: relation.direction_label,
    color_token: null,
    pattern_token: null,
    evidence_refs: relation.evidence_refs,
    mapping_loss: relation.mapping_loss,
    authority_effect: relation.authority_effect,
    serializer_version: "toy.v1"
  };
  return { ...body, snapshot_digest: digest("oew/relation-snapshot/v1", body) };
};

const validateSnapshot = (scene, snapshot) => {
  const { snapshot_digest: stored, ...body } = snapshot;
  assert.equal(stored, digest("oew/relation-snapshot/v1", body), "RELATION_SNAPSHOT_STALE");
  validateProjection(scene, snapshot);
  if (["portal", "path"].includes(snapshot.projection_context)) {
    assert.ok(snapshot.traversal_direction && snapshot.traversal_phrase, "TRAVERSAL_FALLBACK_MISSING");
  }
  assert.ok(snapshot.source_node_label && snapshot.target_node_label && snapshot.exact_predicate && snapshot.source_direction_phrase);
};

const migrate = ({ legacyScene, sourceGraph, viewPackDigest }) => {
  assert.equal(legacyScene.graph_digest, sourceGraph.digest, "MIGRATION_SOURCE_MISMATCH");
  assert.equal(legacyScene.view_pack_digest, viewPackDigest, "MIGRATION_VIEW_PACK_MISMATCH");
  const canonicalById = new Map(sourceGraph.relations.map((relation) => [relation.source_relation_id, relation]));
  for (const legacy of [...legacyScene.internal_relations, ...legacyScene.cut_relations]) {
    const source = canonicalById.get(legacy.source_relation_id);
    assert.ok(source, "MIGRATION_RELATION_MISSING");
    assert.equal(canonical(source), canonical(legacy), "MIGRATION_BINDING_DRIFT");
  }
  return compileScene({
    sourceGraphDigest: sourceGraph.digest,
    viewPackDigest,
    internal: legacyScene.internal_relations,
    cut: legacyScene.cut_relations
  });
};

const relationA = Object.freeze({
  source_relation_id: "rel-a",
  source_node_id: "import-activities",
  target_node_id: "provider-accounts",
  exact_predicate: "consumes",
  source_direction: "forward",
  presentation_family: "dependency",
  color_token: "relation-consumes",
  pattern_token: "solid-arrow",
  visible_label: "consumes",
  direction_label: "from activity to account",
  evidence_refs: ["evidence:a"],
  mapping_loss: "exact",
  authority_effect: "none"
});
const relationB = Object.freeze({ ...relationA, source_relation_id: "rel-b", evidence_refs: ["evidence:b"] });
const sourceGraphDigest = digest("toy/source-graph", [relationA, relationB]);
const viewPackDigest = digest("toy/view-pack", { id: "body-war-business" });
const scene = compileScene({ sourceGraphDigest, viewPackDigest, internal: [relationB], cut: [relationA] });
const reorderedScene = compileScene({ sourceGraphDigest, viewPackDigest, internal: [relationA], cut: [relationB] });
const refA = { source_relation_id: "rel-a", scene_digest: scene.scene_digest };
const refB = { source_relation_id: "rel-b", scene_digest: scene.scene_digest };

const checks = [];
const check = (id, run) => {
  run();
  checks.push({ id, status: "pass" });
};
const rejects = (id, expected, run) => check(id, () => assert.throws(run, new RegExp(expected)));

check("parallel-same-tuple-preserved", () => {
  assert.equal(scene.relationFacetsById.size, 2);
  assert.notEqual(relationDigest(assertResolved(scene, refA)), relationDigest(assertResolved(scene, refB)));
  assert.equal(scene.relationFacetsById.get("rel-a"), relationA);
});
check("portal-reverse-traversal-resolves-source-semantics", () => {
  const portal = { relation_ref: refA, traversal_direction: "against-source" };
  assert.equal(assertResolved(scene, portal.relation_ref).exact_predicate, "consumes");
  assert.equal(portal.traversal_direction, "against-source");
});
check("path-hop-shares-exact-reference", () => {
  const hop = { relation_ref: refB, from_node_id: "provider-accounts", to_node_id: "import-activities", traversal_direction: "against-source" };
  assert.equal(assertResolved(scene, hop.relation_ref).source_relation_id, "rel-b");
});
check("canonical-receipt-independent-of-partition-order", () => {
  assert.deepEqual(scene.relation_index_receipt.relation_ids, ["rel-a", "rel-b"]);
  assert.equal(scene.relation_index_receipt.facet_set_digest, reorderedScene.relation_index_receipt.facet_set_digest);
});
rejects("stale-scene-rejected", "RELATION_REFERENCE_STALE_SCENE", () => assertResolved(scene, { ...refA, scene_digest: "0".repeat(64) }));
rejects("missing-relation-rejected-without-tuple-fallback", "RELATION_REFERENCE_MISSING", () => assertResolved(scene, { source_relation_id: "rel-missing", scene_digest: scene.scene_digest }));
rejects("geometry-wrong-scene-rejected", "RELATION_REVISION_STALE", () => validateGeometry(scene, { scene_digest: "0".repeat(64), relations: [{ relation_ref: refA }] }));
rejects("view-model-drift-rejected", "RELATION_SNAPSHOT_STALE", () => validateProjection(scene, { relation_ref: refA, relation_digest: "0".repeat(64) }));
check("static-reverse-traversal-without-cues-is-self-contained", () => validateSnapshot(scene, makeSnapshot(scene, relationA, "portal", "against-source")));
rejects("static-snapshot-drift-rejected", "RELATION_SNAPSHOT_STALE", () => {
  const snapshot = makeSnapshot(scene, relationA, "relation");
  snapshot.visible_label = "owns";
  validateSnapshot(scene, snapshot);
});
check("same-id-cross-surface-synchronization", () => {
  const selected = refB;
  const geometry = { scene_digest: scene.scene_digest, relations: [{ relation_ref: selected }] };
  validateGeometry(scene, geometry);
  assert.equal(assertResolved(scene, selected).source_relation_id, "rel-b");
});
check("digest-domain-separation", () => assert.notEqual(
  digest("oew/relation-binding/v1", relationA),
  digest("oew/relation-snapshot/v1", relationA)
));
rejects("duplicate-id-rejected", "RELATION_ID_COLLISION", () => compileScene({ sourceGraphDigest, viewPackDigest, internal: [relationA], cut: [relationA] }));
check("source-bound-v1.1-migration", () => {
  const legacy = { graph_digest: sourceGraphDigest, view_pack_digest: viewPackDigest, internal_relations: [relationA], cut_relations: [relationB] };
  const migrated = migrate({ legacyScene: legacy, sourceGraph: { digest: sourceGraphDigest, relations: [relationA, relationB] }, viewPackDigest });
  assert.equal(migrated.schema_version, "oew.knowledge-scene.v1.2");
});
rejects("drifted-v1.1-migration-rejected", "MIGRATION_BINDING_DRIFT", () => {
  const drifted = { ...relationA, exact_predicate: "owns" };
  migrate({
    legacyScene: { graph_digest: sourceGraphDigest, view_pack_digest: viewPackDigest, internal_relations: [drifted], cut_relations: [relationB] },
    sourceGraph: { digest: sourceGraphDigest, relations: [relationA, relationB] },
    viewPackDigest
  });
});

process.stdout.write(`${JSON.stringify({
  schema_version: "oew.refine-toy-game.v1",
  status: "pass",
  checks_passed: checks.length,
  checks,
  claim_ceiling: "Conceptual model validation only; this does not execute OEW product code or prove browser behavior."
}, null, 2)}\n`);
