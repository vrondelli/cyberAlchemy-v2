import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAllPlayersUseCase } from "./get-all-players";
import { PlayerRepository } from "../../domain/player/player.repository";

describe("get-all-players use-case", () => {
  let playerRepo: PlayerRepository;

  beforeEach(() => {
    playerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };
  });

  it("returns all players from repository", async () => {
    const players = [
      {
        id: "p1",
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
        status: "ACTIVE" as const,
        bankroll: 100,
        makeup: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(playerRepo.findAll).mockResolvedValue(players);

    const useCase = getAllPlayersUseCase(playerRepo);
    const result = await useCase();

    expect(playerRepo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual(players);
  });

  it("propagates repository errors", async () => {
    vi.mocked(playerRepo.findAll).mockRejectedValue(new Error("db error"));

    const useCase = getAllPlayersUseCase(playerRepo);

    await expect(useCase()).rejects.toThrow("db error");
  });
});
