import { resolveEffectiveMakeupPolicy } from "../../domain/makeup/makeup-policy.service";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  createHistogram,
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type PlayerMakeupStateDto = {
  playerId: string;
  currentMakeup: number;
  policy: {
    applyProfitFirst: boolean;
    applyRakebackSecond: boolean;
    playerRakebackShare: number;
  };
};

const FEATURE = "player-makeup";
const QUERY = "GetPlayerMakeup";

const businessTotalMakeupOutstanding = createHistogram(
  "business.total_makeup_outstanding",
  {
    unit: "{currency_minor}",
    description: "Observed outstanding makeup amount samples (O13)",
  },
);

const businessAvgDebtPerPlayer = createHistogram("business.avg_debt_per_player", {
  unit: "{currency_minor}",
  description: "Observed average debt per player samples (O13)",
});

const businessPlayersInDebt = createHistogram("business.players_in_debt", {
  unit: "{player}",
  description: "Observed players in debt samples (O13)",
});

export const getPlayerMakeupUseCase =
  (playerRepo: PlayerRepository) =>
  async (playerId: string): Promise<PlayerMakeupStateDto> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const player = await playerRepo.findById(playerId);
      if (!player) throw new Error("Player not found");

      const result = {
        playerId: player.id,
        currentMakeup: player.makeup,
        policy: resolveEffectiveMakeupPolicy(player.makeupPolicy),
      };

      resultSize = 1;
      businessTotalMakeupOutstanding.record(player.makeup, {
        feature: FEATURE,
      });
      businessAvgDebtPerPlayer.record(player.makeup, {
        feature: FEATURE,
      });
      businessPlayersInDebt.record(player.makeup > 0 ? 1 : 0, {
        feature: FEATURE,
      });

      return result;
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
