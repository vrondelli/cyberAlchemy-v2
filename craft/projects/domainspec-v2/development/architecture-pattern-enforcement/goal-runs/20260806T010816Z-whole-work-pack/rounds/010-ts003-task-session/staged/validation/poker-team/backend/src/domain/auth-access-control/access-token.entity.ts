export type TokenStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type AccessToken = {
  tokenId: string;
  sessionId: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  scope: string[];
};
