import pg from "pg";
import { createHash } from "node:crypto";
export async function postgresStore(url) {
  const db = new pg.Client({ connectionString: url });
  await db.connect();
  const locked = await db.query(
    "SELECT pg_try_advisory_lock(6671219001) AS locked",
  );
  if (!locked.rows[0].locked) {
    await db.end();
    throw Error("purchase store already has a writer");
  }
  await db.query(
    "CREATE TABLE IF NOT EXISTS exchange_purchase_documents (kind text NOT NULL, id text NOT NULL, body jsonb NOT NULL, PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS exchange_purchase_events (seq bigserial PRIMARY KEY, kind text NOT NULL, id text NOT NULL, digest text NOT NULL, previous text NOT NULL)",
  );
  return {
    async get(kind, id) {
      return (
        (
          await db.query(
            "SELECT body FROM exchange_purchase_documents WHERE kind=$1 AND id=$2",
            [kind, id],
          )
        ).rows[0]?.body ?? null
      );
    },
    async list(kind) {
      return (
        await db.query(
          "SELECT body FROM exchange_purchase_documents WHERE kind=$1 ORDER BY id",
          [kind],
        )
      ).rows.map((r) => r.body);
    },
    async put(kind, id, body) {
      await db.query("BEGIN");
      try {
        const previous =
          (
            await db.query(
              "SELECT digest FROM exchange_purchase_events ORDER BY seq DESC LIMIT 1",
            )
          ).rows[0]?.digest ?? "0".repeat(64);
        const digest = createHash("sha256")
          .update(JSON.stringify([kind, id, body, previous]))
          .digest("hex");
        await db.query(
          "INSERT INTO exchange_purchase_documents VALUES($1,$2,$3) ON CONFLICT(kind,id) DO UPDATE SET body=EXCLUDED.body",
          [kind, id, body],
        );
        await db.query(
          "INSERT INTO exchange_purchase_events(kind,id,digest,previous) VALUES($1,$2,$3,$4)",
          [kind, id, digest, previous],
        );
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    },
    async close() {
      await db.end();
    },
  };
}
