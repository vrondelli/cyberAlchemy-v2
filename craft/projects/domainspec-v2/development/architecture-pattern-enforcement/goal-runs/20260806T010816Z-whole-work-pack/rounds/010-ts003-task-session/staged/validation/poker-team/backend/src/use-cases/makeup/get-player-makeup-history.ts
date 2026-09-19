import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import {
  buildMakeupHistoryPage,
  DEFAULT_MAKEUP_HISTORY_LIMIT,
} from "../../domain/makeup/makeup-history.service";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

export type PlayerMakeupHistoryDto = {
  playerId: string;
  nextCursor: string | null;
  entries: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    createdAt: Date;
  }>;
};

export type GetPlayerMakeupHistoryInput = {
  playerId: string;
  limit?: number;
  cursor?: string;
};

const FEATURE = "player-makeup";
const QUERY = "GetPlayerMakeupHistory";

export const getPlayerMakeupHistoryUseCase =
  (playerRepo: PlayerRepository, transactionRepo: TransactionRepository) =>
  async (
    input: GetPlayerMakeupHistoryInput,
  ): Promise<PlayerMakeupHistoryDto> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const limit = input.limit ?? DEFAULT_MAKEUP_HISTORY_LIMIT;

      const player = await playerRepo.findById(input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const transactions = await transactionRepo.findByPlayerId(input.playerId);
      const page = buildMakeupHistoryPage({
        allTransactions: transactions,
        limit,
        cursor: input.cursor,
      });

      const result = {
        playerId: input.playerId,
        nextCursor: page.nextCursor,
        entries: page.entries.map((item) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          date: item.date,
          createdAt: item.createdAt,
        })),
      };

      resultSize = result.entries.length;
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
