import {
  ApplicationStatus,
  CandidateApplication,
} from "../../domain/onboarding/candidate-application.entity";
import {
  CandidateApplicationRepository,
  CandidateListResult,
} from "../../domain/onboarding/candidate-application.repository";
import {
  queryDuration,
  queryResultSize,
  ruleViolation,
} from "../../infrastructure/telemetry/instruments";

type UseCaseError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

const withError = (
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
): UseCaseError => {
  const error = new Error(message) as UseCaseError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

const allowedStatuses: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

const FEATURE = "player-onboarding";
const LIST_QUERY = "ListCandidateApplications";
const DETAIL_QUERY = "GetCandidateApplicationById";

export const listCandidateApplicationsUseCase =
  (repo: CandidateApplicationRepository) =>
  async (input: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<CandidateListResult> => {
    const startedAt = performance.now();
    let resultSize = 0;

    const page = input.page && input.page > 0 ? input.page : 1;
    const limit =
      input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const status = input.status as ApplicationStatus | undefined;
    if (status && !allowedStatuses.includes(status)) {
      ruleViolation.add(1, {
        feature: FEATURE,
        operation: LIST_QUERY,
        rule_id: "R1",
      });
      throw withError("Invalid status filter", 400, "VALIDATION_ERROR", {
        field: "status",
      });
    }

    try {
      const result = await repo.list({
        status,
        page,
        limit,
      });

      resultSize = result.items.length;
      return result;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      queryDuration.record(durationSec, {
        feature: FEATURE,
        query: LIST_QUERY,
      });
      queryResultSize.record(resultSize, {
        feature: FEATURE,
        query: LIST_QUERY,
      });
    }
  };

export const getCandidateApplicationByIdUseCase =
  (repo: CandidateApplicationRepository) =>
  async (id: string): Promise<CandidateApplication> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const candidate = await repo.findById(id);

      if (!candidate) {
        throw withError("Candidate application not found", 404, "NOT_FOUND");
      }

      resultSize = 1;
      return candidate;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      queryDuration.record(durationSec, {
        feature: FEATURE,
        query: DETAIL_QUERY,
      });
      queryResultSize.record(resultSize, {
        feature: FEATURE,
        query: DETAIL_QUERY,
      });
    }
  };
