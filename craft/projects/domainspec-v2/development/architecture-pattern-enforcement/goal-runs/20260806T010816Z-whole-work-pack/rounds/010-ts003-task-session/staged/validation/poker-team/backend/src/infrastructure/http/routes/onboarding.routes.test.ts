import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { clearAuthSessions, upsertAuthSession } from "../auth/session-store";
import { DomainError } from "../../../domain/errors";

const mocked = vi.hoisted(() => {
  return {
    getOnboardingFlowUseCase: vi.fn(),
    submitCandidateApplicationUseCase: vi.fn(),
    listCandidateApplicationsUseCase: vi.fn(),
    getCandidateApplicationByIdUseCase: vi.fn(),
    reviewCandidateApplicationUseCase: vi.fn(),
    submitHandler: vi.fn(),
    listHandler: vi.fn(),
    getByIdHandler: vi.fn(),
    reviewHandler: vi.fn(),
    drizzleCandidateApplicationRepository: {},
    drizzleOnboardingPlayerIntakeHandoffRepository: {},
  };
});

vi.mock("../../../use-cases/onboarding/get-onboarding-flow", () => ({
  getOnboardingFlowUseCase: mocked.getOnboardingFlowUseCase,
}));

vi.mock("../../../use-cases/onboarding/submit-candidate-application", () => ({
  submitCandidateApplicationUseCase: mocked.submitCandidateApplicationUseCase,
}));

vi.mock("../../../use-cases/onboarding/list-candidate-applications", () => ({
  listCandidateApplicationsUseCase: mocked.listCandidateApplicationsUseCase,
  getCandidateApplicationByIdUseCase: mocked.getCandidateApplicationByIdUseCase,
}));

vi.mock("../../../use-cases/onboarding/review-candidate-application", () => ({
  reviewCandidateApplicationUseCase: mocked.reviewCandidateApplicationUseCase,
}));

vi.mock("../../repositories/drizzle-candidate-application.repository", () => ({
  drizzleCandidateApplicationRepository:
    mocked.drizzleCandidateApplicationRepository,
}));

vi.mock("../../repositories/drizzle-onboarding-player-intake-handoff.repository", () => ({
  drizzleOnboardingPlayerIntakeHandoffRepository:
    mocked.drizzleOnboardingPlayerIntakeHandoffRepository,
}));

import { onboardingRoutes } from "./onboarding.routes";

describe("onboarding routes", () => {
  const signToken = (sid: string) =>
    jwt.sign({ sid, jti: `${sid}-token` }, "test-secret");

  const registerSession = (sid: string, permissions: string[]) => {
    upsertAuthSession({
      id: sid,
      principalId: "reviewer-1",
      status: "ACTIVE",
      effectivePermissions: permissions,
    });
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
    clearAuthSessions();

    mocked.getOnboardingFlowUseCase.mockResolvedValue({
      regulationVersion: "2026-04",
      groups: [],
      acceptanceRequired: true,
      lgpdConsentRequired: true,
    });

    mocked.submitCandidateApplicationUseCase.mockReturnValue(
      mocked.submitHandler,
    );
    mocked.listCandidateApplicationsUseCase.mockReturnValue(mocked.listHandler);
    mocked.getCandidateApplicationByIdUseCase.mockReturnValue(
      mocked.getByIdHandler,
    );
    mocked.reviewCandidateApplicationUseCase.mockReturnValue(
      mocked.reviewHandler,
    );

    mocked.submitHandler.mockResolvedValue({
      id: "c1",
      status: "SUBMITTED",
      submittedAt: new Date("2026-04-08T00:00:00.000Z"),
    });
    mocked.listHandler.mockResolvedValue({
      items: [
        {
          id: "c1",
          fullName: "Player One",
          whatsapp: "5511999999999",
          email: "player-one@test.com",
          status: "SUBMITTED",
          submittedAt: "2026-04-08T00:00:00.000Z",
          reviewedAt: null,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
    mocked.getByIdHandler.mockResolvedValue({
      id: "c1",
      fullName: "Player One",
    });
    mocked.reviewHandler.mockResolvedValue({
      id: "c1",
      status: "APPROVED",
      reviewedAt: new Date("2026-04-08T00:10:00.000Z"),
    });
  });

  it("GET /onboarding/flow returns flow payload", async () => {
    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/onboarding/flow",
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.getOnboardingFlowUseCase).toHaveBeenCalledOnce();
    expect(mocked.getOnboardingFlowUseCase).toHaveBeenCalledWith({
      regulationVersion: undefined,
    });

    await app.close();
  });

  it("GET /onboarding/flow forwards regulationVersion query", async () => {
    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/onboarding/flow?regulationVersion=2026-05",
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.getOnboardingFlowUseCase).toHaveBeenCalledWith({
      regulationVersion: "2026-05",
    });

    await app.close();
  });

  it("POST /onboarding/candidates returns 201", async () => {
    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/onboarding/candidates",
      payload: { fullName: "Player One" },
    });

    expect(response.statusCode).toBe(201);
    expect(mocked.submitCandidateApplicationUseCase).toHaveBeenCalledWith(
      mocked.drizzleCandidateApplicationRepository,
    );

    await app.close();
  });

  it("POST /onboarding/candidates maps duplicate to 409", async () => {
    mocked.submitHandler.mockRejectedValueOnce(
      new DomainError("DUPLICATE_CANDIDATE", "duplicate"),
    );

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/onboarding/candidates",
      payload: { fullName: "Player One" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: "DUPLICATE_CANDIDATE" });

    await app.close();
  });

  it("GET /admin/onboarding/candidates requires review permission", async () => {
    registerSession("sid-onboarding-missing", [
      "player-management.read.getAllPlayers",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-missing")}`,
      },
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it("GET /admin/onboarding/candidates returns paginated backlog", async () => {
    registerSession("sid-onboarding-list", [
      "player-onboarding.review.listCandidates",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates?status=SUBMITTED&page=1&limit=10",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-list")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.listHandler).toHaveBeenCalledWith({
      status: "SUBMITTED",
      page: 1,
      limit: 10,
    });

    await app.close();
  });

  it("GET /admin/onboarding/candidates/:id returns detail", async () => {
    registerSession("sid-onboarding-detail", [
      "player-onboarding.review.getCandidateDetail",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates/c1",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-detail")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.getByIdHandler).toHaveBeenCalledWith("c1");

    await app.close();
  });

  it("GET /admin/onboarding/candidates denies review-only permission", async () => {
    registerSession("sid-onboarding-list-deny", [
      "player-onboarding.review.evaluateApplication",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-list-deny")}`,
      },
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it("GET /admin/onboarding/candidates/:id denies list-only permission", async () => {
    registerSession("sid-onboarding-detail-deny", [
      "player-onboarding.review.listCandidates",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "GET",
      url: "/admin/onboarding/candidates/c1",
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-detail-deny")}`,
      },
    });

    expect(response.statusCode).toBe(403);

    await app.close();
  });

  it("PATCH /onboarding/candidates/:id/review returns 200", async () => {
    registerSession("sid-onboarding-review", [
      "player-onboarding.review.evaluateApplication",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "APPROVE" },
      headers: {
        authorization: `Bearer ${signToken("sid-onboarding-review")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mocked.reviewHandler).toHaveBeenCalledWith({
      id: "c1",
      reviewedBy: "reviewer-1",
      decision: "APPROVE",
      reviewDecisionNote: undefined,
    });

    await app.close();
  });

  // --- CO-3: POST /onboarding/candidates validation failure returns 400 ---
  it("CO-3: POST /onboarding/candidates returns 400 on validation error", async () => {
    mocked.submitHandler.mockRejectedValueOnce(
      new DomainError("VALIDATION_ERROR", "fullName is required", { field: "fullName" }),
    );

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/onboarding/candidates",
      payload: { fullName: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "fullName is required",
    });

    await app.close();
  });

  // --- CO-8: PATCH /candidates/:id/review not found returns 404 ---
  it("CO-8: PATCH /onboarding/candidates/:id/review returns 404 for unknown id", async () => {
    registerSession("sid-review-404", [
      "player-onboarding.review.evaluateApplication",
    ]);

    mocked.reviewHandler.mockRejectedValueOnce(
      new DomainError("NOT_FOUND", "Candidate application not found"),
    );

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/unknown-id/review",
      payload: { decision: "APPROVE" },
      headers: {
        authorization: `Bearer ${signToken("sid-review-404")}`,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "NOT_FOUND" });

    await app.close();
  });

  // --- RV-19 (route level): PATCH review with invalid decision returns 400 ---
  it("RV-19: PATCH /onboarding/candidates/:id/review returns 400 for invalid decision", async () => {
    registerSession("sid-review-bad", [
      "player-onboarding.review.evaluateApplication",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "INVALID" },
      headers: {
        authorization: `Bearer ${signToken("sid-review-bad")}`,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });

    await app.close();
  });

  // --- PC-5: reviewedAt populated in response ---
  it("PC-5: PATCH review response includes reviewedAt", async () => {
    registerSession("sid-review-pc5", [
      "player-onboarding.review.evaluateApplication",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "APPROVE" },
      headers: {
        authorization: `Bearer ${signToken("sid-review-pc5")}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.reviewedAt).toBeDefined();
    expect(body.id).toBe("c1");
    expect(body.status).toBe("APPROVED");

    await app.close();
  });

  // --- PC-6: reviewDecisionNote stored when provided ---
  it("PC-6: review passes note to use case when provided", async () => {
    registerSession("sid-review-note", [
      "player-onboarding.review.evaluateApplication",
    ]);

    const app = Fastify();
    await app.register(onboardingRoutes);

    await app.inject({
      method: "PATCH",
      url: "/onboarding/candidates/c1/review",
      payload: { decision: "REJECT", reviewDecisionNote: "Not ready" },
      headers: {
        authorization: `Bearer ${signToken("sid-review-note")}`,
      },
    });

    expect(mocked.reviewHandler).toHaveBeenCalledWith(
      expect.objectContaining({ reviewDecisionNote: "Not ready" }),
    );

    await app.close();
  });

  // --- PC-1/CO-2: successful submission returns SUBMITTED status ---
  it("PC-1: POST /onboarding/candidates returns id + SUBMITTED status", async () => {
    const app = Fastify();
    await app.register(onboardingRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/onboarding/candidates",
      payload: { fullName: "Player One" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBe("c1");
    expect(body.status).toBe("SUBMITTED");
    expect(body.submittedAt).toBeDefined();
    expect(body.confirmation).toBe("submitted");

    await app.close();
  });
});
