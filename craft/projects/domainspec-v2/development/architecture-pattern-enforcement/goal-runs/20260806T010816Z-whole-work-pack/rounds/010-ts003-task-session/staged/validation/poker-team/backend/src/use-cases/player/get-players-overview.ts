import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { computeOverviewMetrics } from "../../domain/player/player-overview.service";
import { PlayerOverviewDto } from "./player-overview.dto";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

const FEATURE = "player-management";
const QUERY = "GetPlayersOverview";

export const getPlayersOverviewUseCase =
  (playerRepo: PlayerRepository, playerStatsRepo: PlayerStatsRepository) =>
  async (periodDays: number = 30): Promise<PlayerOverviewDto[]> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const appliedPeriodDays = periodDays > 0 ? periodDays : 30;
      const players = await playerRepo.findAll();
      const overview: PlayerOverviewDto[] = [];

      for (const player of players) {
        const { entries } = await playerStatsRepo.findByPlayerId(player.id);
        const stats = entries.map((s) => ({
          date: s.statDate,
          hands: s.hands,
          profit: s.profit,
        }));
        const metrics = computeOverviewMetrics({
          stats,
          currentLimit: player.currentLimit,
          periodDays: appliedPeriodDays,
          now: new Date(),
        });

        overview.push({
          id: player.id,
          name: player.name,
          currentLimit: player.currentLimit,
          status: player.status,
          bankroll: player.bankroll,
          makeup: player.makeup,
          lifetimeProfit: metrics.lifetimeProfit,
          avgHandsLastPeriod: metrics.avgHandsLastPeriod,
          winrateLastPeriod: metrics.winrateLastPeriod,
          periodDays: appliedPeriodDays,
        });
      }

      resultSize = overview.length;
      return overview;
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
