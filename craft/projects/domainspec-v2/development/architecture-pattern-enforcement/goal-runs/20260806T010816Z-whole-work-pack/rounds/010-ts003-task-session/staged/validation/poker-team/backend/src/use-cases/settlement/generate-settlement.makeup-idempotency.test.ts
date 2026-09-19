import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { generateSettlementUseCase } from "../financial-settlement/generate-settlement";

describe("generate-settlement makeup idempotency", () => {
  let playerStatsRepo: PlayerStatsRepository;
  let playerRepo: PlayerRepository;
  let transactionRepo: TransactionRepository;

  beforeEach(() => {
    playerStatsRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findByPlayerAndDate: vi.fn(),
      findByPlayerId: vi.fn().mockResolvedValue({
        entries: [
          {
            id: "s1",
            playerId: "p1",
            statDate: "2026-04-05",
            profit: 800,
            hands: 1000,
            rakeback: 100,
            rake: 0,
            closingBankroll: 0,
            sessionDuration: 0,
            sourceType: "MANUAL",
            status: "RECORDED",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        nextCursor: null,
      }),
      aggregateWindow: vi.fn(),
    };

    playerRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        name: "Player",
        email: "player@test.com",
        currentLimit: "NL100",
        status: "ACTIVE",
        bankroll: 0,
        makeup: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findAll: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    };

    transactionRepo = {
      create: vi.fn().mockResolvedValue({}),
      findByPlayerId: vi.fn().mockResolvedValue([]),
    };
  });

  it("does not create duplicate MAKEUP_APPLIED for same player and period date", async () => {
    vi.mocked(transactionRepo.findByPlayerId).mockResolvedValueOnce([
      {
        id: "t1",
        playerId: "p1",
        type: "MAKEUP_APPLIED",
        amount: 300,
        date: "2026-04-30",
        createdAt: new Date(),
      },
    ] as any);

    const useCase = generateSettlementUseCase(
      playerStatsRepo,
      playerRepo,
      transactionRepo,
    );

    await useCase("p1", "2026-04-01", "2026-04-30");

    const transactionCalls = vi.mocked(transactionRepo.create).mock.calls;
    expect(
      transactionCalls.find(
        ([input]) =>
          input.type === "MAKEUP_APPLIED" && input.date === "2026-04-30",
      ),
    ).toBeUndefined();
  });

  it("still allows payout creation when only MAKEUP_APPLIED already exists", async () => {
    vi.mocked(transactionRepo.findByPlayerId).mockResolvedValueOnce([
      {
        id: "t1",
        playerId: "p1",
        type: "MAKEUP_APPLIED",
        amount: 300,
        date: "2026-04-30",
        createdAt: new Date(),
      },
    ] as any);

    const useCase = generateSettlementUseCase(
      playerStatsRepo,
      playerRepo,
      transactionRepo,
    );

    await useCase("p1", "2026-04-01", "2026-04-30");

    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "PAYOUT",
        date: "2026-04-30",
      }),
    );
  });
});
