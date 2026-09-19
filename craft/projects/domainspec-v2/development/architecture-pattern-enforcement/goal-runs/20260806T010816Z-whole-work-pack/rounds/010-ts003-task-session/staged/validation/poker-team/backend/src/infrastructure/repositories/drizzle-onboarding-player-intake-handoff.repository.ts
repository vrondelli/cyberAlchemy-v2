import { db } from "../database";
import { onboardingPlayerIntakeHandoffs } from "../database/schema";
import type {
  PlayerIntakeHandoffGateway,
  ApprovedCandidateIntakeHandoff,
} from "../../domain/onboarding/player-intake-handoff.contract";

export const drizzleOnboardingPlayerIntakeHandoffRepository: PlayerIntakeHandoffGateway =
  {
    async publishApprovedCandidate(
      input: ApprovedCandidateIntakeHandoff,
    ): Promise<void> {
      await db
        .insert(onboardingPlayerIntakeHandoffs)
        .values({
          applicationId: input.applicationId,
          candidateFullName: input.candidateFullName,
          candidateEmail: input.candidateEmail,
          candidateWhatsapp: input.candidateWhatsapp,
          approvedBy: input.approvedBy,
          approvedAt: input.approvedAt,
          acceptedRegulationVersion: input.acceptedRegulationVersion,
          acceptedRegulationAt: input.acceptedRegulationAt,
        })
        .onConflictDoNothing({
          target: onboardingPlayerIntakeHandoffs.applicationId,
        });
    },
  };
