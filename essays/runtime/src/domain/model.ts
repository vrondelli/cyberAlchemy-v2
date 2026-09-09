export type LifecycleStage = "intent" | "plan" | "draft" | "review" | "validated";
export type ValidationStatus = "not-validated" | "blocked" | "ready";
export type ReviewStatus = "open" | "resolved" | "stale";
export type ReviewDisposition = "open" | "accepted" | "dismissed";
export type ReviewPriority = "blocking" | "advisory";

export interface Writer {
  writerId: string;
  displayName: string;
}

export interface TextIntent {
  objective: string;
  audience: string;
  tone: string;
  constraints: string[];
  acceptedAt: string;
}

export interface CompositionPlan {
  planId: string;
  narrativeAnchor: string;
  sections: string[];
  validationChecklist: string[];
  acceptedAt: string;
  generator: "essays-local-deterministic";
}

export interface StableBlock {
  blockId: string;
  partId: string;
  ordinal: number;
  kind: string;
  markdown: string;
}

export interface DraftRevision {
  revision: number;
  markdown: string;
  blockIndex: StableBlock[];
  acceptedAt: string;
}

export interface ReviewComment {
  commentId: string;
  blockId: string;
  partId: string;
  selectedText: string;
  issueType: "structure" | "clarity" | "evidence" | "completion";
  requestedChangeMode: "revise" | "verify" | "consider";
  priority: ReviewPriority;
  comment: string;
  originalBlockText: string;
  disposition: ReviewDisposition;
  dispositionNote: string | null;
  resolvedAt: string | null;
}

export interface AddressableEditorialReview {
  reviewId: string;
  essayRef: string;
  reviewedRevision: number;
  comments: ReviewComment[];
  status: ReviewStatus;
  openedAt: string;
}

export interface EditorialResidueItem {
  itemId: string;
  category: "intent" | "structure" | "review" | "provenance" | "confidence";
  message: string;
  blocking: boolean;
  blockId: string | null;
}

export interface EditorialResidue {
  residueId: string;
  essayRef: string;
  validatedRevision: number;
  items: EditorialResidueItem[];
  blockingCount: number;
  createdAt: string;
}

export interface ReviewableEssay {
  essayId: string;
  markdown: string;
  blockIndex: StableBlock[];
  revision: number;
  validationStatus: ValidationStatus;
  exportEligible: boolean;
  revisionHistory: DraftRevision[];
}

export interface EssayWorkspace {
  schemaVersion: "essays-workspace/v1";
  workspaceId: string;
  title: string;
  writer: Writer;
  lifecycleStage: LifecycleStage;
  currentRevision: number;
  nextIdentity: number;
  textIntent: TextIntent | null;
  compositionPlan: CompositionPlan | null;
  essay: ReviewableEssay | null;
  review: AddressableEditorialReview | null;
  residue: EditorialResidue | null;
  lastEvent: EssaysEvent | null;
  updatedAt: string;
}

export interface EssaysEvent {
  eventId: string;
  eventType:
    | "WorkspaceCreated"
    | "EssayStarted"
    | "TextIntentCaptured"
    | "CompositionPlanGenerated"
    | "DraftRevisionSaved"
    | "EditorialReviewOpened"
    | "EditorialReviewResolved"
    | "EssayValidated"
    | "EssayExported";
  workspaceId: string;
  workspaceRevision: number;
  occurredAt: string;
}

export interface EssayExportManifest {
  schemaVersion: "essays-reviewable-export/v1";
  workspaceId: string;
  essayId: string;
  essayRevision: number;
  markdown: string;
  blocks: StableBlock[];
  review: AddressableEditorialReview | null;
  residue: EditorialResidue;
  exportedAt: string;
  publicationEffect: "none";
}

export class EssaysProblem extends Error {
  constructor(
    public readonly code:
      | "WORKSPACE_NOT_FOUND"
      | "WORKSPACE_ALREADY_EXISTS"
      | "REVISION_CONFLICT"
      | "INVALID_LIFECYCLE_STAGE"
      | "INVALID_INPUT"
      | "REVIEW_NOT_FOUND"
      | "COMMENT_NOT_FOUND"
      | "EXPORT_BLOCKED",
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "EssaysProblem";
  }
}
