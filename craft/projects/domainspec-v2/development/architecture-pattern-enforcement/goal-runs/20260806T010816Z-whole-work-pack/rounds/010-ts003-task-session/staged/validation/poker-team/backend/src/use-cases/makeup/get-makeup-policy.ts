import {
  DEFAULT_MAKEUP_POLICY,
  resolveEffectiveMakeupPolicy,
} from "../../domain/makeup/makeup-policy.service";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  queryCacheHit,
  queryCacheHitRatio,
  queryCacheLookup,
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

const FEATURE = "player-makeup";
const QUERY = "GetMakeupPolicy";

export const getMakeupPolicyUseCase = async (
  playerRepo: PlayerRepository,
  playerId?: string,
) => {
  const startedAt = performance.now();
  let resultSize = 1;
  let cacheHit = 0;

  try {
    if (!playerId) {
      cacheHit = 1;
      return DEFAULT_MAKEUP_POLICY;
    }

    const player = await playerRepo.findById(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    return resolveEffectiveMakeupPolicy(player.makeupPolicy);
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

    queryCacheLookup.add(1, {
      feature: FEATURE,
      query: QUERY,
    });
    queryCacheHit.add(cacheHit, {
      feature: FEATURE,
      query: QUERY,
    });
    queryCacheHitRatio.record(cacheHit, {
      feature: FEATURE,
      query: QUERY,
    });
  }
};
