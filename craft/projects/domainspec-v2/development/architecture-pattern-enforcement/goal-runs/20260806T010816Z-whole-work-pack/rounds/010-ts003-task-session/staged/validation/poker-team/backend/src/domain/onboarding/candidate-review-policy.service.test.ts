import { describe, expect, it } from "vitest";
import {
  decideReviewTransition,
  ensureReviewableApplication,
} from "./candidate-review-policy.service";
import type { ApplicationStatus } from "./candidate-application.entity";

const makeApplication = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  fullName: "Candidate",
  birthDate: "2000-01-01",
  cityState: "Sao Paulo/SP",
  whatsapp: "5511999999999",
  email: "candidate@test.com",
  educationLevel: "MEDIO",
  currentWorkStatus: "PART_TIME",
  dailyPokerAvailability: "FROM_2_TO_4H",
  preferredTimeWindows: ["NIGHT"],
  weeklyDaysAvailability: "DAYS_4_5",
  pokerExperienceRange: "FROM_1Y_TO_3Y",
  primaryModality: "MTT",
  hasOwnComputer: true,
  hasDiscordFamiliarity: true,
  trackerUsage: "NO",
  trackerDetail: null,
  nickPokerStars: null,
  nickGGPoker: null,
  nickSuprema: null,
  lgpdConsentAccepted: true,
  acceptedRegulationVersion: "v1",
  acceptedRegulationAt: new Date(),
  status: "SUBMITTED" as ApplicationStatus,
  submittedAt: new Date(),
  reviewedAt: null as Date | null,
  reviewedBy: null as string | null,
  reviewDecisionNote: null as string | null,
  retentionUntil: null as Date | null,
  ...overrides,
});

describe("candidate-review-policy.service", () => {
  it("validates reviewable status and computes transitions", () => {
    const application = ensureReviewableApplication(
      makeApplication({ status: "SUBMITTED" }),
    );

    expect(application.status).toBe("SUBMITTED");
    expect(decideReviewTransition("APPROVE", new Date()).status).toBe(
      "APPROVED",
    );

    const rejected = decideReviewTransition(
      "REJECT",
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.retentionUntil).toBeDefined();
  });

  it("rejects missing or non-reviewable applications", () => {
    expect(() => ensureReviewableApplication(null)).toThrow(
      "Candidate application not found",
    );

    expect(() =>
      ensureReviewableApplication(makeApplication({ status: "APPROVED" })),
    ).toThrow("Candidate application cannot be reviewed in current status");
  });

  // --- NT-2 / RV-18: REJECTED state rejects ReviewCandidateApplication ---
  it("NT-2: rejects review of application in REJECTED status", () => {
    expect(() =>
      ensureReviewableApplication(makeApplication({ status: "REJECTED" })),
    ).toThrow("Candidate application cannot be reviewed in current status");
  });

  // --- IV-1: terminal states cannot transition to active ---
  it("IV-1: neither APPROVED nor REJECTED can transition to active states", () => {
    for (const status of ["APPROVED", "REJECTED"]) {
      expect(() =>
        ensureReviewableApplication(makeApplication({ status })),
      ).toThrow("cannot be reviewed in current status");
    }
  });

  // --- ST-5: UNDER_REVIEW → APPROVED ---
  it("ST-5: review from UNDER_REVIEW transitions to APPROVED", () => {
    const application = ensureReviewableApplication(
      makeApplication({ status: "UNDER_REVIEW" }),
    );
    expect(application.status).toBe("UNDER_REVIEW");

    const result = decideReviewTransition("APPROVE", new Date());
    expect(result.status).toBe("APPROVED");
  });

  // --- ST-6: UNDER_REVIEW → REJECTED ---
  it("ST-6: review from UNDER_REVIEW transitions to REJECTED", () => {
    const application = ensureReviewableApplication(
      makeApplication({ status: "UNDER_REVIEW" }),
    );
    expect(application.status).toBe("UNDER_REVIEW");

    const rejected = decideReviewTransition(
      "REJECT",
      new Date("2026-06-01T00:00:00.000Z"),
    );
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.retentionUntil).toBeDefined();
  });

  // --- RV-19: invalid decision value ---
  it("RV-19: throws for invalid review decision", () => {
    expect(() => decideReviewTransition("INVALID" as any, new Date())).toThrow(
      "Invalid review decision",
    );
  });

  // --- CT-6: APPROVE → retentionUntil is undefined ---
  it("CT-6: approve decision does not set retentionUntil", () => {
    const result = decideReviewTransition("APPROVE", new Date());
    expect(result.status).toBe("APPROVED");
    expect(result.retentionUntil).toBeUndefined();
  });

  // --- CT-5: REJECT → retentionUntil = reviewedAt + 365 days ---
  it("CT-5: reject decision sets retentionUntil to reviewedAt + 365 days", () => {
    const reviewedAt = new Date("2026-01-01T00:00:00.000Z");
    const result = decideReviewTransition("REJECT", reviewedAt);
    const expected = new Date(reviewedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    expect(result.retentionUntil!.getTime()).toBe(expected.getTime());
  });
});
