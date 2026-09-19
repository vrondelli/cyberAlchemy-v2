import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { computeSettlement } from "../../domain/settlement/settlement.service";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import {
  businessPreviewBeforeSettlement,
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";
import { SettlementResult } from "./settlement.dto";
import { markSettlementPreviewInvocation } from "./settlement-kpi-runtime";

const FEATURE = "financial-settlement";
const QUERY = "GetSettlementPreview";
const CAPABILITY = "GetSettlementPreview";

export const getSettlementPreviewUseCase =
  (
    playerStatsRepo: PlayerStatsRepository,
    playerRepo: PlayerRepository,
    _transactionRepo: TransactionRepository,
  ) =>
  async (
    playerId: string,
    startDate: string,
    endDate: string,
  ): Promise<SettlementResult> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const player = await playerRepo.findById(playerId);
      if (!player) throw new Error("Player not found");

      const { entries } = await playerStatsRepo.findByPlayerId(playerId);
      const records = entries.map((s) => ({
        date: s.statDate,
        profit: s.profit,
        rakeback: s.rakeback,
      }));

      const previousMakeup = player.makeup;
      const settlement = computeSettlement({
        records,
        currentLimit: player.currentLimit,
        previousMakeup,
        periodStart: startDate,
        periodEnd: endDate,
        policy: player.makeupPolicy ?? undefined,
      });

      resultSize = 1;

      const previewBeforeSettlementRatio = markSettlementPreviewInvocation();
      businessPreviewBeforeSettlement.record(previewBeforeSettlementRatio, {
        feature: FEATURE,
        capability: CAPABILITY,
      });

      return {
        playerId,
        periodStart: startDate,
        periodEnd: endDate,
        totalProfit: settlement.totalProfit,
        totalRakeback: settlement.totalRakeback,
        netProfit: settlement.netProfit,
        previousMakeup,
        newMakeup: settlement.newMakeup,
        playerProfitShare: settlement.playerProfitShare,
        playerRakebackShare: settlement.playerRakebackShare,
        totalPayout: settlement.totalPayout,
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
