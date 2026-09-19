import { describe, expect, it, vi, beforeEach } from "vitest";
import { recordPlayerStatsUseCase } from "./record-player-stats";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import { PlayerStatsEventHandler } from "../../domain/player-stats/player-stats.events";
import { PlayerStatsValidationError } from "../../domain/player-stats/player-stats.validation";
import { RecordPlayerStatsInput } from "../../domain/player-stats/player-stats.entity";

const validInput: RecordPlayerStatsInput = {
  playerId: "p1",
  statDate: "2024-01-15",
  hands: 500,
  profit: 120.5,
  rakeback: 30,
  rake: 45,
  closingBankroll: 8200,
  sessionDuration: 180,
  sourceType: "MANUAL",
};

const mockPlayer = {
  id: "p1",
  name: "Test Player",
  email: "test@test.com",
  currentLimit: "NL10",
  status: "ACTIVE" as const,
  bankroll: 8000,
  makeup: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildMockStatsRepo(): PlayerStatsRepository {
  return {
    create: vi.fn().mockImplementation(async (data) => ({
      id: "snap-1",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn().mockImplementation(async (id, data) => ({
      id,
      playerId: data.playerId ?? "p1",
      statDate: data.statDate ?? "2024-01-15",
      hands: data.hands ?? 500,
      profit: data.profit ?? 120.5,
      rakeback: data.rakeback ?? 30,
      rake: data.rake ?? 45,
      closingBankroll: data.closingBankroll ?? 8200,
      sessionDuration: data.sessionDuration ?? 180,
      sourceType: data.sourceType ?? "MANUAL",
      status: data.status ?? "CORRECTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findByPlayerAndDate: vi.fn().mockResolvedValue(null),
    findByPlayerId: vi
      .fn()
      .mockResolvedValue({ entries: [], nextCursor: null }),
    aggregateWindow: vi.fn(),
  };
}

function buildMockPlayerRepo(): PlayerRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockPlayer),
    findAll: vi.fn(),
    update: vi.fn(),
  };
}

describe("RecordPlayerStats Use Case", () => {
  let statsRepo: PlayerStatsRepository;
  let playerRepo: PlayerRepository;
  let onEvent: PlayerStatsEventHandler;

  beforeEach(() => {
    statsRepo = buildMockStatsRepo();
    playerRepo = buildMockPlayerRepo();
    onEvent = vi.fn();
  });

  // --- DST-RULE-001: Player must exist ---
  it("DST-RULE-001: returns PLAYER_NOT_FOUND for unknown player", async () => {
    vi.mocked(playerRepo.findById).mockResolvedValue(null);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(useCase(validInput)).rejects.toThrow(
      expect.objectContaining({
        code: "PLAYER_NOT_FOUND",
      }),
    );
  });

  // --- DST-RULE-002: statDate must be valid ---
  it("DST-RULE-002: returns VALIDATION_ERROR for invalid statDate", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(
      useCase({ ...validInput, statDate: "not-a-date" }),
    ).rejects.toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });

  // --- DST-RULE-003: Hands non-negative integer ---
  it("DST-RULE-003: returns VALIDATION_ERROR for negative hands", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(useCase({ ...validInput, hands: -1 })).rejects.toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  it("DST-RULE-003: returns VALIDATION_ERROR for non-integer hands", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(useCase({ ...validInput, hands: 1.5 })).rejects.toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  // --- DST-RULE-004: sourceType must be supported ---
  it("DST-RULE-004: returns VALIDATION_ERROR for invalid sourceType", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(
      useCase({ ...validInput, sourceType: "INVALID" as any }),
    ).rejects.toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });

  // --- DST-RULE-005: Correction requires effective change ---
  it("DST-RULE-005: returns NO_CHANGES_DETECTED for unchanged correction", async () => {
    const existing = {
      id: "snap-1",
      ...validInput,
      status: "RECORDED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(statsRepo.findByPlayerAndDate).mockResolvedValue(existing);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(useCase(validInput)).rejects.toThrow(
      expect.objectContaining({ code: "NO_CHANGES_DETECTED" }),
    );
  });

  // --- DST-RULE-006: Rake non-negative ---
  it("DST-RULE-006: returns VALIDATION_ERROR for negative rake", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(useCase({ ...validInput, rake: -10 })).rejects.toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  // --- DST-RULE-007: sessionDuration non-negative integer ---
  it("DST-RULE-007: returns VALIDATION_ERROR for negative sessionDuration", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(
      useCase({ ...validInput, sessionDuration: -5 }),
    ).rejects.toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });

  it("DST-RULE-007: returns VALIDATION_ERROR for non-integer sessionDuration", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await expect(
      useCase({ ...validInput, sessionDuration: 1.5 }),
    ).rejects.toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });

  // --- DST-CALC-001: Record status ---
  it("DST-CALC-001: new snapshot gets RECORDED status", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);
    const result = await useCase(validInput);

    expect(result.action).toBe("recorded");
    expect(statsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "RECORDED" }),
    );
  });

  it("DST-CALC-001: correction gets CORRECTED status", async () => {
    const existing = {
      id: "snap-1",
      ...validInput,
      status: "RECORDED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(statsRepo.findByPlayerAndDate).mockResolvedValue(existing);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    const result = await useCase({ ...validInput, hands: 600 });

    expect(result.action).toBe("corrected");
    expect(statsRepo.update).toHaveBeenCalledWith(
      "snap-1",
      expect.objectContaining({ status: "CORRECTED" }),
    );
  });

  // --- DST-STATE-001: [new] → RECORDED ---
  it("DST-STATE-001: first write transitions to RECORDED", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);
    const result = await useCase(validInput);

    expect(result.snapshot.status).toBe("RECORDED");
  });

  // --- DST-STATE-002: RECORDED → CORRECTED ---
  it("DST-STATE-002: correction transitions status to CORRECTED", async () => {
    const existing = {
      id: "snap-1",
      ...validInput,
      status: "RECORDED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(statsRepo.findByPlayerAndDate).mockResolvedValue(existing);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    const result = await useCase({ ...validInput, profit: 200 });

    expect(result.snapshot.status).toBe("CORRECTED");
  });

  // --- DST-INV-001: Unique per player/date ---
  it("DST-INV-001: existing record triggers update not create", async () => {
    const existing = {
      id: "snap-1",
      ...validInput,
      status: "RECORDED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(statsRepo.findByPlayerAndDate).mockResolvedValue(existing);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await useCase({ ...validInput, hands: 600 });

    expect(statsRepo.create).not.toHaveBeenCalled();
    expect(statsRepo.update).toHaveBeenCalledTimes(1);
  });

  // --- DST-INV-002: Non-negative hands persisted ---
  it("DST-INV-002: hands are persisted with non-negative value", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);
    await useCase(validInput);

    expect(statsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ hands: 500 }),
    );
  });

  // --- DST-EVT-001: PlayerStatsRecorded emitted ---
  it("DST-EVT-001: emits PlayerStatsRecorded on first write", async () => {
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);
    await useCase(validInput);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "PlayerStatsRecorded",
        playerId: "p1",
        statDate: "2024-01-15",
      }),
    );
  });

  // --- DST-EVT-002: PlayerStatsCorrected emitted ---
  it("DST-EVT-002: emits PlayerStatsCorrected on correction", async () => {
    const existing = {
      id: "snap-1",
      ...validInput,
      status: "RECORDED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(statsRepo.findByPlayerAndDate).mockResolvedValue(existing);
    const useCase = recordPlayerStatsUseCase(statsRepo, playerRepo, onEvent);

    await useCase({ ...validInput, hands: 600 });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "PlayerStatsCorrected",
        playerId: "p1",
        statDate: "2024-01-15",
        changedFields: ["hands"],
      }),
    );
  });

  // --- DST-WF-001: Workflow path ---
  it("DST-WF-001: follows authorize → validate → persist → event sequence", async () => {
    const callOrder: string[] = [];

    vi.mocked(playerRepo.findById).mockImplementation(async () => {
      callOrder.push("findPlayer");
      return mockPlayer;
    });
    vi.mocked(statsRepo.findByPlayerAndDate).mockImplementation(async () => {
      callOrder.push("findExisting");
      return null;
    });
    vi.mocked(statsRepo.create).mockImplementation(async (data) => {
      callOrder.push("persist");
      return {
        id: "snap-1",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });
    const eventHandler: PlayerStatsEventHandler = vi
      .fn()
      .mockImplementation(() => {
        callOrder.push("emitEvent");
      });

    const useCase = recordPlayerStatsUseCase(
      statsRepo,
      playerRepo,
      eventHandler,
    );
    await useCase(validInput);

    expect(callOrder).toEqual([
      "findPlayer",
      "findExisting",
      "persist",
      "emitEvent",
    ]);
  });
});
