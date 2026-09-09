import { reconcileBlocks } from "./markdown";
import {
  EssaysProblem,
  type AddressableEditorialReview,
  type CompositionPlan,
  type EditorialResidueItem,
  type EssayExportManifest,
  type EssaysEvent,
  type EssayWorkspace,
  type ReviewComment,
  type ReviewDisposition,
  type TextIntent,
  type Writer,
} from "./model";
import type { WorkspaceRepository } from "../ports/workspace-repository";

export interface CreateEssayWorkspaceInput {
  workspaceId: string;
  title: string;
  writer: Writer;
}

export interface CaptureTextIntentInput {
  workspaceId: string;
  expectedRevision: number;
  objective: string;
  audience: string;
  tone: string;
  constraints: string[];
}

export interface SaveDraftRevisionInput {
  workspaceId: string;
  expectedRevision: number;
  markdown: string;
}

export interface ResolveEditorialReviewInput {
  workspaceId: string;
  expectedRevision: number;
  commentId: string;
  disposition: Exclude<ReviewDisposition, "open">;
  dispositionNote: string;
  writerApprovedMarkdown?: string;
}

export interface EssaysRuntimeInterface {
  openEssayWorkspace(workspaceId: string): Promise<EssayWorkspace | null>;
  createEssayWorkspace(input: CreateEssayWorkspaceInput): Promise<EssayWorkspace>;
  startEssay(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace>;
  captureTextIntent(input: CaptureTextIntentInput): Promise<EssayWorkspace>;
  generateCompositionPlan(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace>;
  saveDraftRevision(input: SaveDraftRevisionInput): Promise<EssayWorkspace>;
  openEditorialReview(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace>;
  resolveEditorialReview(input: ResolveEditorialReviewInput): Promise<EssayWorkspace>;
  validateEssay(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace>;
  exportReviewableEssay(
    workspaceId: string,
    expectedRevision: number,
  ): Promise<{ workspace: EssayWorkspace; manifest: EssayExportManifest }>;
}

type Clock = () => string;

function required(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new EssaysProblem("INVALID_INPUT", `${field} is required`, { field });
  return trimmed;
}

function nextId(workspace: EssayWorkspace, prefix: string): string {
  const id = `${prefix}-${String(workspace.nextIdentity).padStart(4, "0")}`;
  workspace.nextIdentity += 1;
  return id;
}

function clone(workspace: EssayWorkspace): EssayWorkspace {
  return structuredClone(workspace);
}

export class EssaysRuntime implements EssaysRuntimeInterface {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly clock: Clock = () => new Date().toISOString(),
  ) {}

  openEssayWorkspace(workspaceId: string): Promise<EssayWorkspace | null> {
    return this.repository.load(workspaceId);
  }

  async createEssayWorkspace(input: CreateEssayWorkspaceInput): Promise<EssayWorkspace> {
    const workspaceId = required(input.workspaceId, "workspaceId");
    if (await this.repository.load(workspaceId)) {
      throw new EssaysProblem("WORKSPACE_ALREADY_EXISTS", "This workspace already exists", { workspaceId });
    }
    const now = this.clock();
    const workspace: EssayWorkspace = {
      schemaVersion: "essays-workspace/v1",
      workspaceId,
      title: required(input.title, "title"),
      writer: {
        writerId: required(input.writer.writerId, "writer.writerId"),
        displayName: required(input.writer.displayName, "writer.displayName"),
      },
      lifecycleStage: "intent",
      currentRevision: 0,
      nextIdentity: 1,
      textIntent: null,
      compositionPlan: null,
      essay: null,
      review: null,
      residue: null,
      lastEvent: null,
      updatedAt: now,
    };
    this.advance(workspace, "WorkspaceCreated");
    await this.repository.save(workspace, null);
    return clone(workspace);
  }

  async startEssay(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace> {
    return this.mutate(workspaceId, expectedRevision, (workspace) => {
      if (workspace.essay) return "EssayStarted";
      const now = this.clock();
      workspace.essay = {
        essayId: nextId(workspace, "essay"),
        markdown: "",
        blockIndex: [],
        revision: 0,
        validationStatus: "not-validated",
        exportEligible: false,
        revisionHistory: [],
      };
      workspace.lifecycleStage = "intent";
      workspace.updatedAt = now;
      return "EssayStarted";
    });
  }

  async captureTextIntent(input: CaptureTextIntentInput): Promise<EssayWorkspace> {
    return this.mutate(input.workspaceId, input.expectedRevision, (workspace) => {
      this.requireEssay(workspace);
      const intent: TextIntent = {
        objective: required(input.objective, "objective"),
        audience: required(input.audience, "audience"),
        tone: required(input.tone, "tone"),
        constraints: input.constraints.map((item) => item.trim()).filter(Boolean),
        acceptedAt: this.clock(),
      };
      workspace.textIntent = intent;
      workspace.compositionPlan = null;
      workspace.lifecycleStage = "intent";
      this.invalidateValidation(workspace);
      return "TextIntentCaptured";
    });
  }

  async generateCompositionPlan(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace> {
    return this.mutate(workspaceId, expectedRevision, (workspace) => {
      const essay = this.requireEssay(workspace);
      const intent = workspace.textIntent;
      if (!intent) {
        throw new EssaysProblem("INVALID_LIFECYCLE_STAGE", "Capture and accept the text intent first");
      }
      const plan: CompositionPlan = {
        planId: nextId(workspace, "plan"),
        narrativeAnchor: `A concrete moment that reveals why ${intent.objective.toLocaleLowerCase()} matters to ${intent.audience}.`,
        sections: [
          "Open with the concrete situation and its felt consequence",
          "Name the governing idea without flattening the problem",
          "Develop the mechanism through one credible example",
          "Test the idea against an objection or failure case",
          "End with the implication the reader can carry forward",
        ],
        validationChecklist: [
          `The draft serves ${intent.audience}`,
          `The voice remains ${intent.tone}`,
          "Every section advances the argument",
          "Claims and uncertainty remain distinguishable",
          ...intent.constraints.map((constraint) => `Constraint: ${constraint}`),
        ],
        acceptedAt: this.clock(),
        generator: "essays-local-deterministic",
      };
      workspace.compositionPlan = plan;
      workspace.lifecycleStage = essay.revision > 0 ? "draft" : "plan";
      this.invalidateValidation(workspace);
      return "CompositionPlanGenerated";
    });
  }

  async saveDraftRevision(input: SaveDraftRevisionInput): Promise<EssayWorkspace> {
    return this.mutate(input.workspaceId, input.expectedRevision, (workspace) => {
      const essay = this.requireEssay(workspace);
      if (!workspace.compositionPlan) {
        throw new EssaysProblem("INVALID_LIFECYCLE_STAGE", "Accept a composition plan before saving a draft");
      }
      const reconciled = reconcileBlocks(input.markdown, essay.blockIndex, workspace.nextIdentity);
      if (!reconciled.markdown) {
        throw new EssaysProblem("INVALID_INPUT", "Draft Markdown cannot be empty", { field: "markdown" });
      }
      workspace.nextIdentity = reconciled.nextIdentity;
      essay.revision += 1;
      essay.markdown = reconciled.markdown;
      essay.blockIndex = reconciled.blocks;
      essay.revisionHistory.push({
        revision: essay.revision,
        markdown: essay.markdown,
        blockIndex: structuredClone(essay.blockIndex),
        acceptedAt: this.clock(),
      });
      if (workspace.review) workspace.review.status = "stale";
      workspace.lifecycleStage = "draft";
      this.invalidateValidation(workspace);
      return "DraftRevisionSaved";
    });
  }

  async openEditorialReview(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace> {
    return this.mutate(workspaceId, expectedRevision, (workspace) => {
      const essay = this.requireDraft(workspace);
      const comments = this.reviewComments(workspace);
      const review: AddressableEditorialReview = {
        reviewId: nextId(workspace, "review"),
        essayRef: essay.essayId,
        reviewedRevision: essay.revision,
        comments,
        status: comments.some((comment) => comment.disposition === "open") ? "open" : "resolved",
        openedAt: this.clock(),
      };
      workspace.review = review;
      workspace.lifecycleStage = "review";
      this.invalidateValidation(workspace);
      return "EditorialReviewOpened";
    });
  }

  async resolveEditorialReview(input: ResolveEditorialReviewInput): Promise<EssayWorkspace> {
    return this.mutate(input.workspaceId, input.expectedRevision, (workspace) => {
      const review = workspace.review;
      const essay = this.requireDraft(workspace);
      if (!review) throw new EssaysProblem("REVIEW_NOT_FOUND", "Open an editorial review first");
      if (review.status === "stale") {
        throw new EssaysProblem("INVALID_LIFECYCLE_STAGE", "The review is stale; open a review for the current draft");
      }
      const comment = review.comments.find((item) => item.commentId === input.commentId);
      if (!comment) throw new EssaysProblem("COMMENT_NOT_FOUND", "Review comment not found", { commentId: input.commentId });
      comment.disposition = input.disposition;
      comment.dispositionNote = required(input.dispositionNote, "dispositionNote");
      comment.resolvedAt = this.clock();

      if (input.writerApprovedMarkdown !== undefined) {
        if (input.disposition !== "accepted") {
          throw new EssaysProblem("INVALID_INPUT", "Only an accepted comment may carry writer-approved Markdown");
        }
        const reconciled = reconcileBlocks(input.writerApprovedMarkdown, essay.blockIndex, workspace.nextIdentity);
        if (!reconciled.markdown) throw new EssaysProblem("INVALID_INPUT", "Approved Markdown cannot be empty");
        workspace.nextIdentity = reconciled.nextIdentity;
        essay.revision += 1;
        essay.markdown = reconciled.markdown;
        essay.blockIndex = reconciled.blocks;
        essay.revisionHistory.push({
          revision: essay.revision,
          markdown: essay.markdown,
          blockIndex: structuredClone(essay.blockIndex),
          acceptedAt: this.clock(),
        });
        review.status = "stale";
        workspace.lifecycleStage = "draft";
      } else {
        review.status = review.comments.some((item) => item.disposition === "open") ? "open" : "resolved";
      }
      this.invalidateValidation(workspace);
      return "EditorialReviewResolved";
    });
  }

  async validateEssay(workspaceId: string, expectedRevision: number): Promise<EssayWorkspace> {
    return this.mutate(workspaceId, expectedRevision, (workspace) => {
      const essay = this.requireDraft(workspace);
      const items: EditorialResidueItem[] = [];
      const add = (
        category: EditorialResidueItem["category"],
        message: string,
        blocking: boolean,
        blockId: string | null = null,
      ) => items.push({ itemId: nextId(workspace, "residue-item"), category, message, blocking, blockId });

      if (!workspace.textIntent) add("intent", "The draft has no accepted text intent.", true);
      if (!workspace.compositionPlan) add("structure", "The draft has no accepted composition plan.", true);
      if (!/^#\s+\S/m.test(essay.markdown)) add("structure", "Add one level-one title before export.", true, essay.blockIndex[0]?.blockId ?? null);
      if (essay.markdown.split(/\s+/).filter(Boolean).length < 120) {
        add("confidence", "The draft is under 120 words; confirm that its brevity is intentional.", false);
      }
      if (!workspace.review || workspace.review.reviewedRevision !== essay.revision || workspace.review.status === "stale") {
        add("review", "Open an editorial review for the current draft revision.", true);
      } else {
        for (const comment of workspace.review.comments.filter((item) => item.disposition === "open")) {
          add(
            "review",
            `Unresolved ${comment.priority} review comment: ${comment.comment}`,
            comment.priority === "blocking",
            comment.blockId,
          );
        }
      }
      if (/\b(?:TODO|TBD|citation needed)\b/i.test(essay.markdown)) {
        add("provenance", "The draft contains an unresolved placeholder or citation marker.", true);
      }

      const blockingCount = items.filter((item) => item.blocking).length;
      workspace.residue = {
        residueId: nextId(workspace, "residue"),
        essayRef: essay.essayId,
        validatedRevision: essay.revision,
        items,
        blockingCount,
        createdAt: this.clock(),
      };
      essay.validationStatus = blockingCount === 0 ? "ready" : "blocked";
      essay.exportEligible = blockingCount === 0;
      workspace.lifecycleStage = blockingCount === 0 ? "validated" : "review";
      return "EssayValidated";
    });
  }

  async exportReviewableEssay(
    workspaceId: string,
    expectedRevision: number,
  ): Promise<{ workspace: EssayWorkspace; manifest: EssayExportManifest }> {
    const current = await this.requireWorkspace(workspaceId);
    this.assertRevision(current, expectedRevision);
    const workspace = clone(current);
    const essay = this.requireDraft(workspace);
    const residue = workspace.residue;
    const openBlocking = workspace.review?.comments.filter(
      (comment) => comment.priority === "blocking" && comment.disposition === "open",
    ) ?? [];
    if (
      !essay.exportEligible ||
      essay.validationStatus !== "ready" ||
      !residue ||
      residue.validatedRevision !== essay.revision ||
      residue.blockingCount > 0 ||
      openBlocking.length > 0
    ) {
      throw new EssaysProblem("EXPORT_BLOCKED", "Resolve blocking review and residue, then validate the current revision", {
        validationStatus: essay.validationStatus,
        blockingResidue: residue?.blockingCount ?? null,
        openBlockingComments: openBlocking.length,
      });
    }
    const exportedAt = this.clock();
    const manifest: EssayExportManifest = {
      schemaVersion: "essays-reviewable-export/v1",
      workspaceId: workspace.workspaceId,
      essayId: essay.essayId,
      essayRevision: essay.revision,
      markdown: essay.markdown,
      blocks: structuredClone(essay.blockIndex),
      review: structuredClone(workspace.review),
      residue: structuredClone(residue),
      exportedAt,
      publicationEffect: "none",
    };
    this.advance(workspace, "EssayExported");
    await this.repository.save(workspace, current.currentRevision);
    return { workspace: clone(workspace), manifest };
  }

  private async mutate(
    workspaceId: string,
    expectedRevision: number,
    change: (workspace: EssayWorkspace) => EssaysEvent["eventType"],
  ): Promise<EssayWorkspace> {
    const current = await this.requireWorkspace(workspaceId);
    this.assertRevision(current, expectedRevision);
    const workspace = clone(current);
    const eventType = change(workspace);
    this.advance(workspace, eventType);
    try {
      await this.repository.save(workspace, current.currentRevision);
    } catch (error) {
      throw new EssaysProblem("REVISION_CONFLICT", "Workspace changed before this operation could be saved", {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
    return clone(workspace);
  }

  private async requireWorkspace(workspaceId: string): Promise<EssayWorkspace> {
    const workspace = await this.repository.load(workspaceId);
    if (!workspace) throw new EssaysProblem("WORKSPACE_NOT_FOUND", "Essay workspace not found", { workspaceId });
    return workspace;
  }

  private assertRevision(workspace: EssayWorkspace, expectedRevision: number): void {
    if (workspace.currentRevision !== expectedRevision) {
      throw new EssaysProblem("REVISION_CONFLICT", "Workspace revision does not match", {
        expectedRevision,
        actualRevision: workspace.currentRevision,
      });
    }
  }

  private requireEssay(workspace: EssayWorkspace) {
    if (!workspace.essay) throw new EssaysProblem("INVALID_LIFECYCLE_STAGE", "Start the essay first");
    return workspace.essay;
  }

  private requireDraft(workspace: EssayWorkspace) {
    const essay = this.requireEssay(workspace);
    if (essay.revision === 0 || !essay.markdown) {
      throw new EssaysProblem("INVALID_LIFECYCLE_STAGE", "Save a writer-approved draft first");
    }
    return essay;
  }

  private invalidateValidation(workspace: EssayWorkspace): void {
    if (workspace.essay) {
      workspace.essay.validationStatus = "not-validated";
      workspace.essay.exportEligible = false;
    }
    workspace.residue = null;
  }

  private advance(workspace: EssayWorkspace, eventType: EssaysEvent["eventType"]): void {
    workspace.currentRevision += 1;
    const now = this.clock();
    workspace.updatedAt = now;
    workspace.lastEvent = {
      eventId: nextId(workspace, "event"),
      eventType,
      workspaceId: workspace.workspaceId,
      workspaceRevision: workspace.currentRevision,
      occurredAt: now,
    };
  }

  private reviewComments(workspace: EssayWorkspace): ReviewComment[] {
    const essay = this.requireDraft(workspace);
    const comments: ReviewComment[] = [];
    const add = (
      blockIndex: number,
      issueType: ReviewComment["issueType"],
      requestedChangeMode: ReviewComment["requestedChangeMode"],
      priority: ReviewComment["priority"],
      comment: string,
      selectedText = "",
    ) => {
      const block = essay.blockIndex[Math.min(blockIndex, essay.blockIndex.length - 1)];
      if (!block) return;
      comments.push({
        commentId: nextId(workspace, "comment"),
        blockId: block.blockId,
        partId: block.partId,
        selectedText,
        issueType,
        requestedChangeMode,
        priority,
        comment,
        originalBlockText: block.markdown,
        disposition: "open",
        dispositionNote: null,
        resolvedAt: null,
      });
    };

    if (!/^#\s+\S/.test(essay.blockIndex[0]?.markdown ?? "")) {
      add(0, "structure", "revise", "blocking", "Give the essay one clear level-one title.");
    }
    essay.blockIndex.forEach((block, index) => {
      if (/\b(?:TODO|TBD|citation needed)\b/i.test(block.markdown)) {
        add(index, "evidence", "verify", "blocking", "Resolve the placeholder or preserve a precise source gap.");
      }
      const wordCount = block.markdown.split(/\s+/).filter(Boolean).length;
      if (block.kind === "paragraph" && wordCount > 90) {
        add(index, "clarity", "consider", "advisory", "This paragraph carries several moves; consider giving each block one job.");
      }
    });
    if (essay.blockIndex.length < 3) {
      add(essay.blockIndex.length - 1, "completion", "consider", "advisory", "Check whether the argument has enough movement from opening to consequence.");
    }
    return comments;
  }
}
