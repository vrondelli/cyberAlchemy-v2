import { FastifyInstance } from "fastify";
import { ensureAuthenticated, requirePermission } from "../auth/auth.guard";
import { logoutUseCase } from "../../../use-cases/auth-access-control/logout";
import { introspectTokenUseCase } from "../../../use-cases/auth-access-control/introspect-token";
import { getPermissionCatalogUseCase } from "../../../use-cases/auth-access-control/get-permission-catalog";
import {
  issueAccessTokenUseCase,
  loginUseCase,
} from "../../../use-cases/auth-access-control/login";
import {
  createDrizzlePrincipalRepository,
  createDrizzleSessionRepository,
  createDrizzleTokenRepository,
  createDrizzlePermissionGrantRepository,
} from "../../repositories/drizzle-auth.repository";

const principalRepo = createDrizzlePrincipalRepository();
const sessionRepo = createDrizzleSessionRepository();
const tokenRepo = createDrizzleTokenRepository();
const grantRepo = createDrizzlePermissionGrantRepository();

const MIN_TOKEN_TTL_SECONDS = 60;
const MAX_TOKEN_TTL_SECONDS = 86400;

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/login — public
  fastify.post("/login", async (request, reply) => {
    const { identifier, secret, context } = request.body as {
      identifier?: string;
      secret?: string;
      context?: Record<string, unknown>;
    };

    if (!identifier || !secret) {
      return reply.status(422).send({
        code: "VALIDATION_ERROR",
        message: "Missing identifier or secret",
      });
    }

    try {
      const login = loginUseCase(
        principalRepo,
        sessionRepo,
        tokenRepo,
        grantRepo,
      );
      const result = await login({ identifier, secret, context });

      return reply.status(200).send({
        accessToken: result.accessToken,
        expiresAt: result.expiresAt.toISOString(),
        sessionId: result.sessionId,
      });
    } catch (error: any) {
      if (error.name === "AuthValidationError") {
        const status =
          error.code === "PRINCIPAL_DISABLED" || error.code === "FORBIDDEN"
            ? 403
            : 401;
        return reply.status(status).send({
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }
      return reply
        .status(500)
        .send({ code: "INTERNAL_ERROR", message: "Unexpected error" });
    }
  });

  // POST /auth/token — requires an authenticated session
  fastify.post(
    "/token",
    { preHandler: ensureAuthenticated },
    async (request, reply) => {
      const authData = (request as any).authUserData;
      const { sessionId, ttlSeconds } = request.body as {
        sessionId?: string;
        ttlSeconds?: number;
      };

      const targetSessionId = sessionId || authData?.sessionId;
      if (!targetSessionId) {
        return reply.status(422).send({
          code: "VALIDATION_ERROR",
          message: "Missing sessionId",
        });
      }

      if (
        typeof ttlSeconds !== "number" ||
        !Number.isInteger(ttlSeconds) ||
        ttlSeconds < MIN_TOKEN_TTL_SECONDS ||
        ttlSeconds > MAX_TOKEN_TTL_SECONDS
      ) {
        return reply.status(422).send({
          code: "VALIDATION_ERROR",
          message: `ttlSeconds must be an integer between ${MIN_TOKEN_TTL_SECONDS} and ${MAX_TOKEN_TTL_SECONDS}`,
        });
      }

      try {
        const issueAccessToken = issueAccessTokenUseCase(sessionRepo, tokenRepo);
        const result = await issueAccessToken({
          sessionId: targetSessionId,
          ttlSeconds,
        });

        return reply.status(200).send({
          accessToken: result.accessToken,
          expiresAt: result.expiresAt.toISOString(),
          tokenType: "Bearer",
        });
      } catch (error: any) {
        if (error.name === "AuthValidationError") {
          const status =
            error.code === "AUTH_REQUIRED"
              ? 401
              : error.code === "FORBIDDEN"
                ? 403
                : 422;

          return reply.status(status).send({
            code: error.code,
            message: error.message,
            details: error.details,
          });
        }

        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Unexpected error" });
      }
    },
  );

  // POST /auth/logout — requires auth
  fastify.post(
    "/logout",
    { preHandler: ensureAuthenticated },
    async (request, reply) => {
      const authData = (request as any).authUserData;
      const { sessionId, tokenId, revokeAllSessionTokens } = request.body as {
        sessionId?: string;
        tokenId?: string;
        revokeAllSessionTokens?: boolean;
      };

      const targetSessionId = sessionId || authData?.sessionId;
      if (!targetSessionId) {
        return reply.status(422).send({
          code: "VALIDATION_ERROR",
          message: "Missing sessionId",
        });
      }

      try {
        const logout = logoutUseCase(sessionRepo, tokenRepo);
        await logout({
          sessionId: targetSessionId,
          callerId: authData.userId,
          callerPermissions: authData.permissions,
          tokenId,
          revokeAllSessionTokens,
        });

        return reply.status(200).send({ status: "ok" });
      } catch (error: any) {
        if (error.name === "AuthValidationError") {
          const status = error.code === "FORBIDDEN" ? 403 : 401;
          return reply.status(status).send({
            code: error.code,
            message: error.message,
          });
        }
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Unexpected error" });
      }
    },
  );

  // GET /auth/introspect — requires introspect permission
  fastify.get(
    "/introspect",
    {
      preHandler: requirePermission("auth-access-control.read.introspectToken"),
    },
    async (request, reply) => {
      const { token } = request.query as { token?: string };

      if (!token) {
        return reply.status(422).send({
          code: "VALIDATION_ERROR",
          message: "Missing token query parameter",
        });
      }

      const introspect = introspectTokenUseCase(sessionRepo, tokenRepo);
      const result = await introspect({ token });

      return reply.status(200).send(result);
    },
  );

  // GET /auth/permissions — requires admin permission
  fastify.get(
    "/permissions",
    { preHandler: requirePermission("auth-access-control.admin.*") },
    async (request, reply) => {
      const { namespace, includeDeprecated } = request.query as {
        namespace?: string;
        includeDeprecated?: string;
      };

      const catalog = getPermissionCatalogUseCase(grantRepo);
      const result = await catalog({
        namespace,
        includeDeprecated: includeDeprecated === "true",
      });

      return reply.status(200).send(result);
    },
  );
}
