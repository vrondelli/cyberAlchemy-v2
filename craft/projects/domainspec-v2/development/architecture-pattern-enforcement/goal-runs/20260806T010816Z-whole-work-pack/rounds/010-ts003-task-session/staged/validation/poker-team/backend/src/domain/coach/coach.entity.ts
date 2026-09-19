export type CoachStatus = "ACTIVE" | "INACTIVE";

export type Coach = {
  id: string;
  principalId: string;
  name: string;
  email: string;
  status: CoachStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCoachInput = {
  principalId: string;
  name: string;
  email: string;
};

export type CoachAssignment = {
  id: string;
  coachId: string;
  playerId: string;
  assignedAt: Date;
  unassignedAt: Date | null;
};
