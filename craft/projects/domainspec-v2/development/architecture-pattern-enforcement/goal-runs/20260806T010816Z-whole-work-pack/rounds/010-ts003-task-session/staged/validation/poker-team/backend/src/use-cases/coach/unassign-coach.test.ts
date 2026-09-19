import { describe, expect, it, vi } from "vitest";
import { unassignCoachUseCase } from "./unassign-coach";
import type { CoachAssignmentRepository } from "../../domain/coach/coach-assignment.repository";
import type { CoachAssignment } from "../../domain/coach/coach.entity";

const now = new Date();

const unassignedResult: CoachAssignment = {
  id: "a-1",
  coachId: "coach-1",
  playerId: "player-1",
  assignedAt: new Date("2026-01-01"),
  unassignedAt: now,
};

const createMockRepo = (
  overrides?: Partial<CoachAssignmentRepository>,
): CoachAssignmentRepository => ({
  create: vi.fn(),
  findActiveByCoachId: vi.fn().mockResolvedValue([]),
  findActiveByPlayerId: vi.fn().mockResolvedValue(null),
  softDelete: vi.fn().mockResolvedValue(unassignedResult),
  findActivePlayerIdsByCoachPrincipalId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("unassignCoachUseCase", () => {
  // PM-UASGN-001: R1 active assignment exists pass
  it("allows unassign when active assignment exists", async () => {
    const repo = createMockRepo();
    const useCase = unassignCoachUseCase(repo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(result.unassignedAt).toBeDefined();
  });

  it("emits CoachUnassigned when assignment is soft-deleted", async () => {
    const repo = createMockRepo();
    const onEvent = vi.fn();
    const useCase = unassignCoachUseCase(repo, onEvent);

    await useCase({ coachId: "coach-1", playerId: "player-1" });

    expect(onEvent).toHaveBeenCalledWith({
      type: "CoachUnassigned",
      assignmentId: "a-1",
      coachId: "coach-1",
      playerId: "player-1",
      unassignedAt: now,
    });
  });

  // PM-UASGN-002: R1 active assignment exists fail
  it("returns 404 ASSIGNMENT_NOT_FOUND when no active assignment", async () => {
    const repo = createMockRepo({
      softDelete: vi.fn().mockResolvedValue(null),
    });
    const useCase = unassignCoachUseCase(repo);
    await expect(
      useCase({ coachId: "coach-1", playerId: "unknown" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "ASSIGNMENT_NOT_FOUND" });
  });

  // PM-UASGN-003: Postcondition — sets unassignedAt timestamp
  it("returns the unassignedAt timestamp", async () => {
    const repo = createMockRepo();
    const useCase = unassignCoachUseCase(repo);
    const result = await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(result.unassignedAt).toEqual(now);
  });

  // PM-UASGN-004: allows reassignment after unassign
  it("calls softDelete with correct coachId and playerId", async () => {
    const repo = createMockRepo();
    const useCase = unassignCoachUseCase(repo);
    await useCase({ coachId: "coach-1", playerId: "player-1" });
    expect(repo.softDelete).toHaveBeenCalledWith("coach-1", "player-1");
  });

  // PM-UASGN-005: Error state — 500 persistence
  it("propagates unexpected repository errors", async () => {
    const repo = createMockRepo({
      softDelete: vi.fn().mockRejectedValue(new Error("DB failure")),
    });
    const useCase = unassignCoachUseCase(repo);
    await expect(
      useCase({ coachId: "coach-1", playerId: "player-1" }),
    ).rejects.toThrow("DB failure");
  });

  // PM-CMAP-005: Mapping — params map directly
  it("passes coachId and playerId directly to softDelete", async () => {
    const repo = createMockRepo();
    const useCase = unassignCoachUseCase(repo);
    await useCase({ coachId: "c-2", playerId: "p-2" });
    expect(repo.softDelete).toHaveBeenCalledWith("c-2", "p-2");
  });
});
