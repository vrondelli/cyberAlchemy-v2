import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  AtomicFileRecordStore,
  canonicalBytes,
  sealRecord,
} from "../index.mjs";

test("atomic file store preserves exact canonical bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "semantic-evaluator-store-"));
  const store = new AtomicFileRecordStore(root);
  const record = sealRecord({
    record_type: "TestRecord",
    schema_version: "1.0.0",
    run_id: "atomic-store-test",
    created_at: "2026-07-23T12:00:00.000Z",
    producer: "store-test@1",
    input_digests: [],
    value: { z: 1, a: 2 },
  });
  const persisted = await store.persist("test-record", record);
  assert.deepEqual(await readFile(persisted.path), canonicalBytes(record));
});

test("atomic file store failure injection does not report a persisted record", async () => {
  const root = await mkdtemp(join(tmpdir(), "semantic-evaluator-store-"));
  const store = new AtomicFileRecordStore(root, {
    failStage: "before-rename:test-record",
  });
  const record = sealRecord({
    record_type: "TestRecord",
    schema_version: "1.0.0",
    run_id: "atomic-store-failure-test",
    created_at: "2026-07-23T12:00:00.000Z",
    producer: "store-test@1",
    input_digests: [],
    value: true,
  });
  await assert.rejects(() => store.persist("test-record", record));
  assert.deepEqual(store.records, []);
});
