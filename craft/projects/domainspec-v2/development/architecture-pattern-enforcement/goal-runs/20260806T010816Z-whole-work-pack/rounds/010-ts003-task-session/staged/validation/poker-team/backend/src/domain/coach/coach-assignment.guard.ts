import type { CoachAssignmentRepository } from "./coach-assignment.repository";
import { DomainError } from "../errors";

/**
 * Domain guard: at most one active coach per player.
 * Throws if player already has an active assignment.
 */
export const enforceOneActiveCoachPerPlayer = async (
  assignmentRepo: CoachAssignmentRepository,
  playerId: string,
): Promise<void> => {
  const existing = await assignmentRepo.findActiveByPlayerId(playerId);
  if (existing) {
    throw new DomainError(
      "PLAYER_ALREADY_ASSIGNED",
      "Player already has an active coach assignment",
    );
  }
};
