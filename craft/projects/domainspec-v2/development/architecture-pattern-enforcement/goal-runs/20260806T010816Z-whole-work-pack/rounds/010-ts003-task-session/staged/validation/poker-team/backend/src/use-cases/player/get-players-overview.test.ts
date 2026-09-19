import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayersOverviewUseCase } from "./get-players-overview";
import { PlayerRepository } from "../../domain/player/player.repository";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerStatsSnapshot } from "../../domain/player-stats/player-stats.entity";

const makeSnapshot = (
  overrides: Partial<PlayerStatsSnapshot> & {
    playerId: string;
    statDate: string;
  },
): PlayerStatsSnapshot => ({
  id: "snap-" + Math.random().toString(36).slice(2, 6),
  hands: 0,
  profit: 0,
  rakeback: 0,
  rake: 0,
  closingBankroll: 0,
  sessionDuration: 0,
  sourceType: "MANUAL",
  status: "RECORDED",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("get-players-overview use-case", () => {
  let playerRepo: PlayerRepository;
  let playerStatsRepo: PlayerStatsRepository;

  beforeEach(() => {
    playerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };

    playerStatsRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findByPlayerAndDate: vi.fn(),
      findByPlayerId: vi
        .fn()
        .mockResolvedValue({ entries: [], nextCursor: null }),
      aggregateWindow: vi.fn(),
    };
  });

  it("returns overview projection with derived metrics", async () => {
    vi.mocked(playerRepo.findAll).mockResolvedValue([
      {
        id: "p1",
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
        status: "ACTIVE",
        bankroll: 100,
        makeup: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: new Date().toISOString().slice(0, 10),
          hands: 3000,
          profit: 600,
        }),
      ],
      nextCursor: null,
    });

    const useCase = getPlayersOverviewUseCase(playerRepo, playerStatsRepo);
    const result = await useCase();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "p1",
      name: "Player One",
      currentLimit: "NL20",
      lifetimeProfit: 600,
      avgHandsLastPeriod: 100,
      winrateLastPeriod: 1,
      periodDays: 30,
    });
  });

  it("returns zeroed recent metrics when there are no stats in the last 30 days", async () => {
    vi.mocked(playerRepo.findAll).mockResolvedValue([
      {
        id: "p1",
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
        status: "ACTIVE",
        bankroll: 100,
        makeup: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: oldDate.toISOString().slice(0, 10),
          hands: 2500,
          profit: 300,
          closingBankroll: 400,
        }),
      ],
      nextCursor: null,
    });

    const useCase = getPlayersOverviewUseCase(playerRepo, playerStatsRepo);
    const result = await useCase();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "p1",
      lifetimeProfit: 300,
      avgHandsLastPeriod: 0,
      winrateLastPeriod: 0,
      periodDays: 30,
    });
  });

  it("supports custom periodDays", async () => {
    vi.mocked(playerRepo.findAll).mockResolvedValue([
      {
        id: "p1",
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
        status: "ACTIVE",
        bankroll: 100,
        makeup: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: new Date().toISOString().slice(0, 10),
          hands: 1500,
          profit: 300,
          closingBankroll: 300,
        }),
      ],
      nextCursor: null,
    });

    const useCase = getPlayersOverviewUseCase(playerRepo, playerStatsRepo);
    const result = await useCase(15);

    expect(result[0]).toMatchObject({
      avgHandsLastPeriod: 100,
      periodDays: 15,
    });
  });

  it("returns one overview row per player and queries stats per player", async () => {
    vi.mocked(playerRepo.findAll).mockResolvedValue([
      {
        id: "p1",
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
        status: "ACTIVE",
        bankroll: 100,
        makeup: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "p2",
        name: "Player Two",
        email: "p2@test.com",
        currentLimit: "NL40",
        status: "OBSERVATION",
        bankroll: 200,
        makeup: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(playerStatsRepo.findByPlayerId)
      .mockResolvedValueOnce({ entries: [], nextCursor: null })
      .mockResolvedValueOnce({ entries: [], nextCursor: null });

    const useCase = getPlayersOverviewUseCase(playerRepo, playerStatsRepo);
    const result = await useCase();

    expect(playerStatsRepo.findByPlayerId).toHaveBeenCalledTimes(2);
    expect(playerStatsRepo.findByPlayerId).toHaveBeenNthCalledWith(1, "p1");
    expect(playerStatsRepo.findByPlayerId).toHaveBeenNthCalledWith(2, "p2");
    expect(result.map((r) => r.id)).toEqual(["p1", "p2"]);
  });

  it("propagates player repository errors", async () => {
    vi.mocked(playerRepo.findAll).mockRejectedValue(new Error("db error"));

    const useCase = getPlayersOverviewUseCase(playerRepo, playerStatsRepo);

    await expect(useCase()).rejects.toThrow("db error");
  });
});
