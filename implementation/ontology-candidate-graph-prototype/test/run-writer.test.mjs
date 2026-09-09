import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { evaluatePokerTeamO13 } from "../src/cli.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function snapshot(dir) {
  const entries = (await readdir(dir)).sort();
  return Object.fromEntries(
    await Promise.all(entries.map(async (name) => [name, sha(await readFile(join(dir, name)))])),
  );
}

test("writes the exact four-file Poker Team bundle and bindings", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-writer-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const outDir = join(parent, "run");
  await evaluatePokerTeamO13({ outDir, receiptContext: { task_id: "T", swu_id: "S" } });
  assert.deepEqual((await readdir(outDir)).sort(), [
    "digest-map.v1.json",
    "projection.v1.json",
    "result.v1.json",
    "terminal-receipt.json",
  ]);
  const receipt = JSON.parse(await readFile(join(outDir, "terminal-receipt.json"), "utf8"));
  for (const artifact of receipt.artifacts) {
    assert.equal(sha(await readFile(join(outDir, artifact.path))), artifact.sha256);
  }
  const result = JSON.parse(await readFile(join(outDir, "result.v1.json"), "utf8"));
  assert.equal(result.evaluation.graph_disposition.disposition, "policy-pass");
  assert.deepEqual(result.evaluation.non_composing_conflicts, ["E5"]);
});

test("collision refuses overwrite and preserves exact bytes", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-collision-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const outDir = join(parent, "run");
  await evaluatePokerTeamO13({ outDir });
  const before = await snapshot(outDir);
  await assert.rejects(evaluatePokerTeamO13({ outDir }), /EEXIST/);
  assert.deepEqual(await snapshot(outDir), before);
});

test("injected pre-receipt failure publishes no terminal receipt", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-failure-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const outDir = join(parent, "run");
  await assert.rejects(
    evaluatePokerTeamO13({ outDir, failBeforeReceipt: true }),
    /INJECTED_PRE_RECEIPT_FAILURE/,
  );
  assert.deepEqual((await readdir(outDir)).sort(), [
    "digest-map.v1.json",
    "projection.v1.json",
    "result.v1.json",
  ]);
});

test("comparison bodies are stable across run metadata", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-stable-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const first = join(parent, "first");
  const second = join(parent, "second");
  await evaluatePokerTeamO13({ outDir: first, runMetadata: { run_id: "A", time: "one" } });
  await evaluatePokerTeamO13({ outDir: second, runMetadata: { run_id: "B", time: "two" } });
  for (const name of ["digest-map.v1.json", "projection.v1.json", "result.v1.json"]) {
    assert.equal(await readFile(join(first, name), "utf8"), await readFile(join(second, name), "utf8"));
  }
});
