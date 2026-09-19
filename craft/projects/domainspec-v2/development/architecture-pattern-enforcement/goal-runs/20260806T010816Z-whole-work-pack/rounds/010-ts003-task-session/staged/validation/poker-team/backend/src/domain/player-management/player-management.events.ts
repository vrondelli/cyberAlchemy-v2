export type PlayerCreatedEvent = {
  type: "PlayerCreated";
  playerId: string;
  emailKey: string;
  currentLimit: string;
  occurredAt: Date;
};

export type CoachCreatedEvent = {
  type: "CoachCreated";
  coachId: string;
  principalId: string;
  status: "ACTIVE" | "INACTIVE";
  occurredAt: Date;
};

export type CoachAssignedEvent = {
  type: "CoachAssigned";
  assignmentId: string;
  coachId: string;
  playerId: string;
  assignedAt: Date;
};

export type CoachUnassignedEvent = {
  type: "CoachUnassigned";
  assignmentId: string;
  coachId: string;
  playerId: string;
  unassignedAt: Date;
};

export type PlayerManagementEvent =
  | PlayerCreatedEvent
  | CoachCreatedEvent
  | CoachAssignedEvent
  | CoachUnassignedEvent;

export type PlayerManagementEventHandler = (
  event: PlayerManagementEvent,
) => void | Promise<void>;
