import {
  ApplicationStatus,
  CandidateApplication,
  CandidateSummary,
  CreateCandidateApplicationInput,
} from "./candidate-application.entity";

export type CandidateListFilters = {
  status?: ApplicationStatus;
  page: number;
  limit: number;
};

export type CandidateListResult = {
  items: CandidateSummary[];
  page: number;
  limit: number;
  total: number;
};

export type CandidateApplicationRepository = {
  create(input: CreateCandidateApplicationInput): Promise<CandidateApplication>;
  findDuplicateByContact(whatsapp: string, email: string): Promise<boolean>;
  findById(id: string): Promise<CandidateApplication | null>;
  list(filters: CandidateListFilters): Promise<CandidateListResult>;
  review(
    id: string,
    params: {
      status: "APPROVED" | "REJECTED";
      reviewedBy: string;
      reviewDecisionNote?: string;
      retentionUntil?: Date;
    },
  ): Promise<CandidateApplication | null>;
};
