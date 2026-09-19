import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const mocked = vi.hoisted(() => {
  return {
    generateSettlementUseCase: vi.fn(),
    getSettlementPreviewUseCase: vi.fn(),
    generateHandler: vi.fn(),
    previewHandler: vi.fn(),
    drizzlePlayerStatsRepository: {},
    drizzlePlayerRepository: {},
    drizzleTransactionRepository: {},
    drizzleFinancialUnitOfWork: {},
  };
});

vi.mock("../../../use-cases/financial-settlement/generate-settlement", () => ({
  generateSettlementUseCase: mocked.generateSettlementUseCase,
}));

vi.mock("../../../use-cases/financial-settlement/get-settlement-preview", () => ({
  getSettlementPreviewUseCase: mocked.getSettlementPreviewUseCase,
}));

vi.mock("../../repositories/drizzle-player-stats.repository", () => ({
  drizzlePlayerStatsRepository: mocked.drizzlePlayerStatsRepository,
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

import { settlementRoutes } from "./settlement.routes";

describe("settlement preview route", () => {
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

    mocked.generateSettlementUseCase.mockReturnValue(mocked.generateHandler);
    mocked.getSettlementPreviewUseCase.mockReturnValue(mocked.previewHandler);
    mocked.previewHandler.mockResolvedValue({
      playerId: "p1",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      totalProfit: 1000,
      totalRakeback: 200,
      netProfit: 1200,
      previousMakeup: 0,
      newMakeup: 0,
      playerProfitShare: 400,
      playerRakebackShare: 100,
      totalPayout: 500,
    });
  });

  it("GET /settlements/preview returns 401 without token", async () => {
    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "GET",
      url: "/settlements/preview?playerId=p1&startDate=2024-01-01&endDate=2024-01-31",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("GET /settlements/preview returns 403 without permission", async () => {
    registerSession("sid-no-perm", ["player-makeup.read.viewMakeup"]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "GET",
      url: "/settlements/preview?playerId=p1&startDate=2024-01-01&endDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-no-perm")}` },
    });

    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("GET /settlements/preview returns 400 when query params missing", async () => {
    registerSession("sid-ok", [
      "financial-settlement.read.getSettlementPreview",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "GET",
      url: "/settlements/preview?playerId=p1",
      headers: { authorization: `Bearer ${signToken("sid-ok")}` },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  it("GET /settlements/preview returns 200 with settlement projection", async () => {
    registerSession("sid-preview", [
      "financial-settlement.read.getSettlementPreview",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "GET",
      url: "/settlements/preview?playerId=p1&startDate=2024-01-01&endDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-preview")}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      playerId: "p1",
      totalProfit: 1000,
      totalPayout: 500,
      projectedNewMakeup: 0,
      projectedPayout: 500,
    });
    expect(mocked.getSettlementPreviewUseCase).toHaveBeenCalledWith(
      mocked.drizzlePlayerStatsRepository,
      mocked.drizzlePlayerRepository,
      mocked.drizzleTransactionRepository,
    );
    expect(mocked.previewHandler).toHaveBeenCalledWith(
      "p1",
      "2024-01-01",
      "2024-01-31",
    );
    await app.close();
  });

  it("GET /settlements/preview returns 404 for unknown player", async () => {
    registerSession("sid-404", [
      "financial-settlement.read.getSettlementPreview",
    ]);
    mocked.previewHandler.mockRejectedValue(new Error("Player not found"));

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "GET",
      url: "/settlements/preview?playerId=missing&startDate=2024-01-01&endDate=2024-01-31",
      headers: { authorization: `Bearer ${signToken("sid-404")}` },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PLAYER_NOT_FOUND" });
    await app.close();
  });
});

describe("settlement POST route contract", () => {
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

    mocked.generateSettlementUseCase.mockReturnValue(mocked.generateHandler);
    mocked.getSettlementPreviewUseCase.mockReturnValue(mocked.previewHandler);

    mocked.generateHandler.mockResolvedValue({
      playerId: "p1",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      totalProfit: 1500,
      totalRakeback: 200,
      netProfit: 1700,
      previousMakeup: 0,
      newMakeup: 0,
      playerProfitShare: 600,
      playerRakebackShare: 100,
      totalPayout: 700,
    });
  });

  // --- CO-1: POST /settlements valid settlement returns 200 ---
  it("CO-1: POST /settlements returns 200 with SettlementResult shape", async () => {
    registerSession("sid-settle-ok", [
      "financial-settlement.write.generateSettlement",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: { authorization: `Bearer ${signToken("sid-settle-ok")}` },
      payload: {
        playerId: "p1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      totalProfit: 1500,
      totalPayout: 700,
      playerProfitShare: 600,
      playerRakebackShare: 100,
    });
    expect(mocked.generateHandler).toHaveBeenCalledWith(
      "p1",
      "2024-01-01",
      "2024-01-31",
    );
    await app.close();
  });

  // --- RV-2: missing playerId ---
  it("RV-2: POST /settlements returns 400 when playerId is missing", async () => {
    registerSession("sid-settle-rv2", [
      "financial-settlement.write.generateSettlement",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: { authorization: `Bearer ${signToken("sid-settle-rv2")}` },
      payload: { startDate: "2024-01-01", endDate: "2024-01-31" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  // --- RV-3: missing startDate ---
  it("RV-3: POST /settlements returns 400 when startDate is missing", async () => {
    registerSession("sid-settle-rv3", [
      "financial-settlement.write.generateSettlement",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: { authorization: `Bearer ${signToken("sid-settle-rv3")}` },
      payload: { playerId: "p1", endDate: "2024-01-31" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  // --- RV-4: missing endDate ---
  it("RV-4: POST /settlements returns 400 when endDate is missing", async () => {
    registerSession("sid-settle-rv4", [
      "financial-settlement.write.generateSettlement",
    ]);

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: { authorization: `Bearer ${signToken("sid-settle-rv4")}` },
      payload: { playerId: "p1", startDate: "2024-01-01" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    await app.close();
  });

  // --- CO-3: POST /settlements player not found returns 404 ---
  it("CO-3: POST /settlements returns 404 when player not found", async () => {
    registerSession("sid-settle-co3", [
      "financial-settlement.write.generateSettlement",
    ]);
    mocked.generateHandler.mockRejectedValue(new Error("Player not found"));

    const app = Fastify();
    await app.register(settlementRoutes, { prefix: "/settlements" });

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: { authorization: `Bearer ${signToken("sid-settle-co3")}` },
      payload: {
        playerId: "missing",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PLAYER_NOT_FOUND" });
    await app.close();
  });
});
