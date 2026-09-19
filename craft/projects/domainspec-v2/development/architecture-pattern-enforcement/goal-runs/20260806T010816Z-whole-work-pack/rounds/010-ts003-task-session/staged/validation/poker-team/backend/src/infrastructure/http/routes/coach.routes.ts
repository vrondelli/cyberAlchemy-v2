import { FastifyInstance } from "fastify";
import { createCoachUseCase } from "../../../use-cases/coach/create-coach";
import { getAllCoachesUseCase } from "../../../use-cases/coach/get-all-coaches";
import { assignCoachUseCase } from "../../../use-cases/coach/assign-coach";
import { unassignCoachUseCase } from "../../../use-cases/coach/unassign-coach";
import { getCoachPlayersUseCase } from "../../../use-cases/coach/get-coach-players";
import { ensureAuthenticated, requirePermission } from "../auth/auth.guard";
import { drizzleCoachRepository } from "../../repositories/drizzle-coach.repository";
import { drizzleCoachAssignmentRepository } from "../../repositories/drizzle-coach-assignment.repository";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";
import {
  domainErrorToHttpStatus,
  domainErrorCode,
  domainErrorDetails,
} from "../error-mapper";

type RouteError = Error & {
  code?: string;
  details?: unknown;
};

const replyError = (
  reply: { status: (code: number) => { send: (payload: unknown) => unknown } },
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) => reply.status(statusCode).send({ code, message, details });

export async function coachRoutes(fastify: FastifyInstance) {
  // POST /coaches — Create Coach
  fastify.post(
    "/",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.write.createCoach"),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as Record<string, unknown>;
        const createCoach = createCoachUseCase(drizzleCoachRepository);
        const coach = await createCoach({
          principalId: body.principalId as string,
          name: body.name as string,
          email: body.email as string,
        });
        return reply.status(201).send(coach);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          domainErrorToHttpStatus(routeError),
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );

  // GET /coaches — List All Coaches
  fastify.get(
    "/",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.read.getAllCoaches"),
      ],
    },
    async (_request, reply) => {
      try {
        const getAll = getAllCoachesUseCase(drizzleCoachRepository);
        const coaches = await getAll();
        return reply.send(coaches);
      } catch (error) {
        return replyError(
          reply,
          500,
          "INTERNAL_ERROR",
          "Unexpected server error",
        );
      }
    },
  );

  // POST /coaches/:coachId/players/:playerId — Assign Coach
  fastify.post(
    "/:coachId/players/:playerId",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.write.assignCoach"),
      ],
    },
    async (request, reply) => {
      try {
        const { coachId, playerId } = request.params as {
          coachId: string;
          playerId: string;
        };
        const assign = assignCoachUseCase(
          drizzleCoachRepository,
          drizzlePlayerRepository,
          drizzleCoachAssignmentRepository,
        );
        const assignment = await assign({ coachId, playerId });
        return reply.status(201).send(assignment);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          domainErrorToHttpStatus(routeError),
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );

  // DELETE /coaches/:coachId/players/:playerId — Unassign Coach
  fastify.delete(
    "/:coachId/players/:playerId",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.write.unassignCoach"),
      ],
    },
    async (request, reply) => {
      try {
        const { coachId, playerId } = request.params as {
          coachId: string;
          playerId: string;
        };
        const unassign = unassignCoachUseCase(drizzleCoachAssignmentRepository);
        const result = await unassign({ coachId, playerId });
        return reply.send(result);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          domainErrorToHttpStatus(routeError),
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );

  // GET /coaches/:coachId/players — List Coach Players
  fastify.get(
    "/:coachId/players",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.read.getCoachPlayers"),
      ],
    },
    async (request, reply) => {
      try {
        const { coachId } = request.params as { coachId: string };
        const actorPrincipalId = (request as any).user?.sub as string;
        const actorPermissions = ((request as any).authUserData?.permissions ??
          []) as string[];

        const getPlayers = getCoachPlayersUseCase(
          drizzleCoachRepository,
          drizzleCoachAssignmentRepository,
          drizzlePlayerRepository,
        );

        const players = await getPlayers({
          coachId,
          actorPrincipalId,
          actorPermissions,
        });

        return reply.send(players);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          domainErrorToHttpStatus(routeError),
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );
}
