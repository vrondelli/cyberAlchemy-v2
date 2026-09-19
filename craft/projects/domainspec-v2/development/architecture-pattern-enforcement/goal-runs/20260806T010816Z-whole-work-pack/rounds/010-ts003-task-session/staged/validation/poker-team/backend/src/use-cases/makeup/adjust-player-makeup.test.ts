import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerRepository } from "../../domain/player/player.repository";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import { adjustPlayerMakeupUseCase } from "./adjust-player-makeup";

describe("adjust-player-makeup use-case", () => {
  let playerRepo: PlayerRepository;
  let transactionRepo: TransactionRepository;
  const auditMeta = {
    actorId: "manager-1",
    requestId: "req-1",
    reasonCode: "manual-adjustment",
    sourceChannel: "api",
  };

  beforeEach(() => {
    playerRepo = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        name: "Player",
        email: "player@test.com",
        currentLimit: "NL50",
        status: "ACTIVE",
        bankroll: 0,
        makeup: 100,
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

  it("increases makeup and records adjustment transaction", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);
    const result = await useCase({
      playerId: "p1",
      operation: "increase",
      amount: 35,
      ...auditMeta,
    });

    expect(result.currentMakeup).toBe(135);
    expect(playerRepo.update).toHaveBeenCalledWith("p1", { makeup: 135 });
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MAKEUP_ADJUSTMENT", amount: 35 }),
    );
  });

  it("applies deterministic half-up rounding for non-negative values", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    const result = await useCase({
      playerId: "p1",
      operation: "increase",
      amount: 0.5,
      ...auditMeta,
    });

    expect(result.amount).toBe(1);
    expect(result.currentMakeup).toBe(101);
  });

  it("decrease does not go below zero", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);
    const result = await useCase({
      playerId: "p1",
      operation: "decrease",
      amount: 999,
      ...auditMeta,
    });

    expect(result.currentMakeup).toBe(0);
    expect(playerRepo.update).toHaveBeenCalledWith("p1", { makeup: 0 });
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -100 }),
    );
  });

  it("rejects negative amount", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    await expect(
      useCase({
        playerId: "p1",
        operation: "set",
        amount: -1,
        ...auditMeta,
      }),
    ).rejects.toThrow("Invalid amount");
  });

  it("rejects invalid operation", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    await expect(
      useCase({
        playerId: "p1",
        operation: "invalid" as "increase",
        amount: 10,
        ...auditMeta,
      }),
    ).rejects.toThrow("Invalid operation");
  });

  it("does not create adjustment transaction when delta is zero", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    const result = await useCase({
      playerId: "p1",
      operation: "decrease",
      amount: 0,
      ...auditMeta,
    });

    expect(result.currentMakeup).toBe(100);
    expect(result.previousMakeup).toBe(100);
    expect(transactionRepo.create).not.toHaveBeenCalled();
  });

  it("returns player not found when target player does not exist", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValueOnce(null);
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    await expect(
      useCase({
        playerId: "missing",
        operation: "increase",
        amount: 10,
        ...auditMeta,
      }),
    ).rejects.toThrow("Player not found");
  });

  it("rejects missing audit metadata", async () => {
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    await expect(
      useCase({
        playerId: "p1",
        operation: "increase",
        amount: 10,
      }),
    ).rejects.toThrow("Invalid audit metadata");
  });

  // PMK-WF-008: Audit persistence failure surfaces error
  it("surfaces error when audit transaction persistence fails", async () => {
    vi.mocked(transactionRepo.create).mockRejectedValueOnce(
      new Error("DB write failed"),
    );
    const useCase = adjustPlayerMakeupUseCase(playerRepo, transactionRepo);

    await expect(
      useCase({
        playerId: "p1",
        operation: "increase",
        amount: 10,
        ...auditMeta,
      }),
    ).rejects.toThrow("DB write failed");
  });
});
