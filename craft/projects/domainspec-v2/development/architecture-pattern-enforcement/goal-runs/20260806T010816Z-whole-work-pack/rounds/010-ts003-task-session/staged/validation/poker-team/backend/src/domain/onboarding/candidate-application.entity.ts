export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type ReviewDecision = "APPROVE" | "REJECT";

export type CandidateApplication = {
  id: string;
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
  trackerDetail: string | null;
  nickPokerStars: string | null;
  nickGGPoker: string | null;
  nickSuprema: string | null;
  lgpdConsentAccepted: boolean;
  acceptedRegulationVersion: string;
  acceptedRegulationAt: Date;
  status: ApplicationStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewDecisionNote: string | null;
  retentionUntil: Date | null;
};

export type CreateCandidateApplicationInput = Omit<
  CandidateApplication,
  | "id"
  | "status"
  | "submittedAt"
  | "reviewedAt"
  | "reviewedBy"
  | "reviewDecisionNote"
  | "retentionUntil"
>;

export type CandidateSummary = Pick<
  CandidateApplication,
  | "id"
  | "fullName"
  | "whatsapp"
  | "email"
  | "status"
  | "submittedAt"
  | "reviewedAt"
>;
