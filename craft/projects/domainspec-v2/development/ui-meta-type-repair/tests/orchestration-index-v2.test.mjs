import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dossierBuilder = join(root, "evidence/build-dossier-v2-generation.mjs");
const builder = join(root, "orchestration/build-index-v2-generation.mjs");

test("index v2 publishes seven planes, replays, and refuses overwrite", () => {
  const outDir = mkdtempSync(join(tmpdir(), "uir-i2-"));
  try {
    let run = spawnSync(process.execPath, [dossierBuilder], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const target = join(outDir, "entry.json");
    const entry = JSON.parse(readFileSync(target));
    assert.equal(Object.keys(entry.semantic.record_handles).length, 7);
    assert.equal(entry.semantic.authority_boundary, "successor-index-is-handle-only-not-authority");
    run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.equal(run.status, 0);
    assert.match(run.stdout, /NO-OP/);
    entry.content_digest = `sha256:${"f".repeat(64)}`;
    writeFileSync(target, JSON.stringify(entry));
    run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /refusing to overwrite/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
