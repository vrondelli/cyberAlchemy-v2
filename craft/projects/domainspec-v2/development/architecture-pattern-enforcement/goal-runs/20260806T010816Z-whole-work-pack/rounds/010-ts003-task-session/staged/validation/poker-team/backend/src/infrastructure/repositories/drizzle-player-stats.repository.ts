import { and, eq, gte, lte, desc, lt, sql, sum, count } from "drizzle-orm";
import {
  PlayerStatsSnapshot,
  RecordPlayerStatsInput,
} from "../../domain/player-stats/player-stats.entity";
import {
  PlayerStatsRepository,
  PlayerStatsFilters,
} from "../../domain/player-stats/player-stats.repository";
import { db } from "../database";
import { playerStats } from "../database/schema";

function mapRow(r: typeof playerStats.$inferSelect): PlayerStatsSnapshot {
  return {
    id: r.id,
    playerId: r.playerId,
    statDate: r.statDate,
    hands: r.hands,
    profit: Number(r.profit),
    rakeback: Number(r.rakeback),
    rake: Number(r.rake),
    closingBankroll: Number(r.closingBankroll),
    sessionDuration: r.sessionDuration,
    sourceType: r.sourceType as PlayerStatsSnapshot["sourceType"],
    status: r.status as PlayerStatsSnapshot["status"],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const drizzlePlayerStatsRepository: PlayerStatsRepository = {
  async create(
    data: RecordPlayerStatsInput & { status: string },
  ): Promise<PlayerStatsSnapshot> {
    const [result] = await db
      .insert(playerStats)
      .values({
        playerId: data.playerId,
        statDate: data.statDate,
        hands: data.hands,
        profit: data.profit.toString(),
        rakeback: data.rakeback.toString(),
        rake: data.rake.toString(),
        closingBankroll: data.closingBankroll.toString(),
        sessionDuration: data.sessionDuration,
        sourceType: data.sourceType as any,
        status: data.status as any,
      })
      .returning();

    return mapRow(result);
  },

  async update(
    id: string,
    data: Partial<Omit<PlayerStatsSnapshot, "id" | "createdAt">>,
  ): Promise<PlayerStatsSnapshot> {
    const values: Record<string, unknown> = {};
    if (data.hands !== undefined) values.hands = data.hands;
    if (data.profit !== undefined) values.profit = data.profit.toString();
    if (data.rakeback !== undefined) values.rakeback = data.rakeback.toString();
    if (data.rake !== undefined) values.rake = data.rake.toString();
    if (data.closingBankroll !== undefined)
      values.closingBankroll = data.closingBankroll.toString();
    if (data.sessionDuration !== undefined)
      values.sessionDuration = data.sessionDuration;
    if (data.sourceType !== undefined) values.sourceType = data.sourceType;
    if (data.status !== undefined) values.status = data.status;
    if (data.updatedAt !== undefined) values.updatedAt = data.updatedAt;
    if (data.statDate !== undefined) values.statDate = data.statDate;
    if (data.playerId !== undefined) values.playerId = data.playerId;

    const [result] = await db
      .update(playerStats)
      .set(values)
      .where(eq(playerStats.id, id))
      .returning();

    return mapRow(result);
  },

  async findByPlayerAndDate(
    playerId: string,
    statDate: string,
  ): Promise<PlayerStatsSnapshot | null> {
    const results = await db
      .select()
      .from(playerStats)
      .where(
        and(
          eq(playerStats.playerId, playerId),
          eq(playerStats.statDate, statDate),
        ),
      )
      .limit(1);

    return results.length > 0 ? mapRow(results[0]) : null;
  },

  async findByPlayerId(
    playerId: string,
    filters?: PlayerStatsFilters,
  ): Promise<{ entries: PlayerStatsSnapshot[]; nextCursor: string | null }> {
    const conditions = [eq(playerStats.playerId, playerId)];
    if (filters?.fromDate)
      conditions.push(gte(playerStats.statDate, filters.fromDate));
    if (filters?.toDate)
      conditions.push(lte(playerStats.statDate, filters.toDate));
    if (filters?.cursor)
      conditions.push(lt(playerStats.statDate, filters.cursor));

    const limit = (filters?.limit ?? 50) + 1;

    const results = await db
      .select()
      .from(playerStats)
      .where(and(...conditions))
      .orderBy(desc(playerStats.statDate))
      .limit(limit);

    const hasMore = results.length > (filters?.limit ?? 50);
    const entries = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? entries[entries.length - 1].statDate : null;

    return {
      entries: entries.map(mapRow),
      nextCursor,
    };
  },

  async aggregateWindow(playerId: string, fromDate: string, toDate: string) {
    const [result] = await db
      .select({
        totalHands: sql<number>`coalesce(sum(${playerStats.hands}), 0)::int`,
        totalProfit: sql<number>`coalesce(sum(${playerStats.profit}::numeric), 0)::float`,
        totalRakeback: sql<number>`coalesce(sum(${playerStats.rakeback}::numeric), 0)::float`,
        totalRake: sql<number>`coalesce(sum(${playerStats.rake}::numeric), 0)::float`,
        totalSessionMinutes: sql<number>`coalesce(sum(${playerStats.sessionDuration}), 0)::int`,
        sessionCount: sql<number>`count(*)::int`,
      })
      .from(playerStats)
      .where(
        and(
          eq(playerStats.playerId, playerId),
          gte(playerStats.statDate, fromDate),
          lte(playerStats.statDate, toDate),
        ),
      );

    return {
      totalHands: Number(result.totalHands),
      totalProfit: Number(result.totalProfit),
      totalRakeback: Number(result.totalRakeback),
      totalRake: Number(result.totalRake),
      totalSessionMinutes: Number(result.totalSessionMinutes),
      sessionCount: Number(result.sessionCount),
    };
  },
};
