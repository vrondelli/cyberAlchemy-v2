import type { CoachRepository } from "./coach.repository";
import type { CoachAssignmentRepository } from "./coach-assignment.repository";
import type { PlayerRepository } from "../player/player.repository";
import { hasRequiredPermission } from "../auth-access-control/permission-resolution";

type VisibilityInput = {
  actorPrincipalId: string;
  actorPermissions: string[];
};

const isAdmin = (permissions: string[]): boolean =>
  hasRequiredPermission(permissions, "player-management.*.*") ||
  hasRequiredPermission(permissions, "player-makeup.write.manageMakeup");

export const resolvePlayerVisibility =
  (
    coachRepo: CoachRepository,
    assignmentRepo: CoachAssignmentRepository,
    playerRepo: PlayerRepository,
  ) =>
  async (input: VisibilityInput): Promise<string[]> => {
    // Priority 1: Admin/manager → all players
    if (isAdmin(input.actorPermissions)) {
      const allPlayers = await playerRepo.findAll();
      return allPlayers.map((p) => p.id);
    }

    // Priority 2: Coach → assigned players + self (if also a player)
    const coach = await coachRepo.findByPrincipalId(input.actorPrincipalId);
    if (coach && coach.status === "ACTIVE") {
      const assignedPlayerIds =
        await assignmentRepo.findActivePlayerIdsByCoachPrincipalId(
          input.actorPrincipalId,
        );

      // Check if the coach is also a player
      const allPlayers = await playerRepo.findAll();
      const selfPlayer = allPlayers.find(
        (p) => p.principalId === input.actorPrincipalId,
      );

      const playerIds = new Set(assignedPlayerIds);
      if (selfPlayer) {
        playerIds.add(selfPlayer.id);
      }

      return Array.from(playerIds);
    }

    // Priority 3: Player → self only
    const allPlayers = await playerRepo.findAll();
    const selfPlayer = allPlayers.find(
      (p) => p.principalId === input.actorPrincipalId,
    );

    return selfPlayer ? [selfPlayer.id] : [];
  };
