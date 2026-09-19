import type { Player } from "../../domain/player/player.entity";
import type { PlayerRepository } from "../../domain/player/player.repository";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import { hasRequiredPermission } from "../../domain/auth-access-control/permission-resolution";
import {
  createHistogram,
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
): UseCaseError => {
  const error = new Error(message) as UseCaseError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

type GetCoachPlayersInput = {
  coachId: string;
  actorPrincipalId: string;
  actorPermissions: string[];
};

const hasAdminAccess = (permissions: string[]): boolean =>
  hasRequiredPermission(permissions, "player-management.*.*") ||
  hasRequiredPermission(permissions, "auth-access-control.admin.*");

const FEATURE = "player-management";
const QUERY = "GetCoachPlayers";

const businessCoachAssignmentRatio = createHistogram(
  "business.coach_assignment_ratio",
  {
    unit: "1",
    description: "Observed coach assignment ratio samples (O13)",
  },
);

export const getCoachPlayersUseCase =
  (
    coachRepo: CoachRepository,
    assignmentRepo: CoachAssignmentRepository,
    playerRepo: PlayerRepository,
  ) =>
  async (input: GetCoachPlayersInput): Promise<Player[]> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const coach = await coachRepo.findById(input.coachId);
      if (!coach) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: QUERY,
          rule_id: "R1",
        });
        throw withError("Coach not found", 404, "COACH_NOT_FOUND");
      }

      // Coach-scope enforcement: coaches can only list their own players
      if (
        coach.principalId !== input.actorPrincipalId &&
        !hasAdminAccess(input.actorPermissions)
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: QUERY,
          rule_id: "R2",
        });
        throw withError("Missing required permission", 403, "FORBIDDEN");
      }

      const assignments = await assignmentRepo.findActiveByCoachId(input.coachId);
      const playerIds = assignments.map((a) => a.playerId);

      if (playerIds.length === 0) {
        businessCoachAssignmentRatio.record(0, {
          feature: FEATURE,
        });
        return [];
      }

      const allPlayers = await playerRepo.findAll();
      const result = allPlayers.filter((p) => playerIds.includes(p.id));
      resultSize = result.length;

      businessCoachAssignmentRatio.record(
        allPlayers.length > 0 ? result.length / allPlayers.length : 0,
        {
          feature: FEATURE,
        },
      );

      return result;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      queryDuration.record(durationSec, {
        feature: FEATURE,
        query: QUERY,
      });
      queryResultSize.record(resultSize, {
        feature: FEATURE,
        query: QUERY,
      });
    }
  };
