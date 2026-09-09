import type { PresentationNode } from "../contracts/bundle";
import { nodeKind } from "../scene/sourceGraph";

export function filterNodes(nodes: readonly PresentationNode[], filters: Readonly<Record<string, readonly string[]>>): readonly PresentationNode[] {
  return nodes.filter((node) => Object.entries(filters).every(([group, values]) => !values.length || values.some((value) => {
    if (group === "kind") return nodeKind(node.tags, node.knowledgeMeta?.category).toLowerCase() === value.toLowerCase();
    if (group === "category") return (node.knowledgeMeta?.category ?? "Concept").toLowerCase() === value.toLowerCase();
    if (group === "mapping") return node.tags.some((tag) => tag.toLowerCase() === value.toLowerCase());
    return false;
  })));
}
