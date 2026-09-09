import type { PresentationNode } from "../contracts/bundle";
import { nodeKind } from "../scene/sourceGraph";

export function normalizeQuery(value: string): string { return value.normalize("NFKD").toLocaleLowerCase().trim().replace(/\s+/g, " "); }
export function rankSearch(nodes: readonly PresentationNode[], rawQuery: string): readonly string[] {
  const query = normalizeQuery(rawQuery); if (!query) return nodes.map((node) => node.id).sort();
  const tokens = query.split(" ");
  return nodes.map((node) => {
    const id = normalizeQuery(node.id); const title = normalizeQuery(node.name); const summary = normalizeQuery(node.summary ?? node.knowledgeMeta?.content ?? ""); const tags = normalizeQuery(node.tags.join(" ")); const kind = normalizeQuery(nodeKind(node.tags, node.knowledgeMeta?.category));
    let score = 0;
    if (title === query || id === query) score += 1000;
    if (title.startsWith(query)) score += 500;
    if (id.includes(query)) score += 260;
    if (title.includes(query)) score += 220;
    for (const token of tokens) { if (title.includes(token)) score += 80; if (summary.includes(token)) score += 30; if (tags.includes(token) || kind.includes(token)) score += 40; }
    return { id: node.id, score };
  }).filter((result) => result.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).map((result) => result.id);
}
