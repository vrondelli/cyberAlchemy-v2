import { eq, and, isNull } from "drizzle-orm";
import type { CoachAssignment } from "../../domain/coach/coach.entity";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import { db } from "../database";
import { coachAssignments, coaches } from "../database/schema";

type AssignmentDatabase = Pick<typeof db, "insert" | "select" | "update">;

const toAssignment = (
  result: typeof coachAssignments.$inferSelect,
): CoachAssignment => ({
  id: result.id,
  coachId: result.coachId,
  playerId: result.playerId,
  assignedAt: result.assignedAt,
  unassignedAt: result.unassignedAt,
});

export const createDrizzleCoachAssignmentRepository = (
  database: AssignmentDatabase = db,
): CoachAssignmentRepository => ({
  async create(input: {
    coachId: string;
    playerId: string;
  }): Promise<CoachAssignment> {
    const [result] = await database
      .insert(coachAssignments)
      .values({
        coachId: input.coachId,
        playerId: input.playerId,
      })
      .returning();

    return toAssignment(result);
  },

  async findActiveByCoachId(coachId: string): Promise<CoachAssignment[]> {
    const results = await database
      .select()
      .from(coachAssignments)
      .where(
        and(
          eq(coachAssignments.coachId, coachId),
          isNull(coachAssignments.unassignedAt),
        ),
      );

    return results.map(toAssignment);
  },

  async findActiveByPlayerId(
    playerId: string,
  ): Promise<CoachAssignment | null> {
    const [result] = await database
      .select()
      .from(coachAssignments)
      .where(
        and(
          eq(coachAssignments.playerId, playerId),
          isNull(coachAssignments.unassignedAt),
        ),
      );

    return result ? toAssignment(result) : null;
  },

  async softDelete(
    coachId: string,
    playerId: string,
  ): Promise<CoachAssignment | null> {
    const [result] = await database
      .update(coachAssignments)
      .set({ unassignedAt: new Date() })
      .where(
        and(
          eq(coachAssignments.coachId, coachId),
          eq(coachAssignments.playerId, playerId),
          isNull(coachAssignments.unassignedAt),
        ),
      )
      .returning();

    return result ? toAssignment(result) : null;
  },

  async findActivePlayerIdsByCoachPrincipalId(
    principalId: string,
  ): Promise<string[]> {
    const results = await database
      .select({ playerId: coachAssignments.playerId })
      .from(coachAssignments)
      .innerJoin(coaches, eq(coachAssignments.coachId, coaches.id))
      .where(
        and(
          eq(coaches.principalId, principalId),
          eq(coaches.status, "ACTIVE"),
          isNull(coachAssignments.unassignedAt),
        ),
      );

    return results.map((r) => r.playerId);
  },
});

export const drizzleCoachAssignmentRepository: CoachAssignmentRepository =
  createDrizzleCoachAssignmentRepository();
