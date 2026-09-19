import {
  CandidateApplication,
  ReviewDecision,
} from "./candidate-application.entity";
import { DomainError } from "../errors";
import type { OnboardingPolicyError } from "./candidate-application-policy.service";

const withError = (
  message: string,
  _statusCode: number,
  code: string,
  details?: unknown,
): OnboardingPolicyError => {
  return new DomainError(code, message, details);
};

export type ReviewTransitionResult = {
  status: "APPROVED" | "REJECTED";
  retentionUntil?: Date;
};

export const ensureReviewableApplication = (
  application: CandidateApplication | null,
): CandidateApplication => {
  if (!application) {
    throw withError("Candidate application not found", 404, "NOT_FOUND");
  }

  if (
    application.status !== "SUBMITTED" &&
    application.status !== "UNDER_REVIEW"
  ) {
    throw withError(
      "Candidate application cannot be reviewed in current status",
      400,
      "VALIDATION_ERROR",
    );
  }

  return application;
};

export const decideReviewTransition = (
  decision: ReviewDecision,
  reviewedAt: Date,
): ReviewTransitionResult => {
  if (decision === "APPROVE") {
    return { status: "APPROVED" };
  }

  if (decision === "REJECT") {
    return {
      status: "REJECTED",
      retentionUntil: new Date(
        reviewedAt.getTime() + 365 * 24 * 60 * 60 * 1000,
      ),
    };
  }

  throw withError("Invalid review decision", 400, "VALIDATION_ERROR", {
    field: "decision",
  });
};
