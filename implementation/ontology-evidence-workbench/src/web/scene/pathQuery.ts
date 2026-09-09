import type { PathResult, SourceGraph } from "../contracts/scene";

export function queryBoundedPath(graph: SourceGraph, startId: string, endId: string, limit = 16): PathResult {
  if (!graph.nodes.has(startId) || !graph.nodes.has(endId)) return { status: "unknown-endpoint", message: "Both path endpoints must exist in the admitted dataset." };
  if (startId === endId) return { status: "same-endpoint", message: "Choose two different nodes to see a path." };
  const queue: { id: string; nodes: string[]; relations: string[] }[] = [{ id: startId, nodes: [startId], relations: [] }];
  const seen = new Set([startId]);
  let visited = 0;
  while (queue.length) {
    const current = queue.shift()!;
    if (++visited > 5000) return { status: "limit-reached", message: "The path search reached its safety limit." };
    const adjacent = [...(graph.outgoing.get(current.id) ?? []).map((relation) => ({ next: relation.targetId, relation })), ...(graph.incoming.get(current.id) ?? []).map((relation) => ({ next: relation.sourceId, relation }))].sort((a, b) => a.relation.id.localeCompare(b.relation.id));
    const alternatives = adjacent.filter(({ next }) => !seen.has(next)).slice(1, 5).map(({ next }) => ({ viaId: next, label: graph.nodes.get(next)?.name ?? next }));
    for (const { next, relation } of adjacent) {
      if (seen.has(next)) continue;
      const nodes = [...current.nodes, next]; const relations = [...current.relations, relation.id];
      if (nodes.length > limit) return { status: "limit-reached", message: `No path was proven within ${limit} visible nodes.` };
      if (next === endId) return { status: "found", nodeIds: nodes, relations: relations.map((id) => graph.relations.get(id)!), alternatives };
      seen.add(next); queue.push({ id: next, nodes, relations });
    }
  }
  return { status: "no-path", message: "No connected path exists between these nodes." };
}
