import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayerUseCase } from "./create-player";
import { PlayerRepository } from "../../domain/player/player.repository";
import { Player } from "../../domain/player/player.entity";

describe("create-player use-case", () => {
  let playerRepo: PlayerRepository;

  beforeEach(() => {
    playerRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };
  });

  it("delegates player creation to repository", async () => {
    const created: Player = {
      id: "p1",
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
      status: "OBSERVATION",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(playerRepo.create).mockResolvedValue(created);

    const useCase = createPlayerUseCase(playerRepo);
    const result = await useCase({
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
    });

    expect(playerRepo.create).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
    });
    expect(result).toEqual(created);
  });

  it("emits PlayerCreated when player is persisted", async () => {
    const createdAt = new Date("2026-04-24T17:00:00.000Z");
    const created: Player = {
      id: "p1",
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
      status: "OBSERVATION",
      bankroll: 0,
      makeup: 0,
      createdAt,
      updatedAt: createdAt,
    };
    const onEvent = vi.fn();

    vi.mocked(playerRepo.create).mockResolvedValue(created);

    const useCase = createPlayerUseCase(playerRepo, onEvent);
    await useCase({
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
    });

    expect(onEvent).toHaveBeenCalledWith({
      type: "PlayerCreated",
      playerId: "p1",
      emailKey: "johnexamplecom",
      currentLimit: "NL20",
      occurredAt: createdAt,
    });
  });

  it("forwards optional initialBankroll", async () => {
    const created: Player = {
      id: "p2",
      name: "Jane Doe",
      email: "jane@example.com",
      currentLimit: "NL40",
      status: "OBSERVATION",
      bankroll: 500,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(playerRepo.create).mockResolvedValue(created);

    const useCase = createPlayerUseCase(playerRepo);
    await useCase({
      name: "Jane Doe",
      email: "jane@example.com",
      currentLimit: "NL40",
      initialBankroll: 500,
    });

    expect(playerRepo.create).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      currentLimit: "NL40",
      initialBankroll: 500,
    });
  });

  it("propagates repository errors", async () => {
    vi.mocked(playerRepo.create).mockRejectedValue(new Error("db error"));

    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John Doe",
        email: "john@example.com",
        currentLimit: "NL20",
      }),
    ).rejects.toThrow("db error");
  });

  it("rejects missing name", async () => {
    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "",
        email: "john@example.com",
        currentLimit: "NL20",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects invalid current limit", async () => {
    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John",
        email: "john@example.com",
        currentLimit: "NL10",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects negative initial bankroll", async () => {
    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John",
        email: "john@example.com",
        currentLimit: "NL20",
        initialBankroll: -1,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects duplicate canonical email", async () => {
    vi.mocked(playerRepo.create).mockRejectedValue({
      code: "23505",
      constraint: "players_canonical_email_unique",
    });

    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John",
        email: "johnsmith@example.com",
        currentLimit: "NL20",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_EMAIL",
    });
  });

  it("rejects duplicate principal linkage", async () => {
    vi.mocked(playerRepo.create).mockRejectedValue({
      code: "23505",
      constraint: "players_principal_id_unique",
    });

    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John",
        email: "johnsmith@example.com",
        currentLimit: "NL20",
        principalId: "principal-1",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_PRINCIPAL_ID",
    });
  });

  it("normalizes email before persistence", async () => {
    vi.mocked(playerRepo.create).mockResolvedValue({
      id: "p1",
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
      status: "OBSERVATION",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = createPlayerUseCase(playerRepo);
    await useCase({
      name: "John Doe",
      email: "  JOHN@Example.com  ",
      currentLimit: "NL20",
    });

    expect(playerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "john@example.com" }),
    );
  });

  it("normalizes and persists principalId when provided", async () => {
    vi.mocked(playerRepo.create).mockResolvedValue({
      id: "p3",
      principalId: "principal-1",
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
      status: "OBSERVATION",
      bankroll: 0,
      makeup: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = createPlayerUseCase(playerRepo);
    await useCase({
      name: "John Doe",
      email: "john@example.com",
      currentLimit: "NL20",
      principalId: "  principal-1  ",
    });

    expect(playerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ principalId: "principal-1" }),
    );
  });

  it("rejects blank principalId", async () => {
    const useCase = createPlayerUseCase(playerRepo);

    await expect(
      useCase({
        name: "John Doe",
        email: "john@example.com",
        currentLimit: "NL20",
        principalId: "   ",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: { field: "principalId" },
    });
  });
});
