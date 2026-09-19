export type InactiveReason =
  | "NOT_FOUND"
  | "TOKEN_REVOKED"
  | "TOKEN_EXPIRED"
  | "SESSION_TERMINATED"
  | "SESSION_EXPIRED";

type TokenInfo = {
  revokedAt: Date | null;
  expiresAt: Date;
};

type SessionInfo = {
  status: string;
} | null;

/**
 * R3: Inactive reason precedence for token introspection.
 * Order: NOT_FOUND → TOKEN_REVOKED → TOKEN_EXPIRED → SESSION_TERMINATED → SESSION_EXPIRED → active (null).
 */
export function resolveIntrospectInactiveReason(
  tokenInfo: TokenInfo,
  sessionInfo: SessionInfo,
): InactiveReason | null {
  if (tokenInfo.revokedAt !== null) return "TOKEN_REVOKED";
  if (new Date() >= tokenInfo.expiresAt) return "TOKEN_EXPIRED";
  if (!sessionInfo) return "NOT_FOUND";
  if (sessionInfo.status === "TERMINATED") return "SESSION_TERMINATED";
  if (sessionInfo.status === "EXPIRED") return "SESSION_EXPIRED";
  return null; // active
}
