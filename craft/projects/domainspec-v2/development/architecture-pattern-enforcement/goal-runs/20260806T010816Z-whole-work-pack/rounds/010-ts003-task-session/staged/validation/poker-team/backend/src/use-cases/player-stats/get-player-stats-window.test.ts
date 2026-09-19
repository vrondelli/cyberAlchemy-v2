import { describe, expect, it, vi } from "vitest";
import { getPlayerStatsWindowUseCase } from "./get-player-stats-window";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";

function buildMockRepo(): PlayerStatsRepository {
  return {
    create: vi.fn(),
    update: vi.fn(),
    findByPlayerAndDate: vi.fn(),
    findByPlayerId: vi.fn(),
    aggregateWindow: vi.fn().mockResolvedValue({
      totalHands: 3000,
      totalProfit: 450,
      totalRakeback: 120,
      totalRake: 200,
      totalSessionMinutes: 900,
      sessionCount: 5,
    }),
  };
}

describe("GetPlayerStatsWindow Query", () => {
  // --- DST-QUERY-002: Aggregates match sum of snapshots ---
  it("DST-QUERY-002: returns deterministic aggregate projection", async () => {
    const repo = buildMockRepo();
    const query = getPlayerStatsWindowUseCase(repo);

    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
    });

    expect(result.playerId).toBe("p1");
    expect(result.fromDate).toBe("2024-01-01");
    expect(result.toDate).toBe("2024-01-31");
    expect(result.totalHands).toBe(3000);
    expect(result.totalProfit).toBe(450);
    expect(result.totalRakeback).toBe(120);
    expect(result.totalRake).toBe(200);
    expect(result.totalSessionMinutes).toBe(900);
    expect(result.sessionCount).toBe(5);
  });

  // --- DST-QUERY-003: Derived metrics ---
  it("DST-QUERY-003: avgHandsPerDay = totalHands / sessionCount", async () => {
    const repo = buildMockRepo();
    const query = getPlayerStatsWindowUseCase(repo);

    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
    });

    expect(result.avgHandsPerDay).toBe(600); // 3000 / 5
  });

  it("DST-QUERY-003: winrate = (totalProfit / bbValue) / (totalHands / 100) when limit provided", async () => {
    const repo = buildMockRepo();
    const query = getPlayerStatsWindowUseCase(repo);

    // NL10 → BB = $0.10
    // winrate = (450 / 0.10) / (3000 / 100) = 4500 / 30 = 150.00
    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      currentLimit: "NL10",
    });

    expect(result.winrateBbPer100).toBe(150);
  });

  // --- DST-QUERY-004: winrate null when conditions not met ---
  it("DST-QUERY-004: winrateBbPer100 is null when currentLimit not provided", async () => {
    const repo = buildMockRepo();
    const query = getPlayerStatsWindowUseCase(repo);

    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
    });

    expect(result.winrateBbPer100).toBeNull();
  });

  it("DST-QUERY-004: winrateBbPer100 is null when totalHands = 0", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.aggregateWindow).mockResolvedValue({
      totalHands: 0,
      totalProfit: 0,
      totalRakeback: 0,
      totalRake: 0,
      totalSessionMinutes: 0,
      sessionCount: 0,
    });
    const query = getPlayerStatsWindowUseCase(repo);

    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      currentLimit: "NL10",
    });

    expect(result.winrateBbPer100).toBeNull();
  });

  it("DST-QUERY-002: rejects when toDate < fromDate", async () => {
    const repo = buildMockRepo();
    const query = getPlayerStatsWindowUseCase(repo);

    await expect(
      query({ playerId: "p1", fromDate: "2024-02-01", toDate: "2024-01-01" }),
    ).rejects.toThrow("toDate must be >= fromDate");
  });
});
