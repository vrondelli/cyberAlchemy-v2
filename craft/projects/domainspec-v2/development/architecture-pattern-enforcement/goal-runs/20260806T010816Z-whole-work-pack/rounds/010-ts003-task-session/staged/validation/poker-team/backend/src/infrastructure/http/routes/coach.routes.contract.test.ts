import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

const mocked = vi.hoisted(() => ({
  createCoachUseCase: vi.fn(),
  getAllCoachesUseCase: vi.fn(),
  assignCoachUseCase: vi.fn(),
  unassignCoachUseCase: vi.fn(),
  getCoachPlayersUseCase: vi.fn(),
  createHandler: vi.fn(),
  getAllHandler: vi.fn(),
  assignHandler: vi.fn(),
  unassignHandler: vi.fn(),
  getPlayersHandler: vi.fn(),
  drizzleCoachRepository: {},
  drizzleCoachAssignmentRepository: {},
  drizzlePlayerRepository: {},
}));

vi.mock("../../../use-cases/coach/create-coach", () => ({
  createCoachUseCase: mocked.createCoachUseCase,
}));
vi.mock("../../../use-cases/coach/get-all-coaches", () => ({
  getAllCoachesUseCase: mocked.getAllCoachesUseCase,
}));
vi.mock("../../../use-cases/coach/assign-coach", () => ({
  assignCoachUseCase: mocked.assignCoachUseCase,
}));
vi.mock("../../../use-cases/coach/unassign-coach", () => ({
  unassignCoachUseCase: mocked.unassignCoachUseCase,
}));
vi.mock("../../../use-cases/coach/get-coach-players", () => ({
  getCoachPlayersUseCase: mocked.getCoachPlayersUseCase,
}));
vi.mock("../../repositories/drizzle-coach.repository", () => ({
  drizzleCoachRepository: mocked.drizzleCoachRepository,
}));
vi.mock("../../repositories/drizzle-coach-assignment.repository", () => ({
  drizzleCoachAssignmentRepository: mocked.drizzleCoachAssignmentRepository,
}));
vi.mock("../../repositories/drizzle-player.repository", () => ({
  drizzlePlayerRepository: mocked.drizzlePlayerRepository,
}));

import { coachRoutes } from "./coach.routes";

describe("coach routes contract", () => {
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

  const buildApp = async () => {
    const app = Fastify();
    await app.register(coachRoutes, { prefix: "/coaches" });
    return app;
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
    clearAuthSessions();

    mocked.createCoachUseCase.mockReturnValue(mocked.createHandler);
    mocked.getAllCoachesUseCase.mockReturnValue(mocked.getAllHandler);
    mocked.assignCoachUseCase.mockReturnValue(mocked.assignHandler);
    mocked.unassignCoachUseCase.mockReturnValue(mocked.unassignHandler);
    mocked.getCoachPlayersUseCase.mockReturnValue(mocked.getPlayersHandler);

    mocked.createHandler.mockResolvedValue({
      id: "c-1",
      principalId: "p-1",
      name: "Coach",
      email: "c@test.com",
      status: "ACTIVE",
    });
    mocked.getAllHandler.mockResolvedValue([]);
    mocked.assignHandler.mockResolvedValue({
      id: "a-1",
      coachId: "c-1",
      playerId: "p-1",
      assignedAt: new Date().toISOString(),
      unassignedAt: null,
    });
    mocked.unassignHandler.mockResolvedValue({
      unassignedAt: new Date().toISOString(),
    });
    mocked.getPlayersHandler.mockResolvedValue([]);
  });

  // ───── POST /coaches ─────

  // PM-CAPI-001: auth
  it("POST /coaches returns 401 without JWT", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      payload: { principalId: "p1", name: "Coach", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // PM-CAPI-002: permission
  it("POST /coaches returns 403 when permission is missing", async () => {
    registerSession("sid-1", ["player-management.read.getAllCoaches"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-1")}` },
      payload: { principalId: "p1", name: "Coach", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  // PM-CAPI-003: 201 success
  it("POST /coaches returns 201 with valid payload", async () => {
    registerSession("sid-2", ["player-management.write.createCoach"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-2")}` },
      payload: { principalId: "p1", name: "Coach", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).id).toBe("c-1");
    await app.close();
  });

  // PM-CAPI-004: 400 validation
  it("POST /coaches returns 400 when use-case throws validation error", async () => {
    registerSession("sid-3", ["player-management.write.createCoach"]);
    mocked.createHandler.mockRejectedValue(
      Object.assign(new Error("Name is required"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-3")}` },
      payload: { principalId: "p1", name: "", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  // PM-CAPI-005: 409 duplicate
  it("POST /coaches returns 409 for duplicate principalId", async () => {
    registerSession("sid-4", ["player-management.write.createCoach"]);
    mocked.createHandler.mockRejectedValue(
      Object.assign(new Error("Duplicate"), {
        statusCode: 409,
        code: "DUPLICATE_PRINCIPAL",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-4")}` },
      payload: { principalId: "existing", name: "Coach", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).code).toBe("DUPLICATE_PRINCIPAL");
    await app.close();
  });

  // PM-CAPI-006: 500 persistence
  it("POST /coaches returns 500 on unexpected error", async () => {
    registerSession("sid-5", ["player-management.write.createCoach"]);
    mocked.createHandler.mockRejectedValue(new Error("DB failure"));
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-5")}` },
      payload: { principalId: "p1", name: "Coach", email: "c@t.com" },
    });
    expect(res.statusCode).toBe(500);
    await app.close();
  });

  // ───── GET /coaches ─────

  // PM-CAPI-007: auth
  it("GET /coaches returns 401 without JWT", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/coaches" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // PM-CAPI-008: permission
  it("GET /coaches returns 403 when permission is missing", async () => {
    registerSession("sid-6", ["player-management.write.createCoach"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-6")}` },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  // PM-CAPI-009: 200
  it("GET /coaches returns 200 with coach list", async () => {
    registerSession("sid-7", ["player-management.read.getAllCoaches"]);
    mocked.getAllHandler.mockResolvedValue([{ id: "c-1" }]);
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches",
      headers: { authorization: `Bearer ${signToken("sid-7")}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(1);
    await app.close();
  });

  // ───── POST /coaches/:coachId/players/:playerId ─────

  // PM-CAPI-010: auth
  it("POST assign returns 401 without JWT", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches/c-1/players/p-1",
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // PM-CAPI-011: permission
  it("POST assign returns 403 when permission is missing", async () => {
    registerSession("sid-8", ["player-management.read.getAllCoaches"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-8")}` },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  // PM-CAPI-012: 201
  it("POST assign returns 201 on success", async () => {
    registerSession("sid-9", ["player-management.write.assignCoach"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-9")}` },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).coachId).toBe("c-1");
    await app.close();
  });

  // PM-CAPI-013: 404
  it("POST assign returns 404 when coach/player not found", async () => {
    registerSession("sid-10", ["player-management.write.assignCoach"]);
    mocked.assignHandler.mockRejectedValue(
      Object.assign(new Error("Not found"), {
        statusCode: 404,
        code: "COACH_NOT_FOUND",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches/unknown/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-10")}` },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  // PM-CAPI-014: 409
  it("POST assign returns 409 when player already assigned", async () => {
    registerSession("sid-11", ["player-management.write.assignCoach"]);
    mocked.assignHandler.mockRejectedValue(
      Object.assign(new Error("Already assigned"), {
        statusCode: 409,
        code: "PLAYER_ALREADY_ASSIGNED",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-11")}` },
    });
    expect(res.statusCode).toBe(409);
    await app.close();
  });

  // ───── DELETE /coaches/:coachId/players/:playerId ─────

  // PM-CAPI-015: auth
  it("DELETE unassign returns 401 without JWT", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/coaches/c-1/players/p-1",
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // PM-CAPI-016: permission
  it("DELETE unassign returns 403 when permission is missing", async () => {
    registerSession("sid-12", ["player-management.read.getAllCoaches"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-12")}` },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  // PM-CAPI-017: 200
  it("DELETE unassign returns 200 on success", async () => {
    registerSession("sid-13", ["player-management.write.unassignCoach"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-13")}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).unassignedAt).toBeDefined();
    await app.close();
  });

  // PM-CAPI-018: 404
  it("DELETE unassign returns 404 when assignment not found", async () => {
    registerSession("sid-14", ["player-management.write.unassignCoach"]);
    mocked.unassignHandler.mockRejectedValue(
      Object.assign(new Error("Not found"), {
        statusCode: 404,
        code: "ASSIGNMENT_NOT_FOUND",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "DELETE",
      url: "/coaches/c-1/players/p-1",
      headers: { authorization: `Bearer ${signToken("sid-14")}` },
    });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).code).toBe("ASSIGNMENT_NOT_FOUND");
    await app.close();
  });

  // ───── GET /coaches/:coachId/players ─────

  // PM-CAPI-019: auth
  it("GET coach players returns 401 without JWT", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches/c-1/players",
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  // PM-CAPI-020: permission
  it("GET coach players returns 403 when permission is missing", async () => {
    registerSession("sid-15", ["player-management.write.createCoach"]);
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches/c-1/players",
      headers: { authorization: `Bearer ${signToken("sid-15")}` },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  // PM-CAPI-021: 200
  it("GET coach players returns 200 with player list", async () => {
    registerSession("sid-16", ["player-management.read.getCoachPlayers"]);
    mocked.getPlayersHandler.mockResolvedValue([{ id: "p-1" }]);
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches/c-1/players",
      headers: { authorization: `Bearer ${signToken("sid-16")}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(1);
    await app.close();
  });

  // PM-CAPI-022: 404
  it("GET coach players returns 404 when coach not found", async () => {
    registerSession("sid-17", ["player-management.read.getCoachPlayers"]);
    mocked.getPlayersHandler.mockRejectedValue(
      Object.assign(new Error("Not found"), {
        statusCode: 404,
        code: "COACH_NOT_FOUND",
      }),
    );
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/coaches/unknown/players",
      headers: { authorization: `Bearer ${signToken("sid-17")}` },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
