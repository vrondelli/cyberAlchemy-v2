import { getLimitBuyIn } from "../limit/limit.service";
import { computeWinrateBbPer100 } from "../shared/winrate";

export type ProgressionPeriod = 15 | 30;

export type ProgressionRecord = {
  date: string;
  hands: number;
  profit: number;
};

export type EvaluateProgressionInput = {
  currentLimit: string;
  periodDays: ProgressionPeriod;
  now: Date;
  stats: ProgressionRecord[];
};

export type EvaluateProgressionResult = {
  eligibleForPromotion: boolean;
  reason: string;
  avgHands: number;
  winrate: number;
  period: "BI_WEEKLY" | "MONTHLY";
};

export const filterStatsForPeriod = (
  stats: ProgressionRecord[],
  periodDays: ProgressionPeriod,
  now: Date,
): ProgressionRecord[] => {
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - periodDays);
  return stats.filter((item) => new Date(item.date) >= pastDate);
};

export const evaluateProgressionPolicy = (
  input: EvaluateProgressionInput,
): EvaluateProgressionResult => {
  const relevantStats = filterStatsForPeriod(
    input.stats,
    input.periodDays,
    input.now,
  );

  if (relevantStats.length === 0) {
    return {
      eligibleForPromotion: false,
      reason: "No stats in period",
      avgHands: 0,
      winrate: 0,
      period: input.periodDays === 15 ? "BI_WEEKLY" : "MONTHLY",
    };
  }

  const totalHands = relevantStats.reduce((sum, item) => sum + item.hands, 0);
  const totalProfit = relevantStats.reduce((sum, item) => sum + item.profit, 0);
  const avgHands = totalHands / input.periodDays;

  const bbValueCents = getLimitBuyIn(input.currentLimit) / 100;
  const winrate = computeWinrateBbPer100(totalProfit, totalHands, bbValueCents);

  if (input.periodDays === 15) {
    if (avgHands >= 1000 && winrate >= 7.5) {
      return {
        eligibleForPromotion: true,
        reason: "Met Bi-Weekly criteria",
        avgHands,
        winrate,
        period: "BI_WEEKLY",
      };
    }

    return {
      eligibleForPromotion: false,
      reason: `Missed criteria. Hands: ${avgHands.toFixed(0)}/1000, Winrate: ${winrate.toFixed(2)}/7.5`,
      avgHands,
      winrate,
      period: "BI_WEEKLY",
    };
  }

  if (avgHands >= 1000 && winrate >= 5) {
    return {
      eligibleForPromotion: true,
      reason: "Met Monthly criteria",
      avgHands,
      winrate,
      period: "MONTHLY",
    };
  }

  return {
    eligibleForPromotion: false,
    reason: `Missed criteria. Hands: ${avgHands.toFixed(0)}/1000, Winrate: ${winrate.toFixed(2)}/5`,
    avgHands,
    winrate,
    period: "MONTHLY",
  };
};
