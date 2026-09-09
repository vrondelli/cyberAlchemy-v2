import {
  DemoSnapshotError,
  deepFreeze,
  validateDemoSnapshotV1,
} from "./demo-snapshot-v1.mjs";

function fail(code, field, message, expected, actual) {
  throw new DemoSnapshotError(code, field, message, { expected, actual });
}

export function selectDemoSlice(snapshot, sliceId = "default") {
  const guarded = validateDemoSnapshotV1(snapshot);
  const descriptor = sliceId === "default"
    ? guarded.slices.default
    : guarded.slices.questions.find(({ slice_id: id }) => id === sliceId);
  if (!descriptor) {
    fail(
      "QUESTION_SLICE_NOT_FOUND",
      "slice_id",
      "Requested slice is not declared by the guarded snapshot.",
      ["default", ...guarded.slices.questions.map(({ slice_id: id }) => id)],
      sliceId,
    );
  }

  const nodeMap = new Map(guarded.nodes.map((node) => [node.id, node]));
  const relationMap = new Map(guarded.relations.map((relation) => [relation.id, relation]));
  const nodes = descriptor.node_ids.map((id) => nodeMap.get(id));
  const relations = descriptor.relation_ids.map((id) => relationMap.get(id));
  if (nodes.some((node) => !node) || relations.some((relation) => !relation)) {
    fail("QUESTION_SLICE_PARITY_MISMATCH", "slice", "A declared slice contains unresolved stable IDs.");
  }

  return deepFreeze({
    schema_version: "iolm-demo-slice/v1",
    artifact_role: "projection",
    source_snapshot_id: guarded.snapshot_id,
    slice_id: descriptor.slice_id,
    question: descriptor.question,
    posture: guarded.posture,
    authority_effect: guarded.authority_effect,
    owner_route: guarded.owner_route,
    counts: { ...descriptor.counts },
    node_ids: [...descriptor.node_ids],
    relation_ids: [...descriptor.relation_ids],
    nodes: [...nodes],
    relations: [...relations],
    ineligible_for: [...guarded.ineligible_for],
  });
}

export function selectPlayerQuestionSlice(snapshot) {
  return selectDemoSlice(snapshot, "player-action-support");
}
