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

describe("player routes", () => {
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
    mocked.getOverviewHandler.mockResolvedValue([
      { id: "p1", lifetimeProfit: 100, periodDays: 30 },
    ]);
    mocked.checkProgressionHandler.mockResolvedValue({
      eligibleForPromotion: false,
      reason: "insufficient sample",
      avgHands: 500,
      winrate: 2,
      period: "BI_WEEKLY",
    });
  });

  it("POST /players returns 201 with created player", async () => {
    registerSession("sid-post-created", [
      "player-management.write.createPlayer",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const payload = {
      name: "Player One",
      email: "p1@test.com",
      currentLimit: "NL20",
    };

    const response = await app.inject({
      method: "POST",
      url: "/players",
      payload,
      headers: {
        authorization: `Bearer ${signToken("sid-post-created")}`,
      },
    });

    expect(mocked.createPlayerUseCase).toHaveBeenCalledWith(
      mocked.drizzlePlayerRepository,
    );
    expect(mocked.createHandler).toHaveBeenCalledWith(payload);
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id: "p1" });

    await app.close();
  });

  it("GET /players returns all players", async () => {
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

    expect(mocked.getAllPlayersUseCase).toHaveBeenCalledWith(
      mocked.drizzlePlayerRepository,
    );
    expect(mocked.getAllHandler).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: "p1" }]);

    await app.close();
  });

  it("GET /players/overview returns overview projection", async () => {
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

    expect(mocked.getPlayersOverviewUseCase).toHaveBeenCalledWith(
      mocked.drizzlePlayerRepository,
      mocked.drizzlePlayerStatsRepository,
    );
    expect(mocked.getOverviewHandler).toHaveBeenCalledWith(30);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { id: "p1", lifetimeProfit: 100, periodDays: 30 },
    ]);

    await app.close();
  });

  it("GET /players/:id/progression uses BI_WEEKLY period by default", async () => {
    registerSession("sid-progress-default", [
      "player-management.read.getPlayerProgression",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/player-1/progression",
      headers: {
        authorization: `Bearer ${signToken("sid-progress-default")}`,
      },
    });

    expect(mocked.checkProgressionUseCase).toHaveBeenCalledWith(
      mocked.drizzlePlayerStatsRepository,
      mocked.drizzlePlayerRepository,
    );
    expect(mocked.checkProgressionHandler).toHaveBeenCalledWith("player-1", 15);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      period: "BI_WEEKLY",
    });

    await app.close();
  });

  it("GET /players/:id/progression maps period=MONTHLY to 30 days", async () => {
    registerSession("sid-progress-monthly", [
      "player-management.read.getPlayerProgression",
    ]);

    mocked.checkProgressionHandler.mockResolvedValue({
      eligibleForPromotion: true,
      reason: "Met Monthly criteria",
      avgHands: 1100,
      winrate: 6,
      period: "MONTHLY",
    });

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/player-1/progression?period=MONTHLY",
      headers: {
        authorization: `Bearer ${signToken("sid-progress-monthly")}`,
      },
    });

    expect(mocked.checkProgressionHandler).toHaveBeenCalledWith("player-1", 30);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      period: "MONTHLY",
    });

    await app.close();
  });

  it("GET /players/overview validates periodDays", async () => {
    registerSession("sid-overview-invalid-period", [
      "player-management.read.getPlayersOverview",
    ]);

    const app = Fastify();
    await app.register(playerRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/overview?periodDays=abc",
      headers: {
        authorization: `Bearer ${signToken("sid-overview-invalid-period")}`,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });
});
