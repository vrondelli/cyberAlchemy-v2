import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthValidationError } from "../../../domain/auth-access-control/auth.errors";

const mocked = vi.hoisted(() => {
  return {
    loginUseCase: vi.fn(),
    issueAccessTokenUseCase: vi.fn(),
    logoutUseCase: vi.fn(),
    introspectTokenUseCase: vi.fn(),
    getPermissionCatalogUseCase: vi.fn(),
    loginHandler: vi.fn(),
    issueTokenHandler: vi.fn(),
    logoutHandler: vi.fn(),
    introspectHandler: vi.fn(),
    catalogHandler: vi.fn(),
    ensureAuthenticated: vi.fn(),
    requirePermission: vi.fn(),
    createDrizzlePrincipalRepository: vi.fn(() => ({})),
    createDrizzleSessionRepository: vi.fn(() => ({})),
    createDrizzleTokenRepository: vi.fn(() => ({})),
    createDrizzlePermissionGrantRepository: vi.fn(() => ({})),
  };
});

vi.mock("../../../use-cases/auth-access-control/login", () => ({
  loginUseCase: mocked.loginUseCase,
  issueAccessTokenUseCase: mocked.issueAccessTokenUseCase,
}));

vi.mock("../../../use-cases/auth-access-control/logout", () => ({
  logoutUseCase: mocked.logoutUseCase,
}));

vi.mock("../../../use-cases/auth-access-control/introspect-token", () => ({
  introspectTokenUseCase: mocked.introspectTokenUseCase,
}));

vi.mock("../../../use-cases/auth-access-control/get-permission-catalog", () => ({
  getPermissionCatalogUseCase: mocked.getPermissionCatalogUseCase,
}));

vi.mock("../auth/auth.guard", () => ({
  ensureAuthenticated: mocked.ensureAuthenticated,
  requirePermission: mocked.requirePermission,
}));

vi.mock("../../repositories/drizzle-auth.repository", () => ({
  createDrizzlePrincipalRepository: mocked.createDrizzlePrincipalRepository,
  createDrizzleSessionRepository: mocked.createDrizzleSessionRepository,
  createDrizzleTokenRepository: mocked.createDrizzleTokenRepository,
  createDrizzlePermissionGrantRepository:
    mocked.createDrizzlePermissionGrantRepository,
}));

import { authRoutes } from "./auth.routes";

describe("auth routes contract", () => {
  const createApp = async () => {
    const app = Fastify();
    await app.register(authRoutes, { prefix: "/auth" });
    return app;
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();

    mocked.loginUseCase.mockReturnValue(mocked.loginHandler);
    mocked.issueAccessTokenUseCase.mockReturnValue(mocked.issueTokenHandler);
    mocked.logoutUseCase.mockReturnValue(mocked.logoutHandler);
    mocked.introspectTokenUseCase.mockReturnValue(mocked.introspectHandler);
    mocked.getPermissionCatalogUseCase.mockReturnValue(mocked.catalogHandler);

    mocked.ensureAuthenticated.mockImplementation(async (request: any) => {
      request.authUserData = {
        userId: "principal-1",
        permissions: ["auth-access-control.admin.*"],
        sessionId: "sid-auth-1",
        tokenId: "token-auth-1",
      };
    });
    mocked.requirePermission.mockImplementation(
      () => async () => undefined,
    );

    mocked.loginHandler.mockResolvedValue({
      accessToken: "access-token-1",
      expiresAt: new Date("2026-04-24T16:00:00.000Z"),
      sessionId: "sid-login-1",
    });
    mocked.issueTokenHandler.mockResolvedValue({
      accessToken: "access-token-2",
      expiresAt: new Date("2026-04-24T17:00:00.000Z"),
      tokenId: "token-2",
    });
    mocked.logoutHandler.mockResolvedValue(undefined);
    mocked.introspectHandler.mockResolvedValue({
      active: true,
      principalId: "principal-1",
      exp: 1_715_000_000,
      iat: 1_714_999_000,
      scopes: [],
    });
    mocked.catalogHandler.mockResolvedValue({ permissions: [] });
  });

  it("POST /auth/login returns 422 when identifier or secret is missing", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {},
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Missing identifier or secret",
    });
    await app.close();
  });

  it("POST /auth/login returns 200 with the contract response payload", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        identifier: "user@test.com",
        secret: "password",
        context: {
          ipReputation: "UNKNOWN",
          failedAttemptsLast15m: 0,
          hasUserAgent: true,
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      accessToken: "access-token-1",
      expiresAt: "2026-04-24T16:00:00.000Z",
      sessionId: "sid-login-1",
    });
    await app.close();
  });

  it("POST /auth/login returns 401 for INVALID_CREDENTIALS", async () => {
    const app = await createApp();
    mocked.loginHandler.mockRejectedValueOnce(
      new AuthValidationError("INVALID_CREDENTIALS", "Invalid credentials"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        identifier: "user@test.com",
        secret: "wrong",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
    });
    await app.close();
  });

  it("POST /auth/login returns 403 for FORBIDDEN abuse denials", async () => {
    const app = await createApp();
    mocked.loginHandler.mockRejectedValueOnce(
      new AuthValidationError(
        "FORBIDDEN",
        "Login denied: too many failed attempts",
      ),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        identifier: "user@test.com",
        secret: "password",
        context: {
          ipReputation: "UNKNOWN",
          failedAttemptsLast15m: 5,
          hasUserAgent: true,
        },
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
      message: "Login denied: too many failed attempts",
    });
    await app.close();
  });

  it("POST /auth/logout returns 200 on success", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });

  it("POST /auth/logout returns 403 on ownership denial", async () => {
    const app = await createApp();
    mocked.logoutHandler.mockRejectedValueOnce(
      new AuthValidationError("FORBIDDEN", "Cannot logout target session"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: {},
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
      message: "Cannot logout target session",
    });
    await app.close();
  });

  it("GET /auth/introspect returns 422 when token query is missing", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "GET",
      url: "/auth/introspect",
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Missing token query parameter",
    });
    await app.close();
  });

  it("GET /auth/introspect returns 200 with introspection payload", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "GET",
      url: "/auth/introspect?token=jwt-token",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      active: true,
      principalId: "principal-1",
      exp: 1_715_000_000,
      iat: 1_714_999_000,
      scopes: [],
    });
    await app.close();
  });
});
