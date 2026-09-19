import { FastifyInstance } from "fastify";
import { z } from "zod";
import { recordPlayerStatsUseCase } from "../../../use-cases/player-stats/record-player-stats";
import { getPlayerStatsHistoryUseCase } from "../../../use-cases/player-stats/get-player-stats-history";
import { getPlayerStatsWindowUseCase } from "../../../use-cases/player-stats/get-player-stats-window";
import { drizzlePlayerStatsRepository } from "../../repositories/drizzle-player-stats.repository";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";
import { DomainError } from "../../../domain/errors";
import {
  toHistoryItem,
  toWindowProjection,
} from "../mappings/player-stats.mappings";
import { requirePermission } from "../auth/auth.guard";
import {
  enforceVisibility,
  VisibilityError,
  type AuthenticatedRequest,
} from "../middleware/visibility.middleware";

const recordStatsSchema = z.object({
  playerId: z.string().uuid(),
  statDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hands: z.number().int().min(0),
  profit: z.number(),
  rakeback: z.number(),
  rake: z.number().min(0),
  closingBankroll: z.number(),
  sessionDuration: z.number().int().min(0),
  sourceType: z.enum(["MANUAL", "IMPORT", "API"]),
});

const historyQuerySchema = z.object({
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

const windowQuerySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currentLimit: z.string().optional(),
});

function handleError(
  error: unknown,
  reply: FastifyInstance["server"] extends any ? any : never,
) {
  if (error instanceof VisibilityError) {
    return reply
      .status(403)
      .send({ error: "FORBIDDEN", message: "Missing required permission" });
  }
  if (error instanceof DomainError) {
    const statusMap: Record<string, number> = {
      PLAYER_NOT_FOUND: 404,
      VALIDATION_ERROR: 400,
      NO_CHANGES_DETECTED: 400,
    };
    const status = statusMap[error.code] ?? 400;
    return reply
      .status(status)
      .send({ error: error.code, message: error.message });
  }
  if (error instanceof z.ZodError) {
    return reply
      .status(400)
      .send({ error: "VALIDATION_ERROR", message: error.issues });
  }
  throw error;
}

export async function playerStatsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    { preHandler: requirePermission("player-stats.write.recordPlayerStats") },
    async (request, reply) => {
      try {
        const input = recordStatsSchema.parse(request.body);
        const recordStats = recordPlayerStatsUseCase(
          drizzlePlayerStatsRepository,
          drizzlePlayerRepository,
        );
        const result = await recordStats(input);
        return reply.status(200).send({
          id: result.snapshot.id,
          playerId: result.snapshot.playerId,
          statDate: result.snapshot.statDate,
          status: result.snapshot.status,
          action: result.action,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  fastify.get(
    "/:playerId/history",
    {
      preHandler: requirePermission("player-stats.read.getPlayerStatsHistory"),
    },
    async (request, reply) => {
      try {
        const { playerId } = request.params as { playerId: string };
        await enforceVisibility(
          request as unknown as AuthenticatedRequest,
          playerId,
        );
        const query = historyQuerySchema.parse(request.query);
        const getHistory = getPlayerStatsHistoryUseCase(
          drizzlePlayerStatsRepository,
        );
        const result = await getHistory({ playerId, ...query });
        return reply.status(200).send({
          playerId: result.playerId,
          entries: result.entries.map(toHistoryItem),
          nextCursor: result.nextCursor,
        });
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );

  fastify.get(
    "/:playerId/window",
    { preHandler: requirePermission("player-stats.read.getPlayerStatsWindow") },
    async (request, reply) => {
      try {
        const { playerId } = request.params as { playerId: string };
        await enforceVisibility(
          request as unknown as AuthenticatedRequest,
          playerId,
        );
        const query = windowQuerySchema.parse(request.query);
        const getWindow = getPlayerStatsWindowUseCase(
          drizzlePlayerStatsRepository,
        );
        const result = await getWindow({ playerId, ...query });
        return reply.status(200).send(toWindowProjection(result));
      } catch (error) {
        return handleError(error, reply);
      }
    },
  );
}
