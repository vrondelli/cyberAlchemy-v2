import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runner = join(root, "mutation/run-base.mjs");

function run(outDir, extra = []) {
  return spawnSync(process.execPath, [runner, "--out-dir", outDir, ...extra], {
    cwd: resolve(root, "../../../.."),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

test("mandatory mutation ledger is complete, unique, parity-safe, and reruns as a no-op", () => {
  const out = mkdtempSync(join(tmpdir(), "uir-ledger-"));
  try {
    const first = run(out);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    assert.match(first.stdout, /published 165 immutable mutation cases/);
    const ledger = JSON.parse(readFileSync(join(out, "ledger.json"), "utf8"));
    assert.deepEqual(ledger.summary, { case_count: 165, deletion: 52, empty: 52, whitespace: 52, wrong_fixed: 9, parity_pass: 165 });
    const cases = ledger.semantic.cases;
    assert.equal(new Set(cases.map((entry) => entry.case_id)).size, 165);
    assert.ok(cases.every((entry) => entry.parity && entry.markdown.code === entry.expected.code && entry.instance.code === entry.expected.code));
    const bytes = readFileSync(join(out, "ledger.json"), "utf8");
    const second = run(out);
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.match(second.stdout, /NO-OP/);
    assert.equal(readFileSync(join(out, "ledger.json"), "utf8"), bytes);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("non-identical existing generation and predecessor changes fail closed", () => {
  const out = mkdtempSync(join(tmpdir(), "uir-ledger-conflict-"));
  try {
    const first = run(out);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    const path = join(out, "ledger.json");
    const ledger = JSON.parse(readFileSync(path, "utf8"));
    ledger.content_digest = `sha256:${"0".repeat(64)}`;
    writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
    const tampered = run(out);
    assert.equal(tampered.status, 1, tampered.stdout + tampered.stderr);
    assert.match(tampered.stderr, /refusing to overwrite non-identical/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }

  const predecessorOut = mkdtempSync(join(tmpdir(), "uir-ledger-predecessor-"));
  try {
    const first = run(predecessorOut);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    const changed = run(predecessorOut, ["--predecessor", `generation:sha256:${"1".repeat(64)}`]);
    assert.equal(changed.status, 1, changed.stdout + changed.stderr);
    assert.match(changed.stderr, /refusing to overwrite non-identical/);
  } finally {
    rmSync(predecessorOut, { recursive: true, force: true });
  }
});
