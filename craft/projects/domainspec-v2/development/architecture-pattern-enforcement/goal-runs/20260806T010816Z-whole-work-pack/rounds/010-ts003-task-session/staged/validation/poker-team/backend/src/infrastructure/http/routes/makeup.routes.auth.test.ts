import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import jwt from "jsonwebtoken";
import { buildApp } from "../app";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const visibilityMocked = vi.hoisted(() => {
  return {
    resolvePlayerVisibility: vi.fn(),
    resolver: vi.fn(),
  };
});

vi.mock("../../../domain/coach/player-visibility.service", () => ({
  resolvePlayerVisibility: visibilityMocked.resolvePlayerVisibility,
}));

describe("makeup routes auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    app = await buildApp();
  });

  beforeEach(() => {
    clearAuthSessions();
    vi.clearAllMocks();

    // By default: visibility returns only the actor's own ID
    // Tests override per case
    visibilityMocked.resolvePlayerVisibility.mockReturnValue(
      visibilityMocked.resolver,
    );
    visibilityMocked.resolver.mockImplementation(
      async (input: {
        actorPrincipalId: string;
        actorPermissions: string[];
      }) => {
        // Admin/manager with manageMakeup → sees all requested IDs
        if (
          input.actorPermissions.includes("player-makeup.write.manageMakeup")
        ) {
          return [
            "player-1",
            "player-A",
            "player-B",
            "any-player-id",
            "non-existent-id",
          ];
        }
        // Player → only self
        return [input.actorPrincipalId];
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("blocks request without bearer token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/players/non-existent-id/makeup",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "AUTH_REQUIRED",
      message: "Missing bearer token",
    });
  });

  it("blocks request with invalid token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/players/non-existent-id/makeup",
      headers: {
        authorization: "Bearer invalid-token",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "INVALID_TOKEN",
      message: "Invalid bearer token",
    });
  });

  it("blocks authenticated user without admin wildcard permission", async () => {
    upsertAuthSession({
      id: "sid-no-makeup-read",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["players:read"],
    });

    const token = jwt.sign(
      { sid: "sid-no-makeup-read", jti: "jti-1" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/non-existent-id/makeup",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
      message: "Missing required permission",
      details: {
        required: "player-makeup.read.viewMakeup",
      },
    });
  });

  it("allows manager role to read makeup state", async () => {
    upsertAuthSession({
      id: "sid-manager-read",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: [
        "player-makeup.read.viewMakeup",
        "player-makeup.write.manageMakeup",
      ],
    });

    const token = jwt.sign(
      { sid: "sid-manager-read", jti: "jti-2" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/non-existent-id/makeup",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).not.toBe(401);
    expect(response.statusCode).not.toBe(403);
  });

  it("allows player role to read makeup state", async () => {
    upsertAuthSession({
      id: "sid-player-read",
      principalId: "player-1",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.read.viewMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-player-read", jti: "jti-3" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/player-1/makeup",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).not.toBe(401);
    expect(response.statusCode).not.toBe(403);
  });

  it("blocks player role from manual makeup adjustment", async () => {
    upsertAuthSession({
      id: "sid-player-no-write",
      principalId: "player-1",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.read.viewMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-player-no-write", jti: "jti-4" },
      "test-secret",
    );

    const response = await app.inject({
      method: "PATCH",
      url: "/players/non-existent-id/makeup",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        operation: "increase",
        amount: 10,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
      details: {
        required: "player-makeup.write.manageMakeup",
      },
    });
  });

  it("allows manager role to attempt manual makeup adjustment", async () => {
    upsertAuthSession({
      id: "sid-manager-write",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.write.manageMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-manager-write", jti: "jti-5" },
      "test-secret",
    );

    const response = await app.inject({
      method: "PATCH",
      url: "/players/non-existent-id/makeup",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        operation: "increase",
        amount: 10,
      },
    });

    expect(response.statusCode).not.toBe(401);
    expect(response.statusCode).not.toBe(403);
  });

  // PMK-AUTH-001: Player self-only visibility
  it("blocks player from reading another player's makeup", async () => {
    upsertAuthSession({
      id: "sid-player-other",
      principalId: "player-A",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.read.viewMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-player-other", jti: "jti-auth1" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/player-B/makeup",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  // PMK-AUTH-001: Player self-only visibility (history)
  it("blocks player from reading another player's makeup history", async () => {
    upsertAuthSession({
      id: "sid-player-other-hist",
      principalId: "player-A",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.read.viewMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-player-other-hist", jti: "jti-auth2" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/player-B/makeup/history",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  // PMK-AUTH-002: Manager/admin cross-player visibility
  it("allows manager to read any player's makeup", async () => {
    upsertAuthSession({
      id: "sid-manager-cross",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: [
        "player-makeup.read.viewMakeup",
        "player-makeup.write.manageMakeup",
      ],
    });

    const token = jwt.sign(
      { sid: "sid-manager-cross", jti: "jti-auth3" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/any-player-id/makeup",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).not.toBe(401);
    expect(response.statusCode).not.toBe(403);
  });

  // PMK-AUTH-002: Manager cross-player history
  it("allows manager to read any player's makeup history", async () => {
    upsertAuthSession({
      id: "sid-manager-cross-hist",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: [
        "player-makeup.read.viewMakeup",
        "player-makeup.write.manageMakeup",
      ],
    });

    const token = jwt.sign(
      { sid: "sid-manager-cross-hist", jti: "jti-auth4" },
      "test-secret",
    );

    const response = await app.inject({
      method: "GET",
      url: "/players/any-player-id/makeup/history",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).not.toBe(401);
    expect(response.statusCode).not.toBe(403);
  });
});
