import { describe, expect, it, vi } from "vitest";
import { submitCandidateApplicationUseCase } from "./submit-candidate-application";
import { CandidateApplicationRepository } from "../../domain/onboarding/candidate-application.repository";

const baseInput = {
  fullName: "Player One",
  birthDate: "2000-01-01",
  cityState: "Sao Paulo/SP",
  whatsapp: "5511999999999",
  email: "player@test.com",
  educationLevel: "MEDIO",
  currentWorkStatus: "PART_TIME",
  dailyPokerAvailability: "FROM_2_TO_4H",
  preferredTimeWindows: ["NIGHT"],
  weeklyDaysAvailability: "DAYS_4_5",
  pokerExperienceRange: "FROM_1Y_TO_3Y",
  primaryModality: "MTT",
  hasOwnComputer: true,
  hasDiscordFamiliarity: true,
  trackerUsage: "YES",
  trackerDetail: "HM3",
  nickPokerStars: "nick1",
  nickGGPoker: "nick2",
  nickSuprema: "nick3",
  lgpdConsentAccepted: true,
  acceptedRegulationVersion: "2026-04",
  acceptedRegulationAt: "2026-04-08T10:00:00.000Z",
};

describe("submitCandidateApplicationUseCase", () => {
  const createRepo = (): CandidateApplicationRepository => ({
    create: vi.fn(async (input) => ({
      id: "c1",
      ...input,
      status: "SUBMITTED",
      submittedAt: new Date("2026-04-08T10:00:00.000Z"),
      reviewedAt: null,
      reviewedBy: null,
      reviewDecisionNote: null,
      retentionUntil: null,
    })),
    findDuplicateByContact: vi.fn(async () => false),
    findById: vi.fn(async () => null),
    list: vi.fn(async () => ({ items: [], page: 1, limit: 20, total: 0 })),
    review: vi.fn(async () => null),
  });

  it("creates application with normalized email", async () => {
    const repo = createRepo();
    const useCase = submitCandidateApplicationUseCase(repo);

    const result = await useCase({
      ...baseInput,
      email: " Player@Test.COM ",
    });

    expect(result.email).toBe("player@test.com");
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it("rejects duplicate contact", async () => {
    const repo = createRepo();
    vi.mocked(repo.findDuplicateByContact).mockResolvedValueOnce(true);

    const useCase = submitCandidateApplicationUseCase(repo);

    await expect(useCase(baseInput)).rejects.toMatchObject({
      code: "DUPLICATE_CANDIDATE",
    });
  });

  it("rejects under 18 candidate", async () => {
    const repo = createRepo();
    const useCase = submitCandidateApplicationUseCase(repo);

    await expect(
      useCase({
        ...baseInput,
        birthDate: "2010-01-01",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: { field: "birthDate" },
    });
  });

  it("rejects invalid cityState", async () => {
    const repo = createRepo();
    const useCase = submitCandidateApplicationUseCase(repo);

    await expect(
      useCase({
        ...baseInput,
        cityState: "Sao Paulo",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: { field: "cityState" },
    });
  });

  it("maps DB unique violation from concurrent duplicate submissions", async () => {
    const repo = createRepo();
    vi.mocked(repo.findDuplicateByContact).mockResolvedValueOnce(false);
    vi.mocked(repo.create).mockRejectedValueOnce({
      code: "23505",
      constraint: "candidate_applications_email_unique",
    });

    const useCase = submitCandidateApplicationUseCase(repo);

    await expect(useCase(baseInput)).rejects.toMatchObject({
      code: "DUPLICATE_CANDIDATE",
    });
  });

  it("rethrows non-duplicate repository failures", async () => {
    const repo = createRepo();
    vi.mocked(repo.create).mockRejectedValueOnce(new Error("db down"));

    const useCase = submitCandidateApplicationUseCase(repo);

    await expect(useCase(baseInput)).rejects.toThrow("db down");
  });
});
