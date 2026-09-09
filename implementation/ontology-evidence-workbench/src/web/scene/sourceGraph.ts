import type { VerifiedDataset } from "../contracts/bundle";
import type { SourceGraph } from "../contracts/scene";
import { projectRelations } from "../presentation/relationPresentation";

export function buildSourceGraph(dataset: VerifiedDataset): SourceGraph {
  const nodes = new Map(dataset.graph.nodes.map((node) => [node.id, node]));
  const relations = projectRelations(dataset);
  const outgoing = new Map<string, typeof relations>();
  const incoming = new Map<string, typeof relations>();
  for (const node of nodes.keys()) { outgoing.set(node, []); incoming.set(node, []); }
  for (const relation of relations) {
    if (!nodes.has(relation.sourceId) || !nodes.has(relation.targetId)) throw new Error(`Broken relation ${relation.id}.`);
    outgoing.set(relation.sourceId, [...(outgoing.get(relation.sourceId) ?? []), relation]);
    incoming.set(relation.targetId, [...(incoming.get(relation.targetId) ?? []), relation]);
  }
  const stable = (items: readonly (typeof relations)[number][]) => [...items].sort((a, b) => a.id.localeCompare(b.id));
  return { nodes, relations: new Map(relations.map((relation) => [relation.id, relation])), outgoing: new Map([...outgoing].map(([id, items]) => [id, stable(items)])), incoming: new Map([...incoming].map(([id, items]) => [id, stable(items)])) };
}

export function nodeKind(tags: readonly string[], fallback = "Concept"): string {
  return tags.find((tag) => tag.startsWith("business-kind:"))?.slice("business-kind:".length) ?? fallback;
}
