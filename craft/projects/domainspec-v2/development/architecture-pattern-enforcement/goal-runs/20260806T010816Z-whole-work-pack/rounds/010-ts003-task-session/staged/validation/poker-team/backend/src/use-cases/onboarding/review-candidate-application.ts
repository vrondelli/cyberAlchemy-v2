import {
  CandidateApplication,
  ReviewDecision,
} from "../../domain/onboarding/candidate-application.entity";
import { CandidateApplicationRepository } from "../../domain/onboarding/candidate-application.repository";
import {
  decideReviewTransition,
  ensureReviewableApplication,
} from "../../domain/onboarding/candidate-review-policy.service";
import type { PlayerIntakeHandoffGateway } from "../../domain/onboarding/player-intake-handoff.contract";
import {
  calculationDrift,
  createCounter,
  createHistogram,
  eventConsume,
  eventConsumerLag,
  eventEmit,
  funnelStep,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
  statePopulation,
  stateTransition,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

const FEATURE = "player-onboarding";
const OPERATION = "ReviewCandidateApplication";
const WORKFLOW = "CandidateReviewWorkflow";

const businessReviewDecision = createCounter("business.review_decision", {
  unit: "{decision}",
  description: "Onboarding review decisions by outcome (O13)",
});

const businessTimeToReview = createHistogram("business.time_to_review", {
  unit: "s",
  description: "Time from submission to review decision (O13)",
});

export const reviewCandidateApplicationUseCase =
  (
    repo: CandidateApplicationRepository,
    dependencies?: {
      intakeGateway?: PlayerIntakeHandoffGateway;
    },
  ) =>
  async (input: {
    id: string;
    reviewedBy: string;
    decision: ReviewDecision;
    reviewDecisionNote?: string;
  }): Promise<CandidateApplication> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      const current = ensureReviewableApplication(await repo.findById(input.id));
      if (current.status === "SUBMITTED") {
        stateTransition.add(1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          from: "SUBMITTED",
          to: "UNDER_REVIEW",
          event: "StartManualReview",
        });
        statePopulation.add(-1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          state: "SUBMITTED",
        });
        statePopulation.add(1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          state: "UNDER_REVIEW",
        });
      }

      const transition = decideReviewTransition(input.decision, new Date());

      const updated = await repo.review(input.id, {
        status: transition.status,
        reviewedBy: input.reviewedBy,
        reviewDecisionNote: input.reviewDecisionNote,
        retentionUntil: transition.retentionUntil,
      });

      if (!updated) {
        throw ensureReviewableApplication(null);
      }

      stateTransition.add(1, {
        feature: FEATURE,
        entity: "CandidateApplication",
        from: current.status,
        to: updated.status,
        event: updated.status === "APPROVED" ? "ReviewApprove" : "ReviewReject",
      });
      statePopulation.add(-1, {
        feature: FEATURE,
        entity: "CandidateApplication",
        state: current.status,
      });
      statePopulation.add(1, {
        feature: FEATURE,
        entity: "CandidateApplication",
        state: updated.status,
      });

      calculationDrift.record(0, {
        feature: FEATURE,
        operation: OPERATION,
        calculation_id: "C1",
      });

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "review_persisted",
        result: updated.reviewedAt ? "satisfied" : "violated",
      });

      businessReviewDecision.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        decision: updated.status,
      });
      if (updated.reviewedAt) {
        businessTimeToReview.record(
          (updated.reviewedAt.getTime() - updated.submittedAt.getTime()) / 1000,
          {
            feature: FEATURE,
            capability: OPERATION,
          },
        );
      }

      if (updated.status === "APPROVED" && updated.reviewedAt) {
        await dependencies?.intakeGateway?.publishApprovedCandidate({
          applicationId: updated.id,
          candidateFullName: updated.fullName,
          candidateEmail: updated.email,
          candidateWhatsapp: updated.whatsapp,
          approvedBy: input.reviewedBy,
          approvedAt: updated.reviewedAt,
          acceptedRegulationVersion: updated.acceptedRegulationVersion,
          acceptedRegulationAt: updated.acceptedRegulationAt,
        });

        eventEmit.add(1, {
          feature: FEATURE,
          event_type: "CandidateApprovedForIntake",
        });
        eventConsume.add(1, {
          feature: FEATURE,
          event_type: "CandidateApprovedForIntake",
          consumer: "player_intake",
        });
        eventConsumerLag.record(0, {
          feature: FEATURE,
          event_type: "CandidateApprovedForIntake",
          consumer: "player_intake",
        });
      }

      funnelStep.add(1, {
        feature: FEATURE,
        journey: "onboarding",
        step_name: "reviewed",
        outcome: updated.status === "APPROVED" ? "approved" : "rejected",
      });

      operationResult = "success";
      return updated;
    } catch (error) {
      const typedError = error as { code?: string };

      if (typedError.code === "NOT_FOUND") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
      }
      if (typedError.code === "VALIDATION_ERROR") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
      }

      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "review_transition",
      });
      throw error;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        result: operationResult,
      });
      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: OPERATION,
      });

      workflowInvocation.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        result: operationResult === "success" ? "completed" : "failed",
      });
      workflowDuration.record(durationSec, {
        feature: FEATURE,
        workflow: WORKFLOW,
      });
    }
  };
