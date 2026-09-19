import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { httpServerRequestDuration } from "./instruments";

/**
 * Fastify plugin that records HTTP server request duration using OTel semantic conventions.
 * Maps to O8 (Endpoint SLOs) via http.server.request.duration histogram.
 */
export const metricsPlugin = async (app: FastifyInstance) => {
  app.addHook("onRequest", async (request: FastifyRequest) => {
    (request as any).__otel_start = performance.now();
  });

  app.addHook(
    "onResponse",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const start = (request as any).__otel_start as number | undefined;
      if (start == null) return;

      const durationSec = (performance.now() - start) / 1000;

      httpServerRequestDuration.record(durationSec, {
        "http.request.method": request.method,
        "url.path": request.routeOptions?.url ?? request.url,
        "http.response.status_code": reply.statusCode,
        feature: resolveFeature(request.routeOptions?.url ?? request.url),
      });
    },
  );
};

/**
 * Maps a route URL to a feature name based on path prefix.
 */
const resolveFeature = (path: string): string => {
  if (path.startsWith("/players") && path.includes("/makeup"))
    return "player-makeup";
  if (path.startsWith("/players") && path.includes("/progression"))
    return "player-progression";
  if (path.startsWith("/players") && path.includes("/onboarding"))
    return "player-onboarding";
  if (path.startsWith("/players")) return "player-management";
  if (path.startsWith("/player-stats")) return "player-stats";
  if (path.startsWith("/settlements")) return "financial-settlement";
  if (path.startsWith("/auth")) return "auth-access-control";
  if (path.startsWith("/coaches")) return "player-management";
  if (path.startsWith("/onboarding")) return "player-onboarding";
  return "unknown";
};
