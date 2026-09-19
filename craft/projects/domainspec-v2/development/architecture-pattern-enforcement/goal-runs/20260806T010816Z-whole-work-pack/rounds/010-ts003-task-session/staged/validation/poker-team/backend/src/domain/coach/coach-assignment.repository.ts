import { CoachAssignment } from "./coach.entity";

export type CoachAssignmentRepository = {
  create(input: {
    coachId: string;
    playerId: string;
  }): Promise<CoachAssignment>;
  findActiveByCoachId(coachId: string): Promise<CoachAssignment[]>;
  findActiveByPlayerId(playerId: string): Promise<CoachAssignment | null>;
  softDelete(
    coachId: string,
    playerId: string,
  ): Promise<CoachAssignment | null>;
  findActivePlayerIdsByCoachPrincipalId(principalId: string): Promise<string[]>;
};
