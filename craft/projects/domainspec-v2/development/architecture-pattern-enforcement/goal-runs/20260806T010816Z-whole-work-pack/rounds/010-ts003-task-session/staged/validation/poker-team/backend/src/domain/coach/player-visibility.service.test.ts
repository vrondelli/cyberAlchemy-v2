import { describe, expect, it, vi } from "vitest";
import { resolvePlayerVisibility } from "./player-visibility.service";
import type { CoachRepository } from "./coach.repository";
import type { CoachAssignmentRepository } from "./coach-assignment.repository";
import type { PlayerRepository } from "../player/player.repository";
import type { Coach } from "./coach.entity";
import type { Player } from "../player/player.entity";

const activeCoach: Coach = {
  id: "coach-1",
  principalId: "coach-principal",
  name: "Coach",
  email: "c@test.com",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const player1: Player = {
  id: "p-1",
  principalId: "principal-p-1",
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

const coachAsPlayer: Player = {
  ...player1,
  id: "player-coach",
  principalId: "coach-principal",
  name: "Coach Player",
};

const createMockCoachRepo = (
  overrides?: Partial<CoachRepository>,
): CoachRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findByPrincipalId: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createMockAssignmentRepo = (
  overrides?: Partial<CoachAssignmentRepository>,
): CoachAssignmentRepository => ({
  create: vi.fn(),
  findActiveByCoachId: vi.fn().mockResolvedValue([]),
  findActiveByPlayerId: vi.fn().mockResolvedValue(null),
  softDelete: vi.fn().mockResolvedValue(null),
  findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
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

describe("resolvePlayerVisibility", () => {
  // PM-VIS-001: admin=all
  it("returns all player IDs for admin actor", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "admin-1",
      actorPermissions: ["player-management.*.*"],
    });

    expect(result).toEqual(["p-1", "p-2"]);
  });

  it("returns all player IDs for manager with manageMakeup permission", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "manager-1",
      actorPermissions: ["player-makeup.write.manageMakeup"],
    });

    expect(result).toEqual(["p-1", "p-2"]);
  });

  // PM-VIS-002: coach=assigned+self
  it("returns assigned player IDs plus self for coach who is also a player", async () => {
    const coachRepo = createMockCoachRepo({
      findByPrincipalId: vi.fn().mockResolvedValue(activeCoach),
    });
    const assignmentRepo = createMockAssignmentRepo({
      findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue(["p-1"]),
    });
    const playerRepo = createMockPlayerRepo({
      findAll: vi.fn().mockResolvedValue([player1, player2, coachAsPlayer]),
    });

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "coach-principal",
      actorPermissions: [],
    });

    expect(result).toContain("p-1");
    expect(result).toContain("player-coach");
    expect(result).not.toContain("p-2");
  });

  // PM-VIS-003: player=self
  it("returns only own player ID for a regular player", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo({
      findAll: vi.fn().mockResolvedValue([player1, player2]),
    });

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "principal-p-1",
      actorPermissions: [],
    });

    expect(result).toEqual(["p-1"]);
  });

  // PM-VIS-004: coach no self-player
  it("returns only assigned player IDs when coach is not also a player", async () => {
    const coachRepo = createMockCoachRepo({
      findByPrincipalId: vi.fn().mockResolvedValue(activeCoach),
    });
    const assignmentRepo = createMockAssignmentRepo({
      findActivePlayerIdsByCoachPrincipalId: vi
        .fn()
        .mockResolvedValue(["p-1", "p-2"]),
    });
    const playerRepo = createMockPlayerRepo();

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "coach-principal",
      actorPermissions: [],
    });

    expect(result).toContain("p-1");
    expect(result).toContain("p-2");
    // coach-principal is NOT in the player list, so not included
    expect(result).not.toContain("coach-principal");
  });

  // PM-VIS-005: coach with empty assignments
  it("returns empty set when coach has no active assignments and is not a player", async () => {
    const coachRepo = createMockCoachRepo({
      findByPrincipalId: vi.fn().mockResolvedValue(activeCoach),
    });
    const assignmentRepo = createMockAssignmentRepo({
      findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
    });
    const playerRepo = createMockPlayerRepo();

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "coach-principal",
      actorPermissions: [],
    });

    expect(result).toEqual([]);
  });

  it("returns self only when coach has no assignments but is also a player", async () => {
    const coachRepo = createMockCoachRepo({
      findByPrincipalId: vi.fn().mockResolvedValue(activeCoach),
    });
    const assignmentRepo = createMockAssignmentRepo({
      findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
    });
    const playerRepo = createMockPlayerRepo({
      findAll: vi.fn().mockResolvedValue([player1, player2, coachAsPlayer]),
    });

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "coach-principal",
      actorPermissions: [],
    });

    expect(result).toEqual(["player-coach"]);
  });

  // PM-VIS-003: actor with no player record
  it("returns empty set when actor has no player record and no coach record", async () => {
    const coachRepo = createMockCoachRepo();
    const assignmentRepo = createMockAssignmentRepo();
    const playerRepo = createMockPlayerRepo();

    const resolve = resolvePlayerVisibility(
      coachRepo,
      assignmentRepo,
      playerRepo,
    );
    const result = await resolve({
      actorPrincipalId: "unknown-principal",
      actorPermissions: [],
    });

    expect(result).toEqual([]);
  });
});
