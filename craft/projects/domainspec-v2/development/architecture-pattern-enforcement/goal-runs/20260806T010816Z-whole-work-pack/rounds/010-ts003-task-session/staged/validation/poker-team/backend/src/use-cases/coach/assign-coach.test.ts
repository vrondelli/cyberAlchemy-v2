import { describe, expect, it, vi } from "vitest";
import { assignCoachUseCase } from "./assign-coach";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import type { PlayerRepository } from "../../domain/player/player.repository";
import type { Coach, CoachAssignment } from "../../domain/coach/coach.entity";
import type { Player } from "../../domain/player/player.entity";

const activeCoach: Coach = {
  id: "coach-1",
  principalId: "principal-1",
  name: "Coach",
  email: "coach@test.com",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveCoach: Coach = {
  ...activeCoach,
  id: "coach-inactive",
  status: "INACTIVE",
};

const player: Player = {
  id: "player-1",
  name: "Player",
  email: "p@test.com",
  currentLimit: "NL20",
  status: "ACTIVE",
  bankroll: 100,
  makeup: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAssignment: CoachAssignment = {
  id: "a-1",
  coachId: "coach-1",
  playerId: "player-1",
  assignedAt: new Date(),
  unassignedAt: null,
};

const createMockCoachRepo = (
  overrides?: Partial<CoachRepository>,
): CoachRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(activeCoach),
  findByPrincipalId: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createMockPlayerRepo = (
  overrides?: Partial<PlayerRepository>,
): PlayerRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(player),
  findAll: vi.fn().mockResolvedValue([player]),
  update: vi.fn(),
  ...overrides,
});

const createMockAssignmentRepo = (
  overrides?: Partial<CoachAssignmentRepository>,
): CoachAssignmentRepository => ({
  create: vi.fn().mockResolvedValue(mockAssignment),
  findActiveByCoachId: vi.fn().mockResolvedValue([]),
  findActiveByPlayerId: vi.fn().mockResolvedValue(null),
  softDelete: vi.fn().mockResolvedValue(null),
  findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("assignCoachUseCase", () => {
  // PM-ASGN-001: R1 coach exists pass
  it("allows assignment when coach exists", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(result.id).toBe("a-1");
  });

  it("emits CoachAssigned when assignment is created", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const onEvent = vi.fn();
    const useCase = assignCoachUseCase(
      coachRepo,
      playerRepo,
      assignmentRepo,
      onEvent,
    );

    await useCase({ coachId: "coach-1", playerId: "player-1" });

    expect(onEvent).toHaveBeenCalledWith({
      type: "CoachAssigned",
      assignmentId: "a-1",
      coachId: "coach-1",
      playerId: "player-1",
      assignedAt: mockAssignment.assignedAt,
    });
  });

  // PM-ASGN-002: R1 coach exists fail
  it("returns 404 when coach does not exist", async () => {
    const coachRepo = createMockCoachRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await expect(
      useCase({ coachId: "unknown", playerId: "player-1" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "COACH_NOT_FOUND" });
  });

  // PM-ASGN-003: R2 coach active pass
  it("allows assignment when coach is ACTIVE", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(result).toBeDefined();
  });

  // PM-ASGN-004: R2 coach active fail
  it("returns 409 COACH_INACTIVE when coach is not active", async () => {
    const coachRepo = createMockCoachRepo({
      findById: vi.fn().mockResolvedValue(inactiveCoach),
    });
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await expect(
      useCase({ coachId: "coach-inactive", playerId: "player-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "COACH_INACTIVE" });
  });

  // PM-ASGN-005: R3 player exists pass
  it("allows assignment when player exists", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(assignmentRepo.create).toHaveBeenCalledWith({
      coachId: "coach-1",
      playerId: "player-1",
    });
    expect(result).toBeDefined();
  });

  // PM-ASGN-006: R3 player exists fail
  it("returns 404 when player does not exist", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await expect(
      useCase({ coachId: "coach-1", playerId: "unknown" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "PLAYER_NOT_FOUND" });
  });

  // PM-ASGN-007: R4 no duplicate pass
  it("allows assignment when player has no active assignment", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(result.unassignedAt).toBeNull();
  });

  // PM-ASGN-008: R4 no duplicate fail
  it("returns 409 PLAYER_ALREADY_ASSIGNED when player has active assignment", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo({
      findActiveByPlayerId: vi.fn().mockResolvedValue(mockAssignment),
    });
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await expect(
      useCase({ coachId: "coach-1", playerId: "player-1" }),
    ).rejects.toMatchObject({
      code: "PLAYER_ALREADY_ASSIGNED",
    });
  });

  // PM-ASGN-009: Postcondition — creates assignment with unassignedAt=null
  it("persists assignment via repository create", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(assignmentRepo.create).toHaveBeenCalledOnce();
    expect(result.unassignedAt).toBeNull();
  });

  // PM-ASGN-010: Error state — 500 persistence
  it("propagates unexpected repository errors", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo({
      create: vi.fn().mockRejectedValue(new Error("DB failure")),
    });
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await expect(
      useCase({ coachId: "coach-1", playerId: "player-1" }),
    ).rejects.toThrow("DB failure");
  });

  // PM-CMAP-004: Mapping — params.coachId and params.playerId map directly
  it("passes coachId and playerId directly to repository create", async () => {
    const coachRepo = createMockCoachRepo();
    const playerRepo = createMockPlayerRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const useCase = assignCoachUseCase(coachRepo, playerRepo, assignmentRepo);
    await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(assignmentRepo.create).toHaveBeenCalledWith({
      coachId: "coach-1",
      playerId: "player-1",
    });
  });
});
