import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDemoSnapshotV1 } from "../assets/demo-snapshot-v1.mjs";
import { inspectProvenance } from "../assets/provenance-inspector.mjs";
import { selectDemoSlice } from "../assets/question-slice.mjs";
import {
  changeLens,
  changeSlice,
  closestStableIdElement,
  createViewerState,
  selectStableId,
} from "../assets/selection.mjs";

const snapshotUrl = new URL("../generated/read-models/demo-snapshot.v1.json", import.meta.url);
const snapshot = validateDemoSnapshotV1(JSON.parse(await readFile(snapshotUrl, "utf8")));
const full = selectDemoSlice(snapshot);
const player = selectDemoSlice(snapshot, "player-action-support");

test("delegated selection resolves element and Firefox text-node targets without throwing", () => {
  const stableItem = { dataset: { stableId: "key-and-door.Player" } };
  const elementTarget = { closest: (selector) => selector === "[data-stable-id]" ? stableItem : null };
  const textTarget = { parentElement: elementTarget };

  assert.equal(closestStableIdElement(elementTarget), stableItem);
  assert.equal(closestStableIdElement(textTarget), stableItem);
  assert.equal(closestStableIdElement({ parentElement: null }), null);
  assert.equal(closestStableIdElement(null), null);
});

test("selection is preserved across graph, outline and table lens changes", () => {
  let state = createViewerState(full, { selectedId: "key-and-door.UnlockDoor" });
  for (const lens of ["outline", "table", "graph"]) {
    state = changeLens(state, full, lens);
    assert.equal(state.selected_id, "key-and-door.UnlockDoor");
    assert.equal(state.lens, lens);
  }
});

test("slice changes preserve an available stable ID and deterministically fall back", () => {
  const playerState = createViewerState(full, { selectedId: "key-and-door.Player" });
  assert.equal(changeSlice(playerState, player).selected_id, "key-and-door.Player");
  const ruleState = createViewerState(full, { selectedId: "key-and-door.HasKeyRule" });
  assert.equal(changeSlice(ruleState, player).selected_id, "key-and-door.Player");
});

test("absent stable IDs produce the typed blocked selection state", () => {
  const state = createViewerState(full);
  assert.throws(
    () => selectStableId(state, full, "key-and-door.Missing"),
    (error) => error.code === "SELECTION_ID_UNRESOLVED" && error.field === "selected_id",
  );
  assert.throws(
    () => inspectProvenance(full, "key-and-door.Missing"),
    (error) => error.code === "SELECTION_ID_UNRESOLVED",
  );
});

test("node inspector resolves exact provenance without renderer parsing", () => {
  const result = inspectProvenance(full, "key-and-door.Player");
  assert.equal(result.record_type, "node");
  assert.equal(result.kind, "Entity");
  assert.equal(result.source_reference, "specs/key-and-door/nodes/player.json");
  assert.equal(result.artifact_role, "generated-read-model");
  assert.equal(result.posture, "candidate");
  assert.equal(result.authority_effect, "none");
  assert.equal(result.validation_state, "pass");
  assert.ok(Object.isFrozen(result.contract_binding));
});

test("relation inspector exposes class, independently namespaced endpoints and provenance", () => {
  const result = inspectProvenance(full, "key-and-door.edge.player-performs-unlock-door");
  assert.equal(result.record_type, "relation");
  assert.equal(result.relation_class, "performs");
  assert.deepEqual(result.source, { feature_id: "key-and-door", node_id: "key-and-door.Player" });
  assert.deepEqual(result.target, { feature_id: "key-and-door", node_id: "key-and-door.UnlockDoor" });
  assert.equal(result.source_digest, "644b9730e59c663f2b9848470b7664cecbe0483e4f7d8968f7cf53da07b0ddb6");
});
