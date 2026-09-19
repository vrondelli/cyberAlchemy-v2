import { computeWinrateBbPer100 } from "../shared/winrate";
import { PlayerStatsWindow } from "./player-stats-window.vo";

export type PlayerStatsWindowAggregate = Omit<
  PlayerStatsWindow,
  "playerId" | "fromDate" | "toDate" | "avgHandsPerDay" | "winrateBbPer100"
>;

type BuildPlayerStatsWindowInput = {
  playerId: string;
  fromDate: string;
  toDate: string;
  aggregate: PlayerStatsWindowAggregate;
  currentLimit?: string;
};

function parseBbValue(currentLimit: string): number | null {
  const match = currentLimit.match(/^NL(\d+)$/);
  if (!match) return null;
  // NL10 -> big blind = $0.10, NL100 -> BB = $1.00
  return parseInt(match[1], 10) / 100;
}

export function derivePlayerStatsWindowMetrics(
  aggregate: PlayerStatsWindowAggregate,
  currentLimit?: string,
): Pick<PlayerStatsWindow, "avgHandsPerDay" | "winrateBbPer100"> {
  const avgHandsPerDay =
    aggregate.sessionCount > 0
      ? Math.round(aggregate.totalHands / aggregate.sessionCount)
      : 0;

  let winrateBbPer100: number | null = null;
  if (currentLimit && aggregate.totalHands > 0) {
    const bbValue = parseBbValue(currentLimit);
    if (bbValue && bbValue > 0) {
      winrateBbPer100 =
        Math.round(
          computeWinrateBbPer100(
            aggregate.totalProfit,
            aggregate.totalHands,
            bbValue,
          ) * 100,
        ) / 100;
    }
  }

  return {
    avgHandsPerDay,
    winrateBbPer100,
  };
}

export function buildPlayerStatsWindow(
  input: BuildPlayerStatsWindowInput,
): PlayerStatsWindow {
  const derived = derivePlayerStatsWindowMetrics(
    input.aggregate,
    input.currentLimit,
  );

  return {
    playerId: input.playerId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    ...input.aggregate,
    ...derived,
  };
}
