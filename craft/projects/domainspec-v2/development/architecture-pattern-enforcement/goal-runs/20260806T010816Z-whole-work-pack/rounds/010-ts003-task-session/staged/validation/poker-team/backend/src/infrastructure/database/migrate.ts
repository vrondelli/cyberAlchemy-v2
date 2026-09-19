import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import path from "path";

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(__dirname, "../../../drizzle");
  console.log(`Running migrations from ${migrationsFolder}...`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations completed.");
}

// Allow running directly via: node dist/infrastructure/database/migrate.js
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
