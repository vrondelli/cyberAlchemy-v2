import { DatabaseSync } from "node:sqlite";
import type { AtomicStateAndOutboxRequest, PendingOutboxMessage, TransactionalOutboxPort } from "./domain.outbox.port.js";

export const migrationSql = "CREATE TABLE IF NOT EXISTS domainspec_aggregate_state (\n  aggregate_type TEXT NOT NULL,\n  aggregate_id TEXT NOT NULL,\n  state_json TEXT NOT NULL,\n  version INTEGER NOT NULL,\n  updated_at TEXT NOT NULL,\n  PRIMARY KEY (aggregate_type, aggregate_id)\n);\nCREATE TABLE IF NOT EXISTS domainspec_outbox (\n  message_id TEXT PRIMARY KEY,\n  aggregate_type TEXT NOT NULL,\n  aggregate_id TEXT NOT NULL,\n  event_type TEXT NOT NULL,\n  payload_json TEXT NOT NULL,\n  occurred_at TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published')),\n  attempts INTEGER NOT NULL DEFAULT 0,\n  last_error TEXT\n);\nCREATE INDEX IF NOT EXISTS domainspec_outbox_pending_idx ON domainspec_outbox(status, occurred_at, message_id);\n";
type Row = { message_id: string; aggregate_type: string; aggregate_id: string; event_type: string; payload_json: string; occurred_at: string; attempts: number };

export class SqliteTransactionalOutbox implements TransactionalOutboxPort, Disposable {
  readonly database: DatabaseSync;
  constructor(path: string) { this.database = new DatabaseSync(path); this.database.exec(migrationSql); }
  commit(request: AtomicStateAndOutboxRequest, failpoint?: "after-state-write"): void {
    if (request.messages.length === 0) throw new Error("OUTBOX_MESSAGE_REQUIRED");
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.database.prepare("SELECT version FROM domainspec_aggregate_state WHERE aggregate_type = ? AND aggregate_id = ?").get(request.aggregateType, request.aggregateId) as { version: number } | undefined;
      if ((existing?.version ?? 0) !== request.expectedVersion) throw new Error("OUTBOX_VERSION_CONFLICT");
      this.database.prepare("INSERT INTO domainspec_aggregate_state (aggregate_type, aggregate_id, state_json, version, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(aggregate_type, aggregate_id) DO UPDATE SET state_json = excluded.state_json, version = excluded.version, updated_at = excluded.updated_at").run(request.aggregateType, request.aggregateId, JSON.stringify(request.state), request.expectedVersion + 1, request.messages[0].occurredAt);
      if (failpoint === "after-state-write") throw new Error("OUTBOX_FAILPOINT_AFTER_STATE_WRITE");
      const insert = this.database.prepare("INSERT INTO domainspec_outbox (message_id, aggregate_type, aggregate_id, event_type, payload_json, occurred_at) VALUES (?, ?, ?, ?, ?, ?)");
      for (const message of request.messages) insert.run(message.messageId, request.aggregateType, request.aggregateId, message.eventType, JSON.stringify(message.payload), message.occurredAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  state(aggregateType: string, aggregateId: string): { state: Readonly<Record<string, unknown>>; version: number } | null {
    const row = this.database.prepare("SELECT state_json, version FROM domainspec_aggregate_state WHERE aggregate_type = ? AND aggregate_id = ?").get(aggregateType, aggregateId) as { state_json: string; version: number } | undefined;
    return row ? { state: JSON.parse(row.state_json) as Readonly<Record<string, unknown>>, version: row.version } : null;
  }
  pending(limit = 100): readonly PendingOutboxMessage[] {
    const rows = this.database.prepare("SELECT message_id, aggregate_type, aggregate_id, event_type, payload_json, occurred_at, attempts FROM domainspec_outbox WHERE status = 'pending' ORDER BY occurred_at, message_id LIMIT ?").all(limit) as Row[];
    return rows.map((row) => ({ messageId: row.message_id, aggregateType: row.aggregate_type, aggregateId: row.aggregate_id, eventType: row.event_type, payload: JSON.parse(row.payload_json) as Readonly<Record<string, unknown>>, occurredAt: row.occurred_at, attempts: row.attempts }));
  }
  markPublished(messageId: string): void { this.database.prepare("UPDATE domainspec_outbox SET status = 'published', attempts = attempts + 1, last_error = NULL WHERE message_id = ?").run(messageId); }
  markFailed(messageId: string, error: string): void { this.database.prepare("UPDATE domainspec_outbox SET attempts = attempts + 1, last_error = ? WHERE message_id = ?").run(error, messageId); }
  close(): void { this.database.close(); }
  [Symbol.dispose](): void { this.close(); }
}
