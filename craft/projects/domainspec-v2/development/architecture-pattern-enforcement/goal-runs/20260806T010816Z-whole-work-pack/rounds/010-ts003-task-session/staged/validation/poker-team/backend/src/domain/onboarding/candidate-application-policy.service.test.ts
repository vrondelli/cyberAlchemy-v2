import { describe, expect, it } from "vitest";
import {
  duplicateCandidateError,
  validateCandidateSubmission,
} from "./candidate-application-policy.service";

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

const now = new Date("2026-04-09T00:00:00.000Z");

describe("candidate-application-policy.service", () => {
  it("normalizes and validates a valid submission", () => {
    const result = validateCandidateSubmission(
      { ...baseInput, email: " Player@Test.COM " },
      now,
    );

    expect(result.canonicalEmail).toBe("player@test.com");
    expect(result.createInput.email).toBe("player@test.com");
  });

  it("rejects underage, malformed cityState, and missing LGPD", () => {
    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, birthDate: "2010-01-01" },
        now,
      ),
    ).toThrow("Candidate must be at least 18 years old");

    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, cityState: "Sao Paulo" },
        now,
      ),
    ).toThrow("cityState must follow City/State format");

    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, lgpdConsentAccepted: false },
        now,
      ),
    ).toThrow("LGPD consent is required");
  });

  it("returns deterministic duplicate error", () => {
    const error = duplicateCandidateError();
    expect(error.code).toBe("DUPLICATE_CANDIDATE");
    expect(error.message).toBe("Candidate already exists");
  });

  // --- RV-1: rules acceptance mandatory ---
  it("RV-1: rejects missing acceptedRegulationVersion", () => {
    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, acceptedRegulationVersion: "" },
        now,
      ),
    ).toThrow("acceptedRegulationVersion is required");
  });

  it("RV-1: rejects missing acceptedRegulationAt", () => {
    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, acceptedRegulationAt: "" },
        now,
      ),
    ).toThrow("acceptedRegulationAt is required");
  });

  // --- RV-3: required fields present ---
  it("RV-3: rejects missing fullName", () => {
    expect(() =>
      validateCandidateSubmission({ ...baseInput, fullName: "" }, now),
    ).toThrow("fullName is required");
  });

  // --- RV-4: required fields: email ---
  it("RV-4: rejects missing email", () => {
    expect(() =>
      validateCandidateSubmission({ ...baseInput, email: "" }, now),
    ).toThrow("email is required");
  });

  // --- RV-5: required fields: whatsapp ---
  it("RV-5: rejects missing whatsapp", () => {
    expect(() =>
      validateCandidateSubmission({ ...baseInput, whatsapp: "" }, now),
    ).toThrow("whatsapp is required");
  });

  // --- RV-6: required fields: birthDate ---
  it("RV-6: rejects missing birthDate", () => {
    expect(() =>
      validateCandidateSubmission({ ...baseInput, birthDate: "" }, now),
    ).toThrow("birthDate is required");
  });

  // --- RV-7: email format validation ---
  it("RV-7: rejects invalid email format", () => {
    expect(() =>
      validateCandidateSubmission({ ...baseInput, email: "not-an-email" }, now),
    ).toThrow("email is invalid");
  });

  // --- RV-10: preferredTimeWindows min 1 ---
  it("RV-10: rejects empty preferredTimeWindows", () => {
    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, preferredTimeWindows: [] },
        now,
      ),
    ).toThrow("preferredTimeWindows is required");
  });

  // --- RV-11: trackerDetail conditionally required ---
  it("RV-11: rejects trackerUsage=YES without trackerDetail", () => {
    expect(() =>
      validateCandidateSubmission(
        { ...baseInput, trackerUsage: "YES", trackerDetail: undefined },
        now,
      ),
    ).toThrow("trackerDetail is required");
  });

  // --- MT-1: all HTTP body fields map correctly to domain entity ---
  it("MT-1: maps all fields correctly to createInput", () => {
    const result = validateCandidateSubmission(baseInput, now);
    const ci = result.createInput;

    expect(ci.fullName).toBe("Player One");
    expect(ci.birthDate).toBe("2000-01-01");
    expect(ci.cityState).toBe("Sao Paulo/SP");
    expect(ci.whatsapp).toBe("5511999999999");
    expect(ci.email).toBe("player@test.com");
    expect(ci.educationLevel).toBe("MEDIO");
    expect(ci.currentWorkStatus).toBe("PART_TIME");
    expect(ci.dailyPokerAvailability).toBe("FROM_2_TO_4H");
    expect(ci.preferredTimeWindows).toEqual(["NIGHT"]);
    expect(ci.weeklyDaysAvailability).toBe("DAYS_4_5");
    expect(ci.pokerExperienceRange).toBe("FROM_1Y_TO_3Y");
    expect(ci.primaryModality).toBe("MTT");
    expect(ci.hasOwnComputer).toBe(true);
    expect(ci.hasDiscordFamiliarity).toBe(true);
    expect(ci.trackerUsage).toBe("YES");
    expect(ci.trackerDetail).toBe("HM3");
    expect(ci.nickPokerStars).toBe("nick1");
    expect(ci.nickGGPoker).toBe("nick2");
    expect(ci.nickSuprema).toBe("nick3");
    expect(ci.lgpdConsentAccepted).toBe(true);
    expect(ci.acceptedRegulationVersion).toBe("2026-04");
    expect(ci.acceptedRegulationAt).toBeInstanceOf(Date);
  });

  // --- MT-2: optional fields default to null ---
  it("MT-2: optional nick fields default to null when undefined", () => {
    const result = validateCandidateSubmission(
      {
        ...baseInput,
        nickPokerStars: undefined,
        nickGGPoker: undefined,
        nickSuprema: undefined,
      },
      now,
    );

    expect(result.createInput.nickPokerStars).toBeNull();
    expect(result.createInput.nickGGPoker).toBeNull();
    expect(result.createInput.nickSuprema).toBeNull();
  });

  // --- MT-3 / CT-1: email canonicalization in mapping ---
  it("MT-3: email is canonicalized in mapping output", () => {
    const result = validateCandidateSubmission(
      { ...baseInput, email: " UPPER@Test.COM " },
      now,
    );
    expect(result.canonicalEmail).toBe("upper@test.com");
    expect(result.createInput.email).toBe("upper@test.com");
  });

  // --- IV-2: every submitted app has ruleAcceptance ---
  it("IV-2: validated submission includes acceptedRegulationVersion and acceptedRegulationAt", () => {
    const result = validateCandidateSubmission(baseInput, now);

    expect(result.createInput.acceptedRegulationVersion).toBe("2026-04");
    expect(result.createInput.acceptedRegulationAt).toBeInstanceOf(Date);
  });
});
