import type { Coach } from "../../domain/coach/coach.entity";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import {
  queryDuration,
  queryResultSize,
} from "../../infrastructure/telemetry/instruments";

const FEATURE = "player-management";
const QUERY = "GetAllCoaches";

export const getAllCoachesUseCase =
  (coachRepo: CoachRepository) => async (): Promise<Coach[]> => {
    const startedAt = performance.now();
    let resultSize = 0;

    try {
      const coaches = await coachRepo.findAll();
      resultSize = coaches.length;
      return coaches;
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
