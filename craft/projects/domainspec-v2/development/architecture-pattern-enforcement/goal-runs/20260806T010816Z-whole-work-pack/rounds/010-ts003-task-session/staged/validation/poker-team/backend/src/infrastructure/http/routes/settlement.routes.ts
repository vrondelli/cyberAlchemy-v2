import { FastifyInstance } from "fastify";
import { generateSettlementUseCase } from "../../../use-cases/financial-settlement/generate-settlement";
import { getSettlementPreviewUseCase } from "../../../use-cases/financial-settlement/get-settlement-preview";
import { drizzlePlayerStatsRepository } from "../../repositories/drizzle-player-stats.repository";
import { drizzleFinancialUnitOfWork } from "../../repositories/drizzle-financial-unit-of-work";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";
import { drizzleTransactionRepository } from "../../repositories/drizzle-transaction.repository";
import { requirePermission } from "../auth/auth.guard";

export async function settlementRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      preHandler: requirePermission(
        "financial-settlement.write.generateSettlement",
      ),
    },
    async (request, reply) => {
      const { playerId, startDate, endDate } = request.body as {
        playerId: string;
        startDate: string;
        endDate: string;
      };

      if (!playerId || !startDate || !endDate) {
        return reply.status(400).send({
          code: "VALIDATION_ERROR",
          message: "playerId, startDate, and endDate are required",
        });
      }

      const generateSettlement = generateSettlementUseCase(
        drizzlePlayerStatsRepository,
        drizzlePlayerRepository,
        drizzleTransactionRepository,
        drizzleFinancialUnitOfWork,
      );

      try {
        const result = await generateSettlement(playerId, startDate, endDate);
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return reply.status(404).send({
            code: "PLAYER_NOT_FOUND",
            message: "Player not found",
          });
        }

        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Unexpected server error",
        });
      }
    },
  );

  fastify.get(
    "/preview",
    {
      preHandler: requirePermission(
        "financial-settlement.read.getSettlementPreview",
      ),
    },
    async (request, reply) => {
      const { playerId, startDate, endDate } = request.query as {
        playerId?: string;
        startDate?: string;
        endDate?: string;
      };

      if (!playerId || !startDate || !endDate) {
        return reply.status(400).send({
          code: "VALIDATION_ERROR",
          message: "playerId, startDate, and endDate are required",
        });
      }

      try {
        const preview = getSettlementPreviewUseCase(
          drizzlePlayerStatsRepository,
          drizzlePlayerRepository,
          drizzleTransactionRepository,
        );
        const result = await preview(playerId, startDate, endDate);
        return reply.send({
          ...result,
          projectedNewMakeup: result.newMakeup,
          projectedPayout: result.totalPayout,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return reply.status(404).send({
            code: "PLAYER_NOT_FOUND",
            message: "Player not found",
          });
        }
        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Unexpected server error",
        });
      }
    },
  );
}
