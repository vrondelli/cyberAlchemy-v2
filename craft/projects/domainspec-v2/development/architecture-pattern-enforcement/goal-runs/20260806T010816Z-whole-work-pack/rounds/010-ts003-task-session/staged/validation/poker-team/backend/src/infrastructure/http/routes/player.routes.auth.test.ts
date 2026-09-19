import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { buildApp } from "../app";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

describe("player routes auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const signToken = (sid: string) =>
    jwt.sign({ sid, jti: `${sid}-token` }, "test-secret");

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    app = await buildApp();
  });

  beforeEach(() => {
    clearAuthSessions();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /players returns 401 without token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/players",
      payload: { name: "A", email: "a@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("POST /players returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-read-only",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-read-only")}`,
      },
      payload: { name: "A", email: "a@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("GET /players returns 401 without token", async () => {
    const response = await app.inject({ method: "GET", url: "/players" });
    expect(response.statusCode).toBe(401);
  });

  it("GET /players returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-write-only",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.write.createPlayer"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-write-only")}`,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it("GET /players/overview returns 401 without token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/players/overview",
    });
    expect(response.statusCode).toBe(401);
  });

  it("GET /players/overview returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-overview-missing",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/players/overview",
      headers: {
        authorization: `Bearer ${signToken("sid-overview-missing")}`,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it("GET /players/:id/progression returns 401 without token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/players/p1/progression",
    });
    expect(response.statusCode).toBe(401);
  });

  it("GET /players/:id/progression returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-progression-missing",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getPlayersOverview"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/progression",
      headers: {
        authorization: `Bearer ${signToken("sid-progression-missing")}`,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it("returns 401 when sid claim is missing", async () => {
    const token = jwt.sign({ sub: "user-1" }, "test-secret");

    const response = await app.inject({
      method: "GET",
      url: "/players",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("returns 403 when sid resolves to inactive session", async () => {
    upsertAuthSession({
      id: "sid-inactive",
      principalId: "user-1",
      status: "TERMINATED",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-inactive")}`,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "AUTH_REQUIRED" });
  });
});
