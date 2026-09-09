import { deepFreeze } from "./demo-snapshot-v1.mjs";

const PINNED_POSITIONS = Object.freeze({
  "key-and-door.HasKeyRule": Object.freeze({ x: 132, y: 96 }),
  "key-and-door.Player": Object.freeze({ x: 132, y: 284 }),
  "key-and-door.UnlockDoor": Object.freeze({ x: 414, y: 190 }),
  "key-and-door.DoorUnlocked": Object.freeze({ x: 700, y: 190 }),
});

function fallbackPosition(index, total) {
  const angle = ((index / Math.max(total, 1)) * Math.PI * 2) - (Math.PI / 2);
  return {
    x: Math.round(410 + Math.cos(angle) * 250),
    y: Math.round(190 + Math.sin(angle) * 125),
  };
}

export function projectGraph(slice) {
  const nodeMap = new Map(slice.nodes.map((node) => [node.id, node]));
  const nodes = slice.nodes.map((node, index) => ({
    stable_id: node.id,
    feature_id: node.feature_id,
    kind: node.kind,
    label: node.label,
    intent: node.intent,
    ...(PINNED_POSITIONS[node.id] ?? fallbackPosition(index, slice.nodes.length)),
  }));
  const relations = slice.relations.map((relation) => ({
    stable_id: relation.id,
    relation_class: relation.relation_class,
    label: relation.label,
    source_id: relation.source.node_id,
    source_label: nodeMap.get(relation.source.node_id)?.label,
    target_id: relation.target.node_id,
    target_label: nodeMap.get(relation.target.node_id)?.label,
    directed: true,
  }));
  return deepFreeze({
    schema_version: "iolm-graph-projection/v1",
    artifact_role: "projection",
    source_snapshot_id: slice.source_snapshot_id,
    slice_id: slice.slice_id,
    view_box: { width: 832, height: 380 },
    node_ids: nodes.map(({ stable_id }) => stable_id),
    relation_ids: relations.map(({ stable_id }) => stable_id),
    nodes,
    relations,
  });
}
