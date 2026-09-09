import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sceneRoot = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene",
);
const relationReferenceModule = await import(
  pathToFileURL(resolve(sceneRoot, "relationReference.ts"))
);
const pathQueryModule = await import(
  pathToFileURL(resolve(sceneRoot, "pathQuery.ts"))
);

const digest = "a".repeat(64);
const relation = (id, sourceNodeId, targetNodeId, sourceDirection = "forward") => ({
  source_relation_id: id,
  source_node_id: sourceNodeId,
  target_node_id: targetNodeId,
  exact_predicate: "connects_to",
  source_direction: sourceDirection,
});
const scene = (relations, sceneId = "scene:path") =>
  relationReferenceModule.finalizeKnowledgeSceneV13({
    schema_version: relationReferenceModule.OEW_KNOWLEDGE_SCENE_V13,
    scene_id: sceneId,
    graph_digest: digest,
    internal_relations: relations,
    cut_relations: [],
    portals: [],
    navigation_frame: { selected: { kind: "none" } },
  });
const query = (fromNodeId, toNodeId, policyId, limits = {}) => ({
  from_node_id: fromNodeId,
  to_node_id: toNodeId,
  policy_id: policyId,
  policy_version: pathQueryModule.OEW_PATH_POLICY_VERSION,
  ...limits,
});
const clone = (value) => JSON.parse(JSON.stringify(value));

test("finds a deterministic directed shortest path with exact relation references", async () => {
  const admitted = await scene([
    relation("a-to-b", "a", "b"),
    relation("b-to-c", "b", "c"),
    relation("a-to-d", "a", "d"),
    relation("d-to-e", "d", "e"),
    relation("e-to-c", "e", "c"),
  ]);
  const result = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "c", "directed-shortest"),
  );
  assert.equal(result.status, "found");
  assert.equal(result.selected_path_index, 0);
  assert.deepEqual(
    result.paths[0].map(({ relation_ref }) => relation_ref.source_relation_id),
    ["a-to-b", "b-to-c"],
  );
  for (const hop of result.paths[0]) {
    assert.equal(hop.relation_ref.scene_digest, admitted.scene_digest);
    assert.equal(hop.traversal_direction, "with-source");
    assert.equal(Object.hasOwn(hop, "exact_predicate"), false);
    assert.equal(
      relationReferenceModule.resolveRelationRef(admitted, hop.relation_ref).status,
      "resolved",
    );
  }
});

test("keeps parallel same-tuple relations as deterministically ordered alternative paths", async () => {
  const admitted = await scene([
    relation("parallel-b", "a", "b"),
    relation("parallel-a", "a", "b"),
  ]);
  const first = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "b", "directed-shortest"),
  );
  const second = await pathQueryModule.compileBoundedPaths(
    clone(admitted),
    query("a", "b", "directed-shortest"),
  );
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.paths.map((path) => path[0].relation_ref.source_relation_id),
    ["parallel-a", "parallel-b"],
  );
});

test("keeps semantic source direction intact during reverse undirected traversal", async () => {
  const admitted = await scene([relation("reverse", "a", "b", "reverse")]);
  const directedWithSource = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("b", "a", "directed-shortest"),
  );
  const directedAgainstSource = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "b", "directed-shortest"),
  );
  const undirected = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "b", "undirected-shortest"),
  );
  assert.equal(directedWithSource.paths[0][0].traversal_direction, "with-source");
  assert.equal(directedAgainstSource.status, "no-path");
  assert.equal(undirected.paths[0][0].traversal_direction, "against-source");
  assert.equal(
    relationReferenceModule.resolveRelationRef(
      admitted,
      undirected.paths[0][0].relation_ref,
    ).facet.source_direction,
    "reverse",
  );
});

test("reports path-count and hop-count overflow without exceeding either cap", async () => {
  const parallel = await scene(
    Array.from({ length: 9 }, (_, index) =>
      relation(`parallel-${String(index).padStart(2, "0")}`, "a", "b"),
    ),
  );
  const pathOverflow = await pathQueryModule.compileBoundedPaths(
    parallel,
    query("a", "b", "directed-shortest"),
  );
  assert.equal(pathOverflow.status, "cap-overflow");
  assert.equal(pathOverflow.cap, "path-cap");
  assert.equal(pathOverflow.paths.length, 8);

  const chain = await scene(
    Array.from({ length: 9 }, (_, index) =>
      relation(`hop-${index}`, `n${index}`, `n${index + 1}`),
    ),
    "scene:long-path",
  );
  const hopOverflow = await pathQueryModule.compileBoundedPaths(
    chain,
    query("n0", "n9", "directed-shortest"),
  );
  assert.equal(hopOverflow.status, "cap-overflow");
  assert.equal(hopOverflow.cap, "hop-cap");
  assert.deepEqual(hopOverflow.paths, []);
});

test("returns a typed no-path result and accepts the empty identity path", async () => {
  const admitted = await scene([relation("a-to-b", "a", "b")]);
  const missing = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("b", "a", "directed-shortest"),
  );
  assert.equal(missing.status, "no-path");
  assert.equal(missing.selected_path_index, null);
  assert.deepEqual(missing.paths, []);

  const identity = await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "a", "directed-shortest"),
  );
  assert.equal(identity.status, "found");
  assert.deepEqual(identity.paths, [[]]);
});

test("keeps locator drafts revision-free and binds only through the admitted scene", async () => {
  const admitted = await scene([relation("a-to-b", "a", "b")]);
  const locatorResult = await pathQueryModule.compilePathLocators(
    admitted,
    query("a", "b", "directed-shortest"),
  );
  assert.deepEqual(locatorResult.paths[0][0].relation_ref, {
    source_relation_id: "a-to-b",
  });
  assert.equal(
    Object.hasOwn(locatorResult.paths[0][0].relation_ref, "scene_digest"),
    false,
  );
});

test("reports stale and missing references without endpoint-tuple fallback", async () => {
  const firstScene = await scene([relation("a-to-b", "a", "b")], "scene:first");
  const secondScene = await scene([relation("a-to-b", "a", "b")], "scene:second");
  const result = await pathQueryModule.compileBoundedPaths(
    firstScene,
    query("a", "b", "directed-shortest"),
  );
  const stale = await pathQueryModule.resolvePathResult(secondScene, result);
  assert.equal(stale.status, "stale-scene");

  const missingResult = clone(result);
  missingResult.paths[0][0].relation_ref.source_relation_id = "missing";
  const missing = await pathQueryModule.resolvePathResult(firstScene, missingResult);
  assert.equal(missing.status, "missing-reference");
});

test("rejects unsupported policies, oversized caps, and traversal-local drift", async () => {
  const admitted = await scene([relation("a-to-b", "a", "b")]);
  await assert.rejects(
    () => pathQueryModule.compileBoundedPaths(
      admitted,
      query("a", "b", "ambient-tuple-fallback"),
    ),
    (error) => error.issues?.includes("PATH_POLICY_INVALID"),
  );
  await assert.rejects(
    () => pathQueryModule.compileBoundedPaths(
      admitted,
      query("a", "b", "directed-shortest", { max_hops: 9 }),
    ),
    (error) => error.issues?.includes("PATH_HOP_CAP_INVALID"),
  );
  const result = clone(await pathQueryModule.compileBoundedPaths(
    admitted,
    query("a", "b", "directed-shortest"),
  ));
  result.paths[0][0].traversal_direction = "against-source";
  await assert.rejects(
    () => pathQueryModule.resolvePathResult(admitted, result),
    (error) => error.issues?.some((issue) => issue.startsWith("PATH_HOP_FACET_DRIFT")),
  );
});
