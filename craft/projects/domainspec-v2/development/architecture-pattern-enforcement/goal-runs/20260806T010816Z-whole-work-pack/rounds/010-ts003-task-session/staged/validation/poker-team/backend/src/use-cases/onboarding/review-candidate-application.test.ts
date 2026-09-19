import { describe, expect, it, vi } from "vitest";
import { reviewCandidateApplicationUseCase } from "./review-candidate-application";
import type { CandidateApplicationRepository } from "../../domain/onboarding/candidate-application.repository";
import type { CandidateApplication } from "../../domain/onboarding/candidate-application.entity";

const buildCandidate = (
  overrides: Partial<CandidateApplication> = {},
): CandidateApplication => ({
  id: "candidate-1",
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
  acceptedRegulationAt: new Date("2026-04-08T10:00:00.000Z"),
  status: "SUBMITTED",
  submittedAt: new Date("2026-04-08T10:00:00.000Z"),
  reviewedAt: null,
  reviewedBy: null,
  reviewDecisionNote: null,
  retentionUntil: null,
  ...overrides,
});

describe("reviewCandidateApplicationUseCase", () => {
  const createRepo = (): CandidateApplicationRepository => ({
    create: vi.fn(async () => buildCandidate()),
    findDuplicateByContact: vi.fn(async () => false),
    findById: vi.fn(async () => buildCandidate()),
    list: vi.fn(async () => ({ items: [], page: 1, limit: 20, total: 0 })),
    review: vi.fn(async () =>
      buildCandidate({
        status: "APPROVED",
        reviewedAt: new Date("2026-04-08T10:30:00.000Z"),
        reviewedBy: "reviewer-1",
      }),
    ),
  });

  it("publishes approved handoff payload after approval", async () => {
    const repo = createRepo();
    const intakeGateway = {
      publishApprovedCandidate: vi.fn(async () => undefined),
    };

    const useCase = reviewCandidateApplicationUseCase(repo, {
      intakeGateway,
    });

    const updated = await useCase({
      id: "candidate-1",
      reviewedBy: "reviewer-1",
      decision: "APPROVE",
    });

    expect(updated.status).toBe("APPROVED");
    expect(intakeGateway.publishApprovedCandidate).toHaveBeenCalledWith({
      applicationId: "candidate-1",
      candidateFullName: "Player One",
      candidateEmail: "player@test.com",
      candidateWhatsapp: "5511999999999",
      approvedBy: "reviewer-1",
      approvedAt: new Date("2026-04-08T10:30:00.000Z"),
      acceptedRegulationVersion: "2026-04",
      acceptedRegulationAt: new Date("2026-04-08T10:00:00.000Z"),
    });
  });

  it("does not publish handoff when review result is rejected", async () => {
    const repo = createRepo();
    vi.mocked(repo.review).mockResolvedValueOnce(
      buildCandidate({
        status: "REJECTED",
        reviewedAt: new Date("2026-04-08T10:30:00.000Z"),
        reviewedBy: "reviewer-1",
      }),
    );

    const intakeGateway = {
      publishApprovedCandidate: vi.fn(async () => undefined),
    };

    const useCase = reviewCandidateApplicationUseCase(repo, {
      intakeGateway,
    });

    const updated = await useCase({
      id: "candidate-1",
      reviewedBy: "reviewer-1",
      decision: "REJECT",
    });

    expect(updated.status).toBe("REJECTED");
    expect(intakeGateway.publishApprovedCandidate).not.toHaveBeenCalled();
  });
});
