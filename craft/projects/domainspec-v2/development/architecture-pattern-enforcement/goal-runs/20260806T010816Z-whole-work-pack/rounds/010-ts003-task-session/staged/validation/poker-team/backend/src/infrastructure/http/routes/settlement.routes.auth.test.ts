import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { buildApp } from "../app";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

describe("settlement routes auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

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

  it("blocks settlement request without bearer token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      payload: {
        playerId: "p1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "AUTH_REQUIRED",
      message: "Missing bearer token",
    });
  });

  it("blocks settlement request with missing permission", async () => {
    upsertAuthSession({
      id: "sid-no-settlement-write",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: ["player-makeup.read.viewMakeup"],
    });

    const token = jwt.sign(
      { sid: "sid-no-settlement-write", jti: "jti-settlement-1" },
      "test-secret",
    );

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        playerId: "p1",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: "FORBIDDEN",
      details: {
        required: "financial-settlement.write.generateSettlement",
      },
    });
  });

  it("allows settlement request with settlement:write permission", async () => {
    upsertAuthSession({
      id: "sid-settlement-write",
      principalId: "manager-1",
      status: "ACTIVE",
      effectivePermissions: ["financial-settlement.write.generateSettlement"],
    });

    const token = jwt.sign(
      { sid: "sid-settlement-write", jti: "jti-settlement-2" },
      "test-secret",
    );

    const response = await app.inject({
      method: "POST",
      url: "/settlements",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "playerId, startDate, and endDate are required",
    });
  });
});
