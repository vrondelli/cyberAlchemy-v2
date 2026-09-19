import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const mocked = vi.hoisted(() => {
  return {
    createPlayerUseCase: vi.fn(),
    getAllPlayersUseCase: vi.fn(),
    getPlayersOverviewUseCase: vi.fn(),
    checkProgressionUseCase: vi.fn(),
    createHandler: vi.fn(),
    getAllHandler: vi.fn(),
    getOverviewHandler: vi.fn(),
    checkProgressionHandler: vi.fn(),
    drizzlePlayerRepository: {},
    drizzlePlayerStatsRepository: {},
  };
});

vi.mock("../../../use-cases/player/create-player", () => ({
  createPlayerUseCase: mocked.createPlayerUseCase,
}));

vi.mock("../../../use-cases/player/get-all-players", () => ({
  getAllPlayersUseCase: mocked.getAllPlayersUseCase,
}));

vi.mock("../../../use-cases/player/get-players-overview", () => ({
  getPlayersOverviewUseCase: mocked.getPlayersOverviewUseCase,
}));

vi.mock("../../../use-cases/progression/check-progression", () => ({
  checkProgressionUseCase: mocked.checkProgressionUseCase,
}));

vi.mock("../../repositories/drizzle-player.repository", () => ({
  drizzlePlayerRepository: mocked.drizzlePlayerRepository,
}));

vi.mock("../../repositories/drizzle-player-stats.repository", () => ({
  drizzlePlayerStatsRepository: mocked.drizzlePlayerStatsRepository,
}));

import { playerRoutes } from "./player.routes";

describe("player routes contract", () => {
  const signToken = (sid: string) =>
    jwt.sign({ sid, jti: `${sid}-token` }, "test-secret");

  const registerSession = (sid: string, permissions: string[]) => {
    upsertAuthSession({
      id: sid,
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: permissions,
    });
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
    clearAuthSessions();

    mocked.createPlayerUseCase.mockReturnValue(mocked.createHandler);
    mocked.getAllPlayersUseCase.mockReturnValue(mocked.getAllHandler);
    mocked.getPlayersOverviewUseCase.mockReturnValue(mocked.getOverviewHandler);
    mocked.checkProgressionUseCase.mockReturnValue(
      mocked.checkProgressionHandler,
    );

    mocked.createHandler.mockResolvedValue({ id: "p1" });
    mocked.getAllHandler.mockResolvedValue([{ id: "p1" }]);
    mocked.getOverviewHandler.mockResolvedValue([{ id: "p1" }]);
    mocked.checkProgressionHandler.mockResolvedValue({ period: "BI_WEEKLY" });
  });

  it("POST /players returns 401 without JWT", async () => {
    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      payload: { name: "P1", email: "p1@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("POST /players returns 403 when permission is missing", async () => {
    registerSession("sid-post-missing", [
      "player-management.read.getAllPlayers",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-post-missing")}`,
      },
      payload: { name: "P1", email: "p1@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("POST /players returns 201 and player body", async () => {
    registerSession("sid-post-ok", ["player-management.write.createPlayer"]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      payload: {
        name: "Player One",
        email: "p1@test.com",
        currentLimit: "NL20",
      },
      headers: {
        authorization: `Bearer ${signToken("sid-post-ok")}`,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id: "p1" });
    await app.close();
  });

  it("POST /players returns 400 with standardized payload", async () => {
    registerSession("sid-post-validation", [
      "player-management.write.createPlayer",
    ]);

    mocked.createHandler.mockRejectedValue(
      Object.assign(new Error("Name is required"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        details: { field: "name" },
      }),
    );

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-post-validation")}`,
      },
      payload: { name: "", email: "p1@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Name is required",
      details: { field: "name" },
    });
    await app.close();
  });

  it("POST /players returns 409 on duplicate email", async () => {
    registerSession("sid-post-dup", ["player-management.write.createPlayer"]);

    mocked.createHandler.mockRejectedValue(
      Object.assign(new Error("Player email already exists"), {
        statusCode: 409,
        code: "DUPLICATE_EMAIL",
      }),
    );

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "POST",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-post-dup")}`,
      },
      payload: { name: "P1", email: "p1@test.com", currentLimit: "NL20" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: "DUPLICATE_EMAIL" });
    await app.close();
  });

  it("GET /players returns 200 and array body", async () => {
    registerSession("sid-get-all", ["player-management.read.getAllPlayers"]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players",
      headers: {
        authorization: `Bearer ${signToken("sid-get-all")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "p1" }]);
    await app.close();
  });

  it("GET /players/overview returns 200 and overview array", async () => {
    registerSession("sid-overview", [
      "player-management.read.getPlayersOverview",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/overview",
      headers: {
        authorization: `Bearer ${signToken("sid-overview")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "p1" }]);
    await app.close();
  });

  it("GET /players/:id/progression returns 200 and progression payload", async () => {
    registerSession("sid-progression", [
      "player-management.read.getPlayerProgression",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/progression",
      headers: {
        authorization: `Bearer ${signToken("sid-progression")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ period: "BI_WEEKLY" });
    await app.close();
  });

  it("GET /players/:id/progression maps period=MONTHLY to 30 days", async () => {
    registerSession("sid-progression-monthly", [
      "player-management.read.getPlayerProgression",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    await app.inject({
      method: "GET",
      url: "/players/p1/progression?period=MONTHLY",
      headers: {
        authorization: `Bearer ${signToken("sid-progression-monthly")}`,
      },
    });

    expect(mocked.checkProgressionHandler).toHaveBeenCalledWith("p1", 30);
    await app.close();
  });

  it("GET /players/:id/progression returns 400 for invalid period query", async () => {
    registerSession("sid-progression-invalid", [
      "player-management.read.getPlayerProgression",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/progression?period=WEEKLY",
      headers: {
        authorization: `Bearer ${signToken("sid-progression-invalid")}`,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocked.checkProgressionHandler).not.toHaveBeenCalled();
    await app.close();
  });

  it("GET /players/:id/progression returns 404 for unknown player", async () => {
    registerSession("sid-progression-404", [
      "player-management.read.getPlayerProgression",
    ]);

    mocked.checkProgressionHandler.mockRejectedValue(
      new Error("Player not found"),
    );

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/progression",
      headers: {
        authorization: `Bearer ${signToken("sid-progression-404")}`,
      },
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});
