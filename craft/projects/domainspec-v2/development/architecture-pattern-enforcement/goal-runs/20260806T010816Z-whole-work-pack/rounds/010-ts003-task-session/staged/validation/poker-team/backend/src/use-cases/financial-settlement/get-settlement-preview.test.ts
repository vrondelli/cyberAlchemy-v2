import { describe, expect, it, vi, beforeEach } from "vitest";
import { getSettlementPreviewUseCase } from "./get-settlement-preview";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { Player } from "../../domain/player/player.entity";
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

describe("Get Settlement Preview Use Case", () => {
  let mockPlayerStatsRepo: PlayerStatsRepository;
  let mockPlayerRepo: PlayerRepository;
  let mockTransactionRepo: TransactionRepository;

  beforeEach(() => {
    mockPlayerStatsRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findByPlayerAndDate: vi.fn(),
      findByPlayerId: vi
        .fn()
        .mockResolvedValue({ entries: [], nextCursor: null }),
      aggregateWindow: vi.fn(),
    };
    mockPlayerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };
    mockTransactionRepo = {
      create: vi.fn(),
      findByPlayerId: vi.fn().mockResolvedValue([]),
    };
  });

  // QT-4: Missing player returns error
  it("throws when player does not exist", async () => {
    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(null);

    const preview = getSettlementPreviewUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );

    await expect(
      preview("missing", "2024-01-01", "2024-01-31"),
    ).rejects.toThrow("Player not found");
  });

  // QT-1: Returns projected figures without side-effects
  it("returns settlement projection without creating transactions or updating player", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL10",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: "2024-01-01",
          profit: 1000,
          rakeback: 200,
        }),
      ],
      nextCursor: null,
    });

    const preview = getSettlementPreviewUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await preview("p1", "2024-01-01", "2024-01-31");

    expect(result.totalProfit).toBe(1000);
    expect(result.totalPayout).toBeGreaterThan(0);

    // No side effects
    expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    expect(mockPlayerRepo.update).not.toHaveBeenCalled();
  });

  // QT-2: Uses player stats for requested date range
  it("filters stats by the requested date range", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL10",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: "2024-01-15",
          profit: 500,
          rakeback: 0,
        }),
        makeSnapshot({
          playerId: "p1",
          statDate: "2024-02-15",
          profit: 9999,
          rakeback: 0,
        }),
      ],
      nextCursor: null,
    });

    const preview = getSettlementPreviewUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await preview("p1", "2024-01-01", "2024-01-31");

    // Only the January record is included
    expect(result.totalProfit).toBe(500);
  });

  // QT-3: Applies makeup policy to project newMakeup and payout
  it("applies makeup policy to project correct newMakeup", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL10",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries: [
        makeSnapshot({
          playerId: "p1",
          statDate: "2024-01-10",
          profit: 300,
          rakeback: 100,
        }),
      ],
      nextCursor: null,
    });

    const preview = getSettlementPreviewUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await preview("p1", "2024-01-01", "2024-01-31");

    expect(result.previousMakeup).toBe(500);
    // profit 300 covers 300 of 500 debt, rakeback 100 covers 100 more -> remaining 100
    expect(result.newMakeup).toBe(100);
    expect(result.totalPayout).toBe(0);
  });
});
