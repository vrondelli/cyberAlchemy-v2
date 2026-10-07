import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

const packageRoot = resolve(import.meta.dirname, "..");
const script = resolve(packageRoot, "bin/review-cycle-exemplars.mjs");

function run(root, report) {
  return JSON.parse(execFileSync(process.execPath, [script, "--root", root, "--report", report], {encoding: "utf8", maxBuffer: 8 * 1024 * 1024}));
}

test("five-cycle review settles every real exemplar and replays idempotently", (context) => {
  const temporary = mkdtempSync(join(tmpdir(), "are-five-cycle-review-"));
  context.after(() => rmSync(temporary, {recursive: true, force: true}));
  const root = join(temporary, "runtime");
  const report = join(temporary, "review.json");
  const first = run(root, report);
  assert.equal(first.ok, true);
  assert.equal(first.value.cycle_results.length, 5);
  assert.deepEqual(first.value.cycle_results.map((result) => result.cycle_kind).sort(), ["benchmark-research", "controlled-upgrade", "engine-improvement", "interaction-learning", "research-learning"]);
  assert.equal(first.value.checks.all_cycles_completed, true);
  assert.equal(first.value.checks.sqlite_loss_recovery_verified, true);
  assert.match(first.report_artifact.sha256, /^[a-f0-9]{64}$/);
  const second = run(root, report);
  assert.equal(second.value.projection_sha256, first.value.projection_sha256);
  assert.equal(second.value.review_digest, first.value.review_digest);
  assert.deepEqual(JSON.parse(readFileSync(report, "utf8")), second.value);
});
