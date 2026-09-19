import { FastifyInstance } from "fastify";
import { requirePermission } from "../auth/auth.guard";
import { getOnboardingFlowUseCase } from "../../../use-cases/onboarding/get-onboarding-flow";
import { submitCandidateApplicationUseCase } from "../../../use-cases/onboarding/submit-candidate-application";
import {
  getCandidateApplicationByIdUseCase,
  listCandidateApplicationsUseCase,
} from "../../../use-cases/onboarding/list-candidate-applications";
import { reviewCandidateApplicationUseCase } from "../../../use-cases/onboarding/review-candidate-application";
import { drizzleCandidateApplicationRepository } from "../../repositories/drizzle-candidate-application.repository";
import { drizzleOnboardingPlayerIntakeHandoffRepository } from "../../repositories/drizzle-onboarding-player-intake-handoff.repository";
import { DomainError } from "../../../domain/errors";
import {
  domainErrorToHttpStatus,
  domainErrorCode,
  domainErrorDetails,
} from "../error-mapper";
import type {
  CandidateBacklogResponse,
  CandidateReviewResponse,
  CandidateSubmissionRequest,
  CandidateSubmissionResponse,
} from "@poker-team/shared/onboarding-contracts";

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

const replyError = (
  reply: {
    status: (code: number) => { send: (payload: ErrorPayload) => unknown };
  },
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) => {
  return reply.status(statusCode).send({ code, message, details });
};

const isReviewDecision = (value: unknown): value is "APPROVE" | "REJECT" =>
  value === "APPROVE" || value === "REJECT";

const toIsoDateString = (value: Date | string): string =>
  typeof value === "string" ? value : value.toISOString();

const toOptionalIsoDateString = (value: Date | string | null): string | null =>
  value ? toIsoDateString(value) : null;

export async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.get("/onboarding/flow", async (request, reply) => {
    const { regulationVersion } = request.query as {
      regulationVersion?: string;
    };

    const flow = await getOnboardingFlowUseCase({ regulationVersion });
    return reply.send(flow);
  });

  fastify.post("/onboarding/candidates", async (request, reply) => {
    try {
      const submitCandidate = submitCandidateApplicationUseCase(
        drizzleCandidateApplicationRepository,
      );

      const created = await submitCandidate(
        request.body as CandidateSubmissionRequest,
      );
      const response: CandidateSubmissionResponse = {
        id: created.id,
        status: "SUBMITTED",
        submittedAt: created.submittedAt.toISOString(),
        confirmation: "submitted",
      };
      return reply.status(201).send(response);
    } catch (error) {
      if (error instanceof DomainError) {
        return replyError(
          reply,
          domainErrorToHttpStatus(error),
          error.code,
          error.message,
          error.details,
        );
      }

      return replyError(
        reply,
        500,
        "INTERNAL_ERROR",
        "Unexpected server error",
      );
    }
  });

  fastify.patch(
    "/onboarding/candidates/:id/review",
    {
      preHandler: requirePermission(
        "player-onboarding.review.evaluateApplication",
      ),
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          decision?: unknown;
          reviewDecisionNote?: unknown;
        };

        if (!isReviewDecision(body.decision)) {
          return replyError(
            reply,
            400,
            "VALIDATION_ERROR",
            "decision is required",
            {
              decision: "APPROVE | REJECT",
            },
          );
        }

        const authData = (
          request as { authUserData?: { userId: string | null } }
        ).authUserData;
        if (!authData?.userId) {
          return replyError(reply, 401, "UNAUTHORIZED", "Unauthorized");
        }

        const review = reviewCandidateApplicationUseCase(
          drizzleCandidateApplicationRepository,
          {
            intakeGateway: drizzleOnboardingPlayerIntakeHandoffRepository,
          },
        );
        const updated = await review({
          id,
          reviewedBy: authData.userId,
          decision: body.decision,
          reviewDecisionNote:
            typeof body.reviewDecisionNote === "string"
              ? body.reviewDecisionNote.trim() || undefined
              : undefined,
        });

        if (
          (updated.status !== "APPROVED" && updated.status !== "REJECTED") ||
          !updated.reviewedAt
        ) {
          return replyError(
            reply,
            500,
            "INTERNAL_ERROR",
            "Unexpected review state",
          );
        }

        const response: CandidateReviewResponse = {
          id: updated.id,
          status: updated.status,
          reviewedAt: updated.reviewedAt.toISOString(),
        };

        return reply.send(response);
      } catch (error) {
        if (error instanceof DomainError) {
          return replyError(
            reply,
            domainErrorToHttpStatus(error),
            error.code,
            error.message,
            error.details,
          );
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.get(
    "/admin/onboarding/candidates",
    {
      preHandler: requirePermission(
        "player-onboarding.review.listCandidates",
      ),
    },
    async (request, reply) => {
      try {
        const { status, page, limit } = request.query as {
          status?: string;
          page?: string;
          limit?: string;
        };

        const listCandidates = listCandidateApplicationsUseCase(
          drizzleCandidateApplicationRepository,
        );

        const result = await listCandidates({
          status,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        });

        const response: CandidateBacklogResponse = {
          ...result,
          items: result.items.map((item) => ({
            ...item,
            submittedAt: toIsoDateString(item.submittedAt),
            reviewedAt: toOptionalIsoDateString(item.reviewedAt),
          })),
        };

        return reply.send(response);
      } catch (error) {
        if (error instanceof DomainError) {
          return replyError(
            reply,
            domainErrorToHttpStatus(error),
            error.code,
            error.message,
            error.details,
          );
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.get(
    "/admin/onboarding/candidates/:id",
    {
      preHandler: requirePermission(
        "player-onboarding.review.getCandidateDetail",
      ),
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const getCandidate = getCandidateApplicationByIdUseCase(
          drizzleCandidateApplicationRepository,
        );

        const candidateApplication = await getCandidate(id);
        return reply.send({ candidateApplication });
      } catch (error) {
        if (error instanceof DomainError) {
          return replyError(
            reply,
            domainErrorToHttpStatus(error),
            error.code,
            error.message,
            error.details,
          );
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );
}
