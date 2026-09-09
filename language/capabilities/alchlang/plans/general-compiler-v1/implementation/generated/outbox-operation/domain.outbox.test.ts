import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SqliteTransactionalOutbox } from "./domain.outbox.sqlite.js";
import { TransactionalOutboxWorker } from "./domain.outbox.worker.js";

const request = { aggregateType: "Order", aggregateId: "order-1", state: { status: "committed" }, expectedVersion: 0, messages: [{ messageId: "message-1", eventType: "order-committed", payload: { orderId: "order-1" }, occurredAt: "2026-09-02T00:00:00.000Z" }] } as const;
test("business state and pending message commit atomically", () => {
  const store = new SqliteTransactionalOutbox(path.join(mkdtempSync(path.join(tmpdir(), "generated-outbox-")), "db.sqlite"));
  try { store.commit(request); assert.deepEqual(store.state("Order", "order-1"), { state: { status: "committed" }, version: 1 }); assert.equal(store.pending().length, 1); }
  finally { store.close(); }
});
test("failure after state write rolls back state and message", () => {
  const store = new SqliteTransactionalOutbox(path.join(mkdtempSync(path.join(tmpdir(), "generated-outbox-")), "db.sqlite"));
  try { assert.throws(() => store.commit(request, "after-state-write"), /OUTBOX_FAILPOINT/); assert.equal(store.state("Order", "order-1"), null); assert.equal(store.pending().length, 0); }
  finally { store.close(); }
});
test("delivery is at least once and retains stable message identity across retry", async () => {
  const store = new SqliteTransactionalOutbox(path.join(mkdtempSync(path.join(tmpdir(), "generated-outbox-")), "db.sqlite"));
  const seen: string[] = []; let first = true;
  try {
    store.commit(request);
    const worker = new TransactionalOutboxWorker(store, { async publish(message) { seen.push(message.messageId); if (first) { first = false; throw new Error("ack-lost"); } } });
    assert.deepEqual(await worker.dispatchPending(), { published: 0, failed: 1 });
    assert.deepEqual(await worker.dispatchPending(), { published: 1, failed: 0 });
    assert.deepEqual(seen, ["message-1", "message-1"]); assert.equal(store.pending().length, 0);
  } finally { store.close(); }
});
