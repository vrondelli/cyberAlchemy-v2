import type { PresentationNode } from "../contracts/bundle";
import { filterNodes } from "./filterQuery";
import { rankSearch } from "./searchQuery";
export function projectQuery(nodes: readonly PresentationNode[], query: string, filters: Readonly<Record<string, readonly string[]>>): readonly string[] {
  const allowed = new Set(filterNodes(nodes, filters).map((node) => node.id));
  return rankSearch(nodes, query).filter((id) => allowed.has(id));
}
