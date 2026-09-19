import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const builder = join(root, "evidence/build-dossier-v2-generation.mjs");

test("dossier v2 publishes DEFER, replays, and refuses overwrite", () => {
  const outDir = mkdtempSync(join(tmpdir(), "uir-d2-"));
  try {
    let run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const target = join(outDir, "dossier.json");
    const dossier = JSON.parse(readFileSync(target));
    assert.equal(dossier.semantic.outcome, "DEFER");
    assert.deepEqual(dossier.semantic.conjuncts.map((entry) => entry.state), ["missing", "missing", "missing", "missing", "pass", "pass", "missing", "pass"]);
    run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.equal(run.status, 0);
    assert.match(run.stdout, /NO-OP/);
    dossier.content_digest = `sha256:${"f".repeat(64)}`;
    writeFileSync(target, JSON.stringify(dossier));
    run = spawnSync(process.execPath, [builder, "--out-dir", outDir], { encoding: "utf8" });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /refusing to overwrite/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
