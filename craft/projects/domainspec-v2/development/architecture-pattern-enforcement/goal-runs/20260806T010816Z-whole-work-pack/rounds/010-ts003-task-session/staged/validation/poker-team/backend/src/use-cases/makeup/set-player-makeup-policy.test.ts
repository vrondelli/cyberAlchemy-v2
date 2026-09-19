import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPlayerMakeupPolicyUseCase } from "./set-player-makeup-policy";
import type { PlayerRepository } from "../../domain/player/player.repository";

describe("setPlayerMakeupPolicyUseCase", () => {
  const mockPlayer = {
    id: "p1",
    name: "Test",
    email: "test@test.com",
    currentLimit: "NL100",
    createdAt: new Date(),
    status: "ACTIVE" as const,
    makeupPolicy: null,
  };

  const mockRepo: PlayerRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockPlayer,
    );
    (mockRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockPlayer,
      makeupPolicy: {
        applyProfitFirst: false,
        applyRakebackSecond: true,
        playerRakebackShare: 0.7,
      },
    });
  });

  it("sets policy on existing player", async () => {
    const setPolicy = setPlayerMakeupPolicyUseCase(mockRepo);

    const result = await setPolicy({
      playerId: "p1",
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.7,
    });

    expect(result).toEqual({
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.7,
    });
    expect(mockRepo.update).toHaveBeenCalledWith("p1", {
      makeupPolicy: {
        applyProfitFirst: false,
        applyRakebackSecond: true,
        playerRakebackShare: 0.7,
      },
    });
  });

  it("throws Player not found for unknown player", async () => {
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const setPolicy = setPlayerMakeupPolicyUseCase(mockRepo);

    await expect(
      setPolicy({
        playerId: "unknown",
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 0.5,
      }),
    ).rejects.toThrow("Player not found");
  });

  it("clamps playerRakebackShare to [0, 1]", async () => {
    const setPolicy = setPlayerMakeupPolicyUseCase(mockRepo);

    await setPolicy({
      playerId: "p1",
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: 1.5,
    });

    expect(mockRepo.update).toHaveBeenCalledWith("p1", {
      makeupPolicy: expect.objectContaining({
        playerRakebackShare: 1,
      }),
    });

    await setPolicy({
      playerId: "p1",
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: -0.5,
    });

    expect(mockRepo.update).toHaveBeenCalledWith("p1", {
      makeupPolicy: expect.objectContaining({
        playerRakebackShare: 0,
      }),
    });
  });

  it("rejects non-finite playerRakebackShare", async () => {
    const setPolicy = setPlayerMakeupPolicyUseCase(mockRepo);

    await expect(
      setPolicy({
        playerId: "p1",
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: Infinity,
      }),
    ).rejects.toThrow("Invalid policy shape");
  });
});
