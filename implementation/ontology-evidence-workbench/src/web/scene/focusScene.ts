import type { FocusScene, SourceGraph } from "../contracts/scene";
import { radialPosition } from "./relationGeometry";

interface FocusOptions { readonly focusIds: readonly string[]; readonly radius?: number; readonly visibleLimit?: number }

export function queryFocusScene(graph: SourceGraph, options: FocusOptions): FocusScene {
  const radius = Math.max(0, options.radius ?? 1);
  const visibleLimit = Math.max(1, Math.min(options.visibleLimit ?? 18, 150));
  const focusIds = [...new Set(options.focusIds)].filter((id) => graph.nodes.has(id)).sort();
  if (!focusIds.length && graph.nodes.size) focusIds.push([...graph.nodes.keys()].sort()[0]!);
  const visible = new Set(focusIds.slice(0, visibleLimit));
  let frontier = [...visible];
  for (let depth = 0; depth < radius && visible.size < visibleLimit; depth += 1) {
    const candidates = new Set<string>();
    for (const id of frontier) {
      graph.outgoing.get(id)?.forEach((edge) => candidates.add(edge.targetId));
      graph.incoming.get(id)?.forEach((edge) => candidates.add(edge.sourceId));
    }
    frontier = [...candidates].filter((id) => !visible.has(id)).sort().slice(0, visibleLimit - visible.size);
    frontier.forEach((id) => visible.add(id));
  }
  const relations = [...graph.relations.values()].filter((edge) => visible.has(edge.sourceId) && visible.has(edge.targetId));
  const boundary = [...graph.relations.values()].flatMap((relation) => {
    const sourceVisible = visible.has(relation.sourceId); const targetVisible = visible.has(relation.targetId);
    if (sourceVisible === targetVisible) return [];
    return [{ relation, visibleId: sourceVisible ? relation.sourceId : relation.targetId, omittedId: sourceVisible ? relation.targetId : relation.sourceId, direction: sourceVisible ? "outgoing" as const : "incoming" as const }];
  });
  const orderedIds = [...visible].sort((a, b) => Number(focusIds.includes(b)) - Number(focusIds.includes(a)) || a.localeCompare(b));
  const nodes = orderedIds.map((id, index) => ({ id, node: graph.nodes.get(id)!, ...radialPosition(index, orderedIds.length, orderedIds.length <= 4 ? 210 : 310), degree: (graph.outgoing.get(id)?.length ?? 0) + (graph.incoming.get(id)?.length ?? 0) }));
  return { focusIds, nodes, relations, boundary, omittedNodeIds: [...new Set(boundary.map((item) => item.omittedId))].sort(), visibleLimit };
}
