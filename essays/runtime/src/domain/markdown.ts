import type { StableBlock } from "./model";

export interface EssaysStagedBuffer {
  workspaceId: string;
  proposalId: string;
  stageEpoch: number;
  markdown: string;
}

export interface EssaysSavedDraftObservation {
  workspaceId: string;
  workspaceRevision: number;
  essayRevision: number;
  canonicalMarkdown: string;
}

export function normalizeMarkdown(markdown: string): string {
  const normalized = markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
  return normalized ? `${normalized}\n` : "";
}

export function splitMarkdownBlocks(markdown: string): string[] {
  const source = normalizeMarkdown(markdown).replace(/\n$/, "");
  if (!source) return [];
  const blocks: string[] = [];
  let lines: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    const block = lines.join("\n").trim();
    if (block) blocks.push(block);
    lines = [];
  };

  for (const line of source.split("\n")) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      fence = fence === marker ? null : fence ?? marker;
      lines.push(line);
      continue;
    }
    if (!fence && line.trim() === "") flush();
    else lines.push(line);
  }
  flush();
  return blocks;
}

export function blockKind(markdown: string): string {
  const first = markdown.split("\n", 1)[0].trim();
  if (/^#{1,6}\s/.test(first)) return "heading";
  if (/^(```|~~~)/.test(first)) return "code";
  if (/^>\s?/.test(first)) return "quote";
  if (/^(?:[-+*]|\d+[.)])\s/.test(first)) return "list";
  if (/^([-*_])(?:\s*\1){2,}$/.test(first)) return "divider";
  return "paragraph";
}

function words(value: string): Set<string> {
  return new Set(value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
}

function similarity(left: string, right: string): number {
  const a = words(left);
  const b = words(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function nextIdentity(counter: { value: number }, prefix: string): string {
  const id = `${prefix}-${String(counter.value).padStart(4, "0")}`;
  counter.value += 1;
  return id;
}

export function reconcileBlocks(
  markdown: string,
  previous: StableBlock[],
  nextIdentityValue: number,
): { markdown: string; blocks: StableBlock[]; nextIdentity: number } {
  const normalized = normalizeMarkdown(markdown);
  const sourceBlocks = splitMarkdownBlocks(normalized);
  const available = new Set(previous.map((block) => block.blockId));
  const assigned = new Map<number, StableBlock>();

  // Exact matches first, including repeated blocks in their prior order.
  for (let index = 0; index < sourceBlocks.length; index += 1) {
    const exact = previous.find(
      (block) => available.has(block.blockId) && block.markdown === sourceBlocks[index],
    );
    if (exact) {
      assigned.set(index, exact);
      available.delete(exact.blockId);
    }
  }

  // Reuse the most similar same-kind identity for edited blocks. A low threshold
  // prevents an inserted paragraph from stealing an unrelated old anchor.
  for (let index = 0; index < sourceBlocks.length; index += 1) {
    if (assigned.has(index)) continue;
    const kind = blockKind(sourceBlocks[index]);
    const candidates = previous
      .filter((block) => available.has(block.blockId) && block.kind === kind)
      .map((block) => ({
        block,
        score: similarity(block.markdown, sourceBlocks[index]) - Math.abs(block.ordinal - index) * 0.025,
      }))
      .sort((left, right) => right.score - left.score);
    if (candidates[0] && candidates[0].score >= 0.24) {
      assigned.set(index, candidates[0].block);
      available.delete(candidates[0].block.blockId);
    }
  }

  const counter = { value: nextIdentityValue };
  const blocks = sourceBlocks.map((blockMarkdown, ordinal) => {
    const existing = assigned.get(ordinal);
    return {
      blockId: existing?.blockId ?? nextIdentity(counter, "block"),
      partId: existing?.partId ?? nextIdentity(counter, "part"),
      ordinal,
      kind: blockKind(blockMarkdown),
      markdown: blockMarkdown,
    };
  });

  return { markdown: normalized, blocks, nextIdentity: counter.value };
}
