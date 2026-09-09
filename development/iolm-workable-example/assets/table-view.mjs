import { deepFreeze } from "./demo-snapshot-v1.mjs";

export function projectTable(slice) {
  const records = slice.nodes.map((node) => ({
    stable_id: node.id,
    label: node.label,
    kind: node.kind,
    feature_id: node.feature_id,
    validation_state: node.validation_state,
  }));
  const relations = slice.relations.map((relation) => ({
    stable_id: relation.id,
    relation_class: relation.relation_class,
    source_id: relation.source.node_id,
    target_id: relation.target.node_id,
    validation_state: relation.validation_state,
  }));
  return deepFreeze({
    schema_version: "iolm-table-projection/v1",
    artifact_role: "projection",
    source_snapshot_id: slice.source_snapshot_id,
    slice_id: slice.slice_id,
    node_ids: records.map(({ stable_id }) => stable_id),
    relation_ids: relations.map(({ stable_id }) => stable_id),
    records,
    relations,
  });
}
