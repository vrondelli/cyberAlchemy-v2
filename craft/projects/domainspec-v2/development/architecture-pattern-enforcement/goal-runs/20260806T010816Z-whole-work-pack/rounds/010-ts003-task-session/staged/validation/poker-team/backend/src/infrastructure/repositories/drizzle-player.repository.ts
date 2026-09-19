import { eq } from "drizzle-orm";
import {
  CreatePlayerInput,
  Player,
  PlayerStatus,
} from "../../domain/player/player.entity";
import {
  ALLOWED_LIMITS,
  canonicalEmailKey,
} from "../../domain/player/email-normalization";
import { PlayerRepository } from "../../domain/player/player.repository";
import { db } from "../database";
import { players } from "../database/schema";

type PlayerDatabase = Pick<typeof db, "insert" | "select" | "update">;

const toPlayer = (result: typeof players.$inferSelect): Player => {
  const { canonicalEmail: _canonicalEmail, ...playerData } = result;

  return {
    ...playerData,
    bankroll: Number(result.bankroll),
    makeup: Number(result.makeup),
    makeupPolicy: result.makeupPolicy,
    status: result.status as PlayerStatus,
  };
};

export const createDrizzlePlayerRepository = (
  database: PlayerDatabase = db,
): PlayerRepository => {
  return {
    async create(data: CreatePlayerInput): Promise<Player> {
      const [result] = await database
        .insert(players)
        .values({
          principalId: data.principalId ?? null,
          name: data.name,
          email: data.email,
          canonicalEmail: canonicalEmailKey(data.email),
          currentLimit: data.currentLimit as (typeof ALLOWED_LIMITS)[number],
          bankroll: data.initialBankroll?.toString() || "0",
          makeup: "0",
          makeupPolicy: data.makeupPolicy ?? null,
          status: "OBSERVATION",
        })
        .returning();

      return toPlayer(result);
    },

    async findById(id: string): Promise<Player | null> {
      const [result] = await database.select().from(players).where(eq(players.id, id));
      if (!result) return null;
      return toPlayer(result);
    },

    async findAll(): Promise<Player[]> {
      const results = await database.select().from(players);
      return results.map((player) => toPlayer(player));
    },

    async update(
      id: string,
      data: Partial<Omit<Player, "id" | "createdAt">>,
    ): Promise<Player> {
      const updateData: any = { ...data };
      if (data.bankroll !== undefined) {
        updateData.bankroll = data.bankroll.toString();
      }
      if (data.makeup !== undefined) {
        updateData.makeup = data.makeup.toString();
      }

      const [result] = await database
        .update(players)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(players.id, id))
        .returning();

      if (!result) throw new Error(`Player ${id} not found`);

      return toPlayer(result);
    },
  };
};

export const drizzlePlayerRepository: PlayerRepository =
  createDrizzlePlayerRepository();
