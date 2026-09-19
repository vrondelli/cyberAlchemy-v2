export type LoginSucceededEvent = {
  type: "LoginSucceeded";
  principalId: string;
  sessionId: string;
  occurredAt: Date;
};

export type TokenIssuedEvent = {
  type: "TokenIssued";
  tokenId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type TokenRevokedEvent = {
  type: "TokenRevoked";
  tokenId: string;
  sessionId: string;
  revokedAt: Date;
  reason:
    | "LOGOUT_TARGETED"
    | "LOGOUT_ALL_SESSION_TOKENS"
    | "ADMIN_FORCED_LOGOUT";
};

export type LogoutCompletedEvent = {
  type: "LogoutCompleted";
  principalId: string;
  sessionId: string;
  revokedTokenIds: string[];
  occurredAt: Date;
};

export type AccessDeniedEvent = {
  type: "AccessDenied";
  principalId: string;
  requiredPermission: string;
  reasonCode: string;
  occurredAt: Date;
};

export type AuthEvent =
  | LoginSucceededEvent
  | TokenIssuedEvent
  | TokenRevokedEvent
  | LogoutCompletedEvent
  | AccessDeniedEvent;

export type AuthEventHandler = (event: AuthEvent) => void | Promise<void>;
