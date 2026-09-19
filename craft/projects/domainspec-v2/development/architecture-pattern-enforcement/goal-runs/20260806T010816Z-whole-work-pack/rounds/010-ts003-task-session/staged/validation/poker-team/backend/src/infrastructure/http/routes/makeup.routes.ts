import { FastifyInstance } from "fastify";
import { getPlayerMakeupUseCase } from "../../../use-cases/makeup/get-player-makeup";
import { adjustPlayerMakeupUseCase } from "../../../use-cases/makeup/adjust-player-makeup";
import { getPlayerMakeupHistoryUseCase } from "../../../use-cases/makeup/get-player-makeup-history";
import { getMakeupPolicyUseCase } from "../../../use-cases/makeup/get-makeup-policy";
import { setPlayerMakeupPolicyUseCase } from "../../../use-cases/makeup/set-player-makeup-policy";
import { drizzleFinancialUnitOfWork } from "../../repositories/drizzle-financial-unit-of-work";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";
import { drizzleTransactionRepository } from "../../repositories/drizzle-transaction.repository";
import { requirePermission } from "../auth/auth.guard";
import {
  enforceVisibility,
  VisibilityError,
  type AuthenticatedRequest,
} from "../middleware/visibility.middleware";

const VALID_MAKEUP_OPERATIONS = ["increase", "decrease", "set"] as const;

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

const replyError = (
  reply: {
    status: (code: number) => { send: (payload: ErrorPayload) => unknown };
  },
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) => {
  return reply.status(statusCode).send({ code, message, details });
};

export async function makeupRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:id/makeup",
    { preHandler: requirePermission("player-makeup.read.viewMakeup") },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await enforceVisibility(request as unknown as AuthenticatedRequest, id);
        const getMakeup = getPlayerMakeupUseCase(drizzlePlayerRepository);
        const result = await getMakeup(id);
        return reply.send(result);
      } catch (error) {
        if (error instanceof VisibilityError) {
          return replyError(
            reply,
            403,
            "FORBIDDEN",
            "Missing required permission",
            {
              required: "player-makeup.write.manageMakeup",
            },
          );
        }

        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", error.message);
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.patch(
    "/:id/makeup",
    { preHandler: requirePermission("player-makeup.write.manageMakeup") },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          operation?: unknown;
          amount?: unknown;
          reasonCode?: unknown;
          sourceChannel?: unknown;
        };

        const actorId = (request as any).user?.sub as string | undefined;
        const requestId = (request as any).id as string | undefined;

        if (
          typeof body.operation !== "string" ||
          !VALID_MAKEUP_OPERATIONS.includes(body.operation as any) ||
          typeof body.amount !== "number" ||
          typeof body.reasonCode !== "string"
        ) {
          return replyError(
            reply,
            400,
            "VALIDATION_ERROR",
            "operation, amount, and reasonCode are required",
            {
              operation: "increase | decrease | set",
              amount: "number",
              reasonCode: "string",
            },
          );
        }

        if (typeof actorId !== "string" || !requestId) {
          return replyError(
            reply,
            500,
            "INTERNAL_ERROR",
            "Missing audit actor context",
          );
        }

        const adjustMakeup = adjustPlayerMakeupUseCase(
          drizzlePlayerRepository,
          drizzleTransactionRepository,
          drizzleFinancialUnitOfWork,
        );

        const result = await adjustMakeup({
          playerId: id,
          operation: body.operation as "increase" | "decrease" | "set",
          amount: body.amount,
          actorId,
          requestId,
          reasonCode: body.reasonCode,
          sourceChannel:
            typeof body.sourceChannel === "string" ? body.sourceChannel : "api",
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", error.message);
        }

        if (error instanceof Error && error.message === "Invalid amount") {
          return replyError(reply, 400, "VALIDATION_ERROR", error.message);
        }

        if (
          error instanceof Error &&
          error.message === "Invalid audit metadata"
        ) {
          return replyError(reply, 400, "VALIDATION_ERROR", error.message);
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.get(
    "/:id/makeup/history",
    { preHandler: requirePermission("player-makeup.read.viewMakeup") },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await enforceVisibility(request as unknown as AuthenticatedRequest, id);
        const query = request.query as {
          limit?: string | number;
          cursor?: string;
        };
        const parsedLimit =
          query.limit === undefined
            ? undefined
            : typeof query.limit === "string"
              ? Number(query.limit)
              : query.limit;

        const getHistory = getPlayerMakeupHistoryUseCase(
          drizzlePlayerRepository,
          drizzleTransactionRepository,
        );

        const result = await getHistory({
          playerId: id,
          limit: parsedLimit,
          cursor: query.cursor,
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof VisibilityError) {
          return replyError(
            reply,
            403,
            "FORBIDDEN",
            "Missing required permission",
            {
              required: "player-makeup.write.manageMakeup",
            },
          );
        }

        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", error.message);
        }

        if (
          error instanceof Error &&
          (error.message === "Invalid limit" ||
            error.message === "Invalid cursor")
        ) {
          return replyError(reply, 400, "VALIDATION_ERROR", error.message);
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.get(
    "/makeup/policy",
    { preHandler: requirePermission("player-makeup.policy.readPolicy") },
    async (request, reply) => {
      try {
        const query = request.query as { playerId?: string };
        const result = await getMakeupPolicyUseCase(
          drizzlePlayerRepository,
          query.playerId,
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", error.message);
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  fastify.patch(
    "/:id/makeup/policy",
    { preHandler: requirePermission("player-makeup.policy.writePolicy") },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          applyProfitFirst?: unknown;
          applyRakebackSecond?: unknown;
          playerRakebackShare?: unknown;
        };

        if (
          typeof body.applyProfitFirst !== "boolean" ||
          typeof body.applyRakebackSecond !== "boolean" ||
          typeof body.playerRakebackShare !== "number"
        ) {
          return replyError(
            reply,
            400,
            "VALIDATION_ERROR",
            "applyProfitFirst, applyRakebackSecond, and playerRakebackShare are required",
            {
              applyProfitFirst: "boolean",
              applyRakebackSecond: "boolean",
              playerRakebackShare: "number",
            },
          );
        }

        const setPolicy = setPlayerMakeupPolicyUseCase(drizzlePlayerRepository);
        const result = await setPolicy({
          playerId: id,
          applyProfitFirst: body.applyProfitFirst,
          applyRakebackSecond: body.applyRakebackSecond,
          playerRakebackShare: body.playerRakebackShare,
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", error.message);
        }

        if (
          error instanceof Error &&
          error.message === "Invalid policy shape"
        ) {
          return replyError(reply, 400, "VALIDATION_ERROR", error.message);
        }

        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );
}
