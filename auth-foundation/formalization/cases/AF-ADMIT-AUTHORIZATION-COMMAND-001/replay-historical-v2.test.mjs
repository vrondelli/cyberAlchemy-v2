import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import test from "node:test";

import { RUST_CRATE_FILES, replayHistoricalV2, stageRustCrates,
  verifyPinnedHistoricalFile } from "./replay-historical-v2.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const outputs = ["TDE-BINDINGS.v2.json", "TDE-CASES.v2.json", "TDE-EVALUATIONS.v2.json",
  "TDE-EVIDENCE.v2.json", "TDE-MUTATION-EVIDENCE.v2.json", "TDE-OBSERVATIONS.v2.json",
  "TDE-PROOF-RECEIPT.v2.json", "derive-tests.ts"];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const hashes = () => Object.fromEntries(outputs.map(name => [name, sha(readFileSync(join(root, name)))]));

test("unchanged v2 derivation replays in an isolated former layout without rewriting history", () => {
  const before = hashes();
  const result = replayHistoricalV2();
  assert.equal(result.result, "pass");
  assert.equal(result.case_count, 8);
  assert.equal(result.historical_v2_bytes, "unchanged");
  assert.equal(result.evidence_sha256, before["TDE-EVIDENCE.v2.json"]);
  assert.deepEqual(hashes(), before);
}, { timeout: 120_000 });

test("CLI rejects options outside archival replay", () => {
  const result = spawnSync(process.execPath, [join(root, "replay-historical-v2.mjs"), "--write"],
    { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage:/);
});

test("a narrowed W7 or clause-admission manifest fails the exact historical pin", () => {
  for (const name of ["W7-PREIMAGE-MANIFEST.v2.json", "SFOL-CLAUSE-ADMISSION-MANIFEST.v1.json"]) {
    const original = readFileSync(join(root, name));
    verifyPinnedHistoricalFile(name, original);
    assert.throws(() => verifyPinnedHistoricalFile(name, Buffer.from("{}\n")),
      /HISTORICAL_V2_BYTES_DRIFT/);
  }
});

test("Rust staging excludes unselected Cargo configuration", () => {
  const temp = mkdtempSync(join(tmpdir(), "auth-sfol-crate-selection-"));
  try {
    const source = join(temp, "source"), staged = join(temp, "staged");
    for (const path of RUST_CRATE_FILES) {
      const target = join(source, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, "selected\n");
    }
    const extra = "implementation/sfol-conformance/.cargo/config.toml";
    mkdirSync(dirname(join(source, extra)), { recursive: true });
    writeFileSync(join(source, extra), "[build]\nrustflags = ['unexpected']\n");
    stageRustCrates(source, staged);
    assert.equal(existsSync(join(staged, extra)), false);
    assert.equal(RUST_CRATE_FILES.every(path => existsSync(join(staged, path))), true);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
