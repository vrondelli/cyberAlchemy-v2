import { describe, expect, it } from "vitest";
import { EssaysProblem } from "./model";
import { EssaysRuntime } from "./runtime";
import { MemoryWorkspaceRepository } from "../ports/workspace-repository";

const clock = () => "2026-08-30T12:00:00.000Z";

async function preparedRuntime() {
  const runtime = new EssaysRuntime(new MemoryWorkspaceRepository(), clock);
  let workspace = await runtime.createEssayWorkspace({
    workspaceId: "workspace-1",
    title: "Ontology as Product Practice",
    writer: { writerId: "writer-1", displayName: "Writer" },
  });
  workspace = await runtime.startEssay(workspace.workspaceId, workspace.currentRevision);
  workspace = await runtime.captureTextIntent({
    workspaceId: workspace.workspaceId,
    expectedRevision: workspace.currentRevision,
    objective: "Explain ontology engineering through a believable debugging story",
    audience: "Engineers and product leaders",
    tone: "Technical and narrative",
    constraints: ["Preserve fault evidence"],
  });
  workspace = await runtime.generateCompositionPlan(workspace.workspaceId, workspace.currentRevision);
  return { runtime, workspace };
}

describe("EssaysRuntimeInterface", () => {
  it("rejects stale expected revisions", async () => {
    const { runtime, workspace } = await preparedRuntime();
    await expect(runtime.saveDraftRevision({
      workspaceId: workspace.workspaceId,
      expectedRevision: workspace.currentRevision - 1,
      markdown: "# Draft\n\nText.",
    })).rejects.toMatchObject({ code: "REVISION_CONFLICT" } satisfies Partial<EssaysProblem>);
  });

  it("never changes authoritative prose when a review disposition is recorded", async () => {
    const { runtime, workspace: prepared } = await preparedRuntime();
    let workspace = await runtime.saveDraftRevision({
      workspaceId: prepared.workspaceId,
      expectedRevision: prepared.currentRevision,
      markdown: "A draft without a title.\n\nIt has a second block.\n\nIt has an ending.",
    });
    workspace = await runtime.openEditorialReview(workspace.workspaceId, workspace.currentRevision);
    const comment = workspace.review!.comments.find((item) => item.priority === "blocking")!;
    const markdownBefore = workspace.essay!.markdown;
    workspace = await runtime.resolveEditorialReview({
      workspaceId: workspace.workspaceId,
      expectedRevision: workspace.currentRevision,
      commentId: comment.commentId,
      disposition: "dismissed",
      dispositionNote: "Writer deliberately uses an untitled form.",
    });
    expect(workspace.essay!.markdown).toBe(markdownBefore);
    expect(workspace.review!.comments[0].disposition).toBe("dismissed");
  });

  it("blocks export while blocking review or residue remains", async () => {
    const { runtime, workspace: prepared } = await preparedRuntime();
    let workspace = await runtime.saveDraftRevision({
      workspaceId: prepared.workspaceId,
      expectedRevision: prepared.currentRevision,
      markdown: "Draft without title.\n\nTODO verify the failure evidence.\n\nClosing thought.",
    });
    workspace = await runtime.openEditorialReview(workspace.workspaceId, workspace.currentRevision);
    workspace = await runtime.validateEssay(workspace.workspaceId, workspace.currentRevision);
    expect(workspace.essay!.exportEligible).toBe(false);
    expect(workspace.residue!.blockingCount).toBeGreaterThan(0);
    await expect(runtime.exportReviewableEssay(workspace.workspaceId, workspace.currentRevision))
      .rejects.toMatchObject({ code: "EXPORT_BLOCKED" } satisfies Partial<EssaysProblem>);
  });

  it("exports the exact writer-approved revision after both gates pass", async () => {
    const { runtime, workspace: prepared } = await preparedRuntime();
    const paragraph = "A bug ticket said availability was wrong, so the engineer followed the request through logs, projections, and policy boundaries until the missing distinction became visible to the whole team.";
    const markdown = `# Ontology as Product Practice\n\n${paragraph} ${paragraph}\n\n## The mechanism\n\n${paragraph} ${paragraph}\n\n## What remains\n\n${paragraph}`;
    let workspace = await runtime.saveDraftRevision({
      workspaceId: prepared.workspaceId,
      expectedRevision: prepared.currentRevision,
      markdown,
    });
    workspace = await runtime.openEditorialReview(workspace.workspaceId, workspace.currentRevision);
    expect(workspace.review!.comments.filter((item) => item.priority === "blocking")).toHaveLength(0);
    workspace = await runtime.validateEssay(workspace.workspaceId, workspace.currentRevision);
    expect(workspace.essay!.exportEligible).toBe(true);
    const result = await runtime.exportReviewableEssay(workspace.workspaceId, workspace.currentRevision);
    expect(result.manifest.markdown).toBe(workspace.essay!.markdown);
    expect(result.manifest.essayRevision).toBe(workspace.essay!.revision);
    expect(result.manifest.publicationEffect).toBe("none");
    expect(result.workspace.lastEvent?.eventType).toBe("EssayExported");
  });
});
