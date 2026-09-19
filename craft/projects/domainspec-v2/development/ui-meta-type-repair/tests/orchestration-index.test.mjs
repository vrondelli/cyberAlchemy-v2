import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createOrchestrationIndexEntry } from "../orchestration/index-entry.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(resolve(root, "fixtures/contracts/orchestration-index-entry.json"), "utf8"));

function clone(value) {
  return structuredClone(value);
}

function identicalReplay(records = fixture.records) {
  return {
    status: "identical",
    checks: Object.entries(records).map(([plane, record]) => ({
      plane,
      expected_content_digest: record.content_digest,
      observed_content_digest: record.content_digest,
      expected_generation_id: record.generation_id,
      observed_generation_id: record.generation_id,
      match: true,
    })),
  };
}

test("initial index entry stores handles and no copied authority record", () => {
  const entry = createOrchestrationIndexEntry({ ...fixture, replay: identicalReplay() });
  assert.equal(entry.semantic.replay.status, "identical");
  assert.equal(entry.semantic.predecessor_generation_id, null);
  assert.equal(Object.hasOwn(entry.semantic, "owner_decision"), false);
  assert.equal(entry.semantic.authority_boundary, "mechanical-index-is-not-authority-or-owner-adjudication");
});

test("missing required handles fail closed", () => {
  for (const plane of Object.keys(fixture.records)) {
    const missing = clone(fixture);
    delete missing.records[plane];
    assert.throws(() => createOrchestrationIndexEntry({ ...missing, replay: identicalReplay(missing.records) }), /is invalid/, plane);
  }
});

test("main predecessor forks require an explicit non-main branch identity", () => {
  const expectedHead = `generation:sha256:${"1".repeat(64)}`;
  const other = `generation:sha256:${"2".repeat(64)}`;
  const fork = { ...fixture, predecessor_generation_id: other, replay: identicalReplay() };
  assert.throws(() => createOrchestrationIndexEntry(fork, { expectedHead }), /fork requires an explicit non-main branch identity/);
  const branch = createOrchestrationIndexEntry({ ...fork, branch_id: "experiment/alternate-input" }, { expectedHead });
  assert.equal(branch.semantic.branch_id, "experiment/alternate-input");
});

test("volatile creation time does not change index identity", () => {
  const base = { ...fixture, replay: identicalReplay() };
  const first = createOrchestrationIndexEntry({ ...base, created_at: "2026-01-01T00:00:00Z" });
  const second = createOrchestrationIndexEntry({ ...base, created_at: "2027-01-01T00:00:00Z" });
  assert.equal(first.content_digest, second.content_digest);
  assert.equal(first.record_id, second.record_id);
  assert.equal(first.generation_id, second.generation_id);
});

test("replay mismatch requires an explained successor invalidation", () => {
  const predecessor = `generation:sha256:${"3".repeat(64)}`;
  const replay = identicalReplay();
  replay.status = "invalidated";
  replay.checks[0].observed_content_digest = `sha256:${"4".repeat(64)}`;
  replay.checks[0].match = false;
  const changed = { ...fixture, predecessor_generation_id: predecessor, replay };
  assert.throws(() => createOrchestrationIndexEntry(changed, { expectedHead: predecessor }), /requires explained invalidation/);
  const successor = createOrchestrationIndexEntry({
    ...changed,
    invalidation: { invalidated_generation_id: predecessor, reason: "mutation producer content changed under a versioned input" },
  }, { expectedHead: predecessor });
  assert.equal(successor.semantic.replay.status, "invalidated");
  assert.equal(successor.predecessor_generation_id, predecessor);
});

test("full mechanical replay appends once and refuses in-place mutation", () => {
  const outDir = mkdtempSync(resolve(tmpdir(), "uir-index-"));
  try {
    const command = [resolve(root, "orchestration/build-index-generation.mjs"), "--out-dir", outDir];
    const first = spawnSync(process.execPath, command, { encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: appended identical orchestration index generation/);
    const target = resolve(outDir, "entry.json");
    const before = readFileSync(target, "utf8");
    const second = spawnSync(process.execPath, command, { encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /NO-OP: immutable orchestration index generation/);
    assert.equal(readFileSync(target, "utf8"), before);

    const tampered = JSON.parse(before);
    tampered.content_digest = `sha256:${"f".repeat(64)}`;
    writeFileSync(target, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");
    const conflict = spawnSync(process.execPath, command, { encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
    assert.notEqual(conflict.status, 0);
    assert.match(conflict.stderr, /refusing to update orchestration index generation in place/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
