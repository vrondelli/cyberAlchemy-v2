import { describe, expect, it, vi } from "vitest";
import { createCoachUseCase } from "./create-coach";
import type { CoachRepository } from "../../domain/coach/coach.repository";
import type { Coach } from "../../domain/coach/coach.entity";

const mockCoach: Coach = {
  id: "c-1",
  principalId: "principal-1",
  name: "Coach One",
  email: "coach@test.com",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockRepo = (
  overrides?: Partial<CoachRepository>,
): CoachRepository => ({
  create: vi.fn().mockResolvedValue(mockCoach),
  findById: vi.fn().mockResolvedValue(null),
  findByPrincipalId: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe("createCoachUseCase", () => {
  // PM-COACH-001: R1 principalId pass
  it("accepts valid principalId", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    const result = await useCase({
      principalId: "principal-1",
      name: "Coach",
      email: "c@test.com",
    });
    expect(result.id).toBe("c-1");
    expect(repo.create).toHaveBeenCalledWith({
      principalId: "principal-1",
      name: "Coach",
      email: "c@test.com",
    });
  });

  it("emits CoachCreated when coach is persisted", async () => {
    const repo = createMockRepo();
    const onEvent = vi.fn();
    const useCase = createCoachUseCase(repo, onEvent);

    await useCase({
      principalId: "principal-1",
      name: "Coach",
      email: "c@test.com",
    });

    expect(onEvent).toHaveBeenCalledWith({
      type: "CoachCreated",
      coachId: "c-1",
      principalId: "principal-1",
      status: "ACTIVE",
      occurredAt: mockCoach.createdAt,
    });
  });

  // PM-COACH-002: R1 principalId fail
  it("rejects empty principalId with 400", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "", name: "Coach", email: "c@test.com" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects whitespace-only principalId with 400", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "   ", name: "Coach", email: "c@test.com" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  // PM-COACH-003: R2 name pass
  it("accepts valid name", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    const result = await useCase({
      principalId: "p1",
      name: "Coach Name",
      email: "c@test.com",
    });
    expect(result.name).toBe("Coach One");
  });

  // PM-COACH-004: R2 name fail
  it("rejects empty name with 400", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "p1", name: "", email: "c@test.com" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  // PM-COACH-005: R3 email pass
  it("accepts valid email", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    const result = await useCase({
      principalId: "p1",
      name: "Coach",
      email: "valid@test.com",
    });
    expect(result).toBeDefined();
  });

  // PM-COACH-006: R3 email fail
  it("rejects empty email with 400", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "p1", name: "Coach", email: "" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  // PM-COACH-007: R4 unique principal pass
  it("allows creation when principalId is unique", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    const result = await useCase({
      principalId: "unique-1",
      name: "Coach",
      email: "c@test.com",
    });
    expect(result.status).toBe("ACTIVE");
  });

  // PM-COACH-008: R4 unique principal fail
  it("returns 409 DUPLICATE_PRINCIPAL when principalId exists", async () => {
    const repo = createMockRepo({
      create: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("unique violation"), { code: "23505" }),
        ),
    });
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({
        principalId: "existing-1",
        name: "Coach",
        email: "c@test.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_PRINCIPAL" });
  });

  // PM-COACH-009: Postcondition — persists coach with ACTIVE status
  it("persists coach record via repository create", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await useCase({ principalId: "p1", name: "Coach", email: "c@test.com" });
    expect(repo.create).toHaveBeenCalledOnce();
  });

  // PM-COACH-010: Error state — 400 validation
  it("returns 400 for missing required fields", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "", name: "", email: "" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  // PM-COACH-011: Error state — 409 duplicate (constraint name variant)
  it("returns 409 when constraint name matches", async () => {
    const repo = createMockRepo({
      create: vi.fn().mockRejectedValue(
        Object.assign(new Error("constraint"), {
          constraint: "coaches_unique_active_principal",
        }),
      ),
    });
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "dup", name: "Coach", email: "c@test.com" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_PRINCIPAL" });
  });

  // PM-COACH-012: Error state — 500 persistence
  it("propagates unexpected repository errors", async () => {
    const repo = createMockRepo({
      create: vi.fn().mockRejectedValue(new Error("DB connection failed")),
    });
    const useCase = createCoachUseCase(repo);
    await expect(
      useCase({ principalId: "p1", name: "Coach", email: "c@test.com" }),
    ).rejects.toThrow("DB connection failed");
  });

  // PM-CMAP-001/002/003: Mapping tests — body fields map directly
  it("trims and maps principalId, name, and email directly", async () => {
    const repo = createMockRepo();
    const useCase = createCoachUseCase(repo);
    await useCase({
      principalId: "  p1  ",
      name: "  Coach Name  ",
      email: "  c@test.com  ",
    });
    expect(repo.create).toHaveBeenCalledWith({
      principalId: "p1",
      name: "Coach Name",
      email: "c@test.com",
    });
  });
});
