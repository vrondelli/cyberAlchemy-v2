import { describe, expect, it } from "vitest";
import {
  buildPlayerStatsWindow,
  derivePlayerStatsWindowMetrics,
} from "./player-stats-window-policy.service";

const aggregate = {
  totalHands: 3000,
  totalProfit: 450,
  totalRakeback: 120,
  totalRake: 200,
  totalSessionMinutes: 900,
  sessionCount: 5,
};

describe("player-stats-window-policy.service", () => {
  it("derives avgHandsPerDay deterministically", () => {
    const result = derivePlayerStatsWindowMetrics(aggregate);

    expect(result.avgHandsPerDay).toBe(600);
    expect(result.winrateBbPer100).toBeNull();
  });

  it("derives winrateBbPer100 when currentLimit is provided", () => {
    const result = derivePlayerStatsWindowMetrics(aggregate, "NL10");

    expect(result.winrateBbPer100).toBe(150);
  });

  it("returns null winrate for unsupported limit format", () => {
    const result = derivePlayerStatsWindowMetrics(aggregate, "PLO50");

    expect(result.winrateBbPer100).toBeNull();
  });

  it("builds full window projection with aggregate and derived fields", () => {
    const result = buildPlayerStatsWindow({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      aggregate,
      currentLimit: "NL10",
    });

    expect(result).toMatchObject({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      totalHands: 3000,
      totalProfit: 450,
      sessionCount: 5,
      avgHandsPerDay: 600,
      winrateBbPer100: 150,
    });
  });
});
