import { CandidateApplication } from "../../domain/onboarding/candidate-application.entity";
import { CandidateApplicationRepository } from "../../domain/onboarding/candidate-application.repository";
import type { CandidateSubmissionRequest } from "@poker-team/shared/onboarding-contracts";
import {
  duplicateCandidateError,
  validateCandidateSubmission,
} from "../../domain/onboarding/candidate-application-policy.service";
import {
  calculationDrift,
  createCounter,
  funnelConversionRate,
  funnelStep,
  invariantViolation,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
  stateInvalidTransition,
  statePopulation,
  stateTransition,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

const CANDIDATE_DUPLICATE_CONSTRAINTS = new Set([
  "candidate_applications_whatsapp_unique",
  "candidate_applications_email_unique",
]);

const FEATURE = "player-onboarding";
const OPERATION = "SubmitCandidateApplication";
const WORKFLOW = "CandidateOnboardingFlow";

const businessApplicationsSubmitted = createCounter(
  "business.applications_submitted",
  {
    unit: "{application}",
    description: "Onboarding applications submitted (O13)",
  },
);

const businessDuplicateBlocked = createCounter("business.duplicate_blocked", {
  unit: "{application}",
  description: "Duplicate onboarding applications blocked (O13)",
});

const resolveSubmitRuleId = (error: unknown): string | null => {
  const typedError = error as {
    code?: string;
    details?: { field?: string };
  };

  if (typedError.code === "DUPLICATE_CANDIDATE") return "R5";
  if (typedError.code === "LGPD_CONSENT_REQUIRED") return "R2";
  if (typedError.code !== "VALIDATION_ERROR") return null;

  if (
    typedError.details?.field === "acceptedRegulationVersion" ||
    typedError.details?.field === "acceptedRegulationAt"
  ) {
    return "R1";
  }
  if (typedError.details?.field === "email") return "R4";
  if (typedError.details?.field === "preferredTimeWindows") return "R6";
  if (typedError.details?.field === "trackerDetail") return "R7";
  if (typedError.details?.field === "cityState") return "R8";
  if (typedError.details?.field === "birthDate") return "R9";

  return "R3";
};

const isDuplicateCandidateConstraintError = (error: unknown): boolean => {
  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  if (dbError?.code !== "23505") {
    return false;
  }

  if (!dbError.constraint) {
    return true;
  }

  return CANDIDATE_DUPLICATE_CONSTRAINTS.has(dbError.constraint);
};

export const submitCandidateApplicationUseCase =
  (repo: CandidateApplicationRepository) =>
  async (input: CandidateSubmissionRequest): Promise<CandidateApplication> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      const { createInput, canonicalEmail, whatsapp } =
        validateCandidateSubmission(input);

      const duplicate = await repo.findDuplicateByContact(
        whatsapp,
        canonicalEmail,
      );
      if (duplicate) {
        stateInvalidTransition.add(1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          from: "new",
          attempted_event: "SubmitCandidateApplication",
          error_code: "DUPLICATE_CANDIDATE",
        });
        throw duplicateCandidateError();
      }

      try {
        const created = await repo.create(createInput);

        stateTransition.add(1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          from: "new",
          to: "SUBMITTED",
          event: "SubmitCandidateApplication",
        });
        statePopulation.add(1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          state: "SUBMITTED",
        });

        invariantViolation.add(created.acceptedRegulationAt ? 0 : 1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          invariant_id: "I2",
          expression: "acceptedRegulationAt != null",
        });
        invariantViolation.add(created.lgpdConsentAccepted ? 0 : 1, {
          feature: FEATURE,
          entity: "CandidateApplication",
          invariant_id: "I3",
          expression: "lgpdConsentAccepted = true",
        });

        calculationDrift.record(
          createInput.email === canonicalEmail ? 0 : 1,
          {
            feature: FEATURE,
            operation: OPERATION,
            calculation_id: "C1",
          },
        );

        postconditionCheck.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          postcondition_id: "persisted_submitted",
          result: created.status === "SUBMITTED" ? "satisfied" : "violated",
        });
        postconditionCheck.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          postcondition_id: "rule_acceptance_stored",
          result:
            created.acceptedRegulationVersion && created.acceptedRegulationAt
              ? "satisfied"
              : "violated",
        });
        postconditionCheck.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          postcondition_id: "available_for_screening",
          result: created.status === "SUBMITTED" ? "satisfied" : "violated",
        });

        businessApplicationsSubmitted.add(1, {
          feature: FEATURE,
          capability: OPERATION,
        });

        funnelStep.add(1, {
          feature: FEATURE,
          journey: "onboarding",
          step_name: "submitted",
          outcome: "success",
        });
        funnelConversionRate.record(1, {
          feature: FEATURE,
          journey: "onboarding",
        });

        operationResult = "success";
        return created;
      } catch (error) {
        // Covers race conditions where concurrent submissions bypass pre-check.
        if (isDuplicateCandidateConstraintError(error)) {
          stateInvalidTransition.add(1, {
            feature: FEATURE,
            entity: "CandidateApplication",
            from: "new",
            attempted_event: "SubmitCandidateApplication",
            error_code: "DUPLICATE_CANDIDATE",
          });
          throw duplicateCandidateError();
        }

        throw error;
      }
    } catch (error) {
      const ruleId = resolveSubmitRuleId(error);

      if (ruleId) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: ruleId,
        });
      }

      if ((error as { code?: string }).code === "DUPLICATE_CANDIDATE") {
        businessDuplicateBlocked.add(1, {
          feature: FEATURE,
          match_field: "whatsapp_or_email",
        });
      }

      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "form_submission",
      });
      funnelStep.add(1, {
        feature: FEATURE,
        journey: "onboarding",
        step_name: "submitted",
        outcome: "failed",
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
