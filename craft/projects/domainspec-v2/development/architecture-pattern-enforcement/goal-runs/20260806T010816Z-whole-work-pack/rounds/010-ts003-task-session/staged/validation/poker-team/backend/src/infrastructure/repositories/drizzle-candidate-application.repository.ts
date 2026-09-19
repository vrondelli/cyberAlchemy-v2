import { and, desc, eq, or, sql } from "drizzle-orm";
import {
  ApplicationStatus,
  CandidateApplication,
  CandidateSummary,
  CreateCandidateApplicationInput,
} from "../../domain/onboarding/candidate-application.entity";
import {
  CandidateApplicationRepository,
  CandidateListFilters,
  CandidateListResult,
} from "../../domain/onboarding/candidate-application.repository";
import { db } from "../database";
import { candidateApplications } from "../database/schema";

const mapRecord = (
  record: typeof candidateApplications.$inferSelect,
): CandidateApplication => ({
  ...record,
  status: record.status as ApplicationStatus,
  preferredTimeWindows: record.preferredTimeWindows as string[],
});

const mapSummary = (
  record: typeof candidateApplications.$inferSelect,
): CandidateSummary => ({
  id: record.id,
  fullName: record.fullName,
  whatsapp: record.whatsapp,
  email: record.email,
  status: record.status as ApplicationStatus,
  submittedAt: record.submittedAt,
  reviewedAt: record.reviewedAt,
});

export const drizzleCandidateApplicationRepository: CandidateApplicationRepository =
  {
    async create(
      input: CreateCandidateApplicationInput,
    ): Promise<CandidateApplication> {
      const [created] = await db
        .insert(candidateApplications)
        .values({
          ...input,
          status: "SUBMITTED",
        })
        .returning();

      return mapRecord(created);
    },

    async findDuplicateByContact(
      whatsapp: string,
      email: string,
    ): Promise<boolean> {
      const [result] = await db
        .select({ id: candidateApplications.id })
        .from(candidateApplications)
        .where(
          or(
            eq(candidateApplications.whatsapp, whatsapp),
            eq(candidateApplications.email, email),
          ),
        )
        .limit(1);

      return Boolean(result);
    },

    async findById(id: string): Promise<CandidateApplication | null> {
      const [found] = await db
        .select()
        .from(candidateApplications)
        .where(eq(candidateApplications.id, id))
        .limit(1);

      return found ? mapRecord(found) : null;
    },

    async list(filters: CandidateListFilters): Promise<CandidateListResult> {
      const offset = (filters.page - 1) * filters.limit;
      const whereClause = filters.status
        ? eq(candidateApplications.status, filters.status)
        : undefined;

      const rows = await db
        .select()
        .from(candidateApplications)
        .where(whereClause)
        .orderBy(desc(candidateApplications.submittedAt))
        .limit(filters.limit)
        .offset(offset);

      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(candidateApplications);

      const [countRow] = whereClause
        ? await countQuery.where(whereClause)
        : await countQuery;

      return {
        items: rows.map(mapSummary),
        page: filters.page,
        limit: filters.limit,
        total: Number(countRow?.count ?? 0),
      };
    },

    async review(
      id: string,
      params: {
        status: "APPROVED" | "REJECTED";
        reviewedBy: string;
        reviewDecisionNote?: string;
        retentionUntil?: Date;
      },
    ): Promise<CandidateApplication | null> {
      const [updated] = await db
        .update(candidateApplications)
        .set({
          status: params.status,
          reviewedBy: params.reviewedBy,
          reviewedAt: new Date(),
          reviewDecisionNote: params.reviewDecisionNote ?? null,
          retentionUntil: params.retentionUntil ?? null,
        })
        .where(
          and(
            eq(candidateApplications.id, id),
            or(
              eq(candidateApplications.status, "SUBMITTED"),
              eq(candidateApplications.status, "UNDER_REVIEW"),
            ),
          ),
        )
        .returning();

      return updated ? mapRecord(updated) : null;
    },
  };
