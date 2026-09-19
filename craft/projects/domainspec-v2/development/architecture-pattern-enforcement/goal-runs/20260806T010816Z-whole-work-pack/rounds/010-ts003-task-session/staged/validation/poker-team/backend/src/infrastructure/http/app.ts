import Fastify from "fastify";
import cors from "@fastify/cors";
import { playerRoutes } from "./routes/player.routes";
import { playerStatsRoutes } from "./routes/player-stats.routes";
import { settlementRoutes } from "./routes/settlement.routes";
import { makeupRoutes } from "./routes/makeup.routes";
import { onboardingRoutes } from "./routes/onboarding.routes";
import { authRoutes } from "./routes/auth.routes";
import { coachRoutes } from "./routes/coach.routes";
import { metricsPlugin } from "../telemetry/metrics-plugin";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(metricsPlugin);
  app.register(playerRoutes, { prefix: "/players" });
  app.register(makeupRoutes, { prefix: "/players" });
  app.register(onboardingRoutes);
  app.register(playerStatsRoutes, { prefix: "/player-stats" });
  app.register(settlementRoutes, { prefix: "/settlements" });
  app.register(authRoutes, { prefix: "/auth" });
  app.register(coachRoutes, { prefix: "/coaches" });

  return app;
};
