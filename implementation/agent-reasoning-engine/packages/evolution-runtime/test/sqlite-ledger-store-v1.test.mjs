import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {openSqliteEvolutionLedgerStore} from "../src/sqlite-ledger-store-v1.mjs";

const objectBytes = Buffer.from("object\n");
const objectDigest = createHash("sha256").update(objectBytes).digest("hex");
const objectKey = `objects/sha256/${objectDigest.slice(0, 2)}/${objectDigest.slice(2)}`;
const commitKey = `ledgers/commits/${"1".repeat(12)}-${"b".repeat(64)}.json`;

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), "are-sqlite-ledger-"));
  try { return run(join(root, "ledger.sqlite")); } finally { rmSync(root, {recursive: true, force: true}); }
}

test("one durable transaction contains the entries after reopen and supports exact replay", () => fixture((path) => {
  const first = openSqliteEvolutionLedgerStore({path});
  const entries = [{key: objectKey, bytes: objectBytes}, {key: commitKey, bytes: Buffer.from("commit\n")}];
  assert.deepEqual(first.writeBatch(entries), {created: 2, replayed: 0});
  assert.deepEqual(first.writeBatch(entries), {created: 0, replayed: 2});
  first.close();
  const reader = openSqliteEvolutionLedgerStore({path, read_only: true});
  assert.deepEqual(reader.list("ledgers/commits/"), [commitKey]);
  assert.equal(reader.read(objectKey).toString(), "object\n");
  assert.equal(reader.read(commitKey).toString(), "commit\n");
  assert.throws(() => reader.writeBatch(entries), /READ_ONLY/u);
  reader.close();
}));

test("a pre-commit fault and a conflicting replay leave no partial batch", () => fixture((path) => {
  const failed = openSqliteEvolutionLedgerStore({path, fault_injector: (stage) => {
    if (stage === "before-commit") throw new Error("injected-fault");
  }});
  assert.throws(() => failed.writeBatch([{key: objectKey, bytes: objectBytes},
    {key: commitKey, bytes: Buffer.from("commit\n")}]), /injected-fault/u);
  failed.close();
  const next = openSqliteEvolutionLedgerStore({path});
  assert.equal(next.read(objectKey), null);
  assert.equal(next.read(commitKey), null);
  next.writeBatch([{key: commitKey, bytes: Buffer.from("commit\n")}]);
  assert.throws(() => next.writeBatch([{key: objectKey, bytes: objectBytes},
    {key: commitKey, bytes: Buffer.from("changed\n")}]), /CONTENT_CONFLICT/u);
  assert.equal(next.read(objectKey), null);
  assert.equal(next.read(commitKey).toString(), "commit\n");
  next.close();
}));

test("an uncertain post-commit result is discoverable and replay-safe", () => fixture((path) => {
  const first = openSqliteEvolutionLedgerStore({path, fault_injector: (stage) => {
    if (stage === "after-commit") throw new Error("result-lost");
  }});
  assert.throws(() => first.writeBatch([{key: commitKey, bytes: Buffer.from("commit\n")}]), /result-lost/u);
  first.close();
  const second = openSqliteEvolutionLedgerStore({path});
  assert.equal(second.read(commitKey).toString(), "commit\n");
  assert.deepEqual(second.writeBatch([{key: commitKey, bytes: Buffer.from("commit\n")}]), {created: 0, replayed: 1});
  second.close();
}));

test("abrupt child exit rolls back before commit and preserves a committed batch", () => fixture((path) => {
  const moduleUrl = new URL("../src/sqlite-ledger-store-v1.mjs", import.meta.url).href;
  const runChild = (phase, key) => {
    const source = `import {openSqliteEvolutionLedgerStore} from ${JSON.stringify(moduleUrl)};\n`
      + `const store = openSqliteEvolutionLedgerStore({path: process.argv[1], fault_injector: (stage) => { if (stage === process.argv[2]) process.exit(83); }});\n`
      + `store.writeBatch([{key: process.argv[3], bytes: Buffer.from("child\\n")}]);`;
    return spawnSync(process.execPath, ["--input-type=module", "-e", source, path, phase, key], {encoding: "utf8"});
  };
  assert.equal(runChild("before-commit", objectKey).status, 1,
    "The test object key must reject bytes that do not match its SHA-256 digest.");
  assert.equal(runChild("before-commit", commitKey).status, 83);
  const afterRollback = openSqliteEvolutionLedgerStore({path});
  assert.equal(afterRollback.read(commitKey), null);
  afterRollback.close();
  assert.equal(runChild("after-commit", commitKey).status, 83);
  const afterCommit = openSqliteEvolutionLedgerStore({path});
  assert.equal(afterCommit.read(commitKey).toString(), "child\n");
  afterCommit.close();
}));

test("invalid keys, duplicate entries and oversized batches fail before writing", () => fixture((path) => {
  const store = openSqliteEvolutionLedgerStore({path});
  assert.throws(() => store.writeBatch([{key: "../escape", bytes: Buffer.from("x")}]), /KEY_INVALID/u);
  assert.throws(() => store.writeBatch([{key: objectKey, bytes: objectBytes},
    {key: objectKey, bytes: objectBytes}]), /DUPLICATE_KEY/u);
  assert.throws(() => store.writeBatch([{key: objectKey, bytes: Buffer.from("wrong") }]), /OBJECT_DIGEST_MISMATCH/u);
  assert.throws(() => store.writeBatch([{key: objectKey, bytes: Buffer.alloc(64 * 1024 * 1024 + 1)}]), /BATCH_TOO_LARGE/u);
  assert.deepEqual(store.list("objects/sha256/"), []);
  store.close();
}));
