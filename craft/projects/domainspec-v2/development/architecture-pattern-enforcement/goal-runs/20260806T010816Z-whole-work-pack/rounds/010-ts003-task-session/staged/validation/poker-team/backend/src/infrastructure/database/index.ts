import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://admin:password@localhost:5439/poker_team",
});

export const db = drizzle(pool, { schema });
