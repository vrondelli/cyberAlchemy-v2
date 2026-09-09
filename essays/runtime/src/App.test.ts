import { describe, expect, it } from "vitest";
import { countMarkdownWords, selectEditorInitialMarkdown } from "./App";

describe("Essays staged editor boundary", () => {
  const stagedBuffer = {
    workspaceId: "workspace-1",
    proposalId: "proposal-1",
    stageEpoch: 42,
    markdown: "# Proposed canonical buffer\n",
  };

  it("selects a new stage only for the matching planned workspace", () => {
    expect(selectEditorInitialMarkdown({
      draftMarkdown: "# Writer saved draft\n",
      workspaceId: "workspace-1",
      hasCompositionPlan: true,
      stagedBuffer,
      appliedStageEpoch: null,
    })).toBe(stagedBuffer.markdown);

    expect(selectEditorInitialMarkdown({
      draftMarkdown: "# Writer saved draft\n",
      workspaceId: "other-workspace",
      hasCompositionPlan: true,
      stagedBuffer,
      appliedStageEpoch: null,
    })).toBe("# Writer saved draft\n");
  });

  it("does not reapply an already consumed stage over a later writer save", () => {
    expect(selectEditorInitialMarkdown({
      draftMarkdown: "# Later divergent writer save\n",
      workspaceId: "workspace-1",
      hasCompositionPlan: true,
      stagedBuffer,
      appliedStageEpoch: 42,
    })).toBe("# Later divergent writer save\n");
  });
});

describe("Essays word counting", () => {
  it("counts Markdown words without treating repeated whitespace as content", () => {
    expect(countMarkdownWords("# Ferrari\n\nA  fast\tworkspace.\n")).toBe(5);
    expect(countMarkdownWords("   \n\t")).toBe(0);
  });
});
