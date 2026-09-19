export type ApprovedCandidateIntakeHandoff = {
  applicationId: string;
  candidateFullName: string;
  candidateEmail: string;
  candidateWhatsapp: string;
  approvedBy: string;
  approvedAt: Date;
  acceptedRegulationVersion: string;
  acceptedRegulationAt: Date;
};

export type PlayerIntakeHandoffGateway = {
  publishApprovedCandidate(input: ApprovedCandidateIntakeHandoff): Promise<void>;
};
