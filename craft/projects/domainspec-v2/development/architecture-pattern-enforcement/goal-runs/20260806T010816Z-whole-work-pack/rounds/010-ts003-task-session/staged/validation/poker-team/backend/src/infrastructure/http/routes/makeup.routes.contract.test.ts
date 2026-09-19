import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const mocked = vi.hoisted(() => {
  return {
    getPlayerMakeupUseCase: vi.fn(),
    adjustPlayerMakeupUseCase: vi.fn(),
    getPlayerMakeupHistoryUseCase: vi.fn(),
    getMakeupPolicyUseCase: vi.fn(),
    setPlayerMakeupPolicyUseCase: vi.fn(),
    getMakeupHandler: vi.fn(),
    adjustMakeupHandler: vi.fn(),
    getHistoryHandler: vi.fn(),
    setPolicyHandler: vi.fn(),
    resolvePlayerVisibility: vi.fn(),
    visibilityResolver: vi.fn(),
    drizzlePlayerRepository: {},
    drizzleTransactionRepository: {},
    drizzleFinancialUnitOfWork: {},
    drizzleCoachRepository: {},
    drizzleCoachAssignmentRepository: {},
  };
});

vi.mock("../../../use-cases/makeup/get-player-makeup", () => ({
  getPlayerMakeupUseCase: mocked.getPlayerMakeupUseCase,
}));

vi.mock("../../../use-cases/makeup/adjust-player-makeup", () => ({
  adjustPlayerMakeupUseCase: mocked.adjustPlayerMakeupUseCase,
}));

vi.mock("../../../use-cases/makeup/get-player-makeup-history", () => ({
  getPlayerMakeupHistoryUseCase: mocked.getPlayerMakeupHistoryUseCase,
}));

vi.mock("../../../use-cases/makeup/get-makeup-policy", () => ({
  getMakeupPolicyUseCase: mocked.getMakeupPolicyUseCase,
}));

vi.mock("../../../use-cases/makeup/set-player-makeup-policy", () => ({
  setPlayerMakeupPolicyUseCase: mocked.setPlayerMakeupPolicyUseCase,
}));

vi.mock("../../repositories/drizzle-player.repository", () => ({
  drizzlePlayerRepository: mocked.drizzlePlayerRepository,
}));

vi.mock("../../repositories/drizzle-transaction.repository", () => ({
  drizzleTransactionRepository: mocked.drizzleTransactionRepository,
}));

vi.mock("../../repositories/drizzle-financial-unit-of-work", () => ({
  drizzleFinancialUnitOfWork: mocked.drizzleFinancialUnitOfWork,
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

import { makeupRoutes } from "./makeup.routes";

describe("makeup routes contract", () => {
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

    mocked.getPlayerMakeupUseCase.mockReturnValue(mocked.getMakeupHandler);
    mocked.adjustPlayerMakeupUseCase.mockReturnValue(
      mocked.adjustMakeupHandler,
    );
    mocked.getPlayerMakeupHistoryUseCase.mockReturnValue(
      mocked.getHistoryHandler,
    );
    mocked.setPlayerMakeupPolicyUseCase.mockReturnValue(
      mocked.setPolicyHandler,
    );

    // Visibility: default to returning the target player's ID (allow all)
    mocked.resolvePlayerVisibility.mockReturnValue(mocked.visibilityResolver);
    mocked.visibilityResolver.mockResolvedValue(["p1", "missing", "player-1"]);

    mocked.getMakeupHandler.mockResolvedValue({
      playerId: "p1",
      currentMakeup: 100,
      policy: {
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 0.5,
      },
    });

    mocked.adjustMakeupHandler.mockResolvedValue({
      playerId: "p1",
      previousMakeup: 100,
      currentMakeup: 120,
      operation: "increase",
      amount: 20,
    });

    mocked.getHistoryHandler.mockResolvedValue({
      playerId: "p1",
      entries: [],
      nextCursor: null,
    });

    mocked.getMakeupPolicyUseCase.mockResolvedValue({
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: 0.5,
    });

    mocked.setPolicyHandler.mockResolvedValue({
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.7,
    });
  });

  it("GET /players/:id/makeup returns 200", async () => {
    registerSession("sid-read", ["player-makeup.read.viewMakeup"], "p1");

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/makeup",
      headers: {
        authorization: `Bearer ${signToken("sid-read")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      playerId: "p1",
      currentMakeup: 100,
    });
    await app.close();
  });

  it("GET /players/:id/makeup returns 404 when player does not exist", async () => {
    registerSession(
      "sid-read-404",
      ["player-makeup.read.viewMakeup"],
      "missing",
    );
    mocked.getMakeupHandler.mockRejectedValueOnce(
      new Error("Player not found"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/missing/makeup",
      headers: {
        authorization: `Bearer ${signToken("sid-read-404")}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PLAYER_NOT_FOUND" });
    await app.close();
  });

  it("PATCH /players/:id/makeup returns 200 on valid payload", async () => {
    registerSession("sid-write", ["player-makeup.write.manageMakeup"]);

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup",
      headers: {
        authorization: `Bearer ${signToken("sid-write")}`,
      },
      payload: {
        operation: "increase",
        amount: 20,
        reasonCode: "manual-adjustment",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ currentMakeup: 120 });
    expect(mocked.adjustMakeupHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "p1",
        operation: "increase",
        amount: 20,
        reasonCode: "manual-adjustment",
        actorId: "user-1",
        sourceChannel: "api",
      }),
    );
    await app.close();
  });

  it("PATCH /players/:id/makeup returns 400 for invalid payload", async () => {
    registerSession("sid-write-invalid", ["player-makeup.write.manageMakeup"]);

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup",
      headers: {
        authorization: `Bearer ${signToken("sid-write-invalid")}`,
      },
      payload: {
        operation: "not-valid",
        amount: "x",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  it("GET /players/:id/makeup/history returns 200 and passes pagination inputs", async () => {
    registerSession("sid-history", ["player-makeup.read.viewMakeup"], "p1");

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/makeup/history?limit=25&cursor=abc",
      headers: {
        authorization: `Bearer ${signToken("sid-history")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.getHistoryHandler).toHaveBeenCalledWith({
      playerId: "p1",
      limit: 25,
      cursor: "abc",
    });
    await app.close();
  });

  it("GET /players/:id/makeup/history returns 400 for invalid limit", async () => {
    registerSession("sid-history-400", ["player-makeup.read.viewMakeup"], "p1");
    mocked.getHistoryHandler.mockRejectedValueOnce(new Error("Invalid limit"));

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/makeup/history?limit=0",
      headers: {
        authorization: `Bearer ${signToken("sid-history-400")}`,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  it("GET /players/:id/makeup/history returns 404 when player does not exist", async () => {
    registerSession(
      "sid-history-404",
      ["player-makeup.read.viewMakeup"],
      "missing",
    );
    mocked.getHistoryHandler.mockRejectedValueOnce(
      new Error("Player not found"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/missing/makeup/history",
      headers: {
        authorization: `Bearer ${signToken("sid-history-404")}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PLAYER_NOT_FOUND" });
    await app.close();
  });

  it("GET /players/makeup/policy returns 200", async () => {
    registerSession("sid-policy", ["player-makeup.policy.readPolicy"]);

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/makeup/policy",
      headers: {
        authorization: `Bearer ${signToken("sid-policy")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      applyProfitFirst: true,
      applyRakebackSecond: true,
      playerRakebackShare: 0.5,
    });
    await app.close();
  });

  // PMK-API-005: GET /players/:id/makeup 500 on unexpected failure
  it("GET /players/:id/makeup returns 500 on unexpected failure", async () => {
    registerSession("sid-get-500", [
      "player-makeup.read.viewMakeup",
      "player-makeup.write.manageMakeup",
    ]);
    mocked.getMakeupHandler.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/makeup",
      headers: { authorization: `Bearer ${signToken("sid-get-500")}` },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: "INTERNAL_ERROR" });
    await app.close();
  });

  // PMK-API-011: PATCH /players/:id/makeup 500 on unexpected failure
  it("PATCH /players/:id/makeup returns 500 on unexpected failure", async () => {
    registerSession("sid-patch-500", ["player-makeup.write.manageMakeup"]);
    mocked.adjustMakeupHandler.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup",
      headers: { authorization: `Bearer ${signToken("sid-patch-500")}` },
      payload: { operation: "increase", amount: 10, reasonCode: "test" },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: "INTERNAL_ERROR" });
    await app.close();
  });

  // PMK-API-016: GET /players/:id/makeup/history 500 on unexpected failure
  it("GET /players/:id/makeup/history returns 500 on unexpected failure", async () => {
    registerSession("sid-hist-500", [
      "player-makeup.read.viewMakeup",
      "player-makeup.write.manageMakeup",
    ]);
    mocked.getHistoryHandler.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/p1/makeup/history",
      headers: { authorization: `Bearer ${signToken("sid-hist-500")}` },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: "INTERNAL_ERROR" });
    await app.close();
  });

  // PMK-API-020: GET /players/makeup/policy 500 on unexpected failure
  it("GET /players/makeup/policy returns 500 on unexpected failure", async () => {
    registerSession("sid-policy-500", ["player-makeup.policy.readPolicy"]);
    mocked.getMakeupPolicyUseCase.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "GET",
      url: "/players/makeup/policy",
      headers: { authorization: `Bearer ${signToken("sid-policy-500")}` },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: "INTERNAL_ERROR" });
    await app.close();
  });

  // --- PATCH /players/:id/makeup/policy ---

  it("PATCH /players/:id/makeup/policy returns 200 on valid payload", async () => {
    registerSession("sid-set-policy", ["player-makeup.policy.writePolicy"]);

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup/policy",
      headers: { authorization: `Bearer ${signToken("sid-set-policy")}` },
      payload: {
        applyProfitFirst: false,
        applyRakebackSecond: true,
        playerRakebackShare: 0.7,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.7,
    });
    await app.close();
  });

  it("PATCH /players/:id/makeup/policy returns 400 for invalid payload", async () => {
    registerSession("sid-set-policy-400", ["player-makeup.policy.writePolicy"]);

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup/policy",
      headers: { authorization: `Bearer ${signToken("sid-set-policy-400")}` },
      payload: {
        applyProfitFirst: "not-a-boolean",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  it("PATCH /players/:id/makeup/policy returns 404 when player not found", async () => {
    registerSession("sid-set-policy-404", ["player-makeup.policy.writePolicy"]);
    mocked.setPolicyHandler.mockRejectedValueOnce(
      new Error("Player not found"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/missing/makeup/policy",
      headers: { authorization: `Bearer ${signToken("sid-set-policy-404")}` },
      payload: {
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 0.5,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PLAYER_NOT_FOUND" });
    await app.close();
  });

  it("PATCH /players/:id/makeup/policy returns 500 on unexpected failure", async () => {
    registerSession("sid-set-policy-500", ["player-makeup.policy.writePolicy"]);
    mocked.setPolicyHandler.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const app = Fastify();
    await app.register(makeupRoutes, { prefix: "/players" });

    const response = await app.inject({
      method: "PATCH",
      url: "/players/p1/makeup/policy",
      headers: { authorization: `Bearer ${signToken("sid-set-policy-500")}` },
      payload: {
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 0.5,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: "INTERNAL_ERROR" });
    await app.close();
  });
});
