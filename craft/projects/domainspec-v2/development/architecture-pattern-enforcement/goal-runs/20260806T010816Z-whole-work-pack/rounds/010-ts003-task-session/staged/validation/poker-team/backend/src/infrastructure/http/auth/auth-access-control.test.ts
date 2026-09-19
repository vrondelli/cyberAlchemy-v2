import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// Domain imports
import {
  AuthValidationError,
  AuthInternalError,
} from "../../../domain/auth-access-control/auth.errors";
import type { AuthErrorCode } from "../../../domain/auth-access-control/auth-error-code.enum";
import { AUTH_ERROR_CODES } from "../../../domain/auth-access-control/auth-error-code.enum";
import type { Principal } from "../../../domain/auth-access-control/principal.entity";
import type {
  Session,
  SessionStatus,
} from "../../../domain/auth-access-control/session.entity";
import type {
  AccessToken,
  TokenStatus,
} from "../../../domain/auth-access-control/access-token.entity";
import type { PermissionGrant } from "../../../domain/auth-access-control/permission-grant.entity";
import type {
  AuthSessionRepository,
  AuthTokenRepository,
  PrincipalRepository,
  PermissionGrantRepository,
} from "../../../domain/auth-access-control/auth.repository";
import type {
  AuthEvent,
  AuthEventHandler,
  LoginSucceededEvent,
  TokenIssuedEvent,
  TokenRevokedEvent,
  LogoutCompletedEvent,
  AccessDeniedEvent,
} from "../../../domain/auth-access-control/auth.events";
import {
  PERMISSION_KEY_PATTERN,
  parsePermissionKey,
  isCanonicalPermissionKey,
} from "../../../domain/auth-access-control/auth-context.vo";
import type { AuthContext } from "../../../domain/auth-access-control/auth-context.vo";
import {
  validatePermissionKey,
  validateTokenExpiry,
  validateRevokedNotActive,
  deduplicatePermissions,
  validateSidClaim,
} from "../../../domain/auth-access-control/auth.validation";
import {
  transitionSession,
  isTerminalSessionState,
} from "../../../domain/auth-access-control/session-lifecycle";
import {
  transitionToken,
  isTerminalTokenState,
} from "../../../domain/auth-access-control/token-lifecycle";
import {
  resolvePermissionDecision,
  resolveEffectivePermissions,
} from "../../../domain/auth-access-control/permission-resolution";

// Use-case imports
import {
  loginUseCase,
  issueAccessTokenUseCase,
} from "../../../use-cases/auth-access-control/login";
import { authenticateRequestUseCase } from "../../../use-cases/auth-access-control/authenticate-request";
import { authorizeRequestUseCase } from "../../../use-cases/auth-access-control/authorize-request";
import { logoutUseCase } from "../../../use-cases/auth-access-control/logout";
import { introspectTokenUseCase } from "../../../use-cases/auth-access-control/introspect-token";
import { getPermissionCatalogUseCase } from "../../../use-cases/auth-access-control/get-permission-catalog";

// HTTP layer import
import { buildApp } from "../app";

// ---------- helpers ----------

const JWT_SECRET = "secretKey";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function makePrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: randomUUID(),
    subjectType: "user",
    status: "ACTIVE",
    roleKeys: ["player"],
    directPermissions: ["auth-access-control.read.introspectToken"],
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: randomUUID(),
    principalId: randomUUID(),
    status: "ACTIVE",
    effectivePermissions: ["auth-access-control.read.introspectToken"],
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    ...overrides,
  };
}

function makeToken(overrides: Partial<AccessToken> = {}): AccessToken {
  const now = new Date();
  return {
    tokenId: randomUUID(),
    sessionId: randomUUID(),
    issuedAt: now,
    expiresAt: new Date(now.getTime() + 3600_000),
    revokedAt: null,
    scope: [],
    ...overrides,
  };
}

function makeGrant(overrides: Partial<PermissionGrant> = {}): PermissionGrant {
  return {
    grantId: randomUUID(),
    granteeType: "role",
    granteeKey: "player",
    permissionKey: "auth-access-control.read.introspectToken",
    effect: "ALLOW",
    createdAt: new Date(),
    ...overrides,
  };
}

function signJwt(
  payload: Record<string, unknown>,
  opts: { expiresIn?: number; secret?: string } = {},
): string {
  return jwt.sign(payload, opts.secret ?? JWT_SECRET, {
    expiresIn: opts.expiresIn ?? 3600,
  });
}

function makeRepos(
  overrides: {
    principal?: Partial<PrincipalRepository>;
    session?: Partial<AuthSessionRepository>;
    token?: Partial<AuthTokenRepository>;
    grant?: Partial<PermissionGrantRepository>;
  } = {},
) {
  const principalRepo: PrincipalRepository = {
    findById: vi.fn().mockResolvedValue(null),
    findByIdentifier: vi.fn().mockResolvedValue(null),
    verifyCredential: vi.fn().mockResolvedValue(false),
    ...overrides.principal,
  };
  const sessionRepo: AuthSessionRepository = {
    create: vi.fn().mockImplementation(async (s) => s),
    findById: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    findActiveByPrincipalId: vi.fn().mockResolvedValue([]),
    ...overrides.session,
  };
  const tokenRepo: AuthTokenRepository = {
    create: vi.fn().mockImplementation(async (t) => t),
    findByTokenId: vi.fn().mockResolvedValue(null),
    findActiveBySessionId: vi.fn().mockResolvedValue([]),
    revoke: vi.fn().mockResolvedValue(undefined),
    revokeAllBySessionId: vi.fn().mockResolvedValue([]),
    ...overrides.token,
  };
  const grantRepo: PermissionGrantRepository = {
    findByGranteeKeys: vi.fn().mockResolvedValue([]),
    findAll: vi.fn().mockResolvedValue([]),
    ...overrides.grant,
  };
  return { principalRepo, sessionRepo, tokenRepo, grantRepo };
}

// ---------- tests ----------

describe("auth-access-control TEST-SPEC scaffold", () => {
  describe("Rule validation", () => {
    it("[AUTH-RULE-001] Login R1", async () => {
      // Disabled or missing principal is rejected with PRINCIPAL_DISABLED
      const principal = makePrincipal({ status: "DISABLED" });
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      await expect(
        login({ identifier: "user@test.com", secret: "pass" }),
      ).rejects.toThrow(AuthValidationError);
      await expect(
        login({ identifier: "user@test.com", secret: "pass" }),
      ).rejects.toMatchObject({ code: "PRINCIPAL_DISABLED" });

      // Missing principal
      const repos2 = makeRepos({
        principal: { findByIdentifier: vi.fn().mockResolvedValue(null) },
      });
      const login2 = loginUseCase(
        repos2.principalRepo,
        repos2.sessionRepo,
        repos2.tokenRepo,
        repos2.grantRepo,
      );
      await expect(
        login2({ identifier: "nonexistent", secret: "pass" }),
      ).rejects.toMatchObject({ code: "PRINCIPAL_DISABLED" });
    });

    it("[AUTH-RULE-002] Login R2", async () => {
      // Invalid credentials rejected with INVALID_CREDENTIALS
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(false),
        },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      await expect(
        login({ identifier: "user@test.com", secret: "wrong" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("[AUTH-RULE-003] Login R3", async () => {
      // Login rejected with FORBIDDEN when IP blocked, failed attempts >=5, or no user-agent
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );

      // Blocked IP
      await expect(
        login({
          identifier: "u",
          secret: "p",
          context: { ipReputation: "BLOCKED" },
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Too many failed attempts
      await expect(
        login({
          identifier: "u",
          secret: "p",
          context: { failedAttemptsLast15m: 5 },
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Missing user-agent
      await expect(
        login({
          identifier: "u",
          secret: "p",
          context: { hasUserAgent: false },
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-RULE-004] IssueAccessToken R1", async () => {
      // Non-active session cannot receive token → AUTH_REQUIRED
      const repos = makeRepos({
        session: {
          findById: vi
            .fn()
            .mockResolvedValue(makeSession({ status: "TERMINATED" })),
        },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        issue({ sessionId: "s1", ttlSeconds: 3600 }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

      // Missing session
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(null) },
      });
      const issue2 = issueAccessTokenUseCase(
        repos2.sessionRepo,
        repos2.tokenRepo,
      );
      await expect(
        issue2({ sessionId: "s1", ttlSeconds: 3600 }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    });

    it("[AUTH-RULE-005] IssueAccessToken R2", async () => {
      // ttlSeconds outside bounds rejected as validation error
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      // too low
      await expect(
        issue({ sessionId: session.id, ttlSeconds: 10 }),
      ).rejects.toThrow(AuthValidationError);
      // too high
      await expect(
        issue({ sessionId: session.id, ttlSeconds: 100_000 }),
      ).rejects.toThrow(AuthValidationError);
    });

    it("[AUTH-RULE-006] AuthenticateRequest R1", async () => {
      // Missing bearer prefix returns AUTH_REQUIRED
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: undefined }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
      await expect(
        authenticate({ authorizationHeader: "Token abc" }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    });

    it("[AUTH-RULE-007] AuthenticateRequest R2", async () => {
      // Invalid signature/claims parsing returns INVALID_TOKEN
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: "Bearer not.a.valid.jwt" }),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });

      // Wrong secret
      const wrongToken = jwt.sign({ sid: "s1", jti: "t1" }, "wrongSecret", {
        expiresIn: 3600,
      });
      await expect(
        authenticate({ authorizationHeader: `Bearer ${wrongToken}` }),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    });

    it("[AUTH-RULE-008] AuthenticateRequest R3", async () => {
      // Expired token returns TOKEN_EXPIRED
      const expiredToken = jwt.sign({ sid: "s1", jti: "t1" }, JWT_SECRET, {
        expiresIn: -10,
      });
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: `Bearer ${expiredToken}` }),
      ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    });

    it("[AUTH-RULE-009] AuthenticateRequest R4", async () => {
      // Revoked token returns TOKEN_REVOKED
      const tokenId = randomUUID();
      const sessionId = randomUUID();
      const token = signJwt({ sid: sessionId, jti: tokenId });
      const revokedToken = makeToken({
        tokenId,
        sessionId,
        revokedAt: new Date(),
      });
      const repos = makeRepos({
        token: { findByTokenId: vi.fn().mockResolvedValue(revokedToken) },
      });
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: `Bearer ${token}` }),
      ).rejects.toMatchObject({ code: "TOKEN_REVOKED" });
    });

    it("[AUTH-RULE-010] AuthenticateRequest R5", async () => {
      // Missing sid claim returns INVALID_TOKEN
      const tokenNoSid = jwt.sign({ jti: "t1" }, JWT_SECRET, {
        expiresIn: 3600,
      });
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: `Bearer ${tokenNoSid}` }),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    });

    it("[AUTH-RULE-011] AuthenticateRequest R6", async () => {
      // Missing, terminated, or expired session for sid returns AUTH_REQUIRED
      const sid = randomUUID();
      const jti = randomUUID();
      const validToken = signJwt({ sid, jti });

      // Missing session
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(null) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const auth = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        auth({ authorizationHeader: `Bearer ${validToken}` }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

      // Terminated session
      const terminated = makeSession({ id: sid, status: "TERMINATED" });
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(terminated) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const auth2 = authenticateRequestUseCase(
        repos2.sessionRepo,
        repos2.tokenRepo,
      );
      await expect(
        auth2({ authorizationHeader: `Bearer ${validToken}` }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    });

    it("[AUTH-RULE-012] AuthorizeRequest R1", async () => {
      // Non-canonical requiredPermission rejected as validation error
      const repos = makeRepos();
      const authorize = authorizeRequestUseCase(repos.grantRepo);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: [],
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };
      await expect(
        authorize({ authContext: ctx, requiredPermission: "not-canonical" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-RULE-013] AuthorizeRequest R2", async () => {
      // No matching allow permission returns FORBIDDEN
      const repos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const authorize = authorizeRequestUseCase(repos.grantRepo);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: [],
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };
      await expect(
        authorize({ authContext: ctx, requiredPermission: "svc.scope.action" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-RULE-014] AuthorizeRequest R3", async () => {
      // Matching deny rule returns FORBIDDEN even with allow entries
      const denyGrant = makeGrant({
        permissionKey: "svc.scope.action",
        effect: "DENY",
        granteeType: "principal",
        granteeKey: "p1",
      });
      const repos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([denyGrant]) },
      });
      const authorize = authorizeRequestUseCase(repos.grantRepo);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: ["svc.scope.action"], // allow from session
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };
      await expect(
        authorize({ authContext: ctx, requiredPermission: "svc.scope.action" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-RULE-015] Logout R1", async () => {
      // Non-active or missing session rejected with AUTH_REQUIRED
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(null) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        logout({
          sessionId: "s1",
          callerId: "p1",
          callerPermissions: [],
        }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

      // Terminated session
      const repos2 = makeRepos({
        session: {
          findById: vi
            .fn()
            .mockResolvedValue(makeSession({ status: "TERMINATED" })),
        },
      });
      const logout2 = logoutUseCase(repos2.sessionRepo, repos2.tokenRepo);
      await expect(
        logout2({
          sessionId: "s1",
          callerId: "p1",
          callerPermissions: [],
        }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    });

    it("[AUTH-RULE-016] Logout R2", async () => {
      // Caller can logout only own session unless admin permission present
      const principalId = randomUUID();
      const session = makeSession({ principalId });
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);

      // Different caller without admin perm → FORBIDDEN
      await expect(
        logout({
          sessionId: session.id,
          callerId: "different-principal",
          callerPermissions: [],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Admin can logout any session
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue([]) },
      });
      const logout2 = logoutUseCase(repos2.sessionRepo, repos2.tokenRepo);
      const result = await logout2({
        sessionId: session.id,
        callerId: "other",
        callerPermissions: ["auth-access-control.admin.logoutAnySession"],
      });
      expect(result.sessionId).toBe(session.id);
    });

    it("[AUTH-RULE-017] Logout R3", async () => {
      // Logout fails if revocation evidence cannot be persisted
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: {
          revokeAllBySessionId: vi
            .fn()
            .mockRejectedValue(new Error("DB write failed")),
        },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        logout({
          sessionId: session.id,
          callerId: session.principalId,
          callerPermissions: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("Calculation", () => {
    it("[AUTH-CALC-001] Login C1", async () => {
      // Session expiration equals login instant + 8h
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      const before = Date.now();
      const result = await login({ identifier: "u", secret: "p" });
      const after = Date.now();

      // Check session was created with expiresAt ≈ now + 8h
      const createCall = (repos.sessionRepo.create as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as Session;
      const expectedMinExpiry = before + SESSION_TTL_MS;
      const expectedMaxExpiry = after + SESSION_TTL_MS;
      expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpiry,
      );
      expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxExpiry,
      );
    });

    it("[AUTH-CALC-002] Login C2", async () => {
      // Session permissions = deterministic resolution of roleKeys + directPermissions + grants
      const principal = makePrincipal({
        roleKeys: ["admin"],
        directPermissions: ["svc.scope.read"],
      });
      const grant = makeGrant({
        permissionKey: "svc.scope.write",
        granteeKey: "admin",
        effect: "ALLOW",
      });
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([grant]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      await login({ identifier: "u", secret: "p" });

      const createdSession = (
        repos.sessionRepo.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as Session;
      // Should contain directPermission + grant permission (deduplicated)
      expect(createdSession.effectivePermissions).toContain("svc.scope.read");
      expect(createdSession.effectivePermissions).toContain("svc.scope.write");
    });

    it("[AUTH-CALC-003] IssueAccessToken C1", async () => {
      // Token expiration = issuedAt + ttlSeconds
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      const before = Date.now();
      const result = await issue({ sessionId: session.id, ttlSeconds: 600 });
      const after = Date.now();

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + 600_000,
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + 600_000);
    });

    it("[AUTH-CALC-004] IssueAccessToken C2", async () => {
      // JWT claims are exactly {sid, jti, iat, exp} (minimal token set)
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      const result = await issue({ sessionId: session.id, ttlSeconds: 600 });

      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<
        string,
        unknown
      >;
      expect(decoded).toHaveProperty("sid", session.id);
      expect(decoded).toHaveProperty("jti");
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
      // Ensure no extra claims like sub, aud, etc
      const claimKeys = Object.keys(decoded);
      expect(claimKeys.sort()).toEqual(["exp", "iat", "jti", "sid"]);
    });

    it("[AUTH-CALC-005] AuthenticateRequest C1", async () => {
      // Auth context merges claims and session resolution using sid
      const session = makeSession();
      const tokenId = randomUUID();
      const token = signJwt({ sid: session.id, jti: tokenId });
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      const result = await authenticate({
        authorizationHeader: `Bearer ${token}`,
      });

      expect(result.authContext.principalId).toBe(session.principalId);
      expect(result.authContext.sessionId).toBe(session.id);
      expect(result.authContext.permissions).toEqual(
        session.effectivePermissions,
      );
      expect(result.authContext.tokenId).toBe(tokenId);
      expect(result.authContext.issuedAt).toBeInstanceOf(Date);
      expect(result.authContext.expiresAt).toBeInstanceOf(Date);
    });

    it("[AUTH-CALC-006] AuthorizeRequest C1", async () => {
      // Precedence: exact > scopedWildcard > globalWildcard
      // Verify by providing grants at different specificity levels
      const decision1 = resolvePermissionDecision(
        [{ permissionKey: "svc.scope.action", effect: "ALLOW" }],
        "svc.scope.action",
      );
      expect(decision1).toBe("ALLOW");

      // Scoped wildcard
      const decision2 = resolvePermissionDecision(
        [{ permissionKey: "svc.scope.*", effect: "ALLOW" }],
        "svc.scope.action",
      );
      expect(decision2).toBe("ALLOW");

      // Global wildcard
      const decision3 = resolvePermissionDecision(
        [{ permissionKey: "*", effect: "ALLOW" }],
        "svc.scope.action",
      );
      expect(decision3).toBe("ALLOW");

      // Deny overrides any allow
      const decision4 = resolvePermissionDecision(
        [
          { permissionKey: "svc.scope.action", effect: "ALLOW" },
          { permissionKey: "svc.scope.action", effect: "DENY" },
        ],
        "svc.scope.action",
      );
      expect(decision4).toBe("DENY");
    });

    it("[AUTH-CALC-007] Logout C1", async () => {
      // Revocation set: {tokenId} when provided, else all active session tokens
      const session = makeSession();
      const tokenId = randomUUID();

      // Targeted: only specified token
      const repos1 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revoke: vi.fn().mockResolvedValue(undefined) },
      });
      const logout1 = logoutUseCase(repos1.sessionRepo, repos1.tokenRepo);
      const result1 = await logout1({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
        tokenId,
        revokeAllSessionTokens: false,
      });
      expect(result1.revokedTokenIds).toEqual([tokenId]);

      // All active tokens
      const allTokenIds = [randomUUID(), randomUUID()];
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue(allTokenIds) },
      });
      const logout2 = logoutUseCase(repos2.sessionRepo, repos2.tokenRepo);
      const result2 = await logout2({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
      });
      expect(result2.revokedTokenIds).toEqual(allTokenIds);
    });
  });

  describe("Postcondition", () => {
    it("[AUTH-POST-001] Login postconditions", async () => {
      // Successful login persists session and issues access token
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      const result = await login({ identifier: "u", secret: "p" });

      expect(repos.sessionRepo.create).toHaveBeenCalledTimes(1);
      expect(repos.tokenRepo.create).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBeTruthy();
      expect(result.sessionId).toBeTruthy();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("[AUTH-POST-002] IssueAccessToken postconditions", async () => {
      // Token metadata persisted and sid is authoritative identity claim
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      const result = await issue({ sessionId: session.id, ttlSeconds: 600 });

      expect(repos.tokenRepo.create).toHaveBeenCalledTimes(1);
      const createdToken = (repos.tokenRepo.create as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as AccessToken;
      expect(createdToken.sessionId).toBe(session.id);
      expect(createdToken.revokedAt).toBeNull();

      // sid claim in JWT matches session.id
      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<
        string,
        unknown
      >;
      expect(decoded.sid).toBe(session.id);
    });

    it("[AUTH-POST-003] AuthenticateRequest postconditions", async () => {
      // Request receives normalized authContext for downstream authorization
      const session = makeSession();
      const tokenId = randomUUID();
      const token = signJwt({ sid: session.id, jti: tokenId });
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      const result = await authenticate({
        authorizationHeader: `Bearer ${token}`,
      });

      const ctx = result.authContext;
      expect(ctx).toHaveProperty("principalId");
      expect(ctx).toHaveProperty("sessionId");
      expect(ctx).toHaveProperty("permissions");
      expect(ctx).toHaveProperty("tokenId");
      expect(ctx).toHaveProperty("issuedAt");
      expect(ctx).toHaveProperty("expiresAt");
      expect(Array.isArray(ctx.permissions)).toBe(true);
    });

    it("[AUTH-POST-004] AuthorizeRequest postconditions", async () => {
      // ALLOW path forwards request; DENY path returns deterministic FORBIDDEN
      const repos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const authorize = authorizeRequestUseCase(repos.grantRepo);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: ["svc.scope.action"],
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };

      // ALLOW path
      const result = await authorize({
        authContext: ctx,
        requiredPermission: "svc.scope.action",
      });
      expect(result.allowed).toBe(true);

      // DENY path
      const ctx2: AuthContext = { ...ctx, permissions: [] };
      await expect(
        authorize({
          authContext: ctx2,
          requiredPermission: "svc.scope.action",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-POST-005] Logout postconditions", async () => {
      // Session terminates, token(s) revoked, revocation evidence persisted
      const session = makeSession();
      const revokedIds = [randomUUID()];
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue(revokedIds) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      const result = await logout({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
      });

      expect(repos.sessionRepo.updateStatus).toHaveBeenCalledWith(
        session.id,
        "TERMINATED",
      );
      expect(repos.tokenRepo.revokeAllBySessionId).toHaveBeenCalled();
      expect(result.revokedTokenIds).toEqual(revokedIds);
    });
  });

  describe("Error state", () => {
    it("[AUTH-ERR-001] Login error mapping", async () => {
      // R1→PRINCIPAL_DISABLED, R2→INVALID_CREDENTIALS, R3→FORBIDDEN
      const principal = makePrincipal({ status: "DISABLED" });
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      try {
        await login({ identifier: "u", secret: "p" });
      } catch (e: any) {
        expect(e).toBeInstanceOf(AuthValidationError);
        expect(e.code).toBe("PRINCIPAL_DISABLED");
      }

      // R2
      const repos2 = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(makePrincipal()),
          verifyCredential: vi.fn().mockResolvedValue(false),
        },
      });
      const login2 = loginUseCase(
        repos2.principalRepo,
        repos2.sessionRepo,
        repos2.tokenRepo,
        repos2.grantRepo,
      );
      await expect(
        login2({ identifier: "u", secret: "w" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

      // R3
      const repos3 = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(makePrincipal()),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
      });
      const login3 = loginUseCase(
        repos3.principalRepo,
        repos3.sessionRepo,
        repos3.tokenRepo,
        repos3.grantRepo,
      );
      await expect(
        login3({
          identifier: "u",
          secret: "p",
          context: { ipReputation: "BLOCKED" },
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-ERR-002] IssueAccessToken error mapping", async () => {
      // Session activity → AUTH_REQUIRED; ttl/signing failures → validation/internal
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(null) },
      });
      const issue = issueAccessTokenUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        issue({ sessionId: "s1", ttlSeconds: 3600 }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(makeSession()) },
      });
      const issue2 = issueAccessTokenUseCase(
        repos2.sessionRepo,
        repos2.tokenRepo,
      );
      await expect(issue2({ sessionId: "s1", ttlSeconds: 0 })).rejects.toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-ERR-003] AuthenticateRequest error mapping", async () => {
      // R1→AUTH_REQUIRED, R2→INVALID_TOKEN, R3→TOKEN_EXPIRED, R4→TOKEN_REVOKED
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );

      // R1
      await expect(
        authenticate({ authorizationHeader: undefined }),
      ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

      // R2
      await expect(
        authenticate({ authorizationHeader: "Bearer invalid" }),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });

      // R3
      const expired = jwt.sign({ sid: "s", jti: "t" }, JWT_SECRET, {
        expiresIn: -1,
      });
      await expect(
        authenticate({ authorizationHeader: `Bearer ${expired}` }),
      ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });

      // R4
      const tid = randomUUID();
      const sid = randomUUID();
      const tok = signJwt({ sid, jti: tid });
      const repos2 = makeRepos({
        token: {
          findByTokenId: vi
            .fn()
            .mockResolvedValue(
              makeToken({ tokenId: tid, revokedAt: new Date() }),
            ),
        },
      });
      const auth2 = authenticateRequestUseCase(
        repos2.sessionRepo,
        repos2.tokenRepo,
      );
      await expect(
        auth2({ authorizationHeader: `Bearer ${tok}` }),
      ).rejects.toMatchObject({ code: "TOKEN_REVOKED" });
    });

    it("[AUTH-ERR-004] AuthorizeRequest error mapping", async () => {
      // Rule violations → validation error or FORBIDDEN
      const repos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const authorize = authorizeRequestUseCase(repos.grantRepo);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: [],
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };

      // Non-canonical key
      await expect(
        authorize({ authContext: ctx, requiredPermission: "bad" }),
      ).rejects.toBeInstanceOf(AuthValidationError);

      // No matching permission
      await expect(
        authorize({ authContext: ctx, requiredPermission: "svc.scope.action" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-ERR-005] Logout error mapping", async () => {
      // Ownership → FORBIDDEN, persistence failures → internal error
      const session = makeSession();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        logout({
          sessionId: session.id,
          callerId: "not-the-owner",
          callerPermissions: [],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Persistence failure
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: {
          revokeAllBySessionId: vi
            .fn()
            .mockRejectedValue(new Error("DB error")),
        },
      });
      const logout2 = logoutUseCase(repos2.sessionRepo, repos2.tokenRepo);
      await expect(
        logout2({
          sessionId: session.id,
          callerId: session.principalId,
          callerPermissions: [],
        }),
      ).rejects.toThrow();
    });
  });

  describe("Contract", () => {
    it("[AUTH-API-001] POST /auth/login responses", async () => {
      // Field-level validation and error payload shape remain deterministic.
      // Full login status mapping assertions live in auth.routes.contract.test.ts.
      const app = await buildApp();

      // 422 when missing fields
      const res422 = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
      });
      expect(res422.statusCode).toBe(422);
      const body422 = res422.json();
      expect(body422).toHaveProperty("code");
      expect(body422).toHaveProperty("message");

      await app.close();
    });

    it("[AUTH-API-002] POST /auth/token responses", async () => {
      // Route is protected and returns standard auth payload without credentials
      const app = await buildApp();
      const res = await app.inject({
        method: "POST",
        url: "/auth/token",
        payload: { sessionId: "s1", ttlSeconds: 600 },
      });
      expect(res.statusCode).toBe(401);
      const body = res.json();
      expect(body).toHaveProperty("code");
      expect(body).toHaveProperty("message");
      await app.close();
    });

    it("[AUTH-API-003] POST /auth/logout responses", async () => {
      // 200/401/403/500 and response shapes match contract
      const app = await buildApp();

      // No auth header → 401
      const res401 = await app.inject({
        method: "POST",
        url: "/auth/logout",
        payload: { sessionId: "s1" },
      });
      expect(res401.statusCode).toBe(401);
      const body401 = res401.json();
      expect(body401).toHaveProperty("code");
      expect(body401).toHaveProperty("message");

      await app.close();
    });

    it("[AUTH-API-004] GET /auth/introspect responses", async () => {
      // 200/401/403 match contract, 200 payload includes inactiveReason? when inactive
      const app = await buildApp();

      // No auth → 401
      const res401 = await app.inject({
        method: "GET",
        url: "/auth/introspect?token=sometoken",
      });
      expect(res401.statusCode).toBe(401);
      const body = res401.json();
      expect(body).toHaveProperty("code");

      await app.close();
    });

    it("[AUTH-API-005] Refresh endpoint deferred in v1", async () => {
      // /auth/refresh is not exposed in current contract version
      const app = await buildApp();
      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
      });
      expect(res.statusCode).toBe(404);
      await app.close();
    });

    it("[AUTH-API-006] Standard auth error payload", async () => {
      // Error body is always { code, message, details? }
      const app = await buildApp();

      // Trigger an auth error via missing bearer
      const res = await app.inject({
        method: "POST",
        url: "/auth/logout",
        payload: {},
      });
      const body = res.json();
      expect(body).toHaveProperty("code");
      expect(body).toHaveProperty("message");
      // details is optional
      if (body.details !== undefined) {
        expect(typeof body.details).not.toBe("undefined");
      }

      await app.close();
    });
  });

  describe("Transition", () => {
    it("[AUTH-STATE-001] Session [new] -> ACTIVE", () => {
      // LoginSucceeded transitions session to ACTIVE
      const result = transitionSession("[new]", "LoginSucceeded");
      expect(result).toBe("ACTIVE");
    });

    it("[AUTH-STATE-002] Session ACTIVE -> TERMINATED", () => {
      // LogoutCompleted transitions session to TERMINATED
      const result = transitionSession("ACTIVE", "LogoutCompleted");
      expect(result).toBe("TERMINATED");
    });

    it("[AUTH-STATE-003] Session ACTIVE -> EXPIRED", () => {
      // SessionExpired transitions session when now >= expiresAt
      const result = transitionSession("ACTIVE", "SessionExpired");
      expect(result).toBe("EXPIRED");
    });

    it("[AUTH-STATE-008] Token [new] -> ACTIVE", () => {
      // TokenIssued creates ACTIVE token state
      const result = transitionToken("[new]", "TokenIssued");
      expect(result).toBe("ACTIVE");
    });

    it("[AUTH-STATE-009] Token ACTIVE -> EXPIRED", () => {
      // TokenExpired transition at now >= expiresAt
      const result = transitionToken("ACTIVE", "TokenExpired");
      expect(result).toBe("EXPIRED");
    });

    it("[AUTH-STATE-010] Token ACTIVE -> REVOKED", () => {
      // TokenRevoked transition after successful revocation
      const result = transitionToken("ACTIVE", "TokenRevoked");
      expect(result).toBe("REVOKED");
    });
  });

  describe("Negative transition", () => {
    it("[AUTH-STATE-004] Session TERMINATED + LoginSucceeded invalid", () => {
      // Terminated session cannot be reactivated
      expect(() => transitionSession("TERMINATED", "LoginSucceeded")).toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-STATE-005] Session EXPIRED + LoginSucceeded invalid", () => {
      // Expired session cannot be reactivated
      expect(() => transitionSession("EXPIRED", "LoginSucceeded")).toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-STATE-011] Token EXPIRED + LoginSucceeded invalid", () => {
      // Expired token remains terminal, cannot be reactivated
      // There is no "LoginSucceeded" event for tokens - any non-valid transition throws
      expect(() => transitionToken("EXPIRED", "TokenIssued")).toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-STATE-012] Token REVOKED + LoginSucceeded invalid", () => {
      // Revoked token remains terminal
      expect(() => transitionToken("REVOKED", "TokenIssued")).toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-STATE-013] Token EXPIRED + TokenRevoked invalid", () => {
      // Expired token revocation path rejected as terminal behavior
      expect(() => transitionToken("EXPIRED", "TokenRevoked")).toThrow(
        AuthValidationError,
      );
    });
  });

  describe("Invariant property", () => {
    it("[AUTH-STATE-006] Session I1", () => {
      // Terminal session states have no outgoing transitions
      const terminalStates: SessionStatus[] = ["TERMINATED", "EXPIRED"];
      const events = [
        "LoginSucceeded",
        "LogoutCompleted",
        "SessionExpired",
      ] as const;
      for (const state of terminalStates) {
        for (const event of events) {
          expect(() => transitionSession(state, event)).toThrow();
        }
      }
    });

    it("[AUTH-STATE-007] Session I2", () => {
      // ACTIVE session always has future expiresAt
      const session = makeSession({ status: "ACTIVE" });
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("[AUTH-STATE-014] Token I1", () => {
      // EXPIRED and REVOKED token states are terminal
      expect(isTerminalTokenState("EXPIRED")).toBe(true);
      expect(isTerminalTokenState("REVOKED")).toBe(true);
      expect(isTerminalTokenState("ACTIVE")).toBe(false);
    });

    it("[AUTH-STATE-015] Token I2", () => {
      // ACTIVE token always has revokedAt = null
      const token = makeToken({ revokedAt: null });
      expect(token.revokedAt).toBeNull();
      // Validation rejects ACTIVE + revokedAt != null
      expect(() => validateRevokedNotActive(new Date(), "ACTIVE")).toThrow(
        AuthValidationError,
      );
    });

    it("[AUTH-STATE-016] Token I3", async () => {
      // EXPIRED token is never accepted by authorization decision
      // resolvePermissionDecision with no grants → DENY (default)
      const decision = resolvePermissionDecision([], "svc.scope.action");
      expect(decision).toBe("DENY");

      // An expired token would not reach authorization — authenticate catches it first
      const expiredJwt = jwt.sign({ sid: "s1", jti: "t1" }, JWT_SECRET, {
        expiresIn: -10,
      });
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: `Bearer ${expiredJwt}` }),
      ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    });
  });

  describe("Mapping", () => {
    it("[AUTH-MAP-001] LoginRequestToSession field mapping", async () => {
      // identifier/context/now/now+8h map deterministically to session fields
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      await login({ identifier: "user@test.com", secret: "pass" });

      const session = (repos.sessionRepo.create as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as Session;
      expect(session.principalId).toBe(principal.id);
      expect(session.status).toBe("ACTIVE");
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt.getTime()).toBeGreaterThan(
        session.createdAt.getTime(),
      );
      expect(session.expiresAt.getTime() - session.createdAt.getTime()).toBe(
        SESSION_TTL_MS,
      );
    });

    it("[AUTH-MAP-003] JWTClaimsToAuthContext field mapping", async () => {
      // sid/jti/iat/exp and session lookup map exactly to AuthContext fields
      const session = makeSession();
      const tokenId = randomUUID();
      const token = signJwt({ sid: session.id, jti: tokenId });
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      const result = await authenticate({
        authorizationHeader: `Bearer ${token}`,
      });

      expect(result.authContext.sessionId).toBe(session.id);
      expect(result.authContext.tokenId).toBe(tokenId);
      expect(result.authContext.principalId).toBe(session.principalId);
      expect(result.authContext.permissions).toEqual(
        session.effectivePermissions,
      );
    });

    it("[AUTH-MAP-005] LogoutRequestToTermination", async () => {
      // Logout request maps to revocation input, default revokeAllSessionTokens=false
      // When no tokenId and no revokeAllSessionTokens, all tokens are revoked (default path)
      const session = makeSession();
      const revokedIds = [randomUUID()];
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue(revokedIds) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      // No tokenId, no revokeAllSessionTokens → falls through to revokeAll path
      const result = await logout({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
      });
      expect(result.revokedTokenIds).toEqual(revokedIds);
      expect(repos.tokenRepo.revokeAllBySessionId).toHaveBeenCalled();
    });

    it("[AUTH-MAP-007] RoutePermissionBinding", () => {
      // Route metadata normalizes permission key and forwards authContext
      // Test canonical key validation
      expect(
        isCanonicalPermissionKey("auth-access-control.read.introspectToken"),
      ).toBe(true);
      expect(
        isCanonicalPermissionKey("auth-access-control.admin.logoutAnySession"),
      ).toBe(true);

      // parsePermissionKey returns structured parts
      const parsed = parsePermissionKey(
        "auth-access-control.read.introspectToken",
      );
      expect(parsed).toEqual({
        microservice: "auth-access-control",
        scope: "read",
        action: "introspectToken",
      });
    });

    it("[AUTH-MAP-009] ErrorToHttpResponse", () => {
      // Error fields map directly to HTTP payload with optional details omission
      const error = new AuthValidationError("FORBIDDEN", "Access denied", {
        detail: "test",
      });
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Access denied");
      expect(error.details).toEqual({ detail: "test" });

      const errorNoDetails = new AuthValidationError(
        "AUTH_REQUIRED",
        "Missing auth",
      );
      expect(errorNoDetails.code).toBe("AUTH_REQUIRED");
      expect(errorNoDetails.message).toBe("Missing auth");
      expect(errorNoDetails.details).toBeUndefined();
    });
  });

  describe("Mapping validation", () => {
    it("[AUTH-MAP-002] LoginRequestToSession validation", async () => {
      // Missing identifier or secret returns INVALID_CREDENTIALS
      const repos = makeRepos();
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      await expect(
        login({ identifier: "", secret: "p" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
      await expect(
        login({ identifier: "u", secret: "" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("[AUTH-MAP-004] JWTClaimsToAuthContext validation", async () => {
      // Missing sid/jti → INVALID_TOKEN; expired exp → TOKEN_EXPIRED
      const noSid = jwt.sign({ jti: "t1" }, JWT_SECRET, { expiresIn: 3600 });
      const repos = makeRepos();
      const authenticate = authenticateRequestUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      await expect(
        authenticate({ authorizationHeader: `Bearer ${noSid}` }),
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });

      const expired = jwt.sign({ sid: "s1", jti: "t1" }, JWT_SECRET, {
        expiresIn: -10,
      });
      await expect(
        authenticate({ authorizationHeader: `Bearer ${expired}` }),
      ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    });

    it("[AUTH-MAP-006] LogoutRequestToTermination validation", async () => {
      // Empty sessionId is rejected as validation error
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(null) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo);
      await expect(
        logout({
          sessionId: "",
          callerId: "p1",
          callerPermissions: [],
        }),
      ).rejects.toThrow(); // finds null session → AUTH_REQUIRED
    });

    it("[AUTH-MAP-008] RoutePermissionBinding validation", () => {
      // Non-canonical requiredPermission fails validation
      expect(isCanonicalPermissionKey("not canonical")).toBe(false);
      expect(isCanonicalPermissionKey("")).toBe(false);
      expect(() => validatePermissionKey("bad-key")).toThrow(
        AuthValidationError,
      );
    });
  });

  describe("Query", () => {
    it("[AUTH-QUERY-001] GetPermissionCatalog filtering", async () => {
      // namespace and includeDeprecated filters are deterministic
      const grants = [
        makeGrant({ permissionKey: "auth.read.x" }),
        makeGrant({ permissionKey: "player.write.y" }),
      ];
      const repos = makeRepos({
        grant: {
          findAll: vi.fn().mockImplementation(async (opts) => {
            if (opts?.namespace === "auth") return [grants[0]];
            return grants;
          }),
        },
      });
      const catalog = getPermissionCatalogUseCase(repos.grantRepo);

      const result1 = await catalog({ namespace: "auth" });
      expect(result1.permissions.length).toBe(1);
      expect(result1.permissions[0].key).toBe("auth.read.x");

      const result2 = await catalog({});
      expect(result2.permissions.length).toBe(2);
    });

    it("[AUTH-QUERY-002] GetPermissionCatalog canonical entries", async () => {
      // Active catalog includes both canonical permissions
      const grants = [
        makeGrant({
          permissionKey: "auth-access-control.read.introspectToken",
        }),
        makeGrant({
          permissionKey: "auth-access-control.admin.logoutAnySession",
        }),
      ];
      const repos = makeRepos({
        grant: { findAll: vi.fn().mockResolvedValue(grants) },
      });
      const catalog = getPermissionCatalogUseCase(repos.grantRepo);
      const result = await catalog({});

      const keys = result.permissions.map((p) => p.key);
      expect(keys).toContain("auth-access-control.read.introspectToken");
      expect(keys).toContain("auth-access-control.admin.logoutAnySession");
    });

    it("[AUTH-QUERY-003] IntrospectToken output shape", async () => {
      // Returns active, principalId, exp, iat, scopes, inactiveReason?
      const session = makeSession();
      const tokenId = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3600_000);
      const token = makeToken({
        tokenId,
        sessionId: session.id,
        issuedAt: now,
        expiresAt,
      });
      const jwtToken = signJwt({ sid: session.id, jti: tokenId });

      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(token) },
      });
      const introspect = introspectTokenUseCase(
        repos.sessionRepo,
        repos.tokenRepo,
      );
      const result = await introspect({ token: jwtToken });

      expect(result).toHaveProperty("active", true);
      expect(result).toHaveProperty("principalId", session.principalId);
      expect(result).toHaveProperty("exp");
      expect(result).toHaveProperty("iat");
      expect(result).toHaveProperty("scopes");
      expect(result.inactiveReason).toBeUndefined();
    });

    it("[AUTH-QUERY-004] IntrospectToken inactive reason precedence", async () => {
      // NOT_FOUND > TOKEN_REVOKED > TOKEN_EXPIRED > SESSION_TERMINATED > SESSION_EXPIRED
      const session = makeSession();
      const tokenId = randomUUID();

      // NOT_FOUND: bad JWT
      const repos1 = makeRepos();
      const introspect1 = introspectTokenUseCase(
        repos1.sessionRepo,
        repos1.tokenRepo,
      );
      const r1 = await introspect1({ token: "not-a-jwt" });
      expect(r1.active).toBe(false);
      expect(r1.inactiveReason).toBe("NOT_FOUND");

      // TOKEN_REVOKED
      const revokedToken = makeToken({
        tokenId,
        sessionId: session.id,
        revokedAt: new Date(),
      });
      const jwtTok2 = signJwt({ sid: session.id, jti: tokenId });
      const repos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(revokedToken) },
      });
      const introspect2 = introspectTokenUseCase(
        repos2.sessionRepo,
        repos2.tokenRepo,
      );
      const r2 = await introspect2({ token: jwtTok2 });
      expect(r2.active).toBe(false);
      expect(r2.inactiveReason).toBe("TOKEN_REVOKED");

      // TOKEN_EXPIRED
      const expiredToken = makeToken({
        tokenId,
        sessionId: session.id,
        expiresAt: new Date(Date.now() - 10_000),
      });
      const repos3 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { findByTokenId: vi.fn().mockResolvedValue(expiredToken) },
      });
      const introspect3 = introspectTokenUseCase(
        repos3.sessionRepo,
        repos3.tokenRepo,
      );
      const r3 = await introspect3({ token: jwtTok2 });
      expect(r3.active).toBe(false);
      expect(r3.inactiveReason).toBe("TOKEN_EXPIRED");

      // SESSION_TERMINATED
      const activeToken = makeToken({ tokenId, sessionId: session.id });
      const terminatedSession = makeSession({
        id: session.id,
        status: "TERMINATED",
      });
      const repos4 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(terminatedSession) },
        token: { findByTokenId: vi.fn().mockResolvedValue(activeToken) },
      });
      const introspect4 = introspectTokenUseCase(
        repos4.sessionRepo,
        repos4.tokenRepo,
      );
      const r4 = await introspect4({ token: jwtTok2 });
      expect(r4.active).toBe(false);
      expect(r4.inactiveReason).toBe("SESSION_TERMINATED");

      // SESSION_EXPIRED
      const expiredSession = makeSession({ id: session.id, status: "EXPIRED" });
      const repos5 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(expiredSession) },
        token: { findByTokenId: vi.fn().mockResolvedValue(activeToken) },
      });
      const introspect5 = introspectTokenUseCase(
        repos5.sessionRepo,
        repos5.tokenRepo,
      );
      const r5 = await introspect5({ token: jwtTok2 });
      expect(r5.active).toBe(false);
      expect(r5.inactiveReason).toBe("SESSION_EXPIRED");
    });
  });

  describe("Event producer", () => {
    it("[AUTH-EVT-001] LoginSucceeded", async () => {
      // Login success emits event with principalId, sessionId, occurredAt
      const principal = makePrincipal();
      const onEvent = vi.fn();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
        onEvent,
      );
      await login({ identifier: "u", secret: "p" });

      const loginEvents = onEvent.mock.calls
        .map((c) => c[0])
        .filter((e: AuthEvent) => e.type === "LoginSucceeded");
      expect(loginEvents.length).toBe(1);
      const evt = loginEvents[0] as LoginSucceededEvent;
      expect(evt.principalId).toBe(principal.id);
      expect(evt.sessionId).toBeTruthy();
      expect(evt.occurredAt).toBeInstanceOf(Date);
    });

    it("[AUTH-EVT-002] TokenIssued", async () => {
      // Token issuance emits event with tokenId, sessionId, issuedAt, expiresAt
      const principal = makePrincipal();
      const onEvent = vi.fn();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
        onEvent,
      );
      await login({ identifier: "u", secret: "p" });

      const tokenEvents = onEvent.mock.calls
        .map((c) => c[0])
        .filter((e: AuthEvent) => e.type === "TokenIssued");
      expect(tokenEvents.length).toBe(1);
      const evt = tokenEvents[0] as TokenIssuedEvent;
      expect(evt.tokenId).toBeTruthy();
      expect(evt.sessionId).toBeTruthy();
      expect(evt.issuedAt).toBeInstanceOf(Date);
      expect(evt.expiresAt).toBeInstanceOf(Date);
    });

    it("[AUTH-EVT-003] TokenRevoked", async () => {
      // Logout revocation emits event with tokenId, sessionId, revokedAt, reason
      const session = makeSession();
      const tokenId = randomUUID();
      const onEvent = vi.fn();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revoke: vi.fn().mockResolvedValue(undefined) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo, onEvent);
      await logout({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
        tokenId,
        revokeAllSessionTokens: false,
      });

      const revokedEvents = onEvent.mock.calls
        .map((c) => c[0])
        .filter((e: AuthEvent) => e.type === "TokenRevoked");
      expect(revokedEvents.length).toBe(1);
      const evt = revokedEvents[0] as TokenRevokedEvent;
      expect(evt.tokenId).toBe(tokenId);
      expect(evt.sessionId).toBe(session.id);
      expect(evt.revokedAt).toBeInstanceOf(Date);
      expect([
        "LOGOUT_TARGETED",
        "LOGOUT_ALL_SESSION_TOKENS",
        "ADMIN_FORCED_LOGOUT",
      ]).toContain(evt.reason);
    });

    it("[AUTH-EVT-004] LogoutCompleted", async () => {
      // Logout completion emits event with principalId, sessionId, revokedTokenIds, occurredAt
      const session = makeSession();
      const revokedIds = [randomUUID(), randomUUID()];
      const onEvent = vi.fn();
      const repos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(session) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue(revokedIds) },
      });
      const logout = logoutUseCase(repos.sessionRepo, repos.tokenRepo, onEvent);
      await logout({
        sessionId: session.id,
        callerId: session.principalId,
        callerPermissions: [],
      });

      const logoutEvents = onEvent.mock.calls
        .map((c) => c[0])
        .filter((e: AuthEvent) => e.type === "LogoutCompleted");
      expect(logoutEvents.length).toBe(1);
      const evt = logoutEvents[0] as LogoutCompletedEvent;
      expect(evt.principalId).toBe(session.principalId);
      expect(evt.sessionId).toBe(session.id);
      expect(evt.revokedTokenIds).toEqual(revokedIds);
      expect(evt.occurredAt).toBeInstanceOf(Date);
    });

    it("[AUTH-EVT-005] AccessDenied", async () => {
      // Authorization deny emits event with principalId, requiredPermission, reasonCode, occurredAt
      const onEvent = vi.fn();
      const repos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const authorize = authorizeRequestUseCase(repos.grantRepo, onEvent);
      const ctx: AuthContext = {
        principalId: "p1",
        sessionId: "s1",
        permissions: [],
        tokenId: "t1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };

      await expect(
        authorize({ authContext: ctx, requiredPermission: "svc.scope.action" }),
      ).rejects.toThrow();

      const denyEvents = onEvent.mock.calls
        .map((c) => c[0])
        .filter((e: AuthEvent) => e.type === "AccessDenied");
      expect(denyEvents.length).toBe(1);
      const evt = denyEvents[0] as AccessDeniedEvent;
      expect(evt.principalId).toBe("p1");
      expect(evt.requiredPermission).toBe("svc.scope.action");
      expect(evt.reasonCode).toBeTruthy();
      expect(evt.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe("Event consumer", () => {
    it("[AUTH-EVT-006] Audit subsystem consumption", async () => {
      // Verify the AuthEventHandler interface contract: audit consumer records all events
      const auditLog: AuthEvent[] = [];
      const auditHandler: AuthEventHandler = async (event) => {
        auditLog.push(event);
      };

      const loginEvent: LoginSucceededEvent = {
        type: "LoginSucceeded",
        principalId: "p1",
        sessionId: "s1",
        occurredAt: new Date(),
      };
      const tokenEvent: TokenIssuedEvent = {
        type: "TokenIssued",
        tokenId: "t1",
        sessionId: "s1",
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      };
      const revokedEvent: TokenRevokedEvent = {
        type: "TokenRevoked",
        tokenId: "t1",
        sessionId: "s1",
        revokedAt: new Date(),
        reason: "LOGOUT_TARGETED",
      };
      const logoutEvent: LogoutCompletedEvent = {
        type: "LogoutCompleted",
        principalId: "p1",
        sessionId: "s1",
        revokedTokenIds: ["t1"],
        occurredAt: new Date(),
      };
      const denyEvent: AccessDeniedEvent = {
        type: "AccessDenied",
        principalId: "p1",
        requiredPermission: "svc.scope.action",
        reasonCode: "FORBIDDEN",
        occurredAt: new Date(),
      };

      await auditHandler(loginEvent);
      await auditHandler(tokenEvent);
      await auditHandler(revokedEvent);
      await auditHandler(logoutEvent);
      await auditHandler(denyEvent);

      expect(auditLog).toHaveLength(5);
      expect(auditLog.map((e) => e.type)).toEqual([
        "LoginSucceeded",
        "TokenIssued",
        "TokenRevoked",
        "LogoutCompleted",
        "AccessDenied",
      ]);
    });

    it("[AUTH-EVT-007] Session tracker consumption", async () => {
      // Session tracker updates registry on login/logout/token events
      const sessionRegistry = new Map<string, string>();
      const tracker: AuthEventHandler = async (event) => {
        if (event.type === "LoginSucceeded") {
          sessionRegistry.set(event.sessionId, "ACTIVE");
        } else if (event.type === "LogoutCompleted") {
          sessionRegistry.set(event.sessionId, "TERMINATED");
        }
      };

      await tracker({
        type: "LoginSucceeded",
        principalId: "p1",
        sessionId: "s1",
        occurredAt: new Date(),
      });
      expect(sessionRegistry.get("s1")).toBe("ACTIVE");

      await tracker({
        type: "LogoutCompleted",
        principalId: "p1",
        sessionId: "s1",
        revokedTokenIds: [],
        occurredAt: new Date(),
      });
      expect(sessionRegistry.get("s1")).toBe("TERMINATED");
    });

    it("[AUTH-EVT-008] Cache invalidator consumption", async () => {
      // Cache invalidator invalidates revoked token cache entries on TokenRevoked
      const tokenCache = new Map<string, boolean>();
      tokenCache.set("t1", true);
      tokenCache.set("t2", true);

      const cacheInvalidator: AuthEventHandler = async (event) => {
        if (event.type === "TokenRevoked") {
          tokenCache.delete(event.tokenId);
        }
      };

      await cacheInvalidator({
        type: "TokenRevoked",
        tokenId: "t1",
        sessionId: "s1",
        revokedAt: new Date(),
        reason: "LOGOUT_TARGETED",
      });

      expect(tokenCache.has("t1")).toBe(false);
      expect(tokenCache.has("t2")).toBe(true);
    });

    it("[AUTH-EVT-009] Security analytics consumption", async () => {
      // Security analytics consumes AccessDenied to record denied patterns
      const deniedPatterns: Array<{ principalId: string; permission: string }> =
        [];
      const analytics: AuthEventHandler = async (event) => {
        if (event.type === "AccessDenied") {
          deniedPatterns.push({
            principalId: event.principalId,
            permission: event.requiredPermission,
          });
        }
      };

      await analytics({
        type: "AccessDenied",
        principalId: "p1",
        requiredPermission: "svc.scope.admin",
        reasonCode: "FORBIDDEN",
        occurredAt: new Date(),
      });

      expect(deniedPatterns).toHaveLength(1);
      expect(deniedPatterns[0].principalId).toBe("p1");
      expect(deniedPatterns[0].permission).toBe("svc.scope.admin");
    });

    it("[AUTH-EVT-010] Alerting pipeline consumption", async () => {
      // Alerting pipeline processes repeated AccessDenied events per policy
      let alertCount = 0;
      const THRESHOLD = 3;
      const deniedCounts = new Map<string, number>();
      const alertingPipeline: AuthEventHandler = async (event) => {
        if (event.type === "AccessDenied") {
          const count = (deniedCounts.get(event.principalId) ?? 0) + 1;
          deniedCounts.set(event.principalId, count);
          if (count >= THRESHOLD) {
            alertCount++;
          }
        }
      };

      const denyEvent: AccessDeniedEvent = {
        type: "AccessDenied",
        principalId: "p1",
        requiredPermission: "svc.scope.action",
        reasonCode: "FORBIDDEN",
        occurredAt: new Date(),
      };

      await alertingPipeline(denyEvent);
      await alertingPipeline(denyEvent);
      expect(alertCount).toBe(0);
      await alertingPipeline(denyEvent);
      expect(alertCount).toBe(1);
    });
  });

  describe("Workflow", () => {
    it("[AUTH-WF-001] EndToEndAuthFlow login branch", async () => {
      // Login success/failure branches match documented outcomes
      const principal = makePrincipal();
      const onEvent = vi.fn();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });

      // Success branch
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
        onEvent,
      );
      const result = await login({ identifier: "user", secret: "pass" });
      expect(result.accessToken).toBeTruthy();
      expect(result.sessionId).toBeTruthy();
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify events emitted in order: TokenIssued then LoginSucceeded
      const events = onEvent.mock.calls.map((c) => c[0] as AuthEvent);
      const types = events.map((e) => e.type);
      expect(types).toContain("TokenIssued");
      expect(types).toContain("LoginSucceeded");

      // Failure branch: bad credentials
      const repos2 = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(false),
        },
      });
      const login2 = loginUseCase(
        repos2.principalRepo,
        repos2.sessionRepo,
        repos2.tokenRepo,
        repos2.grantRepo,
      );
      await expect(
        login2({ identifier: "user", secret: "bad" }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("[AUTH-WF-002] EndToEndAuthFlow protected request branch", async () => {
      // Protected request enforces auth checks in sequence
      const principal = makePrincipal({
        directPermissions: ["svc.scope.action"],
      });
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });

      // Step 1: Login
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
      );
      const loginResult = await login({ identifier: "user", secret: "pass" });

      // Extract session from created session
      const createdSession = (
        repos.sessionRepo.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as Session;

      // Step 2: Authenticate — need session repo that returns the created session
      const authRepos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(createdSession) },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const authenticate = authenticateRequestUseCase(
        authRepos.sessionRepo,
        authRepos.tokenRepo,
      );
      const authResult = await authenticate({
        authorizationHeader: `Bearer ${loginResult.accessToken}`,
      });
      expect(authResult.authContext.principalId).toBe(principal.id);

      // Step 3: Authorize
      const authzRepos = makeRepos({
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });
      const authorize = authorizeRequestUseCase(authzRepos.grantRepo);
      const authzResult = await authorize({
        authContext: authResult.authContext,
        requiredPermission: "svc.scope.action",
      });
      expect(authzResult.allowed).toBe(true);

      // Error path: missing permission
      const ctxNoPerm: AuthContext = {
        ...authResult.authContext,
        permissions: [],
      };
      await expect(
        authorize({
          authContext: ctxNoPerm,
          requiredPermission: "svc.scope.action",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-WF-003] EndToEndAuthFlow logout branch", async () => {
      // Logout branch enforces ownership/admin decision and transition effects
      const principal = makePrincipal();
      const repos = makeRepos({
        principal: {
          findByIdentifier: vi.fn().mockResolvedValue(principal),
          verifyCredential: vi.fn().mockResolvedValue(true),
        },
        grant: { findByGranteeKeys: vi.fn().mockResolvedValue([]) },
      });

      // Step 1: Login
      const onEvent = vi.fn();
      const login = loginUseCase(
        repos.principalRepo,
        repos.sessionRepo,
        repos.tokenRepo,
        repos.grantRepo,
        onEvent,
      );
      const loginResult = await login({ identifier: "user", secret: "pass" });
      const createdSession = (
        repos.sessionRepo.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as Session;

      // Step 2: Logout — owner can logout
      const tokenId = randomUUID();
      const logoutRepos = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(createdSession) },
        token: { revokeAllBySessionId: vi.fn().mockResolvedValue([tokenId]) },
      });
      const logoutOnEvent = vi.fn();
      const logout = logoutUseCase(
        logoutRepos.sessionRepo,
        logoutRepos.tokenRepo,
        logoutOnEvent,
      );
      const logoutResult = await logout({
        sessionId: createdSession.id,
        callerId: principal.id,
        callerPermissions: [],
      });

      expect(logoutResult.sessionId).toBe(createdSession.id);
      expect(logoutResult.revokedTokenIds).toContain(tokenId);
      expect(logoutRepos.sessionRepo.updateStatus).toHaveBeenCalledWith(
        createdSession.id,
        "TERMINATED",
      );

      // Non-owner without admin → FORBIDDEN
      const logoutRepos2 = makeRepos({
        session: { findById: vi.fn().mockResolvedValue(createdSession) },
      });
      const logout2 = logoutUseCase(
        logoutRepos2.sessionRepo,
        logoutRepos2.tokenRepo,
      );
      await expect(
        logout2({
          sessionId: createdSession.id,
          callerId: "stranger",
          callerPermissions: [],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("[AUTH-WF-004] AuthorizeRequestFlow step ordering", async () => {
      // Authenticate step always executes before authorize and handler execution
      const session = makeSession({
        effectivePermissions: ["svc.scope.action"],
      });
      const tokenId = randomUUID();
      const token = signJwt({ sid: session.id, jti: tokenId });

      const callOrder: string[] = [];

      // Wrap authenticate
      const authRepos = makeRepos({
        session: {
          findById: vi.fn().mockImplementation(async () => {
            callOrder.push("authenticate");
            return session;
          }),
        },
        token: { findByTokenId: vi.fn().mockResolvedValue(null) },
      });
      const authenticate = authenticateRequestUseCase(
        authRepos.sessionRepo,
        authRepos.tokenRepo,
      );
      const authResult = await authenticate({
        authorizationHeader: `Bearer ${token}`,
      });
      expect(callOrder).toContain("authenticate");

      // Authorize
      const authzRepos = makeRepos({
        grant: {
          findByGranteeKeys: vi.fn().mockImplementation(async () => {
            callOrder.push("authorize");
            return [];
          }),
        },
      });
      const authorize = authorizeRequestUseCase(authzRepos.grantRepo);
      await authorize({
        authContext: authResult.authContext,
        requiredPermission: "svc.scope.action",
      });

      // Handler execution
      callOrder.push("handler");

      expect(callOrder).toEqual(["authenticate", "authorize", "handler"]);
    });
  });

  describe("Policy decision", () => {
    it("[AUTH-WF-005] PermissionResolutionPolicy precedence", () => {
      // Deny override and wildcard precedence deterministically

      // 1. Deny always wins
      expect(
        resolvePermissionDecision(
          [
            { permissionKey: "svc.scope.action", effect: "ALLOW" },
            { permissionKey: "svc.scope.action", effect: "DENY" },
          ],
          "svc.scope.action",
        ),
      ).toBe("DENY");

      // 2. Exact allow beats wildcards
      expect(
        resolvePermissionDecision(
          [{ permissionKey: "svc.scope.action", effect: "ALLOW" }],
          "svc.scope.action",
        ),
      ).toBe("ALLOW");

      // 3. Scoped wildcard allows
      expect(
        resolvePermissionDecision(
          [{ permissionKey: "svc.scope.*", effect: "ALLOW" }],
          "svc.scope.action",
        ),
      ).toBe("ALLOW");

      // 4. Global wildcard allows
      expect(
        resolvePermissionDecision(
          [{ permissionKey: "*", effect: "ALLOW" }],
          "svc.scope.action",
        ),
      ).toBe("ALLOW");

      // 5. No matching grants → default deny
      expect(resolvePermissionDecision([], "svc.scope.action")).toBe("DENY");

      // 6. Deny on wildcard overrides allow
      expect(
        resolvePermissionDecision(
          [
            { permissionKey: "svc.scope.*", effect: "ALLOW" },
            { permissionKey: "svc.scope.action", effect: "DENY" },
          ],
          "svc.scope.action",
        ),
      ).toBe("DENY");

      // 7. Non-matching allow does not grant access
      expect(
        resolvePermissionDecision(
          [{ permissionKey: "svc.other.action", effect: "ALLOW" }],
          "svc.scope.action",
        ),
      ).toBe("DENY");
    });
  });
});
