import type { OutboxTransport } from "./domain.outbox.port.js";
import type { SqliteTransactionalOutbox } from "./domain.outbox.sqlite.js";

export class TransactionalOutboxWorker {
  constructor(private readonly outbox: SqliteTransactionalOutbox, private readonly transport: OutboxTransport) {}
  async dispatchPending(limit = 100): Promise<{ published: number; failed: number }> {
    let published = 0; let failed = 0;
    for (const message of this.outbox.pending(limit)) {
      try { await this.transport.publish(message); this.outbox.markPublished(message.messageId); published += 1; }
      catch (error) { this.outbox.markFailed(message.messageId, error instanceof Error ? error.message : String(error)); failed += 1; }
    }
    return { published, failed };
  }
}
