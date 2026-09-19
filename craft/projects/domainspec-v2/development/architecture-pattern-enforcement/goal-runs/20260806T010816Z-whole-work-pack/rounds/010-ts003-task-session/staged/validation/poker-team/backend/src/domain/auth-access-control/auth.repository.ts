import type { Session, SessionStatus } from "./session.entity";
import type { AccessToken } from "./access-token.entity";
import type { Principal } from "./principal.entity";
import type { PermissionGrant } from "./permission-grant.entity";

export type AuthSessionRepository = {
  create(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  updateStatus(id: string, status: SessionStatus): Promise<void>;
  findActiveByPrincipalId(principalId: string): Promise<Session[]>;
};

export type AuthTokenRepository = {
  create(token: AccessToken): Promise<AccessToken>;
  findByTokenId(tokenId: string): Promise<AccessToken | null>;
  findActiveBySessionId(sessionId: string): Promise<AccessToken[]>;
  revoke(tokenId: string, revokedAt: Date, reason: string): Promise<void>;
  revokeAllBySessionId(
    sessionId: string,
    revokedAt: Date,
    reason: string,
  ): Promise<string[]>;
};

export type PrincipalRepository = {
  findById(id: string): Promise<Principal | null>;
  findByIdentifier(identifier: string): Promise<Principal | null>;
  verifyCredential(identifier: string, secret: string): Promise<boolean>;
};

export type PermissionGrantRepository = {
  findByGranteeKeys(granteeKeys: string[]): Promise<PermissionGrant[]>;
  findAll(options?: {
    namespace?: string;
    includeDeprecated?: boolean;
  }): Promise<PermissionGrant[]>;
};
