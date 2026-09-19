import type { Coach, CreateCoachInput } from "../../domain/coach/coach.entity";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import { isNonEmptyString } from "../../domain/player/email-normalization";
import type { PlayerManagementEventHandler } from "../../domain/player-management/player-management.events";
import {
  createUpDownCounter,
  operationDuration,
  operationInvocation,
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

const FEATURE = "player-management";
const OPERATION = "CreateCoach";

const businessActiveCoaches = createUpDownCounter("business.active_coaches", {
  unit: "{coach}",
  description: "Observed active coaches count changes (O13)",
});

export const createCoachUseCase =
  (coachRepo: CoachRepository, onEvent?: PlayerManagementEventHandler) =>
  async (input: CreateCoachInput): Promise<Coach> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      if (!isNonEmptyString(input.principalId)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw withError("principalId is required", 400, "VALIDATION_ERROR", {
          field: "principalId",
        });
      }

      if (!isNonEmptyString(input.name)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw withError("Name is required", 400, "VALIDATION_ERROR", {
          field: "name",
        });
      }

      if (!isNonEmptyString(input.email)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R3",
        });
        throw withError("Email is required", 400, "VALIDATION_ERROR", {
          field: "email",
        });
      }

      const created = await coachRepo.create({
        principalId: input.principalId.trim(),
        name: input.name.trim(),
        email: input.email.trim(),
      });

      if (onEvent) {
        await onEvent({
          type: "CoachCreated",
          coachId: created.id,
          principalId: created.principalId,
          status: created.status,
          occurredAt: created.createdAt ?? new Date(),
        });
      }

      businessActiveCoaches.add(1, {
        feature: FEATURE,
      });

      operationResult = "success";
      return created;
    } catch (error) {
      const repoError = error as { code?: string; constraint?: string };

      const isUnique =
        repoError.code === "23505" ||
        repoError.constraint === "coaches_unique_active_principal";

      if (isUnique) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R4",
        });
        throw withError(
          "Coach with this principalId already exists",
          409,
          "DUPLICATE_PRINCIPAL",
        );
      }

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
    }
  };
