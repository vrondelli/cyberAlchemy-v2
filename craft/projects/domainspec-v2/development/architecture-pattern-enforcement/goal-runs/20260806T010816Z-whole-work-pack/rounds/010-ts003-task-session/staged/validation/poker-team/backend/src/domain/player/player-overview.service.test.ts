import { describe, expect, it } from "vitest";
import { computeOverviewMetrics } from "./player-overview.service";

describe("player-overview.service", () => {
  it("computes lifetime and period metrics", () => {
    const result = computeOverviewMetrics({
      stats: [
        {
          date: new Date().toISOString().slice(0, 10),
          hands: 3000,
          profit: 600,
        },
      ],
      currentLimit: "NL20",
      periodDays: 30,
      now: new Date(),
    });

    expect(result).toEqual({
      lifetimeProfit: 600,
      avgHandsLastPeriod: 100,
      winrateLastPeriod: 1,
    });
  });

  it("returns zeroed recent metrics when no data in period", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);

    const result = computeOverviewMetrics({
      stats: [
        { date: oldDate.toISOString().slice(0, 10), hands: 5000, profit: 100 },
      ],
      currentLimit: "NL20",
      periodDays: 30,
      now: new Date(),
    });

    expect(result).toEqual({
      lifetimeProfit: 100,
      avgHandsLastPeriod: 0,
      winrateLastPeriod: 0,
    });
  });
});
