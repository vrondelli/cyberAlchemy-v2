import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDemoSnapshotV1 } from "../assets/demo-snapshot-v1.mjs";
import { projectGraph } from "../assets/graph-view.mjs";
import { projectOutline } from "../assets/outline-view.mjs";
import { selectDemoSlice } from "../assets/question-slice.mjs";
import { projectTable } from "../assets/table-view.mjs";

const snapshotUrl = new URL("../generated/read-models/demo-snapshot.v1.json", import.meta.url);
const snapshot = validateDemoSnapshotV1(JSON.parse(await readFile(snapshotUrl, "utf8")));

for (const sliceId of ["default", "player-action-support"]) {
  test(`${sliceId} exposes identical stable-ID sets through all three lenses`, () => {
    const slice = selectDemoSlice(snapshot, sliceId);
    const projections = [projectGraph(slice), projectOutline(slice), projectTable(slice)];
    for (const projection of projections) {
      assert.deepEqual(projection.node_ids, slice.node_ids);
      assert.deepEqual(projection.relation_ids, slice.relation_ids);
      assert.equal(projection.artifact_role, "projection");
      assert.ok(Object.isFrozen(projection));
    }
  });
}

test("graph preserves explicit edge direction, labels and stable endpoints", () => {
  const graph = projectGraph(selectDemoSlice(snapshot));
  assert.deepEqual(
    graph.relations.map(({ stable_id, relation_class, source_id, target_id, directed }) => ({ stable_id, relation_class, source_id, target_id, directed })),
    [
      { stable_id: "key-and-door.edge.has-key-rule-enforces-unlock-door", relation_class: "enforces", source_id: "key-and-door.HasKeyRule", target_id: "key-and-door.UnlockDoor", directed: true },
      { stable_id: "key-and-door.edge.player-performs-unlock-door", relation_class: "performs", source_id: "key-and-door.Player", target_id: "key-and-door.UnlockDoor", directed: true },
      { stable_id: "key-and-door.edge.unlock-door-produces-door-unlocked", relation_class: "produces", source_id: "key-and-door.UnlockDoor", target_id: "key-and-door.DoorUnlocked", directed: true },
    ],
  );
});

test("outline names itself as navigation and never claims containment", () => {
  const outline = projectOutline(selectDemoSlice(snapshot));
  assert.equal(outline.projection_kind, "authored-navigation-projection");
  assert.equal(outline.containment_claim, false);
});

test("projection serialization is deterministic for identical immutable input", () => {
  const slice = selectDemoSlice(snapshot, "player-action-support");
  assert.equal(JSON.stringify(projectGraph(slice)), JSON.stringify(projectGraph(slice)));
  assert.equal(JSON.stringify(projectOutline(slice)), JSON.stringify(projectOutline(slice)));
  assert.equal(JSON.stringify(projectTable(slice)), JSON.stringify(projectTable(slice)));
});
