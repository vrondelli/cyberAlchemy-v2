import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {createDesktopMethodTrace} from "../src/desktop-method-trace.mjs";

test("desktop method trace records only an allowed method in an existing private file", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-method-trace-"));
  try {
    const path = join(directory, "trace.jsonl");
    writeFileSync(path, "", {mode: 0o600});
    const trace = createDesktopMethodTrace(path);
    trace("initialize");
    trace("thread/start");
    assert.throws(() => trace("turn/start"), /trace-method-unsupported/);
    const records = readFileSync(path, "utf8").trim().split("\n").map(JSON.parse);
    assert.deepEqual(records.map(record => record.method), ["initialize", "thread/start"]);
    assert.ok(records.every(record => record.stage === "forwarded-to-gateway-transport"
      && record.pid === process.pid && record.parent_pid === process.ppid));
    assert.equal(JSON.stringify(records).includes("params"), false);
    assert.equal(JSON.stringify(records).includes("threadId"), false);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("desktop method trace refuses absent, public, and symlinked targets", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-method-trace-private-"));
  try {
    const path = join(directory, "trace.jsonl");
    assert.throws(() => createDesktopMethodTrace(path)("initialize"), /ENOENT/);
    writeFileSync(path, "", {mode: 0o644});
    assert.throws(() => createDesktopMethodTrace(path)("initialize"), /trace-file-not-private/);
    const link = join(directory, "trace-link.jsonl");
    symlinkSync(path, link);
    assert.throws(() => createDesktopMethodTrace(link)("initialize"), /ELOOP/);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
