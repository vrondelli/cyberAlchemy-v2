export function projectResearchLineage({ graph, policyResult, groundingResult }) {
  if (policyResult.disposition !== "policy-pass") return null;
  const session = [...graph.nodes].filter(({ kind }) => kind === "session").sort(
    (left, right) => left.node_id.localeCompare(right.node_id),
  )[0];
  const rootEntries = Object.entries(groundingResult.roots).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const lineageIds = [
    ...new Set(rootEntries.flatMap(([root, value]) => [root, ...value.reachable_ids])),
  ].sort();
  const paths = rootEntries.flatMap(([, value]) => value.paths);
  const groundingPath = paths.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  )[0] ?? [];
  const visibleConflicts = graph.edges
    .filter(({ predicate }) => predicate === "contradicts")
    .map(({ source, predicate, target }) => ({ from: source, relation: predicate, to: target }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const conflictIds = visibleConflicts.flatMap(({ from, to }) => [from, to]);
  return {
    session_id: session.node_id,
    lineage_ids: lineageIds,
    grounding_path: groundingPath,
    visible_conflicts: visibleConflicts,
    excluded_from_lineage: [...new Set(conflictIds.filter((id) => !lineageIds.includes(id)))].sort(),
    authority_effect: "none",
  };
}
