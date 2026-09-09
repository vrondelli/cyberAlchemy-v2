import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const testRoot = dirname(fileURLToPath(import.meta.url));
const sourceRoot = new URL("../upstream/overlay/packages/dashboard/src/oew/", import.meta.url);
const keyboardSource = await readFile(new URL("keyboard.ts", sourceRoot));
const {buildDeepLink, keyboardCommand, parseDeepLink} = await import(
  `data:text/javascript;base64,${keyboardSource.toString("base64")}`
);
const storeModule = await import(new URL("store.ts", sourceRoot));
const relationModule = await import(pathToFileURL(resolve(
  testRoot,
  "../upstream/overlay/packages/dashboard/src/oew/scene/relationReference.ts",
)));

const graphDigest = "a".repeat(64);
const relation = (id, source = "n1", target = "n2") => ({
  source_relation_id: id,
  source_node_id: source,
  target_node_id: target,
  exact_predicate: "depends_on",
  source_direction: "forward",
  direction_label: "source depends on target",
  authority_effect: "none",
});
const draft = (id = "scene:navigation", selected = "relation-a") => ({
  schema_version: relationModule.OEW_KNOWLEDGE_SCENE_V13,
  scene_id: id,
  graph_digest: graphDigest,
  internal_relations: [relation("relation-a"), relation("relation-b")],
  cut_relations: [],
  portals: [],
  navigation_frame: {
    initiating_control_id: "control:return",
    selected: selected === null
      ? {kind: "none"}
      : {kind: "relation", relation_ref: {source_relation_id: selected}},
  },
});
const adapter = {
  admitKnowledgeSceneV13: relationModule.admitKnowledgeSceneV13,
  resolveRelationRef: relationModule.resolveRelationRef,
};
const clone = (value) => JSON.parse(JSON.stringify(value));

test("documented keyboard commands map to the evidence-only UI", () => {
  assert.equal(keyboardCommand({key: "/", metaKey: false, ctrlKey: false, shiftKey: false}), "open-search");
  assert.equal(keyboardCommand({key: "k", metaKey: true}), "open-search");
  assert.equal(keyboardCommand({key: "I", shiftKey: true}), "toggle-inspector");
  assert.equal(keyboardCommand({key: "r"}), "toggle-receipts");
  assert.equal(keyboardCommand({key: "g"}), "view-graph");
  assert.equal(keyboardCommand({key: "o"}), "view-outline");
  assert.equal(keyboardCommand({key: "t"}), "view-table");
  assert.equal(keyboardCommand({key: "c"}), null);
});

test("deep links encode handles, not raw private content, and recover safely", () => {
  const url = buildDeepLink({
    runId: "SWU-OCGP-008",
    selectedSourceRef: "C-SPECIALIZES-D2-D1",
    surface: "table",
    filters: {text: "owner unbound"},
  });
  assert.match(url, /run=SWU-OCGP-008/);
  assert.match(url, /selected=C-SPECIALIZES-D2-D1/);
  assert.doesNotMatch(url, /validation%2Fpoker-team/);
  assert.deepEqual(
    parseDeepLink("?selected=unknown&surface=code&q=O13", ["F1", "R1"]),
    {
      runId: null,
      selectedSourceRef: "F1",
      recoveredInvalidSelection: true,
      surface: "graph",
      filters: {text: "O13"},
    },
  );
});

test("search and filters expose exact contract dimensions", async () => {
  const [palette, filters] = await Promise.all([
    readFile(new URL("CommandPalette.tsx", sourceRoot), "utf8"),
    readFile(new URL("EvidenceFilters.tsx", sourceRoot), "utf8"),
  ]);
  assert.match(palette, /Search exact evidence, relation, path, diagnostic/);
  for (const dimension of ["Kind", "Relation", "Disposition", "Diagnostic"]) {
    assert.match(filters, new RegExp(dimension));
  }
});

test("scene navigation selects exact relation and Path-hop references", async () => {
  const scene = await relationModule.finalizeKnowledgeSceneV13(draft());
  const store = await storeModule.createSceneNavigationStore(adapter, clone(scene));
  assert.deepEqual(store.getState().selectedRelationRef, {
    source_relation_id: "relation-a",
    scene_digest: scene.scene_digest,
  });
  store.selectPathHop({relation_ref: {
    source_relation_id: "relation-b",
    scene_digest: scene.scene_digest,
  }});
  assert.equal(store.getSelectedRelation().source_relation_id, "relation-b");
});

test("stale and missing references recover through the explicit focus fallback", async () => {
  const scene = await relationModule.finalizeKnowledgeSceneV13(draft());
  const store = await storeModule.createSceneNavigationStore(adapter, clone(scene));
  store.selectRelationRef({
    source_relation_id: "relation-a",
    scene_digest: "0".repeat(64),
  });
  assert.equal(store.getState().selectedRelationRef, null);
  assert.equal(store.getState().recoveryReason, "relation-stale-scene");
  assert.deepEqual(store.getState().focus, {
    kind: "initiating-control",
    target_id: "control:return",
    reason: "relation-stale-scene",
  });
  store.selectRelationRef({
    source_relation_id: "missing",
    scene_digest: scene.scene_digest,
  });
  assert.equal(store.getState().recoveryReason, "relation-missing");
});

test("restoration admits first and swaps the scene and state exactly once", async () => {
  const first = await relationModule.finalizeKnowledgeSceneV13(draft());
  const store = await storeModule.createSceneNavigationStore(adapter, clone(first));
  const observed = [];
  store.subscribe((state) => observed.push(state));
  const invalid = clone(first);
  invalid.internal_relations[0].exact_predicate = "tampered";
  await assert.rejects(store.restoreScene(invalid), /SCENE_REVISION_MISMATCH/);
  assert.equal(store.getScene().scene_digest, first.scene_digest);
  assert.equal(observed.length, 0);

  const second = await relationModule.finalizeKnowledgeSceneV13(
    draft("scene:navigation:next", "relation-b"),
  );
  await store.restoreScene(clone(second));
  assert.equal(store.getScene().scene_digest, second.scene_digest);
  assert.equal(store.getState().selectedRelationRef.source_relation_id, "relation-b");
  assert.equal(observed.length, 1);
});

test("the scene adapter is required without adding a static scene import to store.ts", async () => {
  const storeSource = await readFile(new URL("store.ts", sourceRoot), "utf8");
  assert.doesNotMatch(storeSource, /^import .*scene\//m);
  await assert.rejects(
    storeModule.createSceneNavigationStore({}, {}),
    /SCENE_REFERENCE_ADAPTER_REQUIRED/,
  );
});
