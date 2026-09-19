import { describe, expect, it, vi } from "vitest";
import { getAllCoachesUseCase } from "./get-all-coaches";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { Coach } from "../../domain/coach/coach.entity";

const activeCoach: Coach = {
  id: "c-1",
  principalId: "p-1",
  name: "Active Coach",
  email: "active@test.com",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveCoach: Coach = {
  id: "c-2",
  principalId: "p-2",
  name: "Inactive Coach",
  email: "inactive@test.com",
  status: "INACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getAllCoachesUseCase", () => {
  // PM-CQRY-001: GetAllCoaches returns all coaches regardless of status
  it("returns all coaches including both active and inactive", async () => {
    const coachRepo: CoachRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPrincipalId: vi.fn(),
      findAll: vi.fn().mockResolvedValue([activeCoach, inactiveCoach]),
    };
    const getAll = getAllCoachesUseCase(coachRepo);
    const result = await getAll();
    expect(result).toHaveLength(2);
    expect(result).toEqual([activeCoach, inactiveCoach]);
    expect(coachRepo.findAll).toHaveBeenCalledOnce();
  });

  it("returns empty array when no coaches exist", async () => {
    const coachRepo: CoachRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPrincipalId: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
    };
    const getAll = getAllCoachesUseCase(coachRepo);
    const result = await getAll();
    expect(result).toHaveLength(0);
  });
});
