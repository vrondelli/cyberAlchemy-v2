import { CreateCandidateApplicationInput } from "./candidate-application.entity";

export type CandidateSubmissionPolicyInput = {
  fullName: string;
  birthDate: string;
  cityState: string;
  whatsapp: string;
  email: string;
  educationLevel: string;
  currentWorkStatus: string;
  dailyPokerAvailability: string;
  preferredTimeWindows: string[];
  weeklyDaysAvailability: string;
  pokerExperienceRange: string;
  primaryModality: string;
  hasOwnComputer: boolean;
  hasDiscordFamiliarity: boolean;
  trackerUsage: string;
  trackerDetail?: string;
  nickPokerStars?: string;
  nickGGPoker?: string;
  nickSuprema?: string;
  lgpdConsentAccepted: boolean;
  acceptedRegulationVersion: string;
  acceptedRegulationAt: string;
};
import { DomainError } from "../errors";

export type OnboardingPolicyError = DomainError;

const withError = (
  message: string,
  _statusCode: number,
  code: string,
  details?: unknown,
): OnboardingPolicyError => {
  return new DomainError(code, message, details);
};

export const toCanonicalEmail = (email: string): string =>
  email.trim().toLowerCase();

const isValidEmail = (email: string): boolean =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
const isValidCityState = (value: string): boolean =>
  /^[^/]+\/[^/]+$/.test(value.trim());

const getAgeInYears = (birthDate: Date, now: Date): number => {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
};

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw withError(`${field} is required`, 400, "VALIDATION_ERROR", { field });
  }
  return value.trim();
};

const requireBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== "boolean") {
    throw withError(`${field} is required`, 400, "VALIDATION_ERROR", { field });
  }
  return value;
};

const requireStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw withError(`${field} is required`, 400, "VALIDATION_ERROR", { field });
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  if (normalized.length === 0) {
    throw withError(`${field} is required`, 400, "VALIDATION_ERROR", { field });
  }

  return normalized;
};

export type ValidatedCandidateSubmission = {
  canonicalEmail: string;
  whatsapp: string;
  createInput: CreateCandidateApplicationInput;
};

export const validateCandidateSubmission = (
  input: CandidateSubmissionPolicyInput,
  now: Date = new Date(),
): ValidatedCandidateSubmission => {
  const fullName = requireString(input.fullName, "fullName");
  const birthDateValue = requireString(input.birthDate, "birthDate");
  const birthDate = new Date(birthDateValue);

  if (Number.isNaN(birthDate.getTime())) {
    throw withError("birthDate is invalid", 400, "VALIDATION_ERROR", {
      field: "birthDate",
    });
  }

  if (getAgeInYears(birthDate, now) < 18) {
    throw withError(
      "Candidate must be at least 18 years old",
      400,
      "VALIDATION_ERROR",
      {
        field: "birthDate",
      },
    );
  }

  const cityState = requireString(input.cityState, "cityState");
  if (!isValidCityState(cityState)) {
    throw withError(
      "cityState must follow City/State format",
      400,
      "VALIDATION_ERROR",
      {
        field: "cityState",
      },
    );
  }

  const whatsapp = requireString(input.whatsapp, "whatsapp");
  const rawEmail = requireString(input.email, "email");
  const email = toCanonicalEmail(rawEmail);

  if (!isValidEmail(email)) {
    throw withError("email is invalid", 400, "VALIDATION_ERROR", {
      field: "email",
    });
  }

  const trackerUsage = requireString(input.trackerUsage, "trackerUsage");
  const trackerDetailValue =
    typeof input.trackerDetail === "string" ? input.trackerDetail.trim() : "";

  if (
    (trackerUsage === "YES" || trackerUsage === "OTHER") &&
    trackerDetailValue === ""
  ) {
    throw withError("trackerDetail is required", 400, "VALIDATION_ERROR", {
      field: "trackerDetail",
    });
  }

  const acceptedRegulationVersion = requireString(
    input.acceptedRegulationVersion,
    "acceptedRegulationVersion",
  );
  const acceptedRegulationAtValue = requireString(
    input.acceptedRegulationAt,
    "acceptedRegulationAt",
  );
  const acceptedRegulationAt = new Date(acceptedRegulationAtValue);

  if (Number.isNaN(acceptedRegulationAt.getTime())) {
    throw withError(
      "acceptedRegulationAt is invalid",
      400,
      "VALIDATION_ERROR",
      {
        field: "acceptedRegulationAt",
      },
    );
  }

  const lgpdConsentAccepted = requireBoolean(
    input.lgpdConsentAccepted,
    "lgpdConsentAccepted",
  );

  if (!lgpdConsentAccepted) {
    throw withError("LGPD consent is required", 400, "LGPD_CONSENT_REQUIRED");
  }

  return {
    canonicalEmail: email,
    whatsapp,
    createInput: {
      fullName,
      birthDate: birthDate.toISOString().slice(0, 10),
      cityState,
      whatsapp,
      email,
      educationLevel: requireString(input.educationLevel, "educationLevel"),
      currentWorkStatus: requireString(
        input.currentWorkStatus,
        "currentWorkStatus",
      ),
      dailyPokerAvailability: requireString(
        input.dailyPokerAvailability,
        "dailyPokerAvailability",
      ),
      preferredTimeWindows: requireStringArray(
        input.preferredTimeWindows,
        "preferredTimeWindows",
      ),
      weeklyDaysAvailability: requireString(
        input.weeklyDaysAvailability,
        "weeklyDaysAvailability",
      ),
      pokerExperienceRange: requireString(
        input.pokerExperienceRange,
        "pokerExperienceRange",
      ),
      primaryModality: requireString(input.primaryModality, "primaryModality"),
      hasOwnComputer: requireBoolean(input.hasOwnComputer, "hasOwnComputer"),
      hasDiscordFamiliarity: requireBoolean(
        input.hasDiscordFamiliarity,
        "hasDiscordFamiliarity",
      ),
      trackerUsage,
      trackerDetail: trackerDetailValue || null,
      nickPokerStars:
        typeof input.nickPokerStars === "string"
          ? input.nickPokerStars.trim() || null
          : null,
      nickGGPoker:
        typeof input.nickGGPoker === "string"
          ? input.nickGGPoker.trim() || null
          : null,
      nickSuprema:
        typeof input.nickSuprema === "string"
          ? input.nickSuprema.trim() || null
          : null,
      lgpdConsentAccepted,
      acceptedRegulationVersion,
      acceptedRegulationAt,
    },
  };
};

export const duplicateCandidateError = (): OnboardingPolicyError => {
  return withError("Candidate already exists", 409, "DUPLICATE_CANDIDATE");
};
