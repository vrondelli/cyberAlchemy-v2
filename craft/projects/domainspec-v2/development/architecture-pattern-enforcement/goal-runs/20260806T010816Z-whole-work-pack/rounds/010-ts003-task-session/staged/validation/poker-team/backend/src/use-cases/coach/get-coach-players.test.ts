import { describe, expect, it, vi } from "vitest";
import { getCoachPlayersUseCase } from "./get-coach-players";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import type { PlayerRepository } from "../../domain/player/player.repository";
import type { Coach, CoachAssignment } from "../../domain/coach/coach.entity";
import type { Player } from "../../domain/player/player.entity";

const coach: Coach = {
  id: "coach-1",
  principalId: "principal-1",
  name: "Coach",
  email: "coach@test.com",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const player1: Player = {
  id: "p-1",
  name: "Player 1",
  email: "p1@test.com",
  currentLimit: "NL20",
  status: "ACTIVE",
  bankroll: 100,
  makeup: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const player2: Player = { ...player1, id: "p-2", name: "Player 2" };

const assignment1: CoachAssignment = {
  id: "a-1",
  coachId: "coach-1",
  playerId: "p-1",
  assignedAt: new Date(),
  unassignedAt: null,
};

const createMockCoachRepo = (
  overrides?: Partial<CoachRepository>,
): CoachRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(coach),
  findByPrincipalId: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createMockPlayerRepo = (
  overrides?: Partial<PlayerRepository>,
): PlayerRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([player1, player2]),
  update: vi.fn(),
  ...overrides,
});

const createMockAssignmentRepo = (
  overrides?: Partial<CoachAssignmentRepository>,
): CoachAssignmentRepository => ({
  create: vi.fn(),
  findActiveByCoachId: vi.fn().mockResolvedValue([assignment1]),
  findActiveByPlayerId: vi.fn().mockResolvedValue(null),
  softDelete: vi.fn().mockResolvedValue(null),
  findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("getCoachPlayersUseCase", () => {
  // PM-CQRY-001: GetAllCoaches — covered inline (repo delegation)

  // PM-CQRY-002: R1 coach exists pass
  it("returns assigned players when coach exists", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await useCase({
      coachId: "coach-1",
      actorPrincipalId: "principal-1",
      actorPermissions: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p-1");
  });

  // PM-CQRY-003: R1 coach exists fail
  it("returns 404 when coach does not exist", async () => {
    const coachRepo = createMockCoachRepo({
      findById: vi.fn().mockResolvedValue(null),
    });
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    await expect(
      useCase({
        coachId: "unknown",
        actorPrincipalId: "p1",
        actorPermissions: [],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "COACH_NOT_FOUND" });
  });

  // PM-CQRY-004: R2 coach-scope self
  it("allows coach to see own assigned players", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await useCase({
      coachId: "coach-1",
      actorPrincipalId: "principal-1",
      actorPermissions: [],
    });
    expect(result).toHaveLength(1);
  });

  // PM-CQRY-004: R2 coach-scope — other coach blocked
  it("returns 403 when coach tries to view another coach's players", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    await expect(
      useCase({
        coachId: "coach-1",
        actorPrincipalId: "other-principal",
        actorPermissions: [],
      }),
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  // PM-CQRY-004: permission does not bypass coach-scope ownership
  it("returns 403 when getCoachPlayers permission is present but principal does not own coach", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );

    await expect(
      useCase({
        coachId: "coach-1",
        actorPrincipalId: "other-principal",
        actorPermissions: ["player-management.read.getCoachPlayers"],
      }),
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  // PM-CQRY-005: R2 admin-scope all
  it("allows admin to see any coach's players", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await useCase({
      coachId: "coach-1",
      actorPrincipalId: "admin-principal",
      actorPermissions: ["auth-access-control.admin.*"],
    });
    expect(result).toHaveLength(1);
  });

  // PM-CQRY-006: only active assignments
  it("returns empty array when no active assignments", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo({
      findActiveByCoachId: vi.fn().mockResolvedValue([]),
    });
    const playerRepo = createMockPlayerRepo();
    const useCase = getCoachPlayersUseCase(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await useCase({
      coachId: "coach-1",
      actorPrincipalId: "principal-1",
      actorPermissions: [],
    });
    expect(result).toHaveLength(0);
  });
});
