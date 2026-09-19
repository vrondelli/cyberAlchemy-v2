import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import type { PlayerManagementEventHandler } from "../../domain/player-management/player-management.events";
import {
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
): UseCaseError => {
  const error = new Error(message) as UseCaseError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const FEATURE = "player-management";
const OPERATION = "UnassignCoach";

export const unassignCoachUseCase =
  (
    assignmentRepo: CoachAssignmentRepository,
    onEvent?: PlayerManagementEventHandler,
  ) =>
  async (input: {
    coachId: string;
    playerId: string;
  }): Promise<{ unassignedAt: Date }> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      const result = await assignmentRepo.softDelete(
        input.coachId,
        input.playerId,
      );

      if (!result) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw withError(
          "Active assignment not found",
          404,
          "ASSIGNMENT_NOT_FOUND",
        );
      }

      if (onEvent) {
        await onEvent({
          type: "CoachUnassigned",
          assignmentId: result.id,
          coachId: result.coachId,
          playerId: result.playerId,
          unassignedAt: result.unassignedAt!,
        });
      }

      operationResult = "success";
      return { unassignedAt: result.unassignedAt! };
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
