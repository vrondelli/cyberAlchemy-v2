import { DemoSnapshotError, deepFreeze } from "./demo-snapshot-v1.mjs";

function fail(selectedId, available) {
  throw new DemoSnapshotError(
    "SELECTION_ID_UNRESOLVED",
    "selected_id",
    "The provenance inspector cannot resolve the requested stable ID.",
    { expected: available, actual: selectedId },
  );
}

function common(record) {
  return {
    stable_id: record.id,
    record_type: record.record_type,
    label: record.label,
    artifact_role: record.artifact_role,
    posture: record.posture,
    authority_effect: record.authority_effect,
    owner_route: record.owner_route,
    source_reference: record.source_reference,
    source_digest: record.source_digest,
    contract_binding: { ...record.contract_binding },
    validation_state: record.validation_state,
  };
}

export function inspectProvenance(slice, selectedId) {
  const node = slice.nodes.find(({ id }) => id === selectedId);
  if (node) {
    return deepFreeze({
      schema_version: "iolm-provenance-inspector/v1",
      artifact_role: "projection",
      ...common(node),
      feature_id: node.feature_id,
      kind: node.kind,
      intent: node.intent,
    });
  }

  const relation = slice.relations.find(({ id }) => id === selectedId);
  if (relation) {
    return deepFreeze({
      schema_version: "iolm-provenance-inspector/v1",
      artifact_role: "projection",
      ...common(relation),
      relation_class: relation.relation_class,
      source: { ...relation.source },
      target: { ...relation.target },
    });
  }

  fail(selectedId, [
    ...slice.nodes.map(({ id }) => id),
    ...slice.relations.map(({ id }) => id),
  ]);
}
