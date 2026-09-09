import { describe, expect, it } from "vitest";
import { normalizeMarkdown, reconcileBlocks, splitMarkdownBlocks } from "./markdown";

describe("Markdown block identity", () => {
  it("normalizes admitted Markdown deterministically", () => {
    const source = "# Title  \r\n\r\nParagraph.   \r\n";
    expect(normalizeMarkdown(source)).toBe("# Title\n\nParagraph.\n");
    expect(normalizeMarkdown(normalizeMarkdown(source))).toBe(normalizeMarkdown(source));
  });

  it("canonicalizes cross-store comparison bytes", () => {
    expect(normalizeMarkdown("  # Title  \r\n\r\nBody with tabs\t \r\n\r\n"))
      .toBe("# Title\n\nBody with tabs\n");
    expect(normalizeMarkdown("\n\t\n")).toBe("");
  });

  it("does not split a fenced code block at internal blank lines", () => {
    expect(splitMarkdownBlocks("Before\n\n```ts\nconst a = 1;\n\nconst b = 2;\n```\n\nAfter")).toEqual([
      "Before",
      "```ts\nconst a = 1;\n\nconst b = 2;\n```",
      "After",
    ]);
  });

  it("preserves an edited block identity and gives an inserted block a new identity", () => {
    const first = reconcileBlocks("# Title\n\nA stable paragraph about ontology.\n\nThe ending.", [], 1);
    const edited = reconcileBlocks(
      "# Title\n\nA stable paragraph about product ontology and practice.\n\nA newly inserted example.\n\nThe ending.",
      first.blocks,
      first.nextIdentity,
    );
    expect(edited.blocks[0].blockId).toBe(first.blocks[0].blockId);
    expect(edited.blocks[1].blockId).toBe(first.blocks[1].blockId);
    expect(edited.blocks[3].blockId).toBe(first.blocks[2].blockId);
    expect(first.blocks.some((block) => block.blockId === edited.blocks[2].blockId)).toBe(false);
  });
});
