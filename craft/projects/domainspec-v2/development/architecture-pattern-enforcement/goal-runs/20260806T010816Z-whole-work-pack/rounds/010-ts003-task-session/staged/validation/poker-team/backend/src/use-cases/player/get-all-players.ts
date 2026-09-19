import { Player } from "../../domain/player/player.entity";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

const FEATURE = "player-management";
const QUERY = "GetAllPlayers";

export const getAllPlayersUseCase =
  (playerRepo: PlayerRepository) =>
  async (): Promise<Player[]> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const players = await playerRepo.findAll();
      resultSize = players.length;
      return players;
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
