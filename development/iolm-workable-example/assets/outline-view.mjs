import { deepFreeze } from "./demo-snapshot-v1.mjs";

export function projectOutline(slice) {
  const nodes = slice.nodes.map((node, index) => ({
    stable_id: node.id,
    ordinal: index + 1,
    label: node.label,
    kind: node.kind,
    intent: node.intent,
    feature_id: node.feature_id,
  }));
  const relations = slice.relations.map((relation, index) => ({
    stable_id: relation.id,
    ordinal: index + 1,
    label: relation.label,
    relation_class: relation.relation_class,
    source_id: relation.source.node_id,
    target_id: relation.target.node_id,
  }));
  return deepFreeze({
    schema_version: "iolm-outline-projection/v1",
    artifact_role: "projection",
    projection_kind: "authored-navigation-projection",
    containment_claim: false,
    source_snapshot_id: slice.source_snapshot_id,
    slice_id: slice.slice_id,
    node_ids: nodes.map(({ stable_id }) => stable_id),
    relation_ids: relations.map(({ stable_id }) => stable_id),
    nodes,
    relations,
  });
}
