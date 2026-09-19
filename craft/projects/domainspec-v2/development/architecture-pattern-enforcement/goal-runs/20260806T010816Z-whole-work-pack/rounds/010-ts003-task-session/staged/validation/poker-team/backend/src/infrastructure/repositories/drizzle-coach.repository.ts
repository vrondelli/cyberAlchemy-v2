import { eq } from "drizzle-orm";
import type {
  Coach,
  CoachStatus,
  CreateCoachInput,
} from "../../domain/coach/coach.entity";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import { db } from "../database";
import { coaches } from "../database/schema";

type CoachDatabase = Pick<typeof db, "insert" | "select">;

const toCoach = (result: typeof coaches.$inferSelect): Coach => ({
  id: result.id,
  principalId: result.principalId,
  name: result.name,
  email: result.email,
  status: result.status as CoachStatus,
  createdAt: result.createdAt,
  updatedAt: result.updatedAt,
});

export const createDrizzleCoachRepository = (
  database: CoachDatabase = db,
): CoachRepository => ({
  async create(input: CreateCoachInput): Promise<Coach> {
    const [result] = await database
      .insert(coaches)
      .values({
        principalId: input.principalId,
        name: input.name,
        email: input.email,
        status: "ACTIVE",
      })
      .returning();

    return toCoach(result);
  },

  async findById(id: string): Promise<Coach | null> {
    const [result] = await database
      .select()
      .from(coaches)
      .where(eq(coaches.id, id));
    return result ? toCoach(result) : null;
  },

  async findByPrincipalId(principalId: string): Promise<Coach | null> {
    const [result] = await database
      .select()
      .from(coaches)
      .where(eq(coaches.principalId, principalId));
    return result ? toCoach(result) : null;
  },

  async findAll(): Promise<Coach[]> {
    const results = await database.select().from(coaches);
    return results.map(toCoach);
  },
});

export const drizzleCoachRepository: CoachRepository =
  createDrizzleCoachRepository();
