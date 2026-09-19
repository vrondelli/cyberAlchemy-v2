import { getLimitBuyIn } from "../limit/limit.service";
import { computeWinrateBbPer100 } from "../shared/winrate";

type PlayerOverviewStats = {
  date: string;
  hands: number;
  profit: number;
};

export type ComputeOverviewMetricsInput = {
  stats: PlayerOverviewStats[];
  currentLimit: string;
  periodDays: number;
  now: Date;
};

export type OverviewMetrics = {
  lifetimeProfit: number;
  avgHandsLastPeriod: number;
  winrateLastPeriod: number;
};

export const computeOverviewMetrics = (
  input: ComputeOverviewMetricsInput,
): OverviewMetrics => {
  const lifetimeProfit = input.stats.reduce(
    (sum, item) => sum + item.profit,
    0,
  );

  const pastDate = new Date(input.now);
  pastDate.setDate(input.now.getDate() - input.periodDays);
  const recentStats = input.stats.filter(
    (item) => new Date(item.date) >= pastDate,
  );

  if (recentStats.length === 0) {
    return {
      lifetimeProfit,
      avgHandsLastPeriod: 0,
      winrateLastPeriod: 0,
    };
  }

  const totalHands = recentStats.reduce((sum, item) => sum + item.hands, 0);
  const totalProfit = recentStats.reduce((sum, item) => sum + item.profit, 0);
  const avgHands = totalHands / input.periodDays;

  const bbValueCents = getLimitBuyIn(input.currentLimit) / 100;
  const winrate = computeWinrateBbPer100(totalProfit, totalHands, bbValueCents);

  return {
    lifetimeProfit,
    avgHandsLastPeriod: Math.round(avgHands),
    winrateLastPeriod: parseFloat(winrate.toFixed(2)),
  };
};
