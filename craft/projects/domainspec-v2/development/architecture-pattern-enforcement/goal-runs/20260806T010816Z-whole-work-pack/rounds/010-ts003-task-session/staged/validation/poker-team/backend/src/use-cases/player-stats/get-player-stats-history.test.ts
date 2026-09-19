import { describe, expect, it, vi } from "vitest";
import { getPlayerStatsHistoryUseCase } from "./get-player-stats-history";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerStatsSnapshot } from "../../domain/player-stats/player-stats.entity";

function makeSnapshot(
  overrides: Partial<PlayerStatsSnapshot> = {},
): PlayerStatsSnapshot {
  return {
    id: "snap-1",
    playerId: "p1",
    statDate: "2024-01-15",
    hands: 500,
    profit: 100,
    rakeback: 30,
    rake: 45,
    closingBankroll: 8200,
    sessionDuration: 180,
    sourceType: "MANUAL",
    status: "RECORDED",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildMockRepo(): PlayerStatsRepository {
  return {
    create: vi.fn(),
    update: vi.fn(),
    findByPlayerAndDate: vi.fn(),
    findByPlayerId: vi
      .fn()
      .mockResolvedValue({ entries: [], nextCursor: null }),
    aggregateWindow: vi.fn(),
  };
}

describe("GetPlayerStatsHistory Query", () => {
  // --- DST-QUERY-001: History query ---
  it("DST-QUERY-001: returns entries newest-first with pagination", async () => {
    const repo = buildMockRepo();
    const entries = [
      makeSnapshot({ id: "s2", statDate: "2024-01-16" }),
      makeSnapshot({ id: "s1", statDate: "2024-01-15" }),
    ];
    vi.mocked(repo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: "2024-01-14",
    });

    const query = getPlayerStatsHistoryUseCase(repo);
    const result = await query({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
    });

    expect(result.playerId).toBe("p1");
    expect(result.entries).toHaveLength(2);
    expect(result.nextCursor).toBe("2024-01-14");
    expect(repo.findByPlayerId).toHaveBeenCalledWith("p1", {
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      limit: 50,
      cursor: undefined,
    });
  });

  it("DST-QUERY-001: respects limit and caps at 200", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findByPlayerId).mockResolvedValue({
      entries: [],
      nextCursor: null,
    });

    const query = getPlayerStatsHistoryUseCase(repo);
    await query({ playerId: "p1", limit: 999 });

    expect(repo.findByPlayerId).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ limit: 200 }),
    );
  });

  it("DST-QUERY-001: passes cursor for pagination", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findByPlayerId).mockResolvedValue({
      entries: [],
      nextCursor: null,
    });

    const query = getPlayerStatsHistoryUseCase(repo);
    await query({ playerId: "p1", cursor: "2024-01-10" });

    expect(repo.findByPlayerId).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ cursor: "2024-01-10" }),
    );
  });
});
