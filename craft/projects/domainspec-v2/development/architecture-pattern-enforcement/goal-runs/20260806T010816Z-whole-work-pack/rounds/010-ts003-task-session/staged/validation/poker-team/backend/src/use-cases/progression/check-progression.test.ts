import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerStatsSnapshot } from "../../domain/player-stats/player-stats.entity";
import { PlayerRepository } from "../../domain/player/player.repository";
import { checkProgressionUseCase } from "./check-progression";
import {
  ProgressionEvent,
  ProgressionEventHandler,
} from "../../domain/progression/progression.events";

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

describe("check-progression use-case", () => {
  let playerStatsRepo: PlayerStatsRepository;
  let playerRepo: PlayerRepository;
  let onEvent: ProgressionEventHandler;

  beforeEach(() => {
    playerStatsRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findByPlayerAndDate: vi.fn(),
      findByPlayerId: vi
        .fn()
        .mockResolvedValue({ entries: [], nextCursor: null }),
      aggregateWindow: vi.fn(),
    };

    playerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };

    onEvent = vi.fn<ProgressionEventHandler>();
  });

  it("throws when player does not exist", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue(null);

    const useCase = checkProgressionUseCase(playerStatsRepo, playerRepo);

    await expect(useCase("missing-player")).rejects.toThrow("Player not found");
  });

  it("returns no-stats status for empty period data", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue({
      id: "p1",
      name: "Player One",
      email: "p1@test.com",
      currentLimit: "NL20",
      status: "ACTIVE",
      bankroll: 100,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [],
      nextCursor: null,
    });

    const useCase = checkProgressionUseCase(playerStatsRepo, playerRepo);
    const result = await useCase("p1");

    expect(result).toEqual({
      eligibleForPromotion: false,
      reason: "No stats in period",
      avgHands: 0,
      winrate: 0,
      period: "BI_WEEKLY",
    });
  });

  it("marks player eligible for bi-weekly promotion when criteria are met", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue({
      id: "p1",
      name: "Player One",
      email: "p1@test.com",
      currentLimit: "NL20",
      status: "ACTIVE",
      bankroll: 100,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: new Date().toISOString().slice(0, 10),
          hands: 15000,
          profit: 24000,
        }),
      ],
      nextCursor: null,
    });

    const useCase = checkProgressionUseCase(playerStatsRepo, playerRepo);
    const result = await useCase("p1", 15);

    expect(result.eligibleForPromotion).toBe(true);
    expect(result.reason).toBe("Met Bi-Weekly criteria");
    expect(result.avgHands).toBe(1000);
    expect(result.winrate).toBe(8);
    expect(result.period).toBe("BI_WEEKLY");
  });

  it("returns monthly miss reason when criteria are not met", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue({
      id: "p1",
      name: "Player One",
      email: "p1@test.com",
      currentLimit: "NL20",
      status: "ACTIVE",
      bankroll: 100,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: new Date().toISOString().slice(0, 10),
          hands: 15000,
          profit: 12000,
        }),
      ],
      nextCursor: null,
    });

    const useCase = checkProgressionUseCase(playerStatsRepo, playerRepo);
    const result = await useCase("p1", 30);

    expect(result.eligibleForPromotion).toBe(false);
    expect(result.reason).toBe(
      "Missed criteria. Hands: 500/1000, Winrate: 4.00/5",
    );
    expect(result.avgHands).toBe(500);
    expect(result.winrate).toBe(4);
    expect(result.period).toBe("MONTHLY");
  });

  it("emits ProgressionChecked with deterministic payload", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue({
      id: "p1",
      name: "Player One",
      email: "p1@test.com",
      currentLimit: "NL20",
      status: "ACTIVE",
      bankroll: 100,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(playerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: new Date().toISOString().slice(0, 10),
          hands: 15000,
          profit: 24000,
        }),
      ],
      nextCursor: null,
    });

    const useCase = checkProgressionUseCase(playerStatsRepo, playerRepo, onEvent);
    await useCase("p1", 15);

    const events = vi
      .mocked(onEvent)
      .mock.calls.map(([event]) => event as ProgressionEvent);
    const checked = events.find((event) => event.type === "ProgressionChecked");

    expect(checked).toMatchObject({
      type: "ProgressionChecked",
      playerId: "p1",
      eligibleForPromotion: true,
      period: "BI_WEEKLY",
    });
    expect(checked?.occurredAt).toBeInstanceOf(Date);
  });
});
