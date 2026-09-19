export type SessionStatus = "ACTIVE" | "TERMINATED" | "EXPIRED";

export type Session = {
  id: string;
  principalId: string;
  status: SessionStatus;
  effectivePermissions: string[];
  createdAt: Date;
  expiresAt: Date;
};
