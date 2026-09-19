import { describe, expect, it, vi } from "vitest";
import { PlayerRepository } from "../../domain/player/player.repository";
import { getPlayerMakeupUseCase } from "./get-player-makeup";

describe("get-player-makeup use-case", () => {
  it("returns player makeup and global policy", async () => {
    const playerRepo: PlayerRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        name: "Player",
        email: "player@test.com",
        currentLimit: "NL50",
        status: "ACTIVE",
        bankroll: 0,
        makeup: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findAll: vi.fn(),
      update: vi.fn(),
    };

    const useCase = getPlayerMakeupUseCase(playerRepo);
    const result = await useCase("p1");

    expect(result).toEqual({
      playerId: "p1",
      currentMakeup: 75,
      policy: {
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 0.5,
      },
    });
  });

  it("throws when player does not exist", async () => {
    const playerRepo: PlayerRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      update: vi.fn(),
    };

    const useCase = getPlayerMakeupUseCase(playerRepo);
    await expect(useCase("missing")).rejects.toThrow("Player not found");
  });
});
