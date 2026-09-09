import type { FocusScene, PortalDescriptor, SourceGraph } from "../contracts/scene";
import { nodeKind } from "./sourceGraph";

export function queryGroupedPortals(graph: SourceGraph, scene: FocusScene): readonly PortalDescriptor[] {
  const groups = new Map<string, typeof scene.boundary>();
  for (const item of scene.boundary) {
    const target = graph.nodes.get(item.omittedId);
    const kind = nodeKind(target?.tags ?? [], target?.knowledgeMeta?.category ?? "Concept");
    const key = `${kind}|${item.direction}|${item.relation.family}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, items]) => {
    const [kind, direction, family] = key.split("|") as [string, "outgoing" | "incoming", string];
    const targetIds = [...new Set(items.map((item) => item.omittedId))].sort();
    const predicates = [...new Set(items.map((item) => item.relation.sourcePredicate))].sort();
    const names = targetIds.map((id) => graph.nodes.get(id)?.name ?? id);
    return { id: `portal:${key}:${targetIds.join(",")}`, label: `${kind} · ${family}`, targetKind: kind, iconKey: kind, direction, family, targetIds, relationIds: items.map((item) => item.relation.id).sort(), predicates, count: targetIds.length, sentence: `${direction === "outgoing" ? "This area leads to" : "This area is reached from"} ${names.slice(0, 2).join(" and ")}${names.length > 2 ? ` and ${names.length - 2} more` : ""} via ${predicates.join(", ")}.`, pivotFocusId: targetIds[0]! };
  });
}
