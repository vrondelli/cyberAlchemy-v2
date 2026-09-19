import { PlayerStatsSnapshot } from "../../domain/player-stats/player-stats.entity";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type GetPlayerStatsHistoryInput = {
  playerId: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  cursor?: string;
};

export type GetPlayerStatsHistoryResult = {
  playerId: string;
  entries: PlayerStatsSnapshot[];
  nextCursor: string | null;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const FEATURE = "player-stats";
const QUERY = "GetPlayerStatsHistory";

export const getPlayerStatsHistoryUseCase =
  (playerStatsRepo: PlayerStatsRepository) =>
  async (
    input: GetPlayerStatsHistoryInput,
  ): Promise<GetPlayerStatsHistoryResult> => {
    const startedAt = performance.now();
    let resultSize = 0;
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    try {
      const result = await playerStatsRepo.findByPlayerId(input.playerId, {
        fromDate: input.fromDate,
        toDate: input.toDate,
        limit,
        cursor: input.cursor,
      });

      resultSize = result.entries.length;

      return {
        playerId: input.playerId,
        entries: result.entries,
        nextCursor: result.nextCursor,
      };
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
