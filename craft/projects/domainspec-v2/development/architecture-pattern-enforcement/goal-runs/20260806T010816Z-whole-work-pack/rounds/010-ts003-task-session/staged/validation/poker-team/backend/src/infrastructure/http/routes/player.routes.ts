import { FastifyInstance } from "fastify";
import { createPlayerUseCase } from "../../../use-cases/player/create-player";
import { getAllPlayersUseCase } from "../../../use-cases/player/get-all-players";
import { getPlayersOverviewUseCase } from "../../../use-cases/player/get-players-overview";
import { checkProgressionUseCase } from "../../../use-cases/progression/check-progression";
import { ensureAuthenticated, requirePermission } from "../auth/auth.guard";
import { drizzlePlayerStatsRepository } from "../../repositories/drizzle-player-stats.repository";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";

type CreatePlayerPayload = {
  name: string;
  email: string;
  currentLimit: string;
  principalId?: string;
  initialBankroll?: number;
};

type RouteError = Error & {
  statusCode?: number;
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

const asRouteError = (message: string, field: string): RouteError => {
  const error = new Error(message) as RouteError;
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.details = { field };
  return error;
};

const parseCreatePlayerInput = (payload: unknown): CreatePlayerPayload => {
  if (!payload || typeof payload !== "object") {
    throw asRouteError("Invalid payload", "body");
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.name !== "string") {
    throw asRouteError("Invalid name", "name");
  }

  if (typeof body.email !== "string") {
    throw asRouteError("Invalid email", "email");
  }

  if (typeof body.currentLimit !== "string") {
    throw asRouteError("Invalid currentLimit", "currentLimit");
  }

  if (
    body.principalId !== undefined &&
    typeof body.principalId !== "string"
  ) {
    throw asRouteError("Invalid principalId", "principalId");
  }

  if (
    body.initialBankroll !== undefined &&
    typeof body.initialBankroll !== "number"
  ) {
    throw asRouteError("Invalid initialBankroll", "initialBankroll");
  }

  const input: CreatePlayerPayload = {
    name: body.name,
    email: body.email,
    currentLimit: body.currentLimit,
    initialBankroll: body.initialBankroll as number | undefined,
  };

  if (typeof body.principalId === "string") {
    input.principalId = body.principalId;
  }

  return input;
};

const parsePeriodDays = (query: unknown): number => {
  if (!query || typeof query !== "object") {
    return 30;
  }

  const { periodDays } = query as { periodDays?: unknown };
  const parsedPeriod =
    typeof periodDays === "string"
      ? Number(periodDays)
      : typeof periodDays === "number"
        ? periodDays
        : 30;

  if (!Number.isInteger(parsedPeriod) || parsedPeriod <= 0) {
    throw asRouteError("Invalid periodDays", "periodDays");
  }

  return parsedPeriod;
};

const parseProgressionPeriodDays = (query: unknown): 15 | 30 => {
  if (!query || typeof query !== "object") {
    return 15;
  }

  const { period } = query as { period?: unknown };

  if (period === undefined || period === "BI_WEEKLY") {
    return 15;
  }

  if (period === "MONTHLY") {
    return 30;
  }

  throw asRouteError("Invalid period", "period");
};

export async function playerRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.write.createPlayer"),
      ],
    },
    async (request, reply) => {
      try {
        const createUser = createPlayerUseCase(drizzlePlayerRepository);
        const input = parseCreatePlayerInput(request.body);
        const player = await createUser(input);
        return reply.status(201).send(player);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          routeError.statusCode ?? 500,
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );

  fastify.get(
    "/",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.read.getAllPlayers"),
      ],
    },
    async (_request, reply) => {
      const getAllUsers = getAllPlayersUseCase(drizzlePlayerRepository);
      const players = await getAllUsers();
      return reply.send(players);
    },
  );

  fastify.get(
    "/overview",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.read.getPlayersOverview"),
      ],
    },
    async (request, reply) => {
      try {
        const parsedPeriod = parsePeriodDays(request.query);
        const getOverview = getPlayersOverviewUseCase(
          drizzlePlayerRepository,
          drizzlePlayerStatsRepository,
        );
        const overview = await getOverview(parsedPeriod);
        return reply.send(overview);
      } catch (error) {
        const routeError = error as RouteError;
        return replyError(
          reply,
          routeError.statusCode ?? 500,
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );

  fastify.get(
    "/:id/progression",
    {
      preHandler: [
        ensureAuthenticated,
        requirePermission("player-management.read.getPlayerProgression"),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const checkProgression = checkProgressionUseCase(
          drizzlePlayerStatsRepository,
          drizzlePlayerRepository,
        );

        const periodDays = parseProgressionPeriodDays(request.query);
        const status = await checkProgression(id, periodDays);
        return reply.send(status);
      } catch (error) {
        if (error instanceof Error && error.message === "Player not found") {
          return replyError(reply, 404, "PLAYER_NOT_FOUND", "Player not found");
        }

        const routeError = error as RouteError;
        return replyError(
          reply,
          routeError.statusCode ?? 500,
          routeError.code ?? "INTERNAL_ERROR",
          routeError.message ?? "Unexpected error",
          routeError.details,
        );
      }
    },
  );
}
