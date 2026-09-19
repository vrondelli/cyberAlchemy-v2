import type { CoachAssignment } from "../../domain/coach/coach.entity";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import type { PlayerRepository } from "../../domain/player/player.repository";
import { enforceOneActiveCoachPerPlayer } from "../../domain/coach/coach-assignment.guard";
import type { PlayerManagementEventHandler } from "../../domain/player-management/player-management.events";
import {
  createCounter,
  createHistogram,
  operationDuration,
  operationInvocation,
  postconditionCheck,
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
const OPERATION = "AssignCoach";

const businessCoachAssignments = createCounter("business.coach_assignments", {
  unit: "{assignment}",
  description: "Coach assignments created (O13)",
});

const businessCoachAssignmentRatio = createHistogram(
  "business.coach_assignment_ratio",
  {
    unit: "1",
    description: "Observed assignment ratio samples (O13)",
  },
);

export const assignCoachUseCase =
  (
    coachRepo: CoachRepository,
    playerRepo: PlayerRepository,
    assignmentRepo: CoachAssignmentRepository,
    onEvent?: PlayerManagementEventHandler,
  ) =>
  async (input: {
    coachId: string;
    playerId: string;
  }): Promise<CoachAssignment> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      const coach = await coachRepo.findById(input.coachId);
      if (!coach) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw withError("Coach not found", 404, "COACH_NOT_FOUND");
      }

      if (coach.status !== "ACTIVE") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw withError("Coach is not active", 409, "COACH_INACTIVE");
      }

      const player = await playerRepo.findById(input.playerId);
      if (!player) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R3",
        });
        throw withError("Player not found", 404, "PLAYER_NOT_FOUND");
      }

      await enforceOneActiveCoachPerPlayer(assignmentRepo, input.playerId);

      const assignment = await assignmentRepo.create({
        coachId: input.coachId,
        playerId: input.playerId,
      });

      if (onEvent) {
        await onEvent({
          type: "CoachAssigned",
          assignmentId: assignment.id,
          coachId: assignment.coachId,
          playerId: assignment.playerId,
          assignedAt: assignment.assignedAt,
        });
      }

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "assignment_created",
        result:
          assignment.id && assignment.unassignedAt === null
            ? "satisfied"
            : "violated",
      });

      businessCoachAssignments.add(1, {
        feature: FEATURE,
        capability: OPERATION,
      });
      businessCoachAssignmentRatio.record(1, {
        feature: FEATURE,
      });

      operationResult = "success";
      return assignment;
    } catch (error) {
      const typedError = error as { code?: string };

      if (typedError.code === "PLAYER_ALREADY_ASSIGNED") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R4",
        });
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
