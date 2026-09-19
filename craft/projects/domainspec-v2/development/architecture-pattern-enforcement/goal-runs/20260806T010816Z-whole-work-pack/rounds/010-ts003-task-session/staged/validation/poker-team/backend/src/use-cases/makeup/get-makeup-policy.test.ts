import { describe, expect, it } from "vitest";
import { getMakeupPolicyUseCase } from "./get-makeup-policy";
import { PlayerRepository } from "../../domain/player/player.repository";

const makePlayerRepo = (
  player: Record<string, unknown> | null = null,
): PlayerRepository => ({
  create: async () => {
    throw new Error("not implemented");
  },
  findById: async () => player as any,
  findAll: async () => [],
  update: async () => {
    throw new Error("not implemented");
  },
});

describe("get-makeup-policy use-case", () => {
  it("returns global default makeup policy", async () => {
    const result = await getMakeupPolicyUseCase(makePlayerRepo());

    expect(result).toEqual({
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: 0.5,
    });
  });

  // PMK-QUERY-006: Player-aware policy scope — override present
  it("resolves from player override when present", async () => {
    const player = {
      id: "p1",
      name: "Player",
      email: "p@test.com",
      currentLimit: "NL50",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 0,
      makeupPolicy: { applyProfitFirst: false, playerRakebackShare: 0.3 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getMakeupPolicyUseCase(makePlayerRepo(player), "p1");

    expect(result).toEqual({
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.3,
    });
  });

  // PMK-QUERY-006: Player-aware policy scope — no override, fallback to default
  it("falls back to default when player has no override", async () => {
    const player = {
      id: "p1",
      name: "Player",
      email: "p@test.com",
      currentLimit: "NL50",
      status: "ACTIVE",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getMakeupPolicyUseCase(makePlayerRepo(player), "p1");

    expect(result).toEqual({
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: 0.5,
    });
  });
});
