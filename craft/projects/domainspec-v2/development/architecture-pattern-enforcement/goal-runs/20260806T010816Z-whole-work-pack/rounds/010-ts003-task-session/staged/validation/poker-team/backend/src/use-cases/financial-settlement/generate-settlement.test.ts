import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateSettlementUseCase } from "./generate-settlement";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { Player } from "../../domain/player/player.entity";
import { PlayerStatsSnapshot } from "../../domain/player-stats/player-stats.entity";
import {
  SettlementEvent,
  SettlementEventHandler,
} from "../../domain/settlement/settlement.events";

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

describe("Generate Settlement Use Case", () => {
  let mockPlayerStatsRepo: PlayerStatsRepository;
  let mockPlayerRepo: PlayerRepository;
  let mockTransactionRepo: TransactionRepository;
  let onEvent: SettlementEventHandler;

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
      update: vi.fn().mockResolvedValue({} as any),
    };
    mockTransactionRepo = {
      create: vi.fn().mockResolvedValue({} as any),
      findByPlayerId: vi.fn().mockResolvedValue([]),
    };
    onEvent = vi.fn<SettlementEventHandler>();
  });

  it("should calculate profit share correctly for NL10 player with no makeup", async () => {
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
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-01",
        profit: 1000,
        hands: 1000,
      }),
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-02",
        profit: 500,
        hands: 500,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await useCase("p1", "2024-01-01", "2024-01-31");

    expect(result.totalProfit).toBe(1500);
    expect(result.netProfit).toBe(1500);
    expect(result.playerProfitShare).toBe(600);
    expect(result.totalPayout).toBe(600);
    expect(result.newMakeup).toBe(0);

    expect(mockTransactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "PAYOUT",
        amount: 600,
      }),
    );
  });

  it("should handle makeup correctly (profit < makeup)", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL10",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 2000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-01",
        profit: 1000,
        hands: 1000,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await useCase("p1", "2024-01-01", "2024-01-31");

    expect(result.totalProfit).toBe(1000);
    expect(result.netProfit).toBe(-1000);
    expect(result.playerProfitShare).toBe(0);
    expect(result.totalPayout).toBe(0);
    expect(result.newMakeup).toBe(1000);

    expect(mockPlayerRepo.update).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        makeup: 1000,
      }),
    );
    expect(mockTransactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MAKEUP_APPLIED",
        amount: 1000,
      }),
    );
  });

  it("should handle Rakback logic correctly (Makeup exists)", async () => {
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
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({ playerId: "p1", statDate: "2024-01-01", rakeback: 400 }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await useCase("p1", "2024-01-01", "2024-01-31");

    expect(result.newMakeup).toBe(100);
    expect(result.totalPayout).toBe(0);

    expect(mockPlayerRepo.update).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        makeup: 100,
      }),
    );
    expect(mockTransactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MAKEUP_APPLIED",
        amount: 400,
      }),
    );
  });

  it("should not duplicate settlement events when same period already has events", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL100",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-20",
        profit: 500,
        hands: 1000,
        rakeback: 200,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });
    vi.mocked(mockTransactionRepo.findByPlayerId).mockResolvedValue([
      {
        id: "t1",
        playerId: "p1",
        type: "MAKEUP_APPLIED",
        amount: 100,
        date: "2024-01-31",
        createdAt: new Date(),
      },
      {
        id: "t2",
        playerId: "p1",
        type: "PAYOUT",
        amount: 250,
        date: "2024-01-31",
        createdAt: new Date(),
      },
    ] as any);

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
    );
    const result = await useCase("p1", "2024-01-01", "2024-01-31");

    expect(result.newMakeup).toBe(0);
    expect(result.totalPayout).toBeGreaterThan(0);

    expect(mockTransactionRepo.create).not.toHaveBeenCalled();
  });

  it("emits SettlementGenerated with canonical payload", async () => {
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
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-01",
        profit: 1000,
        rakeback: 200,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
      undefined,
      onEvent,
    );

    await useCase("p1", "2024-01-01", "2024-01-31");

    const events = vi
      .mocked(onEvent)
      .mock.calls.map(([event]) => event as SettlementEvent);
    const generated = events.find((event) => event.type === "SettlementGenerated");

    expect(generated).toMatchObject({
      type: "SettlementGenerated",
      playerId: "p1",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      totalProfit: 1000,
      totalRakeback: 200,
      previousMakeup: 0,
      newMakeup: 0,
    });
    expect(generated?.occurredAt).toBeInstanceOf(Date);
  });

  it("emits PayoutCreated when payout is positive", async () => {
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
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-01",
        profit: 1000,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
      undefined,
      onEvent,
    );

    await useCase("p1", "2024-01-01", "2024-01-31");

    const events = vi
      .mocked(onEvent)
      .mock.calls.map(([event]) => event as SettlementEvent);
    const payoutEvent = events.find((event) => event.type === "PayoutCreated");

    expect(payoutEvent).toMatchObject({
      type: "PayoutCreated",
      playerId: "p1",
      date: "2024-01-31",
      amount: 400,
    });
    expect(payoutEvent?.occurredAt).toBeInstanceOf(Date);
  });

  it("does not emit PayoutCreated when payout is zero", async () => {
    const player: Player = {
      id: "p1",
      name: "Test",
      email: "t@t.com",
      currentLimit: "NL10",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 2000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const entries: PlayerStatsSnapshot[] = [
      makeSnapshot({
        playerId: "p1",
        statDate: "2024-01-01",
        profit: 1000,
      }),
    ];

    vi.mocked(mockPlayerRepo.findById).mockResolvedValue(player);
    vi.mocked(mockPlayerStatsRepo.findByPlayerId).mockResolvedValue({
      entries,
      nextCursor: null,
    });

    const useCase = generateSettlementUseCase(
      mockPlayerStatsRepo,
      mockPlayerRepo,
      mockTransactionRepo,
      undefined,
      onEvent,
    );

    await useCase("p1", "2024-01-01", "2024-01-31");

    const events = vi
      .mocked(onEvent)
      .mock.calls.map(([event]) => event as SettlementEvent);

    expect(events.some((event) => event.type === "PayoutCreated")).toBe(false);
  });
});
