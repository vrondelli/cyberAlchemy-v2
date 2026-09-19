import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { Principal } from "../../domain/auth-access-control/principal.entity";
import type { Session, SessionStatus } from "../../domain/auth-access-control/session.entity";
import type { AccessToken } from "../../domain/auth-access-control/access-token.entity";
import type { PermissionGrant } from "../../domain/auth-access-control/permission-grant.entity";
import type {
  PrincipalRepository,
  AuthSessionRepository,
  AuthTokenRepository,
  PermissionGrantRepository,
} from "../../domain/auth-access-control/auth.repository";
import { db } from "../database";
import {
  authPrincipals,
  authSessions,
  authAccessTokens,
  authPermissionGrants,
} from "../database/schema";

const BCRYPT_COST_FACTOR = 12;

type AuthDatabase = Pick<typeof db, "insert" | "select" | "update" | "delete">;

// ── Principal Repository ──

const toPrincipal = (row: typeof authPrincipals.$inferSelect): Principal => ({
  id: row.id,
  subjectType: row.subjectType,
  status: row.status,
  roleKeys: row.roleKeys,
  directPermissions: row.directPermissions,
});

export const createDrizzlePrincipalRepository = (
  database: AuthDatabase = db,
): PrincipalRepository & {
  create(input: {
    identifier: string;
    subjectType: "user" | "service" | "automation";
    roleKeys: string[];
    directPermissions: string[];
    credentialHash: string;
  }): Promise<Principal>;
    updateCredentialHashByIdentifier(
      identifier: string,
      credentialHash: string,
    ): Promise<void>;
} => ({
  async create(input) {
    const [result] = await database
      .insert(authPrincipals)
      .values({
        identifier: input.identifier,
        subjectType: input.subjectType,
        roleKeys: input.roleKeys,
        directPermissions: input.directPermissions,
        credentialHash: input.credentialHash,
        status: "ACTIVE",
      })
      .returning();
    return toPrincipal(result);
  },

  async findById(id: string): Promise<Principal | null> {
    const [result] = await database
      .select()
      .from(authPrincipals)
      .where(eq(authPrincipals.id, id));
    return result ? toPrincipal(result) : null;
  },

  async findByIdentifier(identifier: string): Promise<Principal | null> {
    const [result] = await database
      .select()
      .from(authPrincipals)
      .where(eq(authPrincipals.identifier, identifier));
    return result ? toPrincipal(result) : null;
  },

  async verifyCredential(
    identifier: string,
    secret: string,
  ): Promise<boolean> {
    const [result] = await database
      .select({ credentialHash: authPrincipals.credentialHash })
      .from(authPrincipals)
      .where(eq(authPrincipals.identifier, identifier));
    if (!result) return false;
    return bcrypt.compare(secret, result.credentialHash);
  },

  async updateCredentialHashByIdentifier(
    identifier: string,
    credentialHash: string,
  ): Promise<void> {
    await database
      .update(authPrincipals)
      .set({ credentialHash, updatedAt: new Date() })
      .where(eq(authPrincipals.identifier, identifier));
  },
});

// ── Session Repository ──

const toSession = (row: typeof authSessions.$inferSelect): Session => ({
  id: row.id,
  principalId: row.principalId,
  status: row.status,
  effectivePermissions: row.effectivePermissions,
  createdAt: row.createdAt,
  expiresAt: row.expiresAt,
});

export const createDrizzleSessionRepository = (
  database: AuthDatabase = db,
): AuthSessionRepository => ({
  async create(session: Session): Promise<Session> {
    const [result] = await database
      .insert(authSessions)
      .values({
        id: session.id,
        principalId: session.principalId,
        status: session.status,
        effectivePermissions: session.effectivePermissions,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })
      .returning();
    return toSession(result);
  },

  async findById(id: string): Promise<Session | null> {
    const [result] = await database
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, id));
    return result ? toSession(result) : null;
  },

  async updateStatus(id: string, status: SessionStatus): Promise<void> {
    await database
      .update(authSessions)
      .set({ status })
      .where(eq(authSessions.id, id));
  },

  async findActiveByPrincipalId(principalId: string): Promise<Session[]> {
    const results = await database
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.principalId, principalId),
          eq(authSessions.status, "ACTIVE"),
        ),
      );
    return results.map(toSession);
  },
});

// ── Token Repository ──

const toAccessToken = (
  row: typeof authAccessTokens.$inferSelect,
): AccessToken => ({
  tokenId: row.tokenId,
  sessionId: row.sessionId,
  issuedAt: row.issuedAt,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
  scope: row.scope,
});

export const createDrizzleTokenRepository = (
  database: AuthDatabase = db,
): AuthTokenRepository => ({
  async create(token: AccessToken): Promise<AccessToken> {
    const [result] = await database
      .insert(authAccessTokens)
      .values({
        tokenId: token.tokenId,
        sessionId: token.sessionId,
        issuedAt: token.issuedAt,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        scope: token.scope,
      })
      .returning();
    return toAccessToken(result);
  },

  async findByTokenId(tokenId: string): Promise<AccessToken | null> {
    const [result] = await database
      .select()
      .from(authAccessTokens)
      .where(eq(authAccessTokens.tokenId, tokenId));
    return result ? toAccessToken(result) : null;
  },

  async findActiveBySessionId(sessionId: string): Promise<AccessToken[]> {
    const results = await database
      .select()
      .from(authAccessTokens)
      .where(
        and(
          eq(authAccessTokens.sessionId, sessionId),
          isNull(authAccessTokens.revokedAt),
        ),
      );
    return results.map(toAccessToken);
  },

  async revoke(
    tokenId: string,
    revokedAt: Date,
    reason: string,
  ): Promise<void> {
    await database
      .update(authAccessTokens)
      .set({ revokedAt, revokeReason: reason })
      .where(eq(authAccessTokens.tokenId, tokenId));
  },

  async revokeAllBySessionId(
    sessionId: string,
    revokedAt: Date,
    reason: string,
  ): Promise<string[]> {
    const activeTokens = await database
      .select({ tokenId: authAccessTokens.tokenId })
      .from(authAccessTokens)
      .where(
        and(
          eq(authAccessTokens.sessionId, sessionId),
          isNull(authAccessTokens.revokedAt),
        ),
      );

    const tokenIds = activeTokens.map((t) => t.tokenId);

    for (const tid of tokenIds) {
      await database
        .update(authAccessTokens)
        .set({ revokedAt, revokeReason: reason })
        .where(eq(authAccessTokens.tokenId, tid));
    }

    return tokenIds;
  },
});

// ── Permission Grant Repository ──

const toPermissionGrant = (
  row: typeof authPermissionGrants.$inferSelect,
): PermissionGrant => ({
  grantId: row.grantId,
  granteeType: row.granteeType,
  granteeKey: row.granteeKey,
  permissionKey: row.permissionKey,
  effect: row.effect,
  createdAt: row.createdAt,
});

export const createDrizzlePermissionGrantRepository = (
  database: AuthDatabase = db,
): PermissionGrantRepository & {
  upsertGrant(grant: {
    granteeType: "role" | "principal";
    granteeKey: string;
    permissionKey: string;
    effect: "ALLOW" | "DENY";
  }): Promise<PermissionGrant>;
} => ({
  async findByGranteeKeys(granteeKeys: string[]): Promise<PermissionGrant[]> {
    if (granteeKeys.length === 0) return [];

    const results = await database
      .select()
      .from(authPermissionGrants);

    return results
      .filter((r) => granteeKeys.includes(r.granteeKey))
      .map(toPermissionGrant);
  },

  async findAll(options?: {
    namespace?: string;
    includeDeprecated?: boolean;
  }): Promise<PermissionGrant[]> {
    const results = await database
      .select()
      .from(authPermissionGrants);

    if (options?.namespace) {
      return results
        .filter((r) => r.permissionKey.startsWith(options.namespace!))
        .map(toPermissionGrant);
    }

    return results.map(toPermissionGrant);
  },

  async upsertGrant(grant) {
    const existing = await database
      .select()
      .from(authPermissionGrants)
      .where(
        and(
          eq(authPermissionGrants.granteeType, grant.granteeType),
          eq(authPermissionGrants.granteeKey, grant.granteeKey),
          eq(authPermissionGrants.permissionKey, grant.permissionKey),
        ),
      );

    if (existing.length > 0) {
      return toPermissionGrant(existing[0]);
    }

    const [result] = await database
      .insert(authPermissionGrants)
      .values({
        granteeType: grant.granteeType,
        granteeKey: grant.granteeKey,
        permissionKey: grant.permissionKey,
        effect: grant.effect,
      })
      .returning();

    return toPermissionGrant(result);
  },
});
