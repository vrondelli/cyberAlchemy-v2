function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function cycleIssue(path) {
  return {
    path: "grounding",
    code: "GROUNDING_CYCLE",
    message: `Grounding cycle detected: ${path.join(" -> ")}`,
  };
}

export function evaluateGrounding(graph) {
  const groundingEdges = graph.edges
    .filter(({ predicate }) => predicate === "derives-from")
    .sort(
      (left, right) =>
        left.source.localeCompare(right.source) ||
        left.target.localeCompare(right.target) ||
        left.edge_id.localeCompare(right.edge_id),
    );
  const adjacency = new Map();
  for (const { source, target } of groundingEdges) {
    const targets = adjacency.get(source) ?? [];
    targets.push(target);
    adjacency.set(source, sortedUnique(targets));
  }

  const state = new Map();
  const stack = [];
  let detectedCycle = null;
  function visit(nodeId) {
    state.set(nodeId, "visiting");
    stack.push(nodeId);
    for (const target of adjacency.get(nodeId) ?? []) {
      if (state.get(target) === "visiting") {
        const start = stack.indexOf(target);
        detectedCycle = [...stack.slice(start), target];
        return;
      }
      if (!state.has(target)) visit(target);
      if (detectedCycle) return;
    }
    stack.pop();
    state.set(nodeId, "visited");
  }
  for (const nodeId of sortedUnique([...adjacency.keys(), ...groundingEdges.map(({ target }) => target)])) {
    if (!state.has(nodeId)) visit(nodeId);
    if (detectedCycle) {
      return {
        grounding_version: "candidate-grounding-v1",
        roots: {},
        issues: [cycleIssue(detectedCycle)],
      };
    }
  }

  const targets = new Set(groundingEdges.map(({ target }) => target));
  const roots = sortedUnique(groundingEdges.map(({ source }) => source).filter((id) => !targets.has(id)));
  const rootResults = {};

  function collectPaths(nodeId, current, paths) {
    const children = adjacency.get(nodeId) ?? [];
    if (children.length === 0) {
      paths.push(current);
      return;
    }
    for (const child of children) collectPaths(child, [...current, child], paths);
  }

  for (const root of roots) {
    const paths = [];
    collectPaths(root, [root], paths);
    const reachable = paths.flatMap((path) => path.slice(1));
    rootResults[root] = {
      reachable_ids: sortedUnique(reachable),
      paths: paths.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    };
  }

  return {
    grounding_version: "candidate-grounding-v1",
    roots: rootResults,
    issues: [],
  };
}
