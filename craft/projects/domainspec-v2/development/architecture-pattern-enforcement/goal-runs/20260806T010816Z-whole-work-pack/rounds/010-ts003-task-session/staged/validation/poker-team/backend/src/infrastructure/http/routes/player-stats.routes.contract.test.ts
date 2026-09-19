import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const mocked = vi.hoisted(() => {
  return {
    recordPlayerStatsUseCase: vi.fn(),
    getPlayerStatsHistoryUseCase: vi.fn(),
    getPlayerStatsWindowUseCase: vi.fn(),
    recordHandler: vi.fn(),
    historyHandler: vi.fn(),
    windowHandler: vi.fn(),
    resolvePlayerVisibility: vi.fn(),
    visibilityResolver: vi.fn(),
    drizzlePlayerStatsRepository: {},
    drizzlePlayerRepository: {},
    drizzleCoachRepository: {},
    drizzleCoachAssignmentRepository: {},
  };
});

vi.mock("../../../use-cases/player-stats/record-player-stats", () => ({
  recordPlayerStatsUseCase: mocked.recordPlayerStatsUseCase,
}));

vi.mock("../../../use-cases/player-stats/get-player-stats-history", () => ({
  getPlayerStatsHistoryUseCase: mocked.getPlayerStatsHistoryUseCase,
}));

vi.mock("../../../use-cases/player-stats/get-player-stats-window", () => ({
  getPlayerStatsWindowUseCase: mocked.getPlayerStatsWindowUseCase,
}));

vi.mock("../../repositories/drizzle-player-stats.repository", () => ({
  drizzlePlayerStatsRepository: mocked.drizzlePlayerStatsRepository,
}));

vi.mock("../../repositories/drizzle-player.repository", () => ({
  drizzlePlayerRepository: mocked.drizzlePlayerRepository,
}));

vi.mock("../../repositories/drizzle-coach.repository", () => ({
  drizzleCoachRepository: mocked.drizzleCoachRepository,
}));

vi.mock("../../repositories/drizzle-coach-assignment.repository", () => ({
  drizzleCoachAssignmentRepository: mocked.drizzleCoachAssignmentRepository,
}));

vi.mock("../../../domain/coach/player-visibility.service", () => ({
  resolvePlayerVisibility: mocked.resolvePlayerVisibility,
}));

import { playerStatsRoutes } from "./player-stats.routes";
import { PlayerStatsValidationError } from "../../../domain/player-stats/player-stats.validation";

describe("player-stats routes contract", () => {
  const signToken = (sid: string) =>
    jwt.sign({ sid, jti: `${sid}-token` }, "test-secret");

  const registerSession = (
    sid: string,
    permissions: string[],
    principalId = "user-1",
  ) => {
    upsertAuthSession({
      id: sid,
      principalId,
      status: "ACTIVE",
      effectivePermissions: permissions,
    });
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
    clearAuthSessions();

    mocked.recordPlayerStatsUseCase.mockReturnValue(mocked.recordHandler);
    mocked.getPlayerStatsHistoryUseCase.mockReturnValue(mocked.historyHandler);
    mocked.getPlayerStatsWindowUseCase.mockReturnValue(mocked.windowHandler);

    // Visibility: by default allow all player IDs used across tests
    mocked.resolvePlayerVisibility.mockReturnValue(mocked.visibilityResolver);
    mocked.visibilityResolver.mockResolvedValue(["p1", "user-1"]);
  });

  // --- DST-API-001: POST /player-stats ---

  it("DST-API-001: POST /player-stats returns 401 without token", async () => {
    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "POST",
      url: "/player-stats",
      payload: {
        playerId: "p1",
        statDate: "2024-01-15",
        hands: 500,
        profit: 120,
        rakeback: 30,
        rake: 45,
        closingBankroll: 8200,
        sessionDuration: 180,
        sourceType: "MANUAL",
      },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("DST-API-001: POST /player-stats returns 403 without permission", async () => {
    registerSession("sid-no-write", [
      "player-stats.read.getPlayerStatsHistory",
    ]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "POST",
      url: "/player-stats",
      headers: { authorization: `Bearer ${signToken("sid-no-write")}` },
      payload: {
        playerId: "p1",
        statDate: "2024-01-15",
        hands: 500,
        profit: 120,
        rakeback: 30,
        rake: 45,
        closingBankroll: 8200,
        sessionDuration: 180,
        sourceType: "MANUAL",
      },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("DST-API-001: POST /player-stats returns 200 with correct shape", async () => {
    registerSession("sid-write", ["player-stats.write.recordPlayerStats"]);

    const playerId = "a0000000-0000-4000-a000-000000000001";
    mocked.recordHandler.mockResolvedValue({
      snapshot: {
        id: "snap-1",
        playerId,
        statDate: "2024-01-15",
        status: "RECORDED",
      },
      action: "recorded",
    });

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "POST",
      url: "/player-stats",
      headers: { authorization: `Bearer ${signToken("sid-write")}` },
      payload: {
        playerId,
        statDate: "2024-01-15",
        hands: 500,
        profit: 120,
        rakeback: 30,
        rake: 45,
        closingBankroll: 8200,
        sessionDuration: 180,
        sourceType: "MANUAL",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: "snap-1",
      playerId,
      statDate: "2024-01-15",
      status: "RECORDED",
      action: "recorded",
    });
    await app.close();
  });

  it("DST-API-001: POST /player-stats returns 404 for unknown player", async () => {
    registerSession("sid-write-404", ["player-stats.write.recordPlayerStats"]);

    mocked.recordHandler.mockRejectedValue(
      new PlayerStatsValidationError("PLAYER_NOT_FOUND", "Player not found"),
    );

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "POST",
      url: "/player-stats",
      headers: { authorization: `Bearer ${signToken("sid-write-404")}` },
      payload: {
        playerId: "a0000000-0000-4000-a000-000000000099",
        statDate: "2024-01-15",
        hands: 500,
        profit: 120,
        rakeback: 30,
        rake: 45,
        closingBankroll: 8200,
        sessionDuration: 180,
        sourceType: "MANUAL",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: "PLAYER_NOT_FOUND" });
    await app.close();
  });

  it("DST-API-001: POST /player-stats returns 400 for validation error", async () => {
    registerSession("sid-write-400", ["player-stats.write.recordPlayerStats"]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "POST",
      url: "/player-stats",
      headers: { authorization: `Bearer ${signToken("sid-write-400")}` },
      payload: {
        playerId: "not-a-uuid",
        statDate: "bad-date",
        hands: -1,
        profit: 0,
        rakeback: 0,
        rake: 0,
        closingBankroll: 0,
        sessionDuration: 0,
        sourceType: "MANUAL",
      },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  // --- DST-API-002: GET /:playerId/history ---

  it("DST-API-002: GET history returns 401 without token", async () => {
    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/history",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("DST-API-002: GET history returns 403 without permission", async () => {
    registerSession("sid-no-read", ["player-stats.write.recordPlayerStats"]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/history",
      headers: { authorization: `Bearer ${signToken("sid-no-read")}` },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("DST-API-002: GET history returns 200 with newest-first entries and cursor", async () => {
    registerSession("sid-history", ["player-stats.read.getPlayerStatsHistory"]);

    mocked.historyHandler.mockResolvedValue({
      playerId: "p1",
      entries: [
        {
          id: "s2",
          statDate: "2024-01-16",
          hands: 600,
          profit: 200,
          rakeback: 40,
          rake: 50,
          closingBankroll: 8400,
          sessionDuration: 200,
          sourceType: "MANUAL",
          status: "RECORDED",
          updatedAt: new Date("2024-01-16T12:00:00Z"),
        },
        {
          id: "s1",
          statDate: "2024-01-15",
          hands: 500,
          profit: 100,
          rakeback: 30,
          rake: 45,
          closingBankroll: 8200,
          sessionDuration: 180,
          sourceType: "MANUAL",
          status: "RECORDED",
          updatedAt: new Date("2024-01-15T12:00:00Z"),
        },
      ],
      nextCursor: "2024-01-14",
    });

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/history?fromDate=2024-01-01&toDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-history")}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.playerId).toBe("p1");
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0].statDate).toBe("2024-01-16");
    expect(body.entries[1].statDate).toBe("2024-01-15");
    expect(body.nextCursor).toBe("2024-01-14");
    await app.close();
  });

  // --- DST-API-003: GET /:playerId/window ---

  it("DST-API-003: GET window returns 401 without token", async () => {
    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/window?fromDate=2024-01-01&toDate=2024-01-31",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("DST-API-003: GET window returns 403 without permission", async () => {
    registerSession("sid-no-window", ["player-stats.write.recordPlayerStats"]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/window?fromDate=2024-01-01&toDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-no-window")}` },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("DST-API-003: GET window returns 200 with aggregate projection shape", async () => {
    registerSession("sid-window", ["player-stats.read.getPlayerStatsWindow"]);

    mocked.windowHandler.mockResolvedValue({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      totalHands: 3000,
      totalProfit: 450,
      totalRakeback: 120,
      totalRake: 200,
      totalSessionMinutes: 900,
      sessionCount: 5,
      avgHandsPerDay: 600,
      winrateBbPer100: null,
    });

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/window?fromDate=2024-01-01&toDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-window")}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      playerId: "p1",
      fromDate: "2024-01-01",
      toDate: "2024-01-31",
      totalHands: 3000,
      totalProfit: 450,
      totalRakeback: 120,
      totalRake: 200,
      totalSessionMinutes: 900,
      sessionCount: 5,
      avgHandsPerDay: 600,
      winrateBbPer100: null,
    });
    await app.close();
  });

  // --- Visibility enforcement ---

  it("GET history returns 403 when player is not visible to actor", async () => {
    registerSession(
      "sid-vis-hist",
      ["player-stats.read.getPlayerStatsHistory"],
      "actor-1",
    );
    mocked.visibilityResolver.mockResolvedValueOnce(["other-player"]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/history",
      headers: { authorization: `Bearer ${signToken("sid-vis-hist")}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: "FORBIDDEN" });
    await app.close();
  });

  it("GET window returns 403 when player is not visible to actor", async () => {
    registerSession(
      "sid-vis-win",
      ["player-stats.read.getPlayerStatsWindow"],
      "actor-1",
    );
    mocked.visibilityResolver.mockResolvedValueOnce(["other-player"]);

    const app = Fastify();
    await app.register(playerStatsRoutes, { prefix: "/player-stats" });

    const response = await app.inject({
      method: "GET",
      url: "/player-stats/p1/window?fromDate=2024-01-01&toDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-vis-win")}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: "FORBIDDEN" });
    await app.close();
  });
});
