import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { buildApp } from "../app";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";

describe("onboarding routes auth", () => {
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

  it("PATCH /onboarding/candidates/:id/review returns 401 without token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "APPROVE" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("PATCH /onboarding/candidates/:id/review returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-onboarding-review-missing",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "APPROVE" },
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-review-missing")}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("GET /admin/onboarding/candidates returns 401 without token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates",
    });

    expect(response.statusCode).toBe(401);
  });

  it("GET /admin/onboarding/candidates returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-onboarding-admin-list-missing",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-admin-list-missing")}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("GET /admin/onboarding/candidates/:id returns 401 without token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates/c1",
    });

    expect(response.statusCode).toBe(401);
  });

  it("GET /admin/onboarding/candidates/:id returns 403 with missing permission", async () => {
    upsertAuthSession({
      id: "sid-onboarding-admin-detail-missing",
      principalId: "user-1",
      status: "ACTIVE",
      effectivePermissions: ["player-management.read.getAllPlayers"],
    });

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates/c1",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-admin-detail-missing")}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
