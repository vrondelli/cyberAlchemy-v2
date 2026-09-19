import { PlayerStatsWindow } from "../../domain/player-stats/player-stats-window.vo";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import {
  PlayerStatsValidationError,
  validateStatDate,
} from "../../domain/player-stats/player-stats.validation";
import { buildPlayerStatsWindow } from "../../domain/player-stats/player-stats-window-policy.service";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type GetPlayerStatsWindowInput = {
  playerId: string;
  fromDate: string;
  toDate: string;
  currentLimit?: string;
};

const FEATURE = "player-stats";
const QUERY = "GetPlayerStatsWindow";

export const getPlayerStatsWindowUseCase =
  (playerStatsRepo: PlayerStatsRepository) =>
  async (input: GetPlayerStatsWindowInput): Promise<PlayerStatsWindow> => {
    const startedAt = performance.now();
    let resultSize = 0;

    validateStatDate(input.fromDate);
    validateStatDate(input.toDate);

    if (input.toDate < input.fromDate) {
      throw new PlayerStatsValidationError(
        "VALIDATION_ERROR",
        `toDate must be >= fromDate. Got ${input.fromDate} to ${input.toDate}.`,
      );
    }

    try {
      const agg = await playerStatsRepo.aggregateWindow(
        input.playerId,
        input.fromDate,
        input.toDate,
      );

      resultSize = 1;

      return buildPlayerStatsWindow({
        playerId: input.playerId,
        fromDate: input.fromDate,
        toDate: input.toDate,
        aggregate: agg,
        currentLimit: input.currentLimit,
      });
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
