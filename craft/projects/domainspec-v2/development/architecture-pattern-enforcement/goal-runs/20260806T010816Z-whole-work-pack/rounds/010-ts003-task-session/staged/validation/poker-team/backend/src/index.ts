import { initTelemetry } from "./infrastructure/telemetry/setup";
import { buildApp } from "./infrastructure/http/app";
import { runMigrations } from "./infrastructure/database/migrate";
import { seedSystemBootstrap } from "./use-cases/auth-access-control/seed-system-bootstrap";
import {
  createDrizzlePrincipalRepository,
  createDrizzlePermissionGrantRepository,
} from "./infrastructure/repositories/drizzle-auth.repository";

initTelemetry();

const start = async () => {
  try {
    // 1. Run database migrations before anything else
    await runMigrations();

    // 2. Bootstrap: seed admin + role grants before accepting traffic
    const principalRepo = createDrizzlePrincipalRepository();
    const grantRepo = createDrizzlePermissionGrantRepository();
    await seedSystemBootstrap({ principalRepo, grantRepo });

    const app = await buildApp();
    await app.listen({ port: 3001, host: "0.0.0.0" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
