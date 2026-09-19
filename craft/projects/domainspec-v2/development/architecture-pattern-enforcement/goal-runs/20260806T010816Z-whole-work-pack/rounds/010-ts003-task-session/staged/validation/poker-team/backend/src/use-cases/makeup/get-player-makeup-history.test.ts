import { describe, expect, it, vi } from "vitest";
import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { getPlayerMakeupHistoryUseCase } from "./get-player-makeup-history";

describe("get-player-makeup-history use-case", () => {
  const makePlayerRepo = (exists = true): PlayerRepository => ({
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(
      exists
        ? {
            id: "p1",
            name: "Player",
            email: "player@test.com",
            currentLimit: "NL50",
            status: "ACTIVE",
            bankroll: 0,
            makeup: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    ),
    findAll: vi.fn(),
    update: vi.fn(),
  });

  const makeTransactionRepo = (): TransactionRepository => ({
    create: vi.fn(),
    findByPlayerId: vi.fn().mockResolvedValue([
      {
        id: "t3",
        playerId: "p1",
        type: "SANGRIA",
        amount: -20,
        date: "2026-04-08",
        createdAt: new Date("2026-04-08T12:00:00.000Z"),
      },
      {
        id: "t2",
        playerId: "p1",
        type: "MAKEUP_ADJUSTMENT",
        amount: 30,
        date: "2026-04-08",
        createdAt: new Date("2026-04-08T10:00:00.000Z"),
      },
      {
        id: "t1",
        playerId: "p1",
        type: "MAKEUP_APPLIED",
        amount: 10,
        date: "2026-04-07",
        createdAt: new Date("2026-04-07T11:00:00.000Z"),
      },
    ]),
  });

  it("filters to makeup transaction types and returns newest-first", async () => {
    const useCase = getPlayerMakeupHistoryUseCase(
      makePlayerRepo(),
      makeTransactionRepo(),
    );

    const result = await useCase({ playerId: "p1" });

    expect(result.entries).toHaveLength(2);
    expect(result.entries.map((entry) => entry.id)).toEqual(["t2", "t1"]);
    expect(result.nextCursor).toBeNull();
  });

  it("supports deterministic paging with cursor", async () => {
    const transactionRepo: TransactionRepository = {
      create: vi.fn(),
      findByPlayerId: vi.fn().mockResolvedValue([
        {
          id: "t4",
          playerId: "p1",
          type: "MAKEUP_ADJUSTMENT",
          amount: 40,
          date: "2026-04-08",
          createdAt: new Date("2026-04-08T12:00:00.000Z"),
        },
        {
          id: "t3",
          playerId: "p1",
          type: "MAKEUP_ADJUSTMENT",
          amount: 30,
          date: "2026-04-08",
          createdAt: new Date("2026-04-08T10:00:00.000Z"),
        },
        {
          id: "t2",
          playerId: "p1",
          type: "MAKEUP_APPLIED",
          amount: 20,
          date: "2026-04-07",
          createdAt: new Date("2026-04-07T11:00:00.000Z"),
        },
        {
          id: "t1",
          playerId: "p1",
          type: "MAKEUP_ADJUSTMENT",
          amount: 10,
          date: "2026-04-06",
          createdAt: new Date("2026-04-06T09:00:00.000Z"),
        },
      ]),
    };

    const useCase = getPlayerMakeupHistoryUseCase(makePlayerRepo(), transactionRepo);

    const firstPage = await useCase({ playerId: "p1", limit: 2 });
    expect(firstPage.entries.map((entry) => entry.id)).toEqual(["t4", "t3"]);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await useCase({
      playerId: "p1",
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });
    expect(secondPage.entries.map((entry) => entry.id)).toEqual(["t2", "t1"]);
  });

  it("throws for invalid limit", async () => {
    const useCase = getPlayerMakeupHistoryUseCase(
      makePlayerRepo(),
      makeTransactionRepo(),
    );

    await expect(useCase({ playerId: "p1", limit: 0 })).rejects.toThrow(
      "Invalid limit",
    );
  });

  it("throws for invalid cursor", async () => {
    const useCase = getPlayerMakeupHistoryUseCase(
      makePlayerRepo(),
      makeTransactionRepo(),
    );

    await expect(
      useCase({ playerId: "p1", cursor: "not-base64" }),
    ).rejects.toThrow("Invalid cursor");
  });

  it("throws when player does not exist", async () => {
    const useCase = getPlayerMakeupHistoryUseCase(
      makePlayerRepo(false),
      makeTransactionRepo(),
    );

    await expect(useCase({ playerId: "missing" })).rejects.toThrow(
      "Player not found",
    );
  });
});
